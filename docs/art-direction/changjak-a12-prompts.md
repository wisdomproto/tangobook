# 창작동화 1000 — A-12 앵커 + 삽화 프롬프트

> art-director 산출물 (2026-07-31). 배정 근거 = `changjak-assign-08.md` §1 · §2(a12) · §4 · 규격 = `_ANCHOR-SPEC.md`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/a12.md`.** 아래 14컷은 그 SCENE 콘티를 그림 지시로 옮긴 번역본이다. 대본은 한 글자도 안 고쳤다.
> 🔴 **이미지 생성은 여기서 하지 않는다.** 사용자가 GPT 로 굽는다. 작가 실명은 한 글자도 안 들어간다.
> 🔴 **실행 순서**: ① `HatPair`(🔴 **이 권의 자(尺)** — 같은 모자의 「내려앉은 회색 / 들린 색」 두 상태) → ② `GullPost` → ③ `HatOtter` → ④ `ShopFront` → ⑤ **p9**(채도 0 인 쪽) → ⑥ **p11**(색이 통째로 돌아오는 쪽) → ⑦ 나머지 열두 컷. 🔴 **p9 와 p11 을 나란히 놓고 승인한다** — 한 장은 화면에 색이 한 점도 없어야 하고, 한 장은 오른쪽 절반이 색이어야 한다. 이 둘이 갈리지 않으면 열네 쪽이 다 「잿빛 바닷가」가 된다.

---

## A-12 §1. 앵커 배정

**권**: `a12` 「심술쟁이 바람의 사과」 (14쪽 · 4~6세 · 주제군 **A 마음·감정** · 엔진 **소원의 대가** · 무대 북해 바닷가 모자 가게 앞 자갈길 · 주인공 어린 갈매기 + 모자 가게 수달 아주머니)

**한 줄**: 🔴 **젖은 회색 단색조가 종이를 한 뼘도 안 남기고 덮고, 채도를 가진 것은 「지금 들려 있는 것」뿐이다 — 땅·선반·앞발에 닿는 순간 그 물건은 회색이 된다.** 앵커 슬러그 `changjak-liftcolor` — **신규 민팅**(배정표 지정, 변경 없음).

**이 권이 그림에 요구하는 것** 넷.

1. 🔴 **바람이 화면에 한 번도 안 나온다.** 대본 note 가 「바람은 몸이 없다 · 날리는 것들로만 보인다」로 못박았다 → **속도선·소용돌이·먼지 호(弧)를 한 획도 안 그린다.** 바람이 있다는 증거는 **채도 있는 물건의 개수** 하나뿐이다.
2. 🔴 **계기판이 「개수」다.** h08 은 한 물건의 채도가 내려가고, a12 는 **물건의 채도는 안 변하고 채도 있는 물건의 개수가 변한다.** 그래서 쪽마다 세어야 하고, **0 인 쪽이 넉 장**(p1·p6·p8·p9·p10·p13) 있어야 p7·p11 의 6 이 터진다.
3. 🔴 **p8·p9 배경의 그물 모자가 색을 가지면 이 책이 죽는다.** 대본이 「배경에 이미 다 있는데 갈매기는 문만 본다」를 심어 뒀고, 그 단서는 **p11 에서 처음 보여야** 한다 → 🔴 **둘째 법칙: 먼 면(가게 앞면보다 뒤)에는 채도가 없다.** 윤곽만 긋고 안은 안 채운다(흐림이 아니라 마감을 안 주는 것).
4. 🔴 **규칙에 예외가 하나도 없어야 한다.** 파란 문·놋종·문빛·앞치마 전부 같은 법을 따른다. 하나만 새면 계기판이 아니라 분위기가 된다.

**왜 이 공정인가.** 대본이 그림체를 이미 정해 놓았다 — 「색은 날아가는 것에만 있다」. 그러면 그림의 규칙은 하나로 압축된다: **채도 = 지금 들려 있음.** 이 하나로 세 가지가 글 없이 읽힌다. ①p7 에서 **색이 화면 밖으로 통째로 나간다** ②p9 는 날릴 것이 없어서 **색이 0** 이다 ③p14 에서 **마지막 남은 한 점**이 부리와 앞발 사이에 걸쳐 있다 — 아직 아무도 안 놓았기 때문이다.

**🔴 형제 권과 갈린 축** (배정표 §1 확정, 첫 렌더 판정 기준).

| 대상 | 갈림 |
|---|---|
| **h08** `changjak-glowglass` (같은 C6 · 단색 필드 + 소수 채도) | 🔴 **채도가 물건에서 빠지나, 채도 있는 물건의 개수가 변하나.** h08 = 유리 **한 개**의 채도가 한 단씩 내려가 0 이 된다(개수 불변) / a12 = 물건의 채도는 그대로이고 **개수가 0→1→6→0→6→1** 로 변한다 |
| **a02** `changjak-pawtrace` (같은 C6) | 🔴 **두께가 있나.** a02 = 앞발 세 겹만 실제로 두껍다(국소 임파스토) / a12 = **두께 0**, 색은 얇고 평평하게 얹힌다 |
| **c37** `changjak-tidepool` (바닷가 · 냉단색조 + 빨강 1점) | 채도가 **고정된 한 점**(늙은 불가사리)이냐 **옮겨 다니는 개수**냐. a12 의 채도는 한 자리에 머무는 법이 없다 |
| **d09 · g88** (같은 C6) | 눌러 찍은 홈(d09) / 검정 판 위 담색 한 겹(g88) / a12 = **얇은 회색 필드 + 얹은 채도** |

**🔴 라인 충돌 확인.**

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 갈매기·수달·털모자가 소재상 붙는다 → NOT 절에 `no wool` · `no stitching` · `no fibre edge` · `flat paper surface` 명시. 그리고 이 책의 물감은 **한 겹 두께 0** |
| 전래 **점눈이** | ✕ | ① 지지면 = **밝은 크림 종이가 아니라 젖은 회색 필드**(종이가 한 뼘도 안 드러난다) ② 매체 = 얇은 평칠(느슨한 색연필 낙서 아님) ③ **빨강 1점 규칙 ✕** — 여기 빨강은 **두 쪽에만** 나오고 점이 아니라 앞치마 줄무늬다 |

**🔴 대본 SCENE 처방 7건** — 대본은 고치지 않고 컷에서 분기한다.

| # | 대본 | 문제 | 그림 처방 |
|---|---|---|---|
| 1 | p1 「색은 진열대 모자에만 고여 있다」 | 선반 위 모자에 색이 들면 첫 쪽부터 법이 깨진다 | 🔴 **「고여 있다」를 마감으로 옮긴다** — 진열대 모자가 이 쪽에서 가장 마감된 것이지만 **채도는 0**. 색은 아직 아무도 안 들었다 |
| 2 | p3·p5·p8·p13 「노란 문빛」 | 다섯째 채도가 생긴다 | 🔴 문빛 = **따뜻한 회색 한 단 밝게**. 노랑·금색·번짐 금지. 값으로만 |
| 3 | 「파란 문」(전 쪽) · 놋종 | 문이 파랗고 종이 금색이면 모자의 파랑이 「그중 하나」가 된다 | 🔴 **문은 회색**(어두운 회색 판), 놋종은 **밝은 회색 한 단**. 문은 색이 아니라 **모양과 종**으로 읽힌다 |
| 4 | p8·p9 「작게, 초점 밖」 | 초점 밖 = 흐림 | 🔴 **먼 면 = 윤곽만 긋고 안은 비운다 · 채도 0.** 가장자리는 또렷하게 유지 |
| 5 | p7 「모자 예닐곱」 | 셀 수 없으면 계기판이 아니다 | 🔴 **정확히 6.** p11 그물에도 6, p12 에 1 이 빠지고, p13·p14 에 하나씩 줄어 4 로 끝난다 |
| 6 | p14 「앞치마의 빨강 줄무늬 한 자락」 | 앞치마가 색을 가지면 마지막 쪽 개수가 2 가 된다 | 🔴 **p14 는 구름이 걷혀 바람이 죽은 쪽**이다 → 앞치마는 가만히 늘어져 **회색**. 이 쪽의 채도는 **건네지는 파란 모자 하나뿐** |
| 7 | p10 「색이 거의 없다」 | 「거의」는 셀 수 없다 | 🔴 **정확히 0** |

**밀도 배급**: 🔴 **p7 · p11 두 쪽만** — 색 조각 여섯이 한 화면에 온다. 나머지 열두 쪽은 `FINISHED THINGS PER PAGE = 2`. 사건이 **모자 한 알**이라 배경을 채우면 진다.

**의인화 등급**(14쪽 고정): 갈매기 = 🔴 **옷 없는 새 그대로**, 두 발로 서고 날개는 날개다(손이 아니다) · 수달 = 두 발로 서고 **앞발이 손**, 걸친 것은 **빨강 줄무늬 앞치마와 머릿수건뿐**.

**🔴 매 컷 확인하는 세 줄** — `CHROMA:`(채도 있는 것이 몇 개이고 무엇인가) · `DOOR:`(문이 열렸나 · 문빛이 있나) · `NET:`(돌담 그물 상태 · 앞 면인가 먼 면인가).

| | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 | p13 | p14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **CHROMA** | **0** | 1 밀짚 | 1 앞치마 | 1 파랑 | 1 앞치마 | **0** | 🔴 **6** | **0** | 🔴 **0** | **0** | 🔴 **6** | 1 밀짚 | **0** | 🔴 **1 파랑** |
| **DOOR** | 닫힘 | 닫힘 | 열림·문빛 | 닫힘 | 열림·문빛 | 닫힘 | 닫힘 | 열림·문빛 | 🔴 **닫힘·문빛 없음** | 닫힘 | 닫힘 | (밖) | 반쯤 열림·문빛 | 열림 |
| **NET** | 빈 회색 | 빈 회색 | 빈 회색 | 빈 회색 | 빈 회색 | 빈 회색 | 크게 부푼다 | 🔴 **먼 면 · 윤곽만** | 🔴 **먼 면 · 윤곽만** | 화면 밖 | 🔴 **앞 면 · 6** | 5 + 부리에 1 | 먼 면 · 5 | 먼 면 · 4 |

---

## A-12 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-liftcolor   (a young gull and an otter hat-seller / a North Sea shore in
front of a hat shop)

Style: one wet grey monochrome laid thin and flat over the whole sheet, 4-6 year old picture book.
  Sea, wet cobbles, shop front, awning post, stone wall, net and BOTH ANIMALS are all that same
  grey family. The paint is one coat thick everywhere - 0 impasto, 0 ridges, 0 texture filter.

RENDERING (finish hierarchy): 🔴 THIS VOLUME: CHROMA MEANS LIFTED. A thing carries colour only
  while it is off the ground with the wind holding it up, or crossing between a beak and a paw.
  The moment it lands, sits on a shelf, or rests inside a paw it is the same grey as everything
  else. 🔴 SECOND LAW - THE FAR PLANE HAS NO COLOUR: anything behind the shop front is drawn as
  OUTLINE ONLY in field grey, 0 chroma, whatever it is doing. That is not blur - the edge stays
  crisp, the inside is left empty. 🔴 COUNT THE COLOURED THINGS AND MATCH THE CHROMA LINE
  OF THE CUT EXACTLY. Cobbles = at most 9 stones drawn, the rest one flat plane. Feathers = 5-7
  strokes on the whole bird, never one feather at a time. Net = a grid of at most 14 crossings,
  always grey. Bricks, planks, roof tiles, wood grain = 0 marks. FINISHED THINGS PER PAGE = 2.
  🔴 DENSITY RATION - p7 AND p11 ONLY: six coloured hats in one frame. Every other page keeps 2.

PALETTE: WET GREY #B4B0A8, the field · SEA GREY #6C737A · DARK #3E464C for the wet door, the post
  and deep shade · STRAW #E8B93C and HAT BLUE #2E6BA8, 🔴 the only two chromas in the book and only
  ever on a hat that is off the ground · APRON RED #B8453A, 🔴 on two pages only (p3 and p5) while
  the apron is flapping; on every other page the same stripes are drawn in grey. 🔴 THE SHOP DOOR
  IS GREY though the story calls it blue, the brass bell is a pale grey step, and the light out of
  the open door is A PALE WARM GREY STEP - never yellow, never gold, never a glow.

CHARACTER DESIGN LANGUAGE: both animals are the same grey as the shore, separated from it only by
  one value step. An eye is one small dark almond with no eyebrow; the acting is the WHOLE-BODY
  SILHOUETTE - how far the neck is stretched, whether the wings are open or clamped, how high the
  otter's chin is. FIXED GRADE, fourteen pages: 🔴 the gull is a plain bird, on two feet, wearing
  nothing, and its wings stay wings and never act as hands; the otter stands on two legs with her
  front paws used as hands and wears only a striped apron and a headscarf.

CANVAS: 16:9 double-page spread. One place - the cobbles in front of the hat shop, fixed by the
  ShopFront sheet, and the camera never leaves it. Bottom 18% quiet for a caption. 🔴 No lettering,
  numerals, prices or signboards anywhere, above all on the shop.

NOT: no digital slickness - airbrush, gradient, glow, bloom, 3D CG, cel-shading, photographic, or
  a texture filter / 🔴 the wind is never drawn - 0 speed lines, 0
  swirls, 0 motion streaks, 0 dust arcs; only the things it lifts show it / nothing blurred, hazy,
  spotlit or softened - the far plane is outline-only, not out of focus / one coat thick - no wool
  fibre, no felt fuzz, no stitching, no raised paint.
```

