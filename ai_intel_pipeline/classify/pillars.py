from __future__ import annotations

from typing import Dict, List


def classify_pillars(text: str, keyphrases: List[str], pillars_cfg: Dict) -> List[str]:
    t = text.lower()
    hits: List[str] = []
    pillar_defs = pillars_cfg.get("pillars", []) if isinstance(pillars_cfg, dict) else []
    for p in pillar_defs:
        name = p.get("name")
        kws = [k.lower() for k in (p.get("keywords") or [])]
        if not name or not kws:
            continue
        if any(kw in t for kw in kws):
            hits.append(name)
            continue
    # Boost with keyphrases
    kp = " ".join(keyphrases).lower()
    for p in pillar_defs:
        name = p.get("name")
        kws = [k.lower() for k in (p.get("keywords") or [])]
        if name in hits:
            continue
        if any(kw in kp for kw in kws):
            hits.append(name)
    return hits[:3]
