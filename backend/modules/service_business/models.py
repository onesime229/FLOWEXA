from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.tenants.models import TenantAwareModel
from apps.core.models import ActiveModel
from apps.businesses.models import BusinessModule


class ServiceItem(TenantAwareModel):
    """
    Prestation, forfait ou article proposé par une entreprise
    (Coiffure, Barbier, Institut, Spa, Photographe, Broderie, Garage, Pharmacie).
    Chaque entreprise définit ses propres prix en FCFA.
    """
    module_code = models.CharField(
        _('Module métier'),
        max_length=40,
        choices=BusinessModule.choices,
        db_index=True
    )
    name = models.CharField(_('Nom de la prestation ou du produit'), max_length=200)
    category = models.CharField(_('Sous-catégorie'), max_length=100, blank=True)
    price = models.DecimalField(_('Prix défini par l\'entreprise (FCFA)'), max_digits=12, decimal_places=0)
    duration_minutes = models.PositiveIntegerField(_('Durée estimée (minutes)'), default=45)
    description = models.TextField(_('Description détaillée'), blank=True)
    is_active = models.BooleanField(_('Disponible / Actif'), default=True)
    is_featured = models.BooleanField(_('Mis en avant'), default=False)
    specifications = models.JSONField(_('Détails spécifiques métier (garantie, dosage, matériel)'), default=dict, blank=True)

    class Meta:
        verbose_name = _('Prestation / Service')
        verbose_name_plural = _('Prestations / Services')
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.price:,} FCFA) - {self.business.name} [{self.get_module_code_display()}]"


class ServiceImage(ActiveModel):
    """
    Photos des réalisations, coupes, soins, atelier ou salon.
    """
    service = models.ForeignKey(
        ServiceItem,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('Service / Prestation')
    )
    image = models.FileField(_('Fichier photo'), upload_to='service_photos/')
    title = models.CharField(_('Titre / Réalisation'), max_length=150, blank=True)
    is_cover = models.BooleanField(_('Photo principale'), default=False)
    order = models.PositiveIntegerField(_('Ordre'), default=0)

    class Meta:
        verbose_name = _('Photo de réalisation')
        verbose_name_plural = _('Photos de réalisations')
        ordering = ['order', '-created_at']


class Appointment(TenantAwareModel):
    """
    Rendez-vous client ou ordre d'intervention (Garage, Coiffure, Soin, Shooting).
    """
    service = models.ForeignKey(
        ServiceItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
        verbose_name=_('Prestation')
    )
    client_name = models.CharField(_('Nom du client'), max_length=150)
    client_phone = models.CharField(_('Téléphone contact'), max_length=30, blank=True)
    scheduled_at = models.DateTimeField(_('Date et heure prévue'))
    total_price = models.DecimalField(_('Montant (FCFA)'), max_digits=12, decimal_places=0)
    status = models.CharField(_('Statut'), max_length=30, default='CONFIRME')
    notes = models.TextField(_('Consignes ou détails techniques'), blank=True)

    class Meta:
        verbose_name = _('Rendez-vous / Ordre d\'intervention')
        verbose_name_plural = _('Rendez-vous / Ordres d\'intervention')
        ordering = ['-scheduled_at']
