from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.tenants.models import TenantAwareModel
from apps.core.models import ActiveModel


class PropertyCategory(models.TextChoices):
    APPARTEMENT = 'APPARTEMENT', _('Appartement')
    VILLA = 'VILLA', _('Villa / Maison')
    STUDIO = 'STUDIO', _('Studio')
    BUREAU = 'BUREAU', _('Bureau / Local commercial')
    TERRAIN = 'TERRAIN', _('Terrain / Parcelle')
    MAGASIN = 'MAGASIN', _('Magasin / Entrepôt')


class TransactionType(models.TextChoices):
    LOCATION = 'LOCATION', _('Location')
    VENTE = 'VENTE', _('Vente')


class PropertyStatus(models.TextChoices):
    DISPONIBLE = 'DISPONIBLE', _('Disponible')
    RESERVE = 'RESERVE', _('Réservé / Visite en cours')
    LOUE = 'LOUE', _('Loué')
    VENDU = 'VENDU', _('Vendu')
    ARCHIVE = 'ARCHIVE', _('Archivé / Indisponible')


class Property(TenantAwareModel):
    """
    Bien immobilier géré par une agence immobilière Flowexa.
    Strictement isolé par entreprise.
    """
    title = models.CharField(_('Titre de l\'annonce'), max_length=255)
    category = models.CharField(
        _('Catégorie de bien'),
        max_length=30,
        choices=PropertyCategory.choices,
        default=PropertyCategory.APPARTEMENT
    )
    transaction_type = models.CharField(
        _('Type de transaction'),
        max_length=20,
        choices=TransactionType.choices,
        default=TransactionType.LOCATION
    )
    price = models.DecimalField(_('Prix (FCFA)'), max_digits=12, decimal_places=0)
    price_period = models.CharField(_('Périodicité'), max_length=20, default='mois')
    address = models.CharField(_('Adresse physique'), max_length=255, blank=True)
    city = models.CharField(_('Ville'), max_length=100, default='Cotonou')
    district = models.CharField(_('Quartier / Zone'), max_length=100, blank=True)
    latitude = models.DecimalField(_('Latitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(_('Longitude'), max_digits=9, decimal_places=6, null=True, blank=True)
    surface = models.PositiveIntegerField(_('Superficie (m²)'), null=True, blank=True)
    rooms = models.PositiveSmallIntegerField(_('Nombre de pièces'), null=True, blank=True)
    bedrooms = models.PositiveSmallIntegerField(_('Chambres'), null=True, blank=True)
    bathrooms = models.PositiveSmallIntegerField(_('Salles d\'eau'), null=True, blank=True)
    description = models.TextField(_('Description détaillée'), blank=True)
    status = models.CharField(
        _('Statut du bien'),
        max_length=20,
        choices=PropertyStatus.choices,
        default=PropertyStatus.DISPONIBLE,
        db_index=True
    )
    is_published = models.BooleanField(_('Publié en ligne'), default=True)
    featured = models.BooleanField(_('Mise en avant'), default=False)
    amenities = models.JSONField(_('Équipements & Commodités'), default=list, blank=True)

    class Meta:
        verbose_name = _('Bien immobilier')
        verbose_name_plural = _('Biens immobiliers')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.price:,} FCFA) - {self.business.name}"


class PropertyImage(ActiveModel):
    """
    Photos du bien immobilier.
    """
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('Bien immobilier')
    )
    image = models.FileField(_('Fichier photo'), upload_to='property_photos/')
    title = models.CharField(_('Légende'), max_length=150, blank=True)
    is_cover = models.BooleanField(_('Photo de couverture'), default=False)
    order = models.PositiveIntegerField(_('Ordre'), default=0)

    class Meta:
        verbose_name = _('Photo de bien')
        verbose_name_plural = _('Photos de biens')
        ordering = ['order', '-created_at']
