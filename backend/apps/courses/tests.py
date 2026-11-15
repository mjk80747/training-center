from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.accounts.models import User
from .models import Course


class SeedCoursesCommandTests(TestCase):
    @override_settings(COURSE_DEFAULT_DURATIONS_MONTHS={
        'PFS': 6, 'JFS': 7, 'PYCORE': 3, 'JCORE': 4, 'DA': 8, 'FED': 9,
    })
    def test_seed_uses_configured_course_durations(self):
        call_command('seed_courses', verbosity=0)

        self.assertEqual(Course.objects.get(code='PFS').duration_months, 6)
        self.assertEqual(Course.objects.get(code='JFS').duration_months, 7)
        self.assertEqual(Course.objects.get(code='PYCORE').duration_months, 3)
        self.assertEqual(Course.objects.get(code='JCORE').duration_months, 4)
        self.assertEqual(Course.objects.get(code='DA').duration_months, 8)
        self.assertEqual(Course.objects.get(code='FED').duration_months, 9)

    def test_seed_updates_course_fees(self):
        Course.objects.create(code='PFS', name='Python Full Stack', fee=24999)
        call_command('seed_courses', verbosity=0)

        self.assertEqual(
            dict(Course.objects.values_list('code', 'fee')),
            {
                'PFS': 6999,
                'JFS': 6999,
                'PYCORE': 4999,
                'JCORE': 4999,
                'DA': 6999,
                'FED': 3999,
            },
        )


class CourseApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='Admin@123',
            full_name='Admin User',
            mobile='9999999999',
            role=User.ROLE_ADMIN,
        )
        self.client.force_authenticate(user=self.admin)

    def test_course_list(self):
        Course.objects.create(code='PFS', name='Python Full Stack', description='Python training')
        response = self.client.get(reverse('course-list'))
        self.assertEqual(response.status_code, 200)
        self.assertGreater(response.data['count'], 0)
