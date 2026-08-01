# 창작동화 1000 — A-08 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/a08.md`. **대본은 한 글자도 안 고친다**(결함은 아래 처방표에서 그림으로만 교정).
> 배정 근거 = `changjak-assign-16.md` · 규격 = `_ANCHOR-SPEC.md` · 겹침 대조 = `_ANCHORS.md`.
> 🔴 **이미지 생성은 여기서 하지 않는다**(사용자가 GPT 로 굽는다) · 🔴 **작가 실명 0**.
> 🔴 **실행 순서**: ① 시트 셋(KitBun → KitBunWhite → PapaBun)을 **먼저** 굽는다 → ② `@image1` 붙여 **p8**(판 위 · 닳은 자리 둘)을 굽는다 = 이 권의 **판 ref** → ③ p8 승인본을 ref 로 나머지 12컷. p5·p9·p13 은 반드시 p8 승인본을 붙인다(같은 판, 같은 두 자리).

---

## A-08 §1. 앵커 배정

**권**: `a08` 「할머니가 두고 간 웃음」 (13쪽 · 4~6세 · 주제군 **A 마음·감정** · 엔진 **여정과 귀환** · 무대 포르투갈 해변마을 빵집 안 · 주인공 새끼 토끼)

**한 줄**: 꿀빛 나무판 위에 **체로 뿌린 흰 가루**가 화면의 흰 것 전부이고, 마스크로 가린 **손바닥 두 자리에만 안 앉아** 판이 드러난다. 앵커 슬러그 `changjak-floursift` — **C3 신규 민팅**.

**🔴 형제 권과 갈린 축** (첫 렌더에서 세어진다)

| 대상 | 갈린 축 | 판정 |
|---|---|---|
| **d18** `changjak-steamplate` | **흰 것에 가장자리가 있나** | d18 흰 판은 통째로 딱 선 하나 / **a08 흰 것은 가장자리가 0**이고, 닫힌 가장자리를 가진 것은 **정확히 두 자리**(안 앉은 자리)뿐 |
| **b09** `changjak-werkstatt` | **나뭇결이 드러난 자리가 몇 군데인가** | b09 는 화면 전체를 관통 / **a08 은 정확히 둘**. 드러내는 법도 반대다(긁어낸다 ↔ 처음부터 안 얹힌다) |
| **e01** `changjak-drypaper` | **흰 것이 종이인가 얹은 것인가** | e01 = 안 그린 크림 종이(빼기) / **a08 = 실제로 뿌린 불투명 가루(더하기)**. 밀가루가 나는 쪽도 e01 은 내내, a08 은 **p10·p11 둘뿐** |
| **f02** `changjak-delft` | **코발트가 화면의 몇 %인가** | f02 는 화면 전체가 코발트 평칠 / **a08 은 문틀·화덕 둘레 두 자리, 그 밖은 0**. 🔴 포르투갈이라고 아줄레주로 가면 f02 와 같은 물건이 된다 |

**🔴 대본 SCENE 결함 4건 — 그림에서 교정한다**(대본은 안 고친다)

| # | 대본 | 문제 | 그림 처방 |
|---|---|---|---|
| 1 | p2·p13 「흐릿하게 걸린다」(할아버지) | 이 매체엔 흐림이 없다. 흐리게 칠하면 가루 마감과 싸운다 | **마감을 안 준다** — 윤곽 한 겹만, 안은 안 채움. 컷의 `FINISH:` 에 명시 |
| 2 | p3 창밖 「맑은 파랑 바다」 | 코발트가 **셋째 자리**로 새면 「파랑은 두 자리」가 깨진다 | 바다 = **#A9BFC4**(더 옅고 차가운 회청). 코발트 #3A6EA5 는 문틀·화덕 둘레에만 |
| 3 | p11 「알갱이가 빛을 받아 반짝인다」 | 반짝임 = 디지털 글로우로 착지한다 | 반짝임 금지. **낱알 최대 24개**의 밝기 차로만. 후광·별광 0 |
| 4 | p10 「밀가루가 막 위로 솟아오르기 시작한다」 | 앵커의 「나는 쪽은 p11 하나」와 충돌 | 앵커를 **p10·p11 둘**로 확정하되 p10 은 **손목보다 낮은 띠**로 못박음 |

