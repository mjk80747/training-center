import secrets
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.batches.models import Batch, ClassSession, Enrolment
from apps.courses.models import Course
from apps.learning.models import Assignment as LearningAssignment
from apps.students.models import StudentProfile
from apps.trainers.models import TrainerProfile


DEMO_ACCOUNTS = (
    {
        'email': 'demo.admin@jkitsolutions.local',
        'full_name': 'Demo Administrator',
        'mobile': '9000000001',
        'role': User.ROLE_ADMIN,
    },
    {
        'email': 'demo.trainer@jkitsolutions.local',
        'full_name': 'Demo Trainer',
        'mobile': '9000000002',
        'role': User.ROLE_TRAINER,
    },
    {
        'email': 'demo.student@jkitsolutions.local',
        'full_name': 'Demo Student',
        'mobile': '9000000003',
        'role': User.ROLE_STUDENT,
    },
)


class Command(BaseCommand):
    help = 'Create local-only demo accounts and sample trainer/student portal data.'

    def handle(self, *args, **options):
        if not settings.DEBUG or connection.vendor != 'sqlite':
            raise CommandError('Demo accounts can only be created with DEBUG enabled and a SQLite database.')

        demo_emails = [account['email'] for account in DEMO_ACCOUNTS]
        if User.objects.filter(email__in=demo_emails).exists():
            raise CommandError(
                'One or more demo accounts already exist. Refusing to overwrite their passwords or data.'
            )

        passwords = {account['role']: secrets.token_urlsafe(18) for account in DEMO_ACCOUNTS}
        today = timezone.localdate()

        with transaction.atomic():
            users = {}
            for account in DEMO_ACCOUNTS:
                role = account['role']
                user = User.objects.create_user(
                    email=account['email'],
                    password=passwords[role],
                    full_name=account['full_name'],
                    mobile=account['mobile'],
                    role=role,
                    is_active=True,
                    email_verified=True,
                    is_staff=role == User.ROLE_ADMIN,
                    is_superuser=role == User.ROLE_ADMIN,
                )
                users[role] = user

            trainer = users[User.ROLE_TRAINER]
            TrainerProfile.objects.create(
                user=trainer,
                trainer_code='DEMO-TR-001',
                specialisation='Python Full Stack',
            )

            student = users[User.ROLE_STUDENT]
            student_profile = StudentProfile.objects.create(
                user=student,
                student_code='DEMO-STU-001',
                college='Demo College',
                degree='Python Full Stack',
            )

            course, _ = Course.objects.get_or_create(
                code='PFS',
                defaults={
                    'name': 'Python Full Stack',
                    'description': 'Demo course for the local training portal.',
                    'duration_months': 5,
                    'total_modules': 9,
                    'fee': 6999,
                    'learning_mode': 'HYBRID',
                    'status': 'ACTIVE',
                },
            )
            batch, _ = Batch.objects.get_or_create(
                batch_code='DEMO-PFS-001',
                defaults={
                    'course': course,
                    'name': 'Demo Python Full Stack Batch',
                    'start_date': today,
                    'end_date': today + timedelta(days=150),
                    'class_days': 'Mon-Fri',
                    'start_time': '18:30',
                    'end_time': '20:30',
                    'trainer': trainer,
                    'max_students': 30,
                    'mode': 'HYBRID',
                    'status': Batch.STATUS_ACTIVE,
                },
            )
            Enrolment.objects.create(
                student=student_profile,
                batch=batch,
                course=course,
                course_fee=course.fee,
                final_fee=course.fee,
            )
            ClassSession.objects.create(
                batch=batch,
                date=today,
                start_time='18:30',
                end_time='20:30',
                topic='Demo: Python fundamentals',
                trainer=trainer,
            )
            LearningAssignment.objects.create(
                batch=batch,
                title='Demo: Build a Python portfolio',
                description='A sample assignment for the trainer and student portals.',
                due_date=today + timedelta(days=7),
            )

        self.stdout.write(self.style.SUCCESS('Created local demo accounts. Use the common sign-in page:'))
        for account in DEMO_ACCOUNTS:
            self.stdout.write(f"{account['role']}: {account['email']} / {passwords[account['role']]}")
        self.stdout.write('Passwords are generated for this run; save them securely. This command will not reset them.')
