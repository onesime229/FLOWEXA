"""
Core views: Health check, Readiness probe, and System metadata.
"""
from datetime import datetime, timezone
from django.db import connection
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from drf_spectacular.utils import extend_schema

from apps.core.responses import success_response, error_response


class HealthCheckView(APIView):
    """
    Public endpoint checking overall backend status (database, cache, runtime).
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Vérification de l'état de santé du système",
        description="Renvoie le statut de connectivité de la base de données et des services essentiels.",
        responses={200: dict}
    )
    def get(self, request):
        db_healthy = True
        db_error = None
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
        except Exception as exc:
            db_healthy = False
            db_error = str(exc)

        cache_healthy = True
        cache_error = None
        try:
            cache.set('health_test', 'ok', timeout=5)
            val = cache.get('health_test')
            if val != 'ok':
                cache_healthy = False
                cache_error = "Cache test key mismatch"
        except Exception as exc:
            cache_healthy = False
            cache_error = str(exc)

        is_healthy = db_healthy

        health_data = {
            "status": "HEALTHY" if is_healthy else "DEGRADED",
            "version": "1.0.0",
            "environment": "development" if connection.settings_dict.get('ENGINE') == 'django.db.backends.sqlite3' else "production",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "services": {
                "database": {
                    "status": "UP" if db_healthy else "DOWN",
                    "engine": connection.settings_dict.get('ENGINE', 'unknown').split('.')[-1],
                    "error": db_error,
                },
                "cache": {
                    "status": "UP" if cache_healthy else "DEGRADED",
                    "error": cache_error,
                }
            }
        }

        if is_healthy:
            return success_response(
                data=health_data,
                message="Système Flowexa opérationnel.",
                status_code=status.HTTP_200_OK
            )
        return error_response(
            message="Le système rencontre des difficultés techniques.",
            errors=health_data,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


class ReadinessCheckView(APIView):
    """
    Readiness probe for container orchestration (Docker / Kubernetes / Cloud Run).
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Sonde de préparation (Readiness Probe)",
        responses={200: dict}
    )
    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
            return success_response(
                data={"ready": True},
                message="Flowexa backend prêt à recevoir des requêtes."
            )
        except Exception as exc:
            return error_response(
                message="Flowexa backend non prêt.",
                errors={"detail": str(exc)},
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )


class SystemInfoView(APIView):
    """
    Returns official system modules and supported domains for Flowexa.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Informations et modules officiels de Flowexa",
        responses={200: dict}
    )
    def get(self, request):
        modules = [
            {"code": "IMMOBILIER", "name": "Immobilier", "category": "Logement & Espaces"},
            {"code": "GUEST_HOUSE", "name": "Guest House", "category": "Hébergement"},
            {"code": "COIFFURE", "name": "Coiffure", "category": "Beauté & Bien-être"},
            {"code": "BARBIER", "name": "Barbier", "category": "Beauté & Bien-être"},
            {"code": "INSTITUT_COSMETIQUE", "name": "Institut / Cosmétique", "category": "Beauté & Bien-être"},
            {"code": "SPA_MASSAGE", "name": "Spa / Massage", "category": "Bien-être"},
            {"code": "PHOTOGRAPHE", "name": "Photographe", "category": "Créatif & Médias"},
            {"code": "BRODERIE_IMPRESSION", "name": "Broderie / Impression textile", "category": "Artisanat & Textile"},
            {"code": "GARAGE", "name": "Garage", "category": "Automobile & Mécanique"},
            {"code": "PHARMACIE", "name": "Pharmacie", "category": "Santé"},
        ]
        return success_response(
            data={
                "platform": "FLOWEXA",
                "tagline": "Puissant à l'intérieur. Simple à l'extérieur.",
                "modules_count": len(modules),
                "supported_modules": modules,
            },
            message="Configuration des modules Flowexa récupérée avec succès."
        )