---

## A-12 §3. 캐릭터 시트 (🔴 HatPair 를 가장 먼저)

```
CHARACTER SHEET - HatPair   (bake FIRST, before anything else - this book is this one rule)

Two hats on a plain WET GREY #B4B0A8 field, no animals, no scenery. Every plate is the SAME two
hats; only whether they are held up changes.

🔴 PLATE 1 - THE LAW, side by side at one size:
  A · a round straw sun hat LYING ON A SHELF, drawn entirely in field grey with one darker grey
    line for the brim edge - 🔴 NO YELLOW ANYWHERE, not a tint, not a warm grey.
  B · the SAME straw hat OFF THE GROUND, tilted, the brim curling up on one side, filled flat in
    STRAW #E8B93C.
  C · a soft blue cap LYING IN A PAW, drawn entirely in field grey.
  D · the SAME blue cap OFF THE GROUND, tilted the other way, filled flat in HAT BLUE #2E6BA8.
  🔴 Cover the labels: anyone must be able to say which two are being held up by the wind.
🔴 PLATE 2 - THE SIX: six hats seen from a distance in flight, four straw and two blue, all at
  different tilts, each a flat shape with 0 interior detail and 0 shading. This is the p7 and p11
  group; keep the shapes plain enough to read at thumbnail size.
🔴 PLATE 3 - CAUGHT: one straw hat and one blue hat snagged in a grey net, the brims beating, drawn
  TWICE - once at arm's length in full chroma, once far away as OUTLINE ONLY in grey with the
  inside left empty and the edges still crisp.
Also: the same straw hat gripped by a beak at the brim, and the same blue hat lying across two open
paws. 0 lettering, 0 numerals. SCENE token: HatPair.
```

