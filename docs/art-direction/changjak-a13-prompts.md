# 창작동화 1000 — a13 앵커 + 삽화 프롬프트

> art-director 산출물 (2026-08-01). 배정 = `changjak-assign-16b.md` §1·§2 · 규격 = `_ANCHOR-SPEC.md` · 원장 = `_ANCHORS.md`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/a13.md`.** 아래 13컷은 그 SCENE 을 그림 지시로 옮긴 것이고 **대본은 한 글자도 안 고쳤다.**
> 🔴 **이미지 생성은 여기서 하지 않는다.** 🔴 작가 실명 0.
> 🔴 **실행 순서**: ① 시트 2장(Bear · WhiteHare)을 **먼저** 굽는다 → ② 승인 시트를 `@image1` `@image2` 로 붙여 **p3(주황만 · 겹침 0)** 과 **p11(파랑 30%)** 두 장을 굽는다 → ③ 그 넷을 ref 로 나머지 11컷. 순서를 어기면 인물만 매끈한 CG 가 된다.

---

## a13 §1. 앵커 배정

**권**: `a-day-alone` (a13 · 13쪽 · 4~6세 · 주제군 **A 마음·감정** · 엔진 **관찰과 성장** · 무대 핀란드 통나무 오두막 한 칸 · 주인공 갈색 곰)

**클러스터**: **C3** (판 인쇄 논리 · 평면 불투명 잉크)

**앵커 슬러그**: `changjak-twobeams` — **신규 민팅**

**한 줄**: 어두운 판 위에 **불투명 잉크 판이 둘뿐**(난롯불 주황 · 눈빛 파랑)이고, 방의 모든 형태는 두 판이 닿았나로 생기며, **둘 다 안 닿은 데가 곧 검은 통나무**(안 찍은 바탕)다.

**🔴 형제 권과 갈린 축 — 두 판이 겹친 자리가 몇 군데인가** (배정표 확정, 첫 렌더에서 세어진다)

| | 겹침 |
|---|---|
| a03 `changjak-gelato` | 4도라 겹친 데서 다섯째 색이 **화면 곳곳에** 생긴다 |
| c60 `changjak-fogplate` | 안개 판 겹수가 **0/1/2/3 네 단**이다 |
| **a13** | **p1~p12 겹침 0 · p13 바닥에 딱 한 줄.** 겹침색 `#A0763C` 는 그 한 쪽 말고 이 책 어디에도 없다 |

**🔴 1차 계기판 = 파랑 판의 면적**(창 → 문지른 동그라미 → 문틈 → 바닥까지 오는 문 사각형). 곰이 문에 가까워지는 것을 글로도 그림 설명으로도 안 쓰고 판 면적으로만 센다 — 그래서 쪽별 % 를 앵커 `RENDERING` 에 박았다.

**🔴 이 권이 앵커에 요구한 것 — 「판이 둘」은 프롬프트가 만들어야 한다.** 라이브러리 수상작 중 **2도가 겹쳐 셋째 색을 만드는 책이 없다**(a03 은 4도, c60 은 겹수 네 단, d18 은 흰 판이 덮기만 한다). 앵커 원본은 판 하나짜리라, 이 권의 물리(판 둘 · 겹침 0 · 마지막 한 줄)는 **`PLATES` 문단이 전적으로 책임진다.** 그 문단을 지우면 이 책은 그냥 「따뜻한 실내 일러스트」가 된다.

**🔴 분리 검수 — 호리 니들펠트**(곰·토끼의 겨울 털이 니들펠트 소재 그 자체다). 보풀·바늘땀·섬유 엣지가 한 올만 보여도 호리 라인이다 → `NOT` 절에 `no wool` `no stitching` `no fibre edge` 를 박았고, 평면 불투명 판이라 털이 **0 올**이다.

**🔴 이웃 권 회피**
- **e09 `changjak-oneedge`** (이 배치 최대의 짝 — 둘 다 좁은 실내·인물 둘) → 판정 한 줄 = **가장자리가 있는 것이 몇 개인가**. a13 = **전부**(2도 색면이라 모든 경계가 딱 서 있다) / e09 = **정확히 하나**.
- **f10 · h05** (좁은 실내 + 빛 한 덩이) → a13 은 빛의 **면적이 자란다**(f10 은 조각 개수, h05 는 크기 불변).
- **d09** (같은 핀란드) → 저쪽은 야외·카메라가 밖에 있다. a13 은 **카메라가 열세 쪽 내내 방을 안 나가고**, 눈은 창과 문 사각형 안에서만 파랗다.

