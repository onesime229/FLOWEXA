"""
Standardized pagination for Flowexa APIs.
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class FlowexaPagination(PageNumberPagination):
    """
    Default pagination class for Flowexa API list endpoints.
    Provides standard page, page_size query parameters,
    and returns a structured pagination envelope.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            "success": True,
            "message": "Données récupérées avec succès.",
            "data": data,
            "pagination": {
                "count": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
                "current_page": self.page.number,
                "page_size": self.get_page_size(self.request),
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
            }
        })
