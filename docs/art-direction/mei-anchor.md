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
  SHADING IS ZERO - no blending, no smudging, no gradient, no cast shadow, no highlight.

RENDERING (finish hierarchy): an area is ONE field of strokes all running one way, never denser or
  lighter inside itself. Stroke direction NEVER changes inside one area - it changes only where one
  thing ends and another begins, and THAT CHANGE OF DIRECTION IS THE EDGE. A thing sitting on that
  field is drawn with a harder point so its outline is one continuous line. FINISHED THINGS PER PAGE
  = 2, the child the page is about and the one thing that child touches; everything else is a shape
  with no interior detail. Repeats are capped and the cap is the whole design: trees at most 5,
  flowers at most 9 dots, windows at most 8, crowd at most 7 silhouettes with 0 faces and 0 hands,
  planks at most 6, jars at most 6, steam at most 5 curls, stars at most 14 separate paper holes.
  Nothing in a repeat is a mirrored copy of its neighbour. DENSITY RATION = none.

PALETTE: PAPER WARM GREY #EDE9E1, sky, snow, plaster, light, everything not stroked · PENCIL1 MOSS
  #6E7A5E, grass, water, shutters, cloth, painted things - the cool one · PENCIL2 EARTH #8A7358,
  wood, stone, floors, roofs, baskets, ground - the warm one · CROSS-HATCH PEAT #40483A, animal
  backs, tree trunks, iron, night, anything in shade - this is never a third pencil, only the two
  crossed · ACCENT ORANGE #D4622A, 🔴 nothing but the one small orange thing each child carries.
  No sky blue, no purple, no pink, no white pencil anywhere ever.

STAGE CLAUSES (the stage changes what the two pencils do, never which two they are):
  SLOPE - the hillside is ONE field of MOSS running downhill, 0 individual blades. Fences and
    sledges are EARTH. Far peaks are at most 4 EARTH outlines with 0 texture.
  CHALET - rooms are built from ONE repeated mark per surface: floor a plank stroke, wall a short
    dash, cloth a zigzag. The mark is the SAME shape every time and may run off an edge but is never
    redrawn. Beams and furniture are EARTH, cloth and shutters are MOSS. 🔴 FIRELIGHT AND LAMPLIGHT
    ARE BARE PAPER and are the brightest thing on the page. A thing being looked for is drawn with
    its own outline while everything it hides among is the repeated mark - that is how the eye finds it.
  BROOK - water is ONE field of MOSS running across the page, 0 ripples, 0 glints. A thing in the
    water is CROSS-HATCH lying inside that field, hard edge, never distorted or mirrored. A thing on
    the water sits on top with its whole outline showing. Rocks and logs are EARTH with the strokes
    running along the thing, not across it. The path is bare PAPER.
  SQUARE - the ground is ONE field of EARTH; roofs and the bell tower are EARTH too but drawn with
    an outline, and shutters are MOSS. Depth in a crowd is made by figures standing CLOSER TOGETHER,
    never darker.
  🔴 SNOW (volumes 01, 13, 16) - the slope or square is not stroked at all, it is bare PAPER from
    edge to edge, and the two pencils draw ONLY what stands on it. A dip in the snow gets at most 3
    EARTH strokes along its lower lip and nothing else.
  🔴 FOREST (volume 04) - EARTH draws the trunks, one flat stroke per trunk, at most 9, all vertical;
    MOSS becomes the shade between them as ONE horizontal field behind. The path stays bare PAPER.
    Deeper in the wood the trunks stand CLOSER TOGETHER, never darker - that spacing is the only depth.

CHARACTER DESIGN LANGUAGE: animals are built from the same strokes as the world - two or three shapes
  with limbs laid over. GRADE: bipedal, standing upright, wearing cloth. Backs and heads are
  CROSS-HATCH, chests and bellies are EARTH. Eyes are two solid dark dots set wide apart; a small
  dark nose; the mouth is ONE curve; above each eye ONE short eyebrow stroke. 🔴 FEELING IS CARRIED
  BY THE MOUTH CURVE AND THE TWO EYEBROW STROKES - the eyes only ever open or close and their size
  NEVER changes. The face is never crossed by an object. Whole-body posture carries the rest.
  THE FIVE, separable at thumbnail size: MEI a white goat kid, two short horns, an ORANGE scarf, the
  smallest standing figure · RUDI a squirrel, one huge tail curled up behind, an apron with an ORANGE
  pocket · PPINO a rabbit, two long ears straight up, the tallest child, ORANGE boots · SOSO a
  hedgehog, a low round back of short spines, an ORANGE ribbon · LEO a fox, pointed muzzle and one
  long straight tail, an ORANGE collar. GRANDMOTHER BEAR is twice any child's height, entirely
  rounded, no orange anywhere, and she is only ever shown doing the same task the children are doing.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow or 3D render / no blended or smudged pencil / no soft or feathered
  edge / no solid unbroken colour / no third pigment that is not a cross-hatch / no white pencil.
```

**관통 줄** (매 쪽)

```
WARM:  the warm grey paper is the light - never lay colour where light belongs
FIVE:  each child carries one small ORANGE thing and it is always visible
GROWN: the bear is the only adult and she never has an errand of her own
```

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
