"""Prepare and crop GPT-generated coloring sheets; never generate or trace images."""
import argparse, hashlib, html, json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

BASE = Path(__file__).resolve().parents[1]
ROOT = BASE / 'generated-images/changjak-word-coloring'

def read(p):
    return json.loads(p.read_text(encoding='utf-8'))

def write(p, obj):
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')

def prepare(scope):
    ROOT.mkdir(exist_ok=True)
    for folder in ['sheets', 'cards', 'review']:
        (ROOT / folder).mkdir(exist_ok=True)
    if (ROOT / 'jobs.json').exists():
        raise SystemExit('Existing manifest preserved. Resume without prepare.')
    jobs = []
    for source in ['changjak-words', 'changjak-words-11-19']:
        if scope == '11-19' and source == 'changjak-words':
            continue
        sr = BASE / 'generated-images' / source
        cards = {c['id']: c for c in read(sr / 'cropped.json')}
        for job in read(sr / 'jobs.json')['jobs']:
            path = Path(job['out'])
            jobs.append({'id': job['id'], 'series': job['series'], 'source': str(path),
                         'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                         'inset': 12 if source.endswith('11-19') or job['series']=='lulu' else 4,
                         'cards': [cards[c] for c in job['cards']],
                         'out': str(ROOT / 'sheets' / (job['id']+'.png'))})
    write(ROOT / 'jobs.json', {'scope': scope, 'jobs': jobs})
    print(json.dumps({'sheets': len(jobs), 'cards':sum(len(j['cards']) for j in jobs)}))

