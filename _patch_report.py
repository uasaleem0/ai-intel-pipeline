import re, json, sys, pathlib
p = pathlib.Path('ai_intel_pipeline/report.py')
s = p.read_text(encoding='utf-8')
# 1) Expand _enrich_summary to include why/pillars/source/type/date
pattern = re.compile(r"def _enrich_summary\(item_id: str\) -> Dict:\n(.*?)\n\s*return out", re.S)
new_body = '''def _enrich_summary(item_id: str) -> Dict:
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
                out["apply_steps"] = [ln for ln in apply_block.split("\n") if ln][:6]
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
        return out'''
s, n = pattern.subn(new_body, s)
# 2) Sanitize odd glyphs in markdown/email score lines
s = s.replace("�?", "-")
s = s.replace("—", "—")
s = re.sub(r"f\"- \{t\['title'\]\} .* \{t\['overall'\]:\.3f\}\"", "f\"- {t['title']} — {t['overall']:.3f}\"", s)
s = s.replace("<li><a href='{t['url']}'>{t['title']}</a> �?", "<li><a href='{t['url']}'>{t['title']}</a> —")
s = s.replace("</a> �?", "</a> —")
# 3) Replace KPI placeholders in HTML with em dashes
s = s.replace(">�?\"<", ">—<")
# 4) Write back
p.write_text(s, encoding='utf-8')
print('patched', n)
