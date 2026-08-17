# 룰루네 올리브 언덕 — 앵커 + 캐스트 시트

> 창작동화 **시리즈 10** (25권 · 250쪽). 설계 SSOT = `docs/changjak-books/lulu/_design.md` ·
> 대본 = `docs/changjak-books/lulu/*.md` · SCENE = `_scenes.json`(250쪽 완성)
> 🔴 **이미지 생성은 여기서 하지 않는다.** 프롬프트까지가 이 문서의 일이다.
> 🔴 **한 시리즈 = 한 그림체.** 이 시리즈는 **모노타이프 전권**이고, 보류 문안이 없는
> **신규 민팅**이다. 슬러그 = `lulu-monotype`.
> (설계서 §4 가 적어 둔 `lulu-monohill` 을 이 슬러그로 대체한다.)

---

## §0. 설계 — 왜 모노타이프인가

**이 시리즈만 인물이 많다.** 다른 아홉은 둘·셋·다섯인데 여기는 대가족이다 — 룰루 + 사촌 넷 +
어른 넷이 한 식탁, 한 그물, 한 축제 광장에 모인다. 세필로 그리면 인물이 자꾸 늘어나고,
늘어나면 「대가족」이 아니라 **군중**이 된다.

🔴 **모노타이프는 세부를 못 그리는 대신 덩어리를 한 번에 앉힌다.** 롤러로 잉크를 민 판을
헝겊으로 닦아 형태를 만들고, 딱 **한 장만** 찍는다. 언덕 능선도, 축제의 원도, 식탁 위 흰 보도
붓질 여럿이 아니라 **넓은 자국 하나**로 앉는다.

SCENE 250쪽이 이미 이 매체를 전제로 쓰여 있다 — 01권 p1 이 「뒤로 언덕 능선이 **넓은 자국 하나로**」다.
콘티 작가가 무대를 그렇게 본 것이고, 앵커가 그 말을 그대로 받는다.

### 🔴 「닦아 낸 자리가 빛」 — 이 라인의 골격을 반대 방향으로 지킨다

앞의 아홉은 전부 **칠하지 않은 종이가 빛**이었다. 모노타이프도 결과는 같은데 방법이 반대다 —
칠할 자리를 남기는 게 아니라 **판에서 잉크를 닦아 낸다.** 닦은 자리는 아무것도 안 찍히므로
종이가 그대로 나온다. 지중해의 볕, 마른 흙길, 잔칫상의 흰 보가 전부 그 자리다.
🔴 **그래서 흰 잉크가 이 앵커에서도 금지다.** 흰 것은 언제나 「안 찍힌 것」이다.

### 🔴 겹침색은 판 위에서 만든다 — 한 판, 한 장을 안 깬다

이 라인의 골격은 「두 색 + 겹쳐서 셋째 색」인데, 모노타이프는 판을 두 번 찍으면
「한 판에서 한 장」이라는 이 매체의 정체가 사라진다. 그래서 겹침을 **종이가 아니라 판 위에서** 만든다 —
두 잉크를 같은 판에 나란히 밀어 놓으면 **맞닿은 자리에서 섞여** 가장 어두운 색이 생기고,
그게 그대로 한 번에 찍힌다. 파란 악센트도 같은 방식으로 판에 작은 헝겊으로 얹어
**같은 한 번의 통과에서** 찍는다.

### 🔴 부드러운 가장자리를 어디까지 허용하나

이 라인의 `NOT:` 은 아홉 시리즈 내내 「무른 가장자리 금지」였다. 모노타이프는 정반대 성질을 가졌으니
그냥 풀면 화면이 통째로 뭉개진다. 그래서 **가장자리를 두 종류로 가른다.**

```
화면 안의 가장자리   닦아 낸 선 — 헝겊·손가락이 만든 자리라 또렷하다. 여기는 무르면 안 된다
화면 밖의 가장자리   판 자국(plate mark) — 인쇄가 판에서 끝나며 마지막 몇 밀리가 흐려진다. 여기만 무르다
```

🔴 **이 책에서 유일하게 무른 곳은 판이 끝나는 자리다.** 그리고 그 자국은 매 쪽에 남긴다 —
그것이 「이건 한 번 찍은 것」이라고 말하는 유일한 표시다.

