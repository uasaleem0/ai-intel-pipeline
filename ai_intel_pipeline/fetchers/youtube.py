from __future__ import annotations

from typing import Dict, List, Optional
from datetime import datetime
import feedparser
from yt_dlp import YoutubeDL
from ..utils.links import extract_links


def fetch_youtube_channel_rss(channel_id: str, source_name: str | None = None) -> List[Dict]:
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    d = feedparser.parse(url)
    items: List[Dict] = []
    for e in d.entries[:5]:
        # YouTube RSS dates are in updated or published
        published = None
        if hasattr(e, "published"):
            try:
                published = datetime(*e.published_parsed[:6]).isoformat() + "Z"
            except Exception:
                published = None
        yt_url = e.get("link")
        items.append(
            {
                "title": e.get("title"),
                "url": yt_url,
                "source_type": "youtube",
                "source_name": source_name or d.feed.get("title", "YouTube"),
                "published_at": published,
                "type": "talk",
                "links": {},
                "raw_description": getattr(e, "summary", ""),
            }
        )
    return items


def fetch_youtube_search_rss(query: str) -> List[Dict]:
    """Search via RSS to avoid API keys. Returns recent results for a query."""
    url = f"https://www.youtube.com/feeds/videos.xml?search_query={query.replace(' ', '+')}"
    d = feedparser.parse(url)
    items: List[Dict] = []
    for e in d.entries[:10]:
        published = None
        if hasattr(e, "published"):
            try:
                published = datetime(*e.published_parsed[:6]).isoformat() + "Z"
            except Exception:
                published = None
        yt_url = e.get("link")
        items.append(
            {
                "title": e.get("title"),
                "url": yt_url,
                "source_type": "youtube",
                "source_name": "YouTube Search",
                "published_at": published,
                "type": "talk",
                "links": {},
                "raw_description": getattr(e, "summary", ""),
            }
        )
    return items


def enrich_youtube_metadata(url: str) -> Dict:
    """Use yt-dlp to grab full description and basic metadata without download."""
    ydl_opts = {"quiet": True, "skip_download": True}
    info: Dict = {}
    try:
        with YoutubeDL(ydl_opts) as ydl:
            res = ydl.extract_info(url, download=False)
            desc = res.get("description") or ""
            chapters = res.get("chapters") or []
            info = {
                "description": desc,
                "chapters": chapters,
                "uploader": res.get("uploader"),
                "duration": res.get("duration"),
            }
    except Exception:
        info = {}
    # Extract links (GitHub repos, URLs)
    links = extract_links(info.get("description", "")) if info else {"repos": [], "urls": []}
    info["extracted_links"] = links
    return info

