from django.conf import settings
from django.db import models


class StudentProfile(models.Model):
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_DROPPED = 'DROPPED'
    STATUS_ARCHIVED = 'ARCHIVED'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_DROPPED, 'Dropped'),
        (STATUS_ARCHIVED, 'Archived'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    student_code = models.CharField(max_length=20, unique=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    college = models.CharField(max_length=255, blank=True)
    university = models.CharField(max_length=255, blank=True)
    degree = models.CharField(max_length=200, blank=True)
    branch = models.CharField(max_length=200, blank=True)
    current_year = models.PositiveSmallIntegerField(default=1)
    current_semester = models.PositiveSmallIntegerField(default=1)
    graduation_year = models.PositiveSmallIntegerField(default=2026)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['student_code']

    def __str__(self):
        return f'{self.student_code} - {self.user.email}'
