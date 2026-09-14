import React, { useState } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  Layers,
  CreditCard,
  Banknote,
  UserCheck,
  Target,
  Activity,
  BarChart3,
  Sparkles,
  LifeBuoy,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Download,
  Plus,
  RefreshCw,
  Star,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Card } from '../design-system/Card';
import { Badge } from '../design-system/Badge';
import { SuperAdminTab, TenantEnterprise, AdminUserItem } from '../../types';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { AdminCategoriesManagement } from './AdminCategoriesManagement';
import { AdminPlatformSettings } from './AdminPlatformSettings';
import { AdminRequestsSupervision } from './AdminRequestsSupervision';
import { AdminReviewsModeration } from './AdminReviewsModeration';
import { AdminConversationsManagement } from './AdminConversationsManagement';
import { AdminIntegrationsManagement } from './AdminIntegrationsManagement';
import { AdminPaymentsManagement } from './AdminPaymentsManagement';
import { SuperAdminAnalyticsView } from './SuperAdminAnalyticsView';
import { AdminAutomationsManagement } from './AdminAutomationsManagement';
import { AdminAIAssistant } from './AdminAIAssistant';
import { AdminMonetizationManagement } from './AdminMonetizationManagement';
import { AdminCommunicationsManagement } from './AdminCommunicationsManagement';
import { AdminSecurityCenter } from './AdminSecurityCenter';
import { MessageSquare, Zap, Sliders, Radio } from 'lucide-react';
import {
  MOCK_TENANTS,
  MOCK_ADMIN_USERS,
  MOCK_SUBSCRIPTIONS,
  MOCK_PLATFORM_PAYMENTS,
  MOCK_SYSTEM_ACTIVITIES,
  FLOWEXA_MODULES,
  MOCK_CRM_CONTACTS,
} from '../../data/mockData';
import { flowexaApi } from '../../services/api';

