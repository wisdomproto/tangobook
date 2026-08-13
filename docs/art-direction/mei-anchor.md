# 메이네 산마을 — 앵커 넷 + 캐스트 시트

> 창작동화 **시리즈 02** (25권 · 250쪽). 대본 SSOT = `docs/changjak-books/mei/*.md` ·
> SCENE = `_scenes.json` · 회차 HTML = `packages/client/public/mei-{01..25}.html`
> 🔴 **이미지 생성은 여기서 하지 않는다.** 프롬프트까지가 이 문서의 일이다.

---

## §0. 설계

### 시리즈 01 과 계열을 가른다

라인 정체성이 **권마다 다른 그림체**다. 시리즈를 도입해도 이건 안 묶는다 — 25권에 앵커 넷,
무대 성격으로 묶는다. 여기까지는 01 과 같다.

바뀌는 건 **기제**다. 01 은 인쇄 공정(판·잉크·겹침)이었다. 02 는 **손자국**이다 —
연필 결, 크레용이 종이 결에 걸려 끊긴 자리, 붓 자국, 문지른 숯과 지우개로 뺀 흰 자리.
두 시리즈가 서가에 나란히 놓여도 다른 책장으로 읽힌다.

```
시리즈가 고정   캐스트 6인 · 무대(알프스 산마을) · 형(대발이형) · 캐릭터 규격 · 종이
묶음마다 변주   매체와 두 색 — 그래서 손자국의 성질이 묶음마다 다르다
```

### 🔴 네 앵커를 잇는 골격

```
종이       WARM GREY #EDE9E1 — 칠하지 않은 자리는 전부 이 색이고 이것이 빛이다
색 1·2     묶음마다 다르다. 두 색뿐이다
악센트     ORANGE #D4622A — 다섯 아이가 저마다 하나씩 지닌 물건에만
결(TEETH)  종이 결이 모든 색을 뚫고 보인다. 꽉 찬 색면이 하나도 없다
```

🔴 **주황은 인물이 아니라 무리를 가리킨다.** 01 은 주인공 하나에 붉은 목끈이었지만 02 는
주인공이 권마다 바뀐다. 그래서 다섯이 **저마다 주황 물건 하나씩** 지닌다 —
메이 목도리 · 루디 앞치마 주머니 · 삐노 신발 · 소소 리본 · 레오 목깃.
누가 주인공이든 화면에 주황이 있고, 다섯이 모이면 한 무리로 읽힌다.

### 🔴 01 에서 일부러 어긴 것 — 눈썹 한 획

01 의 캐릭터 규격은 「표정은 입 곡선으로만, 눈은 뜨고 감기만」이었다. 페파형은 웃음이 전부라 그걸로 됐다.
**대발이형은 속상함·부끄러움·화가 사건의 절반**이라 입만으로는 모자란다 —
그래서 **눈썹 한 획**을 더한다. 여전히 눈 크기는 안 변한다.

🔴 이건 01 이 a45 를 버린 이유와 같은 판단이다: **그림체가 이야기를 제약하면 고를 것을 잘못 고른 것이다.**

---

## §1. 묶음 배분

| 묶음 | 앵커 | 권 | 매체 | 두 색 |
|---|---|---|---|---|
| **A** 비탈 풀밭 | `mei-pencilslope` | 01 · 07 · 09 · 12 · 13 · 15 · 24 | 색연필 | 풀 + 흙 |
| **B** 산장 안 | `mei-crayonchalet` | 02 · 10 · 14 · 18 · 21 · 22 · 25 | 크레용 | 나무 + 그림자 |
| **C** 산길·개울 | `mei-gouachebrook` | 04 · 05 · 11 · 19 · 20 | 과슈 | 물 + 바위 |
| **D** 마을 광장 | `mei-charcoalsquare` | 03 · 06 · 08 · 16 · 17 · 23 | 숯 | 검정 + 지붕 |

A 7 · B 7 · C 5 · D 6 = 25. 전부 정책 상한(6~10) 안이다.

🔴 **눈 오는 권(01·13·16)에 다섯째 앵커를 만들지 않는다.** 관통 줄 `WARM` 이 이미 「빛은 칠하지 않은 종이」라
설경에 오히려 강하다 — 그 권은 비탈·광장을 **통째로 맨 종이로 남기고** 두 색이 그 위에 선 것만 그린다.
아래 A·D 문안의 `SNOW VOLUMES` 한 줄이 그 일을 한다. 04권(숲)도 같은 식으로 C 안에서 처리한다(`FOREST VOLUME`).

