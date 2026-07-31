# 창작동화 1000 — E-02 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/e02.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## E-02 §1. 앵커 배정

**권**: e02 「딸꾹질을 옮기는 방법」 · 교환·연쇄 · 이탈리아 광장(분수 둘레 한 자리) · 13쪽 · 4~6세
**클러스터**: C7 · **슬러그**: `changjak-soakwall` (신규 민팅)
**한 줄**: 지지면이 물감을 빨아들여 **색이 표면 아래로 스민다**(젖은 회벽에 먹인 색). 화면에서 **표면 위에 얹힌 불투명한 것은 딱 하나, 빨간 체리 한 알**이다.

🔴 **형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | 판정 |
|---|---|---|
| **b09 · d03 · a05 · d07 · g02** (C7 다섯) | **불투명한 것이 몇 개인가** | 저 다섯은 물감이 전부 표면 **위**에 있다 · **e02 는 스민 것뿐이고 위에 얹힌 것이 정확히 1개** |
| **d07** `changjak-canalfork` | 값을 무엇으로 내나 | d07 = 투명 겹수(볕 1겹·그늘 2겹) · **e02 = 겹수를 안 쓴다.** 값은 미리 정한 세 단의 스민 색이고, 같은 색을 두 번 먹이지 않는다 |
| **a02** `changjak-pawtrace`(같은 광장·과일 악센트) | **과일이 몇 알인가** | a02 = 보라 자두 여럿이 흩어졌다 모임 · **e02 = 빨간 체리 정확히 한 알**이 손에서 손으로 |
| 광장 다섯(a02·a14·h02·e02·e07) | **바닥이 무엇인가** | 마른 왁스 / 찍은 포석 / 평면 도형 / **스민 황토** / 한 색 평면 |

🔴 **이 권의 기계장치 = 체리 한 알.** 딸꾹질이 지금 누구에게 있는지 알려 주는 유일한 표시이고, **집는 방식이 매 쪽 다르다.** 컷의 `CHERRY:` 줄에 그 손 모양이 못박혀 있다 — 줄여 쓰지 마라.
🔴 **광장은 반복으로 눌러 정보를 0으로 만든다.** 자갈·차양·계단은 단위를 세지 못하게 한다(아래 개수 상한).

**대본 SCENE 처방표** (대본은 안 고치고 컷에서 분기)

| 대본 문구 | 옮기는 법 |
|---|---|
| p1 「벽은 흐린 워시로 물러난다」 | 스민 색 **1단(가장 옅은 소크)** 으로만 |
| p6 「물줄기와 젖은 자갈에만 반짝임」 | 반짝임이 없는 매체다 → **물감이 안 먹은 맨 회벽 자리**(0 소크)로 낸다 |
| p7 「뒤쪽 거위는 반 톤 물러난 채로」 | 거위를 **1단 소크로만**, 눈 표시 하나 외 마감 금지 |
| p13 「셋은 조용」 | 셋을 **반 마감**(평면 소크 형상 + 눈 표시 하나), 곰만 완전 마감 |

## E-02 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-soakwall

Style: picture book for 4-6 year olds. One Italian piazza - a low stone fountain with a fruit stall, a bench and church steps around it. Colour is soaked INTO the support the way pigment is fed into damp lime plaster: it sits under the surface, matte and slightly grainy, never on top of it. Exactly one thing in every frame is opaque and sits on the surface - a red cherry.

RENDERING (finish hierarchy)
Opaque objects per page = exactly 1 - the cherry. Everything else is soaked colour with no body, no gloss, no raised edge.
Soak value has 3 fixed steps and no more: 1 pale, 2 mid, 3 deepest. A shape is one step, never two steps blended, and the same area is never re-soaked to darken it.
A figure = 2 to 4 soaked areas. Its outer edge is crisp where the brush stopped and feathered at most 2mm where the colour crept into damp plaster. Drawn contour lines = 0.
FINISHED THINGS PER PAGE = 2 - the animal who has the hiccups, and the cherry. DENSITY RATION = none.
Gravel stones drawn = 0 (the ground is one soaked field with at most 5 joint marks). Awning = 3 stripes, no more. Steps = 3 edges, 0 stone joints. Fruit in the stall = at most 6 shapes and none of them red. Fountain water = 1 strand. Wall = 0 cracks, 0 bricks.
Dark marks per page = at most 8, each a flat #6B5138 mark: eyes, nostrils, an open mouth, the glasses. There is no black.

