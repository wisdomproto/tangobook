# 창작동화 1000 — B-53 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/b53.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## B-53 §1. 앵커 배정

**권**: b53 「그물에 걸린 파란 타일」 · 교환·연쇄 · 포르투갈 어촌 부두 끝 널빤지 한 칸 · 13쪽 · 4~6세
**클러스터**: C4 · **슬러그**: `changjak-delft` (**재사용** — 원본 f02. 앵커 원본 그림도 그대로 물려받는다)
**한 줄**: 흰 유약면 위 파랑 평칠. **윤곽 한 획 + 두 밀도의 평칠 · 음영 원천적으로 0**, 그늘은 색이 아니라 필름 한 겹.

🔴 **바꾼 것은 팔레트 hex · 관통 줄 3개 · 방향 한 줄뿐이다.** 공정 문단은 f02 그대로다.

🔴 **형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | 판정 |
|---|---|---|
| **f02** `changjak-delft`(원본) | **타일 문법이 화면 전부인가 조각 안인가** | f02 = 화면 전체가 유약면인 실내 책 · **b53 = 타일 문법이 건져 올린 조각 안에서만** 성립하고 널빤지·그물·바다는 젖은 회갈이다. 판정 한 줄 = **화면에서 파랑이 차지한 비율**(지배면 ↔ 손바닥만 한 조각 몇) |
| **d10**(그리스 항구) · **c08**(브르타뉴 해안) | **물이 무엇인가** | d10 = 잠긴 청록 바탕에 오린 배 · c08 = 회색 판지에 붙인 넷 · **b53 = 널빤지 틈으로만 보이는 한 조각**. 카메라가 널빤지 한 칸을 안 벗어난다 |
| **h02**(C4 · 검정을 틈 한 점에) | **두 번째 밀도를 어디에 쓰나** | b53 = 두 번 얹은 짙은 색이 **바다에만** 간다. 그것 말고 어디에도 안 쓴다 |

🔴 **이 권의 기계장치 = 널빤지 위에서 자라는 파란 판.** 0 → 1 → 2 → 여섯 → 여덟, 한가운데 한 칸은 끝까지 안 찬다. `TILE:` 줄에 쪽마다 그 수와 빈자리가 못박혀 있다 — 줄여 쓰지 마라.
🔴 **착지가 이 앵커의 최대 수확이다.** 음영이 0 이라 **빈 칸이 그림자로 파일 수가 없고**, 그래서 「비었다」를 색으로만 말할 수밖에 없다 — 마지막 쪽의 빈 칸은 널빤지 틈 아래 **두 번 얹은 짙은 파랑 한 칸**이다. 그림자로 파인 자리를 만들면 이 앵커가 아니다.
🔴 **조각 위 무늬는 문자로 안 읽히는 굵은 획 셋 이하**여야 한다(글자 금지와 별개 항목이고, 컷마다 반복한다).
🔴 **어촌은 비울 수 없는 무대라 반복으로 비운다** — 널빤지 줄·그물 마름모 도장·먼 흰 집 같은 네모 다섯. 꽉 찼는데 정보는 0.

**대본 SCENE 처방표** (대본은 안 고치고 컷에서 분기)

| 대본 문구 | 옮기는 법 |
|---|---|
| p2·p4·p8 「소금기가 뿌옇게 앉아 파랑이 흐리다」 | 🔴 **세 번째 파랑을 만들지 마라.** 소금기 = **윤곽 안을 안 채운 맨 흰 바탕**, 닦는 것 = 평칠이 들어가는 것 |
| p9·p13 「말라서 다시 조금 뿌옇다」 | 흐림이 없는 매체다 → **아무것도 하지 않는다.** 마른 여덟 = 미들 코발트 평칠, 젖은 한 칸 = 두 번 얹은 짙은 색. 갈림은 오직 두 밀도 |
| p4 「결이 부드럽게 풀린다」 · p6 「둘레를 부드럽게 눌러」 | 초점 흐림 없음 → 그 쪽만 **결 획 0**, 둘레는 **안 채운 윤곽**으로 |
| p12 「물속에 잠겨 흐릿해진다」 | **짙은 필름 한 겹을 하드 엣지로** 덮는다 — 문어 윤곽이 그 아래로 비친다 |
| p2·p8 「물방울이 알알이 밝다」 | 하이라이트 없음 → **안 채운 흰 바탕 동그라미**로 |

---

## B-53 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-delft

