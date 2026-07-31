# 창작동화 1000 — F-10 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/f10.md`. 대본은 한 글자도 안 고쳤다.
> 🔴 실행 순서: ① 시트 2장 → ② 승인본을 @image 로 붙여 컷 13장

## F-10 §1. 앵커 배정

**권**: f10 「할아버지의 낮잠 지키기」 · 오해와 반전 · 포르투갈 집 안 한 칸 · **13쪽**
**클러스터**: **C4** (하드에지 평면 색면 · 음영 0)
**앵커 슬러그**: `changjak-lightshards` — **신규 민팅**(배정표 §3.6 이 f10↔b04 공유를 검토하고 기각했다: 반대인 것은 갈림축이지 공정이 아니고, 묶으면 이베리아 흰 벽 두 권이 같은 그림체로 선다)
**한 줄**: 그림자가 한 점도 없고, **바닥에 놓인 빛이 도형**이다. 소리원이 움직이면 그 빛이 작은 조각 여럿으로 부서지고, 고정되면 가장자리가 딱 선 큰 사각형 하나로 닫힌다.

### 🔴 형제 권과 갈린 축 (첫 렌더에서 세어진다)

**도형이 빛인가 그림자인가 · 조각이 몇 개인가.**

| | 갈림 |
|---|---|
| **b04** (C4, 스페인 흰 마을) | **그림자가 도형**이고 회벽은 **안 칠한 흰 종이**이며 계기판이 그림자 **길이** |
| **a09** | 어둠 도형이 빛에 **잘려 나간다**(면적이 준다) |
| **f10** | **빛이 도형이고 그림자가 0**, 회벽은 **칠한** 흰 회칠, 계기판은 **조각 개수**(18+3+1 → 1 → 18+3+1) |

- 🔴 **f02(델프트) 회피** — 코발트 굽도리를 타일 문법으로 그리지 마라. f10 의 코발트는 허리 높이를 지나는 **띠 하나**이고 무늬는 그 위 얇은 한 겹이다.
- 🔴 **b12(리스본 계단골목) 회피** — b12 의 파랑은 **둘째 지지면**, f10 의 파랑은 **띠 하나**. b12 는 야외, f10 은 실내이고 지지면이 하나다.
- 🔴 **h05 와 바닥의 노란 사각형이 겹친다** — h05 는 크기 불변, f10 은 **개수가 변한다**.
- 🔴 **e11(튕긴 획) · f06(연필 겹수) · f03(소리원만 마감) 회피** — 이 권은 **소리를 안 그린다.** 소리원이 빛에 하는 짓으로만 그린다.

### 대본 SCENE 처방표 (습관어·모순 → 컷 처리)

| 대본 | 컷에서 |
|---|---|
| p1·p2 「어른거린다 / 흔들린다」 | 매체에 흐림이 없다 → **조각 개수**로. `LIGHT:` 줄이 매 쪽 세어 준다 |
| p1 「그림자가 짧고 바닥에 반사광이 얕게 깔린다」 | 🔴 그림자 0. 대신 **빛 사각형의 세로 길이를 짧게**(한낮) |
| p2·p8·p12 「문자판이 빛에 하얗게 날린다」 | 날림·번짐 없음 → 문자판을 **화면 위로 자르거나** 순수 `#F2EFE6` **민무늬 판**으로. 숫자·바늘 0 |
| p3 「흔들의자가 흐릿하게」 | **마감을 안 준다**(윤곽 + 평칠, 안은 안 채움). 초점흐림 금지 |
| p6 「빛이 딱딱하게 굳는다」 | 조각 개수 **1**. 그 한 사각형의 네 변이 화면에서 가장 곧다 |
| p7 「빨간 띠에만 채도가 몰린다」 | 화면의 다른 빨강 **0** — 이 규칙은 열세 쪽 전부 |
| ⚠️ 대본 결함 없음 | 소리원 셋의 상태가 쪽마다 SCENE 에 다 적혀 있어 컷이 그대로 받아 적었다 |

---

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-lightshards

Style: picture book, ages 4-6. One ground-floor room of a Portuguese village house at midday, drawn only from inside; hard-edge flat colour planes, screenprint logic, shading = 0.

