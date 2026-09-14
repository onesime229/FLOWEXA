import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Sparkles,
  MapPin,
  Calendar,
  Phone,
  MessageCircle,
  Heart,
  Bell,
  ArrowRight,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle2,
  Bookmark,
  Share2,
  X,
  Inbox,
  Clock,
  Check,
  Send,
  AlertCircle,
  FileText,
  Mail,
  Star,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Flame,
  CreditCard,
  Mic,
  Home,
  Bed,
  Scissors,
  Wrench,
  ShoppingBag,
  ChevronRight,
  Layers,
  Map as MapIcon,
  Navigation,
  LogOut,
  Camera,
  Palette,
  HeartHandshake,
  Activity,
  User as UserIcon,
  Volume2,
  Globe,
  Lock,
} from 'lucide-react';
import {
  UserProfile,
  BusinessModuleCode,
  SearchResultItem,
  FlowexaRequestItem,
  FlowexaNotificationItem,
  FavoriteItem,
  ReviewItem,
} from '../../types';
import {
  CLIENT_MODULES,
  CLIENT_ESTABLISHMENTS,
  ON_DUTY_PHARMACIES,
  ClientEstablishment,
} from './clientData';
import { parseIntentFromQuery, DetectedIntent } from './intentEngine';
import {
  CitySheet,
  SortSheet,
  FilterSheet,
  AuthGateSheet,
  VocalSearchModal,
} from './ClientModals';
import { ClientEstablishmentView } from './ClientEstablishmentView';
import { ClientBookingView } from './ClientBookingView';
import { ClientActivityView } from './ClientActivityView';
import { ClientMessagesView } from './ClientMessagesView';
import { ClientMarketplaceView } from './ClientMarketplaceView';
import { ClientReviewsModalView } from './ClientReviewsModalView';
import { ClientInteractiveMap } from './ClientInteractiveMap';
import { ClientPassModal } from './ClientPassModal';
import { ClientSosModal } from './ClientSosModal';
import { flowexaApi } from '../../services/api';

