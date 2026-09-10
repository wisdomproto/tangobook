"""Compose synthetic test frames: real piece crops pasted onto real plate backgrounds.

Layout is in stud cells at the destination (cell(y) from the background's fitted line).
A case = list of pieces with (ch, col, row) in cells relative to the syllable origin, plus
the expected word. Output frames are written in the *uploaded-frame* space (same as p*.jpg),
so the existing harness (un-mirror -> page) reads them exactly like phone uploads.

usage: python compose.py <out_dir> [--n N] [--seed S]
"""
import json, os, sys, random, math
import numpy as np, cv2
HERE = os.environ.get('SYNTH_DIR') or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
P = json.load(open(os.path.join(HERE, 'pieces.json'), encoding='utf-8'))
BG = json.load(open(os.path.join(HERE, 'bg.json'), encoding='utf-8'))
LIB = {}
for p in P:
    if p.get('bad'): continue
    LIB.setdefault(p['ch'], []).append(p)

# template footprints in cells (from tango-lego.pieces.json): ch -> (w, h)
FOOT = {'ㄱ': (4, 5), 'ㄴ': (4, 5), 'ㄷ': (4, 5), 'ㄹ': (4, 5), 'ㅁ': (4, 5), 'ㅂ': (4, 5), 'ㅅ': (5, 5), 'ㅇ': (4, 5),
        'ㅈ': (5, 5), 'ㅊ': (5, 5), 'ㅋ': (4, 5), 'ㅌ': (4, 5), 'ㅍ': (5, 5), 'ㅎ': (5, 5),
        'ㅏ': (3, 5), 'ㅑ': (3, 5), 'ㅓ': (3, 5), 'ㅕ': (3, 5), 'ㅗ': (5, 3), 'ㅛ': (5, 3), 'ㅜ': (5, 3), 'ㅠ': (5, 3),
        'ㅡ': (5, 1), 'ㅣ': (1, 5)}
VERT = set('ㅏㅑㅓㅕㅣ'); HORZ = set('ㅗㅛㅜㅠㅡ')
CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'; JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
def compose_syl(cho, jung, jong=''):
    return chr(0xAC00 + (CHO.index(cho) * 21 + JUNG.index(jung)) * 28 + JONG.index(jong))

def layout(cho, jung, jong, gap):
    """pieces as (ch, col, row) in cells, in the RAW-FRAME space.
    Measured (not assumed): the uploaded frame is the reading orientation MIRRORED left-right only
    (the intake mirror); up/down is unchanged. So 'right of the consonant' is to the LEFT here,
    'below' stays below. gap = cells between touching faces (0 = butted)."""
    cw, chh = FOOT[cho]; items = [(cho, 0, 0)]
    if jung in VERT:
        vw, vh = FOOT[jung]; items.append((jung, -(vw + gap), 0)); bottom = max(chh, vh)
    else:
        vw, vh = FOOT[jung]; items.append((jung, cw - vw, chh + gap)); bottom = chh + gap + vh
    if jong:
        jw, jh = FOOT[jong]; items.append((jong, cw - jw, bottom + gap))
    return items

def cell_at(bg, y):
    """cell size in frame px at frame row y. 🔴 Measured: detBuf rows are top-0 like the frame
    (only reco.boxes flips y for display), so the line maps directly."""
    s = bg['s']
    return s * (bg['a'] + bg['b'] * (y / s))

def paste(canvas, piece, cx, cy, scale):
    im = cv2.imdecode(np.fromfile(os.path.join(HERE, 'pieces', piece['id'] + '.png'), np.uint8), cv2.IMREAD_UNCHANGED)
    im = im[piece['y0']:piece['y0'] + piece['h'], piece['x0']:piece['x0'] + piece['w']]
    h, w = im.shape[:2]
    im = cv2.resize(im, (max(1, int(round(w * scale))), max(1, int(round(h * scale)))), interpolation=cv2.INTER_AREA)
    h, w = im.shape[:2]
    x0, y0 = int(round(cx)), int(round(cy))
    H, W = canvas.shape[:2]
    if x0 < 0 or y0 < 0 or x0 + w > W or y0 + h > H: return False
    al = (im[:, :, 3:4] / 255.0)
    canvas[y0:y0 + h, x0:x0 + w] = (im[:, :, :3] * al + canvas[y0:y0 + h, x0:x0 + w] * (1 - al)).astype(np.uint8)
    return True

def piece_img(piece, scale):
    im = cv2.imdecode(np.fromfile(os.path.join(HERE, 'pieces', piece['id'] + '.png'), np.uint8), cv2.IMREAD_UNCHANGED)
    im = im[piece['y0']:piece['y0'] + piece['h'], piece['x0']:piece['x0'] + piece['w']]
    h, w = im.shape[:2]
    return cv2.resize(im, (max(1, int(round(w * scale))), max(1, int(round(h * scale)))), interpolation=cv2.INTER_AREA)

