# 창작동화 「누가 웅덩이를 비웠지?」 — 그림체 배정 + 스타일 앵커

- **권**: `who-emptied-the-pool` (10쪽 · 4~6세 · 주제군 **C 자연·동물** · 엔진 **오해와 반전** · 무대 콘월 조수웅덩이)
- **작성**: 2026-07-30 · art-director
- **상태**: 🔶 프롬프트 완료 — 시트·앵커 렌더 대기(사용자 GPT 생성). 이미지 생성은 여기서 하지 않는다.

---

## 1. 배정 판정 — C6 「단색조 + 악센트 1」, **새 앵커** (`changjak-tidepool`)

한 줄: **회청-은빛 냉단색조 필드 + 유일한 빨강(늙은 불가사리) + 물감의 젖음/마름이 조수를 따라간다.**

### 왜 C6인가 (주제군 C의 1순위 C7을 엔진이 이긴다)

§7.3 표는 주제군 C의 1순위를 **C7 회화적 톤**으로 둔다. 하지만 §2.11이 못박았듯 배정은 `주제군 → 앵커`가 아니라 **`주제군 × 엔진 → 앵커`**다 — 주제군이 정서를, **엔진이 그림의 과업**을 정한다. 이 권의 과업은 두 가지이고 둘 다 C6의 정의다.

1. **값(value) 서사** — 물이 빠졌다(밝음→마름) 돌아온다(마름→밝음). 이 책에서 그림이 해야 할 가장 중요한 일은 「물이 나갔다가 왔다」를 **명도·채도의 흔들림**으로 읽히게 하는 것이다. §2.9의 교과서 — 단색조 필드의 **값이 곧 서사**다. C7(범용 회화)은 예쁜 바닷가 수채를 주지만 값 규율을 강제하지 않고 색을 화면 전체에 퍼뜨린다(§7.5 교차관찰 1: C7=가장 평범해지기 쉬움).
2. **유일한 악센트 = 발견 비트** — 회청·은빛 세상에서 **딱 하나의 빨강**(늙은 불가사리, p6)이라 발견의 순간 시선이 거기 먼저 닿는다. §2.9의 "그 권에서 변하는 것 하나가 악센트"를 대본가가 이미 심어 뒀다.

반전 엔진(p2 심음: 저 멀리 물러난 밝은 바다 선 → p6 회수)도 값 서사와 동형이다. 마른 갯벌이 넓을수록, 그 끝의 은빛 바다 선이 「범인은 없었다」를 말한다. → **A-11(누적 엔진)이 C3로 주제 기준선을 이긴 것과 같은 논리로, 이 권은 C6가 이긴다.**

### 왜 새 앵커인가 (A-01 재활용 불가)

기존 창작동화 C6 앵커는 A-01(냉회록 안개, **석판 크레용·오일 파스텔 = 마른 왁스 매체**)과 A-04(흑연+앰버). 둘 다 **마른 매체**다. 이 권의 정체성은 **물** — 젖은 워시가 필요하고, 마른 크레용으로 물을 그리면 물이 안 된다. §7.1이 "앵커 = 100~150개 × 팔레트·매체 변주, 앵커당 6~10권"이라 했으므로, **매체가 근본적으로 다르면(마른 왁스 vs 젖은 워시) 새 앵커**다. 팔레트도 A-01(냉회록+주홍)과 갈린다(해양 은청+올리브+브릭레드).

- §7.6 라인 내 중복 규칙: A-01·A-04는 주제군 A, 이 권은 주제군 C라 이웃 카드가 아니고, 매체·팔레트가 확연히 다르다(마른 안개 크레용 / 흑연+앰버 / **젖은 해양 워시**) → 나란히 놓여도 복사본으로 안 읽힌다.

### 🔴 점눈이(전래동화) 분리 확인 — 「빨강 1점」이 겹치는가?

겹치지 않는다. 점눈이의 빨강은 **매 화면 1점(즉석 발명 포함)의 스타일 규칙**이고, 이 권의 빨강은 **거의 p6 한 장의 서사 비트**다(대부분의 쪽 p1~p5·p7~p10엔 빨강이 없다 — 진짜 「악센트」는 물의 냉·온 값 흔들림). 게다가 나머지 세 축이 다 갈린다:

