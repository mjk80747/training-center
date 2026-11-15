from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TrainerProfileViewSet

router = DefaultRouter()
router.register(r'trainers', TrainerProfileViewSet, basename='trainer')

urlpatterns = [
    path('', include(router.urls)),
]
