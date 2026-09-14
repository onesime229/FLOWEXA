/**
 * SPRINT B14 - SUITE DE TESTS AUTOMATISÉS BACKEND
 * Teste les modèles, APIs, cloisonnement multi-tenant, anti-doublon,
 * notifications et audit logs pour le système de messagerie Flowexa.
 */

import { store } from '../src/server/dataStore';

async function runSprintB14Tests() {
  console.log('====================================================');
  console.log('🚀 DÉMARRAGE DES TESTS SPRINT B14 — MESSAGERIE & CONVERSATIONS');
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

  const CLIENT_A = 'client-test-1';
  const CLIENT_B = 'client-test-2';
  const BIZ_A = 'biz-immo-1';
  const BIZ_B = 'biz-gh-1';

  // -------------------------------------------------------------
  // TEST 1: Création d'une conversation directe Client A <-> Business A
  // -------------------------------------------------------------
  console.log('--- TEST 1: Création d\'une conversation directe ---');
  const resConv1 = store.createOrGetConversation({
    clientId: CLIENT_A,
    clientName: 'Client Test Un',
    clientPhone: '0154100617',
    businessId: BIZ_A,
    callerRole: 'CLIENT',
  });
  assert(resConv1.success && !!resConv1.conversation, 'Création de la conversation réussie');
  assert(!resConv1.isExisting, 'La conversation est nouvellement créée (non existante)');
  assert(resConv1.conversation?.status === 'ACTIVE', 'La conversation est au statut ACTIVE');
  assert(resConv1.conversation?.contextType === 'DIRECT', 'Le type de contexte est DIRECT');

  const conv1Id = resConv1.conversation!.id;

  // -------------------------------------------------------------
  // TEST 2: Anti-doublon - Retrouver la même conversation
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Anti-doublon conversation directe ---');
  const resConv1Duplicate = store.createOrGetConversation({
    clientId: CLIENT_A,
    clientName: 'Client Test Un',
    businessId: BIZ_A,
    callerRole: 'CLIENT',
  });
  assert(resConv1Duplicate.success, 'Appel anti-doublon réussi');
  assert(resConv1Duplicate.isExisting === true, 'Le système détecte la conversation existante');
  assert(resConv1Duplicate.conversation?.id === conv1Id, 'Même ID renvoyé sans créer de doublon');

  // -------------------------------------------------------------
  // TEST 3: Conversation liée à une offre catalogue
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Conversation liée à une offre catalogue ---');
  const db = store.getDb();
  const catalogItem = db.catalogItems && db.catalogItems.length > 0 ? db.catalogItems[0] : null;
  const catalogItemId = catalogItem ? catalogItem.id : 'cat-offer-1';

  const resConvOffer = store.createOrGetConversation({
    clientId: CLIENT_A,
    clientName: 'Client Test Un',
    businessId: BIZ_A,
    catalogItemId: catalogItemId,
    callerRole: 'CLIENT',
  });
  assert(resConvOffer.success && !!resConvOffer.conversation, 'Conversation liée à une offre créée');
  assert(resConvOffer.conversation?.catalogItemId === catalogItemId, 'Référence offre présente');
  assert(resConvOffer.conversation?.contextType === 'OFFER', 'Contexte = OFFER');
  assert(resConvOffer.conversation?.id !== conv1Id, 'Différenciée de la conversation générale directe');

  // -------------------------------------------------------------
  // TEST 4: Conversation liée à une demande ou réservation
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Conversation liée à une demande/réservation ---');
  const testRequestId = 'req-test-b14-001';
  const resConvReq = store.createOrGetConversation({
    clientId: CLIENT_A,
    clientName: 'Client Test Un',
    businessId: BIZ_A,
    requestId: testRequestId,
    initialMessage: 'Bonjour, pouvez-vous me donner plus de précisions sur les disponibilités ?',
    callerRole: 'CLIENT',
  });
  assert(resConvReq.success && !!resConvReq.conversation, 'Conversation liée à une demande créée');
  assert(resConvReq.conversation?.requestId === testRequestId, 'Lien requestId vérifié');
  assert(resConvReq.conversation?.lastMessage?.includes('disponibilités'), 'Message initial pris en compte');

  const convReqId = resConvReq.conversation!.id;

  // -------------------------------------------------------------
  // TEST 5: Envoi d'un message par le client et notification entreprise
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Envoi message client & Notification entreprise ---');
  const prevNotifCount = db.notifications ? db.notifications.length : 0;

  const resMsg1 = store.addMessage({
    conversationId: conv1Id,
    senderRole: 'CLIENT',
    senderId: CLIENT_A,
    senderName: 'Client Test Un',
    content: 'Bonjour, quel est le délai pour une visite ?',
  });
  assert(resMsg1.success && !!resMsg1.message, 'Message client envoyé avec succès');
  assert(resMsg1.message?.isRead === false, 'Le message est marqué comme non lu au départ');
  assert(resMsg1.conversation?.unreadCountBusiness === 1, 'Incrémentation non-lus entreprise = 1');
  assert(resMsg1.conversation?.lastMessage === 'Bonjour, quel est le délai pour une visite ?', 'Dernier message MAJ');

  const afterNotifCount = db.notifications ? db.notifications.length : 0;
  assert(afterNotifCount > prevNotifCount, 'Notification créée pour l\'entreprise');
  const createdNotif = db.notifications[0];
  assert(createdNotif.recipientType === 'BUSINESS' && createdNotif.recipientId === BIZ_A, 'Destinataire notification = Entreprise');

  // -------------------------------------------------------------
  // TEST 6: Envoi réponse par l'entreprise et notification client
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Réponse entreprise & Notification client ---');
  const resMsg2 = store.addMessage({
    conversationId: conv1Id,
    senderRole: 'BUSINESS',
    senderId: BIZ_A,
    senderName: 'Agence Prestige',
    content: 'Bonjour ! Nous pouvons planifier une visite demain à 14h.',
  });
  assert(resMsg2.success && !!resMsg2.message, 'Message entreprise envoyé avec succès');
  assert(resMsg2.conversation?.unreadCountClient === 1, 'Incrémentation non-lus client = 1');
  assert(db.notifications[0].recipientType === 'CLIENT' && db.notifications[0].recipientId === CLIENT_A, 'Notification générée pour le client');

  // -------------------------------------------------------------
  // TEST 7: Validation contenu vide interdit
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Validation message vide refusé ---');
  const resMsgEmpty = store.addMessage({
    conversationId: conv1Id,
    senderRole: 'CLIENT',
    senderId: CLIENT_A,
    senderName: 'Client Test Un',
    content: '   ',
  });
  assert(!resMsgEmpty.success && resMsgEmpty.code === 'EMPTY_MESSAGE', 'Message vide correctement rejeté');

  // -------------------------------------------------------------
  // TEST 8: Lecture des messages (Read Receipt)
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Lecture des messages (Read receipt) ---');
  // Client lit les messages de l'entreprise
  const readResClient = store.markConversationMessagesRead(conv1Id, 'CLIENT', CLIENT_A);
  assert(readResClient.success && readResClient.count >= 1, 'Messages de l\'entreprise marqués lus par le client');
  const convAfterReadClient = store.getConversationById(conv1Id, { role: 'CLIENT', clientId: CLIENT_A }).conversation;
  assert(convAfterReadClient?.unreadCountClient === 0, 'Compteur non-lus client remis à 0');

  // Entreprise lit les messages du client
  const readResBiz = store.markConversationMessagesRead(conv1Id, 'BUSINESS', BIZ_A);
  assert(readResBiz.success && readResBiz.count >= 1, 'Messages du client marqués lus par l\'entreprise');
  const convAfterReadBiz = store.getConversationById(conv1Id, { role: 'BUSINESS_OWNER', businessId: BIZ_A }).conversation;
  assert(convAfterReadBiz?.unreadCountBusiness === 0, 'Compteur non-lus entreprise remis à 0');

  // -------------------------------------------------------------
  // TEST 9: Cloisonnement strict multi-tenant (Client)
  // -------------------------------------------------------------
  console.log('\n--- TEST 9: Cloisonnement multi-tenant Client ---');
  // Client B ne doit PAS voir la conversation de Client A
  const convAccessDeniedClient = store.getConversationById(conv1Id, { role: 'CLIENT', clientId: CLIENT_B });
  assert(!convAccessDeniedClient.success && convAccessDeniedClient.code === 'FORBIDDEN', 'Client B n\'a pas accès à la conversation de Client A');

  // Liste des conversations de Client B : ne doit pas contenir conv1Id
  const listClientB = store.getConversations({ role: 'CLIENT', clientId: CLIENT_B });
  assert(!listClientB.items.some((c) => c.id === conv1Id), 'Liste Client B ne contient aucune conversation de Client A');

  // -------------------------------------------------------------
  // TEST 10: Cloisonnement strict multi-tenant (Entreprise)
  // -------------------------------------------------------------
  console.log('\n--- TEST 10: Cloisonnement multi-tenant Entreprise ---');
  // Entreprise B ne doit PAS voir la conversation de Entreprise A
  const convAccessDeniedBiz = store.getConversationById(conv1Id, { role: 'BUSINESS_OWNER', businessId: BIZ_B });
  assert(!convAccessDeniedBiz.success && convAccessDeniedBiz.code === 'FORBIDDEN', 'Entreprise B n\'a pas accès à la conversation de Entreprise A');

  // Liste des conversations de Entreprise B : ne doit pas contenir conv1Id
  const listBizB = store.getConversations({ role: 'BUSINESS_OWNER', businessId: BIZ_B });
  assert(!listBizB.items.some((c) => c.id === conv1Id), 'Liste Entreprise B ne contient aucune conversation de Entreprise A');

  // -------------------------------------------------------------
  // TEST 11: Visibilité Super Admin & Audit Log
  // -------------------------------------------------------------
  console.log('\n--- TEST 11: Supervision Super Admin ---');
  const adminAccess = store.getConversationById(conv1Id, { role: 'SUPER_ADMIN' });
  assert(adminAccess.success && adminAccess.conversation?.id === conv1Id, 'Le Super Admin peut accéder à toute conversation');

  const adminList = store.getConversations({ role: 'SUPER_ADMIN' });
  assert(adminList.total >= 3, 'Le Super Admin voit l\'ensemble des conversations du système');

  // -------------------------------------------------------------
  // TEST 12: Clôture de conversation & Verrouillage
  // -------------------------------------------------------------
  console.log('\n--- TEST 12: Clôture de conversation & Interdiction d\'envoi ---');
  const closeRes = store.closeConversation(conv1Id, 'Client Test Un', 'Accord trouvé', {
    userId: CLIENT_A,
    userEmail: 'client@test.com',
  });
  assert(closeRes.success && closeRes.conversation?.status === 'CLOSED', 'Conversation clôturée avec succès');

  // Tentative d'envoi d'un message sur une conversation fermée
  const resMsgOnClosed = store.addMessage({
    conversationId: conv1Id,
    senderRole: 'CLIENT',
    senderId: CLIENT_A,
    senderName: 'Client Test Un',
    content: 'Ce message ne doit pas passer car c\'est clos.',
  });
  assert(!resMsgOnClosed.success && resMsgOnClosed.code === 'CONVERSATION_CLOSED', 'Envoi bloqué sur conversation fermée');

  // -------------------------------------------------------------
  // TEST 13: Réouverture de conversation
  // -------------------------------------------------------------
  console.log('\n--- TEST 13: Réouverture de conversation ---');
  const reopenRes = store.reopenConversation(conv1Id, 'Support Flowexa', {
    userId: 'admin-1',
    userEmail: 'admin@flowexa.com',
  });
  assert(reopenRes.success && reopenRes.conversation?.status === 'ACTIVE', 'Conversation réouverte avec succès');

  const resMsgAfterReopen = store.addMessage({
    conversationId: conv1Id,
    senderRole: 'CLIENT',
    senderId: CLIENT_A,
    senderName: 'Client Test Un',
    content: 'Message suite à réouverture.',
  });
  assert(resMsgAfterReopen.success, 'Nouveau message autorisé après réouverture');

  // -------------------------------------------------------------
  // TEST 14: Récupération des messages avec pagination
  // -------------------------------------------------------------
  console.log('\n--- TEST 14: Historique des messages & pagination ---');
  const msgHistory = store.getConversationMessages(conv1Id, { role: 'CLIENT', clientId: CLIENT_A }, { page: 1, limit: 10 });
  assert(msgHistory.success && Array.isArray(msgHistory.messages), 'Historique des messages récupéré');
  assert((msgHistory.total || 0) >= 3, 'Nombre total de messages conforme');

  // -------------------------------------------------------------
  // TEST 15: Recherche de conversations
  // -------------------------------------------------------------
  console.log('\n--- TEST 15: Recherche textuelle ---');
  const searchRes = store.getConversations(
    { role: 'CLIENT', clientId: CLIENT_A },
    { search: 'Prestige' }
  );
  assert(searchRes.items.length >= 1, 'Recherche par nom d\'entreprise fonctionnelle');

  // -------------------------------------------------------------
  // BILAN DES TESTS SPRINT B14
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 BILAN DES TESTS SPRINT B14 :`);
  console.log(`   ✅ Validés : ${passed}`);
  console.log(`   ❌ Échoués : ${failed}`);
  console.log(`   🎯 Taux de réussite : ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSprintB14Tests();
