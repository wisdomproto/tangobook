# -*- coding: utf-8 -*-
"""빨간모자류 CONNECT 게임 블록 — 24×24 레고판에 꽂는 3D 프린팅 부품 (CadQuery 파라메트릭)

실행:  python blocks.py     → out/*.stl · out/*.step (검사 통과 시)
       python preview.py    → out/review.png (음영 미리보기 — 부품 넷 + 판 위 조립 장면)

────────────────────────────────────────────────────────────────────────
설계 원칙 (2026-09-10, 사용자 결정)
  · 보드 = 기존 24×24 돌기 초록 레고판. 원작(4×4)과 같이 **한 칸 = 6돌기 = 48mm**.
  · 조각 위에는 **인쇄한 종이를 붙인다** — 윗면은 평평, 종이가 앉을 0.4mm 홈만 판다.
    그래서 길 조각은 **밑판 한 종류**로 끝난다(직선·곡선·S 는 종이 그림의 차이).
  · 레고판에 **꽂힌다** — 밑면에 돌기 자리마다 소켓(지름 STUD_HOLE_D, 깊이 STUD_HOLE_H).
    프린팅 부품이라 진짜 레고처럼 속을 비우고 튜브를 세우지 않는다. 소켓 마찰로 충분하고
    설계도 검사도 단순하다. 🔴 헐거우면 STUD_HOLE_D 를 0.1 줄이고, 안 들어가면 0.1 늘린다
    (FDM 은 구멍이 보통 0.1~0.2 작게 나온다 — 첫 값 5.0 은 그걸 감안한 것).
  · 옆 조각과 **딱 붙여 놓는 게 정상**이라 발자국을 사방 0.2mm 줄였다(48 → 47.6).
    안 줄이면 프린팅 오차로 마지막 조각이 안 들어간다.
  · 고정물(집·나무·빨간모자·늑대)은 **높게**(OBJ_H) — 카메라가 길 조각과 다른 물건으로 본다.
    집은 문 방향 표시로 굴뚝 한 덩이(원작과 같은 장치, 종이가 덮지 않는 자리).
  · 모서리는 둥글게(아이 손), 밑 테두리는 살짝 모따기(꽂을 때 안내).
  · 원점 마커는 **없다** — 4칸 × 6돌기 = 24돌기 = 판 전체라 놓을 자리가 없다. 격자는 인식기가 이미 찾는
    판 윤곽(초록 hull)을 넷으로 나눈 것이고, 어느 변이 위인지는 거치대(잠망경)가 정한다.

🔴 검사(review)를 통과 못 하면 내보내지 않는다 — 소켓이 윗면을 뚫었거나(종이 홈 밑 살이 얇음),
   소켓 수가 돌기 수와 다르거나, 발자국이 칸 격자를 넘으면 실패.
────────────────────────────────────────────────────────────────────────
"""

import os
import cadquery as cq

# ── 레고 규격
PITCH       = 8.0      # 돌기 간격
STUD_D      = 4.8      # 돌기 지름 (판)
STUD_H      = 1.7      # 돌기 높이 (판)
STUD_HOLE_D = 5.0      # 우리 소켓 지름 (FDM 수축 감안, 필요하면 ±0.1)
STUD_HOLE_H = 2.2      # 소켓 깊이 (돌기 1.7 + 여유)

# ── 우리 규격
CELL_STUDS  = 6                        # 한 칸 = 6돌기
CELL        = CELL_STUDS * PITCH       # 48mm
CLEAR       = 0.2                      # 발자국 사방 여유 → 옆 조각과 붙여도 안 낀다
ROAD_H      = 4.0                      # 길 조각 두께 (소켓 2.2 + 살 1.8)
OBJ_H       = 16.0                     # 고정물 높이
PAPER_T     = 0.4                      # 종이 홈 깊이
PAPER_INSET = 1.0                      # 종이 홈은 가장자리에서 이만큼 안쪽
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


def paper_recess(body, w, d, top_z):
    pw, pd = w - 2 * PAPER_INSET, d - 2 * PAPER_INSET
    cut = cq.Workplane('XY').box(pw, pd, PAPER_T, centered=(True, True, False)).translate((0, 0, top_z - PAPER_T))
    return body.cut(cut)


