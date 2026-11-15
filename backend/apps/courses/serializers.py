from rest_framework import serializers

from .models import Course, CourseModule


class CourseModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseModule
        fields = ('id', 'course', 'title', 'description', 'order', 'duration_hours')


class CourseSerializer(serializers.ModelSerializer):
    modules = CourseModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = (
            'id', 'code', 'name', 'description', 'image', 'duration_months',
            'total_modules', 'fee', 'learning_mode', 'eligibility', 'skills_covered',
            'projects', 'certification_details', 'placement_support', 'status', 'modules'
        )
