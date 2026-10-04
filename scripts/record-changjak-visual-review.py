"""Record only ranges actually inspected by the reviewer, tied to current hashes."""
import argparse
import json
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('collection')
p.add_argument('--start', type=int, default=0)
p.add_argument('--count', type=int, default=100)
p.add_argument('--keys', nargs='*')
p.add_argument('--held', nargs='*', default=[])
a = p.parse_args()
r = Path('D:/ComfyUI-output/classic-scene-coloring') / a.collection
jobs = json.loads((r / 'manifest.json').read_text(encoding='utf-8'))
f = r / 'review-workspace/visual-review.json'
d = json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}
selected = [j for j in jobs if j['key'] in a.keys] if a.keys is not None else jobs[a.start:a.start+a.count]
for j in selected:
    d[j['key']] = {
        'approved': j['key'] not in a.held,
        'sourceSha256': j['sourceSha256'],
        'lineartSha256': j['lineartSha256'],
        'evidence': 'Actual source / lineart / shared-engine-filled visual comparison',
        'criteria': 'Large characters, faces, action and essential props; minor white details allowed',
    }
f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'recorded': len(selected), 'approved': sum(v['approved'] for v in d.values()), 'held': [k for k,v in d.items() if not v['approved']]}))