### 🔴 팔레트를 05(브루노네 숲)와 벌려 놓았다

설계서는 「올리브 잎의 초록회 + 마른 흙 갈색 + 파랑」인데, **05 가 가문비 초록 + 나무껍질 갈색 + 코발트**다.
그대로 두면 두 시리즈가 「초록+갈색+파랑」으로 겹친다 — 04(도도네)가 **바로 이 이유로** 들판 초록을
개울 청록·밀빛으로 옮긴 선례가 있다.

여기서는 색을 안 바꾸고 **자리를 벌린다.**

```
05 브루노   오트회색 종이 · 짙고 찬 가문비 #4F6B4E · 찬 나무껍질 #96674A · 깊은 코발트 #1C4E8A
10 룰루     따뜻한 흰 종이 · 밝고 마른 은빛 올리브 #8C9478 · 붉은 테라코타 흙 #BC6E42 · 밝은 도자기빛 파랑
```

숲의 초록은 어둡고 젖어 있고, 언덕의 초록은 **볕에 마른 은빛**이다. 매체도 반대다 —
크레용은 종이 결에 걸려 끊기고(덮임 80%), 모노타이프는 넓게 한 번에 앉는다.
🔴 그래도 **열 시리즈 중 가장 가까운 한 쌍**이다. 마지막 응답에 그 판정을 적어 둔다.

---

## §1. 앵커 — `lulu-monotype`

