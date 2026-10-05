"""Cmap and real HarfBuzz shaping checks; screenshots remain separate evidence."""
import json, unicodedata, argparse, hashlib
from pathlib import Path
from fontTools.ttLib import TTFont
import uharfbuzz as hb
from build import ROOT
from build_web_global import SAMPLES,DATA
parser=argparse.ArgumentParser();parser.add_argument('--directory',type=Path,default=ROOT/'dist-global-bold-preview');args=parser.parse_args()
names=['Korean','Latin','Thai','Chinese','Japanese'];fonts={}
for name in names:
 p=args.directory/(name+'.ttf');raw=p.read_bytes();tt=TTFont(p);face=hb.Face(raw);font=hb.Font(face);font.scale=(face.upem,face.upem);fonts[name]={'font':font,'cmap':set(tt.getBestCmap()),'sha256':hashlib.sha256(raw).hexdigest()}
def check(text,lang):
 text=unicodedata.normalize('NFC',text)
 preferred={'ko':'Korean','zh':'Chinese','ja':'Japanese','th':'Thai'}.get(lang,'Latin')
 runs=[]
 for c in text:
  key=next((n for n in [preferred,'Latin','Korean','Chinese','Thai'] if ord(c) in fonts[n]['cmap']),None)
  assert key is not None,(lang,c,hex(ord(c)))
  if runs and runs[-1][0]==key:runs[-1][1]+=c
  else:runs.append([key,c])
 result=[]
 for key,run in runs:
  buffer=hb.Buffer();buffer.add_str(run);buffer.guess_segment_properties();buffer.language=lang;hb.shape(fonts[key]['font'],buffer)
  assert all(info.codepoint for info in buffer.glyph_infos),(lang,run,'notdef')
  result.append({'font':key,'text':run,'glyphs':[i.codepoint for i in buffer.glyph_infos],'positions':[{'advance':p.x_advance,'xOffset':p.x_offset,'yOffset':p.y_offset} for p in buffer.glyph_positions]})
 return result
samples={lang:check(text,lang) for lang,text in SAMPLES.items()}
count=0
for book in json.loads((DATA/'all-list.json').read_text(encoding='utf8'))['data']:
 if '파닉스' in book.get('category',''):continue
 for lang,title in {'ko':book['title'],**(book.get('titleTranslations') or {})}.items():check(title,lang);count+=1
report={'actualFontSha256':{k:v['sha256'] for k,v in fonts.items()},'harfBuzzSamples':samples,'languages':list(samples),'actualTitlesShaped':count,'notdefGlyphs':0,'visualReview':'awaiting actual browser screenshots','sourceAuthorship':'original Korean and preserved TangoBook lettering + explicitly attributed OFL Noto compatible glyphs'}
(args.directory/'shaping-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'languages':len(samples),'actualTitlesShaped':count,'notdefGlyphs':0}))
