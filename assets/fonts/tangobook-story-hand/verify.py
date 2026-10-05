"""Check actual font files, supported titles and FreeType output; make a proof."""
import hashlib
import json
import string
import unicodedata
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, features
from fontTools.ttLib import TTFont
import uharfbuzz as hb

ROOT=Path(__file__).resolve().parent
DIST=ROOT/'dist'
STEM='TangoBookStoryHand-Trial-Regular'
SAMPLES=[
 ('인어공주','The Little Mermaid'),('라푼젤','Rapunzel'),
 ('흥부와 놀부','Heungbu and Nolbu'),('호랑나비','Swallowtail Butterfly'),
 ('코끼리','Elephant'),('호리는 호리니까!','Because Hori Is Hori!'),
 ('탱고북','TangoBook'),
]


def main():
    coverage=json.loads((DIST/'coverage.json').read_text(encoding='utf-8'))
    a=TTFont(DIST/(STEM+'.ttf'),checkChecksums=2)
    b=TTFont(DIST/(STEM+'.woff2'),checkChecksums=2)
    assert a.getBestCmap()==b.getBestCmap()
    assert list(a.getGlyphOrder())==list(b.getGlyphOrder())
    assert a['hmtx'].metrics==b['hmtx'].metrics
    assert a['glyf'].compile(a)==b['glyf'].compile(b),'WOFF2 changed outlines'
    assert set(a.getBestCmap())==set(coverage['codepoints'])
    assert set(range(0x20,0x7F))<=set(a.getBestCmap())
    assert len([cp for cp in a.getBestCmap() if 0xAC00<=cp<=0xD7A3])==24
    assert ord('가') not in a.getBestCmap(),'Do not silently claim full Korean'
    for pair in SAMPLES:
        assert all(ord(c) in a.getBestCmap() for text in pair for c in text)
    max_points=0
    for name in a.getGlyphOrder():
        glyph=a['glyf'][name]
        glyph.recalcBounds(a['glyf'])
        advance,lsb=a['hmtx'][name]
        assert advance>0
        if name not in ('uni0020','uni00A0'):
            assert glyph.numberOfContours!=0,f'Empty glyph {name}'
            assert glyph.yMin>=-250 and glyph.yMax<=1000,f'Vertical clipping {name}'
            assert glyph.xMin>=0 and glyph.xMax<=advance,f'Horizontal clipping {name}'
            assert lsb==glyph.xMin,f'Bearing mismatch {name}'
            coordinates,_,_=glyph.getCoordinates(a['glyf']);max_points=max(max_points,len(coordinates))
    font=ImageFont.truetype(str(DIST/(STEM+'.ttf')),100)
    hole_counts={}
    for char,minimum in [('O',1),('8',2),('B',2),('공',1)]:
        mask=font.getmask(char)
        binary=(np.array(mask,dtype=np.uint8).reshape(mask.size[1],mask.size[0])>128).astype(np.uint8)*255
        _,tree=cv2.findContours(binary,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
        holes=sum(1 for item in tree[0] if item[3]>=0)
        assert holes>=minimum,f'Filled-in counter {char}: {holes}'
        hole_counts[char]=holes
    raqm=features.check_feature('raqm')
    kerning=round(font.getlength('T')+font.getlength('o')-font.getlength('To'),3)
    if raqm: assert 3.5<=kerning<=4.5,f'GPOS kerning not applied: {kerning}'
    hbfont=hb.Font(hb.Face((DIST/(STEM+'.ttf')).read_bytes())); hb.ot_font_set_funcs(hbfont)
    def shape(text,kern=True):
        buffer=hb.Buffer();buffer.add_str(text);buffer.guess_segment_properties()
        hb.shape(hbfont,buffer,{'kern':kern})
        return [item.codepoint for item in buffer.glyph_infos],sum(pos.x_advance for pos in buffer.glyph_positions)
    hb_kerning=shape('To',False)[1]-shape('To',True)[1]
    assert hb_kerning==40,'HarfBuzz did not apply the GPOS To pair'
    for pair in SAMPLES:
        for text in pair:
            ids,_=shape(text)
            assert 0 not in ids,f'Unexpected .notdef in {text}'
    assert shape('인어공주')[0]==shape(unicodedata.normalize('NFD','인어공주'))[0],'Canonical Hangul shaping mismatch'
    label=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',25)
    canvas=Image.new('RGB',(1600,1740),'#fff9f3');draw=ImageDraw.Draw(canvas)
    draw.text((48,25),'TangoBook Story Hand · Trial 0.1',(63,47,36),font=ImageFont.truetype(str(DIST/(STEM+'.ttf')),60))
    draw.text((48,114),'실제 TTF를 FreeType로 출력한 검수판 · 한글 24자 지원',(112,98,82),font=label)
    y=190
    for ko,en in SAMPLES:
        ko_size=88
        while ImageFont.truetype(str(DIST/(STEM+'.ttf')),ko_size).getlength(ko)>560: ko_size-=1
        draw.text((48,y),ko,'#6a392c',font=ImageFont.truetype(str(DIST/(STEM+'.ttf')),ko_size))
        draw.text((660,y+20),en,'#28586b',font=ImageFont.truetype(str(DIST/(STEM+'.ttf')),48))
        y+=145
    draw.text((48,1240),string.ascii_uppercase,'#3f2f24',font=ImageFont.truetype(str(DIST/(STEM+'.ttf')),59))
    draw.text((48,1350),string.ascii_lowercase,'#3f2f24',font=ImageFont.truetype(str(DIST/(STEM+'.ttf')),65))
    draw.text((48,1460),'0123456789  ! ? & # $ % @ ( ) + = — …',' #3f2f24'.strip(),font=ImageFont.truetype(str(DIST/(STEM+'.ttf')),65))
    draw.text((48,1600),coverage['hangul'],'#3f2f24',font=ImageFont.truetype(str(DIST/(STEM+'.ttf')),53))
    canvas.save(DIST/'font-proof.png')
    result={'status':'pass','supportedCodepoints':len(a.getBestCmap()),'glyphs':len(a.getGlyphOrder()),'hangulSyllables':24,'sampleTitles':SAMPLES,'woff2MatchesTTF':True,'allGlyphsHaveValidBounds':True,'counterHoles':hole_counts,'raqm':raqm,'ToKerningPixelsAt100px':kerning,'harfbuzzToKerningUnits':hb_kerning,'harfbuzzSampleTitlesHaveNoMissingGlyph':True,'NFDHangulMatchesNFC':True,'maximumPointsPerGlyph':max_points,'files':{name: {'bytes':(DIST/name).stat().st_size,'sha256':hashlib.sha256((DIST/name).read_bytes()).hexdigest()} for name in [STEM+'.ttf',STEM+'.woff2','font-proof.png']}}
    (DIST/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False))


if __name__=='__main__':main()
