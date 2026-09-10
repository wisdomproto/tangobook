# -*- coding: utf-8 -*-
"""오나미 폰 스탠드 → 레고 판에 물리게. **밑면만** 고친다.

실행:  python onami_lego.py [원본.stl]     → out/onami-lego.stl (+ .sockets.json)

여기까지 오면서 틀린 것들 — 다시 밟지 말 것
──────────────────────────────────────────────────────────────────────
🔴 **모양은 손대지 않는다.** 한 번 내 맘대로 새로 디자인했다가 되돌렸다.

🔴 **어느 면이 바닥인지 넓이로 고르면 틀린다.** 큰 평면이 셋인데 8,697 / 7,829 /
   7,629 mm² 로 비슷해서 두 번 다른 면을 골랐다. 고르는 자는 **고무 패드 홈**이다 —
   책상에 닿는 면에만 1.0mm 얕게 파인 원형 홈이 있다(실측 452mm², n(0.94,0,0.34)).

🔴 **패드 홈은 메운다.** 홈이 1.0 깊은데 돌기는 1.8 이라, 홈에 돌기가 오면 0.8 이 남아
   거기 얹혀 흔들린다. 소켓이 아니라 턱이 된다.

🔴 **구멍은 원통 하나로 판다.** 입구 턱을 원통 하나 더 겹쳐 만들려다 두 번 실패했다.
   두 원통이 어느 높이에서 면을 공유하면(겹치든 맞대든) 불리언이 그 구간을 상쇄해
   **살이 남는다** — 0~0.8 이 막히고 0.9~2.6 만 뚫린 「속이 빈 주머니」가 됐다.

🔴 **집계로 확인하지 마라.** 「소켓 천장 넓이 99%」는 천장만 보므로 바닥이 막혀 있어도
   통과한다. **아래에서 광선을 쏴** 첫 살이 천장 높이인지 본다. 그 시험은 뚫린 상자로
   기준선을 잡아 두고 쓴다 — 기준선이 통과 못 하면 자가 틀린 것이다.

🔴 **패치를 겹쳐 넣지 마라.** 같은 함수가 세 벌 쌓여 맨 뒤 것이 이기는 바람에, 고쳐도
   결과가 안 바뀌는 걸 한참 들여다봤다(부피 감소가 계속 8.5 로 똑같았다).
"""
import io
import json
import os
import sys
import warnings

import numpy as np
import trimesh
from shapely.geometry import Point
from shapely.ops import unary_union

warnings.filterwarnings('ignore')
sys.stdout.reconfigure(encoding='utf-8')

PITCH, STUD_D, STUD_H = 8.0, 4.0, 1.8      # 판 (legoplate.py 와 같아야 한다)

CLEAR = 0.5              # 돌기와의 지름 여유(사용자 지정 — 0.6 은 헐거웠다)
BORE_D = STUD_D + CLEAR  # 4.5
BORE_H = 2.6             # 돌기 1.8 + 머리 위 0.8. 밑판 6mm 라 살이 3.4 남는다
CUT_BELOW = 3.0          # 바닥보다 이만큼 아래에서부터 자른다
# 🔴 가장자리 자리도 **반원으로라도 판다.** 온전한 원이 들어가는 자리만 파면
#    가장자리 격자 10곳이 구멍 없이 남는데, 거기 돌기가 오면 그 돌기 하나에 얹혀
#    스탠드가 흔들린다(돌기 1.8mm 가 통째로 턱이 된다). 레고 부품도 가장자리는
#    열린 반쪽 소켓으로 둔다. 중심이 닿는 면 안에 있으면 판다.
EDGE_KEEP = 0.2          # 경계에 딱 걸친 실오라기만 거른다
PROBE_Z = 1.0

# 🔴 밑을 **직사각형 판**으로 덧댄다. 원본 발바닥은 모서리가 둥글어 가장자리 줄이
#    반쪽 소켓밖에 안 되고, 거기선 레고가 제대로 안 물린다(사용자 확인).
#    칸 수에 딱 맞는 네모를 밑에 붙이면 격자 전체가 온전한 소켓이 된다.
PAD_FLOOR = 1.2          # 소켓 위에 남기는 살
PAD_H = BORE_H + PAD_FLOOR

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')


