# 창작동화 1000 — F-01 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 원칙·클러스터 지도는 `verified-references.md`(§2·§7), 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT = `docs/changjak-books/f01.md`.** 아래 12컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이고, 새로 발명한 것은 하나도 없다. 대본이 고쳐지면 여기도 고친다.
> 🔴 **작가 실명은 한 글자도 안 들어간다.** 근거 후보 id 는 판정 표에만 남기고 프롬프트에서는 전부 문구로 옮겼다.
> 🔴 **이미지 생성은 이 문서의 일이 아니다.** 사용자가 직접 굽는다.

## 0. 실행 순서 (어기면 인물만 매끈한 CG 로 나온다 — §2.4)

1. **STYLE ANCHOR 로 캐릭터 시트를 먼저 굽는다.** 장면 금지. 🔴 고양이 시트에는 **접힘 5단계**가 반드시 들어간다 — 이 책의 반증이 그 다섯 자세이고, 장면에서 갈리게 하려 하면 안 갈린다.
2. 시트 승인 → `@image1`(새끼 고양이) · `@image2`(손님 여섯) · `@image3`(할머니)로 붙여 컷을 뽑는다.
3. 🔴 **p2 를 먼저 굽고, 그 승인본을 p12 의 ref 로 붙인다.** 두 쪽은 같은 톱샷이고 뒤집히는 것은 「가운데가 찼나 비었나」 하나뿐이다. **좌우 반전 금지**(침대가 벽에 붙은 쪽이 바뀌면 벽 뒤 난로 회수가 무너진다).
4. 그다음 **p3(단면 규약)** → 나머지 여덟 → **p12 는 맨 마지막**.
5. 승인 렌더 3장을 앵커 ref 슬롯에 넣는다 — 🔴 **인물 컷 1 · 배경이 획 몇 개로만 남은 컷 1(p4) · 전체 장면 1(p7)**.
6. 앵커 이름은 **렌더를 보고 짓는다**(§7.5-3). 지금은 슬러그만: `changjak-f01`.

---

# F-01 「내 이불 속에 누가 있어」

주제군 F 집·가족의 작은 사건 / 엔진 **누적·반복** / 무대 독일 시골집 / 주인공 새끼 고양이 / 12스프레드 · 후렴 「여기는 내 자리야」 6회

## F-01 §1. 앵커 배정

**한 줄**: 🔴 **한 획으로 그은 먹선이 이불의 윤곽이고, 그 선의 봉우리 수가 곧 손님 수다.** 부피는 음영이 아니라 **누비선이 함께 휘는 것**으로만 만든다. 색은 평칠 두 개 — **따뜻한 것과 찬 것**뿐이고 그 면적이 밤의 깊이다. 앵커 슬러그 `changjak-f01` — **신규 민팅.**

### 이 권이 그림에 요구하는 것 (판정의 전제)

1. 🔴 **이불 속은 안 보인다 — 그게 이 권의 장치다.** 정보는 전부 **겉의 형태**에 있다(불룩함·삐져나온 꼬리·발 하나). 즉 **윤곽이 유일한 정보원**이다.
2. 🔴 **개수가 서사다**(1→3→4→5→여섯). 봉우리가 세어져야 한다. §2.11 대로 **매체가 셀 수 있게 만들어야** 하고, 물건마다 다른 빛·반사가 붙으면 「셋」이 「어수선함」으로 뭉개진다.
3. 🔴 **두 축이 함께 간다** — 밤이 깊어지고(빛이 줄고 화면이 좁아진다) 이불이 부푼다. 한 축만 움직이면 곡선이 안 보인다.
4. **단면(도해) 쪽이 둘 있다**(p3·p6). 이불을 반으로 자른 것처럼 속을 보여 주는 규약이다 — 이불 속에는 애초에 광원이 없으므로 **명암으로 그릴 수 없는 쪽**이다.
5. **얼굴이 열 쪽에 걸쳐 연기한다** — 흘겨보고·놀라고·말이 끊기고·안도한다. 특히 p8 의 「말이 끊긴 입」과 p10 의 「놀란 눈」은 이 책의 두 꺾이는 점이다.
6. **어른이 한마디도 안 한다**(p7). 정지한 자세와 안 넣은 장작 하나로만 읽혀야 한다.

### 후보 3

| | 후보 ① **C2 선 하나 캐릭터 · 붓 먹선 + 평칠 2색** (`naylor-suitcase` + `metcalfe-crisps`) | 후보 ② C9 믹스드 콜라주 (주제군 F 1순위, `child-tomato`) | 후보 ③ C4 평면 형태 (`panicha-interior` · `virardi-instant`) |
|---|---|---|---|
| 매체 | 둥근 붓에 먹 한 번 실어 **한 획으로 그은 닫힌 윤곽** + 평칠 불투명 색면 2개 | 손 인쇄 무늬 종이를 오려 붙이고 인물만 그린다 | 오려낸/평칠한 무지 도형, 음영 0 |
| 이 권에 맞는 이유 | ① 🔴 **윤곽이 유일한 정보원**이라는 요구 1과 매체가 동형이다 ② 🔴 **후렴 여섯 번 = 같은 선을 여섯 번 다시 긋는 것.** 봉우리가 하나씩 늘고 고양이가 감싼 면적이 하나씩 줄어 **두 수가 한 선 안에 있다** ③ 단면 도해는 원래 선의 언어다(요구 4) ④ 🔴 **얼굴이 연기할 수 있다**(요구 5) — C2 의 정의가 「캐릭터가 전부」다 | 잠자리·집 소재의 정본이고 무늬 천이 무대의 사실이다 | 봉우리 세기엔 최적. 평칠은 개수를 절대 안 뭉갠다 |
| 리스크 | 이 라인에 C2 가 하나 있다(g10) → **공정으로 갈라야 한다**(아래) | 🔴 **f05 가 같은 주제군에서 이미 오려 붙였다.** 라인 내 중복이 개별 최적보다 우선(§7.6). 더해서 콜라주는 종이가 겹쳐 **두꺼워지는데 이 권의 이불은 한 덩어리**여야 하고, 천·바늘땀 인상이 나면 **그 순간 호리 니들펠트다** | 🔴 §2.8 — **표정이 없다.** 이 권은 열 쪽에서 눈꺼풀 높이가 연기 도구이고 p8 의 벌어진 입에 착지가 걸려 있다. 게다가 라인이 C4 를 이미 둘 썼다(b01·e120) |
| 판정 | ✅ **추천** | 탈락 — 같은 주제군 내 중복 + 호리 충돌 위험 | 탈락 — 얼굴이 필요하다 |

