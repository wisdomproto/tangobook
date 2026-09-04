# 코타의 온천 여관 — 무대·사물 시트

> art-director 산출물 (사물 시트 2026-09-04). 시리즈 16 `kota-mineral`(전권) · **25권 250쪽**.
> 🔴 앵커 SSOT = `kota-anchor.md` §1 · 개체 규격 = `kota-cast.md` · 손님 등록부 = `_series-config.mjs` `KOTA_GUESTS`
> 자리 후보 = `_stages.json` · **사물 후보 = `_PROP-SHEETS.md` 의 `## kota` 절** · 대본 = `docs/changjak-books/kota/_scenes.json`
> ⚠️ **설계 `_design.md` §3 표의 05~25 줄거리는 폐기됐다**(2026-09-01 호리 포맷 전면 재집필). 이 문서는
> **`_scenes.json` 만 읽고** 썼다 — 설계표를 근거로 시트를 고치지 말 것.
> **실행 순서** ① 사물(§2) → ② 자리(§1, 미착수) → ③ 컷.

🔴 **§1 자리 시트는 아직 없다.** 지금 자리를 맡고 있는 것은 앵커 §1 의 `STAGE CLAUSES` 다섯(위 탕 ·
아래 탕과 도랑 · 삶는 웅덩이 · 마당 · 복도와 탈의 마루 · 손님방). 아래 「뺀 것」에서 자리로 넘긴 것들은
전부 **§1 이 생길 때 받을 목록**이고, 넘기며 요구한 조항을 §3 에 모아 뒀다.

---

## §0. 🔴 이 시리즈의 매체 번역 — 셋이다

**① 사물의 마감은 「몇 번 얹었나」다. 그러니 사물 시트가 정할 것은 「그 권에서 가장 거친 것이 무엇인가」다.**

앵커: `THE FIGURES AND THE ONE THING THEY ARE TOUCHING - coarsest grind, four to five passes, and a
thin dry ink contour … AT MOST TWO THINGS ON A PAGE GET THE COARSEST GRIND`.
즉 이 매체에서 「중요하다」는 크기도 밝기도 아니고 **입자와 패스 수**다. 사물 시트가 그걸 안 정하면
한 화면에 여섯 개가 다 거칠어지고, 그러면 **아이가 오늘의 물건을 못 찾는다**(딩딩 렌더에서 실제로 난
신고 — 앵커 §4 셋째 검사가 그것 때문에 생겼다). 그래서 아래 스물한 장은 전부 `FINISH` 한 줄을 들고
있고, 그 줄이 **어느 상태가 그 권의 거친 것인지**를 못박는다.

**② 흰 것은 안 칠한 자리가 아니라 호분을 칠한 자리다 — 그리고 순백은 금지다.**

수건 · 찐빵 · 무 · 깨진 그릇 조각 · 구슬의 빛점 · 젖은 돌의 물빛 · 눈 · 종이 — 이 여덟이 전부
`SHELL WHITE #EDE7DC` **한 색**이다. 🔴 하나라도 순백으로 칠하면 **화면의 분홍 하나가 먹힌다**
(앵커 `PALETTE`: `a white mass of steam swallows the one pink on the page`). 퐁이의 「밝은 것은
안 찍는 것」과 **정확히 반대**라, 두 문서를 나란히 놓고 베끼면 안 된다.

**③ 손님이 든 것은 손님 등록부와 한 벌이다.**

앵커 `HOUSE OR ROAD, READ OFF THE OUTLINE` 이 「집 = 천을 두르고 아무것도 안 든다 / 길 = 천이 없고
하나를 든다」로 갈라 놨고, 그 「하나」가 종마다 정해져 있다(`KOTA_GUESTS`). 그래서 **`Bundle`(§2.16)과
`Stick`(§2.20)은 사물 시트인 동시에 캐스트 규격**이다 — 두 장을 고칠 땐 등록부를 같이 본다.

---

## §2. 사물 시트 — 21장 (후보 58에서 접고 빼고, **작업표에 없던 여섯을 새로 넣었다**)

> 🔴 **단위는 권이다.** 형식 정본 = `pongi-stages.md` §2.1 · §2.2.
> 🔴 **작업표에 없던 여섯**(솥 · 찐빵 · 무 · 안경 · 목걸이 · 종이와 붓)이 **그 권의 주인공 사물**이다.
> 왜 빠졌는지는 §4 에 적었다 — 표를 고치기 전엔 다른 시리즈에서도 같은 여섯이 계속 빠진다.

| § | 토큰 | 사물 | 권 (쪽 수) |
|---|---|---|---|
| 2.1 | `Footwear` | 나막신과 신 줄 | **02**(10) · **11**(8) · 13 · 10 · 15 · 21 · 22 · 25 · 04 · 06 · 07 · 18 · 23 |
| 2.2 | `Quilt` | 이불 · 이부자리 · 요 | **05**(9) · **14**(8) · 16 · 25 · 15 · 24 · 13 · 09 · 21 · 11 · 08 |
| 2.3 | `HouseTowel` | 여관의 흰 수건 | **12**(10) · 16 · 03 · 23 · 14 · 09 · 06 |
| 2.4 | `Lamps` | 등롱 · 든 등불 · 방 등불 | **09**(7) · 17 · 03 · 15 · 18 · 19 · 21 · 22 · 23 · 24 · 25 · 13 · 16 · 10 |
| 2.5 | `Bowls` | 그릇 · 접시 · 죽그릇 · **깨진 조각** | **24**(6) · **17**(6) · **04**(5) · 22 · 06 · 18 |
| 2.6 | `Toys` | 나무 배 셋 · 대야 · 바가지 둘 | **08**(9) |
| 2.7 | `Pot` | 돌솥과 나무 뚜껑 | **07**(9) |
| 2.8 | `SteamedBun` | 찐빵 (그리고 아빠의 칼) | **22**(8) · 07(3) |
| 2.9 | `Radish` | 무 | **04**(6) |
| 2.10 | `Stones` | 탕가 젖은 돌 · 마당 돌부리 | **10**(9) · **21**(6) · 15 · 25 · 01 |
| 2.11 | `BeadNecklace` | 유리 구슬 목걸이 | **23**(8) |
| 2.12 | `PaperAndBrush` | 종이 · 붓 · 먹물 그릇 | **18**(6) |
| 2.13 | `WashTub` | 큰 나무 대야 | **14**(7) · 02 |
| 2.14 | `ClothesLine` | 빨랫줄 | **14**(6) · 06 |
| 2.15 | `Basket` | 채반 · 소쿠리 · 바구니 · 광주리 | 08 · 12 · 14 · 04 · 22 · 06 · 09 · 13 · 07 |
| 2.16 | `Bundle` | 보퉁이 · 등짐 · 지게 · 장 망태 | 손님 있는 24권 전부 |
| 2.17 | `MealTray` | 소반 | 24(5) · 17 · 13 · 06 |
| 2.18 | `LowTable` | 밥상 | 04 · 22 · 18 · 06 |
| 2.19 | `Cushion` | 방석 | 13(4) · 18 · 22 |
| 2.20 | `Stick` | 지팡이 | 13 · 18 · 25 |
| 2.21 | `Spectacles` | 안경 | **13**(3) |

### 🔴 접은 내역

