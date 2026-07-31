# 창작동화 1000 — E-03 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/e03.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## E-03 §1. 앵커 배정

**권**: e03 「이름이 너무 긴 개」 · 누적·반복 · 영국 시골 목장 앞마당(낮은 돌담이 빙 두른 한 마당) · 13쪽 · 4~6세
**클러스터**: C2 · **슬러그**: `changjak-grainstroke` (신규 민팅)
**한 줄**: **가는 마른 갈필 획**이 화면의 전부이고 윤곽선이 0이다. 획의 **방향**이 무대를 만든다 — 잔디는 선 획, 담은 눕힌 획, **개가 있던 자리는 한쪽으로 눌린 획**.

🔴 **형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | 판정 |
|---|---|---|
| **c01 · c23 · e11 · f01** (C2 넷) | **한 윤곽에 획이 몇 개인가** | c01 = 1(가는 니브) · c23 = 여럿(떨림) · e11 = 2~3(굵은 낙서) · f01 = 정확히 1(붓) · **e03 = 0** — 윤곽선을 안 그리고 결의 밀도로만 형태를 세운다 |
| **e07** `changjak-tautline`(같은 배치·같은 C2) | **획이 몇 개인가** | e07 = 화면당 정확히 1 · **e03 = 셀 수 없는 결** |
| **c02 · c60**(가까운 무대) | 카메라가 열렸나 갇혔나 | 저 둘은 열린 목초지 · **e03 은 낮은 돌담이 빙 두른 닫힌 마당이고 담이 모든 프레임에 있다** |

🔴 **이 권의 기계장치 = 주인공이 화면에 없다는 것.** 13쪽 중 7쪽에 개가 없다. 「없다」를 그릴 수단이 결이다 — **개가 있던 자리만 획의 방향이 다르다.** 개가 없는 쪽에서도 그 자리가 화면에서 유일하게 방향이 어긋난 데다.
🔴 **몸 차이가 매 쪽 보여야 한다** — 담 높이는 새끼 양의 어깨 높이다. 개는 한 번에 폴짝 넘고 양은 못 넘어 마당을 빙 돈다. **둘이 한 화면에 있으면 담을 그 사이에 둔다.**

**대본 SCENE 처방표** (대본은 안 고치고 컷에서 분기)

| 대본 문구 | 옮기는 법 |
|---|---|
| p6 「개의 몸은 어둠에 잠기고」 | 흐림이 없는 매체다 → **획 밀도를 3분의 1로 떨어뜨려** 지지면이 비쳐 나오게. 발 네 짝만 평칠 |
| p9 「눌린 풀 자국에만 반사광 한 줄」 | 반사광이 없다 → **그 한 줄만 획을 안 얹어** 맨 지지면으로 남긴다 |
| p11 「색을 줄이고」 | 획 수를 줄인다(같은 색, 밀도 절반) |
| p3 「빈 자리가 넓게 느껴지도록」 | 가운데 40% 를 **획 0** 으로 비운다 |

## E-03 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-grainstroke

Style: picture book for 4-6 year olds. A farmyard in the English countryside, ringed by a low drystone wall. Everything in the frame is made of thin dry-brush strokes on a warm oat board; the bristles skip, so the board shows through every mark. Nothing is outlined. Form comes only from how dense the strokes are and which way they run.

RENDERING (finish hierarchy)
Contour lines = 0. No form is enclosed by a line of any kind.
STROKE DIRECTION IS THE SET: grass = upright strokes; the drystone wall = strokes laid flat and horizontal; wet trodden earth = short broken horizontals; and any place where the dog has lain = strokes combed flat in one direction, all leaning the same way. That combed patch is the only place on the page whose direction disagrees with its surroundings.
Flat filled shapes per page = the dog's 4 black paws, and only when the dog is in frame. Everything else is broken grain. Add at most 4 eye marks, each smaller than a fingertip.
FINISHED THINGS PER PAGE = 2 - the lamb, and the one thing it is looking at or leaning into. DENSITY RATION = none.
Grass = one direction, 0 individual blades. Wall = 0 outlined stones; at most 7 laid strokes per stone course. Hay = at most 9 loose strands drawn separately, the rest is a mass of one direction. Apple tree = trunk plus 3 branch masses, 0 individual leaves.
The dog reads brighter and denser than the lamb: dog = dense #EFEBE1 grain, lamb = the same colour at half density so the board shows through.

