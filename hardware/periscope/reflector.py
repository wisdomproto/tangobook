# -*- coding: utf-8 -*-
"""탱고 잠망경 반사경 — 오스모 분해 구조 그대로 (유아용)

실행:  python reflector.py            → out/*.step / *.stl / report.txt

────────────────────────────────────────────────────────────────────────
🔴 오스모 실물을 분해해 확인한 구조(사용자 사진). 셋이 하는 일이 깨끗하게 갈린다.

  ① 코어      리브를 촘촘히 세워 **일부러 안 휘게** 만든다. 거울을 고정각으로 든다.
              거울 1도 = 시선 2도라, 거울을 든 부품이 휘면 그게 그대로 두 배로 나간다.
  ② C 껍데기   커브 단면이 곧 **판스프링**. 휘는 일을 거울과 무관한 바깥에 몰아넣었다.
              로고도 여기 있다 — 브랜딩과 스프링을 한 부품이 겸한다.
  ③ 회전 패드  축 핀 두 개로 **까딱까딱 돈다**. 폼이 붙어 있고 코어 벽의 창으로 얼굴만 내민다.
              🔴 「어떤 두께든」의 답이 여기 있다. 스프링이 벌어지면 무는 각이 달라지는데
                 패드가 고정이면 모서리 한 줄로만 닿는다. 도는 패드는 저절로 누워 **면으로** 닿는다.

🔴 내가 두 번 틀렸던 것: 「거울 든 부품이 곧 집게」. 이 원칙과 정반대다.
   휘는 곳과 각을 잡는 곳은 **다른 부품이어야 한다.**

🔴 유아용이라 거울은 케이스 안에 가둔다(오스모는 노출). 창이 반사면보다 안으로
   들어가 손가락이 안 닿고, 앞뒤는 초음파 융착이라 나사도 없고 열리지도 않는다.
   창을 투명판으로 덮지는 않는다 — 면이 늘면 이중상이 생겨 인식이 나빠진다.

🔴 치수는 사진에서 **비율로** 잡은 값이다. 실측이 오면 아래 세 상수만 고치면
   나머지는 전부 따라 나온다: CORE_W · CORE_D · GRIP_NOM.
   광학 세 값(MU · MIR_* · CAM_GAP)만은 시뮬 실측이라 추정이 아니다.
────────────────────────────────────────────────────────────────────────

좌표: 원점 = 기기 윗변 한가운데, **화면 면 위**.
      +X 오른쪽 · +Y 기기 안쪽(두께 방향) · +Z 위
      화면 바깥(아이 쪽) = −Y · 기기 몸통 = −Z
"""

import math, os
import cadquery as cq

# ── 광학 — 시뮬 UI 실측 기본값 (tango-board-3d.html). 추정 아님.
MU        = 33.0     # 거울이 기기 면과 이루는 각            (camTilt)
PAD_TILT  = 80.0     # 기기 기울기 — 거치대가 정한다          (camPad)
# 🔴 시뮬의 25×14 는 **구멍(창) 크기**로 쓰인 값이다 — 화각을 거울 크기로 계산했다.
#    실물은 테두리에 사방 1.5mm 씩 물리므로 **거울이 그만큼 커야** 그 화각이 나온다.
#    14 그대로 쓰면 실제 창이 11mm 라 세로 화각 32.2° → 판 315mm 를 1mm 못 담는다.
MIR_W, MIR_H, MIR_T = 28.0, 17.0, 1.1        # 창 25×14 를 내기 위한 거울 크기
CAM_GAP   = 16.0     # 전면 카메라 ↔ 거울 중심               (camMirD)
CAM_DROP  = 8.0      # 윗변에서 전면 카메라까지 (기종마다 다름)

