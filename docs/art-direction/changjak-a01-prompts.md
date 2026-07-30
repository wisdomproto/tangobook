# 창작동화 1000 — A-01 「부끄러우면 털이 빨개져」 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`, 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/a01.md`.** 아래 12컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다.
> 🔴 **작가 실명은 한 글자도 안 들어간다.** 근거 후보 id 는 판정 표에만 남기고 프롬프트에서는 전부 문구로 옮겼다.
> 🔴 **이미지 생성은 art-director 가 하지 않는다.** 아래는 사용자가 직접 굽기 위한 프롬프트 세트다.

## 0. 실행 순서 (어기면 인물만 매끈한 CG 로 나온다 — §2.4)

1. **STYLE ANCHOR 로 캐릭터 시트를 먼저 굽는다.** 장면 금지. 순서 = `FoxBare` → `FoxBlush` → `LaneNeighbours`.
2. 🔴 **시트 승인 뒤에도 12컷을 한 번에 굽지 않는다.** **p4 (빨강 0 · 맨 종이 여우) 와 p9 (빨강 최대 · 화면 90%) 를 먼저** 굽는다. 이 책의 사건은 그 두 극 사이의 이동 전부이므로, 양 끝이 흔들리면 사이 열 장을 다시 굽는다.
3. 그 다음 **p12 는 맨 마지막에, p4 승인본을 `@image` ref 로 붙여서** 굽는다(같은 길·같은 각도, 좌우 반전 금지).
4. 승인 렌더 3장을 앵커 보관함 ref 슬롯에 넣는다 — 🔴 **인물 컷 1 · 배경이 회색 워시 한 겹으로만 남은 컷 1(p4 또는 p6) · 전체 장면 1**. 3장이 전부 배경 완성형이면 "세계는 덜 그린다"는 문구가 영영 안 먹는다(점눈이에서 실제로 겪은 일, §2.7 보정).
5. 앵커 이름은 **렌더를 보고 짓는다**(§7.5-3). 지금은 슬러그만 쓴다: `changjak-a01`.

---

## A-01 §1. 앵커 배정

### 🔴 먼저 — §7.4 의 기존 A-01 앵커 초안은 **폐기한다**

`verified-references.md` §7.4 에 이 권의 STYLE ANCHOR 초안(C6 · 석판 크레용 + 안개 + 빨강 1색)이 있다. **지금 본문과 안 맞는다.** 요약을 믿지 말고 대본을 읽어서 대조한 결과가 이렇다.

| 초안이 전제한 것 | 지금 본문(`docs/changjak-books/a01.md`) | 판정 |
|---|---|---|
| 엔진 = 규칙 깨기 | **오해와 반전** (note: 판을 통째로 갈았다) | 초안 무효 |
| 감정 = **화** ("화가 나면 털이 빨개져") | **부끄러움** — 그리고 부끄러움은 「남이 볼 때」 생긴다 | 초안 무효 |
| 🔴 지배면 = **안개가 화면 80%** | **안개가 한 쪽도 없다.** p1 맑은 아침 · p5 소나기 · p12 해 쨍쨍. note 가 안개·등대 장치를 **명시적으로 폐기**했다("안개와 감정이 서로를 죽였다") | 🔴 **고칠 수 없다** — 앵커의 지배면 자체가 사라졌다 |
| 매체 = 석판 크레용·오일 파스텔(마른 왁스) | 규칙 3 = **「부끄러움이 가시면 천천히 빠진다」** | 🔴 **마른 왁스로는 물리적으로 불가능하다.** 크레용은 얹으면 안 물러난다 |

**결론: 갈아치운다.** 특히 마지막 줄이 결정적이다. 이 권의 규칙은 세 개인데(빨개진다 / 보면 더 빨개진다 / **천천히 빠진다**) 마른 매체는 세 번째를 못 그린다. **빨강이 오고 가는 책이라면 매체가 물이어야 한다.** 물은 기어오르고, 멈추고, 마르며 물러난다 — 이 권의 규칙 세 줄이 곧 물의 물리다.

덤으로 클러스터 사정도 같은 방향이다: C6 이 **4/16 로 포화**(a01·a04·c37·g88), §7.5 가 다음 몇 권은 C6·C3 을 피하라고 적어 뒀다.

### 이 권이 그림에 요구하는 것 (판정의 전제)

1. **빨강의 양과 위치가 곧 감정의 기록이다.** 이 권에서 실제로 변하는 것은 딱 하나 — 여우 몸의 빨강. 서사가 색에 있으므로 §2.9 를 만족하는 것으로는 부족하고, **빨강이 「어디까지 왔는지」가 쪽마다 눈에 보여야** 한다.
2. **번지고, 멈추고, 물러난다.** p1 = 발끝부터 스르르 올라오는 **중간** / p8 = 온몸 + 고인 물까지 / p11 = 천천히 빠져나감 / p12 = 원래 색. 방향과 속도가 있는 색이다.
3. **얼굴이 연기해야 한다**(§2.8). 부끄러움은 내면 상태라 형태 언어로 못 쓴다. 굳음(p1)·눈 꼭 감음(p9)·반쯤 뜸(p10)·크게 뜸(p11)이 전부 눈꺼풀 연기다. 🔴 **그리고 그 얼굴이 진한 빨강에 덮인 채로 읽혀야 한다** — 이게 이 권 최대의 기술 문제다.
4. **여우가 화면에서 가장 눈에 띄어야 한다.** p1 톤이 "숨고 싶은 쪽이 제일 눈에 띈다"고 적어 뒀다. 이건 한 쪽의 조명이 아니라 **열두 쪽의 구조**여야 한다.
5. **밀도를 쓸 수 있는 쪽은 12쪽 중 2쪽뿐**(§2.10). 무텍스트 쪽이 없어 §2.12 우선권은 미발동 → 슬롯은 **p4·p12**(같은 길·같은 각도의 대구)에 준다. **배급이 곧 대구**다.

### 후보 3

