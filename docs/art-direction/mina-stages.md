# 가운데 아이 미나 — 무대·사물 시트

> art-director 산출물 (2026-08-16 · 사물 시트 2026-09-04). 시리즈 15 `mina-dotfolk` ·
> **50권 500쪽**(§1·§2 첫 표의 「25권」은 늘기 전 숫자다).
> 🔴 앵커 SSOT = `mina-anchor.md`. 후보 = `_stages.json`(자리 10 · 사물 82항목 / 고유 59) · 대본 = `_scenes.json`
> **실행 순서** ① `RiverStairs` → ② `RiverBed` → ③ 나머지 자리 → ④ 사물 → ⑤ 컷.

---

## §0. 🔴 이 시리즈의 매체 번역 한 줄 — 둘이다

**① 강 높이는 그려지는 게 아니라 화면 폭의 분수로 세어진다. 그래서 강가 자리에는 눈금이 있어야 한다.**

앵커: `THE HEIGHT OF THE RIVER IS HOW MUCH OF THE PAGE THOSE DOTS COVER, given as a fraction of the
page width`. SCENE 이 이미 그 분수를 25권 내내 적고 있다 — **1/8 · 1/6 · 1/5 · 1/4 · 1/3 · 1/2**.
🔴 그런데 분수는 **다음 쪽과 견줄 것이 있어야 눈에 보인다.** 25 p1 이 답을 갖고 있다: **계단 여덟 칸.**
물이 몇 칸을 덮었나로 읽으면 「어제 걸어 건넌 데를 오늘은 못 건넌다」가 문장 없이 성립한다.
→ **모든 강가 자리 시트는 셀 수 있는 눈금을 하나씩 갖는다**(계단 8칸 · 징검돌 7개 · 돌밭 테두리 자국).

**② 무대와 사물에 메운 면이 하나도 없어야 한다.**

이 시리즈의 악센트는 색이 아니라 **마감**이다 — 금 발찌만 점이 아닌 메운 면이라 **화면에서 유일하게
매끈한 것**이 주인공에게 붙는다(§2.9 아홉째 변형). 🔴 무대나 사물에 메운 면이 하나라도 생기면 발찌가
그 즉시 안 보인다. 타로의 「모래가 CLOTH 라 조개는 CLOTH 일 수 없다」와 같은 자리이고, 이쪽이 더
위험하다 — 색이 아니라 **질감**이라 무심코 어긴다. → **모든 시트 `NOT` 에 `no filled or solid shape
anywhere - every single thing is stamped dots` 를 첫 줄로 둔다.**

**③ 🔴 「몸이 닿는 자리」는 카메라이지 사물이 아니다 — 자리 시트마다 스팟 하나가 더 있어야 한다**
(2026-09-04 · `_ROUTE-FINDINGS.md` §13).

지금까지 이 시리즈의 SPOTS 는 **예외 없이 「자리를 보는 카메라」**다(넓게 · 낮게 · 위에서 · 저 끝에서).
그런데 경로표를 채우니 **권마다 두세 쪽이 「마주 본 두 얼굴」이거나 「걸린 두 코」이거나 「겹친 두 손」**
이고, **그게 대개 그 권이 도는 쪽**이다(27 p5 · 36 p10 · 50 p5 · 38 p5·p7 …). 사물 시트는 `STATES`
만 들고 **카메라를 안 들어서** 이 구멍을 못 메운다.

→ **모든 자리 시트(§1.1~§1.4, 아직 안 쓴 `House`·`StoneCauseway`·`BankField` 포함)가 아래 스팟을
그대로 한 줄 갖는다.** 자리마다 다른 것은 **배경 한 줄**뿐이다.

```
  X CLOSE ON TWO - the one place where two bodies (or a body and the one thing it holds) touch. The
    touching point is the ONLY thing dotted TOUCHING on the page; everything around it is dotted
    WIDE and reads as one soft mass; the background is <이 자리의 것 한 줄>. Faces may be cut by
    the frame. 🔴 ON THIS SHEET IT IS DRAWN EMPTY - the background alone with no body in it, because
    a stage sheet carries no character; what it fixes is what lies BEHIND the two.
```

🔴 **익스트림 클로즈업에는 한 줄이 더 붙는다** — 이 매체는 **점 크기가 500쪽 내내 같다**(앵커
`all the SAME size on every page`). 그러므로 한 물건이 화면을 다 채울 때 **점을 키우면 안 되고**,
그 물건의 간격을 손 거리에서 쓰던 것보다 **한 단만 조인다**(OPEN → CLOSE). 그리고 그 쪽에서
CLOSE 이상으로 조여진 것은 **그 물건 하나뿐**이다.

---

## §1. 자리 시트 — 7장 (후보 10에서 접고 · 2026-09-04 `Market` 신설 · `Village`→`VillageLane`)

🔴 **쪽·권 수는 손으로 적지 않는다** — `node packages/client/scripts/build-series-routes.mjs --count mina`
가 SCENE 에서 센다(**되짚는 쪽까지** 센다 — 토큰 붙은 쪽만 세면 물려받는 쪽이 통째로 빠진다).
2026-09-04 실측:

```
House 279쪽·33권 · RiverBed 122쪽·18권 · RiverStairs 60쪽·9권 · StoneCauseway 13쪽·3권 ·
VillageLane 9쪽·1권 · Market 9쪽·1권 · BankField 8쪽·2권
```

⚠️ **아직 프롬프트가 없는 시트 셋** — `House`(279쪽 · 이 시리즈 최대 무대) · `StoneCauseway` ·
`BankField`. 쓸 때 §0 ③ 의 `CLOSE ON TWO` 와 §0 ② 의 `NOT` 첫 줄을 그대로 갖고 시작할 것.

🔴 **접은 내역**

| 시트 | = 후보 | 왜 하나인가 |
|---|---|---|
| `RiverStairs` | 마을 강가 계단 · 계단 맨 위 · 계단 맨 아래 칸 | 한 계단의 위·아래. **이 시리즈의 자 그 자체** |
| `RiverBed` | 강바닥 · 물이 빠진 강바닥 · 물이 빠진 강가 · 강가 웅덩이 | 물이 빠지면 걸어 들어가는 한 바닥 |
| `House` | 마당 · 집 마당 · 집 안 · 집 안 방 · 집 문 앞 | 마당에서 방문이 보인다 |
| `StoneCauseway` | (돌다리 · 돌밭) | 21·18 — 🔴 발이 아픈 곳이라 **신을 신는 유일한 자리** |
| `BankField` | (풀밭 · 밭) | |
| `VillageLane` | (마을 길 · 강가 길) | 🔴 **`Village` 를 고친 것이다**(2026-09-04) — SCENE 은 `VillageLane` 을 찍는데 이 표만 `Village` 였다. **이름이 다르면 안 붙는데 검사기는 「미매칭 0」으로 통과한다** = 없는 것보다 나쁘다. 시트 이름 쪽을 SCENE 에 맞췄다(SCENE 500쪽이 데이터고 표는 한 줄이다). §1.3 |
| 🔴 `Market` | 강 건너 장터 | **신설**(37권) — 강 **건너**라 `VillageLane` 과 다른 자리고, 배를 타야 닿는다. §1.4 |

### §1.1 RiverStairs — 실제 프롬프트 (가장 먼저)

```
STAGE SHEET - RiverStairs   (mina-dotfolk · SCENE token: RiverStairs · bake FIRST)

The stone stairs where the village goes down to the river. THIS IS THE RULER OF THE WHOLE SERIES:
every book that says how high the river is can be checked against it, so it is drawn once and its
count never changes.

FIXED PARTS - everything is stamped dots of one size, nothing is drawn and nothing is filled:
  EIGHT STEPS, no more and no fewer, running down the picture from the village to the water. Each
    step's edge is a row of INK dots set TOUCHING; each step's tread is INK dots set OPEN so the
    ochre ground shows through. The count of eight is fixed forever.
  THE STEPS ARE NOT ALL THE SAME - the top step is the widest and they narrow going down, and the
    THIRD step from the bottom is chipped at its left corner. That chip is how a reader knows which
    step is which.
  A LOW WALL runs down the right side of the stairs, INK dots CLOSE, 0 fill.
  DRY-RING MARKS: on every step the water has left behind, ONE line of INK dots along the tread
    where the wet edge stopped. These are what remain when the river drops.
  THE RIVER at the foot: a field of WHITE dots. 0 ripples, 0 reflections, 0 glints.

🔴 THE RULER: the height of the river is given as a fraction of the PAGE WIDTH, and on this stage it
  is also readable as HOW MANY OF THE EIGHT STEPS THE WHITE DOTS COVER. Draw the ruler explicitly:
  1/10 = 0 steps covered AND the water has pulled back past the foot of the stairs, leaving a band
    of bare GROUND between the bottom step and the WHITE field. This is the lowest the river goes.
  1/8 of the page width = 0 steps covered, bare stone all the way down, the water at the foot
  1/6 = 1 step · 1/5 = 2 · 1/4 = 3 · 1/3 = 5 · 1/2 = 7, only the top step dry.
  2/3 = all eight steps gone under and the WHITE field up over the top step into the yard, so the
    stairs are read only by the low wall standing out of the water.
  A covered step keeps NO dots of its own - the WHITE field simply reaches it.
  🔴 EIGHT VALUES AND NO OTHERS. A page that wants "the lowest ever" uses 1/10 and a page that wants
  "up into the yard" uses 2/3; nothing is invented between two rungs, because the fraction is what
  the next book is checked against.

  🔴 A WHITE MARKER STONE ON EVERY TREAD, one per step, set into the tread near its right end (build
  on PROP SHEET RiverStones). Counting steps says how far the water came; the marker stones say
  WHICH step, and they are how a page names one step without lettering.

SPOTS:
  A FROM THE TOP looking down, high: all eight steps and the water at the bottom of the frame.
  B FROM THE WATER looking up, low: the steps rising, the village edge above.
  C ONE STEP, close: the tread, its touching-dot edge, its marker stone and one dry-ring mark.
  D ALONG THE STAIRS, side on: the low wall on the right, the fall of the steps read as a slope.
  E CLOSE ON TWO - what stands behind two bodies where they touch: bare GROUND with ONE step edge
    crossing it as a row of touching dots and ONE marker stone, and nothing else. On the page the
    touching point is the only thing dotted TOUCHING and everything around it is dotted WIDE; 🔴 on
    this sheet it is drawn EMPTY, with no body in it.

PLATE: A drawn EIGHT TIMES in a row, once at each of the eight river heights above, all at the same
  size - this single strip is the calibration the other books are checked against. Plus B, C, D, E
  once each.

NOT: 🔴 no filled or solid shape anywhere - every single thing is stamped dots, and the only smooth
  thing in this series is the gold ankle band, which is not on this sheet / no character of any kind
  / no gold anywhere on this sheet / no lettering, numerals or step numbers / no continuous drawn
  line / no gradient, glow or soft edge / no ripple or reflection on the water.
```

### §1.2 RiverBed — 요약 명세

`FIXED PARTS` = 넓적한 돌(11권) · 각지고 뾰족한 돌(18권 — **다른 돌이다**) · 얕은 웅덩이 넷(19권) ·
나루의 널판(14권). 🔴 **물이 빠진 바닥 = 흰 점이 하나도 없는 맨 바탕**이고, 젖은 자리만 INK 점 CLOSE 다.
🔴 **그림자는 물 반대쪽으로 나란히**(13 p6 이 열댓 개를 그렇게 적었다) — INK 필드 CLOSE, 가장자리 단단,
안은 균일. `SPOTS` = A 둑에서 / B 바닥 한가운데 / C 돌 하나 close / D 물가 선.

🔴 **`SPOT G = CLOSE ON TWO`**(§0 ③ · 2026-09-04 신설 — E·F 는 아래 나루터가 이미 쓴다).
배경 한 줄 = **맨 바탕 흙에 젖은 자리 가장자리 한 줄**(INK 점 CLOSE)이 화면을 가로지르고 그 밖엔 0점.
38 p5·p7(열매 하나 / 흰 덩어리 하나 close)이 여기다 — 🔴 **`C` 는 「돌 하나 close」로 못박혀 있어서
사물 하나를 손 거리에서 보는 쪽을 못 받는다**(그게 이 자리의 신고였다). 익스트림은 §0 ③ 의 한 단 규칙.

🔴 **SPOT E = 나루터** (2026-09-04 신설 · 14 · 35 · 41 · 44 네 권이 여기서 열리고 그중 둘은 이 자리가
화면의 전부다). 지금까지 「널판 한 줄」로만 적혀 있었다. 정할 것 =
**널판 한 장**(강바닥에서 배까지 걸치는 판 하나 — 젖은 끝과 마른 끝이 INK 점 간격으로 갈린다) ·
**말뚝 하나와 거기 감긴 줄**(🔴 **줄이 감겨 있으면 못 간다 · 풀리면 간다** — 배가 나아가는 것을 그리는
유일한 장치다) · **나무배 한 척**(뱃전 한 줄 · 바닥 널 세 줄) · **닿는 흙길**. `SPOT E` 는 **둑에서
널판·배·말뚝이 한 프레임**, `SPOT F` 는 **배 안에서 바깥**(14 p10 · 35 p7 · 37 p10 이 배 위다 —
셋 다 토큰이 `RiverBed` 라 이 시트가 받는다).

🔴 **다른 시트가 받아야 할 조항 넷** (사물 시트가 넘긴 것 · §2 「§1 에 넘기는 것」 3):

| 시트 | 넣을 것 | 왜 |
|---|---|---|
| ✅ `RiverStairs` §1.1 | **칸마다 흰 표시 돌 하나** — 2026-09-04 시트 본문에 넣었다(`THE RULER` 아래 줄) | 39권의 수위 자. 칸을 세는 것과 별개로 「몇째 칸인가」를 말한다. 돌 규격은 §2.19 |
| `House` | **평상 밑 간격 두 단** — 30권은 널빤지 아래가 INK 점 TOUCHING 인 가로 띠(화면에서 가장 어둡다) / 33 p4 는 **같은 자리를 OPEN 으로 벌려 찍어 속이 훤히 보인다**(찾는데 없다) | 두 권의 사건이 **같은 자리의 간격 차이** 하나다 |
| `House` | **창틀 안 흰 점 등불 4 → 2 → 1 → 0** | 31권의 시계. 등불 자체는 §2.13 |
| `RiverBed` | **얕은 웅덩이 넷 · 그 안의 물고기 = 흰 점 두세 알** | 19권 — 마른 바닥에서 유일하게 밝은 것 |

### §1.3 VillageLane — 실제 프롬프트 (🔴 **9쪽 · 1권**)

> 36 p1~p7 · p9 · p10. ⚠️ **이 머리글은 「2쪽 · 1권」이었다**(2026-09-04 수정) — 세는 사람이
> **토큰 붙은 쪽(p1 · p9)만** 세서, 「같은 길가」로 물려받는 일곱 쪽이 통째로 안 보였다. 그 숫자를
> 믿고 아래 `THE STATE THAT MATTERS` 가 상태를 **둘만**(막힘 / 지나감) 정해 두었는데, 실제 권은
> **일곱 → 다섯 → 한 마리가 화면을 채움 → 셋 → 셋 → 마지막 하나 → 꼬리 하나 → 0** 으로 간다.
> 🔴 **줄어드는 도중이 이 권의 계기 그 자체**라, 시트가 중간 값을 안 들면 열 쪽이 두 그림이 된다.
> 🔴 쪽·권 수는 `--count`(§1 머리)로 세고 손으로 안 적는다.
>
> 정할 것 = 길가 풍경이 아니라 **길이 화면을 가로지르는 각** · **계단 머리가 어디 보이나**(길 건너
> 오른쪽 위 = 「보이는데 못 간다」의 근거) · **줄이 줄어드는 다섯 값**.

