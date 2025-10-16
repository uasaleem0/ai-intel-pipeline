from __future__ import annotations

import csv
import json
import os
from datetime import datetime, timezone
import shutil
from pathlib import Path
from typing import Dict, List
from .model.recommend import recommend as rec_top


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

    data = {
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
    return data


def write_report(vault_root: Path, index_csv: Path) -> Path:
    data = generate_status(vault_root, index_csv)
    out_dir = vault_root / "status"
    out_dir.mkdir(parents=True, exist_ok=True)
    # Augment with recommendations for consumers, enriched with TL;DR and apply steps
    def _enrich_summary(item_id: str) -> Dict:
        month = f"{item_id[:4]}-{item_id[4:6]}"
        s_path = out_dir.parent / "items" / month / item_id / "summary.md"
        out = {"tldr": "", "apply_steps": [], "why": "", "pillars": [], "source": "", "source_type": "", "type": "", "date": ""}
        try:
            if s_path.exists():
                txt = s_path.read_text(encoding="utf-8")
                lines = [l.rstrip() for l in txt.splitlines()]
                def _extract(name: str) -> str:
                    if name in lines:
                        i = lines.index(name) + 1
                        buf = []
                        while i < len(lines) and lines[i] and not lines[i].endswith(":"):
                            buf.append(lines[i])
                            i += 1
                        return " ".join(buf)[:500]
                    return ""
                out["tldr"] = _extract("TL;DR")
                apply_block = _extract("Apply steps")
                out["apply_steps"] = [ln for ln in apply_block.split("\\n") if ln][:6]
                out["why"] = _extract("Why it matters")
        except Exception:
            pass
        try:
            j_path = out_dir.parent / "items" / month / item_id / "item.json"
            if j_path.exists():
                meta = json.loads(j_path.read_text(encoding="utf-8"))
                out["pillars"] = meta.get("pillars") or []
                out["source_type"] = meta.get("source_type") or ""
                out["type"] = meta.get("type") or ""
                out["date"] = meta.get("date") or meta.get("date_published") or ""
        except Exception:
            pass
        return out

    try:
        from ..config import load_profile
        recs_for_json = rec_top(vault_root, index_csv, Path("vault/model"), load_profile(), top_k=8)
        for r in recs_for_json:
            iid = r.get("item_id")
            if iid:
                enr = _enrich_summary(iid)
                r.update(enr)
        data["recommendations"] = recs_for_json
    except Exception:
        data["recommendations"] = []

    # Enrich top items with TL;DR and apply steps into top_items_detail
    top_items_detail = []
    for t in data.get("top_items", []):
        iid = t.get("item_id")
        rec = dict(t)
        if iid:
            rec.update(_enrich_summary(iid))
        top_items_detail.append(rec)
    data["top_items_detail"] = top_items_detail
    # Build items.json (for filtering/sorting in UI)
    items = []
    try:
        if index_csv.exists():
            with index_csv.open('r', encoding='utf-8') as f:
                for r in csv.DictReader(f):
                    iid = r.get('item_id')
                    if not iid:
                        continue
                    meta = _enrich_summary(iid)
                    item = {
                        'item_id': iid,
                        'title': r.get('title'),
                        'url': r.get('url'),
                        'source': r.get('source'),
                        'type': r.get('type') or meta.get('type') or '',
                        'source_type': meta.get('source_type') or '',
                        'date': r.get('date') or meta.get('date') or '',
                        'overall': float(r.get('overall') or 0) if r.get('overall') else 0.0,
                        'credibility': float(r.get('credibility') or 0) if r.get('credibility') else 0.0,
                        'relevance': float(r.get('relevance') or 0) if r.get('relevance') else 0.0,
                        'actionability': float(r.get('actionability') or 0) if r.get('actionability') else 0.0,
                        'pillars': meta.get('pillars') or [],
                        'tldr': meta.get('tldr') or '',
                        'why': meta.get('why') or '',
                        'apply_steps': meta.get('apply_steps') or [],
                    }
                    items.append(item)
    except Exception:
        pass
    (out_dir / 'items.json').write_text(json.dumps(items, indent=2), encoding='utf-8')
    # Save JSON (dashboard data)
    # Derive daily history buckets (items, pass_rate, avg_conf where available)
    try:
        day_stats = {}
        items_root = vault_root / 'items'
        for day_dir in items_root.rglob('*'):
            if not day_dir.is_dir():
                continue
        # Use items.json to build per-day counts quickly
        _items_text = (out_dir / 'items.json').read_text(encoding='utf-8')
        _items = json.loads(_items_text) if _items_text else []
        for it in _items:
            d = (it.get('date') or '')[:10]
            if not d:
                continue
            s_ = day_stats.setdefault(d, {'items':0})
            s_['items'] += 1
        data['history_daily'] = [{'date':k, **v} for k,v in sorted(day_stats.items())]
    except Exception:
        data['history_daily'] = []
    # Model index info
    try:
        mdir = Path('vault/model')
        if mdir.exists():
            files = list(mdir.rglob('*'))
            data['model_index'] = {
                'doc_count': len([x for x in files if x.is_file()]),
                'last_built_ts': max([x.stat().st_mtime for x in files if x.is_file()]) if files else None,
            }
        else:
            data['model_index'] = {'doc_count': 0, 'last_built_ts': None}
    except Exception:
        data['model_index'] = {'doc_count': 0, 'last_built_ts': None}
    (out_dir / "report.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    # Surface useful artifacts alongside the dashboard when available
    try:
        if index_csv.exists():
            shutil.copy2(index_csv, out_dir / "index.csv")
    except Exception:
        pass
    try:
        # Copy latest weekly digest markdown (if any) to status for easy linking
        weekly_dir = vault_root.parent / "digests" / "weekly"
        if weekly_dir.exists():
            md_files = sorted([p for p in weekly_dir.glob("*.md")], key=lambda p: p.stat().st_mtime, reverse=True)
            if md_files:
                shutil.copy2(md_files[0], out_dir / "weekly-latest.md")
    except Exception:
        pass
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
    # Top recommendations (embedding-based)
    try:
        from ..config import load_profile
        profile = load_profile()
        model_dir = Path("vault/model")
        recs = rec_top(vault_root, index_csv, model_dir, profile, top_k=5)
        lines.append("\n## Top Recommendations (Embedding-Based)")
        for r in recs:
            lines.append(f"- {r['title']} â€” {r['scores']['combined']:.3f}")
            lines.append(f"  {r['url']}")
    except Exception:
        pass
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
            return "<ul><li>â€”</li></ul>"
        return "<ul>" + "".join([f"<li>{k}: {v}</li>" for k,v in sorted(d.items(), key=lambda kv: kv[1], reverse=True)]) + "</ul>"
    email_lines.append("<h3>By Source</h3>" + dict_to_ul(data["by_source"]))
    email_lines.append("<h3>By Type</h3>" + dict_to_ul(data["by_type"]))
    email_lines.append("<h3>Pillars</h3>" + dict_to_ul(data["pillars"]))
    # Top items
    email_lines.append("<h3>Top Items</h3><ol>")
    for t in data["top_items"]:
        email_lines.append(f"<li><a href='{t['url']}'>{t['title']}</a> â€” {t['overall']:.3f}</li>")
    email_lines.append("</ol>")
    # Recommended (embedding)
    try:
        from ..config import load_profile
        profile = load_profile()
        model_dir = Path("vault/model")
        recs = rec_top(vault_root, index_csv, model_dir, profile, top_k=5)
        email_lines.append("<h3>Top Recommendations</h3><ol>")
        for r in recs:
            email_lines.append(f"<li><a href='{r['url']}'>{r['title']}</a> â€” {r['scores']['combined']:.3f}</li>")
        email_lines.append("</ol>")
    except Exception:
        pass
    email_lines.append("<p>Full weekly digest attached.</p>")
    email_lines.append("</body></html>")
    (out_dir / "email.html").write_text("\n".join(email_lines), encoding="utf-8")
    (out_dir / "email.txt").write_text("\n".join(lines), encoding="utf-8")
    # Append history
    hist_path = out_dir / "history.json"
    try:
        hist = json.loads(hist_path.read_text(encoding="utf-8")) if hist_path.exists() else []
    except Exception:
        hist = []
    run_id = os.getenv("GITHUB_RUN_ID")
    repo = os.getenv("GITHUB_REPOSITORY")
    server = os.getenv("GITHUB_SERVER_URL", "https://github.com")
    run_url = f"{server}/{repo}/actions/runs/{run_id}" if run_id and repo else None
    hist.append({
        "ts": datetime.now(timezone.utc).isoformat(),
        "items": c["items"],
        "evidence_pass": c["evidence_pass"],
        "evidence_fail": c["evidence_fail"],
        "avg_confidence": c["avg_confidence"],
        "transcripts": c["transcripts"],
        "transcripts_fallback": c["transcripts_fallback"],
        "run_url": run_url,
    
        "status": "success",
    })
    hist_path.write_text(json.dumps(hist[-50:], indent=2), encoding="utf-8")
    # Dashboard HTML (dark mode + charts + search using pure JS)
    # Load report.json and history.json dynamically; render charts via Chart.js CDN; style via Tailwind CDN.
    html = """
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <title>AI Intel Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script>
    <style>
      :root { color-scheme: dark; }
      body { background: #0b0f19; color: #e5e7eb; }
      .card { background:#111827; border:1px solid #1f2937; border-radius:0.75rem; padding:1rem; }
      a { color:#60a5fa; } a:hover { text-decoration: underline; }
      .pill { display:inline-block; background:#1f2937; padding:2px 8px; border-radius:999px; margin-right:6px; font-size:12px; }
      .sidebar-link { display:flex; align-items:center; gap:.75rem; padding:.5rem .75rem; border-radius:.5rem; color:#9ca3af; }
      .sidebar-link:hover { background:#0f172a; color:#e5e7eb; }
      .sidebar-link.active { background:#0f172a; color:#fff; border:1px solid #1f2937; }
      .seg button { border:1px solid #374151; padding:.35rem .6rem; border-radius:.5rem; background:#0f172a; color:#cbd5e1; }
      .seg button.active { background:#2563eb; color:white; border-color:#1d4ed8; }
      .chip { display:inline-block; padding:.25rem .6rem; border-radius:9999px; background:#0f172a; border:1px solid #1f2937; margin:.2rem; cursor:pointer; }
      .chip:hover { background:#111b33; }
    </style>
  </head>
  <body class="min-h-screen">
    <div class="min-h-screen flex">
      <aside id="sidebar" class="hidden md:block w-64 shrink-0 bg-[#0d1220] border-r border-gray-800 p-4">
        <div class="text-lg font-semibold mb-4">AI Intel</div>
        <nav class="space-y-1">
          <a class="sidebar-link active" href="#overview" data-nav="overview">Overview</a>
          <a class="sidebar-link" href="#items" data-nav="items">Items</a>
        </nav>
        <div class="mt-6">
          <div class="text-xs uppercase tracking-wider text-gray-500 mb-2">System Health</div>
          <div class="card text-sm">
            <div id="healthLastRun" class="mb-1 text-gray-300">Last run: -</div>
            <div id="healthItems" class="mb-1 text-gray-300">Items: -</div>
            <div id="healthPassRate" class="mb-1 text-gray-300">Pass rate: -</div>
            <div id="healthRuns30d" class="text-gray-300">Runs (30d): -</div>
          </div>
        </div>
      </aside>
      <div class="flex-1 flex flex-col">
        <header class="sticky top-0 z-10 backdrop-blur bg-[#0b0f19]/70 border-b border-gray-800">
          <div class="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <button id="toggleSidebar" class="px-2 py-1 rounded bg-gray-800 border border-gray-700 md:hidden">☰</button>
            <div class="font-bold mr-auto">AI Intel Dashboard</div>
            <input id="globalSearch" placeholder="Search" class="w-56 md:w-96 bg-gray-900 text-gray-100 rounded px-3 py-2 border border-gray-700" />
            <div class="seg hidden sm:flex items-center gap-1 ml-2" id="dateSeg">
              <button data-days="7">7d</button>
              <button class="active" data-days="30">30d</button>
              <button data-days="90">90d</button>
              <button data-days="all">All</button>
            </div>
            <button id="btnAddSource" class="ml-2 px-3 py-2 rounded bg-blue-600 hover:bg-blue-500">Add Source</button>
            <div id="lastUpdated" class="text-xs text-gray-400 ml-2"></div>
          </div>
        </header>
        <main class="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <div class="flex flex-wrap gap-3 text-xs text-gray-400">
            <a href="index.csv" class="px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300">Download Index (CSV)</a>
            <a href="weekly-latest.md" class="px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300">Weekly Digest (Markdown)</a>
          </div>

          <section id="overview" class="space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div class="card lg:col-span-2">
                <h3 class="mb-2 font-semibold">What Changed</h3>
                <div id="whatChanged" class="text-sm text-gray-300">Loading...</div>
              </div>
              <div class="card">
                <h3 class="mb-2 font-semibold">For You</h3>
                <div id="forYou" class="space-y-3 text-sm"></div>
              </div>
            </div>

            <div class="card">
              <h3 class="mb-3 font-semibold">Action Queue</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div id="aqUnreviewed" class="card hover:bg-gray-800 cursor-pointer">
                  <div class="text-gray-400">Unreviewed</div>
                  <div class="text-2xl font-bold" id="aqUnreviewedCount">-</div>
                </div>
                <div id="aqEvidence" class="card hover:bg-gray-800 cursor-pointer">
                  <div class="text-gray-400">Needs Evidence Review</div>
                  <div class="text-2xl font-bold" id="aqEvidenceCount">-</div>
                </div>
                <div id="aqReady" class="card hover:bg-gray-800 cursor-pointer">
                  <div class="text-gray-400">Ready to Apply</div>
                  <div class="text-2xl font-bold" id="aqReadyCount">-</div>
                </div>
              </div>
            </div>

            <div class="card">
              <h3 class="mb-3 font-semibold">Browse</h3>
              <div class="mb-2 text-xs text-gray-400">By Source</div>
              <div id="browseSources" class="mb-3"></div>
              <div class="mb-2 text-xs text-gray-400">By Pillar</div>
              <div id="browsePillars"></div>
            </div>
          </section>

          <section id="items" class="card">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold">Items</h3>
              <div id="activeFilters" class="text-xs text-gray-400"></div>
            </div>
            <div id="itemsTable" class="text-sm"></div>
          </section>

          <details id="analytics" class="card">
            <summary class="cursor-pointer font-semibold">Analytics</summary>
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-3">
              <div class="card"><h3 class="mb-2 font-semibold">By Source</h3><canvas id="chartSource"></canvas></div>
              <div class="card"><h3 class="mb-2 font-semibold">By Type</h3><canvas id="chartType"></canvas></div>
              <div class="card"><h3 class="mb-2 font-semibold">Pillars</h3><canvas id="chartPillars"></canvas></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div class="card"><h3 class="mb-2 font-semibold">Trend: Items / day</h3><canvas id="chartTrendItems"></canvas></div>
              <div class="card"><h3 class="mb-2 font-semibold">Run History</h3><div id="history" class="text-sm"></div></div>
            </div>
          </details>
        </main>
      </div>
    </div>

    <!-- Add Source Modal -->
    <div id="addSourceModal" class="hidden fixed inset-0 z-50 items-center justify-center">
      <div class="absolute inset-0 bg-black/60"></div>
      <div class="relative z-10 w-[90%] max-w-lg card">
        <h3 class="mb-3 font-semibold">Add Source</h3>
        <input id="modalUrl" placeholder="Paste YouTube or GitHub URL" class="w-full bg-gray-900 text-gray-100 rounded px-3 py-2 border border-gray-700 mb-3" />
        <div class="flex gap-2">
          <a id="modalIngestWorkflow" target="_blank" class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500">Open Ingest Workflow</a>
          <a id="modalIngestIssue" target="_blank" class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600">Open Ingest Issue</a>
          <button id="modalClose" class="ml-auto px-3 py-2 rounded bg-gray-800 border border-gray-700">Close</button>
        </div>
      </div>
    </div>

    <!-- Toasts -->
    <div id="toastContainer" class="fixed bottom-4 right-4 space-y-2 z-50"></div>

    <script>
      function showToast(msg, variant='info'){
        const c = document.getElementById('toastContainer');
        const el = document.createElement('div');
        const color = variant==='success' ? 'bg-green-600' : variant==='error' ? 'bg-red-600' : 'bg-gray-700';
        el.className = `px-3 py-2 rounded text-white shadow ${color}`;
        el.textContent = msg;
        c.appendChild(el);
        setTimeout(()=>{ el.remove(); }, 3000);
      }
      async function loadJSON(path) { const res = await fetch(path + '?cache=' + Date.now()); return await res.json(); }

      function withinRange(d, days){ if(days==='all') return true; const cutoff = dayjs().subtract(Number(days), 'day'); return dayjs(d).isAfter(cutoff); }

      function barChart(ctx, labels, data) { new Chart(ctx, { type:'bar', data: { labels, datasets:[{ label:'Count', data, backgroundColor:'#60a5fa' }] }, options: { plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:'#9ca3af' } }, y:{ ticks:{ color:'#9ca3af' }, beginAtZero:true, grid:{ color:'#1f2937' } } } }); }
      function lineChart(ctx, labels, data){ new Chart(ctx, { type:'line', data: { labels, datasets:[{ label:'Items', data, borderColor:'#60a5fa', backgroundColor:'#60a5fa22', fill:true, tension:.2 }] }, options: { plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:'#9ca3af' } }, y:{ ticks:{ color:'#9ca3af' }, beginAtZero:true, grid:{ color:'#1f2937' } } } }); }

      function renderCharts(rep){ const sL = Object.keys(rep.by_source), sV = Object.values(rep.by_source); const tL = Object.keys(rep.by_type), tV = Object.values(rep.by_type); const pL = Object.keys(rep.pillars), pV = Object.values(rep.pillars); barChart(document.getElementById('chartSource'), sL, sV); barChart(document.getElementById('chartType'), tL, tV); barChart(document.getElementById('chartPillars'), pL, pV); }

      function updateHealth(rep, hist){ const c = rep.counts; const last = hist && hist.length ? hist[hist.length-1] : null; const runs30 = (hist||[]).filter(h => dayjs(h.ts).isAfter(dayjs().subtract(30,'day'))).length; document.getElementById('healthItems').textContent = `Items: ${c.items}`; const passRate = c.evidence ? (c.evidence_pass/c.evidence) : 0; document.getElementById('healthPassRate').textContent = `Pass rate: ${(passRate*100).toFixed(1)}%`; document.getElementById('healthRuns30d').textContent = `Runs (30d): ${runs30}`; if(last){ const lu = new Date(last.ts).toLocaleString(); const run = last.run_url ? ` - `+ `<a target='_blank' href='${last.run_url}'>run</a>` : ''; const status = last.status ? ` (${last.status})` : ''; document.getElementById('healthLastRun').innerHTML = `Last run: ${lu}${status}${run}`; } }

      function renderForYou(rep){ const el = document.getElementById('forYou'); const recs = (rep.recommendations||[]).slice(0,3); if(!recs.length){ el.innerHTML = '<div class="text-gray-400">No recommendations yet.</div>'; return; } el.innerHTML = recs.map(r => (`<div><div class='font-medium'>${r.title}</div><div class='text-xs text-gray-400 mb-1'>score: ${Number(r.scores?.combined||0).toFixed(3)} · pillars: ${(r.pillars||[]).join(', ')}</div>${r.tldr?`<div class='mb-1'>${r.tldr}</div>`:''}<a href='${r.url}' target='_blank'>Open</a></div>`)).join(''); }

      function renderWhatChanged(hist){ const el = document.getElementById('whatChanged'); if(!hist || hist.length<2){ el.textContent = 'Not enough history yet.'; return; } const last = hist[hist.length-1], prev = hist[hist.length-2]; const itemsDelta = last.items - prev.items; const passRate = last.evidence ? (last.evidence_pass/last.evidence) : 0; const prevPass = prev.evidence ? (prev.evidence_pass/prev.evidence) : 0; const passDelta = (passRate - prevPass) * 100; el.innerHTML = `<ul class='list-disc ml-5'><li>${itemsDelta>=0?'+':''}${itemsDelta} items vs previous run</li><li>Pass rate ${(passRate*100).toFixed(1)}% (${passDelta>=0?'+':''}${passDelta.toFixed(1)}pp)</li><li>See Analytics for source/pillar shifts</li></ul>`; }

      function chip(label, onclick){ const d=document.createElement('span'); d.className='chip'; d.textContent=label; d.onclick=onclick; return d; }

      function renderBrowse(rep, items){ const bs = document.getElementById('browseSources'); const bp = document.getElementById('browsePillars'); bs.innerHTML=''; bp.innerHTML=''; const srcs = Object.entries(rep.by_source||{}); srcs.sort((a,b)=>b[1]-a[1]); srcs.forEach(([k,v])=> bs.appendChild(chip(`${k} (${v})`, ()=>applyFilter({sourceType:k})))); const pillars = Object.entries(rep.pillars||{}); pillars.sort((a,b)=>b[1]-a[1]); pillars.slice(0,5).forEach(([k,v])=> bp.appendChild(chip(`${k} (${v})`, ()=>applyFilter({pillar:k})))); }

      let currentDays='30', currentQuery='', currentPillar='', currentSourceType='';
      function applyFilter({pillar=null, sourceType=null}={}){ if(pillar!==null) currentPillar=pillar; if(sourceType!==null) currentSourceType=sourceType; document.querySelector('[data-nav="items"]').click(); renderItems(window.__items, currentDays, currentQuery, currentPillar, currentSourceType); showActiveFilters(); }
      function clearFilters(){ currentPillar=''; currentSourceType=''; showActiveFilters(); renderItems(window.__items, currentDays, currentQuery, currentPillar, currentSourceType); }
      function showActiveFilters(){ const el=document.getElementById('activeFilters'); const parts=[]; if(currentPillar) parts.push(`Pillar: ${currentPillar}`); if(currentSourceType) parts.push(`Source: ${currentSourceType}`); el.innerHTML = parts.length? parts.join(' · ') + ` · <button class='underline' onclick='clearFilters()'>Clear</button>` : ''; }

      function renderItems(items, days, q, pillar, sourceType){ const el = document.getElementById('itemsTable'); let list = items.filter(it=>!days || withinRange(it.date, days)); if(q){ const ql=q.toLowerCase(); list = list.filter(it=> (it.title||'').toLowerCase().includes(ql) || (it.tldr||'').toLowerCase().includes(ql) || (it.why||'').toLowerCase().includes(ql) || (it.pillars||[]).join(' ').toLowerCase().includes(ql)); } if(pillar){ list = list.filter(it=> (it.pillars||[]).includes(pillar)); } if(sourceType){ const st = sourceType.toLowerCase(); list = list.filter(it=> (it.source_type||'').toLowerCase()===st); } list = list.sort((a,b)=>(b.overall||0)-(a.overall||0)); const rows = list.slice(0,30).map(it=>{ const pills = (it.pillars||[]).map(p=>`<span class='pill'>${p}</span>`).join(''); const id = `row_${it.item_id}`; return `<div class='border-b border-gray-800 py-2'><div class='flex items-center justify-between gap-3'><div class='min-w-0'><div class='font-medium truncate'>${it.title}</div><div class='text-xs text-gray-400'>${(it.source_type||it.source||'')} | ${new Date(it.date).toLocaleDateString()} | score ${Number(it.overall||0).toFixed(3)}</div><div class='mt-1'>${pills}</div></div><div class='flex items-center gap-2'><a class='text-sm' href='${it.url}' target='_blank'>Open</a><button class='text-sm px-2 py-1 rounded bg-gray-800 border border-gray-700' onclick="const d=document.getElementById('${id}'); d.classList.toggle('hidden');">Details</button></div></div><div id='${id}' class='hidden mt-2 text-sm'>${it.tldr?`<div class='mb-2'><span class='text-gray-400'>TL;DR:</span> ${it.tldr}</div>`:''}${it.why?`<div class='mb-2'><span class='text-gray-400'>Why it matters:</span> ${it.why}</div>`:''}${(it.apply_steps||[]).length?`<div class='mb-2'><div class='text-gray-400'>Apply steps:</div><ul class='list-disc ml-5'>${it.apply_steps.map(s=>`<li>${s}</li>`).join('')}</ul></div>`:''}</div></div>` }).join(''); el.innerHTML = rows || `<div class='text-gray-400'>No items in this range. Try changing filters.</div>`; }

      function updateAQ(items){ const now30 = dayjs().subtract(30,'day'); const unreviewed = items.filter(it=> (!it.verdict) && (!it.confidence || it.confidence<0.5) && dayjs(it.date).isAfter(now30)).length; const needsEv = items.filter(it=> (it.verdict==='fail' || (it.confidence!=null && it.confidence<0.5))).length; const ready = items.filter(it=> (Number(it.overall||0)>=0.6) && (Number(it.credibility||0)>=0.7) && (Number(it.actionability||0)>=0.6) && (it.verdict==='pass' || (it.confidence!=null && it.confidence>=0.6))).length; document.getElementById('aqUnreviewedCount').textContent = unreviewed; document.getElementById('aqEvidenceCount').textContent = needsEv; document.getElementById('aqReadyCount').textContent = ready; document.getElementById('aqUnreviewed').onclick = ()=>{ applyFilter({}); currentQuery=''; currentPillar=''; currentSourceType=''; renderItems(window.__items, '30', '', '', ''); }; document.getElementById('aqEvidence').onclick = ()=>{ applyFilter({}); currentQuery=''; renderItems(window.__items, currentDays, '', '', ''); const el=document.getElementById('itemsTable'); el.scrollIntoView({behavior:'smooth'}); }; document.getElementById('aqReady').onclick = ()=>{ applyFilter({}); currentQuery=''; renderItems(window.__items, currentDays, '', '', ''); const el=document.getElementById('itemsTable'); el.scrollIntoView({behavior:'smooth'}); } }

      function wireNav(){ document.querySelectorAll('[data-nav]').forEach(a=>{ a.addEventListener('click', (e)=>{ document.querySelectorAll('[data-nav]').forEach(x=>x.classList.remove('active')); a.classList.add('active'); const id = a.getAttribute('data-nav'); const sec = document.getElementById(id); if(sec){ sec.scrollIntoView({behavior:'smooth'}); } }); }); }

      function wireSeg(){ document.querySelectorAll('#dateSeg button').forEach(btn=>{ btn.addEventListener('click', ()=>{ document.querySelectorAll('#dateSeg button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); currentDays = btn.getAttribute('data-days'); renderItems(window.__items, currentDays, currentQuery, currentPillar, currentSourceType); }); }); }

      function wireSidebarToggle(){ const btn=document.getElementById('toggleSidebar'); const sb=document.getElementById('sidebar'); btn?.addEventListener('click', ()=>{ if(sb.classList.contains('hidden')){ sb.classList.remove('hidden'); } else { sb.classList.add('hidden'); } }); }

      async function init(){
        const [rep, hist, items] = await Promise.all([
          loadJSON('report.json'),
          (async()=>{ try{ return await loadJSON('history.json'); }catch(e){ return []; } })(),
          (async()=>{ try{ return await loadJSON('items.json'); }catch(e){ return []; } })(),
        ]);
        window.__items = items;
        const last = hist && hist.length ? hist[hist.length-1] : null; const prev = hist && hist.length>1 ? hist[hist.length-2] : null; if(last){ const lu = new Date(last.ts).toLocaleString(); const run = last.run_url ? ` - <a target='_blank' href='${last.run_url}'>run</a>` : ''; document.getElementById('lastUpdated').innerHTML = `Updated ${lu}${run}`; }
        updateHealth(rep, hist||[]);
        renderForYou(rep);
        renderWhatChanged(hist||[]);
        renderBrowse(rep, items);
        renderItems(items, currentDays, currentQuery, currentPillar, currentSourceType);
        updateAQ(items);
        wireNav(); wireSeg(); wireSidebarToggle();
        const search = document.getElementById('globalSearch'); search.addEventListener('input', ()=>{ currentQuery = search.value || ''; renderItems(items, currentDays, currentQuery, currentPillar, currentSourceType); });
      }

      // Modal wiring
      (function(){ const m = document.getElementById('addSourceModal'); const open = document.getElementById('btnAddSource'); const close = document.getElementById('modalClose'); const input = document.getElementById('modalUrl'); const wf = document.getElementById('modalIngestWorkflow'); const iss = document.getElementById('modalIngestIssue'); function links(){ const v = encodeURIComponent(input.value || ''); const user = (location.host.split('.')[0]||''); wf.href = `https://github.com/${user}/ai-intel-pipeline/actions/workflows/ingest_manual.yml`; iss.href = `https://github.com/${user}/ai-intel-pipeline/issues/new?labels=ingest&title=${encodeURIComponent('Ingest source')}&body=${encodeURIComponent('Paste URL here: ')}${v}`; } input.addEventListener('input', links); open.addEventListener('click', ()=>{ m.classList.remove('hidden'); m.classList.add('flex'); links(); }); close.addEventListener('click', ()=>{ m.classList.add('hidden'); m.classList.remove('flex'); }); })();

      init();
    </script>
  </body>
</html>
"""
    (out_dir / "dashboard.html").write_text(html, encoding="utf-8")
    (out_dir / "index.html").write_text(html, encoding="utf-8")
    return out_path


