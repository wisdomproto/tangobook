# 창작동화 1000 — F-11 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/f11.md`. 대본은 한 글자도 안 고친다.
> 배정 근거는 `changjak-assign-08b.md` §1·§2(f11)·§3.2 — 앵커는 **b06 `changjak-risenpaper` 재사용**(변주).
> 🔴 실행 순서: ① 시트 3장 → ② p1(그늘 띠·회칠 금 기준자) · p9(솟음 기준판) 승인 → ③ 나머지 열한 컷
> 🔴 **이미지 생성은 이 문서가 하지 않는다** · 🔴 **작가 실명 0**

---

# F-11 「빨래가 마르는 동안」

주제군 F · 집·가족의 작은 사건 / 엔진 **관찰과 성장** / 무대 그리스 골목 빨랫줄 아래 한 자리(카메라가 이 자리를 안 벗어난다) / 새끼 염소 + 할머니 염소 / **13스프레드**

## F-11 §1. 앵커 배정

**권**: `빨래가 마르는 동안` (f11 · 13쪽 · 4~6세)
**클러스터**: C1 · **슬러그**: `changjak-risenpaper` — 🔴 **재사용(변주)**. 공정 문단은 b06 것 그대로이고 바꾼 것은 **팔레트 hex 넷 · 관통 줄 셋 · 방향 한 줄**뿐이다. 앵커 원본(수상작 참조 그림)도 b06 것을 물려받는다.

**한 줄**: 흰 것은 칠한 게 아니라 **종이를 뒤에서 밀어 올려 솟은 자리다(양각)**. 솟은 것엔 잉크가 하나도 없고, **젖은 것이 놓이면 그 자리가 도로 눌린다.**

**🔴 방향 한 줄 (원본 b06 과 갈린 축)**
> **솟는 것이 한 자리인가 한 판인가.** b06 = 작업대 위 **한 덩이**가 올랐다 꺼진다 / **f11 = 담요 한 판이 위에서부터 아래로 솟아 내려오고, 눌러 두는 것은 흙이 아니라 젖음이다.** 첫 렌더 판정 = 화면에서 **평평한 자리가 담요의 어디에 몇 뼘 남았나**.

**🔴 형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | f11 의 값 |
|---|---|---|
| **g06** `tautline` (같은 배치 · 둘 다 「기다리는 동안 재기」) | 🔴 **이 책에 붓획이 몇 개인가** | g06 = 정확히 1 · **f11 = 거의 0**(획이 없다, 흰 것이 지지면이다) |
| **b06** `risenpaper` 원본 | 솟는 것이 한 덩이인가 한 판인가 | 위 방향 한 줄 |
| **d10** (같은 그리스) | 물이 화면에 있나 | d10 = 오려 붙인 배가 물 위에 · **f11 = 물이 화면에 없다.** 물은 **젖음**으로만 있다 |
| **h01** (같은 「기다리는 동안」 + 빵집) | 무엇으로 재나 | h01 = 그릇 안쪽 줄에 댄 **손가락** · **f11 = 아이 몸 전체**(배 → 무릎 → 고개 → 그냥 서기). 🔴 이 책의 발굽엔 **손가락이 0개**다 |

### 이 권이 그림에 요구하는 것

1. 🔴 **마른다는 말이 대본에 한 번도 없다.** 그러니 마름은 **판의 상태**여야 한다 — 젖은 데는 평평하고, 마른 데는 솟는다. 색을 옅게 칠하는 것으로는 못 센다.
2. 🔴 **흰 것이 둘이면 앵커가 죽는다.** 회벽도 희고 빨래도 희다 → **회벽은 인쇄한다**(`#DCD2BE`, 지지면보다 한 단 낮다). **안 칠한 종이는 오직 빨래와 자갈 사이 회칠 금뿐이다.**
3. 🔴 **젖음이 이 책의 유일한 무게다.** 화면에서 색이 꽉 찬 것은 `#B0316A` 하나뿐이고, 그것이 닿은 자리가 눌린다 — 담요의 젖은 띠 · 떨어지는 물방울 · 회칠 금 위 동그라미 · 아이 등의 자국이 **전부 같은 잉크**다.
4. 🔴 **줄무늬 담요를 어떻게 양각으로 만드나** — 담요는 **나란한 띠로 짜여 있다**: 인쇄된 `#B0316A` 줄 다섯이 평평하게 눕고, **그 사이의 흰 띠가 솟는 부분**이다. 솟은 띠엔 잉크가 없다(§2 규칙 그대로).
5. 🔴 **글에 없는 계기판 둘을 그림이 든다** — ①빨랫줄 **처짐**이 쪽마다 얕아진다 ②빨랫줄 **그늘 띠**가 자갈 위를 건너간다. 둘 다 컷에 **수치로** 못박았다(`DRY:` `LINE:`).
6. 🔴 **자는 아이 몸이다.** 담요 밑단과 아이 사이 틈을 쪽마다 **머리통 단위**로 적었다(`PASS:`) — 그 값이 곧 성장이고, 값이 3에 닿는 p9 다음 쪽에서 아이가 지나가기를 그만둔다.
7. 🔴 **글자·숫자 없음.** 골목·문·집게가 간판을 부르기 쉬운 무대라 열세 컷 전부에 반복해서 적었다.

