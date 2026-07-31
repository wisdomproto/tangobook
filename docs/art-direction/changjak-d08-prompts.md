# 창작동화 1000 — D-08 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/d08.md`. **대본은 한 글자도 안 고친다** — 아래 14컷은 그 SCENE 을 그림 지시로 옮긴 번역본이다.
> 🔴 실행 순서: ① 시트 4장을 **먼저** 굽는다(장면 금지) → ② 승인본을 `@image` 로 붙여 **p1(기준 컷)** → ③ 그 두 장을 ref 로 나머지 13컷.
> 🔴 이미지 생성은 여기서 하지 않는다 · 🔴 작가 실명 없음(전부 문구).

---

## D-08 §1. 앵커 배정

**권**: `돌아오지 않는 연` (d08 · 14쪽 · 4~6세 · 주제군 **D 모험·여정** · 엔진 **여정과 귀환** · 무대 포르투갈 언덕 마른돌 담 · 주인공 새끼 양치기 개)

**한 줄**: 가는 잉크 윤곽 + 평칠 두 색(누런 마른 풀 / 마른돌 회색). **하늘은 안 칠한 종이**이고 화면의 절반이 넘는다. 빨강은 책 전체에 딱 두 개. 앵커 슬러그 `changjak-twored` — **신규 민팅**.

**형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | 판정 |
|---|---|---|
| **c01** `changjak-blackice` (C2) | 안 칠한 종이가 **둘러싸여 있나** | c01 의 흰 것은 칠한 면 **안에서만** 형태를 갖는다 / d08 의 안 칠한 종이는 **화면 위 모서리까지 열린 하늘**이고 그 안에 마크가 최대 2개다 |
| **c23** `changjak-shadeline` (C2) | 안 칠한 종이가 **몇 %인가** | c23 = 0% (두 색이 화면을 다 덮는다) / d08 = **55~65%** |
| **e11** `changjak-barnline` (C2) | 선이 **몇 굵기인가** | e11 = 굵고 뭉툭한 낙서 획 / d08 = **어디나 한 굵기**, 연줄도 윤곽선과 같은 굵기 |
| **c37** · **g04** | 빨강이 **몇 개이고 화면 어디 높이에 있나** | c37 = 1점이 열 쪽 내내 같은 자리 / g04 = 몸에 붙어 다닌다 / **d08 = 2로 시작해 하나가 하늘에서 없어지고, 남은 하나가 하늘 꼭대기에서 무릎으로 내려온다** |
| **e07** | 줄을 **무엇으로 그리나** | e07 = 화면당 굵은 한 획(장력) / d08 = **윤곽선과 같은 가는 선**, 계기판은 장력이 아니라 **보이는 길이** |
| **a75** · **d01** | 하늘을 **무엇이 차지하나** | a75 = 젖은 남색 워시가 내려와 덮는다 / d01 = 맨 종이에 **아무것도 안 뜬다** / **d08 = 같은 맨 종이에 빨간 점 하나가 떴다가 없어진다** |
| 전래동화 **점눈이**(하우스) | 매체·눈·빨강 셋 다 | 점눈이 = 색연필 낙서 + 점눈 + **화면당 즉석 발명 빨강 1점** / d08 = **딥펜 윤곽 + 평칠**(연필 결 0) + 동공 위치가 연기 시스템 + 빨강은 **책 전체에 이름 붙은 두 개**뿐 |

**🔴 대본 SCENE 처방표** — 매체에 없는 말은 뜻으로 옮긴다.

