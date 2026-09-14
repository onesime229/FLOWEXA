from rest_framework.views import APIView
from rest_framework import permissions, status
from apps.core.responses import success_response, error_response
from .services import AnalyticsService


class AnalyticsOverviewView(APIView):
    """
    Tableau de bord général des métriques : Clients, Prospects, Revenus, Demandes, Réservations.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant_id = request.query_params.get('tenant_id')
        business_id = request.query_params.get('business_id')
        data = AnalyticsService.get_overview(tenant_id=tenant_id, business_id=business_id)
        return success_response(data=data, message="Vue d'ensemble analytique récupérée.")


class AnalyticsConversionsView(APIView):
    """
    Analyse de l'entonnoir de conversion CRM et du taux de gain/perte.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant_id = request.query_params.get('tenant_id')
        business_id = request.query_params.get('business_id')
        data = AnalyticsService.get_conversions(tenant_id=tenant_id, business_id=business_id)
        return success_response(data=data, message="Statistiques de conversion récupérées.")


class AnalyticsPerformancesView(APIView):
    """
    Performances comparatives entre les différentes entreprises du tenant.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant_id = request.query_params.get('tenant_id')
        data = AnalyticsService.get_business_performances(tenant_id=tenant_id)
        return success_response(data=data, message="Performances comparatives récupérées.")