| 접은 것 | 어디로 | 왜 |
|---|---|---|
| 「나막신」 + 「신」 + 「자국」 | `Footwear` | 이 시리즈에서 나막신은 **혼자 서지 않는다** — 늘 같은 디딤돌 위 어른 신 줄 옆이고, 02 의 그림이 바로 그 줄이다. 흙에 찍힌 자국은 그 신의 상태 |
| 「이불」 + 「이부자리」 + 「요」 + 「뭉치」 + 「언덕」 | `Quilt` | 한 채가 젖으면 뭉치, 펴면 이부자리, 아이가 들어가면 언덕이다 |
| 「수건」 + 「수건 더미」 + 「수건 공」 | `HouseTowel` | 12권이 그 한 장을 공 → 판판 → 켜 → 산으로 굴린다. 셋이 상태다 |
| 「등불」 + 「등롱」 + 「노란 원」 + 「각진 밝은 조각」 | `Lamps` | 🔴 접되 **형태 셋으로 갈라 한 장에** 둔다 — 이 시리즈에서 **둥근 빛은 09 하나뿐**이고 나머지는 전부 각지다. 따로 그리면 그 대비가 사라진다 |
| 「그릇」 + 「접시」 + 「밥그릇」 + 「죽그릇」 + 「물그릇」 + 「나무 그릇」 + **17 의 「하얀 조각」** | `Bowls` | 조각은 다른 물건이 아니라 **그 그릇의 마지막 상태**다 |
| 「배」 + 「대야(장난감)」 + 「바가지」 + 「장난감이」 | `Toys` | 여섯이 08권 내내 한 무리로만 움직인다(길을 막고, 하나씩 항구로 간다) |
| 「솥」 + 「뚜껑」 | `Pot` | 07 의 사건은 솥이 아니라 **뚜껑의 기울기**다. 몸통과 갈라 놓으면 기울기 3단계가 갈 곳이 없다 |
| 「찐빵」 + 「부엌칼」 | `SteamedBun` | 칼은 두 쪽뿐이고 하는 일이 **반으로 가르는 것 하나**다. 안전 조항(아빠 손에만)을 여기 붙인다 |
| 「종이」 + 「붓」 + 「먹물 그릇」 + 「접은 네모」 | `PaperAndBrush` | 셋이 한 자리에서만 같이 나오고, 네모는 그 종이가 접힌 것이다 |
| 「채반」 + 「소쿠리」 + 「바구니」 + 「광주리」 | `Basket` | 짜서 만든 한 가족. 🔴 접되 **크기 넷을 한 줄에** 둔다 — 08 바구니는 장난감 여섯이 들어가야 하고 14 광주리는 둘이 마주 들어야 한다 |
| 「보퉁이」 + 「봇짐」 + 「보따리」 + 「등짐」 + 「지게」 + 「장 망태」 | `Bundle` | 앵커의 `ONE travelling thing on the outline` 하나다. 🔴 **장 망태만 「집 것」**이라 같은 장에 넣어 대비시킨다 |
| 「젖은 돌」 + 「마른 돌」 + **21 의 「돌부리」** | `Stones` | 셋 다 「돌 하나의 마감」이 사건이다. 자리(탕가 ↔ 흙마당)가 달라 헷갈릴 위험이 없다 |
| 「구슬」 + 「알마다」 + 「호분 빛점」 | `BeadNecklace` | 작업표에 목걸이가 없고 이 셋으로 흩어져 있었다 |

### 🔴 뺀 것과 이유

**ⓐ 자리 몫 — §1 이 받을 것** (앵커 `STAGE CLAUSES` 가 이미 반을 들고 있다)

| 뺀 것 | 왜 |
|---|---|
| 디딤돌(02·11·15·25) · 대문(06·20·25) · 대문 기둥 · 현관 기둥(20) | 옮기지 않는 붙박이. 🔴 단 **디딤돌은 `Footwear` 가 늘 그 위에 서므로** 시트에 「디딤돌 한 장 위에 몇 켤레가 서는가」를 요구한다(§3) |
| 툇마루(11·17·22·23) · 뒷벽(03) · 마루 턱 · 문턱 · 봉당 | 자리. 03 의 「뒷벽」은 장지문이 줄지어 선 벽이지 물건이 아니다 |
| 선반(05·12·09) | 🔴 **12 의 사건은 선반이 아니라 그 위에 쌓이는 켜**다(퐁이 `CheeseWheel` 과 같은 자리) → `HouseTowel` 이 든다 |
| 부뚜막 · 부엌 · 물동이(07·22·24) | 자리 붙박이. 물동이는 아빠 두 손을 채우는 물건이지만 **누구도 그것에 손대지 않는다** — 열 쪽 내내 배경이다 |
| 장지문(16·24·전권) · 유리문(19) | 자리. 🔴 둘 다 **밝기 단계가 사건**이라 §3 에 조항으로 넘겼다 |
| 평상(10·13) · 문갑(23·25) | 마당과 손님방의 붙박이 가구. 🔴 23·25 가 **같은 손님방**이라 문갑 자리를 같게 그려야 한다 → §3 |
| 이랑 · 고랑(04) · 텃밭 흙 | [Garden] 자리 |
| 나무다리 · 산모퉁이 · 돌담 · 돌길 · 흙마당(20·11·13) | 자리 |
| 마루 밑 어둠(17) | 자리다. 🔴 단 **그 어둠이 흰 조각을 삼키는 자리**라 §3 |
| 돗자리(05·16·03·23) | 앵커 `GUEST ROOM` 조항이 이미 「결 없는 오커 한 판」으로 못박았다 |

**ⓑ 낱말이 아닌 것** — 비스듬히(6권) · 아래에 · 마주 · 높이에서 · 곁에 · 안쪽에 · 왼쪽에서 · 오른쪽으로 ·
오른쪽에서 · 왼쪽으로 · 콩콩 · 멀리 · 노란 · 칸에 · 널에 · 흙바닥에 · 물가에 · 통째로 · 장난감이 · 손가락 ·
높이에서. **카메라 지시와 조사 붙은 어절**이다 → §4.

**ⓒ 캐스트·손님 등록부 몫** — 아저씨(7권) · 아주머니 · 할머니 · 개구리 · 하마 · 너구리 · 왜가리.
**사람이 사물 후보에 올라 있다.** 코타 목의 **분홍 수건**과 아빠 허리의 **마른 수건**도 여기다 —
🔴 `HouseTowel` 은 **흰 것만** 든다. 분홍을 사물 시트에 넣으면 「25권에 분홍 하나」가 흔들린다.

**ⓓ 앵커 조항 몫** — 김 · 수면 · 잔물결 · 어둠 · 불빛 · 그림자 · 빗줄기. 앵커 `STEAM` · `POOL` 조항.

**ⓔ 한두 쪽짜리** — 알밤 한 줌(08 p8) · 솔(01·10·15) · 빗자루와 싸리비(06·11·24) · 찻잔(13·18) ·
집게 소쿠리(14) · 겹옷 한 벌(15·16 — 캐스트) · 눈오리 없음. **그 권이 기대지 않는다.**

---

### §2.1 Footwear — 🔴 02권 · 이 시리즈에서 제일 급한 시트

> 02 는 열 쪽 전부가 **신 코의 방향**이다(p1 제각각 → p5 나란히 → p10 전부 밖을 본다). 켤레 수가
> 손님이 바뀐 것을 말하고(p1 세 켤레 → p9 두 켤레), 11 은 같은 나막신이 **소리와 자국**이 되고,
> 21 은 한 짝이 벗겨지는 것으로 열린다. 신이 흔들리면 이 셋이 통째로 안 읽힌다.

```
PROP SHEET - Footwear   (kota-mineral · SCENE token: Footwear)

The footwear of this inn: the child's clogs, the father's, and the shoes of whoever is staying.
Volume 02 is entirely about which way their toes point, volume 11 about the mark they leave, and
eleven other volumes have a row of them on the same stepping stone.

FORM - two kinds and no third:
  CLOGS (the child's, and the child's only). A flat wooden sole on TWO cross bars underneath, so
    there is a visible GAP OF GROUND UNDER EACH ONE when it is worn - that gap is one of the three
    things the silhouette row of the character sheet is read by, so it is never closed. One thong
    across the foot. Ochre at medium grind, at most 3 seam lines, 0 grain inside the sole.
  ADULT SHOES (guests' and the father's). Low, closed, the toe end rounded and solid, no bars
    underneath, so they sit flat on the stone. Ochre or burnt earth, plainly LARGER than the clogs
    at the same distance. The father's are the largest pair in any row.
🔴 INDOORS THERE IS NO FOOTWEAR AT ALL - on the boards everyone is barefoot and the shoes wait
  outside on the stone. Never draw a clog on a corridor board.

🔴 THE TOE IS THE WHOLE STORY. A toe points one of three ways and nothing else: OUT (towards the
  yard, ready to be stepped into), IN (towards the house, wrong way round), or the shoe is TIPPED
  OVER and shows its sole. Draw these three large at the head of the sheet, from the same low angle.

STATES - draw all at consistent scale:
  1 A PAIR PUT TO BED - two clogs side by side on bare earth, both toes OUT, the gap between them
    the width of one clog.
  2 SCATTERED - one clog in the air mid-throw, its partner lying on its side further off with the
    toe pointing the other way. The two toes must disagree at thumbnail size.
  3 TIPPED OVER - one adult shoe showing its sole.
  4 THE ROW - four adult pairs and one pair of clogs along a broad stepping stone, EVERY toe out,
    the clogs at one end. 🔴 A SECOND PANEL OF THE SAME ROW WITH ONE PAIR MISSING, drawn at the
    same size, so a reader can see that the number of pairs is what changed.
  5 WORN - a foot in a clog at ground level, the gap under the bars clear.
  6 ONE CLOG OFF - the shoe lying on its side beside a bare foot, the other still worn.
  7 THE MARK IT LEAVES - on earth, TWO short parallel bar prints per step, never a whole sole.
    Draw a straight line of them, and a RING of them (a circle of prints, volume 11's stage).
  8 ON WET STONE - a single dragged water streak one clog wide, one pass of azure over the ochre
    with a hard edge, and no prints at all.

FINISH: shoes are usually the place they stand in - medium grind, two passes, no contour. 🔴 IN
  VOLUMES 02 AND 11 THEY ARE THE THING THE STORY IS ABOUT: coarsest grind, four passes, a thin dry
  ink contour, and then they are one of the two coarse things on the page. Never both a coarse shoe
  row and a coarse figure and something else.

PLATE: the three toe directions large, then states 1-8, then the row at states 4 twice side by side.

NOT: no character above the ankle, no pink anywhere on this sheet, no lettering, numeral, brand or
  burnt mark on any sole, no decorative strap, no shine on wood or leather, no cast shadow, no
  motion line behind a thrown clog, no airbrush, gradient or soft edge.
```

