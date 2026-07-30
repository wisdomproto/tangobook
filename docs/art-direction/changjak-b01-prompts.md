# 창작동화 1000 — B-01 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`, 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/b01.md`.** 아래 12컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다.
> 🔴 **작가 실명은 한 글자도 안 들어간다.** 근거 후보 id 는 판정 표에만 남기고 프롬프트에서는 전부 문구로 옮겼다.
> 🔴 **주인공은 「새끼 쥐」가 아니라 「다람쥐」다.** 배정 지시서에는 새끼 쥐로 적혀 있으나 대본 `cast` 와 12쪽 SCENE 전부가 **다람쥐(squirrel)** 다. 대본이 SSOT 라 다람쥐로 간다 — 대본을 쥐로 바꿀 거면 시트부터 다시 굽는다(§2.4).

## 0. 실행 순서 (어기면 인물만 매끈한 CG 로 나온다 — §2.4)

1. **STYLE ANCHOR 로 시트 3장을 먼저 굽는다.** 장면 금지. 🔴 **상자 시트(`MoveBox`)를 사람 시트와 같은 등급으로 취급한다** — 이 권은 상자를 **세는** 책이라, 상자가 쪽마다 다른 크기·다른 각도로 나오면 12쪽이 통째로 무의미해진다.
2. 시트가 승인되면 `@image1`(다람쥐) · `@image2`(어른) · `@image3`(상자)을 붙여 12컷을 뽑는다.
3. 🔴 **p1 · p7 · p12 세 장을 먼저 굽고 그 다음에 나머지 9장을 굽는다.** 이 셋이 「빈 바닥 30% → 2% → 방 전체」의 양 끝과 꼭짓점이라, 여기서 면적이 안 맞으면 나머지 아홉 장이 전부 헛것이다.
4. 승인 렌더 3장을 앵커 ref 슬롯에 넣는다 — 🔴 **인물 컷 1 · 배경이 러프로 남은 컷 1 · 전체 장면 1**.
5. 앵커 이름은 **렌더를 보고 짓는다**(§7.5-3). 지금은 슬러그만: `changjak-b01`.

---

# B-01 「이사 온 날의 상자 도시」

주제군 B 상상·변신 / 엔진 **누적·반복** / 무대 파리 다락방 / 주인공 어린 다람쥐 / 12스프레드 · 후렴 "여기, 길 하나 더!" p2~p6 다섯 번 + p7 끊김

## B-01 §1. 앵커 배정

### 이 권이 그림에 요구하는 것 (판정의 전제)

1. 🔴 **쌓이는 것이 곧 화면 구조다.** 상자가 늘수록 **빈 바닥이 줄어든다.** 이 책의 사건은 인물의 감정이 아니라 **두 면적의 교대**다 — 이걸 그림이 못 지면 「상자 나열」이 되고 착지(p12 빈 광장)가 아무 의미도 없어진다.
2. 🔴 **상자는 같은 상자여야 세어진다.** 원근으로 앞 상자를 크게 그리는 순간 개수가 안 읽히고, 「비교되는 두 것이 다른 깊이에 놓여 크기가 뒤집히는」 기왕의 결함이 그대로 재발한다.
3. **저항이 담요 하나에 걸려 있다.** 깔림 → 반으로 접힘 → 구석으로 밀림 → 덮을 것 없음. 담요는 화면에서 **면적으로 줄어드는 단 하나의 물건**이어야 한다.
4. **무대가 물리 조건이다.** 기운 천장(탑은 높은 쪽에만) · 지붕창(빛이 네모로 딱 한 자리) · 좁은 바닥. 이 셋이 화면에서 기하로 보여야 파리 다락방이 장식이 아니라 원인이 된다.

### 후보 3

| | 후보 ① **C4 평면 형태 · 마분지 위 불투명 평칠** (`marais-tomber` + `moriconi-lua`) | 후보 ② C3 실크스크린 3잉크 (`valousek-panacek` 계열) | 후보 ③ C7 회화적 톤 (`smith-townsea`) |
|---|---|---|---|
| 매체 | 회색 마분지 지지체 위에 불투명 물감 평칠, 음영 0, 깊이는 선으로만 | 평면 스크린 잉크 3판 | 잉크선 + 수채, 명암 대비 |
| 이 권에 맞는 이유 | 🔴 **상자 = 안 칠한 맨 마분지.** 도시가 자랄수록 **칠한 면이 줄어든다** — 매체의 공정이 곧 플롯이다. 그리고 평면·등축이라 상자 아홉 개가 주판알처럼 세어진다(§2.11) | 평면·개수·팔레트 규율은 같은 강도 | 다락 빛·기운 천장에 무난 |
| 리스크 | 표정을 못 쓴다(§2.8) → 이 권은 감정 서사가 아니라 **자리 다툼**이라 비용이 아니다. p7 의 「말이 끊김」은 자세로 쓴다 | 🔴 **A-11 이 이미 2잉크 판화다.** 라이브러리 카드가 가로로 이웃하는데 둘 다 인쇄물이면 라인 정체가 깨진다(§7.6 전례) | 🔴 **대기감이 면적을 뭉갠다.** 빛과 그림자가 바닥을 갈라 놓으면 「남은 바닥이 얼마인가」를 못 읽는다 — 이 권 최대 요구를 정면으로 못 맞춘다 |
| 판정 | ✅ **추천** | 탈락 — 라인 내 중복 | 탈락 — 면적을 못 센다 |

### 🔴 추천 = 후보 ① — 마분지 위 불투명 평칠 (C4)