Style: a hand-painted picture-book page for 4-6 year olds - cool, clean, geometric. ONE plank bay at
  the end of a Portuguese quay, drawn thirteen times from morning to evening: DockKit fixes the map
  and only the camera moves.

RENDERING: painted the way a hand-painted tin-glazed tile is, on a smooth white glazed surface. ONE
  cobalt contour stroke laid once / FLAT FILL inside it in one pass to a hard edge / the WARM accent
  added last as a separate colour. EXACTLY TWO COBALT DENSITIES, mid and double-laid dark - never a
  third, never a gradient, NO SHADING. Bright = bare white ground; dark = ONE flat mid film with a
  hard edge over whatever is under it, which reads through. FINISHED THINGS PER PAGE = 2 (the kitten
  + the one thing she handles); all else keeps its contour with NO FILL - unpainted, not faded or
  blurred. DENSITY RATION = pages 1 and 9, objects recognisable and no further. Counts: plank joints
  = 6 lines, 0 knots, at most 2 grain strokes per plank · net = ONE repeating diamond stamp, 0 fibre ·
  sea = flat fill, 0 wave lines · brush marks per shard = at most 3 thick strokes, closing into no
  shape and reading as no letter.
  🔴 SALT IS NOT A COLOUR BUT AN UNFILLED SHAPE - a salted shard is bare white ground inside its
  cobalt contour, and wiping it is the flat fill going in. No misty third blue.
  🔴 NINE SQUARES ARE THE RULER - shards lock into a 3x3 grid of equal squares flat on the planks,
  never tilted, warped or resized; compare two things only at one depth.
  🔴 SHADOW IS NOT AVAILABLE, SO AN EMPTY SQUARE IS ONLY A DIFFERENT FLAT COLOUR - never a dip, a
  hole, a cast shadow or a darkened edge.

PALETTE: white #EFE9DA = glazed ground, bleached planks, salt, THE KITTEN'S WHOLE BODY · mid cobalt
  #1F6E8C = every contour AND the flat fill of every shard · double-laid dark #4A6B60 = THE SEA UNDER
  THE PLANKS AND NOTHING ELSE, one step deeper and greener than the shards · grey-brown #6E6155 = wet
  plank grain, net, piling, rope, the only dark note · red-brown #A85A3C = THE OCTOPUS AND NOTHING
  ELSE, the only warm colour on any page. No sixth colour, no sunset.

CHARACTER DESIGN LANGUAGE: 🔴 THE KITTEN IS ON ALL FOURS ON EVERY PAGE - belly down, sat back on her
  haunches, or braced on her hind feet to use her forepaws; she never walks upright, and wears no
  clothes and no collar, and has no fingers. 🔴 THE OCTOPUS STAYS AN OCTOPUS - arms coil, cling and
  slide; it never points, waves, gestures, stands or holds anything up. 🔴 SIZE LAW: the octopus is
  exactly the kitten's two forepaws put together, compared ONLY where both sit at one depth
  (p3 p5 p7 p10 p12).

CANVAS: 16:9 double-page spread. No lettering, numerals, boat names, buoy marks or signboards anywhere.

NOT (rendering only): no digital slickness of any kind - airbrush, gradient, glow, 3D CG, cel-shading,
  photographic, or a texture filter over flat colour / no shading, modelling, highlight or soft-edged
  shadow / not blurred or soft-focus / no felt, stitching, rope fibre or wood-grain photo texture.
```

### 🔴 이 앵커의 세 관통 줄

**`TILE:`** 널빤지 위 파란 칸 수와 빈자리 — 이 책의 계기판이다.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 | p13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 0 | 1 | 1 | 2 | 2 | 6 | 6 | 🔴 8 · 가운데 1칸 빔 | 8 | 8 | 8 | 🔴 8 · 가운데 칸이 짙은 파랑 |

**`HAUL:`** 그물이 무엇을 담았고 무거운가 — p11 에서 처음 가볍다.
**`GAP:`** 벌어진 널빤지 틈이 어디 있고 보이나 — p1 한 줄로 심고, p5·p7 에 지나가고, p13 에 한 칸이 되어 돌아온다.

---

## B-53 §3. 캐릭터 시트 (🔴 이것부터 굽는다 — 장면 금지)

### 시트 1 — KittenNet

```
CHARACTER SHEET - KittenNet   (bake this FIRST, attach as @image1)

