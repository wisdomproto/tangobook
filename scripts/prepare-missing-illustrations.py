"""Read current target books and download actual references; never writes production."""
import concurrent.futures as futures
import json
from pathlib import Path
import urllib.request
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'generated-images' / 'missing-pages-20261012'
TARGETS = {
    '1772181399388': [11], '1773618909980': [12, 13, 14, 15, 16],
    '1777605651238': [1], '1777615068642': [12], '1778555233699': [6, 7, 8, 10],
    '1782831061108': [6], '1783949746731': [3, 4, 6, 7, 8],
    '1783990215278': [2], '1789350946317': [9], '1789350946352': [7],
}

def get(url):
    from urllib.parse import urlsplit, urlunsplit, quote
    u = urlsplit(url)
    url = urlunsplit((u.scheme, u.netloc, quote(u.path, safe='/%'), quote(u.query, safe='=&%'), u.fragment))
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.tangobook.co.kr/'})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read()

def prepare(pair):
    bid, pages = pair
    folder = OUT / bid
    folder.mkdir(parents=True, exist_ok=True)
    if (folder / 'before.json').exists():
        raise FileExistsError(f'Preserve the original baseline: {folder / "before.json"}. Use a new output folder for a new audit.')
    book = json.loads(get(f'https://www.tangobook.co.kr/api/storybooks/{bid}'))['data']
    (folder / 'before.json').write_text(json.dumps(book, ensure_ascii=False, indent=2), encoding='utf-8')
    refs = {}
    for p in book['pages']:
        if p.get('illustrationUrl'):
            dest = folder / f"ref-p{p['pageNumber']:02d}.webp"
            imgdata = get(p['illustrationUrl'])
            (folder / f"ref-p{p['pageNumber']:02d}.original").write_bytes(imgdata)
            import io
            with Image.open(io.BytesIO(imgdata)) as im:
                im.convert('RGB').save(dest, 'WEBP', quality=92)
            refs[p['pageNumber']] = dest
    chars = []
    for i, ch in enumerate(book.get('characters', [])):
        if ch.get('referenceImage'):
            import io
            dest = folder / f'ref-char{i}.webp'
            with Image.open(io.BytesIO(get(ch['referenceImage']))) as im:
                im.convert('RGB').save(dest, 'WEBP', quality=92)
            chars.append((ch['name'], dest))
    tiles = [(f'p{n}', p) for n, p in refs.items()] + [(f'character {i}', p) for i, (_, p) in enumerate(chars)]
    sheet = Image.new('RGB', (1200, ((len(tiles)+3)//4)*190), '#f5eee4')
    d = ImageDraw.Draw(sheet)
    for i, (label, p) in enumerate(tiles):
        with Image.open(p) as im:
            im.thumbnail((292,164));x=(i%4)*300+(300-im.width)//2;y=(i//4)*190
            sheet.paste(im,(x,y+20));d.text(((i%4)*300+5,y+3),label,fill='black')
    sheet.save(folder/'references.webp','WEBP',quality=90)
    jobs=[]
    for n in pages:
        page=next(p for p in book['pages'] if p['pageNumber']==n)
        if page.get('illustrationUrl'):
            continue
        nearest=sorted(refs,key=lambda k:(abs(k-n),k))[:3]
        refs_for_page=[str(refs[k]) for k in nearest]
        jobs.append({'id':f'{bid}-p{n:02d}','bookId':bid,'title':book['title'],'pageNumber':n,
          'text':page['text'],'scene':page.get('scene_description',''),
          'structure':page.get('scene_structure',{}),'artStyle':book.get('artStyle'),
          'references':refs_for_page,'referencePages':nearest,
          'out':str(folder/f'p{n:02d}.png')})
    return jobs

if __name__ == '__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    jobs=[]
    with futures.ThreadPoolExecutor(max_workers=4) as pool:
        for rows in pool.map(prepare, TARGETS.items()):jobs.extend(rows)
    (OUT/'jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Prepared {len(jobs)} missing pages in {OUT}')
