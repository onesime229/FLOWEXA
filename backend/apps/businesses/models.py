from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from apps.core.models import ActiveModel


class BusinessModule(models.TextChoices):
    IMMOBILIER = 'IMMOBILIER', _('Immobilier')
    GUEST_HOUSE = 'GUEST_HOUSE', _('Guest House')
    COIFFURE = 'COIFFURE', _('Coiffure')
    BARBIER = 'BARBIER', _('Barbier')
    INSTITUT_COSMETIQUE = 'INSTITUT_COSMETIQUE', _('Institut / Cosmétique')
    SPA_MASSAGE = 'SPA_MASSAGE', _('Spa / Massage')
    PHOTOGRAPHE = 'PHOTOGRAPHE', _('Photographe')
    BRODERIE_IMPRESSION = 'BRODERIE_IMPRESSION', _('Broderie / Impression')
    GARAGE = 'GARAGE', _('Garage')
    PHARMACIE = 'PHARMACIE', _('Pharmacie')


class BusinessMembershipRole(models.TextChoices):
    OWNER = 'OWNER', _('Propriétaire')
    MANAGER = 'MANAGER', _('Gérant / Manager')
    EMPLOYEE = 'EMPLOYEE', _('Employé')


class BusinessStatus(models.TextChoices):
    PENDING = 'PENDING', _('En attente de validation')
    ACTIVE = 'ACTIVE', _('Actif')
    SUSPENDED = 'SUSPENDED', _('Suspendu')
    CLOSED = 'CLOSED', _('Fermé définitivement')


class Business(ActiveModel):
    """
    Entité Entreprise / Établissement physique ou commercial au sein d'un Tenant.
    Supporte les coordonnées complètes, horaires, réseaux sociaux et multi-modules.
    """
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='businesses',
        verbose_name=_('Organisation parente')
    )
    name = models.CharField(_('Nom commercial'), max_length=255)
    slug = models.SlugField(_('Identifiant'), max_length=120, blank=True, db_index=True)
    description = models.TextField(_('Description'), blank=True)
    logo = models.FileField(_('Logo'), upload_to='business_logos/', null=True, blank=True)

    # Module principal et liste de modules activés
    module_code = models.CharField(
        _('Module métier principal'),
        max_length=40,
        choices=BusinessModule.choices,
        db_index=True
    )
    enabled_modules = models.JSONField(
        _('Modules métiers activés'),
        default=list,
        blank=True
    )

    status = models.CharField(
        _('Statut de l\'entreprise'),
        max_length=20,
        choices=BusinessStatus.choices,
        default=BusinessStatus.ACTIVE,
        db_index=True
    )

    # Contact & localisation
    phone = models.CharField(_('Téléphone contact'), max_length=30, blank=True)
    email = models.EmailField(_('Email professionnel'), blank=True)
    website = models.URLField(_('Site internet'), blank=True)
    address = models.CharField(_('Adresse physique'), max_length=255, blank=True)
    city = models.CharField(_('Ville'), max_length=100, default='Cotonou')
    district = models.CharField(_('Quartier / Zone'), max_length=100, blank=True)
    country = models.CharField(_('Pays'), max_length=100, default='Bénin')
    latitude = models.DecimalField(
        _('Latitude'),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    longitude = models.DecimalField(
        _('Longitude'),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    currency = models.CharField(_('Devise'), max_length=10, default='XOF')

    # Horaires & Réseaux
    opening_hours = models.JSONField(
        _('Horaires d\'ouverture'),
        default=dict,
        blank=True
    )
    social_media = models.JSONField(
        _('Réseaux sociaux'),
        default=dict,
        blank=True
    )

    settings = models.JSONField(_('Paramètres spécifiques'), default=dict, blank=True)

    class Meta:
        verbose_name = _('Entreprise')
        verbose_name_plural = _('Entreprises')
        unique_together = ('tenant', 'slug')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status', 'created_at']),
            models.Index(fields=['city', 'status']),
            models.Index(fields=['module_code', 'status']),
        ]

    def __str__(self):
        return f"{self.name} [{self.get_module_code_display()}] ({self.tenant.name})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Business.objects.filter(tenant=self.tenant, slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        if self.module_code and self.module_code not in self.enabled_modules:
            self.enabled_modules = list(set(self.enabled_modules + [self.module_code]))

        super().save(*args, **kwargs)


class BusinessMembership(ActiveModel):
    """
    Association stricte entre un utilisateur et une entreprise avec rôle local.
    """
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='memberships',
        verbose_name=_('Entreprise')
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='business_memberships',
        verbose_name=_('Utilisateur')
    )
    role = models.CharField(
        _('Rôle dans l\'entreprise'),
        max_length=20,
        choices=BusinessMembershipRole.choices,
        default=BusinessMembershipRole.EMPLOYEE,
        db_index=True
    )
    joined_at = models.DateTimeField(_('Date d\'intégration'), auto_now_add=True)

    class Meta:
        verbose_name = _('Membre d\'entreprise')
        verbose_name_plural = _('Membres d\'entreprise')
        unique_together = ('business', 'user')
        ordering = ['-joined_at']
        indexes = [
            models.Index(fields=['business', 'user', 'is_active']),
            models.Index(fields=['user', 'role']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.business.name} ({self.get_role_display()})"


class BusinessImage(ActiveModel):
    """
    Photos réelles de l'établissement ou de l'entreprise.
    """
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('Entreprise')
    )
    image = models.FileField(_('Fichier image'), upload_to='business_photos/')
    title = models.CharField(_('Titre / Description'), max_length=150, blank=True)
    is_primary = models.BooleanField(_('Photo principale'), default=False)
    order = models.PositiveIntegerField(_('Ordre d\'affichage'), default=0)

    class Meta:
        verbose_name = _('Photo d\'entreprise')
        verbose_name_plural = _('Photos d\'entreprise')
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['business', 'is_primary', 'order']),
        ]

    def __str__(self):
        return f"Photo {self.business.name} ({self.title or 'Sans titre'})"

