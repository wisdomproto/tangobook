# 타로와 무무 — 무대·사물 시트 (견본)

> art-director 산출물 (2026-08-16 · 2026-09-05 뒤 25권 반영). 시리즈 13 `taro-batik` · **50권 500쪽**
> (§0·§2 표의 「25권」은 늘기 전 숫자다 — 🔴 시트 제목의 「N권 공유」류 숫자도 **그때 센 값이지 조건이 아니다**.
> 뒤 25권이 같은 물건을 쓰면 그 시트를 쓴다. 숫자를 문지기로 읽지 마라).
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

### 🔴 §2-0. 스팟 `E` 와 스팟 `T` — 뒤 절반이 요구한 두 자리 (2026-09-05)

**`E` = 가지 위.** `WellTree` 는 나무를 **밑동으로만** 정의하고 `Do not invent a fifth` 로 못을 박았는데,
뒤 절반이 **가지 위를 아홉 쪽** 요구한다(한 권은 열 쪽 중 여섯이 가지다 — 닭이 하나씩 올라앉고, 가지 끝이
몸무게로 활처럼 휘고, 나무 위와 나무 밑이 한 화면에 든다). 🔴 **금지 문구를 그대로 두고 그리면 화가가
매번 가지를 새로 지어내고, 「같은 가지가 휘었다」가 성립하지 않는다.** → `E` 를 연다. 열매 시트(`Fruit`)에
가지를 얹는 길은 안 골랐다 — 사물 시트는 `STATES` 만 들고 **카메라를 안 들기 때문**에 「아래에서 올려다본
가지」를 못 준다.

**`T` = 몸이 닿는 자리.** 자리 시트의 SPOT 은 전부 「자리를 보는 카메라」인데, 권마다 두세 쪽이
**마주 본 두 얼굴 · 겹쳐 쥔 두 손 · 코가 배에 닿은 자리**이고 대개 그게 그 권이 도는 쪽이다.
🔴 **열네 장 전부에 있고 이름은 어디서나 `T`** 다(알파벳을 잇지 않는다 — 시트마다 스팟 수가 달라
letter 를 이으면 같은 자리가 시트마다 딴 글자가 된다). 경로표 SPOT 칸에도 `T` 로 적는다.

```
  T WHERE TWO BODIES TOUCH, extreme close: the single point of contact and nothing else - two faces
    at one breath, two hands closed over each other, a nose against a belly. ONLY THE CONTACT IS
    WAXED AND FINISHED. Everything round it is ONE broad CLOTH field carried out to all four edges
    with 0 marks in it, and the sheet's own background value is named on its SPOTS list.
```

🔴 **한 물건이 화면을 다 채울 때 이 매체에서 올라가는 것은 하나뿐이다 — 크랙(crackle)이다.**
값은 셋 그대로고 마크 수도 그대로다(가까이 갔다고 잎이 늘지 않는다). 늘어나는 것은 **크랙의 굵기와 간격**
이라, `T` 와 익스트림 클로즈업에서는 크랙을 **그 크기에 맞춰** 굵게 성기게 그린다. 그게 「가까이 왔다」를
이 그림체가 말하는 유일한 방법이고, 안 그러면 클로즈업이 와이드를 확대한 것으로만 보인다.

---

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
  🔴 THE BRANCHES - THREE and no more, all on the road side, and their shape is fixed here because
    books are read against each other on it:
      THE LOW ONE, at a standing child's reach, thick and near level, long enough for FIVE hens to
        perch along it side by side. It is the one that is climbed onto and sat astride.
      THE MIDDLE ONE, higher and shorter, going back into the crown.
      THE THIN TIP - the low branch's own far end, and 🔴 IT IS DRAWN TWICE ON THIS SHEET AT ONE
        SIZE: straight, and bowed down under a body like a drawn bow. Same branch, same length,
        same start point - only the curve differs. A book turns ten pages on that one comparison.
  WELL - a round rim about knee-high on a child, one flat MID band with a DEEP circle inside it,
    standing to the RIGHT of the trunk about one trunk-width away, low enough that the trunk hides
    its left half when seen from the road.
  GROUND - one broad CLOTH area of bare earth under the crown, MID beyond it. THE SHADE EDGE IS A
    HARD LINE, never a fade.
  ROAD - leaves the frame to the LEFT and runs long and empty toward the rest of the village.

SPOTS - A to E are the five places the camera stands, and T is the contact spot every sheet has
(§2-0). Do not invent a sixth.
  A ROAD SIDE, wide, low: trunk at frame right, the long empty road filling frame left.
  B AT THE FOOT, medium, low: the trunk close at a seated child's height, well rim entering at the
    right edge with its left half behind the trunk.
  C THE EARTH, close, high: only the CLOTH ground and the three roots, looking straight down.
  D BEHIND THE TRUNK, medium: the trunk fills the middle of the frame and blocks it; the road is
    visible only at the two edges.
  E THE BRANCHES, medium, LOW AND LOOKING UP: the low branch runs across the frame against a CLOTH
    sky, the trunk entering at one edge, the ground out of frame. This is where anything sitting,
    perching or bending on the tree is drawn. 🔴 ONE VERSION OF E IS PULLED BACK far enough to hold
    THE BRANCH AND THE GROUND UNDER IT IN ONE FRAME - what is up and what is waiting below, so a
    thing dropped from the branch has somewhere to land in the same picture.
  T WHERE TWO BODIES TOUCH, extreme close (§2-0). BACKGROUND FOR T ON THIS SHEET: ONE broad CLOTH
    field - the bare earth under the crown if the contact is at ground level, the sky if it is on
    the branch. Never the trunk's DEEP mass; a contact drawn on DEEP loses its own edge.

PLATE: A, B, C, D and E as five panels on one sheet, plus T, plus the straight tip and the bowed tip
  at one size, plus one small overhead diagram showing where trunk, well, roots and road sit
  relative to one another.

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

Same SPOTS as WellTree - A, B, C, D, E and T - in the same order, so that the panels of the two
sheets can be laid side by side and read as one mirrored pair. 🔴 THE THREE BRANCHES ARE COPIED TOO,
same lengths, same heights, same bow on the tip: the twin rule holds for the branches or the two
trees stop being one tree. BACKGROUND FOR T on this sheet is the leaf bed under the crown.

PLATE: the four panels, plus ONE COMPARISON PANEL - CreekTree and WellTree at the same size side by
  side, so that the crowns can be checked as identical.

