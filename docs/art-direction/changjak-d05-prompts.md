# 창작동화 1000 — d05 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/d05.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## d05 §1. 앵커 배정

**권**: d05 길 잃은 우편배달부 · 교환·연쇄 · 오스트리아 보리수 아래 돌 탁자 · 14쪽 · 4~6세
**클러스터**: **C5** (기존 C5 = a10 · a11 · a97 · b05 · c06 · f03 · h03 + 이번 c05 · e10 — **C5 = 10**)
**앵커 슬러그**: `changjak-leafdapple` (신규 민팅)
**한 줄**: 잎 사이로 샌 **빛 얼룩**을 도장으로 찍어 화면 전부를 깐다. **도장이 물건이 아니라 빛이라 가장자리가 없고**, 그래서 각진 흰 편지가 화면에서 유일하게 딱딱하다.

**형제 권과 갈린 축** (첫 렌더에서 세어진다)

| 형제 | 갈린 축 |
|---|---|
| **a11 · c05 · b05 · a97 · e10 · f07** | **도장이 물건인가 빛인가** — 저들은 기와·실루엣·벽지 문양·라벤더·자갈·잎이라 **전부 가장자리가 있다**. d05 의 도장은 빛이라 **가장자리가 0**이다 |
| **c05** | 마감이 옮겨 간다(꽃→흙) ↔ d05 는 마감 대상이 안 바뀌고 **개수만 준다**(각진 흰 것 5 → 0) |
| **e10** | 한 자리의 밀도가 0으로 간다 ↔ d05 는 밀도가 균일하고 **딱딱한 것의 개수**가 준다 |
| **f03** | 반복이 **오려낸 문양 띠**(가장자리 있음) ↔ d05 는 **번지는 빛 자국** |
| **d09** | 사족·자국이 쌓임 ↔ d05 는 **이족+옷**이고 바닥에 아무것도 안 남긴다 |

