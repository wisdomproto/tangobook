# 붕이네 물 위 장터 — 무대·사물 시트

> art-director 산출물 (2026-08-16). 시리즈 11 `bung-woodblock` · 25권 250쪽.
> 🔴 앵커 SSOT = `bung-anchor.md`. 후보 = `_stages.json`(자리 19 · 사물 75항목 / 고유 53) · 대본 = `_scenes.json`

---

## §0. 🔴 매체 번역 한 줄 — 가라앉은 것은 윤곽판이 안 닿는다

앵커: `THE KEY BLOCK CARRIES EVERY OUTLINE AND PRINTS LAST` · 🔴 `A SUNKEN THING IS OVERLAP WITH
RIVER PRINTED OVER IT AND NO OUTLINE AT ALL.`

**물 위 장터의 「떨어뜨리면 가라앉는다」가 판 하나를 빼는 것으로 그려진다.** 그러므로 자리 시트가
정하는 것은 **🔴 「어디까지 윤곽이 있고 어디부터 없나」**다. 물 위에 뜬 것은 제 윤곽을 다 갖고, 잠긴 것은
윤곽이 **한 줄도 없다**. 🔴 이 매체는 상하 반전도 물에 비친 상도 한 번도 요구하지 않는데, **그게 AI 가 제일
못 하는 것**이라 이 시리즈만 그 위험이 0이다. 시트가 그 이점을 지켜야 한다.

🔴 **둘째 — 어긋남이 한 방향이다.** `THE KEY BLOCK LANDS ONE HAIR OFF THE COLOUR ON EVERY PAGE ...
at least 4 shapes per page, every slip running the SAME direction.` 시트가 그 방향을 정해 놓아야
**25권이 같은 인쇄소에서 나온 것**으로 보인다. 방향이 권마다 다르면 어긋남이 실수로 보인다.
🔴 **얼굴에서만 판이 맞는다**(대발이형은 표정이 사건의 절반) — 무대 시트엔 인물이 없으니 **전부 어긋난다**.

⚠️ 셋째 — 청록은 **붕이 코뚜레 끈**과 **동생 발목 방울 끈** 두 곳뿐. 두 아이가 한 세트라 어른도 물건도 안 받는다.

---

## §1. 🔴 좌표가 두 층이다 — 딩딩과 다른 점

딩딩 논둑은 한 층(칸 1~7)이었다. 붕이는 **배가 자리가 아니라 움직이는 것**이라 두 층으로 갈린다.

| 층 | 좌표 | 근거 |
|---|---|---|
| ① **시장 안 어느 배인가** | 국수 배 · 할아버지 배 · 과일 배 · 나머지 셋 | 🔴 **01 p1 「배 여섯이 물 위에 떠 있고」** + 앵커 `boats behind at most 6` |
| ② **그 배 안 어디인가** | 뱃머리 → 조리 자리 → 뱃전 → 뱃바닥 → 고물 | 후보 19개 중 8개가 한 배의 **부위** 이름이다 |

🔴 **번호가 아니라 부위 이름인 이유** — 배는 떠다니므로 「위/아래」가 없고, **앞뒤만 있다.** 딩딩은
물이 위에서 아래로 흘러 번호가 곧 방향이었지만, 여기서는 **뱃머리가 기준점**이고 나머지가 그로부터의
거리다. 좌표 이름을 그대로 쓴다.

## §2. 자리 시트 — 5장 (후보 19에서 접음)

| 시트 | = 후보 | 왜 하나인가 |
|---|---|---|
| `NoodleBoat` | 국수 배 안 · 국수 배 · 뱃머리 · 뱃바닥 · 국수 배 뱃전 · 뱃전 안쪽 · 조리 자리 · 물통 앞 · 밥상 위 | 🔴 **붕이네 집** — 부위 다섯이 한 배 안 |
| `GrandpaBoat` | 할아버지 배 안 | 🔴 **다른 배다** · §4 |
| `Market` | 물 위 장터 · 시장 물길 · 시장 한복판 · 과일 배 앞 · 두 배 사이 · 배 옆 물 위 | 배 여섯이 뜬 물 |
| `PlankWalk` | 나무 길 위 · 나무 길 첫머리 | 시장 안쪽 |
| `Channel` | (물길 · 물 빠진 자리) | 10권 얼음 · `CHANNEL AND LOW WATER` 조항 |

### §2.1 NoodleBoat — 실제 프롬프트 (가장 먼저)

