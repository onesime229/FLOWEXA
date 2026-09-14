from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from apps.core.models import ActiveModel


class Tenant(ActiveModel):
    """
    Organisation / Compte Client principal Flowexa hébergeant une ou plusieurs entreprises.
    """
    name = models.CharField(_('Nom de l\'organisation'), max_length=255)
    slug = models.SlugField(_('Identifiant unique (slug)'), max_length=100, unique=True, db_index=True)
    owner = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='owned_tenants',
        verbose_name=_('Propriétaire principal')
    )
    max_businesses = models.PositiveIntegerField(
        _('Nombre maximum d\'entreprises autorisées'),
        default=5
    )

    class Meta:
        verbose_name = _('Tenant')
        verbose_name_plural = _('Tenants')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.slug})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Tenant.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class TenantAwareModel(ActiveModel):
    """
    Modèle abstrait pour toute donnée opérationnelle liée à une entreprise (ex: Biens, Réservations, Clients).
    Garantit l'isolation multi-tenant stricte.
    """
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_items',
        verbose_name=_('Entreprise propriétaire')
    )

    objects = models.Manager()

    class Meta:
        abstract = True

