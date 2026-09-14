/**
 * FLOWEXA - ConsentService (Fidélisation & Conformité APDP/RGPD)
 * Gestionnaire des consentements horodatés multi-canaux (WHATSAPP, SMS, EMAIL, PUSH)
 * et multi-catégories (TRANSACTIONNEL vs MARKETING).
 *
 * RÈGLES STRICTES :
 * 1. Toute modification des notificationPreferences du user écrit une ligne de consentement horodatée.
 * 2. L'envoi marketing vérifie le consentement AU MOMENT EXACT de l'envoi.
 * 3. Les catégories transactionnelles (APPOINTMENTS, BOOKINGS, MESSAGES, PAYMENTS, SECURITY)
 *    ne sont PAS désactivables.
 * 4. Les catégories marketing (PROMOTIONS, ANNIVERSAIRE, MARKETING) sont désactivables par canal.
 */

import {
  ConsentCategory,
  ConsentChannel,
  ConsentEntity,
  NotificationCategory,
  NotificationPreferences,
} from '../../types';

export class ConsentService {
  private static instance: ConsentService;

  // Cache mémoire des consentements horodatés (historique complet ordonné)
  private consents: ConsentEntity[] = [];

  // Enregistrement des callbacks de synchronisation avec la base persistante
  private persistenceCallback?: (consents: ConsentEntity[]) => void;

  private constructor() {
    this.initDefaultConsents();
  }

  public static getInstance(): ConsentService {
    if (!ConsentService.instance) {
      ConsentService.instance = new ConsentService();
    }
    return ConsentService.instance;
  }

  public setPersistenceCallback(cb: (consents: ConsentEntity[]) => void) {
    this.persistenceCallback = cb;
  }

  public loadConsents(storedConsents: ConsentEntity[]) {
    if (Array.isArray(storedConsents) && storedConsents.length > 0) {
      this.consents = [...storedConsents];
    }
  }

  private initDefaultConsents() {
    const now = new Date(Date.now() - 86400000 * 5).toISOString();
    const channels: ConsentChannel[] = ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'];

    // Initialisation pour les comptes de test initiaux
    const defaultUsers = ['client-test-1', 'usr_pro_01', 'user-admin', 'default-user'];

    defaultUsers.forEach((uid) => {
      channels.forEach((ch) => {
        // Transactionnel (accordé par défaut à la création du compte / CGU)
        this.consents.push({
          id: `cst-${uid}-${ch.toLowerCase()}-trans-init`,
          userId: uid,
          channel: ch,
          category: 'TRANSACTIONNEL',
          granted: true,
          grantedAt: now,
          revokedAt: null,
          source: 'ONBOARDING_TERMS_OF_SERVICE',
        });

        // Marketing (accordé par défaut ou selon opt-in)
        this.consents.push({
          id: `cst-${uid}-${ch.toLowerCase()}-mkt-init`,
          userId: uid,
          channel: ch,
          category: 'MARKETING',
          granted: ch === 'EMAIL' || ch === 'WHATSAPP', // Email et WhatsApp accordés, SMS strict
          grantedAt: now,
          revokedAt: ch === 'SMS' ? now : null,
          source: 'USER_REGISTRATION_OPTIN',
        });
      });
    });
  }

  /**
   * Écrit une nouvelle ligne de consentement horodatée (journal d'audit immuable)
   */
  public recordConsent(params: {
    userId: string;
    channel: ConsentChannel;
    category: ConsentCategory;
    granted: boolean;
    source: string;
    grantedAt?: string;
    revokedAt?: string | null;
  }): ConsentEntity {
    const now = new Date().toISOString();
    const isGranted = !!params.granted;

    const previousRecord = this.getLatestConsent(params.userId, params.channel, params.category);

    const consentEntry: ConsentEntity = {
      id: `cst-${params.userId}-${params.channel.toLowerCase()}-${params.category.toLowerCase()}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 6)}`,
      userId: params.userId,
      channel: params.channel,
      category: params.category,
      granted: isGranted,
      grantedAt: isGranted ? params.grantedAt || now : previousRecord?.grantedAt || now,
      revokedAt: isGranted ? null : params.revokedAt || now,
      source: params.source || 'USER_PREFERENCES_UPDATE',
    };

    this.consents.push(consentEntry);

    if (this.persistenceCallback) {
      this.persistenceCallback(this.consents);
    }

    return consentEntry;
  }

