from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import User, UserRole
from apps.tenants.models import Tenant
from apps.businesses.models import Business, BusinessModule, BusinessStatus
from apps.search.services import SmartSearchParser, NaturalLanguageSearchService


class SmartSearchTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="search-owner@test.com",
            password="StrongPassword123!",
            first_name="Hubert",
            last_name="K",
            role=UserRole.BUSINESS_OWNER
        )
        self.tenant = Tenant.objects.create(
            name="Immo & Services Hub",
            owner=self.owner
        )
        self.immo = Business.objects.create(
            tenant=self.tenant,
            name="Agence Immobilière L'Étoile",
            module_code=BusinessModule.IMMOBILIER,
            status=BusinessStatus.ACTIVE,
            city="Cotonou",
            country="Bénin"
        )

    def test_parser_nlp_extraction(self):
        query = "Je cherche un appartement 2 chambres meublé à Cotonou avec un budget de 150 000 FCFA"
        criteria = SmartSearchParser.parse(query)

        self.assertEqual(criteria['module_code'], BusinessModule.IMMOBILIER)
        self.assertEqual(criteria['city'], 'Cotonou')
        self.assertEqual(criteria['budget_max'], 150000.0)

    def test_search_api_get(self):
        url = reverse('search:smart-search')
        response = self.client.get(f"{url}?q=recherche+studio+cotonou+100000+fcfa")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('parsed_criteria', response.data['data'])
        self.assertIn('matches', response.data['data'])

    def test_search_parse_only(self):
        url = reverse('search:smart-search-parse')
        response = self.client.post(url, data={"q": "Massage relaxant à Calavi"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['module_code'], BusinessModule.SPA_MASSAGE)
