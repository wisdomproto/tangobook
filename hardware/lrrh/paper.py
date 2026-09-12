# -*- coding: utf-8 -*-
"""빨간모자 블록 **종이 시트** — A4 한 장에 길 5장 + 고정물 6장. 오려서 블록 윗면 홈에 붙인다.

실행:  python paper.py            → out/paper_sheet.html (자체 완결, 그림은 data URI)
       node paper_pdf.mjs         → out/paper_sheet.pdf  (A4, 크롬으로 인쇄)

치수는 blocks.py `paper_size()` 에서 읽는다 — 종이 = 턱 밑 통로보다 길이 0.3·폭 0.4 작게(밀어 넣는다).
  길 조각  88.3 × 39.2 mm     고정물  46.3 × 45.2 mm   (X 가 미는 방향, 열린 끝으로 넣는다)

길 다섯 장 = 스마트게임즈 원작과 같은 다섯 모양(해답 22·23 에서 읽음. 조각은 뒤집을 수 없으니
왼쪽/오른쪽 **손 방향까지** 원작 그대로). 칸 좌표 L(0~1)·R(1~2), y 는 위 0 → 아래 1:
  보라  L 아래변 ↔ R 끝        분홍  R 위변 ↔ L 아래변(S자)     흰색  L 위변 ↔ L 끝(한 칸만, R 은 빈 칸)
  파랑  L 끝 ↔ R 끝(직선)      노랑  L 위변 ↔ R 위변(U자)
꽃 색 = 원작의 힌트 표시(문제 카드가 꽃 자리로 조각 위치를 알려 준다).

그림은 R2 의 『빨간모자』(id 1778476961082) 삽화 — 소녀·늑대는 pixar-3d 그림체 4·5쪽, 나무는
paper-craft 14쪽 소나무, 집은 낱말 카드 cottage(문이 아래) 를 잘라 쓴다.
🔴 집은 **문이 굴뚝 쪽**을 보게 붙인다 — 원작 규칙(굴뚝이 문 방향 표시).
"""
import base64, io, json, math, os, urllib.parse, urllib.request
from PIL import Image
import blocks as B

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = B.OUT
CACHE = os.path.join(HERE, 'out', '_img')
BOOK = 'https://www.tangobook.co.kr/api/storybooks/1778476961082'

ROAD_W, ROAD_D = B.paper_size(B.CELL_STUDS * 2, B.CELL_STUDS, B.ROAD_TOP_INSET)   # X = 미는 방향
OBJ_W, OBJ_D = B.paper_size(B.CELL_STUDS, B.CELL_STUDS)

GREEN, ROAD, EDGE = '#8DC63F', '#A84E2C', '#7DA836'
STROKE = 0.34          # 길 폭 (칸 기준)

# (이름, 색, 길 path — 칸 좌표, 꽃 위치들)
PIECES = [
    ('purple', '#8E6BC4', 'M 0.5 1.15 L 0.5 0.75 C 0.5 0.45 0.75 0.5 1.05 0.5 C 1.4 0.5 1.6 0.5 2.15 0.5', [(0.22, 0.2), (1.75, 0.8)]),
    ('pink',   '#F48FB1', 'M 1.5 -0.15 L 1.5 0.3 C 1.5 0.62 0.5 0.38 0.5 0.7 L 0.5 1.15', [(0.2, 0.22), (1.8, 0.78)]),
    ('white',  '#FFFFFF', 'M 0.5 -0.15 L 0.5 0.28 C 0.5 0.5 0.3 0.5 -0.15 0.5', [(1.8, 0.78)]),
    ('blue',   '#4FC3F7', 'M -0.15 0.5 C 0.4 0.15 0.7 0.85 1.0 0.5 C 1.3 0.15 1.6 0.85 2.15 0.5', [(1.25, 0.18), (0.55, 0.82)]),
    ('yellow', '#FFD54F', 'M 0.5 -0.15 L 0.5 0.35 C 0.5 0.95 1.5 0.95 1.5 0.35 L 1.5 -0.15', [(1.8, 0.2), (0.2, 0.8)]),
]
KO = {'purple': '보라', 'pink': '분홍', 'white': '흰색', 'blue': '파랑', 'yellow': '노랑'}