### §2.2 Quilt — 🔴 11권 공유 · 두 권이 정반대로 쓴다

```
PROP SHEET - Quilt   (kota-mineral · SCENE token: Quilt)

The inn's bedding. Eleven volumes use it and two are built on it: 05 turns a thrown heap into two
flat beds, 14 wrings three soaked lumps out and hangs them up. One quilt, many states.

FORM: a single thick rectangle, plainly wider than the child is tall. Ochre at medium grind, ONE
  flat field with 0 drawn folds, 0 stitching, 0 pattern, 0 border - the anchor forbids drawn folds
  in cloth, so a fold is read as a change in the OUTLINE of the mass and never as a line inside it.
  Its edge, when flat, is dead straight.

STATES - draw all at consistent scale:
  1 FOLDED - a squared block with the layers reading as one stepped edge, the shape the father
    carries in both arms.
  2 SPREAD FLAT - one clean rectangle on matting, edges straight, 0 marks inside it. 🔴 TWO OF
    THESE SIDE BY SIDE IN ONE PANEL, edges parallel - volume 05 lands on exactly this.
  3 A HEAP - a mountain of three or four uneven peaks, one corner still trailing off the frame.
  4 HALF-LOOSE - the peaks lower and the mass wider, halfway between 3 and 2.
  5 AIRBORNE - held by two corners, the middle ballooned round with air, the lower edge flattening
    out. 🔴 This is the one that fills the top half of a page (05 p5 · 25 p5): the ballooned
    underside takes ONE more pass than the top so the two faces are told apart without a line.
  6 A HILL WITH A CHILD IN IT - a domed mass with 0 interior marks and one small opening at the
    top edge. The shape alone must read as somebody hiding.
  7 SOAKED - a squat dense lump, darker: the same ochre with ONE pass of azure over it and a hard
    edge where the wet stops. 🔴 THREE OF THESE AT ONCE, one large and two small (volume 14).
  8 HUNG AND FILLED WITH WIND - on a line, the lower edge lifted, all of them bellying the SAME way.
  9 THE HAND-PRESSED SURFACE - flat behind the hand, two low pushed ridges in front of it, and the
    two halves parting exactly at the fingertips.

FINISH: coarsest grind and a contour ONLY in states 3, 5, 6 and 7 - the states where the quilt is
  what the page is about. States 1, 2 and 8 are the place: medium grind, two passes, no contour.

NOT: no character (a plain silhouette only where scale is needed), no pink anywhere, no lettering
  or numerals, no pattern, quilting, stitching or piping, no drawn folds or creases inside the
  field, no cast shadow on the matting, no airbrush, gradient, glow or soft edge.
```

### §2.3 HouseTowel — 🔴 12권이 이 한 장으로 산을 쌓는다

```
PROP SHEET - HouseTowel   (kota-mineral · SCENE token: HouseTowel)

The inn's towels. Every one of them is SHELL WHITE and plain. Seven volumes handle them and volume
12 is nothing but them: balled up, flattened, stacked into three mountains on a shelf.

FORM: a plain rectangle of cloth, about as long as the child's arm. 🔴 SHELL WHITE #EDE7DC LAID
  DOWN, NOT LEFT BARE - it is painted pale, two passes at a fine grind, and it is the lightest
  thing in the room but IT IS NOT WHITE. 0 stripe, 0 hem line, 0 mark of any kind.
🔴 THE INN'S TOWELS ARE NEVER PINK. The one peach towel in twenty-five books is at Kota's neck and
  belongs to the cast sheet, not here. Nothing on this sheet is pink.

STATES - draw all at consistent scale:
  1 ONE FLAT - a true rectangle lying on boards, edges straight.
  2 FOLDED IN HALF AND IN HALF AGAIN - two crisp fold edges standing across it.
  3 BALLED - a rough sphere with the shell white broken by nothing at all: the ball is read by its
    OUTLINE only, so it must be lumpy enough to be told from a round stone at thumbnail size.
  4 FOUR BALLS on a shelf edge, one of them tipped half off.
  5 THREE BALLS FALLING - one in the air, one just struck the boards, one rolling away. Each at a
    different height and 0 motion lines.
  6 THE STACK, COUNTED - 🔴 the layers are the clock of volume 12 and the sheet fixes them: draw
    ONE layer, then FIVE, then SIX, each at the same width and from the same angle. The folded
    edges of every layer face the SAME way, so the side of the stack reads as a row of horizontal
    lines and the number of lines can be counted from across a room.
  7 THREE STACKS SIDE BY SIDE at six, five and four layers, their line-rows level with each other.
  8 A CARRIED PILE - an armful with the top corner slumping, the shape the father brings in.
  9 ON A LINE - four hanging from a cord, all the same length.

FINISH: a towel is normally the place - medium grind, two passes, no contour. 🔴 A STACK BEING
  COUNTED (states 6, 7) is the coarsest thing on the page and takes the dry ink contour, because
  the layer lines are what the page is for.

NOT: no character, 🔴 no pink and no pure white anywhere, no lettering, numerals, crest or stripe,
  no drawn folds inside the field beyond the fold edges named above, no shadow between stacked
  layers, no airbrush, gradient, glow or soft edge.
```

### §2.4 Lamps — 🔴 각진 것 둘, 둥근 것 하나

> 🔴 **09 는 이 시리즈에서 유일하게 둥근 빛이 나오는 권이다.** 나머지 열세 권의 밤은 전부 모서리가
> 딱 떨어지는 조각이라(앵커 `GUEST ROOM`: `that reach is a hard-edged shape, never a glow`), 09 의
> 노란 동그라미는 **그 대비 때문에** 그림이 된다. 그래서 세 형태를 한 장에 나란히 둔다.

```
PROP SHEET - Lamps   (kota-mineral · SCENE token: Lamps)

The three lights of this inn and the three shapes they throw. Fourteen volumes have one of them on
the page, and 09 is built on the fact that only one of the three is round.

🔴 NO FLAME IS EVER VISIBLE. Every lamp here is a CLOSED SHADE. The wick, the flame and any smoke
  are outside the drawing in all three forms and on every page of twenty-five books - the anchor
  forbids fire in this book and a visible flame would say the water is heated. Draw the shade and
  draw the patch it throws; nothing else.
🔴 THE LIGHT IS OCHRE GROUND AS FINE AS IT WILL GO, ONE PASS, laid over a field already finished.
  It is not yellow paint and not a new colour - there is no yellow in this palette.

FORM A - HANGING LANTERN (corridor, meal boards). A cylinder of cloth over a wooden ring, hung from
  the ceiling, at most 4 seam lines. THROWS: ONE hard-edged angular patch on the boards, its corners
  square, its edge dead sharp, and 0 spill outside it.
FORM B - CARRIED LAMP (09, 15, 17). A small closed shade on a short wooden handle, held in two
  hands or set down on the boards. THROWS: 🔴 ONE ROUND YELLOW-OCHRE CIRCLE, no corners, edge just
  as hard as the angular patch - round is the only difference and it must be the whole difference.
  THE CIRCLE IS ALWAYS UNDER THE FEET OF WHOEVER CARRIES IT and there is never more than one; the
  boards behind them keep NO trace of where it has been. Raised overhead, the circle simply grows
  wider and the feet are still in the middle of it.
FORM C - ROOM LAMP (the low one, every last page). Squat, closed, standing on the matting; its
  source may be off the edge of the frame. THROWS: one angular bright face that holds two faces and
  a half of the quilt, and the rest of the room is one flat field of the darkest azure.

STATES:
  1 The three shades side by side at true relative size, unlit, on nothing.
  2 The angular patch alone on boards.
  3 The round circle alone on boards, SAME size panel as 2, so the two can be laid over each other.
  4 🔴 BOTH ON ONE PANEL, not overlapping - an angular patch from an open doorway and a round
    circle beside it on the same boards. This is volume 09 p8 and it is the point of the sheet.
  5 The circle at three widths - lamp held low, at the waist, overhead.

FINISH: the patch and the circle are laid at the finest grind, one pass. The shade itself is the
  place: medium grind, two passes, no contour. 🔴 The lamp is the coarse thing on a page only when
  a child is holding it up (09 p8, 17 p6).

NOT: 🔴 no flame, no wick, no ember, no smoke, no glow, no halo, no rays and no soft falloff of any
  kind; no character, no pink, no lettering or numerals on shade or ring, no reflection of the light
  in anything, no airbrush or gradient.
```

