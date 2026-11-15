from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import InstalmentViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'instalments', InstalmentViewSet, basename='instalment')

urlpatterns = [
    path('', include(router.urls)),
]
