from __future__ import annotations

from typing import Dict, Tuple
from pathlib import Path
from ..llm import have_llm, llm_complete_json


def gate2_personalize(highlights: Dict, profile: Dict, candidate: Dict, item_dir: Path, dry_run: bool = False) -> Tuple[str, Dict]:
    """
    Returns (summary_md, scores2). Uses LLM when available; falls back to heuristic summary.
    """
    bullets = highlights.get("summary_bullets", [])
    keyphrases = highlights.get("keyphrases", [])
    key_claims = highlights.get("key_claims", [])

    priorities = [p.lower() for p in profile.get("priorities", [])]
    relevance = 0.6 if any(p in " ".join(keyphrases).lower() for p in priorities) else 0.45
    actionability = 0.6 if key_claims else 0.45
    overall = 0.35 * relevance + 0.25 * 0.6 + 0.25 * actionability + 0.15 * 0.5

    if dry_run or not have_llm():
        why = [
            "- Aligns with codegen and UI workflow priorities." if relevance >= 0.6 else "- Potentially relevant to AI app workflows.",
            "- Contains actionable steps or claimed improvements." if actionability >= 0.6 else "- May require deeper review for applicability.",
        ]
        apply_steps = [
            "1) Review linked repo/docs (if any) and check compatibility.",
            "2) Prototype in a scratch branch; add tests or snapshot diffs.",
            "3) If results are positive, open PR with minimal patch and rationale.",
        ]
        prompts = [
            "Claude: Summarize applicability of this insight to our Next.js/Tailwind stack; propose a minimal patch.",
            "OpenAI: Generate a TypeScript helper implementing the described best practice with tests.",
        ]
        summary_md = (
            "TL;DR\n" + "\n".join(bullets[:3]) + "\n\n" +
            "Why it matters\n" + "\n".join(why) + "\n\n" +
            "Trade-offs\n- Requires validation on our stack.\n- Risk of churn if ecosystem moves.\n\n" +
            "Apply steps\n" + "\n".join(apply_steps) + "\n\n" +
            "Prompt snippets\n- " + "\n- ".join(prompts) + "\n"
        )
        return summary_md, {
            "relevance": relevance,
            "actionability": actionability,
            "overall": overall,
            "route": "alert" if overall >= 0.7 else "weekly",
        }

    # LLM path: produce concisely structured Markdown with sections
    sys = (
        "You are a senior AI engineer. Given highlights and user profile, produce a concise, actionable brief. "
        "Sections: TL;DR (1-2 lines); Why it matters (3 bullets); Trade-offs (2 bullets); Apply steps (3-5 numbered, repo-aware if links present); "
        "Prompt snippets (2-3 for Claude/OpenAI). Keep to ~300-500 tokens."
    )
    user = {
        "item": {
            "title": candidate.get("title"),
            "url": candidate.get("url"),
            "source": candidate.get("source_name"),
            "type": candidate.get("type"),
            "links": candidate.get("links", {}),
        },
        "profile": profile,
        "highlights": highlights,
    }
    resp = llm_complete_json(system=sys, user=user, max_tokens=600)
    if isinstance(resp, dict):
        md = resp.get("markdown") or ""
        r = float(resp.get("relevance", relevance) or relevance)
        a = float(resp.get("actionability", actionability) or actionability)
        o = float(resp.get("overall", overall) or overall)
        route = resp.get("route") or ("alert" if o >= 0.7 else "weekly")
        if md.strip():
            return md, {"relevance": r, "actionability": a, "overall": o, "route": route}

    # fallback if LLM response malformed
    fallback = (
        "TL;DR\n" + "\n".join(bullets[:3]) + "\n\n" +
        "Why it matters\n- Potentially valuable.\n- Requires validation.\n- Low risk to prototype.\n\n" +
        "Apply steps\n1) Review links.\n2) Prototype in branch.\n3) Open PR.\n"
    )
    return fallback, {"relevance": relevance, "actionability": actionability, "overall": overall, "route": "weekly"}
