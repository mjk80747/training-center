from django.conf import settings
from django.db import models


class TrainerProfile(models.Model):
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_INACTIVE = 'INACTIVE'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_INACTIVE, 'Inactive'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trainer_profile')
    trainer_code = models.CharField(max_length=20, unique=True)
    qualification = models.CharField(max_length=255, blank=True)
    specialisation = models.CharField(max_length=255, blank=True)
    experience_years = models.PositiveSmallIntegerField(default=0)
    technologies = models.TextField(blank=True)
    joining_date = models.DateField(null=True, blank=True)
    availability = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['trainer_code']

    def __str__(self):
        return f'{self.trainer_code} - {self.user.email}'
