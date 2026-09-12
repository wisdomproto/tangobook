# -*- coding: utf-8 -*-
"""빨간모자류 CONNECT 게임 블록 — 24×24 레고판에 꽂는 3D 프린팅 부품 (CadQuery 파라메트릭)

실행:  python blocks.py     → out/*.stl · out/*.step (검사 통과 시)
       python preview.py    → out/review.png (음영 미리보기 — 부품 넷 + 판 위 조립 장면)

────────────────────────────────────────────────────────────────────────
설계 원칙 (2026-09-10, 사용자 결정)
  · 보드 = 기존 24×24 돌기 초록 레고판. 원작(4×4)과 같이 **한 칸 = 6돌기 = 48mm**.
  · 조각 위에는 **인쇄한 종이를 끼운다** — 윗면에 종이 통로를 파고 양 긴 변에 얇은 턱(LIP_W×LIP_T)을 남겨
    한쪽 끝(−X)에서 밀어 넣으면 턱 밑에 잡힌다(2026-09-12 사용자: 「밀어 넣고 고정할 수 있게 턱」). 풀이 필요 없고
    종이만 갈아 끼우면 다른 게임이 된다. 그래서 길 조각은 **밑판 한 종류**로 끝난다(직선·곡선·S 는 종이 그림의 차이).
  · 판에 **꽂힌다** — 밑면에 돌기 자리마다 소켓(지름 STUD_HOLE_D, 깊이 STUD_HOLE_H).
    프린팅 부품이라 진짜 레고처럼 속을 비우고 튜브를 세우지 않는다. 소켓 마찰로 충분하고
    설계도 검사도 단순하다. 🔴 소켓 값은 지어내지 않는다 — 오나미 거치대에서 같은 판에
    실측한 4.5×2.6 을 그대로 쓴다(처음엔 레고 공식 4.8 을 믿고 5.0 으로 팠다 — 1mm 헐거울 뻔했다).
  · 옆 조각과 **딱 붙여 놓는 게 정상**이라 발자국을 사방 0.2mm 줄였다(48 → 47.6).
    안 줄이면 프린팅 오차로 마지막 조각이 안 들어간다.
  · 고정물(집·나무·빨간모자·늑대)은 **높게**(OBJ_H) — 카메라가 길 조각과 다른 물건으로 본다.
    집은 문 방향 표시로 굴뚝 한 덩이(원작과 같은 장치, 종이가 덮지 않는 자리).
  · 모서리는 둥글게(아이 손), 밑 테두리는 살짝 모따기(꽂을 때 안내).
  · 길 조각은 **2단** — 아래 치마는 발자국 그대로, 윗판은 사방 ROAD_TOP_INSET 안쪽(2026-09-10 사용자:
    「윗부분을 좀 작게, 놓고 빼기 쉽게」). 붙여 놓은 조각들 사이에 윗판 홈이 생겨 손톱이 들어간다.
  · 원점 마커는 **없다** — 4칸 × 6돌기 = 24돌기 = 판 전체라 놓을 자리가 없다. 격자는 인식기가 이미 찾는
    판 윤곽(초록 hull)을 넷으로 나눈 것이고, 어느 변이 위인지는 거치대(잠망경)가 정한다.

🔴 검사(review)를 통과 못 하면 내보내지 않는다 — 소켓이 윗면을 뚫었거나(종이 홈 밑 살이 얇음),
   소켓 수가 돌기 수와 다르거나, 발자국이 칸 격자를 넘으면 실패.
────────────────────────────────────────────────────────────────────────
"""

import os
import cadquery as cq

# ── 판 규격 — 🔴 우리 24×24 판은 진짜 레고가 아니다(hardware/studboard/legoplate.py: 돌기 지름 4.0 으로
#    줄여 뽑은 판, 공식 4.8 아님). 소켓 여유 0.5 는 오나미 거치대(hardware/stand/onami_lego.py)에서
#    실측 확인된 값 — 0.6 은 헐거웠다. 판을 바꾸면 이 넷을 같이 바꾼다.
PITCH       = 8.0      # 돌기 간격
STUD_D      = 4.0      # 돌기 지름 (우리 판. 레고 공식은 4.8)
STUD_H      = 1.8      # 돌기 높이
STUD_CLEAR  = 0.5      # 소켓 지름 여유 (거치대 실측)
STUD_HOLE_D = STUD_D + STUD_CLEAR   # 4.5
STUD_HOLE_H = 2.6      # 소켓 깊이 (돌기 1.8 + 머리 위 0.8 — 거치대와 같다)

