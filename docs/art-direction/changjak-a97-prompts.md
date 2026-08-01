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
STYLE ANCHOR - changjak-lavender   (young rabbit / Provence lavender field)

MEDIUM: hand-cut stencil and hand-pressed stamp printing on cool off-white toothed paper
  #E9E6E4. One carved lavender-spike stamp builds the rows, pressed over and over BY HAND, so
  angle, height and ink load differ spike to spike - some heavy and wet, some starved and grainy
  with the paper showing through, some crooked, overlaps deepening into a third tone. Stencil
  edges are soft and furred; shapes are made by the stencil stopping, never by a line. The
  rabbit is a printed body plane with a hand-drawn contour and face - the only hand-made thing.

PALETTE: paper #E9E6E4 · lavender pale #B3A6D0 · deep #6E5E9B · violet shadow #4A4058 ·
  stem #8E9C86 · earth #C9BBA8 · fur #D8CFC2 (wet #B9AE9E) · bee #3B3340 · FOAM WHITE #FFFFFF
  opaque · POLLEN YELLOW #F2C33C.
  Two special colours, taking turns. WHITE = only the soap-foam lump between the front paws,
  opaque and brighter than bare paper; no other white highlight, cloud, sparkle or flower.
  YELLOW = only pollen, none before page 7; bees are dark violet-black, paper wings, no stripes.
  No red, orange, pink or blue anywhere - not on the nose, not in the sky.

COUNTS (upper limits - count them): spike = 1 stem + 5-7 short marks, never an eighth, never a
  floret · fur clump = 3-5 strokes, max 12 on the animal · near bee = 7 marks, far bee = 1 mark
  · flight path = 3-4 dashes · earth path = 1 flat plane, 0 pebbles · foam = 1 lump + 3-4
  bubbles. FINISHED THINGS PER PAGE = 2 (the rabbit + the one thing it touches or speaks to);
  nothing else gets a contour. DENSITY RATION = page 9 only, where it rises to 5.
  The field holds ONE kind of object: 0 butterflies, 0 birds, 0 second flowers, 0 fence posts,
  0 described buildings. Depth = the same stamp smaller and paler, never blur.

COMPOSITION: rows as strong diagonals, rabbit set OFF a row, about 1/6 of page height except on
  close pages;

CHARACTER: a dark rounded eye with a SEPARATE drawn brow above it so the face can act - not
  dot-eyes; muzzle and whiskers 2-3 strokes; eyes read apart from the fur in value at thumbnail
  size. FIXED GRADE: the rabbit stands on hind legs, front paws as hands; the bee talks but has
  no gestures, only turning its facing and landing. If a pose fails, change the rabbit.

SETTING: a Provence lavender farm - straight rows to the horizon, dry earth tracks, a low
  dry-stone wall and cypress far off. European, one crop in lines, no other flower species.
  16:9 double-page spread, 4-6 year old picture book. No lettering or numerals anywhere.

NOT: no digital slickness of any kind - airbrush, gradient, glow, 3D CG, cel-shading,
  photographic, or a texture filter over flat colour (the print must MAKE the shapes) / not
  blurred or hazy (sharp and empty of information is not the same as out of focus) / not an
  identical repeated vector motif / not felt, stitched fabric or sculpted clay.
```

**🔴 매 컷 확인하는 세 줄** — 컷마다 `BEES:` `FOAM:` `POLLEN:` 을 먼저 읽는다.

| | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| **벌** | 멀리 점점이 | 옆 이삭으로 옮김 | 🔴 **심음** — 둘레 한 뼘 빈 원 | 오른쪽에만 | 저 멀리 둘 | 머리 위 통과 | 한 마리, 같은 깊이 | 처음 다가옴 | 열 마리 안쪽으로 | 🔴 **회수** — 몸 둘레 |
| **거품** | 앞발 | 꽃대 얹은 앞발 | 가려서 안 보임 | 모은 앞발 사이 | 앞발 털 | 그러쥔 앞발 | 작게 | 🔴 **왼쪽만** | 없음 | 없음 |
| **꽃가루** | 없음 | 없음 | 없음 | 없음(라일락 먼지) | 없음 | 없음 | 🔴 **첫 등장** | 오른쪽 절반 | 온몸 | 온몸 |

---

## A-97 §3. 캐릭터 시트 (🔴 이것부터 굽는다)

```
CHARACTER SHEET - BunnyWet   (bake FIRST, before any scene)

