import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Layers,
  MessageSquare,
  ChevronRight,
  DollarSign,
  FileCheck,
} from 'lucide-react';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import { flowexaApi } from '../../services/api';
import { AdminDashboardMetrics, SuperAdminTab } from '../../types';

interface AdminDashboardOverviewProps {
  onNavigateTab: (tab: SuperAdminTab) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({ onNavigateTab }) => {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await flowexaApi.getAdminDashboardSummary();
      if (res.success && res.data) {
        setMetrics(res.data);
      } else {
        setError(res.message || 'Impossible de récupérer la synthèse en temps réel.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau lors de la récupération des métriques.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-12 text-center shadow-xl">
        <RefreshCw className="w-8 h-8 text-[#FB8205] animate-spin mx-auto mb-3" />
        <h3 className="text-white font-bold text-sm">Chargement des données réelles de la plateforme...</h3>
        <p className="text-xs text-gray-400 mt-1">Vérification de l’ensemble des modules, entreprises et flux financiers</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A1428] border border-white/10 rounded-2xl p-4 md:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FB8205]/20 border border-[#FB8205]/30 flex items-center justify-center text-[#FB8205]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Vue d’Ensemble Plateforme
              <span className="inline-flex items-center gap-1 text-[10px] bg-[#10D97F]/10 text-[#10D97F] border border-[#10D97F]/30 px-2 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10D97F] animate-pulse" />
                Temps Réel
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Métriques calculées 100% sur la base de données vivante de Flowexa Bénin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Actualiser
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onNavigateTab('settings')}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Paramètres
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* System Alerts Banner (if any) */}
      {metrics?.systemAlerts && metrics.systemAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
            Actions requises & Alertes système ({metrics.systemAlerts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.systemAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-lg transition-all ${
                  alert.level === 'CRITICAL'
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : alert.level === 'WARNING'
                    ? 'bg-[#FB8205]/10 border-[#FB8205]/30 text-amber-300'
                    : 'bg-[#0BE9EF]/10 border-[#0BE9EF]/30 text-cyan-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {alert.level === 'CRITICAL' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : alert.level === 'WARNING' ? (
                      <AlertTriangle className="w-4 h-4 text-[#FB8205]" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#0BE9EF]" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white flex items-center gap-2">
                      {alert.title}
                    </h4>
                    <p className="text-[11px] text-gray-300 mt-0.5">{alert.description}</p>
                  </div>
                </div>

                {alert.targetTab && (
                  <button
                    onClick={() => onNavigateTab(alert.targetTab as SuperAdminTab)}
                    className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>{alert.actionLabel || 'Ouvrir'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Key Real Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Entreprises */}
        <div
          onClick={() => onNavigateTab('entreprises')}
          className="bg-[#0A1428] border border-white/10 hover:border-[#FB8205]/50 transition-all rounded-2xl p-4 cursor-pointer shadow-lg group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase">Entreprises</span>
            <div className="w-8 h-8 rounded-xl bg-[#FB8205]/20 text-[#FB8205] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {metrics?.businesses.total || 0}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="text-[#10D97F] font-bold">
              {metrics?.businesses.active || 0} actives
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-amber-400 font-medium">
              {metrics?.businesses.pendingReview || 0} en attente
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
            <span>{metrics?.businesses.suspended || 0} suspendues</span>
            <span className="text-[#FB8205] group-hover:translate-x-0.5 transition-transform flex items-center">
              Détails <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* 2. Utilisateurs & Comptes */}
        <div
          onClick={() => onNavigateTab('utilisateurs')}
          className="bg-[#0A1428] border border-white/10 hover:border-[#0BE9EF]/50 transition-all rounded-2xl p-4 cursor-pointer shadow-lg group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase">Utilisateurs</span>
            <div className="w-8 h-8 rounded-xl bg-[#0BE9EF]/20 text-[#0BE9EF] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {metrics?.users.total || 0}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="text-white font-medium">{metrics?.users.clients || 0} clients</span>
            <span className="text-gray-500">•</span>
            <span className="text-[#0BE9EF] font-bold">{metrics?.users.businessOwners || 0} pros</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
            <span>{metrics?.users.managers || 0} managers, {metrics?.users.employees || 0} employés</span>
            <span className="text-[#0BE9EF] group-hover:translate-x-0.5 transition-transform flex items-center">
              Gérer <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* 3. Demandes & Réservations */}
        <div
          onClick={() => onNavigateTab('demandes')}
          className="bg-[#0A1428] border border-white/10 hover:border-[#10D97F]/50 transition-all rounded-2xl p-4 cursor-pointer shadow-lg group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase">Interactions Client</span>
            <div className="w-8 h-8 rounded-xl bg-[#10D97F]/20 text-[#10D97F] flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {metrics?.requests.total || 0}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="text-[#10D97F] font-bold">
              {metrics?.requests.accepted || 0} acceptées
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-amber-400 font-medium">
              {metrics?.requests.pending || 0} en attente
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
            <span>{metrics?.requests.bookings || 0} réservations, {metrics?.requests.demandes || 0} devis</span>
            <span className="text-[#10D97F] group-hover:translate-x-0.5 transition-transform flex items-center">
              Superviser <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* 4. Flux Financiers */}
        <div
          onClick={() => onNavigateTab('paiements')}
          className="bg-[#0A1428] border border-white/10 hover:border-amber-400/50 transition-all rounded-2xl p-4 cursor-pointer shadow-lg group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase">Transactions</span>
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#10D97F]">
            {(metrics?.payments?.totalVolume ?? 0).toLocaleString()} <span className="text-xs text-gray-400">FCFA</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="text-[#10D97F] font-bold">
              {metrics?.payments?.successCount ?? 0} réussis
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400">
              {metrics?.payments?.totalCount ?? 0} total
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
            <span>{metrics?.subscriptions.activeCount || 0} abonnements actifs</span>
            <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center">
              Voir flux <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Platform Health & Activity Sub-Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Status & Categories */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FB8205]" />
              <h3 className="font-bold text-white text-sm">Architecture des 10 Métiers</h3>
            </div>
            <button
              onClick={() => onNavigateTab('categories')}
              className="text-[11px] font-bold text-[#FB8205] hover:underline cursor-pointer flex items-center gap-0.5"
            >
              Gérer <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Les 10 modules officiels Flowexa garantissent une spécialisation stricte sans mélange :
          </p>

          <div className="space-y-2">
            {[
              { code: 'IMMOBILIER', name: 'Immobilier (Baux & Biens)', color: '#FB8205' },
              { code: 'GUEST_HOUSE', name: 'Guest House (Séjours & Nuitées)', color: '#0BE9EF' },
              { code: 'COIFFURE', name: 'Salons de Coiffure & Tresses', color: '#FB8205' },
              { code: 'BARBIER', name: 'Barbiers & Soins Homme', color: '#0BE9EF' },
              { code: 'INSTITUT_COSMETIQUE', name: 'Institut & Esthétique', color: '#FB8205' },
              { code: 'SPA_MASSAGE', name: 'Spa, Hammam & Massage', color: '#0BE9EF' },
              { code: 'PHOTOGRAPHE', name: 'Photographes & Studios', color: '#FB8205' },
              { code: 'BRODERIE_IMPRESSION', name: 'Broderie & Impression Textile', color: '#0BE9EF' },
              { code: 'GARAGE', name: 'Garages & Mécanique Auto', color: '#FB8205' },
              { code: 'PHARMACIE', name: 'Pharmacies de Garde', color: '#0BE9EF' },
            ].map((m) => (
              <div
                key={m.code}
                className="p-2.5 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                  <span className="font-semibold text-white">{m.name}</span>
                </div>
                <span className="text-[10px] font-bold text-[#10D97F] bg-[#10D97F]/10 px-2 py-0.5 rounded-full">
                  Prêt
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Real Review & Trust Moderation Status */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#0BE9EF]" />
              <h3 className="font-bold text-white text-sm">Modération & Confiance</h3>
            </div>
            <button
              onClick={() => onNavigateTab('avis')}
              className="text-[11px] font-bold text-[#0BE9EF] hover:underline cursor-pointer flex items-center gap-0.5"
            >
              Voir les avis <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Avis déposés suite à des interactions réelles vérifiées par le système :
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5">
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Total Avis</span>
              <div className="text-xl font-extrabold text-white mt-1">
                {metrics?.reviews.total || 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5">
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Publiés</span>
              <div className="text-xl font-extrabold text-[#10D97F] mt-1">
                {metrics?.reviews.published || 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5">
              <span className="text-[10px] text-gray-400 font-semibold uppercase">En attente</span>
              <div className="text-xl font-extrabold text-amber-400 mt-1">
                {metrics?.reviews.pending || 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5">
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Signalements</span>
              <div className="text-xl font-extrabold text-red-400 mt-1">
                {metrics?.reviews.reportedCount || 0}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-300">
            <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10D97F]" />
              Politique anti-avis fictifs
            </div>
            <p className="text-[11px] text-gray-400">
              Seuls les clients ayant finalisé une réservation ou commande peuvent soumettre une note. Tout signalement est examiné par l’administration.
            </p>
          </div>
        </div>

        {/* Messaging & Communication Flow */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#10D97F]" />
              <h3 className="font-bold text-white text-sm">Messagerie & Canaux</h3>
            </div>
            <button
              onClick={() => onNavigateTab('conversations')}
              className="text-[11px] font-bold text-[#10D97F] hover:underline cursor-pointer flex items-center gap-0.5"
            >
              Discussions <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Échanges directs et sécurisés entre les clients et les entreprises :
          </p>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-400">Conversations Ouvertes :</span>
              <span className="font-extrabold text-white text-sm">
                {metrics?.conversations.open || 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-400">Conversations Clôturées :</span>
              <span className="font-extrabold text-gray-300 text-sm">
                {metrics?.conversations.closed || 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-400">Messages Échangés :</span>
              <span className="font-extrabold text-[#0BE9EF] text-sm">
                {metrics?.conversations.messagesTotal || 0}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#0BE9EF]/10 to-transparent border border-[#0BE9EF]/20 text-xs">
            <span className="font-bold text-[#0BE9EF] block mb-1">Passerelle WhatsApp & SMS</span>
            <span className="text-[11px] text-gray-400">
              Rappels et notifications synchronisés via le numéro officiel béninois (+229).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
