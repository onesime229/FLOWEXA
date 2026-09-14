import logging
from celery import shared_task
from django.core.cache import cache
from .services import NotificationService
from .models import Notification

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name='apps.notifications.tasks.send_notification_task',
    queue='notifications',
    max_retries=3,
    default_retry_delay=30,
    rate_limit='100/m'
)
def send_notification_task(self, channel: str, recipient: str, content: str, title: str = '', metadata: dict = None, idempotency_key: str = None):
    """
    Tâche asynchrone Celery d'envoi de notification (WhatsApp, SMS, Email, Push).
    - Queue dédiée: 'notifications'
    - Déduplication via clé d'idempotence
    - Retentative automatique avec exponential backoff
    """
    if idempotency_key:
        lock_key = f"notif_idemp_lock_{idempotency_key}"
        # Si la notification a déjà été traitée ou est en cours de traitement
        if not cache.add(lock_key, 'PROCESSING', timeout=300):
            logger.info(f"[Celery] Notification déjà traitée ou en cours (idempotence: {idempotency_key})")
            return {'status': 'DUPLICATE_IGNORED', 'idempotency_key': idempotency_key}

    try:
        result = NotificationService.send(
            channel=channel,
            recipient=recipient,
            content=content,
            title=title,
            metadata=metadata or {}
        )
        return {'status': 'SUCCESS', 'notification_id': str(result.id)}
    except Exception as exc:
        logger.error(f"[Celery] Erreur envoi notification (tentative {self.request.retries + 1}/3): {exc}")
        # Retry with exponential backoff
        countdown = (2 ** self.request.retries) * 15
        raise self.retry(exc=exc, countdown=countdown)


@shared_task(
    bind=True,
    name='apps.notifications.tasks.dispatch_campaign_batch_task',
    queue='campaigns',
    max_retries=2,
    rate_limit='50/m'
)
def dispatch_campaign_batch_task(self, campaign_id: str, recipient_batch: list, template_content: str, channel: str):
    """
    Tâche de diffusion groupée par lots pour campagnes SMS/WhatsApp.
    - Queue dédiée: 'campaigns'
    """
    logger.info(f"[Celery Campaign] Traitement du lot de {len(recipient_batch)} destinataires pour campagne {campaign_id}")
    success_count = 0
    failure_count = 0

    for recipient in recipient_batch:
        try:
            NotificationService.send(
                channel=channel,
                recipient=recipient,
                content=template_content,
                metadata={'campaign_id': campaign_id, 'batch': True}
            )
            success_count += 1
        except Exception as err:
            logger.warning(f"[Celery Campaign] Échec envoi à {recipient}: {err}")
            failure_count += 1

    return {
        'campaign_id': campaign_id,
        'success_count': success_count,
        'failure_count': failure_count
    }


@shared_task(
    name='apps.notifications.tasks.send_appointment_reminder_task',
    queue='communications'
)
def send_appointment_reminder_task(booking_id: str, client_phone: str, service_name: str, appointment_time: str):
    """
    Rappel automatique de rendez-vous ou réservation (J-1 ou H-2).
    - Queue dédiée: 'communications'
    """
    msg = f"Rappel FLOWEXA: Votre rendez-vous '{service_name}' est prévu le {appointment_time}. À très bientôt !"
    return NotificationService.send(
        channel='SMS',
        recipient=client_phone,
        content=msg,
        title="Rappel Rendez-vous",
        metadata={'booking_id': booking_id, 'reminder_type': 'APPOINTMENT'}
    )
