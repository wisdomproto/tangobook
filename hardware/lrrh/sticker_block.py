# -*- coding: utf-8 -*-
"""스티커 블록 4×6 · 5×5 · 4×4 · 3×3 — 윗면에 스티커를 붙이고, 사방 1mm 턱이 스티커 가장자리를 감싼다.

실행:  python sticker_block.py      → out/sticker_<이름>.stl · .step · .png  (SIZES 마다)

2026-09-15 사용자: 「5 by 5 랑 3 by 3 만들어줘」 · 「4 by 4 도」 — 같은 규칙에 돌기 수만 바꾼다.

2026-09-14 사용자: 「4 by 6 으로 블록 하나 · 위쪽에 스티커 · 사방에 1mm 정도 턱 · 완전 사각형 말고 라운드」.
  · 판에 꽂히는 규칙(소켓 Ø4.5×2.6 · 피치 8 · 발자국 사방 0.2 여유)은 blocks.py 에서 그대로 가져온다 —
    판 규격을 여기서 다시 적지 않는다.
  · 「1mm 턱」은 폭으로도 높이로도 읽혀서 **둘 다 1mm** 로 둔다(RIM_W·RIM_H). 스티커(0.1~0.2mm)가
    턱 안에 쏙 들어가 가장자리가 손에 걸려 들뜨지 않는다.
  · 라운드 = 세로 모서리 R4(턱 안쪽은 R3 로 따라 돈다) + 윗면 바깥 모서리 R0.5 + 밑 테두리 모따기.
"""
import os
import cadquery as cq
import blocks as B

SIZES       = [('4x6', 6, 4), ('5x5', 5, 5), ('4x4', 4, 4), ('3x3', 3, 3)]   # (이름, 돌기 X, 돌기 Y)
NX, NY      = 6, 4          # 기본 = 4×6 (alphabet_sheet·viewer 가 인자 없이 부른다)
H           = 6.4           # 블록 높이 (레고 플레이트 두 장). 9.6 → 6.4 (2026-09-14 「높이를 좀 낮춰줘」). 하한 = 소켓 2.6 + 윗살 1.2 + 턱 1.0 = 4.8
CORNER_R    = 4.0           # 세로 모서리 반경
TOP_EDGE_R  = 0.5           # 윗면 바깥 모서리 둥글림 (턱 폭 1mm 보다 작아야 턱 윗면이 남는다)
RIM_W       = 1.0           # 스티커 턱 폭
RIM_H       = 1.0           # 스티커 턱 높이 = 스티커 자리 깊이
STICKER_GAP = 0.25          # 스티커를 자리보다 사방 이만큼 작게 (붙일 때 여유)


def sticker_block(nx=NX, ny=NY):
    w, d = B.footprint(nx, ny)
    body = (cq.Workplane('XY').box(w, d, H, centered=(True, True, False))
            .edges('|Z').fillet(CORNER_R)
            .faces('>Z').edges().fillet(TOP_EDGE_R)
            .faces('<Z').edges().chamfer(B.BOTTOM_CH))
    body = B.sockets(body, nx, ny, w, d)
    pocket = (cq.Workplane('XY').box(w - 2 * RIM_W, d - 2 * RIM_W, RIM_H + 1.0, centered=(True, True, False))
              .edges('|Z').fillet(CORNER_R - RIM_W)
              .translate((0, 0, H - RIM_H)))
    return body.cut(pocket)


def sticker_size(nx=NX, ny=NY):
    w, d = B.footprint(nx, ny)
    return (w - 2 * RIM_W - 2 * STICKER_GAP, d - 2 * RIM_W - 2 * STICKER_GAP, CORNER_R - RIM_W - STICKER_GAP)


def review(shape, name, nx, ny):
    """치수·소켓·턱·윗살 검사 — 실패하면 예외."""
    s = shape.val()
    bb = s.BoundingBox()
    w, d = B.footprint(nx, ny)
    assert abs(bb.xlen - w) < 0.05 and abs(bb.ylen - d) < 0.05 and abs(bb.zlen - H) < 0.05, f'치수 {bb.xlen:.2f}×{bb.ylen:.2f}×{bb.zlen:.2f}'
    cyl = [f for f in s.Faces() if f.geomType() == 'CYLINDER' and abs(f.Center().z - B.STUD_HOLE_H / 2) < 0.5]
    assert len(cyl) == nx * ny, f'소켓 {len(cyl)} ≠ {nx * ny}'
    z = H - RIM_H / 2
    # 턱: 네 변 한가운데, 턱 폭 가운데에 살이 있어야 하고 스티커 자리 한가운데는 비어야 한다
    for x, y in ((0, d / 2 - RIM_W / 2), (0, -d / 2 + RIM_W / 2), (w / 2 - RIM_W / 2, 0), (-w / 2 + RIM_W / 2, 0)):
        assert s.isInside(cq.Vector(x, y, z), 1e-3), f'턱이 없다 ({x:+.1f},{y:+.1f})'
    assert not s.isInside(cq.Vector(0, 0, z), 1e-3), '스티커 자리가 막혔다'
    assert s.isInside(cq.Vector(0, 0, H - RIM_H - 0.2), 1e-3), '스티커 자리 바닥이 없다'
    skin = (H - RIM_H) - B.STUD_HOLE_H
    assert skin >= 1.2, f'윗살 {skin:.2f}mm < 1.2'
    sw, sd, sr = sticker_size(nx, ny)
    print(f'  ✓ sticker_{name}  {bb.xlen:.1f}×{bb.ylen:.1f}×{bb.zlen:.1f}mm  소켓 {len(cyl)}  '
          f'턱 {RIM_W}×{RIM_H}  스티커 {sw:.1f}×{sd:.1f} R{sr:.2f}  윗살 {skin:.1f}  부피 {s.Volume() / 1000:.1f}cm³')


if __name__ == '__main__':
    import trimesh
    import preview as P
    from PIL import Image
    os.makedirs(B.OUT, exist_ok=True)
    col = (0.93, 0.62, 0.36)
    print('검사')
    for name, nx, ny in SIZES:
        shape = sticker_block(nx, ny)
        review(shape, name, nx, ny)
        stl = os.path.join(B.OUT, f'sticker_{name}.stl')
        cq.exporters.export(shape, stl, tolerance=0.02, angularTolerance=0.1)
        cq.exporters.export(shape, os.path.join(B.OUT, f'sticker_{name}.step'))
        assert trimesh.load(stl).is_watertight, f'{stl} 이 닫히지 않았다'
        # 미리보기: 위에서 비스듬히 · 뒤집어서
        a, b = os.path.join(B.OUT, '_s1.png'), os.path.join(B.OUT, '_s2.png')
        P.shot(a, [(shape, col)], (1, -1.2, 1.1), zoom=0.75)
        P.shot(b, [(shape.rotate((0, 0, 0), (1, 0, 0), 180), col)], (1, -1.2, 1.1), zoom=0.75)
        out = Image.new('RGB', (P.W * 2 + 8, P.H), (150, 150, 150))
        out.paste(Image.open(a), (0, 0)); out.paste(Image.open(b), (P.W + 8, 0))
        out.save(os.path.join(B.OUT, f'sticker_{name}.png'))
        os.remove(a); os.remove(b)
        print('    →', stl)
