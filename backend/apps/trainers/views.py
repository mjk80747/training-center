from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import SAFE_METHODS

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin, IsAdminOrTrainer

from .models import TrainerProfile
from .serializers import TrainerProfileSerializer


class TrainerProfileViewSet(viewsets.ModelViewSet):
    queryset = TrainerProfile.objects.select_related('user').all()
    serializer_class = TrainerProfileSerializer
    permission_classes = [IsAdminOrTrainer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['trainer_code', 'user__email', 'user__full_name', 'specialisation']
    ordering_fields = ['trainer_code', 'experience_years', 'joining_date']
    ordering = ['trainer_code']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == User.ROLE_TRAINER:
            return queryset.filter(user=self.request.user)
        return queryset

    def get_permissions(self):
        if self.request.method not in SAFE_METHODS and getattr(self.request.user, 'role', None) != User.ROLE_ADMIN:
            return [IsAdmin()]
        return super().get_permissions()
