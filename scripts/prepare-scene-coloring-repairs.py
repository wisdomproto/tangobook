"""Generate sequential Qwen candidates; never apply or publish unreviewed images."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone

p = argparse.ArgumentParser()
p.add_argument('plan', type=Path)
a = p.parse_args()
root = Path(os.environ.get('SCENE_COLORING_ROOT', 'D:/ComfyUI-output/classic-scene-coloring'))
plan = json.loads(a.plan.read_text(encoding='utf-8-sig'))
destination = root / 'candidate-batches' / a.plan.stem
destination.mkdir(parents=True, exist_ok=True)
lock = destination / 'worker.lock'
status_file = destination / 'status.json'
with lock.open('x', encoding='utf-8') as f:
    f.write(str(os.getpid()))

status = json.loads(status_file.read_text(encoding='utf-8')) if status_file.exists() else {'items': {}}
status.update(pid=os.getpid(), state='running', plan=str(a.plan), total=len(plan))
endpoint = os.environ.get('CLASSIC_COLORING_COMFY_URL', 'http://127.0.0.1:8190').rstrip('/')


def save():
    status['updatedAt'] = datetime.now(timezone.utc).isoformat()
    temporary = status_file.with_suffix('.tmp')
    temporary.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding='utf-8')
    temporary.replace(status_file)


try:
    save()
    for item in plan:
        key = item['key']
        job = next(j for j in json.loads((root / 'manifest.json').read_text(encoding='utf-8')) if j['key'] == key)
        source_sha = hashlib.sha256((root / job['sourceFile']).read_bytes()).hexdigest()
        instruction_sha = hashlib.sha256(item['instruction'].encode()).hexdigest()
        previous = status['items'].get(key, {})
        if previous.get('state') == 'candidate-awaiting-review' and previous.get('sourceSha256') == source_sha and previous.get('instructionSha256') == instruction_sha:
            continue
        # If a previous run recorded an in-flight submission, inspect its history
        # manually before resuming. Never blindly submit that key again.
        if previous.get('state') in ('generating', 'failed-or-uncertain'):
            raise RuntimeError('Submission requires history reconciliation: ' + key)
        status.update(current=key, state='waiting-for-queue')
        save()
        while True:
            with urllib.request.urlopen(endpoint + '/queue', timeout=15) as response:
                queue = json.load(response)
            if not queue['queue_running'] and not queue['queue_pending']:
                break
            time.sleep(10)
        output = destination / key
        output.mkdir(exist_ok=True)
        for suffix in ['.png', '-history.json', '-workflow.json']:
            old = root / 'repairs' / (key + suffix)
            if old.exists() and not (output / ('previous' + suffix)).exists():
                shutil.copyfile(old, output / ('previous' + suffix))
        status['items'][key] = {'state': 'generating', 'sourceSha256': source_sha, 'instructionSha256': instruction_sha}
        status['state'] = 'running'
        save()
        command = [sys.executable, str(Path(__file__).with_name('repair-classic-coloring.py')), key, item['instruction']]
        if item.get('reference'):
            command.extend(['--reference', item['reference']])
        elif item.get('lineart'):
            command.append('--lineart')
        with (output / 'worker.log').open('w', encoding='utf-8') as log:
            result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, env={**os.environ, 'CLASSIC_COLORING_COMFY_URL': endpoint}, check=False)
        if result.returncode:
            status['items'][key]['state'] = 'failed-or-uncertain'
            save()
            raise RuntimeError('Candidate failed; reconcile prompt history: ' + key)
        for suffix in ['.png', '-history.json', '-workflow.json']:
            shutil.copyfile(root / 'repairs' / (key + suffix), output / (key + suffix))
        status['items'][key].update(state='candidate-awaiting-review', output=str(output), candidateSha256=hashlib.sha256((output / (key + '.png')).read_bytes()).hexdigest())
        save()
        print('Candidate awaiting review:', key, flush=True)
    status.update(state='all-candidates-awaiting-review', current=None)
    save()
except Exception as error:
    status.update(state='needs-attention', error=str(error))
    save()
    raise
finally:
    lock.unlink()
