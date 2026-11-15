from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin
from apps.batches.models import Enrolment
from apps.courses.models import Course


@api_view(['GET'])
@permission_classes([IsAdmin])
def course_report(request):
    reports = []
    for course in Course.objects.all():
        reports.append({
            'course': course.code,
            'name': course.name,
            'total_enrolments': Enrolment.objects.filter(course=course).count(),
            'total_fee': float(Enrolment.objects.filter(course=course).aggregate(total=Sum('final_fee'))['total'] or 0),
        })
    return Response(reports)
