from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin, IsAdminTrainerOrStudentRead

from .models import Announcement, Notification
from .serializers import AnnouncementSerializer, NotificationSerializer


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.select_related('batch', 'created_by').all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdminTrainerOrStudentRead]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['audience', 'batch']
    search_fields = ['title', 'body']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.role == User.ROLE_TRAINER:
            return queryset.filter(Q(audience=Announcement.AUDIENCE_ALL) | Q(batch__trainer=user)).distinct()
        if user.role == User.ROLE_STUDENT:
            return queryset.filter(
                Q(audience=Announcement.AUDIENCE_ALL)
                | Q(batch__enrolments__student__user=user)
            ).distinct()
        return queryset

    def _validate_trainer_announcement(self, serializer):
        if self.request.user.role != User.ROLE_TRAINER:
            return
        audience = serializer.validated_data.get('audience', getattr(serializer.instance, 'audience', None))
        batch = serializer.validated_data.get('batch', getattr(serializer.instance, 'batch', None))
        if audience != Announcement.AUDIENCE_BATCH or not batch or batch.trainer_id != self.request.user.id:
            raise ValidationError({'batch': 'Trainers can announce only to their assigned batches.'})

    def perform_create(self, serializer):
        self._validate_trainer_announcement(serializer)
        if self.request.user.role == User.ROLE_TRAINER:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        self._validate_trainer_announcement(serializer)
        if self.request.user.role == User.ROLE_TRAINER:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.select_related('user').all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminTrainerOrStudentRead]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'is_read']
    search_fields = ['title', 'message']

    def get_permissions(self):
        role = getattr(self.request.user, 'role', None)
        if role == User.ROLE_ADMIN:
            return [IsAdmin()]
        if role in (User.ROLE_COUNSELLOR, User.ROLE_TRAINER, User.ROLE_STUDENT):
            if self.request.method in ('GET', 'HEAD', 'OPTIONS') or self.action in ('update', 'partial_update'):
                return [IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == User.ROLE_ADMIN:
            return queryset
        if self.request.user.role in (User.ROLE_COUNSELLOR, User.ROLE_TRAINER, User.ROLE_STUDENT):
            return queryset.filter(user=self.request.user)
        return queryset.none()

    def perform_update(self, serializer):
        if self.request.user.role == User.ROLE_ADMIN:
            serializer.save()
            return
        serializer.save(user=self.request.user)
