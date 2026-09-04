# 메이네 산마을 — 무대·사물 시트

> art-director 산출물 (2026-08-16 · **사물 시트 2026-09-04**). 시리즈 02 `mei-pencilslope` ·
> **50권 500쪽**(§1·§3·§4 의 「25권」은 늘기 전 숫자다).
> 🔴 앵커 SSOT = `mei-anchor.md`. 자리 후보 = `_stages.json` · **사물 후보 = `_PROP-SHEETS.md` 의
> `## mei` 절**(43권 · 58장) · 대본 = `_scenes.json`
> 🔴 **작업표는 바닥이지 천장이 아니다** — 이번 판에서 표에 없던 다섯 장(`Ball`·`Snowman`·`WallPegs`·
> `FurHat`·`Kite`)과 표에 통째로 없던 두 권(16 · 31)을 `_scenes.json` 을 직접 훑어 찾아 넣었다.
> 무엇이 왜 빠졌는지는 §2 끝 「작업표가 틀린 자리」에 적었다.
> ⚠️ `mei-core.js` 가 앵커 한국어 압축본 사본을 들고 있다 — 화면에 붙일 거면 거기도 같이 본다.

---

## §0. 🔴 매체 번역 한 줄 — 🔴 **브루노와 갈리는 자리가 이것 하나다**

메이(색연필)와 브루노(왁스 크레용)는 매체가 위험할 만큼 가깝다. 둘 다 「획 방향이 바뀌는 자리가
가장자리」다. **갈리는 문장이 앵커에 정확히 하나 있다.**

> mei: `A thing sitting on that field is drawn with a harder point so its outline is ONE CONTINUOUS LINE.`
> bruno: 윤곽선이라는 것이 **아예 없다**.

🔴 **메이에는 윤곽선이 있다 — 단, 「그 면 위에 놓인 것」에만.** 그러므로 자리 시트가 정하는 것은
**「어느 것이 면이고 어느 것이 그 위에 놓인 것인가」**다. 비탈·물·벽·바닥은 면(윤곽 없음), 썰매·통나무·
냄비·말뚝은 그 위에 놓인 것(단단한 심으로 윤곽 한 줄). 🔴 **이 구별이 흔들리면 두 시리즈가 한 그림체가
된다** — 첫 렌더 검수 1번 항목으로 둘을 나란히 놓고 본다.

⚠️ 둘째 — 🔴 **불빛·등불은 안 칠한 종이**이고, **찾는 것은 제 윤곽을 갖고 나머지는 반복 마크**다
(코코의 블록 규칙과 같은 자리 · 15권 미끄럼틀·10권 계단이 그 권이다).

---

## §1. 자리 시트 — 8장 (2026-09-04: 5장 + 세 장 신설)

🔴 **세 장을 새로 썼다.** 앵커에 `BROOK` 조항이 **있는데** 자리 시트가 없어서, 사물 시트 여섯 장
(`SteppingStones`·`Log`·`Rock`·`Ice`·`Berries`·`StoneWall`)이 **자리 없는 물 위와 길 위에 떠 있었다**
(§2-A ⑤). `Path` 없이는 20권 첫 쪽이 아예 성립하지 않는다 — 그 권은 **짧은 길과 먼 길이 같은 지붕에서
만나는 한 화면**이 전부다. 검사 = `node packages/client/scripts/check-stage-tokens.mjs mei` → **0**.

| 시트 | = 후보 | 왜 하나인가 |
|---|---|---|
| `Piazza` | 마을 광장 · 광장 · 무대 위와 광장 · 계단 · 무대 옆 계단 · 계단 첫 칸 · 화덕 앞 · 종탑 밑 | 광장에 무대·계단·화덕·종탑이 다 있다. SPOT `Piazza/A`~`Piazza/E` |
| `Slope` | 비탈 풀밭 · 비탈 · 마을 뒤 비탈 · 비탈 아래 눈밭 · 🆕 굴밭 · 🆕 산장 앞 마당과 문 앞 계단 · 🆕 사과나무 밑 · 🆕 비탈 꼭대기 바위 · 🆕 눈굴 | 🔴 **썰매 다섯이 좌표**. 🔴 **눈 아닌 자리가 절반이다** — 34·38·41·43·44 가 각 열 쪽 → §1.1 에 여섯을 더했다 |
| `Chalet` | 산장 부엌 · 산장 문간 · 탁자 앞 · 긴 식탁 · 난로 옆 · 이층 계단 · 🆕 산장 뒤 통 자리 · 🆕 처마 | §1.6. 🔴 **문 안쪽부터** — 앞 마당·계단은 `Slope` |
| `Seats` | 메이 자리 · 루디 자리 · 소소 자리 | 🔴 **자리가 아니라 「누구의 자리인가」** · §3 |
| `Slide` | 미끄럼틀 계단 앞 · 계단 앞 | 15권 · §1.6 |
| 🆕 `Brook` | 개울 · 개울 둑 · 개울 속 바위 · 웅덩이 · 언 개울 · 얼음 위 · 통나무 위 | **38쪽 · 6권**(05·19·26·35·49 + 11). 🔴 최다 · §1.3 |
| 🆕 `Path` | 산길 · 산길 초입/중턱 · 지름길 · 먼 길 · 갈림길 앞 · 바위 꼭대기 · 소소 집 앞 | **17쪽 · 4권**(04·11·13·20) · §1.4 |
| 🆕 `Wood` | 숲 어귀 · 숲 안 · 숲 깊은 곳 · 숲속 덤불 앞 · 밤나무 아래 | **13쪽 · 3권**(04·32) · §1.5 |

### 🔴 §1.0 여덟 장 공통 — `WHERE TWO BODIES TOUCH` (2026-09-05 신설)

여덟 장의 SPOTS 가 **예외 없이 「자리를 보는 카메라」**다. 그런데 권마다 두세 쪽이 **볼에 닿은 가시 하나 ·
이마를 댄 배 · 등에 통째로 얹힌 손 · 손을 경계로 갈린 등**이고 **그게 대개 그 권이 도는 쪽**이다(48권은 그것이
착지다). 사물 시트는 `STATES` 만 들고 **카메라를 안 든다** — 그래서 여덟 장 전부에 스팟 하나를 더한다.
시트마다 다시 안 적고 여기 한 번만 적는다.

```
SPOT (all eight sheets) - WHERE TWO BODIES TOUCH   close, at the height of the touch itself.

Two bodies (or a hand and the thing it holds) filling the frame, cropped at the touch. 🔴 ONLY THE
ONE TOUCHING POINT IS FINISHED - the cheek where the spine presses it, the fingers where they close,
the hand where it lies on a back. Everything round it is the loosest work this medium has: a field
with no outline, its strokes wider apart than anywhere else on the page. 🔴 THE BACKGROUND IS ONE
FIELD OF THAT PLACE'S OWN COLOUR AND NOTHING ELSE - no furniture, no horizon, no second event:
  Slope one MOSS field (bare PAPER in snow) · Piazza one EARTH field · Chalet that surface's own
  repeated mark, one only · Brook one MOSS field · Path bare PAPER · Wood one EARTH trunk with the
  MOSS shade field behind it · Seats the table's plank stroke · Slide the plank stroke.
🔴 WHEN ONE THING FILLS THE FRAME ITS FINISH GOES UP ONE STEP AND ONLY ONE: it keeps its single
outline and gains AT MOST ONE mark it did not have at arm's length (a crease, a bead, a dent). It
never becomes a modelled object and it never gains shading. The same thing at arm's length on the
next page loses that mark - 🔴 that pair is what says the camera moved, not the thing.
🔴 THE ACCENT IS NOT INVENTED INTO THE CORNER OF THIS SPOT. Where the crop cannot hold the child's
orange thing, the crop is the reason and the orange stays out.
```

### §1.1 Slope — 실제 프롬프트 (가장 먼저)

```
STAGE SHEET - Slope   (mei-pencilslope · SCENE token: Slope · bake FIRST)

The hillside behind the village. Four books sled here, so this drawing decides it once - and it
decides which things are FIELDS and which are THINGS ON a field, because that is what separates
this series from its neighbour.

🔴 FIELDS (no outline anywhere - the edge is where the stroke direction changes):
  THE SLOPE ITSELF - ONE field of MOSS strokes running DOWNHILL, 0 individual blades, never denser
    or lighter inside itself. In snow it is bare PAPER instead, and the slope's shape is then made
    by where the strokes of everything else stop.
  THE SKY - bare PAPER, never stroked.
  FAR PEAKS - at most 4 EARTH outlines with 0 texture inside them.

🔴 THINGS ON THE FIELD (drawn with a harder point, ONE continuous outline each):
  THE LOW WOODEN FENCE across the bottom of the slope - EARTH, one outline.
  THE SLEDGES - EARTH, one outline each. 🔴 FIVE SLEDGES, and they are the ruler: they are the same
    five all series, told apart by length only - one long, two middling, two short. A page that
    shows sledges shows a numbered set of these five, never a new one.
  A SINGLE TREE part-way down, trunk CROSS-HATCH, one outline. 🔴 ITS BOLE IS THICK ENOUGH TO HIDE
    ONE CROUCHING CHILD - volume 30 shelters under it from rain, and rain through its leaves falls
    STRAIGHT, one stroke per fall, never slanted and never in a curtain.
  🔴 NOTHING ELSE GETS AN OUTLINE. If a shape needs separating from the slope and it is not on this
  list, separate it by changing the stroke direction, not by drawing round it.

🔴 A CAST SHADOW IS NOT ON THIS SHEET'S NOT LIST. Volume 15 lays one right across this slope and
  volume 20 reads the hour off its length. It is ONE field of CROSS-HATCH strokes on the ground, flat
  all the way through, its edge made by the stroke direction changing - never a tone, never a
  darkening of the slope under it. 🔴 LENGTH IS THE CLOCK: draw a short one and a frame-long one.

TRACKS: a sled track on snow is where the bare paper is left AND the strokes either side run with
  it - never a drawn pair of lines. Before anyone slides, the slope carries no track at all, and
  that emptiness is the first page of one book.
🔴 THE SAME RULE ON GRASS, and it is not only for snow: a trail of trodden grass is where the MOSS
  strokes lie DOWN with the walking, with the standing field either side unchanged - never a drawn
  pair of lines, never thinner or paler grass. 🔴 ITS LENGTH IS A RULER WHEREVER A PAGE READS ONE
  (one hand's span of flattened grass at the start, the whole slope crossed by the end) - 🔴 BUT IT IS
  THE RULER OF NO WHOLE VOLUME. Volume 33 shows it on four pages and the other six are indoors, and
  what runs through all ten of that book is the dried earth caught in the hedgehog's spines (cast
  sheet). A state list on a sheet is not a route: WHICH pages carry it is decided by `mei-routes.md`.
  Volume 34
  reads a running-about as a mark that doubles back on itself. Draw a short one and a slope-long one
  on one panel so the two ends of that range are fixed.

🔴 SIX MORE PLACES ARE ON THIS HILLSIDE AND NONE OF THEM IS SNOW (added 2026-09-05 - the four spots
  below were all sledging spots, and five volumes of ten pages each happen at these instead):
  ① THE DOOR-YARD AT THE TOP - the flat ground in front of the chalet door where the slope stops,
    with TWO STONE STEPS up to the door and NOTHING ELSE built on it. 🔴 IT IS A FIELD OF EARTH, not
    of MOSS, and that change of stroke is where the yard stops and the slope starts - there is no
    fence and no drawn line between them. The steps are THINGS, one outline each, two and never
    three. (The chalet itself and its inside are `Chalet`; this sheet owns only the ground and the
    steps.)
  ② THE BURROW GROUND - a bank of bare EARTH on the slope with SMALL ROUND HOLES in it, AT MOST 6,
    each one a hole in the field with NO outline and NO rim, at unequal heights, none mirrored. 🔴 A
    HOLE IS THE ABSENCE OF STROKES, so an empty burrow and a full one look alike from outside and
    the difference is only what stands at the mouth - which is why one volume can be six pages of
    nothing coming out.
  ③ THE SUMMER SLOPE - the same hillside with the MOSS field standing and NO snow anywhere: the
    default for half of these books, and the trodden-grass rule above is its only track.
  ④ THE APPLE TREE, standing alone part-way down and 🔴 NOT the single tree of the sledging pages -
    it is shorter, its crown is one wide EARTH mass, and the ground under it is a MOSS field. Both
    trees never appear in one frame.
  ⑤ THE BERRY BANK - a low bush of MOSS at the top of the slope, one field with a ragged edge, and
    the fruit on it as gaps in that field.
  ⑥ THE CREST - the top of the slope closed by ONE big EARTH rock with an outline, and past it
    nothing but bare paper. 🔴 THE CREST IS AS HIGH AS THE FRAME GOES; the far peaks are behind it
    and the reader never sees over it.

SPOTS:
  A THE WHOLE SLOPE from below, wide: fence across the bottom, tree part-way, peaks above.
  B IN THE LINE, medium, from behind: backs and sledges running away up the slope.
  C THE SNOW, close, high: bare paper and one outlined thing on it.
  D FROM THE TOP looking down, wide: the fall of the slope and the fence far below.
  🔴 E THE DOOR-YARD, medium, at a child's height: the two steps, the door line at the frame edge,
    the slope falling away behind.
  🔴 F THE BURROW BANK, medium, straight on: the holes in a row across the frame, all of them in.
  🔴 G UNDER THE APPLE TREE, medium low: the trunk, the crown mass overhead, the grass field below.
  🔴 H WHERE TWO BODIES TOUCH - §1.0, background one MOSS field, or bare paper if the page is snow.

PLATE: A to H once each, plus 🔴 A FIELD-OR-THING DIAGRAM - the slope drawn as flat areas, each
  marked FIELD (arrow for stroke direction) or THING (outlined) - plus the five sledges in a row by
  length, plus 🔴 THE SAME SLOPE TWICE AT ONE SIZE, in grass and in snow.

NOT: no character of any kind, no accent orange anywhere on this sheet, no lettering or numerals,
  no outline on a field, no blending or smudging, no third pencil, no white pencil, no shading,
  gradient, glow or soft edge, nothing paler with distance.
```

### §1.2 Piazza — 요약 명세

`FIELDS` = 돌바닥(🔴 **EARTH 반복 마크 하나**, 03·06권이 그 바닥을 센다) · 벽 · 하늘(맨 종이).
`THINGS` = 무대 널빤지(최대 6) · 계단 난간 · 분수 · 화덕 · 탁자 · 🔴 **종탑**(신설 — 17권이 **10쪽 전부**
그 밑인데 §1.2 에 탑도 종도 줄도 없었다: 벽은 FIELD(EARTH 세로), **탑 몸통·종·당김줄은 THINGS 라 윤곽 한 줄씩**,
종은 하나뿐이고 줄은 바닥까지 닿는다).

🔴 **SPOT 은 토큰까지 적는다** — SCENE 이 `[Piazza/A]`·`[Piazza/E]` 를 찍는데 이 절은 「A 광장 전체」라고만
써 놨었다. **이름이 다르면 검사기가 그냥 통과한다**(미나에서 실측된 그 결함이 여기 그대로 있었다).

| 토큰 | 자리 | 카메라 |
|---|---|---|
| `Piazza/A` | 광장 전체 | 와이드 · 아이레벨. 🔴 다섯 + 군중 한 덩어리가 다 들어가는 폭 |
| `Piazza/B` | 무대 앞 | 미디엄 · 로우앵글(무대가 아이 가슴 높이) |
| `Piazza/C` | 계단 | 미디엄 · 측면(칸이 세어진다) |
| `Piazza/D` | 화덕 앞 | 미디엄 · 아이레벨 |
| `Piazza/E` | 종탑 밑 | 로우앵글 · 줄이 화면 세로를 지른다 |

🔴 **사물 시트가 넘긴 조항 셋을 여기에 얹는다**(§2-A 「자리 시트에 넘긴 것」).

1. **무대는 널빤지만이 아니다**(08권 10쪽) — 무대 뒤에 건 천 한 장 · 무대 앞 긴 의자 줄 · **무대 옆 계단
   세 칸**. 셋 다 THINGS 라 윤곽 한 줄씩이고, 계단은 세 칸에서 늘거나 줄지 않는다.
2. 🔴 **광장에 두 상태가 있고 17권은 그 둘을 같은 각도로 견준다** — ①**빈 돌바닥**(탁자도 천도 깃발도
   없다, 바닥 반복 마크가 화면의 전부) ②**장날**(긴 탁자 · 건 천 · 늘어놓은 그릇 · 좌판 지붕 넷).
   40권은 ②만 쓴다. **두 상태를 한 판에 같은 크기·같은 각도로** 그려 겹쳐 볼 수 있게 한다.
3. 🔴 **광장에도 그림자가 눕는다**(03권 p6 「광장을 가로질러 길게 누운 그림자」) — 앵커가 이제 그것을
   **CROSS-HATCH 면 하나**로 정의한다. 톤이 아니라 면이고, **길이가 시계**다.
4. 🔴 **해가 지붕 선 어디에 걸렸는가가 17권의 시계다**(가려짐 → 반쯤 → 완전히 위). 그러니 이 시트가
   **지붕 선 높이를 못 박아야** 세 상태가 견줘진다 — 지붕 선은 광장 건너편 벽 위 한 줄이고, 해는 맨 종이
   원 하나이며 **번지지 않는다**(가장자리는 획 방향이 바뀌는 자리다).

---

### §1.3 Brook — 🔴 이 시리즈 최다 자리인데 시트가 없었다 (38쪽 · 05 · 19 · 26 · 35 · 49 + 11)

> 앵커에 `BROOK` 조항은 **있었다**. 없던 것은 「그 개울이 어떻게 생겼는가」다. 그 사이에 사물 시트 넷이
> 떠 있었다 — 디딤돌 다섯(05) · 통나무(19·28·46) · 넓은 바위(35·49·50) · 얼음(49).
> 🔴 **한 개울이다.** 다섯 권이 같은 물을 건너고, 씻고, 앉고, 얼린다. 갈라 두면 05권의 돌과 49권의 얼음이
> 다른 물에서 일어난 일이 되고, **35권의 웅덩이와 49권의 언 개울이 같은 자리라는 것**이 안 읽힌다.

