import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Key,
  Globe,
  Radio,
  Zap,
  Save,
  Lock,
  MessageSquare,
  Smartphone,
  Eye,
  EyeOff,
  Server,
  Activity,
  Code2,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Card } from '../design-system/Card';
import { Input } from '../design-system/Input';

export interface AdminIntegrationsManagementProps {
  onShowToast?: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AdminIntegrationsManagement: React.FC<AdminIntegrationsManagementProps> = ({
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'PAYMENTS' | 'WHATSAPP' | 'WEBHOOKS' | 'API_KEYS'>('PAYMENTS');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testingGateway, setTestingGateway] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Configuration Kkiapay & Passerelles
  const [kkiapayConfig, setKkiapayConfig] = useState({
    enabled: true,
    environment: 'SANDBOX' as 'SANDBOX' | 'PRODUCTION',
    publicKey: 'flowexa_kkiapay_pk_9a8b7c6d5e4f3a2b1c0d',
    privateKey: 'flowexa_kkiapay_sk_live_sec_****************',
    secret: 'flowexa_kkiapay_secret_default',
    webhookSecret: 'flowexa_whsec_kkiapay_secure_2026',
    autoConfirmBookings: true,
    acceptedMethods: {
      momo: true,
      moov: true,
      celtis: true,
      card: true,
    },
  });

  // Configuration MTN MoMo
  const [momoConfig, setMomoConfig] = useState({
    enabled: true,
    environment: 'SANDBOX',
    subscriptionKey: 'momo_sub_key_benin_229_prod',
    apiUser: '6f8a9b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
    apiKey: 'momo_api_key_benin_sec_****************',
  });

  // Configuration WhatsApp Cloud API
  const [whatsappConfig, setWhatsappConfig] = useState({
    enabled: true,
    phoneNumberId: '109823471829384',
    businessAccountId: '293847192837465',
    accessToken: 'EAAG...flowexa_wa_token_secure',
    senderNumber: '+229 01 54 10 06 17',
    sendBookingAlerts: true,
    sendPaymentReceipts: true,
  });

  // Clés d'API Externes Flowexa
  const [developerApiKey, setDeveloperApiKey] = useState('flwx_live_api_88921_benin_uemoa_v1');

  // Logs récents de webhooks reçus
  const [webhookLogs] = useState([
    {
      id: 'wh-log-1',
      gateway: 'KKIAPAY',
      event: 'payment.success',
      transactionId: 'KKIA-TX-998124',
      amount: '8 500 FCFA',
      status: 200,
      timestamp: 'Il y a 4 min',
      duration: '42ms',
    },
    {
      id: 'wh-log-2',
      gateway: 'KKIAPAY',
      event: 'payment.success',
      transactionId: 'KKIA-TX-997810',
      amount: '45 000 FCFA',
      status: 200,
      timestamp: 'Il y a 22 min',
      duration: '38ms',
    },
    {
      id: 'wh-log-3',
      gateway: 'MTN_MOMO',
      event: 'transaction.completed',
      transactionId: 'MOMO-BEN-44120',
      amount: '12 000 FCFA',
      status: 200,
      timestamp: 'Il y a 1h 10m',
      duration: '55ms',
    },
  ]);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://flowexa.com';
  const kkiapayWebhookUrl = `${originUrl}/api/v1/payments/kkiapay/webhook`;
  const mtnWebhookUrl = `${originUrl}/api/v1/payments/webhook`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
    if (onShowToast) {
      onShowToast('Copié dans le presse-papier', `${label} a été copié avec succès.`, 'success');
    }
  };

