# -*- coding: utf-8 -*-
"""탱고 잠망경 반사경 — **3D 프린팅용 단순화판**

실행:  python printable.py          → out/print_*.stl (+ .step)

────────────────────────────────────────────────────────────────────────
🔴 사출용 분할을 걷어냈다. 프린팅은 규칙이 다르다.

  버린 것        왜
  ──────────    ─────────────────────────────────────────────
  케이스 뒤판     초음파 융착을 집에서 못 한다 → 거울은 **슬롯에 밀어 넣는다**
  C 껍데기 분리   금형 두 벌·수지 두 종을 쓰려던 것 → 프린팅은 **한 몸으로**
  융착 리브       위와 같은 이유
  구배(draft)    금형에서 빼려던 것 → 프린팅엔 불필요
  보강 리브       벽을 조금 두껍게 하는 게 낫다

  남은 것 = **몸체 + 혀**, 둘뿐. 거기에 거울(구매)과 폼(선택).

🔴 무는 범위를 6~13mm 로 좁혔다. 5~14mm(10mm 밀림)를 PETG 1.0mm 로 받으면
   변형률이 3%를 넘는다. 폰 대부분이 7~9mm, 케이스 껴도 13mm 안이다.

🔴 프린팅 방향
   몸체 — **뒤(껍데기 바깥면)를 바닥에 눕혀서**. 거울 경사면이 위를 보고,
          채널 입구가 옆으로 열려 서포트가 거의 없다.
   혀   — **폭을 세워서**. 한 층 한 층이 활 모양 그 자체가 되고 굽힘이 층 **안에서**
          걸린다. 🔴 여기 「눕혀라」라고 적어 두었던 건 **틀렸다** — 서포트를 재 보니
          눕히면 523mm², 세우면 33mm² 였다(plate.py 의 overhang_area). 측정이
          조언을 뒤집었는데 plate.py 만 고치고 이 파일이 옛말을 들고 있었다.
   재질 — 혀는 **PETG**(PLA 는 잘 부러진다). 몸체는 아무거나.
────────────────────────────────────────────────────────────────────────
"""

import math, os
import cadquery as cq

# ── 광학 (reflector.py 와 같은 값 — 시뮬 실측에서 나온 것)
MU        = 33.0
PAD_TILT  = 80.0
# 🔴 거울은 **폰 앞에 최대한 붙인다**. 16mm 는 시뮬 슬라이더 값이지 지켜야 할
#    값이 아니었다 — 가까울수록 같은 화각을 **작은 거울**로 내고 부품이 통째로 작아진다.
#    9mm 에서 창 14×8 이면 16mm·창 25×14 와 같은 화각(76°×40°)이다.
CAM_GAP   = 9.0
CAM_DROP  = 8.0
APER_W, APER_H = 14.0, 8.0           # 실제 구멍 = 창
MIR_W, MIR_H, MIR_T = 17.0, 11.0, 1.1   # 창 + 사방 1.5mm 테두리

# ── 무는 범위 (프린팅용으로 좁혔다)
# 🔴 쉴 때 틈을 6 으로 올렸다 — 혀가 거울 밑면에서 끝나야 해서 짧아졌고(현 14mm),
#    🔴 그리고 상한이 11mm 로 내려간다. 활이 **완전히 펴지면** 곡률이 0 이라
#       곡률 변화가 최대가 된다 — 배부름을 2mm 쯤 남겨야 한다(11mm 에서 2.7%).
#       이게 「거울 밑면에서 끊기」의 대가다. 맨몸 폰(7~9)과 얇은 케이스는 덮지만
#       두꺼운 케이스는 안 들어간다. 넓히려면 몸체를 거울 아래로 더 내려야 한다.
GRIP_MIN, GRIP_MAX = 7.0, 11.0

