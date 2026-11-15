from rest_framework import serializers

from apps.accounts.models import User

from .models import Announcement, Notification


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ('id', 'title', 'body', 'audience', 'batch', 'created_by', 'created_at')
        read_only_fields = ('id', 'created_at')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'user', 'title', 'message', 'is_read', 'created_at')
        read_only_fields = ('id', 'created_at')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if getattr(getattr(request, 'user', None), 'role', None) != User.ROLE_ADMIN:
            for field_name in ('user', 'title', 'message'):
                self.fields[field_name].read_only = True
