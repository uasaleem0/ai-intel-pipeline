from __future__ import annotations

import os
import json
from typing import Any, Dict, Optional


def have_llm() -> bool:
    return bool(os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY"))


def _anthropic_complete_json(system: str, user: Any, max_tokens: int = 400, model: Optional[str] = None) -> Optional[Dict]:
    try:
        import anthropic
    except Exception:
        return None
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    client = anthropic.Anthropic(api_key=api_key)
    model = model or os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest")
    prompt_user = json.dumps(user, ensure_ascii=False)
    msg = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=0.2,
        system=system + " Always return strict JSON only.",
        messages=[{"role": "user", "content": prompt_user}],
    )
    text = "".join([block.text for block in msg.content if getattr(block, "type", "") == "text"]) if hasattr(msg, "content") else str(msg)
    try:
        return json.loads(text)
    except Exception:
        # try to locate JSON substring
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except Exception:
                return None
        return None


def _openai_complete_json(system: str, user: Any, max_tokens: int = 400, model: Optional[str] = None) -> Optional[Dict]:
    try:
        from openai import OpenAI
    except Exception:
        return None
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    client = OpenAI()
    model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    prompt_user = json.dumps(user, ensure_ascii=False)
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system + " Return strict JSON only."},
            {"role": "user", "content": prompt_user},
        ],
        temperature=0.2,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )
    text = resp.choices[0].message.content if resp and resp.choices else ""
    try:
        return json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except Exception:
                return None
        return None


def llm_complete_json(system: str, user: Any, max_tokens: int = 400) -> Optional[Dict]:
    # Prefer Anthropic if available
    out = _anthropic_complete_json(system, user, max_tokens=max_tokens)
    if out is not None:
        return out
    return _openai_complete_json(system, user, max_tokens=max_tokens)
