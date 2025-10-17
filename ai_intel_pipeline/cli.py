from __future__ import annotations

import sys
import typer
from rich.console import Console
from pathlib import Path

from .config import load_settings, load_sources, ensure_dirs
from .storage.vault import Vault
from .storage.index import Index
from .pipeline import run_ingest, run_digest
from .exporter import export_jsonl
from .apply.pr import apply_to_repo_from_item
from .model.embedder import build_embeddings
from .model.recommend import recommend
from .report import write_report
app = typer.Typer(add_completion=False, help="AI Intel Pipeline CLI")
console = Console()


@app.callback()
def main_callback(
    vault_root: str = typer.Option("vault/ai-intel", help="Vault root directory"),
):
    # Ensure directories exist early
    ensure_dirs(Path(vault_root))


@app.command()
def ingest(
    limit: int = typer.Option(5, help="Max new items to ingest"),
    dry_run: bool = typer.Option(False, help="Do not call external APIs"),
):
    """Fetch new items, normalize, gate, and store outputs."""
    console.rule("Ingest Start")
    settings = load_settings()
    sources = load_sources()
    vault = Vault(root=Path("vault/ai-intel"))
    index = Index(index_path=Path("vault/index.csv"))
    created = run_ingest(sources=sources, settings=settings, vault=vault, index=index, limit=limit, dry_run=dry_run)
    console.print(f"Ingested {len(created)} items")


@app.command()
def digest(week: str = typer.Option("current", help="ISO week e.g. 2025-W41 or 'current'")):
    """Compose a weekly digest from stored items."""
    console.rule("Digest Compose")
    settings = load_settings()
    vault = Vault(root=Path("vault/ai-intel"))
    index = Index(index_path=Path("vault/index.csv"))
    out_path = run_digest(settings=settings, vault=vault, index=index, week=week)
    console.print(f"Digest written to {out_path}")


@app.command("list")
def ls(
    limit: int = typer.Option(10, help="Show last N index rows"),
):
    """List recent items in the index."""
    index = Index(index_path=Path("vault/index.csv"))
    # Read last N lines quickly
    try:
        rows = Path("vault/index.csv").read_text(encoding="utf-8").splitlines()
        header, body = rows[0], rows[1:]
        console.print(header)
        for line in body[-limit:]:
            console.print(line)
    except Exception as e:
        console.print(f"No index yet or failed to read: {e}")


@app.command()
def export(
    days: int = typer.Option(7, help="Export last N days (not enforced in MVP)"),
):
    """Export a compact JSONL for future RAG (highlights + summary)."""
    vault_root = Path("vault/ai-intel")
    index_path = Path("vault/index.csv")
    out = export_jsonl(vault_root, index_path)
    console.print(f"Exported JSONL to {out}")


@app.command()
def apply(
    item_id: str = typer.Argument(..., help="Item ID to apply (folder name)"),
    repo_dir: str = typer.Argument(..., help="Path to local git repo"),
    dry_run: bool = typer.Option(True, help="Dry-run: do not write or run gh"),
):
    """Apply an insight to a local repo: add summary file and open PR via gh CLI (optional)."""
    item_dir = Path("vault/ai-intel/items")
    # find month shard containing item_id
    matches = [p for p in Path("vault/ai-intel/items").rglob("*") if p.name == item_id]
    if not matches:
        console.print(f"Item {item_id} not found under vault/ai-intel/items")
        raise typer.Exit(code=1)
    item_path = matches[0]
    res = apply_to_repo_from_item(item_path, Path(repo_dir), dry_run=dry_run)
    console.print(res)


@app.command()
def selftest():
    """Run a basic end-to-end smoke test locally (non-destructive)."""
    try:
        # 1) ingest dry-run few items
        created = run_ingest(sources=load_sources(), settings=load_settings(), vault=Vault(root=Path("vault/ai-intel")), index=Index(index_path=Path("vault/index.csv")), limit=4, dry_run=True)
        console.print(f"Ingest (dry) created: {len(created)}")
        # 2) re-run to test dedup
        created2 = run_ingest(sources=load_sources(), settings=load_settings(), vault=Vault(root=Path("vault/ai-intel")), index=Index(index_path=Path("vault/index.csv")), limit=4, dry_run=True)
        console.print(f"Ingest repeat (dry) created: {len(created2)} (should be <= 1)")
        # 3) digest
        out_path = run_digest(settings=load_settings(), vault=Vault(root=Path("vault/ai-intel")), index=Index(index_path=Path("vault/index.csv")), week="current")
        console.print(f"Digest path: {out_path}")
        # 4) export
        out = export_jsonl(Path("vault/ai-intel"), Path("vault/index.csv"))
        console.print(f"Export path: {out}")
        console.print("Selftest OK")
    except Exception as e:
        console.print(f"Selftest FAILED: {e}")
        raise


