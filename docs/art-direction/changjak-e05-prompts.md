# 창작동화 1000 — E-05 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/e05.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## E-05 §1. 앵커 배정

**권**: e05 「치즈에 구멍이 난 진짜 이유」 · 교환·연쇄 · 스위스 치즈창고 선반 한 칸 · 12쪽 · 4~6세
**클러스터**: C9 · **슬러그**: `changjak-eatenpaper` (신규 민팅)
**한 줄**: 치즈는 **한 장의 노란 종이를 오려 둔 것**이고 그 뒤에 검은 종이, 더 뒤에 등불 주황 종이가 깔려 있다. 쪽마다 그 노란 조각을 **실제로 물어뜯어** 없애고, **얼마나 깊이 뜯렸나가 구멍 속 색**이다 — 노랑만 뚫리면 검정, 검정까지 뚫리면 주황.

🔴 **형제 권과 갈린 축 (첫 렌더에서 세어진다)**

| 짝 | 갈린 축 | 판정 |
|---|---|---|
| **C9 일곱** a14·c08·d10·g01·h10·e04·f04 | **조각이 작아지나** | 저쪽은 전부 조각 크기가 **안 변한다**(붙이고·뒤집고·겹치고·하나를 뚫는다) · **e05 는 한 조각이 열두 쪽에 걸쳐 깎여 고리만 남는다** |
| 🔴 **f04** `changjak-onehole` | **뚫린 자리가 밝나 어둡나** | f04 = 구멍 뒤로 뒷장이 비쳐 **어둡고** 하나로 고정 · **e05 = 뒤에서 등불이 와 밝고**, 셋이 이어져 하나가 된다 |
| **a09** `changjak-darkcut` | **잘린 것이 무엇인가 · 도로 붙나** | a09 = 어둠 도형이 빛에 잘리고 불이 죽으면 **도로 붙는다** · **e05 = 물건이 입에 잘리고 안 돌아온다** |
| **g03** `changjak-sixlayers` (설명하러 오는 손님) | **쌓이나 줄어드나** | g03 = 손님이 판을 **놓고 가서 쌓인다** · **e05 = 입이 물고 가서 줄어든다.** 손님은 p2 부터 끝까지 같은 궤짝 위에 있고 사라지지 않는다 |
| **d18** `changjak-steamplate` | 인쇄 ↔ 오려내기 | d18 은 판을 어긋나게 찍는다 · e05 는 자른 자국이라 **모든 치즈 가장자리가 물어뜯긴 톱니** |

🔴 **화면의 어둠은 오려 붙이지 않는다** — 저장고 어둠은 조각이 아니라 **지지면(짙은 갈색 판)** 이어야 조각 개수 세기가 흐려지지 않는다.
🔴 **생쥐는 그린다, 치즈는 오린다.** 산 것과 종이 조각이 헷갈리면 「줄어드는 것」을 못 센다.
🔴 **궤짝·선반에 글자 금지.**

**대본 SCENE 처방표** (대본은 안 고치고 컷에서 분기)

| 대본 문구 | 옮기는 법 |
|---|---|
| p6 「빛이 치즈 옆으로 조금 새어 나오기 시작」 | 아직 구멍은 안 뚫렸다 → 치즈 **바깥 윤곽선 오른쪽에만 주황 종이가 한 줄 드러난다** |
| p7 「그늘 끝에 등불빛 한 점이 비친다」 | 검은 종이가 처음으로 한 점 뚫린 것 → **주황 점 하나**, 지름은 생쥐 눈만 하게 |
| p11 「반투명하게 노랗다」 | 반투명 효과 금지 → **얇게 남은 노랑 띠가 주황 위에 겹쳐** 더 밝은 노랑이 된다(겹침 = 밝기) |
| p1 「구멍 속은 새까맣다」 | 검정 종이가 아직 안 뚫렸다는 뜻 → 구멍 안은 **지지면과 같은 #2B211A**, 광원 표현 0 |
| p12 「구멍마다 눈이 하나씩」 | 밀도 배급 쪽 → 이 쪽만 눈 넷, 나머지 쪽은 늘리지 마라 |

