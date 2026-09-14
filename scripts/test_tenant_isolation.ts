/**
 * FLOWEXA - TEST SUITE : ISOLATION MULTI-TENANT STRICTE & VÉRIFICATION DES FAILLES
 * 
 * Ce script vérifie de façon exhaustive que :
 * 1. Toute route métier lit businessId UNIQUEMENT depuis le JWT signé et vérifié
 * 2. Le header x-business-id ou ?business_id= est STRICTEMENT ignoré pour les rôles PRO (BUSINESS_OWNER, MANAGER, EMPLOYEE)
 * 3. Une entreprise (Owner B) ne peut JAMAIS accéder aux données d'une autre entreprise (Owner A) même en envoyant x-business-id
 * 4. Les clients n'accèdent qu'à leurs propres données (filtrées par auth.userId)
 * 5. Seul le SUPER_ADMIN peut effectuer un override explicite
 * 6. Les routes sans contexte d'authentification valide renvoient 403 (aucun fallback biz-immo-1 ou biz-gh-1)
 */

import { AuthService } from '../src/server/auth/AuthService.js';

const BASE_URL = 'http://127.0.0.1:3000';

// 1. Génération des jetons JWT valides pour différents tenants
const tokenOwnerA = AuthService.generateJwt({
  id: 'usr-owner-a',
  fullName: 'Gérant Entreprise Alpha',
  phone: '0100000001',
  email: 'owner-a@alpha.bj',
  role: 'BUSINESS_OWNER',
  businessId: 'biz-test-alpha',
  tenantId: 'biz-test-alpha',
  status: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as any);

const tokenOwnerB = AuthService.generateJwt({
  id: 'usr-owner-b',
  fullName: 'Gérant Entreprise Beta',
  phone: '0100000002',
  email: 'owner-b@beta.bj',
  role: 'BUSINESS_OWNER',
  businessId: 'biz-test-beta',
  tenantId: 'biz-test-beta',
  status: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as any);

const tokenClient1 = AuthService.generateJwt({
  id: 'usr-client-1',
  fullName: 'Client Numéro Un',
  phone: '0100000003',
  email: 'client1@test.bj',
  role: 'CLIENT',
  status: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as any);

const tokenSuperAdmin = AuthService.generateJwt({
  id: 'usr-superadmin',
  fullName: 'Super Administrateur',
  phone: '0100000099',
  email: 'admin@flowexa.com',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as any);

interface IsolationCheck {
  name: string;
  url: string;
  method?: string;
  headers: Record<string, string>;
  body?: any;
  expectedStatus: number;
  validateBody?: (body: any) => boolean;
  description: string;
}

const tests: IsolationCheck[] = [
  // --- TEST SÉCURITÉ 1 : Tentative d'usurpation via x-business-id ---
  {
    name: 'ATTAQUE HEADER : Owner B tente de voir les demandes de Alpha avec x-business-id',
    url: '/api/v1/requests',
    headers: {
      'Authorization': `Bearer ${tokenOwnerB}`,
      'x-business-id': 'biz-test-alpha', // TENTATIVE D'USURPATION
    },
    expectedStatus: 200,
    validateBody: (res) => {
      // Les données retournées ne doivent contenir QUE du biz-test-beta, JAMAIS biz-test-alpha !
      if (!Array.isArray(res.data)) return false;
      const leakedData = res.data.some((item: any) => item.businessId === 'biz-test-alpha');
      return !leakedData;
    },
    description: 'Le serveur doit complètement ignorer x-business-id et filtrer sur biz-test-beta (JWT).',
  },

  // --- TEST SÉCURITÉ 2 : Tentative d'usurpation via ?business_id= en query ---
  {
    name: 'ATTAQUE QUERY : Owner B tente de voir les réservations de Alpha avec ?business_id=',
    url: '/api/v1/bookings?business_id=biz-test-alpha',
    headers: {
      'Authorization': `Bearer ${tokenOwnerB}`,
    },
    expectedStatus: 403,
    description: 'Une tentative d’accès à un autre businessId que celui du JWT doit être bloquée avec 403.',
  },

  // --- TEST SÉCURITÉ 3 : CRM & Clients cloisonnés ---
  {
    name: 'CRM : Owner B tente de lister les clients de Alpha via route tenant',
    url: '/api/v1/businesses/biz-test-alpha/crm/clients',
    headers: {
      'Authorization': `Bearer ${tokenOwnerB}`,
    },
    expectedStatus: 403,
    description: 'L’accès aux clients d’une autre entreprise doit être strictement refusé avec 403.',
  },

  // --- TEST SÉCURITÉ 4 : Messages & Conversations cloisonnées ---
  {
    name: 'MESSAGES : Owner B tente de lister les conversations avec x-business-id de Alpha',
    url: '/api/v1/conversations',
    headers: {
      'Authorization': `Bearer ${tokenOwnerB}`,
      'x-business-id': 'biz-test-alpha',
    },
    expectedStatus: 200,
    validateBody: (res) => {
      if (!Array.isArray(res.data)) return false;
      const leaked = res.data.some((c: any) => c.businessId === 'biz-test-alpha');
      return !leaked;
    },
    description: 'Les conversations sont isolées selon le businessId du JWT, x-business-id est ignoré.',
  },

  // --- TEST SÉCURITÉ 5 : Notifications de l’entreprise ---
  {
    name: 'NOTIFICATIONS : Owner B tente de voir les notifications de Alpha',
    url: '/api/v1/notifications?business_id=biz-test-alpha',
    headers: {
      'Authorization': `Bearer ${tokenOwnerB}`,
    },
    expectedStatus: 200,
    validateBody: (res) => {
      if (!Array.isArray(res.data)) return false;
      const leaked = res.data.some((n: any) => n.businessId === 'biz-test-alpha');
      return !leaked;
    },
    description: 'Les notifications sont filtrées sur le JWT de l’utilisateur connecté.',
  },

  // --- TEST SÉCURITÉ 6 : Facturation et abonnements isolés ---
  {
    name: 'FACTURATION : Owner B tente d’accéder à l’abonnement de Alpha',
    url: '/api/v1/billing/subscription?businessId=biz-test-alpha',
    headers: {
      'Authorization': `Bearer ${tokenOwnerB}`,
    },
    expectedStatus: 200,
    validateBody: (res) => {
      // Doit renvoyer les informations de Beta (ou null si pas encore souscrit), mais jamais Alpha
      if (res.data && res.data.businessId === 'biz-test-alpha') return false;
      return true;
    },
    description: 'Un propriétaire ne peut pas consulter la facturation d’un autre tenant.',
  },

  // --- TEST SÉCURITÉ 7 : Suppression des fallbacks arbitraires (biz-immo-1) ---
  {
    name: 'FALLBACK CHECK : Appel anonyme sans JWT sur /api/v1/requests',
    url: '/api/v1/requests',
    headers: {},
    expectedStatus: 403,
    description: 'Sans token, le serveur renvoie 403 et non les données d’une entreprise par défaut.',
  },
  {
    name: 'FALLBACK CHECK : Appel anonyme sur /api/v1/bookings',
    url: '/api/v1/bookings',
    headers: {},
    expectedStatus: 403,
    description: 'Sans token, les réservations renvoient 403 et aucun fallback.',
  },
  {
    name: 'FALLBACK CHECK : Appel anonyme sur /api/v1/analytics/business',
    url: '/api/v1/analytics/business',
    headers: {},
    expectedStatus: 403,
    description: 'Les statistiques métier renvoient 403 sans authentification.',
  },

  // --- TEST SÉCURITÉ 8 : Isolation côté client ---
  {
    name: 'CLIENT : Un client ne peut pas accéder aux demandes d’autres utilisateurs',
    url: '/api/v1/requests',
    headers: {
      'Authorization': `Bearer ${tokenClient1}`,
    },
    expectedStatus: 200,
    validateBody: (res) => {
      if (!Array.isArray(res.data)) return false;
      const otherClient = res.data.some((d: any) => d.clientId && d.clientId !== 'usr-client-1');
      return !otherClient;
    },
    description: 'Les requêtes du client sont strictement filtrées sur son userId JWT.',
  },

  // --- TEST SÉCURITÉ 9 : Super Admin override légitime avec journalisation ---
  {
    name: 'SUPER ADMIN : Override légitime pour inspecter Alpha',
    url: '/api/v1/requests?business_id=biz-test-alpha',
    headers: {
      'Authorization': `Bearer ${tokenSuperAdmin}`,
    },
    expectedStatus: 200,
    description: 'Le Super Admin est le seul habilité à auditer un tenant spécifique par paramètre.',
  },
];

async function runTests() {
  console.log('===============================================================');
  console.log('🔒 FLOWEXA - VÉRIFICATION SÉCURITÉ & ISOLATION MULTI-TENANT');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`[TEST] ${test.name}... `);
    try {
      const resp = await fetch(`${BASE_URL}${test.url}`, {
        method: test.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...test.headers,
        },
        body: test.body ? JSON.stringify(test.body) : undefined,
      });

      const isStatusOk = resp.status === test.expectedStatus;
      let isBodyOk = true;

      if (isStatusOk && test.validateBody) {
        try {
          const json = await resp.json();
          isBodyOk = test.validateBody(json);
        } catch {
          isBodyOk = false;
        }
      }

      if (isStatusOk && isBodyOk) {
        console.log(`✅ SUCCÈS (Status ${resp.status})`);
        passed++;
      } else {
        console.log(`❌ ÉCHEC (Attendu ${test.expectedStatus}, reçu ${resp.status}, bodyCheck=${isBodyOk})`);
        console.log(`       -> ${test.description}`);
        failed++;
      }
    } catch (err: any) {
      console.log(`❌ ERREUR RÉSEAU: ${err.message}`);
      failed++;
    }
  }

  console.log('\n===============================================================');
  console.log(`Résultats : ${passed} passés, ${failed} échoués sur ${tests.length} tests.`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests();
