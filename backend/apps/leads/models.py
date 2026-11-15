from django.conf import settings
from django.db import models


class LeadSource(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Lead(models.Model):
    STATUS_NEW = 'NEW'
    STATUS_CONTACTED = 'CONTACTED'
    STATUS_INTERESTED = 'INTERESTED'
    STATUS_COUNSELLING_SCHEDULED = 'COUNSELLING_SCHEDULED'
    STATUS_DEMO_SCHEDULED = 'DEMO_SCHEDULED'
    STATUS_DEMO_COMPLETED = 'DEMO_COMPLETED'
    STATUS_FOLLOW_UP = 'FOLLOW_UP'
    STATUS_CONVERTED = 'CONVERTED'
    STATUS_NOT_INTERESTED = 'NOT_INTERESTED'
    STATUS_LOST = 'LOST'
    STATUS_CHOICES = [
        (STATUS_NEW, 'New'),
        (STATUS_CONTACTED, 'Contacted'),
        (STATUS_INTERESTED, 'Interested'),
        (STATUS_COUNSELLING_SCHEDULED, 'Counselling Scheduled'),
        (STATUS_DEMO_SCHEDULED, 'Demo Scheduled'),
        (STATUS_DEMO_COMPLETED, 'Demo Completed'),
        (STATUS_FOLLOW_UP, 'Follow Up'),
        (STATUS_CONVERTED, 'Converted'),
        (STATUS_NOT_INTERESTED, 'Not Interested'),
        (STATUS_LOST, 'Lost'),
    ]

    name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    college_name = models.CharField(max_length=255, blank=True)
    branch = models.CharField(max_length=100, blank=True)
    current_year = models.CharField(max_length=50, blank=True)
    interested_course = models.CharField(max_length=100, blank=True)
    preferred_timing = models.CharField(max_length=100, blank=True)
    learning_mode = models.CharField(max_length=50, blank=True)
    message = models.TextField(blank=True)
    source = models.ForeignKey(LeadSource, on_delete=models.SET_NULL, null=True, blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_NEW)
    next_follow_up_date = models.DateField(null=True, blank=True)
    converted_student = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.mobile})'


class FollowUp(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='follow_ups')
    note = models.TextField()
    follow_up_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Follow Up for {self.lead.name}'
