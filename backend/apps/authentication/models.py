import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.core.models import TimeStampedModel


class OTPType(models.TextChoices):
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION', _('Vérification d\'email')
    PHONE_VERIFICATION = 'PHONE_VERIFICATION', _('Vérification de téléphone')
    PASSWORD_RESET = 'PASSWORD_RESET', _('Réinitialisation mot de passe')
    LOGIN_2FA = 'LOGIN_2FA', _('Double facteur de connexion')


class OTPCode(TimeStampedModel):
    """
    Code à usage unique temporaire sécurisé pour vérifications d'identité et réinitialisations.
    """
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='otp_codes',
        null=True,
        blank=True
    )
    target = models.CharField(_('Cible (email ou téléphone)'), max_length=255, db_index=True)
    otp_type = models.CharField(
        _('Type OTP'),
        max_length=30,
        choices=OTPType.choices,
        db_index=True
    )
    code = models.CharField(_('Code OTP'), max_length=10)
    is_used = models.BooleanField(_('Déjà utilisé'), default=False)
    attempts = models.PositiveSmallIntegerField(_('Nombre de tentatives'), default=0)
    expires_at = models.DateTimeField(_('Date d\'expiration'), db_index=True)

    class Meta:
        verbose_name = _('Code OTP')
        verbose_name_plural = _('Codes OTP')
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP {self.otp_type} pour {self.target} ({'utilisé' if self.is_used else 'valide'})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired and self.attempts < 5


class UserSecuritySession(TimeStampedModel):
    """
    Traçabilité des sessions utilisateur actives et de sécurité.
    """
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='security_sessions'
    )
    refresh_token_jti = models.CharField(max_length=255, unique=True, db_index=True)
    ip_address = models.GenericIPAddressField(_('Adresse IP'), null=True, blank=True)
    user_agent = models.TextField(_('User-Agent'), blank=True)
    device_name = models.CharField(_('Appareil identifié'), max_length=255, blank=True)
    is_active = models.BooleanField(_('Session active'), default=True)
    last_activity = models.DateTimeField(_('Dernière activité'), default=timezone.now)

    class Meta:
        verbose_name = _('Session de sécurité')
        verbose_name_plural = _('Sessions de sécurité')
        ordering = ['-last_activity']

    def __str__(self):
        return f"Session {self.user.email} - {self.ip_address} ({'Active' if self.is_active else 'Expirée'})"
