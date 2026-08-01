# 창작동화 1000 — f07 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/f07.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 2장 → ② 승인본을 `@image` 로 붙여 컷

## f07 §1. 앵커 배정

**권**: f07 「먹기 싫은 초록색」 · 오해와 반전 · 영국 텃밭 이랑 · 12쪽 · 4~6세
**클러스터**: **C1**(지지면이 그림이다) · 앵커 슬러그 `changjak-stamplift` **신규 민팅**
**한 줄**: 지지면이 곧 흙(갈색 거친 종이)이고, 그 위를 덮은 초록은 **같은 잎 도장 하나의 반복**이다. 도장이 걷혀 마지막에 지지면만 남는다.

🔴 **밭은 비울 수 없는 무대라 반복으로 비운다** — 같은 잎 도장·평행 이랑 세 줄은 꽉 찼는데 정보 0이다. **마감은 오소리와 그가 그 쪽에서 만지는 한 포기에만** 간다(`FINISHED THINGS PER PAGE = 2`). 도장 필드는 아무리 빽빽해도 마감으로 세지 않는다.

**형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 형제 | 갈리는 것 |
|---|---|
| **e01** | **드러나는 지지면이 밝나 어둡나 · 반대로 가는 것이 있나** — e01 은 밝은 것(밀가루 = 안 그린 크림 종이)이 자라고 화면에 반대로 가는 것이 없다. f07 은 **어두운 갈색 지지면**이 드러나고, 동시에 화면 뒤에서 **손으로 그린 색 더미**가 큰다 |
| **c05** | **반복 필드가 줄어드나 그대로인가** — c05 의 뒤 띠는 안 줄고 마감이 옮겨 간다. **필드가 줄어 0이 되는 권은 f07 하나뿐**이다. 그래서 f07 의 도장은 **초록**이다 |
| **a11** | a11 은 기와 도장이 고정이고 그 위의 눈만 는다 — f07 과 정확히 반대 방향 |
| **c12** | 둘 다 「지지면이 드러난다」지만 c12 의 지지면은 **아무것도 아닌 것**(안개)이고 f07 의 지지면은 **물건**(흙)이다. 방향도 반대 — c12 는 한 장에 한꺼번에 늘고 f07 은 열두 쪽에 걸쳐 준다 |
| **b01 · d15 · g08**(C1 형제) | 판지·두 장 종이·회벽 ↔ f07 은 **지지면이 흙이고, 그 위에 얹힌 것이 찍힌 것**이다 |

🔴 **점눈 금지**(전래동화 라인). 🔴 **울새는 말하지 않고 표정도 없다** — 진짜 새로 그린다. 얼굴을 사람처럼 만들면 「가르치는 어른」이 하나 생긴다.

**대본 SCENE 처방표** (습관어 대역 — 대본은 안 고치고 컷에서 분기한다)

| 대본 | 컷에서 |
|---|---|
| p1 「화면 위쪽 절반은 초록 이랑이 흐릿하게 줄만」 | 초점 흐림 아님 — **도장 프린트만, 손 마감 0** |
| p9 「주황·빨강·하양이 여럿, 초점 밖으로 흐리게」 | **윤곽선만, 안은 안 채움**(색은 얹되 형태를 완성하지 않는다) |
| p4 「흙이 후드득」 · p6 「벌어진 흙 틈」 | 흙알 **개수 상한**으로(질감 브러시 금지) |

---

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-stamplift

Style: picture book, ages 4-6. One place for all 12 pages: a small English
kitchen garden - three parallel ridges of earth and a wooden crate in the
corner. THE SUPPORT IS THE SOIL: the whole spread is coarse brown paper
#6B4A2E, and bare earth is simply that paper left alone, never painted. The
green on top of it is ONE hand-cut leaf stamp printed over and over. As the
book goes on the stamp is lifted away and the support comes back.

