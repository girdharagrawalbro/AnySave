import threading

from rest_framework.response import Response
from rest_framework.views import APIView

from downloader.models import DownloadJob

from . import services
from .models import IGSession


class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({'error': 'username and password are required'}, status=400)

        try:
            services.login(username, password)
        except Exception as exc:  # noqa: BLE001 - instaloader raises many distinct exception types
            return Response({'error': str(exc)}, status=422)

        return Response({'status': 'logged_in', 'username': username})


class LoginWithCookiesView(APIView):
    """Accepts cookies captured from an in-app WebView login against the
    real instagram.com login page, instead of a username/password body.
    """

    def post(self, request):
        cookies = request.data.get('cookies')
        if not isinstance(cookies, dict) or 'sessionid' not in cookies:
            return Response({'error': 'cookies (including sessionid) are required'}, status=400)

        try:
            username = services.login_with_cookies(cookies)
        except Exception as exc:  # noqa: BLE001 - instaloader raises many distinct exception types
            return Response({'error': str(exc)}, status=422)

        return Response({'status': 'logged_in', 'username': username})


class LogoutView(APIView):
    def post(self, request):
        IGSession.objects.all().delete()
        return Response({'status': 'logged_out'})


class StatusView(APIView):
    def get(self, request):
        session = IGSession.objects.order_by('-last_used').first()
        if session is None:
            return Response({'logged_in': False})
        return Response({'logged_in': True, 'username': session.username, 'last_used': session.last_used})


class FollowingView(APIView):
    def get(self, request):
        loader = services.get_loader()
        if loader is None:
            return Response({'error': 'not logged in'}, status=401)
        return Response(services.list_following(loader))


class ProfilePostsView(APIView):
    def get(self, request, username):
        loader = services.get_loader()
        if loader is None:
            return Response({'error': 'not logged in'}, status=401)
        return Response(services.list_profile_posts(loader, username))


class SaveView(APIView):
    def post(self, request):
        shortcode = request.data.get('shortcode')
        if not shortcode:
            return Response({'error': 'shortcode is required'}, status=400)

        loader = services.get_loader()
        if loader is None:
            return Response({'error': 'not logged in'}, status=401)

        job = DownloadJob.objects.create(
            url=f'https://instagram.com/p/{shortcode}/',
            platform='instagram',
            status='pending',
        )
        thread = threading.Thread(target=_run_save, args=(job.id, loader, shortcode), daemon=True)
        thread.start()
        return Response({'job_id': job.id}, status=201)


def _run_save(job_id, loader, shortcode):
    job = DownloadJob.objects.get(id=job_id)
    job.status = 'downloading'
    job.save(update_fields=['status'])
    try:
        result = services.save_post(loader, shortcode)
        job.title = result['title']
        job.file_path = result['file_path']
        job.status = 'done'
        job.progress_percent = 100
    except Exception as exc:  # noqa: BLE001 - background thread, must not crash silently
        job.status = 'failed'
        job.error = str(exc)
    job.save()
