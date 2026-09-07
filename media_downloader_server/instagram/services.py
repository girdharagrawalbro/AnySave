"""Thin wrapper around instaloader. Session is authenticated once via
login() and the session cookies are encrypted (Fernet) and stored in
IGSession so subsequent requests reuse it instead of logging in again
-- repeated logins are what tend to trigger IG checkpoints/2FA.
"""

import io
import time
from datetime import date

import instaloader
import requests
from cryptography.fernet import Fernet
from django.conf import settings

from .models import IGSession

_RATE_LIMIT_DELAY_SECONDS = 2


def _fernet():
    if not settings.SESSION_ENCRYPTION_KEY:
        raise RuntimeError('SESSION_ENCRYPTION_KEY is not configured in .env')
    return Fernet(settings.SESSION_ENCRYPTION_KEY.encode())


def login(username, password):
    loader = instaloader.Instaloader()
    loader.login(username, password)

    buffer = io.BytesIO()
    loader.context.save_session_to_file(buffer)
    encrypted = _fernet().encrypt(buffer.getvalue())

    IGSession.objects.update_or_create(
        username=username,
        defaults={'session_data_encrypted': encrypted},
    )
    return loader


def login_with_cookies(cookies):
    """Build a session from cookies captured in an in-app WebView login
    (see instagram/views.py:LoginWithCookiesView) instead of taking a
    password directly -- lets the real Instagram login page handle 2FA
    and checkpoints itself.
    """
    loader = instaloader.Instaloader()
    session = requests.Session()
    session.cookies.update(cookies)
    session.headers.update(loader.context._default_http_header())
    if 'csrftoken' in cookies:
        session.headers.update({'X-CSRFToken': cookies['csrftoken']})
    loader.context._session = session

    username = loader.context.test_login()
    if not username:
        raise ValueError('Could not verify an Instagram session from those cookies')
    loader.context.username = username

    buffer = io.BytesIO()
    loader.context.save_session_to_file(buffer)
    encrypted = _fernet().encrypt(buffer.getvalue())

    IGSession.objects.update_or_create(
        username=username,
        defaults={'session_data_encrypted': encrypted},
    )
    return username


def get_loader():
    session = IGSession.objects.order_by('-last_used').first()
    if session is None:
        return None

    decrypted = _fernet().decrypt(bytes(session.session_data_encrypted))
    loader = instaloader.Instaloader()
    loader.context.load_session_from_file(session.username, io.BytesIO(decrypted))

    session.save(update_fields=['last_used'])
    return loader


def list_following(loader):
    profile = instaloader.Profile.from_username(loader.context, loader.context.username)
    result = []
    for followee in profile.get_followees():
        result.append({'username': followee.username, 'full_name': followee.full_name})
        time.sleep(_RATE_LIMIT_DELAY_SECONDS)
    return result


def list_profile_posts(loader, username, limit=30):
    profile = instaloader.Profile.from_username(loader.context, username)
    result = []
    for post in profile.get_posts():
        result.append({
            'shortcode': post.shortcode,
            'caption': (post.caption or '')[:200],
            'is_video': post.is_video,
            'thumbnail_url': post.url,
            'media_url': post.video_url if post.is_video else post.url,
        })
        if len(result) >= limit:
            break
        time.sleep(_RATE_LIMIT_DELAY_SECONDS)
    return result


_MEDIA_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.mp4')


def save_post(loader, shortcode):
    post = instaloader.Post.from_shortcode(loader.context, shortcode)
    target = settings.DOWNLOADS_ROOT / 'instagram' / date.today().isoformat()
    target.mkdir(parents=True, exist_ok=True)
    loader.dirname_pattern = str(target)
    loader.download_post(post, target=shortcode)

    # With no {target}/{profile} placeholder in dirname_pattern, instaloader
    # names files "{target}_{identifier}_{suffix}.{ext}" -- since we pass
    # target=shortcode, the saved media is reliably "{shortcode}_*".
    media_files = sorted(
        p for p in target.glob(f'{shortcode}_*') if p.suffix.lower() in _MEDIA_EXTENSIONS
    )
    if not media_files:
        raise RuntimeError(f'Instagram post {shortcode} downloaded but no media file was found')

    return {'title': (post.caption or shortcode)[:200], 'file_path': str(media_files[0])}
