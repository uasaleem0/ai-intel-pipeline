# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Environment Setup (Windows)
```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
```

### Core Pipeline Commands
- **Ingest items**: `python -m ai_intel_pipeline ingest --limit 5`
- **Dry run ingest**: `python -m ai_intel_pipeline ingest --limit 3 --dry-run`
- **Generate digest**: `python -m ai_intel_pipeline digest --week current`
- **List recent items**: `python -m ai_intel_pipeline list --limit 10`
- **Export for RAG**: `python -m ai_intel_pipeline export`
- **Selftest**: `python -m ai_intel_pipeline selftest`
- **Manual URL ingest**: `python -m ai_intel_pipeline ingest-url --url "https://youtube.com/watch?v=..."` 
- **Build embeddings**: `python -m ai_intel_pipeline index-model`
- **Get recommendations**: `python -m ai_intel_pipeline recommend-top --k 5`
- **Apply insight to repo**: `python -m ai_intel_pipeline apply <item_id> <repo_path>`

### Web Dashboard (React/Vite)
```bash
cd web
npm install
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

### Testing & Validation
No formal test suite - use `selftest` command for end-to-end validation.

## Architecture Overview

### Pipeline Flow
1. **Fetchers**: Gather content from YouTube (RSS/search), GitHub (releases/innovative repos), RSS feeds
2. **Normalization**: Extract highlights, keyphrases, and summary bullets via LLM calls
3. **Gate 1 (Validity)**: Validate claims with citations, score credibility/novelty/relevance
4. **Gate 2 (Personalization)**: Generate personalized summary.md based on user profile
5. **Storage**: Vault structure with monthly sharding, CSV index, and pillar views
6. **Delivery**: Weekly digests, recommendations, and web dashboard

### Key Components

#### Storage Layer (`ai_intel_pipeline/storage/`)
- **Vault**: File-based storage with monthly sharding (`vault/ai-intel/items/YYYY-MM/item_id/`)
- **Index**: CSV-based index (`vault/index.csv`) for quick querying
- **State**: Deduplication tracking (`vault/state.json`) with seen URLs and UIDs
- **Views**: Pillar-based categorization (`vault/views/pillars/`)

#### Core Processing (`ai_intel_pipeline/`)
- **Pipeline**: Main orchestration (`run_ingest`, `run_digest`)
- **Config**: YAML-based configuration with defaults for settings, sources, pillars
- **LLM**: Anthropic/OpenAI integration with fallback to mock outputs when API keys missing
- **Gates**: Two-stage validation and personalization system

#### CLI Interface (`ai_intel_pipeline/cli.py`)
All commands route through Typer-based CLI with rich console output.

### Data Structure

#### Item Structure
Each item lives in `vault/ai-intel/items/YYYY-MM/item_id/`:
- `item.json`: Metadata, scores, links, pillars
- `highlights.json`: LLM-generated highlights and keyphrases
- `summary.md`: Personalized summary (Gate 2 output)
- `transcript.json`: YouTube transcripts (with fallback flag)
- `source.md`: Raw source content (description, changelog, etc.)
- `evidence.json`: Gate 1 validation evidence
- `repo_snippets/`: README/CHANGELOG snippets for GitHub repos

#### Configuration Files
- `config/settings.yaml`: Thresholds, routing, daily limits
- `config/sources.yaml`: YouTube channels/queries, GitHub repos, RSS feeds
- `config/pillars.yaml`: Classification categories and keywords
- `profile/profile.json`: User goals, stack, priorities for personalization

### Environment Variables
- `GH_TOKEN`: GitHub API rate limit increases
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`: Enable LLM processing
- `OPENAI_TRANSCRIBE_MODEL`: Whisper model for transcript fallback (default: gpt-4o-mini-transcribe)

### State Management
- **Deduplication**: URLs and UIDs tracked in `vault/state.json`
- **Rate Limits**: Speech-to-text budget tracking for Whisper fallback
- **Idempotency**: Pipeline skips items already in index or state

### GitHub Actions Integration
- Daily cron job at 08:00 UTC (`cron.yml`)
- Builds embeddings index and web dashboard
- Deploys to GitHub Pages automatically
- Manual workflow dispatch available

## Working with the Codebase

### Adding New Sources
1. Create fetcher in `ai_intel_pipeline/fetchers/`
2. Add source configuration to `config/sources.yaml` defaults in `config.py`
3. Integrate in `pipeline.py` main ingest loop

### Extending LLM Integration
- LLM calls in `ai_intel_pipeline/llm.py` with dry-run fallbacks
- Gates in `ai_intel_pipeline/gates/` for validation and personalization
- All LLM operations gracefully degrade when API keys missing

### Storage Patterns
- Use `Vault` class for all file operations
- Monthly sharding prevents directory bloat
- CSV index for fast queries without database dependency
- JSON for structured data, Markdown for human-readable content

### Configuration Management
- YAML for settings, sources, pillars (human-editable)
- JSON for profile and dynamic state
- Defaults in code with file-based overrides
- Auto-generation of missing config files