# ── 혀 (누르는 판) + 폼 (스프링)
# 🔴 **판과 스프링을 나눈다** — 오스모 실물이 「축 핀 2개 + 검정 폼 + 곡면 판」이다.
#    예전엔 판 자체가 스프링이라 두께가 곧 힘이고 곧 응력이었다: 0.8mm 를 넘기면
#    변형률이 터지고, 얇으니 판이 뒤틀렸다. 힘을 폼에 넘기면 그 매듭이 풀린다.
#    → 판은 **두껍고 뻣뻣하게**(1.6), 힘은 **폼 두께로** 조절한다. 시험 인쇄로
#      두께 4종을 뽑아 고르던 일도 없어진다(폼 테이프를 바꿔 끼우면 된다).
PLATE_T   = 1.6                      # 누르는 판 — 0.4 노즐에서 벽 4줄, 안 휜다
PLATE_W   = 22.0
RIB_T     = 3.2                      # 🔴 경첩 쪽 리브 — 실물도 힌지 모서리만 굵다
RIB_H     = 4.0                      #    뿌리 비틀림을 여기서 받는다
PIN_D     = 3.0                      # 프린팅이라 굵게
FOAM_FREE = 10.0                     # 폼 테이프 자유 두께 (10mm 규격품)
FOAM_MIN  = 3.0                      # 제일 두꺼운 폰에서 남는 두께 (70% 압축)
# 🔴 채널 폭은 이제 **폼에서 파생**된다 — 손으로 안 적는다.
CHANNEL   = GRIP_MAX + PLATE_T + FOAM_MIN
GRIP_FREE = CHANNEL - PLATE_T - FOAM_FREE   # 쉴 때 판 앞면이 서는 자리

# ── 사출·프린팅 공통
WALL      = 2.4                      # 프린팅이라 두툼하게
CLR       = 0.45                     # 프린팅 공차는 사출보다 넉넉히

# ── 몸체
BODY_W    = 42.0
# 🔴 눈대중 +4 로 박았다가 **거울이 앞면 밖으로 0.9mm 튀어나왔다** — 아이 물건에
#    유리 모서리가 드러나는 상태였다. 거울은 33° 로 누워 Y 로 두껍게 차지하므로
#    **거울의 실제 Y 반경에서 파생**시킨다. 손으로 적지 않는다.
_MIR_HALF_Y = (MIR_H / 2) * math.sin(math.radians(90 - MU)) + MIR_T / 2
BODY_D    = CAM_GAP + _MIR_HALF_Y + WALL + 0.6
# 🔴 몸체는 **거울 밑면에서 끝난다**. 그 아래로 좌우에 살이 남으면 화각을 깎고,
#    오스모 실물도 거기서 끊긴다. 값은 거울 자세에서 파생시킨다(손으로 안 적는다).
# 🔴 거울 밑면보다 LIP 만큼 더 내린다 — 안 그러면 **유리 모서리가 바닥면에 드러난다**
#    (아이 물건이다). 그렇다고 통으로 내리면 화각을 깎으므로, 내려놓고 **빛 통로를
#    파내서** 광선이 지나는 데만 비운다. 남는 살은 광선 밖이라 안전하다.
LIP       = 2.2
BODY_H    = CAM_DROP + (MIR_H / 2) * math.cos(math.radians(90 - MU)) + LIP
EDGE_R    = 1.5

# ── 파생 (거울 자세에서 나온다)
MIR_BOT   = -(CAM_DROP + (MIR_H / 2) * math.cos(math.radians(90 - MU)))
MIR_TOP   = -(CAM_DROP - (MIR_H / 2) * math.cos(math.radians(90 - MU)))