def blit(canvas, im, x0, y0):
    h, w = im.shape[:2]; H, W = canvas.shape[:2]
    x0, y0 = int(round(x0)), int(round(y0))
    if x0 < 0 or y0 < 0 or x0 + w > W or y0 + h > H: return False
    al = (im[:, :, 3:4] / 255.0)
    canvas[y0:y0 + h, x0:x0 + w] = (im[:, :, :3] * al + canvas[y0:y0 + h, x0:x0 + w] * (1 - al)).astype(np.uint8)
    return True

def render(bgname, cho, jung, jong, gap, ox, oy, rng):
    """Place by the pieces' real scaled sizes (side walls make them bigger than their footprint).
    🔴 Measured: the page sees the uploaded jpg as-is (the harness un-mirrors, the intake mirrors again),
    so the raw frame IS the reading orientation — vowel to the RIGHT, batchim BELOW, left edges aligned."""
    bg = BG[bgname]
    canvas = cv2.imread(os.path.join(HERE, 'bg', bgname + '.png')).copy()
    def pick(ch):
        if ch not in LIB: return None
        return rng.choice(LIB[ch])
    c = cell_at(bg, oy)
    pc = pick(cho); pv = pick(jung); pj = pick(jong) if jong else None
    if not pc or not pv or (jong and not pj): return None
    imc = piece_img(pc, c / pc['cell']); hc, wc = imc.shape[:2]
    if not blit(canvas, imc, ox, oy): return None
    g = gap * c
    if jung in VERT:
        imv = piece_img(pv, c / pv['cell']); hv, wv = imv.shape[:2]
        if not blit(canvas, imv, ox + wc + g, oy): return None
        bottom = oy + max(hc, hv)
    else:
        c2 = cell_at(bg, oy + hc); imv = piece_img(pv, c2 / pv['cell']); hv, wv = imv.shape[:2]
        if not blit(canvas, imv, ox, oy + hc + g): return None
        bottom = oy + hc + g + hv
    if jong:
        c3 = cell_at(bg, bottom); imj = piece_img(pj, c3 / pj['cell']); hj, wj = imj.shape[:2]
        if not blit(canvas, imj, ox, bottom + g): return None
    return canvas

def main():
    out = sys.argv[1]; n = 40; seed = 1
    if '--n' in sys.argv: n = int(sys.argv[sys.argv.index('--n') + 1])
    if '--seed' in sys.argv: seed = int(sys.argv[sys.argv.index('--seed') + 1])
    gaps = [0, 0, 1, 2]
    if '--gaps' in sys.argv: gaps = [int(g) for g in sys.argv[sys.argv.index('--gaps') + 1].split(',')]
    rng = random.Random(seed)
    os.makedirs(out, exist_ok=True)
    chos = [c for c in LIB if c in CHO]; vows = [c for c in LIB if c in JUNG]
    jongs = [''] + [c for c in LIB if c in CHO]
    bgnames = [k for k, v in BG.items() if v.get('clean') and v['plateY'] and (v['plateY'][1] - v['plateY'][0]) > 500]
    cases = []
    i = 0
    while len(cases) < n and i < n * 20:
        i += 1
        cho, jung = rng.choice(chos), rng.choice(vows); jong = rng.choice(jongs)
        gap = rng.choice(gaps)
        bgname = rng.choice(bgnames); bg = BG[bgname]
        s_ = bg['s']; ytop = bg['plateY'][0] * s_; ybot = bg['plateY'][1] * s_
        # total height of the syllable in cells (rough), keep it inside the plate
        cells_h = 5 + (0 if jung in VERT else 3 + gap) + (5 + gap if jong else 0)
        c0 = cell_at(bg, (ytop + ybot) / 2)
        lo_y, hi_y = ytop + 1.5 * c0, ybot - cells_h * c0 - 1.5 * c0
        if hi_y <= lo_y: continue
        oy = rng.uniform(lo_y, hi_y)
        c = cell_at(bg, oy)
        ox = rng.uniform(0.08 * bg['W'] + 5 * c, 0.9 * bg['W'] - 6 * c)
        fr = render(bgname, cho, jung, jong, gap, ox, oy, rng)
        if fr is None: continue
        word = compose_syl(cho, jung, jong)
        name = f'c{len(cases):03d}_g{gap}_{word}.jpg'
        cv2.imencode('.jpg', fr, [cv2.IMWRITE_JPEG_QUALITY, 90])[1].tofile(os.path.join(out, name))
        cases.append({'file': name, 'word': word, 'gap': gap, 'items': [cho, jung, jong], 'bg': bgname, 'ox': ox, 'oy': oy,
                      'kind': ('vert' if jung in VERT else 'horz') + ('+jong' if jong else '')})
    json.dump(cases, open(os.path.join(out, 'cases.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('cases', len(cases), 'lib', {k: len(v) for k, v in LIB.items()})

if __name__ == '__main__':
    main()
