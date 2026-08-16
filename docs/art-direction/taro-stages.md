# 타로와 무무 — 무대·사물 시트 (견본)

> art-director 산출물 (2026-08-16). 시리즈 13 `taro-batik` · 25권 250쪽.
> 🔴 **앵커는 `taro-anchor.md` 가 SSOT다. 이 문서는 그 그림체로 그릴 대상을 확정한다** — 앵커를 고치지 않는다.
> 🔴 **이미지 생성은 여기서 하지 않는다.** 프롬프트까지가 이 문서의 일이다.
> 후보 원본 = `docs/changjak-books/taro/_stages.json` · 대본 SSOT = `docs/changjak-books/taro/_scenes.json`
>
> **실행 순서** ① §1 마을 지도를 **가장 먼저** 굽는다(좌우가 여기서 정해진다) → ② §2 자리 시트 14장
> → ③ §3 사물 시트 → ④ 그다음에야 쪽 컷. 🔴 **지도가 확정되기 전에 자리 시트를 굽지 마라** —
> 개울이 왼쪽인지 오른쪽인지가 25권 내내 안 바뀌어야 하고, 그건 자리 시트 안에서는 결정할 수 없다.

---

## §0. 🔴 후보 수를 실측으로 고쳤다 (되돌리지 말 것)

| | 처음 계획 | 실제 | 왜 |
|---|---|---|---|
| 시리즈 무대 | 3장 (`_stages.json.stages`) | **14장** | `stages` 는 **그 권의 최빈 장소**만 세고 「3권 이상」을 건다. 개울가는 **6권이 가는데** 자기 집으로 삼은 권이 둘뿐이라 목록에서 통째로 빠졌다. 타로네 집·무무네 집(각 8권·6권)도 없다 |
| 권별 무대 | 25장 (그 권이 머무는 자리 하나) | **0장 · 대신 경로표 25개** | 🔴 **「그 권이 머무는 자리 하나」가 없다.** 거칠게 병합해도 **권당 3.0곳**이고, 한 곳뿐인 권은 25권 중 **둘**(09 모래밭 · 20 개울)이다. 01권만 해도 마을 길·조감·우물 나무·개울 나무 **넷**을 돈다 |
| 사물 | 45개 | **21개** | 45 중 12개가 조사·관형형·용언(`칠하지`·`떨어지는`·`꼭대기와`·`뒤집힌`), 7개가 무대 요소(`마루`·`처마`·`흙바닥`)거나 앵커 조항이 이미 맡은 것(`그림자`·`빗줄기`) |

🔴 **가장 중요한 정정** — 지금 SCENE 은 「나무 밑」이라고만 쓴 쪽이 **17쪽(5권)** 있고, 그게 우물 나무인지 개울
나무인지 **아무 데도 안 정해져 있다**. 자리 시트는 그걸 그리는 문서가 아니라 **정하게 만드는 문서**다. 결정은
§4 경로표에 적힌다. `_stages.json` 이 이 자리를 `unresolved: ['개울 나무 밑','우물 나무 밑','열매 나무 밑','옆 나무 밑']`
로 표시한다 — 🔴 **전 시리즈 28곳이 같은 상태**다.

---

## §1. 마을 지도 — 가장 먼저 (1장)

01 p3 이 이 시리즈의 지리를 이미 못 박아 놨다: **왼쪽 끝 타로네 · 오른쪽 끝 무무네 · 왼쪽 나무 밑으로 개울 ·
오른쪽 나무 밑에 우물**. 그리고 같은 쪽 톤이 「두 나무가 크기도 모양도 꼭 같아서 어느 쪽인지 화면이 안
정해 준다」라고 적혀 있다 — 즉 **두 나무가 같게 생긴 것이 01권의 사건**이다. 지도 없이 권마다 그리면 이 둘이
매번 달라지고, 01 은 착지를 잃는다.