- **매체가 곧 플롯이다.** 상자는 **안 칠한 마분지**이고 빈 바닥·창빛은 **칠한 뼈빛**이다. 상자를 하나 놓을 때마다 화가는 **덜 칠한다.** 「도시가 자랄수록 그림이 줄어든다」 — §2.7(획의 절약)이 취향이 아니라 공정으로 들어온다.
- 🔴 **§2.9 의 면적판.** A-04 는 앰버 **한 점**의 양으로 서사를 썼다. 이 권은 **뼈빛 면적**(30% → 2% → 0 → 다시 방 전체)으로 같은 일을 한다. 악센트가 점이 아니라 **바닥**이다.
- **등축(아이소메트릭)이 개수와 크기 결함을 동시에 막는다.** 상자는 어디 있든 같은 크기·같은 각도의 도형이다 → 셀 수 있고, 원근이 크기를 뒤집지 못한다.
- 🔴 **착지가 매체에서 나온다.** 마지막 쪽 파리 지붕은 평면 언어에서 **어긋나게 겹친 사각형 밭**이다. **지붕 사각형과 마분지 상자가 같은 도형으로 보이는 것**이 「이 방도 도시의 상자 한 칸」이라는 착지 전부다. 회화 매체로는 이 등식이 안 선다.

### 라인 충돌 확인 (필수)

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 2D 평칠. 실물 입체 재료 없음, 그림자 없음, 두께 없음 |
| 전래동화 **점눈이** | ✕ (4축 전부) | ① **종이색** — 밝은 크림(=햇빛) 아님, **회갈 마분지**(=상자) ② **얼굴** — 점눈 아님, **밝게 오려낸 얼굴 면 + 그 위 어두운 마크 2개** ③ **악센트** — 화면당 빨강 1점 규칙 안 씀, **면적이 변수** ④ **매체** — 느슨한 색연필 낙서 아님, 자를 댄 듯한 곧은 가장자리의 불투명 평칠 |
| A-04(흑연) · A-11(리노컷) · a91(워시) · c37(워시) · g10(잉크선) | ✕ | 이 라인에서 **처음 쓰는 C4**. 위 다섯은 전부 「손으로 그은 획」이 보이는 매체고 이건 **획이 안 보이는 평면 색면**이다 |

### 🔴 동시 배정 충돌 위험 (같은 세션에 다른 권이 돌고 있다)

| 위험 | 내용 | 이 파일이 잡아 둔 표시 |
|---|---|---|
| **F-01(같은 세션)** | 둘 다 「평면 조각」으로 보일 수 있다 | b01 = **무늬 0 · 잉크 선 0 · 등축 기하 · 칠한 색면** / f01 = **무늬가 전부 · 모든 인물이 잉크 선 · 유기적 곡선 · 붙인 조각**. 🔴 b01 에 무늬를 넣거나 f01 에 등축을 넣으면 즉시 무너진다 |
| **e120 · e03 · e09(E 주제군)** | E 2순위가 C4 고채도라 평면끼리 겹칠 수 있다 | b01 은 **저채도 4색 + 회갈 마분지 바탕**이다. E 권이 C4 로 오면 **고채도·흰 바탕**으로 가야 한다 |
| **b 주제군 다른 권** | B 1순위가 C4 라 이 라인에서 C4 가 몰릴 자리다 | 🔴 b01 이 **등축 + 마분지 지지체** 칸을 먼저 썼다. 다음 B 권의 C4 는 **흰 바탕 · 정면 평면 · 무채 아닌 지배색**으로 갈 것 |

---

## B-01 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-b01  (squirrel / Paris attic / a city of boxes)

Style: a flat, built picture-book page for 4-6 year olds. Calm, geometric, matter-of-fact.
  This is a book about how much bare floor is left, so AREA is the storytelling, not lighting.

MEDIUM: opaque flat paint (poster colour / flat gouache) applied on a sheet of GREY-BROWN
  CARDBOARD, and the cardboard is left bare wherever a moving box appears.
  Every shape is one flat pass of solid opaque colour with a clean straight edge, as if the
  edge were painted against a ruler. The paint sits ON the board; the board's coarse fibre
  shows faintly through the thinner passes and at the very edge of each shape.
  🔴 THERE IS NO SHADING ANYWHERE. No modelling, no cast shadows, no gradients, no highlights.
  Depth is stated by OVERLAP and by a few drawn lines only, never by light.
  Torn or cut cardboard edges are visible ONLY where a box flap is drawn, showing the fluted
  corrugation as a row of short marks - that is the only texture in the book.

PALETTE: four flat values and nothing else. Three are painted; one is the bare board.
  Hex anchors:
    BARE CARDBOARD (never painted) #C6A173, its cut edge / flute #A8834F  -> THIS IS A BOX.
    BONE #EDE6D6   -> bare floorboards AND the light from the roof window. The same colour,
                      because in this book LIGHT AND FREE FLOOR ARE THE SAME THING.
    SLATE #333C46  -> the attic air, the sloping ceiling, the beams, and the squirrel's body.
    CORAL #D4573C  -> the blanket, and ONLY the blanket, in the whole book.
  🔴 THE AMOUNT OF BONE IS THE STORY. It starts as one squirrel-sized patch, is eaten away by
  cardboard page after page, reaches nothing, and comes back as a whole room. Read the BOXES
  line on every page and obey the bone percentage it gives.
  🔴 CORAL IS ONLY EVER THE BLANKET. Not the roof, not a lamp, not a flower, not the sunset.
  There is no fifth colour. There is no white and no black.

🔴 STAGING RULE (this replaces lighting): the squirrel is SLATE, and slate on slate disappears.
  Therefore the squirrel is ALWAYS placed against bare cardboard or against bone, never against
  the slate field. If a page seems to need it in the dark, move the squirrel, not the palette.

