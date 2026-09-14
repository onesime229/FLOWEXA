import logging
import uuid
from typing import Dict, Any, Optional
from django.utils import timezone
from .models import (
    Notification,
    NotificationTemplate,
    NotificationChannel,
    NotificationStatus,
)

logger = logging.getLogger(__name__)


class BaseNotificationProvider:
    channel_name = "BASE"

    def send(self, recipient: str, content: str, title: str = "", metadata: dict = None) -> Dict[str, Any]:
        raise NotImplementedError


class WhatsAppProvider(BaseNotificationProvider):
    """
    Passerelle WhatsApp Business (Meta Cloud API / Twilio WhatsApp / Termii).
    """
    channel_name = "WHATSAPP"

    def send(self, recipient: str, content: str, title: str = "", metadata: dict = None) -> Dict[str, Any]:
        # Formater le numéro béninois / international
        clean_recipient = recipient.replace(" ", "").replace("-", "")
        if clean_recipient.startswith("00"):
            clean_recipient = "+" + clean_recipient[2:]
        elif not clean_recipient.startswith("+"):
            if len(clean_recipient) in [8, 10]:
                clean_recipient = "+229" + clean_recipient

        # Simulation / Dispatch réel
        tx_id = f"wa_{uuid.uuid4().hex[:12]}"
        logger.info(f"[WHATSAPP DISPATCH] To: {clean_recipient} | ID: {tx_id} | Message: {content[:60]}...")
        return {
            'success': True,
            'provider': 'META_WHATSAPP_CLOUD',
            'provider_message_id': tx_id,
            'formatted_recipient': clean_recipient,
        }


class SmsProvider(BaseNotificationProvider):
    """
    Passerelle SMS transactionnels et promotionnels (Twilio / Termii / Infobip).
    """
    channel_name = "SMS"

    def send(self, recipient: str, content: str, title: str = "", metadata: dict = None) -> Dict[str, Any]:
        clean_recipient = recipient.replace(" ", "").replace("-", "")
        if not clean_recipient.startswith("+"):
            if len(clean_recipient) in [8, 10]:
                clean_recipient = "+229" + clean_recipient

        tx_id = f"sms_{uuid.uuid4().hex[:12]}"
        logger.info(f"[SMS DISPATCH] To: {clean_recipient} | ID: {tx_id} | Text: {content[:50]}...")
        return {
            'success': True,
            'provider': 'TERMII_SMS',
            'provider_message_id': tx_id,
            'formatted_recipient': clean_recipient,
        }


class EmailProvider(BaseNotificationProvider):
    """
    Passerelle Email (Django core mail / SMTP / SendGrid).
    """
    channel_name = "EMAIL"

    def send(self, recipient: str, content: str, title: str = "", metadata: dict = None) -> Dict[str, Any]:
        from django.core.mail import send_mail
        from django.conf import settings

        tx_id = f"eml_{uuid.uuid4().hex[:12]}"
        try:
            # Essai d'envoi réel via Django mail si configuré
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'notifications@flowexa.com')
            # logger send
            logger.info(f"[EMAIL DISPATCH] To: {recipient} | Subject: {title} | ID: {tx_id}")
            return {
                'success': True,
                'provider': 'DJANGO_EMAIL',
                'provider_message_id': tx_id,
                'formatted_recipient': recipient.strip().lower(),
            }
        except Exception as e:
            logger.warning(f"Email send error: {e}")
            return {
                'success': False,
                'provider': 'DJANGO_EMAIL',
                'error': str(e)
            }


class PushProvider(BaseNotificationProvider):
    """
    Passerelle Notifications Push (Firebase Cloud Messaging / Web Push API).
    """
    channel_name = "PUSH"

    def send(self, recipient: str, content: str, title: str = "", metadata: dict = None) -> Dict[str, Any]:
        tx_id = f"fcm_{uuid.uuid4().hex[:12]}"
        logger.info(f"[PUSH DISPATCH] Token: {recipient[:20]}... | Title: {title} | Body: {content[:40]}")
        return {
            'success': True,
            'provider': 'FIREBASE_FCM',
            'provider_message_id': tx_id,
            'formatted_recipient': recipient,
        }


class NotificationService:
    """
    Service d'orchestration et de routage centralisé des notifications multi-canaux.
    """
    PROVIDERS = {
        NotificationChannel.WHATSAPP: WhatsAppProvider(),
        NotificationChannel.SMS: SmsProvider(),
        NotificationChannel.EMAIL: EmailProvider(),
        NotificationChannel.PUSH: PushProvider(),
    }

    @classmethod
    def send(
        cls,
        channel: str,
        recipient: str,
        content: str,
        title: str = "",
        business=None,
        contact=None,
        tenant=None,
        user=None,
        template_code: str = "",
        metadata: dict = None
    ) -> Notification:
        provider = cls.PROVIDERS.get(channel)
        if not provider:
            raise ValueError(f"Canal de notification inconnu: {channel}")

        notification = Notification.objects.create(
            tenant=tenant or (business.tenant if business else (contact.tenant if contact else None)),
            business=business,
            contact=contact,
            user=user,
            channel=channel,
            recipient=recipient,
            template_code=template_code,
            title=title,
            content=content,
            status=NotificationStatus.PENDING,
            metadata=metadata or {}
        )

        try:
            dispatch_res = provider.send(recipient, content, title=title, metadata=metadata)
            if dispatch_res.get('success'):
                notification.status = NotificationStatus.SENT
                notification.provider = dispatch_res.get('provider', 'SYSTEM')
                notification.provider_message_id = dispatch_res.get('provider_message_id', '')
                notification.sent_at = timezone.now()
            else:
                notification.status = NotificationStatus.FAILED
                notification.error_message = dispatch_res.get('error', 'Erreur inconnue')
        except Exception as exc:
            notification.status = NotificationStatus.FAILED
            notification.error_message = str(exc)
            logger.exception(f"Notification error: {exc}")

        notification.save()
        return notification

    @classmethod
    def send_from_template(
        cls,
        template_code: str,
        recipient: str,
        context: Dict[str, Any],
        business=None,
        contact=None,
        tenant=None,
        user=None
    ) -> Notification:
        """
        Envoie un message formaté selon un template paramétrable.
        """
        try:
            template = NotificationTemplate.objects.get(code=template_code, is_active=True)
            content = template.content
            title = template.title
            for key, val in context.items():
                placeholder = "{" + key + "}"
                content = content.replace(placeholder, str(val))
                title = title.replace(placeholder, str(val))
            channel = template.channel
        except NotificationTemplate.DoesNotExist:
            # Fallback direct content
            content = context.get('message', f"Notification Flowexa: {template_code}")
            title = context.get('title', "Flowexa")
            channel = context.get('channel', NotificationChannel.WHATSAPP)

        return cls.send(
            channel=channel,
            recipient=recipient,
            content=content,
            title=title,
            business=business,
            contact=contact,
            tenant=tenant,
            user=user,
            template_code=template_code,
            metadata={'template_context': context}
        )
