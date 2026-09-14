import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageCircle,
  XCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  MarketplaceRequestEntity,
  MarketplaceResponseEntity,
  MarketplaceMatchResult,
} from '../../types';
import { api } from '../../services/api';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Modal } from '../design-system/Modal';
import { MarketplaceNewRequestModal } from './MarketplaceNewRequestModal';
import { MarketplaceProposalComparator } from './MarketplaceProposalComparator';

export interface MarketplaceClientViewProps {
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigateToMessages?: () => void;
  onNavigateToBookings?: () => void;
  onOpenDirectChat?: (businessId: string, businessName: string) => void;
}

export const MarketplaceClientView: React.FC<MarketplaceClientViewProps> = ({
  onShowToast,
  onNavigateToMessages,
  onNavigateToBookings,
  onOpenDirectChat,
}) => {
  const [requests, setRequests] = useState<MarketplaceRequestEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedRequestForComparison, setSelectedRequestForComparison] = useState<MarketplaceRequestEntity | null>(null);
  const [activeResponses, setActiveResponses] = useState<MarketplaceResponseEntity[]>([]);
  const [activeMatches, setActiveMatches] = useState<MarketplaceMatchResult[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Cancellation Modal
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getMarketplaceRequests({
        role: 'CLIENT',
        clientId: 'client-test-1',
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      if (res.success && Array.isArray(res.data)) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error(err);
      onShowToast('Erreur', 'Impossible de charger vos demandes Marketplace.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleOpenComparison = async (req: MarketplaceRequestEntity) => {
    setSelectedRequestForComparison(req);
    setLoadingDetails(true);
    try {
      const [resResp, resMatches] = await Promise.all([
        api.getMarketplaceResponses({ requestId: req.id, clientId: 'client-test-1' }),
        api.getMarketplaceMatches(req.id),
      ]);
      if (resResp.success && Array.isArray(resResp.data)) {
        setActiveResponses(resResp.data);
      }
      if (resMatches.success && Array.isArray(resMatches.data)) {
        setActiveMatches(resMatches.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePublishDraft = async (reqId: string) => {
    try {
      const res = await api.publishMarketplaceRequest(reqId, 'client-test-1');
      if (res.success) {
        onShowToast('Succès', 'Demande publiée ! Le matching a été lancé.', 'success');
        fetchRequests();
      } else {
        onShowToast('Erreur', res.message || 'Impossible de publier la demande.', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Erreur', 'Erreur réseau.', 'error');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    setIsCancelling(true);
    try {
      const res = await api.cancelMarketplaceRequest(cancelTargetId, cancelReason, 'client-test-1');
      if (res.success) {
        onShowToast('Demande annulée', 'Votre demande a été annulée.', 'info');
        setCancelTargetId(null);
        setCancelReason('');
        fetchRequests();
      } else {
        onShowToast('Erreur', res.message || 'Impossible d’annuler la demande.', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Erreur', 'Erreur réseau.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleAcceptProposal = async (proposal: MarketplaceResponseEntity) => {
    if (!selectedRequestForComparison) return;
    try {
      const res = await api.acceptMarketplaceResponse({
        requestId: selectedRequestForComparison.id,
        responseId: proposal.id,
        clientId: 'client-test-1',
      });
      if (res.success) {
        onShowToast(
          'Réservation créée ! 🎉',
          `Proposition de ${proposal.businessName} acceptée. Réservation #${res.data?.convertedBooking?.id || ''} confirmée.`,
          'success'
        );
        setSelectedRequestForComparison(null);
        fetchRequests();
      } else {
        onShowToast('Erreur', res.message || 'Impossible de valider la proposition.', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Erreur', 'Erreur lors de la validation.', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="neutral">Brouillon</Badge>;
      case 'PUBLISHED':
        return <Badge variant="info">Diffusée</Badge>;
      case 'MATCHING':
        return <Badge variant="warning">Matching en cours</Badge>;
      case 'RESPONSES_RECEIVED':
        return <Badge variant="success">Propositions reçues</Badge>;
      case 'ACCEPTED':
      case 'CONVERTED':
        return <Badge variant="success">Convertie en réservation</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Annulée</Badge>;
      case 'EXPIRED':
        return <Badge variant="danger">Expirée</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Filter by search term
  const filteredRequests = requests.filter((r) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      r.title.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term) ||
      r.category.toLowerCase().includes(term) ||
      r.location.toLowerCase().includes(term)
    );
  });

  // Quick stats
  const activeCount = requests.filter((r) => ['PUBLISHED', 'MATCHING', 'RESPONSES_RECEIVED'].includes(r.status)).length;
  const totalResponses = requests.reduce((acc, r) => acc + (r.responsesCount || 0), 0);
  const convertedCount = requests.filter((r) => ['ACCEPTED', 'CONVERTED'].includes(r.status)).length;

  return (
    <div className="space-y-6 text-white text-left">
      {/* Header Banner */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FB8205] bg-[#FB8205]/10 px-2.5 py-0.5 rounded-lg border border-[#FB8205]/20 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Mise en relation intelligente
              </span>
              <span className="text-xs text-gray-400">Flowexa Marketplace</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">
              Expliquez votre besoin, Flowexa trouve les pros qualifiés
            </h1>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl">
              Publiez vos recherches (logement, coiffure, photo, transport, réparations, etc.). Recevez des propositions chiffrées sur-mesure et choisissez la meilleure offre.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRequests}
              className="border-white/10 hover:bg-white/5 text-gray-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewModalOpen(true)}
              className="bg-[#FB8205] hover:bg-[#e07304] text-white font-bold flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Publier une demande</span>
            </Button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-3 gap-3 pt-5 mt-4 border-t border-white/5">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-gray-400 block">Demandes en cours</span>
            <span className="text-lg font-black text-white">{activeCount}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-gray-400 block">Propositions reçues</span>
            <span className="text-lg font-black text-emerald-400">{totalResponses}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-gray-400 block">Réservations conclues</span>
            <span className="text-lg font-black text-[#FB8205]">{convertedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0A1428] border border-white/10 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filtrer mes demandes (titre, lieu, catégorie)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {[
            { id: 'ALL', label: 'Toutes' },
            { id: 'RESPONSES_RECEIVED', label: 'Propositions reçues' },
            { id: 'PUBLISHED', label: 'Diffusées' },
            { id: 'CONVERTED', label: 'Réservées' },
            { id: 'DRAFT', label: 'Brouillons' },
            { id: 'EXPIRED', label: 'Expirées' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#FB8205]" />
          <span className="text-xs">Chargement de vos demandes...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Aucune demande trouvée</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
            Vous n’avez aucune demande dans cette catégorie. Cliquez sur "Publier une demande" pour démarrer.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="bg-[#FB8205] text-white font-bold"
          >
            Créer ma première demande
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const hasResponses = (req.responsesCount || 0) > 0;
            const isDraft = req.status === 'DRAFT';
            const isCancelled = req.status === 'CANCELLED';
            const isConverted = ['ACCEPTED', 'CONVERTED'].includes(req.status);
            const canCancel = ['PUBLISHED', 'MATCHING', 'RESPONSES_RECEIVED'].includes(req.status);

            return (
              <div
                key={req.id}
                className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-white/20 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FB8205] bg-[#FB8205]/10 px-2 py-0.5 rounded-lg border border-[#FB8205]/20 inline-block mb-1.5">
                        {req.category}
                      </span>
                      <h3 className="text-base font-bold text-white leading-tight">{req.title}</h3>
                    </div>
                    <div>{getStatusBadge(req.status)}</div>
                  </div>

                  <p className="text-xs text-gray-300 line-clamp-2 mb-3">{req.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 bg-[#111C38] p-2.5 rounded-xl border border-white/5 mb-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{req.location}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>
                        {typeof req.budgetMax === 'number' ? `Max: ${(req.budgetMax ?? 0).toLocaleString('fr-FR')} F` : 'Sur mesure'}
                      </span>
                    </div>

                    {req.desiredDate && (
                      <div className="flex items-center gap-1.5 col-span-2 text-gray-300">
                        <Calendar className="w-3.5 h-3.5 text-[#FB8205]" />
                        <span>Date souhaitée : {req.desiredDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {hasResponses ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{req.responsesCount} proposition(s)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span>En attente de réponses</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isDraft && (
                      <button
                        onClick={() => handlePublishDraft(req.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FB8205] text-white hover:bg-[#e07304] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Publier</span>
                      </button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenComparison(req)}
                      className="border-white/10 hover:bg-white/10 text-white flex items-center gap-1 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{hasResponses ? 'Comparer les offres' : 'Détails & Matching'}</span>
                    </Button>

                    {canCancel && (
                      <button
                        onClick={() => {
                          setCancelTargetId(req.id);
                          setCancelReason('');
                        }}
                        title="Annuler la recherche"
                        className="p-1.5 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Marketplace Request */}
      {isNewModalOpen && (
        <MarketplaceNewRequestModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={(newReq, msg) => {
            onShowToast('Succès', msg, 'success');
            fetchRequests();
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* Modal: Compare Proposals & Matched Pros */}
      {selectedRequestForComparison && (
        <Modal
          isOpen={!!selectedRequestForComparison}
          onClose={() => setSelectedRequestForComparison(null)}
          title="Gestion & Comparatif de la demande"
        >
          {loadingDetails ? (
            <div className="p-10 text-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#FB8205]" />
              <span className="text-xs">Chargement des propositions et du matching...</span>
            </div>
          ) : (
            <MarketplaceProposalComparator
              request={selectedRequestForComparison}
              responses={activeResponses}
              matches={activeMatches}
              onAcceptResponse={handleAcceptProposal}
              onOpenChatWithBusiness={(bId, bName) => {
                if (onOpenDirectChat) {
                  onOpenDirectChat(bId, bName);
                } else if (onNavigateToMessages) {
                  onNavigateToMessages();
                }
              }}
              onRefresh={() => handleOpenComparison(selectedRequestForComparison)}
              onClose={() => setSelectedRequestForComparison(null)}
            />
          )}
        </Modal>
      )}

      {/* Modal: Cancel Confirmation */}
      {cancelTargetId && (
        <Modal
          isOpen={!!cancelTargetId}
          onClose={() => setCancelTargetId(null)}
          title="Annuler cette demande Marketplace"
        >
          <div className="space-y-4 text-left text-white">
            <p className="text-xs text-gray-300">
              Êtes-vous sûr de vouloir annuler cette recherche ? Les propositions reçues seront clôturées et les entreprises seront informées.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Motif de l’annulation (optionnel) :
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: J'ai déjà trouvé une solution par ailleurs..."
                className="w-full bg-[#0A1428] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelTargetId(null)}
                disabled={isCancelling}
              >
                Retour
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2"
              >
                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                <span>Confirmer l’annulation</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
