from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BatchViewSet, ClassSessionViewSet, EnrolmentViewSet

router = DefaultRouter()
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'enrolments', EnrolmentViewSet, basename='enrolment')
router.register(r'sessions', ClassSessionViewSet, basename='session')

urlpatterns = [
    path('', include(router.urls)),
]