```
STAGE SHEET - VillageMap   (taro-batik · bake FIRST, before every other sheet · SCENE token: VillageMap)

One island village seen from above and slightly tilted, as a child would draw a map. This single
drawing fixes left and right for all 25 books - nothing may flip afterwards.

LAYOUT (fixed forever):
  One earth road runs across the picture from LEFT edge to RIGHT edge, wide enough for two children
  to stand apart on it.
  FAR LEFT of the road: a small house on low stilts with a deep overhanging eave and an open
  boarded floor, its yard opening onto the road.
  FAR RIGHT of the road: a second house of the same build, mirrored, its yard opening onto the road.
  Behind the LEFT house, a narrow stream runs down the picture and crosses under one huge tree.
  Behind the RIGHT house, a round low well stands beside a second huge tree.
  BEYOND THE RIGHT EDGE the ground opens out into flat pale sand and then water.
  BEHIND the whole village, higher ground with a grass slope; a third tree stands alone where
  the road splits in two.
  THE TWO HUGE TREES ARE THE SAME TREE DRAWN TWICE - same mass, same outline, same lean, same
  height. Only what stands at the foot differs: stream on the left, well on the right.

VALUES: roofs and both tree masses DEEP · road, walls and stream MID · the open ground between the
  two houses is one broad CLOTH area, and the sand beyond the right edge is CLOTH · at most 4 flat
  DEEP house silhouettes behind, with 0 windows.

PLATE: the map once as a wide tilted overhead, and once again as a flat plan diagram with the same
  left-right order, so the two can be checked against each other.

NOT: no character of any kind, no orange anywhere on this sheet, no lettering, numerals, signs or
  map labels, no compass, no gradient, no glow, no soft edge.
```

⚠️ 지도는 **01 p3 · 12 p1 두 쪽에서 그대로 컷으로 쓰인다** — 그러니 이 장은 시트인 동시에 그 두 컷의 원판이다.

---

## §2. 자리 시트 — 14장

🔴 **스크립트 출력은 후보 20개다. 시트는 14장이다** — 남는 여섯은 **한 시트 안의 SPOT**이다
(`타로네 마당`·`타로네 마루`·`타로네 마루 밑`·`타로네 마루 앞`·`타로네 처마 밑`·`마당 구석` = `TaroYard` 하나).
접는 것이 사람의 일이고, 접은 결과가 이 표다. 🔴 **접는 기준 = 카메라가 한 걸음 옮기면 닿는가.** 닿으면 SPOT,
가려면 화면을 갈아야 하면 별개 시트다.

| # | 토큰 | 자리 | 가는 권 | 비고 |
|---|---|---|---|---|
| 1 | `WellTree` | 우물 나무 밑 | 01 03 05 06 08 10 11 15 16 | 🔴 최다. §2.1 |
| 2 | `CreekTree` | 개울 나무 밑 | 01 | 🔴 WellTree 의 쌍둥이. §2.2 |
| 3 | `VillageRoad` | 마을 길 | 01 02 03 04 05 08 10 11 14 16 21 22 24 25 | 길 자체 · 처마 둘 사이 |
| 4 | `Creek` | 개울가 | 02 06 07 11 14 18 20 24 | 얕은 위쪽 / 징검돌 / 둑길 |
| 5 | `TaroYard` | 타로네 마당·마루·마루 밑·처마 | 02 04 05 07 15 19 22 25 | 마루 밑 어둠이 07·19 의 사건 |
| 6 | `MumuYard` | 무무네 마당·마루·처마 | 03 04 05 10 16 22 23 25 | 🔴 TaroYard 의 좌우 반전 |
| 7 | `SandFlat` | 모래밭 | 09 14 21 | 모래 = CLOTH |
| 8 | `ForkTree` | 갈림길 나무 | 11 **18** | 세 번째 나무 · 큰 나무 둘과 달라야. 🔴 **18권의 「나무 밑」이 이 나무다** — §3 |
| 9 | `FruitTree` | 열매 나무 밑 | 13 | |
| 10 | `ShadeHouse` | 큰 잎 자라는 자리·그늘집 | 12 | |
| 11 | `NewPath` | 새 길 어귀 | 17 | |
| 12 | `UpturnedBoat` | 뒤집힌 배 | 21 | 모래밭 안의 자리 |
| 13 | `GrassPatch` | 풀숲·풀밭 | 07 13 17 19 | |
| 14 | `VillageMap` | 마을 전체 | 01 12 | §1 |

