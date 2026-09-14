import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  Clock,
  CreditCard,
  Star,
  MessageSquare,
  X,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  FileText,
  Plus,
  RefreshCw,
  TrendingUp,
  Tag,
  ArrowRight,
  Bell,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { flowexaApi } from '../../services/api';
import type {
  CRMClientItem,
  CRMClientDetailResponse,
  ClientSegmentDefinition,
  ClientSegmentCode,
  CRMReminderItem,
} from '../../types';

interface CockpitClientsViewProps {
  businessId: string;
  businessName: string;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigateToMessages?: () => void;
  onNavigateToCampaigns?: () => void;
}

export const CockpitClientsView: React.FC<CockpitClientsViewProps> = ({
  businessId,
  businessName,
  onShowToast,
  onNavigateToMessages,
  onNavigateToCampaigns,
}) => {
  const [activeTab, setActiveTab] = useState<'CLIENTS' | 'REMINDERS'>('CLIENTS');
  const [clients, setClients] = useState<CRMClientItem[]>([]);
  const [segments, setSegments] = useState<ClientSegmentDefinition[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');
  const [inactiveThresholdDays, setInactiveThresholdDays] = useState<number>(45);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fiche Client & Timeline
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDetail, setClientDetail] = useState<CRMClientDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Relances intelligentes
  const [reminders, setReminders] = useState<CRMReminderItem[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [customReminderMessage, setCustomReminderMessage] = useState<string>('');
  const [selectedReminder, setSelectedReminder] = useState<CRMReminderItem | null>(null);

  const fetchCRMData = async () => {
    setLoading(true);
    try {
      const res = await flowexaApi.getCRMClients(businessId, {
        segment: selectedSegment === 'ALL' ? undefined : selectedSegment,
        search: searchTerm.trim() || undefined,
        inactiveThresholdDays,
      });

      if (res.success && Array.isArray(res.data)) {
        setClients(res.data);
      }
      if (res.segments && Array.isArray(res.segments)) {
        setSegments(res.segments);
      }
    } catch (e) {
      console.error(e);
      onShowToast('Erreur', 'Impossible de charger le portefeuille CRM.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    setLoadingReminders(true);
    try {
      const res = await flowexaApi.getCRMReminders(businessId);
      if (res.success && Array.isArray(res.data)) {
        setReminders(res.data);
      }
    } catch (e) {
      console.error(e);
      onShowToast('Erreur', 'Impossible de charger les suggestions de relances.', 'error');
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => {
    fetchCRMData();
  }, [businessId, selectedSegment, inactiveThresholdDays]);

  useEffect(() => {
    if (activeTab === 'REMINDERS') {
      fetchReminders();
    }
  }, [activeTab, businessId]);

  const openClientDetail = async (clientId: string) => {
    setSelectedClientId(clientId);
    setLoadingDetail(true);
    try {
      const res = await flowexaApi.getCRMClientDetail(businessId, clientId, inactiveThresholdDays);
      if (res.success && res.data) {
        setClientDetail(res.data);
      } else {
        onShowToast('Introuvable', 'Détails client non disponibles.', 'warning');
      }
    } catch (e) {
      console.error(e);
      onShowToast('Erreur', 'Échec du chargement de la fiche client.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !newNote.trim()) return;

    setSavingNote(true);
    try {
      const res = await flowexaApi.addCRMClientNote(businessId, selectedClientId, newNote.trim());
      if (res.success) {
        onShowToast('Note enregistrée', 'Note interne sauvegardée de manière confidentielle.', 'success');
        setNewNote('');
        // Recharger le détail client
        openClientDetail(selectedClientId);
      } else {
        onShowToast('Erreur', res.message || 'Échec de l’enregistrement.', 'error');
      }
    } catch (e: any) {
      onShowToast('Erreur', e.message || 'Erreur réseau.', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendReminder = async (reminder: CRMReminderItem, messageToSend?: string) => {
    setSendingReminderId(reminder.id);
    try {
      const res = await flowexaApi.sendCRMReminder(
        businessId,
        reminder.id,
        messageToSend || reminder.defaultMessage
      );

      if (res.success) {
        onShowToast('Relance transmise', res.message || 'Message envoyé avec succès au client.', 'success');
        setSelectedReminder(null);
        setCustomReminderMessage('');
        fetchReminders();
      } else {
        onShowToast('Erreur', res.message || 'Échec de l’envoi de la relance.', 'error');
      }
    } catch (e: any) {
      onShowToast('Erreur', e.message || 'Erreur réseau.', 'error');
    } finally {
      setSendingReminderId(null);
    }
  };

  const filteredClients = clients.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  });

  const vipCount = clients.filter((c) => c.segment === 'VIP').length;
  const inactiveCount = clients.filter((c) => c.isInactive).length;
  const recurrentCount = clients.filter((c) => c.segment === 'RECURRENT').length;
  const totalRevenue = clients.reduce((sum, c) => sum + (c.totalPaid || 0), 0);

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-[#0B1528] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cyan" dot>
              Portefeuille CRM & Relations Clients
            </Badge>
            <span className="text-xs text-gray-400">Entreprise : {businessName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Mes Clients, Fidélisation & Relances</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Segmentation dynamique basée sur vos interactions réelles, historique complet et opportunités de contact.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onNavigateToCampaigns && (
            <Button
              size="md"
              variant="primary"
              onClick={onNavigateToCampaigns}
              leftIcon={<TrendingUp className="w-4 h-4" />}
              className="cursor-pointer text-xs"
            >
              Campagnes & Croissance
            </Button>
          )}
          {onNavigateToMessages && (
            <Button
              size="md"
              variant="outline"
              onClick={onNavigateToMessages}
              leftIcon={<MessageSquare className="w-4 h-4" />}
              className="cursor-pointer text-xs border-white/15"
            >
              Messagerie Directe
            </Button>
          )}
          <Button
            size="md"
            variant="ghost"
            onClick={fetchCRMData}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            isLoading={loading}
            className="cursor-pointer text-xs text-gray-300 hover:text-white"
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Main Tabs : CRM Clients vs Relances Intelligentes */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('CLIENTS')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'CLIENTS'
              ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Portefeuille Clients</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-extrabold">
            {clients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('REMINDERS')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'REMINDERS'
              ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Relances Intelligentes</span>
          {reminders.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-black font-extrabold">
              {reminders.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'CLIENTS' && (
        <div className="space-y-5">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0B1528] border border-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-400">Total Portefeuille</p>
              <p className="text-xl font-bold text-white mt-1">{clients.length} client(s)</p>
              <span className="text-[10px] text-emerald-400 font-medium">Interactions réelles</span>
            </div>

            <div className="bg-[#0B1528] border border-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-400">Clients Récurrents</p>
              <p className="text-xl font-bold text-cyan-400 mt-1">{recurrentCount}</p>
              <span className="text-[10px] text-gray-400">≥ 2 prestations honorées</span>
            </div>

            <div className="bg-[#0B1528] border border-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-400">Clients VIP</p>
              <p className="text-xl font-bold text-[#FB8205] mt-1">{vipCount}</p>
              <span className="text-[10px] text-gray-400">Paniers / commandes élevés</span>
            </div>

            <div className="bg-[#0B1528] border border-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-400">Sans échange récent</p>
              <p className="text-xl font-bold text-amber-400 mt-1">{inactiveCount}</p>
              <span className="text-[10px] text-gray-400">&gt; {inactiveThresholdDays} jours sans contact</span>
            </div>
          </div>

          {/* Filter Bar: Segments Tabs & Search & Inactive Threshold */}
          <div className="bg-[#0B1528] border border-white/10 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Segments Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedSegment('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedSegment === 'ALL'
                      ? 'bg-[#FB8205] text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Tous ({clients.length})
                </button>
                {segments.map((seg) => (
                  <button
                    key={seg.code}
                    onClick={() => setSelectedSegment(seg.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedSegment === seg.code
                        ? 'bg-[#FB8205] text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{seg.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                      {seg.clientCount}
                    </span>
                  </button>
                ))}
              </div>

              {/* Inactive Threshold Selector */}
              <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Seuil inactivité :
                </span>
                <select
                  value={inactiveThresholdDays}
                  onChange={(e) => setInactiveThresholdDays(Number(e.target.value))}
                  className="bg-[#0F1C36] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#FB8205]"
                >
                  <option value={30}>30 jours</option>
                  <option value={45}>45 jours</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#020919] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
              />
            </div>
          </div>

          {/* Clients Cards Grid */}
          {loading ? (
            <div className="bg-[#0B1528] border border-white/5 rounded-2xl p-12 text-center text-gray-400 text-sm">
              <Users className="w-6 h-6 text-[#FB8205] animate-spin mx-auto mb-2" />
              Chargement du portefeuille clients...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-[#0B1528] border border-white/5 rounded-2xl p-12 text-center text-gray-400">
              <UserCheck className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="font-semibold text-white">Aucun client ne correspond à ces critères</p>
              <p className="text-xs text-gray-500 mt-1">
                Ajustez le filtre de segment ou la recherche textuelle.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => openClientDetail(client.id)}
                  className="p-5 rounded-2xl bg-[#0B1528] border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between gap-4 group cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FB8205]/15 border border-[#FB8205]/30 flex items-center justify-center font-bold text-[#FB8205] text-sm">
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-[#FB8205] transition-colors">
                            {client.name}
                          </h4>
                          <p className="text-xs font-mono text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            {client.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={
                            client.segment === 'VIP'
                              ? 'orange'
                              : client.segment === 'RECURRENT'
                              ? 'cyan'
                              : client.segment === 'INACTIVE'
                              ? 'neutral'
                              : 'primary'
                          }
                        >
                          {client.segment}
                        </Badge>
                        {client.isInactive && (
                          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {client.daysSinceLastInteraction}j
                          </span>
                        )}
                      </div>
                    </div>

                    {client.email && (
                      <p className="text-[11px] text-gray-400 flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </p>
                    )}

                    <div className="p-3 bg-[#020919] rounded-xl border border-white/5 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-gray-500 block">Demandes</span>
                        <strong className="text-white font-bold">{client.totalRequests}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">Réservations</span>
                        <strong className="text-cyan-400 font-bold">{client.totalBookings}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">CA Payé</span>
                        <strong className="text-emerald-400 font-bold">
                          {client.totalPaid > 0 ? `${(client.totalPaid / 1000).toFixed(0)}k` : '0 F'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-gray-400">
                    <span className="text-[11px]">
                      Dernière activité : <strong className="text-gray-300">{client.lastInteractionDate ? new Date(client.lastInteractionDate).toLocaleDateString('fr-FR') : 'Récente'}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-[#FB8205] font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Fiche & Timeline</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Relances Intelligentes Tab */}
      {activeTab === 'REMINDERS' && (
        <div className="space-y-4">
          <div className="bg-[#0B1528] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  Suggestions de Relances Courtoises
                </h3>
                <p className="text-xs text-gray-300 mt-0.5">
                  Flowexa détecte les échanges nécessitant un suivi sans jamais harceler les clients.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={fetchReminders}
                isLoading={loadingReminders}
                className="text-gray-300 hover:text-white text-xs cursor-pointer"
              >
                Actualiser
              </Button>
            </div>

            {loadingReminders ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
                Analyse des opportunités de relances...
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-white mb-1">Toutes vos relations sont à jour</h4>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Aucune demande en attente sans réponse ou prestation récente sans suivi n'a été détectée.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="bg-[#0F1C36] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            rem.type === 'REQUEST_PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : rem.type === 'APPOINTMENT_FOLLOWUP'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {rem.type === 'REQUEST_PENDING'
                            ? 'Demande en attente'
                            : rem.type === 'APPOINTMENT_FOLLOWUP'
                            ? 'Retour d’expérience'
                            : rem.title}
                        </span>
                        <span className="text-xs text-gray-400">
                          Depuis {rem.delayDays} jour(s)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{rem.clientName}</h4>
                        <span className="text-xs font-mono text-gray-400">{rem.clientPhone}</span>
                      </div>

                      <p className="text-xs text-gray-300 italic bg-black/20 p-2.5 rounded-lg border border-white/5">
                        "{rem.defaultMessage}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                        onClick={() => handleSendReminder(rem)}
                        isLoading={sendingReminderId === rem.id}
                        className="cursor-pointer text-xs"
                      >
                        Envoyer maintenant
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReminder(rem);
                          setCustomReminderMessage(rem.defaultMessage);
                        }}
                        className="cursor-pointer text-xs border-white/20 text-gray-300 hover:text-white"
                      >
                        Personnaliser
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Personnaliser Relance */}
      {selectedReminder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1528] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-[#FB8205]" />
                Personnaliser le message pour {selectedReminder.clientName}
              </h3>
              <button
                onClick={() => setSelectedReminder(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              rows={4}
              value={customReminderMessage}
              onChange={(e) => setCustomReminderMessage(e.target.value)}
              className="w-full bg-[#0F1C36] border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#FB8205]"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReminder(null)}
                className="cursor-pointer text-gray-400"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send className="w-3.5 h-3.5" />}
                onClick={() => handleSendReminder(selectedReminder, customReminderMessage)}
                isLoading={sendingReminderId === selectedReminder.id}
                className="cursor-pointer"
              >
                Envoyer le message
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fiche Client Modal avec Timeline et Notes Confidentielles */}
      {selectedClientId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1528] border border-white/15 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 text-left shadow-2xl">
            {/* Header Fiche */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FB8205]/20 border border-[#FB8205]/30 flex items-center justify-center text-lg font-bold text-[#FB8205]">
                  {clientDetail?.name ? clientDetail.name.substring(0, 2).toUpperCase() : 'CL'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{clientDetail?.name || 'Fiche Client'}</h3>
                    {clientDetail?.segment && (
                      <Badge variant="orange">{clientDetail.segment}</Badge>
                    )}
                    {clientDetail?.retentionStatus && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          clientDetail.retentionStatus === 'HEALTHY'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : clientDetail.retentionStatus === 'AT_RISK_OF_INACTIVITY'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {clientDetail.retentionStatus === 'HEALTHY'
                          ? 'Relation Active'
                          : clientDetail.retentionStatus === 'AT_RISK_OF_INACTIVITY'
                          ? 'Risque Inactivité'
                          : 'Inactif'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Historique consolidé et traçabilité pour {businessName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedClientId(null);
                  setClientDetail(null);
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <Users className="w-6 h-6 text-[#FB8205] animate-spin mx-auto mb-2" />
                Chargement complet de la fiche...
              </div>
            ) : clientDetail ? (
              <div className="space-y-6">
                {/* Diagnostic & Suggested Action */}
                {clientDetail.suggestedAction && (
                  <div className="bg-[#0F1C36] border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Suggestion d'Action
                      </span>
                      <p className="text-xs text-gray-300">{clientDetail.retentionDiagnosis}</p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedReminder({
                          id: `rem-${clientDetail.id}`,
                          type: 'INACTIVE_CLIENT',
                          title: clientDetail.suggestedAction?.label || 'Action de contact',
                          clientId: clientDetail.id,
                          clientName: clientDetail.name,
                          clientPhone: clientDetail.phone,
                          reason: clientDetail.retentionDiagnosis,
                          delayDays: clientDetail.daysSinceLastInteraction,
                          canSend: true,
                          channel: 'INTERNAL',
                          defaultMessage: clientDetail.suggestedAction?.defaultMessage || '',
                        });
                        setCustomReminderMessage(clientDetail.suggestedAction?.defaultMessage || '');
                      }}
                      className="cursor-pointer text-xs shrink-0"
                    >
                      {clientDetail.suggestedAction.label}
                    </Button>
                  </div>
                )}

                {/* Coordonnées & Actions rapides */}
                <div className="p-4 bg-[#020919] rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <strong className="text-white font-mono">{clientDetail.phone}</strong>
                    </p>
                    {clientDetail.email && (
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-gray-300">{clientDetail.email}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${clientDetail.phone}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Phone className="w-3 h-3" />
                      Appeler
                    </a>
                    <a
                      href={`https://wa.me/229${clientDetail.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#FB8205]/10 hover:bg-[#FB8205]/20 text-[#FB8205] text-xs font-bold flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3 h-3" />
                      WhatsApp
                    </a>
                  </div>
                </div>

                {/* Timeline Chronologique Réelle */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Chronologie des Échanges ({clientDetail.timeline?.length || 0})</span>
                    <span className="text-[10px] text-gray-400 font-normal">
                      Demandes, paiements, avis, messages
                    </span>
                  </h4>

                  {clientDetail.timeline && clientDetail.timeline.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {clientDetail.timeline.map((evt) => (
                        <div
                          key={evt.id}
                          className="p-3 bg-[#020919] rounded-xl border border-white/5 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  evt.type === 'PAYMENT'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : evt.type === 'REVIEW'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : evt.type === 'NOTE'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-cyan-500/20 text-cyan-300'
                                }`}
                              >
                                {evt.type}
                              </span>
                              <strong className="text-white">{evt.title}</strong>
                            </div>
                            <p className="text-gray-300 text-[11px]">{evt.description}</p>
                            <span className="text-[10px] text-gray-500 block">
                              {new Date(evt.date).toLocaleDateString('fr-FR')} à{' '}
                              {new Date(evt.date).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {typeof evt.amount === 'number' && (
                            <span className="text-emerald-400 font-bold shrink-0">
                              +{(evt.amount ?? 0).toLocaleString('fr-FR')} FCFA
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Aucun événement enregistré.</p>
                  )}
                </div>

                {/* Notes Internes Confidentielles */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#FB8205]" />
                    <span>Notes Internes Confidentielles</span>
                  </h4>

                  {clientDetail.internalNotes && clientDetail.internalNotes.length > 0 ? (
                    <div className="space-y-1.5">
                      {clientDetail.internalNotes.map((note, idx) => (
                        <div key={idx} className="p-2.5 bg-[#020919] rounded-lg border border-white/5 text-xs text-gray-300">
                          {note}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Aucune note pour ce client.</p>
                  )}

                  <form onSubmit={handleAddNote} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Ajouter une note (ex : préfère les visites le samedi matin)..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 bg-[#0F1C36] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={savingNote}
                      className="cursor-pointer text-xs shrink-0"
                    >
                      Ajouter
                    </Button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
