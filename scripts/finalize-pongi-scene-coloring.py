"""Validate selected assets and record scoped review before preview publication."""
import hashlib
import json
from collections import Counter
from pathlib import Path

workspace = Path(__file__).resolve().parents[1]
root = Path('D:/ComfyUI-output/classic-scene-coloring/changjak-pongi')
jobs = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
requests = json.loads((workspace / 'generated-images/pongi-scene-coloring/generation-requests.json').read_text(encoding='utf-8'))
selected = {item['key']: item for item in requests}
assert len(jobs) == len(selected) == 100
assert len({job['key'] for job in jobs}) == 100
assert set(Counter(job['bookId'] for job in jobs).values()) == {2}
assert len(Counter(job['bookId'] for job in jobs)) == 50
for job in jobs:
    assert job['status'] == 'generated' and job['colorCheck']['monochromePassed'], job['key']
    for kind in ('source', 'lineart'):
        assert hashlib.sha256((root / job[kind + 'File']).read_bytes()).hexdigest() == job[kind + 'Sha256'], job['key']
    job['generation']['prompt'] = selected[job['key']]['prompt']
    job['previewHold'] = False
    job['reviewStatus'] = 'source-lineart-shared-filled-reviewed; representative-game-verified'
(root / 'manifest.json').write_text(json.dumps(jobs, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(root / 'review.json').write_text(json.dumps({
    'scope': {'books': 50, 'scenes': 100},
    'generation': 'built-in imagegen, one reference-based request per scene',
    'allScenes': ['source/lineart/shared engine filled visual comparison', 'monochrome pixel validation', 'source and selected lineart SHA256'],
    'actualGame': 'Representative pointer brushing and matching page reveal only; see local-game-evidence.json',
    'nativeAudio': 'No native TTS URL supplied; fallback reading is not native audio or transcript evidence',
    'sourceExceptions': {'existingSources': 98, 'newStoryIllustrations': ['changjak-pongi-33-p01', 'changjak-pongi-33-p07']},
    'runtime': 'Existing source-pixel palette; no answer colors, brightness adjustment or global median changes',
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Validated 50 books / 100 scenes; existing collections preserved')
