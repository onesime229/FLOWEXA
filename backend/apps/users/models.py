import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from .managers import UserManager


class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', _('Super Administrateur')
    BUSINESS_OWNER = 'BUSINESS_OWNER', _('Propriétaire d\'entreprise')
    MANAGER = 'MANAGER', _('Manager')
    EMPLOYEE = 'EMPLOYEE', _('Employé')
    CLIENT = 'CLIENT', _('Client')


class User(AbstractBaseUser, PermissionsMixin):
    """
    Modèle utilisateur personnalisé Flowexa avec UUID et gestion unifiée des rôles.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('Adresse email'), unique=True, db_index=True)
    phone = models.CharField(
        _('Numéro de téléphone'),
        max_length=30,
        unique=True,
        null=True,
        blank=True,
        db_index=True
    )
    first_name = models.CharField(_('Prénom'), max_length=150, blank=True)
    last_name = models.CharField(_('Nom'), max_length=150, blank=True)
    role = models.CharField(
        _('Rôle principal'),
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.CLIENT,
        db_index=True
    )

    is_active = models.BooleanField(_('Actif'), default=True)
    is_staff = models.BooleanField(_('Accès staff admin'), default=False)
    is_email_verified = models.BooleanField(_('Email vérifié'), default=False)
    is_phone_verified = models.BooleanField(_('Téléphone vérifié'), default=False)

    avatar = models.FileField(upload_to='avatars/', null=True, blank=True)
    preferred_language = models.CharField(max_length=10, default='fr')

    created_at = models.DateTimeField(_('Date de création'), auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(_('Dernière modification'), auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('Utilisateur')
        verbose_name_plural = _('Utilisateurs')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def full_name(self):
        full = f"{self.first_name} {self.last_name}".strip()
        return full or self.email.split('@')[0]

    @property
    def initials(self):
        first = self.first_name[0].upper() if self.first_name else ''
        last = self.last_name[0].upper() if self.last_name else ''
        if not first and not last:
            return self.email[:2].upper()
        return f"{first}{last}"

    @property
    def is_super_admin(self):
        return self.role == UserRole.SUPER_ADMIN or self.is_superuser

    @property
    def is_business_owner(self):
        return self.role == UserRole.BUSINESS_OWNER

    @property
    def is_manager(self):
        return self.role == UserRole.MANAGER

    @property
    def is_employee(self):
        return self.role == UserRole.EMPLOYEE

    @property
    def is_client(self):
        return self.role == UserRole.CLIENT