Medium: STYLE ANCHOR changjak-delft - one cobalt contour stroke, flat fill in one pass, white glazed
ground, NO shading. Do NOT render this animal roundly or softly just because there is no background.

FACE
A young kitten's small blunt muzzle, one flat cobalt muzzle line, a small cobalt nose triangle,
4 whisker strokes per side and no more. 🔴 EYES: a ROUND DISC OF BARE WHITE GROUND with ONE SOLID
COBALT PUPIL and a cobalt UPPER LID LINE across the top. Draw the eyes in five states: wide (pupils
centred, discs at their widest) / squinting down at something close (lid line low) / one eye narrowed
in a puzzled squint / half shut and tired / narrowed to crescents by the lid line. No dot eyes, no
sparkle, no lashes, no blush, no eyebrows.
EARS: two flat triangles that swing - both pricked forward / one flicked back / 🔴 ONE LAID FLAT
SIDEWAYS (this one ear is the whole of the disappointment in this book).

BODY
ONE flat shape of BARE WHITE GROUND #EFE9DA with a mid-cobalt contour - she is unpainted, which is
what makes her the brightest thing on a grey-brown dock. 0 fur strokes, 0 tufts, 0 shading. A forepaw
= one flat white mitten with 3 toe notches. No clothes, no collar, no tag, no fingers.

🔴 THE ACTING IS POSTURE - draw the POSTURE STRIP, eight flat figures, all four-legged:
  1. flat on her belly along the planks, both forepaws gripping a net handle out past the edge, hind
     legs stretched straight back, chin almost on the wood;
  2. sat back on the haunches, body arched backwards, both forepaws hauling a handle to chest height,
     tail out straight behind for balance;
  3. 🔴 belly down, both forepaws reaching DOWNWARD with the toes SPREAD OPEN, palms up - carrying
     nothing, letting something go;
  4. sitting, leaning in, one forepaw wiping sideways across a flat square, the other pinning a corner;
  5. 🔴 the widest pose: sat back with the forelegs split left and right, LEFT forepaw pushing something
     away at full stretch, RIGHT forepaw setting something down flat;
  6. hind feet planted wide, both forepaws lifting a handle above the shoulder, belly pushed forward,
     head tipped back;
  7. 🔴 sitting with both forepaws laid on the planks, toes limp and open, shoulders dropped, back
     rounded, ONE EAR FLAT SIDEWAYS, tail slack on the wood;
  8. flat on her belly, forepaws folded under the chin, eyes half shut.

BUILD & SILHOUETTE
A small kitten, head one third of body length, short legs, a thin upright tail. Distinguishing point:
🔴 she is the only UNFILLED white mass in the book, findable on any page at thumbnail size.

REFERENCE SHEET
Plain white glazed background, figures floating, no ground, no shadow, no scenery, no lettering:
full body side / three-quarter from the front, low / from directly above lying flat / the eight-pose
posture strip / the three ear states / three head close-ups (wide, puzzled squint, half shut).
SCENE token: KittenNet.
```

### 시트 2 — OctoPup

```
CHARACTER SHEET - OctoPup   (bake this SECOND, attach as @image2)

Medium: STYLE ANCHOR changjak-delft - one cobalt contour, flat fill in one pass, NO shading.

BODY
ONE flat red-brown #A85A3C shape with a mid-cobalt contour - a rounded bag of a head-body and eight
arms. 🔴 THIS IS THE ONLY WARM COLOUR IN THE BOOK; nothing else on any page is red-brown. 0 suckers,
0 skin texture, 0 spots, 0 shading. An arm = one tapering flat stroke of fill.
FACE: two large ROUND DISCS OF BARE WHITE GROUND with ONE cobalt pupil each and nothing else - no
mouth, no brows, no cheeks. One small white bubble may leave the underside, at most 2 per page.

🔴 GRADE - IT IS AN OCTOPUS, NOT A CHARACTER: arms coil, cling, drape and slide. It NEVER points,
waves, beckons, gestures, stands, holds anything up, or sits like a person. No expression; the pupil
position is all it does.

🔴 SIZE: exactly as big as the kitten's TWO FOREPAWS PUT TOGETHER. Draw this comparison once on the
sheet - the octopus beside two white mittens at the same depth and scale, touching.

