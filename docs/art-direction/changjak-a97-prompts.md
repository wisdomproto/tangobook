# 창작동화 1000 — A-97 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`(§2.3 · §2.4 · §2.7 · §2.9 · §2.10 · §2.11 · §7.1 · §7.2 · §7.3), 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/a97.md`.** 아래 10컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다.
> 🔴 **이미지 생성은 여기서 하지 않는다.** 사용자가 GPT 로 굽는다. 🔴 **작가 실명은 한 글자도 안 들어간다** — 근거는 §1 판정에만 남기고 프롬프트는 전부 문구다.
> 🔴 **실행 순서**: ① 토끼 시트(BunnyWet)를 **먼저** 굽는다(장면 금지) → ② 승인 시트를 `@image1` 로 붙여 **p3(보라 필드 판 · 흰 거품)** 한 장을 굽는다 = 이 권의 **필드 ref** → ③ p3 승인본을 붙여 **p9(노랑 판이 들어온 뒤)** 를 굽는다 = **색 서사의 반대쪽 끝** → ④ 그 3장을 ref 로 나머지 8컷. 🔴 **보라 필드 판(p3)이 확정되기 전에 다른 컷을 굽지 마라** — 열 쪽이 전부 같은 밭이라 판이 흔들리면 열 장을 다시 굽는다.

---

## A-97 §1. 앵커 배정

**권**: `a97` 「벌이 나만 피해」 (10쪽 · 4~6세 · 주제군 **A 마음·감정** · 엔진 **오해와 반전** · 무대 프로방스 라벤더밭 · 주인공 새끼 토끼)

**한 줄**: 손으로 찍은 **반복 스텐실 라벤더 판**(=밀도는 높은데 정보는 0인 필드) + 그 위에 손으로 그린 인물 + **화면에서 순백 불투명은 비누 거품뿐, 따뜻한 채도는 꽃가루뿐**. 앵커 슬러그 `changjak-lavender` — **신규 민팅**.

**이 권이 그림에 요구하는 것(판정의 전제)** 넷이다.

1. 🔴 **작은 색점 두 개가 열 쪽을 관통한다.** 흰 거품(p1·p2·p5·p6·p7·p8왼쪽) → 사라짐 → 노란 꽃가루(p7 첫 등장 → p8 → p9·p10). **이 교대가 이 권의 색 서사 전부**다. 그러려면 나머지 화면이 그 두 색을 절대 흉내 내지 않아야 한다 — 보라 필드 안에 흰 하이라이트도, 노란 햇살도, **노란 줄무늬 벌도** 있으면 안 된다.
2. 🔴 **벌의 위치가 곧 그림의 구조다.** p3 = 토끼 둘레만 한 뼘 비었다 / p4 = 소리가 화면 오른쪽에만 있다 / p10 = 그 빈 원을 벌이 채운다. 이건 **심음(p3) → 회수(p10)** 엔진이고, 회수되는 요소가 「원의 크기」가 아니라 **「원이 비었나 찼나」**다.
3. 🔴 **밭이 화면의 80%인데 사건은 손톱만 하다.** 밭을 예쁘게 그리면 거품도 꽃가루도 죽고, 밭을 비우면 프로방스가 아니게 된다. **밀도는 높은데 정보는 없는 필드**가 필요하다.
4. **토끼가 열 쪽을 연기한다** — 신남 → 살금 → 두리번 → 서운함 → 참기 → 간절함 → 놀람 → 갸웃 → 환희 → 조심. 얼굴이 필요하다.

**후보 3.**

① **C5 장식 민속·보태니컬 · 손으로 찍은 반복 스텐실 판(신규 앵커)** — 요구 3을 매체가 직접 해결한다. **같은 라벤더 도장이 반복되면 눈은 그것을 텍스처 하나로 읽고, 그 안의 이질물(흰 덩이 · 노란 알갱이 · 벌이 없는 자리)만 튄다.** 게다가 프로방스 라벤더밭은 **실제로 사람이 줄 맞춰 심은 단일 재배지**라, 반복 도장이 양식이 아니라 무대의 사실이다(§2.3 내용-형식 필연성). 리스크 = 모델이 반복을 **벡터 복붙 벽지**로 만든다 → MEDIUM 절에서 「손으로 찍혀 위치·각도·잉크량이 제각각」을 못 박고, 첫 렌더 검수 1번에 올린다.

② **C4 평면 형태** — 벌을 세는 데는 최강이고(§2.11) 평면 보라 위 순백/순노랑 대비도 최강이다. **탈락**: 이 권은 주제군 A 이고 §7.3 이 A 에 C4 를 금지해 뒀다(표정 없음). p4 「코끝이 시큰」·p8 「눈썹이 모이고 고개가 갸웃」은 얼굴 없이는 못 쓴다. §7.3.1-3 의 예외 통로(간격으로 감정 쓰기)는 이미 **G-10 이 C2 로 썼다** — 같은 우회를 두 권 연속으로 쓰면 그게 이 라인의 버릇이 된다.

③ **C7 회화적 톤(과슈 라벤더 풍경)** — 가장 쉽고 가장 예쁘다. **탈락**: §7.5 교차관찰 1 이 짚은 대로 C7 은 **가장 평범해지기 쉽고**, 특히 라벤더밭은 관광 엽서의 정본이라 첫 렌더부터 스톡 이미지로 착지한다. 결정적으로 붓 톤은 **보라 안에 밝은 하이라이트와 따뜻한 반사광을 뿌린다** — 그 순간 흰 거품과 노란 꽃가루가 「그중 하나」가 되어 요구 1 이 무너진다.

**🔴 추천 = 후보 ①.** 주제군 A 의 기준선 1순위는 C6 이지만 **엔진과 무대가 기준선을 이긴다**(§2.11). 이 권의 과업은 「반복 필드 위에서 작은 두 색과 빈자리를 읽히게 하기」이고, 그건 단색조 여백(C6)이 아니라 **반복 밀도**로 푸는 문제다.

🔴 **이 배정에서 새로 확립한 것 — 「반복이 곧 여백이다」.** §2.7 은 정보를 줄이는 방법으로 「덜 그리기」를 확립했고 c37·a91 은 **안 칠한 워시 필드**로 그걸 했다. 이 권은 **같은 것을 반복하기**로 같은 일을 한다 — 화면은 꽉 찼는데 정보량은 0 이다. 배경을 비울 수 없는 무대(밭·군중·장터·숲·서가)를 만나면 이 해법을 먼저 꺼낼 것. §2 에 원칙으로 올린다.

**왜 새 앵커인가.** 이 라인의 기존 다섯 앵커 중 C5 는 없다. 그리고 프린트 계열로 이웃한 A-11(C3 리노컷)과는 공정이 반대다 — **리노컷은 파고 눌러 찍어 가장자리가 칼로 끊기고**, 스텐실은 **판이 비켜 간 자리로 형태가 생겨 가장자리가 분무·문지름으로 뭉갠다**. 팔레트도 오트지+테라코타/검정 2잉크 ↔ 회백지+보라 3층+흰 과슈+노랑이라 안 겹친다.

