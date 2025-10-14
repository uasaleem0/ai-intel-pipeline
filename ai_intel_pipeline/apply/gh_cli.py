from __future__ import annotations

import os
import subprocess
from shutil import which
from pathlib import Path
from typing import Optional


def gh_available() -> bool:
    return which("gh") is not None


def run_gh_pr_create(repo_dir: Path, title: str, body: str, branch: str, base: Optional[str] = None, dry_run: bool = True) -> int:
    """Invoke GitHub CLI to create a PR. Returns process returncode.
    Requires repo_dir to be a git repo with a remote.
    """
    args = ["gh", "pr", "create", "--title", title, "--body", body, "--head", branch]
    if base:
        args.extend(["--base", base])
    if dry_run or not gh_available():
        # Just print command; skip execution
        print("[DRY-RUN] Would run:", " ".join(args))
        return 0
    proc = subprocess.run(args, cwd=str(repo_dir))
    return proc.returncode

