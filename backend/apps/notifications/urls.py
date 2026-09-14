from django.urls import path
from .views import (
    NotificationListView,
    NotificationUnreadCountView,
    NotificationSendView,
    NotificationSendFromTemplateView,
    NotificationMarkReadView,
    NotificationTemplateListCreateView,
)

app_name = 'notifications'

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
    path('send/', NotificationSendView.as_view(), name='notification-send'),
    path('send-template/', NotificationSendFromTemplateView.as_view(), name='notification-send-template'),
    path('<uuid:id>/mark-read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('templates/', NotificationTemplateListCreateView.as_view(), name='template-list-create'),
]
