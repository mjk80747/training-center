from django.urls import reverse
from rest_framework.test import APITestCase

from apps.accounts.models import User


class DashboardApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='Admin@123',
            full_name='Admin User',
            mobile='9999999999',
            role=User.ROLE_ADMIN,
        )

    def test_dashboard_summary_requires_auth(self):
        response = self.client.get(reverse('dashboard-summary'))
        self.assertEqual(response.status_code, 401)

    def test_dashboard_summary_returns_data(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('dashboard-summary'))
        self.assertEqual(response.status_code, 200)
        self.assertIn('total_students', response.data)
