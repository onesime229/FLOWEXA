from rest_framework.views import APIView
from rest_framework import permissions, status
from apps.core.responses import success_response, error_response
from .serializers import (
    AIRecommendationRequestSerializer,
    AIMatchingRequestSerializer,
    AIAnalysisRequestSerializer,
    AIPredictionRequestSerializer,
    AIAssistantRequestSerializer,
)
from .services import FlowexaAIService


class AIRecommendationsView(APIView):
    """
    Moteur de recommandations croisées Flowexa AI (Cross-selling / Upselling).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIRecommendationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Paramètres invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        data = serializer.validated_data
        result = FlowexaAIService.get_recommendations(
            contact_id=str(data['contact_id']),
            business_id=str(data.get('business_id')) if data.get('business_id') else None
        )
        return success_response(data=result, message="Recommandations générées avec succès.")


class AIMatchingView(APIView):
    """
    Matching intelligent entre les besoins des clients (Demandes) et les offres des entreprises.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIMatchingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Paramètres invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        data = serializer.validated_data
        result = FlowexaAIService.match_client_service(
            demande_id=str(data.get('demande_id')) if data.get('demande_id') else None,
            query=data.get('query'),
            business_id=str(data.get('business_id')) if data.get('business_id') else None
        )
        return success_response(data=result, message="Matching client/service effectué.")


class AIAnalysisView(APIView):
    """
    Analyse de scoring, probabilité de conversion et risque de désistement (Churn) d'un lead.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIAnalysisRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Paramètres invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        data = serializer.validated_data
        result = FlowexaAIService.analyze_lead_or_client(
            contact_id=str(data['contact_id']),
            business_id=str(data.get('business_id')) if data.get('business_id') else None
        )
        return success_response(data=result, message="Analyse IA du lead calculée.")


class AIPredictionsView(APIView):
    """
    Prédictions d'activité et estimations de chiffre d'affaires prévisionnel.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIPredictionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Paramètres invalides.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        data = serializer.validated_data
        result = FlowexaAIService.predict_business_trends(
            business_id=str(data['business_id'])
        )
        return success_response(data=result, message="Prédictions d'activité générées.")


class AIAssistantView(APIView):
    """
    Assistant conversationnel intelligent pour les gérants et équipes commerciales Flowexa.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIAssistantRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Requête invalide.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        data = serializer.validated_data
        result = FlowexaAIService.chat_assistant(
            prompt=data['prompt'],
            business_id=str(data.get('business_id')) if data.get('business_id') else None,
            contact_id=str(data.get('contact_id')) if data.get('contact_id') else None,
            context=data.get('context')
        )
        return success_response(data=result, message="Réponse de l'assistant Flowexa AI.")
