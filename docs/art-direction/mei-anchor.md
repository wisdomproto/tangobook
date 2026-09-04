# 메이네 산마을 — 앵커 하나 + 캐스트 시트

> 창작동화 **시리즈 02** (25권 · 250쪽). 대본 SSOT = `docs/changjak-books/mei/*.md` ·
> SCENE = `_scenes.json` · 회차 HTML = `packages/client/public/mei-{01..25}.html`
> 🔴 **이미지 생성은 여기서 하지 않는다.** 프롬프트까지가 이 문서의 일이다.

---

## §0. 🔴 한 시리즈 = 한 그림체 (2026-08-13 확정)

처음엔 25권을 넷으로 쪼개 매체를 달리했다(색연필·크레용·과슈·숯). **뒤집었다.**

> 원래 각 권마다 다르게 하려던 걸 한 시리즈로 좀 완화한 거지. 한 시리즈는 같은 캐릭터, 같은 그림체로. — 사용자

넷으로 쪼갠 근거 둘이 다 약했다.

- **「권마다 다른 그림체가 라인 정체성」** — 그건 **단권 완결** 시절 규칙이다. 한 권이 한 세계라 그림체도
  한 권마다 달랐던 것인데, 시리즈를 도입하면 단위가 「권」에서 **「시리즈」**로 올라간다.
  시리즈 40개 × 각기 다른 그림체 = 서가에서 40종이고, 호리 라인 전체가 1종인 걸 생각하면 충분히 많다.
- **「앵커당 6~10권 상한」** — **장부 규칙**이지 읽는 사람 문제가 아니다. 상한을 둔 이유는 같은 그림이
  지겨워지는 걸 막으려던 것인데, 시리즈는 캐스트가 같아서 애초에 같은 그림이 정상이다.

🔴 그리고 우리 실적이 반대편에 있다 — 호리 생활동화 45편·유치원 20편·세상 탐험 15편이 니들펠트 하나,
전래동화 40편이 점눈이 하나다. **네 살이 25권을 나란히 놓고 볼 때 같은 메이가 네 번 다르게 보이면
한 시리즈로 안 읽힌다.**

```
라인이 고정   4~6세 · 유럽풍 · 동물 주인공 · 단권 완결
시리즈가 고정 캐스트 · 무대 · 형(대발이형) · 캐릭터 규격 · 종이 · 🔴 그림체
시리즈마다   그림체가 통째로 바뀐다 — 그게 이 라인의 변주다
```

### 🔴 유일한 앵커가 되면 무대를 다 덮어야 한다

넷이었을 땐 A가 비탈 풀밭만 그리면 됐다. 하나가 되면 **산장 안·산길·개울·마을 광장**까지 같은 매체와
같은 두 색으로 그려야 한다. 그래서 **매체 하나 · 팔레트 하나 · 무대별 조항 넷** 구조로 다시 썼다 —
조항은 「그 무대에서 두 색을 어디에 쓰고 무엇을 종이로 남기나」만 정하고, 매체와 색은 안 건드린다.

버린 매체 셋(크레용·과슈·숯)은 **§4 에 보류**해 뒀다. 다른 시리즈에서 통째로 쓰면 된다.

---

## §1. 앵커 — `mei-pencilslope`

