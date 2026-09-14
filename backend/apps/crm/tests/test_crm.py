from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import User, UserRole
from apps.tenants.models import Tenant
from apps.businesses.models import Business, BusinessModule, BusinessStatus
from apps.authentication.services import AuthService
from apps.crm.models import (
    Contact,
    BusinessRelation,
    Interaction,
    Demande,
    Favori,
    Segment,
    RelationType,
    PipelineStage,
    DemandeStatus,
)


class CRMTests(APITestCase):
    def setUp(self):
        # 1. User & Tenant
        self.owner = User.objects.create_user(
            email="owner@crm-test.com",
            password="StrongPassword123!",
            first_name="Aimé",
            last_name="Koffi",
            role=UserRole.BUSINESS_OWNER
        )
        self.tenant = Tenant.objects.create(
            name="Groupe Hospitality Bénin",
            owner=self.owner,
            max_businesses=5
        )
        self.tokens = AuthService.create_jwt_for_user(self.owner)
        self.auth_header = f"Bearer {self.tokens['access']}"

        # 2. Business
        self.business = Business.objects.create(
            tenant=self.tenant,
            name="Résidence Les Cocotiers",
            module_code=BusinessModule.GUEST_HOUSE,
            status=BusinessStatus.ACTIVE,
            phone="+229 97 11 22 33",
            email="contact@cocotiers.bj",
            city="Cotonou",
            country="Bénin"
        )

        # 3. Contact
        self.contact = Contact.objects.create(
            tenant=self.tenant,
            first_name="Sylvie",
            last_name="Mensah",
            email="sylvie.mensah@gmail.com",
            phone="+229 96 55 44 33",
            city="Cotonou",
            country="Bénin"
        )

        # 4. Relation
        self.relation = BusinessRelation.objects.create(
            contact=self.contact,
            business=self.business,
            relation_type=RelationType.PROSPECT,
            stage=PipelineStage.QUALIFIED,
            lifetime_value=250000.00
        )

    def test_list_contacts(self):
        url = reverse('crm:contact-list-create')
        response = self.client.get(url, HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertGreaterEqual(len(response.data['data']), 1)

    def test_create_contact(self):
        url = reverse('crm:contact-list-create')
        payload = {
            "first_name": "Boris",
            "last_name": "Tossou",
            "email": "boris.tossou@gmail.com",
            "phone": "+229 90 12 34 56",
            "city": "Porto-Novo",
            "country": "Bénin"
        }
        response = self.client.post(url, data=payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['first_name'], "Boris")

    def test_create_demande(self):
        url = reverse('crm:demande-list-create')
        payload = {
            "contact": str(self.contact.id),
            "business": str(self.business.id),
            "module_code": BusinessModule.GUEST_HOUSE,
            "title": "Réservation suite vue mer 4 nuits",
            "budget_max": 200000.00,
            "location": "Cotonou Haie Vive"
        }
        response = self.client.post(url, data=payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])

    def test_create_interaction(self):
        url = reverse('crm:interaction-list-create')
        payload = {
            "contact": str(self.contact.id),
            "business": str(self.business.id),
            "interaction_type": "CALL",
            "title": "Appel confirmation de disponibilité",
            "details": "Cliente très intéressée par la formule VIP",
            "performed_at": "2026-09-04T10:00:00Z"
        }
        response = self.client.post(url, data=payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
