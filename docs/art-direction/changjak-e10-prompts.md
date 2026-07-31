# 창작동화 1000 — e10 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/e10.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 4장 → ② 승인본을 `@image` 로 붙여 컷

## e10 §1. 앵커 배정

**권**: e10 「수프에 뭐가 들어갔지?」 · 교환·연쇄 · 동유럽 마을 광장 돌 화덕 · 13쪽 · 4~6세
**클러스터**: **C5**(반복하기) · 앵커 슬러그 `changjak-potdense` **신규 민팅**
**한 줄**: 자갈은 도장 반복으로 깔고 광장은 비운다. **화면에서 빽빽한 자리는 냄비 안 하나뿐**이고, 그 자리의 밀도가 쪽마다 자랐다가 0이 되고 국자 안에서 1로 돌아온다.

🔴 **이 라인에서 처음으로 「채워야 하는」 권이다.** 사건이 「찾아내는 것」이라 냄비 안을 비우면 책이 죽는다. 다만 **채우는 자리는 냄비 테두리 안뿐**이고 경계는 그 테두리 하나다. 광장에 사람·집·좌판을 늘리면 이 권의 계기판이 안 읽힌다.

**형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 형제 | 갈리는 것 |
|---|---|
| **f05** | 세는 것이 **칠인가 밀도인가** — f05 는 칠이 접시 안에만 들고 색 덩어리 **개수**가 는다. e10 은 광장·인물에도 색이 정상으로 들고, 세는 것은 **냄비 안 셀 수 있는 것의 개수**다 |
| **b13** | **밤인가 낮인가 · 그릇인가 냄비인가** — b13 은 밤 종이·오린 구멍 넷·부엌 식탁, e10 은 낮 야외 광장·큰 무쇠 냄비·도장 필드 |
| **a11 · a97 · b05 · c05 · d05**(C5 도장 형제) | **도장이 무엇이고 그 위에서 무엇이 변하나** — 기와·라벤더·벽지·좌판 실루엣·빛 얼룩 ↔ e10 은 **자갈**이고, 도장은 열세 쪽 내내 안 변하며 **변하는 것은 냄비 안 밀도뿐**이다 |
| **c06** | c06 의 악센트는 마감(깃털 넷)이고 e10 의 악센트는 **개수**다 |

**대본 SCENE 처방표** (습관어 대역 — 대본은 안 고치고 컷에서 분기한다)

| 대본 | 컷에서 |
|---|---|
| p7 「김이 화면 절반을 하얗게 덮어 뿌옇게」 | 에어브러시 구름 아님 — **획 3개 이하의 흰 김 + 가려진 것은 아예 안 그림** |
| p9 「빛이 표면에서 튕겨 안이 하나도 안 들여다보이게」 | 반사 하이라이트 아님 — **불투명 뽀얀 색면 한 장**, 바닥·물속 0획 |
| p11 「다른 머리 셋이 흐릿하게」 | 초점 흐림 아님 — **윤곽선만, 안은 안 채움** |
| p13 「그릇 넷에 담긴 국물 색이 서로 완전히 똑같다」 | 넷 다 **같은 hex 한 값**, 음영·반사 0 |

---

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-potdense

Style: picture book, ages 4-6. One place for all 13 pages: a low stone fire-pit
with a big cast-iron pot, in the middle of a cobbled Eastern European village
square. Cobbles are printed with ONE hand-cut stamp repeated; everything above
the ground is painted by hand in matte gouache over that print. The book has
exactly TWO density grades and the border between them is the rim of the pot.

