# 창작동화 1000 — E-04 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/e04.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## E-04 §1. 앵커 배정

**권**: e04 「양말 한 짝은 어디로 가나」 · 오해와 반전 · 스코틀랜드 돌집 부엌 · 13쪽 · 4~6세
**클러스터**: C9 · **슬러그**: `changjak-twosided` (신규 민팅)
**한 줄**: **앞뒤 색이 다른 양면 색지**를 오려 쓴다. 뒤집으면 그 조각의 색이 바뀌고, **화면 안 빨강은 오직 그 한 조각의 앞면**뿐이다.

🔴 **형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | 판정 |
|---|---|---|
| **a14 · c08 · d10 · g01 · h10** (C9 다섯) | **조각이 뒤집히나** | 저 다섯의 조각은 끝까지 **한 면만** 보인다 · **e04 는 뒤집기가 이 책의 사건 전부** |
| **d10** `changjak-hullcut` | 비교 방식 | d10 = 같은 도형 넷을 **나란히 놓고** 비교 · **e04 = 한 조각의 두 상태** |
| **f04** `changjak-onehole`(같은 배치·같은 C9 신규) | 하는 일 | f04 = **하나를 뚫는다**(빼기) · **e04 = 뒤집는다**(앞뒤 색). 지지면도 정반대(크림 회벽 빈 방 ↔ 젖은 화강암 회색 실내) |
| **e07**(둘 다 회색+빨강 1점) | 회색의 온도 | e07 = 마른 자갈, 밝고 따뜻 · **e04 = 젖은 화강암, 차갑고 어둡다** |
| 🔴 **호리 니들펠트 라인** | 두께 | 조각은 **한 장 두께**이고 **바늘땀·양모 보풀·섬유 엣지가 0**이다. 양말을 다루는 책이라 여기서 제일 새기 쉽다 |

🔴 **이 권만 배경 밀도 규칙이 반대다.** 「찾아내는 그림」이라 **p4·p6 은 배경의 단서가 두 번째 마감 자리를 가져간다** — 그 쪽에서 형(세탁기 뒤에 머리를 넣은 · 난로 밑에 코를 넣은)은 얼굴이 안 보이는 자세라 마감이 반으로 떨어지고, **동생 발끝에서 뒤집히는 양말이 눈에 걸린다.** 다만 그 조각이 형보다 더 마감되면 안 된다 — 두 번째 자리이지 첫 번째가 아니다.

**대본 SCENE 처방표** (대본은 안 고치고 컷에서 분기)

| 대본 문구 | 옮기는 법 |
|---|---|
| p1 「창이 뿌옇다」 | 뿌옇게 하지 않는다 → **창 = 옅은 회색 조각 한 장**, 빗줄기는 그 위에 오린 가는 띠 5개 |
| p4 「반쯤 마감해 눈이 한 번 걸리게」 | 뒤집힌 안쪽 조각만 **가장자리를 칼로 자른 듯 딱** 내고, 나머지 배경은 가위자국 그대로 |
| p11 「늘어난 양말의 팽팽한 결」 | 결이 없는 매체다 → **조각을 길쭉하게 다시 오려** 폭이 좁아진 한 장으로 |
| p12 「이 쪽이 화면에서 가장 밝다」 | 조명을 못 쓴다 → **배경 조각 수를 줄이고** 빨간 앞면 면적을 최대로 |

## E-04 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-twosided

Style: picture book for 4-6 year olds. A stone-built Scottish kitchen on a wet afternoon, built entirely from cut paper. Every element is a piece of two-sided coloured stock: one face one colour, the reverse another. Pieces are laid on a cool grey sheet that is the room itself. Every edge is a scissor edge.

RENDERING (finish hierarchy)
Every piece is ONE SHEET THICK and matte. Pieces lie flat and butt against each other; a piece may overlap another, but nothing is embossed, quilted, stuffed or stitched.
THE ONE MECHANISM: only the sock pieces are ever turned over. Front face = #E4DED2 with #C0392B stripes. Back face = plain #A8ABA6. A piece caught mid-turn shows both faces at once, divided by one straight fold - that happens on exactly one page.
Drawn marks per page = 0. No pencil, ink, brush or crayon touches any piece. Faces, folds and stripes are all separate cut pieces.
FINISHED THINGS PER PAGE = 2 - the elder terrier, and the one thing he handles. DENSITY RATION = p4 and p6 only: on those two pages the second finished slot goes instead to the little brother's sock turning inside out in the background, and the elder (head in a gap, nose under a stove) drops to half. It must stay below him, never above.
Piece counts: ordinary socks per page = at most 7. Raindrops = 5 cut strips, no more. The stone wall = 1 piece, 0 stones cut into it. The floor = 1 piece, 0 joints. Dust balls = 2 shapes. Ash = 4 specks. Pegs = 2 shapes.
Cast shadows = 0. There is no light in this book, only paper.

