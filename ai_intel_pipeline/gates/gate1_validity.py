from __future__ import annotations

from typing import Dict, Tuple
from pathlib import Path
import json

from ..llm import have_llm, llm_complete_json


def _gather_evidence_snippets(item_dir: Path, candidate: Dict, highlights: Dict) -> Dict:
    snippets = {"transcript": [], "source": [], "repo": []}
    # Transcript: pick up to 3 short segments
    t_path = item_dir / "transcript.json"
    if t_path.exists():
        try:
            t = json.loads(t_path.read_text(encoding="utf-8"))
            segs = t.get("segments", [])
            for s in segs[:3]:
                txt = s.get("text", "")
                if txt:
                    snippets["transcript"].append({
                        "t": float(s.get("t_start", 0.0)),
                        "quote": txt[:260],
                    })
        except Exception:
            pass
    # Source (video description or blog body): first paragraph
    s_path = item_dir / "source.md"
    if s_path.exists():
        try:
            body = s_path.read_text(encoding="utf-8")
            snippets["source"].append({"quote": body.strip().splitlines()[0][:400]})
        except Exception:
            pass
    # Repo snippets if present
    repo_dir = item_dir / "repo_snippets"
    if repo_dir.exists():
        for fp in repo_dir.glob("*_*.*"):
            try:
                q = fp.read_text(encoding="utf-8")[:500]
                snippets["repo"].append({"file": fp.name, "quote": q})
            except Exception:
                continue
    return snippets


def gate1_validate(candidate: Dict, highlights: Dict, item_dir: Path, dry_run: bool = False) -> Tuple[Dict, Dict]:
    """
    Returns (evidence, scores). Evidence may be empty when dry_run or no LLM keys.
    scores includes validity_conf, credibility, novelty, and route (optional).
    """
    source = (candidate.get("source_name") or "").lower()
    official_sources = ["anthropic", "openai", "vercel", "cloudflare"]
    credibility = 0.8 if any(s in source for s in official_sources) else 0.5
    novelty = 0.7 if candidate.get("type") == "release" else 0.5

    # Heuristic baseline
    evidence = {
        "verdict": "pass",
        "confidence": 0.6 if credibility < 0.8 else 0.75,
        "citations": [
            {"source": candidate.get("url"), "pointer": candidate.get("url"), "quote": (highlights.get("summary_bullets") or [""])[0:1]}
        ],
        "notes": "Heuristic baseline; LLM step may refine.",
    }
    scores = {
        "validity_conf": evidence["confidence"],
        "credibility": credibility,
        "novelty": novelty,
    }

    if dry_run or not have_llm():
        if credibility >= 0.8 and novelty >= 0.7:
            scores["route"] = "alert"
        return evidence, scores

    # LLM refinement: fact-check with small cited snippets
    snippets = _gather_evidence_snippets(item_dir, candidate, highlights)
    sys = (
        "You are a rigorous AI research validator. Validate claims using only provided evidence. "
        "Return JSON with: verdict ('pass'|'fail'), confidence (0..1), citations [{source, pointer?, quote}] and notes."
    )
    user = {
        "item": {
            "title": candidate.get("title"),
            "url": candidate.get("url"),
            "source": candidate.get("source_name"),
            "type": candidate.get("type"),
        },
        "highlights": highlights,
        "evidence": snippets,
    }
    resp = llm_complete_json(system=sys, user=user, max_tokens=400)
    if isinstance(resp, dict):
        evidence = resp
        conf = float(resp.get("confidence", scores.get("validity_conf", 0.6)) or 0.6)
        scores["validity_conf"] = conf
        # Route rule: only if high cred + novelty + reasonable confidence
        if credibility >= 0.8 and novelty >= 0.7 and conf >= 0.7:
            scores["route"] = "alert"
    return evidence, scores
