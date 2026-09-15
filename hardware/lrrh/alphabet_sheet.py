# -*- coding: utf-8 -*-
"""알파벳 스티커 A4 — 4×6 스티커 블록 윗면에 오려 붙인다.

실행:  python alphabet_sheet.py   → out/alphabet_a4.pdf (100% 로 인쇄) · out/alphabet_a4.png

  · 카드 크기는 sticker_block.sticker_size() 에서 받는다(45.1×29.1 R2.75) — 블록을 고치면 여기도 따라온다.
  · 카드마다 테두리 = 오리는 선. 테두리 바깥 끝이 곧 스티커 크기다.
  · 색은 탱고 보드와 같게: 모음 #59B89E · 자음 #F09E5C.
  · 🔴 인쇄는 PDF 를 「실제 크기(100%)」로 — 「페이지에 맞춤」이면 카드가 줄어 턱 안에서 헐렁해진다.
"""
import os
from PIL import Image, ImageDraw, ImageFont
import sticker_block as S
import blocks as B

DPI = 300
A4 = (210.0, 297.0)
COLS, ROWS = 4, 7              # 28칸 — A~Z 26장 + 여분 2장(가장 많이 쓰는 A·E)
GAP = (4.0, 6.0)               # 카드 사이 (가로, 세로) mm — 가위가 들어갈 틈
BORDER = 1.2                   # 테두리 두께 mm (오리는 선)
VOWEL, CONS, INK = (0x59, 0xB8, 0x9E), (0xF0, 0x9E, 0x5C), (0x2B, 0x2B, 0x2B)
FONT = 'C:/Windows/Fonts/ARLRDBD.TTF'   # Arial Rounded MT Bold — 아이 교재에 흔한 둥근 글꼴


def px(mm):
    return round(mm / 25.4 * DPI)


def main():
    cw, ch, cr = S.sticker_size()
    letters = [chr(c) for c in range(ord('A'), ord('Z') + 1)] + ['A', 'E']
    gw = COLS * cw + (COLS - 1) * GAP[0]
    gh = ROWS * ch + (ROWS - 1) * GAP[1]
    mx, my = (A4[0] - gw) / 2, (A4[1] - gh) / 2
    assert mx >= 8 and my >= 8, f'여백 {mx:.1f}×{my:.1f}mm — 프린터가 못 찍는 가장자리에 걸린다'

    img = Image.new('RGB', (px(A4[0]), px(A4[1])), 'white')
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, px(ch * 0.62))
    for i, ch_ in enumerate(letters):
        r, c = divmod(i, COLS)
        x0, y0 = mx + c * (cw + GAP[0]), my + r * (ch + GAP[1])
        box = (px(x0), px(y0), px(x0 + cw) - 1, px(y0 + ch) - 1)
        col = VOWEL if ch_ in 'AEIOU' else CONS
        d.rounded_rectangle(box, radius=px(cr), fill='white', outline=col, width=px(BORDER))
        d.text(((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), f'{ch_}{ch_.lower()}',
               font=font, fill=INK, anchor='mm')

    os.makedirs(B.OUT, exist_ok=True)
    png, pdf = os.path.join(B.OUT, 'alphabet_a4.png'), os.path.join(B.OUT, 'alphabet_a4.pdf')
    img.save(png, dpi=(DPI, DPI))
    img.save(pdf, resolution=DPI)
    pt = img.width / DPI * 72, img.height / DPI * 72
    assert abs(pt[0] - 595.3) < 1 and abs(pt[1] - 841.9) < 1, f'PDF 쪽 크기 {pt}'
    print(f'  ✓ 카드 {cw:.1f}×{ch:.1f} R{cr:.2f} × {len(letters)}장  여백 {mx:.1f}×{my:.1f}mm  → {pdf}')


if __name__ == '__main__':
    main()
