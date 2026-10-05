"""Extend our original trial with Vietnamese and reviewed Asian title subsets.

No donor font outlines. CJK/Thai inputs are the recorded original glyph sheets;
Vietnamese accents and Thai combining marks are constructed as native vectors.
"""
import argparse
import hashlib
import json
import unicodedata
from pathlib import Path

from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

from build import ROOT, circle, line, source_grid, trace

STEM = 'TangoBookStoryHand-AsianTrial-Regular'
VI = 'aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵđ'
ZH = list('小美人鱼长发公主')
JA = list('人魚姫ラプンツェルにんぎょひめ')
TH = list('เงอกนยราพซลส')
MARKS = ['ื', 'ั', '้']
SAMPLES = {
    'ko': ['인어공주', '라푼젤'],
    'en': ['The Little Mermaid', 'Rapunzel'],
    'ja': ['人魚姫', 'ラプンツェル', 'にんぎょひめ'],
    'zh': ['小美人鱼', '长发公主'],
    'vi': ['Nàng Tiên Cá', 'Công Chúa Tóc Mây'],
    'th': ['เงือกน้อย', 'ราพันเซล'],
    # Design samples, not approved/catalog translations.
    'ms': ['Puteri Duyung', 'Rapunzel'],
    'id': ['Putri Duyung', 'Rapunzel'],
}


def name(char):
    return f'uni{ord(char):04X}'


def draw_base(pen, glyph, glyphs, dotless=False):
    if not dotless:
        glyph.draw(pen, glyphs)
        return
    # Remove only the separate upper dot of our original lowercase i.
    recording = RecordingPen()
    glyph.draw(recording, glyphs)
    contour = []
    for operation, points in recording.value:
        contour.append((operation, points))
        if operation in ('closePath', 'endPath'):
            coords = [p for _, args in contour for p in args if p is not None]
            if min(p[1] for p in coords) < 450:
                for op, args in contour:
                    getattr(pen, op)(*args)
            contour = []


def accent(pen, mark, cx, y):
    def stroke(a, b, width=50):
        line(pen, (cx+a[0], y+a[1]), (cx+b[0], y+b[1]), width)
    if mark == '\u0301':
        stroke((-65, 0), (65, 135))
    elif mark == '\u0300':
        stroke((-65, 135), (65, 0))
    elif mark == '\u0302':
        stroke((-115, 0), (0, 115)); stroke((0, 115), (115, 0))
    elif mark == '\u0306':
        for a, b in zip([(-110, 100), (-65, 15), (0, 0), (65, 15)], [(-65, 15), (0, 0), (65, 15), (110, 100)]):
            stroke(a, b)
    elif mark == '\u0303':
        points = [(-135, 25), (-85, 75), (-35, 75), (35, 5), (85, 5), (135, 55)]
        for a, b in zip(points, points[1:]): stroke(a, b, 45)
    elif mark == '\u0309':
        points = [(-45, 110), (15, 145), (65, 110), (55, 65), (0, 15), (0, -5)]
        for a, b in zip(points, points[1:]): stroke(a, b, 45)
    elif mark == '\u0323':
        circle(pen, cx, -100, 45)
    elif mark == '\u031B':
        stroke((-25, -65), (55, -25)); stroke((55, -25), (75, 75))
    else:
        raise ValueError(mark)


