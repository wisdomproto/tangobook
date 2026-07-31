# 창작동화 1000 — E-09 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/e09.md`. **대본은 한 글자도 안 고친다** — 아래 12컷은 그 SCENE 을 그림 지시로 옮긴 번역본이다.
> 🔴 실행 순서: ① 시트 3장을 **먼저** 굽는다(장면 금지) → ② 승인본을 `@image` 로 붙여 **p4(솜털이 처음 뜨는 쪽 = 가장자리 기준 컷)** → ③ 그 두 장을 ref 로 나머지 11컷.
> 🔴 이미지 생성은 여기서 하지 않는다 · 🔴 작가 실명 없음(전부 문구).

---

## E-09 §1. 앵커 배정

**권**: `안 자는 이유 스무 가지` (e09 · 12쪽 · 4~6세 · 주제군 **E 웃음·말놀이** · 엔진 **누적·반복** · 무대 북유럽 소나무 나무 구멍 한 칸 · 주인공 아기 부엉이)

**한 줄**: 꿀빛 마른 파스텔 한 덩어리가 화면 전부이고 **가장자리가 하나도 없다.** 가장자리를 가진 것은 **흰 솜털 하나**뿐이고 계기판은 그 하나의 높이다. 앵커 슬러그 `changjak-oneedge` — **신규 민팅**.

**형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | 판정 |
|---|---|---|
| **a13** `changjak-twobeams` (이 배치 최대의 짝 — 둘 다 좁은 실내·인물 둘) | **가장자리가 있는 것이 몇 개인가** | a13 = **전부**(2도 색면이라 모든 가장자리가 딱 서 있다) / **e09 = 정확히 하나** |
| **a02** `changjak-pawtrace` (C6) | 획이 **끊기나 뭉개지나** | a02 = 마른 왁스 크레용이 종이 톱니에 끊겨 필드가 비쳐 나온다 / e09 = **손가락으로 문질러 획 자체가 없다** |
| **c37** · **h08** · **a12** (C6) | 예외가 **무엇인가** | 셋 다 예외가 **채도**이고 개수·단이 변한다 / **e09 의 예외는 가장자리이고, 색도 크기도 안 변하며 개수는 열두 쪽 내내 1**(p1~p3 은 0) |
| **g88** (C6) | 계기판이 **면적인가 높이인가** | g88 = 밝은 면적이 고도계(3%→70%→10%) / e09 = **솜털 하나의 높이** |
| **c06** | 깃털 **결을 그리나** | c06 이 결의 주인이다 → e09 는 🔴 **깃 결 0획**, 몸은 결 없는 덩어리 |
| **b09** | 나뭇결이 **비쳐 나오나** | b09 = 나무판 자체가 지지면이라 결이 그림을 뚫고 나온다 / e09 의 구멍 안은 갉아 낸 자리라 **결이 안 선다** |
| **a75** | 밝기를 **셈에 쓰나** | a75 = 줄어드는 능선 빛 띠가 시계 / e09 는 🔴 **입구 빛을 톤에만 쓰고 셈에 안 쓴다** — 시계는 엄마의 눈꺼풀이다 |
| 호리 **니들펠트**(하우스) | 실물 입체 재료인가 | 양모·바느질·펠트 0. 이것은 2D 마른 파스텔이다(NOT 절에 명시) |

**🔴 대본 SCENE 처방표** — 매체에 없는 말은 뜻으로 옮긴다.

| 대본 | 이 매체에서 |
|---|---|
| p7 `비스듬히 든 아침 빛줄기 하나` | 🔴 **가장자리 있는 광선 금지** — 있으면 예외가 둘이 된다. 밝기가 부드럽게 오른 넓은 띠로만, 경계 0 |
| p12 `깃 사이로 든 아침빛 한 가닥` | 같음. 부리와 솜털 자리만 한 단 밝게, 자른 모양 없음 |
| p10 `배경은 부드럽게 풀린다` | 원래 전부가 부드럽다 → **두 얼굴 뒤를 톤 2단으로 줄이고 디테일 0** |
| p3 `구멍 입구 너머 흐릿한 나뭇가지 하나` | **명도 2단 차이 안에서만** — 밝은 입구 톤 위에 한 단 어두운 덩어리, 잔가지 0 |
| p8 `아기가 실루엣에 가깝다` | 윤곽선이 없으므로 실루엣 = **밝은 입구 톤 위에 놓인 한 단 어두운 덩어리**, 테두리 0 |
| p6 `비틀, 비틀` / p4 `부스러기가 굴렀다` | 정지 매체 → **기울기 각도**와 **부스러기 개수**로(속도선·잔상 금지) |