```
CHARACTER SHEET - GullPost   (bake SECOND, attach as @image2)

Same make as the book: thin flat grey paint on the grey field, one coat thick. Do not render this
bird with soft feather lighting just because there is no background behind it.

BODY: a young herring gull in WET GREY #B4B0A8 with DARK #3E464C wingtips, a rounded body, a
  straight beak, and 🔴 FEATHERS AS 5-7 STROKES ON THE WHOLE BIRD - never one feather at a time,
  never a texture. Two grey-pink feet with visible toes that grip. It wears nothing.
FACE: one small dark almond eye a side, no eyebrow, the beak opening as a plain wedge. 🔴 No blush,
  no catchlight, no glossy eye, no eyebrows drawn into the feathers.
🔴 THE POSTURE LADDER IS THE ACTING - six at one size in a row: NECK DOWN (on the post, neck
  stretched straight down, beak just open) · 🔴 WINGS FULL SPREAD (chest thrown forward, both wings
  at their widest, toes clamped on the post top - THIS EXACT POSE IS REUSED UNCHANGED ON p2, p4 AND
  p9; bake it once and copy it) · CLAMPED (body flattened to the post, both wings shut, every
  feather laid one way, beak open in a laugh) · SUNK (sitting on the cobbles, belly down, neck
  folded, beak tip touching a stone) · HEAD SNAPPED ROUND (sitting, the neck bent hard sideways so
  it kinks, eyes wide, beak open) · BITING (standing, neck down, a hat brim gripped in the beak,
  wings half open for balance).
🔴 THE BEAK IS THE HAND: bake two close-ups - the beak closed on a brim and pulling, and the beak
  open a finger above an offered hat, just letting go.
Plain field, no scenery. 0 lettering, 0 numerals. SCENE token: GullPost.
```

