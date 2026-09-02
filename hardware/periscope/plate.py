# -*- coding: utf-8 -*-
"""프린팅 판 짜기 + 서포트 검사

실행:  python plate.py            → out/plate_all.stl

🔴 예전엔 **혀를 두께 4종으로** 뽑아 손으로 눌러 보고 고르게 했다. 그럴 이유가
   없어졌다 — 힘은 이제 판이 아니라 **폼**이 낸다. 세기를 바꾸고 싶으면 폼 테이프를
   바꿔 끼우면 되고, 판은 안 휘도록 두껍기만 하면 된다(PLATE_T).

🔴 서포트는 눈으로 짐작하지 않고 **면 법선으로 잰다** — 아래를 45° 넘게 보는
   면의 넓이를 세면 그게 서포트가 붙을 자리다. 이 측정이 「혀를 눕혀라」는
   내 조언을 뒤집었다(눕히면 523mm², 폭을 세우면 33mm²).
"""

import math, os
import cadquery as cq
import printable as K

OUT = K.OUT
GAP = 12.0                            # 판 위 부품 간격


def overhang_area(shape, limit_deg=45.0):
    """아래를 limit 보다 가파르게 보는 면의 넓이(mm²) — 서포트가 붙을 자리."""
    lim = -math.cos(math.radians(limit_deg))
    tot = 0.0
    for f in shape.faces().vals():
        try:
            n = f.normalAt()
            a = f.Area()
        except Exception:
            continue
        if n.z < lim:
            tot += a
    return tot


def body_oriented():
    """채널 입구가 위를 보게 세운다 — 천장이 바닥이 되어 서포트가 준다.
    ⚠ 그래도 얼마쯤은 붙는다(거울 경사면·핀 구멍). 시제품이니 감수한다."""
    return K.body().rotate((0, 0, 0), (0, 1, 0), 270)


def plate_oriented():
    """🔴 **폭을 세워서** 뽑는다. 한 층 한 층이 판의 곡면 그 자체가 되고 굽힘이
    층 **안에서** 걸린다. 눕히면 층을 가로질러 갈라진다."""
    return K.tongue().rotate((0, 0, 0), (0, 1, 0), 90)


def sit(shape, x0):
    """바닥에 앉히고 x 로 민다."""
    b = shape.val().BoundingBox()
    return shape.translate((x0 - b.xmin, -b.ymin, -b.zmin))


def main():
    os.makedirs(OUT, exist_ok=True)
    print("프린팅 판")
    print("=" * 60)
    # 🔴 문턱은 부품마다 다르다. 몸체는 거울 경사면·핀 구멍·채널 천장이 있어서
    #    **어느 방향으로 놔도** 어느 정도는 붙는다 — 축 여섯 방향을 다 재 보니
    #    지금 방향 519mm² 가 최선이고 나머지는 1,203~1,807 이다.
    #    한 문턱(200)으로 둘을 같이 재면 최선인 방향에도 경고가 뜬다.
    parts, x = [], 0.0
    for nm, sh, limit in (("몸체", body_oriented(), 600.0),
                          ("판(혀)", plate_oriented(), 100.0)):
        s = sit(sh, x)
        b = s.val().BoundingBox()
        oh = overhang_area(s)
        print(f"  {nm:6s} {b.xlen:5.1f} × {b.ylen:5.1f} × {b.zlen:5.1f} mm"
              f"   서포트 {oh:6.0f} mm²"
              f"   {'OK' if oh < limit else '⚠ 방향을 다시 볼 것'}")
        parts.append(s)
        x = b.xmax + GAP
    all_ = parts[0]
    for p in parts[1:]:
        all_ = all_.union(p)
    cq.exporters.export(all_, os.path.join(OUT, "plate_all.stl"))
    b = all_.val().BoundingBox()
    print(f"         판 {b.xlen:5.1f} × {b.ylen:5.1f} mm")
    print()
    print("  프린팅")
    print(f"   · 판(혀) — 폭을 세워서. 두께 {K.PLATE_T}mm 는 0.4 노즐에서 벽 4줄")
    print("   · 판(혀) — PETG. 힘은 폼이 내지만 힌지 핀은 PLA 면 잘 부러진다")
    print("   · 몸체 — 인필 15% 면 충분. 벽 3줄")
    print(f"   · 폼 — {K.FOAM_W:.0f}×{K.FOAM_H:.0f}mm · 자유 두께 {K.foam_gap():.1f}mm")
    print("          (사서 붙인다. 세기가 모자라면 더 두꺼운 걸로)")


if __name__ == "__main__":
    main()
