"""Apply individually chosen teaching-glyph positions; leaves visual approval pending."""
import importlib.util, json, sys
from pathlib import Path
from PIL import Image

root=Path('generated-images/phonics-missing-20261012')
spec=importlib.util.spec_from_file_location('glyphs',Path(__file__).with_name('typeset-phonics-glyphs.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
def g(text,x,y,size,glow=False):return dict(text=text,x=x,y=y,size=size,glow=glow)
jobs={
 'kr-h4-u02-p08':('v6',[g('ㅖ',413,120,100),g('ㅚ',504,196,95)]),
 'kr-h4-u03-p02':('v5',[g('ㅟ',426,382,120),g('ㅢ',598,405,120)]),
 'kr-h4-u04-p02':('v6',[g('ㅘ',444,393,100),g('ㅙ',572,385,100)]),
 'kr-h4-u04-p07':('v6',[g('ㅘ',470,182,94,True),g('ㅙ',578,182,94,True)]),
 'kr-h4-u04-p08':('v6',[g('ㅘ',447,181,105),g('ㅙ',600,165,105)]),
 'kr-h4-u05-p02':('v5',[g('ㅝ',337,438,95),g('ㅞ',541,376,94),g('ㅢ',657,427,87)]),
 'kr-h4-u05-p07':('v7',[g('ㅝ',220,175,80,True),g('ㅞ',350,175,80,True),g('ㅢ',480,175,80,True)]),
 'kr-h4-u05-p08':('v5',[g('ㅝ',395,155,90),g('ㅞ',510,161,90),g('ㅢ',630,153,90),g('ㄱ',190,91,36),g('ㅏ',239,233,30),g('ㅓ',749,207,28),g('ㅗ',867,90,33),g('ㅜ',777,75,27),g('ㄴ',929,247,22),g('ㅣ',119,236,22)]),
}
for key,(version,glyphs) in jobs.items():
 dest=root/'final'/(key+'.webp')
 if dest.exists():continue
 sys.argv=['glyphs','--root',str(root),'--job',key,'--version',version,'--glyphs',json.dumps(glyphs,ensure_ascii=False)];module.main()
dest=root/'final/kr-h4-u05-p01.webp'
if not dest.exists():
 Image.open(root/'candidates-v5/kr-h4-u05-p01.png').convert('RGB').save(dest,'WEBP',quality=88,method=6)
print('Final candidates prepared; review required before selecting/registration')
