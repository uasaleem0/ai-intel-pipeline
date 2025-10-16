import csv, json, re
from pathlib import Path
p = Path('ai_intel_pipeline/report.py')
s = p.read_text(encoding='utf-8')
# Insert items.json generation after top_items_detail assignment
anchor = 'data["top_items_detail"] = top_items_detail\n    # Save JSON (dashboard data)'
ins = '''data["top_items_detail"] = top_items_detail
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
    # Save JSON (dashboard data)'''
if anchor in s:
    s = s.replace(anchor, ins)
else:
    print('anchor not found')
# Add history_daily and model_index
anchor2 = '(out_dir / "report.json").write_text(json.dumps(data, indent=2), encoding="utf-8")'
ins2 = '''# Derive daily history buckets (items, pass_rate, avg_conf where available)
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
    (out_dir / "report.json").write_text(json.dumps(data, indent=2), encoding="utf-8")'''
s = s.replace(anchor2, ins2)
# Write back
p.write_text(s, encoding='utf-8')
print('done')
