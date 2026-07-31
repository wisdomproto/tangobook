# 창작동화 1000 — c12 앵커 + 삽화 프롬프트

> 대본 SSOT 는 `docs/changjak-books/c12.md`. 대본은 한 글자도 안 고친다.
> 🔴 실행 순서: ① 시트 → ② 승인본을 @image 로 붙여 컷

## c12 §1. 앵커 배정

**권**: c12 안개 낀 아침의 소리들 · 오해와 반전 · 스코틀랜드 고원 헤더밭 · 11쪽 · 4~6세
**클러스터**: **C8** (기존 C8 = c02 · c10 · f06 · f08 · a75 — **c12 로 마감**)
**앵커 슬러그**: `changjak-twosteps` (신규 민팅)
**한 줄**: 회백 워시 한 겹이 종이를 다 덮은 것이 안개이고, **그 위에 그린 것은 두 걸음 안의 것뿐**이다. 두 걸음 너머는 흐린 게 아니라 **한 획도 없다**.

**형제 권과 갈린 축** (첫 렌더에서 세어진다)

| 형제 | 갈린 축 |
|---|---|
| **c60** | **안개가 얹힌 것인가 안 그린 것인가** — c60 은 반불투명 판을 겹쳐 겹수 0/1/2/3 이 시야다. c12 에는 **중간 단이 없다**(있다/없다 둘) |
| **c02** | 번짐이 지배면이고 마른 선을 나중에 얹는 2단계 ↔ c12 는 워시 위에 **불투명 건식**으로 얹고 번짐이 0 |
| **f06** | **어두운 것이 있나** — f06 은 어두운 데가 한 곳도 없다. c12 의 젖은 바위는 **새까맣다** |
| **f07** | 같은 「지지면이 드러난다」이나 c12 의 지지면은 **아무것도 아닌 것**(안개), f07 은 **물건**(흙). 방향도 반대 — c12 는 한 장에 한꺼번에 는다 |
| **a13·e09·f10·h05** (좁은 한 칸 + 빛 한 덩이) | c12 는 실외이고 **빛이 셈에 안 쓰인다** — 세는 것은 **그 쪽에 그려진 것의 개수** |

🔴 **밀도 배급 = p1 · p9 · p11 셋뿐.** 같은 자리 같은 구도 세 장. **카메라를 절대 흔들지 마라.**
🔴 **p2~p8 은 화면 대부분이 비어야 한다.** 컷마다 「두 몸 말고 그릴 것 N개」를 숫자로 못박았고, **넘기면 p9 가 죽는다.**
🔴 **호리 니들펠트 분리** — 양털·사슴털·토끼털에 보풀·바늘땀·섬유 엣지가 한 올도 없어야 한다.

**대본 SCENE 처방표** (습관어 대역)

| 대본 | 옮긴 것 |
|---|---|
| 「두 걸음 너머가 통째로 사라졌어요」 | 흐림이 아니라 **획 0** — 그 자리는 지지면 워시 그대로 |
| 「가장자리로 갈수록 하얗게 풀린다」(p6) | 두 몸의 **윤곽선을 안 긋고** 색이 워시 값에 닿아 끝난다 |
| 「안개보다 아주 조금 진할 뿐」(p5 양 윤곽) | 워시보다 **한 단만 어두운 넓은 면 하나**, 테두리·다리·얼굴 0 |
| 「크기를 있는 그대로」(p9·p11) | 크기 문구는 **넷과 양이 같은 깊이에 있는 두 쪽에만** |

---

## §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-twosteps

Style: picture book for ages 4-6, a Scottish Highland heather slope at sunrise,
one flat rock. A single flat grey-white wash covers the whole sheet edge to edge -
that wash IS the fog. Nothing is ever painted on top of it to represent fog.

