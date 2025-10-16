import re, pathlib
p = pathlib.Path('ai_intel_pipeline/report.py')
s = p.read_text(encoding='utf-8')
match = re.search(r"html = \"\"\"([\s\S]*?)\"\"\"", s)
if not match:
    raise SystemExit('html not found')
html = match.group(1)
# 1) Add CSS for collapsed sidebar and neutralize segmented colors
html = html.replace('</style>', '''  .is-collapsed #sidebar { display:none; }
      .seg button { border:1px solid #374151; padding:.35rem .6rem; border-radius:.5rem; background:#0f172a; color:#cbd5e1; }
      .seg button.active { background:#4b5563; color:white; border-color:#334155; }
    </style>''')
# 2) Sidebar: make it flex column, h-screen, overflow, and bottom anchor; visible at md+, hidden on mobile
html = re.sub(r'<aside id=\"sidebar\" class=\"[^\"]+\"',
              '<aside id="sidebar" class="hidden md:flex flex-col h-screen w-64 shrink-0 bg-[#0d1220] border-r border-gray-800 p-4 overflow-y-auto"',
              html)
# Move System Health container to bottom via mt-auto
html = html.replace('<div class="mt-6">', '<div class="mt-auto">')
# 3) Make main content flex child non-shrinking and min-w-0; enlarge title; show toggle at all sizes
html = html.replace('<div class="flex-1 flex flex-col">', '<div class="flex-1 min-w-0 flex flex-col">')
html = html.replace('<main class="max-w-7xl mx-auto px-4 py-6 space-y-6">', '<main class="max-w-7xl mx-auto px-4 py-6 space-y-6 min-w-0">')
html = html.replace('<div class="font-bold mr-auto">AI Intel Dashboard</div>', '<div class="text-2xl md:text-3xl font-extrabold mr-auto">AI Intel Dashboard</div>')
html = html.replace('<button id=\"toggleSidebar\" class=\"px-2 py-1 rounded bg-gray-800 border border-gray-700 md:hidden\">', '<button id="toggleSidebar" class="px-2 py-1 rounded bg-gray-800 border border-gray-700">')
# 4) Ensure Analytics details doesn’t affect width; add w-full class
html = html.replace('<details id="analytics" class="card">', '<details id="analytics" class="card w-full">')
# 5) Update JS toggle to collapse body class instead of only hidden
html = re.sub(r"wireSidebarToggle\(\)\{[\s\S]*?\}",
              "wireSidebarToggle(){ const btn=document.getElementById('toggleSidebar'); btn?.addEventListener('click', ()=>{ document.body.classList.toggle('is-collapsed'); }); }",
              html)
# Write back
s2 = s[:match.start(1)] + html + s[match.end(1):]
pathlib.Path('ai_intel_pipeline/report.py').write_text(s2, encoding='utf-8')
print('applied')