### §2.5 Bowls — 🔴 그릇 하나의 상태가 세 권의 시계다

> 24 는 죽이 **가득 → 한 술 → 반 → 빈 것**으로 내려가는 것이 열 쪽의 시계이고, 04 는 나물 접시가
> **상 끝까지 밀려난 자리**에서 열리고, 17 은 그 그릇이 **깨진 흰 조각**으로 마루 밑에 있다.
> 셋 다 「그릇을 그렸나」가 아니라 「그릇이 어떤 상태인가」가 사건이다.

```
PROP SHEET - Bowls   (kota-mineral · SCENE token: Bowls)

The eating vessels of this inn. Six volumes use them and three of them measure their whole story by
the state of one bowl.

FORM - four and no more:
  RICE BOWL - a small deep bowl on a low foot, SHELL WHITE painted, 0 pattern.
  SIDE DISH - a shallow round dish on a low foot, shell white, holding a heap of GREEN leaf.
  PORRIDGE BOWL - wider and deeper than the rice bowl, shell white, with a wooden spoon.
  WOODEN BOWL - ochre, no foot, the one the father carries broken pieces in.
  Chopsticks and the spoon are ochre sticks, at most 2 lines each.

STATES - draw all at consistent scale:
  1 FULL - the porridge level standing proud above the rim line, a smooth dome.
  2 ONE SPOONFUL GONE - the dome intact but one small notch cut out of its edge.
  3 HALF - the level down at the waist of the bowl, dead flat, hard edged.
  4 EMPTY - the inside of the bowl showing, the spoon laid down INSIDE it.
  🔴 STATES 1-4 ARE ONE ROW AT ONE SIZE FROM ONE ANGLE. Volume 24 reads them in order across ten
  pages and they must be comparable at a glance. Nothing else in the row changes.
  5 PUSHED AWAY - the side dish at the far edge of a table, its foot almost over the corner, the
    heap of green untouched. 🔴 NOTHING IS SPILLED, ever, in this state.
  6 EATEN FROM - the same dish with one side of the heap scooped hollow.
  7 A STACK of washed bowls in two hands.
  8 🔴 BROKEN - three or four shell white shards, curved, edges straight and sharp-cut, lying flat.
    Beside them the same shards SEEN IN DARKNESS: the dark under the boards is one flat field and
    the shards are small pale flecks in it with nothing else drawn. Draw both panels the same size -
    volume 17 turns on whether a fleck can be seen at all.
  9 A SMALL WOODEN CUP TIPPED OVER, a thin flat spill of water a hand wide, hard edged.

FINISH: bowls on a tray are the place - medium grind, two passes, no contour. 🔴 The coarse one is
  whichever bowl the page is counting (the porridge in 24, the pushed dish in 04, the shards in 17),
  and only that one.

NOT: no character, no pink, no lettering, numerals or maker's mark, no glaze shine, highlight or
  rim light, no pattern or band on any vessel, 🔴 no steam from any bowl indoors (the anchor allows
  pot steam only where the script asks for it, and 24 says none), no cast shadow, no gradient.
```

### §2.6 Toys — 🔴 08권 · 여섯 개가 이 권의 시계다

```
PROP SHEET - Toys   (kota-mineral · SCENE token: Toys)

Kota's six wooden toys. One volume only, but they are on nine of its ten pages and THE NUMBER LEFT
ON THE FLOOR IS THE CLOCK OF THE BOOK: six blocking the whole corridor, then five, then none.

FORM - six pieces and never a seventh:
  THREE BOATS, ochre, plainly three different sizes, each a simple hull with a raised prow and at
    most 4 seam lines. The largest is as wide as the child's chest.
  ONE SMALL TUB, ochre, a shallow round tub the child can lift in both arms. 🔴 IT IS A TOY - it
    must be told at a glance from the big washing tub of volume 14 (see §2.13), which the child
    cannot lift at all. Draw the two side by side once on this sheet.
  TWO DIPPERS, ochre, round scoops with a short handle.

STATES:
  1 🔴 THE ROAD BLOCKED - all six laid across a corridor from wall to wall with NO gap wide enough
    for a foot. Draw this from the corridor's long axis, high, so the blockage is the shape.
  2 ONE FOOT'S WIDTH - the same six with a single toe-sized gap beside one wall.
  3 ONE BOAT LIFTED - the biggest boat in two arms, its bottom just over a basket rim.
  4 FIVE LEFT AND ONE LANE OPEN - a clear strip one board wide running the length of the floor.
  5 EMPTY FLOOR - nothing at all, the board grain running unbroken end to end.
  6 IN HARBOUR - the six heaped in a basket with the three prows and the two dipper rims and the
    tub rim all showing over the edge, countable.

FINISH: coarsest grind and a contour when a boat is being pushed or lifted (p1, p3, p5); everything
  else in the group is medium grind, two passes, no contour. 🔴 Never make all six coarse - the
  corridor would then have six things shouting and the child in it would be lost.

NOT: no character, no pink, no lettering, numerals or painted eyes on the boats, no water anywhere
  (these are indoors and dry), no wheels, no string, no cast shadow, no gradient or soft edge.
```

### §2.7 Pot — 🔴 07권 · 이 컷의 주인은 솥이 아니라 뚜껑이다

> 작업표에 **솥도 뚜껑도 없다**(부뚜막·부엌만 있다). 07 은 아홉 쪽에 솥이 있고 p6 은 컷 전체가
> 「들썩 기운 뚜껑과 새어 나오는 김 한 줄」이다 — §4 를 볼 것.

```
PROP SHEET - Pot   (kota-mineral · SCENE token: Pot)

The big stone pot on the kitchen ledge and its wooden lid. Volume 07 lives on this one object, and
the thing that changes is not the pot but HOW FAR THE LID IS TILTED.

FORM: a heavy round stone pot, burnt earth at a coarse grind, wider at the shoulder than the base,
  0 handles, 0 marks. Its wooden LID is a plain ochre disc with a turned knob at the centre and at
  most 3 seam lines. The lid is the more finished of the two on every page it matters.
🔴 THERE IS NO FIRE UNDER IT. No hearth, no stove mouth, no wood, no ash, no flame, no smoke -
  the ledge simply meets the floor. This is the volume where a painter is most likely to break the
  anchor, so the sheet says it twice.

🔴 THE LID HAS FOUR POSITIONS AND THE STEAM IS COUNTED OFF THEM. Draw the four in a row, same angle,
  same size:
  1 SHUT - the lid flat and level. Steam: ONE thread, fine grind, one pass.
  2 A KNUCKLE UP AT ONE EDGE, held by a hand at the knob. Steam: THREE passes pouring out of the
    gap and 🔴 ALWAYS AWAY FROM THE FACE AND HAND - the child is never in the steam's path.
  3 TILTED BY ITSELF, one edge a finger-joint high, nobody touching it. Steam: ONE straight column
    rising from the gap, and this lid and this column are the most finished things on the page while
    the pot body and the ledge fall back to medium grind.
  4 LIFTED OFF, held clear on a dry cloth. Steam: FOUR passes, a billowing column filling the upper
    half. 🔴 THE HAND THAT LIFTS IT IS ALWAYS AN ADULT'S AND ALWAYS WRAPPED IN A CLOTH, never bare.
STATES: the pot with the lid on, seen from a child's height at the ledge; the open pot with white
  buns heaped inside (a heap, not countable pieces); the pot at evening with one thread of steam.

FINISH: the pot is the place (medium grind, two passes, no contour) EXCEPT at lid position 3, where
  the lid alone takes the coarsest grind and the dry ink contour.

NOT: 🔴 no fire, flame, ember, wood, ash, stove mouth or smoke; no character above the wrist; no
  pink; no lettering or numerals on the lid; no shine on the stone; no bubbling or spitting water;
  no motion lines around a rattling lid - the tilt is the whole signal; no gradient or soft edge.
```

