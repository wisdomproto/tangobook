# 창작동화 1000 — H-01 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/h01.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## H-01 §1. 앵커 배정

**권**: h01 「빵이 부푸는 동안」 · 관찰과 성장 · 프랑스 빵집 창가 반죽대 한 칸 · 12쪽 · 4~6세
**클러스터**: C4 · **슬러그**: `changjak-gridshade` (신규 민팅)
**한 줄**: 직교하는 두 방향의 줄로만 화면을 짜고(그릇 파란 줄=세로 자 / 상판 이음매=가로 자 / 체크 행주), 그림자는 그 위를 지나는 **반투명 한 겹**이다.

**형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | h01 의 값 |
|---|---|---|
| C4 b04 `changjak-b04` | **그림자 밑이 비치나** | b04 = 불투명 짙은 닫힌 도형, 밑이 안 보인다 · **h01 = 반투명 띠, 밑의 이음매와 밀가루가 그대로 비친다** |
| C4 b19 `twofields` | 같은 축 | b19 = 불투명 필드가 화면 절반 · **h01 = 비치는 띠 하나, 닫힌 형태 0** |
| C4 f02 `delft` (둘 다 코발트) | **코발트가 화면의 몇 %인가** | f02 = 화면 전체가 코발트 평칠 · **h01 = 그릇 안쪽 줄 딱 한 줄**, 다른 데엔 코발트 0 |
| C1 e01 `drypaper` (같은 프랑스 빵집) | **흰 것에 면적이 있나** | e01 = 흰 밀가루가 화면을 잡아먹는다 · **h01 = 밀가루는 안 날리고 상판에 눌린 앞발 자국 하나로만 남는다** |

**대본 SCENE 처방표**

| 대본 문구 | 컷에서 옮기는 법 |
|---|---|
| p1·p12 「그 밖은 비운다」 | 상판 위 물건 **정확히 4개**(그릇·행주·밀가루 자국·반죽), 그 외 0 |
| p4 「경계가 칼같이 또렷하게」 | 반투명이되 **가장자리는 하드에지** — 흐림 0, 페더링 0 |
| p11 「곡선만 살짝 반짝인다」 | 하이라이트 = 크림색 **평면 한 조각**, 그라데이션 0 |

**밀도**: 사건이 파란 줄 위 손가락 하나라 열두 쪽 전부 `FINISHED THINGS PER PAGE = 2` · `DENSITY RATION = none`.
**카메라 잠금**: 🔴 **p2 · p6 · p9 는 같은 각도 · 같은 거리**다. 세 컷에 카메라 값을 문자 그대로 똑같이 적어 두었다 — 바꾸지 마라. 달라지는 것은 손가락 높이 하나뿐이다.

---

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-gridshade

Style: picture book for ages 4-6. One bay of a French bakery bench by the window,
one morning. Hard-edged flat colour, and the whole picture is built out of ruled
lines running in exactly two directions - vertical and horizontal - crossed by a
single translucent shadow band.

RENDERING (finish hierarchy): all shapes flat, hard-edged, 0 modelling,
0 gradient, 0 texture. The two rules of the book:
VERTICAL RULE = ONE cobalt line painted inside the bowl. HORIZONTAL RULE = exactly
3 bench-top seams, evenly spaced, running left to right across the bench. The red
check cloth carries 5 bands each way and no more. Nothing else in the book is a
line.
SHADOW: the window-bar shadow is a TRANSLUCENT band, one flat darker wash laid
over what is already there - the seams, the flour and the paw print stay fully
visible through it. Its long edges are hard-edged with 0 feathering, but it has
0 closed shapes, 0 corners, 0 detached patches: one band crossing the frame and
nothing else. Everything the bakery would contain but the script does not name is
left out: 0 shelves, 0 baskets, 0 tools, 0 loaves on racks, 0 wall texture.
Fur = 0 strokes. Faces = at most 4 marks. FINISHED THINGS PER PAGE = 2 (the badger
cub + the one thing being measured on that page). DENSITY RATION = none.

PALETTE: cream #F4F1E8 (bench, bowl, flour, apron - the dominant surface) /
cobalt #2A57A0 (ONE line inside the bowl, and nowhere else in the book - 0 cobalt
on cloth, walls, window or floor) / check red #B33A32 (the cloth only) / iron
black #17181A (the oven door). One colour is held back: oven orange #D9702B
appears on p12 only, and on no other spread.

