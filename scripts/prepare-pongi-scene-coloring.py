"""Prepare the complete series-1 scene plan from the current read-only book snapshot.

No image generation, publication, or changes to the other collections.
"""
import concurrent.futures
import hashlib
import json
import urllib.request
from pathlib import Path

ROOT = Path('D:/ComfyUI-output/classic-scene-coloring/changjak-pongi')
SELECTION = [
    (1, 8), (2, 9), (4, 9), (4, 6), (3, 9), (5, 9), (6, 9), (4, 9),
    (6, 9), (6, 9), (4, 8), (6, 10), (4, 8), (4, 8), (1, 9), (5, 10),
    (5, 8), (5, 10), (5, 7), (2, 7), (3, 10), (7, 9), (5, 8), (4, 10),
    (5, 9), (1, 7), (6, 7), (1, 6), (4, 8), (3, 8), (2, 7), (1, 5),
    (1, 7), (2, 8), (5, 8), (2, 7), (4, 8), (5, 8), (4, 7), (3, 5),
    (6, 8), (2, 7), (2, 8), (5, 10), (1, 8), (6, 8), (1, 8), (1, 6),
    (1, 7), (3, 7),
]


def save(target, value):
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


books = sorted(json.loads((ROOT / 'inventory.json').read_text(encoding='utf-8-sig')), key=lambda b: b['id'])
assert len(books) == 50
previous = {j['key']: j for j in json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))} if (ROOT / 'manifest.json').exists() else {}
jobs = []
for book, selected in zip(books, SELECTION):
    for number in selected:
        page = next(p for p in book['pages'] if p.get('pageNumber', p.get('page_number')) == number)
        key = f"{book['id']}-p{number:02}"
        prompt = (
            'Use case: illustration-story. Asset type: preschool story scene coloring-game line art. '
            'Input image 1 is the actual story illustration, a composition and character reference. '
            'Convert this scene into a simple, friendly black-and-white coloring page with the same '
            'landscape aspect ratio, character positions, species, number, pose, action and essential props. '
            'Keep Pongi the small otter with neck ribbon, dad with overalls, mom with tied headscarf, '
            'the smaller baby, and the goose only when they are actually present in the reference. '
            'Use bold smooth continuous black outlines and PURE WHITE interiors. Every large body, '
            'face, garment and key prop must have a CLOSED outline; close cropped shapes inside the canvas. '
            'Keep broad easy-to-paint shapes, visible friendly eyes with tiny black pupils and white surrounding area. '
            'Simplify background texture and small details while keeping the important story objects. '
            'Preserve approximate geometry so colors sampled from the original match corresponding regions. '
            'No grayscale fills, no shading, no hatching, no colored pixels, no solid black bodies, '
            'no lettering, captions, border or watermark. Do not add characters or change the action. '
            f"Story page {number}: {page.get('text', '')} "
            f"Original scene description: {page.get('sceneDescription', page.get('scene_description', ''))}"
        )
        job = dict(key=key, bookId=book['id'], title=book['title'], artStyle=book.get('artStyle'),
                   collection='changjak-pongi', pageNumber=number, originalUrl=page.get('illustrationUrl'),
                   text=page.get('text', ''), ttsUrl=page.get('ttsUrl'), translations=page.get('translations', {}),
                   backgroundMusicUrl=book.get('backgroundMusicUrl') or 'https://www.tangobook.co.kr/sounds/bgm/default-1.mp3',
                   sourceFile=f'sources/{key}.png', lineartFile=f'lineart/{key}.png', status='pending',
                   selectionReason='주요 행동과 이야기의 변화가 드러나는 두 장면을 본문에서 선정',
                   sceneDescription=page.get('sceneDescription', page.get('scene_description', '')),
                   generation={'skill': 'imagegen', 'mode': 'built-in', 'prompt': prompt})
        if key in previous:
            job.update(previous[key])
        jobs.append(job)


def download(job):
    target = ROOT / job['sourceFile']
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        if not job['originalUrl']:
            doc_id = job['bookId'].removeprefix('changjak-')
            if doc_id == 'pongi-29':
                selected = Path(__file__).resolve().parents[1] / 'docs/work/content/tasks/20260929-pongi-qwen-selected.json'
                image = next(i for i in json.loads(selected.read_text(encoding='utf-8'))['images'] if i['book'] == doc_id and i['page'] == f"p{job['pageNumber']}")
                data = Path(image['file']).read_bytes()
                assert hashlib.sha256(data).hexdigest() == image['sha256']
                target.write_bytes(data)
                job['sourceOrigin'] = 'Previously selected Pongi illustration; comic-assets entry belongs to another series'
                job['sourceSha256'] = hashlib.sha256(data).hexdigest()
                return
            with urllib.request.urlopen(f'https://www.tangobook.co.kr/api/comic-assets/{doc_id}', timeout=90) as response:
                assets = json.load(response)['data']
            job['originalUrl'] = assets.get(f"p{job['pageNumber']}")
            if job['originalUrl']:
                job['sourceOrigin'] = 'Existing comic-assets illustration; currently unlinked in the book'
            elif doc_id == 'pongi-07':
                selected = Path(__file__).resolve().parents[1] / 'docs/work/content/tasks/20260929-pongi-qwen-selected.json'
                image = next(i for i in json.loads(selected.read_text(encoding='utf-8'))['images'] if i['book'] == doc_id and i['page'] == f"p{job['pageNumber']}")
                data = Path(image['file']).read_bytes()
                assert hashlib.sha256(data).hexdigest() == image['sha256']
                target.write_bytes(data)
                job['sourceOrigin'] = 'Previously selected local illustration; production source absent'
                job['sourceSha256'] = hashlib.sha256(data).hexdigest()
                return
            else:
                job['status'] = 'source-needed'
                job['sourceOrigin'] = 'No published or comic-assets illustration; new scene illustration required'
                return
        # Preserve original bytes; Pillow/browser detect the real image format.
        request = urllib.request.Request(job['originalUrl'], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=90) as response:
            target.write_bytes(response.read())
    job['sourceSha256'] = hashlib.sha256(target.read_bytes()).hexdigest()


with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    list(pool.map(download, jobs))
save(ROOT / 'manifest.json', jobs)
save(ROOT / 'source-selection-review.json', {
    'series': '01. 퐁이네 운하 마을', 'books': 50, 'scenes': 100,
    'selection': [{'bookId': b['id'], 'title': b['title'], 'pages': list(p)} for b, p in zip(books, SELECTION)],
    'method': 'Current published book text/scene description; two distinct main-action pages per book. Visual reference check required before generation.',
})
save(ROOT / 'imagegen-prompts.json', [{'key': j['key'], **j['generation']} for j in jobs])
print(json.dumps({'books': 50, 'scenes': len(jobs), 'sourcesDownloaded': sum((ROOT / j['sourceFile']).exists() for j in jobs), 'generated': sum(j['status'] == 'generated' for j in jobs)}))
