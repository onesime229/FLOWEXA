import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  CheckSquare,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Plus,
  Building2,
  DollarSign,
  PhoneCall,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Settings,
  Package,
  Inbox,
  Star,
  MessageSquare,
  BarChart3,
  Zap,
  CreditCard,
  Megaphone,
} from 'lucide-react';
import { BusinessModuleCode, UserProfile, ReviewItem } from '../../types';
import { FLOWEXA_MODULES, MOCK_TODAY_METRICS, MOCK_CRM_CONTACTS } from '../../data/mockData';
import { Card, MetricCard } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../design-system/Table';
import { BarChartWidget, AreaTrendWidget } from '../design-system/ChartWidget';
import { flowexaApi } from '../../services/api';
import { BusinessSettingsModal } from './BusinessSettingsModal';
import { BusinessCatalogManager } from './BusinessCatalogManager';
import { BusinessRequestsManager } from './BusinessRequestsManager';
import { ReviewsList } from '../reviews/ReviewsList';
import { MessagingCenter } from '../messaging/MessagingCenter';
import { BusinessAnalyticsDashboard } from './BusinessAnalyticsDashboard';
import { BusinessAutomationsManager } from './BusinessAutomationsManager';
import { BusinessAIAssistant } from './BusinessAIAssistant';
import { EnterpriseSubscriptionView } from './EnterpriseSubscriptionView';
import { MarketplaceProOpportunitiesView } from '../marketplace/MarketplaceProOpportunitiesView';
import { CockpitTodayActions } from './CockpitTodayActions';
import { CockpitCalendarView } from './CockpitCalendarView';
import { CockpitClientsView } from './CockpitClientsView';
import { BusinessGrowthCampaignsView } from './BusinessGrowthCampaignsView';
import { CockpitTeamView } from './CockpitTeamView';
import { CockpitFinancesView } from './CockpitFinancesView';
import { CockpitTasksManager } from './CockpitTasksManager';
import type { BusinessCockpitMetrics, BusinessClientSummary } from '../../types';

