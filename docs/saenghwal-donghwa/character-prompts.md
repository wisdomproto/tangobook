# 호리네 캐스트 — 캐릭터 레퍼런스 프롬프트 v2 (모델시트, 8인)

> 한 번 만들고 30권에 재사용하는 **마스터 레퍼런스**. 각 캐릭터 = 3컷 모델시트(front + 3/4 + 시그니처 표정) + 식별 실루엣 + 호리 대비 크기.
> 생성 순서: **① 호리 먼저** 생성 → 가장 깔끔한 1장 "골든 호리" 확정 → **② 나머지 7인**은 골든 호리를 STYLE·SCALE 참고 이미지로 첨부**(일관성 핵심)**.
> 후처리(매젠타 제거·슬라이싱)는 `docs/hori-sprite-prompts.md` 스크립트. 호리 기존 자산 = `mascot/hori/pointing.webp`.

## 공통 앵커 (8인 모두 머리에)
```
Create a CHARACTER REFERENCE SHEET in a warm 2D storybook illustration style — soft brown
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

## 2. 엄마 — 어른 호랑이 · 다정한 조력자
```
CHARACTER: "Mom", Hori's mother, an adult mother tiger.
- COLORS: same warm orange #F8A755 + brown stripes #5A3A22 + cream belly as Hori.
- SILHOUETTE: taller and gently slender, a soft head fur-tuft, longer eyelashes; wearing a
  soft peach apron #F8C9A0. Long striped tail.
- PERSONALITY: calm, warm, reassuring.
- SIGNATURE POSE (3rd): kneeling slightly and leaning forward with both arms gently open,
  as if about to give a warm hug, kind half-closed eyes and motherly smile.
- SIZE: about 1.6× Hori's height.
```

## 3. 아빠 — 어른 호랑이 · 든든·장난기
```
CHARACTER: "Dad", Hori's father, an adult father tiger.
- COLORS: deeper orange fur #E8843A with thicker darker brown stripes, cream belly.
- SILHOUETTE: broad sturdy friendly build, a small cowlick tuft on top of the head, small
  round glasses, a slightly squared gentle jaw. Long striped tail.
- PERSONALITY: dependable, playful, hearty.
- SIGNATURE POSE (3rd): big open laugh with head tilted back slightly, one thumb-up paw,
  confident cheerful energy.
- SIZE: about 1.7× Hori's height.
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

## 저장 경로
후처리 후 → `packages/client/public/mascot/cast/{hori,mom,dad,hoya,toto,bori,kongi,dubu}/` (golden idle + 표정 시트). 동화책 장면 조립 시 이 골든들을 참고 이미지로.
