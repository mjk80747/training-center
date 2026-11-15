from django.contrib import admin

from .models import LoginActivity, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'is_active', 'last_login')
    search_fields = ('email', 'full_name')
    list_filter = ('role', 'is_active')


@admin.register(LoginActivity)
class LoginActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'ip_address', 'success', 'timestamp')
    list_filter = ('success',)
    search_fields = ('user__email', 'ip_address')