```
STYLE ANCHOR - mei-pencilslope   (Mei's mountain village / coloured pencil on toothy paper)

Style: coloured pencil on warm grey toothy paper, exactly TWO pencils, 4-6 year old picture book.
  Every area is built from parallel strokes laid in ONE direction, and the tooth of the paper breaks
  every stroke so no area is ever solid. Where the two pencils cross-hatch, a third darker colour
  appears - that is the only dark. Unlaid paper is not white space, it is the sky and the light.
  SHADING IS ZERO - no blending, no smudging, no gradient, no highlight.
  🔴 A CAST SHADOW IS NOT SHADING AND IS NOT BANNED. It is ONE field of CROSS-HATCH strokes lying on
  the ground, its edge made the way every edge here is made - by the stroke direction changing - and
  it is flat all the way through. 🔴 ITS LENGTH IS A CLOCK and three pages use it that way: volume 20
  reads "the sun is lower than yesterday" off a shadow reaching the front of the frame, volume 15 off
  one crossing the slope, volume 03 off one laid across the square. What is forbidden is a shadow that
  softens, grades or darkens the field under it - never a tone, always a field.

RENDERING (finish hierarchy): an area is ONE field of strokes all running one way, never denser or
  lighter inside itself. Stroke direction NEVER changes inside one area - it changes only where one
  thing ends and another begins, and THAT CHANGE OF DIRECTION IS THE EDGE. A thing sitting on that
  field is drawn with a harder point so its outline is one continuous line. FINISHED THINGS PER PAGE
  = 2, the child the page is about and the one thing that child touches; everything else is a shape
  with no interior detail. 🔴 WHEN A PAGE COUNTS A SET OF FIVE, THE FIVE COUNT AS ONE FINISHED THING -
  drawn identically at one detail level, one size and one depth, so that the odd one out is the only
  difference in the row - and the child is the other finished thing. Nothing else on that page gets
  interior detail. (Fourteen books of this series end on a row of five: sledges, stepping stones,
  cloths, furrows, sheets of paper, stakes, white loaves, bowls, wall pegs, quilts, bells, corn,
  apples, footprints. Finishing only one of the five kills the comparison, which is the book.)
  🔴 EVERY VOLUME MEASURES SOMETHING, AND THE MEASURE AND THE MEASURED LIE SIDE BY SIDE. Six volumes
  invented this separately, so it is the grammar of the series: a spoon stood against an empty jar ·
  a grown-up's leg wading to the ankle and then two scratched lines on a rock at ankle and at knee ·
  six grains on the floor going to none · two ear holes in a hat facing two ears · six paw prints
  along a log · the gap between one footprint and the next. 🔴 THEY ARE DRAWN AT ONE DEPTH, AT ONE
  SCALE AND ON ONE LINE, both of them finished things, and the ruler is never cropped out of the page
  it rules. 🔴 WHEN THE MEASURE IS A COUNT OR A GAP, THE THINGS COUNTED STAY EXACTLY THE SAME SIZE
  and only their number or the space between them changes - a ruler that also changes size measures
  nothing. 🔴 A GROWN-UP'S BODY USED AS THE RULER IS DRAWN IN THE SAME POSE AS THE CHILD'S BESIDE IT.
  Repeats are capped and the cap is the whole design: trees at most 5,
  flowers at most 9 dots, windows at most 8, crowd at most 7 silhouettes with 0 faces and 0 hands,
  planks at most 6, jars at most 6, steam at most 5 curls, stars at most 14 separate paper holes.
  Nothing in a repeat is a mirrored copy of its neighbour. DENSITY RATION = none.

PALETTE: PAPER WARM GREY #EDE9E1, sky, snow, plaster, light, everything not stroked · PENCIL1 MOSS
  #6E7A5E, grass, water, shutters, cloth, painted things - the cool one · PENCIL2 EARTH #8A7358,
  wood, stone, floors, roofs, baskets, ground - the warm one · CROSS-HATCH PEAT #40483A, animal
  backs, tree trunks, iron, night, anything in shade - this is never a third pencil, only the two
  crossed · ACCENT ORANGE #D4622A, 🔴 nothing but the one small orange thing each child carries.
  🔴 THE ORANGE THING MAY LEAVE ITS OWNER - hung on a wall peg, torn in two, set down, taken off - and
  while it is off the child it is still that child's marker and still the same orange. THE TOTAL
  AMOUNT OF ORANGE IN A FRAME DOES NOT CHANGE WHEN IT MOVES: volume 31 hangs five of them on five
  pegs and all five are in the picture; volume 38 cuts one and the cut piece becomes the darkest
  orange on the page; volume 10 ties a bell onto one. It is never given to anybody else and never
  duplicated.
  No sky blue, no purple, no pink, no white pencil anywhere ever.
  🔴 WHEN THE STORY NAMES A COLOUR THESE TWO PENCILS HAVE NOT GOT, IT IS DRAWN AS A SHAPE, AN EDGE OR
  A DEPTH OF CROSS-HATCH - never as a third pencil, never as a heavier press of one of the two, and
  never by leaving the orange to stand in for it. Four volumes have already reached the same answer
  and it is the rule: two kinds of berry are told apart by THE EDGE OF THEIR LEAVES, toothed against
  smooth · a roast chestnut is told from a raw one by WHAT IS LEFT UNSTROKED, shell laid, kernel bare
  · a hot face and a wept face are MORE STROKES CROSSED INTO THE EYE KNOT, nothing else · a cold nose
  and a reddened eye are the same. 🔴 WHERE TWO THINGS DIFFER ONLY BY COLOUR IN THE TEXT THEY DIFFER
  BY SIZE, BY PLACE IN THE ROW OR BY EDGE ON THE PAGE - the reddest apple is the topmost and the
  biggest - and the sheet for that thing fixes which before the page is drawn.

STAGE CLAUSES (the stage changes what the two pencils do, never which two they are):
  SLOPE - the hillside is ONE field of MOSS running downhill, 0 individual blades. Fences and
    sledges are EARTH. Far peaks are at most 4 EARTH outlines with 0 texture.
  CHALET - rooms are built from ONE repeated mark per surface: floor a plank stroke, wall a short
    dash, cloth a zigzag. The mark is the SAME shape every time and may run off an edge but is never
    redrawn. Beams and furniture are EARTH, cloth and shutters are MOSS. 🔴 FIRELIGHT AND LAMPLIGHT
    ARE BARE PAPER and are the brightest thing on the page. A thing being looked for is drawn with
    its own outline while everything it hides among is the repeated mark - that is how the eye finds it.
    🔴 WHEN TWO UNSTROKED AREAS SHARE ONE FRAME the smaller one is the fire or the lamp and the larger
    one is the window or the snow beyond it; they are the same bare paper and neither is brightened to
    beat the other. THE PAGE'S SUBJECT IS WHICHEVER THE CHILD IS FACING, and it is told by the body,
    never by making one of the two lighter. (Volume 45 puts a stove and a window in one frame and the
    child looks only at the window; volume 30 has a single lit window in a whole rainy page.)
  BROOK - water is ONE field of MOSS running across the page, 0 ripples, 0 glints. A thing in the
    water is CROSS-HATCH lying inside that field, hard edge, never distorted or mirrored. A thing on
    the water sits on top with its whole outline showing. Rocks and logs are EARTH with the strokes
    running along the thing, not across it. The path is bare PAPER.
  SQUARE - the ground is ONE field of EARTH; roofs and the bell tower are EARTH too but drawn with
    an outline, and shutters are MOSS. Depth in a crowd is made by figures standing CLOSER TOGETHER,
    never darker.
  🔴 PATH (wherever the SCENE stage is Path) - the path is ONE strip of bare PAPER running through
    whatever field it crosses, and it stays bare however far it goes. 🔴 ITS WIDTH IS THE ONLY THING
    THAT TELLS TWO PATHS APART - a short steep one is narrow enough for one body, a long winding one
    is twice that - so width is never varied for effect. Stone walls, roofs and gateposts beside it
    are EARTH THINGS with one outline each; the ground either side is a FIELD with no outline.
    Farther along, the path does not narrow to a vanishing point and does not get paler; it simply
    leaves the frame or stops at a roof.
  🔴 SNOW (wherever the SCENE says the ground is snow) - the slope, path or square is not stroked at
    all, it is bare PAPER from edge to edge, and the two pencils draw ONLY what stands on it. A dip in
    the snow gets at most 3 EARTH strokes along its lower lip and nothing else.
  🔴 FOREST (wherever the SCENE stage is Wood) - EARTH draws the trunks, one flat stroke per trunk, at
    most 9, all vertical; MOSS becomes the shade between them as ONE horizontal field behind. The path
    stays bare PAPER. Deeper in the wood the trunks stand CLOSER TOGETHER, never darker - that spacing
    is the only depth.

CHARACTER DESIGN LANGUAGE: animals are built from the same strokes as the world - two or three shapes
  with limbs laid over. GRADE: bipedal, standing upright, wearing cloth. Backs and heads are
  CROSS-HATCH, chests and bellies are EARTH.
  🔴 EACH CHILD HAS ONE BODY PART PUSHED WELL PAST NATURAL SIZE, AND THAT PART IS THE CHARACTER. The
  exaggerated part carries about half the mass of that child's silhouette, takes the densest pencil
  work on the figure, and is never cropped away, never hidden behind anything and never smaller than
  that child's own head. The rest of the body stays ordinary.
  Faces stay small. An eye is TWO OR THREE SHORT PENCIL
  STROKES LAID ACROSS EACH OTHER into a small dark knot, never a printed dot: more strokes make the
  knot bigger and darker when a child is startled, and one flat stroke laid alone means the eye is
  shut. A small nose; the mouth is ONE curve; above each eye ONE short stroke. Feeling is in the
  mouth curve and the two brow strokes. 🔴 NO EYE IS EVER BIGGER THAN ITS OWNER'S EXAGGERATED PART.
  THE FIVE, separable at thumbnail size by that part alone: MEI a white goat kid, TWO LONG SOFT EARS
  HANGING WELL PAST HER JAW, two short horns above them, an ORANGE scarf, the
  smallest standing figure · RUDI a squirrel, ONE TAIL WIDER THAN HIS WHOLE BODY curled up behind, an apron with an ORANGE
  pocket · PPINO a rabbit, TWO EARS AS TALL AGAIN AS HE IS standing straight up, the tallest child, ORANGE boots · SOSO a
  hedgehog, A BACK OF SPINES TWICE AS WIDE AS HE IS TALL, an ORANGE ribbon · LEO a fox, A MUZZLE AS LONG AS THE REST OF HIS SKULL and one
  straight tail as long as he is tall, an ORANGE collar. GRANDMOTHER BEAR is twice any child's height, entirely
  rounded, no orange anywhere, and she is only ever shown doing the same task the children are doing.
  🔴 GUESTS ARE NOT THE FIVE AND NOT THE GRANDMOTHER. Where the script brings an animal from outside
  the village - the marmot of volume 34, the postman badger of volume 28, the grandmother's baby bear,
  the dog behind the wall - it carries NO ORANGE, it is given NO EXAGGERATED PART (that language
  belongs to the five and would make a guest read as one of them), and it never joins their group
  silhouette. A guest on four feet stays on four feet and wears nothing. 🔴 A GUEST MAY HAVE AN
  ERRAND OF ITS OWN - the badger is walking somewhere the children are not - and that is the one thing
  the grandmother never has. 🔴 A GUEST BUILT LIKE THE GRANDMOTHER IS BUILT SMALLER, NOT DIFFERENTLY:
  the baby bear is the grandmother's shape reduced - entirely rounded, no exaggerated part, no orange
  - and he is HALF A CHILD'S HEIGHT, which is the one measurement that keeps him from reading as her
  at a distance. 🔴 A GUEST WHO COMES BACK IN A LATER VOLUME IS THE SAME FIGURE AT THE SAME SIZE, and
  the volume that brings him back does not re-specify him; the spec is here and there is one of it.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow, 3D render or soft feathered edge / no blended or smudged pencil /
  no solid unbroken colour / no white pencil.
```

