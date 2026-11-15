from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.accounts.permissions import IsAdmin, IsAdminCounsellorReadOnly

from .models import Banner, FAQ, Offer, SiteSetting, Testimonial
from .serializers import BannerSerializer, FAQSerializer, OfferSerializer, SiteSettingSerializer, TestimonialSerializer


class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [IsAdminCounsellorReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['title', 'subtitle']


class TestimonialViewSet(viewsets.ModelViewSet):
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [IsAdminCounsellorReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name']


class FAQViewSet(viewsets.ModelViewSet):
    queryset = FAQ.objects.all()
    serializer_class = FAQSerializer
    permission_classes = [IsAdminCounsellorReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['question', 'answer']


class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    permission_classes = [IsAdminCounsellorReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['title']


class SiteSettingViewSet(viewsets.ModelViewSet):
    queryset = SiteSetting.objects.all()
    serializer_class = SiteSettingSerializer
    permission_classes = [IsAdmin]
