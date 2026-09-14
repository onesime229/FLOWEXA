"""
Core permission classes and Role definitions for Flowexa.

Supported Roles:
- SUPER_ADMIN: Global system platform administrator
- BUSINESS_OWNER: Owner of a tenant business
- MANAGER: Manager inside a tenant business
- EMPLOYEE: Operational staff inside a tenant business
- CLIENT: End-user customer searching or booking services
"""
from django.db import models
from rest_framework import permissions


class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Administrateur'
    BUSINESS_OWNER = 'BUSINESS_OWNER', 'Propriétaire Entreprise'
    MANAGER = 'MANAGER', 'Gérant / Manager'
    EMPLOYEE = 'EMPLOYEE', 'Employé'
    CLIENT = 'CLIENT', 'Client'


class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to super administrative users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (
                getattr(request.user, 'role', None) == UserRole.SUPER_ADMIN or
                request.user.is_superuser
            )
        )


class IsBusinessOwner(permissions.BasePermission):
    """
    Allows access only to users with the BUSINESS_OWNER role or SUPER_ADMIN.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        role = getattr(request.user, 'role', None)
        return role in [UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN] or request.user.is_superuser


class IsManager(permissions.BasePermission):
    """
    Allows access to MANAGER, BUSINESS_OWNER, or SUPER_ADMIN.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        role = getattr(request.user, 'role', None)
        return role in [UserRole.MANAGER, UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN] or request.user.is_superuser


class IsEmployee(permissions.BasePermission):
    """
    Allows access to tenant staff: EMPLOYEE, MANAGER, BUSINESS_OWNER, or SUPER_ADMIN.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        role = getattr(request.user, 'role', None)
        return role in [
            UserRole.EMPLOYEE,
            UserRole.MANAGER,
            UserRole.BUSINESS_OWNER,
            UserRole.SUPER_ADMIN
        ] or request.user.is_superuser


class IsClient(permissions.BasePermission):
    """
    Allows access to users with CLIENT role.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        role = getattr(request.user, 'role', None)
        return role == UserRole.CLIENT or request.user.is_superuser


class ReadOnly(permissions.BasePermission):
    """
    Allows read-only access (GET, HEAD, OPTIONS).
    """
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS
