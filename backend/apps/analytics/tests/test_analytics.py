from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import User, UserRole
from apps.tenants.models import Tenant
from apps.businesses.models import Business, BusinessModule, BusinessStatus
from apps.authentication.services import AuthService
from apps.crm.models import Contact, BusinessRelation, RelationType, PipelineStage


class AnalyticsTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="analytics-owner@test.com",
            password="StrongPassword123!",
            first_name="Marc",
            last_name="T",
            role=UserRole.BUSINESS_OWNER
        )
        self.tenant = Tenant.objects.create(
            name="Hub Analytics Bénin",
            owner=self.owner
        )
        self.tokens = AuthService.create_jwt_for_user(self.owner)
        self.auth_header = f"Bearer {self.tokens['access']}"

        self.biz = Business.objects.create(
            tenant=self.tenant,
            name="Atelier Couture Moderne",
            module_code=BusinessModule.ATELIER_BRODERIE,
            status=BusinessStatus.ACTIVE,
            city="Cotonou"
        )
        self.contact = Contact.objects.create(
            tenant=self.tenant,
            first_name="Prisca",
            last_name="Dossou"
        )
        BusinessRelation.objects.create(
            contact=self.contact,
            business=self.biz,
            relation_type=RelationType.CLIENT,
            stage=PipelineStage.WON,
            lifetime_value=120000.00
        )

    def test_overview(self):
        url = reverse('analytics:analytics-overview')
        response = self.client.get(url, HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('clients_prospects', response.data['data'])
        self.assertIn('revenue', response.data['data'])

    def test_conversions(self):
        url = reverse('analytics:analytics-conversions')
        response = self.client.get(url, HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('funnel', response.data['data'])

    def test_performances(self):
        url = reverse('analytics:analytics-performances')
        response = self.client.get(url, HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('performances', response.data['data'])