### 밀도 배급

**`FINISHED THINGS PER PAGE = 2` · `DENSITY RATION = none`.** 사건이 「담요 한 자락이 몇 뼘 솟았나」라 나머지는 조용해야 한다. 🔴 **골목 안쪽은 그리지 않는다** — 벽·문·하늘은 색면 한 겹이고 안에 아무것도 없다.

### 🔴 라인 충돌 확인

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ (🔴 **이 권은 검수 항목이다**) | 염소가 주연이고 흰 것이 부풀어 있다 — 보풀·섬유 가장자리가 한 번이라도 나면 그 라인이다. NOT 에 `no wool fibre`·`no fuzzy edge`·`no stitching`·`one sheet thick` 을 박았다 |
| 전래동화 **점눈이** | ✕ | 점눈 아님(동그란 눈 + 별개 눈썹 선) · 빨강 1점 규칙 미사용(진분홍은 **젖음의 면적**이라 쪽마다 줄어든다) |
| **b06** (같은 슬러그) | ○ **의도한 공유** | 공정 문단 동일 · 팔레트 hex 넷과 관통 줄 셋이 다르다 |

### 🔴 대본과 어긋나는 곳 (대본 수정 불필요 — 컷에서만 분기)

1. **배정표의 「빨래 여섯 장」** — 대본에 걸리는 빨래는 **담요 1 + 양말 2짝**뿐이다. 🔴 대본이 SSOT 이므로 **여섯 장을 만들지 않았고**, 등급은 「장 수」가 아니라 **한 판 안에서 위→아래로 내려오는 경계**로 옮겼다. 「몇 장이 다 솟았나」는 **담요의 몇 할이 솟았나 + 양말 둘이 먼저 솟았나**로 세어진다(양말은 작아서 p4 에 걸리자마자 1단, p7 에 2단).
2. **p3 「까만 동그라미」** — 팔레트에 검정이 없다. 물자국은 이 책의 **유일한 진한 잉크** `#B0316A` 원반이고, 화면에서 가장 어두운 것이라 「까맣다」로 읽힌다. **검정 잉크를 새로 들이지 마라** — 그러면 젖음이 두 색이 된다.
3. **「파란 덧창·파란 문」** — 팔레트에 파랑이 없다. 문과 덧창은 회청 `#9A9186` **한 색면**으로 인쇄한다(빨랫줄·집게와 같은 값).
4. **p2 「등이 축축하게 반질거렸어요」** — 광택으로 그리면 이 앵커가 아니다(그라데이션 금지). **등 위 `#B0316A` 자국 하나**로 옮기고, 그 자국이 닿은 자리는 판이 평평하다.

---

## F-11 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-risenpaper   (goat kid and grandmother goat / one spot under a clothes line
  in a Greek alley)

Style: a picture-book page for 4-6 year olds made on ONE SHEET OF HEAVY WHITE PAPER. The camera
  never leaves one spot under the line; the alley's geometry is fixed by AlleyKit, never mirrored.

RENDERING: 🔴 EVERY WHITE THING IN THIS BOOK IS PAPER PUSHED UP FROM BEHIND - a raised, rounded
  area of the sheet itself, WITH NO INK ON IT AT ALL. It is not painted white; it is the paper. It
  has real volume and a clean outer edge where it meets the flat sheet, and its only shading is ONE
  FLAT TONE #DCD2BE laid along the lower-right of a raised edge - 🔴 one tone, hard edged, NEVER a
  gradient. Four relief steps and no others: 0 flat · 1 a low swell · 2 a fist-sized dome ·
  3 a pillow-sized dome. 🔴 A RAISED AREA CAN BE PUSHED BACK DOWN TO 0, and when it is, it becomes
  ordinary flat sheet with a faint crease ring where it used to be. 🔴 WET IS WHAT HOLDS IT DOWN:
  wherever the saturated ink lies, the sheet is at 0. Everything that is NOT white is printed flat
  on the sheet with hard edges and ZERO MODELLING. 🔴 ONLY THE LAUNDRY AND THE LIME RIDGE ARE
  RAISED - the whitewashed wall is PRINTED #DCD2BE, one step below the sheet, so white is never two
  things. 🔴 THE BLANKET IS WOVEN OF PARALLEL BANDS: 5 printed #B0316A stripes lying flat, and
  between them the white bands, which are the parts that rise. FINISHED THINGS PER PAGE = 2.
  DENSITY RATION = none. Counts: wall, door, shutter and sky = 0 marks inside them · cobbles = at
  most 9 drawn joints in the frame · goat coats = 0 hair strokes · 0 drawn water drops except the
  single falling drop on p3 · 0 clouds, 0 birds.

