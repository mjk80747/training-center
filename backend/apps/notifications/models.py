from django.conf import settings
from django.db import models

from apps.batches.models import Batch


class Announcement(models.Model):
    AUDIENCE_ALL = 'ALL'
    AUDIENCE_BATCH = 'BATCH'
    AUDIENCE_COURSE = 'COURSE'
    AUDIENCE_CHOICES = [
        (AUDIENCE_ALL, 'All'),
        (AUDIENCE_BATCH, 'Batch'),
        (AUDIENCE_COURSE, 'Course'),
    ]

    title = models.CharField(max_length=255)
    body = models.TextField()
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default=AUDIENCE_ALL)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_announcements')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.email} - {self.title}'
