from decimal import Decimal

from django.db.models import Count
from rest_framework import serializers

from apps.students.models import StudentProfile

from .models import Batch, ClassSession, Enrolment


class EnrolmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrolment
        fields = ('id', 'student', 'batch', 'course', 'joining_date', 'course_fee', 'discount', 'final_fee', 'status')


class BatchSerializer(serializers.ModelSerializer):
    enrolled_students = serializers.SerializerMethodField()
    course_name = serializers.CharField(source='course.name', read_only=True)
    trainer_name = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = (
            'id', 'batch_code', 'course', 'course_name', 'name', 'start_date', 'end_date', 'class_days', 'start_time',
            'end_time', 'duration_hours', 'trainer', 'max_students', 'mode', 'meeting_link', 'status',
            'trainer_name', 'enrolled_students', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_enrolled_students(self, obj):
        return obj.enrolments.count()

    def get_trainer_name(self, obj):
        return obj.trainer.full_name if obj.trainer else 'Unassigned'

    def validate(self, attrs):
        max_students = attrs.get('max_students', self.instance.max_students if self.instance else 30)
        if max_students <= 0:
            raise serializers.ValidationError({'max_students': 'Max students must be greater than zero.'})
        return attrs


class ClassSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassSession
        fields = ('id', 'batch', 'date', 'start_time', 'end_time', 'topic', 'trainer', 'meeting_link', 'recording_url', 'status')
        read_only_fields = ('id',)


class EnrolStudentSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    batch_id = serializers.IntegerField()
    course_id = serializers.IntegerField()
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    def validate(self, attrs):
        student = StudentProfile.objects.filter(id=attrs['student_id']).first()
        batch = Batch.objects.filter(id=attrs['batch_id']).first()
        if not student:
            raise serializers.ValidationError({'student_id': 'Student not found.'})
        if not batch:
            raise serializers.ValidationError({'batch_id': 'Batch not found.'})

        current_count = Enrolment.objects.filter(batch=batch).count()
        if current_count >= batch.max_students:
            raise serializers.ValidationError({'batch_id': 'Batch has reached capacity.'})

        attrs['student'] = student
        attrs['batch'] = batch
        return attrs