RENDERING (finish hierarchy)
FINISHED THINGS PER PAGE = 2 - the badger cub, plus the one plant his paws are
holding on that page. Nothing else is finished, and a printed field is never
counted as finish however full it looks.
THE STAMP: one leaf shape only, one green ink #4E7A32, printed in straight
parallel rows along the ridges. 0 shape variation, 0 veins, 0 highlights, 0
outline, 0 second green. The single plant being touched each page is the only
green thing drawn BY HAND, and it gets a painted stalk and root.
THE SUPPORT: bare earth = unpainted brown paper. Ridges = at most 3 long
parallel lines and nothing else - 0 clods, 0 stones, 0 weeds, 0 furrow
texture. Loose earth thrown in the air = at most 9 dark specks per page.
THE PILE is the one hand-painted mass in the book and it grows while the field
shrinks. It always sits BEHIND the cub, and up to p10 only its edge enters
frame. 0 stamp prints are used inside the pile.
Sky, hedge, house, fence, tools, other animals: 0 on every page.
DENSITY RATION = none. The stamp field is repetition, not density.

PALETTE
#6B4A2E soil brown (the support itself) . #4E7A32 leaf green (stamp ink only) .
#D2691E carrot orange . #EFE9DC turnip white. Accent = ROBIN RED #B23A2E,
used for exactly two things in the whole book - the robin's breast and the
beetroot - at most 3 red spots on any page and 0 red anywhere else.

CHARACTER DESIGN LANGUAGE
Anthropomorphism grade is SPLIT and must stay split. The badger cub is
bipedal, uses forepaws as hands, wears nothing, and has a face that can act.
The robin is a plain wild bird - four-toed, no hands, no clothes, no eyebrows,
no smile, no speech - and it acts only by where it perches. Cub's eyes = a
dark almond with a visible round iris and an upper lid line; never a plain
black dot. Robin's eye = a bead with one highlight.

CANVAS
16:9 double-page spread, full bleed to all four edges, no border, no caption
margin anywhere. No letters, no numbers, no signs, no lettering of any kind.

NOT (rendering only)
NOT airbrush, smooth gradients, glossy CG or photographic finish.
NOT wool fibre, needle-felt fuzz or visible stitching on any animal.
NOT plain dot eyes.
NOT hand-drawn leaves inside the stamp field - printed leaves stay printed.
```

---

## §3. 캐릭터 시트

### 시트 1 — Badger cub (새끼 오소리)

```
CHARACTER SHEET - Badger cub   (bake this FIRST)
Hand-painted over coarse brown paper, per STYLE ANCHOR changjak-stamplift.

FACE   Broad short muzzle. Coat white #EFE9DC with two black #2A241F stripes
running from the nose over each eye to the ear. Nose leather #3A322C. Eyes =
dark almond with a round iris and an upper lid line, set wide. Mouth = one
line, teeth show only when he strains. Cub cheeks, still round.
FUR    Body warm grey #8A8378, chest paler #B8B1A4, forearms and hind feet
dark #4A423A so that soil reads on them. Fur is flat shape, not hairs: at most
12 short edge strokes on the whole animal. From p4 onward his forepaws and
knees carry earth smudges of the support brown.
CLOTHES  None. 0 garments, 0 apron, 0 hat, 0 boots.
BUILD & SILHOUETTE  Small - head is 1/3 of total height. Stands on hind legs,
short thick legs, heavy low hips, stubby tail. Marker = he is always shorter
than the plant he is pulling.
REFERENCE SHEET  full-body front idle, 3/4 turn, BACK VIEW (he is seen from
behind on p3, p7, p10 - bake it), plus 3 face close-ups: sulky mouth-down
refusal, eyes-shut straining with teeth showing, mouth-open astonishment.
Plus 2 action poses: arm swung back over the shoulder throwing, and both
forepaws gripping a leaf base while the body leans back.
16:9 sheet, plain #EFE9DC field, no letters or numbers.
```

### 시트 2 — Robin (울새)

```
CHARACTER SHEET - Robin   (bake this FIRST)
Same medium as STYLE ANCHOR changjak-stamplift.

