from __future__ import annotations

import os
import json
import requests
from typing import Optional


def send_webhook_alert(text: str, webhook_url: Optional[str] = None, channel: Optional[str] = None) -> bool:
    """Send a simple text alert to Slack/Discord-compatible webhook.

    For Slack: set ALERT_WEBHOOK_URL and optionally ALERT_CHANNEL (e.g., "#ai-intel").
    """
    url = webhook_url or os.getenv("ALERT_WEBHOOK_URL")
    if not url:
        return False
    payload = {"text": text}
    ch = channel or os.getenv("ALERT_CHANNEL")
    if ch:
        payload["channel"] = ch
    try:
        r = requests.post(url, data=json.dumps(payload), headers={"Content-Type": "application/json"}, timeout=10)
        return 200 <= r.status_code < 300
    except Exception:
        return False
