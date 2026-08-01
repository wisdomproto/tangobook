# 창작동화 1000 — D-01 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/d01.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## D-01 §1. 앵커 배정

**권**: d01 「산 너머엔 뭐가 있어?」 · 여정과 귀환 · 알프스 능선 꼭대기 돌무더기 · 12쪽 · 4~6세
**클러스터**: C7 · **슬러그**: `changjak-backpress` (신규 민팅)
**한 줄**: 붓으로 얹지 않는다. 판에 민 잉크 위에 종이를 엎어 놓고 **뒤에서 눌러** 그린다 — 누른 자리만 옮겨지고 **안 누른 데는 맨 종이**다. 하늘은 비워서 비는 게 아니라 잉크가 한 번도 안 닿아서 빈다.

🔴 **형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | 판정 |
|---|---|---|
| **C7 여섯** b09·d03·a05·d07·g02·e02 | **붓 자국이 있나** | 저쪽은 전부 표면에 얹거나 스미게 한다 · **d01 = 붓 자국 0획**, 모든 획이 눌린 자국 + 스페클 |
| **a75** `changjak-ridgewash` (같은 능선) | **하늘이 칠해져 있나** | a75 = 젖은 남색이 위에서 내려와 하늘을 먹는다 · **d01 = 하늘은 잉크가 한 번도 안 닿은 맨 종이** |
| **c02** `changjak-mistbleed` (같은 알프스) | **공기가 무언가를 가리나** | c02 = 안개가 형태를 삼킨다 · **d01 = 아무것도 안 가린다.** 🔴 번짐을 넣는 순간 c02 다 |
| **b19·g03** (같은 알프스) | **맨 종이가 몇 %인가** | 둘 다 **0%** · **d01 = 화면의 60~70%.** 썸네일에서 위가 하얗게 빈 한 권 |
| **g03** | **색이 언제 느나** | g03 = p2 부터 매 쪽 하나씩(겹치는 불투명 판) · **d01 = 열 쪽 동안 그대로, p11 에 판을 갈아 한 번 더 찍는다** |
| 🔴 **g04** `changjak-touchgrain` (같은 배치·같은 엔진·둘 다 새끼 염소) | **① 결이 몇 군데인가 ② 어디가 비나 ③ 의인화** | d01 = **화면 전체가 눌린 종이 결**(셀 수 없다) · g04 = **0 또는 1** ‖ d01 = **위가 빈다**(하늘 2/3) · g04 = 옆이 빈다 ‖ d01 = **사족 + 방울 하나, 물건은 입으로 문다** · g04 = 앞발로 안고 손바닥을 편다 |
| 니들펠트(호리) | 표면 | 보풀·바늘땀·섬유 엣지 0. 이 책의 표면은 종이 결과 잉크 스페클뿐 |

🔴 **이 권의 기계장치 = 압력 세 단.** 겹겹이 물러나는 능선을 원근·안개·블러로 만들지 않는다. **누르는 세기**만 낮춘다(하드 → 미디엄 → 30% 스페클). 세기를 색이나 흐림으로 바꾸면 이 권이 통째로 죽는다.
🔴 **p1~p10 에 따뜻한 색을 한 점도 만들지 마라** — 놋쇠 방울은 **같은 잉크의 밝은 단**이고 별색이 아니다. 붉은 갈색은 p11 에 처음 나온다.

**대본 SCENE 처방표** (대본은 안 고치고 컷에서 분기)

| 대본 문구 | 옮기는 법 |
|---|---|
| p3 「하늘은 흰 여백에 가깝게」 | 여백이 아니라 **0 press** — 그 자리엔 아무것도 안 찍힌다 |
| p7 「하늘과 산의 경계는 흐리게」 | 흐림이 없는 매체다 → **압력을 30% 스페클로 낮춰** 자국이 끊기게 |
| p10 「양 끝의 산은 흐리게 죽이고」 | 같은 처방 — 가장 옅은 압력 단, 획 수는 그대로 |
| p8 「그림자가 짧고 바로 아래 고인다」 | 음영이 없다 → **눌러 찍은 납작한 도형 하나**(발밑 한 덩이), 명암 0 |
| p1 「숨이 하얗게 나와요」 | 흰 물감 금지 → 주둥이 앞 **안 누른 맨 종이 한 자리** |