def foot_polygon(m, z=PROBE_Z):
    """단면을 **월드 XY 좌표로** 돌려준다.

    🔴 `to_planar()` 를 그냥 부르면 단면 평면이 제 기준축을 잡아 2D 좌표가 월드 XY 와
       다르다. 그걸 모르고 소켓 자리를 정했다가 98개를 팠다면서 실제로는 스무 몇 개만
       살을 팠다(덜어낸 부피 1.1cm³ vs 기대 4.9).
    """
    s = m.section(plane_origin=[0, 0, z], plane_normal=[0, 0, 1])
    if s is None:
        return []
    to2d = trimesh.transformations.translation_matrix([0, 0, -z])
    p, _ = s.to_planar(to_2D=to2d)
    return list(p.polygons_full)


def lay_on_mount_face(m):
    """고무 패드 홈이 있는 면을 바닥으로 눕힌다."""
    m = m.copy()
    N, A, C = m.face_normals, m.area_faces, m.triangles_center
    grp = {}
    for i in range(len(N)):
        k = tuple(np.round(N[i], 2)) + (round(float(np.dot(N[i], C[i])), 1),)
        grp.setdefault(k, []).append(i)
    big = sorted(((A[v].sum(), k) for k, v in grp.items() if A[v].sum() > 1500), reverse=True)
    pick = None
    for area, k in big:
        n = np.array(k[:3], float)
        rec = sum(A[v].sum() for k2, v in grp.items()
                  if tuple(np.round(np.array(k2[:3]), 2)) == tuple(np.round(n, 2))
                  and 0.25 < k[3] - k2[3] < 1.8 and 200 < A[v].sum() < 1200)
        if rec > 0:
            pick = (n / np.linalg.norm(n), area, rec)
            break
    if pick is None:
        raise SystemExit('패드 홈이 있는 면을 못 찾았다')
    n, area, rec = pick
    print('붙일 면  법선 (%.2f, %.2f, %.2f) · 넓이 %.0f mm² · 패드 홈 %.0f mm²'
          % (n[0], n[1], n[2], area, rec))
    axis = np.cross(n, [0.0, 0.0, -1.0])
    if np.linalg.norm(axis) > 1e-6:
        ang = np.arccos(np.clip(np.dot(n, [0.0, 0.0, -1.0]), -1, 1))
        m.apply_transform(trimesh.transformations.rotation_matrix(ang, axis))
        print('         %.1f도 돌려 눕힘' % np.degrees(ang))
    m.apply_translation(-m.bounds[0])
    return m


def fill_pads(m, lo=0.05, hi=1.9):
    """바닥의 얕은 홈을 메워 평평하게."""
    gap = unary_union(foot_polygon(m, hi)).difference(unary_union(foot_polygon(m, lo)))
    if gap.is_empty:
        return m, 0.0
    parts = list(gap.geoms) if hasattr(gap, 'geoms') else [gap]
    plugs = [trimesh.creation.extrude_polygon(q, hi + 0.2).apply_translation([0, 0, -0.1])
             for q in parts if q.area >= 20]
    if not plugs:
        return m, 0.0
    out = trimesh.boolean.union([m] + plugs, engine='manifold')
    out.apply_translation(-out.bounds[0])
    return out, sum(q.area for q in parts)


