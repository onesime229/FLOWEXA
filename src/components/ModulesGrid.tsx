import React from 'react';
import { FLOWEXA_MODULES } from '../data/modules';
import { ServiceModule } from '../types';

interface ModulesGridProps {
  onSelectModule: (module: ServiceModule) => void;
  selectedModuleId?: string;
}

export const ModulesGrid: React.FC<ModulesGridProps> = ({ onSelectModule, selectedModuleId }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0BE9EF] animate-pulse"></span>
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#0BE9EF] font-bold">
            Nos Modules Services
          </h2>
        </div>
        <div className="h-[1px] flex-1 bg-white/10 mx-6 hidden sm:block"></div>
        <span className="text-xs text-gray-500 font-mono hidden sm:inline">10 modules indépendants</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {FLOWEXA_MODULES.map((mod) => {
          const isSelected = selectedModuleId === mod.id;
          const isOrange = mod.accentColor === '#FB8205';

          return (
            <div
              key={mod.id}
              onClick={() => onSelectModule(mod)}
              className={`bg-[#0A1428] border transition-all duration-200 p-4 rounded-xl cursor-pointer group text-left relative overflow-hidden ${
                isSelected
                  ? isOrange
                    ? 'border-[#FB8205] shadow-lg shadow-[#FB8205]/10 scale-[1.02]'
                    : 'border-[#0BE9EF] shadow-lg shadow-[#0BE9EF]/10 scale-[1.02]'
                  : isOrange
                  ? 'border-white/5 hover:border-[#FB8205] hover:bg-[#0c1933]'
                  : 'border-white/5 hover:border-[#0BE9EF] hover:bg-[#0c1933]'
              }`}
            >
              {/* Top number */}
              <div
                className={`text-sm mb-2 font-bold font-mono transition-colors ${
                  isOrange ? 'text-[#FB8205]' : 'text-[#0BE9EF]'
                }`}
              >
                {mod.number}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-sm md:text-base text-white mb-1 group-hover:text-white transition-colors flex items-center justify-between">
                <span>{mod.name}</span>
              </h3>

              {/* Subtitle */}
              <p className="text-[11px] text-gray-400 line-clamp-1 leading-snug">
                {mod.subtitle}
              </p>

              {/* Active Indicator bar */}
              <div
                className={`absolute bottom-0 left-0 h-[2px] w-full transform transition-transform duration-300 ${
                  isSelected
                    ? isOrange
                      ? 'bg-[#FB8205] scale-x-100'
                      : 'bg-[#0BE9EF] scale-x-100'
                    : 'scale-x-0 group-hover:scale-x-100'
                } ${isOrange ? 'bg-[#FB8205]' : 'bg-[#0BE9EF]'}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
