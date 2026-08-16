# 도도네 물방앗간 — 앵커 + 캐스트 시트

> 창작동화 **시리즈 04** (25권 · 250쪽). 설계 SSOT = `docs/changjak-books/dodo/_design.md` ·
> 대본 = `docs/changjak-books/dodo/*.md` · SCENE = `_scenes.json`
> 🔴 **이미지 생성은 여기서 하지 않는다.** 프롬프트까지가 이 문서의 일이다.
> 🔴 **한 시리즈 = 한 그림체.** 이 시리즈는 **과슈(gouache) 전권** — `mei-anchor.md` §3 보류분
> `mei-gouachebrook` 을 가져와 캐스트·무대를 갈아 끼운 것이다. 슬러그 = `dodo-gouachemill`.

---

## §0. 설계 — 왜 과슈인가

**물이 매권 나온다.** 25권 중 개울·웅덩이·도랑·비·눈·안개가 안 나오는 권이 거의 없다.
그래서 「젖은 것」을 그리는 매체(수채)가 아니라 **「튀는 것」을 얹는 매체**를 골랐다.

과슈만 할 수 있는 일이 하나 있다 — **칠한 색 위에 종이색을 도로 얹는 것**이다. 수채는 못 하고,
색연필·크레용도 못 하고, 인쇄 공정 셋(실크스크린·활판·리노컷)도 못 한다. 판을 겹치면 어두워질
뿐이다. 그런데 이 시리즈의 웃음은 대개 **위로 튀어 오른다** — 도도가 풍덩(01), 물기둥(14),
반죽이 튀어(10), 물벼락, 밀가루, 눈, 안개. 그 흰 점들은 종이가 아니라 **초록 물 위에** 있어야 한다.
그래서 앵커에 `CHALK` 조항을 뒀다. 🔴 **CHALK 는 다섯째 색이 아니라 「튜브에 든 종이색」**이라,
「칠하지 않은 종이가 빛」이라는 이 라인의 골격을 하나도 깨지 않는다.

그 대신 과슈의 다른 성질 하나로 화면 전체를 통제한다 — **납작 붓 자국이 윤곽에 못 미쳐
맨 종이 테가 남는다.** 선을 안 긋고 **종이가 가장자리를 그린다.** 250쪽에 윤곽선이 하나도 없다.

### 🔴 팔레트를 초록 들판이 아니라 밀빛으로 짠 이유

설계서(`_design.md` §4)는 「들판 초록 + 흙·자루 갈색」을 제안했다. **바꿨다.**
바로 다음 시리즈 05(브루노네 숲)가 **숲 초록 + 나무껍질 갈색**이고, 둘 다 파란 시그니처를 쓴다.
04·05 가 서가에 나란히 서는데 초록+갈색+파랑이 겹치면 **두 권이 한 책장으로 읽힌다.**

그래서 04 는 **개울 청록 + 밀빛 황토**로 옮겼다. 무대가 방앗간이라 오히려 이쪽이 맞다 —
들판은 밀밭이니 황토가 정답이고, 초록은 개울·버드나무·덧문에만 남는다.
🔴 개울이 청록이라 **순청색은 남매의 두 물건에만** 쓴다는 설계서 조항이 더 세게 지켜진다.

---

## §1. 앵커 — `dodo-gouachemill`

