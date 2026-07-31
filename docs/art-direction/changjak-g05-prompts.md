# 창작동화 1000 — G-05 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/g05.md`. 대본은 한 글자도 안 고쳤다.
> 🔴 실행 순서: ① 시트 2장 → ② 승인본을 @image 로 붙여 컷 13장

## G-05 §1. 앵커 배정

**권**: g05 「물이 무서운 오리」 · 관찰과 성장 · 네덜란드 운하 돌계단 · **13쪽**
**클러스터**: **C2** (가는 잉크 윤곽 + 평칠 두 색)
**앵커 슬러그**: `changjak-mossline` — **신규 민팅**(배정표 지정). C2 형제 c01·c23·e11·f01 은 전부 「흰 것이 무엇인가」로 갈려 있고, 이 권은 **물이 불투명하다**는 조건 자체가 기존 C2 넷에 없다.
**한 줄**: 물은 **겹수도 비침도 없는 정보 0의 한 면**이고, 화면을 가로지르는 선은 **셋째 단 물이끼 한 줄**뿐이라 「발이 그 선의 위인가 아래인가」만 남는다.

### 🔴 형제 권과 갈린 축 (첫 렌더에서 세어진다)

**물에 밑이 비치나 · 화면을 가로지르는 선이 몇 줄인가.**

| | d07 (기존, **같은 운하 · 같은 오리**) | g05 |
|---|---|---|
| 매체 | 가는 잉크 선 + **투명** 수채 | 가는 잉크 선 + **불투명** 평칠 |
| 물 | 값이 **겹수**(볕 1 · 그늘 2 · 다리 밑 3), **밑이 비친다** | **한 값**, 물속에 보이는 것은 발 둘과 검정 한 덩이뿐 |
| 흰 것 | **안 칠한 종이**(지배면) | 물 위 **동그란 자국**뿐(쪽마다 셀 수 있다) |
| 화면의 자 | 볕과 그늘이 화면을 반으로 가른다 | **가로선 한 줄**(셋째 단 물이끼) |
| 카메라 | 운하 갈림목 = **지도** | 계단 한 자리 = **단면** |
| 오리 | 다 자란 한 마리 | **새끼**(솜털, 부리가 짧고 뭉툭) + 늙은 오리 |

🔴 **1차 판정 = 두 첫 렌더를 나란히 놓고 물속에 무엇이 보이는지 센다.** d07 은 보이고 g05 는 **최대 3개**(발 둘 + 검정 덩이)로 못박혀 있다.
🔴 **초록은 두 단이고 이끼가 밝은 쪽**(`#46664E` 물 / `#7A9A3E` 이끼) — d07 의 초록 `#4E5A50` 과 붙지 않게.
🔴 **b10 `changjak-floatwhite` 와 갈림** = 뜬 것이 흰가 검은가 · 몇 개인가(b10 = 검은 물 위 흰 안료 여러 자리, g05 = 초록 물 위 **검은 것 하나**).

### 대본 SCENE 처방표 (습관어·모순 → 컷 처리)

| 대본 | 컷에서 |
|---|---|
| p4·p5·p12·p13 「물속으로 비쳐 보인다」 | 🔴 물은 불투명이다 → **물에 잠긴 부분은 채우지 않은 잉크 윤곽만**으로 그린다(선이지 깊이가 아니다). 물면 위에 얹힌 도형처럼 보이면 안 되고, 워시·비침·굴절도 금지 |
| p13 톤 「초록이 점점 짙어져 아무것도 안 보이게」 | 그라데이션 금지 → **화면 아래 절반에 표시 0**. 짙어지는 것이 아니라 **아무것도 안 그린 한 값** |
| p1 「방금 새로 칠해 반들거리는 검정」 | 광택·하이라이트 금지 → 뱃바닥은 **불투명 검정 한 판**. 반들거림은 **가장자리가 곧다**로 옮긴다 |
| p3 「이끼의 젖은 광택만 반짝이게」 | 광택 대신 **이끼 띠에만 흰 잔점 최대 5개** |
| ⚠️ **대본 모순 1건**(고치지 않고 컷에서 처리) | landing 이 「p1~p11 내내 발이 돌에 닿아 있다」인데 **p4·p5 는 대본 자신이 「어느 돌에도 안 닿고 떠 있다」**고 쓴다. → `FOOT:` 줄이 **닿음/안 닿음** 대신 **「계단이 프레임 안에 있나」**까지 세게 했다: p4·p5·p12 는 안 닿아도 계단이 화면 안에 있고, **p13 만 화면 아래 절반에 돌이 하나도 없다** |
| ⚠️ p9 「발가락 둘이 붙어」 ↔ p11 「발가락 셋이 활짝」 | 모순 아님(앞발가락 셋 중 둘이 붙어 있었다). 시트에 셋으로 못박았다 |

