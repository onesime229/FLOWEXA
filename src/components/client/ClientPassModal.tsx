import React from 'react';
import { Sparkles, X, Award, Gift, Check, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { UserProfile } from '../../types';

interface ClientPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
}

export const ClientPassModal: React.FC<ClientPassModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0C1322]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0C1322] border border-white/10 text-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0BE9EF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FB8205]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="p-5 pb-3 flex items-center justify-between relative z-10 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#0BE9EF]" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wider">
                FLOW<span className="text-[#0BE9EF]">EXA PASS</span>
              </div>
              <div className="text-[11px] text-gray-400 font-semibold">
                Club Fidélité & Privilèges Bénin
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="p-5 overflow-y-auto space-y-5 relative z-10">
          {/* Card Hero */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Statut Membre
              </span>
              <span className="px-3 py-1 rounded-full bg-[#0BE9EF]/20 border border-[#0BE9EF]/40 text-[#0BE9EF] text-xs font-extrabold">
                Niveau Silver
              </span>
            </div>

            <div className="text-xl font-bold font-disp mt-2 text-white">
              {user?.name || 'Visiteur Privilégié Flowexa'}
            </div>
            <div className="text-xs text-gray-300 font-mono mt-0.5">
              ID : FX-BEN-{user?.id ? user.id.slice(-6).toUpperCase() : '982410'}
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-gray-300">1 450 XP cumulés</span>
                <span className="text-[#0BE9EF]">Palier Gold : 2 000 XP</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#0BE9EF] to-[#10D97F] w-[72.5%] rounded-full" />
              </div>
            </div>
          </div>

          {/* Unlocked Perks */}
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">
              Vos Avantages Actifs
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#10D97F]/15 text-[#10D97F] flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-white">-15% Réduction Séjours</div>
                  <div className="text-gray-400">Valable dans les Guest Houses certifiées Flowexa</div>
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0BE9EF]/15 text-[#0BE9EF] flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-white">Traitement Prioritaire</div>
                  <div className="text-gray-400">Devis artisans et agences transmis en express</div>
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FB8205]/15 text-[#FB8205] flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-white">Offres d'Anniversaire</div>
                  <div className="text-gray-400">Cadeaux partenaires débloqués chaque année</div>
                </div>
              </div>
            </div>
          </div>

          {/* Level Tiers */}
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">
              Paliers de progression
            </div>
            <div className="divide-y divide-white/10 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10D97F]" />
                  <span className="font-bold text-gray-300">Bronze (0 - 500 XP)</span>
                </div>
                <span className="text-gray-400 font-semibold">Débloqué</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0BE9EF]" />
                  <span className="font-bold text-white">Silver (500 - 2 000 XP)</span>
                </div>
                <span className="text-[#0BE9EF] font-bold">Actuel</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FB8205]" />
                  <span className="font-bold text-gray-400">Gold (2 000 - 5 000 XP)</span>
                </div>
                <span className="text-gray-500 font-semibold">-20% + Conciergerie</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 relative z-10 flex gap-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#0794A0] hover:bg-[#067c87] text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