def flower(x, y, color):
    petals = ''.join(f'<circle cx="{x + 0.06 * math.cos(a):.3f}" cy="{y + 0.06 * math.sin(a):.3f}" r="0.036" fill="{color}" stroke="#fff" stroke-width="0.01"/>'
                     for a in [i * math.pi / 3 for i in range(6)])
    return petals + f'<circle cx="{x}" cy="{y}" r="0.028" fill="#fff" stroke="{color}" stroke-width="0.01"/>'


def road_svg(name, color, path, flowers):
    return (f'<svg viewBox="0 0 2 1" width="{ROAD_W}mm" height="{ROAD_D}mm" preserveAspectRatio="none" style="display:block">'
            f'<rect width="2" height="1" fill="{GREEN}"/>'
            f'<line x1="1" y1="0" x2="1" y2="1" stroke="{EDGE}" stroke-width="0.012" stroke-dasharray="0.04 0.03"/>'
            f'<path d="{path}" fill="none" stroke="{ROAD}" stroke-width="{STROKE}" stroke-linecap="butt" stroke-linejoin="round"/>'
            + ''.join(flower(x, y, color) for x, y in flowers) + '</svg>')


def fetch(url):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, base64.urlsafe_b64encode(url.encode()).decode()[-40:] + '.webp')
    if not os.path.exists(p):
        u = urllib.parse.urlsplit(url)
        u = urllib.parse.urlunsplit((u.scheme, u.netloc, urllib.parse.quote(u.path), u.query, u.fragment))
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})   # 맨 urllib 은 403
        open(p, 'wb').write(urllib.request.urlopen(req, timeout=60).read())
    return Image.open(p).convert('RGBA')


def book():
    p = os.path.join(CACHE, 'book.json')
    os.makedirs(CACHE, exist_ok=True)
    if not os.path.exists(p):
        open(p, 'wb').write(urllib.request.urlopen(BOOK, timeout=60).read())
    d = json.load(open(p, encoding='utf-8'))
    return d.get('data', d)


def page_url(bk, style, n):
    pi = bk['styleAssets'][style]['pageIllustrations']
    v = pi[str(n)] if isinstance(pi, dict) else pi[n - 1]
    return v if isinstance(v, str) else (v.get('url') or v.get('illustrationUrl'))


def crop_sq(im, cx, cy, side):
    """비율 좌표(0~1)로 정사각 자르기."""
    W, H = im.size
    s = side * H
    x0, y0 = cx * W - s / 2, cy * H - s / 2
    return fit(im.crop((int(x0), int(y0), int(x0 + s), int(y0 + s))))


