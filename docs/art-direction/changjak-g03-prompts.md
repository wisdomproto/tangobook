# 창작동화 1000 — G-03 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/g03.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## G-03 §1. 앵커 배정

**권**: g03 「천둥은 누가 치는 걸까」 · 교환·연쇄 · 알프스 산장 난롯가 · 12쪽 · 4~6세
**클러스터**: C3 · **슬러그**: `changjak-sixlayers` (신규 민팅)
**한 줄**: **불투명 색판**이 한 쪽에 한 장씩 위로 얹히고 아래 판은 **가장자리 한 줄만** 남는다. 화면의 색 개수 = 지금까지 온 손님 수.

**형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | g03 의 값 |
|---|---|---|
| C3 c60 `fogplate` | **판이 몇 색인가 · 겹치면 어두워지나 색이 바뀌나** | c60 = 반투명 담색 **1색**, 겹수가 시야 · **g03 = 여섯 색**, 겹쳐도 안 어두워지고 **색이 바뀐다** |
| C9 g01 `layerdark` | 같은 축 | g01 = 밤빛 판 **1색**, 겹수가 어둠의 값 · **g03 = 한 쪽에 한 색씩 는다** |
| C3 d18 `steamplate` | 같은 축 | d18 = 흰 판 **1색**, 어긋나게 겹침 · **g03 = 여섯 색이 층으로 쌓인다** |
| C8 f08 `tubwater` | **섞이나 쌓이나** | f08 = 섞여 한 가지 흐린 색 · **g03 = 안 섞이고 층** |
| C4 b19 `twofields` (같은 알프스) | **화면의 색이 몇 개인가** | b19 = 정확히 **2**(야외·낮) · **g03 = 한 쪽에 하나씩 늘어 6**(실내·밤) |

🔴 **호리 니들펠트 분리 검수 1순위가 이 권이다.** 담요 여섯 겹에 **보풀·바늘땀·섬유 엣지**가 보이는 순간 호리 라인이 된다. 앵커 `RENDERING` 과 `NOT` 이 개수 상한으로 막는다(`0 fibres` · `0 stitches` · `one sheet thick`).

**대본 SCENE 처방표**

| 대본 문구 | 컷에서 옮기는 법 |
|---|---|
| p6 「반투명하게 밝고」 | 반투명 금지 — 크림 판은 **여섯 중 가장 밝은 불투명 색**으로 올린다 |
| p3 「담요 결이 비쳐 붉게」 | 결 금지 — 붉은 판은 **교차 띠 2줄**(격자)만, 그 외 0 |
| p10 「움직임 선」 | 귀 하나당 **호 2개**, 그 외 0 |

**밀도**: 누적이라 겹이 쌓일수록 밀도가 는다. `DENSITY RATION = p8~p12`(그 다섯 쪽에서 `FINISHED THINGS = 3` = 마멋 + 담요 더미 + 그 쪽 손님). 나머지 일곱 쪽은 `FINISHED THINGS PER PAGE = 2`.

---

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-sixlayers

Style: picture book for ages 4-6. An alpine hut by the fire, one stormy night.
Opaque flat colour plates laid one on top of another, screenprint logic - one new
plate per spread, each a different colour, none of them transparent.

RENDERING (finish hierarchy): every shape is one flat opaque colour with a hard
knife-clean edge, 0 shading, 0 gradient, 0 texture, 0 outline.
LAYER RULE: each blanket is ONE flat plate. A new plate covers the one beneath
completely except for a single strip of its edge, 6-10mm wide at page scale.
NUMBER OF VISIBLE EDGE STRIPS = NUMBER OF GUESTS SO FAR. Overlapping NEVER
darkens and never blends - the top plate is its own colour at full opacity.
🔴 EVERY BLANKET IS ONE SHEET THICK AND SMOOTH: 0 fibres, 0 stitches, 0 seams,
0 visible weave, 0 fringe, 0 pilling, 0 wool nap. The plaid one carries exactly
2 crossing bands and nothing else. Fur = 0 strokes on every animal. Faces = at
most 4 marks (2 eyes, 1 nose, 1 mouth). Stone hearth = at most 6 flat blocks.
The rest of the room is ONE flat dark plate with 0 objects, 0 furniture, 0 beams.
FINISHED THINGS PER PAGE = 2 (the marmot + this page's guest).
DENSITY RATION = p8, p9, p10, p11, p12: on those five FINISHED THINGS = 3, the
extra one being the blanket pile itself, because the reader counts its layers.

PALETTE: fire orange #D97A2B (the only light source, always from below) /
lightning blue #B9CBDD (the window only) / room dark #171A22 (everything with no
plate on it).
The six blanket plates, in stacking order bottom to top, are the count and must
never be substituted or repeated: 1 grey #8E9096, 2 plaid red #A4402F, 3 brown
#7A5636, 4 cream #E5DAC2, 5 navy #2E3E5E, 6 green #4C6B45.

