from rest_framework import serializers
from .models import Conversation, Message, ConversationStatus, MessageSenderRole


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id',
            'conversation',
            'sender_role',
            'sender_id',
            'sender_name',
            'content',
            'is_read',
            'read_at',
            'attachments',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'is_read', 'read_at', 'created_at', 'updated_at']


class ConversationListSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    catalog_item_title = serializers.CharField(source='catalog_item.title', read_only=True, default=None)

    class Meta:
        model = Conversation
        fields = [
            'id',
            'business',
            'business_name',
            'client_user',
            'client_name',
            'client_phone',
            'client_email',
            'catalog_item',
            'catalog_item_title',
            'request_id',
            'booking_id',
            'appointment_id',
            'status',
            'last_message',
            'last_message_at',
            'last_message_sender',
            'unread_count_client',
            'unread_count_business',
            'created_at',
            'updated_at',
        ]


class ConversationDetailSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    catalog_item_title = serializers.CharField(source='catalog_item.title', read_only=True, default=None)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [
            'id',
            'business',
            'business_name',
            'client_user',
            'client_name',
            'client_phone',
            'client_email',
            'catalog_item',
            'catalog_item_title',
            'request_id',
            'booking_id',
            'appointment_id',
            'status',
            'last_message',
            'last_message_at',
            'last_message_sender',
            'unread_count_client',
            'unread_count_business',
            'closed_at',
            'closed_by',
            'created_at',
            'updated_at',
            'messages',
        ]
