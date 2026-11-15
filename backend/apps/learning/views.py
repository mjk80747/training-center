from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from apps.accounts.models import User
from apps.accounts.permissions import (
    IsAdmin,
    IsAdminTrainerOrStudentRead,
    IsStudent,
    IsTrainer,
)
from .models import Assignment, LearningMaterial, Submission
from .serializers import AssignmentSerializer, LearningMaterialSerializer, SubmissionSerializer


class LearningMaterialViewSet(viewsets.ModelViewSet):
    queryset = LearningMaterial.objects.select_related('course', 'batch', 'uploaded_by').all()
    serializer_class = LearningMaterialSerializer
    permission_classes = [IsAdminTrainerOrStudentRead]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['course', 'batch', 'file_type']
    search_fields = ['title']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.role == User.ROLE_TRAINER:
            return queryset.filter(batch__trainer=user)
        if user.role == User.ROLE_STUDENT:
            return queryset.filter(
                Q(batch__enrolments__student__user=user)
                | Q(batch__isnull=True, course__enrolments__student__user=user)
            ).distinct()
        return queryset

    def _validate_trainer_batch(self, serializer):
        if self.request.user.role != User.ROLE_TRAINER:
            return
        batch = serializer.validated_data.get('batch', getattr(serializer.instance, 'batch', None))
        if not batch or batch.trainer_id != self.request.user.id:
            raise ValidationError({'batch': 'You can manage materials only for your assigned batches.'})

    def perform_create(self, serializer):
        self._validate_trainer_batch(serializer)
        if self.request.user.role == User.ROLE_TRAINER:
            serializer.save(uploaded_by=self.request.user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        self._validate_trainer_batch(serializer)
        if self.request.user.role == User.ROLE_TRAINER:
            serializer.save(uploaded_by=self.request.user)
        else:
            serializer.save()


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related('batch').all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAdminTrainerOrStudentRead]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['batch']
    search_fields = ['title']

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
            raise ValidationError({'batch': 'You can manage assignments only for your assigned batches.'})

    def perform_create(self, serializer):
        self._validate_trainer_batch(serializer)
        serializer.save()

    def perform_update(self, serializer):
        self._validate_trainer_batch(serializer)
        serializer.save()


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.select_related('assignment', 'student').all()
    serializer_class = SubmissionSerializer
    permission_classes = [IsAdminTrainerOrStudentRead]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['assignment', 'student', 'status']
    search_fields = ['feedback']

    def get_permissions(self):
        role = getattr(self.request.user, 'role', None)
        if role == User.ROLE_ADMIN:
            return [IsAdmin()]
        if role == User.ROLE_TRAINER and self.action in ('update', 'partial_update'):
            return [IsTrainer()]
        if role == User.ROLE_STUDENT and self.action == 'create':
            return [IsStudent()]
        if self.request.method in ('GET', 'HEAD', 'OPTIONS') and role in (
            User.ROLE_ADMIN, User.ROLE_TRAINER, User.ROLE_STUDENT
        ):
            return [IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.role == User.ROLE_TRAINER:
            return queryset.filter(assignment__batch__trainer=user)
        if user.role == User.ROLE_STUDENT:
            return queryset.filter(student__user=user)
        return queryset

    def perform_create(self, serializer):
        if self.request.user.role == User.ROLE_STUDENT:
            student = self.request.user.student_profile
            assignment = serializer.validated_data['assignment']
            if not assignment.batch.enrolments.filter(student=student).exists():
                raise ValidationError({'assignment': 'You can submit only assignments from your enrolled batches.'})
            serializer.save(student=student)
            return
        serializer.save()