**관통 줄** (매 쪽)

```
WARM:  the warm grey paper is the light - never lay colour where light belongs
FIVE:  each child has one small ORANGE thing - on the body, or hung, set down or torn, but in frame
GROWN: the bear is the only adult of this village and she never has an errand of her own
```

🔴 **`FIVE:` 와 `GROWN:` 을 실제로 셌다 (2026-09-04).**
「**always visible**」이 **13쪽에서 거짓**이다 — 주황이 아이 몸을 떠나는 쪽이다(38권은 리본을 **끊고**,
31권은 다섯을 **벽 못에 걸고**, 10권은 목도리 끝에 종을 **새로 매단다**). 「몸에 달려 있다」로 읽히면
화가가 **31권 p9 의 못 다섯을 빈 못으로 그리고 아이 목에 리본을 다시 그린다** — 그 권의 그림이 죽는다.
→ 팔레트에 「떠나도 된다, 다만 화면 안 주황의 총량은 안 변한다」를 넣었다.
「**the bear is the only adult**」은 **28권 일곱 쪽에서 거짓**이다 — 배낭을 진 오소리가 편지를 들고
비탈을 올라온다. 그는 어른이고 **제 볼일로 간다.** 게스트(마멋·오소리·아기 곰·개)는 다섯의 규격도
할머니의 규격도 안 받으므로 캐릭터 문단에 게스트 조항을 넣고, 이 줄은 「이 마을의 유일한 어른」으로 좁혔다.

