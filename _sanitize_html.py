import re, pathlib
p = pathlib.Path('ai_intel_pipeline/report.py')
s = p.read_text(encoding='utf-8')
match = re.search(r"html = \"\"\"([\s\S]*?)\"\"\"", s)
if not match:
    raise SystemExit('html not found')
html = match.group(1)
html2 = html.replace('Loading…', 'Loading...').replace(' — ', ' - ').replace(' —', ' -').replace('—', '-').replace(' · ', ' | ')
# Also replace any placeholder weird glyphs that slipped in
html2 = html2.replace('�?', '-').replace('�', '-')
s = s[:match.start(1)] + html2 + s[match.end(1):]
p.write_text(s, encoding='utf-8')
print('sanitized')