| | 후보 ① **C8 마른 선 위에 젖은 빨강 한 방울** (`oxenbury-captainjack` + `carrossine-beterraba` + `rutten-ombre`) | 후보 ② C6 유지·수정(크레용 + 회청 필드) | 후보 ③ C1 나이브(흰 종이 + 색연필) |
|---|---|---|---|
| 매체 | 사이징 살아 있는 냉압 수채지 → **① 흑연 선을 다 긋고 ② 세계에 회색 워시 한 겹 ③ 여우 몸 안쪽만 적셔 빨강 한 방울** | 석판 크레용·오일 파스텔, 마른 왁스 | 색연필·연필 직접 |
| 이 권에 맞는 이유 | 🔴 **물이 이 권의 규칙 세 줄을 그대로 한다** — 젖은 자리 안에서만 기어오르고(발→귀), 마른 종이 경계에서 딱 멈추고(숨을 데 없음), 마르며 물러난다(천천히 빠진다). 그리고 마르며 남는 **물테**가 「어디까지 왔나」의 눈금이 된다 · 🔴 **여우의 원래 색 = 맨 종이**라 열두 쪽 내내 여우가 화면에서 가장 밝다(요구 4가 매체에서 공짜) · 얼굴 선은 워시 **아래**에 있어 빨강이 덮어도 표정이 안 먹힌다 | 팔레트 규율은 좋다 | 종이 흰색을 광원으로 쓸 수 있다 |
| 리스크 | C8 최대 약점 = 번짐이 인물을 뭉갠다 → **선을 먼저 긋고 번짐을 몸 안에 갇히게** 하는 2단계 공정으로 원천 차단(§7.3.1-1 처방) · C8 은 8권 상한이라 한 칸을 쓴다 | 🔴 **지배면(안개)이 대본에서 사라졌다** + 마른 매체가 요구 2를 못 한다 | 🔴 **점눈이와 4축이 다 겹칠 수 있는 최고 위험 클러스터**(§7.2) + **c01 이 방금 C1 을 열었다**(라인 내 중복) |
| 판정 | ✅ **추천** | 탈락 — 대본이 그 판을 버렸다 | 탈락 — 라인 내 중복 + 전래동화 충돌 |

### 🔴 추천 = 후보 ① — C8 「마른 선 위에 젖은 빨강 한 방울」

근거 세 줄:

- **매체가 규칙이다.** 「기어오른다 / 멈춘다 / 물러난다」는 문구로 부탁할 것이 아니라 물이 실제로 하는 일이다. 내용-형식 필연성의 최고점(§2.3).
- **여우의 원래 색이 맨 종이라, 감정이 곧 종이가 물드는 일이 된다.** 그래서 ①원래 색이 무엇인지 아이가 p1 에서 즉시 알고(가장 밝은 것) ②되돌아올 수 있는 근거가 물성에 있고(종이는 원래 흰색) ③여우가 언제나 화면에서 가장 밝아 「숨을 수 없다」가 열두 쪽의 구조가 된다.
- **얼굴이 살아남는다.** 흑연 선을 먼저 긋고 그 위에 투명 워시를 얹으므로, p9 처럼 화면 90%가 빨강인 쪽에서도 눈꺼풀·수염·주름이 그대로 읽힌다. C8 로 감정 서사를 하는 유일한 길이다.

**C8 상한 소모**: §7.3.1-1 이 C8 을 8권 상한으로 잡고 §7.9 가 "물·잠·**번짐**이 소재인 권에만"으로 좁혔다. 🔴 **부끄러움은 번짐이다** — 얼굴이 붉어지는 것은 실제로 확산 현상이고, 이 권은 그것을 규칙으로 만든 책이다. 안 쓰면 어디에 쓰나. **2/8 소모.**

### 🔴 c37(빨강 악센트 1점)과 어떻게 다른가 — 이건 필수 대조다

| | c37 「누가 웅덩이를 비웠지?」 | **a01 (이 권)** |
|---|---|---|
| 빨강의 정체 | **사물 하나**(늙은 불가사리) | **주인공의 몸에서 번지는 상태** |
| 물성 | **불투명 채도**(세상에서 유일한 opaque) | **투명 워시** — 얇으면 분홍, 겹치면 붉다 |
| 엣지 | 딱딱한 사물 윤곽 | 🔴 **엣지가 없다.** 젖은 자리 안에서 스며 오르고, 마르며 **물테** 하나만 남는다 |
| 몇 쪽에 있나 | **한 쪽뿐**(p6 발견 비트) | **일곱 쪽**에 있고 쪽마다 양이 다르다 |
| 하는 일 | **발견의 점** — 찍는다 | **감정의 기록** — 오르고 물러난다 |
| hex | 오렌지-레드 불투명 #C43A2B | 진한 곳 #D24A3F · 중간 #E3796A · 가장 옅은 가장자리 #F2BDB2 · **물테 #B23A30** |

즉 c37 은 **점을 찍고**, a01 은 **면이 자란다.** 나란히 놓아도 같은 빨강으로 안 보인다.

### 🔴 라인 충돌 확인 (필수)

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 2D 회화 매체. 실물 입체 재료 없음. 🔴 NOT 절에 `no wool fibre / no stitching / no fuzzy felted edge` 를 박는다 — 젖은 워시의 번진 가장자리가 **보풀로 오해될 수 있는 유일한 접점**이다 |
| 전래동화 **점눈이** | ✕ (4축 전부) | ① **종이** — 밝은 크림 ✕ / **차가운 흰 수채지 #F2F1EC** ② **얼굴** — 점눈 ✕ / 아몬드 눈 + **별개 눈썹선 + 윗눈꺼풀선**(눈 꼭 감음·반쯤 뜸이 필수) ③ **악센트** — 「매 화면 빨강 1점」 규칙 ✕ / **다섯 쪽엔 빨강이 아예 0** 이고 있는 쪽은 면적이 다 다르다 ④ **매체** — 느슨한 색연필 낙서 ✕ / 흑연 선 + 젖은 워시 |
| **a91**(같은 주제군 A · 같은 C8) | ✕ — 🔴 **공정이 정반대다** | a91 = **① 세계를 흡수지에 번지게 → ② 마른 뒤 인물을 잉크선으로 얹는다**, 악센트 = 안 칠한 흰 종이, 빨강 0. a01 = **① 선을 먼저 → ② 세계는 마른 워시 한 겹(번짐 0) → ③ 인물의 몸만 젖는다.** 즉 **a91 은 세계가 젖고 인물이 마르고, a01 은 세계가 마르고 인물이 젖는다.** 종이도 반대다(빨아들이는 흡수지 ↔ **물을 표면에 머물게 하는 사이징 수채지** — 그래서 a01 에만 물테가 생긴다). 악센트 논리도 반대: a91 은 「안 칠한 것이 사건」, a01 은 「칠해지는 것이 사건」이고 안 칠한 것이 평상이다 |
| **c37**(워시 매체 셋째) | ✕ | 위 표. 추가로 c37 은 **젖은 판/마른 판이 쪽 단위로 갈리고**(조수), a01 은 **매 쪽 세계가 마르고 몸만 젖는다.** 팔레트도 해양 청록 ↔ 무채 회색 |
| 세계명작 수채 그림풍 | ✕ | 🔴 이게 이 앵커의 가장 흔한 실패 경로다 — "수채"라는 단어만 남고 범용 동화 수채가 되는 것. 막는 방법 = **세계에 색이 하나도 없다**(회색 워시 한 색 + 흑연). 세계명작 수채는 다색이다 |

### 🔴 대본 SCENE 교정 2건 (앵커 규칙이 우선한다)

