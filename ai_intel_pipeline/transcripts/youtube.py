from __future__ import annotations

from typing import Dict, List, Optional, Tuple
from pathlib import Path
import os
import tempfile

from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound


def extract_video_id(url: str) -> Optional[str]:
    # Basic parsing for watch?v= and youtu.be links
    if "watch?v=" in url:
        return url.split("watch?v=")[-1].split("&")[0]
    if "youtu.be/" in url:
        return url.split("youtu.be/")[-1].split("?")[0]
    return None


def fetch_captions_segments(url: str) -> Optional[List[Dict]]:
    vid = extract_video_id(url)
    if not vid:
        return None
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(vid)
        # Prefer English
        try:
            t = transcript_list.find_transcript(["en", "en-US"]).fetch()
        except Exception:
            t = transcript_list.find_manually_created_transcript(["en"]).fetch()
        segments = []
        for seg in t:
            segments.append({
                "t_start": float(seg.get("start", 0.0)),
                "t_end": float(seg.get("start", 0.0)) + float(seg.get("duration", 0.0)),
                "text": seg.get("text", ""),
            })
        return segments
    except (TranscriptsDisabled, NoTranscriptFound):
        return None
    except Exception:
        return None


def transcribe_with_openai(url: str) -> Optional[List[Dict]]:
    """Download audio via yt-dlp and transcribe with OpenAI if key present.
    Returns segments if available, else single segment.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from yt_dlp import YoutubeDL
        from openai import OpenAI
    except Exception:
        return None
    # Download audio to temp file
    tmpdir = Path(tempfile.mkdtemp())
    outtmpl = str(tmpdir / "%(id)s.%(ext)s")
    ydl_opts = {
        "quiet": True,
        "skip_download": False,
        "format": "bestaudio/best",
        "outtmpl": outtmpl,
        "noplaylist": True,
    }
    audio_path: Optional[Path] = None
    try:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            fn = ydl.prepare_filename(info)
            audio_path = Path(fn)
    except Exception:
        return None

    if not audio_path or not audio_path.exists():
        return None

    try:
        client = OpenAI()
        # Prefer the modern lightweight transcribe model; fallback to whisper-1
        model = os.getenv("OPENAI_TRANSCRIBE_MODEL", "gpt-4o-mini-transcribe")
        with audio_path.open("rb") as f:
            resp = client.audio.transcriptions.create(model=model, file=f, response_format="verbose_json")
        # openai>=2 returns a pydantic model or dict-like
        segments = []
        if hasattr(resp, "segments") and resp.segments:
            for s in resp.segments:
                segments.append({
                    "t_start": float(getattr(s, "start", 0.0) or 0.0),
                    "t_end": float(getattr(s, "end", 0.0) or 0.0),
                    "text": getattr(s, "text", "") or "",
                })
        else:
            text = getattr(resp, "text", None) or (resp.get("text") if isinstance(resp, dict) else "")
            segments = [{"t_start": 0.0, "t_end": 0.0, "text": text or ""}]
        return segments
    except Exception:
        return None


def get_transcript_segments(url: str) -> Optional[List[Dict]]:
    """Try captions first, then OpenAI fallback."""
    segs = fetch_captions_segments(url)
    if segs:
        return segs
    return transcribe_with_openai(url)

