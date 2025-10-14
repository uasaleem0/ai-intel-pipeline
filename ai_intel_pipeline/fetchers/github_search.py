from __future__ import annotations

from typing import Dict, List
import os
import requests


def search_innovative_repos(queries: List[str], per_query: int = 3) -> List[Dict]:
    """Search GitHub repos focusing on AI applications/agents/workflows.
    Returns normalized candidates (type 'application').
    """
    token = os.getenv("GH_TOKEN")
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    items: List[Dict] = []
    for q in queries:
        # boost by topic keywords
        query = f"{q} in:name,description,readme stars:>20 pushed:>=2024-01-01"
        params = {"q": query, "sort": "updated", "order": "desc", "per_page": per_query}
        try:
            r = requests.get("https://api.github.com/search/repositories", headers=headers, params=params, timeout=20)
            r.raise_for_status()
            data = r.json()
            for repo in data.get("items", []):
                items.append(
                    {
                        "title": repo.get("full_name"),
                        "url": repo.get("html_url"),
                        "source_type": "github",
                        "source_name": repo.get("full_name"),
                        "published_at": repo.get("updated_at"),
                        "type": "application",
                        "links": {"repo": repo.get("html_url")},
                        "raw_description": repo.get("description") or "",
                    }
                )
        except Exception:
            continue
    return items

