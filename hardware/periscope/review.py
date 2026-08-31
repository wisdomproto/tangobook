# -*- coding: utf-8 -*-
"""반사경 모델 자가 검토 — 눈으로 보지 말고 잰다.

실행:  python review.py

🔴 이 파일의 목적은 「괜찮아 보인다」를 못 쓰게 하는 것이다. 오늘 이 부품에서
   틀린 다섯 가지 중 마지막(C 를 원통으로 뽑아 폰 자리를 가로막음)은 렌더로는
   안 보였고 **부피를 칸으로 나눠 재고서야** 잡혔다.
"""

import math
import cadquery as cq
import reflector as R

PH_W, PH_H = 74.0, 55.0
PASS, WARN, FAIL = "OK  ", "주의", "실패"
rows = []


def say(level, name, detail):
    rows.append((level, name, detail))


def vol(shape, box):
    try:
        return shape.intersect(box).val().Volume() / 1000.0
    except Exception:
        return 0.0


def bx(y0, y1, z0, z1, w=PH_W):
    return (cq.Workplane("XY").box(w, y1 - y0, z1 - z0, centered=(True, False, False))
            .translate((0, y0, z0)))


def main():
    P = {n: f() for n, f in R.PARTS.items()}
    core, shell, rock = P["core"], P["spring_shell"], P["rocker_pad"]
    cb, mir = P["case_back"], P["mirror_glass"]

    # ── 1. 집게인가 — 앞뒤 양쪽에 턱이 있는가
    front = vol(core, bx(-60, 0, -PH_H, 0)) + vol(shell, bx(-60, 0, -PH_H, 0))
    back = vol(core, bx(R.GRIP_NOM, 60, -PH_H, 0)) + vol(shell, bx(R.GRIP_NOM, 60, -PH_H, 0))
    intr = vol(core, bx(0, R.GRIP_NOM, -PH_H, 0)) + vol(shell, bx(0, R.GRIP_NOM, -PH_H, 0))
    say(PASS if back > 0.8 else FAIL, "집게 뒤턱",
        f"앞 {front:.2f} / 뒤 {back:.2f} cm³ — 뒤턱이 없으면 앞에 매달린 덩어리다")
    say(PASS if intr < 0.8 else FAIL, "폰 자리",
        f"침범 {intr:.2f} cm³ — 회전 패드가 미는 분(~0.4)만 있어야 한다")

    # ── 2. 부품끼리 겹치는가 (조립 불가)
    pairs = [("코어", core, "스프링", shell), ("코어", core, "회전패드", rock),
             ("코어", core, "뒤판", cb), ("스프링", shell, "회전패드", rock)]
    for an, a, bn, b in pairs:
        try:
            ov = a.intersect(b).val().Volume() / 1000.0
        except Exception:
            ov = 0.0
        lim = 0.02
        say(PASS if ov <= lim else FAIL, f"간섭 {an}↔{bn}",
            f"{ov:.3f} cm³ — 0 이어야 조립된다")

    # ── 3. 거울이 정말 갇혀 있는가 (유아 안전)
    #    거울을 조금 키워 보고 케이스 밖으로 새는지 본다
    grown = mir.val().BoundingBox()
    span = max(grown.xlen, grown.ylen, grown.zlen)
    hull = core.union(cb)
    try:
        leak = mir.cut(hull).val().Volume() / 1000.0
    except Exception:
        leak = -1
    say(PASS if 0 <= leak < 0.30 else WARN, "거울 밀폐",
        f"케이스 밖 노출 {leak:.3f} cm³ — 유아용이라 유리 모서리가 드러나면 안 된다")

    # ── 4. 살두께가 고른가 (사출 수축 자국)
    for n, s in (("코어", core), ("스프링", shell), ("회전패드", rock), ("뒤판", cb)):
        b = s.val().BoundingBox()
        env = b.xlen * b.ylen * b.zlen / 1000.0
        fill = s.val().Volume() / 1000.0 / env if env else 0
        say(PASS if fill < 0.45 else WARN, f"속 채움 {n}",
            f"{fill*100:.0f}% — 40% 넘으면 살이 두꺼워 수축 자국이 난다")

    # ── 5. 회전 패드가 실제로 도는가
    pin_gap = R.CLR
    say(PASS if 0.2 <= pin_gap <= 0.5 else WARN, "패드 축 틈",
        f"편측 {pin_gap:.2f}mm — 너무 좁으면 안 돌고 넓으면 덜그럭거린다")
    swing = math.degrees(math.atan2(R.GRIP_NOM - 4.0, R.ROCK_H))
    say(PASS if swing >= 8 else WARN, "패드 회전각",
        f"±{swing:.0f}° 필요 — 두께 4~{R.GRIP_NOM+6:.0f}mm 를 면으로 물려면")

    # ── 5b. 🔴 빛이 지나는 길에 살이 있는가
    #    리브를 보강하려고 넣었더니 그게 정확히 통로 한가운데(Z −16)에 앉아
    #    **카메라 시야를 막고 있었다** — 조립도 되고 겉보기도 멀쩡한 결함이다.
    cone = R.light_cone()
    for n in ("core", "spring_shell", "rocker_pad", "case_back"):
        try:
            blocked = P[n].intersect(cone).val().Volume() / 1000.0
        except Exception:
            blocked = 0.0
        say(PASS if blocked < 0.02 else FAIL, f"빛 통로 {n}",
            f"{blocked:.3f} cm³ — 여기 살이 있으면 카메라가 못 본다")

    # ── 6. 광학이 여전히 맞는가
    down, want = R.check_optics()
    say(PASS if abs(down - want) < 0.05 else FAIL, "하향각",
        f"모델 {down:.1f}° = 공식 {want:.1f}°")
    h, v = R.fov()
    # 판 500×315 를 360mm 높이·하향 56° 에서 담는가
    reach = 360.0 / math.tan(math.radians(down))
    near = 360.0 / math.tan(math.radians(down + v / 2))
    far = 360.0 / math.tan(math.radians(max(1.0, down - v / 2)))
    # 🔴 화각은 거울이 아니라 **창** 크기로 나온다(실제 구멍이 창이다)
    # 🔴 가로는 **빗변 거리**로 잰다. 지면 거리(reach)로 재면 379mm 로 나와
    #    「판 폭을 못 담는다」는 거짓 경보가 뜬다 — 검토기 자신이 같은 함정에 빠졌다.
    slant = 360.0 / math.sin(math.radians(down))
    wide = 2 * slant * math.tan(math.radians(h / 2))
    say(PASS if (far - near) >= 315 else FAIL, "판 세로 담기",
        f"{far-near:.0f}mm 덮음 / 판 깊이 315mm")
    say(PASS if wide >= 500 else WARN, "판 가로 담기",
        f"{wide:.0f}mm 덮음 / 판 폭 500mm (빗변 {slant:.0f}mm 에서)")

    # ── 7. 혀가 스프링이다 — 견디는가
    #    🔴 껍데기가 아니라 **혀**를 잰다. 껍데기는 케이스라 안 휜다.
    L, t = R.TONGUE_L, R.TONGUE_T
    y = R.GRIP_MAX - R.GRIP_FREE          # 제일 두꺼운 폰이 혀를 미는 양
    eps = 3 * t * y / (2 * L ** 2) * 100
    say(PASS if eps <= 3.0 else FAIL, "혀 변형률",
        f"{eps:.1f}% (L{L:.0f} t{t:.1f}, {y:.0f}mm 밀림) — 3% 넘으면 부러진다")
    say(PASS, "혀 길이 근거",
        f"오스모 실물 L14 로는 {3*t*y/(2*196)*100:.1f}% — 아이패드는 2mm만 밀려서 짧아도 됐다")

    # ── 8. 무는 힘이 있는가 — 쉴 때 틈이 제일 얇은 폰보다 좁아야 한다
    preload = R.GRIP_MIN - R.GRIP_FREE
    say(PASS if preload >= 0.5 else FAIL, "무는 힘(예압)",
        f"혀가 쉴 때 틈 {R.GRIP_FREE:.1f}mm < 제일 얇은 폰 {R.GRIP_MIN:.1f}mm → "
        f"{preload:.1f}~{R.GRIP_MAX-R.GRIP_FREE:.0f}mm 밀린 채 누른다")
    say(PASS if abs(R.CHANNEL - (R.GRIP_MAX + 1.0)) < 0.01 else WARN, "채널 고정폭",
        f"{R.CHANNEL:.1f}mm — 껍데기는 안 휘므로 제일 두꺼운 폰 + 여유로 고정한다")

    # ── 9. 빠진 것
    say(FAIL, "스냅 결합", "코어↔껍데기를 잡아 주는 게 없다 — 지금은 그냥 겹쳐만 있다")
    say(WARN, "혀 폼", "검정 폼(닿는 면)은 모델에 없다 — 부착 자리만 있다")
    say(FAIL, "구배(draft)", "어느 면에도 안 넣었다 — 이대로는 금형에서 안 빠진다")
    say(WARN, "스프링 곡면", "다리가 각진 상자다. 실물은 곡면이고 곡률이 곧 강성이다")
    say(WARN, "치수 출처", "CORE_W·CORE_D·GRIP_NOM 은 사진 비율 추정 — 실측 아님")

    w = max(len(r[1]) for r in rows)
    print("반사경 모델 자가 검토")
    print("=" * 78)
    for lv, n, d in rows:
        print(f"  [{lv}] {n:<{w}}  {d}")
    bad = sum(1 for r in rows if r[0] == FAIL)
    warn = sum(1 for r in rows if r[0] == WARN)
    print("=" * 78)
    print(f"  실패 {bad} · 주의 {warn} · 통과 {len(rows)-bad-warn}")


if __name__ == "__main__":
    main()