### §2.1 WellTree — 실제 프롬프트

```
STAGE SHEET - WellTree   (taro-batik · use the anchor's VILLAGE clause · SCENE token: WellTree)

The right-hand end of the village road: one huge tree with a round well beside it. Ten of the
twenty-five books sit here, so this drawing decides the place once and nothing about it changes
afterwards.

TWIN RULE: this tree and CreekTree are THE SAME TREE DRAWN TWICE - identical mass, identical
outline, identical lean, identical height. Only what stands at its foot differs. A reader must not
be able to tell the two trees apart from the tree alone.

FIXED PARTS:
  TRUNK - one DEEP mass several times an adult's width, going straight up and out of frame. Three
    roots break the ground on the road side, the middle one thickest. No bark drawn: the mass is
    one flat DEEP area and the only marks inside it are at most 4 crack hairlines, never in a row.
  CROWN - one DEEP mass, reaching further over the road than over the back, so its shade falls on
    the road. Its leaves are one stamped shape, at most 9 of them showing along the mass edge.
  WELL - a round rim about knee-high on a child, one flat MID band with a DEEP circle inside it,
    standing to the RIGHT of the trunk about one trunk-width away, low enough that the trunk hides
    its left half when seen from the road.
  GROUND - one broad CLOTH area of bare earth under the crown, MID beyond it. THE SHADE EDGE IS A
    HARD LINE, never a fade.
  ROAD - leaves the frame to the LEFT and runs long and empty toward the rest of the village.

SPOTS - the four places the camera stands. Do not invent a fifth.
  A ROAD SIDE, wide, low: trunk at frame right, the long empty road filling frame left.
  B AT THE FOOT, medium, low: the trunk close at a seated child's height, well rim entering at the
    right edge with its left half behind the trunk.
  C THE EARTH, close, high: only the CLOTH ground and the three roots, looking straight down.
  D BEHIND THE TRUNK, medium: the trunk fills the middle of the frame and blocks it; the road is
    visible only at the two edges.

PLATE: A, B, C and D as four panels on one sheet, plus one small overhead diagram showing where
  trunk, well, roots and road sit relative to one another.

NOT: no character of any kind, no orange anywhere on this sheet, no lettering or numerals, no
  gradient, no glow, no soft or feathered edge.
```

### §2.2 CreekTree — 쌍둥이

```
STAGE SHEET - CreekTree   (taro-batik · VILLAGE clause · bake AFTER WellTree · SCENE token: CreekTree)

The left-hand end of the same road. THIS IS THE SAME TREE AS WellTree: copy the trunk mass, the
crown mass, the outline, the lean, the height and the three roots exactly. Two things differ and
nothing else.

  1 THE FOOT - no well. A narrow stream, one unbroken MID band with 0 ripples and 0 glints, passes
    the roots on the road side and leaves the frame; a few stepping stones sit in it as flat DEEP
    shapes. Wet ground beside it stays DEEP.
  2 THE GROUND - fallen leaves lie thick under the crown instead of bare earth: the nearest ten or
    so are separate stamps and the rest carries on as one joined CLOTH area (this is a BED and is
    exempt from the repeat cap).

Same four SPOTS as WellTree, in the same order, so that A/B/C/D of the two sheets can be laid side
by side and read as one mirrored pair.

PLATE: the four panels, plus ONE COMPARISON PANEL - CreekTree and WellTree at the same size side by
  side, so that the crowns can be checked as identical.

NOT: no character, no orange, no lettering or numerals, no gradient, no glow, no soft edge.
```

