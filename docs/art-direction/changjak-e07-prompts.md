# 창작동화 1000 — E-07 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/e07.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## E-07 §1. 앵커 배정

**권**: e07 「줄줄이 소시지」 · 누적·반복 · 독일 소시지 마을 광장 · 13쪽 · 4~6세
**클러스터**: C2 · **슬러그**: `changjak-tautline` (신규 민팅)
**한 줄**: 평칠 위에 붓이 지나간 자리가 **화면당 정확히 한 군데**다. 그 굵은 한 획이 소시지 줄이고, 획의 장력(곧음 ↔ 구불구불)이 이야기다.

**형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | e07 의 값 |
|---|---|---|
| C2 e03 `grainstroke` | **붓 획이 몇 개인가** | e03 = 셀 수 없음(결) · **e07 = 화면당 정확히 1** |
| C2 f01 `quiltline` | **그 한 획이 윤곽인가 사물인가** | f01 = 몸마다 닫힌 윤곽 1획 · **e07 = 화면을 가로지르는 열린 획, 그 자체가 사물** |
| C9 a14 `cobblepairs` (같은 자갈 광장 + 군중) | **바닥에 반복 단위가 보이나** | a14 = 찍은 포석, 셀 수 있다 · **e07 = 한 색 평면, 셀 것이 0** — 셀 것은 바닥이 아니라 **줄에 매달린 여덟**이다 |
| C9 e04 `twosided` (둘 다 회색 + 빨강 1점) | **회색의 온도** | e04 = 젖은 화강암(차갑고 어둡다) · **e07 = 마른 자갈(밝고 따뜻하다)** |

**대본 SCENE 처방표**

| 대본 문구 | 컷에서 옮기는 법 |
|---|---|
| p2 「뒤는 흐리게」 | 흐림 없음 — **뒤에 마감을 안 준다**(형태만, 안은 한 색) |
| p10 「오리 꽁지깃 몇 가닥만 흐릿하게」 | 프레임 가장자리에 **깃 3획**, 다른 어떤 것도 안 그린다 |
| p8 「도장 찍듯 같은 모양을 반복」 | 오리 다섯 = **한 도형을 5번, 변형 0** |

**밀도**: 사건이 「찾아내는 것」이라 p8~p10 은 올린다. 나머지 열 쪽은 `FINISHED THINGS PER PAGE = 2`.
**글자 금지**: 가게 차양·장대·우물에 반복해서 못박는다.

---

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-tautline

Style: picture book for ages 4-6. A cobbled German market square, one morning.
Flat opaque poster-plates with NO outlines, and laid on top of them exactly ONE
loaded brush stroke per spread. That stroke is the sausage rope itself - an
object, never a contour.

RENDERING (finish hierarchy): every shape is one flat colour, hard-edged,
0 shading, 0 gradient, 0 texture, 0 outline. GROUND = ONE unbroken grey plane:
0 cobblestones, 0 joints, 0 pebbles drawn - the square is a colour, not a
pattern. Buildings behind = at most 3 flat rectangles, 0 windows, 0 bricks.
BRUSH STROKE COUNT PER SPREAD = 1: one dark-brown bristle-loaded pass, edges
frayed where the brush ran dry, sausage links read as swellings along that same
pass, never as separate drawn objects. No other mark on the page is a brush
stroke. Bodies = cut-flat colour, 0 fur strokes, 0 whiskers. Face = at most 4
marks (2 eyes, 1 mouth, 1 nose). FINISHED THINGS PER PAGE = 2 (the dog + whoever
grabs this page); everything else is flat colour at 0 detail.
DENSITY RATION = p8, p9, p10 only. On p8 and p9 FINISHED THINGS = 6, because the
reader counts the whole chain. On p10 that ration is spent on ONE thing: the open
mouth is the most finished object in the book (3 marks inside - tongue, lower
teeth, the rope end resting on them) and the rest of the frame is 0.

