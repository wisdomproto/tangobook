# 창작동화 1000 — c05 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/c05.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## c05 §1. 앵커 배정

**권**: c05 「튤립이 다 팔린 날」 · 관찰과 성장 · 네덜란드 꽃시장 좌판 한 칸 · 13쪽 · 4~6세
**클러스터**: **C5** (반복 필드)
**앵커 슬러그**: `changjak-finishshift` — **신규 민팅**

**한 줄**: 뒤 띠는 **같은 실루엣 하나를 되풀이 찍은 판**(꽉 찼는데 정보 0)이고, **마감은 언제나 「팔릴 것」에 간다.** p10 부터 그 마감이 꽃에서 알맹이로, p12 부터 흙으로 옮겨 간다.

🔴 **마감 위계가 쪽마다 어디에 있는지가 이 권의 전부다.** 그래서 컷마다 `FINISH:` 로 **지금 마감을 든 것 하나**를 지목하고, **붓자국 개수 상한**으로 그것을 셀 수 있게 만든다(형용사로 「정교하게」라고 쓰면 모델이 다 정교하게 그린다).

| 쪽 | 마감을 든 것 | 붓자국 |
|---|---|---|
| p1~p9 | **빨간 튤립 꽃머리** | 꽃머리당 결 **6~9획** · 제 가장자리를 가짐 |
| p10~p11 | **갈색 알맹이** | 마른 껍질 결 **12~16획** · 그 쪽 화면의 유일한 마감 |
| p12 | **검정갈색 흙** (알맹이 꼭대기가 두 번째) | 흙덩이 자국 **20획 이상** · 마른 붓 |
| p13 | **눌린 흙과 앞발 자국 둘** | 자국 가장자리 **24획 이상** · 화면에서 가장 진하고 가장 많이 손댄 곳 |

🔴 **넘어간 뒤엔 되돌아오지 않는다.** p10 부터 화면에 남은 빨강은 **평칠 0~2획**으로 떨어지고, p12·p13 에는 **초록이 한 점도 없다**(대본 지정 — 싹·다음 봄 금지).

### 형제 권과 갈린 축 (첫 렌더에서 세어진다)

| 형제 | 갈린 축 |
|---|---|
| **c06** `changjak-feathermark` | 🔴 **마감이 옮겨 가나** — c06 은 깃털 넷만 도판 수준으로 올리고 그 넷이 **끝까지 고정**. c05 는 마감이 꽃 → 알맹이 → 흙으로 **통째로 이사한다** |
| **f03** `changjak-folkband` | **마감의 기준이 무엇인가** — f03 은 그 쪽에서 **소리를 내는 것**. c05 는 그 쪽에서 **팔릴 것**(그리고 마지막에 안 팔 것) |
| **a97 · a11 · b05 · h03** (C5 도장) | **도장이 무엇인가** — c05 의 도장은 **시장 사람 실루엣**이고 얼굴도 손도 없다. 필드는 열세 쪽 내내 **안 줄어들고**(f07 만 줄어든다), 대신 위의 마감이 움직인다 |
| **f07** `changjak-stamplift` (같은 배치) | 🔴 **반복이 무대인가 배경인가** — f07 의 반복은 **주무대**(이랑)라 걷히면 지지면이 드러난다. c05 의 반복은 **뒤 띠**뿐이다. 🔴 **튤립은 절대 도장으로 찍지 마라 — 손으로 그린다.** 찍는 순간 두 권이 같아진다 |
| **d04** `changjak-flatplate` | **물을 무엇으로 재나** — d04 는 물이 **면적이 한 칸씩 자라는 평면**. c05 의 물은 면적이 아니라 **앞발이 잠기는 깊이**이고, 재는 것은 늘 **같은 가운데 양동이 하나**다 |
| **d07 · h05** (같은 네덜란드) | c05 는 야외 · 좌판 한 칸 · 물은 깊이. 클러스터가 셋 다 다르다 |

### 대본 SCENE 처방표 — 쪽마다 마감·물·군중

