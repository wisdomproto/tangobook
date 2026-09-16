# -*- coding: utf-8 -*-
"""스티커 카드 형판 굽기 — 종이에 찍히는 그림 그대로를 인식기 형판으로.

실행:  python sticker_templates.py   → packages/client/public/tango-sticker.json

2026-09-16: 스티커 블록(4x4 자음 · 2x4 모음)이 생겼다. 기존 `tango-lego.pieces.json` 은
  **플라스틱 획 조각의 칸 발자국**이라 인쇄 글꼴과 모양이 다르다 — 그걸 쓰면 안 된다.

🔴 이 파일은 그림을 다시 그리지 않는다. `hangul_sheet.card()` 를 **그대로 불러서** 카드 한 장을
   찍고 잉크만 뽑는다. 시트를 고치면(PAD·FILL·글꼴·획 굵기) 형판이 자동으로 따라온다 —
   종이와 형판이 갈라지면 인식이 조용히 나빠지는데 그건 아무 데도 안 찍힌다.

🔴 정규화 기준은 **잉크 bbox 가 아니라 카드**다. 잉크 bbox 로 40x40 을 채우면 ㅣ(2.75x20mm 막대)가
   **까만 정사각형**이 되어 ㅂ·ㅌ·ㄹ·ㅁ 과 0.72~0.75 로 붙는다(실측). 카드가 액자를 주므로
   그 액자 기준으로 재면 그 병이 없다.

🔴 표본법은 `matchLegoShape` 와 **같은 최근접 규칙**이어야 한다(관찰과 형판을 다른 자로 재면
   겹침이 편향된다). 그래서 격자 크기를 JSON 에 같이 적는다.

🔴 모음 회전표는 `tango-lego.pieces.json` 의 `rots` 와 같은 규칙 — 90 = 시계방향(페이지 legoRotate 와 동일).
   자음은 **0도만 굽는다**. 아이가 ㄱ 카드를 뒤집으면 그림이 그대로 ㄴ 이라 ㄴ 형판이 받아 준다.
"""
import base64, json, os, sys
import numpy as np
from PIL import Image, ImageDraw

import sticker_block as S
import hangul_sheet as HS
from alphabet_sheet import px, CONS, VOWEL

GRID = 40            # matchLegoShape 의 legoMatchGrid 와 같아야 한다
# 곁획 한 줄로 치는 기준 — 🔴 **잡티를 안 세려고** 둘 다 필요하다. 진짜 곁획은 굵기 2.75mm =
# 카드 긴 변의 9.5% = 격자 약 4칸이라 넉넉히 통과하고, JPEG 잡티는 1칸짜리라 떨어진다.
# 실측: 이 관문이 없을 때 진짜 ㅗ 카드가 **곁획 4개**로 세어져 통째로 버려졌다(겹침은 ㅗ 0.81 로 맞았는데).
# 🔴 값은 JSON 으로 나가고 페이지가 읽는다 — 양쪽에 따로 적으면 조용히 갈라진다.
TICK_INK = 2         # 그 줄의 기둥 반대쪽 절반에 잉크가 이만큼(격자칸)은 있어야 「곁획 줄」
TICK_RUN = 2         # 그런 줄이 이만큼 이어져야 곁획 하나
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..',
                   'packages', 'client', 'public', 'tango-sticker.json')

# 회전 -> 글자. 자음은 0도만. (ㅁ·ㅇ 은 회전대칭이라 0도가 전부다)
# 🔴 **네 회전을 다 굽는다.** 획 조각(tango-lego.pieces.json)의 ㅡㅣ 는 1x5 막대라 0도와 180도가
#    같은 그림이어서 두 개면 됐지만, **카드는 대칭이 아니다** — 세로획이 왼쪽에 붙어 있어서
#    0도(왼쪽 기둥)와 180도(오른쪽 기둥)가 다른 그림이고, 둘 다 ㅣ 다.
#    실측: 아래쪽에 막대가 있는 ㅡ 카드가 형판에 없어 IoU 0.00 으로 통째로 버려졌다.
VOWEL_ROTS = {
    'ㅣ': {0: 'ㅣ', 90: 'ㅡ', 180: 'ㅣ', 270: 'ㅡ'},
    'ㅏ': {0: 'ㅏ', 90: 'ㅜ', 180: 'ㅓ', 270: 'ㅗ'},
    'ㅑ': {0: 'ㅑ', 90: 'ㅠ', 180: 'ㅕ', 270: 'ㅛ'},
}