**🔴 라인 충돌 확인 (§7.2 분리 규칙).**

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 2D 인쇄 판. 실물 입체 재료(양모·바느질·점토) 없음 — NOT 절에 명시 |
| 전래동화 **점눈이** | ✕ (4축 전부 분리) | ① **종이색** — 점눈이는 밝은 크림(=햇빛), 여기는 **차가운 회백 #E9E6E4** ② **매체** — 느슨한 색연필 낙서가 아니라 **스텐실·스탬프 판 + 그 위 손 윤곽** ③ **얼굴** — 점눈+실선 입이 아니라 **그린 눈 + 별개 눈썹 선**(서운함·갸웃함을 써야 한다) ④ 🔴 **빨강이 한 점도 없다** — 「화면당 빨강 1점」 규칙과 정반대. 이 권의 악센트는 **흰색과 노란색이고 서로 교대한다** |
| 세계명작 수채 그림풍 | ✕ | 붓 톤 아님. 판 겹침 + 반복 스탬프 |
| A-01 · A-04 · c37(C6 이웃) | ✕ | 셋 다 **저정보 필드를 「비워서」** 만든다(안개·회백 여백·마른 워시). 여기는 **꽉 채워서** 만든다 — 해법이 정반대 |
| A-11(C3 이웃) | ✕ | 리노컷 칼자국·눌림 ↔ 스텐실 분무·문지름. 잉크 2도 ↔ 보라 3층+흰+노랑 |
| a91(C8 이웃) | ⚠️ 한 곳만 주의 | a91 의 악센트 = **안 칠한 흰 종이**(reserve). 여기 거품 = 🔴 **종이보다 밝은 불투명 흰 과슈**(판 위에 얹는 유일한 불투명). 둘이 「흰색이 사건」이라는 점에서 이웃하므로, **거품은 절대 reserve 로 만들지 않는다** — 이 규칙이 두 권을 가른다 |
| g10(C2 이웃) | ✕ | 잉크 선이 주인공 ↔ 여기는 **판이 주인공이고 선은 인물에만** |

**🔴 대본 SCENE 결함 3건 — 그림에서 교정한다.**

