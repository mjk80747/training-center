from rest_framework import serializers

from .models import FollowUp, Lead, LeadSource


class LeadSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadSource
        fields = ('id', 'name')


class FollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUp
        fields = ('id', 'lead', 'note', 'follow_up_date', 'created_by', 'created_at')
        read_only_fields = ('id', 'created_by', 'created_at')


class LeadSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source='source.name', read_only=True)

    class Meta:
        model = Lead
        fields = (
            'id', 'name', 'mobile', 'email', 'college_name', 'branch', 'current_year', 'interested_course',
            'preferred_timing', 'learning_mode', 'message', 'source', 'source_name', 'assigned_to',
            'status', 'next_follow_up_date', 'converted_student', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'converted_student', 'created_at', 'updated_at')