---

## E-09 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-oneedge   (an owlet / a hollow in an old Nordic pine)

Style: soft dry pastel rubbed into warm paper with the side of the stick and a finger, 4-6 year
old picture book. Every form is made by one tone meeting another and blending into it. Nothing
is outlined, nothing is drawn with a point, nothing has a crisp boundary.

RENDERING (finish hierarchy): 🔴 THIS VOLUME: EXACTLY ONE THING IN THE BOOK HAS AN EDGE.
  The owlets, the wing, the wall, the moss, the morning - all of it is one continuous honey
  coloured mass with soft transitions, so a spread reads as a single lump of warm light. The one
  exception is the WHITE DOWN FEATHER, which has a crisp, sharp, fully closed boundary all the
  way round: the only crisp boundary anywhere in the twelve pages. Its size and its colour never
  change, page to page. Only its HEIGHT changes. 🔴 The mother's eyelid is a soft-sided dark
  line laid ON the mass and thickening page by page - it is a gauge, not an edge.
  FINISHED THINGS PER PAGE = 2 - the owlet and the one thing it does that page. Plumage = 0 drawn
  barbs, 0 feather shapes, at most 3 tonal changes on a whole bird. Wall = at most 5 broad tonal
  bands, 0 drawn grain lines. Floor = at most 7 wood flakes. Moss = 1 band, at most 6 tufts, 0
  strands. Dew = 3-4 drops, on p5 only. 0 nest, 0 twigs, 0 stored food, 0 stray feathers.
  DENSITY RATION = none. p4 holds the biggest body, not the busiest page.

PALETTE: honey wood #C89A5A · dark plumage and hollow shade #4A3524 · morning gold at the mouth
  #E8B95C · white down #F6F3EA. 🔴 THE DOWN IS THE ONLY WHITE IN THE BOOK - no white highlight,
  no catchlight, no pale sky patch, no white dew, no white rim anywhere. 🔴 The entrance light is
  TONE ONLY: it warms and widens from page to page but it is never counted, never measured and
  never hard-edged. A shaft of light is a soft broad brightening, never a cut-out beam.

CHARACTER DESIGN LANGUAGE: round soft owl faces built from tone alone - the facial disc is a
  faint shift of value, the eyes are two large dark rounds with no outline and no catchlight, the
  beak a small warm-dark wedge. Acting comes from eye size, ear-tuft angle and how far the down
  is puffed. No blush, no eyebrows, no tears, no sweat drops.
  🔴 FIXED GRADE, ALL 12 PAGES: both stay birds - two feet, wings are wings, no clothes, no
  fingers, no props, and neither ever grips, carries or holds anything on any page.

CANVAS: 16:9 double-page spread, image runs to all four edges. No caption band, no border, no
  quiet strip anywhere. ONE room for the whole book: the inside of a hollow in an old pine - wood
  flesh, the lip of the entrance with its moss, and the brightening morning past it. The camera
  never leaves this hollow.

NOT (rendering only): NOT airbrushed, gradient-rendered, glossy 3D, cel-shaded or photographic.
NOT outlined - no contour line on any bird, wall, wing, moss or flake.
NOT a hard-edged light shaft, window shape, sun ray or god-ray.
NOT letters, numbers, symbols or tally marks anywhere.
```

---

## E-09 §3. 캐릭터 시트 (🔴 이것부터 굽는다)

### 시트 1 — BabyOwl

```
CHARACTER SHEET - BabyOwl   (bake FIRST, before any scene)

Same medium as the book: soft dry pastel rubbed into warm paper, forms made by blended tone
only, no outline anywhere on this sheet either. Plain honey paper behind, no scenery.

FACE: a downy owlet. The facial disc is a faint shift of value, not a drawn ring. Two large dark
  rounds for eyes, no outline, 🔴 no catchlight. A small warm-dark wedge of a beak that opens
  wide, half, a crack, and - on the last page - stays parted. Two short ear tufts whose angle is
  half the acting. No blush, no eyebrows.