🔴 **나머지 11장은 이 형식 그대로다** — `FIXED PARTS` / `SPOTS` / `PLATE` / `NOT`, 장당 900~1,500자.

---

## §3. 사물 시트 — 21장

> 🔴 **이 §3 은 판정 근거만 적는다. 이름→토큰 변환의 SSOT 는 `_stage-tokens.json` 이다.**
> 표 출력·검사 = `node packages/client/scripts/extract-series-stages.mjs --tokens taro` (**미매칭 0** 이어야 한다).
> 🔴 **쪽 목록은 폐기했다** — 목록과 변환표를 따로 두니 어긋났다(변환표엔 있는데 목록엔 없는 이름이 나왔다).
> 규칙이 전 이름을 덮으므로 목록이 필요 없고, 「목록 밖이라 안 붙인다」가 생기지 않는다.
> 🔴 **SPOT**: `_stage-tokens.json` 의 `spots` 가 `null` 인 시트는 **시트명만** 붙인다. 값이 있는 시트도
> **A/B/C/D 는 카메라가 정하므로 경로표(§4)에서 정한다** — §3 에서 비워 둔 건 빈칸이 아니라 경로표 몫이다.
> 🔴 **일부 이름은 권을 알아야 정해진다**(`byBook`). 앞 쪽을 읽어야 하는 종류이고, 규칙 파일이 그걸 들고 있다.


45개 후보에서 잘라낸 것: **용언·관형형 12**(`칠하지` `떨어지는` `꼭대기와` `뒤집힌` `세워` `그대로` …) ·
**무대 요소 7**(`마루` `처마` `지붕` `흙바닥` `모래` `개울` `마당` — §2 자리 시트가 이미 맡는다) ·
**앵커 조항이 맡는 것 3**(`그림자` `빗줄기` `그늘` — `RAIN` 조항과 그림자 조항이 정의한다) ·
**신체 2**(`얼굴` `무릎` — 캐릭터 시트 소관).

| 토큰 | 사물 | 권·쪽 | 왜 필요한가 |
|---|---|---|---|
| `CoconutHalf` | 코코넛 껍질 반쪽 | 19(p1·p7·p8·p9) · 20(p1·p3·p7·p9·p10) · 04 | 🔴 **두 권이 같은 물건을 쓴다** |
| `Shells` | 조개 | 09 (p1~p10) | 한 권에 9쪽 |
| `Bowls` | 김 오르는 그릇 | 05 (p4·p6·p7·p8·p10) | 🔴 두 집 것이 같아야 한다 |
| `Pebbles` | 돌멩이 | 01(p6·p9) · 15(p4·p6) · 06 | 줄·세움 두 상태 |
| `WaterBasin` | 물 대야 | 19 (p1·p2·p9·p10) | |
| `Mat` | 깔개 | 22 (p6·p8·p9·p10) | 편 상태 / 구겨진 상태 |
| `WaterPails` | 물통 | 08(p3·p4·p5) · 11(p4) | 짧은 것·긴 것 |
| `Banana` | 바나나 | 03 (p4~p9) | |
| `LeafPouch` | 나뭇잎 주머니 | 05(p2) · 03 · 13 | |
| `FruitBunch` | 열매·가지 | 13 (p2~p9) | |
| … | (나머지 11장) | | |

### §3.1 CoconutHalf — 실제 프롬프트 (🔴 두 권이 공유)

