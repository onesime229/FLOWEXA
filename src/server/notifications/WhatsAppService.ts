/**
 * FLOWEXA - WhatsAppService (Sprint B30)
 * Architecture propre pour l'intégration de WhatsApp Business API officielle.
 * CommunicationService -> WhatsAppProvider -> API officielle / fournisseur configuré.
 *
 * RÈGLE ABSOLUE :
 * Ne prétends JAMAIS qu'un message WhatsApp a été envoyé si aucune API réelle n'est connectée.
 * Si non configuré : renvoie "WhatsApp non configuré" (statut FAILED).
 */

import { CommunicationStatus } from '../../types';

export interface WhatsAppSendParams {
  toPhone: string;
  message: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface WhatsAppSendResult {
  success: boolean;
  status: CommunicationStatus;
  provider: string;
  providerRef?: string;
  error?: string;
  recipientPhone: string;
}

export class WhatsAppService {
  private static instance: WhatsAppService;

  private constructor() {}

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Vérifie si l'API officielle WhatsApp Cloud ou un fournisseur compatible est connecté.
   */
  public isConfigured(): boolean {
    const token = process.env.WHATSAPP_API_KEY;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    return !!(token && token.trim().length > 0 && phoneId && phoneId.trim().length > 0);
  }

  /**
   * Statut du connecteur WhatsApp pour l'administration.
   */
  public getProviderStatus(): {
    providerName: string;
    isConfigured: boolean;
    phoneNumberIdConfigured?: string;
  } {
    const isReady = this.isConfigured();
    return {
      providerName: 'WhatsApp Business Cloud API (Meta)',
      isConfigured: isReady,
      phoneNumberIdConfigured: process.env.WHATSAPP_PHONE_NUMBER_ID
        ? `ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID}`
        : undefined,
    };
  }

  /**
   * Envoi d'un message WhatsApp transactionnel.
   */
  public async sendWhatsApp(params: WhatsAppSendParams): Promise<WhatsAppSendResult> {
    const isReady = this.isConfigured();

    if (!isReady) {
      return {
        success: false,
        status: 'FAILED',
        provider: 'WHATSAPP_CLOUD_API',
        recipientPhone: params.toPhone,
        error: 'WhatsApp non configuré (API officielle non connectée dans les variables serveur)',
      };
    }

    const cleanPhone = (params.toPhone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      return {
        success: false,
        status: 'FAILED',
        provider: 'WHATSAPP_CLOUD_API',
        recipientPhone: params.toPhone,
        error: 'Numéro WhatsApp destinataire invalide.',
      };
    }

    try {
      const token = process.env.WHATSAPP_API_KEY!;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
      const endpoint = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { preview_url: false, body: params.message },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json: any = await res.json().catch(() => ({}));
        const wamid = json?.messages?.[0]?.id;
        return {
          success: true,
          status: 'SENT',
          provider: 'WHATSAPP_OFFICIAL_CLOUD',
          providerRef: wamid || undefined,
          recipientPhone: cleanPhone,
        };
      } else {
        const errText = await res.text().catch(() => 'Erreur API WhatsApp');
        return {
          success: false,
          status: 'FAILED',
          provider: 'WHATSAPP_OFFICIAL_CLOUD',
          recipientPhone: cleanPhone,
          error: `Erreur WhatsApp Cloud (${res.status}) : ${errText}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        provider: 'WHATSAPP_CLOUD_API',
        recipientPhone: cleanPhone,
        error: `Erreur inattendue WhatsAppService : ${err?.message || String(err)}`,
      };
    }
  }
}

export const whatsAppService = WhatsAppService.getInstance();
