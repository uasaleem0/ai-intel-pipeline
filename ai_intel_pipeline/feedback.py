from __future__ import annotations

import json
from pathlib import Path
from typing import Dict


def _safe_load(path: Path) -> Dict:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def _save(path: Path, data: Dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _load_item_pillars(vault_root: Path, item_id: str):
    month = f"{item_id[:4]}-{item_id[4:6]}"
    p = vault_root / "items" / month / item_id / "item.json"
    try:
        js = json.loads(p.read_text(encoding="utf-8"))
        return [x.lower() for x in (js.get("pillars") or [])]
    except Exception:
        return []


def apply_feedback(item_id: str, decision: str, vault_root: Path, policy_path: Path):
    policy = _safe_load(policy_path)
    policy.setdefault("score_weights", {"sim": 0.5, "relevance": 0.3, "actionability": 0.2, "credibility": 0.1})
    policy.setdefault("pillars_multipliers", {})
    decision = (decision or "").lower().strip()
    # Adjust score weights slightly
    sw = policy["score_weights"]
    delta = 0.02 if decision == "accept" else (-0.02 if decision == "reject" else 0.0)
    # Emphasize relevance and actionability for accept; deemphasize for reject
    sw["relevance"] = max(0.0, min(1.0, sw.get("relevance", 0.3) + delta))
    sw["actionability"] = max(0.0, min(1.0, sw.get("actionability", 0.2) + delta))
    # Renormalize weights (simple)
    total = sw.get("sim", 0.5) + sw.get("relevance", 0.3) + sw.get("actionability", 0.2) + sw.get("credibility", 0.1)
    for k in list(sw.keys()):
        sw[k] = float(sw[k]) / total if total else sw[k]

    # Pillar multipliers: add small boost for accepted pillars, reduce for rejected
    pillars = _load_item_pillars(vault_root, item_id)
    pm = policy["pillars_multipliers"]
    for p in pillars:
        pm[p] = float(pm.get(p, 0)) + (0.02 if decision == "accept" else (-0.02 if decision == "reject" else 0.0))
        # Clamp
        pm[p] = max(-0.2, min(0.5, pm[p]))

    _save(policy_path, policy)

