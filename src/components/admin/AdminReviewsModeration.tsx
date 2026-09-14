import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  ShieldCheck,
  AlertTriangle,
  Flag,
  CheckCircle2,
  XCircle,
  EyeOff,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Check,
  Building2,
  MessageSquare,
} from 'lucide-react';
import { ReviewItem, ReviewReportItem, ReviewStatus } from '../../types';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { flowexaApi } from '../../services/api';

export const AdminReviewsModeration: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reports, setReports] = useState<ReviewReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'REVIEWS' | 'REPORTS'>('REVIEWS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'HIDDEN' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRev, resRep] = await Promise.all([
        flowexaApi.getAdminReviews(),
        flowexaApi.getAdminReports(),
      ]);

      if (resRev.success && Array.isArray(resRev.data)) {
        setReviews(resRev.data);
      }
      if (resRep.success && Array.isArray(resRep.data)) {
        setReports(resRep.data);
      }
    } catch (err: any) {
      console.error('Erreur chargement avis admin:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Moderation actions
  const handleHide = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await flowexaApi.adminHideReview(id, 'Masqué par la modération Super Admin');
      if (res.success) {
        showToast('Avis masqué avec succès. La note globale a été recalculée sans cet avis.');
        await loadData();
      } else {
        showToast(res.message || 'Erreur lors du masquage', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestore = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await flowexaApi.adminRestoreReview(id, 'Rétabli après examen modération');
      if (res.success) {
        showToast('Avis rétabli et réintégré dans le calcul de notation.');
        await loadData();
      } else {
        showToast(res.message || 'Erreur', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await flowexaApi.adminRejectReview(id, 'Rejeté pour non-conformité');
      if (res.success) {
        showToast('Avis rejeté définitivement.');
        await loadData();
      } else {
        showToast(res.message || 'Erreur', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous certain de vouloir supprimer définitivement cet avis ?')) return;
    setActionLoadingId(id);
    try {
      const res = await flowexaApi.adminDeleteReview(id, 'Suppression manuelle Super Admin');
      if (res.success) {
        showToast('Avis supprimé du système.');
        await loadData();
      } else {
        showToast(res.message || 'Erreur', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    setActionLoadingId(reportId);
    try {
      const res = await flowexaApi.adminResolveReport(reportId);
      if (res.success) {
        showToast('Signalement marqué comme traité.');
        await loadData();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    setActionLoadingId(reportId);
    try {
      const res = await flowexaApi.adminDismissReport(reportId);
      if (res.success) {
        showToast('Signalement rejeté (non fondé).', 'info');
        await loadData();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComment = r.comment.toLowerCase().includes(q);
      const matchClient = r.clientName.toLowerCase().includes(q);
      const matchBiz = r.businessName.toLowerCase().includes(q);
      const matchOffer = r.catalogItemTitle?.toLowerCase().includes(q);
      return matchComment || matchClient || matchBiz || matchOffer;
    }
    return true;
  });

  const pendingReportsCount = reports.filter((rep) => rep.status === 'PENDING').length;

  return (
    <div className="space-y-6 text-left">
      {/* Toast feedback */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            toastMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-white hover:text-gray-300">
            ✕
          </button>
        </div>
      )}

      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A1428] border border-white/10 rounded-2xl p-4.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Modération & Système de Confiance
            </h3>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Avis 100% Vérifiés
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Supervision de la notation certifiée et traitement des signalements de la communauté.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#020919] p-1 rounded-xl border border-white/5 flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('REVIEWS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'REVIEWS'
                  ? 'bg-[#FB8205] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tous les Avis ({reviews.length})
            </button>
            <button
              onClick={() => setActiveSubTab('REPORTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'REPORTS'
                  ? 'bg-[#FB8205] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Signalements</span>
              {pendingReportsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                  {pendingReportsCount}
                </span>
              )}
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="border-white/10 text-xs"
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* SUBTAB 1: REVIEWS LIST */}
      {activeSubTab === 'REVIEWS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A1428] border border-white/10 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par client, entreprise, commentaire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs text-white focus:outline-none placeholder-gray-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {(['ALL', 'PUBLISHED', 'HIDDEN', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white/15 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {st === 'ALL'
                    ? 'Tous'
                    : st === 'PUBLISHED'
                    ? 'Publiés'
                    : st === 'HIDDEN'
                    ? 'Masqués'
                    : 'Rejetés'}
                </button>
              ))}
            </div>
          </div>

          {/* Reviews Table */}
          {filteredReviews.length === 0 ? (
            <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-12 text-center text-xs text-gray-400">
              Aucun avis trouvé dans cette sélection.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((rev) => {
                const isLoading = actionLoadingId === rev.id;

                return (
                  <div
                    key={rev.id}
                    className={`bg-[#0A1428] border rounded-2xl p-4.5 space-y-3 transition-all ${
                      rev.status === 'HIDDEN'
                        ? 'border-amber-500/20 bg-amber-500/[0.02]'
                        : rev.status === 'REJECTED'
                        ? 'border-rose-500/20 bg-rose-500/[0.02]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{rev.clientName}</span>
                          <span className="text-xs text-gray-400">
                            → Établissement : <strong className="text-white">{rev.businessName}</strong>
                          </span>
                          {rev.catalogItemTitle && (
                            <span className="text-[11px] text-[#0BE9EF]">
                              ({rev.catalogItemTitle})
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rev.status === 'PUBLISHED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : rev.status === 'HIDDEN'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {rev.status === 'PUBLISHED'
                              ? 'PUBLIÉ'
                              : rev.status === 'HIDDEN'
                              ? 'MASQUÉ'
                              : 'REJETÉ'}
                          </span>
                          {rev.isReported && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white flex items-center gap-1">
                              <Flag className="w-3 h-3" />
                              {rev.reportCount} Signalement(s)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  rev.rating >= s
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-white">{rev.rating}/5</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400 font-mono text-[11px]">
                            Réf interaction: {rev.requestId.substring(0, 12)}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400 text-[11px]">
                            {new Date(rev.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      {/* Moderation Action Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {rev.status === 'PUBLISHED' ? (
                          <button
                            onClick={() => handleHide(rev.id)}
                            disabled={isLoading}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Masquer de l'affichage public et exclure du calcul de note"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Masquer</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestore(rev.id)}
                            disabled={isLoading}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Rétablir l'avis"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Rétablir</span>
                          </button>
                        )}

                        {rev.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleReject(rev.id)}
                            disabled={isLoading}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Rejeter définitivement"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejeter</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(rev.id)}
                          disabled={isLoading}
                          className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed bg-[#020919] p-3 rounded-xl border border-white/5">
                      « {rev.comment} »
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: REPORTS LIST */}
      {activeSubTab === 'REPORTS' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-12 text-center text-xs text-gray-400">
              Aucun signalement d'avis en attente. Tout est sous contrôle !
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => {
                const isPending = rep.status === 'PENDING';

                return (
                  <div
                    key={rep.id}
                    className={`bg-[#0A1428] border rounded-2xl p-4.5 space-y-3 transition-all ${
                      isPending ? 'border-rose-500/30 bg-rose-500/[0.02]' : 'border-white/10'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                            <Flag className="w-3.5 h-3.5" />
                            Motif : {rep.reason}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPending
                                ? 'bg-rose-500/20 text-rose-300'
                                : rep.status === 'RESOLVED'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {rep.status}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Signalé par {rep.reporterName} le {new Date(rep.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-xs text-white">
                          <strong>Détails du plaignant :</strong> {rep.details || 'Aucune précision complémentaire.'}
                        </p>
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button
                            size="sm"
                            variant="primary"
                            className="text-xs bg-emerald-600 hover:bg-emerald-500"
                            onClick={() => handleResolveReport(rep.id)}
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                          >
                            Traiter / Résoudre
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-gray-400 border-white/10"
                            onClick={() => handleDismissReport(rep.id)}
                          >
                            Rejeter signalement
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-gray-400 bg-[#020919] p-2.5 rounded-xl border border-white/5 font-mono">
                      ID Avis concerné : {rep.reviewId}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