# ── 혀 자리 — 🔴 **거울 위에서만** 잡는다 (오스모 실물 구조)
# 🔴 예전엔 혀가 거울 옆까지 내려왔다(z −0.9 ~ −11.0). 오스모는 그러지 않는다 —
#    거울 앞과 옆은 통째로 비워 두고 **거울 위 구간에서만** 기기를 문다.
#    그래서 위쪽이 길어야 한다. 지붕 높이를 손으로 적지 않고 **혀 길이에서 파생**시킨다.
# 🔴 그리고 혀는 **아래쪽 끝**으로 문다(배가 아니라). 실물 혀는 위에서 아래로
#    비스듬히 기울어 내려오고, 제일 안쪽으로 나온 데가 **끝**이다. 배로 물면
#    닿는 자리가 폰 두께에 따라 위아래로 미끄러진다.
# 🔴 **혀 끝은 폰 얼굴 위에 있어야 한다.** 「거울 위에서만 문다」를 z 로 옮겨
#    혀 끝을 거울 꼭대기(−4.5)에 뒀더니, 폰 윗변이 z −1 이라 **무는 구간이 3mm** 뿐이었다.
#    그건 무는 게 아니라 윗변에 얹힌 것이다.
#    🔴 「거울 앞을 비워라」는 **앞쪽(y<0)** 이야기다. 혀는 채널 뒤(y 6~13)에 있어서
#       애초에 거울을 가릴 수 없다 — 높이로 피할 일이 아니었다.
PHONE_TOP  = -1.0                    # 폰 윗변이 닿는 자리 (지붕 밑 여유 1mm)
GRIP_DEEP  = 8.5                     # 폰 윗변에서 이만큼 내려간 데를 문다
#    ⚠ 10.0 이면 말린 끝(반지름 2.1)이 몸체 밑면 밖으로 0.1mm 만 남기고 나온다.
TONGUE_BOT = PHONE_TOP - GRIP_DEEP   # 혀 끝 = 무는 자리
TONGUE_TOP = 11.5                    # 축 — 위를 길게 (오스모처럼)
TONGUE_C   = TONGUE_TOP - TONGUE_BOT # 혀 현 길이
TONGUE_Z   = (TONGUE_TOP + TONGUE_BOT) / 2
# 🔴 축을 지붕 높이에 놓으면 **핀 반지름만큼 지붕을 뚫고 나온다**(실측 1.5mm).
ROOF      = TONGUE_TOP + PIN_D / 2 + WALL

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")


def fov():
    return (2 * math.degrees(math.atan((APER_W / 2) / CAM_GAP)),
            2 * math.degrees(math.atan((APER_H * math.cos(math.radians(MU)) / 2) / CAM_GAP)))


def mirror_center():
    return (0.0, -CAM_GAP, -CAM_DROP)


def _tilt(shape):
    c = mirror_center()
    return shape.rotate((0, 0, 0), (1, 0, 0), -(90.0 - MU)).translate(c)


def light_cone(length=70.0):
    """거울에서 **나가는** 길만. 들어오는 길은 `light_in()` 이다 — `light_path()` 를 써라."""
    mu = math.radians(MU)
    dy, dz = -math.cos(2 * mu), -math.sin(2 * mu)
    h, v = fov()
    start = 2.0
    w0 = APER_W + 2 * start * math.tan(math.radians(h / 2))
    h0 = APER_H + 2 * start * math.tan(math.radians(v / 2))
    w1 = APER_W + 2 * length * math.tan(math.radians(h / 2))
    h1 = APER_H + 2 * length * math.tan(math.radians(v / 2))
    phi = math.degrees(math.atan2(-dy, dz))
    return (cq.Workplane("XY").workplane(offset=start)
            .rect(w0, h0).workplane(offset=length - start).rect(w1, h1).loft()
            .rotate((0, 0, 0), (1, 0, 0), phi)
            .translate((0, -CAM_GAP, -CAM_DROP)))


def light_in():
    """🔴 **카메라에서 거울까지**. 여기를 안 파서 모델이 통째로 안 되는 상태였다 —
    채널 앞벽(두께 WALL)이 카메라 정면을 막고 있었고, 잘린 단면(4.17×2.57)이 그
    자리의 광추와 정확히 같았다. 즉 일부가 아니라 **전부** 막혀 있었다.

    🔴 여태 못 잡은 이유: `light_cone()` 은 거울에서 **나가는 쪽만** 판다(y −65~−5.5).
       그런데 검사는 `몸체 ∩ light_cone` 을 봤고, body() 가 그 통로를 잘라내므로
       **무슨 짓을 해도 0 이 나온다**. 검사가 아니라 항등식이었다.
    🔴 원뿔이 아니라 **각기둥**으로 판다 — 카메라 자리가 폰마다 몇 mm 씩 다르고,
       딱 맞는 원뿔로 파면 그 어긋남이 곧 비네팅이 된다. 창 크기로 곧게 뚫는다.
    ⚠ `Workplane("XZ").extrude()` 로 만들지 말 것 — 부호를 어느 쪽으로 줘도
       **채널 안쪽으로** 뻗어서(실측 폰과 952mm³ 겹침) 정작 벽은 안 판다.
       y 범위를 손으로 정할 수 있는 box 로 만든다."""
    return (cq.Workplane("XY")
            .box(APER_W, CAM_GAP + 0.5, APER_H, centered=(True, False, True))
            .translate((0, -CAM_GAP, -CAM_DROP)))


