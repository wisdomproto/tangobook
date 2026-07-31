# 창작동화 1000 — b13 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/b13.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## b13 §1. 앵커 배정

**권**: b13 「수프에 빠진 별」 · 소원의 대가 · 폴란드 시골집 창가 식탁 한 자리 · 12쪽 · 4~6세
**클러스터**: **C9** (오려붙이기)
**앵커 슬러그**: `changjak-fourholes` — **신규 민팅**

**한 줄**: 진남색 밤 종이에 **뚫은 구멍 넷** 뒤에 **노란 종이 한 장**이 깔려 있다. 숟가락으로 들어 올리면 그 구멍이 같은 남색 종이 조각으로 **도로 막힌다**.

🔴 **이 공정에는 수상작 원본이 없다.** 오려붙이기 수상작들은 조각을 **얹지**, 지지면을 **뚫고 뒤를 깔지** 않는다. 점의 배치만 원본에서 맞고 「뒤가 뚫려 있다」는 없으므로 **프롬프트가 그것을 만들어야 한다.** 그래서 앵커 MEDIUM 이 물리를 세 가지로 못박는다 — ①구멍은 칠한 게 아니라 **칼로 낸 절단면**이라 가장자리에 종이 속심의 흰 실선과 두께 그림자가 있다 ②노란 종이는 **한 장**이라 네 점의 색값이 같은 것이 물리적으로 참이다 ③끄는 방법은 어둡게 하기가 아니라 **같은 남색 조각을 앞에서 덮기**(솔기와 그림자가 보인다).

### 형제 권과 갈린 축 (첫 렌더에서 세어진다)

| 형제 | 갈린 축 |
|---|---|
| **a09** `changjak-darkcut` | 🔴 **세는 것이 면적인가 개수인가** — a09 는 검은 도형이 빛에 잘려 **면적**이 줄고, b13 은 점 **크기가 열두 쪽 내내 안 변하고 개수만** 4↔3 으로 오간다 |
| **e05** `changjak-eatenpaper` | **구멍이 도로 막히나** — e05 는 뜯긴 것이 **안 돌아온다**. b13 은 p6→p7, p8→p9 두 번 도로 열린다 |
| **f04** `changjak-onehole` | **구멍이 몇 개이고 뒤가 밝나** — f04 는 하나 · 뒤가 어둡다. b13 은 넷 · 뒤가 노랗다 |
| **g01** `changjak-layerdark` | **어둠이 겹수인가 지지면인가** — g01 은 반투명 판을 겹쳐 어둠을 만든다. b13 의 어둠은 **밤 종이 그 자체**이고 겹이 0이다 |
| **f03** (같은 폴란드) | **반복 띠가 있나** — f03 은 민속 오려내기 띠. b13 은 **띠가 0**이다. 🔴 식탁·의자·창틀에 문양 금지 |

### 대본 SCENE 처방표 — 쪽마다 화면에 뚫린 구멍이 몇인가

🔴 **이 표가 이 권의 전부다.** 노란 종이는 한 장, 구멍 지름은 열두 쪽 내내 같다.

| 쪽 | 그릇/숟가락 | 창밖 지붕 위 | **화면 합계** | 막음(patch) |
|---|---|---|---|---|
| p1 | 0 (김이 덮음) | **3** | **3** | 없음 |
| p2 | 1 (국물 위) | 프레임 밖 | **1** | 없음 |
| p3 | 1 | **3** | **4** | 없음 |
| p4 | 1 | 프레임 밖 | **1** | 없음 |
| p5 | 1 (숟가락 위) | 프레임 밖 | **1** | 없음 |
| p6 | 프레임 밖 | **2** (가운데 빔) | **2** | **1** — 가운데 |
| p7 | 1 | **3** | **4** | 없음 |
| p8 | 1 (숟가락 위) | **2** (가운데 빔) | **3** | **1** — 가운데 |
| p9 | 1 | **3** | **4** | 없음 |
| p10 | 1 | **3** | **4** | 없음 |
| p11 | 1 | **1** (창 귀퉁이만 걸림) | **2** | 없음 |
| p12 | 1 | **3** | **4** | 없음 |