export interface ClientDashboardProps {
  user?: UserProfile | null;
  initialTab?:
    | 'HOME'
    | 'SEARCH'
    | 'INTENT'
    | 'RESULTS'
    | 'ESTABLISHMENT_DETAIL'
    | 'BOOKING'
    | 'ACTIVITY'
    | 'MESSAGES'
    | 'MARKETPLACE'
    | 'NOTIFICATIONS'
    | 'PHARMACIES'
    | 'PROFILE';
  onShowToast: (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error'
  ) => void;
  onNavigateToProModule?: (moduleCode: BusinessModuleCode) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user,
  initialTab = 'HOME',
  onShowToast,
  onNavigateToProModule,
}) => {
  // Navigation & Screen state
  const [activeScreen, setActiveScreen] = useState<
    | 'HOME'
    | 'SEARCH'
    | 'INTENT'
    | 'RESULTS'
    | 'ESTABLISHMENT_DETAIL'
    | 'BOOKING'
    | 'ACTIVITY'
    | 'MESSAGES'
    | 'MARKETPLACE'
    | 'NOTIFICATIONS'
    | 'PHARMACIES'
    | 'PROFILE'
  >(initialTab);

  const [activeNavTab, setActiveNavTab] = useState<'home' | 'search' | 'activity' | 'msgs' | 'profile'>('home');

  // Query & Intent
  const [searchQuery, setSearchQuery] = useState('');
  const [detectedIntent, setDetectedIntent] = useState<DetectedIntent | null>(null);

  // Selected establishment & booking details
  const [selectedEstablishment, setSelectedEstablishment] = useState<ClientEstablishment>(CLIENT_ESTABLISHMENTS[0]);
  const [bookingPreselection, setBookingPreselection] = useState<{
    title?: string;
    price?: number;
  }>({});

  // Preferences & Filters
  const [currentCity, setCurrentCity] = useState('Cotonou');
  const [currentSort, setCurrentSort] = useState('Pertinence');
  const [resultsViewMode, setResultsViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    'biz-palma': true,
    'biz-haie-vive': true,
  });

  // Modals & Sheets
  const [isCitySheetOpen, setIsCitySheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false);
  const [authGateActionName, setAuthGateActionName] = useState('effectuer cette action');
  const [pendingAuthCallback, setPendingAuthCallback] = useState<(() => void) | null>(null);
  const [isVocalModalOpen, setIsVocalModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [accentMode, setAccentMode] = useState<'electric' | 'deep'>('electric');

  // Real backend requests & notifications
  const [clientRequests, setClientRequests] = useState<FlowexaRequestItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(2);

  // Custom Request Form
  const [newRequestNeed, setNewRequestNeed] = useState('');
  const [newRequestBudget, setNewRequestBudget] = useState('');
  const [newRequestZone, setNewRequestZone] = useState('Cotonou');

  // Accent Switcher logic
  const handleSetAccent = (mode: 'electric' | 'deep') => {
    setAccentMode(mode);
    if (typeof document !== 'undefined') {
      if (mode === 'deep') {
        document.documentElement.setAttribute('data-accent', 'deep');
      } else {
        document.documentElement.removeAttribute('data-accent');
      }
    }
  };

  // Fetch real data from server API
  const fetchBackendData = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/requests', {
        headers: {
          'x-user-role': 'CLIENT',
          'x-client-id': user?.id || 'client-test-1',
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setClientRequests(json.data);
        }
      }
    } catch {
      // Offline or preview fallback
    }
  }, [user]);

  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  // Auth gate check helper
  const requireAuth = (actionCallback: () => void, actionLabel: string = 'continuer') => {
    if (user) {
      actionCallback();
    } else {
      setAuthGateActionName(actionLabel);
      setPendingAuthCallback(() => actionCallback);
      setIsAuthGateOpen(true);
    }
  };

  // Search submission
  const handlePerformSearch = (queryText: string) => {
    if (!queryText.trim()) return;
    setSearchQuery(queryText);
    const intent = parseIntentFromQuery(queryText);
    setDetectedIntent(intent);
    setActiveScreen('INTENT');
  };

  const handleToggleFavorite = (bizId: string, name: string) => {
    requireAuth(() => {
      const isFav = !favorites[bizId];
      setFavorites((prev) => ({ ...prev, [bizId]: isFav }));
      onShowToast(
        isFav ? 'Ajouté aux favoris' : 'Retiré des favoris',
        `« ${name} » a été mis à jour dans vos favoris.`,
        'info'
      );
    });
  };

  // Creation of real request
  const handleSubmitNewRequest = async () => {
    try {
      const res = await fetch('/api/v1/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'CLIENT',
          'x-client-id': user?.id || 'client-test-1',
        },
        body: JSON.stringify({
          clientPhone: user?.phone || '0154100617',
          clientName: user?.name || 'Client Flowexa',
          businessId: 'biz-haie-vive',
          businessName: 'Immo Bénin Services',
          moduleCode: 'IMMOBILIER',
          interactionType: 'DEMANDE',
          clientNotes: `${newRequestNeed} · Budget: ${newRequestBudget} · Zone: ${newRequestZone}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast('Demande envoyée !', 'Flowexa a transmis votre demande aux agences compétentes.', 'success');
        setIsNewRequestModalOpen(false);
        fetchBackendData();
        setActiveScreen('ACTIVITY');
      } else {
        onShowToast('Demande enregistrée', 'Votre demande est prise en compte.', 'success');
        setIsNewRequestModalOpen(false);
      }
    } catch {
      onShowToast('Demande enregistrée', 'Votre demande est en cours de transmission.', 'success');
      setIsNewRequestModalOpen(false);
    }
  };

  return (
    <div className="flowexa-client-wrapper">
      {/* DESKTOP VIEW: Left Navigation Sidebar */}
      <aside className="dsknav">
        <div
          className="dbrand cursor-pointer"
          onClick={() => {
            setActiveScreen('HOME');
            setActiveNavTab('home');
          }}
        >
          <svg viewBox="0 0 48 48" className="w-6 h-6 flex-shrink-0">
            <path d="M13 37 L24 11 L29.5 24 L25.5 24 L32 37 Z" fill="#FB8205" />
            <path d="M24 11 L29.5 24 L25.5 24 L28.5 30.5 L35 30.5 Z" fill="#0794A0" opacity="0.95" />
          </svg>
          <b>FLOW</b><span>EXA</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <button
            className={`dn ${activeNavTab === 'home' && activeScreen === 'HOME' ? 'on' : ''}`}
            onClick={() => {
              setActiveNavTab('home');
              setActiveScreen('HOME');
            }}
          >
            <Home className="ic" />
            <span>Accueil</span>
          </button>

          <button
            className={`dn ${activeNavTab === 'search' || activeScreen === 'SEARCH' || activeScreen === 'RESULTS' || activeScreen === 'INTENT' ? 'on' : ''}`}
            onClick={() => {
              setActiveNavTab('search');
              setActiveScreen('SEARCH');
            }}
          >
            <Search className="ic" />
            <span>Recherche</span>
          </button>

          <button
            className={`dn ${activeNavTab === 'activity' || activeScreen === 'ACTIVITY' ? 'on' : ''}`}
            onClick={() => {
              setActiveNavTab('activity');
              setActiveScreen('ACTIVITY');
            }}
          >
            <Layers className="ic" />
            <span>Activité</span>
          </button>

          <button
            className={`dn ${activeNavTab === 'msgs' || activeScreen === 'MESSAGES' ? 'on' : ''}`}
            onClick={() => {
              setActiveNavTab('msgs');
              setActiveScreen('MESSAGES');
            }}
          >
            <MessageCircle className="ic" />
            <span>Messages</span>
          </button>

          <button
            className={`dn ${activeScreen === 'MARKETPLACE' ? 'on' : ''}`}
            onClick={() => {
              setActiveScreen('MARKETPLACE');
            }}
          >
            <ShoppingBag className="ic" />
            <span>Marketplace</span>
          </button>

          <button
            className={`dn ${activeScreen === 'PHARMACIES' ? 'on' : ''}`}
            onClick={() => {
              setActiveScreen('PHARMACIES');
            }}
          >
            <ShieldCheck className="ic text-[#10D97F]" />
            <span>Pharmacies 24/7</span>
          </button>

          <button
            className="dn"
            onClick={() => setIsPassModalOpen(true)}
          >
            <Sparkles className="ic text-[#FB8205]" />
            <span>Pass Flowexa</span>
          </button>

          <button
            className="dn text-[#C0392B]"
            onClick={() => setIsSosOpen(true)}
          >
            <ShieldAlert className="ic text-[#C0392B]" />
            <span>SOS Urgence Bénin</span>
          </button>

          <button
            className={`dn ${activeNavTab === 'profile' || activeScreen === 'PROFILE' ? 'on' : ''}`}
            onClick={() => {
              setActiveNavTab('profile');
              setActiveScreen('PROFILE');
            }}
          >
            <UserIcon className="ic" />
            <span>Mon Profil</span>
          </button>
        </nav>

        {/* Accent Switcher in Sidebar */}
        <div className="pt-4 border-t border-[#E8EDF3] mt-2 mb-2">
          <div className="text-[11px] font-bold text-[#5C6B80] px-2 mb-2 flex items-center justify-between">
            <span>Accent visuel</span>
            <div className="accpick">
              <button
                className={`acc a1 ${accentMode === 'electric' ? 'on' : ''}`}
                title="Cyan Électrique"
                onClick={() => handleSetAccent('electric')}
              />
              <button
                className={`acc a2 ${accentMode === 'deep' ? 'on' : ''}`}
                title="Bleu Canard Deep"
                onClick={() => handleSetAccent('deep')}
              />
            </div>
          </div>
        </div>

        {onNavigateToProModule && (
          <button
            onClick={() => onNavigateToProModule('IMMOBILIER')}
            className="dn bg-[#FFF2E1] text-[#FB8205] hover:bg-[#ffe6c4] font-bold"
          >
            <Building2 className="ic" />
            <span>Espace Pro & Métiers</span>
          </button>
        )}

        <div className="dfoot">
          Espace client certifié Flowexa Bénin. Multi-tenant multi-métiers connecté aux API temps réel.
        </div>
      </aside>

      {/* CENTER PHONE VIEWPORT */}
      <main className="phone">
        {/* SOS OVERLAY */}
        <ClientSosModal
          isOpen={isSosOpen}
          onClose={() => setIsSosOpen(false)}
          onOpenPharmacies={() => {
            setActiveScreen('PHARMACIES');
          }}
        />

        {/* FLOWEXA PASS MODAL */}
        <ClientPassModal
          isOpen={isPassModalOpen}
          onClose={() => setIsPassModalOpen(false)}
          user={user}
        />

        {/* SCREEN 1: HOME */}
        <div className={`screen ${activeScreen === 'HOME' ? 'on' : ''}`}>
          <div className="scroll">
            <div className="heroband">
              <div className="topbar">
                <div
                  className="brand cursor-pointer"
                  onClick={() => {
                    setActiveScreen('HOME');
                    setActiveNavTab('home');
                  }}
                >
                  <svg viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0">
                    <path d="M13 37 L24 11 L29.5 24 L25.5 24 L32 37 Z" fill="#FB8205" />
                    <path d="M24 11 L29.5 24 L25.5 24 L28.5 30.5 L35 30.5 Z" fill="#FFFFFF" opacity="0.95" />
                  </svg>
                  <b>FLOW</b><span>EXA</span>
                </div>

                <div className="accpick">
                  <button
                    className={`acc a1 ${accentMode === 'electric' ? 'on' : ''}`}
                    onClick={() => handleSetAccent('electric')}
                  />
                  <button
                    className={`acc a2 ${accentMode === 'deep' ? 'on' : ''}`}
                    onClick={() => handleSetAccent('deep')}
                  />
                </div>

                <button className="chip" onClick={() => setIsCitySheetOpen(true)}>
                  <MapPin className="w-3.5 h-3.5 text-[#0BE9EF]" />
                  <span>{currentCity}</span>
                </button>

                <button className="iconbtn relative" onClick={() => setActiveScreen('NOTIFICATIONS')}>
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FB8205] ring-2 ring-[#0C1322]" />
                  )}
                </button>

                <button
                  className="iconbtn"
                  onClick={() => {
                    setActiveNavTab('profile');
                    setActiveScreen('PROFILE');
                  }}
                >
                  {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                </button>
              </div>

              <div className="hero">
                <div className="hello">{user ? `Bonjour, ${user.name.split(' ')[0]}` : 'Bonjour'}</div>
                <h2>De quoi avez-vous<br />besoin ?</h2>
              </div>
            </div>

            {/* Search Box Trigger */}
            <div
              className="searchbox"
              onClick={() => {
                setActiveNavTab('search');
                setActiveScreen('SEARCH');
              }}
            >
              <Search className="w-5 h-5 text-[#97A3B4]" />
              <span className="ph">Rechercher un service, bien, artisan…</span>
              <button
                className="micbig"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVocalModalOpen(true);
                }}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>

            {/* Autour de moi */}
            <button
              className="around"
              onClick={() => {
                setResultsViewMode('LIST');
                setActiveScreen('RESULTS');
              }}
            >
              <MapPin className="w-4 h-4 text-[#0794A0]" />
              <span>Autour de moi</span>
              <span className="text-xs font-bold text-[#0794A0]/75">· 5 km</span>
              <span className="arr">›</span>
            </button>

            {/* SOS Urgences Bénin Pill */}
            <div className="sospill" onClick={() => setIsSosOpen(true)}>
              <ShieldAlert className="w-5 h-5 text-[#C0392B] flex-shrink-0" />
              <div>
                <div className="pt2">SOS Urgence Bénin</div>
                <div className="pm2">SAMU 15 · Police 117 · Pompiers 118 · Pharmacies de garde</div>
              </div>
              <span className="ml-auto text-xs font-bold text-[#C0392B]">Ouvrir ›</span>
            </div>

            {/* Suggestion Chips */}
            <div className="chiprow">
              {['chambre cotonou', 'pharmacie de garde', 'tresses demain', 'vidange express'].map((s) => (
                <button key={s} className="chip" onClick={() => handlePerformSearch(s)}>
                  {s}
                </button>
              ))}
            </div>

            {/* Flowexa Pass Card */}
            <button className="passcard" onClick={() => setIsPassModalOpen(true)}>
              <div className="pb2">
                <b>FLOW</b><span>EXA PASS</span>
                <span className="lvl">Niveau Silver</span>
              </div>
              <div className="pn">Club Privilège Bénin</div>
              <div className="pm3">1 450 XP cumulés · -15% chez 12 partenaires certifiés</div>
              <div className="passtrack">
                <i className="f"></i>
                <i className="f"></i>
                <i className="f"></i>
                <i></i>
                <i></i>
              </div>
              <div className="passfoot">
                <span className="pf1">Prochain palier : Gold (2 000 XP)</span>
                <span className="pf2">Détails ›</span>
              </div>
            </button>

            {/* Login Hint or Active Activity */}
            {!user ? (
              <div className="loginhint">
                <div className="lh">
                  <div className="t">Compte Visiteur Flowexa</div>
                  <div className="m">
                    Connectez-vous pour suivre vos réservations, devis et discuter en direct avec les entreprises.
                  </div>
                </div>
                <button
                  className="b"
                  onClick={() => {
                    requireAuth(() => setActiveScreen('ACTIVITY'), 'consulter vos activités');
                  }}
                >
                  Se connecter
                </button>
              </div>
            ) : (
              <div className="pad">
                <button
                  onClick={() => {
                    setActiveNavTab('activity');
                    setActiveScreen('ACTIVITY');
                  }}
                  className="w-full p-4 rounded-2xl bg-white border border-[#E8EDF3] shadow-xs flex items-center justify-between text-left hover:border-[#0BE9EF] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E1FBFD] text-[#0794A0] flex items-center justify-center font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#111827]">Suivi de vos commandes</div>
                      <div className="text-[11px] text-[#5C6B80]">
                        {clientRequests.length > 0
                          ? `${clientRequests.length} demande(s) en cours`
                          : 'Résidence Palma · samedi 18:00'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#5C6B80]">›</span>
                </button>
              </div>
            )}

            {/* 10 Métiers Flowexa */}
            <div className="h2 pad mt-2">Les 10 Métiers Flowexa</div>
            <div className="modgrid">
              {CLIENT_MODULES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    const found = CLIENT_ESTABLISHMENTS.find((e) => e.moduleCode === m.code);
                    if (found) {
                      setSelectedEstablishment(found);
                      setActiveScreen('ESTABLISHMENT_DETAIL');
                    } else {
                      handlePerformSearch(m.name);
                    }
                  }}
                  className="modtile"
                >
                  <div className="mi" style={{ backgroundColor: m.bg }}>
                    {m.id === 'immo' && <Home className="w-5 h-5 text-[#E06900]" />}
                    {m.id === 'guest' && <Bed className="w-5 h-5 text-[#0794A0]" />}
                    {m.id === 'coiffure' && <Scissors className="w-5 h-5 text-[#D946EF]" />}
                    {m.id === 'barbier' && <Sparkles className="w-5 h-5 text-[#0794A0]" />}
                    {m.id === 'institut' && <HeartHandshake className="w-5 h-5 text-[#FB8205]" />}
                    {m.id === 'spa' && <Activity className="w-5 h-5 text-[#EC4899]" />}
                    {m.id === 'photographe' && <Camera className="w-5 h-5 text-[#FB8205]" />}
                    {m.id === 'broderie' && <Palette className="w-5 h-5 text-[#0794A0]" />}
                    {m.id === 'garage' && <Wrench className="w-5 h-5 text-[#EA580C]" />}
                    {m.id === 'pharmacie' && <ShieldCheck className="w-5 h-5 text-[#10D97F]" />}
                  </div>
                  <div>
                    <div className="mt">{m.short}</div>
                    <div className="md">{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Établissements & Offres Vérifiées */}
            <div className="h2 pad mt-5 flex items-center justify-between">
              <span>Près de vous à {currentCity}</span>
              <button
                onClick={() => {
                  setResultsViewMode('MAP');
                  setActiveScreen('RESULTS');
                }}
                className="text-xs font-extrabold text-[#E06900] hover:underline"
              >
                Carte interactive ›
              </button>
            </div>

            <div className="hrow">
              {CLIENT_ESTABLISHMENTS.map((biz) => (
                <div
                  key={biz.id}
                  onClick={() => {
                    setSelectedEstablishment(biz);
                    setActiveScreen('ESTABLISHMENT_DETAIL');
                  }}
                  className="sugcard"
                >
                  <img src={biz.coverImage} alt={biz.name} />
                  <div className="in">
                    <div className="t truncate">{biz.name}</div>
                    <div className="avail">
                      <span className="w-2 h-2 rounded-full bg-[#10D97F]" />
                      <span>{biz.badgeStatus}</span>
                    </div>
                    <div className="goact">
                      {biz.priceStartingAt.toLocaleString('fr-FR')} FCFA · {biz.bookingType === 'visite' ? 'Visiter ›' : 'Réserver ›'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SCREEN 2: SEARCH */}
        <div className={`screen ${activeScreen === 'SEARCH' ? 'on' : ''}`}>
          <div className="topbar">
            <button className="iconbtn" onClick={() => setActiveScreen('HOME')}>
              <X className="w-5 h-5" />
            </button>
            <h1>Rechercher</h1>
            <button className="iconbtn" onClick={() => setIsVocalModalOpen(true)}>
              <Mic className="w-5 h-5 text-[#0794A0]" />
            </button>
          </div>

          <div className="scroll">
            <div className="bigsearch">
              <Search className="w-5 h-5 text-[#FB8205] flex-shrink-0" />
              <input
                type="text"
                placeholder="Que recherchez-vous aujourd'hui ?"
                value={searchQuery}
                autoFocus
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePerformSearch(searchQuery);
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-200"
                >
                  ✕
                </button>
              )}
            </div>

            {searchQuery.length > 2 && (
              <div className="livesense on" onClick={() => handlePerformSearch(searchQuery)}>
                <div className="ld"></div>
                <div>
                  <div className="lt">Intention détectée</div>
                  <div className="lm">Rechercher « {searchQuery} » à {currentCity}</div>
                </div>
                <span className="ml-auto text-xs font-bold text-[#0794A0]">Voir ›</span>
              </div>
            )}

            <div className="pad mt-4">
              <div className="text-xs font-extrabold uppercase text-[#5C6B80] tracking-wider mb-2">
                Recherches fréquentes au Bénin
              </div>
              <div className="divide-y divide-[#E8EDF3]">
                {[
                  'Chambre meublée climatisée Cotonou',
                  'Coiffure tresses Haie Vive',
                  'Pharmacie de garde nuit',
                  'Vidange moteur et révision auto Ganhi',
                  'Shooting photo portrait en studio',
                  'Broderie et flocage t-shirts Akpakpa',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handlePerformSearch(q)}
                    className="listrow"
                  >
                    <Clock className="w-4 h-4 text-[#97A3B4] flex-shrink-0" />
                    <span className="flex-1">{q}</span>
                    <ArrowRight className="w-4 h-4 text-[#C3CCD9]" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SCREEN 3: INTENT SYNTHESIS */}
        <div className={`screen ${activeScreen === 'INTENT' ? 'on' : ''}`}>
          <div className="topbar">
            <button className="iconbtn" onClick={() => setActiveScreen('SEARCH')}>
              <X className="w-5 h-5" />
            </button>
            <h1>Intention Détectée</h1>
            <div className="w-9" />
          </div>

          <div className="scroll pad flex flex-col justify-between">
            {detectedIntent && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-3xl border border-[#E8EDF3] shadow-sm">
                  <div className="text-[11px] font-extrabold tracking-wider text-[#97A3B4] uppercase">
                    Flowexa IA a analysé votre demande :
                  </div>
                  <h2 className="text-xl font-black text-[#111827] mt-1 font-disp">
                    {detectedIntent.title}
                  </h2>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {detectedIntent.chips.map((chip, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#E1FBFD] text-[#0794A0] flex items-center gap-1.5"
                      >
                        <span>{chip.label}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-[#5C6B80] font-medium px-2">
                  Nos algorithmes ont localisé les professionnels vérifiés correspondants à {currentCity}.
                </p>
              </div>
            )}

            <div className="space-y-2 pt-6 mt-auto">
              <button
                onClick={() => {
                  if (detectedIntent?.targetBusinessId) {
                    const match = CLIENT_ESTABLISHMENTS.find((e) => e.id === detectedIntent.targetBusinessId);
                    if (match) {
                      setSelectedEstablishment(match);
                      setActiveScreen('ESTABLISHMENT_DETAIL');
                      return;
                    }
                  }
                  setActiveScreen('RESULTS');
                }}
                className="w-full py-4 rounded-2xl bg-[#FB8205] text-white font-extrabold text-sm sm:text-base shadow-md hover:brightness-95 active:scale-98 transition-all text-center cursor-pointer"
              >
                {detectedIntent?.cta || 'Voir les professionnels'}
              </button>
              <button
                onClick={() => setActiveScreen('SEARCH')}
                className="w-full py-2.5 text-[#5C6B80] font-bold text-xs hover:text-[#111827] cursor-pointer"
              >
                Modifier ma recherche
              </button>
            </div>
          </div>
        </div>

        {/* SCREEN 4: RESULTS (LIST & MAP) */}
        <div className={`screen ${activeScreen === 'RESULTS' ? 'on' : ''}`}>
          <div className="topbar">
            <button className="iconbtn" onClick={() => setActiveScreen('HOME')}>
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center truncate px-2">
              <h1 className="text-sm font-extrabold truncate">
                {searchQuery ? `« ${searchQuery} »` : 'Établissements'}
              </h1>
              <div className="text-[10px] text-[#5C6B80] font-bold">
                {CLIENT_ESTABLISHMENTS.length} adresses vérifiées · {currentCity}
              </div>
            </div>
            <div className="viewtog">
              <button
                onClick={() => setResultsViewMode('LIST')}
                className={resultsViewMode === 'LIST' ? 'bg-[#111827] text-white' : ''}
              >
                Liste
              </button>
              <button
                onClick={() => setResultsViewMode('MAP')}
                className={resultsViewMode === 'MAP' ? 'bg-[#111827] text-white' : ''}
              >
                Carte
              </button>
            </div>
          </div>

          {/* Adaptive Filter Chips */}
          <div className="px-5 py-2.5 flex gap-2 overflow-x-auto scrollbar-none bg-[#F8FAFC] border-b border-[#E8EDF3]">
            <button
              onClick={() => setIsFilterSheetOpen(true)}
              className="chip cursor-pointer bg-white"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0794A0]" />
              <span>Filtrer</span>
            </button>
            <button
              onClick={() => setIsSortSheetOpen(true)}
              className="chip cursor-pointer bg-white"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#5C6B80]" />
              <span>{currentSort}</span>
            </button>
            <button className="chip cursor-pointer bg-white">
              <span className="w-2 h-2 rounded-full bg-[#10D97F]" />
              <span>Disponible</span>
            </button>
          </div>

          <div className="scroll">
            {resultsViewMode === 'LIST' ? (
              <div className="pt-3 pb-8">
                {CLIENT_ESTABLISHMENTS.map((biz) => {
                  const isFav = !!favorites[biz.id];
                  return (
                    <div
                      key={biz.id}
                      onClick={() => {
                        setSelectedEstablishment(biz);
                        setActiveScreen('ESTABLISHMENT_DETAIL');
                      }}
                      className="rescard"
                    >
                      <div className="imgw">
                        <img src={biz.coverImage} alt={biz.name} />
                        <button
                          className={`fav ${isFav ? 'von pop' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(biz.id, biz.name);
                          }}
                        >
                          ♥
                        </button>
                        <div className="dist">{biz.distanceKm} km</div>
                      </div>

                      <div className="in">
                        <div className="t">{biz.name}</div>
                        <div className="metaline mt-1">
                          <span className="star">★ {biz.rating}</span>
                          <span className="sep">·</span>
                          <span>{biz.categoryName}</span>
                          <span className="sep">·</span>
                          <span className="ok"><span className="dotg"></span>{biz.badgeStatus}</span>
                        </div>
                        <div className="rfoot">
                          <div className="price">
                            {biz.priceStartingAt.toLocaleString('fr-FR')} FCFA
                            <small> {biz.priceUnitText ? `· ${biz.priceUnitText}` : ''}</small>
                          </div>
                          <button className="see">Voir</button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Fallback Request Box */}
                <div className="mx-5 my-3 bg-[#E1FBFD] p-5 rounded-3xl border border-[#BDEFF2] text-[#067684]">
                  <h3 className="font-extrabold text-base text-[#0794A0]">Vous n'avez pas trouvé ?</h3>
                  <p className="text-xs font-semibold text-[#0794A0] mt-1 leading-relaxed">
                    Décrivez simplement votre besoin. Flowexa transmet directement votre demande aux entreprises et artisans certifiés.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => setIsVocalModalOpen(true)}
                      className="py-2.5 bg-white text-[#0794A0] font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#F8FAFC] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Parler</span>
                    </button>
                    <button
                      onClick={() => requireAuth(() => setIsNewRequestModalOpen(true))}
                      className="py-2.5 bg-[#0794A0] text-white font-extrabold text-xs rounded-xl shadow-xs hover:brightness-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Écrire ma demande</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* MAP VIEW */
              <div className="relative flex-1 w-full h-[540px] bg-[#E9EDF2] overflow-hidden">
                <ClientInteractiveMap
                  establishments={CLIENT_ESTABLISHMENTS}
                  selectedId={selectedEstablishment.id}
                  onSelectEstablishment={(est) => {
                    setSelectedEstablishment(est);
                  }}
                  centerCity={currentCity}
                  className="w-full h-full"
                />

                {/* Bottom preview card on Map */}
                {selectedEstablishment && (
                  <div
                    onClick={() => setActiveScreen('ESTABLISHMENT_DETAIL')}
                    className="absolute bottom-4 left-4 right-4 z-[500] bg-white p-3 rounded-2xl shadow-xl border border-[#E8EDF3] flex items-center gap-3 cursor-pointer hover:border-[#0BE9EF]"
                  >
                    <img
                      src={selectedEstablishment.coverImage}
                      alt={selectedEstablishment.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-xs text-[#111827] truncate">
                        {selectedEstablishment.name}
                      </h4>
                      <div className="text-[11px] text-[#5C6B80]">
                        {selectedEstablishment.categoryName} · {selectedEstablishment.neighborhood}
                      </div>
                      <div className="text-xs font-black text-[#FB8205] mt-0.5">
                        {selectedEstablishment.priceStartingAt.toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                    <span className="text-[#FB8205] font-black text-sm">›</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SCREEN 5: ESTABLISHMENT DETAIL */}
        <div className={`screen ${activeScreen === 'ESTABLISHMENT_DETAIL' ? 'on' : ''}`}>
          <div className="scroll">
            <ClientEstablishmentView
              establishment={selectedEstablishment}
              isFavorite={!!favorites[selectedEstablishment.id]}
              onToggleFavorite={() => handleToggleFavorite(selectedEstablishment.id, selectedEstablishment.name)}
              onBack={() => setActiveScreen('RESULTS')}
              onStartBooking={(type, serviceTitle, price) => {
                requireAuth(() => {
                  setBookingPreselection({ title: serviceTitle, price });
                  setActiveScreen('BOOKING');
                });
              }}
              onOpenChat={(bizName, ctx) => {
                requireAuth(() => {
                  setActiveScreen('MESSAGES');
                });
              }}
              onOpenReviewModal={() => {
                requireAuth(() => setIsReviewModalOpen(true));
              }}
              onShowToast={onShowToast}
            />
          </div>
        </div>

        {/* SCREEN 6: BOOKING FLOW */}
        <div className={`screen ${activeScreen === 'BOOKING' ? 'on' : ''}`}>
          <div className="scroll">
            <ClientBookingView
              establishment={selectedEstablishment}
              serviceTitle={bookingPreselection.title || selectedEstablishment.services[0]?.title}
              priceAmount={bookingPreselection.price || selectedEstablishment.priceStartingAt}
              onBack={() => setActiveScreen('ESTABLISHMENT_DETAIL')}
              onCompleteBooking={(details) => {
                onShowToast('Réservation confirmée', 'Votre demande est prise en compte dans votre activité.', 'success');
                fetchBackendData();
                setActiveScreen('ACTIVITY');
              }}
            />
          </div>
        </div>

        {/* SCREEN 7: ACTIVITY (HUB UNIFIÉ) */}
        <div className={`screen ${activeScreen === 'ACTIVITY' ? 'on' : ''}`}>
          <div className="scroll">
            <ClientActivityView
              requests={clientRequests}
              onOpenRequestDetail={(req) => {
                setActiveScreen('ACTIVITY');
              }}
              onOpenQuote={(qId) => setIsQuoteModalOpen(true)}
              onOpenOrderDetail={(ordId) => setActiveScreen('MARKETPLACE')}
              onOpenBookingDetail={(req) => setActiveScreen('ACTIVITY')}
              onNewRequest={() => requireAuth(() => setIsNewRequestModalOpen(true))}
            />
          </div>
        </div>

        {/* SCREEN 8: MESSAGES */}
        <div className={`screen ${activeScreen === 'MESSAGES' ? 'on' : ''}`}>
          <div className="scroll">
            <ClientMessagesView
              initialBusinessName={selectedEstablishment?.name}
              onBack={() => setActiveScreen('HOME')}
              onShowToast={onShowToast}
            />
          </div>
        </div>

        {/* SCREEN 9: MARKETPLACE */}
        <div className={`screen ${activeScreen === 'MARKETPLACE' ? 'on' : ''}`}>
          <div className="scroll">
            <ClientMarketplaceView
              onBack={() => setActiveScreen('HOME')}
              onShowToast={onShowToast}
            />
          </div>
        </div>

        {/* SCREEN 10: NOTIFICATIONS */}
        <div className={`screen ${activeScreen === 'NOTIFICATIONS' ? 'on' : ''}`}>
          <div className="topbar">
            <button className="iconbtn" onClick={() => setActiveScreen('HOME')}>
              <X className="w-5 h-5" />
            </button>
            <h1>Notifications</h1>
            <button
              onClick={() => {
                setUnreadCount(0);
                onShowToast('Notifications', 'Toutes les notifications sont marquées comme lues.', 'info');
              }}
              className="text-xs font-bold text-[#FB8205] hover:underline cursor-pointer"
            >
              Lu
            </button>
          </div>

          <div className="scroll pad space-y-3">
            <div
              onClick={() => setIsQuoteModalOpen(true)}
              className="p-4 rounded-2xl bg-white border border-[#E8EDF3] shadow-xs flex items-start gap-3 cursor-pointer hover:border-[#0BE9EF]"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#FB8205] mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-extrabold text-[#111827]">Nouveau devis reçu</div>
                <div className="text-xs text-[#5C6B80] mt-0.5">
                  Immo Bénin Services vous a envoyé un devis pour votre demande de maison à Calavi.
                </div>
                <div className="text-xs font-bold text-[#FB8205] mt-2">Examiner le devis →</div>
              </div>
            </div>

            <div
              onClick={() => setActiveScreen('MESSAGES')}
              className="p-4 rounded-2xl bg-white border border-[#E8EDF3] shadow-xs flex items-start gap-3 cursor-pointer hover:border-[#0BE9EF]"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#0794A0] mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-extrabold text-[#111827]">Réservation validée</div>
                <div className="text-xs text-[#5C6B80] mt-0.5">
                  Résidence Palma a confirmé votre séjour pour le samedi 13 septembre.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SCREEN 11: PHARMACIES DE GARDE */}
        <div className={`screen ${activeScreen === 'PHARMACIES' ? 'on' : ''}`}>
          <div className="topbar">
            <button className="iconbtn" onClick={() => setActiveScreen('HOME')}>
              <X className="w-5 h-5" />
            </button>
            <h1>Pharmacies de Garde</h1>
            <div className="w-9" />
          </div>

          <div className="scroll pad space-y-4">
            <p className="text-xs text-[#5C6B80] font-medium">
              Autour de vous · {currentCity} · Synchronisation en direct avec le calendrier officiel du Bénin.
            </p>

            <div className="space-y-3">
              {ON_DUTY_PHARMACIES.map((ph) => (
                <div key={ph.id} className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-sm font-black text-[#111827]">{ph.name}</h2>
                      <div className="text-xs text-[#5C6B80] mt-0.5">{ph.district}</div>
                      <div className="text-xs font-bold text-[#0A9159] flex items-center gap-1 mt-1">
                        <span className="w-2 h-2 rounded-full bg-[#10D97F]" />
                        <span>Ouverte maintenant · {ph.distanceKm} km</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <a
                      href={`tel:${ph.phone}`}
                      className="flex-1 py-2 rounded-xl bg-[#F8FAFC] border border-[#E8EDF3] text-xs font-bold text-[#111827] text-center hover:bg-[#EEF1F5]"
                    >
                      Appeler
                    </a>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${ph.name} Cotonou Benin`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 rounded-xl bg-[#E1FBFD] text-[#0794A0] text-xs font-bold text-center hover:bg-[#cbf7fa]"
                    >
                      Itinéraire
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SCREEN 12: PROFILE & PREFERENCES */}
        <div className={`screen ${activeScreen === 'PROFILE' ? 'on' : ''}`}>
          <div className="topbar">
            <button className="iconbtn" onClick={() => setActiveScreen('HOME')}>
              <X className="w-5 h-5" />
            </button>
            <h1>Mon Profil</h1>
            <div className="w-9" />
          </div>

          <div className="scroll pad space-y-5">
            {/* Header Avatar */}
            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FB8205] to-[#E06900] text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-[#FB8205]/25">
                {user?.name ? user.name[0].toUpperCase() : 'FX'}
              </div>
              <h2 className="text-lg font-black text-[#111827] mt-3">
                {user?.name || 'Visiteur Flowexa'}
              </h2>
              <div className="text-xs font-semibold text-[#5C6B80]">
                {user?.phone || user?.email || 'Compte Démonstration'}
              </div>
            </div>

            {/* Pass Flowexa Button */}
            <button
              onClick={() => setIsPassModalOpen(true)}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#0C1322] to-[#1E293B] text-white flex items-center justify-between shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0BE9EF]/20 text-[#0BE9EF] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black">FLOWEXAPASS · Niveau Silver</div>
                  <div className="text-[11px] text-gray-300">1 450 XP cumulés · Voir les privilèges</div>
                </div>
              </div>
              <span className="text-xs font-bold text-[#0BE9EF]">Ouvrir ›</span>
            </button>

            {/* Quick Activity Links */}
            <div className="bg-white rounded-2xl border border-[#E8EDF3] shadow-xs divide-y divide-[#E8EDF3]">
              <button
                onClick={() => setActiveScreen('ACTIVITY')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-[#FB8205]" />
                  <span className="text-xs font-bold text-[#111827]">Mes demandes & suivis</span>
                </div>
                <span className="text-xs text-[#C3CCD9]">›</span>
              </button>
              <button
                onClick={() => setActiveScreen('MARKETPLACE')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-[#0794A0]" />
                  <span className="text-xs font-bold text-[#111827]">Mes commandes Marketplace</span>
                </div>
                <span className="text-xs text-[#C3CCD9]">›</span>
              </button>
              <button
                onClick={() => setIsCitySheetOpen(true)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#10D97F]" />
                  <span className="text-xs font-bold text-[#111827]">Zone de recherche : {currentCity}</span>
                </div>
                <span className="text-xs text-[#C3CCD9]">Modifier ›</span>
              </button>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-2xl border border-[#E8EDF3] shadow-xs p-4 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#5C6B80]">
                Sécurité & Confidentialité
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#111827]">Téléphone certifié Bénin</span>
                <span className="font-bold text-[#0A9159] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Vérifié
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#111827]">Géolocalisation précise</span>
                <span className="font-bold text-[#0794A0]">Activée</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM NAVIGATION FOR PHONE */}
        <nav className="nav">
          <button
            className={activeNavTab === 'home' && activeScreen === 'HOME' ? 'on' : ''}
            onClick={() => {
              setActiveNavTab('home');
              setActiveScreen('HOME');
            }}
          >
            <div className="i"><Home className="w-5 h-5" /></div>
            <span>Accueil</span>
            <div className="dot"></div>
          </button>

          <button
            className={activeNavTab === 'search' || activeScreen === 'SEARCH' || activeScreen === 'RESULTS' || activeScreen === 'INTENT' ? 'on' : ''}
            onClick={() => {
              setActiveNavTab('search');
              setActiveScreen('SEARCH');
            }}
          >
            <div className="i"><Search className="w-5 h-5" /></div>
            <span>Rechercher</span>
            <div className="dot"></div>
          </button>

          <button
            className={activeNavTab === 'activity' || activeScreen === 'ACTIVITY' ? 'on' : ''}
            onClick={() => {
              setActiveNavTab('activity');
              setActiveScreen('ACTIVITY');
            }}
          >
            <div className="i"><Layers className="w-5 h-5" /></div>
            <span>Activité</span>
            <div className="dot"></div>
          </button>

          <button
            className={activeNavTab === 'msgs' || activeScreen === 'MESSAGES' ? 'on' : ''}
            onClick={() => {
              setActiveNavTab('msgs');
              setActiveScreen('MESSAGES');
            }}
          >
            <div className="i"><MessageCircle className="w-5 h-5" /></div>
            <span>Messages</span>
            <div className="dot"></div>
          </button>

          <button
            className={activeNavTab === 'profile' || activeScreen === 'PROFILE' ? 'on' : ''}
            onClick={() => {
              setActiveNavTab('profile');
              setActiveScreen('PROFILE');
            }}
          >
            <div className="i"><UserIcon className="w-5 h-5" /></div>
            <span>Profil</span>
            <div className="dot"></div>
          </button>
        </nav>
      </main>

      {/* DESKTOP VIEW: Right Contextual Panel */}
      <aside className="dskpanel">
        {/* Interactive Map Card */}
        <div className="pcard">
          <div className="h-40 relative overflow-hidden">
            <ClientInteractiveMap
              establishments={CLIENT_ESTABLISHMENTS}
              selectedId={selectedEstablishment.id}
              onSelectEstablishment={(est) => {
                setSelectedEstablishment(est);
                setActiveScreen('ESTABLISHMENT_DETAIL');
              }}
              centerCity={currentCity}
              className="w-full h-full"
            />
          </div>
          <div className="pin2">
            <div className="pt">Autour de vous · {currentCity}</div>
            <div className="pm">
              Rayon de 5 km actif. Les offres, services et disponibilités s’adaptent automatiquement à votre position géographique.
            </div>
            <button
              onClick={() => {
                setResultsViewMode('MAP');
                setActiveScreen('RESULTS');
              }}
              className="plink"
            >
              Agrandir la carte interactive ›
            </button>
          </div>
        </div>

        {/* Flowexa Pass card */}
        <div className="pcard">
          <div className="pin2">
            <div className="flex items-center justify-between">
              <div className="pt flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FB8205]" />
                <span>Flowexa Pass Bénin</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#E1FBFD] text-[#0794A0] text-[10px] font-extrabold">
                Niveau Silver
              </span>
            </div>
            <div className="pm">
              1 450 XP cumulés. Bénéficiez de -15% de réduction chez 12 partenaires certifiés à Cotonou et Calavi.
            </div>
            <button
              onClick={() => setIsPassModalOpen(true)}
              className="plink"
            >
              Voir mes avantages et progression ›
            </button>
          </div>
        </div>

        {/* SOS Card */}
        <div className="pcard border-red-200">
          <div className="pin2 bg-red-50/50">
            <div className="pt text-[#C0392B] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#C0392B]" />
              <span>Urgences & Assistance 24/7</span>
            </div>
            <div className="pm text-[#5C6B80]">
              SAMU 15 · Police 117 · Pompiers 118 · Pharmacies de garde officielles disponibles en 1 clic.
            </div>
            <button
              onClick={() => setIsSosOpen(true)}
              className="plink text-[#C0392B]"
            >
              Ouvrir le centre d'urgence ›
            </button>
          </div>
        </div>

        {/* Guide */}
        <div className="pcard">
          <div className="pin2">
            <div className="pt">Comment fonctionne Flowexa ?</div>
            <div className="pm">
              Décrivez votre besoin par texte ou voix. Notre moteur d'intention identifie le métier exact, vérifie la proximité et vous connecte instantanément aux prestataires certifiés.
            </div>
          </div>
        </div>
      </aside>

      {/* MODALS & SHEETS */}
      <CitySheet
        isOpen={isCitySheetOpen}
        onClose={() => setIsCitySheetOpen(false)}
        currentCity={currentCity}
        onSelectCity={(c) => {
          setCurrentCity(c);
          onShowToast('Ville sélectionnée', `Zone mise à jour : ${c}`, 'info');
        }}
      />

      <SortSheet
        isOpen={isSortSheetOpen}
        onClose={() => setIsSortSheetOpen(false)}
        currentSort={currentSort}
        onSelectSort={(s) => {
          setCurrentSort(s);
          onShowToast('Tri appliqué', `Les résultats sont triés par : ${s}`, 'info');
        }}
      />

      <FilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        onApplyFilters={(filters) => {
          onShowToast('Filtres appliqués', 'La liste des établissements a été affinée.', 'success');
        }}
      />

      <AuthGateSheet
        isOpen={isAuthGateOpen}
        onClose={() => {
          setIsAuthGateOpen(false);
          setPendingAuthCallback(null);
        }}
        actionName={authGateActionName}
        onSuccess={() => {
          setIsAuthGateOpen(false);
          if (pendingAuthCallback) {
            pendingAuthCallback();
            setPendingAuthCallback(null);
          }
        }}
      />

      <VocalSearchModal
        isOpen={isVocalModalOpen}
        onClose={() => setIsVocalModalOpen(false)}
        onTranscribe={(text) => {
          setIsVocalModalOpen(false);
          handlePerformSearch(text);
        }}
      />

      {/* Review Modal */}
      <ClientReviewsModalView
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        establishmentName={selectedEstablishment?.name || 'Établissement'}
        onSubmitReview={(rev) => {
          onShowToast('Avis publié !', 'Merci pour votre contribution à la communauté Flowexa.', 'success');
        }}
      />

      {/* Quote Examination Modal */}
      {isQuoteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsQuoteModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E8EDF3] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FB8205]" />
                <h2 className="font-extrabold text-base text-[#111827]">Devis Professionnel</h2>
              </div>
              <button
                onClick={() => setIsQuoteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E8EDF3] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#5C6B80]">Prestataire :</span>
                <span className="font-bold text-[#111827]">Immo Bénin Services</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#5C6B80]">Référence :</span>
                <span className="font-mono font-bold text-[#111827]">DEV-2025-089</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#5C6B80]">Objet :</span>
                <span className="font-semibold text-[#111827]">Location meublée 3 pièces Haie Vive</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-[#E8EDF3]">
                <span>Montant Total :</span>
                <span className="text-[#FB8205]">150 000 FCFA</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  onShowToast('Devis décliné', 'Vous avez décliné cette proposition.', 'info');
                  setIsQuoteModalOpen(false);
                }}
                className="py-3 rounded-xl border border-[#E8EDF3] text-xs font-bold text-[#5C6B80] hover:bg-gray-50 cursor-pointer"
              >
                Décliner
              </button>
              <button
                onClick={() => {
                  onShowToast('Devis accepté !', 'Le prestataire a été notifié et va vous contacter.', 'success');
                  setIsQuoteModalOpen(false);
                }}
                className="py-3 rounded-xl bg-[#0794A0] text-white text-xs font-extrabold shadow-md hover:bg-[#067c87] cursor-pointer"
              >
                Accepter le devis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Custom Request Modal */}
      {isNewRequestModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsNewRequestModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E8EDF3] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-[#111827]">Déposer une demande</h2>
              <button
                onClick={() => setIsNewRequestModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#111827] block mb-1">Votre besoin</label>
                <textarea
                  rows={3}
                  value={newRequestNeed}
                  onChange={(e) => setNewRequestNeed(e.target.value)}
                  placeholder="Ex. Je cherche un appartement meublé pour 2 semaines à Haie Vive ou Cadjehoun..."
                  className="w-full p-3 rounded-xl border border-[#E8EDF3] outline-none focus:border-[#FB8205] text-xs font-medium text-[#111827]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111827] block mb-1">Budget prévisionnel (FCFA)</label>
                <input
                  type="text"
                  value={newRequestBudget}
                  onChange={(e) => setNewRequestBudget(e.target.value)}
                  placeholder="Ex. 150 000 FCFA"
                  className="w-full p-3 rounded-xl border border-[#E8EDF3] outline-none focus:border-[#FB8205] text-xs font-medium text-[#111827]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111827] block mb-1">Zone géographique</label>
                <select
                  value={newRequestZone}
                  onChange={(e) => setNewRequestZone(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E8EDF3] outline-none focus:border-[#FB8205] text-xs font-medium text-[#111827] bg-white"
                >
                  <option value="Cotonou - Haie Vive">Cotonou - Haie Vive</option>
                  <option value="Cotonou - Cadjehoun">Cotonou - Cadjehoun</option>
                  <option value="Cotonou - Akpakpa">Cotonou - Akpakpa</option>
                  <option value="Abomey-Calavi">Abomey-Calavi</option>
                  <option value="Ouidah / Porto-Novo">Ouidah / Porto-Novo</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSubmitNewRequest}
                className="w-full py-3.5 rounded-xl bg-[#FB8205] text-white font-extrabold text-xs shadow-md hover:brightness-95 cursor-pointer"
              >
                Diffuser ma demande aux professionnels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