```
STAGE SHEET - NoodleBoat   (bung-woodblock · SCENE token: NoodleBoat · bake FIRST)

The noodle boat - Bung's home and shop. Nine of the nineteen named places in this series are
somewhere inside it, so this drawing decides the boat once, and it names its parts.

🔴 FIVE PARTS, IN ORDER FROM THE FRONT. A page inside this boat is at ONE of these and nowhere
  else - they are the coordinate of the whole series:
  1 BOW (뱃머리) - the narrow front, a low rail, a mooring rope coiled.
  2 COOKING PLACE (조리 자리) - the pot on its stand, the fire beneath, bowls stacked, the water
    butt. This is the middle of the boat and the middle of most books.
  3 GUNWALE (뱃전) - the side rail a child leans over; the market water is right below it.
  4 FLOOR (뱃바닥) - the planked bottom where baskets sit and where things get dropped.
  5 STERN (고물) - the back, the long oar, the awning post.
  A hooped awning covers parts 2-4; the bow and stern are open to the sky.

BLOCKS: planks RIVER, the awning cloth LEAF, the pot and ironwork OVERLAP, produce LEAF, baskets
  RIVER. The plank's grain stays visible inside every colour area. 🔴 LAMPLIGHT IS UNPRINTED PAPER
  and is the brightest thing in the boat.

🔴 THE KEY BLOCK - every outline is on it and it prints LAST, on top of the colour. IT LANDS ONE
  HAIR OFF on at least 4 shapes per panel, and 🔴 EVERY SLIP RUNS THE SAME DIRECTION (fix it here:
  colour creeps past the outline toward the bow and falls short toward the stern). Never correct it.

🔴 WHERE THE OUTLINE STOPS - this is what the sheet is for:
  A thing ON the water prints WHOLE on top of the RIVER area with its key outline showing.
  A thing UNDER the water is OVERLAP with RIVER printed over it and 🔴 NO OUTLINE AT ALL - the key
  block simply does not reach it. That absence is how a child sees a thing has sunk.
  Never a mirrored image, never a flipped reflection, never a distorted shape. There are no
  reflections in this book.

SPOTS:
  A THE WHOLE BOAT from another boat, wide: bow left, awning over the middle, stern right.
  B THE COOKING PLACE, medium: the pot, the stacked bowls, the awning above.
  C OVER THE GUNWALE, medium high: the rail across the bottom, market water below it.
  D THE FLOOR, close, high: planks, baskets, and whatever is lying on them.

PLATE: A, B, C, D once each, plus 🔴 A PART DIAGRAM naming bow / cooking place / gunwale / floor /
  stern in order, plus one panel showing the same object floating (outlined) and sunken (no
  outline) side by side.

NOT: no character of any kind, no accent teal anywhere on this sheet (the teal is Bung's nose-rope
  and the little one's bell cord only), no lettering, numerals or shop signs, no reflection or
  mirrored image in the water, no ripple or glint, no third colour that is not an overprint, no
  key outline on a submerged thing, no corrected registration, no shading, gradient, glow or soft
  edge.
```

### §2.2 Market — 요약 명세

🔴 **배 여섯**(01 p1 · 앵커 상한 6)이 좌표: 국수 배 · 할아버지 배 · 과일 배 · 나머지 셋(실루엣, 안쪽 표시 0).
물은 RIVER 한 면(잔물결 0 · 반짝임 0), 하늘은 안 찍은 종이, 🔴 **마른 땅이 한 뼘도 없다**(01 p1).
`SPOTS` = A 장터 전체 / B 두 배 사이 / C 뱃전 너머 물 / D 나무 길에서.

---

## §3. 사물 시트 — 40장 (고유 53에서 노이즈 13 제외)

> 🔴 **이 §3 은 판정 근거만 적는다. 이름→토큰 변환의 SSOT 는 `_stage-tokens.json` 이다.**
> 표 출력·검사 = `node packages/client/scripts/extract-series-stages.mjs --tokens bung` (**미매칭 0** 이어야 한다).
> 🔴 **쪽 목록은 폐기했다** — 목록과 변환표를 따로 두니 어긋났다(변환표엔 있는데 목록엔 없는 이름이 나왔다).
> 규칙이 전 이름을 덮으므로 목록이 필요 없고, 「목록 밖이라 안 붙인다」가 생기지 않는다.
> 🔴 **SPOT**: `_stage-tokens.json` 의 `spots` 가 `null` 인 시트는 **시트명만** 붙인다. 값이 있는 시트도
> **A/B/C/D 는 카메라가 정하므로 경로표(§4)에서 정한다** — §3 에서 비워 둔 건 빈칸이 아니라 경로표 몫이다.
> 🔴 **일부 이름은 권을 알아야 정해진다**(`byBook`). 앞 쪽을 읽어야 하는 종류이고, 규칙 파일이 그걸 들고 있다.


