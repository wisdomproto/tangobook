# 퐁이네 운하 마을 — 앵커 + 캐스트 시트

> 🔴 **2026-08-13 뒤집힘: 한 시리즈 = 한 그림체.** 사용자 — 「원래 각 권마다 다르게 하려던 걸 한 시리즈로
> 완화한 거지. 한 시리즈는 같은 캐릭터, 같은 그림체로.」 이 시리즈는 **앵커 A(실크스크린) 전권**이고,
> 무대(집 안·마당·마을)는 `pongi-core.js` 의 무대 조항이 처리한다. 아래 §1 묶음 배분표와 앵커 B(활판)·
> C(리소)·D(리노컷)는 **폐기가 아니라 보류** — 다른 시리즈에서 캐스트·무대를 갈아 끼워 쓴다(그때 슬러그의
> `pongi-` 를 그 시리즈 이름으로 바꿀 것). 「권마다 다른 그림체」는 단권 완결 시절 규칙이고, 시리즈 체제에서는
> **변주 단위가 권이 아니라 시리즈**다 — 호리 3라인·전래동화가 전부 라인당 1그림체인 실적과도 맞는다.

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

🔴 **2026-09-04 수리 셋.** ①`Reeds = at most 7 strokes` 가 **41권을 못 그리게** 했다(갈대가 아이 하나를
가려야 하는데 7획으로는 못 가린다). 상한을 올리지 않고 **가까운 갈대(세는 것) / 갈대밭(한 덩이)**로 갈랐다
— 값은 `pongi-stages.md` §2.18 `Reeds` 가 든다. ②관통 줄 `WHO: Pongi is the smallest standing figure` 가
**104쪽·26권에서 거짓**이었다 — `Baby otter` 가 퐁이보다 작다(`pongi-cast.md`). 매 쪽에 붙는 줄이
거짓이면 화가가 그 26권에서 **아기를 퐁이 크기로 그리거나 퐁이를 아기 자리에 놓는다**.
③🔴 **앵커가 스스로 잉크 수를 두 번 다르게 말했다** — 앵커 A 의 `exactly TWO ink screens` 인데 같은
`PALETTE` 가 `RED PLATE … a third pull` 을 든다(§0 도 「마지막에 한 판 더 찍는다」라고 이미 적어 뒀다).
Style 줄이 **두 판 + 붉은 판**을 세게 고쳤다. bami 와 같은 모양의 모순이다.
⚠️ **`CORD:` 와 `FACE:` 는 그대로 뒀다** — 세어 보고 어긋난 자리가 없다.
④**상상 쪽 조항이 아예 없었다** — 27 p5(화면 전체가 입속) · 30 p6(화면 전체가 배 속)은 무대가 없는
쪽인데 앵커가 그걸 어떻게 갈라 그리는지 한 줄도 안 갖고 있었다(dodo 에서 같은 구멍이 나왔다).
이 매체엔 흐림도 테두리도 없으므로 **「무대를 안 찍는다」**로 갈랐다.

**관통 줄** (전 묶음 공통, 3개)

```
CORD:  the red plate is printed last and touches nothing but Pongi's neck cord
WHO:   the cord finds Pongi - she is the smallest of the ones who go out, and the only figure
       smaller than her is the baby, who is rounder, shorter-limbed and always holding one shell
FACE:  the joke is on a face - never let an object cross a face
```

---

## §2. 앵커 A — `pongi-screenwater` (물 위 · 6권)

