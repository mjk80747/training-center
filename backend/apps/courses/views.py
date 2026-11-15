from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.permissions import IsAuthenticatedCourseRead

from .models import Course, CourseModule
from .serializers import CourseModuleSerializer, CourseSerializer


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticatedCourseRead]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['code', 'status', 'learning_mode']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['code', 'fee', 'duration_months']
    ordering = ['code']


class CourseModuleViewSet(viewsets.ModelViewSet):
    queryset = CourseModule.objects.select_related('course').all()
    serializer_class = CourseModuleSerializer
    permission_classes = [IsAuthenticatedCourseRead]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['course']
    search_fields = ['title']
    ordering_fields = ['order']
