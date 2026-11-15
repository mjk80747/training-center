from django.conf import settings
from django.db import models

from apps.batches.models import Batch
from apps.courses.models import Course
from apps.students.models import StudentProfile


class LearningMaterial(models.Model):
    TYPE_PDF = 'PDF'
    TYPE_PPT = 'PPT'
    TYPE_CODE = 'CODE'
    TYPE_VIDEO = 'VIDEO'
    TYPE_LINK = 'LINK'
    TYPE_CHOICES = [
        (TYPE_PDF, 'PDF'),
        (TYPE_PPT, 'PPT'),
        (TYPE_CODE, 'Code'),
        (TYPE_VIDEO, 'Video'),
        (TYPE_LINK, 'Link'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='materials', null=True, blank=True)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='materials', null=True, blank=True)
    title = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_PDF)
    file = models.FileField(upload_to='materials/', blank=True)
    url = models.URLField(blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Assignment(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    attachment = models.FileField(upload_to='assignments/', blank=True)
    due_date = models.DateField()
    max_marks = models.PositiveIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Submission(models.Model):
    STATUS_SUBMITTED = 'SUBMITTED'
    STATUS_GRADED = 'GRADED'
    STATUS_LATE = 'LATE'
    STATUS_CHOICES = [
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_GRADED, 'Graded'),
        (STATUS_LATE, 'Late'),
    ]

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='submissions')
    file = models.FileField(upload_to='submissions/', blank=True)
    github_link = models.URLField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    marks = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    feedback = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SUBMITTED)

    class Meta:
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f'{self.assignment.title} - {self.student.student_code}'
