import csv
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin, IsAuthenticatedReadOnly

from .models import StudentProfile
from .serializers import StudentCreateSerializer, StudentProfileSerializer


class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.select_related('user').all()
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticatedReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'city', 'is_active']
    search_fields = ['student_code', 'user__email', 'user__full_name', 'college']
    ordering_fields = ['student_code', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.user.role
        if role == User.ROLE_ADMIN:
            if 'status' not in self.request.query_params:
                return queryset.exclude(status=StudentProfile.STATUS_ARCHIVED)
            return queryset
        if role == User.ROLE_COUNSELLOR:
            return queryset.filter(is_active=True)
        queryset = queryset.filter(is_active=True)
        if role == User.ROLE_TRAINER:
            return queryset.filter(enrolments__batch__trainer=self.request.user).distinct()
        if role == User.ROLE_STUDENT:
            return queryset.filter(user=self.request.user)
        return queryset.none()

    def get_permissions(self):
        if self.action in ('destroy', 'update', 'partial_update'):
            return [IsAdmin()]
        return [IsAuthenticatedReadOnly()]

    def get_serializer_class(self):
        if self.action == 'create':
            return StudentCreateSerializer
        return StudentProfileSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        response_serializer = StudentProfileSerializer(student, context=self.get_serializer_context())
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def perform_destroy(self, instance):
        instance.status = StudentProfile.STATUS_ARCHIVED
        instance.is_active = False
        instance.save(update_fields=['status', 'is_active', 'updated_at'])
        instance.user.is_active = False
        instance.user.save(update_fields=['is_active'])

    @transaction.atomic
    def perform_update(self, serializer):
        student = serializer.save()
        if 'is_active' in serializer.validated_data:
            student.user.is_active = student.is_active
            student.user.save(update_fields=['is_active', 'updated_at'])

    @action(detail=True, methods=['get'])
    def profile_summary(self, request, pk=None):
        student = self.get_object()
        return Response({
            'student_code': student.student_code,
            'full_name': student.user.full_name,
            'email': student.user.email,
            'status': student.status,
            'city': student.city,
            'college': student.college,
        })

    @action(detail=False, methods=['get'])
    def export(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="students.csv"'
        writer = csv.writer(response)
        writer.writerow(['student_code', 'email', 'full_name', 'status', 'city'])
        for student in self.get_queryset():
            writer.writerow([student.student_code, student.user.email, student.user.full_name, student.status, student.city])
        return response
