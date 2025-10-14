from __future__ import annotations

from typing import Dict, List
from datetime import datetime
import feedparser


def fetch_feed_items(url: str, source_name: str | None = None) -> List[Dict]:
    d = feedparser.parse(url)
    items: List[Dict] = []
    for e in d.entries[:10]:
        published = None
        if hasattr(e, "published"):
            try:
                published = datetime(*e.published_parsed[:6]).isoformat() + "Z"
            except Exception:
                published = None
        items.append(
            {
                "title": e.get("title"),
                "url": e.get("link"),
                "source_type": "vendor",
                "source_name": source_name or d.feed.get("title", "feed"),
                "published_at": published,
                "type": "blog",
                "links": {},
                "raw_description": e.get("summary", ""),
            }
        )
    return items

