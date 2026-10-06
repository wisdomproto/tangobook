"""Reconcile existing inspected decisions and exact source-correction provenance."""
import json
from pathlib import Path
base = Path('D:/ComfyUI-output/classic-scene-coloring')
workspace = Path(__file__).resolve().parents[1]
for series in ['coco', 'mei', 'dodo', 'bruno', 'twins', 'mio', 'pipo', 'nono', 'lulu']:
    root = base / ('changjak-' + series)
    jobs = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
    visual = root / 'review-workspace/visual-review.json'
    decisions = json.loads(visual.read_text(encoding='utf-8'))
    decisions = {j['key']: decisions[j['key']] for j in jobs}
    for job in jobs:
        decision = decisions[job['key']]
        if decision['approved']:
            # These current approved outputs have been actually visually inspected.
            decision.update(sourceSha256=job['sourceSha256'], lineartSha256=job['lineartSha256'])
        correction = workspace / ('generated-images/changjak-2-10/source-correction-' + job['key'] + '.txt')
        if correction.exists():
            job['sourceCorrection'] = {'prompt': correction.read_text(encoding='utf-8').strip(),
                'outputSha256': job['sourceSha256'], 'mode': 'built-in-imagegen-new-story-source-edit'}
    visual.write_text(json.dumps(decisions, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (root / 'manifest.json').write_text(json.dumps(jobs, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(series, sum(d['approved'] for d in decisions.values()), len(jobs))
