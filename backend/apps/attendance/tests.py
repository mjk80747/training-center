from django.urls import reverse
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.batches.models import Batch, ClassSession, Enrolment
from apps.courses.models import Course
from apps.students.models import StudentProfile


class AttendanceApiTests(APITestCase):
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
        self.session = ClassSession.objects.create(
            batch=self.batch,
            date='2026-01-10',
            start_time='18:30:00',
            end_time='20:30:00',
            topic='Django Basics',
        )
        self.student_user = User.objects.create_user(
            email='student@example.com',
            password='Student@123',
            full_name='Student User',
            mobile='4567891230',
            role=User.ROLE_STUDENT,
        )
        self.student = StudentProfile.objects.create(
            user=self.student_user,
            student_code='STU-2026-0001',
        )
        Enrolment.objects.create(
            student=self.student,
            batch=self.batch,
            course=self.course,
            course_fee=self.course.fee,
            final_fee=self.course.fee,
        )

    def test_bulk_mark_attendance(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/v1/attendance/bulk_mark/', {
            'session_id': self.session.id,
            'records': [{'student_id': self.student.id, 'status': 'PRESENT'}],
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.session.attendance_records.count(), 1)
