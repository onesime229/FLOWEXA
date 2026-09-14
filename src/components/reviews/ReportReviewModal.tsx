import React, { useState } from 'react';
import { Flag, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { ReviewItem, ReviewReportReason } from '../../types';
import { flowexaApi } from '../../services/api';

export interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewItem | null;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ReportReviewModal: React.FC<ReportReviewModalProps> = ({
  isOpen,
  onClose,
  review,
  onShowToast,
}) => {
  const [reason, setReason] = useState<ReviewReportReason>('INAPPROPRIATE');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!review) return null;

  const reasonsList: { value: ReviewReportReason; label: string; desc: string }[] = [
    { value: 'INAPPROPRIATE', label: 'Contenu inapproprié ou vulgaire', desc: 'Propos injurieux, diffamation ou non conformité éthique.' },
    { value: 'FALSE_INFO', label: 'Information mensongère', desc: 'Faits manifestement inventés ou calomnieux.' },
    { value: 'SPAM', label: 'Spam ou publicité externe', desc: 'Liens promotionnels ou messages automatisés.' },
    { value: 'OFFENSIVE', label: 'Propos haineux ou offensants', desc: 'Discrimination, harcèlement ou agressivité.' },
    { value: 'OTHER', label: 'Autre motif légitime', desc: 'Autre raison spécifique à préciser ci-dessous.' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await flowexaApi.reportReview(
        review.id,
        {
          reason,
          details: details.trim(),
          reporterName: 'Utilisateur Flowexa',
        },
        'client-test-1'
      );

      if (res.success) {
        onShowToast(
          'Signalement transmis',
          'Merci de votre vigilance. Notre équipe de modération va examiner cet avis sous 24h.',
          'info'
        );
        onClose();
      } else {
        setErrorMsg(res.message || 'Impossible d’enregistrer votre signalement.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Signaler un avis à la modération"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="bg-[#020919] border border-white/5 rounded-xl p-3 text-xs space-y-1">
          <span className="text-gray-400">Avis de : <strong className="text-white">{review.clientName}</strong> ({review.rating}/5 ⭐)</span>
          <p className="text-gray-300 italic line-clamp-2">« {review.comment} »</p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-300">
            Motif du signalement <span className="text-[#FB8205]">*</span>
          </label>
          <div className="space-y-2">
            {reasonsList.map((r) => (
              <label
                key={r.value}
                className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  reason === r.value
                    ? 'bg-[#FB8205]/10 border-[#FB8205]/40 text-white'
                    : 'bg-[#0A1428] border-white/5 text-gray-300 hover:border-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="mt-0.5 text-[#FB8205] focus:ring-0"
                />
                <div className="text-xs">
                  <div className="font-semibold">{r.label}</div>
                  <div className="text-[11px] text-gray-400">{r.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-300">
            Détails complémentaires (facultatif)
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={2}
            placeholder="Précisez pourquoi cet avis pose problème..."
            className="w-full bg-[#020919] border border-white/10 focus:border-[#FB8205] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitting}
            leftIcon={<Flag className="w-4 h-4" />}
            className="bg-rose-600 hover:bg-rose-500 text-white"
          >
            {submitting ? 'Envoi...' : 'Transmettre le signalement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
