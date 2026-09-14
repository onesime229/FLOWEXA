from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum
from apps.core.responses import success_response, error_response
from apps.core.pagination import FlowexaPagination
from apps.businesses.models import Business, BusinessMembership
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
)
from .serializers import (
    ContactListSerializer,
    ContactDetailSerializer,
    ContactCreateUpdateSerializer,
    BusinessRelationSerializer,
    InteractionSerializer,
    DemandeSerializer,
    FavoriSerializer,
    SegmentSerializer,
    CrmActivityLogSerializer,
)


class BaseCrmPermission(permissions.BasePermission):
    """
    Vérifie que l'utilisateur est authentifié et membre du tenant ou de l'entreprise.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class ContactListCreateView(generics.ListCreateAPIView):
    """
    Liste et création des contacts CRM (Clients et Prospects).
    Optimisé B32: Jointures préventives select_related/prefetch_related et pagination standard.
    """
    permission_classes = [BaseCrmPermission]
    pagination_class = FlowexaPagination

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ContactCreateUpdateSerializer
        return ContactListSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Contact.objects.filter(is_active=True).select_related('tenant').prefetch_related('business_relations__business')

        # Tenant isolation
        if not (user.is_superuser or getattr(user, 'role', '') == 'SUPER_ADMIN'):
            # Fetch tenants where user is owner or business member
            accessible_tenant_ids = set()
            # As owner of tenant
            accessible_tenant_ids.update(Tenant.objects.filter(owner=user).values_list('id', flat=True))
            # As member of a business under tenant
            accessible_tenant_ids.update(
                BusinessMembership.objects.filter(user=user, is_active=True).values_list('business__tenant_id', flat=True)
            )
            queryset = queryset.filter(tenant_id__in=accessible_tenant_ids)

        # Filters
        business_id = self.request.query_params.get('business_id')
        if business_id:
            queryset = queryset.filter(business_relations__business_id=business_id)

        relation_type = self.request.query_params.get('relation_type')
        if relation_type:
            queryset = queryset.filter(business_relations__relation_type=relation_type)

        stage = self.request.query_params.get('stage')
        if stage:
            queryset = queryset.filter(business_relations__stage=stage)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(company__icontains=search)
            )

        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__contains=tag)

        return queryset.distinct()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return success_response(
            data=serializer.data,
            message="Liste des contacts CRM récupérée avec succès.",
            extra={'total_count': len(serializer.data)}
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Erreur lors de la création du contact.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        contact = serializer.save()

        # Log activity
        CrmActivityLog.objects.create(
            contact=contact,
            user=request.user,
            action="CONTACT_CREATED",
            description=f"Création du contact {contact.full_name}",
            metadata={"initial_data": request.data}
        )

        return success_response(
            data=ContactDetailSerializer(contact).data,
            message="Contact créé avec succès.",
            status_code=status.HTTP_201_CREATED
        )


class ContactDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Consultation complète, modification et suppression d'un contact CRM.
    """
    permission_classes = [BaseCrmPermission]
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ContactCreateUpdateSerializer
        return ContactDetailSerializer

    def get_queryset(self):
        return Contact.objects.filter(is_active=True).prefetch_related(
            'business_relations__business',
            'segments',
            'demandes'
        )

    def retrieve(self, request, *args, **kwargs):
        contact = self.get_object()
        serializer = ContactDetailSerializer(contact)
        return success_response(data=serializer.data, message="Détails du contact récupérés.")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return error_response(
                message="Erreur lors de la mise à jour du contact.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        self.perform_update(serializer)

        # Log activity
        CrmActivityLog.objects.create(
            contact=instance,
            user=request.user,
            action="CONTACT_UPDATED",
            description=f"Mise à jour des coordonnées de {instance.full_name}"
        )

        return success_response(
            data=ContactDetailSerializer(instance).data,
            message="Contact mis à jour avec succès."
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        return success_response(message="Contact archivé avec succès.")


class ContactBusinessRelationsView(APIView):
    """
    Gestion des relations multi-entreprises d'un contact :
    GET : Liste toutes les relations du contact avec les entreprises
    POST : Associer le contact à une nouvelle entreprise avec son statut (ex: Client du Coiffeur et Prospect de l'Agence)
    """
    permission_classes = [BaseCrmPermission]

    def get(self, request, contact_id):
        contact = get_object_or_404(Contact, id=contact_id, is_active=True)
        relations = BusinessRelation.objects.filter(contact=contact, is_active=True).select_related('business', 'assigned_to')
        serializer = BusinessRelationSerializer(relations, many=True)
        return success_response(
            data=serializer.data,
            message=f"Relations entreprises de {contact.full_name}."
        )

    def post(self, request, contact_id):
        contact = get_object_or_404(Contact, id=contact_id, is_active=True)
        business_id = request.data.get('business_id')
        if not business_id:
            return error_response(message="Le champ 'business_id' est requis.", status_code=status.HTTP_400_BAD_REQUEST)

        business = get_object_or_404(Business, id=business_id, is_active=True)

        relation, created = BusinessRelation.objects.get_or_create(
            contact=contact,
            business=business,
            defaults={
                'relation_type': request.data.get('relation_type', RelationType.PROSPECT),
                'stage': request.data.get('stage', PipelineStage.NEW),
                'source': request.data.get('source', 'WEBSITE'),
                'notes': request.data.get('notes', ''),
                'lifetime_value': request.data.get('lifetime_value', 0),
            }
        )

        if not created:
            # Update existing
            for key in ['relation_type', 'stage', 'source', 'notes', 'lifetime_value', 'rating']:
                if key in request.data:
                    setattr(relation, key, request.data[key])
            relation.save()

        # Log
        CrmActivityLog.objects.create(
            contact=contact,
            business=business,
            user=request.user,
            action="RELATION_LINKED" if created else "RELATION_UPDATED",
            description=f"Relation avec {business.name}: {relation.get_relation_type_display()} ({relation.get_stage_display()})"
        )

        return success_response(
            data=BusinessRelationSerializer(relation).data,
            message="Relation contact-entreprise enregistrée avec succès.",
            status_code=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class BusinessRelationDetailView(APIView):
    """
    Mise à jour d'une relation spécifique (statut, étape de pipeline, montant LTV, assignation).
    """
    permission_classes = [BaseCrmPermission]

    def patch(self, request, id):
        relation = get_object_or_404(BusinessRelation, id=id, is_active=True)
        old_stage = relation.stage
        old_type = relation.relation_type

        serializer = BusinessRelationSerializer(relation, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                message="Données de relation invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()

        # Check for stage / type changes and log
        changes = []
        if relation.stage != old_stage:
            changes.append(f"Étape modifiée de {old_stage} vers {relation.stage}")
        if relation.relation_type != old_type:
            changes.append(f"Type modifié de {old_type} vers {relation.relation_type}")

        if changes:
            CrmActivityLog.objects.create(
                contact=relation.contact,
                business=relation.business,
                user=request.user,
                action="STAGE_CHANGED",
                description="; ".join(changes)
            )

        return success_response(
            data=serializer.data,
            message="Relation mise à jour avec succès."
        )


class InteractionListCreateView(APIView):
    """
    Historique et enregistrement des interactions (Appel, WhatsApp, Visite, Devis...).
    """
    permission_classes = [BaseCrmPermission]

    def get(self, request):
        queryset = Interaction.objects.filter(is_active=True).select_related('contact', 'business', 'created_by')

        contact_id = request.query_params.get('contact_id')
        if contact_id:
            queryset = queryset.filter(contact_id=contact_id)

        business_id = request.query_params.get('business_id')
        if business_id:
            queryset = queryset.filter(business_id=business_id)

        interaction_type = request.query_params.get('interaction_type')
        if interaction_type:
            queryset = queryset.filter(interaction_type=interaction_type)

        serializer = InteractionSerializer(queryset[:100], many=True)
        return success_response(
            data=serializer.data,
            message="Liste des interactions récupérée.",
            extra={'count': queryset.count()}
        )

    def post(self, request):
        serializer = InteractionSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Erreur de validation de l'interaction.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        interaction = serializer.save(created_by=request.user)

        # Update last interaction on relation if exists
        BusinessRelation.objects.filter(
            contact=interaction.contact,
            business=interaction.business
        ).update(last_interaction_at=interaction.performed_at)

        # Log
        CrmActivityLog.objects.create(
            contact=interaction.contact,
            business=interaction.business,
            user=request.user,
            action="INTERACTION_LOGGED",
            description=f"{interaction.get_interaction_type_display()} : {interaction.title}"
        )

        return success_response(
            data=InteractionSerializer(interaction).data,
            message="Interaction enregistrée avec succès.",
            status_code=status.HTTP_201_CREATED
        )


class DemandeListCreateView(APIView):
    """
    Consultation et création des demandes clients (Recherche immo, réservation guest house, soins...).
    """
    permission_classes = [BaseCrmPermission]

    def get(self, request):
        queryset = Demande.objects.filter(is_active=True).select_related('contact', 'business', 'tenant')

        contact_id = request.query_params.get('contact_id')
        if contact_id:
            queryset = queryset.filter(contact_id=contact_id)

        business_id = request.query_params.get('business_id')
        if business_id:
            queryset = queryset.filter(business_id=business_id)

        module_code = request.query_params.get('module_code')
        if module_code:
            queryset = queryset.filter(module_code=module_code)

        demande_status = request.query_params.get('status')
        if demande_status:
            queryset = queryset.filter(status=demande_status)

        serializer = DemandeSerializer(queryset[:100], many=True)
        return success_response(
            data=serializer.data,
            message="Liste des demandes clients récupérée.",
            extra={'count': queryset.count()}
        )

    def post(self, request):
        serializer = DemandeSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Erreur de validation de la demande.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        demande = serializer.save()

        # Log
        CrmActivityLog.objects.create(
            contact=demande.contact,
            business=demande.business,
            user=request.user,
            action="DEMANDE_CREATED",
            description=f"Nouvelle demande ({demande.module_code}): {demande.title}"
        )

        return success_response(
            data=DemandeSerializer(demande).data,
            message="Demande enregistrée avec succès.",
            status_code=status.HTTP_201_CREATED
        )


class DemandeDetailView(generics.RetrieveUpdateAPIView):
    """
    Détails et mise à jour d'une demande client (changement de statut, affectation).
    """
    permission_classes = [BaseCrmPermission]
    queryset = Demande.objects.filter(is_active=True)
    serializer_class = DemandeSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return error_response(
                message="Erreur lors de la mise à jour de la demande.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        self.perform_update(serializer)
        return success_response(
            data=serializer.data,
            message="Demande mise à jour avec succès."
        )


class FavoriListCreateView(APIView):
    """
    Gestion des favoris d'un contact (biens immobiliers, chambres, forfaits de services).
    """
    permission_classes = [BaseCrmPermission]

    def get(self, request):
        contact_id = request.query_params.get('contact_id')
        if not contact_id:
            return error_response(message="Paramètre 'contact_id' requis.", status_code=status.HTTP_400_BAD_REQUEST)

        favoris = Favori.objects.filter(contact_id=contact_id, is_active=True).select_related('business')
        serializer = FavoriSerializer(favoris, many=True)
        return success_response(data=serializer.data, message="Favoris récupérés.")

    def post(self, request):
        serializer = FavoriSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Données de favori invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        favori = serializer.save()
        return success_response(
            data=FavoriSerializer(favori).data,
            message="Élément ajouté aux favoris.",
            status_code=status.HTTP_201_CREATED
        )

    def delete(self, request, id):
        favori = get_object_or_404(Favori, id=id)
        favori.delete()
        return success_response(message="Favori supprimé avec succès.")


class SegmentListCreateView(generics.ListCreateAPIView):
    """
    Gestion des segments de contacts (Clients VIP, Prospects Chauds, etc.).
    """
    permission_classes = [BaseCrmPermission]
    serializer_class = SegmentSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Segment.objects.filter(is_active=True)
        tenant_id = self.request.query_params.get('tenant_id')
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
        business_id = self.request.query_params.get('business_id')
        if business_id:
            queryset = queryset.filter(Q(business_id=business_id) | Q(business__isnull=True))
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data, message="Segments récupérés.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Erreur de validation du segment.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        segment = serializer.save()
        return success_response(
            data=SegmentSerializer(segment).data,
            message="Segment créé avec succès.",
            status_code=status.HTTP_201_CREATED
        )


class SegmentManageContactsView(APIView):
    """
    Ajouter ou retirer un contact d'un segment.
    """
    permission_classes = [BaseCrmPermission]

    def post(self, request, segment_id):
        segment = get_object_or_404(Segment, id=segment_id, is_active=True)
        contact_id = request.data.get('contact_id')
        action = request.data.get('action', 'add')  # 'add' or 'remove'

        if not contact_id:
            return error_response(message="Champ 'contact_id' requis.", status_code=status.HTTP_400_BAD_REQUEST)

        contact = get_object_or_404(Contact, id=contact_id, is_active=True)

        if action == 'add':
            segment.contacts.add(contact)
            msg = f"{contact.full_name} ajouté au segment {segment.name}."
        else:
            segment.contacts.remove(contact)
            msg = f"{contact.full_name} retiré du segment {segment.name}."

        return success_response(
            data={'segment_id': segment.id, 'contacts_count': segment.contacts.count()},
            message=msg
        )


class ContactHistoryView(APIView):
    """
    Consultation de l'historique chronologique complet (Activity Log) d'un contact.
    """
    permission_classes = [BaseCrmPermission]

    def get(self, request, contact_id):
        contact = get_object_or_404(Contact, id=contact_id, is_active=True)
        logs = CrmActivityLog.objects.filter(contact=contact).select_related('user', 'business')
        serializer = CrmActivityLogSerializer(logs[:100], many=True)
        return success_response(
            data=serializer.data,
            message=f"Historique d'activité de {contact.full_name}."
        )
