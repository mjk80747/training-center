from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminOrCounsellor
from apps.students.models import StudentProfile

from .models import FollowUp, Lead, LeadSource
from .serializers import FollowUpSerializer, LeadSerializer, LeadSourceSerializer


class LeadSourceViewSet(viewsets.ModelViewSet):
    queryset = LeadSource.objects.all()
    serializer_class = LeadSourceSerializer
    permission_classes = [IsAdminOrCounsellor]


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.select_related('source', 'assigned_to').all()
    serializer_class = LeadSerializer
    permission_classes = [IsAdminOrCounsellor]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'assigned_to', 'interested_course']
    search_fields = ['name', 'mobile', 'email', 'college_name']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def public_enquiry(self, request):
        source, _ = LeadSource.objects.get_or_create(name='Website')
        payload = {'name': request.data.get('name'), 'mobile': request.data.get('mobile'), 'email': request.data.get('email', ''), 'interested_course': request.data.get('interested_course', ''), 'message': request.data.get('message', ''), 'source': source.id, 'status': Lead.STATUS_NEW}
        serializer = LeadSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save()
        return Response({'detail': 'Enquiry received successfully.', 'lead_id': lead.id}, status=201)

    @action(detail=True, methods=['get'])
    def notes(self, request, pk=None):
        notes = FollowUp.objects.filter(lead=self.get_object())
        return Response(FollowUpSerializer(notes, many=True).data)

    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        lead = self.get_object()
        serializer = FollowUpSerializer(data={'lead': lead.id, 'note': request.data.get('note'), 'follow_up_date': request.data.get('follow_up_date')})
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        lead = self.get_object()
        name = request.data.get('full_name', lead.name)
        email = request.data.get('email', lead.email or f'{lead.mobile}@example.com')
        if not lead.email and not email:
            return Response({'detail': 'Email address is required for conversion.'}, status=400)

        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                password=request.data.get('password', 'Student@123'),
                full_name=name,
                mobile=lead.mobile,
                role=User.ROLE_STUDENT,
            )
            student = StudentProfile.objects.create(
                user=user,
                student_code=f"STU-{lead.pk:04d}",
                college=lead.college_name,
                city=request.data.get('city', ''),
                branch=lead.branch,
                degree=lead.interested_course,
            )
            lead.converted_student = student.id
            lead.status = Lead.STATUS_CONVERTED
            lead.save(update_fields=['converted_student', 'status'])
        return Response({'detail': 'Lead converted to student profile.', 'student_id': student.id})
