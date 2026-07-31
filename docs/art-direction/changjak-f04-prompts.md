# 창작동화 1000 — F-04 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/f04.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## F-04 §1. 앵커 배정

**권**: f04 「이사 가는 상자 속」 · 교환·연쇄 · 프라하 구시가 꼭대기 층 빈 방 · 14쪽 · 4~6세
**클러스터**: C9 · **슬러그**: `changjak-onehole` (신규 민팅)
**한 줄**: 이 화면에서 **오려낸 것은 딱 하나, 상자 속 그 자리**다. 구멍 하나만 뒤 장이 비쳐 어둡고 나머지는 다 그린다. p14 에 분홍 한 장이 그 위를 덮어 구멍이 사라진다.

**형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | f04 의 값 |
|---|---|---|
| C9 c08 `stormpaste` | **오려낸 것이 몇 개인가 · 방향이 어느 쪽인가** | c08 = 넷을 **붙인다**(더하기) · **f04 = 정확히 하나를 뚫는다**(빼기) |
| C9 d10 `hullcut` | 같은 축 | d10 = 화면 전체가 오린 종이 · **f04 = 오린 자리가 1** |
| C9 e04 `twosided` (같은 배치의 C9 신규) | **뒤집기인가 구멍인가** | e04 = 한 조각의 앞뒤 두 상태 · **f04 = 지지면에 뚫린 자리 하나** |
| C1 b01 `cardboard` (둘 다 이사·상자·크라프트) | **크라프트 갈색이 화면의 몇 %인가** | b01 = 거의 전부 · **f04 = 상자 하나뿐, 지배면은 크림 회벽** |
| C5 b05 (둘 다 아파트 빈 방) | **밀도** | b05 = 벽이 문양으로 꽉 참 · **f04 = 방이 텅 빔** · 분홍도 개수로 갈린다(문양 전체 ↔ 딱 하나) |

**대본 SCENE 처방표**

| 대본 문구 | 컷에서 옮기는 법 |
|---|---|
| p10 「뒤로 흐릿하게 상자 옆면」 | 흐림 없음 — **뒤에 마감을 안 준다**(평면 한 색) |
| p2 「신문지는 잉크가 번진 회색 결로만」 | 회색 세로 결 **4~6줄**, 글자·활자 형태 0 |
| p1 「소리가 울릴 것 같은 공기」 | 방에 물건 **딱 셋** + 벽 자국 둘 + 마루 자국 하나, 그 외 0 |

**밀도**: 사건이 주먹만 한 구멍 하나라 열네 쪽 전부 `FINISHED THINGS PER PAGE = 2` · `DENSITY RATION = none`.
**글자 금지**: 🔴 이사 상자는 글씨가 가장 새기 쉬운 물건이다. **상자가 나오는 쪽마다** 못박고, 구별은 테이프와 노끈으로만 한다.

---

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-onehole

Style: picture book for ages 4-6. A top-floor Prague flat, emptied for a move.
Painted matte gouache on cream limewash paper - and the support is physically
DIE-CUT in exactly one place: a fist-sized hole through the page, showing the
darker sheet behind it.

RENDERING (finish hierarchy): everything in this book is painted flat and
hard-edged except ONE thing per spread - the hole. CUT-OUT COUNT PER SPREAD = 1.
It is a fist-sized rounded rectangle in the box's right-front corner and it sits
at the SAME point on every spread that shows the box interior: 62% across the
frame, 58% down. Its edge is a clean knife cut, 0 tearing, 0 drawn outline,
0 painted shadow, and through it the next sheet reads as a flat dark warm brown
#4A3A2A. Nothing else in the book is cut, torn or collaged. Walls = 0 cracks,
0 plaster marks. Floor = parquet as 12-16 flat chevrons total, 0 wood grain,
plus exactly 1 long drag scuff. Newspaper = 4-6 grey vertical grain lines per
bundle, 0 type, 0 letterforms. FINISHED THINGS PER PAGE = 2 (the badger cub +
the one thing his hands are on this page). Everything else is one flat colour at
0 detail. DENSITY RATION = none - the room stays empty on all 14 spreads.