# ── 실측이 오면 여기만 고친다 (지금은 사진 비율)
CORE_W    = 46.0     # 코어 폭
CORE_D    = CAM_GAP + 4.0   # 코어 깊이 — 🔴 거울이 앞면이 되도록 CAM_GAP 에서 파생
# 🔴 **힘은 혀가 낸다. C 껍데기는 그냥 케이스다**(사용자 확인).
#    혀가 탄성으로 채널 안에 튀어나와 있고, 그걸 뒤로 밀면서 폰을 끼운다.
#    껍데기를 스프링으로 봤던 건 틀렸다 — 껍데기는 안 휘고 채널 폭이 고정이다.
GRIP_MIN  = 5.0      # 무는 제일 얇은 폰
GRIP_MAX  = 14.0     # 무는 제일 두꺼운 폰
CHANNEL   = GRIP_MAX + 1.0   # 코어 벽 ↔ 껍데기 안쪽 = **고정 폭**
GRIP_FREE = 4.0      # 혀가 쉴 때 남는 틈 — 이보다 두꺼우면 혀가 밀리며 문다
GRIP_FREE_SAG = CHANNEL - GRIP_FREE - 0.6   # 쉴 때 활의 배부름 (현에서 배까지)
GRIP_NOM  = CHANNEL  # 껍데기 형상은 고정 폭으로 그린다

# 🔴 코어 높이는 정하는 게 아니라 **파생된다** — 회전 패드까지만 내려가면 된다.
#    42mm 로 박아 뒀더니 화면을 한 뼘 덮고 내려와 폰을 걸 데가 없었다.
CORE_H    = 24.0     # = |ROCK_Z| + 패드 반 + 여유. 아래는 뚫려 있어야 한다.
ROOF      = 4.0      # 윗변 위를 덮는 두께

# ── 탄성 혀 (= 이 제품의 스프링)
# 🔴 길이는 **변형률**이 정한다. eps = 3·t·y/(2·L²), y = CHANNEL−GRIP_FREE−? 밀림 10mm
#    L14(오스모 실물 크기) t1.0 → 7.7% 부러진다 · L26 t1.0 → 2.2% 안전.
#    🔴 오스모 혀가 짧아도 되는 건 아이패드가 다 7mm 언저리라 2mm만 밀려서다.
#       우리는 폰 5~14mm 를 받으니 같은 크기로 못 쓴다.
# 🔴 **활(bow) 스프링**이다. 외팔보가 아니다.
#    외팔보는 뿌리 한 점에 변형이 몰려 거기서 부러진다(오스모 실물이 그 모양이 아니다).
#    활은 곡률이 펴지며 **아치 전체가 나눠 진다**:  eps = t/2 · |1/R1 − 1/R2|
#    그래서 한쪽은 핀으로 걸고 **반대 끝은 미끄러지게** 둬야 한다 — 양쪽을 다
#    고정하면 활이 못 펴지고 그냥 외팔보 두 개가 된다.
TONGUE_C  = 24.0     # 활의 현(chord) 길이
TONGUE_T  = 0.8      # 혀 두께
TONGUE_W  = 22.0     # 혀 폭
TONGUE_L  = TONGUE_C  # (검토기 호환)
ROCK_W, ROCK_H, ROCK_T = TONGUE_W, 12.0, TONGUE_T
PIN_D     = 2.4      # 축 핀 지름
FOAM_T    = 1.2      # 검정 폼 두께
ROCK_Z    = -14.0    # 패드 중심이 윗변 아래로 내려온 높이
PIVOT_Y   = -3.6     # 축 중심 (화면 면에서 앞으로) — 패드가 여기 걸려 돈다
BEAR_T    = 2.5      # 축 베어링 벽 두께
BEAR_D    = 8.0      # 베어링 벽 깊이
BEAR_H    = 14.0     # 베어링 벽 높이

# ── C 판스프링
SH_WALL   = 2.0      # 껍데기 살두께 — 이게 스프링 강성을 정한다
# 🔴 다리 길이는 **변형률**이 정한다. eps = 3·t·y/(2·L²), y = 편측 (14−4)/2 = 5mm
#    L20 t2.0 → 3.75% (부러진다) · L26 t2.0 → 2.2% (안전권)
SH_H      = 26.0     # 다리 길이 (윗변 아래로)
SH_OPEN   = 6.0      # 입구가 벌어져 있는 여유 (기기가 쉽게 들어가게)
HOOK_W    = 7.0      # 앞 걸쇠 폭 — 🔴 이 둘만 남기고 앞다리는 없앤다