```
PROP SHEET - CoconutHalf   (taro-batik · SCENE token: CoconutHalf)

Half a coconut shell, the size of two cupped child hands. The SAME object appears in two books -
as a pair of look-alike halves in one, and as a boat floating down the stream in the other - so it
is drawn once here and never redesigned.

FORM: a deep rounded bowl, outside MID with the weave of the cloth showing through, the cut rim one
  clean hard CLOTH line all the way round, inside DEEP. Three small dark eyes sit in a triangle on
  the closed end. NO shading, no sheen, no highlight anywhere on the curve - the curve is read from
  the rim line alone.
STATES - draw all three, at the same size, on one sheet:
  1 EMPTY, sitting mouth-up on the ground.
  2 A PAIR, two of them side by side mouth-up. 🔴 THE PAIR MUST BE THE SAME SIZE AND THE SAME SHAPE
    AS EACH OTHER, down to the rim line - a book turns on the two being impossible to tell apart.
  3 A BOAT, mouth-up and afloat, with one leaf standing in it: the leaf is a single stamped CLOTH
    shape pushed into the shell at the middle, leaning slightly back.
FLOATING RULE: afloat, the shell keeps its whole outline and the water it sits on is one unbroken
  MID area with 0 ripples and 0 reflections.

PLATE: the three states in a row, plus one overhead of the empty half showing the rim as a full
  circle.

NOT: no character, no hands, no orange anywhere on this sheet, no lettering or numerals, no
  gradient, no glow, no soft edge, no wood grain drawn inside the shell.
```

### §3.2 Shells — 실제 프롬프트

```
PROP SHEET - Shells   (taro-batik · use the anchor's WATER clause · SCENE token: Shells)

The shells of the sand flat, from a thumb to a palm across. One book lays them out for ten pages
straight - as scattered, as an armful, as a line, and finally as a ring - so their single shape is
fixed here.

FORM: one fan shape with a straight hinge and a ribbed fan opening from it - at most 7 ribs, drawn
  as hairlines, never more. Each shell is one flat MID area. 🔴 A SHELL IS NEVER CLOTH: the sand it
  lies on is CLOTH, and a shell that is left unwaxed would vanish into it.
STATES - draw all four on one sheet at consistent scale:
  1 ONE SHELL alone, hinge to the left, seen from straight above.
  2 HALF SUNK, tipped into the sand, only the fan edge showing.
  3 A HEAP the size of a child's face, the near six or seven separate and the rest carried on as
    one joined MID mass (a HEAP is a RUN and is exempt from the repeat cap).
  4 A LINE, laid hinge to hinge and curving away - the near six or seven separate, the rest one
    joined line.
DEPTH IN THE SAND: a shell resting on the surface gets ONE flat DEEP silhouette lying on the ground
  beside it with a hard edge, nothing shaded inside it. A shell pressed in gets none.

PLATE: the four states, plus one close-up of a single shell's ribs at large size.

NOT: no character, no hands, no orange anywhere on this sheet, no lettering or numerals, no
  gradient, no glow, no pearl sheen, no wet highlight, no soft edge.
```

---

## §4. 권별 경로표 — 25개 (🔴 시트가 아니라 표다)

컷을 굽기 전에 이 표를 채운다. 채우는 사람이 하는 일은 **자리 시트를 고르고 그 안 어디인지 정하는 것**뿐이고,
카메라·이어짐은 SCENE 에 이미 적혀 있다. 표가 있으면 열 장이 같은 개울이 된다.

### 01 「같은 나무 밑에서」