def contact(ids, kind):
    jobs = {j['id']: j for j in read(ROOT / 'jobs.json')['jobs']}
    result = Image.new('RGB', (1000, len(ids)*(690 if kind=='sources' else 356)), 'white')
    draw = ImageDraw.Draw(result)
    for n, jid in enumerate(ids):
        j=jobs[jid]
        original = Image.open(j['source']).convert('RGB')
        if kind=='sources':
            tile=ImageOps.contain(original,(984,656));result.paste(tile,(8,n*690+24))
            draw.text((8,n*690+4),jid,fill='black')
        else:
            target = Image.open(j['out']).convert('RGB') if Path(j['out']).exists() else original
            if kind=='filled':
                target=Image.new('RGB',(1536,1024),'white')
                for num, c in enumerate(j['cards']):
                    sample=ROOT/'review'/(c['id']+'-filled.png')
                    if sample.exists():target.paste(Image.open(sample).convert('RGB'),((num%3)*512,(num//3)*512))
            for x, im in [(0, original), (500, target)]:
                tile=ImageOps.contain(im,(492,328));result.paste(tile,(x,n*356+24))
            draw.text((8,n*356+4),jid,fill='black')
    out=ROOT/'review'/('contact-'+kind+'-'+ids[0]+'.jpg')
    result.save(out,quality=92)
    print(str(out))

def crop():
    manifest=read(ROOT/'jobs.json')
    reviews=read(ROOT/'reviews.json') if (ROOT/'reviews.json').exists() else {}
    boxes=read(ROOT/'geometry.json') if (ROOT/'geometry.json').exists() else {}
    items=[]
    for j in manifest['jobs']:
        path=Path(j['out'])
        if not path.exists():continue
        sha=hashlib.sha256(path.read_bytes()).hexdigest()
        sheet_pass = reviews.get(j['id'],{}).get('status')=='pass' and reviews.get(j['id'],{}).get('sha256') == sha
        im=Image.open(path).convert('RGB');w,h=im.size; inset=j['inset']
        if abs(w/3-h/2)>4:raise ValueError(f'{j["id"]}: invalid square-cell grid {im.size}')
        for n, c in enumerate(j['cards']):
            if reviews.get(c['id'],{}).get('status') in ['hold','reject']:continue
            override=ROOT/'overrides'/(c['id']+'.png')
            override_pass=override.exists() and reviews.get(c['id'],{}).get('status')=='pass' and reviews.get(c['id'],{}).get('sha256') == hashlib.sha256(override.read_bytes()).hexdigest()
            if override.exists() and not override_pass:continue
            if not sheet_pass and not override_pass:continue
            x,y=n%3,n//3
            bounds=boxes.get(c['id'])
            if bounds and bounds['sheetSha256'] != sha:raise ValueError(c['id']+' stale crop geometry')
            tile=im.crop(bounds['box'] if bounds else (round(x*w/3)+inset,round(y*h/2)+inset,round((x+1)*w/3)-inset,round((y+1)*h/2)-inset))
            if override_pass:
                tile=Image.open(override).convert('RGB')
                if abs(tile.width-tile.height)>4:raise ValueError(c['id']+' override must be square')
            # Preserve native edge contours; use the original card dimensions for delivery.
            tile=tile.resize(tuple(c['size']),Image.Resampling.LANCZOS)
            out=ROOT/'cards'/(c['id']+'.png');tile.save(out,optimize=True)
            items.append({'id':c['id'],'series':c['series'],'word':c['word'],'variant':c['variant'],
                          'uses':c['uses'],'original':c['file'],'originalSha256':c['sha256'],
                          'lineart':str(out),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),
                          'size':tile.size,'sheet':j['id']})
    write(ROOT/'cropped.json',items)
    parts=['<!doctype html><meta charset="utf-8"><title>창작동화 단어 색칠공부</title><style>body{font-family:system-ui;margin:24px;background:#faf8f4}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}figure{margin:0;background:white;padding:12px}img{width:49%;height:auto}a{color:#352821}</style><h1>창작동화 단어 색칠공부</h1><p>원본과 GPT 선화 · '+str(len(items))+'종</p><div class="grid">']
    for c in items:
        original=Path(c['original']).relative_to(BASE/'generated-images').as_posix()
        parts.append('<figure><img src="../'+html.escape(original)+'"><img src="cards/'+c['id']+'.png"><figcaption>'+html.escape(c['series']+' · '+c['word'])+' <a href="cards/'+c['id']+'.png" download>PNG</a></figcaption></figure>')
    parts.append('</div>');(ROOT/'index.html').write_text(''.join(parts),encoding='utf-8')
    print(json.dumps({'reviewedSheets':len(set(c['sheet'] for c in items)),'cards':len(items)}))

def candidates():
    directory=ROOT/'review'/'candidates';directory.mkdir(exist_ok=True)
    measurements=read(ROOT/'measurements.json')
    flags={c['id']:c for c in measurements if c['flags']}
    output=[]
    for j in read(ROOT/'jobs.json')['jobs']:
        if not Path(j['out']).exists():continue
        im=Image.open(j['out']).convert('RGB');w,h=im.size;inset=j['inset']
        for n,c in enumerate(j['cards']):
            if c['id'] not in flags:continue
            x,y=n%3,n//3
            tile=im.crop((round(x*w/3)+inset,round(y*h/2)+inset,round((x+1)*w/3)-inset,round((y+1)*h/2)-inset))
            out=directory/(c['id']+'.png');tile.save(out)
            output.append({**flags[c['id']],'candidate':str(out),'original':c['png'],'variant':c['variant'],'context':c['context']})
    write(ROOT/'repair-inputs.json',output)
    print(json.dumps({'candidates':len(output)}))

def geometry():
    """Preserve existing edge outlines when an animal or scenery is cut by the frame."""
    result={}
    for j in read(ROOT/'jobs.json')['jobs']:
        p=Path(j['out'])
        if not p.exists():continue
        im=Image.open(p).convert('RGB');w,h=im.size
        sha=hashlib.sha256(p.read_bytes()).hexdigest()
        for n,c in enumerate(j['cards']):
            x,y=n%3,n//3
            left,top,right,bottom=round(x*w/3),round(y*h/2),round((x+1)*w/3),round((y+1)*h/2)
            cell=im.crop((left,top,right,bottom));cw,ch=cell.size
            mask=cell.convert('L').point(lambda v:255 if v<180 else 0)
            scale=w/1536
            edge=max(2,round(j['inset']*scale));probe=max(6,round(12*scale),edge+2)
            sides={
                'left':mask.crop((4,probe,probe,ch-probe)).getbbox() is not None,
                'right':mask.crop((cw-probe,probe,cw-4,ch-probe)).getbbox() is not None,
                'top':mask.crop((probe,4,cw-probe,probe)).getbbox() is not None,
                'bottom':mask.crop((probe,ch-probe,cw-probe,ch-4)).getbbox() is not None,
            }
            box=[max(0,left-2) if sides['left'] else left+edge,
                 max(0,top-2) if sides['top'] else top+edge,
                 min(w,right+2) if sides['right'] else right-edge,
                 min(h,bottom+2) if sides['bottom'] else bottom-edge]
            result[c['id']]={'box':box,'keptEdges':[s for s,v in sides.items() if v],'sheetSha256':sha}
    write(ROOT/'geometry.json',result)
    print(json.dumps({'cards':len(result),'edgeCards':sum(bool(v['keptEdges']) for v in result.values())}))

def batch(ids, generated=None, prompt_file=None):
    """Compose approved references, or split a native generated 6x4 sheet by cropping only."""
    jobs={j['id']:j for j in read(ROOT/'jobs.json')['jobs']}
    destination=ROOT/'batches';destination.mkdir(exist_ok=True)
    if generated:
        im=Image.open(generated).convert('RGB');w,h=im.size
        if abs(w/6-h/4)>4:raise ValueError('Invalid 6x4 grid')
        native=destination/('native-'+ids[0]+'.png')
        native.write_bytes(Path(generated).read_bytes())
        prompt=Path(prompt_file or ROOT/'batch-prompt.txt').read_text(encoding='utf-8')
        for n,jid in enumerate(ids):
            x,y=n%2,n//2
            out=im.crop((round(x*w/2),round(y*h/2),round((x+1)*w/2),round((y+1)*h/2)))
            out.save(jobs[jid]['out'])
            write(ROOT/('native-'+jid+'.json'),{'id':jid,'source':jobs[jid]['source'],'sourceSha256':jobs[jid]['sourceSha256'],'batch':ids,'batchReference':str(destination/('source-'+ids[0]+'.png')),'nativeGeneratedPath':generated,'nativeBatch':str(native),'prompt':prompt})
        print(json.dumps({'saved':ids}));return
    im=Image.new('RGB',(1536,1024),'white')
    for n,jid in enumerate(ids):
        original=Image.open(jobs[jid]['source']).convert('RGB')
        original=original.resize((768,512),Image.Resampling.LANCZOS)
        im.paste(original,((n%2)*768,(n//2)*512))
    path=destination/('source-'+ids[0]+'.png');im.save(path)
    print(str(path))

p=argparse.ArgumentParser();p.add_argument('action',choices=['prepare','contact','crop','candidates','geometry','batch']);p.add_argument('--scope',default='1-19');p.add_argument('--ids');p.add_argument('--kind',default='pairs');p.add_argument('--generated');p.add_argument('--prompt-file');a=p.parse_args()
if a.action=='prepare':prepare(a.scope)
elif a.action=='contact':contact(a.ids.split(','),a.kind)
elif a.action=='candidates':candidates()
elif a.action=='geometry':geometry()
elif a.action=='batch':batch(a.ids.split(','),a.generated,a.prompt_file)
else:crop()
