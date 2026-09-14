from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import User, UserRole
from apps.tenants.models import Tenant
from apps.businesses.models import Business, BusinessMembership, BusinessModule, BusinessMembershipRole
from apps.authentication.services import AuthService


class MultiTenantIsolationTests(APITestCase):
    def setUp(self):
        self.tenants_url = reverse('tenants:tenant-list-create')
        self.businesses_url = reverse('businesses:business-list-create')

        # Owner A & Business A (Immobilier)
        self.owner_a = User.objects.create_user(
            email="owner_a@agence-littoral.com",
            password="Password123!",
            first_name="Marc",
            last_name="Kojo",
            role=UserRole.BUSINESS_OWNER
        )
        self.tenant_a = Tenant.objects.create(
            name="Organisation Littoral",
            owner=self.owner_a
        )
        self.business_a = Business.objects.create(
            tenant=self.tenant_a,
            name="Agence Immobilière Littoral",
            module_code=BusinessModule.IMMOBILIER,
            city="Cotonou"
        )
        BusinessMembership.objects.create(
            business=self.business_a,
            user=self.owner_a,
            role=BusinessMembershipRole.OWNER
        )

        # Owner B & Business B (Guest House)
        self.owner_b = User.objects.create_user(
            email="owner_b@guesthouse-ouidah.com",
            password="Password123!",
            first_name="Sophie",
            last_name="Dossou",
            role=UserRole.BUSINESS_OWNER
        )
        self.tenant_b = Tenant.objects.create(
            name="Organisation Ouidah Hospitality",
            owner=self.owner_b
        )
        self.business_b = Business.objects.create(
            tenant=self.tenant_b,
            name="Villa Ouidah Guest House",
            module_code=BusinessModule.GUEST_HOUSE,
            city="Ouidah"
        )
        BusinessMembership.objects.create(
            business=self.business_b,
            user=self.owner_b,
            role=BusinessMembershipRole.OWNER
        )

        # Employee of Business A
        self.employee_a = User.objects.create_user(
            email="agent1@agence-littoral.com",
            password="Password123!",
            first_name="Jean",
            last_name="Ahouan",
            role=UserRole.EMPLOYEE
        )
        BusinessMembership.objects.create(
            business=self.business_a,
            user=self.employee_a,
            role=BusinessMembershipRole.EMPLOYEE
        )

    def test_owner_a_cannot_see_business_b(self):
        tokens_a = AuthService.create_jwt_for_user(self.owner_a)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens_a["access"]}')

        # List businesses
        response = self.client.get(self.businesses_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        business_ids = [b['id'] for b in response.data['data']]
        self.assertIn(str(self.business_a.id), business_ids)
        self.assertNotIn(str(self.business_b.id), business_ids)

    def test_owner_b_cannot_see_business_a(self):
        tokens_b = AuthService.create_jwt_for_user(self.owner_b)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens_b["access"]}')

        response = self.client.get(self.businesses_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        business_ids = [b['id'] for b in response.data['data']]
        self.assertIn(str(self.business_b.id), business_ids)
        self.assertNotIn(str(self.business_a.id), business_ids)

    def test_direct_access_forbidden_to_other_tenant_business(self):
        tokens_a = AuthService.create_jwt_for_user(self.owner_a)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens_a["access"]}')

        # Try to access Business B detail directly
        detail_url = reverse('businesses:business-detail', kwargs={'id': self.business_b.id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_and_remove_member_in_business(self):
        tokens_a = AuthService.create_jwt_for_user(self.owner_a)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens_a["access"]}')

        members_url = reverse('businesses:business-members', kwargs={'business_id': self.business_a.id})

        # Add new manager
        add_payload = {
            "email": "manager@agence-littoral.com",
            "role": BusinessMembershipRole.MANAGER,
            "first_name": "Patrice",
            "last_name": "Hounnou"
        }
        add_resp = self.client.post(members_url, add_payload, format='json')
        self.assertEqual(add_resp.status_code, status.HTTP_201_CREATED)

        new_user = User.objects.get(email="manager@agence-littoral.com")
        self.assertTrue(
            BusinessMembership.objects.filter(
                business=self.business_a,
                user=new_user,
                role=BusinessMembershipRole.MANAGER,
                is_active=True
            ).exists()
        )

        # Remove member
        remove_url = reverse('businesses:business-member-remove', kwargs={
            'business_id': self.business_a.id,
            'user_id': new_user.id
        })
        del_resp = self.client.delete(remove_url)
        self.assertEqual(del_resp.status_code, status.HTTP_200_OK)

        # Verify member is now inactive
        membership = BusinessMembership.objects.get(business=self.business_a, user=new_user)
        self.assertFalse(membership.is_active)

    def test_owner_b_cannot_add_members_to_business_a(self):
        tokens_b = AuthService.create_jwt_for_user(self.owner_b)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens_b["access"]}')

        members_url = reverse('businesses:business-members', kwargs={'business_id': self.business_a.id})
        payload = {
            "email": "hacker@test.com",
            "role": BusinessMembershipRole.EMPLOYEE
        }
        resp = self.client.post(members_url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