# ── 우리 규격
CELL_STUDS  = 6                        # 한 칸 = 6돌기
CELL        = CELL_STUDS * PITCH       # 48mm
CLEAR       = 0.2                      # 발자국 사방 여유 → 옆 조각과 붙여도 안 낀다
ROAD_H      = 7.0                      # 길 조각 전체 높이
ROAD_SKIRT_H = STUD_HOLE_H + 1.2       # 길 조각 아래 치마(발자국 그대로, 소켓 + 바닥살 1.2) = 3.8
ROAD_TOP_INSET = 3.0                   # 길 조각 윗판을 사방 이만큼 들여 놓는다 → 붙여 놓아도 윗판 사이 6mm 홈
OBJ_H       = 16.0                     # 고정물 높이
PAPER_INSET = 1.0                      # 종이 통로 벽은 윗면 가장자리에서 이만큼 안쪽
LIP_W       = 1.5                      # 종이 잡는 턱 — 통로 위로 튀어나오는 폭 (양 긴 변)
LIP_T       = 0.8                      # 턱 두께 (FDM 4겹. 1.5mm 돌출은 서포트 없이 뽑힌다 — 처지면 LIP_W 1.2)
SLOT_H      = 0.8                      # 턱 밑 종이 통로 높이 (종이 0.15~0.25 + 미끄러질 여유)
CORNER_R    = 2.0                      # 수직 모서리 반경
BOTTOM_CH   = 0.6                      # 밑 테두리 모따기
CHIMNEY     = (10.0, 8.0, 6.0)         # 집 굴뚝 (가로·세로·높이) — 문 있는 변에 붙는다

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')


def footprint(nx, ny):
    """nx×ny 돌기 발자국의 바깥 치수(여유 뺀 것)."""
    return nx * PITCH - 2 * CLEAR, ny * PITCH - 2 * CLEAR


def sockets(body, nx, ny, w, d):
    """밑면에 nx×ny 소켓. 돌기 중심 = 발자국 중심 기준 격자."""
    pts = [((i - (nx - 1) / 2) * PITCH, (j - (ny - 1) / 2) * PITCH) for i in range(nx) for j in range(ny)]
    return (body.faces('<Z').workplane(origin=(0, 0, 0))
            .pushPoints(pts).hole(STUD_HOLE_D, STUD_HOLE_H))


def paper_slot(body, w, d, top_z):
    """윗면 종이 통로. 폭 = w − 2·PAPER_INSET(턱 밑), 위 트임 = 그보다 2·LIP_W 좁게. −X 끝은 열리고 +X 끝은 벽(멈춤)."""
    pw = w - 2 * PAPER_INSET
    x0, x1 = -w / 2 - 1.0, w / 2 - PAPER_INSET
    L = x1 - x0
    lower = cq.Workplane('XY').box(L, pw, SLOT_H, centered=(False, True, False)).translate((x0, 0, top_z - LIP_T - SLOT_H))
    upper = cq.Workplane('XY').box(L, pw - 2 * LIP_W, LIP_T, centered=(False, True, False)).translate((x0, 0, top_z - LIP_T))
    return body.cut(lower).cut(upper)


def paper_size(nx, ny, top_inset=0.0):
    """끼우는 종이 크기 (X 길이 = 미는 방향, Y 폭). 통로보다 길이 0.3·폭 0.4 작게."""
    w, d = footprint(nx, ny)
    w, d = w - 2 * top_inset, d - 2 * top_inset
    return (w - PAPER_INSET) - 0.3, (d - 2 * PAPER_INSET) - 0.4


