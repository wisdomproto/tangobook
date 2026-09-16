# -*- coding: utf-8 -*-
"""알파벳 소문자 스티커 A4 (세로 카드) — 4×6 스티커 블록 윗면에 오려 붙인다.

실행:  python alphabet_sheet.py   → out/alphabet_a4.pdf (100% 로 인쇄) · out/alphabet_a4.png

  · 카드 크기는 sticker_block.sticker_size() 에서 받는다(45.1×29.1 R2.75, 세로로 돌려 29.1×45.1) — 블록을 고치면 여기도 따라온다.
  · 카드마다 테두리 = 오리는 선. 테두리 바깥 끝이 곧 스티커 크기다.
  · 색은 탱고 보드와 같게: 모음 #59B89E · 자음 #F09E5C.
  · 🔴 인쇄는 PDF 를 「실제 크기(100%)」로 — 「페이지에 맞춤」이면 카드가 줄어 턱 안에서 헐렁해진다.
  · 글자 밑에 **밑줄**을 긋는다(2026-09-16 사용자) — 공책 밑줄처럼 어느 쪽이 위인지 보인다.
    b/q · d/p · n/u 는 180° 돌리면 서로 바뀌는데 카드 겉모양은 그걸 못 알려 준다. 인식기는 줄로
    방향을 바로잡고, 줄을 떼어낸 뒤 글자를 맞힌다.
  · 밑줄 색 = **모음 민트 · 자음 주황**(사용자). 테두리 색은 오려낼 때 잘려 나갔는데, 줄은 카드
    **안쪽**이라 안 잘린다 — 잃었던 갈래 단서가 돌아온다. 🔴 한글 시트에는 안 넣는다 — 모음 카드는
    **일부러 돌려 쓴다**(ㅏ→ㅗ·ㅓ·ㅜ).
"""
import os
from PIL import Image, ImageDraw, ImageFont
import sticker_block as S
import blocks as B

DPI = 300
A4 = (210.0, 297.0)
COLS, ROWS = 6, 5              # 30칸 — a~z 26장 + 여분 4장(자주 쓰는 모음 a·e·i·o)
GAP = (3.5, 6.0)               # 카드 사이 (가로, 세로) mm — 가위가 들어갈 틈
BORDER = 1.2                   # 테두리 두께 mm (오리는 선)
BASE_W, BASE_T, BASE_BOT = 0.66, 1.4, 3.6   # 밑줄: 카드 안쪽 폭의 몫 · 두께 mm · 카드 아래끝에서 띄움 mm
                                            # 🔴 자리는 **카드 기준 고정** — 글자 밑에 붙이면 g·j 처럼
                                            #    내려긋는 글자에서 줄이 내려가 카드마다 높이가 달라진다.
VOWEL, CONS, INK = (0x59, 0xB8, 0x9E), (0xF0, 0x9E, 0x5C), (0x2B, 0x2B, 0x2B)
FONT = 'C:/Windows/Fonts/ARLRDBD.TTF'   # Arial Rounded MT Bold — 아이 교재에 흔한 둥근 글꼴


def px(mm):
    return round(mm / 25.4 * DPI)


def card_size():
    """카드 치수 (높이, 폭, 모서리R) — 🔴 시트와 형판이 **같은 크기**를 써야 한다.
    세로로 붙인다(2026-09-15 「세로야」) — 폭 29.1 · 높이 45.1."""
    return S.sticker_size()


def card_font(cw):
    """카드 폭에서 글꼴 크기가 나온다. 🔴 시트와 형판이 **같은 크기**를 써야 한다."""
    return ImageFont.truetype(FONT, px(cw * 0.85))


def card(d, x0, y0, cw, ch, cr, letter, font):
    """카드 한 장 — 흰 바탕 · 모음 민트 / 자음 주황 테두리 · 검은 소문자 · 색 밑줄.

    🔴 `sticker_templates.py` 가 형판을 구울 때 **이 함수를 그대로 부른다.** 종이에 찍히는 그림과
       인식기 형판이 갈라지면 인식이 조용히 나빠지고 그건 아무 데도 안 찍힌다.
    """
    box = (px(x0), px(y0), px(x0 + cw) - 1, px(y0 + ch) - 1)
    col = VOWEL if letter in 'aeiou' else CONS
    d.rounded_rectangle(box, radius=px(cr), fill='white', outline=col, width=px(BORDER))
    by = box[3] - px(BASE_BOT)                      # 밑줄 윗변 (모든 카드 같은 자리)
    c_ = ((box[0] + box[2]) / 2, (box[1] + by - px(1.8)) / 2 + px(BORDER) / 2)   # 글자는 줄 위 칸의 가운데
    tb = d.textbbox(c_, letter, font=font, anchor='mm')
    inner = px(BORDER + 1.0)
    assert tb[0] >= box[0] + inner and tb[2] <= box[2] - inner and tb[1] >= box[1] + inner and tb[3] <= box[3] - inner, f'{letter} 가 테두리에 닿는다'
    d.text(c_, letter, font=font, fill=INK, anchor='mm')
    bw = (cw - 2 * BORDER) * BASE_W
    assert tb[3] <= by - px(1.2), f'{letter} 가 밑줄에 닿는다'
    assert by + px(BASE_T) <= box[3] - px(BORDER + 0.8), f'{letter} 밑줄이 테두리에 닿는다'
    d.rectangle((px(x0 + cw / 2) - px(bw / 2), by, px(x0 + cw / 2) + px(bw / 2), by + px(BASE_T)), fill=col)


def main():
    ch, cw, cr = card_size()
    letters = [chr(c) for c in range(ord('a'), ord('z') + 1)] + list('aeio')
    gw = COLS * cw + (COLS - 1) * GAP[0]
    gh = ROWS * ch + (ROWS - 1) * GAP[1]
    mx, my = (A4[0] - gw) / 2, (A4[1] - gh) / 2
    assert mx >= 8 and my >= 8, f'여백 {mx:.1f}×{my:.1f}mm — 프린터가 못 찍는 가장자리에 걸린다'

    img = Image.new('RGB', (px(A4[0]), px(A4[1])), 'white')
    d = ImageDraw.Draw(img)
    font = card_font(cw)
    for i, ch_ in enumerate(letters):
        r, c = divmod(i, COLS)
        card(d, mx + c * (cw + GAP[0]), my + r * (ch + GAP[1]), cw, ch, cr, ch_, font)

    os.makedirs(B.OUT, exist_ok=True)
    png, pdf = os.path.join(B.OUT, 'alphabet_a4.png'), os.path.join(B.OUT, 'alphabet_a4.pdf')
    img.save(png, dpi=(DPI, DPI))
    img.save(pdf, resolution=DPI)
    pt = img.width / DPI * 72, img.height / DPI * 72
    assert abs(pt[0] - 595.3) < 1 and abs(pt[1] - 841.9) < 1, f'PDF 쪽 크기 {pt}'
    print(f'  ✓ 카드 {cw:.1f}×{ch:.1f} R{cr:.2f} × {len(letters)}장  여백 {mx:.1f}×{my:.1f}mm  → {pdf}')


if __name__ == '__main__':
    main()