def fit(im):
    """고정물 종이 비율(OBJ_W:OBJ_D)로 가운데 자르기."""
    W, H = im.size
    r = OBJ_W / OBJ_D
    if W / H > r:
        nw = int(H * r); im = im.crop(((W - nw) // 2, 0, (W - nw) // 2 + nw, H))
    else:
        nh = int(W / r); im = im.crop((0, (H - nh) // 2, W, (H - nh) // 2 + nh))
    return im.resize((720, int(720 / r)), Image.LANCZOS)


def house_tile(im):
    """낱말 카드(흰 바탕) → 흰색을 빼고 판 초록 위에 얹는다. 문이 아래."""
    im = im.convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if r > 236 and g > 236 and b > 236:
                px[x, y] = (r, g, b, 0)
    im = im.crop(im.getbbox())                       # 카드 여백을 걷어내고 칸의 92% 로 키운다
    W, H = im.size
    s = int(max(W, H) / 0.92)
    bg = Image.new('RGBA', (s, s), GREEN)
    bg.alpha_composite(im, ((s - W) // 2, (s - H) // 2 + int(s * 0.03)))
    return fit(bg)


def data_uri(im):
    b = io.BytesIO(); im.convert('RGB').save(b, 'JPEG', quality=92)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


def tiles():
    bk = book()
    girl = crop_sq(fetch(page_url(bk, 'pixar-3d', 4)), 0.41, 0.53, 0.78)
    wolf = crop_sq(fetch(page_url(bk, 'pixar-3d', 5)), 0.68, 0.50, 0.84)
    tree = crop_sq(fetch(page_url(bk, 'paper-craft', 14)), 0.83, 0.25, 0.46)   # 소나무만(아래엔 늑대가 있다)
    cottage = next(k['imageUrl'] for k in bk['keyObjectImages'] if (k.get('objectName') or k.get('name')) == 'cottage')
    house = house_tile(fetch(cottage))
    return [('house', '집 — 문(아래)이 굴뚝 변', house), ('girl', '빨간모자', girl), ('wolf', '늑대', wolf),
            ('tree', '나무 ①', tree), ('tree2', '나무 ②', tree), ('tree3', '나무 (예비)', tree)]


def html():
    obj = tiles()
    css = f'''
    @page {{ size: A4; margin: 10mm; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; color: #333; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
    h1 {{ font-size: 11pt; margin: 0 0 1.5mm; }}
    .note {{ font-size: 7pt; color: #666; margin: 0 0 3mm; line-height: 1.4; }}
    .row {{ display: flex; gap: 6mm; margin-bottom: 4.5mm; align-items: flex-start; }}
    .cut {{ outline: 0.25mm solid #999; outline-offset: 0; position: relative; }}
    .cut::after {{ content: ""; position: absolute; inset: -2.2mm; border: 0.15mm dashed #bbb; pointer-events: none; }}
    .lab {{ font-size: 6.5pt; color: #777; margin-top: 3mm; }}
    .road {{ width: {ROAD_W}mm; height: {ROAD_D}mm; }}
    .obj {{ width: {OBJ_W}mm; height: {OBJ_D}mm; overflow: hidden; }}
    .obj img {{ width: 100%; height: 100%; display: block; }}
    .legend {{ width: {ROAD_W}mm; font-size: 6.5pt; color: #555; line-height: 1.45; }}
    .legend b {{ color: #333; }}
    '''
    legend = (f'<div class="legend"><b>끼우는 법</b><br>실선 안쪽으로 오린다(길 {ROAD_W:.1f}×{ROAD_D:.1f} · '
              f'고정물 {OBJ_W:.1f}×{OBJ_D:.1f}mm — 블록 턱 밑 통로보다 살짝 작다). 점선은 여유 안내선.<br>'
              f'무광 종이(120~160g)에 <b>실제 크기(100%)</b>로 인쇄. 풀 없이 블록의 <b>열린 끝</b>으로 밀어 넣으면 양옆 턱 밑에 잡힌다.<br>'
              f'길 조각은 <b>뒤집지 않는다</b> — 그림이 위인 채로만 돌린다(원작과 같은 다섯 모양).<br>'
              f'집은 <b>문이 굴뚝 변</b>을 보게 넣는다(굴뚝 밑으로 종이가 지나간다).</div>')
    body = (f'<h1>빨간모자 블록 — 종이 시트 (24×24 판 · 4×4 · 한 칸 48mm)</h1>'
            f'<div class="note">R2 『빨간모자』 삽화(pixar-3d · paper-craft · 낱말 카드) · 길 다섯 장은 스마트게임즈 원작 모양 그대로</div>'
            f'<div class="row">{"".join(_chunk(roads_list(), 0, 2))}</div>'
            f'<div class="row">{"".join(_chunk(roads_list(), 2, 4))}</div>'
            f'<div class="row">{"".join(_chunk(roads_list(), 4, 5))}{legend}</div>'
            f'<div class="row">{"".join(_chunk(objs_list(obj), 0, 3))}</div>'
            f'<div class="row">{"".join(_chunk(objs_list(obj), 3, 6))}</div>')
    return f'<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>빨간모자 블록 종이 시트</title><style>{css}</style></head><body>{body}</body></html>'


def roads_list():
    return [f'<div><div class="cut road">{road_svg(n, c, p, f)}</div><div class="lab">길 {i + 1} · {KO[n]} 꽃</div></div>'
            for i, (n, c, p, f) in enumerate(PIECES)]


def objs_list(obj):
    return [f'<div><div class="cut obj"><img src="{data_uri(im)}"></div><div class="lab">{lab}</div></div>' for _, lab, im in obj]


def _chunk(lst, a, b):
    return lst[a:b]


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, 'paper_sheet.html')
    open(p, 'w', encoding='utf-8').write(html())
    print('종이 시트 →', p, f'(길 {ROAD_W:.1f}×{ROAD_D:.1f} · 고정물 {OBJ_W:.1f}mm)')