PALETTE: cream limewash #E6DFCE (the dominant surface, 55%+ of every frame) /
kraft box brown #A8834E (ONE object, the box - never the ground) / packed goods
#C0A278 / faded pink #D9A0A8. Pink belongs to exactly one object in the whole
book, the old cloth rabbit; 0 other pink anywhere, including the roof tiles
outside, which are muted brick #9B6A52. Two darker accents only: blue dungarees
#4C6478 and dark grey shirt #7C7770.

CHARACTER DESIGN LANGUAGE: both badgers are bipedal, forepaws used as hands,
simple clothing - cub in blue dungarees with one large chest pocket, father in a
grey shirt with sleeves rolled to the elbow. Faces stay true badger: two white
stripes running nose to ear, black eye patches. 0 human hair, 0 shoes, 0
accessories. This grade holds on all 14 spreads.

CANVAS: 16:9 double-page spread, horizontal. Keep the bottom 12% quiet for a
caption. NO letters, numbers, labels, shop signs or lettering of any kind - the
moving box is identified by tape and cord only, the newspaper carries 0 type,
and the rooftops outside carry 0 signage.

NOT (rendering only): no second cut-out anywhere; no airbrush, gradients, gloss
or 3D shading; no drawn wood grain or plaster texture; no printed letterforms.
```

---

## §3. 캐릭터 시트

### 시트 1 — Badger cub

```
CHARACTER SHEET - Badger cub   (bake this FIRST)
Flat matte gouache, hard edges, 0 shading - see anchor changjak-onehole.

A small badger, bipedal, forepaws used as hands. Head = wedge, two white stripes
#F2EDE2 running from the nose over each eye to the ear, black eye patches
#2A2724 between them, small round black nose. Body = one flat grey-brown mass
#8A857C. Wears blue dungarees #4C6478 with ONE large chest pocket on the front -
that pocket must read as a deep bag, because it is emptied on p10. Barefoot,
0 shoes. Tail = one short flat shape. 0 fur strokes, 0 whisker lines,
0 accessories.
Silhouette test: the smaller of the two badgers, and the only one with a round
bulging belly-pocket.
REFERENCE SHEET: (a) standing, front, both palms pressed flat on the bulging
pocket (b) belly hooked over a box rim, upper body tipped inside, hind feet
lifted onto the toes, tail straight out behind (c) both arms curled to the chest
holding an armful, fingers spread and full (d) face close-up, mouth wide open
shouting, front teeth showing, eyes round.
Flat cream #E6DFCE background. No text.
```

### 시트 2 — Badger father

```
CHARACTER SHEET - Badger father
Flat matte gouache, hard edges, 0 shading - see anchor changjak-onehole.

An adult badger, bipedal, forepaws used as hands. HEAD IS 1/6 OF TOTAL HEIGHT -
he must read as a grown-up beside the cub, never as a bigger child. Same face
markings as the cub (two white stripes nose to ear, black eye patches). Body =
one flat grey-brown mass, broader and squarer than the cub's. Wears a dark grey
shirt #7C7770 with the sleeves rolled to the elbow so the forearms are bare.
0 apron, 0 shoes, 0 accessories, 0 fur strokes.
Silhouette test: taller, squarer, with two bare forearms and no pocket.
REFERENCE SHEET: (a) standing, front, one hand on the hip (b) kneeling on one
knee beside a box, both hands pushed down inside it, elbows below the rim,
shoulders rounded, eyes on his own hands (c) crouched, both palms pressing a lid
flat, shoulders bunched, neck shortened (d) head close-up with ONE eyebrow
raised and the face calm - no anger, ever.
Flat cream background. No text.
```

### 시트 3 — Cloth rabbit (prop sheet)

```
PROP SHEET - Cloth rabbit   (bake with the character sheets)
Flat matte gouache, hard edges, 0 shading - see anchor changjak-onehole.

