# 유키네 산골 — 무대·사물 시트

> art-director 산출물 (2026-08-16 · 사물 시트 2026-09-04). 시리즈 14 `yuki-inkwash` · **50권 500쪽**
> (§1 의 「25권」은 늘기 전 숫자다 — §2 는 01~50 전권을 읽고 썼다).
> 🔴 앵커 SSOT = `yuki-anchor.md`. 이 문서는 그 그림체로 그릴 대상을 확정한다 — 앵커를 안 고친다.
> 후보 = `docs/changjak-books/yuki/_stages.json`(자리 17 · 사물 44) · **사물 후보 = `_PROP-SHEETS.md` 의
> `## yuki` 절**(40권 · 61장, 컷 라벨까지 읽은 판) · 대본 = `_scenes.json`
> **실행 순서** ① `Yard` → ② 나머지 자리 → ③ 사물 → ④ 컷.

---

## §0. 🔴 이 시리즈의 매체 번역 한 줄

**무대는 「무엇이 있나」가 아니라 「몇 획인가」다.**

앵커가 `STROKE COUNT IS THE INSTRUMENT OF THIS BOOK` 이라고 못 박았고, 계절 넷이 색이 아니라 **획 수와
젖은 정도**로만 갈린다. SCENE 이 이미 그렇게 쓰여 있다 — 19 p1 겨울 마당은 「담 윗줄 하나와 마루 끝선
하나뿐, 바닥에는 자국이 하나도 없다」 = **2획**. 01 p1 봄 마당은 젖은 흙 + 돌담 귀퉁이 = 4획.

🔴 **그러므로 이 시리즈의 자리 시트는 사물 목록이면 안 된다.** 목록으로 쓰면 겨울에도 그 목록을 다 그려
버리고, 그 순간 「겨울은 획이 가장 적다」는 이 시리즈의 유일한 계절 장치가 죽는다. → **모든 자리 시트에
`STROKE BUDGET` 절을 계절 넷으로 배급한다.**

🔴 **계절은 권 번호가 정한다 — 시트에 권 목록을 적지 마라**(2026-09-05 · `yuki-routes.md` ③·⑧).

한 시리즈가 한 해이고 **그 해가 두 번 돈다**:

| | 봄 | 여름 | 가을 | 겨울 |
|---|---|---|---|---|
| 첫 해 | 01~06 | 07~12 | 13~18 | 19~25 |
| 둘째 해 | 26~31 | 32~37 | 38~43 | 44~50 |

⚠️ 시트 넷이 「가을만 · 여름만 · 겨울만」이라 배급해 두었는데 **전부 틀렸다** — 특히 `HillPath` 는
**겨울만 배급했는데 26~50 에 겨울이 한 쪽도 없다**(봄 03 다섯 쪽 · 가을 41 열 쪽). 🔴 그러므로
**계절을 권 목록으로 적지 않는다.** 자리 시트는 **자기가 실제로 받는 계절을 전부 배급**하고, 그 자리에
안 오는 계절은 「안 온다」가 아니라 **적지 않는다**(다음 권이 오면 그 줄이 또 틀린다).

🔴 **둘째 — 「몸이 닿는 자리」는 카메라이고, 자리 시트마다 스팟 하나가 더 있어야 한다**
(`_ROUTE-FINDINGS.md` §13 · 이 시리즈 신고는 `yuki-routes.md` ⑦). **열일곱 권의 p9 가 「두 손을 목 뒤로
올려 매듭을 고쳐 맨다」**이고, 그 쪽은 어깨 위만 있는 화면이라 A~D 어디도 아니다.

→ **모든 자리 시트가 아래 스팟을 갖는다.** 자리마다 다른 것은 **배경 한 줄**뿐이다.

```
  X CLOSE ON TWO - where two bodies (or a body and the one thing it holds) touch. The touching place
    is where BOTH strokes ran wettest and their ink pooled - the darkest thing in the frame - and
    away from it the same two strokes run dry and break. 🔴 IT IS STILL ONE STROKE PER BODY: coming
    closer does not add strokes, and the page's count does not rise. Background = <이 자리의 것 한
    줄>, and nothing else. 🔴 ON THIS SHEET IT IS DRAWN EMPTY - the background alone with no body
    in it, because a stage sheet carries no character.
```

---

## §1. 자리 시트 — 10장 (후보 17에서 접고 · 2026-09-04 `Shed` 신설)

🔴 **쪽·권 수는 손으로 적지 않는다** — `node packages/client/scripts/build-series-routes.mjs --count yuki`
가 SCENE 에서 센다(**되짚는 쪽까지**). 2026-09-05 실측:

```
Yard 253쪽·35권 · Room 103쪽·19권 · MountainPath 37쪽·5권 · Field 29쪽·5권 · Creek 24쪽·6권 ·
HillPath 22쪽·3권 · Shed 14쪽·3권 · ChestnutGrove 8쪽·1권 · BackOfHouse 7쪽·2권 · Kennel 3쪽·1권
```


🔴 **접은 내역** (기준 = 카메라가 한 걸음 옮기면 닿는가)

| 시트 | = 후보 | 왜 하나인가 |
|---|---|---|
| `Yard` | 마당 · 집 마당 · 마당 한복판 · 마당과 마루 밑 · 마루 앞 · 마루 끝 · 마루 · 감나무 밑 · 마당 한쪽 항아리 자리 · 문턱 앞 | 마루에서 마당 흙이 보이고(12 p4) 마당에서 마루 끝선이 보인다(19 p1). **한 화면 안이다**. 🔴 「**방문 앞**」은 여기 넣지 않는다 — 20권은 열 쪽이 방 안이고 그 「방문 앞」은 **안에서 본 문**이다(`Room`). 밖에서 본 것은 23 p10 하나뿐이라 그 권만 못박았다 |
| `Room` | 방 안 · 방 안 밥상 · 방 안 창가 · 방 안 잠자리 | 한 방의 네 구석 |
| `Field` | 밭 · 밭 가 | |
| `Creek` | 개울가 · 집 아래 개울가 | |
| `MountainPath` · `ChestnutGrove` · `BackOfHouse` | (각 1) | 🔴 §3 |
| 🔴 `HillPath` | 언덕길 · 언덕 중턱 · 언덕 꼭대기 · 집 뒤 언덕길 | **신설** — 25권 **7쪽**(p3·p4·p5·p6·p7·p9·p10)이 여기다. 14권 산길(`MountainPath`)과 다르다: 25 p1 이 **방 창 너머로 그 언덕을 본다** = 집에서 보이는 언덕 |
| `Kennel` | 개집 안 · 개집 앞 | 16권 |
| 🔴 `Shed` | 집 뒤 헛간 처마 밑 · 헛간 앞 · 헛간 옆 눈밭 · 헛간 뒤 · 헛간 안 | **신설**(13쪽·3권) — 🔴 **21권은 열 쪽이 통째로 여기**다. `BackOfHouse`(집 뒤 벽 + 장작더미)와 다르다: 헛간은 **제 벽과 제 처마를 가진 건물**이고 21권의 감 줄이 그 처마에 걸린다. §1.4 |

### §1.1 Yard — 실제 프롬프트

```
STAGE SHEET - Yard   (yuki-inkwash · SCENE token: Yard · bake FIRST)

The hamlet house and the earth yard in front of it. Thirteen of the twenty-five books stand here,
so this drawing decides the place once.

FIXED PARTS - each is ONE stroke unless said otherwise, loaded once and lifted once:
  LOW STONE WALL closing the far side of the yard - ONE long stroke for its top line, wet and dark
    where it starts at the left, dry and broken where it runs out at the right. Never two strokes.
  VERANDA EDGE across the near right - ONE straight stroke; the boards under it are 2 short strokes
    and the dark beneath is ONE flat wash with 0 strokes inside it.
  DEEP EAVE above the veranda - ONE stroke, its dry broken end at the far side.
  🔴 THREE TREES STAND IN THIS YARD AND THE BOOKS SAY ONLY "the tree" - fix which is which here.
  🔴 WHEN A SCRIPT SAYS ONLY "the big tree" OR "the tree in the middle", IT IS THE ZELKOVA: it is
  the tallest, and it is the one a body stands under for shelter. A page that names a tree keeps
  that name in the spot (Yard/C zelkova), because C alone cannot choose between three.
  PERSIMMON at the LEFT - trunk ONE stroke, THREE branches bending downward, each ONE stroke.
    (the round shade · the fruit · the shade indoors.)
  ZELKOVA at the RIGHT, taller, ONE thick horizontal branch - trunk ONE stroke; a nail is driven
    into the wall below it (one dry touch). (the branch · the rope tied round the trunk.)
  🔴 BLOSSOM TREE at the BACK of the yard, small, THREE flowering branches, the topmost one thick
    with blossom. It exists only in spring.
  🔴 HOW MANY BRANCHES SHOW IS THE SEASON, AND SEEN FROM UNDERNEATH IT IS DIFFERENT:
    from outside, in leaf (spring, summer) the branches are hidden and the crown is ONE wash - only
      the zelkova's one thick horizontal branch still shows through it, and it always shows;
    from outside, bare (autumn, winter) each tree shows exactly the branches listed above and no
      more - three, one, three;
    🔴 FROM UNDERNEATH (SPOT C), looking up inside the crown, the branches show even in leaf: at
      most 9, ONE stroke each, ALL LEANING THE SAME WAY, and they are counted INSTEAD OF the leaf
      wash for that page, never as well as it. A branch torn off by weather is one of these nine -
      🔴 never the zelkova's one thick horizontal branch, which is how that tree is known.
  FOUR JARS standing in a row at the right corner (see PROP SHEET Jars).
  THRESHOLD, one short stroke, where the yard meets the room.
  THE LANE OUTSIDE THE GATE - ONE stroke for its far edge, running off the frame past the wall's
    left end. 🔴 IT IS OUTSIDE THE YARD and it is where a thing is lost and found again; when a
    book stands on it, the wall top line and the veranda edge are behind the viewer, not in frame.
  THE WATER BUTT at the foot of the veranda, ONE stroke for its side and ONE short stroke for its
    rim; the water inside it is bare PAPER.
  UNDER THE VERANDA - the dark beneath the boards is ONE flat wash with 0 strokes inside it (already
    named above) and 🔴 ITS MOUTH IS A PLACE, not a shadow: things go in and come out of it.
  🔴 THE GROUND IS NOT A THING. It is bare PAPER in every season except after rain.

STROKE BUDGET - the season sets the count, not the objects.
  SPRING - 4 strokes plus at most 30 tip-touches for buds on the persimmon. Palest wash only where
    the earth is still wet. The washing line is ONE stroke when a book needs it.
    🔴 BLOSSOM IS BUDGETED SEPARATELY: three flowering branches, the topmost thick with blossom, and
    at most 15 loose petals in the air or on the ground when a book knocks them off. Petals are
    single wet touches, never outlined, and they are the only thing allowed to break the 4-stroke
    yard count in spring.
  SUMMER - the wettest: the zelkova's leaf mass is ONE dark wash on damp paper, bleeding at its own
    edge, and its shade on the ground is ONE flat wash with a hard edge and 0 strokes inside.
  AUTUMN - the driest brush, every stroke broken along its length. Fallen leaves at most 21 dry
    touches that read ONE BY ONE, never overlapping - leaves that COVER the ground are not counted
    and are ONE wash with a ragged edge (§2.23). Persimmons on the bare branches: at most 12 wet blunt touches.
  🔴 WINTER - THE FEWEST OF THE YEAR: the wall top line and the veranda edge, AND NOTHING ELSE. The
    ground is unpainted PAPER edge to edge and carries no mark at all.
    🔴 THE ONE THING THAT BOOK IS ABOUT IS OUTSIDE THIS COUNT - the jars standing in the corner, the
    stack of firewood, the snow figure, the tracks pressed into the ground. It is drawn to its own
    prop sheet and nothing else joins it, so the yard is still the emptiest page of the year with
    one thing in it. (Same wording as the firewood sheet's "a STACK is a RUN and is exempt".) Falling snow, when a book
    asks for it, is at most 14 holes of bare paper - never a dot of white paint. Snow sitting on the
    jar lids is bare paper too, so the lids lose their strokes.

SPOTS - seven, and no more:
  A FROM THE GATE, wide: wall along the back, both trees left and right, veranda entering at right.
  B ON THE VERANDA looking out, medium: the veranda edge across the bottom, yard beyond, eave above.
  C UNDER A TREE (name which - persimmon, zelkova or blossom), medium low: trunk close, that tree's
    branches overhead, wall behind.
  D THE GROUND, close, high: bare paper and whatever is lying on it.
  🔴 E THE WHOLE YARD FROM ABOVE, wide, high, looking straight down: wall, veranda edge, trees and
    jars all as their top lines, and the ground bare PAPER between them. This is the spot that shows
    A SHADE MOVING ACROSS THE YARD, the yard split in two, or ONE mark on an empty ground - the
    landing of several books - and it cannot be had from A.
  🔴 F THE MOUTH UNDER THE VERANDA, medium close, low: the boards' edge across the top, the flat
    dark wash below it, a hand's width of bare ground in front. What is inside shows only where it
    comes out past the boards.
  G CLOSE ON TWO - where two bodies touch. Background = ONE stroke only, the veranda edge or the
    wall top line, crossing behind them, and bare PAPER everywhere else. 🔴 On this sheet it is
    drawn EMPTY, with no body in it.

PLATE: A, B, C, D, E, F, G as seven panels, EACH DRAWN TWICE - once in spring and once in winter,
  side by side, so the stroke budget can be counted against itself. Plus one small plan diagram of
  where wall, veranda, three trees, jars, water butt and the lane outside the gate sit.

NOT: no character of any kind, no vermilion anywhere on this sheet, no lettering or numerals, no
  stroke gone over twice, no white paint, no airbrushed mist, no gradient, no soft edge.
```

### §1.2 Room — 요약 명세 (같은 형식 · 🔴 **103쪽 · 19권**)

`FIXED PARTS` = 방바닥 선 1획 · 들보 1줄 · 문 한 짝 · 창 한 칸 · 아궁이 아가리 · 🔴 **화로 한 짝**
(테 1획 · 안의 재는 안 칠한 종이 · 불이 있으면 그 자리가 화면에서 가장 밝다).
🔴 **아궁이 불빛은 안 칠한 종이이고 화면에서 가장 밝다**(20 p1). `STROKE BUDGET` = 방 전체 **11획 상한**,
20 p7 은 「아궁이 쪽 밝기가 좁아졌다」 = **종이 면적이 줄어드는 것**이지 획을 더하는 게 아니다.

🔴 **계절 넷을 여기도 배급한다**(§0) — 지금까지 방만 11획 하나로 사계절을 다 덮고 있었고, 그러면
**겨울 방과 봄 방이 같은 예산**이라 이 시리즈의 유일한 계절 장치가 방 안에서만 죽는다.
`SPRING·SUMMER` = 11획, 열린 문·창으로 든 바깥이 안 칠한 종이 · `AUTUMN` = 9획, 마른 붓 ·
🔴 `WINTER` = **7획**, 닫힌 문 한 짝과 들보와 방바닥 선, 그리고 **불의 자리(안 칠한 종이)가 그 쪽에서
가장 밝다** — 겨울 방은 획이 아니라 **밝은 자리 하나**로 그린다.

`SPOTS` — 🔴 **넷이 아니라 일곱이다**(2026-09-05 · `yuki-routes.md` ④·⑨):
A 문 쪽 / B 밥상 / C 창가 / D 잠자리 /
🔴 **E 불 앞**(아궁이 아가리 또는 화로 — 26~50 에서만 **36쪽**이고, 30권은 상자를 화로 옆으로 옮기는 것이
열 쪽 전부, 45권은 **칠하지 않고 남은 자리가 줄어드는 것**이 그 권의 시계다. 시트에 이 스팟이 없어서
앞 사람이 다섯째를 안 만들었다 — 고칠 곳은 시트였다) /
🔴 **F 방바닥을 바로 위에서**(20 p5·p7·p10 · 바닥 선과 놓인 것들의 윗면만) /
🔴 **G CLOSE ON TWO**(§0 둘째) — 배경 한 줄 = **방바닥 선 1획**이 화면을 가로지르고 나머지는 맨 종이,
불빛이 드는 쪽이면 그 종이가 한쪽만 넓다.

🔴 `Yard` SPOT C 는 **어느 나무인지 함께 적는다**(`Yard/C 감나무`) — 나무가 셋이라 C 만 붙이면 못 정한다.

