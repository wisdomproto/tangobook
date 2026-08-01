# 창작동화 1000 — h06 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/h06.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 2장 → ② 승인본을 @image 로 붙여 컷 13장

## h06 §1. 앵커 배정

**권**: h06 종이배 접는 법 백 가지 · 누적·반복 · 벨기에 레이스 공방 작업대 한 자리 · 13쪽
**클러스터**: **C1** · **앵커 슬러그**: `changjak-creaseline` (신규 민팅)
**한 줄**: 지지면이 곧 주인공(크림색 종이 한 장)이고, 종이 위의 선은 그린 것이 아니라 접힌 금이다. 금은 쌓일수록 흐려지고 첫 금 하나만 끝까지 또렷하다.

**🔴 형제 권과 갈린 축 — 첫 렌더에서 세어진다**
**선을 만든 것이 손인가 접힘인가 · 자국이 쌓이나 닳나.** b01(C1)은 판지의 접힌 자리를 **흑연 선으로 긋는다**(손) / d09 는 눌린 홈이 안 지워지고 새 눈이 덮어도 **비쳐 나온다**(쌓인다) / **h06 의 금은 종이가 제 몸에 낸 것이고 되풀이할수록 닳아**, 백 개 중 하나만 선으로 남는다. 흰 것은 그 금뿐이다.
- **b14 와 지지면 색이 붙는다**(둘 다 크림). 갈림 = **결이 있나** — b14 는 갓 깎은 소나무라 나뭇결이 지배하고, **h06 의 종이엔 결이 없다.** 지지면에 나뭇결·섬유·데클엣지를 한 획도 넣지 마라.
- **d15(C1)과 갈림** — 저쪽은 종이가 두 장이고 물감이 다르게 물린다. h06 은 **한 장**이고 물감이 종이 위에 아예 안 올라간다.
- **점눈이(전래동화) 분리** — 크림 종이 + 붉은갈색 다람쥐라 붙는다. 갈림 = **선이 접힘이라 떨림이 0**이다. 🔴 **점눈 금지**, 색연필 떨림 금지, 화면당 빨강 1점 규칙 없음.
- **레이스를 그리지 마라** — 무대 정체는 놋쇠 실패 몇 개와 둥근 베개로 충분하다. 무늬를 올리면 흰 것이 둘이 되어 금이 죽는다.

**🔴 대본 SCENE 처방표** (대본은 안 고치고 컷에서만 옮긴다)

| 쪽 | 대본 문구 | 컷에서 옮기는 법 |
|---|---|---|
| p4·p8 | 「굵은 흰 줄 하나」(글에는 없음) | 잔금은 값을 한 단 낮춰 회색으로, **그 한 줄만 #FAF8F2** |
| p8 | 「부슬부슬 보드라워졌어요」 | 종이 가장자리를 흐리지 말고 **금의 흰 값을 한 단씩 낮춘다** |
| p8 | 「세어지지도 않아요」 | 「많음」을 무한으로 그리지 말고 **잔금 최대 28줄** |
| p12 | 「잔금 수십 줄이 흐릿하게 비치고」 | 역광 투과 — 잔금은 종이 안쪽에서 **한 값 낮은 회색**, 굵은 금만 선 |
| p13 | 「잔금은 다 녹아 사라지고」 | 블러 금지. **잔금 0줄 · 굵은 금 1줄**로 개수를 바꾼다 |

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-creaseline

Style: picture book, ages 4-6. One workbench at a window in a Belgian lace workshop, for all thirteen spreads. The subject of every image is a single sheet of cream paper.

RENDERING (finish hierarchy)
The support IS the subject: one smooth cream sheet - no wood grain, no fibre, no tooth, no deckle edge, no texture filter. Every line lying on that paper is a FOLD, not a mark: a crease shows as a lit ridge on one side and a hairline shadow on the other. Nothing on the paper is drawn, inked, pencilled or outlined. The room, the animals and the props are laid around the sheet in flat quiet washes; the paper is the only surface that keeps its own physical relief.
Creases wear out. The first crease of the morning is pressed into stiff new paper (p1) and stays the brightest white line on every page it appears in. Every later crease is one value fainter, and from p8 the later ones are pale grey. WHITE IN THIS BOOK = CREASE. Nothing else is white - not the wall, not the window, not the fur.
FINISHED THINGS PER PAGE = 2 - the squirrel plus the sheet (or the boat) on that page. Everything else stays raw wash.
DENSITY RATION = p9 and p12 only (the crease net at its thickest). All other pages = 2.
Hard caps: brass bobbins at most 3 - lace pillow = 1 round undecorated cushion - other objects on the bench = 0 - window panes at most 2 - marks on the wall = 0 - BOATS IN FRAME = 1, always.

