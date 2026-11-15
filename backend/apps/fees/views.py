from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminOrStudentReadOnly

from .models import Instalment, Payment
from .serializers import InstalmentSerializer, PaymentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('enrolment__student', 'enrolment__batch').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrStudentReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'enrolment', 'mode']
    search_fields = ['transaction_id', 'receipt_number']
    ordering_fields = ['payment_date', 'amount']
    ordering = ['-payment_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == User.ROLE_STUDENT:
            return queryset.filter(enrolment__student__user=self.request.user)
        return queryset

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        payment = self.get_object()
        return Response({
            'receipt_number': payment.receipt_number or f'RCPT-{payment.id}',
            'amount': payment.amount,
            'status': payment.status,
            'enrolment_id': payment.enrolment_id,
        })


class InstalmentViewSet(viewsets.ModelViewSet):
    queryset = Instalment.objects.select_related('enrolment').all()
    serializer_class = InstalmentSerializer
    permission_classes = [IsAdminOrStudentReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'enrolment']
    search_fields = ['amount']
    ordering_fields = ['due_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == User.ROLE_STUDENT:
            return queryset.filter(enrolment__student__user=self.request.user)
        return queryset