| 토큰 | 사물 | 권·쪽 | 비고 |
|---|---|---|---|
| `Bowls` | 그릇 | 12(9) · 04(7) · 02(3) · 15(4) · 25(4) | 🔴 **5권 공유 · 최다** |
| `Noodles` | 국수 | 04(5) · 02(4) · 12(3) · 01(3) | 4권 공유 |
| `Fruit` | 과일 | 24(8) · 21(6) · 07(3) | 3권 공유 · 상한 9 |
| `Awning` | 천막 | 17(9) · 16(5) | 2권 공유 |
| `Baskets` | 소쿠리 · 바구니 · 광주리 | 12(4) · 05(4) | |
| `Gourd` | 바가지 · 물통 | 09 (6·4) · 15(3) | |
| `Watermelon` | 수박 | 08 (5쪽) | 🔴 **가라앉는 것** · §3.1 |
| `Nets` | 그물 | 19(7) · 13(3) | |
| … | (나머지 32장) | | |

### §3.1 Watermelon — 실제 프롬프트 (🔴 가라앉는 것의 실례)

```
PROP SHEET - Watermelon   (bung-woodblock · SCENE token: Watermelon)

A watermelon on the gunwale of the noodle boat. One book is five pages of it being about to fall
in, and this sheet exists to make the falling-in drawable.

FORM: LEAF, one round block, the plank's grain visible inside it, with at most 5 stripe marks cut
  into the key block - never more, and never shaded round the curve. The key outline goes round it
  and lands one hair off, the same direction as everything else on the page.
🔴 THREE STATES AND THE THIRD IS THE POINT:
  1 ON THE GUNWALE - whole, LEAF, key outline all round, sitting on top of the RIVER area beyond.
  2 IN THE WATER, FLOATING - still whole, still outlined, sitting ON the RIVER pull. Half of it is
    below the waterline but 🔴 IT KEEPS ITS WHOLE OUTLINE, because floating is not sinking.
  3 SUNK - OVERLAP, with the RIVER area printed OVER it, and 🔴 NO KEY OUTLINE ANYWHERE ON IT. It
    is the same round shape, the same size, in the same place - only the outline is gone and the
    colour has changed. Nothing is blurred, nothing is distorted, nothing is mirrored.
🔴 STATE 2 AND STATE 3 MUST BE DRAWN SIDE BY SIDE at the same size, because the whole book turns on
  a child telling them apart, and the only difference is one printing plate.

PLATE: the three states in a row, plus one close-up of the stripe cuts, plus the 2-versus-3 pair
  at large size.

NOT: no character, no hands, no accent teal, no lettering or numerals, no reflection or mirrored
  image, no ripple, splash or glint on the water, no third colour that is not an overprint, no key
  outline on state 3, no corrected registration, no shading, gradient, glow or soft edge.
```

---

## §4. 🔴 미결 — 「배 안」 2갈래 (7쪽)

| SCENE | 결정 | 종류 |
|---|---|---|
| 국수 배 안 | `NoodleBoat` (+ 부위) | 좌표 |
| 🔴 **할아버지 배 안** | **`GrandpaBoat` — 별개 시트** | **다른 곳** |

🔴 **묶으면 사라지는 것** — 01 p2~p3 이 통째로 「배에서 배로 건너간다」이고(뻗은 손끝과 다가오는 뱃머리 ·
두 배 사이의 물), 이 시리즈에서 **다른 배로 건너가는 것이 곧 집을 나가는 것**이다. 한 시트로 묶으면
그 사건이 그림에서 사라진다. 퐁이 「할아버지 집 현관」과 정확히 같은 자리다.


---

## §5. 권별 경로표 — 견본 (08 「수박」)

| 쪽 | 자리 | 부위 | 🔴 수박 상태 | 윤곽 |
|---|---|---|---|---|
| p1~p4 | `NoodleBoat` | **뱃전** | 1 위에 놓임 | 있음 |
| p5 | `NoodleBoat` | 뱃전 | 1 (기울어짐) | 있음 |
| p6~p8 | `Market` | 배 옆 물 위 | **2 뜸** | 🔴 **여전히 있음** |
| p9~p10 | `Market` | 배 옆 물 위 | **3 가라앉음** | 🔴 **없음** |

🔴 **p8 → p9 가 이 권 전체다.** 그림에서 달라지는 것은 **판 하나**뿐이고, 그래서 §3.1 의 2-3 대조 패널이
없으면 그리는 사람이 「가라앉음」을 흐리게·작게·기울여서 낼 것이다. 그 셋 다 이 매체가 금지한 것이다.
