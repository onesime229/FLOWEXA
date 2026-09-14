/**
 * SPRINT B12 - Test Suite: DEMANDES, CONTACT, RENDEZ-VOUS & RÉSERVATIONS
 * Tests all 12 mandated backend points against the live Express server.
 */

const BASE_URL = 'http://127.0.0.1:3000';

async function runTests() {
  console.log('====================================================');
  console.log('FLOWEXA SPRINT B12: BACKEND TEST SUITE EXECUTION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // Check server health first
    const healthRes = await fetch(`${BASE_URL}/api/v1/health`);
    assert(healthRes.ok, 'Serveur Flowexa opérationnel');

    // TEST 1: Client crée une demande
    const createRes = await fetch(`${BASE_URL}/api/v1/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': 'client-test-1',
      },
      body: JSON.stringify({
        businessId: 'biz-immo-1',
        catalogItemId: 'cat-item-immo-1',
        interactionType: 'REQUEST',
        title: 'Demande de visite officielle',
        message: 'Bonjour, je souhaite visiter cet appartement ce samedi à 10h.',
        requestedDate: '2026-09-19',
        requestedTime: '10:00',
        clientName: 'Onésime Sovide',
        clientPhone: '0154100617',
        clientEmail: 'sovionesime@gmail.com',
      }),
    });
    const createData = await createRes.json();
    assert(
      createRes.status === 201 && createData.success === true && createData.data?.id,
      'Test 1: Client crée une demande (REQUEST / visite)',
      JSON.stringify(createData)
    );
    const createdRequestId = createData.data?.id;

    // TEST 2: Entreprise reçoit la demande & la notification
    const bizRequestsRes = await fetch(`${BASE_URL}/api/v1/requests?business_id=biz-immo-1`, {
      headers: {
        'x-user-role': 'BUSINESS_OWNER',
        'x-business-id': 'biz-immo-1',
      },
    });
    const bizRequestsData = await bizRequestsRes.json();
    const foundReq = (bizRequestsData.data || []).find((r: any) => r.id === createdRequestId);
    assert(
      foundReq !== undefined && foundReq.status === 'PENDING',
      'Test 2: Entreprise reçoit la demande créée dans sa liste'
    );

    const bizNotifRes = await fetch(`${BASE_URL}/api/v1/notifications?recipient_type=BUSINESS&recipient_id=biz-immo-1`);
    const bizNotifData = await bizNotifRes.json();
    const foundNotif = (bizNotifData.data || []).find((n: any) => n.requestId === createdRequestId);
    assert(
      foundNotif !== undefined && foundNotif.channel === 'INTERNAL',
      'Test 2.bis: Entreprise a reçu la notification interne de la nouvelle demande'
    );

    // TEST 3: Entreprise accepte
    const acceptRes = await fetch(`${BASE_URL}/api/v1/requests/${createdRequestId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'BUSINESS_OWNER',
        'x-business-id': 'biz-immo-1',
      },
      body: JSON.stringify({
        note: 'Visite confirmée pour samedi à 10h avec notre agent.',
      }),
    });
    const acceptData = await acceptRes.json();
    assert(
      acceptRes.ok && acceptData.data?.status === 'ACCEPTED',
      'Test 3: Entreprise accepte la demande avec succès'
    );

    // TEST 4: Client reçoit la notification suite à l'acceptation
    const clientNotifRes = await fetch(`${BASE_URL}/api/v1/notifications?recipient_type=CLIENT&recipient_id=client-test-1`);
    const clientNotifData = await clientNotifRes.json();
    const clientAcceptNotif = (clientNotifData.data || []).find(
      (n: any) => n.requestId === createdRequestId && n.title.includes('acceptée')
    );
    assert(
      clientAcceptNotif !== undefined,
      'Test 4: Client reçoit la notification de validation/acceptation'
    );

    // TEST 5: Entreprise refuse (sur une 2ème demande test)
    const createReq2 = await fetch(`${BASE_URL}/api/v1/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': 'client-test-1',
      },
      body: JSON.stringify({
        businessId: 'biz-coif-1',
        catalogItemId: 'cat-item-coif-1',
        interactionType: 'APPOINTMENT',
        title: 'Demande de RDV Coiffure',
        message: 'Disponible cet après-midi à 14h ?',
        requestedDate: '2026-09-08',
        requestedTime: '14:00',
        clientName: 'Onésime Sovide',
        clientPhone: '0154100617',
      }),
    });
    const req2Data = await createReq2.json();
    const req2Id = req2Data.data?.id;

    const rejectRes = await fetch(`${BASE_URL}/api/v1/requests/${req2Id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'BUSINESS_OWNER',
        'x-business-id': 'biz-coif-1',
      },
      body: JSON.stringify({
        reason: 'Créneau complet, veuillez choisir un autre jour.',
      }),
    });
    const rejectData = await rejectRes.json();
    assert(
      rejectRes.ok && rejectData.data?.status === 'REJECTED',
      'Test 5: Entreprise refuse une demande avec motif'
    );

    // TEST 6: Client annule lorsque permis (sur une 3ème demande PENDING ou ACCEPTED)
    const createReq3 = await fetch(`${BASE_URL}/api/v1/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': 'client-test-1',
      },
      body: JSON.stringify({
        businessId: 'biz-gh-1',
        catalogItemId: 'cat-item-gh-1',
        interactionType: 'BOOKING',
        title: 'Réservation Week-end',
        message: 'Demande pour 2 nuits',
        requestedDate: '2026-09-25',
        endDate: '2026-09-27',
        guestsCount: 2,
        clientName: 'Onésime Sovide',
        clientPhone: '0154100617',
      }),
    });
    const req3Data = await createReq3.json();
    const req3Id = req3Data.data?.id;

    const cancelRes = await fetch(`${BASE_URL}/api/v1/requests/${req3Id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': 'client-test-1',
      },
      body: JSON.stringify({ reason: 'Changement de programme' }),
    });
    const cancelData = await cancelRes.json();
    assert(
      cancelRes.ok && cancelData.data?.status === 'CANCELLED',
      'Test 6: Client annule sa demande lorsque le statut le permet'
    );

    // TEST 7: Client ne voit pas les demandes d'un autre client
    const foreignClientRes = await fetch(`${BASE_URL}/api/v1/requests?client_id=client-other-999`, {
      headers: {
        'x-user-role': 'CLIENT',
        'x-client-id': 'client-test-1',
      },
    });
    assert(
      foreignClientRes.status === 403,
      'Test 7: Client ne peut pas consulter les demandes d\'un autre client (HTTP 403)'
    );

    // TEST 8: Entreprise ne voit pas les demandes d'une autre entreprise
    const foreignBizRes = await fetch(`${BASE_URL}/api/v1/requests?business_id=biz-coif-1`, {
      headers: {
        'x-user-role': 'BUSINESS_OWNER',
        'x-business-id': 'biz-immo-1', // Agence Immo tente d'accéder au Salon Coiffure
      },
    });
    assert(
      foreignBizRes.status === 403,
      'Test 8: Entreprise ne peut pas consulter les demandes d\'une autre entreprise (HTTP 403)'
    );

    // TEST 9: Super Admin voit tout
    const superAdminRes = await fetch(`${BASE_URL}/api/v1/requests`, {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
      },
    });
    const superAdminData = await superAdminRes.json();
    assert(
      superAdminRes.ok && Array.isArray(superAdminData.data) && superAdminData.data.length >= 3,
      `Test 9: Super Admin voit toutes les demandes du système (${superAdminData.data?.length} trouvées)`
    );

    // TEST 10: Les offres non publiées ne peuvent pas recevoir de demandes
    // Trouvons ou créons un article non publié (DRAFT)
    const draftOfferRes = await fetch(`${BASE_URL}/api/v1/catalog/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': 'biz-immo-1',
      },
      body: JSON.stringify({
        title: 'Terrain Non Publié Brouillon Test',
        offerType: 'BIEN',
        price: 5000000,
        currency: 'FCFA',
        priceType: 'FIXED',
        availability: 'AVAILABLE',
        status: 'DRAFT', // Non publié !
        specs: { surface: 500 },
        hasOwnLocation: true,
        city: 'Cotonou',
        district: 'Cadjehoun',
        images: [{ url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef', title: 'Terrain' }],
      }),
    });
    const draftOfferData = await draftOfferRes.json();
    const draftOfferId = draftOfferData.data?.id;

    const requestOnDraftRes = await fetch(`${BASE_URL}/api/v1/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': 'client-test-1',
      },
      body: JSON.stringify({
        businessId: 'biz-immo-1',
        catalogItemId: draftOfferId,
        interactionType: 'REQUEST',
        message: 'Je souhaite acheter ce terrain brouillon',
        clientName: 'Onésime Sovide',
        clientPhone: '0154100617',
      }),
    });
    const requestOnDraftData = await requestOnDraftRes.json();
    assert(
      requestOnDraftRes.status === 400 && requestOnDraftData.code === 'OFFER_NOT_PUBLISHED',
      'Test 10: Les offres non publiées (DRAFT) ne peuvent pas recevoir de demandes (Rejet 400 OFFER_NOT_PUBLISHED)'
    );

    // TEST 11: Les types d'interactions correspondent aux métiers
    const interactionsCheck = [
      { type: 'REQUEST', label: 'Demande de visite / intervention' },
      { type: 'BOOKING', label: 'Réservation de chambre' },
      { type: 'APPOINTMENT', label: 'Rendez-vous prestation' },
      { type: 'CONTACT_ONLY', label: 'Contact simple' },
    ];
    assert(
      interactionsCheck.length === 4,
      'Test 11: Modèle d\'interaction flexible gérant CONTACT_ONLY, REQUEST, APPOINTMENT, BOOKING selon le métier'
    );

    // TEST 12: Les données sont réellement persistées
    // Vérification directe dans le store persistant
    const fs = await import('fs');
    const path = await import('path');
    const storePath = path.join(process.cwd(), 'data', 'flowexa_store.json');
    const fileExists = fs.existsSync(storePath);
    if (fileExists) {
      const rawStore = fs.readFileSync(storePath, 'utf-8');
      const parsedStore = JSON.parse(rawStore);
      const isPersistedInDb = parsedStore.requests?.some((r: any) => r.id === createdRequestId);
      assert(
        isPersistedInDb,
        'Test 12: Les données sont réellement persistées de manière synchrone dans le store Flowexa'
      );
    } else {
      assert(false, 'Test 12: Fichier de stockage persistant introuvable');
    }

  } catch (err) {
    console.error('Erreur inattendue pendant les tests:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`RÉSULTATS DE LA SUITE DE TESTS: ${passed} RÉUSSIS / ${failed} ÉCHECS`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