Same make as the book: a flat printed fur plane on cool off-white toothed paper #E9E6E4,
hand-drawn contour left open in places, furred stencil edge, print grain in the fur. Do not
render smoothly just because there is no background behind it.

FACE: young rabbit, rounded, short muzzle. A dark rounded eye #2A2430 with a SEPARATE drawn brow
  above each - the brows are the acting and must lift, pull together and tilt unevenly. Nose = a
  small violet #4A4058 wedge, one mouth line, three whiskers a side. The nose is NEVER red or
  pink; close to tears it goes one step darker plus two crease lines. No dot-eyes, no catchlight.
FUR: sandy off-white #D8CFC2, deeper #C2B7A8 on back and haunch, ear insides #4A4058. NOT white
  - the foam must be brighter than the whole animal. WET: the coat clings in pointed clumps of
  3-5 strokes each, max 12 on the body, plus two or three drop shapes at ear tips and chest.
  Matte: wet is clumping and value, never shine.
FOAM: ONE opaque white #FFFFFF lump across both front paws, eye-sized, 3-4 bubble circles at its
  edge. Brightest thing here, sitting ON TOP of the fur, in every view, same place.
BUILD: small, upright on hind legs, four heads tall; long ears that flag back, fold flat, stand
  straight up; round short tail; silhouette readable at thumbnail size.
SHEET: front idle, paws forward / three-quarter mid-hop, ears back / side view stiff and
  straight, ears up, cheeks puffed / back view sitting, ears drooped; plus four close-ups -
  delighted, sneaking, hurt (ears flat, brows together, no red nose), puzzled (one brow up, head
  tilted, paw at nose). Plain paper, no scenery, no bees. NO YELLOW, RED, PINK OR BLUE anywhere.
SCENE token: BunnyWet.
```

```
CHARACTER SHEET - BunnyPollen   (same animal after rolling; bake SECOND)

IDENTICAL FACE, EARS, BUILD and FUR COLOUR as BunnyWet - attach the approved BunnyWet sheet and
change only the two things below. Same medium, paper, grain and drawn contour.

DRY COAT: the clinging clumps are gone; the outline is softer and broader, a few loose strands
  standing up, two or three violet petal fragments caught in it. No water drops.
POLLEN: dry yellow #F2C33C spattered and dabbed over the coat - dense on back, shoulders, outer
  ear edges, muzzle bridge and tail, sparse on the chest. Separate specks and small clumps of
  varying size, some half-absorbed into the paper. Not a tint, not a glow, not glitter.
THE FOAM IS GONE - no white anywhere on this sheet. Yellow has replaced white.
SHEET: front, paws thrown wide / three-quarter walking carefully, head turned to glance back /
  head close-up with pollen on ear edges and muzzle and a bee landing on one ear tip; plus two
  close-ups - amazed (brows high, eyes round, mouth open, frozen) and quietly delighted (eyes
  crescent, one ear held very still). Plain paper. NO RED, PINK, BLUE OR WHITE anywhere.
SCENE token: BunnyPollen. Never write "Bunny" alone.
```

```
CHARACTER SHEET - PollenBee and FieldBees   (bake THIRD, attach as @image3)

Same medium: printed marks on cool off-white toothed paper, grain visible, contours left open.
Both must be recognisable from silhouette alone at thumbnail size.

