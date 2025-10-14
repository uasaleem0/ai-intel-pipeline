from __future__ import annotations

from typing import Dict, List
import os
import requests


def fetch_github_releases(repo: str) -> List[Dict]:
    """
    Fetch latest releases for a public repo. Works unauthenticated (rate-limited) or with GH_TOKEN.
    Returns a list of normalized candidate dicts.
    """
    token = os.getenv("GH_TOKEN")
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"https://api.github.com/repos/{repo}/releases"
    try:
        r = requests.get(url, headers=headers, timeout=15)
        r.raise_for_status()
        releases = r.json()
    except Exception:
        return []
    items: List[Dict] = []
    for rel in releases[:5]:
        items.append(
            {
                "title": rel.get("name") or rel.get("tag_name"),
                "url": rel.get("html_url"),
                "source_type": "github",
                "source_name": repo,
                "published_at": rel.get("published_at"),
                "type": "release",
                "links": {"repo": f"https://github.com/{repo}"},
                "raw_description": rel.get("body", ""),
            }
        )
    return items

