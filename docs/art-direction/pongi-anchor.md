# 퐁이네 운하 마을 — 앵커 넷 + 캐스트 시트

> 창작동화 **시리즈 01** (25권 · 250쪽). 대본 SSOT = `docs/changjak-books/pongi/*.md` ·
> SCENE = `_scenes.json` · 회차 HTML = `packages/client/public/pongi-{01..25}.html`
> 🔴 **이미지 생성은 여기서 하지 않는다.** 프롬프트까지가 이 문서의 일이다.

---

## §0. 설계

### 앵커를 넷 만든다

이 라인의 정체성이 **그림체가 권마다 다른 것**이다. 시리즈를 도입하면서 캐스트·무대·스타일을 고정했는데
거기에 그림체까지 묶으면 **1000권의 그림체가 40종으로 줄어** 라인이 사라진다. 라인 정책도 **앵커당
6~10권 상한**이라 25권에 하나는 두 배 초과다.

```
시리즈가 고정   캐스트 5인 · 무대(운하 마을) · 스타일(페파형) · 캐릭터 규격 · 종이
묶음마다 변주   잉크 두 도(度) — 그래서 겹침이 만드는 셋째 색이 묶음마다 다르다
```

### 🔴 네 앵커를 잇는 것 = 2도 인쇄 논리

수상작 99점에서 유럽 그림책의 인장은 **평면 자체가 아니라 인쇄 공정의 손자국**이었다 —
활자가 눌린 자국이 형태를 만들고, 잉크 두 판이 겹친 데서 셋째 색이 생기고, 잉크가 고르지 않게 앉고,
칼자국이 남는다. 그리고 **색이 정확히 2~3도**다.

그래서 넷 다 이 골격을 쓴다.

```
종이         CREAM #F6F4EE — 인쇄되지 않은 자리는 전부 이 색이다(칠하는 것이 아니라 비우는 것)
잉크 1·2     묶음마다 다르다
겹침         두 잉크가 겹친 자리에 자동으로 생기는 셋째 색 — 화면에서 가장 어둡다
악센트       CORD RED #A8442F — 마지막에 한 판 더 찍는다. 퐁이 목끈에만
```

🔴 **수달의 등이 겹침 색이다.** 두 잉크가 만나 생기는 가장 어두운 자리가 주인공 몸이라, 묶음이 바뀌면
퐁이의 색도 조금씩 달라진다 — 그런데 **비례·소품·얼굴 규격이 같아서** 같은 아이로 읽힌다. 이게
「매체는 바뀌고 누구인지는 안 바뀐다」를 색으로 구현한 것이다.

### 🔴 a45 재사용을 폐기한 경위

처음엔 `changjak-flatplate`(a45)를 물려받으려 했다. 무대가 네덜란드 제방이고 팔레트가 물·흙이라
맞아 보였는데, 앵커 본문을 열어 보니 셋이 어긋났다.

| | a45 | 이 시리즈 |
|---|---|---|
| 팔레트 | 수달 `#6B5A48` 등 일곱 색 | 내가 `_ANCHORS.md` **요약표의 대표색 넷**을 인물 배색으로 착각했다 |
| 의인화 | `four-legged otter, no clothes` | 두 발로 서고 옷을 입는다 |
| 🔴 연기 | 「눈은 아몬드 하나, **표정 없음**, 연기는 전신 실루엣」 | **페파형은 웃음이 얼굴에 있다** |

셋째가 결정적이다. 🔴 **그림체가 이야기를 제약하면 고를 것을 잘못 고른 것이다.**

---

## §1. 묶음 배분

| 묶음 | 앵커 | 권 | 공정 | 잉크 두 도 | 겹침 |
|---|---|---|---|---|---|
| **A** 물 위 | `pongi-screenwater` | 02 · 07 · 09 · 12 · 17 · 24 | 실크스크린 | 운하 초록 + 흙 | 짙은 솔잎 |
| **B** 집 안 | `pongi-presshome` | 04 · 05 · 08 · 11 · 16 · 22 · 23 | 활판 | 흙 + 이끼 | 진갈 |
| **C** 마당·길 | `pongi-risosky` | 01 · 03 · 06 · 10 · 20 · 21 | 리소 | 청회 + 흙 | 먹청 |
| **D** 마을 | `pongi-cutvillage` | 13 · 14 · 15 · 18 · 19 · 25 | 리노컷 | 이끼 + 벽돌 | 검정 |

