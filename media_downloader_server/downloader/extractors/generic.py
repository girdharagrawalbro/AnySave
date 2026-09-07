"""Fallback extractor for any of the 1000+ sites yt-dlp supports out of
the box that don't need platform-specific handling (SoundCloud, Vimeo,
Twitter/X, Reddit, TikTok, etc.)."""

import yt_dlp

from ..utils import platform_download_dir, ytdlp_auth_opts
from .base import ExtractorError

PLATFORM = 'generic'


def resolve(url):
    opts = {'quiet': True, 'no_warnings': True, 'skip_download': True, **ytdlp_auth_opts()}
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as exc:
        raise ExtractorError(str(exc)) from exc

    return {
        'title': info.get('title', ''),
        'thumbnail_url': info.get('thumbnail', ''),
        'duration': info.get('duration'),
        'qualities': ['best'],
    }


def stream_info(url, quality=None):
    opts = {'quiet': True, 'no_warnings': True, 'skip_download': True, 'format': 'best', **ytdlp_auth_opts()}
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as exc:
        raise ExtractorError(str(exc)) from exc

    chosen = info['requested_downloads'][0] if 'requested_downloads' in info else info
    return {'url': chosen['url'], 'http_headers': chosen.get('http_headers') or {}}


def download(url, quality=None, progress_callback=None):
    out_dir = platform_download_dir(PLATFORM)

    def hook(d):
        if progress_callback and d.get('status') == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate')
            if total:
                progress_callback(int(d.get('downloaded_bytes', 0) / total * 100))

    opts = {
        'format': 'best',
        'outtmpl': str(out_dir / '%(title).150s.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
        'progress_hooks': [hook] if progress_callback else [],
        **ytdlp_auth_opts(),
    }

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            file_path = ydl.prepare_filename(info)
    except yt_dlp.utils.DownloadError as exc:
        raise ExtractorError(str(exc)) from exc

    if progress_callback:
        progress_callback(100)

    return {
        'file_path': file_path,
        'title': info.get('title', ''),
        'size': info.get('filesize') or info.get('filesize_approx'),
    }
