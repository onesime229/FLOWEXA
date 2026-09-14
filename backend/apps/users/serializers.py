from rest_framework import serializers
from .models import User, UserRole


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    initials = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'phone',
            'first_name',
            'last_name',
            'full_name',
            'initials',
            'role',
            'is_active',
            'is_email_verified',
            'is_phone_verified',
            'avatar',
            'preferred_language',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'email',
            'role',
            'is_active',
            'is_email_verified',
            'is_phone_verified',
            'created_at',
            'updated_at',
        ]


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'phone',
            'preferred_language',
            'avatar',
        ]