PALETTE
#D8D2C4 the oat board, visible through every stroke and never painted over · #3E6B3C rain-wet grass · #9A968C drystone wall · #EFEBE1 the dog's white coat · #1E1C1A the dog's four black paws and the eye marks, the only flat-filled colour · #B3402C one apple, on p7 only.
Nothing else is red on any other page.

CHARACTER DESIGN LANGUAGE
Quadruped farm animals. No clothing, no collar, no held objects, no props. Bodies are built from grain running the way the coat runs: along the back, down the legs, out along the muzzle. Eye = one small flat #1E1C1A mark; there are no whisker lines, no eyebrows, no drawn mouth - an open mouth is a gap left free of strokes with a small #1E1C1A mark inside. The dog's four paws are the only surfaces finished as solid flat black, and they must stay readable at thumbnail size.

CANVAS
16:9 double-page spread. Keep the lower 12% quiet for a caption. No letters, numbers, signs or symbols anywhere in this book.

NOT (rendering only)
- 0 contour lines: no ink, pencil or brush outline around any form
- no smooth, blended, gradient, airbrushed or 3D-rendered surface - every mark is a dry broken stroke with board showing through
- no red anywhere except the single apple on p7
- no stitching, needle-felted wool or fibre texture
```

## E-03 §3. 캐릭터 시트

### 시트 1 — LambKid

```
CHARACTER SHEET - LambKid   (bake this FIRST)

Medium: STYLE ANCHOR changjak-grainstroke - thin dry-brush grain on oat board, 0 contour lines.

FACE
Narrow head, long straight muzzle, ears set sideways and hanging slightly below the line of the eyes. Eye = one small flat #1E1C1A mark, placed to the side of the head, not the front. Nostril = one shorter mark. Open mouth = a gap left free of strokes, round when calling, with one small dark mark inside. No eyebrows, no tongue, no teeth, no drawn smile.

FLEECE
#EFEBE1 grain at HALF the density used for the dog, so the oat board reads through it and the lamb looks cream rather than white. Strokes run in short curls over the shoulder and haunch, and straight down the four legs. 0 outlines anywhere. Face and legs carry sparser, straighter strokes than the body.

CLOTHES
None. No collar, no bell, no ribbon, nothing carried.

BUILD & SILHOUETTE
A young lamb, shoulder height equal to the drystone wall's top - this proportion must hold in every frame, because the wall is exactly what it cannot get over. Body a soft rectangle, legs thin and straight, knees knobbed, tail short. Neck can stretch forward and up when calling. Silhouette test against DogLongname: the lamb is boxy and pale with four thin sticks for legs; the dog is low, longer, and has four solid black feet.

REFERENCE SHEET
One oat field, figures floating, no ground, no shadow:
1) full body standing on four legs, side view
2) 3/4 view, chest swollen with a held breath, belly rounded
3) neck stretched forward and up, mouth wide open, one foreleg lifted
4) crouched low, belly nearly on the ground, one foreleg raised mid-creep
5) sitting down on the hind legs, head up
6) rear view walking away, one hind leg lifted
7) head close-up x2 - mouth shut in a straight line / mouth wide open calling
```

### 시트 2 — DogLongname

```
CHARACTER SHEET - DogLongname   (bake this FIRST)

Medium: STYLE ANCHOR changjak-grainstroke - thin dry-brush grain on oat board, 0 contour lines.

FACE
A working farm dog: long tapered muzzle, wide-set almond eyes, ears folded over at the tips. Eye = one small flat #1E1C1A mark. Tongue = a gap left free of strokes with no colour laid in, only when a cut asks for it. No eyebrows, no drawn smile.

COAT
Dense #EFEBE1 grain - twice the stroke density of the lamb, so the dog is the brightest thing in any frame he is in. Strokes run backward along the body, feather out under the chest and along the tail. 0 outlines.
THE FOUR PAWS: each foreleg and hind leg ends in a solid flat #1E1C1A fill from the ankle down. These four fills are the only flat-filled shapes in the book and are what his long name is about - keep their edges crisp and their size honest even in shadow. The tail tip carries the same flat black for the last third of its length.