FIELDBEES: a bee is 7 marks - two body marks #3B3340, one thinner darker head, two paper-coloured
  wing planes with one line through each. No yellow stripes, no amber body, no glow, no drawn
  eyes, no faces, no legs. Beyond a hand's reach a bee is ONE dark mark: a texture and a
  position, never a character. Flight paths = 3-4 short dashes, never a trail or motion blur.
  Draw a row at four distances (near, mid, far, horizon) so the collapse into one mark is visible.
POLLENBEE (speaks on p7 and p10): the same body plus two fat yellow #F2C33C pollen baskets on the
  hind legs and a few loose grains falling. Plumper and slightly larger, and the ONLY bee carrying
  yellow; its yellow must not tint the lavender, the fur or the air. No arms, no gestures - it
  acts by turning its facing and by landing. Three states: flying away / halted mid-air with the
  body turned back a half turn while still angled to leave (the speaking pose) / settled.
SHEET: PollenBee and one FieldBee side by side at correct relative scale, plus a SCALE PLATE -
  PollenBee beside a young rabbit's head at the SAME DEPTH, the bee about as long as the eye is
  wide. One page puts them nose to nose and perspective must not flip their sizes.
SCENE tokens: PollenBee, FieldBees. Never write "bee" alone.
```

---

## A-97 §4. 10컷

각 컷은 `STYLE ANCHOR + @image1(BunnyWet) + @image4(p3 승인본 = 필드 판 ref) + 아래 블록`.
p8·p9·p10 은 `@image2(BunnyPollen)`, p7·p9·p10 은 `@image3(Bee)` 를 더 붙인다.
🔴 **p3 을 가장 먼저** 굽는다(필드 판 ref). p10 은 반드시 p3 승인본을 ref 로(빈 원 ↔ 채워진 원이 같은 반경).

### p1 — 목욕하고 밭으로 뛰어들다

```
CAMERA: medium wide, child's eye level, bright late morning; rows run away as diagonals.
SUBJECT: BunnyWet mid-leap onto the earth track from lower LEFT, paws thrown forward, ears
  streaming back, mouth open, brows high, coat soaked into clumps, drops off the ear tips.
BEES: single dark marks high over the rows, far off, evenly spread. None near the rabbit.
FOAM: one opaque white lump between the paws - the brightest thing on the page.
POLLEN: none, including on the bees.
FINISH: 2 (rabbit + earth track). Ridge = one wall line and three cypress marks. The violet
  field at its fullest - the measure for every later page.
```

### p2 — 인사했더니 옆 꽃으로 가 버렸다

```
CAMERA: close-up, eye level; head and one paw fill the LEFT, two spikes stand centre-right.
SUBJECT: BunnyWet stretches its neck, nose at the near spike, mouth opening to say hello, eyes
  bright, ears forward, one paw on the stem. Sunny, still hopeful.
BEES: THE POINT, readable without words. The spike it greets is EMPTY; the one beside it has a
  bee just settling, wings open; between them one broken path of three dashes running away.
FOAM: on the paw against the stem, beside the empty spike - cause and effect in one corner.
POLLEN: none. The arriving bee carries no yellow.
FINISH: 2 (head and paw + near spike); second spike and settling bee get one printed pass.
```

### p3 — 내 둘레만 텅 비었다 🔴 심음 · 필드 판 ref

```
BAKE THIS PAGE FIRST OF ALL TEN - it defines the printed field for the book.
CAMERA: wide, HIGH ANGLE down onto the rows so the field reads as a pattern; flat noon light.
SUBJECT: centre, BunnyWet on the earth track, head turning one way then the other, one paw
  half-raised toward a flower and stopped there, one ear sideways. Small, low in frame, its own
  footprints scuffed about the track in a messy loop.
BEES: THE PLANT. Bees sit thickly over the whole frame as a dense even TEXTURE of single dark
  marks; around the rabbit a clean EMPTY CIRCLE one hand-span wide with not one bee in it,
  obvious across a room, broken paths pointing OUTWARD from its rim. No bee gets a face, legs
  or stripes - an interesting bee hides the hole.
