"""Typeset reviewed educational glyphs on skill-generated art; never add narration.

Positions are selected after examining each generated scene. This does not approve
an image or register it. Retains the original candidate unchanged.
"""
import argparse, hashlib, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--job',required=True);p.add_argument('--version',default='v4');p.add_argument('--glyphs',required=True,help='JSON [{text,x,y,size,glow}] with center coordinates');a=p.parse_args()
 candidate=a.root/('candidates-'+a.version)/(a.job+'.png')
 base=Image.open(candidate).convert('RGBA')
 specs=json.loads(a.glyphs)
 allowed=set('ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅔㅖㅚㅟㅢㅘㅙㅝㅞ')
 for spec in specs:
  assert spec['text'] in allowed,'Only source teaching vowels are allowed'
  font=ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf',spec['size'])
  layer=Image.new('RGBA',base.size)
  d=ImageDraw.Draw(layer);bounds=d.textbbox((0,0),spec['text'],font=font)
  xy=(spec['x']-(bounds[2]-bounds[0])/2-bounds[0],spec['y']-(bounds[3]-bounds[1])/2-bounds[1])
  if spec.get('glow',True):
   d.text(xy,spec['text'],font=font,fill='#FFF8BD',stroke_width=3,stroke_fill='#FFCD39')
   base=Image.alpha_composite(base,layer.filter(ImageFilter.GaussianBlur(8)))
   base=Image.alpha_composite(base,layer)
  else:
   d.text(xy,spec['text'],font=font,fill='#754817',stroke_width=1,stroke_fill='#754817')
   base=Image.alpha_composite(base,layer)
 final=a.root/'final';final.mkdir(exist_ok=True)
 dest=final/(a.job+'.webp');assert not dest.exists(),'Preserve previous final; use a new candidate/review if necessary'
 base.convert('RGB').save(dest,'WEBP',quality=88,method=6)
 record={'id':a.job,'candidate':str(candidate),'candidateSha256':hashlib.sha256(candidate.read_bytes()).hexdigest(),'glyphs':specs,'file':str(dest),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'status':'awaiting-visual-review'}
 dest.with_suffix('.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps(record,ensure_ascii=False))

if __name__=='__main__':main()