CHARACTER DESIGN LANGUAGE: both animals bipedal, forepaws used as hands. The
badger cub wears nothing - plain fur, true badger face (2 white stripes nose to
ear, black eye patches). The bear baker wears a cream apron and nothing else;
HIS HEAD IS 1/6 OF HIS TOTAL HEIGHT so he reads as a grown-up, never as a larger
child. 0 shoes, 0 hats, 0 accessories on either. This grade holds all 12 spreads.

CANVAS: 16:9 double-page spread, horizontal. Keep the bottom 12% quiet for a
caption. NO letters, numbers, signs, price boards or lettering of any kind - the
bowl is plain but for its one cobalt line, the oven door carries no maker's mark.

NOT (rendering only): no opaque or closed-shape shadows; no airbrush, gradients,
gloss or 3D shading; no drawn wood grain or plaster texture; no second cobalt
anywhere.
```

---

## §3. 캐릭터 시트

### 시트 1 — Badger cub

```
CHARACTER SHEET - Badger cub   (bake this FIRST)
Flat hard-edged colour, 0 modelling - see anchor changjak-gridshade.

A small badger, bipedal, forepaws used as hands. Head = wedge, 2 white stripes
#F4F1E8 running from the nose over each eye to the ear, black eye patches
#2A2724 between them, small round black nose. Body = one flat grey-brown mass
#8A857C, low and round. Wears NOTHING - plain fur, 0 clothing, 0 apron, 0 shoes,
0 accessories. Front teeth = 2 small cream squares, shown only when the mouth
opens. 0 fur strokes, 0 whiskers.
Silhouette test: the small one, bare, with a wedge head striped down the middle;
he is only ever as tall as the bench top.
REFERENCE SHEET: (a) standing at a bench, both forepaws laid flat side by side on
the top, chin resting on them (b) one forepaw raised holding a cloth corner up,
the other forepaw's index finger extended and pressed flat against a vertical
surface - this is the pose of p2, p6 and p9 and the finger must be crisply
readable (c) up on the toes, body stretched tall, reaching (d) forepaw spread
wide and pressed down flat, all digits apart, seen from directly above.
Flat cream #F4F1E8 background. No text.
```

### 시트 2 — Bear baker

```
CHARACTER SHEET - Bear baker
Flat hard-edged colour, 0 modelling - see anchor changjak-gridshade.

A large brown bear, bipedal, forepaws used as hands. HEAD IS 1/6 OF TOTAL HEIGHT.
Body = one flat warm brown mass #7A5A44, broad shoulders, no neck. Wears a cream
apron #F4F1E8 covering the whole front, hem to the knee, 2 ties at the back.
0 hat, 0 shoes, 0 pockets, 0 buttons, 0 lettering on the apron. Ears = 2 small
half-circles. Eyes = 2 dots, brows = 2 short flat strokes that never angle into
anger. 0 fur strokes.
Silhouette test: a cream rectangle on a brown mass, twice the cub's height; he is
often only half in frame.
REFERENCE SHEET: (a) standing, both palms open and lowering a cloth (b) one hand
open, scattering flour, eyes on his own fingertips (c) both palms flat on the
bench rolling a long piece of dough, arms extended forward (d) one hand pulling a
heavy door wide open, body stepped aside out of the opening.
Flat cream background. No text.
```

### 시트 3 — The bowl (prop sheet)

```
PROP SHEET - The white bowl   (bake with the character sheets)
Flat hard-edged colour, 0 modelling - see anchor changjak-gridshade.

A plain white glazed earthenware bowl, wide-mouthed, straight-sided, no handles,
no foot ring, no pattern of any kind EXCEPT one cobalt band #2A57A0 painted round
the inside wall, a third of the way down from the rim - a single line, uniform
width, unbroken, and the only cobalt in the entire book. Outside wall = plain
cream #F4F1E8, 0 marks. The bowl is the instrument of this book: the dough's
height is only ever read against that one line.
REFERENCE SHEET: (a) the bowl seen from the side at eye level, empty, the cobalt
line visible through the mouth (b) the same view with dough well below the line
(c) the same view with the dough's top edge just under the line (d) the same view
with dough risen past the line so that the line is buried, and dough swelling in
a dome over the rim. All four at the identical size and angle so they can be
compared.
Flat cream background. No text.
```

---

## §4. 쪽별 컷

### p1

```
--- p1 — 덮는다 ---
RISE: not visible - the bowl is covered, and the cobalt line is not yet shown.
SHADOW: the translucent window-bar band lies on the window side of the bench,
short of the FIRST seam. This is its starting position.
OVEN: the black iron door at the far right of the frame, shut, one handle.