DRAW THESE STATES, each a separate flat shape:
  1. slack in a net, arms hanging out through the mesh;
  2. 🔴 half sunk: the body below the waterline covered by ONE flat film of double-laid dark with a
     hard edge, its red-brown contour reading through, ONE arm above the line curled round a white
     mitten;
  3. spilled out of a tipped net onto planks, arms first, body half on the wood, one arm still hooked
     in the mesh;
  4. sliding off a plank edge, three arms already under the flat film;
  5. sitting on the floor of an open net, arms spread flat and wide, one arm laid over a white mitten;
  6. 🔴 gone under except ONE arm tip above the film, bent once - and TWO flat rings of contour on the
     water around it, no more.

REFERENCE SHEET
Plain white glazed background, floating, no ground, no shadow, no scenery, no lettering: the six
states / the size comparison with two forepaws / three eye-disc close-ups (pupils up, to the side,
centred).
SCENE token: OctoPup.
```

### 시트 3 — DockKit

```
PARTS SHEET - DockKit   (bake this THIRD, attach as @image3 - this sheet fixes the map)

Medium: STYLE ANCHOR changjak-delft - cobalt contour, flat fill, two cobalt densities only, NO shading.
🔴 BAKE THIS OR THE GRID WILL DRIFT. Thirteen pages happen in this one bay and nowhere else.

DRAW THESE PARTS, each a separate flat shape on a plain white glazed ground:
  1. 🔴 THE PLANK BAY from straight above: 6 bleached grey-brown boards side by side, EXACTLY 6 joint
     lines, 0 knots, 0 nail heads, at most 2 grain strokes per board.
  2. 🔴 THE SPRUNG JOINT: ONE of those joints opened a finger's width with a STRAND OF DOUBLE-LAID
     DARK #4A6B60 inside it - the only place that density appears. Draw it three ways: a thin strand
     (far) / a hand-long line (near) / ONE FULL SQUARE of dark blue seen through the grid.
  3. 🔴 THE 3x3 BOARD: nine equal squares drawn flat on the boards, in five states - 1 filled / 2
     filled and locked / 6 filled with the CENTRE and two edge squares empty / 8 filled with ONLY THE
     CENTRE empty and grey-brown wood showing / 8 filled with the CENTRE a flat square of double-laid
     dark.
  4. 🔴 A SHARD, TWO STATES SIDE BY SIDE: (a) contour only, inside left as BARE WHITE GROUND = salted;
     (b) the same shard filled flat mid cobalt #1F6E8C = wiped. At most 3 thick cobalt brush marks
     inside a filled shard, 🔴 closing into no shape and reading as no letter. Broken edges are jagged:
     one shard's spike fits the next shard's notch - draw one matching pair.
  5. THE BIG SHARD: one piece exactly the area of two ordinary shards, salted (unfilled), jagged.
  6. THE NET: a small hand net, ONE repeating diamond stamp for the mesh, 0 knots, 0 fibre; four ways -
     hanging slack and empty / bellied heavy / tipped over and spilling / flat, limp and empty on wood.
  7. THE PILING: one squat post, its rope in 3 loops, nothing else on it.
  8. THE FAR SHORE: 5 identical white squares in a row, contour only, 0 windows, one roof line each.
  9. THE SEA: one flat field of double-laid dark, 0 wave lines; and one version with at most 6 unfilled
     white circles in it for spray.
🔴 No lettering, numerals, boat names, buoy marks or signboards on any part of this sheet.
```

---

## B-53 §4. 13컷

각 컷은 `STYLE ANCHOR + @image1(KittenNet) + @image2(OctoPup) + @image3(DockKit) + 아래 블록` 으로 합성한다.

### p1 — 오늘은 큰 놈을 잡을 거야 🔴 밀도 배급 1/2

```
--- p1 - 오늘은 큰 놈을 잡을 거야 ---
TILE: 0 shards. The nine squares are not drawn yet; the boards are bare.
HAUL: the net going down, empty, mouth open, its line running off the plank end into the water.
GAP: 🔴 the sprung joint crosses the middle of the bay showing ONE THIN STRAND of double-laid dark -
  the only blue on the page, and nobody in the story looks at it.
CAMERA: wide, eye level with the boards, the lens as low as a cheek laid on wood. Kitten frame left,
  planks running right and ending over water.
SUBJECT: KittenNet posture 1 - flat on her belly, both forepaws gripping the net handle out past the
  plank end, hind legs stretched back, chin nearly on the wood, pupils down at the water, ears
  forward, tail tip up. 4 legs, no clothes/collar/fingers.
