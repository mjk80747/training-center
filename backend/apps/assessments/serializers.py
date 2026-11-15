from rest_framework import serializers

from .models import Assessment, AssessmentResult


class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = ('id', 'batch', 'title', 'assessment_type', 'date', 'max_marks', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class AssessmentResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentResult
        fields = ('id', 'assessment', 'student', 'marks', 'remarks', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