```
STYLE ANCHOR - dodo-gouachemill   (a duck family at a French watermill / gouache, the brush stops short)

Style: gouache on warm flour-cream paper, exactly TWO colours, 4-6 year old picture book. Every area
  is laid with a flat brush in visible strokes that STOP SHORT of the outline, so a rim of bare paper
  is left around most shapes and THE PAPER DRAWS THE EDGE INSTEAD OF A LINE - there is no outline
  anywhere in this book. The paint is opaque and matte and is never thinned to a wash. Where the two
  colours overlap wet, a third darker colour appears - that is the only dark. Unpainted paper is not
  white space, it is the sky, the flour and the light. SHADING IS ZERO - no modelling, no gradient,
  no cast shadow, no highlight.

RENDERING (finish hierarchy): an area is ONE sweep of ONE colour, never lighter or darker inside
  itself; the only variation is where one brush stroke ends and the next begins. FINISHED THINGS PER
  PAGE = 2, the duckling the page is about and the one thing that duckling touches; everything else
  is a shape with no interior detail. Repeats are capped and the cap is the whole design: the water
  wheel has at most 8 paddles · stepping stones at most 7 · trees at most 5 · reeds at most 7 strokes
  · windows at most 8 · planks at most 6 · sacks at most 6 · flowers at most 9 · straw at most 11
  strokes · steam at most 5 curls · a crowd at most 7 silhouettes with 0 faces and 0 hands · stars at
  most 14 bare paper points. Nothing in a repeat is a mirrored copy of its neighbour.
  DENSITY RATION = none.
  🔴 CHALK - gouache can lay the paper colour back ON TOP of paint, and that is the one thing this
  medium can do that no other can. CHALK IS NOT A FIFTH COLOUR, IT IS PAPER IN A TUBE. It is used
  ONLY for what is thrown UP off a coloured field: splash, spray, flour dust, falling snow, mist over
  water. At most 9 separate CHALK marks per page, each one single opaque stroke with a hard edge. It
  is never a highlight on a form, never an outline, never blended, and never laid on bare paper.

PALETTE: PAPER FLOUR CREAM #F5EFDF, sky, flour, mist, light, everything not painted · COLOUR1
  MILLPOND #4E7D77, the stream, the pond, reeds, willow, shutters, doors, aprons, anything painted -
  the cool one · COLOUR2 WHEAT #B08A50, the wheel, timber, planks, sacks, straw, the field, the
  ground, roofs, bills and webbed feet - the warm one · OVERLAP SILT #3D4A44, duck backs and heads,
  iron, the inside of the mill, night sky, anything under water - overlap only, never a third tube ·
  ACCENT RIBBON BLUE #2D62B8, 🔴 painted last, touching nothing but Dodo's head ribbon and Mumu's
  neckerchief. 🔴 THE WATER IS NEVER BLUE - it is MILLPOND. No sky blue, no purple, no pink, no
  green other than MILLPOND, and no white pigment that is not CHALK.

STAGE CLAUSES (the stage changes what the two colours do, never which two they are):
  MILL - each surface is ONE repeated stroke: floor a plank stroke, wall a short dash, sacking a
    zigzag. The stroke is the SAME shape every time and may run off an edge but is never redrawn.
    Beams, sacks and the hopper are WHEAT; doors, shutters and aprons are MILLPOND. 🔴 THE OVEN
    MOUTH AND THE WINDOW LIGHT ARE BARE PAPER and are the brightest thing on the page. Flour on the
    air is CHALK; flour settled on a surface is bare paper left unpainted. A thing being looked for
    is painted with its own clear silhouette while everything it hides among is the repeated stroke.
  STREAM - water is ONE horizontal sweep of MILLPOND, 0 ripples, 0 glints, 0 foam lines. A thing IN
    the water is OVERLAP lying inside that sweep, hard edge, never distorted. A thing ON the water
    sits on top with its whole shape showing. 🔴 NOTHING IS EVER MIRRORED IN THE WATER - there are
    no reflections in this book. Stones, logs and banks are WHEAT with the stroke running ALONG the
    thing, not across it. The path is bare PAPER.
  YARD - the ground is ONE sweep of WHEAT; the mill house, the wheel, the cart and the straw stack
    are WHEAT too, and only shutters, door and washing line are MILLPOND. Depth between things is
    made by putting them CLOSER TOGETHER, never darker.
  FIELD - the field is ONE sweep of WHEAT running to a flat horizon, 0 furrows picked out. Willow,
    hedge and berry bushes are MILLPOND, at most 5 of them. Sunflowers are WHEAT discs on MILLPOND
    stems, at most 9.
  🔴 MIST (volume 12) - everything but the nearest thing is bare PAPER. Things enter the page by
    appearing at FULL strength, never by fading, and there is no pale version of any colour.
  🔴 NIGHT (volumes 09, 19, 25) - the sky is OVERLAP laid as one flat sweep. Stars, fireflies, the
    moon and the moon lying on the pond are BARE PAPER points, each cut on its own, at most 14. A
    lantern is bare paper and it carries the whole page.
  🔴 SNOW (volumes 08, 23) - the yard and the field are not painted at all, bare PAPER from edge to
    edge, and the two colours paint ONLY what stands on it. A mound of snow gets at most 3 WHEAT
    strokes along its lower lip and nothing else. Falling snow is CHALK, but only where it crosses a
    painted area. Icicles are bare paper with one MILLPOND stroke down one side.

CHARACTER DESIGN LANGUAGE: ducks are built from the same flat sweeps as the world - two or three
  shapes with limbs laid over. GRADE: bipedal, standing upright. 🔴 THEY HAVE WINGS, NOT ARMS - no
  hands, no fingers, no sleeves, no cuffs. A duck holds a thing by pinching it between the edge of
  one wing and its body, or carries it in both wings against its chest. 🔴 FEET ARE WEBBED DUCK
  FEET, always bare, never in shoes. 🔴 THE ONLY CLOTH IN THIS WORLD IS FOUR THINGS: a head ribbon,
  a neckerchief, an apron and a straw hat. Nobody wears anything else, ever. Backs and heads are
  OVERLAP; chests and bellies are WHEAT; bills and webbed feet are WHEAT.
  🔴 THE ANATOMY STAYS TRUE AND THE POSE DOES THE COMEDY. A duck is built the way a duck really is -
  neck out of the front of the body, legs set far back under it, tail a stub, bill a flat blade
  hinged at the skull - and not one of those is ever bent to make a figure cuter or more human. The
  laugh comes from putting that correct body into a posture a duck would never hold: hanging upside
  down from a beam, sitting right back on the tail with both webbed feet in the air, lying out on its
  front with the neck stretched along the ground. 🔴 NEVER DISTORT THE BODY TO GET A JOKE - change
  only what it is doing.
  🔴 THE EYES SIT ON THE SIDES OF THE HEAD, where a duck's are. In three-quarter view ONE eye is whole
  and the far one is a sliver cut short by the curve of the skull; in profile there is ONE eye and no
  second one. Each eye is a dark almond, not a dot. The mouth is the line where the bill closes, the
  bill angle carries the feeling, and above each eye ONE short stroke. An eye opens or closes and
  never changes size.
  THE FOUR, separable at thumbnail size: MUMU the younger brother, the smallest standing figure, a
  BLUE neckerchief, feet always planted flat · DODO the elder sister, half a head taller than Mumu
  and always the one in motion, a BLUE head ribbon · MOMMY a full head taller than Dodo, a cream
  apron and flour dusted on her wing feathers, no blue · DADDY the tallest and widest, a straw hat,
  no blue. Adults never carry blue and never wear the other two children's cloth.
  🔴 DODO IS NEVER DRAWN MEAN. She is wrong on 25 pages out of 25 and she must be lovable on every
  one of them: when she is wrong her WHOLE BODY is the joke - feet up, wings flung wide, bill open,
  eyes shut in her own laugh. Never a sneer, never a narrowed eye, never crossed wings, never a wing
  pointed at Mumu, never standing over him. And 🔴 MUMU NEVER SMIRKS AT HER - when she fails he is
  looking at the task, not at her.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - sacks, doors and the
  height post in volume 21 stay blank or carry a single scratched line.

NOT: no airbrush, gradient, glow, 3D render or soft feathered edge / no watercolour wash, bleed or
  transparency / no outline of any kind / no hands, fingers or sleeves on a duck.
```

