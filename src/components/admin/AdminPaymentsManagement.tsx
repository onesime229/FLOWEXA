import React, { useState, useEffect } from 'react';
import {
  Banknote,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  Download,
  Receipt,
  PiggyBank,
  Check,
  X,
  Eye,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { FlowexaPaymentItem, FlowexaTransactionItem, PaymentStatus, PaymentType, PaymentProviderCode } from '../../types';
import { flowexaApi } from '../../services/api';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Modal } from '../design-system/Modal';

export interface AdminPaymentsManagementProps {
  onShowToast?: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AdminPaymentsManagement: React.FC<AdminPaymentsManagementProps> = ({ onShowToast }) => {
  const [activeSubView, setActiveSubView] = useState<'PAYMENTS' | 'TRANSACTIONS'>('PAYMENTS');
  const [payments, setPayments] = useState<FlowexaPaymentItem[]>([]);
  const [transactions, setTransactions] = useState<FlowexaTransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal Détails
  const [selectedPayment, setSelectedPayment] = useState<FlowexaPaymentItem | null>(null);
  const [paymentTransactions, setPaymentTransactions] = useState<FlowexaTransactionItem[]>([]);

  // Modal Remboursement
  const [refundModalPayment, setRefundModalPayment] = useState<FlowexaPaymentItem | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  // Métriques
  const [metrics, setMetrics] = useState({
    totalVolume: 0,
    totalRefunded: 0,
    netVolume: 0,
    successfulCount: 0,
    processingCount: 0,
    failedCount: 0,
    refundedCount: 0,
    depositCount: 0,
    fullCount: 0,
    balanceCount: 0,
    currency: 'FCFA',
  });

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [payRes, txRes] = await Promise.all([
        flowexaApi.getAdminPayments(),
        flowexaApi.getAdminTransactions(),
      ]);

      if (payRes.success && Array.isArray(payRes.data)) {
        setPayments(payRes.data);
        if (payRes.metrics) {
          setMetrics(payRes.metrics);
        }
      }

      if (txRes.success && Array.isArray(txRes.data)) {
        setTransactions(txRes.data);
      }
    } catch (err) {
      console.error('[AdminPayments] Error fetching data:', err);
      if (onShowToast) {
        onShowToast('Erreur', 'Impossible de charger les données financières.', 'error');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrage des paiements
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.reference && p.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.clientName && p.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.businessName && p.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.clientPhone && p.clientPhone.includes(searchQuery));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesProvider = providerFilter === 'ALL' || p.provider === providerFilter;
    const matchesType = typeFilter === 'ALL' || p.paymentType === typeFilter;

    return matchesSearch && matchesStatus && matchesProvider && matchesType;
  });

  // Filtrage des transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      (tx.id && tx.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.transactionReference && tx.transactionReference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.externalReference && tx.externalReference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.clientName && tx.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.businessName && tx.businessName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
    const matchesProvider = providerFilter === 'ALL' || tx.provider === providerFilter;

    return matchesSearch && matchesStatus && matchesProvider;
  });

  const handleOpenDetails = async (payment: FlowexaPaymentItem) => {
    setSelectedPayment(payment);
    const relatedTx = transactions.filter((tx) => tx.paymentId === payment.id || tx.bookingId === payment.bookingId);
    setPaymentTransactions(relatedTx);
  };

  const handleOpenRefundModal = (payment: FlowexaPaymentItem) => {
    setRefundModalPayment(payment);
    const maxRefundable = Math.max(0, (payment.amount || 0) - (payment.refundAmount || 0));
    setRefundAmount(String(maxRefundable));
    setRefundReason('');
    setRefundError(null);
  };

  const handleSubmitRefund = async () => {
    if (!refundModalPayment) return;
    const amt = parseFloat(refundAmount);
    const maxRefundable = Math.max(0, (refundModalPayment.amount || 0) - (refundModalPayment.refundAmount || 0));

    if (isNaN(amt) || amt <= 0) {
      setRefundError('Veuillez spécifier un montant positif valide.');
      return;
    }
    if (amt > maxRefundable) {
      setRefundError(`Le montant ne peut excéder le solde remboursable de ${maxRefundable.toLocaleString()} ${refundModalPayment.currency}.`);
      return;
    }
    if (!refundReason.trim()) {
      setRefundError('Le motif du remboursement est obligatoire pour des raisons de conformité et d’audit.');
      return;
    }

    setIsSubmittingRefund(true);
    setRefundError(null);

    try {
      const res = await flowexaApi.refundPayment(
        refundModalPayment.id,
        {
          amount: amt,
          reason: refundReason.trim(),
        },
        { role: 'SUPER_ADMIN', userId: 'admin-super' }
      );

      if (res.success) {
        if (onShowToast) {
          onShowToast(
            'Remboursement Validé',
            `Le remboursement de ${amt.toLocaleString()} ${refundModalPayment.currency} a été consigné avec succès.`,
            'success'
          );
        }
        setRefundModalPayment(null);
        fetchData();
      } else {
        setRefundError(res.error || 'Erreur lors du traitement du remboursement.');
      }
    } catch (err: any) {
      setRefundError('Erreur de communication avec le serveur.');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  // Exporter en CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Référence', 'Date', 'Type', 'Statut', 'Montant', 'Devise', 'Remboursé', 'Passerelle', 'Client', 'Téléphone', 'Entreprise'];
    const rows = filteredPayments.map((p) => [
      p.id,
      p.reference,
      p.createdAt?.split('T')[0] || '',
      p.paymentType,
      p.status,
      p.amount,
      p.currency,
      p.refundAmount || 0,
      p.provider,
      `"${p.clientName || ''}"`,
      p.clientPhone || '',
      `"${p.businessName || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `flowexa_paiements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: PaymentStatus | string) => {
    switch (status) {
      case 'SUCCESS':
      case 'PAID':
        return <Badge variant="success">Payé / Validé</Badge>;
      case 'PROCESSING':
      case 'PENDING':
        return <Badge variant="warning">En attente</Badge>;
      case 'REFUNDED':
        return <Badge variant="primary">Remboursé</Badge>;
      case 'PARTIALLY_REFUNDED':
        return <Badge variant="orange">Remboursé Partiel</Badge>;
      case 'FAILED':
        return <Badge variant="danger">Échoué</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">Annulé</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getTypeBadge = (type?: PaymentType | string) => {
    switch (type) {
      case 'DEPOSIT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Acompte (30%)
          </span>
        );
      case 'BALANCE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Solde restant
          </span>
        );
      case 'FULL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Totalité (100%)
          </span>
        );
      case 'REFUND':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
            Remboursement
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-gray-300 border border-white/10">
            {type || 'Standard'}
          </span>
        );
    }
  };

  const getProviderName = (code: PaymentProviderCode | string) => {
    switch (code) {
      case 'KKIAPAY':
        return 'Kkiapay (MoMo, Moov, Celtis, Carte)';
      case 'MTN_MOMO':
        return 'MTN MoMo Direct';
      case 'MOOV_MONEY':
        return 'Moov Money Direct';
      case 'CELTIS_CASH':
        return 'Celtis Cash Direct';
      case 'CARD_VISA_MC':
        return 'Carte Bancaire Direct';
      default:
        return code;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête & Métriques Globales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1 font-medium">
            <span>Volume Encaissé</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-[#10D97F] font-mono">
            {(metrics.totalVolume ?? 0).toLocaleString()} F
          </div>
          <div className="text-[10px] text-gray-400 mt-1">{metrics.successfulCount} transactions réussies</div>
        </div>

        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1 font-medium">
            <span>Total Remboursé</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-black text-rose-400 font-mono">
            {(metrics.totalRefunded ?? 0).toLocaleString()} F
          </div>
          <div className="text-[10px] text-gray-400 mt-1">{metrics.refundedCount} remboursements</div>
        </div>

        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1 font-medium">
            <span>Volume Net</span>
            <DollarSign className="w-3.5 h-3.5 text-[#0BE9EF]" />
          </div>
          <div className="text-lg font-black text-[#0BE9EF] font-mono">
            {(metrics.netVolume ?? 0).toLocaleString()} F
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Après déductions</div>
        </div>

        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1 font-medium">
            <span>Acomptes</span>
            <PiggyBank className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-400 font-mono">
            {metrics.depositCount}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Acomptes versés</div>
        </div>

        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1 font-medium">
            <span>Paiements Totaux</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            {metrics.fullCount}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">100% réglés d'emblée</div>
        </div>

        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1 font-medium">
            <span>En Cours / Attente</span>
            <Clock className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="text-lg font-black text-orange-400 font-mono">
            {metrics.processingCount}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">{metrics.failedCount} échecs relevés</div>
        </div>
      </div>

      {/* Barre d'actions & sous-onglets */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubView('PAYMENTS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'PAYMENTS'
                  ? 'bg-[#FB8205] text-white shadow-md shadow-[#FB8205]/20'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Paiements & Commandes ({filteredPayments.length})
            </button>
            <button
              onClick={() => setActiveSubView('TRANSACTIONS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'TRANSACTIONS'
                  ? 'bg-[#FB8205] text-white shadow-md shadow-[#FB8205]/20'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Journal des Transactions ({filteredTransactions.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchData}
              disabled={isRefreshing}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Actualiser
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Barre de filtres */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 bg-[#020919] border border-white/10 rounded-xl px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Réf, client, téléphone, établissement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-gray-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#020919] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="SUCCESS">Succès / Payé</option>
            <option value="PROCESSING">En cours de traitement</option>
            <option value="PENDING">En attente</option>
            <option value="REFUNDED">Remboursé</option>
            <option value="PARTIALLY_REFUNDED">Partiellement remboursé</option>
            <option value="FAILED">Échoué</option>
            <option value="CANCELLED">Annulé</option>
          </select>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="bg-[#020919] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">Toutes les passerelles</option>
            <option value="KKIAPAY">Kkiapay (MoMo, Moov, Celtis, Carte)</option>
            <option value="MTN_MOMO">MTN Mobile Money</option>
            <option value="MOOV_MONEY">Moov Money</option>
            <option value="CELTIS_CASH">Celtis Cash</option>
            <option value="CARD_VISA_MC">Carte Bancaire</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#020919] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">Toutes les modalités</option>
            <option value="FULL">Paiement Total (100%)</option>
            <option value="DEPOSIT">Acompte</option>
            <option value="BALANCE">Solde restant</option>
            <option value="REFUND">Remboursement</option>
          </select>
        </div>
      </div>

      {/* 1. TABLEAU DES PAIEMENTS */}
      {activeSubView === 'PAYMENTS' && (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#020919] text-gray-400 uppercase font-semibold">
                <th className="p-3.5">Réf & Date</th>
                <th className="p-3.5">Client Émetteur</th>
                <th className="p-3.5">Établissement</th>
                <th className="p-3.5">Modalité</th>
                <th className="p-3.5">Montant Encaissé</th>
                <th className="p-3.5">Passerelle</th>
                <th className="p-3.5">Statut</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Chargement des transactions financières...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Aucun paiement ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const maxRefundable = Math.max(0, (p.amount || 0) - (p.refundAmount || 0));
                  const isPaid = p.status === 'SUCCESS' || p.status === 'PAID';

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          <span>#{p.reference}</span>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {p.createdAt ? new Date(p.createdAt).toLocaleString('fr-FR') : '-'}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{p.clientName || 'Client'}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{p.clientPhone || '-'}</div>
                      </td>
                      <td className="p-3.5 text-gray-300 font-medium">
                        {p.businessName || 'Établissement'}
                      </td>
                      <td className="p-3.5">
                        {getTypeBadge(p.paymentType)}
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-white">
                          {(p.amount ?? 0).toLocaleString()} {p.currency}
                        </div>
                        {p.refundAmount && p.refundAmount > 0 ? (
                          <div className="text-[10px] text-rose-400">
                            -{(p.refundAmount ?? 0).toLocaleString()} {p.currency} remboursé
                          </div>
                        ) : null}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold text-gray-300 border border-white/5">
                          {p.provider}
                        </span>
                      </td>
                      <td className="p-3.5">{getStatusBadge(p.status)}</td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDetails(p)}
                          className="h-7 px-2 text-xs"
                          leftIcon={<Eye className="w-3 h-3" />}
                        >
                          Détails
                        </Button>
                        {isPaid && maxRefundable > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenRefundModal(p)}
                            className="h-7 px-2 text-xs border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                            leftIcon={<RotateCcw className="w-3 h-3 text-rose-400" />}
                          >
                            Rembourser
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. TABLEAU DES TRANSACTIONS (JOURNAL COMPTABLE IMMUABLE) */}
      {activeSubView === 'TRANSACTIONS' && (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#020919] text-gray-400 uppercase font-semibold">
                <th className="p-3.5">ID Transaction</th>
                <th className="p-3.5">Horodatage</th>
                <th className="p-3.5">Réf Passerelle (Kkiapay)</th>
                <th className="p-3.5">Type & Sens</th>
                <th className="p-3.5">Montant</th>
                <th className="p-3.5">Passerelle</th>
                <th className="p-3.5">Statut Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Chargement du journal des transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Aucune transaction enregistrée dans le journal.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white">
                      {tx.id}
                      {tx.paymentId && (
                        <div className="text-[10px] text-gray-500 font-mono">Pmt: {tx.paymentId}</div>
                      )}
                    </td>
                    <td className="p-3.5 text-gray-400 text-[11px]">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-cyan-400">
                      {tx.externalReference || tx.transactionReference || 'Non attribuée'}
                    </td>
                    <td className="p-3.5">
                      {getTypeBadge(tx.paymentType)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-white">
                      {(tx.amount ?? 0).toLocaleString()} {tx.currency}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold text-gray-300">
                        {tx.provider}
                      </span>
                    </td>
                    <td className="p-3.5">{getStatusBadge(tx.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DÉTAILS PAIEMENT */}
      {selectedPayment && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPayment(null)}
          title={`Détails du Paiement #${selectedPayment.reference}`}
          size="lg"
        >
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#020919] border border-white/5">
                <div className="text-[10px] text-gray-400">Montant Encaissé</div>
                <div className="text-base font-mono font-bold text-white mt-0.5">
                  {(selectedPayment.amount ?? 0).toLocaleString()} {selectedPayment.currency}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#020919] border border-white/5">
                <div className="text-[10px] text-gray-400">Modalité</div>
                <div className="mt-1">{getTypeBadge(selectedPayment.paymentType)}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#020919] border border-white/5">
                <div className="text-[10px] text-gray-400">Statut Actuel</div>
                <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#020919] border border-white/5">
                <div className="text-[10px] text-gray-400">Passerelle</div>
                <div className="text-xs font-bold text-white mt-1">{selectedPayment.provider}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#020919] border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Client :</span>
                <span className="font-semibold text-white">{selectedPayment.clientName} ({selectedPayment.clientPhone || 'Non renseigné'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Entreprise bénéficiaire :</span>
                <span className="font-semibold text-[#FB8205]">{selectedPayment.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Identifiant Réservation / Commande :</span>
                <span className="font-mono text-cyan-400">{selectedPayment.bookingId || selectedPayment.requestId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date d’initiation :</span>
                <span className="text-gray-300">{new Date(selectedPayment.createdAt).toLocaleString('fr-FR')}</span>
              </div>
              {selectedPayment.refundAmount && selectedPayment.refundAmount > 0 ? (
                <div className="pt-2 border-t border-white/5 flex justify-between text-rose-300">
                  <span>Montant remboursé :</span>
                  <span className="font-bold">-{(selectedPayment.refundAmount ?? 0).toLocaleString()} {selectedPayment.currency} ({selectedPayment.refundReason || 'Motif non précisé'})</span>
                </div>
              ) : null}
            </div>

            {/* Transactions associées */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Écritures comptables & Transactions associées ({paymentTransactions.length})
              </h4>
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#020919] text-gray-400">
                    <tr>
                      <th className="p-2.5">ID Transaction</th>
                      <th className="p-2.5">Réf Externe Kkiapay</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Montant</th>
                      <th className="p-2.5">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paymentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">
                          Aucune transaction enregistrée pour ce paiement.
                        </td>
                      </tr>
                    ) : (
                      paymentTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="p-2.5 font-mono text-white">{tx.id}</td>
                          <td className="p-2.5 font-mono text-cyan-400">{tx.externalReference || '-'}</td>
                          <td className="p-2.5">{getTypeBadge(tx.paymentType)}</td>
                          <td className="p-2.5 font-mono font-bold text-white">{(tx.amount ?? 0).toLocaleString()} {tx.currency}</td>
                          <td className="p-2.5">{getStatusBadge(tx.status)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
              {Math.max(0, (selectedPayment.amount || 0) - (selectedPayment.refundAmount || 0)) > 0 && (selectedPayment.status === 'SUCCESS' || selectedPayment.status === 'PAID') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPayment(null);
                    handleOpenRefundModal(selectedPayment);
                  }}
                  className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Effectuer un remboursement
                </Button>
              )}
              <Button size="sm" variant="primary" onClick={() => setSelectedPayment(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL REMBOURSEMENT SÉCURISÉ */}
      {refundModalPayment && (
        <Modal
          isOpen={true}
          onClose={() => setRefundModalPayment(null)}
          title="Remboursement Sécurisé Flowexa"
          size="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Procédure financière irréversible</span>
              </div>
              <p className="text-xs text-gray-300">
                Vous vous apprêtez à rembourser le paiement <strong>#{refundModalPayment.reference}</strong> pour le client <strong>{refundModalPayment.clientName}</strong>.
              </p>
              <div className="pt-2 border-t border-rose-500/20 flex justify-between text-xs font-semibold">
                <span className="text-gray-400">Solde remboursable disponible :</span>
                <span className="text-white font-mono font-bold">
                  {Math.max(0, (refundModalPayment.amount || 0) - (refundModalPayment.refundAmount || 0)).toLocaleString()} {refundModalPayment.currency}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-300 mb-1">
                  Montant à rembourser ({refundModalPayment.currency}) *
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#FB8205]"
                  placeholder="Ex: 50000"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1">
                  Motif du remboursement (Obligatoire pour audit) *
                </label>
                <textarea
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FB8205]"
                  placeholder="Ex: Annulation de prestation avant délai, accord commercial avec le gérant, litige résolu..."
                />
              </div>
            </div>

            {refundError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{refundError}</span>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRefundModalPayment(null)}
                disabled={isSubmittingRefund}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleSubmitRefund}
                disabled={isSubmittingRefund}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                {isSubmittingRefund ? 'Validation en cours...' : 'Confirmer le Remboursement'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