# ── 사출·안전
WALL   = 2.0
RIB    = 1.2         # 리브 두께 — 코어를 안 휘게 하는 것이 이 리브다
CLR    = 0.35
EDGE_R = 1.5
WELD_H = 0.9

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

CASE_W = MIR_W + 2 * (CLR + WALL)
CASE_H = MIR_H + 2 * (CLR + WALL)
CASE_T = MIR_T + 2 * WALL + 1.0


# ─────────────────────────────────────────────── 광학 (자기 검산)

def mirror_frame():
    a = math.radians(MU)
    return (0.0, -CAM_GAP, -CAM_DROP), (0.0, math.sin(a), -math.cos(a))


def _case_rot(shape):
    c, _ = mirror_frame()
    return shape.rotate((0, 0, 0), (1, 0, 0), -(90.0 - MU)).translate(c)


def check_optics():
    """🔴 모델링한 거울로 실제 반사를 계산한다. 각도를 손으로 적지 않는다."""
    _, n = mirror_frame()
    t = math.radians(PAD_TILT)
    up_w   = (0.0, math.cos(t),  math.sin(t))
    back_w = (0.0, math.sin(t), -math.cos(t))     # 로컬 +Y (시뮬 rigGeometry 규약)
    out_w  = tuple(-x for x in back_w)
    nw = tuple(n[0] * ax + n[1] * bx + n[2] * cx
               for ax, bx, cx in zip((1, 0, 0), back_w, up_w))
    dot = sum(a * b for a, b in zip(out_w, nw))
    r = tuple(a - 2 * dot * b for a, b in zip(out_w, nw))
    return math.degrees(math.atan2(-r[2], math.hypot(r[0], r[1]))), PAD_TILT + 2 * MU - 90.0


# 🔴 실제 구멍은 **창**이다. 거울은 그보다 크지만 테두리에 물려 있어 그만큼은 못 쓴다.
#    거울 크기로 화각을 계산하면 실제보다 넓게 나온다 — 통로 검사가 이걸 잡아냈다.
APER_W = MIR_W - 3.0
APER_H = MIR_H - 3.0


def fov():
    return (2 * math.degrees(math.atan((APER_W / 2) / CAM_GAP)),
            2 * math.degrees(math.atan((APER_H * math.cos(math.radians(MU)) / 2) / CAM_GAP)))


def light_cone(length=70.0):
    """🔴 **빛이 지나는 통로**. 어떤 부품도 여기 살이 있으면 안 된다.

    거울에서 반사된 빛은 앞·아래로(하향 56°) 나간다. 리브를 보강하려고 넣었더니
    그게 정확히 이 통로 한가운데(Z −16)에 앉아 **카메라 시야를 막고 있었다** —
    조립도 되고 겉보기도 멀쩡한데 안 보이는 종류의 결함이다.
    그래서 통로를 **형상으로 만들어 두고 모든 부품에서 빼낸다.**"""
    mu = math.radians(MU)
    dy, dz = -math.cos(2 * mu), -math.sin(2 * mu)
    h, v = fov()
    # 🔴 **원뿔대**여야 한다. 처음엔 단면이 고정된 상자로 만들어(134×66mm)
    #    거울 바로 뒤 뒤판까지 통째로 삼켰다 — 통로가 아니라 방이었다.
    start = 3.0                                   # 거울 테두리는 통로가 아니다
    w0 = APER_W + 2 * start * math.tan(math.radians(h / 2))
    h0 = APER_H + 2 * start * math.tan(math.radians(v / 2))
    w1 = APER_W + 2 * length * math.tan(math.radians(h / 2))
    h1 = APER_H + 2 * length * math.tan(math.radians(v / 2))
    # +Z 로 뽑고 (0,dy,dz) 를 향하게 돌린다
    phi = math.degrees(math.atan2(-dy, dz))
    beam = (cq.Workplane("XY").workplane(offset=start)
            .rect(w0, h0).workplane(offset=length - start).rect(w1, h1).loft()
            .rotate((0, 0, 0), (1, 0, 0), phi)
            .translate((0, -CAM_GAP, -CAM_DROP)))
    return beam


