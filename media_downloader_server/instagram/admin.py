from django.contrib import admin

from .models import IGSession


@admin.register(IGSession)
class IGSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'created_at', 'last_used')
    readonly_fields = ('created_at', 'last_used')
