from django.db import models


class Course(models.Model):
    COURSE_PFS = 'PFS'
    COURSE_JFS = 'JFS'
    COURSE_PYCORE = 'PYCORE'
    COURSE_JCORE = 'JCORE'
    COURSE_DA = 'DA'
    COURSE_FED = 'FED'

    COURSE_CHOICES = [
        (COURSE_PFS, 'Python Full Stack'),
        (COURSE_JFS, 'Java Full Stack'),
        (COURSE_PYCORE, 'Core Python'),
        (COURSE_JCORE, 'Core Java'),
        (COURSE_DA, 'Data Analytics'),
        (COURSE_FED, 'Front-End Development'),
    ]

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.URLField(blank=True)
    duration_months = models.PositiveIntegerField(default=3)
    total_modules = models.PositiveIntegerField(default=0)
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    learning_mode = models.CharField(max_length=20, default='HYBRID')
    eligibility = models.TextField(blank=True)
    skills_covered = models.TextField(blank=True)
    projects = models.TextField(blank=True)
    certification_details = models.TextField(blank=True)
    placement_support = models.BooleanField(default=False)
    status = models.CharField(max_length=20, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'


class CourseModule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)
    duration_hours = models.PositiveIntegerField(default=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['course', 'order']
        unique_together = ('course', 'order')

    def __str__(self):
        return f'{self.course.code}: {self.title}'