def block(nx, ny, h, paper=True, top_inset=0.0, skirt_h=None):
    """top_inset > 0 이면 2단: 아래 치마(발자국·skirt_h) + 사방 top_inset 들인 윗판."""
    w, d = footprint(nx, ny)
    def slab(sw, sd, sh):
        return cq.Workplane('XY').box(sw, sd, sh, centered=(True, True, False)).edges('|Z').fillet(CORNER_R)
    if top_inset:
        tw, td = w - 2 * top_inset, d - 2 * top_inset
        b = (slab(w, d, skirt_h).faces('<Z').edges().chamfer(BOTTOM_CH)
             .union(slab(tw, td, h - skirt_h + 0.01).translate((0, 0, skirt_h - 0.01))))   # 겹쳐야 닫힌다
    else:
        tw, td = w, d
        b = slab(w, d, h).faces('<Z').edges().chamfer(BOTTOM_CH)
    b = sockets(b, nx, ny, w, d)
    if paper:
        b = paper_slot(b, tw, td, h)
    return b


def road():
    """길 조각 밑판 1×2칸 (6×12돌기), 2단. 5장 전부 이것 하나 — 그림은 종이."""
    return block(CELL_STUDS * 2, CELL_STUDS, ROAD_H, top_inset=ROAD_TOP_INSET, skirt_h=ROAD_SKIRT_H)


def obj():
    """고정물 1칸 (나무·빨간모자·늑대) — 높은 블록."""
    return block(CELL_STUDS, CELL_STUDS, OBJ_H)


def house():
    """집 = 고정물 + 굴뚝. 굴뚝이 붙은 변이 **문 있는 변**(원작의 굴뚝 규칙)."""
    b = obj()
    w, d = footprint(CELL_STUDS, CELL_STUDS)
    cw, cd, ch = CHIMNEY
    # +Y 변 = 문 방향. 바깥 변에 붙이고 **턱 밑면 높이(OBJ_H − LIP_T)에서** 세운다 — 그러면 +Y 턱과 겹쳐 합집합이
    # 닫히고(면 접촉만 있으면 STL 이 샌다 — 실측), 종이 통로엔 안 들어와 종이가 굴뚝 밑으로 지나간다.
    # 🔴 review() 의 종이 탐침이 이 침범을 잡는다.
    chimney = (cq.Workplane('XY').box(cw, cd, ch + LIP_T, centered=(True, True, False))
               .translate((0, d / 2 - cd / 2, OBJ_H - LIP_T)))
    return b.union(chimney)


def review(name, shape, nx, ny, h, top_inset=0.0):
    """치수·소켓·윗살·종이 통로 검사. 실패하면 예외. h = 블록 윗면 높이(굴뚝 제외)."""
    bb = shape.val().BoundingBox()
    w, d = footprint(nx, ny)
    assert abs(bb.xlen - w) < 0.05 and abs(bb.ylen - d) < 0.05, f'{name}: 발자국 {bb.xlen:.2f}×{bb.ylen:.2f} ≠ {w}×{d}'
    assert bb.zmin > -1e-6 and bb.zmax >= h - 1e-6, f'{name}: 높이 {bb.zmax:.2f} < {h}'
    # 소켓 수 = 밑면 원형 면 수
    cyl = [f for f in shape.faces().vals() if f.geomType() == 'CYLINDER' and abs(f.Center().z - STUD_HOLE_H / 2) < 0.5]
    assert len(cyl) == nx * ny, f'{name}: 소켓 {len(cyl)} ≠ {nx * ny}'
    # 윗살: 소켓 바닥(z=STUD_HOLE_H)과 종이 통로 바닥(h − LIP_T − SLOT_H) 사이가 1.2mm 이상
    skin = (h - LIP_T - SLOT_H) - STUD_HOLE_H
    assert skin >= 1.2, f'{name}: 윗살 {skin:.2f}mm < 1.2'
    # 종이 탐침: 종이 크기 0.3mm 판을 통로 한가운데에 놓았을 때 몸통과 겹치는 부피가 0 이어야 한다
    pl, pwid = paper_size(nx, ny, top_inset)
    tw = footprint(nx, ny)[0] - 2 * top_inset
    probe = (cq.Workplane('XY').box(pl, pwid, 0.3, centered=(False, True, False))
             .translate((tw / 2 - PAPER_INSET - pl, 0, h - LIP_T - SLOT_H + 0.25)))
    hit = shape.val().intersect(probe.val()).Volume()
    assert hit < 1e-3, f'{name}: 종이 통로가 막혔다 (겹침 {hit:.2f}mm³)'
    vol = shape.val().Volume()
    print(f'  ✓ {name:14s} {bb.xlen:6.1f}×{bb.ylen:6.1f}×{bb.zlen:5.1f}mm  소켓 {len(cyl):3d}  종이 {pl:.1f}×{pwid:.1f}  부피 {vol/1000:6.1f}cm³')