```
CHARACTER SHEET - HatOtter   (bake THIRD, attach as @image3)

Same make and same edges as GullPost - attach the approved GullPost sheet so the two are made by
one hand and the size between them is settled. Plain WET GREY field.

BUILD: a middle-aged otter, upright on two legs, a long heavy body and a thick tapering tail that
  reaches the ground, small round ears, whiskers as at most 6 strokes. 🔴 AT THUMBNAIL SIZE SHE IS
  A WIDE ROUNDED UPRIGHT AND THE GULL IS A SMALL POINTED ONE; she is roughly four times his height
  and perspective must never flip that. Front paws are hands with four short digits.
CLOTHES: a striped apron with a neck loop and a headscarf, nothing else - no dress, no shoes, no
  jewellery. 🔴 THE STRIPES ARE DRAWN ON EVERY PAGE BUT CARRY APRON RED #B8453A ONLY WHEN THE
  APRON IS FLAPPING (p3, p5); otherwise the same stripes are grey.
FACE: one small dark almond eye a side, no eyebrow, a short mouth line, a dark nose pad. Her range
  is small: 🔴 for most of the book she is busy and pleased, once she is looking down at an empty
  shelf, and once her eyes go round.
🔴 THE POSTURE LADDER - five at one size: BURSTING OUT (one foot out of the doorway, a hat clutched
  to the chest with both paws, chin up) · ARMS WIDE (both arms thrown open round a hat, one foot
  forward) · 🔴 HAND ON THE EMPTY SHELF (standing square, one paw flat on a bare shelf, head down,
  eyes on the empty rail - the chin never lifts) · HOLDING THE DOOR (one paw on the door edge, only
  the head out, eyes round) · BOTH PALMS OUT (standing, both front paws held out flat and level
  side by side, empty).
Plain field, no scenery. 0 lettering, 0 numerals. SCENE token: HatOtter.
```

