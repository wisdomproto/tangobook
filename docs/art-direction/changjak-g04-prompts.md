# 창작동화 1000 — G-04 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/g04.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## G-04 §1. 앵커 배정

**권**: g04 「처음 가는 길」 · 여정과 귀환 · 프랑스 시골길 굽이 하나 · 14쪽 · 5~7세
**클러스터**: C4 · **슬러그**: `changjak-touchgrain` (신규 민팅)
**한 줄**: 하드에지 평면 색면 · 음영 0 · 맨 종이 0%. 그런데 **그 쪽에서 몸이 닿은 자리 하나에만 결이 있다** — 웅덩이 물결 · 이정표 나뭇결 · 그루터기 나이테 · 벗겨진 파란 칠. **돌아오는 p13·p14 에는 결이 0이다.**

🔴 **형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | 판정 |
|---|---|---|
| **C4 일곱** b04·d04·h02·f02·e120·b19·h01 | **평면에 결이 있나** | 저쪽은 전부 **0**(음영도 결도 없는 순수 평면) · **g04 = 쪽마다 정확히 1**, 그 하나가 이 책의 계기판 |
| **b19** `changjak-twofields` (같은 알프스 인접·같은 무음영) | **① 색이 몇 개인가 ② 결** | b19 = 색 정확히 2 · 결 0 · 그린 선 0획 · **g04 = 색 여섯 · 결 쪽당 1** |
| **d04·h02** `changjak-flatplate` | **면적이 자라나** | 저쪽은 한 쪽에 한 칸씩 면적이 자란다 · **g04 는 면적이 안 변하고, 결이 자리를 옮긴다** |
| 🔴 **d01** `changjak-backpress` (같은 배치·같은 엔진·둘 다 새끼 염소) | **① 결이 몇 군데인가 ② 어디가 비나 ③ 의인화** | d01 = 화면 전체가 눌린 종이 결(셀 수 없다) · **g04 = 0 또는 1** ‖ d01 = 위가 빈다(하늘 2/3 맨 종이) · **g04 = 옆이 빈다. 맨 종이 0%, 하늘은 위쪽 15~20% 띠뿐** ‖ d01 = 사족·입으로 문다 · **g04 = 뒷다리로 서서 앞발 둘로 바구니를 안고 손바닥을 편다** |
| 🔴 **점눈이(전래동화)** | **① 지지면 ② 눈** | 전래 = 크림 종이가 지배면 + 느슨한 색연필 획 + 점눈 · **g04 = 안 칠한 종이 0% 의 하드에지 평면, 획 0, 점눈 금지**(눈은 납작한 타원). 빨강 1점 규칙이 같아지므로 이 두 축으로만 갈린다 |

🔴 **파랑을 축으로 쓰지 마라.** 이 권의 축은 **결**이고, 파랑은 그 결이 얹히는 마지막 자리일 뿐이다.
🔴 **이정표 팔과 파란 문에 글자 금지** — 대본이 두 번 못박았다. 인물이 크게 나오는 쪽마다 반복해 적었다.

**대본 SCENE 처방표** (대본은 안 고치고 컷에서 분기)