### §1.3 나머지 여섯 — 🔴 **「같은 네 절」로 넘기지 않는다. 예산은 시트마다 다르다.**

🔴 **2026-09-05 — 계절 칸을 다시 배급했다.** 여섯 중 넷이 **자기가 안 받는 계절만** 들고 있었다
(`yuki-routes.md` ③·⑧). 특히 `HillPath` 는 **겨울만 배급했는데 겨울이 한 쪽도 안 온다.**
계절을 권 목록으로 적지 않는다 — §0 의 달력이 정한다. 🔴 **여섯 다 마지막 스팟은 `CLOSE ON TWO`**(§0 둘째)
이고, 배경 한 줄만 자리마다 다르다.

| 시트 | `STROKE BUDGET` (계절) | `FIXED PARTS` · `SPOTS` |
|---|---|---|
| `ChestnutGrove` | 가을 = 마른 붓, 밤나무 **한 그루 1획** + 가시 껍질 최대 6 + 낙엽 최대 21 · 🔴 **그늘 덩어리 1획 wash** | 🔴 **SPOT E = 그늘 경계선**(15 p3·p4·p6 이 그 선 위에서 벌어진다 — 한 획으로 바닥을 가로지르는 하드 에지, 안쪽은 한 덩이 짙은 wash) · ⚠️ **A~D 를 안 정했다**(E 라는 글자는 앞에 넷이 있다는 뜻이다 — 쓸 때 채울 것) · F CLOSE ON TWO (배경 = 그늘 경계선 1획) |
| `BackOfHouse` | 🔴 겨울 = **나무 1획 + 장작더미 wash 1 = 2획**, 바닥은 안 칠한 종이 | 집 뒤 벽선 1획 · 나무 1 · A 나무 밑 / B 더미 앞 / C 눈길 / 🔴 **D 집 뒤 벽**(09 p3 — FIXED PARTS 에 벽선이 있는데 스팟이 없었다) / E CLOSE ON TWO (배경 = 벽선 1획) |
| `HillPath` | 🔴 **봄 · 가을 · 겨울 셋을 배급한다**(22쪽·3권). 봄 = 눈 녹은 비탈, 길이 **1획**으로 드러나고 젖은 자리는 palest wash · 가을 = 마른 붓, 길 1획이 길이를 따라 끊긴다 · 겨울 = **길을 1획도 안 긋는다**(눈이라 종이 그대로). 어느 계절이나 나무 1획 · 마을 지붕 윤곽 최대 7 | A 언덕길 / B 중턱 / C 꼭대기(내려다봄) / D CLOSE ON TWO (배경 = 비탈 선 1획, 나머지 맨 종이) |
| `MountainPath` | 🔴 **봄 · 여름 · 가을**(37쪽·5권 — 여름 한 권이 열 쪽이다). 봄 = 짧은 획들 + 안개는 **먹이 멎은 자리의 맨 종이**(에어브러시 금지) · 여름 = 젖은 종이, 잎 덩이 1 wash · 가을 = 마른 붓, 낙엽 최대 21(덮은 낙엽은 한 면). 나무 최대 9, 트렁크 1획씩 | A 길 / B 나무 밑 / C 바닥 / D CLOSE ON TWO (배경 = 나무 기둥 1획) |
| `Creek` | 🔴 **봄 · 여름**(24쪽·6권 — 봄이 아홉 쪽으로 더 많다). 봄 = palest wash, 물은 **안 칠한 종이**, 젖은 돌만 2획 · 여름 = 젖은 종이, 잎 덩이가 물 위로 1 wash. 물은 어느 계절이나 안 칠한 종이다 | A 물가 / B 물속 / C CLOSE ON TWO (배경 = 물가 선 1획) |
| `Field` | 🔴 **봄 · 여름 · 가을**(29쪽·5권 — 가을이 여덟 쪽이다). 봄·여름 = 이랑 최대 9 · 가을 = 마른 붓, 이랑 최대 9 에 **서리는 안 칠한 종이**(흰 물감 금지) | A 밭 / B 밭 가 / C CLOSE ON TWO (배경 = 이랑 1획) |
| 🔴 `Kennel` | 겨울(3쪽·1권) — 🔴 **§1 표에 이름만 있고 명세가 없었다**: 개집 아가리는 **안쪽이 한 덩이 wash** 이고 그 안의 풀 결이 그 권의 계기다 | 아가리 테 1획 · 지붕 선 1획 / A 앞에서 / B 아가리 close / C CLOSE ON TWO (배경 = 아가리의 어두운 한 면) |
### §1.4 Shed — 실제 프롬프트 (신설 · 13쪽 · 3권)

> 21 · 32 p2 · 50 p3·p4. 🔴 **21권은 열 쪽이 전부 이 처마 밑**이고, 그 열 쪽의 시계는 **줄에 매달린 감
> 개수**(아홉 → 여덟 → 여섯)다 — 개수는 §2.15 `Persimmons` 가 들고, 이 시트는 **그 줄이 걸리는 자리**와
> **몇 알이 걸리는 길이인지**를 정한다. 🔴 50권은 **널벽 틈으로 든 빛 세 줄이 몸 위를 지나는 것**이 그림
> 전부이므로 틈의 수·자리·간격이 여기서 고정돼야 한다.
> ⚠️ **이 줄은 「겨울 말고는 이 권들이 안 온다」였다**(2026-09-05 수정) — **32권이 여름에 두 쪽**
> (p2·p3) 여기 온다. 겨울만 배급하면 그 두 쪽이 눈 온 헛간으로 그려진다. → 아래 예산에 **여름 두 줄**을
> 같이 둔다. 🔴 계절은 권 목록이 아니라 §0 의 달력이 정한다.

```
STAGE SHEET - Shed   (yuki-inkwash · SCENE token: Shed · winter, and two summer pages)

The plank shed behind the house. Three books use it and one of them spends all ten of its pages
under its eave, so the eave, the wall and the inside are decided here once.

FIXED PARTS - each is ONE stroke unless said otherwise, loaded once and lifted once:
  THE DEEP EAVE across the top - ONE long stroke, wet and dark where it starts, dry and broken where
    it runs out. Never two strokes.
  🔴 A LINE STRUNG UNDER THE EAVE, corner to corner - ONE thin stroke crossing the WHOLE frame and
    leaving it at both edges. IT IS LONG ENOUGH TO HANG NINE THINGS ON WITH A GAP BETWEEN EACH, and
    that length never changes, so that six on the same line reads as gaps and not as a shorter line.
  THE PLANK WALL - the boards are 2 short strokes, no more, and the wall is otherwise unpainted.
  🔴 THREE GAPS BETWEEN THE BOARDS - and they are NOT strokes. They are three narrow strips of bare
    PAPER left unpainted, evenly spaced, running the full height of the wall. Inside the shed they
    are the only light there is, and 🔴 THEY LIE STRAIGHT ACROSS WHATEVER IS IN FRONT OF THEM,
    unbroken, body included - a body does not stop them and does not bend them.
  THE DOORWAY, ONE short stroke each side, standing open on darkness that is ONE flat wash with 0
    strokes inside it.
  ONE STRAW HEAP against the inside wall - ONE wash for the mass with at most 11 loose stalks
    breaking its top edge.
  🔴 THE GROUND IS NOT A THING. Outside and in, it is bare PAPER and carries no mark at all.

STROKE BUDGET - winter, and winter here is the fewest of the year (SUMMER is at the foot):
  OUTSIDE = 3 strokes and nothing else - THE EAVE, THE LINE, and ONE wall board. The ground takes 0.
    Falling snow, when a book asks for it, is at most 14 holes of bare paper, never a dot of white
    paint. Snow lying on the eave is bare paper, so the eave stroke stops short of its own top.
  INSIDE = 4 - two board strokes, the straw wash, the doorway dark. The three gaps are not strokes
    and are not counted, because they are paper.
  🔴 WHAT HANGS ON THE LINE IS BUDGETED SEPARATELY and is the only crowded thing on the page: it may
    break the outside count, and nothing else may.
  🔴 SUMMER = 4 outside - the eave, the line, ONE wall board, and the deep shade under the eave as
    ONE flat wash with a hard edge and 0 strokes inside it. The ground stays bare PAPER, the line
    hangs EMPTY, and there is no snow anywhere. Inside is unchanged at 4.

🔴 THE THREE STATES OF THE GAPS - 50 turns on this and the change must be readable at one size:
  1 SHARP - three clean strips of bare paper, hard edged, crossing the body.
  2 FAINT - the same three strips NARROWER, still hard edged, still three, still in the same places.
    🔴 They do not blur and they do not fade at the ends; the strip gets thinner, that is all.
  3 GONE - the wall is one flat wash with no strips at all and the inside has no light.

SPOTS - five:
  A UNDER THE EAVE, medium wide, low: the line crossing the top of the frame with what hangs on it,
    the wall behind, empty ground below.
  B IN FRONT OF THE SHED, wide, eye level: the whole face of it - eave, wall, doorway - with open
    snow to one side.
  C BEHIND THE SHED, medium: 🔴 the plank wall standing UPRIGHT THROUGH THE MIDDLE OF THE FRAME so
    the picture is cut in two, with the near side the narrower half.
  D INSIDE, medium close, high: the straw heap, the doorway dark, and the three paper gaps lying
    across the frame.
  E CLOSE ON TWO - where two bodies touch. Background = ONE of the three paper gaps running straight
    behind them, and the plank wall's flat wash either side. 🔴 On this sheet it is drawn EMPTY,
    with no body in it - and the gap still does not bend.

PLATE: A, B, C, D, E once each, plus 🔴 THE LINE DRAWN TWICE at one size - with nine hanging and
  with six - so the gaps are countable, and 🔴 D DRAWN THREE TIMES for the three states of the gaps,
  and 🔴 B DRAWN TWICE, winter and summer, so the two budgets are counted against each other.

NOT: no character of any kind, no vermilion anywhere on this sheet, no lettering or numerals, no
  stroke gone over twice, no white paint on snow, no drawn grain or knot on a plank, no beam of
  light, no dust in a beam, no glow, no gradient, no soft or feathered edge, no blurred or faded
  gap, no shadow on a body or a face.
```


---

## §2. 사물 시트 — 45장 (후보 61 에서 접고 뺀 뒤 + 🔴 **작업표에 없던 20** 을 대본에서 찾아 넣었다)

> 🔴 **단위는 권이다.** 한 권이 기대는 사물부터. 형식 정본 = `pongi-stages.md` §2.1 · §2.2 와 아래 §2.1 `Jars`.
> 🔴 **이 매체에서 밝은 것은 그리는 게 아니라 안 찍는 것이다** — 불빛 · 눈 · 입김 · 김 · 거품 · 문에 든 해가
> 전부 한 가족(안 칠한 종이)이고, 시트마다 그 자리를 못 박아 뒀다. 여기에 먹을 얹으면 이 매체가 아니게 된다.
> 🔴 **주홍은 목도리 하나뿐이다**(앵커 PALETTE). 그래서 모든 사물 시트의 `NOT` 에 `no vermilion` 이 들어가고,
> 예외는 §2.42 `Scarf` 하나다.

| § | 토큰 | 사물 | 권 (그 권 쪽 수) |
|---|---|---|---|
| 2.1 | `Jars` | 항아리 넷 | 24(8) · `Yard` 고정 부품 |
| 2.2 | `Firewood` | 장작더미 | 23(7) |
| 2.3 | `Quilt` | 이불 한 채 | **04**(8) · 18 · 30 · 43(6) · 44(5) · 45(5) · 46(9) · 50 |
| 2.4 | `Brazier` | 화로 | **48**(7) · 30(7) · 38(5) · 45(7) · 46 · 50 |
| 2.5 | `Lamp` | 등불 | 44(6) · 46(7) · 50 |
| 2.6 | `Box` | 나무 상자와 그 안의 새끼 새 | **30**(9) |
| 2.7 | `WoodBlocks` | 나무 조각 | 45(3) |
| 2.8 | `Toothbrush` | 칫솔 | 44(6) |
| 2.9 | `HotStone` | 천에 싼 돌 | 50(3) |
| 2.10 | `Bowls` | 밥상 그릇 넷 · 나르는 큰 그릇 | 26(5) · 38(5) · 14(5) · 10(3) · 07(3) · 05 · 22 |
| 2.11 | `Plate` | 접시와 그 위 주먹밥 | **33**(9) · 27 · 44 · 38 |
| 2.12 | `Basin` | 대야 | 27(6) · 43 |
| 2.13 | `Basket` | 바구니 | 40(7) · 03(6) · 26(3) · 15(3) · 08 · 28 · 34 · 42 |
| 2.14 | `WaterTub` | 물통과 그 안의 수박 | **10**(10) |
| 2.15 | `Persimmons` | 감 · 곶감 | **13**(8) · 21(6) · 44 |
| 2.16 | `Chestnuts` | 밤송이 · 구운 밤 | 15(4) · 38(5) |
| 2.17 | `SweetPotato` | 군고구마 | 48(5) |
| 2.18 | `Acorns` | 도토리 | 14(6) |
| 2.19 | `PineCones` | 솔방울 | **40**(7) |
| 2.20 | `Cucumber` | 오이 | 12(4) |
| 2.21 | `WildBerry` | 산딸기 · 길가 열매 | 08(3) · 34(4) |
| 2.22 | `Mushroom` | 버섯 | 34(2) · 42(3) |
| 2.23 | `FallenLeaves` | 낙엽 | **17**(9) · 41(8) · 42(7) · 14 · 15 · 39 |
| 2.24 | `DryGrass` | 마른풀 | 16(5) · 18(5) |
| 2.25 | `DryBranches` | 마른 가지 한 더미 | 06(4) · 41 |
| 2.26 | `BlossomBranch` | 꺾은 꽃가지 | 05(4) |
| 2.27 | `Broom` | 빗자루 둘 | 17(6) |
| 2.28 | `Mat` | 돗자리 | 07(7) |
| 2.29 | `Stick` | 막대 하나 | 01 · 05 · 13 · 15 · 39 |
| 2.30 | `Boots` | 장화 두 짝 | 29(8) · 50 |
| 2.31 | `SeedPacket` | 씨앗 봉지 · 씨 · 싹 | 01(5) · 27(3) |
| 2.32 | `Ball` | 공 | **36**(7) |
| 2.33 | `StrawDoll` | 짚 인형 | 31(6) |
| 2.34 | `Swing` | 그네 — 밧줄 · 앉을 널 · 끈 뭉치 | **09**(9) |
| 2.35 | `Awning` | 천막 — 줄 · 천 · 매듭 | **11**(9) |
| 2.36 | `BathCauldron` | 목욕 솥 · 널판 · 바가지 | **32**(9) |
| 2.37 | `StoneTower` | 돌탑과 자갈 | **37**(9) |
| 2.38 | `DirtDrawing` | 흙바닥 그림 | 39(6) |
| 2.39 | `SnowLump` | 눈덩이 · 눈사람 | 22(5) · 20 |
| 2.40 | `SnowTracks` | 눈 위 자국 | **19**(9) · 24(5) · 23 · 49 |
| 2.41 | `SmallBird` | 마당 새 | 24(4) |
| 2.42 | `Scarf` | 주홍 목도리 (벗어 놓은 것만) | 21(6) · 47(4) · 46 · 43 · 30 |
| 2.43 | `WhiteBreath` | 입김 · 김 | **47**(4) · 20 · 32 · 38 · 48 · 10 |
| 2.44 | `LowTable` | 밥상 | **26**(5) · 38(4) · 05 · 22 · 03 |
| 2.45 | `Towel` | 수건 | 27(2) · 32 · 35 · 13 |

⚠️ 45장 = 신규 43(§2.3~§2.45) + 기존 2(§2.1 `Jars` · §2.2 `Firewood`). **굵은 권 번호 = 그 권이 이 사물 위에 서 있다.**

### 🔴 접은 내역