```
STAGE SHEET - Brook   (mei-pencilslope · use the anchor's BROOK clause · SCENE token: Brook)

The stream below the village. Six books cross it, wash in it, sit beside it and walk on it frozen -
and it is one stream, drawn the same way every time.

🔴 FIELDS (no outline anywhere - the edge is where the stroke direction changes):
  THE WATER - ONE field of MOSS strokes running ACROSS the page with the current, 0 ripples, 0
    glints, 0 sparkle, never denser or lighter inside itself, and never distorting what stands in it.
  THE BANKS - EARTH strokes running ALONG the bank, so the change of direction at the water's edge
    IS the edge. Nothing is drawn round the water.
  THE SKY - bare PAPER.
🔴 THINGS ON THE FIELD (harder point, ONE continuous outline each) - and this list is closed:
  FIVE STEPPING STONES in a line across the water, flat EARTH shapes, told apart by size only, the
    same five every time (prop sheet §2.4 owns them; this sheet owns that they cross HERE).
  ONE THICK LOG laid bank to bank, further downstream than the stones, EARTH, its own outline. 🔴 IT
    IS THE ONLY OTHER WAY OVER, and volume 19 is about there being one way.
  THE WIDE FLAT ROCK on the near bank beside the pool, EARTH, its top a plain unstroked field.
  THE POOL - a widening of the same water below the rock, deep enough to stand in to the chest.
🔴 A THING IN THE WATER IS CROSS-HATCH LYING INSIDE THE MOSS FIELD, hard edge, whole, never mirrored,
  never wobbled and never reflected. A thing ON the water sits on top with its whole outline showing.

🔴 THE WATER LEVEL IS A RULER AND THE ROCK CARRIES IT. Wet stone is CROSS-HATCH; dry stone is EARTH;
  the boundary between them is a HARD LINE across the rock's face and it does not move within a page.
  Volume 35 reads the afternoon off two of those lines one above the other. Never a gradient, never a
  darkening - the wet line is where one field stops and another begins.

🔴 FROZEN (wherever the SCENE says the brook is frozen) - the same stream with the MOSS field GONE: the ice is bare PAPER from bank to
  bank and the two pencils draw only what is on it or trapped under it. A thing under the ice is
  CROSS-HATCH seen whole through bare paper, not blurred and not paler. The banks do not change.
  🔴 The frozen and unfrozen stream must lay over each other: same width, same bend, same stones.

SPOTS:
  A ACROSS THE STREAM, wide, eye level: near bank low in frame, water across the middle, far bank and
    its bushes above. 🔴 Wide enough to hold five children on one bank.
  B ON THE STONES, medium, low: two or three stones and the water running between them.
  C THE LOG, wide, from below at water height: the log spanning the frame with the current under it.
  D THE POOL AND THE ROCK, medium, eye level: the flat rock at one side, the pool below it.
  E THE WATER, close, high: one field of MOSS and one outlined thing lying in it.

PLATE: A, B, C, D, E once each, plus 🔴 A FIELD-OR-THING DIAGRAM (water/banks marked FIELD with an
  arrow for stroke direction, stones/log/rock marked THING) and 🔴 ONE PANEL OF THE SAME STRETCH
  TWICE - flowing and frozen - at one size.

NOT: no character of any kind, no accent orange anywhere on this sheet, no lettering or numerals, no
  outline round the water, no ripple, glint, sparkle, foam or reflection, no blending or smudging, no
  third pencil, no white pencil, no shading, gradient, glow or soft edge, nothing paler
  with distance.
```

### §1.4 Path — 🔴 20권 첫 쪽이 이 시트 없이는 성립하지 않는다 (17쪽 · 04 · 11 · 13 · 20)

> 20권의 사건은 **짧은 길과 먼 길이 같은 지붕에 닿는 것**이고, 대본이 p1 에 「두 길이 같은 곳에서 만나는
> 것이 한 화면에서 보여야 **「금방」이 읽힌다**」라고 못 박아 뒀다. 🔴 **그건 카메라 지시가 아니라 지형이다** —
> 두 길의 관계는 쪽마다 정할 게 아니라 시트가 한 번 정하는 것이고, 안 정하면 열 쪽이 서로 다른 산이 된다.
> 11권은 같은 길의 위쪽(돌투성이 오르막과 그 끝의 민둥 바위), 04권은 아래쪽 숲 어귀의 갈림길이다.

```
STAGE SHEET - Path   (mei-pencilslope · use the anchor's PATH clause · SCENE token: Path)

The paths above and behind the village. Four books walk them. One hillside, four places on it, and
their relative positions are decided here once.

🔴 THE PATH IS BARE PAPER - one strip running through whatever field it crosses, hard edged where the
  strokes of the ground begin, and it stays bare however far it goes. It does not narrow to a
  vanishing point, does not fade and does not get paler; it leaves the frame or it stops at a thing.
🔴 WIDTH IS THE ONLY THING THAT TELLS TWO PATHS APART, and it never varies for effect:
  THE SHORTCUT - one body wide. It runs STRAIGHT to the chalet roof and is short.
  THE LONG WAY - twice that. It curves out wide and comes back to THE SAME ROOF.
  🔴 BOTH ENDS MUST BE VISIBLE IN ONE FRAME (volume 20 p1) - the two paths and the one roof they
  share. If a reader cannot see that they arrive at the same place, that book has no story.
FIXED PARTS:
  THE LOW STONE WALL along the shortcut only - EARTH, one outline, 🔴 its top course at a child's eye
    height so that what is behind it cannot be seen, and dry grass growing between the top stones.
    (Prop sheet §2.14 owns the wall's courses; this sheet owns which path it runs beside.)
  THE CHALET ROOF at the top end of both paths, one EARTH shape with an outline, small.
  THE STONY STRETCH on the upper path - loose angular stones scattered on the bare paper, at most 9
    drawn separately, and one of them is the one that gets under a foot.
  🔴 THE BARE ROCK TOP where the upper path ends - a rounded unstroked hump above the last of the
    grass, wide enough for FIVE to stand along in a row, with the village roofs far below it. That
    top is the last page of volume 11 and the path exists to reach it.
  A HOUSE DOOR AND ITS WALL at the lower path's side (volume 13 stands at Soso's door): one plain
    EARTH wall with a doorway and a bare stretch of wall beside it where a sledge can lean. It is a
    THING with an outline; it is NOT the chalet.
  THE FORK at the wood's edge, where the path splits in two before the trees close in.

🔴 A CAST SHADOW IS NOT ON THIS SHEET'S NOT LIST EITHER, and on this path it is the whole clock of
  volume 20 - "the sun is lower than yesterday" is read off a shadow that reaches the front of the
  frame. ONE field of CROSS-HATCH on the bare paper of the path, flat through, hard edged, and its
  LENGTH is the only thing that changes between the two days. Never a tone, never a soft end.

SPOTS:
  A THE TWO PATHS, wide, high: both routes and the one roof they share, in one frame.
  B ON THE PATH, medium, low: bare paper filling the lower frame, the ground field either side.
  C THE WALL, medium, from the path side: the top course at eye height, dry grass in its joints.
  D THE ROCK TOP, wide, from behind and above: the hump, the roofs far below.
  E THE DOOR, medium, eye level: wall, doorway, the leaning place beside it.

PLATE: A, B, C, D, E once each, plus 🔴 ONE WIDTH PANEL - the shortcut and the long way drawn side by
  side at the same distance with the same child standing on each, so the two widths are fixed and
  cannot drift.

NOT: no character of any kind, no accent orange anywhere on this sheet, no lettering or numerals, no
  outline round the path, no drawn kerb or edging, no signpost, no blending or smudging, no third
  pencil, no white pencil, no shading, gradient, glow or soft edge, nothing paler with
  distance.
```

### §1.5 Wood — 🔴 앵커 `FOREST` 조항이 04권만 덮고 있었다 (13쪽 · 04 · 32)

> `FOREST` 는 **줄기·간격·길**을 정하는데 그 조항이 「(volume 04)」로 잠겨 있어서 **32권 숲속 덤불 여섯 쪽이
> 통째로 조항 밖**이었다(§2-A ③ · 앵커에서 조건으로 고쳤다). 두 권은 같은 숲의 다른 깊이다 —
> 04권은 **깊이 들어갈수록 촘촘해지는 것**이 사건이고, 32권은 **덤불 잎 두 장의 가장자리 차이**가 사건이다.

```
STAGE SHEET - Wood   (mei-pencilslope · use the anchor's FOREST clause · SCENE token: Wood)

The wood above the village. Two books go in - one to look for chestnuts and get lost, one to pick
berries that are not all the same berry.

🔴 FIELDS: the shade between the trunks is ONE horizontal field of MOSS behind everything, never
  denser or lighter inside itself. The ground is a field of EARTH. The sky is bare PAPER and it is
  seen only in gaps.
🔴 THINGS: EARTH draws the trunks, ONE FLAT STROKE PER TRUNK, at most 9 in a frame, ALL VERTICAL,
  each with its own outline. 🔴 DEEPER IN, THE TRUNKS STAND CLOSER TOGETHER AND NEVER DARKER - that
  spacing is the only depth this wood has, and it is the whole of volume 04. Draw the same stand of
  trees at three spacings so "further in" can be shown without a single tone change.
FIXED PARTS:
  THE EDGE where the wood begins - a hard line of trunks with the open hillside behind, the path
    entering between two of them.
  THE PATH, bare PAPER, narrowing to one body's width inside and 🔴 FORKING TWICE: once at the edge
    and once deep in. The two forks look the same and that is why volume 04 goes wrong.
  ONE BIG ROCK deep in the wood, EARTH with an outline, knee high, sat on and walked past twice.
  THE CHESTNUT TREE at the far side, the one tree with its own crown drawn, standing where the trunks
    thin out again. Under it the ground is covered (prop sheet §2.27 owns the nuts and husks).
  THE BERRY BUSHES nearer the edge, TWO of them side by side and 🔴 THEY ARE DIFFERENT PLANTS: one
    leaf smooth-edged, one leaf toothed. The bushes themselves are FIELDS with no outline; the single
    leaf held up to compare is a THING with an outline (prop sheet §2.5).
  🔴 NO UNDERGROWTH, NO FLOWERS, NO MUSHROOMS, NO ANIMAL. The floor is leaves and the trunks are the
  only vertical thing.
🔴 IT NEVER GETS DARKER, ONLY CLOSER. If a page has to feel deeper in, it gets more trunks in the
  same width - not a heavier MOSS field.

SPOTS:
  A THE EDGE, wide, eye level: open hillside at one side, the wall of trunks at the other, the path
    going in between two of them.
  B INSIDE, medium, eye level: trunks in three depths, the path bare between them.
  C DEEP IN, wide, low: trunks at their closest, crowns joining over the top of the frame, one narrow
    gap of bare paper.
  D THE BUSHES, medium, eye level: the two bushes side by side at one size.

PLATE: A, B, C, D once each, plus 🔴 A SPACING PANEL - the same trunks at three spacings in a row
  (edge / inside / deep) at ONE pencil weight, so that nobody reaches for a darker field, and 🔴 ONE
  LEAF PANEL - the smooth leaf and the toothed leaf at the same size.

NOT: no character of any kind, no accent orange anywhere on this sheet, no lettering or numerals, no
  bark texture, no branches on the ordinary trunks (they are one flat stroke each), no light shaft or
  dappled floor, no mist, no blending or smudging, no third pencil, no white pencil, no shading,
  gradient, glow or soft edge, nothing paler or thinner with distance.
```

### §1.6 Chalet · Seats · Slide — 요약 명세 (🔴 사물 시트가 넘긴 것을 받는다)

`Chalet` = 앵커 `CHALET` 조항 그대로(면마다 반복 마크 하나 · 들보·가구 EARTH · 천·덧문 MOSS ·
🔴 불빛과 등불은 안 칠한 종이). 받아야 할 것 둘:
- 🔴 **이층 계단**(10권) — 곧게 뻗은 널 · **난간 살**(그 사이로 인형 발이 나온다) · 🔴 **중턱에서 어둠에
  잘리는 높이가 p2·p7·p9 에서 똑같아야 한다.** 위가 안 보이는 것이 그 권의 사건이다.
  🔴 15권 미끄럼틀 사다리와 **다른 물건**이다(안/밖 · 나무/디딤 · 위가 안 보임/아래가 멀다).
- 🔴 **부엌 화덕**(02권) — `Piazza/D` 의 광장 화덕과 **다른 화덕이다.** 두 시트에 다 적는다: 이건 벽에
  붙은 실내 화덕이고 저건 광장 한가운데 선 것이다.

🔴 **받아야 할 것 둘을 2026-09-05 에 더한다** — 26~50 에서 여덟 쪽이 이 둘이고 시트에 없었다.
- 🔴 **산장 뒤 빨래 자리**(33권 여섯 쪽) — 뒷벽 밖의 좁은 땅에 **큰 나무 통 하나**가 놓인 곳. 통은 THING
  (윤곽 한 줄, EARTH, 널과 테), 땅은 FIELD, 뒷벽은 그 면의 반복 마크. 🔴 **부엌 안이 아니다** — 통 안의
  거품이 그 권에서 **화면에서 가장 밝은 것**이 되려면(§2.21) 둘레가 실내 어둠이 아니라 **바깥 맨 종이**여야 한다.
  통 옆에 마른 것을 너는 줄 하나, 그게 전부다.
- 🔴 **처마**(36권 두 쪽) — 앞벽 위로 내민 지붕 끝. 여기 매달리는 것(옥수수·마른 다발)은 **줄에 걸린 THINGS**
  이고 개수는 쪽이 센다. 처마 밑은 벽면이라 반복 마크가 이어지고, 매달린 것만 윤곽을 갖는다.
- ⚠️ **산장 앞 마당과 문 앞 두 계단은 `Slope` 시트가 든다**(41·31·33 의 그 쪽들이 SCENE 에서 `Slope` 토큰이다).
  이 시트는 **문 안쪽부터**다 — 두 시트가 문지방에서 만나고, 만나는 자리의 바닥 획 방향은 서로 다르다.

`Seats` = 장소가 아니라 **좌석표**(§3). 왼쪽부터 **소소 · 메이 · 루디**로 고정, 같은 탁자 같은 줄의 어느
칸인지가 세 권의 사건이다.

`Slide` = 15권. 꼭대기 발판 · 널 · 양옆 난간 · 사다리 칸수(고정). 🔴 p1 이 **같은 물건의 두 끝을 한
화면에서 크기 차로** 보여 달라고 한다 — 아래 첫 칸과 꼭대기 발판이 한 프레임에 들어가야 한다.

---

## §2. 사물 시트 — 35장 (후보 58에서 접고, 빼고, **다섯 장을 새로 찾아 넣었다**)

> 🔴 **단위는 권이다.** 한 권이 기대는 사물부터. 형식 정본 = `pongi-stages.md` §2.
> 🔴 **매체가 사물의 모양을 정한다** — §0 의 「어느 것이 면이고 어느 것이 그 위에 놓인 것인가」가
> 사물에도 그대로 걸린다. 냄비·썰매·통나무·말뚝·바위·공은 **윤곽 한 줄**, 이불·보자기·물·비탈·덤불은
> **윤곽 없음**. 시트마다 그 줄을 못 박아 뒀다.
> 🔴 **밝은 것은 그리는 게 아니라 안 칠하는 것이다** — 빵 속살 · 군밤 속 · 거품 · 눈굴 벽 · 편지 ·
> 종이 · 바위 윗면 · 옥수수 하얀 대 · 입김이 전부 같은 가족(안 칠한 종이)이고, 이걸 칠하면 이 매체가
> 아니게 된다. 반대로 **어두운 것은 크로스해치 한 겹**이지 그늘이 아니다(흙굴 안 · 손자국 · 얼음 밑).

### 🔴 이 시리즈에서 되풀이되는 것 — **다섯이 자다**

썰매 다섯(01·13) · 돌 다섯(05) · 보자기 다섯(07) · 이랑 다섯 자리(12) · 종이 다섯 장(14) ·
말뚝 다섯(24) · 흰 빵 다섯(26) · 그릇 다섯(29) · 못 다섯(31·36) · 옥수수 다섯(36·37) ·
이불 다섯(25) · 종 다섯(25) · 사과 다섯(44) · 발자국 다섯(45) — **열네 권이 「다섯을 나란히 놓고
그중 하나를 견주는」 같은 그림으로 끝난다.** 그래서 이 시트들은 예외 없이 같은 요구를 한다:
**다섯을 같은 크기로 · 같은 깊이에 · 같은 순서로 그리고, 다른 것은 그중 하나뿐이게.**
🔴 이것이 앵커와 부딪힌다 — §2 끝 「앵커가 사물 때문에 깨지는 자리」 ①을 볼 것.

| § | 토큰 | 사물 | 권 (쪽 수) |
|---|---|---|---|
| 2.1 | `Sledges` | 썰매 다섯 · 끈과 매듭 | 01(8) · 13(8) · 46 · **47** |
| 2.2 | `Bread` | 빵 (+ 심부름 셋) | **26**(5) · 02(3) · 21 · 29 |
| 2.3 | `Ball` | 공 | **03**(6) 🔴 작업표에 없던 것 |
| 2.4 | `SteppingStones` | 디딤돌 다섯 | 05(7) |
| 2.5 | `Berries` | 딸기 덤불 · 숲 열매 덤불 | 05 · **32**(7) 🔴 다른 식물 |
| 2.6 | `Cheese` | 치즈 · 보자기 다섯 | 07(7·5) |
| 2.7 | `SeedPlot` | 이랑 다섯 자리 · 씨앗 · 구멍 · 싹 | 12(9) |
| 2.8 | `DrawingPaper` | 그림 종이 다섯 장 | 14(8) |
| 2.9 | `TallyPaper` | 명단 종이 한 장 | 23(5) 🔴 14와 다른 물건 |
| 2.10 | `Bell` | 목도리 끝 작은 종 | 10(4) · 12 · 14 · 15 · 19 · 20 · 24 · **25**(6) |
| 2.11 | `RagDoll` | 헝겊 인형 | 10(3) |
| 2.12 | `Snowman` | 눈사람 · 눈덩이 | **16**(9) 🔴 작업표에 없던 권 |
| 2.13 | `Log` | 통나무 | 19(5) · 28(7) · 46(7) |
| 2.14 | `StoneWall` | 돌담 | 20(5) |
| 2.15 | `SoupSet` | 냄비 · 뚜껑 · 국자 · 그릇 다섯 | 22(9) · 29(8) · 27 · 42 |
| 2.16 | `Stakes` | 말뚝 다섯 · 울타리 · 망치 | 24(8·4·3) |
| 2.17 | `Quilt` | 이불 다섯 채 | 25(8) |
| 2.18 | `JamJar` | 잼 단지 · 큰 나무 숟갈 | 27(7) · 48 |
| 2.19 | `Letter` | 하얀 편지 · 배낭 | 28(6·3) |
| 2.20 | `DryCloth` | 마른 수건 · 큰 담요 | 19 · 30 · 33 |
| 2.21 | `WashTub` | 큰 나무 통 · 거품 · 물바가지 | 33(6) |
| 2.22 | `BurrowMouth` | 흙굴 입구 | 34(7) |
| 2.23 | `SnowHollow` | 눈굴 · 발자국 다섯 | 45(6) 🔴 34와 정반대 |
| 2.24 | `Rock` | 바위 (+ 35권 물 자국 두 줄) | 35(8) · 49 · 50 · 04 |
| 2.25 | `Corn` | 옥수수 · 하얀 대 · 알 여섯 | 37(5) · 36 |
| 2.26 | `Flowers` | 꽃 아홉 점 · 꽃 목걸이 | 38(4) |
| 2.27 | `Chestnuts` | 밤 · 군밤 · 껍질 · 자루 · 봉지 | 42(6) · 39 · 40 · 04 |
| 2.28 | `FurHat` | 털모자 · 귀 구멍 둘 | 41(7) |
| 2.29 | `LeafPile` | 낙엽 더미 | 41(6) · 43(8) |
| 2.30 | `AppleTree` | 사과나무 · 가지 · 사과 다섯 | 44(7) |
| 2.31 | `Ice` | 언 개울 · 자국 넷 | 49(8) 🔴 매체 규칙이 가장 순수한 자리 |
| 2.32 | `Plate` | 둥근 접시 (+ 50권의 셋) | 50(4) · 42 · 26 |
| 2.33 | `WallPegs` | 벽 못 다섯 | **31**(6) · **36**(4) 🔴 작업표에 없던 것 |
| 2.34 | `Kite` | 연 · 연줄 | 31(3) |
| 2.35 | `Steam` | 김 · 입김 | 전권 (02 · 20 · 22 · 27 · 29 · 33 · 40 · 47) |

