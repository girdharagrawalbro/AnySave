"""Terabox (and similar direct-file hosts) don't expose a stable public
API — the real download URL has to be scraped from the share page, and
the scraping approach breaks whenever the host changes its frontend.
This is a stub to keep EXTRACTOR_MAP complete; implement _resolve_direct_url
against the current terabox share-page structure when you actually need it.
"""

from .base import ExtractorError

PLATFORM = 'terabox'


def resolve(url):
    raise ExtractorError('Terabox extractor not implemented yet')


def download(url, quality=None, progress_callback=None):
    raise ExtractorError('Terabox extractor not implemented yet')
