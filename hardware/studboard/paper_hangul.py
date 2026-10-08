"""A4, actual-size black Hangul stickers: 2x2 consonants / 1x1 vowels."""
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
CONSONANTS=list('ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ')
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
    def label(text,x,y,size=9):
        c.setFillColorRGB(0,0,0);c.setFont('Hangul',size);c.drawString(x*mm,y*mm,text)
    records=[]
    def group(chars,size,cols,top,pitch,target):
        width=cols*size+(cols-1)*(pitch-size);left=(210-width)/2
        max_extent=max(max(bounds[ch][2]-bounds[ch][0],bounds[ch][3]-bounds[ch][1]) for ch in chars)
        font_size=target*mm*units/max_extent
        for i,ch in enumerate(chars):
            x=(left+i%cols*pitch)*mm;y=(top-size-i//cols*pitch)*mm
            c.setStrokeColorRGB(.60,.60,.60);c.setLineWidth(.35)
            c.roundRect(x,y,size*mm,size*mm,1.8*mm,stroke=1,fill=0)
            xmin,ymin,xmax,ymax=bounds[ch];scale=font_size/units
            # Visual glyph centre, including narrow and compound letters.
            dx=x+size*mm/2-(xmin+xmax)*scale/2
            dy=y+size*mm/2-(ymin+ymax)*scale/2
            c.setFillColorRGB(0,0,0);c.setFont('HangulBold',font_size);c.drawString(dx,dy,ch)
            records.append(dict(page=page,character=ch,size_mm=size,x_mm=x/mm,y_mm=y/mm))
    for page in (1,2):
        c.setFillColorRGB(1,1,1);c.rect(0,0,*A4,fill=1,stroke=0)
        label(f'한글 블록 종이 스티커 ({page}/2)',20,280,16)
        label('A4 · 실제 크기 100%로 인쇄 · 페이지에 맞춤 해제 · 회색 선을 따라 오리세요.',20,273,9)
        label('자음 19종 · 각 2개 중 1개 · 2×2 블록용 · 종이 27.2 × 27.2mm',20,262,10)
        group(CONSONANTS,27.2,5,254,33,18.8)
        label('모음 ㅏ·ㅣ·ㅑ · 각 4개 중 2개 · 1×1 블록용 · 종이 12.2 × 12.2mm',20,118,10)
        group(VOWELS,12.2,6,108,23,8.7)
        label('기준선: 아래 선의 길이가 자로 재서 50mm이면 정상 크기입니다.',20,31,8)
        c.setStrokeColorRGB(0,0,0);c.setLineWidth(.6);c.line(20*mm,24*mm,70*mm,24*mm)
        for x in (20,70):c.line(x*mm,22*mm,x*mm,26*mm)
        label('50mm',75,23,8)
        label('블록 턱 안쪽 기준: 2×2는 27.6mm, 1×1은 12.6mm. 종이는 한쪽 0.2mm 작게 잡았습니다.',20,14,7)
        c.showPage()
    c.save()
    (output.parent/'tango-hangul-block-stickers-a4-layout.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
    print(output)

if __name__=='__main__':main()
