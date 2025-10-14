from __future__ import annotations

from typing import Dict, Optional
from pathlib import Path
import subprocess
import os
from .gh_cli import run_gh_pr_create, gh_available


def draft_pr_from_summary(summary_md: str, repo: str, branch: str = "ai-intel/apply-insight") -> Dict:
    """Placeholder: returns a PR draft spec. Implement GH API later."""
    return {
        "repo": repo,
        "branch": branch,
        "title": "Apply AI Insight",
        "body": summary_md[:4000],
        "changes": [],
    }


def apply_to_repo_from_item(item_dir: Path, repo_dir: Path, branch: str = "ai-intel/apply-insight", dry_run: bool = True) -> Dict:
    """Create a branch, add a summary file, commit, and open PR via gh CLI.
    Returns a result dict with status and messages. Safe in dry_run.
    """
    summary_path = item_dir / "summary.md"
    if not summary_path.exists():
        return {"ok": False, "error": "summary.md not found in item_dir"}
    summary_md = summary_path.read_text(encoding="utf-8")
    repo_dir = Path(repo_dir)
    if not (repo_dir / ".git").exists():
        return {"ok": False, "error": "repo_dir is not a git repository"}

    # Create branch and add file under docs/insights
    insights_dir = repo_dir / "docs" / "ai-insights"
    rel_file = insights_dir / f"{item_dir.name}.md"
    if not dry_run:
        subprocess.run(["git", "checkout", "-b", branch], cwd=str(repo_dir), check=False)
        insights_dir.mkdir(parents=True, exist_ok=True)
        rel_file.write_text(summary_md, encoding="utf-8")
        subprocess.run(["git", "add", str(rel_file.relative_to(repo_dir))], cwd=str(repo_dir), check=False)
        subprocess.run(["git", "commit", "-m", f"Add AI insight {item_dir.name}"], cwd=str(repo_dir), check=False)
        # push branch
        subprocess.run(["git", "push", "-u", "origin", branch], cwd=str(repo_dir), check=False)

    # PR via gh CLI
    rc = run_gh_pr_create(repo_dir, title=f"Apply AI insight {item_dir.name}", body=summary_md[:4000], branch=branch, base=None, dry_run=dry_run)
    return {"ok": rc == 0, "dry_run": dry_run, "gh_available": gh_available(), "branch": branch, "file": str(rel_file)}