**그 밖에 검토하고 뺀 것**: **C7**(e09) — 🔴 e09 가 「어두운 종이에서 빛을 들어내는 잠자리 책」이라 이 권과 가장 가까운 상대다. **매체를 정반대로** 가야 하므로 애초에 후보에서 뺐다. **C8** — 젖은 워시는 봉우리를 뭉갠다(§7.3.1-1). **C5** — a97 이 이미 「반복 손도장 판」이고 이불 무늬가 그것과 같은 공정이 된다. **C6·C3** — 이번 배정 금지 클러스터(넷·셋).

### 🔴 추천 = 후보 ① — 붓 먹선 + 평칠 2색

- **선이 후렴이다.** 「여기는 내 자리야」가 여섯 번 오는 동안 **같은 이불 윤곽이 여섯 번 다시 그려진다.** 같은 것이 반복되며 하나씩 늘어나는 것이 누적 엔진의 정의이고, 그건 곧 **한 획으로 그은 닫힌 선**의 정의다.
- 🔴 **부피는 누비선이 함께 휘는 것으로만 만든다 — 이 권의 그림 발명.** 이불의 누비 골이 몸 위에서 다 같이 한 봉우리로 휜다. 그래서 ①음영 없이 무게와 폭신함이 나오고 ②봉우리 = 골이 휜 자리라 **저절로 세어지고**(요구 2) ③CG 그라데이션이 원천적으로 들어올 자리가 없다. 문구로 「매끈함 금지」를 부탁하는 게 아니라 **부피를 만드는 유일한 수단이 선**이다.
- **면적이 밤이다.** 색이 둘뿐이고 서로의 영역에 절대 안 들어간다 — **따뜻한 것은 이불 속·램프·벽 뒤 난로에만, 찬 것은 이불 밖·마루·창에만.** 밤이 깊어지는 축은 「어두워짐」이 아니라 **찬 색이 자라고 따뜻한 색이 줄어드는 것**이고, p9 에서 찬 색이 최대가 됐다가 p10 부터 벽에서 따뜻한 색이 돌아온다(§2.9 의 면적 변형). 🔴 **그늘은 색이 아니다** — 어두운 자리는 그냥 **색이 없는 맨 종이**다.
- **접힘이 반증이다.** 고양이 윤곽이 감싼 면적이 매 쪽 줄어든다(꼬리→배→머리→다리→침대 끝). 선 그림에서 **면적은 눈으로 재진다** — 「좁아졌다」를 글도 그림도 말하지 않는데 읽힌다.

### g10(같은 C2)과 갈라 둔 4축 — 🔴 **클러스터 라벨보다 공정이 정체를 정한다**(§7.10 전례)

| 축 | g10 「큰 개 앞에서」 | F-01 |
|---|---|---|
| 도구·획 | 딥펜, 가늘고 **떨리는 선을 덧그음**(불안) | 둥근 붓, **한 획으로 긋는 굵고 흔들림 없는 닫힌 선**(자기 자리 주장) |
| 종이 | 탁한 흙빛 #E6DECB | 차가운 회백 실내지 #F0EEE8 (무늬 없음) |
| 색면 | 평면 슬레이트 **1색 = 그림자**(빛의 결과) | 평칠 **2색 = 온기와 추위**(온도, 빛이 아니다). 그림자 색이 없다 |
| 서사 변수 | 떨림 선의 **위치**(누가 무서워하나) | 봉우리 **개수** + 따뜻한 색 **면적** |
| 무대·시간 | 눈부신 아침 마당(밖) | 겨울 한밤 실내 |

### 라인 충돌 확인 (필수)

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ **단, 이 권에선 검수 항목이다** | 이불·리넨·깃털·짚이 나오는 책이라 🔴 **바늘땀·보풀·양모 질감이 보이면 그 순간 호리 라인**이다. 누비는 **그린 선**, 깃털은 **두 획**, 천은 **평칠 한 겹**이다. NOT 절과 검수 3번에 올렸다 |
| 전래동화 **점눈이** | ✕ (4축) | ① 종이 = 차가운 회백 실내지(밝은 크림 ✕) ② 얼굴 = **눈꺼풀선 + 별개 눈썹선 + 수염 세 가닥**(점눈 ✕ — 흘겨보고·크게 뜨고·반쯤 감아야 한다) ③ **빨강 0**, 따뜻한 색은 등불 황토색이고 **점이 아니라 면적**이다(화면당 빨강 1점 ✕) ④ 붓 먹선 + 평칠(느슨한 색연필 낙서 ✕) |
| **f05**(같은 F 군, 이탈리아 부엌) | ✕ | 오려 붙인 무늬 종이 여러 겹 ↔ **먹선 + 평칠 두 색**. 무늬가 화면을 채움 ↔ **무늬가 아예 없음**. 썸네일에서 하나는 콜라주, 하나는 선 그림 |
| **e09**(같은 잠자리·잦아드는 빛) | ✕ | 🔴 **매체가 정반대다** — 어두운 종이에서 목탄을 지워 빛을 **들어냄**(윤곽선 0) ↔ 밝은 종이에 젖은 먹선을 **얹음**(윤곽선이 전부). 어둠도 목탄 알갱이 ↔ **색이 없는 맨 종이** |
| **e120 · b01**(C4 평면) | ✕ | 도형 인물(표정 0) ↔ 그린 인물이 열 쪽 연기. 무지 색면 오리기·마분지 평칠 ↔ 붓 윤곽선 |
| 세계명작 수채 그림풍 | ✕ | 젖은 수채 채색이 아니라 **평칠 불투명 두 색** |

---

## F-01 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-f01  (kitten / German farmhouse bed / the quilt fills up)

Style: a hand-drawn picture-book page for 4-6 year olds. Warm, comic, matter-of-fact.
  One object - a fat feather quilt - is the stage, the clock and the joke.

MEDIUM: BRUSH-AND-INK LINE DRAWING with flat opaque colour laid beside it.
  Every contour is drawn with a round sable brush loaded ONCE with black ink: a single confident
  stroke that swells where the brush presses and thins where it lifts, and dries out at the tail
  of the stroke. ONE STROKE PER EDGE - lines are never retraced, never hairy, never sketchy, and
  the wobble in them comes from the brush, not from hesitation.
  Colour is flat opaque gouache, ONE pass per area, brush edge still visible where it stopped.
  It never shades, never gradates, never sits inside a form as modelling. It fills a zone and
  stops at a hard edge.
  🔴 VOLUME IS MADE BY THE QUILTING LINES AND NOTHING ELSE. The quilt's stitch channels are long
  thin brush lines running across it; where a body lies underneath, they ALL BEND OVER IT
  TOGETHER into one dome. That bending is the only way this book shows weight, softness and how
  many are inside. THERE IS NO SHADING ON THE QUILT ANYWHERE, ON ANY PAGE, EVER.
  🔴 DARKNESS IS THE ABSENCE OF COLOUR, NOT A COLOUR. A dim corner is bare paper with ink lines
  on it. Never mix a grey or a brown to sit in a shadow.
  No blending, no airbrush, no gradient, no digital glow, no bloom around the lamp.

