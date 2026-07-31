# 창작동화 1000 — C-15 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/c15.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## C-15 §1. 앵커 배정

**권**: c15 「밤에만 피는 꽃」 · 소원의 대가 · 스페인 안달루시아 마당 한 칸 · 13쪽 · 4~6세
**클러스터**: C1 · **슬러그**: `changjak-soakwall` (**재사용** — 원본 e02. 앵커 원본 그림도 그대로 물려받는다)
**한 줄**: 지지면이 물감을 **빨아들여 색이 표면 아래로 스민다**. 화면에서 표면 **위에** 얹힌 불투명한 것은 딱 하나.

🔴 **바꾼 것은 팔레트 hex · 관통 줄 3개 · 방향 한 줄 · 밀도 배급 쪽 번호뿐이다.** 공정(스밈 3단·불투명 하나·윤곽 0·마감 위계)은 e02 그대로다. e02 원본에만 해당하던 소품 개수(광장 자갈·차양 줄무늬·과일 상자·계단)는 **이 권에 없는 것이라 뺐다** — 그 자리에 마당 것을 넣었다.

🔴 **형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | 판정 |
|---|---|---|
| **e02** `changjak-soakwall`(원본) | **얹힌 하나가 채도 최고인가 0인가 · 스밈이 자라나** | e02 = 대낮 광장 · 얹힌 것이 **채도 최고의 빨간 체리** · 스밈은 안 움직이는 무대 · **c15 = 밤 마당 · 얹힌 것이 채도 0 의 흰 꽃** · 스밈이 **자라는 계기판** |
| **b04 · g08**(둘 다 스페인 흰 마을) | **밝은가 어두운가 · 그림자가 있나** | 저 둘은 대낮 골목에서 **그림자**를 다루는 책이라 화면이 밝다 · **c15 는 밤빛 #232A34 가 지배면이고 그림자가 0** |
| **a47 · a50**(같은 배치의 소원의 대가) | **없어지는 것이 보이나** | a47 = 붉은 면적이 줄어드는 게 보인다 · a50 = 틈이 벌어지는 게 보인다 · **c15 = 없어지는 것이 향기라 안 보이고 대역이 흙 색 경계 하나다** |

🔴 **이 권의 기계장치 = 화분 흙의 색 경계 하나.** 향기는 그릴 수 없으므로 그 자리를 **젖은 흙(3단)과 마른 흙(1단)의 가로 경계**가 대신한다. p7 에 생겨 p13 까지 **같은 자리에** 있고, 나방이 앉는 곳은 늘 그 경계 **너머**다. `SOAK:` 줄에 쪽마다 경계 위치와 그 양쪽에 무엇이 있는지가 못박혀 있다 — 줄여 쓰지 마라.
🔴 **향기 표시는 전 쪽 금지.** 아지랑이·반짝임·피어오르는 김·후광·냄새선·비행 궤적, 한 쪽도 없다. 냄새의 있고 없음은 **볼 수 있는 것 셋**으로만 온다 — ①나방의 몸이 어디로 가나 ②코가 꽃에서 몇 뼘인가 ③눈이 감기나 뜨이나.
🔴 **낮과 밤은 새 색이 아니라 스민 단계다** — 노랑을 안 들인다. 한낮 = 같은 판을 1단, 밤 = 같은 판을 3단.

**대본 SCENE 처방표** (대본은 안 고치고 컷에서 분기)

| 대본 문구 | 옮기는 법 |
|---|---|
| p2 「굵기만 확 줄었다 · 시든 게 아니라 접힘」 | 갈색으로 마르게 하지 마라 → **같은 흰 형상, 폭만 1/4**. 오므라든 것은 **불투명이 아니라 스민 색** |
| p4·p7 「물줄기가 통째로 반짝인다」 | 반짝임 없는 매체 → **물감이 안 먹은 맨 지지면**(0 소크)으로 |
| p12 「물방울이 달빛에 반짝인다」 | 같은 처방 — 방울 하나만 0 소크(그 쪽에서 유일) |
| p11 「위쪽 다섯은 흐릿하다」 | 초점 흐림 없음 → 다섯을 **프레임 위 가장자리에서 잘라 밑동만** |
| p6 「배경을 거의 밀어낸다」 | **1단 소크 한 판**으로, 표시 0 |
| p9 「날갯짓 자국이 지그재그로 이어진다」 | 🔴 **궤적선을 긋지 마라**(향기 표시와 같은 병) → 나방 한 마리 + **벽에 그림자 마크 하나** |

---