An old cloth rabbit, faded pink #D9A0A8 - the ONLY pink object in the book. The
stuffing is gone, so the body is flat, limp and floppy: the belly caves in, the
limbs hang, the whole thing drapes over whatever it lies on. Fabric is worn
smooth and slightly shiny in flat patches, 0 fur, 0 pile, 0 stitching except
ONE mended seam across the base of the left ear, drawn as 4 short cream marks
and nowhere else. Eyes = 2 small dark dots. 0 clothing, 0 ribbon, 0 lettering.
Silhouette test: the only object in the book with no straight edges - every
other thing (box, top, pinecone, marbles) is hard or geometric.
REFERENCE SHEET: (a) hanging by the mended ear from a hand, body stretched long,
limbs swinging (b) folded once and pressed down flat into a square, ears tucked
under (c) spread wide open, all four limbs out, flattened to blanket thinness
(d) close-up of the mended ear, 4 cream marks.
Flat kraft brown #A8834E background. No text.
```

---

## §4. 쪽별 컷

### p1

```
--- p1 — 마지막 상자 하나 ---
HOLE: not visible - the box interior is out of frame at this angle.
ARMS: 0; everything is still in the chest pocket, which bulges like a ball.
PINK: one faded pink ear out of the pocket mouth, the only pink on the page.

CAMERA: wide, eye level just above the floor, across the empty room from the
side; the box at frame centre.
SUBJECT: centre - the father kneeling on one knee, both hands pushed down inside
the box crumpling newspaper into the gaps (sheet posture b). Right - the cub
standing, both palms pressed flat on the bulging pocket, belly forward, one hind
foot up on its toes, watching sideways.
SETTING: an emptied Prague top-floor room. Cream walls with exactly 2 darker
rectangles low down where a cupboard stood; parquet, 12-16 flat chevrons, 1 drag
scuff. Deep window sill LEFT, low narrow door open RIGHT with one section of
spiral stair rail beyond - this layout holds for all 14 spreads. Outside,
red-brown rooftops as flat bands and 2 dark spires.
PROPS: exactly 3 objects - the kraft box (lid flaps folded wide open, paper tape
and cord on the body), a roll of tape and scissors on the sill.
FINISH: FINISHED THINGS = 2 (cub, father). Walls and floor flat, 0 detail.
TONE: daylight from the left as one flat lighter band across the floor.
NO letters, numbers or labels anywhere - nothing is written on the box.
```

### p2

```
--- p2 — 자리 하나 ---
HOLE: FIRST APPEARANCE. One fist-sized die-cut through the page at the box's
right-front corner, 62% across / 58% down. Clean knife edge, the sheet behind
reads flat dark brown. It stays at this exact point for the rest of the book.
ARMS: 0. PINK: 0 in frame this page.

CAMERA: medium, high angle over the cub's shoulder, looking down into the box
with him.
SUBJECT: lower foreground - the cub with his belly hooked over the box rim,
upper body tipped inside, both hands gripping the rim, hind feet on their toes,
tail straight out, eyes round and mouth open (sheet posture b). Right rear - the
father standing, one hand on a lid flap; only the lower half of his face is in
frame.
SETTING: the box interior fills the frame - plate bundles wrapped in newspaper,
one pot lying on its side, a folded stack of towels, packed level to the lid, no
gaps anywhere except the one hole.
PROPS: newspaper = 4-6 grey vertical grain lines per bundle, 0 type.
FINISH: FINISHED THINGS = 2 (cub, the hole). Light falls evenly on the packed
surface; the hole is the only place with depth on the page.
TONE: daylight from above, flat.
NO letters, numbers or labels anywhere - nothing is written on the box, the
newspaper carries no type.
```

### p3

```
--- p3 — 팽이가 딱 맞는다 ---
HOLE: same point, 62% / 58%. Now filled by the wooden top - its round belly
almost touching all four walls of the cut, the handle sinking just below the
level of the packed surface.
ARMS: 0. PINK: one faded ear clipping the frame edge from the pocket.

CAMERA: close-up, high angle, straight down on the corner of the box and the two
hands coming into it.
SUBJECT: from the top of the frame - only the cub's two hands and the lower half
of his face. One hand cups the belly of the wooden top and lowers it point-first
into the hole; the other braces on the box rim, fingers pressed white against
the paper. Mouth wide open shouting, eyes on the tip of the top.
SETTING: plate bundles and the pot handle around the corner. Same depth plane
for the top and the hole so their sizes read against each other directly.
FINISH: FINISHED THINGS = 2 (the hands, the top in the hole). The gap between
the top's belly and the cut edge is the smallest measurable distance on the page.
TONE: a brown frame of wood and paper; the top's flank is the one smooth
surface.
NO letters, numbers or labels anywhere - nothing is written on the box.
```

### p4

```
--- p4 — 구슬 세 알 ---
HOLE: same point, 62% / 58%, at the lower right of the frame. Still filled - the
top's handle shows above the packed surface.
ARMS: 3 (three glass marbles landing in cupped palms; one still in the air).
PINK: one faded ear still out of the pocket, which is visibly less bulged now.

