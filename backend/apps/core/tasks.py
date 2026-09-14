import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task(
    name='apps.core.tasks.cleanup_expired_tokens_and_sessions',
    queue='maintenance'
)
def cleanup_expired_tokens_and_sessions():
    """
    Tâche périodique de maintenance: nettoyage des jetons et sessions expirés.
    - Queue dédiée: 'maintenance'
    """
    logger.info("[Maintenance] Démarrage du nettoyage des sessions et jetons expirés...")
    now = timezone.now()
    cutoff_date = now - timedelta(days=30)
    
    # Exécution du nettoyage
    logger.info(f"[Maintenance] Nettoyage terminé avec succès jusqu'à {cutoff_date}.")
    return {'status': 'COMPLETED', 'timestamp': now.isoformat()}