RENDERING (finish hierarchy)
OUTSIDE THE RIM the square is quiet. FINISHED THINGS PER PAGE = 2 - the badger
cub, plus the one thing his paws touch on that page. Everything else stays raw
gouache. Square props are capped at 5 objects total on screen, taken only from:
pot, stone hearth, fire, wooden crate, bowls, ladle. 0 buildings, 0 windows,
0 stalls, 0 carts, 0 trees, 0 extra villagers. Cobbles = one stamp shape
repeated, 0 shape variation, 0 cracks, 0 moss, 0 puddles: a full surface
carrying 0 information. Steam = at most 3 curved white strokes per page, never
a soft cloud.
INSIDE THE RIM is the only crowded place in the book, and the crowding IS the
plot. DENSITY RATION (inside the pot only) = p4, p5, p6, p8 crowded, and p11
crowded inside the ladle bowl only. Countable solids resting or floating in the
broth, per page: p1=0, p2=3, p3=3, p4=5, p5=7, p6=9, p7=1, p8=12, p9=0, p10=0,
p11=0 in the pot and 6 in the ladle, p12=0, p13=0. On a 0 page the broth is one
flat opaque milky field with at most 4 bubbles, no bottom, no reflection.
Same camera and same framing on p3 and p9 - do not move it.

PALETTE
#A5A29A cobble grey (stamp ink) . #22201E iron black (pot, hearth shadow) .
#D2691E fire orange (only the fire and the low evening light) . #EAE3D2 milky
broth cream. Accent = BEAN YELLOW #E8C24B, the only saturated yellow in the
book: it appears only inside the pot or inside the ladle, at most 3 dots at a
time, never on cobbles, fur, bowls or sky.

CHARACTER DESIGN LANGUAGE
Anthropomorphism grade = bipedal, forepaws used as hands, animal heads kept
true to species. The cub wears nothing. The three adult visitors wear exactly
ONE garment each and nothing more. Eyes = a dark almond with a visible round
iris and an upper lid line; never a plain black dot. Mouths = one line.
Silhouettes must separate at thumbnail size: striped small cub, round-backed
mole with shovel paws, plumed squirrel tail, spiked hedgehog dome.

CANVAS
16:9 double-page spread, full bleed to all four edges, no border, no caption
margin anywhere. No letters, no numbers, no signs, no lettering of any kind.

NOT (rendering only)
NOT airbrush, smooth gradients, glossy CG or photographic finish.
NOT wool fibre, needle-felt fuzz or visible stitching on any animal.
NOT plain dot eyes.
NOT painted detail on cobbles - the stamp is the whole ground.
```

---

## §3. 캐릭터 시트

### 시트 1 — Badger cub (새끼 오소리)

```
CHARACTER SHEET - Badger cub   (bake this FIRST)
Matte gouache over a printed cobble ground, per STYLE ANCHOR changjak-potdense.

FACE   Broad short muzzle. Coat white #EFEAE0 with two black #22201E stripes
running from the nose over each eye to the ear. Nose leather #3A3330. Eyes =
dark almond with a round iris and an upper lid line, set wide, 1 line mouth.
Cheeks slightly round - this is a cub, not an adult badger.
FUR    Body grey #8E8A82, chest and throat paler #B4AFA4. Fur is painted as
flat shape, not hairs: at most 12 short edge strokes on the whole animal.
CLOTHES  None. 0 garments, 0 apron, 0 scarf.
BUILD & SILHOUETTE  Small - head is 1/3 of total height. Stands on hind legs,
short thick legs, low centre of gravity, stubby tail. The wooden ladle he
carries is TALLER than he is; that size gap is his silhouette marker.
REFERENCE SHEET  full-body front idle, 3/4 turn, back view (he is seen from
behind on several pages), plus 3 face close-ups: wide-eyed hunting look,
puzzled brow-pinch with ears laid back, open-mouth delight.
16:9 sheet, plain #EAE3D2 field, no letters or numbers.
```

### 시트 2 — Old mole grandpa (두더지 할아버지)

```
CHARACTER SHEET - Old mole grandpa   (bake this FIRST)
Same medium as STYLE ANCHOR changjak-potdense.

FACE   Velvet dark brown-grey #4A423C, pink pointed snout #C08C82 tilted
upward, tiny eyes almost closed, whiskers = 4 strokes each side.
FUR    One flat velvet field, no strand detail, at most 8 edge strokes total.
CLOTHES  ONE garment only: a worn waistcoat #7E6A50 with 2 buttons. No shirt,
no trousers, no hat.
BUILD & SILHOUETTE  Short and round-backed, spine curved into a dome. Huge
pale spade-shaped forepaws #B4A99A, much larger than any other character's
hands - that is his marker at thumbnail size. Hind legs barely visible.
REFERENCE SHEET  full-body front idle, 3/4 turn, plus 2 face close-ups:
snout raised and sniffing, and eyes-shut smile.
16:9 sheet, plain #EAE3D2 field, no letters or numbers.
```

### 시트 3 — Squirrel (다람쥐)

```
CHARACTER SHEET - Squirrel   (bake this FIRST)
Same medium as STYLE ANCHOR changjak-potdense.