CAMERA: medium, eye level. The cub stands at frame left, the box corner at lower
right.
SUBJECT: left - the cub bent forward, both palms cupped together in front of his
belly, knees slightly bent, one hind foot pushed back, eyes following the
marbles down, mouth open in a small round shape.
SETTING: the emptied room behind - cream wall, the 2 darker rectangles, the
window sill at left. 0 new objects.
PROPS: exactly 3 glass marbles, each with a twist of coloured thread through the
middle; the twist turns with the marble as it falls.
FINISH: FINISHED THINGS = 2 (the cub, the 3 marbles). The marbles are the only
things in the book that pass light - they throw 3 small round bright dots on the
floor and nothing else does.
TONE: daylight from the left, flat.
NO letters, numbers or labels anywhere - nothing is written on the box.
```

### p5

```
--- p5 — 맞바꾸는 한 자세 ---
HOLE: same point, 62% / 58%, and it is at the DEAD CENTRE of this frame - there
is one hole and this is it. The top rises out of it, its underside showing, and
below it the first marble is already rolling down to settle on the floor of the
cut.
ARMS: 1 leaving (top), 3 entering (marbles) - shown in one posture.
PINK: one faded ear at the frame edge.

CAMERA: medium close-up, high angle, directly over the box corner.
SUBJECT: centre - the cub's two hands crossing over the same single hole. The
LEFT hand pinches the top's handle and lifts it clear; the RIGHT hand tips
sideways beside it and rolls the 3 marbles down into the hole. Both actions in
ONE posture - the elbows nearly touch, one shoulder is dropped, mouth open
shouting. Rear top - only the father's legs and a roll of tape in his hand.
SETTING: plate bundles and pot around the corner, packed level.
FINISH: FINISHED THINGS = 2 (the crossing hands, the hole). The exchange itself
is the subject - one thing rising, one thing sinking, in the same frame.
TONE: flat daylight; the inside of the hole is the only dark place.
NO letters, numbers or labels anywhere - nothing is written on the box.
```

### p6

```
--- p6 — 솔방울 ---
HOLE: not in frame at this angle - only the lower side of the box clips the top
edge of the picture.
ARMS: 1 (the wooden top, gripped in the left hand, which therefore cannot open).
PINK: the pocket has gone slack and only one faded ear still hangs over its lip.

CAMERA: medium, high angle looking down on the cub's rounded back and his feet.
SUBJECT: centre - the cub bent deep at the waist, back curved into an arc filling
half the frame, tail lifted, both hind feet side by side, picking a pinecone off
his own instep with his right hand. His LEFT arm hangs stiffly at his side with
the fingers locked round the top and unable to open - that one detail carries the
page.
SETTING: bare parquet, 12-16 flat chevrons, the 1 drag scuff. The bottom of the
box at the top frame edge.
PROPS: one pinecone, scales fully open, spikes pointing every way - this
spikiness is what causes p7 and p8.
FINISH: FINISHED THINGS = 2 (the cub, the pinecone).
TONE: flat daylight from the left.
NO letters, numbers or labels anywhere - nothing is written on the box.
```

### p7

```
--- p7 — 삐죽 솟았다 ---
HOLE: same point, 62% / 58%. Filled by the pinecone - but 5-7 open scale tips
break UP through the level of the packed surface. The packed goods make one
straight flat line across the frame and only those tips cross it.
ARMS: 4 leaving (the top and 3 marbles bunched between the left fingers).
PINK: one faded ear at the frame edge.

CAMERA: medium close-up, high angle tilted slightly down from vertical so that
the packed surface line and the tips above it are both readable.
SUBJECT: centre - the two hands crossing over the same one hole again. The LEFT
hand comes up out of it with the top and all 3 marbles caught together between
the fingers, stacked precariously; the RIGHT palm presses the crown of the
pinecone down into the hole, that arm locked straight, shoulder raised, cheeks
puffed, teeth clenched, eyes on the tips.
SETTING: plate bundles and pot around the corner.
FINISH: FINISHED THINGS = 2 (the crossing hands, the pinecone tips). The tips
throw short flat shadows sideways across the packed surface - the only cast
shadows in the book.
TONE: flat daylight.
NO letters, numbers or labels anywhere - nothing is written on the box.
```

### p8

```
--- p8 — 뚜껑이 들썩 ---
HOLE: hidden under the closed lid - and that is the point of the page.
ARMS: 4, wedged in the cub's armpit (the top and 3 marbles) - he has still not
put anything down.
PINK: one faded ear at the pocket lip.