RENDERING (finish hierarchy)
The wash is the ground. On it draw ONLY what stands within two steps of the flat
rock. Everything past two steps has ZERO marks - not blurred, not faint, not a
silhouette, not a shadow: bare wash. There is no middle tier; a thing is fully
drawn or absent. Drawn things are dry opaque gouache laid over the wash with crisp
edges. Wet rock is solid near-black, the darkest value on the page.
FINISHED THINGS PER PAGE = 2 (the two animals; on p9 and p11 the ewe takes one
slot). DENSITY RATION = p1, p9, p11 only - those three carry the full inventory
below and share one identical framing. On p2-p8 each cut states how many drawn
objects other than the two animals are allowed; that number is a ceiling, and
adding scenery kills p9.
THE FIVE (identical spec wherever they appear): 1 a dew drop on a wet heather tip
above a rock pool, drop = 1 mark; 2 loose pebbles in a hand-wide burn, at most 9
pebbles; 3 a gap between two standing black rocks, 2 shapes; 4 a wren the size of
a thumbnail on the rock top, = 6 strokes, tail cocked up; 5 a Scottish Blackface
ewe, white body, black face, curled horns. None of the five is ever outlined
heavier or coloured brighter than the heather around it.

PALETTE
#DCDCD6 fog wash and ground / #7A5E86 heather purple / #23262A wet rock and the
ewe's face / #A0603A deer coat. Heather purple appears only where heather is
actually drawn; it never tints the wash. No fifth colour.

CHARACTER DESIGN LANGUAGE
Real animal anatomy, no clothes, no props. All four feet on the ground on all 11
pages; nobody stands upright on two legs. Eyes are round animal eyes with a dark
iris, never dots. Expression comes from ears, neck length and open mouth only.

CANVAS
16:9 double-page spread, full bleed. No caption band, no reserved margin, no
border, no vignette. The image runs to all four edges.

NOT (rendering only)
no wool fibre, stitching, felted or fuzzy fabric edge on any animal
no fog as a translucent layer over shapes, no half-hidden silhouettes, no soft focus
no airbrush, smooth digital gradient, glossy CG, photographic texture
no letters, numbers, signage
```

---

## §3. 캐릭터 시트

### 시트 1 — MountainHare

```
CHARACTER SHEET - MountainHare   (bake this FIRST)
Style: changjak-twosteps - dry opaque gouache on a flat grey-white wash, crisp edges, no outline.

BODY: a young mountain hare, grey-brown summer coat with a paler belly and a
pale ring around the eye. Body length about 3 heads. Hind legs long and heavy,
forelegs short. Coat = clumps of 3-5 strokes, at most 14 clumps on the whole
animal; no individual hairs, no fibre, no fuzz.
HEAD: broad flat skull, blunt muzzle, whiskers = 5 strokes per side. Round amber
eye set high on the side of the head with a dark iris - never a dot. Ears are the
longest thing on him, each ear black-tipped, the inner fur lying in one direction.
SILHOUETTE RULE: he is the only animal here with ears longer than his own head.
Read him by ear length alone from across a room.
GRADE: four feet on the ground always. He may rise onto his hind feet with both
forepaws lifted to the chin, but never stands upright like a person and never
holds anything.
REFERENCE SHEET: full body standing three-quarter, idle; full body from the side
crouched low with one ear rotated forward; head close-up, both ears straight up,
mouth open shouting; head close-up, both ears laid flat down the back, mouth shut.
16:9 sheet, neutral grey-white ground, no props, no text.
```

### 시트 2 — RedDeerCalf

```
CHARACTER SHEET - RedDeerCalf   (bake this FIRST)
Style: changjak-twosteps - dry opaque gouache on a flat grey-white wash, crisp edges, no outline.

BODY: a red deer calf, warm red-brown coat #A0603A with a row of faint pale spots
along the back, cream under the throat and belly. Legs thin and long, knees
knobbly, hooves small and dark. Body length about 3 heads, shoulder height a
little above the hare's ears. Coat = flat colour with at most 9 pale spots; no
hairs, no fibre.
HEAD: long narrow muzzle, wet black nose, NO antlers, no antler buds. Large dark
round eye with a visible dark iris and a single light dot, never a dot-eye. Ears
wide, rounded, held like two leaves.
SILHOUETTE RULE: the tallest and thinnest of the three. Legs are the read - four
thin verticals under a small body.
GRADE: four feet on the ground always. She may lift ONE foreleg to knee height
and set it down; nothing else.
REFERENCE SHEET: full body standing three-quarter, idle; full body from the side
with the neck stretched forward as far as it goes; head close-up, both ears
pricked forward, eyes wide; head close-up, one ear drooped sideways, neck pulled
in short. 16:9 sheet, neutral grey-white ground, no props, no text.
```

### 시트 3 — BlackfaceEwe

```
CHARACTER SHEET - BlackfaceEwe   (bake this FIRST)
Style: changjak-twosteps - dry opaque gouache on a flat grey-white wash, crisp edges, no outline.

