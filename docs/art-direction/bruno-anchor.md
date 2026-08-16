# 브루노 할아버지네 숲 — 앵커 + 캐스트 시트

> 창작동화 **시리즈 05** (25권 · 250쪽). 설계 SSOT = `docs/changjak-books/bruno/_design.md` ·
> 대본 = `docs/changjak-books/bruno/*.md` · SCENE = `_scenes.json`
> 🔴 **이미지 생성은 여기서 하지 않는다.** 프롬프트까지가 이 문서의 일이다.
> 🔴 **한 시리즈 = 한 그림체.** 이 시리즈는 **크레용 전권** — `mei-anchor.md` §3 보류분
> `mei-crayonchalet` 을 가져와 캐스트·무대를 갈아 끼운 것이다. 슬러그 = `bruno-crayonwood`.

---

## §0. 설계 — 왜 크레용인가

**인물이 둘뿐이다.** 다른 시리즈는 다섯·넷이 화면을 채우는데 여기는 곰 둘이고, 그중 하나는
매 권 p8 에 한 번 나서는 할아버지다. 🔴 **화면을 채우는 것은 숲과 계절이다.**

그래서 「인물을 잘 그리는 매체」가 아니라 **「한 가지 재료로 25권을 다르게 만들 수 있는 매체」**
가 필요했다. 크레용은 그 일을 **압력이 아니라 밀도로** 한다 — 밀랍이 종이 결의 높은 데만 걸리고
파인 데를 건너뛰므로, 같은 초록을 같은 힘으로 칠해도 **덮인 비율**만 바꾸면 봄의 성긴 잎과
여름의 빽빽한 우듬지가 갈린다. 색을 하나도 안 늘리고 계절 넷을 낸다.

### 🔴 가을이 이 앵커의 급소였고, 그것이 설계가 됐다

두 색이 「가문비 초록 + 나무껍질 갈색」인데 **가을 잎은 주황·빨강**이다. 색을 더할 수는 없다.

> **가을엔 두 크레용이 일을 맞바꾼다.** 갈색이 머리 위 우듬지를 통째로 맡고, 초록은 상록수
> 몇 그루로 물러난다. 봄·여름엔 초록이 위·갈색이 아래였던 화면이 가을에 **위아래가 뒤집힌다.**

이게 「무대 조항은 매체·색을 안 바꾸고 두 색이 무엇을 하는지만 정한다」의 가장 깨끗한 예다.
겨울은 반대편 극단이다 — **땅도 하늘도 통째로 맨 종이**고, 두 크레용은 그 위에 선 것만 그린다.

### 🔴 하늘·물을 아예 안 칠한다 (파란 장화를 지키는 법)

설계서는 「하늘·물 = 종이색/옅은 회청, 블루베리 = 먹보라」로 파랑 충돌을 막으려 했다.
**더 세게 갔다 — 하늘도 물도 얼음도 전부 맨 종이다.** 옅은 회청조차 안 쓴다.
그러면 이 숲에서 파란 것은 **닐스의 장화 하나뿐**이 되고, 19권 p5(문간의 파란 장화 = 망설임의
그림)가 시리즈 통틀어 유일한 색점이 된다. 블루베리는 겹침색(먹보라)이다.

---

## §1. 앵커 — `bruno-crayonwood`

