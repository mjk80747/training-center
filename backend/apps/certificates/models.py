from django.conf import settings
from django.db import models

from apps.courses.models import Course
from apps.students.models import StudentProfile


class Certificate(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='certificates')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificates')
    certificate_id = models.CharField(max_length=20, unique=True)
    issued_date = models.DateField(auto_now_add=True)
    pdf_file = models.FileField(upload_to='certificates/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issued_date']

    def __str__(self):
        return f'{self.certificate_id} - {self.student.student_code}'