PALETTE: cobble grey #A6A29A (the ground plane, ~50% of frame) / sausage brown
#5B3A2A (the single stroke - darkest thing on every page) / cream #EDE7DA (light,
apron, goose, well stone) / awning red #C0392B. Red appears ONLY as awning
stripes, only on p1, p2, p13, at most 5 stripes. 0 other colours mixed in.

CHARACTER DESIGN LANGUAGE: only the bear wears anything (a cream apron) and only
he stands on two legs. Dog, goose, goat, cat and the five ducks are plain
four-legged / bird animals - 0 clothing, 0 props, natural posture. Eyes = 2 flat
dots. The five ducks are ONE shape repeated 5 times, identical, 0 variation.

CANVAS: 16:9 double-page spread, horizontal. Keep the bottom 12% quiet for a
caption. NO letters, numbers, signs, shop names or lettering of any kind - the
awning is stripes only, the pole is bare wood.

NOT (rendering only): no outline around any shape; no airbrush, gradients, gloss
or 3D shading; no drawn cobblestones or brickwork; no second brush stroke.
```

---

## §3. 캐릭터 시트

### 시트 1 — Dachshund pup

```
CHARACTER SHEET - Dachshund pup   (bake this FIRST)
Flat poster-plate style, 0 outlines, 0 shading - see anchor changjak-tautline.

A dachshund puppy. Body = ONE long flat shape in chestnut #8B5A3C, twice as long
as it is tall, legs so short the belly nearly touches the ground. Ears = 2 flat
dark-brown teardrops #5B3A2A that hang past the jaw. Muzzle = one wedge, nose =
1 black dot. Eyes = 2 black dots, 0 whites, 0 eyelashes. 0 collar, 0 clothing,
0 fur strokes, 0 whiskers. Silhouette test: from across the room it is a long
brown dash with 4 stubs - the only animal in the book wider than it is tall.
REFERENCE SHEET: (a) full body standing, side view, left profile (b) full body
running - legs stretched fore and aft, ears blown back (c) sitting, nose lifted
straight up (d) head close-up, mouth wide open, jaw dropped, tongue = one flat
pink shape, 2 lower teeth as 2 cream triangles.
Flat cream #EDE7DA background. No text.
```

### 시트 2 — Bear shopkeeper

```
CHARACTER SHEET - Bear shopkeeper
Flat poster-plate style, 0 outlines - see anchor changjak-tautline.

A stout brown bear, the only biped and the only dressed character. Body = one
flat warm-brown mass #7A5A44, rounded shoulders, no neck. Wears a cream apron
#EDE7DA that covers the whole front, with 2 apron strings tied at the back -
those strings must be visible from behind, they are grabbed on p5. Ears = 2 small
half-circles. Eyes = 2 dots, brows = 2 short flat strokes that sit low but never
angle into anger. 0 fur strokes, 0 buttons, 0 pockets, 0 lettering on the apron.
Silhouette test: the widest, tallest shape in the book, a cream rectangle on a
brown mass.
REFERENCE SHEET: (a) standing, front, one palm raised flat in a stop gesture
(b) standing, both arms thrown straight up over the head, mouth open (c) leaning
backward, both fists gripping low, one foot stamped forward (d) back view showing
the 2 apron strings.
Flat cream background. No text.
```

### 시트 3 — Goose

```
CHARACTER SHEET - Goose
Flat poster-plate style, 0 outlines - see anchor changjak-tautline.

A white domestic goose. Body = one flat cream oval #EDE7DA. Neck = one long
cream band that can be drawn at 2 lengths: normal (a) and stretched to twice
that (c). Beak = 1 flat orange wedge #C97A2E - the ONLY orange in the book, and
it belongs to the goose alone. Feet = 2 flat orange webbed shapes. Tail feathers
= exactly 4 flat cream blades, drawn as separate shapes so a goat can bite them.
Eyes = 2 black dots. 0 feather strokes, 0 clothing.
REFERENCE SHEET: (a) standing, side view, neck normal (b) webbed feet planted
flat and braced, body leaning back (c) neck stretched to double length, eyes
squeezed shut into 2 short curves (d) tail close-up - the 4 blades, 2 of them
bent as if pulled.
Flat grey #A6A29A background. No text.
```

### 시트 4 — Goat

```
CHARACTER SHEET - Goat
Flat poster-plate style, 0 outlines - see anchor changjak-tautline.

