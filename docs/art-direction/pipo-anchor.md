# 피포네 돌담 목장 — 앵커 + 캐스트 시트

> 창작동화 **시리즈 08** (50권 · 500쪽 — 25권에서 늘었다). 설계 SSOT = `docs/changjak-books/pipo/_design.md` ·
> 대본 = `docs/changjak-books/pipo/*.md` · SCENE = `_scenes.json`(500쪽 완성)
> 🔴 **이미지 생성은 여기서 하지 않는다.** 프롬프트까지가 이 문서의 일이다.
> 🔴 **한 시리즈 = 한 그림체.** 이 시리즈는 **숯 전권** — `mei-anchor.md` §3 보류분
> `mei-charcoalsquare` 를 가져와 캐스트·무대를 갈아 끼운 것이다. 슬러그 = `pipo-charcoalwall`.
> (설계서 §4 가 임시로 적어 둔 `pipo-stonewall` 을 이 슬러그로 대체한다 — 매체가 슬러그에 있어야
> 보류 문안을 어디서 꺼냈는지가 이름만 보고 읽힌다.)

---

## §0. 설계 — 왜 숯인가, 그리고 왜 흙색을 뺐는가

**이 목장에서 사건은 늘 바깥에서 온다.** 안개(04) · 비(06·24) · 눈(12) · 바람(17) · 해 뜨는 하늘(22) ·
어둑한 저녁길(10). 설계서가 「어른이 가게로 찾아오는 게 아니라 언덕·돌담·길에서 마주친다」로 못박아
둔 그 구조가 **날씨를 전권의 공동 주연**으로 만든다.

🔴 **숯은 그 여섯을 자루 하나로 낸다.** 문지르면 안개고, 눌러 그으면 돌담의 켜고, 지우개로 빼내면 빛이다.
다른 매체는 안개를 그리려면 옅은 색을 하나 더 들여와야 하는데, 숯은 **같은 자국의 세기만 바꿔서** 낸다.

### 🔴 mei 문안이 갖고 있던 흙색(ROOF)을 뺐다

`mei-charcoalsquare` 는 숯 + **지붕 흙색 한 도** + 주황 악센트였다. 08 에서는 그 흙색을 지운다.

설계서가 「숯 + **한 색**」이라 적었고, 그 한 색이 노랑이기 때문이다. 흙색을 남기면 지붕·흙·건초·나무·
바구니·수레가 전부 그 색이 되고 — 목장은 그것들로 이루어져 있다 — **노랑이 화면의 「둘째 색」으로 내려앉는다.**
50권 내내 아이를 찾는 방법이 색 하나뿐인 시리즈에서 그건 치명적이다.

대신 **숯 자체가 세 값을 갖는다.** 이 라인의 골격(두 색 + 겹침이 셋째 색)이 여기서는 물감이 아니라
**손의 세기**로 구현된다 — 이 시리즈가 열 개 중 **둘째 색이 아예 없는 유일한 앵커**다.

```
문지른 면    RUBBED   — 세상. 언덕·하늘·마당·젖은 흙
눌러 그은 것 PRESSED  — 이 화면의 유일한 어둠. 돌담의 켜, 개의 등, 헛간 안, 밤
빼낸 자리    LIFTED   — 빛. 그린 것이 아니라 지우개로 도로 가져간 맨 종이
```

### 🔴 이 앵커의 급소는 노랑이다 (`_series-rules.md` §5-b 가 이 시리즈에서 나왔다)

목장의 기본 소품이 **전부 노란 것**이다 — 건초(06·12·25) · 양털(07·21) · 노른자(14) · 버터(09) ·
해(22) · 눈(12) · 안개(04). 특히 **건초는 어느 권에서든 나오고 화면을 통째로 덮는다.**
하나라도 칠하면 목도리가 화면에서 사라진다.

그래서 관통 줄의 `YELLOW:` 는 **빼도 되는 줄이 아니다.** 건초·양털이 크게 나오는 쪽마다 반복한다
(p1 에만 적으면 안 따라간다). SCENE 500쪽이 이미 쪽마다 「건초는 칠하지 않은 종이」를 달고 있으니
**컷 프롬프트가 그 줄을 지우지만 않으면 된다.**