BIRD   A plain European robin, true to species, NOT anthropomorphic. Warm
brown-olive #7A6A4C back and cap, pale buff #DCD2BE belly, and the breast and
throat one clean patch of ROBIN RED #B23A2E - the book's only red besides the
beetroot. Thin dark beak, dark legs with four toes. Eye = a black bead with
one small highlight, nothing more.
FACE   0 eyebrows, 0 mouth line, 0 human expression, 0 blush, 0 smile. It
never speaks and never gestures.
BUILD & SILHOUETTE  Round body, upright stance, tail cocked slightly up. Small
enough that it stands on the cub's forearm without effort. Marker = the red
breast patch, which is what carries the clue across the book.
REFERENCE SHEET  side profile standing, 3/4 front, head-cocked pose, hopping
with both feet together, perched high on a mound looking down, and one close
crop of the red breast alone.
16:9 sheet, plain #EFE9DC field, no letters or numbers.
```

---

## §4. 쪽별 컷

### p1

```
--- p1 — 초록색은… 싫어 ---
ROWS: upper band only - 3 straight ridge lines carrying at most 30 printed
leaf shapes. Printed only, 0 hand finish, 0 veins.
PILE: not yet. 0 hand-painted heap on this page.
GAZE: the cub's eyes are down in the plate. He never looks behind him.
CAMERA: medium close-up, tipped down over the plate at a slight angle.
SUBJECT: lower right - the badger cub kneels at an upturned wooden crate,
poking through the plate with a fork, nose pushed close, eyes fixed on the
green only, mouth pulled down. Upper left - the robin stands on the crate
corner looking down at the plate, head level, no expression.
SETTING: the crate as a table, bare brown paper for ground, the printed ridges
across the top half.
FINISH: finished = cub + the plate (orange carrot pieces, yellow potato, green
peas). Crate and ground stay bare support. Bipedal cub, forepaws as hands, no
clothes; the robin is a plain wild bird. No letters, numbers or signs.
TONE: flat white midday light; only the three colours in the plate are sharp.
```

### p2

```
--- p2 — 초록은 싫어! ---
ROWS: at most 30 printed leaves in the upper band, unchanged from p1.
PILE: it begins - 5 hand-painted green peas scattered on the ground behind the
crate, at the frame edge, no roots visible yet.
GAZE: his face stays turned to the plate while his arm goes the other way.
Body and eyes point opposite ways.
CAMERA: medium, side view at eye level; the throwing arm crosses the spread.
SUBJECT: left - the cub leans forward over the crate and swings his right
forearm up over his shoulder, flinging a handful of green peas behind him
without turning. Upper left - the robin on the crate corner cocks its head.
SETTING: peas scattering through the air behind him; the plate still on the
crate.
FINISH: finished = cub + the peas in his paw. Peas in flight = at most 7.
Ground stays bare support. Bipedal cub, forepaws as hands, no clothes; the
robin is a plain wild bird. No letters, numbers or signs.
TONE: bright and light; the arc of the throwing arm is the only strong line.
```

### p3

```
--- p3 — 다 없애 버려야지 ---
ROWS: 🔴 THE FULLEST PAGE. 3 ridges printed end to end, at most 60 leaf prints
filling most of the spread. Still one stamp, 0 variation, 0 hand finish.
PILE: the same 5 peas, clipped at the bottom corner behind him.
GAZE: he stands on the crate craning FORWARD at the ridges; his back is to the
pile and the pile is cut off by the frame.
CAMERA: long shot from behind his shoulder, three-quarter rear, so we look at
the ridges with him. 🔴 This ridge is repeated at p12 in the opposite state.
SUBJECT: lower centre - the cub stands on the crate on both feet, neck
stretched out, one forepaw shading his brow. Back view (@sheet, back pose).
SETTING: three printed green ridges, the emptied plate, the crate.
FINISH: finished = cub only; there is nothing in his paws this page. The
ridges are print, not finish. Bipedal cub, forepaws as hands, no clothes. No
letters, numbers or signs.
TONE: green covers most of the spread in flat daylight.
```

### p4

```
--- p4 — 하나 없앴다! ---
ROWS: 3 ridges printed, at most 55 leaf prints, with ONE gap where the plant
in his paws has come out.
PILE: still 5 peas, out of frame or clipped at the very edge.
GAZE: eyes on the leaf he is gripping. Never behind.
CAMERA: medium, low angle from soil height looking up.
SUBJECT: centre - the cub grips the base of a green plant in both forepaws and
throws his weight backward, hind feet dug into the earth, tail out behind,
eyes shut, teeth showing with effort. Lower right - the robin pecks once at
the freshly turned earth, plain bird posture.
SETTING: the plant lifting, its root still in the soil and not yet visible;
loose earth in the air.
FINISH: finished = cub + THIS ONE PLANT, which is hand-painted with a stalk
and a root, unlike every printed leaf around it. Flying earth = at most 9
specks. Bipedal cub, forepaws as hands, no clothes; the robin is a plain wild
bird. No letters, numbers or signs.
TONE: strong upward light on the effort.
```

### p5

```
--- p5 — 초록은 싫어! ---
ROWS: ridge 1 now shows 6 empty gaps; at most 50 printed leaves left overall.
PILE: knee-high at the right edge of frame. 🔴 ONE ORANGE TIP #D2691E shows at
its base, poking out between leaves - it is behind the cub and he cannot see
it. Do not enlarge it, do not light it specially.
GAZE: he is already looking at the NEXT plant along the ridge while his arm
goes backward.
CAMERA: medium, side view at eye level, the pile base catching the right edge.
SUBJECT: left - the cub holds a plant by the leaf tips only and swings his arm
back over his shoulder. His eyes stay locked on the ridge ahead.
SETTING: the ridges to his left, the pile edge to his right.
FINISH: finished = cub + the plant in his paw (hand-painted, root hanging).
Bipedal cub, forepaws as hands, no clothes; the robin hops toward the pile on
two feet together, plain bird. No letters, numbers or signs.
TONE: light tipping toward late afternoon; the single orange tip is the only
colour break on the spread.
```

### p6

```
--- p6 — 이건 왜 이렇게 무거워! ---
ROWS: ridge 1 = 0 prints, bare support paper. Ridges 2 and 3 = at most 34
prints. The bare row is the wide dark band in the lower half.
PILE: out of frame this page.
GAZE: eyes squeezed shut, face toward the plant. Never behind.
CAMERA: close-up, slightly off frontal, so the straining face and both
forepaws are in one frame.
SUBJECT: centre - the cub hugs two big leaves under his arms, hips pushed
back, both hind feet braced, eyes shut tight, teeth bared with effort.
Lower right - the robin drives its beak into the freshly opened earth.
SETTING: a half-lifted plant, a split in the soil beside it, ridge lines.
FINISH: finished = cub + THIS ONE PLANT (hand-painted, thick stalk, root just
clearing the soil). The soil split = at most 3 lines. Bipedal cub, forepaws as
hands, no clothes; the robin is a plain wild bird. No letters, numbers or
signs.
TONE: deep shadow at the moment of effort.
```

### p7

```
--- p7 — 오소리 눈은 이랑 쪽에만 ---
ROWS: ridge 1 = 0 prints. Ridge 2 = at most 12. Ridge 3 = at most 18. The
bare support is now larger than the printed area on the left half.
PILE: right half of the spread, as tall as the cub. 🔴 At its flank, 1 RED
#B23A2E and 2 WHITE #EFE9DC show between the leaves. Outlines only, no
interior finish. He is turned away from all of it.
GAZE: 🔴 arm thrown back over his shoulder while his head is turned fully
toward the ridge. Body and eyes point in opposite directions - this posture is
the reason he never learns.
CAMERA: wide, frontal, a little above eye level, splitting the spread - cub
left, pile right.
SUBJECT: left - the cub mid-throw, head twisted away from the pile. One green
plant is in the air between them.
SETTING: ridges left, pile right, bare brown between.
FINISH: finished = cub + the plant leaving his paw. The pile is hand-painted
but unfinished - flat shapes, no modelling. Bipedal cub, forepaws as hands, no
clothes. No letters, numbers or signs.
TONE: slanted afternoon light falls on the pile's flank; that side sits one
step brighter.
```

### p8

```
--- p8 — 너까지만! ---
ROWS: ridges 1 and 2 = 0 prints, bare support. Ridge 3 = 0 prints and ONE
hand-painted plant left standing at its end. The stamp field is finished with
this page.
PILE: out of frame.
GAZE: eyes up at the leaf tip, nowhere else.
CAMERA: medium close-up, low angle, the leaf tip at the top of the frame.
SUBJECT: centre - the cub stands on the tips of his hind feet, both forepaws
stretched overhead, just catching the tip of the last leaf. His tail stands
straight and trembles.
SETTING: two already-brown ridges behind him, dug holes along them.
FINISH: finished = cub + THIS LAST PLANT. Dug holes = at most 8, each 1 line.
Bipedal cub, forepaws as hands, no clothes. No letters, numbers or signs.
TONE: the sun visibly lower and coming in from the side; light catches only
this last plant.
```

### p9

```
--- p9 — 봐, 초록이 하나도 없지! ---
ROWS: 0 printed leaves anywhere. Three bare brown ridges of support paper with
at most 3 lines each - this is the emptiest the field ever is before p12.
PILE: back right. 🔴 The robin now STANDS ON ITS FLANK. Orange, red and white
show between the leaves in several places, drawn as OUTLINE ONLY with no
interior fill - present, not yet readable.
GAZE: he faces down the ridge, chest out, back to the pile.
CAMERA: long shot from the end of the ridge, looking along it at a low eye
level.
SUBJECT: front left - the cub stands with legs apart, both earth-smeared
forepaws planted on his hips, chest pushed out, face down the row. Back right
- the robin on the pile flank.
SETTING: three brown rows and their dug holes; the pile behind on the right.
FINISH: finished = cub only. The pile stays outline. Bipedal cub, forepaws as
hands, no clothes; the robin is a plain wild bird, no expression. No letters,
numbers or signs.
TONE: yellowed low light; brown takes most of the spread.
```

### p10

```
--- p10 — 거긴 왜 가? ---
ROWS: 0 printed leaves. Bare ridges only.
PILE: still off frame to the right - only its outermost edge clips the corner.
🔴 Do not reveal it on this page; the turn must not be paid off yet.
GAZE: 🔴 THE TURN. His head goes first, eyes wide open, the shoulders only
starting to follow.
CAMERA: medium, from behind and to one side of the cub, three-quarter rear;
the pile is still outside the right edge.
SUBJECT: centre - the cub twists his upper body to the right, head already
round, both forepaws still held together mid-clap from knocking the soil off,
fingers spread. Upper right corner - the robin sits on top of the pile,
looking back at him.
SETTING: bare ridge lines, the pile edge just clipped.
FINISH: finished = cub + his two soil-covered forepaws. Bipedal cub, forepaws
as hands, no clothes; the robin is a plain wild bird. No letters, numbers or
signs.
TONE: turning toward evening; the direction of the turning body is the whole
page.
```

### p11

```
--- p11 — 이거… 내가 좋아하는 거잖아! ---
ROWS: out of frame - the ridges are behind the camera this page.
PILE: 🔴 FULL FRONT, the first and only time. At most 30 hand-painted green
leaves, and EVERY leaf ends in one root: orange carrot #D2691E, red beetroot
#B23A2E, white turnip #EFE9DC. Roots are painted flat with no modelling; only
the one he lifts is fully finished. Robin still on top, unmoved.
GAZE: up at the leaf held over his head. Nothing behind him now.
CAMERA: wide, facing the pile square on at eye level.
SUBJECT: lower centre - the cub raises one green plant in both forepaws above
his head and holds it in front of his eyes. A whole earth-covered orange
carrot hangs from its tip. His mouth is open.
SETTING: the pile fills the spread behind him; bare brown ground below.
FINISH: finished = cub + THE ONE PLANT HE LIFTS. The rest of the pile is flat
hand-painted shape, 0 modelling. Red spots on this page = at most 3
(robin's breast + beetroot). Bipedal cub, forepaws as hands, no clothes; the
robin is a plain wild bird. No letters, numbers or signs.
TONE: evening sun straight onto the pile - orange, red and white read as if
scattered over the green.
```

### p12

```
--- p12 — 여기 있었구나 ---
ROWS: 0 printed leaves, 0 green anywhere on the spread. Three brown ridges of
bare support paper with at most 3 lines each, and their dug holes. 🔴 Same
ridge as p3 in the opposite state - hold the same direction of view.
PILE: out of frame entirely.
GAZE: down the length of the ridge, far away.
CAMERA: wide long shot across the ridges at a low eye level.
SUBJECT: lower left, small in frame - the cub squats beside a ridge and dips
one hind toe into a dug hole, head turned to follow the row into the distance.
Right edge - the robin has come down onto the soil and looks the same way.
SETTING: brown ridges and dug holes, and nothing else at all. 0 pile, 0 crate,
0 plate, 0 tools.
FINISH: finished = cub + the hole his toe touches. Dug holes = at most 10.
Bipedal cub, forepaws as hands, no clothes; the robin is a plain wild bird. No
letters, numbers or signs.
TONE: long low evening light; the whole spread is brown and earth-coloured so
that the disappearance of the green reads at a glance.
```