**대본 SCENE 처방** — 대본은 p4 「문은 부드럽게 풀린다」·p3 「뿌옇게 보인다」를 쓴다. 이 매체엔 흐림이 없으므로 **뜻을 옮긴다**: 「부드럽게 풀린다」 = 그 자리에 **판을 안 얹는다**(바탕 그대로) · 「뿌옇게」 = 성에는 `#EDE7DA` **불투명 한 면**이고 그 뒤는 **한 획도 없다**.

**관통 줄 3개** — `BLUE:`(파랑 판 면적 %) · `WOOD:`(검은 소나무 더미 · 흰 자작 더미 · 빗장) · `SPOT:`(곰이 선 자리 = 난로 / 창 / 문지방).

---

## a13 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-twobeams   (a brown bear and a white hare / one room of a Finnish log cabin)

Style: TWO-PLATE relief print, opaque flat inks pulled onto a dark board, 4-6 year old picture
  book. Form exists only where one of the two plates has landed. 🔴 EVERY DARK AREA IS BARE BOARD,
  never painted: log walls, door grain, corners and the shadow side of every body are the
  unprinted board #241C16.

PLATES:
  PLATE 1 FIRE ORANGE #D2701F - opaque, flat, hard cut edges. Lands ONLY where the hearth fire
    physically reaches.
  PLATE 2 SNOW BLUE - opaque, flat, hard cut edges, two values: #7FA3C4 where outdoor light comes
    through, and its palest #EDE7DA for snow, frost and white birch bark. Lands ONLY where light
    from outdoors physically reaches.
  🔴 THE TWO PLATES NEVER OVERLAP UNTIL p13. Overlap count = 0 places on p1-p12; on p13 exactly
    ONE floor band where the blue doorway rectangle crosses the orange hearth pool, pulled as a
    dusty ochre #A0763C that exists nowhere else. No third colour on any other page; never
    blend or soften either ink.

RENDERING (finish hierarchy): 🔴 THE BLUE AREA IS THE GAUGE. Blue ink covers about p1 2% · p2 1% ·
  p3 4% · p4 3% · p5 8% · p6 5% · p7 25% · p8 2% · p9 6% · p10 4% · p11 30% · p12 25% · p13 35%
  of the picture; hold those numbers. FINISHED THINGS PER PAGE = 2, the bear and the one thing it
  touches. 🔴 THE ROOM HOLDS EXACTLY SIX THINGS: stone hearth, fur rug, one low wooden stool, one
  small square frosted window, wooden door with its bar, one woodpile. 0 pictures, 0 shelves,
  0 bowls. Fur = 0 hairs drawn; a body is ONE flat plate shape against bare board. Log wall =
  0 marks except at most 4 seam cuts a page. Frost = at most 7 feather strokes. Falling
  snow = at most 12 flakes. Sparks = at most 9 dots. Footprints = at most 8 marks.
  DENSITY RATION = none.

PALETTE: bare board #241C16 · fire orange #D2701F · snow blue #7FA3C4 · palest blue #EDE7DA ·
  p13-only overlap ochre #A0763C. No other colour exists. 🔴 The bear is not rendered brown nor
  the hare white: the bear is an orange-lit shape with a bare-board dark side, the hare a flat
  #EDE7DA shape. Which logs came from outside reads by ink alone - stacked pine is BARE BOARD,
  birch from outdoors is #EDE7DA.

CHARACTER DESIGN LANGUAGE: an eye is a small notch of BARE BOARD cut inside the lit shape - no
  white, no catchlight, no blush. Mouth = one cut line. Muzzle, inner ear and paw pad = one flat
  plate shape each. Expression is head angle and ear direction, not features. FIXED GRADE for all
  13 pages: both stay animals - quadruped, no clothes, no shoes, no fingers; they rise on hind
  legs only to lift the bar or carry logs, and grip with the whole forepaw.

CANVAS: 16:9 double-page spread, full bleed, image to all four edges, no caption margin, no
  border. 0 letters, numbers, signage or symbols anywhere.

