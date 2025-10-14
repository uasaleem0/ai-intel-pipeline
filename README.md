AI Intel Pipeline (No‑Make)

Purpose
- Fetch high-signal AI updates (YouTube, GitHub, vendor feeds)
- Normalize to token-efficient highlights
- Gate 1: validity with citations
- Gate 2: personalization (why it matters + apply steps)
- Store in a simple vault and index for delivery and application

Quick Start
1) Create a virtualenv and install deps: `pip install -r requirements.txt`
2) Configure sources in `config/sources.yaml` and profile in `profile/profile.json`
3) Run a dry ingest: `python -m ai_intel_pipeline ingest --limit 3`
4) Compose a weekly digest: `python -m ai_intel_pipeline digest --week current`

Notes
- LLM calls are optional; if API keys are not set, the pipeline uses mock outputs.
- Vault lives under `vault/ai-intel/` by default; can be moved to Google Drive later.

Env Vars (optional)
- `GH_TOKEN`: increases GitHub API rate limits.
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`: enable LLM steps and transcription fallback.
- `OPENAI_TRANSCRIBE_MODEL` (optional): defaults to `gpt-4o-mini-transcribe`.

Run Locally (Windows)
- `python -m venv .venv && .venv\\Scripts\\python -m pip install -r requirements.txt`
- `.venv\\Scripts\\python.exe -m ai_intel_pipeline ingest --limit 5`
- `.venv\\Scripts\\python.exe -m ai_intel_pipeline digest --week current`

Structure
- Vault: `vault/ai-intel/items/YYYY-MM/{item_id}/{item.json, highlights.json, summary.md, (optional) evidence.json, transcript.json, source.md}`
- Index: `vault/index.csv`
- Profile: `profile/profile.json`
- Digests: `vault/digests/weekly/YYYY-Www.md`
- Views: `vault/views/pillars/<pillar-slug>.json` (lists of item_ids by pillar)

State & Deduplication
- State file: `vault/state.json` tracks `seen_urls` and durable UIDs (e.g., YouTube video IDs).
- Pipeline skips any item already in state or index, ensuring no daily duplicates.

Export for RAG
- `python -m ai_intel_pipeline export` → writes `vault/export/chunks.jsonl` with compact chunks (highlights, claims, summary) for embedding later.

Scheduling (GitHub Actions)
- `.github/workflows/cron.yml` runs daily at 08:00 UTC (≈ 09:00 BST). Adjust as needed.

Pillars (Tags)
- Each item is heuristically categorized into up to 3 pillars: Hygienic Workflow, AI UI/UX, Automation, Agents, Prompting, Codegen Patterns, DevOps/Infra for AI.
- Pillars are stored in `item.json` and aggregated under `vault/views/pillars/` for quick browsing.

Token Efficiency
- Highlights first (small): bullets, keyphrases, 1–3 claims with pointers.
- Gate 1 validity reads only small cited snippets; full transcripts used only when necessary.
- Gate 2 personalization uses highlights + profile to draft `summary.md`.
Configuration
- `config/settings.yaml` — daily caps, transcript fallback limits (per video and daily), routing thresholds.
- `config/sources.yaml` — YouTube queries (discovery), GitHub search queries, vendor feeds.
- `config/pillars.yaml` — edit pillar names and keywords anytime; items will be tagged heuristically.
- `profile/profile.json` — your goals/stack/priorities that drive personalization.
