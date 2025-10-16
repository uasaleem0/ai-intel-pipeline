import re, pathlib
p = pathlib.Path('ai_intel_pipeline/report.py')
s = p.read_text(encoding='utf-8')
# Insert Ask AI card after the downloads links block in main
m = re.search(r"<main class=\\\"max-w-7xl[\s\S]*?<div class=\\\"flex flex-wrap[\s\S]*?</div>\s*", s)
if m:
    insertion = '''
          <section id="ask" class="card">
            <h3 class="mb-2 font-semibold">Ask AI (Using Your Data)</h3>
            <div class="flex flex-col md:flex-row gap-2 items-start md:items-center">
              <input id="askInput" placeholder="Ask a question about your indexed AI intel..." class="w-full md:flex-1 bg-gray-900 text-gray-100 rounded px-3 py-2 border border-gray-700" />
              <div class="flex gap-2">
                <button id="askBtn" class="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600">Ask</button>
                <button id="askSettings" class="px-3 py-2 rounded bg-gray-800 border border-gray-700">Settings</button>
              </div>
            </div>
            <div id="askOutput" class="mt-3 text-sm text-gray-300"></div>
            <div class="mt-2 text-xs text-gray-500">Answers are grounded in your indexed data (RAG). Feature will activate when the vector index is available.</div>
          </section>
    '''
    s = s[:m.end()] + insertion + s[m.end():]
# Add JS handlers for Ask AI (stub)
s = s.replace('init();\n    </script>', '''
      // Ask AI (stub)
      (function(){
        let repCache=null;
        async function ensureRep(){ if(repCache) return repCache; try { repCache = await loadJSON('report.json'); return repCache; } catch(e){ return null; } }
        async function ask(){
          const rep = await ensureRep();
          const q = (document.getElementById('askInput').value||'').trim();
          if(!q){ showToast('Please enter a question', 'error'); return; }
          const mi = rep && rep.model_index || {doc_count:0};
          if(!mi.doc_count){
            document.getElementById('askOutput').innerHTML = '<div class="text-gray-400">RAG not ready: build embeddings via Actions (index-model) to enable AI Q&A.</div>';
            showToast('Vector index not available yet', 'info');
            return;
          }
          document.getElementById('askOutput').innerHTML = '<div class="text-gray-400">Thinking with your indexed data...</div>';
          // Placeholder until RAG backend is wired. We will call a client-side RAG runner here.
          setTimeout(()=>{
            document.getElementById('askOutput').innerHTML = '<div class="text-gray-400">RAG is not enabled on this page yet. Once your vector index is published to Pages, answers will appear here with citations.</div>';
          }, 600);
        }
        const btn = document.getElementById('askBtn'); const settings = document.getElementById('askSettings');
        btn?.addEventListener('click', ask);
        settings?.addEventListener('click', ()=>{
          showToast('Configure RAG backend first; BYOK will be added here', 'info');
        });
      })();

      init();
    </script>''')
# Add CSS for details width to avoid width shrink
s = s.replace('</style>', '  details { display:block; width:100%; }\n    </style>')
pathlib.Path('ai_intel_pipeline/report.py').write_text(s, encoding='utf-8')
print('ask-ui added')