🔴 **밀도 배급 = p9 하나뿐**(빈 돌 넷 + 답례 무더기를 한 화면에서 센다). 나머지는 `FINISHED THINGS PER PAGE = 2`.
🔴 **각진 흰 것의 개수를 컷마다 숫자로 못박았다** — 5·3·4·2·3·1·2·1·1·1·1·0·1·0. **p14 화면에 직선이 없다.**
🔴 **글자 금지가 이 라인에서 가장 위험한 권이다.** 봉투는 완전 백지 — 주소·문양·소인·우표·손글씨 전부 금지. 우편 가방·집·표지판도 마찬가지. **컷마다 반복했다.**
🔴 **빨강은 셋뿐** — 붉은 끈 · 할머니 머릿수건 · p11 산딸기. 끈과 머릿수건은 **완전히 같은 빨강**(#B33A2E). 화면의 다른 빨강 0.

**대본 결함 보고**(고치지 않았다 · 컷에서만 처리)
- p1 SCENE 은 봉투 **다섯 통**(넷은 돌 밑) + 색 끈 셋(파랑·초록·노랑)을 적었는데, 손님은 셋뿐이라 **넷째 돌 밑 편지의 임자가 없다.** p3·p5·p7 SCENE 은 그 편지를 세지 않는다(빈 돌 1·2·3).
  → **컷 처리**: p1 은 대본대로 다섯을 그리고, **p3 부터는 각 쪽 SCENE 의 수를 그대로 따른다.** 넷째 편지는 다시 안 그린다. p3·p5·p7 이 부분 화면이라 한 쪽 안에서 모순이 보이지 않는다. p9·p14 의 **빈 돌 넷**은 그대로 산다.

**대본 SCENE 처방표** (습관어 대역)

| 대본 | 옮긴 것 |
|---|---|
| 「잎 그늘이 동그란 빛점을 흩뿌려」 | 그리지 않고 **찍는다** — 도장 자국마다 테두리가 번져 끝난다 |
| 「흐릿하게 걸린 다람쥐 뒤통수」(p4) | 흐림이 아니라 **마감을 안 준다**(윤곽만, 안은 안 채움) |
| 「초점이 맞은 자리」(p14 앞발) | 앞발만 손마감, 나머지는 도장 필드 그대로 |
| 「색이 다 식어 회색으로 가라앉는다」(p9) | 도장 잉크를 그늘색 한 가지로 바꿔 찍는다(밝기 조절 아님) |

---

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-leafdapple

Style: picture book for ages 4-6, one low stone table under a big linden at the
edge of an Austrian mountain village, morning through dusk. The whole sheet is
covered by a printed field of leaf-gap light: hand-cut stamps of soft light
blotches, overlapping, at one scale, everywhere.

RENDERING (finish hierarchy)
The dapple is LIGHT, not objects, so every blotch is edgeless - soft-bodied paint
pressed from a cut sponge, each print bleeding at its rim, no outline, no rim, no
defined cast shadow anywhere. The field runs over ground, table, slope, bark, fur
and clothing alike at the same scale. NOTHING in the field has a straight line.
The field is dense and carries zero information; it never thins to make room.
Only two kinds of thing are finished by hand over the field: the WHITE ENVELOPES -
hard straight edges, four corners, matte paper white, the only rectangles in the
book - and the CORD COLOURS. Everything else is the field plus flat local colour.
FINISHED THINGS PER PAGE = 2 (the marten and the one creature or envelope she
handles that page). DENSITY RATION = p9 only (empty stones and the reply pile
counted in one wide shot); no other page gets extra props.
ANGULAR COUNT is stated in every cut: how many hard-edged white envelopes are in
frame. It runs 5 at p1 down to 0 at p14. When the count is 0 there is no straight
line left on the sheet. Every reply is round - hazelnuts, dried apple rings, a
cheese wheel, a berry basket.

PALETTE
#F5F2E8 dapple light and envelope white / #A8B45C sunlit leaf green / #4E6B3A
shade green / #B33A2E the single red. Cords are three flat hues laid on the field:
blue, green, yellow. The red is used for the wrist cord and the kerchief only
(and the wild strawberries on p11), and those two reds are EXACTLY the same value.

CHARACTER DESIGN LANGUAGE
Anthropomorphism grade: BIPEDAL AND CLOTHED on all 14 pages. The marten walks on
two feet, wears a short brown waistcoat and a crossbody leather satchel, and grips
letters with forepaw fingers - the grade is the cause of the story. Villagers are
likewise upright and dressed. Round animal eyes with a dark iris, never dots.

CANVAS
16:9 double-page spread, full bleed. No caption band, no reserved margin, no
border, no vignette. The image runs to all four edges.

NOT (rendering only)
no outline, rim or hard edge on any dapple blotch, no defined cast-shadow shapes
no red anywhere except the wrist cord, the kerchief and the strawberries
no airbrush, smooth digital gradient, glossy CG, photographic texture
no letters, numbers, addresses, postmarks, stamps, signage on envelopes, satchel,
houses or anywhere else
```

---

## §3. 캐릭터 시트

### 시트 1 — MartenPostman

```
CHARACTER SHEET - MartenPostman   (bake this FIRST)
Style: changjak-leafdapple - edgeless stamped light over flat local colour, no outline on the light.

FACE: a young pine marten. Chestnut-brown fur #6B4A2E, a cream bib from chin to
chest, small rounded ears with pale inner edges, dark button nose, long whiskers
= 5 strokes per side. Round dark eyes with a visible iris and one light dot -
never dots. Cheeks slightly rounder than an adult's.
BUILD: bipedal, upright, about 4 heads tall - a child's proportions but NOT a
baby: the head is one quarter of the body, not one third. Bushy tail carried
behind and low. Forepaws have five short fingers that can pinch a paper corner.
CLOTHES: short waistcoat in warm brown wool, three plain wooden buttons, no
pattern. Crossbody leather satchel on a wide strap that runs over the LEFT
forearm - remember this, the strap lies across the left wrist all book. Bare feet.
🔴 NO letters, numbers, badge, emblem or writing on the waistcoat or the satchel.
LEFT WRIST: a red cord #B33A2E wound TWICE round the left wrist, hidden under the
satchel strap. Only ONE loose thread end shows, about a finger long, poking out
from under the strap. In the sheet, bake both states as separate views.
POSTURE 1 (pages 1-10): the left forepaw is pressed flat against her chest,
holding one white envelope there, fingers spread; the strap crosses over that paw.
POSTURE 2 (pages 11-14): both forepaws free and forward.
REFERENCE SHEET: full body front standing in POSTURE 1; three-quarter turn in
POSTURE 1 with the left wrist and the one red thread end visible; left forepaw
close-up in POSTURE 1 - chest fur pressed into a hollow, strap over the paw, one
thread showing; left forepaw close-up open, palm up, red cord wound twice, loose
end hanging; head close-up shouting with mouth wide, ears forward; head close-up
looking down, ears flat, chin lowered. 16:9 sheet, plain cream ground, no text.
```

### 시트 2 — GrandmaGoat

```
CHARACTER SHEET - GrandmaGoat   (bake this FIRST)
Style: changjak-leafdapple - edgeless stamped light over flat local colour.

FACE: an old goat. Cream-grey coat, a longer paler beard under the chin, two
short backswept horns, a soft muzzle, long ears hanging sideways. Horizontal
pupils in warm amber eyes, lids creased and heavy at the outer corners - the age
lives in the lids, not in wrinkles. When she smiles the eyes close into two arcs.
BUILD: bipedal, upright, stooped a little forward, about 6 heads tall - clearly
adult, head about one sixth of the body. Hands with three broad fingers.
CLOTHES: dark blue-green dirndl-cut skirt and a plain grey bodice, no pattern, no
trim. Thick knitted stockings, wooden clogs.
🔴 KERCHIEF: a red headscarf #B33A2E tied under the chin with one end trailing
back. THIS RED IS EXACTLY THE SAME VALUE AS THE MARTEN'S WRIST CORD - bake them
side by side in the sheet and match them.
PROPS: a knobbed walking stick; a shallow round basket of wild strawberries
carried in both hands (never on the arm when she offers it).
SILHOUETTE RULE: the only tall stooped figure in the book, and the only red on a
head.
REFERENCE SHEET: full body three-quarter walking downhill with the stick, basket
under one arm, kerchief end flying back; full body front, stick tucked under the
arm, BOTH hands holding the basket out at arm's length; head close-up smiling,
eyes closed into arcs; head close-up bent low, eyes round with surprise, one hand
at the kerchief's end; a colour swatch pair - kerchief red beside cord red, same
chip. 16:9 sheet, plain cream ground, no text.
```

### 시트 3 — ThreeVillagers

```
CHARACTER SHEET - ThreeVillagers   (bake this FIRST)
Style: changjak-leafdapple - edgeless stamped light over flat local colour.
All three are bipedal and clothed. Round animal eyes with a dark iris, never dots.
Each appears on ONE page only, so each must be readable at a glance by silhouette
and by the colour that matches his letter's cord.

SQUIRREL CHILD (p3): red-brown squirrel, tufted ears, huge curling tail carried
up behind like a question mark. Smallest of the three, about 3.5 heads, shorter
than the stone table. BLUE dungarees - the blue is exactly the blue of the cord.
Bare feet. Bright round eyes, mouth open in a full grin.
BADGER UNCLE (p5): grey badger, black and white striped face, heavy shoulders,
back rounded with age, about 5 heads tall. GREEN waistcoat - exactly the green of
the cord - and a narrow-brimmed felt hat. Carries a plain wooden stick he leans
his weight on. Eyes narrowed into creases when he smiles.
COW AUNT (p7): a broad brown cow, big soft muzzle, short horns, ears out
sideways, the largest body in the book, about 6 heads tall and wide with it.
YELLOW apron - exactly the yellow of the cord - and a straw hat she takes off and
waves. Eyes crescent-shaped when laughing.
🔴 No writing, numbers or emblems on any garment or hat.
REFERENCE SHEET: for each of the three - full body three-quarter idle, and one
action view (squirrel leaping up onto the table with one paw raised; badger
leaning on the stick and reaching for a letter; cow striding in with the hat
waving overhead and the other hand reaching). Plus a group line-up of all three
beside the marten for size. 16:9 sheet, plain cream ground, no text.
```

---

## §4. 쪽별 컷

### p1

```
--- p1 — 어라, 돌이 모자라네 ---
DAPPLE: angular count = 5 - four envelopes on the table plus the one at her chest. Stamped light covers the whole sheet including the table top and her fur; not one blotch has an edge.
TABLE: four flat stones in a row (each about the size of her forepaw), pressing envelopes; her right forepaw is lowering the last stone. Reply pile = 0. A brass hand bell at the table's corner, linden rootlets, a few dry leaves.
RED: only one red on the sheet - a single thread end poking from under the satchel strap at her LEFT wrist. Same value as the kerchief that arrives on p10. Do not enlarge it, do not light it, but keep it at full saturation so the eye snags once.
CAMERA: medium, high angle looking down across the table. Lower two thirds = table top; the marten's face and chest at the upper edge.
SUBJECT: @MartenPostman upright, belly against the table, heels just lifted - THE TABLE TOP COMES TO HER CHEST, and this is the only page where the two touch, so the height is measured here. Right forepaw setting a stone down on an envelope, eyes sweeping the table, mouth half open, one ear tipped sideways. POSTURE 1: left forepaw pressed flat, holding a white envelope against her chest.
SETTING: low broad stone table under a big linden; this one spot is the only location in the whole book.
FINISH: envelopes and cords hand-finished with hard corners; everything else is field plus flat colour.
TONE: cool clear morning. Bipedal and clothed. Envelopes are blank white - no address, postmark, stamp or writing anywhere on the sheet.
```

### p2

```
--- p2 — 딸랑딸랑— 편지 왔어요—! ---
DAPPLE: angular count = 3 - the envelope at her chest and two on the table corner at the lower left. Above the linden's shade the slope has open sun, so up there the stamped blotches thin out to plain flat green; the field never gets an edge either way.
TABLE: only the corner is in frame - two stones with envelopes under them. Reply pile = 0.
RED: only the one thread end at the left wrist, mostly hidden from this angle. No other red.
CAMERA: wide, low angle from beside the table looking up the slope. Marten small at the lower left, seen from behind; the green slope climbs steeply across the right of the frame.
SUBJECT: @MartenPostman turned toward the slope, RIGHT forepaw thrown straight up overhead ringing the brass bell, heels off the ground, back arched, mouth wide open shouting, tail swinging behind. POSTURE 1 holds - the left forepaw is still flat on the envelope at her chest, and it will not leave until p11.
SETTING: steep green slope with wooden chalets scattered far apart - low down a house with BLUE shutters, above it a house with a GREEN door, higher a house with a YELLOW awning, and at the very top one small hut. In front of each, a tiny figure has just stepped out and started down; each is no bigger than a bean.
FINISH: marten finished; the houses get flat colour only, no windows detailed, no joinery.
TONE: the slope reads taller than it is, so it is plain that they must come all the way down. Bipedal and clothed. No letters, numbers, signs or house names anywhere.
```

### p3

```
--- p3 — 우리 집 파란색! ---
DAPPLE: angular count = 4 - the blue-cord envelope raised in the squirrel's paw, two still under stones, and the one at her chest. Field unchanged, shaking gently on the table top.
TABLE: two envelopes still under stones (green cord, yellow cord); ONE stone pushed aside, pressing nothing. Reply pile = 1 - a scatter of hazelnuts at the table's right end, all round.
RED: none on this page except the thread end at the left wrist. The blue must not lean warm.
CAMERA: medium, eye level, the table seen from the side; marten left, squirrel right.
SUBJECT: right, @ThreeVillagers/squirrel child sprung up with his chest hooked over the table edge, right forepaw clutching the blue-cord envelope and lifting it high, left forepaw still resting where he just set the hazelnuts down, eyes round, grin wide, tail curled up behind. Left, @MartenPostman pushing the freed stone aside with her right forepaw, looking up at him, mouth corners raised. POSTURE 1 holds.
SETTING: the table, the linden shade, the lower slope with the blue-shuttered house behind.
FINISH: squirrel and the blue envelope finished. The blue of his dungarees and the blue of the cord are the SAME hue - the match is the whole page.
TONE: bright and quick; light flicks off the hazelnut shells. Bipedal and clothed. Envelope is blank white - no address, postmark or writing anywhere.
```

### p4

```
--- p4 — 이건 누구 거예요? ---
DAPPLE: angular count = 2 - the blank envelope pushed forward, and the blue one in the squirrel's paw off to the side. The field runs over the squirrel's back and the marten's face at the same scale.
TABLE: out of frame except one corner and one empty stone.
RED: 🔴 the thread end at the left wrist is visible in THIS shot, coming from under the satchel strap - the squirrel's angle cannot see it, only the reader can. No other red.
CAMERA: close-up over the squirrel's shoulder toward the marten; the white envelope thrust forward fills the middle.
SUBJECT: centre, @MartenPostman leaning in - she has NOT taken the envelope off her chest; the left forepaw still holds it flat there and only the top corner is pinched forward by the right forepaw. Head tilted up to meet the squirrel's face, brows up, mouth open in a round O. Front, out of focus in the sense that it gets NO finish: the squirrel's back of head and shoulder in outline and flat colour only, one paw holding the blue letter out to the side, head cocked.
SETTING: table corner behind, one empty stone.
FINISH: the pushed envelope is the most finished thing on the page - hard corners, and its middle bowed slightly concave from being pressed to her chest all morning. This dent is the only evidence and is never written in the text.
TONE: two faces close and the sheet is bright, but the envelope is THE ONLY THING ON IT WITH NO COLOUR - blue, green and yellow all exist in this book, so colourless means nowhere to go. Bipedal and clothed. Envelope completely blank - no address, postmark, stamp or writing.
```

### p5

```
--- p5 — 초록! 우리 거야! ---
DAPPLE: angular count = 3 - the green-cord envelope in the badger's paw, one still under a stone, and the one at her chest. Shade is shorter now, so the blotches are smaller and closer together; still no edges.
TABLE: ONE envelope left under a stone (yellow cord); TWO stones now pressing nothing. Reply pile = 2 - hazelnuts, and beside them a string of dried apple rings, all round.
RED: only the wrist thread. No other red.
CAMERA: medium wide, slight high angle; badger enters from the right, marten at the left, the table crossing the lower frame.
SUBJECT: right, @ThreeVillagers/badger uncle upright with his weight on the wooden stick, body tipped forward, the other paw pinching the green-cord envelope and drawing it toward his chest, eyes creased shut with pleasure, back rounded and slow. Left, @MartenPostman pushing the SECOND stone aside with her right forepaw while turning her body toward him, heels lifted to see over the table. POSTURE 1 holds.
SETTING: the table, the linden, the green-doored house on the slope behind.
FINISH: badger and the green envelope finished; the slope is field and flat colour.
TONE: green owns the page - grass, waistcoat and cord are one family, so the matching is done by the eye without a word. Midday sun coming on, shadows short. Bipedal and clothed. Envelope is blank white - no address, postmark or writing.
```

### p6

```
--- p6 — 우리 집 색도 아니구나 ---
DAPPLE: angular count = 1 - the blank envelope alone. 🔴 ONE stamped blotch of light lands exactly on her left wrist; it has no edge and no rim, and it is not brighter than the others.
TABLE: not in frame beyond the near edge.
RED: 🔴 THIS IS THE LARGEST VIEW OF THE RED THREAD IN THE BOOK. The end comes out from under the satchel strap at the left wrist; the wound part stays hidden because the paw is pressed down - only the end shows. Full saturation, no glow, no outline.
CAMERA: close-up, LOW angle from below the table looking up at her chest; the badger's chin and waving hand crop the top edge.
SUBJECT: centre, @MartenPostman pinching the envelope's corner with the right forepaw and lifting it up while throwing her head back to look at the badger, heels off the ground, neck stretched long, eyes wide, mouth open. POSTURE 1 at its most visible: the left forepaw pressed flat to the chest, the fur beneath it crushed into a hollow, the satchel strap running across the top of that paw. Her own gaze goes up and away, the exact opposite direction from her wrist. Top edge: the badger's chin and throat, one hand waving lightly side to side.
SETTING: linden trunk and leaves behind, table edge below.
FINISH: only the marten and the envelope are finished.
TONE: from below she reads small and anxious, and THE VIEWER'S EYE IS AT EXACTLY THE HEIGHT OF THE RED THREAD - the reader sees what she cannot. Bipedal and clothed. Envelope completely blank - no address, postmark or writing.
```

### p7

```
--- p7 — 노란 끈! 나야, 나! ---
DAPPLE: angular count = 2 - the yellow-cord envelope in the cow's hand and the one at her chest. Noon sun, so blotches are smallest and most crowded here; still edgeless.
TABLE: NO envelopes left under stones; THREE stones pressing nothing. Reply pile = 3 - hazelnuts, the string of apple rings, and a round cheese wheel.
RED: only the wrist thread. No other red.
CAMERA: medium, eye level, and from the OPPOSITE side to the earlier pages - marten right, visitor left. The table crosses the middle.
SUBJECT: left, @ThreeVillagers/cow aunt striding in, one hand waving the straw hat above her head, the other reaching down to take the yellow-cord envelope, body pitched forward, eyes crescent, mouth wide open. Her big body fills the left half. Right, @MartenPostman pushing the THIRD stone aside with her right forepaw and tipping her head back to look up; beside the cow she reads small. POSTURE 1 holds.
SETTING: the table, the linden, the yellow-awning house up the slope behind.
FINISH: cow and the yellow envelope finished. Hat, apron and cord are one yellow.
TONE: hard noon light so the shade edges are knife-clean, and the beat is big and breezy. Bipedal and clothed. Envelope is blank white - no address, postmark or writing.
```

### p8

```
--- p8 — 글쎄다, 그 색은 처음 보는걸 ---
DAPPLE: angular count = 1 - the blank envelope alone, held up. Field unchanged; leaf shadow shivers finely on the table top.
TABLE: seen whole from this angle - THREE stones in a row pressing nothing, and the three round replies gathered at the opposite end. A child can count three and three.
RED: only the wrist thread, small at this distance. No other red.
CAMERA: medium close-up, HIGH angle from the cow's head height looking down at the marten; the brim of the straw hat crops the top edge.
SUBJECT: centre-low, @MartenPostman stretching the envelope up as high as it will go with the RIGHT forepaw only, so one shoulder rides up and the body goes crooked, head tipped right back, eyes wide, heels lifted until the calves are taut. POSTURE 1: the left forepaw is still on her chest - THE THIRD TIME IN THE SAME POSE. Top edge: the hat brim, and under it only the cow's muzzle and mouth, the corners drifting down.
SETTING: table top fully visible, linden leaf shadow shaking across it.
FINISH: the raised envelope is finished and still bowed concave in the middle.
TONE: third repetition, so keep the colour and brightness IDENTICAL to p4 and p6 - the only thing that has changed is her posture, and her heels are at their highest here. Bipedal and clothed. Envelope completely blank - no address, postmark or writing.
```

### p9

```
--- p9 — 돌 넷이 빈 채로 나란히 남았어요 ---
DAPPLE: angular count = 1 - the envelope under both her forepaws. 🔴 DENSITY PAGE: the stamped field is printed in a single cool shade ink here rather than the warm one; it is a change of ink, NOT a dimming, and the blotches keep the same size and softness.
TABLE: 🔴 the whole page is this table. FOUR flat stones lying in a row, all empty, pressing nothing, countable on four fingers. At the far end, the three round replies - hazelnuts, the apple ring string, the cheese wheel - with the FOURTH place beside them left bare. One dry linden leaf has blown onto an empty stone.
RED: only the wrist thread. Evening light on the chalet windows up the slope must stay warm ochre, NOT red.
CAMERA: wide, high angle from up in the linden branches, the table set on a slant across the frame; the marten alone beside it, low centre.
SUBJECT: @MartenPostman standing alone, shoulders dropped, head bowed, ears sideways, tail low enough to touch the ground, toes turned inward. 🔴 BOTH forepaws are now on the envelope at her chest, pressing it - one paw all day, two paws now. The posture is the whole feeling; do not add a tear or a frown.
SETTING: the table, the linden, the slope above with the last light on the far windows.
FINISH: table, stones and replies all get finish this page - this is the only page where the props are counted.
TONE: shade covers the table entirely and the sun has climbed away up the slope; even the white envelope has gone grey. Wide and soundless, sad but not frightening. Bipedal and clothed. Envelope is blank white - no address, postmark or writing.
```

### p10

```
--- p10 — 내 것도 있니? ---
DAPPLE: angular count = 1 - the envelope at her chest. Field in the cool evening ink, warm only where the low sun rakes the upper slope.
TABLE: lower left corner only - four empty stones and the three round replies just showing.
RED: 🔴 THE KERCHIEF ENTERS. It is the strongest colour on the sheet and it is EXACTLY the same red as the wrist thread that has been there since p1. Both are on the page at once; nobody has noticed either. The marten's head is down, so she does not see it.
CAMERA: medium wide, LOW angle from beside the table looking up the slope - the same direction as p2. Grandma upper right on the path, marten lower left.
SUBJECT: upper right, @GrandmaGoat coming down the path on her stick, one foot just landed on a step stone, a shallow basket of wild strawberries held under her other arm, head pushed forward toward the marten, mouth round with the question, kerchief end flying back. Lower left, @MartenPostman with her head dropped so far her gaze lands on her own toes, ears fully flat, shoulders narrow, BOTH forepaws still pressing the envelope to her chest.
SETTING: the path curving from upper right down to lower left, one small hut at its top end (the same hut as p2), evening light raking low across the grass.
FINISH: grandma and the kerchief finished; the marten finished; nothing else.
TONE: blue, green and yellow have all left the page and red arrives large for the first time. Bipedal and clothed. No letters, numbers or signs anywhere.
```

### p11

```
--- p11 — 편지가 스르륵 미끄러졌어요 ---
DAPPLE: angular count = 1 - the envelope caught mid-slide. Low side light, so the blotches stretch long across the ground; still no edges.
TABLE: behind them, four empty stones and the three round replies.
RED: kerchief, and the strawberries in the basket - the only page with two reds together. 🔴 They are put side by side to school the eye for the third red on the next page. The wrist cord is still hidden; only the thread end shows.
CAMERA: medium, eye level; grandma left, marten right, and between them in the air the basket and the sliding envelope.
SUBJECT: left, @GrandmaGoat with the stick tucked under one arm, holding the strawberry basket out in BOTH hands, arms straight, body leaning in, eyes closed into arcs, one kerchief end lying on her shoulder. Right, @MartenPostman reaching out with BOTH forepaws at once to receive it - THE LEFT FOREPAW HAS JUST LEFT HER CHEST and is still in the air in front of it, fingers spread. Eyes on the basket, mouth slightly open, heels lifted as she comes forward.
SETTING: 🔴 between chest and paw the white envelope is SLIDING DOWN - its top corner still snagged in her chest fur, its bottom tipped toward the table. It is mid-slide, not fallen; that is why this page is one moment. The concave dent still shows in it.
FINISH: basket, grandma's hands and the sliding envelope finished.
TONE: low side light throws long shadows off both pairs of outstretched arms; a soft giving-and-taking beat. Bipedal and clothed. Envelope is blank white - no address, postmark or writing.
```

### p12

```
--- p12 — …내 앞발에 있었잖아! ---
DAPPLE: angular count = 0 hard-edged envelopes. The fallen envelope lies at the bottom edge of frame and gets NO finish at all - no corners drawn, no edge - so there is not one straight line on this page. The stamped field covers her fur at the same scale as everywhere else.
TABLE: out of frame but for a blurred hint of the table top at the bottom.
RED: 🔴 THE PAGE. Nine tenths of the sheet is brown fur and cream chest, and the RED CORD IS THE ONLY THING ON IT WITH COLOUR - wound TWICE round the left wrist, one end pulled out from under the satchel strap as the paw rose and now hanging loose. This is where the cord's length is measured: exactly two turns of the wrist. Same value as the kerchief. No other red, no glow, no outline, no sparkle.
CAMERA: extreme close-up along her own line of sight, looking down at her own paw; the left forepaw and wrist fill the frame.
SUBJECT: centre, @MartenPostman's left forepaw stopped dead in the air, five fingers spread stiff, the paw shaking slightly. At the top edge, her chin and two lowered eyes crop in, pupils blown wide, mouth half open with the breath stopped. 🔴 The fur on the inside of that paw is still crushed flat from a whole day of pressing.
SETTING: below, out of focus and unfinished, the white envelope on the table and one corner of the strawberry basket.
FINISH: paw, wrist and cord finished. Nothing else on the sheet is finished at all.
TONE: low evening light from the side makes the two turns of cord read as two raised ridges. A short held silence. Bipedal and clothed. No letters, numbers or writing anywhere.
```

### p13

```
--- p13 — 할머니 거예요! ---
DAPPLE: angular count = 1 - the envelope held up, hard corners back, and now with a red cord tied round it. The field is at its warmest ink of the day.
TABLE: the strawberry basket has been set down, so the reply pile is FOUR (hazelnuts, apple rings, cheese wheel, basket), with the four empty stones alongside.
RED: 🔴 THE ANSWER IS DRAWN HERE. The red knot on the envelope and the red kerchief are almost touching and are AT THE SAME DEPTH in the frame, so a child can compare them eye to eye. They must be the identical hue and value - if they differ at all the book fails. No third red on the page except the strawberries in the basket below.
CAMERA: medium close-up, slightly low; the marten's two forepaws and face low centre, grandma's face and kerchief upper right.
SUBJECT: low centre, @MartenPostman gripping the white envelope in BOTH forepaws with the red cord just tied, one finger still resting on the knot, and thrusting it up overhead; head thrown back, mouth wide open shouting, eyes shining, ears pricked forward, heels lifted so the whole body stretches upward. Upper right, @GrandmaGoat bent at the waist bringing her face down close, eyes round, one hand at the end of her kerchief.
SETTING: the table with the four replies and the four empty stones.
FINISH: envelope, knot and kerchief finished; everything else field and flat colour.
TONE: low sun behind the envelope so the paper glows through, and the knot and the kerchief are the darkest, strongest marks on the sheet. Bipedal and clothed. 🔴 The envelope carries NO address, postmark, stamp or writing - the cord colour is the entire message.
```

### p14

```
--- p14 — 동그란 끈 자국이 손목에 남아 있어요 ---
DAPPLE: angular count = 0. 🔴 THERE IS NO STRAIGHT LINE ANYWHERE ON THIS SHEET. The letter far off is hugged to grandma's chest and is drawn as one small soft light shape with no corners. Everything else is round - four stones, hazelnuts, apple rings, cheese wheel, berry basket, the pressed ring on the wrist.
TABLE: at the bottom edge, four empty stones in a row on one side and FOUR round replies gathered on the other - exactly swapped with the morning, when four letters lay where the replies now are.
RED: only two reds left - the kerchief a single dot far up the path, and NOT the wrist. 🔴 The wrist mark is not red: it is a ring of fur pressed flat, read as a shade, a place where the colour has gone.
CAMERA: wide with a large foreground; eye level, the same direction up the slope as p2 and p10.
SUBJECT: 🔴 front right, in the only finished part of the sheet - @MartenPostman's LEFT FOREPAW alone, held open palm-up and large, fingers spread wide, the inner fur still crushed flat, and TWO ROUND PRESSED RINGS where the cord was wound. THE CORD IS GONE. Her eyes and nose-tip crop in at the top corner of the paw, looking down at it. Far back left and very small, @GrandmaGoat climbing the path from behind, the letter held to her chest in both hands, the kerchief one red point in the dusk.
SETTING: the sun going down behind the ridge, the slope orange, the ground under the linden gone cool blue; one first star between the leaves.
FINISH: only the open forepaw. The rest is field and flat colour.
TONE: the day is over and there is no explanation - one paw, large, and nothing said. Bipedal and clothed. No letters, numbers or writing anywhere.
```