PALETTE
#7E8286 the cool grey ground sheet - the kitchen itself · #A8ABA6 sock backs, ordinary socks, the washing machine, the rack · #E4DED2 the terriers, the window, sock fronts · #C0392B the stripes, the only red · #5E6266 ears, muzzle patches, punched eyes, the gap behind the machine · #D9B27A used exactly once, on p6, as the stove mouth (it is the reverse face of the pale stock and it never turns).
Nothing else is red. No orange, no brown, no green anywhere else.

CHARACTER DESIGN LANGUAGE
Terriers who stand upright to reach and work, and drop to four legs to crouch and sniff. They use their forepaws as hands. They wear no clothing at all - socks are laundry, never worn by the elder. Each animal is 4 to 6 cut pieces: body, head, two ears, a muzzle patch, a tail. Eye = one punched #5E6266 disc, nothing inside it. Open mouth = one cut #5E6266 shape. There are no whiskers, no eyebrows, no fur edges - the outline of a body is a plain scissor cut, slightly wavering, never feathered or torn.

CANVAS
16:9 double-page spread. Keep the lower 12% quiet for a caption. No letters, numbers, labels or symbols anywhere - not on the machine, the basket or the stove.

NOT (rendering only)
- 0 drawn marks: no pencil, ink or brush on any piece; every edge is cut with scissors
- no stitching, needle-felted wool or fibre edge; every piece is one sheet thick and matte
- no gloss, gradient, airbrush, cast shadow or 3D render - each face is one flat tone
- no red anywhere except the striped sock pieces
```

## E-04 §3. 캐릭터 시트

### 시트 1 — TerrierBig

```
CHARACTER SHEET - TerrierBig   (bake this FIRST)

Medium: STYLE ANCHOR changjak-twosided - flat cut paper, one sheet thick, 0 drawn marks.

FACE
Head = one #E4DED2 piece, roughly rectangular with a blunt bearded chin, cut in a slightly wavering line. Muzzle patch = one #5E6266 piece over the lower third. Ears = two #5E6266 triangles folded forward at the tip, cut as one piece each with a notch. Eye = one punched #5E6266 disc; surprise is shown by swapping in a larger disc, never by adding a highlight. Open mouth = one cut #5E6266 shape. Nose = one small #5E6266 disc at the muzzle tip.

FUR
There is none to draw. The coat exists only as the cut silhouette: two shallow notches at the shoulder, three along the underside, a squared-off rump. 0 fur strokes, 0 torn edges.

CLOTHES
None, ever. He handles socks but never wears one.

BUILD & SILHOUETTE
A wiry young terrier: chest deep, legs short and straight, tail a short upright wedge. Standing upright to reach the rack he is exactly as tall as the lowered rack line; on all fours his back is level with the top of the washing basket. Silhouette test against TerrierWee: TerrierBig's head is squared with a bearded chin and his tail stands straight up; TerrierWee's head is round and his tail is a small curl.

REFERENCE SHEET
Pieces laid on one flat grey sheet, no ground, no shadow:
1) full body standing on four legs, side view
2) standing upright on the hind legs, both forepaws reaching above the head
3) rump up, forelegs braced against a wall, head pushed into a narrow gap (head piece hidden behind the gap piece, only the neck and body showing)
4) belly flat on the floor, both forelegs stretched forward, one eye disc swapped for a squeezed slit shape
5) sitting slumped, hind legs splayed, forepaws fallen to the floor, tail piece laid flat
6) kneeling up, both forepaws pulling something apart, forelegs straight
7) head close-up x3 - calm disc / large disc with open mouth / large disc with the mouth shape gone
```

### 시트 2 — TerrierWee

```
CHARACTER SHEET - TerrierWee   (bake this FIRST)

Medium: STYLE ANCHOR changjak-twosided - flat cut paper, one sheet thick, 0 drawn marks.

