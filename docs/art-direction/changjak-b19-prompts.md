# 창작동화 1000 — B-19 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/b19.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## B-19 §1. 앵커 배정

**권**: b19 「산이 걸어온다」 · 오해와 반전 · 알프스 산마을 끝 울타리 옆 풀밭 · 12쪽 · 4~6세
**클러스터**: C4 · **슬러그**: `changjak-twofields` (신규 민팅)
**한 줄**: 화면의 색이 **정확히 둘**(볕 노란 연두 / 그늘 푸른 회색)이고 안 칠한 종이가 0%다. **그린 선이 한 획도 없고**, 모든 형태는 두 색면이 맞닿은 자리에서 생긴다.

🔴 **형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | 판정 |
|---|---|---|
| **c23** `changjak-shadeline` | **그린 선이 있나** | c23 = 갈대펜 떨림 선이 모든 윤곽에 · **b19 = 0획** |
| **b04** `changjak-b04` | **그림자가 도형인가 필드인가** | b04 = 흰 종이 위 닫힌 도형 하나 · **b19 = 화면 절반을 덮는 필드, 안 칠한 종이 0%** |
| **d04·h02** `changjak-flatplate` | 방향 | 저쪽은 면적이 **자라고**, b19 는 그늘 면적이 **줄어든다**. 공유 앵커로 묶지 않는다(그 슬러그는 이미 축이 하나 걸려 있다) |
| **g03**(같은 알프스) | **화면의 색이 몇 개인가** | g03 = 한 쪽에 하나씩 늘어 여섯 · **b19 = 끝까지 둘** |
| 🔴 **점눈이(전래동화) 라인** | ① 종이색 ② 빨강 | 전래는 밝은 크림 종이가 지배면 · **b19 는 안 칠한 종이 0%** · 그리고 **빨강을 한 점도 안 쓴다** |

🔴 **이 권의 기계장치 = 같은 프레임의 반복.** p1·p2·p5·p7·p12 는 **카메라 값이 완전히 같고**, 달라지는 것은 **경계선 위치와 흰 돌 개수 둘뿐**이다. 값이 한 톨이라도 흔들리면 아이가 비교를 못 하고 이 권은 죽는다. 다섯 컷의 `CAMERA:` 줄은 **한 글자도 다르지 않게** 붙여 넣었다.

**대본 SCENE 처방표** (대본은 안 고치고 컷에서 분기)