| 대본 | 이 매체에서 |
|---|---|
| p1 `흰 벽에 **붉은 지붕** 집 몇 채` | 🔴 **지붕을 회색으로 칠한다.** frontmatter `bodyColors` 가 「빨강은 연과 얼레 둘뿐」으로 못박았고 SCENE 한 줄과 충돌한다 — 상위 규칙을 따른다. 흰 벽 = 안 칠한 종이. (대본은 안 고쳤다) |
| p7 `흐릿하게 당나귀의 다리 넷` | 흐림이 없다 → **윤곽만 긋고 안을 안 채운다**(칠 0) |
| p6 `덤불 잎이 아주 살짝` / p10 `한 번 크게 흔들린다` | 정지 매체 → **기울어진 잎 획의 개수**(p6 = 2획 · p10 = 5획 + 떨어져 나온 1획) |
| p10 `하늘 쪽 채도를 한 단 떨어뜨려` | 하늘은 칠이 없어 채도를 못 내린다 → **풀 색을 한 단 회색 쪽으로**(`#C8AE6E` → `#BFAE84`), 하늘은 종이 그대로 |
| p8 `그림자가 아까보다 길게 눕는다` | 그림자 = 평평한 회색 도형 하나, **길이만 두 배**(부드러운 가장자리 금지) |
| p10 `빨랫줄에 흰 천 몇 장` | 흰 것 = 안 칠한 종이 → **윤곽만, 최대 4장** |

---

## D-08 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-twored   (a shepherd puppy / a Portuguese hilltop drystone wall)

Style: fine dip-pen ink contour + FLAT opaque colour in exactly two hues, 4-6 year old picture
book. Every shape is a closed ink outline filled with ONE flat pass - no modelling, no shading,
no gradient, no texture inside any shape. ONE line weight everywhere, the kite string included.

RENDERING (finish hierarchy): 🔴 THIS VOLUME: THE SKY IS BARE PAPER AND THE COUNT LIVES IN IT.
  The upper 55-65% of every spread is untouched cream paper #EFEAE0 - 0 wash, 0 blue, 0 clouds
  as volume, 0 hatching, 0 horizon haze, 0 extra birds. What is allowed to sit in that bare
  paper is listed per cut and is NEVER more than 2 marks; on most pages it is 0.
  FINISHED THINGS PER PAGE = 2 - the puppy and the one thing it handles on that page. Grass =
  6-9 leaning strokes per clump, at most 5 clumps in frame. Drystone wall = at most 14 stones
  outlined, the rest one flat grey. Thornbush = at most 12 strokes, always at the right edge.
  Far village = at most 5 roof shapes, 0 windows, 0 doors, 0 people. Sea = 1 line. Cast shadow
  = ONE flat grey shape per figure, hard-edged, length stated per cut.
  DENSITY RATION = none. p1 and p12 are the widest cuts but not the fullest; nothing rises.

PALETTE: paper & sky #EFEAE0 · dry grass #C8AE6E · drystone grey #8E8878 · red #C0342B.
  🔴 EXACTLY TWO RED OBJECTS EXIST IN THE WHOLE BOOK - the kite and the wooden reel. Nothing
  else on any page is red, orange, pink, terracotta or warm: not a roof, not a flower, not a
  tongue, not a collar, not the goat, not the light. 🔴 The far village roofs are DRYSTONE GREY
  and its walls are BARE PAPER. From p5 to p14 there is exactly ONE red left in the book.

CHARACTER DESIGN LANGUAGE: an eye is an open ink circle with a solid ink oval inside it, and
  🔴 THE PUPIL'S POSITION INSIDE THAT CIRCLE IS THE ENTIRE ACTING SYSTEM - pressed to the TOP of
  the circle while the head is up, dropped to the BOTTOM only where a cut says so. Mouth = one
  ink line. No blush, no catchlight, no eyebrows, no tears, no sweat drops. Ear angle and body
  lean carry everything else.
  🔴 FIXED GRADE, ALL 14 PAGES: animals stay animals - no clothes, no fingers, no shoes, no prop
  but the reel. The puppy moves on four legs and sits up to hold the reel between two forepaws;
  the donkey foal and the kid goat are on four legs on every page.

CANVAS: 16:9 double-page spread, image runs to all four edges. No caption band, no border, no
  quiet strip anywhere. A Portuguese hilltop: dry ochre grass, one low drystone wall, one
  thornbush at the right edge, a white village and one line of sea far below.