예외는 **10권 수레 등불 하나**뿐이고, 그것도 **불빛만** 노랑이다 — 등불의 몸체는 눌러 그은 숯이다.

### 🔴 무채라서 색 단서를 못 쓴다 — 그래서 결(grain)로 찾는다

05권은 「뾰족 지붕 가게를 찾는다」이고 23권은 장터다. 글자가 금지인데 **색도 없으므로**
「빨간 차양 가게」 같은 단서가 원리상 불가능하다. SCENE 이 이미 답을 써 뒀다(05 p8) —
**다른 지붕이 가로 결일 때 그 하나만 촘촘한 사선 결**이다. 앵커의 `MARKET` 조항이 이걸 규칙으로 든다.
숯에서만 되는 일이라, 무채가 제약이 아니라 그 권의 장치가 된다.

### 🔴 거위 아줌마는 손이 없다 — 설계서 한 줄을 고쳐야 한다

설계서 캐스트 표는 「전 캐스트 이족 보행 + 손」인데, **SCENE 500쪽은 거위 아줌마에게 날개만
쥐여 준다**(가리키고·파닥이고·벌린다). 손을 쓴 자리는 한 곳도 없다. 04 도도네의 오리와 같은 규격이다.
🔴 **§5-b 는 이 어긋남 자체를 「그림 단계를 막는 것」으로 꼽는다** — 앵커는 SCENE 을 따르고,
설계서 그 줄에 **「거위 아줌마만 날개」**를 덧붙일 것.

---

## §1. 앵커 — `pipo-charcoalwall`

