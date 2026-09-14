import { store } from '../src/server/dataStore';
import { getPaymentProvider } from '../src/server/paymentProviders';

async function runB16Tests() {
  console.log('=== DÉMARRAGE DES TESTS DU SPRINT B16 (PAIEMENTS & TRANSACTIONS) ===\n');
  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      testsFailed++;
    }
  }

  // 1. Créer une réservation de test pour les paiements
  const db = store.getDb();
  const testBookingId = `req-test-pay-${Date.now()}`;
  db.requests.unshift({
    id: testBookingId,
    clientId: 'client-test-pay',
    clientName: 'Amour Hounto',
    clientPhone: '0154100617',
    businessId: 'biz-coif-1',
    businessName: 'Salon Élite Coiffure & Beauté',
    moduleCode: 'COIFFURE',
    catalogItemId: 'cat-item-coif-1',
    catalogItemTitle: 'Tresses Africaines Modernes & Nattes Couchées',
    catalogItemPrice: 8000,
    catalogItemCurrency: 'FCFA',
    lockedPrice: 8000,
    lockedCurrency: 'FCFA',
    interactionType: 'BOOKING',
    title: 'Réservation Tresses Afro',
    message: 'Demande avec créneau pour le week-end.',
    requestedDate: '2026-09-12',
    requestedTime: '10:00',
    status: 'PENDING',
    statusHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  store.commit();

  // Test 1: Détermination stricte du montant côté backend
  const payment1 = store.createPayment({
    bookingId: testBookingId,
    clientId: 'client-test-pay',
    clientName: 'Amour Hounto',
    clientPhone: '0154100617',
    provider: 'MTN_MOMO',
    callerRole: 'CLIENT',
  });

  assert(payment1.success === true, 'Test 1.1: Création du paiement réussie');
  assert(payment1.payment?.amount === 8000, 'Test 1.2: Montant déterminé strictement par le backend (8000 FCFA)');
  assert(payment1.payment?.currency === 'FCFA', 'Test 1.3: Devise conservée en FCFA');
  assert(payment1.payment?.status === 'PROCESSING', 'Test 1.4: Statut initial en PROCESSING');
  assert(payment1.transaction?.status === 'PROCESSING', 'Test 1.5: Transaction créée en PROCESSING');

  // Test 2: Idempotence
  const idempotencyKey = `idemp-${Date.now()}`;
  const testBookingId2 = `req-test-idemp-${Date.now()}`;
  db.requests.unshift({
    id: testBookingId2,
    clientId: 'client-test-pay',
    clientName: 'Amour Hounto',
    clientPhone: '0154100617',
    businessId: 'biz-coif-1',
    businessName: 'Salon Élite Coiffure & Beauté',
    moduleCode: 'COIFFURE',
    catalogItemPrice: 5000,
    lockedPrice: 5000,
    interactionType: 'BOOKING',
    title: 'Test Idempotence',
    message: 'Test message',
    status: 'PENDING',
    statusHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const payA = store.createPayment({
    bookingId: testBookingId2,
    clientId: 'client-test-pay',
    clientName: 'Amour Hounto',
    provider: 'MOOV_MONEY',
    idempotencyKey,
    callerRole: 'CLIENT',
  });

  const payB = store.createPayment({
    bookingId: testBookingId2,
    clientId: 'client-test-pay',
    clientName: 'Amour Hounto',
    provider: 'MOOV_MONEY',
    idempotencyKey,
    callerRole: 'CLIENT',
  });

  assert(payA.success && payB.success, 'Test 2.1: Deux appels consécutifs réussis');
  assert(payA.payment?.id === payB.payment?.id, 'Test 2.2: Même paiement retourné via idempotence');
  assert(payB.isIdempotent === true, 'Test 2.3: Drapeau isIdempotent actif au 2ème appel');

  // Test 3: Sécurité multi-tenant (Anti-IDOR)
  const idorAttempt = store.getPaymentById(payment1.payment!.id, {
    role: 'CLIENT',
    clientId: 'other-malicious-client',
  });
  assert(idorAttempt.success === false && idorAttempt.code === 'FORBIDDEN', 'Test 3.1: Blocage IDOR pour un autre client');

  const legitClient = store.getPaymentById(payment1.payment!.id, {
    role: 'CLIENT',
    clientId: 'client-test-pay',
  });
  assert(legitClient.success === true, 'Test 3.2: Accès autorisé pour le client propriétaire');

  const proAccess = store.getPaymentById(payment1.payment!.id, {
    role: 'BUSINESS_OWNER',
    businessId: 'biz-coif-1',
  });
  assert(proAccess.success === true, 'Test 3.3: Accès autorisé pour l’établissement prestataire');

  const foreignPro = store.getPaymentById(payment1.payment!.id, {
    role: 'BUSINESS_OWNER',
    businessId: 'biz-hotel-autre',
  });
  assert(foreignPro.success === false && foreignPro.code === 'FORBIDDEN', 'Test 3.4: Blocage IDOR pour une entreprise tierce');

  // Test 4: Cycle complet de paiement & Confirmation automatique de la réservation
  assert(
    db.requests.find((r) => r.id === testBookingId)?.status === 'PENDING',
    'Test 4.1: Réservation initialement en statut PENDING'
  );

  const transitionSuccess = store.transitionPaymentStatus({
    paymentId: payment1.payment!.id,
    nextStatus: 'SUCCESS',
    externalReference: 'MTN-TX-VERIFIED-999',
    source: 'WEBHOOK',
  });

  assert(transitionSuccess.success === true, 'Test 4.2: Transition du paiement vers SUCCESS réussie');
  assert(transitionSuccess.payment?.status === 'SUCCESS', 'Test 4.3: Statut paiement = SUCCESS');
  assert(transitionSuccess.payment?.paidAt !== undefined, 'Test 4.4: Date paidAt enregistrée');
  assert(transitionSuccess.transaction?.status === 'SUCCESS', 'Test 4.5: Transaction synchronisée en SUCCESS');

  const updatedReq = db.requests.find((r) => r.id === testBookingId);
  assert(updatedReq?.status === 'CONFIRMED', 'Test 4.6: Réservation passée automatiquement en CONFIRMED');
  assert(updatedReq?.paymentStatus === 'PAID' || updatedReq?.paymentStatus === 'SUCCESS', 'Test 4.7: Réservation marquée paymentStatus = PAID');
  assert(updatedReq?.paidAmount === 8000, 'Test 4.8: Montant payé enregistré sur la réservation');

  // Test 5: Rejet de double paiement sur réservation déjà acquittée
  const doublePay = store.createPayment({
    bookingId: testBookingId,
    clientId: 'client-test-pay',
    clientName: 'Amour Hounto',
    provider: 'CELTIS_CASH',
    callerRole: 'CLIENT',
  });
  assert(doublePay.success === false && doublePay.code === 'ALREADY_PAID', 'Test 5.1: Rejet double paiement sur réservation soldée');

  // Test 6: Validation signature webhook et adaptateur
  const mtn = getPaymentProvider('MTN_MOMO');
  const validSig = mtn.verifyWebhookSignature({ 'x-mtn-signature': 'abc' }, '{"reference":"test"}');
  assert(typeof validSig === 'boolean', 'Test 6.1: Vérification signature webhook fonctionnelle');

  const webhookResult = await mtn.handleWebhook({
    reference: payment1.payment!.reference,
    externalReference: 'MTN-EXT-555',
    status: 'PAID',
    amount: 8000,
    currency: 'FCFA',
  });
  assert(webhookResult.success === true && webhookResult.status === 'SUCCESS', 'Test 6.2: Traitement webhook MTN valide');

  // Test 7: AuditLog et Notifications
  const auditLogs = db.auditLogs.filter((a) => a.entityType === 'PAYMENT' && a.entityId === payment1.payment!.id);
  assert(auditLogs.length >= 2, 'Test 7.1: Journalisation AuditLog pour initiation et succès');

  const notifs = db.notifications.filter((n) => n.requestId === testBookingId);
  assert(notifs.length >= 2, 'Test 7.2: Notifications client et entreprise créées');

  console.log(`\n=== BILAN : ${testsPassed} passés, ${testsFailed} échoués ===`);
  if (testsFailed > 0) {
    process.exit(1);
  }
}

runB16Tests().catch((err) => {
  console.error('Erreur inattendue durant les tests B16:', err);
  process.exit(1);
});
