import React, { useState } from 'react';
import { Star, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { FlowexaRequestItem } from '../../types';
import { flowexaApi } from '../../services/api';

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FlowexaRequestItem | null;
  onSuccess: () => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess,
  onShowToast,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!request) return null;

  const ratingDescriptions: Record<number, string> = {
    1: '1/5 — Très insatisfaisant',
    2: '2/5 — Décevant / En dessous des attentes',
    3: '3/5 — Correct / Conforme',
    4: '4/5 — Très bien / Recommandé',
    5: '5/5 — Excellent / Prestation remarquable',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 3) {
      setErrorMsg('Veuillez saisir un commentaire d’au moins 3 caractères pour partager votre expérience.');
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      setErrorMsg('Veuillez sélectionner une note entre 1 et 5 étoiles.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await flowexaApi.createReview(
        {
          requestId: request.id,
          rating,
          comment: trimmedComment,
          clientName: request.clientName,
          clientEmail: request.clientEmail,
        },
        request.clientId
      );

      if (res.success) {
        onShowToast(
          'Avis vérifié publié !',
          'Votre avis a été certifié et publié avec succès sur Flowexa. Merci de faire grandir la confiance.',
          'success'
        );
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message || 'Impossible d’enregistrer votre avis.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur réseau lors de la publication de l’avis.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Déposer un avis client vérifié"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        {/* Interaction Summary Card */}
        <div className="bg-[#020919] border border-emerald-500/20 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Prestation terminée</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Interaction Réelle Vérifiée
            </span>
          </div>
          <h4 className="text-sm font-bold text-white line-clamp-1">{request.title}</h4>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Établissement : <strong className="text-white">{request.businessName}</strong></span>
            <span className="font-mono text-[11px]">Réf: {request.id.substring(0, 10)}</span>
          </div>
        </div>

        {/* Rating Stars Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-300">
            Votre note globale <span className="text-[#FB8205]">*</span>
          </label>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || rating) >= star;
              return (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                  title={`${star} étoile(s)`}
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      active
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-600 hover:text-gray-400'
                    }`}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-xs font-semibold text-amber-400">
              {ratingDescriptions[hoverRating || rating]}
            </span>
          </div>
        </div>

        {/* Comment textarea */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-300">
            Votre commentaire d'expérience <span className="text-[#FB8205]">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Décrivez votre expérience avec cette entreprise : ponctualité, conformité de l'offre, accueil, propreté, professionnalisme..."
            className="w-full bg-[#020919] border border-white/10 focus:border-[#FB8205] rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
            required
          />
          <p className="text-[11px] text-gray-400">
            Minimum 3 caractères. Votre avis sera visible publiquement sur la fiche de l'offre et de l'entreprise.
          </p>
        </div>

        {/* Trust Guarantee banner */}
        <div className="bg-[#0A1428] border border-white/5 rounded-xl p-3 flex items-start gap-2.5 text-xs text-gray-400">
          <Sparkles className="w-4 h-4 text-[#0BE9EF] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white">Engagement de confiance Flowexa :</strong> Seuls les clients ayant
            effectué une prestation réelle marquée comme terminée peuvent publier un avis. Pas de faux avis ni de complaisance.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {submitting ? 'Publication...' : 'Publier mon avis vérifié'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