| 대본 문구 | 옮기는 법 |
|---|---|
| p4 「어제의 흰 돌 한 개(흐리게)」 | 흐림이 없는 매체다 → **그늘 필드 색으로 칠해** 물러나게 한다(가장자리는 그대로 딱) |
| p10 「산은 아침 볕에 담담하게」 | 능선 = **한 장의 평면 실루엣 · 내부 정보 0** |
| p8 「배경은 바람의 획으로만」 | 획이 없는 매체다 → **풀 실루엣 다섯 포기를 한쪽으로 기울인 평면 도형**으로 |
| p3 「외치는 입 주변만 마감을 올린다」 | 입 = 머리에 뚫린 평면 도형 하나(#2E3A40), 주변에 선·명암 금지 |

## B-19 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-twofields

Style: picture book for 4-6 year olds. An alpine pasture at the edge of a village, seen at the same hour on five mornings. Hard-edge flat colour only. The whole frame is covered by exactly two fields - sunlit yellow-green and mountain-shade blue-grey - and every form exists only where two flat colours meet. Nothing is drawn.

RENDERING (finish hierarchy)
FIELDS = exactly 2, covering 100% of the frame: sun #B9C455 / shade #6E7E8C. Unpainted support = 0%.
Anything standing inside the shade field is painted flat #6E7E8C. Anything inside the sun field keeps its own flat colour. An object crossing the edge is cut by it - one part sun-coloured, one part #6E7E8C, a hard cut, no blend, no halo.
Drawn lines per page = 0. No contour, hatching, texture, shading or gradient. One flat tone per shape, edge to edge.
FINISHED THINGS PER PAGE = 2 - the young marmot, and the one thing it touches that page. DENSITY RATION = none.
Grass blades drawn = 0 (grass is field colour). Fence = 3 flat posts + 2 flat rails, 0 wood grain. Stones = flat ovals, 0 marks on them. Flat rock = 1 flat shape. Ridge = one flat silhouette, 0 detail inside. Sky = the sun field colour, 0 clouds.
Dark marks per page = at most 5, each a flat oval of #2E3A40 (eyes, nostril, open mouth, burrow mouth). There is no black.

PALETTE
#B9C455 sunlit pasture and sky · #6E7E8C mountain shade and everything standing in it · #EDEAE0 white stones and sunlit stone · #7A5236 fence, flat rock, marmot fur in sun · #2E3A40 the only dark note.
No other colour enters this book. Red = 0 anywhere, on any page.

CHARACTER DESIGN LANGUAGE
Quadruped marmots. No clothing, no held objects, no props of any kind; they rear onto the hind legs only where a cut says so. A body is one flat #7A5236 silhouette in which ears, muzzle, haunch and tail read as shape alone. Eye = one flat oval of #2E3A40; nose = one smaller oval. No fur strokes, no whisker lines, no mouth line - an open mouth is a flat #2E3A40 shape cut into the head.

CANVAS
16:9 double-page spread. Keep the lower 12% quiet for a caption. No letters, numbers, signs or symbols anywhere in this book.

NOT (rendering only)
- 0 drawn lines: no ink, pencil, crayon or brush contour on anything
- no shading, gradient, airbrush, texture filter or 3D render - one flat tone per shape
- 0% bare support: no unpainted paper anywhere in the frame
- no needle-felted wool, stitching or fibre edges; no red accent
```

## B-19 §3. 캐릭터 시트

### 시트 1 — MarmotPup

```
CHARACTER SHEET - MarmotPup   (bake this FIRST)

Medium: STYLE ANCHOR changjak-twofields - hard-edge flat colour, 0 drawn lines.

FACE
Round skull, short blunt muzzle, small rounded ears set low and wide apart, cheeks fuller than the muzzle. Eye = one flat oval of #2E3A40, tall rather than round, placed high on the head so the animal reads young. Nose = one smaller #2E3A40 oval at the muzzle tip. Two upper teeth exist only as a flat #EDEAE0 rectangle inside an open mouth, and only where a cut asks for it. No whiskers, no eyebrows, no mouth line when the mouth is closed.

FUR
Flat #7A5236 in the sun field, flat #6E7E8C in the shade field. 0 fur strokes, 0 tufts, 0 texture. The coat reads only through silhouette: a soft notch where the shoulder meets the neck, a stepped haunch, a short tail that widens at the tip.

CLOTHES
None. Nothing worn, nothing carried, no collar, no ribbon.

BUILD & SILHOUETTE
Small and pear-shaped: head about one quarter of the body length, chest narrow, haunches heavy, four short legs, tail short and thick. Standing on four legs the back is a single gentle arch. Reared on the hind legs the belly makes a plump curve and the two forepaws come together in front of the chest. Silhouette test against MarmotOld: MarmotPup is half the length, the head is proportionally larger, the back arches; MarmotOld is long, low and straight.

REFERENCE SHEET
One flat cream field, figures floating on it, no ground, no shadow:
1) full body standing on four legs, side view, facing left
2) same body in 3/4 turn toward camera
3) reared on hind legs, forepaws together at the chest, mouth open (flat #2E3A40 shape)
4) head close-up x3 - calm / eyes wide (eye oval enlarged, not rounder) / mouth open shouting
5) one forepaw alone, flat, toes readable as three notches in the silhouette
```

### 시트 2 — MarmotOld

```
CHARACTER SHEET - MarmotOld   (bake this FIRST)

Medium: STYLE ANCHOR changjak-twofields - hard-edge flat colour, 0 drawn lines.

FACE
Longer, flatter skull than MarmotPup, blunt heavy muzzle, ears smaller and set further back. Eye = one flat #2E3A40 oval, low and narrow (a lazy lid reads as a thinner oval, never as a drawn line). Nose = one #2E3A40 oval, wider than the pup's. A yawn is one large flat #2E3A40 shape occupying the lower half of the head.

FUR
Flat #7A5236 in sun, flat #6E7E8C in shade. 0 strokes. Age reads through silhouette only: a sagging line under the belly, a heavier jowl, a blunter tail.

CLOTHES
None. Nothing worn, nothing carried.

BUILD & SILHOUETTE
Long, low, straight-backed, nearly twice MarmotPup's length and clearly wider through the middle. Legs short enough that the belly almost touches the ground when standing. Lying flat: the body spreads into a single broad flat shape with four legs sticking sideways, and the silhouette has no arch at all.