### §2.8 SteamedBun — 🔴 22권 · 반으로 갈린 단면에서 김 두 줄기

```
PROP SHEET - SteamedBun   (kota-mineral · SCENE token: SteamedBun)

The steamed buns of this kitchen. Volume 22 is built on ONE of them being halved, and volume 07
ends with a basketful of them.

FORM: a plump round bun, SHELL WHITE painted at a fine grind (never bare, never pure white), the
  outline slightly squared at the base where it sat down. 0 folds, 0 pleats, 0 marks on the skin.
STATES - draw all at consistent scale:
  1 WHOLE, on a dish, with ONE thread of steam.
  2 🔴 HALVED - the two halves parted a finger's width on the dish, each cut face flat and dead
    matt, and TWO COLUMNS OF STEAM rising side by side from them. The columns are shell white at
    the finest grind, laid over the dark kitchen doorway behind so the doorway still shows through,
    and they are the most finished thing on the page. This is the whole picture of volume 22.
  3 ONE HALF, held, one thread of steam.
  4 BITTEN - one clean bite gone from the edge, the inside the same shell white as the skin.
  5 A HEAP in a basket, the individual buns NOT countable - one mass with a bumpy outline.
🔴 THE KNIFE: a plain ochre kitchen knife, one straight blade, no shine. It appears in two panels
  only and in both of them IT IS IN AN ADULT'S HAND, held low, with the point turned away from any
  child in the frame. Never on a table, never within a child's reach, never drawn alone.

FINISH: a bun on a dish is the place. The halved pair (state 2) is the coarsest thing on its page.

NOT: no character above the wrist, no pink, no lettering or numerals, no filling shown, no glisten
  or sheen on the skin, 🔴 no fire and no stove behind them, no crumbs, no gradient or soft edge.
```

### §2.9 Radish — 🔴 04권 · 흙 밑에 숨은 단맛이 이 권의 그림이다

```
PROP SHEET - Radish   (kota-mineral · SCENE token: Radish)

The white radish of the kitchen garden. Volume 04 turns on it: a strange green thing on a plate is
the handle of something pale and sweet that is buried, and the child pulls it out himself.

FORM: a long white root, SHELL WHITE painted, tapering, with a few fine side roots left on; above
  it a bunch of GREEN leaves as tall as the root is long. 🔴 THE LEAVES AND THE ROOT ARE ONE OBJECT
  and the sheet must show that the green heap on the ridge and the white root under the soil belong
  together - that is the whole idea of the book.
STATES - draw all at consistent scale:
  1 IN THE GROUND - only the green bunch showing above the ridge, the soil unbroken.
  2 COMING UP - the root more than half out, the wet dark soil split open around it, a few soil
    grains in the air. Soil clings to the root in patches.
  3 CLEANED - the root pale and smooth, soil gone, one or two side roots left, leaves still on.
  4 BITTEN - one bite out of the side, the exposed inside a shade paler than the skin.
  5 HELD OVERHEAD - the whole thing at arm's length, leaves hanging down, a few grains falling.
  6 IN A BASKET - one, then two, then three roots, drawn as three panels so the count reads.
  7 THE HOLE LEFT BEHIND - a dark opening in the ridge where one was pulled, the ridge otherwise
    unbroken. 🔴 This is how volume 04's last page remembers the afternoon.
  8 AS FOOD - the same green leaves chopped into a heap on a shallow dish, one side scooped hollow.

FINISH: the radish is the coarsest thing on the page in states 2, 4 and 5 (the pulling, the bite,
  the holding up) and takes the dry ink contour there. In the ridge (state 1) it is the place.

NOT: no character above the wrist, no pink, no lettering or numerals, no cartoon face on the
  vegetable, no sparkle or shine on the skin, no steam, no cast shadow, no gradient or soft edge.
```

### §2.10 Stones — 🔴 10권은 「같은 돌인데 다른 물건」이 전부다

```
PROP SHEET - Stones   (kota-mineral · SCENE token: Stones)

Two kinds of stone. Volume 10 is entirely about telling a WET one from a DRY one at a glance, and
volume 21 opens on a small one standing proud of the earth.

FORM A - BATH-SIDE STONE (10, 15, 25, 01). A rounded flat-topped stone at the edge of the water.
  🔴 THE ONLY DIFFERENCE BETWEEN WET AND DRY IS TWO THINGS, AND BOTH ARE NEEDED:
    WET  = burnt earth at a coarse grind, DARKER, plus ONE small SHELL WHITE dot on the crown, hard
           edged and not spread. One dot per stone. Never two.
    DRY  = the same stone, the same shape, ground finer and painted paler, DEAD MATT, 0 dots.
  Draw them touching each other in one panel at one size - this is the panel volume 10 needs and it
  must work at thumbnail. Between wet stones a thread of water runs, one azure pass, hard edged.
FORM B - THE STUB IN THE YARD (21). A small stone half sunk in bare earth, only its crown showing,
  the earth around it undisturbed. Beside it, ONE scraped streak in the earth a stride long, and a
  few loose grains. 🔴 IT IS SMALL AND IT IS NOT COARSE - it must be findable but not shouted, or
  the page tells the reader to trip before the child does.

STATES:
  1 One wet and one dry stone side by side, touching, same angle.
  2 A line of wet stones leading out of frame like stepping stones, each with its one dot.
  3 The boundary: wet dark stone on one side, matt dry earth on the other, the join a hard line.
  4 A wet stone with a dragged streak across it (see §2.1 state 8).
  5 The yard stub, and the same stub with the scrape beside it.
  6 A bath rim stone, half in the water: dry and pale on top, burnt earth where the water reaches,
    the line between them straight and hard.

FINISH: 🔴 THE DOT IS THE ONLY PLACE SHELL WHITE APPEARS ON A STONE and it is laid last, at the
  finest grind, one pass. Stones are the place they stand in - medium grind, no contour - except in
  volume 10's close panels (p4, p5) where the two compared stones are the page's coarse things.

NOT: no character, no pink, no lettering or numerals, no sparkle, star, streak or lens flare on the
  dot, no reflection in the water, no moss, crack or texture drawn inside the stone field, no
  gradient, glow or soft edge.
```

### §2.11 BeadNecklace — 🔴 23권 · 젖은 돌과 같은 문법을 목에 건 것

> 작업표에 「목걸이」가 없다 — 구슬(7쪽)·호분(8쪽)·빛점(5쪽)으로 흩어져 있었다. §4 를 볼 것.

```
PROP SHEET - BeadNecklace   (kota-mineral · SCENE token: BeadNecklace)

A guest's glass bead necklace. Volume 23 has it on eight pages: found, carried at a run, spilled
into two cupped hands, and set back down. It is the only sparkling thing in twenty-five books.

FORM: ONE thread strung with round glass beads - fix the count on this sheet and never change it
  from page to page (a child counts them without being asked to). Each bead is a small PALE flat
  field, azure ground fine, with 🔴 ONE SHELL WHITE DOT ON ITS UPPER FACE, hard edged, one pass -
  exactly the same mark as a wet stone's crown (§2.10), because in this book a glossy thing is a
  pale field with one painted dot and nothing else. The thread itself is one hair-thin ink line.
🔴 THE DOTS ARE THE OBJECT. Read at a distance, the necklace IS its row of dots, and every state
  below is a different shape made by that row.

STATES - draw all at consistent scale:
  1 AT REST - laid on boards in a closed ring, the dots evenly spaced round it.
  2 SWUNG OUT - hanging from two fingers at a run: the beads flung outward in a taut ARC, the
    thread straight and tight, the dot row a single curve. Nothing else in the panel.
  3 SCATTERED ALONG A WAVE - the same arc broken into an uneven S, the dot row wobbling.
  4 POOLED IN TWO CUPPED HANDS - the beads gathered, the thread lying in a short straight line, the
    dot row calm. 🔴 Panels 2 and 4 are the two ends of this book and must be drawn the same size.
  5 FALLING INTO THE HANDS - two or three beads already touching a palm, the rest still on the
    thread coming down.
  6 ON THE CABINET, in the bright face of an open paper door: the same ring as state 1 but the dots
    at their most distinct in the book, and not one bead out of place.

FINISH: the necklace is the coarse thing on the page whenever a hand is on it (states 2, 4, 5) and
  takes the dry ink contour there. On the boards and on the cabinet it is the place - but the DOTS
  are laid last at the finest grind in every state without exception.

NOT: no character above the wrist, 🔴 no pink (the beads are pale azure, never peach - the one pink
  in this series is at the child's neck), no lettering or numerals, no starburst, twinkle, ray or
  lens flare, no transparency or refraction, no reflection of the beads in the boards, no gradient.
```