NOT: no character, no orange, no lettering or numerals, no gradient, no glow, no soft edge.
```

### §2.3 TaroYard · MumuYard — 🔴 두 마당이 전체의 절반이다 (2026-09-05 판정)

뒤 25권의 자리가 다섯 곳에 몰렸다: 두 마당만 **138쪽 = 55%**이고, `TaroYard`+`MumuYard`+`WellTree` 셋이
전체의 73%를 든다. 반대로 `ForkTree`·`FruitTree`·`ShadeHouse`·`NewPath`·`UpturnedBoat`·`GrassPatch`·
`VillageMap` **일곱은 뒤 절반에서 한 쪽도 안 나온다**. 🔴 **예산이 모자라면 저 일곱을 접는 게 아니라
두 마당을 더 깊게 판다** — 접어 봐야 아끼는 것이 1~4권짜리 시트이고, 모자란 것은 55%짜리 자리다.

🔴 **그리고 두 마당에는 접기 기준(「카메라가 한 걸음 옮기면 닿는가」)에 안 걸리는 자리가 셋 있다.**
셋 다 「같은 마당의 다른 각도」가 아니라 **다른 판**이므로 SPOT 으로 올린다 — 굽기 전에 정하는 것이
이 절의 일이다. `MumuYard` 는 `TaroYard` 의 좌우 반전이므로 셋을 그대로 물려받는다.

| 새 SPOT | 무엇을 보나 | 왜 한 걸음이 아닌가 |
|---|---|---|
| **E 마루 안쪽 방** | 문턱 너머 방 안이 통째로 한 판. 🔴 **방바닥에 든 밝은 띠**가 한 권 열 쪽의 시계라, 띠의 폭·각도·시작 자리가 이 판에서 굳는다. 벽은 DEEP 한 판, 바닥은 CLOTH, 창은 하나 | 문턱을 넘어야 보인다 — 마당에서도 마루에서도 안 보이는 화면 |
| **F 처마 끝 물줄기** | 지붕 끝에서 **곧게 떨어지는 한 줄기**가 화면을 세로로 가른다. 미디엄, 처마와 땅이 한 프레임. 줄기는 MID 한 줄이고 떨어지는 자리에 DEEP 웅덩이 하나 | 마당 와이드에서는 줄기가 지붕 선에 묻히고, 마루에서는 프레임 밖이다 |
| **G 마른 자리 경계선** | 널 위에 그어진 **젖은 데와 마른 데의 한 선**. 하이앵글, 널결이 화면을 가로지르고 선이 그것을 비스듬히 자른다. 젖은 쪽 DEEP · 마른 쪽 CLOTH · **선은 하드 에지, 절대 페이드 없음** | 한 권 열 쪽이 이 선 안쪽에서만 벌어진다 — 선이 프레임에 없으면 그 권이 없다 |

기존 SPOT 은 그대로다(A 마당 와이드 / B 마루 / C 마루 밑 어둠 / D 처마 밑). 여기에 **T**(§2-0)가 붙고,
두 마당의 T 배경은 **마당의 CLOTH 흙바닥**(밖) 또는 **마루 널의 CLOTH**(안)이다.

---

🔴 **나머지 11장은 이 형식 그대로다** — `FIXED PARTS` / `SPOTS` / `PLATE` / `NOT`, 장당 900~1,500자.
🔴 **열네 장 전부가 `T` 를 든다**(§2-0) — 시트별 T 배경은 한 줄로 정해 둔다: `VillageRoad`·`NewPath` =
**길의 CLOTH** · `Creek`·`SandFlat`·`UpturnedBoat` = **모래·물가의 CLOTH**(물 위면 물의 MID 한 판) ·
`GrassPatch`·`ShadeHouse`·`FruitTree`·`ForkTree` = **잎 그늘의 DEEP 이 아니라 그 옆 CLOTH 땅** ·
`VillageMap` = **T 없음**(사람이 안 나오는 시트다).

---

## §3. 사물 시트 — 31장 (후보 33에서 접고 뺐다 + 표 밖에서 여섯 · 2026-09-04 전권 판)

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

> 🔴 **단위는 권이다.** 한 권이 기대는 사물부터. 형식 정본 = 아래 §3.1 `CoconutHalf` · §3.2 `Shells`.
> 🔴 **이 시리즈의 매체 한 줄은 앵커가 이미 적어 놨다** — `THE CLOTH STARTS PALE AND ONLY GETS DARKER`.
> 밝은 것은 **왁스로 막은 자리**이고, 그래서 사물 시트가 매번 결정해야 하는 것은 **「이 물건은 담근 것인가
> 막은 것인가」** 하나다. `Shells` 가 그 판정의 정본이다 — 「모래가 CLOTH 라 조개는 CLOTH 일 수 없다」.
> 시트마다 그 한 줄이 어디에 걸리는지 본문에 못 박아 뒀다.

| § | 토큰 | 사물 | 권 (쪽 수) |
|---|---|---|---|
| 3.1 | `CoconutHalf` | 코코넛 껍질 반쪽 | 19 · 20 · 04 · **33**(6) · **44**(7) · **45**(5) |
| 3.2 | `Shells` | 조개 | **09**(10) · 38(4) · 41 · **43**(7) · 33 |
| 3.3 | `BroadLeaf` | 넓은 잎 (접시·자리·덮개·매달림) | 26(6) · 29 · 37 · 43 · 48 · 31 · 03 · 13 · 12 · 41 · 49 · 50 — 🔴 **12권 최다** |
| 3.4 | `Stones` | 돌멩이 (줄·세움·탑) | 01(2) · **15**(5) · 21 · **31**(4) · 42 |
| 3.5 | `HoleStone` | 구멍 뚫린 돌 | **06**(4) — 🔴 §3.4 와 접기를 거부한다 |
| 3.6 | `SandMark` | 모래에 파인 자국 (그림·화살표·줄) | **14**(5) · **21**(2) · **42**(3) |
| 3.7 | `Shadow` | 바닥에 놓인 평평한 그림자 | 04 · 11 · 21 · 26 · **32**(2) · 40 · 41 |
| 3.8 | `LightBand` | 틈으로 든 밝은 띠 | **32**(3) · 33 · 25 · 05 |
| 3.9 | `Lamp` | 등불 | 27(2) · 31(2) · 41 · **49**(2) |
| 3.10 | `StormSky` | 낮게 앉은 하늘 덩어리와 갈라진 자국 | **38**(4) · **41**(3) |
| 3.11 | `WaterStream` | 떨어지는 물줄기 | **30**(5) · 44(3) · 45 · 46 · 27 · 22 |
| 3.12 | `WaterBasin` | 물 대야 | 19(4) · **28**(4) · 30 · 27 · 37 |
| 3.13 | `WaterPails` | 대나무 통 | 08(3) · 11 · **46**(8) |
| 3.14 | `SteppingStones` | 징검돌 다섯 | **29**(3) · 26 · 11 |
| 3.15 | `GrassBracelet` | 풀 팔찌 | **25**(3) — 🔴 앵커 §3 「초록을 안 넣는다」의 그림 |
| 3.16 | `BerryBush` | 열매 덤불 (+ 버섯) | **37**(7) |
| 3.17 | `Banana` | 바나나와 그 껍질 | **03**(6) · **28**(4) · **29**(4) · 37 |
| 3.18 | `Fruit` | 가지 끝 열매 | **13**(6) · **40**(5) |
| 3.19 | `Mat` | 깔개 | **22**(4) · **32**(3) |
| 3.20 | `ShadeHut` | 그늘집 | **12**(4) |
| 3.21 | `Bowls` | 김 오르는 그릇 | **05**(5) · 29 |
| 3.22 | `WellBucket` | 두레박 | **46**(5) · 45 |
| 3.23 | `Toothbrush` | 칫솔 | **27**(3) |
| 3.24 | `LeafPouch` | 나뭇잎 주머니 | 05 · 03 · 13 |

### 🔴 접은 내역

| 접은 것 | 어디로 | 왜 |
|---|---|---|
| 26·29·37·43·48 「접시」 + 12·41·49·50 「큰 잎」 + 03·13 「잎자리」 | `BroadLeaf` 한 장 | 🔴 **이 마을에서 넓은 잎 한 장이 접시이자 자리이자 덮개다.** 모양이 하나라 시트도 하나이고, 쓰임이 넷이라 STATES 가 넷이다 |
| 01·15·21·31·42 「돌멩이」 + 31 「돌탑」 | `Stones` | 같은 돌이 줄로 놓이고 세워지고 쌓인다 |
| 14 「그림」 + 21 「화살표」 + 42 「줄 셋」 | `SandMark` | 셋 다 **모래에 파인 홈**이다. 그린 게 아니라 판 것이라 같은 물건 |
| 03·28·29 「껍질」 | `Banana` | 바나나 껍질은 바나나에서 나온 것이라 크기가 열매에 묶여 있다(퐁이 「케이크+크림」과 같은 자리) |
| 22 「깔개」 + 32 「깔개」 | `Mat` | 처마 밑에 펴는 것과 방에 까는 것이 같은 물건이다. 🔴 **다만 대본을 읽고 접었다** — 둘 다 「펴고 · 밀리고 · 개킨다」로 같은 상태를 쓴다 |
| 12 「그늘집」 + 「밑에」 | `ShadeHut` | 「밑에」는 그늘집 밑이다 |
| 02 「부스러기」류 · 15 「잎 뭉치」 | `Stones` STATE 5 | 15권은 **돌을 세우고 잎 뭉치를 던져 맞히는** 한 놀이다. 던지는 것과 맞는 것을 갈라 두면 화가가 그 판을 못 차린다 |

### 🔴 접기를 거부한 자리 — 같은 글자, 다른 낱말

| | |
|---|---|
| **「껍질」이 둘이다** | 29 = **바나나 껍질**(다섯 장을 무릎 높이로 포갠다) · 33/44/45 = **코코넛 껍질 반쪽**(물을 담고 소리를 낸다). 작업표는 `껍질 ·공유 29/33/44/45` 로 묶어 놨는데 대본은 아니다. 접으면 29권의 「먹은 양이 껍질 높이로 세어진다」와 44권의 「빗물 소리 통 셋」이 같은 그림이 된다 |
| **「돌」이 둘이다** | 01·15·21·31·42 = **손바닥의 돌멩이**(놓고 세우고 쌓는다) · 06 = **가운데 구멍이 뚫린 돌 하나**(눈에 대고 하늘을 본다). 06 은 열 쪽 중 넷이 그 구멍이고, 구멍이 없으면 그 권의 첫 쪽이 사라진다 |
| **「물」이 셋이다** | 고인 물(대야 §3.12) · **떨어지는 물**(§3.11) · 담아 나르는 물(통 §3.13). 🔴 **셋이 값이 다르다** — §3.11 첫 줄을 볼 것 |

### 🔴 뺀 것과 이유

| 뺀 것 | 이유 |
|---|---|
| 01·11·15·40 「나무」 · 01·03·06·32 「밑동」 | 🔴 자리 시트 `WellTree`·`CreekTree`·`ForkTree`·`FruitTree` 몫이다. **06 의 「밑동」도 뺐다** — 그 권이 기대는 것은 밑동의 굵기인데 그건 `WellTree` `FIXED PARTS` 가 이미 「어른 폭의 몇 배」로 못 박았고, 06 p3 이 그 규격을 그대로 컷으로 쓴다 |
| 22·25·30·38·41·44 「처마」 · 12 「지붕」 | 자리 시트 `TaroYard`·`MumuYard`·`VillageRoad` 몫. 처마는 물건이 아니라 **안과 밖을 가르는 선**이고, 앵커 `RAIN` 조항이 그 선의 양쪽 값(지붕 밑 MID / 밖 DEEP)을 이미 정했다 |
| 14·21·42 「모래」·「모래에」 | `SandFlat` 몫. 🔴 단 **모래 위에 파인 것**은 자리가 아니라 물건이라 §3.6 으로 남겼다 |
| 01·46 「우물」 · 46 「턱과」 | `WellTree` `FIXED PARTS` 의 우물 턱. 🔴 단 **두레박**은 턱에서 떼어져 손으로 건너다니므로 §3.22 |
| 29 「몸과」 · 46 「무무」 · 48 「머리」 · 49 「타로」 · 49·50 「아기」 | 캐릭터 시트 소관. 「아기」는 이 시리즈의 **새 인물**이지 소품이 아니다 — 🔴 캐스트 시트에 원숭이 아기 항목이 있는지 확인할 것(49·50 두 권이 그 아기에 통째로 걸린다) |
| 12 「밑에」 · 06 「발밑」 · 32 「깔개」의 「비스듬히」류 | 용언·관형형. 낱말이 아니다 |
| 13·42·45 개미 줄 · 40·31 닭 · 48 도마뱀·물고기 | 🔴 **생물이라 사물 시트가 아니다.** 다만 앵커 `A RUN OR A BAND … IS EXEMPT` 가 「앞쪽 예닐곱만 또렷하고 뒤는 이어진 줄」을 이미 정해 놨으므로 개미 줄은 그 조항으로 그린다 |
| 37 「버섯」 | 🔴 **안 뺐다 — §3.16 안에 넣었다.** 한 쪽뿐이지만 그 권의 물음이 「먹는 것과 못 먹는 것」이라, 열매와 버섯이 **한 장에서 갈라져 보여야** 그 쪽이 선다 |

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

### 🔴 §3.1 · §3.2 에 붙이는 조항 (기존 시트를 다시 쓰지 않는다)

`CoconutHalf` 는 19·20 만 보고 쓰였다. 그 뒤 권들이 같은 물건을 **물그릇으로** 쓰면서 **상태가 셋 더
필요해졌다** — 아래 세 줄을 그 시트의 `STATES` 뒤에 그대로 얹는다.
🔴 **권 번호로 걸지 않는다**(2026-09-05) — 처음 판에 `(volumes 33, 44, 45)` 라고 적어 두었더니
그 목록 밖의 권이 같은 그릇에 물을 담을 때 화가가 상태를 새로 지어내게 된다. 조건으로 읽어라.

```
STATES (added - for any page where this half is used AS A VESSEL: set down in a row, carried full, or tipped out):
  4 A ROW OF THREE, mouth-up on the ground, EVENLY SPACED and IDENTICAL in size - one dry inside,
    two with a single round wet mark in the bottom. 🔴 A DROP HAS FALLEN INTO TWO OF THEM AND NOT
    THE THIRD, and that difference must be visible at thumbnail size.
  5 FILLED, water inside as one flat MID disc with a hard straight edge, 0 ripples, 0 glints, the
    shell carried level in two paws.
  6 TIPPED, water gone, the ground around it one flat DEEP wet patch with a crisp edge and the
    inside of the shell still dry and CLOTH-pale - 🔴 the volume turns on inside-dry against
    outside-wet, so never shade the inside.
