from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import User, UserRole
from apps.authentication.models import OTPCode, OTPType, UserSecuritySession
from apps.authentication.services import AuthService


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('authentication:register')
        self.login_url = reverse('authentication:login')
        self.logout_url = reverse('authentication:logout')
        self.password_change_url = reverse('authentication:password-change')
        self.password_reset_req_url = reverse('authentication:password-reset-request')
        self.password_reset_conf_url = reverse('authentication:password-reset-confirm')
        self.otp_send_url = reverse('authentication:otp-send')
        self.otp_verify_url = reverse('authentication:otp-verify')
        self.sessions_url = reverse('authentication:user-sessions')
        self.me_url = reverse('users:current-user')

        self.user_password = "SecurePassword123!"
        self.user = User.objects.create_user(
            email="testowner@flowexa.com",
            password=self.user_password,
            first_name="Marc",
            last_name="Kojo",
            role=UserRole.BUSINESS_OWNER
        )

    def test_registration_success(self):
        payload = {
            "email": "newclient@flowexa.com",
            "password": "Password12345!",
            "password_confirm": "Password12345!",
            "first_name": "Amina",
            "last_name": "Sanni",
            "role": UserRole.CLIENT
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data['data'])
        self.assertIn('access', response.data['data']['tokens'])
        self.assertIn('refresh', response.data['data']['tokens'])
        self.assertEqual(response.data['data']['user']['email'], "newclient@flowexa.com")

        # Verify an email OTP code was created
        otp = OTPCode.objects.filter(target="newclient@flowexa.com", otp_type=OTPType.EMAIL_VERIFICATION).first()
        self.assertIsNotNone(otp)

    def test_registration_password_mismatch(self):
        payload = {
            "email": "mismatch@flowexa.com",
            "password": "Password12345!",
            "password_confirm": "DifferentPassword123!",
            "first_name": "Test",
            "role": UserRole.CLIENT
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        payload = {
            "email": "testowner@flowexa.com",
            "password": self.user_password
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data['data'])
        self.assertEqual(response.data['data']['user']['role'], UserRole.BUSINESS_OWNER)

    def test_login_invalid_credentials(self):
        payload = {
            "email": "testowner@flowexa.com",
            "password": "WrongPassword!"
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_token(self):
        # Login first
        login_resp = self.client.post(self.login_url, {
            "email": "testowner@flowexa.com",
            "password": self.user_password
        }, format='json')
        tokens = login_resp.data['data']['tokens']
        access = tokens['access']
        refresh = tokens['refresh']

        # Logout with auth header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        logout_resp = self.client.post(self.logout_url, {"refresh": refresh}, format='json')
        self.assertEqual(logout_resp.status_code, status.HTTP_200_OK)

        # Try to refresh token - should fail because blacklisted
        refresh_url = reverse('authentication:token-refresh')
        ref_resp = self.client.post(refresh_url, {"refresh": refresh}, format='json')
        self.assertEqual(ref_resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_password_change_authenticated(self):
        tokens = AuthService.create_jwt_for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')

        new_password = "BrandNewSecurePassword2026!"
        resp = self.client.post(self.password_change_url, {
            "old_password": self.user_password,
            "new_password": new_password,
            "new_password_confirm": new_password
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Check that user can log in with new password
        login_resp = self.client.post(self.login_url, {
            "email": "testowner@flowexa.com",
            "password": new_password
        }, format='json')
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)

    def test_password_reset_flow(self):
        # 1. Request reset
        req_resp = self.client.post(self.password_reset_req_url, {"email": "testowner@flowexa.com"}, format='json')
        self.assertEqual(req_resp.status_code, status.HTTP_200_OK)

        # Grab generated OTP code
        otp = OTPCode.objects.filter(target="testowner@flowexa.com", otp_type=OTPType.PASSWORD_RESET).order_by('-created_at').first()
        self.assertIsNotNone(otp)

        # 2. Confirm reset with code
        new_pwd = "ResetNewPassword123!"
        conf_resp = self.client.post(self.password_reset_conf_url, {
            "email": "testowner@flowexa.com",
            "code": otp.code,
            "new_password": new_pwd,
            "new_password_confirm": new_pwd
        }, format='json')
        self.assertEqual(conf_resp.status_code, status.HTTP_200_OK)

        # 3. Verify login works with new password
        login_resp = self.client.post(self.login_url, {
            "email": "testowner@flowexa.com",
            "password": new_pwd
        }, format='json')
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)

    def test_otp_verification_flow(self):
        tokens = AuthService.create_jwt_for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')

        # Request email OTP
        send_resp = self.client.post(self.otp_send_url, {
            "target": self.user.email,
            "otp_type": OTPType.EMAIL_VERIFICATION
        }, format='json')
        self.assertEqual(send_resp.status_code, status.HTTP_200_OK)

        otp = OTPCode.objects.filter(target=self.user.email, otp_type=OTPType.EMAIL_VERIFICATION).first()
        self.assertIsNotNone(otp)

        # Verify OTP
        verify_resp = self.client.post(self.otp_verify_url, {
            "target": self.user.email,
            "otp_type": OTPType.EMAIL_VERIFICATION,
            "code": otp.code
        }, format='json')
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.is_email_verified)

    def test_current_user_profile(self):
        tokens = AuthService.create_jwt_for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')

        resp = self.client.get(self.me_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['data']['email'], self.user.email)
        self.assertEqual(resp.data['data']['role'], UserRole.BUSINESS_OWNER)
        self.assertEqual(resp.data['data']['initials'], "MK")