SETTING: 6 plank joints, the piling with 3 rope loops, 5 identical far houses in contour only, and
  nothing else on the boards. No lettering, numerals or boat names.
FINISH: DENSITY RATION 1 of 2 - piling, net and far houses recognisable and no further. FINISHED =
  KittenNet + the net. The sea is one flat field.
TONE: low morning sun from the side, grain strokes long across the boards. 🔴 All dry grey-brown and
  unfilled white except that one dark strand in the joint.
```

### p2 — 물고기가 아니잖아

```
--- p2 - 물고기가 아니잖아 ---
TILE: 0 shards on the planks.
HAUL: 🔴 heavy - the net is clear of the water holding EXACTLY 1 salted shard and OctoPup, and no
  fish at all. The mesh sags under them.
GAP: below frame, not shown.
CAMERA: medium, LOW from the water looking up at the plank end; the net hangs against the sky.
SUBJECT: KittenNet posture 2 at upper centre - sat back on her haunches, body arched backwards, both
  forepaws hauling the handle to chest height, toes clamped, discs at their widest, mouth open, both
  ears forward, tail straight out behind. 4 legs, no clothes/collar/fingers.
SETTING: in the mesh, ONE paw-sized shard CONTOUR ONLY WITH THE INSIDE LEFT BARE WHITE (salted), and
  OctoPup with 3 arms trailing out through the mesh. Falling water = at most 9 unfilled white circles.
  The piling at the edge. No lettering, numerals or boat names.
FINISH: FINISHED = KittenNet + the loaded net. Far shore and sea stay contour with no fill.
TONE: from below the wet net stands against a bare white sky. 🔴 The only warm colour is the octopus
  and the only cobalt is contour - the blue board has not started.
```

### p3 — 또 만나

```
--- p3 - 또 만나 ---
TILE: 1 shard, filled, lying at the top frame edge beside the slack empty net.
HAUL: the net is empty and slumped on the boards, out of the action.
GAP: not in frame.
CAMERA: close-up, HIGH, straight down past the plank end at the water; the flat dark sea fills the
  lower half of the frame.
SUBJECT: KittenNet posture 3 entering from the top - the lower half of her face (pupils down, whiskers
  forward) and both forepaws reaching down with 🔴 THE TOES SPREAD OPEN, PALMS UP, not gripping.
  OctoPup at centre in state 2: below the waterline under ONE flat film of double-laid dark with a
  hard edge, contour reading through, ONE arm above the line curled round a white mitten, pupils up
  at her. It does not point, wave or gesture. 4 legs, no clothes/collar/fingers.
SETTING: 🔴 SIZE LAW - octopus and both forepaws at one depth and touching, so it reads exactly two
  mittens wide. 2 flat contour rings on the water, at most 4 white spray circles. No lettering.
FINISH: FINISHED = her paws + OctoPup. Nothing else carries fill.
TONE: the flat dark sea is the floor of the frame and the unfilled white paws and red-brown body are
  the only bright things on it. 🔴 Draw letting go, not holding - the open toes are the page.
```

### p4 — 우아, 파랗다

```
--- p4 - 우아, 파랗다 ---
TILE: 1 shard, HALF FILLED: 🔴 the swept half is flat mid cobalt, the unswept half is BARE WHITE
  GROUND inside the contour. The join between them crosses the middle of the frame.
HAUL: the empty net lies slack at the frame edge.
GAP: not in frame.
CAMERA: close-up, eye level with the shard lying on the boards - the lens at the height of the wood.
SUBJECT: KittenNet posture 4 at frame right - sitting, leaning in, ONE forepaw wiping sideways across
  the shard so the fill follows behind it, the other pinning the far corner. Nose almost on the shard,
  pupils down and close, discs wide, mouth slightly open, ears forward. 4 legs, no clothes/collar/fingers.
SETTING: at most 3 thick cobalt brush marks inside the filled half, 🔴 closing into no shape and
  reading as no letter. Jagged broken edge. Salt pushed into the joint = at most 7 white specks.
  🔴 THIS PAGE ONLY: 0 grain strokes on the planks. No lettering, numerals or boat names.
FINISH: FINISHED = KittenNet + the shard. Boards and net are contour with no fill.
TONE: everything empties out around the shard. 🔴 The event is colour arriving where the paw has been,
  so the filled/unfilled boundary is the sharpest edge on the page.
```

### p5 — 또 너야

```
--- p5 - 또 너야 ---
TILE: 2 shards. One filled from earlier; the second just rolled out, CONTOUR ONLY AND UNFILLED
  (salted), standing on edge where it stopped.
