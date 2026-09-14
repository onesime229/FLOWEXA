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
        ('crm', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='NotificationTemplate',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Identifiant unique universel (UUIDv4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Date et heure de création')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date et heure de dernière modification')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text="Indique si l'entité est active")),
                ('code', models.SlugField(max_length=100, unique=True, verbose_name='Code unique du template')),
                ('channel', models.CharField(choices=[('WHATSAPP', 'WhatsApp Business'), ('SMS', 'Message SMS'), ('EMAIL', 'Courrier électronique'), ('PUSH', 'Notification Push Mobile/Web')], default='WHATSAPP', max_length=20, verbose_name='Canal')),
                ('title', models.CharField(max_length=255, verbose_name='Objet / Titre du message')),
                ('content', models.TextField(verbose_name='Corps du message avec variables')),
                ('variables_description', models.JSONField(blank=True, default=list, verbose_name='Liste des variables supportées')),
            ],
            options={
                'verbose_name': 'Template de notification',
                'verbose_name_plural': 'Templates de notifications',
            },
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Identifiant unique universel (UUIDv4)', primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Date et heure de création')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date et heure de dernière modification')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text="Indique si l'entité est active")),
                ('channel', models.CharField(choices=[('WHATSAPP', 'WhatsApp Business'), ('SMS', 'Message SMS'), ('EMAIL', 'Courrier électronique'), ('PUSH', 'Notification Push Mobile/Web')], db_index=True, max_length=20, verbose_name="Canal d'envoi")),
                ('recipient', models.CharField(db_index=True, max_length=255, verbose_name='Destinataire (numéro ou email ou token)')),
                ('template_code', models.CharField(blank=True, max_length=100, verbose_name='Code du template utilisé')),
                ('title', models.CharField(blank=True, max_length=255, verbose_name='Objet / Titre')),
                ('content', models.TextField(verbose_name='Contenu final envoyé')),
                ('status', models.CharField(choices=[('PENDING', "En attente d'envoi"), ('SENT', 'Envoyé au fournisseur'), ('DELIVERED', 'Délivré au destinataire'), ('FAILED', "Échec d'envoi")], db_index=True, default='PENDING', max_length=20, verbose_name='Statut de livraison')),
                ('provider', models.CharField(default='SYSTEM', max_length=60, verbose_name='Fournisseur passerelle')),
                ('provider_message_id', models.CharField(blank=True, max_length=255, verbose_name='ID transaction fournisseur')),
                ('error_message', models.TextField(blank=True, verbose_name="Détail de l'erreur si échec")),
                ('sent_at', models.DateTimeField(blank=True, null=True, verbose_name='Envoyé à')),
                ('delivered_at', models.DateTimeField(blank=True, null=True, verbose_name='Délivré à')),
                ('read_at', models.DateTimeField(blank=True, null=True, verbose_name='Lu à')),
                ('metadata', models.JSONField(blank=True, default=dict, verbose_name='Données techniques et de tracking')),
                ('business', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notifications', to='businesses.business', verbose_name='Entreprise expéditrice')),
                ('contact', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notifications', to='crm.contact', verbose_name='Contact destinataire (si CRM)')),
                ('tenant', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='tenants.tenant', verbose_name='Organisation')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notifications', to=settings.AUTH_USER_MODEL, verbose_name='Utilisateur lié')),
            ],
            options={
                'verbose_name': 'Notification',
                'verbose_name_plural': 'Notifications',
                'ordering': ['-created_at'],
            },
        ),
    ]
