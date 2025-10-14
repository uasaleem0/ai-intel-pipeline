from __future__ import annotations

import os
import json
from pathlib import Path
from typing import Any, Dict

import yaml


DEFAULT_SETTINGS = {
    "thresholds": {
        "validity_conf": 0.7,
        "revolutionary": {
            "novelty": 0.75,
            "credibility": 0.65,
            "relevance": 0.6,
            "actionability": 0.6,
        },
    },
    "routing": {
        "weekly_day": "Friday",
    },
    "ingest": {
        "daily_limit": 12,
        "transcripts": {
            "max_whisper_video_minutes": 30,
            "daily_whisper_budget_minutes": 240,
        },
    },
}


def load_yaml(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def dump_yaml(path: Path, data: Dict[str, Any]):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, sort_keys=False, allow_unicode=True)


def ensure_dirs(vault_root: Path):
    (vault_root).mkdir(parents=True, exist_ok=True)
    (vault_root.parent / "digests" / "weekly").mkdir(parents=True, exist_ok=True)
    (vault_root.parent).mkdir(parents=True, exist_ok=True)


def load_settings() -> Dict[str, Any]:
    path = Path("config/settings.yaml")
    if not path.exists():
        dump_yaml(path, DEFAULT_SETTINGS)
    base = DEFAULT_SETTINGS.copy()
    user = load_yaml(path)
    # Merge shallow
    base.update(user)
    return base


def load_sources() -> Dict[str, Any]:
    path = Path("config/sources.yaml")
    if not path.exists():
        dump_yaml(
            path,
            {
                "youtube": {
                    "channels": [
                        {"name": "Anthropic", "channel_id": "UCoZ8xVQCAmyG3fZ4ZNSiK-Q"},
                        {"name": "OpenAI", "channel_id": "UCXZCJLdBC09xxGZ6gcdrc6A"},
                    ],
                    "queries": [
                        "Claude Code best practices",
                        "AI codegen workflow"
                    ],
                },
                "github": {
                    "repos": [
                        "vercel/next.js",
                        "shadcn/ui",
                    ]
                },
                "feeds": [
                    {"name": "Anthropic Blog", "url": "https://www.anthropic.com/news/rss.xml"},
                    {"name": "OpenAI Blog", "url": "https://openai.com/blog/rss/"},
                ],
            },
        )
    return load_yaml(path)


def load_profile() -> Dict[str, Any]:
    path = Path("profile/profile.json")
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(
                {
                    "goals": [
                        "Use AI to write code for apps and websites",
                        "Continuously improve AI pipelines with best practices",
                    ],
                    "stack": ["Claude Code", "OpenAI", "Warp"],
                    "priorities": ["Claude Code", "UI", "Next.js", "DevOps", "Agents"],
                    "thresholds": DEFAULT_SETTINGS["thresholds"],
                },
                indent=2,
            ),
            encoding="utf-8",
        )
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_pillars() -> Dict[str, Any]:
    path = Path("config/pillars.yaml")
    if not path.exists():
        dump_yaml(
            path,
            {
                "pillars": [
                    {
                        "name": "Hygienic Workflow",
                        "keywords": ["workflow", "lint", "tests", "refactor", "quality"],
                    },
                    {
                        "name": "AI UI/UX",
                        "keywords": ["ui", "ux", "design", "tailwind", "shadcn", "radix", "next.js", "react"],
                    },
                    {
                        "name": "Automation",
                        "keywords": ["automation", "pipeline", "scheduling", "n8n", "zapier"],
                    },
                    {
                        "name": "No-code Workflows",
                        "keywords": ["no-code", "ai builds code", "scaffold", "app builder"],
                    },
                    {
                        "name": "Claude/OpenAI Best Practices",
                        "keywords": ["claude", "claude code", "openai", "prompt", "assistant"],
                    },
                    {
                        "name": "Agents",
                        "keywords": ["agent", "multi-agent", "autonomous", "crew", "swarm"],
                    },
                    {
                        "name": "DevOps/Infra for AI",
                        "keywords": ["deploy", "vercel", "cloudflare", "workers", "monitor", "cost", "latency"],
                    },
                ]
            },
        )
    return load_yaml(path)