| 쪽 | 자리 시트 | 그 안 어디 | 카메라 | 앞 쪽에서 이어지는 것 |
|---|---|---|---|---|
| p1 | `VillageRoad` | 한복판 | 와이드·아이레벨 | — (좌=타로네 / 우=무무네) |
| p2 | `VillageRoad` | **p1 과 같은 지점** | 미디엄 와이드·측면 | 같은 흙바닥, 카메라만 옆으로 |
| p3 | `VillageMap` | 전체 | 와이드·하이앵글 | 🔴 여기서 좌=개울나무 / 우=우물나무가 확정된다 |
| p4 | `WellTree` | **B 밑동** | 미디엄·로우 | 크라운 그늘 안 |
| p5 | `CreekTree` | **B 밑동** | 미디엄·로우 (p4 **좌우 반전**) | 🔴 p4 와 각도·인물 크기가 같아야 한다 |
| p6 | `WellTree` | **C 흙바닥** | 클로즈업·하이 | 돌멩이 줄이 **왼쪽으로** 굽어 나간다 |
| p7 | `CreekTree` | **C 흙바닥** | 클로즈업·하이 (p6 과 같은 눈높이) | 잎 바닥, 눌린 자국 없음 |
| p8 | `CreekTree` | B | 익스트림 클로즈업·로우 | 뒤로 물러난 잎 덩어리 |
| p9 | `WellTree` | **A → B** (길에서 밑동으로) | 와이드·아이레벨 | 🔴 **p6 의 돌멩이 줄이 발밑에 그대로 있다** |
| p10 | `WellTree` | B | 미디엄 클로즈업·아이레벨 | 🔴 p4 의 우물 턱·밑동이 뒤에 그대로 |

### 05 「그릇 두 개」

| 쪽 | 자리 시트 | 그 안 어디 | 카메라 | 이어짐 |
|---|---|---|---|---|
| p1 | `WellTree` | B | 미디엄 와이드·측면 | 저물녘 |
| p2 | `TaroYard` | 방 안 | 미디엄 클로즈업·하이 | 머리맡에 `LeafPouch` |
| p3 | `WellTree` | **A 길 쪽** | 와이드·로우 | 밑동 우 / 빈 길 좌 |
| p4 | `TaroYard` | 마루 앞 | 미디엄 와이드·아이레벨 | 안쪽에 `Bowls` 둘 |
| p5 | `WellTree` | **A — p3 과 같은 화면** | 와이드·로우 | 🔴 인물만 바뀐다. 배경은 p3 을 그대로 |
| p6 | `MumuYard` | 마루 앞 | 미디엄 와이드 (p4 **좌우 반전**) | 안쪽에 `Bowls` 둘 |
| p7 | `MumuYard` | 마루 | 미디엄·하이 | `Bowls` 하나, 김 = CLOTH |
| p8 | `TaroYard` | 마루 | 미디엄·하이 (p7 **좌우 반전**) | 🔴 p7 과 그릇이 **같은 그릇**이어야 한다 |
| p9 | `MumuYard` + `TaroYard` | 칸 분할 | 미디엄 측면 × 2 | 가운데는 선이 아니라 어두운 띠 |
| p10 | `VillageRoad` | 한복판 | 와이드·아이레벨 | 오른쪽 끝에 `SandFlat` 이 밝게 |

🔴 **경로표에서 드러난 것 둘** — ①`WellTree` 의 A 는 05 에서 **두 번 같은 화면으로 쓰인다**(p3·p5). 시트가
없으면 그 둘이 달라지고, 「두 번 헛걸음」이 안 읽힌다. ②05 는 `TaroYard`↔`MumuYard` 를 **네 번 뒤집는다**
(p4↔p6 · p7↔p8). 두 집 시트를 따로 그리면 반전이 성립하지 않는다 — **한 집을 그리고 좌우를 뒤집은 것**이어야 한다.

---

## §5. 검수 — 이 시리즈의 다섯

1. 두 큰 나무가 **한 나무인가**(01 p3·p4/p5·p6/p7 을 나란히). 다르면 01 의 착지가 없다.
2. `WellTree` 우물 턱이 **밑동 오른쪽**이고, 길에서 보면 **왼쪽 반이 가려지는가**(06 p3 이 그렇게 적혀 있다).
3. 무대·사물 시트 어디에도 **주황이 0점인가**. 주황은 타로 허리끈·무무 머리끈에만 닿는다.
4. `TaroYard` 와 `MumuYard` 가 **같은 집을 뒤집은 것**인가.
5. 시트에 **글자·숫자가 0개**인가(5개 언어 번역판).
