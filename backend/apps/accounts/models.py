from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('full_name', 'Administrator')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_ADMIN = 'ADMIN'
    ROLE_COUNSELLOR = 'COUNSELLOR'
    ROLE_TRAINER = 'TRAINER'
    ROLE_STUDENT = 'STUDENT'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Admin'),
        (ROLE_COUNSELLOR, 'Counsellor'),
        (ROLE_TRAINER, 'Trainer'),
        (ROLE_STUDENT, 'Student'),
    ]

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    mobile = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_STUDENT)
    is_active = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    failed_login_count = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'mobile']

    objects = UserManager()

    class Meta:
        db_table = 'accounts_user'
        constraints = [
            models.UniqueConstraint(Lower('email'), name='accounts_user_email_ci_unique'),
        ]

    def __str__(self):
        return self.email


class LoginActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_activities')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    success = models.BooleanField(default=False)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.user.email} @ {self.timestamp}'


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.user.email} reset token'


class EmailVerificationCode(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_verification')
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    last_sent_at = models.DateTimeField(default=timezone.now)
    attempts = models.PositiveSmallIntegerField(default=0)
    consumed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Email verification for user #{self.user_id}'


class PasswordResetCode(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='password_reset_code')
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    last_sent_at = models.DateTimeField(default=timezone.now)
    attempts = models.PositiveSmallIntegerField(default=0)
    consumed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Password reset code for user #{self.user_id}'
