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


if __name__ == "__main__":
    try:
        app()
    except KeyboardInterrupt:
        sys.exit(130)
