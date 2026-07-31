# 창작동화 1000 — F-05 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/f05.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## F-05 §1. 앵커 배정

**권**: f05 「아빠가 만든 이상한 저녁」 · 누적·반복 · 이탈리아 돌벽 부엌 · 14쪽 · 4~6세
**클러스터**: C2 · **슬러그**: `changjak-plateonly` (신규 민팅)
**한 줄**: 성긴 갈색 해칭 선이 부엌 전부를 짜고 **안 칠한 종이가 지배면**이다. **칠은 테두리 안에만 들어간다** — 화덕 아궁이 · 냄비 · 팬 · 바구니 · 접시. 그래서 **빈 접시 = 칠이 없는 접시**다.

🔴 **형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | 판정 |
|---|---|---|
| **C2 여섯** c23·c01·e11·e03·e07·f01 | **안 칠한 종이가 몇 %인가** | c23 = **0%**(두 평칠이 화면을 다 덮는다) · c01 = 검정 숲 평칠 · e11 = 돌벽이 붉은갈색 평칠 · e03 = 획이 화면의 전부 · **f05 = 종이가 55~70%, 칠은 테두리 안뿐** |
| 🔴 **e01** `changjak-drypaper` (같은 부엌 · 둘 다 흰 것이 사고) | **흰 자리가 돌아오나** | e01 = 안 그린 흰 면적이 화면을 잡아먹고 **안 돌아온다** · **f05 = p5·p6 에 해칭이 지워졌다가 p7 에 도로 촘촘해진다.** 그리고 e01 은 굵은 검정 콩테 한 색, f05 는 성긴 갈색 해칭 |
| 🔴 **d18** `changjak-steamplate` | **김이 얹는 것인가 지우는 것인가** | d18 이 **불투명 흰 김**의 주인이다 · **f05 의 김에 흰 판을 얹지 마라.** 김은 **선이 성기어져 종이가 드러난 자리**다 |
| **e11** `changjak-barnline` | 선의 굵기 | e11 = 굵고 뭉툭한 낙서 선 · **f05 = 가늘고 성긴 평행 해칭**, 윤곽은 한 줄씩만 |
| **a08·b06·h01·f03·e04** (실내 조리 무대) | 흰 것의 정체 | 체 가루 / 양각 / 격자 + 반투명 그림자 / 오려내기 띠 / 양면 색지 · **f05 = 해칭이 멈춘 자리** |

🔴 **순검정은 탄 계란 두 알뿐이다.** 그림자도 어둠도 전부 해칭이고, 다른 데에 먹을 만들면 p7 의 「화면에서 가장 진한 점」이 죽는다.
🔴 **소금병·기름병·자루·궤짝에 글자 금지.** 인물이 크게 나오는 쪽마다 반복해 적었다.

**대본 SCENE 처방표** (대본은 안 고치고 컷에서 분기)

| 대본 문구 | 옮기는 법 |
|---|---|
| p5 「부엌이 뿌예요 / 김에 반쯤 지워진다」 | 흰 물감 금지 → **그 구역의 해칭을 0으로**. 마늘 다발과 창은 선이 끊겨 사라진다 |
| p6 「화면 전체를 덮은 흰 김」 | 같은 처방 → 화면의 해칭을 팬 둘레만 남기고 0. 흰 판을 얹지 마라 |
| p7 「김이 걷힌 직후」 | 해칭이 **도로 촘촘해진다**. 이 쪽에서 흰 자리가 회수된다 |
| p2 「쏟아지는 소금만 하얗게 밝다」 | 흰 획 금지 → 소금 줄기는 **해칭을 비운 좁은 통로** |
| p14 「빈 접시 바닥에서 한 번 반짝」 | 하이라이트 금지 → **접시 안이 칠 없는 맨 종이**인 것이 곧 반짝임이다 |

## F-05 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-plateonly

Style: picture book for 4-6 year olds. A stone-walled Italian farmhouse kitchen over one evening. Drawn almost entirely in open brown hatching on bare warm paper - the paper itself is the wall, the floor, the air and the light. Flat colour is laid ONLY inside a rim: inside the stove mouth, inside the pot, inside the pan, inside the basket, inside a plate. Nothing outside a rim is ever coloured.