---

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-mossline

Style: picture book, ages 4-6. One flight of stone steps going down into a Dutch canal, early morning; the camera never leaves these steps and the water in front of them. Fine even ink outline plus OPAQUE flat fill in two colours - canal green and wet grey stone.

RENDERING (finish hierarchy)
One ink line weight everywhere, no line tapering, no hatching, no cross-hatching, 0 texture inside any shape; each shape is one opaque flat colour that stops dead at its outline. THE WATER IS ONE OPAQUE FLAT GREEN #46664E - 0 transparency, 0 layers, 0 reflection, 0 ripple texture, 0 visible bottom, 0 sunk steps. Under the surface exactly three things may ever appear and nothing else: the duckling's two webbed feet, drawn as UNFILLED ink outline with the green reading through them, and the tar lump, which stays solid black. The stone is one flat grey; the joins between steps are short ink lines that stop at the width of the stair, so THE ONLY LINE THAT CROSSES THE WHOLE PICTURE IS THE MOSS LINE. White #F4F2EA is reserved: ring marks on the water, at most 3 per page, plus flung droplets, at most 12 on the one page that has them - nothing else in the book is white. Finish hierarchy: (1) the duckling = full; (2) the one thing he touches that page = half; (3) everything else = flat fill and outline. FINISHED THINGS PER PAGE = 2. Counts: the set holds the steps, the upturned boat, one rusted iron ring, and nothing else; far bank = at most 5 flat house silhouettes with 0 windows and 0 doors; water = 0 marks except the rings and the tar; stone = 0 cracks, at most 6 short join lines in the whole picture. DENSITY RATION = none.

PALETTE
#46664E canal water, one flat value, the largest area on most pages · #7A9A3E moss, used ONLY on the top face of the third step, a brighter green than the water so the ruler separates · #9A968C wet grey stone, the dry second step is the same grey one step lighter at #B4B0A6 · #1C1A18 ink line, the upturned hull, and the tar lump - the tar is the same black as the hull it came off. Warm colour is rationed: bills and legs #C08A3E, at most 4 warm shapes on a page.

CHARACTER DESIGN LANGUAGE
Two ducks, QUADRUPED-EQUIVALENT: plain birds on two bird legs, no clothes, no props, no hands, no human gesture, no pointing, no standing upright like a person. They talk with open bills and with where their bodies are. Eyes = one flat black bead with a fine ink ring, no white highlight, no lashes, no brows. Feet are webbed with three forward toes. No blush, no sweat drops, no motion lines, no speech balloons.

CANVAS
16:9 double-page spread, full bleed, illustration to all four edges, no border, no caption band, no quiet strip reserved at any edge. No letters, numbers, signage, boat name or writing anywhere in the picture.

NOT (rendering only)
1 no transparency, no wash layering, no reflection, no glazing - water is one opaque value.
2 no gradient, glow, blur, airbrush or soft edge; one shape, one flat colour.
3 no wool, felt, stitching or fibre edge; down = flat shape, 0 individual hairs.
4 no cel-shaded, 3D-rendered, photographic or brush-textured surface.
```

---

## §3. 캐릭터 시트 (먼저 굽는다)

### 시트 1 — Duckling

```
CHARACTER SHEET - Duckling   (bake this FIRST)
Medium: fine even ink outline plus opaque flat fill, 0 texture inside shapes.