### 🔴 접은 내역

| 접은 것 | 어디로 | 왜 |
|---|---|---|
| 44 「사과」+「나무」+「가지」+「밑동」 | `AppleTree` | 한 그루다. 🔴 단 `Slope` 의 「비탈 중간의 나무」와는 **다른 나무**(30권이 비를 긋는 굵은 밑동) |
| 41 「낙엽」+「더미」 · 43 「낙엽」 | `LeafPile` | 한 무더기. 43 은 그것이 흩어진 상태 |
| 22 「냄비」+「뚜껑」 · 29 「그릇」+「냄비」 | `SoupSet` | 같은 화덕 위 같은 냄비다. 갈라 놓으면 22 의 「못 보던 안쪽」과 29 의 「바닥까지 드러난 냄비」가 다른 냄비가 된다 |
| 24 「말뚝」+「울타리」+「망치」 | `Stakes` | 울타리 = 말뚝 다섯이 다 박힌 상태이지 다른 물건이 아니다 |
| 07 「치즈」+「보자기」 | `Cheese` | 처음부터 천에 싸여 나오고(p1), 이 권이 견주는 것은 **보자기 위의 개수**다 |
| 27 「단지」+「숟갈」 | `JamJar` | 🔴 **숟갈 길이 = 단지 높이**가 이 권의 자라 두 물건을 갈라 두면 그 비교가 시트 밖으로 샌다 |
| 28 「편지」+「배낭」 | `Letter` | 배낭은 편지가 사는 주머니다. 편지 없이 배낭만 그려지는 쪽이 없다 |
| 12 「이랑」+「씨앗」 | `SeedPlot` | 자리 다섯과 그 안의 씨앗이 한 세트로 세어진다 |
| 19·30·33 「수건」 + 30 「담요」 | `DryCloth` | 할머니가 들고 오는 마른 천 하나. 크기 둘만 다르다 |
| 39 「밤」 · 42 「군밤」 · 40 「군밤 수레」 · 04 「밤 자루」 | `Chestnuts` | 한 알이다. 익힘·담김만 다르다 |
| 05 「덤불」 + 32 「덤불」 | `Berries` **한 장 안에 둘** | 🔴 접은 게 아니라 **나란히 뒀다** — 갈라 두면 화가가 둘을 비슷하게 그릴 위험이 남고, 붙여 두면 「이 둘은 다르다」가 시트 안에 그려져 있다 |
| 19·28·46 「통나무」 | `Log` | 굵은 통나무 하나가 세 자리에 놓인다. 굵기를 한 번만 정해 두면 셋이 같은 마을 나무로 읽힌다 |
| 04·35·49·50 「바위」 | `Rock` | 넷 다 「길이나 물 위에 놓인 목표물이자 앉는 자리」다. 35 의 물 자국만 그 자리의 상태로 |
| 02·21·26·29 「빵」 | `Bread` | 🔴 한 빵으로 안 그리면 26 의 **흰 빵**이 02 의 갈색 덩이와 다른 물건이 된다 |

### 🔴 접기를 거부한 것 — 이름은 같은데 다른 물건이다

| 후보 | 판정 | 왜 |
|---|---|---|
| 「입구」 ·공유 **34/45** | 🔴 `BurrowMouth` **≠** `SnowHollow` | **정확히 반대다.** 34 흙굴은 대본이 「굴 안은 겹쳐 그은 어둠」이라 못 박아 안이 **가장 진하고**, 45 눈굴은 「눈굴 벽은 칠하지 않은 종이」라 안이 **가장 밝다.** 접으면 둘 중 하나는 반드시 틀린다 |
| 「종이」 ·공유 **14/23** | 🔴 `DrawingPaper` **≠** `TallyPaper` | 14 = 탁자 위 **그림 종이 다섯 장**(그림에 줄이 그어진다), 23 = 접수대 위 **획 자국이 줄줄이 난 명단 한 장**(내 자국이 그 줄에 없다). 크기·개수·마크가 전부 다르다 |
| 「계단」 ·공유 **10/15** | 🔴 `Chalet` 이층 계단 **≠** `Slide` 사다리 계단 | 10 = 산장 안 어둠 속 이층 나무 계단(위가 안 보인다), 15 = 바깥 미끄럼틀 사다리(한 칸만 올라도 아래가 멀다). **둘 다 자리 시트 몫이라 사물에서 뺐다** — 아래 「뺀 것」 |
| 「탁자」 ·공유 **21/23** | 🔴 산장 부엌 긴 탁자 **≠** 광장 접수용 작은 탁자 | 둘 다 `Chalet`/`Piazza` 자리 몫이라 사물에서 뺐다. 다만 **묶어 두면 안 된다**는 것은 기록해 둔다 |
| 「종」 ·(10·25) 대 **17** | 🔴 `Bell`(목도리 끝 작은 종) **≠** 종탑 큰 종 | 10권 p8 이 「이 시리즈에서 종이 처음 나오는 자리다」라고 못 박았다. 17권 종은 종탑 꼭대기 것이고 `Piazza` 몫 |
| 「나무」 ·공유 **04/27/30/44** | 🔴 넷이 다 다르다 | 04 = 숲 줄기 · 27 = 나무 **숟갈** · 30 = 비를 긋는 큰 나무 · 44 = 사과나무. **추출기가 부분문자열로 묶은 것**이라 27 은 아예 나무가 아니다 |
| 「덤불」 ·공유 05/32 | 🔴 위 `Berries` 항 | |

### 🔴 뺀 것과 이유

| 뺀 것 | 이유 |
|---|---|
| 01·36 「삐노」 · 03·33·38 「소소」 · 04·14·49 「레오」 · 07 「루디」 | 🔴 **인물이다.** 캐스트 시트 몫 |
| 05 「건너편」 · 22 「위로」 · 33·46 「아래로」 · 35 「가로로」 · 36 「가로지르고」 | 🔴 **낱말이 아니라 방향이다.** 추출기 노이즈 |
| 40 「사람」 | 앵커가 이미 정했다 — `crowd at most 7 silhouettes with 0 faces and 0 hands` |
| 28·30·33·34·43·46·50 「비탈」 · 50 「꼭대기」 | 자리 시트 `Slope` 몫 |
| 30·41 「산장」 · 21·23 「탁자」 · 26·29·50 「식탁」 · 02 「화덕」 · 39·42·48 「난로」 | 자리 시트 `Chalet` 몫. 🔴 단 **02권의 부엌 화덕과 `Piazza` §1.2 의 화덕은 다른 화덕**이다 — 자리 시트에 그렇게 적어 둘 것 |
| 03 「돌바닥」·「분수」 · 08 「무대」 · 17 「지붕」 · 40 「종탑」 · 20 「돌담 밖의 길」 | 자리 시트 `Piazza`·`Path` 몫 → 아래 「자리 시트에 넘긴 것」 |
| 10·15 「계단」 · 15 「미끄럼틀」 | 🔴 **자리다.** 15 는 SCENE 이 이미 `[Slide]` 를 찍고 있고, `Slide` 라는 토큰을 사물에도 만들면 **한 이름이 두 시트를 가리킨다**(현 §2 표의 실제 오류) → 아래 「자리 시트에 넘긴 것」 |
| 34·45 「입구」 | 🔴 **안 뺐다.** 자리가 아니라 **크기가 규격인 구멍**이다(마멋이 드나든다 / 아이 다섯이 들어앉는다 / 큰 아이 하나가 낀다) |
| 11 「흙길의 모난 돌」 · 09 「마른 풀」 · 18 「마루 널과 나뭇조각」 · 06 「돌바닥」 | 그 권이 기대는 무게가 시트를 만들 만큼이 아니다. 자리 시트의 반복 마크로 충분하다 |
| 47 「매듭」 | 🔴 **`Sledges` 에 얹었다**(아래 §2.1 의 `ROPE AND KNOT`) — 썰매 앞의 그 끈이지 다른 물건이 아니다 |
| 41·43 「낙엽」 앞의 「털모자」 | 🔴 **작업표에 없었다.** `FurHat` 으로 새로 만들었다 |

### §2.1 Sledges — 실제 프롬프트

```
PROP SHEET - Sledges   (mei-pencilslope · SCENE token: Sledges)

The village's five sledges. Two books are built on them and they appear all series, so their five
lengths are fixed here.

FORM: EARTH, and 🔴 A SLEDGE IS A THING ON A FIELD, so it gets ONE CONTINUOUS OUTLINE drawn with a
  harder point - this is the one place in the series where an outline is correct. Inside it, EARTH
  strokes running along the deck (at most 6 planks). Runners are CROSS-HATCH. A rope at the front.
  No wood grain drawn, no metal sheen, no shading.
🔴 FIVE, TOLD APART BY LENGTH ONLY: one long, two middling, two short. Same shape, same colour,
  same rope - only the length differs, and it never changes across the series. Draw them in a row
  at correct relative length so a page can pick a numbered one.
STATES: 1 the five in a row, side on · 2 one from above, deck planks countable · 3 one on its side,
  runners showing · 4 one in the line on the slope, seen from behind at a child's height.

🔴 ROPE AND KNOT (wherever a rope is in frame): the rope at the front is ONE unbroken EARTH line and its knot
  is a small tight EARTH lump at the sledge nose. TWO STATES, drawn at one size: TIGHT - the lump
  small and hard, the loop closed · LOOSE - the same lump opened into a visible loop with one rope
  end fallen free and lying on the snow. 🔴 That loose end in the snow is the volume's whole
  warning, so it is never cropped and never hidden under the sledge.

PLATE: the four states, plus the five-in-a-row measuring strip.

NOT: no character, no hands, no accent orange, no lettering or numerals, no outline on the snow or
  the slope around it, no blending, no third pencil, no white pencil, no motion streaks, no
  shading, gradient or glow.
```
### §2.2 Bread — 🔴 네 권이 같은 빵을 쓴다 (02 · 21 · 26 · 29)

> 마을 빵은 네 권에 나오고 권마다 하는 일이 다르다 — 02 는 안 익은 속, 21 은 심부름으로 놓이는 하나,
> 26 은 흰 빵 다섯에 찍힌 까만 손자국, 29 는 뜯다 흘린 부스러기. **한 빵으로 그리지 않으면 26 의
> 「하얀 것 위에 까만 것」이 02 의 갈색 덩이와 다른 물건이 된다.**

```
PROP SHEET - Bread   (mei-pencilslope · SCENE token: Bread)

The village loaf. Four books use it and in every one of them the reader is asked to compare two
loaves, so ONE loaf shape is fixed here and only its state changes.

FORM: a round loaf, EARTH strokes all running ONE way across the crust, 0 scoring, 0 seed, 0 shine.
  🔴 IT IS A THING ON A FIELD, so it gets ONE CONTINUOUS OUTLINE drawn with a harder point wherever
  it sits on a table or a plate. About as wide as a child's head.
🔴 THE CRUMB IS BARE PAPER. A torn or cut face is left UNSTROKED - that unstroked face is the
  brightest thing on the page, and it is the ONLY way this series says "inside". An underbaked
  inside is the same bare paper with at most 4 EARTH strokes dragged across it, sagging.
🔴 A MARK ON THE LOAF IS CROSS-HATCH, NOT A SMUDGE. Volume 26 puts one dirty pawprint on each of
  five loaves: each print is a single CROSS-HATCH patch the size of a paw, hard-edged, and the five
  are in five DIFFERENT places on five loaves so the reader counts five and not one repeated.
STATES - all at one scale:
  1 RISING, seen through an oven door: at most 4 loaf shapes, no outline (they are inside a field).
  2 BITTEN, held in two paws: the bitten face bare paper with the 4 sagging strokes.
  3 THE BIGGEST ONE, split open, bare-paper crumb wide open. Draw 2 and 3 at the SAME size and
    angle - volume 02 ends by comparing them.
  4 ONE LOAF SET DOWN ALONE on a table, whole.
  5 FIVE LOAVES IN A ROW, each with ONE cross-hatch pawprint in a different place.
  6 THE SAME FIVE, clean - not one mark anywhere. 5 and 6 must lay over each other.
  7 TORN IN TWO by two paws, with at most 9 EARTH crumbs scattered on the table beside it.
  8 A BASKET OF LOAVES untouched, 0 crumbs on the board in front of it.
🔴 THE ERRAND SET (wherever a child is sent on an errand) belongs on this sheet: the loaf, a FLOUR SACK and a SALT BAG, drawn
  in a row at one scale, all three EARTH with one outline each. They are counted 1 - 2 - 3 across
  that book, so the three must be plainly different shapes and never overlap on a table.

PLATE: states 1-8, plus the errand three in a row, plus states 2 and 3 stacked for comparison.

NOT: no character, no accent orange, no lettering or numerals, no steam drawn on this sheet (see
Steam), no shine, glaze or crust texture beyond the one stroke direction, no smudged mark, no
blending, no third pencil, no white pencil, no shading, gradient, glow or cast shadow.
```

### §2.3 Ball — 🔴 작업표에 없던 것. 03권의 전부다

> 추출기가 03권에서 뽑은 후보는 「돌바닥 · 분수 · 소소」 셋인데 앞의 둘은 자리이고 셋째는 인물이다.
> **정작 이 권이 열 쪽 내내 쫓는 물건인 공이 목록에 없다.** 굴러오고, 안기고, 손에서 손으로 넘어가고,
> 마지막에 발을 떠난다 — 그 넷이 이 권의 사건 전부다.

```
PROP SHEET - Ball   (mei-pencilslope · SCENE token: Ball)

The one ball the village children play with. One book, but it is on nine of its ten pages and it
changes hands three times.

FORM: a plain round ball, MOSS, ONE field of strokes running one way across it, and 🔴 ONE
  CONTINUOUS OUTLINE because it is a thing sitting on the stone ground. 0 panels, 0 seams, 0 stars,
  0 stripes, 0 highlight. It is as wide as a child's chest - big enough that holding it takes both
  forelegs and hides the holder's belly.
🔴 A ROLLING BALL IS NOT DRAWN MOVING. There are no motion lines, no arcs, no blur and no repeated
  ghost. Movement is said by ONE thing only: a shallow track behind it on the stone ground, drawn
  as a line where the EARTH stroke direction of the ground CHANGES, never as a pair of drawn lines.
  A kicked ball is simply placed further from the foot in the frame.
STATES:
  1 ALONE ON THE GROUND, no one near it.
  2 ROLLED IN - the ball plus its track running back into the depth of the frame to the frame edge.
  3 HUGGED - both forelegs wrapped all the way round it against a chest, the arms meeting on the
    far side so the ball is plainly bigger than the chest.
  4 HANDED OVER - one pair of paws under it and another pair on top, the ball between them.
    🔴 One of the lower paws is already OFF the ball with its palm empty and open.
  5 JUST KICKED - the ball clear of a foot, in the air, 0 lines behind it.
  6 IN THE AIR ABOVE TWO RAISED PAIRS OF PAWS, about to be caught.

PLATE: the six states at one scale, plus the ball drawn beside a plain child silhouette for size.

NOT: no character face (silhouettes only, for scale), no accent orange on the ball, no lettering,
numerals or maker's marks, no panels, seams or printed pattern, no motion lines, speed streaks or
blur, no cast shadow, no blending, no third pencil, no white pencil, no shading or gradient.
```

### §2.4 SteppingStones — 05권 · 🔴 다섯이 자다

```
PROP SHEET - SteppingStones   (mei-pencilslope · SCENE token: SteppingStones)

The five flat stones across the brook. One book, and the whole book is the distance between the
first stone and the fifth.

FORM: FIVE flat stones, EARTH, each ONE continuous outline with the strokes running ALONG the
  stone, not across it. They are the same five all book, told apart by SHAPE, and their left-to-
  right order never changes. Wide enough for two child feet, no more.
🔴 THE WATER IS A FIELD AND THE STONES ARE THINGS ON IT: the brook is one MOSS field running across
  the page, 0 ripples and 0 glints, and each stone sits on top of it with its whole outline showing.
  Fast water between two stones is NOT a darker patch - it is the same field with at most 5 short
  MOSS strokes leaning the same way, and white foam is BARE PAPER, never a white pencil.
🔴 A WET FOOTPRINT ON A STONE IS CROSS-HATCH - one pair of small hard-edged patches, no outline of
  their own. Volume 05 counts them: one pair on stone 1, then 2, then 3, then 4, while stone 5
  carries the two feet themselves. THE FOUR PAIRS MUST BE COUNTABLE AT THUMBNAIL SIZE.
STATES - all from the same side view at one scale:
  1 THE FIVE, empty, no prints - the first page.
  2 STONE 1 ALONE, close, large, with a big adult paw tapping its top. The other four fall away
    behind it, plainly smaller. 🔴 This is the one panel where the row is NOT even.
  3 FOUR WET PAIRS on stones 1-4 and two real feet on stone 5.
  4 THE FIVE seen from the far bank, empty again, prints drying.

PLATE: the four states, plus the five stones in a row at correct relative shape and gap.

NOT: no character face, no accent orange, no lettering or numerals, no ripple, glint, sparkle or
reflection on the water, no white pencil for foam, no outline round the water, no blending, no
third pencil, no shading, gradient, glow or cast shadow.
```