PALETTE: the sheet #FAF8F4, which is also every white thing (the laundry, the lime ridge). Only
  three inks touch it: 🔴 WET #B0316A, the only saturated thing in the book and the only thing that
  has weight - the blanket's stripes, the falling drop, the disc on the ground, the damp on a back
  · LIMEWASH #DCD2BE for the wall and the cobble plane, and also the one flat relief tone ·
  COOL GREY #9A9186 for the door, the shutter, the clothes line and the pegs.
  🔴 NOTHING ELSE IS COLOURED. No sky blue, no sun yellow, no green, no black.

CHARACTER DESIGN LANGUAGE: both goats are printed FLAT with NO relief on them - 🔴 THEY ARE THE
  THINGS IN THIS BOOK THAT NEVER RISE. Eyes are DRAWN: one round dark eye per side with a SEPARATE
  brow stroke above - not dot-eyes, no catchlight; the pupil is one flat horizontal slot. Grade:
  upright on two legs, hooves work as hands, 🔴 THE HOOF IS ONE SPLIT WEDGE - 0 fingers, 0 thumbs.
  Grandmother = a plain skirt and head scarf. Kid = no clothes. Nobody wears anything else.

CANVAS: 16:9 double-page spread, no border. 🔴 NO LETTERING OR NUMERALS ANYWHERE - no sign, no door
  number, no printed cloth.

NOT (rendering only): no airbrush, gradient, glow, 3D CG, cel-shading, photographic or texture
  filter / no gradient or soft shadow on a relief edge - one flat tone only / no white paint, white
  ink or white highlight anywhere - white is ALWAYS raised paper / no wool fibre, fuzzy edge or
  stitching, the sheet is ONE SHEET THICK.
```

### 🔴 이 앵커의 관통 줄 셋 (매 컷 반복 확인)

**A — `DRY:`** 빨래가 몇 단으로 솟았고, 빨랫줄이 얼마나 처졌나(스프레드 높이 대비).

| | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 | p13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 담요 | 0 | 위 ⅓ 1단 | 위 ⅓ 1단 | 위 ½ 1단 | 🔴 위 ½ 2단 | 위 ⅔ 2단 | 위 ⅔ 2단 | 위 3단·가운데 2단 | 🔴 **밑단 한 띠만 0** | 🔴 **전부 3단** | 3단 | 3단 | 3단(품 안) |
| 양말 | 없음 | 없음 | 없음 | 1단 | 1단 | 2단 | 2단 | 3단 | 3단 | 3단 | 3단 | 3단 | 3단 |
| 처짐 | 0.18 | 0.16 | 0.15 | 0.13 | 0.11 | 0.09 | 0.08 | 0.06 | 0.03 | 0.02 | 0.02 | 🔴 0(튕겨 곧다) | 0 |

**B — `LINE:`** 자갈 위 세 가지 — 회칠 금(양각 1단) · 그 위 `#B0316A` 원반 크기(스프레드 폭 대비) · 빨랫줄 그늘 띠의 가로 위치.

| | p1 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 | p13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 금 | 🔴 밑단에 덮여 0 | 원반 자리만 눌림 | 끝만 보임 | 절반 | 다 보임 | 눌린 자리 손톱만 | 다 | 다 | 다 | 다 | 다 | 🔴 **한 줄 통째 1단** |
| 원반 | — | 🔴 0.09 | 0.08 | 0.06 | 0.05 | 🔴 0.03 | 0.015 | 자국 테만 | 테만 | 테만 | 테만 | 🔴 **0** |
| 그늘 띠 | x0.30 | x0.34 | x0.38 | x0.42 | x0.45 | x0.48 | x0.54 | x0.58 | x0.62 | x0.66 | x0.70 | x0.76 |

**C — `PASS:`** 담요 밑단과 아이 사이 틈(아이 **머리통** 단위) + 그때의 자세.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 | p13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 (바닥) | 🔴 0.5 배 | 0.7 | 1.0 | 🔴 1.2 무릎 | — | 1.6 | 🔴 2.2 고개만 | 🔴 **3.0 그냥 섬** | 3.0 발끝 | — | — | 줄이 비었다 |

