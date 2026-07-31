# 창작동화 1000 — A-75 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/a75.md`. **대본은 한 글자도 안 고친다**(결함은 아래 처방표에서 그림으로만 교정).
> 배정 근거 = `changjak-assign-16.md` · 규격 = `_ANCHOR-SPEC.md` · 겹침 대조 = `_ANCHORS.md`.
> 🔴 **이미지 생성은 여기서 하지 않는다** · 🔴 **작가 실명 0**.
> 🔴 **실행 순서**: ① 시트 둘(StrawPup → BellEwe)을 **먼저** → ② `@image1` 붙여 **p1**(능선 노란 띠 세 뼘 · 양 다섯)을 굽는다 = 이 권의 **시계 눈금 0** → ③ p1 승인본을 ref 로 **p9**(빛 조각 하나)를 굽는다 = 눈금 끝 → ④ 그 셋으로 나머지 9컷. 🔴 **p1 의 띠 폭이 확정되기 전에 다른 컷을 굽지 마라** — 열두 쪽이 그 폭에서 깎여 나가는 것이 이 책의 시계다.

---

## A-75 §1. 앵커 배정

**권**: `a75` 「양이 한 마리씩」 (12쪽 · 4~6세 · 주제군 **A 마음·감정** · 엔진 **누적·반복** · 무대 카르파티아 양치 마을 · 주인공 새끼 양치기 개)

**한 줄**: 젖은 남색 워시가 **위에서 아래로 한 방향으로 내려오며** 능선의 노란 띠를 먹는다. 마른 획은 **앞발 옆 지푸라기뿐**이다. 앵커 슬러그 `changjak-ridgewash` — **C8 신규 민팅**.

**🔴 형제 권과 갈린 축** (첫 렌더에서 세어진다)

| 대상 | 갈린 축 | 판정 |
|---|---|---|
| **c02** `changjak-mistbleed` | **마른 선이 몇 개인가** | c02 는 쪽마다 여럿이고 p12 엔 화면 전체가 선을 갖는다 / **a75 의 마른 선은 그날까지 센 지푸라기뿐이고 최대 다섯**이며, p12 에 **하나**로 준다 |
| **c10** `changjak-riverpour` | **그린 선이 하나라도 있나 · 워시가 무엇을 하나** | c10 = 그린 선 0, 흘린 물감이 벼랑을 깎는다 / **a75 = 지푸라기라는 마른 선이 있고**, 워시는 **노란 띠를 먹는 한 방향 운동**이다 |
| **f08** `changjak-tubwater` | 색이 섞이나 | f08 = 넷이 섞여 불투명해진다(낮·실내·나무통) / **a75 = 한 색이 한 방향으로 내려온다**(밤·야외) |
| **b10** `changjak-floatwhite` | 🔴 **화면에 흰 것이 있나** | b10 = 하얗게 차는 통 셋 / **a75 = 0.** 이 책에서 가장 밝은 값은 노란 띠 #E0B65C 이고, 흰 물감도 안 칠한 흰 종이도 없다 |

**🔴 대본 SCENE 결함 3건 — 그림에서 교정한다**(대본은 안 고친다)

| # | 대본 | 문제 | 그림 처방 |
|---|---|---|---|
| 1 | p6·p9 「지푸라기 줄만 **옅게 반짝인다**」·「저 위 한 점만 노랗다」 | 반짝임을 하이라이트로 쓰면 **흰 것이 생겨** b10 과의 갈림축이 무너진다 | 반짝임 = **값을 한 단 올린 누런색 #C8A768**로만. 🔴 흰색·글로우·별광 0 |
| 2 | p10 「달빛도 없이 푸른 어둠 · **방울만 놋빛으로 반짝인다**」 | 같은 이유 + 금속 광택은 CG 로 착지한다 | 방울 = **놋빛 평면 #A9812F 하나 + 짧은 마른 획 1개**. 반사·후광 0 |
| 3 | p3·p6·p11 클로즈업 | 능선이 프레임 밖인데 컷에 띠 폭을 적으면 없는 것을 그리게 된다 | 해당 컷은 `WASH: not in frame` 으로 못박고, **대신 워시가 화면 위 가장자리에서 내려오는 방향만** 유지 |

