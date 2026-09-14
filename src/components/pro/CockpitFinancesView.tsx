import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { flowexaApi } from '../../services/api';

interface CockpitFinancesViewProps {
  businessId: string;
  businessName: string;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const CockpitFinancesView: React.FC<CockpitFinancesViewProps> = ({
  businessId,
  businessName,
  onShowToast,
}) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'PAID' | 'PARTIALLY_PAID'>('all');

  const fetchFinances = async () => {
    setLoading(true);
    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        flowexaApi.getPayments(undefined, { role: 'BUSINESS_OWNER', businessId }),
        flowexaApi.getCockpitSummary(businessId),
      ]);

      if (paymentsRes.success && Array.isArray(paymentsRes.data)) {
        setPayments(paymentsRes.data);
      }
      if (summaryRes.success && summaryRes.data) {
        setMetrics(summaryRes.data);
      }
    } catch (e) {
      console.error(e);
      onShowToast('Erreur', 'Impossible de charger les données financières.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, [businessId]);

  const totalCollected = payments.reduce(
    (sum, p) => sum + (p.status === 'SUCCESS' ? p.amount || 0 : 0),
    0
  );

  const pendingAmount = metrics?.pendingPaymentsTotal || 0;

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="success" dot>
              Trésorerie & Encaissements
            </Badge>
            <span className="text-xs text-gray-400">Établissement : {businessName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Paiements, Acomptes & Recettes</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Suivi des transactions réelles, soldes à percevoir et moyens de paiement.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchFinances}
          className="text-xs border-white/10"
        >
          Actualiser les comptes
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Total Encaissé Réel</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {(totalCollected ?? 0).toLocaleString()} FCFA
          </p>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3" />
            Transactions validées avec succès
          </span>
        </div>

        <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Solde Restant à Percevoir</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#FB8205] mt-2">
            {(pendingAmount ?? 0).toLocaleString()} FCFA
          </p>
          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-1">
            {metrics?.pendingPaymentsCount || 0} prestation(s) avec solde à l'arrivée
          </span>
        </div>

        <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Recettes Aujourd'hui</span>
            <div className="p-2 rounded-xl bg-[#0BE9EF]/10 text-[#0BE9EF]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0BE9EF] mt-2">
            {(metrics?.todayRevenue || 0).toLocaleString()} FCFA
          </p>
          <span className="text-[11px] text-gray-400 font-medium mt-1 block">
            Flux de caisse du jour
          </span>
        </div>
      </div>

      {/* Transactions list */}
      <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Historique des Règlements Encaissés ({payments.length})
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mobile Money MTN & Moov intégrés</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            <Clock className="w-6 h-6 text-[#FB8205] animate-spin mx-auto mb-2" />
            Chargement des transactions...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            Aucun paiement enregistré pour le moment.
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((pm) => (
              <div
                key={pm.id}
                className="p-4 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{pm.title || 'Paiement de prestation'}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>Réf: <strong className="font-mono text-gray-300">{pm.id}</strong></span>
                      <span>•</span>
                      <span>Client: <strong className="text-white">{pm.clientName || 'Client'}</strong></span>
                      <span>•</span>
                      <span>Canal: <strong className="text-emerald-400 font-mono">{pm.paymentMethod || 'Mobile Money'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-base font-bold text-white">
                    {(pm.amount || 0).toLocaleString()} {pm.currency || 'FCFA'}
                  </p>
                  <Badge variant={pm.status === 'SUCCESS' ? 'success' : 'orange'}>
                    {pm.status === 'SUCCESS' ? 'Encaissé' : 'En attente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