**밀도 배급**: 🔴 **밀도를 안 올리는 권이다.** `FINISHED THINGS PER PAGE = 2` 열세 쪽 고정. 단 **p5 한 쪽만** 둘째 마감 자리를 소품이 아니라 **닳은 자리 둘**에 준다(독자만 먼저 본다). 3으로 올리지 않는다.

**의인화 등급 (열세 쪽 고정)**: 둘 다 **이족 · 앞발이 손 · 간단한 옷**(할아버지=밀가루 묻은 앞치마와 챙 없는 모자 / 새끼 토끼=작은 조끼). 얼굴은 토끼 그대로(긴 귀·갈라진 입·짧은 코). 포즈가 안 되면 **등급을 바꾸지 말고 토끼의 포즈를 바꾼다**.

**라인 충돌**: 호리 니들펠트 ✕(2D 인쇄 판 · 양모·바늘땀 0) · 전래 점눈이 ✕(점눈 아님 = 눈썹 있는 그린 눈 · 「화면당 빨강 1점」 규칙 안 씀 · 지지면이 크림 종이가 아니라 **꿀빛 나무판**).

---

## A-08 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-floursift   (young rabbit / Portuguese seaside bakery, one room)

Style: 4-6 year old picture book. One bakery room, visited corner by corner. Made the way the
room is made - a honey wood board, white flour sifted over it, two places masked so the board
shows through.

RENDERING (finish hierarchy): the support is a honey-toned wood plank #C79A5C, its grain
  running under every page. The room is laid on it in thin opaque passes. THE WHITE IS NOT
  PAINTED - it is dry white powder shaken through a screen over the finished plate, thick where
  it settles, thin where the board wins, and it HAS NO EDGE ANYWHERE: no white outline, no white
  shape, no white highlight, no white line. Before sifting, two palm-sized patches are masked;
  powder never reaches them and the bare board reads through. THOSE TWO ARE THE ONLY CLOSED
  EDGES INSIDE ANY WHITE ON THE PAGE - find a third and remove it.
  FINISHED THINGS PER PAGE = 2 (the rabbit + the one thing it touches that page). Everything
  else gets one flat pass and no contour. Lime wall = 0 marks. At most 4 props per page and a
  prop never gets finish. Wood grain = 5-9 long lines per plank face, never hair-fine.
  Flour is AIRBORNE on two pages only - p10 (a low band at the dough edge, never higher than
  the wrist) and p11 (the burst). Every other page = 0 airborne grains, except p13 where at
  most 9 single grains hang. No sparkle, no glow, no star shapes: grains differ in size only.
  DENSITY RATION: p5 only, and it does not rise to 3 - on p5 the second finished slot goes to
  THE TWO WORN PATCHES instead of a prop, because the reader must see them before the rabbit
  does. Every other page stays at 2.

PALETTE: board #C79A5C · sifted flour #F7F4ED · lime wall #EDE8DD · oven fire #C96A2E · fur
  warm grey-brown #9C8C7C · apron and vest #E4DCCC · shadow #7A5F44.
  COBALT #3A6EA5 exists in EXACTLY TWO places in the whole book - the tiles round the door
  frame and the tiles round the oven arch - and 0 places besides. Sea through the window =
  #A9BFC4, paler and greyer, never cobalt. Orange is fire only: 0 orange skies, 0 orange rims
  on fur, wood or wall.

CHARACTER DESIGN LANGUAGE: both rabbits are bipedal, front paws used as hands, simple clothes.
  Rabbit faces stay rabbit - long ears, cleft lip, short muzzle - with a dark rounded eye and a
  SEPARATE drawn brow above it so the face can act. No dot-eyes, no catchlight, no human nose,
  no shoes. If a pose fails, change the rabbit's pose, never the grade.

CANVAS: 16:9 double-page spread. NO lettering, numerals,
  signage, shop sign, price, date or letterform anywhere - not on sacks, tins, the oven mouth,
  the door or the window.

NOT: no digital slickness of any kind - airbrush, gradient, glow, 3D CG, cel-shading,
  photographic, or a texture filter dropped over flat colour / no blur or haze, including
  things "seen faintly" - unfinished means contour only, never soft focus / no white paint,
  white ink, white highlight or sparkle: every white on the page is sifted powder / not felt,
  stitched wool or sculpted clay.
