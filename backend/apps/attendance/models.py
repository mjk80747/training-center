from django.conf import settings
from django.db import models

from apps.batches.models import ClassSession
from apps.students.models import StudentProfile


class Attendance(models.Model):
    STATUS_PRESENT = 'PRESENT'
    STATUS_ABSENT = 'ABSENT'
    STATUS_LATE = 'LATE'
    STATUS_EXCUSED = 'EXCUSED'
    STATUS_CHOICES = [
        (STATUS_PRESENT, 'Present'),
        (STATUS_ABSENT, 'Absent'),
        (STATUS_LATE, 'Late'),
        (STATUS_EXCUSED, 'Excused'),
    ]

    session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='attendance_records')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PRESENT)
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='marked_attendance')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('session', 'student')

    def __str__(self):
        return f'{self.student.student_code} - {self.status}'