| # | 대본 | 문제 | 그림 처방 |
|---|---|---|---|
| 1 | p4 배경·소품 「그 위로 흩날리는 작은 **꽃가루 알갱이들**」 | p7 톤이 「벌의 노란 꽃가루가 이 화면에서 **유일하게 새로 들어온 색**」이라 못 박았다. p4 에 노랑이 있으면 p7 의 첫 등장이 첫 등장이 아니게 된다 | p4 의 알갱이는 **옅은 라일락 먼지**로 칠한다(노랑 금지). 컷 p4 의 `POLLEN:` 줄에 명시 |
| 2 | p4 인물 「코끝이 **발갛게** 씰룩인다」 | 이 권엔 빨강·분홍이 한 점도 없다. 서운함을 붉은 코로 쓰면 팔레트가 열 쪽 중 한 장에서 깨진다 | 코끝을 **보라 그늘 한 단 진하게**(#4A4058) + 콧등에 짧은 주름 두 줄. 색이 아니라 **값과 선**으로 쓴다 |
| 3 | p1 톤 「젖은 **흰 털**과 앞발의 흰 거품만 다른 색」 | 🔴 **흰 위의 흰은 안 보인다.** 토끼가 희면 이 권의 원인 표지(거품)가 몸에 묻혀 사라진다 | 토끼를 **모래빛 회백 #D8CFC2**(젖으면 #B9AE9E)로 낮추고, **순백 불투명은 거품에만** 허용한다. 「종이보다 밝은 것은 거품뿐」이 앵커 규칙이 된다 |

**밀도 배급(§2.10 · §2.12)**: 10쪽 중 **p9 한 장**(열 마리가 몰려드는 쪽). 여기만 벌 개체와 꽃가루를 마감으로 올리고, 나머지 아홉 쪽의 밭은 끝까지 반복 판으로 둔다. 🔴 p3 은 화면이 벌로 가득하지만 **밀도가 아니라 반복**이다 — 벌 하나하나를 그리면 빈 원이 안 보인다.

**의인화 등급(a91 에서 확립한 규칙 재사용)**: 토끼 = **이족**(뒷다리로 서고 앞발이 손 — 폴짝 뛰고, 꽃을 안고, 앞발을 코에 댄다) / 벌 = **말은 하되 손짓 없음**(방향을 트는 것과 앉는 것만). 🔴 **포즈가 안 되면 벌을 바꾸지 말고 토끼의 포즈를 바꾼다.** p10 접촉은 벌이 귀 끝에 앉는 것으로 끝내고 등급을 뒤집지 않는다.

---

## A-97 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-lavender  (young rabbit / Provence lavender field / misunderstanding)

Style: a hand-printed picture-book page for 4-6 year olds. Sunlit, patterned, calm and un-slick.
  The whole book happens in ONE field of lavender, and the events are two tiny colours:
  a lump of white soap foam, and then yellow pollen. Everything else exists to let those read.

MEDIUM: hand-cut STENCIL and hand-pressed STAMP printing on cool off-white toothed paper,
  with the characters drawn by hand on top of the printed field.
  - THE LAVENDER FIELD IS PRINTED, NOT PAINTED. One carved lavender-spike stamp is pressed
    over and over to build the rows, and the ground plane is laid through cut stencils.
    Each spike is five to seven short marks, never every floret.
  - 🔴 THE STAMPS ARE PRESSED BY HAND, SO NO TWO ARE THE SAME. Angle, height and ink load
    vary spike to spike; some print heavy and wet, some print starved and grainy with the
    paper showing through the middle. Some sit slightly crooked. Where two passes overlap the
    colour deepens into a third tone. NEVER a mechanically repeated, evenly spaced, identical
    motif - that is wallpaper, not printing.
  - Stencil edges are soft and slightly furred where the pigment crept or was rubbed under the
    cut edge. Shapes are made by the stencil stopping, never by a clean vector line.
  - 🔴 THE CHARACTERS ARE DRAWN, NOT STAMPED. The rabbit is one flat printed body plane with a
    hand-drawn contour and hand-drawn face laid on top, so it can act. It is the only thing on
    the page made by a hand rather than by a plate.
  No blending into digital smoothness, no airbrush, no glow, no photographic texture overlay.

PALETTE: a violet field dominates every page - three printed lavender tones plus a grey-green
  foliage note and a dry earth path. The cool paper shows through the grain everywhere.
  Hex anchors: paper #E9E6E4 / lavender pale #B3A6D0 / lavender deep #6E5E9B /
    violet shadow #4A4058 / grey-green stem #8E9C86 / dry earth path #C9BBA8 /
    rabbit fur #D8CFC2 (wet: #B9AE9E) / bee body #3B3340 /
    🔴 SOAP-FOAM WHITE #FFFFFF (opaque) / 🔴 POLLEN YELLOW #F2C33C.

  🔴 EXACTLY TWO SPECIAL COLOURS EXIST IN THIS BOOK, AND THEY TAKE TURNS:
    - WHITE. The ONLY pure opaque white in the world is the lump of soap foam between the
      rabbit's front paws. 🔴 IT MUST BE PAINTED OPAQUE, BRIGHTER THAN THE BARE PAPER - never
      left as unprinted paper. Nothing else is white: no white highlights on the lavender, no
      white clouds, no white sparkle on water, no white flowers, no white blaze on the rabbit.
      Rule of thumb: if it is the brightest thing on the page, it is the foam.
    - YELLOW. The ONLY warm saturated colour in the world is flower pollen. It does NOT exist
      before page 7. 🔴 THIS INCLUDES THE BEES - the bees are dark violet-black silhouettes
      with paper-coloured wings, and they have NO yellow stripes, NO amber bodies and NO honey
      glow. A yellow bee on page 1 destroys the whole book.
    - There is NO red, NO orange, NO pink and NO blue anywhere in these ten pages at all.
      Not on the nose, not in the sky, not at sunset, not on a shoe, not on a petal.

  🔴 THE NARRATIVE COLOUR IS WHITE-THEN-YELLOW. Early pages carry one small opaque white lump
    and no yellow at all; late pages carry no white at all and yellow scattered over the rabbit.
    If a reader who cannot read the words follows only those two colours, they must be able to
    tell what caused the problem and what fixed it. That is the entire job of the colour here.

MATERIAL TRANSLATION (🔴 keep it printed and drawn - never photographic, never plastic):
  - LAVENDER SPIKE = one stamp: a grey-green stem stroke plus five to seven short violet marks
    stacked at its top. NOT every floret drawn, NOT a photographed flower, NOT an airbrushed
    purple blur.
  - THE FIELD IN DEPTH = the same stamp printed smaller and paler toward the horizon, in rows
    that run as clean diagonal bands. Distance is made by SIZE AND PALENESS OF THE STAMP,
    never by blur or fog.
  - WET FUR = the flat fur plane with each clump drawn as THREE TO FIVE darker strokes, and AT
    MOST TWELVE such strokes on the whole animal, plus two or three drop shapes off the tips.
    Count them: the thirteenth stroke is fur texture. NOT a shiny highlight, NOT a plastic sheen.
  - SOAP FOAM = opaque white gouache pressed on with a small brush - one soft lump with three
    or four little bubble circles crowding its edge, and a faint grey line under it where it
    meets the fur. Matte, chalky, sitting ON TOP of everything else in the picture.
    NOT transparent glassy bubbles, NOT rainbow iridescence, NOT lens sparkle, NOT foam drawn
    as white outlines.
  - POLLEN = dry yellow pigment SPATTERED and dabbed - separate specks and small clumps that
    sit on the surface like dust that landed. Grains vary in size and some are half-absorbed
    into the paper. NOT a yellow glow, NOT bokeh, NOT glitter, NOT a smooth yellow wash.
  - A BEE = a small dark rounded body of two printed marks, a thin darker head, and wings left
    as thin paper-coloured planes with one line through them. At distance a bee is a single
    dark mark. NOT an insect illustration, NOT rendered compound eyes, NOT striped yellow.
  - A BEE'S FLIGHT PATH = one short dashed or broken drawn line, three or four dashes only.
    NOT a glowing trail, NOT a swoosh, NOT a motion blur.
  - EARTH PATH = one flat stencilled plane of dry warm grey with the paper grain showing.
    NOT rendered soil, NOT pebbles drawn one by one.

COMPOSITION: the rows are the composition. Lavender rows run as strong diagonals across the
  frame and the eye rides them; the rabbit is placed OFF a row so it breaks the rhythm.
  The rabbit is small in frame (about 1/6 of page height) on the wide pages and comes forward
  only on the close pages. Never centre it in dead symmetry except where a cut says so.
  Keep the bottom 18% of the image quiet and free of key subject matter (a caption band is
  laid over it later).

FINISH HIERARCHY - read this twice. This is about how FINISHED each area is, NOT about opacity.
  1. THE RABBIT = finished. Printed body plane, drawn contour, drawn face, drawn wet-fur marks.
  2. WHAT THE RABBIT TOUCHES OR SPEAKS TO on that page (the one spike it leans to, the armful
     of cut stems, the single speaking bee) = half-finished: contour plus one printed pass.
  3. EVERYTHING ELSE = THE PRINTED FIELD ITSELF, built from the repeated stamp and left alone.
  🔴 REPETITION IS THE NEGATIVE SPACE OF THIS BOOK. The field is dense but carries NO
  information: it is the same mark again and again, so the eye reads it as one texture and
  stops looking inside it. That is what lets a thumb-sized white lump and a handful of yellow
  specks be seen from across a room.
  🔴 THEREFORE: never individuate the field. No single lavender spike may be more detailed,
  more contrasty or more colourful than its neighbours. No bees in the far rows get faces,
  legs or stripes. No butterflies, no extra insects, no birds, no flowers of another kind,
  no farmhouse detail, no fence posts counted out. The moment one thing in the field becomes
  interesting, the foam and the pollen stop being the events.
  🔴 The field is NOT blurred, NOT hazy, NOT out of focus. It is fully printed and perfectly
  sharp - it simply has nothing to find in it.

CHARACTER DESIGN: eyes are DRAWN, not dotted - a dark rounded eye with a separate drawn brow
  line above it, so the face can act (delighted, sneaking, hurt, holding-its-breath, amazed).
  NOT dot-eyes. Muzzle, mouth and whiskers are two or three drawn strokes.
  🔴 ANTHROPOMORPHISM GRADE, FIXED FOR ALL TEN PAGES: the rabbit stands on its hind legs and
  uses its front paws as hands (it hops, it hugs an armful of stems, it holds a paw to its
  nose). The bee TALKS but has NO gestures - it only turns its facing and lands. If a pose
  will not work, change the rabbit's pose, never the bee's grade.
  FACE SEPARATION (required): the eyes and brows must read apart from the fur plane in VALUE.
  Test: at thumbnail size the mood is still legible.

SETTING: a Provence lavender farm - long straight rows of lavender running to the horizon,
  bare dry earth tracks between the rows, a low dry-stone wall far off, a few cypress and a
  small stone farmhouse on the ridge, southern French summer light.
  NO Asian architecture, NO tropical plants, NO English cottage garden mix, NO other flower
  species in the field - it is a single crop planted in lines, and that is the point.

COLOUR-EVENT MAP (which of the two special colours is on the page):
  p1  FOAM yes / POLLEN none        p6  FOAM yes / POLLEN none
  p2  FOAM yes / POLLEN none        p7  FOAM small / 🔴 POLLEN FIRST APPEARANCE
  p3  FOAM hidden / POLLEN none     p8  FOAM left half only / POLLEN right half
  p4  FOAM hidden / POLLEN none     p9  FOAM none / POLLEN everywhere on the rabbit
  p5  FOAM yes / POLLEN none        p10 FOAM none / POLLEN everywhere on the rabbit

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT digital airbrush / NOT smooth gradients / NOT glossy 3D CG render / NOT cel-shaded
  anime / NOT a texture filter laid over flat digital colour (the print must MAKE the shapes) /
  NOT photographic / NOT a stock lavender-field photograph look / NOT a mechanically repeated
  identical vector motif or wallpaper pattern / NOT a blurred, hazy or depth-of-field
  background (the field is sharp and empty of information, which is not the same thing) /
  NOT rendered individual florets, hairs, pebbles or insect anatomy / NOT yellow-striped bees /
  NOT any yellow at all before the page where the pollen first appears / NOT white highlights,
  white clouds, white flowers or sparkles anywhere (white belongs to the soap foam alone) /
  NOT any red, orange, pink or blue anywhere in the book / NOT an orange sunset sky /
  NOT butterflies, birds, ladybirds or any second insect / NOT any lettering, numerals,
  signage or numbers anywhere in the image / NOT wool felt, NOT stitched fabric, NOT sculpted
  clay (other lines own those) / NOT loose coloured-pencil scribble on warm cream paper with
  one red thing per page (that is another line).
```

**🔴 이 앵커의 세 불변 규칙 (매 컷 반복 확인)**

**규칙 A — 벌의 자리.** 컷마다 `BEES:` 줄을 먼저 읽는다. 이 책에서 벌은 개체가 아니라 **공간 구조**다.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 |
|---|---|---|---|---|---|---|---|---|---|
| 멀리 점점이 | 🔴 옆 이삭으로 옮겨 앉는 중 | 🔴 **심음** — 토끼 둘레 한 뼘만 빈 원 | 화면 오른쪽에만 뭉침 | 저 멀리 두어 마리 | 머리 위를 스치지 않고 가로질러 감 | 🔴 한 마리만, 코앞, **같은 깊이** | 오른쪽 위로 두어 마리가 처음 가까워짐 | 사방에서 안쪽으로 열 마리 | 🔴 **회수** — 몸 둘레를 감싸고 같이 이동 |

**규칙 B — 흰 거품.** 컷마다 `FOAM:` 줄을 읽는다. 🔴 **거품은 종이보다 밝은 유일한 불투명 흰색**이고, `none` 인 쪽엔 화면 어디에도 순백이 없다.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 |
|---|---|---|---|---|---|---|---|---|---|
| 앞발 | 앞발(꽃대에 얹은) | 몸에 가려 안 보임 | 모은 앞발 사이, 작게 | 앞발 털 | 꽃을 그러쥔 앞발 | 작게(주역 아님) | 🔴 **왼쪽에만 · 오른쪽엔 없음** | 없음 | 없음 |

**규칙 C — 노란 꽃가루.** 컷마다 `POLLEN:` 줄을 읽는다. 🔴 **p7 이전에 노랑은 한 점도 없다**(벌의 몸도 포함).

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 |
|---|---|---|---|---|---|---|---|---|---|
| 없음 | 없음 | 없음 | 없음(🔴 대본의 알갱이 = 라일락 먼지) | 없음 | 없음 | 🔴 **첫 등장** — 벌 뒷다리 주머니 | 오른쪽 절반에서 터짐 | 온몸 | 온몸 + 날개에 걸린 늦은 빛 |

---

## A-97 §3. 캐릭터 시트 (🔴 이것부터 굽는다)

```
CHARACTER SHEET - BunnyWet   (bake this FIRST, before any scene)

🔴 THE SHEET IS MADE IN THE SAME WAY AS THE BOOK. A flat printed fur plane on cool off-white
  toothed paper #E9E6E4, with a hand-drawn contour and a hand-drawn face laid on top. The
  print grain must show inside the fur plane, the contour must be left open in a few places,
  and the stencil edge must be slightly furred. Do NOT render this rabbit smoothly just
  because there is no background behind it. There is NO yellow and NO red anywhere on
  this sheet.

FACE: a young rabbit's face, rounded, muzzle short. Eyes = a dark rounded eye #2A2430 with a
  separate DRAWN BROW STROKE above each - 🔴 the brows are the acting, and they must be able
  to lift (delight), pull together (hurt), and tilt unevenly (puzzled). A small drawn nose
  wedge in violet shadow #4A4058, a thin mouth line, three whisker strokes each side.
  🔴 The nose is NEVER red or pink. When the rabbit is close to crying, the nose gets one
  step DARKER in violet and gains two short crease lines - value and line, not colour.
  No blush, no glossy catchlight, no dot-eyes.
FUR: sandy off-white #D8CFC2 body, a slightly deeper #C2B7A8 along the back and haunch, ear
  insides in violet shadow #4A4058. 🔴 THE RABBIT IS NOT WHITE - it is a sandy warm grey, so
  that the opaque soap foam can be brighter than the whole animal.
  🔴 WET STATE (this sheet): the coat is soaked and clings to the body, parted into small
  pointed clumps drawn as short darker strokes, the silhouette narrower and slicker than a dry
  rabbit's, with two or three flicked drop shapes at the ear tips and chest. Matte - the wet
  is made by the clumping and the darker value, NEVER by a shine or a highlight.
FOAM: 🔴 ONE lump of opaque white gouache #FFFFFF between and across the two front paws, about
  the size of the rabbit's own eye, with three or four small bubble circles crowding its edge
  and a faint grey line where it meets the fur. It is the brightest thing on the sheet and it
  must sit ON TOP of the fur, not inside it. It appears in EVERY view on this sheet, in the
  same place, so the illustrator can keep it continuous across pages.
BUILD & SILHOUETTE: a small young rabbit, upright on its hind legs, about four heads tall.
  Long ears that can flag back (excited), fold flat (hurt) and stand straight up (holding
  breath); a round short tail. Silhouette = upright body + two long ears + two front paws
  held forward, readable at thumbnail size and instantly distinct from a hare, a cat or a dog.
REFERENCE SHEET: full-body front idle standing on hind legs with both front paws forward and
  the foam visible / three-quarter mid-hop with ears flagged back / side view standing stiff
  and straight with ears up and cheeks puffed (holding its breath) / back view sitting, ears
  drooped; plus FOUR expression close-ups: delighted (brows up, eyes wide, mouth open),
  sneaking (body low, one paw lifted, eyes narrowed toward a flower),
  hurt (ears flat back, brows pulled together and inner ends raised, mouth corners down,
  nose one step darker with two crease lines - 🔴 NO red nose),
  puzzled (one brow up and one down, head tilted, one paw held at the nose).
  Plain cool off-white paper background, no scenery, no lavender, no bees, no yellow.
🔴 NO YELLOW, NO RED, NO PINK, NO BLUE ANYWHERE ON THIS SHEET.
SCENE token: BunnyWet.
```

```
CHARACTER SHEET - BunnyPollen   (state variant - same animal, after rolling; bake SECOND)

🔴 IDENTICAL FACE, IDENTICAL EARS, IDENTICAL BUILD, IDENTICAL FUR COLOUR as BunnyWet. Same
  medium, same paper, same print grain, same drawn contour. Attach the approved BunnyWet
  sheet as a reference and change ONLY the two things listed below.

CHANGE 1 - THE COAT IS DRY AND FLUFFED. The clinging pointed clumps are gone; the outline is
  softer and broader, with a few loose strands standing up and two or three small violet petal
  fragments caught in it. No water drops anywhere.
CHANGE 2 - 🔴 POLLEN. Dry yellow #F2C33C pigment is SPATTERED and dabbed over the coat: dense
  along the back, shoulders, the outer ear edges, the muzzle bridge and the tail; sparse on
  the chest. Separate specks and small clumps of varying size that sit on the surface like
  dust that landed, some half-absorbed into the paper. NOT an even yellow tint, NOT a glow,
  NOT glitter, NOT a smooth wash over the body.
🔴 THE SOAP FOAM IS GONE. There is no white anywhere on this sheet - not on the paws, not in
  the fur, not as a highlight. Its absence is the point: on this sheet yellow has replaced
  white, and that swap is the story.
REFERENCE SHEET: full-body front standing with both front paws thrown wide / three-quarter
  walking carefully with the head turned to glance back over one shoulder / close-up of the
  head showing pollen on the ear edges and muzzle with a bee landing on one ear tip;
  plus TWO expression close-ups: amazed (brows high, eyes round, mouth wide open, body frozen)
  and quietly delighted (eyes crescent, mouth corners up, one ear held very still).
  Plain cool off-white paper background, no scenery.
🔴 NO RED, NO PINK, NO BLUE, NO WHITE ANYWHERE ON THIS SHEET.
SCENE token: BunnyPollen. (Never write "Bunny" alone.)
```

```
CHARACTER SHEET - PollenBee and FieldBees   (bake THIRD, attach as @image3)

🔴 SAME MEDIUM AS ABOVE - printed marks on cool off-white toothed paper, print grain visible,
  contours left open. These must be recognisable from SILHOUETTE ALONE at thumbnail size.

FIELDBEES (the crowd, every page): a bee is a small dark rounded body #3B3340 made of two
  printed marks, a thinner darker head, and two wings left as thin paper-coloured planes with
  one drawn line through each. 🔴 NO YELLOW STRIPES, NO AMBER BODY, NO HONEY GLOW, NO RENDERED
  EYES, NO FACES. At any distance beyond arm's length a bee is ONE dark mark, nothing more.
  They are a texture and a position, never characters. Flight paths are three or four short
  drawn dashes - never a glowing trail, never motion blur.
  🔴 Draw a row of them at four distances - near, mid, far, horizon - so the illustrator can
  see exactly how fast they collapse into a single mark.

POLLENBEE (the one that speaks, p7 and p10): the SAME bee body, but 🔴 with two fat yellow
  #F2C33C pollen baskets packed on its hind legs, and a few loose yellow grains falling from
  them. It is slightly plumper and slightly larger than the field bees and it is the ONLY bee
  in the book that carries yellow. 🔴 Its yellow must never tint anything around it - not the
  lavender behind it, not the rabbit's fur, not the air. No warm glow spilling outward.
  🔴 IT HAS NO ARMS AND MAKES NO GESTURES. It acts only by TURNING ITS FACING and by LANDING.
  Show it in three states: flying away with the body angled off / 🔴 halted mid-air with the
  body turned back a half-turn to face the viewer's left while still angled to leave (this is
  the "speaking" pose - a turn of the whole body, not a raised leg) / settled on a surface
  with the legs folded under.

