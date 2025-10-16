import re, pathlib
p = pathlib.Path('ai_intel_pipeline/report.py')
s = p.read_text(encoding='utf-8')
match = re.search(r"html = \"\"\"([\s\S]*?)\"\"\"", s)
html = match.group(1)
html = html.replace('<main class="max-w-7xl mx-auto px-4 py-6 space-y-6">', '<main class="max-w-7xl mx-auto px-4 py-6 space-y-6">\n          <div class="flex flex-wrap gap-3 text-xs text-gray-400"><a href="index.csv" class="px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300">Download Index (CSV)</a><a href="weekly-latest.md" class="px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300">Weekly Digest (Markdown)</a></div>')
s = s[:match.start(1)] + html + s[match.end(1):]
p.write_text(s, encoding='utf-8')
print('added links')