```
STAGE SHEET - VillageLane   (mina-dotfolk · SCENE token: VillageLane)

The earth lane through the village, at the end where it meets the head of the river stairs. One book
opens and lands here, and both of its pages are about WHETHER THE LANE IS BLOCKED.

FIXED PARTS - everything is stamped dots of one size, nothing is drawn and nothing is filled:
  THE LANE crosses the picture LEFT TO RIGHT and leaves it at both edges - bare GROUND ochre with 0
    dots on it, so it is the emptiest thing on the page and a thing standing on it reads at once.
  🔴 THE HEAD OF THE STAIRS enters at the UPPER RIGHT, across the lane: the top step and the start
    of the low wall, and NOTHING MORE OF THE STAIRS. That corner is the whole reason this stage
    exists - the stairs must be visible from the lane, because a book stands here unable to reach
    them. Its build is fixed on STAGE SHEET RiverStairs and does not change here.
  HOUSES along the far side, at most 4, each an INK dot OUTLINE with 0 fill and 0 windows.
  A LOW EARTH WALL along the near side, INK dots CLOSE, knee high on a child.
  THE RIVER beyond and below, a field of WHITE dots. 0 ripples, 0 reflections, 0 glints. Its height
    is given as a fraction of the page width on every page, the same ruler as everywhere else.
  THE SKY is bare GROUND edge to edge with 0 dots.

🔴 THE STATE THAT MATTERS IS HOW MANY ARE STILL CROSSING - draw all five, at one size, from
  SPOT A. The animals are dot-outlines with 0 faces and 0 hands, all facing one way, at most 7:
  1 SEVEN, BLOCKED - the line leaves BOTH edges of the frame. 🔴 UNBROKEN EDGE TO EDGE: no gap
    anywhere, so a reader sees there is no way through even though the stairs show.
  2 FIVE - the line still reaches both edges but a gap has opened at one end.
  3 THREE - the line no longer touches the left edge; through the legs the empty lane and the stairs
    head show, and that gap is the first thing on the page that is bare GROUND.
  4 ONE - a single animal at the right, the lane bare from the left edge to it.
  5 NONE - the frame empty except ONE last tail at the right edge, and the lane carrying hoof marks:
    INK dots CLOSE, packed, covering the bare lane from edge to edge. 🔴 The marks are what says
    the lane was blocked a moment ago; without them the first and last pages are the same picture.
  🔴 THE LINE ALWAYS THINS FROM THE LEFT: the gap opens at the left edge and grows rightward, so
  the count and the direction agree on every page and the last one out is always at the right.

SPOTS:
  A ALONG THE LANE, wide, high: the lane crossing the lower half, the stairs head at the upper
    right, houses along the far side.
  B AT THE LANE'S EDGE, medium, low: the near wall and the empty lane running away, sky above -
    🔴 low enough that a raised trunk reaches the top edge of the frame.
  C THE LANE FLOOR, close, high: bare ochre, and whatever has been pressed into it.
  D FROM THE LANE FLOOR LOOKING UP, low, close: ONE animal's body crossing the whole upper frame
    with its hooves on the ground at the bottom, the horns cut off by the top edge, and a strip of
    bare GROUND lane left along the lower edge. 🔴 This is the only spot where one of the line
    fills the page, and it is still an outline with 0 face.
  E CLOSE ON TWO - what stands behind two bodies where they touch: bare GROUND lane with the hoof
    marks (INK dots CLOSE) low in the frame and NOTHING else - no houses, no wall, no stairs. On the
    page the touching point is the only thing dotted TOUCHING and everything around it is dotted
    WIDE; 🔴 on this sheet it is drawn EMPTY, with no body in it.

PLATE: A drawn FIVE TIMES (seven / five / three / one / none) in a row at one size, then B, C, D and
  E once each.

NOT: 🔴 no filled or solid shape anywhere - every single thing is stamped dots, and the only smooth
  thing in this series is the gold ankle band, which is not on this sheet / no character of any kind
  / no gold anywhere on this sheet / no lettering, numerals or signs / no continuous drawn line /
  no gradient, glow or soft edge / no ripple or reflection on the water / no face or hand on any
  crowd or animal silhouette.
```

### §1.4 Market — 실제 프롬프트 (신설 · 37권)

> 37 p1~p9. 🔴 **강 건너다.** 배를 타야 닿으므로 `VillageLane` 과 접히지 않고, 그 건너감이 이 권의 전부다.
> 🔴 정할 것 셋 = **골목의 좁기**(사람 사이로 걷는다) · **가게 셋이 무엇을 파는가**(고정) ·
> **북의 크기**(미나 키만 하다 — 견줄 것이 없으면 이 권의 클라이맥스가 안 읽힌다).

```
STAGE SHEET - Market   (mina-dotfolk · SCENE token: Market)

The market lane on the far side of the river. One book spends nine pages in it. It is reached only
by boat, and it is the only place in this series that is CROWDED.

FIXED PARTS - everything is stamped dots of one size, nothing is drawn and nothing is filled:
  🔴 THE LANE IS NARROW - one adult and one child abreast and no more, walls of stalls close on both
    sides, and it runs AWAY from the viewer rather than across. That narrowness is the point: this
    is the one stage where a child cannot step aside.
  THE FERRY PLANK at the LOWER LEFT, entering the frame - the lane starts where the plank ends, so
    the crossing and the market are in one picture. Its build is on STAGE SHEET RiverBed SPOT E.
  🔴 THREE STALLS AND NO MORE, always the same three, always in the same order going up the lane:
    1 A HEAP OF JARS - INK outlines, 0 fill, stacked, at most 9 of them.
    2 A BASKET OF FRUIT - one basket outline with the fruit as INK dots CLOSE mounded above its rim.
    3 A CLOTH HUNG UP - ONE sheet of WHITE dots, the brightest thing in the lane, hanging still.
  🔴 THE DRUM at the top of the lane - AS TALL AS THE MIDDLE CHILD, standing on end. It is drawn
    beside a figure at least once so the size is fixed and never guessed. Its skin is WHITE dots
    OPEN, its body INK dots CLOSE, and its two hoops are one row of touching dots each.
  THE CROWD is at most 7 dot-outlines with 0 faces and 0 hands, standing, never walking towards the
    viewer. 🔴 They are OPEN dots so the ochre shows through them and nothing in front of them is
    lost; the two the book is following are the only CLOSE-dotted bodies on the page.
  THE SKY is bare GROUND edge to edge with 0 dots. Awnings are INK outlines with 0 fill.

SPOTS:
  A THE MOUTH OF THE LANE, wide, eye level: the plank at the lower left, the lane going up to the
    right, all three stalls in order and the drum small at the top.
  B IN THE LANE, medium, eye level: stalls close on both sides, crowd outlines between the viewer
    and the far end.
  C AT THE DRUM, medium, low: the drum and one figure beside it, so the height reads.
  D LOOKING BACK, medium wide: down the lane to the plank and the water beyond, the way home.
  E CLOSE ON TWO - what stands behind two bodies where they touch: ONE stall wall of the three,
    dotted OPEN, filling the frame behind them, and nothing else - no crowd, no drum, no sky. On the
    page the touching point is the only thing dotted TOUCHING and everything around it is dotted
    WIDE; 🔴 on this sheet it is drawn EMPTY, with no body in it.

PLATE: A, B, C, D, E once each, plus one measuring panel with the drum and the middle child standing
  side by side at true relative height.

NOT: 🔴 no filled or solid shape anywhere - every single thing is stamped dots / no character of any
  kind / no gold anywhere on this sheet / no lettering, numerals, signs or prices on any stall /
  no face or hand on any crowd figure / no continuous drawn line / no gradient, glow or soft edge.
```

---

## §2. 사물 시트 — 34장

> 🔴 **단위는 권이다.** 50권을 한 권씩 읽고 그 권이 기대는 물건부터 세웠다. 후보 목록은
> `_PROP-SHEETS.md` 의 `## mina` 절(61장)이지만 **그 목록만 보면 못 만든다** — 아래 「작업표가
> 놓친 것」을 먼저 볼 것.
> 🔴 **형식 정본은 `pongi-stages.md` §2** 다. 새 시트는 전부 그 구성(FORM / STATES / PLATE / NOT)이다.
> 🔴 **§0 ② 가 모든 시트를 지배한다** — 메운 면이 하나라도 생기면 금 발찌가 그 즉시 안 보인다.
> 그래서 모든 `NOT` 의 첫 줄이 같다.

| § | 토큰 | 사물 | 권 (쪽 수) |
|---|---|---|---|
| 2.1 | `ThreeBowls` | 그릇 셋 | 20(9) · 19 · 12 · 04 |
| 2.2 | `Shells` | 조개 · 흰 껍데기 | 11 · 20(4) |
| 2.3 | `Swing` | 그네 — 줄 두 가닥과 나무판 | **08**(8) |
| 2.4 | `Shoes` | 신 세 켤레 | 18(6) · 21(4) |
| 2.5 | `Kite` | 연 둘 | 22(6) · 05(4) |
| 2.6 | `WaterTub` | 마당 물통 | 47(9) · 30(8) · 28(6) · 46 · 45 · 49 · 43 · 34 · 32 |
| 2.7 | `Gourd` | 바가지 셋 | 16(6) · 10(4) · 28 · 07 · 30 · 32 · 45 · 46 · 47 |
| 2.8 | `Jars` | 항아리 큰 것 · 작은 것 · 뚜껑 | 16(9) · 01(6) · 41 · 37 |
| 2.9 | `Plate` | 낮은 접시 (칸 둘) | 26(7) · 29(7) · 02(6) · 28 · 50 |
| 2.10 | `Flatbread` | 납작빵 세 덩이 | 02(6) · 29(5) · 28(4) |
| 2.11 | `Cloth` | 수건 셋 · 빨래 · 비누 | 06(7) · 49(4) · 12(4) · 28 · 30 · 35 · 38 · 42 · 45 · 50 |
| 2.12 | `Quilt` | 이불 | 34(9) · 23(5) · 31 · 32 · 48 · 20 |
| 2.13 | `Lamp` | 등불 | 42(10) · 31(7) · 49(5) · 33 · 20 · 05 |
| 2.14 | `Baskets` | 바구니 셋 · 집 바구니 | 33(6) · 11(5) · 35 · 37 · 06 |
| 2.15 | `Beads` | 구슬과 실 | 12(8) |
| 2.16 | `Bundle` | 나뭇단 셋 | 15(5) |
| 2.17 | `MarketBundle` | 보따리 | 41(4) · 05(2) · 37 · 44 |
| 2.18 | `Boat` | 나룻배와 노 | 07(8) · 35(5) · 14(4) · 41 · 44 · 37 |
| 2.19 | `RiverStones` | 강돌 크기 셋 · 돌탑 · 표시 돌 | 13(7) · 39(6) · 11 · 24 · 25 · 33 |
| 2.20 | `ClayCows` | 진흙 소 열둘 | 03(9) |
| 2.21 | `FlowerPots` | 화분 셋 | 10(5) |
| 2.22 | `Goat` | 염소와 줄 | 09(5) · 46(4) · 26 · 33 |
| 2.23 | `Buffalo` | 물소 일곱 | 36(6) |
| 2.24 | `Top` | 나무 팽이 | 33(4) · 41(3) · 29(3) |
| 2.25 | `WoodenDoll` | 나무 인형 | 47(9) · 39(2) · 33 |
| 2.26 | `Trousers` | 헐렁한 바지 | 34(7) |
| 2.27 | `Fruit` | 열매 · 🔴 하얀 덩어리 | 43(10) · 38(6) · 37 |
| 2.28 | `TreeBranch` | 휘는 가지 | 43(7) |
| 2.29 | `EarthBund` | 흙담 | 17(6) |
| 2.30 | `ChoreLoads` | 일감 셋 (빗자루 · 그릇 무더기 · 수저 셋) | 19(6) |
| 2.31 | `Driftwood` | 나뭇조각과 나무 밑동 | 24(8) |
| 2.32 | `LeafBoat` | 잎 배 | 45(6) |
| 2.33 | `GroundDrawing` | 흙에 그린 그림 | 44(6) |
| 2.34 | `Toothstick` | 이 닦는 나뭇가지 · 흰 이 | 27(7) |

### 🔴 작업표가 놓친 것 — 이것부터 (실측)

`_PROP-SHEETS.md` 의 `## mina` 절은 **권 둘을 통째로 빠뜨렸고**(22 · 37 — 목록이 21→23, 36→38 로
건너뛴다), 한 권을 지탱하는 물건 여럿을 **실제 쪽수의 절반 이하로** 세고 있다. 추측이 아니라
`_scenes.json` 을 라벨별로 세어 본 값이다.

| 물건 | 실제 쪽수 | 작업표 | 왜 샜나 |
|---|---|---|---|
| **47 나무 인형** | **9쪽** | **0** | 🔴 **컷 라벨에 0회** — 인물 7 · 배경소품 5. 작업표는 머리말에 「이 표의 사물은 전부 컷에 이름이 적힌 것들」이라 적어 뒀으니, 컷에 안 나오는 물건은 **원리상 안 보인다** |
| **45 잎 배** | **9쪽** | **0** | 같은 이유 (컷 0 · 인물 5 · 배경소품 8) |
| **27 이 닦는 나뭇가지** | **7쪽** | **0** | 같은 이유 (컷 0 · 인물 5 · 배경소품 6) |
| **18 신** | **10쪽 전부** | 0 | 🔴 **한 글자 낱말**이라 못 잡는다. 21 도 6쪽인데 0 |
| **22 연** | 5쪽 | **권이 통째로 없음** | 한 글자 낱말 + 권 누락 |
| **34 바지** | **9쪽** | 4 | 🔴 「바지 / 구멍 / 다리」 **셋으로 쪼개져** 세어졌다 |
| **08 그네** | **7쪽** | 3 | 「그네」와 「그넷줄」과 「앉을자리」가 딴 낱말로 세어졌다 |

🔴 **한 글자 낱말이 이 시리즈의 주인공 사물에 몰려 있다** — 신 · 연 · 줄 · 끈 · 북 · 이 · 잎.
그래서 18·22·27·45 가 「빈 권」처럼 보였다. 빈 게 아니라 **셀 수 없었던 것**이다.

아래 여덟은 후보 목록에 한 줄도 없는데 그 권의 전부다. 퐁이 08 의 의자와 같은 자리다.

| 없는데 그 권의 전부인 것 | 어디 | 무엇을 놓쳤나 |
|---|---|---|
| **연**(`Kite`) | 22 여섯 쪽 · 05 네 쪽 | 🔴 **22권이 작업표에 아예 없다.** 목록이 21 에서 23 으로 건너뛴다 |
| **신**(`Shoes`) | 18 여섯 쪽 · 21 네 쪽 | 18 은 「바위」만 잡혔다. 그런데 18 p3↔p9 은 **같은 각도로 발과 신 사이 틈을 견주는 것**이 전부고, 앵커 §3 이 이미 「신은 18·21 두 권에만」이라고 못 박아 뒀다 |
| **그네**(`Swing`) | 08 여덟 쪽 | 08 은 「나무」와 「그네」가 잡혔는데 그네가 **줄 표면(젖음/마름)으로 시간을 재는 물건**이라는 게 안 보인다 |
| **팽이**(`Top`) | 29 · 33 · 41 | 세 권에 걸쳐 있는데 한 권에서도 안 잡혔다 |
| **바지**(`Trousers`) | 34 일곱 쪽 | 「바지」·「구멍」·「다리」로 **셋으로 쪼개져** 잡혔다 |
| **물통**(`WaterTub`) 의 크기 | 47 아홉 쪽 | 잡히긴 했으나 「물통과」라는 **조사 붙은 조각**이 따로 한 항목을 먹고 있다 |
| **북 · 장터 가게**(37) | 37 전권 | 🔴 **37권도 목록에 없다.** 그리고 `[Market]` 자리 시트가 §1 에 없다 |
| **하얀 덩어리**(38) | 38 두 쪽 | 「열매」만 잡혔다. 38 의 사건은 **먹는 것과 안 먹는 것을 나란히 놓는 것**이다 |

### 🔴 접은 내역

