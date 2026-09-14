from django.db.models import Count, Q
from rest_framework import generics, permissions, status, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.core.responses import success_response, error_response
from apps.core.pagination import FlowexaPagination
from apps.users.models import User, UserRole
from .models import Business, BusinessMembership, BusinessMembershipRole, BusinessModule
from .serializers import (
    BusinessSerializer,
    BusinessCreateSerializer,
    BusinessUpdateSerializer,
    BusinessLogoSerializer,
    BusinessModulesUpdateSerializer,
    BusinessMembershipSerializer,
    AddBusinessMemberSerializer,
)
from .permissions import IsBusinessMember, IsBusinessAdminOrManager


class BusinessListCreateView(generics.ListCreateAPIView):
    """
    Lister les entreprises accessibles par l'utilisateur ou en créer une nouvelle.
    Optimisé B32: Jointure préventive tenant, annotation de comptage membres (anti-N+1) et pagination standard.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = FlowexaPagination

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BusinessCreateSerializer
        return BusinessSerializer

    def get_queryset(self):
        user = self.request.user
        base_qs = Business.objects.filter(is_active=True).select_related('tenant').annotate(
            members_count_annotated=Count('memberships', filter=Q(memberships__is_active=True), distinct=True)
        )
        if user.is_superuser or getattr(user, 'role', '') == 'SUPER_ADMIN':
            return base_qs.order_by('-created_at')

        # Filter strictly by businesses where user is an active member
        return base_qs.filter(
            memberships__user=user,
            memberships__is_active=True
        ).distinct().order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BusinessSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = BusinessSerializer(queryset, many=True)
        return success_response(
            data=serializer.data,
            message="Entreprises récupérées avec succès."
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Données de création de l'entreprise invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        business = serializer.save()
        return success_response(
            data=BusinessSerializer(business).data,
            message=f"Entreprise '{business.name}' créée avec succès dans l'organisation '{business.tenant.name}'.",
            status_code=status.HTTP_201_CREATED
        )


class BusinessDetailView(generics.RetrieveUpdateAPIView):
    """
    Détails et configuration d'une entreprise spécifique.
    """
    permission_classes = [permissions.IsAuthenticated, IsBusinessMember]
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return BusinessUpdateSerializer
        return BusinessSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or getattr(user, 'role', '') == 'SUPER_ADMIN':
            return Business.objects.all().select_related('tenant')

        return Business.objects.filter(
            memberships__user=user,
            memberships__is_active=True
        ).select_related('tenant').distinct()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = BusinessSerializer(instance)
        return success_response(
            data=serializer.data,
            message="Profil de l'entreprise récupéré."
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()

        # Check write permissions (OWNER or MANAGER)
        if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'SUPER_ADMIN'):
            caller_role = BusinessMembership.objects.filter(
                business=instance,
                user=request.user,
                is_active=True
            ).values_list('role', flat=True).first()

            if caller_role not in [BusinessMembershipRole.OWNER, BusinessMembershipRole.MANAGER]:
                return error_response(
                    message="Seuls les propriétaires et gérants peuvent modifier le profil de l'entreprise.",
                    status_code=status.HTTP_403_FORBIDDEN
                )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return error_response(
                message="Erreur de validation lors de la mise à jour de l'entreprise.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        self.perform_update(serializer)
        return success_response(
            data=BusinessSerializer(instance).data,
            message="Profil de l'entreprise mis à jour avec succès."
        )


class BusinessLogoUploadView(APIView):
    """
    Téléversement et mise à jour du logo de l'entreprise.
    """
    permission_classes = [permissions.IsAuthenticated, IsBusinessMember]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, id):
        business = get_object_or_404(Business, id=id, is_active=True)

        # Check write permissions
        if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'SUPER_ADMIN'):
            role = BusinessMembership.objects.filter(
                business=business,
                user=request.user,
                is_active=True
            ).values_list('role', flat=True).first()
            if role not in [BusinessMembershipRole.OWNER, BusinessMembershipRole.MANAGER]:
                return error_response(
                    message="Seul un propriétaire ou gérant peut modifier le logo.",
                    status_code=status.HTTP_403_FORBIDDEN
                )

        serializer = BusinessLogoSerializer(business, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                message="Fichier de logo invalide.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()
        return success_response(
            data=BusinessSerializer(business).data,
            message="Logo de l'entreprise mis à jour avec succès."
        )


class BusinessModulesView(APIView):
    """
    Consultation des modules disponibles et gestion des modules activés pour l'entreprise.
    """
    permission_classes = [permissions.IsAuthenticated, IsBusinessMember]

    def get(self, request, id):
        business = get_object_or_404(Business, id=id, is_active=True)
        all_modules = [
            {'code': choice[0], 'label': str(choice[1])}
            for choice in BusinessModule.choices
        ]
        return success_response(
            data={
                'primary_module': business.module_code,
                'enabled_modules': business.enabled_modules,
                'available_modules': all_modules,
            },
            message="Configuration des modules de l'entreprise."
        )

    def post(self, request, id):
        business = get_object_or_404(Business, id=id, is_active=True)

        if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'SUPER_ADMIN'):
            role = BusinessMembership.objects.filter(
                business=business,
                user=request.user,
                is_active=True
            ).values_list('role', flat=True).first()
            if role != BusinessMembershipRole.OWNER:
                return error_response(
                    message="Seul le propriétaire de l'entreprise peut modifier les modules activés.",
                    status_code=status.HTTP_403_FORBIDDEN
                )

        serializer = BusinessModulesUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Données de modules invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        enabled = serializer.validated_data['enabled_modules']
        primary = serializer.validated_data.get('primary_module')

        business.enabled_modules = enabled
        if primary:
            business.module_code = primary
        business.save(update_fields=['enabled_modules', 'module_code'])

        return success_response(
            data=BusinessSerializer(business).data,
            message="Modules de l'entreprise mis à jour avec succès."
        )


class BusinessMemberListCreateView(APIView):
    """
    Gestion des employés et managers rattachés à une entreprise.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_business(self, business_id, user):
        if user.is_superuser or getattr(user, 'role', '') == 'SUPER_ADMIN':
            return get_object_or_404(Business, id=business_id, is_active=True)

        membership = BusinessMembership.objects.filter(
            business_id=business_id,
            user=user,
            is_active=True
        ).first()

        if not membership:
            return None
        return membership.business

    def get(self, request, business_id):
        business = self.get_business(business_id, request.user)
        if not business:
            return error_response(
                message="Vous n'avez pas accès à cette entreprise.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        members = BusinessMembership.objects.filter(
            business=business,
            is_active=True
        ).select_related('user').order_by('role', '-joined_at')

        serializer = BusinessMembershipSerializer(members, many=True)
        return success_response(
            data=serializer.data,
            message="Liste des membres de l'entreprise récupérée."
        )

    def post(self, request, business_id):
        business = self.get_business(business_id, request.user)
        if not business:
            return error_response(
                message="Vous n'avez pas accès à cette entreprise.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        # Verify user is OWNER or MANAGER or SUPER_ADMIN
        if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'SUPER_ADMIN'):
            caller_role = BusinessMembership.objects.filter(
                business=business,
                user=request.user,
                is_active=True
            ).values_list('role', flat=True).first()

            if caller_role not in [BusinessMembershipRole.OWNER, BusinessMembershipRole.MANAGER]:
                return error_response(
                    message="Seuls les propriétaires et gérants peuvent ajouter des membres.",
                    status_code=status.HTTP_403_FORBIDDEN
                )

        serializer = AddBusinessMemberSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Données de membre invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        email = serializer.validated_data['email']
        role = serializer.validated_data['role']
        first_name = serializer.validated_data.get('first_name', '')
        last_name = serializer.validated_data.get('last_name', '')

        # Find or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'role': UserRole.EMPLOYEE if role == BusinessMembershipRole.EMPLOYEE else UserRole.MANAGER
            }
        )

        # Check existing membership
        membership, m_created = BusinessMembership.objects.get_or_create(
            business=business,
            user=user,
            defaults={'role': role, 'is_active': True}
        )

        if not m_created:
            if not membership.is_active:
                membership.is_active = True
                membership.role = role
                membership.save()
            else:
                return error_response(
                    message="Cet utilisateur est déjà membre de cette entreprise.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        return success_response(
            data=BusinessMembershipSerializer(membership).data,
            message=f"Membre '{user.email}' ajouté avec le rôle {role} avec succès.",
            status_code=status.HTTP_201_CREATED
        )


class BusinessMemberRemoveView(APIView):
    """
    Révocation d'un membre d'une entreprise.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, business_id, user_id):
        business = get_object_or_404(Business, id=business_id, is_active=True)

        # Check caller rights
        if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'SUPER_ADMIN'):
            caller_role = BusinessMembership.objects.filter(
                business=business,
                user=request.user,
                is_active=True
            ).values_list('role', flat=True).first()

            if caller_role != BusinessMembershipRole.OWNER:
                return error_response(
                    message="Seul le propriétaire de l'entreprise peut révoquer un membre.",
                    status_code=status.HTTP_403_FORBIDDEN
                )

        membership = BusinessMembership.objects.filter(
            business=business,
            user_id=user_id,
            is_active=True
        ).first()

        if not membership:
            return error_response(
                message="Membre introuvable dans cette entreprise.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if membership.role == BusinessMembershipRole.OWNER:
            return error_response(
                message="Impossible de révoquer le propriétaire principal de l'entreprise.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        membership.is_active = False
        membership.save(update_fields=['is_active'])

        return success_response(
            message="Accès du membre révoqué avec succès."
        )