1. **p2 톤** — 대본은 "여우 쪽이 그늘, 이웃 쪽이 볕이다 … 밝기로 갈리도록"이라 적었다. **이 앵커에서 여우는 언제나 화면에서 가장 밝다**(맨 종이). 그늘로 누를 수 없다. → 갈림을 밝기가 아니라 **가려짐**으로 옮겼다: 바위(회색 워시 2겹, 화면에서 두 번째로 어두운 면)가 화면을 반 자르고 **여우는 그 뒤에서 조각만 보인다.** 의도(쳐다보는 쪽 ↔ 숨는 쪽의 분리)는 그대로 살고, 오히려 「완성된 빨강의 조각만 보인다」는 더 강한 화면이 된다. 대본 문구 수정은 comic-writer 몫.
2. **p3 톤** — "바위 그늘이 화면을 덮고" = 어둠인데 여우가 가장 밝아야 한다. 모순이 아니다(그늘 속 흰 것도 밝다). 다만 어둠을 **회색 워시의 겹수**로만 만든다 — 앵커 규칙 C 참조.

### 밀도 배급 (§2.10·§2.12)

무텍스트 쪽 없음 → 슬롯 둘을 **p4 · p12** 에 준다. 🔴 **같은 길·같은 각도라 배급이 곧 대구**다. 그리고 **밀도 = 그려진 것이 더 많다는 뜻이 아니라, 길가 소품(이끼 무더기·고사리·돌 턱·먼 지붕)이 각각 알아볼 수 있다는 뜻**이다. 🔴 **바위벽의 결과 흙바닥은 두 쪽 다 워시 한 겹 그대로** — 벽을 그리면 두 쪽이 같이 죽는다.

---

## A-01 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-a01   (fox / alpine village / a blush that spreads)

Style: a hand-painted picture-book page for 4-6 year olds. Bright, dry, quiet and a little
  exposed. The whole book is a nearly colourless world with ONE colour that creeps and retreats
  across one animal's body. Legible before it is pretty.

MEDIUM - read the ORDER, the order is the whole style. Three passes, always in this order:
  PASS 1 (dry): the entire drawing is made first in soft graphite pencil on cold-pressed
    watercolour paper that is still sized, so water sits ON the surface instead of soaking in.
    The pencil is visible everywhere and is NEVER erased; it stays readable under everything
    laid on top of it. Lines are made by the pencil running out, never by a clean vector edge.
  PASS 2 (dry brush, no bleed): the world - rock, road, timber, wool, water, sky - is given ONE
    thin flat pass of grey wash, brushed on and left completely alone. It does not bleed, does
    not blossom, has no soft gradient. The brush edge stays visible where it dried and the paper
    white shows through the wash everywhere.
  PASS 3 (wet, and ONLY on the fox): the inside of the fox's body is wetted with clear water,
    and one drop of red is set into that wet shape. 🔴 THE RED CREEPS UPWARD INSIDE THE WET AREA
    AND STOPS DEAD AT THE DRY PAPER AT THE EDGE OF THE BODY. It is pale pink where it is thin
    and red where it has pooled. As it dries it leaves a BLOOM LINE - a slightly darker
    hard-dried tidemark - at the top of how far it reached.
  Nothing is tightened or cleaned up afterwards. No blending, no airbrush, no digital glow.

PALETTE - effectively no colour plus one:
  paper (and the fox's own natural coat) = cold white #F2F1EC, LEFT UNPAINTED.
  graphite #3A3B38 / grey wash #9AA3A0 (one pass) / #78848A (two passes) / #5C666B (three, the
  darkest thing in the book).
  EXACTLY ONE colour exists in this book: a blush red. #D24A3F where it has pooled /
  #E3796A mid / #F2BDB2 at the thinnest creeping edge / bloom line #B23A30.
  🔴 THE RED EXISTS ONLY ON THE FOX'S FUR, AND ITS AMOUNT AND HEIGHT ARE THE STORY. It appears
  only where the page instruction says so; on the other pages there is not one speck of red
  anywhere. Nothing else is ever red or pink - not a roof, not a flower, not a scarf, not a
  basket, not a cheek blush on any other character, not the sky.
  Moss, fern, timber, meadow, rain, milk and mountain are all grey wash and graphite ONLY.

🔴 VALUE LAW - this is the spine of the book, check it on every single page:
  A. THE FOX IS THE ONLY UNPAINTED THING IN THE PICTURE, so it is always the brightest shape on
     the page, on every page, including pages set in shade. The one who wants to hide is the one
     the eye goes to first. Never put a wash over the fox to push it back.
  B. EVERY OTHER CHARACTER IS PAINTED with the grey wash - the old sheep, the goat lady, the kid
     goat, the two other neighbours. They belong to the world, not to the fox's value.
     🔴 Do not render any of them as white or woolly-bright; they are grey wash animals.
  C. DARKNESS IS COUNTED IN WASH PASSES, never in a new colour: one pass = ordinary daylight
     surface, two passes = shade (the far side of a rock, the inside of an eave), three passes =
     the deepest places in the book (behind the rock, the drop below the stone kerb). MAXIMUM
     THREE. There is no black paint anywhere.
  D. Two things in the book share the fox's unpainted white, and BOTH are separated from it by
     LINE, not by value: the spilt milk (unpainted, and NO pencil line runs inside it) and the
     snow on the far peaks (unpainted, kept tiny and only in the top 1/8 of the frame, far away).
     The fox always carries pencil line inside its shape.

COMPOSITION: low-information field first, subject second.
  The fox is small in frame (about 1/6 of page height) except p2, p8, p9 and p11.
  Rock walls, road and roofs are read as flat grey bands; the eye is led by the road running
  into depth, never by a centred symmetrical subject - except p9, which is a deliberate frontal
  extreme close-up.
  🔴 Keep the bottom 18% of the image quiet and free of key subject matter (a caption band is
  laid over it later). Where ground fills the frame, keep the bottom strip plain one-pass wash.
  🔴 When two things are being compared for size or width, put them at the SAME depth in the
  frame - the narrow lane is only narrow if the fox and the neighbour who cannot step aside are
  the same distance from us.

FINISH HIERARCHY - about how FINISHED each area is, NOT about opacity.
  1. THE FOX = finished. Full pencil drawing plus, where the page says so, the wet red.
  2. WHAT THE FOX TOUCHES OR LOOKS AT on that page (the tipped milk pail, the umbrella, the one
     rock it presses its back against, the one puddle at its feet) = half-finished: contour plus
     one pass of wash.
  3. EVERYTHING ELSE = A LOOSE UNFINISHED PENCIL SKETCH under one flat pass of grey wash.
     A few open contour lines and direction strokes, shapes left unclosed, bare paper showing
     through, deliberately not filled in - like the rough underdrawing on a sketchbook page.
  🔴 The background is NOT faded, NOT hazy, NOT blurred and NOT desaturated. It is simply not
  drawn to completion. A rough dark pencil line is correct; a soft pale finished line is wrong.
  Never draw every roof shingle, every log in the woodpile, every fern frond, every stone in
  the wall, every rain drop.
  EXCEPTION - exactly two pages carry density, and they are the two pictures of the same lane
  entrance (p4 and p12). On those two, level 2 finish extends to the roadside props (moss
  cushions, ferns, the stone kerb, the two far roofs) so that they can be recognised one by one.
  🔴 Even there the rock wall and the ground stay one flat pass.

