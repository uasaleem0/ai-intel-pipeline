"""
Pattern extraction and synthesis system.
Extracts reusable techniques, approaches, and patterns from validated items.
This is the foundation for enhanced RAG with meta-learning.
"""
from __future__ import annotations

from typing import Dict, List, Optional
from pathlib import Path
import json
from datetime import datetime

from ..llm import have_llm, llm_complete_json


def extract_patterns_from_item(item_data: Dict, highlights: Dict, summary: str) -> Dict:
    """
    Extract reusable patterns/techniques from a single item using LLM.

    Returns:
        {
            "techniques": List[str],  # Reusable techniques/approaches
            "stack": List[str],  # Tech stack components
            "use_cases": List[str],  # Application scenarios
            "key_insight": str,  # Main takeaway
            "pattern_type": str  # e.g., "workflow", "architecture", "tool-usage"
        }
    """
    if not have_llm():
        # Fallback heuristic extraction
        return {
            "techniques": highlights.get("keyphrases", [])[:5],
            "stack": [],
            "use_cases": [],
            "key_insight": summary.split("\n")[0] if summary else "",
            "pattern_type": "unknown"
        }

    sys = (
        "You are an AI pattern analyst. Extract reusable patterns and techniques from this content. "
        "Focus on: What can others APPLY? What's the core technique? What stack is used? "
        "Return JSON with: techniques (list of 3-5 reusable approaches), stack (list of tech used), "
        "use_cases (list of 2-3 scenarios this applies to), key_insight (1 sentence main takeaway), "
        "pattern_type ('workflow'|'architecture'|'tool-usage'|'framework'|'ui-pattern'|'automation'|'other')."
    )

    user = {
        "item": {
            "title": item_data.get("title"),
            "url": item_data.get("url"),
            "source": item_data.get("source_name"),
            "description": item_data.get("description"),
        },
        "highlights": highlights,
        "summary": summary[:800]  # Truncate for token efficiency
    }

    resp = llm_complete_json(system=sys, user=user, max_tokens=500)
    if isinstance(resp, dict):
        return {
            "techniques": resp.get("techniques", []),
            "stack": resp.get("stack", []),
            "use_cases": resp.get("use_cases", []),
            "key_insight": resp.get("key_insight", ""),
            "pattern_type": resp.get("pattern_type", "other")
        }

    # Fallback
    return {
        "techniques": highlights.get("keyphrases", [])[:5],
        "stack": [],
        "use_cases": [],
        "key_insight": summary.split("\n")[0] if summary else "",
        "pattern_type": "unknown"
    }


def save_pattern(item_id: str, pattern_data: Dict, patterns_dir: Path) -> None:
    """
    Save extracted pattern to patterns directory.
    """
    patterns_dir.mkdir(parents=True, exist_ok=True)
    pattern_file = patterns_dir / f"{item_id}.json"

    pattern_record = {
        "item_id": item_id,
        "extracted_at": datetime.now().isoformat(),
        **pattern_data
    }

    with open(pattern_file, "w", encoding="utf-8") as f:
        json.dump(pattern_record, f, indent=2, ensure_ascii=False)


def load_all_patterns(patterns_dir: Path) -> List[Dict]:
    """
    Load all extracted patterns from the patterns directory.
    """
    if not patterns_dir.exists():
        return []

    patterns = []
    for pattern_file in patterns_dir.glob("*.json"):
        try:
            with open(pattern_file, encoding="utf-8") as f:
                pattern = json.load(f)
                patterns.append(pattern)
        except Exception:
            continue

    return patterns


def cluster_similar_patterns(patterns: List[Dict]) -> List[Dict]:
    """
    Group patterns by similarity (technique overlap, pattern_type, stack).

    Returns list of clusters:
        {
            "cluster_id": str,
            "pattern_type": str,
            "common_techniques": List[str],
            "common_stack": List[str],
            "items": List[str],  # item_ids
            "count": int
        }
    """
    if not patterns:
        return []

    # Group by pattern_type first
    type_groups = {}
    for p in patterns:
        ptype = p.get("pattern_type", "other")
        if ptype not in type_groups:
            type_groups[ptype] = []
        type_groups[ptype].append(p)

    clusters = []
    for ptype, group_patterns in type_groups.items():
        if len(group_patterns) < 2:
            # Single-item cluster
            p = group_patterns[0]
            clusters.append({
                "cluster_id": f"{ptype}_single_{p.get('item_id', 'unknown')}",
                "pattern_type": ptype,
                "common_techniques": p.get("techniques", []),
                "common_stack": p.get("stack", []),
                "items": [p.get("item_id")],
                "count": 1
            })
            continue

        # Find common techniques and stack across group
        all_techniques = []
        all_stack = []
        item_ids = []

        for p in group_patterns:
            all_techniques.extend(p.get("techniques", []))
            all_stack.extend(p.get("stack", []))
            item_ids.append(p.get("item_id"))

        # Count frequency
        technique_counts = {}
        for t in all_techniques:
            technique_counts[t] = technique_counts.get(t, 0) + 1

        stack_counts = {}
        for s in all_stack:
            stack_counts[s] = stack_counts.get(s, 0) + 1

        # Common = appears in at least 2 items
        common_techniques = [t for t, count in technique_counts.items() if count >= 2]
        common_stack = [s for s, count in stack_counts.items() if count >= 2]

        clusters.append({
            "cluster_id": f"{ptype}_cluster_{len(clusters)}",
            "pattern_type": ptype,
            "common_techniques": common_techniques,
            "common_stack": common_stack,
            "items": item_ids,
            "count": len(item_ids)
        })

    return clusters


def synthesize_meta_insights(patterns: List[Dict], clusters: List[Dict]) -> List[Dict]:
    """
    Generate meta-insights across multiple patterns using LLM.
    This is where the "learning" happens - finding connections across items.

    Returns:
        [
            {
                "insight": str,
                "supporting_items": List[str],
                "confidence": float,
                "actionable_takeaway": str
            }
        ]
    """
    if not have_llm() or len(patterns) < 3:
        return []

    # Prepare summary of patterns for LLM
    pattern_summaries = []
    for p in patterns[:20]:  # Limit to 20 most recent
        pattern_summaries.append({
            "item_id": p.get("item_id"),
            "key_insight": p.get("key_insight"),
            "techniques": p.get("techniques", [])[:3],
            "pattern_type": p.get("pattern_type")
        })

    cluster_summaries = []
    for c in clusters:
        if c["count"] >= 2:
            cluster_summaries.append({
                "pattern_type": c["pattern_type"],
                "count": c["count"],
                "common_techniques": c["common_techniques"][:3]
            })

    sys = (
        "You are an AI innovation analyst. Analyze these patterns from multiple sources to find META-INSIGHTS. "
        "Look for: Emerging trends, common approaches across different domains, novel combinations, "
        "patterns that connect multiple items. "
        "Return JSON with: insights (array of objects with: insight (str), supporting_items (list of item_ids), "
        "confidence (0-1), actionable_takeaway (1 sentence))."
    )

    user = {
        "patterns": pattern_summaries,
        "clusters": cluster_summaries,
        "total_items": len(patterns),
        "instruction": "Generate 3-5 meta-insights that connect multiple patterns."
    }

    resp = llm_complete_json(system=sys, user=user, max_tokens=800)
    if isinstance(resp, dict) and "insights" in resp:
        return resp["insights"]

    return []
