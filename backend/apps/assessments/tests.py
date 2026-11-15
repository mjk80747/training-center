from django.urls import reverse
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.batches.models import Batch
from apps.courses.models import Course


class AssessmentApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='Admin@123',
            full_name='Admin User',
            mobile='9999999999',
            role=User.ROLE_ADMIN,
        )
        self.course = Course.objects.create(code='PFS', name='Python Full Stack', fee=1000)
        self.batch = Batch.objects.create(
            batch_code='PFS-001',
            course=self.course,
            name='Python Batch 1',
            start_date='2026-01-01',
            end_date='2026-05-01',
            start_time='18:30:00',
            end_time='20:30:00',
        )

    def test_assessment_list_requires_auth(self):
        response = self.client.get(reverse('assessment-list'))
        self.assertEqual(response.status_code, 401)

    def test_assessment_list_for_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('assessment-list'))
        self.assertEqual(response.status_code, 200)
