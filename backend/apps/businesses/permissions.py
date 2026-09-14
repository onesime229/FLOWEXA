from rest_framework import permissions
from .models import BusinessMembership, BusinessMembershipRole


class IsBusinessMember(permissions.BasePermission):
    """
    Vérifie que l'utilisateur est membre actif de l'entreprise ciblée.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser or getattr(request.user, 'role', '') == 'SUPER_ADMIN':
            return True

        business = getattr(obj, 'business', obj)
        return BusinessMembership.objects.filter(
            business=business,
            user=request.user,
            is_active=True
        ).exists()


class IsBusinessAdminOrManager(permissions.BasePermission):
    """
    Autorise uniquement le propriétaire ou le manager de l'entreprise.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser or getattr(request.user, 'role', '') == 'SUPER_ADMIN':
            return True

        business = getattr(obj, 'business', obj)
        return BusinessMembership.objects.filter(
            business=business,
            user=request.user,
            role__in=[BusinessMembershipRole.OWNER, BusinessMembershipRole.MANAGER],
            is_active=True
        ).exists()