```
CHARACTER SHEET - ShopFront   (bake FOURTH, attach as @image4 - the stage, fixed for 14 pages)

The place, with no animals in it, in the book's make: thin flat grey, one coat, 0 texture.

FROM THE FRONT, EYE LEVEL: a small stone hat shop on a cobbled shore. Left of centre a THREE-TIER
  wooden display stand, its shelves plain boards. Centre a plank door in DARK #3E464C - 🔴 GREY,
  never blue - with a small brass bell above it drawn as a pale grey step. Right of the door a
  wooden awning post about twice the otter's height, its top flat enough for a bird to stand on. To
  the right a low stone wall, and stretched along it A GREY FISHING NET, 🔴 A GRID OF AT MOST 14
  CROSSINGS AND NOTHING ELSE. Behind, one flat band of SEA GREY #6C737A sea with 0 waves drawn, and
  above it a plain sky of field grey.
🔴 FOUR THINGS THAT NEVER MOVE: the stand, the door, the post, the net. Every page is a view of
  this one frontage - bake a second small plate showing it from the right, so the net comes to the
  front plane and the stand goes behind (this is the p11 camera).
Also: the door OPEN, with the light out of it as ONE PALE WARM GREY SHAPE on the cobbles, hard
  edged - not a beam, not a glow, not yellow.
Cobbles = at most 9 stones drawn, the rest one flat plane. 0 lettering, 0 numerals, 0 signboards,
0 prices, 0 shop name. SCENE token: ShopFront.
```

---

## A-12 §4. 14컷

각 컷 = `STYLE ANCHOR + @image1(HatPair) + @image2(GullPost) + @image3(HatOtter) + @image4(ShopFront) + 아래 블록`.
🔴 **p9 → p11 순으로 먼저** 굽는다. p2·p4 는 p9 승인본의 날개 자세를 그대로 복사하고, p14 는 p11 승인본을 함께 붙인다.

### p1 — 오늘도 잔뜩이네 🔴 무대 고정 · 법을 심음

```
CAMERA: wide, slightly low eye level. The stand and the shop front fill the left and centre, the
  awning post with the gull at the upper right, one flat grey band of sea behind. 🔴 This page
  fixes the place for all fourteen spreads.
SUBJECT: GullPost stands on the post top on both feet in NECK DOWN, the neck stretched straight
  down at the stand, beak just open, eyes round. No otter; the shop is shut.
CHROMA: 🔴 0. Six hats sit on the three shelves - four straw, two blue - and every one of them is
  drawn in field grey. 🔴 THE RULE OF THE BOOK IS SET HERE: they are the most finished things in
  the frame and they still carry no colour, because nothing has lifted them yet.
DOOR: shut. The brass bell hangs still as a pale grey step, 0 glow.
NET: on the low wall at the right, empty, grey, at most 14 crossings. Nobody is looking at it.
FINISH: 2 (the gull + the stand of hats). Sea = one flat plane, 0 waves. Cobbles = at most 9
  stones. 0 lettering, 0 numerals, no shop sign.
```

### p2 — 휘잉, 밀짚모자 하나

