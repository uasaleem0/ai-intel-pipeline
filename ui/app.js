// Minimal, defensive JS (no optional chaining)
(function(){
  function $(id){ return document.getElementById(id); }
  function text(id, v){ var el=$(id); if(el){ el.textContent=v; } }
  function html(id, v){ var el=$(id); if(el){ el.innerHTML=v; } }
  function fetchJSON(path){ var v=window.__BUILD && window.__BUILD.v ? ('?v='+window.__BUILD.v) : ('?v='+(Date.now())); return fetch(path+v).then(function(r){ return r.json(); }); }

  function wireSidebar(){
    var burger=$('burger'); var sb=$('sidebar'); var col=$('collapseSidebarDesktop');
    if(burger && sb){ burger.addEventListener('click', function(){ document.body.classList.remove('is-collapsed'); sb.style.display=''; }); }
    if(col && sb){ col.addEventListener('click', function(){ document.body.classList.add('is-collapsed'); sb.style.display='none'; }); }
  }

  function computeHealth(rep, hist){
    var c=(rep&&rep.counts)||{}; var items=Number(c.items||0);
    var evPass=Number(c.evidence_pass||0); var evTotal=c.evidence!=null? Number(c.evidence) : (Number(c.evidence_pass||0)+Number(c.evidence_fail||0));
    var passRate = evTotal? ((evPass/evTotal)*100).toFixed(1)+'%' : '—';
    text('healthItems', 'Items: '+items);
    text('healthPassRate', 'Pass rate: '+passRate);
    var runs30 = 0; var last=null;
    if(hist && hist.length){
      runs30 = hist.length; last = hist[hist.length-1];
    }
    text('healthRuns', 'Runs: '+runs30);
    if(last){ html('healthLastRun', 'Last run: '+ new Date(last.ts).toLocaleString() + (last.run_url? ' — <a target="_blank" href="'+last.run_url+'">run</a>':'')); }
  }

  function computeAQ(items){
    items = Array.isArray(items)? items : [];
    var unreviewed = 0, needs = 0, ready = 0;
    for(var i=0;i<items.length;i++){
      var it=items[i]; var v=(it.verdict||'').toLowerCase(); var conf = Number(it.confidence);
      if(!v){ unreviewed++; }
      if(v==='fail' || (!isNaN(conf) && conf<0.5)){ needs++; }
      var overall=Number(it.overall||0), cred=Number(it.credibility||0), act=Number(it.actionability||0);
      if(overall>=0.6 && cred>=0.7 && act>=0.6 && (v==='pass' || (!isNaN(conf) && conf>=0.6))){ ready++; }
    }
    text('aqUnreviewedCount', unreviewed);
    text('aqEvidenceCount', needs);
    text('aqReadyCount', ready);
  }

  function renderBrowse(rep){
    var s=$('sbSources'); var p=$('sbPillars');
    if(!rep){ return; }
    if(s){
      var src=rep.by_source||{}; var keys=Object.keys(src).sort(function(a,b){return (src[b]|0)-(src[a]|0);});
      var out='';
      for(var i=0;i<keys.length;i++){ var k=keys[i], v=src[k]; var kl=k.toLowerCase(); var icon = kl.indexOf('github')>-1?'🐙': (kl.indexOf('youtube')>-1?'▶️':'📦'); out += '<a class="sidebar-link" href="items.html?source='+encodeURIComponent(k)+'"><span class="mr-2">'+icon+'</span>'+k+' <span style="color:#9ca3af">('+v+')</span></a>'; }
      s.innerHTML=out;
    }
    if(p){
      var pil=rep.pillars||{}; var pk=Object.keys(pil).sort(function(a,b){return (pil[b]|0)-(pil[a]|0);}).slice(0,10);
      var outp='';
      for(var j=0;j<pk.length;j++){ var k2=pk[j], v2=pil[k2]; outp += '<a class="sidebar-link" href="items.html?pillar='+encodeURIComponent(k2)+'">'+k2+' <span style="color:#9ca3af">('+v2+')</span></a>'; }
      p.innerHTML=outp;
    }
  }

  function initDashboard(){
    wireSidebar();
    Promise.all([
      fetchJSON('build.json').catch(function(){ return {}; }),
      fetchJSON('./report.json'),
      fetchJSON('history.json').catch(function(){ return []; }),
      fetchJSON('./items.json')
    ]).then(function(arr){
      var build=arr[0]||{}; window.__BUILD = { v: (build.run_id||build.ts||Date.now()) };
      if(build.sha){ text('buildTag', 'Build '+build.sha.slice(0,7)); }
      var rep=arr[1], hist=arr[2], itemsResp=arr[3];
      var items = itemsResp.items || itemsResp; // Handle both old and new format
      computeHealth(rep, hist);
      computeAQ(items);
      renderBrowse(rep);
      // Ask AI functionality
      var askBtn=$('askBtn'), askInput=$('askInput'), askOutput=$('askOutput');
      if(askBtn && askInput && askOutput){
        askBtn.addEventListener('click', function(){
          var query = askInput.value.trim();
          if(!query){ askOutput.textContent='Please enter a question.'; return; }
          
          askOutput.innerHTML='<div style="color:#9ca3af">🤔 Thinking...</div>';
          askBtn.disabled = true;
          askBtn.textContent = 'Asking...';
          
          fetch('./query', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({query: query, top_k: 5})
          })
          .then(function(r){ return r.json(); })
          .then(function(data){
            if(data.answer){
              var sourcesHtml = '';
              if(data.sources && data.sources.length){
                sourcesHtml = '<div style="margin-top:12px;padding-top:8px;border-top:1px solid #374151"><strong>Sources:</strong>';
                for(var i=0; i<data.sources.length; i++){
                  var s = data.sources[i];
                  sourcesHtml += '<div style="margin:4px 0"><a target="_blank" href="'+s.url+'" style="color:#60a5fa">'+s.title+'</a> (score: '+s.score.toFixed(3)+')</div>';
                }
                sourcesHtml += '</div>';
              }
              askOutput.innerHTML = '<div style="color:#e5e7eb">'+data.answer.replace(/\n/g,'<br>')+'</div>' + sourcesHtml;
            } else {
              askOutput.innerHTML = '<div style="color:#f87171">Error: '+(data.detail || 'Unknown error')+'</div>';
            }
          })
          .catch(function(e){
            askOutput.innerHTML = '<div style="color:#f87171">Network error. Make sure the API server is running (python -m ai_intel_pipeline serve)</div>';
            console.error('Query error:', e);
          })
          .finally(function(){
            askBtn.disabled = false;
            askBtn.textContent = 'Ask';
          });
        });
        
        // Enter key support
        askInput.addEventListener('keypress', function(e){
          if(e.key === 'Enter' && !e.shiftKey){ 
            e.preventDefault();
            askBtn.click();
          }
        });
      }
      // Analytics toggle
      var at=$('analyticsToggle'), ap=$('analyticsPanel'); if(at && ap){ at.addEventListener('click', function(){ ap.classList.toggle('hidden'); }); }
      // Items feed (top items sample)
      var feed=$('itemsFeed'); if(feed && rep && rep.top_items){ var htmls=''; for(var i=0;i<rep.top_items.length;i++){ var t=rep.top_items[i]; htmls += '<div class="card"><div class="card-title">'+(t.title||'')+'</div><div>score '+Number(t.overall||0).toFixed(3)+'</div><a target="_blank" href="'+(t.url||'#')+'">Open</a></div>'; } feed.innerHTML=htmls; }
    }).catch(function(e){ var banner=$('errorBanner'); if(banner){ banner.textContent='JS error: '+(e&&e.message? e.message: e); banner.style.display='block'; }});
  }

  function initItems(){
    function qp(k){ var u=new URLSearchParams(location.search); return u.get(k)||''; }
    fetchJSON('./report.json').then(function(rep){
      var pilSel=$('filterPillar'); if(pilSel && rep && rep.pillars){ var keys=Object.keys(rep.pillars); for(var i=0;i<keys.length;i++){ var o=document.createElement('option'); o.value=keys[i]; o.textContent=keys[i]; pilSel.appendChild(o);} }
    });
    fetchJSON('./items.json').then(function(items){
      $('q').value = qp('q'); $('filterSource').value = qp('source'); $('filterPillar').value = qp('pillar');
      function render(){
        var q = $('q').value.toLowerCase(); var src=$('filterSource').value; var pil=$('filterPillar').value; var out=''; var list=items.slice(0);
        if(q){ list=list.filter(function(it){ var txt=(it.title||'')+' '+(it.tldr||'')+' '+(it.why||'')+' '+(it.pillars||[]).join(' '); return txt.toLowerCase().indexOf(q)>-1; }); }
        if(src){ list=list.filter(function(it){ return (String(it.source_type||it.source||'')).toLowerCase()===src.toLowerCase(); }); }
        if(pil){ list=list.filter(function(it){ return (it.pillars||[]).indexOf(pil)>-1; }); }
        list=list.sort(function(a,b){ return Number(b.overall||0)-Number(a.overall||0); });
        for(var i=0;i<Math.min(200,list.length);i++){
          var it=list[i]; var pills=''; var ps=it.pillars||[]; for(var j=0;j<ps.length;j++){ pills+='<span class="pill">'+ps[j]+'</span>'; }
          out += '<tr>'+
            '<td><a target="_blank" href="'+it.url+'">'+(it.title||'')+'</a><div style="color:#9ca3af;font-size:12px;margin-top:4px">'+(it.source_type||'')+' · '+new Date(it.date).toLocaleDateString()+' · score '+Number(it.overall||0).toFixed(3)+'</div><div style="margin-top:6px">'+pills+'</div></td>'+
            '<td style="font-size:14px">'+(it.tldr||'')+(it.why? '<div style="margin-top:6px;color:#d1d5db"><span style="color:#9ca3af">Why:</span> '+it.why+'</div>':'')+( (it.apply_steps&&it.apply_steps.length) ? ('<div style="margin-top:6px;color:#d1d5db"><span style="color:#9ca3af">Apply:</span><ul style="margin-left:18px">'+it.apply_steps.map(function(s){return '<li>'+s+'</li>';}).join('')+'</ul></div>') : '') +'</td>'+
            '<td style="font-size:12px">'+(it.verdict||'')+(it.confidence!=null? ('<div>conf '+Number(it.confidence).toFixed(2)+'</div>') : '')+'</td>'+
          '</tr>';
        }
        $('itemsTable').innerHTML = '<table><thead><tr><th>Item</th><th>Summary</th><th>Quality</th></tr></thead><tbody>'+ (out||"<tr><td colspan=3 style=\"color:#9ca3af;padding:24px\">No items match.</td></tr>") +'</tbody></table>';
      }
      $('q').addEventListener('input', render); $('filterSource').addEventListener('change', render); $('filterPillar').addEventListener('change', render);
      render();
    }).catch(function(e){ var b=$('errorBanner'); if(b){ b.textContent='JS error: '+(e&&e.message? e.message : e); b.style.display='block'; } });
  }

  // Entry
  document.addEventListener('DOMContentLoaded', function(){
    var mode = document.body.getAttribute('data-mode') || 'dashboard';
    if(mode==='dashboard'){ initDashboard(); }
    if(mode==='items'){ initItems(); }
  });
})();

