import React from 'react';
import {
  Bell,
  Search,
  LayoutDashboard,
  Building2,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile, BusinessModuleCode } from '../../types';
import { FLOWEXA_MODULES } from '../../data/mockData';
import { Dropdown } from './Dropdown';
import { Button } from './Button';

export type AppView =
  | 'search'
  | 'client'
  | 'pro'
  | 'employee'
  | 'superadmin'
  | 'forbidden'
  | 'not_found';

export interface NavbarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  activeModule: BusinessModuleCode;
  onSelectModule: (code: BusinessModuleCode) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenAccount?: () => void;
  onLogout: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  activeModule,
  onSelectModule,
  user,
  onOpenAuth,
  onOpenAccount,
  onLogout,
  unreadNotificationsCount = 2,
  onOpenNotifications,
}) => {
  const currentModuleData = FLOWEXA_MODULES.find((m) => m.code === activeModule) || FLOWEXA_MODULES[0];

  const moduleMenuItems = FLOWEXA_MODULES.map((mod) => ({
    id: mod.code,
    label: mod.name,
    badge: mod.number,
    onClick: () => onSelectModule(mod.code),
  }));

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Administrateur';
      case 'BUSINESS_OWNER':
        return 'Gérant Entreprise';
      case 'MANAGER':
        return 'Manager';
      case 'EMPLOYEE':
        return 'Employé';
      default:
        return 'Client Flowexa';
    }
  };

  const getHomeViewForRole = (): AppView => {
    if (!user) return 'search';
    switch (user.role) {
      case 'SUPER_ADMIN':
        return 'superadmin';
      case 'BUSINESS_OWNER':
      case 'MANAGER':
        return 'pro';
      case 'EMPLOYEE':
        return 'employee';
      case 'CLIENT':
      default:
        return 'client';
    }
  };

  const userMenuItems = user
    ? [
        {
          id: 'account',
          label: 'Mon Profil & Sécurité',
          icon: <UserIcon className="w-3.5 h-3.5 text-[#0BE9EF]" />,
          onClick: () => onOpenAccount?.(),
        },
        {
          id: 'role-info',
          label: `${getRoleLabel(user.role)}`,
          icon: <ShieldAlert className="w-3.5 h-3.5 text-[#FB8205]" />,
          onClick: () => onOpenAccount?.(),
        },
        {
          id: 'logout',
          label: 'Se déconnecter',
          icon: <LogOut className="w-3.5 h-3.5" />,
          danger: true,
          onClick: onLogout,
        },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#020919]/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      {/* Brand Logo & Context */}
      <div className="flex items-center gap-6">
        <div
          onClick={() => onChangeView(getHomeViewForRole())}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FB8205] to-[#E06900] flex items-center justify-center font-black text-white text-base shadow-lg shadow-[#FB8205]/20 group-hover:scale-105 transition-transform">
            FX
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-base tracking-wider text-white flex items-center gap-1.5">
              FLOWEXA
              <span className="w-1.5 h-1.5 rounded-full bg-[#0BE9EF] animate-pulse" />
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#0BE9EF] font-semibold">
              {user?.role === 'SUPER_ADMIN'
                ? 'Super Admin'
                : user?.role === 'BUSINESS_OWNER'
                ? 'Espace Entreprise'
                : user?.role === 'MANAGER'
                ? 'Espace Manager'
                : user?.role === 'EMPLOYEE'
                ? 'Espace Collaborateur'
                : 'Bénin Multi-Tenant'}
            </span>
          </div>
        </div>

        {/* Dynamic Navigation Tabs STRICTLY based on user.role */}
        <nav className="hidden lg:flex items-center bg-[#0A1428] p-1 rounded-xl border border-white/5">
          {/* 1. Visiteur non-connecté */}
          {!user && (
            <button
              onClick={() => onChangeView('search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'search'
                  ? 'bg-[#FB8205] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Explorer les offres</span>
            </button>
          )}

          {/* 2. Utilisateur CLIENT : strictement restreint à la recherche & son espace client */}
          {user?.role === 'CLIENT' && (
            <>
              <button
                onClick={() => onChangeView('search')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'search'
                    ? 'bg-[#FB8205] text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Recherche Flowexa</span>
              </button>
              <button
                onClick={() => onChangeView('client')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'client'
                    ? 'bg-[#0BE9EF] text-[#020919] shadow-md font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Mon Espace Client</span>
              </button>
            </>
          )}

          {/* 3. BUSINESS_OWNER : Cockpit de son entreprise */}
          {user?.role === 'BUSINESS_OWNER' && (
            <button
              onClick={() => onChangeView('pro')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'pro'
                  ? 'bg-[#0BE9EF] text-[#020919] shadow-md font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Cockpit Entreprise</span>
            </button>
          )}

          {/* 4. MANAGER : Cockpit opérationnel */}
          {user?.role === 'MANAGER' && (
            <button
              onClick={() => onChangeView('pro')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'pro'
                  ? 'bg-[#10D97F] text-[#020919] shadow-md font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Cockpit Opérationnel</span>
            </button>
          )}

          {/* 5. EMPLOYEE : Tâches et missions */}
          {user?.role === 'EMPLOYEE' && (
            <button
              onClick={() => onChangeView('employee')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'employee'
                  ? 'bg-[#FB8205] text-white shadow-md font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Mes Tâches & Opérations</span>
            </button>
          )}

          {/* 6. SUPER_ADMIN : Console d'administration globale */}
          {user?.role === 'SUPER_ADMIN' && (
            <>
              <button
                onClick={() => onChangeView('superadmin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'superadmin'
                    ? 'bg-purple-600 text-white shadow-md font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-white" />
                <span>Console Super Admin</span>
              </button>
              <button
                onClick={() => onChangeView('search')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'search'
                    ? 'bg-white/20 text-white font-bold shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Recherche Plateforme</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Module selector strictly for BUSINESS_OWNER and MANAGER in pro view */}
        {currentView === 'pro' && (user?.role === 'BUSINESS_OWNER' || user?.role === 'MANAGER') && (
          <Dropdown
            align="right"
            items={moduleMenuItems}
            trigger={
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A1428] border border-white/10 hover:border-[#0BE9EF]/40 text-xs font-semibold text-white transition-colors cursor-pointer">
                <Layers className="w-3.5 h-3.5 text-[#0BE9EF]" />
                <span className="hidden md:inline text-gray-400 font-normal">Métier :</span>
                <span className="text-[#0BE9EF]">{currentModuleData.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
            }
          />
        )}

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-[#0A1428] border border-white/5 hover:border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FB8205] text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* User Account / Login Button */}
        {user ? (
          <Dropdown
            align="right"
            items={userMenuItems}
            trigger={
              <div className="flex items-center gap-2.5 pl-2 py-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-[#FB8205]/20 border border-[#FB8205]/40 text-[#FB8205] font-bold text-xs flex items-center justify-center">
                  {user.initials}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
                  <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                    {user.tenantName}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
            }
          />
        ) : (
          <Button size="sm" variant="primary" onClick={onOpenAuth}>
            Connexion
          </Button>
        )}
      </div>
    </header>
  );
};
