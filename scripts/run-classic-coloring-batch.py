"""Persistent local generation runner; retains progress across transient failures."""
import hashlib
import importlib.util
import json
import msvcrt
import os
import subprocess
import sys
import time
from pathlib import Path

workspace = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('production', workspace / 'scripts/classic-scene-coloring.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
m.ROOT.mkdir(parents=True, exist_ok=True)
lock = open(m.ROOT / 'batch.lock', 'a+b')
lock.seek(0)
if not lock.read(1):
    lock.write(b'0')
    lock.flush()
lock.seek(0)
try:
    msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
except OSError:
    raise SystemExit('A classic coloring batch runner is already active')
environment = dict(os.environ, PYTHONIOENCODING='utf-8', PYTHONUNBUFFERED='1')
with open(m.ROOT / 'batch.log', 'a', encoding='utf-8') as log:
    for attempt in range(1, 4):
        m.save(m.ROOT / 'batch-status.json', {'state': 'running', 'pid': os.getpid(), 'attempt': attempt, 'promptVersion': m.PROMPT_VERSION})
        result = subprocess.run([sys.executable, '-u', str(workspace / 'scripts/classic-scene-coloring.py'), 'generate'], cwd=workspace, env=environment, stdout=log, stderr=log)
        if result.returncode == 0:
            break
        log.write(f'Worker stopped with code {result.returncode}; attempt {attempt}/3\n')
        log.flush()
        if attempt < 3:
            time.sleep(30)
    else:
        m.save(m.ROOT / 'batch-status.json', {'state': 'needs-attention', 'pid': os.getpid(), 'log': 'batch.log'})
        raise SystemExit('Generation failed after three attempts; inspect batch.log')
    jobs = json.loads((m.ROOT / 'manifest.json').read_text(encoding='utf-8'))
    for j in jobs:
        if j['status'] != 'generated':
            raise RuntimeError('Incomplete job: ' + j['key'])
        for file_key, hash_key in [('sourceFile', 'sourceSha256'), ('lineartFile', 'lineartSha256')]:
            actual = hashlib.sha256((m.ROOT / j[file_key]).read_bytes()).hexdigest()
            if actual != j[hash_key]:
                raise RuntimeError('Hash mismatch: ' + j['key'] + ' ' + file_key)
        history = json.loads((m.ROOT / 'history' / (j['key'] + '.json')).read_text(encoding='utf-8'))
        m.save(m.ROOT / 'workflows' / (j['key'] + '.json'), history['prompt'][2])
    # Refresh the gallery and create original/lineart sheets for subsequent visual review.
    m.save(m.ROOT / 'manifest.json', jobs)
    for start in range(0, len(jobs), 6):
        subprocess.run([sys.executable, str(workspace / 'scripts/classic-coloring-contact.py'), '--start', str(start)], cwd=workspace, env=environment, stdout=log, stderr=log, check=True)
    m.save(m.ROOT / 'batch-status.json', {'state': 'generated-review-pending', 'books': len({j['bookId'] for j in jobs}), 'images': len(jobs), 'hashesVerified': True, 'gallery': 'index.html', 'visualReview': 'review.json', 'message': '생성 완료는 전체 육안·플레이 검수 승인이 아닙니다.'})
