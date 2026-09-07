import threading

import requests
from django.http import StreamingHttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView

from .extractors import generic, spotify, terabox, youtube
from .extractors.base import ExtractorError
from .models import DownloadJob
from .serializers import DownloadJobSerializer
from .utils import detect_platform, remove_download

EXTRACTOR_MAP = {
    'youtube': youtube,
    # Public Instagram posts/reels only -- yt-dlp's Instagram extractor
    # works without login for public content, same code path as 'generic'.
    # Private/followed-account content still needs the login+browse flow
    # under /api/instagram/ (see instagram app), which the RN app falls
    # back to automatically when this fails.
    'instagram': generic,
    'spotify': spotify,
    'terabox': terabox,
    'generic': generic,
}


class ResolveView(APIView):
    """Fetch metadata for a URL without downloading anything."""

    def post(self, request):
        url = request.data.get('url')
        if not url:
            return Response({'error': 'url is required'}, status=400)

        platform = detect_platform(url)
        extractor = EXTRACTOR_MAP.get(platform)
        if extractor is None:
            return Response(
                {'error': f'{platform} is not supported here — use the Instagram screen instead'},
                status=400,
            )

        try:
            info = extractor.resolve(url)
        except ExtractorError as exc:
            return Response({'error': str(exc)}, status=422)

        return Response({'platform': platform, **info})


class StreamView(APIView):
    """Proxies a direct, short-lived media URL for in-app preview
    playback, so the RN video/audio player never has to deal with the
    per-site headers (referer, cookies, user-agent) yt-dlp resolved.
    """

    def get(self, request):
        url = request.query_params.get('url')
        if not url:
            return Response({'error': 'url is required'}, status=400)

        platform = detect_platform(url)
        extractor = EXTRACTOR_MAP.get(platform)
        if extractor is None or not hasattr(extractor, 'stream_info'):
            return Response({'error': f'no preview available for {platform}'}, status=400)

        try:
            stream = extractor.stream_info(url, quality=request.query_params.get('quality'))
        except ExtractorError as exc:
            return Response({'error': str(exc)}, status=422)

        headers = dict(stream.get('http_headers') or {})
        range_header = request.headers.get('Range')
        if range_header:
            headers['Range'] = range_header

        upstream = requests.get(stream['url'], headers=headers, stream=True, timeout=15)

        response = StreamingHttpResponse(
            upstream.iter_content(chunk_size=64 * 1024),
            status=upstream.status_code,
            content_type=upstream.headers.get('Content-Type', 'application/octet-stream'),
        )
        for header in ('Content-Length', 'Content-Range', 'Accept-Ranges'):
            if header in upstream.headers:
                response[header] = upstream.headers[header]
        if not response.has_header('Accept-Ranges'):
            response['Accept-Ranges'] = 'bytes'
        return response


class StartDownloadView(APIView):
    def post(self, request):
        url = request.data.get('url')
        if not url:
            return Response({'error': 'url is required'}, status=400)

        platform = detect_platform(url)
        if platform not in EXTRACTOR_MAP:
            return Response(
                {'error': f'{platform} is not supported here — use the Instagram screen instead'},
                status=400,
            )

        quality = request.data.get('quality', '')
        job = DownloadJob.objects.create(url=url, platform=platform, quality=quality, status='pending')

        thread = threading.Thread(target=_run_job, args=(job.id, quality), daemon=True)
        thread.start()

        return Response(DownloadJobSerializer(job).data, status=201)


class JobListView(APIView):
    def get(self, request):
        jobs = DownloadJob.objects.all()
        return Response(DownloadJobSerializer(jobs, many=True).data)


class JobStatusView(APIView):
    def get(self, request, job_id):
        try:
            job = DownloadJob.objects.get(id=job_id)
        except DownloadJob.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        return Response(DownloadJobSerializer(job).data)

    def delete(self, request, job_id):
        try:
            job = DownloadJob.objects.get(id=job_id)
        except DownloadJob.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        remove_download(job.file_path)
        job.delete()
        return Response(status=204)


def _run_job(job_id, quality):
    job = DownloadJob.objects.get(id=job_id)
    job.status = 'downloading'
    job.save(update_fields=['status'])

    try:
        extractor = EXTRACTOR_MAP[job.platform]
        result = extractor.download(
            job.url,
            quality=quality or None,
            progress_callback=lambda pct: _update_progress(job_id, pct),
        )
        job.file_path = result['file_path']
        job.title = result.get('title', '')
        job.file_size_bytes = result.get('size')
        job.status = 'done'
        job.progress_percent = 100
    except ExtractorError as exc:
        job.status = 'failed'
        job.error = str(exc)
    except Exception as exc:  # noqa: BLE001 - background thread, must not crash silently
        job.status = 'failed'
        job.error = str(exc)
    job.save()


def _update_progress(job_id, pct):
    DownloadJob.objects.filter(id=job_id).update(progress_percent=pct, status='downloading')