| 접은 것 | 어디로 | 왜 |
|---|---|---|
| 33 「접시」 + 「주먹밥」 + 널에 흩어진 「밥알」 | `Plate` | 주먹밥은 접시에서 나온 것이라 크기가 접시에 묶여 있다. **개수가 이 권의 시계**다(넷 → 둘 → 빈 접시) — 갈라 놓으면 그 셈이 두 시트로 나뉜다 |
| 10 「물통」 + 「수박」 + 「조각」 | `WaterTub` | 이 권 열 쪽에서 통과 덩이가 한 번도 떨어지지 않는다. 조각은 덩이를 쪼갠 것이다 |
| 09 「밧줄」 + 「나뭇조각」 + 「끈 뭉치」 | `Swing` | 셋이 한 물건의 부품이다. 🔴 단 **가로 가지와 담벼락 못은 뺐다** — `Yard` 가 이미 붙박이로 들고 있다 |
| 11 「줄」 + 「천」 + 「매듭」 | `Awning` | 같은 물건의 세 상태(감긴 줄 · 팽팽한 줄 · 그 위의 천) |
| 32 「솥」 + 「널판」 + 「바가지」 | `BathCauldron` | 널판은 솥 아가리를 덮는 뚜껑이라 지름이 솥에 묶여 있다 |
| 01 「씨 봉지」 + 「씨」 + 「싹」 + 27 「씨앗 봉지」 | `SeedPacket` | 같은 봉지에서 나온 같은 씨다. 싹은 그 씨의 마지막 상태 |
| 13 「감」 + 21 「줄에 매달린 감」 + 44 「곶감」 | `Persimmons` | 한 나무의 열매가 마르는 과정이다. 🔴 **말린 것은 다른 물건이 아니라 획이 마른 것**이라 이 매체에서는 한 시트가 아니면 안 된다 |
| 15 「껍질」 + 38 「밤」 + 「껍질 더미」 | `Chestnuts` | 가시 껍질 안의 알이 그 알이다 |
| 16 「풀 더미」·「마른풀」 + 18 「마른풀 한 아름」 | `DryGrass` | 같은 마른풀. 16 은 그것을 개집에 넣고 18 은 무 이랑에 덮는다 |
| 05 「가지」(꽃) | `BlossomBranch` | 🔴 **나무에 붙어 있는 동안은 `Yard` 몫**이고, 이 시트는 **꺾여 내려온 뒤**만 든다 |
| 26 「나물」 · 03 「쑥」 | `Basket` 의 담긴 상태 | 바구니를 채우는 것이라 바구니 테두리와 함께여야 「찼다」가 읽힌다 |

### 🔴 접기를 거부한 자리 — 작업표가 틀렸다

| 작업표 | 실제 | 왜 접으면 안 되나 |
|---|---|---|
| `조각 ·공유 10/45` | **10 = 수박 조각 · 45 = 나무 조각** | 퐁이 08/14 의자와 **똑같은 함정**이다. 하나는 물에서 건져 먹는 젖은 과육, 하나는 마룻바닥에 쌓아 올리는 마른 나뭇조각이다. 접으면 45 의 「여섯 층으로 쌓인 탑」이 수박으로 서게 된다 |
| `가지 ·공유 05/06/25/35` | **넷이 다 다른 물건이다** | 05 = 마당 꽃나무의 **꽃가지** · 06 = 진창 길에 깔려고 나른 **마른 가지 더미** · 25 = 눈이 얹혀 있다 떨어지는 **언덕 나뭇가지**(자리) · 35 = 폭풍에 **뜯긴 굵은 생가지**. 한 시트로 묶으면 06 이 「꽃가지를 진흙에 깐다」가 된다 |
| `나무 ·공유 07/11/35/42` | **07·11·35 = 마당 나무(자리) · 42 = 산길 나무(자리)** | 사물이 아니라 자리다. 게다가 07 은 감나무, 11·35 는 느티나무라 `Yard` 시트가 이미 **어느 나무인지 못 박아 놨다**(§1.1). 사물 시트를 만들면 그 못이 풀린다 |
| `그릇 ·공유 10/14/26/38` | **10·14 = 나르는 큰 그릇 · 26·38 = 밥상 그릇** | 같은 흙그릇 집안이라 **한 시트에 두 계열로** 넣었다(§2.10). 대신 크기·용도를 갈라 적었다 — 안 가르면 도토리를 국그릇에 담게 된다 |
| `밥그릇 ·공유 07/38` | 맞다 | 07 은 그 밥그릇을 마당 돗자리로 들고 나갔을 뿐이다 |

🔴 **그리고 작업표에 아예 없던 20건을 대본에서 찾아 넣었다** — 추출기 결함 세 갈래다:
① **조사·활용이 붙으면 딴 낱말이 된다**(「상 위」·「상에」·「상판」이 따로 세어진다) ② **한 글자 낱말은 원리상 못 잡는다**(**상**·**공**·**돌**·**솥**·**감**·**밤**) ③ **권마다 1~2쪽씩 다섯 권에 걸친 물건은 문턱 아래로 사라진다**(막대 5권 · 수건 4권). 🔴 **셋째가 제일 위험하다 — 시트가 없으면 권마다 딴 물건이 나온다.**

### 🔴 뺀 것과 이유

| 뺀 것 | 이유 |
|---|---|
| 01 「비스듬히」 · 06 「아주」 · 09 「가로」 · 25 「위쪽」 · 38 「위로」·「오른」 · 43 「위로」 · 27 「마루에」 · 33 「널에」 · 23 「쌓인」 · 11 「자락」 · 08 「드러난」 · 03 「길게」 | 🔴 **낱말이 아니다.** 부사·조사 붙은 조각이 사물로 뽑혔다(「비스듬히 내려다본」·「아주 낮은 아이레벨」은 **카메라 지시**다). 12건 |
| 20 · 46 「방바닥」 · 35 「문살」 · 47 「처마」 · 40 「방문」 · 09 「담벼락」 | 자리다 — `Room` · `Yard` 몫. 🔴 단 **47 의 처마 그늘은 그 권의 입김이 보이는 유일한 배경**이라 §2.43 이 그것을 조건으로 들고 있다 |
| 03 · 41 「비탈」 · 08 「풀밭」 · 25 「언덕」 · 29 「진창」 · 03 「진흙」 | 자리이고, 계절 상태다. 🔴 **진창·진흙은 `Yard` 의 봄 조항**(「비 온 뒤가 아니면 바닥은 맨 종이다」)이 이미 정한다 |
| 16 「개집」·「아가리」 | 자리 시트 `Kennel` 몫(§1.3) |
| 24 「밑동」 · 07 「기둥」 · 42 「기둥」 | 나무·기둥의 일부라 `Yard` · `MountainPath` 몫 |
| 14 「주머니」 | 유키 옷이라 **캐스트 시트 몫**이다. 🔴 단 **밑에 난 구멍은 그 권의 사건**이라 `Acorns` 시트에 「구멍으로 새는 도토리」 상태를 넣었다 |
| 21 「목도리」 | §2.42 로 갔다(벗어 놓은 상태만). 목에 걸린 동안은 캐스트 시트 |
| 28 「징검돌」(작업표에 없음) | 🔴 **물에 박혀 있어 옮길 수 없으니 자리다** → `Creek` 시트 몫. 단 **셋째 돌 하나만 물에 반쯤 잠겨 있고 그것이 이 권의 전부**다(p1 잠김 → p4 기울어짐 → p7 건너뜀) → **`Creek` 시트에 「징검돌 다섯 · 셋째 돌의 잠김 3단계」를 넣을 것.** 안 넣으면 28권이 성립하지 않는다 |
| 35 「뜯긴 굵은 가지」 | 그 권 한 쪽뿐이고 나무에서 떨어져 나온 것이라 → **`Yard` 느티나무에 「가지 하나가 뜯긴 자리 한 획」 상태를 넣을 것** |
| 18 「무 잎 줄」 | 밭에 심긴 것이라 `Field` 몫. 🔴 단 **곧게 섬 ↔ 한쪽으로 늘어짐**이 이 권의 시계다 → **`Field` 시트에 그 2단계를 넣을 것** |
| 20 「문틈」 | `Room` 의 문 한 짝. 🔴 단 **틈의 너비가 이 권의 시계**다(p4 벌어진 줄 → p9 한 선으로 붙음) → **`Room` 시트에 「문틈 3단계」를 넣을 것** |
| 43 「종이 문에 든 네모난 해」 | `Room` 몫. 🔴 **p1 과 p9 가 같은 자리·같은 크기**여야 그 권이 닫힌다 → `Room` 시트에 못박을 것 |
| 36 「부채」(07) · 「소쿠리」(36·39) | 각 1쪽이고, 소쿠리는 `Basket` 과 같은 결의 얕은 것이라 그 시트에 한 줄로 접었다 |
| 30 「방석」 | `Box` STATE 6 으로 접었다 — **마지막 쪽의 뜻이 「그 줄에 자리가 셋이 되었다」**라 셋을 한 그림에 그려야 읽힌다 |
| 04 「빨랫줄」 | `Yard` 붙박이(「필요한 권에서 한 획」) + `Quilt` STATE 6 이 이미 든다 |
| 02 · 49 | 🔴 **사물이 없는 권이다.** 02 는 안개(=안 칠한 종이), 49 는 눈싸움뿐이라 두 몸 말고 화면에 아무것도 없다. 억지로 시트를 만들지 않았다 |

### 🔴 앵커가 부딪힌 자리 하나 — 신고

앵커 `AUTUMN - Fallen leaves at most 21 dry touches, never overlapping.` 인데 **41 p1 「그 밖은 낙엽뿐이다」 ·
42 p5 「두껍게 쌓인 마른 낙엽」 · 17 p10 「산처럼 쌓인 잎 더미」** 는 21 장으로 못 그린다. 한 장씩 세어 그리면
비탈 하나에 낱장 21 개가 떠 있는 그림이 된다.

🔴 **고칠 곳은 그 세 권이 아니라 조항 한 줄이다.** 이 시리즈는 이미 같은 문법을 갖고 있다 —
`Firewood` §2.2 의 `a STACK is a RUN and is exempt from the repeat cap`, `Yard` 여름의 `leaf mass is ONE dark wash`.
→ **덮인 낙엽은 낱장이 아니라 한 면이고, ≤21 은 「낱장으로 읽히는 잎」에만 걸린다.** 이 규칙을
§2.23 `FallenLeaves` 가 한 곳에서 들고 있다.

✅ **처리(2026-09-04)** — 앵커 `AUTUMN` 조항을 **`at most 21 dry touches that read ONE BY ONE, never
overlapping - leaves that COVER the ground are not counted at all: they are ONE wash with a ragged
edge`** 로 고쳤다(`yuki-anchor.md` §5). §1.1 `Yard` 의 AUTUMN 예산에도 **같은 문구가 복사돼 있어서 같이
고쳤다** — 🔴 상한은 조용히 번지므로 **앵커만 고치면 반쪽**이다.
같이 고친 것 = 앵커가 스스로 색 수를 다르게 말하던 자리(`ONE ink` ↔ `VERMILION … the only colour`).
⚠️ 관통 줄 `RED:`·`MUTE:` 는 **세어 보고 그대로 뒀다**(주홍이 붙은 것은 500쪽 전부 목도리 매듭이다).

### §2.1 Jars — 실제 프롬프트

```
PROP SHEET - Jars   (yuki-inkwash · SCENE token: Jars)

Four earthenware jars standing in a row at one corner of the yard. They are part of the Yard sheet
and are also handled on their own in one book, so their four shapes are fixed here.

FORM: each jar is TWO strokes and no more - ONE loaded stroke down the left shoulder and belly,
  ONE down the right, meeting at the base. The stroke is wet and dark at the shoulder and runs dry
  and broken toward the foot; THAT BREAK IS THE JAR'S ROUNDNESS and nothing else is added for it.
  The lid is ONE short flat stroke laid across the mouth. No glaze, no sheen, no rim light, no
  drawn texture.
FOUR OF THEM, and they are told apart by height alone: tallest, two the same, shortest - so a
  child can say which one. The order never changes across the series.
STATES:
  1 THE ROW, all four, lids on, seen from the front at a child's eye height.
  2 WINTER - 🔴 SNOW ON THE LIDS IS BARE PAPER, so each lid LOSES its stroke and becomes an
    unpainted gap; the jars read as four shoulders rising out of nothing.
  3 ONE JAR ALONE, lid off, its mouth ONE ellipse stroke and the inside ONE flat dark wash with 0
    strokes in it.

PLATE: the three states in a row, plus one close-up of a single jar at large size showing where the
  two strokes start wet and where they break dry.

NOT: no character, no hands, no vermilion, no lettering or numerals, no stroke gone over twice, no
  white paint on the snow, no gradient, no glow, no soft edge.
```

### §2.2 Firewood — 실제 프롬프트

```
PROP SHEET - Firewood   (yuki-inkwash · SCENE token: Firewood)

A stack of split logs under the tree behind the house. One book spends seven pages on it - stacked,
leaning, and down - so both ends of that are fixed here.

FORM: ONE log is ONE stroke seen end-on: a short wet blunt touch for the cut face, and the split
  face is where that same stroke ran dry. Logs are all the same length and the stack is one course
  laid crosswise on the next.
STATES:
  1 STACKED - a squared stack about a child's chest high. 🔴 The near seven or eight log ends are
    separate strokes and the rest of the stack carries on as ONE flat wash with 0 strokes inside it
    (a STACK is a RUN and is exempt from the repeat cap). Snow sits on the top course as bare PAPER.
  2 LEANING - the same stack with its top course pushed out of line, three ends sticking past the
    others.
  3 DOWN - the logs scattered on bare paper, at most 11 separate strokes, no two parallel, and the
    flat wash of the stack GONE - so the page is emptier than before, not busier.

PLATE: the three states at the same size and the same distance, side by side, so the collapse reads
  as a loss of strokes.

NOT: no character, no hands, no vermilion, no lettering or numerals, no bark texture drawn, no
  stroke gone over twice, no white paint, no gradient, no soft edge.
```

---

### §2.3 Quilt — 🔴 8권 공유 · 이 시리즈에서 제일 급한 시트

> 열 권 가까이가 이 한 채 위에서 자고 일어난다. 04 는 그것을 마당 줄에 널었다가 비를 맞히고(8쪽),
> 46 은 세 몸이 그 밑에 눕는다(9쪽). 🔴 **젖은 이불을 그리려고 획을 더하면 안 된다** — 이 매체에서
> 무거워졌다는 것은 획이 아니라 **먹이 한 단 짙어지고 아랫단이 곧게 처지는 것**이다.

```
PROP SHEET - Quilt   (yuki-inkwash · SCENE token: Quilt)

The one padded quilt of the house. Eight books sleep under it, air it on a line, fold it and drag it,
so its size and its ink step are fixed here once.

FORM: the quilt is ONE wash laid in one pass, at the MID step of the five - never lighter or darker
  inside itself. Its folds are at most TWO dry strokes and no more, laid only where it bends; there
  is no drawn quilting, no stitching, no pattern. Its far edge is where that same wash ran dry.
  Spread flat it is a little longer than a grown fox lying down and twice a child's arm span.
🔴 THE UNDERSIDE IS ONE STEP PALER. Wherever a corner is turned back, that turned part is the PALE
  wash - that difference is the only way a fold is read, never an outline and never a shadow.
STATES:
  1 FOLDED - a squared block a child's chest high, TWO fold lines across it, nothing else.
  2 SPREAD FLAT on the floor, seen from a low side, the far edge running dry.
  3 A MOUND with a body under it - the SAME single wash, humped. 🔴 The body underneath is NOT
    drawn and NOT outlined; only the line of the hump says someone is there.
  4 THREE MOUNDS in a row under one quilt - one wash, three heights, the middle lowest.
  5 A CORNER TURNED BACK, the turned part in the pale wash.
  6 OVER THE LINE - half of it hung over one straight stroke, the near half hanging, the far half
    gone over. The line is ONE stroke and the quilt does not bunch on it.
  7 RAIN-SOAKED, on the line: SAME shape, ink one step DARKER, the bottom edge pulled straight and
    heavy instead of dry-broken. 🔴 0 extra strokes, at most 3 drops leaving the lowest corner.

PLATE: states 1-7 at one scale, plus one panel of 2 and 7 side by side so the wetting reads as a
  change of ink step, not of drawing.

NOT: no character, no vermilion, no lettering or numerals, no quilting pattern, stitching or drawn
  seams, no stroke gone over twice, no white paint, no gradient, glow or soft edge.
```

### §2.4 Brazier — 🔴 6권 공유 · 재가 이 방들의 시계다

