"""Read-only fresh source snapshots, real image references, and missing asset jobs."""
import argparse, concurrent.futures, importlib.util, json, time, urllib.request
from pathlib import Path

WORK = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('missing_tts', WORK / 'scripts/library-missing-tts.py')
tts = importlib.util.module_from_spec(spec); spec.loader.exec_module(tts)

def get(url):
    from urllib.parse import urlsplit, urlunsplit, quote
    u = urlsplit(url)
    url = urlunsplit((u.scheme, u.netloc, quote(u.path, safe='/%'), quote(u.query, safe='=&%'), u.fragment))
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'}), timeout=90) as r:
        return r.read()

def main():
    args = argparse.ArgumentParser(); args.add_argument('--images', type=Path, required=True); args.add_argument('--audio', type=Path, required=True)
    a = args.parse_args()
    assert not (a.images / 'plan.json').exists() and not (a.audio / 'plan.json').exists(), 'Preserve existing plans'
    listing = json.loads(get('https://www.tangobook.co.kr/api/storybooks'))['data']
    ids = [b['id'] for b in listing if b.get('type') == 'phonics' and b['id'].startswith(('kr-', 'en-'))]
    assert len(ids) == 71
    image_jobs, audio_jobs, sources = [], [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        books = list(pool.map(tts.fetch_book, ids))
    for b in sorted(books, key=lambda x:x['id']):
        source = tts.source_hash(b)
        tts.tts.save(a.images / 'books-before' / (b['id'] + '.json'), b)
        tts.tts.save(a.audio / 'books-before' / (b['id'] + '.json'), b)
        refs = []
        missing = [p for p in b['pages'] if not p.get('illustrationUrl')]
        if missing:
            for p in [p for p in b['pages'] if p.get('illustrationUrl')]:
                dest = a.images / 'references' / f"{b['id']}-p{tts.page_number(p):02d}.webp"
                dest.parent.mkdir(parents=True, exist_ok=True)
                import io
                from PIL import Image
                with Image.open(io.BytesIO(get(p['illustrationUrl']))) as im:
                    im.convert('RGB').save(dest, 'WEBP', quality=92)
                refs.append({'page':tts.page_number(p), 'path':str(dest), 'url':p['illustrationUrl'], 'sha256':tts.tts.digest(dest.read_bytes())})
        for p in b['pages']:
            n = tts.page_number(p)
            if not p.get('illustrationUrl'):
                image_jobs.append({'id':f"{b['id']}-p{n:02d}", 'bookId':b['id'], 'pageNumber':n,
                    'sourceSha256':source, 'artStyle':b.get('artStyle'), 'text':p['text'],
                    'scene':p.get('scene_description',''), 'structure':p.get('scene_structure',{}),
                    'characters':b.get('characters',[]), 'references':sorted(refs,key=lambda r:abs(r['page']-n))[:3]})
            if b['id'].startswith('en-') and p.get('text','').strip() and not p.get('ttsUrl'):
                audio_jobs.append({'bookId':b['id'], 'title':b['title'], 'pageNumber':n, 'language':'en',
                    'sourceSha256':source, 'existingText':p['text'], 'sourceLanguage':'en', 'targetField':'ttsUrl'})
        if any(j['bookId']==b['id'] for j in audio_jobs):
            sources.append({'id':b['id'],'title':b['title'],'category':b.get('category'),'sourceSha256':source})
    tts.tts.save(a.images / 'plan.json', {'createdAt':time.time(), 'expected':len(image_jobs), 'jobs':image_jobs})
    tts.tts.save(a.audio / 'plan.json', {'createdAt':time.time(), 'expected':len(audio_jobs), 'books':sources,'jobs':audio_jobs})
    print(json.dumps({'imageJobs':len(image_jobs),'audioJobs':len(audio_jobs),'imageRoot':str(a.images),'audioRoot':str(a.audio)}),flush=True)

if __name__=='__main__':main()
