import re, pathlib
p = pathlib.Path('ai_intel_pipeline/report.py')
s = p.read_text(encoding='utf-8')
pattern = re.compile(r"html = \"\"\"[\s\S]*?\"\"\"\n\s*\(out_dir / \"dashboard.html\"\)\.write_text\(html, encoding=\"utf-8\"\)")
new_html = r'''html = """
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
      .kpi { font-size: 28px; font-weight: 700; }
      .kpi-label { color:#9ca3af; font-size:12px; text-transform:uppercase; letter-spacing: .06em; }
      .sidebar-link { display:flex; align-items:center; gap:.75rem; padding:.5rem .75rem; border-radius:.5rem; color:#9ca3af; }
      .sidebar-link:hover { background:#0f172a; color:#e5e7eb; }
      .sidebar-link.active { background:#0f172a; color:#fff; border:1px solid #1f2937; }
    </style>
  </head>
  <body class="min-h-screen">
    <div class="min-h-screen flex">
      <aside class="hidden md:block w-60 shrink-0 bg-[#0d1220] border-r border-gray-800 p-4">
        <div class="text-lg font-semibold mb-4">AI Intel</div>
        <nav class="space-y-1">
          <a class="sidebar-link active" href="#overview">Overview</a>
          <a class="sidebar-link" href="#items">Items</a>
          <a class="sidebar-link" href="#pillars">Pillars</a>
          <a class="sidebar-link" href="#sources">Sources</a>
          <a class="sidebar-link" href="#digests">Digests</a>
          <a class="sidebar-link" href="#model">Model Index</a>
        </nav>
        <div class="mt-8 border-t border-gray-800 pt-4">
          <a class="sidebar-link" href="#settings">Settings</a>
          <a class="sidebar-link" href="#help">Help</a>
        </div>
      </aside>
      <div class="flex-1 flex flex-col">
        <header class="sticky top-0 z-10 backdrop-blur bg-[#0b0f19]/70 border-b border-gray-800">
          <div class="max-w-7xl mx-auto px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div class="font-bold">AI Intel Dashboard</div>
            <div class="flex items-center gap-2 justify-start md:justify-center">
              <select id="dateRange" class="bg-gray-900 text-gray-100 rounded px-3 py-2 border border-gray-700">
                <option value="7">Last 7 days</option>
                <option value="30" selected>Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <input id="globalSearch" placeholder="Search (title, TL;DR, pillars)" class="w-48 md:w-72 bg-gray-900 text-gray-100 rounded px-3 py-2 border border-gray-700" />
            </div>
            <div class="flex items-center gap-2 justify-end">
              <button id="btnAddSource" class="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500">Add Source</button>
              <div id="lastUpdated" class="text-xs text-gray-400"></div>
            </div>
          </div>
        </header>
        <main class="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <section id="overview" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="card lg:col-span-2">
              <h3 class="mb-2 font-semibold">What Changed</h3>
              <div id="whatChanged" class="text-sm text-gray-300">Loading…</div>
            </div>
            <div class="card">
              <h3 class="mb-2 font-semibold">For You</h3>
              <div id="forYou" class="space-y-3 text-sm"></div>
            </div>
          </section>

          <section class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="card"><div class="kpi" id="kpiItems">—</div><div class="kpi-label">Items</div><div id="kpiItemsDelta" class="text-xs text-gray-400"></div></div>
            <div class="card"><div class="kpi" id="kpiPass">—</div><div class="kpi-label">Evidence Pass</div><div id="kpiPassRate" class="text-xs text-gray-400"></div></div>
            <div class="card"><div class="kpi" id="kpiConfidence">—</div><div class="kpi-label">Avg Confidence</div></div>
            <div class="card"><div class="kpi" id="kpiTranscripts">—</div><div class="kpi-label">Transcripts (fallback)</div></div>
          </section>

          <section class="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div class="card"><h3 class="mb-2 font-semibold">By Source</h3><canvas id="chartSource"></canvas></div>
            <div class="card"><h3 class="mb-2 font-semibold">By Type</h3><canvas id="chartType"></canvas></div>
            <div class="card"><h3 class="mb-2 font-semibold">Pillars</h3><canvas id="chartPillars"></canvas></div>
          </section>

          <section class="card">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold">Top Items</h3>
              <div class="text-xs text-gray-400">Range applies to list; charts show totals.</div>
            </div>
            <div id="itemsTable" class="text-sm"></div>
          </section>

          <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="card"><h3 class="mb-2 font-semibold">Trend: Items / day</h3><canvas id="chartTrendItems"></canvas></div>
            <div class="card"><h3 class="mb-2 font-semibold">Run History</h3><div id="history" class="text-sm"></div></div>
          </section>
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

      async function loadJSON(path) {
        const res = await fetch(path + '?cache=' + Date.now());
        return await res.json();
      }

      function barChart(ctx, labels, data) {
        new Chart(ctx, { type:'bar', data: { labels, datasets:[{ label:'Count', data, backgroundColor:'#60a5fa' }] }, options: { plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:(ctx)=>` ${ctx.parsed.y}` } } }, scales:{ x:{ ticks:{ color:'#9ca3af' } }, y:{ ticks:{ color:'#9ca3af' }, beginAtZero:true, grid:{ color:'#1f2937' } } } });
      }

      function lineChart(ctx, labels, data){
        new Chart(ctx, { type:'line', data: { labels, datasets:[{ label:'Items', data, borderColor:'#60a5fa', backgroundColor:'#60a5fa22', fill:true, tension:.2 }] }, options: { plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:'#9ca3af' } }, y:{ ticks:{ color:'#9ca3af' }, beginAtZero:true, grid:{ color:'#1f2937' } } } });
      }

      function renderCharts(rep){
        const sL = Object.keys(rep.by_source), sV = Object.values(rep.by_source);
        const tL = Object.keys(rep.by_type), tV = Object.values(rep.by_type);
        const pL = Object.keys(rep.pillars), pV = Object.values(rep.pillars);
        barChart(document.getElementById('chartSource'), sL, sV);
        barChart(document.getElementById('chartType'), tL, tV);
        barChart(document.getElementById('chartPillars'), pL, pV);
      }

      function updateKPIs(rep, last=null, prev=null){
        const c = rep.counts;
        document.getElementById('kpiItems').textContent = c.items;
        document.getElementById('kpiPass').textContent = `${c.evidence_pass}/${c.evidence}`;
        document.getElementById('kpiConfidence').textContent = Number(c.avg_confidence||0).toFixed(2);
        document.getElementById('kpiTranscripts').textContent = `${c.transcripts} (${c.transcripts_fallback})`;
        if(last){
          const passRate = last.evidence ? (last.evidence_pass/last.evidence) : 0;
          const prevPass = prev && prev.evidence ? (prev.evidence_pass/prev.evidence) : 0;
          const deltaItems = prev ? (last.items - prev.items) : 0;
          const deltaPassPct = (passRate - prevPass)*100;
          document.getElementById('kpiItemsDelta').textContent = `${deltaItems>=0?'+':''}${deltaItems} vs prev`;
          document.getElementById('kpiPassRate').textContent = `Pass rate ${ (passRate*100).toFixed(1) }% (${deltaPassPct>=0?'+':''}${deltaPassPct.toFixed(1)}pp)`;
        }
      }

      function renderForYou(rep){
        const el = document.getElementById('forYou');
        const recs = (rep.recommendations||[]).slice(0,3);
        if(!recs.length){ el.innerHTML = '<div class="text-gray-400">No recommendations yet.</div>'; return; }
        el.innerHTML = recs.map(r => (
          `<div><div class='font-medium'>${r.title}</div><div class='text-xs text-gray-400 mb-1'>score: ${Number(r.scores?.combined||0).toFixed(3)} · pillars: ${(r.pillars||[]).join(', ')}</div>${r.tldr?`<div class='mb-1'>${r.tldr}</div>`:''}<a href='${r.url}' target='_blank'>Open</a></div>`
        )).join('');
      }

      function renderWhatChanged(hist){
        const el = document.getElementById('whatChanged');
        if(!hist || hist.length<2){ el.textContent = 'Not enough history yet.'; return; }
        const last = hist[hist.length-1], prev = hist[hist.length-2];
        const itemsDelta = last.items - prev.items;
        const passRate = last.evidence ? (last.evidence_pass/last.evidence) : 0;
        const prevPass = prev.evidence ? (prev.evidence_pass/prev.evidence) : 0;
        const passDelta = (passRate - prevPass) * 100;
        el.innerHTML = `<ul class='list-disc ml-5'>
          <li>${itemsDelta>=0?'+':''}${itemsDelta} items vs previous run</li>
          <li>Pass rate ${(passRate*100).toFixed(1)}% (${passDelta>=0?'+':''}${passDelta.toFixed(1)}pp)</li>
          <li>Top pillar: ${(Object.entries(hist[hist.length-1]).find(()=>false), 'see charts')}</li>
        </ul>`;
      }

      function withinRange(d, days){
        if(days==='all') return true;
        const cutoff = dayjs().subtract(Number(days), 'day');
        return dayjs(d).isAfter(cutoff);
      }

      function renderItems(items, days, q, pillar){
        const el = document.getElementById('itemsTable');
        let list = items.filter(it=>!days || withinRange(it.date, days));
        if(q){ const ql=q.toLowerCase(); list = list.filter(it=> (it.title||'').toLowerCase().includes(ql) || (it.tldr||'').toLowerCase().includes(ql) || (it.why||'').toLowerCase().includes(ql) || (it.pillars||[]).join(' ').toLowerCase().includes(ql)); }
        if(pillar){ list = list.filter(it=> (it.pillars||[]).includes(pillar)); }
        list = list.sort((a,b)=>(b.overall||0)-(a.overall||0));
        const rows = list.slice(0,20).map(it=>{
          const pills = (it.pillars||[]).map(p=>`<span class='pill'>${p}</span>`).join('');
          const id = `row_${it.item_id}`;
          return `<div class='border-b border-gray-800 py-2'>
            <div class='flex items-center justify-between gap-3'>
              <div class='min-w-0'>
                <div class='font-medium truncate'>${it.title}</div>
                <div class='text-xs text-gray-400'>${(it.source_type||it.source||'').toString()} · ${new Date(it.date).toLocaleDateString()} · score ${Number(it.overall||0).toFixed(3)}</div>
                <div class='mt-1'>${pills}</div>
              </div>
              <div class='flex items-center gap-2'>
                <a class='text-sm' href='${it.url}' target='_blank'>Open</a>
                <button class='text-sm px-2 py-1 rounded bg-gray-800 border border-gray-700' onclick="const d=document.getElementById('${id}'); d.classList.toggle('hidden');">Details</button>
              </div>
            </div>
            <div id='${id}' class='hidden mt-2 text-sm'>
              ${it.tldr?`<div class='mb-2'><span class='text-gray-400'>TL;DR:</span> ${it.tldr}</div>`:''}
              ${it.why?`<div class='mb-2'><span class='text-gray-400'>Why it matters:</span> ${it.why}</div>`:''}
              ${(it.apply_steps||[]).length?`<div class='mb-2'><div class='text-gray-400'>Apply steps:</div><ul class='list-disc ml-5'>${it.apply_steps.map(s=>`<li>${s}</li>`).join('')}</ul></div>`:''}
            </div>
          </div>`
        }).join('');
        el.innerHTML = rows || `<div class='text-gray-400'>No items in this range. Try changing filters.</div>`;
      }

      async function init(){
        const [rep, hist, items] = await Promise.all([
          loadJSON('report.json'),
          (async()=>{ try{ return await loadJSON('history.json'); }catch(e){ return []; } })(),
          (async()=>{ try{ return await loadJSON('items.json'); }catch(e){ return []; } })(),
        ]);
        const last = hist && hist.length ? hist[hist.length-1] : null;
        const prev = hist && hist.length>1 ? hist[hist.length-2] : null;
        if(last){
          const lu = new Date(last.ts).toLocaleString();
          const run = last.run_url ? ` — <a target='_blank' href='${last.run_url}'>run</a>` : '';
          document.getElementById('lastUpdated').innerHTML = `Updated ${lu}${run}`;
        }
        updateKPIs(rep, last, prev);
        renderCharts(rep);
        renderForYou(rep);
        renderWhatChanged(hist||[]);
        const drSel = document.getElementById('dateRange');
        const search = document.getElementById('globalSearch');
        const doRender = ()=> renderItems(items, drSel.value, search.value || '', '');
        drSel.addEventListener('change', doRender);
        search.addEventListener('input', doRender);
        doRender();
      }

      // Modal wiring
      (function(){
        const m = document.getElementById('addSourceModal');
        const open = document.getElementById('btnAddSource');
        const close = document.getElementById('modalClose');
        const input = document.getElementById('modalUrl');
        const wf = document.getElementById('modalIngestWorkflow');
        const iss = document.getElementById('modalIngestIssue');
        function links(){
          const v = encodeURIComponent(input.value || '');
          const user = (location.host.split('.')[0]||'');
          wf.href = `https://github.com/${user}/ai-intel-pipeline/actions/workflows/ingest_manual.yml`;
          iss.href = `https://github.com/${user}/ai-intel-pipeline/issues/new?labels=ingest&title=${encodeURIComponent('Ingest source')}&body=${encodeURIComponent('Paste URL here: ')}${v}`;
        }
        input.addEventListener('input', links);
        open.addEventListener('click', ()=>{ m.classList.remove('hidden'); m.classList.add('flex'); links(); });
        close.addEventListener('click', ()=>{ m.classList.add('hidden'); m.classList.remove('flex'); });
      })();

      init();
    </script>
  </body>
</html>
"""
(out_dir / "dashboard.html").write_text(html, encoding="utf-8")'''
s2, n = pattern.subn(new_html, s)
if not n:
    print('html anchor not found')
    raise SystemExit(1)
# Also ensure index.html mirrors dashboard
s2 = s2.replace('(out_dir / "index.html").write_text(html, encoding="utf-8")', '(out_dir / "index.html").write_text(html, encoding="utf-8")')
path = pathlib.Path('ai_intel_pipeline/report.py')
path.write_text(s2, encoding='utf-8')
print('html updated')
