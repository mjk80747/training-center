from django.db import migrations


def create_missing_student_profiles(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    StudentProfile = apps.get_model('students', 'StudentProfile')
    database = schema_editor.connection.alias

    users = User.objects.using(database).filter(role='STUDENT').order_by('pk')
    for user in users.iterator():
        if StudentProfile.objects.using(database).filter(user_id=user.pk).exists():
            continue

        base_code = f'STU-LEGACY-{user.pk:06d}'
        student_code = base_code
        suffix = 1
        while StudentProfile.objects.using(database).filter(student_code=student_code).exists():
            student_code = f'{base_code[:16]}-{suffix}'
            suffix += 1

        StudentProfile.objects.using(database).create(
            user_id=user.pk,
            student_code=student_code,
            is_active=user.is_active and user.email_verified,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_emailverificationcode_user_email_verified_and_more'),
        ('students', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_missing_student_profiles, migrations.RunPython.noop),
    ]
