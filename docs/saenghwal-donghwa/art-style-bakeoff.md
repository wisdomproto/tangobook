# 호리네 생활동화 — 그림체 확정 bake-off

45권 라인의 그림체(artStyle)를 정하기 위한 스타일 비교. "너무 뻔한 2D 말고 아이한테 확 먹히는" 그림체가 목표.

> **방법론**: 호리 골든 컷(외형·포즈·레이아웃 고정) + **스타일 블록만 교체**해서 공정 비교. 생성 스크립트 = [`scripts/hori-style-bakeoff.mjs`](../../scripts/hori-style-bakeoff.mjs) (`/api/images/character` 호출, 서버 :3500 필요). `ONLY=키1,키2` 로 일부만 재생성.

## 검증 근거 (실제 대박 유아 IP 그림체)
- **진짜 3D CG**: 코코멜론(구독 2억·조회 2,200억)·베베핀·뽀로로·타요
- **단순 2D**: 아기상어/핑크퐁(역대 최다 조회 150억+, *3D 아님* — 단순 2D+그라데이션)·페파피그·블루이
- **과슈·수채(질감/painterly)**: 수상작 그림책·명작(피터래빗·구름빵) = 부모신뢰·롱런, 바이럴 엔진은 아님
- 발달과학: 유아 시각은 고대비·큰눈·둥근형·선명한 색·또렷한 형상을 가장 쉽게 처리 → 입체(3D)·볼드단순(2D)이 이 "또렷함" 극대화

## 후보 6종 (2026-07-05 생성·평가)

| 키 | 그림체 | 확 먹힘 | 독창성 | 45권 확장·일관성 | 브랜드(명작·안티AI) |
|---|---|---|---|---|---|
| A | 색연필/과슈 질감 | ★★★ | ★★★ | ★★ | ★★★★ |
| **B** | **니들펠트(수공예 인형)** | ★★★★★ | ★★★★★ | ★★ | ★★★★★ |
| C | 플랫 벡터 | ★★★ | ★★ | ★★★★★ | ★★ |
| D | 수채+색연필 | ★★ | ★★★ | ★★ | ★★★★★ |
| E | 매끈 3D CG(코코멜론 룩) | ★★★★ | ★★★ | ★★★★ | ★★★ |
| **F** | **아기상어식 2D+그라데이션** | ★★★★ | ★★ | ★★★★★ | ★★★ |

## ✅ 확정: B 니들펠트 (2026-07-05)

**그림체 = B 니들펠트(양모 인형) 스톱모션 룩** 으로 확정. 독창성·소유가능·"손으로 만든 듯한" 수공예감(안티-AI 포지셔닝과 정합)·굿즈(인형) 직결이 결정 근거. 장면 확장 일관성 리스크는 캐릭터 레퍼런스 시트(@image1~8) 고정 + 통일 STYLE 블록으로 관리한다.

**🔴 STYLE 블록 SSOT (live 생성 지점)**:
- 장면 프롬프트 = `packages/client/public/saenghwal-core.js` 의 `STYLE_PROMPT`
- 캐릭터 시트 = `saenghwal-plan.html` 의 각 `.char-prompt` 프롬프트 리드("Needle-felted wool plush look …")
- 변경 시 위 두 곳만 교체. 아래 STYLE 블록 6종은 비교 근거로 보존.

이전 후보(참고): F 아기상어식/E 3D = 검증된 흡인력·장면 일관성 최상이었으나, 안티-AI 브랜드 정합·독창성에서 B 채택.

---