## D-01 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-backpress

Style: picture book for 4-6 year olds. One flat ridge-top above an alpine valley, one clear late morning, seen from the same spot all book. Back-pressed transfer print: a single ink is rolled flat on a plate, a sheet is laid face-down on it, and the picture is made by pressing the BACK of the sheet with a blunt point. Only pressed places take ink. Unpressed sheet stays bare. Nothing is brushed on.

RENDERING (finish hierarchy)
BARE SHEET = 60-70% of every frame, and the sky is bare on every page - ink has never touched it. Clouds = 0. Stars = 0. Nothing floats in the sky.
Every mark has a granular broken edge and a speckled interior. Solid unbroken fills = 0. Brush strokes = 0. Nib or pencil outlines = 0.
VALUE IS PRESS PRESSURE, 3 steps only: HARD (#43505E) - the goat's contour and features, the crow entire, the nearest rock; MEDIUM (#7C8A98) - the cairn, the first ridge behind, dry grass; LIGHT (a 30% broken speckle of #7C8A98) - every ridge further back. A lighter ridge is simply further away: no haze, no fog, no blur, no atmosphere layer.
The goat's coat is bare sheet, not ink: at most 8 pressed strokes inside its body, all else contour.
FINISHED THINGS PER PAGE = 2 - the kid goat, and the one thing it touches or looks at that page. DENSITY RATION = none.
Dry grass = 12-20 pressed strokes per page, never a field. Cairn = at most 7 stones, each 1 pressed shape with a speckled edge and 0 marks inside. Ground = at most 5 pressed strokes. Shadows = 1 pressed flat shape under the body, never shading.
PLATE 2: pages 11 and 12 only. The sheet is re-laid on a second plate inked #A4522E and pressed again, for the valley roofs alone. On pages 1-10 there is no warm colour in the frame at all - the brass bell is the LIGHT step of the same grey ink.

PALETTE
#EAE8E1 bare sheet - sky, breath, snow, all empty ground · #7C8A98 medium press - cairn, near ridge, grass, stone · #43505E hard press - the goat's contour, the crow, the nearest rock · #A4522E second plate, pages 11-12 only, the valley roofs.

CHARACTER DESIGN LANGUAGE
Quadruped animals. No clothing, no two-legged standing, no held objects - the goat carries a stone in its MOUTH. The one worn thing in the book is a brass bell on a cord at the goat's neck. Eye = one pressed oval, no white, no highlight. An open mouth is a pressed shape, not a line.

CANVAS
16:9 double-page spread. No letters, numbers, signs or symbols anywhere in this book.

NOT (rendering only)
- 0 brush marks: nothing laid, floated or washed on the surface - every mark is transferred by pressing
- no mist, fog, haze, blur or soft focus - distance is press pressure only
- no shading, gradient, airbrush, texture filter or 3D render
- no needle-felted wool, stitching or fibre edges
```

## D-01 §3. 캐릭터 시트

### 시트 1 — RidgeKid

```
CHARACTER SHEET - RidgeKid   (bake this FIRST)

Medium: STYLE ANCHOR changjak-backpress - back-pressed transfer print, 0 brush marks, granular speckled marks on bare sheet.

FACE
Short blunt muzzle, wide forehead, small nub horns barely risen (a young kid). Ears long, set sideways, slightly drooping at the tip. Eye = one pressed oval of #43505E, tall rather than round, set high and wide so the animal reads young; no white, no catchlight. Nostril = one small pressed comma. Mouth closed = 0 marks; mouth open = one pressed shape, never a drawn line. No eyebrows, no whiskers.

COAT
Bare sheet #EAE8E1. At most 8 pressed strokes inside the whole body - two at the chest, three along the spine, three at the haunch. The form is carried by the pressed CONTOUR (#43505E), which is broken and granular, never a continuous even line. 0 fur texture, 0 tufts, 0 hatching.

WORN
One brass bell on a short cord at the throat: a pressed rounded shape in the MEDIUM step (#7C8A98) with a pressed slot across its lower half. It is never a second colour. Nothing else is worn - no collar tag, no ribbon, no bag.

BUILD & SILHOUETTE
Small and short-legged: head about one quarter of body length, chest narrow, knees knobbly, hooves small and blocky, tail short and flicked up. Standing on four legs the back is one shallow arch. Neck can extend forward to about one and a half head-lengths (this is the book's main gesture). Never rears, never stands on two legs, never holds anything with a forepaw.

REFERENCE SHEET
One bare sheet, figures floating on it, no ground, no shadow:
1) full body standing on four legs, side view, facing right
2) same body in 3/4 turn toward camera
3) neck stretched far forward over an edge, forelegs planted, hind legs pushed back long
4) four legs braced wide apart, coat and ears laid over to one side by wind
5) head close-up x3 - calm / eyes wide with one ear folded back / mouth open calling (mouth = pressed shape)
6) head lifted with a flat stone held in the mouth, lips parted around it
7) lying with forelegs folded under, seen from behind, tail visible
```

### 시트 2 — Crow

```
CHARACTER SHEET - Crow   (bake this FIRST)