NOT (rendering only): no airbrush, gradient, glossy CG or photographic finish · no wool, stitching,
  felted fibre or fuzzy fibre edge on any animal · no third colour and no plate overlap except the
  single p13 floor band · no drawn outline on top of a plate, no hatching, no cast shading.
```

---

## a13 §3. 캐릭터 시트 (🔴 이것부터 굽는다)

### 시트 1 — Bear

```
CHARACTER SHEET - Bear   (bake FIRST, before any scene)

Printed in the book's medium: two opaque flat plates on bare dark board #241C16 - fire orange
#D2701F and snow blue #7FA3C4 / palest #EDE7DA. Cut edges are hard. No third colour, no shading.

BUILD & SILHOUETTE: a full-grown brown bear, heavy and low, shoulders higher than hips, a big
  blunt head carried low. Silhouette = one broad rounded mass on four short legs with a short
  round ear each side. Reads instantly apart from the hare at thumbnail size (mass vs. ears).
BODY AS PLATES: 🔴 the bear has NO brown. Where firelight reaches it the body is a flat #D2701F
  shape; where it does not the body is BARE BOARD, and its contour is simply where the orange
  stops. On pages lit from the door instead, the same body is a flat #7FA3C4 shape.
FACE: eye = one small notch of BARE BOARD inside the lit shape, no white, no catchlight. Muzzle =
  one flat plate shape a shade paler. Mouth = one cut line, opened as a cut wedge when it speaks.
  Nose = one bare-board oval. No brow, no blush, no cheek marks.
ACTING: head angle + ear direction only. postures to sheet - posture 1 lying belly-down on the
  rug, chin on stacked forepaws, back turned to the door · posture 2 up on hind legs, one forepaw
  flat on glass · posture 3 up on hind legs, one forepaw laid on the door bar, head lowered ·
  posture 4 crouched at the hearth pushing a log in with one forepaw, neck twisted back ·
  posture 5 low to the floor, one forepaw spread, sweeping bare boards.
GRADE: animal, quadruped, no clothes, no shoes, no fingers; rises on hind legs only to lift the
  bar or handle logs, and grips with the whole forepaw.
SHEET: full body side view standing on four legs (orange-lit) / three-quarter front, same light /
  the same body lit blue instead, to fix that both readings are one animal / posture 1 / posture 3
  / two head close-ups, ears forward and one ear rotated back. Bare board behind, no scenery,
  no letters.
SCENE token: Bear.
```

### 시트 2 — WhiteHare

```
CHARACTER SHEET - WhiteHare   (bake SECOND, attach as @image2)

Same medium - two opaque flat plates on bare dark board, hard cut edges.

BUILD & SILHOUETTE: a small white hare, 🔴 about the size of two of the bear's forepaws. Long
  narrow body, long hind legs, two long upright ears that are the whole silhouette. Reads apart
  from the bear by ears and by size alone.
BODY AS PLATES: 🔴 the hare is always the palest blue #EDE7DA, on every page, indoors and out - the
  same ink as the snow and as the birch bark it carries, so it belongs to outside. Inner ear = a
  flat #7FA3C4 shape. It is never orange, not even beside the fire.
FACE: eye = one small notch of BARE BOARD, no white, no catchlight. Nose = one bare-board dot.
  Mouth = one cut line. No blush, no eyelashes.
ACTING: ear direction only. postures to sheet - posture 1 crouched from behind, back rounded,
  both forepaws lowering a log onto snow, ears laid back, FACE NOT VISIBLE · posture 2 standing on
  hind legs holding two birch logs against its chest, ears bolt upright, eyes round · posture 3
  bent forward setting a log on a floor stack, ears turned back over its shoulder.
GRADE: animal, quadruped, no clothes, no shoes, no fingers; rises on hind legs only to carry logs
  and holds them with both whole forepaws against its chest.
SHEET: full body side view on four legs / three-quarter standing on hind legs with two logs /
  back view crouched (posture 1) / two head close-ups, ears up and ears laid back. Bare board
  behind, no scenery, no letters.
SCENE token: WhiteHare.
```

---

## a13 §4. 13컷

### p1 — 빗장을 내린다

```
--- p1 — the bar comes down ---
BLUE: 2% - the small square window at frame left plus a thin thread of snow dust under the door.
  Overlap 0.
WOOD: pine stacked to the bear's shoulder inside the door (BARE BOARD). 0 birch. The bar is being
  lowered into its catch.