```
CAMERA: medium, eye level, from the side of the post - a few paces closer than p1.
SUBJECT: GullPost in 🔴 WINGS FULL SPREAD, chest thrown forward, both wings at their widest, toes
  clamped on the post top, beak open, eyes following the hat up to the LEFT. 🔴 Copy this pose
  exactly from the sheet; it returns unchanged on p4 and p9.
CHROMA: 🔴 1. One straw hat, tilted, rising off the top shelf towards the upper left, flat STRAW
  #E8B93C. 🔴 The five hats still on the shelves are grey, and so is everything else in the frame.
DOOR: shut, bell still, no light.
NET: empty and grey at the right edge.
FINISH: 2 (the spread wings + the rising hat). 🔴 The wind is not drawn: 0 speed lines, 0 swirls, 0
  dust; the tilt of the hat and the laid feathers are the only evidence. 0 lettering, 0 numerals.
```

### p3 — 딸랑! 또 너구나

```
CAMERA: wide, eye level, centred on the doorway. The gull small at the upper right, the otter
  large at the centre bottom.
SUBJECT: HatOtter in BURSTING OUT - one foot out of the open doorway, the straw hat clutched to her
  chest with both front paws, chin up, eyes on the post. Upper right, GullPost in NECK DOWN looking
  back down at her.
CHROMA: 🔴 1, and it has moved. 🔴 THE HAT IN HER PAWS IS NOW GREY - it has landed. The one
  coloured thing in the frame is her APRON, its stripes filled APRON RED #B8453A because the hem is
  flying out sideways behind her.
DOOR: open. The light out of it is ONE PALE WARM GREY SHAPE with a hard edge, lying across the
  cobbles between the two faces. 🔴 Not yellow, not a beam, not a glow. The bell swings.
NET: empty and grey on the wall at the right.
FINISH: 2 (the otter with the hat + the flying apron hem). 0 lettering, 0 numerals, no signboard.
```

### p4 — 이번엔 파란 거

```
CAMERA: medium, slightly LOW angle looking up at the post - the door small and shut at the lower
  left, the gull high at the upper right.
SUBJECT: GullPost in 🔴 WINGS FULL SPREAD again, identical to p2 except that the body leans further
  towards the stand, neck pushed forward.
CHROMA: 🔴 1. A blue cap lifting off the SECOND shelf, brim first, tilted, flat HAT BLUE #2E6BA8.
  🔴 Everything else, including the four hats left on the shelves and the whole shop, is grey.
DOOR: shut, just closed. The bell has stopped. No light on the cobbles.
NET: empty and grey at the right edge.
FINISH: 2 (the spread wings + the lifting cap). Shadows are one pale flat shape each, 0 gradient.
  0 speed lines, 0 swirls. 0 lettering, 0 numerals.
```

### p5 — 두 번째 딸랑

```
CAMERA: medium wide, eye level, the same distance and framing as p3 🔴 so this reads as the second
  time - repeat the composition deliberately.
SUBJECT: HatOtter in ARMS WIDE at the centre, both arms thrown open around the blue cap held to her
  chest, one foot stepping forward, face turned up. Upper right, GullPost half folding his wings
  and looking down.
CHROMA: 🔴 1. 🔴 THE BLUE CAP IN HER ARMS IS GREY. The one coloured thing is her APRON again, the
  hem lifted and the stripes filled APRON RED #B8453A.
DOOR: open, the bell swinging, the same pale warm grey shape of light on the cobbles as p3.
NET: empty and grey on the wall.
FINISH: 2 (the otter + the flying apron hem). One overturned brim on the cobbles at her feet, grey.
  0 lettering, 0 numerals.
```

### p6 — 바람아, 모자 다 가져가

```
CAMERA: medium, side on, eye level. The gull at the right on the post, the sea filling the left of
  the frame, the stand low at the lower left.
SUBJECT: GullPost turned fully towards the sea, neck and beak pushed out level and straight,
  🔴 BOTH WINGS SHUT AGAINST THE BODY, only the toes braced up on the post top.
CHROMA: 🔴 0. Four hats are left on the stand at the lower left and all four are grey. 🔴 This is
  the last quiet page before the wind; nothing in the frame carries colour.
DOOR: shut, bell still, no light.
NET: empty and grey on the wall behind him.
FINISH: 2 (the outstretched neck + the hats left on the stand). One low bank of cloud over the
  horizon as a flat SEA GREY shape with a hard edge, dropping the whole sea side one value step
  darker than the shop side. 0 rays, 0 gradient. 0 lettering, 0 numerals.
```

### p7 — 다 간다! 🔴 밀도 배급 · 색이 화면 밖으로 나간다