> 방 안 여섯 권이 이것을 가운데 두고 앉는다. 🔴 **불빛은 그리는 것이 아니라 안 칠한 자리**이고,
> 그 자리가 좁아지는 것이 시간이다 — 45 가 그 한 권이다(p4 손바닥만 → p7 손톱만 → p10 하얗게 식음).
> 작업표는 46 을 화로 공유에서 빠뜨렸다(46 p1·p9 에 있다).

```
PROP SHEET - Brazier   (yuki-inkwash · SCENE token: Brazier)

The clay brazier that stands in the middle of the room. Six books sit around it through evening
into night, and the ash on top of it is how those books tell the time.

FORM: a low round bowl on a foot. ONE loaded stroke down the left shoulder and belly, ONE down the
  right, meeting at the foot - wet and dark at the rim, running dry toward the base. The rim is ONE
  short flat stroke across the top. That is the whole object: 3 strokes.
🔴 THE FIRE IS BARE PAPER. Inside the rim, the live part is an area simply NOT painted, and it is
  the brightest thing in the room. It is read only by the ash around it, which is ONE flat PALE wash
  with 0 strokes inside. NEVER draw a flame shape, a ray, a spark or a glow.
STATES - the ash is the clock, all four at the SAME size and angle so they lay over one another:
  1 RAKED OPEN - the unpainted area is wide, most of the bowl, and the room's floor line is the only
    other mark on the page.
  2 HALF COVERED - the unpainted area is about a palm.
  3 HEAPED OVER - the ash is mounded and the unpainted area is a thumbnail, or gone. Now the brazier
    is a rim stroke and one pale wash and nothing else.
  4 GONE WHITE AND COLD - the ash itself becomes bare PAPER too; only the 3 strokes of the bowl are
    left. 🔴 This is emptier than state 1, not busier.
🔴 THE POKER is ONE dry stroke lying beside it, and where it has been dragged the ash carries at
  most 2 pushed lines. Steam and smoke belong to the WhiteBreath sheet, not here.

PLATE: the four ash states in a row at one size, plus one close-up of the rim showing where the two
  body strokes start wet and where they break dry.

NOT: no character, no vermilion, no lettering or numerals, no drawn flame, rays, sparks or glow, no
  charcoal texture, no stroke gone over twice, no white paint, no gradient or soft edge.
```

### §2.5 Lamp — 3권 · 불이 붙고 꺼지는 것을 획 없이

```
PROP SHEET - Lamp   (yuki-inkwash · SCENE token: Lamp)

The small oil lamp carried about the room at night. Three books use it and one of them (44) moves it
around the frame six times, so where it stands is how that book says how late it is.

FORM: a saucer on a short stem on a flat foot - ONE stroke for the stem and foot, ONE for the
  saucer, and the wick is ONE tiny dark touch at its lip. 3 marks, nothing else. No brass, no sheen.
🔴 THE FLAME IS BARE PAPER and it is TINY - no larger than the wick touch itself. It is read only
  because the wash around the lamp is the DARK step. NEVER draw a teardrop flame outline, a halo, a
  ring of light or rays reaching across the floor.
STATES:
  1 JUST LIT - the unpainted spot is half a fingernail, the dark around it heaviest.
  2 BURNING - the spot a whole fingernail.
  3 SMOKING - the spot gone; ONE dry stroke rises from the wick and thins to nothing at its end.
  4 OUT - no unpainted spot at all, only the wick touch. The page loses a mark; it does not gain one.
🔴 THE LAMP NEVER LIGHTS THE ROOM. Whatever is near it is drawn exactly as it would be anywhere else
  in the room - no brighter, no rim light, no cast shadow thrown from it.

PLATE: the four states at one size, plus one panel with the lamp near and far in the same room so
  its size against a child's hand is fixed.

NOT: no character, no vermilion, no lettering or numerals, no halo, rays or lens flare, no cast
  shadow from the lamp, no stroke gone over twice, no white paint, no gradient or soft edge.
```

### §2.6 Box — 30권 · 상자 안이 이 권의 유일한 클로즈업

```
PROP SHEET - Box   (yuki-inkwash · SCENE token: Box)

A plain wooden box that is set down beside the brazier and slowly pushed closer to it. One book, nine
of its ten pages, and twice the camera goes right inside it.

FORM: a low open box, wider than deep, about two of a child's hands across. Its near edge is TWO
  strokes (top line and the board below it) and its far edge ONE; the corners are square and there
  are at most 2 more strokes for the plank joins. No nails, no grain drawn, no carving.
INSIDE: a bed of straw - at most 9 dry broken touches, all lying the same way, never crossing.
🔴 THE CHICK IS ONE STROKE. A very small bird, body laid in ONE loaded stroke with its underside
  left as bare PAPER; the eye is the place inside that stroke where the ink pooled. Its beak is the
  wet blunt end. It is small enough to sit inside a cupped hand. 🔴 This is NOT the yard bird of
  §2.41 - it has no legs showing, no spread wing, and it never stands.
STATES:
  1 THE BOX ALONE, three-quarter from above, empty, straw only.
  2 THE BOX BESIDE THE BRAZIER, side on, a hand's width away.
  3 THE SAME, pushed until it touches the brazier - SAME size and angle as 2, so only the gap changed.
  4 INSIDE THE BOX from straight above: straw, and the chick curled at the bottom.
  5 THE NEAR EDGE ONLY - two rim strokes across the bottom of the frame with the small body beyond.
  6 🔴 THE ROW - brazier, box, and a floor CUSHION laid in one line, evenly spaced, seen from above at
    a slant. The cushion is ONE flat PALE wash, a square a child can sit on, with ONE edge stroke and
    nothing else. It is folded in here because what the last page means is that the row has three
    places in it, and that only reads if the three are drawn at one size in one picture.

PLATE: the six states, plus one close-up of the chick at large size showing where the stroke starts
  wet and where the underside is left unpainted.

NOT: no character, no vermilion, no lettering or numerals, no wood grain or nails drawn, no feather
  or down texture, no nest of twigs, no stroke gone over twice, no white paint, no gradient or glow.
```

### §2.7 WoodBlocks — 45권 (🔴 10권의 「조각」과 **다른 물건이다**)

> 작업표는 `조각 ·공유 10/45` 로 묶어 놨다. 10 은 물통에서 건져 먹는 **수박 조각**, 45 는 방바닥에 여섯 층으로
> 쌓아 올리는 **마른 나뭇조각**이다. **접기를 거부한다.**

```
PROP SHEET - WoodBlocks   (yuki-inkwash · SCENE token: WoodBlocks)

Offcuts of firewood kept by the brazier and stacked into a tower by a child. One book.

FORM: ONE block is ONE short stroke seen end on - a wet blunt touch for the sawn face, the split
  face being where that same stroke ran dry. They are all about a finger long and NOT all the same
  width; two are plainly wider than the rest. No bark texture, no grain lines.
STATES:
  1 SIX HIGH - a tower of six, laid one across the next, leaning a hair to one side. 🔴 The lean must
    be visible at thumbnail size: that lean is what says it will fall.
  2 THE SAME TOWER HALF BUILT - three high, SAME size and angle as 1.
  3 ONE BLOCK ROLLING off a knee, alone on bare paper, with 2 already come to rest below it - no two
    of the three parallel.
  4 PUSHED ASIDE - a loose run of them along the floor line, drawn as ONE flat wash with only the
    near four ends kept as separate strokes.

PLATE: states 1-4 at one size and distance, plus one large single block showing the wet sawn face
  against the dry split face.

NOT: no character, no vermilion, no lettering or numerals, no bark or grain texture, no motion lines
  or arcs under the falling block, no stroke gone over twice, no white paint, no gradient or glow.
```

### §2.8 Toothbrush — 44권 · 화면에서 가장 마감된 것

```
PROP SHEET - Toothbrush   (yuki-inkwash · SCENE token: Toothbrush)

A child's toothbrush left lying on the floor in front of the bedding. One book. On page 2 it is the
most finished thing on the page, and the whole book turns on it being still there.

FORM: ONE straight stroke for the handle, wet at the head and running dry at the tail, and the
  bristle head is at most 4 short dark touches across its end. Nothing else. It is a little shorter
  than a child's hand.
STATES:
  1 LYING ALONE on the floor, seen from above, the bristles pointing away. 🔴 It carries MORE finish
    than anything else in the frame - the room around it drops to a floor line and one beam.
  2 STANDING, gripped upright in two hands, seen from below.
  3 WITH PASTE - ONE small blunt wet touch sitting on the bristles, no more.
  4 BESIDE THE LAMP on the floor, both at the same distance, so their sizes are fixed against
    each other.
🔴 FOAM IS BARE PAPER: the bubbles at a mouth or on a hand are areas left UNPAINTED, at most 7, and
  they never overlap. Never a white dot of paint, never a drawn outline round a bubble.

PLATE: the four states at one size, plus one close-up of the bristle end.

NOT: no character face (state 3 and the foam note are drawn on their own), no vermilion, no
  lettering or numerals, no branding or stripe on the handle, no sparkle or shine, no stroke gone
  over twice, no white paint, no gradient or soft edge.
```

### §2.9 HotStone — 50권 · 이불 밑의 봉긋한 자리

```
PROP SHEET - HotStone   (yuki-inkwash · SCENE token: HotStone)

A round stone warmed at the brazier, wrapped in a cloth and put into the bedding. One book, and the
last page shows it only as a bulge.

FORM: the stone is ONE round wash at the DARK step, about two fists across, with 0 strokes inside it.
  The cloth is ONE PALE wash laid over it; where the cloth is knotted, the knot is ONE small wet
  touch and the two loose ends are ONE dry stroke each, trailing to one side.
STATES:
  1 THE BARE STONE lying on an opened cloth spread flat - the cloth a pale square, the stone dark at
    its centre. The two read as two steps of the same ink, never as two colours.
  2 WRAPPED AND TIED, the knot up, the ends trailing.
  3 UNDER THE QUILT - 🔴 the stone is NOT drawn at all. The quilt is its own single wash (see Quilt)
    with ONE low hump in it, and that hump is the whole of it.
  4 THE QUILT CORNER LIFTED, the wrapped stone showing in the gap, the quilt edge above it.

PLATE: the four states at one size, plus one panel of 3 and 4 side by side so the hump and the thing
  under it are the same size.

NOT: no character, no vermilion, no lettering or numerals, no steam (that is the WhiteBreath sheet),
  no heat lines or wavy marks, no stroke gone over twice, no white paint, no gradient or glow.
```

### §2.10 Bowls — 7권 공유 · 🔴 **한 시트에 두 계열**

> 작업표는 `그릇 ·공유 10/14/26/38` 로 묶었다. 같은 집 흙그릇이라 한 장이 맞지만, **밥상에 놓이는 넷**과
> **팔에 안고 나르는 큰 것**은 크기·쓰임이 다르다 — 안 가르면 도토리를 국그릇에 담게 된다.

```
PROP SHEET - Bowls   (yuki-inkwash · SCENE token: Bowls)

The household earthenware. Two families, one clay, one sheet - so the same brush makes both.

FORM (both families): a bowl is TWO strokes, ONE down each side, meeting at the foot, wet at the rim
  and running dry at the base. The mouth is ONE ellipse stroke. The inside, when it is empty and seen
  from above, is ONE flat wash at the MID step with 0 strokes in it. No glaze, no sheen, no pattern.
FAMILY A - THE MEAL, four vessels that always come together and never change places:
  RICE BOWL, deepest, with a lid that is ONE short flat stroke; SOUP BOWL, same height, wider mouth;
  a FLAT DISH for greens; a LONGER DISH for fish. 🔴 Their sizes must be tellable apart at thumbnail
  size, because one book (26) turns entirely on ONE of them sitting half off the table edge and then
  being back in the middle.
FAMILY B - THE CARRYING BOWL, one only: as wide as a child's two hands, deep enough to hold to the
  chest with both arms. This is the one that goes out of doors.
STATES:
  1 THE FOUR OF FAMILY A on a low table, from above at a slant, in their fixed order.
  2 THE SAME FOUR, one of them pushed half over the table edge - SAME angle and size as 1.
  3 THE SAME FOUR EMPTY, bottoms showing - the inside wash gone, so the page has FEWER marks.
  4 THE RICE BOWL ALONE, lid off, steam belonging to the WhiteBreath sheet.
  5 THE CARRYING BOWL EMPTY, from above, held to the chest.
  6 THE CARRYING BOWL FILLED TO THE MOUTH - the fill is ONE mounded wash rising just over the rim
    line, and single items are drawn only where they break that mound's edge, at most 6.

PLATE: A's four side by side at one distance, then B beside the rice bowl so the two families are
  fixed against each other, then states 2, 3, 6.

NOT: no character, no vermilion, no lettering or numerals, no glaze shine, highlight or rim light, no
  painted pattern, no chopstick or spoon detail beyond ONE stroke each, no stroke gone over twice,
  no white paint, no gradient or soft edge.
```

### §2.11 Plate — 33권 · 🔴 접시 위의 개수가 이 권의 전부

> 「접시」와 「주먹밥」을 접었다. 이 권은 넷 → 둘 → 빈 접시로 끝나는데, 갈라 놓으면 그 셈이 두 시트로 나뉜다.

```
PROP SHEET - Plate   (yuki-inkwash · SCENE token: Plate)

The shallow dish the rice balls are brought out on, and what sits on it. One book spends nine pages
on it; three other books put dried persimmon or a rice ball on the same dish.

FORM: the plate is a shallow round dish - ONE ellipse stroke for the rim and ONE shorter curve under
  it for the depth. That is all: 2 strokes. Wide enough for four rice balls in a square.
🔴 A RICE BALL IS ONE STROKE - a round wet touch that runs dry at its top, so the dry break IS its
  roundness. It is the size of a child's fist. Nothing is drawn on it: no grains, no wrapping, no
  seaweed band. Four of them together are FOUR separate touches, never one wash.
STATES - the count is the clock; draw them at the SAME size and angle so they lay over one another:
  1 FOUR on the plate.
  2 TWO on the plate, the empty half of the plate showing its bare wash.
  3 THE EMPTY PLATE - 2 strokes and nothing else. The page is emptier than state 1.
  4 SPILLED GRAINS on a board: at most 12 tiny dry touches, none overlapping, scattered from one
    point. 🔴 And its answer state - THE SAME BOARD WITH NOT ONE GRAIN, which is a bare board and
    must plainly be the same board (same 2 plank lines).
  5 ONE RICE BALL held in an open palm, seen from the side, so its size against a hand is fixed.
  6 THE PLATE WITH DRIED PERSIMMON on it - see §2.15 for the fruit; two of them, then the stalks only.

PLATE: states 1, 2, 3 in a row at one size (the count read down the row), then 4, 5, 6.

NOT: no character, no vermilion, no lettering or numerals, no grains or texture drawn on a rice ball,
  no wrapping or seaweed, no pattern on the plate, no stroke gone over twice, no white paint, no
  gradient, glow or soft edge.
```

### §2.12 Basin — 27권 · 물이 흐려지는 것이 그림이다

```
PROP SHEET - Basin   (yuki-inkwash · SCENE token: Basin)

The wide washing basin set down on the yard earth. One book washes hands in it six times over, and
another (43) ducks a face into it.

FORM: a wide shallow basin - ONE stroke for the rim ellipse, ONE shallow curve under it. Its mouth is
  as wide as a child's shoulders. No handles, no rivets, no metal sheen.
🔴 THE WATER IS BARE PAPER. Clean water is the paper inside the rim, with nothing in it at all - you
  can see the basin's own far wall line through it. Dirty water is that same area laid as ONE PALE
  wash, and muddy water ONE MID wash. Nothing else changes. NEVER draw a water surface line, a
  ripple pattern, a sparkle or a reflection.
STATES - three waters at the SAME size and angle:
  1 CLEAR, from above: rim ellipse, the far wall line showing through, paper inside.
  2 CLOUDED AROUND THE HANDS ONLY - the pale wash reaches just past two submerged hands and the rest
    of the water is still paper.
  3 MUDDY THROUGH - one mid wash edge to edge inside the rim, the far wall line gone.
  4 TWO BASINS SIDE BY SIDE, one muddy one clear, same size, so the difference is only the wash.
  5 RIPPLES, when a face has gone in: at most 2 strokes spreading from one point, and at most 7
    unpainted drops thrown out past the rim. No third stroke.
🔴 FOAM ON HANDS IS BARE PAPER - a lump of unpainted area sitting over the hands, its edge hard,
  0 strokes inside it, never a bubble outline and never white paint.

PLATE: states 1-4 at one distance, plus one close-up of the rim showing where its stroke breaks dry.

NOT: no character, no vermilion, no lettering or numerals, no ripple pattern, sparkle or reflection,
  no metal sheen, no stroke gone over twice, no white paint, no gradient or soft edge.
```