BODY: soft grey-brown down #A8845C over honey #C89A5A, belly a step lighter. 🔴 0 barbs, 0 feather
  shapes, at most 3 tonal changes on the whole bird. The down PUFFS - the silhouette gets fatter
  when it shouts and flatter when it settles, and that is the only volume cue.
WINGS & FEET: two short stubby wings that spread, flap and fold; two feet with blunt toes and
  small dark claws. 🔴 The feet grip perches only - they never hold, carry or point at an object.
BUILD: round, top-heavy, head nearly as wide as the body. Half the mother's height, reaching to
  her chest. Silhouette must separate from the mother at thumb size by size and by fluffiness.
SHEET: full body standing / lying flat on the belly with both feet stretched out and toes splayed
  / standing on ONE foot, tipped off balance, both wings out / both wings spread as wide as they
  go, chest thrust forward / head turned right round to look backwards over its own back; plus
  three head close-ups - beak wide open shouting, beak barely parted whispering, 🔴 beak parted
  and STOPPED with both eyes closed.
🔴 A bird, not a child - no clothes, no fingers, no props. No letters or numbers anywhere.
SCENE token: BabyOwl.
```

### 시트 2 — MotherOwl (🔴 눈꺼풀 사다리 = 이 책의 시계)

```
CHARACTER SHEET - MotherOwl   (bake SECOND, attach as @image2)

Same medium - blended pastel tone, no outline. Plain honey paper behind, no scenery.

FACE & BODY: an adult owl, dark brown plumage #4A3524 with a warmer breast, twice the owlet's
  size and smooth where the owlet is fluffy. Large dark eyes with no outline and no catchlight,
  a short dark beak, ear tufts that stand while she is awake and lie flat as she goes under.
  🔴 0 barbs, 0 feather shapes, at most 3 tonal changes on the whole bird.
🔴 EYELID LADDER - draw all six as a labelled strip, this is the book's clock:
  1 fully round and wide awake · 2 lid down a third · 3 down to half · 4 a narrow lens ·
  5 a hairline slit · 6 closed, only the lid line left.
  The lid is a SOFT-SIDED DARK LINE laid on the face, and it THICKENS as it descends - hairline
  at 1, a broad soft band at 6. 🔴 It must have no crisp boundary: it is a smudged line, not an
  edge. Nothing on this sheet may have a crisp boundary.
SLEEP SHAPES: sitting against a wall with the head tipping sideways / beak buried deep in the
  shoulder feathers with the body rounded and puffed and both feet drawn together / asleep with
  ONE wing lifted a little to open a gap underneath, the inner wing a soft dark shelter.
SHEET: full body awake beside a BabyOwl silhouette for scale, the six-step eyelid strip, and the
  three sleep shapes.
🔴 A bird, not an adult woman - no clothes, no fingers, no props. No letters or numbers.
SCENE token: MotherOwl.
```

### 시트 3 — WhiteDown (🔴 이 책의 유일한 가장자리)

```
CHARACTER SHEET - WhiteDown   (bake THIRD, attach as @image3 - calibration plate)

ONE small white down feather, #F6F3EA, about the size of the owlet's eye. 🔴 IT IS THE ONLY
THING IN THIS BOOK WITH AN EDGE: a crisp, sharp, fully closed boundary all the way round, cut
clean against the soft pastel mass behind it, as if a tiny piece of white paper had been laid on
the page. It is also the only white in the book.

