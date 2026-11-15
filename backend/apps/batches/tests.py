from django.urls import reverse
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.courses.models import Course
from apps.students.models import StudentProfile
from .models import Batch, Enrolment


class BatchApiTests(APITestCase):
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
            max_students=1,
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

    def test_batch_list(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('batch-list'))
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data['count'], 1)
        batch_data = next(item for item in response.data['results'] if item['id'] == self.batch.id)
        self.assertEqual(batch_data['course_name'], self.course.name)
        self.assertEqual(batch_data['trainer_name'], 'Unassigned')
        self.assertEqual(batch_data['class_days'], 'Mon-Fri')
        self.assertEqual(batch_data['start_time'], '18:30:00')

    def test_batch_list_includes_assigned_trainer_name(self):
        trainer = User.objects.create_user(
            email='trainer@example.com',
            password='Trainer@123',
            full_name='Trainer User',
            mobile='8888888888',
            role=User.ROLE_TRAINER,
        )
        self.batch.trainer = trainer
        self.batch.save(update_fields=['trainer'])
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(reverse('batch-list'))

        self.assertEqual(response.status_code, 200)
        batch_data = next(item for item in response.data['results'] if item['id'] == self.batch.id)
        self.assertEqual(batch_data['trainer_name'], trainer.full_name)

    def test_batch_capacity_rejects_overflow(self):
        self.client.force_authenticate(user=self.admin)
        Enrolment.objects.create(student=self.student, batch=self.batch, course=self.course, course_fee=self.course.fee, final_fee=self.course.fee)
        response = self.client.post(reverse('batch-enrol-student', args=[self.batch.id]), {'student_id': self.student.id, 'discount': '0'}, format='json')
        self.assertEqual(response.status_code, 400)
