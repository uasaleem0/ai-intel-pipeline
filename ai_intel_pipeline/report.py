from __future__ import annotations

import csv
import json
import os
from datetime import datetime, timezone
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
    # Augment with recommendations for consumers
    try:
        from ..config import load_profile
        recs_for_json = rec_top(vault_root, index_csv, Path("vault/model"), load_profile(), top_k=8)
        data["recommendations"] = recs_for_json
    except Exception:
        data["recommendations"] = []
    # Save JSON (dashboard data)
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
    # Top recommendations (embedding-based)
    try:
        from ..config import load_profile
        profile = load_profile()
        model_dir = Path("vault/model")
        recs = rec_top(vault_root, index_csv, model_dir, profile, top_k=5)
        lines.append("\n## Top Recommendations (Embedding-Based)")
        for r in recs:
            lines.append(f"- {r['title']} — {r['scores']['combined']:.3f}")
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
    # Recommended (embedding)
    try:
        from ..config import load_profile
        profile = load_profile()
        model_dir = Path("vault/model")
        recs = rec_top(vault_root, index_csv, model_dir, profile, top_k=5)
        email_lines.append("<h3>Top Recommendations</h3><ol>")
        for r in recs:
            email_lines.append(f"<li><a href='{r['url']}'>{r['title']}</a> — {r['scores']['combined']:.3f}</li>")
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
    })
    hist_path.write_text(json.dumps(hist[-50:], indent=2), encoding="utf-8")
    # Dashboard HTML (dark mode + charts + search using pure JS)
    # Load report.json and history.json dynamically; render charts via Chart.js CDN; style via Tailwind CDN.
    html = f"""
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AI Intel Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/lunr/lunr.min.js"></script>
    <style>
      :root {{ color-scheme: dark; }}
      body {{ background: #0b0f19; color: #e5e7eb; }}
      .card {{ background:#111827; border:1px solid #1f2937; border-radius:0.75rem; padding:1rem; }}
      a {{ color:#60a5fa; }} a:hover {{ text-decoration: underline; }}
      .pill {{ display:inline-block; background:#1f2937; padding:2px 8px; border-radius:999px; margin-right:6px; font-size:12px; }}
      .kpi {{ font-size: 28px; font-weight: 700; }}
      .kpi-label {{ color:#9ca3af; font-size:12px; text-transform:uppercase; letter-spacing: .06em; }}
    </style>
  </head>
  <body class="min-h-screen">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">AI Intel Dashboard</h1>
        <div id="lastUpdated" class="text-sm text-gray-400"></div>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="card"><div class="kpi" id="kpiItems">—</div><div class="kpi-label">Items</div></div>
        <div class="card"><div class="kpi" id="kpiPass">—</div><div class="kpi-label">Evidence Pass</div></div>
        <div class="card"><div class="kpi" id="kpiConfidence">—</div><div class="kpi-label">Avg Confidence</div></div>
        <div class="card"><div class="kpi" id="kpiTranscripts">—</div><div class="kpi-label">Transcripts (fallback)</div></div>
      </div>

      <!-- Search and Filters -->
      <div class="card mb-6">
        <div class="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <input id="searchBox" placeholder="Search insights (title, summary, pillars)..." class="w-full md:w-1/2 bg-gray-900 text-gray-100 rounded px-3 py-2 border border-gray-700" />
          <div>
            <select id="pillarFilter" class="bg-gray-900 text-gray-100 rounded px-3 py-2 border border-gray-700">
              <option value="">All Pillars</option>
            </select>
            <select id="sourceFilter" class="bg-gray-900 text-gray-100 rounded px-3 py-2 border border-gray-700 ml-2">
              <option value="">All Sources</option>
            </select>
          </div>
        </div>
        <div id="searchResults" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3"></div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card"><h3 class="mb-2 font-semibold">By Source</h3><canvas id="chartSource"></canvas></div>
        <div class="card"><h3 class="mb-2 font-semibold">By Type</h3><canvas id="chartType"></canvas></div>
        <div class="card"><h3 class="mb-2 font-semibold">Pillars</h3><canvas id="chartPillars"></canvas></div>
      </div>

      <!-- Top Items & Recommendations -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="card">
          <h3 class="mb-3 font-semibold">Top Items (Overall)</h3>
          <div id="topItems"></div>
        </div>
        <div class="card">
          <h3 class="mb-3 font-semibold">Top Recommendations</h3>
          <div id="topRecs"></div>
        </div>
      </div>

      <!-- Run History -->
      <div class="card mb-6">
        <h3 class="mb-3 font-semibold">Run History</h3>
        <div id="history"></div>
      </div>
    </div>

    <script>
      async function loadJSON(path) {{
        const res = await fetch(path + '?cache=' + Date.now());
        return await res.json();
      }}

      function toList(el, items) {{
        el.innerHTML = items.map(it => `<div class="mb-3"><div class="font-medium">${it.title}</div><div class="text-sm text-gray-400">score: ${(it.score || it.s || 0).toFixed ? (it.score || it.s).toFixed(3) : it.score || ''}</div><a href="${it.url}" target="_blank">Open</a></div>`).join('');
      }}

      function updateKPIs(rep) {{
        const c = rep.counts;
        document.getElementById('kpiItems').textContent = c.items;
        document.getElementById('kpiPass').textContent = `${c.evidence_pass}/${c.evidence}`;
        document.getElementById('kpiConfidence').textContent = c.avg_confidence.toFixed(2);
        document.getElementById('kpiTranscripts').textContent = `${c.transcripts} (${c.transcripts_fallback})`;
        const lu = new Date().toISOString().split('T')[0];
        document.getElementById('lastUpdated').textContent = `Updated ${lu}`;
      }}

      function barChart(ctx, labels, data) {{
        new Chart(ctx, {{ type:'bar', data: {{ labels, datasets:[{{ label:'Count', data, backgroundColor:'#60a5fa' }}] }}, options: {{ plugins:{{ legend:{{ display:false }} }}, scales:{{ x:{{ ticks:{{ color:'#9ca3af' }} }}, y:{{ ticks:{{ color:'#9ca3af' }}, beginAtZero:true }} }} }});
      }}

      function renderCharts(rep) {{
        const sL = Object.keys(rep.by_source); const sV = Object.values(rep.by_source);
        const tL = Object.keys(rep.by_type); const tV = Object.values(rep.by_type);
        const pL = Object.keys(rep.pillars); const pV = Object.values(rep.pillars);
        barChart(document.getElementById('chartSource'), sL, sV);
        barChart(document.getElementById('chartType'), tL, tV);
        barChart(document.getElementById('chartPillars'), pL, pV);
      }}

      function renderTopItems(rep) {{
        const el = document.getElementById('topItems');
        el.innerHTML = rep.top_items.map(t => (
          `<div class='mb-3'><div class='font-medium'>${t.title}</div><div class='text-sm text-gray-400'>score: ${Number(t.overall||0).toFixed(3)}</div><a href='${t.url}' target='_blank'>Open</a></div>`
        )).join('');
      }}

      function renderTopRecs(rep) {{
        const el = document.getElementById('topRecs');
        const recs = rep.recommendations || [];
        el.innerHTML = recs.map(r => (
          `<div class='mb-3'><div class='font-medium'>${r.title}</div><div class='text-sm text-gray-400'>score: ${Number(r.scores?.combined||0).toFixed(3)} | pillars: ${(r.pillars||[]).join(', ')}</div><a href='${r.url}' target='_blank'>Open</a></div>`
        )).join('');
      }}

      function renderHistory(hist) {{
        const el = document.getElementById('history');
        el.innerHTML = hist.slice(-20).reverse().map(h => (
          `<div class='mb-2 text-sm'>${new Date(h.ts).toLocaleString()} — items: ${h.items}, pass: ${h.evidence_pass}/${h.evidence_pass+h.evidence_fail}, conf: ${h.avg_confidence} ${h.run_url?`— <a target='_blank' href='${h.run_url}'>run</a>`:''}</div>`
        )).join('');
      }}

      async function init() {{
        const rep = await loadJSON('report.json');
        updateKPIs(rep);
        renderCharts(rep);
        renderTopItems(rep);
        renderTopRecs(rep);
        let hist=[]; try {{ hist = await loadJSON('history.json'); }} catch(e){{}}
        renderHistory(hist);
        // Pillar + source filters
        const pSel = document.getElementById('pillarFilter');
        const sSel = document.getElementById('sourceFilter');
        Object.keys(rep.pillars).forEach(k=>{{ const o=document.createElement('option'); o.value=k; o.textContent=k; pSel.appendChild(o); }});
        Object.keys(rep.by_source).forEach(k=>{{ const o=document.createElement('option'); o.value=k; o.textContent=k; sSel.appendChild(o); }});
        // Basic keyword search over top items + recs
        const searchBox = document.getElementById('searchBox');
        const results = document.getElementById('searchResults');
        const data = (rep.top_items||[]).map(t=>({{title:t.title,url:t.url,text:t.title,pillars:[]}})).concat((rep.recommendations||[]).map(r=>({{title:r.title,url:r.url,text:r.summary||r.title,pillars:r.pillars||[], source:''}})));
        function doSearch(){{
          const q = searchBox.value.toLowerCase(); const pf = pSel.value; const sf = sSel.value;
          const out = data.filter(d=>{
            const okQ = !q || (d.title?.toLowerCase().includes(q) || (d.text||'').toLowerCase().includes(q));
            const okP = !pf || (d.pillars||[]).includes(pf);
            const okS = !sf || (d.source||'')===sf;
            return okQ && okP && okS;
          }).slice(0,10);
          results.innerHTML = out.map(d=> (
            `<div class='card'><div class='font-medium'>${d.title}</div><a href='${d.url}' target='_blank'>Open</a></div>`
          )).join('');
        }}
        searchBox.addEventListener('input', doSearch);
        pSel.addEventListener('change', doSearch);
        sSel.addEventListener('change', doSearch);
      }}
      init();
    </script>
  </body>
</html>
"""
    (out_dir / "dashboard.html").write_text(html, encoding="utf-8")
    (out_dir / "index.html").write_text(html, encoding="utf-8")
    return out_path