@app.command()
def index_model(
    export_path: str = typer.Option("vault/export/chunks.jsonl", help="Path to export JSONL"),
    out_dir: str = typer.Option("vault/model", help="Output directory for embeddings index"),
):
    """Build embeddings index from export JSONL (for RAG/recommendations)."""
    export_p = Path(export_path)
    out_p = Path(out_dir)
    emb_path, meta_path = build_embeddings(export_p, out_p)
    console.print(f"Embeddings written: {emb_path} and {meta_path}")


@app.command()
def recommend_top(
    k: int = typer.Option(5, help="Top K items to recommend"),
):
    """Recommend top items based on profile priorities + embeddings + scores."""
    vault_root = Path("vault/ai-intel")
    index_csv = Path("vault/index.csv")
    model_dir = Path("vault/model")
    from .config import load_profile

    profile = load_profile()
    recs = recommend(vault_root, index_csv, model_dir, profile, top_k=k)
    for i, r in enumerate(recs, 1):
        console.print(f"{i}. {r['title']} ({', '.join(r['pillars'])})")
        console.print(f"   {r['url']}")
        s = r["scores"]
        console.print(f"   score={s['combined']:.3f} sim={s['sim']:.3f} rel={s['relevance']:.3f} act={s['actionability']:.3f} cred={s['credibility']:.3f}")
        console.print("")


@app.command()
def report():
    """Generate a daily status report with counts and top items."""
    vault_root = Path("vault/ai-intel")
    index_csv = Path("vault/index.csv")
    out = write_report(vault_root, index_csv)
    console.print(f"Status report written to {out}")


@app.command()
def feedback(
    item_id: str = typer.Option(..., help="Item ID"),
    decision: str = typer.Option(..., help="accept or reject"),
):
    """Apply feedback to policy weights (accept/reject)."""
    vault_root = Path("vault/ai-intel")
    policy_path = Path("config/policy/weights.json")
    (__import__('ai_intel_pipeline.feedback', fromlist=['apply_feedback']).apply_feedback)(item_id=item_id, decision=decision, vault_root=vault_root, policy_path=policy_path)
    Console().print("Feedback recorded.")


@app.command()
def serve(
    host: str = typer.Option("0.0.0.0", help="Host to bind to"),
    port: int = typer.Option(8000, help="Port to bind to"),
    reload: bool = typer.Option(False, help="Auto-reload on code changes"),
):
    """Start the web API server for frontend and RAG queries."""
    try:
        import uvicorn
        from .api_server import app as api_app
        console.print(f"Starting API server on http://{host}:{port}")
        console.print("Available endpoints:")
        console.print("  - GET  /health          - Health check")
        console.print("  - GET  /report          - Dashboard data")
        console.print("  - GET  /items           - List items")
        console.print("  - POST /query           - RAG chat queries")
        console.print("  - GET  /recommendations - Personalized recommendations")
        console.print("  - Static files served from /ui and /web")
        uvicorn.run(api_app, host=host, port=port, reload=reload)
    except ImportError:
        console.print("[ERROR] uvicorn not installed. Install with: pip install uvicorn")
        raise typer.Exit(code=1)
    except Exception as e:
        console.print(f"[ERROR] Server failed to start: {e}")
        raise typer.Exit(code=1)


if __name__ == "__main__":
    try:
        app()
    except KeyboardInterrupt:
        sys.exit(130)

@app.command("ingest-url")
def ingest_url(
    url: str = typer.Option(..., help="Source URL (YouTube or GitHub)"),
    dry_run: bool = typer.Option(False, help="Do not call external APIs"),
):
    """Manually ingest a single source URL (YouTube or GitHub)."""
    settings = load_settings()
    vault = Vault(root=Path("vault/ai-intel"))
    index = Index(index_path=Path("vault/index.csv"))
    from .pipeline import run_ingest_url as _run
    item_id = _run(url=url, settings=settings, vault=vault, index=index, dry_run=dry_run)
    console.print(f"Ingested item: {item_id}")





