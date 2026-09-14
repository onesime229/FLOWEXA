import io
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import User, UserRole
from apps.tenants.models import Tenant
from apps.businesses.models import (
    Business,
    BusinessMembership,
    BusinessModule,
    BusinessMembershipRole,
    BusinessStatus,
)
from apps.authentication.services import AuthService


class BusinessManagementTests(APITestCase):
    def setUp(self):
        self.businesses_url = reverse('businesses:business-list-create')

        # Owner
        self.owner = User.objects.create_user(
            email="owner@benin-holding.com",
            password="StrongPassword123!",
            first_name="Jean-Luc",
            last_name="Gbedo",
            role=UserRole.BUSINESS_OWNER
        )
        self.tenant = Tenant.objects.create(
            name="Holding Bénin",
            owner=self.owner,
            max_businesses=3
        )
        self.owner_tokens = AuthService.create_jwt_for_user(self.owner)
        self.owner_auth_header = f"Bearer {self.owner_tokens['access']}"

        # Business
        self.business = Business.objects.create(
            tenant=self.tenant,
            name="Palais de la Beauté & Spa",
            module_code=BusinessModule.INSTITUT_COSMETIQUE,
            enabled_modules=[BusinessModule.INSTITUT_COSMETIQUE, BusinessModule.SPA_MASSAGE],
            status=BusinessStatus.ACTIVE,
            phone="+229 97 00 00 01",
            email="contact@palaisbeaute.bj",
            website="https://palaisbeaute.bj",
            address="Haie Vive, Rue 410",
            city="Cotonou",
            country="Bénin",
            latitude=6.3533,
            longitude=2.4045,
            opening_hours={
                "lundi": {"open": "08:00", "close": "19:00", "closed": False},
                "mardi": {"open": "08:00", "close": "19:00", "closed": False},
                "dimanche": {"open": "10:00", "close": "16:00", "closed": False}
            },
            social_media={
                "instagram": "@palais_beaute_bj",
                "facebook": "fb.com/palaisbeautecotonou",
                "whatsapp": "+22997000001"
            }
        )
        BusinessMembership.objects.create(
            business=self.business,
            user=self.owner,
            role=BusinessMembershipRole.OWNER
        )

        # Manager
        self.manager = User.objects.create_user(
            email="manager@palaisbeaute.bj",
            password="StrongPassword123!",
            first_name="Amina",
            last_name="Sossou",
            role=UserRole.MANAGER
        )
        BusinessMembership.objects.create(
            business=self.business,
            user=self.manager,
            role=BusinessMembershipRole.MANAGER
        )
        self.manager_tokens = AuthService.create_jwt_for_user(self.manager)
        self.manager_auth_header = f"Bearer {self.manager_tokens['access']}"

        # Employee
        self.employee = User.objects.create_user(
            email="employee@palaisbeaute.bj",
            password="StrongPassword123!",
            first_name="Carine",
            last_name="Dossou",
            role=UserRole.EMPLOYEE
        )
        BusinessMembership.objects.create(
            business=self.business,
            user=self.employee,
            role=BusinessMembershipRole.EMPLOYEE
        )
        self.employee_tokens = AuthService.create_jwt_for_user(self.employee)
        self.employee_auth_header = f"Bearer {self.employee_tokens['access']}"

    def test_create_business_with_complete_profile(self):
        """Tester la création d'une entreprise avec profil complet et multi-modules"""
        self.client.credentials(HTTP_AUTHORIZATION=self.owner_auth_header)
        payload = {
            "tenant_id": str(self.tenant.id),
            "name": "Immobilier Prestige Littoral",
            "module_code": BusinessModule.IMMOBILIER,
            "enabled_modules": [BusinessModule.IMMOBILIER, BusinessModule.GUEST_HOUSE],
            "phone": "+229 95 12 34 56",
            "email": "contact@prestige-immo.bj",
            "website": "https://prestige-immo.bj",
            "address": "Boulevard de la Marina",
            "city": "Cotonou",
            "country": "Bénin",
            "latitude": 6.3578,
            "longitude": 2.4285,
            "status": BusinessStatus.ACTIVE,
            "opening_hours": {
                "lundi": {"open": "08:00", "close": "18:00", "closed": False},
                "samedi": {"open": "09:00", "close": "13:00", "closed": False}
            },
            "social_media": {
                "linkedin": "company/prestige-immo",
                "whatsapp": "+22995123456"
            }
        }
        response = self.client.post(self.businesses_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        data = response.data['data']
        self.assertEqual(data['name'], "Immobilier Prestige Littoral")
        self.assertEqual(data['module_code'], BusinessModule.IMMOBILIER)
        self.assertIn(BusinessModule.IMMOBILIER, data['enabled_modules'])
        self.assertIn(BusinessModule.GUEST_HOUSE, data['enabled_modules'])
        self.assertEqual(data['phone'], "+229 95 12 34 56")
        self.assertEqual(data['city'], "Cotonou")

    def test_get_business_profile(self):
        """Tester la récupération du profil complet d'une entreprise"""
        detail_url = reverse('businesses:business-detail', kwargs={'id': self.business.id})
        self.client.credentials(HTTP_AUTHORIZATION=self.owner_auth_header)

        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['data']
        self.assertEqual(data['id'], str(self.business.id))
        self.assertEqual(data['name'], "Palais de la Beauté & Spa")
        self.assertEqual(data['status'], BusinessStatus.ACTIVE)
        self.assertIn("lundi", data['opening_hours'])
        self.assertEqual(data['social_media']['instagram'], "@palais_beaute_bj")
        self.assertEqual(data['phone'], "+229 97 00 00 01")

    def test_update_business_profile(self):
        """Tester la modification d'une entreprise (téléphone, adresse, horaires, statut)"""
        detail_url = reverse('businesses:business-detail', kwargs={'id': self.business.id})
        self.client.credentials(HTTP_AUTHORIZATION=self.manager_auth_header)

        update_payload = {
            "name": "Palais de la Beauté & Spa - Flagship",
            "phone": "+229 97 99 99 99",
            "address": "Boulevard du Centenaire, Immeuble Horizon",
            "status": BusinessStatus.ACTIVE,
            "opening_hours": {
                "lundi": {"open": "07:30", "close": "20:00", "closed": False}
            }
        }
        response = self.client.patch(detail_url, update_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.business.refresh_from_db()
        self.assertEqual(self.business.name, "Palais de la Beauté & Spa - Flagship")
        self.assertEqual(self.business.phone, "+229 97 99 99 99")
        self.assertEqual(self.business.address, "Boulevard du Centenaire, Immeuble Horizon")

    def test_employee_cannot_update_business_profile(self):
        """Un simple employé ne doit pas pouvoir modifier le profil de l'entreprise"""
        detail_url = reverse('businesses:business-detail', kwargs={'id': self.business.id})
        self.client.credentials(HTTP_AUTHORIZATION=self.employee_auth_header)

        response = self.client.patch(detail_url, {"name": "Hacked Name"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_business_modules_management(self):
        """Tester la consultation et la mise à jour des modules métier activés"""
        modules_url = reverse('businesses:business-modules', kwargs={'id': self.business.id})
        self.client.credentials(HTTP_AUTHORIZATION=self.owner_auth_header)

        # GET modules
        response = self.client.get(modules_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('available_modules', response.data['data'])
        self.assertIn('enabled_modules', response.data['data'])
        self.assertEqual(response.data['data']['primary_module'], BusinessModule.INSTITUT_COSMETIQUE)

        # POST update modules
        update_modules_payload = {
            "enabled_modules": [BusinessModule.INSTITUT_COSMETIQUE, BusinessModule.SPA_MASSAGE, BusinessModule.COIFFURE],
            "primary_module": BusinessModule.INSTITUT_COSMETIQUE
        }
        response = self.client.post(modules_url, update_modules_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.business.refresh_from_db()
        self.assertIn(BusinessModule.COIFFURE, self.business.enabled_modules)
        self.assertEqual(len(self.business.enabled_modules), 3)

    def test_upload_business_logo(self):
        """Tester l'upload du logo de l'entreprise"""
        logo_url = reverse('businesses:business-logo', kwargs={'id': self.business.id})
        self.client.credentials(HTTP_AUTHORIZATION=self.owner_auth_header)

        test_file = SimpleUploadedFile(
            "logo.png",
            b"fake_image_bytes_content_for_test",
            content_type="image/png"
        )
        response = self.client.post(logo_url, {'logo': test_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.business.refresh_from_db()
        self.assertTrue(bool(self.business.logo))