def rect_pad(m):
    """밑에 직사각형 판을 붙인다. 칸 수에 딱 맞춰 잘라 격자가 온전히 들어간다."""
    b = m.bounds
    w, d = b[1][0] - b[0][0], b[1][1] - b[0][1]
    cols, rows = int(np.ceil(w / PITCH)), int(np.ceil(d / PITCH))
    W, D = cols * PITCH, rows * PITCH
    cx, cy = (b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2
    pad = trimesh.creation.box(extents=[W, D, PAD_H])
    pad.apply_translation([cx, cy, -PAD_H / 2 + 0.2])   # 0.2 겹쳐 확실히 붙인다
    out = trimesh.boolean.union([m, pad], engine='manifold')
    shift = -out.bounds[0]
    out.apply_translation(shift)
    print('밑판  %d × %d 칸 = %.0f × %.0f mm · 두께 %.1f (소켓 %.1f + 살 %.1f)'
          % (cols, rows, W, D, PAD_H, BORE_H, PAD_FLOOR))
    # 🔴 소켓 자리는 **네모에서 직접** 센다. 예전처럼 bbox 중심에서 (i+0.5)·8 로 재면
    #    칸 수가 홀수일 때 위상이 반 칸 어긋나 바깥 줄이 모서리에 걸린다.
    x0, y0 = cx - W / 2 + shift[0], cy - D / 2 + shift[1]
    return out, [(x0 + (i + .5) * PITCH, y0 + (j + .5) * PITCH)
                 for j in range(rows) for i in range(cols)]


def socket(x, y):
    """구멍 하나 — 원통 하나. 두 개를 겹치면 불리언이 상쇄한다(맨 위 주석)."""
    c = trimesh.creation.cylinder(radius=BORE_D / 2, height=BORE_H + CUT_BELOW, sections=48)
    c.apply_translation([x, y, (BORE_H + CUT_BELOW) / 2 - CUT_BELOW])
    return c


def check_open(mesh, pts):
    """아래에서 광선을 쏴 소켓이 **정말 뚫렸는지** 센다."""
    base = mesh.bounds[0][2]
    org = np.column_stack([[p[0] for p in pts], [p[1] for p in pts],
                           np.full(len(pts), base - 5.0)])
    hit, ray_i, _ = mesh.ray.intersects_location(
        org, np.tile([0, 0, 1.0], (len(pts), 1)), multiple_hits=True)
    first = {}
    for h, i in zip(hit, ray_i):
        first[i] = min(first.get(i, 1e9), h[2])
    ok = sum(1 for i in range(len(pts))
             if abs(first.get(i, -1e9) - (base + BORE_H)) < 0.2)
    return ok, first, base


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    if src is None:
        import glob
        c = glob.glob(r'C:\Users\101024\AppData\Local\Temp\claude\board-lego\onami\*.stl')
        if not c:
            raise SystemExit('원본 STL 경로를 인자로 줄 것')
        src = c[0]
    m = trimesh.load(src)
    print('원본  %s' % os.path.basename(src))
    print('      %.1f × %.1f × %.1f mm · 부피 %.1f cm³ · 워터타이트 %s'
          % (m.extents[0], m.extents[1], m.extents[2], m.volume / 1000, m.is_watertight))
    m = lay_on_mount_face(m)
    m, padded = fill_pads(m)
    if padded:
        print('패드 홈  %.0f mm² 메움' % padded)

    m, pts = rect_pad(m)
    print('소켓  %d개 (전부 온전한 원) · ⌀%.1f (돌기 ⌀%.1f + 여유 %.1f) · 깊이 %.1f'
          % (len(pts), BORE_D, STUD_D, CLEAR, BORE_H))

    cut = trimesh.util.concatenate([socket(x, y) for x, y in pts])
    out = trimesh.boolean.difference([m, cut], engine='manifold')
    print('결과  %.1f × %.1f × %.1f mm · 부피 %.1f cm³ (%.2f 덜어냄) · 워터타이트 %s'
          % (out.extents[0], out.extents[1], out.extents[2], out.volume / 1000,
             (m.volume - out.volume) / 1000, out.is_watertight))
    want = len(pts) * np.pi * (BORE_D / 2) ** 2 * BORE_H / 1000.0
    print('      기대 %.2f cm³ (소켓 %d × %.0f mm³)'
          % (want, len(pts), np.pi * (BORE_D / 2) ** 2 * BORE_H))

    opened, first, base = check_open(out, pts)
    print('검사  광선 — 열린 소켓 %d / %d  %s'
          % (opened, len(pts), 'OK' if opened == len(pts) else '<-- 막힌 게 있다'))
    if opened != len(pts):
        bad = sorted({round(first.get(i, -99) - base, 1) for i in range(len(pts))
                      if abs(first.get(i, -1e9) - (base + BORE_H)) >= 0.2})
        print('      막힌 자리의 첫 살 높이:', bad[:8])
    print('      깊이 %.1f · 돌기 %.1f → 머리 위 %.1f mm' % (BORE_H, STUD_H, BORE_H - STUD_H))

    os.makedirs(OUT, exist_ok=True)
    out.export(os.path.join(OUT, 'onami-lego.stl'))
    with io.open(os.path.join(OUT, 'onami-lego.sockets.json'), 'w', encoding='utf-8') as f:
        json.dump(dict(bore_d=BORE_D, bore_h=BORE_H, pitch=PITCH,
                       stud_d=STUD_D, stud_h=STUD_H,
                       sockets=[[round(x - out.bounds[0][0], 3),
                                 round(y - out.bounds[0][1], 3)] for x, y in pts]), f)
    print('\n  → %s' % OUT)
    print('  프린팅 — 밑면을 베드에 · 브림 · 서포트는 원본 설정 그대로.')


if __name__ == '__main__':
    main()
