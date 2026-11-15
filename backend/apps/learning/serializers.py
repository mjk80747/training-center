from pathlib import Path

from rest_framework import serializers

from apps.accounts.models import User

from .models import Assignment, LearningMaterial, Submission

MAX_UPLOAD_SIZE = 20 * 1024 * 1024
MATERIAL_EXTENSIONS = {
    LearningMaterial.TYPE_PDF: {'.pdf'},
    LearningMaterial.TYPE_PPT: {'.ppt', '.pptx'},
    LearningMaterial.TYPE_CODE: {'.zip', '.ipynb', '.py', '.js', '.ts', '.tsx', '.html', '.css', '.sql'},
    LearningMaterial.TYPE_VIDEO: {'.mp4', '.mov', '.webm'},
}
ASSIGNMENT_EXTENSIONS = MATERIAL_EXTENSIONS[LearningMaterial.TYPE_CODE] | MATERIAL_EXTENSIONS[LearningMaterial.TYPE_PDF] | MATERIAL_EXTENSIONS[LearningMaterial.TYPE_PPT]


def validate_upload(upload, allowed_extensions):
    if upload.size > MAX_UPLOAD_SIZE:
        raise serializers.ValidationError('Files must be 20 MB or smaller.')
    extension = Path(upload.name).suffix.lower()
    if extension not in allowed_extensions:
        raise serializers.ValidationError('This file type is not supported.')
    return upload


class LearningMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningMaterial
        fields = ('id', 'course', 'batch', 'title', 'file_type', 'file', 'url', 'uploaded_by', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_file(self, upload):
        file_type = self.initial_data.get('file_type', getattr(self.instance, 'file_type', LearningMaterial.TYPE_PDF))
        if file_type == LearningMaterial.TYPE_LINK:
            raise serializers.ValidationError('Choose a file type for uploads or provide a link without a file.')
        return validate_upload(upload, MATERIAL_EXTENSIONS.get(file_type, set()))

    def validate(self, attrs):
        file = attrs.get('file', getattr(self.instance, 'file', None))
        url = attrs.get('url', getattr(self.instance, 'url', ''))
        file_type = attrs.get('file_type', getattr(self.instance, 'file_type', LearningMaterial.TYPE_PDF))
        if file_type == LearningMaterial.TYPE_LINK:
            if file:
                raise serializers.ValidationError({'file': 'Link materials cannot include an uploaded file.'})
            if not url:
                raise serializers.ValidationError({'url': 'A URL is required for link materials.'})
        elif not file and not url:
            raise serializers.ValidationError({'file': 'Upload a file or provide a URL.'})
        return attrs


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ('id', 'batch', 'title', 'description', 'attachment', 'due_date', 'max_marks', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_attachment(self, upload):
        return validate_upload(upload, ASSIGNMENT_EXTENSIONS)

    def validate_max_marks(self, value):
        if value <= 0:
            raise serializers.ValidationError('Maximum marks must be greater than zero.')
        return value


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ('id', 'assignment', 'student', 'file', 'github_link', 'submitted_at', 'marks', 'feedback', 'status')
        read_only_fields = ('id', 'submitted_at')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        role = getattr(getattr(request, 'user', None), 'role', None)
        read_only_fields = ()
        if role == User.ROLE_STUDENT:
            read_only_fields = ('student', 'marks', 'feedback', 'status')
        elif role == User.ROLE_TRAINER:
            read_only_fields = ('assignment', 'student', 'file', 'github_link', 'submitted_at')
        for field_name in read_only_fields:
            self.fields[field_name].read_only = True

    def validate(self, attrs):
        request = self.context.get('request')
        role = getattr(getattr(request, 'user', None), 'role', None)
        if role == User.ROLE_STUDENT:
            return attrs
        assignment = attrs.get('assignment', getattr(self.instance, 'assignment', None))
        marks = attrs.get('marks')
        if assignment and marks is not None and marks > assignment.max_marks:
            raise serializers.ValidationError({'marks': 'Marks cannot exceed the assignment maximum.'})
        return attrs

    def validate_assignment(self, assignment):
        request = self.context.get('request')
        if getattr(getattr(request, 'user', None), 'role', None) == User.ROLE_STUDENT:
            student = getattr(request.user, 'student_profile', None)
            if student is None or not assignment.batch.enrolments.filter(student=student).exists():
                raise serializers.ValidationError('You can submit only assignments from your enrolled batches.')
        return assignment
