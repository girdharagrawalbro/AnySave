from django.db import models


class IGSession(models.Model):
    username = models.CharField(max_length=150)
    session_data_encrypted = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username