CHARACTER DESIGN: eyes are DRAWN, not dotted - a small dark almond with an UPPER LID LINE and a
  SEPARATE drawn eyebrow stroke above it, so the face can freeze, squeeze shut, open halfway and
  open wide. The face has to keep acting UNDERNEATH a strong red wash, so the pencil of the eye,
  brow, muzzle line and whiskers is pressed darker than anywhere else on the body.
  Bodies read as one soft mass plus a neck and a tail. Muzzles are two or three pencil strokes.
  The silhouette must be readable at thumbnail size.
  FACE SEPARATION (required): the face must read apart from the body in LINE DENSITY - more
  pencil work in the face, almost none on the flank. This does NOT add a colour.
  ANTHROPOMORPHISM GRADE (fixed for this book): every animal is BIPEDAL - it walks on its hind
  legs and its forepaws are hands (they carry a pail, an umbrella, a basket, they wave). Keep
  this consistent for the fox and for all four neighbours. No four-legged poses anywhere.

SETTING: an alpine mountain village - timber chalets with deep eaves and carved balconies, log
  piles, window-ledge planters, a stone-walled lane, split-rail fences, a wooden fountain trough,
  spruce, and above all ONE narrow mountain path: rock wall on one side, a low stone kerb and a
  falling gorge on the other, wide enough for one and a half bodies.
  🔴 MATERIAL TRANSLATION (so nothing turns photographic or plastic):
    moss = one pass of wash plus short pressed graphite dots, never individual leaves.
    rock = two passes of wash plus three or four graphite grain lines, never every crack.
    timber roof = a flat wash band plus a few parallel graphite lines, never shingle by shingle.
    animal wool and fur = one pass of wash plus short graphite strokes at the edge of the mass.
    snow = unpainted paper, tiny, top 1/8 of frame only.
    standing water = one pass of wash with the pencil of what is above it repeated upside down,
      slightly broken; never a mirror-sharp reflection, never a specular highlight.
  European, no Asian architectural motifs.

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT digital airbrush / NOT smooth gradients / NOT glossy 3D CG render / NOT cel-shaded
  anime / NOT a watercolour texture filter laid over flat digital colour / NOT photographic /
  NOT a fully rendered background / NOT every shingle, log, fern or stone drawn to completion /
  NOT a uniform finish across the page / NOT a hazy, blurry or faded background (that is blur,
  not un-drawn) / NOT wet-in-wet bleeding anywhere in the world - the bleed happens ONLY inside
  the fox / NOT a second accent colour / NOT pink or red on any other character, object, sky or
  cheek / NOT black paint / NOT a white or woolly-bright neighbour / NOT any lettering, numerals,
  shop signage or house numbers anywhere in the image / NOT wool felt, NOT stitched fabric,
  NOT thread, NOT fuzzy felted edges, NOT sculpted clay (another line owns those).
```

### 🔴 이 앵커의 두 불변 규칙 (매 컷 반복 확인)

**규칙 A — 번짐과 물테.** 빨강이 어떻게 생겼는지:

> 빨강은 **여우 몸 안쪽에서 아래에서 위로 기어오른다.** 몸 밖으로는 한 방울도 나가지 않는다(마른 종이가 벽이다). 위쪽 끝은 칼로 자른 선이 아니라 **연분홍으로 흐려지며 사라지고**, 마르고 나면 거기 **물테**(살짝 진한 테두리) 하나가 남는다. 그 물테가 「지금 어디까지 왔나」의 눈금이다. 물러날 때는 **들어온 순서의 역순**으로 — 귀끝·주둥이·꼬리끝이 먼저 맨 종이로 돌아온다.
> 컷에 붙일 영어 지시문:
> `BLEED RULE: the red is set into a wetted shape that is exactly the fox's body, so it creeps upward INSIDE the silhouette and stops dead at the dry paper of the outline - not one speck of red leaves the body. The upper limit of the red fades out into pale pink and, once dry, leaves a single slightly darker BLOOM LINE marking how high it reached. When the red retreats it leaves in the reverse order it arrived: ear tips, muzzle and tail tip return to bare paper first.`

**규칙 B — 빨강 스케줄.** 컷마다 `RED:` 줄을 반드시 읽는다. `none` 이면 화면에 빨강이 **한 점도 없고 여우는 맨 종이**다.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 다리 아래 1/3, 물테 무릎 위 | 🔴 **꼬리·뒷발 조각만**(나머지는 바위 뒤) | 온몸, 가장 옅게 + 몸 윤곽 안쪽 물테 | 없음 | 없음 | 없음 | 🔴 **없음**(아직 안 봤다) | **채도 정점** — 온몸 + 귀 안쪽 + 고인 물 | **면적 정점** — 화면 90% | 온몸, p8 보다 한 단 옅게 | 물러나는 중, 물테 목 아래 | 없음 |

🔴 **여덟 쪽이 빨강을 가지고 다섯 쪽은 안 가진다. 「매 화면 빨강 1점」 규칙이 아니다**(전래동화 점눈이와 구조가 반대 — §7.2 규칙 3).

---

## A-01 §3. 캐릭터 시트 (🔴 이것부터 굽는다 — 셋 다, 장면 전에)

```
CHARACTER SHEET - FoxBare   (bake this FIRST of all, before any scene)

🔴 THE SHEET IS DRAWN IN THE SAME MEDIUM AS THE BOOK. Soft graphite pencil on cold-pressed
  sized watercolour paper #F2F1EC. Pencil grain visible, contour left open in places, nothing
  tightened. Do NOT render this character smoothly just because there is no background behind it.
  🔴 THERE IS NO RED ANYWHERE ON THIS SHEET, AND NO WASH ON THE FOX. The fox's natural coat IS
  the unpainted paper - the only marks on its body are pencil.

FACE: a young fox's narrow muzzle, the tip level, with the pencil pressed darkest here so the
  expression survives being covered by a wash later. Eye = a small dark almond #3A3B38 with a
  drawn UPPER LID LINE across its top and a SEPARATE eyebrow stroke above it, set close to the
  muzzle. Nose = one small dark wedge. Mouth = one thin line that can part a crack.
  Three whiskers each side, single strokes. Ears large, thin, mobile, drawn with two lines each.
  🔴 No dot eye, no blush, no highlight dot, no glossy catchlight, no cheek circles.
FUR: the body is UNPAINTED PAPER. Form is made only by pencil: a broken contour, four or five
  direction strokes at the chest and haunch, a slightly denser cluster of strokes where the tail
  meets the body. Throat, belly and inner ears are left completely blank paper.
BUILD & SILHOUETTE: a young adult fox, BIPEDAL, upright on two legs, about four heads tall.
  Narrow shoulders that rise easily toward the ears when it is embarrassed, a round low belly,
  a long full tail that trails and curls up at the very end. Forepaws are hands and can grip.
SIGNATURE DETAIL: 🔴 ONE hand-knitted mountain scarf, ribbed, wound twice, with UNEVEN ENDS -
  one end hangs to the knee, the other stops at the chest. It is drawn in pencil hatching only
  (it is NOT a colour and it is never red). It is how the reader tells this fox from any other
  animal in silhouette, and it is in every single drawing including the back views.
  🔴 THE SCARF IS NEVER WASHED, EVEN THOUGH EVERY OTHER CHARACTER'S CLOTHING IS.
REFERENCE SHEET: full-body front idle standing / three-quarter turn walking with the tail
  trailing / back view showing the tail curl and the two uneven scarf ends /
  a detail of one forepaw gripping a wooden handle /
  four expression close-ups, all with the eyes and brow drawn dark enough to read through a
  wash: FROZEN (shoulders up, eyes down at its own feet, mouth open a crack) /
  SQUEEZED SHUT (lids pressed, a crease at each eye corner, whiskers trembling) /
  HALF OPEN (one lid up, one still low, looking sideways) /
  WIDE OPEN AND EASY (both lids high, brow relaxed, shoulders dropped).
  Plain unpainted paper background, no scenery, no wash, no red.
SCENE token: FoxBare.
```

