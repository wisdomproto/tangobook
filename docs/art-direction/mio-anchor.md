# 미오네 유치원 — 앵커 + 캐스트 시트

> 창작동화 **시리즈 07** (25권 · 250쪽). 설계 SSOT = `docs/changjak-books/mio/_design.md` ·
> 대본 = `docs/changjak-books/mio/*.md`
> 🔴 **이미지 생성은 여기서 하지 않는다.** 프롬프트까지가 이 문서의 일이다.
> 🔴 **한 시리즈 = 한 그림체.** 이 시리즈는 **리노컷 전권** — `pongi-anchor.md` §5 보류분
> `pongi-cutvillage` 를 가져와 캐스트·무대를 갈아 끼운 것이다. 슬러그 = `mio-cutschool`.
> (설계서 §5 가 임시로 적어 둔 `mio-linocut` 을 이 슬러그로 대체한다.)

---

## §0. 설계 — 왜 리노컷인가

**이 시리즈에서 아이들이 하는 일이 전부 「자르고 접는 것」이다.** 종이 눈송이(11) · 종이 사슬(19) ·
종이비행기(09) · 종이배(25) · 찰흙 그릇(07) · 블록 탑(01). 25권 중 만들기가 6권이고
나머지도 대개 손으로 뭔가를 하는 이야기다. 🔴 **리노컷은 그 자체가 잘라서 만드는 그림**이다 —
흰 선은 그린 것이 아니라 **파낸 자리**고, 화면에 남은 검은 덩어리는 칼이 안 지나간 자리다.
책이 만들어진 방식과 책 속 아이들이 하는 일이 같다.

두 번째 이유는 **다섯 아이 + 어른 하나가 한 화면에 자주 모인다**는 것이다(교실·마당·행진).
리노컷은 세부를 못 그린다 — 그래서 다섯을 **덩어리와 실루엣**으로 갈라야 하고, 그게
「썸네일에서 갈리는 캐스트」라는 이 라인의 요구와 정확히 같은 요구다.

세 번째는 **대발이형의 p8** 이다. 매 권 한 번, 바우 선생님이 판을 정리하는 쪽이 온다.
리노컷의 큰 검은 덩어리는 어른에게 무게를 준다 — 색연필·크레용으로는 안 나오는 무게다.

### 🔴 먹빛을 잉크1 로 쓰지 않았다

설계서 §5 는 「먹빛 + 강물 회청 + 보라」를 적었다. 그런데 잉크1 을 진짜 검정으로 두면
**겹침색이 사라진다** — 검정 위에 회청을 겹쳐도 검정이라, 이 라인의 골격(두 색 + 겹쳐서 생기는
셋째 색)이 한 시리즈에서만 무너진다. 그래서 잉크1 을 **SOOT #3B3A33**(거의 검정인 그을음색)로
한 칸 물리고, 회청과 겹친 자리가 **진짜 먹빛 #232B2E** 이 되게 했다. 화면에서 먹빛이 사라지는
게 아니라 **가장 어두운 자리에만 생긴다** — 오히려 설계서가 말한 먹빛이 제 자리를 얻는다.

### 🔴 안전과 보라 — 설계서 §6 을 앵커 조항으로 옮겼다

설계서가 SCENE 단계로 넘긴 메모 둘은 **그림 규칙**이라 앵커에 있어야 한다.
쪽별 프롬프트는 SCENE 에서 파생되는데, 조항이 SCENE 메모에만 있으면 **그 다섯 권에서만** 지켜진다.

- **어른이 화면 안에 있어야 하는 쪽** — 물·높이·닫히는 문이 있으면 바우 선생님이 프레임 안에.
  아이만 있는 그림 자체가 모방 신호다.
- **보라는 아이가 지닌 것 하나뿐** — 색종이 고리(19)·종이 눈송이(11)에 보라 금지.

---

## §1. 앵커 — `mio-cutschool`