def render(glyph, cw, ch, cr, font, col, left=False, t=0):
    """카드 한 장을 찍어 **잉크 마스크**(bool 2차원)로. 그리기는 hangul_sheet.card 그대로."""
    img = Image.new('RGB', (px(cw), px(ch)), 'white')
    HS.card(ImageDraw.Draw(img), 0, 0, cw, ch, cr, glyph, font, col, left=left, t=t)
    a = np.array(img).astype(np.int16)
    return (a[:, :, 0] < 120) & (a[:, :, 1] < 120) & (a[:, :, 2] < 120)


def rot(m, deg):
    """페이지의 legoRotate 와 같은 방향 — 90 = 시계방향. dest[i][j] = src[H-1-j][i]."""
    deg %= 360
    if deg == 0: return m
    H, W = m.shape
    if deg == 90:  return np.array([[m[H-1-j, i] for j in range(H)] for i in range(W)])
    if deg == 180: return m[::-1, ::-1]
    return np.array([[m[j, W-1-i] for j in range(H)] for i in range(W)])


def grid_of(mask):
    """matchLegoShape 와 같은 최근접 표본 — 카드 전체를 GRID x GRID 로."""
    h, w = mask.shape
    return np.array([[mask[int((y+0.5)*h/GRID), int((x+0.5)*w/GRID)]
                      for x in range(GRID)] for y in range(GRID)], dtype=bool)


# ── 탐침 셋. 🔴 요약 지표를 더 손보는 게 아니라 **도면에서 다른 자리 하나만** 재는 것이다.
#    (ㄹ/ㅌ 위칸 홈 · ㅁ/ㅇ 모서리 — 획 블록에서 이미 두 번 증명된 자.)
def probe_bar(g):
    """위칸 왼쪽−오른쪽 채움. 실측: ㄴ+0.50 ㅌ+0.33 ㄷ+0.25 ㄱ−0.20 ㄹ−0.22 ㅋ−0.33 · 나머지 0.00"""
    ys, xs = np.where(g)
    if not len(ys): return 0.0
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    band = g[y0:y0+max(1, int((y1-y0+1)*0.38)), x0:x1+1]
    col = band[int(band.shape[0]*0.4):, :]
    if not col.size: return 0.0
    half = col.shape[1]//2
    return float(col[:, :half].mean() - col[:, half:].mean())


def probe_corner(g):
    """잉크 bbox 네 모서리(각 25%) 채움의 최솟값. 실측: ㅁ 1.00 · ㅇ 0.33"""
    ys, xs = np.where(g)
    if not len(ys): return 0.0
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    h, w = y1-y0+1, x1-x0+1
    q = []
    for oy in (0, 1):
        for ox in (0, 1):
            yy, xx = y0+int(oy*h*0.75), x0+int(ox*w*0.75)
            q.append(g[yy:yy+max(1, int(h*0.25)), xx:xx+max(1, int(w*0.25))].mean())
    return float(min(q))