PALETTE
#EDE6D2 the cream sheet - #FAF8F2 crease white - #C09A3E brass bobbin - #D98A3C evening light. Window light runs from pale yellow at dawn to this orange at dusk and is the only thing that changes hue in the book. Fur: #A6592E squirrel, #6E6A63 badger with #EDE6D2 and #2A2724 face stripes. No other hue enters.

CHARACTER DESIGN LANGUAGE
Two animals with animal proportions, working at a bench on their forepaws - the child lies and leans on the bench, the grandmother sits. Four fingers per forepaw, fingers clearly separate (the story is told by hands). Eyes are round with a visible dark iris and one small highlight - NEVER solid dots. 0 garments in the whole book.

CANVAS
16:9 double-page spread, full bleed. The image runs to all four edges - no caption band, no border, no vignette.

NOT (rendering only)
1. no airbrush, no smooth gradients, no glossy 3D, no photographic finish
2. no drawn crease - no ink, pencil or graphite line anywhere on the paper
3. no lace pattern, no motif on bobbins, pillow, bench or window frame, no wood grain in the sheet
4. no letters or numbers on paper, wall or props
```

## §3. 캐릭터 시트

### 시트 1 — Squirrel child

```
CHARACTER SHEET - Squirrel child   (bake this FIRST)
Medium: as the anchor - flat quiet wash, no outline, no crease logic on the body.

FACE: short round muzzle, small dark nose, tufted ear tips. Round eyes with dark iris and one highlight, never dots. Mouth opens wide and round when excited; one eye narrows when squinting.
FUR: red-brown #A6592E over a cream belly, laid as at most 14 flat strokes; no drawn hairs, no fibre or wool edge, no stitching.
BODY: bushy tail carried high and straight when concentrating. Forepaws are the acting part - four separate fingers, a flat outer edge to the paw used for pressing.
BUILD: head 1/4 of body, small enough that standing on tiptoe is needed to reach the raised boat at p12.
REFERENCE SHEET: full-figure 3/4 idle - lying on the belly on a bench, both forepaws forward - close-ups: (a) outer edge of one forepaw pressed down on a fold, (b) one forepaw laid flat and open, fingers straight, (c) index fingertip extended tracing a line, (d) mouth wide open, eyes round.
NOT: no clothing, no accessories, no letters or numbers anywhere on the sheet.
```

### 시트 2 — Badger grandmother

```
CHARACTER SHEET - Badger grandmother   (bake this FIRST)
Medium: as the anchor - flat quiet wash, no outline.