## C-15 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-soakwall

Style: picture book for 4-6 year olds. ONE Andalusian patio, walled on all four sides, drawn thirteen times: PotKit fixes the map and only the camera moves. Colour is soaked INTO the support the way pigment is fed into damp lime plaster: it sits under the surface, matte and slightly grainy, never on top of it. Exactly one thing in every frame is opaque and sits on the surface - an OPEN white night flower.

RENDERING (finish hierarchy)
Opaque objects per page = exactly 1 - the open white flower (all the open ones together are that one opaque body). 🔴 On the pages where every flower is furled there is 0 opaque paint and nothing may take its place; a furled bud is soaked, not opaque.
Soak value has 3 fixed steps and no more: 1 pale, 2 mid, 3 deepest. A shape is one step, never two steps blended, and the same area is never re-soaked to darken it.
A figure = 2 to 4 soaked areas, its outer edge crisp where the brush stopped and feathered at most 2mm. Drawn contour lines = 0.
FINISHED THINGS PER PAGE = 2 - the kitten, and the flower or bud she is dealing with. DENSITY RATION = pages 1 and 13, patio objects recognisable and no further.
Counts: wall = 0 cracks, 0 bricks · floor = alternating squares, at most 5 joint marks per frame · pot earth = 0 pebbles, at most 4 crack marks · water = 1 strand or 1 fan, never both · dark marks per page = at most 8, each a flat #232A34 mark at step 3 (eyes, a nose, an open mouth, the moth). There is no black.
🔴 THE POT EARTH IS THE GAUGE - one pigment #8A6B4C in two steps: watered earth = step 3, dry earth = step 1, and the line between them is HORIZONTAL, HARD-EDGED, ACROSS THE MIDDLE OF THE POT and IN THE SAME PLACE ON EVERY PAGE FROM p7 TO p13. Never re-wet it, soften it, move it, or hide it behind a figure.

PALETTE
#BFB4A2 lime wall and tiled floor, the whole field of the daylight pages at step 1 · #232A34 the night, the blue floor squares, the kitten at step 2, and every dark mark and the moth at step 3 · #8A6B4C the pot and its earth only, dry at step 1 and watered at step 3 · #F6F3E8 the open flower, the only opaque body and the only thing lying on the surface.
No other colour enters this book. 🔴 NO YELLOW AND NO MOONBEAM: midday is the same field at step 1, night the same field at step 3.

CHARACTER DESIGN LANGUAGE
🔴 THE KITTEN IS ON ALL FOURS ON EVERY PAGE - she lifts ONE foreleg to touch or push, and rises on her hind feet only to hold the bucket. She never walks upright, never has hands, and wears nothing: no clothes, no shoes, no collar.
🔴 THE MOTH IS A MOTH - a flat grey mark the size of the kitten's eye. No face, no expression, no trail, no glow, and it never gestures.

CANVAS
16:9 double-page spread. No letters, numbers, signs or symbols anywhere - not on the gate, the pot, the bucket or the tiles.

NOT (rendering only)
- 🔴 no scent made visible on any page: 0 shimmer, 0 sparkle, 0 rising wisp, 0 halo, 0 scent line, 0 flight trail
- no paint on the surface except the open flower - opaque bodies per page = 1 or 0, never 2
- 0 drawn contour lines, and no gloss, gradient, airbrush, glow, texture filter or 3D render
- no needle-felted wool, stitching or fibre edges
```

### 🔴 이 앵커의 세 관통 줄

**`BLOOM:`** 여덟이 어떤 상태인가 — 위 다섯 · 아래 봉오리 셋. 개수는 열세 쪽 내내 여덟 고정이다.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 | p13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 열림 · 3 오므림 | 🔴 전부 오므림(불투명 0) | 전부 오므림(불투명 0) | 전부 오므림(불투명 0) | 1 열림 · 4 오므림 | 1 열림(클로즈업) | 🔴 다섯이 저마다 다른 정도로 열리는 중 | 5 열림 | 5 열림 | 5 열림 · 봉오리 1 이 반쯤 | 반쯤 하나 · 2 오므림 | 반쯤 하나 · 2 오므림 | 🔴 여덟 다 열림 |

**`SOAK:`** 흙 경계가 어디 있고 그 양쪽에 무엇이 있나 — p1~p4 경계 없음(전부 마름), p5 는 꽃 하나 밑동만, **p7 에 가로 경계가 생겨 p13 까지 같은 자리**.
**`NOSE:`** 코가 꽃에서 몇 뼘이고 눈이 감겼나 — p1 닿음·감김 / p6 🔴 닿음·**뜸** / p11 닿음·감김 / p13 🔴 **마당 하나만큼 떨어짐·감김**.

---

## C-15 §3. 캐릭터 시트 (🔴 이것부터 굽는다 — 장면 금지)

### 시트 1 — KittenPatio

```
CHARACTER SHEET - KittenPatio   (bake this FIRST, attach as @image1)