```
STYLE ANCHOR - bruno-crayonwood   (a bear cub and his grandfather in a Swedish forest / wax crayon,
                                   snagged on the grain)

Style: wax crayon on oat-grey toothy paper, exactly TWO crayons, 4-6 year old picture book. Crayon
  SKIPS - it catches the high points of the paper and misses the pits, so every area is a broken
  field of wax with the paper's grain showing through and NO AREA IS EVER SOLID. Pressure is even
  everywhere; the breaking is the paper's doing, not the hand's. Where the two crayons overlay, a
  third darker colour appears - that is the only dark. Unwaxed paper is not white space, it is the
  sky, the water and the snow. SHADING IS ZERO - the only variation is WHERE THE WAX SKIPPED, and
  how much of the area it covers.

RENDERING (finish hierarchy): an area is ONE field of one crayon laid in ONE direction, never denser
  or lighter inside itself. Direction NEVER changes inside one area - it changes only where one thing
  ends and another begins, and THAT CHANGE OF DIRECTION IS THE EDGE. FINISHED THINGS PER PAGE = 2,
  the bear the page is about and the one thing that bear touches; everything else is a shape with no
  interior detail. Repeats are capped and the cap is the whole design: trunks at most 9 · boughs on
  one tree at most 7 · logs in a stack at most 6 · berries at most 9 dots · seeds at most 9 dots ·
  planks at most 6 · cabin windows at most 4 · birds at most 3 · falling snow at most 14 bare paper
  points · stars at most 14 bare paper points · steam at most 5 curls. Nothing in a repeat is a
  mirrored copy of its neighbour. Wax coverage is at most 80 percent, never solid.
  DENSITY RATION = none.
  🔴 DEPTH IS SPACING, NEVER DARKNESS. Deeper in the wood the trunks stand CLOSER TOGETHER at the
  same weight of wax. Nothing recedes by getting darker, paler, bluer or softer.
  🔴 HANDS - eight volumes turn on what a paw does and the grandfather says nothing (02 · 03 · 07 ·
  09 · 11 · 15 · 20 · 22). On those pages the paw is the second finished thing, but THE FRAME STAYS
  WIDE ENOUGH TO HOLD BOTH BEARS FROM THE KNEE UP. Never a paw alone filling the frame, never a
  close-up that loses whose paw it is.

PALETTE: PAPER OAT GREY #E9E3D3, sky, water, ice, snow, light, everything not waxed · CRAYON1 SPRUCE
  #4F6B4E, needles, leaves, moss, the vegetable bed, painted shutters, the grandfather's knitted
  vest - the cool one · CRAYON2 BARK #96674A, trunks, the cabin logs, floors, tools, baskets, ground,
  autumn leaves - the warm one · OVERLAY PEAT #2E3A2A, bear backs and heads, iron, the inside of the
  woodshed, night, blueberries, anything in shade - overlay only, never a third crayon · ACCENT BOOT
  BLUE #1C4E8A, 🔴 nothing but Nils's boots. 🔴 SKY, WATER, ICE AND SNOW ARE NEVER WAXED - there is
  no pale blue anywhere and no white crayon anywhere, ever. No purple, no pink, no orange, no red.

STAGE CLAUSES (the stage changes what the two crayons do, never which two they are):
  🔴 SPRING (volumes 01-06) - the canopy is bare PAPER; SPRUCE appears only as new growth, sparse
    marks low down and at branch tips, coverage well under half. The ground is BARK. Melt water is
    bare paper. Everything is at its most open and the paper does most of the work.
  🔴 SUMMER (volumes 07-12) - SPRUCE becomes ONE field overhead covering the top of the page, at its
    fullest coverage. BARK is the trunks and the forest floor beneath it. Blueberries are OVERLAY
    dots, at most 9, and they are the only near-black thing in daylight.
  🔴 AUTUMN (volumes 13-18) - THE TWO CRAYONS SWAP JOBS. BARK now takes the canopy as ONE field
    overhead; SPRUCE retreats to at most 3 evergreens standing among the bare trunks. The ground is
    BARK too, laid in a second field running the other way, and the change of direction is the only
    thing that separates ground from tree. This is the fullest page in the series.
  🔴 WINTER (volumes 19-25) - the ground and the sky are not waxed at all, BARE PAPER from edge to
    edge, and the two crayons draw ONLY what stands on it. Snow on a bough is the paper left, with at
    most 3 BARK marks along its underside. Ice on the lake is bare paper; the hole cut in it is
    OVERLAY with a hard edge. There is no white crayon and no blue shadow on snow.
  CABIN - each surface is ONE repeated mark: floor a plank stroke, wall a short dash, cloth a zigzag.
    The mark is the SAME shape every time and may run off an edge but is never redrawn. Beams,
    furniture and shelves are BARK; cloth, shutters and the vest are SPRUCE. 🔴 FIRELIGHT AND
    LAMPLIGHT ARE BARE PAPER and are the brightest thing on the page. A thing being looked for is
    drawn with its own clear silhouette while everything it hides among is the repeated mark.
  WATER - the brook and the lake are BARE PAPER, 0 ripples, 0 glints, 0 reflections. A thing in the
    water is OVERLAY lying inside that bare shape, hard edge, never distorted. A thing on the water
    sits on top with its whole shape showing. Banks, stones and logs are BARK with the marks running
    ALONG the thing, not across it.
  NIGHT (volumes 11, 25) - the sky is OVERLAY laid as one field. Stars, the moon and the glow-worms
    in the grass are BARE PAPER points, each taken on its own, at most 14. 🔴 The glow-worms are
    DOWN IN THE GRASS, never in the air.

CHARACTER DESIGN LANGUAGE: the bears are built from the same marks as the world - two or three
  shapes with limbs laid over. GRADE: bipedal, standing upright, wearing cloth. Backs and heads are
  OVERLAY, chests and bellies are BARK, so both bears are built the same way.
  🔴 ONE ACTION DRAWN AT TWO SIZES. On every page both bears are doing the SAME thing at the same
  limb angles and the same tilt of head, one body twice the height and much wider. Never one bear
  acting while the other only watches.
  Eyes are TWO SHORT WAX STROKES, never round dots - pressed and dragged a little, each ending broken
  where the wax skipped; a nose of the same stroke; the mouth is ONE curve; above each eye ONE short
  stroke. Feeling is in the mouth curve and the two brow strokes; an eye stroke lengthens or shuts
  but never becomes a dot.
  THE TWO, separable at thumbnail size: NILS a small bear cub, round-headed, the smaller figure by
  half, 🔴 BLUE BOOTS in every season and the only blue in the forest · BRUNO GRANDFATHER a large
  round bear, twice Nils's height and much wider, a grey muzzle, a SPRUCE knitted vest and round
  glasses. 🔴 NO WALKING STICK - he does the forest work himself and his hands are always free or
  full of the work. He never carries blue. He is only ever shown doing the same task Nils is doing.
  🔴 THERE IS NOBODY ELSE. Birds, squirrels and fish appear as plain shapes with no clothes, no
  eyebrows and no expression - they are weather, not cast.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow, 3D render or soft feathered edge / no blended, smudged or scraped
  wax / no white crayon / no close-up of a paw alone.
```

