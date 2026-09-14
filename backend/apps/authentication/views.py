from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from apps.core.responses import success_response, error_response
from apps.users.models import User
from apps.users.serializers import UserSerializer
from .models import OTPType, UserSecuritySession
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer,
    UserSecuritySessionSerializer,
)
from .services import AuthService


class RegisterView(APIView):
    """
    Inscription d'un nouvel utilisateur (CLIENT ou BUSINESS_OWNER).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Erreur de validation des données d'inscription.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()
        tokens = AuthService.create_jwt_for_user(user, request)

        # Send welcome OTP for email verification
        AuthService.generate_otp_code(
            target=user.email,
            otp_type=OTPType.EMAIL_VERIFICATION,
            user=user
        )

        return success_response(
            data={
                'user': UserSerializer(user).data,
                'tokens': tokens,
            },
            message="Compte créé avec succès. Un code de vérification vous a été envoyé.",
            status_code=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    """
    Connexion utilisateur par email et mot de passe avec délivrance de tokens JWT.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Identifiants invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        user = serializer.validated_data['user']
        tokens = AuthService.create_jwt_for_user(user, request)

        return success_response(
            data={
                'user': UserSerializer(user).data,
                'tokens': tokens,
            },
            message="Connexion réussie."
        )


class LogoutView(APIView):
    """
    Déconnexion sécurisée : blacklistage du refresh token et fermeture de session.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return error_response(
                message="Le token de rafraîchissement (refresh) est requis pour la déconnexion.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh_token)
            jti = str(token.get('jti', ''))
            token.blacklist()

            # Deactivate security session
            UserSecuritySession.objects.filter(
                user=request.user,
                refresh_token_jti=jti
            ).update(is_active=False)

            return success_response(
                message="Déconnexion effectuée avec succès."
            )
        except Exception as exc:
            return error_response(
                message="Token invalide ou déjà révoqué.",
                errors=str(exc),
                status_code=status.HTTP_400_BAD_REQUEST
            )


class PasswordChangeView(APIView):
    """
    Changement sécurisé du mot de passe pour un utilisateur authentifié.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Erreur de validation du changement de mot de passe.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return error_response(
                message="L'ancien mot de passe est incorrect.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return success_response(
            message="Mot de passe modifié avec succès."
        )


class PasswordResetRequestView(APIView):
    """
    Demande de réinitialisation de mot de passe par envoi d'un code OTP.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Adresse email invalide.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        email = serializer.validated_data['email']
        user = User.objects.filter(email=email).first()

        # Always return 200 to prevent email enumeration attacks
        if user and user.is_active:
            AuthService.generate_otp_code(
                target=email,
                otp_type=OTPType.PASSWORD_RESET,
                user=user
            )

        return success_response(
            message="Si un compte correspond à cette adresse, un code de réinitialisation a été envoyé."
        )


class PasswordResetConfirmView(APIView):
    """
    Validation du code OTP et définition du nouveau mot de passe.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Erreur de validation.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        new_password = serializer.validated_data['new_password']

        is_valid = AuthService.verify_otp_code(
            target=email,
            otp_type=OTPType.PASSWORD_RESET,
            code=code
        )

        if not is_valid:
            return error_response(
                message="Code de réinitialisation invalide ou expiré.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(email=email).first()
        if not user:
            return error_response(
                message="Utilisateur introuvable.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        user.set_password(new_password)
        user.save()

        return success_response(
            message="Votre mot de passe a été réinitialisé avec succès. Vous pouvez désormais vous connecter."
        )


class SendOTPView(APIView):
    """
    Envoi d'un code OTP pour vérification email ou téléphone.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Données OTP invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        target = serializer.validated_data['target']
        otp_type = serializer.validated_data['otp_type']

        AuthService.generate_otp_code(
            target=target,
            otp_type=otp_type,
            user=request.user
        )

        return success_response(
            message=f"Code de vérification envoyé avec succès à {target}."
        )


class VerifyOTPView(APIView):
    """
    Vérification d'un code OTP et confirmation du canal associé.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Données de vérification invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        target = serializer.validated_data['target']
        otp_type = serializer.validated_data['otp_type']
        code = serializer.validated_data['code']

        is_valid = AuthService.verify_otp_code(target, otp_type, code)
        if not is_valid:
            return error_response(
                message="Code de vérification incorrect ou expiré.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Mark corresponding verified flags on user profile
        user = request.user
        if otp_type == OTPType.EMAIL_VERIFICATION and target.lower() == user.email.lower():
            user.is_email_verified = True
            user.save(update_fields=['is_email_verified'])
        elif otp_type == OTPType.PHONE_VERIFICATION:
            user.phone = target
            user.is_phone_verified = True
            user.save(update_fields=['phone', 'is_phone_verified'])

        return success_response(
            data={'user': UserSerializer(user).data},
            message="Vérification réussie avec succès."
        )


class UserSessionsView(APIView):
    """
    Consultation des sessions de sécurité actives pour l'utilisateur.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = UserSecuritySession.objects.filter(user=request.user, is_active=True)
        serializer = UserSecuritySessionSerializer(sessions, many=True)
        return success_response(
            data=serializer.data,
            message="Sessions actives récupérées."
        )
