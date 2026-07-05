# 호리네 캐스트 — 캐릭터 레퍼런스 프롬프트 v2 (모델시트, 8인)

> 한 번 만들고 30권에 재사용하는 **마스터 레퍼런스**. 각 캐릭터 = 3컷 모델시트(front + 3/4 + 시그니처 표정) + 식별 실루엣 + 호리 대비 크기.
> 생성 순서: **① 호리 먼저** 생성 → 가장 깔끔한 1장 "골든 호리" 확정 → **② 나머지 7인**은 골든 호리를 STYLE·SCALE 참고 이미지로 첨부**(일관성 핵심)**.
> 후처리(매젠타 제거·슬라이싱)는 `docs/hori-sprite-prompts.md` 스크립트. 호리 기존 자산 = `mascot/hori/pointing.webp`.

## 공통 앵커 (8인 모두 머리에)
> ⚠️ **라인 그림체 확정 = 펠트(needle-felted wool stop-motion)** (2026-07-05, 파일럿 A/B로 아기상어식 대비 결정 — 소유가능·베끼기 어려움·명작 플랫폼 톤 정합). 골든 재생성 시 아래 STYLE 첫 줄을 펠트 앵커로 교체:
> `Create a CHARACTER REFERENCE SHEET in a handmade needle-felted wool stop-motion look — soft fuzzy felted wool with visible tactile fibers, slightly bumpy handcrafted texture, matte cozy softbox studio lighting, stitched-felt details (Pui Pui Molcar / Sarah & Duck aesthetic).`
```
Create a CHARACTER REFERENCE SHEET in a needle-felted wool plush style (handmade felt, visible wool fibers) — soft brown
outlines (NOT harsh black), gentle airbrush shading, slightly fluffy digital-painting texture,
cozy and warm.
LAYOUT: three poses in one horizontal row, evenly spaced, with an IDENTICAL character and
IDENTICAL scale across all three: (1) front idle standing, (2) 3/4 turning view, (3) the
SIGNATURE pose described below.
PROPORTIONS: super-deformed chibi — head ~1.3× the body, short chubby limbs, 3-finger rounded
paws, large round eyes with white highlights, small triangle nose, prominent pink cheek blush.
CANVAS: 1536×1024, solid pure magenta #FF00FF background (chroma-keyed out later), characters
centered with even spacing, ≥8% padding. No ground, no shadow, no scene, no text/labels, no
extra elements — only the three poses on flat magenta.
```

---

## 1. 호리 — 주인공 · 아기 호랑이 (5세) · ★크기 기준
```
CHARACTER: "Hori", a baby tiger cub.
- COLORS: warm orange fur #F8A755→#FF8C3F, dark warm brown stripes #5A3A22, cream belly &
  inner ears #FFF5E4, soft pink triangle nose #F4A3A3, rose cheek blush #F9B8B8, rich brown
  eyes #4A2F1A, soft brown outlines #6B4423.
- SIGNATURE SILHOUETTE: two upright ears with white inner tufts; a long fluffy tail with
  3–4 brown ring stripes curling up behind.
- PERSONALITY: curious, warm, a little stubborn.
- SIGNATURE POSE (3rd): excited "discovery" look — eyes bright, one paw raised pointing
  forward, mouth in a happy open smile, and the TAIL RING-STRIPES glowing a subtle rainbow
  shimmer (Hori's brand signature for the "moment of courage/energy").
This is the SIZE ANCHOR — all other cast members are sized relative to Hori.
```

## 2. 엄마 — 엄마 호랑이 · 다정한 조력자 (⚠️ 어른티 ↓ 재설계 2026-07-05)
> 기존 1.6×·slender 는 "너무 어른" 피드백. 아이들과 같은 둥근 치비 비율 유지 + 어른 표식은 앞치마 하나만.
```
CHARACTER: "Mom", Hori's mother, a warm mother tiger — but drawn as a CUTE ROUND
chibi, same soft proportions as the cubs, only a little bigger.
- COLORS: warm orange #F8A755 + brown stripes #5A3A22 + cream belly as Hori.
- SILHOUETTE: soft round body (NOT slender, NOT tall), a small gentle fur-tuft on top
  of the head, soft curved eyelashes as the only "grown-up" cue, wearing a cozy peach
  apron #F8C9A0. Long striped tail.
- PERSONALITY: calm, warm, reassuring — but young and soft-faced.
- SIGNATURE POSE (3rd): crouching to the cubs' eye-level with both arms gently open for
  a warm hug, kind half-closed eyes, soft motherly smile.
- SIZE: only about 1.35× Hori's height (clearly related, gently bigger — NOT towering).
```

