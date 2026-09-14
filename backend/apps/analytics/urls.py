from django.urls import path
from .views import (
    AnalyticsOverviewView,
    AnalyticsConversionsView,
    AnalyticsPerformancesView,
)

app_name = 'analytics'

urlpatterns = [
    path('overview/', AnalyticsOverviewView.as_view(), name='analytics-overview'),
    path('conversions/', AnalyticsConversionsView.as_view(), name='analytics-conversions'),
    path('performances/', AnalyticsPerformancesView.as_view(), name='analytics-performances'),
]
