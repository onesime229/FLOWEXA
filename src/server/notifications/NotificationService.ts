/**
 * FLOWEXA - NotificationService (Sprint B30)
 * Moteur unifié de notification de FLOWEXA.
 * Connecte les événements métiers, gère les priorités, l'anti-spam (idempotence/cooldown),
 * le respect des préférences utilisateurs et l'aiguillage multi-canal vers CommunicationService.
 */

import {
  FlowexaNotificationItem,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotificationRecipientType,
  NotificationPreferences,
} from '../../types';
import { communicationService } from './CommunicationService';
import { consentService } from './ConsentService';

export interface CreateNotificationParams {
  recipientType: NotificationRecipientType;
  recipientId: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  requestId?: string;
  interactionType?: any;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
  tenantId?: string;
}

export class NotificationService {
  private static instance: NotificationService;

  // Cache anti-spam / déduplication en mémoire : clé => timestamp
  private idempotencyCache: Map<string, number> = new Map();
  private readonly DEDUPLICATION_WINDOW_MS = 60 * 1000; // 60 secondes anti-doublon

  // Préférences utilisateurs en mémoire (initialisées par défaut)
  private userPreferencesMap: Map<string, NotificationPreferences> = new Map();

  // Écouteurs temps réel
  private listeners: Array<(notif: FlowexaNotificationItem) => void> = [];

  private constructor() {
    // Nettoyage périodique du cache anti-spam
    setInterval(() => {
      const now = Date.now();
      for (const [key, time] of this.idempotencyCache.entries()) {
        if (now - time > this.DEDUPLICATION_WINDOW_MS * 5) {
          this.idempotencyCache.delete(key);
        }
      }
    }, 120000);
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Obtient les préférences d'un utilisateur ou les valeurs par défaut
   */
  public getUserPreferences(userId: string): NotificationPreferences {
    const existing = this.userPreferencesMap.get(userId);
    if (existing) return existing;

    const defaultPrefs: NotificationPreferences = {
      channels: {
        inApp: true,
        email: true,
        sms: true,
        whatsapp: true,
        push: true,
      },
      categories: {
        // Catégories transactionnelles (STRICTEMENT NON DÉSACTIVABLES)
        appointments: true,
        bookings: true,
        messages: true,
        payments: true,
        security: true,
        reviews: true,
        marketplace: true,
        subscriptions: true,
        loyalty: true,
        // Catégories marketing (DÉSACTIVABLES par canal)
        marketing: true,
        promotions: true,
        anniversaire: true,
      },
      marketingChannels: {
        email: true,
        sms: false, // SMS marketing désactivé par défaut (protection utilisateur)
        whatsapp: true,
        push: true,
      },
    };

    this.userPreferencesMap.set(userId, defaultPrefs);
    return defaultPrefs;
  }

  /**
   * Met à jour les préférences de notification d'un utilisateur.
   * RÈGLE STRICTE : Toute modification des notificationPreferences écrit une ligne de consentement horodatée.
   */
  public updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
    source: string = 'USER_PREFERENCES_UPDATE'
  ): NotificationPreferences {
    const current = this.getUserPreferences(userId);

    const merged: NotificationPreferences = {
      channels: {
        ...current.channels,
        ...(updates.channels || {}),
      },
      categories: {
        ...current.categories,
        ...(updates.categories || {}),
        // RÈGLE ABSOLUE : Les catégories transactionnelles ne sont JAMAIS désactivables
        appointments: true,
        bookings: true,
        messages: true,
        payments: true,
        security: true,
      },
      marketingChannels: {
        ...(current.marketingChannels || { email: true, sms: false, whatsapp: true, push: true }),
        ...(updates.marketingChannels || {}),
      },
      marketingByChannel: {
        ...(current.marketingByChannel || {}),
        ...(updates.marketingByChannel || {}),
      },
    };

    this.userPreferencesMap.set(userId, merged);

    // Écrit les consentements horodatés associés (APDP / RGPD)
    consentService.syncFromNotificationPreferences(userId, merged, source);

    return merged;
  }