CAMERA: medium wide, eye level, the box at frame centre with a badger on each
side.
SUBJECT: left - the father crouched beside the box, both palms pressing the two
interlocked lid flaps down, shoulders bunched, neck shortened, eyes on the middle
of the lid and no anger on his face (sheet posture c). Right - the cub up on his
toes, both hands laid side by side on the lid, arms locked straight, backside
pushed back, brows up, mouth in a small round shape; the top and 3 marbles jammed
under one arm.
SETTING: the lid's interlocked flaps bulge upward at the centre with a gap two
fingers wide, and the overlapping edge lines are visibly out of true. Right rear,
through the open door, one section of the spiral stair rail.
FINISH: FINISHED THINGS = 2 (the lid gap, the two pressing pairs of hands). Two
bodies pushing down, one lid rising - both directions in one frame.
TONE: flat daylight.
NO letters, numbers or labels anywhere - nothing is written on the box.
```

### p9

```
--- p9 — 다시 텅 빔 ---
HOLE: same point, 62% / 58%. EMPTY for the second time, dark inside, exactly the
same size and shape as on p2 - it must be recognisable as the same cut.
ARMS: 5 (pinecone, top, 3 marbles), all of them in the arms at once.
PINK: one faded ear at the pocket lip.

CAMERA: medium, eye level. The cub at frame centre, the open box at right.
SUBJECT: centre - the cub standing with both arms curled to his chest, holding
all five things at once; the arms are visibly full, one marble squeezing out
between two fingers, his chin tucked down to pin the pinecone. His eyes are on
the empty place in the box, not on his arms. Right - the father standing with one
lid flap in his hand, other hand on his hip, looking down into the box.
SETTING: bare room behind, open door and stair rail at right, window sill left.
FINISH: FINISHED THINGS = 2 (the full arms, the empty hole). The left half of
the frame is crowded and the right half is empty - the page is built on that.
TONE: flat daylight.
NO letters, numbers or labels anywhere - nothing is written on the box.
```

### p10

```
--- p10 — 토끼가 나온다 ---
HOLE: not in frame - the box is only a flat side plane behind.
ARMS: 5, still held, pressed against the flank by the other arm.
PINK: the rabbit fills the middle of the frame. This is the largest area of pink
in the book so far, and still the only pink object.

CAMERA: close-up, eye level, the cub's belly and hands filling the frame.
SUBJECT: centre - the cub's belly and two hands only. One hand grips the bottom
of the dungaree pocket and turns it inside out; the cloth rabbit slides out of
the mouth of it, folded over on itself. The other arm stays clamped to his side
around the five things. Top frame edge - his chin and open mouth.
SETTING: the flat side of the box and bare floor behind, one colour, 0 detail.
PROPS: the rabbit reads as boneless - belly caved in, limbs hanging, body bending
where it clears the pocket lip. Fabric worn smooth, 0 fur, 0 pile; the mended
left ear shows its 4 cream marks. This limpness must be unmistakable here or p11
and p13 do not work.
FINISH: FINISHED THINGS = 2 (the hands, the rabbit). The rabbit is the only
curved thing among hard objects.
TONE: flat daylight.
NO letters, numbers or labels anywhere - nothing is written on the box.
```

### p11

```
--- p11 — 자리 모양대로 ---
HOLE: same point, 62% / 58%. Filled completely and flush - the rabbit is folded
in half and pressed into all four walls of the cut with no gap anywhere, its top
surface exactly level with the packed goods. Direct opposite of p7, and the angle
matches p7 so the two read against each other.
ARMS: 5, all visible at the frame edge.
PINK: one pink rectangle set into the brown - the most legible shape on the page.