```
STYLE ANCHOR - mio-cutschool   (a kindergarten class in a German river village / linocut, the knife
                                makes the form)

Style: linocut printed in exactly TWO inks on thick oatmeal paper, 4-6 year old picture book. Form is
  made by WHAT THE KNIFE TOOK AWAY - every white line is a gouged channel, never a drawn line, and
  every edge is a cut edge, slightly ragged, never mechanically smooth. The gouge marks that clear an
  area stay visible as parallel furrows. Where the two blocks overlap a third, darker colour appears
  - that is the only dark. Unprinted paper is not white space, it is the window light, the snow and
  the whitewashed wall. SHADING IS ZERO - no modelling, no gradient, no cast shadow, no highlight.

RENDERING (finish hierarchy): a cleared area is not blank - it carries the parallel furrows of the
  tool that cleared it, AT MOST 9 FURROWS PER AREA, all running one way within that area, and the
  direction changes only where one thing ends and another begins. FINISHED THINGS PER PAGE = 2, the
  child the page is about and the one thing that child touches; everything else is a block shape with
  no interior detail. Repeats are capped and the cap is the whole design: blocks in a tower at most
  12 · paper chain links at most 14 · cut snowflakes at most 9 · coat hooks at most 6 · classroom
  windows at most 6 rectangles with 0 frames · shelved jars at most 6 of one shape · fallen leaves at
  most 11 · acorns at most 9 · ducks on the river at most 5 · a village crowd at most 7 flat
  silhouettes with 0 faces and 0 hands · falling snow at most 14 gouged points · stars at most 14
  gouged points. Nothing in a repeat is a mirrored copy of its neighbour.
  DENSITY RATION = none. 🔴 THE KNIFE SLIPS ONCE PER SPREAD AND THAT SLIP IS LEFT IN.
  🔴 THE CLASS IS FIVE CHILDREN AND ONE TEACHER AND NOBODY ELSE - never an extra child to fill a
  gap. When fewer than five are in the story, fewer than five are on the page.

PALETTE: PAPER OATMEAL #F0EAD8, window light, snow, whitewash, paper, everything not printed · INK1
  SOOT #3B3A33, walls, floor, furniture, the teacher's mass, blocks, tree trunks, animal backs - the
  dark one · INK2 RIVER #6F8996, the river, the sky at the water, aprons, smocks, the roof of the
  play house, painted things - the cool one · OVERLAP NIGHT #232B2E, heads and backs, the inside of
  the store cupboard, the river under the bank, anything in deep shade - overprint only, never a
  third block · ACCENT PURPLE #6E4E9E, 🔴 cut last, touching nothing but the one small purple thing
  each child carries. No sky blue that is not RIVER, no green, no red, no pink, no white ink.

STAGE CLAUSES (the stage changes what the two inks do, never which two they are):
  CLASSROOM - floor and walls are SOOT cleared with furrows, the furrows running one way for the
    floor and the other way for the wall, and that change of direction is the corner of the room.
    Tables, shelves and the block basket are SOOT; smocks, aprons and the play house roof are RIVER.
    🔴 THE WINDOW LIGHT IS BARE PAPER, one clean gouged shape with no rays and no glow, and it is
    the brightest thing on the page. A thing being looked for is cut as ITS OWN BLOCK while
    everything it hides among is the repeated one - that is how the eye finds it.
  YARD - the ground is BARE PAPER; the fence, the swing frame, the ladder and the tree are SOOT; the
    play house roof and the water tub are RIVER. Depth is made by things standing CLOSER TOGETHER,
    never darker.
  RIVERBANK - the river is ONE flat block of RIVER running across the page, 0 ripples, 0 glints. A
    thing on the water sits on top with its whole shape showing; a thing under it is OVERLAP inside
    that block. 🔴 NOTHING IS EVER MIRRORED IN THE WATER - there are no reflections in this book.
    The bank, the reeds and the stones are SOOT with the furrows running ALONG the thing.
  🔴 SNOW (volumes 24 and the winter yard) - the ground and the sky are not printed at all, BARE
    PAPER from edge to edge, and the two blocks print ONLY what stands on it. A footprint in the snow
    is a single SOOT mark; a mound gets at most 3 SOOT marks along its lower lip and nothing else.
  🔴 MADE THINGS NEVER TAKE THE ACCENT - a paper chain (19) is cut in SOOT and RIVER links only, and
    cut snowflakes (11) are BARE PAPER. The purple in this world is worn, never made. If a made thing
    were purple the five signatures would stop working on the page they matter most.
  🔴 ADULT IN FRAME - whenever the page contains water, a height, or a door that can close, TEACHER
    BAU IS INSIDE THE FRAME, whole, at the same depth as the children, doing something with her
    hands. This holds on the pages before p8 as well: volume 03 pages 1, 3, 5 · volume 02 pages 4, 5
    · volume 18 pages 4, 5 · volume 08 pages 3, 4 · volume 17 page 5.

CHARACTER DESIGN LANGUAGE: the animals are built from the same cut blocks as the world - two or three
  shapes with limbs laid over. GRADE: bipedal, standing upright, wearing cloth, 🔴 and ALL FIVE
  CHILDREN HAVE HANDS, including the gosling, whose wings end in three blunt fingers - this class
  cuts, folds, digs and builds on every page. Heads and backs are OVERLAP, chests and bellies are
  SOOT. Eyes are two gouged dots set wide apart; a small dark nose or beak; the mouth is ONE gouged
  curve; above each eye ONE short gouged eyebrow. 🔴 FEELING IS CARRIED BY THE MOUTH CURVE AND THE
  TWO EYEBROWS - the eyes only ever open or close and their size NEVER changes. The face is never
  crossed by an object. Whole-body posture carries the rest.
  THE FIVE, separable at thumbnail size, all the same height: MIO a kitten, two sharp triangle ears
  and one long tail curved up behind, a PURPLE satchel · BOBO a piglet, a round flat snout and a
  short curled tail, the widest of the five, a PURPLE cap · LALA a lamb, a head of small carved
  bumps and no visible ears above them, a PURPLE hairpin · GAGA a gosling, a long neck and a blunt
  beak, the tallest silhouette by the neck alone, a PURPLE ribbon · DURI a raccoon, a dark band cut
  straight across the eyes and a tail of at most 5 rings, a PURPLE handkerchief.
  🔴 EACH CHILD'S PURPLE THING IS ALWAYS VISIBLE AND IS THE ONLY PURPLE ON THE PAGE.
  TEACHER BAU a big dog, twice a child's height and the widest figure, a long muzzle and two heavy
  hanging ears, calm and still, hands always occupied with the same work the children are doing.
  🔴 SHE NEVER WEARS PURPLE and never has an errand of her own.
  🔴 THE FIVE ARE NEVER DRAWN AS A CROWD - even when all five are on the page each one keeps its own
  cut silhouette with clear paper between it and the next.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - the coat hooks, the
  name cards and the wall chart stay blank or carry a single cut pictogram.

NOT: no airbrush, gradient, glow or 3D render / no drawn white line - white is gouged / no soft or
  feathered edge / no smooth mechanical edge / no ink outside a cut block / no reflection or mirrored
  image in water / no purple on anything the children made / no white ink / no extra children / no
  lettering.
```

