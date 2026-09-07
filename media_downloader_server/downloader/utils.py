import os
import re
import shutil
from datetime import date
from urllib.parse import urlparse

from django.conf import settings

_PLATFORM_HOSTS = {
    'youtube': ('youtube.com', 'youtu.be'),
    'spotify': ('open.spotify.com',),
    'instagram': ('instagram.com',),
    'terabox': ('terabox.com', 'teraboxapp.com', '1024terabox.com'),
}


def detect_platform(url):
    host = urlparse(url).netloc.lower()
    for platform, hosts in _PLATFORM_HOSTS.items():
        if any(h in host for h in hosts):
            return platform
    return 'generic'


def sanitize_filename(name, max_length=150):
    name = re.sub(r'[\\/*?:"<>|]', '', name).strip()
    name = re.sub(r'\s+', ' ', name)
    return name[:max_length] or 'untitled'


def platform_download_dir(platform):
    target = settings.DOWNLOADS_ROOT / platform / date.today().isoformat()
    target.mkdir(parents=True, exist_ok=True)
    return target


def remove_download(path):
    """Delete a job's file_path, whether it's a file (the normal case) or
    a leftover directory (older Instagram jobs saved the folder itself).
    """
    if not path or not os.path.exists(path):
        return
    if os.path.isdir(path):
        shutil.rmtree(path)
    else:
        os.remove(path)


def ytdlp_auth_opts():
    """Cookie option to pass into yt-dlp's YoutubeDL(opts) to avoid
    YouTube's "Sign in to confirm you're not a bot" on server IPs.
    """
    if settings.YTDLP_COOKIES_FROM_BROWSER:
        return {'cookiesfrombrowser': (settings.YTDLP_COOKIES_FROM_BROWSER,)}
    return {}