**관통 줄** (매 쪽)

```
DRY:    the unpainted paper is the light - flour, mist and sky are paper, never painted
BLUE:   the only pure blue in the world is Dodo's ribbon and Mumu's neckerchief
WINGS:  ducks have wings and webbed feet - no hands, no fingers, no sleeves
LOVE:   when Dodo is wrong her whole body is the joke - never a sneer, never a pointed wing
```

🔴 **`LOVE:` 를 관통 줄에 올린 이유.** 설계서가 이 시리즈의 유일한 위험으로 「도도를 미워하게
만드는 것」을 꼽았는데, 그림에서 그 사고는 **글이 아니라 자세로** 난다 — 팔짱, 내려다보기,
눈꼬리, 손가락질. 25권 중 25권에서 도도가 틀리므로 그 자세가 한 번만 새도 캐릭터가 굳는다.
쪽별 프롬프트로 뽑을 때 **도도가 나오는 쪽마다 반복**해야 한다(p1 에만 적으면 안 따라간다).

🔴 **`WINGS:` 도 같은 이유다.** 「소매를 걷었어요」를 금지한 것이 본문 규칙인데, 그림에서는
모델이 학습한 「옷 입은 동물」이 **손을 자동으로 그린다.** 앵커의 NOT 만으로는 모자라서 관통 줄에 올렸다.

---

## §2. 캐스트 시트

한 장에 넷을 다 그린다. 🔴 **시트가 최종 그림을 지배**하므로 시트를 먼저 확정하고 쪽 삽화로 간다.

```
CHARACTER SHEET - dodo mill   (four characters, one sheet)

[여기에 §1 의 Style / PALETTE / CHARACTER DESIGN LANGUAGE 세 문단을 그대로 붙인다]

SHEET LAYOUT: one flour-cream sheet, four ducks standing in a row on a single ground line, all at
  their true relative heights - Daddy the tallest and widest, Mommy a full head over Dodo, Dodo half
  a head over Mumu, Mumu the smallest. Each character is drawn THREE times: front standing,
  three-quarter walking, and back. 🔴 In every one of the twelve drawings the wings are visible and
  empty - no character holds anything, so that the wing shape is fixed before any prop exists.
  Nothing else on the sheet - no props, no scenery, no ground beyond the one line.
🔴 No lettering, numerals, labels or name tags anywhere on the sheet.
```

🔴 시트가 나오면 기획서 §2 카드에 붙여넣는다(R2 `comic-assets/dodo-plan`, 키 = 캐릭터 key).
회차 페이지의 「🎬 이 화 등장」 스트립이 그 이미지를 읽어 온다.

🔴 **`dodo-core.js` 의 STYLE 도 이 앵커와 같이 고친다** — 시리즈 01 이 앵커 넷을 민팅한 뒤에도
core 가 폐기한 스타일을 붙이고 있었다(2026-08-13 발견). 앵커 문서와 core 는 **양쪽 다** 고친다.
