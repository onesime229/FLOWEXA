import React from 'react';
import { Phone, ShieldAlert, X, Hospital, Flame, Shield, ArrowRight } from 'lucide-react';

interface ClientSosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPharmacies: () => void;
}

export const ClientSosModal: React.FC<ClientSosModalProps> = ({
  isOpen,
  onClose,
  onOpenPharmacies,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0C1322]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0C1322] border border-red-500/30 text-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Urgent red aura */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 pb-3 flex items-center justify-between relative z-10 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white tracking-tight">
                SOS Urgences Bénin
              </h2>
              <div className="text-[11px] text-red-300 font-semibold">
                Lignes directes gratuites & prioritaires 24h/24
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 relative z-10">
          {/* SAMU 15 */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">SAMU Bénin</div>
                <div className="text-xs text-gray-400">Urgences médicales vitales & ambulances</div>
                <div className="text-xs font-mono font-bold text-red-400 mt-0.5">Numéro : 15</div>
              </div>
            </div>
            <a
              href="tel:15"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Appeler</span>
            </a>
          </div>

          {/* Police 117 */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">Police Républicaine</div>
                <div className="text-xs text-gray-400">Sécurité publique & urgences police</div>
                <div className="text-xs font-mono font-bold text-blue-400 mt-0.5">Numéro : 117</div>
              </div>
            </div>
            <a
              href="tel:117"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Appeler</span>
            </a>
          </div>

          {/* Pompiers 118 */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">Sapeurs-Pompiers</div>
                <div className="text-xs text-gray-400">Incendies, accidents de la route & secours</div>
                <div className="text-xs font-mono font-bold text-orange-400 mt-0.5">Numéro : 118</div>
              </div>
            </div>
            <a
              href="tel:118"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Appeler</span>
            </a>
          </div>

          {/* Pharmacies de garde */}
          <div
            onClick={() => {
              onClose();
              onOpenPharmacies();
            }}
            className="p-4 bg-white/5 border border-[#10D97F]/30 hover:border-[#10D97F] rounded-2xl flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#10D97F]/20 text-[#10D97F] flex items-center justify-center">
                <Hospital className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">Pharmacies de Garde</div>
                <div className="text-xs text-gray-400">Ouvertes 24/7 autour de vous à Cotonou</div>
              </div>
            </div>
            <span className="text-[#10D97F] font-bold text-xs flex items-center gap-1">
              <span>Voir la liste</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="text-center text-[11px] text-gray-400 leading-relaxed pt-2">
            En cas d'urgence grave au Bénin, composez immédiatement le 15 ou le 117. Flowexa relaie les canaux officiels certifiés de la République du Bénin.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 relative z-10">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Fermer l'alerte
          </button>
        </div>
      </div>
    </div>
  );
};