**관통 줄** (매 쪽)

```
GRAIN: the wax skips - the paper's grain shows through every area, nothing is ever solid
LIGHT: sky, water, ice and snow are BARE PAPER - never waxed, never white
BOOTS: the only pure blue in the forest is Nils's boots
TWO:   there are two bears and nobody else - the forest and the season fill the rest
```

🔴 **`TWO:` 는 인원 제한이 아니라 화면 지시다.** 인물이 둘뿐인 화면은 모델이 자꾸 **여백을 채우려고**
다른 동물·아이·오두막 사람을 불러들인다. 관통 줄이 「나머지는 숲과 계절이 채운다」를 매 쪽 못박는다.

🔴 **계절 조항은 쪽별 프롬프트마다 그 권의 것 하나만 붙인다.** 넷을 다 붙이면 모델이 섞는다
(가을 조항의 「두 크레용이 일을 맞바꾼다」가 여름 쪽에 새면 여름 숲이 갈색이 된다).

---

## §2. 캐스트 시트

한 장에 둘을 다 그린다. 인물이 둘뿐이라 **키 차이와 부피 차이가 이 시트의 전부**다 —
250쪽 내내 이 둘만 나오므로 비례가 한 번 흔들리면 숨을 곳이 없다.

```
CHARACTER SHEET - bruno forest   (two characters, one sheet)

[여기에 §1 의 Style / PALETTE / CHARACTER DESIGN LANGUAGE 세 문단을 그대로 붙인다]

SHEET LAYOUT: one oat-grey sheet, two bears standing on a single ground line at their true relative
  heights - Bruno twice Nils's height and much wider, Nils reaching only to the top of Bruno's thigh.
  Each character is drawn THREE times: front standing, three-quarter walking, and back. 🔴 Add ONE
  extra drawing of the two of them side by side, touching shoulder to hip, so the height difference
  is fixed as a single shape.
  Nothing else on the sheet - no props, no scenery, no season, no ground beyond the one line.
🔴 No lettering, numerals, labels or name tags anywhere on the sheet.
```

🔴 시트가 나오면 기획서 §2 카드에 붙여넣는다(R2 `comic-assets/bruno-plan`, 키 = 캐릭터 key).
회차 페이지의 「🎬 이 화 등장」 스트립이 그 이미지를 읽어 온다.

🔴 **`bruno-core.js` 의 STYLE 도 이 앵커와 같이 고친다.**
