from django.urls import path
from .views import (
    AIRecommendationsView,
    AIMatchingView,
    AIAnalysisView,
    AIPredictionsView,
    AIAssistantView,
)

app_name = 'ai'

urlpatterns = [
    path('recommendations/', AIRecommendationsView.as_view(), name='ai-recommendations'),
    path('matching/', AIMatchingView.as_view(), name='ai-matching'),
    path('analysis/', AIAnalysisView.as_view(), name='ai-analysis'),
    path('predictions/', AIPredictionsView.as_view(), name='ai-predictions'),
    path('assistant/', AIAssistantView.as_view(), name='ai-assistant'),
]
