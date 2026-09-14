"""
Custom DRF exception handler for Flowexa.
Normalizes all framework and application exceptions into a consistent structure.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Standardizes error responses across all Flowexa APIs.
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_detail = response.data
        message = "Une erreur de validation ou de traitement est survenue."

        if isinstance(error_detail, dict):
            if 'detail' in error_detail:
                message = str(error_detail['detail'])
                # remove detail key to keep clean errors dict
                error_detail = {k: v for k, v in error_detail.items() if k != 'detail'}
            elif 'non_field_errors' in error_detail:
                message = " ".join([str(err) for err in error_detail['non_field_errors']])

        elif isinstance(error_detail, list):
            message = " ".join([str(err) for err in error_detail])
            error_detail = {"errors": error_detail}

        custom_data = {
            "success": False,
            "message": message,
            "errors": error_detail,
            "data": None,
        }
        response.data = custom_data
        return response

    # Unhandled exceptions (500)
    logger.exception("Unhandled server exception occurred: %s", exc)
    return Response(
        {
            "success": False,
            "message": "Une erreur interne du serveur est survenue.",
            "errors": {"detail": str(exc)},
            "data": None,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
