from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CourseModuleViewSet, CourseViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'course-modules', CourseModuleViewSet, basename='course-module')

urlpatterns = [
    path('', include(router.urls)),
]
