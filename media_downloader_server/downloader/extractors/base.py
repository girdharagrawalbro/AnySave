class ExtractorError(Exception):
    """Raised when metadata resolution or download fails for a URL."""


class Extractor:
    """Interface every platform extractor implements.

    resolve() must not download anything — it only fetches metadata
    (title, thumbnail, available qualities) so the app can preview a
    link before committing to a download.
    """

    def resolve(self, url):
        raise NotImplementedError

    def download(self, url, quality=None, progress_callback=None):
        """Returns a dict with at least: file_path, title, size."""
        raise NotImplementedError