COMPOSITION: 30-degree ISOMETRIC projection for every box, on every page.
  🔴 EVERY BOX IS THE SAME SIZE AND THE SAME ANGLE WHEREVER IT SITS IN THE FRAME. A box at the
  back is not drawn smaller than a box at the front. Boxes are countable the way beads on an
  abacus are countable; nothing about the drawing may make one box read as two, or two as one.
  The sloping ceiling is a single straight diagonal that cuts the frame; the roof window is a
  bone rectangle; the floor is a bone field being eaten from the edges.
  Keep the bottom 18% of the image quiet and free of key subject matter (a caption band is laid
  over it later).

FINISH HIERARCHY - read this twice. This is about how FINISHED each area is, NOT about opacity.
  1. THE SQUIRREL AND THE BLANKET = finished. Full flat colour, clean edge, complete shape.
  2. THE BOXES THE SQUIRREL IS TOUCHING ON THAT PAGE = half-finished: the bare board plus one
     drawn line for the open flap and a short row of flute marks on the cut edge.
  3. EVERYTHING ELSE = LEFT AS BARE BOARD WITH A FEW OPEN LINES. Rafters, the unopened moving
     pile, the far wall, the roofline outside the window: two or three straight lines each,
     corners left unclosed, no fill.
  🔴 The background is NOT faded, NOT hazy and NOT desaturated. It is simply not painted.
  A firm dark line on bare board is correct; a soft pale finished object is wrong.
  Never draw every floorboard, every rafter, every flute, every roof tile.
  EXCEPTION - exactly two pages carry density: the page where the city fills the room, and the
  last page of Paris rooftops. On those two, level 2 finish extends to the props.

CHARACTER DESIGN: bodies are single flat shapes. 🔴 THE WORLD IS RECTANGLES AND THE SQUIRREL IS
  THE ONLY CURVE IN IT - that contrast is the whole character language of this book.
  There is no outline drawn around the body; the shape IS the drawing.
  The face is a BONE-coloured shape cut into the head, carrying two small slate marks (eye and
  a short brow stroke). It has no expression range beyond the angle of those two marks, so
  POSTURE AND THE SHAPE OF THE BODY DO THE ACTING.

  FACE SEPARATION (required): the face must read apart from the body in VALUE - the bone mask
  against the slate head - never by adding a colour. Test: at thumbnail size you can still tell
  which way the squirrel is looking. This does NOT add a colour to the palette above.
SETTING: the top floor of a Paris apartment building - a ceiling that slopes to the floor on one
  side, exposed rafters, a small skylight set into the slope, narrow floorboards, a folded iron
  bed frame, a wardrobe rail, clothes hangers, twine, tape, a rolled duvet. Outside the skylight:
  zinc rooftops stepping in layers, chimney stacks, aerials, pigeons.
  European, no Asian architectural motifs.

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT digital airbrush / NOT smooth gradients / NOT glossy 3D CG render / NOT cel-shaded
  anime / NOT a cardboard texture filter laid over flat digital colour (the bare board must BE
  the box, not a pattern printed on it) / NOT photographic / NOT perspective foreshortening of
  the boxes / NOT drop shadows under the boxes / NOT a fully rendered background / NOT every
  floorboard, rafter or roof tile drawn to completion / NOT a hazy, blurry or faded background
  (that is blur, not un-painted) / NOT a fifth colour / NOT coral on anything but the blanket /
  NOT any lettering, numerals, shipping labels or signage anywhere in the image / NOT wool felt,
  NOT stitched fabric, NOT sculpted clay (another line owns those).
```

### 🔴 이 앵커의 두 불변 규칙 (매 컷 반복 확인)

**규칙 A — 상자 원장(元帳).** 컷마다 `BOXES:` 줄을 반드시 읽는다. **화면 안 상자 도형의 개수가 그 숫자와 정확히 같아야 한다.** 도시 전체는 **처음부터 끝까지 상자 아홉 개**이고, 그 아홉이 서고·눕고·접힐 뿐이다.

| | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 세워/눕혀 놓인 상자 | 0 | 1 | 2 | 5 | 7 | 9 | **9** | 9 | 9 | 7 | 4 | **1** |
| 벽에 기댄 납작한 판 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 5 | **8** |
| 뼈빛(빈 바닥+창빛) 면적 | 30% | 26% | 20% | 14% | 9% | 4% | **2%** | 1% | 0%\* | 12% | 30% | 방 전체 |

\* p9 는 바닥의 뼈빛이 0 이고, 뼈빛이 **화면 위 지붕창 네모 하나로 옮겨 간다.**
🔴 **p7 이 상자가 안 늘어나는 첫 쪽이다** — 후렴이 끊기는 쪽과 개수가 멈추는 쪽이 같아야 「길을 낼 자리가 없다」가 그림에서도 성립한다.
🔴 **큰 상자 심음** — 아홉 중 하나는 **뚜껑을 활짝 젖힌 큰 상자**이고, **p5 부터 광장 가장자리에 계속 서 있다.** p5·p6·p7 에서 화면에 있되 아무도 그걸 보지 않는다. p8 에서 처음으로 그것을 본다. 이 심음이 없으면 p8 은 발명이 된다.

**규칙 B — 담요(코랄) 스케줄.** 컷마다 `BLANKET:` 줄을 읽는다. 코랄은 **이 책에서 유일하게 면적이 줄어드는 물건**이다.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 온전히 펴짐 | 귀퉁이가 상자 밑에 깔림 | 양쪽이 물려 폭이 반 | 반으로 접힘(면적 1/2) | 천장 낮은 구석으로 밀려남 | 위에 덮을 것이 없다 | 구석에 손바닥만큼 | 화면 밖 | 없음 | 🔴 어깨에 두름(다시 펴짐) | 어깨에 그대로 | 침대 위에 개켜짐 — 화면 유일 코랄 |

---

## B-01 §3. 캐릭터 시트 3장 (🔴 이것부터 굽는다)

```
CHARACTER SHEET - SquirrelKit   (bake this FIRST, before any scene)

