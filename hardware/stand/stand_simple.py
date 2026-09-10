# -*- coding: utf-8 -*-
"""서포트 없이 나오는 단순 스탠드 — 밑판 + 기댐판 + 턱, 셋뿐이다.

실행:  python stand_simple.py     → out/stand-simple.stl (+ .sockets.json)

🔴 왜 다시 짰나 — 오나미 원본은 **어느 방향으로 눕혀도** 서포트 없이 못 뽑는다.
   밑판을 베드에 두면 높이 158mm 에 오버행 19,418mm², z=75 에서 단면이
   324 -> 1,390mm² 로 뛰며 조각이 넷으로 갈린다(= 허공에서 시작하는 살).
   옆으로 눕혀도 13,000~16,000mm² 라 나아지지 않는다. 모양이 아니라 구조 문제다.

🔴 여기서 지키는 것 하나: **45도보다 눕는 면을 만들지 않는다.**
   - 밑판·턱 = 수직벽
   - 기댐판 = 수평에서 65도(수직에서 25도) 라 아랫면도 서포트가 필요 없다
   - 유일한 천장은 소켓 ⌀4.5 구멍인데, 4.5mm 는 브리지로 그냥 건너뛴다
"""
import io
import json
import os
import sys
import warnings

import numpy as np
import trimesh
from shapely.geometry import Polygon

from onami_lego import BORE_D, BORE_H, PITCH, STUD_D, STUD_H, check_open, socket

warnings.filterwarnings('ignore')
sys.stdout.reconfigure(encoding='utf-8')

ROWS, MIN_COLS = 10, 6           # 밑판 칸 수. 앞뒤(COLS)는 각도에 따라 아래에서 정해진다
BASE_T = BORE_H + 1.2            # 3.8 — 소켓 2.6 + 살 1.2

# 🔴 **폰을 높이는 건 기댐판을 키우는 게 아니라 받침을 올리는 것이다.**
#    폰 밑이 밑판에 놓이면 기댐판을 아무리 키워도 폰 높이는 그대로다.
#    그래서 기댐판을 밑판까지 내려 그 자체를 기둥으로 쓰고, 선반을 RISE 만큼 올렸다.
RISE = 60.0                      # 폰 밑(선반)이 밑판 위로 뜨는 높이 — 여기만 바꾸면 된다
# 🔴 **각도가 유일한 손잡이다.** 세울수록 턱이 앞으로 나오고 밑판은 얕아진다 —
#    그래서 BLADE_X 와 COLS 를 상수로 박지 않고 LEAN 에서 파생시킨다. 예전엔 박아 뒀다가
#    각도를 올리면 턱이 밑판 앞으로 튀어나갔다(80도에서 -2.4mm).
LEAN = 85.0                      # 기댐판 각도(수평 기준). 90도면 수직 · 65도면 책상 표준
FRONT = 5.0                      # 턱 앞에 남기는 밑판 여백
LIGHT = False                    # True = 기댐판 5mm + 등받이 창. 살은 덜리지만 모양이 바뀐다
BLADE_W, BLADE_H = 60.0, 72.0    # BLADE_H = 선반 **위로** 더 올라가는 등받이
BLADE_T = 5.0 if LIGHT else 8.0
SHELF_D, SHELF_T = 14.0, 4.0     # 폰이 앉는 홈 깊이(폰 두께 + 케이스) · 선반 두께
# 🔴 턱은 낮추는 것만으로는 모자란다 — 홈 버튼은 폰 밑에서 10mm 쯤이라 턱을 7 로 내려도
#    바로 3mm 위다. 가운데를 터서 손가락이 닿게 한다(턱은 양옆 조각으로 남아 계속 잡는다).
LIP_T, LIP_H = 3.0, 7.0          # 폰 밑을 받는 턱
NOTCH_W = 30.0                   # 턱 가운데를 터는 폭. 0 이면 통턱
BLADE_X = max(2.0, FRONT + SHELF_D + LIP_T - RISE / np.tan(np.radians(LEAN)))
GUSSET = 50.0                    # 선반 밑 받침살 각도. 45도면 딱 경계라 5도 여유를 뒀다

