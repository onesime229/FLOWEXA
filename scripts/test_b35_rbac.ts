/**
 * FLOWEXA - SPRINT B35 + F35 : ROLE-BASED ACCESS CONTROL (RBAC) & MULTI-TENANT VERIFICATION
 * 
 * Ce script valide le cloisonnement absolu des espaces :
 * 1. CLIENT ne peut pas accéder aux API Admin ni aux finances d'entreprise
 * 2. EMPLOYEE a accès à ses tâches et plannings mais pas aux finances ni à l'administration
 * 3. MANAGER a accès aux opérations de son entreprise mais pas aux autres entreprises ni à l'admin
 * 4. BUSINESS_OWNER a accès à son entreprise et ses finances, pas aux autres entreprises ni à l'admin
 * 5. SUPER_ADMIN a accès à la supervision globale
 * 6. VISITEUR non connecté est restreint à la découverte publique
 */

import { AuthService } from '../src/server/auth/AuthService.js';

const BASE_URL = 'http://127.0.0.1:3000';

const clientToken = AuthService.generateJwt({
  id: 'client-test-1',
  fullName: 'Client Test',
  phone: '0154100617',
  email: 'client@flowexa.com',
  role: 'CLIENT',
  status: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as any);

const employeeToken = AuthService.generateJwt({
  id: 'emp-1',
  fullName: 'Employé Test',
  phone: '0100000010',
  email: 'emp1@flowexa.com',
  role: 'EMPLOYEE',
  businessId: 'biz-immo-1',
  tenantId: 'biz-immo-1',
  status: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as any);

const managerToken = AuthService.generateJwt({
  id: 'manager-1',
  fullName: 'Manager Test',
  phone: '0100000011',
  email: 'manager1@flowexa.com',
  role: 'MANAGER',
  businessId: 'biz-immo-1',
  tenantId: 'biz-immo-1',
  status: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as any);

const ownerToken = AuthService.generateJwt({
  id: 'owner-1',
  fullName: 'Owner Test',
  phone: '0100000012',
  email: 'owner1@flowexa.com',
  role: 'BUSINESS_OWNER',
  businessId: 'biz-immo-1',
  tenantId: 'biz-immo-1',
  status: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as any);

const adminToken = AuthService.generateJwt({
  id: 'admin-root',
  fullName: 'Super Admin',
  phone: '0100000099',
  email: 'admin@flowexa.com',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as any);

interface TestCase {
  name: string;
  endpoint: string;
  method?: string;
  headers: Record<string, string>;
  expectedStatus: number;
  description: string;
}

const testCases: TestCase[] = [
  // --- 1. RÔLE CLIENT (Isolation & Sécurité) ---
  {
    name: 'CLIENT - Blocage accès Admin Stats',
    endpoint: '/api/v1/admin/stats',
    headers: { Authorization: `Bearer ${clientToken}` },
    expectedStatus: 403,
    description: 'Un client ne doit jamais accéder aux statistiques d’administration globale',
  },
  {
    name: 'CLIENT - Blocage accès Admin Entreprises',
    endpoint: '/api/v1/admin/businesses',
    headers: { Authorization: `Bearer ${clientToken}` },
    expectedStatus: 403,
    description: 'Un client ne doit pas pouvoir lister les entreprises via la console admin',
  },
  {
    name: 'CLIENT - Blocage accès Finances Entreprise',
    endpoint: '/api/v1/businesses/biz-immo-1/finances',
    headers: { Authorization: `Bearer ${clientToken}` },
    expectedStatus: 403,
    description: 'Un client ne doit pas avoir accès aux chiffres d’affaires et recettes',
  },
  {
    name: 'CLIENT - Accès légitime à la recherche publique',
    endpoint: '/api/v1/search?q=villa',
    headers: { Authorization: `Bearer ${clientToken}` },
    expectedStatus: 200,
    description: 'Un client doit pouvoir rechercher des offres sur le portail',
  },

  // --- 2. RÔLE EMPLOYEE (Opérations limitées) ---
  {
    name: 'EMPLOYEE - Blocage accès Admin',
    endpoint: '/api/v1/admin/stats',
    headers: { Authorization: `Bearer ${employeeToken}` },
    expectedStatus: 403,
    description: 'Un employé ne doit pas accéder à la console Super Admin',
  },
  {
    name: 'EMPLOYEE - Blocage finances entreprise',
    endpoint: '/api/v1/businesses/biz-immo-1/finances',
    headers: { Authorization: `Bearer ${employeeToken}` },
    expectedStatus: 403,
    description: 'Un employé ne doit pas consulter les finances sensibles de l’entreprise',
  },
  {
    name: 'EMPLOYEE - Accès légitime aux tâches de son établissement',
    endpoint: '/api/v1/businesses/biz-immo-1/tasks',
    headers: { Authorization: `Bearer ${employeeToken}` },
    expectedStatus: 200,
    description: 'Un employé doit pouvoir consulter et mettre à jour ses tâches de travail',
  },

  // --- 3. RÔLE MANAGER (Opérations complètes mais pas super admin) ---
  {
    name: 'MANAGER - Blocage accès Admin',
    endpoint: '/api/v1/admin/stats',
    headers: { Authorization: `Bearer ${managerToken}` },
    expectedStatus: 403,
    description: 'Un manager ne doit pas accéder à la console Super Admin',
  },
  {
    name: 'MANAGER - Accès aux tâches de son établissement',
    endpoint: '/api/v1/businesses/biz-immo-1/tasks',
    headers: { Authorization: `Bearer ${managerToken}` },
    expectedStatus: 200,
    description: 'Un manager supervise les opérations de son établissement',
  },
  {
    name: 'MANAGER - Blocage accès cross-tenant (autre entreprise)',
    endpoint: '/api/v1/businesses/biz-other-999/tasks',
    headers: { Authorization: `Bearer ${managerToken}` },
    expectedStatus: 403,
    description: 'Un manager ne peut pas voir ou modifier les données d’une entreprise tierce',
  },

  // --- 4. RÔLE BUSINESS_OWNER (Gestionnaire établissement) ---
  {
    name: 'BUSINESS_OWNER - Blocage accès Super Admin',
    endpoint: '/api/v1/admin/stats',
    headers: { Authorization: `Bearer ${ownerToken}` },
    expectedStatus: 403,
    description: 'Un gérant ne doit pas accéder à la console Super Admin de la plateforme',
  },
  {
    name: 'BUSINESS_OWNER - Accès aux finances de son entreprise',
    endpoint: '/api/v1/businesses/biz-immo-1/finances',
    headers: { Authorization: `Bearer ${ownerToken}` },
    expectedStatus: 200,
    description: 'Le propriétaire consulte les recettes et transactions de son établissement',
  },
  {
    name: 'BUSINESS_OWNER - Isolation multi-tenant (autre entreprise)',
    endpoint: '/api/v1/businesses/biz-other-999/finances',
    headers: { Authorization: `Bearer ${ownerToken}` },
    expectedStatus: 403,
    description: 'Un propriétaire est strictement cloisonné dans son entreprise',
  },

  // --- 5. RÔLE SUPER_ADMIN (Gouvernance plateforme) ---
  {
    name: 'SUPER_ADMIN - Accès autorisé Stats Administrateur',
    endpoint: '/api/v1/admin/stats',
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 200,
    description: 'Le Super Admin accède au tableau de bord global de la plateforme',
  },
  {
    name: 'SUPER_ADMIN - Accès autorisé Entreprises plateforme',
    endpoint: '/api/v1/admin/businesses',
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 200,
    description: 'Le Super Admin supervise les entreprises enregistrées',
  },
  {
    name: 'SUPER_ADMIN - Accès autorisé Journaux d’audit',
    endpoint: '/api/v1/admin/audit-logs',
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 200,
    description: 'Le Super Admin audite la sécurité et la conformité',
  },

  // --- 6. VISITEUR NON-CONNECTÉ (Public) ---
  {
    name: 'GUEST - Blocage absolu console Admin',
    endpoint: '/api/v1/admin/stats',
    headers: {},
    expectedStatus: 403,
    description: 'Un visiteur non identifié est rejeté en 403 Forbidden',
  },
  {
    name: 'GUEST - Accès recherche publique',
    endpoint: '/api/v1/search?q=cotonou',
    headers: {},
    expectedStatus: 200,
    description: 'Un visiteur peut rechercher des services et prestations',
  },
];

async function runRbacTests() {
  console.log('\n======================================================');
  console.log('🚀 FLOWEXA - AUDIT B35 : ROLE-BASED ACCESS CONTROL (RBAC)');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const res = await fetch(`${BASE_URL}${tc.endpoint}`, {
        method: tc.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...tc.headers,
        },
      });

      const isOk = res.status === tc.expectedStatus;
      if (isOk) {
        console.log(`✅ [${i + 1}/${testCases.length}] PASS: ${tc.name} (HTTP ${res.status})`);
        passed++;
      } else {
        console.error(
          `❌ [${i + 1}/${testCases.length}] FAIL: ${tc.name} - Attendu HTTP ${tc.expectedStatus}, reçu ${res.status}`
        );
        console.error(`   Détail : ${tc.description}`);
        failed++;
      }
    } catch (err) {
      console.error(`💥 [${i + 1}/${testCases.length}] ERROR: ${tc.name}`, err);
      failed++;
    }
  }

  console.log('\n======================================================');
  console.log(`📊 RÉSULTAT DU SPRINT B35 RBAC :`);
  console.log(`   Succès : ${passed} / ${testCases.length} (${Math.round((passed / testCases.length) * 100)}%)`);
  console.log(`   Échecs : ${failed}`);
  console.log('======================================================\n');

  if (failed === 0) {
    console.log('🎉 CERTIFICATION B35 VALIDÉE : Cloisonnement strict des rôles opérationnel à 100% !');
    process.exit(0);
  } else {
    console.error('⚠️ CERTAINS CONTRÔLES ONT ÉCHOUÉ.');
    process.exit(1);
  }
}

runRbacTests();