SPOT: at the door.
CAMERA: medium close-up, slightly low angle. Door and catch at frame right, the bear's upper body
  and both forepaws at centre.
SUBJECT: Bear on hind legs holding a thick wooden bar in both forepaws, one end already in the
  catch and the other still lifted, shoulders tipped forward, head down watching the catch, mouth
  cut open speaking, both ears at the door.
SETTING: the right half of the frame is bare board (the door); the hearth's small orange mouth is
  far back at frame left; the pine stack is bare board against a bare wall.
FINISH: 2 (bear + the bar). Log wall = 4 seam cuts.
TONE: orange just reaches the bear's shoulder from behind, blue lies on the floor by the door.
  🔴 The two inks come close and do not touch.
GRADE: animal, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

### p2 — 불이 가장 큰 쪽

```
--- p2 — the biggest fire ---
BLUE: 1%, the lowest in the book - only the frosted pane far at frame right, tiny. Overlap 0.
WOOD: pine still at shoulder height (bare board). 0 birch. Barred.
SPOT: at the hearth.
CAMERA: medium close-up, eye level. Open mouth of the stone hearth at frame left, the bear's
  forepaw and face at centre.
SUBJECT: Bear in posture 4 - crouched at the hearth, one forepaw pushing a black-barked log into
  the fire, the other flat on the stone floor, body tipped to the fire, eyes narrowed to notches,
  mouth cut open speaking.
SETTING: fire orange floods up the log wall, so nearly the whole picture is PLATE 1 - the widest
  orange in the book. Fur rug and one low stool at the hearth; door and window pushed far right,
  almost all bare board.
FINISH: 2 (bear + the log going in). Sparks = at most 9 dots. Log wall = 4 seam cuts.
TONE: 🔴 the orange plate's maximum. The blue is pushed into one corner and the two inks are at
  their furthest apart in the book.
GRADE: animal, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

### p3 — 배를 깔고 눕는다 (ref 컷 · 겹침 0)

```
--- p3 — belly on the rug (REFERENCE PULL: orange only) ---
BLUE: 4% - the small square pane at frame left only, a flat #EDE7DA field with at most 7 frost
  feathers and at most 12 flakes behind it. 🔴 Nothing beyond the pane is drawn. Overlap 0.
WOOD: pine at shoulder height (bare board). 0 birch. Barred.
SPOT: at the hearth, back turned to the door.
CAMERA: medium wide, very low eye level at floor height. Bear at frame left foreground, the barred
  door beyond its back at frame right.
SUBJECT: Bear in posture 1 - belly flat on the fur rug, legs slack to one side, chin on stacked
  forepaws, one hind leg flung out, eyes as half notches, ears laid back. 🔴 Its body faces the
  fire and its BACK is turned to the door; this is the book's starting position.
SETTING: the room lit evenly low orange, coals a small deep-orange shape. Stool, rug, woodpile.
  Everything else bare board.
FINISH: 2 (bear + the rug under it). Log wall = 4 seam cuts.
TONE: the quietest page - one broad calm orange field, one cold pale square far left, bare board
  between. 🔴 The two inks do not meet.
GRADE: animal, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

### p4 — 귀 하나만 돌아간다

```
--- p4 — one ear turns ---
BLUE: 3% - one band of #7FA3C4 under the door, brighter than the floor round it, with a few flakes
  of #EDE7DA lifted off it. Overlap 0.
WOOD: pine settled just below shoulder height (bare board). 0 birch. Barred.
SPOT: at the hearth, unmoved.
CAMERA: close-up, eye level. The lying bear's face and its one back-turned ear at centre, the door
  behind at frame right.
SUBJECT: Bear in exactly posture 1 again - chin still on its forepaws, body still to the fire,
  🔴 ONLY ONE EAR rotated back toward the door, eyes slid sideways, mouth cut slightly open.
  Nothing else has moved since p3.
SETTING: the door is left unprinted (bare board) apart from the blue band beneath it - 🔴 it is not
  blurred or softened, it is simply not inked. Fire low, pile bare board.
FINISH: 2 (bear + the blue band under the door). Log wall = 4 seam cuts.
TONE: most of the picture is low orange; the blue band is the only place where something has just
  happened, and the two inks stop short of each other on the floor.
GRADE: animal, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

### p5 — 성에를 문지른다

```
--- p5 — rubbing the frost ---
BLUE: 8% - the rubbed circle is the brightest #7FA3C4 so far; the rest of the pane stays flat
  #EDE7DA. Overlap 0.