```

**🔴 매 컷 확인하는 세 줄** — `HEIGHT:` `FLOUR:` `WORN:`

| | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 | p13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **HEIGHT** | 아이레벨 | 로우 | 어깨너머 | 로우 | 🔴하이 | 강한 로우 | 바닥 | 어깨너머 | 비스듬 하이 | 로우 | 정면 | 아이레벨 | 🔴톱다운 |
| **판 위** | 안 보임 | 안 보임 | 안 보임 | 안 보임 | 🔴**보임** | 안 보임 | 안 보임 | 보임 | 보임 | 보임 | 가려짐 | 보임 | 보임 |
| **WORN** | 0 | 0 | 0 | 0 | 🔴**둘(독자만)** | 0 | 0 | 🔴**둘(토끼가 봄)** | 둘(앞발 밑) | 가려짐 | 가려짐 | 자국만 | 🔴**둘(앞발 포갬)** |

---

## A-08 §3. 캐릭터 시트 (🔴 이것부터 굽는다)

### 시트 1 — KitBun

```
CHARACTER SHEET - KitBun   (bake this FIRST, before any scene)

Same make as the book: flat opaque passes on a honey wood plank #C79A5C, grain reading through,
drawn contour left open in places. Do not render smoothly just because there is no room behind.

FACE: young rabbit, rounded skull, short muzzle, cleft upper lip. One dark rounded eye #2E2620
  each side with a SEPARATE drawn brow above - the brows do the acting and must lift, pull
  together and tilt unevenly. Nose = a small #7A5F44 wedge, one mouth line, three whiskers a
  side. No dot-eyes, no catchlight, no human nose.
FUR: warm grey-brown #9C8C7C, one step deeper #7A5F44 on back, haunch and ear backs; ear insides
  a shade warmer. Fur clump = 3-5 strokes, at most 12 on the whole animal. CLEAN STATE - no
  flour anywhere on this sheet, paws bare #9C8C7C.
CLOTHES: one small sleeveless vest, cream #E4DCCC, three flat panels and two seam lines, no
  buttons, no pattern, no lettering. Bare feet.
BUILD & SILHOUETTE: small, upright on hind legs, four heads tall; two long ears that stand
  straight up, flag back, or lie flat down the back; short round tail. Beside PapaBun it is half
  his height - the height gap is the whole reason he cannot see the board top.
REFERENCE SHEET: front idle, paws clasped at chest, ears straight up / three-quarter turn,
  reaching one paw forward / side view on tiptoe, both paws up on a ledge, ears up / back view
  sitting flat on the floor, legs forward, ears fallen over the back; plus three close-ups -
  hopeful (brows high, mouth open), let down (ears half back, brows together, mouth shut),
  looking steeply up (chin lifted, throat long, eyes wide). Plain board ground, no scenery.
SCENE token: KitBun. Never write "Bun" alone.
```

### 시트 2 — KitBunWhite

```
CHARACTER SHEET - KitBunWhite   (same animal, floured; bake SECOND with KitBun attached)

IDENTICAL FACE, EARS, BUILD, VEST and FUR COLOUR as KitBun - attach the approved KitBun sheet
and change only what is listed. Same board, same passes, same drawn contour.

FLOUR: sifted white powder #F7F4ED settled ON TOP of the fur - heavy across the nose bridge,
  brow ridge, ear insides and both forepaws to the wrist; thin on chest and shoulders; none on
  the back. It has NO EDGE: it thins away, it is never a painted white shape and never a white
  outline. The two forepaws are the whitest thing on the animal.
FACE UNDER IT: unchanged and still readable - the eyes and brows are NOT dusted over.
REFERENCE SHEET: front, shoulders shaking with laughter, eyes crescent, mouth wide open, ears
  thrown back / three-quarter, both paws pressed down on a surface, floured to the wrist / a
  paws-only view from straight above, the two forepaws stacked one on the back of the other,
  white to the wrist; plus one close-up - eyes screwed shut, ears flat back, muzzle lifted,
  powder just landing. Plain board ground. No sparkle, no glow.
SCENE token: KitBunWhite.
```

### 시트 3 — PapaBun

```
CHARACTER SHEET - PapaBun   (bake THIRD)

Same make and support as KitBun.

FACE: older rabbit, longer muzzle, heavier brow, the same cleft lip. Dark rounded eyes with
  separate brows; crow's-foot creases at the outer corner, two only. He never grins - his warm
  expression is the eye corner folding and the shoulders dropping.