```
CAMERA: wide, eye level. The emptying stand at the left, the gull clamped to the post at the right,
  the hats crossing the whole frame diagonally to the upper right.
SUBJECT: GullPost in CLAMPED - body flattened along the post, both wings shut, every feather laid
  one way, beak open in a laugh, toes gripping.
CHROMA: 🔴 6 - THE DENSITY RATION PAGE. Exactly six hats in the air at once, four STRAW #E8B93C and
  two HAT BLUE #2E6BA8, at six different tilts, each a flat shape with 0 interior detail, spread
  along one diagonal and leaving the frame at the upper right. 🔴 The stand below them is bare and
  grey. Nothing else in the book will ever be this loud.
DOOR: shut. Bell still.
NET: 🔴 on the wall at the right the grey net BELLIES OUT hard, its crossings stretched into
  diamonds - still completely grey, and no hat has reached it yet.
FINISH: 2 by rule + the six hats, which are one group and count as one thing. 🔴 The wind itself is
  not drawn: 0 speed lines, 0 swirls, 0 streaks. 0 lettering, 0 numerals.
```

### p8 — 아주머니는 위를 안 봐요 🔴 단서를 배경에 심는다

```
CAMERA: medium wide, eye level. The otter at the centre with the bare stand, the gull small at the
  upper right, the stone wall running back into the right distance.
SUBJECT: HatOtter in 🔴 HAND ON THE EMPTY SHELF - standing square in front of the stand, one front
  paw flat on the bare top shelf, head down, eyes on the empty board. 🔴 HER CHIN NEVER LIFTS.
  Upper right, GullPost stretches his neck down with his beak open, calling at her.
CHROMA: 🔴 0. 🔴 THE HARDEST PAGE IN THE BOOK: the net behind is already full of hats and not one
  of them carries colour.
DOOR: open, the pale warm grey light lying on the otter alone; the post and the bird stay in plain
  field grey.
NET: 🔴 FAR PLANE - small, back at the right behind the shop front, its snagged hats DRAWN AS
  OUTLINE ONLY in field grey with the insides left empty, edges crisp. 🔴 This is not blur and not
  a soft focus: it is a shape that has not been finished. 0 chroma, 0 fill.
FINISH: 2 (the otter's paw on the empty shelf + the three bare shelves). 0 lettering, 0 numerals.
```

### p9 — 문은 그대로예요 🔴 채도 0 인 쪽 · 먼저 굽는다

```
CAMERA: medium, eye level, from the side of the post - 🔴 the same framing as p2, so the third
  attempt reads as a repeat.
SUBJECT: GullPost in 🔴 WINGS FULL SPREAD, identical to p2 and p4 in every line, 🔴 with only one
  thing changed: the eyes are locked on the shut door instead of following anything up.
CHROMA: 🔴 0 - NOT ONE COLOURED THING ANYWHERE IN THIS FRAME. 🔴 THIS IS THE PAGE THE WHOLE BOOK IS
  BUILT AROUND. Check it against p2 and p4: same pose, same place, and the colour is gone because
  there is nothing left to lift.
DOOR: 🔴 SHUT, and 🔴 THERE IS NO LIGHT ON THE COBBLES - the pale warm grey shape that fell there on
  p3, p5 and p8 is absent. The bell hangs dead still.
NET: 🔴 FAR PLANE again, exactly as p8 - the snagged hats OUTLINE ONLY, grey, insides empty, edges
  crisp. Same size, same place as p8.
FINISH: 2 (the spread wings + the shut door). The bare stand behind, grey. 0 speed lines, 0 swirls.
  0 lettering, 0 numerals.
```

### p10 — 문 열어 줄 모자가 없잖아

```
CAMERA: low-angle close-up from cobble height - the lowest camera in the book. The gull at the
  lower left, the bottom of the shut door and its sill filling the right.
SUBJECT: GullPost in SUNK - belly on the wet cobbles, neck folded down, the beak tip touching a
  stone, both wings shut against the body, eyes half closed.
CHROMA: 🔴 0, and this is 🔴 the emptiest page - no hats in frame at all, on any plane.
DOOR: shut, seen only from the sill to knee height. No light.
NET: not in frame.
FINISH: 2 (the gull's head + the doorsill). At most 9 wet cobbles are drawn and the rest of the
  ground is one flat plane, one value step darker than the wall. Sun behind cloud: 🔴 the whole
  frame drops one step, with 0 gradient and 0 vignette. 0 lettering, 0 numerals.
```

### p11 — 저기 다 있잖아! 🔴 밀도 배급 · 색이 통째로 돌아온다 · 먼저 굽는다