### §2.5 Berries — 🔴 두 덤불은 다른 식물이다 (05 · 32)

> 작업표는 「덤불 ·공유 05/32」로 묶어 놨다. **대본은 아니다.** 05 는 개울 건너편의 잘 익은 딸기 덤불이고
> 32 는 숲속 덤불인데, 32권의 열 쪽 전부가 **「두 열매가 똑같이 생겼고 잎 가장자리 하나만 다르다」**에
> 걸려 있다. 두 덤불을 한 그림으로 그리면 32권의 그 한 장이 성립하지 않는다.
> 🔴 그래서 접지 않고 **한 시트 안에 나란히** 둔다 — 갈라 두면 화가가 둘을 비슷하게 그릴 위험이 남고,
> 붙여 두면 「이 둘은 다르다」가 시트 안에 그려져 있다.

```
PROP SHEET - Berries   (mei-pencilslope · SCENE token: Berries)

TWO DIFFERENT PLANTS on one sheet, so that they can never be drawn as the same bush.

PLANT A - THE STRAWBERRY BUSH (volume 05, the far bank of the brook): a low bush, MOSS field for
  the leaves with 0 individual blades, and the fruit as CROSS-HATCH knots sitting on that field,
  each with its own small outline. The fruit is DENSE - at most 9 visible, clustered, hanging low
  enough for a child to reach standing.
PLANT B - THE WOOD BERRY BUSH (volume 32, inside the trees): 🔴 no outline at all around the bush -
  it is a field, told from the slope behind it only by its stroke direction lying a different way.
  The berries are CROSS-HATCH, darker than the leaves, and they are SCATTERED, never clustered.
🔴 THE LEAF EDGE IS THE WHOLE OF VOLUME 32 AND IT IS SETTLED HERE. Plant B carries TWO kinds of
  leaf on neighbouring twigs: one leaf with a SMOOTH edge and one leaf with a TOOTHED edge, same
  size, same colour, same stroke direction. THEY DIFFER BY EDGE AND BY NOTHING ELSE - not by
  colour, not by size, not by how they are held. Draw both at large size on this sheet.
🔴 THE PAIRING PANEL: two berries lying side by side on an open adult palm, exactly the same size
  and the same shape, each still wearing ONE of its leaves - toothed on the left, smooth on the
  right - and nothing else in the frame. That panel is the page volume 32 turns on; draw it here so
  the page cannot invent a difference.
STATES:
  1 PLANT A, whole bush, from the bank.
  2 PLANT A, one berry pinched off between two fingertips, stalk just parting.
  3 PLANT A, a cupped palm heaped and about to overflow.
  4 PLANT B, whole bush, no outline, one twig springing back after a pick.
  5 PLANT B, the two leaves large, side by side.
  6 THE PAIRING PANEL.
  7 ONE CHEWED PIECE spat out on bare earth, plus scattered drops - EARTH, at most 5 marks.

PLATE: the seven states, plus plants A and B drawn side by side at one size so the two silhouettes
cannot be confused.

NOT: no character face, no accent orange, no lettering or numerals, no berry shine or highlight, no
outline anywhere on plant B, no blending, no third pencil, no white pencil, no shading or gradient.
```

### §2.6 Cheese — 07권 (「치즈」와 「보자기」를 접었다)

> 치즈는 처음부터 보자기에 싸여 나온다(p1 「천에 싼 치즈 다섯 덩이」). 그리고 이 권이 견주는 것은
> 치즈가 아니라 **보자기 다섯 위에 놓인 개수**다 — 두 물건을 갈라 놓으면 그 비교가 시트 밖으로 샌다.

```
PROP SHEET - Cheese   (mei-pencilslope · SCENE token: Cheese)

One wedge of cheese and one picnic cloth, per child. Volume 07 hands out five identical sets and
then counts what is left on each cloth, so the SET is the sheet.

FORM - CHEESE: a wedge, EARTH, ONE outline, at most 2 lines inside it for the rind. 0 holes,
  0 texture. Half a wedge is plainly half, cut face towards the reader and left as BARE PAPER.
FORM - CLOTH: a square cloth, MOSS, laid flat. 🔴 A CLOTH IS A FIELD - no outline, its edge read
  only by the grass strokes running a different way around it. Its only interior mark is the
  repeated zigzag the anchor gives cloth, and that mark never changes size between cloths.
🔴 FIVE CLOTHS, ALL THE SAME SIZE, ALWAYS DRAWN AT THE SAME DEPTH IN THE FRAME. The book compares
  what is ON them, so if one cloth is nearer or larger the comparison dies. Volume 07 says this in
  its own SCENE - honour it here.
STATES - the five cloths from above, at one scale:
  1 FIVE CLOTHS, three pieces on each (a cheese wedge, a bread piece, an apple piece).
  2 ONE CLOTH BARE except crumbs (at most 9 EARTH dots) while the four beside it still carry
    several pieces each.
  3 THE SAME ONE CLOTH with THREE pieces on it - a half wedge, a bread piece, an apple piece -
    drawn at exactly the size and angle of state 2 so that "nothing" became "three".
  4 ONE WEDGE HELD against a chest with both forelegs and a tail curled across in front of it.
  5 ONE WEDGE BEING HALVED by two paws, the cut face opening bare paper.
  6 A BIG BASKET with five wrapped bundles in it, each bundle a cloth knotted over a wedge.

PLATE: the six states, plus states 2 and 3 stacked so the pieces can be counted against each other.

NOT: no character face, no accent orange, no lettering or numerals, no cheese holes, rind texture
or shine, no outline round a cloth, no cloth pattern beyond the anchor's zigzag, no blending, no
third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.7 SeedPlot — 12권 · 다섯 자리와 구멍

```
PROP SHEET - SeedPlot   (mei-pencilslope · SCENE token: SeedPlot)

The five planting places in the hillside bed. Volume 12 is about a seed being dug up and moved,
again and again, so the HOLES are the counter.

FORM: a raised bed of EARTH strokes running along the ridge. FIVE places in a row, evenly spaced,
  each a low mound. 🔴 THE BED IS A FIELD - no outline. A mound is told from the bed only by its
  strokes curving over it; never draw a ring round a mound.
🔴 AN OPEN HOLE IS THE ONE DARK THING: a CROSS-HATCH patch with a hard edge and no outline, with
  the dug-out soil pushed to one side as at most 5 EARTH lumps. A patted-down place is the mound
  with ONE palm-shaped set of EARTH strokes across its top and nothing else.
🔴 A SPROUT IS BARE PAPER? NO - a sprout is MOSS, two short strokes from one point, and it is the
  only MOSS on this sheet. It must read as green against an all-EARTH bed at thumbnail size.
🔴 THE RING OF HOLES (p6, seen from straight above): the holes and patted places run in a CIRCLE
  round the bed, and three laps must be countable. Draw that ring once here; the page cannot
  invent it. The four outer places stay smooth and untouched.
STATES:
  1 FIVE MOUNDS, none touched, seen level from the side.
  2 ONE OPEN HOLE with its lumps beside it, close, high angle.
  3 TWO OPEN HOLES side by side - one dry, one still damp (damp = strokes lying closer, never
    darker) - with a third place being patted.
  4 THE RING, from straight above: holes and patted places circling three laps, outer four smooth.
  5 FOUR SPROUTS AND ONE BARE PLACE, all five at the same depth in the frame.
  6 ONE SPROUT ALONE, close, from soil level, filling the frame vertically, soil smooth around it.

PLATE: the six states, plus the five places drawn in a row at correct spacing.

NOT: no character, no accent orange, no lettering or numerals, no outline round a mound or a hole,
no soil texture beyond the one stroke direction, no worms, stones or clods other than the 5 lumps,
no blending, no third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.8 DrawingPaper — 14권

```
PROP SHEET - DrawingPaper   (mei-pencilslope · SCENE token: DrawingPaper)

Five sheets of drawing paper on the long table. Volume 14 puts a line across someone else's sheet
and that line cannot be undone, so the sheet and the mark on it are settled here.

🔴 THE SHEET IS BARE PAPER - the same warm grey as the sky, and the brightest thing indoors. It is
  read only by the EARTH table strokes running around it. NEVER outline a sheet.
FORM: a rectangle about as wide as a child's two forelegs spread. FIVE of them, all the same size,
  laid at the same depth in the frame.
🔴 WHAT IS DRAWN ON A SHEET IS EARTH AND IT IS A FOUR-YEAR-OLD'S HAND, NOT THIS BOOK'S HAND: a few
  crooked lines and shapes, wobbling, thin. 🔴 NO LETTERS, NO NUMERALS, NO WORDS - the anchor
  forbids lettering anywhere and a drawing is not an exception.
🔴 THE CROSSING LINE is ONE thick straight EARTH stroke laid right across a finished drawing, from
  edge to edge, plainly heavier than every line under it. It never fades, never breaks, and it is
  never rubbed out in any later state.
STATES - all seen from straight above at one scale except 5:
  1 BLANK, alone on the EARTH table.
  2 DRAWN ON - a leaning mountain shape and nothing else.
  3 THE SAME SHEET WITH THE CROSSING LINE over it. 2 and 3 must lay over each other.
  4 FOLDED IN HALF, the inside hidden, lying flat.
  5 FOUR SHEETS PINNED ON A WALL IN A ROW at one height and one size - the crossed one and the
    folded one NEXT TO EACH OTHER, the other two plain drawings. 🔴 That neighbouring pair is the
    picture of this volume.
  6 ONE FRESH BLANK SHEET with a paw pinning its corner.

PLATE: the six states, plus the wall row large enough to count four sheets.

NOT: no character, no accent orange, 🔴 no lettering, numerals, words or signatures on any sheet or
wall, no outline round a sheet, no eraser marks or smudges, no blending, no third pencil, no white
pencil, no shading, gradient, glow or cast shadow.
```

### §2.9 TallyPaper — 🔴 14권의 종이와 **다른 물건이다** (23)

> 작업표는 `Paper | 종이 · 깃발 | 14 · 23` 으로 묶어 놨는데 대본은 아니다. 14 = 탁자에 놓인 **그림 종이
> 다섯 장**, 23 = 접수대 위 **획 자국이 줄줄이 난 명단 한 장**. 접으면 23권의 「내 자국이 그 줄에 없다」와
> 14권의 「내 그림에 줄이 그어졌다」가 같은 그림이 된다. **접기를 거부한다.**

```
PROP SHEET - TallyPaper   (mei-pencilslope · SCENE token: TallyPaper)

The register sheet on the sign-up table. One book, five pages, and the last empty row is the whole
of it.

🔴 THE SHEET IS BARE PAPER, unstroked, read only by the EARTH table around it. NEVER outline it.
FORM: ONE long sheet, plainly longer than it is wide - not the square drawing paper of volume 14,
  and never five of them. It lies flat under two big paws.
🔴 THE MARKS ARE SHORT EARTH STROKES IN ROWS RUNNING DOWN THE SHEET, ONE STROKE PER ROW, all the
  same length. 🔴 THEY ARE NOT LETTERS AND NOT NUMERALS - a name in this book is one stroke.
  The rows are counted by the reader, so they are evenly spaced and never crowd.
🔴 THE EMPTY ROW IS THE PICTURE: the last row is left with nothing on it, and the bare paper of
  that row must be visible at thumbnail size. Volume 23 fills exactly that row on its last page.
STATES - all from the same high angle at one scale:
  1 FEW ROWS MARKED, most of the sheet blank, one big paw holding it flat.
  2 MORE ROWS MARKED, the last row empty, a fingertip stopped just above it and NOT touching.
  3 FOLDED IN HALF by two big paws, marks hidden.
  4 OPEN AGAIN, same rows as 2, last row still empty.
  5 THE LAST ROW MARKED - one new stroke where the gap was. 🔴 Draw 2 and 5 at exactly one size so
    the single added stroke is findable.
  6 HELD UP VERTICALLY in two paws, turned towards the reader, rows edge on.

PLATE: states 1-6, plus states 2 and 5 stacked one above the other.

NOT: no character, no accent orange, 🔴 no letters, numerals, names or ticks of any kind, no
outline round the sheet, no ruled lines printed on it, no blending, no third pencil, no white
pencil, no shading, gradient or cast shadow.
```

### §2.10 Bell — 🔴 17권의 큰 종과 **다른 물건이다** (10 · 12 · 14 · 15 · 19 · 20 · 24 · 25)

> 「종」은 이 시리즈에 두 번 나오는데 서로 딴 물건이다. **10권에서 할머니가 메이 목도리 끝에 매어 주는
> 작은 종**은 그때부터 열 권 넘게 메이 몸에 붙어 다니고(12·14·15·19·20·24·25 SCENE 이 「목도리에 종」을
> 계속 적는다), **17권의 종은 종탑 꼭대기에 매달린 큰 종**이라 자리 시트 `Piazza` 몫이다. 접으면 10권의
> 「이 시리즈에서 종이 처음 나오는 자리다」가 무너진다.
> 🔴 **그리고 이건 캐스트 시트와 맞물린다** — 앵커의 메이는 「주황 목도리」뿐이고 종이 없다. 10권 p8 이
> 그 시점이므로 캐스트 시트에 **종 이전 / 종 이후** 두 상태가 있어야 한다.

```
PROP SHEET - Bell   (mei-pencilslope · SCENE token: Bell)

The small bell tied to the end of Mei's orange scarf. It is tied on in volume 10 and it is on her
in every book after that, so it is drawn identically every time and it is TINY.

FORM: one small bell, EARTH, ONE outline, with a single slot line across its lower half and a small
  loop on top. 🔴 SIZE IS THE POINT: it is no bigger than one of Mei's eye knots. In a wide shot it
  is a single EARTH mark; it never grows to be readable.
🔴 THE BELL IS NOT ORANGE. The accent orange belongs to the scarf it hangs from, and an orange bell
  would double the accent on the one child who already carries it. It is EARTH, always.
🔴 SOUND IS NOT DRAWN. There are no rings, arcs, sparkles or little lines round a rung bell. A bell
  that has just rung is drawn TILTED to one side, and that tilt is the entire signal.
🔴 THE COMPARISON PANEL: the bell drawn beside a whole standing child at one scale, so that a page
  which wants it visible from across a room knows it CANNOT be - volume 25 depends on the bell
  being too small to reach the next quilt.
STATES:
  1 NOT THERE - the scarf end alone, plain, no bell. This state is the whole first half of volume 10.
  2 BEING TIED ON - two big paws closing a cord round the scarf end, the bell hanging free.
  3 HANGING STILL, close, upright.
  4 TILTED - the same bell leaning to one side, nothing else changed.
  5 SWINGING WIDE - tilted the other way, the scarf end lifted with it.
  6 FIVE BELLS on an open adult palm, all identical, seen from above.
  7 FIVE BELLS lying one each on five quilts, seen from far above - each one a single EARTH mark.

PLATE: the seven states, plus the scale panel with a standing child.

NOT: no character face, no accent orange on the bell itself, no lettering or numerals, no sound
lines, rings, arcs or sparkles, no metal sheen, highlight or reflection, no blending, no third
pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.11 RagDoll — 10권 (없는 자리가 먼저 나온다)

```
PROP SHEET - RagDoll   (mei-pencilslope · SCENE token: RagDoll)

The cloth doll left upstairs. One book. It is seen in pieces before it is seen whole, so its
silhouette has to be recognisable from a foot and an arm.

FORM: a soft cloth doll about as long as a child's forearm, MOSS body with the anchor's cloth
  zigzag as its only interior mark, EARTH for the head. ONE outline. 0 face, 0 buttons, 0 hair.
🔴 IT IS READ FROM TWO PARTS ONLY in its first appearance: one foot and one arm poking between the
  banister uprights, with the rest of the doll hidden behind them. Those two parts must be enough -
  draw them here at the size they appear.
🔴 THE ABSENCE IS A STATE: an empty dent in a quilt, doll-shaped and doll-sized, with the quilt's
  strokes curving into the hollow and NOTHING drawn inside it. Volume 10 opens the night with that
  dent and it has to read as "the doll is not here", not as a crease.
STATES:
  1 WHOLE, lying flat, seen from above.
  2 THE FOOT AND ONE ARM between two uprights, the rest dark behind.
  3 THE EMPTY DENT in a quilt, from above, at doll scale.
  4 HELD - one foreleg clamping it to a chest, its legs hanging down.

PLATE: the four states at one scale, plus the doll drawn beside a standing child for size.

NOT: no character, no accent orange, no lettering or numerals, no face, eyes or mouth on the doll,
no buttons, stitching or patchwork, no blending, no third pencil, no white pencil, no shading,
gradient or cast shadow.
```

### §2.12 Snowman — 🔴 작업표에 16권이 통째로 없다

> 후보 58장 어디에도 16권이 없다. 그런데 16권은 **눈이 뭉쳐지느냐 안 뭉쳐지느냐**가 열 쪽을 끌고 가고,
> 「부슬부슬한 표면」과 「다져진 표면」의 차이를 그림으로 못 내면 이 권은 그림이 없다.

```
PROP SHEET - Snowman   (mei-pencilslope · SCENE token: Snowman)

The snowmen in the square. Volume 16 builds one that collapses and one that stands, so the
DIFFERENCE BETWEEN LOOSE SNOW AND PACKED SNOW is what this sheet decides.

🔴 SNOW IS BARE PAPER, unstroked, exactly as the anchor's SNOW clause says - so a snowman is a
  bare-paper shape standing in a bare-paper square, and it is read ONLY by its lower lip:
  LOOSE SNOW: the lower lip carries at most 3 EARTH strokes and they are SHORT, BROKEN and lean
    different ways, and the outline of the ball is RAGGED, sagging outward on one side.
  PACKED SNOW: the lower lip carries at most 3 EARTH strokes lying in ONE direction, and the
    outline is a clean unbroken curve. 🔴 That is the whole difference - never a texture, never a
    grain, never a shadow.
🔴 A COLLAPSE IS DRAWN AS A DENT, NOT AS MOTION: the body sinks INWARD around the point a stick
  went in, with at most 5 short EARTH cracks running outward from that point, and nothing else.
  A collapsed snowman is a LOW MOUND with one stick sticking out of it - 0 lumps flying, 0 lines.
🔴 A ROLLING TRACK is where the bare paper is left and the strokes at its two edges run WITH it -
  never a drawn pair of lines. The ball at the end of a track is always plainly WIDER than the
  track, because the track is what the ball ate.
STATES - all at one scale:
  1 FIVE SMALL PILES, one per child, untouched square behind them.
  2 A LOOSE BALL, ragged, sagging on one side.
  3 A PACKED BALL, clean curve, one stroke direction on the lip.  2 and 3 side by side.
  4 A LOOSE SNOWMAN, two balls, one stick pushed in and a dent with 5 cracks spreading.
  5 THE LOW MOUND left after it, one stick poking out.
  6 FOUR TRACKS across the square, each ending in a ball wider than its own track.
  7 FIVE SNOWMEN IN A ROW at one depth - one taller than the other four, all packed.

