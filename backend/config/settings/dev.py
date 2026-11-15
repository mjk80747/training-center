import os

from .base import *

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
