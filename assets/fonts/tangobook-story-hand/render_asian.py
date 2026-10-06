"""Render actual shaped trial outlines over existing clean cover artwork."""
import argparse
import base64
import html
import subprocess
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

from build_asian import ROOT, STEM, SAMPLES

LABELS = {'ko': '한국어', 'en': '영어', 'ja': '일본어', 'zh': '중국어 · 간체', 'vi': '베트남어', 'th': '태국어', 'ms': '말레이어', 'id': '인도네시아어'}


def main(art_root, output):
    output.mkdir(parents=True, exist_ok=True)
    path = ROOT/'dist-asian'/(STEM+'.ttf')
    font = TTFont(path); glyphset = font.getGlyphSet(); order = font.getGlyphOrder()
    hbfont = hb.Font(hb.Face(path.read_bytes())); hb.ot_font_set_funcs(hbfont)

    def lettering(text, x, baseline, size, max_width, fill, border, centered=True):
        buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties(); hb.shape(hbfont, buf)
        assert all(info.codepoint for info in buf.glyph_infos), text
        advance = sum(pos.x_advance for pos in buf.glyph_positions)
        size = min(size, max_width*1000/advance); scale = size/1000
        if centered: x -= advance*scale/2
        cursor = 0; paths = []
        for info,pos in zip(buf.glyph_infos, buf.glyph_positions):
            pen = SVGPathPen(glyphset); glyphset[order[info.codepoint]].draw(pen)
            paths.append(f'<path d="{pen.getCommands()}" transform="translate({x+(cursor+pos.x_offset)*scale:.3f} {baseline-pos.y_offset*scale:.3f}) scale({scale:.5f} {-scale:.5f})"/>')
            cursor += pos.x_advance
        return f'<g fill="{fill}" stroke="{border}" stroke-width="{1.5/scale:.3f}" stroke-linejoin="round" paint-order="stroke fill">'+''.join(paths)+'</g>'

    for book_index, book in enumerate(['mermaid', 'rapunzel']):
        svg = ['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2440" height="1020"><rect width="2440" height="1020" fill="#FFF9F3"/>',
            '<text x="24" y="45" font-family="Malgun Gothic,sans-serif" font-size="29" font-weight="700" fill="#3F2F24">탱고북 손글씨체 · 8개 언어 실제 TTF 표지 출력</text>',
            '<text x="24" y="79" font-family="Malgun Gothic,sans-serif" font-size="18" fill="#77665A">아시아 확장 시험판 0.2 · 색과 테두리는 책별 설정 · 일본어/말레이어/인도네시아어는 디자인용 제목 예시</text>']
        data = base64.b64encode((art_root/f'{book}-source.png').read_bytes()).decode()
        for index, lang in enumerate(['ko', 'en', 'ja', 'zh', 'vi', 'th', 'ms', 'id']):
            ox = 24 + (index%4)*604; oy = 145 + (index//4)*412
            text = SAMPLES[lang][book_index]
            svg.append(f'<text x="{ox}" y="{oy-18}" font-family="Malgun Gothic,sans-serif" font-size="22" font-weight="700" fill="#3F2F24">{LABELS[lang]}</text>')
            svg.append(f'<image x="{ox}" y="{oy}" width="580" height="326" preserveAspectRatio="none" xlink:href="data:image/png;base64,{data}"/>')
            if book == 'mermaid':
                fill,border = '#FFF4DA','#075564'
                # Same placement as our approved Mermaid concept; no header strip.
                lines = {'en': ['The Little', 'Mermaid'], 'vi': ['Nàng Tiên', 'Cá'], 'ms': ['Puteri', 'Duyung'], 'id': ['Putri', 'Duyung']}.get(lang, [text])
                for row, title in enumerate(lines):
                    svg.append(lettering(title, ox+427, oy+173+row*50, 50 if lang not in ['ja','zh'] else 62, 262, fill,border))
            else:
                fill,border = '#FFE18A','#51294C'
                lines = ['Công Chúa', 'Tóc Mây'] if lang == 'vi' else [text]
                for row,title in enumerate(lines):
                    svg.append(lettering(title, ox+300, oy+169+row*46, 53 if lang not in ['ja','zh'] else 60, 330, fill,border))
            svg.append(f'<text x="{ox}" y="{oy+352}" font-family="Malgun Gothic,Arial,sans-serif" font-size="17" fill="#77665A">{html.escape(text)}</text>')
        svg.append('<text x="24" y="976" font-family="Malgun Gothic,sans-serif" font-size="17" fill="#77665A">한글/일본어/중국어/태국어는 샘플 제목에 필요한 글자만 지원 · 베트남어 성조/태국어 기호 배치 검증 · 전체 문자권 완성본 아님</text></svg>')
        svg_path = output/f'{book}-8-languages.svg'
        svg_path.write_text('\n'.join(svg), encoding='utf-8')
        subprocess.run(['magick', 'RSVG:'+str(svg_path), str(output/f'{book}-8-languages.png')], check=True)
        print(output/f'{book}-8-languages.png')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--art-root', type=Path, required=True); parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args(); main(args.art_root, args.output)