REFERENCE SHEET
One flat cream field, figures floating on it, no ground, no shadow:
1) full body standing on four legs, side view, facing right
2) lying belly-down, spread flat, four legs sideways, eyes closed (eye = 0 marks, no line)
3) head only, emerging in three stages - nose tip alone / out to the eyes / out to the forepaws - each drawn as the head silhouette cropped by a flat #2E3A40 burrow shape
4) head close-up, wide yawn (one big flat #2E3A40 shape)
```

## B-19 §4. 쪽별 컷

### p1 — 풀밭에 누운 뾰족한 끝

```
--- p1 - 풀밭에 누운 뾰족한 끝 ---
EDGE: the shade field's wedge points LEFT; its apex sits at 33% of frame width. Sun fills everything left of the wedge, shade everything right.
STONES: 0.
OLD: not visible (inside the burrow).
CAMERA: FRAME A - wide, lens level with the ground 12cm up, no tilt, no zoom. Ridge base at 30% of frame height; the stone line at 62% height; fence posts at 20%/45%/70% width; burrow mouth at 82% width; flat rock at 92% width; ridge silhouette fills the right 25%. Identical in p1, p2, p5, p7, p12 - do not move the camera a hair.
SUBJECT: MarmotPup at 80% width, just landed on four legs outside the burrow mouth, body entirely inside the shade field so it is flat #6E7E8C, head turned left toward the wedge apex. One eye oval visible.
SETTING: fence (3 posts, 2 rails), burrow mouth as a flat #2E3A40 shape, flat rock beside it, ridge silhouette right. Nothing else in the frame.
FINISH: MarmotPup full; the wedge apex is the second finished thing - the crispest edge on the page. Everything else flat and quiet.
TONE: the two fields meet cleanly; the eye must land on the point of the wedge.
```

### p2 — 흰 돌 한 개

```
--- p2 - 흰 돌 한 개 ---
EDGE: wedge apex at 46% of frame width. It has moved right; nothing else has moved.
STONES: 1 - at 38% width on the stone line, inside the sun field, flat #EDEAE0.
OLD: not visible.
CAMERA: FRAME A - wide, lens level with the ground 12cm up, no tilt, no zoom. Ridge base at 30% of frame height; the stone line at 62% height; fence posts at 20%/45%/70% width; burrow mouth at 82% width; flat rock at 92% width; ridge silhouette fills the right 25%. Identical in p1, p2, p5, p7, p12 - do not move the camera a hair.
SUBJECT: MarmotPup standing side-on at 42% width, one forepaw laid flat on the stone, head lifted toward the apex, eye oval enlarged. The body straddles the edge: the part left of 46% is #7A5236, the part right of it is #6E7E8C, cut hard.
SETTING: identical fence, burrow, rock, ridge - same positions, same shapes as p1. No new object anywhere.
FINISH: MarmotPup full; the white stone is the second finished thing. Fence and ridge stay flat.
TONE: the single stone is the brightest thing on the page.
```

### p3 — 산이 또 한 걸음 왔어

```
--- p3 - 산이 또 한 걸음 왔어 ---
EDGE: shade fills the lower 70% of the frame; the sun field is a band across the top behind the ridge.
STONES: 1, at the left edge inside a narrow sun strip.
OLD: nose tip only - a single #7A5236 wedge protruding from the flat #2E3A40 burrow shape. Eyes not visible.
CAMERA: medium, low angle from between the grass, lens 4cm above the ground, tilted up 15 degrees.
SUBJECT: MarmotPup at 28% width, reared on the hind legs, body leaning back, two forepaws together at the chest, mouth wide open as one flat #2E3A40 shape. Standing in shade, so the whole body is #6E7E8C except the head, which crosses into the top sun band and is #7A5236.
SETTING: one fence post at 62% width, burrow mouth at 84%, flat rock at 92%, 5 flat grass silhouettes along the bottom edge. Nothing else.
FINISH: MarmotPup full; the open mouth shape is the second finished thing. The old marmot's nose stays a bare wedge.
TONE: the shout reads as the size of the mouth shape, not as motion lines - 0 motion marks.
```

### p4 — 오늘 자리

```
--- p4 - 오늘 자리 ---
EDGE: the edge runs vertically at 50% of frame width, straight down through the stone being placed.
STONES: 2 - the new one at 50% width cut in half by the edge (left half #EDEAE0, right half #6E7E8C); yesterday's stone far left at 12% width, painted entirely in shade colour #6E7E8C so it drops back.
OLD: not visible.
CAMERA: close-up, lens on the ground, tilted up 5 degrees. The two forepaws and the stone fill the lower half of the frame.
SUBJECT: MarmotPup's two forepaws pushing the stone, toes spread (three notches each). MarmotPup's head enters the top of the frame, cropped at the eyes, looking down. Forepaws are #7A5236 where they sit left of 50% and #6E7E8C where they cross right of it.
SETTING: 4 flat grass silhouettes only. No fence, no burrow, no ridge in this frame.
FINISH: the forepaws full; the half-and-half stone is the second finished thing. Everything else is field colour.
TONE: the vertical cut through the stone is the sharpest edge on the page.
```

### p5 — 두 번째 돌을 넘었다

```
--- p5 - 두 번째 돌을 넘었다 ---
EDGE: wedge apex at 60% of frame width.
STONES: 2 - at 38% and 52% width on the stone line, both inside the sun field, flat #EDEAE0.
OLD: out to the eyes - the head silhouette cropped by the burrow shape, two eye ovals visible, forepaws still inside.
CAMERA: FRAME A - wide, lens level with the ground 12cm up, no tilt, no zoom. Ridge base at 30% of frame height; the stone line at 62% height; fence posts at 20%/45%/70% width; burrow mouth at 82% width; flat rock at 92% width; ridge silhouette fills the right 25%. Identical in p1, p2, p5, p7, p12 - do not move the camera a hair.
SUBJECT: MarmotPup at 55% width, forepaws pressed against the second stone, shoulders squared, tail stiff and straight out. Body cut by the edge at 60%: left part #7A5236, right part #6E7E8C.
SETTING: identical fence, burrow, rock, ridge - same positions and shapes as p1 and p2. No new object.
FINISH: MarmotPup full; the second stone is the second finished thing.
TONE: the sun field is visibly wider than in p2 - that widening is the whole point of the page.
```

### p6 — 엉덩방아

```
--- p6 - 엉덩방아 ---
EDGE: shade fills 100% of the frame except a thin sun band along the top 12%.
STONES: 2, both at the far left inside the thin sun band.
OLD: head out to the eyes, mouth open in a wide yawn (one big flat #2E3A40 shape), forepaws still inside the burrow.
CAMERA: medium, straight side view, lens at the pup's shoulder height.
SUBJECT: MarmotPup at 25% width, sat down hard - hind legs shot forward, both forepaws lifted off the ground, mouth open. Entirely inside shade, so the whole body is flat #6E7E8C and reads by silhouette alone. MarmotOld at 78% width in the burrow mouth.
SETTING: burrow mouth, flat rock (still in shade), 4 flat grass silhouettes. The space between the two animals is completely empty field.
FINISH: MarmotPup full; MarmotOld at half - silhouette plus the yawn shape and nothing more.
TONE: the emptiness between them is the composition; put no object in that gap.
```

### p7 — 흰 돌 세 개

```
--- p7 - 흰 돌 세 개 ---
EDGE: wedge apex at 74% of frame width, just past the third fence post.
STONES: 3 - at 38%, 52% and 66% width on the stone line, all inside the sun field, flat #EDEAE0, forming one horizontal row across the frame.
OLD: out to the forepaws - head plus two forepaws clear of the burrow shape.
CAMERA: FRAME A - wide, lens level with the ground 12cm up, no tilt, no zoom. Ridge base at 30% of frame height; the stone line at 62% height; fence posts at 20%/45%/70% width; burrow mouth at 82% width; flat rock at 92% width; ridge silhouette fills the right 25%. Identical in p1, p2, p5, p7, p12 - do not move the camera a hair.
SUBJECT: MarmotPup at 68% width, mid-stride along the row with one forepaw laid on the third stone, head turned right toward the apex. Body entirely in the sun field now: flat #7A5236.
SETTING: identical fence, burrow, rock, ridge - same positions and shapes as p1, p2, p5. No new object.
FINISH: MarmotPup full; the row of three stones is the second finished thing, read as one line.
TONE: sun now covers more than half the frame. The row of stones crosses it like a ruler.
```

### p8 — 여기서 딱 막을 거야

```
--- p8 - 여기서 딱 막을 거야 ---
EDGE: a single near-vertical edge at 45% of frame width, running from top to bottom. Shade left, sun right.
STONES: 1 - the third stone at 78% width, in sun.
OLD: not visible.
CAMERA: low close-up, lens flat on the ground so the edge and the pup's eye sit at the same height.
SUBJECT: MarmotPup at 55% width, braced facing left toward the edge, both forepaws planted flat against it, hind legs spread and pushing, chin tucked. Body in sun so it is #7A5236; only the two forepaws cross the edge and are #6E7E8C.
SETTING: 5 flat grass silhouettes all leaning the same way, to the right. Nothing else - no fence, no burrow, no ridge.
FINISH: MarmotPup full; the point where the two forepaws meet the edge is the second finished thing. The grass stays raw field colour.
TONE: 0 motion marks, 0 speed lines - the wind is only the shared lean of five flat grass shapes.
```

### p9 — 선이 앞발을 넘어갔다

```
--- p9 - 선이 앞발을 넘어갔다 ---
EDGE: a single edge crossing the frame diagonally at a shallow angle, passing between the forepaws and the chest. Everything above and right of it is sun, everything below and left is shade.
STONES: 0.
OLD: not visible.
CAMERA: extreme close-up on the same spot as p8, same eye height, same direction - only the focal length changes. The two forepaws fill the lower third.
SUBJECT: MarmotPup's two forepaws in exactly the p8 position, unmoved, now entirely inside the sun field and flat #7A5236. Belly, hind legs and tail are still inside the shade field and flat #6E7E8C. The head enters the top of the frame cropped, eye ovals enlarged, mouth a small open #2E3A40 shape.
SETTING: the sun's rim at the far right edge - one flat #EDEAE0 shape sitting on the ridge silhouette. Nothing else at all.
FINISH: the forepaws full; the edge itself is the second finished thing. Zero other objects on this page.
TONE: the proposition is "the paws did not move, the line did". Give the page nothing that could move.
```

### p10 — 산은 한 걸음도 안 왔잖아

```
--- p10 - 산은 한 걸음도 안 왔잖아 ---
EDGE: shade remains only as a band along the bottom 30%; sun fills the rest.
STONES: 0.
OLD: not visible.
CAMERA: over-the-shoulder from below and behind the pup's head, tilted up 20 degrees toward the ridge.
SUBJECT: MarmotPup's skull and one cheek fill the lower left, seen from behind, head snapped right so one ear folds back. The forepaws stay planted where p8 and p9 left them. The head is in shade so it is #6E7E8C; the ear tip crosses into sun and is #7A5236.
SETTING: the ridge silhouette across the upper frame - same width, same position and the same profile as in p1 and p12, one flat shape with 0 internal detail. One fence post at the lower right. Nothing else.
FINISH: MarmotPup full; the ridge is deliberately unfinished - a single flat silhouette, so that "it has not moved" reads as sameness of shape.
TONE: the mountain is a flat cut-out. Do not model it, do not light it, do not add snow.
```

### p11 — 볕이다

```
--- p11 - 볕이다 ---
EDGE: shade has been pushed to the right 15% of the frame only.
STONES: 3 at 38%, 52%, 66% width, all in sun.
OLD: whole body, out of the burrow for the first time - lying belly-down on the flat rock, four legs hanging sideways, eyes closed (0 eye marks).
CAMERA: medium, slightly high angle, looking down about 20 degrees.
SUBJECT: MarmotOld at 76% width on the flat rock, one long low flat #7A5236 shape with no arch in it. MarmotPup at 30% width, sitting on its haunches, turned to watch, one eye oval visible.
SETTING: flat rock, burrow mouth, fence, the row of three stones. Nothing new.
FINISH: MarmotPup full; the spread-flat MarmotOld silhouette is the second finished thing. The rock and fence stay flat.
TONE: sun holds most of the frame. The old body's outline is the only complicated shape on the page.
```

### p12 — 그럼 내가 한 걸음 갈게

```
--- p12 - 그럼 내가 한 걸음 갈게 ---
EDGE: wedge apex at 96% of frame width - shade survives only as a thin sliver at the mountain's foot on the far right.
STONES: 3 at 38%, 52%, 66% width, all in sun, flat #EDEAE0.
OLD: whole body, still spread flat on the rock, eyes closed.
CAMERA: FRAME A - wide, lens level with the ground 12cm up, no tilt, no zoom. Ridge base at 30% of frame height; the stone line at 62% height; fence posts at 20%/45%/70% width; burrow mouth at 82% width; flat rock at 92% width; ridge silhouette fills the right 25%. Identical in p1, p2, p5, p7, p12 - do not move the camera a hair.
SUBJECT: MarmotPup at 58% width, one forepaw set down to the right toward the mountain, hind feet still beside the third stone, head lifted. Entirely in sun: flat #7A5236.
SETTING: identical fence, burrow, rock, ridge - same positions, same shapes, same sizes as p1. Everything that was #6E7E8C in p1 is now sun-coloured or #EDEAE0.
FINISH: MarmotPup full; the stepping forepaw is the second finished thing.
TONE: the only difference from p1 is the width of the shade. Do not resize the mountain, do not move the fence, do not shift the stones.
```