CHARACTER DESIGN LANGUAGE: every animal is a plain natural animal - 0 clothing,
0 shoes, 0 hats, 0 props. Forepaws are used as hands only when pushing or
holding, otherwise natural posture. Cloth appears in this book ONLY as blankets.
The one exception is the old cow's neck bell, a single flat shape.

CANVAS: 16:9 double-page spread, horizontal. NO letters, numbers, signs or lettering of any kind anywhere.

NOT (rendering only): no felt, wool fibre, needle-felting, stitching or fabric
weave of any kind; no airbrush, gradients, gloss or 3D shading; no transparency
where plates overlap; no outlines.
```

---

## §3. 캐릭터 시트

### 시트 1 — Marmot pup

```
CHARACTER SHEET - Marmot pup   (bake this FIRST)
Flat opaque colour plates, hard edges, 0 shading - see anchor changjak-sixlayers.

A young alpine marmot. Body = one flat warm-brown mass #8A6B4A, round and low,
short limbs, blunt muzzle. Ears = 2 small flat half-circles set low and wide -
these ears are the whole point of the book, they must stay readable when nothing
else of the animal shows. Eyes = 2 large flat black dots, the roundest eyes in
the book. Nose = 1 dark dot. Front teeth = 2 small cream squares, shown only when
the mouth opens. 0 fur strokes, 0 whiskers, 0 clothing, 0 collar.
Silhouette test: the smallest body in the book and the only one with 2 low round
ears; from p8 on, those 2 ears alone must identify it.
REFERENCE SHEET: (a) sitting, back rounded, both forepaws pressed over both ears
(b) sitting, blanket edge pulled to the nose with both forepaws, only the eyes
above it (c) the 2 ears alone, sticking out of a flat plane, one flicked left and
one right, with 2 short arcs of motion beside each (d) one hind foot extended,
sole flat, pushing something away.
Flat dark #171A22 background. No text.
```

### 시트 2 — Squirrel

```
CHARACTER SHEET - Squirrel
Flat opaque colour plates, hard edges, 0 shading - see anchor changjak-sixlayers.

A very small red squirrel - the smallest character in the book, no taller than
the marmot's ears are wide. Body = one flat rust shape #A85A32. Tail = one flat
plume as tall as the body, held upright. Ears = 2 pointed tufts, opposite of the
marmot's 2 round ones. Eyes = 2 black dots. 0 fur strokes, 0 clothing, 0 acorn,
0 props. Nothing is ever draped on it until p12.
Silhouette test: pointed ears and a plume above the head line; the marmot is
round and low, the squirrel is narrow and upright.
REFERENCE SHEET: (a) standing, back to the viewer, both forepaws rubbed together
at the chest, tail tip bent (b) head tipped all the way back looking up, mouth
slightly open (c) both forepaws closed on the corner of a flat plate, gripping
(d) wrapped so that only 2 pointed ear tips show above a green plane.
Flat dark background. No text.
```

### 시트 3 — The six guests (line-up)

```
CHARACTER SHEET - Six guests   (one sheet, six figures side by side)
Flat opaque colour plates, hard edges, 0 shading, 0 clothing - see anchor
changjak-sixlayers. Each guest appears on exactly one spread and is identified by
its own blanket colour; keep the six silhouettes clearly different.

1 BADGER - low, broad, wedge head, 2 white stripes nose to ear, black eye
patches. Carries the GREY plate #8E9096, rolled into a cylinder between both
forepaws.
2 FOX - narrow, sharp muzzle, long straight tail, rust #B05B2E. Stands on the
hind legs with both forelegs spread wide. Carries the PLAID RED plate #A4402F,
which shows exactly 2 crossing bands.
3 IBEX (big-horned) - blocky pale-grey body, and 2 long ridged curved horns that
are the tallest thing in the book. Carries the BROWN plate #7A5636 slung over the
back and shoulders.
4 OWL - one flat upright ovoid, 2 blunt ear tufts, round flat face disc, wings
that open into 2 wide flat planes. Carries the CREAM plate #E5DAC2 held open
between both wings.
5 HUT DOG - the bulkiest guest, deep chest, square muzzle, one flat dark shape.
Carries the NAVY plate #2E3E5E over one shoulder.
6 OLD COW - the largest body, long back, low-hung head, ONE flat bell shape at
the neck (the only object any animal owns). Carries the GREEN plate #4C6B45 over
the back.
For each: full body side view, plus the one action pose used in the book (badger
pushing a roll; fox shaking a plate at arm's length; ibex head down with horn tip
touching a post; owl wings spread holding a plate open; dog on hind legs with one
foreleg raised overhead; cow lifting and setting down one foreleg).
0 fur strokes, 0 whiskers, 0 clothing. Flat dark background. No text.
```

---

## §4. 쪽별 컷

### p1

```
--- p1 — 담요 한 겹 없이 ---
LAYERS: 0. No plate anywhere in the frame. This is the only spread with none.
FIRE: orange from the left, low, lighting the marmot from below.
DARK: everything outside the rug is one flat dark plate, 0 objects.

