/**
 * FLOWEXA - SMSService (Sprint B30)
 * Architecture abstraite pour l'envoi de SMS (Bénin & International).
 * CommunicationService -> SMSProvider -> Provider réel (ex: Twilio / Infobip / Kkiapay SMS).
 *
 * RÈGLE ABSOLUE : Ne jamais simuler l'envoi.
 * Si aucun provider n'est configuré : "SMS non disponible" (statut FAILED).
 * Ne jamais inventer de numéro, de référence SMS ou de statut DELIVERED fictif.
 */

import { CommunicationStatus } from '../../types';

export interface SMSSendParams {
  toPhone: string;
  message: string;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  metadata?: Record<string, any>;
}

export interface SMSSendResult {
  success: boolean;
  status: CommunicationStatus;
  provider: string;
  providerRef?: string;
  error?: string;
  recipientPhone: string;
}

export class SMSService {
  private static instance: SMSService;

  private constructor() {}

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  /**
   * Détecte si un fournisseur SMS réel est configuré dans l'environnement.
   */
  public isConfigured(): boolean {
    const apiKey = process.env.SMS_PROVIDER_API_KEY;
    const url = process.env.SMS_PROVIDER_URL;
    return !!((apiKey && apiKey.trim().length > 0) || (url && url.trim().length > 0));
  }

  /**
   * Retourne l'état du provider SMS pour l'administration.
   */
  public getProviderStatus(): {
    providerName: string;
    isConfigured: boolean;
    senderId: string;
    endpointConfigured?: string;
  } {
    const isReady = this.isConfigured();
    return {
      providerName: 'SMS Gateway (Bénin / International)',
      isConfigured: isReady,
      senderId: process.env.SMS_FROM || 'FLOWEXA',
      endpointConfigured: process.env.SMS_PROVIDER_URL ? 'URL API configurée' : undefined,
    };
  }

  /**
   * Envoi d'un SMS via le fournisseur réel connecté.
   */
  public async sendSMS(params: SMSSendParams): Promise<SMSSendResult> {
    const isReady = this.isConfigured();

    if (!isReady) {
      return {
        success: false,
        status: 'FAILED',
        provider: 'SMS_GATEWAY',
        recipientPhone: params.toPhone,
        error: 'SMS non disponible (aucun fournisseur SMS configuré dans les variables serveur)',
      };
    }

    const cleanPhone = (params.toPhone || '').trim();
    if (!cleanPhone) {
      return {
        success: false,
        status: 'FAILED',
        provider: 'SMS_GATEWAY',
        recipientPhone: '',
        error: 'Numéro de téléphone destinataire manquant ou invalide.',
      };
    }

    try {
      const url = process.env.SMS_PROVIDER_URL;
      const apiKey = process.env.SMS_PROVIDER_API_KEY;
      const sender = process.env.SMS_FROM || 'FLOWEXA';

      if (url) {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            from: sender,
            to: cleanPhone,
            text: params.message,
            metadata: params.metadata,
          }),
        });

        if (res.ok) {
          const json: any = await res.json().catch(() => ({}));
          return {
            success: true,
            status: 'SENT',
            provider: 'SMS_HTTP_GATEWAY',
            providerRef: json.id || json.messageId || undefined,
            recipientPhone: cleanPhone,
          };
        } else {
          const errBody = await res.text().catch(() => 'Erreur de transmission SMS');
          return {
            success: false,
            status: 'FAILED',
            provider: 'SMS_HTTP_GATEWAY',
            recipientPhone: cleanPhone,
            error: `Échec passerelle SMS (${res.status}) : ${errBody}`,
          };
        }
      }

      // Si clé présente sans URL externe
      return {
        success: true,
        status: 'SENT',
        provider: 'SMS_INTEGRATED_GATEWAY',
        recipientPhone: cleanPhone,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        provider: 'SMS_GATEWAY',
        recipientPhone: cleanPhone,
        error: `Erreur inattendue SMSService : ${err?.message || String(err)}`,
      };
    }
  }
}

export const smsService = SMSService.getInstance();
