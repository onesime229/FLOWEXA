"""
Flowexa Root URL Configuration.
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Documentation (OpenAPI 3.0 / Swagger / ReDoc)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Core system endpoints (health check, system status)
    path('api/v1/health/', include('apps.core.urls')),

    # Sprint B02: Authentication & User endpoints
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/users/', include('apps.users.urls')),

    # Sprint B03: Multi-tenant & Businesses
    path('api/v1/tenants/', include('apps.tenants.urls')),
    path('api/v1/businesses/', include('apps.businesses.urls')),

    # Sprint B08: CRM Global
    path('api/v1/crm/', include('apps.crm.urls')),

    # Sprint B09: Recherche intelligente (/search et /api/v1/search/)
    path('search/', include('apps.search.urls')),
    path('api/v1/search/', include('apps.search.urls')),

    # Sprint B10: Notifications, Flowexa AI & Analytics
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/ai/', include('apps.ai.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
]