export interface GlobalProDashboardProps {
  user: UserProfile;
  activeModuleCode: BusinessModuleCode;
  onSelectModule: (code: BusinessModuleCode) => void;
  onOpenModuleSpecificView: (code: BusinessModuleCode) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const GlobalProDashboard: React.FC<GlobalProDashboardProps> = ({
  user,
  activeModuleCode,
  onSelectModule,
  onOpenModuleSpecificView,
  onShowToast,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<
    | 'cockpit'
    | 'catalogue'
    | 'demandes'
    | 'opportunites'
    | 'calendrier'
    | 'clients'
    | 'croissance'
    | 'equipe'
    | 'finances'
    | 'abonnement'
    | 'messages'
    | 'avis'
    | 'statistiques'
    | 'automatisations'
    | 'ia_assistant'
  >('cockpit');
  const [businessReviews, setBusinessReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [bizUnreadMessages, setBizUnreadMessages] = useState(0);
  const [cockpitMetrics, setCockpitMetrics] = useState<BusinessCockpitMetrics | null>(null);
  const [cockpitClients, setCockpitClients] = useState<BusinessClientSummary[]>([]);
  const [loadingCockpit, setLoadingCockpit] = useState(false);
  const currentModule = FLOWEXA_MODULES.find((m) => m.code === activeModuleCode) || FLOWEXA_MODULES[0];

  const getBusinessIdForModule = (code: BusinessModuleCode) => {
    switch (code) {
      case 'IMMOBILIER':
        return 'biz-immo-1';
      case 'GUEST_HOUSE':
        return 'biz-gh-1';
      case 'COIFFURE':
        return 'biz-coif-1';
      case 'GARAGE':
        return 'biz-gar-1';
      default:
        return 'biz-immo-1';
    }
  };

  const fetchCockpitData = async () => {
    const bizId = getBusinessIdForModule(activeModuleCode);
    setLoadingCockpit(true);
    try {
      const [summaryRes, clientsRes] = await Promise.all([
        flowexaApi.getCockpitSummary(bizId),
        flowexaApi.getBusinessClients(bizId),
      ]);

      if (summaryRes.success && summaryRes.data) {
        setCockpitMetrics(summaryRes.data);
      }
      if (clientsRes.success && Array.isArray(clientsRes.data)) {
        setCockpitClients(clientsRes.data);
      }
    } catch (e) {
      console.error('Failed to fetch cockpit summary', e);
    } finally {
      setLoadingCockpit(false);
    }
  };

  const fetchBizUnreadCount = async () => {
    const bizId = getBusinessIdForModule(activeModuleCode);
    try {
      const res = await flowexaApi.getUnreadMessagesCount({
        role: 'BUSINESS_OWNER',
        businessId: bizId,
      });
      if (res.success && typeof res.unreadCount === 'number') {
        setBizUnreadMessages(res.unreadCount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBusinessReviews = async () => {
    const bizId = getBusinessIdForModule(activeModuleCode);
    setLoadingReviews(true);
    try {
      const res = await flowexaApi.getReviews({ businessId: bizId });
      if (res.success && Array.isArray(res.data)) {
        setBusinessReviews(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchCockpitData();
    fetchBizUnreadCount();
    const interval = setInterval(() => {
      fetchBizUnreadCount();
      fetchCockpitData();
    }, 15000);
    return () => clearInterval(interval);
  }, [activeModuleCode]);

  useEffect(() => {
    if (activeSection === 'avis') {
      fetchBusinessReviews();
    }
  }, [activeSection, activeModuleCode]);

  // Real or fallback revenue chart data
  const weeklyRevenueData = cockpitMetrics?.revenueTrend?.length
    ? cockpitMetrics.revenueTrend.map((d: any) => {
        const val = typeof d.amount === 'number' ? d.amount : typeof d.value === 'number' ? d.value : 0;
        const lbl = d.day || d.label || d.date || '';
        return {
          label: lbl,
          value: Math.round(val / 1000),
          formattedValue: `${val.toLocaleString()} FCFA`,
        };
      })
    : [
        { label: 'J-6', value: 120, formattedValue: '120 000 FCFA' },
        { label: 'J-5', value: 190, formattedValue: '190 000 FCFA' },
        { label: 'J-4', value: 240, formattedValue: '240 000 FCFA' },
        { label: 'J-3', value: 310, formattedValue: '310 000 FCFA' },
        { label: 'J-2', value: 450, formattedValue: '450 000 FCFA' },
        { label: 'Hier', value: 520, formattedValue: '520 000 FCFA' },
        {
          label: "Aujourd'hui",
          value: Math.round((cockpitMetrics?.todayRevenue || 0) / 1000),
          formattedValue: `Aujourd'hui : ${(cockpitMetrics?.todayRevenue || 0).toLocaleString()} FCFA`,
        },
      ];

  // Quick tasks list
  const [tasks, setTasks] = useState([
    { id: 1, text: "Relancer M. Lawson pour signature bail appartement", done: false, time: "11:30" },
    { id: 2, text: "Valider check-in Chambre Baobab Deluxe #102", done: true, time: "10:15" },
    { id: 3, text: "Confirmer approvisionnement réactifs et soins Spa", done: false, time: "15:00" },
    { id: 4, text: "Émettre facture proforma pour shooting corporate", done: false, time: "16:30" },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    onShowToast('Tâche mise à jour', 'Statut modifié avec succès.', 'info');
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300 text-left">
      {/* Top Banner: Context & Current Business Identity */}
      <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cyan" dot>
              Espace Professionnel Multi-Tenant
            </Badge>
            <span className="text-xs text-gray-400">Organisation : {user.tenantName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Cockpit Global Flowexa</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
              Aujourd'hui
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Activité sélectionnée : <strong className="text-[#FB8205]">{currentModule.name}</strong> ({currentModule.subtitle}). L'interface s'adapte automatiquement à ce secteur.
          </p>
        </div>

        {/* Action Button to switch into dedicated module workflow */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Settings className="w-4 h-4" />}
            onClick={() => setIsSettingsOpen(true)}
            className="w-full sm:w-auto border-white/10 hover:border-[#FB8205]/40"
          >
            Paramètres Établissement
          </Button>
          <Button
            variant="primary"
            size="md"
            rightIcon={<ChevronRight className="w-4 h-4" />}
            onClick={() => onOpenModuleSpecificView(activeModuleCode)}
            className="w-full sm:w-auto"
          >
            Ouvrir la gestion {currentModule.name}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs: Cockpit vs. MON CATALOGUE (Sprint F11 Point 1) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('cockpit')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'cockpit'
                ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Vue d'ensemble (Cockpit)</span>
          </button>

          <button
            onClick={() => setActiveSection('catalogue')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'catalogue'
                ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4 text-white" />
            <span>MON CATALOGUE</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
              {currentModule.name}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('demandes')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'demandes'
                ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Inbox className="w-4 h-4 text-white" />
            <span>DEMANDES & RÉSERVATIONS</span>
            {(cockpitMetrics?.pendingRequestsCount || 0) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-[#FB8205] font-extrabold">
                {cockpitMetrics?.pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('calendrier')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'calendrier'
                ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4 text-white" />
            <span>CALENDRIER & RDV</span>
            {(cockpitMetrics?.todayAppointmentsCount || 0) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-400 text-black font-extrabold">
                {cockpitMetrics?.todayAppointmentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('clients')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'clients'
                ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 text-white" />
            <span>MES CLIENTS</span>
            {cockpitClients.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-extrabold">
                {cockpitClients.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('croissance')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'croissance'
                ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Megaphone className="w-4 h-4 text-[#FB8205]" />
            <span>CROISSANCE & CAMPAGNES</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FB8205]/20 text-[#FB8205] font-extrabold border border-[#FB8205]/30">
              CRM
            </span>
          </button>

          <button
            onClick={() => setActiveSection('equipe')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'equipe'
                ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4 text-white" />
            <span>MON ÉQUIPE</span>
          </button>

          {/* Finances & Abonnements réservés exclusivement au Propriétaire (BUSINESS_OWNER) */}
          {user.role === 'BUSINESS_OWNER' && (
            <>
              <button
                onClick={() => setActiveSection('finances')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSection === 'finances'
                    ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <DollarSign className="w-4 h-4 text-white" />
                <span>FINANCES & RECETTES</span>
              </button>

              <button
                onClick={() => setActiveSection('abonnement')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSection === 'abonnement'
                    ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <CreditCard className="w-4 h-4 text-white" />
                <span>MON ABONNEMENT</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveSection('opportunites')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'opportunites'
                ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>OPPORTUNITÉS MARKETPLACE</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
              Matching
            </span>
          </button>

          <button
            onClick={() => setActiveSection('messages')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'messages'
                ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span>MESSAGERIE</span>
            {bizUnreadMessages > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-[#FB8205] font-extrabold animate-pulse">
                {bizUnreadMessages}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('avis')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'avis'
                ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Star className={`w-4 h-4 ${businessReviews.length > 0 ? 'fill-amber-400 text-amber-400' : 'text-white'}`} />
            <span>AVIS CLIENTS</span>
            {businessReviews.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-black font-extrabold">
                {businessReviews.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('statistiques')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'statistiques'
                ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-white" />
            <span>STATISTIQUES & BI</span>
          </button>

          <button
            onClick={() => setActiveSection('automatisations')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'automatisations'
                ? 'bg-gradient-to-r from-[#FB8205] to-[#f97316] text-white shadow-lg shadow-[#FB8205]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4 text-white" />
            <span>AUTOMATISATIONS</span>
          </button>

          <button
            onClick={() => setActiveSection('ia_assistant')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'ia_assistant'
                ? 'bg-gradient-to-r from-[#0BE9EF] to-[#0891B2] text-[#0A1428] shadow-lg shadow-[#0BE9EF]/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-inherit" />
            <span>IA & ASSISTANT</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Numéro de test système : <strong className="text-white font-mono">0154100617</strong></span>
        </div>
      </div>

      {activeSection === 'ia_assistant' ? (
        <BusinessAIAssistant
          businessId={getBusinessIdForModule(activeModuleCode)}
          businessName={currentModule.name}
          moduleCode={activeModuleCode}
          onShowToast={onShowToast}
        />
      ) : activeSection === 'automatisations' ? (
        <BusinessAutomationsManager
          businessId={getBusinessIdForModule(activeModuleCode)}
          businessName={currentModule.name}
          moduleCode={activeModuleCode}
          onShowToast={onShowToast}
        />
      ) : activeSection === 'statistiques' ? (
        <BusinessAnalyticsDashboard
          businessId={getBusinessIdForModule(activeModuleCode)}
          businessName={currentModule.name}
          moduleCode={activeModuleCode}
          onShowToast={onShowToast}
        />
      ) : activeSection === 'catalogue' ? (
        <BusinessCatalogManager
          businessId={getBusinessIdForModule(activeModuleCode)}
          moduleCode={activeModuleCode}
          onShowToast={onShowToast}
        />
      ) : activeSection === 'demandes' ? (
        <BusinessRequestsManager
          businessId={getBusinessIdForModule(activeModuleCode)}
          moduleCode={activeModuleCode}
          onShowToast={onShowToast}
        />
      ) : activeSection === 'opportunites' ? (
        <MarketplaceProOpportunitiesView
          businessId={getBusinessIdForModule(activeModuleCode)}
          businessName={currentModule.name}
          moduleCode={activeModuleCode}
          onShowToast={onShowToast}
          onNavigateToReservations={() => setActiveSection('demandes')}
          onNavigateToMessages={() => setActiveSection('messages')}
        />
      ) : activeSection === 'calendrier' ? (
        <CockpitCalendarView
          businessId={getBusinessIdForModule(activeModuleCode)}
          businessName={currentModule.name}
          onShowToast={onShowToast}
          onNavigateToRequest={() => setActiveSection('demandes')}
          onNavigateToMessages={() => setActiveSection('messages')}
        />
      ) : activeSection === 'clients' ? (
        <CockpitClientsView
          businessId={getBusinessIdForModule(activeModuleCode)}
          businessName={currentModule.name}
          onShowToast={onShowToast}
          onNavigateToMessages={() => setActiveSection('messages')}
          onNavigateToCampaigns={() => setActiveSection('croissance')}
        />
      ) : activeSection === 'croissance' ? (
        <BusinessGrowthCampaignsView
          businessId={getBusinessIdForModule(activeModuleCode)}
          businessName={currentModule.name}
          onShowToast={onShowToast}
          onNavigateToClients={() => setActiveSection('clients')}
        />
      ) : activeSection === 'equipe' ? (
        <CockpitTeamView
          businessId={getBusinessIdForModule(activeModuleCode)}
          businessName={currentModule.name}
          onShowToast={onShowToast}
        />
      ) : activeSection === 'finances' ? (
        <CockpitFinancesView
          businessId={getBusinessIdForModule(activeModuleCode)}
          businessName={currentModule.name}
          onShowToast={onShowToast}
        />
      ) : activeSection === 'abonnement' ? (
        <EnterpriseSubscriptionView
          businessId={getBusinessIdForModule(activeModuleCode)}
          businessName={currentModule.name}
          onShowToast={onShowToast}
        />
      ) : activeSection === 'messages' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A1428] border border-white/10 rounded-2xl p-4.5">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Messagerie Directe Entreprise</span>
                <Badge variant="cyan">{currentModule.name}</Badge>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Échanges instantanés avec vos clients concernant leurs demandes, rendez-vous et réservations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                Identifiant établissement : <strong className="text-white font-mono">{getBusinessIdForModule(activeModuleCode)}</strong>
              </span>
            </div>
          </div>

          <MessagingCenter
            callerRole="BUSINESS"
            callerId={getBusinessIdForModule(activeModuleCode)}
            callerName={currentModule.name}
            onShowToast={onShowToast}
          />
        </div>
      ) : activeSection === 'avis' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A1428] border border-white/10 rounded-2xl p-4.5">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Avis Clients & Système de Confiance</span>
                <Badge variant="success">100% Vérifiés</Badge>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Retours d'expérience authentiques laissés par des clients ayant finalisé une prestation avec votre établissement.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchBusinessReviews}
              leftIcon={<Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
              className="text-xs border-white/10"
            >
              Actualiser les avis
            </Button>
          </div>

          <ReviewsList
            reviews={businessReviews}
            onShowToast={onShowToast}
            title={`Avis certifiés sur ${currentModule.name}`}
            emptyMessage={`Aucun avis client déposé pour l'instant sur cet établissement. Dès que des prestations seront terminées par vos clients, leurs évaluations vérifiées s'afficheront ici.`}
          />
        </div>
      ) : (
        <>
          {/* SPRINT B22+F22: SECTION "À FAIRE AUJOURD'HUI" ACTIONNABLE */}
          <CockpitTodayActions
            actions={cockpitMetrics?.todayActions || []}
            onNavigate={(sec) => setActiveSection(sec as any)}
            onRefresh={fetchCockpitData}
          />

          {/* SPRINT F04 MANDATORY: TODAY'S 6 METRICS */}
          {/* nouveaux clients, demandes/prospects, rendez-vous, réservations, tâches, revenus */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              title="Nouveaux Clients"
              value={cockpitMetrics ? cockpitMetrics.newClientsCount : MOCK_TODAY_METRICS.newClients}
              change={+12}
              changeLabel="ce mois"
              icon={<Users className="w-5 h-5" />}
              accentColor="#10D97F"
            />

            <MetricCard
              title="Demandes Actives"
              value={cockpitMetrics ? cockpitMetrics.pendingRequestsCount : MOCK_TODAY_METRICS.prospects}
              change={cockpitMetrics?.pendingRequestsCount ? +cockpitMetrics.pendingRequestsCount : 0}
              changeLabel="à traiter"
              icon={<UserCheck className="w-5 h-5" />}
              accentColor="#0BE9EF"
            />

            <MetricCard
              title="Rendez-vous"
              value={cockpitMetrics ? cockpitMetrics.todayAppointmentsCount : MOCK_TODAY_METRICS.appointments}
              subtitle="Aujourd'hui"
              icon={<Calendar className="w-5 h-5" />}
              accentColor="#FB8205"
            />

            <MetricCard
              title="Réservations"
              value={cockpitMetrics ? cockpitMetrics.todayBookingsCount : MOCK_TODAY_METRICS.bookings}
              subtitle="Confirmées"
              icon={<Clock className="w-5 h-5" />}
              accentColor="#0BE9EF"
            />

            <MetricCard
              title="Tâches actives"
              value={cockpitMetrics ? cockpitMetrics.pendingTasksCount : 3}
              subtitle="À finaliser"
              icon={<CheckSquare className="w-5 h-5" />}
              accentColor="#FB8205"
            />

            <MetricCard
              title="Revenus du jour"
              value={
                cockpitMetrics
                  ? `${(cockpitMetrics.todayRevenue ?? 0).toLocaleString()} F`
                  : '485 000 F'
              }
              change={cockpitMetrics?.revenueComparisonPercent ?? MOCK_TODAY_METRICS.revenueComparisonPercent}
              changeLabel="vs j-1"
              icon={<TrendingUp className="w-5 h-5" />}
              accentColor="#10D97F"
            />
          </div>

          {/* Middle Section: Flowexa AI Smart Assistant & Revenue Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Revenue & Activity Trend */}
            <div className="lg:col-span-2 space-y-6">
              <BarChartWidget
                title="Évolution du Chiffre d'Affaires Hebdomadaire (FCFA)"
                subtitle="Recettes cumulées sur les points de vente et réservations"
                data={weeklyRevenueData}
                color="#FB8205"
                height={180}
              />

              {/* Today's CRM Pipeline & Contacts réels */}
              <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Derniers Contacts & Clients Actifs ({cockpitClients.length})
                    </h3>
                    <p className="text-xs text-gray-400">Portefeuille réel rattaché à cet établissement</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveSection('clients')}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Voir tous les clients
                  </Button>
                </div>

                {cockpitClients.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500">
                    Aucun client enregistré pour l'instant dans ce module.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client / Contact</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Relation</TableHead>
                        <TableHead>Prestations</TableHead>
                        <TableHead>Total Payé</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cockpitClients.slice(0, 5).map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-white">{c.name}</span>
                              <span className="text-[11px] text-gray-500">{c.email || 'Sans email'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-300">{c.phone}</TableCell>
                          <TableCell>
                            <Badge variant={c.relationType === 'VIP' ? 'orange' : c.relationType === 'RÉCURRENT' ? 'cyan' : 'neutral'}>
                              {c.relationType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-300 bg-white/5 px-2 py-0.5 rounded">
                              {c.totalRequests} demande(s)
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-400">
                            {typeof c.totalPaid === 'number' && c.totalPaid > 0 ? `${c.totalPaid.toLocaleString()} FCFA` : '0 FCFA'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            {/* Right Col: Flowexa AI Insights & Tasks Manager */}
            <div className="space-y-6">
              {/* AI Cross-selling card */}
              <div className="bg-[#0A1428] border border-[#0BE9EF]/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3 text-[#0BE9EF]">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span className="text-xs uppercase font-bold tracking-wider">Flowexa AI Assistant</span>
                </div>

                <h4 className="text-base font-bold text-white mb-2">
                  Opportunité Détectée
                </h4>

                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  {cockpitMetrics?.pendingRequestsCount && cockpitMetrics.pendingRequestsCount > 0
                    ? `Vous avez ${cockpitMetrics.pendingRequestsCount} demande(s) client en attente. Répondre sous 15 minutes augmente le taux de conversion de +65%.`
                    : "Mme Sarah Dossou a validé une réservation. Nos modèles prédisent 89% d'intérêt pour une prestation complémentaire."}
                </p>

                <div className="p-3 bg-[#020919] rounded-xl border border-white/5 text-xs text-gray-400 space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span>Recommandation :</span>
                    <span className="text-white font-medium">Relance immédiate</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impact potentiel :</span>
                    <span className="text-[#10D97F] font-bold">+ 35 000 FCFA</span>
                  </div>
                </div>

                <Button
                  variant="cyan"
                  size="sm"
                  className="w-full"
                  leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
                  onClick={() => setActiveSection('demandes')}
                >
                  Traiter les opportunités
                </Button>
              </div>

              {/* Tasks Manager (persisted & dynamic) */}
              <CockpitTasksManager
                businessId={getBusinessIdForModule(activeModuleCode)}
                onShowToast={onShowToast}
              />
            </div>
          </div>
        </>
      )}

      {/* Business Profile & Geolocation Settings Modal */}
      <BusinessSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