```
CHARACTER SHEET - FoxBlush   (state variant - SAME animal, the red is on it)

🔴 IDENTICAL FACE, IDENTICAL SCARF, IDENTICAL BUILD, IDENTICAL PENCIL WORK as FoxBare.
  The pencil drawing is unchanged and still fully visible. The ONLY change is that a transparent
  red wash has crept up inside the body silhouette.

THE RED: laid as PASS 3 of the book's medium - the body shape is wetted with clear water and
  one drop of red #D24A3F is set into it. It pools deepest low down and creeps upward, going
  pale pink #F2BDB2 at its upper limit, where a single darker BLOOM LINE #B23A30 marks how far
  it reached. 🔴 Not one speck of red crosses the outline of the body. The scarf stays unwashed
  and unpainted. The eyes, brow, nose, mouth and whiskers are still the darkest marks on the
  drawing and read clearly THROUGH the red - this is the whole reason the sheet exists.

REFERENCE SHEET - draw the same standing pose FIVE times, left to right, as one row, so the
  height of the red can be compared:
  1. LOW: red to just above the knees, bloom line across the shins, everything above bare paper.
  2. MID: red to the chest, bloom line at the collarbone, face and ears still bare paper.
  3. FULL PALE: the whole body including ears is red but thin and pink, bloom line running just
     inside the outline all the way round (this is the "it is draining away" state).
  4. FULL DEEP: the whole body deep red including the INSIDE OF THE EARS and the muzzle,
     no bloom line anywhere because nothing is left dry (this is the peak).
  5. RETREATING: body still mid-red but the EAR TIPS, MUZZLE AND TAIL TIP have returned to bare
     paper, with the bloom line now low, under the throat.
  Plus two expression close-ups AT FULL DEEP RED: squeezed shut, and half open.
  Plain unpainted paper background, no scenery.
🔴 SCENE tokens: use FoxBare and FoxBlush. NEVER write "Fox" alone.
```

```
CHARACTER SHEET - LaneNeighbours   (the four neighbours, one sheet, bake THIRD)

🔴 ALL FOUR ARE PAINTED WITH THE GREY WASH. They belong to the world's value, not to the fox's.
  One flat pass of #9AA3A0 over a full pencil drawing, two passes where they are in shade.
  🔴 None of them is white, woolly-bright, cream or fluffy - if any of them reads as bright as
  the fox, the whole book breaks. There is NO red and NO pink anywhere on this sheet, including
  cheeks, scarves, ribbons, baskets and flowers.
  All four are BIPEDAL, upright, forepaws are hands.

OLD SHEEP (token: OldSheep): the tallest and slowest. Heavy square body, short legs, a coat
  drawn as a few looping graphite lines at the silhouette edge only (never curl by curl).
  Long face, drooping lower lip, horizontal slot pupils, heavy brow that makes him look kind
  rather than stern. Wears a plain waistcoat, wash grey, buttoned once. Walks with a stick.
GOAT LADY (token: GoatLady): mid height, brisk. Narrow head, two short swept-back horns, a small
  beard of three strokes, rectangular pupils. Wears an apron and a headscarf tied at the nape,
  both wash grey with pencil check lines. 🔴 Always carries a woven basket with a scuff mark on
  one side - that basket brushes the rock wall in p10, so keep it identical in every drawing.
KID GOAT (token: KidGoat): the smallest, about half the fox's height. Round head, ears out
  sideways, knobbly knees, tail permanently up. Wears a single knitted vest, wash grey.
  Bounces - never draw both feet flat on the ground.
SECOND NEIGHBOUR PAIR (token: LanePair): two adult village animals seen only in the last page -
  a marmot in a flat cap and a tall ibex with long back-swept horns. Both wash grey, both drawn
  more loosely than the other three (they are level 3 finish, background people).

REFERENCE SHEET: each of the five, full body front idle, in one row at TRUE RELATIVE HEIGHT with
  a plain horizon line through them so the size relationships are fixed (KidGoat about half the
  fox, GoatLady a head shorter than the fox, OldSheep a head taller, LanePair between).
  Then one small row of three heads only: OldSheep, GoatLady and KidGoat all LOOKING AT THE
  SAME POINT with plain friendly attention - eyes level, no laughing, no teasing, no mouths
  wide open. 🔴 This row matters more than anything else on the sheet: the reversal of this book
  is that nobody makes anything of the red, so their faces must be ordinary.
  Plain unpainted paper background, no scenery.
```

---

## A-01 §4. 12컷

각 컷은 `STYLE ANCHOR + BLEED RULE + @image1(FoxBare) + @image2(FoxBlush) + @image3(LaneNeighbours) + 아래 블록` 으로 합성한다.
🔴 `RED:` 줄이 `none` 인 컷에서는 **`@image2`(FoxBlush)를 붙이지 않는다** — 붙이면 새어 나온다.

### p1 — 우유를 쏟았다, 빨강이 발끝에서 올라온다
```
CAMERA: medium, eye level at the fox's chest height. Split composition - the tipped pail and the
  running milk occupy the left half, the fox stands rigid in the right half. 🔴 The fox's WHOLE
  BODY is inside the frame, head to feet, because the page has to show how far the red has come.
SUBJECT: FoxBlush stands still on the earth road, both forepaws pressed together in front of its
  chest, shoulders up near its ears, eyes down following the milk, mouth open a crack. It has not
  moved. Frozen expression.
SETTING: the earth road in front of a timber chalet, clear morning. A wooden milk pail lying on
  its side, the milk running away in two forking streams and darkening the earth; a plank door,
  two window-ledge planters, a log pile against the wall, ridge lines of mountains stacked behind.
FINISH: FoxBlush finished. The pail and the wet earth right under the milk half-finished. The
  chalet, door, planters, log pile and mountains are ROUGH UNFINISHED PENCIL SKETCH under one
  flat pass of grey wash - open contours, no shingles, no individual logs, paper showing through.
TONE: broad flat morning light, no cast shadows to speak of. One wash pass everywhere; nothing
  on this page is in shade. The unpainted fox is the brightest shape in the picture.
🔴 MILK: the milk is UNPAINTED PAPER with NO pencil line running inside it - that is the only
  thing separating it from the fox's white. Its edges are drawn, its inside is empty.
RED: 🔴 THE FIRST APPEARANCE AND IT IS CAUGHT HALFWAY. Red has crept up the feet and legs and
  stopped roughly one third of the way up the body; a single BLOOM LINE sits just above the
  knees. Everything above it - belly, back, chest, face, ears, tail - is BARE PAPER, the fox's
  natural coat. About 4% of the picture is red. This is the only page where the reader sees the
  original colour and the change in one drawing, so the boundary must be unmistakable and it
  must be a soft creeping edge with one hard tidemark, never a clean painted line.
```

