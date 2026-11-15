from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import User


class RolePermission(BasePermission):
    read_roles = frozenset()
    write_roles = frozenset()
    allow_anonymous_read = False

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            if self.allow_anonymous_read and not request.user.is_authenticated:
                return True
            return bool(request.user and request.user.is_authenticated and request.user.role in self.read_roles)
        return bool(request.user and request.user.is_authenticated and request.user.role in self.write_roles)


class IsAdmin(RolePermission):
    message = 'Only admins can access this endpoint.'
    read_roles = frozenset({User.ROLE_ADMIN})
    write_roles = frozenset({User.ROLE_ADMIN})


class IsAdminOrCounsellor(RolePermission):
    message = 'Only admins and counsellors can access this endpoint.'
    read_roles = frozenset({User.ROLE_ADMIN, User.ROLE_COUNSELLOR})
    write_roles = read_roles


class IsAdminCounsellorReadOnly(RolePermission):
    message = 'Only admins and counsellors can view this endpoint; only admins can change it.'
    read_roles = frozenset({User.ROLE_ADMIN, User.ROLE_COUNSELLOR})
    write_roles = frozenset({User.ROLE_ADMIN})


class IsAuthenticatedReadOnly(RolePermission):
    message = 'Only admins and counsellors can change this endpoint.'
    read_roles = frozenset({
        User.ROLE_ADMIN,
        User.ROLE_COUNSELLOR,
        User.ROLE_TRAINER,
        User.ROLE_STUDENT,
    })
    write_roles = frozenset({User.ROLE_ADMIN, User.ROLE_COUNSELLOR})


class IsPortalReadAdminWrite(RolePermission):
    message = 'Only admins can change this endpoint.'
    read_roles = frozenset({
        User.ROLE_ADMIN,
        User.ROLE_COUNSELLOR,
        User.ROLE_TRAINER,
        User.ROLE_STUDENT,
    })
    write_roles = frozenset({User.ROLE_ADMIN})


class IsAdminOrTrainer(RolePermission):
    message = 'Only admins and assigned trainers can access this endpoint.'
    read_roles = frozenset({User.ROLE_ADMIN, User.ROLE_TRAINER})
    write_roles = read_roles


class IsAdminTrainerOrStudentRead(RolePermission):
    message = 'Only admins and trainers can change this endpoint.'
    read_roles = frozenset({User.ROLE_ADMIN, User.ROLE_TRAINER, User.ROLE_STUDENT})
    write_roles = frozenset({User.ROLE_ADMIN, User.ROLE_TRAINER})


class IsAdminOrStudentReadOnly(RolePermission):
    message = 'Only admins can change this endpoint.'
    read_roles = frozenset({User.ROLE_ADMIN, User.ROLE_STUDENT})
    write_roles = frozenset({User.ROLE_ADMIN})


class IsAdminCounsellorOrStudentRead(RolePermission):
    message = 'Only admins and counsellors can change this endpoint.'
    read_roles = frozenset({User.ROLE_ADMIN, User.ROLE_COUNSELLOR, User.ROLE_STUDENT})
    write_roles = frozenset({User.ROLE_ADMIN, User.ROLE_COUNSELLOR})


class IsAuthenticatedCourseRead(RolePermission):
    message = 'Only admins can change course information.'
    read_roles = frozenset({
        User.ROLE_ADMIN,
        User.ROLE_COUNSELLOR,
        User.ROLE_TRAINER,
        User.ROLE_STUDENT,
    })
    write_roles = frozenset({User.ROLE_ADMIN})
    allow_anonymous_read = True


class IsTrainer(BasePermission):
    message = 'Only trainers can access this endpoint.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.ROLE_TRAINER)


class IsStudent(BasePermission):
    message = 'Only students can access this endpoint.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.ROLE_STUDENT)
