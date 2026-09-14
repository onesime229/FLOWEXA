from rest_framework.views import APIView
from rest_framework import permissions, status
from apps.core.responses import success_response, error_response
from .serializers import SearchQuerySerializer, SearchCriteriaSerializer
from .services import NaturalLanguageSearchService, SmartSearchParser


class SmartSearchView(APIView):
    """
    API de recherche intelligente Flowexa.
    Prend en entrée une requête textuelle en langage naturel
    (ex: « Je cherche un studio à Cotonou pour 100 000 FCFA. »)
    et la transforme en critères métier précis (module, type, localisation, budget).
    Effectue également le matching des entreprises et opportunités dans la base de données.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return error_response(
                message="Le paramètre de recherche 'q' est obligatoire.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        result = NaturalLanguageSearchService.search(query=query, user=request.user)
        return success_response(
            data=result,
            message="Recherche intelligente exécutée avec succès."
        )

    def post(self, request):
        serializer = SearchQuerySerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Requête de recherche invalide.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        query = serializer.validated_data['q']
        save_demande = serializer.validated_data.get('save_as_crm_demande', False)
        contact_id = serializer.validated_data.get('contact_id')

        result = NaturalLanguageSearchService.search(
            query=query,
            user=request.user,
            save_as_crm_demande=save_demande,
            contact_id=contact_id
        )
        return success_response(
            data=result,
            message="Critères extraits et recherche complétée."
        )


class SearchCriteriaParseOnlyView(APIView):
    """
    Endpoint utilitaire pour visualiser uniquement l'extraction des critères
    sans interroger la base de données.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        text = request.data.get('q', '').strip()
        if not text:
            return error_response(
                message="Veuillez fournir le texte à analyser dans 'q'.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        criteria = SmartSearchParser.parse_query(text)
        return success_response(
            data=criteria,
            message="Critères extraits avec succès."
        )
