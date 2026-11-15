from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok', 'service': 'backend'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', health, name='health'),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.courses.urls')),
    path('api/v1/', include('apps.students.urls')),
    path('api/v1/', include('apps.batches.urls')),
    path('api/v1/', include('apps.leads.urls')),
    path('api/v1/', include('apps.dashboard.urls')),
    path('api/v1/', include('apps.trainers.urls')),
    path('api/v1/', include('apps.attendance.urls')),
    path('api/v1/', include('apps.fees.urls')),
    path('api/v1/', include('apps.learning.urls')),
    path('api/v1/', include('apps.assessments.urls')),
    path('api/v1/', include('apps.certificates.urls')),
    path('api/v1/', include('apps.notifications.urls')),
    path('api/v1/', include('apps.website_content.urls')),
    path('api/v1/', include('apps.colleges.urls')),
    path('api/v1/', include('apps.audit.urls')),
    path('api/v1/', include('apps.reports.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