PALETTE
#C89A5E ochre wall and ground (kitten = the same ochre soaked one step deeper, so she never merges with the wall) · #E9E4D8 fountain stone, steps, goose, badger's head · #C22B2E the cherry, the only opaque and the only red · #8A6E4E bear cub, badger's body, bench, crates · #6B5138 deepest soak, the only dark note.
No other colour enters this book. Nothing else is red, ever.

CHARACTER DESIGN LANGUAGE
Upright, child-shaped animals that sit and stand like people and use their forepaws as hands. Clothing: the goose wears one apron, the badger one buttoned vest with a chest pocket and small round glasses; the bear cub and the kitten wear nothing at all. Faces are built from soaked shapes: eye = one flat #6B5138 oval, nose = one smaller mark, open mouth = one flat #6B5138 shape. No fur strokes, no whisker lines, no eyebrows, no blush.

CANVAS
16:9 double-page spread. No letters, numbers, prices, signs or symbols anywhere - not on the awning, the crates, the cup or the steps.

NOT (rendering only)
- no paint sitting on the surface anywhere except the cherry - opaque objects per page = exactly 1
- 0 drawn contour lines: no ink or pencil outline around any form
- no gloss, gradient, airbrush, texture filter or 3D render
- no needle-felted wool, stitching or fibre edges
```

## E-02 §3. 캐릭터 시트

### 시트 1 — BearCub

```
CHARACTER SHEET - BearCub   (bake this FIRST)

Medium: STYLE ANCHOR changjak-soakwall - colour soaked under the surface, 0 contour lines.

FACE
Wide round head, low broad muzzle in a paler soak (#C89A5E) set into the darker head (#8A6E4E), small round ears set high and far apart. Eye = one flat #6B5138 oval; when startled the oval grows, it does not become rounder. Nose = one #6B5138 mark shaped like a rounded triangle. Open mouth = one flat #6B5138 shape, wider than tall. No eyebrows, no tongue, no teeth.

FUR
Flat soak #8A6E4E over the whole body, 0 strokes. The chest and muzzle are the pale soak. The edge of the body is crisp on the outside and feathered no more than 2mm where it meets the wall.

CLOTHES
None. Nothing worn, nothing carried except the cherry and, in p1 only, a small paper bag.

BUILD & SILHOUETTE
A round-bellied cub about the height of a four-year-old child. Head one third of total height, shoulders sloping, belly the widest part, short thick legs, no visible neck. Sits with the hind legs hanging. Forepaws are mitten shapes with three toe notches. Silhouette test: BearCub is the only round, neckless body in the book - GooseStall is a long vertical, BadgerOld is a low wide wedge, KittenGrey is small with a tail.

REFERENCE SHEET
One flat ochre field, figures floating, no ground, no shadow:
1) full body standing, front view
2) 3/4 turn, walking
3) sitting on a low rim, hind legs hanging, both forepaws raised to the mouth
4) squatting on the heels, both forepaws up beside the face, fingers spread
5) head close-up x3 - calm / eyes wide and mouth open / smiling with eyes as two shallow curves
6) one forepaw alone, open, palm up, holding a single cherry
```

### 시트 2 — GooseStall

```
CHARACTER SHEET - GooseStall   (bake this FIRST)

Medium: STYLE ANCHOR changjak-soakwall - colour soaked under the surface, 0 contour lines.

FACE
Small flat head on a long neck, broad blunt beak in the deep soak #6B5138 (never orange, never red). Eye = one flat #6B5138 oval set high; a confident look is the oval flattened into a half-moon. Open beak = the beak shape split into two soaked wedges with a flat #6B5138 gap between them.

