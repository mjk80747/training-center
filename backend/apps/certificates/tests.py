from django.urls import reverse
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.certificates.models import Certificate
from apps.courses.models import Course
from apps.students.models import StudentProfile


class CertificateApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='Admin@123',
            full_name='Admin User',
            mobile='9999999999',
            role=User.ROLE_ADMIN,
        )
        self.student_user = User.objects.create_user(
            email='student@example.com',
            password='Student@123',
            full_name='Student User',
            mobile='4444444444',
            role=User.ROLE_STUDENT,
        )
        self.student = StudentProfile.objects.create(user=self.student_user, student_code='STU-2026-0001')
        self.course = Course.objects.create(code='PFS', name='Python Full Stack', fee=1000)

    def test_certificate_verification_endpoint(self):
        response = self.client.get('/api/v1/certificates/verify/INVALID-ID/')
        self.assertEqual(response.status_code, 404)

    def test_student_certificate_list_is_scoped_and_includes_course_name(self):
        Certificate.objects.create(
            student=self.student,
            course=self.course,
            certificate_id='CERT-STUDENT-1',
        )
        other_user = User.objects.create_user(
            email='other@example.com',
            password='Student@123',
            full_name='Other Student',
            mobile='5555555555',
            role=User.ROLE_STUDENT,
        )
        other_student = StudentProfile.objects.create(user=other_user, student_code='STU-2026-0002')
        Certificate.objects.create(
            student=other_student,
            course=self.course,
            certificate_id='CERT-STUDENT-2',
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/v1/certificates/')

        self.assertEqual(response.status_code, 200)
        certificates = response.data['results'] if isinstance(response.data, dict) else response.data
        self.assertEqual(len(certificates), 1)
        self.assertEqual(certificates[0]['certificate_id'], 'CERT-STUDENT-1')
        self.assertEqual(certificates[0]['course_name'], self.course.name)