PALETTE: cool off-white interior paper #F0EEE8 / brush ink #1A1613 /
  WARM #E8C687, second pass #D2A25C / COLD #6E7E8A, thinned pass #9FADB5.
  That is the whole book: paper, ink, and two colours.
  🔴 THE TWO COLOURS NEVER ENTER EACH OTHER'S TERRITORY AND NEVER MIX.
  WARM = heat you can feel: the inside of the quilt, the lamp flame, the pillow a body has been
  lying on, the firebox in the next room, and the one wall board with the flue behind it.
  COLD = things that are actually cold: the floorboards, the air coming in under a lifted
  corner, the window, the gap between bed and wall BEFORE the wall is discovered.
  🔴 THE AREA OF EACH COLOUR IS THE STORY, and every cut carries a HEAT: line giving both.
  Night deepening is NOT "getting darker" - it is COLD GROWING AND WARM SHRINKING, and it
  reverses from the wall-discovery page onward.
  🔴 THERE IS NO RED, NO GREEN, NO THIRD COLOUR ANYWHERE. No blue but the cold. No brown.

MATERIAL TRANSLATION (obey these or the medium collapses into CG - or worse, into felt):
  QUILT = one closed brush contour + long thin quilting channels that bend over each body.
    🔴 NO stitch marks, NO thread, NO fuzz, NO fibre, NO fabric weave. The quilting is DRAWN.
  FEATHERS (inside, on cross-section pages) = pairs of short curved ticks on bare paper, a
    handful of them, not a filling. One loose feather in the air = two brush strokes.
  LINEN SHEET AND PILLOW = bare paper with three or four fold lines. No pattern, no texture.
  WOODEN BED AND WALL BOARDS = the grain is two or three long strokes per plank, no more.
  STRAW FROM THE MATTRESS = four or five thin single strokes.
  ICE ON THE WINDOW = cold colour with a hard scalloped edge where it has melted back.
  FUR = the body contour plus three or four strokes inside it at the chest and haunch. Never
    drawn hair by hair.

COMPOSITION: the quilt is the largest shape on almost every page and it is ONE shape.
  🔴 The frame gets NARROWER as the night goes on: a whole room early, a cross-section band in
  the middle, a vertical slit near the end. The camera moves in; it never zooms back out until
  morning.
  🔴 Anything being COMPARED for size or count sits at the SAME DEPTH in the frame.
  🔴 Only ONE page in this book lines the bumps up so they can be counted (the page where the
  grandmother looks in). On every other page the bumps are visible but NOT arranged in a row -
  otherwise the count stops being an event and becomes a diagram.
  Keep the bottom 18% of the image quiet and free of key subject matter (caption band goes there).

FINISH HIERARCHY - read this twice. This is about how FINISHED each area is, NOT about opacity.
  1. THE QUILT'S OUTLINE AND ITS QUILTING CHANNELS, AND THE KITTEN = finished. Full brush line.
  2. WHAT THE KITTEN TOUCHES ON THAT PAGE (the lifted corner, the pillow, the wall board, the
     floorboard it lands on) = half-finished: contour plus one flat pass of colour.
  3. EVERYTHING ELSE = A FEW OPEN BRUSH STROKES ON BARE PAPER. The bed frame is three lines,
     the herb bundle is five, the chest is a rectangle with one line for a lid. Shapes left
     unclosed, deliberately not finished.
  🔴 The room is NOT faded, NOT hazy, NOT blurred. It is simply NOT DRAWN. A dark open brush
  line is correct; a soft pale finished line is wrong.
  Never draw every floorboard, every plank, every carved detail of the headboard.
  EXCEPTION - exactly two pages carry density, and they are the same frame: the clean bed seen
  from above at the start, and the emptied bed seen from above at the end. 🔴 On those two,
  density means MORE THINGS ARE DRAWN, never that things are drawn more finely.

CHARACTER DESIGN: eyes are DRAWN with a brush - an eye line plus an UPPER LID LINE whose height
  is the acting instrument, and a SEPARATE short eyebrow stroke above it. A shut eye is one
  curved stroke. Mouths are one or two strokes and CAN OPEN - the page where the refrain is cut
  off depends on an open mouth. Whiskers are exactly three strokes per side.
  Bodies are one closed contour plus three or four inside strokes. Silhouette must be readable
  at thumbnail size, and the animals must be told apart by SHAPE alone, because most of the time
  only a bump, a tail or one foot is showing.

  FACE SEPARATION (required): the face must read apart from the body in VALUE, not by adding a
  colour - bare paper at the muzzle and brow, a step of ink at the jaw. Eyes, lid, brow and
  mouth must never sink into one flat mass. Test: at thumbnail size the expression is still
  legible. This does NOT add a colour to the palette above.

SETTING: an upstairs bedroom in a German farmhouse in winter - a low carved wooden bed against
  the wall, a thick feather quilt in a hand-sewn cover, coarse linen sheets, a wooden chest with
  an oil lamp on it, wainscot boards along the lower wall, dried herb bundles hanging on them, a
  pair of wooden clogs under the bed, wide floorboards, a small double-glazed window with ice on
  it, and through the doorway a tiled stove in the next room. European, no Asian motifs.

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT digital airbrush / NOT smooth gradients / NOT glossy 3D CG render / NOT cel-shaded
  anime / NOT a texture filter over flat digital colour / NOT photographic / NOT a fully
  rendered background / NOT shading or modelling anywhere on the quilt / NOT a glow or bloom
  around the lamp or the stove / NOT a grey or brown mixed to sit in a shadow / NOT a third
  colour / NOT red, green or yellow / NOT retraced or hairy contour lines /
  🔴 NOT wool felt, NOT needle-felted fibre, NOT visible stitching or thread, NOT fabric weave,
  NOT fuzzy fibre edges, NOT real quilting texture (another line owns those - the quilting here
  is DRAWN LINES on one flat pass of colour) / NOT sculpted clay /
  NOT any lettering, numerals or signage anywhere in the image.
