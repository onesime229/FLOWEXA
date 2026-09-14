import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Filter,
  RefreshCw,
  Search,
  MessageCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Inbox,
  Check,
  X,
  History,
  Info,
  PlayCircle,
  UserCheck,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { FlowexaRequestItem, RequestStatus } from '../../types';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Card } from '../design-system/Card';
import { Modal } from '../design-system/Modal';
import { Textarea } from '../design-system/Input';
import { ReservationStepper } from '../requests/ReservationStepper';
import { ScheduleAppointmentModal } from '../requests/ScheduleAppointmentModal';
import { RequestActionModal } from '../requests/RequestActionModals';

export interface BusinessRequestsManagerProps {
  businessId: string;
  moduleCode: string;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onOpenConversation?: (conversationId: string) => void;
}

export const BusinessRequestsManager: React.FC<BusinessRequestsManagerProps> = ({
  businessId,
  moduleCode,
  onShowToast,
  onOpenConversation,
}) => {
  // Tabs for the complete B15 cycle:
  // - PENDING (En attente de confirmation)
  // - CONFIRMED (Confirmées, acceptées ou planifiées)
  // - IN_PROGRESS (En cours de réalisation)
  // - COMPLETED (Terminées)
  // - ALL (Toutes avec historique)
  const [activeTab, setActiveTab] = useState<'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'ALL'>('PENDING');
  const [requests, setRequests] = useState<FlowexaRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected request for details dialog
  const [selectedRequest, setSelectedRequest] = useState<FlowexaRequestItem | null>(null);

  // Modals for B15/F15 lifecycle actions
  const [scheduleTargetRequest, setScheduleTargetRequest] = useState<FlowexaRequestItem | null>(null);
  const [actionModalConfig, setActionModalConfig] = useState<{
    request: FlowexaRequestItem | null;
    actionType: 'START' | 'COMPLETE' | 'CANCEL' | 'REJECT' | 'NO_SHOW' | null;
  }>({ request: null, actionType: null });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/requests?business_id=${businessId}`, {
        headers: {
          'x-user-role': 'BUSINESS_OWNER',
          'x-business-id': businessId,
        },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRequests(json.data);
      }
    } catch (err) {
      console.error('Erreur chargement des demandes:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Filtering based on tab
  const getFilteredRequests = () => {
    let list = requests;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.clientName?.toLowerCase().includes(q) ||
          r.clientPhone?.includes(q) ||
          r.message?.toLowerCase().includes(q) ||
          r.catalogItemTitle?.toLowerCase().includes(q) ||
          r.assignedEmployeeName?.toLowerCase().includes(q)
      );
    }

    switch (activeTab) {
      case 'PENDING':
        return list.filter((r) => r.status === 'PENDING');
      case 'CONFIRMED':
        return list.filter((r) => ['CONFIRMED', 'ACCEPTED', 'SCHEDULED'].includes(r.status));
      case 'IN_PROGRESS':
        return list.filter((r) => r.status === 'IN_PROGRESS');
      case 'COMPLETED':
        return list.filter((r) => r.status === 'COMPLETED');
      case 'ALL':
      default:
        return list;
    }
  };

  const filteredList = getFilteredRequests();

  // Counts for tabs
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const confirmedCount = requests.filter((r) => ['CONFIRMED', 'ACCEPTED', 'SCHEDULED'].includes(r.status)).length;
  const inProgressCount = requests.filter((r) => r.status === 'IN_PROGRESS').length;
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;
  const allCount = requests.length;

  // Direct confirmation of a request (PENDING -> CONFIRMED)
  const handleDirectConfirm = async (req: FlowexaRequestItem) => {
    try {
      const res = await fetch(`/api/v1/requests/${req.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'BUSINESS_OWNER',
          'x-business-id': businessId,
        },
        body: JSON.stringify({ note: 'Votre réservation a été confirmée.' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        onShowToast('Attention', json.message || 'Impossible de confirmer la réservation.', 'warning');
      } else {
        onShowToast('Réservation Confirmée', 'La réservation a été confirmée et le client notifié.', 'success');
        await fetchRequests();
      }
    } catch (err) {
      onShowToast('Erreur réseau', 'Impossible de contacter le serveur.', 'error');
    }
  };

  // Open or create messaging conversation
  const handleOpenMessaging = async (req: FlowexaRequestItem) => {
    try {
      const res = await fetch(`/api/v1/requests/${req.id}/conversation`, {
        method: 'POST',
        headers: {
          'x-user-role': 'BUSINESS_OWNER',
          'x-business-id': businessId,
        },
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (onOpenConversation) {
          onOpenConversation(json.data.id);
        } else {
          onShowToast('Messagerie liée', `Conversation ouverte avec ${req.clientName}.`, 'info');
        }
      } else {
        onShowToast('Attention', json.message || 'Impossible d’ouvrir la conversation.', 'warning');
      }
    } catch (err) {
      onShowToast('Erreur', 'Impossible de joindre la messagerie.', 'error');
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="yellow" dot>En attente</Badge>;
      case 'CONFIRMED':
      case 'ACCEPTED':
        return <Badge variant="emerald" dot>Confirmée</Badge>;
      case 'SCHEDULED':
        return <Badge variant="cyan" dot>Planifiée</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="orange" dot>En cours</Badge>;
      case 'COMPLETED':
        return <Badge variant="emerald" dot>Terminée</Badge>;
      case 'NO_SHOW':
        return <Badge variant="rose" dot>No-Show</Badge>;
      case 'REJECTED':
        return <Badge variant="rose" dot>Refusée</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" dot>Annulée</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getInteractionLabel = (type: string) => {
    switch (type) {
      case 'BOOKING':
        return 'Réservation';
      case 'APPOINTMENT':
        return 'Rendez-vous';
      case 'REQUEST':
        return 'Demande de visite / prestation';
      case 'CONTACT_ONLY':
        return 'Contact simple';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Metric Cards Top */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('PENDING')}
          className={`bg-[#0A1428] border rounded-2xl p-4 cursor-pointer transition-all ${
            activeTab === 'PENDING' ? 'border-amber-400 shadow-lg shadow-amber-400/10' : 'border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>En attente</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">À confirmer ou planifier</p>
        </div>

        <div
          onClick={() => setActiveTab('CONFIRMED')}
          className={`bg-[#0A1428] border rounded-2xl p-4 cursor-pointer transition-all ${
            activeTab === 'CONFIRMED' ? 'border-[#0BE9EF] shadow-lg shadow-[#0BE9EF]/10' : 'border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Confirmées / RDV</span>
            <Calendar className="w-3.5 h-3.5 text-[#0BE9EF]" />
          </div>
          <div className="text-2xl font-black text-[#0BE9EF]">{confirmedCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">Disponibilités validées</p>
        </div>

        <div
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`bg-[#0A1428] border rounded-2xl p-4 cursor-pointer transition-all ${
            activeTab === 'IN_PROGRESS' ? 'border-[#FB8205] shadow-lg shadow-[#FB8205]/10' : 'border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>En cours</span>
            <PlayCircle className="w-3.5 h-3.5 text-[#FB8205] animate-pulse" />
          </div>
          <div className="text-2xl font-black text-[#FB8205]">{inProgressCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">Prestations actives</p>
        </div>

        <div
          onClick={() => setActiveTab('COMPLETED')}
          className={`bg-[#0A1428] border rounded-2xl p-4 cursor-pointer transition-all ${
            activeTab === 'COMPLETED' ? 'border-emerald-400 shadow-lg shadow-emerald-400/10' : 'border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Terminées</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{completedCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">Clôturées avec succès</p>
        </div>
      </div>

      {/* Tabs & Search Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0A1428] border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          {[
            { id: 'PENDING', label: 'En attente', count: pendingCount },
            { id: 'CONFIRMED', label: 'Confirmées & RDV', count: confirmedCount },
            { id: 'IN_PROGRESS', label: 'En cours', count: inProgressCount },
            { id: 'COMPLETED', label: 'Terminées', count: completedCount },
            { id: 'ALL', label: 'Toutes', count: allCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#FB8205] text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer client, staff..."
              className="w-full bg-[#020919] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchRequests}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="border-white/10"
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Requests List */}
      {filteredList.length === 0 ? (
        <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-12 text-center max-w-md mx-auto">
          <Inbox className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">Aucune demande dans cette catégorie</h4>
          <p className="text-xs text-gray-400">
            {activeTab === 'PENDING'
              ? 'Toutes vos demandes en attente ont été traitées.'
              : activeTab === 'CONFIRMED'
              ? 'Aucune réservation en attente de réalisation.'
              : activeTab === 'IN_PROGRESS'
              ? 'Aucune prestation en cours d’exécution en ce moment.'
              : 'Les interactions de vos clients apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredList.map((req) => (
            <div
              key={req.id}
              className="bg-[#0A1428] border border-white/5 hover:border-white/15 rounded-2xl p-5 transition-all space-y-4"
            >
              {/* Top Details & Stepper */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(req.status)}
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-white/5 text-gray-300">
                      {getInteractionLabel(req.interactionType)}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(req.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {req.assignedEmployeeName && (
                      <span className="text-xs text-[#0BE9EF] bg-[#0BE9EF]/10 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                        <UserCheck className="w-3 h-3" />
                        {req.assignedEmployeeName}
                      </span>
                    )}
                    {/* Statut Paiement */}
                    {req.paymentStatus === 'PAID' ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Payé ({(req.paidAmount ?? req.lockedPrice ?? req.catalogItemPrice ?? 0).toLocaleString()} FCFA)
                      </span>
                    ) : req.paymentStatus === 'PROCESSING' ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Paiement en cours
                      </span>
                    ) : (req.lockedPrice !== undefined || req.catalogItemPrice !== undefined) ? (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-white/5 text-gray-400">
                        Paiement en attente
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight">
                      {req.title}
                    </h4>
                    {req.catalogItemTitle && (
                      <p className="text-xs text-[#FB8205] font-semibold mt-0.5">
                        Offre : {req.catalogItemTitle}
                        {(req.lockedPrice ?? req.catalogItemPrice) && (
                          <span className="ml-1 text-emerald-400 font-bold">
                            (Prix verrouillé : {(req.lockedPrice ?? req.catalogItemPrice ?? 0).toLocaleString()}{' '}
                            {req.lockedCurrency || req.catalogItemCurrency || 'FCFA'})
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-gray-300 bg-[#020919]/60 p-3 rounded-xl border border-white/5 line-clamp-2">
                    « {req.message} »
                  </p>

                  {/* Client Info Strip */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <User className="w-3.5 h-3.5 text-[#0BE9EF]" />
                      {req.clientName}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-emerald-400">
                      <Phone className="w-3.5 h-3.5" />
                      {req.clientPhone}
                    </span>
                    {(req.scheduledDate || req.requestedDate) && (
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {req.scheduledDate ? 'RDV fixé le' : 'Souhaité le'} {req.scheduledDate || req.requestedDate}
                        {(req.scheduledTime || req.requestedTime) && ` à ${req.scheduledTime || req.requestedTime}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenMessaging(req)}
                    leftIcon={<MessageSquare className="w-3.5 h-3.5 text-[#0BE9EF]" />}
                    className="text-xs border-white/10 hover:border-[#0BE9EF]/40"
                  >
                    Messagerie
                  </Button>

                  <a
                    href={`https://wa.me/229${req.clientPhone}?text=${encodeURIComponent(
                      `Bonjour ${req.clientName}, nous faisons suite à votre réservation concernant "${req.title}".`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRequest(req)}
                    className="text-xs border-white/10"
                  >
                    Détails & Audit
                  </Button>
                </div>
              </div>

              {/* Stepper overview */}
              <div className="pt-3 border-t border-white/5">
                <ReservationStepper request={req} showDetails={false} />
              </div>

              {/* Action Buttons Toolbar per status */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-white/5">
                {/* 1. If PENDING */}
                {req.status === 'PENDING' && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleDirectConfirm(req)}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Confirmer la réservation
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setScheduleTargetRequest(req)}
                      leftIcon={<Calendar className="w-3.5 h-3.5" />}
                      className="text-xs bg-[#0BE9EF]/20 text-[#0BE9EF] hover:bg-[#0BE9EF]/30"
                    >
                      Planifier un rendez-vous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActionModalConfig({ request: req, actionType: 'REJECT' })}
                      leftIcon={<X className="w-3.5 h-3.5 text-rose-400" />}
                      className="text-xs text-rose-400 hover:bg-rose-500/10 border-rose-500/20"
                    >
                      Refuser
                    </Button>
                  </>
                )}

                {/* 2. If CONFIRMED or ACCEPTED */}
                {['CONFIRMED', 'ACCEPTED'].includes(req.status) && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setScheduleTargetRequest(req)}
                      leftIcon={<Calendar className="w-3.5 h-3.5" />}
                      className="text-xs bg-[#0BE9EF]/20 text-[#0BE9EF] hover:bg-[#0BE9EF]/30"
                    >
                      {req.scheduledDate ? 'Modifier le rendez-vous' : 'Fixer le rendez-vous & Collaborateur'}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setActionModalConfig({ request: req, actionType: 'START' })}
                      leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Démarrer la prestation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActionModalConfig({ request: req, actionType: 'CANCEL' })}
                      leftIcon={<Ban className="w-3.5 h-3.5 text-rose-400" />}
                      className="text-xs text-gray-400 hover:text-rose-400 border-white/10"
                    >
                      Annuler
                    </Button>
                  </>
                )}

                {/* 3. If SCHEDULED */}
                {req.status === 'SCHEDULED' && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setActionModalConfig({ request: req, actionType: 'START' })}
                      leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Démarrer la prestation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setScheduleTargetRequest(req)}
                      leftIcon={<Calendar className="w-3.5 h-3.5" />}
                      className="text-xs text-gray-300 border-white/10 hover:border-white/30"
                    >
                      Replanifier / Réassigner
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActionModalConfig({ request: req, actionType: 'NO_SHOW' })}
                      leftIcon={<AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                      className="text-xs text-amber-400 hover:bg-amber-500/10 border-amber-500/20"
                    >
                      Client absent (No-Show)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActionModalConfig({ request: req, actionType: 'CANCEL' })}
                      leftIcon={<Ban className="w-3.5 h-3.5 text-rose-400" />}
                      className="text-xs text-gray-400 hover:text-rose-400 border-white/10"
                    >
                      Annuler
                    </Button>
                  </>
                )}

                {/* 4. If IN_PROGRESS */}
                {req.status === 'IN_PROGRESS' && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setActionModalConfig({ request: req, actionType: 'COMPLETE' })}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      className="text-xs bg-[#0BE9EF] text-[#020919] hover:bg-[#0BE9EF]/90 font-bold"
                    >
                      Clôturer la prestation (Terminée)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActionModalConfig({ request: req, actionType: 'CANCEL' })}
                      leftIcon={<Ban className="w-3.5 h-3.5 text-rose-400" />}
                      className="text-xs text-gray-400 hover:text-rose-400 border-white/10"
                    >
                      Interrompre / Annuler
                    </Button>
                  </>
                )}

                {/* 5. If COMPLETED */}
                {req.status === 'COMPLETED' && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Prestation clôturée avec succès
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Detailed View with Full Stepper and Logs */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`Réservation : ${selectedRequest.title}`}
          size="lg"
        >
          <div className="space-y-4 text-left">
            <ReservationStepper request={selectedRequest} showDetails={true} />

            {/* Client Coordinates */}
            <div className="bg-[#020919] border border-white/10 rounded-xl p-4 space-y-2">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Coordonnées du Client
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block">Nom complet</span>
                  <span className="font-semibold text-white text-sm">{selectedRequest.clientName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Téléphone</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedRequest.clientPhone}</span>
                </div>
                {selectedRequest.clientEmail && (
                  <div>
                    <span className="text-gray-500 block">Email</span>
                    <span className="text-gray-300">{selectedRequest.clientEmail}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 block">Localisation</span>
                  <span className="text-gray-300">{selectedRequest.location || 'Cotonou'}</span>
                </div>
              </div>
            </div>

            {/* Request Message */}
            <div className="bg-[#020919] border border-white/10 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Message & Demande du Client
              </h5>
              <p className="text-xs text-gray-200 leading-relaxed">
                {selectedRequest.message}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedRequest(null)}
              >
                Fermer
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  const req = selectedRequest;
                  setSelectedRequest(null);
                  handleOpenMessaging(req);
                }}
                leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
              >
                Ouvrir la messagerie
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Schedule Appointment & Staff Assignment */}
      <ScheduleAppointmentModal
        isOpen={!!scheduleTargetRequest}
        onClose={() => setScheduleTargetRequest(null)}
        request={scheduleTargetRequest}
        businessId={businessId}
        onSuccess={(updated) => {
          fetchRequests();
          if (selectedRequest && selectedRequest.id === updated.id) {
            setSelectedRequest(updated);
          }
        }}
        onShowToast={onShowToast}
      />

      {/* MODAL: Request Action (Start, Complete, Cancel, Reject, No-Show) */}
      <RequestActionModal
        isOpen={!!actionModalConfig.actionType}
        onClose={() => setActionModalConfig({ request: null, actionType: null })}
        request={actionModalConfig.request}
        actionType={actionModalConfig.actionType}
        businessId={businessId}
        callerRole="BUSINESS_OWNER"
        onSuccess={(updated) => {
          fetchRequests();
          if (selectedRequest && selectedRequest.id === updated.id) {
            setSelectedRequest(updated);
          }
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};
