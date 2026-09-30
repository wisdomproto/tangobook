"""Apply a visually compared Qwen correction while the batch worker is stopped."""
import argparse
import hashlib
import importlib.util
import json
import shutil
from pathlib import Path

spec = importlib.util.spec_from_file_location('production', Path(__file__).with_name('classic-scene-coloring.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
p = argparse.ArgumentParser()
p.add_argument('key')
p.add_argument('note')
a = p.parse_args()
jobs = json.loads((m.ROOT / 'manifest.json').read_text(encoding='utf-8'))
j = next(j for j in jobs if j['key'] == a.key)
history = json.loads((m.ROOT / 'repairs' / (a.key + '-history.json')).read_text(encoding='utf-8'))
if history['status']['status_str'] != 'success':
    raise ValueError('Repair did not complete successfully')
target = m.ROOT / j['lineartFile']
backup = m.ROOT / 'revisions' / (a.key + '-before-repair.png')
if not backup.exists():
    shutil.copyfile(target, backup)
shutil.copyfile(m.ROOT / 'repairs' / (a.key + '.png'), target)
m.save(m.ROOT / 'history' / (a.key + '.json'), history)
m.save(m.ROOT / 'workflows' / (a.key + '.json'), history['prompt'][2])
j['promptId'] = history['prompt'][1]
j['lineartSha256'] = hashlib.sha256(target.read_bytes()).hexdigest()
j['revision'] = j.get('revision', 1) + 1
j['promptVersion'] = m.PROMPT_VERSION
j['status'] = 'generated'
reviews = json.loads((m.ROOT / 'review.json').read_text(encoding='utf-8'))
reviews[a.key] = {'visualReview': 'compared', 'notes': a.note}
m.save(m.ROOT / 'review.json', reviews)
m.save(m.ROOT / 'manifest.json', jobs)
print('Applied', a.key)
