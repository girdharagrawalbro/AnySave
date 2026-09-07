from django.db import models


class DownloadJob(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('resolving', 'Resolving'),
        ('downloading', 'Downloading'),
        ('processing', 'Processing'),
        ('done', 'Done'),
        ('failed', 'Failed'),
    ]

    # Not enforced via `choices` — the generic yt-dlp extractor covers
    # 1000+ sites we don't want to enumerate here. Known values used to
    # pick an extractor: youtube, spotify, instagram, terabox, generic.
    PLATFORM_CHOICES = [
        ('youtube', 'YouTube'),
        ('spotify', 'Spotify'),
        ('instagram', 'Instagram'),
        ('terabox', 'Terabox'),
        ('generic', 'Generic (yt-dlp)'),
    ]

    url = models.URLField(max_length=1000)
    platform = models.CharField(max_length=30)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    title = models.CharField(max_length=255, blank=True)
    thumbnail_url = models.URLField(max_length=1000, blank=True)
    file_path = models.CharField(max_length=500, blank=True)
    file_size_bytes = models.BigIntegerField(null=True, blank=True)
    quality = models.CharField(max_length=50, blank=True)
    progress_percent = models.IntegerField(default=0)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.platform}] {self.title or self.url} ({self.status})'