### §2.12 PaperAndBrush — 🔴 18권 · 그림 안에도 글자가 없다

```
PROP SHEET - PaperAndBrush   (kota-mineral · SCENE token: PaperAndBrush)

A sheet of paper, a brush and a dish of ink. Volume 18 turns a child who cannot say goodbye into a
child who draws one, folds it small, and pushes it under a knot.

FORM: THE PAPER is a rectangle about as wide as the child's two hands, SHELL WHITE painted at a
  fine grind - the brightest thing on the boards, and never bare support. THE BRUSH is a slim ochre
  shaft with a dark tuft, ink staining the shaft where the fingers hold it. THE INK DISH is a small
  shallow ochre bowl with one flat black field in it.
🔴 THE DRAWING ON THE PAPER IS A FOUR-YEAR-OLD'S HAND AND NOT THIS BOOK'S STYLE: lines wobbling
  thick then thin, a circle that does not close, no contour discipline, no passes. It shows a
  bent-backed figure with a big round shell, a small figure holding its hand, one big round bath,
  and three wriggly steam lines. 🔴 THERE IS NOT ONE WRITTEN MARK IN IT - no letters, no numerals,
  no name, no heart. The anchor's `NOT ONE WRITTEN MARK ANYWHERE` includes what a character draws.

STATES - draw all at consistent scale:
  1 ROLLED, held out in an adult hand with the brush beside it.
  2 SPREAD FLAT AND BLANK on boards, corners held down by two palms.
  3 DRAWN ON - the child's picture above, complete.
  4 FIRST FOLD - the sheet halved, one crease standing, the picture folded away inside so only part
    of it shows at the open edge.
  5 SECOND FOLD - a small thick square, its folded corners plump, and 🔴 ONE SEVERED SCRAP OF AN INK
    LINE running off the folded edge and stopping - the tail of one wriggly steam line. That cut
    line is how the reader knows the drawing went inside.
  6 THE SQUARE UNDER A KNOT - tucked beneath the tie of a bundle with one corner still peeping out.
  7 A NEW BLANK SHEET, brush and ink dish waiting beside it, nothing drawn.

FINISH: paper on the boards is the place. 🔴 The sheet is the coarsest thing on the page while it is
  being drawn on and while it is being folded (states 3, 5) - and the brush is coarse only in the
  panel where it is moving.

NOT: no character above the wrist, no pink, 🔴 no lettering, numerals, letters, signature or symbol
  anywhere - not on the paper, not in the drawing, not on the dish; no ink splatter or spray, no
  paper texture or fibre drawn, no curl or shadow under the sheet, no gradient or soft edge.
```

### §2.13 WashTub — 🔴 08의 장난감 대야와 크기가 정반대다

```
PROP SHEET - WashTub   (kota-mineral · SCENE token: WashTub)

The big wooden washing tub in the yard. Volume 14 works out of it for seven pages; volume 02 has it
stood on its side against a wall.

FORM: a wide shallow round tub of staved wood, ochre at a medium grind, one hoop line round the
  outside and at most 5 stave lines. 🔴 IT IS TOO BIG FOR THE CHILD TO LIFT: standing beside it, the
  rim is at his chest. Put a plain child silhouette beside it in ONE panel to fix that, and nowhere
  else. 🔴 DRAW THE TOY TUB OF VOLUME 08 (§2.6) BESIDE IT AT THE SAME SCALE IN THAT PANEL - the two
  are the same word and the opposite size, and a painter with only the word will get it wrong.
STATES:
  1 FULL - one flat field of azure inside, level with a hard straight edge, nothing under it drawn.
  2 WITH LUMPS BESIDE IT - the tub and two small wrung bundles set on the earth by its foot.
  3 TIPPED - lying over on its side, the water gone out in one flat hard-edged sheet on the earth.
  4 EMPTY AND UPRIGHT - the inside dry, the stave lines showing.
  5 STOOD ON ITS RIM against a wall, pushed askew.

FINISH: the tub is the place - medium grind, two passes, no contour - on every page. 🔴 It is never
  the coarse thing: in volume 14 the coarse things are the quilt and the child.

NOT: no character above the knee (a silhouette only, for scale), no pink, no lettering or numerals,
  no soap, foam or bubbles, no ripple, glint or reflection on the water, no metal hoop shine, no
  cast shadow, no gradient or soft edge.
```

### §2.14 ClothesLine

```
PROP SHEET - ClothesLine   (kota-mineral · SCENE token: ClothesLine)

The washing line across the yard. Volume 14 ends on it; volume 06 has it quietly in the background.

FORM: one cord between TWO posts, the posts plain ochre uprights sunk in the earth, the cord one
  thin ink line that sags slightly and never straight. At the foot of one post, a small basket of
  wooden pegs. 🔴 THE LINE IS HIGHER THAN THE FATHER'S HEAD - a child on the ground cannot reach it,
  which is why volume 14 puts him on somebody's shoulders.
STATES:
  1 EMPTY, the cord sagging, the yard behind it.
  2 THREE QUILTS HUNG - one large in the middle and two small either side, 🔴 ALL THREE BELLYING
    THE SAME WAY, their lower edges lifted. Wind is read only by the fact that they agree.
  3 A ROW OF WHITE TOWELS, all the same length, hanging still.
  4 EMPTY AT DUSK - the same frame as 1, the cord a single line against a sunk yard.

FINISH: the line is the place. 🔴 In volume 14 p7 the three filled quilts ARE the page and take the
  coarsest grind - but then the posts and the cord drop back and the child below stays fine.

NOT: no character, no pink, no lettering or numerals, no flapping lines, motion arcs or speed marks,
  no drawn folds in the hanging cloth, no birds, no cast shadow, no gradient or soft edge.
```

### §2.15 Basket — 🔴 크기 넷을 한 줄에

```
PROP SHEET - Basket   (kota-mineral · SCENE token: Basket)

The woven ware of the inn. Nine volumes carry one, and they are FOUR different sizes doing four
different jobs - which is exactly why they go on one sheet: a painter given the word alone will
draw the same basket every time and volume 08's harbour will stop holding six toys.

FORM: all four are woven ochre at a medium grind, and 🔴 THE WEAVE IS GRAIN INSIDE THE FIELD AND
  NEVER AT THE EDGE - the rim is a cut edge with no wobble. At most 6 weave lines on any one of
  them; the weave gets finer, not busier, as they get further away.
🔴 THE FOUR, DRAWN IN ONE ROW AT TRUE RELATIVE SIZE (this row is the point of the sheet):
  A FLAT TRAY - shallow and wide, stands against a kitchen wall, holds buns.
  B CARRYING BASKET - the one the father holds in both hands, deep enough for folded towels, its
    rim at his waist when carried.
  C CORNER BASKET - the tall one at the end of the corridor. 🔴 IT MUST TAKE ALL SIX TOYS OF §2.6
    with their prows and rims showing over the edge, so its mouth is at least as wide as the largest
    boat is long.
  D LAUNDRY HAMPER - the biggest, oval, with a rim to grip at each end: 🔴 TWO PEOPLE CARRY IT, one
    at each end, and a child on his own cannot.
STATES: each of the four empty; B full of white towels; C with the six toys heaped so their number
  can be counted from the rim; C empty; D full of white towels with a hand on each end grip.

FINISH: baskets are the place on every page - medium grind, two passes, no contour. 🔴 The only
  exception is volume 08 p5, where the boat going in is coarse and the basket is not.

NOT: no character above the wrist, no pink, no lettering, numerals or tags, no handle unless named
  above, no lid, no cloth lining, no cast shadow, no gradient or soft edge.
```

### §2.16 Bundle — 🔴 손님 등록부와 한 벌이다