### §2.13 Basket — 8권 공유 · 채워지는 정도가 규격이다

> 작업표는 03/15/26/40 만 적었는데 08 · 28 · 34 · 42 도 같은 바구니를 든다. **여덟 권이다.**

```
PROP SHEET - Basket   (yuki-inkwash · SCENE token: Basket)

The one carrying basket of the house. Eight books take it out - for greens, chestnuts, mushrooms,
pine cones - so how full it is has to mean the same thing every time.

FORM: a round woven basket with a rim and no handle, carried on one arm or held to the chest, as wide
  as a child's chest. 🔴 THE WEAVE IS NOT DRAWN. The body is ONE wash at the MID step; the rim is ONE
  stroke around the top; the base is where the wash ran dry. At most 3 dry strokes across the body,
  all leaning the same way, stand for the weave and no more.
STATES - the fill is the clock and it is read AT THE RIM LINE:
  1 EMPTY - the inside is ONE flat wash with 0 strokes, and the rim line is unbroken.
  2 HALF - the fill sits BELOW the rim line, which stays unbroken.
  3 TO THE MOUTH - the fill just reaches the rim line.
  4 HEAPED - the fill breaks ABOVE the rim line in a low mound. 🔴 Single items are drawn only where
    they break that outline, at most 6; everything below is one wash.
  5 ON ITS SIDE, tipped over, its mouth toward the camera, the inside wash showing and the fill gone.
  6 THE INSIDE FROM ABOVE, empty - 2 dry strokes for the bottom weave, nothing else.
🔴 A SHALLOW TRAY of the same weave appears in two books (beans being sorted on a veranda): same
  rules exactly, half the depth, no handle, and it is never called a second object.
🔴 WHAT FILLS IT is drawn as the mound in state 4, not as a pile of counted things: leaves and greens
  are ONE wash with at most 20 short tip-touches over it; cones and nuts keep their own sheets.

PLATE: states 1-4 in a row at ONE size and ONE angle so the four fills lay over one another, then 5
  and 6.

NOT: no character, no vermilion, no lettering or numerals, no drawn basketwork or weave pattern, no
  handle, no stroke gone over twice, no white paint, no gradient or soft edge.
```

### §2.14 WaterTub — 10권 · 통과 수박은 열 쪽 내내 떨어지지 않는다

```
PROP SHEET - WaterTub   (yuki-inkwash · SCENE token: WaterTub)

The water tub standing in the yard in high summer, and the melon kept cold in it. One book, all ten
pages, so the tub, the whole melon and its cut pieces are fixed together here.

FORM (TUB): a wooden tub as high as a child's waist - TWO strokes down the sides, ONE ellipse for the
  mouth, at most 2 hoop lines around it. 🔴 THE WATER INSIDE IS THE DARKEST WASH ON THE PAGE, laid in
  one pass with 0 strokes in it: in this book the coldest place is the heaviest ink. Nothing floats
  on it and no surface line is drawn.
FORM (MELON): a whole melon is ONE round wash at the MID step, larger than a child's head, with at
  most 4 dry stripe strokes over it, all curving the same way. Half submerged, the part under water
  is simply NOT drawn - the dark water covers it and there is no outline where the two meet.
STATES:
  1 THE TUB FROM ABOVE at a slant, dark water, the melon half sunk in it.
  2 FIVE CUT PIECES side by side in the carrying bowl (see Bowls), seen from above. 🔴 A PIECE IS A
    WEDGE OF TWO PARTS - the flesh is a PALE wash and the rind ONE dark stroke along its curved back.
    That is the whole piece; no seeds, no separate flesh lines.
  3 ONE PIECE HELD UP at eye height, water leaving its point - at most 3 unpainted drops.
  4 A PIECE GONE SOFT - the same wedge with its two ends drooping and its pale wash one step darker
    where it has been held.
  5 A BITTEN PIECE - the same wedge with ONE bite scooped out of the pale part; the rind stroke is
    unbroken.
  6 PIECES UNDER WATER - shapes lost in the dark wash, read only as the rind strokes still showing.
  7 THE FINISHED RIND, a thin dark crescent alone on a board.

PLATE: 1, then 2 and 3 at one size, then 4 5 6 7. Plus one panel with the whole melon beside a single
  piece so the cut scale is fixed.

NOT: no character, no vermilion (the melon is ink, never red), no lettering or numerals, no seeds
  drawn, no water surface lines, sparkle or reflection, no stroke gone over twice, no white paint,
  no gradient or glow.
```

### §2.15 Persimmons — 3권 · 🔴 곶감은 다른 물건이 아니라 **획이 마른 것**이다

```
PROP SHEET - Persimmons   (yuki-inkwash · SCENE token: Persimmons)

The fruit of the yard's persimmon tree, from the branch to the drying line to the plate. Three books,
and the same fruit in all of them.

FORM: ONE persimmon is ONE round wet touch with a short dry stroke for the stalk cap on top. It is
  about the size of a child's fist. 🔴 As it dries, NO NEW MARK is added and none is taken away - the
  same touch is made with a brush that is further spent, so it breaks along its length and shrinks.
  That is the whole difference between fresh and dried in this medium.
STATES - one row, left to right, all at the same size:
  1 ON THE BRANCH - a full wet touch, no break, hanging under a branch stroke that bends with it.
    At most 12 on the whole tree.
  2 IN THE HAND, one bite taken - the bite is where the touch is left unpainted, hard edged.
  3 SOFT AND OVER-RIPE - the same touch, its bottom sagging, and where it has run there is ONE thin
    dry trail below it. Nothing more says sweet.
  4 DRIED ON THE LINE - a spent-brush touch, wrinkled by the break in the stroke itself, hanging from
    ONE line stroke that crosses the whole frame. 🔴 THE COUNT IS THE CLOCK: draw the line with NINE,
    then with SIX, at the same size, and the gaps must be plainly countable.
  5 TWO ON A PLATE (see Plate), and its answer - THE STALK CAPS ALONE on the empty plate.

PLATE: the five states in a row, plus one panel of state 1 and state 4 at the same size so the
  drying reads as the brush running out.

NOT: no character, no vermilion (a persimmon in this book is INK, not orange), no lettering or
  numerals, no leaf veins or skin texture, no stroke gone over twice, no white paint, no gradient,
  glow or soft edge.
```

### §2.16 Chestnuts — 2권 · 가시 껍질과 그 안의 알

```
PROP SHEET - Chestnuts   (yuki-inkwash · SCENE token: Chestnuts)

The burrs under the chestnut tree and the nuts roasted in the brazier. Two books, one nut.

FORM (BURR): a round spiny husk about a fist across - ONE wet round touch for the body and at most 14
  short dry spikes standing off its edge, none crossing another. When it splits, the split is ONE
  hard-edged unpainted gap through it.
FORM (NUT): ONE small wet blunt touch, flat on one side, glossy meaning ONLY that its stroke stayed
  wet to the end and did not break.
STATES:
  1 BURRS ON THE GROUND under a tree - at most 6, none overlapping, on dry leaves.
  2 ONE BURR ROLLED HALF OVER, its split facing the camera and EMPTY inside - the gap unpainted.
  3 A SPLIT BURR WITH TWO NUTS showing in the gap, the nuts' strokes wet against the burr's dry ones.
  4 ROASTED NUTS heaped over the mouth of a rice bowl - a low mound above the rim line, single nuts
    only where they break its outline, at most 7.
  5 ONE NUT JUMPING out of the ash - a single touch above the brazier rim, alone. 🔴 0 motion lines,
    0 arcs; it is up there and that is all.
  6 THE SHELL PILE beside the brazier - ONE flat wash with at most 4 near shell edges kept separate.

PLATE: the six states at one size, plus a close-up of a burr's spikes showing the dry break.

NOT: no character, no vermilion, no lettering or numerals, no motion lines or arcs, no shine or
  highlight on a nut, no stroke gone over twice, no white paint, no gradient or glow.
```

### §2.17 SweetPotato — 48권 · 껍질이 벗겨지는 방향이 규격이다

```
PROP SHEET - SweetPotato   (yuki-inkwash · SCENE token: SweetPotato)

A sweet potato roasted in the brazier ash, peeled and broken in two. One book, five pages, and it is
handed over on the last one.

FORM: ONE long tapered wash at the MID step, blunt at one end and pointed at the other, as long as a
  child's hand. The skin is that wash; where the skin is peeled DOWN, it hangs as ONE dry stroke
  curling away from the body, and the flesh laid bare is the PALE step - not paper, one step above it.
STATES:
  1 WHOLE, straight from the ash, a dusting of ash left as at most 5 dry touches.
  2 HALF PEELED - the skin turned down in one piece from the top, hanging in a curl; the pale flesh
    above it. 🔴 The peel comes off DOWNWARD in ONE piece; never draw it in scraps.
  3 BROKEN IN TWO, one half in each hand, the broken faces facing the camera - each face is ONE pale
    wash, and the two halves must fit back together.
  4 ONE HALF HELD OUT, seen from below.
  5 PEEL SCRAPS on the floor - at most 3 dry curls, none touching.
🔴 STEAM belongs to the WhiteBreath sheet: it is unpainted, one thread per half, and it is the only
  thing that says hot.

PLATE: the five states at one size, plus one panel of the two broken halves side by side.

NOT: no character, no vermilion, no lettering or numerals, no drawn steam lines here, no heat wobble,
  no stroke gone over twice, no white paint, no gradient, glow or soft edge.
```

### §2.18 Acorns — 14권 · 🔴 새는 것을 그리려면 새는 자리가 있어야 한다

> 「주머니」 자체는 캐스트 시트 몫이다. 하지만 **밑에 난 구멍**은 이 권의 사건이라 여기에 넣었다.

```
PROP SHEET - Acorns   (yuki-inkwash · SCENE token: Acorns)

Acorns picked up along the mountain path. One book, six pages, and it turns on them leaking out of a
hole without anyone seeing.

FORM: ONE acorn is ONE small wet touch with a shorter dry touch on top for the cap - 2 marks, the cap
  plainly wider than the body. They are all the same size; do not vary them.
STATES:
  1 ON THE GROUND among leaves - at most 6, none overlapping, each one whole.
  2 GOING INTO A BOWL from above: 3 in the bowl already, ONE in the air above the mouth. 🔴 The one
    in the air has 0 motion lines under it.
  3 IN THE BOWL, half full - a low mound below the rim line (see Basket for the rim rule).
  4 IN THE BOWL, to the mouth - the mound just at the rim line.
  5 A TRAIL OF THREE lying behind a walker on the leaves, spaced apart, all the same size. 🔴 This is
    the leak, and it must read as a line of three, not a scatter.
  6 THE HOLE - a pocket lining turned inside out, seen from above: the cloth is ONE pale wash and the
    hole in it is a hard-edged UNPAINTED gap the size of one acorn. Nothing shows through it but
    paper. 🔴 The pocket belongs to the cast sheet; only this hole is drawn here.

PLATE: the six states at one size, plus one large single acorn showing the wet body against the dry
  cap.

NOT: no character, no vermilion, no lettering or numerals, no motion lines, arcs or dotted paths, no
  shell texture, no stroke gone over twice, no white paint, no gradient or glow.
```

### §2.19 PineCones — 40권 · 세는 것과 담는 것

```
PROP SHEET - PineCones   (yuki-inkwash · SCENE token: PineCones)

Pine cones spilled across the veranda boards and gathered back into a basket. One book, seven pages,
and its first and last pages are the same shot with the boards empty and the basket full.

FORM: ONE cone is ONE loaded stroke laid along its length, wet and blunt at the base and running dry
  and broken to the tip - THAT BREAK IS THE SCALES, and no scale is drawn separately. They come in
  two sizes and one of them is plainly the biggest of all.
STATES:
  1 SCATTERED over plank boards from above - at most 12, no two parallel, none overlapping, some
    standing on their base and some lying.
  2 THREE STANDING UPRIGHT in a row and a few lying beside them - 🔴 a standing cone reads only by its
    stroke being vertical; do not add a base or a shadow to prop it.
  3 ONE FLYING off the edge of a board, alone, 0 motion lines.
  4 ONE WEDGED in a threshold gap, the big one, with the gap's ONE plank line crossing it.
  5 IN THE BASKET, half full, then heaped over the rim (see Basket rim rule) - the heap's outline
    broken by at most 5 cone tips.
  6 THE EMPTY BOARDS - the same boards as state 1 with NOT ONE cone on them, 2 plank lines only. This
    is the answer state and it must be plainly the same place.

PLATE: 1 and 6 side by side at the SAME size and angle (they are the book's first and last page),
  then 2 3 4 5. Plus one large single cone showing the dry break.

NOT: no character, no vermilion, no lettering or numerals, no drawn scales, no motion lines or arcs,
  no cast shadow to stand a cone up, no stroke gone over twice, no white paint, no gradient or glow.
```

### §2.20 Cucumber — 12권 (🔴 작업표에 없다)

> 작업표 61 후보에 12권이 통째로 빠져 있다. 오이는 p1·p2·p7·p10 에 나오고 **작아서 안 보이던 것이
> 자라 있는 것**이 이 권의 전부다 — 크기 두 단계가 시트에 없으면 그 대비가 성립하지 않는다.

```
PROP SHEET - Cucumber   (yuki-inkwash · SCENE token: Cucumber)

The one cucumber on the vine at the corner of the field. One book, and it is found twice - once too
small to matter and once grown crooked and big.

FORM: ONE long curved stroke, wet and blunt at the flower end, running dry toward the stalk. At most
  3 tiny dry touches along it for the prickles - no more, and never a grid or dotted skin.
🔴 TWO SIZES AND THEY MUST BE PLAINLY TWO: the first is shorter than a child's finger, the last is as
  long as a child's forearm and kinked in the middle. Draw them side by side once.
STATES:
  1 TINY, hanging from ONE vine stroke, half hidden behind grass strokes.
  2 THE SAME, cupped on a fingertip so the size against a hand is fixed.
  3 GROWN AND CROOKED, on the ground among parted grass, seen from above, with ONE flat ground shadow
    beside it - hard edge, 0 strokes inside (this is the anchor's one permitted shadow).
  4 BITTEN, held to a mouth: ONE hard-edged unpainted bite out of its end.
  5 THE STALK SCAR left on the vine - ONE small dark touch and nothing else.

PLATE: 1 and 3 side by side at one distance (the whole book is that comparison), then 2 4 5.

NOT: no character, no vermilion, no lettering or numerals, no skin texture, dots or grid, no shadow
  on the body of it, no stroke gone over twice, no white paint, no gradient or glow.
```

### §2.21 WildBerry — 2권 · 열매도 딸기도 먹 농담뿐이다

```
PROP SHEET - WildBerry   (yuki-inkwash · SCENE token: WildBerry)

The wild raspberry canes at the edge of the path, and the single round berry found in a palm. Two
books. 🔴 There is no second pigment in this world, so a red berry is a DARK touch, never vermilion -
the vermilion belongs to the scarf alone.

FORM (CANE): ONE arching dry stroke with at most 5 leaf touches along it, all leaning the same way,
  and berries as small wet blunt touches clustered in twos and threes at its tip - at most 9 on one
  cane.
FORM (SINGLE BERRY): ONE small round wet touch, the darkest thing in its frame, sitting alone.
STATES:
  1 THE BUSH FAR OFF - one small dark mass on a far slope, at most 3 strokes, no berries readable.
  2 THE BUSH CLOSE - two laden canes filling the frame edge, berries countable.
  3 ONE BERRY ON AN OPEN PALM, seen from above, alone on paper.
  4 THE SAME BERRY at a mouth, held between two fingertips at eye height.
  5 THE BERRY SET DOWN at the foot of a bush, alone on the ground - the answer state, and it is the
    same touch at the same size as state 3.

PLATE: the five states at one scale, plus one panel of state 1 and state 2 so the far mass and the
  near cane are plainly the same bush.

NOT: no character, no vermilion, no lettering or numerals, no leaf veins, no shine on a berry, no
  stroke gone over twice, no white paint, no gradient, glow or soft edge.
```

### §2.22 Mushroom — 2권 (🔴 42권이 작업표에 없다)

