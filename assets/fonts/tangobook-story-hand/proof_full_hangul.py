"""Render real expanded TTF, and verify every modern syllable has actual ink."""
import json, argparse
from pathlib import Path
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont
from build import ROOT
from build_full_hangul import syllable, INITIAL, VOWEL, FINAL
parser=argparse.ArgumentParser();parser.add_argument('--directory',type=Path,default=ROOT/'dist-expanded-bold');args=parser.parse_args()
font_path=args.directory/'TangoBookStoryHand-Expanded-Regular.ttf'
font=TTFont(font_path);cmap=font.getBestCmap();missing=[];empty=[]
for cp in range(0xAC00,0xD7A4):
 if cp not in cmap:missing.append(cp);continue
 glyph=font['glyf'][cmap[cp]]
 if not glyph.isComposite() and glyph.numberOfContours<=0:empty.append(cp)
assert not missing and not empty,{'missing':missing,'empty':empty}
coverage=json.loads((args.directory/'coverage.json').read_text(encoding='utf8'))
uniform_checked=0
if coverage.get('uniformHangulConstruction'):
 for cp in range(0xAC00,0xD7A4):
  n=cp-0xAC00;expected=syllable(INITIAL[n//588],VOWEL[(n%588)//28],FINAL[n%28])
  actual=font['glyf'][cmap[cp]]
  assert list(actual.coordinates)==list(expected.coordinates) and list(actual.flags)==list(expected.flags) and actual.endPtsOfContours==expected.endPtsOfContours,hex(cp)
  assert font['hmtx'][cmap[cp]]==(900,40),hex(cp)
  uniform_checked+=1
samples=['가나다라마바사아자차카타파하','각간갇갈감갑갓강갖갗갘같갚갛','갉갊갋갌갍갎갏값앉않닭괜찮','꼬마 토끼가 방앗간에 갔어요','호리와 엄마의 무지개 꼬리','잠자는 숲속의 공주와 작은 용','꽃잎 뿌리 줄기 씨앗 열매 새싹','한글 전체 음절 11,172자','까깨껴꼬꾸끄끼 따때떠똬뚜뜨띠','뺘뻐뻬뼈뽀뿌쁘삐 쌰쐐쒸쏘쓔','쟈쨔쫴쪄쬬쭤쮸쯔찌','괄궐귄궨뢔뵙쬐꿇뚫읊돐훑힣']
samples[:0]=['신데렐라 인어공주 라푼젤 백설공주','반쪽이 두더지의 혼인 구렁덩덩 새선비']
image=Image.new('RGB',(1600,100+len(samples)*100),'#fff9ee');draw=ImageDraw.Draw(image)
textfont=ImageFont.truetype(str(font_path),66)
for i,s in enumerate(samples):draw.text((45,30+i*100),s,font=textfont,fill='#493528')
out=args.directory;image.save(out/'hangul-proof.png')
(out/'hangul-verification.json').write_text(json.dumps({'modernHangulCount':11172,'missing':missing,'empty':empty,'uniformOutlinesVerified':uniform_checked,'proofSamples':samples,'proofUsesActualTTF':True,'visualReview':'awaiting'},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'modernHangulCount':11172,'missing':0,'empty':0,'proof':str(out/'hangul-proof.png')}))