RENDERING (finish hierarchy)
BARE PAPER = 55-70% of every frame. Hatching stays open enough that paper shows between every pair of lines; it never closes into a solid tone.
HATCH DENSITY, 3 steps only: 10-12 lines per hand's width on near things (table edge, stove front, the badgers' contours); 4-6 on the room behind; 0 where steam, foam or spilled water sits. WHITE IN THIS BOOK IS NOT PAINT - it is hatching stopped. Opaque white = 0. Never lay a white shape over anything.
Contours = one brown line each, no doubled outlines. Stone wall = 0 marks except its top and bottom edge lines. Floor = 0 marks. Ceiling garlic = 1 outline + 3 hatch lines. Window = 2 lines for the frame, shutter = 4.
COLOUR INSIDE A RIM ONLY, and only while something is in it. An empty rim is bare paper - that is how this book says 'empty'. Colour is flat, one tone per rim, at full or half strength; it never crosses the rim, never spills, never glazes anything outside.
BLACK: the only pure black is the two burnt eggs (#17140F), on pages 7, 10 and 14. Nowhere else - shadows are hatching, never black.
FINISHED THINGS PER PAGE = 2 - the badger who acts on that page, and the one vessel he touches. DENSITY RATION = none. Props beyond stove, pot, pan, table, chairs, window, garlic, salt jar, oil bottle, jug, basket and plates = 0.

PALETTE
#F2EDE2 bare paper - walls, floor, air, steam, everything unpainted · #6B4A32 the hatching line, every contour and every shadow · #D9452F tomato and the red inside a rim · #E08A2C fire in the stove mouth, soup, bread crust, oil shine - inside a rim only, full or half strength · #17140F the two burnt eggs and nothing else.

CHARACTER DESIGN LANGUAGE
Badgers walking upright on two legs and using their forepaws as hands. The father wears a cloth apron and nothing else; the cub wears nothing at all. The two dark head stripes are drawn as dense hatched bands, never as flat black masks. Eye = one small brown circle, no white highlight. Bodies are built from hatching, never filled in.

CANVAS
16:9 double-page spread. Keep the lower 12% quiet for a caption. No letters, numbers, signs or symbols anywhere in this book - the salt jar, oil bottle, sacks and crates carry no writing.

NOT (rendering only)
- no opaque white: steam, foam and light are bare paper, never a laid white shape
- no colour outside a rim: wall, floor, air, fur and apron are never painted
- no shading, gradient, airbrush, texture filter or 3D render
- no solid ink black anywhere except the two burnt eggs
```

## F-05 §3. 캐릭터 시트

### 시트 1 — DadBadger

```
CHARACTER SHEET - DadBadger   (bake this FIRST)

Medium: STYLE ANCHOR changjak-plateonly - open brown hatching on bare paper, 0 filled tone.

FACE
Long low skull, blunt broad snout, small round ears set low and far back. The two badger head stripes run from the snout back over each eye - drawn as bands of DENSE hatching (12 lines per hand's width), never as flat black. Between them the muzzle stays bare paper. Eye = one small brown circle, no white, no catchlight; when squeezed shut it is one short curved line. Nose = one hatched wedge. Whiskers = 4 per side, single lines. Tongue out = one outline, unfilled.

FUR
Contour line plus 4-8 short hatch strokes at the shoulder, elbow and haunch only. The body's interior is bare paper. 0 filled fur, 0 crosshatching on the body.

CLOTHES
One cloth apron: a bib and a skirt, held by a neck strap and a waist tie, drawn as outline plus 6 vertical hatch lines. The apron is NEVER coloured - it is paper and line like everything outside a rim. Nothing else worn: no shirt, no hat, no shoes, no glasses.

BUILD & SILHOUETTE
Broad and heavy: shoulders twice the cub's width, short thick neck, a low belly, short legs, big flat forepaws with four finger notches. Standing upright the back leans slightly forward. Silhouette test against CubBadger: DadBadger is twice as tall, the snout is longer than the ear is wide, and the apron strap crosses the chest.

REFERENCE SHEET
One bare paper field, figures floating on it, no ground, no shadow:
1) standing upright, side view, tying the apron behind the neck, chin raised
2) same body in 3/4 turn toward camera
3) both forepaws high, holding a pan handle up and away, mouth open
4) both forepaws tipping a heavy jug forward
5) both forearms crossed in front of the face, body leaning back
6) seated, shoulders dropped, one forepaw dragging the apron hem up to the forehead
7) head close-up x3 - confident / tongue out with eyes squeezed shut / eyebrows up, tired
8) two forepaws alone, from above, one pressing bread flat and one rubbing a tomato half
```

### 시트 2 — CubBadger

```
CHARACTER SHEET - CubBadger   (bake this FIRST)

