"""Read-only inventory for the four additional coloring collections."""
import concurrent.futures
import json
from pathlib import Path
import urllib.request

root = Path('D:/ComfyUI-output/classic-scene-coloring')
configuration = json.loads(Path(__file__).with_name('scene-coloring-collections.json').read_text(encoding='utf-8'))


def get(url):
    with urllib.request.urlopen(url, timeout=90) as response:
        return json.load(response)['data']


books = get('https://www.tangobook.co.kr/api/storybooks')
counts = {}
for collection in configuration[2:]:
    directory = root / collection['directory']
    (directory / 'books').mkdir(parents=True, exist_ok=True)
    selected = [b for b in books if b.get('category') in collection['categories']]

    def full(book):
        target = directory / 'books' / (str(book['id']) + '.json')
        if target.exists():
            return json.loads(target.read_text(encoding='utf-8'))
        result = get('https://www.tangobook.co.kr/api/storybooks/' + str(book['id']))
        temporary = target.with_suffix('.tmp')
        temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
        temporary.replace(target)
        return result

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        inventory = list(pool.map(full, selected))
    (directory / 'inventory.json').write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding='utf-8')
    lines = []
    for book in sorted(inventory, key=lambda b: b['title']):
        lines.append('\n' + book['title'] + ' | ' + str(book['id']))
        for page in book.get('pages', []):
            if page.get('illustrationUrl'):
                lines.append(str(page['pageNumber']) + ': ' + page.get('text', '').replace('\n', ' '))
    (directory / 'page-texts.txt').write_text('\n'.join(lines), encoding='utf-8')
    counts[collection['id']] = {'books': len(inventory), 'illustratedPages': sum(bool(p.get('illustrationUrl')) for b in inventory for p in b.get('pages', [])), 'state': 'inventory-ready-selection-pending'}
    print(collection['id'], counts[collection['id']], flush=True)
(root / 'additional-inventory-status.json').write_text(json.dumps(counts, indent=2), encoding='utf-8')