| 축 | 점눈이 | 이 앵커 |
|---|---|---|
| 종이 | 밝은 **크림**(=햇빛, 따뜻) | 냉**회청** 톤 그라운드 |
| 매체 | 느슨한 **색연필 낙서** | **잉크·과슈 워시**(젖음/마름) |
| 얼굴 | **점눈 2 + 실선 입** | 게의 **눈자루 위 그린 눈**(연기 가능) |
| 빨강 | **매 화면 1점**(발명 허용) | **한 장의 서사 비트**(불가사리) |

앵커 프롬프트가 이 넷을 못박아 분리를 강제한다.

---

## 2. 스타일 앵커 프롬프트 (영문 · GPT 이미지 생성용)

🔴 실명 없음 — 문구로 첫 렌더를 뽑고, 승인본을 ref로 고정해 자기참조로 전환한다(§3).
근거 문법: 광대한 여백 + 손톱만 한 인물 + 붓 워시 + 제한 팔레트(WIA 2025 태극 위너가 검증한 여백·붓 워시 문법을 해양 팔레트로 이식).

```
STYLE ANCHOR — changjak-tidepool (young crab / Cornish rock pool / misunderstanding)

Style: a hand-painted picture-book page for 4-6 year olds, cool and airy, quiet and un-slick.

MEDIUM: ink and gouache WASH on cool grey-toned paper, laid with a soft round brush.
  🔴 THE WETNESS OF THE PAINT TRACKS THE TIDE — this is the whole identity of the book:
    - WATER-PRESENT pages: worked wet-in-wet. Colour bleeds softly into damp paper,
      edges melt, washes pool and granulate. The world looks saturated and breathing.
    - WATER-GONE pages: dry-brush on the toothed paper. The brush skips on the ridges,
      colour sits thin and grainy, bare paper shows through, edges scratch and break.
      The page itself feels parched.
  Shapes are made by the wash running out or drying, never by a clean vector line.
  No digital airbrush, no smooth gradient, no glossy render.

PALETTE: a cool near-monochrome field dominates every page - silver-grey, wet blue-grey rock,
  and a muted olive-green (seaweed) as a minor recurring note. Cool paper shows through.
  🔴 EXACTLY ONE warm saturated colour exists in the whole book: a warm brick-red,
    and it belongs to the OLD STARFISH. It appears essentially on one page (the discovery);
    most pages carry NO red at all. Do NOT sprinkle red onto every page.
  🔴 The narrative colour is VALUE, not hue: water-present = brighter, more saturated
    blue-green; water-gone = pale, desaturated silver-grey. Let the page get visibly
    paler and drier as the water leaves, and brighter/wetter as it returns.
  Hex anchors: wet rock #6B7A80 / crevice #45535A / dry mudflat #C7C9C2 /
    water #4E8C8A / bright shallow #7FB6AE / seaweed #5B7A4E / paper #E4E5DF /
    starfish red #C43A2B (the only warm saturated shape).

MATERIAL TRANSLATION (🔴 keep it painted, never photographic or plastic):
  - WATER = translucent wash; the paper tooth shows through it; ripples = a few darker
    brush strokes on top. NOT a glassy mirror reflection, NOT an airbrushed gradient,
    NOT liquid-plastic shine.
  - WET ROCK = flat blue-grey gouache with a darker wash pooled in the crevices, matte.
    NOT a specular highlight, NOT a wet-plastic sheen.
  - SILVER MUDFLAT / DAMP SAND = a pale flat wash; the light on it IS the bare paper
    glowing through, not a painted shine. NOT metallic, NOT chrome, NOT mirror.
  - SEAWEED = a few translucent olive-green wash strokes that bleed at the tips.
    NOT every strand drawn.
  - THE RED STARFISH = the ONE opaque, fully-covered matte shape in a world of thin washes
    - it reads as the only solid, saturated thing on the page.

COMPOSITION: vast negative space first, subject second.
  The crab is tiny in frame (about 1/7 of the page height) except in the close pages
  (p1, p4, p9, p10) where it comes forward. On the wide pages the receding sea is a single
  bright silver line high in the frame, with a huge quiet mudflat beneath it.
  Diagonal lines lead the eye (the water's advancing front slides across the page in p8).
  🔴 Mirror the framing of the first pool page and the last pool page: same round pool,
    same overhead-ish angle - the only change on the last page is the crab turned to face
    the sea (out of frame right) and one claw raised in a wave.
  Never centre the crab in dead symmetry. Keep the bottom 18% quiet and free of key
  subject matter (a caption band sits there).

FINISH HIERARCHY: this is about how FINISHED each area is, not about opacity.
  The crab = finished (wash body + drawn eyes on stalks).
  Objects it touches (the near rock, a periwinkle it questions) = half-finished
  (contour and one wash pass).
  Everything else = the wash field itself, laid in a few brush passes and left alone -
  it is not blurry, not faded, not hazy; there is simply nothing drawn in it.
  🔴 Never draw every pebble, barnacle, seaweed strand or ripple. The empty mudflat is
  mostly bare paper with two or three flat wash passes.

CHARACTER DESIGN: eyes are DRAWN on two eye-stalks - small dark ovals that can point,
  cross, droop and light up, so the crab can act (eager, indignant, doubtful, joyful).
  NOT dot-eyes on the face. Two claws, eight legs, a round low carapace.
  The crab is a cool shore-crab grey-green (#6F7A66) so it stays inside the cool world
  and never competes with the red starfish. Silhouette = round shell + two raised claws
  + two eye-stalks, readable at thumbnail size.

SETTING: a Cornish rocky shore tide pool - blue-grey rock shelves and ledges, clusters
  of barnacles and periwinkles, strands of green weed, wet sand and a wide low mudflat,
  the distant sea. British/Atlantic coast, cool light. No tropical reef, no coral colour,
  no palm, no warm beach.

TIDE-STATE MAP (wet-in-wet vs dry-brush per spread):
  p1 WET (pool full) · p2 DRY (shock, first parched page) · p3-p5 DRY (searching, drier) ·
  p6 DRIEST + the one red starfish + far silver sea = revelation · p7 DRY (waiting, hot) ·
  p8 TRANSITION (the silver water-front sliding back in) · p9 WET (refilled) ·
  p10 WET (mirror of p1).

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT digital airbrush / NOT smooth gradients / NOT glossy 3D CG render /
  NOT cel-shaded anime / NOT a texture filter over flat digital colour / NOT photographic /
  NOT a glassy mirror water reflection / NOT wet-plastic sheen on rock /
  NOT metallic or chrome mudflat / NOT a fully rendered background /
  NOT every pebble, barnacle, ripple or seaweed strand drawn / NOT a uniform finish /
  NOT a second warm saturated accent beyond the one red starfish /
  NOT dot-eyes on a warm cream paper with a red thing on every page (that is another line) /
  NOT any lettering, numerals or signage anywhere in the image /
  NOT wool felt, NOT stitched fabric, NOT sculpted clay (those belong to other lines).
```

