import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  SlidersHorizontal,
  ArrowUpDown,
  Mic,
  LogIn,
  UserPlus,
  AlertTriangle,
  Volume2,
} from 'lucide-react';

interface CitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: string;
  onSelectCity: (city: string) => void;
}

export const CitySheet: React.FC<CitySheetProps> = ({
  isOpen,
  onClose,
  currentCity,
  onSelectCity,
}) => {
  if (!isOpen) return null;

  const CITIES = ['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Parakou', 'Ouidah'];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#080E1A]/50 backdrop-blur-xs flex items-end justify-center animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up text-[#111827]">
        <div className="w-10 h-1.5 bg-[#D8DFE9] rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-[#111827]">Où recherchez-vous ?</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#5C6B80] hover:text-[#111827]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => {
            onSelectCity('Ma position');
            onClose();
          }}
          className="w-full flex items-center gap-2 p-3.5 mb-3 rounded-2xl bg-[#E1FBFD] text-[#0794A0] font-bold text-sm hover:bg-[#c9f6f9] transition-colors"
        >
          <MapPin className="w-4 h-4 text-[#0794A0]" />
          <span>Utiliser ma position actuelle</span>
        </button>

        <div className="space-y-1 divide-y divide-[#E8EDF3]">
          {CITIES.map((city) => {
            const isSel = currentCity === city;
            return (
              <button
                key={city}
                onClick={() => {
                  onSelectCity(city);
                  onClose();
                }}
                className="w-full flex items-center justify-between py-3.5 text-left font-bold text-sm text-[#111827] hover:bg-[#F8FAFC] px-2 rounded-xl transition-colors cursor-pointer"
              >
                <span>{city}</span>
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSel ? 'border-[#FB8205] bg-[#FB8205]' : 'border-[#C3CCD9]'
                  }`}
                >
                  {isSel && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface SortSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentSort: string;
  onSelectSort: (sortLabel: string) => void;
}

export const SortSheet: React.FC<SortSheetProps> = ({
  isOpen,
  onClose,
  currentSort,
  onSelectSort,
}) => {
  if (!isOpen) return null;

  const SORT_OPTIONS = [
    'Pertinence',
    'Plus proche',
    'Mieux noté',
    'Disponible d’abord',
    'Prix croissant',
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#080E1A]/50 backdrop-blur-xs flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto shadow-2xl text-[#111827]">
        <div className="w-10 h-1.5 bg-[#D8DFE9] rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-[#111827]">Trier par</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#5C6B80] hover:text-[#111827]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1 divide-y divide-[#E8EDF3]">
          {SORT_OPTIONS.map((opt) => {
            const isSel = currentSort === opt;
            return (
              <button
                key={opt}
                onClick={() => {
                  onSelectSort(opt);
                  onClose();
                }}
                className="w-full flex items-center justify-between py-3.5 text-left font-bold text-sm text-[#111827] hover:bg-[#F8FAFC] px-2 rounded-xl transition-colors cursor-pointer"
              >
                <span>{opt}</span>
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSel ? 'border-[#FB8205] bg-[#FB8205]' : 'border-[#C3CCD9]'
                  }`}
                >
                  {isSel && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: () => void;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
}) => {
  const [selectedModule, setSelectedModule] = useState<'immo' | 'guest' | 'beaute' | 'garage'>('guest');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [priceMax, setPriceMax] = useState(50000);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#080E1A]/50 backdrop-blur-xs flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto shadow-2xl text-[#111827]">
        <div className="w-10 h-1.5 bg-[#D8DFE9] rounded-full mx-auto mb-3" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-[#111827]">Filtres adaptatifs</h3>
          <button onClick={onClose} className="text-[#5C6B80] hover:text-[#111827] p-1 font-bold">
            ✕
          </button>
        </div>

        {/* Module switcher chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          <button
            onClick={() => setSelectedModule('guest')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedModule === 'guest'
                ? 'bg-[#0794A0] text-white shadow-xs'
                : 'bg-[#F8FAFC] text-[#5C6B80] border border-[#E8EDF3]'
            }`}
          >
            Guest House
          </button>
          <button
            onClick={() => setSelectedModule('immo')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedModule === 'immo'
                ? 'bg-[#0794A0] text-white shadow-xs'
                : 'bg-[#F8FAFC] text-[#5C6B80] border border-[#E8EDF3]'
            }`}
          >
            Immobilier
          </button>
          <button
            onClick={() => setSelectedModule('beaute')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedModule === 'beaute'
                ? 'bg-[#0794A0] text-white shadow-xs'
                : 'bg-[#F8FAFC] text-[#5C6B80] border border-[#E8EDF3]'
            }`}
          >
            Coiffure & Beauté
          </button>
          <button
            onClick={() => setSelectedModule('garage')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedModule === 'garage'
                ? 'bg-[#0794A0] text-white shadow-xs'
                : 'bg-[#F8FAFC] text-[#5C6B80] border border-[#E8EDF3]'
            }`}
          >
            Garages
          </button>
        </div>

        {/* Filter Body */}
        <div className="space-y-4 text-sm">
          <div>
            <div className="font-extrabold text-xs text-[#5C6B80] uppercase tracking-wider mb-2">Disponibilité</div>
            <div className="flex items-center justify-between py-2 border-b border-[#E8EDF3]">
              <span className="font-semibold text-[#111827]">Disponible ce soir / immédiatement</span>
              <button
                type="button"
                onClick={() => setAvailableOnly(!availableOnly)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  availableOnly ? 'bg-[#10D97F]' : 'bg-[#D8DFE9]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    availableOnly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div>
            <div className="font-extrabold text-xs text-[#5C6B80] uppercase tracking-wider mb-2">Budget maximum</div>
            <div className="flex items-center justify-between font-bold text-sm text-[#FB8205] mb-1">
              <span>Jusqu'à</span>
              <span>{priceMax.toLocaleString()} FCFA</span>
            </div>
            <input
              type="range"
              min="5000"
              max="200000"
              step="5000"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[#FB8205] cursor-pointer"
            />
          </div>

          <div>
            <div className="font-extrabold text-xs text-[#5C6B80] uppercase tracking-wider mb-2">Distance maximale</div>
            <div className="flex gap-2 flex-wrap">
              {['1 km', '3 km', '5 km', '10 km', 'Sans limite'].map((dist, i) => (
                <span
                  key={dist}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                    i === 2
                      ? 'bg-[#E1FBFD] text-[#0794A0] border-[#0794A0]'
                      : 'bg-[#F8FAFC] text-[#5C6B80] border-[#E8EDF3]'
                  }`}
                >
                  {dist}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => {
              onApplyFilters();
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-[#FB8205] text-white font-extrabold text-sm shadow-md hover:brightness-95 transition-all cursor-pointer"
          >
            Appliquer les filtres
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[#5C6B80] font-bold text-xs hover:text-[#111827] cursor-pointer"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};

interface AuthGateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export const AuthGateSheet: React.FC<AuthGateSheetProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenSignup,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#080E1A]/50 backdrop-blur-xs flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto shadow-2xl text-center text-[#111827]">
        <div className="w-10 h-1.5 bg-[#D8DFE9] rounded-full mx-auto mb-4" />
        <div className="w-14 h-14 rounded-2xl bg-[#E1FBFD] text-[#0794A0] flex items-center justify-center mx-auto mb-3">
          <LogIn className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-extrabold text-[#111827]">Connectez-vous pour continuer</h3>
        <p className="text-xs text-[#5C6B80] font-medium my-2 max-w-xs mx-auto leading-relaxed">
          Pour réserver, envoyer des demandes ou contacter directement les professionnels agréés Flowexa.
        </p>

        <div className="mt-5 space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="w-full py-3.5 rounded-2xl bg-[#FB8205] text-white font-extrabold text-sm shadow-md hover:brightness-95 transition-all cursor-pointer"
          >
            Se connecter
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenSignup();
            }}
            className="w-full py-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E8EDF3] text-[#111827] font-bold text-sm hover:bg-[#EEF1F5] transition-all cursor-pointer"
          >
            Créer un compte gratuit
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-[#97A3B4] font-semibold text-xs hover:text-[#5C6B80] cursor-pointer"
          >
            Continuer en visiteur
          </button>
        </div>
      </div>
    </div>
  );
};

interface VocalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptionComplete: (text: string) => void;
}

export const VocalSearchModal: React.FC<VocalSearchModalProps> = ({
  isOpen,
  onClose,
  onTranscriptionComplete,
}) => {
  const [phase, setPhase] = useState<'listening' | 'transcribing' | 'done'>('listening');
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPhase('listening');
      setTranscript('');
      return;
    }

    const sampleQueries = [
      'Je cherche une chambre disponible ce soir à Cotonou',
      'Je veux tresser mes cheveux demain à Cadjehoun',
      'Pharmacie de garde ouverte maintenant près de moi',
      'Besoin d’un plombier pour dépannage urgent à Calavi',
      'Table pour 2 personnes ce soir au restaurant Le Palmier',
    ];
    const picked = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];

    const t1 = setTimeout(() => {
      setPhase('transcribing');
    }, 1800);

    const t2 = setTimeout(() => {
      setPhase('done');
      setTranscript(picked);
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#FFFFFF] to-[#E4FAFC] flex flex-col items-center justify-between p-6 text-center text-[#111827]">
      <div className="w-full flex justify-end">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center text-[#5C6B80] hover:text-[#111827]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-sm w-full">
        <div className="text-xs font-black tracking-widest text-[#0794A0] uppercase mb-6">
          Recherche Vocale Intelligente
        </div>

        {/* Pulsing Mic */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 rounded-full border-2 border-[#FB8205]/40 animate-ping opacity-75" />
          <div className="w-28 h-28 rounded-full bg-[#FB8205] text-white flex items-center justify-center text-4xl shadow-xl shadow-[#FB8205]/35 relative z-10">
            <Mic className="w-14 h-14 animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-[#111827] mb-2 font-disp">
          {phase === 'listening'
            ? 'De quoi avez-vous besoin ?'
            : phase === 'transcribing'
            ? 'Compréhension du besoin…'
            : 'C’est noté !'}
        </h2>

        {phase === 'listening' && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-semibold text-[#5C6B80]">Parlez naturellement, nous vous écoutons…</p>
            <div className="flex gap-1.5 items-center h-8 justify-center mt-2">
              <span className="w-1 bg-[#E06900] rounded-full animate-bounce h-3" />
              <span className="w-1 bg-[#FB8205] rounded-full animate-bounce h-6 delay-75" />
              <span className="w-1 bg-[#0BE9EF] rounded-full animate-bounce h-8 delay-150" />
              <span className="w-1 bg-[#FB8205] rounded-full animate-bounce h-5 delay-200" />
              <span className="w-1 bg-[#E06900] rounded-full animate-bounce h-3 delay-300" />
            </div>
          </div>
        )}

        {phase === 'transcribing' && (
          <p className="text-xs text-[#0794A0] font-bold animate-pulse mt-2">
            Analyse sémantique par l'IA Flowexa…
          </p>
        )}

        {phase === 'done' && (
          <div className="w-full bg-white p-4 rounded-2xl shadow-lg border border-[#E8EDF3] text-left mt-2 animate-fade-in">
            <div className="text-[11px] font-extrabold tracking-wider text-[#97A3B4] uppercase mb-1">
              Vous avez dit :
            </div>
            <div className="text-base font-bold text-[#111827] leading-relaxed">
              « {transcript} »
            </div>
            <button
              onClick={() => {
                onTranscriptionComplete(transcript);
                onClose();
              }}
              className="mt-4 w-full py-3 bg-[#FB8205] text-white font-extrabold rounded-xl shadow-md hover:brightness-95 transition-all text-sm cursor-pointer"
            >
              Voir les résultats analysés
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-xs pb-4">
        <button
          onClick={onClose}
          className="w-full py-2.5 text-[#5C6B80] font-bold text-xs hover:text-[#111827] cursor-pointer"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};