  /**
   * Synchronise les consentements suite à la modification des notificationPreferences du user.
   * RÈGLE : Toute modification des notificationPreferences écrit une ligne de consentement.
   */
  public syncFromNotificationPreferences(
    userId: string,
    prefs: NotificationPreferences,
    source: string = 'NOTIFICATION_PREFERENCES_UPDATE'
  ): ConsentEntity[] {
    const channels: ConsentChannel[] = ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'];
    const createdConsents: ConsentEntity[] = [];

    // 1. Transactionnel : toujours granted = true (non-désactivable par règle métier)
    channels.forEach((ch) => {
      const entry = this.recordConsent({
        userId,
        channel: ch,
        category: 'TRANSACTIONNEL',
        granted: true,
        source: `${source}_TRANSACTIONAL`,
      });
      createdConsents.push(entry);
    });

    // 2. Marketing : déterminé par canal et catégories marketing (PROMOTIONS, ANNIVERSAIRE, MARKETING)
    const hasAnyMarketingCategory =
      prefs.categories.marketing !== false ||
      prefs.categories.promotions !== false ||
      prefs.categories.anniversaire !== false;

    channels.forEach((ch) => {
      const chKey = ch.toLowerCase() as keyof typeof prefs.channels;
      const channelGloballyActive = prefs.channels[chKey] !== false;

      // Consentement spécifique au canal marketing si fourni, sinon respecte le canal global
      let channelMarketingActive = channelGloballyActive;
      if (prefs.marketingChannels) {
        const mktKey = ch.toLowerCase() as keyof typeof prefs.marketingChannels;
        if (typeof prefs.marketingChannels[mktKey] === 'boolean') {
          channelMarketingActive = prefs.marketingChannels[mktKey];
        }
      }

      const isGranted = hasAnyMarketingCategory && channelMarketingActive;

      const entry = this.recordConsent({
        userId,
        channel: ch,
        category: 'MARKETING',
        granted: isGranted,
        source,
      });
      createdConsents.push(entry);
    });

    return createdConsents;
  }

  /**
   * Vérifie le consentement AU MOMENT de l'envoi.
   */
  public hasConsent(userId: string, channel: ConsentChannel | string, category: ConsentCategory): boolean {
    const normalizedChannel = channel.toUpperCase() as ConsentChannel;

    // Catégories transactionnelles : toujours autorisées (non-désactivables)
    if (category === 'TRANSACTIONNEL') {
      return true;
    }

    // Catégories marketing : vérifie le dernier consentement horodaté
    const latest = this.getLatestConsent(userId, normalizedChannel, 'MARKETING');
    if (!latest) {
      // Opt-in strict : en l'absence de consentement formel préalable, le marketing est refusé
      return false;
    }

    return latest.granted === true && !latest.revokedAt;
  }

  /**
   * Vérifie si une catégorie de notification est de nature marketing.
   */
  public isMarketingCategory(category?: NotificationCategory): boolean {
    if (!category) return false;
    return category === 'MARKETING' || category === 'PROMOTIONS' || category === 'ANNIVERSAIRE';
  }

  /**
   * Vérifie si une catégorie de notification est transactionnelle obligatoire (non désactivable).
   */
  public isTransactionalCategory(category?: NotificationCategory): boolean {
    if (!category) return false;
    return (
      category === 'APPOINTMENTS' ||
      category === 'BOOKINGS' ||
      category === 'MESSAGES' ||
      category === 'PAYMENTS' ||
      category === 'SECURITY'
    );
  }

  /**
   * Récupère le dernier état de consentement pour un utilisateur, canal et catégorie donnés.
   */
  public getLatestConsent(
    userId: string,
    channel: ConsentChannel,
    category: ConsentCategory
  ): ConsentEntity | null {
    const matches = this.consents.filter(
      (c) => c.userId === userId && c.channel === channel && c.category === category
    );
    if (matches.length === 0) return null;
    return matches[matches.length - 1];
  }

  /**
   * Récupère l'historique complet des consentements d'un utilisateur (ordonné par date décroissante)
   */
  public getUserConsentHistory(userId: string): ConsentEntity[] {
    return this.consents
      .filter((c) => c.userId === userId)
      .sort((a, b) => {
        const timeA = new Date(a.revokedAt || a.grantedAt).getTime();
        const timeB = new Date(b.revokedAt || b.grantedAt).getTime();
        return timeB - timeA;
      });
  }

  /**
   * Récupère la matrice des derniers consentements par canal pour un utilisateur
   */
  public getLatestConsentMatrix(userId: string): Record<ConsentChannel, { TRANSACTIONNEL: ConsentEntity | null; MARKETING: ConsentEntity | null }> {
    const channels: ConsentChannel[] = ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'];
    const matrix: any = {};

    channels.forEach((ch) => {
      matrix[ch] = {
        TRANSACTIONNEL: this.getLatestConsent(userId, ch, 'TRANSACTIONNEL'),
        MARKETING: this.getLatestConsent(userId, ch, 'MARKETING'),
      };
    });

    return matrix;
  }

  /**
   * Exporte tous les consentements pour la persistance
   */
  public getAllConsents(): ConsentEntity[] {
    return [...this.consents];
  }
}

export const consentService = ConsentService.getInstance();