def light_path(length=70.0):
    """빛이 지나는 길 전부 — 들어오는 길 + 나가는 길. 어떤 살도 여기 있으면 못 본다."""
    return light_in().union(light_cone(length))


# ─────────────────────────────────────────── 부품 1. 몸체 (한 덩어리)

def body():
    """쐐기 + ∩ 다리가 **한 몸**. 프린팅이라 나눌 이유가 없다."""
    hw = BODY_W / 2
    y_back = CHANNEL + WALL          # 뒷다리 바깥면

    # ∩ 바깥 — 앞(쐐기) 에서 뒤(다리) 까지 한 덩어리
    outer = (cq.Workplane("XY")
             .box(BODY_W, y_back + BODY_D, BODY_H + ROOF, centered=(True, False, False))
             .translate((0, -BODY_D, -BODY_H))
             .edges("|X").fillet(EDGE_R * 2))

    # 폰이 들어오는 채널 — 아래로 열린다.
    # 🔴 **지붕 밑까지 뚫는다.** 혀가 폰 윗변보다 위(z 0~TONGUE_TOP)에 몸을 두고
    #    끝만 내려와 무는 구조라, 예전처럼 z −1 에서 끊으면 혀가 살 속에 갇힌다.
    ch_top = ROOF - WALL
    outer = outer.cut(cq.Workplane("XY")
                      .box(BODY_W + 2, CHANNEL, ch_top + BODY_H + 1, centered=(True, False, False))
                      .translate((0, 0, -BODY_H - 1)))

    # 🔴 앞은 **막는다** — 밖(아이 쪽)에서 거울이 보이면 안 된다. 오스모도 매끈한
    #    껍데기로 덮여 있고, 빛은 **아래로만** 나간다(거울이 판을 내려다보니까).
    #    속만 파고 앞면 살은 남긴다.
    outer = outer.cut(cq.Workplane("XY")
                      .box(BODY_W - 2 * WALL, BODY_D - 2 * WALL, BODY_H - WALL,
                           centered=(True, False, False))
                      .translate((0, -BODY_D + WALL, -BODY_H)))

    # 🔴 「혀 창」은 뚫지 않는다. 혀는 채널 안(Y 4~14)에 있어서 앞쪽 벽을 지날 일이
    #    없다 — 혀가 앞에 있던 옛 설계의 잔재였다. 뚫어 두니 앞에서 채널 속이
    #    들여다보였다(칸막이가 43%만 남아 있었다).

    # 혀 축 구멍 — 옆에서 핀을 밀어 넣는다
    for sx in (-1, 1):
        outer = outer.cut(cq.Workplane("YZ").workplane(offset=sx * (PLATE_W / 2 + CLR))
                          .center(CHANNEL - 1.0, TONGUE_Z + TONGUE_C / 2)
                          .circle(PIN_D / 2 + CLR).extrude(sx * 8.0))

    # 거울 슬롯 — 옆에서 밀어 넣는다(융착 없이)
    slot = (cq.Workplane("XY")
            .box(MIR_W + 2 * CLR, MIR_T + 2 * CLR, MIR_H + 2 * CLR,
                 centered=(True, True, True)))
    entry = (cq.Workplane("XY")
             .box(BODY_W, MIR_T + 2 * CLR, MIR_H + 2 * CLR, centered=(False, True, True)))
    outer = outer.cut(_tilt(slot)).cut(_tilt(entry))

    return outer.cut(light_path())


# ─────────────────────────────────────────── 부품 2. 혀 (활 스프링)

