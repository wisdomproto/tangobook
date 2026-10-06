"""Archive earlier complex output; run only with the generation worker stopped."""
import importlib.util
import json
import shutil
from pathlib import Path

spec = importlib.util.spec_from_file_location('production', Path(__file__).with_name('classic-scene-coloring.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
jobs = json.loads((m.ROOT / 'manifest.json').read_text(encoding='utf-8'))
reviews = json.loads((m.ROOT / 'review.json').read_text(encoding='utf-8'))
# The user's concrete acceptable example and its compared simplified companion.
keep = {'1789350946386-p03', '1789350946386-p08'}
for j in jobs:
    if j['key'] in keep or j['status'] == 'pending':
        continue
    archive = m.ROOT / 'revisions' / ('before-' + m.PROMPT_VERSION) / j['key']
    archive.mkdir(parents=True, exist_ok=True)
    for folder, filename in [('lineart', j['key'] + '.png'), ('workflows', j['key'] + '.json'), ('history', j['key'] + '.json')]:
        source = m.ROOT / folder / filename
        if source.exists() and not (archive / filename).exists():
            # Distinguish graph and history, which share a JSON filename.
            dest = archive / (folder + '-' + filename)
            if not dest.exists():
                shutil.copyfile(source, dest)
    m.save(archive / 'job.json', j)
    j['status'] = 'pending'
    j['revision'] = j.get('revision', 1) + 1
    j['revisionReason'] = '사용자 기준: p3 수준의 단순함, 인물과 핵심 소품만 남김'
    for key in ['promptId', 'promptVersion', 'seconds', 'lineartSha256']:
        j.pop(key, None)
    reviews[j['key']] = {'visualReview': 'awaiting-revision', 'notes': j['revisionReason']}
m.save(m.ROOT / 'review.json', reviews)
m.save(m.ROOT / 'manifest.json', jobs)
print('Preserved acceptable examples; queued remaining scenes for v3')
