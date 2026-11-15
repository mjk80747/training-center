from rest_framework import serializers

from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Certificate
        fields = ('id', 'student', 'course', 'course_name', 'certificate_id', 'issued_date', 'pdf_file', 'created_at', 'updated_at')
        read_only_fields = ('id', 'certificate_id', 'issued_date', 'created_at', 'updated_at')
