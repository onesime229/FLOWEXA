import React from 'react';
import { X, CheckCircle2, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { ServiceModule } from '../types';

interface ModuleDetailModalProps {
  module: ServiceModule | null;
  onClose: () => void;
  onTestQuery: (query: string) => void;
}

export const ModuleDetailModal: React.FC<ModuleDetailModalProps> = ({
  module,
  onClose,
  onTestQuery,
}) => {
  if (!module) return null;

  const isOrange = module.accentColor === '#FB8205';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#0A1428] border border-white/10 rounded-2xl p-6 md:p-8 text-left shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Light */}
        <div
          className={`absolute -top-24 left-1/2 transform -translate-x-1/2 w-64 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isOrange ? 'bg-[#FB8205]' : 'bg-[#0BE9EF]'
          }`}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${
              isOrange
                ? 'text-[#FB8205] border-[#FB8205]/30 bg-[#FB8205]/10'
                : 'text-[#0BE9EF] border-[#0BE9EF]/30 bg-[#0BE9EF]/10'
            }`}
          >
            MODULE {module.number}
          </span>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            {module.category}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-1">{module.name}</h2>
        <p className="text-sm text-gray-400 mb-4">{module.subtitle}</p>

        <p className="text-sm text-gray-300 leading-relaxed mb-6 bg-[#020919]/60 p-3 rounded-lg border border-white/5">
          {module.description}
        </p>

        {/* Features Checklist */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[#0BE9EF]" />
            Capacités du module métier
          </h3>
          <ul className="space-y-2.5">
            {module.features.map((feat, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-gray-300">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isOrange ? 'text-[#FB8205]' : 'text-[#0BE9EF]'
                  }`}
                />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Security & Multi-tenant banner */}
        <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-white/5 p-2.5 rounded-lg mb-6 border border-white/5">
          <ShieldCheck className="w-4 h-4 text-[#10D97F] shrink-0" />
          <span>Isolation des données garantie : cloisonnement strict multi-tenant.</span>
        </div>

        {/* Action button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              onTestQuery(module.sampleQuery);
              onClose();
            }}
            className="flex-1 bg-[#FB8205] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[#E06900] transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-[#FB8205]/20 cursor-pointer"
          >
            <span>Tester la recherche associée</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors text-sm cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
