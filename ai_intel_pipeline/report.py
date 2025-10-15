from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Dict, List


def _safe_read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def generate_status(vault_root: Path, index_csv: Path) -> Dict:
    idx_rows: List[Dict] = []
    if index_csv.exists():
        with index_csv.open("r", encoding="utf-8") as f:
            idx_rows = list(csv.DictReader(f))
    items_dir = vault_root / "items"
    item_folders = [p for p in items_dir.rglob("*") if p.is_dir() and (p / "item.json").exists()]

    source_counts: Dict[str, int] = {}
    type_counts: Dict[str, int] = {}
    pillar_counts: Dict[str, int] = {}
    ev_pass = ev_fail = 0
    conf_sum = 0.0
    conf_n = 0
    transcripts = 0
    transcripts_fallback = 0

    for folder in item_folders:
        item = _safe_read_json(folder / "item.json") or {}
        src = item.get("source_type", "unknown")
        typ = item.get("type", "unknown")
        source_counts[src] = source_counts.get(src, 0) + 1
        type_counts[typ] = type_counts.get(typ, 0) + 1
        for p in item.get("pillars", []) or []:
            pillar_counts[p] = pillar_counts.get(p, 0) + 1

        ev = _safe_read_json(folder / "evidence.json") or {}
        verdict = (ev.get("verdict") or "").lower()
        if verdict == "pass":
            ev_pass += 1
        elif verdict == "fail":
            ev_fail += 1
        c = ev.get("confidence")
        try:
            conf_sum += float(c)
            conf_n += 1
        except Exception:
            pass

        tr = _safe_read_json(folder / "transcript.json")
        if tr:
            transcripts += 1
            if tr.get("fallback"):
                transcripts_fallback += 1

    avg_conf = (conf_sum / conf_n) if conf_n else 0.0

    # Top items by overall score from index.csv
    top_items = []
    try:
        rows = sorted(idx_rows, key=lambda r: float(r.get("overall", 0) or 0), reverse=True)[:5]
        for r in rows:
            top_items.append({
                "item_id": r.get("item_id"),
                "title": r.get("title"),
                "url": r.get("url"),
                "overall": float(r.get("overall", 0) or 0),
                "relevance": float(r.get("relevance", 0) or 0),
                "actionability": float(r.get("actionability", 0) or 0),
                "credibility": float(r.get("credibility", 0) or 0),
            })
    except Exception:
        pass

    return {
        "counts": {
            "items": len(item_folders),
            "evidence": ev_pass + ev_fail,
            "evidence_pass": ev_pass,
            "evidence_fail": ev_fail,
            "avg_confidence": round(avg_conf, 2),
            "transcripts": transcripts,
            "transcripts_fallback": transcripts_fallback,
        },
        "by_source": source_counts,
        "by_type": type_counts,
        "pillars": pillar_counts,
        "top_items": top_items,
    }


def write_report(vault_root: Path, index_csv: Path) -> Path:
    data = generate_status(vault_root, index_csv)
    out_dir = vault_root / "status"
    out_dir.mkdir(parents=True, exist_ok=True)
    # Save JSON
    (out_dir / "report.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    # Save Markdown
    lines = []
    lines.append("# AI Intel Daily Status\n")
    c = data["counts"]
    lines.append(f"- Items: {c['items']}")
    lines.append(f"- Evidence: {c['evidence']} (pass {c['evidence_pass']} / fail {c['evidence_fail']}), avg confidence {c['avg_confidence']}")
    lines.append(f"- Transcripts: {c['transcripts']} (fallback {c['transcripts_fallback']})\n")
    # Sources
    lines.append("## By Source")
    for k, v in sorted(data["by_source"].items(), key=lambda kv: kv[1], reverse=True):
        lines.append(f"- {k}: {v}")
    # Types
    lines.append("\n## By Type")
    for k, v in sorted(data["by_type"].items(), key=lambda kv: kv[1], reverse=True):
        lines.append(f"- {k}: {v}")
    # Pillars
    lines.append("\n## Pillars")
    for k, v in sorted(data["pillars"].items(), key=lambda kv: kv[1], reverse=True):
        lines.append(f"- {k}: {v}")
    # Top items
    lines.append("\n## Top Items (Overall)")
    for t in data["top_items"]:
        lines.append(f"- {t['title']} — {t['overall']:.3f}")
        lines.append(f"  {t['url']}")
    out_path = out_dir / "report.md"
    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    # Email HTML (simple)
    email_lines = []
    email_lines.append("<html><body style='font-family:Arial,sans-serif'>")
    email_lines.append("<h2>AI Intel Daily Status</h2>")
    email_lines.append(f"<p><b>Items:</b> {c['items']} | <b>Evidence:</b> {c['evidence']} (pass {c['evidence_pass']} / fail {c['evidence_fail']}) | <b>Avg confidence:</b> {c['avg_confidence']}</p>")
    email_lines.append(f"<p><b>Transcripts:</b> {c['transcripts']} (fallback {c['transcripts_fallback']})</p>")
    # Sources/types
    def dict_to_ul(d):
        if not d:
            return "<ul><li>—</li></ul>"
        return "<ul>" + "".join([f"<li>{k}: {v}</li>" for k,v in sorted(d.items(), key=lambda kv: kv[1], reverse=True)]) + "</ul>"
    email_lines.append("<h3>By Source</h3>" + dict_to_ul(data["by_source"]))
    email_lines.append("<h3>By Type</h3>" + dict_to_ul(data["by_type"]))
    email_lines.append("<h3>Pillars</h3>" + dict_to_ul(data["pillars"]))
    # Top items
    email_lines.append("<h3>Top Items</h3><ol>")
    for t in data["top_items"]:
        email_lines.append(f"<li><a href='{t['url']}'>{t['title']}</a> — {t['overall']:.3f}</li>")
    email_lines.append("</ol>")
    email_lines.append("<p>Full weekly digest attached.</p>")
    email_lines.append("</body></html>")
    (out_dir / "email.html").write_text("\n".join(email_lines), encoding="utf-8")
    (out_dir / "email.txt").write_text("\n".join(lines), encoding="utf-8")
    return out_path
