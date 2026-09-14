import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import ActiveModel, TimeStampedModel


class ConversationStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Active')
    CLOSED = 'CLOSED', _('Clôturée')


class MessageSenderRole(models.TextChoices):
    CLIENT = 'CLIENT', _('Client')
    BUSINESS = 'BUSINESS', _('Entreprise')
    SUPER_ADMIN = 'SUPER_ADMIN', _('Super Administrateur')


class Conversation(ActiveModel):
    """
    Fil de discussion direct entre un client et une entreprise Flowexa.
    Permet d'associer un contexte : offre catalogue, demande de service, réservation ou rendez-vous.
    Isolation stricte multi-tenant par entreprise et client.
    """
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='conversations',
        verbose_name=_('Organisation / Tenant')
    )
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='conversations',
        verbose_name=_('Entreprise')
    )
    client_user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='client_conversations',
        verbose_name=_('Utilisateur client (si inscrit)')
    )
    client_contact = models.ForeignKey(
        'crm.Contact',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations',
        verbose_name=_('Fiche contact CRM')
    )
    client_name = models.CharField(_('Nom complet client'), max_length=150)
    client_phone = models.CharField(_('Téléphone client'), max_length=35, blank=True)
    client_email = models.EmailField(_('Email client'), blank=True)

    # Liens contextuels optionnels (Zéro fiction : données réelles existantes uniquement)
    catalog_item = models.ForeignKey(
        'businesses.CatalogItem',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations',
        verbose_name=_('Offre catalogue concernée')
    )
    request_id = models.CharField(_('ID Demande liée'), max_length=100, blank=True, db_index=True)
    booking_id = models.CharField(_('ID Réservation liée'), max_length=100, blank=True, db_index=True)
    appointment_id = models.CharField(_('ID Rendez-vous lié'), max_length=100, blank=True, db_index=True)

    status = models.CharField(
        _('Statut de la conversation'),
        max_length=20,
        choices=ConversationStatus.choices,
        default=ConversationStatus.ACTIVE,
        db_index=True
    )

    # Cache de performance pour liste rapide
    last_message = models.TextField(_('Dernier message'), blank=True)
    last_message_at = models.DateTimeField(_('Date du dernier message'), null=True, blank=True, db_index=True)
    last_message_sender = models.CharField(
        _('Expéditeur du dernier message'),
        max_length=20,
        choices=MessageSenderRole.choices,
        blank=True
    )
    unread_count_client = models.PositiveIntegerField(_('Non lus par le client'), default=0)
    unread_count_business = models.PositiveIntegerField(_('Non lus par l\'entreprise'), default=0)

    closed_at = models.DateTimeField(_('Date de clôture'), null=True, blank=True)
    closed_by = models.CharField(_('Clôturé par'), max_length=150, blank=True)

    class Meta:
        verbose_name = _('Conversation')
        verbose_name_plural = _('Conversations')
        ordering = ['-last_message_at', '-updated_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['client_phone', 'status']),
            models.Index(fields=['request_id']),
            models.Index(fields=['booking_id']),
        ]

    def __str__(self):
        return f"Conversation #{str(self.id)[:8]} - {self.client_name} <-> {self.business.name}"


class Message(TimeStampedModel):
    """
    Message individuel d'une conversation Flowexa.
    Enregistre l'horodatage, l'expéditeur, le contenu et l'état de lecture.
    """
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name=_('Conversation')
    )
    sender_role = models.CharField(
        _('Rôle de l\'expéditeur'),
        max_length=20,
        choices=MessageSenderRole.choices,
        db_index=True
    )
    sender_id = models.CharField(_('Identifiant expéditeur'), max_length=100, db_index=True)
    sender_name = models.CharField(_('Nom affiché de l\'expéditeur'), max_length=150)
    content = models.TextField(_('Contenu du message'))

    is_read = models.BooleanField(_('Lu'), default=False, db_index=True)
    read_at = models.DateTimeField(_('Date et heure de lecture'), null=True, blank=True)

    # Préparation future pièces jointes (architecture extensible sans complexité inutile)
    attachments = models.JSONField(_('Pièces jointes'), default=list, blank=True)

    class Meta:
        verbose_name = _('Message')
        verbose_name_plural = _('Messages')
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['conversation', 'is_read']),
        ]

    def __str__(self):
        return f"Message de {self.sender_name} ({self.get_sender_role_display()}) - {str(self.id)[:8]}"