```
STYLE ANCHOR - lulu-monotype   (a donkey family on an Italian olive hill / monotype, one plate, one
                                print, and the light is wiped out of it)

Style: monotype on warm white paper, exactly TWO inks plus one small accent, 4-6 year old picture
  book. 🔴 THE INK IS ROLLED ONTO A PLATE, THE FORM IS WIPED OUT OF IT WITH A RAG AND A FINGER, AND
  THE PLATE IS PRINTED ONCE. Light is made by TAKING INK AWAY, so every bright thing is bare paper
  that the plate never touched - the Mediterranean sun, the dry road, the tablecloth, the wall.
  Ink never lies perfectly even: it prints a little mottled, carries the roller's direction and shows
  the pressure of the press. Where the two inks meet ON THE PLATE they mix into a third, darker
  colour - that is the only dark, and it prints in the same single pass. SHADING IS ZERO - an area is
  inked or it is wiped, never graded between. 🔴 NO WHITE INK, EVER.

RENDERING (finish hierarchy): an area is ONE broad inked field, flat inside itself apart from the
  mottle; a wiped shape inside it has a CLEAN HARD EDGE because a rag made it. 🔴 THE ONLY SOFT EDGE
  IN THIS BOOK IS THE PLATE MARK, where the print runs out at the border of the plate - leave it on
  every page. FINISHED THINGS PER PAGE = 2, Lulu and the one thing Lulu touches; everything else is a
  wiped shape with no interior detail. Repeats are capped and the cap is the whole design: a heap of
  olives is ONE mass and at most 12 olives are ever drawn as separate berries · plates at most 8 ·
  flowers at most 8 · loaves or bread pieces at most 8 · sacks at most 5 · bottles at most 4 · the
  armful of old things at most 6 objects · ribbons at most 5 on one cousin · figs at most 5 · grape
  bunches at most 7 · vine posts at most 5 · olive trees at most 5 · jars at most 6 of one shape ·
  planks at most 6 · a festival crowd is ONE wiped mass with at most 7 flat silhouettes at its near
  edge, 0 faces and 0 hands · stars at most 14 wiped points, each taken out on its own. Nothing in a
  repeat is a mirrored copy of its neighbour. DENSITY RATION = none.
  🔴 DEPTH IS SPACING, NEVER DARKNESS - trees further down the hill stand CLOSER TOGETHER at the same
  weight of ink. Nothing recedes by getting paler, bluer or softer.
  🔴 THE CHILDREN ARE ALWAYS EXACTLY FIVE: LULU, THREE WALKING COUSINS AND ONE BABY. Never a fourth
  walking cousin, never a second baby, never an extra child to fill a corner. THE THREE COUSINS MOVE
  AS ONE BLOCK - they touch or overlap and share one silhouette, and the baby is always lying down or
  being carried, never on its feet.

PALETTE: PAPER WARM WHITE #F7F2E6, sun, the dry road, the tablecloth, whitewash, light, everything
  wiped clean off the plate · INK1 OLIVE LEAF #8C9478, leaves, the hillside, vine leaves, shutters,
  aprons, painted things - a dusty dried silver-green, the cool one · INK2 DRY EARTH #BC6E42, soil,
  timber, sacks, baskets, roof tiles, the press stone, the cart, donkey chests and bellies - a warm
  terracotta, the warm one · PLATE MIX OLIVE BLACK #3E3A2E, ripe olives, donkey backs and heads, the
  inside of the barn, night sky, the grape stain - made where the two inks meet on the plate, never a
  third tube · ACCENT MAJOLICA BLUE #1F7FA8, 🔴 dabbed onto the plate last with a small rag so it
  prints in the same pass, touching NOTHING but Lulu's bell cord and its bell. No sky blue that is not
  the accent, no purple anywhere, no pink, no red, no yellow, no white ink.

STAGE CLAUSES (the stage changes what the two inks do, never which two they are):
  GROVE - the hillside is ONE broad field of OLIVE LEAF, 0 individual leaves. Trunks and the ground
    beneath are DRY EARTH with the roller running ALONG the trunk, not across it. Ripe olives are
    PLATE MIX. 🔴 THE SPREAD NET IS BARE PAPER, one clean wiped shape, and it is the brightest thing
    on the page - the olives that fall onto it are the darkest, so the whole book's contrast lives on
    that net.
  YARD AND BARN - each surface is ONE repeated mark: floor a plank stroke, wall a short dash, sacking
    a zigzag. The mark is the SAME shape every time and may run off an edge but is never redrawn.
    Beams, the cart, sacks and the well are DRY EARTH; shutters, aprons and the vine canopy are OLIVE
    LEAF. 🔴 THE OPEN DOORWAY AND THE SQUARE OF SUN ON THE BARN FLOOR ARE BARE PAPER, wiped clean with
    a hard edge and no rays. A thing being looked for is wiped with its own clear silhouette while
    everything it hides among is the repeated mark.
  KITCHEN AND LONG TABLE - the tablecloth is ONE wiped shape of bare paper and it is the brightest
    thing indoors; plates, bowls and jugs are wiped OUT of the DRY EARTH table, never drawn onto it.
    Steam from a pot is bare paper, at most 5 curls. When the table is crowded the crowding is made by
    the number of wiped shapes, never by adding a colour.
  HILL ROAD - the road is ONE wiped strip of bare paper running through the OLIVE LEAF hillside, and
    it stays bare however far it goes. Far farmhouses are at most 4 DRY EARTH silhouettes with 0
    windows.
  PIAZZA (volumes 09, 17, 23, 25) - the dancing ring is ONE wiped mass of PLATE MIX with the ground
    bare paper inside and around it; only the 7 nearest figures have their own silhouette. Cloth
    banners are single flat pulls of either ink. 🔴 The ribbons in volume 17 are OLIVE LEAF and DRY
    EARTH only - a made thing never takes the accent.
  🔴 PRESS AND VAT (volumes 18, 24) - the first oil running from the press is BARE PAPER, one clean
    wiped line, and it carries the whole page. 🔴 THE GRAPE JUICE IS NOT PURPLE. It is the darkest
    print of DRY EARTH - a deep saturated stain of the same warm ink - and "purple feet" and "purple
    bottom" are made by HOW DARK THE STAIN IS, never by a new colour. The blue in volume 24 is on the
    bell and nowhere else.
  🔴 NIGHT (volume 14) - the sky is PLATE MIX laid as one flat field. The stars and the one shooting
    star are BARE PAPER wiped out of it, each taken on its own, at most 14, with no trail longer than
    a finger and no glow.
  🔴 RAIN (volume 13) - the storm cloud is ONE flat mass of PLATE MIX entering from one side, with a
    hard wiped edge against the bare sky. Raindrops are at most 11 short DRY EARTH strokes all leaning
    the same way. Nothing gets paler as the sky darkens.

CHARACTER DESIGN LANGUAGE: the donkeys are built from the same broad fields as the world - two or
  three shapes with limbs laid over. GRADE: bipedal, standing upright, wearing simple farm cloth -
  aprons, hats, waistcoats, skirts and sleeves - 🔴 AND BAREFOOT ALWAYS. NOBODY IN THIS WORLD WEARS
  SHOES, so hooved feet are visible on every page and the grape treading in volume 24 works without
  explanation. The forelimb is an ARM in a sleeve ending in a rounded blunt hand; it grasps, carries
  and points as one shape, and when it must count or pinch it grows AT MOST THREE stubby fingers,
  never five. Backs and heads are PLATE MIX, chests and bellies are DRY EARTH - 🔴 THAT IS THE ONLY
  THING THE DONKEYS SHARE. The two inks sit in the same places on all of them; THEIR OUTLINES NEVER
  REPEAT. Each one has a DIFFERENT WIDEST POINT on the body and is found in a shared mass by a
  DIFFERENT PART sticking out of it.
  🔴 A CHILD IS NOT AN ADULT AT A SMALLER SIZE. On a child the HEAD IS THE WIDEST PART OF THE BODY and
  the EARS ARE LONGER THAN THE HEAD IS HIGH; on an adult neither is ever true - an adult's widest point
  is on the torso (shoulders, chest, belly or hem) and the ears are shorter than the head. This holds
  for the three cousins and the baby as well.
  🔴 WHO IS TOUCHING WHOM IS THE SENTENCE OF THE PAGE. Bodies are pressed together so that two, three
  or five of them share ONE outer silhouette, and a donkey inside that mass is read only by what
  sticks out of it - an ear, an elbow, a hoof, a skirt hem. At least two bodies overlap on every
  page, and the figure left alone inside its own outline is the one the page is about.
  Eyes are LIFTED, not laid on: the ink is wiped off the plate with a rag end, so each eye is a pale
  scoop in the dark head with a soft rag edge; a dark muzzle; the mouth is ONE curve; above each eye
  ONE short wiped stroke. 🔴 THE PLATE PRINTS ONCE - no two faces in this book come out identical, the
  scoops sit a little differently on every page and that drift is left in, never corrected. Feeling
  is in the mouth curve, the two brow strokes and the two long ears.
  THE CAST, separable at thumbnail size: LULU a young donkey, the smallest standing figure,
  round-headed, two long ears, a BLUE CORD WITH ONE BLUE BELL at the throat and nothing else blue in
  the world · MAMA a donkey, a full-grown adult two thirds taller than Lulu, a BIB APRON, no blue ·
  NINO a donkey, THE TALLEST AND THE NARROWEST, chest thrown forward and head tipped back, a STRAW HAT
  (volume 01 leaves it up a tree and it stays there to the last page), no blue · ROSA a donkey, the
  roundest and SHORTEST adult, a SKIRT to the hooves and a WAIST APRON WITH A DEEP POCKET, always in
  motion with the skirt swinging behind her, no blue · BEPPO a donkey, the heaviest and TWICE ANYONE
  ELSE'S WIDTH though not the tallest, a WAISTCOAT and a CROOKED STICK, no blue · THE THREE
  COUSINS one single regulation drawn three times - same build, same cloth, told apart only by a small
  step in height - always touching or overlapping so they read as ONE shape, no blue · THE BABY COUSIN
  the smallest of all, always lying, carried or on somebody's back, never standing, no blue.
  🔴 NO ADULT AND NO COUSIN EVER CARRIES BLUE. In a family this size the accent is the only thing that
  finds the child the page is about.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - festival banners,
  market stalls and jars stay blank or carry a single wiped shape.

NOT: no airbrush, gradient, glow or 3D render / no white ink or white paint - white is wiped / no
  drawn outline / no second printing pass.
```