| 접은 것 | 어디로 | 왜 |
|---|---|---|
| 16 「뚜껑」 | `Jars` | 그 항아리의 뚜껑이라 지름이 항아리에 묶여 있다. 따로 그리면 안 맞는다 |
| 20 「껍데기」 + 「껍데기가」 | `Shells`(§2.2) | 같은 낱말이 조사째로 두 번 잡혔다 |
| 28 · 45 「물통과」 | `WaterTub` | 같은 물건. 조사가 붙어 잘린 조각 |
| 07 「노」 | `Boat` | 배 한 척에 딸린 자루다. 07 p8 은 그 노가 두 사람 사이 바닥에 가로로 놓인 것이 사건이라 배와 같은 장에 있어야 길이가 맞는다 |
| 36 「발굽」 · 「머리」 · 「꼬리」 · 「다리」 | `Buffalo` | 넷 다 물소의 부분이다. 따로 그리면 몸이 안 정해진다 |
| 34 「구멍」 | `Trousers` | 바지 가랑이 구멍이다 |
| 06 「비누」 | `Cloth` | 크기를 수건과 **소누의 작은 손**에 견줘 읽는다(06 p8 이 그 쥐여 주는 손 셋이 전부다) |
| 33 「공깃돌」 · 24 「조약돌」 · 39 「표시 돌」 | `RiverStones` | 같은 강돌의 크기 셋. 돌 하나를 어떻게 찍느냐가 한 번만 정해지면 된다 |
| 19 「빗자루」 · 「수저 셋」 · 「그릇 무더기」 | `ChoreLoads` | 🔴 19 의 그림은 **셋을 한 줄로 놓고 크기를 견주는 것**(p3 「일감의 크기가 셋의 키 순서와 반대」)이라 따로 그리면 그 비교가 아예 안 생긴다 |
| 38 「하얀 덩어리」 | `Fruit` | 먹는 것과 못 먹는 것을 **같은 진흙 위에 같은 크기로** 놓는 게 38 의 전부다 |
| 41 「배와」 | `Boat` | 「배와 보따리」에서 잘린 조각. 가리키는 것은 나룻배다 |
| 12 「빨래」 | `Cloth` | 같은 수건을 방 안에 다섯 장 겹쳐 넌 것. 바깥에 셋을 벌려 넌 06 과 **간격만** 다르다 |

🔴 **접지 않은 것 둘** — 이름이 같아서 접을 뻔했다.

| 안 접은 것 | 왜 |
|---|---|
| 15 「가지」 ↔ 43 「가지」 (작업표 `·공유 15/43`) | **다른 물건이다.** 15 는 바닥에 널린 **마른 삭정이**(주워서 묶는다), 43 은 나무에 붙은 **산 가지**(코로 감아 활처럼 휜다). 접으면 43 p7 의 「화면 대각선을 다 쓰는 활」이 부러지는 삭정이가 된다 → `Bundle` / `TreeBranch` 로 나눴다 |
| 34 「다리」 ↔ 36 「다리」 (작업표 `·공유 34/36`) | 🔴 **한 글자에 두 낱말이다.** 34 는 바지 가랑이에 들어가는 **미나의 다리**, 36 은 **물소의 다리** 여섯이 기둥처럼 선 것. 퐁이의 「의자 다리 ↔ 다리(橋)」와 같은 함정이 이 시리즈에도 그대로 있다 |

### 🔴 뺀 것과 이유

| 뺀 것 | 이유 |
|---|---|
| 「마리」(03) · 「것들」(04) · 「위로」(05·34) · 「넓게」(30) · 「오른쪽으로」(26) · 「비스듬히」(47) · 「엄마와」(48) · 「곁에」(16) · 「마주」·「멀리」 | 조사·부사·수량사지 사물이 아니다 |
| 「마당에」 · 「모래에」 · 「모래」 · 「흙에」 · 「흙바닥에」 · 「방바닥에」 · 「물가에」 · 「물속」 · 「벽에」 · 「건너편」 · 「언덕」 · 「돌들」 · 「바위」 · 「진흙」 | 전부 **자리**다 — `House` · `RiverBed` · `BankField` · `StoneCauseway` 몫. 🔴 03 의 진흙 바닥도 자리이고, 이 권의 사물은 그 진흙으로 **빚은 소**다(§2.20) |
| 「계단」 · 「칸에」(01·06·25·27·36·39·50) | 자리 시트 `RiverStairs`. 🔴 단 **39 는 칸마다 박힌 흰 표시 돌이 수위 자**다 → §1.1 에 「칸당 흰 표시 돌 하나」를 넣어야 하고, 돌 자체의 규격은 §2.19 가 든다 |
| 「평상」(26·28·30·33·40·45·50) | 자리다(브리프 지시). 🔴 단 **평상 밑**이 두 권에서 화면의 사건이다 — 30 은 널빤지 아래가 먹점 TOUCHING 인 가로 띠(가장 어둡다), 33 p4 는 같은 자리를 **벌려 찍어 속이 훤히 보인다**(찾는데 없다). → `House` 시트에 그 두 간격을 넣을 것 |
| 「창틀」 · 「창턱」(31·19·32) | 자리 `House`. 🔴 단 **31 의 시계는 창틀 안 흰 점 등불이 4→2→1→0 으로 줄어드는 것**이다 → `House` 시트에 그 셈을 넣을 것. 등불 자체는 §2.13 |
| 「선반」(32·34) · 「처마」(04) · 「흙담」 아닌 「담」 · 「문간」 · 「지붕」 | `House` 붙박이 |
| 「나무」(08·21·24·26·43) | 마당 큰 나무 = `House` 붙박이. 🔴 단 **43 은 그 나무의 가지가 휜다** → 자리로는 못 그려서 §2.28 을 따로 뒀다 |
| 「나룻배」의 자리(14·35) | 🔴 **`[Ferry]`(나루터) 자리 시트가 §1 에 없다.** 지금은 `RiverBed` 안에 널판만 한 줄 적혀 있다 — 아래 「§1 에 넘기는 것」 참조 |
| 19 「웅덩이 물고기」 | 자리 `RiverBed` 의 「얕은 웅덩이 넷」에 딸린다. 🔴 단 물고기는 **흰 점 두세 알**이고 그것이 마른 바닥에서 유일하게 밝은 것이다 → `RiverBed` 시트에 한 줄 |
| 37 「북」 · 「가게 셋」 | `[Market]` 자리 시트 몫. 🔴 단 북은 **미나 키만 하다**는 것이 규격이라 그 자리 시트에 키 견줌을 넣을 것 |
| 05 「실타래」 · 「사탕」 | `MarketBundle` 안에서 보따리를 열면 나오는 것. 따로 그릴 만큼 안 쓰인다 |

### ✅ §1 로 넘긴 것 — 처리 (2026-09-04)

셋 다 §1 에 들어갔다. ①`Market` **시트를 새로 썼다**(§1.4) · ②`Ferry` = **`RiverBed` SPOT E·F**
(별개 시트로 안 세운 이유 = 널판·말뚝·배가 강바닥 위에 있고 카메라가 한 걸음이면 닿는다. dodo `MillStream`
SPOT E 와 같은 판정) · ③넷은 각 시트에 조항으로 박았다(§1.2 표) · 그리고 `Village`(§1)와
`VillageLane`(SCENE)의 **이름 어긋남**은 시트 이름을 SCENE 에 맞춰 통일했다.
🔴 그 어긋남은 **검사기가 「미매칭 0」으로 통과시키던 종류**였다 — 지금은 `check-stage-tokens.mjs mina` 가
0 이고, 그 0 은 진짜다.

### 🔴 §1(자리 시트)에 넘기는 것 — 사물 시트로는 못 푼다

1. **`[Market]` 자리 시트가 없다.** SCENE 은 `[House] [RiverBed] [StoneCauseway] [BankField]
   [RiverStairs] [VillageLane] [Market]` 일곱을 쓰는데 §1 은 여섯 장이고, 그중 하나는 이름이
   **`Village`**(SCENE 은 `VillageLane`)다. 🔴 **이름이 다르면 붙지 않는다** —
   `extract-series-stages.mjs --tokens mina` 의 미매칭 0 은 이 상태에서 성립하지 않는다.
2. **`[Ferry]`(나루터)가 `RiverBed` 안에 얹혀 있다.** 14·35·41·44 네 권이 나루터에서 열리고
   그중 두 권은 **널판·줄·배가 있는 자리**가 화면의 전부다.
3. **`RiverStairs` 에 「칸당 흰 표시 돌 하나」**(39) · **`House` 에 「평상 밑 간격 두 단」**(30·33)
   · **`House` 에 「창틀 안 흰 점 등불 개수」**(31) · **`RiverBed` 에 「웅덩이 물고기 = 흰 점 세 알」**(19).

### 🔴 앵커가 깨지는 자리 — 신고 둘

**① 색이 없는 팔레트에 SCENE 이 색을 세 개 썼다.**

앵커 `PALETTE` 는 `GROUND OCHRE / DOT WHITE / DOT INK / GOLD` 넷뿐이고 `No red, no blue, no
green` 으로 못 박혀 있다. 그런데 SCENE 전수를 세면 **초록 12쪽 · 강청 9쪽 · 붉은 1쪽**이 있다.

| 자리 | 무게 | 처리 |
|---|---|---|
| **05 p10 · 22 p2/p4/p7/p9/p10 「흙갈 연 ↔ 강청 연」** | 🔴 **무겁다.** 22 는 「두 연이 색으로 갈린다」가 **누구 연인지 읽는 유일한 장치**다. 색을 지우면 그 권이 안 읽힌다 | §2.5 가 **색이 아니라 점 색으로** 가른다 — 라주 연은 INK, 미나 연은 **WHITE**(팔레트가 `DOT WHITE = cloth` 라고 이미 적어 뒀다). 덤으로 밝은 쪽이 주인공에게 붙어 금 발찌 논리와 같은 방향이 된다 |
| **12 p2/p3/p10 「강청 구슬」** | 가볍다 | 12 의 사건은 색이 아니라 **개수**(꿴 것 4→6→흩어짐→6→목에 딱 맞는 한 줄)다. 색 낱말만 빼면 된다 |
| **43 전권 · 26 p10 · 44 p7 「초록 열매 / 초록 칸」** | 가볍다 | 🔴 **SCENE 이 스스로 뒤집는다** — 43 p1 은 같은 열매를 「먹점을 닿게 찍어 화면에서 가장 어둡다」로 적었고 26 p1 도 잎을 그렇게 적었다. 「초록」은 장식 낱말이고 그림 지시는 이미 INK 다 |
| **22 p6 「손바닥에 줄이 스친 붉은 자국」** | 가볍다 | 이 매체에서 자국은 **INK 점 한 줄**이다 |

→ **대본을 고칠 것**(색 낱말 삭제, 22·05 는 「흙갈 연/강청 연」 → 「먹점 연/흰 점 연」).
고치기 전이라도 §2.5 가 그림을 확정하므로 렌더는 멎지 않는다.

✅ **처리(2026-09-04)** — 대본은 아직 안 고쳤고 **앵커가 먼저 답을 들게 했다.** §2.5 의 판정(라주 연 =
INK · 미나 연 = WHITE)을 한 권의 예외가 아니라 **일반 조항**으로 `PALETTE` 에 올렸다:
`WHEN THE SCRIPT SPLITS TWO OF THE SAME THING BY COLOUR … THEY ARE SPLIT BY DOT COLOUR - one INK,
one WHITE - never by a new pigment, and the WHITE one is the one the book is following`.
🔴 **한 줄이 05·22(연)·12(구슬)·43(열매)을 다 덮는다** — 권마다 예외를 달면 그 예외가 다음 권에서 또 필요해진다.

**② SCENE 이 한 색을 두 이름으로 부른다 — 이게 더 위험하다.**

`먹점`(20회 이상)과 `흙갈 점`(04·16·17·23·43 등)이 **같은 `DOT INK`** 다. 28 p1 이 그 증거다 —
「빵은 **흙갈 점을 벌려** 찍어 밝고 그 위 손자국은 **먹점을 닿게** 찍어 화면에서 가장 어둡다」.
같은 잉크의 간격 차이지 다른 색이 아니다. 🔴 그런데 **`흙갈`은 팔레트에서 바탕색 이름**
(`GROUND OCHRE #EFE0C4`)이기도 하다. 이대로 읽으면 **바탕에 바탕색 점을 찍게 되어** 16 의 흙탕물과
17·23 의 밤하늘이 통째로 사라진다. 아래 시트들은 전부 `INK` 로만 쓴다.

✅ **처리(2026-09-04)** — 앵커 `PALETTE` 의 `GROUND OCHRE` 항목에 **`IT IS NEVER STAMPED`** 를 박았다
(「흙갈 점」이라 적힌 것은 전부 **OPEN 으로 벌려 찍은 INK 점**이고, 밝아 보이는 것은 간격일 뿐이다).
🔴 시트마다 `INK 로만 쓴다`고 적는 것보다 **팔레트가 한 번 말하는 편**이 낫다 — 새 시트를 쓸 사람은
시트를 안 읽고 앵커를 읽는다.

### ✅ 관통 줄 — 세어 봤다 (2026-09-04)

| 줄 | 판정 |
|---|---|
| `DOTS: … no line, no filled area` | 🔴 **바로 다음 줄 `SOLID:` 와 스스로 모순**이었다(금 발찌는 메운 면이고 팔레트가 「책에서 유일하게 메운 것」이라 못 박아 뒀다). 매 쪽에 이 둘을 같이 붙이면 화가가 발찌를 점으로 찍는다 → `except the gold band` 한 구절을 달았다 |
| `SOLID:` | 참. 그대로 |
| `LADDER: when all three are on the page Mina stands between the other two` | 🔴 **거짓이다.** 셋이 다 있는 쪽 **57쪽**을 세어 보니 미나가 가운데가 아닌 쪽이 여럿이고, 하필 **그게 착지인 권들**이다 — 23 p10 은 미나가 **앞장서** 걷는 것이 그 권의 결말이고(뒤에 라주·소누), 08 p10 은 미나만 그네 위에 있고 둘은 아래에서 올려다본다. 이대로 매 쪽에 붙이면 화가가 **착지를 되돌려 미나를 가운데로 밀어 넣는다** → 「가운데」를 **자리가 아니라 키(5:4:3)로** 읽게 고치고, 누가 앞서는지는 대본이 정한다고 못 박았다 |


### §2.1 ThreeBowls — 실제 프롬프트

```
PROP SHEET - ThreeBowls   (mina-dotfolk · SCENE token: ThreeBowls)

The three eating bowls of the house, one for each of the three children. FOUR BOOKS USE THEM, so
they are drawn once here.

🔴 THEIR SIZES ARE THE AGE LADDER: ELDEST : MINA : YOUNGEST = 5 : 4 : 3, the same ratio as the
  children's heights. A reader must be able to say whose bowl is whose without a face on the page.
  This ratio never changes and no fourth bowl exists.
FORM: each bowl is an OUTLINE of INK dots set TOUCHING, and the body inside is INK dots set OPEN so
  the ochre ground shows through. The foot is one short touching row. The rim is one ellipse of
  touching dots. NO fill, no glaze, no sheen, no rendered curve - the roundness is only that the
  dots crowd toward the middle of the wall and thin toward the rim.
STATES:
  1 THE THREE EMPTY, side by side, in size order, mouths up, at one eye height.
  2 ONE FULL - the contents heaped above the rim as a mound of dots, CLOSE, so the mound reads
    darker than the bowl wall.
  3 ONE ON ITS SIDE, its ellipse rim seen as a full circle.

PLATE: state 1 large, plus 2 and 3 small, plus one measuring panel with the three bowls' heights
  laid against each other so the 5:4:3 is visible.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character, no hands /
  no gold anywhere / no lettering or numerals / no continuous drawn line / no gradient, glow or
  soft edge.
```

### §2.2 Shells — 실제 프롬프트