**밀도 배급**: 🔴 **없다.** `DENSITY RATION = none` · `FINISHED THINGS PER PAGE = 2` 열두 쪽 고정. 사건이 **지푸라기 한 가닥**이라 배경이 이기면 책이 죽는다.

**의인화 등급 (열두 쪽 고정)**: 🔴 **전부 네발짐승** — 이족 0 · 손 0 · 옷 0. 개는 **입과 앞발 하나**로만 일한다(지푸라기를 물고, 앞발로 밀어 줄에 붙인다). 양은 네 발로 걷고 눕는다. 이 책에서 몸에 걸친 것은 **늙은 양의 놋방울 하나**뿐이다. 포즈가 안 되면 **등급을 바꾸지 말고 카메라를 낮춘다**.

**라인 충돌**: 호리 니들펠트 ✕(젖은 워시 · 양모·바늘땀·보풀 0 — 🔴 양이 나오는 책이라 **양털을 펠트로 그리는 순간 호리 라인**이다. `NOT` 절에 못박음) · 전래 점눈이 ✕(밝은 크림 종이가 아니라 **밤 남색이 지배면** · 빨강 0).

---

## A-75 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-ridgewash   (puppy sheepdog / Carpathian sheep village, one straw bed)

Style: 4-6 year old picture book. One straw bed by a fold gate at nightfall, twelve pages, camera
never leaves it. Painted wet: indigo runs DOWN the page all night and eats a yellow band off the
ridge; when it dries, a very few dry strokes are added, and they are all straw.

RENDERING (finish hierarchy): wet-in-wet washes on damp paper. The yellow ridge band #E0B65C is
  laid first; indigo #1E2A44 is poured along the TOP edge and allowed to run DOWNWARD into it, so
  the band's upper boundary is a bleeding front and the band loses width from above, page by
  page. 🔴 THE WASH ONLY EVER MOVES TOP TO BOTTOM - 0 radial glow, 0 light spreading outward from
  the bell or the doorway, 0 upward bleed. Nothing in this book has a drawn contour except the
  straws.
  DRY STROKES ARE STRAW AND NOTHING ELSE - the only dry-brush marks on any page. Counts: p1 0 ·
  p2 0 · p3 1 · p4 1 · p5 1 · p6 3 · p7 3 · p8 4 · p9 4 · p10 4 in the row plus 1 held in the
  mouth · p11 4 under the ewe with only the tips out plus 1 in the mouth · p12 1 loose on the
  ground. NEVER a sixth dry stroke, and never a dry stroke on fence, fleece, fur or slope.
  FINISHED THINGS PER PAGE = 2 (the puppy + the straw row, or the puppy + whoever comes through
  the gate). Everything else = one wet pass with no edge. Fold sheep = 1 rounded shape each, 0
  faces, 0 legs, at most 3 in any frame. Fence = 3-5 wet strokes. Gate = 2 planks. Slope = 1
  wash, 0 rocks, 0 trees, 0 grass marks. Depth = paler wash, never blur.
  DENSITY RATION = none. It never rises to 3 on any page.

PALETTE: night indigo #1E2A44 · ridge band #E0B65C · straw #C8A768 · brass bell #A9812F · dog
  coat warm brown-grey #6E5E4C · ewe fleece dull oat #B7A98E · deep dark #131B2C.
  🔴 THERE IS NO WHITE IN THIS BOOK - no white paint, no reserved white paper, no white
  highlight, no star, no moon, no breath. The brightest value on any page is #E0B65C, and after
  p10 the brightest thing is the straw. 0 red, 0 pink, 0 green.

CHARACTER DESIGN LANGUAGE: all animals are FOUR-LEGGED and unclothed - no standing upright, no
  hands, no held props, no hats. The puppy works with its MOUTH and ONE FOREPAW only: it carries
  a straw in its mouth and nudges the row straight with a paw. Sheep walk and lie on four legs.
  The only thing worn in the book is the old ewe's brass bell on a plain strap. Each animal has a
  dark rounded eye with a SEPARATE drawn brow so the face can act; no dot-eyes, no catchlight. If
  a pose fails, lower the camera - never change the grade.

CANVAS: 16:9 double-page spread. Bottom 18% left quiet for a caption. NO lettering, numerals,
  signage, brand or letterform anywhere - not on the gate, the fence or the bell.

