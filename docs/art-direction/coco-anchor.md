# 코코네 빵집 골목 — 앵커 + 캐스트 시트

> 창작동화 **시리즈 03** (25권 · 250쪽). 대본 SSOT = `docs/changjak-books/coco/*.md` ·
> SCENE = `_scenes.json` · 회차 HTML = `packages/client/public/coco-{01..25}.html`
> 🔴 **이미지 생성은 여기서 하지 않는다.** 프롬프트까지가 이 문서의 일이다.
> 🔴 **한 시리즈 = 한 그림체.** 이 시리즈는 **활판(letterpress) 전권** — `pongi-anchor.md` §3 보류분
> `pongi-presshome` 을 가져와 캐스트·무대를 갈아 끼운 것이다. 슬러그 = `coco-pressalley`.

---

## §1. 앵커 — `coco-pressalley`

```
STYLE ANCHOR - coco-pressalley   (a mouse bakery in a Paris back alley / letterpress, the bite of the type)

Style: letterpress on soft cream paper, exactly TWO inks, 4-6 year old picture book. Every shape is
  a block inked and pressed into the sheet, so the ink sits heaviest at the edge of each shape and
  the paper is visibly dented where a block bit. Where the two inks overlap a third, darker colour
  appears. SHADING IS ZERO - the only variation is the uneven bite of the press. Ink coverage is 90
  percent, never solid - the paper shows through inside every shape.

RENDERING (finish hierarchy): the world is built from repeated blocks - one block cut once and
  pressed again and again. The block is the SAME shape every time; it may run off an edge but is
  never redrawn. Clutter is made by REPEAT, not by variety. FINISHED THINGS PER PAGE = 2, Coco and
  the one thing she touches. 🔴 A THING BEING SEARCHED FOR IS CUT AS ITS OWN BLOCK while everything
  it hides among is the repeated one - that is how the eye finds it. Caps: loaves on a shelf = one
  loaf block at most 9 presses · jars = at most 6 of one shape · windows down the alley = at most 8,
  never a mirrored copy of a neighbour · cobbles = one arc block, at most 12 presses · crowd at the
  market = at most 7 silhouettes, 0 faces, 0 hands · steam = at most 5 curls · crumbs = at most 9
  dots. DENSITY RATION = none.

PALETTE: PAPER CREAM #F6F1E7, plaster, flour, morning light through the window, steam against dark ·
  INK1 CRUST #8A6242, bread, shelves, doors, carts, cobbles, wood - the warm one · INK2 SLATE
  #4E5A66, shutters, roofs, aprons, iron, shadows of the alley - the cool one · OVERLAP ROAST
  #35322B, mouse backs, the oven mouth, night windows, anything in deep shade - overprint only,
  never a third ink · ACCENT RED #B5402E, 🔴 printed last, touching nothing but Coco's head kerchief.
  No sky blue, no purple, no pink, no white ink anywhere ever.

STAGE CLAUSES (the stage changes what the two inks do, never which two they are):
  BAKERY - floor = one plank block repeated, wall = one dot block repeated, shelf = the loaf block
    repeated. 🔴 THE OVEN GLOW AND THE WINDOW LIGHT ARE BARE PAPER and are the brightest thing on
    the page. Flour dust = bare paper showing through a thinner pull.
  ALLEY - cobbles = one arc block repeated, walls lean slightly toward each other, the strip of sky
    between the roofs is bare PAPER and it is the light of the whole page. Far end of the alley = at
    most 3 silhouettes in SLATE, 0 windows.
  MARKET - awnings are single flat pulls of INK1 or INK2; 🔴 the one stall being looked for may hold
    the page's ONLY warm-yellow pull, mixed from CRUST at half strength, and nothing else gets it.
  RAIN (volume 06) - rain = at most 11 straight SLATE strokes all leaning one way; wet cobbles carry
    ONE bare-paper strip as the reflection of the sky and nothing mirrors in it.
  SNOW (volume 12) - the alley is not printed at all, bare PAPER edge to edge; the two inks print
    only what stands on it; swept ground returns as cobble blocks.
  NIGHT (volumes 04, 22) - the sky is the OVERLAP colour, stars = at most 14 bare-paper points;
    every lit window and the oven mouth are bare PAPER and carry the page.

CHARACTER DESIGN LANGUAGE: animals are built from the same pressed blocks as the world - two or
  three shapes with limbs laid over. GRADE: bipedal, standing upright, wearing cloth. Backs and
  heads are the OVERLAP colour, chests and bellies are INK1, so every animal is built the same way.
  Eyes are two solid dark dots set wide apart; a small dark nose; the mouth is ONE curve; above each
  eye ONE short eyebrow stroke. 🔴 FEELING IS CARRIED BY THE MOUTH CURVE AND THE TWO EYEBROW
  STROKES - the eyes only ever open or close and their size NEVER changes. The face is never crossed
  by an object. Whole-body posture carries the rest. THE CAST, separable at thumbnail size: COCO a
  small mouse, big round ears, a thin tail with a single curl, 🔴 a RED head kerchief - the smallest
  standing figure and the only red thing in the world · MOM a mouse half a head taller, an apron,
  flour on her forearms, no red · MOLE GRANDFATHER low and round, tiny dot eyes almost hidden, huge
  digging hands, a knitted vest · MAGPIE AUNT the only flyer, long tail, sharp beak, perches high on
  frames and sills · PIG UNCLE twice Coco's height and the widest figure, rolled sleeves, heavy
  boots. Adults never carry red.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - shop fronts and
  price tags stay blank or carry a pictogram of a loaf.

NOT: no airbrush, gradient, glow or 3D render / no soft or feathered edge / no varied hand-drawn
  clutter behind the figures / no solid unbroken ink / no white ink / no letters on signs.
```

**관통 줄** (매 쪽)

```
RED:   the red plate is printed last and touches nothing but Coco's kerchief
LIGHT: oven glow, window light and the sky strip are bare paper - never printed
WRONG: the adult who is wrong is wrong inside Coco's task, never on an errand of their own
```

---

## §2. 캐스트 시트

한 장에 다섯을 다 그린다. 🔴 **시트가 최종 그림을 지배**하므로 시트를 먼저 확정하고 쪽 삽화로 간다.
기획서 §2 카드마다 **한 명씩 뽑는 프롬프트**도 있다(반복 생성용).

```
CHARACTER SHEET - coco bakery   (five characters, one sheet)

[여기에 §1 의 Style / PALETTE / CHARACTER DESIGN LANGUAGE 세 문단을 그대로 붙인다]

SHEET LAYOUT: one cream sheet, five characters standing in a row on a single ground line, all at
  their true relative heights - Pig Uncle twice Coco, Mom half a head over Coco, Mole Grandfather
  low and round, Magpie Aunt perched on a stool so her standing height reads. Each character is
  drawn THREE times: front standing, three-quarter walking, and back.
  Nothing else on the sheet - no props, no scenery, no ground beyond the one line.
🔴 No lettering, numerals, labels or name tags anywhere on the sheet.
```

🔴 시트가 나오면 기획서 §2 카드에 붙여넣는다(R2 `comic-assets/coco-plan`, 키 = 캐릭터 key).
회차 페이지의 「🎬 이 화 등장」 스트립이 그 이미지를 읽어 온다.