# 🔴 등받이 창 — 살을 덜어 출력 시간을 줄인다. **꼭대기를 뾰족하게** 판다.
#    기댐판이 65도로 누워 있어서 창 천장을 평평하게 파면 그 면이 수평에서 25도밖에
#    안 되는 처마가 된다. 창 가장자리는 판 면 안에서 38.7도보다 서야 45도 규칙을 지킨다
#    (계산: 천장 기울기 = asin(cos(LEAN) · cos(가장자리각))). 여유 두고 55도.
WIN_FRAME = 9.0                  # 창 둘레에 남기는 테두리
WIN_PEAK = 55.0                  # 창 꼭대기 각도

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')


def xz_prism(pts, y0, y1):
    """XZ 단면을 Y 로 뽑는다. trimesh 는 XY 단면을 Z 로만 뽑아서 한 번 눕힌다."""
    m = trimesh.creation.extrude_polygon(Polygon(pts), y1 - y0)
    m.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [1, 0, 0]))
    m.apply_translation([0, y1, 0])
    return m


def profile():
    """옆에서 본 단면 하나. 45도보다 눕는 변이 없어야 서포트가 안 든다.

    🔴 선반 밑면(수평 천장)을 아예 만들지 않는다 — 턱 앞아래에서 받침살이 %g도로
       내려와 기댐판 앞면에 닿으면서 그 자리를 대신한다.
    """ % GUSSET
    r = 1 / np.tan(np.radians(LEAN))          # 위로 1 갈 때 뒤로 물러나는 양
    th = BLADE_T / np.sin(np.radians(LEAN))   # 기댐판 두께의 수평 투영
    g = 1 / np.tan(np.radians(GUSSET))
    ZT = RISE + BLADE_H                       # 기댐판 꼭대기
    front = lambda z: BLADE_X + r * z         # 높이 z 에서 기댐판 앞면
    lip_x = front(RISE) - SHELF_D - LIP_T
    drop = (SHELF_D + LIP_T - r * SHELF_T) / (g + r)   # 받침살이 내려가는 높이
    pts = [(BLADE_X, 0), (BLADE_X + th, 0),                       # 기댐판 밑동
           (front(ZT) + th, ZT), (front(ZT), ZT),                 # 꼭대기
           (front(RISE), RISE), (lip_x + LIP_T, RISE),            # 선반 윗면
           (lip_x + LIP_T, RISE + LIP_H), (lip_x, RISE + LIP_H),  # 턱
           (lip_x, RISE - SHELF_T),                               # 턱 앞아래
           (lip_x + g * drop, RISE - SHELF_T - drop)]             # 받침살 -> 기댐판
    return pts, lip_x, front(ZT) + th


def window(D):
    """등받이 창 — 기댐판 면 위에서 오각형(밑은 평평, 위는 뾰족)을 뚫는다."""
    if not LIGHT:
        return None
    th = np.radians(90 - LEAN)                        # 기댐판이 수직에서 기운 각
    L = (RISE + BLADE_H) / np.cos(th)                 # 기댐판 전체 길이(면을 따라)
    u0 = RISE / np.cos(th) + WIN_FRAME + SHELF_T      # 선반 이음매 위에서 시작
    u1 = L - WIN_FRAME
    hw = BLADE_W / 2 - WIN_FRAME
    peak = hw * np.tan(np.radians(WIN_PEAK))          # 뾰족한 꼭대기가 먹는 길이
    if u1 - u0 < peak + 8:
        return None                                   # 창을 낼 만큼 안 길다
    cy, us = D / 2, u1 - peak
    poly = Polygon([(u0, cy - hw), (us, cy - hw), (u1, cy), (us, cy + hw), (u0, cy + hw)])
    w = trimesh.creation.extrude_polygon(poly, BLADE_T + 4)
    w.apply_translation([0, 0, -(BLADE_T + 2)])       # 판을 앞뒤로 확실히 관통
    R = np.eye(4)
    R[:3, :3] = [[np.sin(th), 0, -np.cos(th)],        # 국소 x -> 판 위쪽, z -> 판 법선
                 [0, 1, 0],
                 [np.cos(th), 0, np.sin(th)]]
    w.apply_transform(R)
    w.apply_translation([BLADE_X, 0, BASE_T])
    return w