🔴 THE SHEET IS MADE IN THE SAME MEDIUM AS THE BOOK. Opaque flat paint on grey-brown cardboard
  #C6A173, with the board left bare around the figure. Flat colour only, no shading anywhere,
  no outline drawn around the body. Do NOT render this animal smoothly or three-dimensionally
  just because there is no background behind it.

BODY: ONE flat SLATE #333C46 shape - a soft pear, no neck, no drawn contour line.
  🔴 THE SQUIRREL IS THE ONLY CURVE IN A WORLD OF RECTANGLES. Every edge of its body is a
  continuous curve; it must never be built from straight segments.
FACE: a BONE #EDE6D6 shape cut into the front of the head, roughly a rounded triangle running
  from brow to muzzle. On it, exactly two slate marks: one small oval eye and one short straight
  brow stroke above it. No mouth, no nose dot, no blush, no highlight, no catchlight.
  The angle of the brow stroke is the entire facial performance.
EARS: two small slate curves, no inner colour.
🔴 TAIL - THE ACTING INSTRUMENT: a tail as tall as the whole body, one big slate curve that
  curls forward at the tip. It is how the reader reads the mood at thumbnail size:
  curled high over the back = pleased and building / straight up = shouting /
  stopped halfway = the moment the shout is cut off / lying flat along the floor = at rest.
PAWS: front paws are two small bone dashes at the ends of the body shape, so that "holding a box"
  and "pushing a box flat" read as two different actions. Hind feet are not drawn separately.
BUILD & SILHOUETTE: the whole animal is exactly ONE BOX-EDGE TALL. 🔴 This is a measurement, not
  a description - the reader must be able to see that one box is one squirrel high, because the
  last page depends on the squirrel fitting inside one box.
SIGNATURE DETAIL: one small notch cut out of the left ear - a chip in the curve. It survives
  every pose including the back view and is how the reader keeps hold of this animal when it is
  the size of a fingernail (pages 7 and 12).
THE ADULT: see the second sheet. Never draw an adult face in this book.
REFERENCE SHEET: full-body side view standing / three-quarter view lifting a box overhead with
  both front paws / back view showing the tail curl and the ear notch / a curled sleeping pose
  seen from directly above, fitted inside one box outline / three head close-ups showing ONLY
  the brow stroke changing: pleased (brow high and level), stopped (brow level, tail cut short
  in the same drawing), at rest (brow low, eye a shortened oval).
  Plain bare cardboard background, no scenery, no coral.
FACE SEPARATION (required): the bone face mask must stay clearly lighter than the slate head at
  every size. Test: shrink this sheet to thumbnail - you can still tell where it is looking.
  This does NOT add a colour.
SCENE token: SquirrelKit.
```

```
CHARACTER SHEET - BigSquirrel   (adult - bake SECOND, attach as @image2)

🔴 SAME MEDIUM - flat opaque paint on bare cardboard, no shading, no outline.
🔴 THIS CHARACTER HAS NO FACE IN THIS BOOK, EVER. Only two front paws and a tail ever enter the
  frame, always cropped by the frame edge. Do not draw a head, do not draw eyes, do not let the
  face appear "just at the edge". The adult is a pair of hands and a tail, and nothing else.

PAWS: the same slate #333C46 as the child, but the paw shapes are TWICE THE WIDTH of the child's
  and end in four separated finger dashes in bone, so that "an adult is doing this" reads from
  the hands alone.
TAIL: a slate curve of the same shape as the child's but noticeably thicker and NOT curled at
  the tip - it lies straight. Placing the two tails side by side is how a reader sees who is who.
POSTURE CUE: the paws always move slowly and hold things level - one plate at a time, one hanger
  at a time. Never a grabbing or hurried hand shape.
REFERENCE SHEET: both paws lifting a stack of bowls out of a box, cropped at the frame edge /
  one paw hanging a clothes hanger on a rail / the thick straight tail alone, next to the child's
  curled tail for comparison at the same scale.
  Plain bare cardboard background.
SCENE token: BigSquirrel. Never write "Squirrel" alone - SquirrelKit and BigSquirrel are
  different characters and must never be abbreviated to a shared word.
```

```
PROP SHEET - MoveBox   (bake THIRD, attach as @image3 - this sheet is as important as the animals)

🔴 THE BOOK COUNTS THESE. If the box is not the same object on every page, the whole book fails.
  Flat opaque paint on cardboard, 30-degree isometric, no shading, no cast shadow.

THE MODULE: one moving box, drawn as BARE CARDBOARD #C6A173 with its cut edges and flute marks
  in #A8834F. Proportion 1 : 1 : 0.8 (width : depth : height). ONE SQUIRREL TALL.
  🔴 The SAME size and the SAME 30-degree angle wherever it appears in the frame. A box at the
  back of the room is drawn exactly as large as a box at the front. No foreshortening, no
  perspective, no drop shadow.
FOUR STATES, all on this sheet at the same scale:
  1. UPRIGHT CLOSED - a plain isometric cube, four flap lines meeting at the top.
  2. LAID ON ITS SIDE, FLAP OPENED FORWARD = A HOUSE - the opened flap is a bone-free bare board
     rectangle lying on the floor as a doorstep, and the opening it leaves is the ONLY place in
     this book where an interior is drawn, as a flat SLATE rectangle.
  3. STACKED - three of them offset by about a fifth of a width, tallest reaching the rafters.
  4. FLATTENED PANEL - the same box pressed shut, seen edge-on as a thin bare-board rectangle
     leaning against a wall, its fold line drawn as one straight crease.