### p2 — 이웃이 쳐다보자 여우가 바위 뒤로 사라진다
```
CAMERA: wide, eye level. 🔴 A large mossy rock cuts the frame almost exactly in half. Left half:
  the rock, with only pieces of the fox still outside it. Right half: two neighbours stopped on
  the road.
SUBJECT: FoxBlush is going behind the rock and is already mostly gone - only the tail and the
  hind feet, plus the long end of the scarf, are still outside the rock's edge. Left half.
  Right half: OldSheep and GoatLady have stopped and both lean their heads toward the rock, eyes
  concerned, GoatLady with one forepaw raised; each carries a basket. They are looking at where
  the fox was, not at anything else.
SETTING: the same earth road. The tipped pail and the forked milk are still exactly where they
  were in p1. A large rock with moss cushions on top and small flowers in its cracks, a rope
  line strung between two posts with washing on it, the same chalet wall further off.
FINISH: the visible pieces of FoxBlush finished. The rock's near face and its moss half-finished.
  Neighbours, baskets, washing line and chalet are rough unfinished sketch under one wash pass -
  🔴 the two neighbours are level 3 finish here on purpose; they are a situation, not a portrait.
TONE: 🔴 CORRECTED FROM THE SCRIPT - do NOT split this page by brightness. The fox is the
  brightest thing in the book and cannot be pushed into shade. The division is made by the ROCK
  HIDING IT: the rock's far face carries two wash passes and swallows the fox's body, while the
  neighbours stand in ordinary one-pass daylight. The split is concealment, not light.
RED: the red is now COMPLETE to the ear tips - but almost all of it is behind the rock. What is
  on the page is only the tail and the hind feet, and they are DEEP red #D24A3F, the deepest red
  so far. No bloom line is visible (nothing dry is left on the parts we can see). About 3% of the
  picture. 🔴 A finished blush shown as a fragment: the reader must feel there is more of it out
  of sight.
```

### p3 — 바위 뒤에서 빠질 때까지 기다린다
```
CAMERA: medium close-up, eye level, pressed in behind the rock. The rock fills most of the frame;
  the fox sits in the narrow gap behind it, small, with generous empty space around it.
SUBJECT: FoxBlush folded up small with its back against the rock, both forepaws wrapped around
  its own feet, ears laid flat back, looking at its own paws rather than out. Shoulders still up.
  🔴 The fox is small in frame here - about 1/5 of the page height - and the emptiness around it
  is part of the composition, not a gap to fill.
SETTING: the rock's mossy split face and two or three grain lines, dry grass and two fir cones
  on the ground, a narrow strip of sky visible between the rock and a stone wall, and - very
  small, very far - only the legs of neighbours passing on the road beyond.
FINISH: FoxBlush finished. The rock face it leans on and the ground right under it half-finished.
  Everything else rough unfinished sketch under wash - no individual grass blades, no moss leaf
  by leaf, no stones in the wall.
TONE: 🔴 darkness here is made ONLY by wash passes. The rock's inner face and the ground behind
  the fox carry THREE passes #5C666B - the darkest place in the book. The strip of sky above is
  one pass. There is no black anywhere. The fox is still the brightest shape on the page even
  though it is sitting in the dark, and that is the point of the page.
RED: the whole body is red but this is THE PALEST FULL-BODY RED IN THE BOOK - thin, pink,
  #E3796A going to #F2BDB2. 🔴 A bloom line runs just INSIDE the outline all the way round the
  body: the red has begun to pull back from the edges. It is draining, slowly. About 6% of the
  picture (the body is small here).
```

### p4 — 길은 하나뿐이고, 지금 텅 비어 있다  🔴 밀도 배급 1/2
```
CAMERA: wide, eye level, standing at the mouth of the narrow mountain path looking straight
  along it into depth. 🔴 FIX THIS CAMERA EXACTLY - height, distance and lens are reused
  unchanged in p12, and the picture must not be mirrored.
SUBJECT: FoxBare stands at the entrance, peering in. Neck pushed forward, ears up, ONE forepaw
  and one hind foot still lifted, not yet committed. Bare paper - its natural coat.
SETTING: 🔴 THERE IS ONLY ONE PATH IN THIS BOOK. Rock wall on the left; on the right a low stone
  kerb and, past it, the gorge dropping away. The path is one and a half bodies wide and it is
  COMPLETELY EMPTY all the way in. Two tiny village roofs at the far end. Moss cushions and
  ferns along the edges. 🔴 That there is not one hand's width to step aside must be readable in
  the picture, from the width of the path against the width of the fox.
FINISH: 🔴 DENSITY PAGE 1 OF 2, AND IT IS PAIRED WITH p12. FoxBare finished. Take the ROADSIDE
  PROPS to half-finished - the moss cushions, the ferns, the individual kerb stones, the two far
  roofs - so that each one can be recognised and found again in p12. 🔴 The rock wall and the
  ground stay ONE FLAT PASS with a few grain lines: if the wall gets drawn, both pages die.
TONE: even light all the way into the depth of the path, so that "there is nobody here" is
  legible at a glance. One wash pass on the wall, two in the gorge below the kerb. The whole job
  of this page is EMPTINESS - it is the page p7, p10 and p12 are measured against.
RED: none. The fox is bare paper. Do not attach the FoxBlush sheet to this cut.
```

### p5 — 소나기, 그리고 다들 집으로 가는 시간
```
CAMERA: medium, eye level, from under a shop eave looking out and in along the road.
SUBJECT: FoxBare stands under the eave, an umbrella half-raised and STOPPED - one forepaw
  gripping the handle, frozen mid-motion. Neck stretched long, looking down the road; ears
  forward. Bare paper.
SETTING: water falling in ropes off the eave, rain bouncing off the road, puddles forming.
  🔴 Deeper in the frame, several neighbours with raised umbrellas seen from behind, ALL WALKING
  THE SAME WAY - toward the mountain path. A plain painted board hangs by the shop door and
  CARRIES NO LETTERING - draw it as an empty board or a simple bread shape on an iron bracket.
  Wooden crates stacked under the eave.
FINISH: FoxBare finished. The umbrella and the puddle at its feet half-finished. The eave, the
  crates, the board, the far neighbours and the rain are rough unfinished sketch under wash -
  🔴 do not draw every rain drop; rain is a set of long graphite diagonals over the wash.
TONE: 🔴 rain is NEVER blue - it is graphite diagonals and two-pass wash in the puddles. Under
  the eave is two passes, the open road beyond is one pass, so the outside reads brighter than
  the shelter. The direction the crowd is walking and the direction the fox has to go are the
  same, and the picture has to say so.
RED: none. The fox is bare paper. Do not attach the FoxBlush sheet to this cut.
```