**관통 줄** (매 쪽 · 설계서 §5 의 것을 그대로 쓴다)

```
CARVE: white lines are gouged away, never drawn - the block remembers the knife
CLASS: five children, each carries one small PURPLE thing, always
BAU:   the teacher dog is large and calm and never wears purple
```

🔴 **`ADULT IN FRAME` 조항은 해당 쪽의 프롬프트에 반드시 실어 보낸다.** 앵커에 적혀 있어도
쪽별로 뽑으면 그 쪽 지문이 이기므로, 물·높이·닫히는 문이 있는 쪽은 **컷 지문에도 한 줄** 넣는다.
이건 그림체 취향이 아니라 **안전 규칙**이다 — 아이만 물통 앞에 있는 그림 자체가 모방 신호다.

🔴 **다섯이 같은 키인 것이 이 시리즈의 규칙이다.** 메이(02)는 삐노가 제일 크고 메이가 제일 작았지만
여기는 한 반이라 키로 못 가른다. 그래서 **귀·주둥이·꼬리·목**이 실루엣의 전부이고,
리노컷이 그 넷을 크게 깎아 주는 매체라 오히려 유리하다.

---

## §2. 캐스트 시트

한 장에 여섯을 다 그린다. 🔴 **시트가 최종 그림을 지배**하므로 시트를 먼저 확정하고 쪽 삽화로 간다.

```
CHARACTER SHEET - mio kindergarten   (six characters, one sheet)

[여기에 §1 의 Style / PALETTE / CHARACTER DESIGN LANGUAGE 세 문단을 그대로 붙인다]

SHEET LAYOUT: one oatmeal sheet, six characters standing in a row on a single ground line - 🔴 THE
  FIVE CHILDREN ARE ALL EXACTLY THE SAME HEIGHT, and Teacher Bau is twice any of them and the widest
  figure. Each character is drawn THREE times: front standing, three-quarter walking, and back.
🔴 ONE EXTRA ROW AT THE FOOT OF THE SHEET: the five children again, side by side, printed as FLAT
  OVERLAP SILHOUETTES with 0 interior marks and NO PURPLE AT ALL. If the five silhouettes cannot be
  told apart by ears, snout, beak, neck and tail alone, the sheet is wrong.
  Nothing else on the sheet - no props, no scenery, no ground beyond the one line.
🔴 No lettering, numerals, labels or name tags anywhere on the sheet.
```

🔴 시트가 나오면 기획서 §2 카드에 붙여넣는다(R2 `comic-assets/mio-plan`, 키 = 캐릭터 key).
회차 페이지의 「🎬 이 화 등장」 스트립이 그 이미지를 읽어 온다.

🔴 **`mio-core.js` 의 STYLE 도 이 앵커와 같이 고친다.**