NOT: no digital slickness of any kind - airbrush, gradient, glow, bloom, 3D CG, cel-shading,
  photographic, or a texture filter over the wash / no white anywhere, including highlights,
  sparkles, moon and stars / no felted wool, stitching, fibre edge or fleece drawn hair by hair -
  fleece is one wet shape / not sculpted clay and no drawn outlines on anything but the straws.
```

**🔴 매 컷 확인하는 세 줄** — `WASH:` `SHEEP:` `STRAW:`

| | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **띠 폭** | 세 뼘 | 두 뼘 반 | 프레임 밖 | 한 뼘 반 | 한 뼘 | 프레임 밖 | 손바닥 | 프레임 밖 | 조각 하나 | 🔴**0** | 프레임 밖 | 0 |
| **능선·비탈 양** | 5 | 4(1 중턱) | — | 4(2 하행) | 2 | — | 2 | — | 🔴**1(방울)** | 0(방울 양 중턱) | — | 🔴**0** |
| **마른 획** | 0 | 0 | 1 | 1 | 1 | 3 | 3 | 4 | 4 | 4+입 1 | 끝만+입 1 | 🔴**1** |

---

## A-75 §3. 캐릭터 시트 (🔴 이것부터 굽는다)

### 시트 1 — StrawPup

```
CHARACTER SHEET - StrawPup   (bake this FIRST, before any scene)

Same make as the book: wet-in-wet washes on damp paper, no drawn contour anywhere on the body -
the form is made by where the wash stops. Do not render smoothly and do not outline it.

FACE: young Carpathian shepherd pup, broad blunt muzzle, drop ears that fall beside the cheeks
  and can prick up at the tips. One dark rounded eye each side with a SEPARATE drawn brow above
  - the brow does the acting and must lift, pull together and go slack with sleep. Dark nose
  wash, one mouth line. No dot-eyes, no catchlight, no human expressions.
COAT: warm brown-grey #6E5E4C laid as ONE wet shape, deeper #4A4034 along the back and the ear
  edges where the wash pooled, paler at the muzzle and chest. 0 drawn hairs, 0 fluff outline, 0
  felted texture. Wet edges, soft everywhere.
BUILD & SILHOUETTE: puppy proportions - big head, thick short legs, loose paws. 🔴 FOUR-LEGGED,
  ALWAYS. It never stands on two legs and has no hands. Readable at thumbnail size from the
  curled-round silhouette alone.
WORKING PARTS (both needed every page): the MOUTH carrying a single straw crosswise, and ONE
  FOREPAW laid flat to nudge a straw sideways.
REFERENCE SHEET: side view curled tight in a ring with the tail over the forepaws, eyes half
  shut / same curl with the head snapped up and both ears turned to one side / a near top-down
  view of the head and two forepaws, muzzle lowered, lips just parted having set a straw down /
  side view lying with the chin flat on the forepaws, eyes shut / sitting up on the haunches,
  ears pricked, a straw held crosswise in the mouth; plus two close-ups - one forepaw pushing a
  straw sideways, and the face with the nose pressed into another animal's flank, eyes closed.
  Plain ground, no fold, no sheep. NO WHITE anywhere on this sheet.
SCENE token: StrawPup.
```

### 시트 2 — BellEwe

```
CHARACTER SHEET - BellEwe   (bake SECOND)

Same make: wet-in-wet washes, no drawn contour.

FACE: old ewe, long straight face, dark muzzle, ears held low and sideways. One dark rounded eye
  each side with a separate drawn brow; the eyes STAY OPEN on the last page while the puppy's
  are shut. Calm, never comic.
FLEECE: dull oat #B7A98E as ONE wet shape with two or three deeper pooled areas at the shoulder
  and haunch. 🔴 NOT WHITE and NOT CREAM - it must sit below the ridge band #E0B65C in value.
  0 curls drawn, 0 individual wool, 0 felted texture, 0 stitching, 0 fibre edge. If it starts to
  look like wool craft, flatten it back to one wash.
BELL: a plain brass #A9812F bell on a flat dark strap at the throat - the only worn object in the
  book. One flat shape plus at most one short dry stroke; 0 shine, 0 reflection, 0 glow, no
  clapper drawn, no lettering.
