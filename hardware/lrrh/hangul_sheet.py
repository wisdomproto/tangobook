# -*- coding: utf-8 -*-
"""한글 자모 스티커 A4 — 자음은 4×4 블록, 모음은 2×4 블록(세로로 세워) 윗면에 오려 붙인다.

실행:  python hangul_sheet.py   → out/hangul_a4.pdf (100% 로 인쇄) · out/hangul_a4.png

2026-09-15 사용자: 「4 by 4 에는 자음(ㄱ~ㅎ), 2 x 4 에는 모음(ㅣ ㅏ ㅑ) · 모음은 왼쪽 정렬 ·
  자음은 ㄱ 3개 나머지 2개씩 · 모음은 각각 3개씩」.
  · 카드 크기는 sticker_block.sticker_size() 에서 받는다 — 블록을 고치면 여기도 따라온다.
  · 모음은 글꼴로 안 쓰고 **획을 직접 그린다** — 호환 자모(ㅣㅏㅑ)는 글꼴 안에서 반쪽 높이라 13.1mm 폭 카드에
    넣으면 콩알만 해졌다. 획 굵기는 자음 획(ㅣ 폭)에서 재되 카드 폭에 맞춰 줄인다.
  · 모음 왼쪽 정렬 = 세로획을 테두리 안쪽 왼쪽에 붙인다 → ㅣ·ㅏ·ㅑ 의 세로획이 블록마다 같은 자리에 선다.
  · 테두리 = 오리는 선 · 색은 탱고 보드(자음 #F09E5C · 모음 #59B89E) — alphabet_sheet 와 같은 값.
"""
import os
from PIL import Image, ImageDraw, ImageFont
import sticker_block as S
import blocks as B
from alphabet_sheet import DPI, A4, BORDER, VOWEL, CONS, INK, px

FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..',
                    'packages', 'server', 'scripts', 'assets', 'og-fonts', 'Pretendard-ExtraBold.otf')
CONSONANTS = ['ㄱ'] * 3 + [c for c in 'ㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ' for _ in range(2)]   # 29장
VOWELS = [v for v in 'ㅣㅏㅑ' for _ in range(3)]                                     # 9장
CONS_COLS = 6
GAP = 3.5                      # 카드 사이 mm
SECTION_GAP = 14.0             # 자음 묶음과 모음 묶음 사이 mm (제목 줄 포함)
PAD = BORDER + 1.8             # 테두리 안쪽에서 글자까지 최소 여백 mm
FILL = 0.85                    # 글자가 차지할 몫 (테두리 안쪽 기준)


def ink(font, ch):
    """글자를 실제로 찍어 잉크 상자를 잰다. 🔴 font.getbbox 는 이 글꼴에서 가로가 **글자 폭(advance)** 이라
    ㅣ 도 ㄱ 과 폭이 같게 나왔다(232px) — 획 굵기·가운데 맞춤을 그걸로 재면 틀린다."""
    size = font.size * 3
    im = Image.new('L', (size, size))
    ImageDraw.Draw(im).text((font.size, font.size), ch, font=font, fill=255)
    b = im.getbbox()
    return (b[0] - font.size, b[1] - font.size, b[2] - font.size, b[3] - font.size)


def fit(font_path, chars, w, h):
    """chars 중 가장 큰 잉크 상자가 w×h(px) 안에 들어가는 글꼴 — 같은 묶음은 같은 크기로 쓴다."""
    probe = ImageFont.truetype(font_path, 1000)
    bw = max(ink(probe, c)[2] - ink(probe, c)[0] for c in chars)
    bh = max(ink(probe, c)[3] - ink(probe, c)[1] for c in chars)
    return ImageFont.truetype(font_path, int(1000 * min(w / bw, h / bh)))


def vowel_strokes(glyph, box, t):
    """ㅣ·ㅏ·ㅑ 를 사각 획으로 — 세로획은 왼쪽 여백에 붙이고, 가로 곁획은 오른쪽 여백까지."""
    x0, x1 = box[0] + px(PAD), box[2] - px(PAD)
    y0, y1 = box[1] + px(PAD) + px(1.5), box[3] - px(PAD) - px(1.5)
    cy = (y0 + y1) / 2
    rects = [(x0, y0, x0 + t, y1)]
    ticks = {'ㅣ': [], 'ㅏ': [cy], 'ㅑ': [cy - t * 1.3, cy + t * 1.3]}[glyph]
    rects += [(x0 + t, y - t / 2, x1, y + t / 2) for y in ticks]
    return rects


