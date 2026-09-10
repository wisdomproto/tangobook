# -*- coding: utf-8 -*-
"""탱고식 돌기판 — 레고 블록을 돌기 사이에 앉히는 시험판

실행:  python studboard.py            → out/studboard-*.stl (+ .step)

🔴 돌기 모양은 **원래 탱고 판에서 떠 왔다**. 메시를 0.125mm 간격으로 잘라 지름을
   재 보니 반구(r 2.5)와 0.1mm 안에서 맞았다 — 원뿔이 아니다.
     높이 0.0 → ⌀5.00 · 1.0 → ⌀4.50 · 1.5 → ⌀3.85 · 2.0 → ⌀2.85 · 2.5 → 끝

🔴 **블록은 돌기에 끼우는 게 아니라 돌기 사이로 떨어진다.** 그러니 정하는 값은
   돌기 지름이 아니라 **채널**(간격 − 지름)이고, 채널은 블록 획보다 넓어야 한다.
   원래 판 실측: 간격 15 · ⌀5 · 채널 10 · 블록 밑동 8.15 → 한쪽 여유 0.92mm.

🔴 기준은 **레고 ㄱ**. ㄱ은 가로획·세로획이 8mm 하나씩이라 서로 다른 축의 채널을
   쓴다 — 그래서 「채널 ≥ 획 + 여유」 하나만 만족하면 되고, 획 간격 조건이 없다.
   (ㅌ·ㅂ 처럼 같은 축에 획이 여럿이면 그 간격도 돌기 간격의 배수여야 한다.)
"""
import os
import cadquery as cq

# ── 원래 탱고 판 실측 (tango-board-3d.mesh.json)
SRC_PITCH, SRC_DIA, SRC_SKIRT = 15.0, 5.00, 8.15
SRC_CLEAR = (SRC_PITCH - SRC_DIA - SRC_SKIRT) / 2      # 한쪽 여유 0.925mm

LEGO_STROKE = 8.0          # 레고 획 = 1칸

PLATE_T = 2.0              # 🔴 통판. 바닥 1.2 + 테두리 리브로 짜 봤다가 되돌렸다 —
                           #    바닥판이 허공에 떠 **서포트 없이는 못 뽑고**, 그 서포트가
                           #    아낀 2cm³ 보다 더 든다. 속을 비우려면 슬라이서 인필로.
EDGE_R = 1.0

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")


def board(pitch, dia, cols, rows):
    margin = pitch / 2
    w = (cols - 1) * pitch + 2 * margin
    h = (rows - 1) * pitch + 2 * margin
    plate = (cq.Workplane("XY")
             .box(w, h, PLATE_T, centered=(True, True, False))
             .edges("|Z").fillet(EDGE_R))
    pts = [((i - (cols - 1) / 2) * pitch, (j - (rows - 1) / 2) * pitch)
           for i in range(cols) for j in range(rows)]
    # 반구 — 판 윗면에 중심을 두면 아랫절반이 판 속에 묻힌다
    studs = (cq.Workplane("XY").workplane(offset=PLATE_T)
             .pushPoints(pts).sphere(dia / 2))
    return plate.union(studs)


def report(name, pitch, dia, cols, rows, s):
    ch = pitch - dia
    clear = (ch - LEGO_STROKE) / 2
    b = s.val().BoundingBox()
    vol = sum(so.Volume() for so in s.val().Solids()) / 1000.0
    ok = "들어간다" if clear >= 0.3 else "⚠ 안 들어간다"
    return "\n".join([
        f"── {name}",
        f"   돌기      ⌀{dia:.1f} × 높이 {dia/2:.2f} (반구)   {cols}×{rows} = {cols*rows}개",
        f"   간격      {pitch:.1f}      채널 {ch:.1f}   (지름÷간격 {dia/pitch:.3f},"
        f" 원래 판 {SRC_DIA/SRC_PITCH:.3f})",
        f"   레고 ㄱ    획 {LEGO_STROKE:.1f} → 한쪽 여유 {clear:+.2f} mm   {ok}"
        f"   (원래 판 {SRC_CLEAR:+.2f})",
        f"   판        {b.xlen:.0f} × {b.ylen:.0f} × {b.zlen:.1f} mm"
        f"   {vol:.1f} cm³ ≈ PLA {vol*1.24:.0f} g",
    ])


BOARDS = [
    # 이름, 간격, 지름, 칸수 — 판을 70~80mm 안쪽으로 맞춘다
    ("p13.5  지시하신 ⌀3.3 로, ㄱ 이 들어가는 최소 간격", 13.5, 3.3, 5, 5),
    ("p15.0  원래 탱고 판과 같은 규격",                   15.0, 5.0, 5, 5),
    ("p10.0  지시하신 간격 10 (ㄱ 은 안 들어간다)",        10.0, 3.3, 7, 7),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    print("탱고식 돌기판 — 시험판")
    print("=" * 68)
    for name, pitch, dia, cols, rows in BOARDS:
        s = board(pitch, dia, cols, rows)
        tag = name.split()[0]
        # 🔴 공차를 안 주면 기본값이 너무 촘촘하다 — 반구 49개에 10.4MB 가 나왔다.
        cq.exporters.export(s, os.path.join(OUT, f"studboard-{tag}.stl"),
                            tolerance=0.02, angularTolerance=0.15)
        cq.exporters.export(s, os.path.join(OUT, f"studboard-{tag}.step"))
        print(report(name, pitch, dia, cols, rows, s))
        print()
    print("  프린팅 — 서포트 없음 · 브림 권장 · 층 0.2 · 벽 3줄 · 인필 15%")
    print("   🔴 돌기가 작은 반구라 층 0.2 면 계단이 보인다 — 윗면만 0.12 로 낮출 것")
    print(f"\n  → {OUT}")


if __name__ == "__main__":
    main()