FACE: young duck, round head bigger in proportion than an adult's, no neck length to speak of. Bill SHORT AND BLUNT, ochre #C08A3E, about as long as the eye is from the bill base - this short bill is the first thing that tells him from the old duck. Eye = one flat black bead with a fine ink ring, set high on the head.
DOWN: soft straw #E4D2A2 over the whole body, one flat field; the down is read as a slightly wavy silhouette edge, at most 10 waves around the back and rump. 0 feather lines, 0 individual hairs, 0 shading inside the body. Wing = one flat shape with 3 ink lines only when spread.
LEGS & FEET: #C08A3E, webbed, THREE forward toes clearly countable on every page where a foot shows. 🔴 On the LEFT foot two of those three toes are stuck together by a lump of black tar #1C1A18 the size of a thumbnail, sitting under the web - present from p1, removed on p11.
BUILD & SILHOUETTE: half the old duck's length, body a plump oval, tail a small blunt wedge. Told from the old duck at a glance by size, by the short blunt bill, and by the pale straw body.
POSTURES (cuts call these by number):
 1 SLIDE - body pitched forward down a slope, both webs shoved out ahead, breast low.
 2 CRANE - standing on two feet, neck stretched forward and down over the water.
 3 STRADDLE - one web planted on the lower step, the other still on the step above, body spanning both.
 4 CHEST-DEEP - half submerged, both wings thrown wide open, neck straight up, bill open.
 5 SPIN - tilted onto one side on the water, head turned back to its own tail.
 6 SHAKE - standing, feathers puffed out all round, body twisting.
 7 BELLY-DOWN - lying flat on a step, body pressed low, LEFT foot shoved out forward, sole toward the viewer.
 8 FOOT-UP - balanced on one leg, left foot raised high in front of the face, head bent to stare at it.
 9 SCRUB - body pitched forward, left sole laid on a stone edge and pushed back and forth, right foot and both wings bracing.
 10 GLIDE - neck straight out, body low and level, moving forward.
 11 FLOAT - sitting still on the water, neck relaxed, head slightly turned.
REFERENCE SHEET: full-body side idle, 3/4 turn, top-down from directly above (needed twice in the book), plus two close-ups - the left web with two toes fused by the black lump, and the same web with all three toes spread. Flat pale ground, no scenery, no shadow, no text.
```

### 시트 2 — Old duck

```
CHARACTER SHEET - Old duck   (bake this FIRST)
Medium: fine even ink outline plus opaque flat fill, 0 texture inside shapes.

FACE: grown duck, small flat head on a LONG neck that can go straight up like a post - the neck is the silhouette difference. Bill LONG AND FLAT, ochre #C08A3E, twice the duckling's bill. Eye = one flat black bead with a fine ink ring.
PLUMAGE: warm grey #BDB6A6 body, one flat field; a slightly darker grey #9A968C cap over the crown and down the back of the neck, and a single flat wing patch - 3 flat shapes in all. 0 feather lines, 0 shading. 🔴 NOT white: white in this book belongs to the ring marks on the water.
LEGS & FEET: #C08A3E, webbed, three forward toes, always clean - no tar, ever.
BUILD & SILHOUETTE: twice the duckling's length, body a long flat oval that sits low in the water. Told apart at a glance by the long neck, the long bill and the grey body.
🔴 BEHAVIOUR RULE: this bird never teaches. Do not build a pointing, instructing or wing-raised posture on any page. He counts, he looks, he says one method, he repeats one line.
POSTURES:
 1 BACK-TURNED - floating with the back to the camera, head away, not looking.
 2 CALL - turned toward the steps, bill open, one web pushing back under the water.
 3 CLOSE-UP-LOOK - drawn right up against the steps, neck straight up, bill tip aimed at one spot.
 4 WATCH - floating, head still, eye on the steps.
 5 ALONGSIDE - floating level beside the duckling, both facing the same way.