THE BIG BOX (a fifth drawing, same sheet): ONE box in the city is TWICE the module in every
  dimension, with all four top flaps thrown wide open like petals. Inside it, a bone-coloured
  rectangle of newspaper on the floor and nothing else. 🔴 It stands from page 5 onward and is
  not noticed until page 8, so draw it as plainly as the others - no special lighting, no
  emphasis, no arrow of composition pointing at it.
NOT: no printed labels, no tape brand marks, no writing, no numbers, no barcodes anywhere on any
  box. Tape is a plain bone strip; twine is one slate line.
SCENE tokens: MoveBox and BigBox.
```

---

## B-01 §4. 12컷

각 컷은 `STYLE ANCHOR + @image1(SquirrelKit) + @image2(BigSquirrel) + @image3(MoveBox) + 아래 블록` 으로 합성한다.

### p1 — 이삿날 밤, 상자밖에 없었다
```
CAMERA: wide, low angle at doorway-sill height. The sloping ceiling comes down as ONE straight
  diagonal from the top left to the bottom right of the frame. Isometric floor.
BOXES: 0 placed. The unopened moving pile stands at both sides as a wall of stacked bare board -
  draw it as ONE mass of overlapping rectangles, not as countable modules (these are luggage,
  not the city; the city begins on the next page).
BONE: 30% - one squirrel-sized patch of bare floorboard dead centre, plus the skylight rectangle
  on the ceiling slope. These are the only painted-bone areas in the picture.
SUBJECT: SquirrelKit centre frame, crouched low, both front paws holding the two near corners of
  the blanket and pulling it flat. Body curved into a comma; tail lying flat along the floor;
  brow level; the bone face mask turned down at the blanket, the eye mark rolled up toward the
  ceiling slope.
BLANKET: 🔴 laid out whole and flat - the single largest coral shape in the entire book. It is
  exactly one squirrel long and one squirrel wide, and it sits in the middle of the bone patch.
SETTING: exposed rafters as two straight slate lines, one skylight in the slope, a folded bed
  frame leaning at the left, a rolled duvet, a few hangers, twine.
FINISH: the squirrel and the blanket finished. The floorboards directly under the blanket
  half-finished (three board lines and nothing more). The moving pile, the bed frame, the duvet
  and the rafters are BARE BOARD WITH A FEW OPEN LINES - no fill, corners unclosed.
TONE: no light and no shadow anywhere. The room is dark because the slate field is large, not
  because anything is lit. The eye goes to the one bone patch because it is the only pale area.
```

### p2 — 집 한 채 (후렴 1/5)
```
CAMERA: medium close-up, eye level. The frame is halved: the laid-down box on the left, the
  squirrel on the right, facing each other across the middle.
BOXES: 1 placed - MoveBox in state 2 (laid on its side, flap opened forward as a door).
  Its opening is a flat slate rectangle. This is the only interior in the picture.
BONE: 26% - the floor patch, already notched away where the box now sits.
SUBJECT: SquirrelKit at right, standing tall, one front paw flat on the top face of the box,
  chest lifted, tail STRAIGHT UP - the shouting pose. Brow high. The bone face mask points at
  the dark opening.
BLANKET: 🔴 one corner of the coral is trapped UNDER the near bottom edge of the box, and the
  coral shape is drawn with a bite taken out of that corner. Do not draw a wrinkle or a shadow
  to say it is trapped - the shape itself is interrupted by the box, and that is the whole point.
SETTING: one loose coil of twine as a slate spiral, one bone strip of tape peeled off the box
  side, the unopened pile behind as open lines only.
FINISH: the squirrel, the blanket and the one box finished (box = bare board plus its flap line
  and a short row of flute marks on the cut edge). Everything else bare board with open lines.
TONE: flat. No lamp, no glow, no pool of light.
```

### p3 — 상자 두 개 사이에 골목이 났다 (후렴 2/5)
```
CAMERA: high angle looking down, the two boxes running vertically up the frame with a narrow
  channel between them - a canyon composition. Isometric, so both boxes are identical in size.
BOXES: 2 placed - both in state 2, set side by side one squirrel-width apart. 🔴 The gap between
  them is EXACTLY the width of the squirrel's body; that measurement is what makes it an alley.
BONE: 20% - the floor is now bone only in the alley channel and in a shrinking band at the top.
SUBJECT: SquirrelKit inside the alley, body turned edge-on and squeezed thin, both front paws
  braced on the two box walls, the tail unable to fit in the channel and sticking out behind as
  a curve OUTSIDE the alley. Brow high, face mask aimed up the channel.
BLANKET: 🔴 caught on both sides by the two boxes - the coral shape is now HALF ITS PAGE-2 WIDTH
  and bulges upward in the middle. Same length, half the width. The reader should be able to
  compare it with page 2 at a glance, so keep it at the same place in the frame.
SETTING: a fold line drawn on each box side, a bone tape strip on the floor of the alley, twine
  caught between two floorboards.
FINISH: the squirrel, the blanket and the two boxes finished. The floorboards half-finished
  inside the alley only. Everything beyond the two boxes is bare board with open lines.
TONE: flat and airless. The composition is vertically compressed - that is where the tightness
  comes from, not from darkness.
```

### p4 — 탑은 높은 쪽에만 선다 (후렴 3/5)
```
CAMERA: low angle. 🔴 THE SLOPING CEILING IS THE SUBJECT OF THE COMPOSITION - one straight
  diagonal running from the top right down to the bottom left, and the tower is built exactly
  into the tall corner where it fits. Isometric boxes as always.
