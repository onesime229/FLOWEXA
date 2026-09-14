import React from 'react';
import {
  Building2,
  Home,
  Scissors,
  Sparkles,
  HeartHandshake,
  Activity,
  Camera,
  Palette,
  Wrench,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
} from 'lucide-react';
import { BusinessModuleCode } from '../../types';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export interface SidebarProps {
  items: SidebarNavItem[];
  activeItemId: string;
  onSelectItem: (id: string) => void;
  businessName: string;
  moduleCode: BusinessModuleCode;
  moduleTitle: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeItemId,
  onSelectItem,
  businessName,
  moduleCode,
  moduleTitle,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const moduleIconMap: Record<BusinessModuleCode, React.ReactNode> = {
    IMMOBILIER: <Building2 className="w-5 h-5 text-[#FB8205]" />,
    GUEST_HOUSE: <Home className="w-5 h-5 text-[#0BE9EF]" />,
    COIFFURE: <Scissors className="w-5 h-5 text-[#FB8205]" />,
    BARBIER: <Sparkles className="w-5 h-5 text-[#0BE9EF]" />,
    INSTITUT_COSMETIQUE: <HeartHandshake className="w-5 h-5 text-[#FB8205]" />,
    SPA_MASSAGE: <Activity className="w-5 h-5 text-[#0BE9EF]" />,
    PHOTOGRAPHE: <Camera className="w-5 h-5 text-[#FB8205]" />,
    BRODERIE_IMPRESSION: <Palette className="w-5 h-5 text-[#0BE9EF]" />,
    GARAGE: <Wrench className="w-5 h-5 text-[#FB8205]" />,
    PHARMACIE: <ShieldCheck className="w-5 h-5 text-[#10D97F]" />,
  };

  return (
    <aside
      className={`h-[calc(100vh-4rem)] sticky top-16 bg-[#0A1428]/95 border-r border-white/5 transition-all duration-300 flex flex-col justify-between shrink-0 z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header with Module info */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#020919] border border-white/10 flex items-center justify-center shrink-0">
            {moduleIconMap[moduleCode] || <Building2 className="w-5 h-5 text-[#FB8205]" />}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider truncate">
                {moduleTitle}
              </h2>
              <p className="text-[11px] text-[#0BE9EF] font-medium truncate">{businessName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 text-left">
        {items.map((item) => {
          const isActive = activeItemId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none group ${
                isActive
                  ? 'bg-[#FB8205] text-white shadow-md shadow-[#FB8205]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!isCollapsed && item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-[#0BE9EF]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Collapse Toggle */}
      <div className="p-3 border-t border-white/5">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Réduire le menu</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