REFERENCE SHEET: full-body side floating, 3/4 turn on the water, neck-straight-up look, plus one close-up of the head with the bill open. Flat pale ground, no scenery, no shadow, no text.
```

---

## §4. 쪽별 컷

### p1

```
--- p1 — 뱃등을 타고 내려온다 ---
MOSS: one continuous horizontal #7A9A3E line along the top face of the third step, running the full width of the lower third of the picture; it is the only line that crosses the picture; the step joins are short ink lines that stop at the stair width.
FOOT: both webs are on the black hull, sliding - the feet are on stone-hard surface and the steps are in frame.
TAR: 🔴 a thumbnail-sized lump of solid #1C1A18 under the LEFT web, exactly the black of the hull it came off. It is in this picture from the first page although the text will not name it until p8. Do not hide it and do not enlarge it.
CAMERA wide, slightly high oblique looking down on the steps and the water. / SUBJECT upper left, Duckling in POSTURE 1 coming down the curved back of the upturned boat, breast low, both webs shoved out ahead; behind him two rows of small footprints run up the hull. Lower right on the water, Old duck in POSTURE 1, back turned, not looking yet. / SETTING the upturned wooden boat lying keel-up left of the steps, its bottom one opaque flat black plane with straight edges and 0 gloss, 0 highlight; the stone steps; one rusted iron ring on the top step; far bank = 5 flat house silhouettes with 0 windows and 0 doors. Water = one flat green, 0 marks. / FINISH Duckling full; the hull half; all else flat fill and outline. Water is opaque - nothing shows below it on this page. No letters or numbers, no boat name. Both birds are plain ducks, no clothes, no hands. / TONE early morning, low and cool; the only strong contrast in the picture is green water against black hull.
```

### p2

```
--- p2 — 둘째 단에서 물을 내려다본다 ---
MOSS: the line runs across the middle of the frame at full width; above it the second step is dry light grey #B4B0A6, below it everything is the flat green.
FOOT: both webs on the DRY second step - one step above the moss line.
TAR: half hidden under the body, only a sliver of black showing past the left web.
CAMERA medium, seen from the side of the stair at a low eye level right at the waterline, so the four steps read as layers. / SUBJECT right of frame, Duckling in POSTURE 2 on the second step, both feet planted, neck stretched forward and down over the water, bill closed. Left of frame on the water, Old duck in POSTURE 2, turned to the steps, bill open, calling, one web pushing back under the surface - THAT WEB IS UNFILLED INK OUTLINE with the green reading through it, the only thing under the water on this page. / SETTING four stone steps; the boat is out of frame except one corner at the upper left. Water = one flat green with 0 ring marks. / FINISH Duckling full; the moss band half; all else flat. 🔴 The water is opaque - no bottom, no sunk steps, no reflection. No letters or numbers. Plain ducks, no clothes, no hands. / TONE moss green and dry stone grey split the picture along one horizontal; that line sits at this same height for the rest of the book.
```

### p3

```
--- p3 — 셋째 단은 미끌미끌 ---
MOSS: the line is close to the camera here and fills the lower half of the frame at full width - still one line, still horizontal, still the only thing crossing the picture.
FOOT: one web down ON the moss of the third step, the other still on the second - his body spans the line, and the toes of the front web have slid sideways and splayed.
TAR: still under the left web, partly hidden where it meets the moss; solid black against the bright green.
CAMERA medium close-up, side of the stair at eye level, tipped a little toward the feet. / SUBJECT centre, Duckling in POSTURE 3, bill open; the front web slipping outward on the moss so the three toes spread. Lower left on the water, Old duck POSTURE 4, only the head turned this way. / SETTING the mossy third step; one thin band of water pushed up over its edge, drawn as a flat green shape with a straight ink edge, 0 foam. No other props. / FINISH Duckling full; the moss step half - and 🔴 the wet gloss is not gloss: give the moss band at most 5 small white #F4F2EA specks and nothing else. All else flat fill and outline. No letters or numbers. Plain ducks. / TONE two greens against each other, moss brighter than water; the rest of the picture stays quiet in flat fill.
```

### p4

```
--- p4 — 첨벙 ---
MOSS: the line runs behind him across the full width of the frame, close under his breast; the step is within one duckling-length of him and IN FRAME - that is what keeps this page from being the ending.
FOOT: not on stone. Both webs are under the surface and touching nothing.
TAR: under the left web, submerged - 🔴 it stays SOLID BLACK under the water while the feet do not. It is the one filled thing below the surface.
CAMERA medium, front-on, low angle at the waterline. / SUBJECT centre, Duckling in POSTURE 4, chest-deep, both wings thrown wide open with 3 ink lines each, neck straight up, bill open. 🔴 Below the surface his two webs are drawn as UNFILLED INK OUTLINE, the flat green reading straight through them, no fill, no wash, no distortion - line only, never depth. / SETTING one flat ring of water pushed out around his body, drawn as an ink line, not a wash; behind him the moss band of the third step. Nothing else in frame. / FINISH Duckling full; the spread wings half; all else flat. 🔴 The water has no layers, no bottom, no sunk steps, no reflection. At most 12 white droplet specks. No letters or numbers. Plain ducks, no hands. / TONE one green plane with one straw body in it; the whites here are the droplets only.
```

### p5

```
--- p5 — 빙그르르 ---
MOSS: seen from directly above, the line survives as ONE horizontal fragment in the top corner of the frame - same green, same horizontal, still the only crossing line.
FOOT: not on stone; he is turning on open water with the step fragment still in frame.
TAR: solid black on the left web, and this is the page it explains everything - the fused toes are why he turns.
CAMERA high angle, looking down almost straight onto the water. / SUBJECT centre, Duckling in POSTURE 5, tilted onto one side, head turned back to his own tail. 🔴 Under the surface: the RIGHT web is drawn as unfilled ink outline, fully spread and pushed back; the LEFT web is unfilled ink outline too but its three toes show TWO stuck together by the solid black lump, and it is not moving. The two webs are at the same depth in the same frame so the difference is a direct comparison. / SETTING one white #F4F2EA line coiling once around him - the beginning of the mark the next page counts; upper corner, the moss fragment. Nothing else. / FINISH Duckling full; the two webs half; all else flat. 🔴 Top-down does NOT license a visible bottom - the water is one flat opaque green from edge to edge. No letters or numbers. Plain ducks. / TONE one green field seen from above; the single bright coil line is the only white.
```

### p6

```
--- p6 — 몸을 부르르 턴다 ---
MOSS: full-width line again, camera back at the side of the stair.
FOOT: both webs on the DRY second step - back above the line.
TAR: on the left web, half hidden by the puffed body; still solid black.
CAMERA medium, side of the stair, eye level. / SUBJECT right, Duckling in POSTURE 6 on the second step, feathers puffed all round, body twisting, droplets flung off. Left on the water, Old duck POSTURE 2, bill open, neck reaching toward the steps. / SETTING 🔴 ONE white #F4F2EA ring mark on the water, still coiled and not yet gone - count it, it is the whole point of this page; the moss band; two wet web prints on the dry grey of the second step. Nothing else. / FINISH Duckling full; the ring mark half; all else flat fill and outline. At most 12 white droplet specks around him, and those droplets plus the one ring are all the white on the page. 🔴 Water opaque, 0 layers, nothing below it here. No letters or numbers. Plain ducks, no hands. / TONE the flung whites are the brightest thing; everything else keeps its flat value.
```

### p7

```
--- p7 — 왼발이 앞으로 쑥 ---
MOSS: full-width line, the camera slightly under it looking up.
FOOT: belly on the DRY second step, the LEFT foot pushed forward off the stone with the sole toward the viewer.
TAR: 🔴 this is the page where the lump is at its clearest and most solid - the darkest black in the picture, sitting under the web with two of the three toes fused into it. Give it a hard straight-edged silhouette.
CAMERA medium close-up, low angle from below the stair looking slightly up. / SUBJECT upper right, Duckling in POSTURE 7 lying flat on the second step, body pressed low, the left foot shoved out ahead so the sole faces us. Lower left on the water, Old duck POSTURE 4, bill open. / SETTING 🔴 THREE white ring marks on the water, different sizes, overlapping - countable, and that count is the refrain; the moss band; the wet prints on the dry step. Nothing else. / FINISH the left foot and the lump full; the Duckling's head half; ALL the rest of the picture is pressed down to flat fill and outline so the eye has one place to go. 🔴 Water opaque, no layers. No letters or numbers. Plain ducks. / TONE the black lump is the strongest value in the whole book so far; the rest of the frame is deliberately quiet.
```

### p8

```
--- p8 — 그거 뭐야? ---
MOSS: the line runs full width BETWEEN the two birds - the old duck below it, the duckling above it.
FOOT: the duckling stays sitting on the dry second step with the left foot still out front.
TAR: still solid black under the left web, and both sightlines end on it.
CAMERA medium, low angle over the old duck's shoulder looking up the steps. / SUBJECT lower front, Old duck in POSTURE 3, drawn right up against the stone, neck straight up, bill tip aimed at the duckling's left foot, eye locked on that one spot - 🔴 no wing raised, no pointing, no instructing posture. Upper, Duckling on the second step, head lowered to look back down at him, left foot still forward. / SETTING the moss band crossing between them; the last thinning traces of the three white ring marks on the water. Nothing else. / FINISH the left foot with its lump full; the old duck's head and bill half; all else flat fill and outline. 🔴 Water opaque - the old duck's body stops at the waterline and nothing of him shows below it. No letters or numbers. Plain ducks, no hands, no clothes. / TONE two sightlines meeting on one small black shape; keep the surrounding stone flat so nothing competes.
```

### p9

```
--- p9 — 안 벌어져요 ---
MOSS: only one fragment of the line at the frame edge - the camera is in close on the feet, but the fragment is still horizontal and at the same height.
FOOT: the RIGHT web is flat on the dry second step; the LEFT foot is up in the air.
TAR: solid black, filling the join between two of the three toes; this is the close-up that proves it.
CAMERA close-up at foot height, eye level. / SUBJECT centre, Duckling in POSTURE 8, tilted for balance, the left foot raised high in front of his face, neck bent to stare at it. 🔴 THE TWO FEET ARE IN THE SAME FRAME AT THE SAME DEPTH: the right web fully spread with all three toes apart on the stone, the left web with two of its three toes locked together by the black lump. The comparison must be readable without any text. Bill open. Old duck = head only in the bottom corner. / SETTING dry second step, one fragment of moss at the edge. Nothing else. / FINISH both feet full - this is the one page where the two finished things are both feet; the head half; everything else flat fill and outline, background emptied. 🔴 No letters or numbers. Plain ducks, no hands. / TONE all the finish is spent on two feet; the stone behind them is a bare flat grey plane.
```

### p10

```
--- p10 — 돌에 대고 쓱쓱 ---
MOSS: full-width line, and the corner he is scrubbing on is exactly where the dry grey meets it.
FOOT: the LEFT sole is laid ON the rough corner between the second and third steps and pushed back and forth; the right web braces on the stone above.
TAR: thinner than on p7, its edge going ragged, with a few loose black crumbs falling below it - keep it solid black, not grey; thinning is drawn as a smaller shape, never as a lighter value.
CAMERA medium close-up, level with the step corner. / SUBJECT centre, Duckling in POSTURE 9, whole body pitched forward, right foot and both wings bracing, bill shut, head down. Left on the water, Old duck POSTURE 4, watching, bill shut. / SETTING the step corner drawn as a straight ink edge; at most 7 black crumbs fallen below it; the moss band. Nothing else. / FINISH the left sole and the step corner full; the lump half; all else flat fill and outline. 🔴 Water opaque, 0 layers, nothing below the surface on this page. No letters or numbers. Plain ducks, no hands, no props. / TONE the only busy place in the picture is the handful of black crumbs; the rest is two flat colours.
```

### p11

```
--- p11 — 툭, 물 위에 동동 ---
MOSS: full-width line; the right web is standing on it.
FOOT: the RIGHT web is down on the mossy third step; the LEFT foot is raised in front of his own face.
TAR: 🔴 OFF THE FOOT AND ON THE WATER - one small flat solid black shape lying on the green plane, floating, not sinking, not submerged, no ring around it, no splash. It stays there on p13 too.
CAMERA close-up, slightly high eye level, foot and water surface in one frame. / SUBJECT upper, Duckling holding the left foot up in front of his face with ALL THREE TOES SPREAD WIDE, bill wide open. Lower, on the water, Old duck POSTURE 4 floating beside the black shape, looking at it. / SETTING the floating lump; the moss band; 0 white ring marks on this page - the refrain has stopped. Nothing else. / FINISH the spread web full; the floating lump full - those are the two finished things; everything else flat fill and outline. 🔴 Water opaque, nothing below the surface. No letters or numbers. Plain ducks. / TONE one black point on a green plane and one wide-open web; nothing else in the picture is allowed to be dark.
```

### p12

```
--- p12 — 빙그르르가 없어요 ---
MOSS: the line is small and far back now, but still horizontal, still full width behind him, still the same ruler.
FOOT: not on stone - and the steps are still in frame behind him, small. This is not yet the ending.
TAR: out of frame on this page.
CAMERA wide, front-on, low angle at the waterline. / SUBJECT lower left, Duckling in POSTURE 10 moving toward the right of the frame, neck straight out, body low and level. 🔴 Under the surface both webs are drawn as UNFILLED INK OUTLINE, both fully spread, one pushed back and one coming forward - the same treatment as p5, and the difference from p5 is that neither one is stuck. Bill open. Far left by the steps, Old duck holding his place, neck up, bill open. / SETTING 🔴 TWO long straight white #F4F2EA wake lines running back from him - straight, not coiled; 0 ring marks. The steps and the moss band small at the back. Nothing else. / FINISH Duckling full; the two wake lines half; all else flat. 🔴 Water opaque, no layers, no reflection. No letters or numbers. Plain ducks. / TONE this is the first page in the book where a line is straight; let those two wakes cut the green plane cleanly.
```

### p13

```
--- p13 — 여기는 발이 안 닿아요 ---
MOSS: only a small fragment far away at the TOP of the frame with the steps - still horizontal, still the same green. 🔴 It must be far enough that no stone reaches the lower half.
FOOT: 🔴 not on stone, and THERE IS NO STONE ANYWHERE IN THE LOWER HALF OF THE PICTURE. Twelve pages have had something to stand on in reach; this one does not. That absence is the ending.
TAR: one small flat black shape still floating on the water somewhere in the upper half - the reader can find it.
CAMERA wide, high angle looking obliquely down at the water, a boat-length out from the steps. / SUBJECT centre, Duckling in POSTURE 11, floating still, head turned slightly toward the old duck. 🔴 Under the surface both webs are unfilled ink outline, opening and closing slowly, touching nothing. Beside him, Old duck POSTURE 5, level with him, facing the same way, his webs likewise unfilled outline touching nothing. / SETTING far at the top, the small steps and the moss fragment; the floating black lump; 🔴 the LOWER HALF OF THE FRAME IS THE FLAT GREEN AND NOTHING ELSE - 0 marks, 0 steps, 0 bottom, 0 ring marks. Do not darken it downward and do not add a gradient; it is empty because nothing is drawn there. / FINISH the two floating birds full; everything else flat fill and outline. No letters or numbers. Plain ducks, no hands, no clothes. / TONE the two straw-and-grey bodies are the brightest things left; the picture is mostly one green plane with nothing in it.
```