FACE   Rust #A5622F head, cream #EFEAE0 muzzle and eye ring, dark almond eyes
with round iris, 2 upper teeth showing when the mouth opens, ear tufts = 3
strokes each.
FUR    Flat rust field, belly cream, at most 12 edge strokes on the animal.
CLOTHES  None. 0 garments.
BUILD & SILHOUETTE  Slim and light, always slightly off-balance. The tail is
the marker: a single plume as tall as the whole body, held straight up, drawn
as ONE shape with at most 6 edge strokes - never individual hairs.
REFERENCE SHEET  full-body front idle, 3/4 turn, one crouched-on-a-rim pose
with the tail straight up, plus 2 face close-ups: concentrating twist, and
open-mouth call.
16:9 sheet, plain #EAE3D2 field, no letters or numbers.
```

### 시트 4 — Hedgehog auntie (고슴도치 아주머니)

```
CHARACTER SHEET - Hedgehog auntie   (bake this FIRST)
Same medium as STYLE ANCHOR changjak-potdense.

FACE   Small pointed face, cream-tan #C9B79C, black bead nose, dark almond
eyes with round iris and heavy upper lids, gentle 1 line mouth.
QUILLS Dome of quills over head and back, painted as ONE dark #6E635A shape
with at most 20 spike notches cut into its outline - never drawn one by one.
When she strains, the whole dome shape bristles: notches deepen, count stays.
CLOTHES  ONE garment only: an apron #B4472F tied at the waist, plain, no
pattern, no pockets, no trim.
BUILD & SILHOUETTE  Wide and low, pear-shaped, short arms. Marker = the
spiked dome sitting directly on short legs, with the apron cutting a straight
horizontal across it.
REFERENCE SHEET  full-body front idle, 3/4 turn, plus 2 face close-ups: eyes
squeezed shut with effort, and a soft smile.
16:9 sheet, plain #EAE3D2 field, no letters or numbers.
```

> 🔴 **염소 할머니는 시트를 굽지 않는다** — p9 에 앞발 하나만 나오고 그 뒤로 안 나온다. 규격은 p9 컷 안에 있다.

---

## §4. 쪽별 컷

### p1

```
--- p1 — 다 같이 먹는 날 ---
POT: 0 countable solids. Broth clear and still, at most 4 bubbles, no bottom
detail beyond flat iron black.
SQUARE: cobble stamp fills the ground, 0 variation. Props on screen = pot,
stone hearth, fire, wooden crate, 3 empty bowls on the rim. Nothing else.
BEAN: 0 yellow anywhere on this page.
CAMERA: wide, slightly below eye level looking up; the pot is the largest mass
on the spread and sits centre.
SUBJECT: the badger cub stands on the wooden crate beside the hearth, gripping
the long wooden ladle - taller than he is - in both forepaws, stirring a big
clockwise arc. Body tilts with the ladle, one hind foot lifted off the crate
edge. Mouth wide open, eyes down into the pot.
SETTING: cobbled square, low stone hearth, orange fire under the iron pot,
early morning, the cool grey air only just warming.
FINISH: finished = cub + ladle. Hearth, crate and bowls stay raw gouache.
Cobbles = stamp only. Bipedal cub, forepaws as hands, no clothes. No letters,
numbers or signs anywhere.
TONE: cool grey morning air with the fire's orange pooled only under the pot.
```

### p2

```
--- p2 — 노란 콩 세 알 ---
POT: 3 countable solids = the 3 yellow beans mid-fall. Broth clear, small
bubbles only, at most 4.
SQUARE: out of frame this page.
BEAN: THE 3 BEANS ARE THE MOST FINISHED THING ON THE SPREAD - saturated
#E8C24B, crisp edges, each with one small highlight. Nothing else on the page
gets that finish.
CAMERA: close-up, over the shoulder looking down onto the pot surface.
SUBJECT: only the cub's two forepaws, large in the upper part of the frame.
The left paw holds a green pea pod; the right thumb presses its spine and
splits it open. Three yellow beans slide out of the gap in a line, falling
toward the broth. Of his face only the nose tip and lower jaw enter the very
top edge, mouth corner lifted.
SETTING: the same pot rim, shallow steam just starting.
FINISH: finished = the 3 beans + the paws. Pod, rim and broth stay raw. Steam
= at most 3 white strokes. Bipedal cub, forepaws as hands, no clothes. No
letters, numbers or signs.
TONE: light softened through low steam; the yellow is the only saturated
colour on the spread.
```

### p3

```
--- p3 — 저기 있다, 내 콩! ---
POT: 3 countable solids = the 3 beans rolling on the iron floor. Water clear
enough that the bottom reads fully.
SQUARE: crate edge only, bottom corner.
BEAN: 3 yellow dots on the black iron floor, small but fully saturated
#E8C24B - the only saturated colour on the spread.
CAMERA: 🔴 HIGH ANGLE, the pot mouth a full circle in frame. THIS EXACT FRAME
IS REUSED AT p9 - lock focal length, height and circle position now.
SUBJECT: at the bottom edge, the cub's two forepaws barely touch the hot rim
and only his nose tip and two eyes clear it. Hind legs stretched to the tips
on the crate. Eyes gone round, locked on the 3 yellow dots.
SETTING: clear broth, black iron floor, a few small bubble trails rising.
FINISH: finished = cub's face + the 3 beans. Iron floor = one flat value with
at most 6 edge strokes. Bipedal cub, forepaws as hands, no clothes. No
letters, numbers or signs.
TONE: light passes through the broth and reaches the floor - the inside of the
pot is the bright place on this spread.
```

### p4

```
--- p4 — 당근도 하나 넣자 ---
POT: 5 countable solids = 3 beans on the floor + 1 carrot entering + 1 falling
clod of earth. Broth still readable but browning at the top.
SQUARE: cobbles and hearth visible at the lower edge, props capped at 5.
BEAN: the 3 beans still legible on the floor, saturated.
CAMERA: medium, eye level, pot centred, a forepaw entering from the right.
SUBJECT: right - old mole grandpa (@sheet 2) grips the leafy top of a muddy
carrot in one huge spade paw and shakes it up and down over the pot, back
domed, snout tipped up. Left - the cub steps back on his crate and shields his
eyes with one forepaw against the falling grit.
SETTING: same pot, sun higher, steam thicker.
FINISH: finished = cub + the carrot he is dodging. Mole stays raw gouache
apart from his paw. Grit = at most 9 dark specks. Bipedal animals, forepaws as
hands; mole wears his waistcoat only. No letters, numbers or signs.
TONE: thickened steam splits the daylight; warm midday.
```

### p5

```
--- p5 — 어? 내 콩 어디 갔지? ---
POT: 7 countable solids = 1 carrot lying askew on the floor + 1 bean tip
showing from under it + 5 dark flecks of earth. Broth now yellowish, floor
readable only across half the circle.
SQUARE: crate and hearth edge only.
BEAN: only ONE bean, and only its tip - a yellow crescent poking out from
under the carrot. Still fully saturated #E8C24B.
CAMERA: medium close-up, tipped slightly down and off axis.
SUBJECT: left - the cub holds the ladle shaft flat in both forepaws and drags
it sideways across the pot floor, one shoulder dropped, ears laid back. Mouth
slightly open, brow pinched: the puzzled face from his sheet.
SETTING: same pot, broth gone cloudy-yellow with silt.
FINISH: finished = cub + ladle head. Carrot half finished. Silt = flat wash,
0 texture. Bipedal cub, forepaws as hands, no clothes. No letters, numbers or
signs.
TONE: murkier water; the floor reads on one side only.
```

### p6

```
--- p6 — 버섯도 넣어요! ---
POT: 9 countable solids = 1 carrot + 1 mushroom cap falling + 2 broken stalk
pieces + 5 earth flecks.
SQUARE: pot rim and a slice of cobble at the lower edge.
BEAN: 0 visible - the carrot covers it. Do not draw a bean this page.
CAMERA: medium, low angle looking up past the pot rim.
SUBJECT: upper frame - the squirrel (@sheet 3) perches on the rim, both
forepaws twisting a dried mushroom in opposite directions to snap the stalk
off, tail plume straight up for balance. Lower frame - the cub on his crate
tips his head back and looks up at those paws, mouth open.
SETTING: same pot, steam rising straight, high noon.
FINISH: finished = cub + the falling mushroom cap. Squirrel stays raw except
the two working paws. Steam = at most 3 white strokes. Bipedal animals,
forepaws as hands, squirrel wears nothing. No letters, numbers or signs.
TONE: backlit - the steam burns white and the figures sit a shade darker.
```

### p7

```
--- p7 — 내 콩 어디 갔지? ---
POT: 1 countable solid = the mushroom cap turning in the swirl. Nothing else
is visible in the broth. Do not draw a bean, a carrot or the floor.
SQUARE: out of frame.
BEAN: 0. The absence is the page.
CAMERA: close-up, side view at eye level.
SUBJECT: centre - the cub leans deep over the pot, nose almost touching the
broth, one forepaw spinning the ladle in place, the other braced on the rim.
Eyes half shut, whiskers wet and drooping.
SETTING: hard-boiling broth in a swirl; steam takes the upper half of the
spread as a flat white field - what it covers is NOT drawn, not blurred, and
has 0 strokes.
FINISH: finished = cub's face + ladle head. The swirl = at most 5 curved
strokes. Bipedal cub, forepaws as hands, no clothes. No letters, numbers or
signs.
TONE: white steam over half the spread; the cub's face the only fully worked
thing left.
```

### p8

```
--- p8 — 빵도 같이! ---
POT: 12 countable solids = 1 carrot + 1 mushroom cap + 10 bread crumbs sitting
on the surface. This is the fullest the pot ever gets.
SQUARE: cobbles and long shadows at the lower edge, props capped at 5.
BEAN: 0 visible.
CAMERA: medium, over the shoulder, high angle.
SUBJECT: upper left - hedgehog auntie (@sheet 4) grips a hard loaf in both
forepaws and twists it apart, shoulders up, quill dome bristled, eyes squeezed
shut. Lower right - the cub on his crate spreads both forepaws to catch the
crumbs, takes them in the face and screws his eyes up.
SETTING: same pot, sun dropping, shadows lengthening across the cobbles.
FINISH: finished = cub + the splitting loaf. Auntie raw except her working
paws; apron flat, 0 pattern. Crumbs in air = at most 14. Bipedal animals,
forepaws as hands; auntie wears the apron only. No letters, numbers or signs.
TONE: low afternoon light; each crumb catches one small highlight.
```

### p9

```
--- p9 — 소금은 조금만 ---
POT: 0 countable solids. The broth is ONE flat opaque milky #EAE3D2 field -
no floor, no bean, no carrot, no mushroom, no reflection, no transparency. At
most 6 bread crumbs sit ON the surface, and the white salt grains scatter
above it.
SQUARE: out of frame, as at p3.
BEAN: 0. Nothing yellow anywhere on this spread.
CAMERA: 🔴 IDENTICAL FRAME TO p3 - same high angle, same focal length, same
pot circle in the same place. Do not move the camera by a single degree.
SUBJECT: top edge - one forepaw only of the old goat grandmother enters frame:
cream-white fur #E4DCCB, dark grey nails, a rust-brown #A5622F cuff at the
wrist, thumb and forefinger pinching salt. Her body, face and horns stay off
frame entirely. Bottom edge - only the cub's two eyes over the rim, same spot
and same pose as p3.
SETTING: long-boiled broth, opaque.
FINISH: finished = cub's eyes + the pinching paw. Bipedal grade, forepaws as
hands. No letters, numbers or signs.
TONE: 🔴 same frame as p3, opposite brightness - light bounces off the surface
and nothing under it can be seen.
```

### p10

```
--- p10 — 내 콩 어디 갔지? ---
POT: 0 countable solids. One flat milky field, at most 4 bubbles.
SQUARE: heads fill the spread, so the ground shows only as repeated cobble
stamp at the corners. Props capped at 3 here.
BEAN: 0.
CAMERA: high angle, the pot centred with four heads ringed around it.
SUBJECT: heads close in around the rim - top, mole grandpa with his snout
working; right, squirrel with the tail plume upright; bottom, hedgehog auntie
with her quills laid flat; left, the cub on his crate leaning in deepest of
all. All four noses nearly touch the broth, all eight eyes point down.
SETTING: same pot, hearth glow, cobbles turned orange by the low sun.
FINISH: finished = the cub + the milky surface they are all staring into. The
other three stay raw gouache. Bipedal animals, forepaws as hands; one garment
each on mole and auntie, none on cub or squirrel. No letters, numbers or signs.
TONE: steam rising from below wraps all four faces white and a little comic.
```

### p11

```
--- p11 — 여기 다 있어! ---
POT: 0 countable solids in the pot. 6 IN THE LADLE = 1 yellow bean, 1 carrot
piece, 1 mushroom cap piece, 3 bread crumbs, all sitting in milky broth. The
ladle bowl is the ONLY crowded place on this spread and the most finished
thing in the book.
SQUARE: out of frame except the rim.
BEAN: 🔴 exactly ONE bean, fully saturated #E8C24B, dead centre of the ladle -
the thing that was lost, counted again.
CAMERA: close-up, low angle looking up at the raised ladle.
SUBJECT: right - the cub holds the ladle shaft high in both forepaws, arms
straight, head tipped back to look up into the bowl, mouth wide open. At the
frame edges, the other three heads look up the same way - drawn as OUTLINE
ONLY, unfilled, no interior shading.
SETTING: broth still dripping from the ladle in a short stream.
FINISH: finished = cub + the 6 things in the ladle. Bipedal cub, forepaws as
hands, no clothes. No letters, numbers or signs.
TONE: the low sun sits behind the ladle so the contents read as crisp
silhouettes with colour.
```

### p12

```
--- p12 — 한 국자씩! ---
POT: 0 countable solids. Milky field only.
SQUARE: hearth and cobbles at the lower edge, props capped at 5 = pot, hearth,
ladle, filled bowl, 3 waiting bowls counted as one group.
BEAN: 0 - it has gone into the bowl and is not drawn.
CAMERA: medium close-up, side view at eye level.
SUBJECT: left - the cub tips the ladle with one forepaw and steadies the bowl
with the other, shoulder dropped toward it, tongue tip just showing at the
corner of his mouth: careful.
SETTING: a milky stream falls from the tilted ladle into the bowl; 3 empty
bowls wait in a row beside it; pot and hearth behind.
FINISH: finished = cub + the pouring stream. Bowls stay raw gouache, 0
pattern, 0 rim decoration. Bipedal cub, forepaws as hands, no clothes. No
letters, numbers or signs.
TONE: evening orange passes through the falling stream and makes it half
translucent - the one translucent thing in the book.
```

### p13

```
--- p13 — 후우— 뜨거워 ---
POT: 0 countable solids. 🔴 The broth in all four bowls is ONE identical value
#EAE3D2 - same colour, same flatness, 0 shading, 0 reflection. If one bowl
differs from another the book is broken.
SQUARE: cobbles = stamp only, cooling. Props on screen = pot, hearth, dying
fire, wooden ladle laid across the rim, 4 bowls. Nothing else at all.
BEAN: 0.
CAMERA: wide, eye level, the hearth centred with the four seated in a ring.
SUBJECT: sitting on the cobbles around the hearth - left, mole grandpa; top,
squirrel; right, hedgehog auntie; front, the cub. All four cradle an identical
bowl in both forepaws. Only the cub has his mouth to the rim, cheeks puffed,
blowing.
SETTING: the fire sunk low, the square going cool, 4 thin steam threads rising
side by side.
FINISH: finished = cub + his bowl. The other three raw gouache. Bipedal
animals, forepaws as hands; one garment each on mole and auntie, none on cub
or squirrel. No letters, numbers or signs.
TONE: low orange lying flat across the cobbles; quiet evening.
```
