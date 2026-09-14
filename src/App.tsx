import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, AppView } from './components/design-system/Navbar';
import { NotificationContainer } from './components/design-system/Notification';
import { AuthModal } from './components/auth/AuthModal';
import { AccountSecurityModal } from './components/auth/AccountSecurityModal';
import { NotificationCenterModal } from './components/notifications/NotificationCenterModal';
import { ClientDashboard } from './components/client/ClientDashboard';
import { FlowexaSearchExperience } from './components/search/FlowexaSearchExperience';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { GlobalProDashboard } from './components/pro/GlobalProDashboard';
import { EmployeeDashboard } from './components/pro/EmployeeDashboard';
import { ImmobilierDashboard } from './components/pro/ImmobilierDashboard';
import { GuestHouseDashboard } from './components/pro/GuestHouseDashboard';
import { ServiceDashboard } from './components/pro/ServiceDashboard';
import { ForbiddenAccessView } from './components/common/ForbiddenAccessView';
import { NotFoundView } from './components/common/NotFoundView';
import { BusinessModuleCode, UserProfile, ToastMessage, AuthViewMode, RoleType } from './types';
import { DEMO_USER, FLOWEXA_MODULES } from './data/mockData';
import { LayoutGrid, Layers, ArrowLeft } from 'lucide-react';
import { Button } from './components/design-system/Button';
import { authApi } from './services/authApi';

// Helpers de routage et de permissions
const pathToView = (path: string): AppView => {
  const cleanPath = path.toLowerCase().replace(/\/$/, '') || '/';
  if (cleanPath === '/' || cleanPath === '/search') return 'search';
  if (cleanPath === '/client') return 'client';
  if (cleanPath === '/pro') return 'pro';
  if (cleanPath === '/employee') return 'employee';
  if (cleanPath === '/superadmin' || cleanPath === '/admin') return 'superadmin';
  if (cleanPath === '/403' || cleanPath === '/forbidden') return 'forbidden';
  return 'not_found';
};

const viewToPath = (view: AppView): string => {
  switch (view) {
    case 'search':
      return '/search';
    case 'client':
      return '/client';
    case 'pro':
      return '/pro';
    case 'employee':
      return '/employee';
    case 'superadmin':
      return '/superadmin';
    case 'forbidden':
      return '/403';
    case 'not_found':
      return '/404';
    default:
      return '/';
  }
};

const isViewAllowedForUser = (view: AppView, user: UserProfile | null): boolean => {
  if (view === 'not_found' || view === 'forbidden') return true;
  if (!user) {
    return view === 'search' || view === 'client';
  }
  switch (user.role) {
    case 'SUPER_ADMIN':
      return true;
    case 'BUSINESS_OWNER':
    case 'MANAGER':
      return view === 'pro' || view === 'search' || view === 'client';
    case 'EMPLOYEE':
      return view === 'employee' || view === 'search' || view === 'client';
    case 'CLIENT':
    default:
      return view === 'client' || view === 'search';
  }
};