HAUL: 🔴 the net is tipped over on the boards, mouth down, everything already out of it.
GAP: 🔴 water from the tipped net runs along the boards and is SWALLOWED BY THE SPRUNG JOINT, which
  shows as a hand-long line of double-laid dark at lower frame.
CAMERA: medium wide, slightly HIGH - the bay flat, the two spilled things massed frame left.
SUBJECT: KittenNet sat back on her haunches at frame right, ONE forepaw still on the tipped handle,
  the other lifted to her chest; head thrust forward, discs wide, ears splayed sideways, tail kinked
  once. OctoPup state 3 at frame left - arms out first, body half on the wood, one arm still hooked in
  the mesh, pupils up at her, not pointing. 🔴 SIZE LAW - both at one depth, side by side. 4 legs,
  no clothes/collar/fingers.
SETTING: the piling, 5 far houses in contour. No lettering, numerals or boat names.
FINISH: FINISHED = KittenNet + OctoPup. One shard filled, one unfilled.
TONE: 🔴 three marks scattered on grey-brown boards, countable at a glance - two blues and one
  red-brown. Sun a little higher, grain strokes shorter than p1.
```

### p6 — 딱 맞아

```
--- p6 - 딱 맞아 ---
TILE: 2 shards, both filled flat mid cobalt, pushed together until the gap between them is one claw wide.
HAUL: out of frame.
GAP: not in frame.
CAMERA: close-up, straight DOWN - the boards become a flat floor with no depth at all.
SUBJECT: 🔴 only two white forepaws enter, one from each frame edge, each pushing a shard inward, toes
  flattened where they press the edges. At the top edge her nose tip and 4 whiskers, pupils down.
  4 legs (out of frame), no clothes/collar/fingers.
SETTING: 🔴 THE JOIN IS THE WHOLE PAGE - the left shard's jagged SPIKE and the right shard's jagged
  NOTCH are the same shape, so they can be seen to fit. Brush marks inside each shard = at most 3,
  🔴 not continuing across the join and reading as no letter. At most 7 white salt specks beside.
  🔴 THIS PAGE ONLY: the boards around the shards are contour with NO FILL. No lettering or numerals.
FINISH: FINISHED = the two shards + the paws. Nothing else is finished.
TONE: flat and vertical, like looking at a tabletop. 🔴 No shadow under the shards, so they lie on the
  boards rather than sit above them - two blues and the shape of the join are all there is.
```

### p7 — 한 앞발은 밀고 한 앞발은 놓고 🔴 이 책의 대표 컷

```
--- p7 - 한 앞발은 밀고 한 앞발은 놓고 ---
TILE: 🔴 6 shards, all filled - SIX squares blue, THREE empty: the CENTRE and two edge squares,
  grey-brown wood showing in all three.
HAUL: the wet net pushed back behind her, unused.
GAP: 🔴 the joint runs UNDER the board and passes directly beneath the empty CENTRE square. Nobody in
  the story sees this.
CAMERA: medium, HIGH over her shoulder, boards and water both in frame - 🔴 water left, blue board
  right, her body bridging them.
SUBJECT: KittenNet posture 5 - forelegs split wide, LEFT forepaw at full stretch pushing OctoPup's
  back off the plank end toward the water, RIGHT forepaw setting a filled shard flat on the board's
  edge, its underside already on wood. Head turned right, pupils down, tail straight behind. OctoPup
  lower left in state 4 - sliding off, three arms under the flat dark film, pupils up, not gesturing.
  🔴 SIZE LAW - both at one depth. 4 legs, no clothes/collar/fingers.
SETTING: 2 flat contour rings on the water. No lettering or numerals.
FINISH: FINISHED = KittenNet + the shard she sets down. OctoPup keeps fill, no finish.
TONE: 🔴 the frame splits - wet blue left, dry blue right, one animal spanning them, the going-down
  and the being-put-down in one posture. Sun high.
```

### p8 — 커다란 조각

```
--- p8 - 커다란 조각 ---
TILE: 6 shards, unchanged - CENTRE and two edge squares still empty, along the bottom frame edge.
HAUL: 🔴 heavy again - the net is at shoulder height holding THE BIG SHARD (exactly the area of two
  ordinary shards, CONTOUR ONLY, UNFILLED, jagged) with OctoPup lying across it, arms spread.
