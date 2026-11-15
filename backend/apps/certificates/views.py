import secrets

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminOrStudentReadOnly

from .models import Certificate
from .serializers import CertificateSerializer


class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.select_related('student', 'course').all()
    serializer_class = CertificateSerializer
    permission_classes = [IsAdminOrStudentReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'course']
    search_fields = ['certificate_id']
    ordering_fields = ['issued_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == User.ROLE_STUDENT:
            return queryset.filter(student__user=self.request.user)
        return queryset

    def perform_create(self, serializer):
        certificate = serializer.save()
        if not certificate.certificate_id:
            certificate.certificate_id = f'CERT-{secrets.token_hex(4).upper()}'
            certificate.save(update_fields=['certificate_id'])

    @action(detail=False, methods=['get'], url_path='verify/(?P<certificate_id>[^/.]+)', permission_classes=[AllowAny])
    def verify(self, request, certificate_id=None):
        cert = Certificate.objects.filter(certificate_id=certificate_id).first()
        if not cert:
            return Response({'detail': 'Certificate not found.'}, status=404)
        return Response({
            'certificate_id': cert.certificate_id,
            'student': cert.student.student_code,
            'course': cert.course.name,
            'issued_date': cert.issued_date,
        })
