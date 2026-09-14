from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.tenants.models import TenantAwareModel
from apps.core.models import ActiveModel


class RoomCategory(models.TextChoices):
    STANDARD = 'STANDARD', _('Chambre Standard')
    CONFORT = 'CONFORT', _('Chambre Confort')
    DELUXE = 'DELUXE', _('Chambre Deluxe')
    SUITE = 'SUITE', _('Suite Junior / Exécutive')
    STUDIO = 'STUDIO', _('Studio Meublé')
    BUNGALOW = 'BUNGALOW', _('Bungalow / Case Créole')


class RoomStatus(models.TextChoices):
    DISPONIBLE = 'DISPONIBLE', _('Disponible')
    OCCUPEE = 'OCCUPEE', _('Occupée / En séjour')
    RESERVEE = 'RESERVEE', _('Réservée')
    NETTOYAGE = 'NETTOYAGE', _('Ménage / Entretien')
    HORS_SERVICE = 'HORS_SERVICE', _('Hors service')


class Room(TenantAwareModel):
    """
    Chambre ou hébergement géré par un établissement Guest House.
    """
    room_number = models.CharField(_('Numéro ou code chambre'), max_length=50)
    name = models.CharField(_('Nom commercial de la chambre'), max_length=150)
    category = models.CharField(
        _('Catégorie'),
        max_length=30,
        choices=RoomCategory.choices,
        default=RoomCategory.STANDARD
    )
    price_per_night = models.DecimalField(_('Tarif par nuitée (FCFA)'), max_digits=12, decimal_places=0)
    capacity = models.PositiveSmallIntegerField(_('Capacité personnes'), default=2)
    bed_type = models.CharField(_('Type de lit'), max_length=100, default='Lit Queen Size')
    status = models.CharField(
        _('Statut actuel'),
        max_length=20,
        choices=RoomStatus.choices,
        default=RoomStatus.DISPONIBLE,
        db_index=True
    )
    amenities = models.JSONField(_('Équipements inclus'), default=list, blank=True)
    description = models.TextField(_('Description'), blank=True)
    is_published = models.BooleanField(_('Publiée pour réservations'), default=True)

    class Meta:
        verbose_name = _('Chambre Guest House')
        verbose_name_plural = _('Chambres Guest House')
        unique_together = ('business', 'room_number')
        ordering = ['room_number']

    def __str__(self):
        return f"{self.room_number} - {self.name} ({self.price_per_night:,} FCFA) - {self.business.name}"


class RoomImage(ActiveModel):
    """
    Photos de la chambre.
    """
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('Chambre')
    )
    image = models.FileField(_('Fichier photo'), upload_to='room_photos/')
    title = models.CharField(_('Légende'), max_length=150, blank=True)
    is_cover = models.BooleanField(_('Photo de couverture'), default=False)
    order = models.PositiveIntegerField(_('Ordre'), default=0)

    class Meta:
        verbose_name = _('Photo de chambre')
        verbose_name_plural = _('Photos de chambres')
        ordering = ['order', '-created_at']


class Booking(TenantAwareModel):
    """
    Réservation de chambre dans le Guest House.
    """
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name=_('Chambre')
    )
    client_name = models.CharField(_('Nom du client'), max_length=150)
    client_phone = models.CharField(_('Téléphone contact'), max_length=30, blank=True)
    check_in = models.DateField(_('Date d\'arrivée'))
    check_out = models.DateField(_('Date de départ'))
    guests_count = models.PositiveSmallIntegerField(_('Nombre de voyageurs'), default=1)
    total_amount = models.DecimalField(_('Montant total (FCFA)'), max_digits=12, decimal_places=0)
    payment_status = models.CharField(_('Statut de paiement'), max_length=30, default='EN_ATTENTE')
    booking_status = models.CharField(_('Statut réservation'), max_length=30, default='CONFIRMEE')
    notes = models.TextField(_('Notes particulières'), blank=True)

    class Meta:
        verbose_name = _('Réservation Guest House')
        verbose_name_plural = _('Réservations Guest House')
        ordering = ['-check_in']
