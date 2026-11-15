from django.conf import settings
from django.db import models

from apps.batches.models import Batch
from apps.students.models import StudentProfile


class Assessment(models.Model):
    TYPE_WEEKLY = 'WEEKLY'
    TYPE_MODULE = 'MODULE'
    TYPE_CODING = 'CODING'
    TYPE_MCQ = 'MCQ'
    TYPE_PRACTICAL = 'PRACTICAL'
    TYPE_FINAL = 'FINAL'
    TYPE_CHOICES = [
        (TYPE_WEEKLY, 'Weekly'),
        (TYPE_MODULE, 'Module'),
        (TYPE_CODING, 'Coding'),
        (TYPE_MCQ, 'MCQ'),
        (TYPE_PRACTICAL, 'Practical'),
        (TYPE_FINAL, 'Final'),
    ]

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='assessments')
    title = models.CharField(max_length=255)
    assessment_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_WEEKLY)
    date = models.DateField()
    max_marks = models.PositiveIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f'{self.title} ({self.assessment_type})'


class AssessmentResult(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='assessment_results')
    marks = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('assessment', 'student')

    def __str__(self):
        return f'{self.student.student_code} - {self.marks}'