# ─────────────────────────────────────────────── ① 코어

def core():
    """거울을 고정각으로 드는 **쐐기 하나**.

    🔴 상자를 여러 개 쌓지 않는다. 오스모 실물은 쐐기 한 덩어리이고, 리브는
       뒤에 숨어 있다. 처음엔 옆벽·지붕·어깨·베어링벽·융착리브를 따로 붙여
       밖에서 다 보였다 — 복잡해 보이는 게 아니라 실제로 복잡했다.
    🔴 속은 껍질만 남기고 파낸다(살두께 균일 = 수축 자국 없음).
    🔴 빛 통로는 맨 마지막에 판다."""
    hw = CORE_W / 2
    fw = CASE_W / 2 + WALL              # 거울 쪽 반폭 — 앞으로 갈수록 좁아진다

    # 옆에서 본 실루엣 (YZ) — 위는 넓고 앞·아래로 흘러내리는 쐐기
    sil = [(0.0,        ROOF),
           (-CORE_D,    ROOF),
           (-CORE_D,   -CAM_DROP - CASE_H / 2 - WALL),
           (-CORE_D * 0.45, -CORE_H),
           (0.0,       -CORE_H)]

    def wedge(inset, top, wide):
        pts = [(y - inset if y < 0 else y - inset, z) for y, z in sil]
        return (cq.Workplane("YZ").workplane(offset=-wide)
                .polyline(sil).close().extrude(2 * wide))

    outer = wedge(0.0, ROOF, hw)
    # 앞으로 좁아지게 — 사다리꼴로 깎는다
    taper = (cq.Workplane("XY")
             .polyline([(-hw, 0.6), (hw, 0.6), (fw, -CORE_D - 1), (-fw, -CORE_D - 1)])
             .close().extrude(CORE_H + ROOF + 2).translate((0, 0, -CORE_H - 1)))
    body = outer.intersect(taper)

    # 속 파내기 — 껍질만 남긴다
    inner = (cq.Workplane("YZ").workplane(offset=-(hw - WALL))
             .polyline([(y + (WALL if y < -0.1 else -WALL) * 0, z) for y, z in sil])
             .close().extrude(2 * (hw - WALL)))
    inner = inner.translate((0, WALL, 0)).intersect(
        cq.Workplane("XY").box(CORE_W - 2 * WALL, 200, CORE_H + ROOF - 2 * WALL,
                               centered=(True, True, True))
        .translate((0, 0, (ROOF - CORE_H) / 2)))
    body = body.cut(inner)

    # 회전 혀가 지나는 창
    body = body.cut(cq.Workplane("XY")
                    .box(TONGUE_W + 4 * CLR, WALL * 4, TONGUE_C + 4 * CLR,
                         centered=(True, False, True))
                    .translate((0, -WALL * 2, ROCK_Z)))

    # 거울 포켓 — 쐐기의 앞 경사면에 바로 판다
    front = (cq.Workplane("XY")
             .box(CASE_W, CASE_T / 2, CASE_H, centered=(True, False, True))
             .edges("|Y").fillet(EDGE_R))
    front = front.cut(cq.Workplane("XY")
                      .box(MIR_W + 2 * CLR, MIR_T, MIR_H + 2 * CLR,
                           centered=(True, False, True))
                      .translate((0, CASE_T / 2 - MIR_T, 0)))
    front = front.cut(cq.Workplane("XY")
                      .box(APER_W, CASE_T, APER_H, centered=(True, False, True))
                      .translate((0, -0.5, 0)))
    body = body.union(_case_rot(front))

    return body.cut(light_cone())


# ─────────────────────────────────────────────── ② C 판스프링 껍데기

