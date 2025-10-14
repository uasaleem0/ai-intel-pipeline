from __future__ import annotations

from typing import Dict, Optional
import base64
import os
import requests


def _gh_headers():
    token = os.getenv("GH_TOKEN")
    h = {"Accept": "application/vnd.github+json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def fetch_readme(owner_repo: str) -> Optional[str]:
    url = f"https://api.github.com/repos/{owner_repo}/readme"
    try:
        r = requests.get(url, headers=_gh_headers(), timeout=15)
        if r.status_code == 200:
            data = r.json()
            content = data.get("content")
            if content:
                return base64.b64decode(content).decode("utf-8", errors="ignore")
    except Exception:
        return None
    return None


def fetch_changelog(owner_repo: str) -> Optional[str]:
    # Try common changelog filenames
    candidates = [
        "CHANGELOG.md",
        "ChangeLog.md",
        "changelog.md",
        "CHANGES.md",
    ]
    for name in candidates:
        url = f"https://api.github.com/repos/{owner_repo}/contents/{name}"
        try:
            r = requests.get(url, headers=_gh_headers(), timeout=15)
            if r.status_code == 200:
                data = r.json()
                content = data.get("content")
                if content:
                    return base64.b64decode(content).decode("utf-8", errors="ignore")
        except Exception:
            continue
    return None