CLOTHES
None. No collar, no tag, no rope.

BUILD & SILHOUETTE
Low and long, deep chest, light hindquarters, a plumed tail carried level. Standing, his back is a hand's width below the top of the wall - low enough to clear it in one hop. Silhouette test: four black feet plus a black tail tip on a bright body; identifiable from a single paw.

REFERENCE SHEET
One oat field, figures floating, no ground, no shadow:
1) full body sitting, side view, tail curled round the feet, tongue showing
2) standing alert, ears up, one hind leg lifted and turned away from the camera
3) mid-hop over a low wall, body stretched flat, all four black paws off the ground
4) sitting square on a high place, forepaws together, looking down
5) lying belly-down, chin resting on the forepaws, eyes rolled upward
6) tail alone - the last third flat black - and a separate close-up of one black forepaw
7) tail tip alone, cropped as it would appear over a wall top: a black finger-length mark and nothing else
```

## E-03 §4. 쪽별 컷

### p1 — 돌담이 빙 둘러싼 마당

```
--- p1 - 돌담이 빙 둘러싼 마당 ---
GRAIN: grass upright everywhere; the wall's strokes laid flat, running round three sides of the frame; the earth by the trough short broken horizontals.
DOG: in frame, sitting beside the lamb, all four black paws visible.
HOLLOW: at the far right corner under the wall, one small patch of grass combed flat in one direction - no hair, no dog, just the wrong direction. Do not point the camera at it.
CAMERA: wide, eye level, pulled back so the whole yard and the ring of wall fit the frame.
SUBJECT: LambKid at left front beside a wooden trough, standing four-square, chest swollen and belly round with a held breath, mouth shut, eyes to the side. DogLongname sits right beside him, haunches down, tongue showing, facing the lamb.
SETTING: 1 wooden trough, the drystone wall round the yard, one hay stack far right. Nothing else in the yard.
FINISH: LambKid full; DogLongname is the second finished thing (his four black paws carry it). Wall and grass stay raw grain.
TONE: cool wet morning - grass grain dense and dark, wall grain sparse and pale, board showing through both.
```

### p2 — 복슬복슬 까만양말 바람—

```
--- p2 - 복슬복슬 까만양말 바람— ---
GRAIN: grass upright; wall strokes laid flat across the back of the frame.
DOG: in frame and still whole - but already leaving: one hind leg lifted and turned toward the wall while the head still faces the lamb.
HOLLOW: out of frame this page.
CAMERA: medium, side on, both animals in one line at eye level.
SUBJECT: LambKid at left, neck stretched forward and up, mouth wide open in a round gap, one foreleg lifted off the ground - he is calling, mid-name, not finished. DogLongname at right, both ears pricked, face still to the lamb, one black hind paw already lifted and pointing at the wall.
SETTING: the trough, one course of wall behind. Nothing else.
FINISH: LambKid full; the dog's lifted black hind paw is the second finished thing - it is the page's whole joke.
TONE: morning light; stroke density rises around the open mouth and nowhere else.
```

### p3 — 물통 앞이 텅

```
--- p3 - 물통 앞이 텅 ---
GRAIN: grass upright; wall laid flat; the wet earth in front of the trough short broken horizontals - and the centre 40% of the frame carries 0 strokes, bare oat board.
DOG: gone. Only the last finger-length of his tail, flat black, above the wall top at the right.
HOLLOW: out of frame.
CAMERA: wide, very low angle, lens almost on the ground, the empty yard running back to the wall.
SUBJECT: LambKid at the left edge, still frozen mid-call with the mouth wide open, only the eyes swung right toward the wall.
SETTING: the trough with nothing beside it, wet earth, the wall across the back. Nothing else.
FINISH: LambKid full; the black tail tip on the wall is the second finished thing - the smallest mark on the page and the darkest.
TONE: the emptiness is made of bare board, not of pale paint. Leave it truly unpainted.
```

### p4 — 찾았다!

```
--- p4 - 찾았다! ---
GRAIN: hay strokes run diagonally, all one way; grass upright; the wall laid flat along the left.
DOG: in frame, sitting squarely on top of the hay stack, four black paws gathered under him.
HOLLOW: out of frame.
CAMERA: medium low, over the lamb's shoulder from behind, tilted up at the top of the stack.
SUBJECT: LambKid at lower front, pulled up short, head thrown back and mouth open, front legs braced. Behind him a line of his own hoofprints runs along the foot of the wall - short broken horizontal marks, at most 9 of them. DogLongname above, forepaws together, looking down.
SETTING: 1 hay stack, the wall along the left. Nothing else.
FINISH: LambKid full; DogLongname on the stack is the second finished thing. The hay stays one direction of raw grain.
TONE: bright above, denser darker grain below, so the eye climbs.
```

### p5 — 꼭대기가 텅

```
--- p5 - 꼭대기가 텅 ---
GRAIN: hay diagonal but broken open at the top where it has slid; grass upright; wall laid flat.
DOG: gone. 0 black paws in frame.
HOLLOW: at the lower right corner under the wall - the combed-flat patch, and lying on it one single black hair, a stroke the length of a fingernail. It is the second smallest mark on the page and nobody is looking at it.
CAMERA: wide, side on to the hay stack, eye level.
SUBJECT: LambKid at lower left, backing away with the neck thrown up and the mouth half open - the name cut off halfway.
SETTING: the collapsed hay stack, at most 9 loose strands falling through the air, the wall at the right. Nothing else.
FINISH: LambKid full; the falling hay is the second finished thing. The hollow and its hair are left at raw grain - visible, not pointed at.
TONE: light catches only the falling strands. Everything else drops half a step.
```

### p6 — 까만 발 네 짝

```
--- p6 - 까만 발 네 짝 ---
GRAIN: grass upright in the sun; inside the tree's shade the grain drops to a third of its density so the board reads through; the wall laid flat behind.
DOG: in frame but only as four black paws - his body is grain at a third density and the four flat black fills sit at the front of it, fully finished.
HOLLOW: out of frame.
CAMERA: low, lens on the ground, looking into the shade under the tree.
SUBJECT: LambKid at right, belly almost on the ground, one foreleg raised mid-creep, mouth shut in a straight line, eyes fixed left. DogLongname at left inside the shade.
SETTING: the apple tree's trunk and 3 branch masses, the edge of the shade as a change of stroke density (not a drawn line), the wall behind. 0 individual leaves.
FINISH: LambKid full; the four black paws are the second finished thing and the only crisp shapes inside the shade.
TONE: bright outside, thin inside. The shade is made by taking strokes away, never by adding grey.
```

### p7 — 사과 한 알만 툭

```
--- p7 - 사과 한 알만 툭 ---
GRAIN: shade grain at a third density; grass upright outside it; wall laid flat.
DOG: gone. 0 black paws, 0 tail.
HOLLOW: out of frame.
CAMERA: wide, eye level, the whole apple tree in frame.
SUBJECT: LambKid at right with both forelegs pushed forward into the shade, mouth still open and stuck that way. The shade floor is empty.
SETTING: the apple tree, the wall, and one apple - flat #B3402C, just landed and bouncing at the centre of the empty shade. This is the only red in the entire book.
FINISH: LambKid full; the apple is the second finished thing.
TONE: the shade floor stays the thinnest grain on the page so that the one red mark is the first thing seen.
```

### p8 — 어디에도 없어

```
--- p8 - 어디에도 없어 ---
GRAIN: grass upright over the whole yard; wall laid flat around three sides; three older places show their own leftover directions - the trodden earth by the trough, the diagonal slide of the hay, the thin shade under the tree.
DOG: gone. Nowhere in the frame.
HOLLOW: at the foot of the wall directly beneath the lamb, combed flat - he is sitting a body's length from it and does not look down.
CAMERA: wide, high angle looking down into the yard so all three places are in one frame.
SUBJECT: LambKid small at lower centre, dropped onto his haunches against the wall, head thrown back, mouth wide open calling.
SETTING: the empty trough, the collapsed hay, the apple tree - spread far apart. Nothing else in the yard.
FINISH: LambKid full; the three empty places share the second slot and are drawn only by their stroke direction.
TONE: flat noon - the grain is even everywhere, so the yard reads wide and the lamb small.
```

### p9 — 까만 털 한 뭉치

```
--- p9 - 까만 털 한 뭉치 ---
GRAIN: the combed patch fills the lower half of the frame, every stroke leaning the same way; the wall's bottom course laid flat behind; a few upright grass strokes at the edges.
DOG: gone.
HOLLOW: this is the page it is seen up close - a round patch of grass combed flat, with one line across it left completely free of strokes as bare board, and a tuft of black hair, at most 7 short marks, lying on it.
CAMERA: close-up, low, on the lamb's flank and the ground at his feet.
SUBJECT: LambKid's flank and shoulder across the top of the frame, ribs lifting, mouth slightly open to breathe, eye looking straight ahead - not down at his feet.
SETTING: the combed patch, the black tuft, the bottom stones of the wall. Nothing else.
FINISH: LambKid full; the combed patch is the second finished thing. The reader sees what the lamb does not.
TONE: cool inside the wall's shade; the one unstroked line is the brightest thing on the page because it is bare board.
```

### p10 — 그럼 나도 안 부르고 갈래

```
--- p10 - 그럼 나도 안 부르고 갈래 ---
GRAIN: grass upright; the wall laid flat straight across the frame; a horizontal band of denser grain along the wall's foot, running to the right edge.
DOG: gone.
HOLLOW: at the right end of that band, where the grain switches to combed - the destination.
CAMERA: medium, near-frontal, eye level, the lamb rising at centre.
SUBJECT: LambKid getting up, forelegs straightened first, hind legs still folded, mouth shut in one straight line, eyes following the band of shade to the right edge.
SETTING: one run of wall, the shade band. Nothing else.
FINISH: LambKid full; the shade band is the second finished thing - it crosses the page like a rule and the eye rides it right.
TONE: bright at the band's far end, denser grain at the near end.
```

### p11 — 아무 소리도 내지 않았어요

```
--- p11 - 아무 소리도 내지 않았어요 ---
GRAIN: half the stroke density of every other page - grass upright but sparse, wall laid flat but sparse, board reading through everywhere. The combed patch ahead is the only place at full density.
DOG: gone.
HOLLOW: ahead of the lamb, in the middle distance, its combed direction now clearly the odd one out.
CAMERA: long back-shot, low, following behind the lamb along the wall.
SUBJECT: LambKid from behind at centre, walking, one hind leg lifted, head straight forward, mouth shut. No open mouth anywhere on this page.
SETTING: the wall running away to the right, hoof marks pressing into wet grass behind him, at most 9 of them. Nothing else.
FINISH: LambKid full; the hoof marks are the second finished thing.
TONE: the quietest page in the book - fewest strokes, no black except the eye mark.
```

### p12 — 벌써 와 있었네

```
--- p12 - 벌써 와 있었네 ---
GRAIN: shade grain at a third density; the combed patch beneath the dog at full density, every stroke one way; the wall laid flat behind.
DOG: in frame, lying on the combed patch, chin on his forepaws, all four black paws and the black tail tip showing.
HOLLOW: he is lying exactly on it - the patch from p9, same shape, same direction.
CAMERA: low, from inside the shade looking out, dog nearest the lens, lamb behind him.
SUBJECT: DogLongname across the foreground, belly down, chin on the forepaws, eyes rolled up to the lamb, tail tip striking the ground. LambKid behind at the mouth of the shade, all four feet planted, stopped dead, mouth slightly open.
SETTING: the combed patch, the bottom stones of the wall. Nothing else.
FINISH: LambKid full; DogLongname is the second finished thing, carried by the four black paws.
TONE: cool inside, and the outside light reaches only the lamb at the shade's edge.
```

### p13 — 이름은 오늘도 끝까지 못 갔어요

```
--- p13 - 이름은 오늘도 끝까지 못 갔어요 ---
GRAIN: shade grain a third density at the back, rising to full at the front edge of the shade; wall laid flat; grass upright beyond.
DOG: in frame, still lying, eyes half shut, black tail tip striking the ground.
HOLLOW: both animals are on it now.
CAMERA: wide, front on, eye level, the two side by side.
SUBJECT: LambKid at left, legs folded, sitting beside the dog, mouth just opening on the first syllable - a small round gap, not the wide one from earlier pages. DogLongname at right, lying, chin down.
SETTING: one run of wall, and far behind, the empty trough where the book began. Nothing else.
FINISH: LambKid full; DogLongname is the second finished thing.
TONE: low afternoon light reaches into the front of the shade, so the front strokes are warm and dense and the back stays thin.
```
