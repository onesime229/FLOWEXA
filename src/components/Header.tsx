import React from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, user }) => {
  const navItems = [
    { id: 'plateforme', label: 'Plateforme' },
    { id: 'professionnels', label: 'Professionnels' },
    { id: 'particuliers', label: 'Particuliers' },
    { id: 'support', label: 'Support' }
  ];

  return (
    <header className="h-16 border-b border-[#0A1428] px-4 md:px-8 flex items-center justify-between bg-[#0A1428] z-20 shrink-0 select-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#FB8205] rounded-md flex items-center justify-center shadow-sm shadow-[#FB8205]/20">
          <div className="w-4 h-4 bg-white rounded-xs transform rotate-45"></div>
        </div>
        <div className="flex items-baseline">
          <span className="text-xl font-bold tracking-tight text-white">
            FLOW<span className="text-[#FB8205]">EXA</span>
          </span>
          <span className="ml-2 text-[9px] font-bold uppercase tracking-widest text-[#0BE9EF] border border-[#0BE9EF]/30 px-1.5 py-0.5 rounded">
            SaaS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`transition-colors cursor-pointer pb-5 pt-5 text-sm ${
                isActive
                  ? 'text-white border-b-2 border-[#FB8205] font-semibold'
                  : 'hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Info & Avatar */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400 leading-none mb-1">Bienvenue,</p>
          <p className="text-sm font-semibold text-white leading-none">{user.name}</p>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-[#0BE9EF] bg-[#0A1428] flex items-center justify-center shadow-sm shadow-[#0BE9EF]/20">
          <span className="text-xs font-bold text-[#0BE9EF]">{user.initials}</span>
        </div>
      </div>
    </header>
  );
};
