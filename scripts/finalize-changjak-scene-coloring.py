"""Gate a complete series on saved visual decisions, SHA and representative game evidence."""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('collection')
args = parser.parse_args()
workspace = Path(__file__).resolve().parents[1]
root = Path('D:/ComfyUI-output/classic-scene-coloring') / args.collection
new_series = {'changjak-bung', 'changjak-dingding', 'changjak-taro', 'changjak-yuki', 'changjak-mina', 'changjak-kota', 'changjak-moya', 'changjak-bami', 'changjak-dari'}
range_name = 'changjak-11-19' if args.collection in new_series else 'changjak-2-10'
inventory = json.loads((root.parent / range_name / 'book-list.json').read_text(encoding='utf-8'))
expected_ids = {b['id'] for b in inventory if b['id'].startswith(args.collection + '-')}
expected_books = len(expected_ids)
assert expected_books in (25, 50)
jobs = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
decisions = json.loads((root / 'review-workspace/visual-review.json').read_text(encoding='utf-8'))
audits = {a['key']: a for a in json.loads((root / 'audit.json').read_text(encoding='utf-8'))}
game = json.loads((root / 'review-workspace/local-game-evidence.json').read_text(encoding='utf-8'))
assert len(jobs) == len({j['key'] for j in jobs}) == expected_books * 2
assert {j['bookId'] for j in jobs} == expected_ids
assert set(Counter(j['bookId'] for j in jobs).values()) == {2}
assert game['representativeGamePassed'] is True
assert {j['key'] for j in jobs} == set(decisions)
for job in jobs:
    assert decisions[job['key']]['approved'] is True, job['key']
    for kind in ('source', 'lineart'):
        assert decisions[job['key']][kind + 'Sha256'] == job[kind + 'Sha256'], job['key']
        assert audits[job['key']][kind + 'Sha256'] == job[kind + 'Sha256'], job['key']
    assert job['status'] == 'generated' and job['colorCheck']['monochromePassed'], job['key']
    for kind in ('source', 'lineart'):
        assert hashlib.sha256((root / job[kind + 'File']).read_bytes()).hexdigest() == job[kind + 'Sha256'], job['key']
    job['previewHold'] = False
    job['reviewStatus'] = 'source-lineart-shared-filled-reviewed; representative-game-verified'
(root / 'manifest.json').write_text(json.dumps(jobs, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
destination = workspace / 'generated-images' / range_name / args.collection
destination.mkdir(parents=True, exist_ok=True)
(destination / 'generation-requests.json').write_text(json.dumps([
    {'key': j['key'], 'sourceSha256': j['sourceSha256'], **j['generation']}
    for j in jobs
], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
review = {
    'books': expected_books, 'scenes': expected_books * 2,
    'allScenes': ['source/lineart/shared-engine-filled visual comparison', 'monochrome pixels', 'source and lineart SHA256'],
    'actualGame': game,
    'sourceExceptions': [j['key'] for j in jobs if j['sourceOrigin'].startswith('New built-in')],
    'runtime': 'Source-pixel palette unchanged; no answer colors, brightness adjustment or global median',
}
(root / 'review.json').write_text(json.dumps(review, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(destination / 'review.json').write_text(json.dumps(review, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'collection': args.collection, 'books': expected_books, 'scenes': expected_books * 2, 'held': 0}))
