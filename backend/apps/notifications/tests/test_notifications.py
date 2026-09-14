from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import User, UserRole
from apps.tenants.models import Tenant
from apps.businesses.models import Business, BusinessModule, BusinessStatus
from apps.authentication.services import AuthService
from apps.crm.models import Contact
from apps.notifications.models import Notification, NotificationTemplate, NotificationChannel, NotificationStatus


class NotificationTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="notif-owner@test.com",
            password="StrongPassword123!",
            first_name="Fabrice",
            last_name="A",
            role=UserRole.BUSINESS_OWNER
        )
        self.tenant = Tenant.objects.create(
            name="Hub Notifications Bénin",
            owner=self.owner
        )
        self.tokens = AuthService.create_jwt_for_user(self.owner)
        self.auth_header = f"Bearer {self.tokens['access']}"

        self.biz = Business.objects.create(
            tenant=self.tenant,
            name="Garage Express Cotonou",
            module_code=BusinessModule.GARAGE_MECANIQUE,
            status=BusinessStatus.ACTIVE
        )
        self.contact = Contact.objects.create(
            tenant=self.tenant,
            first_name="Daniel",
            last_name="Sossa",
            phone="+229 97 00 11 22",
            email="daniel.sossa@gmail.com"
        )
        self.template = NotificationTemplate.objects.create(
            code="RAPPEL_RDV_MECANIQUE",
            channel=NotificationChannel.WHATSAPP,
            title="Rappel de révision mécanique",
            content="Bonjour {nom}, votre rendez-vous chez {entreprise} est prévu pour le {date}."
        )

    def test_send_direct_notification(self):
        url = reverse('notifications:notification-send')
        payload = {
            "channel": "WHATSAPP",
            "recipient": "+229 97 00 11 22",
            "title": "Votre devis est prêt",
            "content": "Bonjour Daniel, le devis pour la vidange est disponible.",
            "business": str(self.biz.id),
            "contact": str(self.contact.id)
        }
        response = self.client.post(url, data=payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])

    def test_send_template_notification(self):
        url = reverse('notifications:notification-send-template')
        payload = {
            "template_code": "RAPPEL_RDV_MECANIQUE",
            "recipient": "+229 97 00 11 22",
            "variables": {
                "nom": "Daniel",
                "entreprise": "Garage Express Cotonou",
                "date": "Demain à 10h"
            },
            "business": str(self.biz.id),
            "contact": str(self.contact.id)
        }
        response = self.client.post(url, data=payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])

    def test_list_notifications(self):
        url = reverse('notifications:notification-list')
        response = self.client.get(url, HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
