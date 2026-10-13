"""Cut GPT skill page sheets; select only explicitly reviewed page IDs."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'generated-images/phonics-missing-20261012'

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def cut(sheet_id):
    sheets = read(ROOT / 'gpt/sheets-plan.json')['sheets']
    if (ROOT / 'gpt/nine-plan.json').exists():
        sheets += read(ROOT / 'gpt/nine-plan.json')['sheets']
    sheet = next(s for s in sheets if s['id'] == sheet_id)
    image = Image.open(ROOT / 'gpt' / (sheet_id + '.png')).convert('RGB')
    width, height = image.size
    columns = sheet.get('columns', 2)
    rows = sheet.get('rows', 2)
    for index, page in enumerate(sheet['pages']):
        x = (index % columns) * (width // columns)
        y = (index // columns) * (height // rows)
        frame = image.crop((x, y, x + width // columns, y + height // rows))
        frame.save(ROOT / 'gpt' / (page['id'] + '.png'))
    print(json.dumps({'sheet': sheet_id, 'candidates': [p['id'] for p in sheet['pages']]}))

def select(ids, basis):
    selected = read(ROOT / 'selected.json')
    reviews = read(ROOT / 'review.json')
    plan = read(ROOT / 'plan.json')['jobs']
    existing = {p['id']: p for p in selected['images']}
    for page_id in ids:
        if page_id in existing:
            raise ValueError('Already selected; do not silently overwrite ' + page_id)
        job = next(p for p in plan if p['id'] == page_id)
        book = read(ROOT / 'books-before' / (job['bookId'] + '.json'))
        file = ROOT / 'final' / (page_id + '.webp')
        image = Image.open(ROOT / 'gpt' / (page_id + '.png')).convert('RGB')
        if image.width > 1024:
            image.thumbnail((1024, 576), Image.Resampling.LANCZOS)
        image.save(file, 'WEBP', quality=88, method=6)
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        selected['images'].append({'id': page_id, 'bookId': job['bookId'],
            'pageNumber': job['pageNumber'], 'title': book['title'],
            'file': 'final/' + file.name, 'sha256': digest})
        reviews[page_id] = {'status': 'pass', 'sha256': digest, 'basis': basis}
    selected['expected'] = len(selected['images'])
    for name, data in [('selected.json', selected), ('review.json', reviews)]:
        (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'selected': len(ids), 'total': selected['expected']}))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cut-sheet')
    parser.add_argument('--select', nargs='+')
    parser.add_argument('--review-basis')
    args = parser.parse_args()
    if args.cut_sheet:
        cut(args.cut_sheet)
    if args.select:
        if not args.review_basis:
            parser.error('--select requires the actual reviewer basis')
        select(args.select, args.review_basis)
