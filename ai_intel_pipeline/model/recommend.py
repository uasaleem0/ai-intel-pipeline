from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, List

import numpy as np

from .embedder import query_embeddings


def _load_index(index_csv: Path) -> Dict[str, Dict]:
    out: Dict[str, Dict] = {}
    if not index_csv.exists():
        return out
    with index_csv.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            out[r.get("item_id")] = r
    return out


def _item_dir_from_meta(vault_root: Path, item_id: str) -> Path:
    month = f"{item_id[:4]}-{item_id[4:6]}"
    return vault_root / "ai-intel" / "items" / month / item_id


def _load_pillars(vault_root: Path, item_id: str) -> List[str]:
    p = _item_dir_from_meta(vault_root, item_id) / "item.json"
    try:
        js = json.loads(p.read_text(encoding="utf-8"))
        return js.get("pillars", [])
    except Exception:
        return []


def _load_summary(vault_root: Path, item_id: str) -> str:
    p = _item_dir_from_meta(vault_root, item_id) / "summary.md"
    try:
        return p.read_text(encoding="utf-8")
    except Exception:
        return ""


def recommend(vault_root: Path, index_csv: Path, model_dir: Path, profile: Dict, top_k: int = 10) -> List[Dict]:
    # Build a query from profile priorities
    priorities = profile.get("priorities", [])
    query = ", ".join(priorities) + ", AI app workflows, best practices"
    hits = query_embeddings(model_dir, query=query, top_k=top_k * 5)

    index = _load_index(index_csv)

    # Aggregate by item_id (take max similarity per item)
    per_item: Dict[str, Dict] = {}
    for h in hits:
        item_id = h.get("item_id")
        if not item_id:
            continue
        score = float(h.get("score") or 0.0)
        if item_id not in per_item or score > per_item[item_id]["sim"]:
            per_item[item_id] = {"sim": score, "meta": h}

    # Combine with index scores and pillar weights
    weights = {
        "sim": 0.5,
        "relevance": 0.3,
        "actionability": 0.2,
        "credibility": 0.1,
    }
    pillar_weights = {p.lower(): 1.0 for p in priorities}

    results = []
    for item_id, data in per_item.items():
        idx = index.get(item_id, {})
        sim = data["sim"]
        rel = float(idx.get("relevance", 0) or 0)
        act = float(idx.get("actionability", 0) or 0)
        cred = float(idx.get("credibility", 0) or 0)
        pillars = _load_pillars(vault_root, item_id)
        # Pillar boost if matches priorities
        boost = 1.0 + 0.05 * sum(pillar_weights.get(p.lower(), 0) for p in pillars)
        score = (weights["sim"] * sim + weights["relevance"] * rel + weights["actionability"] * act + weights["credibility"] * cred) * boost
        results.append(
            {
                "item_id": item_id,
                "title": idx.get("title", data["meta"].get("title", "")),
                "url": idx.get("url", data["meta"].get("url", "")),
                "pillars": pillars,
                "scores": {"sim": sim, "relevance": rel, "actionability": act, "credibility": cred, "combined": score},
                "summary": _load_summary(vault_root, item_id)[:600],
            }
        )

    results.sort(key=lambda r: r["scores"]["combined"], reverse=True)
    return results[:top_k]