---

## F-11 §3. 캐릭터 시트 (🔴 이것부터 굽는다 · 장면 금지)

### 시트 1 — KidGoat

```
CHARACTER SHEET - KidGoat   (bake this FIRST, before any scene)

🔴 MADE THE SAME WAY AS THE BOOK: printed FLAT on a heavy white sheet, hard edges, zero modelling.
  🔴 THERE IS NO RELIEF ANYWHERE ON THIS CHARACTER - the sheet stays flat wherever he is.

FACE: a young goat's face kept as a goat's - a short straight muzzle, a square nose pad, two ears
  set sideways and out, two small horn buds not yet grown. One round dark eye per side with a
  SEPARATE brow stroke above - not dot-eyes, no catchlight; the pupil is ONE FLAT HORIZONTAL SLOT.
  Small mouth line. Coat = flat colour, 0 hair strokes.
BODY: small, barrel-chested, short legs, a stub tail that stands up. 🔴 THE HOOF IS ONE SPLIT
  WEDGE - 0 fingers, 0 thumbs; it can hold, push and press, and it is never used to measure.
  No clothes at all.
🔴 GRADE: upright on two legs, hooves work as hands. Goes onto all fours only to crawl.
🔴 THE WET MARK BELONGS TO THIS CHARACTER - bake it: WET #B0316A across the top of the back and
  along both forearms, hard-edged, 0 gloss, 0 highlight. Show, drawn big: (1) the back seen from
  above with ONE wide wet band across it (2) the same back clean, 0 mark (3) a sole pressed flat on
  a wet disc, the disc showing round the hoof.
SIX POSTURES, each drawn big and named: a) belly flat on the ground, both forelegs pushing, chin
  low, mouth open · b) up on both knees, back arched, belly clear of the ground · c) standing on
  two legs walking with only the head ducked, one hoof reaching forward · d) standing straight,
  hooves at the sides, ears up, eyes rolled upward · e) on tiptoe, one hoof stretched high overhead,
  body long · f) both arms thrown wide, face turned up, then the same arms closed round a bundle
  with the face buried in it.
NO lettering or numerals on the sheet.
```

### 시트 2 — GranGoat

```
CHARACTER SHEET - GranGoat   (bake SECOND)

🔴 Printed FLAT, hard edges, zero modelling - see anchor changjak-risenpaper. 🔴 NO RELIEF ON HER
  ANYWHERE, including the scarf: the scarf is printed #9A9186, it is not raised paper.

FACE: an old goat's long pale face printed flat, a straight nose line, ears low and sideways, a
  short beard stated by 3 strokes and no more. One round dark eye per side with a SEPARATE brow
  stroke - not dot-eyes; pupil = one flat horizontal slot. A calm, slow, unhurried face that never
  scolds and never worries.
BODY: tall and square-shouldered, twice the kid's height. A plain skirt to the ankle #DCD2BE with
  its hem one broken line, and a head scarf #9A9186 tied under the chin. 🔴 SAME SPLIT-WEDGE HOOVES,
  0 fingers.
🔴 GRADE: upright on two legs, hooves work as hands.
FOUR POSTURES, each drawn big: a) both arms straight up over the head throwing a heavy folded cloth
  across a line, face turned up · b) one arm up pinning a small thing to a line, the other hand
  holding a peg, weight on one leg · c) back against a wall, one hoof shading the eyes · d) one arm
  out holding the far end of a cloth level, the other hanging - and the same arm opening, the cloth
  just leaving the hoof.
NO lettering or numerals on the sheet.
```

### 시트 3 — LaundryStates + AlleyKit 🔴 **이 시트가 책을 지배한다**

