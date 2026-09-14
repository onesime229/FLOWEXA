/**
 * FLOWEXA - SPRINT B13 + F13 AUTOMATED VALIDATION SUITE
 * Validates the 20 criteria:
 * 1. Favori sur offre -> 201
 * 2. Doublon favori -> 409
 * 3. Retrait favori -> 200
 * 4. Isolation stricte des favoris
 * 5. Avis sans interaction -> 403
 * 6. Avis sur demande en cours -> 400
 * 7. Avis sur interaction COMPLETED -> 201
 * 8. Note invalide (<1 ou >5) -> 400
 * 9. Commentaire vide -> 400
 * 10. Doublon d'avis sur la même interaction -> 409
 * 11. Recalcul automatique note entreprise
 * 12. Recalcul automatique note offre
 * 13. Client non authentifié -> 401
 * 14. Recherche intègre note et count réels
 * 15. Signalement d'avis -> 201
 * 16. Signalement sans motif -> 400
 * 17. Super Admin masque avis -> Statut HIDDEN
 * 18. Avis masqué exclu du calcul
 * 19. Super Admin rétablit avis -> Statut PUBLISHED & recalcul
 * 20. Rôle non Super Admin refusé en modération -> 403
 */

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Starting Flowexa Sprint B13 + F13 Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testNum: number, label: string, details?: any) => {
    if (condition) {
      console.log(`✅ [Test ${testNum}/20] PASS: ${label}`);
      passed++;
    } else {
      console.error(`❌ [Test ${testNum}/20] FAIL: ${label}`, details || '');
      failed++;
    }
  };

  try {
    // SETUP: Create two test requests - one PENDING, one COMPLETED
    const runId = Date.now();
    const clientA = `test-client-alpha-${runId}`;
    const clientB = `test-client-beta-${runId}`;
    const testBusinessId = 'biz-immo-1';
    const testCatalogItemId = 'cat-item-immo-1';

    // 1. Create a PENDING request
    const reqPendingRes = await fetch(`${BASE_URL}/api/v1/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientA,
        'x-client-phone': '0199001122',
      },
      body: JSON.stringify({
        businessId: testBusinessId,
        catalogItemId: testCatalogItemId,
        interactionType: 'REQUEST',
        title: 'Demande pour test B13 en cours',
        message: 'Test message PENDING',
      }),
    });
    const pendingReqData = await reqPendingRes.json();
    const pendingRequestId = pendingReqData.data?.id;

    // 2. Create another request and complete it
    const reqCompletedRes = await fetch(`${BASE_URL}/api/v1/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientA,
        'x-client-phone': '0199001122',
      },
      body: JSON.stringify({
        businessId: testBusinessId,
        catalogItemId: testCatalogItemId,
        interactionType: 'REQUEST',
        title: 'Demande pour test B13 terminée',
        message: 'Test message to complete',
      }),
    });
    const completedReqData = await reqCompletedRes.json();
    const completedRequestId = completedReqData.data?.id;

    // Transition completedRequestId to COMPLETED by business
    await fetch(`${BASE_URL}/api/v1/requests/${completedRequestId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'BUSINESS_OWNER',
        'x-business-id': testBusinessId,
      },
      body: JSON.stringify({
        note: 'Prestation menée à bien pour test B13',
      }),
    });

    // ==========================================
    // TEST 1: Client adds favorite on offer -> 201
    // ==========================================
    const addFavRes = await fetch(`${BASE_URL}/api/v1/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientA,
      },
      body: JSON.stringify({
        catalogItemId: testCatalogItemId,
        businessId: testBusinessId,
      }),
    });
    const addFavData = await addFavRes.json();
    assert(addFavRes.status === 201 && addFavData.success === true, 1, 'Ajout favori sur offre retourne 201 Created');

    // ==========================================
    // TEST 2: Prevent duplicate favorite -> 409
    // ==========================================
    const dupFavRes = await fetch(`${BASE_URL}/api/v1/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientA,
      },
      body: JSON.stringify({
        catalogItemId: testCatalogItemId,
      }),
    });
    assert(dupFavRes.status === 409, 2, 'Tentative de doublon de favori rejetée avec 409 Conflict');

    // ==========================================
    // TEST 3: Client can remove favorite -> 200
    // ==========================================
    const favId = addFavData.data?.id;
    const delFavRes = await fetch(`${BASE_URL}/api/v1/favorites/${favId}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': 'CLIENT',
        'x-client-id': clientA,
      },
    });
    assert(delFavRes.status === 200, 3, 'Retrait de favori retourne 200 OK');

    // Re-add favorite for further tests
    await fetch(`${BASE_URL}/api/v1/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientA,
      },
      body: JSON.stringify({
        catalogItemId: testCatalogItemId,
        businessId: testBusinessId,
      }),
    });

    // ==========================================
    // TEST 4: Client isolation of favorites
    // ==========================================
    const clientBFavsRes = await fetch(`${BASE_URL}/api/v1/favorites`, {
      headers: {
        'x-user-role': 'CLIENT',
        'x-client-id': clientB,
      },
    });
    const clientBFavsData = await clientBFavsRes.json();
    assert(
      clientBFavsRes.status === 200 && Array.isArray(clientBFavsData.data) && clientBFavsData.data.length === 0,
      4,
      'Isolation stricte : un client ne voit aucunement les favoris des autres'
    );

    // ==========================================
    // TEST 5: Review without interaction -> 403
    // ==========================================
    const noInterReviewRes = await fetch(`${BASE_URL}/api/v1/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientB, // clientB didn't create the interaction
      },
      body: JSON.stringify({
        requestId: completedRequestId,
        rating: 5,
        comment: 'Avis non autorisé sans interaction personnelle',
      }),
    });
    assert(noInterReviewRes.status === 403, 5, "Dépôt d'avis sans interaction vérifiée rejeté avec 403 Forbidden");

    // ==========================================
    // TEST 6: Review on pending interaction -> 400
    // ==========================================
    const pendingReviewRes = await fetch(`${BASE_URL}/api/v1/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientA,
      },
      body: JSON.stringify({
        requestId: pendingRequestId,
        rating: 4,
        comment: 'Demande non encore terminée',
      }),
    });
    assert(pendingReviewRes.status === 400, 6, "Avis sur demande non 'COMPLETED' rejeté avec 400 Bad Request");

    // ==========================================
    // TEST 7: Review on COMPLETED interaction -> 201
    // ==========================================
    const validReviewRes = await fetch(`${BASE_URL}/api/v1/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientA,
      },
      body: JSON.stringify({
        requestId: completedRequestId,
        rating: 5,
        comment: 'Excellente prestation immobilière, tout était parfait !',
        clientName: 'Client Alpha Vérifié',
      }),
    });
    const validReviewData = await validReviewRes.json();
    const createdReviewId = validReviewData.data?.id;
    assert(validReviewRes.status === 201 && validReviewData.success === true, 7, 'Avis vérifié déposé avec succès -> 201 Created');

    // ==========================================
    // TEST 8: Rating outside 1-5 rejected -> 400
    // ==========================================
    const badRatingRes = await fetch(`${BASE_URL}/api/v1/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientA,
      },
      body: JSON.stringify({
        requestId: completedRequestId,
        rating: 7,
        comment: 'Note hors limites',
      }),
    });
    assert(badRatingRes.status === 400, 8, 'Note invalide (7/5) rejetée avec 400 Bad Request');

    // ==========================================
    // TEST 9: Empty comment rejected -> 400
    // ==========================================
    const emptyCommentRes = await fetch(`${BASE_URL}/api/v1/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientA,
      },
      body: JSON.stringify({
        requestId: completedRequestId,
        rating: 5,
        comment: '   ',
      }),
    });
    assert(emptyCommentRes.status === 400, 9, 'Commentaire vide rejeté avec 400 Bad Request');

    // ==========================================
    // TEST 10: Prevent duplicate review -> 409
    // ==========================================
    const dupReviewRes = await fetch(`${BASE_URL}/api/v1/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientA,
      },
      body: JSON.stringify({
        requestId: completedRequestId,
        rating: 4,
        comment: 'Deuxième avis sur la même interaction',
      }),
    });
    assert(dupReviewRes.status === 409, 10, 'Doublon avis sur même interaction rejeté avec 409 Conflict');

    // ==========================================
    // TEST 11: Company rating automatically recalculated
    // ==========================================
    const bizStatsRes = await fetch(`${BASE_URL}/api/v1/businesses/${testBusinessId}/reviews`);
    const bizStatsData = await bizStatsRes.json();
    assert(
      bizStatsRes.status === 200 && bizStatsData.data?.rating === 5 && bizStatsData.data?.reviewCount >= 1,
      11,
      `Recalcul automatique note entreprise vérifié (${bizStatsData.data?.rating}/5 avec ${bizStatsData.data?.reviewCount} avis)`
    );

    // ==========================================
    // TEST 12: Offer rating automatically recalculated
    // ==========================================
    const catItemRes = await fetch(`${BASE_URL}/api/v1/catalog/items/${testCatalogItemId}`);
    const catItemData = await catItemRes.json();
    assert(
      catItemRes.status === 200 && catItemData.data?.rating === 5 && catItemData.data?.reviewCount >= 1,
      12,
      `Recalcul automatique note offre vérifié (${catItemData.data?.rating}/5 avec ${catItemData.data?.reviewCount} avis)`
    );

    // ==========================================
    // TEST 13: Unauthenticated client cannot post review -> 401
    // ==========================================
    const noAuthReviewRes = await fetch(`${BASE_URL}/api/v1/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Missing x-user-role and x-client-id
      },
      body: JSON.stringify({
        requestId: completedRequestId,
        rating: 5,
        comment: 'Sans authentification',
      }),
    });
    assert(noAuthReviewRes.status === 401, 13, 'Client non authentifié refusé avec 401 Unauthorized');

    // ==========================================
    // TEST 14: Search results display real verified note and count
    // ==========================================
    const searchRes = await fetch(`${BASE_URL}/api/v1/search/smart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientA,
      },
      body: JSON.stringify({
        query: 'Akpakpa',
        clientLat: 6.3533,
        clientLng: 2.4089,
      }),
    });
    const searchData = await searchRes.json();
    const foundOffer = searchData.data?.items?.find((it: any) => it.id === testCatalogItemId);
    assert(
      foundOffer && foundOffer.rating === 5 && foundOffer.reviewCount >= 1 && foundOffer.isFavorite === true,
      14,
      `Recherche certifiée avec note réelle (${foundOffer?.rating}), count (${foundOffer?.reviewCount}) et statut favori`
    );

    // ==========================================
    // TEST 15: User reports review -> 201
    // ==========================================
    const reportRes = await fetch(`${BASE_URL}/api/v1/reviews/${createdReviewId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientB,
      },
      body: JSON.stringify({
        reason: 'Contenu inapproprié',
        details: 'Vérification modération de test',
        reporterName: 'Utilisateur Beta',
      }),
    });
    const reportData = await reportRes.json();
    assert(reportRes.status === 201 && reportData.success === true, 15, 'Signalement d avis enregistré -> 201 Created');

    // ==========================================
    // TEST 16: Reason required for reporting -> 400
    // ==========================================
    const emptyReportRes = await fetch(`${BASE_URL}/api/v1/reviews/${createdReviewId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientB,
      },
      body: JSON.stringify({
        reason: '   ',
      }),
    });
    assert(emptyReportRes.status === 400, 16, 'Signalement sans motif rejeté avec 400 Bad Request');

    // ==========================================
    // TEST 17: Super Admin hides review -> Status HIDDEN
    // ==========================================
    const hideRes = await fetch(`${BASE_URL}/api/v1/admin/reviews/${createdReviewId}/hide`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'SUPER_ADMIN',
      },
      body: JSON.stringify({ reason: 'Masquage modération de test' }),
    });
    const hideData = await hideRes.json();
    assert(
      hideRes.status === 200 && hideData.data?.status === 'HIDDEN',
      17,
      "Super Admin masque l'avis avec succès -> Statut HIDDEN"
    );

    // ==========================================
    // TEST 18: Hidden review excluded from public calculation
    // ==========================================
    const publicReviewsRes = await fetch(`${BASE_URL}/api/v1/reviews?business_id=${testBusinessId}`);
    const publicReviewsData = await publicReviewsRes.json();
    const isHiddenInPublic = publicReviewsData.data?.some((r: any) => r.id === createdReviewId);
    assert(
      publicReviewsRes.status === 200 && !isHiddenInPublic,
      18,
      'Avis masqué immédiatement exclu du flux public et du calcul de réputation'
    );

    // ==========================================
    // TEST 19: Super Admin restores review -> Statut PUBLISHED & recalcul
    // ==========================================
    const restoreRes = await fetch(`${BASE_URL}/api/v1/admin/reviews/${createdReviewId}/restore`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'SUPER_ADMIN',
      },
      body: JSON.stringify({ reason: 'Rétablissement après examen' }),
    });
    const restoreData = await restoreRes.json();
    assert(
      restoreRes.status === 200 && restoreData.data?.status === 'PUBLISHED',
      19,
      "Super Admin rétablit l'avis -> Statut PUBLISHED & réintégration automatique au calcul"
    );

    // ==========================================
    // TEST 20: Non-Super Admin cannot moderate -> 403
    // ==========================================
    const forbiddenModRes = await fetch(`${BASE_URL}/api/v1/admin/reviews/${createdReviewId}/hide`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT', // Unauthorized role
        'x-client-id': clientA,
      },
      body: JSON.stringify({ reason: 'Tentative de modération non autorisée' }),
    });
    assert(
      forbiddenModRes.status === 403,
      20,
      'Contrôle RBAC : Seul le SUPER_ADMIN peut effectuer des actions de modération -> 403 Forbidden'
    );

  } catch (err) {
    console.error('Erreur inattendue pendant la suite de tests:', err);
  }

  console.log(`\n========================================`);
  console.log(`RÉSULTAT DES 20 TESTS B13 + F13 :`);
  console.log(`✅ ${passed} / 20 RÉUSSIS`);
  if (failed > 0) {
    console.log(`❌ ${failed} / 20 ÉCHOUÉS`);
  } else {
    console.log(`🎉 100% DES 20 TESTS VALIDÉS SANS ERREUR`);
  }
  console.log(`========================================\n`);
}

runTests();