🔴 **주황은 인물이 아니라 무리를 가리킨다.** 시리즈 01은 주인공 하나에 붉은 목끈이었지만 02는 주인공이
권마다 바뀐다. 누가 주인공이든 화면에 주황이 있고, 다섯이 모이면 한 무리로 읽힌다.

🔴 **눈썹 한 획은 일부러 넣었다.** 페파형(01)은 웃음이 전부라 입 곡선만으로 됐지만, **대발이형은
속상함·부끄러움·화가 사건의 절반**이라 입만으로는 모자란다. 여전히 눈 크기는 안 변한다.
**그림체가 이야기를 제약하면 고를 것을 잘못 고른 것이다.**

---

## §2. 캐스트 시트

한 장에 여섯을 다 그린다. 🔴 **시트가 최종 그림을 지배**하므로 시트를 먼저 확정하고 쪽 삽화로 간다.
기획서 §2 카드마다 **한 명씩 뽑는 프롬프트**도 있다(반복 생성용) — 여섯을 한 장에 그리려면 아래를 쓴다.

```
CHARACTER SHEET - mei village   (six characters, one sheet)

[여기에 §1 의 Style / PALETTE / CHARACTER DESIGN LANGUAGE 세 문단을 그대로 붙인다]

SHEET LAYOUT: one warm grey sheet, six characters standing in a row on a single ground line, all at
  their true relative heights - Grandmother Bear twice any child, Ppino the tallest child, Mei the
  smallest. Each character is drawn THREE times: front standing, three-quarter walking, and back.
  Nothing else on the sheet - no props, no scenery, no ground beyond the one line.
🔴 No lettering, numerals, labels or name tags anywhere on the sheet.
```