def tongue():
    """활. 🔴 **폭을 세워서 뽑는다**(plate.py 가 서포트를 재서 정한 것 — 눕히면 523mm²,
    세우면 33mm²). 층 하나하나가 활 그 자체가 되어 굽힘이 층 안에서 걸린다."""
    z_top = TONGUE_TOP
    z_bot = TONGUE_BOT
    y_chord = CHANNEL - 1.0
    sag = y_chord - GRIP_FREE

    # 🔴 사분원이다(반원이 아니다). 예전엔 sin(π·t) 라 **한가운데가 제일 튀어나오고
    #    양 끝이 벽에 붙었다** — 배로 무는 모양이다. 오스모 혀는 축에서 아래로
    #    기울어 내려와 **끝이 제일 안쪽**이고, 거기 하나로만 닿는다.
    N = 20
    def curve(off):
        return [(y_chord - sag * math.sin(math.pi / 2 * (i / N)) + off,
                 z_top + (z_bot - z_top) * (i / N)) for i in range(N + 1)]

    leaf = (cq.Workplane("YZ").workplane(offset=-PLATE_W / 2)
            .polyline(curve(0.0) + list(reversed(curve(PLATE_T))))
            .close().extrude(PLATE_W))

    # 🔴 **경첩 쪽 리브** — 실물 오스모 혀도 힌지 모서리만 굵고 스팬은 얇다.
    #    판이 힘을 안 내게 됐어도 **비틀림**은 받는다(폰이 한쪽으로 기울어 들어올 때).
    #    축 바로 아래에 살을 얹어 그 비틀림을 여기서 받는다.
    leaf = leaf.union(cq.Workplane("YZ").workplane(offset=-PLATE_W / 2)
                      .center(y_chord - RIB_T / 2 + PLATE_T / 2, z_top - RIB_H / 2)
                      .rect(RIB_T, RIB_H).extrude(PLATE_W)
                      .edges("|X").fillet(0.8))

    # 🔴 **끝을 만다.** 실물 오스모 혀는 자유단이 둥글게 말려 있고, 우리 건 0.8mm
    #    **날 그대로** 폰 등을 눌렀다 — 자국이 난다. 사진과 나란히 놓고서야 보였다.
    #    앞으로 나온 정도(GRIP_FREE)는 그대로 두려고, 원기둥 중심을 반지름만큼 뒤에 둔다.
    lip_r = PLATE_T + 0.5
    leaf = leaf.union(cq.Workplane("YZ").workplane(offset=-PLATE_W / 2)
                      .center(GRIP_FREE + lip_r, TONGUE_BOT)
                      .circle(lip_r).extrude(PLATE_W))

    for sx in (-1, 1):
        leaf = leaf.union(cq.Workplane("YZ").workplane(offset=sx * PLATE_W / 2)
                          .center(y_chord, z_top).circle(PIN_D / 2)
                          .extrude(sx * 3.0))
    return leaf


def mirror():
    return _tilt(cq.Workplane("XY").box(MIR_W, MIR_T, MIR_H,
                                        centered=(True, True, True)))


def foam():
    """폼 테이프 — **프린팅하지 않는다**(사서 붙인다). 뒷다리 안쪽에 붙는다."""
    return (cq.Workplane("XY")
            .box(PLATE_W, FOAM_FREE, TONGUE_TOP - TONGUE_BOT - 4.0,
                 centered=(True, False, False))
            .translate((0, CHANNEL - FOAM_FREE, TONGUE_BOT + 2.0)))


PARTS = {"print_body": body, "print_tongue": tongue, "print_mirror": mirror}


# ─────────────────────────────────────────── 검산 · 조립 영상

def check_optics():
    """🔴 모델링한 거울로 **실제 반사를 계산**한다 — 하향각을 손으로 적지 않는다."""
    a = math.radians(MU)
    n = (0.0, math.sin(a), -math.cos(a))          # 거울 법선 (로컬)
    t = math.radians(PAD_TILT)
    up_w = (0.0, math.cos(t), math.sin(t))
    back_w = (0.0, math.sin(t), -math.cos(t))     # 로컬 +Y (시뮬 rigGeometry 규약)
    out_w = tuple(-x for x in back_w)
    nw = tuple(n[0] * ax + n[1] * bx + n[2] * cx
               for ax, bx, cx in zip((1, 0, 0), back_w, up_w))
    dot = sum(p * q for p, q in zip(out_w, nw))
    r = tuple(p - 2 * dot * q for p, q in zip(out_w, nw))
    return (math.degrees(math.atan2(-r[2], math.hypot(r[0], r[1]))),
            PAD_TILT + 2 * MU - 90.0)


PHONE_T = (GRIP_MIN + GRIP_MAX) / 2      # 무는 범위 한가운데