def baseplate_preview():
    """미리보기용 24×24 판 — 돌기 대신 4×4 칸 경계 홈만(돌기 576개는 SVG 은선 제거에서 죽는다). 내보내지 않는다."""
    size = 24 * PITCH
    plate = cq.Workplane('XY').box(size, size, 3.2, centered=(True, True, False))
    for k in range(1, 4):
        c = -size / 2 + k * CELL
        plate = plate.cut(cq.Workplane('XY').box(0.6, size, 0.3, centered=(True, True, False)).translate((c, 0, 2.9)))
        plate = plate.cut(cq.Workplane('XY').box(size, 0.6, 0.3, centered=(True, True, False)).translate((0, c, 2.9)))
    return plate


def cell_xy(cx, cy):
    """4×4 칸 좌표 → 판 중심 기준 mm (칸 중심). (0,0) = 왼쪽 위."""
    n = 24 * PITCH
    return (-n / 2 + (cx + 0.5) * CELL, n / 2 - (cy + 0.5) * CELL)


# 역할 색 (기획서 v1.2 색 규약) — 미리보기와 인쇄 종이 색이 같은 값을 본다
COLORS = {'plate': (0.30, 0.62, 0.30), 'road': (0.95, 0.55, 0.15), 'house': (0.85, 0.20, 0.18),
          'tree': (0.45, 0.30, 0.16), 'girl': (0.95, 0.45, 0.65), 'wolf': (0.25, 0.40, 0.80)}


def scene_parts():
    """STARTER 풍 배치 하나 — [(이름, 형상, 색키)]. 문제는 우리 것(원작 복제 아님)."""
    # 소켓(2.2)이 돌기(1.7)를 삼키므로 블록 밑면은 판 윗면(z=3.2)에 닿는다.
    def put(shape, cx, cy, rot=0, dx=0, dy=0):
        x, y = cell_xy(cx, cy)
        return shape.rotate((0, 0, 0), (0, 0, 1), rot).translate((x + dx, y + dy, 3.2))
    # 길 조각(1×2)은 두 칸 중심 사이 — 가로 dx=+CELL/2 → (cx,cx+1), 세로 dy=+CELL/2 → (cy,cy-1)
    return [('plate', baseplate_preview(), 'plate'),
            ('house', put(house(), 3, 0, rot=180), 'house'),          # 굴뚝(문)이 아래(3,1)를 본다
            ('tree1', put(obj(), 1, 1), 'tree'), ('tree2', put(obj(), 2, 2), 'tree'),
            ('girl', put(obj(), 0, 3), 'girl'), ('wolf', put(obj(), 0, 0), 'wolf'),
            ('road1', put(road(), 1, 3, rot=0, dx=CELL / 2), 'road'),   # (1,3)-(2,3)
            ('road2', put(road(), 3, 3, rot=90, dy=CELL / 2), 'road'),  # (3,3)-(3,2)
            ('road3', put(road(), 2, 1, rot=0, dx=CELL / 2), 'road')]   # (2,1)-(3,1) → 집 문 앞


ITEMS = [('road_1x2', road, CELL_STUDS * 2, CELL_STUDS, ROAD_H, ROAD_TOP_INSET),
         ('object_1x1', obj, CELL_STUDS, CELL_STUDS, OBJ_H, 0.0),
         ('house_1x1', house, CELL_STUDS, CELL_STUDS, OBJ_H, 0.0)]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    built = [(name, fn(), nx, ny, h, ti) for name, fn, nx, ny, h, ti in ITEMS]
    print('검사')
    for name, shape, nx, ny, h, ti in built:
        review(name, shape, nx, ny, h, ti)
    import trimesh   # 🔴 내보낸 STL 이 닫힌 메시인지까지 검사 — 굴뚝 면 접촉 union 이 여기서 잡혔다
    for name, shape, *_ in built:
        stl = os.path.join(OUT, name + '.stl')
        cq.exporters.export(shape, stl, tolerance=0.02, angularTolerance=0.1)
        cq.exporters.export(shape, os.path.join(OUT, name + '.step'))
        assert trimesh.load(stl).is_watertight, f'{name}: STL 이 닫히지 않았다'
    print('내보냄 →', OUT)