BUILD & SILHOUETTE: heavy, low, four-legged, older and slower than the flock; the bell hanging
  off-centre gives the silhouette its one asymmetry.
REFERENCE SHEET: side profile standing still, head level, bell hanging straight / side view
  walking downhill, weight forward, bell swung to one side / lying with the legs folded under,
  the bell resting on the ground and tipped over / rear three-quarter standing / plus one small
  full-body silhouette for far distance - ONE dark shape and one bell mark, nothing more. Plain
  ground. NO WHITE anywhere on this sheet.
SCENE token: BellEwe.
```

---

## A-75 §4. 12컷

각 컷 = `STYLE ANCHOR + @image1(StrawPup) + @image3(p1 승인본 = 눈금 ref) + 아래 블록`.
p9~p12 는 `@image2(BellEwe)` 를 더 붙인다.
🔴 **p1 을 가장 먼저** 굽는다(띠 폭 눈금 0) → **p9** 를 두 번째로(눈금 끝) → 나머지. 🔴 **p1 과 p9 의 띠를 나란히 놓고** 폭이 실제로 줄었는지 먼저 확인하고 나머지를 굽는다.

### p1

```
--- p1 — 이제 진짜 잘 거야 🔴 눈금 ref · 이 쪽을 가장 먼저 굽는다 ---
CAMERA: wide, very low - camera set at the height of the straw bed.
SUBJECT: StrawPup front RIGHT, curled into a ring on the straw with its tail over its forepaws,
  eyes half shut, gaze on its own toes.
WASH: 🔴 THIS PAGE SETS THE CLOCK. The indigo #1E2A44 has come down to just above the ridge, and
  a yellow band #E0B65C THREE HANDS WIDE is left along the ridge line. The band's top edge is a
  bleeding front, its bottom edge melts into the dark slope. Fix this width - every later page
  is measured against it.
SHEEP: 5 on the ridge, standing in the band as small dark shapes, evenly spaced, 0 faces, 0 legs.
  The slope below them is empty.
STRAW: 0 dry strokes. The bed is a wet straw-coloured wash #C8A768 with no edges yet.
SETTING: one corner of a log fence (3-5 wet strokes), a half-open plank gate, 2-3 rounded fleece
  shapes of sleeping sheep inside the fold.
FINISH: 2 (StrawPup + the straw bed). Fence, gate, fold sheep, slope = one wet pass.
TONE: the bottom of the page is sunk in indigo and only the ridge is warm - two layers of light
  at the end of a day, and no white anywhere.
```

### p2

```
--- p2 — 어? 아직 있었네 ---
CAMERA: medium, over the pup's shoulder toward the gate.
SUBJECT: front lower frame - StrawPup still lying but with its neck up and its head snapped
  round, both ears turned to the gate, eyes open. On the threshold - one sheep putting its
  forefeet down onto the straw, shouldering through the gap.
WASH: the band is down to TWO AND A HALF HANDS. The indigo has crept down a little further and
  the whole slope is one step darker.
SHEEP: 4 left on the ridge, and 🔴 one of those four is already partway down the slope - the
  reader can see where the next one comes from before it arrives.
STRAW: 0 dry strokes.
SETTING: the plank gate and the gap in it; a few loose straw shapes at the pup's feet as wet
  marks, not dry strokes.
FINISH: 2 (StrawPup + the arriving sheep). Gate, fence, ridge = one wet pass.
TONE: the inside of the gate is dark and the only warmth is the thin light coming through the
  gap. Nothing sparkles.
```

### p3

```
--- p3 — 하나 ---
CAMERA: close-up of the forepaws and the straw floor, looking slightly down.
SUBJECT: StrawPup's muzzle lowered into frame having just set a straw down, lips still parted;
  its two forepaws lie side by side, and the straw lies neatly beside them.
WASH: not in frame - but the indigo still runs downward from the top edge of the picture, so the
  upper part of the frame is the darkest and the floor lightens toward the bottom.
SHEEP: not in frame.
STRAW: 🔴 1 - THE FIRST DRY STROKE IN THE BOOK. One straw #C8A768 laid straight beside the paws,
  and it is the only mark on any page so far with a dry edge. Fix its length and weight here;
  every later straw matches it.
