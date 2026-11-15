from django.urls import reverse
from rest_framework.test import APITestCase

from apps.accounts.models import User
from .models import TrainerProfile


class TrainerApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='Admin@123',
            full_name='Admin User',
            mobile='9999999999',
            role=User.ROLE_ADMIN,
        )
        self.trainer_user = User.objects.create_user(
            email='trainer@example.com',
            password='Trainer@123',
            full_name='Trainer User',
            mobile='7777777777',
            role=User.ROLE_TRAINER,
        )
        TrainerProfile.objects.create(
            user=self.trainer_user,
            trainer_code='TRN-001',
            qualification='B.Tech',
            specialisation='Python',
        )

    def test_trainer_list_requires_auth(self):
        response = self.client.get(reverse('trainer-list'))
        self.assertEqual(response.status_code, 401)

    def test_trainer_list_for_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('trainer-list'))
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data['count'], 1)