| 대본 문구 | 옮기는 법 |
|---|---|
| p5 「뒤쪽 길은 흐리게」 | 흐림이 없는 매체다 → **뒤쪽 길에서 결·표시를 0으로**. 색면은 그대로 또렷 |
| p7 「둘레는 부드럽게 날린다」 | 블러가 아니다 → **둘레의 선 수를 0으로**, 나이테는 그루터기 단면 안에서만 |
| p4 「역광이라 이정표가 살짝 어둡게」 | 음영이 없다 → 이정표를 **한 단 어두운 평면색 #8C8271** 한 장으로. 그러데이션 0 |
| p9 「그림자 쪽은 서늘하고 … 경계선이 한 줄로 또렷하게」 | 그림자 = 명암 아님 → **가장자리가 딱 선 평면 도형 하나**(#A79B85), 안에 표시 0 |
| p13 「걸음이 빨라 보이게」 | 속도선 금지 → **다리 벌린 각도**와 앞뒤로 벌어진 두 앞발로만 |

## G-04 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-touchgrain

Style: picture book for 5-7 year olds. One bend of a dry French country road, one afternoon. Hard-edge flat colour, 0 shading, and 0% bare support - every part of the frame is a painted flat shape. Exactly ONE shape per page carries grain, and it is the thing the kid's body touched on that page. Everything else is smooth flat colour.

RENDERING (finish hierarchy)
GRAIN = 1 shape per page, 0 shapes on pages 13 and 14. Grain lives INSIDE that one flat shape as 8-20 fine lines of a single family: concentric rings on water, straight vertical fibre on the signpost, rings plus one saw kerf on the stump, flaked chips on the door paint. Grain never spills onto the road, the wall, the sky, the animals, and never appears in two shapes on the same page.
Everywhere else: one flat tone per shape, edge to edge. 0 gradient, 0 shading, 0 hatching, 0 contour lines, 0 outlines. Forms exist only where two flat colours meet.
Bare or unpainted support = 0%. Sky is a painted flat #EDEDE8 band across the top 15-20%; the road field fills most of the frame. The kid's coat and the sky share #EDEDE8, so keep the horizon high enough that the kid always stands inside the road field; anything that must stand against the sky is #A79B85.
FINISHED THINGS PER PAGE = 2 - the kid goat, and the one thing it touches. DENSITY RATION = none.
Dry grass = at most 9 flat blade shapes per page. Stone wall = at most 12 flat stones, 0 marks inside them. Pebbles = at most 4. Clouds = 0. Birds in the sky = 0.
Dark marks per page = at most 6 flat ovals of #3A3630 - eyes, nostril, hooves, the gap under the door. There is no black.

PALETTE
#D8C48E dirt road, dry grass, sunlit ground · #EDEDE8 sky, water surface, the kid's coat, the goose · #A79B85 stone wall, stump, fallen trunk, basket, distant roof, cast shadow shapes · #8C8271 the one step darker used for a backlit object standing against sky · #2F6FA8 the blue door and nothing else, pages 10-14 only · #C0342E the red ribbon and nothing else, pages 1, 12 and 14 only · #3A3630 the only dark note.
No other colour enters this book.

CHARACTER DESIGN LANGUAGE
A kid goat that walks on four legs but rears onto the hind legs to hold the willow basket against its chest with both forepaws; a forepaw opens into a flat spread shape that reads as a palm when it is laid on something. No clothing, no shoes, no bag, nothing worn. Eye = one flat #3A3630 oval, taller than round - never a round dot with a highlight, never a folk dot-eye. The goose is a plain flat #EDEDE8 shape with a #D8C48E beak; it carries no red.

CANVAS
16:9 double-page spread. No letters, numbers, signs or symbols anywhere in this book - the signpost arm and the blue door are blank.

NOT (rendering only)
- no shading, gradient, airbrush, texture filter or 3D render - one flat tone per shape
- no grain in more than one shape per page, and no grain at all on pages 13-14
- 0% bare support: no unpainted paper anywhere in the frame
- no loose coloured-pencil stroke, no dot eyes, no red anywhere but the ribbon
```

## G-04 §3. 캐릭터 시트

### 시트 1 — ErrandKid

```
CHARACTER SHEET - ErrandKid   (bake this FIRST)

Medium: STYLE ANCHOR changjak-touchgrain - hard-edge flat colour, 0 shading, 0 contour lines, 0 grain on the body.

FACE
Short blunt muzzle, wide forehead, two nub horns just risen. Ears long, set sideways, tips slightly down. Eye = one flat #3A3630 oval, taller than round, set high on the head so the animal reads young; no white, no highlight, no lid line. Nostril = one small #3A3630 oval. Mouth closed = 0 marks; mouth slightly open (counting) = one small #3A3630 shape cut into the muzzle. No eyebrows, no whiskers, no cheek blush.

COAT
Flat #EDEDE8, edge to edge, 0 strokes, 0 texture, 0 shading, 0 grain - the coat never carries grain in this book, on any page. Where the body crosses into a shadow shape, that part is flat #A79B85, cut hard, no blend. The form reads through silhouette alone: a notch at the shoulder, a stepped haunch, a short flicked tail.

WORN & CARRIED
Nothing worn. One willow basket, flat #A79B85, a shallow oval with a high arched handle, held against the chest with both forepaws when reared; on pages 13-14 there is no basket and both forepaws swing free.

BUILD & SILHOUETTE
Small and short-legged: head about one quarter of body length, chest narrow, knees knobbly, hooves small blocky #3A3630 shapes. On four legs the back is one shallow arch. Reared, the belly makes a plump curve, the hind legs stand straight, and the two forepaws come together in front of the chest. A forepaw laid on something opens into a flat fan with three toe notches - that spread shape is this book's main gesture. Silhouette test against the goose: the kid is a tall arch with four legs and long ears; the goose is a low oval with one long neck.

REFERENCE SHEET
One flat cream field, figures floating on it, no ground, no shadow:
1) reared on the hind legs, both forepaws holding the basket at the chest, seen from behind
2) same pose, 3/4 turn toward camera
3) standing on four legs, side view, no basket, both forepaws down
4) one forepaw alone, spread flat as a palm, three toe notches
5) one forehoof alone, toe just touching a surface
6) head close-up x3 - calm / head tipped to one side / mouth slightly open, counting
7) walking side view, no basket, forelegs swung apart front and back
```

### 시트 2 — PondGoose

```
CHARACTER SHEET - PondGoose   (bake this FIRST)