BOXES: 5 placed - the 2 houses from before, plus a stack of 3 (state 3) rising to the rafters.
  🔴 On the LOW side of the room, at the same depth in the frame, one of the houses sits under
  the slope with barely a box-height of clearance, so the reader sees in one look why the tower
  could not stand there. Both must be at the same depth - do not put the low one in the distance.
BONE: 14%.
SUBJECT: SquirrelKit at lower centre, up on its hind feet with both front paws pushing the third
  box onto the top of the stack, body arched backward into a deep curve, tail curled forward for
  balance, brow high, face mask aimed at the top of the tower.
BLANKET: 🔴 FOLDED IN HALF - the coral is now a rectangle of exactly half its page-3 area and
  its fold is drawn as one straight crease line. It has been pushed to the foot of the tower.
SETTING: two rafters as straight lines, one nail as a single slate dash, a peeled tape strip on
  the floor.
FINISH: the squirrel, the blanket and the five boxes finished. The rafter the tower nearly
  touches half-finished. The rest of the room is bare board with open lines.
TONE: flat. The pressure comes from the diagonal of the ceiling closing on the top of the tower,
  never from shading.
```

### p5 — 광장에는 빛이 네모나게 떨어진다 (후렴 4/5)
```
CAMERA: high angle from just inside the skylight, looking straight down at the floor. The bone
  rectangle of window-light sits dead centre as a framed square.
BOXES: 7 placed - the 5 from before, plus 2 more laid down to close the ring around the light.
  🔴 THE BIG BOX IS PLANTED HERE: it stands at the edge of the ring, flaps thrown wide, drawn no
  differently from the others - no emphasis, no compositional arrow, nothing pointing at it.
  It is simply there, and the page is not about it.
BONE: 9% - and 🔴 nearly all of the remaining bone is now the window rectangle itself. Free floor
  and light have become the same small square, which is the point of this page.
SUBJECT: SquirrelKit at the centre of the bone square, up on hind feet, spinning - both front
  paws out sideways, body a leaning curve, tail flung wide, face mask tipped back to look
  straight up at the camera. This is the widest, most open pose in the book.
BLANKET: 🔴 pushed into the corner where the ceiling meets the floor, folded double, and the bone
  does not reach it. Draw it small, at the very edge of the frame, diagonally opposite the light
  square. The two coral and bone shapes face each other across the diagonal.
SETTING: flattened box flaps laid as a floor for the plaza (bare board, one crease line each),
  the ring of box tops seen from above as identical squares.
FINISH: the squirrel, the blanket and the ring boxes finished. The plaza floor flaps
  half-finished. The rafters and walls bare board with open lines.
TONE: flat. The bone square is not a beam of light and casts nothing - it is a painted rectangle.
```

### p6 — 이불이 강이 되어서 (후렴 5/5)
```
CAMERA: side view, medium wide, eye level. A horizontal band of duvet crosses the whole frame
  and the hanger bridge crosses it - a cross composition.
BOXES: 9 placed - the 7 from before, plus 2 supporting the ends of the bridge.
  🔴 THIS IS THE FULL CITY. Every box the book owns is now standing. Count them.
BONE: 4%.
SUBJECT: SquirrelKit at the centre of the bridge, one hind foot lifted, both front paws out
  sideways, body a wobbling curve, tail counterweighted the other way. Brow level, face mask
  aimed down at the duvet.
SETTING: the rolled duvet unrolled into a long slate band with its folds drawn as three or four
  straight parallel lines (NOT painted waves, NOT shading); two wooden hangers laid across it as
  two straight bone lines, resting on the two support boxes.
BLANKET: 🔴 still folded double in the ceiling corner, and NOTHING IS OVER IT. The duvet band and
  the coral rectangle are in the same frame, and the gap of bare floor between them is the page.
  Keep both at the same depth so the reader can compare "what is now a river" with "what is left
  to sleep under".
FINISH: the squirrel, the blanket and the bridge finished. The duvet band and the two support
  boxes half-finished. Everything else bare board with open lines.
TONE: flat. Do not warm the blanket corner and do not cool the duvet - the palette is fixed.
```

### p7 — 길을 낼 자리가 없었다 🔴 밀도 배급 1/2
```
CAMERA: extreme wide, high angle from the corner above the door, the whole attic in one
  isometric plan. SquirrelKit is the smallest thing on the page.
BOXES: 🔴 9 - AND NOT ONE MORE. This is the first page where the count does not rise, and that
  is why the sentence stops. Every one of the nine is visible and separately countable: 4 laid
  as houses (two of them forming the alley), 3 stacked as the tower, 2 holding the bridge, and
  among the houses the BIG BOX still standing open at the plaza edge, still unremarked.
BONE: 🔴 2% - two floorboards in front of the door, and nothing else. The window rectangle is
  gone from the floor because a box now stands in it.
SUBJECT: SquirrelKit at the very bottom edge of the frame, tiny, both hind feet pressed together
  on the last two boards, one front paw raised halfway to its mouth AND STOPPED THERE.
  🔴 THE TAIL IS THE SENTENCE: it starts to rise as on pages 2-6 and is cut off halfway, bent
  at its middle instead of curling. Brow level, face mask turned across the whole city.
BLANKET: a coral shape the size of a paw in the ceiling corner, nearly out of the frame.
FINISH: 🔴 DENSITY PAGE 1 OF 2. All nine boxes go to half-finished (bare board plus flap lines
  and flute marks) even where the squirrel is not touching them, because this page IS the count.
  The squirrel and the blanket finished. Rafters, walls and the unopened luggage stay bare board
  with open lines. 🔴 Density lives in the boxes only - never in the floorboards.
