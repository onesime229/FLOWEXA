import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  Bell,
  Calendar,
  Gift,
  AlertTriangle,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Smartphone,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  AutomationRuleEntity,
  AutomationHistoryEntity,
  BusinessAutomationStats,
  AutomationRunSummary,
  AutomationRuleType,
} from '../../types';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';

interface BusinessAutomationsManagerProps {
  businessId: string;
  businessName: string;
  moduleCode: string;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const BusinessAutomationsManager: React.FC<BusinessAutomationsManagerProps> = ({
  businessId,
  businessName,
  moduleCode,
  onShowToast,
}) => {
  const [rules, setRules] = useState<AutomationRuleEntity[]>([]);
  const [history, setHistory] = useState<AutomationHistoryEntity[]>([]);
  const [stats, setStats] = useState<BusinessAutomationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningEngine, setIsRunningEngine] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [customMsgDraft, setCustomMsgDraft] = useState<{ [key: string]: string }>({});
  const [lastRunSummary, setLastRunSummary] = useState<AutomationRunSummary | null>(null);

  const fetchAutomationData = async () => {
    try {
      setIsLoading(true);
      const headers = {
        'x-user-role': 'BUSINESS_OWNER',
        'x-business-id': businessId,
      };

      const [rulesRes, historyRes, statsRes] = await Promise.all([
        fetch(`/api/v1/businesses/${businessId}/automations/rules`, { headers }),
        fetch(`/api/v1/businesses/${businessId}/automations/history?limit=50`, { headers }),
        fetch(`/api/v1/businesses/${businessId}/automations/stats`, { headers }),
      ]);

      if (rulesRes.ok) {
        const json = await rulesRes.json();
        setRules(json.data || []);
      }
      if (historyRes.ok) {
        const json = await historyRes.json();
        setHistory(json.data || []);
      }
      if (statsRes.ok) {
        const json = await statsRes.json();
        setStats(json.data || null);
      }
    } catch (err) {
      console.error('Erreur chargement automatisations', err);
      onShowToast('Erreur', 'Impossible de charger les données d’automatisation.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomationData();
  }, [businessId]);

  const handleToggleRule = async (rule: AutomationRuleEntity) => {
    const updatedStatus = !rule.isEnabled;
    try {
      const res = await fetch(`/api/v1/businesses/${businessId}/automations/rules/${rule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'BUSINESS_OWNER',
          'x-business-id': businessId,
        },
        body: JSON.stringify({ isEnabled: updatedStatus }),
      });

      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, isEnabled: updatedStatus } : r))
        );
        onShowToast(
          updatedStatus ? 'Règle activée' : 'Règle désactivée',
          `La règle "${rule.name}" est désormais ${updatedStatus ? 'active' : 'en pause'}.`,
          'success'
        );
        fetchAutomationData();
      } else {
        throw new Error('Erreur mise à jour règle');
      }
    } catch (err) {
      onShowToast('Erreur', 'Impossible de modifier le statut de la règle.', 'error');
    }
  };

  const handleSaveMessageTemplate = async (ruleId: string) => {
    const newTemplate = customMsgDraft[ruleId];
    if (newTemplate === undefined) return;

    try {
      const res = await fetch(`/api/v1/businesses/${businessId}/automations/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'BUSINESS_OWNER',
          'x-business-id': businessId,
        },
        body: JSON.stringify({ customMessageTemplate: newTemplate }),
      });

      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, customMessageTemplate: newTemplate } : r))
        );
        setEditingRuleId(null);
        onShowToast('Modèle enregistré', 'Le texte de relance personnalisé a été sauvegardé.', 'success');
      }
    } catch (err) {
      onShowToast('Erreur', 'Impossible de sauvegarder le texte.', 'error');
    }
  };

  const handleSaveBirthdayOffer = async (ruleId: string, discount: number, validity: number) => {
    try {
      const res = await fetch(`/api/v1/businesses/${businessId}/automations/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'BUSINESS_OWNER',
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          birthdayOffer: {
            discountPercentage: discount,
            validityDays: validity,
            customMessage: `Profitez de ${discount}% de remise pour votre anniversaire valable ${validity} jours !`,
          },
        }),
      });

      if (res.ok) {
        onShowToast('Offre mise à jour', 'Avantage anniversaire enregistré avec succès.', 'success');
        fetchAutomationData();
      }
    } catch (err) {
      onShowToast('Erreur', 'Impossible de mettre à jour l’offre.', 'error');
    }
  };

  const handleRunAutomationNow = async () => {
    try {
      setIsRunningEngine(true);
      const res = await fetch(`/api/v1/businesses/${businessId}/automations/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'BUSINESS_OWNER',
          'x-business-id': businessId,
        },
        body: JSON.stringify({ force: false }),
      });

      if (res.ok) {
        const json = await res.json();
        const summary: AutomationRunSummary = json.data;
        setLastRunSummary(summary);
        onShowToast(
          'Cycle d’automatisation terminé',
          `${summary.sentCount} rappel(s) envoyé(s), ${summary.skippedCount} déjà traité(s) (anti-doublon).`,
          'success'
        );
        fetchAutomationData();
      }
    } catch (err) {
      onShowToast('Erreur', 'Échec lors de l’exécution du cycle d’automatisation.', 'error');
    } finally {
      setIsRunningEngine(false);
    }
  };

  const getRuleIcon = (type: AutomationRuleType) => {
    switch (type) {
      case 'APPOINTMENT_REMINDER':
        return <Calendar className="w-5 h-5 text-sky-400" />;
      case 'BOOKING_REMINDER':
        return <Clock className="w-5 h-5 text-emerald-400" />;
      case 'REQUEST_PENDING_FOLLOWUP':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'REQUEST_ACCEPTED_CLIENT_FOLLOWUP':
        return <CheckCircle2 className="w-5 h-5 text-cyan-400" />;
      case 'PAYMENT_BALANCE_REMINDER':
        return <Zap className="w-5 h-5 text-purple-400" />;
      case 'CLIENT_BIRTHDAY':
        return <Gift className="w-5 h-5 text-pink-400" />;
      case 'BUSINESS_ALERT':
        return <Bell className="w-5 h-5 text-red-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#FB8205]" />;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="danger">URGENT</Badge>;
      case 'HIGH':
        return <Badge variant="warning">HAUTE</Badge>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[11px] bg-gray-700 text-gray-300">BASSE</span>;
      default:
        return <Badge variant="info">NORMALE</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* En-tête et Cockpit de Contrôle */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <Badge variant="cyan">Moteur Actif & Autonome</Badge>
            <span className="text-xs text-gray-400">Entreprise : {businessName}</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Zap className="w-7 h-7 text-[#FB8205]" />
            <span>Automatisations Intelligentes & Rappels</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Flowexa agit comme votre assistant opérationnel : relance de demandes sans réponse, rappels de rendez-vous (24h & 2h), confirmations d'arrivée, soldes de paiement et attentions personnalisées.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchAutomationData}
            disabled={isLoading}
            className="border-white/10 hover:border-white/20"
          >
            Actualiser
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Play className={`w-4 h-4 fill-white ${isRunningEngine ? 'animate-pulse' : ''}`} />}
            onClick={handleRunAutomationNow}
            disabled={isRunningEngine}
            className="shadow-lg shadow-[#FB8205]/20"
          >
            {isRunningEngine ? 'Vérification en cours...' : 'Exécuter maintenant'}
          </Button>
        </div>
      </div>

      {/* Cartes Métriques KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-white/10 bg-[#0A1428]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Règles Actives
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FB8205]/10 border border-[#FB8205]/20 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-[#FB8205]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {stats?.activeRulesCount ?? 0}
            </span>
            <span className="text-xs text-gray-400">/ {stats?.totalRulesCount ?? 0} configurées</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 inline" /> Détection d'événements continue
          </p>
        </Card>

        <Card className="p-5 border-white/10 bg-[#0A1428]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Envoyés Aujourd'hui
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {stats?.sentTodayCount ?? 0}
            </span>
            <span className="text-xs text-gray-400">notifications</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Total cumulé : {stats?.totalSentCount ?? 0}
          </p>
        </Card>

        <Card className="p-5 border-white/10 bg-[#0A1428]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Échéances à Venir
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {stats?.upcomingRemindersCount ?? 0}
            </span>
            <span className="text-xs text-gray-400">programmés</span>
          </div>
          <p className="text-[11px] text-sky-400 mt-1">
            Rappels déclenchés automatiquement
          </p>
        </Card>

        <Card className="p-5 border-white/10 bg-[#0A1428]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Protection Doublons
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">100%</span>
            <span className="text-xs text-emerald-400 font-semibold">Idempotent</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            0 doublon garanti par clé unique
          </p>
        </Card>
      </div>

      {/* Résumé de dernière exécution manuelle */}
      {lastRunSummary && (
        <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Dernier cycle terminé :</strong> {lastRunSummary.sentCount} notification(s) envoyée(s), {lastRunSummary.skippedCount} demande(s) déjà notifiée(s).
            </span>
          </div>
          <span className="text-xs text-emerald-400/80 font-mono">
            {new Date(lastRunSummary.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Navigation Onglets : Règles vs Historique */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'bg-[#FB8205] text-white shadow-md shadow-[#FB8205]/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Règles d’Automatisation ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-[#FB8205] text-white shadow-md shadow-[#FB8205]/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Journal d'Exécution ({history.length})</span>
        </button>
      </div>

      {/* CONTENU ONGLET 1 : RÈGLES */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {rules.map((rule) => {
              const isEditing = editingRuleId === rule.id;
              const draftMessage = customMsgDraft[rule.id] ?? (rule.customMessageTemplate || '');

              return (
                <div
                  key={rule.id}
                  className={`bg-[#0A1428] border rounded-2xl p-5 transition-all ${
                    rule.isEnabled
                      ? 'border-white/10 hover:border-[#FB8205]/30'
                      : 'border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                        {getRuleIcon(rule.ruleType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-base font-bold text-white tracking-tight">
                            {rule.name}
                          </h4>
                          {getPriorityBadge(rule.priority)}
                          <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/5 font-mono">
                            {rule.ruleType}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
                          {rule.description}
                        </p>
                      </div>
                    </div>

                    {/* Contrôles d'activation & boutons */}
                    <div className="flex items-center gap-3 self-end md:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (isEditing) {
                            setEditingRuleId(null);
                          } else {
                            setEditingRuleId(rule.id);
                            setCustomMsgDraft((prev) => ({
                              ...prev,
                              [rule.id]: rule.customMessageTemplate || '',
                            }));
                          }
                        }}
                        className="text-xs text-gray-300 hover:text-white"
                        rightIcon={isEditing ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      >
                        {isEditing ? 'Fermer' : 'Configurer'}
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          rule.isEnabled ? 'bg-emerald-500' : 'bg-gray-700'
                        }`}
                        aria-pressed={rule.isEnabled}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            rule.isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Panneau de configuration dépliable */}
                  {isEditing && (
                    <div className="mt-5 pt-4 border-t border-white/10 space-y-4 animate-in fade-in">
                      {/* Configuration spécifique anniversaire */}
                      {rule.ruleType === 'CLIENT_BIRTHDAY' && rule.birthdayOffer && (
                        <div className="p-3.5 rounded-xl bg-pink-950/20 border border-pink-500/20 space-y-3">
                          <h5 className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Gift className="w-3.5 h-3.5" />
                            Paramètres de l'Offre Anniversaire Client
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="text-gray-400 block mb-1">Pourcentage de réduction (%)</label>
                              <input
                                type="number"
                                min={5}
                                max={50}
                                defaultValue={rule.birthdayOffer.discountPercentage || 10}
                                id={`discount-${rule.id}`}
                                className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white"
                              />
                            </div>
                            <div>
                              <label className="text-gray-400 block mb-1">Validité de l'offre (jours)</label>
                              <input
                                type="number"
                                min={1}
                                max={60}
                                defaultValue={rule.birthdayOffer.validityDays || 30}
                                id={`validity-${rule.id}`}
                                className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white"
                              />
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const dInput = document.getElementById(`discount-${rule.id}`) as HTMLInputElement;
                              const vInput = document.getElementById(`validity-${rule.id}`) as HTMLInputElement;
                              handleSaveBirthdayOffer(rule.id, parseInt(dInput.value, 10), parseInt(vInput.value, 10));
                            }}
                            className="text-xs border-pink-500/30 text-pink-300 hover:bg-pink-500/10"
                          >
                            Enregistrer l'offre
                          </Button>
                        </div>
                      )}

                      {/* Éditeur de modèle de texte */}
                      <div>
                        <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-[#FB8205]" />
                          Texte de la notification / rappel
                        </label>
                        <textarea
                          rows={2}
                          value={draftMessage}
                          onChange={(e) =>
                            setCustomMsgDraft((prev) => ({
                              ...prev,
                              [rule.id]: e.target.value,
                            }))
                          }
                          placeholder="Modèle de message personnalisé..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:border-[#FB8205] focus:outline-none"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[11px] text-gray-500">
                            Variables disponibles : {'{date}'}, {'{time}'}
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveMessageTemplate(rule.id)}
                            className="text-xs"
                          >
                            Sauvegarder le modèle
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 2 : HISTORIQUE D'EXÉCUTION */}
      {activeTab === 'history' && (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FB8205]" />
              <span>Dernières notifications & rappels émis</span>
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              {history.length} événement(s) archivé(s)
            </span>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Info className="w-8 h-8 mx-auto text-gray-500" />
              <p className="text-sm">Aucun événement d'automatisation enregistré pour le moment.</p>
              <p className="text-xs text-gray-500">
                Les rappels apparaîtront ici dès que les jalons de rendez-vous ou de relances seront atteints.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[550px] overflow-y-auto pr-1">
              {history.map((log) => (
                <div key={log.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-2 h-2 rounded-full ${log.status === 'SENT' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span className="text-sm font-semibold text-white">
                        {log.title}
                      </span>
                      {getPriorityBadge(log.priority)}
                      <span className="text-[11px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                        {log.ruleType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">{log.message}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span>Destinataire : <strong className="text-gray-300">{log.recipientName || log.recipientType}</strong></span>
                      {log.recipientPhone && <span>Tél : {log.recipientPhone}</span>}
                      <span className="font-mono text-[10px] text-gray-600">ID Clé : {log.idempotencyKey}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono text-gray-400 block">
                      {new Date(log.executedAt).toLocaleDateString()} à {new Date(log.executedAt).toLocaleTimeString()}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${log.status === 'SENT' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {log.status === 'SENT' ? '✓ Délivré' : '✕ Échec'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
