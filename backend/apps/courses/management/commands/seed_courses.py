from django.conf import settings
from django.core.management.base import BaseCommand

from apps.courses.models import Course, CourseModule


COURSE_SEED = [
    {
        'code': 'PFS',
        'name': 'Python Full Stack',
        'description': 'Python fundamentals, full stack web development, and project work.',
        'fee': 6999,
        'learning_mode': 'HYBRID',
        'skills_covered': 'Python, HTML, CSS, JavaScript, Django, APIs',
        'projects': 'Portfolio, ecommerce, dashboard',
    },
    {
        'code': 'JFS',
        'name': 'Java Full Stack',
        'description': 'Java backend, Spring Boot, UI, and scalable application design.',
        'fee': 6999,
        'learning_mode': 'HYBRID',
        'skills_covered': 'Core Java, Spring Boot, JDBC, JavaScript',
        'projects': 'Student portal, real-estate app, admin panel',
    },
    {
        'code': 'PYCORE',
        'name': 'Core Python',
        'description': 'Core Python programming, object-oriented programming, and problem solving.',
        'fee': 4999,
        'learning_mode': 'HYBRID',
        'skills_covered': 'Python, OOP, Data Structures, Problem Solving',
        'projects': 'Command-line utilities, data processing',
    },
    {
        'code': 'JCORE',
        'name': 'Core Java',
        'description': 'Core Java programming, object-oriented programming, and problem solving.',
        'fee': 4999,
        'learning_mode': 'HYBRID',
        'skills_covered': 'Java, OOP, Collections, Problem Solving',
        'projects': 'Console applications, data management',
    },
    {
        'code': 'DA',
        'name': 'Data Analytics',
        'description': 'Data wrangling, SQL, Python, Power BI, dashboards, and insights.',
        'fee': 6999,
        'learning_mode': 'HYBRID',
        'skills_covered': 'Excel, SQL, Python, Pandas, Power BI',
        'projects': 'Sales analysis, KPI dashboards, forecasting',
    },
    {
        'code': 'FED',
        'name': 'Front-End Development',
        'description': 'Responsive websites, React, API integration and UX fundamentals.',
        'fee': 3999,
        'learning_mode': 'HYBRID',
        'skills_covered': 'HTML, CSS, JavaScript, React, Git',
        'projects': 'Portfolio, e-commerce landing page, dashboard',
    },
]


class Command(BaseCommand):
    help = 'Seed the initial institute courses and modules.'

    def handle(self, *args, **options):
        for course_data in COURSE_SEED:
            course, created = Course.objects.update_or_create(
                code=course_data['code'],
                defaults={
                    'name': course_data['name'],
                    'description': course_data['description'],
                    'duration_months': settings.COURSE_DEFAULT_DURATIONS_MONTHS[course_data['code']],
                    'fee': course_data['fee'],
                    'learning_mode': course_data['learning_mode'],
                    'skills_covered': course_data['skills_covered'],
                    'projects': course_data['projects'],
                    'status': 'ACTIVE',
                    'total_modules': 9,
                },
            )

            if created:
                modules = [
                    'Fundamentals', 'Core Concepts', 'Project Work', 'Advanced Topics', 'Integration',
                    'Testing', 'Build & Deployment', 'Practical Labs', 'Capstone'
                ]
                for index, module_title in enumerate(modules, start=1):
                    CourseModule.objects.get_or_create(
                        course=course,
                        order=index,
                        defaults={
                            'title': module_title,
                            'description': f'{module_title} for {course.name}',
                            'duration_hours': settings.DEFAULT_CLASS_DURATION_HOURS,
                        },
                    )

            self.stdout.write(self.style.SUCCESS(f'Processed course: {course.code}'))