### 캐릭터 시트 (게) — 🔴 시트를 **먼저** 굽는다 (§2.4)

```
CHARACTER SHEET - LittleCrab  (bake this FIRST, before any scene)

FACE: no face on the shell. Two EYE-STALKS rise from the top of the carapace, each ending
  in a small dark oval eye (#2B2320) that can point, cross, droop or widen. A tiny mouth
  line with small bubbles when happy. The eye-stalks are the whole expression system -
  eager = stalks forward and tall / indignant = stalks pushed in close / doubtful = stalks
  splayed to different directions / joyful = stalks curved and bright / waiting = stalks
  level and still, aimed at the horizon.
BODY: cool shore-crab grey-green carapace #6F7A66, a shade warmer underside #8A8B72,
  darker joints #4E5548. Round low shell, wider than tall. Eight thin legs, two front claws
  a little oversized and expressive. Painted as flat wash with a darker wash pooled along
  the shell edge - matte, no plastic shine, no specular highlight.
NO RED anywhere on the crab - the red is reserved for the starfish.
BUILD & SILHOUETTE: small young crab. Silhouette = round shell + two raised claws +
  two eye-stalks; readable at thumbnail size and distinct from a snail, shrimp or starfish.
REFERENCE SHEET: full-body top-down / 3-quarter view walking sideways / front view with
  claws raised; plus four eye-stalk expression close-ups: eager-and-cross (stalks forward),
  indignant-accusing (one claw pointing, stalks pushed in), doubtful-waiting (stalks level
  at horizon, claws lowered and folded), joyful (stalks curved, bubbles, claw raised in a wave).
  Neutral cool grey paper background, no scenery.

MINOR CAST (single-appearance, no state variants):
  - PERIWINKLE (p4): a small pointed grey-blue snail clamped to the rock, only its shell
    lip parted; deadpan, does not move. Cool colour, no red.
  - SHRIMP (p5): a near-translucent pale shrimp curled in a palm-sized puddle, long feelers;
    faint cool wash, almost paper.
  - OLD STARFISH (p6 only): five arms spread flat on the rock top, warm brick-red #C43A2B,
    OPAQUE matte gouache - the ONE fully-saturated warm shape in the whole book. Slow, calm.
    SCENE token: OldStarfish. Never let its red touch any other object.
```