## 3. 아빠 — 아빠 호랑이 · 든든·장난기 (⚠️ 어른티 ↓ 재설계 2026-07-05)
> 기존 1.7×·broad sturdy·squared jaw 는 "너무 어른" 피드백. 둥근 치비 유지 + 어른 표식은 안경 하나만.
```
CHARACTER: "Dad", Hori's father, a friendly father tiger — drawn as a CUTE ROUND
chibi, same soft proportions as the cubs, only a little bigger and huggable-chunky.
- COLORS: deeper orange fur #E8843A with slightly thicker brown ring stripes, cream belly.
- SILHOUETTE: round chubby body (NOT broad, NO squared jaw, NO muscle) — soft and cuddly,
  a small playful cowlick tuft on top of the head, tiny round glasses as the only
  "grown-up" cue. Long striped tail.
- PERSONALITY: dependable, playful, goofy-warm — young and round-faced.
- SIGNATURE POSE (3rd): cheerful thumbs-up paw with a big warm open smile, head tilted,
  cozy dependable energy (gentle, not macho).
- SIZE: only about 1.4× Hori's height (a touch bigger than Mom, still NOT towering).
```

## 4. 호야 — 아기 동생 (2세) · 천진·따라쟁이
```
CHARACTER: "Hoya", Hori's baby brother, a toddler tiger cub.
- COLORS: identical orange-and-brown-stripe palette as Hori.
- SILHOUETTE: even chubbier, an extra-large head ratio (~1.5× body) and tiny stubby limbs,
  a tiny stub tail; wearing a yellow bib #FFE08A; one little tooth showing.
- PERSONALITY: innocent, wobbly, copies everything.
- SIGNATURE POSE (3rd): mid-toddle with both arms stretched out for balance, wide drooly
  giggle, big sparkly eyes.
- SIZE: about 0.7× Hori's height (clearly the smallest of the tigers).
```

## 5. 토토 — 토끼 (5세) · 활발한 리더
```
CHARACTER: "Toto", a bouncy bunny rabbit.
- COLORS: white fur #FBF7F0, light-blue inner ears #CFE8FF, pink cheek blush, small red
  neck kerchief #E8635A.
- SILHOUETTE: long upright ears (tallest feature), a small round cotton tail, springy legs.
- PERSONALITY: energetic, brave, always first to try.
- SIGNATURE POSE (3rd): caught mid-bounce/jump, one arm thrown up with a confident grin,
  "let's go!" energy.
- SIZE: about Hori's height (peer); ears make the total silhouette a bit taller.
```

## 6. 보리 — 곰 (6세) · 수줍음·다정
```
CHARACTER: "Bori", a chubby light-brown bear cub.
- COLORS: light warm brown fur #C9A06A, cream muzzle, pink cheek blush; blue denim overalls
  #6E8CB8.
- SILHOUETTE: round chubby soft body, small rounded ears, short limbs — the roundest of the
  cast.
- PERSONALITY: shy, slow, gentle, kind.
- SIGNATURE POSE (3rd): half-hiding, peeking out from behind its own raised paws, eyes
  looking down bashfully, deep blush, tiny shy smile.
- SIZE: slightly taller and notably rounder/wider than Hori.
```

## 7. 콩이 — 다람쥐 (5세) · 먹보·장난꾸러기
```
CHARACTER: "Kongi", a lively baby squirrel.
- COLORS: warm chestnut brown fur #A9743F, cream belly #F2E2C8, a cream stripe down the tail,
  pink cheek blush.
- SIGNATURE SILHOUETTE: an OVERSIZED bushy curved tail nearly as big as the body, arcing up
  behind the head; BOTH cheeks permanently puffed full (storing food); small tufted ears;
  a small upturned snout.
- PERSONALITY: cheeky, curious, greedy little foodie.
- SIGNATURE POSE (3rd): big mischievous toothy grin, holding a single brown acorn up in both
  paws, cheeks extra stuffed.
- SIZE: about Hori's height (peer), a touch smaller-bodied but tail makes it look big.
```

## 8. 두부 — 강아지 (펫) · 충성·까불
```
CHARACTER: "Dubu", a small round puppy (quadruped, but cute-chibi).
- COLORS: soft cream-white fur #FBF6EE, one floppy brown ear #C8956A (the other upright),
  big shiny black eyes, red collar #E8635A.
- SILHOUETTE: small round body, short stubby legs, a small wagging tail, tiny pink tongue out.
- PERSONALITY: loyal, bouncy, follows everyone around.
- SIGNATURE POSE (3rd): a playful "play-bow" (front down, rear up) with tongue out and tail
  wagging, joyful.
- SIZE: small, about 0.6× Hori's height, low to the ground (four legs).
```