FACE
Head = one #E4DED2 piece, round, no beard. Muzzle patch = one small #5E6266 piece. Ears = two #5E6266 triangles, both flopping outward. Eye = one punched #5E6266 disc, larger in proportion than TerrierBig's. Nose = one small disc.

FUR
None drawn. The silhouette is cut smooth with only one notch at each shoulder - simpler than TerrierBig's, because he is younger.

CLOTHES
Socks only, and only on his hind feet. He wears the pair the whole book: each is the same two-sided stock as the laundry, red-striped face out while worn. He takes them off in the background of p4 and p6 and again in the foreground of p13.

BUILD & SILHOUETTE
Two thirds of TerrierBig's height, rounder, shorter legs, tail a small curl instead of an upright wedge. Standing upright he can just reach the lowered rack line and not the raised one. Silhouette test: round head, floppy ears, curl of a tail.

REFERENCE SHEET
Pieces laid on one flat grey sheet, no ground, no shadow:
1) full body standing on four legs, side view, both hind feet in socks
2) standing upright, one hind foot lifted, both forepaws gripping that foot's sock toe and pulling down
3) THE KEY POSE - the same pull, caught later: the sock is halfway off and has turned inside out, so the piece showing at the toe is plain #A8ABA6 and no red is visible at all
4) the same pull caught EARLIER: the sock is half turned, one straight fold across it, red-striped face on one side of the fold and plain grey on the other
5) standing upright, both forepaws holding a sock out toward the camera
6) both forepaws raised, jumping, hind legs off the ground
7) head close-up x2 - calm / large disc with an open mouth shape
```

## E-04 §4. 쪽별 컷

### p1 — 빨래걸이가 스르르

```
--- p1 - 빨래걸이가 스르르 ---
PAPER: the rack and every sock on it lie flat on the grey ground sheet. Sock pieces on the rack = 6 plain #A8ABA6 backs, plus 1 at the right end that is the turned one.
RED: 1 - a hair-thin #C0392B strip at the toe of that right-hand sock, no longer than an eyelash. Nothing else red.
CLUE: none yet.
CAMERA: wide, low angle, the rack crossing the top of the frame.
SUBJECT: TerrierBig at lower centre, up on the hind legs, both forepaws raised, a peg in his mouth clipping a sock to the rack line, chin lifted.
SETTING: rack = 4 slats + 1 line; 1 willow basket at his feet; window = 1 pale piece with 5 cut rain strips; wall = 1 piece with 0 stones cut into it.
FINISH: TerrierBig full; the rack of socks is the second finished thing. The right-hand sock is not singled out - it sits in the row like the others.
TONE: cool grey throughout. The red thread is the only warm mark on the page and it is tiny.
```

### p2 — 짝, 짝, 그리고—

```
--- p2 - 짝, 짝, 그리고— ---
PAPER: socks on the line = 7. Six are plain grey backs; one at the right end shows a full red-striped FRONT face - that one is the mate that was never lost. The turned sock hangs beside it, plain grey.
RED: 1 whole striped sock + 1 thread. Both belong to the same pair.
CLUE: none.
CAMERA: medium, eye level, level with the line so the row runs flat across the frame.
SUBJECT: TerrierBig at left on the hind legs, one forepaw reaching along the line, stopped at the end. One eye disc swapped for the larger size, one ear piece folded back.
SETTING: the rack line and the row of socks. Nothing else in the frame.
FINISH: TerrierBig full; the lone striped sock is the second finished thing. The grey sock next to it gets no extra cut, no extra edge - it must look like all the others.
TONE: flat grey with one red piece at the end of the row.
```

### p3 — 세탁기 뒤

```
--- p3 - 세탁기 뒤 ---
PAPER: machine = 2 pieces (side and top). The gap behind it = 1 #5E6266 piece, the darkest shape on the page.
RED: 0.
CLUE: none.
CAMERA: medium, low, close to the floor.
SUBJECT: TerrierBig at right, rump up, forepaws braced on the wall, head pushed into the gap so the head piece is hidden behind the gap piece; tail wedge straight up.
SETTING: the machine, 2 dust balls, the floor as 1 piece with 0 joints. Nothing else.
FINISH: TerrierBig full; the black gap he has vanished into is the second finished thing.
TONE: the darkest page so far - one big #5E6266 shape against grey.
```

### p4 — 형! 나 비 다 맞았어

```
--- p4 - 형! 나 비 다 맞았어 ---
PAPER: TerrierWee's right sock is coming off. Caught late: the piece has already rolled inside out at the toe, so what shows is plain #A8ABA6 and the striped face is hidden inside the roll.
RED: 0. The red is inside the rolled piece where nobody can see it - that is the point of the page.
CLUE: 🔴 THIS PAGE. TerrierWee's peeling sock takes the second finished slot: its edges are the crispest cuts on the page and the roll at the toe is a separate piece butted against the sock. TerrierBig drops to half - he is head-in-the-gap and faceless.
CAMERA: wide, eye level, doorway and machine corner both in frame.
SUBJECT: TerrierWee at left in the doorway, upright, one hind foot lifted, both forepaws gripping the sock toe and pulling down. TerrierBig at right, still head-in-the-gap, back turned, one forepaw waving vaguely.
SETTING: 2 wet paw shapes at the door, the machine side. Nothing else - keep the rest of the kitchen empty so the eye reaches the sock.
FINISH: TerrierBig at half; the peeling sock second and fully cut; everything else raw.
TONE: flat grey. The turning sock must be noticeable without a single mark pointing at it.
```

### p5 — 우수수, 우수수

```
--- p5 - 우수수, 우수수 ---
PAPER: falling socks = 6 pieces, all plain #A8ABA6, all backs. 0 fronts anywhere.
RED: 0 - there is no red on this page at all.
CLUE: none.
CAMERA: medium wide, slightly high angle.
SUBJECT: TerrierBig at centre, both forepaws holding the willow basket upside down above his head, body arched back, one hind foot off the floor.
SETTING: 6 falling sock pieces + 3 already on the floor (7 total on the page, at the cap), the floor as 1 piece.
FINISH: TerrierBig full; the basket is the second finished thing. The socks are identical cuts, deliberately dull.
TONE: an all-grey page. Its job is to make p12's red land.
```

### p6 — 여기도 없어

```
--- p6 - 여기도 없어 ---
PAPER: TerrierWee's left sock is coming off, caught late again - already rolled inside out, plain #A8ABA6 showing, the red face hidden in the roll. The stove mouth = 1 piece of #D9B27A, the only time that colour appears in the book.
RED: 0.
CLUE: 🔴 THIS PAGE. The second peeling sock takes the second finished slot, and this time it is the other hind foot, so a reader who missed p4 sees the same event mirrored. TerrierBig drops to half - nose under the stove, one eye squeezed to a slit.
CAMERA: medium, lens on the floor.
SUBJECT: TerrierBig at right, belly flat, both forelegs stretched under the stove leg, muzzle out of sight beneath it. TerrierWee at left rear, upright, pulling the sock off.
SETTING: the low stove as 2 pieces + the #D9B27A mouth, 4 ash specks, 2 socks on the floor.
FINISH: TerrierBig at half; the peeling sock second; the stove mouth stays a flat piece with no glow around it.
TONE: one warm shape in a grey room, and it is not the clue - the clue is the plain grey roll at the puppy's toe.
```

### p7 — 걸이 위도 텅

```
--- p7 - 걸이 위도 텅 ---
PAPER: the rack has come down to the elder's face height. Socks on the line = 6 grey backs + the turned one at the right end.
RED: 1 thread only, at the turned sock's toe, now at the elder's eye height and still unnoticed.
CLUE: none.
CAMERA: medium, eye level.
SUBJECT: TerrierBig at centre, both forepaws gripping the pulley rope on the wall, hanging his whole weight on it, hind feet pushing the floor, mouth shut hard.
SETTING: the lowered rack pressing down across the upper frame, the rope, the socks.
FINISH: TerrierBig full; the rope is the second finished thing.
TONE: the rack piece crowds the top of the frame so the page feels pressed down.
```

### p8 — 그냥 없어져 버렸어

```
--- p8 - 그냥 없어져 버렸어 ---
PAPER: socks on the floor = 7 plain grey backs, spread flat like fallen leaves.
RED: 0.
CLUE: none.
CAMERA: medium, high angle looking down.
SUBJECT: TerrierBig at centre, sat down in the middle of the socks, hind legs splayed, both forepaws fallen onto the floor beside him, head down, tail piece laid flat on the ground for the first time.
SETTING: the socks, the tipped basket, the floor piece. Nothing else.
FINISH: TerrierBig full; the flat-laid tail is the second finished thing - it is where the page's feeling lives.
TONE: swap the ground sheet for its coolest reading: the whole page one step down, and 0 red.
```

### p9 — 그건 그냥 회색이잖아

```
--- p9 - 그건 그냥 회색이잖아 ---
PAPER: the turned sock has left the rack and is now held out flat, plain #A8ABA6 face up.
RED: 1 thread, at the toe of the held-out sock - the most finished cut on the page.
CLUE: none (the puppy is now in the foreground, not the background).
CAMERA: medium close-up, eye level.
SUBJECT: TerrierWee at left, upright, both forepaws holding the grey sock out toward his brother, tail curl lifted. TerrierBig at right, still sitting, head not raised, one forepaw pushing the sock away.
SETTING: 1 rack line at face height, 2 peg shapes. Nothing else.
FINISH: TerrierBig full; the red thread is the second finished thing - a mark the size of an eyelash, cut cleaner than anything else on the page.
TONE: grey on grey, with the whole page arranged so the eye slides down the sock to the toe.
```

### p10 — 빨간 실 한 올

```
--- p10 - 빨간 실 한 올 ---
PAPER: one sock piece, plain grey back up, held between two sets of forepaws.
RED: 1 thread, and it is now the largest thing in frame relative to the crop.
CLUE: none.
CAMERA: close-up at forepaw height, the sock filling the middle band of the frame.
SUBJECT: TerrierBig's forepaw at the bottom, stopped against the sock; above it his muzzle piece pushed close and one eye disc swapped for the larger size. TerrierWee's two forepaws enter from the top edge, holding the sock up.
SETTING: nothing at all. The ground sheet is bare behind the sock.
FINISH: the sock full; the red thread is the second finished thing. There is no third thing on this page.
TONE: one red mark on grey, with every other piece removed from the frame.
```

### p11 — 뒤집혀 있잖아!

```
--- p11 - 뒤집혀 있잖아! ---
PAPER: the sock piece is re-cut longer and narrower to show it stretched - same colour, same back face, a taller thinner shape. It has NOT turned yet.
RED: 1 thread, now stretched with the piece into a longer strip.
CLUE: none.
CAMERA: medium, eye level.
SUBJECT: TerrierBig at centre, knelt up, one forepaw at the sock's cuff and one at the toe, both forelegs straight, mouth open. TerrierWee beside him, forepaws together, watching.
SETTING: the slack rack line behind them. Nothing else.
FINISH: TerrierBig full; the stretched sock is the second finished thing.
TONE: still grey. Hold the red back one more page.
```

### p12 — 찾았어!

```
--- p12 - 찾았어! ---
PAPER: THE TURN. The sock piece is now front face up: #E4DED2 with #C0392B stripes, held wide open with both forepaws. The grey back is gone from view entirely.
RED: the whole striped face, at its largest area in the book.
CLUE: none.
CAMERA: medium, slightly low angle looking up at the held-up sock.
SUBJECT: TerrierBig at centre, both forepaws thrust above his head holding the sock spread wide, one hind foot off the floor, mouth open. TerrierWee at right, both forepaws up, jumping, hind feet off the floor.
SETTING: 1 rack line and nothing else - strip the background so the red face has the most room it will ever get.
FINISH: TerrierBig full; the striped sock is the second finished thing and the largest red area of the book.
TONE: there is no lighting to brighten this page. Brightness comes from removing pieces and enlarging the red one.
```

### p13 — …너였구나?

```
--- p13 - …너였구나? ---
PAPER: THE MECHANISM SHOWN. TerrierWee's remaining sock is caught EARLY in the pull - one straight fold runs across the piece, red-striped face on the upper side of the fold, plain #A8ABA6 on the lower side, both faces visible at once. It dangles from the toe. This is the only page in the book where one piece shows two faces.
RED: half a sock. Do not put any other red in the frame - the found sock from p12 is out of shot.
CLUE: the clue has come to the foreground; nothing is hidden any more.
CAMERA: medium close-up at foot height, low.
SUBJECT: TerrierWee at right, one hind foot lifted, both forepaws gripping the toe and pulling down hard. TerrierBig at left, sitting, head snapped round toward him, mouth half open, eye disc at the larger size.
SETTING: the two bodies and the one sock. The ground sheet behind them is bare.
FINISH: TerrierBig full; the folded sock is the second finished thing, and the fold line itself is the crispest cut on the page.
TONE: grey with a half-red piece. The page's whole meaning is that straight fold - keep it dead straight and keep both faces the same size.
```