```
PROP SHEET - Mushroom   (yuki-inkwash · SCENE token: Mushroom)

The mushrooms at the foot of a tree on the mountain path. Two books - one leaves them where they are,
one uncovers three of them under the leaves and carries them home in the basket.

FORM: ONE mushroom is TWO strokes - ONE wet blunt touch for the cap, laid so its underside runs dry,
  and ONE short stroke below it for the stem. The cap is plainly wider than the stem. They are the
  size of a child's thumb. No gills drawn, no spots, no ring.
STATES:
  1 TWO AT A TREE ROOT, growing, the root ONE stroke beside them.
  2 ONE ALONE at the root, untouched - the same two strokes, and the frame around it empty.
  3 THREE UNDER LEAVES, half covered: the leaves are ONE wash and only the caps break out of it.
  4 THREE UNCOVERED, the leaves swept back, all three whole on bare ground.
  5 THREE IN THE BASKET, lying against the rim line so their caps break its outline.

PLATE: the five states at one size, plus one large single mushroom showing where the cap stroke runs
  dry at its underside.

NOT: no character, no vermilion, no lettering or numerals, no gills, spots or ring drawn, no stroke
  gone over twice, no white paint, no gradient, glow or soft edge.
```

### §2.23 FallenLeaves — 🔴 6권 · **앵커의 「낙엽 21장」이 걸리는 자리**

> 41 은 비탈이 통째로 낙엽이고 17 은 그것을 산처럼 쌓는다. 낱장 21 로는 못 그린다 →
> **덮인 낙엽은 한 면이고, 21 은 낱장으로 읽히는 잎에만 걸린다.** 이 규칙을 이 시트가 한 곳에서 든다.

```
PROP SHEET - FallenLeaves   (yuki-inkwash · SCENE token: FallenLeaves)

Dry fallen leaves - swept in a yard, lying edge to edge on a slope, kicked up by a running foot. Six
books, one autumn, and the leaves are drawn THREE different ways depending on how they read.

🔴 THE THREE WAYS, and every page uses exactly one of them:
  A LOOSE - leaves you count one by one: at most 21 dry touches, NONE overlapping, no two the same
    way up. Use this on bare ground where the ground still shows.
  B COVERED - ground you cannot see: ONE flat wash at the MID step laid in one pass, with at most 15
    single leaf strokes ON TOP of it near the camera, and NOTHING drawn in the rest of it. 🔴 A slope
    under leaves is a wash, not a count. This does not break the repeat cap - the cap is on loose
    leaves, the way a stack of logs is a run.
  C HEAPED - a pile: ONE wash for the mass with its top edge broken by at most 12 leaf tips, and the
    bare ground swept clean all around it, which is what says a pile is a pile.
FORM: ONE leaf is ONE short dry stroke, broken along its length, with no stalk and no veins.
STATES:
  1 A YARD EVENLY LOOSE (way A) - swept ground on one side of a hard boundary line, leaves on the
    other. That boundary is ONE line and it is the whole picture.
  2 THE SAME YARD HEAPED IN THE MIDDLE (way C), everything around it bare.
  3 A SLOPE COVERED (way B), with ONE pressed track running up it - the track is where the wash is
    left unbroken and the loose leaves beside it are pushed aside.
  4 KICKED UP - at most 12 leaves above the ground, none overlapping, 0 motion lines beneath them.
  5 SWEPT INTO A ROW ahead of a broom - a low ridge (way C) with bare ground behind it.
  6 PARTED BY A HAND - a hole in the wash (way B) with bare earth showing, a span wide.

PLATE: A, B and C drawn as three panels of the SAME patch of ground at the same size, so the three
  ways are plainly three ways of drawing one thing. Then states 1-6.

NOT: no character, no vermilion, no lettering or numerals, no leaf veins or stalks, no motion lines
  or swirls, no stroke gone over twice, no white paint, no gradient, glow or soft edge.
```

### §2.24 DryGrass — 2권 · 안기고 눌리고 덮인다

```
PROP SHEET - DryGrass   (yuki-inkwash · SCENE token: DryGrass)

An armful of dried grass. One book carries it to a kennel and packs it in, another lays it over the
radish rows against frost. Same grass.

FORM: 🔴 GRASS IS A MASS, NOT BLADES. A heap is ONE wash at the PALE step with at most 12 dry stalk
  strokes standing out of its edge, all leaning the same way. Only the near edge gets strokes; the
  rest is the wash.
STATES:
  1 A STOOK STANDING at the corner of a yard, a child's height, its top spreading.
  2 AN ARMFUL, pressed flat against a chest - the wash squashed, its edge strokes now pointing two
    ways where the arms grip.
  3 PULLED FROM UNDER A HEAP - the heap with ONE hollow taken out of its foot, hard edged.
  4 PACKED INTO A HOLE - the wash pushed into a dark opening with its ends sticking out, at most 7
    strokes past the rim. 🔴 Packed grass LOSES its edge strokes: the surface goes slack and no stalk
    stands up. That slackness is the whole point of the page.
  5 SPREAD IN THE SUN, opened out flat and thin, so the ground shows through between the strokes.
  6 LAID OVER A ROW - an even blanket wash along a ridge with ONE span at its end NOT yet covered,
    and under the lifted edge the leaves standing straight.
  7 FROSTED - the same blanket with its top face left as BARE PAPER, hard edged, and only the
    underside carrying the wash.

PLATE: states 1-7 at one size, plus one panel of 1 and 4 side by side so the loss of stalk strokes
  reads.

NOT: no character, no vermilion, no lettering or numerals, no individual blades across the mass, no
  stroke gone over twice, no white paint, no gradient, glow or soft edge.
```

### §2.25 DryBranches — 06권 · 🔴 05·25·35 의 「가지」와 다른 물건이다

```
PROP SHEET - DryBranches   (yuki-inkwash · SCENE token: DryBranches)

An armful of dry sticks, carried out and laid down across a muddy road one after another to walk on.
One book, and one other book carries the same armful home.

FORM: ONE stick is ONE long dry stroke, broken along its whole length, thumb-thick and about as long
  as a child is tall. They are bare - no leaves, no blossom, no side twigs beyond ONE fork on some.
  🔴 THEY ARE ALL DEAD AND GREY-DRY. Never draw a leaf or a bud on these.
STATES:
  1 THE PILE in a yard - ONE wash for the mass with the near 6 sticks kept as separate strokes
    crossing it, no two parallel.
  2 AN ARMFUL held against a chest, the ends fanning out.
  3 ONE STICK LAID ALONE across wet ground, its whole length showing, half sunk so its underside is
    lost in the ground wash.
  4 A LAID ROW - five or six down already, running off one side of the frame, evenly spaced, with the
    remaining pile beside them. 🔴 The count of what is down against what is left is the clock.
  5 THE ROW WALKED ON - the same row with the near sticks pressed deeper, the mud pushed up at their
    sides in ONE stroke each.

PLATE: the five states at one size, plus one large single stick showing the break running its length.

NOT: no character, no vermilion, no lettering or numerals, no leaves, buds or blossom, no bark
  texture, no stroke gone over twice, no white paint, no gradient, glow or soft edge.
```

### §2.26 BlossomBranch — 05권 · 나무에 붙은 동안은 `Yard` 몫이다

```
PROP SHEET - BlossomBranch   (yuki-inkwash · SCENE token: BlossomBranch)

The blossom branch of the yard's flowering tree - AFTER it has been knocked, bent down, and finally
laid on the table. One book. 🔴 While it is still up on the tree it belongs to the Yard sheet (which
fixes three flowering branches, the topmost thick with blossom); this sheet begins at the moment it
is reached for.

FORM: ONE branch is ONE stroke, wet at its base and dry at its tip. Blossom is single WET TOUCHES
  along it, never outlined and never a cluster wash: a thick branch carries at most 20, a bare one
  at most 3. A loose petal is ONE tiny wet touch, and a petal on the ground is the same touch.
STATES:
  1 HIGH AND OUT OF REACH - the branch entering at the top of the frame, blossom thick, and 🔴 the
    GAP between a stretched fingertip and the branch is the drawing. Fix that gap at two hand widths.
  2 STRUCK - the same branch with at most 15 petals loose in the air below it, none overlapping and
    no two the same distance apart. 0 motion lines.
  3 STRIPPED - the same branch with at most 3 blossoms left, and the ground below scattered with
    petals: at most 21 touches, none overlapping.
  4 BENT DOWN - a whole branch curving from the top corner to the bottom of the frame, ONE stroke,
    blossom along its upper side only.
  5 ON THE TABLE - one cut branch lying across a low table, blossom up, beside two rice bowls, seen
    from above at a slant. This is the last page and the branch is now the only wet thing on it.

PLATE: the five states at one size, plus one close-up of five blossoms showing they are touches, not
  drawn flowers.

NOT: no character, no vermilion (blossom is ink, never pink), no lettering or numerals, no petal
  outlines, no flower centres or stamens, no motion lines, no stroke gone over twice, no white paint,
  no gradient, glow or soft edge.
```

### §2.27 Broom — 17권 · 두 자루의 크기가 이 권의 처음이자 끝이다

```
PROP SHEET - Broom   (yuki-inkwash · SCENE token: Broom)

Two yard brooms, one for a grown fox and one for a child. One book, and the first thing that happens
is the smaller one being held out.

FORM: a broom is ONE long stroke for the handle, wet at the grip and dry at the foot, and the head is
  at most 9 dry strokes fanning from its end, all leaning the same way, bound by ONE short cross
  stroke. That is the whole broom.
🔴 THE TWO ARE PLAINLY TWO SIZES: the big one is taller than a grown fox, the small one comes to a
  child's shoulder, and the small one's head is narrower - not just shorter. Draw them side by side
  once, upright, at the same distance. Never let a page invent a third broom.
STATES:
  1 THE PAIR STANDING side by side, upright, from the front.
  2 THE SMALL ONE HELD OUT across a gap, level, seen from the side.
  3 IN USE, angled to the ground, its head bent by the push and the leaves gathered ahead of it (see
    FallenLeaves way C).
  4 FALLEN, lying flat on swept ground, alone, its head away from the camera. 🔴 This is the page
    where nothing else is on the ground; the broom is the only mark.
  5 THE PAIR IN USE FROM OPPOSITE SIDES, both angled toward the middle of a frame.

PLATE: state 1 large (the two sizes are the sheet's job), then 2 3 4 5.

NOT: no character, no vermilion, no lettering or numerals, no bristle detail beyond the 9 strokes, no
  motion lines or dust puffs, no stroke gone over twice, no white paint, no gradient or soft edge.
```

### §2.28 Mat — 07권 · 그늘이 옮겨 가고 돗자리가 그것을 따라간다

```
PROP SHEET - Mat   (yuki-inkwash · SCENE token: Mat)

The straw mat spread on the yard earth in high summer. One book, seven pages, and the whole book is
this mat chasing the tree's shade across the ground.

FORM: a rectangle a little longer than a grown fox lying down. It is ONE flat wash at the PALE step;
  its weave is at most 4 dry strokes running its length, all the same way, and its edge is ONE
  stroke with a short fringe of at most 6 dry touches at the two short ends. Nothing else.
🔴 IT IS ALWAYS SEEN AS A FLAT SHAPE ON THE GROUND, never thick, never lifted at a corner except in
  state 2. When it lies in shade, the shade wash goes OVER it as one flat wash with a hard edge and
  the mat's own strokes are simply lost - do not redraw them through the shade.
STATES - the pairing with the shade is the clock. Draw all four from the SAME high slant at the SAME
  size, with the tree trunk in the same place:
  1 HALF IN, HALF OUT - the round shade at the left, the mat half over its edge.
  2 BEING UNROLLED - one end down, the far end still curled, one corner turned.
  3 FULLY OUT IN THE OPEN - the shade has moved to the trunk and the mat is entirely in the bare
    open. This is the low point of the book and the mat must look stranded.
  4 TIGHT AGAINST THE TRUNK - the mat moved so its long edge touches the trunk.
  5 WHOLLY INSIDE THE SHADE - the shade grown wide and the mat swallowed, its edge stroke only just
    readable inside the flat wash.

PLATE: states 1, 3, 5 in a row at one size (the shade travelling), then 2 and 4.

NOT: no character, no vermilion, no lettering or numerals, no woven pattern beyond the 4 strokes, no
  thickness or drawn shadow under the mat, no stroke gone over twice, no white paint, no gradient.
```

### §2.29 Stick — 5권 (🔴 작업표에 없다 · 권마다 3쪽 아래라 문턱에 걸렸다)

> 퐁이 08 의자와 같은 종류의 누락이다 — **한 권 안에서는 적게 나오는데 다섯 권에 걸쳐 계속 나온다.**
> 시트가 없으면 흙에 금 긋는 막대, 꽃가지를 치는 막대, 밤송이를 굴리는 막대가 서로 다른 물건이 된다.

```
PROP SHEET - Stick   (yuki-inkwash · SCENE token: Stick)

The stick a child picks up. Five books use one: to score a line in the earth, to knock at a high
branch, to poke a persimmon, to roll a burr over, to draw a circle in the dirt.

FORM: ONE dry stroke, broken along its length, a little longer than a child is tall and no thicker
  than a thumb. ONE short fork near the top end and nothing else - no bark, no leaves, no knots
  drawn. 🔴 It is the SAME stick in all five books: the fork is how the reader knows.
STATES:
  1 STANDING UPRIGHT, held at arm's length, its foot on the ground.
  2 REACHING UP, the near end held low, the far end entering the top of the frame - so the stick
    crosses the whole picture on a diagonal.
  3 DRAGGING, its tip in the earth, with ONE shallow scored line behind it and nothing else on the
    ground.
  4 DROPPED, lying alone on the ground, no hand near it.
  5 LAID DOWN BESIDE A FINISHED DRAWING, parallel to it (see DirtDrawing).

PLATE: the five states at one size, plus a close-up of the fork end.

NOT: no character, no vermilion, no lettering or numerals, no bark or knot texture, no motion lines
  or arcs, no leaves, no stroke gone over twice, no white paint, no gradient or soft edge.
```

### §2.30 Boots — 29권 · 한 짝은 서고 한 짝은 주저앉는다

```
PROP SHEET - Boots   (yuki-inkwash · SCENE token: Boots)

A pair of child's rubber boots. One book spends eight pages on them - one of them gets stuck to its
neck in the mud in the middle of the yard - and one other book leaves one lying on the veranda.

FORM: a boot is ONE loaded stroke for the leg and ONE for the foot, meeting at the ankle, wet at the
  toe and running dry up the leg. The sole is ONE short flat stroke under it. No tread pattern, no
  eyelets, no shine.
🔴 THE TWO ARE NEVER THE SAME. One stands with its neck straight; the other has its heel folded in
  and has sagged. That difference is fixed here and holds in every book: the sagged one is the LEFT.
STATES:
  1 THE PAIR from above on the veranda edge - one straight-necked, one collapsed.
  2 THE COLLAPSED ONE close, side on, the folded heel bulging inside the leg.
  3 ONE STUCK UPRIGHT IN MUD, sunk to its neck, alone in the middle of open ground, with ONE ring of
    pushed-up mud around it - 🔴 nothing else in the frame. This is the page of the book.
  4 ONE LYING ON ITS SIDE on plank boards, dried mud on it as at most 5 dry touches.
  5 THE HOLLOW LEFT BEHIND - a dished hole in wet ground where the boot was, ONE wash with a hard
    edge, no boot at all.

PLATE: states 1-5 at one size, plus one panel of 3 and 5 side by side so the hole is plainly that
  boot's.

NOT: no character, no vermilion, no lettering or numerals, no tread pattern, no rubber shine or
  highlight, no stroke gone over twice, no white paint, no gradient or soft edge.
```

### §2.31 SeedPacket — 2권 · 봉지 → 씨 → 구멍 → 싹

