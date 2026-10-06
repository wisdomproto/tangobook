"""Analyze verified cover pixels for title contrast. Does not modify images or book data."""
import json, hashlib
from pathlib import Path
from PIL import Image

roots=[Path('D:/ComfyUI-output/library-clean-covers-20261006'),Path('D:/ComfyUI-output/missing-storybook-covers-20261005-landscape')]
colors={}
for root in roots:
    for file in sorted((root/'registered').glob('*.json')):
        record=json.loads(file.read_text(encoding='utf-8'))
        if record.get('status')!='registered-verified': continue
        source=root/'cdn'/f"{record['id']}.webp"
        assert hashlib.sha256(source.read_bytes()).hexdigest()==record['cdnSha256']
        with Image.open(source) as image:
            # Same title band as the UI; work only on a tiny analysis copy.
            sample=image.convert('RGB').crop((int(image.width*.08),int(image.height*.05),int(image.width*.92),int(image.height*.35))).resize((32,12))
            rgb=[sum(p[i] for p in sample.getdata())/384 for i in range(3)]
        brightness=sum(a*b for a,b in zip(rgb,[.2126,.7152,.0722]))/255
        r,g,b=rgb
        if brightness>.58:
            color='#253d37' if r>b*1.15 else '#542c35'
            stroke='#fff7de'
        else:
            color='#ffe49a' if b>r*1.12 else '#fff4d5'
            stroke='#30202c' if b>r*1.12 else '#38291c'
        colors[record['url']]={'color':color,'stroke':stroke}
output=Path(__file__).resolve().parents[1]/'packages/client/src/design-system/primitives/cover-title-colors.json'
output.write_text(json.dumps(colors,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({'covers':len(colors),'output':str(output)}))