FEATHERS
Flat soak #E9E4D8 body, 0 feather strokes, 0 barbs. Wing = one soaked shape with 3 notches at its trailing edge, no more. Spread wings = two long soaked shapes, each with the same 3 notches.

CLOTHES
One apron only, soaked #8A6E4E, tied at the neck and waist, no pocket, no pattern, no letters.

BUILD & SILHOUETTE
Tall and vertical: neck alone is one third of her height and can stretch further. Body a heavy teardrop, two short legs, big flat feet. Standing behind crates she reads as neck + head above a horizontal line. Silhouette test: she is the only figure whose height comes from the neck.

REFERENCE SHEET
One flat ochre field, figures floating, no ground, no shadow:
1) full body standing, side view, neck upright
2) neck stretched forward and up, one wing raised and pointing
3) both wings spread wide, neck thrust forward, beak open
4) neck arched back to drink, beak tilted up
5) neck bent down, beak tip pinching a single cherry
6) head close-up x2 - beak shut and eye a half-moon / beak open and eye a full oval
```

### 시트 3 — BadgerOld

```
CHARACTER SHEET - BadgerOld   (bake this FIRST)

Medium: STYLE ANCHOR changjak-soakwall - colour soaked under the surface, 0 contour lines.

FACE
Long low wedge head, pale soak #E9E4D8, with two straight #6B5138 stripes running from the nose over each eye and back to the ear - the stripes are soaked bands, not drawn lines. Eye = one flat #6B5138 oval inside the stripe. White whiskers exist only as a soaked #E9E4D8 shape below the muzzle, a beard-like block, 0 individual hairs. Small round glasses = two #6B5138 rings, which sit low on the muzzle, ride up to the forehead, and are never drawn as reflective lenses.

FUR
Flat soak #8A6E4E body, 0 strokes.

CLOTHES
One buttoned vest, soaked one step deeper than the body, with a single chest pocket on the left. 3 buttons, no pattern, no letters. Nothing else worn.

BUILD & SILHOUETTE
Low, wide and heavy: shoulders broader than the hips, short legs, a slight forward stoop. Standing he is barely taller than GooseStall's body. The head is long and horizontal where BearCub's is round. Silhouette test: the wedge head plus the beard block reads at any size.

REFERENCE SHEET
One flat ochre field, figures floating, no ground, no shadow:
1) full body standing, 3/4 view
2) half-risen from a bench, leaning forward, both forepaws holding a tin cup and tipping it
3) standing, one forepaw pushing a cherry into the chest pocket, beard block lifted
4) one forepaw pinching his own nose, both cheeks ballooned, eyes squeezed shut
5) mouth wide open blowing out, cheeks hollow, beard block pushed forward, glasses up on the forehead
6) head close-up x2 - glasses on the muzzle / glasses on the forehead
```

### 시트 4 — KittenGrey

```
CHARACTER SHEET - KittenGrey   (bake this FIRST)

Medium: STYLE ANCHOR changjak-soakwall - colour soaked under the surface, 0 contour lines.

FACE
Small round head, large triangular ears, tiny muzzle. Body colour = #C89A5E soaked one step deeper than the wall, so she never disappears into it. Eye = one flat #6B5138 oval, larger in proportion than any other character's. Nose = one small mark. No whisker lines, no stripes, no eyebrows.

FUR
Flat deep-soak ochre, 0 strokes, 0 tufts. The tail is one soaked shape of even width with a rounded tip.

CLOTHES
None. Nothing worn.

BUILD & SILHOUETTE
The smallest figure in the book - about two thirds of BearCub's height. Slight body, long tail that reads as a separate shape: bolt upright when she is pleased, drooping in a slack curve when she is not. Silhouette test: she is the only figure with a tail.