def phone():
    """🔴 **프린팅하지 않는다** — 조립 영상에서 「어디에 씌우는지」를 보여주는 몸이다.
    그래서 PARTS 에는 없고 SHOW 에만 있다. 윗변은 PHONE_TOP 에 앉는다."""
    return (cq.Workplane("XY")
            .box(72.0, PHONE_T, 90.0, centered=(True, False, False))
            .translate((0, 0, PHONE_TOP - 90.0))
            .edges("|Y").fillet(6.0))


def grip_span():
    """🔴 **혀가 폰을 무는 길이(mm)**. 이 숫자가 없어서 혀가 폰 윗변에 얹히기만 하는
    상태를 못 잡았다(무는 구간 3mm). 혀 곡선의 y 가 폰 등(PHONE_T)보다 앞에 있고,
    동시에 폰이 있는 높이(z ≤ PHONE_TOP)인 구간의 길이를 잰다."""
    y_chord = CHANNEL - 1.0
    sag = y_chord - GRIP_FREE
    lo = hi = None
    N = 400
    for i in range(N + 1):
        t = i / N
        y = y_chord - sag * math.sin(math.pi / 2 * t)
        z = TONGUE_TOP + (TONGUE_BOT - TONGUE_TOP) * t
        if z <= PHONE_TOP and y < PHONE_T:
            lo = z if lo is None else min(lo, z)
            hi = z if hi is None else max(hi, z)
    return 0.0 if lo is None else hi - lo


SHOW = dict(PARTS, foam=foam, phone=phone)   # 영상에 나오는 것 = 부품 + 폼 + 폰

# 🔴 조립 순서는 **여기 한 곳**에서 온다. 영상 스크립트가 제 목록을 들고 있으면
#    모델을 고쳐도 영상이 안 따라온다 — 실제로 그렇게 갈라져서, 자막은 2부품
#    프린팅 이야기를 하는데 화면에는 옛 사출 부품(초록 rocker_pad)이 스쳤다.
# 🔴 벌어지는 방향은 **실제로 들어가는 방향**이어야 한다. 거울 슬롯은 +X 쪽으로
#    열려 있고(body() 의 entry), 혀와 폰은 아래로 열린 채널로 들어간다.
#    옛 영상은 셋 다 위에서 내려와서 자막과 그림이 서로 다른 말을 했다.
STEPS = [
    ("print_body",   (0, 0, 0),    "몸체 — 프린팅 한 덩어리"),
    ("print_tongue", (0, 0, -48),  "혀를 아래에서 채널로 넣고 핀을 축 구멍에 끼운다"),
    ("print_mirror", (62, 0, 0),   "거울 17×11 을 옆에서 슬롯으로 밀어 넣는다"),
    ("phone",        (0, 0, -75),  "폰 윗변을 채널에 끼운다 — 혀가 눌리며 문다"),
]


def foam_squeeze():
    """폼이 얼마나 눌리나 (%). 🔴 **변형률 계산은 이제 없다** — 판이 스프링이 아니다.
    힘은 폼이 내므로 볼 것은 「폼이 살아 있는 압축 범위 안에 있나」뿐이다.
    폴리우레탄 폼은 70% 까지는 눌러도 되살아나고, 그 위로는 바닥을 친다."""
    lo = (FOAM_FREE - (CHANNEL - PLATE_T - GRIP_MIN)) / FOAM_FREE * 100
    hi = (FOAM_FREE - (CHANNEL - PLATE_T - GRIP_MAX)) / FOAM_FREE * 100
    return lo, hi