🔴 시트가 나오면 기획서 §2 카드에 붙여넣는다(R2 `comic-assets/mei-plan`, 키 = 캐릭터 key).
회차 페이지의 「🎬 이 화 등장」 스트립이 그 이미지를 읽어 온다.

---

## §3. 보류 — 다른 시리즈용 매체 셋

한 시리즈 = 한 그림체로 접으면서 **버리지 않고 남긴다.** 셋 다 완성된 문안이라 다음 시리즈에서
캐스트·무대만 갈아 끼우면 바로 쓴다. 공정 골격(종이가 빛 · 두 색 · 겹침이 셋째 색 · 악센트 하나)은 같다.

| 매체 | 슬러그 | 성질 | 어울리는 무대 |
|---|---|---|---|
| 크레용 | `mei-crayonchalet` | 종이 결의 높은 데만 걸려 끊긴 밀랍 면 · 덮임 80% | 실내 · 불빛이 주인공인 이야기 |
| 과슈 | `mei-gouachebrook` | 납작 붓 자국이 윤곽에 못 미쳐 맨 종이 테가 남음 | 물 · 안개 · 바깥 |
| 숯 | `mei-charcoalsquare` | 문질러 편 결 + **지우개로 빼낸 빛** · 흰 것을 절대 안 그림 | 밤 · 군중 · 눈 |

원문은 git 이력에 있다(`docs/art-direction/mei-anchor.md`, 2026-08-13 이전).
🔴 다음 시리즈에서 꺼낼 때 **슬러그의 `mei-` 를 그 시리즈 이름으로 바꿀 것** — 안 바꾸면 두 시리즈가
같은 앵커 이름을 쓰게 된다.
