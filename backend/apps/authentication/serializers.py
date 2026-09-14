from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from apps.users.models import User, UserRole
from .models import OTPType, UserSecuritySession


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True, default="")
    last_name = serializers.CharField(required=False, allow_blank=True, default="")
    phone = serializers.CharField(required=False, allow_blank=True, default="")
    role = serializers.ChoiceField(
        choices=[UserRole.CLIENT, UserRole.BUSINESS_OWNER],
        default=UserRole.CLIENT
    )

    def validate_email(self, value):
        norm_email = value.lower().strip()
        if User.objects.filter(email=norm_email).exists():
            raise serializers.ValidationError("Un compte avec cette adresse email existe déjà.")
        return norm_email

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError("Email et mot de passe sont requis.")

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Identifiants incorrects (email ou mot de passe invalide).")

        if not user.is_active:
            raise serializers.ValidationError("Ce compte utilisateur est désactivé.")

        attrs['user'] = user
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "Les mots de passe ne correspondent pas."})
        validate_password(attrs['new_password'])
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower().strip()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=10)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "Les mots de passe ne correspondent pas."})
        validate_password(attrs['new_password'])
        return attrs


class SendOTPSerializer(serializers.Serializer):
    target = serializers.CharField()
    otp_type = serializers.ChoiceField(choices=OTPType.choices)


    def validate_target(self, value):
        return value.strip()


class VerifyOTPSerializer(serializers.Serializer):
    target = serializers.CharField()
    otp_type = serializers.ChoiceField(choices=OTPType.choices)
    code = serializers.CharField(max_length=10)


class UserSecuritySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSecuritySession
        fields = [
            'id',
            'ip_address',
            'user_agent',
            'device_name',
            'is_active',
            'last_activity',
            'created_at',
        ]