| 쪽 | `FINISH:` 마감을 든 것 | `WATER:` 가운데 양동이 | `CROWD:` 뒤 띠 실루엣 |
|---|---|---|---|
| p1 | 튤립 (다섯 통 가득) | 물 **0** 보임 | **6** · 🔴 밀도 배급 쪽 |
| p2 | 튤립 (싼 다발) | 0 보임 | **6** |
| p3 | 튤립 (줄기 사이) | 앞발 **하나** 들어갈 동그란 자리 | **0** |
| p4 | 튤립 (들린 한 움큼) | 물방울만 | **5** |
| p5 | 튤립 (종이 속 꽃머리) | 프레임 밖 | **0** |
| p6 | 튤립 (벽 쪽 줄기) | 앞발 **둘**이 다 들어갈 넓이 | **4** |
| p7 | 튤립 (상판 위 남은 통) | 빈 양동이가 내려간다 | **3** |
| p8 | 튤립 (남은 줄기 셋) | 앞발이 **바닥에 닿음** | **0** |
| p9 | 튤립 (프레임 끝 종이 다발) | 상판 통째로 빔 · 물 자국 다섯 | **3** |
| p10 | **갈색 알맹이** | 프레임 밖 | **2** |
| p11 | **갈색 알맹이** (앞발 안) | 등 뒤 상판에 물 든 통 하나 | **0** |
| p12 | **흙** | 없음 | **0** · 🔴 초록 0 |
| p13 | **눌린 흙 + 앞발 자국 둘** | 빈 통 밑동만 위 끝에 걸림 | **0** · 🔴 초록 0 |

**사건 크기**: 작다(알맹이 하나) · `FINISHED THINGS PER PAGE = 2` · `DENSITY RATION = p1 only`

---

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-finishshift

Style: picture book for ages 4-6, one stall in a Dutch flower market, 13 spreads,
one location - the camera moves only between the stall top and the earth box
underneath it. Opaque gouache on warm laid paper; the bare paper itself is the
ground and is left unpainted wherever a page says empty. TWO WAYS OF MAKING A
MARK, and they never mix. (1) STAMPED: the back band of market people is ONE
hand-cut stamp of a single hooded standing figure, inked once in flat grey and
repeated across the band with only the spacing changed - identical impression
every time, no faces, no hands, no separated legs, no variation, 0 information.
(2) PAINTED BY HAND: everything else, brush marks visible, each object carrying
its own edge. Never stamp a tulip, a bucket, an animal or the soil.

RENDERING (finish hierarchy)
FINISHED THINGS PER PAGE = 2 - (a) the ONE object that currently holds the finish
and (b) the badger's working forepaws with whatever they are inside. The badger's
body, the goose, the stall and the market stay at raw medium. THE FINISH MOVES,
AND THAT MOVE IS THE EVENT: p1-p9 it belongs to the red tulip heads (petal ridges
= 6-9 strokes per head, each head with its own edge); p10-p11 it transfers to the
brown bulb (dry papery skin = 12-16 strokes, and it is the only finished object
in the frame); p12 it transfers to the dark soil (clod marks = 20+ dry-brush
strokes); p13 the pressed soil and the two paw prints carry it (24+ strokes,
darkest and most worked place on the spread). Once the finish leaves a thing it
never comes back to it - from p10 all remaining red drops to flat 0-2 strokes.
Everything else = at most 2 strokes per object. Stall boards = 0 grain except one
plank line. DENSITY RATION = p1 only (buckets packed full, band at 6 figures);
every other page keeps the surround open.

PALETTE
#C62828 tulip red - the only red in the book, and it shrinks off the spread as
the flowers sell / #9AA3A6 zinc bucket grey / #7E6A50 wet stall timber / #3A2A1E
soil brown-black, the lowest chroma in the book and the last thing to hold the
finish. The stamped band is #9AA3A6 knocked back. Green appears only as cut
leaves and stems, never more than a thumb's area, and is 0 on p12 and p13. No
other hue. Unpainted warm paper carries all empty areas.

CHARACTER DESIGN LANGUAGE
A badger cub and an old goose. Anthropomorphism grade, fixed for all 13 spreads:
NO CLOTHES on either, natural four-legged animal proportion, the badger rises on
his hind legs at the stall and uses his forepaws as hands - that is the only
liberty. Eyes = small round black dots, no whites, no eyebrows. Badger face keeps
its true black-and-white stripe. The goose stays a bird: neck, wings, beak, no
hands, no shoulders. Neither animal is ever more finished than the object holding
the finish that page.