각 6~7권으로 정책 상한 안이다.

**관통 줄** (전 묶음 공통, 3개)

```
CORD:  the red plate is printed last and touches nothing but Pongi's neck cord
WHO:   Pongi is the smallest standing figure unless she is alone on the page
FACE:  the joke is on a face - never let an object cross a face
```

---

## §2. 앵커 A — `pongi-screenwater` (물 위 · 6권)

```
STYLE ANCHOR - pongi-screenwater   (an otter family on a Dutch canal / two screens and the paper)

Style: silkscreen, exactly TWO ink screens on cream paper, 4-6 year old picture book. Each screen
  is one flat opaque colour pulled in one pass. Where the two overlap a third, darker colour
  appears - that is the only way a dark exists. Unprinted paper is not white space, it is the sky
  and the light. SHADING IS ZERO - no modelling, no gradient, no cast shadow, no highlight.

RENDERING (finish hierarchy): water is ONE unbroken pull of INK1, never lighter or darker inside
  itself, 0 ripples, 0 glints. A thing in the water is INK1+INK2 overlap lying inside that pull -
  hard edge, no distortion, never mirrored or flipped. A thing on the water sits on top with its
  whole outline showing. Ice is the same area left as PAPER instead of pulled. FINISHED THINGS PER
  PAGE = 2, Pongi and the one thing she touches. Far bank = at most 5 silhouettes in INK2, 0
  windows. Reeds = at most 7 strokes. Boat seams = at most 4 lines. Stars = at most 14 separate
  paper holes, each cut on its own, never a mirrored copy of the sky. Registration is one hair off
  on every page - the screens do not line up perfectly and that misfit is visible at 2 or 3 edges.
  DENSITY RATION = none.

PALETTE: PAPER CREAM #F6F4EE, sky, ice, light, everything not pulled · INK1 CANAL #2C4A3C, water ·
  INK2 EARTH #8C7C68, wood, boats, chests, rope, banks · OVERLAP PINE #21372E, otter backs, night,
  anything submerged - this colour is never mixed, only overprinted · RED PLATE #A8442F, 🔴 a third
  pull touching nothing but Pongi's neck cord. No sky blue, no purple, no pink.

CHARACTER DESIGN LANGUAGE: 🔴 SHARED BY ALL FOUR ANCHORS - reproduce word for word, do not vary.
  Animals are built from the same flat pulls as the world - two or three shapes with limbs laid
  over. GRADE: bipedal, standing upright, wearing cloth. The back and head are the OVERLAP colour,
  the chest and belly are INK2, so every animal is built the same way in every anchor. Eyes are two
  solid dark dots set wide apart; a small dark nose; the mouth is ONE curve. 🔴 THE JOKE IS CARRIED
  BY THE FACE - the mouth curve and the eye spacing change page to page and are never crossed by an
  object. Whole-body posture carries the rest. Silhouettes separate at thumbnail size: Pongi is the
  smallest standing figure, the goose is the tallest and thinnest.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow or 3D render / no soft or feathered edge / no ripple, glint or
  sparkle on water / no third mixed colour that is not an overprint.
```

---

## §3. 앵커 B — `pongi-presshome` (집 안 · 7권)