**관통 줄** (전 묶음 공통, 3개)

```
WARM:  the warm grey paper is the light - never lay colour where light belongs
FIVE:  each child carries one small ORANGE thing and it is always visible
GROWN: the bear is the only adult and she never has an errand of her own
```

---

## §2. 앵커 A — `mei-pencilslope` (비탈 풀밭 · 7권)

```
STYLE ANCHOR - mei-pencilslope   (five children on an alpine slope / coloured pencil on toothy paper)

Style: coloured pencil on warm grey toothy paper, exactly TWO pencils, 4-6 year old picture book.
  Every area is built from parallel strokes laid in ONE direction, and the tooth of the paper breaks
  every stroke so no area is ever solid. Where the two pencils cross-hatch, a third darker colour
  appears - that is the only dark. Unlaid paper is not white space, it is the sky and the light.
  SHADING IS ZERO - no blending, no smudging, no gradient, no cast shadow, no highlight.

RENDERING (finish hierarchy): the slope is ONE field of GRASS strokes all running downhill, never
  denser or lighter inside itself, 0 individual blades. Snow is the same field left as PAPER instead
  of stroked. A thing on the slope sits on top with its whole outline showing, drawn with a harder
  point so its edge is one continuous line. FINISHED THINGS PER PAGE = 2, the child the page is
  about and the one thing that child touches. Far peaks = at most 4 outlines in EARTH, 0 texture.
  Fence posts = at most 6. Trees = at most 5, each one shape repeated, never individually invented.
  Flowers = at most 9 dots. Stroke direction NEVER changes inside one area - it changes only where
  one thing ends and another begins, and that change of direction IS the edge. DENSITY RATION = none.
  🔴 SNOW VOLUMES (01 and 13): the slope is not stroked at all - it is bare PAPER from edge to edge,
  and the two pencils draw ONLY what stands on it. There is no white pencil and no blue shadow on
  snow; a dip in the snow is drawn with at most 3 EARTH strokes along its lower lip and nothing else.

PALETTE: PAPER WARM GREY #EDE9E1, sky, snow, light, everything not stroked · PENCIL1 GRASS #7A8B5A,
  slope, leaves, painted shutters · PENCIL2 EARTH #8A7358, wood, fence, baskets, sledges, ground ·
  CROSS-HATCH MOSS #4E5840, animal backs, tree trunks, anything in shade - this colour is never a
  third pencil, only the two crossed · ACCENT ORANGE #D4622A, 🔴 nothing but the one small orange
  thing each child carries. No sky blue, no purple, no pink.

CHARACTER DESIGN LANGUAGE: 🔴 SHARED BY ALL FOUR ANCHORS - reproduce word for word, do not vary.
  Animals are built from the same strokes as the world - two or three shapes with limbs laid over.
  GRADE: bipedal, standing upright, wearing cloth. Backs and heads are the CROSS-HATCH colour,
  chests and bellies are PENCIL2, so every animal is built the same way in every anchor. Eyes are
  two solid dark dots set wide apart; a small dark nose; the mouth is ONE curve; above each eye ONE
  short eyebrow stroke. 🔴 FEELING IS CARRIED BY THE MOUTH CURVE AND THE TWO EYEBROW STROKES - the
  eyes only ever open or close and their size NEVER changes. The face is never crossed by an object.
  Whole-body posture carries the rest. THE FIVE, separable at thumbnail size: MEI a white goat kid,
  two short horns, an ORANGE scarf, the smallest standing figure · RUDI a squirrel, one huge tail
  curled up behind, an apron with an ORANGE pocket · PPINO a rabbit, two long ears straight up, the
  tallest child, ORANGE boots · SOSO a hedgehog, a low round back of short spines, an ORANGE ribbon ·
  LEO a fox, pointed muzzle and one long straight tail, an ORANGE collar. GRANDMOTHER BEAR is twice
  any child's height, entirely rounded, no orange anywhere, and she is only ever shown doing the same
  task the children are doing.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow or 3D render / no blended or smudged pencil / no soft or feathered
  edge / no solid unbroken colour / no third pigment that is not a cross-hatch.
```

---

## §3. 앵커 B — `mei-crayonchalet` (산장 안 · 6권)