```

`Shells` 는 09 의 모래밭만 보고 쓰였다. 그 뒤로 **모래 아닌 바닥**(마루 널) 위에 늘어놓는 권과, 한 개를
굴리고 불어서 소리를 내는 권이 나왔다 — 굴리고 부는 조개는 **같은 부채 조개를 매끈한 바깥쪽에서 본 것**
이지 다른 조개가 아니다. 🔴 여기도 권 번호가 아니라 조건이다.

```
STATES (added - for any page where a shell is NOT on sand, or is rolled, or is blown):
  5 ON A PLANK FLOOR, laid in a row along the boards, the near six separate and the rest one joined
    line. 🔴 The floor is pale wood, so here the shell is the DARKER thing - the reverse of the
    sand, and the reason this state is drawn.
  6 THE SMOOTH SIDE, one shell seen from the outside of the fan - the ribs are on the far side, so
    this face is ONE flat MID area with a single hinge line and NOTHING else. Same outline as
    state 1.
  7 ROLLING, the same shell on its edge crossing a floor, and 🔴 THERE ARE NO MOTION LINES - where
    it has been is a single faint DEEP scuff on the boards behind it.
  8 BLOWN, held to a mouth (mouth off-panel), the hinge towards the lips.
```

### §3.3 BroadLeaf — 🔴 12권이 기대는 한 장

> 이 마을에서 넓은 잎 한 장은 **접시이고 자리이고 덮개이고 지붕**이다. 26권은 그 잎 위 네 자리가
> 차고 비는 것이 통째로 이야기이고, 49·50권은 그 잎이 아기를 감싼다. 모양은 하나여야 한다.

```
PROP SHEET - BroadLeaf   (taro-batik · SCENE token: BroadLeaf)

One broad leaf, about as wide as a child is tall when laid flat. Twelve books use it - as the
dinner plate, as the mat a pile of fruit sits on, as the wrap around a baby, as a thing hung on a
post - so its ONE shape and ONE size are settled here and never redesigned.

FORM: a single leaf, MID, one flat area, with a straight midrib and at most 9 side veins branching
  from it - hairlines, never a drawn leaf texture. The edge is unbroken and slightly wavy. 0 gloss,
  0 sheen, 0 spots. When it lies on a DEEP plank floor it is the paler of the two; when it lies on
  CLOTH bare earth it is the darker. It never becomes CLOTH itself.
🔴 AS A PLATE, THE FOUR PLACES ARE FIXED - one book counts them for ten pages, so they may not move:
  TOP = the rice, one CLOTH lump, the BRIGHTEST thing on the leaf.
  LEFT = a length of corn, MID.
  RIGHT = one round tomato, MID, the same size as the corn is thick.
  BOTTOM = the greens, one DEEP mass, the DARKEST thing on the leaf.
  Never add a fifth place, never swap two, never let two touch. An empty place is a patch of plain
  leaf and must read as empty at thumbnail size. That is the whole instrument of that volume.
STATES - all drawn from straight above at the SAME size except where noted:
  1 BARE, nothing on it.
  2 ALL FOUR PLACES FULL.
  3 THE DEEP PLACE EMPTY, the other three still full - the one gap is the picture.
  4 THREE PLACES BROKEN UP - rice, tomato and three lengths of corn sitting apart from one another,
    none of them touching, the DEEP place still empty.
  5 FINISHED - one tomato stalk and two grains of rice, and the leaf floor showing through as the
    brightest area in the frame.
  6 AS A GROUND MAT, seen at a low angle with a knee-high heap of fruit standing on it.
  7 AS A WRAP, folded once around a small bundle so only a face-sized opening is left - 0 folds
    pressed into it beyond the one fold line.
  8 HUNG, caught on a post by its stalk, hanging point down, seen from below.
🔴 WHEN IT IS WET, water does NOT bead on it - a drop runs down the midrib groove as ONE small
  CLOTH shape and stops where the leaf stops.

PLATE: the four places drawn once as a positions-only diagram (no lettering), then states 1-8, plus
one leaf held beside a plain child silhouette for size.

NOT: no character face (a plain silhouette only, for size), no orange anywhere on this sheet, no
lettering or numerals, no leaf texture beyond the 9 veins, no gloss, wet sheen or water beads, no
cast shadow of the leaf on anything, no airbrush, gradient, glow or soft edge.
```

### §3.4 Stones — 돌 하나가 세 가지로 놓인다

```
PROP SHEET - Stones   (taro-batik · SCENE token: Stones)

The stones of the village ground - one kind of stone, a child's palm across. Five books use them:
laid in a line, stood on end and knocked down, stacked into a tower, and thrown short.

FORM: rounded river stones, DEEP, each ONE flat area with NO interior mark at all - no crack line,
  no speckle, no shading. They are all about the same size except where a state says otherwise. On
  CLOTH earth they are the darkest thing in the frame; that is how a single stone reads.
🔴 A STONE PRESSED INTO EARTH LEAVES A MARK AND A STONE LAID ON IT DOES NOT. The mark is one small
  DEEP dent with a hard edge. One book turns on that difference (a stone dents the ground, a leaf
  set down beside it does not), so both must be drawable in one frame.
STATES - draw all six at one scale:
  1 ONE STONE alone on bare earth, from straight above.
  2 A LINE, laid one after another and curving away out of frame - the near six or seven separate
    and the rest carried on as one joined DEEP line. (A RUN is exempt from the repeat cap.)
  3 THREE STOOD ON END, evenly spaced, all the same height, standing clear of one another. 🔴 THE
    COUNT IS THREE AND IT IS THE SCORE OF A WHOLE VOLUME - never two, never four.
  4 THE SAME THREE, the middle one toppled sideways and the other two still standing. Same spacing,
    same size, same angle of view as state 3 so the two panels can be laid over each other.
  5 A BUNDLE OF LEAVES beside them, the thing that is thrown at them: at most 5 leaves crumpled
    into one MID lump the size of a fist, 0 stalks. It is thrown; the stones are not.
  6 A TOWER, stones stacked knee-high on a child, largest at the bottom, EXACTLY 6 stones, each one
    clearly resting on the one below with a flat contact. Then the same tower drawn a second time
    HALF BUILT at 3 stones, same base, same place.
🔴 A COLLAPSED TOWER is those same 6 stones scattered on the ground with 0 motion lines, 0 arcs and
  0 dust - the scatter alone says it fell.

PLATE: states 1-6, plus the standing three and the toppled three side by side at one size.

NOT: no character, no orange anywhere on this sheet, no lettering or numerals, no crack, speckle or
grain inside a stone, no motion line, arc or dust puff, no airbrush, gradient, glow or soft edge.
```

### §3.5 HoleStone — 🔴 06권 · §3.4 와 접기를 거부한다

> 작업표는 06 을 「밑동」으로 적었고 옛 표는 돌을 `Pebbles` 한 장으로 묶었다. **둘 다 이 권을 못 든다.**
> 06 은 열 쪽 중 넷이 **가운데가 뚫린 돌 하나**이고, 첫 쪽이 통째로 그 구멍으로 본 하늘이다. 손바닥의
> 돌멩이와 같은 시트에 두면 구멍이 없어지고, 없어지면 그 권에 아무 일도 안 일어난다.

```
PROP SHEET - HoleStone   (taro-batik · SCENE token: HoleStone)

One flat stone with a hole worn right through the middle of it. One book, and four of its ten pages
are this object.

FORM: a flat rounded stone that fills a child's palm, DEEP, ONE flat area with no interior mark -
  except the hole. 🔴 THE HOLE IS NOT DRAWN, IT IS LEFT UNWAXED: it is a CLOTH circle cut clean
  through the DEEP stone, hard-edged, about a third of the stone's width, and it is the BRIGHTEST
  thing in any frame that holds this stone. It is never a dark dot and never a ring.
🔴 THROUGH THE HOLE YOU SEE WHAT IS BEHIND IT AND NOTHING ELSE. Held up to the sky the circle is
  plain CLOTH with 0 marks in it. Held against the ground the circle carries the small piece of
  ground that falls inside it, at that ground's own value, cut hard at the rim. Never draw a lens,
  a curve, a distortion or a bright edge.
STATES:
  1 THE STONE ALONE on earth, from straight above, hole showing as one CLOTH circle.
  2 HELD UP TO ONE EYE at arm's length, seen from the side, the far side of the hole plain CLOTH.
  3 THE VIEW - the frame is the hole itself: one CLOTH disc with a DEEP ring of stone around it and
    the rest of the frame the stone's dark mass. Nothing inside the disc.
  4 CARRIED, closed inside two paws so the hole is hidden - the stone reads as a plain DEEP lump
    and the volume's object has gone dark. Draw this state beside state 1 at the same size.
  5 FALLEN, lying on earth with a single DEEP scuff line behind it showing where it rolled.

PLATE: the five states, plus one large drawing of the stone with the hole at exact proportion.

