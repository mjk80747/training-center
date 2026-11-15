import logging
import secrets
import smtplib
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.exceptions import ImproperlyConfigured, ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.contrib.auth.password_validation import validate_password
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import APIException
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import EmailVerificationCode, LoginActivity, PasswordResetCode, User
from .serializers import (
    ChangePasswordSerializer,
    EmailVerificationSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    RegistrationSerializer,
    ResendVerificationSerializer,
    ResetPasswordSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


class VerificationEmailDeliveryError(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'Verification email could not be sent. Please try again later.'
    default_code = 'email_delivery_failed'


def _new_verification_code():
    return f'{secrets.randbelow(1_000_000):06d}'


def _save_verification_code(user, code, sent_at):
    return EmailVerificationCode.objects.update_or_create(
        user=user,
        defaults={
            'code_hash': make_password(code),
            'expires_at': sent_at + timedelta(minutes=settings.EMAIL_VERIFICATION_CODE_TTL_MINUTES),
            'last_sent_at': sent_at,
            'attempts': 0,
            'consumed_at': None,
        },
    )[0]


def _send_verification_email(user, code):
    try:
        sent = send_mail(
            subject='Verify your email address',
            message=(
                f'Your {settings.INSTITUTE_NAME} verification code is {code}.\n\n'
                f'This code expires in {settings.EMAIL_VERIFICATION_CODE_TTL_MINUTES} minutes. '
                'If you did not create an account, you can ignore this email.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except (ImproperlyConfigured, OSError, smtplib.SMTPException, ValueError):
        logger.exception('Could not send verification email for user_id=%s', user.pk)
        return False

    if sent != 1:
        logger.error('Verification email backend did not deliver a message for user_id=%s', user.pk)
        return False
    return True


def _send_password_reset_email(user, code):
    try:
        sent = send_mail(
            subject='Reset your password',
            message=(
                f'Your {settings.INSTITUTE_NAME} password reset code is {code}.\n\n'
                f'This code expires in {settings.EMAIL_VERIFICATION_CODE_TTL_MINUTES} minutes. '
                'If you did not request a password reset, you can ignore this email.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except (ImproperlyConfigured, OSError, smtplib.SMTPException, ValueError):
        logger.exception('Could not send password reset email for user_id=%s', user.pk)
        return False

    if sent != 1:
        logger.error('Password reset email backend did not deliver a message for user_id=%s', user.pk)
        return False
    return True


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in {'me', 'password_change'}:
            return [IsAuthenticated()]
        return [AllowAny()]

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
        throttle_classes=[ScopedRateThrottle],
        throttle_scope='account_registration',
    )
    def register(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                user = serializer.save()
                code = _new_verification_code()
                _save_verification_code(user, code, timezone.now())
        except IntegrityError as error:
            raise serializers.ValidationError({
                'email': ['An account with this email already exists.'],
            }) from error

        if not _send_verification_email(user, code):
            raise VerificationEmailDeliveryError()

        return Response(
            {
                'detail': 'Account created. Enter the verification code sent to your email.',
                'email': user.email,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
        throttle_classes=[ScopedRateThrottle],
        throttle_scope='email_verification',
    )
    def verify_email(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        now = timezone.now()
        invalid_code = False

        with transaction.atomic():
            verification = (
                EmailVerificationCode.objects.select_for_update()
                .select_related('user')
                .filter(user__email__iexact=email)
                .first()
            )
            if verification is None or verification.consumed_at is not None:
                invalid_code = True
            elif verification.expires_at <= now:
                verification.consumed_at = now
                verification.save(update_fields=['consumed_at'])
                invalid_code = True
            elif verification.attempts >= settings.EMAIL_VERIFICATION_MAX_ATTEMPTS:
                verification.consumed_at = now
                verification.save(update_fields=['consumed_at'])
                invalid_code = True
            elif not check_password(code, verification.code_hash):
                verification.attempts += 1
                if verification.attempts >= settings.EMAIL_VERIFICATION_MAX_ATTEMPTS:
                    verification.consumed_at = now
                verification.save(update_fields=['attempts', 'consumed_at'])
                invalid_code = True
            else:
                user = verification.user
                if not user.email_verified:
                    user.email_verified = True
                    profile = None
                    if user.role == User.ROLE_STUDENT:
                        from apps.students.models import StudentProfile

                        profile = StudentProfile.objects.filter(user=user).first()
                    if profile is None or profile.status != StudentProfile.STATUS_ARCHIVED:
                        user.is_active = True
                        if profile is not None:
                            profile.is_active = True
                            profile.save(update_fields=['is_active', 'updated_at'])
                    else:
                        user.is_active = False
                    user.save(update_fields=['email_verified', 'is_active'])
                if user.role == User.ROLE_STUDENT:
                    from apps.students.models import StudentProfile

                    StudentProfile.objects.filter(user=user, status=StudentProfile.STATUS_ARCHIVED).update(is_active=False)
                verification.consumed_at = now
                verification.save(update_fields=['consumed_at'])

        if invalid_code:
            raise serializers.ValidationError({'code': ['Invalid or expired verification code.']})

        return Response({'detail': 'Email verified. You can now sign in.'}, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
        throttle_classes=[ScopedRateThrottle],
        throttle_scope='verification_resend',
    )
    def resend_verification(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email, email_verified=False, is_active=False).first()

        if user is not None:
            with transaction.atomic():
                verification = (
                    EmailVerificationCode.objects.select_for_update()
                    .filter(user=user)
                    .first()
                )
                now = timezone.now()
                cooldown = timedelta(seconds=settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS)
                if verification is not None and now - verification.last_sent_at >= cooldown:
                    code = _new_verification_code()
                    _save_verification_code(user, code, now)
                else:
                    code = None

            if code is not None and not _send_verification_email(user, code):
                raise VerificationEmailDeliveryError()

        return Response(
            {'detail': 'If an unverified account exists for that email, a verification code will be sent.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        if user.failed_login_count > 0:
            user.failed_login_count = 0
            user.locked_until = None
            user.save(update_fields=['failed_login_count', 'locked_until'])

        refresh = RefreshToken.for_user(user)
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        LoginActivity.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            success=True,
        )

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'role': user.role,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def logout(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                return Response(
                    {'detail': 'Invalid refresh token.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request, *args, **kwargs):
        return Response(UserSerializer(request.user).data)

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
        throttle_classes=[ScopedRateThrottle],
        throttle_scope='password_reset_request',
    )
    def password_forgot(self, request, *args, **kwargs):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        generic_response = {
            'detail': 'If an account exists for that email, a password reset code has been sent.',
        }
        now = timezone.now()
        code = None
        user = None

        with transaction.atomic():
            user = (
                User.objects.select_for_update()
                .filter(email__iexact=email, email_verified=True, is_active=True)
                .first()
            )
            if user is not None:
                reset_record = (
                    PasswordResetCode.objects.select_for_update()
                    .filter(user=user)
                    .first()
                )
                cooldown = timedelta(seconds=settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS)
                cooldown_active = (
                    reset_record is not None
                    and reset_record.consumed_at is None
                    and now - reset_record.last_sent_at < cooldown
                )
                if not cooldown_active:
                    code = _new_verification_code()
                    PasswordResetCode.objects.update_or_create(
                        user=user,
                        defaults={
                            'code_hash': make_password(code),
                            'expires_at': now + timedelta(minutes=settings.EMAIL_VERIFICATION_CODE_TTL_MINUTES),
                            'last_sent_at': now,
                            'attempts': 0,
                            'consumed_at': None,
                        },
                    )

        if user is not None and code is not None and not _send_password_reset_email(user, code):
            PasswordResetCode.objects.filter(user=user, consumed_at__isnull=True).update(consumed_at=timezone.now())

        return Response(generic_response, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
        throttle_classes=[ScopedRateThrottle],
        throttle_scope='password_reset_confirm',
    )
    def password_reset(self, request, *args, **kwargs):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        password = serializer.validated_data['password']
        now = timezone.now()
        invalid_code = False

        with transaction.atomic():
            reset_record = (
                PasswordResetCode.objects.select_for_update()
                .select_related('user')
                .filter(user__email__iexact=email)
                .first()
            )
            if reset_record is None or reset_record.consumed_at is not None:
                invalid_code = True
            elif reset_record.expires_at <= now:
                reset_record.consumed_at = now
                reset_record.save(update_fields=['consumed_at'])
                invalid_code = True
            elif reset_record.attempts >= settings.EMAIL_VERIFICATION_MAX_ATTEMPTS:
                reset_record.consumed_at = now
                reset_record.save(update_fields=['consumed_at'])
                invalid_code = True
            elif not check_password(code, reset_record.code_hash):
                reset_record.attempts += 1
                if reset_record.attempts >= settings.EMAIL_VERIFICATION_MAX_ATTEMPTS:
                    reset_record.consumed_at = now
                reset_record.save(update_fields=['attempts', 'consumed_at'])
                invalid_code = True
            else:
                user = reset_record.user
                try:
                    validate_password(password, user=user)
                except DjangoValidationError as error:
                    raise serializers.ValidationError({'password': error.messages}) from error

                user.set_password(password)
                user.save(update_fields=['password', 'updated_at'])
                reset_record.consumed_at = now
                reset_record.save(update_fields=['consumed_at'])

        if invalid_code:
            raise serializers.ValidationError({'code': ['Invalid or expired password reset code.']})

        return Response({'detail': 'Password reset successfully.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def password_change(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])
        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]


def record_failed_login(user, request):
    if not user:
        return
    user.failed_login_count += 1
    if user.failed_login_count >= 5:
        user.locked_until = timezone.now() + timedelta(minutes=15)
    user.save(update_fields=['failed_login_count', 'locked_until'])

    LoginActivity.objects.create(
        user=user,
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        success=False,
    )
