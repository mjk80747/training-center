from django.core.management.base import BaseCommand

from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Create an initial admin user.'

    def add_arguments(self, parser):
        parser.add_argument('--email', dest='email', type=str, required=True)
        parser.add_argument('--password', dest='password', type=str, required=True)

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': 'System Administrator',
                'mobile': '0000000000',
                'role': User.ROLE_ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {email}'))
        else:
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.role = User.ROLE_ADMIN
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Updated admin user: {email}'))
