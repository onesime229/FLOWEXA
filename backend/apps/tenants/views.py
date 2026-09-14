from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.core.responses import success_response, error_response
from apps.core.permissions import IsSuperAdmin, IsBusinessOwner
from .models import Tenant
from .serializers import TenantSerializer, TenantCreateSerializer


class TenantListCreateView(generics.ListCreateAPIView):
    """
    Lister les organisations du propriétaire connecté ou en créer une nouvelle.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TenantCreateSerializer
        return TenantSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or getattr(user, 'role', '') == 'SUPER_ADMIN':
            return Tenant.objects.all().order_by('-created_at')
        return Tenant.objects.filter(owner=user, is_active=True).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = TenantSerializer(queryset, many=True)
        return success_response(
            data=serializer.data,
            message="Liste des organisations récupérée."
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Erreur de validation lors de la création de l'organisation.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        tenant = serializer.save()
        return success_response(
            data=TenantSerializer(tenant).data,
            message="Organisation créée avec succès.",
            status_code=status.HTTP_201_CREATED
        )


class TenantDetailView(generics.RetrieveUpdateAPIView):
    """
    Détails et modification d'une organisation.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TenantSerializer
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or getattr(user, 'role', '') == 'SUPER_ADMIN':
            return Tenant.objects.all()
        return Tenant.objects.filter(owner=user)
