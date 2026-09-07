from rest_framework.response import Response
from rest_framework.views import APIView

from downloader.models import DownloadJob
from downloader.serializers import DownloadJobSerializer
from downloader.utils import remove_download


class LibraryView(APIView):
    def get(self, request):
        files = DownloadJob.objects.filter(status='done')

        platform = request.query_params.get('platform')
        if platform:
            files = files.filter(platform=platform)

        date_str = request.query_params.get('date')
        if date_str:
            files = files.filter(created_at__date=date_str)

        return Response(DownloadJobSerializer(files, many=True).data)


class LibraryItemView(APIView):
    def delete(self, request, item_id):
        try:
            job = DownloadJob.objects.get(id=item_id, status='done')
        except DownloadJob.DoesNotExist:
            return Response({'error': 'not found'}, status=404)

        remove_download(job.file_path)
        job.delete()
        return Response(status=204)
