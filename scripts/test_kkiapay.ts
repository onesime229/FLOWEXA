import { store } from '../src/server/dataStore';
import { getPaymentProvider } from '../src/server/paymentProviders';

async function runKkiapayTests() {
  console.log('=== DÉMARRAGE DES TESTS D’INTÉGRATION KKIAPAY (FLOWEXA) ===\n');
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

  // 1. Adapter Kkiapay instanciable et conforme à l'interface
  const kkiapayAdapter = getPaymentProvider('KKIAPAY');
  assert(kkiapayAdapter !== undefined, 'Test 1.1: getPaymentProvider("KKIAPAY") retourne bien l’adapter');
  assert(kkiapayAdapter.code === 'KKIAPAY', 'Test 1.2: Code provider est bien KKIAPAY');
  assert(kkiapayAdapter.name.includes('Kkiapay'), 'Test 1.3: Nom lisible inclut Kkiapay');

  // 2. Créer une réservation réelle en base pour tester le flux
  const db = store.getDb();
  const testBookingId = `req-kkiapay-${Date.now()}`;
  db.requests.unshift({
    id: testBookingId,
    clientId: 'client-kkiapay-test',
    clientName: 'Adébayo Sossou',
    clientPhone: '0197001122',
    businessId: 'biz-coif-1',
    businessName: 'Salon Élite Coiffure & Beauté',
    moduleCode: 'COIFFURE',
    catalogItemId: 'cat-item-coif-1',
    catalogItemTitle: 'Tresses Africaines Modernes',
    catalogItemPrice: 12000,
    catalogItemCurrency: 'FCFA',
    lockedPrice: 12000,
    lockedCurrency: 'FCFA',
    interactionType: 'BOOKING',
    title: 'Réservation Kkiapay Test',
    message: 'Test intégration Kkiapay Bénin',
    status: 'PENDING',
    statusHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  store.commit();

  // 3. Création du paiement Kkiapay côté Flowexa avec montant certifié backend
  const creationResult = store.createPayment({
    bookingId: testBookingId,
    clientId: 'client-kkiapay-test',
    clientName: 'Adébayo Sossou',
    clientPhone: '0197001122',
    provider: 'KKIAPAY',
    callerRole: 'CLIENT',
  });

  assert(creationResult.success === true, 'Test 2.1: Paiement Kkiapay créé avec succès');
  assert(creationResult.payment?.amount === 12000, 'Test 2.2: Montant strict déterminé par le backend (12 000 FCFA)');
  assert(creationResult.payment?.provider === 'KKIAPAY', 'Test 2.3: Passerelle est bien KKIAPAY');
  assert(creationResult.payment?.status === 'PROCESSING', 'Test 2.4: Statut initial est PROCESSING');

  const payment = creationResult.payment!;

  // 4. Initialisation de la session Kkiapay
  const initResult = await kkiapayAdapter.initiatePayment({
    paymentId: payment.id,
    reference: payment.reference,
    amount: payment.amount,
    currency: payment.currency,
    clientName: payment.clientName,
    clientPhone: payment.clientPhone,
  });

  assert(initResult.success === true, 'Test 3.1: Session Kkiapay initialisée avec succès');
  assert(initResult.status === 'PROCESSING', 'Test 3.2: Statut de session en PROCESSING');
  assert(typeof initResult.externalReference === 'string', 'Test 3.3: Référence externe Kkiapay générée');

  // 5. Test Webhook Kkiapay avec validation de secret
  const kkiapayTxId = `KKIA-TX-${Date.now()}`;
  const webhookPayload = {
    transactionId: kkiapayTxId,
    status: 'SUCCESS',
    amount: 12000,
    state: JSON.stringify({ reference: payment.reference, paymentId: payment.id }),
    client: { phone: '0197001122', name: 'Adébayo Sossou' },
  };

  const headersValid = { 'x-kkiapay-secret': 'flowexa_kkiapay_secret_default' };
  const isSigValid = kkiapayAdapter.verifyWebhookSignature(headersValid, JSON.stringify(webhookPayload));
  assert(isSigValid === true, 'Test 4.1: Vérification du secret webhook Kkiapay validée');

  const parsedWebhook = await kkiapayAdapter.handleWebhook(webhookPayload, headersValid);
  assert(parsedWebhook.success === true, 'Test 4.2: Décodage du webhook Kkiapay réussi');
  assert(parsedWebhook.reference === payment.reference, 'Test 4.3: Référence Flowexa retrouvée dans le state Kkiapay');
  assert(parsedWebhook.status === 'SUCCESS', 'Test 4.4: Statut SUCCESS extrait correctement');
  assert(parsedWebhook.amount === 12000, 'Test 4.5: Montant 12000 FCFA vérifié');

  // 6. Transition du paiement suite à la notification Kkiapay
  const transition = store.transitionPaymentStatus({
    paymentId: payment.id,
    nextStatus: 'SUCCESS',
    externalReference: kkiapayTxId,
    source: 'WEBHOOK',
    actorName: 'Kkiapay Webhook Processor',
  });

  assert(transition.success === true, 'Test 5.1: Transition du paiement Kkiapay vers SUCCESS validée');
  assert(transition.payment?.status === 'SUCCESS', 'Test 5.2: Statut paiement mis à jour en SUCCESS');
  assert(transition.payment?.paidAt !== undefined, 'Test 5.3: Horodatage paidAt renseigné');

  // 7. Vérification de la synchronisation de la réservation
  const updatedReq = (store.getDb().requests || []).find((r) => r.id === testBookingId);
  assert(updatedReq?.paymentStatus === 'PAID', 'Test 6.1: Réservation passée en paymentStatus: PAID');
  assert(updatedReq?.paidAmount === 12000, 'Test 6.2: Montant payé (paidAmount) consigné sur la réservation');
  assert(updatedReq?.status === 'CONFIRMED', 'Test 6.3: Réservation confirmée automatiquement suite au paiement');

  // 8. Vérification de l'AuditLog
  const auditLogs = store.getDb().auditLogs || [];
  const kkiapayLog = auditLogs.find((l) => l.entityId === payment.id && l.action === 'PAYMENT_SUCCESS');
  assert(kkiapayLog !== undefined, 'Test 7.1: Entrée AuditLog enregistrée pour PAYMENT_SUCCESS Kkiapay');

  console.log(`\n=== RÉSULTAT DES TESTS KKIAPAY : ${testsPassed} PASSÉS, ${testsFailed} ÉCHECS ===`);
  if (testsFailed > 0) {
    process.exit(1);
  }
}

runKkiapayTests().catch((e) => {
  console.error('Erreur fatale dans les tests Kkiapay:', e);
  process.exit(1);
});
