from django.urls import path
from .views import (
    BusinessListCreateView,
    BusinessDetailView,
    BusinessLogoUploadView,
    BusinessModulesView,
    BusinessMemberListCreateView,
    BusinessMemberRemoveView,
)

app_name = 'businesses'

urlpatterns = [
    path('', BusinessListCreateView.as_view(), name='business-list-create'),
    path('<uuid:id>/', BusinessDetailView.as_view(), name='business-detail'),
    path('<uuid:id>/logo/', BusinessLogoUploadView.as_view(), name='business-logo'),
    path('<uuid:id>/modules/', BusinessModulesView.as_view(), name='business-modules'),
    path('<uuid:business_id>/members/', BusinessMemberListCreateView.as_view(), name='business-members'),
    path('<uuid:business_id>/members/<uuid:user_id>/', BusinessMemberRemoveView.as_view(), name='business-member-remove'),
]
