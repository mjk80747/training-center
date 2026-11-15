from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AssessmentResultViewSet, AssessmentViewSet

router = DefaultRouter()
router.register(r'assessments', AssessmentViewSet, basename='assessment')
router.register(r'results', AssessmentResultViewSet, basename='result')

urlpatterns = [
    path('', include(router.urls)),
]
