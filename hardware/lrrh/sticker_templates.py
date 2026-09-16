# -*- coding: utf-8 -*-
"""스티커 카드 형판 굽기 — 종이에 찍히는 그림 그대로를 인식기 형판으로.

실행:  python sticker_templates.py   → packages/client/public/tango-sticker-<집합>.json

2026-09-16: 스티커 블록(4x4·2x4 한글 · 4x6 알파벳)이 생겼다. 기존 `tango-lego.pieces.json` 은
  **플라스틱 획 조각의 칸 발자국**이라 인쇄 글꼴과 모양이 다르다 — 그걸 쓰면 안 된다.

🔴 이 파일은 그림을 다시 그리지 않는다. 시트의 `card()` 를 **그대로 불러서** 카드 한 장을 찍고
   잉크만 뽑는다. 시트를 고치면(PAD·FILL·글꼴·획 굵기·밑줄) 형판이 자동으로 따라온다 —
   종이와 형판이 갈라지면 인식이 조용히 나빠지는데 그건 아무 데도 안 찍힌다.

🔴 정규화 기준은 **잉크 bbox 가 아니라 카드**다. 잉크 bbox 로 40x40 을 채우면 ㅣ(2.75x20mm 막대)가
   **까만 정사각형**이 되어 ㅂ·ㅌ·ㄹ·ㅁ 과 0.72~0.75 로 붙는다(실측).

🔴 표본법은 `matchSticker` 와 **같은 최근접 규칙**이어야 한다(관찰과 형판을 다른 자로 재면
   겹침이 편향된다). 그래서 격자 크기를 JSON 에 같이 적는다.

🔴 **집합은 데이터다.** 한글·알파벳·(나중에)숫자를 한 통에 넣고 최고점으로 고르면 안 된다 —
   `o`/`ㅇ` · `i`/`ㅣ` 는 같은 그림이고, `0`/`o`/`ㅇ` · `1`/`l`/`i`/`ㅣ` · `2`/`z` · `5`/`s` 도 그렇다.
   어느 집합을 쓸지는 **화면(활동)이 링크로 정한다**. 여기서는 집합마다 파일 하나를 굽고,
   판정 코드는 집합을 몰라도 되게 카드 갈래(`kinds`)와 동점 탐침(`tie`)까지 데이터로 실어 보낸다.
   → 숫자를 붙일 때 할 일 = **인쇄 시트를 먼저 만들고**, 여기 `SETS` 에 한 줄 더하는 것뿐.
"""
import base64, json, os, sys
import numpy as np
from PIL import Image, ImageDraw

import sticker_block as S
import hangul_sheet as HS
import alphabet_sheet as AS
from alphabet_sheet import px, CONS, VOWEL

GRID = 40            # matchSticker 의 격자와 같아야 한다
# 곁획 한 줄로 치는 기준 — 🔴 **잡티를 안 세려고** 둘 다 필요하다. 진짜 곁획은 굵기 2.75mm =
# 카드 긴 변의 9.5% = 격자 약 4칸이라 넉넉히 통과하고, JPEG 잡티는 1칸짜리라 떨어진다.
# 실측: 이 관문이 없을 때 진짜 ㅗ 카드가 **곁획 4개**로 세어져 통째로 버려졌다(겹침은 ㅗ 0.81 로 맞았는데).
# 🔴 값은 JSON 으로 나가고 페이지가 읽는다 — 양쪽에 따로 적으면 조용히 갈라진다.
TICK_INK = 2         # 그 줄의 기둥 반대쪽 절반에 잉크가 이만큼(격자칸)은 있어야 「곁획 줄」
TICK_RUN = 2         # 그런 줄이 이만큼 이어져야 곁획 하나

PUB = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'packages', 'client', 'public')

# 모음 회전 -> 글자. 🔴 **네 회전을 다 굽는다.** 획 조각(tango-lego.pieces.json)의 ㅡㅣ 는 1x5 막대라
# 0도와 180도가 같은 그림이어서 두 개면 됐지만, **카드는 대칭이 아니다** — 세로획이 왼쪽에 붙어 있어서
# 0도(왼쪽 기둥)와 180도(오른쪽 기둥)가 다른 그림이고, 둘 다 ㅣ 다.
# 실측: 아래쪽에 막대가 있는 ㅡ 카드가 형판에 없어 IoU 0.00 으로 통째로 버려졌다.
VOWEL_ROTS = {
    'ㅣ': {0: 'ㅣ', 90: 'ㅡ', 180: 'ㅣ', 270: 'ㅡ'},
    'ㅏ': {0: 'ㅏ', 90: 'ㅜ', 180: 'ㅓ', 270: 'ㅗ'},
    'ㅑ': {0: 'ㅑ', 90: 'ㅠ', 180: 'ㅕ', 270: 'ㅛ'},
}