def main():
    os.makedirs(OUT, exist_ok=True)
    h, v = fov()
    print("탱고 잠망경 반사경 — 3D 프린팅용")
    print("=" * 60)
    print(f"  부품 2개 + 거울(구매)   |   거울 {MIR_W:.0f}×{MIR_H:.0f} · 창 {APER_W:.0f}×{APER_H:.0f}")
    print(f"  거울각 {MU:.0f}° → 하향 {PAD_TILT + 2*MU - 90:.0f}°   화각 {h:.0f}° × {v:.0f}°")
    print(f"  무는 두께 {GRIP_MIN:.0f}~{GRIP_MAX:.0f}mm · 쉴 때 틈 {GRIP_FREE:.0f}mm")
    lo, hi = foam_squeeze()
    print(f"  폼 압축 {lo:.0f}~{hi:.0f}%  (자유 {FOAM_FREE:.0f}mm · 판 {PLATE_T:.1f}mm)"
          f"  {'OK' if hi <= 72 and lo >= 5 else '⚠ 폼 두께를 다시'}")
    g = grip_span()
    print(f"  혀가 무는 길이 {g:.1f}mm  (혀 끝 z {TONGUE_BOT:.1f} · 폰 윗변 z {PHONE_TOP:.1f})"
          f"  {'OK' if g >= 6.0 else '⚠ 윗변에 얹히기만 한다'}")
    print()
    print("  프린팅")
    print("   · 몸체 — 뒤를 바닥에 눕혀서. 서포트 거의 없음")
    print("   · 혀   — 폭을 세워서. 서포트 33mm² (눕히면 523). PETG 권장")
    print("   · 거울 — 옆 슬롯으로 밀어 넣는다 (융착 없음)")
    print()
    # 🔴 **밖으로 나온 부품이 있나** — 아이 물건이라 이게 제일 중요하다.
    #    거울만 재다가 혀가 지붕을 1.5mm 뚫고 나온 걸 놓쳤다(축을 지붕 높이에 뒀다).
    #    그래서 **몸체 말고 전부** 잰다. 눈으로는 안 걸리는 종류다.
    bb = body().val().BoundingBox()
    print("  밖으로 나온 데가 있나 — 몸체 안으로 얼마나 들어가 있나 (mm)")
    allok = True
    for nm, fn in (("거울", mirror), ("혀", tongue)):
        o = fn().val().BoundingBox()
        r = [("앞", o.ymin - bb.ymin), ("뒤", bb.ymax - o.ymax),
             ("아래", o.zmin - bb.zmin), ("위", bb.zmax - o.zmax),
             ("좌", o.xmin - bb.xmin), ("우", bb.xmax - o.xmax)]
        bad = [n for n, v in r if v < 0.2]
        allok = allok and not bad
        print(f"   {nm:3s} " + "  ".join(f"{n} {v:5.2f}" for n, v in r)
              + ("   OK" if not bad else "   ★ " + "·".join(bad) + " 쪽이 나왔다"))
    print(f"   {'전부 안에 있다' if allok else '⚠ 고칠 것'}")
    print()

    # 🔴 빛 통로 검사 — **들어오는 길과 나가는 길을 따로** 잰다.
    #    예전엔 나가는 길만 재고, 게다가 그걸 `몸체 ∩ light_cone` 으로 봤다.
    #    body() 가 그 통로를 잘라내므로 **항상 0** 이다 — 검사가 아니라 항등식이었다.
    #    그 사이 채널 앞벽(두께 WALL)이 카메라 정면을 통째로 막고 있었고 아무도 몰랐다.
    #    이제 **폰까지 포함해** 두 구간을 다 잰다. 폰은 잘라낼 수 없으니 진짜 검사다.
    def _vol(s):
        try:
            return sum(so.Volume() for so in s.val().Solids())
        except Exception:
            return 0.0

    inb, outb = light_in(), light_cone()
    print("  빛이 지나는 길을 막는 게 있나 (mm³ · 0 이어야 한다)")
    ok_light = True
    for nm, sh in (("몸체", body()), ("혀", tongue()), ("폰", phone())):
        # 폰은 채널 쪽 0.5mm 를 일부러 물고 있다(벽을 뚫으려면 통로가 폰에 닿아야 한다)
        allow = APER_W * APER_H * 0.5 + 1.0 if nm == "폰" else 0.5
        a, b2 = _vol(inb.intersect(sh)), _vol(outb.intersect(sh))
        bad = (a > allow) or (b2 > 0.5)
        ok_light = ok_light and not bad
        print(f"   {nm:3s}  들어오는 길 {a:7.1f}   나가는 길 {b2:7.1f}"
              + ("   OK" if not bad else "   ★ 막는다"))
    print(f"   {'통로 깨끗하다' if ok_light else '⚠ 고칠 것'}")
    print()

    for n, f in PARTS.items():
        s = f()
        cq.exporters.export(s, os.path.join(OUT, n + ".stl"))
        cq.exporters.export(s, os.path.join(OUT, n + ".step"))
        b = s.val().BoundingBox()
        print(f"  {n:14s} {b.xlen:5.1f} × {b.ylen:5.1f} × {b.zlen:5.1f} mm")


if __name__ == "__main__":
    main()