- 창이 든 쪽의 합계 = **3 · 4 · 2 · 4 · 3 · 4 · 4 · 2 · 4** — 후렴 구간(p7·p8·p9)이 **4 → 3 → 4**.
- 🔴 **창밖 셋의 자리와 간격은 p1 에서 고정**하고 p3·p7·p9·p10·p12 에서 **픽셀 단위로 같게** 둔다. 가운데만 없다는 것이 위아래 둘의 위치로 읽힌다.
- 🔴 **막음은 끔이 아니다** — 어둡게·흐리게·회색으로 처리 금지. 같은 남색 종이 조각을 앞에서 덮고 **솔기 실선 + 얇은 그림자**를 남긴다.

**사건 크기**: 아주 작다(빛 점 하나) · `FINISHED THINGS PER PAGE = 2` · `DENSITY RATION = none`

---

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-fourholes

Style: picture book for ages 4-6, one Polish farmhouse table corner and the small
square window beside it, 12 spreads, one location. Built from cut paper, not
painted. TOP SHEET: deep matte navy paper (#1B2440). This sheet IS the night -
the dark room, the sky, the shadow. It is never a painted shape and never
gradiented. BACK SHEET: one single sheet of warm yellow paper (#F2C64A) lying
behind it. Every yellow light in this book is a round hole cut clean through the
navy with a blade, showing that one back sheet - so all yellow points are
identically the same flat colour with 0 gradient inside. Each cut carries a
hairline pale paper core along its edge and a 1mm thickness shadow on one side.
Warm objects (table, chairs, spoon, window frame, roof line) are separate
honey-brown paper (#B98B52) pieces laid on top; soup, steam and spilled drops are
cream paper (#E8E2D2). Faces, paws and quills are drawn on those pieces with dry
brown pencil, at most 12 strokes per figure.

RENDERING (finish hierarchy)
FINISHED THINGS PER PAGE = 2 - the hedgehog whose hands are working, and the one
thing he touches that page (spoon / bowl rim / window sill). Everything else
stays flat cut paper with 0 interior marks. HOLE COUNT IS THE INSTRUMENT: hole
diameter is the same on every page and never changes (thumbnail scale on the
spread); only the NUMBER changes. A hole is closed by laying a patch of the same
navy paper over it from the front - the patch reads as a hairline seam plus a
thin cast shadow, and inside it there is 0 yellow. Never dim, blur, grey or fade
a hole to switch it off. PROP BUDGET = at most 5 objects per page from: bowl,
wooden spoon, low oil lamp, window frame, roof line, table edge, chair. Table,
chairs, cloth and window frame carry 0 pattern. Walls = 0 marks.
DENSITY RATION = none - no page raises density.

PALETTE
#1B2440 navy night paper (support, largest area) / #F2C64A yellow back sheet,
seen only through cuts / #B98B52 honey wood pieces / #E8E2D2 cream soup and
steam. The low oil lamp is one small dull orange patch (#8A4E22), at most a thumb
wide on the spread, always browner and darker than the cuts. No other hue
anywhere in the book.

CHARACTER DESIGN LANGUAGE
Two hedgehog brothers. Anthropomorphism grade, fixed for all 12 spreads:
bipedal, forepaws used as hands with 3 visible digits, simple clothes, head kept
animal - round black button nose, small round ears, quills short and soft. Quill
mass = one drawn contour with at most 9 short strokes inside; never individual
spines. Eyes = round black dots with one lighter notch. No human hair, no shoes,
no eyebrows.

CANVAS
16:9 double-page spread, full bleed to all four edges - no caption band, no
border, no reserved margin, bottom included. NO letters, numbers, signage or
symbols of any kind, in any language.

NOT (rendering only)
- no painted glow, bloom, halo, light rays or sparkle around the yellow; a cut
  hole has a hard blade edge
- no five-pointed star glyph, no cross twinkle; the light is a round hole
- no airbrush, no smooth gradient, no glossy 3D, no photographic texture filter
- no wool fibre, no needle-felt nap, no visible stitching
```

---

## §3. 캐릭터 시트

### 시트 1 — Brother Hedgehog

```
CHARACTER SHEET - Brother Hedgehog   (bake this FIRST)

Medium: cut paper pieces with dry brown pencil drawing on top, flat colour, no
shading. Support behind him is deep navy paper #1B2440.

FACE: young hedgehog kept animal. Short blunt muzzle in warm grey-brown paper,
round black button nose, mouth = one pencil line. Eyes = two round black dots,
each with one small lighter notch at upper left. Small round ears, one on each
side, low on the head. No eyebrows, no human hair, no blushed cheeks.
QUILLS: a soft cap of quills from brow to lower back, drawn as ONE contour with
at most 9 short strokes inside it. Quills lie flat when calm; when startled the
contour rises into 5 blunt points, never spikes.
BUILD: bipedal, 5 heads tall, round belly, short arms. Forepaws are hands with 3
visible digits and a pale pad line. Hind feet bare, 3 toes.
CLOTHES: a loose knitted sweater in honey-brown paper #B98B52 with 4 horizontal
darker stripes, sleeves ending at the wrist. Nothing else - no trousers, no
shoes, no scarf, no buttons.
DISTINGUISHING: he is the one with SLEEVES THAT END AT THE WRIST and stripes.
Silhouette = a striped barrel with two free hands.
REFERENCE SHEET: 4 views on plain navy #1B2440, evenly spaced, no ground line -
(1) full body front, standing idle, arms at sides
(2) full body 3/4 turn, right arm reaching sideways at shoulder height while the
    head stays turned the other way (his p8 posture, call it posture 3)
(3) head close-up, mouth open, eyes wide, quill contour risen
(4) head close-up, eyes half-closed, chin resting on both forepaws, quills flat
No letters, numbers or symbols anywhere on the sheet.
```

### 시트 2 — Younger Hedgehog

```
CHARACTER SHEET - Younger Hedgehog   (bake this FIRST)

Medium: cut paper pieces with dry brown pencil drawing on top, flat colour, no
shading. Support behind him is deep navy paper #1B2440.

FACE: IDENTICAL FACE CONSTRUCTION to Brother Hedgehog - same blunt muzzle, same
round black button nose, same two round black dot eyes with one lighter notch,
same small round ears, mouth = one pencil line. He is smaller, not different.
QUILLS: same soft cap, same rule - ONE contour, at most 9 strokes inside. His
contour is shorter and rounder.
BUILD: bipedal, 4 heads tall, clearly smaller than Brother - head larger relative
to the body, arms shorter. Forepaws are hands with 3 visible digits. Hind feet
bare, 3 toes.
CLOTHES: a loose long nightshirt in cream paper #E8E2D2, hem to mid-shin, SLEEVES
TOO LONG so they slide down over the paws and hang past the fingertips whenever
the arms are raised. No stripes, no pattern, no collar, no shoes.
DISTINGUISHING: cream against Brother's honey stripes, and the sleeves that
swallow his hands. At any distance the two read as STRIPED vs PLAIN.
REFERENCE SHEET: 4 views on plain navy #1B2440, evenly spaced, no ground line -
(1) full body front, standing idle, sleeves hanging over the paws
(2) full body 3/4 turn, one arm pointing straight forward, sleeve slid back to
    the elbow, back of the head to camera (his p6 posture, call it posture 2)
(3) head close-up, mouth wide open, eyes round, calling out
(4) head close-up, head tilted, one forepaw rubbing an eye, sleepy
No letters, numbers or symbols anywhere on the sheet.
```

---

## §4. 쪽별 컷

### p1

```
--- p1 — 수프 나왔다 ---
HOLES: 3 - outside the window on the roof line, in a slanted row (upper, middle,
lower). LOCK this placement and spacing; p3 p7 p9 p10 p12 repeat it exactly. 0
holes in the bowl (steam covers the whole surface). All 3 the same diameter.
PLUG: none.
PROPS: 5 - table edge, two chairs, bowl, spoon, low oil lamp.
CAMERA: medium wide, child eye level. LEFT half = table corner with Brother on
his chair. RIGHT half = one small square window. This left-table / right-window
framing returns identically on p7 and p12.
SUBJECT: Brother Hedgehog kneeling on the chair, rump on his heels, both forepaws
gripping the table edge, torso tipped toward the bowl, lips pushed into a small
round to blow, eyes down on the soup, quills flat. Striped sweater. GRADE:
bipedal, forepaws as hands, hedgehog head kept animal.
SETTING: honey-brown paper table corner, two straight-backed chairs, cream bowl
with a cream steam shape over the entire soup surface, spoon beside it, low lamp
at the far end. The navy support sheet is the room and the sky - not painted. A
low dark roof line under the window.
FINISH: Brother + the bowl he blows on. Chairs, lamp, frame and roof stay flat
cut paper, 0 interior marks, 0 pattern. No letters or numbers anywhere.
TONE: the room darker than the sky. The 3 cuts are the brightest thing on the
spread; the lamp patch stays browner and duller.
```

### p2

```
--- p2 — 국물 위에 노란 빛 하나 ---
HOLES: 1 - in the middle of the white soup, same diameter as the p1 roof holes.
Window out of frame. The cream soup piece is cut through together with the navy
beneath it so the yellow shows.
PLUG: none.
PROPS: 3 - bowl, spoon, table edge.
CAMERA: close-up, high angle looking almost straight down into the bowl. The
round cream soup fills the centre; Brother's nose and eyes enter over the top.
SUBJECT: Brother Hedgehog with his face lowered a hand's width above the bowl,
black button nose nearly touching the steam, both forepaws planted on the table
either side to brace, eyes wide with both pupils fixed on the single point below,
mouth slightly open, quill contour risen into 5 blunt points. GRADE: bipedal,
forepaws as hands, animal head.
SETTING: the cream soup disc with one round yellow cut at its centre. Steam is
now a thin cream sliver along the rim only. Spoon beside the bowl. A dull orange
lamp patch clipped at one corner. Nothing else.
FINISH: Brother's face + the bowl. The spoon stays flat paper, 0 marks. No
letters or numbers anywhere.
TONE: the bowl is the whole frame, the surround falls to flat navy. The cut is
the only light from below, so his chin and nose tip take a hard-edged pale plane
- not a glow.
```

### p3

```
--- p3 — 진짜 별이야 ---
HOLES: 4 - 1 in the soup + 3 on the roof line at rear right, in the p1 row with
p1 spacing, unchanged. The soup one and the roof ones must be indistinguishable
in colour and size.
PLUG: none.
PROPS: 5 - bowl, spoon, lamp, window frame, table edge.
CAMERA: medium close-up, child eye level from the side of the table. Brother at
left, Younger climbing in at right, the bowl low between their two faces.
SUBJECT: Younger Hedgehog with one knee up on the next chair and the other foot
still down with the heel raised, both forepaws clamped on the table corner,
hauling himself up so only his head clears the bowl, eyes round, mouth wide open,
long sleeves slid over his paws. Brother stays seated, head turned to him, one
forepaw pointing into the bowl, mouth corner lifted. GRADE: both bipedal,
forepaws as hands, animal heads - STRIPED vs PLAIN reads at a glance.
SETTING: the bowl between and below the two faces, spoon beside it, low lamp far
end, the small window at rear right with the roof line under it.
FINISH: the two heads + the bowl between them. Chairs, lamp and frame stay flat
cut paper, 0 marks, 0 pattern. No letters or numbers anywhere.
TONE: dark room, both faces lit from below by the soup cut as hard-edged pale
paper shapes under the chins, no soft falloff.
```

### p4

```
--- p4 — 숟가락을 밀어 넣어요 ---
HOLES: 1 - still floating in the soup, untouched, same diameter. Window out of
frame. The spoon has NOT reached under it yet.
PLUG: none.
PROPS: 3 - bowl, spoon, forearm.
CAMERA: close-up on a low diagonal, almost level with the soup surface so the
spread reads flat. The spoon enters from the left edge; the cut sits right of
centre.
SUBJECT: only Brother Hedgehog's forepaw and forearm are in frame at upper left,
3 digits holding the spoon handle lightly, wrist laid over so the spoon head
slides into the soup at an angle. His lower jaw and closed lip clip the top edge.
Striped sleeve at the wrist. GRADE: bipedal, forepaw as a hand.
SETTING: cream soup with a cut-paper split where the spoon passed through, the
cream folding back over it. Inside wall of the bowl carries one narrow yellow
reflection - cut, not painted, 1/3 the hole's width. Nothing else in frame.
FINISH: the paw + the spoon. The bowl stays flat paper, 0 interior marks. No
letters or numbers anywhere.
TONE: nothing has happened yet - held, quiet, flat. The single cut is the only
bright thing and the navy takes the rest of the spread.
```

### p5

```
--- p5 — 들어 올린다 ---
HOLES: 1 round hole, now cut in the bowl of the raised wooden spoon, SAME
diameter as every other hole in the book. Plus 4 hairline straight slits
radiating from it, also cut through to the same yellow, each 1/3 the hole's
width - this is the book's only translation of "빛살", and they are cuts, never
painted rays. The soup surface now has 0 holes. Window out of frame.
PLUG: none.
PROPS: 4 - spoon, bowl, table edge, chair back.
CAMERA: medium close-up, slightly low angle looking up at the lifted spoon. Spoon
centre, Brother's face behind it at left.
SUBJECT: Brother Hedgehog with his arm raised so the elbow is above the shoulder,
the forepaw holding the spoon stopped dead a hand's width above the bowl, head
pushed forward, both dot eyes fixed on the point on the spoon, mouth open and
held, quill contour risen into 5 blunt points. GRADE: bipedal, forepaws as hands,
animal head.
SETTING: honey-brown spoon with two cream drops falling from its rim. Below, the
cream soup disc with a round yellow reflection cut into it at half a hole's
diameter so it is never miscounted. Nothing else.
FINISH: Brother's face + the spoon. Bowl and chair stay flat paper, 0 marks. No
letters or numbers anywhere.
TONE: the light source has risen, so his face is lit brighter than on any earlier
page - by widening the pale paper planes, not by glow.
```

### p6

```
--- p6 — 하나 없어졌어 ---
HOLES: 2 - upper and lower on the roof line at EXACTLY the p1 positions. The
middle position is empty. No bowl in frame, so the page total is 2.
PLUG: 1 - a patch of the same navy paper laid over the middle hole from the
front. Hairline seam all the way round plus a thin cast shadow on one side, 0
yellow inside. Do not dim, blur or grey anything.
PROPS: 3 - window frame, roof line, chair.
CAMERA: medium, the window almost frontal, filling the spread with the square
frame and the sky beyond. Younger's outstretched forepaw cuts in at lower left as
a silhouette.
SUBJECT: Younger Hedgehog standing on the chair, one forepaw thrust straight at
the window and reading as a flat navy silhouette with one digit extended (posture
2). Only the back of his head and one shoulder contour are visible; the face is
not seen. Sleeve slid back off the paw. Brother is NOT in this frame. GRADE:
bipedal, forepaw as a hand.
SETTING: dark roof line low across the window, navy sky above, honey-brown frame.
One dull orange lamp reflection in the glass, at most a quarter of a hole's width
so it is never counted as a light.
FINISH: the window opening + Younger's silhouette arm. Frame and chair stay flat
cut paper, 0 pattern. No letters or numbers anywhere.
TONE: mostly navy with 2 yellow cuts in it. The upper and lower holes sit at the
p1 coordinates, so "the middle one is gone" reads from their positions alone.
```

### p7

```
--- p7 — 켜졌다 ---
HOLES: 4 - 1 back on the soup + 3 on the roof line, the middle position filled
again. All 4 the same diameter and the same flat yellow.
PLUG: none - the patch is gone, and the reopened middle hole shows no seam, no
scar, no residue. It is simply a hole again.
PROPS: 5 - bowl, spoon, lamp, window frame, table edge.
CAMERA: medium wide, child eye level. SAME FRAMING AS p1 - table and Brother at
left, window at right. Match the p1 coordinates for the table edge, the window
and the roof line.
SUBJECT: Brother Hedgehog with his arm all the way down, the spoon head back in
the soup and only the handle in his grip, shoulders dropped, head turned to the
window. Younger stands on his chair centre frame, both forepaws thrown up, on
tiptoe, mouth wide open, calling at the window, the too-long sleeves slid to his
elbows. GRADE: both bipedal, forepaws as hands, animal heads.
SETTING: bowl with the yellow cut on the soup and the spoon submerged beside it,
low lamp far end, window at right with the roof line under it.
FINISH: Brother + the bowl. Younger, chairs, lamp and frame stay flat cut paper,
0 marks, 0 pattern. No letters or numbers anywhere.
TONE: cause and effect are both in this frame, so everything else is pressed down
dark. Room and window brightness identical to p1.
```

### p8

```
--- p8 — 들어 올린다, 그리고 톡 ---
HOLES: 3 - 1 on the lifted spoon at lower left + 2 on the roof line at right
(upper and lower at their p1 positions). The spoon hole and the two roof holes
must be the same diameter and sit at the SAME depth in frame so they compare.
PLUG: 1 - a navy paper patch over the middle roof position, hairline seam plus
thin cast shadow, 0 yellow inside.
PROPS: 4 - spoon, bowl, window frame, roof line.
CAMERA: medium wide, over the shoulder from just above and behind Brother, facing
the window the way he faces it. Window at right, bowl and outstretched arm at
lower left. The book's central frame: the lifting hand and the emptied sky in one
picture.
SUBJECT: Brother Hedgehog seated, body and head turned fully to the window while
one arm alone reaches sideways to the bowl (posture 3) - head right, arm left.
The reaching forepaw has just cleared the spoon from the soup, quill contour
risen, open mouth held, dot eyes locked on one place outside. Younger at rear
right grips the sill with both forepaws, forehead on the glass. GRADE: both
bipedal, forepaws as hands, animal heads.
SETTING: honey-brown spoon with one cream drop falling, cream soup disc below,
window frame and roof line at right.
FINISH: Brother + the spoon. Younger, frame and bowl stay flat cut paper, 0
marks. No letters or numbers anywhere.
TONE: the only light in the room is that one hole on the spoon - the left of his
face carries a pale hard-edged plane, the right none.
```

### p9

```
--- p9 — 도로 켜졌어요 ---
HOLES: 4 - 1 back on the soup + 3 on the roof line, the middle position filled
again. Same diameter, same yellow.
PLUG: none - reopened, no seam, no scar.
PROPS: 4 - bowl, spoon, table, window corner.
CAMERA: close-up, slightly high angle. The soup surface takes the lower left of
the spread; the bottom of the window and the roof line under it clip the upper
right corner.
SUBJECT: only Brother Hedgehog's forepaw and forearm are in frame at the top, the
wrist gone slack so the spoon handle tips down and the spoon head is half sunk in
the soup, digits loose on the handle. Striped sleeve at the wrist. His face is
outside the frame. GRADE: bipedal, forepaw as a hand.
SETTING: cream soup with the yellow cut back on it and one cut-paper ring
spreading round it as the mark of something just settling; two cream drops on the
table. Upper right corner: sill, roof line, the 3 roof cuts back in their row.
FINISH: the forearm + the bowl. Window frame and spoon stay flat paper, 0 marks.
No letters or numbers anywhere.
TONE: the strength has gone out of the frame. Quiet, no alarm - the only movement
is the one ring on the soup. Nothing brightens; the count simply returns to 4.
```

### p10

```
--- p10 — 안 들래 ---
HOLES: 4 - 1 on the soup + 3 on the roof line at rear right, positions unchanged.
PLUG: none.
PROPS: 5 - bowl, spoon, lamp, window frame, table edge.
CAMERA: medium close-up, slightly low angle so Brother sits large and steady.
Brother's head and shoulder at left, Younger hanging off the sill at right, the
two faces turned to each other.
SUBJECT: Brother Hedgehog sitting back against the chair with BOTH FOREPAWS LAID
FLAT AND EMPTY ON HIS KNEES, side by side; the spoon rests across the rim of the
bowl, out of his hands. Shoulders easy and low, head turned to Younger, dot eyes
calm, mouth slightly open, speaking. Younger holds the sill with one forepaw,
body turned back to Brother, head tilted, sleeve over the paw. GRADE: both
bipedal, forepaws as hands, animal heads.
SETTING: bowl low between the two faces with the yellow cut sunk in the soup,
spoon across the rim, low lamp far end, window at rear right.
FINISH: Brother + his two empty forepaws. Younger, chairs, lamp and frame stay
flat cut paper, 0 marks, 0 pattern. No letters or numbers anywhere.
TONE: the empty hands ARE the picture - keep both forepaws unobstructed, clearly
separated from the knees by their cut edges, nothing on the table competing.
```

### p11

```
--- p11 — 여기만 먹을래 ---
HOLES: 2 - 1 still sunk in the pooled soup at the centre of the bowl + 1 roof
hole clipped at the corner where the bottom of the window enters. Same diameter.
PLUG: none.
PROPS: 4 - bowl, spoon, table edge, window corner.
CAMERA: close-up, high angle looking down into the bowl at a slant. The bowl
fills the centre; Brother's mouth and the spoon enter at the top edge.
SUBJECT: Brother Hedgehog with his head lowered, bringing the spoon to his mouth
- the spoon has come up from the OUTER EDGE of the bowl on a wide arc that clears
the centre, arm rotated outward, wrist bent. His lip is a moment from the spoon;
his eyes glance down at the centre of the bowl. Striped sweater. GRADE: bipedal,
forepaws as hands, animal head.
SETTING: inside the bowl the outer ring has been eaten down so the pale floor
shows as a cream crescent, while the centre still holds a pooled disc of soup
with the yellow cut sunk in it - the boundary between eaten and uneaten reads as
one clean cut circle. One spilled cream drop on the table.
FINISH: Brother's muzzle + the spoon. Bowl wall and window stay flat cut paper, 0
marks. No letters or numbers anywhere.
TONE: the bowl is the whole frame. The emptied side pale cream, the kept centre
the only place carrying yellow - the split reads as a shape, not as shading.
```

### p12

```
--- p12 — 별이 셋, 그대로 ---
HOLES: 4 - 1 sunk in the shallow pool left in the bottom of the bowl + 3 on the
roof line at EXACTLY the p1 coordinates and spacing. Lay p1 and p12 side by side
and the three must not have moved a hair.
PLUG: none.
PROPS: 5 - bowl, spoon, lamp, window frame, table edge.
CAMERA: medium wide, child eye level. SAME FRAMING AS p1 AND p7 - table and bowl
at left, window at right, identical coordinates.
SUBJECT: Brother Hedgehog seated with both forepaws laid side by side on the
table and his chin resting lightly on them, eyes half closed and sleepy, mouth
easy, quills fully flat. Younger sits on the next chair a little behind, looking
up at the window, one forepaw rubbing an eye, sleeve over the paw. GRADE: both
bipedal, forepaws as hands, animal heads.
SETTING: the bowl holds a shallow soup pool gathered in the centre with the
yellow cut sunk in it; a cream ring is left round the inner wall where the soup
was eaten down; the spoon lies on the TABLE, outside the bowl. Low lamp far end.
FINISH: Brother + the bowl. Younger, spoon, lamp, chairs and frame stay flat cut
paper, 0 marks, 0 pattern. No letters or numbers anywhere.
TONE: darker than p1, and only two things are lit - the one in the bowl and the
three outside. The bowl must read as DELIBERATELY LEFT, not as leftovers: a clean
round disc holding the light, not a smear.
```