CANVAS
16:9 double-page spread, full bleed. The image runs to all four edges - no
caption band, no border, no reserved margin anywhere, bottom included. NO
letters, numbers, price tags, signage or symbols of any kind, in any language.

NOT (rendering only)
- no faces, hands or individual variation inside the stamped band; one impression
  repeated
- no stamped or repeated tulips; every flower head is painted by hand
- no airbrush, no smooth gradient, no glossy 3D, no photographic texture filter
- no green sprout, no shoot, no new leaf anywhere in the book
```

---

## §3. 캐릭터 시트

### 시트 1 — Badger Cub

```
CHARACTER SHEET - Badger Cub   (bake this FIRST)

Medium: opaque gouache on warm laid paper, visible brush marks, flat light, no
rendering. He is never the most finished thing on a page.

FACE: young European badger, true markings kept - white head with two black
stripes running from the muzzle back over each eye to the ear. Small round black
dot eyes inside the black stripe, no whites, no eyebrows. Black nose pad, short
blunt muzzle, small rounded ears with a white rim. Mouth = one line; when he
shouts it opens into a wide rounded shape.
FUR: painted in clumps, each clump 3-5 strokes, at most 12 clumps on the whole
animal. No individual hairs anywhere.
BUILD: cub proportions - low heavy body, short thick legs, broad back, small
blunt tail. On the stall he rises onto his hind legs and leans his belly against
the top board; off the stall he moves on all fours. Forepaws are used as hands:
five short digits, pale grey pads, long dark claws kept visible.
CLOTHES: none. Nothing worn, tied or carried at any point in the book.
DISTINGUISHING: the striped white head against everything else on the stall, and
the two dark front claws which are the only sharp shapes on his silhouette.
REFERENCE SHEET: 4 views on bare warm paper, evenly spaced, no ground line -
(1) full body on all fours, side view
(2) up on hind legs, belly to a board, both forepaws pressed down and forward
    (this is his p1 posture, call it posture 1)
(3) up on hind legs, ONE forepaw plunged down to the shoulder, arm straight, head
    tipped sideways so the cheek rests on a rim (this is p8, call it posture 2)
(4) crouched low on all fours, both forepaws spread flat and pulling toward each
    other (this is p12-p13, call it posture 3)
NO letters, numbers or symbols anywhere on the sheet.
```

### 시트 2 — Old Goose

```
CHARACTER SHEET - Old Goose   (bake this FIRST)

Medium: opaque gouache on warm laid paper, visible brush marks, flat light, no
rendering. She is never the most finished thing on a page.

FACE: old domestic goose kept fully a bird. Orange-grey beak, one small round
black dot eye per side, no whites, no eyebrows, no lashes. No expression is drawn
on the face - all of her feeling is carried by the height and curve of the neck.
PLUMAGE: off-white body painted as one mass with at most 9 feather-edge strokes
total, concentrated where a wing folds. No feather pattern, no barbs, no down.
BUILD: tall, heavy-bodied, long neck. Working postures - neck stretched long and
low to carry or push, neck lifted straight to watch, neck lowered in a deep hook
to look down at the ground. Wings are her hands: a wingtip presses paper flat, a
beak grips and rolls. She has no fingers and never grips with a wing edge as
though it were a hand.
CLOTHES: none. No apron, no cap, no shawl, no ribbon.
DISTINGUISHING: against the badger she is the TALL PALE VERTICAL - a long neck
above the stall line, where he is a low striped mass at board height. The two
silhouettes must never be confusable at a glance.
REFERENCE SHEET: 4 views on bare warm paper, evenly spaced, no ground line -
(1) standing, neck upright, side view
(2) neck stretched far out and level, beak gripping the neck of a paper-wrapped
    bundle (this is p2 and p9, call it posture 1)
(3) neck bent low over a flat surface, beak pressing down, both wingtips holding
    the surface either side (this is p5, call it posture 2)
