from rest_framework import serializers

from .models import Instalment, Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ('id', 'enrolment', 'amount', 'payment_date', 'mode', 'transaction_id', 'status', 'receipt_number', 'recorded_by', 'notes', 'created_at', 'updated_at')
        read_only_fields = ('id', 'receipt_number', 'created_at', 'updated_at')


class InstalmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instalment
        fields = ('id', 'enrolment', 'due_date', 'amount', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
