"""Copy built-in imagegen outputs into the project and the scene workspace.

This is asset bookkeeping and pixel validation, never image generation/editing.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('key')
parser.add_argument('generated_path')
parser.add_argument('--source', action='store_true')
args = parser.parse_args()
workspace = Path(__file__).resolve().parents[1]
root = Path('D:/ComfyUI-output/classic-scene-coloring/changjak-pongi')
jobs = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
job = next(j for j in jobs if j['key'] == args.key)
kind = 'source' if args.source else 'lineart'
generated = Path(args.generated_path)
project_file = workspace / 'generated-images/pongi-scene-coloring' / kind / (args.key + '.png')
project_file.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(generated, project_file)
target = root / job[kind + 'File']
target.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(generated, target)
sha = hashlib.sha256(target.read_bytes()).hexdigest()
job[kind + 'Sha256'] = sha
if args.source:
    job['sourceOrigin'] = 'New built-in imagegen story illustration; published illustration absent'
    job['status'] = 'pending'
else:
    with Image.open(target) as image:
        image = image.convert('RGB')
        colored = sum(max(p) - min(p) > 10 for p in image.getdata())
        total = image.width * image.height
    job['colorCheck'] = {'monochromePassed': colored / total <= 0.001, 'coloredPixels': colored, 'totalPixels': total}
    job['generation']['outputSha256'] = sha
    job['generation']['outputFile'] = str(project_file.relative_to(workspace)).replace('\\', '/')
    job['status'] = 'generated' if job['colorCheck']['monochromePassed'] else 'needs-monochrome-review'
    job['previewHold'] = True
    job['reviewStatus'] = 'awaiting-source-filled-and-game-review'
(root / 'manifest.json').write_text(json.dumps(jobs, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'key': args.key, 'kind': kind, 'sha256': sha, 'status': job['status']}, ensure_ascii=False))