export const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('dashboard');
  const [searchFilter, setSearchFilter] = useState('');
  const [tenantStatusFilter, setTenantStatusFilter] = useState<string>('ALL');
  const [tenantsList, setTenantsList] = useState<TenantEnterprise[]>(MOCK_TENANTS);
  const [auditLogsList, setAuditLogsList] = useState<any[]>(MOCK_SYSTEM_ACTIVITIES);

  const [adminUsersList, setAdminUsersList] = useState<any[]>([
    {
      id: 'usr_admin_1',
      fullName: 'Gilles Ahouansou',
      email: 'admin@flowexa.com',
      phone: '+229 01 54 10 06 17',
      role: 'SUPER_ADMIN',
      tenantName: 'Plateforme Flowexa Bénin',
      twoFactorEnabled: true,
      status: 'ACTIVE',
      verificationStatus: 'VERIFIE',
      lastLogin: 'Il y a 5 min',
    },
    {
      id: 'usr_pro_1',
      fullName: 'Marc Kojo',
      email: 'pro@flowexa.com',
      phone: '+229 01 54 10 06 17',
      role: 'BUSINESS_OWNER',
      tenantName: 'Agence Prestige Immo Bénin',
      twoFactorEnabled: true,
      status: 'ACTIVE',
      verificationStatus: 'VERIFIE',
      lastLogin: 'Il y a 12 min',
    },
    {
      id: 'usr_mgr_1',
      fullName: 'Christian Koudjo',
      email: 'christian.koudjo@prestige-immo.bj',
      phone: '+229 01 97 45 12 30',
      role: 'MANAGER',
      tenantName: 'Agence Prestige Immo Bénin',
      twoFactorEnabled: false,
      status: 'ACTIVE',
      verificationStatus: 'VERIFIE',
      lastLogin: 'Hier à 16:30',
    },
    {
      id: 'usr_emp_1',
      fullName: 'Blandine Alapini',
      email: 'blandine.alapini@prestige-immo.bj',
      phone: '+229 01 96 22 33 44',
      role: 'EMPLOYEE',
      tenantName: 'Agence Prestige Immo Bénin',
      twoFactorEnabled: false,
      status: 'ACTIVE',
      verificationStatus: 'VERIFIE',
      lastLogin: 'Aujourd’hui à 08:45',
    },
    {
      id: 'usr_client_1',
      fullName: 'Bio Guerguis',
      email: 'client@flowexa.bj',
      phone: '+229 01 54 10 06 17',
      role: 'CLIENT',
      tenantName: 'Compte Particulier',
      twoFactorEnabled: false,
      status: 'ACTIVE',
      verificationStatus: 'VERIFIE',
      lastLogin: 'Il y a 1 heure',
    },
  ]);

  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

  // Fetch admin users from API
  const fetchAdminUsers = () => {
    const token = localStorage.getItem('flowexa_token');
    fetch('/api/admin/users', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.users) && data.users.length > 0) {
          const mapped = data.users.map((u: any) => ({
            id: u.id,
            fullName: u.name,
            email: u.email,
            phone: u.phone || '+229 01 00 00 00',
            role: u.role,
            tenantName: u.businessName || u.tenantName || 'Compte Flowexa',
            twoFactorEnabled: !!u.twoFactorEnabled,
            status: u.status || 'ACTIVE',
            verificationStatus: u.verificationStatus || 'VERIFIE',
            lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Aujourd’hui',
          }));
          setAdminUsersList(mapped);
        }
      })
      .catch(() => {});
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await flowexaApi.adminUpdateUserStatus(userId, nextStatus, 'Action console Super Admin');
    } catch {
      try {
        const token = localStorage.getItem('flowexa_token');
        await fetch(`/api/admin/users/${userId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: nextStatus }),
        });
      } catch {}
    }

    setAdminUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
    );
  };

  // Fetch real businesses and audit logs from API on mount
  React.useEffect(() => {
    fetchAdminUsers();
    flowexaApi
      .getAdminBusinesses()
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: TenantEnterprise[] = res.data.map((b) => ({
            id: b.id,
            name: b.name,
            category: b.module_code || 'IMMOBILIER',
            moduleCode: (b.module_code || 'IMMOBILIER') as any,
            city: b.city || 'Cotonou',
            phone: b.phone || '',
            ownerName: b.manager_name || 'Gérant Prestataire',
            status: b.status === 'ACTIVE' || b.status === 'PUBLISHED' ? 'Actif' : b.status === 'PENDING' ? 'En attente KYC' : 'Suspendu',
            subscriptionPlan: 'Pro',
            monthlyRevenue: 45000,
            joinedDate: b.created_at?.split('T')?.[0] || '2026-09-01',
          }));
          setTenantsList(mapped);
        }
      })
      .catch((err) => console.error('Erreur chargement entreprises admin:', err));

    flowexaApi
      .getAdminAuditLogs()
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((log: any) => ({
            id: log.id,
            timestamp: log.created_at ? new Date(log.created_at).toLocaleString('fr-FR') : (log.timestamp || 'Récemment'),
            actor: log.user_email || log.user_id || 'SUPER_ADMIN',
            action: log.action,
            entity: log.target_type ? `${log.target_type} #${log.target_id || ''}` : (log.entity || 'Plateforme'),
            ipAddress: log.ip_address || '127.0.0.1 (Bénin)',
            status: 'SUCCESS',
          }));
          setAuditLogsList(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Quick stats
  const totalMRR = 4850000;
  const totalGMV = 142800000;
  const totalTenantsCount = tenantsList.length;
  const activeTenantsCount = tenantsList.filter((t) => t.status === 'Actif').length;

  const handleToggleTenantStatus = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === 'Actif') {
        const res = await flowexaApi.adminSuspendBusiness(id, 'Suspension par Super Admin');
        if (res.success) {
          setTenantsList((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: 'Suspendu' } : t))
          );
          return;
        }
      } else {
        const res = await flowexaApi.adminActivateBusiness(id);
        if (res.success) {
          setTenantsList((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: 'Actif' } : t))
          );
          return;
        }
      }

      const res = await flowexaApi.toggleBusinessStatus(id);
      if (res.success && res.data) {
        const nextStatus = res.data.status === 'ACTIVE' ? 'Actif' : 'Suspendu';
        setTenantsList((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
        );
      }
    } catch (err) {
      setTenantsList((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            const nextStatus = t.status === 'Actif' ? 'Suspendu' : 'Actif';
            return { ...t, status: nextStatus };
          }
          return t;
        })
      );
    }
  };

  const tabs: { id: SuperAdminTab; label: string; icon: any; count?: number | string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, count: 'Synthèse' },
    { id: 'entreprises', label: 'Entreprises', icon: Building2, count: totalTenantsCount },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: Users, count: adminUsersList.length },
    { id: 'categories', label: 'Catégories', icon: Layers, count: '10' },
    { id: 'demandes', label: 'Demandes & Réservations', icon: Target, count: 'Supervision' },
    { id: 'settings', label: 'Paramètres Plateforme', icon: Sliders, count: 'Config' },
    { id: 'modules', label: 'Modules', icon: Layers, count: FLOWEXA_MODULES.length },
    { id: 'abonnements', label: 'Abonnements', icon: CreditCard, count: '4.85M F' },
    { id: 'paiements', label: 'Paiements', icon: Banknote, count: MOCK_PLATFORM_PAYMENTS.length },
    { id: 'clients', label: 'Clients', icon: UserCheck, count: '1 840' },
    { id: 'prospects', label: 'Prospects', icon: Target, count: '432' },
    { id: 'activite', label: 'Activité & Audit', icon: Activity, count: 'Live' },
    { id: 'statistiques', label: 'Statistiques', icon: BarChart3 },
    { id: 'ia', label: 'IA Engine', icon: Sparkles, count: '97.4%' },
    { id: 'support', label: 'Support', icon: LifeBuoy, count: '2' },
    { id: 'securite', label: 'Sécurité', icon: Lock, count: 'OK' },
    { id: 'avis', label: 'Avis & Confiance', icon: Star, count: 'Vérifiés' },
    { id: 'conversations', label: 'Conversations & Messagerie', icon: MessageSquare, count: 'Direct' },
    { id: 'integrations', label: 'Intégrations & Passerelles', icon: Zap, count: 'Kkiapay' },
    { id: 'automatisations', label: 'Automatisations & Rappels', icon: Zap, count: 'Moteur' },
    { id: 'communications', label: 'Communications & Multi-Canal', icon: Radio, count: 'B30/F30' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Super Admin Cockpit Banner */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0BE9EF]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FB8205]/20 border border-[#FB8205]/40 flex items-center justify-center text-[#FB8205] shadow-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-white">
                  Console Super Admin Flowexa
                </h1>
                <Badge variant="primary">Multi-Tenant Bénin</Badge>
              </div>
              <p className="text-xs text-gray-400">
                Supervision globale, pilotage des 10 modules métiers, flux financiers & sécurité
              </p>
            </div>
          </div>

          {/* Key Global Metrics */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-[#020919] border border-white/5 rounded-xl px-4 py-2">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">MRR Plateforme</span>
              <div className="text-sm font-extrabold text-[#10D97F]">
                {totalMRR.toLocaleString()} FCFA
              </div>
            </div>
            <div className="bg-[#020919] border border-white/5 rounded-xl px-4 py-2">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Volume Transigé</span>
              <div className="text-sm font-extrabold text-[#0BE9EF]">
                {(totalGMV / 1000000).toFixed(1)}M FCFA
              </div>
            </div>
            <div className="bg-[#020919] border border-white/5 rounded-xl px-4 py-2">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Entreprises Actives</span>
              <div className="text-sm font-extrabold text-white">
                {activeTenantsCount} / {totalTenantsCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 12-TABS HORIZONTAL NAVIGATION SCROLLER */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-2 shadow-xl overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FB8205] to-[#E06900] text-white shadow-md shadow-[#FB8205]/20 font-bold'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-black/40 text-white' : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 0. DASHBOARD SYNTHÈSE TEMPS RÉEL (SPRINT B29 + F29) */}
      {activeTab === 'dashboard' && <AdminDashboardOverview onNavigateTab={setActiveTab} />}

      {/* 1. ENTREPRISES */}
      {activeTab === 'entreprises' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A1428] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une entreprise, gérant, ville..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-transparent border-none text-xs text-white focus:outline-none placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#020919] p-1 rounded-xl border border-white/5">
                {[
                  { label: 'Tous', value: 'ALL' },
                  { label: 'Actifs', value: 'Actif' },
                  { label: 'En attente KYC', value: 'En attente KYC' },
                  { label: 'Suspendus', value: 'Suspendu' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setTenantStatusFilter(f.value)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      tenantStatusFilter === f.value
                        ? 'bg-[#FB8205] text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#0A1428] border border-white/10 rounded-2xl overflow-x-auto shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#020919] text-gray-400 uppercase font-semibold">
                  <th className="p-3.5">Entreprise / Secteur</th>
                  <th className="p-3.5">Gérant & Contact</th>
                  <th className="p-3.5">Localisation</th>
                  <th className="p-3.5">Forfait SaaS</th>
                  <th className="p-3.5">CA Mensuel</th>
                  <th className="p-3.5">Statut</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tenantsList
                  .filter((t) => {
                    if (tenantStatusFilter !== 'ALL' && t.status !== tenantStatusFilter) return false;
                    if (searchFilter.trim()) {
                      const q = searchFilter.toLowerCase();
                      return (
                        t.name.toLowerCase().includes(q) ||
                        t.ownerName.toLowerCase().includes(q) ||
                        t.city.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">{tenant.name}</div>
                        <div className="text-[11px] text-[#0BE9EF]">{tenant.category}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-gray-200 font-medium">{tenant.ownerName}</div>
                        <div className="text-[11px] text-gray-500">{tenant.phone}</div>
                      </td>
                      <td className="p-3.5 text-gray-300">{tenant.city}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-white">
                          {tenant.subscriptionPlan}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-[#10D97F]">
                        {(tenant.monthlyRevenue ?? 0).toLocaleString()} FCFA
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tenant.status === 'Actif'
                              ? 'bg-[#10D97F]/10 text-[#10D97F] border border-[#10D97F]/30'
                              : tenant.status === 'En attente KYC'
                              ? 'bg-[#FB8205]/10 text-[#FB8205] border border-[#FB8205]/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleTenantStatus(tenant.id, tenant.status)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                            tenant.status === 'Actif'
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-[#10D97F]/10 text-[#10D97F] hover:bg-[#10D97F]/20'
                          }`}
                        >
                          {tenant.status === 'Actif' ? 'Suspendre' : 'Activer'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. UTILISATEURS (SPRINT B24 + F24) */}
      {activeTab === 'utilisateurs' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-[#0A1428] border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 font-semibold mr-1">Rôles :</span>
              {[
                { label: 'Tous', value: 'ALL' },
                { label: 'Clients', value: 'CLIENT' },
                { label: 'Gérants', value: 'BUSINESS_OWNER' },
                { label: 'Managers', value: 'MANAGER' },
                { label: 'Employés', value: 'EMPLOYEE' },
                { label: 'Super Admin', value: 'SUPER_ADMIN' },
              ].map((rf) => (
                <button
                  key={rf.value}
                  type="button"
                  onClick={() => setUserRoleFilter(rf.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    userRoleFilter === rf.value
                      ? 'bg-[#FB8205] text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-[#020919] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
                />
              </div>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="bg-[#020919] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FB8205] cursor-pointer"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actifs uniquement</option>
                <option value="SUSPENDED">Suspendus uniquement</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl overflow-x-auto shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#020919] text-gray-400 uppercase font-semibold">
                  <th className="p-3.5">Utilisateur</th>
                  <th className="p-3.5">Organisation / Tenant</th>
                  <th className="p-3.5">Rôle Flowexa</th>
                  <th className="p-3.5">Double Facteur (2FA)</th>
                  <th className="p-3.5">Vérification</th>
                  <th className="p-3.5">Statut Compte</th>
                  <th className="p-3.5 text-right">Action Sécurité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {adminUsersList
                  .filter((u) => {
                    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
                    if (userStatusFilter !== 'ALL' && u.status !== userStatusFilter) return false;
                    if (userSearchQuery.trim()) {
                      const q = userSearchQuery.toLowerCase();
                      const match =
                        u.fullName?.toLowerCase().includes(q) ||
                        u.email?.toLowerCase().includes(q) ||
                        u.phone?.toLowerCase().includes(q);
                      if (!match) return false;
                    }
                    return true;
                  })
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="p-3.5">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-white/10 text-gray-300 text-[10px] flex items-center justify-center font-bold">
                            {u.fullName?.substring(0, 2).toUpperCase() || 'FX'}
                          </span>
                          <span>{u.fullName}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 pl-8">
                          {u.email} • {u.phone}
                        </div>
                      </td>
                      <td className="p-3.5 text-gray-300 font-medium">{u.tenantName}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-red-500/10 border-red-500/30 text-red-400'
                              : u.role === 'BUSINESS_OWNER'
                              ? 'bg-[#FB8205]/10 border-[#FB8205]/30 text-[#FB8205]'
                              : u.role === 'MANAGER'
                              ? 'bg-[#0BE9EF]/10 border-[#0BE9EF]/30 text-[#0BE9EF]'
                              : u.role === 'EMPLOYEE'
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                              : 'bg-white/5 border-white/10 text-gray-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {u.twoFactorEnabled ? (
                          <span className="text-[#10D97F] font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Activé
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Désactivé</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="text-[11px] text-[#10D97F] font-semibold bg-[#10D97F]/10 px-2 py-0.5 rounded-full border border-[#10D97F]/30">
                          {u.verificationStatus || 'VERIFIE'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {u.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${
                              u.status === 'ACTIVE'
                                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                                : 'bg-[#10D97F]/10 border-[#10D97F]/30 text-[#10D97F] hover:bg-[#10D97F]/20'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MODULES */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FLOWEXA_MODULES.map((mod) => (
            <div
              key={mod.id}
              className="bg-[#0A1428] border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-extrabold text-[#FB8205]">{mod.number}</span>
                  <h3 className="font-bold text-white text-sm">{mod.name}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#10D97F]/10 text-[#10D97F] text-[10px] font-bold">
                  Actif
                </span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">{mod.description}</p>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                <span>Catégorie : <strong className="text-white">{mod.category}</strong></span>
                <span className="text-[#0BE9EF] font-bold">Configuré</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. ABONNEMENTS & MONÉTISATION */}
      {activeTab === 'abonnements' && (
        <AdminMonetizationManagement
          onShowToast={(title, message, variant) => {
            console.log(`[SuperAdmin ${variant || 'info'}] ${title}: ${message}`);
          }}
        />
      )}

      {/* 5. PAIEMENTS */}
      {activeTab === 'paiements' && (
        <AdminPaymentsManagement />
      )}

      {/* 6. CLIENTS & 7. PROSPECTS */}
      {(activeTab === 'clients' || activeTab === 'prospects') && (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#020919] text-gray-400 uppercase font-semibold">
                <th className="p-3.5">Contact</th>
                <th className="p-3.5">Téléphone Bénin</th>
                <th className="p-3.5">Type & Statut</th>
                <th className="p-3.5">Établissement rattaché</th>
                <th className="p-3.5">Valeur estimée</th>
                <th className="p-3.5">Dernière interaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_CRM_CONTACTS.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="p-3.5 font-bold text-white">{c.fullName}</td>
                  <td className="p-3.5 text-gray-300">{c.phone}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-[#FB8205]/20 text-[#FB8205] text-[10px] font-bold">
                      {c.relationType} • {c.stage}
                    </span>
                  </td>
                  <td className="p-3.5 text-gray-400">{c.associatedBusiness}</td>
                  <td className="p-3.5 font-bold text-[#10D97F]">
                    {(c.lifetimeValue ?? 0) > 0 ? `${(c.lifetimeValue ?? 0).toLocaleString()} FCFA` : 'En qualification'}
                  </td>
                  <td className="p-3.5 text-gray-500">{c.lastInteractionDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 8. ACTIVITÉ (AUDIT LOGS) */}
      {activeTab === 'activite' && (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#020919] text-gray-400 uppercase font-semibold">
                <th className="p-3.5">Horodatage</th>
                <th className="p-3.5">Acteur</th>
                <th className="p-3.5">Événement / Action</th>
                <th className="p-3.5">Entité cible</th>
                <th className="p-3.5">Adresse IP / Origine</th>
                <th className="p-3.5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {auditLogsList.map((act) => (
                <tr key={act.id} className="hover:bg-white/[0.02]">
                  <td className="p-3.5 text-gray-400 font-mono">{act.timestamp}</td>
                  <td className="p-3.5 font-semibold text-white">{act.actor}</td>
                  <td className="p-3.5 text-gray-300">{act.action}</td>
                  <td className="p-3.5 text-[#0BE9EF] font-mono">{act.entity}</td>
                  <td className="p-3.5 text-gray-500 font-mono">{act.ipAddress}</td>
                  <td className="p-3.5">
                    <Badge variant={act.status === 'SUCCESS' ? 'success' : 'warning'}>
                      {act.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* NOUVEAUX ONGLETS SUPER ADMIN (SPRINT B29 + F29) */}
      {activeTab === 'categories' && <AdminCategoriesManagement />}

      {activeTab === 'demandes' && <AdminRequestsSupervision />}

      {activeTab === 'settings' && <AdminPlatformSettings />}

      {/* 9. STATISTIQUES */}
      {activeTab === 'statistiques' && <SuperAdminAnalyticsView />}

      {/* 10. IA */}
      {activeTab === 'ia' && (
        <AdminAIAssistant
          onShowToast={(title, msg, type) => {
            console.log(`[Admin Toast] ${type}: ${title} - ${msg}`);
          }}
        />
      )}

      {/* 11. SUPPORT */}
      {activeTab === 'support' && (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Tickets & Escalations WhatsApp</h3>
            <Badge variant="success">SLA 99.1% respecté</Badge>
          </div>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs">#TICK-884 : Validation KYC Atelier Broderie</div>
                <div className="text-[11px] text-gray-400">Koffi Mensah • En attente de vérification Registre de Commerce (RCCM)</div>
              </div>
              <Button size="sm" variant="primary">Traiter</Button>
            </div>
            <div className="p-3.5 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs">#TICK-881 : Aide configuration passerelle MTN MoMo</div>
                <div className="text-[11px] text-gray-400">Patrick Hounton (Garage Express Calavi)</div>
              </div>
              <Button size="sm" variant="outline">Répondre</Button>
            </div>
          </div>
        </div>
      )}

      {/* 12. SÉCURITÉ */}
      {activeTab === 'securite' && <AdminSecurityCenter />}

      {/* 13. AVIS & MODÉRATION (SPRINT B13 + F13) */}
      {activeTab === 'avis' && <AdminReviewsModeration />}

      {/* 14. MESSAGERIE & CONVERSATIONS (SPRINT B14 + F14) */}
      {activeTab === 'conversations' && <AdminConversationsManagement />}

      {/* 15. INTÉGRATIONS & PASSERELLES (KKIAPAY, WHATSAPP, WEBHOOKS, API) */}
      {activeTab === 'integrations' && <AdminIntegrationsManagement />}

      {/* 16. AUTOMATISATIONS & RAPPELS (SPRINT B19 + F19) */}
      {activeTab === 'automatisations' && <AdminAutomationsManagement />}

      {/* 17. COMMUNICATIONS & HUB MULTI-CANAL (SPRINT B30 + F30) */}
      {activeTab === 'communications' && <AdminCommunicationsManagement />}
    </div>
  );
};