FOAM: hidden under the body. Do not paint white anywhere else to compensate.
POLLEN: none.
FINISH: 2 (rabbit + track). Every spike the same 1 stem + 5-7 marks, varying only in press and
  angle with overlap tones where passes crossed; every bee 1 mark; extras 0.
```

### p4 — 붕붕은 저쪽에서만 난다

```
CAMERA: medium close-up, slightly LOW angle, even light. Rabbit alone LEFT, bees far off RIGHT,
  a wide quiet gap of lavender between.
SUBJECT: BunnyWet with shoulders dropped, both paws clasped at its belly, ears flat back, mouth
  corners down, brows pulled together with inner ends raised, looking across at the bees. The
  nose is ONE STEP DARKER in violet with two crease lines - not red, not pink. The lavender
  around it stands still; the row on the right is jostled and tipping.
BEES: ALL right, NONE left. A knot of dark marks with crossing broken paths over the far row and
  nothing at all in the air on the rabbit's side. The silence is drawn as EMPTY AIR.
FOAM: a sliver at the join of the clasped paws, never a bright lump.
POLLEN: none. The drifting specks are PALE LILAC DUST #B3A6D0 - the first yellow is on page 7.
FINISH: 2 (rabbit + the one still spike beside it).
```

### p5 — 숨을 참고 꼼짝 않기

```
CAMERA: medium, eye level, rabbit dead centre - the one symmetrical page, because stillness is
  the subject. Quiet high-noon light, low contrast.
SUBJECT: BunnyWet rigid as a stick, paws pressed flat to its sides, ears straight up, eyes
  squeezed shut, cheeks puffed with held breath, one hind toe barely lifted. One spike stands
  unmoving at its nose; a short stubby shadow underfoot.
BEES: two or three single dark marks along a FAR row only. The air at its nose is empty.
FOAM: clearly visible on the paw pressed to the flank - besides the face the only thing to look
  at, which is right, because it is the reason nothing comes.
POLLEN: none.
FINISH: 2 (rabbit + the spike at its nose). If anything looks like it is moving, this page failed.
```

### p6 — 꽃을 한 아름 안았는데도

```
CAMERA: medium, eye level, rabbit centred with clear air above its head for the bees.
SUBJECT: BunnyWet hugs a huge armful of cut lavender to its chest, face half buried in the stems,
  head tipped back, mouth open looking up; the grip slips and stems slide out and fall. The
  armful is the deepest, most saturated violet in the book - more spikes, pressed heavier, than
  anywhere else. Cut stems lie at its feet.
BEES: three or four dark marks crossing ABOVE its head in straight unbroken paths that do not
  slow and do not curve toward the flowers it is holding.
FOAM: on the paw clutching the stems - white against the darkest violet on any page.
POLLEN: none.
FINISH: 2 (rabbit + armful), fallen stems one pass. The armful is the ONLY place spikes may
  crowd. It must read as "this many flowers and still nothing came".
```

### p7 — 벌이 이유를 말한다 🔴 노랑 첫 등장 (@image3)

```
CAMERA: close-up, eye level. RABBIT'S FACE RIGHT, BEE LEFT, AT THE SAME DEPTH - same distance,
  light and sharpness. Use the scale plate: the bee is as long as the rabbit's eye is wide.
SUBJECT: BunnyWet's head fills the right corner, eyes wide, nose forward, one paw reaching as if
  to catch the bee without touching it, the armful sliding out of its other arm. Left, PollenBee
  hangs a hand's width from the nose, body angled away as if leaving but turned back a half turn.
  It SPEAKS BY TURNING - no raised leg, no pointing.
BEES: exactly ONE in frame; the rest out of frame or two faint marks at the edge.
FOAM: on the reaching paw, small and low. Do not let the white compete here.
POLLEN: FIRST APPEARANCE - two fat yellow baskets on the hind legs, three or four grains falling.
  It must not tint the lavender, the fur or the air, and there is no warm glow.
