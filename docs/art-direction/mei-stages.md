# 메이네 산마을 — 무대·사물 시트

> art-director 산출물 (2026-08-16). 시리즈 02 `mei-pencilslope` · 25권 250쪽.
> 🔴 앵커 SSOT = `mei-anchor.md`. 후보 = `_stages.json`(자리 13 · 사물 39항목 / 고유 34) · 대본 = `_scenes.json`
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

## §1. 자리 시트 — 5장 (후보 13에서 접음)

| 시트 | = 후보 | 왜 하나인가 |
|---|---|---|
| `Piazza` | 마을 광장 · 광장 · 무대 위와 광장 · 계단 · 무대 옆 계단 · 계단 첫 칸 · 화덕 앞 | 광장에 무대·계단·화덕이 다 있다 |
| `Slope` | 비탈 풀밭 · 비탈 · 마을 뒤 비탈 | 🔴 **썰매 다섯이 좌표** |
| `Chalet` | 산장 부엌 · 산장 문간 · 탁자 앞 | |
| `Seats` | 메이 자리 · 루디 자리 · 소소 자리 | 🔴 **자리가 아니라 「누구의 자리인가」** · §3 |
| `Slide` | 미끄럼틀 계단 앞 · 계단 앞 | 15권 |

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
  A SINGLE TREE part-way down, trunk CROSS-HATCH, one outline.
  🔴 NOTHING ELSE GETS AN OUTLINE. If a shape needs separating from the slope and it is not on this
  list, separate it by changing the stroke direction, not by drawing round it.

TRACKS: a sled track on snow is where the bare paper is left AND the strokes either side run with
  it - never a drawn pair of lines. Before anyone slides, the slope carries no track at all, and
  that emptiness is the first page of one book.

SPOTS:
  A THE WHOLE SLOPE from below, wide: fence across the bottom, tree part-way, peaks above.
  B IN THE LINE, medium, from behind: backs and sledges running away up the slope.
  C THE SNOW, close, high: bare paper and one outlined thing on it.
  D FROM THE TOP looking down, wide: the fall of the slope and the fence far below.

PLATE: A, B, C, D once each, plus 🔴 A FIELD-OR-THING DIAGRAM - the slope drawn as flat areas, each
  marked FIELD (arrow for stroke direction) or THING (outlined) - plus the five sledges in a row by
  length.

NOT: no character of any kind, no accent orange anywhere on this sheet, no lettering or numerals,
  no outline on a field, no blending or smudging, no third pencil, no white pencil, no shading,
  gradient, glow, cast shadow or soft edge, nothing paler with distance.
```

### §1.2 Piazza — 요약 명세

`FIELDS` = 돌바닥(🔴 **EARTH 반복 마크 하나**, 03·06권이 그 바닥을 센다) · 벽 · 하늘(맨 종이).
`THINGS` = 무대 널빤지(최대 6) · 계단 난간 · 분수 · 화덕 · 탁자 · 🔴 **종탑**(신설 — 17권이 **10쪽 전부**
그 밑인데 §1.2 에 탑도 종도 줄도 없었다: 벽은 FIELD(EARTH 세로), **탑 몸통·종·당김줄은 THINGS 라 윤곽 한 줄씩**,
종은 하나뿐이고 줄은 바닥까지 닿는다).
`SPOTS` = A 광장 전체 / B 무대 앞 / C 계단 / D 화덕 / 🔴 **E 종탑 밑**(올려다보는 로우앵글, 줄이 화면 세로를 지른다).

---

## §2. 사물 시트 — 26장 (고유 34에서 노이즈 8 제외)

| 토큰 | 사물 | 권·쪽 | 비고 |
|---|---|---|---|
| `Sledges` | 썰매 다섯 | 01(8) · 13(8) | 🔴 무대와 겸함 · 길이로 구분 |
| `Slide` | 미끄럼틀 · 계단 | 15 (7·7) · 10(5) | 2권 공유 |
| `Cheese` | 치즈 · 보자기 | 07 (7·5) | |
| `Paper` | 종이 · 깃발 | 14(8) · 23(5·3) | 2권 공유 |
| `Stakes` | 말뚝 · 울타리 · 망치 | 24 (6·4·3) | |
| `Pot` | 냄비 · 뚜껑 | 22 (4·5) | |
| `Logs` | 통나무 | 19 (5쪽) | |
| `Quilt` | 이불 | 25 (6쪽) | |
| … | (나머지 18장) | | |

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

PLATE: the four states, plus the five-in-a-row measuring strip.

NOT: no character, no hands, no accent orange, no lettering or numerals, no outline on the snow or
  the slope around it, no blending, no third pencil, no white pencil, no motion streaks, no
  shading, gradient or glow.
```

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

**🔴 미결 쪽 목록** (3쪽) `광장` = 03 p6 · 03 p9 · 17 p6

---

## §4. 권별 경로표 — 견본 (01 「썰매 줄」)

| 쪽 | 자리 | SPOT | 🔴 썰매 | 이어짐 |
|---|---|---|---|---|
| p1 | `Slope` | A | 다섯 전부 | 🔴 **자국이 하나도 없다** = 맨 종이 |
| p2 | `Slope` | B 줄 맨 뒤 | 앞쪽 등 넷 | |
| p3 | `Slope` | B | 둘 | 「곧은 줄에 딱 한 군데 튀어나온 자리」 |
| … | | | | 자국이 늘어난다 |

🔴 **p1 의 「자국이 아직 하나도 없다」가 이 권의 첫 문장이고, 그건 그리는 게 아니라 안 그리는 것**이다.
§1.1 의 `TRACKS` 절이 그걸 받는다 — 자국을 **선 두 줄로 그리면** 이 매체에서 그건 「면 위에 놓인 것」이
되어 썰매와 같은 급이 된다.