CAMERA: wide, slightly high angle so the small body and the wide floor are both
in frame.
SUBJECT: lower centre - the marmot pup sitting at the edge of a worn rug, back
rounded, both forepaws pressed over both ears, eyes wide and turned toward the
window (sheet posture a). Nothing covers it.
SETTING: an alpine hut's big room at night. Left - a stone hearth, at most 6 flat
blocks, and a flat orange fire shape. Beside the marmot, one hand-span of bare
wooden floor outside the rug - keep this empty patch clearly visible, it must
still be findable on p12. Rear right - a small window carrying flat lightning
blue. The rest of the room is one dark plate.
FINISH: FINISHED THINGS = 2 (marmot, fire).
TONE: orange pooled on one animal, cold blue only at the window; nothing between.
NO letters, numbers or signs anywhere.
```

### p2

```
--- p2 — 회색 ---
LAYERS: 1 - grey #8E9096 arriving. It is rolled into a cylinder in flight and
lands flat across the knees. No other plate exists yet.
FIRE: orange, raking along the side of the rolling plate.
DARK: everything else is one flat dark plate, 0 objects.

CAMERA: medium, eye level, side-on so the direction of the roll reads left-right.
SUBJECT: right - the badger leaning forward, both forepaws pushing the rolled
grey plate away, mouth open, cheerful. Left - the marmot sitting with its legs
drawn together, watching the roll come, the plate just touching its knees.
SETTING: hearth and fire at the left, the rug underneath, dark everywhere else.
0 furniture.
FINISH: FINISHED THINGS = 2 (marmot, badger). The grey plate is one flat colour,
one sheet thick, 0 fibres, 0 stitches, 0 weave, edges knife-clean.
TONE: the fire lights the flank of the roll as a flat lighter band, not a
gradient.
NO letters, numbers or signs anywhere.
```

### p3

```
--- p3 — 붉은 격자 ---
LAYERS: 2 - plaid red #A4402F arriving on top; the grey #8E9096 survives below as
ONE visible edge strip at the marmot's knees. 2 strips would be wrong; there is 1
under this one.
FIRE: orange from below, striking the underside of the shaken plate.
DARK: one flat dark plate behind, 0 objects.

CAMERA: medium close-up, slightly low angle so the shaken plate hangs large
across the top of the frame.
SUBJECT: upper area - the fox up on its hind legs, gripping two corners of the
plaid red plate with forelegs spread wide, one corner of it trailing down. Lower
area - the marmot with the grey plate over its knees, head tipped back, the red
plate's corner just landing on its shoulder.
SETTING: hearth and fire, rug, dark.
FINISH: FINISHED THINGS = 2 (marmot, fox). The plaid is exactly 2 crossing bands
of a darker red on the flat red plate - 0 further bands, 0 weave, 0 fringe,
0 stitching, one sheet thick.
TONE: firelight from below as one flat lighter shape on the plate's underside.
NO letters, numbers or signs anywhere.
```

### p4

```
--- p4 — 코까지 ---
LAYERS: 2, no new one. Grey below, plaid red on top, pulled up together - the
grey shows as ONE edge strip under the red. Count them: 2 colours, 2 guests so far.
FIRE: orange, and the lit pool is visibly smaller than on p1.
DARK: one flat dark plate filling more of the frame than on p1, 0 objects, 0 figures.