def build():
    pts2d, lip_x, back = profile()
    cols = max(MIN_COLS, int(np.ceil((back + 4) / PITCH)))
    W, D = cols * PITCH, ROWS * PITCH
    poly = Polygon(pts2d)
    if not poly.is_valid or lip_x < 2:
        raise SystemExit('단면이 밑판을 벗어난다 (턱 %.1f, 뒤 %.1f, 밑판 %.1f)' % (lip_x, back, W))

    base = trimesh.creation.box(extents=[W, D, BASE_T])
    base.apply_translation([W / 2, D / 2, BASE_T / 2])
    body = xz_prism(pts2d, (D - BLADE_W) / 2, (D + BLADE_W) / 2)
    body.apply_translation([0, 0, BASE_T])
    m = trimesh.boolean.union([base, body], engine='manifold')
    if NOTCH_W > 0:
        # 위로 열린 홈이라 천장이 안 생긴다 — 서포트 걱정 없음
        n = trimesh.creation.box(extents=[LIP_T + 4, NOTCH_W, LIP_H + 4])
        n.apply_translation([lip_x + LIP_T / 2, D / 2,
                             BASE_T + RISE + (LIP_H + 4) / 2 - 0.001])
        m = trimesh.boolean.difference([m, n], engine='manifold')

    pts = [((i + .5) * PITCH, (j + .5) * PITCH) for j in range(ROWS) for i in range(cols)]
    cuts = [socket(x, y) for x, y in pts]
    win = window(D)
    solid = m.volume
    if win is not None:
        cuts.append(win)
    out = trimesh.boolean.difference([m, trimesh.util.concatenate(cuts)], engine='manifold')
    out.apply_translation(-out.bounds[0])
    if win is not None:
        print('창     등받이에 %.1f cm³ 덜어냄 (테두리 %.0f · 꼭대기 %.0f도)'
              % ((solid - out.volume - len(pts) * np.pi * (BORE_D / 2) ** 2 * BORE_H) / 1000,
                 WIN_FRAME, WIN_PEAK))
    print('밑판   %d × %d 칸 = %.0f × %.0f × %.1f mm · 소켓 %d개 (앞뒤 칸은 각도에서 파생)'
          % (cols, ROWS, W, D, BASE_T, len(pts)))
    print('선반   밑판 위 %.0f mm — 폰 밑이 판에서 %.0f mm 뜬다' % (RISE, BASE_T + RISE))
    print('기댐판 %.0f 폭 · %.0f 두께 · %.0f도 · 선반 위로 %.0f 더'
          % (BLADE_W, BLADE_T, LEAN, BLADE_H))
    print('턱     %.0f 높이 · 홈 %.0f mm (폰 + 케이스) · 받침살 %.0f도 · 가운데 %s'
          % (LIP_H, SHELF_D, GUSSET,
             ('%.0f mm 텄다 (양옆 %.0f mm 씩 남음)' % (NOTCH_W, (BLADE_W - NOTCH_W) / 2))
             if NOTCH_W > 0 else '통턱'))
    return out, pts