```
PROP SHEET - Bundle   (kota-mineral · SCENE token: Bundle)

What a guest arrives carrying. The anchor says a guest wears no cloth at the neck or waist and has
ONE travelling thing on the outline instead - this sheet fixes what that one thing looks like, and
🔴 WHICH GUEST CARRIES WHICH IS SET BY THE GUEST REGISTER (`KOTA_GUESTS`), NOT BY THE PAGE.

FORM - four road shapes and one house shape:
  1 BACK BUNDLE - a squared cloth knotted at the top, carried high on the back, the knot two ears of
    cloth. Ochre or green, one flat field, at most 3 seam lines, 0 pattern. (crane · boar · heron ·
    swan · hippo · owl)
  2 SHOULDER BUNDLE - the same shape at half the size, slung at a child guest's shoulder, small
    enough to bounce when he jumps. (frog child · tanuki child)
  3 BIG BACK LOAD - a tall lumpy pack that rises above the shoulders, with an open mouth at the top
    that things can be taken out of. (ox)
  4 CARRYING FRAME - a wooden A-frame with two shoulder cords, stood leaning against a doorpost when
    not worn. (ox, volume 19)
  5 🔴 THE HOUSE SHAPE - a market net-bag, bulging, carried on the FATHER'S back with one hand on
    the cord (volume 25). It is the one bundle in twenty-five books that belongs to this house, and
    it must read differently from all four road shapes: open netting, not knotted cloth.
🔴 A GUEST WITH NO BUNDLE AT ALL: the turtle carries a stick instead (§2.20). Do not give her one.
🔴 A HOUSE TOWEL IN A GUEST'S HANDS IS CARRIED, NOT WORN - never at the neck or waist.

STATES: each of the five worn; each set down on boards or earth; the back bundle with its knot
  opened and one corner of a small folded square peeping out from under the tie; the big load set
  down with its mouth open.

FINISH: a bundle is the place - it is on a back and the back is a figure. 🔴 It becomes coarse only
  in the two panels where something goes into it or comes out of it (18 p7, 08 p8).

NOT: no character above the shoulder, no pink, no lettering, numerals, crest or luggage tag, no
  buckles, straps or hardware beyond the cords named, no pattern on the cloth, no gradient.
```

### §2.17 MealTray

```
PROP SHEET - MealTray   (kota-mineral · SCENE token: MealTray)

The low wooden tray-table the father carries food on. Four volumes have it, and in 24 the bowl
standing on it is the clock of the whole book.

FORM: a small rectangular ochre tray on four short legs, low enough to set straight down on the
  boards, wide enough for one bowl and one spoon and no more. At most 5 seam lines, 0 carving, 0
  lacquer shine. 🔴 IT IS CARRIED IN BOTH HANDS AT THE WAIST - this is the object that keeps the
  father's hands full through most of twenty-five books, so its width is fixed by his two hands.
STATES:
  1 CARRIED, level, one bowl on it.
  2 SET DOWN on boards, level.
  3 🔴 SET DOWN ASKEW, pushed out of square, with a gap in the row of bowls where one is missing -
    the state that says something happened here (17 p1, 13 p2).
  4 EMPTY, carried away.
🔴 IT IS NOT THE MEAL TABLE. See §2.18 - one is carried and one is sat at, and folding them would
  make the father's arms and the child's dinner the same drawing.

FINISH: the place, always. Medium grind, two passes, no contour. What is ON it may be coarse.

NOT: no character above the wrist, no pink, no lettering or numerals, no lacquer sheen or highlight,
  no carving or inlay, no cloth on it, no cast shadow, no gradient.
```

### §2.18 LowTable

```
PROP SHEET - LowTable   (kota-mineral · SCENE token: LowTable)

The low table people sit at to eat, on the meal boards. Four volumes use it.

FORM: a plain ochre rectangle on four short legs, its top at a seated child's chest. 🔴 THERE ARE
  ALWAYS TWO OF THEM WHEN A GUEST IS STAYING - the child's and the guest's - set apart with a gap
  of floor between, and the guest's is the larger. 0 cloth, 0 carving, at most 4 seam lines.
STATES:
  1 THE CHILD'S TABLE laid: one rice bowl at centre, one side dish, chopsticks.
  2 🔴 THE SAME WITH THE SIDE DISH PUSHED TO THE FAR EDGE, its foot almost over the corner and
    nothing spilled - volume 04 opens exactly here and it must read at thumbnail.
  3 THE GUEST'S TABLE with emptied bowls.
  4 BOTH TABLES IN ONE FRAME at their true relative sizes with the floor gap between them.
  5 CLEARED - bare top, one cushion beside it, nobody there.

FINISH: the place, always. The bowl on it is what goes coarse (§2.5).

NOT: no character, no pink, no lettering or numerals, no tablecloth or runner, no carving, no
  lacquer shine, no cast shadow, no gradient.
```

### §2.19 Cushion

```
PROP SHEET - Cushion   (kota-mineral · SCENE token: Cushion)

The flat sitting cushion. Small, but volume 13 lifts one to look under it, and two other volumes use
an empty one to say who is not there.

FORM: a flat square pad, green or ochre, one flat field, corners slightly rounded, 0 pattern, 0
  piping, 0 tuft, 0 stitching. About as wide as the child is tall from knee to shoulder.
STATES:
  1 LYING FLAT on boards.
  2 🔴 LIFTED BY ONE CORNER - the pad bent up and the boards underneath BARE. The point of the panel
    is that there is nothing under it.
  3 PRESSED - lying flat with its middle visibly dented, the shape somebody left.
  4 EMPTY BESIDE A TABLE - flat, square to the table, nobody on it.

FINISH: the place, always - except state 2, where the lifted corner is the coarse thing on the page.

NOT: no character, no pink, no lettering or numerals, no pattern, tassel, button or piping, no
  drawn folds, no cast shadow, no gradient.
```

### §2.20 Stick — 🔴 등록부가 「늘 지팡이를 짚는다」고 정해 놓은 것

```
PROP SHEET - Stick   (kota-mineral · SCENE token: Stick)

The walking stick of the old guests. The guest register gives the turtle a stick instead of a
bundle, and the heron grandmother of volume 25 leans on one too, so this is a cast fixture as much
as a prop.

FORM: a plain wooden staff, ochre at a medium grind, slightly thicker at the head where two hands
  rest, the foot blunt. At most 3 seam lines, 0 carving, 0 ferrule, 0 strap. Its length reaches the
  chest of whoever uses it.
STATES:
  1 PLANTED, both hands stacked on the head, the body's weight leaning into it, and 🔴 THE FOOT
    PRESSED A LITTLE INTO THE EARTH with a small dent around it - the mark of a long walk.
  2 IN ONE HAND while walking, the foot just clear of the ground.
  3 LAID DOWN FLAT on boards beside its owner.
  4 LAID ON A STONE at the water's edge, level.
  5 🔴 LEANED AGAINST A DOORPOST WITH BOTH HANDS EMPTY - the state for the page where somebody puts
    the stick down to hold a child with both arms.

FINISH: the place. 🔴 Coarse only in state 1, where the leaning is the page.

NOT: no character above the wrist, no pink, no lettering or numerals, no carved head, ferrule, cord
  or decoration, no shine on the wood, no cast shadow, no gradient.
```

### §2.21 Spectacles — 🔴 13권이 이것을 찾아 열 쪽을 돈다

> 작업표에 안경이 없다(방석만 있다). 컷에는 「안경을」 꼴로 두 쪽뿐이라 3쪽 문턱에 걸렸다 — §4.

```
PROP SHEET - Spectacles   (kota-mineral · SCENE token: Spectacles)

An old guest's folding spectacles. Volume 13 hunts for them for seven pages and finds them on the
eighth, so the object has to survive being small: it must be recognisable held flat in two palms.

FORM: two round rims joined by a bridge, with two arms that fold in. The rims are INK, one thin
  even line each. 🔴 THE LENSES ARE NOT WHITE AND NOT EMPTY: each is a very pale azure field, one
  pass, with ONE small SHELL WHITE dot on its upper left, hard edged - the same mark as a wet stone
  and a glass bead (§2.10, §2.11), because that is how this book says glass. No transparency, and
  nothing behind a lens shows through it.
STATES - draw all at consistent scale:
  1 FOLDED - arms in, lying flat, the two rims overlapping slightly, seen from above.
  2 FOLDED, HELD - resting flat across two small upturned palms at chest height. 🔴 THE PALMS FIX
    THE SIZE: the pair is not much wider than one child's hand.
  3 OPEN - arms out, seen three-quarters.
  4 ON A FACE - sitting on a muzzle, one finger pushing an arm up at the temple. The rims sit BELOW
    the guest's own ink marking and never cross it. 🔴 An ink shape on a face is who somebody is in
    this book, so the spectacles must not be mistaken for one: keep the rims thin and round and keep
    them clear of the marking's line.
  5 NOT THERE - a shelf top and a bench top drawn empty at the exact spots the spectacles are looked
    for. Volume 13 needs the absence to be drawable.

FINISH: coarsest grind and a contour in states 2 and 4 (found, worn). Elsewhere the place.

NOT: no character beyond the muzzle in state 4, no pink, no lettering or numerals, no glare,
  starburst or reflection on a lens, no chain or cord, no case, no cast shadow, no gradient.
```

---

## §3. 🔴 §1 자리 시트가 받을 조항 — 사물에서 빼며 넘긴 것

사물이 아니라 자리인데, **그 권이 기대는 성질**이라 그냥 「자리 몫」으로 넘기면 잊힌다.
§1 을 쓸 때 아래 아홉을 조항으로 넣지 않으면 그 권이 흔들린다.