NOT (rendering only): NOT airbrushed, gradient-shaded, glossy 3D, cel-shaded or photographic.
NOT a painted sky - no blue, no rendered cloud volume, no gradient at the horizon.
NOT a second line weight - no thick brush stroke for the string, no bold outline for emphasis.
NOT letters, numbers, signs, symbols or map marks anywhere.
```

---

## D-08 §3. 캐릭터 시트 (🔴 이것부터 굽는다)

### 시트 1 — PupDog

```
CHARACTER SHEET - PupDog   (bake FIRST, before any scene)

Same medium as the book: fine dip-pen ink contour filled with flat opaque colour, one line
weight, no shading inside any shape. Plain cream paper #EFEAE0 behind, no scenery.

FACE: a young Portuguese sheepdog pup. Blunt short muzzle, one ink line for the mouth, a small
  solid ink nose. EYES = an open ink circle each with a solid ink oval inside; 🔴 the pupil sits
  at the TOP of the circle when the head is up and at the BOTTOM when the head is down - that
  move is the whole book. No blush, no catchlight, no eyebrows.
COAT: flat dry-grass ochre #C8AE6E body with a flat drystone-grey #8E8878 saddle patch across
  the back and grey ear tips. Two flat colours only - 0 fur strands drawn, 0 shading. Ears are
  soft triangles that fall, prick and pin back.
BUILD: short-legged, round-chested pup, head large for the body. Silhouette must read at thumb
  size and stay distinct from the donkey foal and the kid goat.
SHEET: full body standing four-legged, side / sitting up with both forepaws held out at belly
  height as if clamping a spool / sitting on a low wall, hind legs hanging / standing on hind
  tiptoe with the neck fully craned up; plus four head close-ups - pupils UP and mouth open
  (shouting), pupils UP under a forepaw held to the brow like a visor, pupils UP with eyelids
  half down and ears sideways (bored), 🔴 pupils DOWN at the bottom of the circles with the
  eyes wide (the only down-look in the book).
🔴 No clothes, no fingers, no shoes, no letters or numbers. NO RED ANYWHERE ON THIS SHEET.
SCENE token: PupDog.
```

### 시트 2 — TheTwoReds (RedKite · RedReel)

```
CHARACTER SHEET - TheTwoReds   (bake SECOND, attach as @image2)

Same medium. These two objects are the ONLY red things in the entire book; every cut that shows
red shows one of these and nothing else. Flat opaque red #C0342B, ink outline, no highlight,
no gloss, no gradient, no glow spilling onto anything nearby.

RedKite: a plain diamond kite, flat red, one ink cross-spar, one short ink tail. It is only ever
  drawn small - at its largest the size of the pup's eye, at its smallest a bare dot. No pattern,
  no face, no letters on it.
RedReel: a small wooden hand spool - two round flat-red end cheeks with a plain spindle between
  them. 🔴 THE TWO RED CHEEKS NEVER CHANGE COLOUR OR SIZE; only the coil between them grows.
  THREE STATES, draw all three side by side:
    EMPTY - bare spindle, a wide gap between the cheeks, light in the paws (p1-p11)
    HALF  - the coil half fills the gap (p13)
    FULL  - a fat coil of wound line fills the gap flush with the cheeks, the drum reading heavy
            and the paws sagging under it (p14)
  The wound line is drawn as the same single-weight ink line, unfilled - it reads pale because
  nothing is painted inside it.
STRING: one continuous single-weight ink line, unfilled, no thickness change ever, no motion
  blur, no speed lines.
SHEET: kite at three scales next to a PupDog silhouette for calibration, the three reel states in
  a row, and one close-up of two forepaws clamping the EMPTY reel at belly height.
🔴 No letters or numbers on any object.
SCENE tokens: RedKite, RedReel.
```

### 시트 3 — DonkeyFoal · KidGoat

```
CHARACTER SHEET - DonkeyFoal and KidGoat   (bake THIRD, attach as @image3)

