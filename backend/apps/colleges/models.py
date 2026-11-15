from django.db import models


class College(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    department_details = models.TextField(blank=True)
    partnership_status = models.CharField(max_length=50, default='ACTIVE')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
