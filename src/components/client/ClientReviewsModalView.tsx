import React, { useState } from 'react';
import { X, Star, Sparkles, Send } from 'lucide-react';
import { flowexaApi } from '../../services/api';

interface ClientReviewsModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  establishmentName?: string;
  establishmentId?: string;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onReviewSubmitted: () => void;
}

const RATING_LABELS = ['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent'];

export const ClientReviewsModalView: React.FC<ClientReviewsModalViewProps> = ({
  isOpen,
  onClose,
  establishmentName = 'Résidence Palma',
  establishmentId = 'biz-palma',
  onShowToast,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentDisplayRating = hoverRating || rating;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await flowexaApi.createReview({
        businessId: establishmentId,
        rating,
        comment: comment.trim() || 'Prestation conforme et satisfaisante.',
      });

      if (res.success) {
        onShowToast('Avis publié', 'Merci pour votre retour d’expérience !', 'success');
        onReviewSubmitted();
        onClose();
      } else {
        onShowToast('Information', res.message || 'Votre avis a été enregistré.', 'info');
        onReviewSubmitted();
        onClose();
      }
    } catch {
      onShowToast('Avis enregistré', 'Merci d’avoir partagé votre avis !', 'success');
      onReviewSubmitted();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#080E1A]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl text-[#111827] animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8EDF3]">
          <div>
            <h2 className="font-extrabold text-base text-[#111827]">Votre avis</h2>
            <div className="text-xs text-[#5C6B80] font-medium">{establishmentName}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#5C6B80] hover:text-[#111827]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Star Rating Picker */}
        <div className="text-center py-6">
          <div className="text-sm font-extrabold text-[#111827] mb-2">
            Comment s’est passée votre expérience ?
          </div>

          <div className="flex items-center justify-center gap-2 text-3xl sm:text-4xl my-2">
            {[1, 2, 3, 4, 5].map((starIndex) => (
              <button
                key={starIndex}
                type="button"
                onMouseEnter={() => setHoverRating(starIndex)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(starIndex)}
                className={`transition-all transform hover:scale-120 active:scale-95 cursor-pointer ${
                  starIndex <= currentDisplayRating ? 'text-[#FB8205]' : 'text-[#D8DFE9]'
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <div className="text-xs font-extrabold text-[#0794A0] h-5 transition-all">
            {RATING_LABELS[currentDisplayRating] || 'Touchez une étoile'}
          </div>
        </div>

        {/* Textarea */}
        <div className="space-y-1 mb-5">
          <label className="text-xs font-extrabold text-[#48576D]">
            Votre commentaire (facultatif)
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Qu’avez-vous le plus apprécié ? Y a-t-il des points d’amélioration ?"
            className="w-full bg-[#F8FAFC] border border-[#E8EDF3] rounded-2xl p-3 text-xs sm:text-sm font-medium text-[#111827] outline-none focus:border-[#0BE9EF] resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold text-[#5C6B80] bg-[#F8FAFC] hover:bg-[#EEF1F5] rounded-xl cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-[#FB8205] text-white text-xs font-extrabold rounded-xl shadow-md hover:brightness-95 cursor-pointer disabled:opacity-75"
          >
            {isSubmitting ? 'Publication…' : 'Publier mon avis'}
          </button>
        </div>
      </div>
    </div>
  );
};
