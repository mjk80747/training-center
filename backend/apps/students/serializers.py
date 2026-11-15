from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import User

from .models import StudentProfile


class StudentCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=255)
    mobile = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        email = User.objects.normalize_email(value.strip()).lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return email

    def validate_password(self, value):
        user = User(email=self.initial_data.get('email', ''), full_name=self.initial_data.get('full_name', ''))
        try:
            validate_password(value, user=user)
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.messages) from error
        return value

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(
            **validated_data,
            password=password,
            role=User.ROLE_STUDENT,
            is_active=True,
            email_verified=True,
        )
        return StudentProfile.objects.create(
            user=user,
            student_code=f'STU-{timezone.now().year}-{user.pk:06d}',
        )


class StudentProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    full_name = serializers.CharField(source='user.full_name', max_length=255)
    mobile = serializers.CharField(source='user.mobile', max_length=20, allow_blank=True)
    email_verified = serializers.BooleanField(source='user.email_verified', read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            'id', 'student_code', 'email', 'email_verified', 'full_name', 'mobile', 'dob', 'gender', 'whatsapp_number',
            'address', 'city', 'state', 'college', 'university', 'degree', 'branch', 'current_year',
            'current_semester', 'graduation_year', 'status', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'student_code', 'email_verified', 'created_at', 'updated_at')

    def validate_email(self, value):
        normalized_email = User.objects.normalize_email(value.strip()).lower()
        user_id = getattr(self.instance, 'user_id', None)
        if User.objects.filter(email__iexact=normalized_email).exclude(pk=user_id).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return normalized_email

    def validate(self, attrs):
        profile_data = attrs.get('user', {})
        if (
            self.instance
            and self.instance.status == StudentProfile.STATUS_ARCHIVED
            and attrs.get('is_active') is True
        ):
            raise serializers.ValidationError({'is_active': 'Archived student records cannot be reactivated.'})
        if profile_data.get('full_name') is not None:
            profile_data['full_name'] = profile_data['full_name'].strip()
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        activating_unverified_user = validated_data.get('is_active') is True and not user.email_verified
        for field, value in user_data.items():
            setattr(user, field, value)
        if activating_unverified_user:
            user.email_verified = True
        if user_data:
            update_fields = [*user_data.keys(), 'updated_at']
            if activating_unverified_user:
                update_fields.append('email_verified')
            user.save(update_fields=update_fields)
        elif activating_unverified_user:
            user.save(update_fields=['email_verified', 'updated_at'])

        return super().update(instance, validated_data)
