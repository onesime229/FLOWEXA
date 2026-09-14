import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Inbox,
  Calendar,
  Clock,
  Star,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Award,
  RefreshCw,
  HelpCircle,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  MapPin,
  FileText,
  Download,
  BrainCircuit,
  Percent,
  ChevronRight,
  Printer,
  X,
  Send,
  Zap,
} from 'lucide-react';
import { flowexaApi } from '../../services/api';
import type {
  AnalyticsPeriod,
  BusinessAnalyticsResponse,
  TopClientItem,
  TopServiceItem,
} from '../../types';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';

interface BusinessAnalyticsDashboardProps {
  businessId: string;
  businessName?: string;
  moduleCode?: string;
  onShowToast?: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const BusinessAnalyticsDashboard: React.FC<BusinessAnalyticsDashboardProps> = ({
  businessId,
  businessName,
  moduleCode,
  onShowToast,
}) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30D');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<BusinessAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals & Panels state
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [customQuestion, setCustomQuestion] = useState<string>('');

  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);

  const fetchAnalytics = async (selectedPeriod: AnalyticsPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const res = await flowexaApi.getBusinessAnalytics(businessId, selectedPeriod, {
        role: 'BUSINESS_OWNER',
        businessId,
      });

      if (res.success && res.data) {
        setData(res.data as BusinessAnalyticsResponse);
      } else {
        setError(res.error || 'Impossible de récupérer les statistiques réelles.');
      }
    } catch (err: any) {
      console.error('Erreur chargement analytics:', err);
      setError(err?.message || 'Erreur réseau lors de la récupération des données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchAnalytics(period);
    }
  }, [businessId, period]);

  const handleOpenAiDiagnostic = async (question?: string) => {
    setShowAiModal(true);
    setAiLoading(true);
    try {
      const res = await flowexaApi.explainAnalyticsWithAI(businessId, {
        period,
        question: question || customQuestion,
      }, {
        role: 'BUSINESS_OWNER',
        businessId,
      });
      if (res.success && res.data) {
        setAiResponse(res.data);
      } else {
        onShowToast?.('Diagnostic', res.error || 'Analyse indisponible', 'error');
      }
    } catch (err: any) {
      console.error('Erreur diagnostic IA:', err);
      onShowToast?.('Erreur', 'Impossible de joindre le service de diagnostic.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenReport = async () => {
    setShowReportModal(true);
    setReportLoading(true);
    try {
      const res = await flowexaApi.getBusinessAnalyticsReport(businessId, period, {
        role: 'BUSINESS_OWNER',
        businessId,
      });
      if (res.success && res.data) {
        setReportData(res.data);
      } else {
        onShowToast?.('Rapport', res.error || 'Génération du rapport échouée', 'error');
      }
    } catch (err: any) {
      console.error('Erreur rapport:', err);
      onShowToast?.('Erreur', 'Impossible de générer le rapport structuré.', 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadReportJson = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-flowexa-${businessId}-${period}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast?.('Téléchargement', 'Rapport exporté avec succès en JSON.', 'success');
  };

  const periods: { id: AnalyticsPeriod; label: string }[] = [
    { id: 'TODAY', label: "Aujourd'hui" },
    { id: '7D', label: '7 jours' },
    { id: '30D', label: '30 jours' },
    { id: '3M', label: '3 mois' },
    { id: '12M', label: '12 mois' },
    { id: 'ALL', label: 'Tout' },
  ];

  if (loading && !data) {
    return (
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-[#FB8205] animate-spin" />
        <p className="text-sm font-semibold text-white">Calcul des métriques de pilotage réelles...</p>
        <p className="text-xs text-gray-400">Agrégation mathématique des encaissements, demandes et réservations confirmées.</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-[#0A1428] border border-red-500/20 rounded-2xl p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <div>
          <h4 className="text-base font-bold text-white">Erreur de chargement</h4>
          <p className="text-xs text-red-300 mt-1">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchAnalytics(period)}>
          Réessayer
        </Button>
      </div>
    );
  }

  const d = data!;

  return (
    <div className="space-y-6">
      {/* 1. En-tête avec sélecteur de période & Actions rapides */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Tableau de Bord de Pilotage & BI
            </h3>
            {moduleCode && <Badge variant="cyan">{moduleCode}</Badge>}
            {d.subscriptionSummary && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <Zap className="w-3 h-3" />
                {d.subscriptionSummary.planName}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Indicateurs de performance calculés exclusivement sur les données réelles enregistrées dans Flowexa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bouton Rapport structuré */}
          <button
            onClick={handleOpenReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#020919] border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rapport d'activité</span>
          </button>

          {/* Bouton Diagnostic IA */}
          <button
            onClick={() => handleOpenAiDiagnostic()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-[#0BE9EF]" />
            <span>Diagnostic Exécutif IA</span>
          </button>

          {/* Boutons de sélection de période */}
          <div className="flex items-center gap-1 bg-[#020919] border border-white/10 p-1 rounded-xl">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => {
                fetchAnalytics(period);
                onShowToast?.('Actualisation', 'Statistiques recalculées en direct.', 'info');
              }}
              title="Rafraîchir les statistiques"
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all ml-0.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FB8205]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Alertes intelligentes réelles */}
      {d.alerts && d.alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {d.alerts.map((alt) => (
            <div
              key={alt.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                alt.type === 'INCREASE'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : alt.type === 'DECREASE'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : alt.type === 'WARNING'
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}
            >
              {alt.type === 'INCREASE' ? (
                <ArrowUpRight className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
              ) : alt.type === 'DECREASE' ? (
                <ArrowDownRight className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
              ) : (
                <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <div className="font-semibold text-white">{alt.message}</div>
                {alt.detail && <div className="text-gray-400 mt-0.5">{alt.detail}</div>}
              </div>
              {alt.comparisonLabel && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-black/40">
                  {alt.comparisonLabel}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. Section Chiffre d'Affaires & KPI majeurs avec ÉVOLUTION RÉELLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chiffre d'affaires Net */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Chiffre d'Affaires Net</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {(d.revenue?.netRevenue ?? 0) > 0 ? `${(d.revenue.netRevenue).toLocaleString()} FCFA` : '0 FCFA'}
            </div>

            {/* Évolution réelle CA */}
            {d.evolution?.revenue && (
              <div className="mt-2">
                {d.evolution.revenue.status === 'INCREASE' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {d.evolution.revenue.growthLabel}
                    <span className="text-gray-400 font-normal">vs période préc.</span>
                  </span>
                ) : d.evolution.revenue.status === 'DECREASE' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <TrendingDown className="w-3 h-3" />
                    {d.evolution.revenue.growthLabel}
                    <span className="text-gray-400 font-normal">vs période préc.</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400">
                    {d.evolution.revenue.growthLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/5 mt-3 space-y-1 text-[11px]">
            <div className="text-gray-400 flex items-center justify-between">
              <span>CA Brut encaissé :</span>
              <span className="text-white font-mono font-semibold">{(d.revenue?.grossRevenue ?? 0).toLocaleString()} FCFA</span>
            </div>
            <div className="text-gray-400 flex items-center justify-between">
              <span>Encaissements validés :</span>
              <span className="text-emerald-400 font-semibold">{d.revenue?.confirmedPaymentsCount ?? 0} transaction(s)</span>
            </div>
            {(d.revenue?.refundedAmount ?? 0) > 0 && (
              <div className="text-amber-400 flex items-center justify-between">
                <span>Remboursements :</span>
                <span className="font-mono">-{(d.revenue?.refundedAmount ?? 0).toLocaleString()} FCFA</span>
              </div>
            )}
          </div>
        </div>

        {/* Demandes Clients & Évolution */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Demandes Clients</span>
              <div className="w-8 h-8 rounded-lg bg-[#FB8205]/10 text-[#FB8205] flex items-center justify-center">
                <Inbox className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">{d.requests.total}</div>

            {/* Évolution réelle Demandes */}
            {d.evolution?.requests && (
              <div className="mt-2">
                {d.evolution.requests.status === 'INCREASE' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {d.evolution.requests.growthLabel}
                    <span className="text-gray-400 font-normal">vs période préc.</span>
                  </span>
                ) : d.evolution.requests.status === 'DECREASE' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <TrendingDown className="w-3 h-3" />
                    {d.evolution.requests.growthLabel}
                    <span className="text-gray-400 font-normal">vs période préc.</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400">
                    {d.evolution.requests.growthLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/5 mt-3 space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-gray-400">
              <span>Taux d'acceptation :</span>
              <span className="text-[#FB8205] font-bold">{d.requests.acceptanceRateLabel || '—'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-center">
              <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded font-medium">
                {d.requests.accepted} acc.
              </div>
              <div className="bg-amber-500/10 text-amber-400 p-1 rounded font-medium">
                {d.requests.pending} att.
              </div>
              <div className="bg-red-500/10 text-red-400 p-1 rounded font-medium">
                {d.requests.rejected} ref.
              </div>
            </div>
          </div>
        </div>

        {/* Réservations & Rendez-vous */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Réservations & RDV</span>
              <div className="w-8 h-8 rounded-lg bg-[#0BE9EF]/10 text-[#0BE9EF] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {d.bookings.total + d.appointments.scheduled}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">
              {d.funnel.bookingRate > 0 ? `${d.funnel.bookingRate}% des demandes converties en RDV` : 'En attente de réservations'}
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 mt-3 space-y-1 text-[11px]">
            <div className="text-gray-400 flex items-center justify-between">
              <span>Réservations conf. :</span>
              <span className="text-white font-semibold">{d.bookings.confirmed}</span>
            </div>
            <div className="text-gray-400 flex items-center justify-between">
              <span>Prestations terminées :</span>
              <span className="text-emerald-400 font-semibold">{d.bookings.completed + d.appointments.completed}</span>
            </div>
            <div className="text-gray-400 flex items-center justify-between">
              <span>RDV à venir :</span>
              <span className="text-cyan-400 font-semibold">{d.appointments.upcoming}</span>
            </div>
          </div>
        </div>

        {/* Clients & Rétention */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Clients Uniques</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {d.customers.activeCustomersCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">
              Panier moyen : <strong className="text-emerald-400 font-mono">{(d.customers.averageOrderValue || 0).toLocaleString()} FCFA</strong>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 mt-3 space-y-1 text-[11px]">
            <div className="text-gray-400 flex items-center justify-between">
              <span>Nouveaux clients :</span>
              <span className="text-emerald-400 font-semibold">+{d.customers.newCustomersCount}</span>
            </div>
            <div className="text-gray-400 flex items-center justify-between">
              <span>Clients récurrents :</span>
              <span className="text-[#FB8205] font-semibold">{d.customers.returningCustomersCount}</span>
            </div>
            <div className="text-gray-400 flex items-center justify-between">
              <span>Fréquence moy. :</span>
              <span className="text-cyan-400 font-semibold">{d.customers.averageInteractionsPerCustomer || 0} dem./client</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LES 6 RÉPONSES CLÉS DU DIRIGEANT (COCKPIT DÉCISIONNEL) */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FB8205]" />
              <h4 className="text-base font-bold text-white">Cockpit Décisionnel — 6 Réponses Clés</h4>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Synthèse pragmatique tirée exclusivement des flux réels de votre établissement.
            </p>
          </div>
          <Badge variant="cyan">Analyse Automatisée</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Q1. Comment va mon activité ? */}
          <div className="bg-[#020919] border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400">1. Comment va mon activité ?</span>
              <span className="text-xs font-mono font-black text-white px-2 py-0.5 rounded bg-white/10">
                {d.healthScore.overall}/100
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {d.healthScore.overall >= 80
                ? `Activité dynamique et en bonne santé. ${d.revenue?.confirmedPaymentsCount ?? 0} paiements confirmés pour un CA net de ${(d.revenue?.netRevenue ?? 0).toLocaleString()} FCFA.`
                : d.healthScore.overall >= 60
                ? `Activité stable (${d.healthScore.summary}). Concentrez-vous sur la conversion et les délais de réponse.`
                : `Activité nécessitant des actions rapides (${d.healthScore.summary}). Traitez les demandes reçues pour débloquer votre potentiel.`}
            </p>
          </div>

          {/* Q2. Qu'est-ce qui fonctionne ? */}
          <div className="bg-[#020919] border border-white/10 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-emerald-400">2. Qu'est-ce qui fonctionne ?</span>
            <p className="text-xs text-gray-300 leading-relaxed">
              {d.topServicesByRevenue && d.topServicesByRevenue.length > 0 && (d.topServicesByRevenue[0]?.totalRevenue ?? 0) > 0
                ? `Le service phare est "${d.topServicesByRevenue[0].serviceTitle}" avec ${(d.topServicesByRevenue[0]?.totalRevenue ?? 0).toLocaleString()} FCFA encaissés.`
                : d.topServicesByDemand && d.topServicesByDemand.length > 0
                ? `Le service le plus attractif est "${d.topServicesByDemand[0].serviceTitle}" avec ${d.topServicesByDemand[0].requestCount} demandes.`
                : `Votre profil d'entreprise est actif et prêt à enregistrer de nouvelles affaires.`}
            </p>
          </div>

          {/* Q3. Qu'est-ce qui baisse ou freine ? */}
          <div className="bg-[#020919] border border-white/10 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-amber-400">3. Qu'est-ce qui baisse ou freine ?</span>
            <p className="text-xs text-gray-300 leading-relaxed">
              {d.evolution?.revenue?.status === 'DECREASE'
                ? `Chiffre d'affaires en recul de ${d.evolution.revenue.growthLabel} sur cette période.`
                : d.requests.rejected > 0
                ? `${d.requests.rejected} demande(s) refusée(s) pouvant représenter un manque à gagner.`
                : d.requests.pending > 0
                ? `${d.requests.pending} demande(s) en attente de réponse pouvant ralentir la conversion.`
                : `Aucun frein majeur relevé sur la période actuelle.`}
            </p>
          </div>

          {/* Q4. D'où viennent mes clients ? */}
          <div className="bg-[#020919] border border-white/10 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-indigo-400">4. D'où viennent mes clients ?</span>
            <p className="text-xs text-gray-300 leading-relaxed">
              {d.locations && d.locations.length > 0
                ? `Bassin principal : ${d.locations.slice(0, 2).map((l) => `${l.location} (${l.percentage}%)`).join(', ')}.`
                : `Localisation générale de votre zone de chalandise.`}
            </p>
          </div>

          {/* Q5. Quels services sont demandés ? */}
          <div className="bg-[#020919] border border-white/10 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-[#FB8205]">5. Services les plus demandés</span>
            <p className="text-xs text-gray-300 leading-relaxed">
              {d.topServicesByDemand && d.topServicesByDemand.length > 0
                ? `1er : "${d.topServicesByDemand[0].serviceTitle}" (${d.topServicesByDemand[0].requestCount} dem.) ${
                    d.topServicesByDemand[1] ? `| 2e : "${d.topServicesByDemand[1].serviceTitle}"` : ''
                  }`
                : `Aucun service spécifique ciblé pour le moment.`}
            </p>
          </div>

          {/* Q6. Où dois-je agir ? */}
          <div className="bg-[#020919] border border-white/10 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-purple-400">6. Où dois-je agir ?</span>
            <p className="text-xs text-gray-300 leading-relaxed">
              {d.healthScore.missingProfileFields && d.healthScore.missingProfileFields.length > 0
                ? `Complétez votre profil (${d.healthScore.missingProfileFields.slice(0, 2).join(', ')}).`
                : d.requests.pending > 0
                ? `Répondez aux ${d.requests.pending} demande(s) en attente pour booster votre conversion.`
                : d.peakDay
                ? `Renforcez vos effectifs et disponibilités le ${d.peakDay.dayName} (pic de trafic).`
                : `Maintenez votre réactivité exemplaire (${d.averageResponseTimeLabel}).`}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Business Health Score (Score de Santé Explicable) */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0BE9EF]" />
              <h4 className="text-base font-bold text-white">Business Health Score</h4>
              <Badge
                variant={
                  d.healthScore.overall >= 80 ? 'success' : d.healthScore.overall >= 60 ? 'orange' : 'warning'
                }
              >
                {d.healthScore.overall >= 80 ? 'Excellent' : d.healthScore.overall >= 60 ? 'Bon' : 'À améliorer'}
              </Badge>
            </div>
            <p className="text-xs text-gray-400">{d.healthScore.summary}</p>
          </div>

          <div className="flex items-center gap-4 bg-[#020919] border border-white/10 px-5 py-3 rounded-xl self-start lg:self-auto">
            <div className="text-3xl font-black text-white font-mono">{d.healthScore.overall}</div>
            <div className="text-xs text-gray-400 leading-tight">
              <div>Score Global</div>
              <div className="text-[10px] text-gray-500">sur 100 points</div>
            </div>
          </div>
        </div>

        {/* Détail des 5 piliers explicables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-6">
          {/* 1. Profil */}
          <div className="bg-[#020919] border border-white/5 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Complétude Profil</span>
              <span className="font-bold text-white font-mono">{d.healthScore.profileScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${d.healthScore.profileScore}%` }}
              />
            </div>
            {d.healthScore.missingProfileFields && d.healthScore.missingProfileFields.length > 0 ? (
              <p className="text-[10px] text-amber-400">
                Manque : {d.healthScore.missingProfileFields.slice(0, 1)[0]}
              </p>
            ) : (
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Profil 100% complet
              </p>
            )}
          </div>

          {/* 2. Activité */}
          <div className="bg-[#020919] border border-white/5 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Activité & Demandes</span>
              <span className="font-bold text-white font-mono">{d.healthScore.activityScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FB8205] rounded-full"
                style={{ width: `${d.healthScore.activityScore}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400">
              {d.requests.completed} prestation(s) terminée(s)
            </p>
          </div>

          {/* 3. Réputation */}
          <div className="bg-[#020919] border border-white/5 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Réputation & Avis</span>
              <span className="font-bold text-white font-mono">{d.healthScore.reputationScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${d.healthScore.reputationScore}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400">
              {d.reviews.totalReviews > 0
                ? `${d.reviews.averageRating}/5 (${d.reviews.totalReviews} avis)`
                : 'Pas encore d\'avis'}
            </p>
          </div>

          {/* 4. Réactivité */}
          <div className="bg-[#020919] border border-white/5 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Réactivité Messages</span>
              <span className="font-bold text-white font-mono">{d.healthScore.responsivenessScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${d.healthScore.responsivenessScore}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400">
              Délai moyen : <strong className="text-white">{d.averageResponseTimeLabel}</strong>
            </p>
          </div>

          {/* 5. Financier */}
          <div className="bg-[#020919] border border-white/5 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Paiements Validés</span>
              <span className="font-bold text-white font-mono">{d.healthScore.financialScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full"
                style={{ width: `${d.healthScore.financialScore}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400">
              {d.revenue.confirmedPaymentsCount} encaissement(s) confirmé(s)
            </p>
          </div>
        </div>
      </div>

      {/* 6. DISTRIBUTION TEMPORELLE & GÉOGRAPHIQUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activité par jour de la semaine */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-white">Activité par Jour</h4>
              <p className="text-xs text-gray-400">Volume de demandes réparties par jour</p>
            </div>
            {d.peakDay && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Pic : {d.peakDay.dayName}
              </span>
            )}
          </div>

          {d.activityByDay && d.activityByDay.length > 0 ? (
            <div className="space-y-2 pt-1">
              {d.activityByDay.map((day) => (
                <div key={day.dayName} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-gray-400 font-medium truncate">{day.dayName}</span>
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        d.peakDay?.dayName === day.dayName ? 'bg-[#FB8205]' : 'bg-cyan-500/60'
                      }`}
                      style={{ width: `${day.percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono font-bold text-white">
                    {day.count} <span className="text-[10px] text-gray-500 font-normal">({day.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-500">Pas encore d'activité hebdomadaire enregistrée.</div>
          )}
        </div>

        {/* Créneaux horaires d'affluence */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-white">Créneaux d'Affluence</h4>
              <p className="text-xs text-gray-400">Horaires de forte sollicitation</p>
            </div>
            {d.peakHour && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FB8205]/10 text-[#FB8205] border border-[#FB8205]/20">
                Pointe : {d.peakHour.slot.split(' ')[0]}
              </span>
            )}
          </div>

          {d.activityByHour && d.activityByHour.length > 0 ? (
            <div className="space-y-3 pt-1">
              {d.activityByHour.map((slot) => (
                <div key={slot.slot} className="p-3 bg-[#020919] border border-white/5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">{slot.slot}</span>
                    <span className="font-mono font-bold text-white">{slot.count} dem. ({slot.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        d.peakHour?.slot === slot.slot ? 'bg-emerald-400' : 'bg-cyan-400/50'
                      }`}
                      style={{ width: `${slot.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-500">Pas encore de créneaux consolidés.</div>
          )}
        </div>

        {/* Localisation des clients */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-white">Origine des Clients</h4>
              <p className="text-xs text-gray-400">Villes et quartiers des demandes</p>
            </div>
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>

          {d.locations && d.locations.length > 0 ? (
            <div className="space-y-2 pt-1">
              {d.locations.slice(0, 5).map((loc, idx) => (
                <div key={idx} className="p-2.5 bg-[#020919] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-gray-300 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-white font-semibold">{loc.location}</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-bold">
                    {loc.count} dem. ({loc.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-500">
              Localisation générale. Renseignez la ville sur vos demandes pour visualiser la géographie de vos clients.
            </div>
          )}
        </div>
      </div>

      {/* 7. PERFORMANCE CROISÉE DU CATALOGUE : DEMANDE vs RENTABILITÉ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services les plus demandés */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-white">Services les Plus Demandés</h4>
              <p className="text-xs text-gray-400">Classement par volume de sollicitations clients</p>
            </div>
            <Package className="w-5 h-5 text-[#FB8205]" />
          </div>

          {(!d.topServicesByDemand || d.topServicesByDemand.length === 0) ? (
            <div className="py-8 text-center text-gray-500 text-xs bg-[#020919] rounded-xl border border-white/5">
              Pas encore de demandes ciblées sur votre catalogue.
            </div>
          ) : (
            <div className="space-y-3">
              {d.topServicesByDemand.slice(0, 5).map((s, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#020919] border border-white/5 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FB8205]/20 text-[#FB8205] flex items-center justify-center text-xs font-bold font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-white block">{s.serviceTitle}</span>
                      <span className="text-[11px] text-gray-400">
                        {s.completedCount} prestation(s) terminée(s)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#FB8205] block font-mono">
                      {s.requestCount} demande(s)
                    </span>
                    {s.totalRevenue > 0 && (
                      <span className="text-[11px] font-mono text-emerald-400">
                        {(s.totalRevenue ?? 0).toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Services les plus rentables */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-white">Services les Plus Rentables</h4>
              <p className="text-xs text-gray-400">Classement par chiffre d'affaires total encaissé</p>
            </div>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>

          {(!d.topServicesByRevenue || d.topServicesByRevenue.length === 0 || d.topServicesByRevenue.every((s) => s.totalRevenue === 0)) ? (
            <div className="py-8 text-center text-gray-500 text-xs bg-[#020919] rounded-xl border border-white/5">
              Pas encore d'encaissements ventilés par prestation sur cette période.
            </div>
          ) : (
            <div className="space-y-3">
              {d.topServicesByRevenue.slice(0, 5).map((s, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#020919] border border-white/5 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-white block">{s.serviceTitle}</span>
                      <span className="text-[11px] text-gray-400">
                        {s.requestCount} demande(s) au catalogue
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">
                      {(s.totalRevenue ?? 0).toLocaleString()} FCFA
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {s.completedCount} réalisée(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 8. ENTONNOIR DE CONVERSION COMMERCIAL & PROJECTION DE REVENUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entonnoir */}
        <div className="lg:col-span-2 bg-[#0A1428] border border-white/10 rounded-2xl p-6">
          <h4 className="text-base font-bold text-white mb-1">Entonnoir de Conversion Commercial</h4>
          <p className="text-xs text-gray-400 mb-6">
            Mesure exacte du passage de la demande initiale à la concrétisation des prestations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Étape 1 */}
            <div className="bg-[#020919] border border-white/10 rounded-xl p-4 relative">
              <div className="text-[11px] text-gray-400 font-semibold uppercase">1. Demandes Reçues</div>
              <div className="text-2xl font-black text-white mt-1 font-mono">{d.funnel.totalRequests}</div>
              <div className="text-[11px] text-gray-500 mt-2">Point d'entrée principal</div>
            </div>

            {/* Étape 2 */}
            <div className="bg-[#020919] border border-white/10 rounded-xl p-4 relative">
              <div className="text-[11px] text-gray-400 font-semibold uppercase">2. Demandes Acceptées</div>
              <div className="text-2xl font-black text-[#FB8205] mt-1 font-mono">
                {d.funnel.acceptedRequests}
              </div>
              <div className="text-[11px] text-[#FB8205] font-semibold mt-2">
                Taux d'acceptation : {d.funnel.acceptanceRate}%
              </div>
            </div>

            {/* Étape 3 */}
            <div className="bg-[#020919] border border-white/10 rounded-xl p-4 relative">
              <div className="text-[11px] text-gray-400 font-semibold uppercase">3. Réservations / RDV</div>
              <div className="text-2xl font-black text-[#0BE9EF] mt-1 font-mono">
                {d.funnel.bookingsCount}
              </div>
              <div className="text-[11px] text-[#0BE9EF] font-semibold mt-2">
                Taux de réservation : {d.funnel.bookingRate}%
              </div>
            </div>

            {/* Étape 4 */}
            <div className="bg-[#020919] border border-emerald-500/30 rounded-xl p-4 relative">
              <div className="text-[11px] text-emerald-400 font-semibold uppercase">4. Prestations Terminées</div>
              <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                {d.funnel.completedInteractions}
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold mt-2">
                Conversion finale : {d.funnel.finalConversionRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Projection / Prédiction de Run-Rate */}
        <div className="bg-gradient-to-br from-[#0A1428] to-[#122340] border border-cyan-500/30 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400 flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4" />
                Projection Indicative
              </span>
              {d.prediction?.hasEnoughData && (
                <Badge variant={d.prediction.trend === 'UP' ? 'success' : d.prediction.trend === 'DOWN' ? 'warning' : 'cyan'}>
                  {d.prediction.confidenceLabel}
                </Badge>
              )}
            </div>

            <h4 className="text-lg font-bold text-white">Estimation Mois Prochain</h4>

            {d.prediction?.hasEnoughData ? (
              <div className="space-y-3">
                <div className="p-4 bg-[#020919]/70 border border-white/10 rounded-xl space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Fourchette Estimée</span>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {d.prediction.estimatedFormatted}
                  </div>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {d.prediction.methodology}
                </p>
              </div>
            ) : (
              <div className="py-6 text-center text-gray-400 text-xs space-y-2">
                <p className="font-semibold text-gray-300">Données insuffisantes</p>
                <p className="text-[11px] text-gray-500">
                  {d.prediction?.disclaimer || 'Nécessite au moins 2 transactions terminées pour établir un modèle de run-rate linéaire.'}
                </p>
              </div>
            )}
          </div>

          <div className="text-[10px] text-gray-500 pt-4 border-t border-white/10 mt-4 leading-normal">
            Avertissement : Projection mathématique basée sur le rythme actuel réel. Ne constitue pas une garantie de revenus.
          </div>
        </div>
      </div>

      {/* 9. Top Clients & Client de l'année */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client de l'année */}
        <div className="bg-gradient-to-br from-[#0A1428] to-[#122340] border border-[#FB8205]/40 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#FB8205]">
              <Award className="w-5 h-5" />
              <span className="text-xs uppercase font-extrabold tracking-wider">Distinction Annuelle</span>
            </div>
            <h4 className="text-lg font-bold text-white">Client de l'Année</h4>

            {d.clientOfTheYear.isEligible && d.clientOfTheYear.client ? (
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-[#020919]/60 border border-white/10 space-y-1">
                  <div className="text-lg font-black text-white">{d.clientOfTheYear.client.clientName}</div>
                  <div className="text-xs text-gray-400 font-mono">{d.clientOfTheYear.client.clientPhone}</div>
                </div>
                <div className="text-xs text-gray-300 leading-relaxed">
                  {d.clientOfTheYear.reason}
                </div>
                <div className="flex items-center gap-4 text-xs pt-1">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Total réglé</span>
                    <span className="text-[#10D97F] font-bold font-mono">
                      {(d.clientOfTheYear.client.totalPaid ?? 0).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Prestations</span>
                    <span className="text-cyan-400 font-bold">
                      {d.clientOfTheYear.client.completedInteractions} terminées
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-gray-400 text-xs">
                <p className="font-semibold text-gray-300">Pas encore assez de données.</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Le Client de l'année est attribué automatiquement dès qu'un client confirme des prestations réelles.
                </p>
              </div>
            )}
          </div>

          <div className="text-[10px] text-gray-500 pt-4 border-t border-white/10 mt-4">
            Critères d'attribution : Volume des paiements confirmés et assiduité des interactions.
          </div>
        </div>

        {/* Top 5 Clients */}
        <div className="lg:col-span-2 bg-[#0A1428] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-white">Clients les Plus Actifs</h4>
              <p className="text-xs text-gray-400">Classement basé sur les interactions et dépenses réelles</p>
            </div>
          </div>

          {d.topCustomers.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-xs bg-[#020919] rounded-xl border border-white/5">
              Aucun client enregistré sur cette période.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 pb-2">
                    <th className="pb-3 font-semibold">Client</th>
                    <th className="pb-3 font-semibold">Téléphone</th>
                    <th className="pb-3 font-semibold text-center">Demandes</th>
                    <th className="pb-3 font-semibold text-center">Terminées</th>
                    <th className="pb-3 font-semibold text-right">Total Réglé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {d.topCustomers.map((c, i) => (
                    <tr key={c.clientId || i} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-semibold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white/10 text-gray-300 flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </span>
                        {c.clientName}
                      </td>
                      <td className="py-3 font-mono text-gray-400">{c.clientPhone || '—'}</td>
                      <td className="py-3 text-center text-gray-300">{c.totalRequests}</td>
                      <td className="py-3 text-center text-cyan-400 font-semibold">
                        {c.completedInteractions}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-400">
                        {(c.totalPaid ?? 0).toLocaleString()} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 10. Avis, Réputation & Satisfaction Réelle */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <h4 className="text-base font-bold text-white">Réputation, Avis & Satisfaction</h4>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {d.satisfactionRateLabel || 'Avis vérifiés collectés auprès de vos clients réels'}
            </p>
          </div>
          {d.satisfactionRate !== null && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {d.satisfactionRate}% de satisfaction positive
            </span>
          )}
        </div>

        {d.reviews.totalReviews === 0 ? (
          <div className="py-8 text-center text-gray-500 text-xs bg-[#020919] rounded-xl border border-white/5">
            Aucun avis client pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="flex items-center gap-4 bg-[#020919] p-5 rounded-xl border border-white/5">
              <div className="text-4xl font-black text-amber-400 font-mono">
                {d.reviews.averageRating}
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(d.reviews.averageRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400 mt-1 block">
                  Basé sur {d.reviews.totalReviews} avis client(s) vérifié(s)
                </span>
              </div>
            </div>

            {/* Répartition des étoiles */}
            <div className="lg:col-span-2 space-y-2 text-xs bg-[#020919] p-5 rounded-xl border border-white/5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = (d.reviews.ratingDistribution as any)[stars] || 0;
                const pct =
                  d.reviews.totalReviews > 0
                    ? Math.round((count / d.reviews.totalReviews) * 100)
                    : 0;
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-gray-400 w-8">{stars} ★</span>
                    <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-gray-400 font-mono text-[11px] w-12 text-right">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 11. Modal Diagnostic Approfondi IA */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A1428] border border-cyan-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Diagnostic Exécutif Approfondi</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {aiLoading ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-white font-semibold">Analyse de vos flux opérationnels en cours...</p>
                  <p className="text-gray-400">Examen des délais, de la rentabilité du catalogue et du profil client.</p>
                </div>
              ) : aiResponse ? (
                <div className="space-y-4">
                  {/* Bilan global */}
                  <div className="p-4 bg-[#020919] border border-cyan-500/20 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">État Général de l'Activité</span>
                    <p className="text-gray-200 leading-relaxed text-sm">
                      {aiResponse.activityAssessment}
                    </p>
                  </div>

                  {/* Ce qui fonctionne */}
                  <div className="p-4 bg-[#020919] border border-emerald-500/20 rounded-xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Points Forts Validés
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {aiResponse.whatWorks?.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Ce qui baisse ou requiert de la vigilance */}
                  <div className="p-4 bg-[#020919] border border-amber-500/20 rounded-xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Points de Vigilance
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {aiResponse.whatDeclines?.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions prioritaires */}
                  <div className="p-4 bg-[#020919] border border-purple-500/20 rounded-xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      Actions Recommandées
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {aiResponse.whereToAct?.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Réponse personnalisée si question posée */}
                  {aiResponse.customQuestionResponse && (
                    <div className="p-4 bg-cyan-950/40 border border-cyan-500/40 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">Réponse à votre question</span>
                      <p className="text-white font-medium">{aiResponse.customQuestionResponse}</p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Formulaire de question custom */}
              <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Posez une question sur votre rentabilité, vos heures creuses..."
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && customQuestion.trim() && handleOpenAiDiagnostic(customQuestion)}
                  className="flex-1 px-3 py-2 bg-[#020919] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                />
                <button
                  disabled={!customQuestion.trim() || aiLoading}
                  onClick={() => handleOpenAiDiagnostic(customQuestion)}
                  className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Analyser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 12. Modal Rapport Structuré Exportable */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A1428] border border-white/20 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Rapport Officiel d'Activité Flowexa</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  title="Imprimer le rapport"
                  className="p-1.5 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownloadReportJson}
                  title="Télécharger en JSON"
                  className="p-1.5 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-300 print:text-black">
              {reportLoading ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#FB8205] animate-spin mx-auto" />
                  <p className="text-white font-semibold">Compilation du rapport certifié...</p>
                </div>
              ) : reportData ? (
                <div className="space-y-6">
                  {/* En-tête Rapport */}
                  <div className="border-b border-white/10 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-black text-white">{reportData.metadata.reportTitle}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Période : {reportData.metadata.period} | Devise : {reportData.metadata.currency}</p>
                      </div>
                      <span className="text-[11px] font-mono text-gray-500">
                        Généré le {new Date(reportData.metadata.generatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {/* Synthèse exécutive */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#020919] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-400 uppercase">Health Score</span>
                      <div className="text-xl font-black text-white font-mono">{reportData.executiveSummary.healthScore}/100</div>
                      <span className="text-[10px] text-cyan-400 font-semibold">{reportData.executiveSummary.healthStatus}</span>
                    </div>
                    <div className="bg-[#020919] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-400 uppercase">Chiffre d'Affaires</span>
                      <div className="text-xl font-black text-emerald-400 font-mono">{(reportData.executiveSummary?.totalGrossRevenue ?? 0).toLocaleString()} F</div>
                      <span className="text-[10px] text-gray-400">Net : {(reportData.executiveSummary?.netRevenue ?? 0).toLocaleString()} F</span>
                    </div>
                    <div className="bg-[#020919] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-400 uppercase">Demandes Totales</span>
                      <div className="text-xl font-black text-[#FB8205] font-mono">{reportData.executiveSummary.totalRequests}</div>
                      <span className="text-[10px] text-gray-400">{reportData.executiveSummary.acceptanceRateLabel}</span>
                    </div>
                    <div className="bg-[#020919] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-400 uppercase">Prestations Conclues</span>
                      <div className="text-xl font-black text-cyan-400 font-mono">{reportData.executiveSummary.completedInteractions}</div>
                      <span className="text-[10px] text-gray-400">Terminées</span>
                    </div>
                  </div>

                  {/* Résumé de santé */}
                  <div className="p-4 bg-[#020919] rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-white block mb-1">Diagnostic de Santé Opérationnelle</span>
                    <p className="text-xs text-gray-300 leading-relaxed">{reportData.executiveSummary.healthSummary}</p>
                  </div>

                  {/* Performances Catalogue */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-white block">Prestations Dominantes</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-[#020919] rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#FB8205] uppercase font-bold block mb-1">Plus Demandé</span>
                        <div className="text-white font-semibold">{reportData.catalogPerformance.topByDemand?.[0]?.serviceTitle || 'N/A'}</div>
                        <span className="text-[10px] text-gray-400">{reportData.catalogPerformance.topByDemand?.[0]?.requestCount || 0} demandes</span>
                      </div>
                      <div className="p-3 bg-[#020919] rounded-xl border border-white/5">
                        <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Plus Rentable</span>
                        <div className="text-white font-semibold">{reportData.catalogPerformance.topByRevenue?.[0]?.serviceTitle || 'N/A'}</div>
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold">{(reportData.catalogPerformance.topByRevenue?.[0]?.totalRevenue || 0).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>

                  {/* Insights & Actions */}
                  {reportData.keyInsights && reportData.keyInsights.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-white block">Enseignements Clés du Système</span>
                      <ul className="list-disc list-inside space-y-1 text-gray-300 bg-[#020919] p-3 rounded-xl border border-white/5">
                        {reportData.keyInsights.map((ins: string, idx: number) => (
                          <li key={idx}>{ins}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