```

### 🔴 이 앵커의 두 불변 규칙 (매 컷 반복 확인)

**규칙 A — `UNDER:`** 그 쪽까지 이불 속에 몇이고, 겉으로 무엇이 삐져나왔나. 🔴 **화면 안 봉우리 수가 이 숫자와 정확히 같아야 한다.**

| | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 이불 속 | 0 | 1 | 3 | 4 | 4 | 5 | 5 | 5 | 6 | 6 | 6 | **0** |
| 이불·베개 위 | 고양이(들어가는 중) | — | — | — | 닭 | 닭 | 닭 | 닭+거위 | — | — | — | — |
| 화면 봉우리 | 0 | 1 | 3 | 4 | 4 | 5 | 🔴 **5 + 베개 닭 = 여섯** | 눌려 뭉갬 | 5 | 화면 밖 | 화면 밖 | **0**(눌린 자국 5) |

명부와 순서: ①생쥐 두 마리(p3) ②고슴도치(p4) ③닭 — **베개 위, 이불 속이 아니다**(p5) ④늙은 개(p6) ⑤거위(p8, p9 에 들어간다). 할머니는 손님이 아니다(p7, 말 없음).

**규칙 B — `HEAT:`** 따뜻한 색과 찬 색의 위치·면적. 🔴 밤은 「어두워지는 것」이 아니라 **찬 색이 자라는 것**이다.

| | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 따뜻 | 소 | 중 | 대 | 대 | 대 | 대(김으로 샌다) | 🔴 최대(두 방에 걸침) | 소 | **최소(띠 하나)** | 벽에서 돌아옴 | 몸에 딱 맞음 | **최대(빈 가운데)** |
| 찬 | 0 | 0 | 쐐기 하나 | 조각 하나 | 창 한 조각 | 발끝 두 짝 | 침실 바닥 | 🔴 우하단(따뜻함보다 크다) | **최대(화면 70%)** | 바닥만 | 위아래 바깥 | 창 아래 한 조각 |

---

## F-01 §3. 캐릭터 시트 3장 (🔴 이것부터 굽는다)

```
CHARACTER SHEET - KittenSmall   (bake this FIRST, before any scene)

🔴 THE SHEET IS DRAWN IN THE SAME MEDIUM AS THE BOOK. Cool off-white paper #F0EEE8, one round
  brush loaded with black ink, one stroke per edge, plus flat WARM #E8C687 where noted. Do NOT
  render this animal smoothly just because there is no background behind it. No shading anywhere.

FACE: a round head, a short blunt muzzle, and a face SMALL relative to the head so it reads as
  very young. Eye = one lower eye line plus an UPPER LID LINE - 🔴 the height of that lid line
  is the whole facial performance (high = startled, half down = smug and comfortable, one lid
  lower than the other = side-eye, fully closed = one curved stroke). A SEPARATE short eyebrow
  stroke sits above each eye. Nose = one small wedge. Mouth = one stroke, and it must be able
  to OPEN into a small oval. Whiskers = exactly three strokes per side.
  No dot eyes, no blush, no highlight dot, no catchlight.
BODY: one closed brush contour with three or four strokes inside at the chest and haunch. A
  pale WARM patch is allowed on the chest and the inside of the ears - 🔴 it is warm because
  the kitten is the warm thing in this book, and it is the only colour on the animal.
🔴 SIGNATURE DETAIL: the tail is LONG FOR THE BODY and ends in a blunt tip with a small kink in
  it. In this book the tail is often the only part of the kitten that can be seen - sticking out
  from under a corner, wrapped round its own nose - so the kink is how the reader knows whose
  tail it is. Keep it in every drawing.
BUILD & SILHOUETTE: a kitten about two heads tall, big head, short legs, round belly. Small
  enough that a grown dog is five of it. Readable at thumbnail size from the head-to-body ratio
  and the kinked tail.
🔴 THE FIVE FOLDS - DRAW ALL FIVE ON THE SHEET. This is the argument of the book and it must be
  fixed here, not improvised in scenes. Each pose encloses LESS AREA than the one before, and
  the outline is what shows it:
  FOLD 0 - spread: lying on its back, all four legs stretched out to the corners, taking up the
    most area it ever will.
  FOLD 1 - tail in: lying on its side, tail curled tight against the belly, one forepaw holding
    the curled tail down.
  FOLD 2 - belly off: rolled onto its side away from something, belly lifted clear, forepaw toes
    splayed wide in surprise, ears back.
  FOLD 3 - head down: head lowered below shoulder line, only ear tips and the top of the eyes
    would clear a blanket edge.
  FOLD 4 - loaf: all four legs folded under the body, a compact block, visibly smaller than
    FOLD 0.
  FOLD 5 - the edge: clinging to a rim with one hind foot already off in the air and the front
    claws dragging, mouth open on an unfinished word.
REFERENCE SHEET: full-body side view standing / the five folds above, in order, at the same
  scale so the shrinking area is obvious / a large detail of the kinked tail tip / a detail of
  one forepaw with the toes splayed /
  four face close-ups changing ONLY the upper lid line and the mouth: comfortable (lids half
  down, mouth one flat stroke), side-eye (one lid lower, eyes turned to the corner),
  startled (lids high, eyes round, ears up, mouth a small oval),
  relieved and nearly asleep (lids nine tenths down, whiskers hanging, mouth one soft curve).
  Plain paper background, no scenery.
FACE SEPARATION (required): on this sheet the face must read apart from the body in VALUE, not
  by adding a colour - bare paper at the muzzle and brow, a step of ink at the jaw. Test: shrink
  this sheet to thumbnail size - the expression must still be legible.
SCENE token: KittenSmall.
```

```
CHARACTER SHEET - Guests   (bake SECOND, attach as @image2)

🔴 SAME MEDIUM AS ABOVE - brush ink on cool off-white paper, one stroke per edge, no shading.
  Each of these is defined by SILHOUETTE FIRST, because most of the time the reader will only
  see the DOME THEY MAKE UNDER A QUILT, a tail, or one foot. 🔴 Every one of them must be
  recognisable from the shape of its bump alone.
  For each animal, draw it twice: the animal itself, AND the dome its body makes under the
  quilt, with the quilting channels bending over it.

MOUSEPAIR - two mice, and they are always TOGETHER and always TOUCHING, nose to nose, so they
  read as one small double bump with two thin tails trailing out. Ears large and round, ears
  laid back. Their dome is the smallest of all: two low humps side by side.
HEDGEHOG - a low round mass; the spines are drawn as short single strokes along the back only,
  never as texture. Face calm, eyes shut, already settled. 🔴 Its dome is the only dome with
  SMALL POINTS PUSHING UP THROUGH THE QUILT FROM INSIDE - little horns in the outline, four or
  five of them. That is the one piece of evidence in this book that shows through the cover.
HEN - a fat round body with both feet completely hidden under the feathers, bill tucked into the
  breast, one eye half open, tail feathers a fan of four strokes. 🔴 She is never under the
  quilt - she sits ON the pillow, so her shape must read as a SILHOUETTE ON TOP, not a dome.
