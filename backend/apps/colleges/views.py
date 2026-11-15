from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.permissions import IsAdmin

from .models import College
from .serializers import CollegeSerializer


class CollegeViewSet(viewsets.ModelViewSet):
    queryset = College.objects.all()
    serializer_class = CollegeSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['partnership_status']
    search_fields = ['name', 'location', 'contact_person']
    ordering_fields = ['name', 'created_at']