PLATE: the seven states, plus states 2 and 3 at large size, edge to edge, for the loose/packed call.

NOT: no character, no accent orange, no lettering or numerals, no snow texture, sparkle, glitter or
speckle, no falling snow drawn as dots, no motion lines round a collapse, no white pencil anywhere,
no blending, no third pencil, no shading, gradient, glow or cast shadow.
```

### §2.13 Log — 세 자리에 같은 통나무 (19 · 28 · 46)

> 작업표는 「통나무 ·공유 19/46」이라 적었고 28권 문 앞 통나무는 후보에 없다. **셋 다 굵은 통나무 하나**이고
> 하는 일만 다르다 — 개울을 건너는 다리(19) · 문 앞에 걸터앉는 자리(28) · 썰매길을 막은 것(46).
> 자리는 갈라도 물건은 하나다. 굵기를 한 번만 정해 두면 셋이 같은 마을의 같은 나무로 읽힌다.

```
PROP SHEET - Log   (mei-pencilslope · SCENE token: Log)

One felled trunk. Three books use it in three places, and in all three it is a THING ON A FIELD -
the one place in this series where an outline is correct.

FORM: a thick trunk, EARTH, ONE CONTINUOUS OUTLINE, with the strokes running ALONG its length, never
  across it. At most 4 bark lines and ONE end-grain ring set at the cut end. 0 branches, 0 moss,
  0 bark texture.
🔴 ONE THICKNESS FOR ALL THREE BOOKS: thick enough that a child walking on it puts one foot in
  front of the other, that an adult and two children can sit on it in a row, and that ONE child
  pushing it does not move it. Draw it once beside a standing child and once beside a standing
  adult, and never change it.
🔴 ROLLING IS SHOWN BY THE END GRAIN, NOT BY LINES: a log that has turned half a revolution has its
  end ring rotated and a ridge of pushed material heaped along its low side. 0 arcs, 0 arrows,
  0 motion streaks.
🔴 WET FOOTPRINTS ON TOP are CROSS-HATCH patches with no outline, in a single row along the log -
  volume 19 counts them to say someone crossed.
STATES:
  1 SPANNING A BROOK, both ends on banks, seen from the side, water as a MOSS field beneath.
  2 THE SAME LOG FROM ABOVE with a row of cross-hatch footprints along its top.
  3 LYING ACROSS A SNOW TRACK, snow as bare paper, the log the only outlined thing in frame.
  4 HALF-ROLLED - end ring turned, a ridge of snow heaped on the low side.
  5 SHOVED ASIDE, half sunk in the snow at an angle, clear of the track.
  6 IN FRONT OF A DOORWAY as a bench, an adult and two children sitting on it in a row.
  7 SIX PAWS LAID ON IT IN A ROW along its length, largest to smallest, seen close from above.

PLATE: the seven states, plus the log beside a standing child and a standing adult for thickness.

NOT: no character face, no accent orange, no lettering or numerals, no bark texture beyond 4 lines,
no moss, fungus or knots, no motion arcs or streaks, no blending, no third pencil, no white pencil,
no shading, gradient or cast shadow.
```

### §2.14 StoneWall — 20권 (높이가 곧 사건이다)

```
PROP SHEET - StoneWall   (mei-pencilslope · SCENE token: StoneWall)

The low stone wall beside the short path. Volume 20 is about a sound coming from behind it, so the
wall's HEIGHT relative to a child is the whole book.

FORM: a dry stone wall, EARTH, one outline along its top and bottom, its stones shown as at most 9
  crossing lines - the same mark repeated, never a drawn masonry texture. Dry grass along its top
  course: at most 5 MOSS strokes leaning one way.
🔴 THE HEIGHT IS FIXED HERE AND IT IS EXACT: standing at the wall, a child's chin JUST clears the
  top course when it stretches up, and no more - the eyes are above, the shoulders below. A big dog
  standing behind it can lay its forelegs over the top. 🔴 If the wall is lower, the child can see
  over it and the book has no secret; if it is higher, nothing can be shown at the end.
🔴 BEHIND IT IS NOTHING - not a dark patch, not a hint. The far side is BARE PAPER above the top
  course until the page decides to show what is there. That emptiness is the picture of pages 2-7.
STATES - all straight on at one scale:
  1 THE WALL ALONE beside a narrow path, bare paper above it.
  2 THE WALL with a standing child beside it, chin below the top course.
  3 THE SAME, the child stretched up, chin just over the top, both paws gripping the stones.
  4 A BIG DOG'S HEAD pushed out over the top course from the far side, forelegs not yet up.
  5 THE DOG WITH BOTH FORELEGS OVER THE TOP, chest against the stones.
  6 A CORNER of the wall from along the path, running away into the frame.

PLATE: the six states, plus the wall drawn against a standing child and a standing adult for height.

NOT: no character face beyond what the states name, no accent orange, no lettering or numerals, no
masonry texture beyond the 9 lines, no mortar, no ivy, no darkness behind the wall, no blending, no
third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.15 SoupSet — 냄비·뚜껑·국자·그릇 다섯 (22 · 27 · 29 · 42)

> 「냄비 ·공유 22/29」와 「그릇(29)」과 「뚜껑(22)」을 한 장으로 접었다. 22 는 **덮인 뚜껑**이 열 쪽을 끌고
> 가고 29 는 **국자가 어디까지 왔는가**가 사건인데, 둘은 같은 화덕 위 같은 냄비다. 갈라 놓으면 22 의
> 「못 보던 안쪽」과 29 의 「바닥까지 드러난 냄비」가 다른 냄비가 된다.

```
PROP SHEET - SoupSet   (mei-pencilslope · SCENE token: SoupSet)

The iron pot, its lid, the ladle and the five soup bowls. Four books share them and two books are
built on them, so they are one set.

FORM - POT: a round iron pot, CROSS-HATCH (the anchor gives iron to the crossed pencils), ONE
  outline, two side handles, at most 2 lines inside. It stands on the stove ledge at a height where
  a child on tiptoe can just get its chin level with the lid.
FORM - LID: a disc with ONE knob handle, CROSS-HATCH, ONE outline. 🔴 A CLOSED LID IS THE POINT OF
  VOLUME 22: closed, the pot has NO interior at all - not a hint, not a gap - and the only thing
  that says something is inside is steam escaping at the rim (see Steam).
FORM - LADLE: a long-handled ladle, EARTH handle and CROSS-HATCH bowl, ONE outline.
FORM - EATING SPOON: a small wooden spoon, EARTH, ONE outline - 🔴 plainly SHORTER than the
  ladle and shorter than the big jam spoon, so the three are never confused. Volume 29 ends with one
  held straight up above a head; that is the highest an arm goes in that book, so the spoon must
  still read as a spoon at arm's length above a figure.
FORM - BOWLS: FIVE identical round bowls, EARTH rim, 🔴 their insides left as BARE PAPER so that
  what is in them reads dark against light. Always drawn at the same size at the same depth.
🔴 SOUP IS A MOSS FIELD INSIDE A BOWL - flat, level, hard-edged, 0 ripples, 0 glints, 0 highlight.
  An empty bowl is bare paper to the rim. A bowl filled only at the bottom is a THIN band of MOSS
  with bare paper above it - volume 29 needs that bowl beside a full one on the same page.
🔴 THE LADLE'S PROGRESS IS THE COUNTER (volume 29): a high-angle row of five bowls where the ones
  already served carry steam and the ones not yet served do not. Draw that row here.
STATES:
  1 POT ON THE STOVE, LID ON, side on, steam at the rim only.
  2 THE LID ALONE, from above, knob centred.
  3 THE LID LIFTED by a cloth-wrapped paw, the pot's opening now a MOSS field seen at an angle.
  4 STRAIGHT DOWN INTO THE POT - a MOSS field filling the frame, at most 5 bubble rings, no outline.
  5 THE POT SCRAPED EMPTY - bare-paper bottom showing, a hard-edged MOSS ring left round the wall.
  6 FIVE BOWLS FROM ABOVE: three full, one bottom-covered, one empty.
  7 FIVE BOWLS FROM ABOVE, all full and identical.
  8 ONE BOWL HELD UP in two paws, tipped towards a face, empty.
  9 ONE EATING SPOON HELD STRAIGHT UP at full arm's stretch above a head, nothing else in frame.

PLATE: the nine states, plus the ladle, the eating spoon and one bowl drawn side by side at one
scale for relative size.

NOT: no character face, no accent orange, no lettering or numerals, no ripple, glint, sparkle or
reflection on the soup, no metal sheen or highlight on pot or ladle, no fire drawn under the pot,
no blending, no third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.16 Stakes — 24권 · 말뚝 다섯과 망치

```
PROP SHEET - Stakes   (mei-pencilslope · SCENE token: Stakes)

Five fence stakes and one wooden mallet. Volume 24 is one child driving all five and then giving
one back, so HOW MANY ARE STANDING is the counter on every page.

FORM - STAKE: a squared wooden post, EARTH, ONE outline, at most 3 lines along it, a flat head and
  a cut point. Standing, it comes to a child's shoulder.
FORM - MALLET: a wooden mallet, EARTH, ONE outline, head plainly heavier than the handle. It is
  big enough that a child must swing it with both forelegs.
🔴 FIVE PLACES, EVENLY SPACED ALONG THE SLOPE, AND THE ORDER NEVER CHANGES. A stake is in exactly
  one of three conditions and the reader tells them apart at thumbnail size:
  LYING - flat on the grass beside its place.
  LEANING - propped at an angle in its place, point in the grass, not driven.
  DRIVEN - upright, head at the SAME HEIGHT as every other driven stake, with a small ring of
    turned EARTH at its foot.
🔴 A DRIVEN STAKE'S HEIGHT IS THE PROOF OF THE LAST PAGE - the fifth stake must end level with the
  other four, so draw the five heads on ONE horizontal line in the finished states.
🔴 AN EMPTY PLACE is a hole with a heap of turned soil beside it - bare grass would read as "never
  built", and volume 24 needs "taken back out".
STATES - all from the same side view at one scale:
  1 FIVE PLACES, all five stakes lying or leaning, none driven. The mallet on the grass.
  2 ONE DRIVEN, four still down.
  3 FOUR DRIVEN, the fifth being struck - the mallet head touching the stake head, 0 motion lines.
  4 FIVE DRIVEN, heads on one line, a finished fence run.
  5 THE SAME RUN WITH ONE GAP - a hole and a heap where a stake was pulled, the pulled stake held
    out with soil falling from its point.
  6 FIVE DRIVEN AGAIN, heads on one line. 4 and 6 must lay over each other exactly.

PLATE: the six states, plus one stake and the mallet drawn beside a standing child for size.

NOT: no character face, no accent orange, no lettering or numerals, no wood grain beyond 3 lines,
no motion lines, impact stars or dust puffs, no rope, wire or rails between the stakes, no
blending, no third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.17 Quilt — 25권 · 이불 다섯 채

```
PROP SHEET - Quilt   (mei-pencilslope · SCENE token: Quilt)

The chalet quilts. Volume 25 lays five of them in a row on the boards and spends the night
comparing one to the other four.

FORM: one thick quilt, MOSS, and 🔴 A QUILT IS A FIELD - no outline. Its edge is where the MOSS
  strokes stop and the EARTH floor strokes begin, and its only interior marks are at most 5 long
  fold lines running its length. 0 patchwork, 0 pattern, 0 stitching.
🔴 A SLEEPING BODY UNDER IT IS ONE HUMP AND NOTHING ELSE - no face, no limbs, no shape pressed
  into the cloth. Who it is comes only from what is outside the quilt: an ear, a tail tip, an
  orange thing, a paw with a bell in it.
🔴 FIVE QUILTS IN A ROW, EVENLY SPACED, ALWAYS THE SAME ORDER AND ALWAYS THE SAME SIZE. Volume 25
  looks at that row three times from the same high angle (start of night, middle, end) and the
  reader is expected to compare - so the row is drawn once here and reused.
🔴 A HOLLOW is the quilt with a body-sized dent and nobody in it: the strokes curve into the dip,
  nothing is drawn inside it.
STATES:
  1 ONE QUILT SPREAD FLAT, from above, hem square.
  2 A HUMP with a face out at the top.
  3 A FULL HUMP with only two ear tips and one paw outside it.
  4 A HOLLOW, empty.
  5 THE ROW OF FIVE from far above, four humps still and one with a face and a paw out.
  6 THE ROW OF FIVE from floor level, all five sitting up - upper bodies out, quilts pooled at
    their waists.
  7 THE ROW OF FIVE from far above, all five lying, one paw out on top of each quilt.

PLATE: states 1-4 at one scale, then 5, 6, 7 at the row scale, 5 and 7 stacked for comparison.

NOT: no character face beyond what the states name, no accent orange except a scarf end where the
page has one, no lettering or numerals, no patchwork, quilting grid or printed pattern, no outline
round a quilt, no blending, no third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.18 JamJar — 27권 (그리고 48권이 같은 숟갈을 쓴다)

```
PROP SHEET - JamJar   (mei-pencilslope · SCENE token: JamJar)

The jam jar on the high shelf and the big wooden spoon beside it. Volume 27 is one long argument
about how much "a spoonful" is, so THE JAR AND THE SPOON ARE MEASURED AGAINST EACH OTHER here.

FORM - JAR: a squat round jar, EARTH, ONE outline, one rim line and one flat lid. 🔴 ITS CONTENTS
  ARE A CROSS-HATCH FIELD INSIDE THE OUTLINE with a HARD FLAT TOP EDGE, and that edge's height is
  the only thing that changes across the book. 0 label, 0 reflection, 0 glass shine.
FORM - SPOON: a big wooden spoon, EARTH, ONE outline, at most 2 lines inside.
🔴 THE MEASURING PANEL: the jar and the spoon laid side by side on a table, and THE SPOON'S LENGTH
  EQUALS THE JAR'S HEIGHT. That single relation is what makes "this much" readable, and volume 27
  puts it on the page - draw it here so the page cannot shrink either one.
🔴 FOUR FILL LEVELS, ALL DRAWN AT ONE SCALE IN A ROW: FULL (to the rim) · ONE SPOONFUL GONE (a hair
  below) · EMPTY (bare paper inside the outline with only a hard-edged cross-hatch smear left on
  the wall) · HALF (level exactly midway). The reader compares them, so they are one row.
🔴 THE SPOON IS THE SAME SPOON IN OTHER BOOKS - it lies beside the stove in volume 48. Never invent
  a second big spoon.
STATES:
  1 THE JAR ON A HIGH SHELF, lid off, seen from below - the shelf edge cutting across the frame.
  2 THE SPOON HELD LEVEL WITH ONE SPOONFUL ON IT, close, seen from the side.
  3 THE SPOON PLUNGED into the jar to its shaft, jar upright.
  4 THE JAR TIPPED ON ITS SIDE, empty, smear only, the spoon still in it.
  5 THE MEASURING PANEL - jar and spoon side by side on a table.
  6 THE LID BEING PRESSED DOWN by two small paws, the jar full to half.

PLATE: the four fill levels in a row, then states 1-6.

NOT: no character face, no accent orange, no lettering, numerals or labels on the jar, no glass
shine, reflection or highlight, no drips drawn as separate blobs beyond 3, no blending, no third
pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.19 Letter — 28권 (🔴 앵커의 「글자 금지」를 지키는 시트)

```
PROP SHEET - Letter   (mei-pencilslope · SCENE token: Letter)

One white letter riding in a traveller's backpack. Volume 28 follows it for ten pages and it is
handed over only on the last, so the reader must recognise the same folded sheet every time.

🔴 THE LETTER IS BARE PAPER - the same warm grey as the sky, unstroked, and it is the BRIGHTEST
  thing in every frame it appears in. It is read only by the EARTH pack around it. NEVER outline it.
FORM: a folded rectangle about as long as a child's forearm, always folded, always the same
  proportion. 🔴 ITS INSIDE FACE IS NEVER SHOWN - not folded open, not tilted towards the reader,
  not held up to the light. The anchor forbids lettering, and an open letter would demand it.
  Volume 28 already keeps it shut on its last page; keep it shut here.
FORM - BACKPACK: a shouldered pack, EARTH, ONE outline, at most 4 strap and seam lines, one top
  pocket. The letter stands VERTICALLY in that pocket, half out. 0 buckles, 0 patches.
STATES - all at one scale:
  1 IN THE POCKET, half out, seen over the wearer's back.
  2 PULLED OUT and held up at eye height in one paw, edge on.
  3 PUSHED BACK IN, half in, the pocket mouth gaping.
  4 SMALL AND FAR - the pack going away between trees with only the letter's top corner showing as
    a single bright chip. 🔴 At this distance it is still the brightest thing in the frame.
  5 LAID ON TWO CUPPED PAWS, still folded, one big paw still on its top edge.
  6 OPEN ON A LAP - 🔴 "open" here means UNFOLDED FLAT AND TILTED AWAY, so the reader sees the
    back of the sheet and no marks.

PLATE: the six states, plus the letter drawn beside a standing child for size.

NOT: no character face, no accent orange, 🔴 no lettering, numerals, addresses, seals or stamps
anywhere, no outline round the letter, no creases drawn beyond the one fold, no blending, no third
pencil, no white pencil, no shading, gradient, glow or cast shadow.
```

### §2.20 DryCloth — 할머니의 마른 것 (19 · 30 · 33)

```
PROP SHEET - DryCloth   (mei-pencilslope · SCENE token: DryCloth)

The dry towel and the big blanket the grandmother brings. Three books end with one of them landing
on a wet child, so the two sizes are settled together.

FORM: MOSS, and 🔴 CLOTH IS A FIELD - no outline anywhere. Its edge is read only by the strokes
  around it running a different way. Its only interior mark is the anchor's cloth zigzag, the SAME
  size on both sizes of cloth.
🔴 TWO SIZES, drawn in one row: THE TOWEL, which covers a child's head and shoulders, and THE
  BLANKET, which covers a whole child plus part of an adult. The step between them must be obvious
  at thumbnail.
🔴 A CLOTH OVER A HEAD IS ONE SHAPE WITH NOTHING UNDER IT DRAWN - no ears pressed through, no face
  showing, no folds pushed into a body shape. What sticks out from under its edge (a muzzle, a
  scarf end) is the whole reading.
🔴 WET AND DRY: a wet child under a dry cloth is CROSS-HATCH where it is still wet and EARTH where
  it has dried - the cloth itself never changes colour and never goes darker for being damp.
STATES:
  1 THE TOWEL FOLDED, held out flat on two big paws.
  2 THE TOWEL LAID ON A HEAD, corners hanging, a muzzle out at the front.
  3 THE TOWEL HELD OPEN WIDE by two big paws, waiting, nobody in it yet.
  4 THE BLANKET OPENED OVERHEAD, one edge crossing the top of the frame.
  5 THE BLANKET DRAWN ROUND TWO WALKING BODIES, one big one small, both under one edge.
  6 A TOWEL RUBBING ONE LONG EAR - the ear inside the cloth, only its tip out.

PLATE: the six states, plus the towel and the blanket laid flat side by side at one scale.

NOT: no character face, no accent orange, no lettering or numerals, no fringe, embroidery, stripes
or pattern beyond the anchor's zigzag, no outline round a cloth, no water drops drawn on it, no
blending, no third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.21 WashTub — 33권 (🔴 거품은 안 칠한 종이다)

```
PROP SHEET - WashTub   (mei-pencilslope · SCENE token: WashTub)

