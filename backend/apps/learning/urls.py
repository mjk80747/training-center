from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AssignmentViewSet, LearningMaterialViewSet, SubmissionViewSet

router = DefaultRouter()
router.register(r'materials', LearningMaterialViewSet, basename='material')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'submissions', SubmissionViewSet, basename='submission')

urlpatterns = [
    path('', include(router.urls)),
]
