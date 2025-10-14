from __future__ import annotations

from pathlib import Path
import csv
import json
from typing import Dict, List


def export_jsonl(vault_root: Path, index_csv: Path, out_path: Path | None = None, days: int | None = None) -> Path:
    """Create a compact JSONL for RAG (highlights + summary only).

    Each line: {
      id, item_id, type: (highlights|claims|summary), text, url, title, source, date, path
    }
    """
    out_dir = vault_root.parent / "export"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_path or (out_dir / "chunks.jsonl")
    count = 0
    with index_csv.open("r", encoding="utf-8") as f, out_path.open("w", encoding="utf-8") as out:
        reader = csv.DictReader(f)
        for row in reader:
            item_dir = Path(row.get("drive_path", ""))
            if not item_dir.exists():
                continue
            title = row.get("title", "")
            url = row.get("url", "")
            source = row.get("source", "")
            date = row.get("date", "")
            item_id = row.get("item_id", "")

            # load item.json for pillars (if available)
            try:
                item_meta = json.loads((item_dir / "item.json").read_text(encoding="utf-8"))
                pillars = item_meta.get("pillars", [])
            except Exception:
                pillars = []

            # highlights
            try:
                h = json.loads((item_dir / "highlights.json").read_text(encoding="utf-8"))
            except Exception:
                h = {}
            bullets = h.get("summary_bullets", [])
            claims = h.get("key_claims", [])

            if bullets:
                text = "\n".join(bullets)
                rec = {
                    "id": f"{item_id}#highlights",
                    "item_id": item_id,
                    "type": "highlights",
                    "text": text,
                    "url": url,
                    "title": title,
                    "source": source,
                    "date": date,
                    "path": str((item_dir / "highlights.json").as_posix()),
                    "pillars": pillars,
                }
                out.write(json.dumps(rec, ensure_ascii=False) + "\n")
                count += 1

            if claims:
                text = "\n".join([f"- {c.get('claim')} ({c.get('pointer','')})" for c in claims])
                rec = {
                    "id": f"{item_id}#claims",
                    "item_id": item_id,
                    "type": "claims",
                    "text": text,
                    "url": url,
                    "title": title,
                    "source": source,
                    "date": date,
                    "path": str((item_dir / "highlights.json").as_posix()),
                    "pillars": pillars,
                }
                out.write(json.dumps(rec, ensure_ascii=False) + "\n")
                count += 1

            # summary
            try:
                summary = (item_dir / "summary.md").read_text(encoding="utf-8")
            except Exception:
                summary = ""
            if summary:
                rec = {
                    "id": f"{item_id}#summary",
                    "item_id": item_id,
                    "type": "summary",
                    "text": summary,
                    "url": url,
                    "title": title,
                    "source": source,
                    "date": date,
                    "path": str((item_dir / "summary.md").as_posix()),
                    "pillars": pillars,
                }
                out.write(json.dumps(rec, ensure_ascii=False) + "\n")
                count += 1

    return out_path