GAP: not in frame.
CAMERA: medium, LOW from the boards looking up; the loaded net hangs across the top of the frame.
SUBJECT: KittenNet posture 6 - hind feet planted wide and clamped, both forepaws lifting the handle
  above her shoulder, belly pushed forward, head tipped back, discs wide, mouth open, tail taut.
  OctoPup lies on the big shard inside the mesh, arms flat, pupils down; it holds and lifts nothing.
  4 legs, no clothes/collar/fingers.
SETTING: 🔴 the big shard and one ordinary shard are BOTH inside the mesh at one depth, so the doubled
  size can be read. Water off the net = at most 9 unfilled white circles falling onto the blue board.
  No lettering, numerals or boat names.
FINISH: FINISHED = KittenNet + the net's load. The board keeps fill but no finish.
TONE: midday sun straight down, grain strokes at their shortest. 🔴 The heaviest mass sits at the top
  of the frame with the blue board beneath it.
```

### p9 — 한 칸만 남았어 🔴 밀도 배급 2/2

```
--- p9 - 한 칸만 남았어 ---
TILE: 🔴 8 shards - the big shard just went into the last edge place and filled TWO squares at once,
  so eight of nine are blue and 🔴 ONLY THE CENTRE IS EMPTY, flat grey-brown plank.
HAUL: the empty net pushed aside at the frame edge.
GAP: 🔴 the joint crosses that square's floor, but the light is straight down and it reads as PLAIN
  GREY-BROWN WOOD with no dark blue in it. 🔴 This is the only difference between this page and p13 -
  change nothing else.
CAMERA: wide, HIGH from behind her; the 3x3 board fills most of the frame.
SUBJECT: KittenNet leaning over the board from the top, both forepaws on the two ends of the big shard
  pressing it home, hindquarters up, hind feet on bare planks outside the board, head bent over the
  centre, ears forward. 4 legs, no clothes/collar/fingers.
SETTING: DENSITY RATION 2 of 2 - net, piling and houses recognisable and no further. Brush marks
  per shard = at most 3, reading as no letter. No lettering or numerals.
FINISH: FINISHED = KittenNet + the big shard. The other seven keep flat fill.
TONE: 🔴 blue covers the frame and one grey square sits in the middle like a hole that is not a hole -
  flat, unshaded, a different colour and nothing more. The eye stops there.
```

### p10 — 빈손이야

```
--- p10 - 빈손이야 ---
TILE: 8 shards, centre square empty - the board caught along the bottom frame edge.
HAUL: 🔴 heavy but WRONG - the net holds OctoPup and NOTHING ELSE. 0 shards, 0 fish, and the mesh
  floor is drawn plainly visible and bare.
GAP: not in frame.
CAMERA: medium close-up, eye level; the open mouth of the net fills the centre of the frame.
SUBJECT: KittenNet at frame left, sitting, ONE forepaw pushed deep into the net mouth feeling along
  the bottom, the other holding the mouth open; head tilted, one eye in a puzzled squint, ONE EAR LAID
  FLAT SIDEWAYS, whiskers down. OctoPup state 5 at centre - sitting on the net floor, arms spread flat
  and wide, one arm laid over her white mitten, pupils up. It points at and indicates nothing.
  🔴 SIZE LAW - one depth. 4 legs, no clothes/collar/fingers.
SETTING: caught in the mesh, at most 5 weed scraps and 6 sand specks. No lettering or numerals.
FINISH: FINISHED = KittenNet + the empty net floor. Everything behind is contour with no fill.
TONE: low afternoon sun from the side, one flat hard-edged film over the inside of the net. 🔴 The
  largest single area in the frame is the bare net floor, so the nothing is read as a size.
```

### p11 — 이제 안 당길래

```
--- p11 - 이제 안 당길래 ---
TILE: 8 shards, centre square empty - the board across the lower frame, seen at an angle.
HAUL: 🔴 LIGHT FOR THE FIRST TIME - the net is dropped flat and limp on the boards, empty, spread
  wider than anything else in frame, its mesh stamp drying back to plain grey-brown.
GAP: not in frame.
CAMERA: medium wide, eye level with the boards.
SUBJECT: KittenNet posture 7 at frame left - sitting, both forepaws laid on the planks with the toes
  limp and open (the first page they hold nothing), shoulders dropped, back rounded, 🔴 ONE EAR FLAT
  SIDEWAYS, pupils turned away from the board toward the water, tail slack on the wood. 4 legs, no
  clothes/collar/fingers.
