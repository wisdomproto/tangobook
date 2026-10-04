import json, pathlib, hashlib, html, sys
from PIL import Image
root=pathlib.Path('generated-images/changjak-words-11-19' if '--scope=11-19' in sys.argv else 'generated-images/changjak-words')
jobs=json.loads((root/'jobs.json').read_text(encoding='utf-8'))['jobs']
cards={c['id']:c for c in json.loads((root/'cards.json').read_text(encoding='utf-8'))}
output=root/'cards';output.mkdir(exist_ok=True)
items=[]
for job in jobs:
    sheet=pathlib.Path(job['out'])
    if not sheet.exists(): continue
    im=Image.open(sheet).convert('RGB'); w,h=im.size
    if abs(w/3-h/2)>4:
        raise ValueError(f'{job["id"]}: unexpected 3-by-2 square-cell geometry {w}x{h}; inspect before cropping')
    inset=12 if job['series']=='lulu' or '--scope=11-19' in sys.argv else 4
    for n,cid in enumerate(job['cards']):
        col,row=n%3,n//3
        # Remove inset sheet frames while retaining the reviewed subject margins.
        box=(round(col*w/3)+inset,round(row*h/2)+inset,round((col+1)*w/3)-inset,round((row+1)*h/2)-inset)
        card=im.crop(box);card.thumbnail((500,500),Image.Resampling.LANCZOS)
        png=output/(cid+'.png');webp=output/(cid+'.webp')
        card.save(png);card.save(webp,quality=82,method=6)
        meta=cards[cid];items.append({**meta,'sheet':job['id'],'png':str(png.resolve()),'file':str(webp.resolve()),'size':card.size,'sha256':hashlib.sha256(webp.read_bytes()).hexdigest(),'bytes':webp.stat().st_size})
(root/'cropped.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')
parts=['<!doctype html><meta charset="utf-8"><title>창작동화 핵심단어 삽화</title><style>body{font-family:system-ui;background:#f7f4ef;color:#28231c;margin:24px}.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}figure{background:white;margin:0;padding:8px;border-radius:8px}img{width:100%;height:auto}figcaption{font-size:13px}h2{margin-top:32px}</style><h1>창작동화 01~10 핵심단어 삽화</h1>']
series_info={s['series']:s for s in json.loads((root/'summary.json').read_text(encoding='utf-8'))}
for series in sorted(dict.fromkeys(j['series'] for j in jobs),key=lambda s:int(series_info[s]['no'])):
    subset=[i for i in items if i['series']==series]
    if not subset:continue
    parts.append('<h2>'+html.escape(series_info[series]['no']+'. '+series_info[series]['title'])+' · '+str(len(subset))+'종</h2><div class="grid">')
    for i in subset:parts.append('<figure><img src="cards/'+i['id']+'.webp"><figcaption>'+html.escape(i['word'])+' · '+html.escape(i['variant'])+'<br>'+str(len(i['uses']))+'권</figcaption></figure>')
    parts.append('</div>')
(root/'index.html').write_text(''.join(parts).replace('01~10','11~19') if '--scope=11-19' in sys.argv else ''.join(parts),encoding='utf-8')
print(json.dumps({'sheets':len(set(i['sheet'] for i in items)),'cards':len(items),'links':sum(len(i['uses']) for i in items),'median_bytes':sorted(i['bytes'] for i in items)[len(items)//2] if items else 0}))