def spring_shell():
    """∩ 자로 코어와 폰을 함께 덮는 **케이스**. 🔴 스프링이 아니다 —
    무는 힘은 안쪽 혀가 내고, 이 껍데기는 채널 폭을 **고정**해 준다.
    (로고가 붙는 바깥 얼굴이기도 하다.)

    🔴 원통으로 뽑으면 안 된다. 앞(코어)과 뒤(폰 등)를 잇는 **원은 가운데를 지나가서**
       폰이 들어갈 자리를 스프링이 가로막는다 — 실측으로 잡혔다: 전체 살의 93%가
       폰 앞에만 있고 뒤쪽은 7% 뿐이었다(집게가 아니라 앞에 매달린 덩어리).
    🔴 그래서 단면은 **∩** 다: 앞다리(코어 앞) · 윗변을 넘는 굽이 · 뒷다리(폰 등).
       휘는 건 굽이와 다리이고, 폰 칸은 비어 있어야 한다."""
    y_front = -(CORE_D + SH_WALL)          # 앞다리 바깥면
    y_back  = GRIP_NOM + SH_WALL           # 뒷다리 바깥면
    z_top   = ROOF + SH_WALL
    z_bot   = -SH_H

    outer = (cq.Workplane("XY")
             .box(CORE_W, y_back - y_front, z_top - z_bot, centered=(True, False, False))
             .translate((0, y_front, z_bot))
             .edges("|X").fillet(3.0))
    # 속을 파낸다 — 여기 코어와 폰이 들어온다. 아래는 뚫려 있다.
    # 🔴 속은 CLR 만큼 키운다 — 딱 맞게 팠더니 코어 지붕과 살이 겹쳐 안 끼워졌다
    inner = (cq.Workplane("XY")
             .box(CORE_W + 2, GRIP_NOM + CORE_D + 2 * CLR, z_top - z_bot + CLR,
                  centered=(True, False, False))
             .translate((0, -CORE_D - CLR, z_bot - 2))
             .edges("|X").fillet(2.0))
    shell = outer.cut(inner)

    # 🔴 앞다리는 **양옆 걸쇠 둘**만 남긴다. 통짜로 내리면 거울 둘레가 판때기로 덮여
    #    오스모와 딴판이 된다(통짜였을 땐 거울을 아예 가려 카메라가 못 봤다).
    #    껍데기를 잡아 주는 건 뒷다리와 지붕이고, 앞은 빠지지 않게만 걸치면 된다.
    keep = None
    for sx in (-1, 1):
        k = (cq.Workplane("XY")
             .box(HOOK_W, 40.0, 80.0, centered=(False, False, False))
             .translate((sx * CORE_W / 2 - (HOOK_W if sx > 0 else 0),
                         -CORE_D - 40.0, -40.0)))
        keep = k if keep is None else keep.union(k)
    front_zone = (cq.Workplane("XY")
                  .box(CORE_W + 4, 40.0, 80.0, centered=(True, False, False))
                  .translate((0, -CORE_D - 40.0, -40.0)))
    shell = shell.cut(front_zone.cut(keep))

    # 🔴 껍데기도 같은 통로를 비워야 한다
    shell = shell.cut(light_cone())

    # 뒷다리 안쪽 돌기 — 폰 등을 실제로 누르는 자리
    shell = shell.union(cq.Workplane("XY")
                        .box(CORE_W - 10.0, 1.2, 8.0, centered=(True, False, True))
                        .translate((0, GRIP_NOM - 1.2, -SH_H + 8.0)))
    return shell


# ─────────────────────────────────────────────── ③ 회전 패드