def probe_ticks(g, kind):
    """기둥 반대쪽 절반의 곁획 덩어리 수. 실측: ㅣ 0 · ㅏ 1 · ㅑ 2 (겹침 없음).
    🔴 어느 쪽이 기둥인지 **세어서** 정한다 — ㅓ 는 기둥이 오른쪽이다. 「왼쪽 정렬」을
       코드에 못 박으면 180도 돌린 카드를 통째로 놓친다."""
    if kind == 'sq': return -1
    G = g.shape[0]
    if kind == 'port':
        a, b = g[:, :G//2], g[:, G//2:]
        far = b if a.mean() >= b.mean() else a
        cnt = far.sum(axis=1)
    else:
        a, b = g[:G//2, :], g[G//2:, :]
        far = b if a.mean() >= b.mean() else a
        cnt = far.sum(axis=0)
    n, run = 0, 0
    for v in cnt:
        if v >= TICK_INK:
            run += 1
            if run == TICK_RUN: n += 1
        else:
            run = 0
    return n


def pack(g):
    """비트 1개 = 1화소, k = y*G+x, 바이트 안은 LSB 먼저 — legoFromMask 와 같은 규칙."""
    flat = g.reshape(-1)
    out = bytearray((flat.size + 7)//8)
    for k, v in enumerate(flat):
        if v: out[k >> 3] |= 1 << (k & 7)
    return base64.b64encode(bytes(out)).decode()


def main():
    cs, _, cr = S.sticker_size(4, 4)          # 자음 카드 29.1 정사각
    vh, vw, vr = S.sticker_size(4, 2)         # 모음 카드 13.1 x 29.1 (세로로 세운 상태)
    cfont = HS.fit(HS.FONT, set(HS.CONSONANTS),
                   px((cs - 2*HS.PAD)*HS.FILL), px((cs - 2*HS.PAD)*HS.FILL))
    t = min(HS.ink(cfont, 'ㅣ')[2] - HS.ink(cfont, 'ㅣ')[0], px((vw - 2*HS.PAD)*0.38))

    glyphs = []

    def add(ch, mask, kind, bw, bh):
        g = grid_of(mask)
        assert g.sum() > 20, f'{ch} 잉크가 격자에서 사라졌다 ({g.sum()}칸)'
        glyphs.append(dict(ch=ch, kind=kind, bw=bw, bh=bh, n=int(g.sum()),
                           bar=round(probe_bar(g), 3), corner=round(probe_corner(g), 3),
                           ticks=probe_ticks(g, kind), bits=pack(g)))

    for ch in sorted(set(HS.CONSONANTS)):
        add(ch, render(ch, cs, cs, cr, cfont, CONS), 'sq', 4, 4)

    for base, table in VOWEL_ROTS.items():
        m0 = render(base, vw, vh, vr, None, VOWEL, left=True, t=t)   # 세로 카드 (2x4)
        for deg, ch in table.items():
            m = rot(m0, deg)
            port = m.shape[0] > m.shape[1]
            add(ch, m, 'port' if port else 'land', 2 if port else 4, 4 if port else 2)

    # 🔴 굽고 나서 바로 검산 — 종이와 형판이 갈라지는 건 여기서만 잡힌다
    by = {g['ch']: g for g in glyphs}
    assert by['ㅣ']['ticks'] == 0 and by['ㅏ']['ticks'] == 1 and by['ㅑ']['ticks'] == 2, \
        '모음 곁획 수가 0/1/2 가 아니다: ' + str({k: by[k]['ticks'] for k in 'ㅣㅏㅑ'})
    for a, b in (('ㅓ', 'ㅏ'), ('ㅕ', 'ㅑ'), ('ㅗ', 'ㅏ'), ('ㅠ', 'ㅑ'), ('ㅡ', 'ㅣ')):
        assert by[a]['ticks'] == by[b]['ticks'], f'{a} 곁획 수가 {b} 와 다르다 (회전 방향?)'
    assert by['ㅁ']['corner'] - by['ㅇ']['corner'] > 0.3, 'ㅁ/ㅇ 모서리가 안 갈린다'
    assert by['ㅌ']['bar'] - by['ㄹ']['bar'] > 0.3, 'ㄹ/ㅌ 위칸이 안 갈린다'
    assert by['ㄴ']['bar'] - by['ㄱ']['bar'] > 0.3, 'ㄱ/ㄴ 위칸이 안 갈린다'

    data = dict(grid=GRID, tick=dict(ink=TICK_INK, run=TICK_RUN),
                card=dict(cons=[round(cs, 2)]*2, vowel=[round(vw, 2), round(vh, 2)]),
                glyphs=glyphs)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f'  ✓ 글자 {len(glyphs)}개 · 격자 {GRID}x{GRID} · {os.path.getsize(OUT)/1024:.1f}KB → {os.path.relpath(OUT)}')
    for g in glyphs:
        print(f'    {g["ch"]} {g["kind"]:4} {g["bw"]}x{g["bh"]}  칸 {g["n"]:4}  '
              f'위칸 {g["bar"]:+.2f}  모서리 {g["corner"]:.2f}  곁획 {g["ticks"]}')


if __name__ == '__main__':
    main()
    # 🔴 cadquery(OCP) 를 import 한 프로세스는 이 컴퓨터에서 종료 코드 127 을 낸다(blocks.py 도 같다).
    #    산출물은 위에서 이미 다 썼으니, 빌드 사슬이 실패로 읽지 않게 여기서 끊는다.
    sys.stdout.flush(); os._exit(0)
