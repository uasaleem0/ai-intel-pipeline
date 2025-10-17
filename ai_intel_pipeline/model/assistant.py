"""
Generative AI Assistant that uses learned patterns and insights to solve problems.
This is the enhanced RAG system with creative synthesis capabilities.
"""
from __future__ import annotations

from typing import Dict, List, Optional
from pathlib import Path
import json

from ..llm import have_llm, llm_complete_json
from .patterns import load_all_patterns, synthesize_meta_insights, cluster_similar_patterns
from .embedder import query_embeddings


def load_knowledge_base(vault_path: Path) -> Dict:
    """
    Load all knowledge: items, patterns, meta-insights.
    """
    patterns_dir = vault_path / "patterns"
    insights_file = vault_path / "meta_insights.json"

    patterns = load_all_patterns(patterns_dir)
    clusters = cluster_similar_patterns(patterns)

    meta_insights = []
    if insights_file.exists():
        try:
            with open(insights_file, encoding="utf-8") as f:
                meta_insights = json.load(f)
        except Exception:
            pass

    return {
        "patterns": patterns,
        "clusters": clusters,
        "meta_insights": meta_insights
    }


def retrieve_relevant_knowledge(query: str, vault_path: Path, user_profile: Dict, top_k: int = 5) -> Dict:
    """
    Retrieve relevant items, patterns, and insights for the query.
    Uses semantic search + pattern matching.
    """
    # Semantic search for relevant items
    try:
        items = query_embeddings(vault_path / "model", query, top_k=top_k)
    except Exception:
        items = []

    # Load patterns and filter by relevance
    kb = load_knowledge_base(vault_path)
    patterns = kb["patterns"]
    meta_insights = kb["meta_insights"]

    # Simple keyword matching for pattern relevance
    query_lower = query.lower()
    relevant_patterns = []
    for p in patterns:
        # Check if techniques or key_insight match query keywords
        pattern_text = " ".join([
            p.get("key_insight", ""),
            " ".join(p.get("techniques", [])),
            " ".join(p.get("use_cases", []))
        ]).lower()

        if any(word in pattern_text for word in query_lower.split() if len(word) > 3):
            relevant_patterns.append(p)

    # Sort patterns by relevance (more matching keywords = higher)
    def pattern_relevance(p):
        text = " ".join([
            p.get("key_insight", ""),
            " ".join(p.get("techniques", [])),
        ]).lower()
        return sum(word in text for word in query_lower.split() if len(word) > 3)

    relevant_patterns.sort(key=pattern_relevance, reverse=True)

    return {
        "items": items[:top_k],
        "patterns": relevant_patterns[:10],
        "meta_insights": meta_insights[:5]  # All recent insights
    }