Same medium - ink contour, flat colour, one line weight. Draw both on one plain cream sheet at
correct relative scale beside a PupDog silhouette. Their silhouettes must separate instantly.

DonkeyFoal: a small grey donkey foal, flat drystone grey #8E8878 with a paler muzzle and belly
  left as bare paper. Long ears twice the head's length - THE EARS ARE ITS ACTING (both up alert,
  one flopping sideways, both flat back while yawning). Round barrel body, four short legs, a
  tuft tail. Eyes as in PupDog: circle + pupil. Deadpan, never sad, never instructive.
KidGoat: 🔴 NOT A CHARACTER - it has no lines and no will in this book; it is a physical event
  that happens to the string. Flat ochre #C8AE6E body, grey legs and muzzle, two tiny straight
  horn buds, a short upright tail, rectangular pupils in the eye circles. 🔴 It never looks at
  the pup, never reacts to being shouted at, never tilts its head, never softens its posture.
  It stands square on four legs and CHEWS - jaw offset sideways, the ink string passing into the
  side of its mouth. No comforting pose, no gift-giving pose, no eye contact on any page.
SHEET: each in full side view / DonkeyFoal lying flat on its back with all four legs folded up /
  DonkeyFoal half risen on its front legs / KidGoat standing square chewing a line, side and
  three-quarter, and one close-up of the jaw with the line entering the mouth corner.
🔴 No clothes, no fingers, no collars, no bells, no red on either animal. No letters or numbers.
SCENE tokens: DonkeyFoal, KidGoat.
```

---

## D-08 §4. 14컷

각 컷 = `STYLE ANCHOR + @image1(PupDog) + @image2(TheTwoReds) + 아래 블록`. 당나귀·염소가 나오는 컷엔 `@image3` 추가.
관통 줄 셋 = `SKY:`(안 칠한 종이 안의 마크 수) · `RED:`(개수 + 화면 높이) · `LINE:`(보이는 줄의 길이).
🔴 `LINE:` 은 **그림에만 있는 단서다** — 글은 끊긴 줄을 한 번도 안 짚는다.

### p1 — 하늘 삼분의 이 · 빨강 둘 (기준 컷)

```
--- p1 --- kite at its highest
SKY: bare paper, upper two thirds. 2 marks in it - the small red kite at the top right and the
  single ink string running down from it.
RED: 2. Kite HIGH in the top third, no bigger than the pup's eye. RedReel LOW at belly height.
  🔴 The village roofs are GREY, not red.
LINE: full and taut, unbroken from the reel to the kite, crossing the bare paper, one weight.
CAMERA: wide, low angle from just below, horizon low.
SUBJECT: lower left - PupDog braced, hind feet split front and back into the dirt, body leaning
  back, both forepaws clamping the EMPTY RedReel against its belly, chin thrown right up, pupils
  at the TOP of the eye circles, mouth open. Right and behind - DonkeyFoal on four legs, both
  ears up, aimed at the same sky.
SETTING: a knee-high drystone wall cutting once across the frame; dry grass all leaning one way;
  one thornbush at the right edge; far below a white village - bare-paper walls, GREY roofs, at
  most 5 shapes - and one grey line of sea.
FINISH: 2 - PupDog and RedReel. Wall, grass and village stay flat colour.
TONE: dry bright Atlantic light. Each figure gets ONE short hard-edged flat grey shadow.
🔴 Animals stay animals - no clothes, no fingers. No letters, numbers or signs anywhere.
```

### p2 — 앞발이 밀린다

```
--- p2 --- the wind gets bigger
SKY: bare paper, upper half. 1 mark in it - the string, taut, leaving through the top corner.
  The kite is out of frame. 0 clouds.
RED: 1, and it is LOW - the RedReel clamped at the pup's belly. No other red.
LINE: one taut straight run from the reel out through the upper corner, one weight, no bend.
CAMERA: medium, side on, child's eye level; both bodies tilt as one leaning column.
SUBJECT: left - PupDog laid almost flat backwards, both forepaws skidding, TWO short scored
  ink marks in the dirt ahead of its toes, ears and cheeks blown back, eyes narrowed to slits
  with the pupils still at the top. Right behind it - DonkeyFoal braced forward, forelegs
  planted, forehead pushed into the pup's back.