```
PROP SHEET - Shells   (mina-dotfolk · SCENE token: Shells)

The freshwater shells of the river bed - gathered in one book, scattered white across the mud in
another.

FORM: one small fan shape. 🔴 A SHELL IS STAMPED IN WHITE DOTS, never ink - the wet river bed
  around it is bare GROUND ochre with INK dots CLOSE where it is wettest, so a white shell is the
  one bright thing on the mud and can be found at a glance. Dots set TOUCHING for the shell's
  outline, OPEN inside it. At most 5 rib rows, each one line of dots.
STATES:
  1 ONE SHELL, seen from above.
  2 HALF BURIED - only the fan edge showing, the rest simply not stamped.
  3 SCATTERED - the near six or seven separate, the rest carried on as one joined WHITE field (a
    RUN is exempt from the repeat cap).
  4 HEAPED IN A BOWL, mounded above the rim.

PLATE: the four states at consistent scale, plus one panel of a single shell large enough to count
  its rib rows.

NOT: 🔴 no filled or solid shape anywhere / no character, no hands / no gold anywhere / no pearl
  sheen, no wet highlight / no lettering or numerals / no gradient, glow or soft edge.
```

### §2.3 Swing — 🔴 08권 · 이 시리즈에서 제일 급한 시트

> 열 쪽 중 여덟에 그네가 있고 두 컷은 통째로 줄이다(p4 「줄을 쥔 두 손만」 · p6 「손 위로 남은 줄
> 길이」). 🔴 **이 권의 시계는 두 개인데 둘 다 그림에만 있다** — ①줄 표면이 젖었다 마른다
> ②손이 쥔 높이가 내려갔다 올라간다. 시트가 그 둘을 확정 안 하면 쪽마다 다른 그네가 나온다.

```
PROP SHEET - Swing   (mina-dotfolk · SCENE token: Swing)

The swing tied under the yard tree. One book, eight of its ten pages. The tree belongs to the
House stage sheet - this sheet is the two ropes and the plank, and above all what the rope's
SURFACE does.

FORM - everything is stamped dots of one size, nothing is drawn and nothing is filled:
  TWO ROPES, each ONE row of INK dots running top to bottom, hung from one branch a shoulder-width
    apart. A SEAT PLANK between their lower ends: a plain board, INK dots TOUCHING for its edge and
    OPEN inside so the ochre shows through, at most 3 grain lines. 0 knots carved, 0 fringe.
  The plank hangs at a height where a standing child's hip meets it.
🔴 THE ROPE'S SURFACE IS THE CLOCK, and it is spacing and nothing else:
  WET ROPE - the dots along it are CLOSE and even, so the rope reads slick and its twist CANNOT be
    made out. Drops fall from its underside, at most 5, each one WHITE.
  DRY ROPE - the same rope with the dots OPEN, so the twist reads as a coarse ladder up its length.
  Draw the two ropes side by side at one size. That pair is what says a day passed.
🔴 THE HAND HEIGHT IS THE OTHER CLOCK. Draw the rope FOUR TIMES in a row, same length, same size,
  with a plain pair of paws gripping at four heights: 1 shoulder height · 2 a span lower with a
  scuffed streak of INK dots left above the grip · 3 at the very bottom end, the arms straight up
  past the ears · 4 above shoulder height, elbows bent. Nothing else changes between the four.
🔴 A MOVING SWING HAS NO MOTION LINES. Movement is the plank's angle and the ropes' lean, and one
  scooped hollow in the yard earth under it. 0 arcs, 0 streaks, 0 wobble marks.
STATES:
  1 EMPTY AND STILL, ropes hanging plumb, seen from the side.
  2 EMPTY AND SLACK at the bottom of a swing, both ropes leaning the same way.
  3 THE PLANK ALONE, seen from above, showing how narrow it is against two paws.
  4 THE KNOT where a rope meets the branch, close, at most 4 turns.

PLATE: the wet/dry rope pair at one size, then the four hand heights in a row, then states 1-4.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  paws only, for the grip heights) / no gold anywhere / no motion line, arc, streak or blur / no
  lettering or numerals / no continuous drawn line / no gradient, glow or soft edge.
```

### §2.4 Shoes — 🔴 작업표에 없다. 앵커는 이 권들을 이미 알고 있었다

> 앵커 §3 이 통짜 `bare feet` 를 뒤집으며 「**신은 18·21 두 권에만**」이라고 적어 뒀는데 사물
> 후보에는 신이 한 줄도 없다. 18 p3 과 p9 은 **같은 각도·같은 크기**로 발과 신 사이의 틈만
> 견주는 쪽이고, 21 p4 는 **신은 두 발과 맨발 하나**가 한 문턱에 있는 것이 사건이다.

```
PROP SHEET - Shoes   (mina-dotfolk · SCENE token: Shoes)

Three pairs of shoes. They exist in only two books because shoes go on ONLY where the ground hurts
the feet - the stony field and the stone causeway. Everywhere else in this series the feet are bare
and this sheet does not apply.

FORM: a plain thick-soled slip-on shoe, INK dots TOUCHING for its outline and OPEN inside, at most
  3 lines in the whole shoe - one for the sole edge, one for the mouth, one across the instep.
  0 lace, 0 buckle, 0 tread, 0 stitching.
🔴 THREE SIZES, drawn together in one row at one scale - ELDEST : MINA : YOUNGEST = 5 : 4 : 3, the
  same ratio as the children. The step between neighbouring sizes must be obvious at thumbnail.
🔴 THE GAP IS THE PICTURE. Draw these two panels at the SAME size and the SAME high angle so they
  can be laid over each other:
  A FOOT IN THE WRONG SHOE - a foot inside the largest shoe, with a gap at the instep two fingers
    wide and the heel lifted clear of the back. The gap is BARE GROUND, no dots at all, and it must
    be visible at thumbnail size.
  THE SAME FOOT IN ITS OWN SHOE - instep touching, heel down, and NO gap anywhere.
STATES:
  1 THREE PAIRS in a row inside a doorway, in size order, largest left.
  2 THE SAME ROW with the two larger pairs gone - 🔴 the smallest pair left alone in the middle of
    the frame, which is where the absence is read.
  3 ONE SHOE OFF, lying upside down among sharp stones.
  4 ONE SHOE WEDGED between two stones, being pulled by two paws.
  5 TWO SHOES HELD UP side by side by an adult's paws at the same height and depth - the large and
    the small - so the length difference is measured in one look.

PLATE: the three sizes in a row, then the wrong-shoe / own-shoe pair, then states 1-5.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  feet and paws only) / no gold except where a foot is drawn, in which case ONE ankle band is
  allowed on that foot alone / no lettering or numerals / no tread pattern or shine / no
  continuous drawn line / no gradient, glow or soft edge.
```

### §2.5 Kite — 🔴 22권이 작업표에 통째로 없다. 그리고 여기서 앵커가 깨진다

> 대본은 「흙갈 연 ↔ 강청 연」으로 두 연을 가르는데 팔레트에 파랑이 없다. **색을 지우면 22권이
> 안 읽히므로 지우는 대신 옮긴다** — 점 색으로 가른다. `DOT WHITE` 의 정의가 이미
> `water, light, cloth, anything wet or bright` 라, 천으로 만든 연은 애초에 흰 점 자리다.

```
PROP SHEET - Kite   (mina-dotfolk · SCENE token: Kite)

Two kites and their strings. One book is entirely about them and another opens on one, so which
kite belongs to whom must be readable at any size and at any height in the frame.

FORM: a plain four-sided kite with one tail, no bigger than a child's head. Its edge is a row of
  INK dots TOUCHING; the tail is one row of dots with at most 5 short cross ticks.
🔴 THE TWO KITES ARE TOLD APART BY DOT COLOUR, NOT BY HUE - there is no third colour in this book:
  THE ELDER'S KITE is stamped in INK dots, OPEN inside so the ochre shows through.
  MINA'S KITE is stamped in WHITE dots, OPEN inside. Against the bare-ground sky it is the pale
    one, and it is the only bright thing above the horizon.
  Draw them side by side at one size once, so the pair is fixed forever.
🔴 A STRING IS ONE ROW OF INK DOTS and its spacing says its tension: TOUCHING when taut and pulling,
  OPEN when slack. Nothing else marks a pull - 0 speed lines, 0 arcs, 0 vibration marks.
🔴 HEIGHT IN THE FRAME IS RANK. When both are up, one sits plainly above the other and the higher
  one is at the very top corner of the picture, small. A kite at the top of the frame is drawn with
  0 interior marks - edge dots only.
STATES:
  1 FOLDED, carried flat under one arm, side on.
  2 UP AND HELD, string taut, drawn small at the frame's top edge.
  3 TWO UP AT ONCE, INK kite and WHITE kite at different heights, their two strings never crossing.
  4 LOST - a string end running off the frame with no kite on it, and a plain open paw below it
    with ONE short line of INK dots CLOSE across the palm where the rope burned.
  5 CAUGHT IN A FAR TREE - the kite folded over a branch across the river, an INK silhouette with
    0 interior marks, no bigger than a thumbprint.
  6 THREE PAWS ON ONE STRING, large, middling and small stacked down its length in that order.

PLATE: the two kites side by side at one size, then states 1-6.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / 🔴 no blue, green or red
  anywhere - the two kites differ only in dot colour / no character face (plain paws only) / no
  gold anywhere / no lettering or numerals / no motion line, streak or blur / no continuous drawn
  line / no gradient, glow or soft edge.
```

### §2.6 WaterTub — 🔴 마당에서 젖은 것이 여기 하나뿐인 날이 있다

```
PROP SHEET - WaterTub   (mina-dotfolk · SCENE token: WaterTub)

The tub that stands in the yard. Nine books use it - hands are washed at it, a trunk sprays from
it, it is kicked over, and on the driest days it holds the only water in the picture.

FORM: a round wooden tub coming up to a child's chest, INK dots TOUCHING for its rim and outline,
  at most 6 upright stave lines and 2 hoop lines INSIDE, and NO fill. Beside it a gourd dipper
  (§2.7) either standing in it or laid upside down on the earth.
🔴 THE WATER IS A FLAT FIELD OF WHITE DOTS, level, with a hard straight edge at the surface. Its
  height inside the tub is stated on every page as a fraction of the tub's depth: brim · two spans
  · empty. On a dry-river page the tub is THE ONLY PLACE IN THE FRAME WHERE WHITE DOTS GATHER.
🔴 DIRTY WATER RUNNING OFF HANDS IS INK, NOT A COLOUR. Where the WHITE stream and the INK runoff
  meet, the two dot fields interleave along a band EXACTLY 3 DOTS WIDE and no wider - that band is
  the darkest thing in the frame. This is the anchor's rule used at hand size.
🔴 A SPILL IS READ IN SPACING. Where a tub goes over, the wet patch on the earth is INK dots
  TOUCHING at its middle and OPEN towards its rim, one closed shape with a soft-edged spread but
  NO blur - the spacing does the fading.
STATES:
  1 FULL TO THE BRIM, side on, dipper standing in it, WHITE surface flat.
  2 TWO PAWS IN IT, seen from above, the surface still WHITE and unbroken.
  3 A DIPPER POURED OVER A PAW - the WHITE stream above, the INK runoff below, the 3-dot band
    between them, and one INK stain spreading in the earth at the feet.
  4 KICKED OVER - the tub on its side, mouth empty, and the round wet patch as described above,
    wider than the tub is tall.
  5 SET UPRIGHT AND EMPTY - the same tub with no white anywhere inside it.
  6 REFILLED TO THE BRIM, identical to state 1, so 4 and 6 can be laid over each other.

PLATE: states 1-6 at one size, plus a large close-up of the 3-dot band where clean meets dirty.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  paws only) / no gold anywhere / no ripple, glint, sparkle or reflection on the water / no
  lettering or numerals / no continuous drawn line / no gradient, glow or soft edge.
```

### §2.7 Gourd — 🔴 셋이 똑같아야 10권이 성립한다

```
PROP SHEET - Gourd   (mina-dotfolk · SCENE token: Gourd)

The three gourd dippers of the house. Nine books use them. Volume 10 spends four pages measuring
one against another, so THEIR BEING IDENTICAL is the whole reason this sheet exists.

FORM: a dipper cut from a dried gourd - a round bowl and a short straight handle running off it in
  one piece. INK dots TOUCHING for the outline, OPEN inside, at most 3 lines on the whole thing.
  It sits in one paw. 0 carving, 0 binding, 0 grain texture.
🔴 THE THREE ARE THE SAME SIZE AND THE SAME SHAPE. This is the opposite of the bowls (§2.1) and of
  the towels (§2.11): nothing about a dipper says whose it is. Draw the three in a row once to fix
  that, and never vary a rim, a handle length or a depth between them.
🔴 THE WATER INSIDE IS A FIELD OF WHITE DOTS and its level is read only by where that field stops
  against the INK rim. Two dippers set side by side at the same depth must show their two levels at
  the same height, hard-edged, so that "they are the same" is a fact on the page and not a claim.
STATES - drawn from the same eye height at one size so levels can be compared:
  1 THE THREE EMPTY in a row, mouths up.
  2 TWO SIDE BY SIDE, rims touching, both filled to exactly the same level.
  3 TILTED AND POURING - one thin WHITE stream leaving the lip, at most 9 dots long, hard-edged,
    and NOT widening.
  4 UPSIDE DOWN on the earth beside a tub, empty, mouth hidden.
  5 SKIMMING - the dipper dipped only into the top of a jar, taking WHITE water while INK water
    lies below (see §2.8).
  6 SPILLED - the dipper on its back and the water gone, with the earth beneath it INK where it
    soaked in.

PLATE: the three in a row large, then states 2-6, plus a close-up of the handle joint.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  paws only) / no gold anywhere / no ripple or glint / no lettering or numerals / no widening or
  splashing stream / no continuous drawn line / no gradient, glow or soft edge.
```

### §2.8 Jars — 🔴 두 배 차이가 01권의 전부다

```
PROP SHEET - Jars   (mina-dotfolk · SCENE token: Jars)

The water jars. Volume 01 is one child carrying the wrong one, volume 16 is one jar clearing, and
in two other books jars come off a boat as cargo. Two sizes and one lid.

FORM: a wide-mouthed round jar, belly wider than mouth, standing on a small foot. INK dots TOUCHING
  for the outline, OPEN inside, at most 2 lines round the shoulder. 0 glaze, 0 pattern, 0 sheen.
  THE LID is a flat disc a hair wider than the mouth, with one small knob.
🔴 EXACTLY TWO SIZES, AND THE BIG ONE IS TWICE THE SMALL ONE. Draw them side by side at one size to
  fix that ratio. Registers to keep in every panel: carried against the chest, the BIG jar reaches
  from chest to chin and hides half a child's face; the SMALL jar rides flat on the head with the
  arms free.
🔴 WHAT THE WATER INSIDE DOES IS THE REASON FOR THIS SHEET, and it is spacing, not colour:
  MUDDY - INK dots spread EVENLY from the surface to the bottom, no layers, the bottom not visible.
  STIRRED - the same INK dots dragged into one spiral rising from below, drawn ONCE and never
    mirrored.
  SETTLED - a hard horizontal split: WHITE dots above, INK dots below, meeting in a band at most
    3 dots wide. That split is the payoff of volume 16 and must be flat and unmistakable.
  FULL AND CLEAR - WHITE dots to the brim.
STATES:
  1 THE TWO SIZES side by side, empty, at one scale.
  2 THE BIG JAR TIPPED INTO WATER at a step's edge, mouth taking water in.
  3 THE BIG JAR ON ITS SIDE, water running from the mouth in one flat WHITE tongue.
  4 THE SMALL JAR ON A HEAD, seen from the front, one paw resting on it.
  5 LIDDED - the lid on, no water visible at all.
  6 THE FOUR WATER STATES above, drawn as four jars in a row at one size.

PLATE: the two sizes at one scale, the four water states in a row, then states 2-5.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  paws only) / no gold anywhere / no glaze, sheen or highlight / no ripple or reflection /
  no lettering, numerals or maker's mark / no continuous drawn line / no gradient or soft edge.
```

