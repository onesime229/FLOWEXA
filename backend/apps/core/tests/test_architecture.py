"""
Tests for Sprint B01 Architecture foundation.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.exceptions import ValidationError

from apps.core.models import UUIDModel, TimeStampedModel, ActiveModel
from apps.core.permissions import UserRole
from apps.core.exceptions import custom_exception_handler
from apps.core.responses import success_response, error_response


class ArchitectureTestCase(TestCase):
    """
    Validates B01 Architecture setup, health checks, envelope formatting, and business constraints.
    """

    def setUp(self):
        self.client = APIClient()

    def test_health_check_endpoint(self):
        """Verify the health check endpoint returns 200 with standard envelope."""
        url = reverse('health-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get('success'))
        self.assertIn('data', data)
        self.assertEqual(data['data']['services']['database']['status'], 'UP')
        self.assertEqual(data['data']['version'], '1.0.0')

    def test_readiness_endpoint(self):
        """Verify the readiness probe returns 200."""
        url = reverse('readiness-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get('success'))
        self.assertTrue(data['data']['ready'])

    def test_system_info_and_forbidden_modules(self):
        """Verify the 10 official modules and ensure forbidden trades are excluded."""
        url = reverse('system-info')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get('success'))

        modules = data['data']['supported_modules']
        self.assertEqual(len(modules), 10)

        module_codes = [m['code'] for m in modules]
        expected_codes = [
            'IMMOBILIER',
            'GUEST_HOUSE',
            'COIFFURE',
            'BARBIER',
            'INSTITUT_COSMETIQUE',
            'SPA_MASSAGE',
            'PHOTOGRAPHE',
            'BRODERIE_IMPRESSION',
            'GARAGE',
            'PHARMACIE',
        ]
        self.assertEqual(set(module_codes), set(expected_codes))

        # Check that forbidden keywords NEVER appear
        serialized_text = str(data).lower()
        self.assertNotIn('couturier', serialized_text)
        self.assertNotIn('tailleur', serialized_text)
        self.assertNotIn('couture', serialized_text)

    def test_user_roles_definition(self):
        """Verify exact role definitions match requirements."""
        roles = [r.value for r in UserRole]
        expected_roles = [
            'SUPER_ADMIN',
            'BUSINESS_OWNER',
            'MANAGER',
            'EMPLOYEE',
            'CLIENT'
        ]
        self.assertEqual(set(roles), set(expected_roles))

    def test_custom_exception_handler(self):
        """Verify custom exception handler formats errors into standard envelope."""
        exc = ValidationError({'email': ['Ce champ est obligatoire.']})
        response = custom_exception_handler(exc, {})
        self.assertIsNotNone(response)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
        self.assertEqual(response.data['errors']['email'], ['Ce champ est obligatoire.'])

    def test_response_helpers(self):
        """Verify success and error response helper utilities."""
        resp_succ = success_response(data={"item": 1}, message="OK")
        self.assertEqual(resp_succ.status_code, status.HTTP_200_OK)
        self.assertTrue(resp_succ.data['success'])
        self.assertEqual(resp_succ.data['data']['item'], 1)

        resp_err = error_response(message="Bad request", errors={"field": "invalid"}, status_code=status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp_err.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp_err.data['success'])
        self.assertEqual(resp_err.data['errors']['field'], "invalid")

    def test_abstract_models_meta(self):
        """Verify abstract properties of core base models."""
        self.assertTrue(UUIDModel._meta.abstract)
        self.assertTrue(TimeStampedModel._meta.abstract)
        self.assertTrue(ActiveModel._meta.abstract)
