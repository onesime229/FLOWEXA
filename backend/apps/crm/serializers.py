from rest_framework import serializers
from apps.users.models import User
from apps.businesses.models import Business
from apps.tenants.models import Tenant
from .models import (
    Contact,
    BusinessRelation,
    Interaction,
    Demande,
    Favori,
    Segment,
    CrmActivityLog,
    RelationType,
    PipelineStage,
    LeadSource,
    InteractionType,
    InteractionStatus,
    DemandeStatus,
    DemandePriority,
)


class BusinessRelationSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    business_module = serializers.CharField(source='business.module_code', read_only=True)
    relation_type_display = serializers.CharField(source='get_relation_type_display', read_only=True)
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = BusinessRelation
        fields = [
            'id',
            'contact',
            'business',
            'business_name',
            'business_module',
            'relation_type',
            'relation_type_display',
            'stage',
            'stage_display',
            'source',
            'source_display',
            'assigned_to',
            'assigned_to_name',
            'rating',
            'lifetime_value',
            'notes',
            'first_interaction_at',
            'last_interaction_at',
            'meta_data',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.email
        return None


class ContactListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    total_lifetime_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    businesses_count = serializers.IntegerField(read_only=True)
    relations_summary = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = [
            'id',
            'tenant',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'phone',
            'whatsapp',
            'company',
            'city',
            'country',
            'avatar',
            'tags',
            'total_lifetime_value',
            'businesses_count',
            'relations_summary',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_relations_summary(self, obj):
        return [
            {
                'business_id': rel.business_id,
                'business_name': rel.business.name,
                'business_module': rel.business.module_code,
                'relation_type': rel.relation_type,
                'stage': rel.stage,
                'lifetime_value': rel.lifetime_value,
            }
            for rel in obj.business_relations.select_related('business').all()
        ]


class ContactDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    total_lifetime_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    businesses_count = serializers.IntegerField(read_only=True)
    business_relations = BusinessRelationSerializer(many=True, read_only=True)
    segments_summary = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = [
            'id',
            'tenant',
            'user',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'phone',
            'whatsapp',
            'company',
            'job_title',
            'address',
            'city',
            'country',
            'avatar',
            'notes',
            'tags',
            'custom_fields',
            'total_lifetime_value',
            'businesses_count',
            'business_relations',
            'segments_summary',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_segments_summary(self, obj):
        return [
            {'id': seg.id, 'name': seg.name, 'color': seg.color}
            for seg in obj.segments.all()
        ]


class ContactCreateUpdateSerializer(serializers.ModelSerializer):
    # Optionnel: initialiser immédiatement une relation avec une entreprise
    initial_business_id = serializers.UUIDField(required=False, write_only=True)
    initial_relation_type = serializers.ChoiceField(
        choices=RelationType.choices,
        default=RelationType.PROSPECT,
        required=False,
        write_only=True
    )
    initial_stage = serializers.ChoiceField(
        choices=PipelineStage.choices,
        default=PipelineStage.NEW,
        required=False,
        write_only=True
    )
    initial_source = serializers.ChoiceField(
        choices=LeadSource.choices,
        default=LeadSource.WEBSITE,
        required=False,
        write_only=True
    )

    class Meta:
        model = Contact
        fields = [
            'id',
            'tenant',
            'user',
            'first_name',
            'last_name',
            'email',
            'phone',
            'whatsapp',
            'company',
            'job_title',
            'address',
            'city',
            'country',
            'avatar',
            'notes',
            'tags',
            'custom_fields',
            'initial_business_id',
            'initial_relation_type',
            'initial_stage',
            'initial_source',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        biz_id = validated_data.pop('initial_business_id', None)
        rel_type = validated_data.pop('initial_relation_type', RelationType.PROSPECT)
        stage = validated_data.pop('initial_stage', PipelineStage.NEW)
        source = validated_data.pop('initial_source', LeadSource.WEBSITE)

        contact = Contact.objects.create(**validated_data)

        if biz_id:
            try:
                business = Business.objects.get(id=biz_id)
                BusinessRelation.objects.create(
                    contact=contact,
                    business=business,
                    relation_type=rel_type,
                    stage=stage,
                    source=source
                )
            except Business.DoesNotExist:
                pass

        return contact


class InteractionSerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(source='contact.full_name', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    author_name = serializers.SerializerMethodField()
    interaction_type_display = serializers.CharField(source='get_interaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Interaction
        fields = [
            'id',
            'business',
            'business_name',
            'contact',
            'contact_name',
            'business_relation',
            'created_by',
            'author_name',
            'interaction_type',
            'interaction_type_display',
            'status',
            'status_display',
            'title',
            'details',
            'performed_at',
            'next_follow_up',
            'outcome',
            'meta_data',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_author_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.email
        return None


class DemandeSerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(source='contact.full_name', read_only=True)
    contact_phone = serializers.CharField(source='contact.phone', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Demande
        fields = [
            'id',
            'contact',
            'contact_name',
            'contact_phone',
            'business',
            'business_name',
            'tenant',
            'module_code',
            'title',
            'description',
            'budget_min',
            'budget_max',
            'currency',
            'location',
            'priority',
            'priority_display',
            'status',
            'status_display',
            'criteria',
            'assigned_to',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FavoriSerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(source='contact.full_name', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)

    class Meta:
        model = Favori
        fields = [
            'id',
            'contact',
            'contact_name',
            'business',
            'business_name',
            'item_type',
            'item_id',
            'item_title',
            'item_price',
            'item_metadata',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SegmentSerializer(serializers.ModelSerializer):
    contacts_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Segment
        fields = [
            'id',
            'tenant',
            'business',
            'name',
            'slug',
            'description',
            'color',
            'criteria',
            'contacts_count',
            'created_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at']


class CrmActivityLogSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = CrmActivityLog
        fields = [
            'id',
            'contact',
            'business',
            'user',
            'author_name',
            'action',
            'description',
            'metadata',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_author_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
        return "Système"