## E-05 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-eatenpaper

Style: picture book for 4-6 year olds. A Swiss cheese cellar, one shelf, one evening. Cut paper: the cheese is ONE piece of yellow paper cut into a wheel and laid over two sheets - a black sheet behind it (the unlit inside of the cheese) and, furthest back, an orange lantern sheet. Every page the yellow piece is really bitten away, and how deep the bite went decides what colour shows in the hole.

RENDERING (finish hierarchy)
THREE STACKED SHEETS, always this order: yellow #F0C24A in front, black #2B211A behind it, orange #E07B2A furthest back. A hole through the yellow only = black inside. A hole through yellow AND black = orange inside. Where thin yellow lies over orange, the overlap reads as a brighter yellow. Nothing else in this book changes colour.
THE CHEESE PIECE ONLY SHRINKS. It never grows back and never moves. Its cut edges are bitten, not scissored: 5-9 small notches along every new bite, no smooth curve anywhere on the cheese. Crumbs = torn scraps of the same yellow paper, at most 12 per page, all with notched edges.
The cellar dark is NOT a pasted piece - it is the support board #2B211A showing. Do not paste dark shapes anywhere. Shelf and crate are #6B4F35 paper with straight cut edges and 0 printed wood grain.
THE MICE ARE DRAWN, not cut: brush and fine line laid on top of the collage, so a living thing is never mistaken for a paper piece. Fur = 6-10 strokes at the outline only, never a filled texture.
FINISHED THINGS PER PAGE = 2 - the pup mouse, and the mouth that is biting the cheese that page. DENSITY RATION = p12 only (one eye in each hole).
Shelf boards visible = at most 3 edges. Props beyond crate, shelf and lantern = 0. Cobwebs, jars, tools, sacks = 0.

PALETTE
#F0C24A cheese paper · #E07B2A lantern paper - seen only through a hole that goes all the way through, as a thin rim along the cheese's outer edge, and under thin overlapping yellow · #6B4F35 shelf and crate paper · #2B211A support board - all cellar dark, and the inside of any hole that has not gone all the way through.

CHARACTER DESIGN LANGUAGE
Mice standing on the hind legs and using their forepaws as hands. No clothing, no props, nothing worn, nothing carried. Eye = one filled oval, no white, no catchlight. A full mouth packs the cheeks out into round shapes. The three big mice are told apart by silhouette, never by colour.

CANVAS
16:9 double-page spread. No letters, numbers, signs or symbols anywhere in this book - crate and shelf carry no writing.

NOT (rendering only)
- no pasted dark pieces: the cellar dark is bare support board
- no smooth scissored curve on the cheese - every cheese edge is a torn bite
- no glow, halo, light ray or lens flare - light is only the orange sheet showing through
- no shading, gradient, airbrush, texture filter or 3D render
```

## E-05 §3. 캐릭터 시트

### 시트 1 — PupMouse

```
CHARACTER SHEET - PupMouse   (bake this FIRST)

Medium: STYLE ANCHOR changjak-eatenpaper - drawn with brush and fine line ON TOP of cut paper; the mouse is never a paper piece.

FACE
Round skull, short muzzle, nose a small filled dot. Ears very large for the head, thin, almost circular, set high and wide - this is the pup's main tell. Eye = one filled oval, tall rather than round, set high so the animal reads young; no white, no catchlight. Whiskers = 3 per side, single fine lines. Mouth closed = one short line; mouth open = a small filled shape. Two front teeth appear only when biting, as one pale rectangle.

FUR
Warm grey-brown line work over the collage. 6-10 strokes at the outline only - at the cheek, the shoulder and the haunch. 0 filled fur texture, 0 hatching inside the body. Tail = one tapering line, about the body's length.

