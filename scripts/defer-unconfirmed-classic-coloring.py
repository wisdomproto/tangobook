"""Preserve unconfirmed original-server requests while using the recovered server."""
import importlib.util
import json
import urllib.request
from pathlib import Path
spec = importlib.util.spec_from_file_location('production', Path(__file__).with_name('classic-scene-coloring.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
jobs = json.loads((m.ROOT / 'manifest.json').read_text(encoding='utf-8'))
for j in jobs:
    if j['status'] not in ['generating','color-repairing']:
        continue
    original = j.get('promptEndpoint','http://127.0.0.1:8189')
    try:
        with urllib.request.urlopen(original + '/history/' + j['promptId'],timeout=3) as response:
            json.load(response)
    except (TimeoutError, OSError):
        j['resumePhase'] = j['status']
        j['promptEndpoint'] = original
        j['status'] = 'waiting-original-server'
        j['deferReason'] = 'Original API unresponsive; preserve promptId and avoid duplicate submissions'
    else:
        raise SystemExit('Original server responds; recover the original request before switching')
m.save(m.ROOT / 'manifest.json',jobs)
print('Preserved unconfirmed requests:',[j['key'] for j in jobs if j['status']=='waiting-original-server'])