RENDERING (finish hierarchy)
Every form is a flat shape with a cut edge; colours meet, they never blend. THERE ARE NO SHADOWS - none cast, none under furniture, none under a body, none on a wall; a body meets the floor on a plain contact line. The drawn shape is the LIGHT: sunlight lying on the apricot floor is painted in the wall colour #F2EFE6, and nothing else in the room is that colour. Law of the book: a sound-maker that moves breaks its light into many small shards; a sound-maker that is fixed closes its light into one large rectangle with straight edges; when both openings are fixed the doorway patch and the window patch abut and read as one single rectangle. Finish hierarchy: (1) the puppy = full finish; (2) the one thing he touches on that page = half; (3) everything else = flat fill plus outline only. FINISHED THINGS PER PAGE = 2. Counts, every page: the room holds seven props and no others - tall case clock, bead curtain, shutter, rocking chair, low stool, woven mat, iron wall hook; wall = 0 cracks, 0 stains, 0 pictures; floor tile grid = at most 14 ruled lines; azulejo dado = at most 6 repeated motifs of 4 strokes each; wisteria past the doorway = at most 9 leaf shapes; bead curtain = at most 12 strands, each strand at most 9 beads. DENSITY RATION = none - no page is crowded, all 13 pages hold the same seven props in the same places.

PALETTE
#F2EFE6 lime-washed wall AND every patch of floor light (same colour, that is the point) · #2B4E8C cobalt azulejo dado, one waist-high band, its motif is one thin layer on top of it · #C98F6A faded apricot terracotta floor · #C0342B the band of the straw hat, the only saturated red in the book - 0 other reds on any page. Support colours, used nowhere else: #7C8A5C wisteria beyond the door, #B08A4E brass pendulum. Outline and the puppy's curly coat = #1E1C1A, a line colour, not a fifth field.

CHARACTER DESIGN LANGUAGE
Two dogs, both bipedal on all 13 pages, forepaws used as hands, simple clothes. Faces stay dog: drop ears, black nose, muzzle; no human hair, no human nose, no shoes. Eyes = one flat almond of #F2EFE6 with a flat black disc, no highlight dot, no lashes. No blush, no sweat drops, no motion lines, no speech balloons, no expression marks.

CANVAS
16:9 double-page spread, full bleed, illustration to all four edges, no border, no caption band, no quiet strip reserved at any edge. No letters, numbers, clock numerals, clock hands, signage or writing anywhere in the picture.

NOT (rendering only)
1 no shadow of any kind, cast or contact or ambient.
2 no gradient, glow, blur, airbrush or soft edge - one shape, one flat colour.
3 no cel-shaded, 3D-rendered, photographic or brush-textured surface.
4 no wool, felt, stitching or fibre edge; fur = flat shape, 0 individual hairs.
```

---

## §3. 캐릭터 시트 (먼저 굽는다)

### 시트 1 — Puppy

```
CHARACTER SHEET - Puppy   (bake this FIRST)
Medium: hard-edge flat colour, shading 0, outline #1E1C1A, no shadow anywhere.

FACE: young dog, round skull, short blunt muzzle, black nose #1E1C1A. Two drop ears that fall to the jawline; one ear lifts forward when he listens. Eyes = flat almond of #F2EFE6 with a black disc, wide open on 11 of 13 pages. Mouth = one ink line, opens as a plain rounded shape when he calls.
COAT: tight curly black #1E1C1A over the whole body; the curl is read as a scalloped silhouette edge, at most 14 scallops around the head and shoulders. 0 individual hairs, 0 fur strokes inside the shape - the body is one solid black field.
CLOTHES: sand shorts #D8C6A4 with two cobalt #2B4E8C shoulder straps crossing at the back; 3 flat shapes total, no pockets, no buttons, no pattern, no shoes.
BUILD & SILHOUETTE: half the grandfather's height; head is 1/4 of body height; barefoot webless dog paws used as hands, 4 fingers, no claws drawn. Tail = one tapered black shape, always visible outside the body silhouette. Instantly told from the grandfather by size, by the two straps, and by the absence of a hat.
POSTURES (cuts call these by number):
 1 SHUSH - one forepaw with a single finger pressed hard on the lips, cheek dented, one eye squeezed shut, other arm out.
 2 REACH - up on hind toes, both arms straight overhead, belly showing, tail swung sideways for balance.
 3 SIT - on the mat, hind legs forward, both forepaws laid flat on the knees, back straight, chin lifted.
 4 WIDE - standing, both arms flung out sideways, palms up, head tipped back.
 5 PULL - two forepaws gripping a cord, whole body arched backwards, hind feet skidding forward.
 6 LEAN - sitting at someone's feet, back and nape resting against a leg, forepaws loose on the belly.