```
STYLE ANCHOR - pipo-charcoalwall   (a puppy on an Irish stone-wall farm / charcoal, rubbed, pressed
                                    and lifted - and one yellow)

Style: charcoal on pale cream toothy paper, and ONE yellow, 4-6 year old picture book. 🔴 THERE IS NO
  SECOND COLOUR IN THIS BOOK. Charcoal is laid and rubbed flat with a finger, so every area is an even
  grain with the paper's tooth speckling through. The three values are made by the hand, not by
  pigment: RUBBED is the world, PRESSED is the only dark, and LIGHT IS MADE BY LIFTING - a kneaded
  eraser takes the charcoal back off and the bare paper underneath is the brightest thing on the page.
  NOTHING IS EVER DRAWN WHITE. SHADING IS ZERO in the modelling sense - an area is rubbed, pressed or
  lifted, never graded between.

RENDERING (finish hierarchy): an area is ONE rubbed field, even everywhere, never denser or lighter
  inside itself. A thing standing on that field is PRESSED with one continuous line. Every charcoal
  edge is slightly furry EXCEPT the outline of Pipo, which is one clean pressed line - that is how the
  eye finds him before it finds the yellow. FINISHED THINGS PER PAGE = 2, Pipo and the one thing he
  touches; everything else is a shape with no interior detail. Repeats are capped and the cap is the
  whole design: sheep at most 9 separate animals and a flock further off is ONE rubbed mass with 0
  outlines inside it · loose stones at most 11 · hay heaps at most 7 and loose hay strands at most 11
  · eggs at most 8 · washing at most 6 with at most 6 pegs · milk cans at most 4 · market stalls at
  most 5 and roofs at most 8 · potatoes on one stem at most 9 · goslings exactly 4 · planks at most 6
  · windows at most 6 lifted rectangles with 0 frames · footprints at most 11 · a market crowd at most
  7 flat pressed silhouettes with 0 faces and 0 hands · stars at most 14 lifted points, each taken out
  on its own. Nothing in a repeat is a mirrored copy of its neighbour. DENSITY RATION = none.
  🔴 DEPTH IS SPACING, NEVER DARKNESS. Sheep further up the hill stand CLOSER TOGETHER at the same
  weight of charcoal. Nothing recedes by getting paler or softer.
  🔴 "BLURRED", "HAZY" OR "FAINT" IN A SCENE MEANS AN UNMODELLED SHAPE - the same charcoal weight
  with 0 interior marks, outline only. Never paler, never softer, never out of focus. The only
  depth cue in this book is spacing.
  🔴 SHADOWS: a shadow is ANOTHER PRESSED SHAPE with a furry edge and 0 marks inside it - never a
  grey wash, never graded, and never laid across a body or a face. It appears only where the script
  puts one, in two kinds: a LONG shadow lying on the ground when the sun is low, whose LENGTH is
  what says the hour, and a FLAT shape thrown on a wall, which is a plain silhouette a reader must
  be able to name (a pointed post, a round ball, a sheep's ears, a puppy's hanging ears). 🔴 NO
  LIGHT SOURCE IS EVER DRAWN with a shadow - no lamp beam, no ray, no lit pool. Nothing else in
  fifty books casts a shadow.

PALETTE: PAPER PALE CREAM #EFE9DC, sky, mist, snow, fleece, hay, the sun, light, everything lifted or
  never touched · CHARCOAL RUBBED #6B665C, hillside, ground, wet earth, weather, the whole field of
  the world · CHARCOAL PRESSED #2C2A25, the stone wall, animal backs and heads, iron, the inside of
  the byre, night - this is the only dark and it is made by pressure, never by a second pigment ·
  ACCENT GORSE YELLOW #F0B429, 🔴 laid last, touching NOTHING but Pipo's scarf. 🔴 EVERY LANTERN,
  LAMP AND FIRE IN THIS BOOK IS PRESSED CHARCOAL WITH ITS LIGHT LIFTED AND CARRIES NO YELLOW; the
  single exception in fifty books is a far lantern being searched for across the dark (the cart
  lantern, volume 10), where the body is still pressed charcoal and only its glow is yellow.
  🔴 HAY, FLEECE, MIST, SNOW, THE SUN, YOLK AND BUTTER ARE ALL UNPAINTED PAPER. No white chalk, no
  white paint, no earth colour, no roof colour, no second pigment of any kind, ever.

STAGE CLAUSES (the stage changes what the charcoal does, never how many colours there are):
  WALL - the stone wall runs through this whole series and it is the one thing always PRESSED: each
    course of stones is a separate pressed shape with a furry edge, and the wall keeps its full weight
    however far away it is. Where the wall is the thing being followed by hand, it is the only
    pressed thing on the page and everything else is rubbed.
  SLOPE - the hillside is ONE rubbed field running downhill, 0 individual blades. Fences, gates and
    the byre are PRESSED. Far ridges are at most 4 pressed outlines with 0 texture inside.
  YARD AND BYRE - each surface is ONE repeated mark: floor a plank stroke, wall a short dash, thatch a
    zigzag. The mark is the SAME shape every time and may run off an edge but is never redrawn. 🔴 THE
    OPEN DOORWAY AND THE WINDOW LIGHT ARE LIFTED PAPER and are the brightest thing on the page. A
    thing being looked for is drawn with its own pressed outline while everything it hides among is
    the repeated mark - that is how the eye finds it.
  🔴 MIST (any page the script calls fog or mist) - everything but the nearest thing and the wall is RUBBED at its lightest, with
    0 shapes behind it. Things enter the page by appearing at FULL weight, never by fading, and there
    is no pale version of the charcoal.
  🔴 SNOW AND ICE (any page whose ground is snow, ice or frost) - the hill and the yard are not rubbed at all, BARE PAPER from edge to edge, and
    the charcoal draws ONLY what stands on it. A mound gets at most 3 pressed strokes along its lower
    lip and nothing else. 🔴 SNOW AND HAY ARE BOTH BARE PAPER AND ARE TOLD APART BY GRAIN ALONE - hay
    is thin separate strands, snow is one unbroken smooth face.
  BROOK (any page at the brook, its stepping stones or the low causeway) - the water is ONE rubbed field running across the page, 0 ripples, 0 glints.
    A thing in the water is PRESSED lying inside that field, hard edge, never distorted. 🔴 NOTHING IS
    EVER MIRRORED IN THE WATER - there are no reflections in this book. Stones and the low causeway
    are PRESSED with the marks running ALONG the thing, not across it.
  🔴 MARKET (any page in the market, or with the market roofs in frame) - roofs and awnings are one rubbed field each; the crowd is at most 7
    flat pressed silhouettes. 🔴 THE SHOP BEING LOOKED FOR IS FOUND BY ITS ROOF SHAPE AND BY THE
    DIRECTION OF ITS RUBBING - when every other roof is rubbed sideways, that one is rubbed in tight
    diagonals. It is NEVER found by a colour and NEVER by a sign, because this world has neither.
  🔴 EVENING, NIGHT AND DAWN (any page after dark or at first light) - the sky is one rubbed field at
    its heaviest. 🔴 EVERY LANTERN, LAMP AND FIRE IN THIS BOOK IS PRESSED CHARCOAL WITH ITS LIGHT
    LIFTED - a hole of bare paper, no glow, no halo, no ray, no lit pool - AND CARRIES NO YELLOW.
    The ONE exception in fifty books is a far lantern being searched for across the dark (the cart
    lantern, volume 10): that one glow is yellow, so that it can answer the scarf across the page,
    and it is still one clean shape with no rays and no halo. The sun, whenever it is in frame, is
    LIFTED PAPER, a plain disc with no rays, made round by the dark ridge around it.
  MUD (any page after rain, or with standing water on the ground) - the puddle is ONE rubbed field with a hard lifted rim. Splashes are LIFTED, at
    most 9 marks, each taken out on its own, never drawn.

CHARACTER DESIGN LANGUAGE: the animals are built from the same marks as the world - two or three
  shapes with limbs laid over, 🔴 BUT THE FIVE ARE NOT THE SAME SHAPES AT DIFFERENT SIZES: each one
  has its own build and its own way of folding, set out per figure below and in the per-character
  spec. GRADE: bipedal, standing upright ON TWO LEGS ONLY - no character ever drops onto four,
  in silhouette or from behind or far off, 🔴 AND NOBODY IN THIS WORLD WEARS CLOTHES. There are no sleeves, no cuffs, no trousers, no boots. The only worn things in 250 pages
  are Pipo's YELLOW SCARF, Mom's wide-brimmed hat (a prop set on the head, not a garment) and, on any
  page where the script puts a boot in the story, ONE old boot on Sheep Grandpa's one foot with the
  other foot bare (this happens on three pages of one book and nowhere else). Backs and heads are PRESSED,
  chests and bellies are RUBBED.
  🔴 WITH NO CLOTHES ON ANYBODY, THE ONLY THINGS THAT SAY WHO A FIGURE IS ARE HOW ITS BODY IS FOLDED,
  WHAT ITS HANDS HOLD AND WHERE ITS FEET ARE PUT - and 🔴 THE FOLD COMES FIRST, because props change
  hands (volume 23) and end up on the ground (13, 25) while a body keeps its own stance. Each figure
  bends in ONE named way and in no other: Pipo drops into a crouch with both hands up in front of his
  chest · Mom folds at the waist with her arms hanging and her legs straight · Sheep Grandpa leans
  back belly-first and steps out ahead · Goose Auntie plants her feet and sends only her neck · Horse
  Uncle throws his weight forward past a lifting front foot.
  On every page each figure is holding, carrying, dragging or has just set
  down ONE nameable thing, and each figure's feet are placed on ONE nameable thing - the top of the
  wall, wet mud, the doorstep, the lip of the barrow, a bale, another animal's back. 🔴 NOBODY IS
  EVER DRAWN WITH EMPTY HANDS AND FEET LEFT UNPLACED, not even in the background.
  An eye is a RUBBED DARK SMUDGE WITH NO EDGE ANYWHERE - you cannot say where it stops; the same for
  the nose. 🔴 THE MOUTH IS THE ONE HARD MARK ON A FACE, pressed with the stick's end, and above each
  eye ONE short pressed stroke; feeling is carried by those two alone.
  🔴 THE FIVE, separable at thumbnail size WITH EVERY PROP TAKEN AWAY: PIPO a puppy, three heads
  tall, head a third of him, no neck, ONE BARREL of a body with NO WAIST, short thick limbs, short
  ears set high, a blunt short muzzle, a stub tail, a YELLOW SCARF, and hands that dig, press, roll
  and carry on every page · MOM a dog and 🔴 NOT A BIGGER PIPO - six heads tall, small head on a
  NECK, a NARROW BODY WITH A WAIST, long thin limbs, LONG EARS HANGING PAST THE JAW, a long narrow
  muzzle, a long thin hanging tail; her wide soft-brimmed hat is a prop and NOT what tells her from
  Pipo, no yellow · SHEEP GRANDPA a sheep, ONE WOOLLY OVAL with a small head straight on top and NO
  NECK, short legs out of the bottom, the roundest and the shortest of the three neighbours - and 🔴
  unlike the flock, who go on four legs with blank faces, he stands on two; a CROOKED STICK in one
  hand, hands, no yellow · GOOSE AUNTIE a goose, 🔴 WINGS AND NO HANDS - she points, fans and flaps
  with a wing edge and anything she holds is pinched under a wing edge; A NECK AS LONG AS HER BODY,
  the smallest body of the three neighbours, the tallest silhouette by the neck alone, no yellow ·
  HORSE UNCLE a horse, THE WIDEST SHOULDERS IN THE BOOK over a heavy slab of a chest, a long straight
  muzzle and a mane, blunt hooves for feet, hands - 🔴 and never a four-legged horse body, rump or
  long horse tail, in any view, no yellow. 🔴 THE THREE NEIGHBOURS NEVER CARRY YELLOW and are never drawn standing over Pipo.
  THE ANIMALS - sheep, lambs, goslings, the farm cat - are plain shapes with no eyebrows and no
  expression, except a lamb wearing the bell. 🔴 THEIR SIZES ARE A FIXED LADDER: a grown sheep comes
  to PIPO'S SHOULDER, and a LAMB IS THE SIZE PIPO CAN CARRY IN BOTH ARMS AGAINST HIS CHEST - three
  books turn on exactly that hold, and a lamb drawn at grown-sheep size makes those pages impossible.
  It must also fit on Mom's lap while she sits.
  A gosling is a quarter of Goose Auntie's body; the farm cat is knee-high on Pipo.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - market stalls, sacks
  and shop fronts stay blank or carry a single scratched shape.

NOT: no airbrush, gradient or 3D render / 🔴 no halo, ray, beam, lens flare or lit pool on the ground
  around any light - a light in this medium is a shape, and shapes do not spread / no white chalk or
  white paint / no second pigment of
  any kind - hay, fleece, mist, snow, the sun, yolk and butter are bare paper, and nothing is ever
  coloured to make it easy to find / no garments on anybody - no sleeves, cuffs, trousers, coats or
  pairs of boots (the scarf, the wide hat and the ONE odd boot named above are the whole wardrobe of
  fifty books).
```

