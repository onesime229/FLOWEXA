from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.core.responses import success_response
from apps.core.permissions import IsSuperAdmin
from .models import User
from .serializers import UserSerializer, UserUpdateSerializer


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    Consulter ou mettre à jour le profil de l'utilisateur connecté.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(
            data=serializer.data,
            message="Profil utilisateur récupéré avec succès."
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return success_response(
            data=UserSerializer(instance).data,
            message="Profil mis à jour avec succès."
        )


class UserListView(generics.ListAPIView):
    """
    Liste complète des utilisateurs réservée aux super administrateurs.
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-created_at')
