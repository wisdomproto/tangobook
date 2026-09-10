# -*- coding: utf-8 -*-
"""레고 규격 판 — 돌기 지름만 4.0 으로 줄인 시험판

실행:  python legoplate.py            → out/legoplate-*.stl (+ .step)

🔴 **탱고 돌기판(studboard.py)과 다른 물건이다.** 저건 블록을 돌기 *사이로* 떨어뜨려서
   채널이 획(8mm)보다 넓어야 하고, 이건 블록을 돌기에 *끼운다*. 그래서 정하는 값이
   채널이 아니라 **돌기 지름**이고, 지름이 곧 물림 세기다.

🔴 돌기는 **원통**이다(반구 아님). 브릭 안쪽 벽·튜브가 원통 옆면을 물어야 잡힌다 —
   반구로 만들면 닿는 데가 없어 그냥 얹힌다.

레고 공식 규격 (web 확인, orionrobots · brickowl · lego.com)
   중심↔중심  8.00 (실측 7.985)      돌기 지름  4.80
   돌기 높이  1.70~1.80              플레이트 두께 3.20
   벽 두께    1.50                   부품 길이 = 8n − 0.2 (칸당 0.2 여유)
"""
import os
import sys
import cadquery as cq

sys.stdout.reconfigure(encoding='utf-8')

PITCH = 8.0
STUD_D = 4.0               # 🔴 지시값. 공식 4.8 에서 0.8 줄인 것 — 아래 report() 참조
STUD_H = 1.8
COLS = ROWS = 7

PLATE_T = 2.0              # 🔴 통판. 리브를 넣으면 바닥이 허공에 떠 서포트가 필요해지고,
                           #    그 서포트가 아낀 재료보다 더 든다. 속은 슬라이서 인필로.
TOP_CH = 0.3               # 돌기 윗변 모따기 — 브릭이 얹힐 때 자리를 찾는다
LEGO_STUD_D = 4.80         # 공식값
GAP = 0.2                  # 8n - 0.2
WALL = 1.5                 # 브릭 벽 두께
CAVITY = PITCH - 2 * WALL  # 5.0 — 브릭 밑 빈 칸. 이게 돌기를 문다

# 메시 공차. 🔴 원통이 다각형이 되므로 **돌기가 변 쪽에서 얇아진다** — 다만 실측하니
#    50각형이라 4.000 → 변 사이 3.992, 0.008mm 다. 지름이 곧 물림인 부품이라 재 봤고,
#    이 정도는 프린터 오차에 묻힌다. 파일 크기를 지배하는 건 돌기가 아니라
#    **판 윗면을 돌기 576개 구멍 둘레로 삼각분할하는 비용**이다(0.02 → 17MB, 0.03 → 8.8MB).
TOL, ATOL = 0.03, 0.25

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")


def plate(pitch, dia, cols, rows):
    # 바깥 치수는 레고 관습(8n − 0.2)을 따른다 — 진짜 레고 판과 나란히 놓인다
    w, h = pitch * cols - GAP, pitch * rows - GAP
    body = cq.Workplane("XY").box(w, h, PLATE_T, centered=(True, True, False))
    pts = [((i - (cols - 1) / 2) * pitch, (j - (rows - 1) / 2) * pitch)
           for i in range(cols) for j in range(rows)]
    s = (body.faces(">Z").workplane()
         .pushPoints(pts).circle(dia / 2).extrude(STUD_H))
    # >Z = 돌기 윗면 원들만 잡힌다 (판 윗면은 이제 그보다 낮다)
    return s.edges(">Z").chamfer(TOP_CH)


def report(name, pitch, dia, cols, rows, s):
    b = s.val().BoundingBox()
    vol = sum(so.Volume() for so in s.val().Solids()) / 1000.0
    slack = dia - LEGO_STUD_D
    return "\n".join([
        f"── {name}",
        f"   돌기      ⌀{dia:.2f} × 높이 {STUD_H:.1f} (원통, 윗변 모따기 {TOP_CH})"
        f"   {cols}×{rows} = {cols*rows}개",
        f"   간격      {pitch:.2f}      돌기 사이 {pitch - dia:.2f}"
        f"   (공식 ⌀{LEGO_STUD_D:.2f} → 사이 {pitch - LEGO_STUD_D:.2f})",
        # 🔴 물림을 정하는 건 「간격 − 지름」이 아니라 **브릭 밑 빈 칸(8 − 1.5×2 = 5.0)**
        #    이다. 돌기가 그 안에서 옆벽에 닿아야 잡힌다.
        f"   물림      브릭 속 빈 칸 {CAVITY:.1f} − 돌기 {dia:.1f} = 여유 {CAVITY-dia:.1f} mm"
        + ("   잡힌다" if CAVITY - dia <= 0.35 else "   얹힌다 (넣고 빼기 쉽다)"),
        f"   판        {b.xlen:.1f} × {b.ylen:.1f} × {b.zlen:.1f} mm"
        f"   {vol:.1f} cm³ ≈ PLA {vol*1.24:.0f} g",
    ])


BOARDS = [
    ("24x24  판때기 — 확정 지름 4.0",  8.0, 4.0, 24, 24),
    ("d4.0   시험판",                  8.0, 4.0, COLS, ROWS),
    ("d4.8   대조용 (레고 공식 규격)",  8.0, 4.8, COLS, ROWS),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    print("레고 규격 판 — 시험판")
    print("=" * 68)
    for name, pitch, dia, cols, rows in BOARDS:
        s = plate(pitch, dia, cols, rows)
        tag = name.split()[0]
        # 🔴 공차를 안 주면 원통 81개에 파일이 몇 MB 로 뛴다
        cq.exporters.export(s, os.path.join(OUT, f"legoplate-{tag}.stl"),
                            tolerance=TOL, angularTolerance=ATOL)
        cq.exporters.export(s, os.path.join(OUT, f"legoplate-{tag}.step"))
        print(report(name, pitch, dia, cols, rows, s))
        print()
    print("  프린팅 — 서포트 없음 · 브림 권장 · 층 0.2 · 벽 3줄 · 인필 15%")
    print("   🔴 돌기가 ⌀4 원통이라 프린터가 살을 붙이면 그만큼 뻑뻑해진다.")
    print("      한 판 뽑아 실제 브릭으로 물려 보고 지름을 ±0.2 씩 옮길 것.")
    print(f"\n  → {OUT}")


if __name__ == "__main__":
    main()
