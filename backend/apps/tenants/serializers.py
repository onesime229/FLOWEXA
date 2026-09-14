from rest_framework import serializers
from .models import Tenant


class TenantSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')
    businesses_count = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            'id',
            'name',
            'slug',
            'owner',
            'owner_email',
            'max_businesses',
            'is_active',
            'businesses_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_businesses_count(self, obj):
        return obj.businesses.filter(is_active=True).count()


class TenantCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['name', 'slug']

    def create(self, validated_data):
        user = self.context['request'].user
        tenant = Tenant.objects.create(owner=user, **validated_data)
        return tenant
