from rest_framework import serializers
from .models import Notification, NotificationTemplate, NotificationChannel, NotificationStatus


class NotificationSerializer(serializers.ModelSerializer):
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    contact_name = serializers.CharField(source='contact.full_name', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'tenant',
            'business',
            'business_name',
            'contact',
            'contact_name',
            'user',
            'channel',
            'channel_display',
            'recipient',
            'template_code',
            'title',
            'content',
            'status',
            'status_display',
            'provider',
            'sent_at',
            'delivered_at',
            'read_at',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'provider', 'sent_at', 'delivered_at', 'read_at', 'created_at']


class NotificationSendSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=NotificationChannel.choices)
    recipient = serializers.CharField(help_text="Numéro WhatsApp/SMS (+229...), Email ou Device Token")
    title = serializers.CharField(required=False, allow_blank=True, default="")
    content = serializers.CharField(required=True)
    business_id = serializers.UUIDField(required=False, allow_null=True)
    contact_id = serializers.UUIDField(required=False, allow_null=True)
    metadata = serializers.DictField(required=False, default=dict)


class NotificationTemplateSendSerializer(serializers.Serializer):
    template_code = serializers.CharField(required=True)
    recipient = serializers.CharField(required=True)
    context = serializers.DictField(required=False, default=dict)
    business_id = serializers.UUIDField(required=False, allow_null=True)
    contact_id = serializers.UUIDField(required=False, allow_null=True)


class NotificationTemplateSerializer(serializers.ModelSerializer):
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)

    class Meta:
        model = NotificationTemplate
        fields = [
            'id',
            'code',
            'channel',
            'channel_display',
            'title',
            'content',
            'variables_description',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