### p6 — 안 가겠다고 했던 그 길로 들어간다
```
CAMERA: medium, tracking from behind the fox's shoulders. The narrow path runs away into depth
  and bends out of sight ahead.
SUBJECT: FoxBare seen from behind, walking in, the folded umbrella held against its chest with
  both forepaws. 🔴 Its shoulders nearly touch the walls on both sides. Head down, tail pulled
  tight against the body, the long scarf end hanging straight down. Bare paper.
SETTING: left, the wet rock wall with moss and small ferns in its seams; right, a single low
  stone kerb and past it the gorge falling away. Standing water on the path. The path bends
  gently ahead so that what is around the bend cannot be seen.
FINISH: FoxBare finished. The standing water under its feet and the one wall seam beside its
  shoulder half-finished. Everything else rough sketch under one wash pass - no fern frond by
  frond, no stone by stone.
TONE: the two walls squeeze the frame; the tension on this page is carried by the WIDTH between
  them, not by darkness. Walls two passes, the strip of light where the path bends one pass, so
  the eye is pulled to the bend and stopped there. The gorge side is three passes.
RED: none. The fox is bare paper. Do not attach the FoxBlush sheet to this cut.
```

### p7 — 굽은 길을 돌자 이웃 셋이 걸어온다
```
CAMERA: wide, eye level, at the bend. 🔴 The fox in the near foreground and the three neighbours
  deeper in are placed so the SAME PATH WIDTH runs through both - the point of the page is that
  neither can step aside, and that is a comparison of widths, so keep them in one continuous
  perspective with the walls unbroken between them.
SUBJECT: FoxBare stopped dead, both hind feet planted, umbrella still clutched, ears forward,
  eyes wide. Bare paper. Deeper in: KidGoat leading, OldSheep and GoatLady behind, all three
  walking, 🔴 NONE OF THEM HAS SEEN THE FOX YET - their eyes are on the path, on each other,
  anywhere but on it.
SETTING: rock walls dividing the frame vertically on both sides, path width one and a half
  bodies, standing water on the path showing the three sets of legs upside down and broken,
  a dry vine hanging on the wall.
FINISH: FoxBare finished. The water at its feet half-finished. The three neighbours are level 3
  ROUGH UNFINISHED SKETCH under one wash pass - 🔴 deliberately less finished than the fox even
  though they are the event of the page. The walls stay one flat pass.
TONE: near fox and far three both in the same one-pass daylight; both perfectly legible, neither
  favoured. The narrow corridor made by the walls does the whole job - there is nowhere to go.
RED: 🔴 NONE, AND THE ABSENCE IS THE TENSION OF THIS PAGE. Nobody has looked yet, so the fox is
  still bare paper. Do not attach the FoxBlush sheet to this cut. The reader who has learned the
  rule is waiting for the colour, and this page withholds it.
```

### p8 — 셋이 다 본다, 쳐다볼수록 더 빨개진다
```
CAMERA: medium close-up, low angle from just above the ground. The fox is centre frame; along
  the TOP edge, three faces come down into the picture looking at it.
SUBJECT: FoxBlush hugs the folded umbrella hard against its chest, shoulders jammed up, eyes down
  on its own feet. At the top of the frame the faces of KidGoat, OldSheep and GoatLady enter,
  angled down, 🔴 all three with plain ordinary attention on their faces - no laughing, no
  pointing, no wide open mouths.
SETTING: rock walls on both sides, standing water at the fox's feet, the umbrella's wet fabric
  and wooden handle.
FINISH: FoxBlush finished. The umbrella and the puddle half-finished. Walls and the three faces
  rough sketch under wash.
TONE: the three lines of sight converge on one point and that point is the deepest thing on the
  page. The pressure is built ONLY by the direction of the looking - do not add a spotlight, a
  vignette or a darker sky. Walls two passes.
RED: 🔴 SATURATION PEAK OF THE BOOK. The whole body is deep #D24A3F from feet to ear tips,
  INCLUDING the inside of the ears and the muzzle. There is NO bloom line anywhere because
  nothing dry is left. In addition, the red has crept into the standing water at its feet as a
  broken upside-down stain - 🔴 that is the ONLY place in the entire book where red appears
  outside the fox's body, and it is a reflection, laid over wash so it goes darker #B23A30.
  🔴 The dark pencil of the eyes, brow, muzzle and whiskers must still read clearly THROUGH the
  red. If the face has been swallowed, the sheet has failed - go back and rebake FoxBlush.
```

### p9 — 눈을 꼭 감는다
```
CAMERA: extreme close-up, eye level, the fox's face filling the whole frame edge to edge.
  🔴 The only frontal symmetrical composition in the book. There is nowhere for the reader's eye
  to go.
SUBJECT: FoxBlush with both eyes squeezed shut - lids pressed, a crease at each eye corner, the
  muzzle tip and ear tips in frame and deep red, whiskers trembling very slightly. At the bottom
  edge, one forepaw gripping the umbrella handle hard.
SETTING: at the extreme edges of the frame, a hint of rock wall; behind, the shapes of the three
  neighbours as unclosed pencil contours only, out of focus.
FINISH: the face finished, and nothing else on the page is. 🔴 The out-of-focus neighbours are
  drawn with FEWER AND LOOSER PENCIL LINES, not with a blur filter - open contours, no wash
  inside them.
TONE: total stop, as if all sound outside the frame has been switched off. Nothing is told to
  the reader until the page turns.
RED: 🔴 AREA PEAK OF THE BOOK - about 90% of the picture is red, because the picture is the fox.
  The saturation is the same as p8, not higher; what has changed is that there is no longer any
  way to see anything else. NO bloom line (the edge of the red is off-frame on all four sides).
  🔴 This cut is the whole reason this medium was chosen: under this much red, the eye creases,
  the lid lines and the whiskers are still the darkest marks in the picture and they carry the
  page. Nothing else in the world is red - not the wall, not the umbrella handle.
```