```
STYLE ANCHOR - pongi-presshome   (an otter family indoors / letterpress, the bite of the type)

Style: letterpress on soft cream paper, exactly TWO inks, 4-6 year old picture book. Every shape is
  a block inked and pressed into the sheet, so the ink sits heaviest at the edge of each shape and
  the paper is visibly dented where a block bit. Where the two blocks overlap a third, darker colour
  appears. SHADING IS ZERO - the only variation is the uneven bite of the press.

RENDERING (finish hierarchy): rooms are built from repeated blocks - floor = one plank block
  repeated, wall = one dot block repeated, cloth = one stripe block repeated. The block is the SAME
  shape every time; it may run off an edge but is never redrawn. Clutter is made by REPEAT, not by
  variety: shelves = at most 3 blocks repeated, jars = at most 6 of one shape, crumbs = at most 9
  dots. 🔴 A THING BEING SEARCHED FOR IS CUT AS ITS OWN BLOCK while everything it hides among is
  the repeated one - that is how the eye finds it. Steam = at most 5 curls. FINISHED THINGS PER
  PAGE = 2. Ink coverage is 90 percent, never solid - the paper shows through inside every shape.
  DENSITY RATION = none.

PALETTE: PAPER CREAM #F6F4EE, plaster, linen, light · INK1 EARTH #8C7C68, floors, furniture, wood ·
  INK2 MOSS #4C5B4A, cloth, shutters, painted things · OVERLAP BARK #3B3A2E, otter backs, iron,
  night windows - overprint only, never mixed · RED PLATE #A8442F, 🔴 nothing but Pongi's neck cord.
  🔴 EXCEPTION - volume 10 only, pages 6 to 10: the washing is printed in a half-strength pull of
  the RED PLATE, giving PALE PINK, and Pongi's cord stays at full strength beside it.

CHARACTER DESIGN LANGUAGE: 🔴 identical to anchor A, word for word.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow or 3D render / no soft or feathered edge / no varied hand-drawn
  clutter behind the figures / no solid unbroken ink.
```

⚠️ 분홍 예외 = **10권 「빨래 너는 날」 p6~p10**. 규칙이 깨지는 것이 그 권의 웃음이므로 의도된 것이다.
🔴 **분홍을 새 색으로 만들지 않고 붉은 판을 반만 찍어 만든다** — 그래야 「퐁이 색이 빨래에 옮았다」가
그림의 논리로 읽힌다.

---

## §4. 앵커 C — `pongi-risosky` (마당·길 · 6권)

```
STYLE ANCHOR - pongi-risosky   (an otter family outdoors / riso, ink laid unevenly)

Style: risograph, exactly TWO ink drums on cream paper, 4-6 year old picture book. Ink lies
  unevenly - each pull is slightly mottled, streaked in the direction the drum turned, and no area
  is perfectly solid. The whole sky and ground of a volume is one pull running the SAME direction
  on every page: down for rain, sideways for wind, flat for fog. Figures are separate flat pulls
  laid over it. SHADING IS ZERO inside any figure.

RENDERING (finish hierarchy): the weather lives in the streak direction of INK1 and nothing else -
  it has no edge of its own and simply stops where the paper takes over. Rain = at most 11 straight
  strokes running with the streak. Fog = INK1 at its lightest pass with 0 shapes behind it; things
  enter by appearing at full strength, never by fading. Mud = ONE flat INK2 area with a crisp edge
  against unprinted ground. Wind = every loose thing tilts the same way, at most 7 things.
  Registration is one hair off on every page and that misfit shows at 2 or 3 edges. FINISHED THINGS
  PER PAGE = 2. Far houses = at most 4 silhouettes. DENSITY RATION = none.

PALETTE: PAPER CREAM #F6F4EE, fog at its palest, light, unprinted ground · INK1 SLATE #6E7A75, sky,
  weather, wet stone · INK2 EARTH #8C7C68, mud, wood, banks · OVERLAP INKWELL #2E3A3C, otter backs,
  soaked things, the darkest thing on any page - overprint only · RED PLATE #A8442F, 🔴 nothing but
  Pongi's neck cord.

CHARACTER DESIGN LANGUAGE: 🔴 identical to anchor A, word for word.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow or 3D render / no soft edge on a figure / no streak inside a
  figure / no perfectly solid area anywhere.
```

---

## §5. 앵커 D — `pongi-cutvillage` (마을 · 6권)

