"""
Core routing for Flowexa health and system status.
"""
from django.urls import path
from apps.core.views import HealthCheckView, ReadinessCheckView, SystemInfoView

urlpatterns = [
    path('', HealthCheckView.as_view(), name='health-check'),
    path('ready/', ReadinessCheckView.as_view(), name='readiness-check'),
    path('info/', SystemInfoView.as_view(), name='system-info'),
]
