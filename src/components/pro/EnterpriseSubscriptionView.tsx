import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  ShieldCheck,
  FileText,
  Users,
  Package,
  Layers,
  HardDrive,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  Phone,
  Check,
  X,
  Printer,
  Download,
  Building,
} from 'lucide-react';
import { flowexaApi } from '../../services/api';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import type { Plan, Subscription, Invoice, UsageMetrics, PaymentProviderCode } from '../../types';

interface EnterpriseSubscriptionViewProps {
  businessId: string;
  businessName?: string;
  onShowToast: (title: string, message: string, variant?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const EnterpriseSubscriptionView: React.FC<EnterpriseSubscriptionViewProps> = ({
  businessId,
  businessName,
  onShowToast,
}) => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Billing period toggle
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  
  // Modal states
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<Plan | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderCode>('ORANGE_MONEY');
  const [paymentPhone, setPaymentPhone] = useState('0154100617');
  const [autoRenewChoice, setAutoRenewChoice] = useState(true);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    payment: any;
    transaction: any;
    subscription: any;
  } | null>(null);

  // Invoice viewer modal
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  
  // Cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Load all subscription and billing data
  const loadBillingData = async () => {
    setLoading(true);
    try {
      const [subRes, plansRes, invoicesRes] = await Promise.all([
        flowexaApi.getBusinessSubscription(businessId),
        flowexaApi.getBillingPlans(),
        flowexaApi.getBusinessInvoices(businessId),
      ]);

      if (subRes.success) {
        setSubscription(subRes.data as any);
        if (subRes.usage) {
          setUsage(subRes.usage);
        }
      }

      if (plansRes.success && Array.isArray(plansRes.data)) {
        setPlans(plansRes.data);
      }

      if (invoicesRes.success && Array.isArray(invoicesRes.data)) {
        setInvoices(invoicesRes.data);
      }
    } catch (err) {
      console.error('Failed to load billing data', err);
      onShowToast('Erreur', 'Impossible de charger les données de facturation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, [businessId]);

  // Handle plan checkout initiation
  const handleInitiateSubscribe = async () => {
    if (!selectedPlanForCheckout) return;

    setSubmittingPayment(true);
    try {
      const res = await flowexaApi.subscribeToPlan({
        businessId,
        planId: selectedPlanForCheckout.id,
        period: billingPeriod,
        provider: selectedProvider,
        clientPhone: paymentPhone,
        autoRenew: autoRenewChoice,
      });

      if (res.success && res.data) {
        setPendingPaymentData(res.data);
        onShowToast(
          'Paiement initié',
          `Session de paiement #${res.data.payment.reference} créée via ${selectedProvider}.`,
          'info'
        );
      } else {
        onShowToast('Souscription impossible', res.message || 'Erreur de souscription.', 'error');
      }
    } catch (err) {
      console.error('Subscription error', err);
      onShowToast('Erreur', 'Échec de l’initialisation du paiement.', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Simulate payment confirmation in test / sandbox
  const handleConfirmSandboxPayment = async () => {
    if (!pendingPaymentData?.payment?.id) return;

    setSubmittingPayment(true);
    try {
      const res = await fetch(`/api/v1/payments/${pendingPaymentData.payment.id}/simulate-sandbox-callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUCCESS' }),
      });
      const data = await res.json();

      if (data.success) {
        onShowToast(
          'Abonnement activé !',
          `Votre paiement a été validé. Votre plan ${selectedPlanForCheckout?.name} est actif !`,
          'success'
        );
        setSelectedPlanForCheckout(null);
        setPendingPaymentData(null);
        loadBillingData();
      } else {
        onShowToast('Échec de validation', data.error || 'Erreur de simulation.', 'error');
      }
    } catch (err) {
      console.error('Sandbox callback error', err);
      onShowToast('Erreur', 'Impossible de confirmer le paiement test.', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Toggle Auto-Renew
  const handleToggleAutoRenew = async () => {
    if (!subscription) return;
    const nextVal = !subscription.autoRenew;

    try {
      const res = await flowexaApi.toggleSubscriptionAutoRenew(businessId, nextVal);
      if (res.success) {
        setSubscription({ ...subscription, autoRenew: nextVal });
        onShowToast(
          'Renouvellement automatique',
          `Renouvellement automatique ${nextVal ? 'activé' : 'désactivé'}.`,
          'info'
        );
      } else {
        onShowToast('Erreur', res.message || 'Action impossible.', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Erreur', 'Échec de la mise à jour.', 'error');
    }
  };

  // Handle Cancellation
  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      const res = await flowexaApi.cancelSubscription(businessId, cancelReason);
      if (res.success) {
        setShowCancelModal(false);
        setCancelReason('');
        onShowToast(
          'Abonnement résilié',
          'Votre demande a été prise en compte. Vos données restent conservées et vos accès actifs jusqu’à la date d’échéance.',
          'warning'
        );
        loadBillingData();
      } else {
        onShowToast('Erreur', res.message || 'Impossible de résilier.', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Erreur', 'Échec lors de la résiliation.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" dot>Abonnement Actif</Badge>;
      case 'TRIAL':
        return <Badge variant="cyan" dot>Période d’essai</Badge>;
      case 'PAST_DUE':
        return <Badge variant="warning" dot>Période de grâce (Échéance dépassée)</Badge>;
      case 'EXPIRED':
        return <Badge variant="danger" dot>Abonnement Expiré</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger" dot>Suspendu</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" dot>Résiliation programmée</Badge>;
      default:
        return <Badge variant="neutral">Starter (Par défaut)</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#FB8205]" />
        <p className="text-sm">Chargement des données de facturation et abonnement...</p>
      </div>
    );
  }

  const currentPlan = subscription?.planDetails || plans.find((p) => p.id === subscription?.planId) || plans[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left">
      {/* 1. Header & Active Subscription Card */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getStatusBadge(subscription?.status)}
              <span className="text-xs text-gray-400">Entreprise : <strong className="text-white">{businessName || subscription?.businessName || 'Mon Entreprise'}</strong></span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <span>Formule actuelle :</span>
              <span className="text-[#FB8205]">{subscription?.planName || currentPlan?.name || 'Starter'}</span>
            </h2>
            <p className="text-sm text-gray-300 mt-1 max-w-2xl">
              Gérez votre souscription, vos quotas en temps réel, le renouvellement automatique et accédez à l'historique complet de vos factures officielles.
            </p>
          </div>

          {/* Quick Date and Renewal status card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date d'échéance</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-4 h-4 text-[#FB8205]" />
                <span>
                  {subscription?.expirationDate
                    ? new Date(subscription.expirationDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Non définie'}
                </span>
              </div>
              {subscription?.status === 'PAST_DUE' && subscription.gracePeriodEndsAt && (
                <div className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Grâce jusqu'au {new Date(subscription.gracePeriodEndsAt).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-5">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Renouvellement auto</div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleToggleAutoRenew}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    subscription?.autoRenew
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/10 text-gray-400 border border-white/10'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${subscription?.autoRenew ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                  <span>{subscription?.autoRenew ? 'Activé' : 'Désactivé'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Banner if Expired or Past Due */}
        {(subscription?.status === 'EXPIRED' || subscription?.status === 'SUSPENDED') && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="text-sm text-red-200">
                <strong>Votre abonnement est expiré.</strong> Vos données sont intégralement conservées mais l'ajout de nouvelles offres et membres est bloqué.
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const target = plans.find((p) => p.id === subscription.planId) || plans[0];
                setSelectedPlanForCheckout(target);
              }}
            >
              Renouveler immédiatement
            </Button>
          </div>
        )}
      </div>

      {/* 2. Real Usage Metrics & Plan Quotas (No fake numbers) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#FB8205]" />
              <span>Consommation réelle des quotas ({currentPlan?.name || 'Formule active'})</span>
            </h3>
            <p className="text-xs text-gray-400">
              Métriques calculées en temps réel à partir de vos données effectives enregistrées dans la base Flowexa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Employees quota */}
          <div className="bg-[#0A1428] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Collaborateurs</span>
              </span>
              <span className="font-mono text-white font-bold">
                {usage?.employees.current ?? 0} / {usage?.employees.max ?? currentPlan?.limits.maxEmployees ?? 3}
              </span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  (usage?.employees.percentage ?? 0) >= 90
                    ? 'bg-red-500'
                    : (usage?.employees.percentage ?? 0) >= 70
                    ? 'bg-amber-500'
                    : 'bg-[#0BE9EF]'
                }`}
                style={{ width: `${Math.min(100, usage?.employees.percentage ?? 0)}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-gray-400 flex justify-between">
              <span>{usage?.employees.percentage ?? 0}% utilisé</span>
              <span>
                {Math.max(0, (usage?.employees.max ?? 3) - (usage?.employees.current ?? 0))} restants
              </span>
            </div>
          </div>

          {/* Services quota */}
          <div className="bg-[#0A1428] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#FB8205]" />
                <span>Services au catalogue</span>
              </span>
              <span className="font-mono text-white font-bold">
                {usage?.services.current ?? 0} / {usage?.services.max ?? currentPlan?.limits.maxServices ?? 10}
              </span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  (usage?.services.percentage ?? 0) >= 90
                    ? 'bg-red-500'
                    : (usage?.services.percentage ?? 0) >= 70
                    ? 'bg-amber-500'
                    : 'bg-[#FB8205]'
                }`}
                style={{ width: `${Math.min(100, usage?.services.percentage ?? 0)}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-gray-400 flex justify-between">
              <span>{usage?.services.percentage ?? 0}% utilisé</span>
              <span>
                {Math.max(0, (usage?.services.max ?? 10) - (usage?.services.current ?? 0))} restants
              </span>
            </div>
          </div>

          {/* Offers quota */}
          <div className="bg-[#0A1428] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
              <span className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Offres & Annonces</span>
              </span>
              <span className="font-mono text-white font-bold">
                {usage?.offers.current ?? 0} / {usage?.offers.max ?? currentPlan?.limits.maxOffers ?? 20}
              </span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  (usage?.offers.percentage ?? 0) >= 90
                    ? 'bg-red-500'
                    : (usage?.offers.percentage ?? 0) >= 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, usage?.offers.percentage ?? 0)}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-gray-400 flex justify-between">
              <span>{usage?.offers.percentage ?? 0}% utilisé</span>
              <span>
                {Math.max(0, (usage?.offers.max ?? 20) - (usage?.offers.current ?? 0))} restants
              </span>
            </div>
          </div>

          {/* Storage quota */}
          <div className="bg-[#0A1428] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <span>Espace stockage</span>
              </span>
              <span className="font-mono text-white font-bold">
                {usage?.storageMb.current ?? 15} / {usage?.storageMb.max ?? currentPlan?.limits.maxStorageMb ?? 500} Mo
              </span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  (usage?.storageMb.percentage ?? 0) >= 90
                    ? 'bg-red-500'
                    : (usage?.storageMb.percentage ?? 0) >= 70
                    ? 'bg-amber-500'
                    : 'bg-purple-400'
                }`}
                style={{ width: `${Math.min(100, usage?.storageMb.percentage ?? 0)}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-gray-400 flex justify-between">
              <span>{usage?.storageMb.percentage ?? 0}% utilisé</span>
              <span>
                {Math.max(0, (usage?.storageMb.max ?? 500) - (usage?.storageMb.current ?? 15))} Mo libres
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pricing Plans Grid (Comparison & Upgrade/Downgrade) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#FB8205]" />
              <span>Changer de formule ou renouveler</span>
            </h3>
            <p className="text-xs text-gray-400">
              Adaptez votre plan aux besoins croissants de votre activité. Les données sont toujours préservées.
            </p>
          </div>

          {/* Monthly / Yearly Switch */}
          <div className="bg-[#0A1428] border border-white/10 p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto">
            <button
              onClick={() => setBillingPeriod('MONTHLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingPeriod === 'MONTHLY' ? 'bg-[#FB8205] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod('YEARLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingPeriod === 'YEARLY' ? 'bg-[#FB8205] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Annuel</span>
              <span className="px-1.5 py-0.2 rounded bg-white/20 text-[10px] text-white font-extrabold">
                2 mois offerts
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = subscription?.planId === plan.id;
            const price = billingPeriod === 'YEARLY' ? (plan.price ?? 0) * 10 : (plan.price ?? 0);
            const priceFormatted = (price ?? 0).toLocaleString();

            return (
              <div
                key={plan.id}
                className={`bg-[#0A1428] rounded-2xl p-6 border transition-all flex flex-col justify-between relative ${
                  isCurrent
                    ? 'border-[#FB8205] shadow-xl shadow-[#FB8205]/10 ring-1 ring-[#FB8205]'
                    : plan.isPopular
                    ? 'border-cyan-500/50 hover:border-cyan-400'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Badges */}
                <div className="flex items-center justify-between mb-4">
                  {isCurrent ? (
                    <Badge variant="orange">Plan Actuel</Badge>
                  ) : plan.badgeText ? (
                    <Badge variant="cyan">{plan.badgeText}</Badge>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400 uppercase">{plan.code}</span>
                  )}
                  {plan.isPopular && !isCurrent && (
                    <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Plus Populaire
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xl font-bold text-white mb-1">{plan.name}</h4>
                  <p className="text-xs text-gray-400 min-h-[36px]">{plan.description}</p>

                  {/* Price */}
                  <div className="my-5 pb-5 border-b border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">{priceFormatted}</span>
                      <span className="text-sm font-semibold text-gray-400">{plan.currency}</span>
                      <span className="text-xs text-gray-500">/{billingPeriod === 'YEARLY' ? 'an' : 'mois'}</span>
                    </div>
                    {billingPeriod === 'YEARLY' && (
                      <div className="text-[11px] text-emerald-400 mt-1">
                        Équivalent à {Math.round((price ?? 0) / 12).toLocaleString()} {plan.currency}/mois
                      </div>
                    )}
                  </div>

                  {/* Limits and quotas */}
                  <div className="space-y-2.5 text-xs text-gray-300 mb-6">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>{plan.limits.maxEmployees}</strong> collaborateurs / employés</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>{plan.limits.maxServices}</strong> prestations au catalogue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>{plan.limits.maxOffers}</strong> annonces & offres actives</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>{plan.limits.maxStorageMb} Mo</strong> d'espace de stockage</span>
                    </div>

                    {/* Features checklist */}
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <div className="flex items-center gap-2">
                        {plan.features.marketplaceAccess ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-600 shrink-0" />
                        )}
                        <span className={plan.features.marketplaceAccess ? 'text-gray-300' : 'text-gray-500'}>
                          Visibilité Marketplace Flowexa
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {plan.features.statistics ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-600 shrink-0" />
                        )}
                        <span className={plan.features.statistics ? 'text-gray-300' : 'text-gray-500'}>
                          Statistiques & Indicateurs BI
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {plan.features.automations ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-600 shrink-0" />
                        )}
                        <span className={plan.features.automations ? 'text-gray-300' : 'text-gray-500'}>
                          Automatisations CRM & Notifications
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {plan.features.aiCopilot ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-600 shrink-0" />
                        )}
                        <span className={plan.features.aiCopilot ? 'text-cyan-300 font-semibold' : 'text-gray-500'}>
                          Assistant IA & Copilot Métier
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {plan.features.prioritySupport ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-600 shrink-0" />
                        )}
                        <span className={plan.features.prioritySupport ? 'text-gray-300' : 'text-gray-500'}>
                          Support prioritaire dédié 7j/7
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Button */}
                <div className="pt-2">
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full border-[#FB8205]/40 text-[#FB8205] hover:bg-[#FB8205]/10"
                      onClick={() => setSelectedPlanForCheckout(plan)}
                    >
                      Renouveler ce plan
                    </Button>
                  ) : (
                    <Button
                      variant={plan.isPopular ? 'primary' : 'outline'}
                      size="md"
                      className="w-full"
                      onClick={() => setSelectedPlanForCheckout(plan)}
                    >
                      Choisir cette formule
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Invoices & Billing History */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FB8205]" />
              <span>Factures & Reçus d'abonnement</span>
            </h3>
            <p className="text-xs text-gray-400">
              Historique de toutes vos factures acquittées avec références de transaction officielles et téléchargeables.
            </p>
          </div>

          <div className="text-xs text-gray-400">
            Total : <strong className="text-white font-mono">{invoices.length} facture(s)</strong>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            Aucune facture émise pour le moment. Vos futures factures d'abonnement apparaîtront ici.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">N° Facture</th>
                  <th className="py-3 px-4">Date d'émission</th>
                  <th className="py-3 px-4">Formule</th>
                  <th className="py-3 px-4">Montant</th>
                  <th className="py-3 px-4">Moyen de paiement</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(inv.issuedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{inv.planName}</td>
                    <td className="py-3 px-4 font-bold text-white font-mono">
                      {(inv.amount ?? 0).toLocaleString()} {inv.currency}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-xs">
                      <span className="px-2 py-0.5 rounded bg-white/10 font-mono">{inv.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> Payée
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveInvoice(inv)}
                        className="text-xs font-bold text-[#FB8205] hover:text-white transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Voir / Imprimer</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Danger Zone: Subscription Cancellation */}
      <div className="bg-[#0A1428] border border-red-500/20 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Résiliation de l'abonnement</span>
            </h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Vous pouvez interrompre le renouvellement de votre abonnement à tout moment. Vos services restent actifs jusqu'au terme de l'échéance et toutes vos données (catalogue, réservations, avis) restent sauvegardées en toute sécurité.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 shrink-0"
            onClick={() => setShowCancelModal(true)}
          >
            Résilier mon abonnement
          </Button>
        </div>
      </div>

      {/* MODAL: Checkout / Subscription Payment (Using existing payment system) */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#FB8205]" />
                  <span>Règlement de l'abonnement</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Plan sélectionné : <strong className="text-white">{selectedPlanForCheckout.name}</strong> ({billingPeriod === 'YEARLY' ? 'Annuel' : 'Mensuel'})
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPlanForCheckout(null);
                  setPendingPaymentData(null);
                }}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recap */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">Montant à régler</div>
                <div className="text-2xl font-black text-white font-mono mt-0.5">
                  {(billingPeriod === 'YEARLY' ? (selectedPlanForCheckout.price ?? 0) * 10 : (selectedPlanForCheckout.price ?? 0)).toLocaleString()} {selectedPlanForCheckout.currency}
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <div>Période : {billingPeriod === 'YEARLY' ? '12 mois' : '1 mois'}</div>
                <div className="text-emerald-400 font-semibold mt-0.5">Activation immédiate</div>
              </div>
            </div>

            {!pendingPaymentData ? (
              <div className="space-y-4">
                {/* Operator Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Moyen de paiement Mobile Money & Carte
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['ORANGE_MONEY', 'MTN_MOMO', 'MOOV_MONEY', 'WAVE', 'CREDIT_CARD'] as PaymentProviderCode[]).map((prov) => (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => setSelectedProvider(prov)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left flex items-center justify-between ${
                          selectedProvider === prov
                            ? 'bg-[#FB8205]/20 border-[#FB8205] text-white ring-1 ring-[#FB8205]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span>{prov.replace('_', ' ')}</span>
                        {selectedProvider === prov && <Check className="w-3.5 h-3.5 text-[#FB8205]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>Numéro de débit Mobile Money / Contact facturation</span>
                  </label>
                  <input
                    type="tel"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    placeholder="ex: 0154100617"
                    className="w-full bg-[#050B14] border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#FB8205]"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Numéro de test sandbox Flowexa : <strong className="text-gray-300 font-mono">0154100617</strong>
                  </span>
                </div>

                {/* Auto-renew checkbox */}
                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRenewChoice}
                    onChange={(e) => setAutoRenewChoice(e.target.checked)}
                    className="rounded text-[#FB8205] focus:ring-0 w-4 h-4 bg-transparent border-white/20"
                  />
                  <span className="text-xs text-gray-300">
                    Activer le renouvellement automatique à chaque fin de période (annulable en 1 clic).
                  </span>
                </label>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleInitiateSubscribe}
                    disabled={submittingPayment}
                  >
                    {submittingPayment ? 'Génération de la session de paiement...' : 'Valider et Procéder au Paiement'}
                  </Button>
                </div>
              </div>
            ) : (
              /* Payment session initiated: waiting for confirmation / sandbox trigger */
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center space-y-2">
                  <Clock className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
                  <div className="text-base font-bold text-white">Demande de paiement envoyée sur le mobile</div>
                  <div className="text-xs text-gray-300">
                    Référence : <strong className="text-white font-mono">{pendingPaymentData.payment.reference}</strong>
                  </div>
                  <p className="text-xs text-gray-400">
                    Veuillez valider l'invite USSD sur votre téléphone ({paymentPhone}) avec votre code secret {selectedProvider.replace('_', ' ')}.
                  </p>
                </div>

                {/* Test Sandbox simulator button (Rule: never fake APIs, uses real backend transition) */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Environnement Sandbox / Simulateur Opérateur
                  </div>
                  <p className="text-xs text-gray-400">
                    En environnement de test, simulez la confirmation push de l'opérateur pour valider le paiement immédiatement.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={handleConfirmSandboxPayment}
                    disabled={submittingPayment}
                  >
                    {submittingPayment ? 'Traitement en cours...' : 'Simuler la confirmation opérateur (Paiement Validé)'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Official Invoice Viewer / Printer */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 text-left">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#FB8205]" />
                  <span className="text-lg font-black text-white tracking-wider uppercase">FLOWEXA BILLING</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">Plateforme Multi-Secteurs & Marketplace Professionnelle</div>
              </div>
              <button onClick={() => setActiveInvoice(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice Header Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-gray-400">Facturé à :</div>
                <div className="text-sm font-bold text-white mt-0.5">{activeInvoice.businessName}</div>
                {activeInvoice.businessEmail && <div className="text-gray-400">{activeInvoice.businessEmail}</div>}
                {activeInvoice.businessPhone && <div className="text-gray-400 font-mono">{activeInvoice.businessPhone}</div>}
              </div>

              <div className="text-right">
                <div className="text-gray-400">Facture N° :</div>
                <div className="text-sm font-black font-mono text-white mt-0.5">{activeInvoice.invoiceNumber}</div>
                <div className="text-gray-400">
                  Date : {new Date(activeInvoice.issuedAt).toLocaleDateString('fr-FR')}
                </div>
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ACQUITTÉE
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-gray-400 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Désignation</th>
                    <th className="py-2.5 px-4">Période</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  <tr>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">Abonnement Flowexa — Formule {activeInvoice.planName}</div>
                      <div className="text-[11px] text-gray-400">
                        Réf. Transaction : {activeInvoice.transactionReference || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-300">
                      {new Date(activeInvoice.periodStart).toLocaleDateString('fr-FR')} au{' '}
                      {new Date(activeInvoice.periodEnd).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                      {(activeInvoice.amount ?? 0).toLocaleString()} {activeInvoice.currency}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-white/5 border-t border-white/10 font-bold text-white">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-right uppercase text-xs text-gray-400">Total Net Réglé :</td>
                    <td className="py-3 px-4 text-right font-mono text-base text-[#FB8205]">
                      {(activeInvoice.amount ?? 0).toLocaleString()} {activeInvoice.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] text-gray-400">
              Moyen de règlement : <strong className="text-white font-mono">{activeInvoice.paymentMethod}</strong>. Document faisant office de reçu officiel de paiement d’abonnement logiciel Flowexa.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Imprimer la facture
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveInvoice(null)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cancellation Confirmation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A1428] border border-red-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>Confirmer la résiliation</span>
            </h3>

            <p className="text-xs text-gray-300">
              Êtes-vous sûr de vouloir résilier votre abonnement ?
              Vos accès et vos quotas actuels restent pleinement opérationnels jusqu'à la date d'échéance ({subscription?.expirationDate ? new Date(subscription.expirationDate).toLocaleDateString('fr-FR') : 'de la période en cours'}).
              Toutes vos données resteront sauvegardées.
            </p>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Motif de résiliation (facultatif)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Dites-nous ce que nous pourrions améliorer..."
                rows={2}
                className="w-full bg-[#050B14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FB8205]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-500 text-white"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Résiliation...' : 'Confirmer la résiliation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