FIXED: its size never changes, its colour never changes, its shape never changes, it never blurs,
never streaks, never doubles, never trails and never glows. It casts no light onto anything.
Only its HEIGHT IN THE FRAME changes from page to page.
SHAPE: a small soft plume - a fine shaft with a loose fluff at one end - but read as ONE clean
white silhouette, not as drawn barbs. 🔴 0 barbs.
🔴 CALIBRATION: on the same sheet, place it three times over a plain honey pastel field - once
against light wood, once against dark plumage, once inside a soft brightening. In all three the
boundary must stay equally crisp while EVERYTHING around it stays blended. If the surroundings
sharpen up anywhere on this plate, the plate has failed and the whole book fails with it.
Also show it once at rest on a flat surface, seen from just above, with the same crisp boundary.
🔴 No letters or numbers. No other white object on this sheet.
SCENE token: WhiteDown.
```

---

## E-09 §4. 12컷

각 컷 = `STYLE ANCHOR + @image1(BabyOwl) + @image2(MotherOwl) + 아래 블록`. p4 부터는 `@image3(WhiteDown)` 을 반드시 붙인다.
관통 줄 셋 = `EDGE:`(화면 안 가장자리 개수) · `DOWN:`(솜털의 높이) · `LID:`(엄마 눈꺼풀 사다리 단).
🔴 솜털이 왜 안 내려오는지는 **글이 말하지 않는다** — 그림만 안다.

### p1 — 이유가 스무 가지야

```
--- p1 --- "I'm not sleeping! I have twenty reasons!"
EDGE: 0. Nothing in this frame has a crisp boundary; every form is blended tone.
DOWN: not in the book yet. 0 white anywhere on this page.
LID: step 1 - the mother's eyes fully round and wide awake, the lid a hairline.
CAMERA: medium, at floor height, eye level. BabyOwl left, MotherOwl right, entrance behind both.
SUBJECT: left - BabyOwl gripping the lip of the entrance with both sets of claws, body braced
  back, beak wide open shouting so the face tips up, eyes huge dark rounds, down puffed all over,
  both short wings a little out for balance. Right - MotherOwl sat back against the inner wall
  shaking out one wet shoulder, head tilted toward the owlet.
SETTING: honey wood flesh in at most 5 broad tonal bands; at most 7 floor flakes; one band of
  moss on the lip; brightening morning past the entrance.
FINISH: 2 - BabyOwl and the lip it is gripping.
TONE: the inside stays brown and dim while only the entrance warms to gold, so the frame reads in
  two brightnesses. Funny, not fraught. 🔴 The owlet comes up to the mother's chest - both are at
  the same depth here, so size is stated on this page.
🔴 Both stay birds - no clothes, no fingers, nothing held. No letters or numbers anywhere.
```

### p2 — 발가락이 아직 안 졸려

```
--- p2 --- "my toes aren't sleepy yet."
EDGE: 0.
DOWN: not in the book yet. 0 white anywhere.
LID: step 2 - the lid down about a third, the eye still clearly open.
CAMERA: close-up, low angle on the lip of the entrance; the lower half of the frame is lip and toes.
SUBJECT: centre - BabyOwl lying flat on its belly along the lip with 🔴 both feet pushed right out
  past the edge and every toe splayed wide, claws hanging in the air. Its head is twisted back
  over its own shoulder toward the mother, beak parted, eyes bright. Right rear, in the dim inside
  - only half of MotherOwl's face, eye still open.
SETTING: the worn wood of the lip; the moss band, at most 6 tufts; past the lip the pine trunk
  falling away as one soft darker mass with no detail.
FINISH: 2 - BabyOwl and the lip its toes hang over.
TONE: 🔴 the morning gold reaches the ten toes only, and the body behind them sits in the hollow's
  brown - the split falls exactly at the threshold, because that is where every reason is given.
🔴 Both stay birds - no clothes, no fingers, nothing held. No letters or numbers anywhere.
```

### p3 — 고개를 뒤로 빙 돌린다

```
--- p3 --- "I have to see who that is. Second!"
EDGE: 0.
DOWN: not in the book yet. 0 white anywhere.
LID: step 3 - the lid down to half, the head tipping toward the owlet without strength.
CAMERA: medium close-up, eye level, the owlet in the middle with its body facing us and its face
  turned right round.
SUBJECT: centre - BabyOwl with its body squared to the inside of the hollow and 🔴 its head turned
  a full half circle to look back past its own back at the entrance. Both ear tufts stand sharp,
  the eyes are wide and fixed on one point, the beak is shut, both feet planted with the toes
  spread. Left rear - MotherOwl leaning on the wall.
SETTING: past the entrance ONE branch, drawn as a single darker mass within two steps of the
  entrance tone, no twigs. 🔴 What made the noise is never shown, on this or any page. Wood
  flakes on the floor, wall bands behind.
FINISH: 2 - BabyOwl and the branch it is staring at.
TONE: the entrance light lands full on the turned face, so the two dark eyes are the brightest
  read on the page. Alert and comic, never frightening.