REFERENCE SHEET: PollenBee and one FieldBee side by side at correct relative scale; 🔴 PLUS A
  SCALE PLATE THAT MATTERS - PollenBee drawn next to a young rabbit's head at the SAME DEPTH,
  showing the true size relation (the bee is about as long as the rabbit's eye is wide). This
  plate exists because one page puts them nose to nose and perspective must not be allowed to
  flip their sizes. Plain cool off-white paper background, no lavender.
SCENE tokens: PollenBee, FieldBees. Never write "bee" alone.
```

---

## A-97 §4. 10컷

각 컷은 `STYLE ANCHOR + @image1(BunnyWet 시트) + @image4(p3 승인본 = 필드 판 ref) + 아래 블록` 으로 합성한다.
p8·p9·p10 은 `@image2(BunnyPollen)` 를, p7·p9·p10 은 `@image3(Bee)` 를 추가로 붙인다.
🔴 p3 은 필드 판 ref 가 아직 없는 상태에서 **가장 먼저** 굽는다. p10 은 반드시 **p3 승인본을 ref 로** 붙인다(빈 원 ↔ 채워진 원이 같은 반경이어야 한다).

### p1 — 목욕하고 밭으로 뛰어들다
```
CAMERA: medium wide, child's eye level. The rabbit enters from the lower LEFT and moves into
  the field toward the upper right; the lavender rows run away as diagonals to a high horizon.
SUBJECT: lower left, BunnyWet is caught mid-leap onto the bare earth track between two rows,
  hind legs still pushing off, both front paws thrown forward, ears streaming back, mouth wide
  open with delight, brows high. 🔴 The coat is soaked and clinging in pointed clumps, with
  three or four drop shapes flicked off the ear tips and chest.
SETTING: long rows of stamped lavender running to the horizon, a dry pale earth track between
  them, a low dry-stone wall and a few cypress far off on the ridge. Bright late-morning light.
BEES: scattered high over the rows as single dark marks, far away and evenly spread. No bee is
  near the rabbit yet and nothing has happened - this page only says "a field full of bees".
FOAM: 🔴 present. One opaque white lump between the two outstretched front paws, small in
  frame but the brightest thing in the picture. The eye should find it before it finds the
  rabbit's face.
POLLEN: 🔴 NONE. No yellow anywhere - not on the bees, not in the light, not on the ground.
FINISH: BunnyWet finished. The two nearest lavender spikes it is leaping past and the earth
  track under it half-finished. Everything else is the repeated stamp field and nothing more.
TONE: open, bright, cheerful. Establish the violet field at its fullest so that every later
  page can be measured against this one.
```

### p2 — 인사했더니 옆 꽃으로 가 버렸다
```
CAMERA: close-up, eye level. The rabbit's head and one front paw fill the LEFT of the frame;
  two lavender spikes stand at the centre-right, close enough to touch.
SUBJECT: left, BunnyWet stretches its neck and brings its nose close to the near spike, mouth
  opening to say hello, eyes bright, both ears tipped forward, one front paw laid lightly on
  the flower stem.
SETTING: the two spikes are the largest, most finished lavender in the whole book; behind them
  the rows fall away into pale repeated stamps.
BEES: 🔴 THE POINT OF THE PAGE, AND IT MUST BE READABLE WITHOUT WORDS. The spike the rabbit
  is greeting is EMPTY. The spike immediately beside it has one bee just settling onto it,
  wings still open. Between the two spikes lies one short broken flight path of three dashes,
  running away from the rabbit. Two spikes, one gap, one arrival - side by side in one frame.
FOAM: 🔴 present, on the paw resting against the stem. It sits right next to the empty spike,
  so the cause and the effect are in the same corner of the picture.
POLLEN: 🔴 NONE. The arriving bee carries no yellow whatsoever.
FINISH: the rabbit's head and paw finished. The two near spikes and the settling bee
  half-finished. Everything behind them is pale repeated stamp.
TONE: even, sunny, still hopeful. Do not make this page sad yet - the rabbit has not
  understood anything.
```

### p3 — 내 둘레만 텅 비었다 🔴 심음 · 필드 판 ref
```
🔴 BAKE THIS PAGE FIRST OF ALL TEN. It defines the printed lavender field for the whole book,
  and it plants the shape that the last page pays off.
CAMERA: wide, HIGH ANGLE, looking down on the rows from above so the field reads as a pattern
  and the rabbit as a small break in it.
SUBJECT: centre, BunnyWet stands on the earth track between two rows, head turning one way and
  then the other, one front paw half-raised toward a flower and stopped there, one ear tipped
  sideways. Small and low in the frame.
SETTING: rows of stamped lavender filling the entire picture, seen from above as strong
  parallel bands; the pale track the rabbit stands on cuts across them. Its own footprints
  are scuffed about the earth in a messy loop.
BEES: 🔴 THIS IS THE PLANT AND IT IS THE WHOLE POINT OF THE PAGE. Bees sit thickly over the
  lavender across the entire frame - as a dense even TEXTURE of small dark marks, never as
  individually drawn insects. 🔴 Around the rabbit there is a clean EMPTY CIRCLE about one
  hand-span wide with not a single bee inside it. The circle must be obvious from across a
  room. Around its rim, several short broken flight paths point OUTWARD, away from the rabbit.
  🔴 Do not draw any bee's face, legs or stripes anywhere on this page; if the individual bees
  become interesting, the hole stops being visible and the last page has nothing to pay off.
FOAM: 🔴 hidden. From this angle the front paws are under the body and the foam does not show.
  Do NOT paint a white lump anywhere else to compensate, and do NOT put white on the ground.
  There is no pure white on this page at all.
POLLEN: 🔴 NONE.
FINISH: 🔴 THE FIELD REFERENCE PLATE. The stamped lavender must be dense, sharp and perfectly
  empty of information - the same mark again and again, varying only in press and angle, with
  overlap tones where passes crossed. The rabbit is finished; the track under it is
  half-finished; nothing else is described. No butterflies, no other flowers, no farm
  buildings, no fence.
TONE: flat overhead noon light so nothing casts a long shadow to compete with the empty circle.
  The field is busy and bright; the circle is the one quiet place in the picture.
```

### p4 — 붕붕은 저쪽에서만 난다
```
CAMERA: medium close-up, slightly LOW angle. 🔴 The frame splits left and right: the rabbit
  alone on the LEFT, the bees far off on the RIGHT, and a wide quiet gap of lavender between.
SUBJECT: left, BunnyWet stands with its shoulders dropped, both front paws gathered and
  clasped in front of its belly, ears laid flat back, mouth corners down, brows pulled together
  with the inner ends raised. It is looking across at the bees, not at us.
  🔴 The nose is ONE STEP DARKER in violet with two short crease lines - it is NOT red, NOT
  pink and NOT flushed.
SETTING: the lavender immediately around the rabbit stands perfectly still and unshaken; the
  row on the right is being jostled, its spikes tipping and trembling.
BEES: 🔴 ALL OF THEM ARE ON THE RIGHT AND NONE ARE ON THE LEFT. A busy knot of dark marks over
  the far row with short broken flight paths crossing each other, and absolutely nothing in the
  air on the rabbit's side of the frame. The silence around the rabbit is drawn as EMPTY AIR.
FOAM: present but hidden low between the clasped paws - a sliver of white at the join, never a
  bright lump. This page belongs to the empty air, not to the foam.
POLLEN: 🔴 NONE. The script mentions specks drifting over the far row - paint them as PALE
  LILAC DUST #B3A6D0, not yellow. 🔴 The first yellow in this book appears on page 7 and
  nowhere earlier.
FINISH: the rabbit finished. The still spikes right beside it half-finished. The jostled far
  row is stamp field with a little extra press. Nothing else.
TONE: even light on both halves - do NOT dramatise with shadow. The sadness must come from
  the emptiness of one half of the frame, not from a dark sky.
```

### p5 — 숨을 참고 꼼짝 않기
```
CAMERA: medium, eye level, the rabbit standing dead centre - 🔴 the one page that is allowed
  to be symmetrical, because stillness is the subject.
SUBJECT: centre, BunnyWet stands rigid as a stick with both front paws pressed flat to its
  sides, both ears straight up, eyes squeezed shut, cheeks puffed round with held breath, one
  hind toe barely lifted. Nothing about the body suggests movement.
SETTING: one lavender spike stands directly in front of the rabbit's nose, absolutely
  unmoving. The rows behind are still. A short stubby shadow sits under the rabbit's feet -
  the sun is higher now.
BEES: two or three single dark marks passing along a FAR row only, small and casual. 🔴 The air
  in front of the rabbit's nose is completely empty. Nothing is flying anywhere near it.
FOAM: 🔴 present, clearly visible on the fur of a front paw pressed against the flank. On a
  page where nothing moves, the white lump is the only thing to look at besides the face -
  which is exactly right, because it is the reason nothing is coming.
POLLEN: 🔴 NONE.
FINISH: the rabbit finished. The single spike at its nose half-finished. Everything else is
  stamp field.
TONE: quiet high-noon light, low contrast, absolutely nothing in motion anywhere in the frame.
  If any part of the picture looks like it is moving, the page has failed.
```

### p6 — 꽃을 한 아름 안았는데도
```
CAMERA: medium, eye level, the rabbit at centre with clear air above its head for the bees to
  cross.
SUBJECT: centre, BunnyWet hugs a huge armful of cut lavender against its chest with both front
  paws, face half buried in the stems, head tipped back and mouth open as it looks up. Its
  grip is slipping and several stems are sliding out and falling.
SETTING: 🔴 the armful is the deepest, most saturated violet in the entire book - more spikes,
  pressed heavier, than anywhere else. Cut stems and loose florets lie scattered at its feet
  and the nearby row is visibly disturbed where it harvested.
BEES: three or four dark marks crossing the frame ABOVE the rabbit's head in straight, unbroken
  paths that do not deviate, do not slow and 🔴 do not curve toward the flowers it is holding.
  Their dashed paths pass clean over the top of the armful.
FOAM: 🔴 present, on the paw clutching the stems - white against the darkest violet on any
  page. This is the strongest white-on-violet contrast in the book; place it where the eye
  lands after the face.
POLLEN: 🔴 NONE.
FINISH: the rabbit and the armful it is holding finished. The fallen stems at its feet
  half-finished. Everything else is stamp field.
TONE: the page must read instantly as "this many flowers and still nothing came". Keep the
  armful huge and the sky above it empty except for the passing paths.
```

### p7 — 벌이 이유를 말한다 🔴 노랑 첫 등장 (@image3)
```
CAMERA: close-up, eye level. 🔴 THE RABBIT'S FACE IS ON THE RIGHT AND THE BEE IS ON THE LEFT,
  AND THEY ARE AT THE SAME DEPTH IN THE PICTURE - the same distance from the viewer, lit the
  same, sharp the same. Perspective must not be allowed to make the bee look big or the rabbit
  look small. Use the scale plate on the bee sheet: the bee is about as long as the rabbit's
  eye is wide.
SUBJECT: right, BunnyWet's head fills the corner, eyes wide, nose pushed forward, one front paw
  reaching out as if to catch the bee without touching it, one ear tipped toward it; the armful
  of lavender has slid halfway out of its other arm.
  Left, PollenBee hangs in the air a hand's width from the rabbit's nose, 🔴 its body still
  angled away as if leaving but turned back a half-turn to face the rabbit. It is SPEAKING BY
  TURNING - no raised leg, no pointing, no gesture of any kind.
SETTING: one kinked flight path behind the bee where it swerved and stopped. The lavender
  behind both of them drops back into soft pale stamps so the two heads read cleanly.
BEES: 🔴 exactly ONE bee in this frame. The rest of the field's bees are out of frame or
  reduced to two faint marks at the very edge. This is a two-character page.
FOAM: present on the reaching paw, but small and low in the frame. 🔴 Do not let the white
  compete for attention on this page - it has done its job and is about to be replaced.
POLLEN: 🔴 FIRST APPEARANCE, AND IT MUST FEEL LIKE A NEW COLOUR ENTERING THE WORLD. Two fat
  yellow pollen baskets packed on the bee's hind legs, plus three or four loose grains falling
  from them. This is the first yellow in seven pages. 🔴 It must not tint anything around it -
  no yellow on the lavender, no yellow on the rabbit's fur, no warm glow in the air.
FINISH: both heads finished - this and page 9 are the two most worked pages. The kinked flight
  path and the slipping stems half-finished. Everything else pale stamp.
TONE: the two faces sharp and close, the field softened behind them. 🔴 The eye must land on
  the yellow first, then travel to the rabbit's eye - that path IS the page.
```

### p8 — 킁킁 · 데굴데굴 🔴 한 화면 두 시점 (@image2)
```
🔴 THIS PAGE SHOWS THE SAME RABBIT TWICE IN ONE PICTURE - the left figure is a moment earlier
  than the right figure, and the reading direction left-to-right IS the change. Do not draw
  two different rabbits, and do not separate them with a panel border or a frame line: one
  continuous field, two moments standing in it.
CAMERA: medium wide, eye level, the two figures set on a left-to-right diagonal - the left one
  smaller and further back, the right one larger and nearer.
SUBJECT (LEFT, earlier, smaller, further back): BunnyWet holds one front paw right up against
  its nose and sniffs it, one brow up and one down, head tilted, body dry-standing and still.
SUBJECT (RIGHT, later, larger, nearer): 🔴 use BunnyPollen - the same rabbit flung on its back
  deep in a lavender row, rolling, all four legs kicked at the sky, mouth open laughing, one
  ear pressed into the earth, stems bent flat beneath it.
SETTING: between the two figures the row is undisturbed; to the right of the rolling figure the
  lavender is crushed into a flattened track, with violet florets and stems thrown up into the
  air all around it.
BEES: nothing near the left figure at all. Above the right figure, two dark marks have turned
  and are drifting closer - 🔴 the first time in the book any flight path curves TOWARD the
  rabbit rather than away. They have not landed yet.
FOAM: 🔴 THE HINGE OF THE WHOLE BOOK. The LEFT figure still has the opaque white lump on the
  paw held at its nose - large and unmistakable, because the reader must see the thing the
  rabbit cannot smell. The RIGHT figure has NO WHITE ANYWHERE ON ITS BODY. Not a trace, not a
  smear, not a highlight. It has been rolled away.
POLLEN: 🔴 begins here, on the right half only. Yellow specks thrown up in the air around the
  rolling figure and already caught in its coat along the back and ear edges. The left half of
  the picture has no yellow at all.
FINISH: both figures finished. The crushed track and the thrown florets half-finished. The
  untouched field between and behind them is stamp only.
TONE: 🔴 THE PAGE CHANGES COLOUR AS YOU READ IT - quiet, dry and white-marked on the left;
  loud, scattered and yellow-flecked on the right. Keep the left half calm so the right half
  can explode.
```

### p9 — 열 마리가 몰려든다 🔴 밀도 배급 (@image2, @image3)
```
🔴 THIS IS THE ONE PAGE IN THE BOOK THAT GETS EXTRA DENSITY. Everything the previous eight
  pages saved is spent here.
CAMERA: medium close-up, slightly LOW angle looking up at the rabbit so it stands over us,
  filling the centre of the frame.
SUBJECT: centre, BunnyPollen has sprung upright with both front paws flung wide, eyes round,
  mouth wide open, body frozen mid-astonishment. Its whole coat is dry, fluffed and loaded with
  yellow. 🔴 One bee is settled on an ear tip, one on the nose, one on the tail, and the rabbit
  is holding absolutely still for them.
SETTING: the flattened lavender it rolled in lies beneath its feet with florets still drifting
  down through the air.
BEES: 🔴 THE PAYOFF OF THE EMPTY CIRCLE ON PAGE 3, AND THE ARROWS MUST REVERSE. Ten or so bees
  converging from every side toward the rabbit, each with a short broken flight path pointing
  INWARD. On pages 3 and 6 every path led away; here every single one leads in. Nothing in the
  picture may point outward.
  🔴 They are still dark silhouette marks with paper-coloured wings - the density comes from
  HOW MANY and HOW CLOSE, never from drawing insect anatomy.
FOAM: 🔴 NONE. There is no pure white anywhere on this page.
POLLEN: 🔴 EVERYWHERE ON THE RABBIT AND NOWHERE ELSE. Dense yellow spatter along the back,
  shoulders, ear edges, muzzle and tail; sparse on the chest. 🔴 The rabbit's coat is now the
  brightest, warmest thing in the entire book - the exact position the soap foam used to hold.
  The lavender around it stays cool violet; no yellow drifts into the field or the air.
FINISH: the rabbit, the three landed bees and the crushed lavender under its feet finished.
  The converging bees half-finished. 🔴 Even here the far field stays a plain stamp - density
  means the crowd and the pollen are fully worked, NEVER that the horizon gets described.
TONE: bright, loud, joyful. The warmest and busiest page in the book by a wide margin.
```

### p10 — 소리가 내 몸에서 난다 🔴 회수 (@image2, @image3, + p3 승인본을 ref 로)
```
🔴 ATTACH THE APPROVED PAGE 3 RENDER AS A REFERENCE. That page drew an empty circle one
  hand-span wide around the rabbit; this page fills that same circle with bees, at the SAME
  RADIUS. The two pictures are the plant and the payoff and the circle must measure the same.
CAMERA: medium wide, eye level, the rabbit walking LEFT TO RIGHT along the earth track between
  two rows, placed just left of centre with open track ahead of it.
SUBJECT: centre-left, BunnyPollen walks carefully with one hind foot lifted mid-step, head
  turned slightly to glance sideways over its own shoulder, mouth corners up. Its coat is
  loaded with yellow. 🔴 PollenBee is settled on the tip of its RIGHT ear, and the rabbit is
  visibly holding that one ear rigid while everything else about it moves.
SETTING: the track behind it carries its own footprints, and above those footprints a trail of
  short broken flight paths follows the same line - 🔴 the bees came with it. Far off, the
  dry-stone wall and the ridge. Low late-afternoon sun from the left.
BEES: 🔴 THE RECOVERY. Six or seven bees form a loose ring travelling WITH the rabbit, holding
  the same hand-span radius that was empty on page 3, none of them leaving. The ring must read
  as a body of sound moving with the animal - if the rabbit walked one step further, the ring
  would go too.
FOAM: 🔴 NONE. No pure white anywhere.
POLLEN: 🔴 all over the coat, and the low sun catches the loaded fur and the bees' wings so
  they read warm. 🔴 THE ONLY WARMTH ON THIS PAGE IS POLLEN AND POLLEN-LIT WING. The sky and
  the field stay cool violet and off-white paper. 🔴 NO ORANGE SUNSET, NO PINK CLOUD, NO GOLD
  HAZE - late afternoon here means longer shadows and a paler violet, not a warm sky. This is
  the single most likely place in the book for the palette to break.
FINISH: the rabbit and the bee on its ear finished. The travelling ring of bees, the footprints
  and the following flight paths half-finished. The rows and the ridge are stamp field only.
TONE: calm, warm, ending. The track ahead is open and bright; the way it came is quieter.
  🔴 The structure of the picture must say that the sound is no longer over there - it is
  around this body, and it moves when the body moves.
```

---

## 첫 렌더 검수 체크리스트 (6항목)

> 사용자가 GPT 로 뽑은 뒤 이걸로 판정한다. 🔴 **하나라도 걸리면 문구를 늘리지 말고 ref 를 바꿔라**(§5.1 — 문구로 세 번 실패하면 레버가 틀린 것이다).

| # | 볼 것 | 실패 시 처방 |
|---|---|---|
| 1 | 🔴 **p3 의 밭이 「반복」인가 「벽지」인가.** 스탬프가 완벽히 균일하게 반복되면 실패다. 낱개의 압력·각도·잉크량이 제각각이고 겹친 자리에 제3의 톤이 생겨야 한다 | MEDIUM 의 hand-pressed 문단 뒤에 「some crooked, some starved, overlap deepens」를 실제로 어긋난 예시로 다시 못 박고 재시도. 2회 실패면 **손으로 찍은 결이 살아 있는 승인 컷 1장을 확보해 ref 로 고정**하고 나머지를 그 뒤에 뽑는다 |
| 2 | 🔴 **p3 의 빈 원이 방 건너에서 보이나.** 이 권의 심음이 여기 하나뿐이라, 안 보이면 p10 이 아무것도 회수하지 못한다 | 벌을 개체로 그리지 말고 **텍스처로** 낮춘다(얼굴·다리·줄무늬 금지). 그래도 안 되면 원의 반경을 키우지 말고 **원 바깥 벌 밀도를 올린다** — 대비로 푼다 |
| 3 | 🔴 **p1~p6 에 노랑이 한 점이라도 있나.** 특히 **벌의 줄무늬**와 p4 의 꽃가루 알갱이 | 샌 사물을 이름으로 못 박아 NOT 에 추가(「no yellow stripes on any bee」). 2회 실패면 **노랑 없는 승인 컷(p3·p5)을 ref 로 먼저 확보**하고 p7 을 그 뒤에 굽는다 |
| 4 | 🔴 **거품이 불투명 흰색인가, 안 칠한 종이인가.** 종이색으로 남기면 a91 과 겹치고, 무엇보다 몸 위에서 안 튄다 | 「opaque gouache, brighter than the bare paper, sitting ON TOP」를 시트부터 다시 굽는다. 🔴 장면이 아니라 **시트**를 고친다 |
| 5 | 🔴 **p7 에서 벌과 토끼 얼굴의 크기가 뒤집혔나.** 벌이 새만 하거나 토끼가 인형만 하면 실패 | 문구 튜닝 금지. **벌 시트의 scale plate(토끼 머리 옆 같은 깊이)를 @image 로 붙여** 다시 굽는다 |
| 6 | **p8 이 한 화면 두 시점으로 읽히나.** 두 마리 다른 토끼로 보이거나, 칸이 나뉘어 만화가 됐으면 실패 | 「same rabbit twice, no panel border, one continuous field」를 유지한 채 **왼쪽을 더 작고 더 뒤로** 밀고 오른쪽을 키운다. 크기 차가 곧 시간 차다 |

부수: **토끼가 매끈한 CG 로 회귀했나**(§2.4 최대 실패 모드) — 눈에 하이라이트 점이 있거나 젖은 털에 광택이 있으면 장면을 고치지 말고 **시트를 다시 굽는다**. 시트가 안 되면 장면은 절대 안 된다.
부수: **p9 와 p10 을 나란히 놓고 a91·c37 의 첫 렌더와 같이 본다** — 이 라인에 워시 두 권(c37·a91)이 이미 있으므로, 새 앵커가 판 인쇄로 확실히 갈리는지 눈으로 확인한다.
