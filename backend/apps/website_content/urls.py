from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BannerViewSet, FAQViewSet, OfferViewSet, SiteSettingViewSet, TestimonialViewSet

router = DefaultRouter()
router.register(r'banners', BannerViewSet, basename='banner')
router.register(r'testimonials', TestimonialViewSet, basename='testimonial')
router.register(r'faqs', FAQViewSet, basename='faq')
router.register(r'offers', OfferViewSet, basename='offer')
router.register(r'site-settings', SiteSettingViewSet, basename='site-setting')

urlpatterns = [
    path('', include(router.urls)),
]