```
CHARACTER SHEET - LaundryStates and AlleyKit   (bake THIRD - not a scene)

🔴 NOT A SCENE. Flat straight-on reference so thirteen pages can be built on it.

Panel A - THE FOUR RELIEF STEPS, four swells in a row on a bare sheet, same low angle: step 0 (flat
  sheet, nothing) · step 1 (a low swell) · step 2 (a fist-sized dome) · step 3 (a pillow-sized
  dome). 🔴 ALL FOUR ARE THE BARE SHEET WITH NO INK. Each carries ONE FLAT TONE #DCD2BE along its
  lower-right edge, hard-edged, no gradient.
Panel B - 🔴 WET HOLDS IT DOWN, three steps in a row: a step-3 dome · the same dome halfway down
  with a #B0316A stain touching its foot · the same place at step 0, FLAT, the stain lying on it
  and a faint crease ring showing where the dome had been.
Panel C - THE BLANKET, drawn straight on FOUR TIMES, same size, same framing. It is built of
  parallel bands: 5 printed #B0316A stripes lying flat, and between them white bands of bare sheet.
  1. whole blanket at step 0, every white band flat, the printed stripes at full strength, the hem
     lying on the ground · 2. top third of the white bands at step 1 · 3. upper two thirds at step
     2 · 4. 🔴 all bands at step 3 EXCEPT ONE FLAT BAND A HAND DEEP ALONG THE HEM - that last flat
     band is the whole gauge of the book. 🔴 A raised band carries NO ink; the printed stripes stay
     flat between them.
Panel D - ALLEYKIT, drawn straight on and 🔴 THIS IS THE RULER OF THE BOOK: a clothes line #9A9186
  strung wall to wall, drawn FOUR times with sag 0.18 · 0.11 · 0.03 · 0 of the frame height ·
  3 wooden pegs #9A9186 · one pair of short socks · a cobble plane #DCD2BE crossed by ONE WHITE
  LIME RIDGE of raised sheet at step 1, drawn four times: ridge hidden under a hem · ridge with a
  #B0316A disc a plum wide pressing it to 0 in a circle · disc shrunk to a thumbnail · 🔴 ridge
  unbroken at step 1, 0 disc. A flat #DCD2BE wall with ONE #9A9186 door and ONE #9A9186 shutter,
  0 marks inside them. A shadow band of the line lying across the cobbles.
🔴 NO WATER, NO SEA, NO BOAT, NO PLANTS, NO PEOPLE anywhere on this sheet.
NO lettering or numerals on the sheet.
```

---

## F-11 §4. 13컷

각 컷 = `STYLE ANCHOR + @image1(KidGoat) + @image2(GranGoat) + @image3(LaundryStates·AlleyKit) + 아래 블록`.
🔴 **굽는 순서 = p1(기준자 확정) → p9(솟음 기준판) → p2 → 나머지 열.** p2 부터 **p1 승인본**을 함께 붙인다 — 열세 쪽이 같은 한 자리다.

### p1 — "낮잠은 이 담요에서 잘래요." 🔴 기준자 심음

```
DRY: blanket at step 0 everywhere - every white band flat, the 5 printed #B0316A stripes at full
  strength, the whole cloth heavy. No socks yet. The line sags 0.18 of the frame height, its
  deepest in the book.
LINE: 🔴 THE RULER IS SET HERE. The lime ridge runs across the cobbles at y0.86 of the spread and
  stays there for thirteen pages; here the blanket's hem lies on it and hides it completely. 0
  disc. The line's shadow band lies across the cobbles at x0.30.
PASS: 0 - the hem is on the ground, there is no gap at all.
CAMERA: wide, low, child's eye level from the cobbles looking slightly up.
SUBJECT: RIGHT BEHIND - GranGoat, both arms straight up, throwing the folded blanket over the line
  (sheet posture a), eyes on the line. LEFT FRONT - KidGoat holding the hem up on two flat hooves,
  arms pressed down by the weight, head tipped back at the cloth.
SETTING: one flat #DCD2BE wall with one #9A9186 door, the cobble plane with at most 9 drawn joints.
  Nothing else in frame.
FINISH: 2 - the kid under the hem, and the blanket.
TONE: the wall is the brightest flat area; the soaked cloth is the only saturated thing and the
  heaviest. GRADE: both goats upright, hooves as hands, 0 fingers. No lettering or numerals.
```

### p2 — "지나갔다!" 🔴 젖음이 등에 옮는다

```
DRY: blanket step 0 except the top third of the white bands at step 1. No socks yet. Line sag 0.16.
LINE: the ridge is still hidden under the hem except at its right end; 0 disc; shadow band x0.30,
  crossed by the kid's body.
PASS: 0.5 head - the hem presses down onto the kid's back as he drags under it.
CAMERA: close-up, camera set on the cobbles, very low angle.
SUBJECT: CENTRE - KidGoat belly flat on the stones, both forelegs pushing, head and forelegs out
  from under the cloth, hind legs still under it, mouth open (sheet posture a). 🔴 ONE WIDE
  #B0316A WET BAND ACROSS HIS BACK where the hem touched, hard-edged, 0 gloss - and the sheet is
  FLAT wherever that band lies. TOP RIGHT EDGE - only GranGoat's hooves and skirt hem.
SETTING: the sagging hem overhead, a few cobbles, the lower part of the #9A9186 door.
FINISH: 2 - the kid's back with its wet band, and the hem pressing on it.
TONE: under the cloth the sheet is flat and unlit; the face that came out is where the paper is
  raised and bright. GRADE: upright grade, hooves as hands, 0 fingers. No lettering or numerals.
```