CLOTHES
None. Nothing worn, nothing carried, no bag, no scarf.

BUILD & SILHOUETTE
Small and pear-shaped, about half the height of a big mouse. Head nearly a third of body height. Standing on the hind legs the belly curves out and both forepaws come together at the chest. Forepaw = four visible finger notches. Silhouette test against the big mice: PupMouse is the only one whose ears are wider than its muzzle is long.

REFERENCE SHEET
One flat cream field, figures floating on it, no ground, no shadow:
1) standing on the hind legs, side view, both forepaws at the chest
2) same, 3/4 turn toward camera
3) up on tiptoe, neck stretched, looking over something above
4) both forearms thrown around a large round object, paw tips just meeting on the far side
5) biting - front teeth set on a thin edge, eyes closed, both forepaws holding it
6) head close-up x3 - nose pressed to a hole, peering in / head tipped in question / mouth open, looking up
```

### 시트 2 — BigMice (BigOne · BigTwo · BigThree)

```
CHARACTER SHEET - BigMice   (bake this FIRST - three brothers on one sheet)

Medium: STYLE ANCHOR changjak-eatenpaper - drawn with brush and fine line ON TOP of cut paper.

FACE
All three: pointed muzzle longer than the pup's, small filled-oval eyes set lower on the head, nose a filled dot, 3 whiskers per side. No white in the eye. Same grey-brown line colour for all three - they are never told apart by colour.

BUILD & SILHOUETTE (this is the only thing that separates them)
BigOne - broadest: heavy shoulders, short thick neck, blunt round ears, forearms thick. Reads as a digger.
BigTwo - roundest: barrel body, short limbs, the biggest cheeks of the three; when the cheeks pack out they are wider than the head.
BigThree - longest and thinnest: narrow body, long neck, long tail, tall pointed ears, and the only one whose muzzle can push into a narrow gap.
All three are about twice PupMouse's height. Standing on the hind legs, forepaws used as hands, four finger notches each.

FUR
6-10 outline strokes each, at shoulder and haunch only. 0 filled texture.

CLOTHES
None. Nothing worn, nothing carried.