### §2.9 Plate — 🔴 칸 둘이 26권의 셈이다

```
PROP SHEET - Plate   (mina-dotfolk · SCENE token: Plate)

The low eating plate. Five books put food on it, and volume 26 turns entirely on whether one of its
TWO PLACES is full or empty, so the two places are fixed here.

FORM: one shallow round plate, INK dots TOUCHING for the rim, its inside left as BARE GROUND so
  that anything on it reads against light. At most 1 inner rim line. 0 pattern, 0 glaze.
🔴 TWO PLACES, ALWAYS THE SAME TWO, dividing the plate down the middle: LEFT = the rice, a mound of
  WHITE dots CLOSE, the brightest thing on the plate. RIGHT = the leaves, a mound of INK dots
  TOUCHING, the darkest thing on the plate. Never a third place, never swapped.
🔴 AN EMPTY PLACE IS BARE GROUND right through, so an absence is as loud as a presence. Draw the
  four combinations at one size in a row: both full · rice only · leaves only · both empty.
STATES:
  1 THREE PLATES side by side on a low platform, seen from above, all with both places full.
  2 ONE PLATE with the leaf mound PUSHED OUTSIDE THE RIM onto the boards, still whole, and the
    right place bare. 🔴 The moved mound sits exactly between two plates - that position is the
    picture of volume 26.
  3 THE SAME PLATE HELD UP AND TILTED towards the reader, the right place bare and clean.
  4 THREE FLAT LOAVES on the plate instead, no places (see §2.10).
  5 FINISHED - crumbs only, at most 9 INK dots, and one place still showing its bare ground.
  6 LIFTED AND EMPTY, seen from below, nothing on it at all.

PLATE: the four combinations in a row at one size, then states 1-6.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / 🔴 no green anywhere - the
  leaf place is INK / no character face (plain paws only) / no gold anywhere / no steam on this
  sheet (steam belongs to §2.10) / no pattern, glaze or highlight / no lettering or numerals / no
  continuous drawn line / no gradient or soft edge.
```

### §2.10 Flatbread — 🔴 김이 있고 없는 것이 02권의 시계다

```
PROP SHEET - Flatbread   (mina-dotfolk · SCENE token: Flatbread)

The flat loaves. Three books eat them, and in one of them a muddy hand lands on one, so the loaf is
also the surface that a handprint is read on.

FORM: a round flat loaf about as wide as a child's two paws, INK dots OPEN across the whole of it
  so it reads as the BRIGHT thing on a plate - no outline row, its edge is only where the open dots
  stop. At most 3 small blisters, each one dot. 0 scoring, 0 pattern.
🔴 STEAM IS THE CLOCK, and it is countable: EXACTLY THREE short columns of WHITE dots rising from a
  hot loaf, each at most 7 dots, all leaning the same way. A cooled loaf has ZERO. Draw hot and
  cooled side by side at one size - that pair is the only thing that changes between two pages of
  volume 02.
🔴 A MUDDY HANDPRINT IS A SHAPE, NOT A SMUDGE. It is INK dots TOUCHING in the plain outline of a
  child's paw - five fingers, whole - laid on the OPEN dots of the loaf, so it is the darkest thing
  in the frame and instantly readable as a hand. Never a smear, never a spatter.
STATES:
  1 THREE LOAVES on a plate, seen from above, three steam columns each.
  2 THE SAME THREE, cooled, no steam, otherwise identical.
  3 ONE LOAF IN TWO OPEN PAWS, held at chest height, being weighed against another.
  4 TORN - one piece lifted away and the bite-shaped notch left behind matching it in size.
  5 HANDPRINTED - one loaf with the paw shape on it as described above.
  6 CLEAN AGAIN - the same loaf held out with no mark on it anywhere, same size and angle as 5.
  7 CRUMBS - a heap of at most 12 INK dots on a bare plate.

PLATE: hot and cooled side by side, then states 3-7, plus a large close-up of the handprint.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  paws only) / no gold anywhere / no smear, spatter or blur for the handprint / no more or fewer
  than three steam columns on a hot loaf / no lettering or numerals / no continuous drawn line /
  no gradient, glow or soft edge.
```

### §2.11 Cloth — 🔴 크기 셋이 곧 나이 계단이고, 빈 가운데 자리가 06권의 사건이다

```
PROP SHEET - Cloth   (mina-dotfolk · SCENE token: Cloth)

The household cloths - towels, washing, and the one laid on a hot forehead. Ten books use them.
Volume 06 hangs three of them in a row and volume 49 wrings one out in the dark.

FORM: a plain rectangle of cloth, WHITE dots OPEN across it (cloth is bright in this palette) with
  ONE row of INK dots along its hem. No pattern, no fringe, no weave texture.
🔴 THREE SIZES = THE AGE LADDER, 5 : 4 : 3, the same ratio as the children and as the bowls. Drawn
  hanging on a line they read left to right as large, middling, small.
🔴 THE PICTURE OF VOLUME 06 IS A GAP. On the line, LEFT AND RIGHT HUNG AND THE MIDDLE PLACE EMPTY -
  the empty place is bare ground the width of the middling cloth, and the line sags through it.
  Draw that panel and the full row of three at the same size so they can be laid over each other.
🔴 WET AND DRY IS SPACING: a wet cloth hangs long and straight with its dots CLOSE and a drop of
  2-3 WHITE dots at its lowest corner; a dry cloth is the same shape with dots OPEN and no drop.
🔴 SUDS ARE COUNTED, NOT MASSED: three separate WHITE clumps of 3 dots each on a barely-washed
  cloth, growing to a mound that covers a pair of small paws when it is properly washed. That count
  is what volume 06 measures.
THE SOAP: one small INK block with rounded corners, dots TOUCHING, no bigger than a small child's
  palm - its size is only ever read against a paw and against a cloth, so draw it in both.
STATES:
  1 THE THREE SIZES hanging on one line, evenly spaced, dry.
  2 THE SAME LINE, left and right hung, middle place empty.
  3 FIVE HUNG CLOSE TOGETHER indoors across a room, wet, dividing the frame into an upper band and
    a narrow lower one - 🔴 close enough that nothing can be seen through them.
  4 SUDSED IN TWO SMALL PAWS, the mound covering both.
  5 WRUNG - twisted into a rope shape, dots CLOSE, two drops falling from its lowest point.
  6 FOLDED into a squared block.
  7 LAID FLAT on a forehead, seen from the side - a cloth at rest, dots CLOSE, hem line visible.
  8 THE SOAP alone, and the soap being closed into a pair of small paws by a larger pair.

PLATE: the three sizes on a line, the empty-middle panel at the same size, then states 3-8.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  paws and a plain forehead only) / no gold anywhere / no printed pattern, embroidery or fringe /
  no lettering or numerals / no continuous drawn line / no gradient, glow or soft edge.
```

### §2.12 Quilt — 🔴 덮인 몸에는 얼굴이 없다. 누구인지는 발찌가 말한다

```
PROP SHEET - Quilt   (mina-dotfolk · SCENE token: Quilt)

The sleeping quilts. Six books lie under them, and in two of them a whole child disappears into
one, so the LUMP is a character shape.

FORM: one thick quilt, WHITE dots OPEN (it is cloth) with a plain INK hem row all round and at most
  4 long fold rows running its length. 0 patchwork, 0 quilting grid, 0 stitch dots.
🔴 A COVERED BODY IS ONE OUTLINE AND NOTHING ELSE - no face, no limbs, no pressed folds shaping a
  shoulder. The reader knows who it is from ONE thing only: the gold ankle band showing at the
  lower edge. 🔴 That band is the one solid unstamped shape in this series and on this sheet it is
  the ONLY exception to the no-gold rule - draw it once, in state 3, and nowhere else.
🔴 AN EMPTY QUILT KEEPS THE DENT. A quilt someone has left is the same WHITE field with a
  body-sized hollow pressed into it and its far corner turned back - 0 interior marks inside the
  hollow, only the outline of it.
STATES - drawn from the same high angle at one size:
  1 SPREAD FLAT on the floor, hem square, nobody in it.
  2 A LUMP with a head just out of the top and the quilt at the chin.
  3 A FULL LUMP with nothing out of it at all except ONE bare foot at the lower end, gold band on
    its ankle.
  4 FOUR QUILTS in a row, three lumps and one flat - which one is empty must be countable.
  5 THE DENT - two hollows side by side and nobody there, corners turned back.
  6 THROWN OFF - the quilt swept to one side in one piece with the bare floor showing under it, the
    floor's area plainly larger than the quilt's.
  7 PULLED TO THE SHOULDER by a larger paw from off-panel, one edge lifted.

PLATE: states 1-7 at one size, plus a close-up of the hem row and one fold row.

NOT: 🔴 no filled or solid shape anywhere except the single gold ankle band in state 3 / no
  character face / no patchwork, printed pattern or quilting grid / no lettering or numerals / no
  cast shadow on a quilt / no continuous drawn line / no gradient, glow or soft edge.
```

### §2.13 Lamp — 🔴 이 매체의 빛은 번지지 않는다. 흰 점밭이 넓어지고 좁아질 뿐이다

```
PROP SHEET - Lamp   (mina-dotfolk · SCENE token: Lamp)

The oil lamp. Six books use it and three of them count light: a wick turned down, lamps seen across
the river through a window, and one lamp that reaches only as far as two bodies on a lap.

FORM: a small low lamp - a shallow bowl, a short spout and a wick. INK dots TOUCHING for its
  outline, OPEN inside, at most 2 lines. The body is small; it is not the point.
🔴 THE LIGHT IS A FIELD OF WHITE DOTS AND IT HAS AN EDGE. It does not fade, it does not radiate and
  it does not throw rays: it is a patch of WHITE dots CLOSE around the wick, with a hard boundary,
  and outside that boundary the INK of the dark room resumes at once. There is NO halo, NO glow,
  NO beam and NO lit pool bleeding outward.
🔴 THE WICK TURNED DOWN = THE SAME PATCH, SMALLER. Draw the lamp four times in a row at one size
  with the white patch at four widths: full · half · a hand's width · none. That row is the whole
  vocabulary of a night in this series.
🔴 HOW FAR THE LIGHT REACHES IS A CASTING DECISION, NOT A FADE. Whatever the patch covers is stamped
  as usual; whatever it does not is INK dots TOUCHING. A pair of paws working just outside the
  patch is INK - and that is how volume 49 says who is left out.
🔴 THROUGH A WINDOW, a far lamp is a SINGLE WHITE DOT inside an INK field, and its size never
  changes between books. Draw a window frame with 4, 2, 1 and 0 of those dots - that count is the
  clock of volume 31 and it must be countable at thumbnail size.
STATES:
  1 THE LAMP UNLIT, daylight, no white anywhere.
  2 LIT ON A FLOOR at night, full patch, an INK room round it.
  3 A PAW TURNING THE WICK DOWN, patch at half.
  4 MOVED ONTO A SILL, the patch now against the window instead of the floor.
  5 THE FOUR FAR-LAMP COUNTS in one window frame, 4 / 2 / 1 / 0.
  6 THE REACH - two bodies inside the patch and one pair of paws just outside it, INK.

PLATE: the four patch widths in a row at one size, the four far-lamp counts, then states 1-6.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / 🔴 no glow, halo, ray, beam,
  lens flare or lit pool on the ground / no character face (plain paws only) / no gold anywhere /
  no flame drawn as a shape / no lettering or numerals / no continuous drawn line / no gradient or
  soft edge.
```

### §2.14 Baskets — 🔴 셋이 같은 크기다. 그릇과 정반대다

```
PROP SHEET - Baskets   (mina-dotfolk · SCENE token: Baskets)

The carrying baskets. Volume 11 hands out three of them and volume 33 keeps one under the sitting
platform for the toys. Two things live here: three IDENTICAL gathering baskets and one household
basket.

FORM: an oval basket with ONE arched handle. The weave is at most 7 crossing INK rows, all the same
  and all running the same way - never a drawn basketweave texture. INK dots TOUCHING for the rim,
  OPEN for the body.
🔴 THE THREE GATHERING BASKETS ARE THE SAME SIZE. That is the point of volume 11: the bowls (§2.1)
  and the towels (§2.11) are a size ladder, so a reader expects one here too - and its absence is
  what makes "everyone's is equally empty" and later "everyone's is equally full" readable. Never
  give one of them a different size, handle or rim.
🔴 WHAT IS INSIDE IS READ IN SPACING, NOT IN PILE HEIGHT: a bare bottom shows the ochre through OPEN
  dots · one layer of shells is a scatter of WHITE dots on that ground · full to the brim is INK
  dots TOUCHING, the darkest area in the frame (a loaded basket is a dark hole, not a heap).
THE HOUSEHOLD BASKET is the same drawing, one size larger, and it lives on its side under boards
  with its mouth facing the reader. Its mouth rim is INK TOUCHING - the darkest ring on that page.
STATES - all at one size:
  1 THE THREE EMPTY, side by side, handles up, from the side.
  2 ONE EMPTY seen from straight above - a plain oval hole with the ground showing.
  3 ONE WITH A SINGLE LAYER of white shells lying flat, none overlapping.
  4 ONE FULL TO THE BRIM, INK TOUCHING inside.
  5 THE THREE LIFTED at three heights - large, middling and small paws on the rims, the baskets
    identical and only the heights stepping.
  6 THE HOUSEHOLD BASKET on its side under boards, mouth to the reader, empty.
  7 THE SAME, filled to the mouth, pushed all the way back under.

PLATE: the three at one size, then states 2-7, plus a close-up of the handle joint and the 7 rows.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  paws only) / no gold anywhere / no woven texture beyond the 7 rows / no size difference between
  the three gathering baskets / no lettering or numerals / no continuous drawn line / no gradient
  or soft edge.
```

### §2.15 Beads — 🔴 세는 것이 전부고, 문턱 밑은 매체가 가리킨다

```
PROP SHEET - Beads   (mina-dotfolk · SCENE token: Beads)

The beads and the thread. One book, eight of its ten pages, and every one of those pages is a
count: threaded, spilled, hunted, threaded again.

FORM: ONE BEAD IS A SMALL CLUSTER OF INK DOTS SET TOUCHING - a solid-looking round no wider than
  three dots, and all beads are the same size forever. 🔴 They carry NO colour; volume 12's own
  count is what tells them apart from anything else on the floor.
  THE THREAD is ONE row of INK dots, TOUCHING when pulled straight and OPEN where it lies slack.
🔴 THE NUMBERS ARE FIXED AND MUST BE COUNTABLE AT THUMBNAIL SIZE: four threaded · six threaded ·
  the thread empty with beads leaving its loose end · six left on a short string · and a full
  circle that closes exactly round a neck. Draw those five as five separate panels at one size.
🔴 A HEAP IS NOT A COUNT. In a bowl the beads become one mass of INK dots TOUCHING with at most 9
  separate rounds breaking its top edge - the reader counts only what has been threaded.
🔴 THE THRESHOLD GAP IS WHERE THE MEDIUM POINTS. A dark gap under a doorsill is INK dots OPEN, so
  the eye can see into it; the two or three beads inside it are INK dots TOUCHING, so they are
  darker than the dark they sit in. That inversion is the find, and it cannot be done with light.
STATES:
  1 A HEAP IN A BOWL, seen from above.
  2 FOUR ON A THREAD held between two paws.
  3 SIX ON A THREAD, same paws, same size as 2.
  4 THE LOOSE END - the thread falling, beads leaving it one at a time, drawn as a spaced row and
    NOT as a scatter.
  5 SCATTERED ON A FLOOR - separate rounds spread evenly, some under a hanging hem, some at a sill.
  6 THE THRESHOLD GAP close up, OPEN dark with TOUCHING beads inside it.
  7 THE CLOSED CIRCLE round a plain neck silhouette, the string ends meeting.

PLATE: the five counts in a row at one size, then states 1, 4, 5, 6, 7.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / 🔴 no blue, green or red -
  a bead has no colour in this book / no character face (a plain neck silhouette only) / no gold
  anywhere / no shine, sparkle or highlight on a bead / no lettering or numerals / no continuous
  drawn line / no gradient or soft edge.
```