A small goat. Body = one flat pale-grey block #C6C1B6, squarer than the goose
and shorter than the bear. Horns = 2 short flat dark curves #5B3A2A, no more
than one ear long. Beard = 1 flat wedge under the chin. Legs = 4 straight flat
bands ending in 2-tone hooves. Tail = 1 short upright flat shape. Eyes = 2 black
dots. 0 fur strokes, 0 bell, 0 clothing.
Silhouette test: the only animal with 2 curved horns above the head line.
REFERENCE SHEET: (a) standing, side view (b) all four legs braced forward,
hooves dug in, body pitched back (c) head thrown up, mouth wide open, bleating
(d) tail close-up, seen from behind - a cat must be able to hang from it.
Flat grey background. No text.
```

### 시트 5 — Cat

```
CHARACTER SHEET - Cat
Flat poster-plate style, 0 outlines - see anchor changjak-tautline.

A tabby cat. Body = one flat warm-grey shape #9C948A carrying exactly 5 darker
flat stripes #5B3A2A across the back - 5, never more, and they are flat bands,
not brush strokes. Head = one circle, ears = 2 triangles. Eyes = 2 large black
dots, the roundest eyes in the book. Tail = one long flat band. 0 whiskers,
0 fur strokes, 0 collar, 0 clothing.
REFERENCE SHEET: (a) standing, side view, showing the 5 stripes (b) hanging by
both front paws from something overhead, hind legs off the ground and swinging
(c) eyes at maximum roundness, head-on (d) flat on its back, all 4 legs spread.
Flat grey background. No text.
```

### 시트 6 — Five ducks (one stamp, repeated)

```
CHARACTER SHEET - Five ducks
Flat poster-plate style, 0 outlines - see anchor changjak-tautline.

ONE duck shape, to be repeated 5 times with 0 variation - same size, same colour,
same posture, same angle. Body = one flat yellow ovoid #D9B65C. Beak = 1 flat
orange wedge, smaller than the goose's. Feet = 2 flat orange paddles. Eyes =
2 black dots. Tail = 1 short flat cream tuft that the next duck bites. 0 feather
strokes, 0 clothing, 0 numbering, 0 size difference between the five.
Silhouette test: the smallest bodies in the book; five identical yellow beads.
REFERENCE SHEET: (a) one duck, side profile, standing (b) the same duck with its
beak closed on a tuft in front of it (c) the row of 5 in single file, all beaks
pointing the same way, evenly spaced (d) one duck tipped over on its back.
Flat grey background. No text.
```

---

## §4. 쪽별 컷

### p1

```
--- p1 — 장대의 팽팽한 한 줄 ---
ROPE: the single brush stroke runs dead straight and horizontal across the
upper third, slung on a bare wooden pole - drawn as if ruled. This is its
tautest state in the book.
GRIP: nobody holds it. 0 hands, 0 beaks, 0 teeth on the rope.
GROUND: one flat grey plane, 0 cobbles drawn.

CAMERA: wide, eye level, flat horizontal composition, no perspective lines.
SUBJECT: lower left - the dachshund pup sitting, front paws together, head
tipped all the way back, nose lifted straight up (sheet posture c). Right - the
bear shopkeeper standing, one palm raised flat toward the dog (sheet posture a).
SETTING: the west corner of the square, morning market just opened. One bare
pole; a red-and-cream striped awning above the shop, at most 5 stripes; at most
3 flat rectangles for buildings behind.
FINISH: FINISHED THINGS = 2 (dog, bear). The rope is the one brush stroke and
the darkest thing on the page. Everything else flat colour, 0 detail.
TONE: low warm morning light as flat colour only - no glow, no gradient.
NO letters, numbers, signs or shop names anywhere; the awning is stripes only.
```

### p2

```
--- p2 — 물었다 ---
ROPE: still the one taut stroke, but its far end has just started to slide off
the pole - the stroke now dips at the end where the dog's teeth close on it.
GRIP: teeth = 1 (the dog).
GROUND: one flat grey plane, 0 cobbles drawn.