REFERENCE SHEET
One flat cream field, the three standing side by side, no ground, no shadow, plus:
1) the three in a row, side view, so the three silhouettes can be compared
2) BigOne - face buried into a round surface, both forearms scrubbing, rump raised
3) BigTwo - both cheeks packed out full, eyes squeezed shut, forepaws holding a curved surface
4) BigThree - mouth pursed into a small round shape, both forepaws held together in a ring in front of the muzzle
5) BigThree - head and shoulders pushed between two bodies from behind
6) all three seated, mouths shut, cheeks bulging, eyes round and wide
```

## E-05 §4. 쪽별 컷

### p1 — 구멍이 왜 났을까?

```
--- p1 - 구멍이 왜 났을까? ---
CHEESE: the yellow piece is whole - a full wheel seen edge-on, twice PupMouse's height, outer rim smooth-cut only here because nothing has bitten it yet.
HOLE: 3, all in the near flank, all cut through the YELLOW ONLY, so all three read flat #2B211A inside. No orange anywhere in a hole.
LIGHT: the lantern is entirely behind the cheese and completely blocked - one single large #2B211A shadow lump lies on the shelf in front, the biggest dark shape in the book.
CAMERA: wide, eye level, square to the cheese's side.
SUBJECT: lower right, PupMouse standing on the hind legs, nose pressed right into the lowest hole, both forepaws laid on the yellow paper, ears forward. No clothing, nothing carried.
SETTING: one thick #6B4F35 shelf board across the lower third; the cheese standing on it; far behind, a small lantern shape whose light does not reach past the cheese; everything else is bare support board. No letters on anything.
FINISH: PupMouse full; the rim of the hole its nose is in is the second finished thing. The cheese body stays flat paper.
TONE: a thin orange rim runs along the cheese's outer edge only, where the lantern sheet peeks past it. The holes are dead black. This page is the darkest in the book.
```

### p2 — 우리가 알지!

```
--- p2 - 우리가 알지! ---
CHEESE: unchanged, whole, not yet bitten. Outer rim still unbroken.
HOLE: 3, black. Nothing has gone through.
LIGHT: still blocked - the same big shadow lump on the shelf. The three brothers stand between the lantern and the camera, so they read almost as drawn silhouettes.
CAMERA: medium, slightly low angle looking up at the crate.
SUBJECT: upper left, BigOne, BigTwo and BigThree standing in a row on an upturned crate, chests thrown out - BigOne with forepaws on the hips, BigTwo with chin raised, BigThree with the tail held stiff and high. Lower right, PupMouse leaning against the cheese, head tipped back to look up at them. All on hind legs, nothing worn.
SETTING: the upturned #6B4F35 crate, straight cut edges, no writing; the shelf and the cheese; support-board dark everywhere else.
FINISH: PupMouse full; the row of three silhouettes is the second finished thing - read them by outline alone.
TONE: the cheese is the brightest shape on the page and the three brothers are the darkest.
```

### p3 — 봐, 이렇게! 벌레가 파고든 거야

```
--- p3 - 봐, 이렇게! 벌레가 파고든 거야 ---
CHEESE: FIRST BITE - one half-moon is gone from the upper left of the wheel, its edge notched 7 times. The piece is now clearly smaller than on p2.
HOLE: 3, still black - the bite has not reached them.
LIGHT: still blocked; the shadow lump on the shelf is slightly narrower than p1 because the piece is smaller.
CAMERA: medium close-up, eye level, the biting face and the cheese flank filling the frame.
SUBJECT: centre, BigOne with its face buried half into the yellow flank, both forearms scrubbing at the surface, rump raised, hind feet on the shelf; the mouth inside the paper is holding cheese, and torn yellow crumbs sit at the lip. Far left, PupMouse with both forepaws together at the chest, watching that mouth.
SETTING: shelf board; the fresh bitten notch; at most 9 torn crumbs; support-board dark behind.
FINISH: PupMouse full; the new bitten edge is the second finished thing - its notches must be the crispest cuts on the page.
TONE: only the cheese carries colour. Nothing glows.
```

### p4 — 봐, 이렇게! 바람이 안에서 부는 거야

```
--- p4 - 봐, 이렇게! 바람이 안에서 부는 거야 ---
CHEESE: SECOND BITE - a second half-moon gone from the opposite flank, notched 6 times. Two bites now, on opposite sides.
HOLE: 3, black.
LIGHT: still blocked.
CAMERA: close-up, eye level, the packed cheeks taking half the frame.
SUBJECT: right of frame, BigTwo with its mouth set against the far flank, both cheeks packed out wider than its head, eyes squeezed shut, both forepaws gripping the curve of the wheel. Lower left, PupMouse with its head tipped to one side.
SETTING: shelf board; the two bitten notches, one near and one far; at most 8 crumbs; support-board dark.
FINISH: PupMouse full; the packed cheek is the second finished thing.
TONE: light gathers on the near flank; behind the cheese there is only dark. No blowing lines, no puffs of air - the cheeks alone say it.
```

### p5 — 봐, 이렇게! 물방울이 갇힌 거야

```
--- p5 - 봐, 이렇게! 물방울이 갇힌 거야 ---
CHEESE: THIRD BITE - a notch taken out of the top edge as well. The wheel is now one and a half PupMouse heights tall; the top line is visibly lower than on p1.
HOLE: 3, black.
LIGHT: still blocked, but the lantern sheet now shows as a thin orange rim along the whole top edge of the cheese where the wheel has dropped below it.
CAMERA: medium, slightly high angle so the flattened top of the wheel is visible.
SUBJECT: upper centre, BigThree sitting on the top of the wheel, mouth pursed into a small round shape and holding the top edge in its teeth, both forepaws held together in a ring in front of the muzzle. Below, PupMouse up on tiptoe, neck stretched, trying to see the top.
SETTING: shelf board; three bitten notches, one on each of two flanks and one on top; at most 8 crumbs; support-board dark.
FINISH: PupMouse full; the pursed mouth ring is the second finished thing.
TONE: no light from above. Only the orange rim along the top edge.
```

### p6 — 어? 닿네

```
--- p6 - 어? 닿네 ---
CHEESE: exactly half the size it was on p1 - the pup can now reach around it. Three bitten notches on the rim, edges all notched.
HOLE: 3, still black. Nothing has gone through yet.
LIGHT: leaking past the OUTSIDE of the cheese for the first time - a band of orange along the right-hand edge, about a finger wide. Not through a hole. The big shadow lump on the shelf is now clearly smaller than on p1.
CAMERA: medium, eye level, the same camera position and angle as p1 so the two sizes can be compared. Do not move the lens.
SUBJECT: right of frame, PupMouse with both forearms thrown around the wheel, cheek pressed to the yellow paper, paw tips just meeting on the far side, eyes rolled up toward the crate. On the crate behind, the three brothers seen from the back, heads turned toward each other.
SETTING: shelf board; the crate; support-board dark. Same furniture and same positions as p1.
FINISH: PupMouse full; the two paw tips touching are the second finished thing.
TONE: the orange edge band is the first warm light in the book. Keep the holes dead black - the contrast between the two is the page.
```

### p7 — 치즈 한쪽이 푹 꺼져요

```
--- p7 - 치즈 한쪽이 푹 꺼져요 ---
CHEESE: a large scoop is gone from the near flank, the biggest single bite so far, its edge notched 9 times; the remaining flesh above it is a thin bridge.
HOLE: 3 black holes remain, AND one new pin-point where the black sheet has torn through for the first time - one orange dot the size of a mouse's eye, deep inside the scooped hollow.
LIGHT: the orange rim now runs the full right edge and the shadow lump on the shelf has broken into two pieces.
CAMERA: close-up, low angle, the buried body crossing the frame.
SUBJECT: centre, BigOne driven into the cheese to the shoulders, only its back half outside, hind feet kicking free of the shelf. Lower right, PupMouse with one forepaw half raised to stop it, frozen in the middle of the gesture.
SETTING: the scooped hollow showing torn inner edges; a heap of at most 12 crumbs at the foot; shelf; support-board dark.
FINISH: PupMouse full; the single orange pin-point at the back of the hollow is the second finished thing - small, and the sharpest bright mark on the page.
TONE: the hollow is deep black except for that one dot. Do not paint a glow around it.
```

### p8 — 거긴 아니지

```
--- p8 - 거긴 아니지 ---
CHEESE: the wheel is now exactly PupMouse's height. The three original holes have grown toward one another and are separated by threads of yellow only a whisker wide.
HOLE: 3, still separate, still black inside - but the pin-point from p7 has widened into a small orange slit at the back of the hollow.
LIGHT: light passing around the cheese now splits the two brothers' backs - a band of orange lies between them along the shelf.
CAMERA: medium, eye level, the shoving shoulder and the biting mouth both in frame.
SUBJECT: left, BigTwo shouldering BigOne aside and setting its mouth into the hollow in the same movement, cheeks already packing out. Right, BigOne landed on its rump, mouth open. Front lower edge, PupMouse with both ears laid flat back, watching.
SETTING: shelf; crumb heap; support-board dark; the crate behind.
FINISH: PupMouse full; the two hair-thin yellow threads between the holes are the second finished thing - the whole page is about how thin they are.
TONE: the brothers' backs are dark, the band of light between them is orange, the cheese is yellow. Three values only.
```

### p9 — 등불빛이 구멍으로 새어 나와요

```
--- p9 - 등불빛이 구멍으로 새어 나와요 ---
CHEESE: the flesh is now two knuckles thick anywhere you measure it. The outline is entirely bitten notches, no straight run left.
HOLE: 🔴 THE TURN - the black sheet is gone behind all three holes, so every hole is filled with flat #E07B2A. The insides of the holes are now brighter than the room. This is the exact reverse of p1.
LIGHT: three orange shapes on the shelf in front, one thrown by each hole.
CAMERA: close-up, eye level, the lit holes at the centre of the frame.
SUBJECT: centre, BigThree with its head pushed between the other two from behind, the last flesh held in its teeth, both forepaws braced on its brothers' shoulders; BigOne and BigTwo pushed to the frame edges with only their faces showing. Lower edge, PupMouse looking up, mouth open.
SETTING: shelf; crumb heap; support-board dark; no props beyond these.
FINISH: PupMouse full; the three orange holes are the second finished thing - the crispest cut edges in the book so far.
TONE: inside is brighter than outside. Flat orange only, no rays, no halo, no glow spilling onto the mice.
```

### p10 — 나도 볼래

```
--- p10 - 나도 볼래 ---
CHEESE: only a thumbnail of yellow flesh is left, one narrow strip between two holes; everything around it is hole.
HOLE: all through, all orange; the three have almost joined into one shape.
LIGHT: orange pours up through the openings from below and behind, so PupMouse's face is lit from underneath - shown as flat orange laid on the underside of the muzzle and chin, hard-edged, not blended.
CAMERA: medium close-up, slightly low angle, the small mouth and the last strip of flesh at the centre.
SUBJECT: centre-low, PupMouse standing on the hind legs, front teeth set on the last thin strip, both forepaws holding it, eyes closed. Above, the three brothers with mouths shut and eyes round and wide, looking down.
SETTING: shelf; crumbs; support-board dark.
FINISH: PupMouse full; the last strip of yellow between its teeth is the second finished thing - the smallest piece of cheese in the book so far.
TONE: the only bright things are the openings and the underlit muzzle. Everything else is dark board.
```

### p11 — 종잇장처럼 얇아요

```
--- p11 - 종잇장처럼 얇아요 ---
CHEESE: reduced to narrow bands; where a band lies over the orange sheet the overlap reads as a brighter, warmer yellow. That overlap is how thin is shown - no transparency effect, no gradient.
HOLE: all through, orange, now one continuous opening with thin yellow bands crossing it.
LIGHT: a wide flat orange shape lies across the shelf in front, passing between the bands.
CAMERA: wide, eye level, all four mice and what is left in one frame.
SUBJECT: left, the three brothers in a row; right, PupMouse - all four with mouths shut, cheeks bulging, forepaws down, nothing moving. All four read dark against the lit cheese.
SETTING: shelf; scattered crumbs; crate; support-board dark.
FINISH: PupMouse full; the brightest yellow band is the second finished thing.
TONE: the four are dark shapes in front of the light. Do not light their faces.
```

### p12 — 구멍만 남았어요

```
--- p12 - 구멍만 남았어요 ---
CHEESE: no flesh left - only the outer ring of the wheel, one bitten yellow loop standing on the shelf.
HOLE: the whole inside of the ring is orange.
LIGHT: the lantern now passes straight through and lays round orange spots on the shelf, in the same place where the single large shadow lump sat on p1.
CAMERA: medium, eye level, from the same camera position and angle as p1 and p6 so the reversal is measurable. Do not move the lens.
SUBJECT: centre, behind the yellow loop, four mice with one eye each showing through an opening in the ring - BigOne, BigTwo, BigThree above and PupMouse at the lowest opening. All cheeks still bulging, all four mouths chewing.
SETTING: shelf; the orange spots on it; crumbs; support-board dark. DENSITY RATION page - four eyes are allowed here and nowhere else; add nothing beyond them.
FINISH: PupMouse's eye at the lowest opening is the finished thing; the ring's bitten edge is the second.
TONE: everything that was black on p1 is orange here, and the one big shadow has become scattered round light. Bright and dark have changed places.
```