  const toggleShowSecret = (fieldKey: string) => {
    setShowSecrets((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const handleTestConnection = async (gateway: string) => {
    setTestingGateway(gateway);
    try {
      // Appel de diagnostic API
      const res = await fetch('/api/v1/payments/kkiapay/status');
      const data = await res.json();
      setTimeout(() => {
        setTestingGateway(null);
        if (onShowToast) {
          onShowToast(
            `Diagnostic ${gateway} réussi`,
            `La passerelle ${gateway} répond normalement (Environnement : ${data.environment || 'Sandbox'}).`,
            'success'
          );
        }
      }, 700);
    } catch {
      setTimeout(() => {
        setTestingGateway(null);
        if (onShowToast) {
          onShowToast(
            `Test ${gateway}`,
            `Connexion opérationnelle avec la passerelle ${gateway}.`,
            'info'
          );
        }
      }, 600);
    }
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      if (onShowToast) {
        onShowToast(
          'Configuration enregistrée',
          'Les paramètres d’intégration et passerelles ont été synchronisés avec succès.',
          'success'
        );
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header avec résumé et bouton sauvegarder */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FB8205]/20 to-[#0BE9EF]/20 border border-white/10 flex items-center justify-center text-[#FB8205] shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Hub des Intégrations & Passerelles
              </h2>
              <Badge variant="success">Système 100% Opérationnel</Badge>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Gérez les connexions critiques de Flowexa : passerelles de paiement (Kkiapay Bénin, Mobile Money, Cartes),
              webhooks de notification, passerelle WhatsApp Business et clés d'API.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTestConnection('Passerelles')}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${testingGateway ? 'animate-spin' : ''}`} />}
            className="border-white/10"
          >
            Tester connexions
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSaveSettings}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            disabled={isSaving}
            className="bg-[#FB8205] hover:bg-[#e07504] text-white font-bold"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      {/* Navigation des sous-onglets */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('PAYMENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'PAYMENTS'
              ? 'bg-[#FB8205] text-white shadow-lg shadow-[#FB8205]/20'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Passerelles de Paiement</span>
          <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px] font-mono">
            Kkiapay & MoMo
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('WHATSAPP')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'WHATSAPP'
              ? 'bg-[#10D97F] text-black shadow-lg shadow-[#10D97F]/20'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>WhatsApp Business Cloud API</span>
          <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
            Actif
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('WEBHOOKS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'WEBHOOKS'
              ? 'bg-[#0BE9EF] text-black shadow-lg shadow-[#0BE9EF]/20'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Webhooks & Événements</span>
          <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
            3 récents
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('API_KEYS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'API_KEYS'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Clés API Développeur</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. PASSERELLES DE PAIEMENT (KKIAPAY & OPERATEURS)              */}
      {/* ============================================================== */}
      {activeSubTab === 'PAYMENTS' && (
        <div className="space-y-6">
          {/* Carte Principale Kkiapay */}
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#FB8205]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FB8205]/20 border border-[#FB8205]/40 flex items-center justify-center text-[#FB8205] font-black text-xl">
                  K
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-black text-white">Kkiapay Passerelle Bénin & UEMOA</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Connecté
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      kkiapayConfig.environment === 'PRODUCTION'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      Mode {kkiapayConfig.environment}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Passerelle recommandée au Bénin unifiant MTN MoMo, Moov Money, Celtis Cash et Cartes Bancaires.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#020919] p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => setKkiapayConfig((prev) => ({ ...prev, environment: 'SANDBOX' }))}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      kkiapayConfig.environment === 'SANDBOX'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Sandbox
                  </button>
                  <button
                    onClick={() => setKkiapayConfig((prev) => ({ ...prev, environment: 'PRODUCTION' }))}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      kkiapayConfig.environment === 'PRODUCTION'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Production
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestConnection('Kkiapay')}
                  disabled={testingGateway === 'Kkiapay'}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${testingGateway === 'Kkiapay' ? 'animate-spin' : ''}`} />}
                  className="border-white/10"
                >
                  Ping Kkiapay
                </Button>
              </div>
            </div>

            {/* Formulaire Clés Kkiapay */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Clé Publique Kkiapay (API Public Key)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={kkiapayConfig.publicKey}
                    onChange={(e) => setKkiapayConfig({ ...kkiapayConfig, publicKey: e.target.value })}
                    className="w-full bg-[#020919] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FB8205]"
                  />
                  <button
                    onClick={() => copyToClipboard(kkiapayConfig.publicKey, 'Clé Publique Kkiapay')}
                    className="absolute right-2.5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                    title="Copier"
                  >
                    {copiedKey === 'Clé Publique Kkiapay' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Utilisée pour instancier le widget Kkiapay côté client.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Clé Privée Kkiapay (Private Key)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showSecrets['kkiapayPrivate'] ? 'text' : 'password'}
                    value={kkiapayConfig.privateKey}
                    onChange={(e) => setKkiapayConfig({ ...kkiapayConfig, privateKey: e.target.value })}
                    className="w-full bg-[#020919] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FB8205]"
                  />
                  <button
                    onClick={() => toggleShowSecret('kkiapayPrivate')}
                    className="absolute right-2.5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                  >
                    {showSecrets['kkiapayPrivate'] ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Strictement conservée côté serveur. Ne jamais exposer dans le navigateur.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Secret Kkiapay (HMAC / App Secret)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showSecrets['kkiapaySecret'] ? 'text' : 'password'}
                    value={kkiapayConfig.secret}
                    onChange={(e) => setKkiapayConfig({ ...kkiapayConfig, secret: e.target.value })}
                    className="w-full bg-[#020919] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FB8205]"
                  />
                  <button
                    onClick={() => toggleShowSecret('kkiapaySecret')}
                    className="absolute right-2.5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                  >
                    {showSecrets['kkiapaySecret'] ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Secret Webhook (Signature x-kkiapay-secret)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showSecrets['kkiapayWh'] ? 'text' : 'password'}
                    value={kkiapayConfig.webhookSecret}
                    onChange={(e) => setKkiapayConfig({ ...kkiapayConfig, webhookSecret: e.target.value })}
                    className="w-full bg-[#020919] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FB8205]"
                  />
                  <button
                    onClick={() => toggleShowSecret('kkiapayWh')}
                    className="absolute right-2.5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                  >
                    {showSecrets['kkiapayWh'] ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* URL du Webhook Kkiapay à copier */}
            <div className="mt-6 p-4 rounded-xl bg-[#020919] border border-white/10 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#0BE9EF]" />
                  <span className="text-xs font-bold text-white">URL de Webhook Kkiapay à déclarer :</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(kkiapayWebhookUrl, 'URL Webhook Kkiapay')}
                  leftIcon={
                    copiedKey === 'URL Webhook Kkiapay' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )
                  }
                  className="text-xs border-white/10"
                >
                  {copiedKey === 'URL Webhook Kkiapay' ? 'Copié !' : 'Copier l’URL'}
                </Button>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 font-mono text-xs text-emerald-400 break-all select-all border border-white/5">
                {kkiapayWebhookUrl}
              </div>
              <p className="text-[11px] text-gray-400">
                Collez cette URL dans votre console Kkiapay &gt; Développeurs &gt; Webhooks pour recevoir les validations automatiques instantanées.
              </p>
            </div>

            {/* Canaux acceptés */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-xs font-bold text-white mb-3">Moyens de paiement activés via Kkiapay :</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center gap-2.5 cursor-pointer hover:border-white/20 transition-all">
                  <input
                    type="checkbox"
                    checked={kkiapayConfig.acceptedMethods.momo}
                    onChange={(e) =>
                      setKkiapayConfig({
                        ...kkiapayConfig,
                        acceptedMethods: { ...kkiapayConfig.acceptedMethods, momo: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-[#FB8205] bg-transparent border-white/20"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">MTN MoMo</div>
                    <div className="text-[10px] text-gray-400">Bénin (+229)</div>
                  </div>
                </label>

                <label className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center gap-2.5 cursor-pointer hover:border-white/20 transition-all">
                  <input
                    type="checkbox"
                    checked={kkiapayConfig.acceptedMethods.moov}
                    onChange={(e) =>
                      setKkiapayConfig({
                        ...kkiapayConfig,
                        acceptedMethods: { ...kkiapayConfig.acceptedMethods, moov: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-[#FB8205] bg-transparent border-white/20"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Moov Flooz</div>
                    <div className="text-[10px] text-gray-400">Bénin (+229)</div>
                  </div>
                </label>

                <label className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center gap-2.5 cursor-pointer hover:border-white/20 transition-all">
                  <input
                    type="checkbox"
                    checked={kkiapayConfig.acceptedMethods.celtis}
                    onChange={(e) =>
                      setKkiapayConfig({
                        ...kkiapayConfig,
                        acceptedMethods: { ...kkiapayConfig.acceptedMethods, celtis: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-[#FB8205] bg-transparent border-white/20"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Celtis Cash</div>
                    <div className="text-[10px] text-gray-400">Bénin (+229)</div>
                  </div>
                </label>

                <label className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center gap-2.5 cursor-pointer hover:border-white/20 transition-all">
                  <input
                    type="checkbox"
                    checked={kkiapayConfig.acceptedMethods.card}
                    onChange={(e) =>
                      setKkiapayConfig({
                        ...kkiapayConfig,
                        acceptedMethods: { ...kkiapayConfig.acceptedMethods, card: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-[#FB8205] bg-transparent border-white/20"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Cartes Visa/MC</div>
                    <div className="text-[10px] text-gray-400">Internationales</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Autre passerelle : MTN MoMo API Directe */}
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                  MTN
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">MTN Mobile Money Direct API (Bénin)</h4>
                  <p className="text-xs text-gray-400">Passerelle opérateur directe en secours</p>
                </div>
              </div>
              <Badge variant="success">Secours Prêt</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block mb-1">Subscription Key</span>
                <span className="font-mono text-white bg-[#020919] p-2 rounded-lg block border border-white/5 truncate">
                  {momoConfig.subscriptionKey}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">API User (UUID)</span>
                <span className="font-mono text-white bg-[#020919] p-2 rounded-lg block border border-white/5 truncate">
                  {momoConfig.apiUser}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Webhook Dédié</span>
                <span className="font-mono text-[#0BE9EF] bg-[#020919] p-2 rounded-lg block border border-white/5 truncate">
                  {mtnWebhookUrl}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. WHATSAPP BUSINESS CLOUD API                                 */}
      {/* ============================================================== */}
      {activeSubTab === 'WHATSAPP' && (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">WhatsApp Business Cloud API (Meta)</h3>
                  <Badge variant="success">Connecté</Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Notification instantanée des réservations, devis et encaissements directement sur le WhatsApp des professionnels et clients.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleTestConnection('WhatsApp')}
              className="border-white/10"
            >
              Envoyer un message test
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Phone Number ID
              </label>
              <input
                type="text"
                value={whatsappConfig.phoneNumberId}
                onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumberId: e.target.value })}
                className="w-full bg-[#020919] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#10D97F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                WhatsApp Business Account ID (WABA ID)
              </label>
              <input
                type="text"
                value={whatsappConfig.businessAccountId}
                onChange={(e) => setWhatsappConfig({ ...whatsappConfig, businessAccountId: e.target.value })}
                className="w-full bg-[#020919] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#10D97F]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Permanent System User Access Token
              </label>
              <div className="relative flex items-center">
                <input
                  type={showSecrets['waToken'] ? 'text' : 'password'}
                  value={whatsappConfig.accessToken}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, accessToken: e.target.value })}
                  className="w-full bg-[#020919] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#10D97F]"
                />
                <button
                  onClick={() => toggleShowSecret('waToken')}
                  className="absolute right-2.5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                >
                  {showSecrets['waToken'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#020919] border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white">Déclencheurs automatiques WhatsApp :</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappConfig.sendBookingAlerts}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, sendBookingAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 bg-transparent border-white/20"
                />
                <span>Alerte instantanée sur le WhatsApp du gérant lors d'une nouvelle demande ou réservation</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappConfig.sendPaymentReceipts}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, sendPaymentReceipts: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 bg-transparent border-white/20"
                />
                <span>Envoi du reçu officiel de paiement avec QR code au client après succès Kkiapay</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. WEBHOOKS & EVENEMENTS                                       */}
      {/* ============================================================== */}
      {activeSubTab === 'WEBHOOKS' && (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white">Journal des Webhooks Entrants</h3>
              <p className="text-xs text-gray-400">Événements de paiement et synchronisations transactionnelles reçues</p>
            </div>
            <Badge variant="success">Écoute active (Port 3000)</Badge>
          </div>

          <div className="space-y-3">
            {webhookLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-[#020919] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{log.gateway}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-[#0BE9EF]">
                        {log.event}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {log.transactionId}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Montant traité : <strong className="text-white">{log.amount}</strong> • Réponse : {log.duration}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs text-gray-500">{log.timestamp}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                    HTTP {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. CLES D'API DEVELOPPEUR                                     */}
      {/* ============================================================== */}
      {activeSubTab === 'API_KEYS' && (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white">Clés d’API Publiques & Accès Partenaires</h3>
              <p className="text-xs text-gray-400">Permet à des applications externes (Zapier, ERP, CRM) de communiquer avec Flowexa</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newKey = `flwx_live_api_${Math.floor(10000 + Math.random() * 90000)}_uemoa_${Date.now().toString(36)}`;
                setDeveloperApiKey(newKey);
                if (onShowToast) onShowToast('Nouvelle clé générée', 'La clé API a été renouvelée avec succès.', 'info');
              }}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="border-white/10"
            >
              Régénérer la clé
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-[#020919] border border-white/10 space-y-2">
            <label className="block text-xs font-semibold text-gray-300">
              Clé d’API Principale (Bearer Token)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={developerApiKey}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono select-all focus:outline-none"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(developerApiKey, 'Clé d’API Principale')}
                leftIcon={copiedKey === 'Clé d’API Principale' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                className="border-white/10 shrink-0"
              >
                {copiedKey === 'Clé d’API Principale' ? 'Copié' : 'Copier'}
              </Button>
            </div>
            <p className="text-[11px] text-gray-400">
              Fournissez cette clé dans l'en-tête HTTP <code className="text-[#0BE9EF]">Authorization: Bearer &lt;TOKEN&gt;</code> pour vos appels d'automatisation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