### §2.16 Bundle — 🔴 매듭 하나만 다르다. 그게 누가 묶었는지다

```
PROP SHEET - Bundle   (mina-dotfolk · SCENE token: Bundle)

The faggots of firewood. One book, five of its ten pages: gathered, bound, kicked apart, gathered
again. The dry sticks on the river bed are its raw material.

FORM: dry branches, each ONE row of INK dots, straight or with a single crook, in TWO thicknesses
  that are plainly different - thick ones as wide as three dots, thin ones one dot wide. A bundle
  is those sticks laid parallel and tied ONCE at the middle with a cord (one row of INK dots,
  4 turns).
🔴 THREE SIZES = 5 : 4 : 3 again, standing in a row, and 🔴 THE SMALLEST ONE'S KNOT IS DIFFERENT -
  crooked and plainly too big for the bundle. Nothing else on the sheet varies. That knot is the
  only thing that says who tied it, so it must survive at thumbnail size.
🔴 SCATTERED IS A FAN, NOT A MESS. Sticks pushed apart by a foot spread as a fan from one point,
  all pointing away from it, with the freed cord lying in a loose curl across them. Never a random
  pile - the fan is what says which direction the force came from.
STATES:
  1 LOOSE STICKS on the ground, thick and thin mixed, covering the lower half of the frame.
  2 A SMALL PILE of exactly three sticks, with a cord still coiled and unused beside it.
  3 ONE BOUND BUNDLE held at chest height in two paws, its width read against the chest.
  4 THE FAN - a bundle just kicked apart, cord curling on top.
  5 THE THREE SIZES standing in a row on yard earth, largest left, the small one's knot crooked.
  6 SORTED - thin sticks laid parallel in one neat set and thick ones stacked apart, so which pile
    is for whom is read by stick thickness alone.

PLATE: the three sizes in a row at one size, then states 1-4 and 6, plus a close-up of the crooked
  knot beside a correct one.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  paws and one plain foot only) / no gold anywhere / no leaves on the sticks / no lettering or
  numerals / no random scatter where a fan is called for / no continuous drawn line / no gradient
  or soft edge.
```

### §2.17 MarketBundle — 🔴 05권의 아픔은 세 번째 자리에 손이 안 오는 것이다

```
PROP SHEET - MarketBundle   (mina-dotfolk · SCENE token: MarketBundle)

The cloth bundle that comes back from market, and the same bundles stacked as cargo off a boat.
Four books. Volume 05 opens one.

FORM: a square of cloth gathered up and knotted at the top - WHITE dots OPEN for the cloth (it is
  cloth), one INK row along the hem and one at the knot. Its shape is a plain rounded lump; what is
  inside is never drawn through it.
🔴 OPENED, IT IS A FLAT SQUARE WITH THINGS LAID ON IT IN A ROW, and the row has THREE PLACES evenly
  spaced. In volume 05, a paw comes into the first place and a paw into the second, and 🔴 THE THIRD
  PLACE HAS NOTHING OVER IT AND NOTHING IN IT - bare cloth. Draw that panel exactly: two paws, one
  empty place, same spacing. That gap is the whole page.
STACKED AS CARGO: at most 3 bundles and 2 jars set down on a plank in one row, none overlapping,
  each a plain outline with 0 interior marks - cargo is scenery and never a finished thing.
STATES:
  1 TIED AND CARRIED under one arm, side on.
  2 STANDING BY A DOORWAY, empty and slack, its cloth pooled.
  3 OPENED FLAT with three places: a skein of thread in the first, three small sweets in the
    second, and the third bare. Two paws are in - none in the third.
  4 THE SAME OPENED SQUARE with all three places bare.
  5 CARGO - three bundles and two jars in a row on a jetty plank, outlines only.
  6 FULL AND HEAVY, carried in one paw, the paw's arm plainly pulled down and the body leaning the
    other way.

PLATE: states 1-6 at one size, plus a close-up of the knot at the top.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  paws only) / no gold anywhere / nothing drawn showing through the cloth / no lettering, numerals
  or markings on a bundle / no continuous drawn line / no gradient, glow or soft edge.
```

### §2.18 Boat — 🔴 뱃전 높이가 이 물건의 규격이다

```
PROP SHEET - Boat   (mina-dotfolk · SCENE token: Boat)

The wooden river boat and its oar. Six books. It carries a family across, it stands beached in the
sand for a whole volume, and once it is drawn in the dirt beside itself.
🔴 When the camera goes INSIDE it, it is a stage - see the note to §1 about a missing Ferry sheet.
  This sheet is the hull seen from outside.

FORM: a plain flat-bottomed wooden boat, INK dots TOUCHING for its outline and OPEN inside, at most
  6 plank rows along the hull and 3 across the bottom. 0 carving, 0 nameplate, 0 rope coil.
  THE OAR is one long straight shaft with a flat blade, INK, at most 2 lines, and it is as long as
  an adult is tall - draw it once beside a plain adult silhouette to fix that.
🔴 THE GUNWALE HEIGHT IS THE REGISTER AND IT IS FIXED: beached on level sand, the gunwale comes to
  the YOUNGEST child's chest, to Mina's waist and to the eldest's hip. Every panel keeps that.
🔴 A BEACHED BOAT IS DUG IN. Its bottom is buried a hand's depth in the sand and a ridge of pushed
  sand runs all round it - INK dots CLOSE for the ridge, so that the boat plainly cannot slide. Draw
  that ridge in every beached panel; without it the boat looks like it is floating on dry ground.
🔴 A CROWD IN A BOAT IS AT MOST 7 DOT-OUTLINES with 0 faces and 0 hands, filled to the gunwale, and
  no repeat mirrors its neighbour. A boat that has left is drawn SMALL with 0 interior marks, and
  the change of its size between two pages is how time is measured.
STATES:
  1 BEACHED AND EMPTY, side on, sand ridge round it, water far off at the frame's edge.
  2 THE SAME BOAT WITH THREE CHILDREN'S HEADS beside it at the three heights, to fix the gunwale.
  3 EMPTY WITH WATER standing in its bottom - a flat WHITE field inside the hull, hard-edged.
  4 CROWDED - adult dot-outlines to the gunwale, at most 7, from the shore.
  5 SMALL AND FAR - the same boat mid-river, an outline the size of a thumbnail, 0 interior marks.
  6 NOSING ONTO DRY EARTH - the bow touching soil and pushing one ridge of it aside.
  7 THE OAR ALONE, laid flat across the frame, beside an adult silhouette for length.

PLATE: states 1-7 at one size, plus the gunwale-height panel drawn large.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  dot-outlines only) / no gold anywhere / no ripple, wake, glint or reflection / no lettering,
  numerals or names on the hull / no continuous drawn line / no gradient, glow or soft edge.
```

### §2.19 RiverStones — 🔴 흰 표시 돌이 잠기면 자가 사라진다. 그게 39권이다

```
PROP SHEET - RiverStones   (mina-dotfolk · SCENE token: RiverStones)

The stones of the river. Six books use them at three sizes: flipped over to find shells, stacked
into a tower, and laid out as counters. The stones lying about belong to the RiverBed stage sheet -
THIS sheet fixes the one stone's size, its wet ring, and the order of the stack.

FORM: a flat rounded river stone, INK dots TOUCHING for the edge and OPEN inside, 0 speckle,
  0 crack, 0 texture rows.
🔴 THREE SIZES, drawn together in one row at one scale:
  THE FLIPPING STONE - takes both paws to lift, as wide as a child's chest.
  THE STACKING STONE - sits flat in one open palm, edge to edge.
  THE PEBBLE - a counter, no wider than one finger; several are laid out at a time.
🔴 A STONE THAT HAS BEEN UNDER WATER CARRIES ONE RING: a single row of INK dots round it where the
  wet edge stopped drying. One ring, never two, and never a wash of tone.
🔴 THE TOWER IS ORDERED: biggest at the bottom, smallest on top, and ONE gap in the middle exactly
  the size of the stone in the hand. Draw the tower with the gap and the same tower complete, at
  one size, so the two can be laid over each other. The tower stands to a kneeling child's knee.
🔴 THE MARKER STONE IS WHITE. One stone set into each stair tread is stamped in WHITE dots - the
  only white stone in the series. 🔴 When water reaches it, WHITE water covers WHITE stone and THE
  GAUGE DISAPPEARS: draw a marker stone dry, half-covered and gone, at one size. That vanishing is
  the picture of volume 39 and it works only because the two are the same dots.
STATES:
  1 THE THREE SIZES in a row at one scale.
  2 ONE FLIPPING STONE lifted on its edge by two paws, wet ground and a few shells beneath it.
  3 ONE STACKING STONE flat on an open palm.
  4 THE TOWER with the middle gap · THE TOWER complete, side by side, same size.
  5 PEBBLES laid out in a row of six on a stair tread, evenly spaced.
  6 THE MARKER STONE dry / half-covered / gone, three panels at one size.
  7 SUBMERGED STONES - several flat stones under a WHITE water field, their outlines still hard and
    unbent, no distortion of any kind.

PLATE: the three sizes, the tower pair, the marker-stone trio, then states 2, 3, 5, 7.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  paws only) / no gold anywhere / no speckle, moss or crack texture / no bending or rippling of a
  submerged stone's outline / no lettering or numerals / no continuous drawn line / no gradient or
  soft edge.
```

### §2.20 ClayCows — 🔴 소마다 찍힌 손자국 하나가 03권의 착지다

```
PROP SHEET - ClayCows   (mina-dotfolk · SCENE token: ClayCows)

The little clay cows moulded on the river mud. One book, nine of its ten pages: one cow, two, then
three in a short row, then twelve in a long one. The mud flat itself belongs to the RiverBed stage
sheet - this sheet is what is made from it.

FORM: a small four-legged cow small enough to stand in two paws, INK dots TOUCHING for its outline
  and OPEN inside so the ochre shows. Its shape is thick and blunt - a body, four stub legs, a head
  and two short horns, and NOTHING else: 0 eyes, 0 mouth, 0 tail hair, 0 markings. It is a made
  thing, not an animal (the real goat is §2.22 and it looks nothing like this).
🔴 EVERY COW CARRIES ONE ROUND THUMBPRINT PRESSED INTO ITS FLANK - a small ring of INK dots
  TOUCHING, the same place on every cow, on the side facing the reader. 🔴 That mark is the whole
  ending of volume 03: it says a second pair of hands was there. It must be countable at thumbnail
  size and it must be on ALL of them.
🔴 THE ROW IS A LENGTH, AND ITS LENGTH IS THE STORY: draw the row of THREE and the row of TWELVE at
  the SAME scale, both running the same way, so the short row can be laid against the long one.
  A row of twelve runs a full frame diagonal; a row of three is comically short beside it.
🔴 WET AND DRIED CLAY IS SPACING: wet clay is INK dots TOUCHING and heavy; clay dried on the back of
  a paw is INK dots CLOSE broken by a net of hairline gaps, and it flakes at the edges.
STATES:
  1 A LUMP of wet clay, torn from the flat, in two paws.
  2 ONE COW standing in two paws, held at eye height.
  3 TWO COWS standing on the mud side by side.
  4 THE ROW OF THREE, side on, at the same scale as state 5.
  5 THE ROW OF TWELVE, side on, running the frame diagonal.
  6 A COW LARGE, close, showing the thumbprint clearly.
  7 A PAW with dried cracked clay on its back.

PLATE: rows of three and twelve at one scale one above the other, then states 1, 2, 6, 7.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no face or eye on a clay
  cow / no character face (plain paws only) / no gold anywhere / no gloss, wetness or reflection on
  the clay / no lettering or numerals / no continuous drawn line / no gradient or soft edge.
```

### §2.21 FlowerPots — 🔴 셋이 똑같고, 다른 것은 점 간격뿐이다

```
PROP SHEET - FlowerPots   (mina-dotfolk · SCENE token: FlowerPots)

The three pots the children plant in. One book, five of its ten pages. The whole volume is one
comparison, and the medium does it alone: nothing changes but how tightly the soil is dotted.

FORM: a plain round-mouthed earthen pot, knee high to a crouching child, INK dots TOUCHING for the
  rim and outline, OPEN for the body, 1 line under the rim. The three are IDENTICAL in size, shape
  and position - they stand in a row at even spacing with their rims at one height.
🔴 THE SOIL IS THE WHOLE SHEET, AND IT IS SPACING ONLY:
  WATERED SOIL - INK dots CLOSE, flat to the rim, and the surface reads heavy.
  DRY SOIL - the SAME area with the dots WIDE, so the ochre ground floods through and it reads pale
    and loose. 🔴 There is no colour change, no crumb texture and no crack drawn - the gap between
    dots IS the dryness.
  Draw the two soil surfaces side by side at one size. That pair is volume 10.
🔴 WATER GOING INTO DRY SOIL SPREADS AS A DISC: a ring of INK dots CLOSE growing outward from where
  the stream lands, with a hard edge, inside a field that is still WIDE. Water lost into cracked
  yard earth does the opposite - it runs along the crack rows and leaves the field between them
  unchanged. Those two behaviours must not be mixed up; they are the volume's two halves.
🔴 THE SPROUT IS THE ONE FINISHED THING ON ITS PAGE: a single upright shoot with two small leaves,
  INK dots TOUCHING, no taller than a finger, standing out of soil dotted CLOSE. Nothing else in
  that frame is finished.
STATES - all three pots drawn at one size and one angle:
  1 THREE POTS, all soil dotted CLOSE, nothing growing.
  2 THREE POTS, left and right CLOSE, MIDDLE WIDE - the one that differs is the middle one.
  3 A FINGER PRESSED INTO DRY SOIL, close, with soil crumbling away and no dent left behind.
  4 A DIPPER POURING onto the middle pot, the disc spreading.
  5 THE MIDDLE POT with the sprout, soil CLOSE, the other two out of focus behind (fewer dots).

PLATE: the wet/dry soil pair at one size, then states 1-5.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  paws only) / no gold anywhere / no colour or tone change between wet and dry soil - spacing only
  / no crumb, gravel or crack texture drawn inside a pot / no lettering or numerals / no continuous
  drawn line / no gradient or soft edge.
```

### §2.22 Goat — 🔴 줄이 팽팽하냐 늘어졌느냐가 09권의 처음과 끝이다

```
PROP SHEET - Goat   (mina-dotfolk · SCENE token: Goat)

The village goat. Four books. Volume 09 is one long tug of war with it and ends with the rope
slack and the goat following anyway, so THE ROPE'S TENSION is what this sheet has to settle.

FORM: a goat on four legs, INK dots TOUCHING for the outline and OPEN inside so the ochre shows -
  the same dot language as the elephants, because the anchor gives animals no other treatment. It
  comes to a child's chest. Two short back-curved horns, a short beard, a stub tail, hard hooves.
  0 clothes, 0 hands - it is an animal and not a member of the cast.
🔴 THE LEAD IS ONE ROW OF INK DOTS and its spacing is the whole story: TOUCHING and dead straight
  when it is pulled, OPEN and hanging in a slack curve when it is not. Draw the two at one size,
  the goat and the child in the same position in both - only the rope changing. That pair is the
  first and last page of volume 09.
🔴 WHO MOVED IS WRITTEN ON THE GROUND, NOT IN THE POSE. Two dragged furrows of INK dots behind the
  puller's heels and NOTHING at all in front of the goat's hooves. Never draw strain lines,
  motion arcs or effort marks on either body.
🔴 A GOAT EATING IS THE STILLEST THING ON THE PAGE: head down, jaws together, 0 motion marks, with
  at most 5 loose leaf shapes scattered at its hooves.
STATES:
  1 STANDING, side on, lead slack and curving to the ground.
  2 THE SAME, lead taut and straight across the frame, neck pulled back, forelegs braced.
  3 HEAD DOWN GRAZING, leaves at the hooves.
  4 THE MUZZLE REACHING towards an open palm with a handful of grass - a finger's width between
    them, and the lead in the other paw plainly slack.
  5 WALKING BEHIND, following a raised handful, the lead hanging in a loop that touches the ground.
  6 ONE FOREHOOF planted on a small wooden object, the object half hidden under it.
  7 A TETHER POST with the rope's free end lying coiled beside it, no goat.

PLATE: the taut/slack pair at one size, then states 1, 3, 4, 6, 7, plus one large head with horns.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no clothes or hands on the
  goat / no gold anywhere / no motion line, strain mark or effort arc / no lettering or numerals /
  no continuous drawn line / no gradient, glow or soft edge.
```

