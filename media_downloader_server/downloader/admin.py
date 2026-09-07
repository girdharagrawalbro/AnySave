from django.contrib import admin

from .models import DownloadJob


@admin.register(DownloadJob)
class DownloadJobAdmin(admin.ModelAdmin):
    list_display = ('id', 'platform', 'status', 'title', 'progress_percent', 'created_at')
    list_filter = ('platform', 'status')
    search_fields = ('title', 'url')
    readonly_fields = ('created_at', 'updated_at')