```
PROP SHEET - SeedPacket   (yuki-inkwash · SCENE token: SeedPacket)

The paper packet of seeds, the seeds themselves, the holes they go into and what comes up. Two books,
and in both of them the packet is left sitting somewhere, waiting, for pages at a time.

FORM (PACKET): a small folded paper packet, a hand wide - ONE stroke down each side, ONE fold line
  across the top, and 🔴 ITS FACE IS BARE PAPER with no writing, no picture and no seal on it.
FORM (SEED): ONE tiny dry touch, smaller than an acorn's cap.
STATES:
  1 THE PACKET HELD in one hand, closed, from the front.
  2 THE PACKET SET DOWN at the end of a ridge, alone, seen from a distance, small in the frame. 🔴 It
    must read as WAITING: nothing else is near it and it does not move between pages.
  3 THE PACKET ON A VERANDA EDGE, same size and angle as 2.
  4 SEEDS THROWN - at most 12 in the air, none overlapping, no two the same distance apart, 0 motion
    lines beneath them.
  5 SEEDS LYING ON HARD GROUND - the same 12 sitting ON the surface, not in it.
  6 TWO HOLES poked in loose earth - each ONE small hard-edged wash, with the earth raised at its rim
    in ONE stroke.
  7 FIVE SPROUTS - each ONE short wet stroke with a single tip touch, all the same height, standing
    in an even row on otherwise empty ground. 🔴 These are the most finished marks on their page and
    everything else on it is bare.

PLATE: 1-3 at one size, then 4-7. Plus one panel of a single seed beside a single sprout at the same
  scale.

NOT: no character, no vermilion, no lettering, numerals, pictures or seals on the packet, no motion
  lines, no root drawn under a sprout, no stroke gone over twice, no white paint, no gradient.
```

### §2.32 Ball — 36권 (🔴 작업표에 없다)

```
PROP SHEET - Ball   (yuki-inkwash · SCENE token: Ball)

A cloth ball thrown in the yard for a dog that will not fetch it. One book, seven pages, and the ball
is in the air, on the ground and in a palm - always the same ball.

FORM: ONE round wash at the MID step, the size of a child's two fists together, with at most 2 dry
  seam strokes curving over it - 🔴 those seams are what tell it from a stone, so they are always
  there and always the same two. 0 shine, 0 highlight, no pattern.
STATES - all at the SAME size, because the book compares them:
  1 IN THE AIR, high in a corner of the frame, alone. 🔴 0 motion lines, 0 arcs, 0 blur. Its being up
    there against empty paper is the whole of it.
  2 AT REST on bare earth at the far edge of a yard, small in the frame.
  3 ON AN OPEN PALM, held out, seen level.
  4 AT A FOOT, on the ground beside a standing figure's toes.
  5 HELD UP in both hands above a head, seen from below.

PLATE: the five states at one size, plus a close-up showing the two seam strokes and where the round
  wash runs dry.

NOT: no character, no vermilion, no lettering or numerals, no motion lines, arcs, blur or dust, no
  bounce marks, no shine, no stroke gone over twice, no white paint, no gradient, glow or soft edge.
```

### §2.33 StrawDoll — 31권 (🔴 작업표에 없다) · 진창에 반쯤 잠긴다

```
PROP SHEET - StrawDoll   (yuki-inkwash · SCENE token: StrawDoll)

A straw doll a child carries about. One book, six pages: it is dropped in the mud, left lying there,
and one of its arms turns up later on the veranda boards.

FORM: a small figure bound from straw, as long as a child's forearm - ONE wash at the PALE step for
  the body with at most 9 dry stalk strokes standing out of its edges (head bind, waist bind, two
  arms, skirt of ends). The two binds are ONE short cross stroke each. No face, no eyes, no mouth.
  🔴 IT MUST NEVER READ AS A LIVING THING: no face at all, ever.
STATES:
  1 WHOLE AND DRY, lying on plank boards from above, all its stalk ends standing.
  2 HALF SUNK IN MUD - the lower half simply NOT drawn, lost inside the ground wash, no outline where
    the two meet, and the stalk ends that show are pressed flat to one side.
  3 WET, picked up: the same doll one ink step DARKER, its stalk ends gone limp - 🔴 0 extra strokes,
    exactly the Quilt rule.
  4 SET DOWN at a pair of feet, wet, alone.
  5 THE MARK IT LEFT - two or three small mud touches on bare ground where it had lain, and no doll.
  6 ONE ARM ALONE on plank boards - a short bound bundle, its bind stroke still on it.

PLATE: the six states at one size, plus one panel of 1 and 3 side by side so the wetting reads as a
  change of step.

NOT: no character, no face or features on the doll, no vermilion, no lettering or numerals, no
  clothing or ribbon, no stroke gone over twice, no white paint, no gradient, glow or soft edge.
```

### §2.34 Swing — 09권 (🔴 작업표에 없다 · 후보엔 「가로」·「뭉치」로 부서져 있었다)

> 작업표의 09 후보 셋(`가로`·`뭉치`·`담벼락`)은 전부 이 한 물건의 부스러기다. 열 쪽 중 아홉 쪽이
> 그네를 만드는 과정이고, **가로 가지와 담벼락 못은 `Yard` 가 이미 붙박이로 들고 있다**(§1.1).

```
PROP SHEET - Swing   (yuki-inkwash · SCENE token: Swing)

A swing being made in the yard: a rope, a flat board to sit on, and a short bundle of spare cord that
keeps going missing. One book. 🔴 The BRANCH it hangs from and the NAIL in the wall are fixed by the
Yard sheet - draw them here only as they are drawn there.

FORM (ROPE): ONE long stroke, wet where it is held and dry along its fall, with at most 3 twist
  strokes near a knot and no braid drawn anywhere else. It is as thick as a child's finger.
FORM (BOARD): ONE flat wash, a hand's width by two, with ONE stroke for its edge and TWO holes at its
  ends left as small hard-edged unpainted gaps.
FORM (CORD BUNDLE): a short coil, ONE wash with at most 3 loop strokes over it, the size of a fist.
STATES:
  1 THE ROPE COILED on grass from above - a flat spiral, ONE stroke wound, the coil not overlapping
    itself more than twice.
  2 THE BOARD leaning against a wall, side on.
  3 THE ROPE WOUND SEVERAL TIMES round a trunk, its far end sagging away to the ground.
  4 THE BARE BRANCH with NOTHING on it - the answer state, and it must be the same branch at the same
    place in frame as state 5.
  5 THE FINISHED SWING - board level, two ropes from the branch, hanging still. 🔴 It does not swing:
    0 motion lines, 0 arcs.
  6 THE CORD BUNDLE in three places, same size each time: pushed into a dark gap under boards; lying
    alone inside that dark; hung on the wall nail.

PLATE: 4 and 5 side by side at the SAME size and angle (the book's before and after), then 1 2 3 6.

NOT: no character, no vermilion, no lettering or numerals, no braid or fibre texture, no motion lines
  or arcs, no stroke gone over twice, no white paint, no gradient, glow or soft edge.
```

### §2.35 Awning — 11권 (🔴 작업표에 없다) · 착지는 바닥에 앉은 네모난 그늘이다

```
PROP SHEET - Awning   (yuki-inkwash · SCENE token: Awning)

A cloth stretched on a line across the yard to make shade. One book, nine pages, and its last page is
the anchor's one permitted shadow: a square of flat wash lying on the ground.

FORM (LINE): ONE stroke crossing the whole frame. Slack, it dips and its far end sags below the wall
  top; taut, it is straight edge to edge.
FORM (CLOTH): ONE wash at the PALE step, a square about as wide as a grown fox is tall, with at most
  2 dry fold strokes and no hem, no pattern, no weave.
FORM (KNOT): ONE wet blunt touch the size of a fist with TWO short dry ends leaving it.
STATES:
  1 THE EMPTY YARD - a tree one side, a wall the other, and NOTHING between them. This is page one and
    it must be plainly empty.
  2 THE LINE WOUND round a trunk, its far end sagging to the foot of a wall.
  3 THE CLOTH DRAGGING on the ground, one corner still held, a wide skid of it on the earth.
  4 THE LINE TWISTED - the cord doubled on itself and gone thick, ONE stroke with 3 twist marks.
  5 THE KNOT being untied, half loose, the strands starting to hang.
  6 THE LINE TAUT ACROSS THE FRAME with the cloth opening over it, both halves even.
  7 THE CLOTH HUNG BADLY - all of it slid to one side, sagging, and 🔴 NO shadow at all on the ground
    beneath. The empty ground is what says it failed.
  8 🔴 THE SQUARE SHADE - a rectangle of ONE flat wash lying on the ground, its four edges ruled hard,
    0 strokes inside it, and it stops dead where a body or a hand crosses it. This is the book's
    landing and the only dark on the page.

PLATE: 7 and 8 side by side at the same size (no shade / shade), then 1-6.

NOT: no character, no vermilion, no lettering or numerals, no woven or printed pattern on the cloth,
  no soft-edged shadow, no gradient inside the shade, no stroke gone over twice, no white paint.
```

### §2.36 BathCauldron — 32권 (🔴 작업표에 없다) · 아홉 쪽이 이 솥 둘레다

```
PROP SHEET - BathCauldron   (yuki-inkwash · SCENE token: BathCauldron)

The iron bathing cauldron set at one side of the yard, the plank that floats in it, and the gourd
dipper. One book, nine of its ten pages.

FORM (CAULDRON): a wide iron pot, its mouth wider than a grown fox's arm span, standing on a low
  built base. TWO strokes for the body meeting at the base, ONE thick stroke for the rolled rim.
  Below it the firemouth is ONE dark opening with a bundle of sticks stacked in front of it. No rust,
  no rivets, no sheen.
FORM (PLANK): ONE flat board a little narrower than the mouth, ONE wash with ONE edge stroke, and it
  floats FLAT - level, dead centre, not tilted.
FORM (DIPPER): a gourd scoop with a short handle - TWO strokes and no more.
🔴 THE WATER INSIDE IS BARE PAPER, not ink: it is the warm bright thing in this book. It is read only
  by the rim stroke around it and by the plank sitting on it. Steam is the WhiteBreath sheet.
STATES:
  1 THE CAULDRON FULL AND STEAMING, three-quarter view, plank not yet on it.
  2 FROM ABOVE at a slant, the plank floating flat on the mouth.
  3 THE PLANK LIFTED at one edge, the paper water showing beside it.
  4 AT RIM HEIGHT from below, the rim ONE line across the frame and the water beyond it unpainted.
  5 THE DIPPER held above the rim, water leaving it as TWO dry strokes down - no splash, no spray.
  6 SPLASH - at most 7 unpainted drops above the rim, none overlapping.
  7 THE COOLED CAULDRON at nightfall, the same 3 strokes, no steam, the sticks at the firemouth
    stacked and unlit.

PLATE: 1 and 7 side by side at the same size, then 2-6, plus the dipper alone at large size.

NOT: no character, no vermilion, no lettering or numerals, no rivets, rust or metal sheen, no drawn
  water surface, ripple pattern or reflection, no flame, no stroke gone over twice, no white paint.
```

### §2.37 StoneTower — 37권 · 돌 셋이 서고 넷째가 기다린다

```
PROP SHEET - StoneTower   (yuki-inkwash · SCENE token: StoneTower)

The stones on the creek shingle, and the three-stone tower built from them. One book, nine pages, and
the tower must be the same tower every time it appears.

FORM: ONE stone is ONE wash laid in one pass, its shape given by where the stroke ran dry - never an
  outline, never a texture, never a facet. 🔴 THE FOUR THAT MATTER ARE FOUR SHAPES AND THEY DO NOT
  CHANGE: a FLAT BASE stone (wide, low, a hand across) · a ROUND middle stone · a SMALLER round top
  stone · a FOURTH stone chosen last, about the size of the top one.
  SHINGLE around them: ONE flat PALE wash with at most 12 near pebbles kept as separate touches at
  the front edge and nothing drawn in the rest.
STATES:
  1 TWO STONES on the shingle, a hand's span apart - one round stone come to rest away from the base
    stone. 🔴 That span is the book's measure; keep it the same in states 1 and 4.
  2 STONES SCATTERING - two flying out sideways, others behind them at rest, 0 motion lines.
  3 THE FLAT BASE ALONE, held down, seen from above with hands off it.
  4 THE BASE AND ONE ROUND STONE, the span between them the same as state 1.
  5 THE TOWER OF THREE - base, middle, top, stacked in one line, standing on shingle. The tower is a
    little taller than a child's forearm.
  6 THE TOWER OF THREE WITH THE FOURTH STONE waiting on the ground at its foot, not yet placed.
🔴 WATER beside them is BARE PAPER with TWO stroke lines for the current, exactly as the Creek sheet
  has it. Never wash the water in on this sheet.

PLATE: 5 large (the tower is the sheet's job), then 1 2 3 4 6, plus the four stones laid in a row so
  their sizes are fixed against one another.

NOT: no character, no vermilion, no lettering or numerals, no rock texture, facets or outlines, no
  motion lines or arcs, no reflection in the water, no stroke gone over twice, no white paint.
```

### §2.38 DirtDrawing — 39권 · 그림 위에 찍히는 발자국이 사건이다

```
PROP SHEET - DirtDrawing   (yuki-inkwash · SCENE token: DirtDrawing)

A picture scratched into the yard earth with a stick, and the paw print that lands on it. One book,
six pages.

FORM: the drawing is scored INTO the ground, so every line of it is ONE dry stroke, thin and broken,
  at the PALE step - 🔴 it must be plainly FAINTER than everything a brush has painted on the page,
  because it is a scratch and not an object. It is a circle about as wide as a child's arm span, with
  at most 6 spiky lines around it. Nothing else - it is not a face, not a house, not a letter.
THE PAW PRINT: ONE flat wash the size of a fist, hard edged, with THREE toe marks pushed out of its
  top edge. It is DARKER than the drawing under it, and 🔴 where it lands, the scored lines under it
  are simply gone - not crossed out, gone.
STATES:
  1 THE FIRST CIRCLE, half finished, one print already on it.
  2 NEW SCORED LINES beside it, no print yet.
  3 THE FINISHED DRAWING seen from above, whole, and ONE print in it.
  4 THE DRAWING WITH ITS EDGE SWEPT - a tail has passed and two dry leaves lie pushed to one side.
  5 A NEW CIRCLE the next day, one print in the middle of it again, and the stick laid down beside it.
  6 WHAT IS LEFT - one side of a circle only, on bare earth, two leaves.

PLATE: states 1-6 at one size and one high angle, plus a close-up of a single paw print at large size
  showing its three toes.

NOT: no character, no vermilion, no lettering, numerals or recognisable pictures in the drawing, no
  raised earth ridges beside the scored lines, no motion lines, no stroke gone over twice, no white
  paint, no gradient or soft edge.
```

### §2.39 SnowLump — 2권 (🔴 작업표에 없다) · **눈은 그리는 것이 아니라 안 칠하는 것**이다

> 이 시리즈에서 가장 어려운 시트이고 작업표에 한 줄도 없었다. 앵커는 겨울 바닥을 통째로 맨 종이로 두고
> 「그 위에 선 것만 먹으로 그린다」고 한다 — **그런데 눈사람은 눈이라 칠할 수가 없다.** 답은 한쪽 윤곽이다.

```
PROP SHEET - SnowLump   (yuki-inkwash · SCENE token: SnowLump)

Snow taken in the hands: a handful, a ball rolled along the ground, and the snowman built from it.
Two books.

🔴 SNOW IS UNPAINTED PAPER, and the winter ground is unpainted too - so a snow thing cannot be a wash
  and cannot be an outline all the way round either, or it would read as a drawn circle. IT IS READ BY
  ONE CONTOUR STROKE ON ONE SIDE ONLY: a single stroke laid along its lower-right, wet where it starts
  and running dry as it climbs, stopping before it reaches the top. The upper-left simply is the page.
  The SAME side every time, in every book.
FORM: a rolled ball is that one stroke; a handful is the same stroke made short.
STATES:
  1 A HANDFUL in two cupped hands, its contour stroke short, crumbs falling from it as at most 9
    small dry touches.
  2 A BALL ON THE GROUND, a child's-head wide, one contour stroke, with ONE short stroke behind it
    where it has been rolled - 🔴 that track stroke is the only mark on the ground, and there are no
    footprints in this state.
  3 THE SAME BALL CRUMBLING - one bite of its edge broken away, the loss shown by the contour stroke
    breaking off early, and at most 12 crumbs behind it.
  4 THE SNOWMAN - two balls, the lower a child's chest wide, the whole a head taller than a child.
    TWO contour strokes, one per ball, both on the same side. 🔴 NOTHING is added to its face: no
    eyes, no nose, no buttons, no arms, no hat. If a book wants a face, that is a separate decision
    and it is not in this sheet.
  5 A HANDFUL BROUGHT INDOORS, held in two palms in a room - here the room around it IS painted, so
    the lump keeps no contour stroke at all: it is bare paper against the dark, and that is the
    brightest thing in the room.

PLATE: states 1-5 at one size, plus one panel of state 4 beside a plain child silhouette so the
  height is fixed.

NOT: no character (a plain silhouette only, for scale), no vermilion, no lettering or numerals, no
  face, buttons, arms or hat on the snowman, no outline all the way round a snow shape, no sparkle,
  no white paint, no stroke gone over twice, no gradient, glow or soft edge.
```