@app.command("extract-patterns")
def extract_patterns():
    """Extract reusable patterns from all validated items."""
    console.rule("Extracting Patterns")
    vault_root = Path("vault/ai-intel")
    patterns_dir = vault_root / "patterns"
    patterns_dir.mkdir(parents=True, exist_ok=True)

    from .model.patterns import extract_patterns_from_item, save_pattern

    items_dir = vault_root / "items"
    count = 0

    for month_dir in sorted(items_dir.iterdir(), reverse=True):
        if not month_dir.is_dir():
            continue
        for item_dir in month_dir.iterdir():
            if not item_dir.is_dir():
                continue

            item_id = item_dir.name
            item_file = item_dir / "item.json"
            highlights_file = item_dir / "highlights.json"
            summary_file = item_dir / "summary.md"

            if not all([item_file.exists(), highlights_file.exists(), summary_file.exists()]):
                continue

            # Skip if pattern already extracted
            if (patterns_dir / f"{item_id}.json").exists():
                continue

            try:
                import json
                with open(item_file, encoding="utf-8") as f:
                    item_data = json.load(f)
                with open(highlights_file, encoding="utf-8") as f:
                    highlights = json.load(f)
                summary = summary_file.read_text(encoding="utf-8")

                pattern = extract_patterns_from_item(item_data, highlights, summary)
                save_pattern(item_id, pattern, patterns_dir)
                count += 1
                console.print(f"[OK] Extracted pattern from {item_id}")
            except Exception as e:
                console.print(f"[FAIL] Failed to extract pattern from {item_id}: {e}")

    console.print(f"\n{count} patterns extracted to {patterns_dir}")


@app.command("synthesize")
def synthesize():
    """Generate meta-insights from extracted patterns."""
    console.rule("Synthesizing Meta-Insights")
    vault_root = Path("vault/ai-intel")
    patterns_dir = vault_root / "patterns"

    from .model.patterns import load_all_patterns, cluster_similar_patterns, synthesize_meta_insights
    import json

    patterns = load_all_patterns(patterns_dir)
    console.print(f"Loaded {len(patterns)} patterns")

    if len(patterns) < 3:
        console.print("Need at least 3 patterns to synthesize insights")
        return

    clusters = cluster_similar_patterns(patterns)
    console.print(f"Found {len(clusters)} pattern clusters")

    insights = synthesize_meta_insights(patterns, clusters)
    console.print(f"Generated {len(insights)} meta-insights")

    # Save to vault
    insights_file = vault_root / "meta_insights.json"
    with open(insights_file, "w", encoding="utf-8") as f:
        json.dump(insights, f, indent=2, ensure_ascii=False)

    console.print(f"\nMeta-insights saved to {insights_file}")

    # Display insights
    for i, insight in enumerate(insights, 1):
        console.print(f"\n{i}. {insight.get('insight')}")
        console.print(f"   Confidence: {insight.get('confidence', 0):.2f}")
        console.print(f"   Actionable: {insight.get('actionable_takeaway')}")


@app.command("ask")
def ask(
    query: str = typer.Argument(..., help="Your question or problem"),
):
    """Ask the AI assistant for a creative solution based on learned knowledge."""
    console.rule("AI Assistant")
    vault_root = Path("vault/ai-intel")

    from .config import load_profile
    from .model.assistant import generate_solution, format_solution_markdown

    profile = load_profile()
    console.print(f"Query: {query}\n")
    console.print("Generating solution...\n")

    solution = generate_solution(query, profile, vault_root)

    if solution.get("solution"):
        md = format_solution_markdown(solution)
        console.print(md)

        # Save solution to file
        solutions_dir = vault_root / "solutions"
        solutions_dir.mkdir(parents=True, exist_ok=True)
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        solution_file = solutions_dir / f"solution_{timestamp}.md"
        solution_file.write_text(f"# Query: {query}\n\n{md}", encoding="utf-8")
        console.print(f"\nSolution saved to {solution_file}")
    else:
        console.print("Unable to generate solution. Check LLM configuration.")


@app.command("build-knowledge")
def build_knowledge():
    """Build complete knowledge base: embeddings + patterns + meta-insights."""
    console.rule("Building Knowledge Base")

    # Step 1: Export JSONL
    console.print("Step 1/4: Exporting items to JSONL...")
    vault_root = Path("vault/ai-intel")
    index_path = Path("vault/index.csv")
    export_jsonl(vault_root, index_path)

    # Step 2: Build embeddings
    console.print("\nStep 2/4: Building embeddings index...")
    export_p = Path("vault/export/chunks.jsonl")
    out_p = Path("vault/model")
    if export_p.exists():
        emb_path, meta_path = build_embeddings(export_p, out_p)
        console.print(f"[OK] Embeddings: {emb_path}")
    else:
        console.print("[FAIL] No export file found, skipping embeddings")

    # Step 3: Extract patterns
    console.print("\nStep 3/4: Extracting patterns...")
    extract_patterns()

    # Step 4: Synthesize meta-insights
    console.print("\nStep 4/4: Synthesizing meta-insights...")
    synthesize()

    console.print("\n[SUCCESS] Knowledge base built successfully!")
