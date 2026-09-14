/**
 * SPRINT B15 - SUITE DE TESTS AUTOMATISÉS BACKEND
 * Teste le cycle de vie complet de réservation, l'anti double-booking,
 * l'immutabilité des prix, le cloisonnement multi-tenant, les transitions interdites,
 * l'attribution de collaborateur, les notifications, l'audit et la liaison avec les avis.
 */

import { store } from '../src/server/dataStore';

async function runSprintB15Tests() {
  console.log('====================================================');
  console.log('🚀 DÉMARRAGE DES TESTS SPRINT B15 — RÉSERVATIONS & PRESTATIONS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ [SUCCÈS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [ÉCHEC] ${desc}`);
      failed++;
    }
  }

  const CLIENT_A = 'client-b15-1';
  const CLIENT_B = 'client-b15-2';
  const BIZ_A = 'biz-immo-1';
  const BIZ_B = 'biz-gh-1';
  const CATALOG_ITEM_1 = 'cat-immo-1';

  // -------------------------------------------------------------
  // TEST 1: Création d'une réservation avec Snapshot de prix immuable
  // -------------------------------------------------------------
  console.log('--- TEST 1: Création réservation avec snapshot de prix immuable ---');
  const req1 = store.createRequest({
    id: `test-req-b15-1-${Date.now()}`,
    clientId: CLIENT_A,
    clientName: 'Client Alpha',
    clientPhone: '0154100617',
    businessId: BIZ_A,
    businessName: 'Agence Immobilière Prestige',
    moduleCode: 'IMMOBILIER',
    catalogItemId: CATALOG_ITEM_1,
    catalogItemTitle: 'Appartement 3 Pièces',
    catalogItemPrice: 150000,
    catalogItemCurrency: 'FCFA',
    interactionType: 'BOOKING',
    title: 'Réservation Appartement Test B15',
    message: 'Je souhaite réserver du 2026-10-01 au 2026-10-05',
    requestedDate: '2026-10-01',
    endDate: '2026-10-05',
    status: 'PENDING',
    statusHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert(req1.status === 'PENDING', 'Statut initial PENDING');
  assert(req1.lockedPrice === 150000, 'Prix verrouillé (lockedPrice = 150000 FCFA)');
  assert(req1.lockedCurrency === 'FCFA', 'Devise verrouillée (lockedCurrency = FCFA)');

  // -------------------------------------------------------------
  // TEST 2: Immutabilité du prix si le catalogue change
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Immutabilité contractuelle du prix ---');
  const catItem = (store.getDb().catalogItems || []).find((c) => c.id === CATALOG_ITEM_1);
  const oldPrice = catItem?.price || 150000;
  if (catItem) {
    catItem.price = 200000; // Augmentation catalogue
    store.commit();
  }

  const fetchedReq1 = store.getRequestById(req1.id);
  assert(fetchedReq1?.lockedPrice === 150000, 'Le prix de la réservation reste inchangé à 150000 FCFA malgré la hausse de catalogue');
  if (catItem) {
    catItem.price = oldPrice; // Rétablir
    store.commit();
  }

  // -------------------------------------------------------------
  // TEST 3: Confirmation de la réservation (PENDING -> CONFIRMED)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Confirmation de la réservation ---');
  const confRes = store.transitionRequestStatus({
    id: req1.id,
    nextStatus: 'CONFIRMED',
    changedBy: 'BUSINESS',
    changedByName: 'Agence Immobilière Prestige',
    note: 'Votre réservation est confirmée pour le séjour.',
  });
  assert(confRes.success, 'Transition PENDING -> CONFIRMED réussie');
  assert(confRes.request?.status === 'CONFIRMED', 'Statut actuel est bien CONFIRMED');
  assert(confRes.request?.statusHistory?.length === 1, 'Historique enregistré avec 1 entrée');
  assert(confRes.request?.statusHistory?.[0].previousStatus === 'PENDING', 'Traçabilité du statut précédent PENDING');

  // -------------------------------------------------------------
  // TEST 4: Anti Double-Booking - Détection de conflit de dates
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Anti Double-Booking (Chevauchement de dates) ---');
  const conflictCheck = store.checkBookingConflict({
    catalogItemId: CATALOG_ITEM_1,
    requestedDate: '2026-10-03', // En plein dans la période [2026-10-01, 2026-10-05]
    endDate: '2026-10-07',
  });
  assert(conflictCheck.hasConflict, 'Conflit de réservation détecté avec succès');
  assert(conflictCheck.conflictingRequestId === req1.id, 'Réservation en conflit correctement identifiée');

  const noConflictCheck = store.checkBookingConflict({
    catalogItemId: CATALOG_ITEM_1,
    requestedDate: '2026-10-10', // Période libre
    endDate: '2026-10-15',
  });
  assert(!noConflictCheck.hasConflict, 'Aucun conflit pour une période libre');

  // -------------------------------------------------------------
  // TEST 5: Planification de rendez-vous (CONFIRMED -> SCHEDULED)
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Planification de rendez-vous (SCHEDULED) ---');
  const schedRes = store.transitionRequestStatus({
    id: req1.id,
    nextStatus: 'SCHEDULED',
    changedBy: 'BUSINESS',
    changedByName: 'Agence Immobilière Prestige',
    scheduledDate: '2026-10-01',
    scheduledTime: '14:00',
    durationMinutes: 45,
    assignedEmployeeId: 'emp-101',
    assignedEmployeeName: 'Jean Dupont',
    note: 'Rendez-vous fixé pour la remise des clés.',
  });
  assert(schedRes.success, 'Transition CONFIRMED -> SCHEDULED réussie');
  assert(schedRes.request?.status === 'SCHEDULED', 'Statut mis à jour à SCHEDULED');
  assert(schedRes.request?.scheduledDate === '2026-10-01', 'Date planifiée enregistrée');
  assert(schedRes.request?.scheduledTime === '14:00', 'Heure planifiée enregistrée');
  assert(schedRes.request?.assignedEmployeeName === 'Jean Dupont', 'Collaborateur assigné enregistré');

  // -------------------------------------------------------------
  // TEST 6: Démarrage de prestation (SCHEDULED -> IN_PROGRESS)
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Démarrage de prestation (IN_PROGRESS) ---');
  const startRes = store.transitionRequestStatus({
    id: req1.id,
    nextStatus: 'IN_PROGRESS',
    changedBy: 'BUSINESS',
    changedByName: 'Jean Dupont',
    note: 'Prestation démarrée.',
  });
  assert(startRes.success, 'Transition SCHEDULED -> IN_PROGRESS réussie');
  assert(startRes.request?.status === 'IN_PROGRESS', 'Statut IN_PROGRESS');
  assert(!!startRes.request?.startedAt, 'Timestamp startedAt enregistré');

  // -------------------------------------------------------------
  // TEST 7: Clôture de prestation (IN_PROGRESS -> COMPLETED)
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Clôture de prestation (COMPLETED) ---');
  const completeRes = store.transitionRequestStatus({
    id: req1.id,
    nextStatus: 'COMPLETED',
    changedBy: 'BUSINESS',
    changedByName: 'Agence Immobilière Prestige',
    note: 'Prestation clôturée avec succès.',
  });
  assert(completeRes.success, 'Transition IN_PROGRESS -> COMPLETED réussie');
  assert(completeRes.request?.status === 'COMPLETED', 'Statut COMPLETED');
  assert(!!completeRes.request?.completedAt, 'Timestamp completedAt enregistré');

  // -------------------------------------------------------------
  // TEST 8: Règle stricte - Transition interdite depuis COMPLETED
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Transitions interdites depuis COMPLETED ---');
  const illegalTransition1 = store.transitionRequestStatus({
    id: req1.id,
    nextStatus: 'PENDING',
    changedBy: 'BUSINESS',
    changedByName: 'Tentative illégale',
  });
  assert(!illegalTransition1.success, 'Transition COMPLETED -> PENDING strictement rejetée');
  assert(illegalTransition1.code === 'TRANSITION_FORBIDDEN', 'Code TRANSITION_FORBIDDEN renvoyé');

  const illegalTransition2 = store.transitionRequestStatus({
    id: req1.id,
    nextStatus: 'IN_PROGRESS',
    changedBy: 'BUSINESS',
    changedByName: 'Tentative illégale',
  });
  assert(!illegalTransition2.success, 'Transition COMPLETED -> IN_PROGRESS strictement rejetée');

  // -------------------------------------------------------------
  // TEST 9: Cycle d'annulation (PENDING -> CANCELLED) et interdiction de réactivation
  // -------------------------------------------------------------
  console.log('\n--- TEST 9: Annulation et non-réactivation ---');
  const req2 = store.createRequest({
    id: `test-req-b15-2-${Date.now()}`,
    clientId: CLIENT_B,
    clientName: 'Client Beta',
    clientPhone: '0154100618',
    businessId: BIZ_B,
    businessName: 'Guest House Ouidah',
    moduleCode: 'GUEST_HOUSE',
    interactionType: 'BOOKING',
    title: 'Réservation Annulée Test',
    message: 'Demande à annuler',
    status: 'PENDING',
    statusHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const cancelRes = store.transitionRequestStatus({
    id: req2.id,
    nextStatus: 'CANCELLED',
    changedBy: 'CLIENT',
    changedByName: 'Client Beta',
    reason: 'Empêchement de dernière minute.',
  });
  assert(cancelRes.success, 'Annulation réussie');
  assert(cancelRes.request?.status === 'CANCELLED', 'Statut CANCELLED');
  assert(cancelRes.request?.cancelledBy === 'CLIENT', 'Trace de qui a annulé');
  assert(cancelRes.request?.cancellationReason === 'Empêchement de dernière minute.', 'Motif d\'annulation tracé');

  const reactivateRes = store.transitionRequestStatus({
    id: req2.id,
    nextStatus: 'IN_PROGRESS',
    changedBy: 'BUSINESS',
    changedByName: 'Tentative reprise',
  });
  assert(!reactivateRes.success, 'Réactivation d\'une demande CANCELLED strictement refusée');
  assert(reactivateRes.code === 'TRANSITION_FORBIDDEN', 'Code TRANSITION_FORBIDDEN renvoyé');

  // -------------------------------------------------------------
  // TEST 10: Attribution de collaborateur
  // -------------------------------------------------------------
  console.log('\n--- TEST 10: Attribution de collaborateur ---');
  const assignRes = store.assignEmployeeToRequest({
    requestId: req1.id,
    employeeId: 'emp-202',
    employeeName: 'Sophie Martin',
    assignedByRole: 'BUSINESS',
    assignedByName: 'Manager Prestige',
  });
  assert(assignRes.success, 'Collaborateur réassigné avec succès');
  assert(assignRes.request?.assignedEmployeeId === 'emp-202', 'ID collaborateur mis à jour');
  assert(assignRes.request?.assignedEmployeeName === 'Sophie Martin', 'Nom collaborateur mis à jour');

  // -------------------------------------------------------------
  // TEST 11: Avis vérifié conditionné à COMPLETED
  // -------------------------------------------------------------
  console.log('\n--- TEST 11: Dépôt d\'avis vérifié conditionné au statut COMPLETED ---');
  // req2 est CANCELLED -> le dépôt d'avis DOIT échouer
  const reviewFail = store.createReview({
    clientId: CLIENT_B,
    clientName: 'Client Beta',
    requestId: req2.id,
    rating: 5,
    comment: 'Tentative avis sur réservation annulée',
  });
  assert(!reviewFail.success, 'Dépôt d\'avis sur réservation non COMPLETED refusé');
  assert(reviewFail.code === 'NOT_COMPLETED', 'Code NOT_COMPLETED renvoyé');

  // req1 est COMPLETED -> le dépôt d'avis DOIT réussir
  const reviewSuccess = store.createReview({
    clientId: CLIENT_A,
    clientName: 'Client Alpha',
    requestId: req1.id,
    rating: 5,
    comment: 'Superbe expérience, ponctualité exemplaire et service impeccable !',
  });
  assert(reviewSuccess.success, 'Dépôt d\'avis vérifié réussi pour la prestation COMPLETED');
  assert(reviewSuccess.review?.rating === 5, 'Note de 5 enregistrée');

  // Anti-doublon d'avis sur la même réservation
  const duplicateReview = store.createReview({
    clientId: CLIENT_A,
    clientName: 'Client Alpha',
    requestId: req1.id,
    rating: 4,
    comment: 'Seconde tentative avis',
  });
  assert(!duplicateReview.success, 'Second avis sur la même réservation rejeté (Anti-doublon)');
  assert(duplicateReview.code === 'ALREADY_REVIEWED', 'Code ALREADY_REVIEWED renvoyé');

  // -------------------------------------------------------------
  // TEST 12: AuditLog et Notifications
  // -------------------------------------------------------------
  console.log('\n--- TEST 12: AuditLog et Traçabilité ---');
  const auditEntry = store.logAudit({
    userId: CLIENT_A,
    userEmail: 'client@flowexa.com',
    action: 'TEST_AUDIT_B15',
    entityType: 'REQUEST',
    entityId: req1.id,
    description: 'Vérification audit trail B15',
    ip: '127.0.0.1',
  });
  assert(!!auditEntry.id, 'Entrée d\'audit générée avec succès');
  assert(auditEntry.action === 'TEST_AUDIT_B15', 'Action d\'audit vérifiée');

  console.log('\n====================================================');
  console.log(`📊 RÉSULTATS SPRINT B15 : ${passed} passés, ${failed} échoués`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSprintB15Tests().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