The big wooden tub behind the chalet. Volume 33 is a child who will not get in it, and the tub
turns from the darkest thing on the page into the brightest - so the FOAM is the sheet.

FORM: a big round wooden tub, EARTH, ONE outline, staves as at most 6 vertical lines and 2 hoop
  lines. It comes up to a child's chest. A wooden dipper hangs on its rim, EARTH, ONE outline.
🔴 THE WATER INSIDE IS A MOSS FIELD, level, hard-edged, 0 ripples and 0 glints.
🔴 THE FOAM IS BARE PAPER - never a white pencil, never outlined. It is drawn as unstroked rounded
  clumps with the MOSS water pulled around them, at most 5 clumps, and when it heaps over the rim
  it becomes the BRIGHTEST thing in the frame. That reversal is the point of volume 33.
🔴 ONE BUBBLE PER SPINE: when a spiny back sinks into the foam, EVERY spine tip carries exactly one
  small bare-paper bead and none is skipped. The SCENE asks for that count - draw it here so it is
  not approximated.
🔴 DIRT COMING OFF is CROSS-HATCH lumps sinking inside the MOSS field, hard-edged, no outline, and
  they never cloud the water - the water stays one flat field.
STATES:
  1 THE TUB FULL, water level, no foam, dipper on the rim - seen from a child's height.
  2 A BIG PAW STIRRING, foam heaped above the rim, bare paper.
  3 A BACK GOING IN AT THE RIM, foam meeting the spines, one bead per spine tip.
  4 STRAIGHT DOWN ONTO THE WATER: a body curled into a complete circle on the surface, a bare-paper
    foam ring around it, cross-hatch lumps sinking below.
  5 WATER BEING POURED OVER A HEAD from two paws - the falling water is at most 5 straight MOSS
    strokes, all one way, and they simply stop.
  6 THE TUB EMPTY, dipper on the rim, water gone, staves dry.

PLATE: the six states, plus a close-up of one spine tip with its single bead.

NOT: no character face beyond what the states name, no accent orange, no lettering or numerals, no
white pencil for foam, no bubble outlines or highlights, no ripple, glint or sparkle, no steam
drawn on this sheet (see Steam), no blending, no third pencil, no shading, gradient or cast shadow.
```

### §2.22 BurrowMouth — 34권 · 흙굴 (🔴 45권의 눈굴과 정반대다)

> 작업표는 「입구 ·공유 34/45」로 묶어 놨다. **정확히 반대되는 두 물건이다.**
> 34 = 비탈 흙에 뚫린 마멋 굴. 대본이 「굴 안은 겹쳐 그은 어둠」이라 못 박았다 — 안이 **가장 진하다.**
> 45 = 눈밭에 판 눈굴. 대본이 「눈굴 벽은 칠하지 않은 종이」라 못 박았다 — 안이 **가장 밝다.**
> 🔴 접으면 둘 중 하나는 반드시 틀린다. **접기를 거부한다.**

```
PROP SHEET - BurrowMouth   (mei-pencilslope · SCENE token: BurrowMouth)

The marmot burrows in the hillside. Volume 34 shouts into them for six pages and nothing comes out,
so what the reader sees in a burrow mouth is: nothing.

FORM: a hole in the slope, EARTH lip, and 🔴 ITS INTERIOR IS CROSS-HATCH - one flat crossed field
  with a HARD EDGE and NO FORM INSIDE IT AT ALL. No tunnel receding, no shapes, no eyes, no
  gradient into the dark. The anchor allows no shading, so depth here is a flat dark shape.
  The mouth is about as wide as a child's head.
🔴 THE MOUTHS ARE THE SAME SIZE WHEREVER THEY ARE - a distant burrow is smaller in the frame but
  never a different shape, so a page can scatter four of them and the reader counts four burrows.
🔴 A CLAW-SCRAPED APRON of loose soil sits below each mouth: at most 5 EARTH lumps, always on the
  downhill side.
🔴 THE ANIMAL IS NOT ONE OF THE FIVE: a marmot is a FOUR-LEGGED beast, no clothes, no accent
  orange, no upright stance. It is drawn only in the states below and never given a face expression.
STATES:
  1 ONE MOUTH ALONE on the slope, empty, apron below it.
  2 ONE MOUTH with hind legs and a short tail disappearing into it, the front already dark.
  3 FOUR MOUTHS scattered across a wide slope, all empty, all the same shape.
  4 STRAIGHT DOWN INTO A MOUTH from above - a flat cross-hatch shape filling the frame centre,
    nothing in it, claw marks in the soil at its lip.
  5 ONE MARMOT FULLY OUT, sitting up on its hind legs in front of its mouth, ears up, four-legged
    build, no clothes, no orange.
  6 THREE MOUTHS IN A ROW with one marmot sitting in front of each, all three facing different ways.

PLATE: the six states, plus one mouth drawn beside a standing child for size.

NOT: no character face on a marmot, no clothes on a marmot, no accent orange anywhere on this
sheet, no lettering or numerals, no tunnel, receding walls or interior detail inside a mouth, no
eyes glinting in the dark, no blending, no third pencil, no white pencil, no shading or gradient.
```

### §2.23 SnowHollow — 45권 · 눈굴 (🔴 34권과 정반대)

```
PROP SHEET - SnowHollow   (mei-pencilslope · SCENE token: SnowHollow)

The snow cave the children dig. Volume 45 ends with five of them sitting inside it, and the joke of
the whole book is that the INSIDE of this hole is the brightest place in it.

🔴 SNOW IS BARE PAPER and so is the inside of this hollow - the walls are UNSTROKED. The only marks
  anywhere are the anchor's three EARTH strokes along a LOWER LIP: three on the mouth's lower lip,
  three on each footprint's lower lip, and nowhere else. 🔴 Never outline the mouth; never darken
  the inside; never draw a shadow under the lip.
FORM: a mouth wide enough for a child to crawl through and NOT wide enough for the biggest child -
  volume 45 wedges one in it. Inside, it opens to hold five children shoulder to shoulder in a row.
🔴 WHO IS INSIDE IS TOLD BY ONE ORANGE THING sticking out of the mouth and by nothing else. On the
  page where the hollow is empty of visible bodies, a scarf end lying a hand's length outside the
  mouth on the snow is the entire reading.
🔴 FOOTPRINTS: a line of adult prints across the snow, each one bare paper with three EARTH strokes
  on its lower lip only. They are COUNTED (five of them), evenly spaced, and a child stands with
  both feet inside the last one.
STATES:
  1 A HALF-DUG HOLLOW seen from a distance across bare-paper snow.
  2 THE MOUTH close, empty, three strokes on its lower lip, nothing else.
  3 A BIG BODY WEDGED IN IT - head and one shoulder in, tail and hind legs out, feet slipping.
  4 THE MOUTH with only a scarf end lying outside on the snow.
  5 SNOW BEING PUSHED OUT - three loose EARTH-lipped lumps in front of the mouth, two paws behind
    them, the mouth now wider.
  6 INSIDE, seen from outside: five children shoulder to shoulder in a row, walls bare paper all
    round them, their five orange things in a line.
  7 THE FIVE FOOTPRINTS, from above, evenly spaced.

PLATE: the seven states, plus the mouth drawn beside a standing child and a standing adult.

NOT: no character face beyond what the states name, no lettering or numerals, no outline round the
mouth, 🔴 no darkness, shading or cross-hatch inside a snow hollow, no icicles, no sparkle on snow,
no white pencil, no blending, no third pencil, no gradient, glow or cast shadow.
```

### §2.24 Rock — 네 자리에 같은 바위 (04 · 35 · 49 · 50)

> 작업표는 「바위 ·공유 35/50」인데 04·49 에도 큰 바위가 있고 넷 다 하는 일이 같다 — **길이나 물 위에
> 놓인 목표물이자 앉는 자리**다. 하나로 그리되, 35 권이 요구하는 **물 자국 두 줄**만 그 자리의 상태로 둔다.

```
PROP SHEET - Rock   (mei-pencilslope · SCENE token: Rock)

The village's big boulders - beside the pool, across the ice, halfway up the slope, deep in the
wood. One rock drawing, four placements.

FORM: a boulder, EARTH, and 🔴 IT IS A THING ON A FIELD, so ONE CONTINUOUS OUTLINE, with the
  strokes running ALONG the rock's length. At most 4 crack lines inside it. 0 texture, 0 speckle,
  0 moss. It is a seat for one child and a step for one child, no bigger.
🔴 ITS TOP FACE IS UNSTROKED BARE PAPER - the brightest thing in the frame when the sun is on it,
  with strokes only around its sides. That single choice is what volume 35 means by "there is not
  one scrap of shade".
🔴 THE WATERLINE MARKS (volume 35, the pool rock): TWO horizontal EARTH lines on the rock's face,
  the lower one at an adult's ankle, the upper one at an adult's knee, and 🔴 THE FACE ABOVE THE
  UPPER LINE IS COMPLETELY BLANK - no third line, no mark of any kind. "There is no deeper than
  this" is said by the unmarked paper, so it must be plainly empty.
STATES:
  1 THE ROCK ALONE beside a MOSS pool field, seen level, top face bare paper.
  2 A CHILD SEATED ON TOP, side on - the rock is a seat, feet clear of the ground.
  3 THE ROCK FACE close, the two waterline marks across it, blank above.
  4 THE ROCK ON THE FAR BANK OF ICE, small in the frame, one outline, nothing inside it.
  5 THE ROCK AS A STEP halfway up a slope, a hind foot just landing on its top.
  6 A ROCK IN A WOOD with pressed leaf prints in the soil in front of it.

PLATE: the six states, plus the rock drawn beside a standing child and a standing adult for size.

NOT: no character face, no accent orange, no lettering or numerals, no rock texture, speckle, moss
or lichen, no cast shadow beside the rock, no blending, no third pencil, no white pencil, no
shading, gradient or glow.
```

### §2.25 Corn — 36 · 37권 (옥수수 · 하얀 대 · 알 여섯)

```
PROP SHEET - Corn   (mei-pencilslope · SCENE token: Corn)

Corn cobs. Volume 37 spills six kernels on a doorstep and counts them down to none; volume 36 hangs
cobs from the eaves. One cob, four conditions.

FORM: a cob, EARTH, ONE outline, the kernels as a REPEATED MARK - the same small mark in even rows,
  never individually drawn, never varied. 0 husk texture, 0 silk, 0 shine.
🔴 FOUR CONDITIONS, DRAWN IN A ROW AT ONE SCALE, because volume 37 compares them within one page:
  FULL (kernels edge to edge) · ONE BITE TAKEN (a rectangular patch of bare cob at one end) ·
  HALF (split lengthwise, the split face left as BARE PAPER) · THE WHITE STICK (the bare cob alone,
  no kernels anywhere, bare paper with at most 3 EARTH lines - 🔴 it is the brightest of the four
  and it is how this book says "finished").
🔴 A LOOSE KERNEL ON THE GROUND is ONE small EARTH mark with no outline. Volume 37 puts SIX on the
  ground at UNEVEN spacings - 🔴 no two gaps the same - and later shows the same ground with none.
  Draw both grounds here at one size so 6 and 0 can be laid over each other.
🔴 A GRITTY COB is the same cob with at most 9 tiny EARTH specks stuck across its surface, hard
  little marks, never a smudge and never a texture.
STATES:
  1 THE FOUR CONDITIONS IN A ROW.
  2 A COB HELD IN TWO PAWS, level, seen from the side.
  3 A COB SPLIT IN HALF by two big paws, the two halves side by side, split faces bare paper.
  4 THE DOORSTEP GROUND with six kernels at uneven spacings, high angle.
  5 THE SAME GROUND, no kernels, identical framing.
  6 FIVE COBS HANGING FROM AN EAVE in a row, tied at their tops.
  7 ONE WHITE STICK LYING ALONE on a bench, nothing else in the frame.
  8 🔴 ONE BLACK SEED at the bottom of a plain wooden bowl of water, seen from straight above -
    a single CROSS-HATCH mark, hard-edged, no outline, and the ONLY mark inside the bowl. Volume 36
    turns on that one mark being findable, so the bowl is otherwise completely empty.

PLATE: the four conditions in a row, then states 2-8, with 4 and 5 stacked.

NOT: no character face, no accent orange, no lettering or numerals, no silk, husk fibre or
individually drawn kernels, no butter, steam or shine (steam belongs to the Steam sheet), no
blending, no third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.26 Flowers — 38권 (앵커의 「꽃 아홉 점」이 목걸이가 된다)

```
PROP SHEET - Flowers   (mei-pencilslope · SCENE token: Flowers)

Meadow flowers, and the chain made from them. The anchor already caps flowers at 9 dots on a page;
volume 38 takes three of them off the ground and threads them, so the picked state is settled here.

FORM - ON THE GROUND: at most 9 flowers, each ONE small bare-paper dot sitting in the MOSS grass
  field, with NO outline and NO stem drawn. 🔴 They are unstroked paper, so they are the small
  bright specks in a green field - never EARTH dots and never orange.
FORM - PICKED: a picked flower gains ONE short EARTH stem line and nothing else. Three picked
  flowers laid on grass lie PARALLEL, evenly spaced, and stay in exactly that arrangement for as
  many pages as the book leaves them there.
🔴 THE CHAIN: stems knotted end to end into a loop, at most 7 flowers in it, the heads all facing
  the same way. Half-made, it is an open arc with two loose ends. Finished, it is a closed ring.
  Both are EARTH stems and bare-paper heads - never a drawn braid or weave.
🔴 THE CHAIN IS NOT ORANGE AND IT DOES NOT REPLACE THE ORANGE. In volume 38 the chain and the
  orange ribbon end up on the same neck, so the two must be distinguishable at thumbnail: the
  ribbon is a flat orange band, the chain is a ring of pale dots.
STATES:
  1 THE MEADOW, 9 dots in the grass field.
  2 THREE PICKED FLOWERS lying parallel on grass, stems visible.
  3 THE SAME THREE, untouched, later in the day - identical framing.
  4 A HALF-MADE CHAIN held in one paw, open arc, two loose ends.
  5 A FINISHED CHAIN, a closed ring, held out flat.
  6 THE CHAIN ROUND A NECK with an orange band above it, both readable.

PLATE: the six states, plus one picked flower at large size showing head and stem.

NOT: no character face, 🔴 no accent orange on any flower, no lettering or numerals, no petals
counted or drawn individually, no leaves on a picked stem, no outline round a flower head, no
blending, no third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.27 Chestnuts — 04 · 39 · 40 · 42권

```
PROP SHEET - Chestnuts   (mei-pencilslope · SCENE token: Chestnuts)

Chestnuts - raw on the wood floor, on the stove top, on a plate, in a sack, and in a paper cone at
the market. Four books, one nut.

FORM: a nut, EARTH, ONE outline, one flat base line and a small point on top. 0 texture, 0 shine.
  About as wide as a child's eye knot is tall - it is small, and it stays small.
🔴 THE SPLIT NUT IS THE ONE BRIGHT THING: the shell stays EARTH but the flesh inside a halved nut
  is left as BARE PAPER, unstroked, with no outline of its own. Volume 42 makes that opened inside
  the brightest place on the page - so the halves are drawn large here, once.
🔴 A DISCARDED SHELL is a curved EARTH sliver, thinner than a whole nut, and shells are COUNTED:
  volume 42 puts SIX shells round a plate rim to say four other children came and went. Never draw
  a scatter; draw a countable number.
🔴 THE BURR (volume 04) is a spiked husk, EARTH, ONE outline, split open with the nut showing - at
  most 9 spikes and they are STRAIGHT lines, all the same length, never a hedgehog-like fuzz.
FORM - SACK: a cloth sack, MOSS, no outline (cloth is a field), its mouth gaping with at most 5
  nuts visible inside.
FORM - CONE: a rolled paper cone, BARE PAPER, unstroked, read only by what is around it, with nut
  tops showing at its mouth.
STATES:
  1 THREE NUTS on a stove top in a row, one long EARTH stick lying beside them.
  2 NINE NUTS heaped on a plate, from above.
  3 ONE NUT alone in the middle of the same plate with SIX shells round the rim. 🔴 2 and 3 at one
    size, stacked, so the emptying is countable.
  4 ONE NUT HALVED, the two halves side by side, flesh bare paper.
  5 A BURR split open on the ground with nuts spilling, at most 9 straight spikes.
  6 THE SACK held against a chest, mouth open, nuts showing.
  7 THE PAPER CONE held in two paws, nut tops at its mouth.

PLATE: the seven states at one scale, plus one nut drawn beside a standing child for size.

NOT: no character face, no accent orange, no lettering or numerals, no shell texture, grain or
shine, no fire or coals drawn under the nuts, no steam on this sheet (see Steam), no blending, no
third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.28 FurHat — 41권 (귀 구멍 둘이 이 권의 전부다)