---

## 확장 레퍼런스 시트 (양산용, 2026-07-05)

> 3포즈 시트는 시작점. 45권×10p 양산엔 **표정 레인지·각도·시그니처**가 더 필요 → 캐릭터 중요도별 차등.
> **사용법**: 시트는 "매번 다 붙이는 세트"가 아니라 **골라 쓰는 라이브러리**. Gemini 장면 조립 시 = 골든 정면 1장(고정 정체성 앵커) + 그 장면에 가장 가까운 표정/각도 1~2장만 첨부.
> **공통**: 위 [펠트 STYLE 앵커](#공통-앵커-8인-모두-머리에) + 각 캐릭터 CHARACTER 블록(§1~8) 을 아래 LAYOUT 앞에 붙여 완성.

### 시트 LAYOUT 템플릿
```
[TURNAROUND]  four poses in one row, IDENTICAL character & scale:
  (1) front idle  (2) 3/4 turn  (3) full side profile  (4) back view (show tail + back of ears/head).

[EXPRESSION-6]  six head-and-shoulders busts in a 3×2 grid, IDENTICAL face & scale, only expression changes.

[SHEET-6]  six poses (2 rows): (1) front idle (2) 3/4 turn (3~5) three expression busts (6) signature pose.

[SHEET-4]  four poses in one row: (1) front idle (2) 3/4 turn (3) one expression bust (4) signature pose.
```

### 🥇 주연 — 호리 (3시트)
- **시트 A · TURNAROUND** — §1 호리 블록 + `[TURNAROUND]`. 후면 컷은 꼬리 줄무늬 뒷면·귀 뒤가 또렷하게.
- **시트 B · EXPRESSION-6** — §1 호리 블록 + `[EXPRESSION-6]`, 표정 순서:
  `(1) joyful big open smile, sparkly eyes  (2) pouty sulk, puffed cheeks, head turned, "hmph"  (3) droopy sad, drooping ears, downcast teary-less eyes, small frown  (4) surprised, wide round eyes, small "O" mouth, ears perked  (5) crying, teary eyes, wobbly open mouth, tear drops  (6) sleeping, eyes closed, peaceful, tiny "Z"`
- **시트 C · 무지개 꼬리 시그니처 (클로즈업)**:
  ```
  A close-up study sheet of Hori's tail, felt wool, three states side by side:
  (1) resting — normal cream/brown ring-striped fluffy tail, matte wool.
  (2) activating — the ring stripes just beginning to shimmer faint rainbow.
  (3) full signature — ring stripes GLOWING vivid rainbow with a small "vroom" sparkle burst around the tip.
  Magenta #FF00FF bg, no character body, tail only, clear reference. No text.
  ```

### 🥈 조연 — 엄마 · 콩이 · 토토 · 보리 (각 1시트 · SHEET-6)
각 캐릭터 §블록 + `[SHEET-6]`, 표정 3종은 성격에 맞춰:
| 캐릭터 | 3 expression busts (3~5번 칸) |
|---|---|
| 엄마(§2) | `neutral warm smile / bright happy / gentle worried concern (다정한 걱정)` |
| 콩이(§7) | `neutral puffed cheeks / cheeky mischievous grin / eyes-shut happy munch (먹보 냠냠)` |
| 토토(§5) | `neutral confident / big excited open grin / mid-bounce "let's go!" thrill` |
| 보리(§6) | `neutral soft / shy peeking blush / surprised timid gasp` |
6번 칸 = 각 §블록의 SIGNATURE POSE 그대로.

### 🥉 카메오·펫 — 아빠 · 호야 · 두부 (각 1시트 · SHEET-4)
각 §블록 + `[SHEET-4]`, 3번 표정 칸:
| 캐릭터 | expression bust |
|---|---|
| 아빠(§3) | `big goofy-warm laugh` |
| 호야(§4) | `drooly giggle, big sparkly eyes` |
| 두부(§8) | `excited bark, tongue out, ears up` |
> 이 3인은 등장 빈도 낮아 4컷이면 충분. 필요 시 나중에 SHEET-6 승격.

---

## 저장 경로
후처리 후 → `packages/client/public/mascot/cast/{hori,mom,dad,hoya,toto,bori,kongi,dubu}/` (golden idle + 표정 시트). 동화책 장면 조립 시 이 골든들을 참고 이미지로.