Medium: STYLE ANCHOR changjak-soakwall - colour soaked under the surface, 0 contour lines, no shading.
Do NOT render this animal roundly or smoothly just because there is no background behind her.

FACE
A small kitten's round head in soaked #232A34 at step 2, a paler muzzle in the same pigment at step 1
set into it, two flat triangular ears. Eye = one flat #232A34 oval at step 3; 🔴 SHUT EYE = ONE FLAT
CURVED LINE, and the shut eye is used more than the open one in this book. Nose = one smaller mark.
Open mouth = one flat shape, wider than tall. No eyebrows, no whisker lines, no blush, no tongue.
Draw the head in SIX STATES: eyes shut and easy / eyes shut with the mouth corner up / both eyes wide
open / one eye wide with the head tilted / eyes wide with the mouth open shouting / eyes half shut.

COAT
Flat soak #232A34 at step 2 over the whole body, 0 strokes, 0 tufts. Crisp outer edge, feathered no
more than 2mm. 🔴 SHE IS STEP 2 AND NOTHING ELSE IS - the night field is step 3 and the day field is
step 1, so she is legible on both without ever changing colour.

CLOTHES
None. No clothes, no shoes, no collar, no ribbon, nothing carried except the bucket.

🔴 GRADE - FOUR LEGS ON EVERY PAGE. Draw the POSTURE STRIP, eight flat figures:
  1. standing four-square, neck stretched long, the whole face pushed into a flower so the nose is
     buried and both eyes are shut lines;
  2. 🔴 ONE foreleg lifted, pad flat, pressing down on something small - the other three feet planted;
  3. up against a pot rim, both forelegs laid on the rim side by side with the forehead set between
     them, eyes shut, back curved, tail slack on the floor;
  4. 🔴 braced on the hind feet with both forelegs holding a bucket rope that is SLIPPING - forelegs
     dragged up, toes splayed, neck thrown back, one hind foot skidding;
  5. braced on the hind feet, the bucket lifted above the head and tipped hard, back arched, tail up;
  6. sitting neatly, forepaws together, head up, eyes as two shallow curves, tail sweeping the floor;
  7. 🔴 up on the hind feet with ONE foreleg stretched out full length pointing with the toes, but the
     body twisted the other way - the pointing and the looking go in opposite directions;
  8. lying flat on one side, all four legs stretched out forward, eyes shut, whisker area relaxed,
     🔴 the nose touching NOTHING.

BUILD & SILHOUETTE
A small kitten, head one third of body length, short legs, a thin tail. Silhouette test: she is the
only step-2 mass in the book - the moth is a step-3 dot, the pot is #8A6B4C, everything else is field.

REFERENCE SHEET
One flat pale field, figures floating, no ground, no shadow, no scenery, no lettering:
full body side / three-quarter from the front / the eight-pose posture strip / the six head states /
one foreleg alone with the pad flat.
SCENE token: KittenPatio.
```

### 시트 2 — MothGrey

```
CHARACTER SHEET - MothGrey   (bake this SECOND, attach as @image2)

Medium: STYLE ANCHOR changjak-soakwall - soaked colour, 0 contour lines, no shading, no glow.

BODY
ONE flat #232A34 mark at step 3, about the size of the kitten's eye. 🔴 IT IS A DARK MARK, NOT A
CHARACTER: no face, no eyes, no expression, no antennae detail beyond 2 short strokes, 0 wing pattern,
0 fibre, 0 dust, 0 glow, 0 sparkle, 0 trail line, 0 motion lines.

DRAW THESE STATES:
  1. sitting with the wings folded flat along the body - one small closed shape;
  2. flying, the wings as two flat triangles held out, the body between them;
  3. 🔴 the same flying shape seen against a pale wall, with ONE small soaked mark beside it on the
     wall as its only shadow - and NO line showing where it has been;
  4. sitting on the rim of an open flower, wings folded;
  5. 🔴 sitting on a half-open bud, wings folded, the bud smaller than the moth's wingspan.

🔴 IT NEVER SPEAKS, POINTS OR REACTS. Everything it says in this book it says by where its body is.