REFERENCE SHEET: full-body front idle, 3/4 turn, back view, plus three head close-ups - calling wide-mouthed, shushing with the finger, half-lidded sleepy. Flat cream ground, no scenery, no shadow, no text.
```

### 시트 2 — Grandfather dog

```
CHARACTER SHEET - Grandfather   (bake this FIRST)
Medium: hard-edge flat colour, shading 0, outline #1E1C1A, no shadow anywhere.

FACE: old dog, long muzzle, heavy drop ears reaching past the jaw. Coat #6E635A warm dark grey-brown; the muzzle ring, brows and chin are #EDE8DC white, a clearly drawn white mask around the mouth that no other character has. Eyes = flat almond of #F2EFE6 with a black disc; closed = one ink arc, half-lidded = the almond cut in half by a straight lid line.
CLOTHES: worn open vest #A9A08C, 4 flat shapes, no buttons, no pattern. STRAW HAT: shallow flat dome #E0C98A with a wide brim, one band of #C0342B around the crown - that band is the only saturated red in the whole book. The hat reads at the same size whether on the face or on the knees.
BUILD & SILHOUETTE: twice the puppy's height, heavy shoulders, thick forearms, belly rounded; sits sunk into the chair on 11 of 13 pages. Told from the puppy at a glance by the white muzzle mask, the vest, and the hat.
POSTURES:
 1 ASLEEP - sunk deep in the rocking chair, both forepaws folded on the belly, hind feet slack on the floor, shoulders collapsed into the backrest.
 2 BOLT - pushed forward off the backrest, both eyes round and fully open, both forepaws braced on the armrests, shoulders up, ears thrown forward.
 3 SLUMP - easing back into the chair, eyes half-lidded, one forepaw hanging off the armrest, shoulders dropping.
 4 RE-HAT - one forepaw lifting the straw hat off the knees and tilting it back over the muzzle, eyes already shut.
