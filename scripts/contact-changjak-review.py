"""Inspection-only contact sheets; selected production images are never changed."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument('collection')
parser.add_argument('--kind', choices=['source', 'compare'], default='source')
parser.add_argument('--start', type=int, default=0)
parser.add_argument('--count', type=int, default=100)
parser.add_argument('--keys', nargs='*')
args = parser.parse_args()
root = Path('D:/ComfyUI-output/classic-scene-coloring') / args.collection
jobs = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
if args.keys is not None:
    jobs = [job for job in jobs if job['key'] in args.keys]
out = root / 'review-workspace'
out.mkdir(parents=True, exist_ok=True)
columns = 1 if args.kind == 'compare' else 2
per_sheet = 5 if args.kind == 'compare' else 10
end = min(args.start + args.count, len(jobs))
for start in range(args.start, end, per_sheet):
    subset = jobs[start:min(start + per_sheet, end)]
    sheet = Image.new('RGB', (1200, (len(subset) + columns - 1) // columns * 365), 'white')
    draw = ImageDraw.Draw(sheet)
    for i, job in enumerate(subset):
        x, y = i % columns * 600, i // columns * 365
        draw.text((x + 5, y + 5), job['key'], fill='black')
        files = [root / job['sourceFile']]
        if args.kind == 'compare':
            files += [root / job['lineartFile'], root / 'audit' / (job['key'] + '-filled.png')]
        for col, file in enumerate(files):
            width = 400 if args.kind == 'compare' else 600
            if not file.exists():
                draw.text((x + col * width + 5, y + 55), 'SOURCE NOT PROVIDED', fill='red')
                continue
            with Image.open(file) as image:
                thumb = ImageOps.contain(image.convert('RGB'), (width, 330))
                sheet.paste(thumb, (x + col * width, y + 28))
    file = out / f'{args.kind}-{start:03}.jpg'
    sheet.save(file, quality=88)
    print(file.as_posix())