SETTING: drystone wall behind; grass all bent one way, 5 clumps at most; thornbush at the right
  edge, its strokes untilted.
FINISH: 2 - PupDog and RedReel. The donkey stays flat colour.
TONE: bright and dry; two hard-edged flat grey shadows, both short.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers. No speed lines.
```

### p3 — 툭 · 줄이 끊긴다

```
--- p3 --- the line snaps
SKY: barely in frame and completely empty - 0 marks. The kite is out of frame.
RED: 1, LOW - the RedReel, rolled off the paws onto the pup's knees.
LINE: 🔴 SLACK for the first time. The snapped line lies loosely along the grass in front of the
  forepaws in two soft loops, one weight, and its broken end is IN FRAME here - the last page it
  will be.
CAMERA: medium, high angle looking down; ground fills the frame.
SUBJECT: centre - PupDog sat flat on its rump with both hind legs shot forward, both forepaws
  still frozen in the clamping shape but empty and up in the air, the RedReel resting on its
  knees. Eyes and mouth wide open rounds, pupils at the TOP. Right - DonkeyFoal pitched a step
  forward out of its brace, neck stretched long.
SETTING: bare dirt and grass, one run of drystone wall along the top of the frame.
FINISH: 2 - PupDog and the slack line it has just lost.
TONE: the page where something tight went loose. Same bright light, shadows short and hard.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers. No impact stars.
```

### p4 — 하늘에 삼켜진다 🔴 빨강이 둘인 마지막 쪽

```
--- p4 --- swallowed by the sky
SKY: bare paper, three quarters of the frame. 🔴 EXACTLY 1 mark in it - a red dot at the upper
  right, the smallest the kite is ever drawn. 0 clouds, 0 birds, 0 haze.
RED: 2, and this is the last page with two. Kite = a bare dot at the very TOP of the frame.
  RedReel = at the pup's feet, LOW. 🔴 From p5 on, only the reel is left in the whole book.
LINE: the broken end is wound twice round one raised forepaw and drops from there to the grass,
  where it runs off toward the right edge; the far end is already out of sight.
CAMERA: wide, low angle from behind, so the pup's back of the head and the sky are seen together.
SUBJECT: lower centre from behind - PupDog stretched up on the tips of its hind toes, neck fully
  craned back, one forepaw raised with the line wound twice round it, the other hanging loose.
  Beside it - DonkeyFoal, head up but ONE ear already flopping sideways.
SETTING: a thin band of ground at the bottom only - wall, grass, thornbush at the right edge.
FINISH: 2 - PupDog and the wound-on line.
TONE: wide and empty. The only two saturated things on the page are that dot and the reel.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers.
```

### p5 — 담에 걸터앉는다 🔴 단서 심음

```
--- p5 --- the wind will bring it back
SKY: bare paper, upper half, 🔴 0 marks. From here to the end of the book nothing is drawn in
  the sky at all.
RED: 1, on the KNEES - the RedReel held on the lap with both forepaws.
LINE: 🔴 longest visible run of the whole plant. It spills from the lap, crosses the grass to
  the right and DISAPPEARS INTO THE THORNBUSH; the far end is not visible. One weight, gently
  curved, drawn without emphasis - it must not be pointed at.
CAMERA: medium wide, side on, child's eye level.
SUBJECT: left - PupDog sat on the drystone wall with both hind legs hanging down the face of it,
  the EMPTY RedReel held on its knees by both forepaws, chin still tipped up, pupils at the TOP.
  Right - DonkeyFoal leaning its rump against the wall, tail swung once against its flank.
SETTING: the wall runs the width of the frame; dry grass, at most 5 clumps; the thornbush at the
  right edge, at most 12 strokes; far below, the grey-roofed village.