def rocker_pad():
    """🔴 **이 제품의 스프링**. 축 핀 둘로 코어에 걸리고, 곡면 판이 채널 안으로
    튀어나와 있다. 폰을 넣으면 뒤로 밀리며 그 탄성이 무는 힘이 된다.
    검정 폼이 붙는 배(belly)가 폰에 닿는 면이다.

    🔴 C 껍데기는 스프링이 아니다 — 그냥 케이스다(사용자 확인). 껍데기를
       판스프링으로 보고 만들었던 건 틀렸고, 그러면 채널 폭이 고정이 아니게 된다."""
    # 🔴 혀는 **등 쪽(껍데기 쪽)** 에 붙어 폰을 코어 벽으로 민다.
    #    코어 쪽에 두면 폰을 바깥으로 밀어내 화면이 코어에서 떠, 카메라~거울
    #    거리(16mm)가 폰 두께마다 달라진다.
    #
    #    🔴 모양은 **활**이다. 위 끝만 핀으로 걸고 아래 끝은 코어 홈에서 미끄러진다.
    #       폰이 밀면 활이 펴지며(R 이 커지며) 아치 전체가 나눠 버틴다.
    z_top = ROCK_Z + TONGUE_C / 2
    z_bot = ROCK_Z - TONGUE_C / 2
    y_chord = CHANNEL - 0.6                       # 현이 놓인 자리 (껍데기 쪽 벽)
    sag = GRIP_FREE_SAG                           # 쉴 때 배부름

    N = 18
    def curve(off):
        pts = []
        for i in range(N + 1):
            u = i / N
            z = z_top + (z_bot - z_top) * u
            # 원호를 현 기준 사인 근사로 — 곡률이 고르다
            y = y_chord - sag * math.sin(math.pi * u)
            pts.append((y + off, z))
        return pts

    leaf = (cq.Workplane("YZ").workplane(offset=-TONGUE_W / 2)
            .polyline(curve(0.0) + list(reversed(curve(TONGUE_T))))
            .close().extrude(TONGUE_W))

    # 축 핀 — 뿌리에서 양옆으로. 코어 베어링에 걸린다.
    for sx in (-1, 1):
        leaf = leaf.union(cq.Workplane("YZ")
                          .workplane(offset=sx * TONGUE_W / 2)
                          .center(CHANNEL - 0.6, ROCK_Z + TONGUE_C / 2).circle(PIN_D / 2)
                          .extrude(sx * (BEAR_T + CLR)))
    return leaf


def mirror_glass():
    return _case_rot(cq.Workplane("XY")
                     .box(MIR_W, MIR_T, MIR_H, centered=(True, False, True))
                     .translate((0, CASE_T / 2 - MIR_T, 0)))


def case_back():
    back = (cq.Workplane("XY")
            .box(CASE_W, CASE_T / 2, CASE_H, centered=(True, False, True))
            .translate((0, -CASE_T / 2, 0))
            .edges("|Y").fillet(EDGE_R))
    back = back.cut(cq.Workplane("XY")
                    .box(MIR_W - 4.0, CASE_T / 2 - WALL, MIR_H - 4.0,
                         centered=(True, False, True))
                    .translate((0, -CASE_T / 2 + WALL, 0)))
    # 🔴 앞판 융착 리브가 들어갈 홈 — 안 파면 살이 겹쳐 안 덮인다
    back = back.cut(cq.Workplane("XY")
                    .rect(CASE_W - 1.6, CASE_H - 1.6).extrude(WELD_H + CLR)
                    .cut(cq.Workplane("XY").rect(CASE_W - 3.8, CASE_H - 3.8)
                         .extrude(WELD_H + CLR))
                    .rotate((0, 0, 0), (1, 0, 0), 90))
    back = _case_rot(back).cut(light_cone())      # 🔴 뒤판도 통로를 비운다
    # 🔴 코어를 CLR 만큼 키워 빼낸다 — 홈만 파서는 살이 계속 겹쳤다(실측 0.313 cm³)
    return back.cut(core().faces().shell(CLR) if False else core())


PARTS = {
    "core":         core,          # 사출 ABS — 거울을 든다 · 안 휜다
    "spring_shell": spring_shell,  # 사출 PP/POM — 판스프링 + 로고
    "rocker_pad":   rocker_pad,    # 사출 — 회전 패드 (폼 부착)
    "case_back":    case_back,     # 사출 — 거울 뒤판 (융착)
    "mirror_glass": mirror_glass,  # 구매 — 표면반사경
}

