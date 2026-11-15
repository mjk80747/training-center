from django.urls import reverse
from django.contrib.auth.hashers import check_password
from rest_framework.test import APITestCase

from apps.accounts.models import User
from .models import StudentProfile


class StudentApiTests(APITestCase):
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
            mobile='8888888888',
            role=User.ROLE_STUDENT,
        )
        self.student = StudentProfile.objects.create(
            user=self.student_user,
            student_code='STU-2026-0001',
            city='Hyderabad',
            college='ABC College',
        )

    def test_student_list_requires_auth(self):
        response = self.client.get(reverse('student-list'))
        self.assertEqual(response.status_code, 401)

    def test_student_list_for_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('student-list'))
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data['count'], 1)

    def test_admin_can_create_student_account_and_profile(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(reverse('student-list'), {
            'email': 'new.student@example.com',
            'full_name': 'New Student',
            'mobile': '7777777777',
            'password': 'StrongUniquePassword!826',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['email'], 'new.student@example.com')
        self.assertTrue(response.data['student_code'].startswith('STU-'))
        user = User.objects.get(email='new.student@example.com')
        self.assertEqual(user.role, User.ROLE_STUDENT)
        self.assertTrue(user.is_active)
        self.assertTrue(user.email_verified)
        self.assertTrue(check_password('StrongUniquePassword!826', user.password))
        self.assertEqual(user.student_profile.id, response.data['id'])

    def test_create_student_rejects_duplicate_email_and_weak_password(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            'email': self.student_user.email.upper(),
            'full_name': 'Duplicate Student',
            'mobile': '7777777777',
            'password': 'StrongUniquePassword!826',
        }

        duplicate_response = self.client.post(reverse('student-list'), data, format='json')
        weak_password_response = self.client.post(
            reverse('student-list'),
            {**data, 'email': 'new.student@example.com', 'password': 'password'},
            format='json',
        )

        self.assertEqual(duplicate_response.status_code, 400)
        self.assertIn('email', duplicate_response.data)
        self.assertEqual(weak_password_response.status_code, 400)
        self.assertIn('password', weak_password_response.data)

    def test_admin_delete_archives_student_and_disables_account(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(reverse('student-detail', kwargs={'pk': self.student.id}))

        self.assertEqual(response.status_code, 204)
        self.student.refresh_from_db()
        self.student_user.refresh_from_db()
        self.assertFalse(self.student.is_active)
        self.assertEqual(self.student.status, StudentProfile.STATUS_ARCHIVED)
        self.assertFalse(self.student_user.is_active)
        active_list = self.client.get(reverse('student-list'))
        archived_list = self.client.get(reverse('student-list'), {'status': StudentProfile.STATUS_ARCHIVED})
        self.assertEqual(active_list.data['count'], 0)
        self.assertEqual(archived_list.data['count'], 1)

    def test_admin_can_edit_student_and_block_or_activate_account(self):
        self.client.force_authenticate(user=self.admin)
        detail_url = reverse('student-detail', kwargs={'pk': self.student.id})

        edit_response = self.client.patch(detail_url, {
            'full_name': 'Updated Student',
            'email': 'updated.student@example.com',
            'mobile': '7777777777',
            'city': 'Bengaluru',
        }, format='json')
        self.assertEqual(edit_response.status_code, 200)
        self.student_user.refresh_from_db()
        self.student.refresh_from_db()
        self.assertEqual(self.student_user.full_name, 'Updated Student')
        self.assertEqual(self.student_user.email, 'updated.student@example.com')
        self.assertEqual(self.student.city, 'Bengaluru')

        block_response = self.client.patch(detail_url, {'is_active': False}, format='json')
        self.assertEqual(block_response.status_code, 200)
        self.student.refresh_from_db()
        self.student_user.refresh_from_db()
        self.assertFalse(self.student.is_active)
        self.assertFalse(self.student_user.is_active)

        activate_response = self.client.patch(detail_url, {'is_active': True}, format='json')
        self.assertEqual(activate_response.status_code, 200)
        self.student.refresh_from_db()
        self.student_user.refresh_from_db()
        self.assertTrue(self.student.is_active)
        self.assertTrue(self.student_user.is_active)
        self.assertTrue(self.student_user.email_verified)

    def test_admin_activation_verifies_a_pending_registered_student(self):
        self.student_user.is_active = False
        self.student_user.email_verified = False
        self.student_user.save(update_fields=['is_active', 'email_verified'])
        self.student.is_active = False
        self.student.save(update_fields=['is_active'])
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            reverse('student-detail', kwargs={'pk': self.student.id}),
            {'is_active': True},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.student_user.refresh_from_db()
        self.assertTrue(self.student_user.is_active)
        self.assertTrue(self.student_user.email_verified)

    def test_admin_cannot_reactivate_archived_student(self):
        self.client.force_authenticate(user=self.admin)
        self.client.delete(reverse('student-detail', kwargs={'pk': self.student.id}))

        response = self.client.patch(
            reverse('student-detail', kwargs={'pk': self.student.id}),
            {'is_active': True},
            format='json',
        )

        self.assertEqual(response.status_code, 404)

    def test_counsellor_can_add_but_cannot_delete_students(self):
        counsellor = User.objects.create_user(
            email='counsellor@example.com',
            password='Counsellor@123',
            full_name='Counsellor User',
            mobile='9999999998',
            role=User.ROLE_COUNSELLOR,
        )
        self.client.force_authenticate(user=counsellor)

        create_response = self.client.post(reverse('student-list'), {
            'email': 'counsellor.created@example.com',
            'full_name': 'Counsellor Created',
            'mobile': '6666666666',
            'password': 'StrongUniquePassword!826',
        }, format='json')
        delete_response = self.client.delete(reverse('student-detail', kwargs={'pk': self.student.id}))

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(delete_response.status_code, 403)
        update_response = self.client.patch(
            reverse('student-detail', kwargs={'pk': self.student.id}),
            {'full_name': 'Not Allowed'},
            format='json',
        )
        self.assertEqual(update_response.status_code, 403)
        self.student.refresh_from_db()
        self.assertTrue(self.student.is_active)