```
STYLE ANCHOR - pongi-cutvillage   (an otter family in the village / linocut, the knife makes form)

Style: linocut printed in exactly TWO inks on cream paper, 4-6 year old picture book. Form is made
  by what the knife took away - every edge is a cut edge, slightly ragged, and the gouge marks that
  clear an area stay visible as parallel furrows. Where the two blocks overlap a third, darker
  colour appears. SHADING IS ZERO - no modelling, no gradient, no cast shadow.

RENDERING (finish hierarchy): a cleared area is not blank, it carries the parallel gouge furrows of
  the tool that cleared it, at most 9 furrows per area, all running one way within that area.
  Buildings are INK1 blocks; ground and cloth are INK2; figures are the overlap. Crowds are ONE
  block silhouette with 0 interior marks, at most 9 figures. Windows = at most 6 rectangles per
  building, 0 frames. Shelves of books = one block of at most 5 stripes. FINISHED THINGS PER PAGE =
  2. The knife slips once per spread and that slip is left in. DENSITY RATION = none.

PALETTE: PAPER CREAM #F6F4EE, sky, light, everything not cut · INK1 MOSS #4C5B4A, buildings,
  shutters, awnings · INK2 CLAY #9E7A5E, ground, brick, baskets, wood · OVERLAP CHARCOAL #2B2A26,
  otter backs, iron, doorways - overprint only, never mixed · RED PLATE #A8442F, 🔴 printed last,
  touching nothing but Pongi's neck cord.

CHARACTER DESIGN LANGUAGE: 🔴 identical to anchor A, word for word.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow or 3D render / no soft or feathered edge / no ink outside a cut
  block / no smooth mechanical edge.
```

---

## §6. 캐스트 시트 5인 — @image1~5

🔴 **순서 고정.** `pongi-core.js` 가 이 순서로 `[등장]` 을 붙인다.
🔴 **시트는 앵커 A(`pongi-screenwater`)로 굽는다.** 넷 중 잉크가 가장 깨끗해 규격이 또렷하게 나오고,
나머지 셋은 그 시트를 레퍼런스로 **매체만 갈아입힌다**(비례·소품·얼굴은 한 획도 안 바꾼다).

| @ | 누구 | 늘 같은 것 | 나오는 권 |
|---|---|---|---|
| 1 | **퐁이** | 🔴 목에 두른 붉은 끈 하나 | 25권 전부 |
| 2 | **아빠** | 흙색 헐렁한 멜빵바지 | 20권 |
| 3 | **엄마** | 짙은 초록 머릿수건 | 04 · 06 · 10 · 13 · 16 · 22 · 23 |
| 4 | **동생** | 두 앞발로 안은 조개 하나 | 02 · 03 · 04 · 05 · 07 · 09 · 17 · 23 |
| 5 | **거위 할아버지** | 흙색 고무장화 | 08 · 10 · 11 · 14 · 21 · 25 |

🔴 **소품이 곧 정체다.** 05권 착지(조개가 처음부터 손에 있었다)와 09권 착지(양동이를 놓고 조개를 다시
쥔다)가 그 소품 하나에 걸려 있다.

### 🔴 아기 비례 — 프롬프트로 세 번 실패했다

`child` 한 낱말로도, **「머리가 몸에 비해 크고 · 팔다리가 짧고 뭉툭하고 · 어른의 절반 키」**로 수치를
적어도 성체가 나왔다. 모델이 학습한 수달 형태가 지시보다 강하다. **레퍼런스 한 장이 필요하고, 같은
경로로 인쇄 질감도 해결된다**(프롬프트만으로는 가장자리에 털 질감이 남고 잉크 자국이 안 나왔다).

시도 기록 = `pongi-sheets/`. 2차에서 **붉은 끈·얼굴·종족 규격은 통과**했으므로 레퍼런스가 생기면
그 프롬프트에 위 앵커 A의 `Style` 문단만 얹으면 된다.

---

## §7. 그리는 순서

```
① 퐁이 시트 확정        앵커 A 로. 레퍼런스 필요 — 여기서 막혀 있다
② 나머지 4인            퐁이를 ref 로
③ 01권 p1              다섯 규격이 한 화면에서 맞는지 보는 기준판
④ 묶음별 첫 쪽 4장      A 02p1 · B 04p1 · C 01p1 · D 13p1 — 매체 넷을 나란히 보고 확정
⑤ 나머지 246쪽
```

🔴 **③을 건너뛰지 않는다.** 시트 다섯 장이 각각 맞아도 한 화면에 모이면 크기 관계가 틀어진다 —
어른과 아이, 수달과 거위의 키 차이는 시트로는 안 정해지고 **한 장에 같이 세워야** 정해진다.

🔴 **④도 건너뛰지 않는다.** 매체가 넷이라 **같은 시리즈로 안 보일 위험**이 여기서만 드러난다.
안 맞으면 잉크를 좁혀서 맞춘다 — 종이·붉은 판·캐릭터 규격은 이미 같으므로 흔들 것은 잉크 두 도뿐이다.
