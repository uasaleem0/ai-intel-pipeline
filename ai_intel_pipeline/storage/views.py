from __future__ import annotations

import json
from pathlib import Path
import re
from typing import Dict, List


class Views:
    def __init__(self, root: Path):
        self.root = root
        (self.root / "views" / "pillars").mkdir(parents=True, exist_ok=True)

    def _pillar_path(self, pillar_slug: str) -> Path:
        # sanitize slug: lowercase, replace non-alphanum with '-'
        slug = pillar_slug.lower()
        slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
        return self.root / "views" / "pillars" / f"{slug}.json"

    def add_item_to_pillars(self, pillars: List[str], item: Dict):
        for pillar in pillars:
            slug = pillar.lower().replace(" ", "-")
            p = self._pillar_path(slug)
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                data = {"pillar": pillar, "items": []}
            # Deduplicate by item id
            ids = {x.get("id") for x in data.get("items", [])}
            if item.get("id") not in ids:
                data.setdefault("items", []).append(
                    {
                        "id": item.get("id"),
                        "title": item.get("title"),
                        "url": item.get("canonical_url"),
                        "date": item.get("published_at"),
                    }
                )
            p.write_text(json.dumps(data, indent=2), encoding="utf-8")
