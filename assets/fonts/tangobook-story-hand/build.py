"""Build an original, explicitly limited cover-lettering font from reviewed glyphs.

Source images are design inputs, not embedded bitmap glyphs. This produces real
TrueType quadratic outlines. No installed font is used as an outline donor.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import string
from pathlib import Path

import cv2
import numpy as np
from fontTools.fontBuilder import FontBuilder
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent
LATIN = list(string.ascii_uppercase + string.ascii_lowercase + string.digits + '&?')
HANGUL = list('인어공주라푼젤흥부와놀호랑나비코끼리는니까탱고북')
FAMILY = 'TangoBook Story Hand Trial'
FILE_STEM = 'TangoBookStoryHand-Trial-Regular'
UNITS = 1000


def source_grid(path: Path, chars: list[str], columns: int, rows: int, row_edges=None, col_edges=None):
    image = cv2.imdecode(np.fromfile(path, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
    if image is None:
        raise ValueError(f'Cannot read source: {path}')
    height, width = image.shape
    output = {}
    for index, char in enumerate(chars):
        col, row = index % columns, index // columns
        left, right = (round(col_edges[col]*width),round(col_edges[col+1]*width)) if col_edges else (round(col * width / columns), round((col + 1) * width / columns))
        top, bottom = (round(row_edges[row]*height),round(row_edges[row+1]*height)) if row_edges else (round(row * height / rows), round((row + 1) * height / rows))
        binary = (image[top:bottom, left:right] < 120).astype(np.uint8) * 255
        points = cv2.findNonZero(binary)
        if points is None:
            raise ValueError(f'Empty source cell: {char}')
        x, y, w, h = cv2.boundingRect(points)
        if min(x, y, binary.shape[1] - x - w, binary.shape[0] - y - h) < 3:
            raise ValueError(f'Source glyph touches cell edge: {char}')
        output[char] = (binary[y:y+h, x:x+w], [left+x, top+y, w, h])
    return output


def trace(binary: np.ndarray, target_top: int, target_bottom: int, hangul=False):
    contours, hierarchy = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    height, width = binary.shape
    scale_y = (target_top - target_bottom) / max(height - 1, 1)
    scale_x = min(scale_y, 850 / max(width - 1, 1)) if hangul else scale_y
    ink_width = (width - 1) * scale_x
    advance = 900 if hangul else round(ink_width + 125)
    left = (advance - ink_width) / 2
    pen = TTGlyphPen(None)
    diagnostics = []
    for index, contour in enumerate(contours):
        if abs(cv2.contourArea(contour)) < 3:
            continue
        polygon = cv2.approxPolyDP(contour, 0.65, True).reshape(-1, 2)
        if len(polygon) < 3:
            continue
        points = [(round(left + x * scale_x), round(target_top - y * scale_y)) for x, y in polygon]
        depth, parent = 0, hierarchy[0][index][3]
        while parent >= 0:
            depth += 1
            parent = hierarchy[0][parent][3]
        area = sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(points, points[1:] + points[:1]))
        # Clockwise outer contours; counterclockwise counters.
        if (area > 0) == (depth % 2 == 0):
            points.reverse()
        midpoint = lambda a, b: (round((a[0] + b[0]) / 2), round((a[1] + b[1]) / 2))
        pen.moveTo(midpoint(points[-1], points[0]))
        for i, point in enumerate(points):
            pen.qCurveTo(point, midpoint(point, points[(i+1) % len(points)]))
        pen.closePath()
        diagnostics.append({'points': len(points), 'hole': bool(depth % 2)})
    return pen.glyph(), (advance, round(left)), diagnostics


def polygon(pen, points, hole=False):
    area = sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(points, points[1:]+points[:1]))
    if (area > 0) != hole:
        points = points[::-1]
    pen.moveTo(points[0])
    for point in points[1:]:
        pen.lineTo(point)
    pen.closePath()


def circle(pen, cx, cy, radius, hole=False):
    polygon(pen, [(round(cx+radius*math.cos(i*math.tau/24)), round(cy+radius*math.sin(i*math.tau/24))) for i in range(24)], hole)


def line(pen, a, b, width=70):
    dx, dy = b[0]-a[0], b[1]-a[1]
    length = math.hypot(dx,dy)
    nx, ny = -dy/length*width/2, dx/length*width/2
    polygon(pen, [(round(a[0]+nx), round(a[1]+ny)),(round(b[0]+nx),round(b[1]+ny)),(round(b[0]-nx),round(b[1]-ny)),(round(a[0]-nx),round(a[1]-ny))])
    circle(pen, *a, width/2)
    circle(pen, *b, width/2)


def native_punctuation(char, glyphs):
    pen = TTGlyphPen(glyphs)
    width = 470
    def stroke(a,b,w=100): line(pen,a,b,w)
    if char == '.': circle(pen,150,45,60); width=300
    elif char == '·': circle(pen,150,350,50); width=300
    elif char == ',': stroke((180,80),(130,-100),80); width=300
    elif char == ':':
        circle(pen,150,460,55); circle(pen,150,65,55); width=300
    elif char == ';':
        circle(pen,150,460,55); stroke((180,80),(130,-100),80); width=300
    elif char == '!':
        stroke((150,700),(155,225),90); circle(pen,155,55,60); width=310
    elif char in "'\"`":
        stroke((155,720),(125,555),65); width=300
        if char=='"': stroke((310,720),(280,555),65); width=450
        if char=='`': stroke((115,700),(190,595),65)
    elif char in '-_–—':
        width = {'-':450,'_':580,'–':700,'—':1000}[char]
        stroke((65,300 if char!='_' else -90),(width-65,300 if char!='_' else -90),65)
    elif char in '/\\':
        stroke((90,-60 if char=='/' else 730),(390,730 if char=='/' else -60)); width=480
    elif char in '+=':
        stroke((90,330 if char=='+' else 230),(480,330 if char=='+' else 230)); width=570
        if char=='+': stroke((285,115),(285,550))
        else: stroke((90,440),(480,440))
    elif char in '<>':
        points = [(410,590),(110,320),(410,50)] if char=='<' else [(110,590),(410,320),(110,50)]
        stroke(points[0],points[1]); stroke(points[1],points[2]); width=520
    elif char in '()[]{}':
        reverse = char in ')]}'
        points = [(315,790),(225,660),(185,390),(225,100),(315,-90)]
        if char in '[]': points=[(315,790),(165,790),(165,-90),(315,-90)]
        if char in '{}': points=[(330,790),(220,740),(220,470),(130,350),(220,240),(220,-50),(330,-90)]
        if reverse: points=[(450-x,y) for x,y in points]
        for a,b in zip(points,points[1:]): stroke(a,b,100)
        width=450
    elif char=='|': stroke((150,-100),(150,790),60); width=300
    elif char=='#':
        for a,b in [((200,40),(310,730)),((430,40),(540,730)),((90,270),(600,290)),((110,500),(620,520))]: stroke(a,b,65)
        width=710
    elif char=='*':
        for angle in (0,math.pi/3,2*math.pi/3): stroke((260-150*math.cos(angle),510-150*math.sin(angle)),(260+150*math.cos(angle),510+150*math.sin(angle)),60)
        width=520
    elif char=='^': stroke((95,530),(255,720),60); stroke((255,720),(415,530),60); width=510
    elif char=='~':
        points=[(80,290),(140,355),(220,355),(340,265),(430,265),(500,330)]
        for a,b in zip(points,points[1:]): stroke(a,b,55)
        width=580
    elif char=='%':
        circle(pen,170,570,110);circle(pen,170,570,44,True)
        circle(pen,510,130,110);circle(pen,510,130,44,True)
        stroke((125,0),(540,730),65); width=680
    elif char=='$':
        glyphs['uni0053'].draw(pen,glyphs); stroke((300,-90),(335,835),55)
        width=glyphs['uni0053'].xMax+70
    elif char=='@':
        glyphs['uni0061'].draw(TransformPen(pen,(.8,0,0,.8,180,100)),glyphs)
        circle(pen,405,355,350);circle(pen,405,355,250,True); width=810
    else:
        raise ValueError(f'No punctuation design for {char!r}')
    glyph=pen.glyph()
    return glyph,(width,0)


def build(output: Path):
    output.mkdir(parents=True,exist_ok=True)
    # Reviewed whitespace boundaries, rather than assuming AI output is a precise grid.
    latin=source_grid(ROOT/'sources/latin-grid.png',LATIN,8,8,
        [v/1254 for v in [0,190,337,487,633,795,953,1092,1254]],
        [v/1254 for v in [0,190,335,480,630,785,930,1080,1254]])
    hangul=source_grid(ROOT/'sources/hangul-grid.png',HANGUL,6,4,[0,300/1024,550/1024,775/1024,1])
    glyphs={}; metrics={}; cmap={}; diagnostics={}
    # Distinctive empty-box marker; unsupported characters never look supported.
    pen=TTGlyphPen(None)
    polygon(pen,[(70,0),(70,740),(630,740),(630,0)])
    polygon(pen,[(145,75),(555,75),(555,665),(145,665)],True)
    glyphs['.notdef']=pen.glyph(); metrics['.notdef']=(700,70)
    for char in [' ','\u00a0']:
        name=f'uni{ord(char):04X}'; glyphs[name]=TTGlyphPen(None).glyph(); metrics[name]=(300,0); cmap[ord(char)]=name
    for char,(binary,box) in {**latin,**hangul}.items():
        korean=char in hangul
        top,bottom=850,10
        if not korean:
            top,bottom=740,0
            if char.islower():
                top=740 if char in 'bdfhijklt' else 540
                if char=='t': top=650
                bottom=-180 if char in 'gjpqy' else 0
            if char=='Q': bottom=-70
        glyph,metric,contours=trace(binary,top,bottom,korean)
        name=f'uni{ord(char):04X}'; glyphs[name]=glyph; metrics[name]=metric; cmap[ord(char)]=name
        diagnostics[char]={'sourceBox':box,'source': 'hangul-grid.png' if korean else 'latin-grid.png','contours':contours}
    # Components need bounds before referenced glyphs are composed.
    for glyph in glyphs.values(): glyph.recalcBounds(glyphs)
    punctuation=set(string.punctuation)-set('&?')
    punctuation.update('–—·')
    for char in sorted(punctuation):
        name=f'uni{ord(char):04X}'
        glyphs[name],metrics[name]=native_punctuation(char,glyphs); cmap[ord(char)]=name
        glyphs[name].recalcBounds(glyphs)
    # Typographic quotes reuse our own quote contours.
    for char,donor in [('‘',"'"),('’',"'"),('“','"'),('”','"')]:
        name=f'uni{ord(char):04X}'; donor_name=f'uni{ord(donor):04X}'
        pen=TTGlyphPen(glyphs);pen.addComponent(donor_name,(1,0,0,1,0,0))
        glyphs[name]=pen.glyph(); metrics[name]=metrics[donor_name];cmap[ord(char)]=name
    ellipsis=TTGlyphPen(glyphs)
    for offset in (0,260,520): ellipsis.addComponent('uni002E',(1,0,0,1,offset,0))
    glyphs['uni2026']=ellipsis.glyph();metrics['uni2026']=(820,0);cmap[0x2026]='uni2026'
    builder=FontBuilder(UNITS,isTTF=True)
    builder.setupGlyphOrder(list(glyphs))
    builder.setupCharacterMap(cmap)
    builder.setupGlyf(glyphs)
    for name,glyph in glyphs.items():
        glyph.recalcBounds(glyphs)
        metrics[name]=(metrics[name][0],getattr(glyph,'xMin',0))
    builder.setupHorizontalMetrics(metrics)
    builder.setupHorizontalHeader(ascent=1000,descent=-250,lineGap=100)
    builder.setupNameTable({'familyName':FAMILY,'styleName':'Regular','uniqueFontIdentifier':'TangoBookStoryHandTrial-v0.1.0','fullName':FAMILY+' Regular','psName':FILE_STEM,'version':'Version 0.100','manufacturer':'TangoBook','designer':'TangoBook — original AI-assisted lettering and vector construction','description':'Experimental subset: 24 Hangul syllables, Latin letters, digits and basic punctuation. Not full Korean coverage.','licenseDescription':'Internal TangoBook evaluation asset. No third-party font outlines included. Publication and distribution terms not decided.'})
    builder.setupOS2(sTypoAscender=1000,sTypoDescender=-250,sTypoLineGap=100,usWinAscent=1050,usWinDescent=300,sxHeight=540,sCapHeight=740,usWeightClass=400,fsType=0,fsSelection=0x40)
    builder.setupPost();builder.setupMaxp()
    # Fixed timestamps keep repeated builds reviewable and deterministic.
    builder.font['head'].created=3874003200;builder.font['head'].modified=3874003200
    builder.font.recalcTimestamp=False
    features=['languagesystem DFLT dflt;','languagesystem latn dflt;','feature kern {']
    for left,right,value in [('A','V',-55),('A','W',-35),('A','Y',-50),('T','a',-40),('T','e',-40),('T','o',-40),('V','a',-35),('W','a',-25),('Y','o',-45),('L','T',-25)]:
        features.append(f'pos uni{ord(left):04X} uni{ord(right):04X} {value};')
    features.append('} kern;')
    addOpenTypeFeaturesFromString(builder.font,'\n'.join(features))
    ttf_path=output/(FILE_STEM+'.ttf');builder.save(ttf_path)
    font=TTFont(ttf_path,recalcTimestamp=False);font.flavor='woff2';font.save(output/(FILE_STEM+'.woff2'))
    codepoints=sorted(cmap)
    coverage={'version':'0.1.0','family':FAMILY,'hangulCount':len(hangul),'hangul':''.join(HANGUL),'latinLetters':string.ascii_letters,'digits':string.digits,'supportedCount':len(codepoints),'characters':''.join(chr(cp) for cp in codepoints),'codepoints':codepoints,'fullKoreanCoverage':False,'limitations':['Only 24 explicitly reviewed Hangul syllables.','No CJK ideographs, Thai or Vietnamese accented letters.','Trial outlines and spacing require further review before production use.'],'sources':{name:hashlib.sha256((ROOT/'sources'/name).read_bytes()).hexdigest() for name in ['approved-concept.png','latin-grid.png','hangul-grid.png']},'glyphs':diagnostics}
    (output/'coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'ttf':str(ttf_path),'hangul':len(hangul),'supported':len(cmap),'glyphs':len(glyphs)},ensure_ascii=False))


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=ROOT/'dist')
    build(parser.parse_args().output)