### §2.23 Buffalo — 🔴 일곱이 앵커의 반복 상한이다. 여덟째를 그리면 규칙이 깨진다

```
PROP SHEET - Buffalo   (mina-dotfolk · SCENE token: Buffalo)

The water buffalo herd that crosses the village lane. One book, six of its ten pages, and for four
of them the herd IS the wall the story is about.

FORM: a heavy four-legged buffalo, INK dots TOUCHING for the outline and OPEN inside. Two wide
  side-curving horns. 🔴 NO FACE MARKS OF ANY KIND - no eye, no nostril, no mouth line. They are
  dot outlines and nothing more; the reader must never read one as a character.
  Standing beside a child, a buffalo's back is above the child's head and its belly is at the
  child's eye height.
🔴 SEVEN, AND NEVER MORE. The anchor caps a crowd at 7 dot-outlines and this herd is exactly that
  cap, so the count is the ceiling and not an approximation. 🔴 NO ANIMAL MIRRORS ITS NEIGHBOUR:
  vary the head height and leg positions along the row so no two are the same shape.
🔴 THE HERD IS DRAWN AS LEGS. From a child's eye height the bodies are cut off by the frame's top
  and what fills the picture is a colonnade of legs - draw the leg count down as the herd passes:
  five animals' legs · three · one · none, four panels at one size. That count is the volume's clock
  and it must be countable at thumbnail.
🔴 DUST IS BRIGHT: at most 5 WHITE dots set WIDE at each hoof as it lands, and nothing else marks
  movement - 0 motion lines, 0 speed streaks, 0 blurred legs.
  Hoofprints left behind are small INK dots CLOSE in two rows crossing the lane.
STATES:
  1 THE ROW OF SEVEN crossing the frame, seen from above and behind, none mirrored.
  2 ONE BUFFALO passing close, seen from ground level - body filling the frame, a child's face no
    bigger than a palm at the lower corner.
  3 THE COLONNADE - legs of five animals, with a gap between two of them showing the far side.
  4 THE SAME with three animals' legs · with one · with none, at one size.
  5 THE LAST TAIL leaving the frame edge, and hoofprints filling the lane behind.

PLATE: the four leg counts in a row at one size, then states 1, 2, 5, plus one buffalo large.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / 🔴 no eye, nostril or mouth
  on a buffalo / no clothes or hands / no more than seven animals / no mirrored repeat / no gold
  anywhere / no motion line or blur / no lettering or numerals / no gradient, glow or soft edge.
```

### §2.24 Top — 🔴 도는 팽이에는 선을 안 그린다. 기울기와 파인 자국뿐이다

```
PROP SHEET - Top   (mina-dotfolk · SCENE token: Top)

The wooden spinning top. Three books: one spun on a floor after a meal, one cracked under a hoof
and bound back together, one spun on the dirt to make a stranger into a friend.

FORM: a small wooden top - a round shoulder tapering to a point, no wider than a paw. INK dots
  TOUCHING for the outline, OPEN inside, at most 2 rings. Its cord is one row of INK dots.
🔴 A SPINNING TOP HAS NO MOTION LINES. It is drawn LEANING off vertical, with a small round scooped
  hollow under its point where it has bitten the ground - INK dots CLOSE - and nothing else. 0
  arcs, 0 streaks, 0 doubled outlines, 0 blur. A stopped top lies flat on its side.
🔴 THE CRACK IS THE OTHER THING THIS SHEET SETTLES: one hard split running from the shoulder down
  the side, a row of INK dots TOUCHING, wide enough to see at thumbnail. Bound, the cord is wound
  round the waist in COUNTABLE turns - draw four turns and six turns as two panels, because that
  count is what says how badly it was mended.
STATES - all at one size:
  1 THE TOP AT REST, upright, cord coiled beside it.
  2 SPINNING - leaning, hollow beneath, nothing else.
  3 FALLEN, flat on its side.
  4 UNDER A HOOF - half hidden beneath a buffalo-sized hoof, the crack showing on the exposed side.
  5 BOUND - cord wound four turns round the waist over the crack.
  6 BOUND HARDER - the same top, six turns.
  7 THE CORD ALONE, coiled, beside the top.

PLATE: states 1-7 at one size, plus a close-up of the split and one wound waist.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no motion line, spin arc,
  doubled outline or blur / no character face (plain paws only) / no gold anywhere / no lettering,
  numerals or painted rings / no continuous drawn line / no gradient, glow or soft edge.
```

### §2.25 WoodenDoll — 🔴 47권은 이 인형 하나를 양쪽에서 당기는 열 쪽이다

```
PROP SHEET - WoodenDoll   (mina-dotfolk · SCENE token: WoodenDoll)

The little wooden figure. Three books, and in one of them it is pulled from both ends until a tub
goes over. Two of them stand side by side on a stair tread in another book.

FORM: a small carved figure that stands in one paw - a plain body, a head, two straight arms and
  two straight legs, no bigger than a hand span. INK dots TOUCHING for the outline and OPEN inside.
  🔴 IT HAS NO FACE - the anchor gives the single solid eye dot to the cast only, and a doll with
  eyes becomes a character. 0 eyes, 0 mouth, 0 clothes, 0 carving lines beyond 3.
🔴 IT MUST BE READABLE AS ONE OBJECT PULLED AT TWO ENDS: draw it held by a leg on one side and the
  body on the other, both grips visible, the doll straight and NOT bending. Wood does not stretch -
  the strain is in the two bodies, never in the doll.
🔴 MUD ON IT IS A SHAPE THAT COMES OFF. Half sunk at the edge of a wet patch, the buried part is
  simply not drawn; wiped on a sleeve, the mud that leaves it is at most 5 separate INK crumbs
  falling, drawn as separate dots and never as a cloud.
STATES - all at one size:
  1 THE DOLL ALONE, standing upright, front on.
  2 THE SAME, lying flat, seen from above.
  3 PULLED - a paw on one leg and a paw on the body, both arms straight, the doll rigid.
  4 IN THE AIR, free of both paws, level, no motion lines behind it.
  5 HALF SUNK in mud at the rim of a wet patch, its upper half clean.
  6 BEING WIPED on a forearm, crumbs falling.
  7 STOOD UP AND WALKED across dry earth, leaving a row of small paired dents behind it.
  8 TWO DOLLS side by side on a stair tread with six pebbles laid out beside them.

PLATE: states 1-8 at one size, plus one doll drawn large enough to count its 3 carving lines.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / 🔴 no face, eye or mouth on
  the doll / no character face (plain paws only) / no gold anywhere / no bending or stretching of
  the doll under a pull / no motion line or blur / no lettering or numerals / no gradient or soft
  edge.
```

### §2.26 Trousers — 🔴 구멍 둘과 다리 둘, 그게 34권의 셈 전부다

```
PROP SHEET - Trousers   (mina-dotfolk · SCENE token: Trousers)

The loose trousers a child learns to put on. One book, seven of its ten pages, and every one of
those pages is the same count: two holes, two legs.

FORM: plain loose trousers with a drawstring waist - WHITE dots OPEN across the cloth (cloth is
  bright here) with ONE row of INK dots at the waist and one at each cuff. No pockets, no pattern,
  no seams beyond those three rows.
🔴 THE TWO LEG HOLES ARE THE SHEET. Laid flat and seen from straight above, the trousers show TWO
  openings, side by side, THE SAME SIZE, both facing the reader as plain rounded holes of bare
  GROUND - no dots inside them at all. Their bare ground is what makes them countable.
🔴 THE WRONG STATE AND THE RIGHT STATE MUST BE DRAWN AT THE SAME SIZE AND ANGLE so they can be laid
  over each other:
  WRONG - both legs together inside ONE hole, and 🔴 the other hole FLAT AND EMPTY beside it at the
    same depth. The empty hole is the point; if it is hidden the page says nothing.
  RIGHT - one leg through each hole, the two legs at the same angle, the waist gathered up.
🔴 THE COUNT IS SHOWN TWICE, NOT ONCE: two holes above and two legs below in the same frame, at the
  same spacing, so a reader crossing from one to the other does the sum without being told.
STATES:
  1 LAID FLAT, from above, both holes open and equal.
  2 WRONG - two legs in one hole, the other hole flat and empty, from above.
  3 RIGHT - one leg through each, seen from the side, both cuffs at the same height.
  4 PULLED UP - the waist gripped in two paws and drawn to the hips, elbows out.
  5 FOLDED into a squared block on a shelf.
  6 THE COUNTING PANEL - the two holes across the top of the frame and two bare legs across the
    bottom, evenly spaced, nothing else in the picture.

PLATE: the wrong/right pair at one size, then states 1, 4, 5, 6.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  legs and paws only) / no gold except ONE ankle band where a bare ankle is drawn / no pattern,
  pocket or printed cloth / no lettering or numerals / no continuous drawn line / no gradient or
  soft edge.
```

### §2.27 Fruit — 🔴 먹는 것과 안 먹는 것을 한 장에 놓는다

```
PROP SHEET - Fruit   (mina-dotfolk · SCENE token: Fruit)

The round fruit of the yard tree, the one found on the river mud, and a basket of them at market.
Three books. 🔴 And the thing that is NOT fruit lives on this sheet too, because volume 38 is one
long comparison between them and the comparison only works if their sizes were decided together.

FORM: one round fruit that sits in a paw, INK dots TOUCHING all over so it is the DARKEST thing in
  its frame - on a branch, on mud or on a plate. One short stem line. 0 leaf veins, 0 bloom,
  0 highlight. 🔴 IT CARRIES NO COLOUR - the SCENE calls it green in places, but the same SCENE
  renders it "먹점을 닿게" (INK, touching) and that rendering is what holds. There is no green here.
🔴 CUT IN TWO, THE INSIDE IS BRIGHTER THAN THE SKIN: the cut face is INK dots OPEN, so the pale
  ochre floods through, against the TOUCHING dots of the skin. 🔴 The two halves must be visibly
  equal - draw them side by side at one size and at the same depth so a four-year-old can see that
  neither is bigger. That equality is the last page of volume 43.
🔴 THE WHITE LUMP IS THE ONE THING ON THIS SHEET STAMPED IN WHITE: a soft rounded lump on wet earth,
  WHITE dots CLOSE, no bigger than the fruit and drawn BESIDE one at the same size. It has no stem,
  no skin line and no shape a fruit has. In this whole series bright means water, light or cloth -
  so a bright thing sitting in the mud is wrong on sight, which is exactly the lesson, and it is why
  it must never be tidied up into a mushroom or a flower.
STATES - all at one scale:
  1 THREE FRUIT at a branch tip, hanging, spaced.
  2 TWO left on the branch after one is taken - the count must be plain against state 1.
  3 ONE IN AN OPEN PAW, held at chest height.
  4 HALVED - the two pieces side by side, equal, cut faces towards the reader.
  5 ON MUD - one fruit half pressed into wet earth with a round dent beside it where it lay.
  6 THE WHITE LUMP on the same mud, drawn beside a fruit at the same size.
  7 A BASKET OF THEM at market - the basket's inside INK TOUCHING, at most 9 rounds breaking the
    top edge (see §2.14).

PLATE: states 1-7 at one scale, plus states 4 and 6 drawn large side by side.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / 🔴 no green, red or any hue
  - the fruit is INK and the lump is WHITE / no character face (plain paws only) / no gold anywhere
  / no bloom, sheen or dew / no lettering or numerals / no continuous drawn line / no gradient or
  soft edge.
```

### §2.28 TreeBranch — 🔴 자리로는 못 그린다. 가지가 활이 되어야 43권이 끝난다

> 마당 큰 나무 자체는 `House` 의 붙박이다. 그런데 43 은 그 나무의 **가지 하나가 코에 감겨 활처럼
> 휘었다 튀어 오르는 것**이 일곱 쪽이라, 「나무가 거기 있다」로는 못 그린다.
> 🔴 앵커가 `THE TRUNK STAYS A TRUNK` 로 「코는 높은 것을 감아 내릴 뿐 물건을 집거나 쓰지 않는다」고
> 못 박아 뒀는데, **이 권이 바로 그 「감아 내리는」 쪽**이다. 유일하게 코가 일하는 권이므로 시트가
> 그 동작을 확정해야 다른 권으로 새지 않는다.

```
PROP SHEET - TreeBranch   (mina-dotfolk · SCENE token: TreeBranch)

One low branch of the yard tree, and what it does when a trunk is wound round it. One book, seven
of its ten pages. The tree belongs to the House stage sheet; this sheet is the branch's five shapes.

FORM: a single branch running out of frame at one end, INK dots TOUCHING along its length and
  thinning towards the tip, with at most 3 side twigs and ONE cluster of leaves near the end - the
  leaves are one flat INK mass with 0 individual leaf shapes. At its tip hang the fruit (§2.27).
🔴 FIVE SHAPES, DRAWN IN A ROW AT ONE SIZE FROM THE SAME SIDE VIEW. This row is the sheet:
  1 AT REST - straight out, level, fruit at the top of the frame.
  2 HOOKED AT THE VERY TIP - a trunk curled once round the last hand's length of it; the branch has
    barely moved and the coil is plainly shallow.
  3 SLIPPING - the coil opening, the trunk straightening, the branch springing back up and the
    fruit swinging. 🔴 The trunk itself shows the loss: a coil half unwound, and nothing else says
    it - 0 motion lines.
  4 WRAPPED TWICE AT THE MIDDLE - the coil plainly thicker and further in along the branch than in
    2. The branch has still not moved. That difference in WHERE and HOW MANY turns is the volume's
    whole discovery.
  5 THE BOW - the branch drawn down into one long arc that crosses the frame diagonally, its tip and
    fruit at a standing child's eye height. 🔴 The arc's depth is set by that: whatever it takes to
    bring the fruit to the eyes.
🔴 SPRUNG BACK is state 1 with the leaf mass leaning one way and one fruit missing - never a
  vibration line, never a doubled branch, never an arc of dots trailing it.
STATES beyond the five: A ONE FRUIT ALONE at the tip after two are gone. B THE BRANCH FROM BELOW,
  looking up its length with bare-ground sky behind, 0 dots in the sky.

PLATE: the five shapes in a row at one size, then A and B.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no individual leaf shapes /
  no motion line, vibration mark, doubled branch or trailing arc / no character face (a trunk and
  plain paws only) / 🔴 no trunk gripping, carrying or using an object - it may only coil and pull /
  no gold anywhere / no lettering or numerals / no gradient, glow or soft edge.
```

### §2.29 EarthBund — 🔴 담은 쌓은 데가 아니라 안 쌓은 데가 사건이다