REFERENCE SHEET: full-body seated 3/4 in a plain chair, full-body standing front, plus three head close-ups - hat over the face with only muzzle tip and white chin showing, eyes bolt open, eyes half-lidded. Flat cream ground, no scenery, no shadow, no text.
```

---

## §4. 쪽별 컷

### p1

```
--- p1 — 문간에서 발끝을 든다 ---
LIGHT: 18 small shards at the doorway (bead strands cut the light) + 3 wobbling strip pieces from the half-open window + 1 travelling brass lozenge near the clock = 22 flat #F2EFE6 shapes on the apricot floor. This exact count returns on p13.
THREE: clock RUNNING (brass pendulum tilted with a short arc) · curtain SWAYING (strands splayed apart) · shutter LOOSE (pushed inward, hinge gap open).
HAT: covering the whole face, only muzzle tip and white chin out - the size to remember.
CAMERA medium wide, eye level, the whole room and all three sound-makers in one frame; this is the base composition p13 returns to. / SUBJECT front left in the doorway, Puppy seen from behind and in profile, up on his hind toes, body tipped forward, both forepaws clasped at his chest, one ear lifted, mouth just open, whispering; far right Grandfather in POSTURE 1. / SETTING seven props only: case clock on the back wall, bead curtain in the left front doorway, shutter and iron hook on the left wall, rocking chair centre right, low stool beside it, woven mat on the floor. Beyond the doorway one flat bleached plane with 9 wisteria leaves, all leaning one way. / FINISH Puppy full; the doorway curtain half; all else flat fill and outline. NO SHADOW anywhere. No letters, numbers, dial numerals or hands - the clock dial is cropped above the top edge, only the pendulum shows through the glass door. Both dogs bipedal, forepaws as hands. / TONE outside plane is a full step brighter than the room; the room stays cool and flat; light rectangles are short and squat because the sun is high.
```

### p2

```
--- p2 — 이렇게 시끄러운데 ---
LIGHT: 18 + 3 + 1 = 22 shapes, unchanged from p1.
THREE: all three still going - pendulum arc to the right, strands knocking apart at the doorway, shutter hinge gap open at the upper left.
HAT: still covering the whole face.
CAMERA medium, low angle from below the puppy's shoulder, looking up; the three sound-makers hang at three different corners of the frame so the picture answers where the noise comes from. / SUBJECT centre, Puppy planted on the mat with both hind feet together, forepaws held slightly out from the body, body locked stiff, BOTH drop ears hauled straight up, head half turned toward the sound, brow gathered, mouth wide, shouting; tail rigid behind him. / SETTING back wall clock upper right, doorway curtain left, shutter upper left; the rocking chair and Grandfather small at the back right, POSTURE 1. Floor light shapes read at the bottom of the frame, small because the camera is low. / FINISH Puppy full; nothing else gets a second finish level - all flat fill and outline. NO SHADOW. Clock dial is a plain #F2EFE6 disc with 0 numerals, 0 hands, 0 marks. Both dogs bipedal, forepaws as hands. / TONE one small body ringed by three big things; only the three sound-makers carry a bright edge, every wall plane stays even.
```

### p3

```
--- p3 — 시계 추를 붙잡다 ---
LIGHT: 18 + 3 + 0 = 21 shapes. The brass lozenge is GONE, so the count drops by exactly one from p2 - the first thing the floor loses.
THREE: clock HELD (pendulum tilted to one side, 0 arc, a black forepaw closed around it) · curtain still swaying · shutter still loose.
HAT: slid down to the bridge of the nose.
CAMERA medium close-up, slight low angle; right of frame the Puppy up on the low stool with his forearm inside the clock case, left rear the rocking chair. / SUBJECT right, Puppy on the stool on hind toes, one arm stretched straight up into the open glass door with five fingers wrapped round the brass pendulum, the other forepaw in POSTURE 1 shush, cheek dented, one eye squeezed shut, one ear slid onto his shoulder. THE PENDULUM IS THE SIZE OF HIS FOREPAW - both are in the same plane here, so this is where that size is set. Left rear Grandfather POSTURE 1 but one toe on the armrest is lifted. / SETTING clock case with its glass door half open, wrist caught in the gap; at the far left edge a strip of still-swaying curtain and the open hinge gap - those two are still moving. / FINISH Puppy full; brass pendulum half; the rocking chair gets outline and flat fill only, no interior marks. NO SHADOW. Dial cropped above the frame, 0 numerals, 0 hands. Both dogs bipedal. / TONE the brass is the only warm accent in the frame and a black paw closes over it.
```

### p4

```
--- p4 — 구슬발을 걷어 묶다 ---
LIGHT: the cleared half of the doorway throws 1 LARGE hard-edged rectangle across the floor; 9 small shards remain under the strands still hanging; window 3; brass 0 = 13 shapes. The count is falling and one big shape has appeared.
THREE: clock STOPPED (pendulum tilted, 0 arc) · curtain HALF GATHERED (bundled to one side, a cord going round it, the lower doorway wide open) · shutter still loose.
HAT: pushed onto one ear, half the face uncovered, head rolled sideways, one hind foot down on the floor.
CAMERA medium, eye level; left of frame the doorway and the Puppy, right rear the rocking chair. / SUBJECT left, Puppy pressed against the door jamb, both forepaws hugging a whole armful of bead strands swept sideways, chin clamped down on the bundle, one finger looping the cord, shoulders hiked, back arched away, one hind foot on the threshold, cheek squashed by the strands, mouth open sideways shouting; the free forepaw touches his lips in the POSTURE 1 shape. THE HANGING CURTAIN IS TWICE HIS HEIGHT - same plane, so measured here. Right rear Grandfather POSTURE 1, head rolled aside. / SETTING beyond the door the flat bleached plane and 9 wisteria leaves STILL LEANING ONE WAY - the wind never stops. Back wall pendulum tilted and frozen; upper left hinge gap still open. / FINISH Puppy full; the bundled curtain half; all else flat. NO SHADOW. No letters or numbers. Both dogs bipedal. / TONE the left third of the picture is taken by that one big pale rectangle - he shut something and the room got brighter; his black scalloped silhouette sits on it.
```

### p5

```
--- p5 — 덧문을 고리에 걸다 ---
LIGHT: 2 shapes only - the doorway rectangle, and the window patch snapping straight as the hook goes on. No shards left anywhere. The two rectangles are about to meet.
THREE: clock STOPPED · curtain TIED (one bundle at the left jamb, cord wound round it) · shutter BEING HOOKED (flat against the wall, hinge gap closing to 0).
HAT: ridden up above the brow, one eye uncovered, shoulders twitching so the rocking chair tips.
CAMERA medium, low angle; right of frame the Puppy stretched up, upper left the window and shutter large. / SUBJECT right, Puppy on hind toes stretched to full length, one forepaw pressing the shutter edge to the wall, the other threading the iron hook onto the shutter catch, both arms overhead, belly showing, tail curved out for balance, head tipped right back, tongue tip out, both ears laid back - POSTURE 2. / SETTING window plane beyond the shutter, white courtyard wall and wisteria, LEAVES STILL MOVING; at the right rear both the tied curtain and the stopped pendulum are visible in the same frame - all three go quiet on this page. Grandfather in the chair, hat above the brow. / FINISH Puppy full; the iron hook and catch half; all else flat fill and outline. NO SHADOW - the wall stays one even plane. No letters or numbers. Both dogs bipedal. / TONE the bright window rectangle is the biggest shape in the frame and a stretched black body lies across it; every edge in the picture is at its straightest here.
```

### p6

```
--- p6 — 다 지켰다 ---
LIGHT: 1 SHAPE. The doorway rectangle and the window rectangle now abut and read as one single large rectangle with four straight edges, the hardest edges in the book. 0 shards, 0 brass lozenge.
THREE: all three STOPPED - pendulum tilted and frozen, curtain tied in one bundle, shutter flat on its hook with no hinge gap.
HAT: balanced on the very edge of the forehead, about to fall.
CAMERA medium wide, eye level, the rocking chair centre with doorway and window both inside the frame, so a reader can count that all three have stopped. / SUBJECT centre front, Puppy in POSTURE 3 on the mat, eyes folded into happy crescents, mouth corners up, both ears hanging easy, only the tail tip a hair off the floor. Centre rear Grandfather POSTURE 1, the hat teetering on his brow and the shut eyelids trembling - IN THIS ROOM THAT TREMBLE IS THE ONLY THING MOVING. / SETTING seven props, all still; the rocking chair itself is stopped. BUT past the open doorway the 9 wisteria leaves still lean and the courtyard plane is unchanged - the wind did not stop, only the sound did. / FINISH Puppy full; Grandfather's hat half; all else flat fill and outline. NO SHADOW. Dial cropped above the frame edge, 0 numerals, 0 hands. Both dogs bipedal, forepaws as hands. / TONE the room reads frozen and slightly wrong; the one pale rectangle is the flattest, hardest shape in the whole book, and only the leaves outside are loose.
```

### p7

```
--- p7 — 눈을 번쩍 떴어요 ---
LIGHT: still 1 single rectangle, its near corner running under the rocking chair. 0 shards.
THREE: all three still stopped.
HAT: FALLEN - upside down on the knees, its red band the only saturated red in the frame and the thing the eye goes to.
CAMERA medium close-up, slight low angle; upper frame Grandfather risen and sitting forward, lower front the Puppy's upturned face. / SUBJECT upper, Grandfather POSTURE 2 - off the backrest, both eyes round and fully open, forepaws braced on the armrests, shoulders up, white muzzle mask and drop ears thrown forward, mouth just open. The fallen hat on his knees is the same size that covered his whole face on p1. Lower front, Puppy still in POSTURE 3, frozen mid-pose, eyes huge, mouth slightly open, ears back, tail flat on the floor. / SETTING the three are still stopped - tilted pendulum, tied bundle, hooked shutter; the rocking chair tipped forward on its rockers; through the doorway the leaves still lean. / FINISH Grandfather full; the hat and its band half; the Puppy flat except the face; all else flat fill. NO SHADOW - the chair meets the floor on a plain contact line. No letters or numbers, dial out of frame. Both dogs bipedal. / TONE one big body pitched forward over one small body locked still; all the saturation in the picture sits in that red band.
```

### p8

```
--- p8 — 시계가 안 가는구나 ---
LIGHT: 1 rectangle; its far corner reaches the foot of the clock case, so the two gazes and the light land in the same place. 0 shards.
THREE: all three still stopped - and the stopped pendulum is what both dogs are looking at.
HAT: on the knees, one forepaw resting on it.
CAMERA medium wide, eye level, opened out left to right; the two bodies are apart and only their sightlines meet, at the clock on the back wall. / SUBJECT front left, Puppy up on his feet in POSTURE 4 - both arms flung wide, palms up, shoulders hiked, head tipped back, mouth wide, brow gathered, ears back, one hind foot stepped away. Right, Grandfather seated, one forepaw on the armrest, head turned back over his shoulder and up at the clock, eyes half-lidded, muzzle stretched sideways, the other forepaw on the hat. / SETTING back wall clock, brass pendulum tilted and frozen inside the glass door - both sightlines end here. Tied curtain and hooked shutter unchanged; leaves still leaning past the door; red band on the knees. / FINISH Puppy full; the stopped pendulum half; all else flat fill and outline. NO SHADOW. THE DIAL IS A PLAIN #F2EFE6 DISC - 0 numerals, 0 hands, 0 marks - or cropped by the frame. Both dogs bipedal. / TONE the picture points at the answer before the child has it; the only bright accent near the clock is the frozen brass.
```

### p9

```
--- p9 — 추를 톡 밀다 ---
LIGHT: 1 rectangle + 1 brass lozenge = 2 shapes. The travelling lozenge is BACK for the first time since p3; the floor count has gone up by one.
THREE: clock RUNNING AGAIN (pendulum swung past centre with a short arc) · curtain still tied · shutter still hooked.
HAT: on the knees under one hanging forepaw.
CAMERA medium close-up, eye level; left the Puppy on the stool with his paw in the case, right rear the rocking chair. This is p3's place with the hand reversed - holding then, pushing now. / SUBJECT left, Puppy on the stool, ONE finger extended, its tip just touching the brass pendulum and pushing it sideways, arm straight out, body leaning to the clock, head twisted to look back over his shoulder, eyes round, one ear swung that way, the other forepaw gripping the glass door edge. THE PENDULUM IS THE SIZE OF HIS FOREPAW - same plane, measured again. Right rear Grandfather POSTURE 3, both eyes sliding half shut, shoulders dropping. / SETTING short pendulum arc; glass door half open; at the right edge the still-tied curtain and still-hooked shutter. / FINISH Puppy full; the brass pendulum half; all else flat. NO SHADOW. Dial cropped, 0 numerals, 0 hands. Both dogs bipedal. / TONE the returned brass lozenge and the closing eyelids sit in one frame at the same height - the child sees this with his own eyes.
```

### p10

```
--- p10 — 앞발이 입에서 뚝 떨어진다 ---
LIGHT: 1 rectangle + 1 brass lozenge = 2 shapes, and the widest, brightest part of the rectangle lies exactly between the falling paw and the mouth.
THREE: clock RUNNING · curtain still tied · shutter still hooked - the remaining two sit together at the left of the frame so the next job is readable.
HAT: on the knees.
CAMERA medium close-up, slight low angle; centre frame the Puppy down off the stool, upper body large; right rear Grandfather nearly asleep. The gap between paw and mouth is dead centre. / SUBJECT centre, Puppy on both hind feet leaning forward, THE FOREPAW THAT WAS PRESSED TO HIS LIPS NOW DROPPING AWAY, a hand's width of clear air between fingers and mouth, the hand still holding the single-finger shush shape; the other arm thrown out toward the doorway; mouth wide shouting, eyes bright and round, both ears up, tail swung wide behind. Right rear Grandfather POSTURE 3, eyes nearly shut, one forepaw hanging, mouth just open. / SETTING pendulum swinging with an arc; tied curtain and hooked shutter both visible at the left; red band on the knees; leaves leaning past the door. / FINISH Puppy full; the dropping forepaw half; all else flat fill and outline. NO SHADOW. No letters or numbers, dial out of frame. Both dogs bipedal. / TONE the brightest part of the picture is the gap he just opened between his hand and his mouth; the sleeping side goes soft only in the sense of fewer marks.
```

### p11

```
--- p11 — 구슬발을 확 잡아당기다 ---
LIGHT: the doorway shatters back into 18 small shards; the window rectangle (1) and the brass lozenge (1) remain = 20 shapes. The count is climbing back.
THREE: clock RUNNING · curtain RELEASED (strands pouring down the whole doorway, knocking apart) · shutter still hooked, the last one left.
HAT: on the knees.
CAMERA medium, eye level; left the doorway with the Puppy hauling on the cord, right rear the rocking chair. / SUBJECT left, Puppy in POSTURE 5 in front of the jamb - both forepaws on the cord end, whole body arched backwards, both hind feet skidding forward onto the threshold, tail up, head thrown back to watch the strands come down, mouth wide, eyes folded into laughing crescents, both ears flying up. THE RELEASED CURTAIN IS TWICE HIS HEIGHT - same plane, measured again. Right rear Grandfather asleep, shoulders sinking, head tilted so the cheek presses the backrest. / SETTING bead strands filling the doorway top to bottom, splayed apart where they knock; the loose cord in his paws; beyond, the courtyard plane and the leaning leaves; back wall pendulum swinging; upper left the shutter STILL on its hook - one to go. / FINISH Puppy full; the falling strands half; all else flat. NO SHADOW. No letters or numbers. Both dogs bipedal. / TONE the left of the frame is a vertical run of strands with the outside brightness broken small between them - what was shut coming out all at once.
```

### p12

```
--- p12 — 고리를 벗기고, 모자를 도로 덮는다 ---
LIGHT: 18 shards + the window patch broken back into 3 wobbling pieces + 1 brass lozenge = 22 shapes. The p1 count is back.
THREE: clock RUNNING · curtain HANGING AND SWAYING · shutter UNHOOKED (pushed inward, hinge gap open again).
HAT: being lifted back - held in one forepaw, tilted in front of the muzzle on its way over the face, the red band across the middle of the frame's right half.
CAMERA medium wide, eye level; left the Puppy at the window, right the rocking chair, each body doing its own job in one frame. / SUBJECT left, Puppy on hind toes, one forepaw flicking the iron hook up off the catch so the hook dangles from his fingertips, the other flat on the wall, body tipped to the wall, head thrown back, mouth open laughing, one ear flipped back. Right, Grandfather POSTURE 4 - one forepaw carrying the straw hat up off his knees and tilting it back over the muzzle, eyes already shut, other forepaw on his belly, shoulders fully collapsed. / SETTING the freed shutter swinging inward with the hinge gap open; past the window the white courtyard wall and moving wisteria; back wall pendulum swinging and the doorway strands hanging loose - all three are back on this page; the loose cord left dangling on the jamb. / FINISH Puppy full; the iron hook half; all else flat fill and outline. NO SHADOW. Dial cropped or a plain disc, 0 numerals, 0 hands. Both dogs bipedal. / TONE what was opened on the left carries across the frame and lands on the hat at the right; both bodies lean the way weight falls.
```

### p13

```
--- p13 — 집이 도로 시끄러워요 ---
LIGHT: 18 + 3 + 1 = 22 shapes, the exact count and the exact places of p1.
THREE: all three MOVING, in the same three corners as p1 - pendulum swung wide with its arc, doorway strands splayed by the wind, shutter pushed inward with the hinge gap open. Give the three equal weight; none of them is bigger than the others.
HAT: covering the whole face again, only muzzle tip out.
CAMERA medium wide, eye level, the same composition as p1 - the whole room and all three sound-makers in one frame. The single difference is where the Puppy is: not standing in the doorway but sitting at the foot of the chair. / SUBJECT centre right, Puppy in POSTURE 6 on the mat at the chair's foot, back and nape against Grandfather's leg, forepaws loose on his belly, hind legs stretched out, shoulders down, eyes half shut, mouth just open whispering, both ears easy, tail laid out long on the floor. Above him Grandfather POSTURE 1, hat over the face, both forepaws folded on his belly, chest high. / SETTING the same seven props in the same places; cord dangling on the jamb; stool still under the clock; leaves leaning past the open door. / FINISH the two leaning bodies full; everything else, including all three sound-makers, flat fill and outline - THEY ARE THE SUBJECT OF THIS PAGE, so keep them equal and unfinished. NO SHADOW. Dial cropped above the frame, 0 numerals, 0 hands. Both dogs bipedal. / TONE afternoon: the light rectangles are longer and lower on the floor than on p1 and the whole room is a step warmer; noisiest page, easiest page.
```
