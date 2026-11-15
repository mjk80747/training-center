from io import StringIO
import re
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.batches.models import Batch, ClassSession
from apps.learning.models import Assignment
from apps.students.models import StudentProfile
from apps.trainers.models import TrainerProfile


class CreateDemoAccountsCommandTests(TestCase):
    @override_settings(DEBUG=True)
    def test_creates_role_accounts_with_random_passwords_and_demo_portal_data(self):
        output = StringIO()
        with patch('apps.accounts.management.commands.create_demo_accounts.connection.vendor', 'sqlite'):
            call_command('create_demo_accounts', stdout=output)

        expected_roles = {
            'demo.admin@jkitsolutions.local': User.ROLE_ADMIN,
            'demo.trainer@jkitsolutions.local': User.ROLE_TRAINER,
            'demo.student@jkitsolutions.local': User.ROLE_STUDENT,
        }
        for email, role in expected_roles.items():
            user = User.objects.get(email=email)
            self.assertEqual(user.role, role)
            self.assertTrue(user.is_active)
            self.assertTrue(user.email_verified)
            self.assertTrue(user.has_usable_password())
            password_line = next(line for line in output.getvalue().splitlines() if line.startswith(f'{role}:'))
            password = password_line.split(' / ', maxsplit=1)[1]
            self.assertTrue(user.check_password(password))
            self.assertGreaterEqual(len(password), 20)
            self.assertIsNone(re.search(r'password\s*=', output.getvalue(), re.IGNORECASE))
            response = APIClient().post(
                '/api/v1/auth/login/',
                {'email': email, 'password': password},
                format='json',
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data['user']['role'], role)

        admin = User.objects.get(email='demo.admin@jkitsolutions.local')
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        trainer = User.objects.get(email='demo.trainer@jkitsolutions.local')
        student = User.objects.get(email='demo.student@jkitsolutions.local')
        self.assertTrue(TrainerProfile.objects.filter(user=trainer).exists())
        self.assertTrue(StudentProfile.objects.filter(user=student).exists())
        batch = Batch.objects.get(batch_code='DEMO-PFS-001')
        self.assertEqual(batch.trainer, trainer)
        self.assertTrue(batch.enrolments.filter(student__user=student).exists())
        self.assertTrue(ClassSession.objects.filter(batch=batch).exists())
        self.assertTrue(Assignment.objects.filter(batch=batch).exists())

    @override_settings(DEBUG=False)
    def test_refuses_to_create_demo_accounts_when_debug_is_disabled(self):
        with patch('apps.accounts.management.commands.create_demo_accounts.connection.vendor', 'sqlite'):
            with self.assertRaises(CommandError):
                call_command('create_demo_accounts', stdout=StringIO())
        self.assertFalse(User.objects.filter(email__startswith='demo.').exists())

    @override_settings(DEBUG=True)
    def test_refuses_to_create_demo_accounts_for_non_sqlite_database(self):
        with patch('apps.accounts.management.commands.create_demo_accounts.connection.vendor', 'postgresql'):
            with self.assertRaises(CommandError):
                call_command('create_demo_accounts', stdout=StringIO())
        self.assertFalse(User.objects.filter(email__startswith='demo.').exists())

    @override_settings(DEBUG=True)
    def test_does_not_overwrite_existing_demo_accounts(self):
        existing = User.objects.create_user(
            email='demo.admin@jkitsolutions.local',
            password='Do-not-change-this-password',
            full_name='Existing admin',
            role=User.ROLE_ADMIN,
        )
        with patch('apps.accounts.management.commands.create_demo_accounts.connection.vendor', 'sqlite'):
            with self.assertRaises(CommandError):
                call_command('create_demo_accounts', stdout=StringIO())
        existing.refresh_from_db()
        self.assertTrue(existing.check_password('Do-not-change-this-password'))
        self.assertEqual(User.objects.filter(email__startswith='demo.').count(), 1)