**관통 줄** (매 쪽)

```
RUB:    the rubbed field is the world and the lifted paper is the light - nothing is ever drawn white
YELLOW: the accent touches nothing but Pipo's scarf - every lantern, lamp and fire is pressed
        charcoal with its light LIFTED and carries no yellow, the one exception in fifty books
        being the far cart lantern searched for across the dark in volume 10
        - hay, fleece, fog, snow, sun, yolk and butter are all unpainted paper
BARE:   nobody wears clothes - the only worn things are Pipo's scarf, Mom's wide hat, and one old
        boot on Sheep Grandpa's one foot on the three pages the script asks for it
WING:   Goose Auntie has wings and no hands - she points and holds with a wing edge
```

🔴 **`YELLOW:` 와 `BARE:` 는 2026-09-04 에 실측으로 고쳤다.** 옛 문안은 둘 다 거짓이었다 —
`YELLOW:` 는 등불이 10권 하나뿐인 것처럼 적혀 있었으나 **등불이 나오는 쪽은 12쪽·5권**이고,
33·39·43·44 는 쪽에 **「노랑은 쓰지 않는다」가 박혀 있다**(10권만 반대). 조항이 그 넷을 안 덮으면
화가가 앵커를 따라 노랑을 칠하고 목도리 신호가 죽는다. `BARE:` 는 앵커 본문이 이미 장화 예외를
갖고 있는데 관통 줄에서 빠져 있어 **08 p6·p7·p10 에서 글자 그대로 거짓**이었다.
`RUB:` `WING:` 은 참이다 — 거위 아줌마가 손을 쓰는 쪽 **0/500** 으로 셌다.

