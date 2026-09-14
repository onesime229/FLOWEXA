# Generated for Django 5.2

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('tenants', '0001_initial'),
        ('businesses', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Contact',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Identifiant unique universel (UUIDv4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Date et heure de création')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date et heure de dernière modification')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text="Indique si l'entité est active")),
                ('first_name', models.CharField(max_length=150, verbose_name='Prénom')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='Nom')),
                ('email', models.EmailField(blank=True, db_index=True, max_length=254, verbose_name='Email')),
                ('phone', models.CharField(blank=True, db_index=True, max_length=35, verbose_name='Téléphone')),
                ('whatsapp', models.CharField(blank=True, max_length=35, verbose_name='Numéro WhatsApp')),
                ('company', models.CharField(blank=True, max_length=150, verbose_name='Entreprise / Organisation du contact')),
                ('job_title', models.CharField(blank=True, max_length=100, verbose_name='Poste / Profession')),
                ('address', models.CharField(blank=True, max_length=255, verbose_name='Adresse')),
                ('city', models.CharField(default='Cotonou', max_length=100, verbose_name='Ville')),
                ('country', models.CharField(default='Bénin', max_length=100, verbose_name='Pays')),
                ('avatar', models.FileField(blank=True, null=True, upload_to='contacts_avatars/', verbose_name='Photo / Avatar')),
                ('notes', models.TextField(blank=True, verbose_name='Notes générales')),
                ('tags', models.JSONField(blank=True, default=list, verbose_name='Tags')),
                ('custom_fields', models.JSONField(blank=True, default=dict, verbose_name='Champs personnalisés')),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='crm_contacts', to='tenants.tenant', verbose_name='Organisation')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='crm_profiles', to=settings.AUTH_USER_MODEL, verbose_name='Compte utilisateur lié (optionnel)')),
            ],
            options={
                'verbose_name': 'Contact CRM',
                'verbose_name_plural': 'Contacts CRM',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='BusinessRelation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Identifiant unique universel (UUIDv4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Date et heure de création')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date et heure de dernière modification')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text="Indique si l'entité est active")),
                ('relation_type', models.CharField(choices=[('PROSPECT', 'Prospect / Lead'), ('CLIENT', 'Client actif'), ('VIP', 'Client VIP'), ('INACTIVE', 'Client inactif'), ('LOST', 'Perdu / Désisté')], db_index=True, default='PROSPECT', max_length=20, verbose_name='Type de relation')),
                ('stage', models.CharField(choices=[('NEW', 'Nouveau lead'), ('CONTACTED', 'Contacté'), ('QUALIFIED', 'Besoin qualifié'), ('PROPOSAL', 'Proposition / Devis soumis'), ('IN_PROGRESS', 'Prestation / Visite en cours'), ('WON', 'Gagné / Client converti'), ('LOST', 'Perdu')], db_index=True, default='NEW', max_length=25, verbose_name='Étape dans le pipeline')),
                ('source', models.CharField(choices=[('WEBSITE', 'Plateforme / Site web'), ('WHATSAPP', 'WhatsApp Business'), ('RECOMMENDATION', 'Bouche à oreille / Recommandation'), ('SOCIAL_MEDIA', 'Réseaux sociaux (Instagram / Facebook)'), ('WALKIN', 'Visite spontanée'), ('PHONE', 'Appel entrant'), ('OTHER', 'Autre canal')], default='WEBSITE', max_length=25, verbose_name="Source d'acquisition")),
                ('rating', models.PositiveSmallIntegerField(default=5, verbose_name='Note / Score de satisfaction (1-5)')),
                ('lifetime_value', models.DecimalField(decimal_places=2, default=0.0, help_text='Montant total en FCFA généré par ce client pour cette entreprise', max_digits=12, verbose_name='Valeur vie client (LTV)')),
                ('notes', models.TextField(blank=True, verbose_name='Notes spécifiques à cette entreprise')),
                ('first_interaction_at', models.DateTimeField(blank=True, null=True, verbose_name='Première interaction')),
                ('last_interaction_at', models.DateTimeField(blank=True, null=True, verbose_name='Dernière interaction')),
                ('meta_data', models.JSONField(blank=True, default=dict, verbose_name='Données contextuelles')),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_crm_relations', to=settings.AUTH_USER_MODEL, verbose_name='Responsable assigné')),
                ('business', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='crm_relations', to='businesses.business', verbose_name='Entreprise')),
                ('contact', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='business_relations', to='crm.contact', verbose_name='Contact')),
            ],
            options={
                'verbose_name': 'Relation Client-Entreprise',
                'verbose_name_plural': 'Relations Clients-Entreprises',
                'ordering': ['-updated_at'],
                'unique_together': {('contact', 'business')},
            },
        ),
        migrations.CreateModel(
            name='Interaction',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Identifiant unique universel (UUIDv4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Date et heure de création')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date et heure de dernière modification')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text="Indique si l'entité est active")),
                ('interaction_type', models.CharField(choices=[('CALL', 'Appel téléphonique'), ('WHATSAPP', 'Message WhatsApp'), ('SMS', 'Message SMS'), ('EMAIL', 'Courrier électronique'), ('MEETING', 'Rendez-vous physique'), ('VISIT', 'Visite de bien / Établissement'), ('NOTE', 'Note interne'), ('QUOTE', 'Devis / Proposition'), ('COMPLAINT', 'Réclamation / SAV')], db_index=True, default='NOTE', max_length=20, verbose_name="Type d'interaction")),
                ('status', models.CharField(choices=[('PLANNED', 'Planifié'), ('COMPLETED', 'Réalisé'), ('CANCELLED', 'Annulé')], default='COMPLETED', max_length=20, verbose_name="Statut de l'interaction")),
                ('title', models.CharField(max_length=255, verbose_name='Objet / Titre résumé')),
                ('details', models.TextField(blank=True, verbose_name='Compte-rendu détaillé')),
                ('performed_at', models.DateTimeField(db_index=True, verbose_name="Date et heure de l'action")),
                ('next_follow_up', models.DateTimeField(blank=True, null=True, verbose_name='Date de relance prévue')),
                ('outcome', models.CharField(blank=True, max_length=255, verbose_name='Résultat obtenu')),
                ('meta_data', models.JSONField(blank=True, default=dict, verbose_name='Données annexes')),
                ('business', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='crm_interactions', to='businesses.business', verbose_name='Entreprise')),
                ('business_relation', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='interactions', to='crm.businessrelation', verbose_name='Relation associée')),
                ('contact', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='interactions', to='crm.contact', verbose_name='Contact')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='logged_interactions', to=settings.AUTH_USER_MODEL, verbose_name="Auteur de l'interaction")),
            ],
            options={
                'verbose_name': 'Interaction CRM',
                'verbose_name_plural': 'Interactions CRM',
                'ordering': ['-performed_at'],
            },
        ),
        migrations.CreateModel(
            name='Demande',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Identifiant unique universel (UUIDv4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Date et heure de création')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date et heure de dernière modification')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text="Indique si l'entité est active")),
                ('module_code', models.CharField(choices=[('IMMOBILIER', 'Immobilier & Gestion locative'), ('GUEST_HOUSE', 'Guest House & Résidences meublées'), ('COIFFURE', 'Salon de Coiffure'), ('BARBIER', 'Barbier & Grooming'), ('INSTITUT_COSMETIQUE', 'Institut Cosmétique & Soins'), ('SPA_MASSAGE', 'Spa & Salons de Massage'), ('STUDIO_PHOTO', 'Studio Photo & Vidéo'), ('ATELIER_BRODERIE', 'Atelier de Couture & Broderie'), ('GARAGE_MECANIQUE', 'Garage & Entretien Automobile'), ('PHARMACIE', 'Pharmacie & Santé')], db_index=True, max_length=40, verbose_name='Module métier')),
                ('title', models.CharField(max_length=255, verbose_name='Titre de la demande')),
                ('description', models.TextField(blank=True, verbose_name='Détails du besoin')),
                ('budget_min', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name='Budget minimum')),
                ('budget_max', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name='Budget maximum')),
                ('currency', models.CharField(default='XOF', max_length=10, verbose_name='Devise')),
                ('location', models.CharField(blank=True, max_length=255, verbose_name='Localisation souhaitée')),
                ('priority', models.CharField(choices=[('LOW', 'Basse'), ('MEDIUM', 'Moyenne'), ('HIGH', 'Haute'), ('URGENT', 'Urgente')], default='MEDIUM', max_length=15, verbose_name='Priorité')),
                ('status', models.CharField(choices=[('OPEN', 'Ouverte / En attente'), ('IN_PROGRESS', 'En cours de traitement'), ('PROPOSAL_SENT', 'Proposition transmise'), ('FULFILLED', 'Conclue avec succès'), ('CANCELLED', 'Annulée')], db_index=True, default='OPEN', max_length=20, verbose_name='Statut de la demande')),
                ('criteria', models.JSONField(blank=True, default=dict, verbose_name='Critères structurés')),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_demandes', to=settings.AUTH_USER_MODEL, verbose_name='Collaborateur assigné')),
                ('business', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='crm_demandes', to='businesses.business', verbose_name='Entreprise ciblée (optionnel)')),
                ('contact', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='demandes', to='crm.contact', verbose_name='Contact')),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='crm_demandes', to='tenants.tenant', verbose_name='Organisation')),
            ],
            options={
                'verbose_name': 'Demande client',
                'verbose_name_plural': 'Demandes clients',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Segment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Identifiant unique universel (UUIDv4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Date et heure de création')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date et heure de dernière modification')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text="Indique si l'entité est active")),
                ('name', models.CharField(max_length=150, verbose_name='Nom du segment')),
                ('slug', models.SlugField(blank=True, max_length=160, verbose_name='Slug')),
                ('description', models.TextField(blank=True, verbose_name='Description')),
                ('color', models.CharField(default='#3B82F6', max_length=20, verbose_name='Code couleur hexadécimal')),
                ('criteria', models.JSONField(blank=True, default=dict, verbose_name='Critères de filtre automatique')),
                ('business', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='crm_segments', to='businesses.business', verbose_name='Entreprise spécifique (optionnel)')),
                ('contacts', models.ManyToManyField(blank=True, related_name='segments', to='crm.contact', verbose_name='Contacts assignés')),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='crm_segments', to='tenants.tenant', verbose_name='Organisation')),
            ],
            options={
                'verbose_name': 'Segment CRM',
                'verbose_name_plural': 'Segments CRM',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Favori',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Identifiant unique universel (UUIDv4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Date et heure de création')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date et heure de dernière modification')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text="Indique si l'entité est active")),
                ('item_type', models.CharField(help_text='Ex: BIEN_IMMOBILIER, CHAMBRE, SERVICE', max_length=50, verbose_name="Type d'élément")),
                ('item_id', models.CharField(max_length=100, verbose_name="Identifiant de l'élément")),
                ('item_title', models.CharField(max_length=255, verbose_name="Titre de l'élément")),
                ('item_price', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name='Prix indicatif')),
                ('item_metadata', models.JSONField(blank=True, default=dict, verbose_name='Métadonnées (photos, caractéristiques)')),
                ('business', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='crm_favoris', to='businesses.business', verbose_name='Entreprise')),
                ('contact', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favoris', to='crm.contact', verbose_name='Contact')),
            ],
            options={
                'verbose_name': 'Favori',
                'verbose_name_plural': 'Favoris',
                'ordering': ['-created_at'],
                'unique_together': {('contact', 'business', 'item_type', 'item_id')},
            },
        ),
    ]
