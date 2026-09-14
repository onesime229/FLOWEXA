from apps.businesses.models import Business, BusinessMembership
from apps.tenants.models import Tenant


class TenantContextMiddleware:
    """
    Middleware d'isolation et d'injection automatique du contexte Tenant et Business.
    Extrait et vérifie les identifiants d'entreprise depuis l'en-tête 'X-Business-ID' ou 'X-Tenant-ID'.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.tenant = None
        request.business = None
        request.business_role = None

        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            business_id = request.headers.get('X-Business-ID')
            tenant_id = request.headers.get('X-Tenant-ID')

            if business_id:
                try:
                    if user.is_superuser or getattr(user, 'role', '') == 'SUPER_ADMIN':
                        business = Business.objects.filter(id=business_id, is_active=True).select_related('tenant').first()
                        if business:
                            request.business = business
                            request.tenant = business.tenant
                            request.business_role = 'OWNER'
                    else:
                        membership = BusinessMembership.objects.filter(
                            business_id=business_id,
                            user=user,
                            is_active=True,
                            business__is_active=True
                        ).select_related('business', 'business__tenant').first()

                        if membership:
                            request.business = membership.business
                            request.tenant = membership.business.tenant
                            request.business_role = membership.role
                except Exception:
                    pass

            elif tenant_id:
                try:
                    if user.is_superuser or getattr(user, 'role', '') == 'SUPER_ADMIN':
                        request.tenant = Tenant.objects.filter(id=tenant_id, is_active=True).first()
                    else:
                        request.tenant = Tenant.objects.filter(id=tenant_id, owner=user, is_active=True).first()
                except Exception:
                    pass

        return self.get_response(request)
