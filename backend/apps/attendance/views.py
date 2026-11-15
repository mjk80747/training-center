from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminTrainerOrStudentRead
from apps.batches.models import ClassSession, Enrolment

from .models import Attendance
from .serializers import AttendanceSerializer, BulkAttendanceSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('session', 'student').all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAdminTrainerOrStudentRead]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['session', 'student', 'status']
    search_fields = ['student__student_code', 'session__topic']
    ordering_fields = ['created_at', 'status']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.role == User.ROLE_TRAINER:
            return queryset.filter(session__batch__trainer=user)
        if user.role == User.ROLE_STUDENT:
            return queryset.filter(student__user=user)
        return queryset

    def _validate_attendance_scope(self, session, student_id):
        if not Enrolment.objects.filter(batch=session.batch, student_id=student_id).exists():
            raise ValidationError({'student': 'The student is not enrolled in this session batch.'})
        if self.request.user.role == User.ROLE_TRAINER and session.batch.trainer_id != self.request.user.id:
            raise ValidationError({'session': 'You can manage attendance only for your assigned batches.'})

    def perform_create(self, serializer):
        session = serializer.validated_data['session']
        student = serializer.validated_data['student']
        self._validate_attendance_scope(session, student.id)
        serializer.save(marked_by=self.request.user)

    def perform_update(self, serializer):
        session = serializer.validated_data.get('session', serializer.instance.session)
        student = serializer.validated_data.get('student', serializer.instance.student)
        self._validate_attendance_scope(session, student.id)
        serializer.save(marked_by=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        serializer = BulkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session_id = serializer.validated_data['session_id']
        sessions = ClassSession.objects.select_related('batch').filter(id=session_id)
        if request.user.role == User.ROLE_TRAINER:
            sessions = sessions.filter(batch__trainer=request.user)
        session = sessions.first()
        if not session:
            return Response({'detail': 'Session not found.'}, status=404)

        records = serializer.validated_data['records']
        student_ids = [record['student_id'] for record in records]
        if len(set(student_ids)) != len(student_ids):
            raise ValidationError({'records': 'A student can appear only once per session.'})
        enrolled_ids = set(
            Enrolment.objects.filter(batch=session.batch, student_id__in=student_ids)
            .values_list('student_id', flat=True)
        )
        if enrolled_ids != set(student_ids):
            raise ValidationError({'records': 'Every student must be enrolled in the session batch.'})

        with transaction.atomic():
            for record in records:
                Attendance.objects.update_or_create(
                    session=session,
                    student_id=record['student_id'],
                    defaults={'status': record['status'], 'marked_by': request.user},
                )
        return Response({'detail': 'Attendance marked successfully.'}, status=200)