TONE: flat and completely full. The only rest for the eye is the two bone boards at the bottom,
  and that is the whole feeling of the page.
```

### p8 — 뚜껑이 열린 채, 안은 텅 비어 있었다
```
CAMERA: over the shoulder, close. The back of SquirrelKit's head and one ear fill the bottom of
  the frame; beyond it the open mouth of the big box fills the rest.
BOXES: 9 (unchanged). Only three are in frame: the BIG BOX and two neighbours.
BONE: 1% - a strip of newspaper lying on the floor inside the big box. 🔴 That scrap of bone is
  the only free floor left anywhere in the book, and it is INSIDE the box. Do not add any other
  bone to this page.
SUBJECT: SquirrelKit seen from behind at the bottom of the frame, one ear (the notched one)
  rotated forward, head tilted, the whole body shape settled and slack - the built-up curve of
  the previous pages gone out of it. Tail lying flat along the floor.
SETTING: the big box with all four flaps thrown wide as petals, its opening a flat slate
  rectangle, the newspaper scrap inside; the flattened flaps of the plaza floor around its foot.
BLANKET: not in frame.
FINISH: the squirrel and the big box finished, including the flute marks on all four flap edges.
  The plaza floor half-finished. The neighbouring boxes and everything behind are bare board with
  open lines.
TONE: flat. The slate rectangle of the opening is the darkest area on the page simply because it
  is the largest slate shape, not because anything is unlit.
```

### p9 — 딱 다람쥐만 한 자리였다
```
CAMERA: 🔴 straight top-down, vertically above. A rectangle inside a rectangle: the box walls
  make the inner frame, the skylight makes the outer one at the top of the picture.
BOXES: 9 (unchanged). Three are in frame as the edges of the composition.
BONE: 🔴 0% ON THE FLOOR. All the bone in this picture has moved UP: the skylight rectangle at
  the top of the frame, and the newspaper scrap under the squirrel. That migration is the page.
SUBJECT: SquirrelKit lying on its back at the exact centre of the big box floor, body stretched
  out straight for the first and only time in the book, front paws folded on its stomach, tail
  laid out in line with the body instead of curled. 🔴 Its length is exactly the inside width of
  the box - paws almost touching one wall, tail tip almost touching the other. Brow low, eye
  mark a shortened oval, face mask pointing straight up at the camera.
SETTING: the four flaps thrown open around the box like petals, a strip of bone newspaper under
  the body, and at the top edge of the frame the skylight as a bone rectangle with four or five
  small slate marks in it for stars, plus one bird silhouette on the frame.
BLANKET: none. 🔴 The blanket is not in this picture and is not missed - do not sneak coral in.
FINISH: the squirrel and the box interior finished. The four flaps half-finished. The plaza floor
  and the roof structure around the skylight are bare board with open lines.
TONE: the quietest page in the book. Two bone rectangles, one small curved animal, nothing else.
```

### p10 — 아침에 짐을 풀기 시작했다
```
CAMERA: medium, slightly below eye level. BigSquirrel's paws and tail enter from the left edge;
  SquirrelKit sits at the right; the empty floor between them is the middle of the frame.
BOXES: 7 standing (2 fewer - the alley pair is gone). PANELS: 2 leaning flat against the wall.
  🔴 The reader must be able to see that 2 + 7 = 9. Keep the panels the same width as a box face.
BONE: 12% - a bright bone rectangle of bare floorboard exactly where the alley was, the same
  width as the gap on page 3. That patch is the subject of the page.
SUBJECT: left edge - BigSquirrel's two broad paws lifting a stack of bowls out of a box, and the
  thick straight tail below them; NO HEAD, NO FACE, cropped by the frame. Right - SquirrelKit
  sitting, body a settled curve, head tilted, tail lying flat, brow level, face mask turned to
  the empty floor patch, not to the adult.
BLANKET: 🔴 the coral is back at FULL SIZE, worn around SquirrelKit's shoulders. Same shape as
  page 1, now vertical instead of flat. It is the only coral in the frame.
SETTING: five bone bowls set down in a row, a slate roll of newspaper, one flattened panel
  leaning against the wall with its crease line drawn, an open wardrobe rail at the back left
  with the two hangers of yesterday's bridge on it, the bed frame assembled at the back right
  with the duvet folded on top of it as a flat slate rectangle.
FINISH: the squirrel, the adult's paws, the blanket and the bare floor patch finished. The bowls
  and the two panels half-finished. The tower, the plaza and the far wall bare board, open lines.
TONE: flat and open. Nothing is lit - the page reads as morning because the bone area has grown.
```

### p11 — 탑은 위에서부터 한 장씩 접혔다
```
CAMERA: low angle at the tall wall - 🔴 THE SAME WALL AND THE SAME ANGLE AS PAGE 4, so that the
  tower's height can be compared directly. The ceiling diagonal is in the same place in frame.
BOXES: 4 standing. PANELS: 5 leaning against the wall. (4 + 5 = 9 - keep it exact.)
  🔴 The tower is now shorter than the squirrel is tall, in the same corner where it once reached
  the rafter. That comparison is the whole page, so both the rafter and the tower must be in the
  frame at the same depth as on page 4.
BONE: 30% - wide bare floorboards where the tower stood, drawn as clean bone with three board
  lines.
SUBJECT: SquirrelKit at centre, both front paws pressing down on the last box of the tower and
  folding it flat, body arched forward over the paws, one hind foot lifted off the floor, tail
  thrown back the other way for balance. Brow driven low. Working, not sad.
