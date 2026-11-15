from rest_framework import serializers

from .models import College


class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = ('id', 'name', 'location', 'contact_person', 'contact_phone', 'department_details', 'partnership_status', 'notes', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
