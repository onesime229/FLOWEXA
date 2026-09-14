import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Settings,
  Calendar,
  CreditCard,
  MessageSquare,
  ShieldAlert,
  Inbox,
  Filter,
  ExternalLink,
  Sparkles,
  Smartphone,
  Mail,
  Send,
  RefreshCw,
  X,
  AlertCircle,
  Clock,
  Sliders,
  Tag,
  Gift,
  Award,
  Lock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  FlowexaNotificationItem,
  NotificationCategory,
  NotificationPriority,
  NotificationPreferences,
  ConsentEntity,
} from '../../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  userId?: string;
  businessId?: string;
  onNavigateTo?: (view: string, targetId?: string) => void;
  onNotificationReadStateChanged?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  userRole,
  userId,
  businessId,
  onNavigateTo,
  onNotificationReadStateChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'INBOX' | 'PREFERENCES'>('INBOX');
  const [notifications, setNotifications] = useState<FlowexaNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Consentements horodatés & audit
  const [consentsHistory, setConsentsHistory] = useState<ConsentEntity[]>([]);
  const [consentMatrix, setConsentMatrix] = useState<Record<string, any>>({});
  const [showConsentLog, setShowConsentLog] = useState<boolean>(false);

  // Préférences utilisateur
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    channels: {
      inApp: true,
      email: true,
      sms: true,
      whatsapp: true,
      push: true,
    },
    categories: {
      appointments: true,
      bookings: true,
      messages: true,
      payments: true,
      reviews: true,
      marketplace: true,
      marketing: true,
      promotions: true,
      anniversaire: true,
      loyalty: true,
      security: true,
    },
    marketingChannels: {
      email: true,
      sms: false,
      whatsapp: true,
      push: true,
    },
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState<boolean>(false);

  // Charger les notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const recipientType = userRole === 'BUSINESS_OWNER' ? 'BUSINESS' : 'CLIENT';
      const recipientId = userRole === 'BUSINESS_OWNER' ? businessId : userId;
      let url = `/api/v1/notifications?recipient_type=${recipientType}`;
      if (recipientId) url += `&recipient_id=${recipientId}`;
      if (statusFilter === 'UNREAD') url += `&unread=true`;
      if (categoryFilter !== 'ALL') url += `&category=${categoryFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les préférences
  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/v1/notification-preferences');
      const json = await res.json();
      if (json.success && json.data) {
        setPreferences({
          ...json.data,
          categories: {
            ...json.data.categories,
            // RÈGLE : Les catégories transactionnelles ne sont PAS désactivables
            appointments: true,
            bookings: true,
            messages: true,
            payments: true,
            security: true,
          },
          marketingChannels: json.data.marketingChannels || {
            email: true,
            sms: false,
            whatsapp: true,
            push: true,
          },
        });
        if (json.consents) setConsentMatrix(json.consents);
        if (json.history) setConsentsHistory(json.history);
      }
    } catch (err) {
      console.error('Erreur chargement préférences:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [isOpen, statusFilter, categoryFilter]);

  // Marquer une notification comme lue
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        if (onNotificationReadStateChanged) onNotificationReadStateChanged();
      }
    } catch (err) {
      console.error('Erreur marquage lu:', err);
    }
  };

  // Tout marquer comme lu
  const handleMarkAllAsRead = async () => {
    try {
      const recipientType = userRole === 'BUSINESS_OWNER' ? 'BUSINESS' : 'CLIENT';
      const recipientId = userRole === 'BUSINESS_OWNER' ? businessId : userId;
      const res = await fetch('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_type: recipientType, recipient_id: recipientId }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        setActionFeedback('Toutes les alertes ont été marquées comme lues.');
        setTimeout(() => setActionFeedback(null), 3000);
        if (onNotificationReadStateChanged) onNotificationReadStateChanged();
      }
    } catch (err) {
      console.error('Erreur tout marquer lu:', err);
    }
  };

  // Sauvegarder les préférences & consentements horodatés
  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      // RÈGLE : Les catégories transactionnelles ne sont PAS désactivables
      const payload: NotificationPreferences = {
        ...preferences,
        categories: {
          ...preferences.categories,
          appointments: true,
          bookings: true,
          messages: true,
          payments: true,
          security: true,
        },
      };

      const res = await fetch('/api/v1/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          source: 'NOTIFICATION_CENTER_PREFERENCES_UI',
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data) setPreferences(data.data);
        if (data.consents) setConsentMatrix(data.consents);
        if (data.history) setConsentsHistory(data.history);
        setActionFeedback('Préférences et consentements horodatés enregistrés avec succès.');
        setTimeout(() => setActionFeedback(null), 3500);
      }
    } catch (err) {
      console.error('Erreur sauvegarde préférences:', err);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Déclencher un test
  const handleTriggerTest = async () => {
    try {
      const res = await fetch('/api/v1/notifications/test-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test de communication Flowexa',
          message: 'Vérification en direct du routage multi-canal et de la priorité normale.',
          category: 'SYSTEM',
          priority: 'NORMAL',
          channels: ['INTERNAL', 'EMAIL', 'SMS', 'WHATSAPP'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback('Notification de test générée avec succès.');
        setTimeout(() => setActionFeedback(null), 3500);
        fetchNotifications();
      } else {
        setActionFeedback(data.skippedReason || 'Notification ignorée (anti-spam)');
        setTimeout(() => setActionFeedback(null), 3500);
      }
    } catch (err) {
      console.error('Erreur test notification:', err);
    }
  };

  if (!isOpen) return null;

  // Filtrage local supplémentaire si statusFilter = READ
  const displayedNotifications = notifications.filter((item) => {
    if (statusFilter === 'UNREAD') return !item.isRead;
    if (statusFilter === 'READ') return item.isRead;
    return true;
  });

  const getPriorityBadge = (priority?: NotificationPriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FB8205]/20 text-[#FB8205] border border-[#FB8205]/30">
            ÉLEVÉE
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#0BE9EF]/15 text-[#0BE9EF] border border-[#0BE9EF]/30">
            NORMALE
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-400">
            INFO
          </span>
        );
    }
  };

  const getCategoryIcon = (category?: NotificationCategory) => {
    switch (category) {
      case 'APPOINTMENTS':
        return <Calendar className="w-4 h-4 text-[#0BE9EF]" />;
      case 'BOOKINGS':
        return <Clock className="w-4 h-4 text-[#FB8205]" />;
      case 'PAYMENTS':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'MESSAGES':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'PROMOTIONS':
        return <Tag className="w-4 h-4 text-purple-400" />;
      case 'ANNIVERSAIRE':
        return <Gift className="w-4 h-4 text-pink-400" />;
      case 'LOYALTY':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'MARKETING':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryLabel = (category?: NotificationCategory) => {
    switch (category) {
      case 'APPOINTMENTS':
        return 'Rendez-vous';
      case 'BOOKINGS':
        return 'Réservation';
      case 'PAYMENTS':
        return 'Paiement';
      case 'MESSAGES':
        return 'Message';
      case 'SECURITY':
        return 'Sécurité';
      case 'PROMOTIONS':
        return 'Promotion';
      case 'ANNIVERSAIRE':
        return 'Anniversaire';
      case 'LOYALTY':
        return 'Pass Fidélité';
      case 'MARKETING':
        return 'Marketing';
      case 'DEMANDES':
        return 'Demande';
      case 'MARKETPLACE':
        return 'Opportunité';
      case 'SUBSCRIPTIONS':
        return 'Abonnement';
      default:
        return 'Système';
    }
  };

  const categoryChips: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL', label: 'Toutes', icon: <Bell className="w-3 h-3" /> },
    { id: 'APPOINTMENTS', label: 'Rendez-vous', icon: <Calendar className="w-3 h-3 text-[#0BE9EF]" /> },
    { id: 'BOOKINGS', label: 'Réservations', icon: <Clock className="w-3 h-3 text-[#FB8205]" /> },
    { id: 'PAYMENTS', label: 'Paiements', icon: <CreditCard className="w-3 h-3 text-emerald-400" /> },
    { id: 'MESSAGES', label: 'Messages', icon: <MessageSquare className="w-3 h-3 text-cyan-400" /> },
    { id: 'SECURITY', label: 'Sécurité', icon: <ShieldAlert className="w-3 h-3 text-red-400" /> },
    { id: 'PROMOTIONS', label: 'Promotions', icon: <Tag className="w-3 h-3 text-purple-400" /> },
    { id: 'ANNIVERSAIRE', label: 'Anniversaire', icon: <Gift className="w-3 h-3 text-pink-400" /> },
    { id: 'LOYALTY', label: 'Pass Fidélité', icon: <Award className="w-3 h-3 text-amber-400" /> },
    { id: 'MARKETING', label: 'Marketing', icon: <Sparkles className="w-3 h-3 text-indigo-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#020919] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A1428]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0BE9EF]/10 border border-[#0BE9EF]/30 flex items-center justify-center text-[#0BE9EF]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Centre de Notifications & Alertes
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FB8205] text-white text-xs font-bold">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">
                Canaux unifiés Flowexa : In-App, Email, SMS & WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerTest}
              title="Tester la chaîne de communication"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#0BE9EF]" />
              <span>Tester un envoi</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className="bg-[#0BE9EF]/10 border-b border-[#0BE9EF]/30 px-6 py-2.5 text-xs text-[#0BE9EF] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" /> {actionFeedback}
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-white/5 bg-[#020919]">
          <div className="flex gap-2 py-2">
            <button
              onClick={() => setActiveTab('INBOX')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'INBOX'
                  ? 'bg-[#0BE9EF]/20 text-[#0BE9EF] border border-[#0BE9EF]/40'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Boîte d'alertes</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#FB8205] text-[10px] text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('PREFERENCES')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'PREFERENCES'
                  ? 'bg-[#0BE9EF]/20 text-[#0BE9EF] border border-[#0BE9EF]/40'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Préférences de communication</span>
            </button>
          </div>

          {activeTab === 'INBOX' && unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#0BE9EF] transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tout marquer comme lu</span>
            </button>
          )}
        </div>

        {/* Tab 1: INBOX */}
        {activeTab === 'INBOX' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Filter Bar */}
            <div className="px-6 py-3 border-b border-white/5 bg-[#0A1428]/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-medium">Statut :</span>
                {(['ALL', 'UNREAD', 'READ'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#FB8205] text-white font-semibold'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {st === 'ALL' ? 'Toutes' : st === 'UNREAD' ? 'Non lues' : 'Lues'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-thin">
                <span className="text-gray-400 font-medium flex items-center gap-1 shrink-0 mr-1">
                  <Filter className="w-3.5 h-3.5 text-[#0BE9EF]" /> Filtre :
                </span>
                {categoryChips.map((cat) => {
                  const isActive = categoryFilter === cat.id;
                  const count = cat.id === 'ALL'
                    ? notifications.length
                    : notifications.filter((n) => n.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full whitespace-nowrap text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0BE9EF]/20 text-[#0BE9EF] border border-[#0BE9EF]/40 font-semibold shadow-sm shadow-[#0BE9EF]/20'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                      {count > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-[#0BE9EF] text-[#020919]'
                              : 'bg-white/10 text-gray-400'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {isLoading ? (
                <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#0BE9EF]" />
                  <span className="text-xs">Actualisation des alertes...</span>
                </div>
              ) : displayedNotifications.length === 0 ? (
                <div className="py-16 text-center text-gray-500 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400">
                    <Inbox className="w-7 h-7 opacity-50" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300">Aucune notification à afficher</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Vos rappels de rendez-vous, confirmations de réservation et alertes de paiement apparaîtront
                      ici en temps réel.
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerTest}
                    className="mt-2 text-xs text-[#0BE9EF] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Envoyer une notification de démonstration
                  </button>
                </div>
              ) : (
                displayedNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.isRead) handleMarkAsRead(notif.id);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      notif.isRead
                        ? 'bg-[#0A1428]/40 border-white/5 text-gray-400 hover:border-white/10'
                        : 'bg-[#0A1428]/90 border-[#0BE9EF]/30 text-white shadow-lg shadow-[#0BE9EF]/5 hover:border-[#0BE9EF]/60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1">
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getCategoryIcon(notif.category)}
                      </div>

                      {/* Content */}
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-wide">
                            {notif.title}
                          </span>
                          {getPriorityBadge(notif.priority)}
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                            {getCategoryLabel(notif.category)}
                          </span>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#FB8205] animate-pulse" />
                          )}
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
                          {notif.message}
                        </p>

                        {/* Canaux de délivrance & Horodatage */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {/* Badges des canaux */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-500">Diffusé via :</span>
                            {(notif.deliveryChannels && notif.deliveryChannels.length > 0
                              ? notif.deliveryChannels
                              : [notif.channel || 'INTERNAL']
                            ).map((ch, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-white/5 text-[9px] text-gray-400"
                              >
                                {ch === 'EMAIL' && <Mail className="w-2.5 h-2.5 text-sky-400" />}
                                {ch === 'SMS' && <Smartphone className="w-2.5 h-2.5 text-amber-400" />}
                                {ch === 'WHATSAPP' && <MessageSquare className="w-2.5 h-2.5 text-emerald-400" />}
                                {ch === 'INTERNAL' && <Bell className="w-2.5 h-2.5 text-cyan-400" />}
                                <span>{ch}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {notif.actionLabel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!notif.isRead) handleMarkAsRead(notif.id);
                            if (onNavigateTo && notif.actionUrl) {
                              onNavigateTo(notif.actionUrl, notif.requestId);
                            }
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0BE9EF]/20 hover:bg-[#0BE9EF]/30 text-[#0BE9EF] border border-[#0BE9EF]/40 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>{notif.actionLabel}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}

                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title="Marquer comme lu"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: PREFERENCES */}
        {activeTab === 'PREFERENCES' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-white">
            {/* Section 1: Canaux généraux */}
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0BE9EF]" />
                Canaux de réception globaux
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Activez les canaux de communication sur lesquels vous acceptez de recevoir des notifications.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {[
                  {
                    key: 'inApp',
                    label: 'Notifications In-App',
                    desc: 'Alertes instantanées dans la plateforme Flowexa',
                    icon: <Bell className="w-4 h-4 text-[#0BE9EF]" />,
                  },
                  {
                    key: 'email',
                    label: 'Emails',
                    desc: 'Confirmations formelles et reçus électroniques',
                    icon: <Mail className="w-4 h-4 text-sky-400" />,
                  },
                  {
                    key: 'sms',
                    label: 'SMS (Bénin & International)',
                    desc: 'Rappels prioritaires et notifications mobiles',
                    icon: <Smartphone className="w-4 h-4 text-amber-400" />,
                  },
                  {
                    key: 'whatsapp',
                    label: 'WhatsApp Business',
                    desc: 'Discussions instantanées et résumés de réservations',
                    icon: <MessageSquare className="w-4 h-4 text-emerald-400" />,
                  },
                ].map((ch) => {
                  const isChecked = (preferences.channels as any)[ch.key] !== false;
                  return (
                    <label
                      key={ch.key}
                      className="p-3.5 rounded-xl bg-[#0A1428]/60 border border-white/5 flex items-start justify-between gap-3 cursor-pointer hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mt-0.5">
                          {ch.icon}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{ch.label}</div>
                          <div className="text-[11px] text-gray-400 leading-snug mt-0.5">{ch.desc}</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            channels: {
                              ...preferences.channels,
                              [ch.key]: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 rounded text-[#0BE9EF] focus:ring-0 focus:outline-none mt-1 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Catégories Transactionnelles (NON DÉSACTIVABLES) */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Catégories Transactionnelles (Non désactivables)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ces alertes sont indispensables pour l'exécution des prestations, le suivi des rendez-vous et la sécurité de votre compte.
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  <Lock className="w-3 h-3" />
                  REQUIS PAR DÉFAUT
                </span>
              </div>

              <div className="space-y-2 mt-4">
                {[
                  {
                    key: 'appointments',
                    label: 'Rendez-vous & Prestations',
                    desc: 'Rappels 24h et 2h avant votre rendez-vous (Coiffure, Barbier, Institut, Spa, Garage, etc.)',
                    icon: <Calendar className="w-4 h-4 text-[#0BE9EF]" />,
                  },
                  {
                    key: 'bookings',
                    label: 'Réservations & Hébergements',
                    desc: 'Confirmations de séjour en Guest House, réservations de chambres et validation',
                    icon: <Clock className="w-4 h-4 text-[#FB8205]" />,
                  },
                  {
                    key: 'messages',
                    label: 'Messagerie & Échanges directs',
                    desc: 'Notifications de messages entre clients et professionnels partenaires',
                    icon: <MessageSquare className="w-4 h-4 text-cyan-400" />,
                  },
                  {
                    key: 'payments',
                    label: 'Paiements, Acomptes & Factures',
                    desc: 'Reçus de paiement Mobile Money, acomptes sécurisés et factures',
                    icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
                  },
                  {
                    key: 'security',
                    label: 'Sécurité & Authentification du compte',
                    desc: 'Alertes de connexion, codes de réinitialisation et validation de session',
                    icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
                  },
                ].map((cat) => (
                  <div
                    key={cat.key}
                    className="p-3 rounded-xl bg-[#0A1428]/40 border border-white/5 flex items-center justify-between gap-4 opacity-90"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        {cat.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          {cat.label}
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            NON DÉSACTIVABLE
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{cat.desc}</div>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      title="Cette catégorie transactionnelle ne peut pas être désactivée"
                      className="w-4 h-4 rounded text-emerald-400 focus:ring-0 cursor-not-allowed opacity-60"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Communications Marketing & Fidélisation (Désactivables par canal) */}
            <div className="pt-4 border-t border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FB8205]" />
                  Communications Marketing & Fidélisation (Désactivables par canal)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Conformément à l'APDP Bénin et au RGPD, vous choisissez librement les typologies d'offres et les canaux autorisés.
                </p>
              </div>

              {/* Sous-partie A: Canaux Marketing autorisés */}
              <div className="mt-4 p-4 rounded-xl bg-[#0A1428]/50 border border-white/10 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-[#0BE9EF]" />
                  Canaux autorisés pour l'envoi marketing :
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> },
                    { key: 'email', label: 'Email', icon: <Mail className="w-3.5 h-3.5 text-sky-400" /> },
                    { key: 'sms', label: 'SMS', icon: <Smartphone className="w-3.5 h-3.5 text-amber-400" /> },
                    { key: 'push', label: 'Web Push', icon: <Bell className="w-3.5 h-3.5 text-[#0BE9EF]" /> },
                  ].map((chan) => {
                    const isGranted = (preferences.marketingChannels as any)?.[chan.key] !== false;
                    return (
                      <label
                        key={chan.key}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isGranted
                            ? 'bg-[#0BE9EF]/10 border-[#0BE9EF]/30 text-white'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-xs font-medium">
                          {chan.icon}
                          {chan.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={isGranted}
                          onChange={(e) => {
                            setPreferences({
                              ...preferences,
                              marketingChannels: {
                                ...preferences.marketingChannels,
                                [chan.key]: e.target.checked,
                              },
                            });
                          }}
                          className="w-3.5 h-3.5 rounded text-[#0BE9EF] focus:ring-0 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
                <div className="text-[11px] text-gray-400 italic">
                  * Les envois marketing vérifient ce consentement au moment précis de l'envoi.
                </div>
              </div>

              {/* Sous-partie B: Catégories Marketing spécifiques */}
              <div className="space-y-2 mt-3">
                {[
                  {
                    key: 'promotions',
                    label: 'Promotions & Réductions exclusives',
                    desc: 'Bons plans, tarifs promotionnels et offres saisonnières des commerces Flowexa',
                    icon: <Tag className="w-4 h-4 text-purple-400" />,
                    badge: 'PROMOTIONS',
                    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                  },
                  {
                    key: 'anniversaire',
                    label: 'Offres & Cadeaux Anniversaire',
                    desc: 'Cadeaux de bienvenue, attentions sur-mesure et réductions le jour de votre anniversaire',
                    icon: <Gift className="w-4 h-4 text-pink-400" />,
                    badge: 'ANNIVERSAIRE',
                    badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
                  },
                  {
                    key: 'marketing',
                    label: 'Campagnes & Nouveautés de la plateforme',
                    desc: 'Lancements de nouveaux services, actualités des artisans partenaires et conseils',
                    icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
                    badge: 'MARKETING',
                    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                  },
                  {
                    key: 'loyalty',
                    label: 'Pass Fidélité Flowexa',
                    desc: 'Cumul de points fidélité, paliers avantages (Silver, Gold) et récompenses exclusives',
                    icon: <Award className="w-4 h-4 text-amber-400" />,
                    badge: 'FUTUR PASS',
                    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  },
                ].map((cat) => {
                  const isChecked = (preferences.categories as any)[cat.key] !== false;
                  return (
                    <div
                      key={cat.key}
                      className="p-3 rounded-xl bg-[#0A1428]/40 border border-white/5 flex items-center justify-between gap-4 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          {cat.icon}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-2">
                            {cat.label}
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${cat.badgeColor}`}>
                              {cat.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{cat.desc}</div>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          setPreferences({
                            ...preferences,
                            categories: {
                              ...preferences.categories,
                              [cat.key]: e.target.checked,
                            },
                          });
                        }}
                        className="w-4 h-4 rounded text-[#0BE9EF] focus:ring-0 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Registre des consentements horodatés (APDP Bénin / RGPD) */}
            <div className="pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowConsentLog(!showConsentLog)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#0A1428]/60 border border-white/10 hover:border-[#0BE9EF]/30 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-[#0BE9EF]" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Registre de vos consentements horodatés
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Conformité APDP Bénin & RGPD • {consentsHistory.length} entrée{consentsHistory.length > 1 ? 's' : ''} tracée{consentsHistory.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {showConsentLog ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {showConsentLog && (
                <div className="mt-3 p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pb-2 border-b border-white/5">
                    <span>État actif des consentements au moment de l'envoi :</span>
                    <span className="text-emerald-400 font-mono text-[10px]">VERIFIÉ EN DIRECT</span>
                  </div>

                  {/* Consent Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { channel: 'WHATSAPP', label: 'WhatsApp', category: 'MARKETING' },
                      { channel: 'EMAIL', label: 'Email', category: 'MARKETING' },
                      { channel: 'SMS', label: 'SMS', category: 'MARKETING' },
                      { channel: 'PUSH', label: 'Web Push', category: 'MARKETING' },
                    ].map((item) => {
                      const consentKey = `${item.channel}_${item.category}`;
                      const consentData = consentMatrix[consentKey];
                      const isGranted = consentData ? consentData.granted : (item.channel === 'SMS' ? false : true);
                      const timestamp = consentData?.timestamp
                        ? new Date(consentData.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                        : 'Initial (CGU)';

                      return (
                        <div
                          key={consentKey}
                          className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            {isGranted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                            )}
                            <div>
                              <div className="text-xs font-semibold text-white">
                                {item.label} • {item.category}
                              </div>
                              <div className="text-[10px] text-gray-400">{timestamp}</div>
                            </div>
                          </div>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isGranted
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-zinc-800 text-gray-400'
                            }`}
                          >
                            {isGranted ? 'ACCORDÉ' : 'RÉVOQUÉ'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {consentsHistory.length > 0 && (
                    <div className="pt-2 border-t border-white/5">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Dernières modifications horodatées :
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-[10px]">
                        {consentsHistory.slice(0, 5).map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between text-gray-300 py-0.5 border-b border-white/5"
                          >
                            <span className="truncate max-w-[200px]">
                              {entry.channel} ({entry.category}) : {entry.granted ? 'ACCORDÉ' : 'RÉVOQUÉ'}
                            </span>
                            <span className="text-gray-500 text-[9px]">
                              {new Date(entry.grantedAt || entry.revokedAt || '').toLocaleString('fr-FR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-4 flex items-center justify-between gap-3 border-t border-white/10">
              <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0BE9EF]" />
                Horodatage automatique de toute modification
              </span>

              <button
                onClick={handleSavePreferences}
                disabled={isSavingPrefs}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0BE9EF] to-[#00A3FF] text-[#020919] font-bold text-xs shadow-lg shadow-[#0BE9EF]/20 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {isSavingPrefs ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Enregistrer mes préférences</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#0A1428]/80 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Moteur de communication Flowexa B30 & Anti-Spam actif
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
