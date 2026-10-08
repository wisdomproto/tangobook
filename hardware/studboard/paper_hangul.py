"""A4, actual-size black Hangul stickers: 2x2 consonants / 1x2 vowels."""
from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from fontTools.ttLib import TTFont as FontToolsFont
from fontTools.pens.boundsPen import BoundsPen

ROOT=Path(__file__).resolve().parents[2]
CONSONANTS=list('ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ')
VOWELS=list('ㅏㅏㅣㅣㅑㅑ')

def main():
    regular=Path('C:/Windows/Fonts/malgun.ttf')
    bold=Path('C:/Windows/Fonts/malgunbd.ttf')
    pdfmetrics.registerFont(TTFont('Hangul',str(regular)))
    pdfmetrics.registerFont(TTFont('HangulBold',str(bold)))
    font=FontToolsFont(bold);glyphs=font.getGlyphSet();cmap=font.getBestCmap();units=font['head'].unitsPerEm
    bounds={}
    for ch in CONSONANTS+VOWELS:
        assert ord(ch) in cmap
        pen=BoundsPen(glyphs);glyphs[cmap[ord(ch)]].draw(pen);assert pen.bounds
        bounds[ch]=pen.bounds
    output=ROOT/'output/pdf/tango-hangul-block-stickers-a4.pdf';output.parent.mkdir(parents=True,exist_ok=True)
    c=canvas.Canvas(str(output),pagesize=A4,pageCompression=1)
    c.setTitle('탱고 한글 블록 종이 스티커 - A4 실제 크기')
    c.setAuthor('TangoBook')
    records=[]
    def group(chars,size,cols,top,pitch,target,height=None):
        height=size if height is None else height
        width=cols*size+(cols-1)*(pitch-size);left=(210-width)/2
        max_extent=max(max(bounds[ch][2]-bounds[ch][0],bounds[ch][3]-bounds[ch][1]) for ch in chars)
        font_size=target*mm*units/max_extent
        for i,ch in enumerate(chars):
            x=(left+i%cols*pitch)*mm;y=(top-height-i//cols*pitch)*mm
            c.setStrokeColorRGB(.60,.60,.60);c.setLineWidth(.35)
            c.roundRect(x,y,size*mm,height*mm,1.8*mm,stroke=1,fill=0)
            xmin,ymin,xmax,ymax=bounds[ch];scale=font_size/units
            # Visual glyph centre, including narrow and compound letters.
            dx=x+size*mm/2-(xmin+xmax)*scale/2
            dy=y+height*mm/2-(ymin+ymax)*scale/2
            c.setFillColorRGB(0,0,0);c.setFont('HangulBold',font_size);c.drawString(dx,dy,ch)
            records.append(dict(page=page,character=ch,size_mm=size,height_mm=height,x_mm=x/mm,y_mm=y/mm))
    for page in (1,):
        c.setFillColorRGB(1,1,1);c.rect(0,0,*A4,fill=1,stroke=0)
        group([ch for ch in CONSONANTS for _ in range(2)],27.2,6,254,30.5,18.8)
        group([ch for ch in VOWELS for _ in range(2)],12.2,6,90,32,17.0,height=27.2)
        c.showPage()
    c.save()
    (output.parent/'tango-hangul-block-stickers-a4-layout.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
    print(output)

if __name__=='__main__':main()