def ink_of(img):
    """찍은 카드에서 **검은 잉크**만. 색 테두리·색 밑줄은 잉크가 아니다
    (주황 R240 · 민트 G184 라 세 채널 모두 120 미만인 검정과 안 겹친다)."""
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
    """matchSticker 와 같은 최근접 표본 — 카드 전체를 GRID x GRID 로."""
    h, w = mask.shape
    return np.array([[mask[int((y+0.5)*h/GRID), int((x+0.5)*w/GRID)]
                      for x in range(GRID)] for y in range(GRID)], dtype=bool)


# ── 탐침 셋. 🔴 요약 지표를 더 손보는 게 아니라 **도면에서 다른 자리 하나만** 재는 것이다.
def probe_bar(g):
    """위칸 왼쪽−오른쪽 채움. ⚠ 한글 ㄹ/ㅌ 에서는 **실물에 안 들었다**(렌더 0.47 vs 카메라 0.12) —
    지금은 진단으로만 싣는다. 되살리려면 카메라 프레임에서 먼저 재라."""
    ys, xs = np.where(g)
    if not len(ys): return 0.0
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    band = g[y0:y0+max(1, int((y1-y0+1)*0.38)), x0:x1+1]
    col = band[int(band.shape[0]*0.4):, :]
    if not col.size: return 0.0
    half = col.shape[1]//2
    return float(col[:, :half].mean() - col[:, half:].mean())


def probe_corner(g):
    """잉크 bbox 네 모서리(각 25%) 채움의 최솟값. 실측: ㅁ 1.00 · ㅇ 0.33 (카메라 0.72 / 0.33)."""
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


