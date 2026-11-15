from django.conf import settings
from django.db import models

from apps.batches.models import Enrolment


class Payment(models.Model):
    MODE_UPI = 'UPI'
    MODE_CARD = 'CARD'
    MODE_BANK = 'BANK'
    MODE_CASH = 'CASH'
    MODE_CHOICES = [
        (MODE_UPI, 'UPI'),
        (MODE_CARD, 'Card'),
        (MODE_BANK, 'Bank'),
        (MODE_CASH, 'Cash'),
    ]

    STATUS_SUCCESS = 'SUCCESS'
    STATUS_PENDING = 'PENDING'
    STATUS_FAILED = 'FAILED'
    STATUS_REFUNDED = 'REFUNDED'
    STATUS_CHOICES = [
        (STATUS_SUCCESS, 'Success'),
        (STATUS_PENDING, 'Pending'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_REFUNDED, 'Refunded'),
    ]

    enrolment = models.ForeignKey(Enrolment, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_date = models.DateField(auto_now_add=True)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default=MODE_CASH)
    transaction_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SUCCESS)
    receipt_number = models.CharField(max_length=50, blank=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_payments')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f'{self.enrolment} - {self.amount}'


class Instalment(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_PAID = 'PAID'
    STATUS_OVERDUE = 'OVERDUE'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PAID, 'Paid'),
        (STATUS_OVERDUE, 'Overdue'),
    ]

    enrolment = models.ForeignKey(Enrolment, on_delete=models.CASCADE, related_name='instalments')
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.enrolment} - {self.amount}'
