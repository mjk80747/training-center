import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.core.management.utils import get_random_secret_key

BASE_DIR = Path(__file__).resolve().parent.parent.parent

DEBUG = os.getenv('DJANGO_DEBUG', 'True').lower() in {'1', 'true', 'yes', 'on'}
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        development_secret_path = BASE_DIR / '.dev_secret_key'
        try:
            with development_secret_path.open('x', encoding='utf-8') as secret_file:
                SECRET_KEY = get_random_secret_key()
                secret_file.write(SECRET_KEY)
        except FileExistsError:
            SECRET_KEY = development_secret_path.read_text(encoding='utf-8').strip()
        if not SECRET_KEY:
            raise ImproperlyConfigured('The local development secret key file is empty.')
    else:
        raise ImproperlyConfigured('DJANGO_SECRET_KEY must be configured when DEBUG is disabled.')

allowed_hosts = os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
for vercel_host_variable in ('VERCEL_URL', 'VERCEL_PROJECT_PRODUCTION_URL'):
    vercel_host = os.getenv(vercel_host_variable, '').strip()
    if vercel_host:
        allowed_hosts.append(vercel_host)
ALLOWED_HOSTS = list(dict.fromkeys(host.strip() for host in allowed_hosts if host.strip()))
INSTITUTE_NAME = os.getenv('INSTITUTE_NAME', 'JK IT SOLUTIONS')
EMAIL_BACKEND = os.getenv(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend' if DEBUG else 'django.core.mail.backends.smtp.EmailBackend',
)
EMAIL_HOST = os.getenv('EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '25'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'False').lower() in {'1', 'true', 'yes', 'on'}
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False').lower() in {'1', 'true', 'yes', 'on'}
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'KSR IT Solutions <no-reply@techskillinstitute.local>')
EMAIL_VERIFICATION_CODE_TTL_MINUTES = int(os.getenv('EMAIL_VERIFICATION_CODE_TTL_MINUTES', '10'))
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS = int(os.getenv('EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS', '60'))
EMAIL_VERIFICATION_MAX_ATTEMPTS = int(os.getenv('EMAIL_VERIFICATION_MAX_ATTEMPTS', '5'))
if EMAIL_USE_TLS and EMAIL_USE_SSL:
    raise ImproperlyConfigured('EMAIL_USE_TLS and EMAIL_USE_SSL cannot both be enabled.')

COURSE_DEFAULT_DURATIONS_MONTHS = {
    'PFS': int(os.getenv('COURSE_PFS_DURATION_MONTHS', '5')),
    'JFS': int(os.getenv('COURSE_JFS_DURATION_MONTHS', '5')),
    'PYCORE': int(os.getenv('COURSE_PYCORE_DURATION_MONTHS', '3')),
    'JCORE': int(os.getenv('COURSE_JCORE_DURATION_MONTHS', '3')),
    'DA': int(os.getenv('COURSE_DA_DURATION_MONTHS', '4')),
    'FED': int(os.getenv('COURSE_FED_DURATION_MONTHS', '3')),
}
DEFAULT_CLASS_DURATION_HOURS = int(os.getenv('DEFAULT_CLASS_DURATION_HOURS', '2'))
WEEKDAY_CLASS_SLOTS = tuple(
    slot.strip()
    for slot in os.getenv('WEEKDAY_CLASS_SLOTS', '18:30-20:30,19:00-21:00').split(',')
    if slot.strip()
)
WEEKEND_CLASS_SLOTS = tuple(
    slot.strip()
    for slot in os.getenv('WEEKEND_CLASS_SLOTS', '09:00-11:00,14:00-16:00,17:00-19:00').split(',')
    if slot.strip()
)
CLASS_THEORY_PERCENTAGE = int(os.getenv('CLASS_THEORY_PERCENTAGE', '30'))
CLASS_PRACTICAL_PERCENTAGE = int(os.getenv('CLASS_PRACTICAL_PERCENTAGE', '70'))

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'apps.accounts',
    'apps.courses',
    'apps.students',
    'apps.batches',
    'apps.leads',
    'apps.dashboard',
    'apps.trainers',
    'apps.attendance',
    'apps.fees',
    'apps.learning',
    'apps.assessments',
    'apps.certificates',
    'apps.notifications',
    'apps.website_content',
    'apps.colleges',
    'apps.audit',
    'apps.reports',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.accounts.middleware.AdminRoleAccessMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

if os.getenv('USE_SQLITE', 'True').lower() in {'1', 'true', 'yes', 'on'}:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('POSTGRES_DB', 'institute_db'),
            'USER': os.getenv('POSTGRES_USER', 'institute_user'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'institute_pass'),
            'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
            'PORT': os.getenv('POSTGRES_PORT', '5432'),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_RATES': {
        'account_registration': '5/hour',
        'email_verification': '10/hour',
        'verification_resend': '3/hour',
        'password_reset_request': '5/hour',
        'password_reset_confirm': '10/hour',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', '60'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_LIFETIME_DAYS', '7'))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173',
    ).split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

SPECTACULAR_SETTINGS = {
    'TITLE': f'{INSTITUTE_NAME} API',
    'DESCRIPTION': 'API for the institute management platform',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

LOGIN_URL = '/api/v1/auth/login/'
