from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.storage import default_storage
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.batches.models import Batch
from apps.courses.models import Course
from apps.learning.models import LearningMaterial


class LearningApiTests(APITestCase):
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
        self.trainer = User.objects.create_user(
            email='trainer@example.com',
            password='Trainer@123',
            full_name='Trainer User',
            mobile='8888888888',
            role=User.ROLE_TRAINER,
        )
        self.other_trainer = User.objects.create_user(
            email='other-trainer@example.com',
            password='Trainer@123',
            full_name='Other Trainer',
            mobile='8888888887',
            role=User.ROLE_TRAINER,
        )

    def test_materials_require_auth(self):
        response = self.client.get(reverse('material-list'))
        self.assertEqual(response.status_code, 401)

    def test_assignment_list_for_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('assignment-list'))
        self.assertEqual(response.status_code, 200)

    def test_trainer_can_upload_supported_material_to_assigned_batch(self):
        self.batch.trainer = self.trainer
        self.batch.save(update_fields=['trainer'])
        self.client.force_authenticate(user=self.trainer)
        response = self.client.post('/api/v1/materials/', {
            'title': 'Course guide',
            'batch': self.batch.id,
            'file_type': LearningMaterial.TYPE_PDF,
            'file': SimpleUploadedFile('guide.pdf', b'pdf contents', content_type='application/pdf'),
        }, format='multipart')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['uploaded_by'], self.trainer.id)
        self.assertTrue(response.data['file'].endswith('.pdf'))
        self.addCleanup(default_storage.delete, response.data['file'].split('/media/', 1)[-1])

    def test_trainer_cannot_upload_material_to_an_unassigned_batch(self):
        self.batch.trainer = self.other_trainer
        self.batch.save(update_fields=['trainer'])
        self.client.force_authenticate(user=self.trainer)
        response = self.client.post('/api/v1/materials/', {
            'title': 'Course guide',
            'batch': self.batch.id,
            'file_type': LearningMaterial.TYPE_PDF,
            'file': SimpleUploadedFile('guide.pdf', b'pdf contents', content_type='application/pdf'),
        }, format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(LearningMaterial.objects.count(), 0)

    def test_material_upload_requires_valid_content_and_supported_file_extension(self):
        self.batch.trainer = self.trainer
        self.batch.save(update_fields=['trainer'])
        self.client.force_authenticate(user=self.trainer)
        missing_resource = self.client.post('/api/v1/materials/', {
            'title': 'No resource',
            'batch': self.batch.id,
            'file_type': LearningMaterial.TYPE_PDF,
        }, format='multipart')
        unsupported_file = self.client.post('/api/v1/materials/', {
            'title': 'Executable',
            'batch': self.batch.id,
            'file_type': LearningMaterial.TYPE_PDF,
            'file': SimpleUploadedFile('malware.exe', b'not executable', content_type='application/octet-stream'),
        }, format='multipart')

        self.assertEqual(missing_resource.status_code, 400)
        self.assertEqual(unsupported_file.status_code, 400)
        self.assertEqual(LearningMaterial.objects.count(), 0)

    def test_trainer_can_create_assignment_only_for_assigned_batch(self):
        self.batch.trainer = self.trainer
        self.batch.save(update_fields=['trainer'])
        self.client.force_authenticate(user=self.trainer)
        response = self.client.post('/api/v1/assignments/', {
            'batch': self.batch.id,
            'title': 'REST API project',
            'description': 'Build a small API.',
            'due_date': '2026-12-01',
            'max_marks': 50,
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['batch'], self.batch.id)
