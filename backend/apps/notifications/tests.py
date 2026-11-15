from django.urls import reverse
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.notifications.models import Notification


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='Admin@123',
            full_name='Admin User',
            mobile='9999999999',
            role=User.ROLE_ADMIN,
        )

    def test_announcement_list_requires_auth(self):
        response = self.client.get(reverse('announcement-list'))
        self.assertEqual(response.status_code, 401)

    def test_announcement_list_for_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('announcement-list'))
        self.assertEqual(response.status_code, 200)

    def test_counsellor_can_only_read_and_update_own_notifications(self):
        counsellor = User.objects.create_user(
            email='counsellor@example.com',
            password='Counsellor@123',
            full_name='Counsellor User',
            mobile='9999999998',
            role=User.ROLE_COUNSELLOR,
        )
        own_notification = Notification.objects.create(
            user=counsellor,
            title='New enquiry',
            message='A new enquiry needs attention.',
        )
        other_notification = Notification.objects.create(
            user=self.admin,
            title='Admin update',
            message='Private admin notification.',
        )
        self.client.force_authenticate(user=counsellor)

        list_response = self.client.get(reverse('notification-list'))
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual([item['id'] for item in list_response.data['results']], [own_notification.id])

        update_response = self.client.patch(
            reverse('notification-detail', kwargs={'pk': own_notification.id}),
            {'is_read': True, 'title': 'Changed title', 'user': self.admin.id},
            format='json',
        )
        self.assertEqual(update_response.status_code, 200)
        own_notification.refresh_from_db()
        self.assertTrue(own_notification.is_read)
        self.assertEqual(own_notification.title, 'New enquiry')
        self.assertEqual(own_notification.user, counsellor)

        other_response = self.client.patch(
            reverse('notification-detail', kwargs={'pk': other_notification.id}),
            {'is_read': True},
            format='json',
        )
        self.assertEqual(other_response.status_code, 404)