```
CAMERA: wide, eye level, 🔴 TURNED TO THE RIGHT so the stone wall and its net swing into the FRONT
  PLANE and fill the right half of the frame; the shop goes small at the left. Use the second plate
  of the ShopFront sheet.
SUBJECT: GullPost at the lower left in HEAD SNAPPED ROUND - still sitting on the cobbles, the neck
  bent hard to the right so it kinks, both eyes wide, beak open.
CHROMA: 🔴 6 - THE DENSITY RATION PAGE, and the counterpart of p9. Six hats snagged in the net,
  four STRAW #E8B93C and two HAT BLUE #2E6BA8, brims beating, filled flat. 🔴 They are the same six
  hats and the same colours as p7; nothing else in the frame carries any chroma.
DOOR: shut and small at the left. No light.
NET: 🔴 FRONT PLANE, big, its grey crossings fully drawn (at most 14) with the hats caught between
  them. 🔴 The net itself stays grey - if the net takes colour, p8 and p9 stop working.
FINISH: 2 by rule + the netful, which is one group and counts as one thing. Behind the wall, one
  flat band of sea. 0 lettering, 0 numerals.
```

### p12 — 부리로 꽉

```
CAMERA: medium close-up over the shoulder, on the low stone wall. The netting fills the frame, the
  gull's head and shoulders coming in from the left.
SUBJECT: GullPost in BITING - standing on the wall on both feet, neck down, the straw hat's brim
  gripped in the closed beak and pulled upward, wings half open for balance. 🔴 The net follows the
  hat: three or four crossings near the beak stretch into long diamonds.
CHROMA: 🔴 1. The bitten straw hat, flat STRAW #E8B93C, at the centre of the frame - 🔴 it is off
  the net and therefore coloured. The blue cap hanging beside it is 🔴 STILL IN THE NET AND STILL
  GREY, because nothing has lifted it yet.
DOOR: not in frame.
NET: front plane, coarse grey mesh filling the frame; 5 hats left in it besides the one in the
  beak, all of them grey.
FINISH: 2 (the beak on the brim + the stretched crossings). 0 lettering, 0 numerals.
```

### p13 — 진열대 한가운데에 톡

```
CAMERA: medium wide, eye level. The gull on the stand at the left, the otter in the half-open
  doorway at the right.
SUBJECT: GullPost stands on the SECOND shelf on both feet, beak open a finger above the hat he has
  just set down. Right, HatOtter in HOLDING THE DOOR - one paw on the door edge, only her head out,
  both eyes wide and round.
CHROMA: 🔴 0. 🔴 THE STRAW HAT HAS LANDED IN THE MIDDLE OF THE BARE SHELF AND IS THEREFORE GREY -
  the same hat that was yellow one page ago. Keep it the most finished thing in the frame and give
  it no colour. This is what makes p14 the last colour in the book.
DOOR: half open, the bell swinging, the pale warm grey light back on the cobbles and touching the
  hat on the shelf. 🔴 A grey step, never yellow.
NET: far plane at the right, 5 hats left, 🔴 outline only, grey, insides empty.
FINISH: 2 (the hat alone on the empty shelf + the otter's face in the door gap). 0 lettering,
  0 numerals, no signboard.
```

### p14 — 안녕하세요 🔴 마지막 한 점

```
CAMERA: close-up at the height where the two meet, eye level. 🔴 BOTH FACES ARE CROPPED BY THE TOP
  EDGE of the frame and the hat is dead centre.
SUBJECT: HatOtter in BOTH PALMS OUT - her two front paws held flat and level, side by side, coming
  in from the left. GullPost's head and beak come down from above, 🔴 THE BLUE CAP STILL TOUCHING
  BOTH THE BEAK AND THE PAWS AT ONCE, resting across the gap.
CHROMA: 🔴 EXACTLY 1 - the blue cap, flat HAT BLUE #2E6BA8. It is the only coloured thing in the
  frame and 🔴 IT IS COLOURED BECAUSE NOBODY HAS PUT IT DOWN YET. 🔴 Her apron corner is in frame at
  the lower left and it is GREY: the cloud has cleared, the wind has dropped and the hem hangs
  straight. Do not put red on this page.
DOOR: open behind her, no light shape needed - a low evening light instead, one flat pale step
  lying along the top of the cap's brim only, hard edged, 0 glow.
NET: far plane, 4 hats left, outline only, grey.
FINISH: 2 (the cap + the two open paws). Behind them the bottom shelf is filled again with hats and
  🔴 every one of them is grey. Wet cobbles below, at most 9 stones. 0 lettering, 0 numerals.
```