🔴 Both stay birds - no clothes, no fingers, nothing held. No letters or numbers anywhere.
```

### p4 — 날개를 활짝 편다 🔴 솜털이 뜬다 (기준 컷)

```
--- p4 --- "third, hungry! fourth, my leg's asleep! fifth, sixth, seventh!"
EDGE: 🔴 1, and this is the page it arrives. From here on every frame has exactly one crisp
  boundary and it belongs to WhiteDown.
DOWN: 🔴 it comes loose from the owlet's breast and is blown UP by its own breath to hang high
  above the face, near the top of the frame. It does not touch anything.
LID: step 4 - a narrow lens, the head tipped back to look up at the owlet.
CAMERA: medium wide, slightly low angle; the spread-winged owlet fills the hollow.
SUBJECT: centre - BabyOwl on both feet with 🔴 both short wings spread as wide as they go, almost
  touching the two walls, chest thrust forward, beak wide open pouring it all out, face to camera,
  down puffed everywhere, toes pushing so the heels lift. Lower right - MotherOwl seated, head
  tipped back, eyes at the narrow lens.
SETTING: wall bands behind; at most 7 flakes, 3 rolled aside by the wing wash.
FINISH: 2 - BabyOwl and WhiteDown.
TONE: the body filling the frame is how loud it is. Everything is honey brown and blended, and
  🔴 the one small white feather with the hard boundary is the only thing the eye can land on.
🔴 Both stay birds - no clothes, no fingers, nothing held. No letters or numbers anywhere.
```

### p5 — 이끼의 이슬을 핥는다

```
--- p5 --- "that's the eighth!"
EDGE: 1 - WhiteDown only.
DOWN: high, at the very top edge of the frame, still afloat, still not touching anything.
LID: step 5 - a hairline slit, blinking toward the owlet.
CAMERA: close-up, high angle looking down across the lip at the moss and the owlet's face.
SUBJECT: centre - BabyOwl with its neck stretched long and its face pressed close to the moss on
  the lip, 🔴 the tip of its beak parted to lick one bead of dew, eyes half closed, one foot up on
  the lip pushing the body forward, tail lifted behind. Left rear in the dim - MotherOwl blinking.
SETTING: one band of moss along the lip, at most 6 tufts and 0 strands, with 3-4 dew beads on it -
  🔴 the only page in the book with dew. Past the lip a patch of bright morning.
FINISH: 2 - BabyOwl and the moss it is licking.
TONE: the dew catches the most light on the page, 🔴 but it is warm gold, never white - the only
  white in the book is the feather. Close, quiet, thirsty.
🔴 Both stay birds - no clothes, no fingers, nothing held. No letters or numbers anywhere.
```

### p6 — 한 발로 서서 비틀거린다

```
--- p6 --- "I haven't done standing on this foot yet. Eleventh!"
EDGE: 1 - WhiteDown only.
DOWN: 🔴 pushed UP again by the flapping, back to near the top of the frame - higher than it was
  on p5. It still has not come down once.
LID: step 5 going on 6 - slits only, the head hanging down.
CAMERA: medium, eye level, the whole owlet in the middle of the frame.
SUBJECT: centre - BabyOwl 🔴 balanced on ONE foot with the other lifted up in front of its belly,
  the whole body tipped off the vertical so the rump swings out, both stubby wings flapping wide
  for balance, beak open shouting, one eye screwed up with effort, down all messed up.
SETTING: at most 7 wood flakes, pushed aside around the standing foot; wall bands behind.
FINISH: 2 - BabyOwl and the one foot it is standing on.
TONE: 🔴 the body is tilted well off the frame's vertical so the wobble reads in a still picture -
  no motion lines, no after-images. Honey brown everywhere with one white dot in it. Absurd and
  hard-working.
🔴 Both stay birds - no clothes, no fingers, nothing held. No letters or numbers anywhere.
```

### p7 — 솜털을 눈으로 좇는다

```
--- p7 --- "I have to watch it land."
EDGE: 1 - WhiteDown only. 🔴 The light in this frame must NOT have an edge.
DOWN: a hand's span above the owlet's beak, in the middle of the frame - low enough to reach for
  and still afloat, because every word pushes it back up. The reason is never written down.
LID: step 6 all but shut - a thread of eye left, the head sinking into the chest.
CAMERA: medium close-up, low angle: the upturned face below, the feather above it.
SUBJECT: lower centre - BabyOwl with its head thrown right back and its beak tipped up as if
  pointing, 🔴 both eyes tracking the feather, neck stretched long, both feet taking small shuffled
  steps so the body has turned half a circle following it, beak slightly open, talking.
