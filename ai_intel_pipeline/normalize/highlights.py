from __future__ import annotations

from typing import Dict, List
import re


def _extract_keyphrases(text: str, max_k: int = 5) -> List[str]:
    if not text:
        return []
    # Simple heuristic: pick capitalized phrases and known keywords
    keywords = [
        "Claude", "Claude Code", "OpenAI", "GPT", "Next.js", "Vercel",
        "Cloudflare", "Cursor", "Agents", "UI", "Tailwind", "Radix",
        "Shadcn", "Release", "Benchmark", "SOTA",
    ]
    found = []
    for k in keywords:
        if k.lower() in text.lower():
            found.append(k)
    # Add some camel-case or Title Case chunks
    caps = re.findall(r"\b([A-Z][a-zA-Z0-9\-/+]{2,}(?:\s+[A-Z][a-zA-Z0-9\-/+]{2,})*)\b", text)
    for c in caps:
        if c not in found and len(found) < max_k:
            found.append(c)
    return found[:max_k]


def build_highlights(candidate: Dict, dry_run: bool = False) -> Dict:
    title = candidate.get("title") or ""
    desc = candidate.get("raw_description") or ""
    url = candidate.get("url") or ""
    source = candidate.get("source_name") or candidate.get("source_type")

    # Heuristic summary bullets
    bullets = []
    bullets.append(f"Source: {source}")
    bullets.append(f"Title: {title}")
    if candidate.get("type") == "release":
        bullets.append("Type: Release notes")
    elif candidate.get("source_type") == "youtube":
        bullets.append("Type: Video (talk/tutorial)")
    else:
        bullets.append(f"Type: {candidate.get('type','post')}")

    if desc:
        # Extract first 1-2 sentences
        sentences = re.split(r"(?<=[.!?])\s+", desc)
        preview = " ".join(sentences[:2]).strip()
        if preview:
            bullets.append(f"Context: {preview[:240]}")

    keyphrases = _extract_keyphrases((title + "\n" + desc))
    key_claims = []
    # Minimal claim placeholder
    if "release" in (candidate.get("type") or ""):
        key_claims.append({"claim": "New release announced", "pointer": url, "type": "release"})
    else:
        key_claims.append({"claim": "Potential best-practice or tutorial", "pointer": url, "type": "tutorial"})

    highlights = {
        "summary_bullets": bullets,
        "keyphrases": keyphrases,
        "key_claims": key_claims,
        "youtube_quotes": [],  # Filled later when transcripts integrated
    }
    return highlights