```
PROP SHEET - FurHat   (mei-pencilslope · SCENE token: FurHat)

The fur hat. Volume 41 pulls it down over a rabbit's ears, and every page is about whether the ears
are inside it or out, so THE TWO EAR HOLES are the sheet.

FORM: a round pull-on hat, EARTH, ONE outline, with a plain turned brim and 🔴 the fur said by ONE
  repeated short mark round the brim only - never a fringe, never fluff, never individual hairs.
🔴 TWO EAR HOLES SIDE BY SIDE IN THE CROWN, evenly spaced, the same size, plainly holes: each is a
  CROSS-HATCH shape with a hard edge and no outline. Their spacing equals the spacing of a rabbit's
  ear roots. They are visible from the front, from above and from inside the upturned hat.
🔴 A TRAPPED EAR IS SAID BY THE HAT'S SIDE, NOT BY THE EAR: when an ear is pushed inside, the hat's
  side BULGES in the exact shape of that ear and the ear itself is not drawn at all. When an ear
  has been folded, it keeps ONE crease across its middle after it comes out - that crease is what
  says the morning happened.
🔴 THE BRIM IS A CLOCK: pulled to the eyes = the eye knots half covered · resting on the forehead =
  the eye knots fully clear. Nothing else about the hat changes between those two.
STATES - all straight on at one scale:
  1 THE HAT ALONE, upright, the two holes in the crown.
  2 THE HAT UPTURNED, held in two big paws, the two holes seen from inside.
  3 WORN, PULLED TO THE EYES, both ears inside - two ear-shaped bulges in the sides, no ears drawn.
  4 WORN, ONE EAR THROUGH one hole standing straight, one ear still bulging the side.
  5 WORN, ONE EAR THROUGH and the other ear lying folded OUTSIDE the hat, waiting.
  6 WORN, BOTH EARS THROUGH, standing at the same height, brim on the forehead - one ear still
    carrying its crease.
  7 THE HAT LYING UPSIDE DOWN ON THE GROUND, brim up.

PLATE: the seven states, plus a close-up of the two holes with an ear root drawn beside them.

NOT: no character face beyond eye knots and mouth, no accent orange on the hat, no lettering or
numerals, no fur fringe, fluff or individual hairs, no pompom, no outline round a hole, no
blending, no third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.29 LeafPile — 41 · 43권

```
PROP SHEET - LeafPile   (mei-pencilslope · SCENE token: LeafPile)

The heap of fallen leaves in the yard. Two books jump into it, one book scatters it and gathers it
back, so a pile and a scatter have to be plainly different things.

FORM - THE PILE: ONE mass of EARTH strokes with a RAGGED top edge and NO outline - it is a field,
  told from the ground only by its stroke direction lying a different way. At most 9 individual
  leaf shapes break the silhouette along its top, and NONE of them is a mirrored copy of another.
  It stands as high as a child's chest.
🔴 THE FLATTENED PLACE: after someone has landed in it, the pile is a LOW patch whose strokes lie
  flat in one direction, plainly lower than the ground beside it. 🔴 It is a dip, not a heap - and
  it is what says "someone was here" on the page where nobody is.
🔴 LEAVES IN THE AIR: at most 9 separate leaf shapes, EARTH, each with ONE outline (they are things,
  not a field, once they leave the mass), all at different angles, none mirrored. 🔴 No motion
  lines, no arcs, no trails - a leaf in the air is simply a leaf drawn away from the pile.
🔴 A SCATTER IS NOT A PILE: leaves lying spread across a slope are individual outlined shapes with
  bare ground showing between them, and there are at most 9. Draw a pile and a scatter side by side
  once so the two silhouettes cannot be confused.
STATES:
  1 THE PILE, whole, ragged top, chest high beside a standing child.
  2 A BODY GOING IN - two forelegs in, the pile's top edge broken at one place, 9 leaves in the air.
  3 THE FLATTENED PLACE, nobody there, lower than the ground round it.
  4 A SCATTER across a slope, 9 outlined leaves, bare ground between.
  5 THE PILE HALF REBUILT - a low mound with leaves being pushed inward from four sides.
  6 A BODY BURIED TO THE WAIST in a pile, three leaves resting on its shoulders.

PLATE: the six states, plus a pile and a scatter side by side at one size.

NOT: no character face, no accent orange, no lettering or numerals, no outline round the pile
itself, no motion lines, swirls or trails behind a flying leaf, no mirrored leaf shapes, no
blending, no third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.30 AppleTree — 44권 (「사과 · 나무 · 가지 · 밑동」을 접었다)

> 후보 넷은 한 그루다. 그리고 🔴 이 나무는 `Slope` 시트의 「비탈 중간의 나무 한 그루」와 **다른 나무**다 —
> 그건 30권에서 비를 긋는 굵은 나무이고 이건 산장 앞 사과나무다. 같은 시트로 두면 44권의 「높은 가지에만
> 다섯이 달렸다」가 30권의 비 가림용 밑동과 섞인다.

```
PROP SHEET - AppleTree   (mei-pencilslope · SCENE token: AppleTree)

The apple tree in front of the chalet. Volume 44 is one child too short to reach, so THE HEIGHT OF
THE LOWEST FRUIT is what this sheet fixes.

FORM: a single trunk, CROSS-HATCH, ONE outline, with at most 5 branches drawn as single outlined
  strokes. The crown is ONE flat MOSS mass with 0 individual leaves.
🔴 THE FRUIT LINE: the low branches are EMPTY, and FIVE apples hang on the high branches only.
  The lowest apple hangs plainly ABOVE the reach of a jumping child - draw a jumping child
  silhouette in one panel with a clear gap between its fingertips and the lowest apple. If that gap
  closes, the book has no problem.
FORM - APPLE: EARTH, ONE outline, one short stalk line, 0 highlight, 0 leaf. 🔴 ONE OF THE FIVE IS
  THE TOP ONE and it is drawn with a denser EARTH field than the other four - that density is how
  this series says "reddest", never a different colour.
🔴 A BENT BRANCH IS ONE CONTINUOUS CURVE, drawn as a bow: its far end comes DOWN to a child's face
  height while its root stays where it was. Released, it returns to the exact position of state 1 -
  🔴 draw the bent and the released branch at one size so they can be laid over each other.
  0 motion lines when it springs back; the apple simply sits at the top of the frame again.
STATES:
  1 THE WHOLE TREE from below, low branches empty, five apples high, top one densest.
  2 THE SAME TREE, one branch bowed down, an apple at face height.
  3 THE SAME TREE, branch released, identical to state 1.
  4 A JUMPING CHILD SILHOUETTE with a clear gap to the lowest apple.
  5 THE PICK - one paw pulling a branch from below and one paw closing on an apple, the stalk
    parting from the twig at frame centre.
  6 THE TRUNK BASE, close, roots as at most 3 lines, wide enough for three to sit against it.
  7 ONE APPLE with a single bite out of it, the bitten face left as BARE PAPER.

PLATE: the seven states, plus states 1 and 3 stacked, plus the tree beside a standing adult.

NOT: no character face (silhouettes only, for reach), no accent orange on an apple, no lettering or
numerals, no individual leaves, no bark texture beyond the cross-hatch, no apple highlight or
shine, no motion lines on a springing branch, no blending, no third pencil, no white pencil, no
shading, gradient or cast shadow.
```

### §2.31 Ice — 49권 (🔴 이 매체의 규칙이 가장 순수하게 나오는 자리)

> 앵커의 한 줄 — 「획 방향이 바뀌는 자리가 가장자리다」. 49권은 그것 하나로 열 쪽을 끌고 간다.
> **얼음 위의 자국은 그리는 게 아니라 결의 방향만 바꾸는 것**이고, 그 자국의 개수와 간격이 이 권의 자다.

```
PROP SHEET - Ice   (mei-pencilslope · SCENE token: Ice)

The frozen brook. Volume 49 crosses it on its backside four times, and every page is read off the
marks left behind, so the marks are the sheet.

FORM: 🔴 THE ICE IS ONE MOSS FIELD whose strokes ALL LIE ONE WAY across the page, never denser or
  lighter inside itself, with NO outline anywhere. 0 cracks, 0 bubbles, 0 shine, 0 reflection.
  Its edge against the snow bank is where the strokes stop and bare paper begins.
🔴 A MARK ON THE ICE IS A PATCH WHERE THE STROKES RUN A DIFFERENT WAY, AND NOTHING ELSE. It has
  NO outline, NO darker colour, NO edge line - the change of direction IS the edge. That is the
  anchor's rule used at full strength; if a mark gets an outline it becomes a thing lying on the
  ice instead of a mark in it.
🔴 THE MARKS ARE COUNTED AND THE GAPS ARE THE STORY: one mark, then two, then three with widening
  gaps, then four running from the near bank to the far rock with the LAST gap - between the fourth
  mark and the rock - left EMPTY. All marks are the SAME SIZE; only the gaps change.
🔴 SLIDING IS NOT DRAWN. No speed lines, no spray, no arcs. A sliding body is drawn stretched in
  the direction it is going, and the row of marks behind it says how far it came.
STATES - all from the same side view at one scale so the rows can be compared:
  1 THE ICE, empty, not one mark, a rock on the far bank.
  2 ONE MARK near the near bank.
  3 TWO MARKS, close together.
  4 THREE MARKS, gaps widening left to right, the third near the far rock.
  5 FOUR MARKS in a line from bank to rock, the last gap empty.
  6 ONE MARK CLOSE UP, filling the frame - only a change of stroke direction, no edge line at all.

PLATE: states 1-5 stacked one above another at one size so the marks can be counted against each
other, plus state 6 large.

NOT: no character, no accent orange, no lettering or numerals, 🔴 no outline or edge line round any
mark on the ice, no cracks, bubbles, sparkle, glint or reflection, no speed lines or spray, no
white pencil, no blending, no third pencil, no shading, gradient, glow or cast shadow.
```

### §2.32 Plate — 26 · 42 · 50권 (🔴 50권은 맨 종이 둘을 형태로만 가른다)

```
PROP SHEET - Plate   (mei-pencilslope · SCENE token: Plate)

The round plate. Three books lay things out on it and ask the reader to compare, and volume 50 puts
TWO different bare-paper things on it at once - which is the hardest thing this medium can be asked
to do, so it is settled here.

FORM: a round plate, EARTH rim with at most 2 rim lines, and 🔴 ITS INSIDE LEFT AS BARE PAPER so
  that what lies on it reads against light. ONE outline. 0 pattern, 0 glaze, 0 highlight.
🔴 THE THREE PLACES (volume 50) never move: LEFT = the flower shapes · CENTRE = the leaf heap ·
  RIGHT = the square lumps. A page may empty a place but may never move one or add a fourth.
🔴 TWO OF THOSE THREE ARE BARE PAPER, SO THEY MUST DIFFER BY SHAPE ALONE:
  FLOWER SHAPES are ROUNDED with a scalloped edge, several of them, never more than 9.
  SQUARE LUMPS are SQUARE with straight corners, exactly two of them, plainly larger.
  🔴 Neither gets an outline; both are read by the EARTH plate pulled around them. If a reader has
  to guess which is which, this sheet has failed. Draw them side by side at large size.
  THE LEAF HEAP is the only stroked one - a MOSS field, no outline, filling the centre place.
🔴 THE SAME THREE APPEAR AGAIN AT HILLSIDE SIZE in the same left-centre-right order: bare-paper
  flowers scattered low, moss leaves between them, bare-paper snow at the top. Draw that hillside
  strip on this sheet, under the plate, so the two readings line up.
STATES - all from straight above at one scale:
  1 ALL THREE PLACES FULL.
  2 THE RIGHT PLACE EMPTY, the other two untouched.
  3 THE CENTRE HEAP HALF GONE, left and right untouched.
  4 NINE ROASTED NUTS heaped on the same plate.
  5 THE SAME PLATE with one nut at its centre and six shells round the rim.
  6 FIVE LOAVES on the same plate, carried in two paws, seen at an angle.

PLATE: the six states, plus the flower shape and the square lump drawn large side by side, plus the
hillside strip in the same left-centre-right order.

NOT: no character, no accent orange, no lettering, numerals or maker's mark, no pattern, glaze or
rim decoration, no outline round anything that is bare paper, no fourth place on the plate, no
blending, no third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.33 WallPegs — 🔴 작업표에 없던 것. 31권과 36권의 자다

> 31·36 이 후보로 내놓은 것은 「가로지르고 · 삐노」였다. 둘 다 낱말이 아니거나 인물이다.
> **정작 두 권이 함께 기대는 것은 산장 왼쪽 벽에 같은 간격으로 박힌 못 다섯**이고, 31권은 그 못이 하나씩
> 차는 것으로 열 쪽을 세고 36권은 칫솔이 하나씩 빠지는 것으로 센다. 시트가 없으면 못 개수가 쪽마다 흔들린다.

```
PROP SHEET - WallPegs   (mei-pencilslope · SCENE token: WallPegs)

The row of pegs on the chalet wall. Two books count on them - one fills them one at a time, the
other empties them - so FIVE, EVENLY SPACED, IN A FIXED ORDER is the whole sheet.

FORM: FIVE wooden pegs, EARTH, each ONE short outlined stroke standing out from the wall, all the
  same length, all at the same height, evenly spaced left to right. 🔴 THE WALL BEHIND THEM IS A
  FIELD - the anchor's short repeated dash and nothing else, so an empty peg has NOTHING under it.
🔴 AN EMPTY PEG IS THE PICTURE. The wall under an empty peg carries no hook mark, no shadow, no
  outline - just the repeated dash - so that a hung thing reads as an event.
🔴 THE ORDER IS FIXED LEFT TO RIGHT AND NEVER CHANGES: peg 1 · 2 · 3 · 4 · 5. Things are hung from
  the LEFT and things are taken from the RIGHT, so "how far along" is legible at thumbnail size.
🔴 WHAT HANGS ON THEM (volume 31): an orange ribbon, an orange collar, a boot, a fur hat, a coil of
  kite string - drawn once each here at peg scale, each a silhouette that is separable from the
  other four at thumbnail. 🔴 The two orange ones are the ONLY orange on this sheet and they are the
  accent leaving its owners - the total amount of orange in the frame does not change, only where
  it is (see the anchor note in §4).
🔴 WHAT HANGS ON THEM (volume 36): five identical toothbrushes, EARTH, ONE outline each - and here
  the sameness matters, so all five are drawn as one shape repeated with no variation at all.
STATES - all straight on at one scale so the rows can be laid over each other:
  1 FIVE PEGS, all empty.
  2 ONE HUNG (leftmost), four empty.
  3 TWO HUNG, three empty.
  4 FOUR HUNG, the rightmost empty.
  5 FIVE HUNG, none empty.
  6 FIVE IDENTICAL TOOTHBRUSHES hung, none empty.
  7 THE SAME, three toothbrushes left, two pegs empty.

PLATE: the seven states stacked so the pegs register, plus the five hung objects drawn in a row.

NOT: no character, no lettering or numerals, no hook marks, nail heads or shadows on the wall, no
wall texture beyond the anchor's dash, no accent orange except the ribbon and collar where the
states name them, no blending, no third pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.34 Kite — 31권

```
PROP SHEET - Kite   (mei-pencilslope · SCENE token: Kite)

Two kites. Volume 31 flies one and cannot fly the other, and the difference between them is one
thing: string.

FORM: a flat diamond kite, MOSS, ONE outline, with a cross spar drawn as two EARTH lines and a
  short tail of at most 3 marks. 0 pattern, 0 tassels.
🔴 THE STRING IS ONE UNBROKEN EARTH LINE and it is the sheet's whole point: it runs from the kite
  in the sky, across the frame, all the way to a paw, WITHOUT A BREAK and without going behind
  anything. A kite that cannot fly is drawn with NO line attached to it at all - not a short stub,
  not a dangling end. 🔴 Line or no line: that is the comparison, so never hint at a missing line.
🔴 A COIL of string is a flat EARTH mass of concentric marks with ONE loose end running out of it.
  It is small enough to sit on a peg.
🔴 HEIGHT IS SAID BY SIZE AND POSITION ONLY - a high kite is small and near the top edge of the
  frame, a sinking kite is bigger and low. No motion lines, no wind lines, no arcs. Grass leaning
  one way is the only wind in this series.
STATES:
  1 A FLYING KITE small near the top of a frame with its string running unbroken to a paw at the
    bottom corner.
  2 A KITE HELD IN TWO FORELEGS against a chest, NO string anywhere on it.
  3 THE SAME KITE lying flat on bare earth, still no string.
  4 A SINKING KITE, larger and low in the frame, string still unbroken.
  5 A COIL OF STRING rolling out from under something, one end running away out of frame.
  6 THE COIL HUNG ON A PEG.

PLATE: the six states, plus states 1 and 2 side by side so "string" and "no string" sit together.

NOT: no character face, no accent orange on a kite, no lettering, numerals or patterns on the sail,
no motion lines, wind swirls or speed arcs, no broken or dotted string, no blending, no third
pencil, no white pencil, no shading, gradient or cast shadow.
```

### §2.35 Steam — 전권 공용 (🔴 앵커의 「김 다섯 자락」이 세는 자로 쓰이고 있다)

> 앵커는 `steam at most 5 curls` 로 상한만 정했는데, 대본은 그 다섯을 **숫자로** 쓰고 있다 —
> 02권은 「p1 보다 김이 굵다」가 시간의 유일한 표이고, 29권은 「김 나는 그릇 수」가 국자가 어디까지 왔는지를
> 말하며, 20권은 「김이 하나도 안 오른다」가 늦었다는 뜻이다. 상한이 아니라 **눈금**이므로 시트가 필요하다.

```
PROP SHEET - Steam   (mei-pencilslope · SCENE token: Steam)

Steam and breath. They are not decoration in this series - they are the clock and the counter, so
their counts and their thickness are settled once.

🔴 STEAM IS EARTH, drawn as SEPARATE CURLS - never a cloud, never a mass, never a field. Each curl
  is one stroke that turns at most twice. They rise from one point and they FAN OUTWARD; no two are
  the same shape and none is a mirrored copy of its neighbour.
🔴 THE COUNT IS THE MEANING, AND FIVE IS THE MAXIMUM: 0 curls = cold, and it is a statement (a
  plate nobody waited for). 1 curl = barely. 3 curls = ordinary. 5 curls = the most this series
  ever shows, and it reaches the top edge of the frame. Draw 0, 1, 3 and 5 in a row at one scale.
🔴 THICKNESS IS THE OTHER DIAL: the same 5 curls drawn THIN mean "a while ago", drawn THICK mean
  "now". Volume 02 compares a thin five against a thick five across eight pages, so draw both fives
  at one size for that comparison.
🔴 STEAM ESCAPING A CLOSED LID comes out at the RIM ONLY, in at most 3 short curls that lean the
  same way - it never rises from the middle of a lid.
🔴 BREATH IN COLD AIR IS NOT STEAM. It is BARE PAPER: rounded unstroked lumps in front of a muzzle,
  at most 3, 🔴 with NO outline, and the one FURTHEST from the mouth is the LARGEST while the one
  nearest is the smallest. That size order is what makes it read as breath and not as a cloud.
STATES:
  1 A ROW: 0, 1, 3 and 5 curls over four identical bowls.
  2 FIVE THIN CURLS and FIVE THICK CURLS over two identical pots, side by side.
  3 THREE RIM CURLS escaping a closed lid, seen from above.
  4 FIVE CURLS reaching the top edge of a tall frame.
  5 BREATH - three unstroked lumps in front of a muzzle, largest furthest out, no outlines.
  6 A CART with five curls rising from it, seen small and far, curls still countable.

PLATE: the six states at one scale, with state 1 large enough to count each curl.

NOT: no character face, no accent orange, no lettering or numerals, 🔴 no steam cloud, mass, puff or
plume, no outline round breath, no more than five curls anywhere, no mirrored curls, no white
pencil, no blending, no third pencil, no shading, gradient, glow or cast shadow.
```

