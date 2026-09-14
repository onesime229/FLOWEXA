from django.db import models


class TenantAwareQuerySet(models.QuerySet):
    """
    QuerySet appliquant un cloisonnement strict par entreprise/tenant.
    """
    def for_business(self, business):
        if not business:
            return self.none()
        return self.filter(business=business)

    def for_tenant(self, tenant):
        if not tenant:
            return self.none()
        return self.filter(business__tenant=tenant)

    def for_user(self, user):
        if not user or not user.is_authenticated:
            return self.none()

        if user.is_superuser or getattr(user, 'role', '') == 'SUPER_ADMIN':
            return self.all()

        # Find all businesses where user has an active membership
        from apps.businesses.models import BusinessMembership
        user_business_ids = BusinessMembership.objects.filter(
            user=user,
            is_active=True
        ).values_list('business_id', flat=True)

        return self.filter(business_id__in=user_business_ids)


class TenantAwareManager(models.Manager):
    """
    Manager par défaut garantissant que les entités filles sont systématiquement filtrées.
    """
    def get_queryset(self):
        return TenantAwareQuerySet(self.model, using=self._db)

    def for_business(self, business):
        return self.get_queryset().for_business(business)

    def for_tenant(self, tenant):
        return self.get_queryset().for_tenant(tenant)

    def for_user(self, user):
        return self.get_queryset().for_user(user)
