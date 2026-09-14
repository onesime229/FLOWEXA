from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Conversation, Message, ConversationStatus, MessageSenderRole
from .serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    MessageSerializer,
)


class ConversationViewSet(viewsets.ModelViewSet):
    """
    Gestion des conversations directes entre clients et entreprises.
    Applique le cloisonnement strict multi-tenant :
    - Un client n'accède qu'à ses propres conversations.
    - Une entreprise n'accède qu'aux conversations de son établissement.
    - Le Super Admin possède une visibilité globale avec traçabilité.
    """
    queryset = Conversation.objects.all()
    serializer_class = ConversationListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Conversation.objects.all().select_related('business', 'catalog_item')

        if getattr(user, 'is_superuser', False) or getattr(user, 'role', '') == 'SUPER_ADMIN':
            return qs

        if getattr(user, 'business', None):
            return qs.filter(business=user.business)

        return qs.filter(client_user=user)

    @action(detail=True, methods=['post'], url_path='messages')
    def send_message(self, request, pk=None):
        conversation = self.get_object()

        if conversation.status == ConversationStatus.CLOSED:
            return Response(
                {'detail': 'Cette conversation est clôturée.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        content = request.data.get('content', '').strip()
        if not content:
            return Response(
                {'detail': 'Le contenu du message ne peut pas être vide.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        sender_role = MessageSenderRole.CLIENT
        sender_name = f"{user.first_name} {user.last_name}".strip() or user.username
        if getattr(user, 'business', None) and conversation.business == user.business:
            sender_role = MessageSenderRole.BUSINESS
            sender_name = user.business.name
        elif getattr(user, 'is_superuser', False):
            sender_role = MessageSenderRole.SUPER_ADMIN

        msg = Message.objects.create(
            conversation=conversation,
            sender_role=sender_role,
            sender_id=str(user.id),
            sender_name=sender_name,
            content=content,
        )

        # Mise à jour de l'aperçu de la conversation
        conversation.last_message = content
        conversation.last_message_at = timezone.now()
        conversation.last_message_sender = sender_role

        if sender_role == MessageSenderRole.CLIENT:
            conversation.unread_count_business += 1
        else:
            conversation.unread_count_client += 1

        conversation.save(update_fields=[
            'last_message',
            'last_message_at',
            'last_message_sender',
            'unread_count_client',
            'unread_count_business',
            'updated_at'
        ])

        serializer = MessageSerializer(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch', 'post'], url_path='read')
    def mark_as_read(self, request, pk=None):
        conversation = self.get_object()
        user = request.user
        now = timezone.now()

        if getattr(user, 'business', None) and conversation.business == user.business:
            # L'entreprise lit les messages envoyés par le client
            conversation.messages.filter(sender_role=MessageSenderRole.CLIENT, is_read=False).update(
                is_read=True,
                read_at=now
            )
            conversation.unread_count_business = 0
            conversation.save(update_fields=['unread_count_business', 'updated_at'])
        else:
            # Le client lit les messages envoyés par l'entreprise
            conversation.messages.filter(sender_role=MessageSenderRole.BUSINESS, is_read=False).update(
                is_read=True,
                read_at=now
            )
            conversation.unread_count_client = 0
            conversation.save(update_fields=['unread_count_client', 'updated_at'])

        return Response({'status': 'marked_as_read'})

    @action(detail=True, methods=['patch'], url_path='close')
    def close_conversation(self, request, pk=None):
        conversation = self.get_object()
        conversation.status = ConversationStatus.CLOSED
        conversation.closed_at = timezone.now()
        conversation.closed_by = request.user.username
        conversation.save(update_fields=['status', 'closed_at', 'closed_by', 'updated_at'])
        return Response({'status': 'closed', 'id': str(conversation.id)})