```
STYLE ANCHOR - mei-crayonchalet   (five children inside a chalet / wax crayon, snagged on the grain)

Style: wax crayon on warm grey toothy paper, exactly TWO crayons, 4-6 year old picture book. Crayon
  skips - it catches the high points of the paper and misses the pits, so every area is a broken
  field of wax with grey grain showing through. Pressure is even everywhere; the breaking is the
  paper's doing, not the hand's. Where the two crayons overlay, a third darker colour appears.
  SHADING IS ZERO - the only variation is where the wax skipped.

RENDERING (finish hierarchy): the room is built from repeated marks - floor = one plank stroke
  repeated, wall = one short dash repeated, cloth = one zigzag repeated. The mark is the SAME shape
  every time; it may run off an edge but is never redrawn. Clutter is made by REPEAT, not by variety:
  shelves = at most 3 marks repeated, jars = at most 6 of one shape, crumbs = at most 9 dots. 🔴 A
  THING BEING LOOKED FOR IS DRAWN WITH ITS OWN OUTLINE while everything around it is the repeated
  mark - that is how the eye finds it. Steam = at most 5 curls. Firelight is the same area left as
  PAPER instead of waxed, and it is the brightest thing on the page. FINISHED THINGS PER PAGE = 2.
  Wax coverage is 80 percent, never solid. DENSITY RATION = none.

PALETTE: PAPER WARM GREY #EDE9E1, plaster, linen, firelight, light · CRAYON1 TIMBER #7A5E42, beams,
  floors, furniture, stairs · CRAYON2 SLATE #4A4038, iron, kettles, night windows, cloth · OVERLAY
  BARK #33302A, animal backs, the dark of the stairwell - overlay only, never a third crayon ·
  ACCENT ORANGE #D4622A, 🔴 nothing but each child's one orange thing. 🔴 EXCEPTION - volume 25 only,
  pages 9 to 10: the five small bells are drawn in the ACCENT, five orange points scattered across a
  dark page, and that is the only page in the series where the accent is not worn.

CHARACTER DESIGN LANGUAGE: 🔴 identical to anchor A, word for word.
  (Read PENCIL2 as CRAYON1 and CROSS-HATCH as OVERLAY.)

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow or 3D render / no soft or feathered edge / no varied hand-drawn
  clutter behind the figures / no solid unbroken wax / no smudging or scraping.
```

⚠️ 25권 예외 = **다섯이 종을 하나씩 흔드는 밤**. 그 두 쪽에서만 주황이 몸을 떠나 어둠에 흩어진다.
🔴 시리즈 전체에서 주황이 「지닌 물건」이 아닌 곳은 여기뿐이라, 그 장면이 시리즈의 마지막이 되는 이유가 그림으로 읽힌다.

---

## §4. 앵커 C — `mei-gouachebrook` (산길·개울 · 5권)

```
STYLE ANCHOR - mei-gouachebrook   (five children on a mountain path / gouache, the brush left visible)

Style: gouache on warm grey toothy paper, exactly TWO colours, 4-6 year old picture book. Every area
  is laid with a flat brush in visible strokes that stop short of the outline, so a rim of bare paper
  is left around most shapes. The paint is opaque and matte and never thinned to a wash. Where the two
  colours overlap wet, a third darker colour appears. SHADING IS ZERO - the only variation is the
  edge of each brush stroke.

RENDERING (finish hierarchy): water is ONE horizontal sweep of WATER colour, never lighter or darker
  inside itself, 0 ripples, 0 glints. A thing in the water is the OVERLAP colour lying inside that
  sweep - hard edge, no distortion, never mirrored. A thing on the water sits on top with its whole
  outline showing. Wet rock is ROCK with the brush stroke running along the rock, not across it.
  FINISHED THINGS PER PAGE = 2. Far ridges = at most 4 strokes in ROCK, 0 texture. Trees = at most 5,
  one shape repeated. Stepping stones = at most 5, each its own stroke. Path = one continuous band of
  bare PAPER running through, and it is the only bare thing besides the sky. DENSITY RATION = none.
  🔴 FOREST VOLUME (04): there is no brook. ROCK draws the trunks - one flat stroke per trunk, at
  most 9 trunks, all vertical - and WATER becomes the shade between them, laid as ONE horizontal
  sweep behind the trunks. The path stays bare PAPER. Deeper in the wood the trunks stand CLOSER
  TOGETHER, never darker, and that spacing is the only way depth is shown.

PALETTE: PAPER WARM GREY #EDE9E1, sky, path, mist, light · COLOUR1 WATER #5C7D82, brook, shutters,
  distant air · COLOUR2 ROCK #6E6A63, stone, logs, trunks, ground · OVERLAP DEEP #38484B, animal
  backs, the underside of the log, anything submerged - overlap only, never mixed on the palette ·
  ACCENT ORANGE #D4622A, 🔴 nothing but each child's one orange thing. No sky blue, no green.

CHARACTER DESIGN LANGUAGE: 🔴 identical to anchor A, word for word.
  (Read PENCIL2 as COLOUR2 and CROSS-HATCH as OVERLAP.)

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow or 3D render / no watercolour wash or bleed / no soft or feathered
  edge / no ripple, glint or sparkle on water / no stroke that reaches every outline.
```