def block(nx, ny, h, paper=True):
    w, d = footprint(nx, ny)
    b = (cq.Workplane('XY').box(w, d, h, centered=(True, True, False))
         .edges('|Z').fillet(CORNER_R)
         .faces('<Z').edges().chamfer(BOTTOM_CH))
    b = sockets(b, nx, ny, w, d)
    if paper:
        b = paper_recess(b, w, d, h)
    return b


def road():
    """길 조각 밑판 1×2칸 (6×12돌기). 5장 전부 이것 하나 — 그림은 종이."""
    return block(CELL_STUDS * 2, CELL_STUDS, ROAD_H)


def obj():
    """고정물 1칸 (나무·빨간모자·늑대) — 높은 블록."""
    return block(CELL_STUDS, CELL_STUDS, OBJ_H)


def house():
    """집 = 고정물 + 굴뚝. 굴뚝이 붙은 변이 **문 있는 변**(원작의 굴뚝 규칙)."""
    b = obj()
    w, d = footprint(CELL_STUDS, CELL_STUDS)
    cw, cd, ch = CHIMNEY
    # +Y 변 = 문 방향. 바깥 변에 붙이고 몸통 안으로 1mm 박는다 — 종이 홈 안에 띄우면(면 접촉·0.4mm 공중)
    # 합집합이 닫히지 않아 STL 이 새는 메시가 된다(trimesh watertight False 로 잡혔다). 종이는 굴뚝을 피해 오린다.
    chimney = (cq.Workplane('XY').box(cw, cd, ch + 1.0, centered=(True, True, False))
               .translate((0, d / 2 - cd / 2, OBJ_H - 1.0)))
    return b.union(chimney)


def review(name, shape, nx, ny, h):
    """치수·소켓·윗살 검사. 실패하면 예외."""
    bb = shape.val().BoundingBox()
    w, d = footprint(nx, ny)
    assert abs(bb.xlen - w) < 0.05 and abs(bb.ylen - d) < 0.05, f'{name}: 발자국 {bb.xlen:.2f}×{bb.ylen:.2f} ≠ {w}×{d}'
    assert bb.zmin > -1e-6 and bb.zmax >= h - 1e-6, f'{name}: 높이 {bb.zmax:.2f} < {h}'
    # 소켓 수 = 밑면 원형 면 수
    cyl = [f for f in shape.faces().vals() if f.geomType() == 'CYLINDER' and abs(f.Center().z - STUD_HOLE_H / 2) < 0.5]
    assert len(cyl) == nx * ny, f'{name}: 소켓 {len(cyl)} ≠ {nx * ny}'
    # 윗살: 소켓 바닥(z=STUD_HOLE_H)과 종이 홈 바닥(h-PAPER_T) 사이가 1.2mm 이상
    skin = (h - PAPER_T) - STUD_HOLE_H
    assert skin >= 1.2, f'{name}: 윗살 {skin:.2f}mm < 1.2'
    vol = shape.val().Volume()
    print(f'  ✓ {name:14s} {bb.xlen:6.1f}×{bb.ylen:6.1f}×{bb.zlen:5.1f}mm  소켓 {len(cyl):3d}  부피 {vol/1000:6.1f}cm³')


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


ITEMS = [('road_1x2', road, CELL_STUDS * 2, CELL_STUDS, ROAD_H),
         ('object_1x1', obj, CELL_STUDS, CELL_STUDS, OBJ_H),
         ('house_1x1', house, CELL_STUDS, CELL_STUDS, OBJ_H + CHIMNEY[2])]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    built = [(name, fn(), nx, ny, h) for name, fn, nx, ny, h in ITEMS]
    print('검사')
    for name, shape, nx, ny, h in built:
        review(name, shape, nx, ny, h)
    import trimesh   # 🔴 내보낸 STL 이 닫힌 메시인지까지 검사 — 굴뚝 면 접촉 union 이 여기서 잡혔다
    for name, shape, *_ in built:
        stl = os.path.join(OUT, name + '.stl')
        cq.exporters.export(shape, stl, tolerance=0.02, angularTolerance=0.1)
        cq.exporters.export(shape, os.path.join(OUT, name + '.step'))
        assert trimesh.load(stl).is_watertight, f'{name}: STL 이 닫히지 않았다'
    print('내보냄 →', OUT)
