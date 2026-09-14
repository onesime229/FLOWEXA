import random
import string
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from .models import OTPCode, OTPType, UserSecuritySession


class AuthService:
    """
    Service centralisant la logique métier d'authentification, OTP et gestion de sessions.
    """

    @staticmethod
    def generate_otp_code(target: str, otp_type: str, user=None, validity_minutes: int = 15) -> str:
        # Invalidate previous unused codes for the same target & type
        OTPCode.objects.filter(target=target, otp_type=otp_type, is_used=False).update(is_used=True)

        # Generate 6 digits numeric code
        code = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + timedelta(minutes=validity_minutes)

        otp_record = OTPCode.objects.create(
            user=user,
            target=target,
            otp_type=otp_type,
            code=code,
            expires_at=expires_at
        )

        # Send OTP via Email (or log in dev)
        if '@' in target:
            subject = f"Votre code de vérification Flowexa: {code}"
            message = (
                f"Bonjour,\n\nVotre code de vérification Flowexa ({otp_type}) est : {code}\n"
                f"Il expire dans {validity_minutes} minutes.\n\n"
                f"L'équipe Flowexa - Puissant à l'intérieur. Simple à l'extérieur."
            )
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'security@flowexa.com'),
                    recipient_list=[target],
                    fail_silently=True
                )
            except Exception:
                pass
        else:
            # SMS simulation / integration point
            print(f"[FLOWEXA SMS OTP] Code {code} envoyé au numéro {target}")

        return code

    @staticmethod
    def verify_otp_code(target: str, otp_type: str, code: str) -> bool:
        try:
            record = OTPCode.objects.filter(
                target=target,
                otp_type=otp_type,
                is_used=False
            ).order_by('-created_at').first()

            if not record:
                return False

            record.attempts += 1
            record.save(update_fields=['attempts'])

            if not record.is_valid:
                return False

            if record.code == code.strip():
                record.is_used = True
                record.save(update_fields=['is_used'])
                return True

            return False
        except Exception:
            return False

    @staticmethod
    def create_jwt_for_user(user, request=None):
        refresh = RefreshToken.for_user(user)

        # Custom claims for instant client-side decoding
        refresh['email'] = user.email
        refresh['role'] = user.role
        refresh['full_name'] = user.full_name

        # Track session if request is present
        if request:
            ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
            if ip_address and ',' in ip_address:
                ip_address = ip_address.split(',')[0].strip()
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            try:
                UserSecuritySession.objects.create(
                    user=user,
                    refresh_token_jti=str(refresh.get('jti', '')),
                    ip_address=ip_address or None,
                    user_agent=user_agent
                )
            except Exception:
                pass

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
