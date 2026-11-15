from datetime import timedelta
import re
from unittest.mock import patch

from django.contrib.auth.hashers import check_password
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils.crypto import get_random_string
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import EmailVerificationCode, PasswordResetCode, User


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=0,
)
class AuthApiTests(APITestCase):
    registration_data = {
        'email': 'new.student@example.com',
        'full_name': 'New Student',
        'mobile': '9999999997',
        'password': 'P4ssword!Unique#826',
    }

    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='Admin@123',
            full_name='Admin User',
            mobile='9999999999',
            role=User.ROLE_ADMIN,
        )

    def test_login_success(self):
        response = self.client.post(reverse('login'), {
            'email': 'admin@example.com',
            'password': 'Admin@123',
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['user']['role'], User.ROLE_ADMIN)

    def test_counsellor_uses_common_login_endpoint(self):
        password = get_random_string(32)
        User.objects.create_user(
            email='counsellor@example.com',
            password=password,
            full_name='Counsellor User',
            mobile='9999999998',
            role=User.ROLE_COUNSELLOR,
        )
        response = self.client.post(reverse('login'), {
            'email': 'counsellor@example.com',
            'password': password,
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['role'], User.ROLE_COUNSELLOR)

    def test_me_requires_auth(self):
        response = self.client.get(reverse('me'))
        self.assertEqual(response.status_code, 401)

    def test_registration_creates_inactive_student_and_emails_code(self):
        response = self.client.post(reverse('register'), self.registration_data, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertNotIn('code', response.data)
        user = User.objects.get(email='new.student@example.com')
        self.assertEqual(user.role, User.ROLE_STUDENT)
        self.assertFalse(user.email_verified)
        self.assertFalse(user.is_active)
        self.assertTrue(hasattr(user, 'student_profile'))
        self.assertFalse(user.student_profile.is_active)
        self.assertTrue(check_password(self.registration_data['password'], user.password))
        self.assertNotEqual(user.password, self.registration_data['password'])
        verification = EmailVerificationCode.objects.get(user=user)
        code = re.search(r'\b\d{6}\b', mail.outbox[0].body).group()
        self.assertNotEqual(verification.code_hash, code)
        self.assertTrue(check_password(code, verification.code_hash))
        self.assertEqual(mail.outbox[0].to, [user.email])
        self.assertRegex(mail.outbox[0].body, r'\b\d{6}\b')

    def test_duplicate_registration_is_rejected_case_insensitively(self):
        first = self.client.post(reverse('register'), self.registration_data, format='json')
        duplicate_data = {**self.registration_data, 'email': 'NEW.STUDENT@example.com'}
        duplicate = self.client.post(reverse('register'), duplicate_data, format='json')

        self.assertEqual(first.status_code, 201)
        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(User.objects.filter(email__iexact=self.registration_data['email']).count(), 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_registration_rejects_weak_password(self):
        data = {**self.registration_data, 'password': 'password'}

        response = self.client.post(reverse('register'), data, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email=data['email']).exists())
        self.assertEqual(len(mail.outbox), 0)

    def test_unverified_account_cannot_log_in(self):
        self.client.post(reverse('register'), self.registration_data, format='json')

        response = self.client.post(reverse('login'), {
            'email': self.registration_data['email'],
            'password': self.registration_data['password'],
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('verify your email', str(response.data).lower())

    def test_verification_activates_account_and_code_is_one_time(self):
        self.client.post(reverse('register'), self.registration_data, format='json')
        user = User.objects.get(email=self.registration_data['email'])
        code = re.search(r'\b\d{6}\b', mail.outbox[0].body).group()

        response = self.client.post(reverse('verify-email'), {
            'email': user.email,
            'code': code,
        }, format='json')

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.email_verified)
        self.assertTrue(user.is_active)
        self.assertTrue(user.student_profile.is_active)
        self.assertIsNotNone(EmailVerificationCode.objects.get(user=user).consumed_at)
        reused = self.client.post(reverse('verify-email'), {
            'email': user.email,
            'code': code,
        }, format='json')
        self.assertEqual(reused.status_code, 400)

    def test_wrong_code_is_counted_without_verifying_account(self):
        self.client.post(reverse('register'), self.registration_data, format='json')
        user = User.objects.get(email=self.registration_data['email'])
        correct_code = re.search(r'\b\d{6}\b', mail.outbox[0].body).group()

        response = self.client.post(reverse('verify-email'), {
            'email': user.email,
            'code': f'{(int(correct_code) + 1) % 1_000_000:06d}',
        }, format='json')

        self.assertEqual(response.status_code, 400)
        verification = EmailVerificationCode.objects.get(user=user)
        self.assertEqual(verification.attempts, 1)
        user.refresh_from_db()
        self.assertFalse(user.email_verified)
        self.assertFalse(user.is_active)
        accepted = self.client.post(reverse('verify-email'), {
            'email': user.email,
            'code': correct_code,
        }, format='json')
        self.assertEqual(accepted.status_code, 200)

    @override_settings(EMAIL_VERIFICATION_MAX_ATTEMPTS=2)
    def test_verification_code_is_invalidated_after_maximum_attempts(self):
        self.client.post(reverse('register'), self.registration_data, format='json')
        user = User.objects.get(email=self.registration_data['email'])
        correct_code = re.search(r'\b\d{6}\b', mail.outbox[0].body).group()
        wrong_code = f'{(int(correct_code) + 1) % 1_000_000:06d}'

        for _ in range(2):
            response = self.client.post(reverse('verify-email'), {
                'email': user.email,
                'code': wrong_code,
            }, format='json')
            self.assertEqual(response.status_code, 400)

        verification = EmailVerificationCode.objects.get(user=user)
        self.assertIsNotNone(verification.consumed_at)
        rejected = self.client.post(reverse('verify-email'), {
            'email': user.email,
            'code': correct_code,
        }, format='json')
        self.assertEqual(rejected.status_code, 400)

    def test_expired_code_cannot_verify_account(self):
        self.client.post(reverse('register'), self.registration_data, format='json')
        user = User.objects.get(email=self.registration_data['email'])
        verification = EmailVerificationCode.objects.get(user=user)
        verification.expires_at = timezone.now() - timedelta(seconds=1)
        verification.save(update_fields=['expires_at'])
        code = re.search(r'\b\d{6}\b', mail.outbox[0].body).group()

        response = self.client.post(reverse('verify-email'), {
            'email': user.email,
            'code': code,
        }, format='json')

        self.assertEqual(response.status_code, 400)
        user.refresh_from_db()
        self.assertFalse(user.email_verified)
        self.assertFalse(user.is_active)

    def test_verified_account_can_log_in_and_logout_revokes_refresh_token(self):
        self.client.post(reverse('register'), self.registration_data, format='json')
        user = User.objects.get(email=self.registration_data['email'])
        code = re.search(r'\b\d{6}\b', mail.outbox[0].body).group()
        self.client.post(reverse('verify-email'), {
            'email': user.email,
            'code': code,
        }, format='json')

        login = self.client.post(reverse('login'), {
            'email': user.email,
            'password': self.registration_data['password'],
        }, format='json')
        self.assertEqual(login.status_code, 200)

        logout = self.client.post(reverse('logout'), {'refresh': login.data['refresh']}, format='json')
        self.assertEqual(logout.status_code, 200)
        refresh = self.client.post(reverse('token-refresh'), {'refresh': login.data['refresh']}, format='json')
        self.assertEqual(refresh.status_code, 401)

    def test_resend_verification_sends_new_code(self):
        with patch('apps.accounts.views.secrets.randbelow', side_effect=[123456, 654321]):
            self.client.post(reverse('register'), self.registration_data, format='json')
            original_code = re.search(r'\b\d{6}\b', mail.outbox[0].body).group()
            response = self.client.post(reverse('resend-verification'), {
                'email': self.registration_data['email'],
            }, format='json')

        self.assertEqual(response.status_code, 200)
        new_code = re.search(r'\b\d{6}\b', mail.outbox[1].body).group()
        self.assertNotEqual(original_code, new_code)
        user = User.objects.get(email=self.registration_data['email'])
        self.assertEqual(EmailVerificationCode.objects.get(user=user).attempts, 0)

    def test_password_reset_request_emails_hashed_code_without_returning_it(self):
        with patch('apps.accounts.views.secrets.randbelow', return_value=123456):
            response = self.client.post(reverse('password-forgot'), {
                'email': self.admin.email,
            }, format='json')

        self.assertEqual(response.status_code, 200)
        code = re.search(r'\b\d{6}\b', mail.outbox[0].body).group()
        self.assertNotIn(code, str(response.data))
        reset_code = PasswordResetCode.objects.get(user=self.admin)
        self.assertNotEqual(reset_code.code_hash, code)
        self.assertTrue(check_password(code, reset_code.code_hash))
        self.assertEqual(mail.outbox[0].to, [self.admin.email])
        self.assertIn('reset your password', mail.outbox[0].subject.lower())

    def test_password_reset_request_response_does_not_reveal_unknown_email(self):
        known_response = self.client.post(reverse('password-forgot'), {
            'email': self.admin.email,
        }, format='json')
        unknown_response = self.client.post(reverse('password-forgot'), {
            'email': 'not-found@example.com',
        }, format='json')

        self.assertEqual(known_response.status_code, 200)
        self.assertEqual(unknown_response.status_code, 200)
        self.assertEqual(known_response.data, unknown_response.data)
        self.assertEqual(len(mail.outbox), 1)

    def test_valid_password_reset_code_changes_password_and_cannot_be_reused(self):
        with patch('apps.accounts.views.secrets.randbelow', return_value=654321):
            self.client.post(reverse('password-forgot'), {'email': self.admin.email}, format='json')
        code = re.search(r'\b\d{6}\b', mail.outbox[0].body).group()
        reset_data = {
            'email': self.admin.email,
            'code': code,
            'password': 'New!Password98765',
        }

        response = self.client.post(reverse('password-reset'), reset_data, format='json')

        self.assertEqual(response.status_code, 200)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.check_password(reset_data['password']))
        reset_record = PasswordResetCode.objects.get(user=self.admin)
        self.assertIsNotNone(reset_record.consumed_at)
        reused = self.client.post(reverse('password-reset'), reset_data, format='json')
        self.assertEqual(reused.status_code, 400)

    def test_invalid_password_reset_code_is_counted(self):
        with patch('apps.accounts.views.secrets.randbelow', return_value=654321):
            self.client.post(reverse('password-forgot'), {'email': self.admin.email}, format='json')
        response = self.client.post(reverse('password-reset'), {
            'email': self.admin.email,
            'code': '000000',
            'password': 'New!Password98765',
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(PasswordResetCode.objects.get(user=self.admin).attempts, 1)

    def test_expired_password_reset_code_is_rejected(self):
        with patch('apps.accounts.views.secrets.randbelow', return_value=654321):
            self.client.post(reverse('password-forgot'), {'email': self.admin.email}, format='json')
        reset_record = PasswordResetCode.objects.get(user=self.admin)
        reset_record.expires_at = timezone.now() - timedelta(seconds=1)
        reset_record.save(update_fields=['expires_at'])
        code = re.search(r'\b\d{6}\b', mail.outbox[0].body).group()

        response = self.client.post(reverse('password-reset'), {
            'email': self.admin.email,
            'code': code,
            'password': 'New!Password98765',
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIsNotNone(PasswordResetCode.objects.get(user=self.admin).consumed_at)