FINISH: 2 - PupDog and RedReel.
TONE: dry afternoon, wide and quiet. Only the grass reads as moving.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers.
```

### p6 — 차양 ① 구름이야

```
--- p6 --- "over there! something white!"
SKY: bare paper, 1 mark only - a single cloud drawn as a CLOSED INK OUTLINE with nothing painted
  inside it, so it is bare paper too. 0 shading, 0 second cloud.
RED: 1, LOW - the RedReel on the knees, pressed down by one forepaw.
LINE: 🔴 shorter than p5. Same route from lap to thornbush, but less of it is on the grass.
CAMERA: medium close-up, eye level, the two heads side by side.
SUBJECT: left - PupDog still sat on the wall, one forepaw pressed flat to its brow as a visor,
  eyes squeezed to slits with the pupils at the TOP, aimed at one spot in the sky; the other
  forepaw holds the reel down on its knees. Right - DonkeyFoal mid-yawn, mouth wide, eyes shut
  to two ink curves.
SETTING: drystone wall; grass; the thornbush at the right edge with 🔴 exactly 2 of its strokes
  tilted out of line - nothing else in the bush moves.
FINISH: 2 - PupDog and the outlined cloud it is staring at.
TONE: flat midday brightness; the one unfilled cloud is the brightest thing besides the sky.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers.
```

### p7 — 풀을 아삭아삭 끊는다

```
--- p7 --- the grass runs out, the sky does not change
SKY: not in frame.
RED: 1 - the RedReel set down beside the knees, at the frame's lower edge.
LINE: one segment crosses the frame from left to right past the paws; neither end is visible.
  🔴 It is not touched, not looked at and not emphasised - the pup's eyes are elsewhere.
CAMERA: close-up, high angle over the shoulder; forepaws and grass fill the middle of the frame.
SUBJECT: centre - PupDog's two forepaws pulling up a fistful of dry grass, one blade held in the
  mouth and being bitten through. Only the chin and the upturned eyes clip the top edge of the
  frame, pupils at the TOP. Behind, out of focus in this medium's terms: 🔴 DonkeyFoal's four
  legs drawn as INK OUTLINE ONLY with nothing painted inside them.
SETTING: earth, a few small stones, and a pile of at most 12 bitten grass stubs by the feet.
FINISH: 2 - the forepaws and the grass they hold.
TONE: low ochre, close and small. Everything beyond arm's reach is left unfilled.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers.
```

### p8 — 차양 ② 갈매기야 (p6 좌우 반전)

```
--- p8 --- "over there! something white!" "a gull."
SKY: bare paper, 1 mark only - a gull drawn as a CLOSED INK OUTLINE, unfilled, small, high left.
RED: 1, LOW - the RedReel on the knees.
LINE: 🔴 shorter again than p6. Same lap-to-thornbush route, less of it on the grass.
CAMERA: medium, eye level, 🔴 composed as the mirror image of p6 - the pup now on the RIGHT.
SUBJECT: right - PupDog twisted round on the wall to face the other way, the OTHER forepaw
  pressed to its brow as a visor, back hunched forward, tail hanging down the wall face, pupils
  at the TOP. Left - DonkeyFoal not lifting its head at all, only its pupils rolled that way.
SETTING: drystone wall; dry grass; the thornbush still at the RIGHT edge - it does not mirror.
FINISH: 2 - PupDog and the outlined gull.
TONE: light one step lower. 🔴 Each flat grey shadow is now twice as long as on p6, still hard
  edged, still one shape per figure.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers.
```

### p9 — 반 바퀴만 감아 본다

```
--- p9 --- "not going?" "not going."
SKY: bare paper, 🔴 0 marks. Completely empty.
RED: 1 - the RedReel up on the wall in the pup's paws, held at the top of the frame.
LINE: 🔴 noticeably shorter than p8 - the shortest so far. It leaves the reel, crosses a short
  stretch of grass and enters the thornbush at the right edge.
