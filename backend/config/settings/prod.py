import os
from urllib.parse import parse_qs, unquote, urlparse

from django.core.exceptions import ImproperlyConfigured
from .base import *

DEBUG = False

database_url = os.getenv('DATABASE_URL')
if database_url:
    parsed_database_url = urlparse(database_url)
    database_name = unquote(parsed_database_url.path.lstrip('/'))

    if (
        parsed_database_url.scheme not in {'postgres', 'postgresql'}
        or not parsed_database_url.hostname
        or not parsed_database_url.username
        or not database_name
    ):
        raise ImproperlyConfigured(
            'DATABASE_URL must include a PostgreSQL scheme, username, host, and database name.'
        )

    try:
        database_port = parsed_database_url.port or 5432
    except ValueError as exc:
        raise ImproperlyConfigured('DATABASE_URL contains an invalid port.') from exc

    database_options = {
        key: values[-1]
        for key, values in parse_qs(parsed_database_url.query).items()
    }
    database_options.setdefault('sslmode', 'require')
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': database_name,
            'USER': unquote(parsed_database_url.username),
            'PASSWORD': unquote(parsed_database_url.password or ''),
            'HOST': parsed_database_url.hostname,
            'PORT': database_port,
            'OPTIONS': database_options,
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('POSTGRES_DB', 'institute_db'),
            'USER': os.getenv('POSTGRES_USER', 'institute_user'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'institute_pass'),
            'HOST': os.getenv('POSTGRES_HOST', 'db'),
            'PORT': os.getenv('POSTGRES_PORT', '5432'),
        }
    }

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
