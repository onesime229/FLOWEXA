import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Building2,
  Users,
  Inbox,
  Calendar,
  Star,
  RefreshCw,
  AlertCircle,
  Filter,
  Layers,
} from 'lucide-react';
import { flowexaApi } from '../../services/api';
import type { AnalyticsPeriod, SuperAdminAnalyticsResponse } from '../../types';
import { FLOWEXA_MODULES } from '../../data/mockData';

export const SuperAdminAnalyticsView: React.FC = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30D');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<SuperAdminAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await flowexaApi.getAdminAnalytics({
        period,
        module_code: selectedModule || undefined,
      });

      if (res.success && res.data) {
        setData(res.data as SuperAdminAnalyticsResponse);
      } else {
        setError(res.error || 'Erreur lors du chargement des statistiques de la plateforme.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminAnalytics();
  }, [period, selectedModule]);

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
        <RefreshCw className="w-8 h-8 text-[#0BE9EF] animate-spin" />
        <p className="text-sm font-semibold text-white">Calcul des métriques globales Flowexa...</p>
        <p className="text-xs text-gray-400">Consolidation de tous les établissements et paiements enregistrés.</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-[#0A1428] border border-red-500/20 rounded-2xl p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-xs text-red-300">{error}</p>
        <button
          onClick={fetchAdminAnalytics}
          className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-semibold"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const d = data!;

  return (
    <div className="space-y-6">
      {/* Filtres Période et Module */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Statistiques Globales Plateforme</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#0BE9EF]/20 text-[#0BE9EF] font-bold">
              SUPER ADMIN
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Agrégation temps réel multi-entreprises, volume transactionnel réel et activité écosystème.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sélecteur de module */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="bg-[#020919] border border-white/10 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-[#FB8205]"
          >
            <option value="">Tous les métiers</option>
            {FLOWEXA_MODULES.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Sélecteur de période */}
          <div className="flex items-center gap-1 bg-[#020919] border border-white/10 p-1 rounded-xl">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-[#0BE9EF] text-[#020919] font-bold shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={fetchAdminAnalytics}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all ml-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0BE9EF]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Cartes KPI Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Volume Financier Net */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Volume Net Transigé</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {(d.financialMetrics?.netVolume ?? 0).toLocaleString()} {d.financialMetrics?.currency || 'FCFA'}
          </div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>Volume Brut :</span>
            <span className="text-white font-mono">{(d.financialMetrics?.totalGrossVolume ?? 0).toLocaleString()} F</span>
          </div>
          {(d.financialMetrics?.totalRefunded ?? 0) > 0 && (
            <div className="text-[11px] text-amber-400 mt-0.5 flex items-center justify-between">
              <span>Remboursements :</span>
              <span className="font-mono">-{(d.financialMetrics?.totalRefunded ?? 0).toLocaleString()} F</span>
            </div>
          )}
        </div>

        {/* Entreprises */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Établissements</span>
            <div className="w-8 h-8 rounded-lg bg-[#FB8205]/10 text-[#FB8205] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">{d.totalBusinesses}</div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>Établissements Actifs :</span>
            <span className="text-emerald-400 font-semibold">{d.activeBusinesses}</span>
          </div>
        </div>

        {/* Demandes & Réservations */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Demandes & Flux</span>
            <div className="w-8 h-8 rounded-lg bg-[#0BE9EF]/10 text-[#0BE9EF] flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">{d.totalRequests}</div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>Réservations / RDV :</span>
            <span className="text-cyan-400 font-semibold">{d.totalBookings + d.totalAppointments}</span>
          </div>
        </div>

        {/* Clients & Réputation */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Clients & Confiance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">{d.totalClients}</div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>Note moyenne :</span>
            <span className="text-amber-400 font-semibold">{d.reviewsMetrics.globalAverageRating} / 5</span>
          </div>
        </div>
      </div>

      {/* Répartition par métier / module */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6">
        <h4 className="text-base font-bold text-white mb-1">Activité et Recettes par Catégorie Métier</h4>
        <p className="text-xs text-gray-400 mb-4">Volume d'établissements et chiffre d'affaires consolidé par secteur</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {d.businessesByModule.map((bm) => (
            <div key={bm.moduleCode} className="bg-[#020919] border border-white/5 rounded-xl p-4 space-y-1">
              <span className="text-xs font-semibold text-gray-300 block">{bm.moduleCode}</span>
              <div className="text-lg font-bold text-white font-mono">
                {bm.count} <span className="text-xs text-gray-400 font-normal">entreprise(s)</span>
              </div>
              <div className="text-xs text-emerald-400 font-mono">
                {(bm.revenue ?? 0) > 0 ? `${(bm.revenue ?? 0).toLocaleString()} FCFA` : '0 FCFA'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
