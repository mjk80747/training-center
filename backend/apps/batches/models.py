from django.conf import settings
from django.db import models

from apps.courses.models import Course
from apps.students.models import StudentProfile


class Batch(models.Model):
    STATUS_UPCOMING = 'UPCOMING'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_CHOICES = [
        (STATUS_UPCOMING, 'Upcoming'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    batch_code = models.CharField(max_length=20, unique=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='batches')
    name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    class_days = models.CharField(max_length=50, default='Mon-Fri')
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_hours = models.PositiveIntegerField(default=settings.DEFAULT_CLASS_DURATION_HOURS)
    trainer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_batches')
    max_students = models.PositiveIntegerField(default=30)
    mode = models.CharField(max_length=30, default='HYBRID')
    meeting_link = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UPCOMING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date']

    def __str__(self):
        return f'{self.batch_code} - {self.name}'


class Enrolment(models.Model):
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_TRANSFERRED = 'TRANSFERRED'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_DROPPED = 'DROPPED'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_TRANSFERRED, 'Transferred'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_DROPPED, 'Dropped'),
    ]

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='enrolments')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='enrolments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrolments')
    joining_date = models.DateField(auto_now_add=True)
    course_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'batch')

    def __str__(self):
        return f'{self.student.student_code} -> {self.batch.batch_code}'


class ClassSession(models.Model):
    STATUS_SCHEDULED = 'SCHEDULED'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_CHOICES = [
        (STATUS_SCHEDULED, 'Scheduled'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    topic = models.CharField(max_length=255, blank=True)
    trainer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='training_sessions')
    meeting_link = models.URLField(blank=True)
    recording_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f'{self.batch.batch_code} - {self.date}'
