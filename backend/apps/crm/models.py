import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from apps.core.models import ActiveModel, TimeStampedModel
from apps.businesses.models import BusinessModule


class RelationType(models.TextChoices):
    PROSPECT = 'PROSPECT', _('Prospect / Lead')
    CLIENT = 'CLIENT', _('Client actif')
    VIP = 'VIP', _('Client VIP')
    INACTIVE = 'INACTIVE', _('Client inactif')
    LOST = 'LOST', _('Perdu / Désisté')


class PipelineStage(models.TextChoices):
    NEW = 'NEW', _('Nouveau lead')
    CONTACTED = 'CONTACTED', _('Contacté')
    QUALIFIED = 'QUALIFIED', _('Besoin qualifié')
    PROPOSAL = 'PROPOSAL', _('Proposition / Devis soumis')
    IN_PROGRESS = 'IN_PROGRESS', _('Prestation / Visite en cours')
    WON = 'WON', _('Gagné / Client converti')
    LOST = 'LOST', _('Perdu')


class LeadSource(models.TextChoices):
    WEBSITE = 'WEBSITE', _('Plateforme / Site web')
    WHATSAPP = 'WHATSAPP', _('WhatsApp Business')
    RECOMMENDATION = 'RECOMMENDATION', _('Bouche à oreille / Recommandation')
    SOCIAL_MEDIA = 'SOCIAL_MEDIA', _('Réseaux sociaux (Instagram / Facebook)')
    WALKIN = 'WALKIN', _('Visite spontanée')
    PHONE = 'PHONE', _('Appel entrant')
    OTHER = 'OTHER', _('Autre canal')


class InteractionType(models.TextChoices):
    CALL = 'CALL', _('Appel téléphonique')
    WHATSAPP = 'WHATSAPP', _('Message WhatsApp')
    SMS = 'SMS', _('Message SMS')
    EMAIL = 'EMAIL', _('Courrier électronique')
    MEETING = 'MEETING', _('Rendez-vous physique')
    VISIT = 'VISIT', _('Visite de bien / Établissement')
    NOTE = 'NOTE', _('Note interne')
    QUOTE = 'QUOTE', _('Devis / Proposition')
    COMPLAINT = 'COMPLAINT', _('Réclamation / SAV')


class InteractionStatus(models.TextChoices):
    PLANNED = 'PLANNED', _('Planifié')
    COMPLETED = 'COMPLETED', _('Réalisé')
    CANCELLED = 'CANCELLED', _('Annulé')


class DemandeStatus(models.TextChoices):
    OPEN = 'OPEN', _('Ouverte / En attente')
    IN_PROGRESS = 'IN_PROGRESS', _('En cours de traitement')
    PROPOSAL_SENT = 'PROPOSAL_SENT', _('Proposition transmise')
    FULFILLED = 'FULFILLED', _('Conclue avec succès')
    CANCELLED = 'CANCELLED', _('Annulée')


class DemandePriority(models.TextChoices):
    LOW = 'LOW', _('Basse')
    MEDIUM = 'MEDIUM', _('Moyenne')
    HIGH = 'HIGH', _('Haute')
    URGENT = 'URGENT', _('Urgente')


