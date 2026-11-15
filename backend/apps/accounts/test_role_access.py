from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.attendance.models import Attendance
from apps.batches.models import Batch, ClassSession, Enrolment
from apps.courses.models import Course
from apps.fees.models import Instalment, Payment
from apps.leads.models import Lead
from apps.learning.models import Assignment, Submission
from apps.students.models import StudentProfile
from apps.trainers.models import TrainerProfile


class RoleAccessApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = self.create_user('admin', User.ROLE_ADMIN)
        self.counsellor = self.create_user('counsellor', User.ROLE_COUNSELLOR)
        self.trainer_one = self.create_user('trainer-one', User.ROLE_TRAINER)
        self.trainer_two = self.create_user('trainer-two', User.ROLE_TRAINER)
        self.student_one_user = self.create_user('student-one', User.ROLE_STUDENT)
        self.student_two_user = self.create_user('student-two', User.ROLE_STUDENT)

        self.course_one = Course.objects.create(code='PFS', name='Python Full Stack', fee=1000)
        self.course_two = Course.objects.create(code='JFS', name='Java Full Stack', fee=1200)
        self.batch_one = self.create_batch('PFS-001', self.course_one, self.trainer_one)
        self.batch_two = self.create_batch('JFS-001', self.course_two, self.trainer_two)
        self.student_one = self.create_student(self.student_one_user, 'STU-001')
        self.student_two = self.create_student(self.student_two_user, 'STU-002')
        self.enrolment_one = self.create_enrolment(self.student_one, self.batch_one)
        self.enrolment_two = self.create_enrolment(self.student_two, self.batch_two)
        self.session_one = self.create_session(self.batch_one)
        self.session_two = self.create_session(self.batch_two, trainer=self.trainer_one)
        self.attendance_one = Attendance.objects.create(session=self.session_one, student=self.student_one)
        Attendance.objects.create(session=self.session_two, student=self.student_two)
        self.assignment_one = Assignment.objects.create(
            batch=self.batch_one,
            title='Python assignment',
            due_date='2026-12-01',
        )
        Assignment.objects.create(batch=self.batch_two, title='Java assignment', due_date='2026-12-01')
        TrainerProfile.objects.create(user=self.trainer_one, trainer_code='TR-001')
        TrainerProfile.objects.create(user=self.trainer_two, trainer_code='TR-002')
        Payment.objects.create(enrolment=self.enrolment_one, amount=100)
        self.payment_two = Payment.objects.create(enrolment=self.enrolment_two, amount=200)
        Instalment.objects.create(enrolment=self.enrolment_one, due_date='2026-12-01', amount=500)
        Instalment.objects.create(enrolment=self.enrolment_two, due_date='2026-12-01', amount=600)

    @staticmethod
    def create_user(local_name, role):
        return User.objects.create_user(
            email=f'{local_name}@example.com',
            password='Secure-Password-123!',
            full_name=local_name,
            mobile='9876543210',
            role=role,
            is_staff=role == User.ROLE_ADMIN,
        )

    @staticmethod
    def create_batch(code, course, trainer):
        return Batch.objects.create(
            batch_code=code,
            course=course,
            name=code,
            start_date='2026-01-01',
            end_date='2026-05-01',
            start_time='18:30:00',
            end_time='20:30:00',
            trainer=trainer,
        )

    @staticmethod
    def create_student(user, code):
        return StudentProfile.objects.create(user=user, student_code=code)

    @staticmethod
    def create_enrolment(student, batch):
        return Enrolment.objects.create(
            student=student,
            batch=batch,
            course=batch.course,
            course_fee=batch.course.fee,
            final_fee=batch.course.fee,
        )

    @staticmethod
    def create_session(batch, trainer=None):
        return ClassSession.objects.create(
            batch=batch,
            trainer=trainer,
            date='2026-01-10',
            start_time='18:30:00',
            end_time='20:30:00',
            topic='Lesson',
        )

    def sign_in_as(self, user):
        self.client.force_authenticate(user=user)

    def test_counsellor_can_manage_admissions_but_not_finance_or_settings(self):
        self.sign_in_as(self.counsellor)

        self.assertEqual(self.client.get('/api/v1/leads/').status_code, 200)
        self.assertEqual(self.client.get('/api/v1/students/').data['count'], 2)
        self.assertEqual(self.client.get('/api/v1/batches/').data['count'], 2)
        self.assertEqual(self.client.get('/api/v1/courses/').status_code, 200)
        self.assertEqual(self.client.get('/api/v1/reports/course-summary/').status_code, 403)
        self.assertEqual(self.client.get('/api/v1/payments/').status_code, 403)
        self.assertEqual(self.client.get('/api/v1/site-settings/').status_code, 403)
        self.assertEqual(self.client.get(f'/api/v1/sessions/{self.session_two.id}/').status_code, 403)
        self.assertEqual(self.client.get('/api/v1/trainers/').status_code, 403)
        self.assertEqual(self.client.get('/api/v1/assignments/').status_code, 403)
        self.assertEqual(self.client.get('/api/v1/sessions/').status_code, 403)
        self.assertEqual(self.client.get('/api/v1/batches/schedule_week/').status_code, 403)
        self.assertEqual(self.client.get('/api/v1/colleges/').status_code, 403)
        self.assertEqual(self.client.get('/api/v1/audit-logs/').status_code, 403)
        self.assertEqual(
            self.client.post('/api/v1/courses/', {'code': 'DA', 'name': 'Data Analytics'}).status_code,
            403,
        )
        lead = Lead.objects.create(
            name='Prospective Student',
            mobile='9000000000',
            email='prospective.student@example.com',
            interested_course='PFS',
        )
        conversion = self.client.post(f'/api/v1/leads/{lead.id}/convert/', {}, format='json')
        self.assertEqual(conversion.status_code, 200)
        self.assertTrue(
            StudentProfile.objects.filter(user__email='prospective.student@example.com').exists()
        )
        self.assertEqual(
            self.client.post('/api/v1/batches/', {'batch_code': 'DA-001'}).status_code,
            403,
        )

    def test_trainer_data_is_limited_to_assigned_batches_and_finance_is_denied(self):
        self.sign_in_as(self.trainer_one)

        self.assertEqual(self.client.get('/api/v1/batches/').data['count'], 1)
        self.assertEqual(self.client.get('/api/v1/students/').data['count'], 1)
        self.assertEqual(self.client.get('/api/v1/attendance/').data['count'], 1)
        self.assertEqual(self.client.get('/api/v1/sessions/').data['count'], 1)
        self.assertEqual(self.client.get(f'/api/v1/sessions/{self.session_two.id}/').status_code, 404)
        self.assertEqual(self.client.get('/api/v1/assignments/').data['count'], 1)
        self.assertEqual(self.client.get('/api/v1/trainers/').data['count'], 1)
        self.assertEqual(self.client.get('/api/v1/payments/').status_code, 403)
        self.assertEqual(self.client.get('/api/v1/reports/course-summary/').status_code, 403)
        self.assertEqual(self.client.get('/api/v1/site-settings/').status_code, 403)
        self.assertEqual(
            self.client.post('/api/v1/attendance/bulk_mark/', {
                'session_id': self.session_two.id,
                'records': [{'student_id': self.student_two.id, 'status': 'PRESENT'}],
            }, format='json').status_code,
            404,
        )
        self.assertEqual(
            self.client.post('/api/v1/attendance/bulk_mark/', {
                'session_id': self.session_one.id,
                'records': [{'student_id': self.student_two.id, 'status': 'PRESENT'}],
            }, format='json').status_code,
            400,
        )
        self.assertEqual(
            self.client.post('/api/v1/attendance/bulk_mark/', {
                'session_id': self.session_one.id,
                'records': [{'student_id': self.student_one.id, 'status': 'PRESENT'}],
            }, format='json').status_code,
            200,
        )
        response = self.client.patch(
            f'/api/v1/assignments/{self.assignment_one.id}/',
            {'batch': self.batch_two.id},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_trainer_batch_roster_includes_college_and_is_scoped_to_assigned_batch(self):
        self.student_one.college = 'JNTU Hyderabad'
        self.student_one.save(update_fields=['college'])
        self.sign_in_as(self.trainer_one)

        response = self.client.get(f'/api/v1/batches/{self.batch_one.id}/students/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['full_name'], self.student_one_user.full_name)
        self.assertEqual(response.data['results'][0]['college'], 'JNTU Hyderabad')
        self.assertEqual(self.client.get(f'/api/v1/batches/{self.batch_two.id}/students/').status_code, 404)

    def test_trainer_can_filter_assigned_sessions_by_batch_and_date(self):
        self.sign_in_as(self.trainer_one)

        response = self.client.get(
            '/api/v1/sessions/',
            {'batch': self.batch_one.id, 'date': '2026-01-10'},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], self.session_one.id)

    def test_student_data_reads_are_scoped_to_the_signed_in_student(self):
        self.sign_in_as(self.student_one_user)

        self.assertEqual(self.client.get('/api/v1/students/').data['count'], 1)
        self.assertEqual(self.client.get('/api/v1/batches/').data['count'], 1)
        self.assertEqual(self.client.get('/api/v1/enrolments/').data['count'], 1)
        self.assertEqual(self.client.get('/api/v1/payments/').data['count'], 1)
        self.assertEqual(self.client.get('/api/v1/instalments/').data['count'], 1)
        self.assertEqual(self.client.get('/api/v1/attendance/').data['count'], 1)
        self.assertEqual(self.client.get('/api/v1/assignments/').data['count'], 1)
        self.assertEqual(self.client.get('/api/v1/submissions/').data['count'], 0)
        self.assertEqual(
            self.client.get(f'/api/v1/payments/{self.payment_two.id}/').status_code,
            404,
        )
        self.assertEqual(
            self.client.post('/api/v1/attendance/', {
                'session': self.session_one.id,
                'student': self.student_one.id,
                'status': 'PRESENT',
            }, format='json').status_code,
            403,
        )
        self.assertEqual(self.client.post('/api/v1/leads/', {}, format='json').status_code, 403)

    def test_student_submission_uses_the_signed_in_student_and_trainer_can_only_grade_assigned_work(self):
        self.sign_in_as(self.student_one_user)
        create_response = self.client.post('/api/v1/submissions/', {
            'assignment': self.assignment_one.id,
            'student': self.student_two.id,
            'github_link': 'https://github.com/example/project',
            'marks': 99,
            'feedback': 'forged grade',
        }, format='json')
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.data['student'], self.student_one.id)
        self.assertEqual(str(create_response.data['marks']), '0.00')
        self.assertEqual(
            self.client.get(f'/api/v1/submissions/{create_response.data["id"]}/').status_code,
            200,
        )

        self.sign_in_as(self.trainer_one)
        grade_response = self.client.patch(
            f'/api/v1/submissions/{create_response.data["id"]}/',
            {'marks': 88, 'student': self.student_two.id, 'assignment': self.assignment_two_id()},
            format='json',
        )
        self.assertEqual(grade_response.status_code, 200)
        submission = Submission.objects.get(id=create_response.data['id'])
        self.assertEqual(submission.student_id, self.student_one.id)
        self.assertEqual(submission.assignment_id, self.assignment_one.id)
        self.assertEqual(str(submission.marks), '88.00')
        over_max_grade = self.client.patch(
            f'/api/v1/submissions/{create_response.data["id"]}/',
            {'marks': 101},
            format='json',
        )
        self.assertEqual(over_max_grade.status_code, 400)

    def assignment_two_id(self):
        return Assignment.objects.get(title='Java assignment').id

    def test_only_admin_can_access_reports_and_django_admin(self):
        self.sign_in_as(self.admin)
        self.assertEqual(self.client.get('/api/v1/reports/course-summary/').status_code, 200)
        self.assertEqual(self.client.get('/api/v1/payments/').data['count'], 2)
        self.client.force_login(self.admin)
        self.assertEqual(self.client.get('/admin/').status_code, 200)

        self.client.force_login(self.counsellor)
        self.assertEqual(self.client.get('/admin/').status_code, 403)
