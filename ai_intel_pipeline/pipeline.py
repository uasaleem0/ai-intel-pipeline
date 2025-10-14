from __future__ import annotations

from pathlib import Path
import json
from typing import Dict, List
from datetime import datetime

from .storage.vault import Vault
from .storage.index import Index
from .storage.state import State
from .storage.views import Views
from .config import load_profile, load_settings, load_pillars
from .fetchers.github import fetch_github_releases
from .fetchers.rss import fetch_feed_items
from .fetchers.youtube import fetch_youtube_channel_rss, fetch_youtube_search_rss, enrich_youtube_metadata
from .normalize.highlights import build_highlights
from .gates.gate1_validity import gate1_validate
from .gates.gate2_personalize import gate2_personalize
# Alerts disabled by default; Slack integration optional
# from .delivery.alerts import send_webhook_alert
from .transcripts.youtube import get_transcript_segments
from .fetchers.github_search import search_innovative_repos
from .fetchers.github_docs import fetch_readme, fetch_changelog


def run_ingest(
    sources: Dict,
    settings: Dict,
    vault: Vault,
    index: Index,
    limit: int = 10,
    dry_run: bool = False,
) -> List[str]:
    profile = load_profile()
    pillars_cfg = load_pillars()
    state = State(Path("vault/state.json"))
    views = Views(root=Path("vault"))
    created_ids: List[str] = []

    # normalize limit against settings daily cap
    daily_cap = int(settings.get("ingest", {}).get("daily_limit", 12))
    limit = min(limit or daily_cap, daily_cap)

    # 1) Fetch candidates (YouTube channels RSS, GitHub releases, vendor feeds)
    candidates = []
    # YouTube discovery: channel RSS and query RSS (channels optional)
    yt_conf = sources.get("youtube", {})
    for ch in yt_conf.get("channels", []) or []:
        candidates += fetch_youtube_channel_rss(ch.get("channel_id"), ch.get("name"))
    # dynamic query expansion from profile priorities
    dyn_q = []
    for p in (profile.get("priorities") or []):
        dyn_q.append(f"{p} best practices AI")
        dyn_q.append(f"{p} tutorial AI code")
    seen_q = set()
    queries = list((yt_conf.get("queries", []) or [])) + dyn_q
    for q in queries:
        if q in seen_q:
            continue
        seen_q.add(q)
        candidates += fetch_youtube_search_rss(q)

    # GitHub releases (optional; can be pruned later)
    for repo in sources.get("github", {}).get("repos", []) or []:
        candidates += fetch_github_releases(repo)

    # GitHub innovative apps search
    gh_search_q = sources.get("github", {}).get("search_queries", []) or []
    if gh_search_q:
        candidates += search_innovative_repos(gh_search_q, per_query=3)

    # Vendor feeds
    for feed in sources.get("feeds", []):
        candidates += fetch_feed_items(feed.get("url"), feed.get("name"))

    # Compute uids and sort newest first, then limit
    def uid_for(c: Dict) -> str:
        if c.get("source_type") == "youtube":
            from .transcripts.youtube import extract_video_id
            vid = extract_video_id(c.get("url") or "") or ""
            return f"yt:{vid}" if vid else c.get("url", "")
        if c.get("source_type") == "github" and c.get("type") == "application":
            return f"repo:{c.get('url')}"
        return c.get("url", "")

    for c in candidates:
        c["_uid"] = uid_for(c)

    candidates.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    # Filter out already seen items by state and index
    filtered = []
    for c in candidates:
        if state.seen(url=c.get("url"), uid=c.get("_uid")):
            continue
        if index.has_url(c.get("url")):
            # mark in state as well to avoid rework next run
            state.mark(url=c.get("url"), uid=c.get("_uid"))
            continue
        filtered.append(c)
    candidates = filtered[:limit]

    # 2) For each candidate, create vault item and run highlights
    for c in candidates:
        if index.has_url(c.get("url")):
            continue
        item_id, item_dir = vault.create_item_folder(dt=datetime.utcnow())

        # Write item.json base
        item = vault.init_item_json(
            item_id=item_id,
            title=c.get("title"),
            canonical_url=c.get("url"),
            source_type=c.get("source_type"),
            source_name=c.get("source_name"),
            published_at=c.get("published_at"),
            content_type=c.get("type"),
            links=c.get("links", {}),
        )

        # Build highlights (LLM optional)
        highlights = build_highlights(candidate=c, dry_run=dry_run)
        vault.write_json(item_dir / "highlights.json", highlights)

        # If YouTube, enrich description/links and capture transcript
        if c.get("source_type") == "youtube":
            meta = enrich_youtube_metadata(c.get("url"))
            if meta:
                # augment links
                links = item.get("links", {})
                links.setdefault("repos", [])
                links.setdefault("urls", [])
                links["repos"] = sorted(list(set(links["repos"] + meta.get("extracted_links", {}).get("repos", []))))
                links["urls"] = sorted(list(set(links["urls"] + meta.get("extracted_links", {}).get("urls", []))))
                extra_fields = {"links": links}
                if meta.get("duration") is not None:
                    extra_fields["duration_seconds"] = int(meta.get("duration") or 0)
                vault.update_fields(item_dir / "item.json", extra_fields)
                # store source description if substantial
                desc = meta.get("description") or ""
                if len(desc) > 40:
                    vault.write_text(item_dir / "source.md", desc)
            # captions-first
            segs = get_transcript_segments(c.get("url"))
            used_fallback = False
            if not segs:
                # consider Whisper fallback if allowed by settings and budget
                dur_sec = (meta.get("duration") or 0) if meta else 0
                dur_min = int(dur_sec // 60)
                max_min = int(settings.get("ingest", {}).get("transcripts", {}).get("max_whisper_video_minutes", 30))
                daily_cap = int(settings.get("ingest", {}).get("transcripts", {}).get("daily_whisper_budget_minutes", 240))
                if dur_min and dur_min <= max_min:
                    date_key = datetime.utcnow().strftime("%Y-%m-%d")
                    if state.can_spend_stt(dur_min, date_key, daily_cap):
                        from .transcripts.youtube import transcribe_with_openai
                        fallback = transcribe_with_openai(c.get("url")) if not dry_run else None
                        if fallback:
                            segs = fallback
                            state.spend_stt(dur_min, date_key)
                            used_fallback = True
            if segs:
                vault.write_json(item_dir / "transcript.json", {"segments": segs, "fallback": used_fallback})

            # Fetch repo README/CHANGELOG snippets for top 1-2 repos discovered in description
            links = (json.loads((item_dir / "item.json").read_text(encoding="utf-8"))).get("links", {})
            repos = links.get("repos", []) if isinstance(links, dict) else []
            if repos:
                (item_dir / "repo_snippets").mkdir(parents=True, exist_ok=True)
                for repo in repos[:2]:
                    rd = fetch_readme(repo)
                    if rd:
                        (item_dir / "repo_snippets" / f"{repo.replace('/', '_')}_README.md").write_text(rd[:4000], encoding="utf-8")
                    ch = fetch_changelog(repo)
                    if ch:
                        (item_dir / "repo_snippets" / f"{repo.replace('/', '_')}_CHANGELOG.md").write_text(ch[:4000], encoding="utf-8")

        # Gate 1 validity
        evidence, scores = gate1_validate(candidate=c, highlights=highlights, item_dir=item_dir, dry_run=dry_run)
        if evidence:
            vault.write_json(item_dir / "evidence.json", evidence)
        vault.update_scores(item_dir / "item.json", scores)

        # Gate 2 personalization
        summary_md, scores2 = gate2_personalize(highlights=highlights, profile=profile, candidate=c, item_dir=item_dir, dry_run=dry_run)
        vault.write_text(item_dir / "summary.md", summary_md)
        vault.update_scores(item_dir / "item.json", scores2)

        # Classify pillars (heuristic for now) and update views
        from .classify.pillars import classify_pillars
        text_for_class = (c.get("title") or "") + "\n" + (" ".join(highlights.get("summary_bullets", [])))[-1:]
        pillars = classify_pillars(text_for_class, highlights.get("keyphrases", []), pillars_cfg)
        vault.update_fields(item_dir / "item.json", {"pillars": pillars})
        # Add to views
        try:
            item_meta = json.loads((item_dir / "item.json").read_text(encoding="utf-8"))
        except Exception:
            item_meta = {"id": item_id, "title": c.get("title"), "canonical_url": c.get("url"), "published_at": c.get("published_at")}
        views.add_item_to_pillars(pillars, item_meta)

        # Update index
        overall = scores2.get("overall") or scores.get("overall")
        index.add(
            item_id=item_id,
            title=c.get("title"),
            url=c.get("url"),
            source=c.get("source_name"),
            ctype=c.get("type"),
            date=c.get("published_at"),
            scores={**scores, **scores2, "overall": overall},
            route=scores2.get("route") or scores.get("route") or "weekly",
            drive_path=str(item_dir),
        )

        # Alerts if routed
        # Alerts intentionally disabled (weekly digest only in MVP)

        # Mark as seen
        state.mark(url=c.get("url"), uid=c.get("_uid"))
        created_ids.append(item_id)

    # Save state at end
    state.save()

    return created_ids


def run_digest(settings: Dict, vault: Vault, index: Index, week: str = "current") -> Path:
    # For MVP, just take top 5 items by overall score in last 7 days
    items = index.top_items(limit=5, days=7)
    lines = ["# Weekly Digest\n"]
    for it in items:
        item_dir = Path(it["drive_path"]) if it.get("drive_path") else None
        title = it.get("title", "")
        url = it.get("url", "")
        lines.append(f"## {title}\n")
        lines.append(f"Source: {url}\n")
        try:
            summary = (item_dir / "summary.md").read_text(encoding="utf-8") if item_dir else ""
        except Exception:
            summary = "(summary not found)\n"
        lines.append(summary)
        lines.append("\n---\n")

    out_dir = Path("vault/digests/weekly")
    out_dir.mkdir(parents=True, exist_ok=True)
    now = datetime.utcnow()
    iso_week = f"{now.isocalendar().year}-W{now.isocalendar().week:02d}"
    out_path = out_dir / f"{iso_week}.md"
    out_path.write_text("\n".join(lines), encoding="utf-8")
    return out_path