| 자리 | 넣을 조항 | 왜 |
|---|---|---|
| `[Entry]` 문간 | **넓적한 디딤돌 하나에 몇 켤레가 서는가** — 어른 신 네 켤레와 아이 나막신 한 켤레가 한 줄로 서는 폭 | 02 가 켤레 수로 손님이 바뀐 것을 말한다. 돌이 좁으면 그 줄이 안 선다 |
| `[Corridor]` 복도 | **밤 조항** — 어둠은 짙은 남빛 한 판이고 그 안에 장지문 틀 모서리 선 몇 개만 각지게 남는다 | 앵커에 밤 조항이 `GUEST ROOM` 에만 있어 **09 는 자리 조항 없이 그려진다**(그 권 전체가 밤 복도다) |
| `[Meal]` 밥상 마루 | **널 끝 아래 마루 밑 어둠** — 한 판의 검정, 그 안에 든 것은 흰 점으로만 보인다 | 17 의 사건이 그 어둠 속 흰 조각이다 |
| `[Changing]` 탈의 마루 | **선반 칸 셋의 폭과 높이** — 아이가 까치발로 첫 칸에 닿고 맨 위 칸에는 못 닿는다 | 12 가 산 셋을 칸마다 쌓고, 다른 권이 「닿는 칸/안 닿는 칸」을 쓴다 |
| `[GlassDoor]` 유리문 | **김 세 두께**(막 서린 것 / 손가락이 닿은 자리 / 마르며 옅어진 것) + **닦인 투명 줄** + 나무 살 칸 수 | 19 는 열 쪽 중 여덟이 이 문이고, 그림이 **유리 위에서** 벌어진다 |
| `[GuestRoom]` 손님방 | **문갑 하나의 자리** — 🔴 23 과 25 가 같은 방이라 문갑이 같은 데 있어야 한다 | 25 p5 가 그렇게 적혀 있다 |
| `[Yard]` 마당 | **평상 하나** — 10 과 13 이 같은 평상을 쓴다 | 두 권이 각자 평상을 만들면 마당이 두 개가 된다 |
| 장지문 (여러 자리) | **밝기 3단계** — 캄캄 / 잔광 / 번쩍(번개 한 찰나) | 16 의 사건이 문 한 판이 번쩍하는 순간이다 |
| `[Garden]` 텃밭 | **이랑 서너 줄 · 고랑마다 낮은 김 한 겹** + 무를 뽑은 흙 구멍이 남는다 | 04 의 마지막 쪽이 그 구멍을 다시 본다 |

## §3-b. 🔴 앵커에 신고 — 사물 때문에 깨지는 자리 셋

**① 등불이 앵커의 「불 금지」와 부딪히고, SCENE 이 열 쪽 넘게 손으로 때우고 있다.**
앵커 `NOT` 은 `no hearth, no stove, no lit wood, no flame, no smoke` 라 **등불 자체는 안 막는다.**
그런데 모델은 등불을 그리면 불꽃을 그리므로, 지금 SCENE 들이 「🔴 불꽃은 화면에 없다」·「심지도 갓에
가려 화면에 없다」를 **09 p4 · 09 p10 · 17 p6 · 17 p10 · 18 p1 · 18 p10 · 19 p10 · 22 · 24 p1** 에서
각자 적고 있다. 🔴 **같은 병이 아홉 곳이면 고칠 곳은 그 아홉이 아니라 앵커 한 줄이다.**
→ `NOT` 에 넣을 문장: `a lamp is drawn as a CLOSED SHADE and the hard-edged patch it throws; the
flame, the wick and any smoke are never in frame`.

**② 팔레트에 노랑이 없는데 09 의 그림이 「노란 동그라미」다.**
`PALETTE` 는 GROUND · SHELL WHITE · AZURE · GREEN · OCHRE · BURNT EARTH · INK · PEACH PINK 여덟이고
노랑이 없다. 09 는 일곱 쪽이 「노란 원」이라 화가가 팔레트 밖 색을 쓰거나 원이 흐릿해진다.
→ 이 문서는 **「OCHRE 를 가장 곱게 갈아 한 겹」**으로 못박아 뒀다(§2.4). 앵커 `PALETTE` 에 같은 한
줄을 넣어 두는 편이 안전하다. 🔴 새 색을 늘리자는 게 아니다 — 늘리면 「광물색 넷」 규칙이 무너진다.

**③ `AT MOST TWO THINGS ON A PAGE GET THE COARSEST GRIND` 를 지킬 수 없는 쪽이 있다.**
14 p7 은 이불 셋이 한꺼번에 널려 부푼 것이 그 권의 그림이고, 08 p1 은 장난감 여섯이 복도를 막은 것이
사건이다. 둘 다 **한 무리를 하나로 세는** 쪽이다.
→ 앵커에 넣을 예외 한 줄: `a set that the page counts as ONE thing (three quilts on a line, six toys
across a floor) is one of the two`. 안 넣으면 화가가 셋 중 둘만 거칠게 그려 개수가 깨진다.

---

## §4. 🔴 작업표(`_PROP-SHEETS.md` 의 `## kota` 절)가 틀린 자리

**그 권의 주인공 사물 여섯이 후보에 아예 없다.** 이 표를 만든 이유(퐁이 08 의 의자)와 같은 사고다.

| 빠진 것 | 실제 | 표에 있는 것 |
|---|---|---|
| **솥과 뚜껑**(07) | 소품 9쪽 · p6 은 컷 전체가 뚜껑 | 부뚜막 · 부엌 |
| **찐빵**(22) | 소품 8쪽 · p5 가 그 권의 그림 | 소쿠리 · 접시 · 밥상 |
| **무**(04) | 소품 5쪽 · 컷 3쪽 · 그 권의 교훈이 이 물건 | 밥상 · 이랑 |
| **목걸이·구슬**(23) | 소품 8쪽 · p1 이 「이 권의 그림 하나」 | 왼쪽에서 · 오른쪽으로 |
| **종이와 붓**(18) | 소품 4쪽 · 이 권의 해결 | 널에 |
| **안경**(13) | 일곱 쪽을 찾아 돌고 p8 에 얼굴에 걸린다 | 방석 |

원인은 셋이고 전부 `extract-series-stages.mjs` 에서 확인된다.

1. 🔴 **조사가 붙으면 딴 낱말이 된다.** 토큰이 `[가-힣]{2,6}` 라 `찐빵` · `찐빵은` · `찐빵의` 가 각각
   센다. 22 의 찐빵은 여덟 쪽에 나오는데 **어느 형태로도 3쪽을 못 채운다.** 안경(`안경을` 2쪽) ·
   목걸이(`목걸이가` 2쪽)도 같은 이유다.
2. 🔴 **한 글자 낱말은 원리상 못 잡는다.** `{2,6}` 이라 **솥 · 무 · 배 · 칼**이 통째로 없다.
   07 은 솥이 컷에만 여섯 쪽인데 후보에 한 번도 안 올랐다.
3. 🔴 **표에 싣는 기준이 사실상 `lead`(컷에 이름이 적혔나)다 — 그러면 카메라 어절이 그 자리를 먹는다.**
   실측: 추출기는 kota 에서 사물을 **188개** 찾는데(`extract-series-stages.mjs kota`) 표에는 58개뿐이고,
   **그 58개가 58개 모두 컷 라벨에 있는 낱말**이다(대조 스크립트로 확인). 그래서 23 권의 두 자리를
   차지한 것이 「왼쪽에서 · 오른쪽으로」이고 정작 여덟 쪽짜리 목걸이는 없다. 「컷에 적힌 것이 그 권의
   주인공」은 맞는 가설이지만 **컷에는 카메라도 같이 적힌다** — 01 · 02 · 08 · 11 · 12 · 24 의 후보에
   「비스듬히」가 올라 있는 것이 같은 증상이다.

→ 고칠 곳은 셋 다 한 줄씩이다: ①낱말 끝의 조사를 떼고 세기 ②`{1,6}` 로 늘리되 한 글자는 STOP 을 두기
③`lead` 를 **정렬 가중치로만** 쓰고 표에는 소품 칸 빈도가 높은 것도 실을 것.
🔴 **고치기 전에는 다른 시리즈에서도 「한 글자 사물」과 「조사가 자주 붙는 사물」이 계속 빠진다.**

## §5. 권별 경로표

권별 자리 이동은 `changjak-plan.html` 의 권별 경로표가 든다(`build-series-routes.mjs`).
이 문서는 **무엇이 있고 그것이 어떤 상태인가**만 정한다.
