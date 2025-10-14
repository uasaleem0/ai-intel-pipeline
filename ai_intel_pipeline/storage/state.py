from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Set


class State:
    def __init__(self, path: Path):
        self.path = path
        self.seen_urls: Set[str] = set()
        self.seen_uids: Set[str] = set()
        self.stt_budget: Dict[str, int] = {}
        self._load()

    def _load(self):
        if self.path.exists():
            try:
                data = json.loads(self.path.read_text(encoding="utf-8"))
                self.seen_urls = set(data.get("seen_urls", []))
                self.seen_uids = set(data.get("seen_uids", []))
            except Exception:
                self.seen_urls = set()
                self.seen_uids = set()
                self.stt_budget = {}

    def save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "seen_urls": sorted(list(self.seen_urls)),
            "seen_uids": sorted(list(self.seen_uids)),
            "stt_budget": self.stt_budget,
        }
        self.path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def mark(self, url: str | None = None, uid: str | None = None):
        if url:
            self.seen_urls.add(url)
        if uid:
            self.seen_uids.add(uid)

    def seen(self, url: str | None = None, uid: str | None = None) -> bool:
        if url and url in self.seen_urls:
            return True
        if uid and uid in self.seen_uids:
            return True
        return False

    # Speech-to-text (Whisper/OpenAI) budget tracking
    def stt_minutes_used(self, date_key: str) -> int:
        return int(self.stt_budget.get(date_key, 0))

    def can_spend_stt(self, minutes: int, date_key: str, daily_limit: int) -> bool:
        used = self.stt_minutes_used(date_key)
        return (used + minutes) <= daily_limit

    def spend_stt(self, minutes: int, date_key: str):
        used = self.stt_minutes_used(date_key)
        self.stt_budget[date_key] = used + minutes