SETTING: OctoPup still on the plank edge with 3 arms hanging over the water, pupils on her, doing
  nothing. The piling, 5 far houses in contour. No lettering, numerals or boat names.
FINISH: FINISHED = KittenNet + the dropped net. The shards keep flat fill and no finish.
TONE: low sun from the side lays a long grain across the boards. 🔴 The biggest flattest thing on the
  page is the empty net - the weight that has gone is read as an area, and nothing new has arrived.
```

### p12 — 팔 끝만 흔들흔들

```
--- p12 - 팔 끝만 흔들흔들 ---
TILE: 8 shards, centre square empty - the board at frame centre beside her folded paws.
HAUL: the limp net pushed back behind, small now.
GAP: hidden under the board, not readable this page.
CAMERA: wide, eye level so the waterline and the plank surface cross the frame at one height.
SUBJECT: OctoPup lower left in state 6 - 🔴 the body already under ONE flat film of double-laid dark
  with a hard edge, its contour reading through, ONLY ONE ARM TIP above the film, bent once, with 2
  flat contour rings and no more. It does not wave; the arm is the last part above the line.
  KittenNet frame right in posture 8 - belly down beside the board, forepaws folded under her chin,
  eyes half shut, pupils toward the water, tail tip tapping the wood. 🔴 SIZE LAW - the last page
  they share a frame. 4 legs, no clothes/collar/fingers.
SETTING: no cast shadow exists in this book, so the piling is a long flat grey-brown shape lying
  across the boards. No lettering, numerals or boat names.
FINISH: FINISHED = KittenNet + OctoPup's arm tip. The board keeps flat fill, no finish.
TONE: 🔴 one red-brown going down at the left, eight blues staying at the right. The sea reaches full
  double-laid dark for the first time since p1.
```

### p13 — 여기가 제일 파래 🔴 착지

```
--- p13 - 여기가 제일 파래 ---
TILE: 🔴 still 8 - no new shard came. They ring the frame in flat mid cobalt.
HAUL: the empty net at the edge, contour only, no fill.
GAP: 🔴 THE PAY-OFF - the joint runs under the empty CENTRE square, which is now ONE FLAT SQUARE OF
  DOUBLE-LAID DARK #4A6B60 - the sea through the boards, 🔴 ONE STEP DEEPER THAN THE EIGHT SHARDS and
  the same blue that was a thin strand in p1. 🔴 NO SHADOW, NO DIP, NO HOLE - it is empty only because
  it is a different flat colour.
CAMERA: close-up, angled slightly HIGH, right down on the board; the eight shards make the border.
SUBJECT: only her nose tip, 4 whiskers and one half-shut eye at the top edge, pupil down into the
  square; ONE forepaw on the rim, toes easy and open. 4 legs, no clothes/collar/fingers.
SETTING: inside the dark square, at most 6 unfilled white circles and 🔴 nothing else - no reflection,
  no ripples. Brush marks per shard = at most 3, 🔴 reading as no letter. No lettering or numerals.
FINISH: FINISHED = her face + the dark square. The eight shards keep flat fill.
TONE: last low light. 🔴 Eight dry mid-cobalt squares and ONE wet double-laid dark square - the only
  moving thing on the page. The board was never filled and the frame never looked fuller.
```

---

## B-53 §5. 첫 렌더 검수 5항목

1. 🔴 **파랑 밀도가 둘인가** — 조각 전부가 같은 미들 코발트이고, 짙은 색이 **바다에만** 갔나. 세 번째 파랑(뿌연 중간색)이 생겼으면 실패다.
2. 🔴 **소금기를 안 채운 흰 바탕으로 냈나**(p2·p4·p8) — 회색이나 옅은 파랑으로 칠했으면 ref 를 다시 굽는다.
3. 🔴 **p13 의 빈 칸이 그림자로 파여 있지 않나** — 파였으면 이 앵커가 아니다. 평평한 색 한 칸이어야 한다.
4. 🔴 **화면에서 파랑이 조각뿐인가** — 널빤지·그물·말뚝·먼 집이 푸르게 물들었으면 f02 로 되돌아간 것이다.
5. 🔴 **고양이가 두 발로 서 있지 않나 · 문어가 가리키고 있지 않나 · 조각 무늬가 글자로 안 읽히나 · 글자가 어디에도 없나**(배 이름·부표·상자).