---

## §2-A. 🔴 사물 때문에 앵커가 깨지는 자리 — 다섯 (신고)

> 퐁이의 「갈대 7획이 41권에서 아이를 못 가린다」와 같은 자리다. 시트를 쓰다가 드러난 것만 적는다.
> 🔴 **고칠 곳은 시트가 아니라 `mei-anchor.md` §1 이다.**
>
> ✅ **2026-09-04 — 다섯 다 처리했다.** ①은 `RENDERING` 의 `FINISHED THINGS PER PAGE = 2` 뒤에 「다섯을
> 세는 쪽에서는 그 다섯이 완성된 것 하나」 · ②는 `PALETTE` 의 주황 항에 「떠나도 된다, 총량은 안 변한다」 ·
> ③은 `SNOW`·`FOREST` 의 권 번호를 조건으로(그리고 `PATH` 조항을 하나 신설) · ④는 `CHALET` 조항에
> 「안 칠한 자리가 둘이면 작은 쪽이 불, 큰 쪽이 창·눈이고 주인공은 아이가 향한 쪽」 · ⑤는 이 문서 **§1.3~§1.5**.
> 여기에 더해 **관통 줄 두 줄이 실측으로 거짓**이라 같이 고쳤다(`FIVE:` 13쪽 · `GROWN:` 28권 일곱 쪽,
> 근거는 `mei-anchor.md` 관통 줄 밑에).
>
> **✅ SCENE 토큰 오기 — 3쪽 고쳤다** (한국어는 안 건드렸다)
>
> | 권·쪽 | 대본이 말하는 자리 | 붙어 있던 토큰 | 고친 토큰 |
> |---|---|---|---|
> | 19 p2 · p10 | 개울에 걸친 **통나무 위**(밑으로 물살이 흐른다) | `[Wood]` (숲) | `[Brook]` |
> | 11 p10 | 산길 끝의 **민둥 바위 꼭대기**(p1 이 「길 끝 저 위에」로 예고한다) | `[Brook]` (물) | `[Path]` |
>
> 🔴 **그리고 앵커가 스스로 그림자를 막고 있었다**(갈래 ②를 앵커에서 발견한 자리) — `SHADING IS ZERO` 줄이
> `no cast shadow` 를 달고 있는데, **20권 p6 은 그림자 길이가 「어제보다 해가 더 기울었다」를 말하는 유일한
> 수단**이고 15권 p7·03권 p6 도 같은 가족이다(실측 3쪽). 금지를 푸는 대신 **매체로 옮겼다** — 「그림자는
> CROSS-HATCH 면 하나이고, 가장자리는 여기 모든 가장자리와 같이 **획 방향이 바뀌는 자리**이며, 길이가 시계다」.
> 🔴 **금지어는 복사가 기본값이라** `Slope` 시트 NOT 에도 그대로 있었고 내가 새로 쓴 세 장에도 베껴 넣을
> 뻔했다 — 자리 시트 넷의 NOT 에서 `cast shadow` 를 뺐다(사물 시트 31장은 그대로 둔다. 판 위에 바닥이 없다).
>
> ⚠️ **안 고친 것**: 13권 p6·p8 「소소 집 앞」은 `[Path]` 로 둔다. 산길이 아니라 문 앞이지만 **길가에 붙은
> 집**이고, SCENE 을 건드리는 대신 §1.4 `Path` FIXED PARTS 에 **「길가의 문과 벽, 썰매를 기대 세우는 자리」**
> 를 넣었다 — 고칠 곳이 둘일 때 시트 쪽이 싸다.

**① `FINISHED THINGS PER PAGE = 2` 가 「다섯을 세는 쪽」과 충돌한다.**
앵커는 한 쪽에 완성된 것 둘(그 쪽의 아이 + 그 아이가 만지는 것 하나)만 허용하고 나머지는 속이 빈
형태로 두라고 한다. 그런데 이 시리즈 **열네 권**이 다섯을 나란히 놓고 견주는 쪽으로 끝난다 —
보자기 다섯(07 p7) · 흰 빵 다섯(26 p3) · 그릇 다섯(29 p4) · 못 다섯(31 p9) · 이불 다섯(25 p10) ·
말뚝 다섯(24 p5). 다섯 중 하나만 완성하면 나머지 넷이 견줄 수 없는 형태가 되어 **비교 자체가 죽는다.**
→ 제안하는 한 줄: `WHEN A PAGE COUNTS A SET OF FIVE, THE FIVE COUNT AS ONE FINISHED THING - drawn
identically at one detail level, one size, one depth - and the child is the other. Nothing else on
that page gets interior detail.`

**② `ACCENT ORANGE — nothing but the one small orange thing each child carries` 가 세 권에서 깨진다.**
38권은 그 리본을 **끊고**(끊긴 조각이 화면에서 가장 진한 것이 된다), 31권은 리본과 목깃을 **벽 못에 건다**,
10권은 목도리 끝에 **종을 새로 매단다**. 즉 주황은 아이 몸을 떠나고, 잘리고, 나중에 다시 매인다.
→ 제안: `The orange thing may leave its owner - hung on a wall, torn, set down - and while it is off
the child it is still that child's marker. The TOTAL amount of orange in a frame does not change
when it moves.` (31권 p9 은 다섯 개가 벽에 걸린 채로 다섯이 다 화면에 있다.)

**③ 🔴 `SNOW (volumes 01, 13, 16)` 와 `FOREST (volume 04)` 가 권 번호 목록이라 26~50이 통째로 밖이다.**
겨울 권은 01·13·16 만이 아니다 — **45(눈굴) · 46(눈 덮인 썰매길) · 47(눈더미) · 49(언 개울)** 이 전부
그 조항을 필요로 하고, 숲은 04 만이 아니라 **32(숲속 덤불)** 도 그렇다. 지금 문장대로면 이 여섯 권은
「눈을 안 칠한 종이로 둔다」와 「나무가 가까울수록 촘촘하게」라는 규칙 **밖**에 있다.
→ 고칠 곳은 여섯 권이 아니라 **목록을 조건으로 바꾸는 한 줄**이다:
`SNOW - wherever the SCENE says the ground is snow` · `FOREST - wherever the SCENE stage is Wood`.
(같은 종류의 신고가 `_SCENE-FINDINGS.md` 에 이미 여덟 시리즈에서 올라와 있다.)

**④ 안 칠한 밝은 자리가 한 화면에 둘일 때 서열이 없다.**
앵커 CHALET 조항은 「불빛은 안 칠한 종이이고 그 쪽에서 가장 밝다」고 한 문장으로 못 박는데,
45권 p4 는 **난로 불빛과 창이 한 화면에** 있고(「칠하지 않은 밝은 자리가 둘인데 아이는 창 쪽만 본다」),
30권 p5 도 **산장 창 하나**가 비 오는 화면에서 유일한 밝은 자리다. 「가장 밝은 것」이 둘이면 규칙이
아무것도 안 정한다.
→ 제안: `When two unstroked areas share a frame, the SMALLER one is the fire or the lamp and the
LARGER one is the window or the snow; the page's subject is whichever the child is facing.`

**✅ ⑤ 🔴 매체 규칙은 있는데 자리 시트가 없었다 — `Brook` · `Wood` · `Path`.** (→ §1.3~§1.5 로 썼다)
앵커에는 `BROOK` 조항과 `FOREST` 조항이 있고 SCENE 은 `[Brook]`(05·19·26·35·49) · `[Wood]`(04·32) ·
`[Path]`(04·20) 를 실제로 찍고 있는데, `mei-stages.md` §1 의 자리 시트는 **다섯 장(Piazza·Slope·
Chalet·Seats·Slide)뿐**이라 그 셋이 없다. 사물 시트 여섯 장(`SteppingStones`·`Log`·`Rock`·`Ice`·
`Berries`·`StoneWall`)이 지금 **자리 없는 물 위와 길 위에 떠 있다.**
→ ✅ §1 에 세 장을 더 만들었다. 특히 `Path` 는 20권이 **짧은 길과 먼 길이 같은 지붕에서 만나는 한 화면**을
요구하므로 자리 시트 없이는 그 권의 첫 쪽이 성립하지 않는다 — 그래서 그 관계를 §1.4 가 지형으로 못 박는다.

### 🔴 자리 시트에 넘긴 것 (§1 이 받아야 할 것)

| 넘긴 것 | 받을 시트 | 무엇을 얹어야 하나 |
|---|---|---|
| ✅ 08 「무대」(10쪽) | `Piazza` §1.2 | §1.2 THINGS 에 「무대 널빤지」만 있다. **뒤에 건 천 · 무대 앞 긴 의자 줄 · 무대 옆 계단 세 칸**이 빠져 있다 |
| ✅ 17 p6↔p10 · 40 「장날」 | `Piazza` §1.2 | 🔴 **광장에 두 상태가 있다** — 「빈 돌바닥(탁자도 천도 깃발도 없다)」과 「긴 탁자·건 천·늘어놓은 그릇·좌판 지붕 넷」. 17권은 같은 각도로 그 둘을 견주고, 40권은 장날 쪽만 쓴다 |
| ✅ 17 「해와 지붕 선」 | `Piazza` §1.2 | 🔴 **해가 지붕 선 어디에 걸렸는가가 17권의 시계다**(가려짐 → 반쯤 → 완전히 위). 지붕 선 높이를 시트가 못 박아야 세 상태가 견줘진다 |
| ✅ 15 「미끄럼틀 · 사다리 계단」 | `Slide` §1.6 | 꼭대기 발판 · 널 · 양옆 난간 · 사다리 칸수. 🔴 p1 이 **같은 물건의 두 끝을 한 화면에서 크기 차로** 보여 달라고 한다 |
| ✅ 10 「이층 계단」 | `Chalet` §1.6 | 곧게 뻗은 널 · 난간 살(그 사이로 인형 발이 나온다) · 🔴 **중턱에서 어둠에 잘리는 높이**가 p2·p7·p9 에서 똑같아야 한다 |
| ✅ 30 「큰 나무」 | `Slope` §1.1 | `Slope` 의 「비탈 중간 나무 한 그루」에 **밑동 굵기 = 웅크린 아이 하나를 가린다**와 **잎 사이로 곧게 떨어지는 빗줄기**를 얹을 것 |
| ✅ 33 「눌린 풀 자국」 · 34 「뛰어다닌 자국」 | `Slope` §1.1 | 🔴 `TRACKS` 절이 **눈만** 말한다. 풀밭에 눌린 자국도 같은 규칙(맨 자리 + 양옆 획이 그 방향)이고, **자국 길이가 33권의 자**다(한 뼘 → 비탈 통째) |
| ✅ 20 「지름길과 먼 길」 | `Path` §1.4 | 좁은 길이 곧게 지붕에 닿고 넓은 길이 크게 휘돌아 **같은 지붕**에 닿는 한 화면 |
| ✅ 02 「부엌 화덕」 | `Chalet` §1.6 | 🔴 `Piazza` §1.2 의 화덕과 **다른 화덕**임을 두 시트에 다 적을 것 |

### 🔴 작업표(`_PROP-SHEETS.md` `## mei`)가 틀린 자리 — 다섯

1. **권이 통째로 빠졌다** — 43권만 올라와 있고 **06 · 09 · 11 · 16 · 18 · 31 · 47** 일곱 권이 없다.
   그중 **16(눈사람) · 31(못 다섯) · 47(썰매 매듭)** 은 그 권이 통째로 기대는 사물이 있다.
2. **그 권의 주인공 사물이 빠졌다** — 03권 후보는 「돌바닥 · 분수 · 소소」인데 셋 다 자리이거나 인물이다.
   **아홉 쪽에 나오는 공**이 없다. 퐁이 08 의 의자와 같은 종류의 누락이다.
3. **부분문자열로 묶었다** — 「나무 ·공유 04/27/30/44」의 27 은 **나무 숟갈**이다. 「비스듬히 · 가로지르고 ·
   아래로 · 건너편」 같은 방향 부사가 낱말로 올라와 있다.
4. **다른 물건을 같은 이름으로 묶었다** — 「입구 34/45」(흙굴 ↔ 눈굴, **정반대**) · 「종이 14/23」 ·
   「계단 10/15」 · 「탁자 21/23」. 넷 다 접으면 그 권의 그림이 죽는다.
5. **§2 표의 토큰이 §1 과 부딪힌다** — 옛 표의 `Slide` 는 §1 자리 시트 `Slide` 와 **같은 이름**이었다.
   이번 판에서 사물 쪽을 지우고 자리로 넘겼다.

### 🔴 인물 라벨에만 있어서 사물 시트가 못 받는 것 — **캐스트 시트로 넘긴다**

> 추출기는 SCENE 의 「배경·소품」과 「컷」만 읽는다. 그래서 **몸에 붙어 있는 물건과 몸 자체의 상태**는
> 표에 한 줄도 안 올라오는데, mei 에서는 그게 여러 권의 주인공이다. 사물 시트로 만들 수 없는 것들이라
> (`mei-anchor.md` §2 캐스트 시트 몫) **여기에 목록으로 남긴다.**

| 권 | 인물 라벨에만 있는 것 | 왜 시트가 필요한가 |
|---|---|---|
| **26** | 🔴 **흙이 새까맣게 낀 두 앞발 ↔ 씻어 뽀얀 두 앞발** | 열 쪽 중 여덟이 그 손이다. 「하얀 빵 위의 까만 자국」이 전부 이 손에서 나온다. 캐스트 시트에 **더러운 손 / 씻은 손** 두 상태 + 🔴 손가락 사이 골까지 보이는 클로즈업 |
| **38** | 🔴 **끊긴 주황 리본 두 도막 / 매듭까지 다시 맨 리본** | 앵커는 리본을 「달고 다니는 주황 하나」로만 정해 뒀다. 이 권은 그걸 **끊는다** — 끊긴 조각이 화면에서 가장 진한 것이 되는 쪽이 있다 |
| **10 이후 전권** | 🔴 **목도리 끝의 종** (종 이전 / 종 이후) | 앵커의 메이는 「주황 목도리」뿐이고 종이 없다. 10권 p8 이 그 시점이라 캐스트 시트가 **두 상태**를 들어야 그 앞뒤가 그림에서 갈린다 (사물 쪽은 §2.10 `Bell`) |
| **41** | 🔴 **가운데가 한 번 꺾인 긴 귀 한 짝** | 모자에 눌렸던 자국이 나온 뒤에도 **한 쪽 귀에만** 남는다. 그 접힌 자국이 「아침에 있었던 일」의 유일한 표다 |
| **33** | 굳은 흙이 껴 **부챗살처럼 벌어진 채 안 눕는 가시 등** ↔ 씻어 완전히 동그랗게 말리는 등 | 「반만 접힌다 / 끝까지 닫힌다」가 이 권의 사건 전부다. 등이 곧 몸이라 사물이 아니다 |
| **32 · 42** | **열매로 불룩한 주황 앞치마 주머니 ↔ 납작한 주머니** | 앵커의 악센트 주머니가 **부피 상태**를 갖는다. 32 는 채우는 쪽이 착지이고 42 는 비우는 쪽이 착지다 |
| **19 · 30 · 33 · 35** | **젖은 털이 몸에 붙어 몸집이 작아 보이는 상태** | 19 p6 이 「아까 제일 크던 몸이 제일 작아졌다」로 못 박는다. 젖음은 색이 아니라 **실루엣**이라 시트가 없으면 그냥 어둡게 칠하게 된다 |
| **34 · 45 · 39 · 28** | 게스트 넷 — 마멋(네 발·옷 없음) · 오소리(배낭) · 아기 곰(할머니 축소형) · 개(담장 너머) | 넷 다 **주황이 없고** 다섯과 다른 규격이다. 앵커의 THE FIVE 는 이들을 안 덮는다 |

---

## §3. 🔴 미결 — 「광장」 2갈래 (3쪽) · 그리고 「자리」라는 새 종류

> 🔴 **이 §3 은 판정 근거만 적는다. 이름→토큰 변환의 SSOT 는 `_stage-tokens.json` 이다.**
> 표 출력·검사 = `node packages/client/scripts/extract-series-stages.mjs --tokens mei` (**미매칭 0** 이어야 한다).
> 🔴 **쪽 목록은 폐기했다** — 목록과 변환표를 따로 두니 어긋났다(변환표엔 있는데 목록엔 없는 이름이 나왔다).
> 규칙이 전 이름을 덮으므로 목록이 필요 없고, 「목록 밖이라 안 붙인다」가 생기지 않는다.
> 🔴 **SPOT**: `_stage-tokens.json` 의 `spots` 가 `null` 인 시트는 **시트명만** 붙인다. 값이 있는 시트도
> **A/B/C/D 는 카메라가 정하므로 경로표(§4)에서 정한다** — §3 에서 비워 둔 건 빈칸이 아니라 경로표 몫이다.
> 🔴 **일부 이름은 권을 알아야 정해진다**(`byBook`). 앞 쪽을 읽어야 하는 종류이고, 규칙 파일이 그걸 들고 있다.


| SCENE | 결정 | 종류 |
|---|---|---|
| 마을 광장 · 무대 위와 광장 | `Piazza` (+ SPOT A/B) | 좌표 |
| 🔴 **메이 자리 · 루디 자리 · 소소 자리** | `Seats` — **한 시트, 세 자리** | 🔴 **새 종류: 소유** |

🔴 **「자리」는 장소도 상태도 아니고 「누구의 것인가」다** — 15시리즈에서 여기만 나온 네 번째 종류다.
같은 탁자·같은 줄의 **어느 칸이 누구 것인지**가 세 권의 사건이라, 시트는 **자리 셋의 상대 위치**를 못 박는다
(왼쪽부터 소소 · 메이 · 루디, 고정). 장소가 아니라 **좌석표**다.


---

## §4. 권별 경로표

🔴 **권별 경로표는 [`mei-routes.md`](mei-routes.md) 로 옮겼다**(25권 250쪽 전부). 같은 표를 두 곳에
두면 반드시 갈라지므로 여기엔 견본도 남기지 않는다. 검사 = `build-series-routes.mjs --check mei`.

🔴 **01권 p1 의 「자국이 아직 하나도 없다」가 그 권의 첫 문장이고, 그건 그리는 게 아니라 안 그리는 것**이다.
§1.1 의 `TRACKS` 절이 그걸 받는다 — 자국을 **선 두 줄로 그리면** 이 매체에서 그건 「면 위에 놓인 것」이
되어 썰매와 같은 급이 된다.