SETTING: a broad soft brightening slants through the hollow - 🔴 a wide blended glow with NO
  boundary, no cut-out beam, no dust motes. Wall bands behind.
FINISH: 2 - BabyOwl and WhiteDown.
TONE: the feather sits in the brightest part of the glow and is the only crisp thing on the page.
  🔴 It is also the only thing in the frame that is moving. Slow and drowsy.
🔴 Both stay birds - no clothes, no fingers, nothing held. No letters or numbers anywhere.
```

### p8 — 등을 돌리고 혼잣말 🔴 아기만 모른다

```
--- p8 --- "the seventeenth is, my tummy is ticklish."
EDGE: 1 - WhiteDown only. 🔴 The owlet reads as a silhouette WITHOUT an outline - a darker mass
  laid on the bright entrance tone, its boundary still blended.
DOWN: hanging in the air just above the owlet's shoulder, still up.
LID: 🔴 step 6 - fully closed. Only the soft thick lid line is left, and the owlet cannot see it.
CAMERA: medium wide, eye level. BabyOwl left with its back to us, MotherOwl right.
SUBJECT: left - BabyOwl 🔴 sat with its back turned to the mother, facing the bright entrance, so
  only a sliver of its profile shows; the beak is parted, talking to nobody, one toe scratching at
  the wooden floor and flicking up flakes, shoulder down puffed and easy. Right - MotherOwl slumped
  against the wall, eyes fully shut, head fallen sideways, breast rising and falling.
SETTING: a few flakes kicked loose by the toe; the entrance gone white-bright with morning.
FINISH: 2 - BabyOwl and the floor it is scratching.
TONE: 🔴 one frame holds a waking back and a sleeping face and only the reader sees both. The
  entrance is the brightest, the mother the dimmest. Quiet, uneventful.
🔴 Both stay birds - no clothes, no fingers, nothing held. No letters or numbers anywhere.
```

### p9 — 아무도 묻지 않는다 🔴 소리 없는 쪽

```
--- p9 --- nobody asks this time
EDGE: 1 - WhiteDown only.
DOWN: 🔴 beside the owlet's head, and for the first time it has come DOWN a little - nobody is
  talking, so nothing pushed it back up. Still not touching anything.
LID: step 6 - shut. The beak is buried deep in the shoulder feathers, the body rounded and puffed,
  ear tufts flat, both feet drawn neatly together.
CAMERA: medium, eye level. BabyOwl left, MotherOwl right, both fully in frame.
SUBJECT: left - BabyOwl turned bodily toward the mother and stopped there, 🔴 its beak still parted
  on the next word it did not get to say, eyes wide open on her, the raised foot set back down
  awkwardly, both wings closed against the body. Right - MotherOwl asleep, beak buried, round.
SETTING: wall bands, at most 7 wood flakes, nothing else.
FINISH: 2 - BabyOwl and MotherOwl.
TONE: 🔴 the first page in the book with no sound in it - everything in the frame is still, and the
  one thing that has moved is the feather, a little lower than last page. Suddenly roomy, never sad.
🔴 Both stay birds - no clothes, no fingers, nothing held. No letters or numbers anywhere.
```

### p10 — 목소리가 아주 작아진다

```
--- p10 --- "…mama. I have one reason left."
EDGE: 1 - WhiteDown only.
DOWN: above and between the two faces, lower again than on p9.
LID: step 6 - shut, motionless, seen very close.
CAMERA: close-up, eye level; 🔴 the two faces fill the frame.
SUBJECT: left - BabyOwl come right up on quick small steps and 🔴 pushed its face close in front of
  the mother's, beak parted only a crack to whisper, face soft, eyes huge and open, looking into
  her shut ones, neck stretched forward so the shoulders drop. Right - the mother's closed eye and
  her beak sunk in her feathers, very close, not moving.
SETTING: 🔴 nothing but honey wood wall behind the two heads, reduced to 2 tonal bands with no
  detail at all.
FINISH: 2 - the two faces.
TONE: 🔴 the nine pages before this were all big shouting shapes, so this one is small - the drop
  in voice reads as body size and closeness. 🔴 The owlet's head is about half the mother's head:
  both are at the same depth here, so size is stated on this page. Warm and low.