REFERENCE SHEET
One flat pale field, no ground, no shadow, no scenery, no lettering: the five states, plus one size
comparison beside a kitten's eye oval at the same scale.
SCENE token: MothGrey.
```

### 시트 3 — PotKit

```
PARTS SHEET - PotKit   (bake this THIRD, attach as @image3 - this sheet is the book's machine)

Medium: STYLE ANCHOR changjak-soakwall - soaked colour, 0 contour lines, no shading.
🔴 BAKE THIS OR THE GAUGE WILL DRIFT. Eight flowers and one soak line decide thirteen pages.

DRAW THESE PARTS on a plain pale field:
  1. 🔴 THE POT: one big earthenware pot, flat #8A6B4C at step 2, 0 pattern, 0 handles, 0 rim detail
     beyond one edge.
  2. 🔴 THE EIGHT: FIVE flowers on the upper stems and THREE buds low down near the earth. This count
     never changes on any page. Draw each in its states:
       - an upper flower OPEN: a white #F6F3E8 trumpet, 🔴 OPAQUE, sitting ON TOP of the surface -
         the only thing in the book that does;
       - the same flower FURLED: the same white form rolled to a QUARTER of its open width, long and
         thin, 🔴 STILL WHITE, NOT BROWN, NOT WILTED - and soaked, not opaque;
       - a low bud FURLED: a small tight roll;
       - 🔴 a low bud HALF OPEN: opened about half, smaller and narrower than any upper flower;
       - a low bud FULLY OPEN.
  3. 🔴 THE SOAK LINE: the pot's earth drawn three ways -
       (a) ALL DRY: one even step-1 #8A6B4C field, at most 4 crack marks, 0 pebbles;
       (b) ONE PATCH WET: step 3 only in a ring round one upper flower's base, everything else step 1;
       (c) 🔴 THE BOUNDARY: the upper half of the earth step 3 and the lower half step 1, the line
           between them HORIZONTAL and HARD-EDGED, running across the middle of the pot, with the
           three low buds all on the DRY side. This exact line is copied onto p7 p8 p9 p10 p11 p12 p13
           without moving.
  4. THE WELL: three soaked shapes only - a low round rim, a wooden bucket, one rope over a pulley.
     0 stones drawn. Draw the bucket three ways: hanging still / tipped hard and pouring a fan of
     water / 🔴 tipped and NOT pouring, with ONE drop hanging at the lip.
  5. THE WATER: one strand and one fan, both rendered as 🔴 BARE UNSOAKED SUPPORT (0 soak), never as
     white paint, never with sparkle or highlight.
  6. THE PATIO: a wall plane with 0 cracks and 0 bricks; a floor of alternating squares (pale
     #BFB4A2 and step-1 #232A34) with at most 5 joint marks; 3 small wall pots; a gate of exactly
     5 vertical bars.
🔴 No letters, numbers, signs or symbols on any part of this sheet.
```

---

## C-15 §4. 13컷

각 컷은 `STYLE ANCHOR + @image1(KittenPatio) + @image2(MothGrey) + @image3(PotKit) + 아래 블록` 으로 합성한다.

### p1 — 좋은 냄새 🔴 밀도 배급 1/2

```
--- p1 - 좋은 냄새 ---
BLOOM: 5 upper flowers OPEN and opaque white, 3 low buds furled - the one opaque body.
SOAK: 🔴 no boundary yet; the whole pot earth is one even step-1 dry #8A6B4C.
NOSE: buried in a flower, both eyes shut lines.
CAMERA: medium, eye level. Pot and flowers frame right, the kitten coming in from the left.
SUBJECT: KittenPatio posture 1 - standing four-square, neck stretched long, the whole face pushed into
  an open flower, both eyes shut curved lines, ears easy to the sides, tail tip up. 4 legs, no
  clothes/shoes/collar.
SETTING: MothGrey state 4 on the rim of one open flower, wings folded - one small step-3 mark, 🔴 the
  only thing in frame that could move. The well and bucket, 3 wall pots, the gate at 5 bars, floor
  squares with at most 5 joint marks. 🔴 No scent drawn: 0 shimmer, 0 sparkle, 0 wisp. No lettering.
FINISH: DENSITY RATION 1 of 2 - well, gate and wall pots recognisable and no further. FINISHED =
  KittenPatio + the flower her face is in.
TONE: the patio sits at step 3 night. 🔴 The five whites are the brightest thing by a long way - the
  eye goes there first, then to the shut eyes beside them.
```

### p2 — 낮엔 안 보여 줘

```
--- p2 - 낮엔 안 보여 줘 ---
BLOOM: 🔴 all 5 upper flowers FURLED - same place and same count as p1, rolled to a quarter of their
  width, still white, not brown, not wilted. 3 low buds furled. 🔴 0 OPAQUE PAINT ON THIS PAGE.
SOAK: no boundary; the earth is all step-1 dry.
NOSE: not used - she touches with a paw, not a nose, and both eyes are wide open.
CAMERA: close-up, HIGH, straight down at the top of the pot - 🔴 the same direction as p1 so the two
  can be compared at a glance.
SUBJECT: KittenPatio posture 2 entering from the top - one foreleg lifted with the pad flat, pressing
  the end of one furled flower, the other three feet planted. Half her face in frame, both eyes wide
  ovals, one ear forward, mouth slightly open. 4 legs, no clothes/shoes/collar.
SETTING: 🔴 NO MOTH ANYWHERE IN THE FRAME - not on the flowers, not on the wall, not in the air.
  The pot rim, a strip of floor squares. 🔴 No scent drawn. No lettering.
FINISH: FINISHED = KittenPatio + the furled flower under her pad. The pot is one flat soak.
TONE: the field drops to step 1 for morning - flat, bleached, hard. 🔴 Nothing is opaque, so the page
  has no bright spot at all; that flatness is the event.
```

### p3 — 낮에도 피어 있으면 좋겠다

```
--- p3 - 낮에도 피어 있으면 좋겠다 ---
BLOOM: 5 upper flowers furled, 3 low buds furled. 🔴 0 opaque paint on this page.
SOAK: no boundary; all step-1 dry, with at most 4 crack marks in the earth.
NOSE: not touching a flower - her forehead is on the pot rim and both eyes are shut lines.
CAMERA: medium wide, LOW from floor-tile height; the wall plane fills the upper frame.
SUBJECT: KittenPatio posture 3 at frame right - up against the pot, both forelegs laid on the rim side
  by side, forehead set between them, both eyes shut curved lines, ears back a little, back curved,
  tail slack. 🔴 Draw her SMALL in a large frame. 4 legs, no clothes/shoes/collar.
SETTING: the furled five stand just above her forehead, the 3 buds below. 🔴 THE WELL MUST BE IN FRAME
  at rear left - rim, bucket, rope over the pulley - because the next page uses it. Wall = 0 cracks.
  🔴 No scent drawn. No lettering.
FINISH: FINISHED = KittenPatio + the pot rim under her forehead. The well stays a plain soaked shape.
TONE: field at step 1, hot and flat. 🔴 The size of the wish is carried by the patio being big and the
  body small - do not enlarge the pose, and give it no beam, glow or halo.
```

### p4 — 어어, 쏟았다

```
--- p4 - 어어, 쏟았다 ---
BLOOM: 5 upper flowers still furled, 3 low buds furled. 🔴 0 opaque paint on this page.
SOAK: 🔴 no boundary yet, but 🔴 THE WATER GOES ONLY TO THE UPPER HALF OF THE POT - the strand passes
  above the three low buds and not one drop reaches them. This aim is the whole book.
NOSE: far from the flowers; she is at the well.
CAMERA: medium, eye level. The well at centre, the pot frame right, the water crossing between them.
SUBJECT: KittenPatio posture 4 - braced on the hind feet, both forelegs on a rope slipping through
  them, forelegs dragged up, toes splayed wide, neck thrown back, both eyes wide, mouth open, one hind
  foot skidding, tail stiff. 🔴 It reads as lost, not aimed. 4 legs, no clothes/shoes/collar.
SETTING: the tipped bucket and ONE thick water strand, 🔴 BARE UNSOAKED SUPPORT with no paint and no
  sparkle, curving toward the upper pot. At most 5 water marks on the floor. 🔴 No scent drawn.
  No lettering.
FINISH: FINISHED = KittenPatio + the bucket. The pot is a plain soak this page.
TONE: field at step 1. 🔴 The brightest thing in frame is the unpainted water strand, and it is bright
  because it is empty, not because it is lit.
```

### p5 — 폈다, 낮인데 폈어

```
--- p5 - 폈다, 낮인데 폈어 ---
BLOOM: 🔴 1 upper flower OPEN - the one the water ran down. 4 upper flowers still furled beside it,
  3 low buds furled. That single open flower is the one opaque body.
SOAK: 🔴 no boundary yet - only a step-3 ring at that ONE flower's base; the rest of the earth,
  including all round the three low buds, is still step-1 dry.
NOSE: beside, not in - her face is at the flower's side and both eyes are wide open.
CAMERA: close-up, eye level. The wet flower frame left, the kitten frame right.
SUBJECT: KittenPatio braced up on the pot with both forelegs hooked over the rim, body pulled up, face
  level with the flower, both eyes at their widest, ears straight up, mouth open shouting, claws
  scuffing the rim. 4 legs, no clothes/shoes/collar.
SETTING: 🔴 THE OPEN ONE AND THE FURLED FOUR IN ONE FRAME AT ONE DEPTH so the difference reads. Water
  beads on the open flower = at most 5 unsoaked marks. Floor water = one soaked patch.
  🔴 No scent drawn. No lettering.
FINISH: FINISHED = KittenPatio + the open flower. Wall and floor stay one step-1 soak, empty.
TONE: field at step 1. 🔴 The one open white is the only opaque thing in frame - one thing has changed
  and the page holds nothing else.
```

### p6 — 아무 냄새도 안 나

```
--- p6 - 아무 냄새도 안 나 ---
BLOOM: 1 upper flower OPEN, filling the frame with her face. The one opaque body.
SOAK: the step-3 ring at that flower's base is still creeping at its edge; no boundary yet.
NOSE: 🔴 DEEPEST OF THE BOOK - the nose is right inside the flower, but 🔴 BOTH EYES ARE WIDE OPEN
  OVALS looking up and sideways. p1 and p11 have shut eyes here; this page does not.
CAMERA: extreme close-up, slightly LOW. One flower and half a kitten's face fill the frame.
SUBJECT: KittenPatio's face frame right at half the frame's size, nose buried in the flower, the bridge
  of the nose folded where it presses the petal, 🔴 both eyes wide, one ear back, neck pushed further
  in. 4 legs (only the shoulders show), no clothes/shoes/collar.
SETTING: 🔴 NO MOTH ANYWHERE IN THE FRAME - same flower, same open shape as p1, nothing sitting on it.
  At most 5 unsoaked water beads on the petals. One furled flower's flank at the frame edge. Background
  = ONE step-1 soak with 0 marks. 🔴 No scent drawn. No lettering.
FINISH: FINISHED = KittenPatio + the flower. Nothing else carries finish.
TONE: pressed close enough to feel airless. 🔴 The nose cannot get nearer and nothing happens - the
  open eyes and the folded nose bridge carry that alone.
```

### p7 — 많이 피면 냄새도 많이 나겠지 🔴 흙 경계가 생기는 쪽

```
--- p7 - 많이 피면 냄새도 많이 나겠지 ---
BLOOM: 🔴 all 5 upper flowers unrolling AT DIFFERENT AMOUNTS in one frame, so the opening reads as an
  action. 3 low buds furled and untouched. The five are the one opaque body.
SOAK: 🔴 THE BOUNDARY IS BORN HERE - the fan stops at the upper half, the upper earth goes to step 3
  at once, the earth round the three low buds stays step 1, and the line between them is HORIZONTAL
  and HARD-EDGED across the middle of the pot. 🔴 Fix it now; p8-p13 copy it exactly.
NOSE: far - she is at arm's length with the bucket, eyes narrowed to happy curves.
CAMERA: medium wide, HIGH - looking down so the whole pot and the fan are both flat in frame.
SUBJECT: KittenPatio posture 5 at frame right - the bucket lifted above her head and tipped hard, eyes
  two shallow curves, mouth open shouting, tail straight up. 4 legs, no clothes/shoes/collar.
SETTING: ONE water fan, 🔴 BARE UNSOAKED SUPPORT, no paint, no sparkle. Floor water = one soaked patch. 🔴 No scent drawn. No lettering.
FINISH: FINISHED = KittenPatio + the pot with its opening five. Well and wall stay plain.
TONE: field at step 1, the loudest and brightest page in the book. 🔴 Six quiet pages follow, so spend
  the noise here - and draw the hard soak line clean.
```

### p8 — 오늘은 계속 피어 있어

```
--- p8 - 오늘은 계속 피어 있어 ---
BLOOM: 5 upper flowers OPEN and staying open at night, 3 low buds furled. The one opaque body.
SOAK: 🔴 the boundary exactly as fixed in p7 - upper earth step 3, lower step 1, the line horizontal
  and in the same place. Do not move it, soften it, or hide it behind her.
NOSE: not touching - she sits back and looks up, eyes two shallow curves.
CAMERA: wide, eye level across the patio - the well frame left, pot and kitten frame right.
SUBJECT: KittenPatio posture 6 before the pot, head up at the five flowers, eyes two shallow curves,
  mouth open, 🔴 only the tail moving, sweeping the tiles and leaving one thin soaked wet mark.
  4 legs, no clothes/shoes/collar.
SETTING: 🔴 NO MOTH ANYWHERE IN THE FRAME - not on a flower, not on the wall, not in the air, not
  beyond the gate. This absence is the whole page. The well, the empty bucket, the gate at 5 bars with
  the lane behind it at step 3. 🔴 No scent drawn. No lettering.
FINISH: FINISHED = KittenPatio + the five open flowers. Everything else is one soaked step.
TONE: the field is back at step 3 night and the five whites are brightest again - 🔴 the same night and
  the same open flowers as p1, with the one small dark mark missing from the frame.
```

### p9 — 여기야, 여기 있잖아

```
--- p9 - 여기야, 여기 있잖아 ---
BLOOM: 5 upper flowers OPEN, 3 low buds furled. The one opaque body.
SOAK: the boundary unchanged and in the same place - 🔴 and the moth passes OVER the wet upper half
  and away, never toward the dry lower half yet.
NOSE: pointing, not smelling - her face is turned away from the flowers entirely.
CAMERA: medium wide, eye level. The pale wall fills frame left, pot and kitten frame right.
SUBJECT: KittenPatio posture 7 - up on the hind feet with ONE foreleg stretched out full length toward
  the five open flowers, toes pointing, 🔴 but the head and body twisted the other way after the moth;
  both eyes wide, ears pricked, mouth open shouting, one hind foot lifted to follow. 4 legs, no
  clothes/shoes/collar.
SETTING: MothGrey state 3 frame left, flying a hand's width above the open flowers and out toward the
  wall, 🔴 with ONE small soaked mark on the wall as its shadow and NO LINE, NO ZIGZAG, NO TRAIL
  showing where it has been. 🔴 Moth and flowers at ONE depth so the miss reads. 🔴 No scent drawn.
  No lettering.
FINISH: FINISHED = KittenPatio + MothGrey. The five flowers keep opaque white but no finish.
TONE: the pale step-1 wall is the widest area, so 🔴 the one step-3 dot on it is the only moving thing.
```

### p10 — 거기

```
--- p10 - 거기 ---
BLOOM: 🔴 ONE low bud HALF OPEN on its own, the other two low buds furled. The five open ones are
  cropped away at the top edge - only their stems show. The half-open bud is small and narrow.
SOAK: 🔴 THE ANSWER IS THE PAGE - the earth round the half-open bud is step-1 dry, and the hard
  horizontal boundary with the step-3 wet earth runs across the upper frame. 🔴 The moth is on the DRY
  side of that line, and nothing in the text says so.
NOSE: above and away - her face comes in at the top edge, head tilted, eyes wide.
CAMERA: close-up, HIGH - down at the bottom of the pot so the two earth steps split the frame across.
SUBJECT: KittenPatio's face and one foreleg at the top edge - head tilted, one ear dropped, both eyes
  wide looking down, one forepaw resting on the pot rim. 4 legs (out of frame), no clothes/shoes/collar.
SETTING: MothGrey state 5 - wings folded on the half-open bud, its wingspan wider than the bud. 🔴 No scent drawn, 0 trail. No lettering.
FINISH: FINISHED = her face + the half-open bud with the moth on it.
TONE: 🔴 the bright thing (the open five) is pushed out of frame and the small half-shut thing put in
  the middle. Field at step 3 night; the dry earth reads paler than everything around it.
```

### p11 — 여기서 나

```
--- p11 - 여기서 나 ---
BLOOM: the same low bud HALF OPEN, 2 low buds furled. The five open ones are cropped to stems at the
  top edge.
SOAK: boundary unchanged, running across the upper frame; the bud and the kitten are both on the dry
  side of it.
NOSE: 🔴 TOUCHING, AND BOTH EYES ARE SHUT CURVED LINES - the same eyes as p1, the opposite of p6.
CAMERA: close-up, LOW from earth height looking up - 🔴 so the small half-open bud stands taller in
  frame than the five open flowers, which are cropped at the top edge as stems only.
SUBJECT: KittenPatio lying low beside the pot, face turned on its side, nose right against the half-open
  bud, both eyes shut curved lines, whiskers relaxed, both forepaws flat on the earth, mouth corner up.
  4 legs, no clothes/shoes/collar.
SETTING: MothGrey still on the petal edge beside her, wings folded, 🔴 not flying off although she is
  this close. 🔴 No scent drawn: 0 shimmer, 0 sparkle, 0 wisp, 0 halo. No lettering.
FINISH: FINISHED = KittenPatio + the half-open bud. The five open flowers are stems only.
TONE: field at step 3 night. 🔴 The smallest thing is drawn biggest and the biggest cropped away -
  that inversion is the turn of the book, and the shut eyes finish it.
```

### p12 — 안 부을래

```
--- p12 - 안 부을래 ---
BLOOM: the half-open bud, 2 low buds furled directly under the bucket's lip. Five open above.
SOAK: 🔴 boundary unchanged - the earth beneath the hanging drop is still step-1 DRY.
  Nothing is re-wetted on this page or any page after it.
NOSE: not touching; head bent toward the buds, eyes open and quiet.
CAMERA: medium close-up, eye level. Tipped bucket frame left, kitten frame right, the two remaining
  furled buds low between them.
SUBJECT: KittenPatio holding the bucket in both forelegs, 🔴 STOPPED MID-TIP - forelegs frozen half
  turned, head bent toward the buds, both eyes open looking down, one ear sideways, tail still.
  4 legs, no clothes/shoes/collar.
SETTING: 🔴 the bucket is tipped and NOT POURING - ONE drop hangs at the lip as BARE UNSOAKED SUPPORT,
  and 🔴 the drop and a furled bud sit on the SAME VERTICAL so "stopped just before it touched" reads.
  MothGrey on the half-open bud beside them. 🔴 No scent drawn. No lettering.
FINISH: FINISHED = KittenPatio + the hanging drop. The bucket keeps its soak, no finish.
TONE: field at step 3 night. 🔴 Exactly two things in frame were about to move and have stopped (the
  tipped bucket, the unfallen drop); all else is still. No explanation is drawn anywhere.
```

### p13 — 여기까지 오네 🔴 착지 · 밀도 배급 2/2

```
--- p13 - 여기까지 오네 ---
BLOOM: 🔴 ALL EIGHT OPEN - the three low buds opened on their own, five above still open. All eight
  are the one opaque body, far right.
SOAK: 🔴 BOUNDARY STILL THERE, same place as p7 - upper step 3, lower step 1, hard horizontal line,
  never repaired or explained. 🔴 MothGrey folded on ONE lower flower, on the DRY side.
NOSE: 🔴 TOUCHING NOTHING - not a flower, not the earth, not the wall. A courtyard of empty tiles lies
  between her nose and the pot, both eyes shut lines.
CAMERA: wide, slightly HIGH, patio on the DIAGONAL - kitten near left, its eight flowers far right.
SUBJECT: KittenPatio posture 8 beside the well - face toward the pot, both eyes shut curved lines,
  mouth corner up, tail tip flicked once. 4 legs, no clothes/shoes/collar.
SETTING: 🔴 THE EMPTY TILES ARE THE PROPOSITION - half the frame is bare floor, at most 5 joint marks,
  nothing on it. DENSITY RATION 2 of 2 - well, bucket, pots, gate recognisable and no further. 🔴 No scent drawn: 0 shimmer, 0 sparkle. No lettering.
FINISH: FINISHED = KittenPatio + the eight open flowers.
TONE: step 3 night, even. 🔴 The eye starts at the shut face, crosses the empty
  tiles and lands on the white far side in one slide - that crossing is the ending.
```

---

## C-15 §5. 첫 렌더 검수 5항목

1. 🔴 **향기를 그렸나** — 아지랑이·반짝임·김·후광·냄새선·나방 궤적이 한 점이라도 있으면 실패다. 이 권은 그것 하나로 죽는다.
2. 🔴 **흙 경계가 p7~p13 같은 자리인가** — 한 컷이라도 움직였거나 부드러워졌거나 몸에 가려졌으면 다시 굽는다. 나방은 늘 **마른 쪽**에 있나.
3. 🔴 **얹힌 불투명이 열린 꽃뿐인가** — p2·p3·p4 에 불투명이 **0** 인가(오므린 것을 흰 물감으로 칠했으면 실패).
4. 🔴 **노랑이 들어왔나 · 그림자가 생겼나** — 낮은 1단, 밤은 3단, 그림자 0. 달빛 줄기나 노란 볕이 있으면 앵커가 아니다.
5. 🔴 **고양이가 두 발로 걷지 않나 · 나방이 얼굴을 갖지 않았나 · 글자가 어디에도 없나**(문·화분·두레박·타일).
