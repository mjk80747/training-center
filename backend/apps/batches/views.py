from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import (
    IsAdminOrCounsellor,
    IsAdminCounsellorOrStudentRead,
    IsAdminTrainerOrStudentRead,
    IsPortalReadAdminWrite,
)
from apps.students.models import StudentProfile

from .models import Batch, ClassSession, Enrolment
from .serializers import BatchSerializer, ClassSessionSerializer, EnrolmentSerializer, EnrolStudentSerializer


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.select_related('course', 'trainer').all()
    serializer_class = BatchSerializer
    permission_classes = [IsPortalReadAdminWrite]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['course', 'status', 'mode']
    search_fields = ['batch_code', 'name']
    ordering_fields = ['start_date', 'batch_code']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.role == User.ROLE_TRAINER:
            return queryset.filter(trainer=user)
        if user.role == User.ROLE_STUDENT:
            return queryset.filter(enrolments__student__user=user).distinct()
        return queryset

    def get_permissions(self):
        if self.action == 'enrol_student':
            return [IsAdminOrCounsellor()]
        if self.action == 'schedule_week':
            return [IsAdminTrainerOrStudentRead()]
        return super().get_permissions()

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        batch = self.get_object()
        students = StudentProfile.objects.select_related('user').filter(enrolments__batch=batch).distinct()
        return Response({
            'count': students.count(),
            'results': [
                {
                    'id': student.id,
                    'student_code': student.student_code,
                    'full_name': student.user.full_name,
                    'college': student.college,
                }
                for student in students
            ],
        })

    @action(detail=False, methods=['get'])
    def schedule_week(self, request):
        start_date = request.query_params.get('start_date', timezone.now().date().isoformat())
        sessions = ClassSession.objects.filter(date__gte=start_date)
        if request.user.role == User.ROLE_TRAINER:
            sessions = sessions.filter(batch__trainer=request.user)
        elif request.user.role == User.ROLE_STUDENT:
            sessions = sessions.filter(batch__enrolments__student__user=request.user)
        sessions = sessions.select_related('batch', 'trainer').distinct().order_by('date')[:20]
        return Response(ClassSessionSerializer(sessions, many=True).data)

    @action(detail=True, methods=['post'])
    def enrol_student(self, request, pk=None):
        batch = self.get_object()
        serializer = EnrolStudentSerializer(data={
            'student_id': request.data.get('student_id'),
            'batch_id': batch.id,
            'course_id': request.data.get('course_id', batch.course.id),
            'discount': request.data.get('discount', 0),
        })
        serializer.is_valid(raise_exception=True)
        student = serializer.validated_data['student']
        batch = serializer.validated_data['batch']

        with transaction.atomic():
            enrolment = Enrolment.objects.create(
                student=student,
                batch=batch,
                course=batch.course,
                course_fee=batch.course.fee,
                discount=serializer.validated_data.get('discount', 0),
                final_fee=batch.course.fee - serializer.validated_data.get('discount', 0),
            )
        return Response(EnrolmentSerializer(enrolment).data)


class EnrolmentViewSet(viewsets.ModelViewSet):
    queryset = Enrolment.objects.select_related('student', 'batch', 'course').all()
    serializer_class = EnrolmentSerializer
    permission_classes = [IsAdminCounsellorOrStudentRead]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'batch', 'course']
    search_fields = ['student__student_code', 'batch__batch_code']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == User.ROLE_STUDENT:
            return queryset.filter(student__user=self.request.user)
        return queryset


class ClassSessionViewSet(viewsets.ModelViewSet):
    queryset = ClassSession.objects.select_related('batch', 'trainer').all()
    serializer_class = ClassSessionSerializer
    permission_classes = [IsAdminTrainerOrStudentRead]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['batch', 'date', 'status']
    search_fields = ['topic']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.role == User.ROLE_TRAINER:
            return queryset.filter(batch__trainer=user)
        if user.role == User.ROLE_STUDENT:
            return queryset.filter(batch__enrolments__student__user=user).distinct()
        return queryset

    def _validate_trainer_batch(self, serializer):
        if self.request.user.role != User.ROLE_TRAINER:
            return
        batch = serializer.validated_data.get('batch', getattr(serializer.instance, 'batch', None))
        if not batch or batch.trainer_id != self.request.user.id:
            raise ValidationError({'batch': 'You can manage sessions only for your assigned batches.'})

    def perform_create(self, serializer):
        self._validate_trainer_batch(serializer)
        if self.request.user.role == User.ROLE_TRAINER:
            serializer.save(trainer=self.request.user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        self._validate_trainer_batch(serializer)
        if self.request.user.role == User.ROLE_TRAINER:
            serializer.save(trainer=self.request.user)
        else:
            serializer.save()