FUR: the same warm grey-brown #9C8C7C but greyed one step at muzzle, cheeks and ear edges;
  clump = 3-5 strokes, at most 12 on the animal.
CLOTHES: a floured apron #E4DCCC to the shin, one waist tie, two flat pockets, no pattern, no
  lettering; a brimless soft cap the same cream. Flour caught in the apron creases, edgeless.
BUILD & SILHOUETTE: twice KitBun's height, heavy shoulders, slight stoop, ears carried back and
  low - he reads as an adult at thumbnail size purely from the stoop and the low ears.
REFERENCE SHEET: front idle, both paws on a rolling pin / three-quarter, pushing the pin away,
  head down, eyes on his own paws / side view, hands lifted off the pin, head turned over the
  shoulder to speak, eye corners folded / back view, stooped, cap and shoulders only; plus two
  close-ups - speaking quietly (mouth barely open, eyes on the listener), watching still (mouth
  shut, eye corners folded, brows level). Plain board ground.
SCENE token: PapaBun.
```

---

## A-08 §4. 13컷

각 컷 = `STYLE ANCHOR + @image1(KitBun) + @image4(p8 승인본 = 판 ref) + 아래 블록`.
p11·p12·p13 은 `@image2(KitBunWhite)`, p1·p2·p5·p8·p12·p13 은 `@image3(PapaBun)` 을 더 붙인다.
🔴 **p8 을 가장 먼저** 굽는다(판 ref). p5·p9·p13 은 p8 승인본이 없으면 굽지 마라 — 세 쪽이 같은 판, 같은 두 자리다.

### p1 — 소리 나는 데를 다 가 볼래요

```
--- p1 — 소리 나는 데를 다 가 볼래요 ---
CAMERA: wide, LOW child's-eye level set at KitBun's height, early morning.
SUBJECT: KitBun centre, standing upright on the bare floor in the middle of the room, spine
  straight, both paws clasped at the chest, chin slightly lifted, eyes wide and searching the
  air, both ears straight up with the tips tipped a little forward.
HEIGHT: at this height the board shows its SIDE FACE only - its top surface is out of frame.
FLOUR: settled flat on the board's side face; 0 airborne.
WORN: not visible, 0 on this page.
SETTING: white lime room. Right wall = plank door in a cobalt #3A6EA5 tile surround, small
  brass bell above it. Back wall = small sea window. Left wall = arched wood oven in a cobalt
  tile surround, orange #C96A2E fire in its mouth. Centre = the thick honey board. These four
  places stay put for all thirteen pages. One low wooden box pushed into the shadow under the
  board. Sea beyond the window = #A9BFC4.
FINISH: 2 (KitBun + the empty floor he stands on). PapaBun behind the board, rolling, head
  down: CONTOUR ONLY, no finish. Props = 4.
TONE: a room with no sound in it - the only thing moving is the rolling pin far back, and the
  small rabbit stands alone in a wide empty floor.
```

### p2 — 여기다! (문)

```
--- p2 — 여기다! (문) ---
CAMERA: medium, slight low angle; the whole door fills the RIGHT, KitBun hangs off it.
SUBJECT: KitBun braced with both feet apart, BOTH PAWS gripping the door handle, whole body
  swinging it - torso tipped back, heels lifted, back bowed like a bow, both ears flung back
  from the recoil, eyes wide, mouth open.
HEIGHT: child's eye; the board is out of frame entirely.
FLOUR: none airborne, none on him; a thin settled film along the door's bottom rail.
WORN: 0.
SETTING: plank door in the cobalt #3A6EA5 tile surround - one of the book's only two cobalt
  places. The small brass bell knocked sideways and still swinging. The door leaf lifted out
  of its frame so a gap opens down the jamb. A few sand grains blown under the door. Wall
  right of the door = 0 marks.
FINISH: 2 (KitBun + the door). PapaBun's back and rolling pin at the far LEFT edge: CONTOUR
  ONLY, unfinished, NOT blurred - he is not looking over.
TONE: the loudest thing so far and it is the wrong sound; the swinging bell and the sprung gap
  are sharp, and his face has already fallen.
```

### p3 — 여기다! (창)

```
--- p3 — 여기다! (창) ---
CAMERA: medium close-up, over the shoulder - we look out of the window past KitBun's head.
  His back of head and both ears fill the LEFT foreground; the open window and outside fill
  the RIGHT.
