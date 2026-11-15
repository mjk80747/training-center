from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminOrCounsellor
from apps.batches.models import Batch, Enrolment
from apps.courses.models import Course
from apps.leads.models import Lead
from apps.students.models import StudentProfile


@api_view(['GET'])
@permission_classes([IsAdminOrCounsellor])
def summary(request):
    return Response({
        'total_students': StudentProfile.objects.count(),
        'total_courses': Course.objects.count(),
        'active_batches': Batch.objects.filter(status='ACTIVE').count(),
        'total_enrolments': Enrolment.objects.count(),
        'new_leads': Lead.objects.filter(status='NEW').count(),
        'course_breakdown': list(Course.objects.annotate(student_count=Count('enrolments')).values('code', 'student_count')),
    })