**관통 줄** (매 쪽)

```
WIPE:   the light is wiped off the plate - white is bare paper, never ink
ONCE:   one plate, one pull - leave the plate mark, and let the ink print unevenly
BELL:   the only blue in the world is Lulu's cord and bell
FIVE:   three walking cousins moving as one block, and one baby who never stands
```

🔴 **`FIVE:` 는 인원 제한이 아니라 대가족을 그리는 법이다.** 설계서가 사촌 수를 못박은 자리가
본문 셈과 맞물려 있다 — **21권**은 그물 귀퉁이 넷을 룰루와 사촌 셋이 하나씩 잡고,
**16권**은 숨은 사촌이 정확히 셋이다(아기는 안 논다). 사촌이 한 명만 늘거나 줄어도 그 두 권이 깨진다.
🔴 그리고 「한 덩어리로 움직인다」가 없으면 모델이 사촌 셋에게 각자 표정과 소품을 붙이고,
그 순간 **캐스트가 아홉이 된다.**

🔴 **`BELL:` 은 24권에서 가장 세게 지켜야 한다.** 포도를 밟는 권이라 모델이 보라를 자동으로 불러들인다.
그 권의 컷 프롬프트에는 `PRESS AND VAT` 조항의 즙 문장을 **쪽마다** 실어 보낸다 —
「보라 금지」만 적으면 붉은보라가 오고, **「흙갈색 잉크의 가장 짙은 자국」**이라고 적어야 그 색이 안 온다.

