from rest_framework import serializers

from .models import Banner, FAQ, Offer, SiteSetting, Testimonial


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ('id', 'title', 'subtitle', 'image', 'order', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at')


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ('id', 'name', 'role', 'message', 'image', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at')


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ('id', 'question', 'answer', 'order', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at')


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = ('id', 'title', 'description', 'discount_percent', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at')


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = ('id', 'institute_name', 'contact_email', 'contact_phone', 'address', 'instagram_url', 'linkedin_url', 'facebook_url', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