FINISH: 2 (head + PollenBee), the most worked page with p9; kinked path and stems one pass.
```

### p8 — 킁킁 · 데굴데굴 🔴 한 화면 두 시점 (@image2)

```
THE SAME RABBIT TWICE IN ONE PICTURE - left is a moment earlier than right, and reading left to
  right IS the change. No panel border, no frame line: one continuous field.
CAMERA: medium wide, eye level, the two on a diagonal - left smaller and further back.
SUBJECT LEFT: BunnyWet holds one paw against its nose and sniffs, one brow up and one down, head
  tilted, still. RIGHT: BunnyPollen flung on its back deep in a row, rolling, four legs kicked at
  the sky, mouth open laughing, one ear pressed into the earth, stems bent flat beneath it.
BEES: nothing near the left figure. Above the right, two dark marks have turned and drift closer
  - the first paths in the book that curve TOWARD the rabbit. They have not landed.
FOAM: THE HINGE. The LEFT figure carries the opaque white lump on the paw at its nose, large and
  unmistakable. The RIGHT figure has NO WHITE ANYWHERE - not a trace, not a highlight.
POLLEN: begins here, right half only - specks in the air and caught on back and ear edges.
FINISH: 2 (the two figures), crushed track and thrown florets one pass. Keep the left calm.
```

### p9 — 열 마리가 몰려든다 🔴 밀도 배급 (@image2, @image3)

```
THE ONE RATIONED PAGE - everything the previous eight saved is spent here.
CAMERA: medium close-up, slightly LOW angle looking up so the rabbit stands over us. Bright,
  loud, joyful - the warmest and busiest page in the book.
SUBJECT: BunnyPollen sprung upright, both paws flung wide, eyes round, mouth open, body frozen
  mid-astonishment, coat dry, fluffed and loaded with yellow. One bee on an ear tip, one on the
  nose, one on the tail, and the rabbit holding absolutely still; flattened lavender underfoot.
BEES: THE PAYOFF OF PAGE 3, AND THE ARROWS REVERSE. Ten or so converging from every side, each
  with a short broken path pointing INWARD; nothing points outward. Still dark marks with paper
  wings - density is HOW MANY and HOW CLOSE, never insect anatomy.
FOAM: none. No pure white anywhere.
POLLEN: everywhere on the rabbit and nowhere else - the coat is now the brightest, warmest thing
  in the book, the exact position the foam used to hold. None drifts into the field or air.
FINISH: 5 instead of 2 (rabbit + three landed bees + crushed lavender); converging bees 7 marks
  each; spikes past the crushed patch 1 stem + 5-7 marks; horizon 0.
```

### p10 — 소리가 내 몸에서 난다 🔴 회수 (@image2, @image3, + p3 승인본을 ref 로)

```
ATTACH THE APPROVED PAGE 3 RENDER. It drew an empty circle one hand-span wide around the rabbit;
  this page fills the SAME circle at the SAME RADIUS with bees.
CAMERA: medium wide, eye level, the rabbit walking LEFT TO RIGHT along the earth track, just left
  of centre with open track ahead. Low late-afternoon sun from the left.
SUBJECT: BunnyPollen walks carefully, one hind foot lifted mid-step, head turned to glance back
  over its shoulder, mouth corners up, coat loaded with yellow. PollenBee is settled on its RIGHT
  ear tip and it holds that one ear rigid while the rest of it moves.
BEES: THE RECOVERY. Six or seven form a loose ring travelling WITH the rabbit at that same
  hand-span radius, none leaving; behind it, its footprints and a trail of paths on the same line.
FOAM: none.
POLLEN: all over the coat, the low sun catching fur and wings so they read warm. THE ONLY WARMTH
  HERE IS POLLEN AND POLLEN-LIT WING - no orange sunset, no pink cloud, no gold haze.
FINISH: 2 (rabbit + the bee on its ear); ridge = one wall line and three cypress marks.
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
