import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import TimeStampedModel


class AuditAction(models.TextChoices):
    BUSINESS_CREATE = 'BUSINESS_CREATE', _('Création entreprise')
    BUSINESS_UPDATE = 'BUSINESS_UPDATE', _('Modification entreprise')
    BUSINESS_SUSPEND = 'BUSINESS_SUSPEND', _('Suspension entreprise')
    BUSINESS_ACTIVATE = 'BUSINESS_ACTIVATE', _('Activation entreprise')
    BUSINESS_DELETE = 'BUSINESS_DELETE', _('Suppression entreprise')
    USER_ROLE_CHANGE = 'USER_ROLE_CHANGE', _('Changement rôle utilisateur')
    PRICE_OVERRIDE = 'PRICE_OVERRIDE', _('Ajustement tarifaire')
    SECURITY_ALERT = 'SECURITY_ALERT', _('Alerte sécurité')
    ITEM_DELETE = 'ITEM_DELETE', _('Suppression d\'élément')


class AuditLog(TimeStampedModel):
    """
    Journal d'audit immuable consignant toute action sensible effectuée
    par un Super Admin ou un gérant d'entreprise.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name=_('Utilisateur auteur')
    )
    user_email = models.EmailField(_('Email auteur au moment de l\'action'), blank=True)
    action = models.CharField(
        _('Action effectuée'),
        max_length=50,
        choices=AuditAction.choices,
        db_index=True
    )
    entity_type = models.CharField(_('Type d\'entité concernée'), max_length=100)
    entity_id = models.CharField(_('ID de l\'entité concernée'), max_length=100)
    description = models.TextField(_('Détails de l\'opération'))
    changes = models.JSONField(_('Différences avant / après'), default=dict, blank=True)
    ip_address = models.GenericIPAddressField(_('Adresse IP'), null=True, blank=True)

    class Meta:
        verbose_name = _('Journal d\'audit')
        verbose_name_plural = _('Journaux d\'audit')
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_action_display()}] {self.entity_type} {self.entity_id} par {self.user_email}"
