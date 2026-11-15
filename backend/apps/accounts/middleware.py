from django.http import HttpResponseForbidden

from .models import User


class AdminRoleAccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if (
            request.path.startswith('/admin/')
            and request.user.is_authenticated
            and request.user.role != User.ROLE_ADMIN
        ):
            return HttpResponseForbidden('Only admins can access the administration site.')
        return self.get_response(request)
