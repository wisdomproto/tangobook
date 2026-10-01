"""Compare completed candidates without changing the active or published images."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument('batch', type=Path)
parser.add_argument('--root', type=Path, default=Path('D:/ComfyUI-output/classic-scene-coloring'))
args = parser.parse_args()
workspace = Path(__file__).resolve().parent.parent
status = json.loads((args.batch / 'status.json').read_text(encoding='utf-8'))
jobs = {j['key']: j for j in json.loads((args.root / 'manifest.json').read_text(encoding='utf-8-sig'))}
output = args.batch / 'review-workspace'
output.mkdir(exist_ok=True)
previous_file = output / 'candidate-checks.json'
previous_checks = {item['key']: item for item in json.loads(previous_file.read_text(encoding='utf-8'))} if previous_file.exists() else {}
spec = importlib.util.spec_from_file_location('quality', workspace / 'scripts/classic-coloring-quality.py')
quality = importlib.util.module_from_spec(spec)
spec.loader.exec_module(quality)
selected, report = [], []
for key, item in status['items'].items():
    if item['state'] != 'candidate-awaiting-review':
        continue
    job = jobs[key]
    candidate = Path(item['output']) / (key + '.png')
    source = args.root / job['sourceFile']
    candidate_sha = hashlib.sha256(candidate.read_bytes()).hexdigest()
    source_sha = hashlib.sha256(source.read_bytes()).hexdigest()
    if candidate_sha != item['candidateSha256'] or source_sha != item['sourceSha256']:
        raise ValueError('Candidate/source hash changed: ' + key)
    check = quality.color_report(candidate)
    report.append({'key': key, 'sourceSha256': source_sha, 'candidateSha256': candidate_sha, 'colorCheck': check})
    if not check['monochromePassed']:
        continue
    copied = dict(job, sourceFile='sources/' + key + '.png', lineartFile='lineart/' + key + '.png',
                  status='generated', lineartSha256=candidate_sha)
    for local, original in [(copied['sourceFile'], source), (copied['lineartFile'], candidate)]:
        target = output / local
        target.parent.mkdir(exist_ok=True)
        shutil.copyfile(original, target)
    selected.append(copied)
(output / 'manifest.json').write_text(json.dumps(selected, ensure_ascii=False, indent=2), encoding='utf-8')
environment = dict(os.environ, SCENE_COLORING_ROOT=str(output), PYTHONIOENCODING='utf-8')
subprocess.run(['node', '--import', './packages/server/node_modules/tsx/dist/loader.mjs',
                'scripts/audit-classic-coloring.mts'], cwd=workspace,
               env=environment, check=True)
audits = {a['key']: a for a in json.loads((output / 'audit.json').read_text(encoding='utf-8'))}
for item in report:
    item['engineAudit'] = audits.get(item['key'])
    item['approval'] = 'pending-visual-and-play-review'
    previous = previous_checks.get(item['key'], {})
    if previous.get('candidateSha256') == item['candidateSha256'] and previous.get('sourceSha256') == item['sourceSha256']:
        if 'visualReview' in previous:
            item['visualReview'] = previous['visualReview']
(output / 'candidate-checks.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 18)
for start in range(0, len(selected), 4):
    chosen = selected[start:start + 4]
    sheet = Image.new('RGB', (1440, 300 * len(chosen)), '#f3f3ed')
    draw = ImageDraw.Draw(sheet)
    for index, job in enumerate(chosen):
        y = index * 300
        audit = audits[job['key']]
        draw.text((8, y + 5), f"{job['title']} / p{job['pageNumber']} / {job['key']} / {audit['required']}칸 {audit['colors']}색 {audit['paintablePercent']}%", font=font, fill='black')
        files = [job['sourceFile'], job['lineartFile'], 'audit/' + job['key'] + '-filled.png']
        for column, filename in enumerate(files):
            picture = ImageOps.contain(Image.open(output / filename).convert('RGB'), (476, 260))
            sheet.paste(picture, (column * 480 + (480 - picture.width) // 2, y + 34 + (260 - picture.height) // 2))
    sheet.save(output / f'comparison-{start:03}.jpg', quality=95)
print(json.dumps({'checked': len(report), 'monochromePassed': len(selected), 'output': str(output)}))
