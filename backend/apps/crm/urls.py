from django.urls import path
from .views import (
    ContactListCreateView,
    ContactDetailView,
    ContactBusinessRelationsView,
    BusinessRelationDetailView,
    InteractionListCreateView,
    DemandeListCreateView,
    DemandeDetailView,
    FavoriListCreateView,
    SegmentListCreateView,
    SegmentManageContactsView,
    ContactHistoryView,
)

app_name = 'crm'

urlpatterns = [
    # Contacts
    path('contacts/', ContactListCreateView.as_view(), name='contact-list-create'),
    path('contacts/<uuid:id>/', ContactDetailView.as_view(), name='contact-detail'),
    path('contacts/<uuid:contact_id>/businesses/', ContactBusinessRelationsView.as_view(), name='contact-business-relations'),
    path('contacts/<uuid:contact_id>/history/', ContactHistoryView.as_view(), name='contact-history'),

    # Business Relations
    path('relations/<uuid:id>/', BusinessRelationDetailView.as_view(), name='business-relation-detail'),

    # Interactions
    path('interactions/', InteractionListCreateView.as_view(), name='interaction-list-create'),

    # Demandes
    path('demandes/', DemandeListCreateView.as_view(), name='demande-list-create'),
    path('demandes/<uuid:id>/', DemandeDetailView.as_view(), name='demande-detail'),

    # Favoris
    path('favoris/', FavoriListCreateView.as_view(), name='favori-list-create'),
    path('favoris/<uuid:id>/', FavoriListCreateView.as_view(), name='favori-detail'),

    # Segments
    path('segments/', SegmentListCreateView.as_view(), name='segment-list-create'),
    path('segments/<uuid:segment_id>/manage-contacts/', SegmentManageContactsView.as_view(), name='segment-manage-contacts'),
]
