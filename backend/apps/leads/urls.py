from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LeadSourceViewSet, LeadViewSet

router = DefaultRouter()
router.register(r'lead-sources', LeadSourceViewSet, basename='lead-source')
router.register(r'leads', LeadViewSet, basename='lead')

urlpatterns = [
    path('', include(router.urls)),
]
