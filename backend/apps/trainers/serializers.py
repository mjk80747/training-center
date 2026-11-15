from rest_framework import serializers

from .models import TrainerProfile


class TrainerProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = TrainerProfile
        fields = (
            'id', 'trainer_code', 'email', 'full_name', 'qualification', 'specialisation',
            'experience_years', 'technologies', 'joining_date', 'availability', 'status', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'trainer_code', 'email', 'full_name', 'created_at', 'updated_at')
