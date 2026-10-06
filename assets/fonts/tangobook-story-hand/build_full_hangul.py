"""Original rounded stroke construction for ALL 11,172 modern Hangul syllables.

No installed/donor font outlines. All syllables use the same construction;
the earlier 24 traced trial syllables stay in the historical trial font only.
This step expands Korean; it does not claim complete Japanese/Chinese/Thai support.
"""
from pathlib import Path
import json, hashlib, math, argparse
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from build import ROOT, line, circle

INITIAL=list('ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ')
VOWEL=list('ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ')
FINAL=['']+list('ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ')
DOUBLE={'ㄲ':'ㄱㄱ','ㄸ':'ㄷㄷ','ㅃ':'ㅂㅂ','ㅆ':'ㅅㅅ','ㅉ':'ㅈㅈ', 'ㄳ':'ㄱㅅ','ㄵ':'ㄴㅈ','ㄶ':'ㄴㅎ','ㄺ':'ㄹㄱ','ㄻ':'ㄹㅁ','ㄼ':'ㄹㅂ','ㄽ':'ㄹㅅ','ㄾ':'ㄹㅌ','ㄿ':'ㄹㅍ','ㅀ':'ㄹㅎ','ㅄ':'ㅂㅅ'}
PATHS={
 'ㄱ':[[(0,1),(1,1),(1,0)]], 'ㄴ':[[(0,1),(0,0),(1,0)]],
 'ㄷ':[[(1,1),(0,1),(0,0),(1,0)]], 'ㄹ':[[(0,1),(1,1),(1,.52),(0,.52),(0,0),(1,0)]],
 'ㅁ':[[(0,1),(1,1),(1,0),(0,0),(0,1)]],
 'ㅂ':[[(0,1),(0,0),(1,0),(1,1)],[(0,.5),(1,.5)]],
 'ㅅ':[[(0,0),(.5,1),(1,0)]],
 'ㅈ':[[(0,1),(1,1)],[(.5,.98),(.48,.7),(0,0)],[(.48,.7),(1,0)]],
 'ㅊ':[[ (.35,1),(.65,1)],[(0,.78),(1,.78)],[(.5,.76),(.48,.5),(0,0)],[(.48,.5),(1,0)]],
 'ㅋ':[[(0,1),(1,1),(1,0)],[(0,.5),(1,.5)]],
 'ㅌ':[[(1,1),(0,1),(0,0),(1,0)],[(0,.5),(1,.5)]],
 'ㅍ':[[(0,1),(1,1)],[(0,0),(1,0)],[(.25,1),(.25,0)],[(.75,1),(.75,0)]],
}

def strokes(pen, paths, box):
 x,y,w,h=box; thickness=64
 for points in paths:
  points=[(x+a*w,y+b*h) for a,b in points]
  for a,b in zip(points,points[1:]): line(pen,a,b,thickness)

def oval(pen,box):
 x,y,w,h=box;t=64;cx=x+w/2;cy=y+h/2
 # Nested Bezier ellipse with a counter; no filled black disk.
 for rx,ry,reverse in [(w/2+t/2,h/2+t/2,False),(w/2-t/2,h/2-t/2,True)]:
  pts=[(cx+rx*math.cos(i*math.pi/8),cy+ry*math.sin(i*math.pi/8)) for i in range(16)]
  if reverse:pts.reverse()
  mid=lambda a,b:((a[0]+b[0])/2,(a[1]+b[1])/2)
  pen.moveTo(mid(pts[-1],pts[0]))
  for i,p in enumerate(pts):pen.qCurveTo(p,mid(p,pts[(i+1)%len(pts)]))
  pen.closePath()

def consonant(pen,c,box):
 x,y,w,h=box
 if c in DOUBLE:
  for i,k in enumerate(DOUBLE[c]):consonant(pen,k,(x+i*w*.56,y,w*.43,h))
 elif c=='ㅇ':oval(pen,box)
 elif c=='ㅎ':
  strokes(pen,[[(.36,1),(.64,1)],[(.12,.78),(.88,.78)]],box)
  oval(pen,(x+w*.1,y,w*.8,h*.58))
 else:strokes(pen,PATHS[c],box)

