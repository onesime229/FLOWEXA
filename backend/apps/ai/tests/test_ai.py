from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import User, UserRole
from apps.tenants.models import Tenant
from apps.businesses.models import Business, BusinessModule, BusinessStatus
from apps.authentication.services import AuthService
from apps.crm.models import Contact, BusinessRelation, RelationType, PipelineStage


class FlowexaAITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="ai-owner@test.com",
            password="StrongPassword123!",
            first_name="Alain",
            last_name="V",
            role=UserRole.BUSINESS_OWNER
        )
        self.tenant = Tenant.objects.create(
            name="Hub Bénin AI",
            owner=self.owner
        )
        self.tokens = AuthService.create_jwt_for_user(self.owner)
        self.auth_header = f"Bearer {self.tokens['access']}"

        self.hotel = Business.objects.create(
            tenant=self.tenant,
            name="Grand Hôtel Littoral",
            module_code=BusinessModule.GUEST_HOUSE,
            status=BusinessStatus.ACTIVE,
            city="Cotonou"
        )
        self.spa = Business.objects.create(
            tenant=self.tenant,
            name="Serenity Spa",
            module_code=BusinessModule.SPA_MASSAGE,
            status=BusinessStatus.ACTIVE,
            city="Cotonou"
        )
        self.contact = Contact.objects.create(
            tenant=self.tenant,
            first_name="Gérard",
            last_name="Adanlete",
            email="gerard@adanlete.com"
        )
        BusinessRelation.objects.create(
            contact=self.contact,
            business=self.hotel,
            relation_type=RelationType.CLIENT,
            stage=PipelineStage.WON,
            lifetime_value=450000.00
        )

    def test_recommendations(self):
        url = reverse('ai:ai-recommendations')
        response = self.client.post(
            url,
            data={"contact_id": str(self.contact.id)},
            format='json',
            HTTP_AUTHORIZATION=self.auth_header
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('recommendations', response.data['data'])

    def test_lead_analysis(self):
        url = reverse('ai:ai-analysis')
        response = self.client.post(
            url,
            data={"contact_id": str(self.contact.id)},
            format='json',
            HTTP_AUTHORIZATION=self.auth_header
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('lead_score', response.data['data'])
        self.assertIn('churn_risk', response.data['data'])

    def test_assistant_chat(self):
        url = reverse('ai:ai-assistant')
        response = self.client.post(
            url,
            data={
                "prompt": "Peux-tu me résumer les opportunités de vente additionnelle pour nos clients ?",
                "business_id": str(self.hotel.id)
            },
            format='json',
            HTTP_AUTHORIZATION=self.auth_header
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('reply', response.data['data'])