FACE: broad low badger head, two dark stripes from the nose over each eye to the ears with cream between. Round eyes with dark iris and one highlight, never dots. Heavy lids, slow calm mouth that opens only a little when she says a number.
FUR: grey #6E6A63 as at most 12 flat strokes; no drawn hairs, no fibre edge, no stitching.
PROPS (not clothing): a round lace pillow on her knees, plain and undecorated, no visible lace; brass bobbins #C09A3E, plain turned cylinders, at most 3, no rings or motifs.
BUILD: seated for the whole book, head 1/5 of the body, heavy in the shoulders. She only ever lifts her head fully at p11 and p12.
REFERENCE SHEET: seated full figure 3/4 - close-ups: (a) one forepaw and a single bobbin, the bobbin half-turned between fingers, (b) forepaw at rest on the knee with the bobbin still, (c) head lifted, looking straight ahead, (d) both forepaws raised holding a paper boat up toward a window.
NOT: no clothing, no shawl, no cap, no lace pattern, no letters or numbers anywhere on the sheet.
```

## §4. 쪽별 컷

### p1

```
--- p1 — 첫 번째 배 ---
CREASE: exactly 1 bright white crease - the fresh one being pressed along the bow line - plus the boat's own 3 structural fold edges. Nothing else on the paper.
LIGHT: morning, pale yellow, reaching only just inside the window sill.
ONESHEET: one sheet, one boat, in frame.
CAMERA: medium close-up at bench height, slightly from the side.
SUBJECT: centre, the squirrel lies on its belly on the bench and presses the outer edge of its right forepaw down along the bow fold - shoulders pitched forward, cheek slightly puffed, eyes fixed on the pressing point. Right rear, the grandmother holds a bobbin over the round pillow on her knees and glances sideways at the squirrel.
SETTING: on the bench - one cream paper boat with a sharp bow, 3 brass bobbins, 1 round pillow. Behind: window frame and a plain wall.
FINISH: squirrel finished, the boat half - everything else raw wash. Animal proportions, working on forepaws, 0 garments. No letters or numbers on paper, wall or props.
TONE: pale morning light lies thinly on the paper only; the fresh pressed crease is the brightest thing in the frame.
```

### p2

```
--- p2 — 하나 ---
CREASE: the sheet is open flat. Exactly 2 bright white creases crossing at the centre in a plus shape. No other creases yet.
LIGHT: morning, unchanged, falling from above onto the open sheet.
ONESHEET: one sheet, no boat, in frame.
CAMERA: high angle, looking almost straight down at the paper.
SUBJECT: lower frame, the squirrel spreads both forepaws to the two far corners of the sheet, arms fully extended, looking down at what has just opened. The tail stands straight up behind. Upper corner, only the grandmother's forepaw and one bobbin are in frame, the bobbin caught half-turned between her fingers.
SETTING: on the bench - the open cream sheet, the edge of the round pillow. Nothing else; the bench beyond is raw wash.
FINISH: squirrel finished, the sheet half - the rest raw wash. Animal proportions, working on forepaws, 0 garments. No letters or numbers anywhere.
TONE: light from above. The paper is bright and the bench is in half shade, so the two white lines stand alone.
```

### p3

```
--- p3 — 납작배 ---
CREASE: at most 5 fold edges on the flat boat, 1 of them clearly the brightest white; no crease net yet.
LIGHT: morning, now reaching the near edge of the bench.
ONESHEET: one sheet, one boat, in frame - the boat is in the paws, so the bench top is left empty.
CAMERA: medium close-up, eye level, slightly below the front.
SUBJECT: left, the squirrel holds the flat boat up on both forepaws and pushes it out toward the grandmother - body tilted forward, one hind foot up on its toes, mouth wide open. Right, the grandmother keeps her bobbin paw on her knee and lowers only her eyes to the boat; her face stripes read square to us.
SETTING: on the bench - 2 brass bobbins and the round pillow. Nothing else.
FINISH: squirrel finished, the boat half - the rest raw wash. Animal proportions, working on forepaws, 0 garments. No letters or numbers on paper or props.
TONE: low morning light crossing from the side, so the boat's folds catch as thin lit ridges.
```

### p4

```
--- p4 — 열둘 ---
CREASE: at most 9 faint grey creases on the visible part of the paper, plus EXACTLY 1 thick white crease that is plainly brighter and wider than all the others. This one line is not in the text - it must be in the picture.
LIGHT: the sun has climbed; light now reaches the front edge of the bench.
ONESHEET: one sheet, one boat, in frame.
CAMERA: high angle, looking down at the paper.
SUBJECT: centre, the squirrel lays both forepaws stacked at the middle of the paper and leans its weight down, trapping the just-folded little boat under its palms. Ears pitched forward. Upper right, only the grandmother's forepaw and one bobbin are in frame.
SETTING: on the bench - the small boat half squeezed out from under the paws, 2 brass bobbins. Nothing else.
FINISH: squirrel finished, the paper half - the rest raw wash. Animal proportions, working on forepaws, 0 garments. No letters or numbers anywhere.
TONE: the morning patch is wider now. Most creases stay dim; only the one thick line takes the light.
```

### p5

```
--- p5 — 돛도 달았어요 ---
CREASE: at most 12 faint grey creases, plus 1 thick white crease.
LIGHT: noon, white and vertical, arrived at the middle of the bench.
ONESHEET: one sheet, one boat, in frame.
CAMERA: close-up, lens level with the boat on the bench top.
SUBJECT: lower left, one large forepaw of the squirrel comes into frame and stands the triangular sail up with the tip of its index finger. The squirrel's face is cut by the left edge - one eye and an open mouth. Right rear, the grandmother passes two bobbins from hand to hand, eyes on her own hands.
SETTING: on the bench - the boat with its single sail up, 2 brass bobbins, half the round pillow. The background is left empty.
FINISH: squirrel finished, the boat half - the rest raw wash. Animal proportions, working on forepaws, 0 garments. No letters or numbers on paper or props.
TONE: flat noon light straight down, casting one short shadow beside the sail.
```

### p6

```
--- p6 — 여기가 아닌데! ---
CREASE: at most 16 faint grey creases, plus 1 thick white crease. The sheet is pressed down at the right and has risen by itself at the left.
LIGHT: noon.
ONESHEET: one sheet, no finished boat, in frame.
CAMERA: medium close-up, over the shoulder, with the squirrel's hand and the paper on the SAME depth plane.
SUBJECT: centre, the squirrel presses the RIGHT end of the sheet down with its right forepaw while the paper folds up by itself on the LEFT. The pressed shoulder drops and the other rises so the body is crooked; one eyebrow up, mouth a small round O. Right edge, only the grandmother's grey shoulder and ear tip.
SETTING: on the bench - the sheet, one bobbin. Nothing else.
FINISH: squirrel finished, the sheet half - the rest raw wash. Animal proportions, working on forepaws, 0 garments. No letters or numbers anywhere.
TONE: noon light. A single triangular shadow sits under the risen side - that shadow is how "the wrong place folded" reads.
```

### p7

```
--- p7 — 이것도 배네! ---
CREASE: at most 20 faint grey creases across the upturned hull, plus 1 thick white crease running through them.
LIGHT: afternoon, past the middle of the bench and tipping toward the inner end.
ONESHEET: one sheet, one boat, in frame - held in the paws, so the bench top stays clear.
CAMERA: medium close-up, eye level.
SUBJECT: centre, the squirrel grips the blunt little boat in both forepaws and turns it OVER so the hull faces us, lifting it to its own eye height. Head tipped to one side, one eye narrowed. Right, the grandmother lifts her head and looks at the boat, bobbin still in hand, mouth just parted on a number.
SETTING: on the bench - 3 brass bobbins, the round pillow.
FINISH: squirrel finished, the boat half - the rest raw wash. Animal proportions, working on forepaws, 0 garments. No letters or numbers on paper or props.
TONE: warm afternoon light from the side, raking the length of the hull folds.
```

### p8

```
--- p8 — 세어지지도 않아요 ---
CREASE: at most 28 faint grey creases, netted over each other, plus EXACTLY 1 thick white crease running vertically down the middle of the sheet. The faint ones are one value lower than on p4 - the paper has gone soft.
LIGHT: late afternoon, pushed to the far inner end of the bench.
ONESHEET: one sheet, no boat, in frame.
CAMERA: high angle, looking down at the paper - SAME composition as p2.
SUBJECT: lower frame, the squirrel puts the whole palm of its right forepaw on the sheet and sweeps it left to right, arm fully out, shoulder dropped low toward the paper, eyes half closed. Upper corner, the grandmother's forepaw and one bobbin - the bobbin is stopped.
SETTING: on the bench - the netted cream sheet, 1 bobbin. Nothing else.
FINISH: squirrel finished, the sheet half - the rest raw wash. Animal proportions, working on forepaws, 0 garments. No letters or numbers anywhere.
TONE: low orange light from the side wipes out the shallow creases and leaves only the deep one with a shadow.
```

### p9

```
--- p9 — 아흔아홉 ---
CREASE: at most 40 faint grey creases - the net at its thickest - plus 1 thick white crease. They are repetition, not detail: same mark, no variation, zero information.
LIGHT: evening. The light has crossed the bench completely and climbed onto the wall.
ONESHEET: one sheet, no boat, in frame.
CAMERA: close-up, eye level, face and forepaw on the same depth plane.
SUBJECT: centre, the squirrel lifts its left forepaw to its mouth and blows on the fingertips while the right forepaw already holds a corner of the sheet. Eyes stay on the paper. The fingertip skin is flushed red.
SETTING: on the bench - the netted cream sheet, 3 brass bobbins laid down side by side.
FINISH: DENSITY RATION PAGE - 3 finished things: the squirrel, the sheet, and the bobbins. Nothing else gains finish. Animal proportions, working on forepaws, 0 garments. No letters or numbers anywhere.
TONE: evening orange survives only high on the wall; the bench sits in warm shade. The flushed fingertips are the reddest thing in the frame.
```

### p10

```
--- p10 — 저 혼자 접혔어요 ---
CREASE: at most 40 faint grey creases, plus 1 thick white crease - and the boat has stood up ALONG that thick crease. It runs the length of the new bow.
LIGHT: evening shade on the bench.
ONESHEET: one sheet, one boat, in frame.
CAMERA: close-up, low, almost level with the surface of the bench.
SUBJECT: centre, the squirrel's right forepaw is still LAID FLAT on the paper - not one finger bent - and under that open palm the paper already stands as a boat. The squirrel's face looks down from upper left, eyes wide, mouth just open.
SETTING: on the bench - the self-folded boat with the paw resting on it. Everything else out of frame.
FINISH: squirrel finished, the boat half - the rest raw wash. Animal proportions, working on forepaws, 0 garments. No letters or numbers anywhere.
TONE: low evening orange from the side catches one line - the bow crease - and leaves the rest in shade.
```

### p11

```
--- p11 — 맨 처음 그 배잖아요! ---
CREASE: at most 40 faint grey creases, plus 1 thick white crease. The bow points to the left at the SAME angle as p1.
LIGHT: evening.
ONESHEET: one sheet, one boat, in frame.
CAMERA: medium close-up, eye level, straight on.
SUBJECT: centre, the squirrel holds the boat up on both forepaws to its own eye height - elbows in at its sides, back straight, eyes round, mouth wide open. Right rear, the grandmother lifts her head fully for the first time and looks straight at the boat.
SETTING: on the bench - 3 brass bobbins, the round pillow. Behind: window frame and plain wall.
FINISH: squirrel finished, the boat half - the rest raw wash. Animal proportions, working on forepaws, 0 garments. No letters or numbers on paper, wall or props.
TONE: evening light. The boat is the brightest thing between the two faces.
```

### p12

```
--- p12 — 여기만 깊어요 ---
CREASE: at most 40 faint creases showing THROUGH the lit paper as pale grey threads, plus EXACTLY 1 thick crease reading as a hard white line. The difference between the one and the many is the whole page.
LIGHT: the window behind the boat - full backlight through the paper.
ONESHEET: one sheet, one boat, in frame.
CAMERA: close-up, eye level, looking at the boat against the window.
SUBJECT: upper frame, the grandmother holds the boat up in both forepaws toward the window so the light passes through it, arms extended upward. Lower frame, the squirrel is up on its toes with one index fingertip on the flank of the boat, tracing the thick crease upward; its eyes follow the fingertip. The two faces are turned toward each other across the boat.
SETTING: the boat, the window frame, an overcast sky beyond. The bench props are OUT of frame.
FINISH: DENSITY RATION PAGE - 3 finished things: the boat, the squirrel's tracing paw, and the grandmother's holding paws. Animal proportions, working on forepaws, 0 garments. No letters or numbers anywhere.
TONE: backlight. The paper glows orange from inside; both animals read as near-silhouettes.
```

### p13

```
--- p13 — 백 ---
CREASE: 0 faint creases - the low light has dissolved every shallow one - plus EXACTLY 1 thick white crease running unbroken from bow to hull. That single line is what holds the boat up. Do not blur; change the COUNT.
LIGHT: the lowest orange of the day, grazing the sill from the side.
ONESHEET: one sheet, one boat, in frame.
CAMERA: wide, level with the window sill, the boat seen from the side.
SUBJECT: right, the squirrel stands at the sill with both forepaws laid on it and its chin resting on them, watching the boat from the side. Left rear, the grandmother has set her bobbin down on the round pillow and looks toward the window. Neither speaks; both face the boat.
SETTING: on the sill - one cream paper boat, nothing else. On the bench below - 3 brass bobbins and the round pillow. Window frame, plain wall.
FINISH: the boat finished, the squirrel half - the rest raw wash. Animal proportions, working on forepaws, 0 garments. No letters or numbers on paper, wall or props.
TONE: the lowest orange wipes across the sill; the boat alone is lit and the room is warm darkness.
```