---

## §2. 캐스트 시트

한 장에 여덟을 다 그린다 — 어른 넷 · 룰루 · 사촌 셋 묶음 · 아기. 🔴 **시트가 최종 그림을 지배**하므로
시트를 먼저 확정하고 쪽 삽화로 간다. 이 시리즈는 인물이 가장 많아서 시트 없이 굽는 위험도 가장 크다.

```
CHARACTER SHEET - lulu olive hill   (the whole family, one sheet)

[여기에 §1 의 Style / PALETTE / CHARACTER DESIGN LANGUAGE 세 문단을 그대로 붙인다]

SHEET LAYOUT: one warm white sheet, the family standing in a row on a single ground line at their true
  relative heights - taking Lulu as 1.00, Rosa 1.55, Mama 1.65, Beppo 1.85, Nino 1.95: Nino the
  tallest and narrowest, Beppo the heaviest and twice anyone's width but a head shorter than Nino,
  Mama a plain upright column, Rosa the shortest adult and the widest at the hem, Lulu the smallest
  standing figure. 🔴 No two of the five make the same outline. Each of these five is drawn THREE
  times: front standing, three-quarter walking, and back. 🔴 EVERY FOOT ON THIS SHEET IS BARE - there
  is not one shoe or boot anywhere.
🔴 THE THREE COUSINS ARE DRAWN AS ONE GROUP, NOT AS THREE CHARACTERS: one front view and one back view
  of the three of them standing together, touching, with a small step in height between them and
  identical cloth. If they can be told apart by anything except that height step, the sheet is wrong.
🔴 THE BABY COUSIN is drawn twice and never standing: once lying on its back with all four limbs up,
  once carried on a cousin's back.
🔴 ONE EXTRA DRAWING: Lulu standing beside the cousin group, touching, so the child scale is fixed as
  a single shape before any page puts five children in one frame.
  Nothing else on the sheet - no props except Nino's straw hat, Rosa's apron pocket, Beppo's stick and
  Lulu's blue cord; no scenery, no ground beyond the one line.
🔴 No lettering, numerals, labels or name tags anywhere on the sheet.
```

🔴 **사촌을 셋이 아니라 「하나」로 굽는 것이 이 시트의 핵심이다.** 각각 따로 그리면 화가에게
캐릭터 셋이 생기고, 250쪽 중 사촌이 나오는 쪽마다 셋의 개성을 유지해야 한다 —
설계서가 「사촌들은 언제나 사촌들 한 규격」으로 못박은 것을 시트가 배신하는 셈이다.

🔴 시트가 나오면 기획서 §2 카드에 붙여넣는다(R2 `comic-assets/lulu-plan`, 키 = 캐릭터 key).
회차 페이지의 「🎬 이 화 등장」 스트립이 그 이미지를 읽어 온다.

🔴 **`lulu-core.js` 의 STYLE 도 이 앵커와 같이 고친다.**