🔴 Both stay birds - no clothes, no fingers, nothing held. No letters or numbers anywhere.
```

### p11 — 날개 밑으로 파고든다 🔴 솜털이 내려오기 시작한다

```
--- p11 --- warm and dim under the feathers
EDGE: 1 - WhiteDown only.
DOWN: 🔴 coming down slowly through the air above the two bodies - the first sustained descent in
  eight pages, because there is no breath left to push it up. Still not landed.
LID: step 6 - shut; she sleeps through it and lifts the wing anyway.
CAMERA: medium close-up, slightly high angle; the lifted wing and the owlet going under it are in
  the middle of the frame.
SUBJECT: centre - BabyOwl 🔴 pushing in head first under the mother's lifted wing, its face and
  breast already inside the dim of the feathers, only its tail and both feet still outside, toes
  pressing the floor to shove itself further in. Right - MotherOwl asleep with one wing raised a
  little to leave the gap, eyes shut.
SETTING: the soft inner surface of the lifted wing, made of tone alone with 0 barbs; wood flakes.
FINISH: 2 - BabyOwl and the lifted wing.
TONE: 🔴 it is dim under the wing and bright all round it, and the owlet is going from the bright
  side into the dark one - that direction must be visible in the picture. Snug and quiet.
🔴 Both stay birds - no clothes, no fingers, nothing held. No letters or numbers anywhere.
```

### p12 — 벌어진 채 멈춘 부리 🔴 착지

```
--- p12 --- "the twentieth is…"
EDGE: 1 - WhiteDown, and here it is the whole point. Everything else is blended tone.
DOWN: 🔴 LANDED, at rest right in front of the parted beak - the first and only time it settles
  in the book. About the size of the owlet's eye. The text never says why.
LID: the mother's face is out of frame; only her breast and the inside of the lifted wing show.
CAMERA: close-up, eye level, 🔴 tightened to the owlet's face alone - the camera does NOT pull
  back for the last page.
SUBJECT: centre - BabyOwl's face laid sideways and sunk into the mother's breast, 🔴 the beak
  still parted on a word it did not finish - parted, NOT closed - both eyes shut, the down round
  the eyes softly pressed, one ear tuft flopped sideways.
SETTING: 🔴 nothing else in frame at all. One face and one feather; along the top, the mother's
  breast and the inner wing, large and soft.
FINISH: 2 - the face and WhiteDown.
TONE: one thread of morning warms the parted beak and the feather in front of it, nothing else.
  🔴 The subject of the last picture is not a sleeping face
  but a STOPPED BEAK - stopped mid-word, not shut at the end of one. Very quiet, very warm.
🔴 A bird, not a child - no clothes, no fingers, nothing held. No letters or numbers anywhere.
```

---

## 첫 렌더 검수 체크리스트 (5항목)

1. **가장자리를 센다** — p1~p3 은 0, p4~p12 는 **정확히 1**. 인물·벽·이끼·날개에 윤곽선이 하나라도 생기면 이 책은 실패다.
2. **솜털의 크기·색이 아홉 장에서 같은가** — 커지거나 빛나거나 번지면 계기판이 죽는다. 변하는 것은 **높이 하나**뿐.
3. **솜털의 높이를 열두 장 나란히 놓고 잰다** — p4 높음 · p5 최상단 · p6 다시 올라감 · p7 한 뼘 · p8 어깨 위 · p9 조금 내려옴 · p10 더 · p11 내려오는 중 · **p12 앉음**. 🔴 p4~p11 여덟 쪽 동안 한 번도 안 닿아야 한다.
4. **엄마 눈꺼풀 사다리** — p1 1단 → p3 3단 → p5 5단 → p8 6단(감김) → p12 화면 밖. 되돌아가는 쪽이 하나라도 있으면 시계가 깨진다.
5. **빛에 가장자리가 있나** — p7·p12 의 빛줄기가 잘린 모양으로 나오면 예외가 둘이 된다. 흰색이 솜털 말고 한 점이라도 있는지도 같이 센다.

## 🔴 대본에 보고할 것 (고치지 않았다)

- 대본 결함 없음. p7·p12 의 `빛줄기`·`빛 한 가닥` 은 결함이 아니라 **매체 함정**이라 처방표에서 톤으로 옮겼다(가장자리 있는 광선이 되면 예외가 둘이 된다).
</content>
</invoke>