CAMERA: wide, high angle from exactly the same position and angle as p1.
SUBJECT: lower centre - the marmot alone. Both forepaws hold the two plates up to
its nose so that only the eyes show above the edge (sheet posture b). The eyes are
turned toward the dark, not the window.
SETTING: hearth and fire at left; the same one hand-span of bare wooden floor
beside the marmot, still uncovered; the window's flat blue rear right; nobody
else in the frame.
FINISH: FINISHED THINGS = 2 (marmot, fire). Both plates one sheet thick, 0 fibres,
0 stitches, 0 weave.
TONE: smaller orange pool, wider dark around it than p1 - the only change.
NO letters, numbers or signs anywhere.
```

### p5

```
--- p5 — 갈색 ---
LAYERS: 3 - brown #7A5636 arriving on top; below it grey and plaid red each show
ONE edge strip. 2 strips visible under the new plate.
FIRE: orange from below; the ibex's horn casts one large flat dark shape upward.
DARK: one flat dark plate behind, 0 objects.

CAMERA: close-up, low angle so the curved horns cross the top of the frame.
SUBJECT: right - the big-horned ibex with its neck bent deep, one horn tip
touching a wooden post beside the hearth, one foreleg stepped forward. The brown
plate slides off its back over the neck and falls toward the marmot. Lower left -
the marmot, only its eyes showing above the 2 plates, looking up at the horns.
SETTING: one wooden post beside the hearth, the fire, the rug, dark.
FINISH: FINISHED THINGS = 2 (marmot, ibex). All three plates one sheet thick,
0 fibres, 0 stitches, 0 weave, knife-clean edges.
TONE: the horn's shadow is one flat dark shape reaching up, not a soft cast.
NO letters, numbers or signs anywhere.
```

### p6

```
--- p6 — 크림 ---
LAYERS: 4 - cream #E5DAC2 arriving on top; grey, plaid red and brown each show
ONE edge strip below it. 3 strips under the new plate.
FIRE: orange from below.
DARK: one flat dark plate behind, 0 objects.

CAMERA: medium, eye level, with the upper third of the frame left generously open.
SUBJECT: upper centre - the owl standing on the stone hearth shelf, both wings
opened into 2 wide flat planes holding the cream plate spread between them, one
lower corner of it dropping. Lower area - the marmot sitting under 3 plates, the
cream corner just settling on its head, eyes squeezed shut into 2 short curves.
SETTING: the stone hearth shelf, at most 6 flat blocks; the fire; the rug; dark.
FINISH: FINISHED THINGS = 2 (marmot, owl). 🔴 The cream plate is OPAQUE - it is
the lightest of the six colours, not a see-through veil. One sheet thick,
0 fibres, 0 stitches, 0 weave.
TONE: the cream plate is the brightest area on the page and the space beneath it
is one flat darker shape.
NO letters, numbers or signs anywhere.
```

### p7

```
--- p7 — 남색 ---
LAYERS: 5 - navy #2E3E5E arriving on top; grey, plaid red, brown and cream each
show ONE edge strip below it. 4 strips under the new plate.
FIRE: orange from below, briefly blocked by the raised foreleg.
DARK: one flat dark plate behind, 0 objects.

CAMERA: medium, low angle so the raised foreleg reaches the top edge of the frame.
SUBJECT: right - the hut dog braced on its hind legs with one foreleg swung high
overhead and coming down, mouth wide open. The navy plate slides off one shoulder
and falls away. Left - the marmot under 4 plates, turning only its head to look.
SETTING: fire, rug, dark. 0 furniture.
FINISH: FINISHED THINGS = 2 (marmot, dog). All five plates one sheet thick,
0 fibres, 0 stitches, 0 weave.
TONE: where the foreleg passes the fire, one large flat dark shape swings across
the wall - a shape, never a blur.
NO letters, numbers or signs anywhere.
```

### p8

```
--- p8 — 여섯 겹 ---
LAYERS: 6 - green #4C6B45 arriving on top, completing the count; grey, plaid red,
brown, cream and navy each show ONE edge strip below it. 5 strips under the new
plate, 6 colours in the frame, 6 guests so far. The reader can count them.
FIRE: orange from below, catching each strip separately.
DARK: one flat dark plate behind, 0 objects.
DENSITY: ration page - FINISHED THINGS = 3 (marmot, cow, the pile).