STEPS = [
    ("core",         (0, 0, 0),     "코어를 지그에 올린다 (리브가 촘촘한 쪽이 안)"),
    ("rocker_pad",   (0, -55, 0),   "회전 패드를 창 안으로 넣고 축 핀을 소켓에 끼운다"),
    ("mirror_glass", (0, -70, 45),  "표면반사경을 앞판 자리에 앉힌다 (반사면이 창 쪽)"),
    ("case_back",    (0, -70, 45),  "뒤판을 덮고 초음파 융착 — 이제 열리지 않는다"),
    ("spring_shell", (0, 95, 0),    "C 판스프링을 코어 고리에 걸어 덮는다"),
]


def report():
    down, want = check_optics()
    h, v = fov()
    ok = "일치" if abs(down - want) < 0.05 else "⚠ 어긋남"
    return "\n".join([
        "탱고 잠망경 반사경 — 오스모 구조 (유아용)", "=" * 48,
        f"  거울각 μ {MU:.0f}°   코어가 든다 · 금형 고정",
        f"  기기 기울기 {PAD_TILT:.0f}°  거치대가 정한다 · 조절 손잡이는 여기",
        "",
        f"  🔎 검산   모델 거울로 반사시킨 하향각  {down:.1f}°",
        f"           시뮬 공식 (기울기 + 2μ − 90)  {want:.1f}°   → {ok}",
        "",
        f"  화각     가로 {h:.1f}° · 세로 {v:.1f}°   (창 {APER_W:.0f}×{APER_H:.0f} @ {CAM_GAP:.0f}mm)",
        f"  코어     {CORE_W:.0f} × {CORE_D:.0f} × {CORE_H:.0f} mm  (리브 {RIB:.1f}mm)",
        f"  스프링   살 {SH_WALL:.1f}mm · 기준 간격 {GRIP_NOM:.0f}mm",
        f"  회전패드 {ROCK_W:.0f} × {ROCK_H:.0f} · 축 ø{PIN_D:.1f}",
        "",
        "  역할 분리 — 이게 이 설계의 전부다",
        "   ① 코어      안 휜다 → 거울각이 안 흔들린다 (거울 1도 = 시선 2도)",
        "   ② C 껍데기   휜다 → 두께를 흡수한다 (거울과 무관한 곳에서)",
        "   ③ 회전 패드  돈다 → 어떤 두께에서도 면으로 닿는다",
        "",
        "  유아 안전",
        "   · 거울은 케이스 안에 갇힌다 — 유리 모서리 노출 0 (오스모는 노출)",
        "   · 광학 창이 반사면보다 안으로 들어가 손가락이 안 닿는다",
        "   · 초음파 융착 — 나사 없음, 아이가 못 연다",
        "   · 아크릴 표면반사경 권장 (유리는 깨지면 파편)",
        "",
        "  🔴 치수는 사진에서 비율로 잡았다. 실측이 오면 CORE_W · CORE_D · GRIP_NOM",
        "     세 개만 고치면 나머지는 따라 나온다. 광학 값은 시뮬 실측이라 그대로 둔다.",
    ])


def main():
    os.makedirs(OUT, exist_ok=True)
    print(report(), "\n")
    for n, f in PARTS.items():
        try:
            s = f()
            cq.exporters.export(s, os.path.join(OUT, n + ".step"))
            cq.exporters.export(s, os.path.join(OUT, n + ".stl"))
            b = s.val().BoundingBox()
            print(f"  {n:14s} {s.val().Volume()/1000:6.2f} cm³  "
                  f"{b.xlen:5.1f} × {b.ylen:5.1f} × {b.zlen:5.1f} mm")
        except Exception as e:
            print(f"  {n:14s} 실패: {e}")
    with open(os.path.join(OUT, "report.txt"), "w", encoding="utf-8") as fp:
        fp.write(report() + "\n")


if __name__ == "__main__":
    main()