CAMERA: wide, eye level with the bench top (the cub's eye height).
SUBJECT: right rear - the bear baker in his cream apron, both palms open, lowering
the red check cloth onto the bowl, eyes on the bowl (sheet posture a). Left
foreground - the badger cub, both forepaws laid flat side by side on the bench,
chin resting on them, looking sideways up at the bowl.
SETTING: one bay of a French bakery bench under the window. The 3 bench seams run
left to right, evenly spaced. Bowl, cloth, and nothing else on the top.
FINISH: FINISHED THINGS = 2 (cub, bowl). 0 shelves, 0 baskets, 0 tools, 0 loaves.
TONE: low morning light from the window makes the left half of the bench lighter
as one flat area; the oven end is one flat darker area.
NO letters, numbers or signs anywhere - the bowl and the oven door carry no marks.
```

### p2

```
--- p2 — 저 아래 ---
RISE: the dough's top edge is well BELOW the cobalt line, with a clear gap, and
the cub's fingertip is on the outside wall at that same low height.
SHADOW: the translucent band is still on the window side, short of the first seam;
the seams show through it.
OVEN: the black door at the far right, shut.

CAMERA: 🔴 close-up, straight on the side of the bowl at eye level, bowl centred,
rim at the top third of the frame - identical framing to p6 and p9.
SUBJECT: centre - the cub with one forepaw lifting the corner of the check cloth
and the other forepaw's index finger pressed flat against the outside of the bowl
(sheet posture b), the fingertip far below the cobalt line. Right rear edge - only
the bear's apron hem and one elbow.
SETTING: bowl, cloth, the 3 seams, the shut black oven door at the right edge.
Nothing else.
FINISH: FINISHED THINGS = 2 (the finger, the cobalt line). The cobalt line is the
sharpest thing on the page.
TONE: morning light, flat.
NO letters, numbers or signs anywhere.
```

### p3

```
--- p3 — 앞발 자국 ---
RISE: not visible - the bowl is covered.
SHADOW: the translucent band has crept to just short of the FIRST seam; the seam
and the flour both read through it.
OVEN: the black door at the far right, shut.

CAMERA: medium, looking obliquely down on the bench top.
SUBJECT: rear - the bear with one hand open, scattering flour across the bench,
eyes on his own fingertips (sheet posture b). Foreground - the cub bent forward,
pressing one forepaw down flat into the white dust, all digits apart, eyes on his
own paw (sheet posture d).
SETTING: a thin flat film of flour on the bench and exactly ONE fresh paw print
in it - that print stays in the same place for the rest of the book. The covered
bowl, the 3 seams.
FINISH: FINISHED THINGS = 2 (the paw, the print). 🔴 The flour does not fly: 0
clouds, 0 airborne dust, 0 puffs. It is a flat film with one print in it.
TONE: the flour is the lightest flat area on the bench; everything else is left
plain.
NO letters, numbers or signs anywhere.
```

### p4

```
--- p4 — 첫째 이음매 ---
RISE: not visible - the bowl is covered.
SHADOW: the translucent band now lands exactly ON the FIRST seam and covers it -
and the seam is still visible straight through the band. Long edges hard, 0
feathering, 0 closed shapes.
OVEN: the black door at the far right, shut.

CAMERA: close-up, skimming just above the bench top, almost at surface level.
SUBJECT: left - the cub lying with his belly on the bench, one hind foot stretched
out so the toe tip rests on the shadow line, head turned toward that foot. Right,
far back - the bear standing with his back turned, out of focus of the story, one
flat shape.
SETTING: the 3 seams, the shadow band on the first of them, the flour with its one
paw print, the covered bowl.
FINISH: FINISHED THINGS = 2 (the toe, the shadow-on-seam). Where the band crosses
the flour, the flour reads through it as a lighter area, one step darker than
outside the band - never hidden.
TONE: the frame is half in the band and half out, and the boundary is knife-clean.
NO letters, numbers or signs anywhere.
```

### p5

```
--- p5 — 굴린다 ---
RISE: not visible - the bowl is covered.
SHADOW: the translucent band has moved past the first seam and sits between the
FIRST and SECOND; both seams read through or beside it.
OVEN: the black door at the far right, shut.

CAMERA: medium, straight on, both pairs of hands at the same height and the same
depth so the two doughs can be compared directly.
SUBJECT: right - the bear with both palms flat on the bench rolling a long thick
piece of dough, arms extended forward (sheet posture c). Left - the cub with both
forepaws together rolling a very thin thread of dough, glancing sideways at the
bear's hands.
SETTING: exactly 2 pieces of dough on the bench, one thick and one thread-thin.
The flour with its one paw print, the covered bowl, the 3 seams.
FINISH: FINISHED THINGS = 2 (the two doughs). Same depth plane so the thickness
difference is read from the picture, not inferred.
TONE: morning light falls flat and evenly across both pieces.
NO letters, numbers or signs anywhere.
```

### p6

```
--- p6 — 줄 바로 밑 ---
RISE: the dough's top edge is now JUST BENEATH the cobalt line, almost touching
it, and the cub's fingertip is on the outside wall at that height. Compared with
p2 the finger has moved up; nothing else in the frame has changed at all.
SHADOW: the translucent band sits short of the SECOND seam; the seams read through
it.
OVEN: the black door at the far right, shut.

CAMERA: 🔴 close-up, straight on the side of the bowl at eye level, bowl centred,
rim at the top third of the frame - identical framing to p2 and p9.
SUBJECT: centre - the cub up on his hind toes, body stretched tall, one forepaw
lifting the check cloth's corner and the other forepaw's index finger pressed flat
on the bowl just under the cobalt line (sheet postures b + c). Right rear edge -
only the bear's apron hem.
SETTING: bowl, lifted cloth corner, the 3 seams, the shut black oven door at the
right edge. Nothing else.
FINISH: FINISHED THINGS = 2 (the finger, the cobalt line).
TONE: 🔴 the same light and the same colours as p2 - the ONE thing that differs
between the two spreads is the height of the finger.
NO letters, numbers or signs anywhere.
```

### p7

```
--- p7 — 문은 나중에 ---
RISE: not visible - the bowl is behind, still covered.
SHADOW: the translucent band sits short of the SECOND seam, well back on the
window side of this frame.
OVEN: the black iron door fills the right of the frame, still SHUT, one handle -
the closest look at it before p12, and it must stay flatly, completely black.

CAMERA: medium, eye level, the right end of the bench and the oven door in one
frame.
SUBJECT: right - the bear touching the back of one hand lightly to the black iron
door, head tipped slightly. Lower centre - the cub up on his toes in place, both
forepaws gripping the bench edge, looking up at the door handle.
SETTING: the black oven door and its one handle, the THIRD seam at the right end
of the bench, the covered bowl further back. Nothing else.
FINISH: FINISHED THINGS = 2 (the bear's hand on the door, the cub looking up).
TONE: the oven end of the frame is one flat darker area and the light is still
only at the window end. 0 orange anywhere - that colour is held for p12.
NO letters, numbers or signs anywhere - the oven door carries no maker's mark.
```

### p8

```
--- p8 — 한 뼘 ---
RISE: not visible - the bowl clips the top edge of the frame, covered.
SHADOW: the translucent band has just crossed the SECOND seam and lies on the
oven side of it. Seen from straight above it lies perfectly flat across the bench,
and the seam beneath it is fully readable through it.
OVEN: the black door beyond the right edge; not in frame.

CAMERA: close-up, straight down on the bench top from above.
SUBJECT: centre - one of the cub's forepaws spread wide and pressed flat on the
bench, digits apart, spanning the gap between the SECOND and THIRD seams, his head
bent over it (sheet posture d). Top frame edge - only the hem of the bear's apron.
SETTING: the 3 seams, the shadow band just past the second, the flour with its one
paw print, the covered bowl at the top edge.
FINISH: FINISHED THINGS = 2 (the spread paw, the two seams it spans). The spread
paw and the seam gap are at the same depth so the span is read from the picture.
TONE: overhead light lays the band down flat; its long edges stay hard.
NO letters, numbers or signs anywhere.
```

### p9

```
--- p9 — 줄 위 ---
RISE: the dough's top edge is now ABOVE the cobalt line, so the line is partly
buried, and the cub's fingertip rests on the outside wall higher than the line.
The check cloth bulges upward at its centre.
SHADOW: the translucent band lies between the SECOND and THIRD seams.
OVEN: the black door at the far right, shut.

CAMERA: 🔴 close-up, straight on the side of the bowl at eye level, bowl centred,
rim at the top third of the frame - identical framing to p2 and p6.
SUBJECT: centre - the cub with one forepaw lifting the check cloth's corner and
the other forepaw's index finger pressed flat on the bowl above the cobalt line,
held still, eyes on his own fingertip (sheet posture b). Right rear edge - only
the bear's apron hem.
SETTING: bowl, the domed check cloth, the 3 seams, the shut black oven door at the
right edge. Nothing else.
FINISH: FINISHED THINGS = 2 (the finger, the cobalt line).
TONE: 🔴 the third time with the same light and the same colours as p2 and p6 -
only the finger has climbed.
NO letters, numbers or signs anywhere.
```

### p10

```
--- p10 — 그림자로 잰다 ---
RISE: not visible - the cloth is back down over the bowl, its centre domed.
SHADOW: the translucent band crosses the middle of the bench between the SECOND
and THIRD seams; both seams read through or beside it. This is the page where the
band becomes the instrument, so it must be the clearest thing on the bench.
OVEN: the black door at the far right, shut.

CAMERA: medium, from slightly behind and over the cub's shoulder so his line of
sight runs away along the bench.
SUBJECT: left foreground - the cub has taken his forepaw off the bowl and turned
his body to the right to sit facing along the bench, one forepaw pointing at the
THIRD seam, his eyes on the same place. Right rear - the bear at the far end of
the bench, turning to look back at him.
SETTING: the re-covered check cloth with its domed centre, the 3 seams and the
band between them, the shut black oven door at the right edge. Nothing else.
FINISH: FINISHED THINGS = 2 (the pointing forepaw, the third seam).
TONE: bright flat daylight; the band crosses the middle of the bench.
NO letters, numbers or signs anywhere.
```

### p11

```
--- p11 — 테 밖으로 ---
RISE: the dough has risen over the rim - the cobalt line is completely buried
beneath it, and the dough swells in a dome outside the bowl's edge (bowl sheet
view d). The instrument has been used up, and that is how the page reads.
SHADOW: the translucent band's edge lands exactly ON the THIRD seam, the last one.
The seam reads straight through it.
OVEN: the black door at the far right, shut - for the last time.

CAMERA: medium close-up, side on, with the bowl's rim line running across the
centre of the frame.
SUBJECT: centre - the cub with both forepaws sweeping the check cloth up and off,
arms spread wide, head over the bowl. Right - the bear's two hands coming in
toward the sides of the bowl, eyes on the dough.
SETTING: the bowl with dough over the rim, the lifted cloth, the 3 seams with the
band on the third, the shut black oven door at the right edge.
FINISH: FINISHED THINGS = 2 (the dough dome, the shadow on the third seam).
TONE: daylight sits on the back of the risen dough as ONE flat cream shape along
its curve - a single patch, 0 gradient, 0 gloss.
NO letters, numbers or signs anywhere.
```

### p12

```
--- p12 — 문이 열린다 ---
RISE: finished - the dough is over the rim, carried in the cub's arms.
SHADOW: 🔴 GONE. The window-bar band that has crossed the bench for eleven spreads
is not in this frame; the orange light has erased it. The 3 seams remain, with
flat orange lying across them instead.
OVEN: 🔴 the black iron door WIDE OPEN for the only time in the book, the firebox
behind it flat orange #D9702B - the only spread with this colour.

CAMERA: wide, from the same place as p1 with the camera turned a little toward
the oven, eye level with the bench top.
SUBJECT: right - the bear pulling the black door wide open with one hand, body
stepped aside clear of the opening (sheet posture d). Left foreground - the cub
hugging the white bowl of dough to his chest, looking at the open door.
SETTING: the open black door and flat orange firebox, the 3 seams now under flat
orange, the flour with its one paw print still in place, the check cloth fallen
on the floor.
FINISH: FINISHED THINGS = 2 (the cub with the bowl, the open door).
TONE: the first orange in the book, one flat area across the whole bench top,
leaving no shadow line anywhere on it.
NO letters, numbers or signs anywhere - the oven door carries no maker's mark.
```