CAMERA: wide, eye level so the big cow and the pile fit in one frame.
SUBJECT: right - the old cow with one flat bell at its neck, lifting and setting
down one foreleg, head lowered toward the marmot. The green plate slides off its
back onto the pile. Left lower - the marmot is now a stack of plates with only its
nose and 2 eyes showing.
SETTING: fire, rug, dark.
FINISH: the pile is the most finished thing on the page; the cow is a large flat
shape in the dark. Every plate one sheet thick, 0 fibres, 0 stitches, 0 weave,
knife-clean edges, and no two plates the same colour.
TONE: only the pile is lit in bands; the cow stands in the dark.
NO letters, numbers or signs anywhere.
```

### p9

```
--- p9 — 다람쥐 ---
LAYERS: 6, unchanged - all six colours, 5 edge strips under the green.
FIRE: orange from below on the pile side only.
DARK: one flat dark plate behind, 0 objects.
DENSITY: ration page - FINISHED THINGS = 3 (marmot's eyes, squirrel, the pile).

CAMERA: close-up, looking past the squirrel's shoulder at the pile.
SUBJECT: lower foreground - the squirrel from behind, standing, both forepaws
rubbed together at the chest, tail tip bent, nothing covering it at all (sheet
posture a). Centre - the six-layer pile, and near the top of it the marmot's 2
eyes.
SETTING: fire, the pile, the window's flat blue, dark.
FINISH: the squirrel is small, upright and pointed; the pile is broad and banded -
the two silhouettes must not resemble each other.
TONE: the squirrel's side of the frame is dark, the pile's side is warm.
NO letters, numbers or signs anywhere.
```

### p10

```
--- p10 — 귀로 한다 ---
LAYERS: 6, unchanged - green on top, 5 edge strips beneath it, lit into separate
bands from below.
FIRE: orange from below, drawing one flat lighter line along each layer edge.
DARK: one flat dark plate behind, 0 objects.
DENSITY: ration page - FINISHED THINGS = 3 (the 2 ears, squirrel, the pile).

CAMERA: close-up, low angle so the top of the pile sits high in the frame.
SUBJECT: upper centre - only the marmot's 2 ears stick out of the green plate,
one flicked left and one right, with exactly 2 short arcs of motion beside each
ear and nothing else (sheet posture c); below them the eyes are half visible.
Lower area - the squirrel with its head tipped all the way back, looking up at
those ears, mouth slightly open.
SETTING: the pile, the fire, dark.
FINISH: the 2 ears are the only moving thing in the book and this is the page
that says so - nothing else in the frame moves.
TONE: firelight from below turns the layer edges into a stack of flat lines.
NO letters, numbers or signs anywhere.
```

### p11

```
--- p11 — 이건 네 거 ---
LAYERS: 6 in frame, but the top one is leaving - the green plate is being pushed
off the stack; below it 5 plates remain and 4 edge strips show. Do not draw the
squirrel wrapped; it only holds the corner.
FIRE: orange, gathered at the single point where the two feet meet.
DARK: one flat dark plate behind, 0 objects.
DENSITY: ration page - FINISHED THINGS = 3 (hind foot, squirrel's forepaws, the pile).

CAMERA: medium, high angle so the pushing hind foot and the gripping forepaws are
in one frame.
SUBJECT: upper area - one of the marmot's hind feet pushes out from under the
stack, sole flat against the green plate's hem, shoving it downward (sheet posture
d). Lower area - the squirrel with both forepaws closed on the corner of the green
plate, eyes wide, body still uncovered.
SETTING: the green plate's hem, the 5 plates beneath it, the fire, dark.
FINISH: only the meeting point of the two feet is lit; the rest of the frame falls
away. Every plate one sheet thick, 0 fibres, 0 stitches, 0 weave.
TONE: one small warm area in a wide dark frame.
NO letters, numbers or signs anywhere.
```

### p12

```
--- p12 — 무더기가 둘 ---
LAYERS: 5 + 1, in two separate piles. Left - grey, plaid red, brown, cream, navy,
with 4 edge strips showing under the navy. Right - the green plate alone, 1
colour, 0 strips. Six colours still on the page, now in two stacks.
FIRE: orange from the hearth, warm on both piles.
DARK: one flat dark plate behind, 0 objects.
DENSITY: ration page - FINISHED THINGS = 3 (the two piles, the fire).

CAMERA: wide, eye level, pulled back so both piles and the window are in frame.
SUBJECT: centre left - the five-layer pile with only the marmot's 2 round ears
above it. Right of it - a green-wrapped bundle with only 2 pointed ear tips
showing. Both pairs of eyes open, turned toward the fire.
SETTING: 🔴 the two piles now cover the rug AND the hand-span of bare wooden floor
beside it, so no bare floor is visible anywhere - that patch has been in frame
since p1 and this is where it disappears. Hearth and fire at left, the window's
flat lightning blue rear right.
FINISH: the two piles are the most finished things; the room is one dark plate.
TONE: cold flat blue at the window, warm flat orange on the piles, meeting in the
middle of the room with nothing between them.
NO letters, numbers or signs anywhere.
```