def main(output):
    output.mkdir(parents=True, exist_ok=True)
    font = TTFont(ROOT/'dist/TangoBookStoryHand-Trial-Regular.ttf', recalcTimestamp=False)
    original_order = list(font.getGlyphOrder())
    glyphs = font['glyf']
    metrics = font['hmtx'].metrics
    cmap = dict(font.getBestCmap())
    additions = []
    source_boxes = {}

    def insert(char, glyph, advance):
        glyph_name = name(char)
        glyphs[glyph_name] = glyph
        glyph.recalcBounds(glyphs)
        metrics[glyph_name] = (advance, getattr(glyph, 'xMin', 0))
        cmap[ord(char)] = glyph_name
        additions.append(glyph_name)

    for char in sorted(set(VI + VI.upper()) - set(chr(cp) for cp in cmap)):
        decomposed = unicodedata.normalize('NFD', char)
        base = char.lower() if char in 'đĐ' else decomposed[0]
        if char in 'đĐ': base = 'd' if char == 'đ' else 'D'
        donor = glyphs[name(base)]
        pen = TTGlyphPen(glyphs)
        draw_base(pen, donor, glyphs, dotless=(base == 'i'))
        width = metrics[name(base)][0]
        cx = (donor.xMin + donor.xMax)/2
        if char in 'đĐ':
            line(pen, (donor.xMin-20, 420), (donor.xMax+20, 420), 50)
        else:
            marks = decomposed[1:]
            top = 540 if base == 'i' else donor.yMax
            y = top + 80
            # Alphabet modifiers below tone accents, regardless of NFD order.
            for mark in ['\u0302', '\u0306', '\u031B']:
                if mark in marks:
                    accent(pen, mark, donor.xMax-10 if mark == '\u031B' else cx, y)
                    if mark != '\u031B': y += 185
            for mark in marks:
                if mark not in ['\u0302', '\u0306', '\u031B']:
                    accent(pen, mark, cx, y)
        insert(char, pen.glyph(), width)

    for lang, chars, cols, rows in [('zh', ZH, 4, 2), ('ja', JA, 5, 3), ('th', TH, 4, 3)]:
        cells = source_grid(ROOT/f'sources/{lang}-grid.png', chars, cols, rows)
        for char, (binary, box) in cells.items():
            if ord(char) in cmap: continue
            top = 600 if char in 'ょェ' else (650 if lang == 'th' else 850)
            glyph, metric, _ = trace(binary, top, 0 if lang == 'th' else 10, lang != 'th')
            insert(char, glyph, metric[0])
            source_boxes[char] = {'sheet': f'{lang}-grid.png', 'box': box}

    for char in MARKS:
        pen = TTGlyphPen(glyphs)
        if char in 'ืั':
            points = [(-100, 105), (-70, 20), (65, 20), (95, 90)]
            for a, b in zip(points, points[1:]): line(pen, a, b, 40)
            if char == 'ื':
                line(pen, (15, 25), (15, 115), 35)
                line(pen, (75, 35), (75, 120), 35)
        else:
            points = [(-85, 20), (-35, 100), (25, 20), (90, 95)]
            for a, b in zip(points, points[1:]): line(pen, a, b, 40)
        insert(char, pen.glyph(), 0)

    font.setGlyphOrder(original_order + additions)
    for table in font['cmap'].tables:
        if table.isUnicode(): table.cmap = dict(cmap)
    font['hhea'].ascent = 1400
    font['hhea'].descent = -300
    os2 = font['OS/2']
    os2.sTypoAscender = 1400; os2.sTypoDescender = -300
    os2.usWinAscent = 1450; os2.usWinDescent = 350
    os2.recalcUnicodeRanges(font)
    font['head'].fontRevision = 0.2
    values = {1: 'TangoBook Story Hand Asian Trial', 3: STEM+'-v0.2.0', 4: 'TangoBook Story Hand Asian Trial Regular', 5: 'Version 0.200', 6: STEM, 10: 'Vietnamese alphabet and original CJK/Thai title subsets; not complete Asian language coverage.'}
    for record in font['name'].names:
        if record.nameID in values:
            record.string = values[record.nameID].encode(record.getEncoding())
    # Recompile both original kerning and Thai mark placement together.
    features = ['languagesystem DFLT dflt;', 'languagesystem latn dflt;', 'languagesystem thai dflt;']
    for char in ['ื', 'ั']: features.append(f'markClass {name(char)} <anchor 0 0> @AboveVowel;')
    features.append(f'markClass {name("้")} <anchor 0 0> @Tone;')
    features.append('feature mark {')
    for char in TH:
        advance = metrics[name(char)][0]
        features.append(f'pos base {name(char)} <anchor {advance//2} 705> mark @AboveVowel <anchor {advance//2} 745> mark @Tone;')
    features.append('} mark;')
    features.append('feature mkmk {')
    for char in ['ื', 'ั']: features.append(f'pos mark {name(char)} <anchor 0 190> mark @Tone;')
    features.append('} mkmk;')
    features.append('feature kern {')
    for a,b,k in [('A','V',-55),('A','W',-35),('A','Y',-50),('T','a',-40),('T','e',-40),('T','o',-40),('V','a',-35),('W','a',-25),('Y','o',-45),('L','T',-25)]:
        features.append(f'pos {name(a)} {name(b)} {k};')
    features.append('} kern;')
    if 'GPOS' in font: del font['GPOS']
    if 'GDEF' in font: del font['GDEF']
    addOpenTypeFeaturesFromString(font, '\n'.join(features))
    font.recalcTimestamp = False
    font.save(output/(STEM+'.ttf'))
    font.flavor = 'woff2'; font.save(output/(STEM+'.woff2'))
    coverage = {
        'version': '0.2.0', 'family': 'TangoBook Story Hand Asian Trial',
        'codepoints': sorted(cmap), 'characters': ''.join(chr(cp) for cp in sorted(cmap)),
        'supportedCount': len(cmap), 'samples': SAMPLES,
        'languageCoverage': {'ko': '24 syllables only', 'en': 'ASCII alphabet', 'vi': 'Vietnamese alphabet upper/lower with precomposed accents', 'ms': 'Latin alphabet', 'id': 'Latin alphabet', 'ja': 'reviewed sample titles only', 'zh': 'reviewed sample titles only', 'th': 'reviewed sample titles and three positioned marks only'},
        'fullAsianCoverage': False,
        'unapprovedTranslationSamples': ['ja', 'ms', 'id'],
        'sources': {f'{lang}-grid.png': hashlib.sha256((ROOT/f'sources/{lang}-grid.png').read_bytes()).hexdigest() for lang in ['ja', 'zh', 'th']},
        'sourceBoxes': source_boxes,
        'limitations': ['Not production ready.', 'Korean, Japanese, Chinese and Thai are title subsets, not full alphabets.', 'Thai shaping outside the listed sample titles is not supported/verified.', 'Japanese/Malay/Indonesian titles are typography samples, not catalog translations.', 'Native-language typography review remains required.'],
    }
    (output/'coverage.json').write_text(json.dumps(coverage, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'supportedCount': len(cmap), 'output': str(output)}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT/'dist-asian')
    main(parser.parse_args().output)
