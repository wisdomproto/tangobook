"""Create labeled original/lineart comparison sheets for visual review."""
import json,pathlib,argparse
from PIL import Image,ImageDraw,ImageFont,ImageOps
root=pathlib.Path('D:/ComfyUI-output/classic-scene-coloring')
jobs=json.loads((root/'manifest.json').read_text(encoding='utf-8'))
done=[j for j in jobs if j['status']=='generated']
p=argparse.ArgumentParser();p.add_argument('--start',type=int,default=0);p.add_argument('--count',type=int,default=6);a=p.parse_args()
chosen=done[a.start:a.start+a.count]
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
out=Image.new('RGB',(1280,220*((len(chosen)+1)//2)), '#f3f3ed')
d=ImageDraw.Draw(out)
for i,j in enumerate(chosen):
    x=(i%2)*640;y=(i//2)*220
    d.text((x+8,y+5),j['title']+' / '+str(j['pageNumber'])+'쪽',fill='black',font=font)
    for k,f in enumerate([j['sourceFile'],j['lineartFile']]):
        im=ImageOps.contain(Image.open(root/f).convert('RGB'),(316,178))
        out.paste(im,(x+k*320+(320-im.width)//2,y+33+(178-im.height)//2))
path=root/'contacts'/f'{a.start:03}-{a.start+len(chosen):03}.jpg';path.parent.mkdir(exist_ok=True);out.save(path,quality=95)
print(path)
