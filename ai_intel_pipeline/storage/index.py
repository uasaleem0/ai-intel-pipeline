from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, List
from datetime import datetime, timedelta


CSV_HEADERS = [
    "item_id",
    "title",
    "url",
    "source",
    "type",
    "date",
    "validity",
    "credibility",
    "relevance",
    "actionability",
    "novelty",
    "overall",
    "route",
    "drive_path",
]


class Index:
    def __init__(self, index_path: Path):
        self.path = index_path
        if not self.path.exists():
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with self.path.open("w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(CSV_HEADERS)

    def has_url(self, url: str) -> bool:
        with self.path.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("url") == url:
                    return True
        return False

    def add(
        self,
        item_id: str,
        title: str,
        url: str,
        source: str,
        ctype: str,
        date: str | None,
        scores: Dict[str, float],
        route: str,
        drive_path: str,
    ) -> None:
        row = [
            item_id,
            title or "",
            url or "",
            source or "",
            ctype or "",
            date or "",
            f"{scores.get('validity_conf', 0.0):.3f}",
            f"{scores.get('credibility', 0.0):.3f}",
            f"{scores.get('relevance', 0.0):.3f}",
            f"{scores.get('actionability', 0.0):.3f}",
            f"{scores.get('novelty', 0.0):.3f}",
            f"{scores.get('overall', 0.0):.3f}",
            route,
            drive_path,
        ]
        with self.path.open("a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(row)

    def top_items(self, limit: int = 5, days: int = 7) -> List[Dict]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        out: List[Dict] = []
        with self.path.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                date_str = row.get("date") or ""
                try:
                    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                except Exception:
                    dt = datetime.min
                # Normalize to naive UTC comparison
                try:
                    dt_naive = dt.astimezone(tz=None).replace(tzinfo=None)
                except Exception:
                    dt_naive = dt.replace(tzinfo=None)
                if dt_naive >= cutoff:
                    out.append(row)
        out.sort(key=lambda r: float(r.get("overall", 0) or 0), reverse=True)
        return out[:limit]
