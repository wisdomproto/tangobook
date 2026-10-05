"""Copy a built-in imagegen output and validate monochrome pixels; no image editing."""
import argparse
import hashlib
import json
import shutil
import os
import time
from contextlib import contextmanager
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('collection')
parser.add_argument('key')
parser.add_argument('generated_path')
parser.add_argument('--source', action='store_true')
parser.add_argument('--prompt-file')
args = parser.parse_args()
old_series = {'changjak-coco', 'changjak-mei', 'changjak-dodo', 'changjak-bruno', 'changjak-twins', 'changjak-mio', 'changjak-pipo', 'changjak-nono', 'changjak-lulu'}
new_series = {'changjak-bung', 'changjak-dingding', 'changjak-taro', 'changjak-yuki', 'changjak-mina', 'changjak-kota', 'changjak-moya', 'changjak-bami', 'changjak-dari'}
assert args.collection in old_series | new_series
range_name = 'changjak-11-19' if args.collection in new_series else 'changjak-2-10'
root = Path('D:/ComfyUI-output/classic-scene-coloring') / args.collection
workspace = Path(__file__).resolve().parents[1]

@contextmanager
def manifest_lock():
    lock = root / 'import.lock'
    for attempt in range(300):
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
            break
        except FileExistsError:
            if attempt == 299:
                raise RuntimeError('Import lock occupied; inspect the owner before retrying')
            time.sleep(.1)
    try:
        yield
    finally:
        lock.unlink()

with manifest_lock():
    jobs = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
    job = next(j for j in jobs if j['key'] == args.key)
    kind = 'source' if args.source else 'lineart'
    final = workspace / 'generated-images' / range_name / args.collection / kind / (args.key + '.png')
    final.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(args.generated_path, final)
    target = root / job[kind + 'File']
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(args.generated_path, target)
    sha = hashlib.sha256(target.read_bytes()).hexdigest()
    job[kind + 'Sha256'] = sha
    if args.source:
        job['sourceOrigin'] = 'New built-in imagegen story illustration; original absent'
        job['status'] = 'pending'
    else:
        with Image.open(target) as image:
            pixels = image.convert('RGB')
            colored = sum(max(p) - min(p) > 10 for p in pixels.get_flattened_data())
            total = pixels.width * pixels.height
        job['colorCheck'] = {'monochromePassed': colored / total <= .001, 'coloredPixels': colored, 'totalPixels': total}
        prompt = Path(args.prompt_file).read_text(encoding='utf-8').strip() if args.prompt_file else (workspace / 'generated-images' / range_name / 'generation-prompt.txt').read_text(encoding='utf-8').strip() + ' Scene identity: ' + args.key
        job.setdefault('generation', {'skill': 'imagegen', 'mode': 'built-in-reference-edit'}).update(outputSha256=sha, outputFile=final.relative_to(workspace).as_posix(), prompt=prompt)
        job['status'] = 'generated' if job['colorCheck']['monochromePassed'] else 'needs-monochrome-review'
    job['previewHold'] = True
    job['reviewStatus'] = 'awaiting-source-filled-review'
    temporary = root / ('manifest-' + args.key + '.tmp')
    temporary.write_text(json.dumps(jobs, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(root / 'manifest.json')
    print(json.dumps({'key': args.key, 'kind': kind, 'sha256': sha, 'status': job['status']}))
