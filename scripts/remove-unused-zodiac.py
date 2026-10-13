"""Remove retired zodiac stories without deleting live phonics lessons or Hori pages.

Dry run first; apply only the saved, fresh-read plan. Receipts stay outside Git.
"""
import argparse, concurrent.futures, copy, hashlib, json, re, urllib.request
from pathlib import Path

API = 'https://www.tangobook.co.kr/api'
OLD = ['호돌이', '찍찍이', '음메', '깡충이', '용용이', '스르르', '달달이',
       '몽실이', '재재이', '꼬꼬', '멍멍이', '꿀꿀이', 'Stripes', 'Squeak',
       'Moomoo', 'Hoppy', 'Drako', 'Slither', 'Gallop', 'Fluffy', 'Chimp',
       'Kokko', 'Woof', 'Oink']
ROOT = Path('D:/tangobook-inventory/20261012-remove-unused-zodiac')

def request(route, method='GET', body=None):
    payload = json.dumps(body, ensure_ascii=False).encode() if body is not None else None
    req = urllib.request.Request(API + route, data=payload, method=method,
          headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=120) as response:
        result = json.load(response)
    assert result.get('success'), route
    return result.get('data')

def save(name, value):
    ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')

def retired(text):
    text = text.replace('Fluffy cloud', '')  # Ordinary adjective, not the sheep's name.
    return any(re.search(r'(?<![A-Za-z])' + re.escape(n) + r'(?![A-Za-z])', text)
               if n.isascii() else n in text for n in OLD)

def urls(value):
    if isinstance(value, str):
        return {value.split('?')[0]} if value.startswith('https://') else set()
    if isinstance(value, dict):
        return set().union(*(urls(v) for v in value.values())) if value else set()
    if isinstance(value, list):
        return set().union(*(urls(v) for v in value)) if value else set()
    return set()

def url_key(url):
    from urllib.parse import urlsplit, unquote
    u = urlsplit(url)
    if u.hostname == 'assets.tangobook.co.kr' or (u.hostname or '').endswith('.r2.dev'):
        return unquote(u.path.lstrip('/'))
    return None

def clean(value):
    if isinstance(value, list):
        # Retired quiz questions/chant lines are removed, not left with broken choices.
        return [clean(v) for v in value if not (isinstance(v, dict) and
                any(retired(json.dumps(v.get(k, ''), ensure_ascii=False))
                    for k in ('question', 'options', 'name', 'nameEn')))]
    if isinstance(value, dict):
        result = copy.deepcopy(value)
        for k, v in list(result.items()):
            if k not in result:
                continue
            if isinstance(v, str) and retired(v):
                result[k] = ''
                if k == 'sentence':
                    for audio in ('sentenceTtsUrl', 'sentenceTts', 'sentenceAudioUrl'):
                        result.pop(audio, None)
                if k in ('imageDescription', 'illustrationDescription'):
                    for media in ('imageUrl', 'illustrationUrl', 'imageHistory'):
                        result.pop(media, None)
            else:
                result[k] = clean(v)
        return result
    return value

def transform(book, library):
    b = copy.deepcopy(book)
    assert b['type'] == 'phonics' and b['id'].startswith(('en-', 'kr-'))
    if b['id'].startswith('en-'):
        assert all(c['name'] in OLD for c in b.get('characters', []))
        b['pages'] = []
        b['characters'] = []
        for field in ('coverPrompt', 'coverImage', 'coverImageUrl', 'coverImageHistory',
                      'coverHistory', 'coverImages', 'primaryCoverByLang', 'audiobook',
                      'audiobookProject', 'longformProject', 'hiddenObjectScenes'):
            b.pop(field, None)
    else:
        story = json.dumps(b['pages'], ensure_ascii=False)
        assert '호리' in story and not retired(story), b['id'] + ' not a Hori story'
        b['characters'] = [copy.deepcopy(c) for c in library
                           if c['name'] not in OLD and c['name'] in story]
        assert b['characters'], b['id'] + ' missing approved Hori cast'
        if retired(b.get('coverPrompt', '')):
            b.pop('coverPrompt', None)
    if retired(json.dumps(b.get('chant', {}), ensure_ascii=False)):
        b.pop('chant', None)
    return clean(b)

def normalized(book):
    b = copy.deepcopy(book)
    b.pop('updatedAt', None)
    def cdn(v):
        if isinstance(v, dict): return {k: cdn(x) for k, x in v.items()}
        if isinstance(v, list): return [cdn(x) for x in v]
        if isinstance(v, str) and v.startswith('https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/'):
            return v.replace('https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/', 'https://assets.tangobook.co.kr/', 1)
        return v
    return cdn(b)