SUBJECT: KitBun up on his toes, BOTH PAWS on the sill, head and shoulders pushed right out of
  the window, back stretched long, one hind foot off the floor, both ears swivelled toward the
  sound, profile only, mouth open.
HEIGHT: child's eye at the sill; the board is out of frame.
FLOUR: dry salt bloom on the sill reads like flour but is 0 airborne.
WORN: 0.
SETTING: outside - white roofs stepping down, the sea beyond in pale cool #A9BFC4, one small
  boat at the water's edge, TWO gulls crossing the window with their beaks open. Cobalt = 0 on
  this page: neither the door nor the oven is in frame.
FINISH: 2 (KitBun + the window opening). Roofs, boat and gulls = one flat pass each, no
  contour on the roofs.
TONE: the daylight side is bright and the room side is cool and dark; the gulls' open beaks
  make it plain why he thought it was here.
```

### p4 — 여기다! (화덕)

```
--- p4 — 여기다! (화덕) ---
CAMERA: close-up, low angle; the arched oven mouth big on the RIGHT, KitBun small at the LEFT.
SUBJECT: KitBun crouched on the floor, both paws round his knees, body tipped sideways so ONE
  long ear is laid almost against the oven mouth - that ear's inside glows red-warm from the
  fire; the other ear stands up. Eyes narrowed, mouth pursed.
HEIGHT: child's eye, crouched; the board is out of frame.
FLOUR: 0 airborne, none on him.
WORN: 0.
SETTING: the arched wood oven in its cobalt #3A6EA5 tile surround - the book's second and last
  cobalt place. Logs burning orange #C96A2E inside, ash dropping, flame tips drawn inward. One
  long wooden peel leaning at the mouth, two round loaves on the shelf beside it.
FINISH: 2 (KitBun + the oven mouth). Peel and loaves = flat pass, no contour. Props = 3.
TONE: the warmest, noisiest corner in the book and still the wrong sound. The fire-lit inside
  of his ear is the reddest, sharpest thing on the page.
```

### p5 — 조용한 방 🔴 독자만 먼저 본다

```
--- p5 — 조용한 방 🔴 독자만 먼저 본다 ---
CAMERA: WIDE, HIGH ANGLE from near the ceiling, straight down into the room - the first page
  where the board top is visible.
SUBJECT: KitBun lower centre, dropped flat on the floor with both legs out in front, both paws
  planted behind him so he leans back, head sagging, BOTH EARS fallen back along his spine.
  PapaBun upper frame behind the board - cap crown, stooped back, the pin moving.
HEIGHT: high angle. The board top spreads across the upper half of the frame.
FLOUR: lying flat and even over the whole board top; 0 airborne.
WORN: 🔴 THE PLANT. Two palm-sized patches side by side mid-board where the powder never
  settled and the bare honey board reads through, rubbed smooth - the only closed edges in any
  white here. KitBun is on the floor and cannot see them; the reader can.
SETTING: empty white floor filling half the frame, the dough at one end of the board, the
  wooden box in shadow beneath, door and oven cropped at the edges.
FINISH: 2 - the second slot is THE TWO WORN PATCHES, not a prop, and it does not rise to 3.
  PapaBun and the dough = flat pass, no contour.
TONE: no sound on this page. Only the pin moves; the two worn patches hold the eye without
  anyone pointing at them.
```

### p6 — 저 위는 한 번도 못 봤어

```
--- p6 — 저 위는 한 번도 못 봤어 ---
CAMERA: strong LOW angle from the height of a rabbit sitting on the floor - the board's side
  face walls off the whole upper frame.
SUBJECT: KitBun lower LEFT, still sitting, HEAD TIPPED FULLY BACK to look up - throat stretched
  long, chin high, one paw braced on the floor and the other laid flat on the board's side,
  both ears fallen back over his shoulders, eyes wide, mouth a little open.
HEIGHT: 🔴 the reason for the whole book - from here the board top is invisible. Above its
  front edge there is only bright window light and NO forms at all.
FLOUR: caked white down the board's side face, one small trickle spilled over the front edge;
  0 airborne.
WORN: 0 - blocked by the board itself.
SETTING: honey board side face with its grain and old dents, the wooden box in shadow beneath,
  PapaBun's elbow clipped at the very top of frame.
