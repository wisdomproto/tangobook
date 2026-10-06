"""Apply a visually compared Qwen correction while the batch worker is stopped."""
import argparse
import hashlib
import importlib.util
import json
import shutil
from datetime import datetime, timezone
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
color_check = m.quality.color_report(m.ROOT / 'repairs' / (a.key + '.png'))
if not color_check['monochromePassed']:
    raise ValueError('Repair still contains color: ' + str(color_check))
target = m.ROOT / j['lineartFile']
checked_at = datetime.now(timezone.utc).isoformat()
archive = m.ROOT / 'revisions' / 'reviewed-repair' / a.key / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
archive.mkdir(parents=True, exist_ok=True)
shutil.copyfile(target, archive / 'lineart.png')
for folder in ['workflows', 'history']:
    previous = m.ROOT / folder / (a.key + '.json')
    if previous.exists():
        shutil.copyfile(previous, archive / (folder + '.json'))
m.save(archive / 'job.json', j)
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
j['colorCheck'] = color_check
reviews = json.loads((m.ROOT / 'review.json').read_text(encoding='utf-8'))
previous_review = reviews.get(a.key, {})
m.save(archive / 'review.json', previous_review)
reviews[a.key] = {
    **previous_review,
    'visualReview': 'compared-needs-play',
    'notes': a.note,
    'reviewedAt': checked_at,
    'reviewedLineartSha256': j['lineartSha256'],
    'reviewedSourceSha256': j['sourceSha256'],
    'sourceComparison': {
        'checkedAt': checked_at,
        'result': 'repair-compared-needs-play',
        'evidence': 'repairs/' + a.key + '.png versus ' + j['sourceFile'],
        'notes': a.note,
    },
    'previousReviewArchive': archive.relative_to(m.ROOT).as_posix(),
}
# A replaced image invalidates earlier play evidence; retain it in the archive.
reviews[a.key].pop('playEvidence', None)
m.save(m.ROOT / 'review.json', reviews)
m.save(m.ROOT / 'manifest.json', jobs)
print('Applied', a.key)
