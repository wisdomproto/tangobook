"""Make compact WebP deliverables and a local before/after gallery; no remote writes.

This does not approve images. Record page-by-page visual review in review.json before registration.
"""
import hashlib
import html
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1] / 'generated-images' / 'missing-pages-20261012'
jobs = json.loads((ROOT / 'revised-generation-manifest.json').read_text(encoding='utf-8'))['jobs']
selected = []
cards = []
for job in jobs:
    source = Path(job['out'])
    if not source.exists():
        print('Pending:', job['id'])
        continue
    image = Image.open(source).convert('RGB')
    dest = source.with_suffix('.webp')
    ImageOps.fit(image, (1280, 720), method=Image.Resampling.LANCZOS).save(dest, quality=85, method=6)
    selected.append({
        'id': job['id'], 'bookId': job['bookId'], 'title': job['title'],
        'pageNumber': job['pageNumber'], 'replace': job['replace'],
        'file': dest.relative_to(ROOT).as_posix(), 'width': 1280, 'height': 720,
        'bytes': dest.stat().st_size, 'sha256': hashlib.sha256(dest.read_bytes()).hexdigest(),
        'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    })
    book = json.loads((ROOT / job['bookId'] / 'before.json').read_text(encoding='utf-8'))
    page = next(p for p in book['pages'] if p['pageNumber'] == job['pageNumber'])
    old = ROOT / job['bookId'] / f"ref-p{job['pageNumber']:02d}.webp"
    old_tag = f'<img src="{old.relative_to(ROOT).as_posix()}" alt="기존 삽화">' if old.exists() else '<p>기존 삽화 없음</p>'
    cards.append(f'<article id="{job["id"]}"><h2>{html.escape(job["title"])} · {job["pageNumber"]}쪽</h2>'
                 f'<p>{html.escape(page.get("text", ""))}</p><div><section><h3>기존</h3>{old_tag}</section>'
                 f'<section><h3>새 후보</h3><img src="{dest.relative_to(ROOT).as_posix()}" alt="새 삽화"></section></div></article>')
(ROOT / 'selected.json').write_text(json.dumps({'expected': len(jobs), 'images': selected}, ensure_ascii=False, indent=2), encoding='utf-8')
(ROOT / 'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>삽화 교체 검토</title>'
    '<style>body{margin:24px;background:#f5f1e9;color:#242424;font:16px system-ui}article{background:white;padding:20px;margin:24px auto;max-width:1400px;border-radius:16px}'
    'article>div{display:grid;grid-template-columns:1fr 1fr;gap:20px}img{width:100%;display:block}h2{font-size:21px}h3{font-size:14px;color:#666}</style>'
    f'<h1>삽화 교체 검토 · {len(selected)}/{len(jobs)}장</h1><p>뼈와 근육 이야기 18쪽 실사 교체 · 다른 9권 빈 16쪽 보완 · 이미지 안의 글자 없음</p>'
    + ''.join(cards) + '</html>', encoding='utf-8')
print(f'Prepared {len(selected)}/{len(jobs)} WebP images; {sum(x["bytes"] for x in selected):,} bytes. Review pending.')
