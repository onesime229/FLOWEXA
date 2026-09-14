import React from 'react';

interface FooterProps {
  systemStatus?: string;
  role?: string;
}

export const Footer: React.FC<FooterProps> = ({
  systemStatus = 'Opérationnel',
  role = 'Business Owner',
}) => {
  return (
    <footer className="h-12 bg-[#020919] border-t border-white/5 px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest shrink-0 gap-2 sm:gap-0 select-none">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10D97F] animate-ping inline-block"></span>
          Système: <span className="text-[#10D97F] font-semibold">{systemStatus}</span>
        </span>
        <span>
          Multi-tenant: <span className="text-white font-medium">Actif</span>
        </span>
        <span>
          Rôle: <span className="text-white font-medium">{role}</span>
        </span>
      </div>

      <div className="text-gray-500 font-sans tracking-normal">
        &copy; 2026 Flowexa Platform - Puissant à l'intérieur. Simple à l'extérieur.
      </div>
    </footer>
  );
};
