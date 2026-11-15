#!/usr/bin/env python
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

def main():
    external_env_file = os.environ.get('DJANGO_ENV_FILE')
    if external_env_file:
        external_env_path = Path(external_env_file).expanduser()
        if not external_env_path.is_file():
            raise FileNotFoundError(f'DJANGO_ENV_FILE does not exist: {external_env_path}')
    else:
        local_app_data = os.environ.get('LOCALAPPDATA')
        external_env_path = (
            Path(local_app_data) / 'JKIT' / 'training-center.env'
            if local_app_data
            else None
        )

    if external_env_path and external_env_path.is_file():
        load_dotenv(external_env_path)

    load_dotenv(Path(__file__).resolve().parent / '.env')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and available on your PYTHONPATH?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