const getDefaultViewForRole = (role?: RoleType): AppView => {
  switch (role) {
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

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const view = pathToView(window.location.pathname);
      if (window.location.pathname !== '/' && window.location.pathname !== '') {
        return view;
      }
    }
    return 'client';
  });
  const [forbiddenTarget, setForbiddenTarget] = useState<string>('cet espace');
  const [activeModuleCode, setActiveModuleCode] = useState<BusinessModuleCode>('IMMOBILIER');
  const [proDisplayMode, setProDisplayMode] = useState<'GLOBAL' | 'MODULE_SPECIFIC'>('GLOBAL');

  // User Auth State - Default to null for clean multi-role testing, or restored via token
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Si un utilisateur est mémorisé en local, on le charge immédiatement
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('flowexa_auth_user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore
        }
      }
    }
    return DEMO_USER;
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<AuthViewMode>('LOGIN');

  // Notifications Modal & Realtime Unread Count (Sprint B30 + F30)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(2);

  // Navigation Guard & Route Synchronizer
  const navigateToView = useCallback((targetView: AppView, pushState = true) => {
    if (!isViewAllowedForUser(targetView, user)) {
      setForbiddenTarget(targetView);
      setCurrentView('forbidden');
      if (pushState && typeof window !== 'undefined') {
        window.history.pushState(null, '', viewToPath('forbidden'));
      }
      return;
    }

    setCurrentView(targetView);
    if (pushState && typeof window !== 'undefined') {
      const targetPath = viewToPath(targetView);
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }, [user]);

  // Synchronisation avec les boutons Précédent/Suivant du navigateur
  useEffect(() => {
    const handlePopState = () => {
      const viewFromPath = pathToView(window.location.pathname);
      navigateToView(viewFromPath, false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigateToView]);

  // Auto-vérification des permissions lors du changement de profil utilisateur
  useEffect(() => {
    if (!isViewAllowedForUser(currentView, user)) {
      const allowedDefault = getDefaultViewForRole(user?.role);
      navigateToView(allowedDefault, true);
    }
  }, [user, currentView, navigateToView]);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications/unread');
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.unreadCount === 'number') {
          setUnreadNotificationsCount(data.unreadCount);
        }
      }
    } catch {
      // safe fallback
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Auto-restore session from token
  useEffect(() => {
    authApi
      .getMe()
      .then((me) => {
        if (me) {
          setUser(me);
          if (me.activeBusinessModule) {
            setActiveModuleCode(me.activeBusinessModule);
          }
        }
      })
      .catch(() => {
        // use local state
      });
  }, []);

  // Toasts Notification Stack
  const [toasts, setToasts] = useState<ToastMessage[]>([
    {
      id: 'toast_welcome',
      type: 'info',
      title: 'Système Flowexa Actif',
      message: 'Plateforme multi-tenant Bénin connectée avec succès.',
    },
  ]);

  const showToast = (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info'
  ) => {
    const id = `t_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectModule = (code: BusinessModuleCode) => {
    setActiveModuleCode(code);
    setProDisplayMode('MODULE_SPECIFIC');
    navigateToView('pro');
    const mod = FLOWEXA_MODULES.find((m) => m.code === code);
    showToast('Module activé', `Espace métier : ${mod?.name || code}`, 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020919] text-white selection:bg-[#FB8205] selection:text-white antialiased">
      {/* Design System Notification Toast Stack */}
      <NotificationContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Global Navbar with Strict Role-Based Dynamic Navigation */}
      <Navbar
        currentView={currentView}
        onChangeView={(view) => navigateToView(view)}
        activeModule={activeModuleCode}
        onSelectModule={handleSelectModule}
        user={user}
        onOpenAuth={() => {
          setAuthInitialMode('LOGIN');
          setIsAuthOpen(true);
        }}
        onOpenAccount={() => setIsAccountModalOpen(true)}
        onLogout={async () => {
          await authApi.logout(user?.id);
          setUser(null);
          showToast('Déconnexion effectuée', 'Vous naviguez désormais en mode invité.', 'info');
          navigateToView('search');
        }}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => {
          setIsNotificationModalOpen(true);
        }}
      />

      {/* Pro Mode Sub-navigation Bar: Switch between Cockpit Global vs Module Dédié */}
      {currentView === 'pro' && (user?.role === 'BUSINESS_OWNER' || user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN') && (
        <div className="bg-[#0A1428]/80 border-b border-white/5 px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProDisplayMode('GLOBAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                proDisplayMode === 'GLOBAL'
                  ? 'bg-[#FB8205] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cockpit Global (Aujourd'hui)</span>
            </button>

            <button
              onClick={() => setProDisplayMode('MODULE_SPECIFIC')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                proDisplayMode === 'MODULE_SPECIFIC'
                  ? 'bg-[#0BE9EF] text-[#020919] font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>
                Interface Dédiée : {FLOWEXA_MODULES.find((m) => m.code === activeModuleCode)?.name}
              </span>
            </button>
          </div>

          <span className="hidden sm:inline text-gray-500 font-mono text-[11px]">
            Établissement : {user?.businessName || user?.tenantName || 'Entreprise Flowexa'}
          </span>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col w-full">
        {/* VIEW 1: FLOWEXA SEARCH EXPERIENCE (PUBLIC & RECHERCHE GLOBALE) */}
        {currentView === 'search' && (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <FlowexaSearchExperience
              onOpenAuth={() => {
                setAuthInitialMode('LOGIN');
                setIsAuthOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 2: CLIENT DASHBOARD (ESPACE CLIENT DÉDIÉ : EXPLORER, DEMANDES, RÉSERVATIONS, MESSAGES, FAVORIS, AVIS) */}
        {currentView === 'client' && (
          <div className="w-full flex-1 flex flex-col">
            <ClientDashboard
              user={user}
              onShowToast={showToast}
              onNavigateToProModule={handleSelectModule}
            />
          </div>
        )}

        {/* VIEW 3: EMPLOYEE DASHBOARD (ESPACE COLLABORATEUR DÉDIÉ) */}
        {currentView === 'employee' && user && (
          <div className="w-full flex-1 flex flex-col">
            <EmployeeDashboard
              user={user}
              onShowToast={showToast}
              onOpenAccount={() => setIsAccountModalOpen(true)}
            />
          </div>
        )}

        {/* VIEW 5: SUPER ADMIN CONSOLE (SUPER_ADMIN ONLY) */}
        {currentView === 'superadmin' && user?.role === 'SUPER_ADMIN' && (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <SuperAdminDashboard />
          </div>
        )}

        {/* VIEW 6: PRO DASHBOARD (BUSINESS_OWNER & MANAGER) */}
        {currentView === 'pro' && (user?.role === 'BUSINESS_OWNER' || user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN') && (
          <div className="w-full flex-1 flex flex-col">
            {proDisplayMode === 'GLOBAL' && (
              <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                <GlobalProDashboard
                  user={user || DEMO_USER}
                  activeModuleCode={activeModuleCode}
                  onSelectModule={handleSelectModule}
                  onOpenModuleSpecificView={(code) => {
                    setActiveModuleCode(code);
                    setProDisplayMode('MODULE_SPECIFIC');
                  }}
                  onShowToast={showToast}
                />
              </div>
            )}

            {proDisplayMode === 'MODULE_SPECIFIC' && (
              <div className="w-full flex-1 flex flex-col">
                {activeModuleCode === 'IMMOBILIER' && (
                  <ImmobilierDashboard onShowToast={showToast} />
                )}

                {activeModuleCode === 'GUEST_HOUSE' && (
                  <GuestHouseDashboard onShowToast={showToast} />
                )}

                {![ 'IMMOBILIER', 'GUEST_HOUSE' ].includes(activeModuleCode) && (
                  <ServiceDashboard
                    moduleCode={activeModuleCode}
                    onShowToast={showToast}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 7: ACCÈS REFUSÉ (403 FORBIDDEN) */}
        {currentView === 'forbidden' && (
          <ForbiddenAccessView
            user={user}
            targetSpaceName={forbiddenTarget}
            onReturnToAllowedSpace={() => navigateToView(getDefaultViewForRole(user?.role))}
            onOpenAuth={() => {
              setAuthInitialMode('LOGIN');
              setIsAuthOpen(true);
            }}
          />
        )}

        {/* VIEW 8: PAGE INTROUVABLE (404 NOT FOUND) */}
        {currentView === 'not_found' && (
          <NotFoundView
            user={user}
            onReturnToAllowedSpace={() => navigateToView(getDefaultViewForRole(user?.role))}
          />
        )}
      </div>

      {/* Authentication Modal (SPRINT B24 + F02) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authInitialMode}
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          const nextView = getDefaultViewForRole(loggedUser.role);
          navigateToView(nextView);
          if (loggedUser.activeBusinessModule) {
            setActiveModuleCode(loggedUser.activeBusinessModule);
          }
        }}
        onShowToast={showToast}
      />

      {/* Account Profile & Security Modal (SPRINT B24) */}
      {user && (
        <AccountSecurityModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          user={user}
          onUserUpdated={(updatedUser) => {
            setUser(updatedUser);
            if (updatedUser.activeBusinessModule) {
              setActiveModuleCode(updatedUser.activeBusinessModule);
            }
          }}
          onLogout={async () => {
            await authApi.logout(user?.id);
            setUser(null);
            showToast('Déconnexion effectuée', 'Vous naviguez désormais en mode invité.', 'info');
            navigateToView('search');
          }}
          onShowToast={showToast}
        />
      )}

      {/* Centre de Notifications & Alertes (SPRINT B30 + F30) */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        userRole={user?.role}
        userId={user?.id}
        businessId={user?.businessId}
        onNavigateTo={(viewUrl) => {
          if (viewUrl.startsWith('#request')) {
            navigateToView('client');
          } else if (viewUrl.startsWith('#conversations')) {
            navigateToView(user?.role === 'EMPLOYEE' ? 'employee' : 'client');
          } else if (viewUrl.startsWith('#appointments') || viewUrl.startsWith('#bookings')) {
            navigateToView(user?.role === 'BUSINESS_OWNER' || user?.role === 'MANAGER' ? 'pro' : user?.role === 'EMPLOYEE' ? 'employee' : 'client');
          } else if (viewUrl.startsWith('#marketplace')) {
            navigateToView(user?.role === 'BUSINESS_OWNER' || user?.role === 'MANAGER' ? 'pro' : 'client');
          }
        }}
        onNotificationReadStateChanged={fetchUnreadNotifications}
      />
    </div>
  );
}


