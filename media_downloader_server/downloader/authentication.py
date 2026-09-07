from django.conf import settings
from rest_framework.permissions import BasePermission


class HasAPIKey(BasePermission):
    """Personal single-user server: require X-API-Key on every request.

    If settings.API_KEY is empty (no .env configured yet), access is
    allowed so the server is usable during initial local setup.
    """

    def has_permission(self, request, view):
        if not settings.API_KEY:
            return True
        return request.headers.get('X-API-Key') == settings.API_KEY
