from decimal import Decimal

from django.urls import reverse
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.batches.models import Batch, Enrolment
from apps.courses.models import Course
from apps.students.models import StudentProfile


class ReportApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='Admin@123',
            full_name='Admin User',
            mobile='9999999999',
            role=User.ROLE_ADMIN,
        )
        self.course = Course.objects.create(
            code='PY101',
            name='Python Fundamentals',
            description='Intro to Python',
            duration_months=2,
            status='ACTIVE',
        )
        self.batch = Batch.objects.create(
            batch_code='PY-B1',
            course=self.course,
            name='Python Batch 1',
            start_date='2025-01-01',
            end_date='2025-02-01',
            start_time='09:00:00',
            end_time='11:00:00',
            max_students=20,
        )
        self.student = StudentProfile.objects.create(
            user=self.admin,
            student_code='STU001',
            status='ACTIVE',
        )
        Enrolment.objects.create(
            student=self.student,
            batch=self.batch,
            course=self.course,
            course_fee=Decimal('2500.00'),
            discount=Decimal('500.00'),
            final_fee=Decimal('2000.00'),
        )

    def test_course_report_requires_auth(self):
        response = self.client.get(reverse('report-course-summary'))
        self.assertEqual(response.status_code, 401)

    def test_course_report_returns_summary(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('report-course-summary'))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(isinstance(response.data, list))
        self.assertEqual(response.data[0]['course'], 'PY101')
        self.assertEqual(response.data[0]['total_enrolments'], 1)
        self.assertEqual(response.data[0]['total_fee'], 2000.0)