OLDDOG - a long heavy body, blunt square muzzle, drooping lip, one ear folded over. Lying on its
  side with forelegs stretched straight out. About five kittens long. 🔴 Its dome is one LONG
  RIDGE that runs most of the way across the quilt - it is not a bump, it is a landscape.
GOOSE - the biggest silhouette in the book when the wings are open: one wing as wide as the bed.
  Long neck straight forward, bill open, webbed feet flat and splayed. With wings folded it is a
  heavy teardrop. 🔴 It presses things down rather than making a dome of its own.
REFERENCE SHEET: all five side by side at correct relative scale with a KittenSmall silhouette
  for size. Beside them, a strip showing the FIVE DOMES in a row - mouse pair, hedgehog with its
  little horns, old dog's long ridge, and (for contrast) the kitten's own loaf - all drawn under
  the same quilt with the quilting channels bending over each. Plain paper background.
FACE SEPARATION (required): every face here must read apart from its body using ink line and
  bare paper only.
SCENE tokens: MousePair, Hedgehog, Hen, OldDog, Goose. Never write "Mouse" or "Dog" alone.
```

```
CHARACTER SHEET - Grandmother   (bake THIRD, attach as @image3)

🔴 SAME MEDIUM - brush ink line, flat WARM colour only on the lamp flame she carries.

BUILD: an adult woman, head about ONE SEVENTH of her standing height. 🔴 Read this twice - she
  must never read as a large child. Rounded shoulders, a slight forward stoop, wide flat hips,
  hands larger and squarer than a young woman's.
FACE: grey hair pulled back into a low bun drawn as one solid shape, deep lines at the eye
  corners drawn as two short strokes each, and 🔴 A MOUTH THAT IS ALWAYS ONE SHORT CLOSED
  STROKE. She does not speak anywhere in this book and the drawing must not let her. What she
  feels is in the eye corners and in the fact that she does not move.
CLOTHES: a long dark night shawl over the shoulders, crossed at the front; a lighter long
  nightgown to the ankle; bare feet or felt slippers.
POSTURE - THE ONLY ONE SHE NEEDS: standing in a doorway, one shoulder against the door post,
  one hand on the door handle, the other holding an oil lamp low at hip height so the flame is
  the lowest warm thing in the frame. Nothing begun, nothing finished - a held still moment.
PROP: one split log resting on the floor by her feet, drawn with three strokes. 🔴 She has NOT
  put it in yet. That log becomes the warm wall four pages later.
REFERENCE SHEET: full body in the doorway pose / a head close-up showing the closed mouth and
  the eye-corner lines / her hand holding the lamp / the log on the floor beside one foot.
  Plain paper background.
SCENE token: Grandmother.
```

---

## F-01 §4. 12컷

각 컷은 `STYLE ANCHOR + @image1(KittenSmall) + @image2(Guests, 등장할 때만) + @image3(Grandmother, p7) + 아래 블록` 으로 합성한다. 🔴 두 관통 줄(`UNDER:` · `HEAT:`)을 매번 읽는다.

### p1 — 이불 속은 벌써 따뜻했다
```
CAMERA: close-up, high angle. One corner of the quilt is lifted on a diagonal across the frame
  and the kitten's back half is disappearing under it.
SUBJECT: KittenSmall is burrowing head-first under the thick feather quilt; only its hind legs
  and its kinked tail are still outside. The toes of one hind foot are gripping the sheet. The
  face is not visible at all.
UNDER: 0 - nobody is in there yet. Outside: the kitten's own hind legs and kinked tail, and the
  lifted corner it went in under. 🔴 The quilt shows NO domes on this page.
HEAT: WARM is SMALL - one wedge of it visible through the lifted corner (the inside of the
  quilt), plus the lamp flame. COLD is ABSENT - the outside world is not shown yet. Everything
  else is bare paper with ink lines, and bare paper is more than half the page.
SETTING: a thick feather quilt in a hand-sewn cover, coarse linen sheet, the carved headboard of
  a low wooden bed, a wooden chest beside the bed with an oil lamp turned low, wainscot boards
  along the lower wall, dried herbs hanging on them.
QUILTING: the channels run away from the lifted corner in long lines and are perfectly straight -
  nothing is under them yet.
FINISH: the quilt outline, its channels and the kitten finished. The lifted corner and the sheet
  under the kitten's foot half-finished. The headboard, the chest, the lamp and the herbs are
  three to five open brush strokes each. Do not draw the carving on the headboard.
🔴 PLANT THIS AND DO NOT EXPLAIN IT: along the lower wall, ONE wainscot board has NO grain
  strokes on it while every other board has two - it is worn smooth. It is behind the bed, it is
  not pointed at, and it is paid off on the wall page.
TONE: the lamp is the only light, so warm colour pools on the quilt and everything else is bare
  paper. The mass of the quilt should read as comfort before anything else.
```

### p2 — 여기는 내 자리야 (후렴 1 · 🔴 거울의 앞쪽 · 밀도 슬롯 1)
```
CAMERA: overhead top shot, looking straight down. The bed fills the frame and the kitten is
  dead centre. 🔴 THIS IS THE MIRROR FRAME - the last page returns to this exact angle. Do not
  flip it left to right: the long side of the bed is against the wall and it must stay there.
SUBJECT: KittenSmall lies under the quilt in FOLD 0 - all four legs stretched to the corners,
  the biggest area it will ever take. Its dome sits in the middle of the quilt. Only the face is
  out, lids half down, whiskers hanging, mouth one flat stroke: comfortable.
UNDER: 1 (KittenSmall). One dome, centred. Outside: only the face.
HEAT: WARM is MEDIUM and covers the whole quilt - the quilt is the warm thing. COLD is ZERO.
  The floor around the bed is bare paper with a few board lines.
QUILTING: five channels run the length of the quilt and ALL FIVE bend together over the one
  central dome. 🔴 There is no other bend anywhere on the quilt - the reader learns the rule of
  this book here.
SETTING: 🔴 the long side of the bed is flat against the wall, and along that wall's lower part
  runs the wainscot - with the ONE smooth board that has no grain strokes. Folded blanket at the
  foot, wooden clogs under the bed, wide floorboards.
FINISH: 🔴 DENSITY PAGE 1 OF 2 - this is the frame the last page reverses, so the room's objects
  must be established here: bed, quilt, pillow, chest, lamp, clogs, folded blanket, window,
  wainscot. NINE things, each drawn with few strokes. Density means MORE THINGS, not finer
  drawing. The floorboards are four long lines, not a floor.
TONE: light comes from above onto the middle of the quilt; the edges of the frame are bare paper.
  The area the kitten occupies must be obvious at a glance, because that area is the plot.
```

### p3 — 생쥐 두 마리가 쪼르르 (후렴 2 · 🔴 단면 규약을 세우는 쪽)
```
CAMERA: CROSS-SECTION, straight side view - the quilt is cut open as if by a diagram, and we see
  inside it. A long horizontal band composition. 🔴 This convention returns once (the dog page)
  and nowhere else.
