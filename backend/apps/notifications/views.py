from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from apps.core.responses import success_response, error_response
from apps.core.pagination import FlowexaPagination
from apps.businesses.models import Business
from apps.crm.models import Contact
from .models import Notification, NotificationTemplate
from .serializers import (
    NotificationSerializer,
    NotificationSendSerializer,
    NotificationTemplateSendSerializer,
    NotificationTemplateSerializer,
)
from .services import NotificationService


class NotificationListView(generics.ListAPIView):
    """
    Historique des notifications envoyées.
    Optimisé B32: Jointures préventives select_related et pagination standardisée.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer
    pagination_class = FlowexaPagination

    def get_queryset(self):
        queryset = Notification.objects.all().select_related('business', 'contact', 'user')
        channel = self.request.query_params.get('channel')
        if channel:
            queryset = queryset.filter(channel=channel)
        business_id = self.request.query_params.get('business_id')
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        contact_id = self.request.query_params.get('contact_id')
        if contact_id:
            queryset = queryset.filter(contact_id=contact_id)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset[:100], many=True)
        return success_response(
            data=serializer.data,
            message="Historique des notifications récupéré.",
            extra={'total_count': queryset.count()}
        )


class NotificationUnreadCountView(APIView):
    """
    Optimisé B32: Calcul ultra-rapide du compteur de notifications non lues.
    Exécute un COUNT direct en base via index (user_id, read_at) sans désérialiser les objets.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        count = Notification.objects.filter(
            user=user,
            read_at__isnull=True
        ).count()
        return success_response(
            data={'unread_count': count},
            message="Compteur de notifications non lues récupéré."
        )


class NotificationSendView(APIView):
    """
    Envoi direct d'une notification multi-canale (WhatsApp, SMS, Email, Push).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = NotificationSendSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Paramètres d'envoi invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        business = None
        if data.get('business_id'):
            business = Business.objects.filter(id=data['business_id']).first()

        contact = None
        if data.get('contact_id'):
            contact = Contact.objects.filter(id=data['contact_id']).first()

        notification = NotificationService.send(
            channel=data['channel'],
            recipient=data['recipient'],
            content=data['content'],
            title=data.get('title', ''),
            business=business,
            contact=contact,
            user=request.user,
            metadata=data.get('metadata')
        )

        return success_response(
            data=NotificationSerializer(notification).data,
            message=f"Notification transmise via {notification.get_channel_display()}.",
            status_code=status.HTTP_201_CREATED
        )


class NotificationSendFromTemplateView(APIView):
    """
    Envoi d'une notification à partir d'un template pré-configuré avec substitution des balises contextuelles.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = NotificationTemplateSendSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Paramètres invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        business = None
        if data.get('business_id'):
            business = Business.objects.filter(id=data['business_id']).first()

        contact = None
        if data.get('contact_id'):
            contact = Contact.objects.filter(id=data['contact_id']).first()

        notification = NotificationService.send_from_template(
            template_code=data['template_code'],
            recipient=data['recipient'],
            context=data.get('context', {}),
            business=business,
            contact=contact,
            user=request.user
        )

        return success_response(
            data=NotificationSerializer(notification).data,
            message="Notification envoyée selon le modèle.",
            status_code=status.HTTP_201_CREATED
        )


class NotificationMarkReadView(APIView):
    """
    Marquer une notification comme lue.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        notification = get_object_or_404(Notification, id=id)
        notification.read_at = timezone.now()
        notification.save(update_fields=['read_at'])
        return success_response(message="Notification marquée comme lue.")


class NotificationTemplateListCreateView(generics.ListCreateAPIView):
    """
    Lister et créer des modèles de notification réutilisables.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = NotificationTemplate.objects.filter(is_active=True)
    serializer_class = NotificationTemplateSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data, message="Modèles de notification récupérés.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Erreur de validation du modèle.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        template = serializer.save()
        return success_response(
            data=serializer.data,
            message="Modèle de notification créé avec succès.",
            status_code=status.HTTP_201_CREATED
        )