### p3 — "차가워요."

```
DRY: blanket top third at step 1, the rest flat. Line sag 0.15.
LINE: 🔴 the lime ridge is uncovered here for the first time, and ONE #B0316A DISC 0.09 of the
  spread wide lies on it - inside that circle the ridge is pressed to step 0. Shadow band x0.34.
PASS: 0.7 head.
CAMERA: close-up, looking down at the cobbles at a slant, right under the hem.
SUBJECT: LOWER CENTRE - KidGoat sitting with one knee up, one sole laid flat on the wet disc, head
  bent to watch his own hoof. The disc shows all round the hoof.
SETTING: ONE #B0316A drop still in the air just under the hem - 🔴 the only drawn drop in the whole
  book. The lower part of the blanket above, printed stripes at full strength. Cobbles. Nothing
  else.
FINISH: 2 - the sole on the disc, and the disc.
TONE: two things only - dry sheet and the one saturated ink. The dry cobble plane is flat #DCD2BE
  and the disc is the darkest thing on the page. GRADE: upright, hooves as hands, 0 fingers, and
  🔴 the hoof is a split wedge, never a hand with fingers. No lettering or numerals.
```

### p4 — "저기 앉으면 시원해."

```
DRY: blanket upper half of the white bands at step 1, hem flat. 🔴 THE SOCKS ARRIVE AND GO STRAIGHT
  TO STEP 1 - they are small, so they rise first. Line sag 0.13.
LINE: ridge showing at its right end only; disc 0.08 wide; shadow band x0.38.
PASS: 1.0 head.
CAMERA: medium, the alley taken from the side, child's eye level.
SUBJECT: RIGHT - GranGoat, one arm up, pinning a pair of short socks to the line with a #9A9186
  peg, weight on one leg (sheet posture b). LEFT - KidGoat crouched against the wall, both arms
  round his knees, watching the hem.
SETTING: the blanket with its upper white bands swollen and its hem still flat; the pair of socks;
  the flat #DCD2BE wall; the shadow band on the cobbles.
FINISH: 2 - the socks going up, and the crouched kid.
TONE: the wall is one flat area with 0 marks in it; the only cool place is the shadow band, and it
  is a flat #9A9186 shape with a hard edge, not a gradient. GRADE: upright, hooves as hands, 0
  fingers. No lettering or numerals.
```

### p5 — "지나갔다!" (무릎으로)

```
DRY: 🔴 upper half of the white bands at step 2 - fist-deep domes; lower third still flat with the
  printed stripes at full strength. Socks step 1. Line sag 0.11.
LINE: ridge half uncovered; disc 0.06 wide; shadow band x0.42.
PASS: 1.2 heads - a clear gap between the hem and the kid's arched back. 🔴 THIS GAP IS THE ONLY
  THING THAT CHANGED SINCE p2; frame it identically so the two can be laid side by side.
CAMERA: close-up, the same very low camera as p2, same distance, same angle.
SUBJECT: CENTRE - KidGoat up on both knees and both fore-hooves, back arched, belly clear of the
  stones, head raised, coming out from under the cloth (sheet posture b). 🔴 HIS BACK IS CLEAN -
  0 wet mark anywhere on him.
SETTING: the hem a hand above his back; dry cobbles; the lower part of the #9A9186 door.
FINISH: 2 - the gap between back and hem, and the hem.
TONE: exactly p2's light. The one difference is the raised paper: at p2 the hem lay on him, here
  the sheet swells above him. GRADE: upright grade, hooves as hands, 0 fingers. No lettering or
  numerals.
```

### p6 — "할머니, 담요가 날아가요!"

```
DRY: upper two thirds of the white bands at step 2 and bellied out sideways; the hem band still
  flat. Socks step 2. Line sag 0.09.
LINE: ridge fully uncovered for the first time; disc 0.05 wide; shadow band x0.45.
PASS: not measured - nobody is under the cloth.
CAMERA: wide, low angle looking up at the underside of the blanket.
SUBJECT: LOWER LEFT - KidGoat with both arms thrown wide, head tipped right back, watching the
  cloth (sheet posture f, first half). RIGHT - GranGoat with her back against the wall, one hoof
  shading her eyes (sheet posture c).
SETTING: the blanket ballooning - the raised white bands swelling outward while the 5 printed
  #B0316A stripes stay flat between them, so the swell is read band by band. Two #9A9186 pegs
  gripping the top edge. The socks blowing beside it. The lime ridge clear below.
FINISH: 2 - the bellied blanket, and the kid looking up.
TONE: 🔴 the raised bands are the brightest things on the page and they are bare paper, not white
  paint. GRADE: upright, hooves as hands, 0 fingers. No lettering or numerals.
```

