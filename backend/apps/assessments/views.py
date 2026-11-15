from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminTrainerOrStudentRead
from .models import Assessment, AssessmentResult
from .serializers import AssessmentResultSerializer, AssessmentSerializer


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.select_related('batch').all()
    serializer_class = AssessmentSerializer
    permission_classes = [IsAdminTrainerOrStudentRead]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['batch', 'assessment_type']
    search_fields = ['title']
    ordering_fields = ['date', 'title']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.role == User.ROLE_TRAINER:
            return queryset.filter(batch__trainer=user)
        if user.role == User.ROLE_STUDENT:
            return queryset.filter(batch__enrolments__student__user=user).distinct()
        return queryset


class AssessmentResultViewSet(viewsets.ModelViewSet):
    queryset = AssessmentResult.objects.select_related('assessment', 'student').all()
    serializer_class = AssessmentResultSerializer
    permission_classes = [IsAdminTrainerOrStudentRead]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['assessment', 'student']
    search_fields = ['remarks']
    ordering_fields = ['marks']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.role == User.ROLE_TRAINER:
            return queryset.filter(assessment__batch__trainer=user)
        if user.role == User.ROLE_STUDENT:
            return queryset.filter(student__user=user)
        return queryset