SUBJECT: centre - KittenSmall lying on its side in FOLD 1: tail curled tight against the belly,
  one forepaw pressing the curled tail down, eyes open and turned toward the foot of the bed
  (side-eye: one lid lower). Right, at the foot end - MousePair has just come in, nose to nose,
  bodies touching, ears laid back, and 🔴 both thin tails are still OUTSIDE the quilt.
UNDER: 3 (KittenSmall + MousePair). Outside: two mouse tails through the lifted corner, and the
  lifted corner itself.
HEAT: WARM fills the whole inside of the quilt - LARGE. COLD enters for the first time as ONE
  SMALL WEDGE at the lifted corner, hard-edged, pushing in at the foot end. 🔴 The two colours
  meet along the quilt's opening and neither bleeds into the other.
SETTING (inside the cut): pairs of short curved feather ticks scattered on bare paper - a
  handful, not a filling. The cover's inner surface is one line. Two fold creases in the sheet.
  Outside the bed: two very small pairs of footprints on the floorboards.
QUILTING: on the visible top surface, the channels bend over the kitten's dome and, at the foot
  end, over two small low humps.
FINISH: the cut edge of the quilt, the kitten and the mice finished. The sheet under them
  half-finished. The bed frame and the floor are open strokes.
🔴 NOT: no stitching along the cut edge, no thread, no fabric weave, no fuzz. The cut edge is
  ONE brush line and the feathers are DRAWN TICKS.
TONE: the inside of the quilt is evenly warm; the cold wedge is the only cool note. Where the
  heat is leaking must be readable from the shapes alone.
```

### p4 — 가시가 배를 콕 찔렀다 (후렴 3)
```
CAMERA: close-up, over the shoulder - we look past the kitten's own back down at its belly. The
  background falls away to almost nothing.
SUBJECT: foreground - KittenSmall's belly and forelegs caught mid-roll into FOLD 2: the belly
  lifting clear as the body tips sideways, the toes of one forepaw splayed wide, ears back, mouth
  shut but the nose wrinkled. Lower frame - Hedgehog has half unrolled and settled belly-down on
  the sheet, several spines standing straight up toward the kitten's belly, eyes already shut,
  entirely untroubled.
UNDER: 4 (KittenSmall + MousePair + Hedgehog). Outside: 🔴 the hedgehog's spines pushing small
  points UP THROUGH the quilt cover from inside - four or five little horns in the outline. That
  is the only page where what is inside shows through the top.
HEAT: WARM still fills the quilt - LARGE. COLD is ONE small piece at the corner that is settling
  back down. Warm has not yet begun to shrink.
SETTING: out of the way and behind, MousePair sleeping pressed together at the foot end - drawn
  with FEWER, LOOSER strokes, 🔴 not with a blur. The trough of a pressed feather quilt, one
  drag mark on the sheet where the hedgehog rolled in.
QUILTING: two channels visible, bending over the hedgehog and pushed up into small points.
FINISH: the belly, the splayed toes and the spines finished - the contact point is the most
  worked part of the page. The sheet under the hedgehog half-finished. Everything else is a few
  loose strokes.
TONE: the eye must go to the one place where spine meets belly. Get it there by drawing MORE
  there and almost nothing elsewhere, never by adding shadow.
```

### p5 — 따뜻한 베개는 이제 닭 것이었다
```
CAMERA: medium, at pillow height. The pillow occupies the left of the frame, the quilt the
  right, and the two are divided by a horizontal step. 🔴 The pillow and the kitten's head are
  at the SAME DEPTH so the reader compares heights, not distances.
SUBJECT: upper left - Hen has settled in the middle of the pillow, feet completely hidden under
  her feathers, body puffed round, bill tucked into her breast, one eye half open. Lower right -
  KittenSmall in FOLD 3: the head has come down off the pillow and is sinking into the quilt,
  only the ear tips and the top of the eyes still clear of the edge, eyes looking UP at the
  pillow.
UNDER: 4 in the quilt (KittenSmall + MousePair + Hedgehog); Hen is ON the pillow, not under.
  Outside: four domes on the quilt, the hen's silhouette on the pillow, and the kitten's ear tips
  and eyes.
HEAT: WARM covers the quilt AND the pillow - the pillow is warm because a body was lying on it,
  and now the warm belongs to the hen. COLD appears as one small piece of the iced window at the
  top corner of the frame. 🔴 Warm is still large, but it has been taken.
SETTING: a thick linen pillow with a dent where the hen's weight is, one feather pushed off it
  and still in the air (two strokes), the lamp turned low, herb bundles on the wainscot.
QUILTING: the channels bend over four domes; none of them is near the pillow.
FINISH: the hen and the kitten's head finished. The pillow and the dent half-finished. The lamp,
  the window, the herbs are open strokes.
TONE: the warm on the pillow sits HIGH in the frame and the kitten's head is going DOWN out of
  it. 🔴 Losing your place must read as a direction on the page, not as a mood.
```

### p6 — 늙은 개가 통째로 들어왔다
```
CAMERA: CROSS-SECTION, straight side view again - the same convention as the mouse page, but now
  the band is packed from edge to edge.
SUBJECT: left two thirds - OldDog lies stretched full length inside the quilt, back shoved
  against the kitten, forelegs straight out, eyes shut, lip drooping, deeply asleep. Right edge -
  KittenSmall in FOLD 4 (loaf): all four legs folded under the body, visibly smaller than on the
  refrain page, eyes wide open, staring at the dog's back. Between them: Hedgehog under the dog's
  belly, MousePair wedged behind the dog's hind legs. Hen still on the pillow above.
UNDER: 5 in the quilt (KittenSmall + MousePair + Hedgehog + OldDog); Hen on the pillow. Outside:
  the kitten's two hind feet sticking out past the foot of the bed, and the sheet now showing
  below the drum-tight quilt.
HEAT: WARM still fills the inside - but 🔴 it is LEAKING: where the quilt is pulled tight, the
  warm colour stops short of the edge and bare paper shows, and the two hind feet outside are
  COLD. Heat escaping = colour running out, never a gradient, never steam drawn as glow.
SETTING: the quilt pulled taut, the blanket slipped off onto the floor, straw showing from the
  mattress edge in four thin strokes.
QUILTING: 🔴 one LONG RIDGE across most of the width (the dog) with four small bumps beside it.
  The channels are stretched almost straight over the ridge - that is what "the quilt went
  tight" looks like.
FINISH: the dog and the kitten finished. The taut quilt edge and the exposed sheet half-finished.
  The bed frame and the fallen blanket are open strokes.
