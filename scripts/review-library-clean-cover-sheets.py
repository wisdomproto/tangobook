"""Inspection contact sheets only; never modifies a generated deliverable."""
import json
import hashlib
import sys
import os
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont

root=Path(os.environ.get('COVER_WORK_ROOT','D:/ComfyUI-output/missing-storybook-covers-20261005'))
books=json.loads((root/'books-before.json').read_text(encoding='utf-8'))
records=[json.loads(p.read_text(encoding='utf-8')) for p in sorted((root/'generated').glob('*.json'))]
requested=set(sys.argv[1:])
records=[r for r in records if r['id'] in requested] if requested else [r for r in records if r['status']=='generated-awaiting-visual-review']
snapshot=hashlib.sha256(json.dumps([(r['id'],r['sha256']) for r in records]).encode()).hexdigest()[:12]
out=root/'review-sheets'
out.mkdir(exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',16)
for start in range(0,len(records),16):
    group=records[start:start+16]
    sheet=Image.new('RGB',(2000,1440),'white')
    draw=ImageDraw.Draw(sheet)
    for i,r in enumerate(group):
        x=(i%4)*500
        y=(i//4)*360
        draw.text((x+6,y+3),r['id']+' '+books[r['id']]['title'],font=font,fill='black')
        source=ImageOps.contain(Image.open(r['references'][-1]['path']).convert('RGB'),(220,220))
        cover=ImageOps.contain(Image.open(r['output']).convert('RGB'),(250,325))
        sheet.paste(source,(x+4,y+65))
        sheet.paste(cover,(x+235,y+30))
        draw.text((x+6,y+303),'본문 참조 → 새 표지',font=font,fill='black')
    stem=f'snapshot-{snapshot}-pending-{start:04d}-{len(records):04d}'
    sheet.save(out/(stem+'.jpg'),quality=92)
    (out/(stem+'.json')).write_text(json.dumps([{'id':r['id'],'sha256':r['sha256'],'title':books[r['id']]['title']} for r in group],ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pending':len(records),'sheets':(len(records)+15)//16,'snapshot':snapshot}))