### p10 — 이웃들이 인사만 하고 지나간다
```
CAMERA: wide, eye level. The three neighbours move ACROSS the frame right to left; the fox stands
  still, pressed against the left wall.
SUBJECT: FoxBlush with its back flat against the rock wall, eyes HALF OPEN (one lid up, one still
  low), body still red. Moving right to left past it: KidGoat in front, looking at the fox and
  raising one forepaw in greeting; OldSheep nodding as he passes; GoatLady turning her body in
  toward the wall so as not to bump it, her basket brushing the rock and leaving a scuff of earth.
  🔴 ALL THREE ARE LOOKING AT THE FOX'S FACE. Not one of them looks at its body, its coat or its
  colour, and not one of them is laughing.
SETTING: rock walls both sides, four sets of feet overlapping in the narrow path and stepping in
  the standing water, the earth scuff where the basket touched.
FINISH: FoxBlush finished. The wall it presses against and the water underfoot half-finished.
  The three neighbours rough sketch under one wash pass.
TONE: the three flow left, the fox alone is stationary; all sightlines gather on the fox's face.
  One-pass daylight, walls two passes. 🔴 Nothing in the staging comments on the colour.
RED: the whole body is still red but ONE STEP PALER than p8 - #E3796A rather than #D24A3F, no
  reflection in the water this time. 🔴 The red is on the fox and the three neighbours are grey
  wash, so it is the only colour in a crowded frame, and nobody in the frame is reacting to it.
  That contradiction IS the page.
```

### p11 — 아무도 웃지 않았고, 빨강이 물러난다
```
CAMERA: medium, eye level. The fox alone in the centre of the frame; deep in the frame, three
  backs getting smaller.
SUBJECT: FoxBlush has come off the wall and stands in the middle of the path. Shoulders dropped,
  BOTH EYES WIDE OPEN and easy, brow relaxed, the umbrella now held loosely in one forepaw at
  its side.
SETTING: rock walls both sides, four lines of wet footprints left on the path, ferns in the wall
  seams, and far down the path the three neighbours' backs getting small.
FINISH: FoxBlush finished. The footprints and the wall seam beside it half-finished - the
  footprints are pencil only, no wash. Everything beyond rough sketch under one pass.
TONE: light now enters from above between the walls, so the corridor reads more open than it did
  in p6 even though it is the same width. The fox is the brightest thing on the page and the
  depth behind it is softly less finished. Walls back to one pass.
RED: 🔴 RETREATING, AND THE DIRECTION IS THE REVERSE OF HOW IT ARRIVED. The EAR TIPS, THE MUZZLE
  AND THE TAIL TIP HAVE ALREADY RETURNED TO BARE PAPER. The belly and legs are still mid red
  #E3796A, and a single BLOOM LINE now sits low, under the throat, marking the top of what is
  left. About 20% of the picture. It is going, slowly, and the page has to show that it takes
  time - this is the third rule of the book made visible.
```

### p12 — 사람이 잔뜩인데도 그 길로 들어간다  🔴 밀도 배급 2/2
```
CAMERA: 🔴 IDENTICAL TO p4 - same height, same distance, same lens, same mouth of the same path,
  looking along it into depth. Attach the approved p4 render as a reference image. DO NOT MIRROR
  THE IMAGE: the rock wall stays on the left and the stone kerb and gorge stay on the right, or
  the whole comparison collapses.
SUBJECT: FoxBare stands where it stood in p4, but this time NOTHING IS LIFTED - both feet are
  down and it is walking in. Neck up, looking straight ahead, tail carried HIGH, the umbrella
  gone. Bare paper - its natural coat, exactly as in p4.
SETTING: 🔴 THE SAME PATH AND THE SAME PROPS AS p4 - the same moss cushions, the same ferns, the
  same kerb stones, the same two far roofs, the same width. The ONLY change: the path now has
  neighbours moving along it - OldSheep and GoatLady, and LanePair (the marmot and the ibex),
  and at the far end KidGoat waving a forepaw.
FINISH: 🔴 DENSITY PAGE 2 OF 2, PAIRED WITH p4. Same finish plan as p4: FoxBare finished,
  roadside props half-finished and recognisably the same objects, rock wall and ground ONE FLAT
  PASS. 🔴 Density here means MORE THINGS ARE ON THE PATH, never that things are drawn in more
  detail. All the neighbours are level 3 rough sketch under wash.
TONE: the same even light as p4, one pass on the wall, two in the gorge. 🔴 What has changed
  between the two pictures must be exactly two things and no more: THERE ARE PEOPLE ON THE PATH,
  AND THE FOX IS GOING IN ANYWAY. Set the two pages side by side and the reversal should be
  visible without reading a word.
RED: none. The fox is bare paper, the same as p4 and the same as it was before any of this
  happened. Do not attach the FoxBlush sheet to this cut. 🔴 Five neighbours in grey wash and one
  unpainted fox: there is not one speck of colour on the last page of the book.
```

---

## A-01 §5. 첫 렌더 검수 6항목 (하나라도 걸리면 문구가 아니라 ref 를 고친다 — §2.3)

1. **빨강이 여우 밖으로 샜나.** 지붕·꽃·바구니·하늘·다른 인물의 볼 어디에도 분홍이 없어야 한다. 유일한 예외는 **p8 고인 물의 반사** 하나. 샜으면 팔레트 규율 실패 = 이 앵커의 핵심이 무너진 것.
2. **여우가 화면에서 가장 밝나 — 열두 쪽 전부.** 특히 **p3**(바위 뒤 어둠)과 **p10**(이웃 셋과 한 화면). 이웃이 희거나 뽀얗게 나왔으면 **LaneNeighbours 시트를 다시 굽는다.** 값 규칙 A·B 가 이 책의 척추다.
3. 🔴 **p9 에서 얼굴이 빨강에 먹혔나.** 눈꺼풀선·눈 주름·수염이 진한 빨강 아래에서 읽혀야 한다. 먹혔으면 장면 프롬프트가 아니라 **FoxBlush 시트**를 의심하라(§2.4) — 시트의 눈·눈썹 흑연이 덜 진했다는 뜻이다.
4. **번짐이 세계로 갔나.** 세계는 **워시 한 겹, 번짐 0**이어야 한다. 하늘이나 바위가 wet-in-wet 으로 뭉개져 있으면 매체 문구의 PASS 2 를 강화하고, 그래도 안 되면 **p4 나 p6 의 승인본(세계가 평평한 컷)을 ref 세트에 넣는다.**
5. **물테가 있나.** p1(무릎 위) · p3(윤곽 안쪽 한 바퀴) · p11(목 아래). 물테가 없으면 빨강이 「얼마나 왔나」를 못 말하고, 그러면 이 권은 그냥 빨간 여우 그림이 된다.
6. **p4 와 p12 가 같은 길로 보이나.** 나란히 놓고 본다 — 소품이 같은 것으로 알아보이고, 좌우가 안 뒤집혔고, 달라진 것이 **길 위의 사람과 여우가 들어간다는 것** 둘뿐인가.

**부수 확인 2건**
- **니들펠트 분리**: 번진 가장자리가 **보풀**로 보이면 그 순간 호리 라인이다. 번짐은 종이 위에서 마른 **물감의 테**이고 섬유가 아니다.
- **글자 0**: 5개 언어로 나가므로 간판·문패·번지·가격표에 글자가 한 자도 없어야 한다. p5 의 가게 판은 **빈 판이나 빵 모양**이다.