## 공통 베이스 프롬프트 (6종 동일 — 뒤에 STYLE 블록만 교체)
```
Character reference sheet for a children's storybook mascot.

CHARACTER: "Hori", a baby tiger cub. Super-deformed chibi proportions: head about 1.3x the body,
short chubby limbs, 3-finger rounded paws, large round eyes with white highlights, small pink
triangle nose, prominent rose cheek blush. Warm orange fur (#F8A755->#FF8C3F) with dark warm-brown
stripes (#5A3A22), cream belly and inner ears. Two upright ears with white inner tufts; a long
fluffy tail with 3-4 brown ring stripes curling up behind. Curious, warm, a little stubborn.

LAYOUT: one horizontal sheet — three full-body poses of the SAME character at IDENTICAL scale:
(1) front idle, (2) 3/4 turn, (3) SIGNATURE DISCOVERY POSE (eyes bright, one paw raised pointing
forward, happy open-mouth smile, and the tail ring-stripes glowing a subtle RAINBOW shimmer — the
brand signature). Below: three face close-ups — happy, surprised, neutral.

CANVAS: clean solid white background, characters centered with even spacing, no text, no labels,
no props, no ground shadow beyond a soft contact shadow.

[[ 여기에 아래 STYLE 블록 하나를 붙임 ]]
```
> 실서비스 파이프라인은 배경을 순마젠타(#FF00FF)로 두고 누끼/슬라이싱. 우리 앱 에디터로 만들면 외형=캐릭터 설명란, STYLE 블록만 artStyle 칸.

## STYLE 블록 6종
**A. 과슈·크레용 질감**
```
STYLE: Hand-painted TEXTURED GOUACHE and CRAYON storybook illustration. Visible thick opaque paint strokes, grainy crayon texture, rough paper grain showing through, soft matte finish, gentle hand-drawn slightly wobbly warm-brown outlines. Analog, tactile, artisanal picture-book feel. NOT smooth digital, NOT vector, NOT 3D. Cozy and warm.
```
**B. 니들펠트 / 클레이 3D (수공예)**
```
STYLE: Handmade CLAY / FELT stop-motion look, like claymation or a needle-felted plush. Soft rounded 3D forms with visible clay fingerprint dents or fuzzy wool-felt fibers, gentle studio soft-box lighting, subtle soft real shadows, squishy tactile material feel. Chunky, huggable, dimensional. Vibrant saturated colors. NOT flat 2D, NOT painted.
```
**C. 플랫 벡터 (볼드 단순)**
```
STYLE: Bold FLAT VECTOR illustration, Scandinavian modern children's style. Clean crisp shapes, large flat color blocks, no or minimal outlines, limited high-contrast punchy palette, simple geometric forms, only a very subtle grain overlay. Graphic, modern, poster-like, instantly readable. NOT textured, NOT painterly, NOT 3D.
```
**D. 수채 + 색연필**
```
STYLE: Soft WATERCOLOR with COLORED-PENCIL accents, classic hand-drawn picture-book style. Translucent watercolor washes with gentle color bleeds, light pencil linework and cross-hatch shading, soft feathered edges, airy white-paper feel, delicate warm palette. Tender, storybook-classic, emotional. NOT bold flat, NOT digital, NOT 3D.
```
**E. 매끈 3D CG (코코멜론·베베핀·뽀로로 룩)**
```
STYLE: Smooth polished 3D CG animation style, like a modern preschool 3D animated series (CoComelon / Bebefinn / Pororo). Clean glossy rounded 3D-modeled forms, soft global illumination, gentle soft shading, big glossy reflective eyes, smooth matte surface (NOT clay texture, NOT painted, NOT felt), bright saturated colors, subtle soft ground shadow. High-quality kids' CG render.
```
**F. 아기상어식 단순 2D + 그라데이션 (핑크퐁 룩)**
```
STYLE: Simple flat 2D vector illustration with soft smooth gradient shading, like Pinkfong "Baby Shark" characters. Bold clean rounded shapes, minimal thin or no outlines, cheerful high-saturation colors, gentle soft gradient giving light volume (not fully flat, not textured, not 3D), big simple friendly eyes. Clean, bright, instantly readable, iconic and very simple.
```

> 팁: E는 "clay texture 아님", F는 "3D 아님"을 명시해야 서로 안 섞임.