```
PROP SHEET - EarthBund   (mina-dotfolk · SCENE token: EarthBund)

The earth bund the children build along the yard's edge when the river rises. One book, six of its
ten pages, and its ending turns on a length of ground that was never built on.

FORM: a low ridge of packed earth running across the frame, INK dots CLOSE for its body with a
  hard top edge, and a shallow borrow pit beside it where the earth came from. 0 stones, 0 turf,
  0 texture rows. Its length is stated by where it starts and stops in the frame, never by a label.
🔴 TWO HEIGHTS ONLY, and they are read against a standing child: ANKLE (a first course, one span)
  and KNEE (finished). Draw both at one size with a plain child silhouette beside them.
🔴 THE HOLE IS THE PICTURE. One stretch of the yard's edge is a WORN LANE, trodden lower than the
  ground either side by everyone walking down to fetch water: its surface is dots OPEN where the
  yard around it is CLOSE, and its two shoulders rise a hand higher on both sides. 🔴 It must read
  as LOWER at thumbnail size and it must be visible in the same frame as the finished bund, because
  the volume's last beat is seeing both at once.
🔴 WATER ENTERING IS A TONGUE: a flat WHITE field pushing a span into the lane's mouth, hard-edged,
  its far end square across. Never a spreading wash, never a spray. Water stopped OUTSIDE a finished
  bund is a WHITE field with a straight edge along the bund's foot and nothing over it.
STATES - all at one size and one high angle so the yard can be compared:
  1 THE YARD before anything, one edge dotted CLOSE, the worn lane OPEN and lower.
  2 THE BUND AT ANKLE HEIGHT along the left edge only, borrow pit beside it, the lane untouched.
  3 THE SAME AT KNEE HEIGHT, still only on the left, the right edge still open.
  4 NIGHT - the water tongue a span into the lane's mouth, the finished bund far from it and dry.
  5 MORNING - a foot sunk to the ankle in the soft ground of the lane, with the dry bund visible in
    the same frame.
  6 THE NEW BUND across the lane at knee height, and the yard's earth all dotted WIDE (dry) with
    no wet band anywhere.

PLATE: states 1-6 at one size, plus the ankle/knee pair with a silhouette for height.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  silhouettes and one foot only) / no gold anywhere / no spray, splash or spreading wash of water /
  no stones, turf or texture rows in the bund / no lettering or numerals / no continuous drawn line
  / no gradient or soft edge.
```

### §2.30 ChoreLoads — 🔴 셋을 나란히 놓아야 19권이 성립한다

> 작업표는 「빗자루」·「수저 셋」·「그릇 무더기」를 따로 잡았는데, 19 p3 의 그림은 **셋을 크기 순서로
> 한 줄에 놓는 것**이고 그 줄이 아이 셋의 키 순서와 **반대**인 것이 사건이다. 따로 그리면 그 비교가
> 화면에 아예 안 생긴다. 🔴 그리고 이 시트가 §2.1 `ThreeBowls` 가 안 든 **씻을 그릇 더미**를 든다.

```
PROP SHEET - ChoreLoads   (mina-dotfolk · SCENE token: ChoreLoads)

The three evening chores, drawn as three loads. One book, six of its ten pages. The sheet exists so
that the three can be laid in a row and compared - that comparison is the volume.

FORM - three objects, all stamped dots, all INK:
  THE BROOM: a bundle of stiff twigs bound to a short handle, taller than the youngest child. Its
    head is one flat INK mass, dots CLOSE, with at most 9 stroke tips breaking its lower edge.
  THE STACK OF BOWLS: the same bowls as §2.1, stacked mouth-down, EIGHT high, as tall as a kneeling
    child's chest - its outline is a stepped column and the stack is 🔴 the largest of the three
    loads by a plain margin.
  THE THREE SPOONS: three plain spoons laid in a row, small, INK, at most 2 lines each. Together
    they are the smallest load and their total area must be obviously less than one bowl's.
🔴 THE COMPARISON PANEL IS THE POINT: the three loads set on one floor in one row at one scale,
  evenly spaced. Beside them, three plain child silhouettes at 5 : 4 : 3 - and the loads run the
  OTHER WAY, biggest load in the middle. Draw that panel once and never rearrange it.
🔴 A FINISHED CHORE LEAVES A MARK, AND THE MARKS ARE THE CLOCK: a swept floor keeps the broom's
  passes as parallel rows of INK dots OPEN across it · washed bowls stand mouth-down in a line and
  the line's LENGTH is how much was done · three spoons are simply in three places.
STATES:
  1 THE COMPARISON PANEL as described.
  2 THE STACK ALONE, untouched, beside a seated child with paws not on it.
  3 THE SAME STACK, unchanged, with the light outside the window changed instead (see §2.13).
  4 WASHED - a row of upturned bowls whose length runs off the frame.
  5 THE SWEPT FLOOR - parallel broom rows, the broom leaning against a wall.
  6 THE THREE SPOONS laid in three places on a floor.

PLATE: the comparison panel large, then states 2, 4, 5, 6.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face (plain
  silhouettes and paws only) / no gold anywhere / no rearranging of the comparison panel / no suds,
  splash or steam / no lettering or numerals / no continuous drawn line / no gradient or soft edge.
```

### §2.31 Driftwood — 🔴 밑동만 점이 성글어야 「매끈하다」가 성립한다

```
PROP SHEET - Driftwood   (mina-dotfolk · SCENE token: Driftwood)

What the river leaves along its edge when it drops. One book, eight of its ten pages: a line of
small pieces, and one big smooth log at the end of it.

FORM - two kinds, and their difference is spacing:
  SMALL PIECES: short lengths of rough wood, a paw can close round one, INK dots TOUCHING with the
    dots uneven along the edge so they read splintery. 🔴 Three of them fill a small child's two
    paws so that the fingers CANNOT close - draw that.
  THE LOG: a whole tree base with roots spreading like horns, lying half buried in dry sand. Its
    surface is INK dots OPEN and EVENLY spaced, which is what makes it read worn smooth beside the
    rough pieces. 🔴 It is still dots and never a filled shape - its smoothness is regularity, not
    fill. It is as long as a child is tall and it takes two arms all the way round.
🔴 THE STRAND LINE IS A ROW, NOT A SCATTER: the pieces lie along ONE line across the frame, evenly
  spaced, on the DRY side of the water's edge with a hand's gap between them and the water. That
  line is where the river stopped, and it is the only thing on the page that says so.
🔴 A PIECE PUT DOWN OPENS A PAW. Draw the pair: paws closed round three pieces, fingers unable to
  spread · the same paws open and flat with the pieces on the sand in front of them. One pebble in
  a larger open paw beside an empty open paw makes the same point at adult size.
STATES:
  1 THE STRAND LINE from above - pieces, dry sand, water's edge a hand away.
  2 THREE PIECES in two small paws, fingers jammed.
  3 THE SAME PAWS open and empty, pieces on the sand.
  4 ONE PIECE held up overhead in one paw.
  5 THE LOG side on, half buried, a ridge of sand round its lower side.
  6 THE LOG with two arms all the way round it and a cheek against it, from below.
  7 THE PEBBLE PANEL - one open empty paw and one paw holding a single pebble, same depth, same
    height.

PLATE: states 1-7 at one size, plus a rough piece and the log's surface side by side to show that
  only the dot spacing differs between them.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots, including the smooth log /
  no character face (plain paws only) / no gold anywhere / no bark texture rows / no wetness or
  sheen / no lettering or numerals / no continuous drawn line / no gradient or soft edge.
```

### §2.32 LeafBoat — 🔴 물 위와 물 밑이 이 매체에서 어떻게 갈리는가

```
PROP SHEET - LeafBoat   (mina-dotfolk · SCENE token: LeafBoat)

The folded leaf boats floated in the yard tub. One book, six of its ten pages, and the whole volume
is read at one water surface: what floats, what was pushed under, and what is still on the bottom.

FORM: a leaf folded once into a little boat, INK dots TOUCHING for its edge and OPEN inside, no
  longer than a finger. At most 3 vein rows. It sits on the water at the tub's middle.
🔴 ON THE WATER, THE WHOLE OUTLINE SHOWS AND IS NOT INTERLEAVED: the boat sits on top of the WHITE
  dot field with its own edge complete all the way round.
🔴 UNDER THE WATER, IT IS INSIDE THE WHITE FIELD, and where the INK leaf meets the WHITE water the
  two dot fields interleave along a band EXACTLY 3 DOTS WIDE - that band is the darkest thing in
  the tub, and it is the ONLY way this medium says "submerged". 🔴 The outline does not soften, bend
  or ripple; it stays hard and unbroken beneath.
🔴 A THIRD DEPTH EXISTS AND IT MATTERS: a boat that sank sits ON THE TUB'S BOTTOM, stuck flat, and
  it is drawn with the whole white field between it and the surface - so one frame can hold two
  floating and one sunk, at three depths, and the volume's ending is that stack.
🔴 A WET LEAF OUT OF THE WATER IS LIMP AND EDGED IN WHITE: the leaf hangs over a paw, INK, with
  WHITE dots along its rim only, three deep and no further in.
STATES - all seen from above at one size unless noted:
  1 TWO BOATS floating side by side, whole outlines, on the WHITE surface.
  2 ONE BOAT with a fingertip pressing it under, the 3-dot band showing round it.
  3 ONE ON THE BOTTOM, stuck flat, one floating above - shown from the side so both depths are seen.
  4 THE THREE DEPTHS AT ONCE - two floating, one on the bottom.
  5 A WET LEAF limp across an open paw, WHITE only at the rim.
  6 A LOW BRANCH with two leaves picked from it, the two scars showing.

PLATE: states 1-6, plus a large close-up of the 3-dot band where leaf meets water.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / 🔴 no softening, bending or
  rippling of a submerged outline / no character face (plain paws only) / no gold anywhere / no
  ripple, glint or reflection on the water surface / no lettering or numerals / no continuous drawn
  line / no gradient or soft edge.
```

### §2.33 GroundDrawing — 🔴 판 금이 흙보다 어두운 것, 그게 이 권의 매체다

```
PROP SHEET - GroundDrawing   (mina-dotfolk · SCENE token: GroundDrawing)

The pictures two children scratch into dry earth while they wait for a boat. One book, six of its
ten pages, and by the end the drawings cover the ground the children are standing on.

FORM: a dry stick with a worn point, one row of INK dots, as long as a forearm.
🔴 A SCRATCHED LINE IS TWO THINGS AT ONCE: a row of INK dots TOUCHING where the point went, and a
  ridge of pushed-up soil along ONE side of it - INK dots OPEN, a little wider than the line. The
  ridge always lies on the same side of every line in a given picture, because one hand made them
  all. That ridge is how a scratch is told from a shadow.
🔴 THE DRAWINGS ARE CHILD-MADE AND THEY ARE NOT IN THIS BOOK'S STYLE: a long boat as one closed
  crooked shape, three wavy rows under it, a small boatman as a body and a head with one straight
  oar, two jars, four round fruit. Nothing is shaded, nothing is stamped as a field - a drawing is
  LINES ONLY, so it can never be mistaken for a real object in the same frame.
🔴 THE SPREAD IS THE CLOCK: draw the ground three times at one size - three marks · half the frame
  covered · covered right up to a hand's width from the water's edge and stopping there. The
  stopping is deliberate and it must be visible.
🔴 THE PAIRING PANEL: the drawn boat and a real boat's bow touching the same earth, side by side at
  the same length, in one frame. Draw it here so the page cannot invent a different arrangement -
  the real bow pushes a ridge of soil exactly like a scratched line does, only bigger.
STATES:
  1 THE STICK ALONE, and a single scratched line with its ridge, close up.
  2 THE DRAWN BOAT and three wave rows.
  3 THE BOATMAN AND OAR added on the boat.
  4 THE THREE SPREADS in a row at one size.
  5 THE PAIRING PANEL as described.
  6 A PAW passing the stick to another paw over the drawn ground.

PLATE: states 1-6, plus one scratched line drawn large enough to see the ridge's side.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / 🔴 no shading or dot field
  inside a drawn picture - lines only / no character face (plain paws only) / no gold anywhere /
  no lettering, numerals or written words scratched in the earth / no continuous drawn line / no
  gradient or soft edge.
```

### §2.34 Toothstick — 🔴 이가 흰 점이라 벌린 입이 화면에서 가장 밝다

```
PROP SHEET - Toothstick   (mina-dotfolk · SCENE token: Toothstick)

The chewed twig teeth are cleaned with, and the mouth it is used on. One book, seven of its ten
pages, and four of them are two open mouths compared side by side.

FORM: a green-wood twig as long as a paw, INK dots TOUCHING, with ONE end frayed into at most 5
  short splayed fibres. A fresh twig's end is blunt; a used one is frayed and darker where it was
  chewed. Wet, the whole twig's dots go CLOSE.
🔴 TEETH ARE WHITE DOTS. An open mouth is a row of WHITE dots set CLOSE inside an INK mouth outline,
  and 🔴 it is the BRIGHTEST thing on that page - brighter than the sky, which is bare ground. That
  inversion is why volume 27 works at all, and it is the only place in this series where a body
  carries white.
🔴 THE CRUMBS ARE THE COUNT: EXACTLY TWO INK dots pressed into the white row, between the front
  teeth, on the same two teeth every time. Clean, that row has no gaps at all. Draw the two mouths -
  crumbed and clean - at the SAME size and the SAME angle so they can be laid over each other.
🔴 THE TWO MOUTHS SIDE BY SIDE is the other required panel: an older child's clean row on the left
  and a younger one's crumbed row on the right, same size, same depth, so the comparison is done by
  the frame and not by the words.
STATES:
  1 THE TWIG fresh, blunt end, side on.
  2 THE TWIG used, frayed end, wet, dots CLOSE.
  3 AN OPEN MOUTH, clean - a full unbroken white row.
  4 AN OPEN MOUTH, two crumbs in the row, same size and angle as 3.
  5 THE TWO MOUTHS side by side at one size.
  6 THE TWIG IN USE - held to the back teeth, one cheek pushed out from inside, the twig's shaft
    crossing the mouth. No face beyond the cheek and mouth.
  7 CRUMBS LEAVING - five or six INK dots carried off in a line on a shallow water surface, all
    the same size, evenly spaced, moving away from the frame's centre.

PLATE: the crumbed/clean mouths at one size, the two mouths side by side, then states 1, 2, 6, 7.

NOT: 🔴 no filled or solid shape anywhere - everything is stamped dots / no character face beyond a
  mouth and one cheek / no gold anywhere / no more or fewer than two crumbs / no gum line, tongue
  detail or individual tooth outlines - the row is dots / no lettering or numerals / no continuous
  drawn line / no gradient, glow or soft edge.
```

---

## §3. 🔴 미결 — 이 시리즈는 **0곳**이다

> 🔴 **이 §3 은 판정 근거만 적는다. 이름→토큰 변환의 SSOT 는 `_stage-tokens.json` 이다.**
> 표 출력·검사 = `node packages/client/scripts/extract-series-stages.mjs --tokens mina` (**미매칭 0** 이어야 한다).
> 🔴 **쪽 목록은 폐기했다** — 목록과 변환표를 따로 두니 어긋났다(변환표엔 있는데 목록엔 없는 이름이 나왔다).
> 규칙이 전 이름을 덮으므로 목록이 필요 없고, 「목록 밖이라 안 붙인다」가 생기지 않는다.
> 🔴 **SPOT**: `_stage-tokens.json` 의 `spots` 가 `null` 인 시트는 **시트명만** 붙인다. 값이 있는 시트도
> **A/B/C/D 는 카메라가 정하므로 경로표(§4)에서 정한다** — §3 에서 비워 둔 건 빈칸이 아니라 경로표 몫이다.
> 🔴 **일부 이름은 권을 알아야 정해진다**(`byBook`). 앞 쪽을 읽어야 하는 종류이고, 규칙 파일이 그걸 들고 있다.


15시리즈 중 유일하다. 이유가 있다 — 미나 SCENE 은 장소를 **강물 높이와 함께** 쓴다(「물이 빠진 강바닥」·
「물이 빠진 강가」). 수식어가 **어느 것인지**가 아니라 **그때 어떤 상태인지**를 가리켜서, 같은 자리로
자동으로 묶인다. 🔴 **다른 시리즈의 미결 28곳을 고칠 때 이 쓰기 방식이 견본이다.**

---

## §4. 권별 경로표

🔴 **`mina-routes.md` 로 옮겼다**(**50권 500쪽 전부** — 「25권 250쪽」이라 적혀 있던 것을 2026-09-05 에 고쳤다). 같은 표를 두 곳에 두면 반드시 갈라진다 —
여기 있던 13 「납작한 돌」 견본도 p9 의 자리가 SCENE 토큰과 이미 어긋나 있었다.
검사 = `node packages/client/scripts/build-series-routes.mjs --check mina`.