```
STYLE ANCHOR - pongi-screenwater   (an otter family on a Dutch canal / two screens and the paper)

Style: silkscreen, TWO ink screens that print the world plus ONE red plate that touches nothing but
  Pongi's neck cord, on cream paper, 4-6 year old picture book. Each screen
  is one flat opaque colour pulled in one pass. Where the two overlap a third, darker colour
  appears - that is the only way a dark exists. Unprinted paper is not white space, it is the sky
  and the light. SHADING IS ZERO - no modelling, no gradient, no cast shadow, no highlight.

RENDERING (finish hierarchy): water is ONE unbroken pull of INK1, never lighter or darker inside
  itself, 0 ripples, 0 glints. A thing in the water is INK1+INK2 overlap lying inside that pull -
  hard edge, no distortion, never mirrored or flipped. A thing on the water sits on top with its
  whole outline showing. Ice is the same area left as PAPER instead of pulled. FINISHED THINGS PER
  PAGE = 2, Pongi and the one thing she touches. Far bank = at most 5 silhouettes in INK2, 0
  windows. 🔴 Reeds come in two kinds and are never mixed in one clump: NEAR REEDS = at most 7
  separate INK2 strokes, and that cap is on reeds drawn one by one; A REED BED is ONE flat INK2 mass
  with a ragged top, uncounted, tall enough to hide a standing child, opaque - nothing shows faintly
  through it. Boat seams = at most 4 lines. Stars = at most 14 separate
  paper holes, each cut on its own, never a mirrored copy of the sky. Registration is one hair off
  on every page - the screens do not line up perfectly and that misfit is visible at 2 or 3 edges.
  DENSITY RATION = none.
  🔴 A PAGE THAT IS ONLY IMAGINED - some volumes show what Pongi is picturing. There is no blur and
  no border in this medium, so it is told apart by HAVING NO STAGE: everything but the imagined
  thing is left as unprinted PAPER, and the imagined thing is pulled at FULL strength. Every real
  page has a printed stage, so that one difference carries it. No cloud frame, no outline, no soft
  or faded edge, no half-strength pull, and no character on the page.

PALETTE: PAPER CREAM #F6F4EE, sky, ice, light, everything not pulled · INK1 CANAL #2C4A3C, water ·
  INK2 EARTH #8C7C68, wood, boats, chests, rope, banks · OVERLAP PINE #21372E, otter backs, night,
  anything submerged - this colour is never mixed, only overprinted · RED PLATE #A8442F, 🔴 a third
  pull touching nothing but Pongi's neck cord. No sky blue, no purple, no pink.

CHARACTER DESIGN LANGUAGE: 🔴 SHARED BY ALL FOUR ANCHORS - reproduce word for word, do not vary.
  Animals are built from the same flat pulls as the world - two or three shapes with limbs laid
  over. GRADE: bipedal, standing upright, wearing cloth. The back and head are the OVERLAP colour,
  the chest and belly are INK2, so every animal is built the same way in every anchor. Eyes are two
  solid dark dots; a small dark nose; the mouth is ONE curve. There are no eyebrows.
  🔴 WHERE THE TWO DOTS SIT INSIDE THE HEAD IS THE ACTING. They never change size and never change
  shape, but they are re-placed on every page: pushed to one side of the head to look at a thing,
  pushed to the far side to look away from it while the body still faces it, set high to look up, set
  low and close to the nose to watch what the hands are doing, and set with one dot nearer the nose
  than the other when a face is caught between two things. 🔴 THE PAGE MUST BE READABLE FROM THE DOTS
  ALONE - whatever is being looked at is inside the frame, and no page has every animal aiming its
  dots at nothing. Shut, a dot is replaced by one short lying curve.
  The mouth curve says how the character feels; the pair of dots says what it is thinking about.
  Nothing ever crosses a face. Silhouettes separate at thumbnail size: 🔴 THE BABY IS THE SMALLEST
  FIGURE IN THE BOOK - rounder than Pongi, limbs much shorter, one shell held against its chest;
  Pongi is the next smallest and is the one with the cord; the goose is the tallest and thinnest.

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

### ✅ 퐁이 시트 확정 (2026-08-13)

 — 사용자가 GPT 로 뽑았다. 세 조건 통과: **아기 비례**(머리가 크고
팔다리가 짧다) · **붉은 것은 목끈 하나** · **잉크 안에 종이 결**. 주둥이의 흙색이 가슴·배로 이어져
한 덩어리 도형이라 축소해도 실루엣이 안 무너진다.

`pongi-sheets/01-pongi-modelsheet.png` — 3면(정면·옆·뒤) · 표정 5 · 자세 4 를 한 장에. 뒷모습에서 꼬리 위치와 목 뒤로 넘어가는 끈이 정해졌다.

🔴 **표정 규격이 실측으로 바뀌었다.** 프롬프트에 「놀람 = 눈이 훨씬 크게」를 넣었는데 **눈은 다섯 개가 다 같게** 나왔다. 실제로 변한 것은 입뿐이고, 눈이 변한 자리는 「웃음」에서 감긴 것 하나다. 이 캐릭터는 눈이 작은 점이라 크기를 키우면 인상이 무너지는 쪽이고, 그대로도 다섯이 구분된다.

> **표정 = 입 곡선 5종 × 눈은 뜨거나 감거나.** 평상=부드러운 곡선 · 놀람=작은 O · 웃음=크게 벌림+눈 감김 · 골똘=직선 · 실망=아래 곡선.

⚠️ **자세 하나는 다시 잡아야 한다** — 「두 팔 앞으로 뻗기」가 만세로 나왔다. 01권 p8(아빠 손을 잡아당김)·09권에 필요한 것은 앞으로 뻗는 쪽이라 그 쪽 프롬프트에서 따로 지정한다.

🔴 **이 시트가 나머지 넷의 레퍼런스다.** 250쪽에 옆·뒤·앉기·엎드리기·넘어지기가 나오고, 무엇보다 이 시리즈는
**얼굴 연기가 핵심**인데 앵커가 눈썹을 금지했다 — 표정은 **입 곡선과 눈 크기** 둘로만 만들어야 하므로
그 조합이 시트에 고정돼 있지 않으면 250쪽에서 제각각이 된다. 남은 것 = 3면 · 표정 5~6 · 자세 4.

### 🔴 comfy_test 에서 레퍼런스 경로가 막혀 있다 (2026-08-13)

\
ComfyUI 0.31.0 이  인자를 추가했는데 커스텀 노드  가 안 따라갔다.
**캐릭터 레퍼런스를 물리는 경로 전체가 막혔다** — 순수 t2i( 없이)는 정상이다.
시트 확장은 **GPT 로** 한다(이미지 첨부가 레퍼런스로 그대로 먹는다).

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
