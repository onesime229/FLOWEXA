import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import ActiveModel, TimeStampedModel


class NotificationChannel(models.TextChoices):
    WHATSAPP = 'WHATSAPP', _('WhatsApp Business')
    SMS = 'SMS', _('Message SMS')
    EMAIL = 'EMAIL', _('Courrier électronique')
    PUSH = 'PUSH', _('Notification Push Mobile/Web')


class NotificationStatus(models.TextChoices):
    PENDING = 'PENDING', _('En attente d\'envoi')
    SENT = 'SENT', _('Envoyé au fournisseur')
    DELIVERED = 'DELIVERED', _('Délivré au destinataire')
    FAILED = 'FAILED', _('Échec d\'envoi')


class NotificationTemplate(ActiveModel):
    """
    Modèle de notification réutilisable avec balises {nom}, {entreprise}, {date}, etc.
    """
    code = models.SlugField(_('Code unique du template'), max_length=100, unique=True)
    channel = models.CharField(
        _('Canal'),
        max_length=20,
        choices=NotificationChannel.choices,
        default=NotificationChannel.WHATSAPP
    )
    title = models.CharField(_('Objet / Titre du message'), max_length=255)
    content = models.TextField(_('Corps du message avec variables'))
    variables_description = models.JSONField(
        _('Liste des variables supportées'),
        default=list,
        blank=True
    )

    class Meta:
        verbose_name = _('Template de notification')
        verbose_name_plural = _('Templates de notifications')

    def __str__(self):
        return f"[{self.get_channel_display()}] {self.code} - {self.title}"


class Notification(ActiveModel):
    """
    Historique et enregistrement de chaque notification transmise.
    """
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
        verbose_name=_('Organisation')
    )
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.SET_NULL,
        related_name='notifications',
        null=True,
        blank=True,
        verbose_name=_('Entreprise expéditrice')
    )
    contact = models.ForeignKey(
        'crm.Contact',
        on_delete=models.SET_NULL,
        related_name='notifications',
        null=True,
        blank=True,
        verbose_name=_('Contact destinataire (si CRM)')
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        related_name='notifications',
        null=True,
        blank=True,
        verbose_name=_('Utilisateur lié')
    )
    channel = models.CharField(
        _('Canal d\'envoi'),
        max_length=20,
        choices=NotificationChannel.choices,
        db_index=True
    )
    recipient = models.CharField(
        _('Destinataire (numéro ou email ou token)'),
        max_length=255,
        db_index=True
    )
    template_code = models.CharField(_('Code du template utilisé'), max_length=100, blank=True)
    title = models.CharField(_('Objet / Titre'), max_length=255, blank=True)
    content = models.TextField(_('Contenu final envoyé'))

    status = models.CharField(
        _('Statut de livraison'),
        max_length=20,
        choices=NotificationStatus.choices,
        default=NotificationStatus.PENDING,
        db_index=True
    )
    provider = models.CharField(_('Fournisseur passerelle'), max_length=60, default='SYSTEM')
    provider_message_id = models.CharField(_('ID transaction fournisseur'), max_length=255, blank=True)
    error_message = models.TextField(_('Détail de l\'erreur si échec'), blank=True)

    sent_at = models.DateTimeField(_('Envoyé à'), null=True, blank=True)
    delivered_at = models.DateTimeField(_('Délivré à'), null=True, blank=True)
    read_at = models.DateTimeField(_('Lu à'), null=True, blank=True)
    metadata = models.JSONField(_('Données techniques et de tracking'), default=dict, blank=True)

    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'read_at']),
            models.Index(fields=['tenant', 'status', 'created_at']),
            models.Index(fields=['business', 'status', 'created_at']),
            models.Index(fields=['recipient', 'status']),
        ]

    def __str__(self):
        return f"[{self.channel}] -> {self.recipient} ({self.status})"