Medium: STYLE ANCHOR changjak-backpress - back-pressed transfer print, 0 brush marks.

FACE
Heavy straight beak, slightly hooked at the tip, about one third of head length. Eye = one small bare unpressed dot left inside the pressed head (the only bare spot in the bird), which reads as a pale eye. Open beak = a pressed wedge shape.

PLUMAGE
The whole bird is HARD press #43505E, edge to edge, with the speckle of the transfer showing throughout - no highlights, no sheen, no feather drawing. Wing feathers read only as 5-7 notches cut into the silhouette. Tail = one wedge with 3 notches.

WORN
Nothing. No band, no bag, no object ever carried.

BUILD & SILHOUETTE
Body about one third the length of RidgeKid. Standing: compact, shoulders high, tail level, legs short with three visible toe notches. The silhouette test against RidgeKid is total - solid dark mass with a straight beak versus a pale bare-sheet body with a broken contour.

REFERENCE SHEET
One bare sheet, figures floating on it, no ground, no shadow:
1) standing side view, facing right, wings closed
2) seen from behind, head turned in profile (the book's most-used pose)
3) landing - wings half open, toes reaching down, beak open
4) perched with feet together, tail dropped low
5) head close-up, beak open, the bare eye-dot clearly visible
```

## D-01 §4. 쪽별 컷

### p1 — 꼭대기에 올라섰다

```
--- p1 - 꼭대기에 올라섰다 ---
INK: 1 plate, grey only. Warm colour = 0 anywhere in the frame.
BARE: sky = the upper 66%, untouched sheet, 0 marks in it. The breath at the muzzle is a bare unpressed patch, not white paint.
PRESS: HARD on the goat's contour, the bell and the nearest rock; MEDIUM on the cairn and grass; the low ridge at bottom right is a 30% speckle.
CAMERA: wide, low angle - lens at summit ground height, tilted up 8 degrees, horizon at 34% of frame height.
SUBJECT: RidgeKid at 20% width, quadruped, no clothes, bell only - just up over the last boulder, one hind hoof still on the lower rock, both forehooves on the summit soil, head lifted to the right frame edge, ears forward.
SETTING: one cairn at 74% width, twice the kid's height, seven stones; wind-laid dry grass, 16 strokes; a patch of old snow in a stone gap = bare sheet. Crow on the cairn's top stone, from behind, facing out of frame. The village is behind the camera, never in frame.
FINISH: RidgeKid full; the forehooves and the bell are the second finished thing. The cairn stays MEDIUM.
TONE: cold high clear light. The eye must land on the lifted head, then travel right into empty sheet.
```

### p2 — 산 너머엔 뭐가 있어?

```
--- p2 - 산 너머엔 뭐가 있어? ---
INK: 1 plate, grey only. Warm colour = 0.
BARE: sky = the upper half of the frame plus the whole right third, untouched. 0 marks in it.
PRESS: HARD on the stretched neck and the two planted forehooves; MEDIUM on the near valley wall and the facing mountain; nothing in this frame takes the LIGHT step.
CAMERA: medium, over the shoulder from low behind the kid, lens 20cm above the ground, looking the way the kid looks.
SUBJECT: RidgeKid at the lower left, 30% width, quadruped, bell only - forehooves planted on the edge boulder, neck stretched far forward to its full length, hind legs pushed back straight so the body is long, ears pricked forward.
SETTING: the ground drops away just past the forehooves into one valley; across it stands one mountain of the same height, facing camera, its face MEDIUM press with a speckled edge; the edge boulder; 14 grass strokes. Nothing else.
FINISH: RidgeKid full; the line of the stretched neck is the crispest edge on the page - it is the second finished thing. The facing mountain has 0 marks inside it.
TONE: the valley is the darkest press in the frame, the mountain face the lightest pressed thing; the sheet is brighter than both.
```

### p3 — 까악!

```
--- p3 - 까악! ---
INK: 1 plate, grey only. Warm colour = 0.
BARE: sky = 70% of the frame, untouched, 0 marks - this is the emptiest page in the book.
PRESS: HARD on the crow entire and on the goat's head; MEDIUM on three or four cairn stones; 0 press everywhere else.
CAMERA: medium close-up, low angle from among the dry grass, lens 8cm above the ground, tilted up 20 degrees at the cairn.
SUBJECT: Crow at the top of the frame, landing on the next stone down - both wings half open, toes reaching for the stone, beak open. Below right, RidgeKid on four legs, quadruped and bell only, head tipped straight up at the bird, the bell swung forward under the jaw.
SETTING: four cairn stones only, cut off by the frame; 12 grass strokes along the bottom edge. Nothing else.
FINISH: the crow full; the goat's lifted head is the second finished thing. The stones stay MEDIUM with 0 marks inside.
TONE: one dark bird against bare sheet. No motion lines, no dust, no sound marks.
```

### p4 — 저 산은 하얘!

```
--- p4 - 저 산은 하얘! ---
INK: 1 plate, grey only. Warm colour = 0.
BARE: sky = the upper 55%, and the snow mountain's whole face is bare sheet too - the only pressed part of that mountain is its lower contour and 3 speckled creases.
PRESS: HARD on the goat's contour and open mouth; MEDIUM on the low ridge in front of the snow mountain; LIGHT 30% speckle at the far right where the ridge runs out of frame.
CAMERA: medium wide, side view of the kid, the frame opening away to the right.
SUBJECT: RidgeKid at 16% width, quadruped, bell only - both forehooves set hard on the western edge, mouth open calling (a pressed shape, not a line), tail flicked straight up, standing on four legs.
SETTING: far right, one snow mountain running out of frame; in front of it one lower ridge in MEDIUM press; dry grass at the kid's hooves, 15 strokes. Nothing else. The village is not in frame.
FINISH: RidgeKid full; the snow mountain's bare face is the second thing the eye takes - keep it clean, 0 marks inside it.
TONE: the page reads as two things only - a pale summit ground and a paler mountain. Do not press a middle value between them.
```

### p5 — 안 넘어져!

```
--- p5 - 안 넘어져! ---
INK: 1 plate, grey only. Warm colour = 0.
BARE: sky = the upper 60%, untouched.
PRESS: every pressed mark on this page is made by pushing the point in ONE direction, left to right - grass, coat, ears, ground. Only the four braced legs are pressed against that direction. HARD on the kid, MEDIUM on the grass and the low stone.
CAMERA: close-up at the kid's own eye level, lens near the ground, the animal filling the middle third.
SUBJECT: RidgeKid centre frame, quadruped, bell only - all four legs braced wide, hooves pressing into the soil, coat strokes and both ears laid flat to one side, chin tucked in, the bell thrown out sideways on its cord.
SETTING: dry grass all laid one way, 20 strokes; one low cairn stone at the right edge. Nothing else.
FINISH: RidgeKid full; the four braced hooves are the second finished thing. 0 marks in the ground beyond 5 strokes.
TONE: the wind is not drawn - it is the press direction. No motion lines, no swirls, no dust.
```

### p6 — 딸랑

```
--- p6 - 딸랑 ---
INK: 1 plate, grey only. The bell is the LIGHT step of the SAME grey ink - warm colour = 0.
BARE: sky = the upper 45% plus the right edge; grass is laid over bare ground with 0 fill under it.
PRESS: HARD on the crow and on the bell; MEDIUM on the cairn and the turned head; 0 press on the ground between them.
CAMERA: medium, high angle looking down at the cairn from slightly above it, tilted 20 degrees down.
SUBJECT: upper left, Crow perched with feet together on the east stone, tail dropped, beak open. Lower right, RidgeKid on four legs, quadruped and bell only, body still facing right but head turned left - the bell pushed out to the side of the neck, caught mid-swing.
SETTING: the cairn, seven stones, 0 marks inside them; 14 grass strokes. Nothing else.
FINISH: RidgeKid full; the bell is the second finished thing and the lightest pressed object in the frame. Wind has stopped - grass stands straight again.
TONE: quiet page. Do not press a bright accent anywhere else.
```

### p7 — 산이 몇 개야!

```
--- p7 - 산이 몇 개야! ---
INK: 1 plate, grey only. Warm colour = 0.
BARE: sky = the upper 50%, untouched; the gaps between the ridges are bare sheet too - do not fill them.
PRESS: this is the page that shows the pressure scale. Nearest ridge HARD; second MEDIUM; third and fourth a 30% broken speckle; the fourth barely takes ink at all. Where a ridge meets the sky, lift the pressure so the edge itself goes broken - that is the only 'soft' in the book.
CAMERA: wide, eye level, the kid pushed to the far left, the right two thirds opened up.
SUBJECT: RidgeKid at 9% width, small but with a crisp contour, quadruped and bell only - standing on the eastern edge, neck stretched forward, one forehoof half over the lip of the boulder.
SETTING: to the right, four ridge lines receding, each one pressed lighter than the one in front; one edge boulder under the kid. Nothing else - no trees, no birds, no clouds.
FINISH: RidgeKid full even at this size; the nearest ridge is the second finished thing. The far ridges have 0 marks inside them.
TONE: depth is press pressure only. No haze, no blur, no cooler colour with distance.
```

### p8 — 다리 아파

```
--- p8 - 다리 아파 ---
INK: 1 plate, grey only. Warm colour = 0.
BARE: sky = the upper 40%; the ground around the body is bare except 5 strokes.
PRESS: HARD on the kid's contour and the dry grass caught in the hooves; MEDIUM on the cairn base; the shadow is ONE pressed flat shape in the MEDIUM step directly under the body, not shading.
CAMERA: medium close-up, side view, eye level.
SUBJECT: RidgeKid centre frame, quadruped, bell only - forelegs folded under, hind legs slipped out to one side, head lowered to look at its own forehoof, ears drooping sideways.
SETTING: the lower part of the cairn at the right, Crow on its top seen from behind and cropped by the frame; a few dry grass blades caught between the hooves; bare soil. Nothing else.
FINISH: RidgeKid full; the grass stuck in the hoof is the second finished thing - the most pressed detail on the page, at most 6 blades.
TONE: high noon, so the pressed shadow is short and sits right under the body. Keep the whole page quiet.
```

### p9 — 톡, 한 뼘 높아졌다

```
--- p9 - 톡, 한 뼘 높아졌다 ---
INK: 1 plate, grey only. Warm colour = 0.
BARE: sky = the upper 60%, untouched. Crow is not on this page.
PRESS: HARD only on the flat stone being set down and on the lips around it; MEDIUM on the cairn's top stones; nothing else takes more than MEDIUM.
CAMERA: close-up, low angle looking up at the top of the cairn, tilted up 25 degrees.
SUBJECT: from below, RidgeKid - quadruped, bell only, forehooves hooked on a lower stone, neck stretched straight up, a flat stone held in the MOUTH and just touching the top of the cairn, lips parted around it. It never uses a forepaw to carry.
SETTING: three or four top stones of the cairn; bare sky above. Nothing else - no crow, no grass in frame.
FINISH: the flat stone is the most finished thing on the page, above the kid itself; give it the crispest pressed edge in the book so far.
TONE: one small act, high up, against empty sheet.
```

### p10 — 어? 그럼 뒤는?

```
--- p10 - 어? 그럼 뒤는? ---
INK: 1 plate, grey only. Warm colour = 0.
BARE: sky = the upper 55%; both far corners of the frame stay mostly bare.
PRESS: HARD on the raised neck and the folded ear; MEDIUM on the cairn; the ridges clipped by the left and right frame edges are the LIGHTEST 30% speckle - press them down, they must not compete.
CAMERA: medium, low angle from below so the kid rises above the cairn's shoulder, tilted up 15 degrees.
SUBJECT: RidgeKid centre, quadruped, bell only - both forehooves up on the middle of the cairn, hind hooves still on the ground, neck raised straight, eyes wide (the pressed oval enlarged, not rounded), one ear folded back. Crow on the cairn top looking down at the kid.
SETTING: the cairn; a strip of far ridge caught at each frame edge; 12 grass strokes. Nothing else.
FINISH: RidgeKid full; the folded-back ear and the raised neck are the second finished thing. The ridges at the edges have 0 marks inside.
TONE: the proposition of this page is 'one side has not been looked at yet' - keep both edges empty enough that the eye asks about them.
```

### p11 — 처음으로 뒤를 본다

```
--- p11 - 처음으로 뒤를 본다 ---
INK: 2 plates. The sheet is pressed again on a second plate inked #A4522E for the valley roofs ONLY - a dozen roofs, together no larger than the kid's head. First warm colour in the book.
BARE: sky = the upper 35% only (the camera has turned and looks down the far side); the pale track through the valley is bare sheet.
PRESS: HARD on the kid's turned body and the bell; MEDIUM on the slope falling away; LIGHT 30% on the valley floor around the roofs.
CAMERA: wide, over the shoulder - the first page where the camera faces the way it has been turned away from for ten pages.
SUBJECT: RidgeKid at the lower front, 34% width, quadruped and bell only - caught half-turned: hind legs still pointing at the mountains, chest and head come round toward the valley, the bell still swung back on its cord.
SETTING: the slope drops from the hooves to a valley floor; on it a dozen thumbnail #A4522E roofs and one pale track; upper left, the cairn with Crow on the village-side stone for the first time.
FINISH: RidgeKid full; the cluster of roofs is the second finished thing - small, but the crispest warm mark in the book.
TONE: the summit stays cold grey, the valley floor warm; the two meet across the middle of the frame.
```

### p12 — 우리 집이야

```
--- p12 - 우리 집이야 ---
INK: 2 plates. Second plate #A4522E again, roofs only. Nothing else in frame is warm - the smoke is bare sheet.
BARE: sky = the upper 30%; the rising smoke is one narrow unpressed channel, not a white line.
PRESS: HARD on the two backs - press kid and crow down to near-silhouette; MEDIUM on the cairn corner and slope; LIGHT 30% on the valley floor so the roofs sit brightest.
CAMERA: wide, over the shoulder, same direction as p11 with the camera stepped one pace back. The mountains are behind the camera and not in frame.
SUBJECT: RidgeKid at the lower centre, quadruped and bell only - fully turned to the valley, sitting with forelegs folded under, head slightly lowered, ears relaxed sideways, seen from behind. Left, Crow on the village-side stone, also from behind, looking the same way. Two backs, no faces.
SETTING: a dozen #A4522E roofs with sun on their upper faces; one straight thread of chimney smoke as bare sheet; the cairn's corner; 10 grass strokes.
FINISH: the roofs are the most finished thing here - above the animals. The only page where the goat is not the finish leader.
TONE: the brightest, warmest place in the book is the valley floor. The summit and the two backs drop to silhouette.
```