Medium: STYLE ANCHOR changjak-touchgrain - hard-edge flat colour, 0 shading, 0 contour lines.

FACE
Small head, long straight neck, short wedge beak of flat #D8C48E. Eye = one flat #3A3630 oval, small, set high. Open beak = the wedge split into two flat shapes. No nostril line, no red, no orange.

PLUMAGE
Flat #EDEDE8, edge to edge. 0 feather marks, 0 texture, 0 grain, 0 shading. Wing reads as one notch cut into the body silhouette; tail as a second, shorter notch. Where the goose sits in water, the body is cut straight across by the water's flat edge - no ripple drawn on the bird itself.

WORN
Nothing.

BUILD & SILHOUETTE
Body a low broad oval, about two thirds the kid's body length, sitting so low in the water that only the top curve shows. Neck can rise to twice the body's height and is the same width all the way up. Webbed foot = one flat fan with two notches. Silhouette test against ErrandKid: no legs visible, one long smooth neck, no ears.

REFERENCE SHEET
One flat cream field, figures floating on it, no ground, no shadow:
1) sitting in water, neck raised straight, beak closed, cut off at the waterline
2) same, neck stretched forward and up, beak open (calling)
3) one webbed foot alone, lifted clear
4) seen small from a distance - the whole bird as a single flat white shape, no interior marks
```

## G-04 §4. 쪽별 컷

### p1 — 첫발

```
--- p1 - 첫발 ---
GRAIN: 1 - the road surface directly under the front hoof, 10 short broken lines inside the road shape only, reaching no further than one hoof's width. Nothing else on this page carries grain.
BLUE: 0. No blue anywhere in the frame.
RED: 1 - the cloth ribbon on the basket handle, one small flat #C0342E shape, the only red in the frame.
CAMERA: wide, from behind the kid at shoulder height, the whole bend visible - road entering at the left, bending right at frame centre, running out at the right.
SUBJECT: ErrandKid front centre-low, seen from behind, reared on the hind legs with the willow basket held against the chest by both forepaws, one hind hoof set forward with the hoof just landed, both ears pricked forward. No clothing, nothing worn.
SETTING: dirt road #D8C48E filling the lower two thirds; sky band #EDEDE8 across the top 18%; far left a small #A79B85 roof with one thin smoke line; 8 flat grass blades along the road edge; the puddle already visible inside the bend as a flat #EDEDE8 shape with 0 grain.
FINISH: ErrandKid full; the landed hoof and its patch of road grain are the second finished thing.
TONE: high white afternoon. Cast shadows are short flat #A79B85 shapes. No letters or signs anywhere.
```

### p2 — 첨벙

```
--- p2 - 첨벙 ---
GRAIN: 1 - the puddle surface, 12 concentric ring lines inside the water shape only. The kid has not touched anything yet this page; the grain belongs to the water because the water moved.
BLUE: 0.
RED: 0 - the ribbon is turned away and out of sight this page.
CAMERA: medium, lens at the water's surface level, looking across the puddle.
SUBJECT: left of frame, ErrandKid stopped dead, reared with the basket at the chest, body tipped slightly forward, all four legs locked, ears up. Right of frame in the water, PondGoose sitting, neck raised straight, one webbed foot lifted clear of the surface.
SETTING: the puddle as one flat #EDEDE8 shape inside the bend; 5 flat droplet shapes above it, no motion lines; the road #D8C48E around it; sky band across the top 15%; 6 grass blades.
FINISH: ErrandKid full; the puddle with its rings is the second finished thing.
TONE: the water is the brightest shape on the page. The road stays quiet with 0 marks.
```

### p3 — 하나

```
--- p3 - 하나 ---
GRAIN: 1 - the puddle: 3 concentric rings spreading from the hoof tip, plus 4 finer rings behind them, all inside the water shape.
BLUE: 0.
RED: 0.
CAMERA: close-up, straight down from directly above the puddle's edge.
SUBJECT: from the top of the frame, one of ErrandKid's forehooves comes down and touches the surface with the very tip only. Lower left corner, the white back and one webbed foot of PondGoose clipped by the frame.
SETTING: the puddle filling most of the frame, flat #EDEDE8; 4 flat pebble shapes under the water in #A79B85; a rim of #D8C48E road around the outside. Nothing else.
FINISH: the hoof tip full; the rings are the second finished thing - the crispest edges on the page.
TONE: the page is nearly only two colours, white water and yellow road. No blue.
```

### p4 — 꺾인 팔

```
--- p4 - 꺾인 팔 ---
GRAIN: 0 - the kid has not touched the post yet. Not one grain line on this page.
BLUE: 0.
RED: 0.
CAMERA: medium, low angle looking up, the signpost splitting the frame vertically.
SUBJECT: lower right, ErrandKid on four legs looking up, head tipped to one side, the basket still held at the chest by both forepaws with the body half reared. PondGoose is out of frame.
SETTING: one signpost - post and cross-arm, the arm snapped at its base and hanging straight down, all of it flat #8C8271 because it stands against the sky; sky band enlarged to the top 30% behind it; road below; 7 grass blades. The arm is blank - no letters, no numbers, no marks of any kind.
FINISH: ErrandKid full; the broken joint of the arm is the second finished thing - shape only, 0 grain.
TONE: backlight is not shading - the post is simply one step darker, flat, hard-edged.
```

### p5 — 둘

```
--- p5 - 둘 ---
GRAIN: 1 - the signpost's lower trunk: 16 straight vertical fibre lines and 2 splits, inside the post shape only. The road behind carries 0 grain and 0 marks.
BLUE: 0.
RED: 0.
CAMERA: medium close-up, side on at the kid's own eye level, the post's base filling the left half.
SUBJECT: right of frame, ErrandKid with the basket shifted to one forepaw against the chest, the other forepaw open flat and tapping the post; mouth slightly open, counting; eyes down on its own forepaw.
SETTING: the post base #A79B85 with its grain; one flat #A79B85 moss patch at the foot; road; sky band at the top 15%; 5 grass blades. The road behind is smooth flat colour with nothing on it.
FINISH: ErrandKid full; the grained post is the second finished thing - the only textured shape in the frame.
TONE: the eye must land on the open forepaw against the grain. No letters on anything.
```

### p6 — 여기가 끝이야

```
--- p6 - 여기가 끝이야 ---
GRAIN: 0 - nothing is touched on this page.
BLUE: 0.
RED: 0.
CAMERA: wide, slightly high angle, the whole bend from above shoulder height.
SUBJECT: centre-left and very small, ErrandKid reared with the basket, hind hoof still trailing behind, the body not moving forward, ears half back.
SETTING: the bend ending at frame centre - one flat #A79B85 stump with a fallen trunk lying beside it, 0 grain on either; the road running on past them to the right and out of frame; far lower left, the puddle with PondGoose as one small flat white shape; sky band across the top 18%; 9 grass blades. No houses, no people, no birds in the sky.
FINISH: ErrandKid full even at this size; the stump is the second finished thing - shape only, still ungrained because it has not been touched.
TONE: wide and quiet. Large empty flat areas of road are correct here.
```

### p7 — 셋

```
--- p7 - 셋 ---
GRAIN: 1 - the stump's cut face: 9 concentric growth rings plus one straight saw kerf, inside the cut face only. The surround has 0 lines of any kind.
BLUE: 0.
RED: 0.
CAMERA: close-up at the height of the laid forepaw, the cut face taking the middle of the frame.
SUBJECT: centre, one of ErrandKid's forepaws spread flat and laid on the stump's face, three toe notches clear. Upper left corner, only the kid's chin and lowered eye clipped by the frame.
SETTING: the stump's cut face flat #D8C48E with its rings; the bark rim and the fallen trunk flat #A79B85 with 0 marks; a little #3A3630 crumb of earth in one crack; road at the edges. Nothing else.
FINISH: the spread forepaw full; the ringed cut face is the second finished thing. The surround is flat colour with no lines at all.
TONE: the cut face is the warmest, brightest shape on the page and the only grained one.
```

### p8 — 셋 다음이 없어

```
--- p8 - 셋 다음이 없어 ---
GRAIN: 0 - nothing is touched this page. The stump beside the kid is smooth flat colour again.
BLUE: 0.
RED: 0.
CAMERA: medium, over the kid's shoulder so the way home is seen with it.
SUBJECT: right foreground, ErrandKid reared with the basket at the chest, body facing right but the neck twisted to look back left, ears turned back. Left middle distance in the puddle, PondGoose with its neck stretched forward and up, beak open.
SETTING: far left edge, one very small flat #A79B85 roof with a thin smoke line; the road running from that roof through the frame to the kid, one continuous #D8C48E field; the fallen trunk at the right edge; sky band across the top 16%; 8 grass blades.
FINISH: ErrandKid full; the small roof is the second finished thing - crisp silhouette, 0 marks inside.
TONE: the way home reads slightly brighter than the way on. Home, goose and kid are all in one frame, so nothing feels far.
```

### p9 — 한 발

```
--- p9 - 한 발 ---
GRAIN: 1 - the new road surface right at the landed hoof, 8 short broken lines inside the road shape only, reaching one hoof's width. The stump's shadow carries 0 marks.
BLUE: 0.
RED: 0.
CAMERA: close-up, lens on the ground, the road filling the frame.
SUBJECT: centre, one of ErrandKid's forehooves just landed on fresh road, the hind hoof still standing inside the shadow shape. The belly and the underside of the basket clip the top of the frame.
SETTING: the stump's cast shadow as one hard-edged flat #A79B85 shape crossing the frame diagonally, 0 marks inside it; 3 flat pebbles; the sunlit road #D8C48E. Nothing else.
FINISH: the landed hoof full; the shadow's straight edge is the second finished thing - one clean hard line across the page.
TONE: the shadow is not shading. It is a flat shape with a cut edge, and it must read as an object.
```

### p10 — 저기가… 파란 문이야?

```
--- p10 - 저기가... 파란 문이야? ---
GRAIN: 0 - the door has not been touched yet.
BLUE: 1 - the door, one flat #2F6FA8 rectangle, the first blue in the book. Nothing else is blue: not the sky, not the water, not a shadow.
RED: 0.
CAMERA: wide, from behind the kid, looking down the road past the bend.
SUBJECT: lower left, ErrandKid seen from behind, reared with the basket at the chest, neck stretched forward, ears pushed forward, stopped. Far behind at the left edge, PondGoose still visible as one small flat white shape on the puddle.
SETTING: a knee-high stone wall of at most 12 flat #A79B85 stones running to the right; at its end one blue door, flat, blank - no letters, no numbers, no marks; road; sky band across the top 15%; 7 grass blades.
FINISH: ErrandKid full; the blue door is the second finished thing - small, flat, and the only blue on the page.
TONE: everything except the door is earth colour and dry grass colour. The door must be found by colour alone, not by size.
```

### p11 — 넷

```
--- p11 - 넷 ---
GRAIN: 1 - the door: 14 flaked paint chips inside the blue rectangle, each a small flat #A79B85 patch where the paint has come off, plus 4 fine split lines. Nothing else on the page carries grain; the wall and road are smooth flat colour.
BLUE: 1 - the door, flat #2F6FA8, blank.
RED: 0 - the basket is turned so the ribbon is hidden this page.
CAMERA: medium close-up, square to the door, at the kid's eye level.
SUBJECT: right of frame, ErrandKid holding the basket with one forepaw against the chest and the other forepaw spread flat against the blue door panel, three toe notches clear; eyes down on its own forepaw; mouth slightly open, counting. Reared on the hind legs, nothing worn.
SETTING: the door filling the left two thirds, flat #2F6FA8 with its flaking; one flat #3A3630 latch shape; a strip of stone wall; road at the bottom. No letters, no numbers, no marks on the door.
FINISH: ErrandKid full; the flaked door panel is the second finished thing and the most finished surface in the book so far. Wall and road stay bare flat colour.
TONE: the palm on the grain is the whole page. Nothing else competes.
```

### p12 — 달랑

```
--- p12 - 달랑 ---
GRAIN: 1 - the door again, the same 14 flakes, since the kid's forepaw is still on the door's ironwork. No grain anywhere else.
BLUE: 1 - the door.
RED: 1 - the ribbon on the basket handle, now hanging from the latch, one small flat #C0342E shape and the strongest colour on the page.
CAMERA: medium, slightly high angle looking down at the latch.
SUBJECT: lower left, ErrandKid up on the tips of the hind hooves, one forepaw reaching up and just letting go of the basket handle, shoulders dropped, the body lighter without its load.
SETTING: the willow basket #A79B85 hanging on the latch with its red ribbon; the door ajar, showing one narrow flat #3A3630 gap; stone wall; beyond the wall one thin smoke line; road below. The door is blank.
FINISH: ErrandKid full; the hanging basket with its ribbon is the second finished thing.
TONE: the red is one small shape but the darkest, strongest colour in the frame. No other red anywhere.
```

### p13 — 손을 안 뻗어요

```
--- p13 - 손을 안 뻗어요 ---
GRAIN: 0 - this is the first of the two pages with no grain at all. The stump and the fallen trunk are smooth flat #A79B85 with 0 rings, 0 lines, 0 marks. Do not grain them again.
BLUE: 0 - the door is behind the camera.
RED: 0.
CAMERA: medium wide, tracking alongside the kid, square to its side.
SUBJECT: centre, ErrandKid walking on four legs in profile, both forepaws empty and swung apart, one forward and one back; head level, eyes fixed ahead toward home, not turned to the stump.
SETTING: the stump and the fallen trunk crossing the near foreground, passing in front of the kid and half cropping it; road; sky band across the top 16%; 6 grass blades. Shadows are slightly longer flat #A79B85 shapes.
FINISH: ErrandKid full; the two empty swung forepaws are the second finished thing. The stump gets no finish at all this page.
TONE: speed reads as the spread of the legs and the swing of the forepaws. No motion lines, no dust, no blur.
```

### p14 — 파란 문까지

```
--- p14 - 파란 문까지 ---
GRAIN: 0 - no grain anywhere in this frame. The signpost, the puddle and the stump are all smooth flat colour now, exactly the shapes they were, with the texture gone.
BLUE: 1 - the far door, one small flat #2F6FA8 shape on the wall at the back.
RED: 1 - one #C0342E dot on that far door's latch, the size of a fingernail, the only red on the page.
CAMERA: wide, slightly low eye level, facing the way p1 faced from the opposite side - the whole bend in one frame.
SUBJECT: front centre, ErrandKid walking toward camera on four legs, both forepaws empty and swinging, the signpost sliding past its shoulder untouched, no forepaw reaching for it.
SETTING: left, the puddle with PondGoose looking up, neck raised; right, the broken signpost, blank; behind at the bend's end, the stump; beyond it the stone wall and the small blue door with the red dot; sky band across the top 18%; 9 grass blades.
FINISH: ErrandKid full; the red dot on the far door is the second finished thing, tiny but the sharpest colour in the frame. Nothing carries grain - that absence is the ending.
TONE: same place as p1 from the other direction, afternoon a little lower, shadows a little longer. No letters or signs anywhere.
```