### p7 — "어? 따뜻해요."

```
DRY: upper two thirds at step 2, hem band flat. Socks step 2. Line sag 0.08.
LINE: 🔴 THE DISC HAS SHRUNK TO 0.03 OF THE SPREAD - a thumbnail. The lime ridge is at step 1
  everywhere except that small pressed circle. Shadow band x0.48.
PASS: 1.6 heads.
CAMERA: close-up, the same slant and the same distance as p3 - lay the two side by side.
SUBJECT: LOWER CENTRE - KidGoat in exactly p3's posture, one knee up, the same sole laid on the
  same place, head bent. His eyes are round.
SETTING: the shrunken disc on the white ridge; dry cobbles; the hem of the blanket entering the top
  edge, with only its lowest band still flat and saturated. 🔴 NO FALLING DROP ANYWHERE.
FINISH: 2 - the sole on the small disc, and the disc.
TONE: p3's two values again, but the dark one is now a fraction of its size, so the page is nearly
  all pale sheet. GRADE: upright, hooves as hands, 0 fingers. No lettering or numerals.
```

### p8 — "지나갔다!" (고개만)

```
DRY: white bands at step 3 across the top, step 2 in the middle, and ONE FLAT BAND still along the
  hem. Socks at step 3. Line sag 0.06.
LINE: ridge unbroken and white; disc down to 0.015, almost only a crease ring; shadow band x0.54.
PASS: 2.2 heads - the hem hangs at the standing kid's back height and just brushes it.
CAMERA: close-up, the same very low camera as p2 and p5, same distance, same angle - the third of
  three.
SUBJECT: CENTRE - KidGoat walking out on two legs with only his head ducked, one fore-hoof reaching
  forward, back grazing the hem (sheet posture c). 🔴 STILL 0 WET MARK ON HIM - the hem that
  touches him is dry raised paper there.
SETTING: the hem above his back; dry cobbles; the lower part of the #9A9186 door.
FINISH: 2 - the ducked head, and the hem it passes under.
TONE: same light as p2 and p5. The shadow under the cloth is shallow now because most of the cloth
  is raised. GRADE: upright, hooves as hands, 0 fingers. No lettering or numerals.
```

### p9 — "닿지도 않아요." 🔴 솟음 기준판

```
DRY: 🔴 THE GAUGE PAGE. Every white band is at step 3 EXCEPT ONE FLAT BAND A HAND DEEP ALONG THE
  HEM - that single flat strip is the last wet thing in the book and the printed #B0316A stripe
  inside it is the only saturated ink in frame. Socks step 3. Line sag 0.03, nearly straight.
LINE: ridge unbroken at step 1; the disc is gone, only a faint crease ring; shadow band x0.58.
PASS: 🔴 3.0 heads - KidGoat stands straight under the cloth and the hem is a hand above his ears.
  Nothing touches him.
CAMERA: medium, from the side at child's eye level, head and hem in one frame.
SUBJECT: CENTRE - KidGoat standing straight, hooves at his sides, ears up, eyes rolled upward at
  the hem (sheet posture d). 🔴 The gap between ear tips and hem is one hand and it is the most
  finished thing on the page.
SETTING: the blanket overhead, raised except the hem band; the dried socks beside it; the taut
  line; the white ridge below.
FINISH: 2 - the gap over the ears, and the last flat band at the hem.
TONE: late light, all of it flat. GRADE: upright, hooves as hands, 0 fingers. No lettering or
  numerals.
```

### p10 — "이제 안 지나갈래요."

```
DRY: 🔴 EVERY BAND AT STEP 3, THE HEM INCLUDED - the first page with 0 flat area anywhere on the
  blanket. The printed stripes lie between fully raised bands. Socks step 3. Line sag 0.02.
LINE: ridge unbroken; 0 disc, crease ring only; shadow band x0.62.
PASS: 3.0 heads - unchanged from p9, and he does not go under it.
CAMERA: medium close-up, slightly low, looking up.
SUBJECT: CENTRE - KidGoat on tiptoe, one hoof stretched high overhead, body long, the hoof tip
  touching the hem, eyes on the pegs at the top edge (sheet posture e). RIGHT BEHIND - GranGoat
  pushing off the wall, turning her face this way.
SETTING: the hem and the reaching hoof; two #9A9186 pegs on the top edge; the taut line; the ridge
  below. Nothing else in frame.
FINISH: 2 - the hoof tip at the hem, and the hem.
TONE: long low light lying along the stretched arm as one flat hard-edged band, 0 gradient.
  🔴 GRADE: upright, hooves as hands, 0 fingers, THE HOOF IS A SPLIT WEDGE - he touches it with the
  whole tip, never with a fingertip. No lettering or numerals.
```