---

## §5. 앵커 D — `mei-charcoalsquare` (마을 광장 · 7권)

```
STYLE ANCHOR - mei-charcoalsquare   (five children in the village square / charcoal, rubbed and lifted)

Style: charcoal on warm grey toothy paper plus ONE earth colour, 4-6 year old picture book. Charcoal
  is laid and then rubbed flat with a finger, so every area is an even grain with the paper's tooth
  speckling through. Light is made by LIFTING - a kneaded eraser takes the charcoal back off and the
  bare paper underneath is the brightest thing on the page. Nothing is ever drawn white. SHADING IS
  ZERO in the modelling sense - an area is rubbed or it is lifted, never graded between.

RENDERING (finish hierarchy): the square is ONE rubbed field, even everywhere, 0 cobbles picked out.
  Snow is the same field LIFTED. Buildings are blocks of ROOF colour laid over the rubbed field with
  one hard charcoal line at the roofline and nowhere else. FINISHED THINGS PER PAGE = 2. Crowd = at
  most 7 silhouettes in flat charcoal, 0 faces, 0 hands. Windows = at most 8, each one lifted
  rectangle, never a mirrored copy of its neighbour. Bell tower = 3 shapes only. Falling snow = at
  most 14 lifted points, each taken out on its own. Every charcoal edge is slightly furry EXCEPT the
  outline of the child the page is about, which is one clean pressed line. DENSITY RATION = none.
  🔴 SNOW VOLUME (16): the square is never rubbed at all - it is bare PAPER from edge to edge, and
  charcoal appears only in the standing things and the crowd. A snow mound is drawn with at most 3
  charcoal strokes along its lower lip and nothing else. There is no white chalk anywhere, ever.

PALETTE: PAPER WARM GREY #EDE9E1, snow, light, lifted windows, everything taken back off · CHARCOAL
  #3A3733, ground, crowd, trees, animal backs, the whole rubbed field · COLOUR ROOF #9A6B52, roof
  tiles, the bell tower, shutters, the one warm mass in the square · ACCENT ORANGE #D4622A, 🔴
  nothing but each child's one orange thing - and on a charcoal page it is the only pure hue, so it
  is how the eye finds the five in a crowd.

CHARACTER DESIGN LANGUAGE: 🔴 identical to anchor A, word for word.
  (Read PENCIL2 as ROOF and CROSS-HATCH as CHARCOAL.)

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow or 3D render / no white chalk or white paint / no soft or feathered
  figure outline / no smudged faces / no second colour beyond ROOF and the ACCENT.
```

---

## §6. 캐스트 시트

한 장에 여섯을 다 그린다. 🔴 **시트가 최종 그림을 지배**하므로 시트를 먼저 확정하고 쪽 삽화로 간다.
매체는 **앵커 A(색연필)** 로 그린다 — 25권 중 7권이 A 이고, 나머지 세 매체는 이 시트의 형태를 각자 재료로 옮긴다.

```
CHARACTER SHEET - mei village   (six characters, one sheet)

[여기에 §2 앵커 A 의 Style / PALETTE / CHARACTER DESIGN LANGUAGE 세 문단을 그대로 붙인다]

SHEET LAYOUT: one warm grey sheet, six characters standing in a row on a single ground line, all at
  their true relative heights - Grandmother Bear twice any child, Ppino the tallest child, Mei the
  smallest. Each character is drawn THREE times: front standing, three-quarter walking, and back.
  Nothing else on the sheet - no props, no scenery, no ground beyond the one line.
🔴 No lettering, numerals, labels or name tags anywhere on the sheet.
```

🔴 **시트가 나오면 기획서 §캐스트 시트 칸에 붙여넣는다**(R2 `comic-assets/mei-plan`, 키 `cast-mei` 등).
회차 페이지의 「🎬 이 화 등장」 스트립이 그 이미지를 읽어 온다.