def overhangs(m):
    """45도보다 눕는 아랫면을 잰다. 소켓 천장(구멍 ⌀4.5)은 브리지라 따로 센다."""
    N, A, C = m.face_normals, m.area_faces, m.triangles_center
    down = N[:, 2] < -1e-6
    ang = np.degrees(np.arcsin(np.clip(-N[:, 2], 0, 1)))
    ceil = down & (ang > 45) & (np.abs(C[:, 2] - BORE_H) < 0.3)     # 소켓 천장
    bed = down & (C[:, 2] < 0.3)        # 🔴 베드에 닿는 밑면은 오버행이 아니다
    bad = down & (ang > 45) & ~ceil & ~bed
    return A[bad].sum(), A[ceil].sum()


def main(tag=''):
    m, pts = build()
    bad, ceil = overhangs(m)
    print('\n결과   %.1f × %.1f × %.1f mm · 부피 %.1f cm³ · 워터타이트 %s · 덩어리 %d'
          % (m.extents[0], m.extents[1], m.extents[2], m.volume / 1000,
             m.is_watertight, len(m.split(only_watertight=False))))
    print('검사   서포트 필요한 오버행 %.0f mm²  %s' % (bad, 'OK' if bad < 1 else '<-- 있다'))
    print('       소켓 천장 %.0f mm² (⌀%.1f 브리지 — 서포트 불필요)' % (ceil, BORE_D))
    for infill in (0.10, 0.15):
        shell = min(m.area * 0.84, m.volume)      # 벽 2줄(0.42 x 2) 어림
        fil = (shell + infill * (m.volume - shell)) / 1000
        print('어림   채움 %d%% → 필라멘트 약 %.0f cm³ = %.0f g (겉넓이 %.0f cm², 속 %.0f cm³)'
              % (infill * 100, fil, fil * 1.24, m.area / 100, m.volume / 1000))
    opened, _, _ = check_open(m, pts)
    print('       광선 — 열린 소켓 %d / %d  %s'
          % (opened, len(pts), 'OK' if opened == len(pts) else '<-- 막힌 게 있다'))
    assert bad < 1 and opened == len(pts), '검사 실패'

    os.makedirs(OUT, exist_ok=True)
    m.export(os.path.join(OUT, 'stand-simple%s.stl' % tag))
    with io.open(os.path.join(OUT, 'stand-simple%s.sockets.json' % tag), 'w', encoding='utf-8') as f:
        # 🔴 폰 자리는 **뚫은 쪽이 내보낸다.** 뷰어가 메시에서 되짚으면 또 틀린 면을 집는다.
        th = np.radians(90 - LEAN)
        json.dump(dict(bore_d=BORE_D, bore_h=BORE_H, pitch=PITCH, stud_d=STUD_D, stud_h=STUD_H,
                       lean=LEAN, rise=RISE, base_t=BASE_T, channel=SHELF_D,
                       seat=[round(BLADE_X + RISE * np.tan(th), 3), round(m.extents[1] / 2, 3),
                             round(BASE_T + RISE, 3)],
                       sockets=[[round(x, 3), round(y, 3)] for x, y in pts]), f)
    print('\n  → %s' % OUT)
    print('  프린팅 — 밑판을 베드에 · 서포트 없음 · 바닥 %.0f mm² 라 브림도 필요 없다.'
          % (m.extents[0] * m.extents[1]))


def set_lean(a):
    """🔴 `import stand_simple as me` 로 바꾸면 안 먹는다 — 스크립트로 돌리면 그건 `__main__`
       과 **다른 모듈 객체**라, build() 가 읽는 전역은 그대로다(각도 5개가 전부 80도로 나왔다)."""
    g = globals()
    g['LEAN'] = float(a)
    g['BLADE_X'] = max(2.0, FRONT + SHELF_D + LIP_T - RISE / np.tan(np.radians(a)))


def sweep(angles=(65, 70, 75, 80, 85)):
    """각도별로 한 벌씩 뽑는다 — 브라우저에서 갈아 끼워 보려고."""
    keep = LEAN
    for a in angles:
        set_lean(a)
        main(tag='-%d' % a)
        print()
    set_lean(keep)


if __name__ == '__main__':
    if '--sweep' in sys.argv:
        sweep()
    else:
        main()