class Contact(ActiveModel):
    """
    Personne unique (Client ou Prospect) dans le CRM Flowexa.
    Une personne peut interagir avec plusieurs entreprises différentes au sein d'un même Tenant
    (ex: louer un appartement via l'agence immobilière, loger au Guest House, aller au Coiffeur et au Spa).
    """
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='crm_contacts',
        verbose_name=_('Organisation')
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='crm_profiles',
        verbose_name=_('Compte utilisateur lié (optionnel)')
    )
    first_name = models.CharField(_('Prénom'), max_length=150)
    last_name = models.CharField(_('Nom'), max_length=150, blank=True)
    email = models.EmailField(_('Email'), blank=True, db_index=True)
    phone = models.CharField(_('Téléphone'), max_length=35, blank=True, db_index=True)
    whatsapp = models.CharField(_('Numéro WhatsApp'), max_length=35, blank=True)
    company = models.CharField(_('Entreprise / Organisation du contact'), max_length=150, blank=True)
    job_title = models.CharField(_('Poste / Profession'), max_length=100, blank=True)

    # Localisation
    address = models.CharField(_('Adresse'), max_length=255, blank=True)
    city = models.CharField(_('Ville'), max_length=100, default='Cotonou')
    country = models.CharField(_('Pays'), max_length=100, default='Bénin')

    avatar = models.FileField(_('Photo / Avatar'), upload_to='contacts_avatars/', null=True, blank=True)
    notes = models.TextField(_('Notes générales'), blank=True)
    tags = models.JSONField(_('Tags'), default=list, blank=True)
    custom_fields = models.JSONField(_('Champs personnalisés'), default=dict, blank=True)

    class Meta:
        verbose_name = _('Contact CRM')
        verbose_name_plural = _('Contacts CRM')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'created_at']),
            models.Index(fields=['tenant', 'email']),
            models.Index(fields=['tenant', 'phone']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip() or self.phone or self.email or "Contact sans nom"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def total_lifetime_value(self):
        """Somme des valeurs d'achat cumulées sur toutes les entreprises"""
        total = self.business_relations.aggregate(models.Sum('lifetime_value'))['lifetime_value__sum']
        return total or 0

    @property
    def businesses_count(self):
        return self.business_relations.count()


class BusinessRelation(ActiveModel):
    """
    Liaison entre un Contact et une Entreprise spécifique.
    Modélise le cycle de vie (Prospect vs Client), l'étape dans le pipeline,
    la valeur client (LTV), et la source d'acquisition pour CETTE entreprise.
    """
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name='business_relations',
        verbose_name=_('Contact')
    )
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='crm_relations',
        verbose_name=_('Entreprise')
    )
    relation_type = models.CharField(
        _('Type de relation'),
        max_length=20,
        choices=RelationType.choices,
        default=RelationType.PROSPECT,
        db_index=True
    )
    stage = models.CharField(
        _('Étape dans le pipeline'),
        max_length=25,
        choices=PipelineStage.choices,
        default=PipelineStage.NEW,
        db_index=True
    )
    source = models.CharField(
        _('Source d\'acquisition'),
        max_length=25,
        choices=LeadSource.choices,
        default=LeadSource.WEBSITE
    )
    assigned_to = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_crm_relations',
        verbose_name=_('Responsable assigné')
    )
    rating = models.PositiveSmallIntegerField(
        _('Note / Score de satisfaction (1-5)'),
        default=5
    )
    lifetime_value = models.DecimalField(
        _('Valeur vie client (LTV)'),
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text=_('Montant total en FCFA généré par ce client pour cette entreprise')
    )
    notes = models.TextField(_('Notes spécifiques à cette entreprise'), blank=True)
    first_interaction_at = models.DateTimeField(_('Première interaction'), null=True, blank=True)
    last_interaction_at = models.DateTimeField(_('Dernière interaction'), null=True, blank=True)
    meta_data = models.JSONField(_('Données contextuelles'), default=dict, blank=True)

    class Meta:
        verbose_name = _('Relation Client-Entreprise')
        verbose_name_plural = _('Relations Clients-Entreprises')
        unique_together = ('contact', 'business')
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['business', 'relation_type', 'stage']),
            models.Index(fields=['contact', 'business']),
        ]

    def __str__(self):
        return f"{self.contact.full_name} ↔ {self.business.name} ({self.get_relation_type_display()})"


class Interaction(ActiveModel):
    """
    Échange ou action effectuée avec un contact (Appel, WhatsApp, Visite, Devis, etc.).
    """
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='crm_interactions',
        verbose_name=_('Entreprise')
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name='interactions',
        verbose_name=_('Contact')
    )
    business_relation = models.ForeignKey(
        BusinessRelation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='interactions',
        verbose_name=_('Relation associée')
    )
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logged_interactions',
        verbose_name=_('Auteur de l\'interaction')
    )
    interaction_type = models.CharField(
        _('Type d\'interaction'),
        max_length=20,
        choices=InteractionType.choices,
        default=InteractionType.NOTE,
        db_index=True
    )
    status = models.CharField(
        _('Statut de l\'interaction'),
        max_length=20,
        choices=InteractionStatus.choices,
        default=InteractionStatus.COMPLETED
    )
    title = models.CharField(_('Objet / Titre résumé'), max_length=255)
    details = models.TextField(_('Compte-rendu détaillé'), blank=True)
    performed_at = models.DateTimeField(_('Date et heure de l\'action'), db_index=True)
    next_follow_up = models.DateTimeField(_('Date de relance prévue'), null=True, blank=True)
    outcome = models.CharField(_('Résultat obtenu'), max_length=255, blank=True)
    meta_data = models.JSONField(_('Données annexes'), default=dict, blank=True)

    class Meta:
        verbose_name = _('Interaction CRM')
        verbose_name_plural = _('Interactions CRM')
        ordering = ['-performed_at']
        indexes = [
            models.Index(fields=['business', 'performed_at']),
            models.Index(fields=['contact', 'performed_at']),
            models.Index(fields=['interaction_type', 'status']),
        ]

    def __str__(self):
        return f"[{self.get_interaction_type_display()}] {self.title} ({self.contact.full_name})"


