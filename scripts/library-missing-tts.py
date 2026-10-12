"""Prepare and resumably generate only missing Korean/English page narration with local Qwen.

No uploads or operating-book writes. English needs a separately reviewed, source-bound translation.
Use existing approved Voicebox profiles and the same format/speed as changjak narration.
"""
import argparse
import concurrent.futures
import importlib.util
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.request

spec = importlib.util.spec_from_file_location('narration', Path(__file__).with_name('changjak-voicebox-tts.py'))
tts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tts)


def page_number(p):
    return p.get('pageNumber', p.get('page_number'))


def source_hash(book):
    return tts.digest({'title': book['title'], 'characters': book.get('characters', []),
                       'pages': [{'number': page_number(p), 'text': p['text'],
                                  'scene': p.get('scene_description')} for p in book['pages']]})


def fetch_book(book_id):
    req = urllib.request.Request('https://www.tangobook.co.kr/api/storybooks/' + book_id,
                                 headers={'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(req, timeout=90) as r:
        result = __import__('json').load(r)
    if not result.get('success'):
        raise ValueError('Book read failed: ' + book_id)
    return result['data']


def prepare(args):
    if (args.root / 'plan.json').exists():
        raise FileExistsError('Existing plan and baselines must be preserved; use a new output directory.')
    audit = tts.read(args.audit)
    targets = [r['id'] for r in audit['rows'] if r['ko']['missing'] or r['en']['missing']]
    jobs = []
    books = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for b in pool.map(fetch_book, targets):
            tts.save(args.root / 'books-before' / (b['id'] + '.json'), b)
            src = source_hash(b)
            books.append({'id': b['id'], 'title': b['title'], 'category': b.get('category'), 'sourceSha256': src})
            for p in b['pages']:
                n = page_number(p)
                assert isinstance(n, int) and p['text'].strip(), 'Invalid source page'
                for lang in ('ko', 'en'):
                    tr = p.get('translations', {}).get('en', {})
                    if (p.get('ttsUrl') if lang == 'ko' else tr.get('ttsUrl')):
                        continue
                    text = p['text'] if lang == 'ko' else tr.get('text', '').strip()
                    jobs.append({'bookId': b['id'], 'title': b['title'], 'pageNumber': n, 'language': lang,
                                 'sourceSha256': src, 'existingText': text or None})
    tts.save(args.root / 'plan.json', {'createdAt': time.time(), 'expected': len(jobs), 'books': books, 'jobs': jobs})
    print({'books': len(books), 'jobs': len(jobs), 'ko': sum(j['language'] == 'ko' for j in jobs),
           'en': sum(j['language'] == 'en' for j in jobs), 'needsTranslation': sum(j['existingText'] is None for j in jobs)}, flush=True)


def resolve_text(root, job):
    if job['existingText']:
        return job['existingText']
    path = root / 'translations' / (job['bookId'] + '.json')
    if not path.exists():
        return None
    tr = tts.read(path)
    if tr['sourceSha256'] != job['sourceSha256']:
        raise ValueError('Translation source changed: ' + job['bookId'])
    if tr.get('reviewed') is not True:
        return None
    page = next(p for p in tr['pages'] if p['pageNumber'] == job['pageNumber'])
    assert page['text'].strip() and not re.search('[가-힣]', page['text']), 'Invalid English narration'
    return page['text']


def finalize_translation_batch(args):
    assert args.batch, 'A reviewed translation batch is required'
    batch = tts.read(args.batch)
    plan = tts.read(args.root / 'plan.json')
    by_id = {b['id']: b for b in plan['books']}
    en_targets = {j['bookId'] for j in plan['jobs'] if j['language'] == 'en'}
    for book_id, translation in batch.items():
        assert book_id in en_targets, 'Translation is outside the missing narration scope'
        before = tts.read(args.root / 'books-before' / (book_id + '.json'))
        src = source_hash(before)
        assert src == by_id[book_id]['sourceSha256'], 'Source snapshot changed'
        assert len(translation['pages']) == len(before['pages']), 'Translation page count mismatch'
        assert translation['title'].strip(), 'Translation title missing'
        assert all(isinstance(t, str) and t.strip() and not re.search('[가-힣]', t) for t in translation['pages']), 'Invalid English page'
        record = {'bookId': book_id, 'sourceSha256': src, 'title': translation['title'], 'reviewed': True,
                  'reviewMethod': 'English read-aloud translation compared with every original Korean page',
                  'pages': [{'pageNumber': page_number(p), 'text': t} for p, t in zip(before['pages'], translation['pages'])]}
        dest = args.root / 'translations' / (book_id + '.json')
        if dest.exists():
            assert tts.read(dest) == record, 'Preserve an earlier reviewed translation'
        else:
            tts.save(dest, record)
    print('Finalized source-bound reviewed translations:', len(batch), flush=True)


def generate(args):
    plan = tts.read(args.root / 'plan.json')
    state_path = args.root / 'generate-job.json'
    state = {'status': 'running', 'startedAt': time.time(), 'pid': os.getpid(), 'expected': plan['expected'], 'generated': 0}
    tts.save(state_path, state)
    try:
        with urllib.request.urlopen(args.base + '/profiles', timeout=30) as r:
            profiles = __import__('json').load(r)
        assert all(pid in {p['id'] for p in profiles} for pid in tts.PROFILES.values()), 'Approved Voicebox profiles missing'
        tts.request(args.base, '/models/qwen3-4b/unload', {})
        while True:
            done = 0
            made = 0
            counts = {'ko': 0, 'en': 0}
            # Korean first while English translations are being prepared.
            for job in sorted(plan['jobs'], key=lambda j: (j['language'] != 'ko', j['bookId'], j['pageNumber'])):
                text = resolve_text(args.root, job)
                if text is None:
                    continue
                text = text.replace('**', '').replace('__', '').strip()
                target = args.root / 'audio' / job['bookId'] / job['language'] / f"p{job['pageNumber']:02d}"
                target.parent.mkdir(parents=True, exist_ok=True)
                overrides_path = args.root / 'seed-overrides.json'
                overrides = tts.read(overrides_path) if overrides_path.exists() else {}
                recipe = tts.recipe_for(job['bookId'], job['language'], job['pageNumber'], text, overrides)
                key = tts.recipe_key(recipe)
                receipt_path = target.with_suffix('.json')
                wav = target.with_suffix('.wav')
                mp3 = target.with_suffix('.mp3')
                if receipt_path.exists():
                    receipt = tts.read(receipt_path)
                    assert receipt['recipeSha256'] == key and tts.digest(mp3.read_bytes()) == receipt['mp3Sha256'], 'Existing receipt changed'
                    done += 1
                    counts[job['language']] += 1
                    continue
                started = time.time()
                request_path = target.with_suffix('.request.json')
                if wav.exists():
                    assert request_path.exists() and tts.read(request_path) == recipe, 'Unknown existing WAV'
                    data = wav.read_bytes()
                else:
                    assert not mp3.exists(), 'Unknown existing MP3'
                    tts.save(request_path, recipe)
                    data = tts.request(args.base, '/generate/stream', recipe, raw=True)
                    assert data[:4] == b'RIFF' and data[8:12] == b'WAVE', 'Invalid Voicebox WAV'
                    partial = target.with_suffix('.partial.wav')
                    partial.write_bytes(data)
                    partial.replace(wav)
                partial = target.with_suffix('.partial.mp3')
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-af', tts.SPEED[job['language']],
                                '-ar', '24000', '-ac', '1', '-b:a', '96k', str(partial)], check=True)
                duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                                          '-of', 'default=nw=1:nk=1', str(partial)], text=True).strip())
                assert 1 <= duration <= 180, 'Unexpected audio duration'
                subprocess.run(['ffmpeg', '-v', 'error', '-i', str(partial), '-f', 'null', '-'], check=True)
                if mp3.exists():
                    assert tts.digest(mp3.read_bytes()) == tts.digest(partial.read_bytes()), 'Unknown existing MP3'
                    partial.unlink()
                else:
                    partial.replace(mp3)
                tts.save(receipt_path, {**job, 'request': recipe, 'recipeSha256': key, 'speedFilter': tts.SPEED[job['language']],
                          'duration': duration, 'generationWallSeconds': time.time() - started, 'wavSha256': tts.digest(data),
                          'mp3Sha256': tts.digest(mp3.read_bytes()), 'status': 'generated-awaiting-narration-audit'})
                done += 1
                made += 1
                counts[job['language']] += 1
                state.update(generated=done, perLanguage=counts.copy(), updatedAt=time.time(), last={k: job[k] for k in ('bookId', 'language', 'pageNumber')})
                tts.save(state_path, state)
                print(f"GENERATED {job['bookId']} {job['language']} p{job['pageNumber']:02d} audio={duration:.1f}s wall={time.time()-started:.1f}s", flush=True)
                if (args.root / 'stop-after-current.request').exists():
                    state.update(status='paused-after-current', finishedAt=time.time())
                    tts.save(state_path, state)
                    return
            state.update(generated=done, perLanguage=counts, updatedAt=time.time(), waitingForTranslations=made == 0)
            tts.save(state_path, state)
            if done == plan['expected']:
                break
            if not args.follow:
                break
            time.sleep(10)
    except Exception as exc:
        state.update(status='failed', error=str(exc), finishedAt=time.time())
        tts.save(state_path, state)
        raise
    state.update(status='finished' if done == plan['expected'] else 'waiting-translations', finishedAt=time.time())
    tts.save(state_path, state)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('stage', choices=['prepare', 'generate', 'finalize-translations'])
    parser.add_argument('--root', type=Path, default=Path('D:/tangobook-audio/library-missing-20261012'))
    parser.add_argument('--audit', type=Path, default=Path('packages/client/public/library-content-audit.json'))
    parser.add_argument('--base', default='http://127.0.0.1:17493')
    parser.add_argument('--follow', action='store_true')
    parser.add_argument('--batch', type=Path)
    args = parser.parse_args()
    assert args.base.startswith('http://127.0.0.1:'), 'Voicebox must be local'
    args.root.mkdir(parents=True, exist_ok=True)
    if args.stage == 'prepare':
        prepare(args)
        return
    if args.stage == 'finalize-translations':
        finalize_translation_batch(args)
        return
    with (args.root / 'voicebox-gpu.lock').open('a+b') as lock:
        if lock.seek(0, 2) == 0:
            lock.write(b'0'); lock.flush()
        lock.seek(0)
        if os.name == 'nt':
            import msvcrt
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        generate(args)


if __name__ == '__main__':
    main()
