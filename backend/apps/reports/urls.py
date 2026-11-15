from django.urls import path

from .views import course_report

urlpatterns = [
    path('reports/course-summary/', course_report, name='report-course-summary'),
]
