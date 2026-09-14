import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  Megaphone,
  Plus,
  Send,
  X,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Percent,
  Coins,
  ArrowUpRight,
  Filter,
  Trash2,
  Ban,
  ShieldCheck,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { flowexaApi } from '../../services/api';
import type {
  GrowthMetrics,
  GrowthOpportunity,
  FlowexaCampaignEntity,
  ClientSegmentDefinition,
  ClientSegmentCode,
  CampaignObjective,
  CampaignChannel,
} from '../../types';

interface BusinessGrowthCampaignsViewProps {
  businessId: string;
  businessName: string;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigateToClients?: () => void;
}

export const BusinessGrowthCampaignsView: React.FC<BusinessGrowthCampaignsViewProps> = ({
  businessId,
  businessName,
  onShowToast,
  onNavigateToClients,
}) => {
  const [metrics, setMetrics] = useState<GrowthMetrics | null>(null);
  const [opportunities, setOpportunities] = useState<GrowthOpportunity[]>([]);
  const [campaigns, setCampaigns] = useState<FlowexaCampaignEntity[]>([]);
  const [segments, setSegments] = useState<ClientSegmentDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Création Campagne
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [objective, setObjective] = useState<CampaignObjective>('FIDÉLISATION');
  const [targetSegment, setTargetSegment] = useState<ClientSegmentCode>('RECURRENT');
  const [channel, setChannel] = useState<CampaignChannel>('INTERNAL');
  const [message, setMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number | undefined>();
  const [cost, setCost] = useState<number>(0);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Filtre statut campagnes
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [growthRes, campaignsRes] = await Promise.all([
        flowexaApi.getGrowthDashboard(businessId),
        flowexaApi.getCampaigns(businessId),
      ]);

      if (growthRes.success && growthRes.data) {
        setMetrics(growthRes.data.metrics);
        setOpportunities(growthRes.data.opportunities || []);
        setSegments(growthRes.data.segments || []);
      }

      if (campaignsRes.success && Array.isArray(campaignsRes.data)) {
        setCampaigns(campaignsRes.data);
      }
    } catch (e) {
      console.error(e);
      onShowToast('Erreur', 'Impossible de charger les données de croissance.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [businessId]);

  const handleGenerateAIDraft = async () => {
    setGeneratingAI(true);
    try {
      const res = await flowexaApi.generateCampaignAIDraft(businessId, {
        objective,
        segment: targetSegment,
      });
      if (res.success && res.data) {
        setName(res.data.name);
        setMessage(res.data.message);
        onShowToast('IA Flowexa', 'Brouillon de campagne généré à partir de votre profil.', 'info');
      }
    } catch (e) {
      console.error(e);
      onShowToast('Erreur', 'Échec de génération du brouillon IA.', 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleApplyOpportunity = (opp: GrowthOpportunity) => {
    if (opp.draftCampaign) {
      setName(opp.draftCampaign.name);
      setMessage(opp.draftCampaign.message);
      setObjective(opp.draftCampaign.objective);
      setTargetSegment(opp.targetSegment);
      setShowCreateModal(true);
      onShowToast('Opportunité sélectionnée', `Paramètres préremplis pour "${opp.title}".`, 'info');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      onShowToast('Champs requis', 'Veuillez renseigner le nom et le message de la campagne.', 'warning');
      return;
    }

    setCreating(true);
    try {
      const res = await flowexaApi.createCampaign(businessId, {
        name: name.trim(),
        objective,
        targetSegment,
        channel,
        message: message.trim(),
        promoCode: promoCode.trim() || undefined,
        discountPercent: discountPercent ? Number(discountPercent) : undefined,
        cost: Number(cost) || 0,
      });

      if (res.success) {
        onShowToast('Succès', 'Campagne enregistrée avec succès.', 'success');
        setShowCreateModal(false);
        resetForm();
        fetchData();
      } else {
        onShowToast('Erreur', res.message || 'Impossible d’enregistrer la campagne.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast('Erreur', err.message || 'Erreur réseau.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSendCampaign = async (campaignId: string, campaignName: string) => {
    if (!window.confirm(`Confirmez-vous l'envoi immédiat de la campagne "${campaignName}" ?`)) {
      return;
    }

    try {
      const res = await flowexaApi.sendCampaign(businessId, campaignId);
      if (res.success) {
        onShowToast('Campagne diffusée', res.message || 'La campagne a été transmise aux destinataires éligibles.', 'success');
        fetchData();
      } else {
        onShowToast('Erreur', res.message || 'Échec de l’envoi.', 'error');
      }
    } catch (e: any) {
      console.error(e);
      onShowToast('Erreur', e.message || 'Erreur réseau.', 'error');
    }
  };

  const handleCancelCampaign = async (campaignId: string) => {
    try {
      const res = await flowexaApi.cancelCampaign(businessId, campaignId);
      if (res.success) {
        onShowToast('Annulée', 'La campagne a été annulée.', 'info');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      onShowToast('Erreur', 'Impossible d’annuler la campagne.', 'error');
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!window.confirm('Supprimer définitivement cette campagne ?')) return;
    try {
      const res = await flowexaApi.deleteCampaign(businessId, campaignId);
      if (res.success) {
        onShowToast('Supprimée', 'Campagne supprimée.', 'info');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      onShowToast('Erreur', 'Impossible de supprimer.', 'error');
    }
  };

  const resetForm = () => {
    setName('');
    setMessage('');
    setObjective('FIDÉLISATION');
    setTargetSegment('RECURRENT');
    setChannel('INTERNAL');
    setPromoCode('');
    setDiscountPercent(undefined);
    setCost(0);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  const selectedSegmentDef = segments.find((s) => s.code === targetSegment);

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B1528] via-[#0F1C36] to-[#0B1528] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cyan" dot>
              Moteur de Croissance & Fidélisation
            </Badge>
            <span className="text-xs text-gray-400">Entreprise : {businessName}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#FB8205]" />
            Croissance, CRM & Campagnes Ciblées
          </h1>
          <p className="text-sm text-gray-300 mt-1 max-w-2xl">
            Transformez vos clients existants en ambassadeurs récurrents. Activez des relances courtoises,
            diffusez des offres pertinentes et suivez le retour réel de chaque action.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="cursor-pointer"
          >
            Créer une campagne
          </Button>
          <Button
            variant="ghost"
            size="md"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchData}
            isLoading={loading}
            className="text-gray-300 hover:text-white"
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Funnel & Real KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0B1528] border border-white/10 rounded-xl p-4">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">
            Nouveaux clients
          </span>
          <div className="text-2xl font-extrabold text-white">
            {metrics?.newClientsCount ?? 0}
          </div>
          <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            1 interaction vérifiée
          </p>
        </div>

        <div className="bg-[#0B1528] border border-white/10 rounded-xl p-4">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">
            Clients récurrents
          </span>
          <div className="text-2xl font-extrabold text-emerald-400">
            {metrics?.recurrentClientsCount ?? 0}
          </div>
          <p className="text-xs text-emerald-300 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            ≥ 2 prestations réalisées
          </p>
        </div>

        <div className="bg-[#0B1528] border border-white/10 rounded-xl p-4">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">
            Sans échange récent
          </span>
          <div className="text-2xl font-extrabold text-amber-400">
            {metrics?.inactiveClientsCount ?? 0}
          </div>
          <p className="text-xs text-amber-300 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Aucun contact &gt; 45 jours
          </p>
        </div>

        <div className="bg-[#0B1528] border border-white/10 rounded-xl p-4">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">
            Taux de transformation
          </span>
          <div className="text-2xl font-extrabold text-[#FB8205]">
            {metrics?.conversionRate ?? 0}%
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {metrics?.totalBookings ?? 0} réservations / {metrics?.totalRequests ?? 0} demandes
          </p>
        </div>
      </div>

      {/* Growth Opportunities (Real facts detected) */}
      <div className="bg-[#0B1528] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Opportunités d'Action Détectées
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Suggestions calculées sur la base de vos demandes, inactifs et prestations réelles.
            </p>
          </div>
          <Badge variant="warning">Faits observés</Badge>
        </div>

        {opportunities.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            Toutes vos interactions sont à jour. Aucune opportunité urgente de réactivation constatée.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-[#0F1C36] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-gray-300">
                      {opp.targetSegment}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        opp.impactLevel === 'HIGH'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      Impact {opp.impactLevel}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{opp.title}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed mb-4">{opp.description}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ChevronRight className="w-3 h-3" />}
                  onClick={() => handleApplyOpportunity(opp)}
                  className="w-full justify-between text-xs cursor-pointer border-white/20 hover:border-[#FB8205] hover:text-[#FB8205]"
                >
                  {opp.suggestedActionLabel}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campaigns Management Section */}
      <div className="bg-[#0B1528] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#FB8205]" />
              Campagnes & Relances Ciblées
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Diffusez des messages personnalisés respectant le consentement de vos clients.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Statut :
            </span>
            {(['ALL', 'BROUILLON', 'PROGRAMMÉE', 'EN_COURS', 'TERMINÉE', 'ANNULÉE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#FB8205] text-white font-bold'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {st === 'ALL' ? 'Toutes' : st}
              </button>
            ))}
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
            <Megaphone className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">Aucune campagne enregistrée</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
              Créez votre première campagne ciblée pour remercier vos clients ou réactiver des contacts récents.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="cursor-pointer"
            >
              Nouvelle campagne
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-[#0F1C36] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-white/20 transition-all"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                        camp.status === 'TERMINÉE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : camp.status === 'BROUILLON'
                          ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          : camp.status === 'PROGRAMMÉE'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {camp.status}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-gray-400">
                      Objectif : {camp.objective}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-gray-400">
                      Cible : {camp.targetSegment}
                    </span>
                    {camp.promoCode && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Code : {camp.promoCode} {camp.discountPercent ? `(-${camp.discountPercent}%)` : ''}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white truncate">{camp.name}</h3>
                  <p className="text-xs text-gray-300 line-clamp-2 italic">"{camp.message}"</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                    <span>
                      Destinataires éligibles : <strong className="text-white">{camp.recipientsCount}</strong>
                    </span>
                    {camp.deliveredCount > 0 && (
                      <span>
                        Délivrés : <strong className="text-emerald-400">{camp.deliveredCount}</strong>
                      </span>
                    )}
                    {camp.conversionsCount > 0 && (
                      <span>
                        Conversions : <strong className="text-cyan-400">{camp.conversionsCount}</strong>
                      </span>
                    )}
                    {typeof camp.generatedRevenue === 'number' && camp.generatedRevenue > 0 && (
                      <span>
                        CA généré : <strong className="text-emerald-400">{(camp.generatedRevenue ?? 0).toLocaleString('fr-FR')} FCFA</strong>
                      </span>
                    )}
                    {camp.sentAt && (
                      <span>
                        Diffusée le : {new Date(camp.sentAt).toLocaleDateString('fr-FR')} à {new Date(camp.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {camp.status !== 'TERMINÉE' && camp.status !== 'ANNULÉE' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                      onClick={() => handleSendCampaign(camp.id, camp.name)}
                      className="cursor-pointer"
                    >
                      Envoyer
                    </Button>
                  )}

                  {camp.status === 'PROGRAMMÉE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Ban className="w-3.5 h-3.5" />}
                      onClick={() => handleCancelCampaign(camp.id)}
                      className="cursor-pointer text-amber-300 border-amber-500/30"
                    >
                      Annuler
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCampaign(camp.id)}
                    className="cursor-pointer text-gray-400 hover:text-red-400"
                    title="Supprimer la campagne"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Création Campagne */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B1528] border border-white/20 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#FB8205]" />
                  Nouvelle Campagne Ciblée
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Audience segmentée, message respectueux et traçabilité anti-spam.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-left">
              {/* Titre & Objectif */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Nom de la campagne *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex : Offre fidélité baux annuels..."
                    required
                    className="w-full bg-[#0F1C36] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FB8205]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Objectif de la campagne
                  </label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value as CampaignObjective)}
                    className="w-full bg-[#0F1C36] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FB8205]"
                  >
                    <option value="FIDÉLISATION">Fidélisation (Clients réguliers)</option>
                    <option value="RÉACTIVATION">Réactivation (Clients sans échange)</option>
                    <option value="NOUVELLE_OFFRE">Lancement d'une nouvelle formule</option>
                    <option value="REMERCIEMENT">Remerciement & Avis client</option>
                    <option value="RELANCE_DEVIS">Relance de demande en attente</option>
                  </select>
                </div>
              </div>

              {/* Audience & Canal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Segment d'audience cible *
                  </label>
                  <select
                    value={targetSegment}
                    onChange={(e) => setTargetSegment(e.target.value as ClientSegmentCode)}
                    className="w-full bg-[#0F1C36] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FB8205]"
                  >
                    {segments.map((seg) => (
                      <option key={seg.code} value={seg.code}>
                        {seg.label} ({seg.clientCount} clients vérifiés)
                      </option>
                    ))}
                  </select>
                  {selectedSegmentDef && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      Critère : {selectedSegmentDef.criteria}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Canal de diffusion
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as CampaignChannel)}
                    className="w-full bg-[#0F1C36] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FB8205]"
                  >
                    <option value="INTERNAL">Messagerie & Notifications Flowexa (Inclus)</option>
                    <option value="WHATSAPP">WhatsApp (Nécessite passerelle SMS/WhatsApp)</option>
                    <option value="EMAIL">Email transactionnel (Nécessite SMTP)</option>
                    <option value="SMS">SMS Direct (Nécessite passerelle opérateur)</option>
                  </select>
                  <p className="text-[11px] text-cyan-400 mt-1">
                    Remarque : sans fournisseur externe connecté, la diffusion se fait via la messagerie interne Flowexa.
                  </p>
                </div>
              </div>

              {/* Message avec bouton IA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-300">
                    Message transmis aux clients *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAIDraft}
                    disabled={generatingAI}
                    className="text-xs text-[#FB8205] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {generatingAI ? 'Génération en cours...' : 'Rédiger avec l’IA Flowexa'}
                  </button>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Rédigez un message courtois, clair et direct..."
                  required
                  className="w-full bg-[#0F1C36] border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#FB8205]"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Les messages doivent rester bienveillants et ciblés. La fréquence maximale est de 1 message par semaine par client.
                </p>
              </div>

              {/* Code promo optionnel & Coût */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Code Promo (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Ex : PRIVILEGE10"
                    className="w-full bg-[#0F1C36] border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Remise (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={discountPercent || ''}
                    onChange={(e) => setDiscountPercent(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ex : 10"
                    className="w-full bg-[#0F1C36] border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Coût estimé (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cost || ''}
                    onChange={(e) => setCost(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-[#0F1C36] border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setShowCreateModal(false)}
                  className="cursor-pointer text-gray-400 hover:text-white"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={creating}
                  className="cursor-pointer"
                >
                  Enregistrer la campagne
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