### §2.40 SnowTracks — 4권 (🔴 작업표에 없다) · 겨울 쪽에서 유일한 자국

```
PROP SHEET - SnowTracks   (yuki-inkwash · SCENE token: SnowTracks)

Marks left in snow. One book is made of nothing else (19: nine pages of a yard filling with prints
and then one clean circle drawn in them), and three others need a few.

🔴 THE GROUND IS BARE PAPER, so a print is the ONLY ink on it and it is a hole, not a shape sitting on
  top: ONE small flat wash with a hard edge, 0 strokes inside, and at most 3 short strokes on the lip
  where the snow was pushed up. Never draw a whole footprint outline with a sole in it.
THREE FAMILIES, and they must be tellable apart at thumbnail size:
  A CHILD'S FOOT - a rounded wash a thumb long, in a line, evenly spaced.
  A DOG'S FOOT - a smaller wash with FOUR tiny toe marks off its top edge, in a wandering line.
  A BIRD'S FOOT - 🔴 not a wash at all but THREE THIN STROKES from one point, a fork, in pairs, tiny.
STATES:
  1 UNTOUCHED - a whole yard with NOT ONE mark on it, the wall top line and the veranda edge only.
    This is the state everything else is measured against.
  2 THREE PRINTS, fresh, family A, alone on the page.
  3 TWO TRAILS side by side, A and B, running together across the frame.
  4 A TANGLE - prints crossed and trodden into one another until no line can be followed; 🔴 draw it
    as ONE broken wash of overlapping holes with no continuous curve anywhere in it.
  5 A CLEAN CURVE - four prints of family A only, evenly spaced, bending in an unbroken arc across
    otherwise untouched ground. 🔴 States 4 and 5 must lay over each other and be plainly the same
    yard: this pair IS the book.
  6 A RING - prints of family A joined end to end into a closed circle seen from above, everything
    inside and outside it clean.
  7 BIRD PAIRS - two pairs of family C in a row, with one flattened patch beside them where a larger
    foot has pressed the snow down and rubbed most of a print away.
  8 A LOG HALF SUNK in snow with the dug hollow beside it - the hollow ONE hard-edged wash.

PLATE: 1, 4, 5, 6 in a row at the SAME size and the same high angle, then 2 3 7 8, plus the three
  print families side by side at large size.

NOT: no character, no vermilion, no lettering or numerals, no drawn sole or tread inside a print, no
  shadow inside a print, no stroke gone over twice, no white paint, no gradient, glow or soft edge.
```

### §2.41 SmallBird — 24권 · 🔴 30권의 새끼 새와 다른 새다

```
PROP SHEET - SmallBird   (yuki-inkwash · SCENE token: SmallBird)

The small birds that come down into the yard by the jars in winter. One book. 🔴 The chick in the box
(§2.6) is NOT this bird - it never stands, never opens a wing, and is a third the size.

FORM: ONE loaded stroke for the body, laid from the head down the back, its underside left as bare
  PAPER; the eye is where the ink pooled in that stroke and the beak is its wet blunt end. The tail is
  ONE short dry stroke off the back end. Legs are TWO hair-thin strokes with a three-toed fork each.
  It is the size of a fist. No feather marks anywhere.
STATES:
  1 THREE PERCHED on one branch stroke above the jars, all facing the same way, evenly spaced.
  2 ONE LANDING - feet just touching snow, wings still half open. A wing is ONE dry stroke fanning
    from the shoulder, at most 4 breaks in it. 🔴 0 motion lines.
  3 THREE SCATTERING UPWARD - three bodies at three heights, none overlapping, no two at the same
    angle, on empty paper.
  4 ONE WALKING on snow, side on, one foot forward, with its own tracks behind it (see SnowTracks
    family C).
  5 ONE ALONE, still, seen close - body stroke, pooled eye, nothing else in frame.

PLATE: the five states at one size, plus one panel of this bird beside the box chick at the same
  distance so the two are plainly two.

NOT: no character, no vermilion, no lettering or numerals, no feather detail, no beak highlight or
  eye shine, no motion lines or flight arcs, no stroke gone over twice, no white paint, no gradient.
```

### §2.42 Scarf — 🔴 이 시리즈의 유일한 색 · **벗어 놓았을 때만** 이 시트가 든다

> 목에 걸려 있는 동안은 캐스트 시트 몫이다. 그런데 다섯 권이 그것을 **물건처럼** 쓴다 — 감을 담는 보자기(21) ·
> 마루 밑으로 밀어 넣는 줄(47) · 머리맡에 풀어 놓은 자락(43·46·30). 그 상태들만 여기서 정한다.

```
PROP SHEET - Scarf   (yuki-inkwash · SCENE token: Scarf)

Yuki's scarf, off the neck. 🔴 THIS IS THE ONLY VERMILION IN THE SERIES - #C8452E, laid FLAT with 0
  strokes showing inside it, no folds drawn, no shading, no second tone. Nothing else on any page of
  any book is this colour, in any season.

FORM: a knitted band as long as a child is tall and a hand wide. Its ends are square. There is no
  fringe, no pattern, no stitch texture. Off the body it is drawn as ONE flat vermilion shape whose
  outline says what it is doing - it is never modelled and never crossed by ink strokes.
STATES:
  1 SPREAD FLAT ON THE GROUND as a cloth, corners open, seen from above - persimmons laid on it (see
    Persimmons). 🔴 The fruit sits ON it and the vermilion is not shaded under them.
  2 GATHERED BY ITS CORNERS into a bundle, the load sagging in the middle.
  3 TRAILING - one end held, the rest dragging on the ground behind, a long flat band.
  4 PULLED TAUT - stretched straight from one hand into a dark opening, drawn tight so it is a
    straight band across the frame. 🔴 The end that has gone into the dark is simply gone; do not
    draw it paler.
  5 LAID AT A PILLOW, coiled loose, NO knot in it.
  6 KNOTTED, the knot ONE small flat vermilion lump with two ends leaving it.
🔴 THE INK NEVER TOUCHES IT: no ink outline round the scarf, no ink fold lines on it. Where something
  in front crosses it, that thing is drawn and the vermilion simply stops.

PLATE: the six states at one size on bare paper, plus one panel with the scarf against the darkest
  ink wash in the series so the one colour is fixed against the one ink.

NOT: no character, no lettering or numerals, no fringe, tassel or knit pattern, no second red or
  pink, no shading, gradient or highlight anywhere on it, no ink outline round it, no white paint.
```

---

### §2.43 WhiteBreath — 6권 · 🔴 입김과 김은 **같은 물건**이다

> 47 은 열 쪽 중 넉 쪽이 입김이고(그 권의 전부다), 20·32·38·48 은 김이다. 이 매체에서 둘은 똑같이
> **안 칠한 자리**이고, 다른 것은 그것이 무엇 위에 있느냐뿐이다 — 그래서 한 장이다.

```
PROP SHEET - WhiteBreath   (yuki-inkwash · SCENE token: WhiteBreath)

Breath in cold air, and steam off hot food and hot water. Six books. In this world they are the same
thing drawn the same way.

🔴 IT IS AN AREA LEFT UNPAINTED, never a painted shape and never white paint. It therefore CANNOT be
  seen against bare paper - it exists ONLY where something has been washed in behind it. That is the
  whole rule of this sheet: 🔴 IF YOU WANT BREATH, YOU MUST FIRST HAVE A DARK BEHIND IT.
  Its edge is hard where the wash stops, and it has 0 strokes inside it - no swirl, no curl, no
  outline, no dots.
THE DARK BEHIND IT, in the six books, is one of exactly three: the flat wash of an EAVE SHADOW · the
  DARK STEP inside a room at night · an open doorway that is one mass of ink.
STATES:
  1 A BIG BREATH - a cloud in front of a mouth, wider than a head, its far end frayed where the wash
    behind it grows thin. Against an eave shadow.
  2 A SMALL BREATH - the same shape a quarter the size, same place, so a page can say "less this
    time". 🔴 States 1 and 2 must be drawn at the same distance; the book compares them.
  3 A LONG DRIFT - the unpainted area drawn out sideways across the shadow until its far end is lost
    where the shadow ends.
  4 ONE THREAD OF STEAM - a narrow unpainted line rising from a bowl or a piece of food, no wider
    than a finger, thinning to nothing. At most ONE per vessel, TWO if a thing has been broken in two
    and each half gets one.
  5 STEAM OVER A CAULDRON MOUTH - a low unpainted band lying along the rim, wider than tall.
  6 BREATH INDOORS at night - the smallest of all, right at a nose, and it is the only unpainted
    thing on that page apart from the fire.

PLATE: states 1 and 2 side by side at one distance, then 3-6, plus one panel showing the SAME breath
  drawn (a) against a shadow, where it reads, and (b) against bare paper, where it disappears - so
  the rule is on the sheet itself.

NOT: no character, no vermilion, no lettering or numerals, no outlined cloud, no swirls, curls,
  wisps or dots, no white paint anywhere, no stroke inside the unpainted area, no gradient or soft
  edge.
```

---

### §2.44 LowTable — 4권 · 🔴 **한 글자 낱말이라 작업표가 원리상 못 잡았다**

> 「상」이 한 글자라 추출기 후보에 한 줄도 없다. 그런데 **26권은 이 상 위에서만 벌어지고**(4~5쪽),
> 그 권의 시계는 **나물 그릇이 상 모서리에 반쯤 걸쳐 있다가 한가운데로 돌아오는 것**이다 —
> 모서리가 어디인지 시트가 정해 놓지 않으면 그 비교가 쪽마다 무너진다.

```
PROP SHEET - LowTable   (yuki-inkwash · SCENE token: LowTable)

The low meal table of the house, carried out and set down wherever the family eats. Four books put
food on it and one of them is about a bowl sitting half off its edge.

FORM: a small rectangular table on four short legs, low enough to sit at on the floor - its top comes
  to a child's waist when the child stands. ONE stroke for the top's near edge, ONE for its far edge,
  and TWO short strokes for the near legs; the far legs are not drawn. 🔴 The top is BARE PAPER, not a
  wash - it is what the bowls are read against, and it is the second brightest thing in a room after
  the fire. At most 2 dry grain strokes along its length, no more.
🔴 THE EDGE IS THE MEASURE. Draw the near edge as a straight unbroken stroke and keep it in the same
  place in frame across states 1-3, because one book compares them page by page.
STATES - drawn from the SAME high slant at the SAME size:
  1 SET, four vessels on it in their fixed order (see Bowls), all well inside the edge.
  2 THE SAME, ONE vessel pushed until it is HALF OVER the near edge - its foot past the stroke, the
    paper of the floor under it. 🔴 The overhang must be readable at thumbnail size.
  3 THE SAME, that vessel back in the middle and the edge clear. The answer state; nothing else
    changed.
  4 CLEARED - the bare top, its two edge strokes and legs, and ONE pair of chopsticks laid straight
    along it (ONE stroke each, parallel, touching).
  5 A BRANCH LAID ACROSS IT (see BlossomBranch state 5) with two rice bowls - the branch is the only
    wet thing on the table.
  6 FROM THE FLOOR at table height, so the near edge is a line across the frame and only what stands
    on the top shows above it.

PLATE: states 1, 2, 3 in a row at one size (the book's whole comparison), then 4 5 6.

NOT: no character, no vermilion, no lettering or numerals, no carving, inlay or drawn woodgrain
  beyond the 2 strokes, no cloth on the table, no cast shadow under it, no stroke gone over twice,
  no white paint, no gradient or soft edge.
```

### §2.45 Towel — 4권 · 🔴 **주홍이 아닌 천**을 못 박아 두는 시트다

> 27·32·35·13 이 한두 쪽씩 수건을 쓴다 — 권마다 문턱을 못 넘어 작업표에 없다(막대와 같은 종류의 누락).
> 시트가 없으면 **어깨에 두른 천이 목도리로 읽힌다.** 이 시리즈에서 그건 팔레트가 깨지는 것이다.

```
PROP SHEET - Towel   (yuki-inkwash · SCENE token: Towel)

A plain cloth towel. Four books use one - beside a wash basin, over a lap, wrapped round a child
after a bath.

FORM: a rectangle about as long as a child's arm, ONE wash at the PALE step, at most 2 dry fold
  strokes and NO hem, pattern, stripe or fringe. Its edge is where the wash ran dry.
🔴 IT IS NEVER VERMILION AND IT IS NEVER MISTAKEN FOR THE SCARF. Draw it once beside the scarf on
  this sheet: the towel is PALE INK and wider; the scarf is flat vermilion and a narrow band. Where a
  book wraps a child in a towel, the scarf is either off (lying nearby) or plainly on top of it.
STATES:
  1 FOLDED, lying beside a basin on the ground, from above.
  2 OVER A LAP, spread flat, seen from the side.
  3 HANGING from a hand, one corner down, its lower edge dry-broken.
  4 WRAPPED round a small standing figure from the shoulders down - ONE wash following the body, no
    drawn folds, the head clear of it.
  5 DAMP - the same wash one step darker, its hanging edge pulled straight instead of dry-broken
    (exactly the Quilt rule).

PLATE: the five states at one size, plus 🔴 one panel of the towel and the scarf side by side, so the
  one colour of this series is fixed against the cloth that is not it.

NOT: no character face, no vermilion on the towel, no lettering or numerals, no hem, fringe, stripe
  or woven pattern, no drawn folds, no stroke gone over twice, no white paint, no gradient.
```

---

## §3. 🔴 미결 — 「나무 밑」 4갈래 (3권 · SCENE 이 어느 나무인지 안 정했다)

> 🔴 **이 §3 은 판정 근거만 적는다. 이름→토큰 변환의 SSOT 는 `_stage-tokens.json` 이다.**
> 표 출력·검사 = `node packages/client/scripts/extract-series-stages.mjs --tokens yuki` (**미매칭 0** 이어야 한다).
> 🔴 **쪽 목록은 폐기했다** — 목록과 변환표를 따로 두니 어긋났다(변환표엔 있는데 목록엔 없는 이름이 나왔다).
> 규칙이 전 이름을 덮으므로 목록이 필요 없고, 「목록 밖이라 안 붙인다」가 생기지 않는다.
> 🔴 **SPOT**: `_stage-tokens.json` 의 `spots` 가 `null` 인 시트는 **시트명만** 붙인다. 값이 있는 시트도
> **A/B/C/D 는 카메라가 정하므로 경로표(§4)에서 정한다** — §3 에서 비워 둔 건 빈칸이 아니라 경로표 몫이다.
> 🔴 **일부 이름은 권을 알아야 정해진다**(`byBook`). 앞 쪽을 읽어야 하는 종류이고, 규칙 파일이 그걸 들고 있다.


`_stages.json` 이 `unresolved: ['마당 나무 밑','산길 나무 밑','집 뒤 눈 덮인 나무 밑','언덕길 나무 밑']`
로 표시한 자리다. 판정:

| SCENE 의 「나무 밑」 | 결정 | 근거 |
|---|---|---|
| 13 (감) | `Yard` / SPOT C | 13 p1 이 「**마당** 감나무 밑」이라 스스로 말한다 |
| 14 (도토리) | `MountainPath` | 14 p4 「**산길** 나무 밑」 |
| 15 (밤) | `ChestnutGrove` | 15 p1 「**밤**나무 밑」 |
| 23 (장작) | `BackOfHouse` | 23 p1 「**집 뒤** 눈 덮인 나무 밑」 |

⚠️ 넷 다 **그 권 안 다른 쪽이 답을 갖고 있었다.** 미결은 「정보가 없다」가 아니라 **「한 권 안에서 이름이
흔들린다」**였다 — 첫 쪽엔 「밤나무 밑」이라 쓰고 다음 쪽부터 「나무 밑」으로 줄여 부른다. → §5 판단 참조.

---

## §4. 권별 경로표

🔴 **권별 경로표는 [`yuki-routes.md`](yuki-routes.md) 로 옮겼다**(**50권 500쪽** · 23권 견본과 그 두
주석도 거기 있다). 같은 표를 두 곳에 두면 반드시 갈라지므로 여기엔 다시 적지 않는다.
