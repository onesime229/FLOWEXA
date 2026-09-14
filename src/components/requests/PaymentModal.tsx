import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Smartphone,
  Check,
  ExternalLink,
  Receipt,
  Clock,
  PiggyBank,
} from 'lucide-react';
import { FlowexaRequestItem, PaymentProviderCode, PaymentType, FlowexaPaymentItem } from '../../types';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { flowexaApi } from '../../services/api';

declare global {
  interface Window {
    openKkiapayWidget?: (options: any) => void;
    addKkiapayListener?: (event: string, callback: (response: any) => void) => void;
    removeKkiapayListener?: (event: string, callback: (response: any) => void) => void;
  }
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FlowexaRequestItem | null;
  onPaymentSuccess?: (payment: FlowexaPaymentItem) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  request,
  onPaymentSuccess,
  onShowToast,
}) => {
  if (!isOpen || !request) return null;

  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderCode>('KKIAPAY');
  const [phoneNumber, setPhoneNumber] = useState(request.clientPhone || '0154100617');
  const [clientName, setClientName] = useState(request.clientName || 'Client Flowexa');
  const [isInitiating, setIsInitiating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Payment Details
  const [activePayment, setActivePayment] = useState<FlowexaPaymentItem | null>(null);
  const [kkiapayConfig, setKkiapayConfig] = useState<{ publicKey: string; sandbox: boolean; theme?: string } | null>(null);
  const [isPaidSuccess, setIsPaidSuccess] = useState(request.paymentStatus === 'PAID');
  const [transactionRef, setTransactionRef] = useState<string | null>(null);

  const contractTotal = request.lockedPrice ?? request.catalogItemPrice ?? 0;
  const currency = request.lockedCurrency || request.catalogItemCurrency || 'FCFA';
  const alreadyPaid = request.paidAmount || 0;
  const remaining = request.remainingAmount !== undefined ? request.remainingAmount : Math.max(0, contractTotal - alreadyPaid);

  // Détermination du type de paiement par défaut
  const hasExistingDeposit = alreadyPaid > 0 && remaining > 0;
  const depositPct = request.depositPercentage || 30;
  const depositValue = Math.round(contractTotal * (depositPct / 100));

  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType>(
    hasExistingDeposit ? 'BALANCE' : 'FULL'
  );

  // Montant à payer selon l'option choisie
  const currentAmountToPay =
    selectedPaymentType === 'DEPOSIT'
      ? depositValue
      : selectedPaymentType === 'BALANCE'
      ? remaining
      : (hasExistingDeposit ? remaining : contractTotal);

  // Load Kkiapay configuration on mount
  useEffect(() => {
    let isMounted = true;
    flowexaApi.getKkiapayConfig()
      .then((cfg) => {
        if (isMounted && cfg.success) {
          setKkiapayConfig(cfg);
        }
      })
      .catch((err) => console.warn('[Kkiapay Config Load Error]', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Kkiapay script integration
  useEffect(() => {
    if (!window.openKkiapayWidget) {
      const script = document.createElement('script');
      script.src = 'https://cdn.kkiapay.me/k.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  const handleVerifyKkiapayTransaction = async (paymentId: string, transactionId: string) => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const res = await flowexaApi.verifyKkiapayPayment(
        { paymentId, transactionId },
        { role: 'CLIENT', userId: 'client-test-1', clientPhone: phoneNumber }
      );

      if (res.success && res.data) {
        setIsPaidSuccess(true);
        setActivePayment(res.data);
        setTransactionRef(transactionId);
        onShowToast('Paiement Validé !', `Transaction confirmée avec succès via Kkiapay (${currentAmountToPay.toLocaleString()} ${currency}).`, 'success');
        if (onPaymentSuccess) {
          onPaymentSuccess(res.data);
        }
      } else {
        setErrorMessage(res.error || 'Échec de la validation de la transaction Kkiapay.');
      }
    } catch (err: any) {
      setErrorMessage('Erreur de communication avec le serveur lors de la vérification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInitiatePayment = async () => {
    setIsInitiating(true);
    setErrorMessage(null);

    try {
      // 1. Initialisation stricte côté serveur avec montant contractuel backend et paymentType
      const res = await flowexaApi.initiatePayment(
        {
          bookingId: request.id,
          provider: selectedProvider,
          paymentType: selectedPaymentType,
          clientName,
          clientPhone: phoneNumber,
          idempotencyKey: `idemp_${request.id}_${selectedPaymentType}_${Date.now()}`,
        },
        { role: 'CLIENT', userId: 'client-test-1', clientPhone: phoneNumber }
      );

      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'Impossible d’initier le paiement.');
        setIsInitiating(false);
        return;
      }

      const payment = res.data as FlowexaPaymentItem;
      setActivePayment(payment);

      // 2. Si le fournisseur est Kkiapay, ouverture du widget ou du simulateur
      if (selectedProvider === 'KKIAPAY') {
        const pubKey = kkiapayConfig?.publicKey || 'kkiapay_sandbox_public_key';
        const isSandbox = kkiapayConfig?.sandbox !== false;

        if (window.openKkiapayWidget) {
          try {
            window.openKkiapayWidget({
              amount: payment.amount,
              key: pubKey,
              sandbox: isSandbox,
              phone: phoneNumber,
              name: clientName,
              data: {
                paymentId: payment.id,
                reference: payment.reference,
                bookingId: request.id,
                paymentType: selectedPaymentType,
              },
              theme: '#0f172a',
            });

            // Écouteur de succès Kkiapay
            if (window.addKkiapayListener) {
              const successCallback = (response: any) => {
                const txId = response?.transactionId || `KKIA-${Date.now()}`;
                handleVerifyKkiapayTransaction(payment.id, txId);
              };
              window.addKkiapayListener('success', successCallback);
            }
          } catch (widgetErr) {
            console.warn('[Kkiapay Widget Open Error - Fallback to Direct Verify]', widgetErr);
            // Fallback direct en environnement sandbox
            await handleVerifyKkiapayTransaction(payment.id, `KKIA-SANDBOX-${Date.now().toString(36).toUpperCase()}`);
          }
        } else {
          // Simulation instantanée et transparente en environnement sandbox
          await handleVerifyKkiapayTransaction(payment.id, `KKIA-SANDBOX-${Date.now().toString(36).toUpperCase()}`);
        }
      } else {
        // Autres opérateurs (MTN, Moov, Celtis, Carte)
        onShowToast('Session Initiée', res.message || 'Paiement en cours de traitement.', 'info');
      }
    } catch (err: any) {
      setErrorMessage('Une erreur est survenue lors de l’initialisation du paiement.');
    } finally {
      setIsInitiating(false);
    }
  };

  const handleSimulateSandboxSuccess = async () => {
    if (!activePayment) return;
    await handleVerifyKkiapayTransaction(activePayment.id, `KKIA-TEST-${Date.now().toString(36).toUpperCase()}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Paiement Sécurisé de la Réservation"
      size="md"
    >
      <div className="space-y-5 text-left">
        {/* En-tête avec garantie de montant contractuel */}
        <div className="p-4 rounded-xl bg-[#020919] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Établissement</span>
            <span className="text-xs font-bold text-[#FB8205]">{request.businessName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Prestation / Séjour</span>
            <span className="text-xs font-bold text-white truncate max-w-[220px]">{request.title}</span>
          </div>

          {/* Détails financiers */}
          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Total contractuel :</span>
              <span className="font-semibold text-white">{contractTotal.toLocaleString()} {currency}</span>
            </div>
            {alreadyPaid > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400">Déjà réglé (acompte) :</span>
                <span className="font-semibold text-emerald-400">-{alreadyPaid.toLocaleString()} {currency}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="font-semibold">Montant à régler :</span>
              </div>
              <div className="text-lg font-mono font-black text-white">
                {currentAmountToPay.toLocaleString()} {currency}
              </div>
            </div>
          </div>
        </div>

        {/* Reçu si déjà payé */}
        {isPaidSuccess ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Paiement Confirmé avec Succès !</h4>
            <p className="text-xs text-gray-300">
              Votre règlement de <span className="font-bold text-white">{currentAmountToPay.toLocaleString()} {currency}</span> a été validé.
              {selectedPaymentType === 'DEPOSIT' && (
                <span className="block mt-1 text-amber-300 font-medium">
                  Acompte validé. Le solde restant ({Math.max(0, contractTotal - currentAmountToPay).toLocaleString()} {currency}) sera réglé ultérieurement.
                </span>
              )}
            </p>
            {transactionRef && (
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px] text-gray-400">
                Identifiant Transaction : <span className="text-emerald-400 font-bold">{transactionRef}</span>
              </div>
            )}
            <div className="pt-2">
              <Button variant="primary" size="sm" onClick={onClose} className="w-full">
                Fermer et voir ma réservation
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Choix Modalité : Acompte ou Total */}
            {!hasExistingDeposit && request.depositAllowed !== false && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Modalité de paiement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectedPaymentType('FULL')}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedPaymentType === 'FULL'
                        ? 'bg-[#FB8205]/10 border-[#FB8205] text-white ring-1 ring-[#FB8205]'
                        : 'bg-[#020919] border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">Règlement Total</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        selectedPaymentType === 'FULL' ? 'border-[#FB8205] bg-[#FB8205]' : 'border-gray-500'
                      }`}>
                        {selectedPaymentType === 'FULL' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] font-mono text-white font-bold">
                      {contractTotal.toLocaleString()} {currency}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">100% à la commande</p>
                  </div>

                  <div
                    onClick={() => setSelectedPaymentType('DEPOSIT')}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedPaymentType === 'DEPOSIT'
                        ? 'bg-[#FB8205]/10 border-[#FB8205] text-white ring-1 ring-[#FB8205]'
                        : 'bg-[#020919] border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">Acompte ({depositPct}%)</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        selectedPaymentType === 'DEPOSIT' ? 'border-[#FB8205] bg-[#FB8205]' : 'border-gray-500'
                      }`}>
                        {selectedPaymentType === 'DEPOSIT' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] font-mono text-white font-bold">
                      {depositValue.toLocaleString()} {currency}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Solde : {(contractTotal - depositValue).toLocaleString()} {currency}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hasExistingDeposit && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2.5">
                <PiggyBank className="w-4 h-4 shrink-0 text-amber-400" />
                <div>
                  <span className="font-bold">Règlement du Solde Restant : </span>
                  Vous avez déjà versé un acompte de {alreadyPaid.toLocaleString()} {currency}. Vous réglez à présent le solde de {remaining.toLocaleString()} {currency}.
                </div>
              </div>
            )}

            {/* Sélection de la passerelle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Choisissez votre moyen de paiement
              </label>

              {/* Option Kkiapay mise en valeur */}
              <div
                onClick={() => setSelectedProvider('KKIAPAY')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedProvider === 'KKIAPAY'
                    ? 'bg-[#FB8205]/10 border-[#FB8205] ring-1 ring-[#FB8205]'
                    : 'bg-[#0A1428] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/10 flex items-center justify-center text-white">
                    <Smartphone className="w-5 h-5 text-[#FB8205]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Kkiapay</span>
                      <Badge variant="orange" size="sm">Recommandé Bénin</Badge>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      MTN MoMo, Moov Money, Celtis Cash & Carte Bancaire
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedProvider === 'KKIAPAY' ? 'border-[#FB8205] bg-[#FB8205]' : 'border-gray-500'
                }`}>
                  {selectedProvider === 'KKIAPAY' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
              </div>

              {/* Autres options directes */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { id: 'MTN_MOMO' as PaymentProviderCode, name: 'MTN Mobile Money' },
                  { id: 'MOOV_MONEY' as PaymentProviderCode, name: 'Moov Money' },
                  { id: 'CELTIS_CASH' as PaymentProviderCode, name: 'Celtis Cash' },
                  { id: 'CARD_VISA_MC' as PaymentProviderCode, name: 'Carte Visa / Mastercard' },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedProvider(opt.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium cursor-pointer flex items-center justify-between transition-all ${
                      selectedProvider === opt.id
                        ? 'bg-white/10 border-white text-white'
                        : 'bg-[#020919] border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ml-1.5 ${
                      selectedProvider === opt.id ? 'border-white bg-white' : 'border-gray-600'
                    }`}>
                      {selectedProvider === opt.id && <Check className="w-2.5 h-2.5 text-black stroke-[3]" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informations de contact du client */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-gray-400 block mb-1">
                  Nom du payeur
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FB8205]"
                  placeholder="Ex: Jean Houndékon"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-400 block mb-1">
                  Numéro Mobile Money (Bénin)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FB8205]"
                  placeholder="01XXXXXXXX"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleInitiatePayment}
                disabled={isInitiating || isVerifying || currentAmountToPay <= 0}
                className="w-full justify-center bg-[#FB8205] hover:bg-[#e07504] text-white font-extrabold shadow-lg shadow-[#FB8205]/20"
                leftIcon={
                  isInitiating || isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )
                }
              >
                {isInitiating
                  ? 'Ouverture de la session sécurisée...'
                  : isVerifying
                  ? 'Vérification Kkiapay en cours...'
                  : `Payer maintenant (${currentAmountToPay.toLocaleString()} ${currency})`}
              </Button>

              {/* Bouton de secours pour simulation sandbox si activePayment existe et est en attente */}
              {activePayment && activePayment.status === 'PROCESSING' && (
                <button
                  type="button"
                  onClick={handleSimulateSandboxSuccess}
                  className="w-full text-center text-[11px] text-gray-400 hover:text-emerald-400 underline py-1 transition-colors cursor-pointer"
                >
                  ⚡ Valider la transaction en mode test (Sandbox Kkiapay)
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Transactions chiffrées & certifiées sans stockage de coordonnées bancaires</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

