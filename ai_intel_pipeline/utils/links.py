from __future__ import annotations

import re
from typing import Dict, List


GITHUB_RE = re.compile(r"https?://(?:www\.)?github\.com/([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)(?:/|\b)")
URL_RE = re.compile(r"https?://[\w./?#%&=+\-_:]+", re.I)


def extract_links(text: str) -> Dict[str, List[str]]:
    if not text:
        return {"repos": [], "urls": []}
    urls = URL_RE.findall(text)
    repos = []
    for u in urls:
        m = GITHUB_RE.search(u)
        if m:
            repos.append(m.group(1))
    # Deduplicate
    repos = sorted(list(dict.fromkeys(repos)))
    urls = sorted(list(dict.fromkeys(urls)))
    return {"repos": repos, "urls": urls}