class Demande(ActiveModel):
    """
    Expression de besoin, recherche ou demande de réservation d'un client.
    Ex: Recherche d'un appartement 2 chambres à Cotonou pour 150 000 FCFA,
        Réservation d'une suite pour 3 nuits, ou forfait coiffure de mariée.
    """
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name='demandes',
        verbose_name=_('Contact')
    )
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='crm_demandes',
        verbose_name=_('Entreprise ciblée (optionnel)')
    )
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='crm_demandes',
        verbose_name=_('Organisation')
    )
    module_code = models.CharField(
        _('Module métier'),
        max_length=40,
        choices=BusinessModule.choices,
        db_index=True
    )
    title = models.CharField(_('Titre de la demande'), max_length=255)
    description = models.TextField(_('Détails du besoin'), blank=True)
    budget_min = models.DecimalField(_('Budget minimum'), max_digits=12, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(_('Budget maximum'), max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(_('Devise'), max_length=10, default='XOF')
    location = models.CharField(_('Localisation souhaitée'), max_length=255, blank=True)
    priority = models.CharField(
        _('Priorité'),
        max_length=15,
        choices=DemandePriority.choices,
        default=DemandePriority.MEDIUM
    )
    status = models.CharField(
        _('Statut de la demande'),
        max_length=20,
        choices=DemandeStatus.choices,
        default=DemandeStatus.OPEN,
        db_index=True
    )
    criteria = models.JSONField(_('Critères structurés'), default=dict, blank=True)
    assigned_to = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_demandes',
        verbose_name=_('Collaborateur assigné')
    )

    class Meta:
        verbose_name = _('Demande client')
        verbose_name_plural = _('Demandes clients')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status', 'created_at']),
            models.Index(fields=['business', 'status']),
            models.Index(fields=['module_code', 'status']),
        ]

    def __str__(self):
        return f"{self.title} - {self.contact.full_name} ({self.get_status_display()})"


class Favori(ActiveModel):
    """
    Éléments mis en favoris par ou pour un contact (bien immobilier, chambre, prestation de service, produit).
    """
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name='favoris',
        verbose_name=_('Contact')
    )
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='crm_favoris',
        verbose_name=_('Entreprise')
    )
    item_type = models.CharField(_('Type d\'élément'), max_length=50, help_text=_('Ex: BIEN_IMMOBILIER, CHAMBRE, SERVICE'))
    item_id = models.CharField(_('Identifiant de l\'élément'), max_length=100)
    item_title = models.CharField(_('Titre de l\'élément'), max_length=255)
    item_price = models.DecimalField(_('Prix indicatif'), max_digits=12, decimal_places=2, null=True, blank=True)
    item_metadata = models.JSONField(_('Métadonnées (photos, caractéristiques)'), default=dict, blank=True)

    class Meta:
        verbose_name = _('Favori')
        verbose_name_plural = _('Favoris')
        unique_together = ('contact', 'business', 'item_type', 'item_id')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.item_title} ({self.contact.full_name})"


class Segment(ActiveModel):
    """
    Segmentation dynamique ou manuelle de contacts (ex: 'Clients VIP Cotonou', 'Prospects Immobiliers > 200k', 'Inactifs 3 mois').
    """
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='crm_segments',
        verbose_name=_('Organisation')
    )
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='crm_segments',
        verbose_name=_('Entreprise spécifique (optionnel)')
    )
    name = models.CharField(_('Nom du segment'), max_length=150)
    slug = models.SlugField(_('Slug'), max_length=160, blank=True)
    description = models.TextField(_('Description'), blank=True)
    color = models.CharField(_('Code couleur hexadécimal'), max_length=20, default='#3B82F6')
    criteria = models.JSONField(_('Critères de filtre automatique'), default=dict, blank=True)
    contacts = models.ManyToManyField(
        Contact,
        related_name='segments',
        blank=True,
        verbose_name=_('Contacts assignés')
    )

    class Meta:
        verbose_name = _('Segment CRM')
        verbose_name_plural = _('Segments CRM')
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def contacts_count(self):
        return self.contacts.count()


class CrmActivityLog(TimeStampedModel):
    """
    Journal d'audit et historique chronologique de toutes les actions CRM associées à un contact.
    """
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name='activity_logs',
        verbose_name=_('Contact')
    )
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('Entreprise liée')
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('Utilisateur auteur')
    )
    action = models.CharField(_('Type d\'action'), max_length=100)
    description = models.TextField(_('Détails de l\'action'))
    metadata = models.JSONField(_('Données contextuelles'), default=dict, blank=True)

    class Meta:
        verbose_name = _('Journal d\'activité CRM')
        verbose_name_plural = _('Journaux d\'activité CRM')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['contact', 'created_at']),
            models.Index(fields=['business', 'created_at']),
        ]

    def __str__(self):
        return f"{self.action} - {self.contact.full_name} ({self.created_at.strftime('%d/%m/%Y %H:%M')})"