SETTING: the wet straw floor; the bottom rail of the fold gate clipped at the top corner.
FINISH: 2 (the muzzle and paws + the one straw).
TONE: the last low light of the day lies on that single straw and on nothing else - and it is
  a raised value #C8A768, never a white highlight.
```

### p4

```
--- p4 — 이제 진짜 잘 거야 ---
CAMERA: medium wide, eye level, the pup in front and the ridge behind in one frame.
SUBJECT: StrawPup front RIGHT, curled again with its eyes shut tight and its nose tucked between
  its forepaws.
WASH: the band is down to ONE AND A HALF HANDS. Compared with p1 the indigo now owns the upper
  two thirds of the page.
SHEEP: 4 on the ridge and slope, of which 🔴 2 are stepping down from the ridge - again the next
  arrivals are visible before they arrive.
STRAW: 1, beside the forepaws, unchanged from p3.
SETTING: gate, fence corner, empty slope.
FINISH: 2 (StrawPup + the straw). Ridge, sheep, gate = one wet pass.
TONE: the lower half of the page is fully indigo and only the band at the top is warm. The gap
  between the two is the whole picture.
```

### p5

```
--- p5 — 또? ---
CAMERA: medium, low angle looking up at the threshold.
SUBJECT: lower LEFT - StrawPup with its eyes open and both ears pricked, chin still down on the
  straw. On the threshold - two sheep coming in shoulder to shoulder, forefeet landing together.
WASH: the band is ONE HAND wide.
SHEEP: 2 left on the ridge.
STRAW: 1.
SETTING: gate planks; the fold fence behind.
FINISH: 2 (StrawPup + the pair of sheep). Gate, fence, ridge = one wet pass.
TONE: the little light left catches along the backs of the two sheep only, as a raised wash
  value, never a rim light and never white.
```

### p6

```
--- p6 — 둘, 셋 ---
CAMERA: close-up, looking down at the ground beside the forepaws.
SUBJECT: StrawPup's muzzle lowered, setting the third straw down; ONE FOREPAW laid flat on the
  two straws already there, nudging them straight. The brow fur is pressed down - it is fed up.
WASH: not in frame; the indigo still darkens the frame from the top down.
SHEEP: not in frame except one rounded fleece shape far back, out of focus by paleness only.
STRAW: 🔴 3, lying parallel in a row. Their length and spacing must match p3's straw exactly -
  this row is the book's counter.
SETTING: the wet straw floor and nothing else.
FINISH: 2 (the muzzle and paw + the row of three).
TONE: the light has almost gone; the row of straws is one step lighter than everything else and
  that is all the brightness the page gets.
```

### p7

```
--- p7 — 이제 진짜 잘 거야 ---
CAMERA: wide, eye level; most of the frame is dark slope.
SUBJECT: StrawPup front lower RIGHT, chin laid across both forepaws, eyes shut, body leaning a
  little toward the straw row.
WASH: the band is down to a PALM. The indigo now covers everything but that one strip.
SHEEP: 2, still standing inside the palm-sized band.
STRAW: 3.
SETTING: gate, fence corner, the empty slope between the bed and the ridge.
FINISH: 2 (StrawPup + the straw row). Ridge, sheep, gate = one wet pass.
TONE: indigo covers nearly the whole page and one small warm strip is left at the top. The
  distance between the dog and that strip is the page.
```

### p8

```
--- p8 — 넷… ---
CAMERA: medium close-up, low, with the pup and the threshold in one frame.
SUBJECT: LEFT - StrawPup with its eyes still SHUT, only its ears turned to the gate, ONE FOREPAW
  pushing the fourth straw sideways to join the row. RIGHT, on the threshold - one sheep setting
  a forefoot into the straw.
WASH: not in frame; the whole picture is near the bottom of the indigo run, so only forms are
  left.
SHEEP: 1 arriving. None visible on the ridge from this angle.
STRAW: 🔴 4 - the newest one still SLIGHTLY CROOKED, not yet flush with the other three. The row
  is the lightest thing in the frame.