Medium: STYLE ANCHOR changjak-plateonly - open brown hatching on bare paper, 0 filled tone.

FACE
Round skull, short blunt snout, ears larger in proportion and set higher than DadBadger's. The two head stripes are narrower and drawn with 8 lines per hand's width, so the cub reads lighter. Eye = one small brown circle set high and wide, no white; when the eyes go wide the circle is drawn larger, never rounder-with-a-highlight. Mouth open = one outlined shape, unfilled.

FUR
Contour plus 3-5 hatch strokes at the shoulder and haunch only. Interior bare paper.

CLOTHES
None at all. Nothing worn, no bib, no napkin.

BUILD & SILHOUETTE
Half DadBadger's height, head nearly a third of the body, round belly, short arms, small forepaws with four finger notches, hind feet that do not reach the floor from the chair. Silhouette test: the cub's ear is as wide as its snout is long - the exact reverse of the father.

REFERENCE SHEET
One bare paper field, figures floating on it, no ground, no shadow:
1) climbing onto a chair, both forepaws on the seat, one hind foot up
2) sitting on the chair, chin resting on the backrest
3) both forepaws gripping a table edge, neck stretched forward
4) both forepaws holding a plate up at face height, body leaning forward, eyes wide
5) biting into a piece of bread held in both forepaws, cheeks full, hind feet dangling
6) head close-up x3 - mouth open watching / head tilted, questioning / both ears laid back
7) one forepaw alone, index finger pressing down on a flat surface
```

## F-05 §4. 쪽별 컷

### p1 — 오늘 저녁은 아빠가 다 할게!

```
--- p1 - 오늘 저녁은 아빠가 다 할게! ---
PAINT: 2 patches - the stove mouth (flat #E08A2C) and the basket (3 tomatoes, flat #D9452F). Nothing else is coloured. Walls, floor, apron, fur, air = bare paper and hatching.
HATCH: 10-12 per hand's width on the stove front, table edge and both badgers; 4-6 on the back wall; 0 marks on the stone wall face and on the floor.
BASKET: on the table's far end, holding 3 tomatoes and one loaf. It stays in this spot, untouched, through p10.
CAMERA: wide, eye level, square to the room so one whole kitchen bay is in frame.
SUBJECT: left, DadBadger upright at the wood stove, both forepaws behind his neck tying the apron strap, chin up. Right, CubBadger climbing onto the chair, both forepaws on the seat, one hind foot up, head turned to his father, eyes wide. Both bipedal; only the father is dressed, in the apron.
SETTING: one wood stove with an empty pot on it; one wooden table; one shuttered window, bright; garlic hanging from a beam (1 outline + 3 lines). Nothing else. No writing on any object.
FINISH: DadBadger full; the apron knot is the second finished thing. Bare paper must dominate.
TONE: evening light is not painted - it is where the hatching thins toward the window.
```

### p2 — 소금이 우르르

```
--- p2 - 소금이 우르르 ---
PAINT: 2 patches - the stove mouth and the pot's contents (half-strength #E08A2C). The salt jar is not painted.
HATCH: 10-12 on the two forepaws and the pot rim; 0 in a narrow channel running from the jar's mouth to the pot - the falling salt is that unhatched channel, not a white stroke.
BASKET: out of frame.
CAMERA: close-up, slightly high, looking down into the pot.
SUBJECT: top of frame, only DadBadger's two forepaws - one gripping the salt jar upside down and shaking it, the lid already off and in the air. Lower right corner, CubBadger's ear tips and one eye over the table edge.
SETTING: the pot, a little steam (hatching stopped just above the rim), the salt jar, the falling lid. Everything else is bare paper. The salt jar carries no writing.
FINISH: the two forepaws full; the empty channel of falling salt is the second finished thing - its edges are made by where the hatching stops.
TONE: the stove's orange comes from below the pot only, inside its rim.
```

### p3 — 짜다!

```
--- p3 - 짜다! ---
PAINT: 2 - the stove mouth and the pot's contents. The wooden spoon is not painted.
HATCH: 12 per hand's width on the face and the two stripes; 4-6 on the room; the stone wall behind has 0 marks.
BASKET: out of frame.
CAMERA: medium close-up, eye level, face square to camera.
SUBJECT: centre, DadBadger with his tongue out and both eyes squeezed shut, one forepaw still holding the wooden spoon, the other at the back of his neck. Behind right, CubBadger on the chair with his mouth open, watching. Bipedal, apron on the father only.
SETTING: the spoon, the pot rim, bare wall. Nothing else.
FINISH: DadBadger full; the out-turned tongue and the squeezed eyes are the second finished thing.
TONE: one warm rim below - all of it inside the stove mouth. The face itself is line and paper.
```

### p4 — 콸콸콸

```
--- p4 - 콸콸콸 ---
PAINT: 2 - the stove mouth and the pot's contents. The jug and the water are NOT painted.
HATCH: 10-12 on the jug, the arms and the pot rim; 0 across the whole foam band at the pot's lip and 0 along the pouring water - both are bare paper.
BASKET: out of frame.
CAMERA: medium, low angle, the pot rim cutting across the lower frame.
SUBJECT: left, DadBadger tipping a big jug forward with both forepaws, eyebrows up, mouth pursed. Lower right, CubBadger with his chin on the chair back, looking at the pot.
SETTING: the jug, the pot, a rising ring of foam at the rim drawn only as the boundary where hatching stops. Nothing else in frame.
FINISH: DadBadger full; the foam ring is the second finished thing - it is the brightest thing on the page because it is the emptiest.
TONE: the white is bare paper. Do not lay any white pigment on it.
```

### p5 — 으앗!

```
--- p5 - 으앗! ---
PAINT: 1 - the stove mouth only, and it is half hidden by the spill. The pot's contents are gone over the edge, so no second patch.
HATCH: 0 across the whole upper half of the frame - the garlic, the beam and the window are cut off mid-line and simply stop. 8-10 remains on the lower half around the stove and the table. This is the emptiest page in the book.
BASKET: still on the table's far end, untouched, its 3 red tomatoes visible below the steam line.
CAMERA: wide, eye level, square to the room - the same camera position and angle as p1, so the erasure can be compared.
SUBJECT: left, DadBadger with both forearms crossed in front of his face, body leaning back, ears flattened, eyes shut. Right, CubBadger up on the chair, both forepaws gripping the table edge, neck stretched forward.
SETTING: water running over the stove top; the top half of the room dissolved into bare paper. Same furniture, same positions as p1.
FINISH: DadBadger full; the boundary line where the hatching stops is the second finished thing - keep that edge ragged, made of line ends, never a painted cloud.
TONE: no opaque white anywhere. The steam is the paper.
```

### p6 — 계란!

```
--- p6 - 계란! ---
PAINT: 2 - the stove mouth (barely visible) and the pan (half-strength #E08A2C at the pan's base).
HATCH: 0 everywhere except a hand's width around the pan and the father's forearms; the cub, the table and the window are reduced to two or three surviving line ends each.
BASKET: hidden in the steam - not in frame.
CAMERA: medium, eye level, over the father's shoulder through the steam.
SUBJECT: centre, DadBadger cracking an egg on the pan's edge with one forepaw, eyes narrowed. Lower right, only CubBadger's two ear tips rise out of the bare paper - nothing else of him is drawn.
SETTING: the pan, a piece of eggshell, and paper. Every other prop is left undrawn on this page.
FINISH: DadBadger's forepaw and the pan rim full; the cracked shell is the second finished thing.
TONE: this is the whitest page and the fewest lines. Resist adding anything back.
```

### p7 — 김이 걷히자

```
--- p7 - 김이 걷히자 ---
PAINT: 1 - the pan's base. And the two burnt eggs are #17140F, the only pure black in the whole book.
HATCH: back to full - 10-12 per hand's width on the pan and the forepaws, 4-6 on the room. The white of p5 and p6 is gone; the lines that stopped now run again. This recovery is the point of the page.
BASKET: out of frame.
CAMERA: close-up, high angle, straight down into the pan.
SUBJECT: top of frame, DadBadger lifting the pan by its handle with both forepaws, mouth open, ears pricked.
SETTING: the pan; two burnt eggs at its centre; one thin thread of smoke drawn as 3 broken lines. Nothing else. No writing on anything.
FINISH: DadBadger full; the two black eggs are the second finished thing and the darkest point in the book. Nothing else is allowed to go this dark.
TONE: the eggs read as black because everything around them is open line and paper.
```

### p8 — 냄새만 빼면 돼

```
--- p8 - 냄새만 빼면 돼 ---
PAINT: 2 - the stove mouth deep in the background, and the pot behind him (half-strength #E08A2C) which nobody is looking at.
HATCH: 10-12 on the father and the shutter; 4-6 on the room; the window opening is 0 marks, bare paper.
BASKET: on the table's far end, untouched, 3 red tomatoes still in it.
CAMERA: medium wide, eye level, the father near at the window and the stove deep behind him.
SUBJECT: left, DadBadger at the window pushing both shutter leaves outward with his forepaws, face to the outside, snout raised. Right, CubBadger on the chair, looking at his father's back.
SETTING: an open shutter; the evening outside as bare paper; deep in the frame the uncovered pot boiling with a wooden spoon beside it. No writing anywhere.
FINISH: DadBadger full; the boiling pot behind him is the second finished thing, even though he is not looking at it - give it the sharpest rim in the background.
TONE: the cool outside and the warm stove are told apart by hatch density, not by colour. Only the stove and pot rims hold colour.
```

### p9 — …면이었어

```
--- p9 - ...면이었어 ---
PAINT: 1 - the noodle lump on the spoon, half-strength #E08A2C inside its own outline (it hangs out of the pot's rim, so keep the colour tight to the lump).
HATCH: 12 on the raised spoon and the lump; 4-6 elsewhere; floor 0 marks.
BASKET: out of frame.
CAMERA: medium close-up, low angle, looking up at the raised lump.
SUBJECT: centre, DadBadger holding the wooden spoon up with both forepaws, shoulders sagging, mouth corners down. Lower right, CubBadger on the chair with his head tipped back, looking up at it.
SETTING: the spoon, the single lump of stuck noodles clinging to it, the tilted pot below. Nothing else.
FINISH: DadBadger full; the lump is the second finished thing - one closed outline, no strands drawn separately.
TONE: light from below is hatch density, not paint.
```

### p10 — 접시가 셋

```
--- p10 - 접시가 셋 ---
PAINT: 4 patches - soup (full #E08A2C), the noodle lump (half-strength #E08A2C), the two burnt eggs (#17140F) in the third plate, and the basket's 3 tomatoes (#D9452F). Every plate on the table is full, so every plate holds colour. Count them; the count is the page.
HATCH: 10-12 on the table top and both figures; 4-6 on the room; the wall behind has 0 marks.
BASKET: still on the table's far end, still untouched, tomatoes and loaf both in it.
CAMERA: wide, slightly high, the table top opened out.
SUBJECT: left, DadBadger dropped into a chair, dragging the apron hem up to his forehead, eyes half shut. Right, CubBadger with both forepaws on the table, looking along the three plates in turn.
SETTING: three plates in a row, all full; the basket beyond them; one low lamp. Nothing else. No writing on any object.
FINISH: CubBadger full; the row of three coloured plates is the second finished thing.
TONE: the lamp is not a painted glow - it is where the hatching thins over the table.
```

### p11 — 이건 요리도 아니야

```
--- p11 - 이건 요리도 아니야 ---
PAINT: 2 patches inside rims - the tomato half (#D9452F) and the bread on the plate (#E08A2C crust with an oil shine of the same colour, half strength). The oil bottle itself is not painted.
HATCH: 12 on the two forepaws and the plate rim; 4-6 elsewhere; the table surface has at most 6 lines.
BASKET: 🔴 EMPTY for the first time - it stands in the same spot on the table's far end with no colour inside it at all. The red that was in it is now on the plate.
CAMERA: close-up, high angle, only the father's forepaws and the plate.
SUBJECT: centre, DadBadger's two forepaws - one pressing a halved loaf flat onto the plate, the other rubbing a tomato half across it. Only his jawline clips the top corner; no expression is visible.
SETTING: one plate, the halved loaf, the tomato half, a tipped oil bottle with a spread of oil beside it. The oil bottle carries no writing.
FINISH: the two forepaws full; the tomato half is the second finished thing - the strongest red in the book so far.
TONE: shine on the wet bread is hatching left out, plus one flat half-strength patch inside the crust outline. No white highlight.
```

### p12 — 이거 더 없어요?

```
--- p12 - 이거 더 없어요? ---
PAINT: 3 patches - the three full plates behind (soup, noodles, black eggs). 🔴 The plate the cub is holding up has NO colour inside it at all: bare paper. That absence is the subject of the page.
HATCH: 12 on the cub's face and the held plate's rim; 4-6 on the room; the three plates behind are drawn at 6 so they sit back.
BASKET: empty, still on the far end.
CAMERA: medium, eye level, square to the cub.
SUBJECT: centre, CubBadger holding an empty plate up at face height with both forepaws, body pitched forward, eyes wide, mouth and snout marked with two small #E08A2C oil dabs - the only colour on his body, and the only colour anywhere outside a rim in this book (they are on him, so keep them to 2 dabs and no more). Left behind, DadBadger seated, head turned, eyebrows up.
SETTING: the three full plates behind; the table; the lamp. Nothing else. No writing anywhere.
FINISH: CubBadger full; the empty rim of the raised plate is the second finished thing - one clean closed line with nothing inside it.
TONE: the lit thing is the emptiest thing. Everything else keeps its hatching.
```

### p13 — 우물우물

```
--- p13 - 우물우물 ---
PAINT: 2 - the bread on the middle plate (#E08A2C) and one tomato stem end (#D9452F). The three full plates have been pushed off to the side and are cut by the frame edge, so their colour is only just in view.
HATCH: 10-12 on both figures; 4-6 on the room; the window outside is 0 marks, dark by density not by paint.
BASKET: empty, at the frame's edge.
CAMERA: wide two-shot, eye level, the table between them.
SUBJECT: left, DadBadger with a mouthful of bread, one cheek out, apron still on, shoulders loose. Right, CubBadger holding bread in both forepaws and biting hard, hind feet swinging under the chair. Both chewing.
SETTING: one plate between them with two pieces of bread left; a few tomato stem ends; the full plates shoved aside; one lamp above.
FINISH: CubBadger full; the plate between them is the second finished thing.
TONE: the ring of light on the table is hatching thinned to almost nothing, not a painted circle.
```

### p14 — 빵 접시만 반들반들

```
--- p14 - 빵 접시만 반들반들 ---
PAINT: 🔴 exactly 3 patches, and the count is the ending - soup (#E08A2C), noodles (half-strength #E08A2C) and the two burnt eggs (#17140F) are still as full as they were on p10. The fourth plate, the bread plate at the centre, has NO colour inside it: bare paper with 5 crumb dots and one #D9452F stem end lying on the rim.
HATCH: 12 on the four plate rims and the forepaws; 6 on the table boards; nothing else in frame.
BASKET: empty, out of frame or clipped at the edge.
CAMERA: close-up, straight down onto the table top.
SUBJECT: bottom of frame, one of CubBadger's forepaws, index finger pressing down on a crumb in the empty plate. Beside it, one of DadBadger's forepaws lying flat and relaxed on the table.
SETTING: four plates in one frame - three full, one empty. Nothing else on the table. No writing anywhere.
FINISH: the pressing finger full; the empty plate is the second finished thing, and it is the only unpainted rim in the frame.
TONE: the empty plate is the brightest thing on the page because it is the only one showing bare paper. Do not add a highlight, a sheen or a lamp reflection to say so.
```