WOOD: pine at shoulder height (bare board) far behind. 🔴 THREE birch logs (#EDE7DA) on the snow
  outside, visible only inside the rubbed circle. Barred.
SPOT: at the window, two steps from the hearth.
CAMERA: medium close-up, slightly high angle. Window and rubbing forepaw at centre, the
  bear's profile at frame left.
SUBJECT: Bear in posture 2 - on hind legs at the wall, one forepaw scrubbing a circle clear (doubled as
  two overlapping flat shapes), the other braced on the sill, nose pressed flat to the glass, one
  eye at the clear patch, mouth cut open speaking.
SETTING: 🔴 outside exists ONLY inside the rubbed circle - three birch logs on snow, at most
  8 footprint marks leading between trees. Outside it the pane is flat #EDE7DA, at most 7 frost
  feathers. Hearth and pine pile far right, low orange.
FINISH: 2 (bear + the circle it has rubbed).
TONE: 🔴 the circle is the only crisp thing and the only bright blue; the room behind is dim
  orange. First white birch in the book - birch #EDE7DA, pine bare board.
GRADE: animal, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

### p6 — 유리에 앞발을 붙인다

```
--- p6 — a paw flat on the glass ---
BLUE: 5% - the whole pane is flat #EDE7DA again and only the melted paw print is #7FA3C4, and
  nothing shows through it. Overlap 0.
WOOD: pine down to the bear's waist (bare board). Birch outside not visible. Barred.
SPOT: at the window, standing.
CAMERA: medium close-up, eye level. The bear's upper body and its paw on the glass at frame right,
  the refrosted pane filling frame left.
SUBJECT: Bear in posture 2, held still - one forepaw flat on the frosted glass with a paw-shaped
  patch melted clear round it, the other hanging at its side, shoulder tipped to the window, head
  turned to the glass, both ears forward, mouth cut slightly open.
SETTING: 🔴 the circle rubbed on p5 has frosted over - the pane is one flat pale field and there is
  NO outside in this picture at all. Water beads run under the paw. Hearth and pile small and dim
  at the back.
FINISH: 2 (bear + the pane). Frost = at most 7 feather strokes.
TONE: the room is dim orange and the window side cold and pale. 🔴 The melted patch is clear and
  still shows nothing - that is the page.
GRADE: animal, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

### p7 — 놓는 손을 본다 (@image2)

```
--- p7 — seeing the paws that put them there (@image2) ---
BLUE: 25% - the rubbed circle fills the middle of the frame, the brightest blue field so far;
  everything outside it is flat #EDE7DA frost with 0 detail. Overlap 0.
WOOD: 🔴 several birch logs (#EDE7DA) already stacked on the snow, one being set down now. Pine
  inside at waist height (bare board). Barred.
SPOT: at the window, eye against the glass.
CAMERA: extreme close-up, eye level. The pane fills the frame, the rubbed circle at centre.
SUBJECT: 🔴 inside the circle - WhiteHare in posture 1, crouched with its BACK to us, both forepaws
  lowering one birch log, snow pushed aside where it lands, ears laid back, 🔴 face not visible -
  back, forepaws and ears only. At the frame edges, Bear's forepaw enters from the top on the wet
  glass, its nose-tip and one eye from the bottom corner.
SETTING: inside the circle, snow, at most 8 footprint marks running between trees; outside it,
  flat pale frost, 0 shapes.
FINISH: 2 (hare + the log it is setting down).
TONE: 🔴 the picture is sealed with frost and the world exists through one round hole - and in it
  a pair of paws is putting something down right now.
GRADE: both stay animals, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

### p8 — 둘 남았다

```
--- p8 — two left ---
BLUE: 2% - the pane at frame left, small and flat. Overlap 0.
WOOD: 🔴 exactly TWO black pine logs left on the floor (bare board), with a rectangular pressed
  mark and bark crumbs on the wall where the stack stood. 0 birch inside. Barred.
SPOT: at the hearth, head turned to the empty stack.
CAMERA: medium wide, eye level. Hearth and bear at frame left, the emptied stack floor at frame
  right.
SUBJECT: Bear in posture 4 - crouched, one forepaw pushing a black log into the fire, the other
  braced on the floor, body to the fire but neck twisted right, eyes on the two remaining logs,
  mouth cut open speaking, ears splayed.
SETTING: the fire flares up again, orange running high on the wall - but 🔴 the wide right-hand
  floor is bare board and empty. Rug, stool, barred door.
FINISH: 2 (bear + the log going in). Sparks = at most 9 dots.
TONE: 🔴 the brighter the orange, the more visible the empty floor. Long bare-board shadows off the
  two logs. No blue anywhere near the fire.
GRADE: animal, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

### p9 — 빗장 위에 앞발을 얹는다

```
--- p9 — a paw laid on the bar ---
BLUE: 6% - the band under the door is thicker and brighter than on p4, and 🔴 one sliver of white
  birch bark (#EDE7DA) is pushed through the gap into the room. Overlap 0.
WOOD: two pine logs left on the floor (bare board). Outside the birch pile has reached knee height
  - shown ONLY by the thicker band and the bark sliver. The bar is still in its catch.
SPOT: at the threshold - nearest the bear has come to the door.
CAMERA: medium close-up, slightly low angle. Door and barred catch at centre with the bear's
  forepaw on it, the bear's face at frame left.
SUBJECT: Bear in posture 3 - on hind legs at the threshold, one forepaw laid loosely on the bar,
  toes spread and no force in it, the other hanging, a hind foot on the threshold timber, head
  lowered to the door, both ears forward, mouth cut slightly open.
  🔴 IT DOES NOT LIFT THE BAR.
SETTING: mostly bare board (the door). Behind, a low fire and the two logs.
FINISH: 2 (bear + the bar under its paw). Log wall = 4 seam cuts.
TONE: 🔴 only the blue band and the bark sliver caught in it are lit; the fire arrives faint from
  far behind. Nearness with one plank in the way.
GRADE: animal, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

### p10 — 다 썼다

```
--- p10 — all used up ---
BLUE: 4% - the band under the door at the back of the frame. Overlap 0.
WOOD: 🔴 0 pine left - only black bark crumbs and dry dust, and the rectangular pressed mark on the
  wall. Still barred.
SPOT: on the floor at the foot of the wall, where the stack stood.
CAMERA: close-up, high angle looking down at the floor. The empty floor and the sweeping forepaw
  at centre, the dying hearth mouth in the top corner.
SUBJECT: Bear in posture 5 - low to the floor, one forepaw spread wide sweeping side to side (that
  forepaw doubled as two overlapping flat shapes), the other braced, back rounded, nose near the
  boards, eyes on the swept line, mouth cut open, ears drooping.
SETTING: crumbs pushed into one thin ridge where the paw passed. In the hearth the last log has
  broken in the middle and collapsed; 🔴 no flame, only a small deep-orange coal shape.
FINISH: 2 (bear + the swept floor). Crumbs = at most 9 marks.
TONE: 🔴 the orange plate's minimum - it survives only round the coals and everything else has gone
  to bare board and the cold band at the door. From above, the empty floor is wide.
GRADE: animal, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

### p11 — 문을 활짝 민다 (ref 컷 · @image2)

```
--- p11 — the door swings wide (REFERENCE PULL: blue at 30%, @image2) ---
BLUE: 30% - 🔴 the doorway is one hard-edged rectangle of #7FA3C4 with #EDE7DA snow in it, spilling
  across the floorboards. It still does NOT reach the hearth: overlap 0.
WOOD: 0 pine inside. 🔴 Birch knee-high on the snow outside; the hare holds two more. The bar is
  lifted, still gripped in the bear's forepaw.
SPOT: in the doorway - but 🔴 BOTH HIND FEET STAY ON THE ROOM'S FLOOR; it does not cross.
CAMERA: medium wide, eye level. 🔴 Camera stays inside the room; the door frame makes a rectangle
  at the centre and the outside arrives in it.
SUBJECT: Bear at frame left on hind legs, one forepaw on the lifted bar, the other flat on the door
  pushed back to the wall, eyes wide as two bare-board notches, mouth cut open. In the doorway,
  WhiteHare in posture 2 - two birch logs clamped to its chest, ears bolt upright, stopped dead.
  🔴 The hare is the size of two of the bear's forepaws; same depth.
SETTING: knee-high birch stack, trodden prints to snow-covered spruces; in the room, the emptied
  stack wall and coals. Footprints = at most 8 marks.
FINISH: 2 (bear + the hare it faces).
TONE: 🔴 where a black door stood, a blue rectangle has opened. Room = cooled orange, doorway =
  blue, parting at the frame line without touching.
GRADE: both stay animals, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

### p12 — 각자 하던 것을 한다 (@image2)

```
--- p12 — each doing their own job (@image2) ---
BLUE: 25% - the doorway rectangle stays open at frame right. 🔴 Still overlap 0.
WOOD: 0 pine. 🔴 White birch (#EDE7DA) starting to stack against the wall inside the door, not yet
  knee-high but bright against the bare-board wall. The bar is out of the catch.
SPOT: at the hearth (bear) and at the wall inside the door (hare).
CAMERA: medium wide, eye level. Hare stacking at frame right, bear at the hearth at frame left,
  the open doorway behind them.
SUBJECT: WhiteHare at frame right in posture 3 - both forepaws lowering one birch log onto the
  floor stack just as it touches, ears turned back to the bear, head up, mouth cut open asking.
  Bear at frame left in posture 4 - one forepaw pushing a WHITE-BARKED log into the fire, neck
  twisted right, mouth open answering. 🔴 Neither helps the other; the frame's middle is empty.
SETTING: white bark curls as it catches and the flame rises again. Bark chips, rug, stool. Through
  the doorway, blue snow and trodden prints.
FINISH: 2 (each character + the log in its paws).
TONE: 🔴 three colours at once - orange left, blue right, the birch stack between - and the orange
  and the blue still do not touch.
GRADE: both stay animals, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

### p13 — 열린 문 (🔴 겹침이 처음 생기는 쪽)

```
--- p13 — the door left open (🔴 the only overlap in the book) ---
BLUE: 35%, the widest in the book - the doorway plus a long blue band across the floor from it.
  🔴 OVERLAP: exactly ONE band, where it crosses the orange pool at the hearth, pulled as dusty
  ochre #A0763C. One band, one page, nowhere else; hard edges, not softened.
WOOD: 0 pine. Birch stacked inside the door (#EDE7DA). 🔴 The bar is OUT of its catch, leaning on
  the wall beside the door.
SPOT: at the hearth, posture 1 again - but facing the door.
CAMERA: wide, eye level. 🔴 The centre of the picture is the empty doorway; Bear is small at the
  far left; the camera is still in the room, as on all 13 pages.
SUBJECT: Bear belly-down on the rug exactly as in posture 1, chin on stacked forepaws, one hind leg
  flung out, 🔴 but head turned to the door and eyes on the empty frame, ears forward. Alone; it
  neither crosses nor straddles anything.
SETTING: door flat to the wall, bar leaning beside it; in the doorway, hare prints shrinking
  between trees (at most 8 marks) and one #EDE7DA tail-tip in shadow. Birch burns in the hearth.
FINISH: 2 (the doorway + the bear). Log wall = 4 seam cuts.
TONE: 🔴 one thing has changed and it is dead centre - the place shut for twelve pages is empty and
  blue. The bear's spot is unchanged from p3; the blue band reaches the fire, where the two inks
  meet for the first and only time.
GRADE: animal, quadruped, no clothes/shoes/fingers. 0 letters or numbers.
```

---

## 첫 렌더 검수 (5항목)

1. **겹침 세기** — p1~p12 에서 주황과 파랑이 닿은 자리가 **0** 인가. p13 에 **딱 한 줄** 있는가. 다른 색이 생겼으면 그 쪽을 버린다.
2. **파랑 면적** — p3(4%) · p7(25%) · p11(30%) · p13(35%) 넷을 나란히 놓고 **자라는 것이 보이나.**
3. **바탕이 검정인가** — 어두운 데를 **검게 칠했는지** 본다. 칠했으면 판이 셋이 된 것이다.
4. **장작 색** — 안에 쌓인 소나무가 **바탕 그대로**(검정)이고 밖에서 온 자작이 `#EDE7DA` 인가. 둘이 같은 색이면 이 책의 안전핀이 죽는다.
5. **니들펠트 누출** — 곰·토끼에 보풀·바늘땀·섬유 엣지가 한 올이라도 있나(있으면 호리 라인).
