"""Check actual shaping/normalization/mark positions, plus web-font equivalence."""
import argparse
import json
import unicodedata
from pathlib import Path

import uharfbuzz as hb
from fontTools.ttLib import TTFont

from build_asian import ROOT, STEM, SAMPLES, VI, MARKS


def main(directory):
    path = directory/(STEM+'.ttf')
    font = TTFont(path)
    web = TTFont(directory/(STEM+'.woff2'))
    cmap = font.getBestCmap()
    assert cmap == web.getBestCmap()
    assert font.getGlyphOrder() == web.getGlyphOrder()
    for glyph in font.getGlyphOrder():
        assert font['glyf'][glyph].compile(font['glyf']) == web['glyf'][glyph].compile(web['glyf'])
        assert font['hmtx'][glyph] == web['hmtx'][glyph]
        ink = font['glyf'][glyph]
        ink.recalcBounds(font['glyf'])
        if getattr(ink, 'numberOfContours', 0):
            assert ink.yMax <= font['OS/2'].usWinAscent, glyph
            assert ink.yMin >= -font['OS/2'].usWinDescent, glyph
    hbfont = hb.Font(hb.Face(path.read_bytes())); hb.ot_font_set_funcs(hbfont)

    def shape(text, **features):
        buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
        hb.shape(hbfont, buf, features)
        assert all(info.codepoint for info in buf.glyph_infos), text
        return [(info.codepoint, pos.x_advance, pos.x_offset, pos.y_offset) for info,pos in zip(buf.glyph_infos,buf.glyph_positions)]

    samples = {}
    for lang, titles in SAMPLES.items():
        samples[lang] = {title: shape(title) for title in titles}
        for title in titles:
            assert shape(title) == shape(unicodedata.normalize('NFD', title)), title
    for char in VI + VI.upper():
        assert ord(char) in cmap, char
        assert shape(char) == shape(unicodedata.normalize('NFD', char)), char
    for char in MARKS:
        assert font['hmtx'][cmap[ord(char)]][0] == 0
    for title in SAMPLES['th']:
        output = shape(title)
        marks = [position for position in output if position[1] == 0]
        assert marks and all(position[2] != 0 and position[3] > 650 for position in marks), title
        assert output != shape(title, mark=False, mkmk=False), title
    assert shape('นื้')[-1][3] > shape('นื้')[-2][3] + 100
    assert ord('ก') in cmap and ord('ข') not in cmap
    assert ord('あ') not in cmap and ord('界') not in cmap
    result = {'status': 'passed', 'supportedCount': len(cmap), 'vietnameseNFCNFD': 'all alphabet forms match', 'thaiMarkPlacement': 'sample marks zero advance and anchored; stacked mark test passed', 'ttfWoff2': 'outlines, metrics and cmap identical', 'samples': samples, 'limitations': ['Subset font: missing characters remain missing.', 'Visual/native-language review is separate from binary/shaping checks.']}
    (directory/'verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k != 'samples'}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--directory', type=Path, default=ROOT/'dist-asian')
    main(parser.parse_args().directory)