CAMERA: medium wide, very low angle, taken from the height of the lying donkey.
SUBJECT: bottom of frame - DonkeyFoal flat on its back, all four legs folded up in the air, ears
  splayed on the ground. Upper frame at the wall - PupDog sat holding the EMPTY RedReel in both
  forepaws and turning it carefully HALF a turn; eyes still up, pupils at the TOP.
SETTING: the drystone wall along the upper third; crushed grass under the donkey's back; the
  thornbush at the right edge.
FINISH: 2 - PupDog and RedReel.
TONE: afternoon gone yellow. Nothing in the frame is happening; the sky above is all bare paper.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers.
```

### p10 — 차양을 내린다 🔴 줄이 가장 짧다

```
--- p10 --- "…it isn't a white thing."
SKY: bare paper, 🔴 0 marks.
RED: 1 - the RedReel on the knees, the visor paw coming down onto it.
LINE: 🔴 SHORTEST of the whole book. Only a short stretch shows on the grass before it enters
  the thornbush.
CAMERA: medium close-up, eye level; the pup's face and the falling forepaw fill the centre.
SUBJECT: centre - PupDog dropping the visor paw halfway down toward the RedReel on its knees,
  arm caught in mid-fall, both ears laid sideways, mouth closed to one flat ink line, eyelids
  half down over eyes whose pupils are still at the TOP. Lower corner - DonkeyFoal watching the
  pup from where it lies.
SETTING: drystone wall; far below among the village houses a washing line with at most 4 white
  cloths, each drawn as an UNFILLED OUTLINE; the thornbush at the right edge with 🔴 5 strokes
  tilted out of line and 1 stroke shaken loose - the biggest movement the bush ever makes.
