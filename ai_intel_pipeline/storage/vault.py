from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Tuple


class Vault:
    def __init__(self, root: Path):
        self.root = root
        (self.root).mkdir(parents=True, exist_ok=True)
        (self.root / "items").mkdir(parents=True, exist_ok=True)

    def create_item_folder(self, dt: datetime | None = None) -> Tuple[str, Path]:
        dt = dt or datetime.utcnow()
        month = dt.strftime("%Y-%m")
        item_id = dt.strftime("%Y%m%d-%H%M-") + ("%06d" % (dt.microsecond % 1000000))
        dir_path = self.root / "items" / month / item_id
        dir_path.mkdir(parents=True, exist_ok=True)
        return item_id, dir_path

    def init_item_json(
        self,
        item_id: str,
        title: str,
        canonical_url: str,
        source_type: str,
        source_name: str,
        published_at: str | None,
        content_type: str | None,
        links: Dict | None = None,
    ) -> Dict:
        data = {
            "id": item_id,
            "title": title or "",
            "canonical_url": canonical_url or "",
            "source_type": source_type or "",
            "source_name": source_name or "",
            "published_at": published_at,
            "type": content_type or "",
            "status": "ingested",
            "route": "weekly",
            "scores": {
                "validity_conf": 0.0,
                "credibility": 0.0,
                "novelty": 0.0,
                "relevance": 0.0,
                "actionability": 0.0,
                "overall": 0.0,
            },
            "links": links or {},
        }
        # Find directory path
        month = item_id[:4] + "-" + item_id[4:6]
        path = self.root / "items" / month / item_id / "item.json"
        self.write_json(path, data)
        return data

    def write_json(self, path: Path, data: Dict):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    def write_text(self, path: Path, text: str):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def update_scores(self, item_json_path: Path, scores: Dict[str, float]):
        try:
            data = json.loads(item_json_path.read_text(encoding="utf-8"))
        except Exception:
            return
        data.setdefault("scores", {}).update(scores)
        self.write_json(item_json_path, data)

    def update_fields(self, item_json_path: Path, fields: Dict):
        try:
            data = json.loads(item_json_path.read_text(encoding="utf-8"))
        except Exception:
            return
        data.update(fields)
        self.write_json(item_json_path, data)
