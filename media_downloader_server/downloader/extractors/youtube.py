import yt_dlp

from ..utils import platform_download_dir, sanitize_filename, ytdlp_auth_opts
from .base import ExtractorError

PLATFORM = 'youtube'


def resolve(url):
    opts = {'quiet': True, 'no_warnings': True, 'skip_download': True, **ytdlp_auth_opts()}
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as exc:
        raise ExtractorError(str(exc)) from exc

    formats = info.get('formats') or []
    qualities = sorted(
        {f['format_note'] for f in formats if f.get('vcodec') != 'none' and f.get('format_note')},
        reverse=True,
    )
    return {
        'title': info.get('title', ''),
        'thumbnail_url': info.get('thumbnail', ''),
        'duration': info.get('duration'),
        'qualities': qualities or ['best'],
    }


def stream_info(url, quality=None):
    """Resolve a direct, short-lived media URL (+ any headers it needs)
    for in-app preview playback, without downloading anything server-side.

    YouTube rarely serves a single muxed audio+video format anymore (it's
    split into separate DASH video-only/audio-only tracks, which only the
    real download step can merge via ffmpeg). So preview quality degrades
    gracefully: audio-only request -> bestaudio; otherwise try a genuine
    muxed stream first, then fall back to a silent video-only preview.
    """
    if quality == 'audio-only':
        format_specs = ['bestaudio']
    else:
        format_specs = ['best[acodec!=none][vcodec!=none]', 'bestvideo', 'best']

    opts_base = {'quiet': True, 'no_warnings': True, 'skip_download': True, **ytdlp_auth_opts()}
    last_error = None
    for format_spec in format_specs:
        try:
            with yt_dlp.YoutubeDL({**opts_base, 'format': format_spec}) as ydl:
                info = ydl.extract_info(url, download=False)
        except yt_dlp.utils.DownloadError as exc:
            last_error = exc
            continue

        chosen = info['requested_downloads'][0] if 'requested_downloads' in info else info
        return {'url': chosen['url'], 'http_headers': chosen.get('http_headers') or {}}

    raise ExtractorError(str(last_error) if last_error else 'No previewable stream found')


def download(url, quality=None, progress_callback=None):
    out_dir = platform_download_dir(PLATFORM)
    format_spec = 'bestaudio/best' if quality == 'audio-only' else (
        f'bestvideo[height<={quality.rstrip("p")}]+bestaudio/best' if quality and quality.endswith('p')
        else 'bestvideo+bestaudio/best'
    )

    def hook(d):
        if progress_callback and d.get('status') == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate')
            if total:
                progress_callback(int(d.get('downloaded_bytes', 0) / total * 100))

    opts = {
        'format': format_spec,
        'outtmpl': str(out_dir / '%(title).150s.%(ext)s'),
        'merge_output_format': 'mp4',
        'quiet': True,
        'no_warnings': True,
        'progress_hooks': [hook] if progress_callback else [],
        'restrictfilenames': False,
        **ytdlp_auth_opts(),
    }
    if quality == 'audio-only':
        opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
        }]

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            file_path = ydl.prepare_filename(info)
            if quality == 'audio-only':
                file_path = str(out_dir / f"{sanitize_filename(info.get('title', 'untitled'))}.mp3")
    except yt_dlp.utils.DownloadError as exc:
        raise ExtractorError(str(exc)) from exc

    if progress_callback:
        progress_callback(100)

    return {
        'file_path': file_path,
        'title': info.get('title', ''),
        'size': info.get('filesize') or info.get('filesize_approx'),
    }
