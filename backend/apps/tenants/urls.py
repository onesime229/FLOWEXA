from django.urls import path
from .views import TenantListCreateView, TenantDetailView

app_name = 'tenants'

urlpatterns = [
    path('', TenantListCreateView.as_view(), name='tenant-list-create'),
    path('<uuid:id>/', TenantDetailView.as_view(), name='tenant-detail'),
]
