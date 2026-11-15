from django.urls import reverse
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.leads.models import Lead


class LeadApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='Admin@123',
            full_name='Admin User',
            mobile='9999999999',
            role=User.ROLE_ADMIN,
        )

    def test_public_enquiry_creates_lead(self):
        response = self.client.post('/api/v1/leads/public_enquiry/', {
            'name': 'Jane Student',
            'mobile': '9876543210',
            'email': 'jane@example.com',
            'interested_course': 'PFS',
            'message': 'Interested in Python Full Stack',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        lead = Lead.objects.get(pk=response.data['lead_id'])
        self.assertEqual(lead.email, 'jane@example.com')
        self.assertEqual(lead.interested_course, 'PFS')
        self.assertEqual(lead.source.name, 'Website')

    def test_lead_list_requires_auth(self):
        response = self.client.get(reverse('lead-list'))
        self.assertEqual(response.status_code, 401)
