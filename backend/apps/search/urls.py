from django.urls import path
from .views import SmartSearchView, SearchCriteriaParseOnlyView

app_name = 'search'

urlpatterns = [
    path('', SmartSearchView.as_view(), name='search-root'),
    path('smart/', SmartSearchView.as_view(), name='search-smart'),
    path('parse/', SearchCriteriaParseOnlyView.as_view(), name='search-parse'),
]