def vowel(pen,c,box):
 x,y,w,h=box
 if c in 'ㅗㅛㅜㅠㅡ':
  if c=='ㅡ':p=[[(0,.5),(1,.5)]]
  else:
   low=c in 'ㅗㅛ';bar=.13 if low else .87;p=[[(0,bar),(1,bar)]]
   for a in ([.35,.65] if c in 'ㅛㅠ' else [.5]):p.append([(a,bar),(a,.95 if low else .05)])
 elif c in 'ㅘㅙㅚㅝㅞㅟㅢ':
  pair={'ㅘ':('ㅗ','ㅏ'),'ㅙ':('ㅗ','ㅐ'),'ㅚ':('ㅗ','ㅣ'),'ㅝ':('ㅜ','ㅓ'),'ㅞ':('ㅜ','ㅔ'),'ㅟ':('ㅜ','ㅣ'),'ㅢ':('ㅡ','ㅣ')}[c]
  vowel(pen,pair[0],(x,y,w*.52,h*.42));vowel(pen,pair[1],(x+w*.65,y,w*.35,h));return
 elif c=='ㅣ':p=[[(.5,0),(.5,1)]]
 else:
  right=c in 'ㅏㅑㅐㅒ';double=c in 'ㅑㅒㅕㅖ';extra=c in 'ㅐㅒㅔㅖ'
  axis=.1 if right else (.56 if extra else .9)
  p=[[(axis,0),(axis,1)]]
  if extra:p.append([(.9,0),(.9,1)])
  for b in ([.35,.65] if double else [.5]):p.append([(axis,b),(.8 if right else .05,b)])
 strokes(pen,p,box)

def syllable(l,v,t):
 pen=TTGlyphPen(None);bottom=390 if t else 75;top=830;height=top-bottom
 if v in 'ㅗㅛㅜㅠㅡ':
  consonant(pen,l,(250,bottom+height*.52,410,height*.44))
  vowel(pen,v,(130,bottom,640,height*.32))
 elif v in 'ㅘㅙㅚㅝㅞㅟㅢ':
  consonant(pen,l,(115,bottom+height*.53,340,height*.43))
  vowel(pen,v,(95,bottom,695,height*.93))
 else:
  consonant(pen,l,(115,bottom+20,360,height-35));vowel(pen,v,(575,bottom,220,height))
 if t:consonant(pen,t,(205,85,490,235))
 return pen.glyph()

def main(output):
 output.mkdir(exist_ok=True)
 font=TTFont(ROOT/'dist-asian/TangoBookStoryHand-AsianTrial-Regular.ttf');font.recalcTimestamp=False
 cmap=font.getBestCmap();order=list(font.getGlyphOrder())
 for cp in range(0xAC00,0xD7A4):
  n=cp-0xAC00;l=INITIAL[n//588];v=VOWEL[(n%588)//28];t=FINAL[n%28];name=f'uni{cp:04X}'
  name=cmap.get(cp,name)
  font['glyf'][name]=syllable(l,v,t);font['hmtx'][name]=(900,40)
  if name not in order:order.append(name)
  cmap[cp]=name
 # Compatibility jamo and modern conjoining jamo also have actual outlines.
 jamos={**{0x1100+i:c for i,c in enumerate(INITIAL)},**{0x1161+i:c for i,c in enumerate(VOWEL)},**{0x11A8+i:c for i,c in enumerate(FINAL[1:])}}
 jamos.update({ord(c):c for c in set(INITIAL+VOWEL+FINAL[1:])})
 for cp,c in jamos.items():
  pen=TTGlyphPen(None);(vowel if c in VOWEL else consonant)(pen,c,(140,100,620,650));name=f'uni{cp:04X}'
  name=cmap.get(cp,name)
  font['glyf'][name]=pen.glyph();font['hmtx'][name]=(900,40)
  if name not in order:order.append(name)
  cmap[cp]=name
 font.setGlyphOrder(order)
 for table in font['cmap'].tables:
  if table.isUnicode():table.cmap=dict(cmap)
 names={1:'TangoBook Story Hand Expanded',3:'TangoBookStoryHand-Expanded-0.5.0',4:'TangoBook Story Hand Expanded Regular',5:'Version 0.500',6:'TangoBookStoryHand-Expanded-Regular',10:'Uniform original complete modern Korean construction; historical non-Korean trial subsets excluded by uniform global build.'}
 for rec in font['name'].names:
  if rec.nameID in names:rec.string=names[rec.nameID].encode(rec.getEncoding())
 font['head'].fontRevision=.301;font['OS/2'].recalcUnicodeRanges(font)
 stem='TangoBookStoryHand-Expanded-Regular';font.save(output/(stem+'.ttf'));font.flavor='woff2';font.save(output/(stem+'.woff2'))
 report={'version':'0.5.0','family':'TangoBook Story Hand Expanded','supportedCount':len(cmap),'codepoints':sorted(cmap),'hangulSyllables':sum(cp in cmap for cp in range(0xAC00,0xD7A4)),'legacyHangulOverrides':0,'uniformHangulConstruction':True,'source':'one original rounded-stroke jamo construction for every modern Korean syllable; historical non-Korean trial glyphs excluded by the uniform global build','fullGlobalCoverage':False,'sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in output.glob(stem+'.*')}}
 (output/'coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps({k:v for k,v in report.items() if k!='codepoints'},ensure_ascii=False))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=ROOT/'dist-expanded-bold');main(parser.parse_args().output)