FINISH: 2 - PupDog and the reel its paw is landing on.
TONE: low and yellow. 🔴 The GRASS drops one step greyer here (#BFAE84); the sky stays bare paper.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers.
```

### p11 — 얼레가 저 혼자 돈다 🔴 처음으로 아래를 본다

```
--- p11 --- the reel turns by itself
SKY: not in frame.
RED: 1, and it FILLS more of the frame than on any page since p1 - the RedReel, close up on the
  knees, mid-turn.
LINE: 🔴 PULLED TAUT for the first time since p2 - straight and tight from the reel out through
  the right edge of the frame. Not slack, not curved, one weight.
CAMERA: close-up at knee height, eye level, tight and near.
SUBJECT: centre - the RedReel turning on the pup's knees with both forepaws pressed down flat on
  top of it to stop it. 🔴 The pup's face clips the top of the frame and for the FIRST TIME it is
  aimed DOWNWARD, not at the sky - eyes wide open with the PUPILS DROPPED TO THE BOTTOM of the
  circles. This is the only page in the book where the pupils are low.
SETTING: a few stones of the wall, dry grass at the feet, nothing else.
FINISH: 2 - the forepaws and RedReel.
TONE: near and narrow. The reel's red is the only fully finished thing on the page.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers. No motion lines, no
  spin arcs - the turn reads from the paws pressing down.
```

### p12 — 담 위에 올라선다 · 염소

```
--- p12 --- "hey! that's my line!"
SKY: bare paper, upper half, 🔴 0 marks.
RED: 1 - the RedReel left on the wall top, small and low in the frame.
LINE: taut all the way from the wall to the goat's mouth, straight, one weight, its whole run
  visible for the first time since p2.
CAMERA: wide, from behind and over the pup's shoulder on the wall, looking toward the thornbush.
SUBJECT: left - PupDog up on the drystone wall on all four legs, neck thrust forward, mouth wide
  open shouting, one forepaw planted on the far edge of the wall. Below - DonkeyFoal half risen
  on its forelegs, looking the same way. 🔴 Right, small and low beside the thornbush - KidGoat
  standing square on four legs with the line in the side of its mouth, jaw offset, chewing. It
  does not look at the pup and its face shows nothing.
SETTING: the drystone wall, dry grass between wall and bush, the thornbush at the right edge.
FINISH: 2 - PupDog and the taut line. The goat stays flat colour.
TONE: low yellow light. 🔴 Pup and goat sit at the SAME depth so their sizes read correctly -
  the goat is a little smaller than the pup.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers.
```

### p13 — 팔을 돌려 감는다

```
--- p13 --- "…this one is coming."
SKY: bare paper, 🔴 0 marks.
RED: 1 - the RedReel in the HALF state, the coil half filling the gap between its two red cheeks.
LINE: shortening. A single taut span between the pup and the goat, clearly shorter than on p12.
CAMERA: medium wide, side on, eye level, 🔴 pup and goat at the two ends of the frame at the SAME
  depth.
SUBJECT: left - PupDog back astride the wall, one forepaw holding the RedReel, the other swung
  out in a big circle winding the line on; one corner of the mouth line curled up, the other flat;
  pupils at the TOP again. Right - KidGoat walking across the grass toward the pup with the line
  still in its mouth, jaw chewing, expression blank, not looking at the pup. Below - DonkeyFoal
  sat up and turning its head.
SETTING: grass flattened under the goat's feet; the drystone wall; the thornbush behind, emptied.
FINISH: 2 - PupDog and the half-wound RedReel.
TONE: warm late light. 🔴 The sky stays entirely bare paper - nothing has come back into it.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers. No motion arcs.
```

### p14 — 가득 감긴 얼레 · 착지

```
--- p14 --- the reel is heavy and the sky is empty
SKY: bare paper across the top of the frame, 🔴 0 marks. Nothing has returned to it.
RED: 1, at its LOWEST and its largest - the RedReel in the FULL state on the pup's knees, the
  wound coil flush with the two red cheeks, the drum fat, the forepaws visibly sagging under it.
LINE: 🔴 only one short span left, from the reel to the goat's mouth, being drawn gently out
  between two toes. 🔴 Its far end carries NOTHING - no kite, no knot, no tail, no fray.
CAMERA: medium close-up, slightly high angle; knees and reel in the centre of the frame.
SUBJECT: centre - PupDog sat on the wall with both forepaws round the fully wound RedReel on its
  knees, one paw easing the last span of line out of the goat's mouth. 🔴 Its eyes are on the
  reel, pupils LOW in the circles. Beside it - KidGoat sat against the wall, jaw still working,
  face blank. Behind - DonkeyFoal standing, turned toward the village below.
SETTING: the drystone wall, dry grass, and above them nothing but bare paper.
FINISH: 2 - PupDog and RedReel.
TONE: low warm light gathered on the knees; the whole top of the frame is wide, quiet and empty.
🔴 Animals stay animals - no clothes, no fingers. No letters or numbers.
```

---

## 첫 렌더 검수 체크리스트 (5항목)

1. **하늘이 안 칠한 종이인가** — p1~p14 전부. 파랑·구름 볼륨·그라데이션이 한 쪽이라도 있으면 되굽는다.
2. **하늘 안의 마크를 센다** — p1=2 · p2=1 · p4=1 · p6=1(윤곽 구름) · p8=1(윤곽 갈매기) · **나머지 전부 0**.
3. **빨강을 센다** — p1·p4 만 2, 나머지 전부 1. 🔴 마을 지붕이 빨갛게 나오면 실패다(대본 p1 문구에 끌린 것).
4. **줄의 길이가 p5 → p10 으로 짧아지는가** — 다섯 장(p5·p6·p8·p9·p10)을 나란히 놓고 잰다. 굵기는 다섯 장 다 같아야 한다.
5. **동공 위치** — p11·p14 만 아래, 나머지 열두 쪽은 위.

## 🔴 대본에 보고할 것 (고치지 않았다)

- **p1 SCENE `붉은 지붕 집 몇 채`** 가 frontmatter `bodyColors` 의 「빨강은 연과 얼레 둘뿐」과 충돌한다. 컷에서는 지붕을 회색으로 칠해 상위 규칙을 지켰다. 대본을 손보려면 SCENE 쪽 문구다.
</content>
</invoke>