def probe_ticks(g, k):
    """기둥 반대쪽 절반의 곁획 덩어리 수. 실측: ㅣ 0 · ㅏ 1 · ㅑ 2 (겹침 없음).
    🔴 어느 쪽이 기둥인지 **세어서** 정한다 — ㅓ 는 기둥이 오른쪽이다. 「왼쪽 정렬」을
       코드에 못 박으면 180도 돌린 카드를 통째로 놓친다.
    🔴 세로/가로는 **갈래 기록(k)**이 준다 — 격자는 늘 정사각이라 g.shape 로는 못 안다."""
    if not k.get('tick'): return -1
    G = g.shape[0]
    port = k['bh'] > k['bw']
    a, b = (g[:, :G//2], g[:, G//2:]) if port else (g[:G//2, :], g[G//2:, :])
    far = b if a.mean() >= b.mean() else a
    cnt = far.sum(axis=1) if port else far.sum(axis=0)
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


def glyph_rec(ch, mask, kind, kinds):
    g = grid_of(mask)
    assert g.sum() > 20, f'{ch} 잉크가 격자에서 사라졌다 ({g.sum()}칸)'
    return dict(ch=ch, kind=kind, n=int(g.sum()),
                bar=round(probe_bar(g), 3), corner=round(probe_corner(g), 3),
                ticks=probe_ticks(g, kinds[kind]), bits=pack(g))


# ══════════════════════════════════════════════════════════════════ 집합


def build_ko():
    """한글 자모 — 자음 4x4 · 모음 2x4(네 회전)."""
    cs, _, cr = S.sticker_size(4, 4)          # 자음 카드 29.1 정사각
    vh, vw, vr = S.sticker_size(4, 2)         # 모음 카드 13.1 x 29.1 (세로로 세운 상태)
    cfont = HS.fit(HS.FONT, set(HS.CONSONANTS),
                   px((cs - 2*HS.PAD)*HS.FILL), px((cs - 2*HS.PAD)*HS.FILL))
    t = min(HS.ink(cfont, 'ㅣ')[2] - HS.ink(cfont, 'ㅣ')[0], px((vw - 2*HS.PAD)*0.38))
    studs = round(cs / 8.0, 4)                # 스티커 **긴 변** ÷ 피치. 발자국(31.6)이 아니다
    # shift 0 = 밀어 보지 않는다. 한글 글자는 카드를 크게 채워(잉크 17.2mm / 카드 29.1mm)
    # 손으로 오린 오차가 상대적으로 작고, 실측 39/39 가 이미 밀지 않고 나왔다.
    # inkA 0 = 잉크 중성 관문 **끔**. 한글 시트에는 색 밑줄이 없고 글자가 카드를 크게 채워
    # 카드 안 Otsu 가 색 테두리에 안 흔들린다. 🔴 켜 두면 **화이트밸런스가 틀어진 프레임에서
    # 한글 잉크가 통째로 잘린다**(실측 2026-09-16 14:37: 그 프레임은 잉크 |a-128| 8~10 ·
    # **종이마저 3~6** 이라 절대 문턱 6 이 잉크를 지웠다 → 점수 0.01~0.31).
    kinds = {
        'sq':   dict(bw=4, bh=4, ar=[0.72, 1.55], studs=studs, tick=False, shift=0, inkA=0, inkB=0),
        'port': dict(bw=2, bh=4, ar=[0.30, 0.72], studs=studs, tick=True,  shift=0, inkA=0, inkB=0),
        'land': dict(bw=4, bh=2, ar=[1.55, 3.40], studs=studs, tick=True,  shift=0, inkA=0, inkB=0),
    }

    def render(glyph, cw, ch2, cr2, font, col, left=False, t2=0):
        img = Image.new('RGB', (px(cw), px(ch2)), 'white')
        HS.card(ImageDraw.Draw(img), 0, 0, cw, ch2, cr2, glyph, font, col, left=left, t=t2)
        return ink_of(img)

    glyphs = []
    for ch in sorted(set(HS.CONSONANTS)):
        glyphs.append(glyph_rec(ch, render(ch, cs, cs, cr, cfont, CONS), 'sq', kinds))
    for base, table in VOWEL_ROTS.items():
        m0 = render(base, vw, vh, vr, None, VOWEL, left=True, t2=t)   # 세로 카드 (2x4)
        for deg, ch in table.items():
            m = rot(m0, deg)
            kind = 'port' if m.shape[0] > m.shape[1] else 'land'
            glyphs.append(glyph_rec(ch, m, kind, kinds))

    # 🔴 굽고 나서 바로 검산 — 종이와 형판이 갈라지는 건 여기서만 잡힌다
    by = {g['ch']: g for g in glyphs}
    assert by['ㅣ']['ticks'] == 0 and by['ㅏ']['ticks'] == 1 and by['ㅑ']['ticks'] == 2, \
        '모음 곁획 수가 0/1/2 가 아니다: ' + str({k: by[k]['ticks'] for k in 'ㅣㅏㅑ'})
    for a, b in (('ㅓ', 'ㅏ'), ('ㅕ', 'ㅑ'), ('ㅗ', 'ㅏ'), ('ㅠ', 'ㅑ'), ('ㅡ', 'ㅣ')):
        assert by[a]['ticks'] == by[b]['ticks'], f'{a} 곁획 수가 {b} 와 다르다 (회전 방향?)'
    assert by['ㅁ']['corner'] - by['ㅇ']['corner'] > 0.3, 'ㅁ/ㅇ 모서리가 안 갈린다'
    # 동점 탐침: **카메라로 재 본 짝만** 넣는다(ㄹ/ㅌ 위칸은 실물에서 안 들어 뺐다)
    tie = [dict(probe='corner', chars=['ㅁ', 'ㅇ'])]
    return dict(card=dict(cons=[round(cs, 2)]*2, vowel=[round(vw, 2), round(vh, 2)]),
                kinds=kinds, tie=tie, glyphs=glyphs)


def build_en():
    """알파벳 소문자 — 4x6 카드 한 갈래.

    🔴 **회전을 굽지 않는다.** `b/q` · `d/p` · `n/u` 가 180도로 서로 바뀌므로, 뒤집힌 카드를
       읽어 주면 틀린 글자를 자신 있게 내놓는다. 안 읽는 게 맞다(카드에 색 밑줄이 있어서
       아이는 어느 쪽이 위인지 안다).
    """
    ch2, cw, cr = AS.card_size()
    font = AS.card_font(cw)
    studs = round(ch2 / 8.0, 4)               # 긴 변 45.1mm ÷ 8 = 5.64돌기
    # 🔴 **세로로 밀어 본다(shift).** 소문자는 카드를 작게 쓴다 — x높이 잉크가 카드 높이의 27%
    #    (한글은 59%)라, 손으로 오린 가장자리 오차·원근·인쇄 세대 차이가 **상대적으로 훨씬 크게**
    #    먹는다. 실측(올라온 프레임, 카드 13장): 안 밀면 겹침 0.26~0.58 에 글자도 거의 다 틀리는데,
    #    **13장 중 11장이 dy −3 에서 최고**가 되고 그때 글자가 전부 맞는다(0.52~0.93).
    #    −3행 = 카드 높이의 7.5% = 3.4mm. 그 프레임의 카드는 밑줄 커밋(397e5730) **이전에 뽑은**
    #    인쇄물이라 글자가 지금 시트보다 그만큼 아래에 있다. 다시 뽑으면 dy≈0 이 되고,
    #    그때도 손으로 오린 오차는 남으므로 허용치는 그대로 둔다.
    # 🔴 inkA/inkB = 카드 안 잉크로 칠 **중성 한계**. 알파벳 시트만 글자 밑에 **색 밑줄**을 긋고,
    #    소문자는 잉크가 카드의 27% 뿐이라 그 색이 Otsu 를 셋으로 갈라 문턱을 망가뜨린다
    #    (실측 `i` 카드: 문턱 184 → 카드의 13.7% 가 잉크 → 글자 소실. 중성만 모으면 0.28 → 0.76).
    #    ⚠ **절대 문턱이라 화이트밸런스에 약하다** — 한글에서 그렇게 깨졌다(위 build_ko 주석).
    #      알파벳 프레임에 같은 색 치우침이 오면 여기도 같은 병이 난다. 그때는 값을 흔들지 말고
    #      **그 카드 자신의 종이 색을 기준으로** 재라(절대 128 이 아니라).
    kinds = {'alpha': dict(bw=4, bh=6, ar=[0.45, 0.95], studs=studs, tick=False, shift=4,
                           inkA=6, inkB=10)}

    glyphs = []
    for c in [chr(x) for x in range(ord('a'), ord('z') + 1)]:
        img = Image.new('RGB', (px(cw), px(ch2)), 'white')
        AS.card(ImageDraw.Draw(img), 0, 0, cw, ch2, cr, c, font)
        glyphs.append(glyph_rec(c, ink_of(img), 'alpha', kinds))

    # 동점 탐침은 아직 없다 — **카메라로 재 본 뒤에** 넣는다(ㄹ/ㅌ 에서 렌더만 보고 넣었다가 틀렸다)
    return dict(card=dict(alpha=[round(cw, 2), round(ch2, 2)]),
                kinds=kinds, tie=[], glyphs=glyphs)


SETS = [('ko', build_ko), ('en', build_en)]
# 🔜 숫자: `number_sheet.py` 를 먼저 만들고 여기에 ('num', build_num) 한 줄.
#    걸릴 게 뻔한 짝 = 0/o/ㅇ · 1/l/i/ㅣ · 6/9(회전) · 2/z · 5/s → **집합을 섞으면 안 되는 이유**다.


def main():
    for name, build in SETS:
        d = build()
        d['set'] = name
        d['grid'] = GRID
        d['tick'] = dict(ink=TICK_INK, run=TICK_RUN)
        out = os.path.join(PUB, f'tango-sticker-{name}.json')
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(d, f, ensure_ascii=False, separators=(',', ':'))
        print(f'  ✓ [{name}] 글자 {len(d["glyphs"])}개 · 갈래 {list(d["kinds"])} · '
              f'{os.path.getsize(out)/1024:.1f}KB → {os.path.basename(out)}')
        for g in d['glyphs']:
            k = d['kinds'][g['kind']]
            print(f'      {g["ch"]} {g["kind"]:5} {k["bw"]}x{k["bh"]}  칸 {g["n"]:4}  '
                  f'위칸 {g["bar"]:+.2f}  모서리 {g["corner"]:.2f}  곁획 {g["ticks"]}')


if __name__ == '__main__':
    main()
    # 🔴 cadquery(OCP) 를 import 한 프로세스는 이 컴퓨터에서 종료 코드 127 을 낸다(blocks.py 도 같다).
    #    산출물은 위에서 이미 다 썼으니, 빌드 사슬이 실패로 읽지 않게 여기서 끊는다.
    sys.stdout.flush(); os._exit(0)
