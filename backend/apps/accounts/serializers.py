from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

from .models import PasswordResetToken, User


def record_failed_login(user, request):
    from django.utils import timezone
    from datetime import timedelta

    user.failed_login_count += 1
    if user.failed_login_count >= 5:
        user.locked_until = timezone.now() + timedelta(minutes=15)
    user.save(update_fields=['failed_login_count', 'locked_until'])

    from .models import LoginActivity

    LoginActivity.objects.create(
        user=user,
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        success=False,
    )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'mobile', 'role', 'is_active', 'email_verified', 'last_login')
        read_only_fields = fields


class RegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=255)
    mobile = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        email = User.objects.normalize_email(value.strip()).lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return email

    def validate(self, attrs):
        password_user = User(email=attrs['email'], full_name=attrs['full_name'])
        try:
            validate_password(attrs['password'], user=password_user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password': error.messages}) from error
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'].strip(),
            mobile=validated_data.get('mobile', '').strip(),
            role=User.ROLE_STUDENT,
            is_active=False,
            email_verified=False,
        )
        from apps.students.models import StudentProfile

        StudentProfile.objects.create(
            user=user,
            student_code=f'STU-{timezone.now().year}-{user.pk:06d}',
            is_active=False,
        )
        return user


class EmailVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(r'^\d{6}$')

    def validate_email(self, value):
        return value.strip().lower()


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        request = self.context.get('request')

        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            raise serializers.ValidationError('Invalid email or password.')

        if not user.email_verified or not user.is_active:
            raise serializers.ValidationError('Please verify your email before signing in.')

        if user.locked_until and user.locked_until > timezone.now():
            raise serializers.ValidationError('This account is temporarily locked. Please try again later.')

        authenticated_user = authenticate(username=user.email, password=password)
        if authenticated_user is None:
            if request is not None:
                record_failed_login(user, request)
            raise serializers.ValidationError('Invalid email or password.')

        attrs['user'] = authenticated_user
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(r'^\d{6}$')
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        return value.strip().lower()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value


class PasswordResetTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PasswordResetToken
        fields = ('id', 'token', 'created_at', 'used')
        read_only_fields = fields
