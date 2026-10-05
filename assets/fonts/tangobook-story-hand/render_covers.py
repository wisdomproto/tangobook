"""Render reviewed covers with outlines loaded from the actual TTF, using SVG.

The cover artwork remains an embedded, unchanged raster layer. Requires the
existing cover-study sources; it never reads credentials or writes online data.
"""
import argparse
import base64
import html
import subprocess
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

ROOT=Path(__file__).resolve().parent
FONT=ROOT/'dist/TangoBookStoryHand-Trial-Regular.ttf'


def main(art_root,output):
    output.mkdir(parents=True,exist_ok=True)
    font=TTFont(FONT); glyphset=font.getGlyphSet(); order=font.getGlyphOrder()
    hbfont=hb.Font(hb.Face(FONT.read_bytes()));hb.ot_font_set_funcs(hbfont)
    def shaped(text):
        buf=hb.Buffer();buf.add_str(text);buf.guess_segment_properties();hb.shape(hbfont,buf)
        assert all(info.codepoint for info in buf.glyph_infos),f'Missing glyph in {text}'
        return buf
    def lettering(text,x,baseline,size,fill,border,max_width,center=False):
        buf=shaped(text); advance=sum(p.x_advance for p in buf.glyph_positions)
        size=min(size,max_width*1000/advance);scale=size/1000
        if center:x-=advance*scale/2
        parts=[];cursor=0
        for info,pos in zip(buf.glyph_infos,buf.glyph_positions):
            pen=SVGPathPen(glyphset);glyphset[order[info.codepoint]].draw(pen)
            parts.append(f'<path d="{pen.getCommands()}" transform="translate({x+(cursor+pos.x_offset)*scale:.3f} {baseline-pos.y_offset*scale:.3f}) scale({scale:.5f} {-scale:.5f})"/>')
            cursor+=pos.x_advance
        return f'<g fill="{fill}" stroke="{border}" stroke-width="{2.0/scale:.3f}" stroke-linejoin="round" paint-order="stroke fill">'+''.join(parts)+'</g>'
    books=[
      ('세계 명작 · 실제 폰트 출력','mermaid-source.png','인어공주',['The Little','Mermaid'],'#FFF4DA','#075564',420,210,285,None),
      ('전래 동화 · 실제 폰트 출력','folk-source.png','흥부와 놀부',['Heungbu and Nolbu'],'#7C3D31','#FFF2D5',384,92,650,('#FFF3D5',170)),
      ('호리 생활동화 · 실제 폰트 출력','hori-source.png','호리는 호리니까!',['Because Hori Is Hori!'],'#FFF1A6','#18536A',384,73,650,('#28A9DB',125)),
      ('세계 명작 · 실제 폰트 출력','rapunzel-source.png','라푼젤',['Rapunzel'],'#FFE18A','#51294C',395,230,260,None),
      ('자연관찰 · 실제 폰트 출력','butterfly-source.png','호랑나비',['Swallowtail Butterfly'],'#FFF8DE','#254D22',35,110,325,None),
      ('자연관찰 · 실제 폰트 출력','elephant-source.png','코끼리',['Elephant'],'#FFF4DB','#5B402A',35,110,270,None),
    ]
    svg=['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2400" height="1160"><rect width="2400" height="1160" fill="#FFF9F3"/>',
      '<text x="24" y="48" font-family="Malgun Gothic,sans-serif" font-size="30" font-weight="700" fill="#3F2F24">탱고북 손글씨체 · 실제 TTF 표지 출력</text>',
      '<text x="24" y="80" font-family="Malgun Gothic,sans-serif" font-size="19" fill="#77665A">Trial 0.1 · 이미지 글자가 아닌 실제 폰트 윤곽 · 책별 색/테두리/배치 조절</text>']
    for index,(label,art,ko,en,fill,border,tx,baseline,width,band) in enumerate(books):
        ox=24+(index%3)*792;oy=145+(index//3)*475
        data=base64.b64encode((art_root/art).read_bytes()).decode()
        svg.append(f'<text x="{ox}" y="{oy-18}" font-family="Malgun Gothic,sans-serif" font-size="23" font-weight="700" fill="#3F2F24">{html.escape(label)}</text>')
        svg.append(f'<image x="{ox}" y="{oy}" width="768" height="432" preserveAspectRatio="none" xlink:href="data:image/png;base64,{data}"/>')
        if band:svg.append(f'<rect x="{ox}" y="{oy}" width="768" height="{band[1]}" fill="{band[0]}"/>')
        svg.append(lettering(ko,ox+tx,oy+baseline,76 if not band else 74,fill,border,width,bool(band) or art.startswith('rapunzel')))
        for line,text in enumerate(en):
            svg.append(lettering(text,ox+tx,oy+baseline+43+line*38,34 if not band else 27,fill,border,width,bool(band) or art.startswith('rapunzel')))
    svg.append('<text x="24" y="1110" font-family="Malgun Gothic,sans-serif" font-size="18" fill="#77665A">한글 24자/영문/숫자/기호 지원 시험판 · 전래/호리는 기존 제목 위 단색 띠 적용 · 운영 표지 미변경</text></svg>')
    svg_path=output/'actual-font-covers.svg';svg_path.write_text('\n'.join(svg),encoding='utf-8')
    subprocess.run(['magick','RSVG:'+str(svg_path),str(output/'actual-font-covers.png')],check=True)
    print(output/'actual-font-covers.png')


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--art-root',type=Path,required=True);parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args();main(args.art_root,args.output)