🔴 **`YELLOW:` 는 이 앵커에서 가장 비싼 줄이다.** 다른 시리즈의 악센트 조항은 「그 색을 다른 데 쓰지 마라」
한 문장이면 됐지만, 여기는 **무대의 기본 소품 일곱이 그 색**이라 목록을 통째로 들고 다녀야 한다.
건초·양털이 크게 나오는 쪽마다 반복한다 — 06·07·12·21·25 는 화면의 절반 이상이 그 목록이다.

🔴 **`BARE:` 는 옷을 안 입히는 규칙이 아니라 그림을 못 그리게 되는 걸 막는 규칙이다.** 모델은 「이족보행
동물」을 받으면 소매와 바지를 자동으로 그린다. 여기서 옷이 한 번 새면 **23권의 「큰 모자를 씌운다」가
「모자를 쓴 개」와 구분이 안 되고**, 08권의 장화 한 짝이 그 권의 웃음을 잃는다.

---

## §2. 캐스트 시트

한 장에 다섯을 다 그린다. 🔴 **시트가 최종 그림을 지배**하므로 시트를 먼저 확정하고 쪽 삽화로 간다.

```
CHARACTER SHEET - pipo farm   (five characters, one sheet)

[여기에 §1 의 Style / PALETTE / CHARACTER DESIGN LANGUAGE 세 문단을 그대로 붙인다]

SHEET LAYOUT: one pale cream sheet, five animals standing in a row on a single ground line, all at
  their true relative heights - Horse Uncle the biggest and widest, Goose Auntie the tallest by her
  neck alone, Sheep Grandpa the roundest, Mom a full head over Pipo, Pipo the smallest. Each
  character is drawn THREE times: front standing, three-quarter walking, and back. 🔴 In every one of
  the fifteen drawings NOBODY IS WEARING CLOTHES - the only worn things on this sheet are Pipo's
  yellow scarf and Mom's wide-brimmed hat.
🔴 ONE EXTRA ROW AT THE FOOT OF THE SHEET: EXACTLY FIVE FLAT PRESSED SILHOUETTES, the same five
  characters in the same order as the row above, with 0 interior marks and 🔴 WITHOUT THEIR PROPS -
  no scarf, no stick, no hat, no cart. 🔴 EACH SILHOUETTE STANDS ON TWO LEGS; a four-legged animal
  shape in this row means the row is wrong. If the five cannot be told apart by build and stance
  alone - Pipo crouching, Mom folded at the waist, the egg, the neck, the wide leaning shoulders -
  the sheet is wrong.
  Nothing else on the sheet - no props beyond the two named, no scenery, no ground beyond the one line.
🔴 No lettering, numerals, labels or name tags anywhere on the sheet.
```

🔴 **소품 없는 실루엣 줄을 넣은 이유는 23권이다.** 그 권에서 지팡이·모자·수레가 서로에게 넘어가고
마지막 쪽에서는 셋이 그걸 주고받으며 뒤엉킨다 — **소품으로 인물을 가르고 있었다면 그 쪽에서 셋이 한
덩어리가 된다.** 250쪽을 굽기 전에 그걸 알아야 한다.

🔴 시트가 나오면 기획서 §2 카드에 붙여넣는다(R2 `comic-assets/pipo-plan`, 키 = 캐릭터 key).
회차 페이지의 「🎬 이 화 등장」 스트립이 그 이미지를 읽어 온다.

🔴 **`pipo-core.js` 의 STYLE 도 이 앵커와 같이 고친다.**
