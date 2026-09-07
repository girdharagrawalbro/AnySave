"""Spotify tracks are DRM-protected — there is no legitimate way to pull
the actual Spotify audio stream. Instead we use the Spotify Web API for
metadata (title/artist/artwork), then search + download the matching
audio from YouTube via yt-dlp. This is the same approach tools like
spotdl use. Quality is whatever the best YouTube match offers, not the
original Spotify stream.
"""

import re

import spotipy
import yt_dlp
from django.conf import settings
from spotipy.oauth2 import SpotifyClientCredentials

from ..utils import platform_download_dir, sanitize_filename, ytdlp_auth_opts
from .base import ExtractorError

PLATFORM = 'spotify'


def _client():
    if not settings.SPOTIFY_CLIENT_ID or not settings.SPOTIFY_CLIENT_SECRET:
        raise ExtractorError(
            'Spotify API credentials not configured '
            '(set SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in .env)'
        )
    auth = SpotifyClientCredentials(
        client_id=settings.SPOTIFY_CLIENT_ID,
        client_secret=settings.SPOTIFY_CLIENT_SECRET,
    )
    return spotipy.Spotify(client_credentials_manager=auth)


def _track_id(url):
    match = re.search(r'track/([a-zA-Z0-9]+)', url)
    if not match:
        raise ExtractorError('Only Spotify track URLs are supported')
    return match.group(1)


def _track_title(track):
    artists = ', '.join(a['name'] for a in track['artists'])
    return f"{artists} - {track['name']}"


def resolve(url):
    track = _client().track(_track_id(url))
    return {
        'title': _track_title(track),
        'thumbnail_url': track['album']['images'][0]['url'] if track['album']['images'] else '',
        'duration': track['duration_ms'] // 1000,
        'qualities': ['audio-only'],
    }


def download(url, quality=None, progress_callback=None):
    track = _client().track(_track_id(url))
    title = _track_title(track)
    out_dir = platform_download_dir(PLATFORM)

    def hook(d):
        if progress_callback and d.get('status') == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate')
            if total:
                progress_callback(int(d.get('downloaded_bytes', 0) / total * 100))

    opts = {
        'format': 'bestaudio/best',
        'outtmpl': str(out_dir / f'{sanitize_filename(title)}.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
        'default_search': 'ytsearch1',
        'noplaylist': True,
        'progress_hooks': [hook] if progress_callback else [],
        'postprocessors': [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3'}],
        **ytdlp_auth_opts(),
    }

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.extract_info(f'{title} audio', download=True)
    except yt_dlp.utils.DownloadError as exc:
        raise ExtractorError(str(exc)) from exc

    if progress_callback:
        progress_callback(100)

    return {
        'file_path': str(out_dir / f'{sanitize_filename(title)}.mp3'),
        'title': title,
        'size': None,
    }