### p11 — "하나 남았다."

```
DRY: all bands at step 3. Socks step 3. Line sag 0.02.
LINE: ridge unbroken and white; crease ring only; shadow band x0.66.
PASS: not measured - nobody passes under.
CAMERA: medium, straight on at the height of the line.
SUBJECT: LEFT - KidGoat on full tiptoe, both hooves spreading one #9A9186 peg off the line, tongue
  just showing, eyes on the peg. RIGHT - GranGoat holding the far end of the blanket level on one
  hoof, watching him (sheet posture d, first half).
SETTING: one peg left on the line, one peg in his hooves, one peg lying on the cobbles; the raised
  blanket between them; the dried socks; the white ridge.
FINISH: 2 - the peg being opened, and the raised blanket it holds.
TONE: the sun is only on the upper wall now; the lower half of the page is one flat #DCD2BE plane
  with 0 marks in it. GRADE: upright, hooves as hands, 0 fingers. No lettering or numerals.
```

### p12 — 담요가 스르르 내려왔어요

```
DRY: all bands at step 3, and 🔴 THE WHOLE RAISED MASS IS SLIDING - the swell keeps its volume as it
  falls, it does not flatten in the air. Socks step 3, still on the line. 🔴 The emptied line springs
  to sag 0, dead straight.
LINE: ridge unbroken and white; crease ring only; shadow band x0.70.
PASS: not measured.
CAMERA: medium, slightly high, looking down.
SUBJECT: CENTRE - KidGoat standing with both arms thrown wide, face turned up, the falling cloth
  just settling onto his open arms (sheet posture f, first half). RIGHT - GranGoat's hoof opening,
  the far end just leaving it.
SETTING: the last peg hanging open on a hoof tip; the straight empty line above; the ridge below.
FINISH: 2 - the arms, and the raised mass landing on them.
TONE: the falling cloth cuts the low light off the kid's face, and that shade is ONE FLAT #DCD2BE
  shape with a hard edge. GRADE: upright, hooves as hands, 0 fingers. No lettering or numerals.
```

### p13 — "볕 냄새가 나요." 🔴 p1 과 같은 자리

```
DRY: 🔴 the whole blanket at step 3 IN HIS ARMS - the thickest raised place in the book is the kid's
  chest, and it is bare paper with 0 ink on it. The printed stripes run flat over the folds. Socks
  step 3, now over GranGoat's arm. The empty line is straight, sag 0.
LINE: 🔴 THE RIDGE IS WHOLE - one unbroken white raised line at step 1 running clear across the
  cobbles at y0.86, with 0 disc and 0 crease ring on it. Shadow band x0.76 and wider.
PASS: nothing to pass under; the line is empty.
CAMERA: wide, low, child's eye level - 🔴 the same place and the same framing as p1.
SUBJECT: LEFT FRONT - KidGoat holding the whole blanket against his chest with both arms, face
  buried in it, the hem down to his feet (sheet posture f, second half). RIGHT BEHIND - GranGoat
  standing under the empty line, the socks over one arm, looking this way.
SETTING: the empty line with 3 pegs on it; the flat #DCD2BE wall and its one #9A9186 door.
FINISH: 2 - the bundle in his arms, and the white ridge under his feet.
TONE: the two brightest things are the raised bundle and the raised ridge, and both are bare sheet.
  GRADE: upright, hooves as hands, 0 fingers. No lettering or numerals.
```

---

## 첫 렌더 검수 체크리스트 (6항목)

1. **획이 몇 개인가 → 거의 0.** 붓이 지나간 자국이 보이면 g06 의 앵커다.
2. **흰 것이 둘인가** — 회벽이 지지면과 같은 밝기로 나오면 실패. 회벽은 인쇄된 `#DCD2BE` 다.
3. **솟은 자리에 잉크가 묻었나** — 담요의 흰 띠에 색이 얹히면 실패. 인쇄된 줄 다섯은 **띠 사이**에만 있다.
4. **양각 가장자리에 그라데이션이 있나** — `#DCD2BE` 한 톤, 하드 엣지가 아니면 재굽기.
5. **p2 ↔ p5 ↔ p8 을 나란히 놓았을 때** 카메라가 같고 **틈만 0.5 → 1.2 → 2.2 로 벌어지나.**
6. **p1 ↔ p13 이 같은 그림인가** — 회칠 금이 `y0.86` 에 있고, p1 은 덮여 있고 p13 은 통째로 드러났나.