def card(d, x0, y0, cw, ch, cr, glyph, font, col, left=False, t=0):
    box = (px(x0), px(y0), px(x0 + cw) - 1, px(y0 + ch) - 1)
    d.rounded_rectangle(box, radius=px(cr), fill='white', outline=col, width=px(BORDER))
    if left:
        rects = vowel_strokes(glyph, box, t)
        for r in rects:
            d.rectangle(r, fill=INK)
        inkb = (min(r[0] for r in rects), min(r[1] for r in rects), max(r[2] for r in rects), max(r[3] for r in rects))
    else:
        gb = ink(font, glyph)
        gx = (box[0] + box[2]) / 2 - (gb[0] + gb[2]) / 2
        gy = (box[1] + box[3]) / 2 - (gb[1] + gb[3]) / 2
        d.text((gx, gy), glyph, font=font, fill=INK)
        inkb = (gx + gb[0], gy + gb[1], gx + gb[2], gy + gb[3])
    pad = px(PAD) - 1
    assert inkb[0] >= box[0] + pad and inkb[2] <= box[2] - pad and inkb[1] >= box[1] + pad and inkb[3] <= box[3] - pad, \
        f'{glyph} 가 테두리에 닿는다'


def main():
    cs, _, cr = S.sticker_size(4, 4)                 # 자음 카드 29.1 정사각
    vh, vw, vr = S.sticker_size(4, 2)                # 모음 카드 — 세로로 세워 폭 13.1 · 높이 29.1
    cons_rows = -(-len(CONSONANTS) // CONS_COLS)
    gw = CONS_COLS * cs + (CONS_COLS - 1) * GAP
    gh = cons_rows * cs + (cons_rows - 1) * GAP + SECTION_GAP + vh
    mx, my = (A4[0] - gw) / 2, (A4[1] - gh) / 2
    vgw = len(VOWELS) * vw + (len(VOWELS) - 1) * GAP
    assert mx >= 8 and my >= 8 and vgw <= gw, f'여백 {mx:.1f}×{my:.1f}mm · 모음 줄 {vgw:.1f} > {gw:.1f}'

    img = Image.new('RGB', (px(A4[0]), px(A4[1])), 'white')
    d = ImageDraw.Draw(img)
    cfont = fit(FONT, set(CONSONANTS), px((cs - 2 * PAD) * FILL), px((cs - 2 * PAD) * FILL))
    # 획 굵기 = 자음 획(ㅣ 폭)과 같게, 단 모음 카드 안쪽 폭의 38% 까지 — 넘으면 곁획이 뭉툭한 점이 된다
    t = min(ink(cfont, 'ㅣ')[2] - ink(cfont, 'ㅣ')[0], px((vw - 2 * PAD) * 0.38))
    label = ImageFont.truetype(FONT, px(3.2))

    d.text((px(mx), px(my) - px(2)), f'자음 · 4×4 블록 ({cs:.1f}×{cs:.1f}mm)', font=label, fill=(150, 150, 150), anchor='ls')
    for i, g in enumerate(CONSONANTS):
        r, c = divmod(i, CONS_COLS)
        card(d, mx + c * (cs + GAP), my + r * (cs + GAP), cs, cs, cr, g, cfont, CONS)
    vy = my + cons_rows * cs + (cons_rows - 1) * GAP + SECTION_GAP
    d.text((px(mx), px(vy) - px(2)), f'모음 · 2×4 블록 세로 ({vw:.1f}×{vh:.1f}mm)', font=label, fill=(150, 150, 150), anchor='ls')
    for i, g in enumerate(VOWELS):
        card(d, mx + i * (vw + GAP), vy, vw, vh, vr, g, None, VOWEL, left=True, t=t)

    os.makedirs(B.OUT, exist_ok=True)
    png, pdf = os.path.join(B.OUT, 'hangul_a4.png'), os.path.join(B.OUT, 'hangul_a4.pdf')
    img.save(png, dpi=(DPI, DPI))
    img.save(pdf, resolution=DPI)
    print(f'  ✓ 자음 {len(CONSONANTS)}장 {cs:.1f}□ · 모음 {len(VOWELS)}장 {vw:.1f}×{vh:.1f}  여백 {mx:.1f}×{my:.1f}mm  → {pdf}')


if __name__ == '__main__':
    main()