NOT: no character face, no orange anywhere on this sheet, no lettering or numerals, no lens or glass
effect, no ring of light around the hole, no crack or speckle in the stone, no airbrush, gradient,
glow or soft edge.
```

### §3.6 SandMark — 🔴 14권은 이것이 뒤집혀야 한다

```
PROP SHEET - SandMark   (taro-batik · use the anchor's WATER clause for the sand · SCENE token: SandMark)

Marks scratched into wet sand with a fingertip or a stick. Three books use them - a map, an arrow,
and a row of counting lines.

🔴 THE SAND IS CLOTH AND THE MARK IS THE ONLY DARK THING ON IT. A mark is a NARROW DEEP groove with
  a hard edge, one stroke wide, and nothing else - no raised lip, no shadow, no crumbs beside it.
  This is the same judgement as "a shell is never CLOTH": the ground is the bright one here, so the
  drawing has to be the dipped one.
🔴 NO LETTERING, NO NUMERALS, NO SYMBOL THAT READS AS WRITING. The map is three pictures and one
  arrow, and a four-year-old must read it as pictures.
FORM OF THE MAP: exactly three marks - a plain circle (the well), a lollipop shape (the tree), and
  one straight arrow. Nothing else is ever added to it.
🔴 THE MAP MUST WORK UPSIDE DOWN AND THAT IS THE WHOLE VOLUME. Draw it TWICE on this sheet, at the
  same size, one directly under the other: once the right way up with the arrow pointing to the top
  of the frame, and once rotated a half turn so the SAME arrow points to the bottom. Rotate the
  whole drawing - do NOT redraw it mirrored, and do not let the circle or the tree change shape.
  Both drawings must be legible as the same three marks.
STATES:
  1 THE MAP, from straight above, the right way up.
  2 THE MAP, from straight above, rotated a half turn. Same drawing.
  3 ONE ARROW alone, pointing toward one edge of the frame, in sand beside a plank hull.
  4 THREE PARALLEL LINES scratched side by side, evenly spaced, dividing the frame into three.
  5 TWO SMALL POKE MARKS, the size of a stick end, and nothing else on the sand.
  6 WASHED FLAT - the same frame as state 1 with 0 marks in it, the sand one unbroken CLOTH area.
    🔴 Draw this at the same size as state 1 so the two can be laid over each other.

PLATE: states 1 and 2 stacked vertically (the rotation pair), then 3, 4, 5, 6.

NOT: no character, no hands, no orange anywhere on this sheet, 🔴 no letters, numerals, words or map
labels of any kind, no compass, no raised sand lip or spill beside a groove, no cast shadow in a
groove, no airbrush, gradient, glow or soft edge.
```

### §3.7 Shadow — 🔴 앵커 조항 위에 「길이 사다리」를 얹는다

> 옛 §3 은 그림자를 「앵커 조항이 맡는다」며 뺐다. **절반만 맞다.** 앵커(2026-08-13 개정)가 정한 것은
> **무엇으로 만드는가**(바닥에 놓인 평평한 DEEP 실루엣 하나)이고, 권마다 갈리는 것은 **길이**다.
> 32권은 p4 발밑에 오그라든 것 ↔ p9 화면 밖까지 뻗은 것이 그대로 시계이고, 04권은 착지가 그림자 밟기다.
> 길이를 시트가 안 정하면 화가가 매번 새로 정한다.

```
PROP SHEET - Shadow   (taro-batik · SCENE token: Shadow)

The flat shadow a body lays on the ground. The anchor already says what it is made of - ONE flat
DEEP silhouette, hard edge, nothing shaded inside it, never on a body and never on a face. This
sheet fixes HOW LONG it is, because six books read the time of day off that length.

🔴 THREE LENGTHS AND NO OTHERS. Draw the SAME standing child from the SAME angle three times in a
  row, changing only the shadow:
  NOON - the shadow is a small flat pool that does not reach past the feet.
  MID - the shadow is about as long as the body is tall, laid to one side.
  LOW SUN - the shadow runs off the edge of the frame, at least twice the body's height, and its
    far end is cut by the frame, not tapered.
🔴 THE SHADOW IS ONE SHAPE, NOT A PORTRAIT. It keeps the silhouette's outline - a tail is a tail, an
  ear is an ear - but it has 0 interior marks and its width does not change along its length.
🔴 IT LIES ON THE GROUND AND ONLY ON THE GROUND. It stops dead at a step, a plank edge or a trunk and
  does not climb. It is never cast on a wall, on a body or on a face.
STATES:
  1 THE THREE LENGTHS in a row as above.
  2 TWO CHILDREN SIDE BY SIDE at LOW SUN - one shadow short and stubby, one running out of frame.
    🔴 The pair must be readable as two different animals from the shadows alone.
  3 A SHADOW BEING STOOD ON - a foot placed inside the flat shape, the shape unbroken beneath it.
  4 A TREE'S SHADOW - one flat DEEP area with a HARD edge falling across a road, no dappling, no
    leaf shapes cut out of it, no fade.
  5 AN OBJECT'S SHADOW - an upturned boat hull and the narrow flat shape beside it, that shape the
    same outline as the hull.

PLATE: the three lengths in one row, then states 2-5.

NOT: no character face (plain silhouettes only), no orange anywhere on this sheet, no lettering or
numerals, no shadow on any wall, body or face, no dappled or leaf-patterned shadow, no soft or faded
shadow edge, no second shadow from a second light, no airbrush, gradient or glow.
```

### §3.8 LightBand — 🔴 32권의 시계 · 작업표가 통째로 놓친 물건

> 32권은 「늦잠」 이야기이고 그 권의 시계는 **문틈으로 들어와 방바닥에 누운 밝은 띠**다
> (p1 길다 → p2 짧다 → p3 아예 없다 → p8 다시 길다). 작업표에는 이 낱말이 한 번도 안 올라왔는데,
> 없으면 그 권은 열 쪽 내내 그냥 어두운 방이 된다.

```
PROP SHEET - LightBand   (taro-batik · SCENE token: LightBand)

The band of daylight that comes in through a gap and lies on a dark floor. Four books use it and one
book counts it.

🔴 THE BAND IS NOT PAINTED ON, IT IS THE FLOOR LEFT UNWAXED. It is a CLOTH area inside a DEEP room,
  with a HARD STRAIGHT edge on every side, and it is the brightest thing indoors. Light in this
  medium is a blocked place, never a wash laid over a dark one.
🔴 IT HAS NO SOURCE ON THE PAGE. There is no beam, no shaft in the air, no dust, no rays. Only the
  patch on the floor, and the gap it came through is a plain slot in the wall or the boards.
FORM: one straight-sided band, one hand wide, running across the floor boards and stopping where the
  boards stop. Its ends are cut square. It never bends, spreads or softens.
🔴 FOUR LENGTHS, ALL DRAWN IN THE SAME ROOM FROM THE SAME ANGLE AT THE SAME SIZE, so a reader can
  measure one against the next:
  1 LONG - the band crosses most of the floor. (Early.)
  2 SHORT - the same band, half the length, same width, same place at one end. (Later.)
  3 GONE - the same frame with NO band at all and the whole floor evenly lit, because the sun is
    high and the room is simply bright. 🔴 This is the state that says overslept, and it works only
    if 1 and 2 are the same drawing.
  4 LONG AGAIN - identical to state 1.
STATES (other books):
  5 THROUGH FLOOR BOARDS FROM ABOVE - a narrow CLOTH band falling into the dark space under a raised
    floor, landing across an object below.
  6 THROUGH A DOORWAY at night, from the outside: one narrow CLOTH slot in a DEEP wall, nothing
    visible inside it.

PLATE: lengths 1-4 as four panels of the identical frame, then states 5 and 6.

NOT: no character, no orange anywhere on this sheet, no lettering or numerals, no beam or shaft in
the air, no dust motes, no rays, no glow or halo at the band's edge, no gradient anywhere in the
band, no second band from a second gap, no airbrush or soft edge.
```

### §3.9 Lamp — 밤에는 이 규칙이 다시 나온다

```
PROP SHEET - Lamp   (taro-batik · use the anchor's NIGHT clause · SCENE token: Lamp)

The oil lamp hung on a post under the eaves. Four books light it.

FORM: a small lamp - a squat MID body, a short neck, and a hook. It hangs from a post at an adult's
  head height. At most 3 lines inside the whole object. It is small; it is not the point.
🔴 THE FLAME AND THE LIGHT ARE BOTH CLOTH - blocked places, exactly as a light band is. The flame is
  one small CLOTH shape at the neck. The light it reaches is ONE CLOTH area on the floor with a HARD
  ROUND EDGE, and everything outside that edge is DEEP. 🔴 THERE IS NO FALLOFF: a face inside the
  circle is fully bright, a face outside it is fully dark, and nothing is halfway.
🔴 THE CIRCLE IS A MEASURE, NOT A MOOD. Draw THREE SIZES of it at one scale, because two books count
  who is inside it:
  SMALL - holds one seated body.
  MEDIUM - holds two, shoulder to shoulder.
  LARGE - holds three with room at the edge.
  A body outside the circle gets no light at all. It does not get a dimmer one.
STATES:
  1 UNLIT in daylight, hanging on its post, no CLOTH anywhere on it.
  2 LIT AT NIGHT, close - one CLOTH flame, DEEP all round it.
  3 THE FLOOR CIRCLE at the three sizes, each with plain seated silhouettes inside it.
  4 FAR OFF - the lamp under a roof at the end of a road, one small CLOTH dot in a DEEP frame, and a
    second identical dot under the roof at the other end of the road. 🔴 The two dots are the same
    size; a volume ends on there being exactly two places to go.
  5 CARRIED - the lamp in one hand, the CLOTH circle moved with it, its edge still hard.

PLATE: states 1, 2, 4, 5 plus the three circle sizes in a row.

NOT: no character face (plain silhouettes only), 🔴 no orange anywhere on this sheet - the flame is
CLOTH, not orange, and the accent dye touches only the two cords, no lettering or numerals, no glow,
halo, ray or beam, no gradient at the circle's edge, no lens flare, no airbrush or soft edge.
```

### §3.10 StormSky — 38·41권의 상대역

```
PROP SHEET - StormSky   (taro-batik · SCENE token: StormSky)

The low sky of a storm and the crack of light that opens in it. Two books are afraid of it.

🔴 THE SKY INVERTS. On an ordinary page the sky is MID and the ground below it is darker; on these
  pages the sky is ONE flat DEEP mass sitting low over the village and the swept floor under the
  roof is the brightest thing in the frame. That inversion is the fear, and it is done with the two
  dips alone - never with texture, never with clouds.
FORM OF THE MASS: one flat DEEP area with a slightly uneven lower edge, filling the top third to
  half of the frame, 0 clouds, 0 billows, 0 streaks, 0 interior mark.
🔴 THE LIGHTNING IS A CRACK, NOT A BOLT. It is the DEEP mass LEFT UNWAXED along a zigzag line - one
  jagged CLOTH slit, hairline-thin, with at most 4 turns, no branches, no fork, no white core and no
  glow at its edges. It never touches the ground and it never crosses a body or a face.
STATES - all drawn at the same size in the same frame:
  1 LOW AND CLOSED - the flat DEEP mass, no crack, the ground beneath still pale.
  2 CRACKED - the same mass with ONE zigzag CLOTH slit in it.
  3 ONE CORNER OPEN - the same mass with a single hard-edged CLOTH patch broken out of its lower
    right corner. 🔴 That patch is the only bright thing on the page and a whole ending hangs on it.
  4 GONE - the same frame with the sky one flat MID area and the ground beneath it DEEP and wet, with
    at most 4 CLOTH steam shapes rising off it.
🔴 RAIN, WHEN IT FALLS FROM THIS SKY, IS THE ANCHOR'S RAIN and nothing else: at most 13 hairline
  CLOTH lines all leaning one way, and they are the only thing allowed to cross another shape.

PLATE: the four states as four panels of one frame, plus a large close-up of the crack showing the
turn count.

NOT: no character, no orange anywhere on this sheet, no lettering or numerals, no cloud shapes,
billows or wisps, no forked or branching lightning, no white core or glow on the crack, no light cast
on the ground from the crack, no airbrush, gradient or soft edge.
```

### §3.11 WaterStream — 🔴 이 시리즈에서 물의 값은 하나가 아니다

> 앵커 `WATER` 조항은 **고인 물**을 정한다(한 덩이 MID, 잔물결 0). 그런데 30권 p4 는 「곧게 내려오는
> 물줄기가 화면에서 가장 밝다」이고 45권 p7 도 그렇다. **떨어지는 물은 밝다** — 앵커가 비를 CLOTH 로
> 정한 것과 같은 자리다. 이 갈림을 시트가 못 박지 않으면 권마다 물 색이 바뀐다.

```
PROP SHEET - WaterStream   (taro-batik · SCENE token: WaterStream)

Water in the air: the rope of water that runs off an eave, and water poured from a vessel. Six books
use it and one book is entirely about standing under it.

🔴 THE RULE THIS SHEET EXISTS FOR - FALLING WATER IS CLOTH, STANDING WATER IS MID.
  A stream in the air is a waxed strip: CLOTH, hard-edged on both sides, the same width top to
  bottom, and the BRIGHTEST thing in its frame. It is the same decision as the anchor's rain.
  Water lying in a tub, a puddle or the creek stays ONE flat MID area with 0 ripples and 0 glints.
  Where the falling strip meets the standing water it simply STOPS at the surface line. There is no
  splash crown, no spray, no droplets thrown up, and no bubbles.
FORM: one straight vertical strip, about two fingers wide, running from the eave edge or the vessel
  lip to whatever is below it. At most 2 strips in one frame unless a state says otherwise.
🔴 WHAT THE WATER TAKES OFF A BODY IS DEEP, NOT CLOTH. Mud running off a back splits into at most 5
  narrow DEEP threads INSIDE the CLOTH strip, all running the same way and all reaching the ground.
  That contrast - dark threads inside a bright strip - is the picture of one volume.
STATES:
  1 ONE STREAM off an eave into bare earth, seen from below, with a single DEEP dent worn in the
    ground beneath it.
  2 THE SAME STREAM with a paw held in it - the paw is CLOTH above the water line and the threads
    coming off it are DEEP.
  3 A BODY UNDER IT, side on - the stream crossing the shoulders, DEEP threads down the back, and a
    flat MID pool spreading at the feet with a hard edge.
  4 THREE STREAMS side by side falling into three vessels, evenly spaced, all the same width.
  5 POURED - a stream from a vessel lip into a held shell, short, the same width, the pouring vessel
    tipped so the lip is the highest point.
  6 STOPPED - the same eave with a SINGLE CLOTH drop hanging at its edge and nothing below it. 🔴
    Draw this at the same size as state 1.

PLATE: the six states, plus one close-up of a stream meeting standing water so the meeting line can
be checked as hard.

NOT: no character face, no orange anywhere on this sheet, no lettering or numerals, no splash crown,
spray, droplet or bubble, no ripple or ring where the stream lands, no glint, sparkle or highlight,
no airbrush, gradient, glow or soft edge.
```

### §3.13 WaterPails — 🔴 46권은 물 높이가 사건이다

```
PROP SHEET - WaterPails   (taro-batik · SCENE token: WaterPails)

Bamboo water pails. Three books use them and one book is ten pages of comparing how full two of them
are.

FORM: a length of thick bamboo cut open at the top, standing on end, coming up to a child's thigh.
  MID, one flat area, with EXACTLY 2 node rings crossing it as hairlines and a plain carry loop of
  cord at the rim. 0 grain, 0 sheen. Two pails, identical in height and width.
🔴 THE WATER INSIDE MUST BE READABLE FROM THE SIDE. A pail is drawn with its near wall cut away as a
  plain vertical opening, so the water shows as a flat MID area with a HARD STRAIGHT top line and the
  empty part above it left CLOTH. 🔴 That is not a trick of transparency - the pail is simply drawn
  open on this sheet and on every page that compares two pails. It is how a four-year-old counts the
  difference.
🔴 FIVE LEVELS, DRAWN AS ONE ROW OF THE SAME PAIL AT ONE SIZE: empty · a hand's depth · half · one
  finger below the rim · brimming. Neighbouring levels must be plainly different at thumbnail size.
STATES:
  1 THE TWO PAILS side by side on earth, one BRIMMING and one EMPTY. The biggest gap.
  2 THE SAME TWO, one brimming and one HALF. The gap closing.
  3 THE SAME TWO, both one finger below the rim - level with each other. 🔴 The two water lines must
    read as ONE straight line running across both pails.
  4 ONE PAIL LIFTED, held in two paws at chest height, water not drawn.
  5 TWO PAILS CARRIED, one in each of two children's hands, walking, both level.
  6 A ROW OF PAILS waiting at a well - the near three separate and the rest carried on as one joined
    MID line. (A RUN is exempt from the repeat cap.)

PLATE: the five levels in one row, then states 1, 2, 3 stacked so the two water lines can be traced
across all three, then 4, 5, 6.

NOT: no character face, no orange anywhere on this sheet, no lettering or numerals, no bamboo grain
beyond the 2 node rings, no glint, ripple or reflection on the water, no water spilling unless a
state asks, no airbrush, gradient, glow or soft edge.
```

### §3.14 SteppingStones — 다섯이고, 젖은 자국이 세어진다

```
PROP SHEET - SteppingStones   (taro-batik · use the anchor's WATER clause · SCENE token: SteppingStones)

The stepping stones across the creek. Three books cross them and one book counts them.

FORM: EXACTLY FIVE flat-topped stones in a line from the near bank to the far bank, DEEP, each ONE
  flat area with 0 interior mark. They are evenly spaced, a child's stride apart, and they are the
  same size except the middle one, which is a little broader. The near three are drawn separately and
  the far two carry on as one joined line into the frame edge.
🔴 FIVE IS NOT AN APPROXIMATION. A reader compares three pages of this row. If a page shows four or
  six, the counting stops working.
🔴 THE WATER IS THE ANCHOR'S WATER - one unbroken MID area, 0 ripples, 0 glints. A stone standing
  clear of it keeps its WHOLE outline; a stone under the surface has NO outline of its own and is
  simply a DEEP shape inside the MID area. That is how a flooded crossing reads without a word.
STATES - all drawn from the same side-on position at one size:
  1 THE FIVE, dry, water low, all five standing clear.
  2a 🔴 ONE GONE - the water up just far enough that THE MIDDLE STONE ALONE is submerged as an
    edgeless DEEP shape and the other four stand clear. This is the one a whole book turns on:
    ONE CANNOT-STEP IN THE MIDDLE OF A ROW THAT IS OTHERWISE WHOLE, and it comes back in the same
    place later. 🔴 Drawn with 2b at one size - the difference between them is the difference
    between "wait" and "you cannot cross", and a book that means one must not be given the other.
  2b THE FIVE, water high - the middle three submerged as edgeless DEEP shapes, the first and last
    still clear. 🔴 The row must still be countable as five.
  3 WET PRINTS - the five dry, with ONE flat DEEP footmark on each of the first three and the last
    two bare. The prints are the counter.
  4 ONE STONE OCCUPIED - a plain seated silhouette on the first stone, the other four empty beyond
    it, so the line reads as blocked.
  5 FROM ABOVE, straight down, the five as a row of flat shapes in a MID band.

PLATE: the six states, with 1, 2a and 2b in one column at one size so the water line can be traced
across all three, plus one stone close up showing the flat top and the hard water line.

NOT: no character face (plain silhouettes only), no orange anywhere on this sheet, no lettering or
numerals, no ripple, glint, sparkle or reflection on the water, no moss, crack or grain on a stone,
no more or fewer than five stones, no airbrush, gradient, glow or soft edge.
```

### §3.15 GrassBracelet — 🔴 앵커 §3 의 결정이 이 한 장에서 증명된다

> 설계서는 「25권 팔찌는 풀을 엮은 초록」이라 썼고, 앵커는 **넷째 물감을 안 들이고 팔찌를 CLOTH 로**
> 냈다(팔레트에 `anything woven from grass` 를 넣었다). 그 결정이 옳았는지는 착지 화면 하나로 판가름난다 —
> 맞잡은 두 손바닥 위에서 팔찌 둘이 **화면에서 가장 밝아야** 「꼭 같다」가 읽힌다.

```
PROP SHEET - GrassBracelet   (taro-batik · SCENE token: GrassBracelet)

A bracelet plaited from three blades of grass. One book, three pages, and it is that book's ending.

🔴 IT IS CLOTH. Anything woven from grass is waxed before any dip, so the bracelet is the palest
  thing in any frame - paler than a paw, as pale as a face. IT IS NOT GREEN. There is no green in
  this book and there is no fourth dye; the accent dye touches nothing but the two cords.
FORM: three strands crossed over one another in a simple plait, drawn as a repeating over-under with
  EXACTLY 9 crossings around the loop, and ONE knot where the ends meet. The loop is a child's wrist
  across. The strand ends stick out past the knot by a finger's width.
🔴 THE TWO BRACELETS ARE THE SAME AND THAT IS THE POINT. Draw them TWICE side by side at one size -
  same loop, same 9 crossings, same knot, same stub ends. A reader who is four must not be able to
  tell which is which. Do not make one prettier.
STATES:
  1 ONE BRACELET flat on the ground, from straight above, the plait and the knot clear.
  2 HALF MADE - three loose blades held in one paw with the plait started at one end and the rest
    hanging free. The finished part is CLOTH, the loose blades are CLOTH too.
  3 THE PAIR, lying side by side on two open palms seen from straight above. 🔴 The palms are MID and
    the bracelets are CLOTH, so the two loops are the brightest shapes in the frame.
  4 WORN - one on a wrist, seen from the side, sitting loose so a gap shows between it and the arm.
  5 FOUR ARMS CROSSED, two bracelets being put on at once - the loops still readable where the arms
    overlap.

PLATE: the five states, plus one bracelet drawn large enough to count the 9 crossings.

NOT: no character face, 🔴 no green anywhere - this object is not green, no orange anywhere on this
sheet, no lettering, numerals or beads, no charm, knot decoration or tassel, no sheen on the grass,
no airbrush, gradient, glow or soft edge.
```

### §3.16 BerryBush — 먹는 것과 못 먹는 것이 한 장에서 갈린다

```
PROP SHEET - BerryBush   (taro-batik · SCENE token: BerryBush)

The berry bush at the roadside, and the mushroom that comes up beside the road on the way home. One
book, and the two things are on ONE sheet because that book asks which of them you may eat.

THE BUSH: one dense DEEP mass filling a third of the frame, its outline ragged, 0 individual leaves
  drawn inside it. Stems do not show.
🔴 THE BERRIES ARE CLOTH - small unwaxed dots set into the DEEP mass, so they read as points of light
  inside a dark bush. The near six or seven are separate and clearly round; the rest carry on as a
  scatter inside the mass. (A BAND is exempt from the repeat cap.) A picked berry leaves a bare
  stalk - one hairline DEEP mark where it was.
ONE BERRY IN A PALM: a single CLOTH circle, its edge cut clean, the palm MID around it. It is the
  brightest thing in that frame and its rim is hard, never soft - the whole page is about how smooth
  it looks.
🔴 THE MUSHROOM IS THE SAME BRIGHTNESS AND A DIFFERENT SHAPE, AND THAT IS WHY IT IS ON THIS SHEET.
  One cap on one stalk, cap CLOTH, stalk CLOTH, standing alone out of dark wet earth. It is as pale
  as the berries and it must NOT be made to look sinister - no spots, no colour, no mark of any kind.
  🔴 A four-year-old tells them apart by SHAPE ONLY: berry = a small circle in a bush; mushroom = a
  dome on a stem, alone on the ground. Draw them side by side at one size once on this sheet.
STATES:
  1 THE BUSH, full, from the side.
  2 THE BUSH with one bare stalk where a berry has gone, close.
  3 ONE BERRY in an open palm from above.
  4 ONE BERRY alone on a broad leaf on bare earth.
  5 THE MUSHROOM, alone, low angle, wet DEEP earth around it and dry CLOTH earth beyond.
  6 THE COMPARISON PANEL - one berry and one mushroom side by side at one size on plain ground.

PLATE: the six states, plus the bush drawn once beside a plain child silhouette for height.

NOT: no character face (a plain silhouette only, for height), no orange anywhere on this sheet, no
lettering or numerals, no spots, gills or ring on the mushroom, no individual leaves in the bush, no
sheen or wet highlight on a berry, no airbrush, gradient, glow or soft edge.
```

### §3.17 Banana — 🔴 껍질에 찍힌 자국 넷이 28권 전부다

```
PROP SHEET - Banana   (taro-batik · SCENE token: Banana)

Bananas, and their skins. Four books use them: gathered by the armful, marked with dirty handprints,
peeled and stacked, and counted out on a leaf.

FORM: one curved banana, CLOTH - ripe fruit is waxed, so it is among the brightest things in any
  frame. Its only interior marks are ONE ridge line down the curve and a small DEEP tip at each end.
  0 speckle, 0 bruise, 0 sheen. A bunch is 5 fruit joined at one stem, fanning.
🔴 THE HANDPRINTS ARE THE INSTRUMENT OF ONE VOLUME. On the pale skin they are FOUR flat DEEP palm
  marks with the finger marks separate and legible, pressed at different angles, none of them
  mirrored. 🔴 FOUR EXACTLY, and they must be countable at thumbnail size. A washed fruit has ZERO -
  not fainter ones. The two states are drawn at the same size on this sheet for that comparison.
🔴 A PEEL IS NOT A BANANA. Off the fruit the skin goes limp: it is MID, not CLOTH, because it is no
  longer the bright thing - it is a spent object. Five peels stacked make a heap as high as a child's
  knee, and the near three are separate while the rest carry on as one joined MID mass.
STATES:
  1 ONE FRUIT alone, side on.
  2 A BUNCH of 5 on the stem, hanging from a low branch.
  3 AN ARMFUL - more than two paws can hold, the near six separate and the rest one joined CLOTH
    mass, with two fruit falling clear.
  4 MARKED - one fruit held up, FOUR DEEP handprints on it.
  5 CLEAN - the same fruit at the same size, held the same way, 0 marks.
  6 HALF PEELED - the skin split into three flaps hanging down, the flaps MID, the flesh CLOTH.
  7 A HEAP OF PEELS knee-high beside a plain seated silhouette for scale.
  8 THREE FRUIT LAID ON A BROAD LEAF, evenly spaced, not touching.

PLATE: states 4 and 5 side by side first, then 1, 2, 3, 6, 7, 8.

NOT: no character face (plain silhouettes only), no orange anywhere on this sheet, no lettering or
numerals, no speckle, bruise or brown spot, no sheen or highlight on the skin, no motion line on a
falling fruit, no airbrush, gradient, glow or soft edge.
```

### §3.12 · §3.18 ~ §3.24 — 요약 명세 (같은 네 절로 쓴다)

> 아래 여덟 장은 위와 같은 `FORM / STATES / PLATE / NOT` 형식이고, 시트마다 **매체 판정 한 줄**을 반드시
> 첫 줄에 둔다(「이 물건은 담근 것인가 막은 것인가」). 장당 700~1,200자.

| § | 토큰 | 매체 판정 한 줄 | 반드시 들어갈 상태 |
|---|---|---|---|
| 3.12 | `WaterBasin` | 대야는 MID · **안의 물도 MID**(고인 물) · 물에 풀린 흙은 **물 안에서 갈라져 내려가는 DEEP 실 여러 가닥** | 가득 / 손 넷이 들어가 흙이 풀리는 중 / 흙물이 가라앉아 바닥만 어두운 / 옆으로 넘친 평평한 자국 / 이고 나르는 |
| 3.18 | `Fruit` | 🔴 가지 끝 열매는 **CLOTH**(칠하지 않은 밝은 자리) — 13·40 의 SCENE 이 네 쪽에서 그렇게 못 박아 놨다 | 가지 맨 끝에 하나 / 떨어져 공중에 하나 / 터져 땅에 하나(개미 줄과 함께) / 잎자리 위에 셋 / **반으로 갈린 두 쪽이 크기가 꼭 같다**(40 착지) |
| 3.19 | `Mat` | 풀을 엮은 것이라 **CLOTH** — 어두운 방바닥 위에서 가장 밝다 | 반듯이 편 / 반쯤 편(눕는 중) / 발끝에 밀려 뭉친 / 구겨진 / 네모로 개킨 |
| 3.20 | `ShadeHut` | 뼈대는 DEEP(마른 가지) · 얹은 잎은 MID · 🔴 **덜 덮인 자리는 뚫린 CLOTH 구멍**이고 그 개수가 진도다 | 가지 셋을 세워 묶은 뼈대만 / 잎 대여섯을 얹어 구멍이 숭숭 / 다 덮여 구멍 0 / **한 몸만 들어가는 크기**(옆에 빈자리가 남는 것이 그 권의 웃음) |
| 3.21 | `Bowls` | 그릇은 MID · 🔴 **김은 CLOTH**(막은 자리, 하드 에지, 최대 5조각) · 밥은 CLOTH | 김 오르는 그릇 하나 / 두 집 것이 **크기·모양이 똑같이** 나란히 / 숟가락이 걸친 / 비워진 |
| 3.22 | `WellBucket` | 두레박은 MID · 매단 줄은 하나의 DEEP 선 · 🔴 **쏟아지는 물은 CLOTH**(§3.11 규칙) | 턱에 놓인 / 줄에 매달려 우물 안으로 / 두 손 사이 한복판에 놓인(누구 것도 아닌 자리) / 기울여 붓는 |
| 3.23 | `Toothbrush` | 자루는 MID · 솔은 짧은 DEEP 획 최대 7 · 🔴 **거품은 CLOTH** | 대야 테에 걸친 / 넘겨주는 손과 받는 손 사이에 하나 / 입에 문 / 둘이 나란히 놓인(착지) |
| 3.24 | `LeafPouch` | 잎을 접어 묶은 것이라 MID · 안이 비면 **납작하고**, 차면 **불룩하다** — 그 차이만 그린다 | 납작하게 빈 / 불룩하게 찬 / 끈을 푼 |

---

### 🔴 §3.26 ~ §3.31 — 작업표 밖에서 찾은 것 (추출기가 못 본 여섯)

> 🔴 **작업표는 바닥이지 천장이 아니다.** `_scenes.json` 을 50권 전부 훑어 보니 추출기가 세 가지 이유로
> 물건을 놓치고 있었다 — ①**조사가 붙으면 딴 낱말이 된다**(「모래/모래에」·「밑동/밑에」가 따로 세어져
> 문턱을 못 넘는다) ②**한 글자 낱말은 원리상 못 잡는다**(돌·잎·김·떡·공·끈) ③**「배경·소품」에만
> 걸려 있고 「인물」 라벨은 안 본다**(나뭇가지·빗자루·두레박이 전부 손에 들려 있어 표에 한 줄도 없었다).
> 아래 여섯은 그렇게 표 밖에 있던 것이고, **그중 셋은 한 권을 통째로 든다**.

| § | 토큰 | 사물 | 권 (쪽 수) | 왜 표에 없었나 |
|---|---|---|---|---|
| 3.26 | `Stick` | 나뭇가지 한 개비 | 10 · 26 · 28 · 29 · 32 · 36 · 42 · 43 · 50 (12쪽) | 🔴 **늘 손에 들려 있어 「인물」 라벨에만 있다.** 두드리고·그리고·건드리는 이 시리즈의 손 연장이고, §3.6 의 모래 그림도 이것으로 판다 |
| 3.27 | `BigRock` | 타로 키만 한 큰 돌 | **18**(7) | 🔴 「돌」이 한 글자다. 그리고 §3.4 의 손바닥 돌멩이와 **다른 물건**이다 — 이건 밀면 흙에 고랑이 파인다 |
| 3.28 | `RiceCake` | 동그란 떡 다섯 개 | **23**(8) | 🔴 「떡」이 한 글자다. **23권이 표에 아예 없었다** — 열 쪽 중 여덟이 이 떡 하나다 |
| 3.29 | `MudTracks` | 젖은 흙에 난 자국 (발자국·미끄럼 자국) | **39**(8) · 02 · 07 · 17 | 🔴 「자국」이 매번 다른 꾸밈말과 붙어 갈라졌다. **39권이 표에 없었다** — 열 쪽이 통째로 바닥의 자국이다 |
| 3.30 | `Broom` | 빗자루 | **15**(3) | 🔴 인물 라벨에만 있다. 15권의 첫 세 쪽은 「이걸 끝내야 나갈 수 있다」이고, 빗자루가 없으면 그 쪽들이 그냥 서 있는 그림이 된다 |
| 3.31 | `Ball` | 굴러가는 코코넛(공) | **16**(4) · 10 | 「공」이 한 글자. 16권의 착지가 「반 뼘도 못 가 툭 멈춘다」라 **굴러가는 거리**가 규격이다 |

**같이 고쳐야 할 기존 시트 넷** (권을 더 찾았거나 상태가 모자란다)

| 시트 | 무엇을 얹나 |
|---|---|
| §3.3 `BroadLeaf` | 🔴 **크기가 둘이다.** 밥상 크기(26·29·43·48) 말고 **47권의 야자 잎**은 길을 가로지르고 닭 넷이 올라앉는다 — 열 쪽 전부가 그 잎이다. 두 크기를 한 장에 나란히 그릴 것 |
| §3.13 `WaterPails` | 🔴 **08권은 물 높이가 아니라 통 길이가 사건이다** — 「손바닥 두 뼘짜리와 팔뚝 길이짜리」가 밑바닥을 같은 선에 두고 서서 꼭대기 높이만 다르다(08 p1·p9). 46권의 물 높이 사다리와 **다른 축**이라 둘 다 넣는다. 권도 늘어난다 → 08 · 11 · 17 · 35 · 46 · 47 |
| §3.14 `SteppingStones` | 🔴 **36권을 통째로 놓쳤다**(p2~p10). 그리고 36 p4 가 앵커 `WATER` 조항의 교과서다 — 「양옆 돌 둘은 물 위로 나와 제 윤곽을 지녔고, 가운데 자리에는 윤곽 없이 물 밑에 잠긴 덩어리 하나」. 그 컷을 시트의 비교 패널로 삼을 것 |
| §3.8 `LightBand` | 07권 추가(p5·p6·p8 「마루 널 틈으로 든 빛 몇 줄」). 🔴 07 은 그 빛줄기 사이로 **밖의 다리가 오가는** 것이 사건이라, 띠 위를 무엇이 지나갈 때의 상태를 하나 더 넣는다 |

```
PROP SHEET - Stick   (taro-batik · SCENE token: Stick)

A single dry stick, about as long as a child's forearm. Nine books have one in a hand - it knocks on
a trunk, it draws in sand, it pokes at a shell, it points.

FORM: one plain DEEP stick, ONE flat area, slightly crooked, with at most 2 side twigs and 0 bark
  marks, 0 grain, 0 leaves. Both ends blunt. It is the SAME stick everywhere; there is not a
  different stick per book.
🔴 IT IS ALWAYS DEEP AND NEVER CLOTH, so against pale earth or pale sand it is the darkest line in
  the frame and reads at thumbnail size. That is why it can be the only thing in a close-up.
🔴 IT DOES NOT MOVE ON ITS OWN. There are no motion lines, no arcs and no impact stars. A stick that
  has just struck something is shown by what it struck - a dent, a groove, a shell knocked over.
STATES:
  1 THE STICK ALONE on bare earth, from straight above.
  2 HELD at one end, raised, side on, the far end out of frame.
  3 DRAWING - the tip in wet sand with a DEEP groove trailing behind it (see the SandMark sheet for
    the grooves themselves).
  4 KNOCKING - the tip against a trunk, and one small DEEP dent in the bark where it has been.
  5 POKING - the tip touching a shell on a plank floor, the shell tipped a hair off level.
  6 LAID DOWN beside a body on the ground, done with.

PLATE: the six states, plus the stick drawn beside a child's forearm for length.

NOT: no character face, no orange anywhere on this sheet, no lettering or numerals, no bark texture,
grain or leaves, no motion line, arc, swoosh or impact mark, no airbrush, gradient, glow or soft edge.
```

```
PROP SHEET - BigRock   (taro-batik · SCENE token: BigRock)

The big rock beside the wet ground. One book, seven of its ten pages, and the whole book is pushing
it. 🔴 This is NOT the palm-sized stone of the Stones sheet - draw the two side by side once here so
they can never be confused.

FORM: one boulder, DEEP, ONE flat area with 0 interior mark, its outline lumpy and slightly wider
  than it is tall. 🔴 IT IS AS TALL AS TARO AND AS HIGH AS MUMU'S CHEST - draw it once beside two
  plain child silhouettes to fix that, because every page reads off that size.
🔴 A PUSHED ROCK LEAVES A FURROW AND THAT IS THE ONLY EVIDENCE OF EFFORT. The furrow is ONE straight
  DEEP groove behind the rock, exactly the rock's width, with a low ridge of pushed earth along each
  side. Its LENGTH is the score of the book: draw it at three lengths - a hand, an arm, and running
  out of the frame. There are no strain lines, no sweat drops and no motion marks anywhere.
🔴 THE SMALL STONE IS ITS ANSWER: one palm-sized stone from the Stones sheet lies in front of the
  boulder on the last page and the two must be in one frame at one size, because the joke is that
  the small one is the one that got moved.
STATES:
  1 THE BOULDER alone on wet ground, side on, two child silhouettes beside it for size.
  2 A BODY BEHIND IT, shoulder to the rock, the rock not yet moved - 0 furrow.
  3 THE SHORT FURROW - a hand's length behind it.
  4 THE LONG FURROW - running off the frame edge, ridges along both sides.
  5 HALF HIDDEN - a body behind the rock with only its top half showing past the boulder's outline.
  6 THE PAIR - the boulder and one palm-sized stone in front of it, wet ground around both.

PLATE: the six states, plus the boulder and one palm stone at one size.

NOT: no character face (plain silhouettes only, for size), no orange anywhere on this sheet, no
lettering or numerals, no crack, moss or grain on the rock, no strain line, sweat drop, motion line
or dust puff, no airbrush, gradient, glow or soft edge.
```

```
PROP SHEET - RiceCake   (taro-batik · SCENE token: RiceCake)

Five round rice cakes on a broad leaf. One book, eight of its ten pages, and the count going down is
the book.

FORM: a round flat cake the size of a child's palm, CLOTH - it is pale food, so it is among the
  brightest things on the page and it sits on a MID leaf, which is what makes it read. Its only
  interior mark is nothing: 0 pattern, 0 dusting, 0 sheen, 0 line.
🔴 THE COUNT ONLY GOES DOWN AND THE LEAF STAYS THE SAME. Draw the same leaf from straight above at
  one size with FIVE, then ONE, then NONE. 🔴 An eaten cake leaves BARE LEAF, never a smaller cake
  and never a nibbled one.
🔴 THE LAST CAKE IS THE OBJECT OF THE BOOK, so it gets three states of its own, all at one size:
  WHOLE - a plain circle in the middle of the leaf.
  DRYING - the same circle with its rim slightly shrunken and puckered, still one flat area.
  BROKEN IN TWO - snapped clean across the middle into two pieces that are plainly EQUAL, lying
    apart with a few crumbs between them. 🔴 A four-year-old must see that neither half is bigger;
    that is the ending.
CRUMBS: at most 9 tiny DEEP specks on the pale cake side and on the leaf, each its own mark, none
  mirroring its neighbour.
STATES:
  1 FIVE on the leaf, evenly spaced, from above.
  2 ONE on the leaf, from above, the rest of the leaf plainly bare.
  3 THE THREE STATES OF THE LAST CAKE in a row.
  4 AN ANT LINE approaching across plank boards, its head a hand's width from the cake - the near
    six or seven ants separate and the rest one joined line. (A RUN is exempt from the repeat cap.)
  5 THE EMPTY LEAF, same size as state 1, with an ant line leaving it carrying crumbs.

PLATE: states 1, 2 and 5 stacked at one size, then 3 and 4.

NOT: no character, no orange anywhere on this sheet, no lettering or numerals, no pattern, stamp,
dusting or sheen on a cake, no bite mark, no steam, no airbrush, gradient, glow or soft edge.
```

```
PROP SHEET - MudTracks   (taro-batik · use the anchor's RAIN AND AFTER clause · SCENE token: MudTracks)

The marks bodies leave in the wet ground after the rain has passed. One book is ten pages of them.

🔴 AFTER THE RAIN THE GROUND IS DEEP AND WET, so a mark in it is NOT darker - it is the ground
  BROKEN. A print is a small area where the smooth wet surface is gone, showing as a harder-edged
  patch with a thin ridge of thrown earth along one side. 🔴 The difference between marked and
  unmarked ground is EDGE, never value: smooth wet ground has no edges in it at all, and that
  smoothness is what a fresh mark destroys.
FOUR KINDS, and they must be tellable apart at thumbnail size:
  A DEEP PRINT - one clear foot shape with a raised rim, made by running.
  A SHALLOW PRINT - the same shape without a rim, made by walking. 🔴 One page compares a set of
    deep prints with a set of shallow ones, so both are on this sheet at one size.
  A SLIDE - ONE long straight groove the width of a body, with a low ridge pushed up along BOTH
    sides and at most 5 clods thrown clear.
  A SPLAYED PRINT - a small hand-like mark with the toes spread wide (a gecko's), quite different in
    shape from any of the above.
🔴 A TRACK LINE OBEYS THE RUN RULE: the near six or seven prints are separate and the rest carry on
  as one joined line into the distance. Two bodies walking make TWO lines side by side, at different
  sizes, never crossing.
🔴 RAIN RESETS IT. Draw the same stretch of road once with a full set of marks and once completely
  smooth and even, at the same size, so the page can show that everything was washed out.
STATES:
  1 SMOOTH WET ROAD, 0 marks, one flat area with a faint pale skin of water on it.
  2 FOUR DEEP PRINTS, the last one throwing earth.
  3 THE SLIDE, one long groove with its two ridges.
  4 SIX SHALLOW PRINTS in a row, no rims.
  5 A SPLAYED PRINT close up, and beside it one foot print at the same size.
  6 TWO TRACK LINES side by side receding, the near pairs separate and the rest joined.

PLATE: states 1 and 6 at one size (the reset pair), then 2, 3, 4, 5.

NOT: no character, no orange anywhere on this sheet, no lettering or numerals, no gloss, reflection
or wet highlight on the mud, no stipple or spatter texture, no motion line beside a slide, no
airbrush, gradient, glow or soft edge.
```

**§3.30 `Broom` · §3.31 `Ball` — 요약 명세**

| § | 토큰 | 매체 판정 한 줄 | 반드시 들어갈 상태 |
|---|---|---|---|
| 3.30 | `Broom` | 자루는 DEEP · 🔴 **솔은 풀을 묶은 것이라 CLOTH**(앵커 팔레트 `anything woven from grass`) — 어두운 마루 위에서 솔만 밝다 | 세워 둔 / 쓰는 중(솔 끝이 널에 닿음) / 🔴 **쓴 자리와 안 쓴 자리가 한 화면에**(15 p1) / 벽에 기대 놓은 |
| 3.31 | `Ball` | 마른 코코넛이라 MID · 🔴 **구르는 것은 자국으로만 말한다** — 모션 라인 0, 뒤에 짧게 파인 DEEP 자국 한 줄 | 마루 한복판에 놓인 하나 / 두 손 사이 공중에 / **반 뼘 굴러가다 멈춘 것과 그 뒤의 짧은 자국**(16 착지) / 땅에 튀어 오르는 참 |

---

### 🔴 §3.32 앵커 신고 — 사물 때문에 앵커가 깨지는 자리 넷

> 🔴 **고치지 않고 적어 둔다.** 앵커는 `taro-anchor.md` 가 SSOT 이고 이 문서는 그림체를 안 고친다.
> 아래 넷은 **사물 시트를 쓰면서 드러난 것**이고, 그중 둘은 앵커 문안을 한 줄 손대야 한다.

| # | 어디가 부딪히나 | 무슨 일이 벌어지나 | 제안 |
|---|---|---|---|
| 1 | 앵커 `RENDERING`: `FINISHED THINGS PER PAGE = 2` | 🔴 **23권 p1(떡 다섯) · 09권(조개 서른) · 44권(껍질 넷) · 33권(돌과 조개가 바닥을 덮음)이 이 조항과 정면으로 부딪힌다.** 앵커 §3 이 이미 `A RUN OR A BAND … IS EXEMPT FROM THESE CAPS` 를 넣어 **반복 상한**은 풀었는데, `FINISHED THINGS PER PAGE = 2` 는 **다른 조항이고 안 풀렸다** | `FINISHED THINGS PER PAGE = 2 (a RUN or a BAND counts as ONE finished thing)` 로 한 줄. 없으면 화가가 떡 다섯 중 둘만 마무리하고 셋을 뭉갠다 |
| 2 | 앵커 `NIGHT` 조항: `MID exists only where a light reaches and the light itself is CLOTH` | 41권 p7 은 **낮인데 등불을 켠다**(비 오는 한낮, 마루 안이 어둡다). `NIGHT` 조항은 밤에만 걸려 있어 그 쪽의 값이 정해지지 않는다 | 조항 이름을 `NIGHT AND DARK INTERIORS` 로. §3.9 `Lamp` 는 그 전제로 썼다 |
| 3 | 앵커 `EXCEPT a shadow LYING ON THE GROUND` | 🔴 **그림자를 허용은 했는데 길이를 아무도 안 정했다.** 32·04·11·26·40 다섯 권이 길이로 시간을 재는데, 앵커는 「평평한 실루엣 하나」까지만 말한다 | 앵커는 그대로 두고 **§3.7 시트가 사다리를 든다**(이미 그렇게 썼다). 앵커에 `(its length is fixed on the Shadow prop sheet)` 한 줄만 |
| 4 | 앵커 `SCENE 쪽에 남은 자리 하나`(앵커 §3 맨 끝 ⚠️) | 앵커가 스스로 적어 둔 12 p8 「얼굴을 덮은 잎 그림자」 문제 — **아직 SCENE 이 안 고쳐졌다**. §3.7 은 「그림자는 얼굴에 절대 안 닿는다」로 썼으므로 지금은 시트와 대본이 어긋나 있다 | 12 p8 SCENE 을 「얼굴 위 DEEP 잎 덩어리」로 한 줄 수정(앵커가 이미 제안해 둔 것). 🔴 **미결로 남기지 말 것** |

⚠️ **캐스트 쪽 신고 하나** — 49·50권의 **아기 원숭이**가 사물이 아니라 새 인물인데, 앵커 `CHARACTER
DESIGN LANGUAGE` 는 타로(아이)·무무(아이)·어른 둘까지만 규격을 준다. 🔴 **어린 것이 하나 더 있으면
「어린 것은 팔다리가 길고 몸이 동그랗다」 규칙이 타로와 겹친다** — 아기는 무엇이 길어야 하는지 캐스트
시트가 정해야 두 권이 선다.

### §3.33 검수 — 사물 시트의 다섯

1. 시트에 **주황이 0점**인가. 주황은 타로 허리끈·무무 머리끈에만 닿는다(자리 시트와 같은 규칙).
2. 밝은 것이 전부 **막은 자리**인가 — 구멍(§3.5)·띠(§3.8)·불(§3.9)·번개(§3.10)·물줄기(§3.11)·
   팔찌(§3.15)·열매(§3.16·§3.18)·바나나(§3.17)가 하나도 「위에 칠한 밝기」가 아니어야 한다.
3. 개수가 사건인 시트에서 **개수가 맞는가** — 돌 셋(§3.4) · 징검돌 다섯(§3.14) · 손자국 넷(§3.17) ·
   코코넛 껍질 셋(§3.1) · 팔찌 매듭 아홉(§3.15).
4. 그림자가 **바닥에만** 있고 몸·얼굴·벽에 없는가(§3.7).
5. 시트에 **글자·숫자가 0개**인가. 🔴 특히 §3.6 — 모래 그림에 글자가 들어가면 5개 언어판이 통째로 죽는다.

---

## §3-a. 🔴 「같은 판, 한 가지만 다름」 — 열두 짝은 판을 **한 장만** 그린다 (2026-09-05)

뒤 절반에 첫 쪽과 끝 쪽이 **같은 화면인데 한 가지만 다른** 짝이 열둘 있고, **그중 일곱은 SCENE 이 톤 줄에
직접 못 박았다**(「첫 쪽과 같은 띠가 같은 자리에 있는데 몸만 일어서 있어」 · 「같은 물건이 반대로 쥐인다」 ·
「같은 자리가 정반대로 조용하다」…). 🔴 **두 쪽을 각각 그리면 그 권의 착지가 통째로 없어진다** — 다른
그림 두 장은 비교가 안 되고, 아이가 「달라진 하나」를 못 찾는다.

**그래서 이 짝은 쪽이 아니라 판으로 굽는다.**

1. **판 한 장을 그린다** — 카메라·거리·프레임·바닥선·붙박이 배치가 전부 그 한 장에서 나온다.
2. **바꾸는 것은 정확히 하나다.** 그 하나는 SCENE 이 이미 이름을 대 준다(누운 몸 ↔ 일어선 몸 · 떼는 손 ↔
   덮은 손 · 구른 자국 ↔ 눌린 자국 · 들썩이는 널 ↔ 조용한 널 · 끊긴 줄 ↔ 이어진 줄 · 빈 옆자리 ↔ 찬 옆자리).
3. **나머지는 한 획도 안 옮긴다.** 잎 개수·크랙 자리·그림자 각도까지 같다. 🔴 크랙은 특히 눈에 띄는데,
   같은 판에서 크랙이 다르면 아이가 **그 차이를 「달라진 하나」로 읽는다** — 정답이 두 개가 된다.
4. 시트의 `PLATE` 규약과 같은 일이다(`states 1 and 6 at one size (the reset pair)`). 🔴 짝인 줄 모르고
   굽지 않도록, 경로표의 「이어짐」 칸에 그 짝을 적어 둔다.

말 없이 짝이 되는 다섯(네 덩이 · 덮인 바닥↔드러난 흙 · 비뚤어진 끈↔조인 매듭 · 파인 한 줄↔얕은 두 줄 ·
한 통만 참↔둘 다 참 · 길에 놓임↔밑동에 깔림)도 **같은 규칙**이다. 🔴 **못 박은 일곱만 지키면 안 된다** —
말이 없다고 짝이 아닌 게 아니라, 말이 없어서 더 쉽게 두 장이 된다.

---

## §4. 권별 경로표 — 25개

🔴 **권별 경로표는 [`taro-routes.md`](taro-routes.md) 로 옮겼다**(50권 500쪽, 넷째 칸 = 그 권의 계기).

---

## §5. 검수 — 이 시리즈의 다섯

1. 두 큰 나무가 **한 나무인가**(01 p3·p4/p5·p6/p7 을 나란히). 다르면 01 의 착지가 없다.
2. `WellTree` 우물 턱이 **밑동 오른쪽**이고, 길에서 보면 **왼쪽 반이 가려지는가**(06 p3 이 그렇게 적혀 있다).
3. 무대·사물 시트 어디에도 **주황이 0점인가**. 주황은 타로 허리끈·무무 머리끈에만 닿는다.
4. `TaroYard` 와 `MumuYard` 가 **같은 집을 뒤집은 것**인가.
5. 시트에 **글자·숫자가 0개**인가(5개 언어 번역판).
