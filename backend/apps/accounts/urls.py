from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import AuthViewSet

urlpatterns = [
    path('register/', AuthViewSet.as_view({'post': 'register'}), name='register'),
    path('verify-email/', AuthViewSet.as_view({'post': 'verify_email'}), name='verify-email'),
    path('resend-verification/', AuthViewSet.as_view({'post': 'resend_verification'}), name='resend-verification'),
    path('login/', AuthViewSet.as_view({'post': 'login'}), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', AuthViewSet.as_view({'post': 'logout'}), name='logout'),
    path('me/', AuthViewSet.as_view({'get': 'me'}), name='me'),
    path('password/forgot/', AuthViewSet.as_view({'post': 'password_forgot'}), name='password-forgot'),
    path('password/reset/', AuthViewSet.as_view({'post': 'password_reset'}), name='password-reset'),
    path('password/change/', AuthViewSet.as_view({'post': 'password_change'}), name='password-change'),
]