SETTING: the folding box drawn mid-fold - its side buckling into a shallow V along one crease
  line, one bone strip of tape peeling away as a thin curl; the five finished panels leaning
  against the wall in a row, each one crease line; a single nail in the rafter.
BLANKET: coral still worn around the shoulders, unchanged from page 10.
FINISH: the squirrel, the folding box and the five panels finished. The floorboards under the
  tower half-finished. Rafters, walls and the far side of the room bare board with open lines.
TONE: flat and even. Nothing dramatic - a job being finished.
```

### p12 — 창 아래, 상자 하나가 아직 열린 채 🔴 밀도 배급 2/2
```
CAMERA: 🔴 extreme wide, from ABOVE THE ROOFTOPS, looking down at an angle across the roofs of
  Paris. This viewpoint is used once, here, and nowhere else in the book. The room occupies about
  a palm's width of the picture; everything else is roof.
BOXES: 1 standing (the big box, flaps open, inside the room). PANELS: 8 leaning against the room
  wall. (1 + 8 = 9 - the whole city is accounted for on the last page.)
BONE: the whole floor of the room is bone now, seen through the skylight rectangle - but because
  the room is tiny in frame, the bone area on the PAGE is small. 🔴 That contradiction is the
  ending: the floor is completely free and it does not matter any more.
SUBJECT: inside the skylight rectangle - the big box, and inside the box SquirrelKit, front paws
  hooked over the box edge with its chin resting on them, face mask turned straight up at the
  camera, tail tip hanging outside the box. Drawn very small, but the two slate marks of the eye
  and brow must still be placed so we know it is looking at us. No other character anywhere.
BLANKET: 🔴 one small coral rectangle folded on the bed - the only coral on the page, and the
  last coral in the book. Place it where the reader will find it after finding the squirrel.
SETTING: 🔴 THE PAGE IS THE ROOFTOPS. Zinc roofs as flat slate quadrilaterals stepping and
  overlapping to the edge of the frame, chimney stacks as clusters of small bare-board
  rectangles, aerials as single lines, two pigeons as small slate shapes, washing on a line,
  and OTHER WINDOWS - a scatter of small bone rectangles across the roofscape, so that our
  window reads as one of many. 🔴 THE ROOF SHAPES AND THE CARDBOARD BOXES MUST READ AS THE SAME
  KIND OF SHAPE - same 30-degree angle, same family of rectangles. This equivalence is the
  ending of the book; it is stated by geometry and never by a caption.
FINISH: 🔴 DENSITY PAGE 2 OF 2. The rooftop field goes to half-finished - the quadrilaterals,
  the chimney clusters and the scattered bone windows are all properly drawn, because this page
  has to be a city. The squirrel, its box and the blanket are finished. The interior beyond the
  bed and the panels stays bare board with open lines. 🔴 No roof gets its tiles or seams drawn -
  density lives in the number of shapes, not in the detail of any one of them.
TONE: flat, wide, even. The roofscape is the largest slate field in the book, the window is the
  brightest bone shape, and the eye travels roofs -> one window -> one box -> one squirrel.
```

---

## 첫 렌더 검수 체크리스트 (B-01)

> 사용자가 GPT 로 뽑은 뒤 이걸로 판정한다. 🔴 **하나라도 걸리면 문구를 늘리지 말고 ref 를 바꿔라**(§5.1 교훈).

| # | 볼 것 | 실패 시 처방 |
|---|---|---|
| 1 | 🔴 **상자를 세어 봤을 때 규칙 A 의 숫자와 맞나.** p3=2 · p4=5 · p6=9 · p7=9 · p12=1+8. 셋 이상 어긋나면 이 권은 성립하지 않는다 | 상자 시트(@image3)를 다시 굽는다. 시트에서 네 상태가 같은 크기로 안 서면 장면에선 절대 안 선다(§2.4) |
| 2 | 🔴 **원근이 크기를 뒤집었나.** 뒤쪽 상자가 앞쪽보다 작게 그려졌으면 실패 — 개수도 죽고, 비교되는 두 것이 다른 깊이에 놓이는 기왕의 결함이 재발한 것 | COMPOSITION 의 등축 문장을 **컷 블록 안으로** 옮겨 재시도. p4(높은 쪽 탑 ↔ 낮은 쪽 눕힌 상자)로 판정하는 게 가장 빠르다 |
| 3 | **뼈빛 면적이 스케줄대로 줄었나.** p1·p7·p12 세 장을 나란히 놓고 본다. p7 에 바닥이 넉넉히 남아 있으면 착지가 통째로 죽는다 | p7 을 다시 굽되 「바닥에 남은 뼈빛은 마루 널 두 장」을 SUBJECT 줄 맨 앞으로 올린다 |
| 4 | **코랄이 담요 밖으로 샜나**(지붕·불빛·해). 한 점이라도 새면 이 앵커의 유일한 악센트가 무너진 것 | PALETTE 의 "coral is only ever the blanket" 뒤에 그 쪽에서 실제로 샌 사물을 이름으로 못 박고 재시도 |
| 5 | 🔴 **그림자가 생겼나.** 상자 밑에 드리운 그림자, 부드러운 명암, 종이 질감 필터가 보이면 실패 — 이 매체는 평칠이고 깊이는 겹침으로만 온다 | 문구 튜닝 금지. **그림자 없는 승인 컷 1장을 확보해 ref 로 고정**하고 나머지를 그 뒤에 뽑는다 |
| 6 | **p12 에서 지붕과 상자가 같은 도형으로 읽히나.** 지붕이 사실적으로 그려져 있으면 「이 방도 상자 한 칸」이 사라진다 | p7 승인본을 p12 의 ref 로 함께 붙여 재시도(도형의 각도를 문구로 재현시키려 하지 말 것) |
