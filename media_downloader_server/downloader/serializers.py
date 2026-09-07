from django.conf import settings
from rest_framework import serializers

from .models import DownloadJob


class DownloadJobSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = DownloadJob
        fields = [
            'id', 'url', 'platform', 'status', 'title', 'thumbnail_url',
            'file_path', 'file_url', 'file_size_bytes', 'quality', 'progress_percent',
            'error', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_file_url(self, obj):
        if not obj.file_path:
            return None
        try:
            relative = str(obj.file_path).removeprefix(str(settings.MEDIA_ROOT)).lstrip('/')
        except ValueError:
            return None
        return f'{settings.MEDIA_URL}{relative}'
