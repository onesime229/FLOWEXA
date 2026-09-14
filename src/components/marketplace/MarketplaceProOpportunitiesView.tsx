import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  Building,
  RefreshCw,
  Search,
  Filter,
  Check,
  TrendingUp,
  XCircle,
  FileText,
} from 'lucide-react';
import {
  MarketplaceRequestEntity,
  MarketplaceResponseEntity,
  BusinessModuleCode,
} from '../../types';
import { api } from '../../services/api';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { MarketplaceSubmitProposalModal } from './MarketplaceSubmitProposalModal';

export interface MarketplaceProOpportunitiesViewProps {
  businessId: string;
  businessName: string;
  moduleCode: BusinessModuleCode;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigateToReservations?: () => void;
  onNavigateToMessages?: () => void;
}

export const MarketplaceProOpportunitiesView: React.FC<MarketplaceProOpportunitiesViewProps> = ({
  businessId,
  businessName,
  moduleCode,
  onShowToast,
  onNavigateToReservations,
  onNavigateToMessages,
}) => {
  const [activeTab, setActiveTab] = useState<'OPPORTUNITIES' | 'MY_PROPOSALS'>('OPPORTUNITIES');
  const [opportunities, setOpportunities] = useState<MarketplaceRequestEntity[]>([]);
  const [myResponses, setMyResponses] = useState<MarketplaceResponseEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Proposal modal state
  const [targetRequestForProposal, setTargetRequestForProposal] = useState<MarketplaceRequestEntity | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRequests, resResponses] = await Promise.all([
        api.getMarketplaceRequests({
          role: 'BUSINESS_OWNER',
          businessId,
        }),
        api.getMarketplaceResponses({
          role: 'BUSINESS_OWNER',
          businessId,
        }),
      ]);

      if (resRequests.success && Array.isArray(resRequests.data)) {
        setOpportunities(resRequests.data);
      }
      if (resResponses.success && Array.isArray(resResponses.data)) {
        setMyResponses(resResponses.data);
      }
    } catch (err) {
      console.error(err);
      onShowToast('Erreur', 'Impossible de charger les opportunités Marketplace.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [businessId]);

  // Create lookup for my responses: requestId -> response
  const responseByRequestId = new Map<string, MarketplaceResponseEntity>();
  myResponses.forEach((r) => {
    responseByRequestId.set(r.marketplaceRequestId, r);
  });

  const wonProposalsCount = myResponses.filter((r) => ['ACCEPTED', 'CONVERTED'].includes(r.status)).length;
  const pendingProposalsCount = myResponses.filter((r) => r.status === 'PENDING').length;
  const winRate = myResponses.length > 0 ? Math.round((wonProposalsCount / myResponses.length) * 100) : 0;

  const filteredOpportunities = opportunities.filter((op) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      op.title.toLowerCase().includes(term) ||
      op.description.toLowerCase().includes(term) ||
      op.location.toLowerCase().includes(term) ||
      op.category.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 text-white text-left">
      {/* Header Pro Banner */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FB8205] bg-[#FB8205]/10 px-2.5 py-0.5 rounded-lg border border-[#FB8205]/20 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Opportunités d'affaires Marketplace
              </span>
              <span className="text-xs text-gray-400">Pour : {businessName}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">
              Demandes clients en attente de propositions qualifiées
            </h1>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl">
              Les clients expliquent leur besoin dans votre zone géographique. Positionnez vos prestations de catalogue ou transmettez un devis compétitif pour remporter la réservation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="border-white/10 hover:bg-white/5 text-gray-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Pro Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 mt-4 border-t border-white/5">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-gray-400 block">Opportunités détectées</span>
            <span className="text-lg font-black text-white">{opportunities.length}</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-gray-400 block">Propositions en attente</span>
            <span className="text-lg font-black text-amber-400">{pendingProposalsCount}</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-gray-400 block">Propositions gagnées</span>
            <span className="text-lg font-black text-emerald-400">{wonProposalsCount}</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-gray-400 block">Taux de concrétisation</span>
            <span className="text-lg font-black text-[#FB8205]">{winRate}%</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Opportunités ouvertes vs Mes propositions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0A1428] border border-white/10 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('OPPORTUNITIES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'OPPORTUNITIES'
                ? 'bg-[#FB8205] text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Opportunités ouvertes ({opportunities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MY_PROPOSALS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'MY_PROPOSALS'
                ? 'bg-[#FB8205] text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Mes propositions envoyées ({myResponses.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filtrer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tab 1: Open Opportunities */}
      {activeTab === 'OPPORTUNITIES' && (
        <div>
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#FB8205]" />
              <span className="text-xs">Recherche des opportunités correspondant à votre activité...</span>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-12 text-center">
              <Sparkles className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Aucune nouvelle demande pour le moment</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Dès qu'un client formule une demande dans votre catégorie ({moduleCode}) à proximité, vous serez alerté instantanément ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOpportunities.map((op) => {
                const existingResponse = responseByRequestId.get(op.id);
                const hasResponded = !!existingResponse;

                return (
                  <div
                    key={op.id}
                    className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-white/20 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FB8205] bg-[#FB8205]/10 px-2 py-0.5 rounded-lg border border-[#FB8205]/20 inline-block mb-1">
                            {op.category}
                          </span>
                          <h3 className="text-base font-bold text-white leading-tight">{op.title}</h3>
                        </div>

                        {hasResponded ? (
                          existingResponse?.status === 'CONVERTED' || existingResponse?.status === 'ACCEPTED' ? (
                            <Badge variant="success">Proposition gagnée 🎉</Badge>
                          ) : (
                            <Badge variant="info">Réponse envoyée</Badge>
                          )
                        ) : (
                          <Badge variant="warning">Nouvelle</Badge>
                        )}
                      </div>

                      <p className="text-xs text-gray-300 line-clamp-3 mb-3">{op.description}</p>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 bg-[#111C38] p-2.5 rounded-xl border border-white/5 mb-3">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{op.location}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>
                            {typeof op.budgetMax === 'number'
                              ? `Budget client: ${(op.budgetMax ?? 0).toLocaleString('fr-FR')} F`
                              : 'Budget libre'}
                          </span>
                        </div>

                        {op.desiredDate && (
                          <div className="flex items-center gap-1.5 col-span-2 text-gray-300">
                            <Calendar className="w-3.5 h-3.5 text-[#FB8205]" />
                            <span>Date souhaitée : {op.desiredDate}</span>
                          </div>
                        )}
                      </div>

                      {/* If already responded: summary of proposal */}
                      {hasResponded && existingResponse && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold">Votre offre soumise :</span>
                            <span className="font-black text-white">
                              {(existingResponse.proposedPrice ?? 0).toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-300 italic truncate">
                            "{existingResponse.message}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-400">
                        {op.responsesCount || 0} offre(s) concurrente(s)
                      </span>

                      {!hasResponded ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setTargetRequestForProposal(op)}
                          className="bg-[#FB8205] hover:bg-[#e07304] text-white font-bold flex items-center gap-1.5 text-xs shadow-md"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Faire une proposition</span>
                        </Button>
                      ) : existingResponse?.status === 'CONVERTED' || existingResponse?.status === 'ACCEPTED' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            if (onNavigateToReservations) onNavigateToReservations();
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Voir la réservation créée</span>
                        </Button>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>En attente de décision</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Proposals Sent */}
      {activeTab === 'MY_PROPOSALS' && (
        <div className="space-y-4">
          {myResponses.length === 0 ? (
            <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-12 text-center">
              <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Aucune proposition transmise</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
                Consultez l'onglet "Opportunités ouvertes" et soumettez vos premières offres chiffrées.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('OPPORTUNITIES')}
                className="border-white/10 text-white"
              >
                Parcourir les opportunités
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myResponses.map((resp) => {
                const isWon = ['ACCEPTED', 'CONVERTED'].includes(resp.status);
                const isRejected = resp.status === 'REJECTED';
                const isPending = resp.status === 'PENDING';

                return (
                  <div
                    key={resp.id}
                    className={`bg-[#0A1428] border rounded-2xl p-5 shadow-lg flex flex-col justify-between ${
                      isWon
                        ? 'border-emerald-500 bg-emerald-950/20'
                        : isRejected
                        ? 'border-white/5 opacity-70'
                        : 'border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-[10px] text-gray-400 block mb-0.5">
                            Transmise le {new Date(resp.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                          <h4 className="font-bold text-base text-white">
                            {resp.catalogItemTitle || 'Proposition sur-mesure'}
                          </h4>
                        </div>
                        <div>
                          {isWon ? (
                            <Badge variant="success">Gagnée 🎉</Badge>
                          ) : isRejected ? (
                            <Badge variant="danger">Non retenue</Badge>
                          ) : (
                            <Badge variant="warning">En attente client</Badge>
                          )}
                        </div>
                      </div>

                      <div className="bg-[#111C38] border border-white/5 rounded-xl p-3 mb-3 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-400">Montant proposé :</span>
                          <span className="text-base font-black text-emerald-400">
                            {(resp.proposedPrice ?? 0).toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-gray-300">
                          <span>Disponibilité :</span>
                          <span className="font-bold text-white">{resp.availableDate}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-300 bg-[#060D1E] p-2.5 rounded-xl border border-white/5 mb-3">
                        <span className="text-[10px] text-gray-400 block mb-1">Votre message au client :</span>
                        <p className="italic">"{resp.message}"</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      {isWon ? (
                        <button
                          onClick={() => {
                            if (onNavigateToReservations) onNavigateToReservations();
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ouvrir la réservation</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {isRejected ? 'Le client a choisi un autre prestataire' : 'Proposition active'}
                        </span>
                      )}

                      {onNavigateToMessages && (
                        <button
                          onClick={onNavigateToMessages}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>Messagerie</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Submit Proposal */}
      {targetRequestForProposal && (
        <MarketplaceSubmitProposalModal
          isOpen={!!targetRequestForProposal}
          onClose={() => setTargetRequestForProposal(null)}
          request={targetRequestForProposal}
          businessId={businessId}
          businessName={businessName}
          onSuccess={(res, msg) => {
            onShowToast('Succès', msg, 'success');
            fetchData();
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