TONE: the inside is as warm as before, but the frame is FULL - leave almost no bare paper inside
  the quilt. The only cool notes are the two feet outside.
```

### p7 — 할머니는 아무 말도 하지 않았다 (🔴 세는 유일한 쪽)
```
CAMERA: long shot, eye level. A half-open door frame cuts the left of the picture like a
  picture frame; the bed is at the end of the light.
SUBJECT: left, in the doorway - Grandmother, one shoulder against the door post, one hand on the
  handle, the other holding the oil lamp low at hip height. Mouth one short closed stroke, eye
  corners creased, nothing begun. 🔴 A split log lies on the floor by her feet, NOT YET in the
  fire. Right, on the bed - the domes.
UNDER: 5 in the quilt; Hen on the pillow. 🔴 THIS IS THE ONE PAGE IN THE BOOK WHERE THE BUMPS
  ARE LINED UP AND COUNTABLE: the five domes are arranged along the quilt in a single readable
  row (mouse pair as one double hump, hedgehog with its little horns, hedgehog and kitten small,
  the dog's long ridge), and the hen's silhouette sits on the pillow at the end of the row -
  FIVE PLUS ONE = SIX SHAPES. Draw them clearly separated. Outside: the kitten's hind feet still
  out past the foot of the bed.
HEAT: 🔴 WARM IS AT ITS LARGEST IN THE BOOK and it is the only page where it spans two rooms -
  the open firebox of the tiled stove behind her, her lamp flame, the trapezoid of light lying
  across the floorboards, and the quilt at the end of it. COLD is the rest of the bedroom floor.
  🔴 The log she is about to add is why the wall is warm four pages later. Do not explain it.
SETTING: through the doorway, a tiled stove with its firebox open; the wainscot boards run from
  the next room into the bedroom - 🔴 including the smooth one; a worn hollow in the threshold; a
  thin thread of smoke off the lamp (two strokes).
QUILTING: channels bending over five domes, and this is the widest view of the quilt since the
  refrain page.
FINISH: Grandmother and the six shapes finished. The door post, the threshold and the firebox
  half-finished. The stove tiles, the far wall and the floor are open strokes - do not draw
  every tile.
TONE: still air. Nobody is woken. 🔴 An adult looked at the count and did not name it - the
  drawing must not name it either: no pointing hand, no raised eyebrows, no smile.
```

### p8 — "여기는 내 자리…" (후렴이 부러진다)
```
CAMERA: low angle from bed level, looking up. The opened wings cover the entire top of the frame
  and press down on everything below.
SUBJECT: top of frame - Goose steps up onto the quilt with both wings thrown wide, neck stretched
  forward, bill open, webbed feet planted flat and pressing the domes below. Lower right corner -
  KittenSmall in FOLD 5: on the very edge of the bed, one hind foot already off in the air, front
  claws dragging on the sheet, 🔴 MOUTH OPEN ON AN UNFINISHED WORD, eyes up under the wing.
UNDER: 5 in the quilt, PRESSED FLAT - the domes are squashed and briefly not countable, which is
  the point. Goose is ON the quilt, Hen still on the pillow. Outside: loose feathers in the air,
  the sheet dragged over the edge, the kitten's own body half off the bed.
HEAT: 🔴 WARM SHRINKS TO A SMALL PIECE under the pressed quilt. COLD opens up in the lower right
  - the empty space between the bed edge and the floor - and 🔴 for the first time in the book
  COLD IS BIGGER THAN WARM. Keep the lower right corner open so the direction of falling reads.
SETTING: several feathers knocked loose (two strokes each), the sheet pulled over the bed edge,
  the drop to the floorboards visible.
QUILTING: the channels are pressed nearly flat under the webbed feet - the bends are crushed.
FINISH: the goose's near wing, the kitten and the bed edge finished. The pressed quilt
  half-finished. The rest is open strokes.
TONE: push contrast one step higher than any other page - the top of the frame is heavy with
  ink line, the bottom right corner is empty paper. 🔴 The refrain breaks here, so the picture
  must break its own balance too.
```

### p9 — 툭
```
CAMERA: high angle, the floorboards wide across the frame, the bed cut off along the top edge.
SUBJECT: centre bottom - KittenSmall frozen exactly as it landed, on its side, four legs at
  awkward angles, tail flat against the boards, only the head lifted to look up at the bed. Eyes
  round and wide, mouth shut. 🔴 It does not look hurt and it does not cry - it looks unnoticed.
UNDER: 6 in the quilt (MousePair, Hedgehog, OldDog and now Goose, which has settled in); Hen on
  the pillow. Outside: 🔴 the quilt shows five domes and NOT ONE OF THEM MOVES. Nothing on the
  bed acknowledges the fall.
HEAT: 🔴 COLD IS AT ITS MAXIMUM - it covers the whole floor, roughly 70% of the frame, right up
  to the cut-off bed. WARM survives as ONE NARROW BAND along the top where the quilt still is.
  This is the book's low point and it is drawn as an area, not as darkness.
SETTING: wide floorboards with their joints, the clogs under the bed, one feather that came down
  with the kitten lying beside it, the side of the bed cut off at the top of the frame.
QUILTING: only the near edge of the quilt is in frame, with two dome bends visible along it.
FINISH: the kitten and the board it lies on finished. The joints of the nearest two boards
  half-finished. The bed side, the clogs and the far floor are open strokes.
TONE: warm above, cold below, divided along a hard horizontal line. 🔴 The only thing in the
  picture that is moving is one feather still coming down.
```

### p10 — 벽이 따뜻했다 (🔴 회수)
```
CAMERA: close-up, side view. The left half of the frame is wainscot boarding, the right half is
  the kitten, and the point where its back touches the wall is dead centre.
SUBJECT: right - KittenSmall sitting with its back against the wall, back fur parted where the
  wall presses it, ears springing up, eyes round with surprise, one forepaw raised to touch the
  boards, eyes travelling UP the wall.
UNDER: 6, and none of them is in this frame. The quilt is not in this picture at all. Outside:
  nothing - this page is only the kitten and the wall.
HEAT: 🔴 WARM COMES BACK, AND IT COMES OUT OF THE WALL. One wainscot board is warm and the
  boards above and below it are bare paper; the floor is COLD. The warm is a hard-edged band
  along one board, 🔴 NOT a glow, NOT a halo, NOT a gradient creeping outward.
SETTING: 🔴 THE PAYOFF - the warm board is THE ONE WITH NO GRAIN STROKES ON IT, the smooth board
  planted on the first and second pages. Every board around it has two grain strokes; this one
  has none, because it is worn smooth. Rising heat from the gap between boards = THREE THIN
  BRUSH STROKES, nothing more. The hanging herb bundle nearest that board tilts very slightly.
  Top corner: one thin line of firelight through the door gap.
FINISH: the kitten, the touching point and the warm board finished. The two boards either side
  half-finished. The herbs, the door gap and the floor are open strokes.
TONE: the discovery is one contact point, so put the finish there and nowhere else. 🔴 The
  grandmother's log is now inside that wall, and the picture must not say so.
```

### p11 — 딱 한 마리만 들어가는 틈
```
CAMERA: frontal, a TALL NARROW VERTICAL composition - the bed's side board closes the frame on
  one side, the wall on the other, and only the gap between them is open. 🔴 THIS IS THE
  NARROWEST FRAME IN THE BOOK. The camera has been closing in since the refrain page and it
  stops here.
SUBJECT: centre - KittenSmall turned side-on, squeezing itself into the gap: back against the
  wall, belly against the bed's side board, forepaws drawn together in front, shoulders narrowed.
  Lids nine tenths down, whiskers hanging: this is the relieved, nearly-asleep face from the
  sheet.
UNDER: 6, all of them out of frame above. Outside: the underside of the mattress at the top of
  the frame with four or five straw strokes coming out of it.
HEAT: WARM fills the inside of the gap 🔴 AND IT IS EXACTLY THE SIZE OF THE KITTEN - the warm
  zone fits the body with nothing left over. Above and below, outside the gap, is COLD.
SETTING: the grain of the wall boards and of the bed's side board run VERTICALLY and cut the
  frame into three; a few dried herb leaves and a ball of dust that rolled into the gap; the
  floor beyond the gap far away and cold.
FINISH: the kitten and the two surfaces touching it finished. The mattress underside and the
  straw half-finished. Beyond the gap, open strokes only.
TONE: the whole page is the feeling of a thing fitting exactly into a place. Get it from the
  warm zone matching the body's outline, never from a soft light.
```

### p12 — 침대는 텅 비었다 (후렴 6, 온전히 · 🔴 거울 착지 · 밀도 슬롯 2)
```
CAMERA: overhead top shot, straight down - 🔴 THE EXACT SAME ANGLE AS THE REFRAIN PAGE. Attach
  the approved refrain-page render as reference. Do NOT flip it left to right: the bed's long
  side stays against the same wall. What is reversed is one thing only - the middle of the quilt
  is empty.
SUBJECT: centre - nothing. The middle of the quilt is empty, with five pressed hollows of
  different sizes left in it. Right edge of the frame - KittenSmall curled in the gap between bed
  and wall, seen from above: only the ear tips, the curve of the back and the kinked tail wrapped
  round to its own nose. Eyes shut, one curved stroke each. Bottom corner of the frame - just the
  tip of a goose wing and the end of a dog's tail, leaving.
UNDER: 🔴 0. Everyone has gone. Outside: five pressed hollows on the quilt, the hen's dent in the
  pillow, one feather and one hedgehog spine on the sheet, and small and large footprints on the
  floor ALL POINTING TOWARD THE DOOR.
HEAT: 🔴 WARM IS AT ITS LARGEST AGAIN, and now it is the EMPTY middle of the quilt - morning
  light lying broad across nothing. COLD has shrunk to one small piece under the window where
  the ice is melting from the bottom up. And the gap the kitten is in is 🔴 THE SECOND, DEEPER
  PASS OF WARM #D2A25C - the script calls that corner "in shade", and in this book shade is not
  a colour, so the deeper warm carries it: the corner is not darker, it is WARMER. That is the
  landing. Nobody is cold.
QUILTING: 🔴 THE OPPOSITE OF THE REFRAIN PAGE - for the first time in twelve pages the quilting
  channels run STRAIGHT ACROSS with no bend anywhere. Nothing is under them. The five hollows are
  drawn as shallow creases, not as domes.
SETTING: the quilt thrown back toward the foot of the bed, the pillow with the hen's dent, a
  small double-glazed window with the ice melted low and beads of water on it, the wainscot with
  the smooth board.
FINISH: 🔴 DENSITY PAGE 2 OF 2 - the same nine objects as the refrain page must be here so the
  reversal reads, PLUS the traces (hollows, dent, feather, spine, footprints). Density means MORE
  THINGS ARE DRAWN, never that they are drawn finer. 🔴 Do not draw the floorboards more than
  before, and do not add furniture that was not on the refrain page.
TONE: broad morning light on the empty middle, a small deeper-warm corner at the edge holding the
  kitten. 🔴 The wide emptiness and the narrow fullness have to be readable in one glance - that
  comparison is the whole ending, and both are at the same depth in the same frame.
```

---

## 첫 렌더 검수 체크리스트 (6항목)

1. 🔴 **이불에 음영이 들어갔나** — 봉우리가 그라데이션·하이라이트·에어브러시로 만들어져 있으면 이 앵커의 핵심이 무너진 것이다. 부피는 **누비선이 함께 휘는 것**뿐이다. 문구를 늘리지 말고 **p3(단면) 또는 p6 승인본을 ref 로 못 박아라**(§2.3).
2. 🔴 **봉우리 수가 `UNDER:` 와 다른가** — 한 마리라도 더 있거나 덜 있으면 누적 엔진이 그 쪽에서 끊긴다. 특히 **p7 은 여섯이어야 하고, p7 만 한 줄로 정렬**돼 있어야 한다(다른 쪽이 줄로 정렬돼 있으면 세는 사건이 p7 에서 안 일어난다).
3. 🔴 **천이 실물 천으로 나왔나 = 호리 니들펠트 충돌** — 바늘땀·실·보풀·직조 결·양모 질감이 하나라도 보이면 그 렌더는 버린다. 누비는 **그린 선**, 깃털은 **두 획**, 천은 **평칠 한 겹**이다.
4. 🔴 **두 색이 섞였거나 남의 영역에 들어갔나** — 따뜻한 색이 마루·창에, 찬 색이 이불 속에 있으면 밤의 축이 사라진다. 그늘에 회색·갈색을 섞어 놓았으면 그것도 실패다(**그늘은 맨 종이**).
5. 🔴 **p2 와 p12 를 나란히 놓고 본다** — 같은 각도인가, 좌우가 안 뒤집혔나, 침대가 같은 벽에 붙어 있나, 그리고 **p12 의 누비선이 정말 곧게 펴져 있나**. 이 넷 중 하나라도 어긋나면 착지가 없다.
6. **선이 덧그어졌나 · 얼굴이 죽었나** — 윤곽이 여러 번 그은 털선이면 g10(떨림 선)과 겹치고 이 권의 「자기 자리 주장」이 사라진다. 그리고 **p8 의 벌어진 입**과 **p10 의 둥근 눈**이 썸네일에서 읽히는지 본다 — 안 읽히면 시트를 다시 굽는다(§2.4).
