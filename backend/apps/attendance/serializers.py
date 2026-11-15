from rest_framework import serializers

from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ('id', 'session', 'student', 'status', 'marked_by', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class AttendanceRecordSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(min_value=1)
    status = serializers.ChoiceField(
        choices=('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'),
        default='PRESENT',
    )


class BulkAttendanceSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(min_value=1)
    records = AttendanceRecordSerializer(many=True, allow_empty=False)
