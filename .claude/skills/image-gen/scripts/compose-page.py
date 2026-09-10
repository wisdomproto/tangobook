# -*- coding: utf-8 -*-
"""칸 모양을 바꾼 판 — 직사각형만이 아니다.

🔴 모델은 언제나 직사각형을 내놓는다. 지면에서 «어떤 모양으로 자를지»는 마스크가 정하므로
   생성 비용은 그대로다. 여기서 쓰는 네 가지:
     ① 재단 물림(full bleed)  — 지면 밖으로 흘려 넓이를 준다
     ② 비스듬한 분할          — 두 칸을 대각선으로 갈라 긴장을 준다
     ③ 원형 인서트            — 큰 칸 위에 작은 원을 얹는다
     ④ 풍선이 테두리를 넘는다  — 칸 밖으로 걸치면 소리가 칸을 벗어난 느낌이 난다
"""
import os
from PIL import Image, ImageDraw, ImageFont

S = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(S, 'samgukji-comic-page-v2.png')

W, H = 1448, 2048
INK = (42, 39, 35)
PAPER = (251, 247, 238)
BW = 5

FONT = 'C:/Windows/Fonts/malgun.ttf'
FONTB = 'C:/Windows/Fonts/malgunbd.ttf'


def cover(im, w, h, top_bias=0.35):
    r = max(w / im.width, h / im.height)
    nw, nh = int(im.width * r + 0.5), int(im.height * r + 0.5)
    im = im.resize((nw, nh), Image.LANCZOS)
    left = (nw - w) // 2
    top = int((nh - h) * top_bias)
    return im.crop((left, top, left + w, top + h))


def put_poly(page, d, path, pts, outline=True, top_bias=0.35):
    """다각형 칸. pts 의 바운딩 박스로 그림을 맞춘 뒤 그 모양으로 오린다."""
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
    w, h = x1 - x0, y1 - y0
    im = cover(Image.open(os.path.join(S, path)).convert('RGB'), w, h, top_bias)
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).polygon([(p[0] - x0, p[1] - y0) for p in pts], fill=255)
    page.paste(im, (x0, y0), mask)
    if outline:
        d.polygon(pts, outline=INK, width=BW)


def put_circle(page, d, path, cx, cy, r, top_bias=0.30):
    im = cover(Image.open(os.path.join(S, path)).convert('RGB'), r * 2, r * 2, top_bias)
    mask = Image.new('L', (r * 2, r * 2), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, r * 2 - 1, r * 2 - 1), fill=255)
    page.paste(im, (cx - r, cy - r), mask)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=INK, width=BW + 2)


def balloon(d, cx, cy, text, font, tail, pad=22, radius=26):
    lines = text.split('\n')
    lh = font.size + 10
    bw = int(max(d.textlength(l, font=font) for l in lines)) + pad * 2
    bh = lh * len(lines) + pad * 2 - 10
    x0, y0 = int(cx - bw / 2), int(cy - bh / 2)
    ax, ay = tail
    d.polygon([(cx - 26, y0 + bh - 6), (cx + 26, y0 + bh - 6), (ax, ay)], fill='white', outline=INK, width=4)
    d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), radius=radius, fill='white', outline=INK, width=4)
    d.line([(cx - 24, y0 + bh - 3), (cx + 24, y0 + bh - 3)], fill='white', width=8)
    for i, l in enumerate(lines):
        tw = d.textlength(l, font=font)
        d.text((cx - tw / 2, y0 + pad + i * lh - 4), l, font=font, fill=INK)


page = Image.new('RGB', (W, H), PAPER)
d = ImageDraw.Draw(page)

# ① P1 — 재단 물림. 위·좌·우가 지면 밖으로 나가고 아래만 테두리를 남긴다.
put_poly(page, d, 'P1.png', [(0, 0), (W, 0), (W, 540), (0, 540)], outline=False, top_bias=0.30)
d.line([(0, 540), (W, 540)], fill=INK, width=BW)

# ② P2 / P3 — 비스듬한 분할. 홈통이 대각선으로 지난다.
put_poly(page, d, 'P2.png', [(40, 574), (784, 574), (700, 924), (40, 924)], top_bias=0.28)
put_poly(page, d, 'P3.png', [(824, 574), (1408, 574), (1408, 924), (740, 924)], top_bias=0.28)

# ③ P4 — 평범한 직사각형(기준을 하나 둔다)
put_poly(page, d, 'P4.png', [(40, 952), (1408, 952), (1408, 1422), (40, 1422)], top_bias=0.30)

# ④ P5 — 아래로 재단 물림 + 원형 인서트
put_poly(page, d, 'P5.png', [(0, 1450), (W, 1450), (W, H), (0, H)], outline=False, top_bias=0.34)
d.line([(0, 1450), (W, 1450)], fill=INK, width=BW)
put_circle(page, d, 'P4.png', 268, 1742, 168, top_bias=0.10)

f = ImageFont.truetype(FONT, 30)
fb = ImageFont.truetype(FONTB, 33)

balloon(d, 258, 672, '물러설 수 없소!', fb, tail=(352, 800))
balloon(d, 470, 1066, '두 분 다\n잠깐 멈추시지요.', f, tail=(650, 1214))
balloon(d, 1058, 1560, '내 이름은 관우요.', f, tail=(900, 1668))   # 테두리를 넘는다

page.save(OUT)
print('저장:', OUT, page.size)