SETTING: gate planks only.
FINISH: 2 (StrawPup + the four straws).
TONE: almost no light and only shapes left; the straw carries the last raised value on the page.
```

### p9

```
--- p9 — 저기 하나 남았다 🔴 눈금 끝 · 두 번째로 굽는다 ---
CAMERA: wide, from a low place behind the pup, looking up at the ridge.
SUBJECT: front lower frame - StrawPup with its neck stretched long and its head lifted to the
  ridge, hind legs still folded on the straw. Far upper frame - BellEwe in profile, standing
  inside the last scrap of light with its brass bell hanging.
WASH: 🔴 ONE SLIVER LEFT. Put this page beside p1 and the band has gone from three hands to a
  single scrap - that comparison is the book's clock and must survive at thumbnail size.
SHEEP: 1 - only BellEwe. The rest of the ridge and the whole slope are empty.
STRAW: 4, flush now.
SETTING: empty slope as one wash, 0 rocks, 0 trees.
FINISH: 2 (StrawPup + BellEwe in the sliver). Slope, straw, fence = one wet pass.
TONE: the bottom of the page is entirely dark and a single warm point sits far up. Keep the
  distance between the two big - and put no white in the point.
```

### p10

```
--- p10 — 천천히 와도 돼 ---
CAMERA: medium wide, eye level, cutting across the slope.
SUBJECT: lower RIGHT - StrawPup sitting up on its haunches with ONE STRAW HELD CROSSWISE IN ITS
  MOUTH, waiting, only the tail tip tapping the straw. Centre - BellEwe coming slowly down the
  middle of the slope, weight forward, the brass bell swung to one side.
WASH: 🔴 0. The sliver has gone out; the indigo has reached the bottom of the page and the ridge
  is the same colour as everything else. There is no warm value left anywhere except the straw.
SHEEP: 0 on the ridge; BellEwe alone on the slope.
STRAW: 4 in the row plus 1 held in the mouth.
SETTING: the bell = one flat brass #A9812F shape plus at most one short dry stroke. 🔴 no shine,
  no reflection, no glow, no moon, no stars.
FINISH: 2 (StrawPup + BellEwe). Slope, fence, gate = one wet pass.
TONE: blue dark with no moonlight in it. The brass and the straw are the only things a shade
  warmer, and they are wash values, not highlights.
```

### p11

```
--- p11 — 다 덮었잖아 ---
CAMERA: close-up, side on at straw height, the two of them lying side by side.
SUBJECT: RIGHT - BellEwe with its legs folded, lying down against the pup, its bell tipped over
  where it touches the straw. LEFT - StrawPup with its head lowered, looking down beside its own
  forepaws, mouth still open around the straw it is carrying.
WASH: not in frame; the indigo darkens the frame from the top down.
SHEEP: BellEwe only.
STRAW: 🔴 the row of 4 has gone UNDER the ewe's belly and only the tips stick out - the counter
  is still there and can no longer be read. Plus 1 in the mouth.
SETTING: straw floor, the fallen bell, the two bodies meeting.
FINISH: 2 (StrawPup + the straw tips under the ewe). BellEwe's body = one wet pass.
TONE: the only warmth in the picture is the line where the two bodies touch, made by the wash
  pooling one step lighter there. No white, no rim light.
```

### p12

```
--- p12 — 이제… ---
CAMERA: medium, pulled back a little, eye level, gate and slope both in frame.
SUBJECT: centre - StrawPup with its nose pushed into the ewe's flank and its eyes shut, mouth
  closed. BellEwe lying beside it with its EYES OPEN, looking ahead.
WASH: 0 warm value anywhere. The indigo has finished its run and covers the page from top to
  bottom in one continuous field.
SHEEP: 🔴 0 on the slope and 0 on the ridge - there is nothing left to come and nothing left to
  count.
STRAW: 🔴 1 - the straw it was carrying, set down on the ground in front of its nose, not
  counted onto the row. It is the only dry stroke on the page and the last one in the book; the
  row of four is invisible under the ewe.
SETTING: half-open plank gate, empty slope.
FINISH: 2 (StrawPup + the single laid-down straw). BellEwe, gate, slope = one wet pass.
TONE: all indigo. The two bodies are told apart only by the wash being a shade lighter along
  their outlines - no drawn edge, no white, no moon. The last dry mark in the book is one straw
  lying loose in front of a sleeping nose.
```