---

## 3. 자기참조 파이프라인 (한 줄 → 절차)

**시트 먼저 → 젖은/마른 앵커판 2장 → 그 3장을 @image로 10쪽에 붙인다.**

1. **시트**: 위 `LittleCrab` 시트를 냉회 그라운드에서 굽는다 → 승인 → **게 ref 1장**.
2. **앵커판 2장**(이 책의 정체 = 젖음↔마름을 잠근다):
   - **젖은 판** = p1(가득 찬 웅덩이, wet-in-wet 부드러운 번짐, 광대한 프레임 속 손톱만 한 게).
   - **마른 판** = p6(dry-brush 갯벌, 바위 위 작은 게, **유일한 빨강 불가사리**, 저 멀리 은빛 바다 선).
   - 이 두 판이 (i) 젖음 vs 마름 매체 대비, (ii) 광대한 여백, (iii) 빨강 1점을 잠근다. → 승인 → **스타일 ref 2장**.
   - 🔴 **마른 판이 §2.7 문제를 자동 해결한다** — 마른 갯벌 판이 곧 「배경이 다 안 그려진 러프 워시 필드」 ref다(A-01이 아직 못 구한 「배경 러프 승인 컷 3장째」를, 이 책은 마른 판 하나가 겸한다). 배경을 완성해 버리는 회귀를 이 ref가 막는다.
3. **10쪽**: 각 스프레드 = 게 ref + (그 쪽의 조수상태에 맞는) 젖은/마른 판을 @image로 첨부. 전이 쪽 p8은 두 판을 다 붙인다.

---

## 4. 첫 렌더에서 볼 것 3가지 (걸리면 문구 아니라 ref를 바꾼다 — §5.1 교훈)

1. **빨강이 불가사리 밖으로 샜나** — 웅덩이 물·미역·바위에 붉은 기가 들면 §2.9 규율 실패. 게마저 붉으면 시트를 다시.
2. **물/바위가 사진·플라스틱으로 회귀했나** — 유리 거울 반사, 젖은 플라스틱 광택, 금속 갯벌이면 MATERIAL TRANSLATION 실패. 워시 물성이 죽으면 ref를 다시 굽는다.
3. **마른 판이 「흐린 배경」이 아니라 「안 그린 워시 필드」인가** — 자갈·따개비·잔물결이 다 그려졌으면 §2.7 완성도 위계 실패. 마른 판 ref를 더 비운다.

부수: **젖은 판과 마른 판을 나란히 놓았을 때 「물이 나갔다 왔다」가 값만으로 읽히나** — 이게 이 책의 핵심 판정이다. 안 읽히면 마른 판을 더 창백·건조하게.
