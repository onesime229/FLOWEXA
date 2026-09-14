import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  Building,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  MarketplaceRequestEntity,
  MarketplaceResponseEntity,
  MarketplaceMatchResult,
} from '../../types';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Modal } from '../design-system/Modal';

export interface MarketplaceProposalComparatorProps {
  request: MarketplaceRequestEntity;
  responses: MarketplaceResponseEntity[];
  matches: MarketplaceMatchResult[];
  onAcceptResponse: (response: MarketplaceResponseEntity) => Promise<void>;
  onOpenChatWithBusiness: (businessId: string, businessName: string) => void;
  onRefresh: () => void;
  onClose: () => void;
}

export const MarketplaceProposalComparator: React.FC<MarketplaceProposalComparatorProps> = ({
  request,
  responses,
  matches,
  onAcceptResponse,
  onOpenChatWithBusiness,
  onRefresh,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'PROPOSALS' | 'MATCHES'>('PROPOSALS');
  const [selectedResponseToConfirm, setSelectedResponseToConfirm] = useState<MarketplaceResponseEntity | null>(null);
  const [isProcessingAccept, setIsProcessingAccept] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="info">Publiée</Badge>;
      case 'MATCHING':
        return <Badge variant="warning">Matching en cours</Badge>;
      case 'RESPONSES_RECEIVED':
        return <Badge variant="success">Propositions reçues</Badge>;
      case 'CONVERTED':
      case 'ACCEPTED':
        return <Badge variant="success">Acceptée / Réservation créée</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Annulée</Badge>;
      case 'EXPIRED':
        return <Badge variant="danger">Expirée</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const handleConfirmAccept = async () => {
    if (!selectedResponseToConfirm) return;
    setIsProcessingAccept(true);
    try {
      await onAcceptResponse(selectedResponseToConfirm);
      setSelectedResponseToConfirm(null);
    } finally {
      setIsProcessingAccept(false);
    }
  };

  return (
    <div className="space-y-6 text-white text-left">
      {/* Header with Request Details & Stepper */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FB8205] bg-[#FB8205]/10 px-2.5 py-0.5 rounded-lg border border-[#FB8205]/20">
                {request.category}
              </span>
              {getStatusBadge(request.status)}
            </div>
            <h2 className="text-xl font-black text-white">{request.title}</h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl">{request.description}</p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="text-right">
              <span className="text-[11px] text-gray-400 block">Budget estimé</span>
              <span className="text-sm font-bold text-emerald-400">
                {request.budgetMax
                  ? `${typeof request.budgetMin === 'number' ? request.budgetMin.toLocaleString('fr-FR') + ' - ' : 'Jusqu’à '}${(request.budgetMax ?? 0).toLocaleString('fr-FR')} FCFA`
                  : 'Sur mesure'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span>{request.location}</span>
            </div>
          </div>
        </div>

        {/* Lifecycle Stepper (Sprint B21: Suivi de la demande) */}
        <div className="pt-4 border-t border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                ['PUBLISHED', 'MATCHING', 'RESPONSES_RECEIVED', 'ACCEPTED', 'CONVERTED'].includes(request.status)
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <div>
                <span className="font-bold block">1. Publication</span>
                <span className="text-[10px] text-gray-400">Demande diffusée</span>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                ['MATCHING', 'RESPONSES_RECEIVED', 'ACCEPTED', 'CONVERTED'].includes(request.status)
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <div>
                <span className="font-bold block">2. Matching</span>
                <span className="text-[10px] text-gray-400">{matches.length} pros notifiés</span>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                responses.length > 0 || ['ACCEPTED', 'CONVERTED'].includes(request.status)
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <div>
                <span className="font-bold block">3. Propositions</span>
                <span className="text-[10px] text-gray-400">{responses.length} reçue(s)</span>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                ['ACCEPTED', 'CONVERTED'].includes(request.status)
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              <Check className="w-4 h-4 flex-shrink-0" />
              <div>
                <span className="font-bold block">4. Réservation</span>
                <span className="text-[10px] text-gray-400">Contrat validé</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Propositions reçues vs Entreprises matchées */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('PROPOSALS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'PROPOSALS'
              ? 'bg-[#FB8205] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Propositions reçues ({responses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MATCHES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'MATCHES'
              ? 'bg-[#FB8205] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Entreprises correspondantes détectées ({matches.length})</span>
        </button>
      </div>

      {/* Tab 1: Proposals Comparator */}
      {activeTab === 'PROPOSALS' && (
        <div className="space-y-4">
          {responses.length === 0 ? (
            <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-10 text-center">
              <Sparkles className="w-12 h-12 text-gray-500 mx-auto mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-white mb-1">En attente de propositions</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
                Les entreprises qualifiées dans un rayon de {request.radiusKm || 10} km ont été alertées. Vous recevrez leurs propositions tarifaires et de disponibilité ici dès qu'elles y répondent.
              </p>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Actualiser les réponses
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {responses.map((resp) => {
                const isAccepted = ['ACCEPTED', 'CONVERTED'].includes(resp.status);
                const isRejected = resp.status === 'REJECTED';
                const canAccept = ['PUBLISHED', 'MATCHING', 'RESPONSES_RECEIVED'].includes(request.status) && resp.status === 'PENDING';

                // Price difference vs budgetMax
                const budgetDiff = request.budgetMax ? resp.proposedPrice - request.budgetMax : 0;

                return (
                  <div
                    key={resp.id}
                    className={`bg-[#0A1428] border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all ${
                      isAccepted
                        ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50'
                        : isRejected
                        ? 'border-white/5 opacity-60 bg-black/20'
                        : 'border-white/10 hover:border-[#FB8205]/50'
                    }`}
                  >
                    <div>
                      {/* Top Pro info */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-white text-base">{resp.businessName}</h4>
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span className="flex items-center gap-1 text-amber-400 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              {resp.rating ? resp.rating.toFixed(1) : '5.0'}
                            </span>
                            <span>({resp.reviewCount || 0} avis vérifiés)</span>
                            {typeof resp.distanceKm === 'number' && (
                              <span className="flex items-center gap-1 text-gray-300">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                à {resp.distanceKm.toFixed(1)} km
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status badge */}
                        <div>
                          {isAccepted ? (
                            <Badge variant="success">Retenue 🎉</Badge>
                          ) : isRejected ? (
                            <Badge variant="danger">Non retenue</Badge>
                          ) : (
                            <Badge variant="warning">En attente</Badge>
                          )}
                        </div>
                      </div>

                      {/* Offer detail */}
                      <div className="bg-[#111C38] border border-white/5 rounded-xl p-3 mb-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs text-gray-400">Tarif proposé :</span>
                          <span className="text-base font-black text-emerald-400">
                            {(resp.proposedPrice ?? 0).toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>

                        {request.budgetMax && (
                          <div className="flex items-center justify-between text-[11px] mb-2">
                            <span className="text-gray-400">Écart vs budget max :</span>
                            <span
                              className={`font-semibold ${
                                budgetDiff <= 0 ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {budgetDiff <= 0
                                ? `Économie de ${Math.abs(budgetDiff ?? 0).toLocaleString('fr-FR')} FCFA`
                                : `+${(budgetDiff ?? 0).toLocaleString('fr-FR')} FCFA`}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-[#FB8205]" />
                          <span>Disponible le : <strong>{resp.availableDate}</strong></span>
                        </div>
                      </div>

                      {/* Attached Catalog Item if any */}
                      {resp.catalogItemTitle && (
                        <div className="mb-3 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                          <span className="text-[10px] text-gray-400 block uppercase font-bold">
                            Prestation du catalogue rattachée :
                          </span>
                          <span className="font-semibold text-white">{resp.catalogItemTitle}</span>
                        </div>
                      )}

                      {/* Pro Message */}
                      <div className="text-xs text-gray-300 bg-[#060D1E] p-3 rounded-xl border border-white/5 mb-4">
                        <span className="text-[10px] text-[#FB8205] block font-bold mb-1">
                          Message de l’établissement :
                        </span>
                        <p className="italic">"{resp.message}"</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenChatWithBusiness(resp.businessId, resp.businessName)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Poser une question</span>
                      </button>

                      {canAccept && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedResponseToConfirm(resp)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accepter cette offre</span>
                        </Button>
                      )}

                      {isAccepted && (
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Réservation créée</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Matched Businesses (Algorithme de mise en relation transparent) */}
      {activeTab === 'MATCHES' && (
        <div className="space-y-4">
          <div className="bg-[#111C38] border border-white/10 rounded-2xl p-4 text-xs text-gray-300 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#FB8205] flex-shrink-0" />
            <p>
              Voici les entreprises locales recommandées par le moteur de matching intelligent Flowexa selon votre catégorie, votre budget et votre géolocalisation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match) => (
              <div
                key={match.businessId}
                className="bg-[#0A1428] border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-white text-base">{match.businessName}</h4>
                      <span className="text-xs text-gray-400">{match.city} • {match.district}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#FB8205] bg-[#FB8205]/10 px-2 py-0.5 rounded-lg border border-[#FB8205]/20">
                        {match.matchingScore}% Affinité
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {match.rating.toFixed(1)}
                    </span>
                    <span>({match.reviewCount} avis)</span>
                    {typeof match.distanceKm === 'number' && (
                      <span className="flex items-center gap-1 text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        à {match.distanceKm.toFixed(1)} km
                      </span>
                    )}
                  </div>

                  {/* Matching reasons */}
                  <div className="space-y-1 mb-3">
                    {match.matchReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                        <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {match.matchingScore >= 70 ? 'Forte compatibilité' : 'Profil compatible'}
                  </span>
                  <button
                    onClick={() => onOpenChatWithBusiness(match.businessId, match.businessName)}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-[#FB8205]/20 hover:bg-[#FB8205]/30 text-[#FB8205] flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Contacter en direct</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Confirmation Conversion Demande -> Réservation */}
      {selectedResponseToConfirm && (
        <Modal
          isOpen={!!selectedResponseToConfirm}
          onClose={() => setSelectedResponseToConfirm(null)}
          title="Confirmer et valider cette proposition"
        >
          <div className="space-y-4 text-left text-white">
            <div className="bg-[#111C38] border border-white/10 rounded-2xl p-4">
              <h4 className="font-bold text-base text-white mb-1">
                {selectedResponseToConfirm.businessName}
              </h4>
              <p className="text-xs text-gray-300 mb-2">
                Offre : {selectedResponseToConfirm.catalogItemTitle || request.title}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-xs text-gray-400">Montant convenu :</span>
                <span className="text-base font-black text-emerald-400">
                  {(selectedResponseToConfirm.proposedPrice ?? 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">Date convenue :</span>
                <span className="text-xs font-bold text-white">
                  {selectedResponseToConfirm.availableDate}
                </span>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-200">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">Ce qui va se passer :</span>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li>La demande Marketplace sera convertie en réservation contractuelle ferme.</li>
                    <li>Un canal de messagerie direct sera créé avec {selectedResponseToConfirm.businessName}.</li>
                    <li>Les autres propositions reçues seront automatiquement clôturées avec remerciements.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedResponseToConfirm(null)}
                disabled={isProcessingAccept}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAccept}
                disabled={isProcessingAccept}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2"
              >
                {isProcessingAccept ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Confirmer la sélection</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