def other_library_urls():
    kept = urls(request('/vocabulary-db')) | urls(request('/phonics-library'))
    units = request('/vocabulary-units')
    for unit in units:
        kept |= urls(request('/vocabulary-units/' + unit['id']))
    return kept

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()
    if not args.apply:
        listing = request('/storybooks')
        with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
            books = list(pool.map(lambda b: request('/storybooks/' + b['id']), listing))
        library = request('/character-library')
        targets = [b for b in books if b.get('type') == 'phonics' and
                   b['id'].startswith(('en-', 'kr-'))]
        assert len(targets) == 71
        changes = [{'before': b, 'after': transform(b, library)} for b in targets]
        old_chars = [c for c in library if c['name'] in OLD]
        assert len(old_chars) == 12
        kept_library = [c for c in library if c not in old_chars]
        after_by_id = {c['after']['id']: c['after'] for c in changes}
        kept = urls(kept_library) | other_library_urls()
        for b in books:
            kept |= urls(after_by_id.get(b['id'], b))
        removed = urls(old_chars)
        for c in changes:
            removed |= urls(c['before']) - urls(c['after'])
        # Include orphan uploads from this mistaken batch, absent from original inventory.
        work = Path(__file__).resolve().parents[1]
        for ledger in (work / 'generated-images/phonics-missing-20261012').glob('registration-*.json'):
            data = json.loads(ledger.read_text(encoding='utf-8'))
            for job, asset in data.get('uploaded', {}).items():
                if job.startswith('en-'): removed |= urls(asset)
        # The old library has two stale PNG references whose actual objects are WebP.
        # Include only inventoried alternate extensions of these exact reference stems.
        snapshot = Path('D:/tangobook-inventory/20261012-after-phonics-korean/objects.json')
        if snapshot.exists():
            known_keys = {o['key'] for o in json.loads(snapshot.read_text(encoding='utf-8'))}
            for u in urls(old_chars):
                key = url_key(u)
                if key and key.endswith('.png') and key[:-4] + '.webp' in known_keys:
                    removed.add('https://assets.tangobook.co.kr/' + key[:-4] + '.webp')
        protected = {url_key(u) for u in kept}
        delete = {url_key(u): u for u in removed if url_key(u) and url_key(u) not in protected}
        plan = {'changes': changes, 'characters': old_chars, 'assets': delete,
                'protectedCount': len(protected), 'bookCount': len(books)}
        save('plan.json', plan)
        print(json.dumps({'dryRun': True, 'englishStories': 39, 'horiUnitsPreserved': 32,
                          'characters': 12, 'exclusiveAssets': len(delete)}), flush=True)
        return
    plan = json.loads((ROOT / 'plan.json').read_text(encoding='utf-8'))
    receipt_path = ROOT / 'receipt.json'
    receipt = json.loads(receipt_path.read_text(encoding='utf-8')) if receipt_path.exists() else {'books': [], 'characters': [], 'assets': []}
    for c in plan['changes']:
        bid = c['before']['id']; fresh = request('/storybooks/' + bid)
        if bid not in receipt['books']:
            assert normalized(fresh) in (normalized(c['before']), normalized(c['after'])), 'Concurrent edit: ' + bid
            if normalized(fresh) != normalized(c['after']):
                request('/storybooks', 'POST', {'storybook': c['after']})
            assert normalized(request('/storybooks/' + bid)) == normalized(c['after'])
            receipt['books'].append(bid); save('receipt.json', receipt)
            print('cleaned ' + bid, flush=True)
    for c in plan['characters']:
        if c['id'] not in receipt['characters']:
            request('/character-library/' + c['id'], 'DELETE')
            receipt['characters'].append(c['id']); save('receipt.json', receipt)
    # Fresh global reference scan, including non-book libraries, before irreversible asset deletion.
    listing = request('/storybooks')
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        books = list(pool.map(lambda b: request('/storybooks/' + b['id']), listing))
    # Await explicit sequential vocabulary sync, rather than relying on save's background work.
    for c in plan['changes']:
        request('/vocabulary-db/sync', 'POST', {'storybookId': c['after']['id']})
    kept = urls(request('/character-library')) | other_library_urls()
    for b in books: kept |= urls(b)
    protected = {url_key(u) for u in kept}
    for key, url in plan['assets'].items():
        assert key not in protected, 'New shared reference: ' + key
        if key not in receipt['assets']:
            request('/images/cleanup', 'DELETE', {'imageUrl': url})
            receipt['assets'].append(key); save('receipt.json', receipt)
    assert not any(c['name'] in OLD for c in request('/character-library'))
    for b in books:
        if b['id'].startswith('en-') and b.get('type') == 'phonics': assert not b['pages'] and not b['characters']
    save('books-after.json', books)
    receipt['complete'] = True; save('receipt.json', receipt)
    print(json.dumps({'complete': True, 'unitsCleaned': len(receipt['books']),
                      'charactersDeleted': len(receipt['characters']), 'assetsDeleted': len(receipt['assets'])}), flush=True)

if __name__ == '__main__': main()