CAMERA: medium, slightly low angle looking up at the dog.
SUBJECT: centre - the dachshund airborne, all four feet off the ground, body
arched like a bow, ears flying up, teeth shut on the end link of the rope.
Right - the bear with both arms thrown straight up over his head, mouth open
(sheet posture b), apron hem lifting.
SETTING: directly under the pole. Awning corner at the top right, at most 5
stripes.
FINISH: FINISHED THINGS = 2 (dog, bear). The bear stays flat colour at 0 detail
behind - do not blur him, simply give him no finish.
TONE: morning light as flat colour.
NO letters, numbers or signs anywhere.
```

### p3

```
--- p3 — 끌려간다 ---
ROPE: the one stroke now lies low and long, dragged across the whole width of
the frame - still straight, still under tension, longest single stroke so far.
GRIP: teeth = 1 (the dog).
GROUND: one flat grey plane, 0 cobbles drawn.

CAMERA: wide, eye level, movement reading left to right.
SUBJECT: right foreground - the dachshund running flat out, fore and hind legs
stretched apart, ears blown back, rope end in its teeth (sheet posture b).
Left background - the bear breaking out of the shop, one arm thrown forward,
mouth open.
SETTING: open square. The round stone rim of the well clips the right edge of
the frame - one flat cream arc, 0 stones drawn on it.
FINISH: FINISHED THINGS = 2 (dog, bear). The rope is the longest line on the
page and the darkest thing in the frame.
TONE: morning light as flat colour.
NO letters, numbers or signs anywhere.
```

### p4

```
--- p4 — 곰이 밟는다 ---
ROPE: the one stroke is pulled bar-straight between the two of them and crosses
the frame edge to edge, at maximum tension.
GRIP: 1 (bear - one foot stamped on the rope end, both fists closed on it).
GROUND: one flat grey plane. Exactly 4 kicked-up grey chips in the air, no more.