BODY: a Scottish Blackface ewe. Body a broad off-white mass #DCDCD6 to #EDEBE4,
barely darker than the fog wash, drawn as ONE closed shape with at most 7 short
notches along its underline. NO fleece curls, NO wool fibre, NO stitching, NO
fuzzy or felted rim - the body is a flat field, and that is what lets it come
loose from the fog.
HEAD: face and legs solid near-black #23262A - the darkest thing on her. Two
horns curling once outward beside the ears, pale grey-brown, = 2 strokes each.
Yellow eye with a horizontal pupil. Muzzle blunt; jaw works sideways when chewing,
a heather stem sticking out at one corner.
SILHOUETTE RULE: black face first, white body second. When she emerges from fog
the black face and horns arrive before any of the body.
SCALE: as tall at the shoulder as the deer calf's back; on screen she is the only
large thing among the five.
GRADE: four feet on the ground always, no clothes, no bell, no collar.
REFERENCE SHEET: full body standing three-quarter, head down grazing; full body
side view, head lifted, mouth chewing with a heather stem crosswise; head close-up
front, mouth open bleating; the same body reduced to one pale untextured mass with
no face, for distant and half-emerged use. 16:9 sheet, neutral grey-white ground,
no props, no text.
```

---

## §4. 쪽별 컷

### p1

```
--- p1 — 여긴 내 앞마당이야 ---
TWOSTEPS: no fog yet. This dawn air is the same wash, but on this page the whole slope is drawn.
COUNT: DENSITY PAGE - full inventory, and nothing in it is emphasised.
FIVE: all five present, all at equal finish - 1 a dew drop on a wet heather tip above a rock pool; 2 at most 9 pebbles in the hand-wide burn; 3 the gap between two standing black rocks; 4 the wren on the rock top, 6 strokes; 5 one small white shape far down the slope past the heather, no face, no legs, reads as a stone.
CAMERA: wide, eye level, flat rock centred. THIS EXACT FRAMING RETURNS AT p9 AND p11 - do not move the camera, the distance or the horizon.
SUBJECT: centre, @MountainHare landing on the flat rock on his hind feet, both forepaws still in the air, both ears straight up, head turned down toward the calf, mouth open. Lower left, @RedDeerCalf, four legs apart, neck lowered, muzzle pushed deep into a heather bush, short tail flicked once.
SETTING: gentle Highland slope, heather to ankle height, one wet black flat rock, a hand-wide burn crossing in front of it, two standing black rocks beside it, ridge line and the valley below, one dew-strung spiderweb.
FINISH: the two animals finished. The five get the same finish as the heather - no extra outline, no brighter colour, no spotlight.
TONE: low raking sunrise, heather bright purple, wet rock glossy black. Four legs, no clothes. No letters or numbers anywhere.
```

### p2

```
--- p2 — 안개가 올라왔어요 ---
TWOSTEPS: the fog arrives as the wash rising up the sheet. Lower half of the page = bare wash, ZERO marks. Upper half still drawn.
COUNT: besides the two animals, at most 6 drawn objects on this page - 4 heather clumps, the rock's near edge, the spiderweb. Nothing else.
FIVE: none of them drawn. The valley, the ridge and the white shape from p1 are gone because they are past two steps, not because they are pale.
CAMERA: medium wide, eye level, facing down the valley. Horizon line is where drawing stops.
SUBJECT: centre, @RedDeerCalf with all four feet gathered, her shoulder pressed against the hare's flank, head toward the fog, both ears pricked forward, one foreleg slightly bent. Left of centre, @MountainHare on the flat rock, four feet planted, nose tipped up, whiskers spread, one ear tilted down.
SETTING: three or four heather sprigs at their feet with a drop on each tip, one wet rock corner, and one spiderweb hanging dead still - the only sign that there is no wind.
FINISH: only the two animals finished. Where the wash meets the drawn half there is no gradient and no soft blend - drawing simply stops.
TONE: white below, wet purple above; the air has stopped dead. Four legs, no clothes. No letters or numbers anywhere.
```

### p3

```
--- p3 — 뚝. 뚝. 뚝. 발소리야 ---
TWOSTEPS: fog at its thickest. Only the rock top the two stand on is inside two steps. Everything else = bare wash, ZERO marks, no direction, no top or bottom.
COUNT: besides the two animals, exactly 3 drawn objects - the wet rock surface under them and 2 heather sprigs. Do not add ground, horizon or a light source.
FIVE: none drawn. The dripping is heard, never shown.
CAMERA: medium, eye level, the two filling the middle band, everything behind them a white wall.
SUBJECT: left, @MountainHare crouched low on all fours, rotating ONE long ear forward - the inner fur of that ear lies in the new direction while the other ear stays straight up - nose tipped up, eyes wide, mouth open shouting. Right, @RedDeerCalf standing four square with her neck stretched forward as far as it goes, chin out, both ears swung toward the sound, hind legs unmoved so the whole body reads long.
SETTING: wet rock and two heather sprigs. Beyond that nothing at all.
FINISH: the two animals are the only shapes with edges on the sheet. Fog droplets bead on their backs - at most 12 dots across both animals.
TONE: evenly white in every direction so there is no front or back. Four legs, no clothes. No letters or numbers anywhere.
```

### p4

```
--- p4 — 딸그락. 말발굽이야 ---
TWOSTEPS: same white. Inside two steps: the rock top and the two bodies. Behind the calf, ZERO marks.
COUNT: besides the two animals, exactly 2 drawn objects - the rock top and at most 5 splashed droplets. No horizon, no ground line.
FIVE: none drawn. The rattle of the burn's pebbles is heard, never shown.
CAMERA: medium close-up, slightly low, near the ground so the drumming hind feet come at the viewer.
SUBJECT: front centre, @MountainHare with both forepaws braced on the rock and his chest dropped, drumming both hind feet down - one foot already landed and flattened against the stone, the other still lifted - rump bouncing, both ears tipped back, head turned toward the fog. Behind and right, @RedDeerCalf: two thin forelegs and a lowered face come into frame, one hoof stepped back a pace.
SETTING: the wet rock top, a few droplets thrown up where the foot struck, one damp spreading print. Nothing else.
FINISH: the hare finished; the calf's legs and face carry outline only, no inner modelling.
TONE: seen from below the drumming feet read big and strong, and the emptiness behind them is where the answer should have come from. Four legs, no clothes. No letters or numbers anywhere.
```

### p5

```
--- p5 — …양 아니야? ---
TWOSTEPS: same white. Inside two steps: the rock's edge, a few heather sprigs, and ONE more thing - see FIVE.
COUNT: besides the two animals, exactly 3 drawn objects plus the pale mass. No extras.
FIVE: number 5 arrives early and unannounced. At the right-hand edge, two steps away, ONE broad pale mass a single value darker than the wash - no rim, no legs, no face, no horns, no shading. It must take a second look to see at all. Do not brighten it, do not outline it, do not point at it.
CAMERA: medium, eye level. THE TWO LOOK AT EACH OTHER, not at the sound off the right edge.
SUBJECT: right, @RedDeerCalf lowering ONE foreleg from knee height back onto the heather, hoof barely touching, neck pulled in short so the shoulders ride up, mouth barely open - she is speaking small - one ear drooped sideways. Left, @MountainHare spun round on the rock to face her, nose thrust forward, whiskers spread, mouth wide open, one forepaw on the rock and the other lifted toward her.
SETTING: a few heather sprigs and the rock's edge.
FINISH: the two animals finished. The pale mass gets NO finish at all - it is one flat field.
TONE: two bodies sharp on an all-white sheet; who spoke small and who spoke loud is read only from mouth size and body lean. Four legs, no clothes. No letters or numbers anywhere.
```

### p6

```
--- p6 — 후우—. 아주 커다란 게 숨을 쉬어 ---
TWOSTEPS: same white. Inside two steps: the two bodies and one hand-span of wet rock. Nothing else exists.
COUNT: besides the two animals, exactly 1 drawn object - a hand-span of wet rock under them.
FIVE: none drawn. 🔴 Do NOT invent a shadow, a shape, a mass or a silhouette for the breathing thing. The page is frightening because the sheet is empty.
CAMERA: close-up, eye level, the hare's back filling the frame.
SUBJECT: centre, @MountainHare facing forward braced on all fours, nose tipped up, both ears straight up, the fur along his spine slightly raised, head turned to the side with his mouth open. Behind him, @RedDeerCalf has pushed her head into the hollow behind his shoulder so only half her face shows - the one visible eye squeezed shut, one ear flat, both forelegs folded under her so she sits lower.
SETTING: the seam where the two bodies touch, and a hand-span of wet rock.
FINISH: the darkest, most finished area is where the two bodies press together; toward the edges the colour simply reaches the wash value and ends - no outline is drawn round either body there, and no gradient is airbrushed.
TONE: the huge thing is nowhere on the page. Four legs, no clothes. No letters or numbers anywhere.
```

### p7

```
--- p7 — 거기 누구야아—! ---
TWOSTEPS: same white. Inside two steps: rock and two heather sprigs. In the direction he shouts, ZERO marks - and nothing moves there.
COUNT: besides the two animals, exactly 2 drawn objects - the rock top and 2 heather sprigs.
FIVE: none drawn.
CAMERA: medium, slightly low, so the shouting body reads big; the right half of the sheet is empty white.
SUBJECT: front left, @MountainHare braced on his hind feet with his chest raised, both forepaws lifted to the chin and cupped round his muzzle like a horn - only as far as a four-legged animal can go, he does NOT stand upright - head thrown back, mouth wide, throat swollen, both ears tipped back. Behind right, @RedDeerCalf standing four square, both ears straight up, waiting, eyes wide, mouth shut, one foreleg lifted halfway and stopped.
SETTING: rock top and two heather sprigs. In the shouted direction the wash does not stir, curl or part.
FINISH: the two animals finished, nothing else touched.
TONE: half the sheet is nothing at all, and that half is the beat where the answer does not come. Four legs, no clothes. No letters or numbers anywhere.
```

### p8

```
--- p8 — 소리가 한꺼번에 몰려왔어요 ---
TWOSTEPS: same white, and this is the emptiest page in the book. Inside two steps: one slab of rock. That is all.
COUNT: besides the two animals, exactly 2 drawn objects - one rock slab and 3 heather stems. 🔴 Put no shape of any kind anywhere else on the sheet.
FIVE: none drawn, though all five are sounding at once.
CAMERA: medium, slightly high, the two placed small in the middle of a white field with a wide margin of nothing on every side.
SUBJECT: centre, @MountainHare and @RedDeerCalf pressed back to back and flank to flank, facing opposite ways. The hare has all four feet planted, each ear rotated to a different direction, eyes at their widest. The calf holds all four legs straight and locked, and ONE foreleg is visibly shaking - the wet under that hoof trembles in fine rings - neck pulled in, ears laid back, nostrils flared.
SETTING: the slab they stand on and three heather stems.
FINISH: only the two animals carry finish. No ground shadow spreading outward, no light pool, no vignette.
TONE: sound arrives from every direction and there is nothing to look at - this page must be emptier than any other for the next one to work. Four legs, no clothes. No letters or numbers anywhere.
```

### p9

```
--- p9 — 바람이 안개를 쓸어 갔어요 ---
TWOSTEPS: the rule ends here. The wind takes the wash off to the left; the whole slope is drawn again in one page - no in-between state, no partial fade, no thinning veil. Only a ragged white strip remains along the left edge.
COUNT: DENSITY PAGE - the full p1 inventory, plus the ewe.
FIVE: all five at once, all in their p1 places - 1 a drop falling from the wet heather tip into the rock pool; 2 in the burn one pebble mid-roll just meeting another, at most 9 pebbles; 3 between the two black rocks a trailing rag of fog being drawn through the gap; 4 the wren on the rock top, tail cocked, beak wide open, 6 strokes; 5 the Blackface ewe two steps away, coming out of the retreating white - BLACK FACE AND CURLED HORNS FIRST, the white body still half in the wash - a heather stem crosswise in her mouth, jaw working sideways.
CAMERA: wide, eye level - IDENTICAL to p1 in place, distance and horizon.
SUBJECT: centre, @MountainHare frozen in his previous pose, mouth stopped open mid-word, both ears straight up, eyes wide, one forepaw raised and not coming down. Beside him @RedDeerCalf, still back to back, head alone turned right, eyes huge, ears snapped forward, the shaking foreleg now still.
SETTING: the purple heather, the burn, the two black rocks, the valley all returned.
FINISH: 🔴 the five get NO arrows, no glow, no framing, no size boost. Drop, pebble and wren are thumbnail-sized; only the ewe is large. All five sit at the same depth as the two animals so the sizes read true.
TONE: the cleared side is suddenly bright. Four legs, no clothes. No letters or numbers anywhere.
```

### p10

```
--- p10 — 양이야! 진짜 양이 있었어! ---
TWOSTEPS: fog gone. Everything within the slope is drawn; only the far valley beyond the ridge stays bare wash.
COUNT: normal page - besides the three animals, at most 7 drawn objects.
FIVE: 3 and 4 stay in frame at their fixed spec (the black rocks with their gap, the wren on top, 6 strokes). The drop and the pebbles are behind the camera line this page.
CAMERA: medium wide, slightly low, so the calf and the ewe stand at the same depth and their true sizes can be compared.
SUBJECT: front left, @RedDeerCalf stretching ONE foreleg out to push a heather bush aside - the pressed branch bent over to one side, one hind leg still behind her mid-stride - head lifted, mouth wide open shouting, both ears snapped forward, eyes bright. Right, @BlackfaceEwe lifts her face out of the heather toward the calf: black face, yellow eye, a heather stem half out of her mouth, jaw still moving sideways. Back right and above, @MountainHare sits on the flat rock with BOTH LONG EARS DROOPED FLAT DOWN HIS BACK and his mouth shut.
SETTING: wet earth showing under the parted heather, pressed marks round the ewe's hooves, the burn and the black rocks behind, dew flashing in the sun.
FINISH: calf and ewe finished; the hare gets outline and flat colour only - he is not the subject of this page.
TONE: seen from below, calf and ewe side by side and equally large. Four legs, no clothes. No letters or numbers anywhere.
```

### p11

```
--- p11 — 소리가 아까랑 똑같이 나요. 그런데 하나도 안 커요 ---
TWOSTEPS: no fog. The whole slope drawn, right down the valley.
COUNT: DENSITY PAGE - the full inventory again, one last time.
FIVE: all present and ALL TINY except the ewe - 1 the drop falling from the heather tip into the rock pool, 1 mark; 2 one pebble knocking another in the burn, at most 9 pebbles; 3 the gap between the two black rocks with the wind passing through; 4 the wren on the rock top, beak wide open, 6 strokes; 5 the ewe, and she is the largest thing on the sheet. 🔴 The four must be small enough that a child has to hunt for them - and they are at the same depth as the ewe so the sizes are honestly compared.
CAMERA: wide, eye level - IDENTICAL to p1 and p9 in place, distance and horizon.
SUBJECT: centre, @RedDeerCalf standing at the ewe's flank, tearing off a mouthful of heather and chewing it, head turned toward the ewe, a purple flower sticking out at the corner of her mouth, one ear relaxed sideways. @BlackfaceEwe beside her, head up, mouth open bleating, black face, curled horns, the biggest body on the page. Back left, @MountainHare lying flat on his belly on the rock, both ears laid flat down his back, chin resting on his forepaws, watching them.
SETTING: purple heather running down to the valley, the burn, the two black rocks.
FINISH: all three animals finished; the four small ones get the same finish as the heather.
TONE: even morning light, shallow shadows, quiet and bright. Four legs, no clothes. No letters or numbers anywhere.
```