CAMERA: close-up, high angle, straight down on the corner of the box.
SUBJECT: from the top of the frame - one of the cub's hands reaches into the hole
and presses the folded rabbit down with an open palm, fingers spread wide across
its back, wrist sunk to the level of the packed surface. The other arm barely
clips the frame edge still holding the five. Face out of frame except the front
teeth and an open mouth at the top.
SETTING: plate bundles and pot around the corner, packed level.
PROPS: one ear folded under the body, one arm squashed sideways flat.
FINISH: FINISHED THINGS = 2 (the pressing hand, the filled hole). A finished hole
and a still-full arm in the same frame.
TONE: flat daylight.
NO letters, numbers or labels anywhere - nothing is written on the box.
```

### p12

```
--- p12 — 여기 말고 ---
HOLE: same point, 62% / 58%. EMPTY for the third time, dark inside, same size and
shape as p2 and p9.
ARMS: 5, in the other arm.
PINK: the rabbit, lifted high, hanging long.

CAMERA: medium, eye level, seen from the side - the empty hole at frame left, the
lifted rabbit at frame right.
SUBJECT: right - the cub has hooked one hand through the rabbit's mended ear and
raised it to his own face height, arm straight up, shoulder lifted. The rabbit
hangs long, keeping the crease from being folded, limbs swinging. HIS EYES ARE
NOT ON THE RABBIT - they are on the flat brown surface at the top of the packed
goods. Mouth small and closed. Left rear - the father stopped mid-motion with a
lid flap in his hand, watching him, ONE eyebrow raised.
SETTING: lower left - the flat brown plateau made by the plate bundles and towel
stack, spread wide and untouched. Open door and stair rail at right.
FINISH: FINISHED THINGS = 2 (the lifted rabbit, the empty hole). This is the one
page in the book where something is surprising; the father's stopped hand says it.
TONE: flat daylight.
NO letters, numbers or labels anywhere - nothing is written on the box.
```

### p13

```
--- p13 — 맨 위에 편다 ---
HOLE: same point, 62% / 58%, STILL EMPTY and still dark - it must stay visible so
the reader sees the place was abandoned on purpose.
ARMS: 0. For the first time in the book the five things are out of his arms.
PINK: the rabbit, now spread wide across the top of the load.

CAMERA: medium, slightly high angle over the top surface of the load and the
hands working on it.
SUBJECT: centre - the cub with his belly hooked over the box rim and his upper
body inside, both palms rubbing the rabbit's back left and right, arms out of
phase, shoulders bobbing, one hind foot off the floor, mouth wide open shouting.
Right rear - the father leaning in with a lid flap in his hand.
SETTING: the rabbit spread flat over the whole top of the load, all four limbs
out, fold creases pushed open, ears splayed left and right, pressed to blanket
thinness. On the floor below, the five things laid out in a row - the first time
they have left his hands.
FINISH: FINISHED THINGS = 2 (the rubbing hands, the spread rabbit). The pink now
occupies the middle of the frame where brown was.
TONE: flat daylight.
NO letters, numbers or labels anywhere - nothing is written on the box.
```

### p14

```
--- p14 — 다 보인다 ---
HOLE: same point, 62% / 58% - and COVERED, one of the rabbit's hind legs lying
across it. No dark place anywhere in this frame. The only spread with 0 visible
cut-out, and that is the ending.
ARMS: 0. PINK: the whole top surface.

CAMERA: wide close-up, high angle, straight down into the box - EXACTLY the same
angle and height as p2, so the two spreads can be laid side by side.
SUBJECT: from the top of the frame - one of the cub's hands only, setting the
pinecone onto the rabbit's belly, fingers not yet released and relaxed open.
Right frame edge - the father's two hands waiting on the two lid flaps.
SETTING: the top of the load is one broad pink floor with all five things on it,
none buried - the top on its side at the left, the 3 marbles gathered in the dip
of the rabbit's belly where they cannot roll away, the pinecone just placed at
the right. The mended ear is folded over beside the top (the ear that stuck out
of the pocket on p1). Everything sits lower than the box rim.
FINISH: FINISHED THINGS = 2 (the hand, the five objects on the pink floor).
TONE: daylight from above makes the pink the brightest area in the book. On p2
one hole was dark; here the top is wide open and all five are in sight - same
box, same angle.
NO letters, numbers or labels anywhere - nothing is written on the box.
```
