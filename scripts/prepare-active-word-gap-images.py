"""Split GPT contact sheets into small WebP cards, retaining exact book word identities."""
import json, hashlib
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'generated-images/active-word-gaps-20261012'

def main():
    jobs = json.loads((ROOT / 'jobs.json').read_text(encoding='utf-8'))
    final = ROOT / 'final'; final.mkdir(exist_ok=True)
    sources = {}
    for job in jobs:
        with Image.open(ROOT / (job['id'] + '.png')) as im:
            for index, name in enumerate(job['subjects']):
                if name is None: continue
                col, row = index % job['cols'], index // job['cols']
                box = (round(col * im.width / job['cols']), round(row * im.height / job['rows']),
                       round((col + 1) * im.width / job['cols']), round((row + 1) * im.height / job['rows']))
                card = im.crop(box).convert('RGB'); card.thumbnail((500, 500))
                out = final / (name + '.webp'); card.save(out, 'WEBP', quality=85)
                sources[name] = {'file': 'final/' + out.name, 'sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
                                 'width': card.width, 'height': card.height, 'bytes': out.stat().st_size,
                                 'sheet': job['id'], 'cell': index}
    common = {'물': 'water', '풀': 'grass', '꽃': 'flower', '태양': 'sun', '하늘': 'sky',
              '강': 'river', '연못': 'pond', '숲': 'forest', '나무': 'tree', '물고기': 'fish',
              '백로': 'egret', '앵무새': 'parrot', '리본': 'ribbon', '열매': 'fruit'}
    images = []
    for bid in ['1777601619896', '1777601011770']:
        book = json.loads((ROOT / (bid + '.before.json')).read_text(encoding='utf-8'))
        species = 'egret' if bid == '1777601619896' else 'parrot'
        for word in book['key_objects']:
            local = word['korean']
            token = species + '-' + {'깃털': 'feather', '부리': 'beak', '알': 'egg'}[local] if local in ['깃털', '부리', '알'] else common[local]
            images.append({'bookId': bid, 'kind': 'key-object', 'objectName': word['name'], 'word': local,
                           'token': token, **sources[token]})
    images.append({'bookId': 'en-b2-u03', 'kind': 'phonics', 'objectName': 'hip', 'word': 'hip',
                   'token': 'hip', **sources['hip']})
    assert len(images) == 24 and len(sources) == 21
    (ROOT / 'selected.json').write_text(json.dumps({'expected': 24, 'images': images}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'entries': len(images), 'files': len(sources), 'maxSide': max(v['width'] for v in sources.values())}))

if __name__ == '__main__': main()