REFERENCE SHEET
One flat ochre field, figures floating, no ground, no shadow:
1) full body sitting, front view, tail upright behind
2) 3/4 view, both forepaws pinching her own nose, cheeks puffed
3) both forepaws cupped together in front of the chest, holding a single cherry
4) back arched, ears flattened backward, tail flicked up off the ground
5) sitting with the tail curled around the feet, mouth slightly open
6) head close-up x2 - eyes bright and round / eyes wide with ears back
```

## E-02 §4. 쪽별 컷

### p1 — 딸꾹, 체리가 톡

```
--- p1 - 딸꾹, 체리가 톡 ---
CHERRY: leaving the cub's raised right forepaw and falling toward his knee, in the air, alone in the frame as the one opaque object.
HICCUP: BearCub - chest thrown up, one shoulder popped, both eyes wide.
PLAZA: the fountain rim, camera looking at it head on.
CAMERA: medium, low eye level, the cub's knees nearest the lens.
SUBJECT: BearCub sitting on the low stone rim at frame centre, hind legs dangling, right forepaw lifted to mouth height, mouth an open flat #6B5138 shape.
SETTING: 1 water strand from the fountain, a small paper bag beside him with 2 cherry shapes showing at its mouth, one ochre wall plane behind. Nothing else.
FINISH: BearCub full; the cherry is the second finished thing and the only opaque body of colour on the page. The wall is a 1-step soak with 0 cracks.
TONE: midday light lands only on the cub's crown and the cherry; everything behind them stays a single pale soak.
```

### p2 — 손가락 사이로 새어 나와

```
--- p2 - 손가락 사이로 새어 나와 ---
CHERRY: resting on the cub's knee but bounced a hand's width into the air by the hiccup - not held, not touched.
HICCUP: BearCub - a jolt strong enough to lift the cherry off the knee.
PLAZA: still the fountain rim; the frame is filled by the cub, so only one soaked stone edge shows.
CAMERA: close-up, front, eye level, the head and both forepaws filling the frame.
SUBJECT: BearCub pressing both forepaws flat over his own mouth, cheeks squeezed out sideways past the paws, brows down (as the shape of the eye ovals tilting, not as drawn lines).
SETTING: one soaked line of stone grain across the rim behind him. Background empty.
FINISH: BearCub full; the airborne cherry is the second finished thing. Nothing else on the page carries finish.
TONE: light on the upper side of the forepaws, the lower face one step deeper. Air feels stopped.
```

### p3 — 내가 고쳐 줄게

```
--- p3 - 내가 고쳐 줄게 ---
CHERRY: sitting still on the cub's knee, near the bottom left, held by nobody.
HICCUP: BearCub - shoulders still up, paws still clamped over the mouth.
PLAZA: the fruit stall on the fountain's left, seen past the cub's shoulder.
CAMERA: medium wide, over BearCub's shoulder toward the stall.
SUBJECT: GooseStall at the right rear, neck stretched high over a crate, beak wide open, one wingtip raised and pointing at the cub. BearCub large in the left foreground, back of the head and rounded back, one paw edge visible past his cheek.
SETTING: awning = 3 stripes only. 1 crate with at most 6 fruit shapes, none red. Nothing more on the stall.
FINISH: BearCub full but seen from behind, so his finish reads as silhouette; GooseStall half - soaked shapes plus one eye mark; the cherry is the finished second thing.
TONE: the awning's striped shade lies across the stall floor as flat soaked bands; only the goose's head is in light.
```

### p4 — 왁!

```
--- p4 - 왁! ---
CHERRY: launched into the air above the cub's head, at the top of its arc, untouched.
HICCUP: BearCub - the last page it is his.
PLAZA: the gravel in front of the fountain rim.
CAMERA: wide, front, eye level.
SUBJECT: GooseStall at right rear, both wings spread wide, neck thrust forward, beak open. BearCub at left front lifted a hand's width off the rim, all four limbs flung out, eyes two large ovals, mouth open.
SETTING: the fountain rim, one paper bag tipped on its side, the ground one soaked ochre field with at most 5 joint marks. The wall behind is left empty.
FINISH: BearCub full; the cherry is the second finished thing and the deepest red on the page. GooseStall stays half.
TONE: the whole frame one step lighter than p3 for the shock - but the cherry does not change; it is the same opaque red on every page.
```

### p5 — 부리로 콕

```
--- p5 - 부리로 콕 ---
CHERRY: pinched at the very tip of the goose's beak, held clear of the ground, the beak tip closed on it like tweezers.
HICCUP: GooseStall - the pinching pose held exactly, but one shoulder jolts and both wingtips lift.
PLAZA: the gravel below the fountain rim.
CAMERA: medium, slightly high eye level so the ground where the cherry lay is visible.
SUBJECT: BearCub at left, both forepaws dropped away from his mouth, chin down, looking at his own chest, mouth shut, eyes round. GooseStall at right, neck bent down to the ground, beak at the gravel.
SETTING: at most 5 joint marks in the gravel field. Nothing else.
FINISH: GooseStall full now (the hiccup moved); the cherry at the beak tip is the second finished thing and the focal point. BearCub drops to half.
TONE: low light, shallow soaked shadows under the two bodies, the beak tip the sharpest edge.
```

### p6 — 벌컥벌컥

```
--- p6 - 벌컥벌컥 ---
CHERRY: slipping out of the opening beak and falling toward the gravel - in the air, touched by nobody.
HICCUP: GooseStall.
PLAZA: the wooden bench on the fountain's right.
CAMERA: medium, straight side view, eye level.
SUBJECT: BadgerOld at right, half off the bench, leaning forward, both forepaws cradling a tin cup and tipping it; glasses low on the muzzle, mouth firmly shut. GooseStall at left, neck arched back like a bow, beak against the cup, both wings half out for balance, 2 water strands running past the beak onto her breast.
SETTING: bench = 3 back slats, 1 tin cup, at most 6 wet marks on the ground. Nothing else.
FINISH: GooseStall full; the cup and the falling cherry share the second slot. Bench at raw soak.
TONE: the wet places are made by leaving the plaster unsoaked - bare pale support, not white paint. 0 highlights.
```

### p7 — 주머니에 쏙

```
--- p7 - 주머니에 쏙 ---
CHERRY: half pushed into the badger's vest chest pocket by his right forepaw, its top half still showing above the pocket edge.
HICCUP: BadgerOld - chest thrown up so the beard block lifts and the glasses slide to the nose tip.
PLAZA: in front of the bench.
CAMERA: medium close-up, front, eye level.
SUBJECT: BadgerOld at centre, just straightened from a stoop, right forepaw at the pocket. Eyes as flattened smiling ovals but the stripes over them ride high. GooseStall behind at left, empty cup tucked under one wing, beak shut, watching.
SETTING: the vest pocket, the cup. Bench reduced to 2 soaked edges. Nothing else.
FINISH: BadgerOld full; the cherry at the pocket is the second finished thing. GooseStall at 1-step soak only, one eye mark, no other finish.
TONE: light catches the beard block and the cherry; the goose sits a full step back.
```

### p8 — 볼이 빵빵

```
--- p8 - 볼이 빵빵 ---
CHERRY: hidden in the pocket - only its stem shows above the pocket edge, a single deep-soak mark. Still exactly one opaque object on the page.
HICCUP: BadgerOld - held inside; the whole body is clenched around it.
PLAZA: the church steps at the back of the piazza.
CAMERA: medium wide, low angle looking up the steps.
SUBJECT: KittenGrey at upper right on the first step, both forepaws pinching her own nose, cheeks ballooned, tail bolt upright. BadgerOld at lower left, head tipped up to her, right forepaw clamped on his own nose, both cheeks ballooned, eyes squeezed shut, shoulders hunched hard.
SETTING: steps = 3 edges, 0 stone joints. No church door, no railing, no plants.
FINISH: BadgerOld full; the ballooned cheeks are the second finished thing. KittenGrey half.
TONE: afternoon light crosses the steps as one flat soaked band; the air is held, so keep every edge still.
```

### p9 — 푸하—!

```
--- p9 - 푸하—! ---
CHERRY: shot out of the pocket, hanging in the air in front of the badger's chest, untouched.
HICCUP: nobody - the badger's has just stopped and the kitten's has not started. This is the only page with 0 hiccups; no chest pops.
PLAZA: the foot of the steps.
CAMERA: medium, straight side view, eye level.
SUBJECT: BadgerOld at left, forepaw flung away from his nose, mouth wide open blowing out, cheeks hollow, beard block pushed forward, glasses shoved up onto the forehead. KittenGrey at right, lowering both forepaws from her nose, body leaning back.
SETTING: the pocket, the airborne cherry, the first step edge. Nothing else.
FINISH: BadgerOld full; the cherry is the second finished thing and the deepest red on the page.
TONE: the centre of the frame one step lighter for the burst, then back down at the edges.
```

### p10 — 나도?!

```
--- p10 - 나도?! ---
CHERRY: caught in the kitten's two forepaws cupped together like a bowl, sitting in the hollow between them.
HICCUP: KittenGrey - the cupped pose held exactly, but the back arches and springs back, ears flatten backward.
PLAZA: on the first step.
CAMERA: medium close-up, slightly high eye level.
SUBJECT: KittenGrey at centre, both forepaws cupped at chest height, eyes wide, ears back, tail flicked a hand's width off the stone behind her.
SETTING: one step edge. Nothing else at all.
FINISH: KittenGrey full; the cherry in the cupped paws is the second finished thing.
TONE: afternoon light gathers on the paws and the cherry; the step stays a pale soak.
```

### p11 — 열, 아홉, 여덟…

```
--- p11 - 열, 아홉, 여덟… ---
CHERRY: hugged against the kitten's chest in both forepaws while she watches - held, not offered.
HICCUP: KittenGrey - but quieter; the tail that stood upright in p10 now sags down over the step.
PLAZA: in front of the first step.
CAMERA: medium wide, front, eye level set so both faces sit at the same height.
SUBJECT: BearCub at left, squatting on his heels, both forepaws raised beside his face - the left with all fingers spread, the right folding two down - mouth a small round shape, eyes fixed on the kitten. KittenGrey at right, holding the cherry to her chest, mouth opening and closing as she copies.
SETTING: one step edge, one plain ochre wall plane behind. Nothing else.
FINISH: BearCub full (this is the page he first says it himself); the cub's spread fingers are the second finished thing. KittenGrey half.
TONE: the light has dropped a hand's width; two soaked shadow shapes lie side by side in front of the step.
```

### p12 — 아까 내 거잖아

```
--- p12 - 아까 내 거잖아 ---
CHERRY: just set down onto the bear's two open forepaws by the kitten - resting, not yet gripped, the cub's toes curling in around it.
HICCUP: BearCub - it has come back; one shoulder pops.
PLAZA: on the first step.
CAMERA: close-up, high angle looking straight down at the two open forepaws.
SUBJECT: BearCub's two forepaws open at lower centre, toes just curling; above them his chin, wide open mouth and two round eyes enter the frame cropped. KittenGrey's single forepaw at upper left, withdrawing, her mouth shut.
SETTING: soaked stone grain of the step. Nothing else is allowed into this frame.
FINISH: the cub's forepaws full; the cherry is the second finished thing and the strongest red in the book.
TONE: pull colour out of everything else - this page is grey ochre plus one red.
```

### p13 — 넷이 나란히

```
--- p13 - 넷이 나란히 ---
CHERRY: going into the bear's mouth, held between two toes of his right forepaw, half in.
HICCUP: BearCub only - his chest alone is up and one shoulder tipped. The other three bodies are perfectly still.
PLAZA: the church steps, the whole piazza behind.
CAMERA: wide, front, eye level, the four seated in one row.
SUBJECT: left to right - GooseStall with both wings laid on her knees and beak shut; BadgerOld settling his glasses, beard block still; KittenGrey with her tail curled round her feet; BearCub at the right end, cherry to his mouth, eyes two happy curves, one shoulder popped.
SETTING: 3 step edges, one ochre wall plane, 1 fountain water strand far behind. Nothing else.
FINISH: BearCub full; the cherry is the second finished thing. The other three at half - flat soaked shapes plus one eye mark each, no facial finish beyond that.
TONE: low light lays four soaked shadow shapes in a row in front of the step; only the cub's shadow has its shoulder line out of step with the others.
```