  /**
   * Enregistre un écouteur temps réel
   */
  public subscribe(listener: (notif: FlowexaNotificationItem) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Déclencheur centralisé de notification.
   * Gère la déduplication, la priorité, l'enregistrement in-app et l'envoi multi-canaux.
   */
  public notify(params: CreateNotificationParams): {
    success: boolean;
    notification?: FlowexaNotificationItem;
    skippedReason?: string;
  } {
    // 1. Détermination de la catégorie par défaut
    const category: NotificationCategory = params.category || this.inferCategory(params.title, params.interactionType);

    // 2. Détermination de la priorité appropriée
    const priority: NotificationPriority = params.priority || this.inferPriority(category, params.title);

    // 3. Déduplication & Anti-Spam
    const idempotencyKey =
      params.idempotencyKey ||
      `${params.recipientType}_${params.recipientId}_${category}_${params.requestId || 'gen'}_${params.title.slice(0, 20)}`;

    const now = Date.now();
    const lastSentTime = this.idempotencyCache.get(idempotencyKey);
    if (lastSentTime && now - lastSentTime < this.DEDUPLICATION_WINDOW_MS) {
      return {
        success: false,
        skippedReason: `Anti-spam : notification identique récemment émise (clé: ${idempotencyKey})`,
      };
    }
    this.idempotencyCache.set(idempotencyKey, now);

    // 4. Vérification des préférences destinataire (si clientId ou userId)
    const prefs = this.getUserPreferences(params.recipientId);
    if (!this.isCategoryAllowed(category, prefs)) {
      return {
        success: false,
        skippedReason: `Catégorie [${category}] désactivée par les préférences utilisateur`,
      };
    }

    // 5. Détermination des canaux autorisés
    const requestedChannels: NotificationChannel[] =
      params.channels && params.channels.length > 0 ? params.channels : ['INTERNAL'];
    let activeChannels: NotificationChannel[] = requestedChannels.filter((ch) =>
      this.isChannelAllowed(ch, prefs)
    );

    // VÉRIFICATION DU CONSENTEMENT AU MOMENT DE L'ENVOI (Règle RGPD / APDP)
    // Pour toute notification marketing (MARKETING, PROMOTIONS, ANNIVERSAIRE),
    // chaque canal externe vérifie le consentement horodaté au moment exact de l'envoi.
    if (consentService.isMarketingCategory(category)) {
      activeChannels = activeChannels.filter((ch) => {
        if (ch === 'INTERNAL') return true; // In-app toujours permis si la catégorie est active
        return consentService.hasConsent(params.recipientId, ch, 'MARKETING');
      });
    }

    // Si aucun canal n'est autorisé
    if (activeChannels.length === 0) {
      // Si c'est du marketing et que tous les canaux sont refusés par manque de consentement
      if (consentService.isMarketingCategory(category)) {
        return {
          success: false,
          skippedReason: `Envoi marketing [${category}] ignoré : aucun consentement actif accordé pour ${params.recipientId}`,
        };
      }
      activeChannels.push('INTERNAL'); // Fallback in-app minimum garanti pour transactionnel
    }

    // 6. Création de l'entité Notification In-App
    const notifItem: FlowexaNotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipientType: params.recipientType,
      recipientId: params.recipientId,
      recipientName: params.recipientName,
      title: params.title,
      message: params.message,
      category,
      priority,
      channel: activeChannels[0] || 'INTERNAL',
      deliveryChannels: activeChannels,
      isRead: false,
      requestId: params.requestId,
      interactionType: params.interactionType,
      actionUrl: params.actionUrl || this.inferActionUrl(category, params.requestId),
      actionLabel: params.actionLabel || this.inferActionLabel(category),
      metadata: params.metadata,
      idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    // 7. Dispatch asynchrone vers chaque canal externe via CommunicationService
    for (const channel of activeChannels) {
      communicationService.dispatch({
        recipientId: params.recipientId,
        recipientType: params.recipientType,
        recipientName: params.recipientName,
        recipientEmail: params.recipientEmail,
        recipientPhone: params.recipientPhone,
        channel,
        category,
        title: params.title,
        message: params.message,
        priority,
        eventId: params.requestId,
        eventType: category,
        tenantId: params.tenantId,
        metadata: params.metadata,
      });
    }

    // 8. Diffusion aux écouteurs temps réel
    this.listeners.forEach((listener) => {
      try {
        listener(notifItem);
      } catch (err) {
        // Safe failover
      }
    });

    return {
      success: true,
      notification: notifItem,
    };
  }

  private isCategoryAllowed(category: NotificationCategory, prefs: NotificationPreferences): boolean {
    // Les catégories transactionnelles sont STRICTEMENT NON DÉSACTIVABLES
    if (
      category === 'SECURITY' ||
      category === 'APPOINTMENTS' ||
      category === 'BOOKINGS' ||
      category === 'MESSAGES' ||
      category === 'PAYMENTS'
    ) {
      return true;
    }

    switch (category) {
      case 'REVIEWS':
        return prefs.categories.reviews !== false;
      case 'MARKETPLACE':
        return prefs.categories.marketplace !== false;
      case 'SUBSCRIPTIONS':
        return prefs.categories.subscriptions !== false;
      case 'LOYALTY':
        return prefs.categories.loyalty !== false;
      // Catégories marketing : désactivables
      case 'PROMOTIONS':
        return prefs.categories.promotions !== false;
      case 'ANNIVERSAIRE':
        return prefs.categories.anniversaire !== false;
      case 'MARKETING':
        return prefs.categories.marketing !== false;
      default:
        return true;
    }
  }

  private isChannelAllowed(channel: NotificationChannel, prefs: NotificationPreferences): boolean {
    switch (channel) {
      case 'INTERNAL':
        return prefs.channels.inApp;
      case 'EMAIL':
        return prefs.channels.email;
      case 'SMS':
        return prefs.channels.sms;
      case 'WHATSAPP':
        return prefs.channels.whatsapp;
      case 'PUSH':
        return prefs.channels.push;
      default:
        return true;
    }
  }

  private inferCategory(title: string, interactionType?: any): NotificationCategory {
    const lower = title.toLowerCase();
    if (lower.includes('sécurité') || lower.includes('mot de passe') || lower.includes('connexion')) return 'SECURITY';
    if (lower.includes('anniversaire') || lower.includes('birthday') || lower.includes('fête')) return 'ANNIVERSAIRE';
    if (lower.includes('promotion') || lower.includes('promo') || lower.includes('réduction') || lower.includes('remise') || lower.includes('bon plan')) return 'PROMOTIONS';
    if (lower.includes('fidélité') || lower.includes('loyalty') || lower.includes('pass') || lower.includes('points') || lower.includes('récompense')) return 'LOYALTY';
    if (lower.includes('rendez-vous') || lower.includes('visite') || interactionType === 'APPOINTMENT')
      return 'APPOINTMENTS';
    if (lower.includes('réservation') || lower.includes('chambre') || interactionType === 'BOOKING') return 'BOOKINGS';
    if (lower.includes('paiement') || lower.includes('facture') || lower.includes('acompte')) return 'PAYMENTS';
    if (lower.includes('message') || lower.includes('discussion')) return 'MESSAGES';
    if (lower.includes('avis') || lower.includes('étoile') || lower.includes('commentaire')) return 'REVIEWS';
    if (lower.includes('opportunité') || lower.includes('devis') || lower.includes('marketplace')) return 'MARKETPLACE';
    if (lower.includes('demande')) return 'DEMANDES';
    if (lower.includes('abonnement') || lower.includes('forfait')) return 'SUBSCRIPTIONS';
    if (lower.includes('campagne') || lower.includes('newsletter')) return 'MARKETING';
    return 'SYSTEM';
  }

  private inferPriority(category: NotificationCategory, title: string): NotificationPriority {
    const lower = title.toLowerCase();
    if (category === 'SECURITY' || lower.includes('critique') || lower.includes('suspecte')) return 'URGENT';
    if (lower.includes('échoué') || lower.includes('dans 2h') || lower.includes('expiration') || lower.includes('solde'))
      return 'HIGH';
    if (category === 'MESSAGES' || category === 'DEMANDES' || category === 'BOOKINGS') return 'NORMAL';
    return 'LOW';
  }

  private inferActionUrl(category: NotificationCategory, requestId?: string): string {
    if (requestId) {
      return `#request-${requestId}`;
    }
    switch (category) {
      case 'MESSAGES':
        return '#conversations';
      case 'APPOINTMENTS':
        return '#appointments';
      case 'BOOKINGS':
        return '#bookings';
      case 'PAYMENTS':
        return '#payments';
      case 'MARKETPLACE':
        return '#marketplace';
      case 'PROMOTIONS':
        return '#promotions';
      case 'ANNIVERSAIRE':
        return '#anniversaire';
      case 'LOYALTY':
        return '#loyalty';
      default:
        return '#dashboard';
    }
  }

  private inferActionLabel(category: NotificationCategory): string {
    switch (category) {
      case 'MESSAGES':
        return 'Ouvrir le chat';
      case 'APPOINTMENTS':
        return 'Voir le rendez-vous';
      case 'BOOKINGS':
        return 'Consulter la réservation';
      case 'PAYMENTS':
        return 'Voir la transaction';
      case 'MARKETPLACE':
        return 'Consulter l’opportunité';
      case 'PROMOTIONS':
        return 'Profiter de l’offre';
      case 'ANNIVERSAIRE':
        return 'Découvrir le cadeau';
      case 'LOYALTY':
        return 'Voir mon Pass';
      default:
        return 'Voir les détails';
    }
  }
}

export const notificationService = NotificationService.getInstance();