def generate_solution(query: str, user_profile: Dict, vault_path: Path) -> Dict:
    """
    Generate a creative, novel solution to the user's problem using learned knowledge.

    This is the core of the enhanced RAG system:
    1. Retrieve relevant items, patterns, insights
    2. Synthesize them into a novel solution
    3. Provide actionable steps

    Returns:
        {
            "solution": str,  # Main solution description
            "reasoning": str,  # Why this approach works
            "techniques": List[str],  # Specific techniques to use
            "stack": List[str],  # Recommended tech stack
            "implementation_steps": List[str],  # Step-by-step guide
            "examples": List[Dict],  # Supporting examples from vault
            "novel_insights": List[str],  # Creative combinations/ideas
        }
    """
    if not have_llm():
        return {
            "solution": "LLM not available. Please configure API keys.",
            "reasoning": "",
            "techniques": [],
            "stack": [],
            "implementation_steps": [],
            "examples": [],
            "novel_insights": []
        }

    # Retrieve relevant knowledge
    knowledge = retrieve_relevant_knowledge(query, vault_path, user_profile, top_k=5)

    # Prepare context for LLM
    items_context = []
    for item in knowledge["items"]:
        items_context.append({
            "title": item.get("title"),
            "url": item.get("url"),
            "summary": item.get("summary", "")[:300],
        })

    patterns_context = []
    for pattern in knowledge["patterns"][:5]:
        patterns_context.append({
            "key_insight": pattern.get("key_insight"),
            "techniques": pattern.get("techniques"),
            "stack": pattern.get("stack"),
            "use_cases": pattern.get("use_cases")
        })

    sys = (
        "You are a creative AI innovation assistant. Given a user's problem and knowledge from validated "
        "AI innovations, generate a NOVEL, PRACTICAL solution. "
        "\n\n"
        "Your goal is to:"
        "\n1. Synthesize patterns from multiple sources into a creative solution"
        "\n2. Suggest specific, actionable techniques"
        "\n3. Recommend concrete tech stack"
        "\n4. Provide step-by-step implementation"
        "\n5. Generate novel insights by combining ideas in new ways"
        "\n\n"
        "Return JSON with: solution (2-3 paragraphs), reasoning (why this works), "
        "techniques (list of 3-5 specific techniques), stack (list of tech/tools), "
        "implementation_steps (5-8 numbered steps), examples (list of {title, url, why_relevant}), "
        "novel_insights (2-3 creative ideas/combinations not explicitly stated in sources)."
    )

    user_data = {
        "query": query,
        "user_profile": {
            "goals": user_profile.get("goals", []),
            "stack": user_profile.get("stack", []),
            "priorities": user_profile.get("priorities", [])
        },
        "relevant_items": items_context,
        "patterns": patterns_context,
        "meta_insights": knowledge["meta_insights"]
    }

    resp = llm_complete_json(system=sys, user=user_data, max_tokens=1200)

    if isinstance(resp, dict):
        # Add source examples from items
        examples = []
        for item in knowledge["items"][:3]:
            examples.append({
                "title": item.get("title"),
                "url": item.get("url"),
                "why_relevant": resp.get("examples", [{}])[len(examples)].get("why_relevant", "Related technique")
                if len(resp.get("examples", [])) > len(examples) else "Related technique"
            })

        return {
            "solution": resp.get("solution", ""),
            "reasoning": resp.get("reasoning", ""),
            "techniques": resp.get("techniques", []),
            "stack": resp.get("stack", []),
            "implementation_steps": resp.get("implementation_steps", []),
            "examples": examples,
            "novel_insights": resp.get("novel_insights", [])
        }

    # Fallback
    return {
        "solution": "Unable to generate solution. Try refining your query.",
        "reasoning": "LLM response was invalid",
        "techniques": [],
        "stack": [],
        "implementation_steps": [],
        "examples": [],
        "novel_insights": []
    }


def format_solution_markdown(solution: Dict) -> str:
    """
    Format the solution as markdown for display.
    """
    md_lines = []

    if solution.get("solution"):
        md_lines.append("## Solution\n")
        md_lines.append(solution["solution"])
        md_lines.append("")

    if solution.get("reasoning"):
        md_lines.append("## Why This Works\n")
        md_lines.append(solution["reasoning"])
        md_lines.append("")

    if solution.get("techniques"):
        md_lines.append("## Techniques to Use\n")
        for tech in solution["techniques"]:
            md_lines.append(f"- {tech}")
        md_lines.append("")

    if solution.get("stack"):
        md_lines.append("## Recommended Stack\n")
        for item in solution["stack"]:
            md_lines.append(f"- {item}")
        md_lines.append("")

    if solution.get("implementation_steps"):
        md_lines.append("## Implementation Steps\n")
        for i, step in enumerate(solution["implementation_steps"], 1):
            md_lines.append(f"{i}. {step}")
        md_lines.append("")

    if solution.get("novel_insights"):
        md_lines.append("## Novel Insights\n")
        for insight in solution["novel_insights"]:
            md_lines.append(f"💡 {insight}")
        md_lines.append("")

    if solution.get("examples"):
        md_lines.append("## Related Examples\n")
        for ex in solution["examples"]:
            md_lines.append(f"- [{ex.get('title')}]({ex.get('url')})")
            if ex.get("why_relevant"):
                md_lines.append(f"  - {ex.get('why_relevant')}")
        md_lines.append("")

    return "\n".join(md_lines)
