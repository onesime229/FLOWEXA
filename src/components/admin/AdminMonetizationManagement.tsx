import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Archive,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Users,
  Package,
  Layers,
  HardDrive,
  Sparkles,
  Building,
  FileText,
  DollarSign,
  Calendar,
  X,
  RefreshCw,
  Check,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
} from 'lucide-react';
import { flowexaApi } from '../../services/api';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import type { Plan, Subscription, Invoice } from '../../types';

interface AdminMonetizationManagementProps {
  onShowToast: (title: string, message: string, variant?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const AdminMonetizationManagement: React.FC<AdminMonetizationManagementProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions' | 'invoices'>('plans');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Plan creation / edit modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: 15000,
    currency: 'FCFA',
    period: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
    isPopular: false,
    badgeText: '',
    maxEmployees: 5,
    maxServices: 20,
    maxOffers: 30,
    maxStorageMb: 1000,
    marketplaceAccess: true,
    statistics: true,
    automations: false,
    aiCopilot: false,
    prioritySupport: false,
    customBranding: false,
    advancedReports: false,
  });

  // Invoice view modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, subsRes, invsRes] = await Promise.all([
        flowexaApi.getAdminPlans(),
        flowexaApi.getAdminSubscriptions(),
        flowexaApi.getAdminInvoices(),
      ]);

      if (plansRes.success && Array.isArray(plansRes.data)) {
        setPlans(plansRes.data);
      }
      if (subsRes.success && Array.isArray(subsRes.data)) {
        setSubscriptions(subsRes.data);
      }
      if (invsRes.success && Array.isArray(invsRes.data)) {
        setInvoices(invsRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin monetization data', err);
      onShowToast('Erreur', 'Impossible de charger les données de monétisation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanFormData({
      name: '',
      code: '',
      description: '',
      price: 15000,
      currency: 'FCFA',
      period: 'MONTHLY',
      isPopular: false,
      badgeText: '',
      maxEmployees: 5,
      maxServices: 20,
      maxOffers: 30,
      maxStorageMb: 1000,
      marketplaceAccess: true,
      statistics: true,
      automations: false,
      aiCopilot: false,
      prioritySupport: false,
      customBranding: false,
      advancedReports: false,
    });
    setIsPlanModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      code: plan.code,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      period: plan.period,
      isPopular: !!plan.isPopular,
      badgeText: plan.badgeText || '',
      maxEmployees: plan.limits.maxEmployees,
      maxServices: plan.limits.maxServices,
      maxOffers: plan.limits.maxOffers,
      maxStorageMb: plan.limits.maxStorageMb,
      marketplaceAccess: plan.features.marketplaceAccess,
      statistics: plan.features.statistics,
      automations: plan.features.automations,
      aiCopilot: plan.features.aiCopilot,
      prioritySupport: plan.features.prioritySupport,
      customBranding: plan.features.customBranding,
      advancedReports: plan.features.advancedReports,
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormData.name) {
      onShowToast('Champs requis', 'Veuillez saisir un nom de plan.', 'warning');
      return;
    }

    setSavingPlan(true);
    try {
      const payload = {
        name: planFormData.name,
        code: planFormData.code || planFormData.name.toUpperCase().replace(/\s+/g, '_'),
        description: planFormData.description,
        price: Number(planFormData.price),
        currency: planFormData.currency,
        period: planFormData.period,
        isPopular: planFormData.isPopular,
        badgeText: planFormData.badgeText,
        limits: {
          maxEmployees: Number(planFormData.maxEmployees),
          maxServices: Number(planFormData.maxServices),
          maxOffers: Number(planFormData.maxOffers),
          maxStorageMb: Number(planFormData.maxStorageMb),
        },
        features: {
          marketplaceAccess: planFormData.marketplaceAccess,
          statistics: planFormData.statistics,
          automations: planFormData.automations,
          aiCopilot: planFormData.aiCopilot,
          prioritySupport: planFormData.prioritySupport,
          customBranding: planFormData.customBranding,
          advancedReports: planFormData.advancedReports,
        },
      };

      let res;
      if (editingPlan) {
        res = await flowexaApi.updateAdminPlan(editingPlan.id, payload);
      } else {
        res = await flowexaApi.createAdminPlan(payload);
      }

      if (res.success) {
        onShowToast(
          'Succès',
          editingPlan ? 'Plan mis à jour avec succès.' : 'Nouveau plan créé avec succès.',
          'success'
        );
        setIsPlanModalOpen(false);
        loadData();
      } else {
        onShowToast('Erreur', res.message || 'Action impossible.', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Erreur', 'Échec de l’enregistrement.', 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleTogglePlan = async (planId: string) => {
    try {
      const res = await flowexaApi.toggleAdminPlanStatus(planId);
      if (res.success) {
        onShowToast('Statut mis à jour', res.message || 'Statut modifié.', 'info');
        loadData();
      } else {
        onShowToast('Erreur', res.message || 'Action impossible.', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Erreur', 'Échec du changement de statut.', 'error');
    }
  };

  const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const activeSubsCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;

  const filteredSubscriptions = subscriptions.filter((s) => {
    const matchesSearch =
      s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.planName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left">
      {/* 1. Header Banner & Global Metrics */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="orange" dot>Super Administration</Badge>
              <span className="text-xs text-gray-400">Gouvernance Monétisation Flowexa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span>Monétisation, Plans & Abonnements</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
              Configurez les offres tarifaires, contrôlez les quotas d'usage, suivez les abonnements des entreprises clientes et supervisez l'ensemble des flux de facturation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={loadData}
            >
              Actualiser
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={openCreateModal}
            >
              Créer un Plan
            </Button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-gray-400 font-semibold uppercase flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#FB8205]" />
              <span>Plans Actifs</span>
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              {plans.filter((p) => p.status === 'ACTIVE').length} / {plans.length}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Configurés sur la plateforme</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-gray-400 font-semibold uppercase flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Abonnements Actifs</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              {activeSubsCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Sur {subscriptions.length} entreprises inscrites</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-gray-400 font-semibold uppercase flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <span>Revenus Abonnements</span>
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              {(totalRevenue ?? 0).toLocaleString()} <span className="text-xs font-semibold text-gray-400">FCFA</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">{invoices.length} factures acquittées</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-gray-400 font-semibold uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>En Période de Grâce / Expirés</span>
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
              {subscriptions.filter((s) => s.status === 'PAST_DUE' || s.status === 'EXPIRED').length}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Souscriptions à renouveler</div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-[#FB8205] text-white shadow-lg shadow-[#FB8205]/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Plans Tarifaires ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'subscriptions'
              ? 'bg-[#FB8205] text-white shadow-lg shadow-[#FB8205]/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Abonnements Entreprises ({subscriptions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'invoices'
              ? 'bg-[#FB8205] text-white shadow-lg shadow-[#FB8205]/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Factures & Règlements ({invoices.length})</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: PLANS */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-[#0A1428] rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                plan.status === 'ACTIVE'
                  ? 'border-white/10 hover:border-white/20'
                  : 'border-red-500/20 opacity-70 bg-red-950/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#FB8205] uppercase">{plan.code}</span>
                  <div className="flex items-center gap-2">
                    {plan.isPopular && <Badge variant="cyan">Populaire</Badge>}
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        plan.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {plan.status === 'ACTIVE' ? 'Actif' : 'Archivé'}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-gray-400 min-h-[32px]">{plan.description}</p>

                <div className="my-4 py-3 border-y border-white/10 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white font-mono">{(plan.price ?? 0).toLocaleString()}</span>
                  <span className="text-sm font-semibold text-gray-400">{plan.currency}</span>
                  <span className="text-xs text-gray-500">/mois</span>
                </div>

                {/* Limits summary */}
                <div className="space-y-1.5 text-xs text-gray-300 mb-4 bg-white/5 p-3 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Collaborateurs max :</span>
                    <strong className="text-white font-mono">{plan.limits.maxEmployees}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prestations max :</span>
                    <strong className="text-white font-mono">{plan.limits.maxServices}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Offres actives max :</span>
                    <strong className="text-white font-mono">{plan.limits.maxOffers}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stockage max :</span>
                    <strong className="text-white font-mono">{plan.limits.maxStorageMb} Mo</strong>
                  </div>
                </div>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {plan.features.marketplaceAccess && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
                      Marketplace
                    </span>
                  )}
                  {plan.features.statistics && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
                      Statistiques
                    </span>
                  )}
                  {plan.features.automations && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Automatisations
                    </span>
                  )}
                  {plan.features.aiCopilot && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      IA Copilot
                    </span>
                  )}
                  {plan.features.prioritySupport && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Support 7j/7
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={() => openEditModal(plan)}
                  className="flex-1 text-xs"
                >
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Archive className="w-3.5 h-3.5" />}
                  onClick={() => handleTogglePlan(plan.id)}
                  className={`text-xs ${
                    plan.status === 'ACTIVE'
                      ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                      : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {plan.status === 'ACTIVE' ? 'Archiver' : 'Activer'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0A1428] p-4 rounded-xl border border-white/10">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une entreprise ou formule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#050B14] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#050B14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FB8205]"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actif</option>
                <option value="TRIAL">Période d'essai</option>
                <option value="PAST_DUE">En retard (Grâce)</option>
                <option value="EXPIRED">Expiré</option>
                <option value="CANCELLED">Résilié</option>
              </select>
            </div>
          </div>

          <div className="bg-[#0A1428] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Entreprise</th>
                  <th className="py-3 px-4">Plan Souscrit</th>
                  <th className="py-3 px-4">Période</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Date Début</th>
                  <th className="py-3 px-4">Date Échéance</th>
                  <th className="py-3 px-4">Renouvellement Auto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <Building className="w-4 h-4 text-[#FB8205]" />
                        <span>{sub.businessName}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono">ID: {sub.businessId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {sub.planName}
                      <span className="text-xs text-gray-400 ml-1">
                        ({(sub.price ?? 0).toLocaleString()} {sub.currency})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-300">
                      <span className="px-2 py-0.5 rounded bg-white/5 font-mono">
                        {sub.period === 'YEARLY' ? 'Annuel' : 'Mensuel'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : sub.status === 'PAST_DUE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : sub.status === 'TRIAL'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-300">
                      {new Date(sub.startDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-white font-mono">
                      {new Date(sub.expirationDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {sub.autoRenew ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Oui
                        </span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Non
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
              <tr>
                <th className="py-3 px-4">N° Facture</th>
                <th className="py-3 px-4">Entreprise</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Montant</th>
                <th className="py-3 px-4">Paiement</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 text-white font-medium">{inv.businessName}</td>
                  <td className="py-3 px-4 text-gray-300">{inv.planName}</td>
                  <td className="py-3 px-4 font-bold text-white font-mono">
                    {(inv.amount ?? 0).toLocaleString()} {inv.currency}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-300">
                    <span className="px-2 py-0.5 rounded bg-white/10 font-mono">{inv.paymentMethod}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400">
                    {new Date(inv.issuedAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ACQUITTÉE
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="text-xs text-[#FB8205] hover:text-white font-bold cursor-pointer"
                    >
                      Voir reçu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: CREATE / EDIT PLAN */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingPlan ? `Modifier le Plan "${editingPlan.name}"` : 'Créer un Nouveau Plan Tarifaire'}
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Nom du Plan *</label>
                  <input
                    type="text"
                    required
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    placeholder="ex: Starter, Pro, Entreprise"
                    className="w-full bg-[#050B14] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Code Système (Unique)</label>
                  <input
                    type="text"
                    value={planFormData.code}
                    onChange={(e) => setPlanFormData({ ...planFormData, code: e.target.value })}
                    placeholder="ex: PLAN_PRO"
                    className="w-full bg-[#050B14] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#FB8205]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Description courte</label>
                <input
                  type="text"
                  value={planFormData.description}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  placeholder="Idéal pour les entreprises en pleine expansion..."
                  className="w-full bg-[#050B14] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Prix Mensuel ({planFormData.currency}) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={planFormData.price}
                    onChange={(e) => setPlanFormData({ ...planFormData, price: Number(e.target.value) })}
                    className="w-full bg-[#050B14] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#FB8205]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Badge personnalisé (Optionnel)</label>
                  <input
                    type="text"
                    value={planFormData.badgeText}
                    onChange={(e) => setPlanFormData({ ...planFormData, badgeText: e.target.value })}
                    placeholder="ex: Recommandé"
                    className="w-full bg-[#050B14] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
                  />
                </div>
              </div>

              {/* Quotas */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <div className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">
                  Quotas & Limites Système Strictes
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-gray-400 text-[10px] mb-1">Collaborateurs max</label>
                    <input
                      type="number"
                      min={1}
                      value={planFormData.maxEmployees}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxEmployees: Number(e.target.value) })}
                      className="w-full bg-[#050B14] border border-white/10 rounded-lg px-2 py-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] mb-1">Prestations max</label>
                    <input
                      type="number"
                      min={1}
                      value={planFormData.maxServices}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxServices: Number(e.target.value) })}
                      className="w-full bg-[#050B14] border border-white/10 rounded-lg px-2 py-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] mb-1">Offres max</label>
                    <input
                      type="number"
                      min={1}
                      value={planFormData.maxOffers}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxOffers: Number(e.target.value) })}
                      className="w-full bg-[#050B14] border border-white/10 rounded-lg px-2 py-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] mb-1">Stockage (Mo)</label>
                    <input
                      type="number"
                      min={50}
                      value={planFormData.maxStorageMb}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxStorageMb: Number(e.target.value) })}
                      className="w-full bg-[#050B14] border border-white/10 rounded-lg px-2 py-1 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Feature flags */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <div className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">
                  Fonctionnalités incluses
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={planFormData.marketplaceAccess}
                      onChange={(e) => setPlanFormData({ ...planFormData, marketplaceAccess: e.target.checked })}
                    />
                    <span>Marketplace & Matching</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={planFormData.statistics}
                      onChange={(e) => setPlanFormData({ ...planFormData, statistics: e.target.checked })}
                    />
                    <span>Statistiques & Indicateurs</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={planFormData.automations}
                      onChange={(e) => setPlanFormData({ ...planFormData, automations: e.target.checked })}
                    />
                    <span>Automatisations CRM</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={planFormData.aiCopilot}
                      onChange={(e) => setPlanFormData({ ...planFormData, aiCopilot: e.target.checked })}
                    />
                    <span>Assistant IA Copilot</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={planFormData.prioritySupport}
                      onChange={(e) => setPlanFormData({ ...planFormData, prioritySupport: e.target.checked })}
                    />
                    <span>Support prioritaire 7j/7</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={planFormData.isPopular}
                      onChange={(e) => setPlanFormData({ ...planFormData, isPopular: e.target.checked })}
                    />
                    <span className="text-cyan-400 font-bold">Mettre en avant ("Populaire")</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button variant="outline" size="sm" onClick={() => setIsPlanModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={savingPlan}>
                  {savingPlan ? 'Enregistrement...' : 'Enregistrer le Plan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW INVOICE */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FB8205]" />
                <span>Facture N° {selectedInvoice.invoiceNumber}</span>
              </h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Client :</span>
                <strong className="text-white">{selectedInvoice.businessName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Plan souscrit :</span>
                <strong className="text-white">{selectedInvoice.planName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Montant total :</span>
                <strong className="text-white font-mono">{(selectedInvoice.amount ?? 0).toLocaleString()} {selectedInvoice.currency}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Moyen de paiement :</span>
                <span className="text-gray-200 font-mono">{selectedInvoice.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Réf. transaction :</span>
                <span className="text-gray-300 font-mono">{selectedInvoice.transactionReference || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Date d'émission :</span>
                <span className="text-gray-300">{new Date(selectedInvoice.issuedAt).toLocaleString('fr-FR')}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setSelectedInvoice(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
