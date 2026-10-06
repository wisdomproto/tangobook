"""Read-only scan of all currently generated coloring pages."""
import importlib.util
import json
from pathlib import Path
spec = importlib.util.spec_from_file_location('quality', Path(__file__).with_name('classic-coloring-quality.py'))
q = importlib.util.module_from_spec(spec)
spec.loader.exec_module(q)
root = Path('D:/ComfyUI-output/classic-scene-coloring')
jobs = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
reports = []
for j in jobs:
    if j['status'] != 'generated':
        continue
    r = {'key': j['key'], 'title': j['title'], 'pageNumber': j['pageNumber'], **q.color_report(root / j['lineartFile'])}
    reports.append(r)
    if not r['monochromePassed']:
        print(json.dumps(r, ensure_ascii=False))
(root / 'color-check.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding='utf-8')
print('Scanned', len(reports), 'Colored', sum(not r['monochromePassed'] for r in reports))
