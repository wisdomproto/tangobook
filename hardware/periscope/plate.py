# -*- coding: utf-8 -*-
"""프린팅 판 짜기 + 서포트 검사

실행:  python plate.py            → out/plate_body.stl · out/plate_tongues.stl

🔴 첫 판은 **혀를 여러 두께로 한 번에** 뽑는다. 스프링 세기는 계산으로 못 정한다 —
   재질·온도·라인폭이 다 끼어든다. 네 개 뽑아 손으로 눌러 보고 고르는 게 빠르다.
   두께마다 **홈 개수**를 새겨 뽑고 나서 구분되게 한다.

🔴 서포트는 눈으로 짐작하지 않고 **면 법선으로 잰다** — 아래를 45° 넘게 보는
   면의 넓이를 세면 그게 서포트가 붙을 자리다.
"""

import math, os
import cadquery as cq
import printable as K

OUT = K.OUT
VARIANTS = [0.6, 0.8, 1.0, 1.2]      # 혀 두께 후보
GAP = 34.0                            # 판 위 부품 간격


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
    ⚠ 그래도 12%쯤은 붙는다(거울 경사면·핀 구멍). 시제품이니 감수한다."""
    return K.body().rotate((0, 0, 0), (0, 1, 0), 270)


def tongue_oriented(t):
    """🔴 **폭을 세워서** 뽑는다. 그러면 한 층 한 층이 **활 모양 그 자체**가 되고
    층은 폭 방향으로 쌓인다. 굽힘은 활을 따라 걸리니 층 **안에서** 버틴다.

    🔴 내가 처음에 「눕혀라」고 한 건 틀렸다 — 눕히면 서포트 523mm² 에 층 방향도
       나쁘다. 세우면 33mm². 측정이 조언을 뒤집었다."""
    old = K.TONGUE_T
    K.TONGUE_T = t
    try:
        s = K.tongue()
    finally:
        K.TONGUE_T = old
    # 폭(22mm)을 세운다 — 층마다 단면이 활 그 자체가 된다
    return s.rotate((0, 0, 0), (0, 1, 0), 90)


def notch(shape, n, at):
    """두께를 구분할 홈 n 개 — 뽑고 나서 어느 게 어느 건지 알아야 한다."""
    for i in range(n):
        shape = shape.cut(cq.Workplane("XY")
                          .box(1.2, 1.2, 6.0, centered=(True, True, True))
                          .translate((at[0] + i * 2.6, at[1], at[2])))
    return shape


def main():
    os.makedirs(OUT, exist_ok=True)
    print("프린팅 판")
    print("=" * 64)

    # ── 몸체
    b = body_oriented()
    bb = b.val().BoundingBox()
    b = b.translate((0, 0, -bb.zmin))          # 바닥에 앉힌다
    oh = overhang_area(b)
    cq.exporters.export(b, os.path.join(OUT, "plate_body.stl"))
    bb = b.val().BoundingBox()
    print(f"  몸체     {bb.xlen:5.1f} × {bb.ylen:5.1f} × {bb.zlen:5.1f} mm")
    print(f"           서포트 붙을 면 {oh:6.0f} mm²  "
          f"{'거의 없음' if oh < 200 else '⚠ 방향을 다시 볼 것'}")

    # ── 혀 4종
    plate = None
    print()
    print("  혀 (한 판에 네 개 — 홈 개수로 구분)")
    for i, t in enumerate(VARIANTS):
        s = tongue_oriented(t)
        sb = s.val().BoundingBox()
        s = s.translate((-sb.xmin + i * GAP, -sb.ymin, -sb.zmin))
        s = notch(s, i + 1, (2.0, 3.0, 0.0))
        oh_t = overhang_area(s)
        eps = strain(t)
        plate = s if plate is None else plate.union(s)
        print(f"   홈 {i+1}개  두께 {t:.1f}mm   변형률 {eps:4.1f}%  "
              f"{'OK' if eps <= 3.0 else '뻣뻣·부러질 수 있음'}"
              f"   서포트 {oh_t:4.0f} mm²")
    cq.exporters.export(plate, os.path.join(OUT, "plate_tongues.stl"))
    pb = plate.val().BoundingBox()
    print(f"           판 {pb.xlen:5.1f} × {pb.ylen:5.1f} mm")

    print()
    print("  프린팅")
    print("   · 혀 — 폭을 세워서. 층마다 단면이 활 그 자체가 된다")
    print("   · 혀 — 인필 0%, 벽만. 격자가 들어가면 마디에서 부러진다")
    print("   · 혀 — PETG. PLA 는 스프링으로 잘 부러진다")
    print("   · 몸체 — 인필 15% 면 충분. 벽 3줄")
    print("   · 첫 층 냉각 끄고, 혀는 얇아 천천히(30mm/s)")


def strain(t):
    c = K.TONGUE_C
    h1 = (K.CHANNEL - 1.0) - K.GRIP_FREE
    h2 = (K.CHANNEL - 1.0) - K.GRIP_MAX
    R = lambda h: (c * c) / (8 * max(h, 0.3)) + h / 2
    return t / 2 * abs(1 / R(h1) - 1 / R(h2)) * 100


if __name__ == "__main__":
    main()