FINISH: 2 (KitBun + the board's side face). Box = flat pass. Props = 2.
TONE: the floor is in shade and only the top rim of the board catches the window; everything
  past that rim is empty light. Not blurred - empty.
```

### p7 — 상자를 끌었어요

```
--- p7 — 상자를 끌었어요 ---
CAMERA: medium wide, camera set on the floor itself, very low; the box and KitBun centre, one
  thick board leg at the side.
SUBJECT: KitBun gripping the box corner with BOTH PAWS and hauling with his whole body thrown
  backwards - shoulders hunched up to his ears, back arched, ONE HIND FOOT skidded back across
  the floured floor, jaw clamped, eyes screwed shut, both ears pulled to the straining side.
HEIGHT: floor level; board top out of frame.
FLOUR: settled on the floor - the box has ploughed TWO clean drag lines through it behind
  itself. 0 airborne.
WORN: 0.
SETTING: the low wooden box, a few empty folded sacks in it (no lettering on them), the thick
  honey board leg, the orange oven glow far back.
FINISH: 2 (KitBun + the box). Board leg and sacks = flat pass. Props = 3.
TONE: one small animal straining alone. 🔴 PapaBun's hands appear NOWHERE in the frame - no
  help arrives on this page.
```

### p8 — 반들반들한 자리가 둘 🔴 판 ref · 이 쪽을 가장 먼저 굽는다

```
--- p8 — 반들반들한 자리가 둘 🔴 판 ref · 이 쪽을 가장 먼저 굽는다 ---
CAMERA: medium, over the shoulder - we look down onto the board past KitBun. His back of head
  and both ears at the lower LEFT, the board top filling the centre.
SUBJECT: KitBun on the box, both paws on the board's edge, up on his toes with his shoulders
  lifted, BOTH EARS STRAIGHT UP; his profile shows a wide eye and an open mouth. PapaBun back
  RIGHT, pin still in his paws, head turned this way to speak, eye corners folded.
HEIGHT: over the shoulder from the box - he sees the board top for the first time.
FLOUR: an even settled film of #F7F4ED across the whole board top, edgeless.
WORN: 🔴 the two palm-sized patches side by side, honey board #C79A5C reading straight through
  where no powder settled. THIS PAGE FIXES THEIR SHAPE, SIZE AND SPACING - p5, p9 and p13 copy
  them exactly.
SETTING: the smooth dough at the RIGHT end of the board, the rolling pin beside it, nothing else.
FINISH: 2 (KitBun + the board top with its two patches). PapaBun and dough = flat pass.
TONE: window light lies broad so the powder floats pale and the two worn patches come forward
  in honey - the same two the reader met on p5, now under his nose.
```

### p9 — 쏙, 딱 들어가요

```
--- p9 — 쏙, 딱 들어가요 ---
CAMERA: close-up, looking down at a slant onto the board. The two small forepaws hold the
  centre; KitBun's chin and one ear tip clip the top edge of frame.
SUBJECT: KitBun's two forepaws laid into the two worn patches, one paw resting lightly on the
  back of the other, fingers spread and touching wood, wrists still lifted because no weight is
  on them yet. 🔴 THE PAWS ARE CLEAN - warm grey-brown #9C8C7C, not a grain of flour on them.
  Above frame: his chin, an open mouth, one ear hanging down.
HEIGHT: near top-down at a slant.
FLOUR: settled around the patches, 0 airborne.
WORN: both, same shape and spacing as p8. 🔴 paws and patches sit at the SAME DEPTH on the same
  board so their sizes compare directly - the small paws sit inside the patches with room to
  spare.
SETTING: rubbed-smooth grain in the two patches, the near edge of the dough at the right of
  frame. Nothing else.
FINISH: 2 (the paws + the two patches). Dough = flat pass.
TONE: light gathers on the board and the surround sinks dark. The quietest cut in the book -
  one sound only.
```

### p10 — 탁!

```
--- p10 — 탁! ---
CAMERA: medium, low angle - the struck paws and his face high in frame, the rocking box and
  his feet low.
SUBJECT: KitBun with his whole weight thrown forward on the box, BOTH PAWS STACKED and driven
  down heel-of-the-hand first into the dough at the instant of contact, so the dough's edge
  squashes out under them; shoulders dropped, arms locked straight, back bowed forward, both
  ears kicked upward from the impact, eyes bright, mouth wide open shouting. The box tilts to
  one side and one hind foot lifts off it.
HEIGHT: low angle; the board top reads edge-on.
FLOUR: 🔴 first of the two airborne pages - a LOW band of powder just starting up from around
  the pressed dough, NEVER higher than his wrist. His face is still clean.
WORN: covered by his own paws.
SETTING: powder shoved outward past the heels of his hands, the rolling pin knocked on its
  side, orange oven glow far back.
FINISH: 2 (KitBun + the dough). Pin and oven = flat pass.
TONE: seen from below the driven arms and the open mouth are big and free. The page before the
  burst - keep the face clean.
```

### p11 — 푹—!

```
--- p11 — 푹—! ---
CAMERA: close-up, straight-on child's-eye; his face fills the frame and the white comes at it.
SUBJECT: KitBunWhite bent over the board, EYES SCREWED SHUT with creases in the lids, muzzle
  pushed up, both paws still pressed into the dough, shoulders pulled in, BOTH EARS FLAT BACK,
  mouth half open, powder just landing on the fur at the front of his face.
HEIGHT: straight-on.
FLOUR: 🔴 the burst - the second and last airborne page. The white cloud goes up right in front
  of his face and takes the whole upper half of the frame; it has NO EDGE, thick at the centre
  and thinning away to nothing. At most 24 separate grains outside the mass, told apart by size
  alone - 0 sparkles, 0 star shapes, 0 glow.
WORN: hidden under paws and cloud.
SETTING: the squashed edge of the dough below; everything else is lost behind the cloud.
FINISH: 2 (KitBunWhite's face + the cloud). Nothing else is drawn.
TONE: the top of the frame is pressed white and only the lower band keeps colour. The one page
  in the book where white takes the picture - every other page keeps it lying flat on the board.
```

### p12 — 하하! 하하하!

```
--- p12 — 하하! 하하하! ---
CAMERA: medium wide, child's eye; KitBunWhite on the box at the LEFT, PapaBun across the board
  at the RIGHT.
SUBJECT: KitBunWhite leaning back on the box with BOTH SHOULDERS SHAKING up and down, mouth
  wide, eyes folded into crescents, both ears thrown back, both paws braced on the board;
  powder sits thick on his nose bridge, brow ridge and ear insides. PapaBun with both paws
  lifted OFF the pin, head up, watching - shoulders let down, eye corners folded, not laughing.
HEIGHT: child's eye across the board.
FLOUR: scattered loose over the board top now, with a broad heel-of-hand print pressed into
  the dough. 0 airborne.
WORN: not visible - the print and the loose powder cover them. Do not draw them here.
SETTING: the stopped rolling pin, the orange oven glow, the pale sea #A9BFC4 in the window.
FINISH: 2 (KitBunWhite + PapaBun - on this one page the second slot is the other rabbit).
  Board, pin and window = flat pass.
TONE: window light and fire light meet between the two of them and the room is bright for the
  first time. All the sound is spent here so the last page can be silent.
```

### p13 — 다시 얹은 두 앞발

```
--- p13 — 다시 얹은 두 앞발 ---
CAMERA: 🔴 close-up, TOP-DOWN straight onto the board. Almost nothing but the board and the
  paws is in frame.
SUBJECT: KitBunWhite's two forepaws set exactly into the two worn patches, one paw stacked on
  the back of the other, the heels of the hands pressing the folded dough. 🔴 THE PAWS ARE
  WHITE TO THE WRIST with settled powder (on p9 they were bare grey-brown) - same paws, same
  patches, different state. Top of frame: his chin and one ear tip; the face is cropped away.
HEIGHT: straight down.
FLOUR: settled loose around the board; at most 9 single grains hanging, told apart by size,
  0 sparkle.
WORN: both, same shape and spacing as p8, their outer edges showing just past the paws.
SETTING: one folded lump of dough, its fold ridged up, a shallow palm print in its surface.
  PapaBun's apron hem clipped at the RIGHT edge: CONTOUR ONLY, NOT blurred.
FINISH: 2 (the paws + the two patches). Dough = flat pass.
TONE: light lies broad, the surround stays quiet and dark. Sound and laughter are over; what
  is left is a posture. The most finished thing here is two paws sitting exactly in the two
  worn patches - and nothing says so.
```
