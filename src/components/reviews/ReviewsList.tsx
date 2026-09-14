import React, { useState } from 'react';
import { Star, ShieldCheck, Flag, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { ReviewItem, RatingSummary } from '../../types';
import { Button } from '../design-system/Button';
import { ReportReviewModal } from './ReportReviewModal';

export interface ReviewsListProps {
  reviews: ReviewItem[];
  ratingSummary?: RatingSummary | null;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  title?: string;
  emptyMessage?: string;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  ratingSummary,
  onShowToast,
  title = 'Avis clients vérifiés',
  emptyMessage = 'Aucun avis publié pour le moment.',
}) => {
  const [selectedReviewForReport, setSelectedReviewForReport] = useState<ReviewItem | null>(null);

  const avg = ratingSummary?.averageRating;
  const count = ratingSummary?.reviewCount || reviews.length;
  const dist = ratingSummary?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <div className="space-y-6 text-left">
      {/* Header & Rating Breakdown */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Vérifiés
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Chaque note provient obligatoirement d'une prestation réelle terminée.
            </p>
          </div>

          {/* Average Badge */}
          {avg !== null && avg !== undefined && count > 0 ? (
            <div className="flex items-center gap-3 bg-[#020919] px-4 py-2.5 rounded-xl border border-white/5">
              <div className="text-3xl font-extrabold text-white">{avg.toFixed(1)}</div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        Math.round(avg) >= s
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5 font-medium">
                  Basé sur {count} avis vérifié{count > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-[#020919] px-3.5 py-2 rounded-xl border border-white/5">
              Pas encore de note calculée
            </div>
          )}
        </div>

        {/* Rating distribution progress bars */}
        {count > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-3 border-t border-white/5 text-xs">
            {[5, 4, 3, 2, 1].map((starNum) => {
              const starCount = dist[starNum as 1 | 2 | 3 | 4 | 5] || 0;
              const pct = count > 0 ? Math.round((starCount / count) * 100) : 0;
              return (
                <div key={starNum} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1 font-medium">
                      {starNum} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    </span>
                    <span>{starCount} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#020919] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-8 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white">{emptyMessage}</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Flowexa ne génère aucun faux avis. Les notes s'affichent au fur et à mesure des prestations réelles terminées.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-[#0A1428] border border-white/10 hover:border-white/20 rounded-2xl p-4.5 space-y-3 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{rev.clientName}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      Avis Vérifié
                    </span>
                    {rev.catalogItemTitle && (
                      <span className="text-[11px] text-gray-400">
                        pour <strong className="text-gray-300">{rev.catalogItemTitle}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
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
                    <span className="text-xs font-bold text-white">{rev.rating}/5</span>
                    <span className="text-[11px] text-gray-500">•</span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(rev.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReviewForReport(rev)}
                  className="p-1 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Signaler cet avis"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed bg-[#020919]/50 p-3 rounded-xl border border-white/5">
                {rev.comment}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {selectedReviewForReport && (
        <ReportReviewModal
          isOpen={Boolean(selectedReviewForReport)}
          onClose={() => setSelectedReviewForReport(null)}
          review={selectedReviewForReport}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