CAMERA: medium, low angle at cobble height, the rope crossing the frame at
mid-height.
SUBJECT: left - the bear leaning backward, one foot stamped down on the rope
end, both fists gripping, jaw clamped (sheet posture c). Right - the dachshund
pitched forward, hind feet raking backward.
SETTING: the cobbles left of the well; the lower part of the well rim behind.
FINISH: FINISHED THINGS = 2 (dog, bear). The straight rope cuts the frame
exactly in half.
TONE: morning light as flat colour.
NO letters, numbers or signs anywhere.
```

### p5

```
--- p5 — 거위가 앞치마 끈을 ---
ROPE: the one taut stroke continues past the bear and off frame - unchanged in
tension, only longer in the chain behind it.
GRIP: 2 (bear on rope, goose on the bear's apron strings).
GROUND: one flat grey plane. At most 6 grey chips heaped in front of the bear's
sliding feet.

CAMERA: wide, eye level.
SUBJECT: left rear - the white goose, neck stretched forward at double length,
beak closed on one of the bear's 2 apron strings, both webbed feet planted flat
and braced (sheet postures b + c). Centre - the bear's two feet skidding
forward, body still pitched back. Right - the dachshund pulling on the rope.
SETTING: same spot. The well rim behind, one flat cream arc.
FINISH: FINISHED THINGS = 2 (dog, goose). The bear drops to flat colour this
page - he is being pulled, not acting.
TONE: morning light as flat colour. Empty square behind, 0 detail.
NO letters, numbers or signs anywhere.
```

### p6

```
--- p6 — 염소가 꽁지깃을 ---
ROPE: the one taut stroke runs on behind, entering the frame at the left edge
and leaving at the right - straight, unchanged.
GRIP: 3 (bear on rope, goose on strings, goat on the goose's tail).
GROUND: one flat grey plane, 0 cobbles drawn.

CAMERA: medium, eye level, seen from the side.
SUBJECT: right - the goose, neck stretched to its longest curve in the book,
eyes squeezed shut into 2 short curves, beak still closed on the apron string.
Left - the goat with all four legs braced forward, hooves dug in, mouth closed
on the goose's tail; exactly 2 of the goose's 4 tail blades bend backward
(sheet posture d).
SETTING: same spot, slightly further back. No new objects.
FINISH: FINISHED THINGS = 2 (goose, goat). The stretched neck is the longest
curve on the page - the rope is the longest straight.
TONE: morning light as flat colour.
NO letters, numbers or signs anywhere.
```

### p7

```
--- p7 — 고양이가 대롱대롱 ---
ROPE: the one taut stroke grazes the side of the well rim and reaches the far
edge of the frame - still straight.
GRIP: 4 (bear, goose, goat, cat on the goat's tail).
GROUND: one flat grey plane, 0 cobbles drawn.

CAMERA: wide, slightly high angle.
SUBJECT: left - the tabby cat hanging by both front paws from the goat's tail,
hind legs off the ground and swinging, eyes at maximum roundness (sheet postures
b + c), all 5 stripes visible. Centre - the goat with its head thrown up, mouth
wide open, legs still braced. Right edge - the dachshund's hindquarters
disappearing past the well.
SETTING: the ground right in front of the well; the round stone rim, one flat
cream arc, 0 stones drawn.
FINISH: FINISHED THINGS = 2 (cat, goat).
TONE: morning light as flat colour.
NO letters, numbers or signs anywhere.
```

### p8

```
--- p8 — 오리 다섯이 붙는다 ---
ROPE: the one taut stroke wraps halfway round the well and runs on - straight
in every visible segment.
GRIP: 9 (bear, goose, goat, cat, and the 5 ducks - first duck on the cat's hind
leg, each of the other four on the tuft of the duck ahead).
GROUND: one flat grey plane, 0 cobbles drawn.
DENSITY: this is a ration page - FINISHED THINGS = 6, the reader counts the chain.

CAMERA: wide, high angle looking obliquely down on the square.
SUBJECT: lower band - the 5 ducks in single file, bodies touching, all 5 beaks
pointing the same way, evenly spaced (sheet posture c). ONE duck shape repeated
5 times with 0 variation in size, colour, posture or angle - stamped, not drawn
five times. Upper area - the dachshund half hidden behind the well, rope in its
teeth, running.
SETTING: the well and the ground around it. Everything outside that circle is
left as flat ground colour, 0 objects.
FINISH: the 5 ducks plus cat, goat, goose read as finished; the square is empty.
TONE: morning light as flat colour.
NO letters, numbers or signs anywhere.
```

### p9

```
--- p9 — 고리가 닫힌다 ---
ROPE: the one stroke has gone all the way round the well and closes on itself -
seen from directly above, the stroke plus the bodies read as a single ring. Still
taut. This is the page where the circle shuts.
GRIP: 9, unchanged.
GROUND: one flat grey plane, 0 cobbles drawn.
DENSITY: ration page - FINISHED THINGS = 6.

CAMERA: wide, high angle looking straight down on the well from above.
SUBJECT: the whole frame - bear, goose, goat, cat and 5 ducks strung round the
well in one continuous line, the ring almost closed. Lower area - the dachshund
braking, all four feet planted, body tipping forward, rope still in its teeth.
Right at its nose - the last duck twisting only its head back to look at the dog,
tail tuft lifted.
SETTING: the round stone well as one flat cream disc, 0 stones drawn; the ground
inside and outside the ring is one flat colour with 0 objects.
FINISH: read the ring first, the dog second. The circle must close visually.
TONE: morning light as flat colour.
NO letters, numbers or signs anywhere.
```

### p10

```
--- p10 — 입이 벌어진다 ---
ROPE: only its very end is in frame, resting on the lower teeth - the last page
on which it is still held.
GRIP: teeth = 1 (the dog), and it is about to become 0.
GROUND: not in frame.
DENSITY: ration page, spent on ONE thing - the open mouth is the most finished
object in the book. Exactly 3 marks inside it: tongue, lower teeth, the rope end
lying on them. Everything else in frame = 0.

CAMERA: close-up, eye level with the dog's face.
SUBJECT: centre - the dachshund's head, jaw dropped wide open (sheet posture d),
pink tongue as one flat shape, 2 lower teeth as 2 cream triangles, the end of the
rope balanced across them. Eyes locked straight ahead, ears folded back.
SETTING: at most 3 flat cream shapes for well stones behind. At the right frame
edge, exactly 3 duck tail blades and nothing else.
FINISH: nothing else in the frame is drawn - not the square, not the chain, not
the sky. Empty flat colour.
TONE: morning light as flat colour.
NO letters, numbers or signs anywhere.
```

### p11

```
--- p11 — 툭 ---
ROPE: FIRST BEND IN THE BOOK. The stroke arrives dead straight from the top of
the frame, touches the ground, and from that contact point onward it slumps into
a slack curve. Straight above the touch, curved below it - both states in one
stroke, and the eye must land on the elbow between them.
GRIP: 0. Nothing holds the rope any more.
GROUND: one flat grey plane. At most 4 grey chips.

CAMERA: medium close-up, low angle at cobble height.
SUBJECT: upper area - the dachshund frozen with its jaw still open, eyes rolled
down; the mouth is empty, 0 rope inside it. Lower area - the end of the rope just
touching the ground.
SETTING: the cobbles beside the well. Nothing else in frame.
FINISH: FINISHED THINGS = 2 (the dog's open mouth, the bend in the rope).
TONE: morning light as flat colour.
NO letters, numbers or signs anywhere.
```

### p12

```
--- p12 — 벌러덩 ---
ROPE: the one stroke is now slack everywhere, threading loosely between the
fallen bodies. 0 straight segments left.
GRIP: 0.
GROUND: one flat grey plane, 0 cobbles drawn.

CAMERA: wide, eye level.
SUBJECT: centre - a stack: the bear flat on his back; the goose upside down on
his belly with both webbed feet in the air; the goat lying sideways on the goose;
the cat on top, all four legs spread (sheet posture d). Right - the 5 ducks
tipped over and rolling apart, still one repeated shape, 0 variation.
SETTING: the ground on the far side of the well; the lower well rim behind. The
square itself stays empty flat colour.
FINISH: only the pile is finished; 0 objects elsewhere.
TONE: morning light as flat colour.
NO letters, numbers or signs anywhere.
```

### p13

```
--- p13 — 풀린 줄 ---
ROPE: the same single stroke as p1, laid across the whole width of the frame in
loose meandering curves. Same brush, same colour, same length, same place -
0 straight segments. p1 and p13 must read as one object in two states.
GRIP: 0. No hand, no beak, no tooth touches anything - every paw, beak and foot
in the frame is visibly open and clear of the rope.
GROUND: one flat grey plane, 0 cobbles drawn.

CAMERA: wide, slightly high angle, the same flat horizontal composition as p1.
SUBJECT: right - the dachshund sitting on its haunches beside the rope, mouth
shut, head tipped slightly toward it. Left rear - the bear sitting on the ground
with both arms hanging; goose, goat, cat and the 5 ducks slumped separately, all
spaced apart, none touching another.
SETTING: the middle of the square in front of the well. The bare pole stands
empty. The awning above, at most 5 stripes.
FINISH: FINISHED THINGS = 2 (dog, rope). The rope is still the darkest thing on
the page - and this time it is not straight.
TONE: morning light one step higher than p1, still flat colour, no glow.
NO letters, numbers, signs or shop names anywhere; the awning is stripes only,
the pole is bare wood.
```
