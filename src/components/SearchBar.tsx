import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSelectPrompt: (prompt: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onSelectPrompt }) => {
  const [query, setQuery] = useState('');

  const samplePrompts = [
    'Je cherche un appartement à Cotonou pour 120 000 FCFA',
    'Guest house calme avec piscine pour un week-end à Ouidah',
    'Barbier ouvert pour taille de barbe et dégradé',
    'Pharmacie de garde ouverte cette nuit à proximité',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handlePromptClick = (text: string) => {
    setQuery(text);
    onSelectPrompt(text);
  };

  return (
    <div className="w-full max-w-3xl mb-8 md:mb-12 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A1428] border border-white/10 text-xs text-gray-300 mb-4">
        <Sparkles className="w-3.5 h-3.5 text-[#0BE9EF]" />
        <span>Recherche naturelle propulsée par Flowexa Intelligence</span>
      </div>

      <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 tracking-tight text-white">
        Puissant à l'intérieur.{' '}
        <span className="text-[#0BE9EF] italic font-normal">Simple à l'extérieur.</span>
      </h1>
      
      <p className="text-gray-400 text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
        Décrivez simplement votre besoin ou explorez nos services spécialisés.
      </p>

      {/* Main Search Bar with Glowing Ambient Halo */}
      <form onSubmit={handleSubmit} className="relative group mb-4">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#FB8205] to-[#0BE9EF] rounded-2xl blur-sm opacity-25 group-hover:opacity-45 transition duration-500"></div>
        <div className="relative flex flex-col sm:flex-row items-stretch bg-[#0A1428] rounded-xl border border-white/10 p-2 shadow-2xl">
          <div className="flex items-center pl-4 text-gray-400">
            <Search className="w-5 h-5 text-gray-400 group-hover:text-[#0BE9EF] transition-colors" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='"Je cherche un appartement à Cotonou pour 120 000 FCFA..."'
            className="flex-1 bg-transparent border-none outline-none px-4 py-3 md:py-4 text-white placeholder-gray-500 text-base md:text-lg font-normal"
          />
          <button
            type="submit"
            className="bg-[#FB8205] text-white px-7 py-3 md:py-4 rounded-lg font-bold hover:bg-[#E06900] transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-md shadow-[#FB8205]/20 active:scale-[0.99]"
          >
            <span>Rechercher</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Prompt Suggestions */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <span className="text-xs text-gray-500 font-medium">Exemples :</span>
        {samplePrompts.slice(0, 2).map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePromptClick(prompt)}
            className="text-xs text-gray-400 bg-[#0A1428] border border-white/5 hover:border-[#FB8205]/50 hover:text-white px-2.5 py-1 rounded-md transition-all cursor-pointer truncate max-w-[280px]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};
