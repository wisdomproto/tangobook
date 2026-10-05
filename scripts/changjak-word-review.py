import json,pathlib,sys
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image,ImageDraw
root=pathlib.Path('generated-images/changjak-words-11-19' if '--scope=11-19' in sys.argv else 'generated-images/changjak-words')
jobs=json.loads((root/'jobs.json').read_text(encoding='utf-8'))['jobs']
cards={c['id']:c for c in json.loads((root/'cards.json').read_text(encoding='utf-8'))}
reviews=json.loads((root/'reviews.json').read_text(encoding='utf-8')) if (root/'reviews.json').exists() else {}
ready=[j for j in jobs if pathlib.Path(j['out']).exists() and reviews.get(j['id'],{}).get('status')!='pass']
out=root/'review';out.mkdir(exist_ok=True)
groups=[]
for start in range(0,len(ready),4):
    group=ready[start:start+4];canvas=Image.new('RGB',(1536,1064),'#ede7dd');draw=ImageDraw.Draw(canvas)
    for i,j in enumerate(group):
        im=Image.open(j['out']).convert('RGB');im.thumbnail((768,512),Image.Resampling.LANCZOS)
        x=(i%2)*768;y=(i//2)*532
        draw.text((x+8,y+3),j['id'],fill='black');canvas.paste(im,(x,y+20))
    file=out/(group[0]['id']+'-overview.jpg');canvas.save(file,quality=92)
    groups.append({'file':str(file.resolve()),'jobs':[{'id':j['id'],'words':[cards[c]['word']+' ('+cards[c]['variant']+')' for c in j['cards']]} for j in group]})
(root/'review-groups.json').write_text(json.dumps(groups,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'unreviewed':len(ready),'groups':len(groups)}))
print(json.dumps(groups,ensure_ascii=False,indent=2))
