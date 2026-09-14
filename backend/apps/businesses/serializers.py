from rest_framework import serializers
from apps.users.models import User
from apps.tenants.models import Tenant
from .models import Business, BusinessMembership, BusinessModule, BusinessMembershipRole


class BusinessSerializer(serializers.ModelSerializer):
    tenant_name = serializers.ReadOnlyField(source='tenant.name')
    module_display = serializers.CharField(source='get_module_code_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = [
            'id',
            'tenant',
            'tenant_name',
            'name',
            'slug',
            'description',
            'logo',
            'module_code',
            'module_display',
            'enabled_modules',
            'status',
            'status_display',
            'phone',
            'email',
            'website',
            'address',
            'city',
            'country',
            'latitude',
            'longitude',
            'currency',
            'opening_hours',
            'social_media',
            'is_active',
            'settings',
            'members_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_members_count(self, obj):
        if hasattr(obj, 'members_count_annotated'):
            return obj.members_count_annotated
        return obj.memberships.filter(is_active=True).count()


class BusinessCreateSerializer(serializers.ModelSerializer):
    tenant_id = serializers.UUIDField(required=False)
    slug = serializers.SlugField(required=False, allow_blank=True)
    enabled_modules = serializers.ListField(
        child=serializers.ChoiceField(choices=BusinessModule.choices),
        required=False,
        default=list
    )

    class Meta:
        model = Business
        fields = [
            'tenant_id',
            'name',
            'slug',
            'description',
            'logo',
            'module_code',
            'enabled_modules',
            'status',
            'phone',
            'email',
            'website',
            'address',
            'city',
            'country',
            'latitude',
            'longitude',
            'currency',
            'opening_hours',
            'social_media',
            'settings',
        ]

    def validate(self, attrs):
        user = self.context['request'].user
        tenant_id = attrs.get('tenant_id')

        if tenant_id:
            tenant = Tenant.objects.filter(id=tenant_id).first()
            if not tenant:
                raise serializers.ValidationError({"tenant_id": "Organisation introuvable."})
            if not (user.is_superuser or tenant.owner == user):
                raise serializers.ValidationError({"tenant_id": "Vous n'avez pas l'autorisation d'ajouter une entreprise à cette organisation."})
        else:
            # Auto-assign or create default tenant for business owner
            tenant = Tenant.objects.filter(owner=user).first()
            if not tenant:
                tenant = Tenant.objects.create(
                    name=f"Organisation {user.full_name or user.email}",
                    owner=user
                )
            attrs['tenant'] = tenant

        if 'tenant_id' in attrs:
            attrs['tenant'] = Tenant.objects.get(id=attrs.pop('tenant_id'))

        # Check tenant business limit
        current_count = attrs['tenant'].businesses.filter(is_active=True).count()
        if current_count >= attrs['tenant'].max_businesses:
            raise serializers.ValidationError(
                f"Limite maximale de {attrs['tenant'].max_businesses} entreprises atteinte pour cette organisation."
            )

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        business = Business.objects.create(**validated_data)

        # Automatically assign creator as OWNER in BusinessMembership
        BusinessMembership.objects.create(
            business=business,
            user=user,
            role=BusinessMembershipRole.OWNER
        )

        return business


class BusinessMembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    user_full_name = serializers.ReadOnlyField(source='user.full_name')
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = BusinessMembership
        fields = [
            'id',
            'business',
            'user',
            'user_email',
            'user_full_name',
            'role',
            'role_display',
            'is_active',
            'joined_at',
        ]
        read_only_fields = ['id', 'joined_at']


class AddBusinessMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=[BusinessMembershipRole.MANAGER, BusinessMembershipRole.EMPLOYEE],
        default=BusinessMembershipRole.EMPLOYEE
    )
    first_name = serializers.CharField(required=False, allow_blank=True, default="")
    last_name = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_email(self, value):
        return value.lower().strip()


class BusinessUpdateSerializer(serializers.ModelSerializer):
    enabled_modules = serializers.ListField(
        child=serializers.ChoiceField(choices=BusinessModule.choices),
        required=False
    )

    class Meta:
        model = Business
        fields = [
            'name',
            'description',
            'phone',
            'email',
            'website',
            'address',
            'city',
            'country',
            'latitude',
            'longitude',
            'currency',
            'opening_hours',
            'social_media',
            'status',
            'module_code',
            'enabled_modules',
            'settings',
        ]


class BusinessLogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ['logo']


class BusinessModulesUpdateSerializer(serializers.Serializer):
    enabled_modules = serializers.ListField(
        child=serializers.ChoiceField(choices=BusinessModule.choices),
        allow_empty=False
    )
    primary_module = serializers.ChoiceField(
        choices=BusinessModule.choices,
        required=False
    )

    def validate(self, attrs):
        enabled = attrs.get('enabled_modules', [])
        primary = attrs.get('primary_module')
        if primary and primary not in enabled:
            enabled.append(primary)
            attrs['enabled_modules'] = enabled
        return attrs
