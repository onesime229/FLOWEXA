import React from 'react';
import { X, Sparkles, MapPin, Tag, Star, ArrowRight } from 'lucide-react';
import { SearchResult } from '../types';

interface SearchResultsModalProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SearchResultsModal: React.FC<SearchResultsModalProps> = ({
  query,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  // Derive mock parsed results based on query context
  const getResults = (q: string): SearchResult[] => {
    const lower = q.toLowerCase();
    if (lower.includes('appartement') || lower.includes('cotonou') || lower.includes('immobilier') || lower.includes('fcfa')) {
      return [
        {
          title: 'Appartement 2 pièces meublé & ventilé',
          category: 'Immobilier (Location)',
          location: 'Cotonou, Haie Vive',
          price: '120 000 FCFA / mois',
          rating: 4.8,
          businessName: 'Agence Immobilière Littoral Prestige',
          badgeText: 'Correspondance 98%'
        },
        {
          title: 'Studio spacieux moderne sécurisé',
          category: 'Immobilier (Location)',
          location: 'Cotonou, Cadjèhoun',
          price: '110 000 FCFA / mois',
          rating: 4.9,
          businessName: 'Cabinet Immobilier Bénin Horizon',
          badgeText: 'Disponible immédiatement'
        },
        {
          title: 'Appartement F3 avec balcon',
          category: 'Immobilier (Location)',
          location: 'Cotonou, Fidjrossè Plage',
          price: '130 000 FCFA / mois',
          rating: 4.7,
          businessName: 'Agence Atlantique Résidences',
          badgeText: 'Proche commodités'
        }
      ];
    } else if (lower.includes('guest') || lower.includes('ouidah') || lower.includes('piscine') || lower.includes('chambre')) {
      return [
        {
          title: 'Villa Ouidah Plage & Suite Cocooning',
          category: 'Guest House',
          location: 'Ouidah, Zone Côtière',
          price: '45 000 FCFA / nuit',
          rating: 4.9,
          businessName: 'Villa Djégba Guest House',
          badgeText: 'Piscine & Vue lagune'
        },
        {
          title: 'Bungalow Éco-Lodge avec jardin',
          category: 'Guest House',
          location: 'Ouidah, Centre Historique',
          price: '30 000 FCFA / nuit',
          rating: 4.8,
          businessName: 'L’Oasis de la Porte du Non-Retour',
          badgeText: 'Calme garanti'
        }
      ];
    } else if (lower.includes('barbier') || lower.includes('coupe') || lower.includes('barbe') || lower.includes('coiffure')) {
      return [
        {
          title: 'Forfait Coupe Dégradé + Taille Barbe à l’huile chaude',
          category: 'Barbier',
          location: 'Cotonou, Ganhi',
          price: '6 000 FCFA',
          rating: 4.9,
          businessName: 'Barber Club Prestige',
          badgeText: 'Créneau dispo ce soir 19h15'
        },
        {
          title: 'Soin complet barbe & coupe ciseaux',
          category: 'Barbier',
          location: 'Cotonou, Saint-Michel',
          price: '5 000 FCFA',
          rating: 4.7,
          businessName: 'Gentlemen Grooming Lounge',
          badgeText: 'Sans rendez-vous'
        }
      ];
    } else {
      return [
        {
          title: `Service certifié Flowexa correspondant à "${q.slice(0, 32)}..."`,
          category: 'Service Professionnel',
          location: 'Cotonou et environs',
          price: 'Sur devis transparent',
          rating: 4.9,
          businessName: 'Prestataire Référencé Flowexa',
          badgeText: 'Disponibilité vérifiée'
        }
      ];
    }
  };

  const results = getResults(query);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#0A1428] border border-white/10 rounded-2xl p-6 md:p-8 text-left shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0BE9EF]" />
            <h2 className="text-lg md:text-xl font-bold text-white">
              Compréhension de la demande Flowexa
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parsed Query Banner */}
        <div className="my-4 p-3.5 rounded-xl bg-[#020919] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Demande :</span>
            <span className="text-xs md:text-sm font-semibold text-white italic">« {query} »</span>
          </div>
          <span className="text-[10px] font-mono text-[#10D97F] bg-[#10D97F]/10 border border-[#10D97F]/20 px-2 py-0.5 rounded-full">
            {results.length} professionnels qualifiés
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {results.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#020919]/70 border border-white/5 hover:border-[#FB8205]/40 transition-all p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#0BE9EF] bg-[#0BE9EF]/10 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                    {item.badgeText}
                  </span>
                </div>
                <h4 className="text-sm md:text-base font-semibold text-white group-hover:text-[#FB8205] transition-colors">
                  {item.title}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#FB8205]" />
                    {item.location}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span>{item.businessName}</span>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-white/5 pt-2 md:pt-0 shrink-0 gap-1">
                <div className="flex items-center gap-1 text-xs text-yellow-400 font-semibold mb-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span>{item.rating}</span>
                </div>
                <div className="text-sm md:text-base font-bold text-white mb-1">
                  {item.price}
                </div>
                <button
                  onClick={() => alert(`Connexion directe avec ${item.businessName} via l'espace sécurisé Flowexa.`)}
                  className="bg-[#FB8205] hover:bg-[#E06900] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Contacter</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-white/5 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
          >
            Fermer les résultats
          </button>
        </div>
      </div>
    </div>
  );
};
