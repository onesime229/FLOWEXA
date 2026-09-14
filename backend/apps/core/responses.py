"""
Standardized API Response formatting helpers for Flowexa.
Ensures uniform JSON envelope across all endpoints:
{
    "success": true/false,
    "message": "...",
    "data": { ... } / [ ... ],
    "errors": null / [ ... ]
}
"""
from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message="Opération effectuée avec succès.", status_code=status.HTTP_200_OK, extra=None):
    """
    Returns a uniform success JSON response.
    """
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }
    if extra and isinstance(extra, dict):
        payload.update(extra)
    return Response(payload, status=status_code)


def error_response(message="Une erreur est survenue.", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    """
    Returns a uniform error JSON response.
    """
    return Response({
        "success": False,
        "message": message,
        "errors": errors if errors is not None else {},
        "data": None,
    }, status=status_code)