(4) neck hooked down steeply, head low, looking straight down at the ground
    (this is p13, call it posture 3)
NO letters, numbers or symbols anywhere on the sheet.
```

---

## §4. 쪽별 컷

### p1

```
--- p1 — 오늘도 꽉 찼어요 ---
FINISH: the red tulip heads. Petal ridges 6-9 strokes per head, each head with
its own edge; they are the most worked thing on the spread. Badger, goose, stall
and band stay raw medium, at most 2 strokes per object.
WATER: 0 visible - all five buckets are packed so tight that no water shows.
CROWD: 6 stamped figures across the back band, one impression repeated, spacing
uneven, no faces, no hands. This is the ONE page allowed full density.
CAMERA: medium, child eye level, frontal, lens height matched to the stall top.
SUBJECT: Badger Cub up on his hind legs with his belly against the board, both
forepaws laid on the tulip bundle in the CENTRE bucket and pressing it down
(posture 1). Shoulders up, back rounded, eyes on the top of the bundle, mouth
open speaking. No clothes, natural badger proportion, forepaws used as hands. At
right the Old Goose stands behind the bucket row, neck upright, watching.
SETTING: one stall bay, five zinc buckets in a row on a wet timber top. Under the
stall a shallow wooden earth box: on the black soil the top of one brown bulb
shows just above the surface at the lower corner of the spread - neither animal
looks at it. Painted by hand, never stamped.
TONE: low early light. The single densest colour on the spread is the red tulip
mass. NO letters, numbers, price tags or signage anywhere.
```

### p2

```
--- p2 — 한 다발 나갔어 ---
FINISH: the red tulip heads, including the ones showing above the paper wrap -
6-9 ridge strokes each. Paper, timber, goose and badger stay raw, at most 2
strokes each.
WATER: still 0 visible; only the left-end bucket has gone slightly loose.
CROWD: 6 stamped figures, same single impression, respaced.
CAMERA: medium, child eye level from the side of the stall - the bucket row runs
along the left, and the RIGHT EDGE OF THE FRAME IS OPEN. The buyer is off-frame
and is never drawn.
SUBJECT: Old Goose at right, neck stretched far out and level, beak gripping the
neck of a paper-wrapped bundle and pushing it past the right edge of the spread
(posture 1); one wingtip flat on the board, eye toward the frame edge. At lower
left the Badger Cub grips the board corner with both forepaws, up on his toes,
watching it go. No clothes on either, natural animal proportion, forepaws used as
hands, the goose keeps wings not hands.
SETTING: five zinc buckets, the leftmost noticeably thinner of flowers. A few
water marks on the wet timber. Bare paper carries the rest.
TONE: morning light striking white off the wrapping paper. NO letters, numbers,
price tags or signage anywhere.
```

### p3

```
--- p3 — 여기까지 물이에요 (1) ---
FINISH: the red tulip heads standing round the rim - 6-9 ridge strokes each -
plus the badger's forepaw and the water it is in. Everything else is bare paper.
WATER: 🔴 THE GAUGE, FIRST READING. In the CENTRE bucket the stems have opened
just enough for ONE round patch of water, exactly the width of one forepaw. It is
a flat zinc-grey disc, no reflection, no ripple pattern, no sky in it.
CROWD: 0 - the band is out of frame.
CAMERA: close-up, high angle looking down into the mouth of the centre bucket at
a slant. LOCK THIS FRAME - p6 and p8 repeat it exactly.
SUBJECT: Badger Cub pushing one forepaw down through the gap between stems until
the pad is under the water, his other forepaw hooked over the bucket rim, body
tilted sideways, head thrown up, mouth wide open shouting, one cheek squashed
against the rim. No clothes, natural badger proportion, forepaws used as hands.
SETTING: the bucket mouth, vertical ribs on its outer wall, one torn leaf floating
on the water. Outside the bucket the page is left as bare warm paper.
TONE: one ring of morning light on the water. Only the paw and the water disc are
finished besides the flowers. NO letters, numbers, price tags or signage anywhere.
```

### p4

```
--- p4 — 이러면 또 꽉 차요 ---
FINISH: the lifted handful of tulips only - 6-9 ridge strokes per head, the
deepest red on the spread. The buckets still standing keep 0-2 strokes and stay
raw medium; the badger's body is not finished.
WATER: not measured this page - only 3-4 drops falling from the lifted stem ends,
painted as separate marks.
CROWD: 5 stamped figures, one impression, respaced.
CAMERA: medium, child eye level, frontal, two buckets in one frame at the same
depth so their fullness compares directly.
SUBJECT: Badger Cub with both forepaws wrapped round a handful of tulip stems,
lifted to chest height and HELD STILL - hind legs on tiptoe, belly squashed
against the board, face turned up to the raised stems, mouth open. No clothes,
natural badger proportion, forepaws used as hands. At rear right the Old Goose
turns only her head to look, neck otherwise still.
SETTING: the left bucket visibly short of flower heads beside the one he is
working; one spreading wet mark on the timber. Bare paper elsewhere.
TONE: even mid-morning light, flat. Only the lifted bundle takes the strong red;
the remaining buckets are held back. NO letters, numbers, price tags or signage
anywhere.
```

### p5

```
--- p5 — 또 나갔어 ---
FINISH: the red tulip heads inside the half-rolled paper - 6-9 ridge strokes
each. The paper, the goose and the timber stay raw, at most 2 strokes each.
WATER: out of frame.
CROWD: 0 - the band is out of frame.
CAMERA: medium close-up, high angle looking along the stall top at a slant.
SUBJECT: Old Goose above centre, working on a sheet of paper spread flat on the
boards, rolling a tulip bundle along it with her beak pressed down on it; neck
bent low, both wingtips holding the paper either side, eye following the edge of
the sheet (posture 2). She has wings, not hands, and no clothes. The Badger Cub
appears only as a strip of striped back clipping the lower corner of the spread.
SETTING: a half-rolled paper sheet with red heads showing out of one end; two wet
leaves lying flat and stuck to the boards; one cut stem end. Nothing else.
TONE: bright midday. The white of the paper and the green of the two leaves lie
side by side - both stay flat, so the red inside the roll keeps the finish. NO
letters, numbers, price tags or signage anywhere.
```

### p6

```
--- p6 — 여기까지 물이에요 (2) ---
FINISH: the few red tulip heads left standing against the bucket wall - 6-9 ridge
strokes each - plus the badger's two forepaws on the water.
WATER: 🔴 THE GAUGE, SECOND READING. In the SAME centre bucket the water patch
has opened wide enough for BOTH forepaws laid side by side; the stems have been
pushed out to the bucket wall and stand only round the edge. Flat zinc-grey, no
reflection, no ripple pattern.
CROWD: 4 stamped figures, one impression, respaced.
CAMERA: close-up, high angle down into the mouth of the centre bucket - THE SAME
FRAME AS p3, repeated for the refrain. Do not shift the camera.
SUBJECT: Badger Cub with both forepaws laid flat and side by side on the water,
elbows out, shoulders pushed forward so his chest hangs over the bucket, head up,
mouth open shouting, eyes wide. No clothes, natural badger proportion, forepaws
used as hands.
SETTING: behind him on the stall top, two empty buckets lying on their sides with
their mouths toward the viewer, and under each a round wet mark on the boards.
Bare paper elsewhere.
TONE: straight overhead midday light; the water patch is the brightest area of
the spread. NO letters, numbers, price tags or signage anywhere.
```

### p7

```
--- p7 — 그건 두세요 ---
FINISH: the red tulip heads still in the buckets on the stall top - 6-9 ridge
strokes each. The suspended empty bucket, the goose and the badger stay raw, at
most 2 strokes each.
WATER: no reading this page - the bucket in play is empty and being taken down.
CROWD: 3 stamped figures, one impression, respaced.
CAMERA: medium, child eye level from the side, framed so the stall TOP and the
space UNDERNEATH are both in the picture at once.
SUBJECT: Old Goose centre, neck hooked through the handle of an empty bucket and
lowering it, so the bucket hangs in the air between the boards and the ground and
her neck is stretched long and down. At left the Badger Cub on his hind legs
holds the far side of the same handle with both forepaws and pulls it back toward
himself, heels lifted, mouth wide open. No clothes on either, natural animal
proportion, forepaws used as hands, the goose keeps wings not hands.
SETTING: under the stall, in the shade, the wooden earth box - the top of the
brown bulb still showing just above the black soil, unchanged since p1 and still
unlooked-at. Soil stays raw, 0-2 strokes.
TONE: the afternoon has tipped; light lies on the stall top only and the space
below is in shade, with one bright line along the hanging bucket rim. NO letters,
numbers, price tags or signage anywhere.
```

### p8

```
--- p8 — 여기까지 물이에요 (3) ---
FINISH: the last three red tulip heads - still 6-9 ridge strokes each, still the
most worked thing on the spread - plus the badger's submerged arm.
WATER: 🔴 THE GAUGE, THIRD AND LAST READING. In the SAME centre bucket the water
now fills almost the whole vessel and the paw has gone down to the BOTTOM: the
arm is in to the shoulder and the elbow has disappeared below the rim. Flat
zinc-grey, no reflection.
CROWD: 0 - the band is out of frame.
CAMERA: close-up, high angle down into the mouth of the centre bucket - THE SAME
FRAME AS p3 AND p6, third repeat. Do not shift the camera.
SUBJECT: Badger Cub with one forepaw plunged straight down to the bottom, arm
extended, elbow lost below the rim, head laid sideways so his cheek rests on the
bucket edge, mouth only slightly open, eyelids half lowered (posture 2). No
clothes, natural badger proportion, forepaws used as hands.
SETTING: three tulip stems left leaning against the inner wall; one leaf sunk on
the bottom; everything else inside the bucket is water. Bare paper outside it.
TONE: low late light entering from the side reaches the inner wall of the bucket.
Water takes most of the spread. NO letters, numbers, price tags or signage
anywhere.
```

### p9

```
--- p9 — 이제 하나도 없어요 ---
FINISH: the red tulip heads inside the wrapped bundle at the right frame edge -
the LAST time red holds the finish, 6-9 ridge strokes, and it is leaving the
picture. The empty stall top, the badger and the goose stay raw.
WATER: none - the stall top is bare. Five round wet marks are all that is left of
the buckets.
CROWD: 3 stamped figures, one impression, spaced wider than p1 so the band reads
thinner.
CAMERA: wide medium, child eye level, frontal - THE SAME VIEWPOINT AS p1. Match
the p1 stall coordinates so the empty top is read against the full one.
SUBJECT: Badger Cub centre with both forepaws laid flat and spread on the empty
boards, caught halfway to resting his chin on them, shoulders sunk, tail hanging,
eyes following the length of the board. At right the Old Goose stretches her neck
out and pushes the last wrapped bundle past the frame edge, so only the paper end
is still in the picture (posture 1). No clothes on either, natural animal
proportion, forepaws used as hands, wings not hands.
SETTING: the stall top completely bare - no buckets, no flowers, five round wet
marks, two wet leaves still stuck to the timber.
TONE: red low late light. The only red left on the spread is at the very edge of
the frame. NO letters, numbers, price tags or signage anywhere.
```

### p10

```
--- p10 — 이건 안 팔았어 ---
FINISH: 🔴 THE HANDOVER. The BROWN BULB now holds the finish, alone - dry papery
skin worked with 12-16 strokes, its own edge, the only finished object in the
frame. Red drops out of the picture entirely; the badger, the goose and the
boards stay raw at 0-2 strokes each.
WATER: out of frame.
CROWD: 2 stamped figures, one impression, far apart.
CAMERA: medium close-up at stall-top height, child eye level.
SUBJECT: Old Goose at right has just set the bulb down on the boards - the bulb
is touching the wood and her beak is still above it, neck bent low. At left the
Badger Cub rests his chin flat on the boards with only his eyes lifted, looking
at the bulb from a nose's length away, both forepaws folded neatly in front of
him, nose tip almost against it. No clothes on either, natural animal proportion,
forepaws used as hands, wings not hands.
SETTING: the brown bulb on the bare boards - round like an onion, skin dry as
paper, and 0 green on it anywhere. A few grains of dry soil fallen beside it. At
the lower corner of the spread, under the stall, the earth box with a shallow
EMPTY HOLLOW where the bulb was; the hollow stays raw.
TONE: low side light rakes across the bulb skin so the papery layers read. NO
letters, numbers, price tags or signage anywhere.
```

### p11

```
--- p11 — 이건 물에 안 세울래요 ---
FINISH: the brown bulb held in his forepaws - 12-16 strokes, still the only
finished thing. The bucket of water behind him is deliberately raw, 0-2 strokes.
WATER: one bucket with water in it stands on the boards BEHIND HIM - the thing he
is turning his back on. It is flat zinc-grey with no reflection and no highlight.
CROWD: 0 - the band is out of frame.
CAMERA: medium, child eye level from the side, framed so the stall TOP is upper
and the earth box UNDER the stall is lower, both in one picture.
SUBJECT: Badger Cub centre, holding the bulb against his chest with both
forepaws, body turned downward so his back is to the stall top - the bucket
visible over his shoulder - while his nose and eyes point straight down at the
earth box. One hind foot has already stepped down toward the space beneath.
Mouth half closed, speaking. No clothes, natural badger proportion, forepaws used
as hands. Above, the Old Goose enters the frame as neck only, her eye following
him.
SETTING: the black soil and the shallow hollow below; the underside grain of the
stall boards; nothing else. Green anywhere on this spread: at most one thumb's
worth, and none near the soil.
TONE: long low light just before evening - the water above kept cold and flat,
the soil below kept warm. NO letters, numbers, price tags or signage anywhere.
```

### p12

```
--- p12 — 덮어 줄게 ---
FINISH: 🔴 THE SECOND HANDOVER. The DARK SOIL now holds the finish - clod marks,
20+ dry-brush strokes, the lowest-chroma colour in the book carrying the most
work on the spread. The visible top of the bulb is the second most finished thing
and nothing else on the page is finished at all; the badger's body stays raw.
WATER: none in frame.
CROWD: 0.
CAMERA: close-up, high angle down into the earth box at a slant, soil filling
most of the spread.
SUBJECT: Badger Cub crouched at the box, both forepaws spread either side of the
hollow and dragging soil inward toward the middle (posture 3), so two furrows are
pushed up between his paws. Face lowered deep toward the soil, soil dust on his
nose tip, back rounded, tail low and straight behind. No clothes, natural badger
proportion, forepaws used as hands.
SETTING: the bulb lying in the hollow with soil already up to its side and only
the crown still showing; the two pushed furrows; one edge of the wooden box.
Everything else is left as bare paper.
TONE: evening light reaching low into the box. 🔴 THE SOIL IS THE DARKEST THING
ON THE SPREAD AND THE CROWN OF THE BULB IS THE LIGHTEST. 🔴 0 GREEN anywhere on
this spread - no sprout, no shoot, no leaf. NO letters, numbers, price tags or
signage anywhere.
```

### p13

```
--- p13 — 앞발 자국 둘 ---
FINISH: the pressed soil and the two paw prints in it - 24+ strokes along the
print edges, the most worked and most looked-at place in the entire book. The
badger, the goose, the box and the bucket base all stay raw at 0-2 strokes. The
finish that began on the tulips ends here.
WATER: only the base of one empty bucket, clipped at the top edge of the spread.
CROWD: 0 - the market has gone quiet.
CAMERA: close-up, the SAME high angle as p12, pulled back a little.
SUBJECT: Badger Cub with both forepaws laid flat and side by side on the soil,
his weight down through straight arms so his shoulders rise beside his ears, eyes
on the ground between his own paws, mouth closed (posture 3). At upper right the
Old Goose lowers her neck in a deep hook to look down at the same place (posture
3). Neither body is moving. No clothes on either, natural animal proportion,
forepaws used as hands, wings not hands.
SETTING: the soil levelled flat - the bulb is not visible at all - with two paw
prints pressed side by side, in the exact place where the crown showed on p1. The
wooden box edge. Nothing else.
TONE: low warm evening light, throwing shadow only along the rims of the two
prints. 🔴 0 GREEN anywhere on this spread. NO letters, numbers, price tags or
signage anywhere.
```
