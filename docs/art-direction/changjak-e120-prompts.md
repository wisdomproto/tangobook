# 창작동화 1000 — E-120 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`(§2.1 · §2.8 · §2.9 · §2.10 · §2.11 · §2.12 · §7.1~7.3 · §7.10), 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/e120.md`.** 아래 10컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다.
> 🔴 **이미지 생성은 여기서 하지 않는다.** 사용자가 GPT 로 굽는다. 🔴 **작가 실명은 한 글자도 안 들어간다** — 근거는 §1 판정에만 남기고 프롬프트는 전부 문구다.
> 🔴 **실행 순서**: ① 시트 4장을 **먼저** 굽는다(장면 금지, 순서 = 수달 → 생쥐 → 사물 → 창문 벽) → ② 승인 시트를 붙여 **p1(무대가 서는 쪽)** 과 **p5(세 박이 한 화면에 다 있는 쪽)** 두 장을 굽는다 → ③ 그 두 장을 ref 로 나머지 8컷. 순서를 어기면 인물만 매끈한 CG 로 나오고(§2.4), 벽이 「베네치아 배경 그림」이 되어 창문을 셀 수 없게 된다.

---

## E-120 §1. 앵커 배정

**권**: `lala-splash` (e120 · 10쪽 · 4~6세 · 주제군 **E 웃음·말놀이** · 엔진 **누적·반복** · 무대 베네치아 곤돌라 수로 · 주인공 수달 사공 + 생쥐 손님)

**한 줄**: 저채도 회청 무대 위에 **오려 붙인 무지 색면** + **채도 높은 것은 떨어진 물건 셋(빨강·파랑·노랑)뿐** + 🔴 **후렴 세 박이 각각 자기 도형을 갖는다**(입 타원 → 기울어진 사다리꼴 → 동심원). 앵커 슬러그 `changjak-canalsong` — **신규 민팅**.

**이 권이 그림에 요구하는 것(판정의 전제)** 넷이다.

① 🔴 **화면이 박자를 쳐야 한다.** 후렴이 「라라— 라랄라」(원인) → 「벌컥!」(중간) → 「첨벙!」(결과) 세 박 고정이고, note 가 「막 떨어지는 중이 아니라 **막 떨어진 직후**」로 통일해 둬서 **세 박이 한 프레임에 동시로** 들어가야 한다. 그림이 이 셋을 하나의 덩어리로 뭉개면 아이가 함께 외칠 자리가 사라진다.

② 🔴 **셀 수 있어야 한다.** 배 안에 1 → 2 → 5 로 쌓이고 **본문은 총계를 한 번도 말하지 않는다**(note). 세는 일은 전적으로 그림 몫이다. §2.11 이 정확히 이 경우를 위해 쓰인 원칙이다 — 회화 매체는 물건마다 빛·각도를 달리 그려 개수를 뭉갠다.

③ 🔴 **창문이 무대이자 사건이다.** 양옆이 통째로 창문 벽인 좁은 물길이고, note 가 「무대를 바꾸면 이 책은 성립하지 않는다」고 못 박았다. 그러면 **닫힌 창과 열린 창의 시각 차이**가 이 책에서 가장 중요한 도형 규칙이 된다(p5 = 셋이 동시에 열린다 → 셋인 게 즉시 읽혀야 한다).

④ 🔴 **넷째 사물이 하나 더 있다 — 모자.** p7 에서 떨어지는 것은 남의 물건이 아니라 제 모자다. 그런데 화면의 채도색은 이미 셋(빨강·파랑·노랑)이라 **모자를 넷째 채도색으로 두면 팔레트 규율이 무너지고 셋을 세는 일이 흐려진다.**

**후보 3.**

① 🔴 **C4 평면 형태 · 오려 붙인 무지 색면 + 인쇄 선 패턴(신규 앵커)** — 공정이 ②를 강제한다(같은 사각형을 여러 장 오리면 개수가 저절로 읽힌다). 그리고 ①을 도형으로 풀 수 있다 — 평면 언어에는 **형태 종류가 곧 어휘**라 「입 타원 / 기울어진 사다리꼴 / 동심원」 셋을 서로 다른 박자에 배당할 수 있다. ④도 해결된다 — 평칠은 **채도와 명도를 완전히 분리**할 수 있어서 모자를 「가장 밝은 것」으로만 잡을 수 있다. 리스크는 §2.8 — **C4 는 표정이 없다.** 대응: 이 권은 감정 서사가 아니라 자세·부지런함의 코미디이고(수달은 끝까지 모른다), 그래도 웃음이 나야 하므로 **입 타원 크기를 연기 장치로 승격**시켜 표정 부재를 정면 돌파한다(아래 §2 CHARACTER DESIGN).

② **C2 선 하나 캐릭터** (E 주제군 1순위) — 탈락 두 가지. 🔴 **이미 이 라인이 썼다**(g10 = 떨리는 잉크 선 + 평면 슬레이트 그늘). 라인 내 중복이 개별 최적보다 우선한다(§7.6 전례). 그리고 근거상으로도 약하다 — C2 는 **동물 한 마리가 화면을 지배**할 때 강한데, 이 책의 주인공은 사실 **무대**다(창문 벽·수로·쌓이는 물건). 선 하나 언어로 창문 스무 개를 그리면 선이 스무 번 흔들려 개수가 뭉개진다.

③ **C3 프린트-크래프트 · 리노컷** — §2.11 이 누적·반복 엔진의 1순위로 지목한 클러스터이고 형식 적합도는 최고점이다. 🔴 **그런데도 탈락**: A-11 「내가 안 그랬어」가 이미 C3 리노컷이고, **A-11 의 소재가 하필 「창문이 차례로 열리는 누적·반복」이다.** 클러스터·엔진·모티프가 셋 다 겹치면 두 권은 같은 책으로 보인다. 게다가 리노컷 2잉크로는 **빨강·파랑·노랑 셋을 동시에 못 쓴다**(공정상 잉크 판이 모자란다) — 이 권의 핵심 요구 ②가 원천 불가.

**🔴 추천 = 후보 ①.** 주제군 E 의 기준선 1순위는 C2 지만, ②의 「셀 수 있음」은 §2.11 의 엔진 요구이고 **엔진이 기준선을 이긴다**(A-11·tidepool 과 같은 논리). 그리고 이 권은 E 안에서도 **캐릭터 개그가 아니라 구조 개그**다 — 웃음이 「수달이 웃기게 생겨서」가 아니라 「같은 일이 세 번 일어나고 네 번째에 자기 차례가 와서」 나온다. 구조 개그의 그림체는 **구조가 보이는 그림체**여야 한다.

**근거 문법(직접 열람 확인, 2026-07-30)** — 넷을 컨택트 시트로 직접 봤다.
- `darme-coq`(BRAW 2025 Toddler 위너) — 🔴 **주 근거.** ⓐ **회청 그라운드가 채도를 눌러 놓고 그 위 도형만 채도**를 갖는다 = 우리 팔레트 구조 그대로. ⓑ **동심원 선 패턴**이 도형 위에 인쇄돼 있다 — 물결·모자 짜임·소리를 전부 이 하나의 선 문법으로 처리할 수 있다. ⓒ 원작 자체가 **소리·말놀이 책**(여러 나라 말로 우는 수탉)이라 후렴 구조와 형식이 이미 맞물려 있다.
- `au-blue-tomato`(WIA 2024 HC) — **반복 + 이례 하나**의 시각적 등가물. 같은 도형이 격자로 반복되다 하나만 다르면 아이가 즉시 찾는다. 우리 창문 벽(닫힘 격자 → 열린 하나)이 정확히 이 구조다. 평칠에 **결(grain)을 남긴** 처리도 가져온다(§2.1-3 물성).
- `gottwald-spinne`(BRAW 2023 Fiction) — 참고만. **소리를 흩뿌린 자국으로 그리는** 발상은 유효하나 🔴 **검정 바탕 + 사탕색 다색 + 굵은 윤곽선은 통째로 버린다**(우리는 채도 셋 규율 + 윤곽선 0).
- `karski-tutu`·`almeras-josephine` — 대담한 크롭이 스케일을 만든다는 것만 가져와 p6·p8 클로즈업에 쓴다.

**왜 새 앵커인가.** 이 라인의 기존 앵커 여섯 중 C4 는 **하나도 없다**(C6×3 = a01·a04·tidepool / C3×1 = a11 / C2×1 = g10 / C8×1 = a91). 클러스터가 비어 있고, 매체(오려 붙인 무지 색면)도 기존 여섯 중 어느 것과도 공정이 다르다 — 마른 왁스·흑연도 아니고, 젖은 워시도 아니고, 잉크 선도 아니고, 판을 파서 찍은 것도 아니다. **가장자리(cut edge)가 형태를 만드는** 유일한 앵커다.

**🔴 라인 충돌 확인 (§7.2 분리 규칙).**

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 완전 2D 평면. 양모·바느질·점토 없음 — NOT 절에 명시. 🔴 「오려 붙임」이 실물 공작으로 새지 않게 **무지 색면만**(질감지·천·사진 금지) 못 박음 |
| 전래동화 **점눈이** | ✕ (4축 전부 분리) | ① **종이색** — 점눈이는 밝은 크림(=햇빛), 여기는 **그늘진 회청 무대**(좁은 수로엔 해가 안 든다) ② **매체** — 느슨한 색연필 낙서가 아니라 **가위로 오린 평면 색면 + 인쇄 선 패턴**, 획이 아니라 가장자리가 형태를 만든다 ③ **얼굴** — 점눈 2 + 고정 실선 입이 아니라 **오려낸 흰 타원 안의 검은 원 + 크기가 변하는 입 타원**(입이 연기 장치인 게 결정적) ④ 🔴 **빨강의 성격** — 점눈이는 **매 화면 빨강 1점의 스타일 규칙**(즉석 발명 허용), 여기 빨강은 **딱 한 사물(양말)**이고 파랑·노랑과 **셋이 한 벌**이라 규칙 구조 자체가 다르다 |
| 창작동화 **A-11**(C3 리노컷 · 창문 누적) 🔴 최근접 | ✕ (5축) | ① 공정 — 잉크 2판 겹침 ↔ **무지 색면 여러 장 오려 얹음** ② 종이 — 오트지 흙색 ↔ 회청 ③ 자국 — 칼자국·눌림·긁힘 ↔ **가위의 미세한 흔들림** ④ 열린 창의 뜻 — A-11 은 검정 사각형 = **증거** ↔ 여기는 기울어진 사다리꼴 = **사건(방금 젖혀졌다)** ⑤ 악센트 구조 — A-11 은 테라코타가 **화면 절반의 바탕** ↔ 여기는 작은 세 점 |
| 창작동화 **g10**(C2) | ✕ | g10 = 떨리는 잉크 **선**이 주인공 + 흙빛 종이 + 빨강 0. 여기 = 선이 거의 없고 **면**이 전부 + 회청 + 채도 셋 |
| 창작동화 **tidepool · a91**(젖은 워시) | ✕ | 매체가 정반대. 저쪽은 물감이 번져 형태를 만들고, 여기는 **가장자리가 잘려** 형태를 만든다 |
| 창작동화 **a01 · a04**(마른 크레용·흑연) | ✕ | 저쪽은 종이결에 걸리는 획, 여기는 **획이 아예 없다** |
| 세계명작 **콜라주 그림풍** | ✕ | 그쪽은 다색 질감지·스크랩 콜라주. 여기는 🔴 **무지 색면 + 채도 3색 규율 + 도형 문법**(동심원·격자·사다리꼴)이라 룩이 안 겹친다. NOT 절에 「질감지·신문·사진·천 금지」 명시 |

**🔴 이 권에서 새로 확립한 규칙 두 개** (§7.10 에 등재)
1. **악센트가 이미 셋인 권에서 넷째 주인공 사물은 채도가 아니라 「명도」로 잡는다.** 밀짚모자 = 거의 무채도인데 **화면에서 가장 밝은 것**. 그러면 p1 의 심음(또렷한 모자)과 p7 의 회수(모자가 물로 내려간다)가 **팔레트를 안 깨고** 성립하고, 아이의 눈에는 두 체계(채도로 세는 것 / 밝기로 따라가는 것)가 섞이지 않는다.
2. **후렴이 세 박이면 도형도 세 종류로 나눈다** — 박자마다 전용 도형을 하나씩 배당하고 **그 도형을 다른 데 쓰지 않는다.** 그러면 여러 박이 한 프레임에 있어도 눈이 순서대로 걸어갈 수 있다. **후렴형 권 전체에 재사용할 것.**

**밀도 배급**(§2.10·§2.12): 10쪽 중 **p5 한 장**(창문 셋 + 레몬 셋 + 하이앵글). p6 은 **소품에만** 반쪽 슬롯 — 배 안 다섯 개가 각각 알아볼 수 있게(판정 문장: "물건 5개가 겹친 채로도 셋·하나·하나로 세어지나"). 나머지 여덟 쪽은 덜 그린다. 🔴 **벽을 다 그리면 열린 창이 안 보이고, 열린 창이 안 보이면 이 책은 없다.**

🔴 **대본과의 불일치 1건 — 그림에서 대본을 따른다.** 배정 지시서에 「p5 는 레몬 셋이 **공중에** 있다」는 문장이 있었으나, 대본 note 의 🔴 규칙(「떨어지는 중이 아니라 **막 떨어진 직후**로 통일 — 그래야 물보라와 앞발 뻗는 생쥐가 한 프레임에 동시로 들어간다」)과 p5 SCENE(「물 위에 노란 레몬 세 개가 각각 물보라를 일으키며 통통 떠 있고」)이 둘 다 **물 위**라고 말한다. **대본이 SSOT 이므로 물 위로 그린다.** 공중에 띄우면 그 쪽만 「진행 중」이 되어 열 쪽의 시제가 깨진다. 대신 붐빔은 **동심원 세 벌 + 열린 사다리꼴 셋 + 사방으로 튄 물방울**로 만든다.

---

## E-120 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-canalsong  (otter ferryman / narrow Venetian canal / a song that
                                    knocks things into the water)

Style: a hand-cut paper picture-book page for 4-6 year olds. Flat, crisp-edged, funny in
  RHYTHM and quiet in COLOUR. This book is a song with three beats that repeat, so the page
  itself has to keep time. Nothing here is soft, glossy or atmospheric.

MEDIUM: opaque flat colour CUT OUT WITH SCISSORS and laid down as overlapping pieces, the way
  a poster is built from separate sheets of plain coloured paper.
  - Every shape is made by a CUT EDGE. There is no drawn contour line around anything, and no
    edge is made by a brush running out or a wash drying.
  - The cut edges are crisp but very slightly uneven, the way scissors wobble - a human cut,
    never a perfect vector path.
  - Colour inside each piece is COMPLETELY FLAT: zero shading, zero gradient, zero highlight,
    zero drop shadow, zero glow. One piece may sit a step darker or lighter than the piece
    beside it, and that TONAL STEP is the only modelling that exists in this book.
  - A faint dry paper grain is visible inside the flat fills, so the colour reads as painted
    paper rather than as digital fill.
  - LINE exists only as PRINTED PATTERN laid on top of a flat piece: concentric arcs, thin
    parallel rules, and small repeated ticks. Pattern never outlines a shape.
  - 🔴 The paper being cut is PLAIN MATTE COLOURED STOCK. NOT photographs, NOT newsprint,
    NOT fabric, NOT marbled or textured craft paper, NOT anything three-dimensional.

🔴 THE THREE-BEAT SHAPE LANGUAGE - THIS IS THE IDENTITY OF THE BOOK.
  The refrain is always the same three beats in the same order:
      sing  ->  a shutter BANGS open  ->  something SPLASHES into the water.
  Each beat owns ONE shape, and that shape is used for nothing else:
    BEAT 1  SING   = an open MOUTH OVAL, solid dark, on the singer. 🔴 ITS SIZE IS THE VOLUME.
                     Two or three thin half-circle SOUND ARCS may spread upward from it.
    BEAT 2  BANG   = a TILTED TRAPEZOID - one shutter leaf thrown outward off the wall.
                     It is the only slanted shape in a wall built entirely of upright
                     rectangles, and its latch hangs loose as one small dark tick.
    BEAT 3  SPLASH = CONCENTRIC RINGS on the water where the thing landed, plus a scatter of
                     round drops cut from bare pale paper.
  🔴 When two or three beats appear on the same page they must ALL be readable AT ONCE, so the
    eye can walk mouth -> tilted shutter -> rings and read the whole refrain off one picture.
  🔴 NEVER invent a fourth shape family for emphasis: no starbursts, no speed lines, no impact
    stars, no motion blur, no musical notes.

PALETTE: a low-saturation cool stage carrying EXACTLY THREE saturated colours.
  The stage - both walls, all shutters, the water, the boat, and both animals - is desaturated
  grey-blue, chalky stone-cream, dull olive-green and near-black. Nothing on the stage is bright.
  Hex anchors: sunlit upper wall #C9C2B4 / shaded lower wall #8E9AA0 / deep shade #55636A /
    closed shutter #6E7A6A / open window interior #2B3338 / canal water #4F6B66 /
    ripple rule #7A968E / gondola black-brown #332C26 / pale paper #F2EFE6 /
    otter grey-brown #7C7468 / mouse pale grey #ADA79C.
  🔴 THE ONLY SATURATED COLOURS IN THIS WHOLE BOOK ARE THE THREE FALLEN THINGS:
       RED    #C8392B  = one sock
       BLUE   #2F6FA8  = one watering can
       YELLOW #E8B325  = three lemons
    They exist as those objects and NOWHERE ELSE. No red flowers, no red on the boat, no blue
    sky, no blue water, no yellow lamplight, no coloured washing on the lines, no terracotta
    pots. 🔴 A child has to count 1, then 1+1, then 1+1+3 sitting in the boat, so each of the
    three colours must stay unique, stay flat and stay the same colour on every page.
  🔴 THE STRAW HAT IS NOT A FOURTH COLOUR - IT IS THE BRIGHTEST VALUE.
    Dry straw #F0E6CC, almost unsaturated, and the LIGHTEST thing anywhere in the picture.
    Wet straw #D8CBA8 - one step darker, same hue, used from the page where it is fished out.
    The reader finds the loot by SATURATION and finds the hat by BRIGHTNESS, and the two
    systems never mix. Do not make the hat yellow, gold, orange or warm - if it competes with
    the lemons, both jokes break.

WINDOW GRAMMAR (the stage does most of the work in this book - build it exactly like this):
  Both walls of the canal are nothing but windows, stacked in rows.
  Build the wall as a GRID OF IDENTICAL UPRIGHT RECTANGLES so that the reader can count them.
  - CLOSED WINDOW = one dull olive-green rectangle lying FLUSH with the wall, flat, with two
    thin horizontal rules printed across it for louvres and one small dark tick for the latch.
    Every closed window is the SAME rectangle repeated at the same size.
  - OPEN WINDOW = that rectangle becomes a NEAR-BLACK EMPTY HOLE, and one shutter leaf swings
    out of the wall as a TILTED TRAPEZOID with its latch hanging loose.
    🔴 Open windows are the only tilted shapes and the only near-black holes on the wall, so a
    glance counts how many are open.
    🔴 NOBODY IS DRAWN INSIDE THE HOLE. It stays empty, or at most one small flat hand shape at
    its edge. Never add faces, figures, rooms or furniture behind the windows - the cast of
    this book is two animals and it stays two.
  - Between the windows: one or two laundry lines strung across the canal as a single thin
    rule with a few flat pale rectangles pegged to it; sills carrying grey stone pots with
    dull olive plants, and flat pale plates. 🔴 No terracotta, no bright washing, no flowers.
  🔴 The wall is a REPEATED PATTERN, not an architectural drawing. Never draw brickwork, never
    draw every stone, never vary the window design for visual interest.

MATERIAL TRANSLATION (🔴 keep it cut paper - never photographic, never plastic, never rendered):
  - WATER = one flat opaque teal-green piece. Ripples are thin lighter RULES printed on top,
    concentric where something fell and long horizontal elsewhere. NOT a mirror, NOT a glassy
    reflection, NOT an airbrushed gradient, NOT rendered caustics, NOT transparent.
  - REFLECTIONS = if anything reflects, it is the SAME cut shape flipped upside down and cut a
    step darker, sitting under the object. Never a rendered mirror image.
  - WET STONE WALL = the lower part of the wall is a separate darker piece cut with a straight
    horizontal top edge - that edge IS the tide line. Matte. NOT a specular sheen, NOT gloss.
  - STRAW HAT = a pale straw-coloured piece with three or four concentric arcs printed on it
    for the weave. 🔴 The hat is itself a small concentric shape, which is why it belongs to
    this book. Never render individual straw fibres, never make it shiny.
  - WOODEN GONDOLA = one long dark almost-crescent piece with two or three thin lighter rules
    printed along it for planking, and a flat pale toothed shape at the prow. 🔴 The prow
    piece is MATTE PAPER, not metal - no chrome, no shine, no gleam.
  - THE LONG OAR = one straight dark bar, no taper detail, no rendered wood.
  - LAUNDRY = flat rectangles with two ticks for pegs. Never draw folds or fabric texture.
  - SPRAY AND BUBBLES = small round pieces of the palest paper, cut and laid on. NOT white
    paint dots, NOT lens sparkle, NOT foam rendering.

COMPOSITION - THREE HORIZONTAL BANDS, and they are the same three every time:
  TOP BAND    = the window walls closing in from both sides. BEAT 2 happens here.
  MIDDLE BAND = the air of the narrow canal, kept almost empty. The thing has already fallen
                through it, so nothing hangs here - at most one thin dotted arc marking the
                path it took.
  BOTTOM BAND = the water and the long boat. BEAT 3 happens here.
  The bands may be tipped, compressed or cropped by the camera, but the reader should always
  be able to say which band they are looking at. Exactly two pages break the bands on purpose
  (the boat interior and the face close-up) and that break is the rest between verses.
  🔴 THE CANAL IS NARROW. The two walls squeeze the frame from both sides and the sky is a thin
  slot, never an open expanse. If the canal looks wide, the windows stop being able to reach
  the boat and the whole premise dies.
  Diagonals of the long boat and of the thrown shutters lead the eye. Never centre symmetrically.
  Keep the bottom 18% of the image quiet and free of key subject matter (a caption band is
  laid over it later).

FINISH HIERARCHY - read this twice. This is about how FINISHED each area is, NOT about opacity.
  1. THE TWO ANIMALS AND THE FALLEN THINGS = finished. Every cut piece in place.
  2. WHAT THEY TOUCH OR WHAT JUST HAPPENED on that page (the one open window, the boat under
     them, the rings on the water) = half-finished: the main pieces cut, no small detail.
  3. EVERYTHING ELSE = large plain cut fields with nothing described inside them. The far wall
     is two or three big pieces plus the repeated window rectangle. The far water is one piece.
  🔴 The empty wall is NOT faded, NOT hazy, NOT blurred and NOT out of focus. It is simply NOT
  DETAILED. A confident plain field of colour is correct; a soft atmospheric background is wrong.
  🔴 NEVER draw every brick, every roof tile, every laundry item, every ripple or every window
  louvre. If the wall is fully described, the tilted open shutter disappears into it and the
  reader can no longer see the BANG.
  🔴 DENSITY IS RATIONED TO ONE PAGE (the three-windows page). One other page gets a half
  ration, and it is spent ONLY on the objects piled in the boat - never on the walls.

CHARACTER DESIGN: both animals are assembled from cut shapes, and they act with exactly two
  moving parts.
  - EYES = a cut pale oval with a solid dark disc inside it. The disc's POSITION is the looking.
    🔴 The otter's disc is always at the FRONT of the eye, aimed down the canal ahead, or the
    eye is shut to a single curved line. It does not look up at the windows until the story is
    over. Everything that falls is seen by the mouse and by the reader only.
  - MOUTH = a solid dark oval on the otter whose SIZE IS THE SINGING VOLUME, running from a
    closed thin line, through a small oval, to an oval that takes up most of the head.
    🔴 This is the acting system. This book has no eyebrows, no blush and no drawn smile lines,
    so if the mouth oval is not doing the work, nothing is.
  Bodies are one flat mass plus separately cut limbs and tail; whiskers and the mouse's tail
  are single thin printed rules. Both animals stand on two legs and use their front paws as
  hands (rowing, reaching, holding a hat down). Neither ever goes on four legs.
  No dot-eyes on a bare face, no cheek blush, no glossy catchlight, no outline around anyone.

SETTING: a very narrow Venetian side canal - stone and stucco walls rising straight out of the
  water on both sides, rows of louvred wooden shutters, laundry lines crossing overhead,
  window sills with pots and plates, a low stone arch bridge ahead, worn steps and mooring
  posts at the waterline, and one long black gondola with a single standing rower.
  Northern Italian, early morning, sun only on the very top of the walls.
  NO canal-side crowds, NO tourists, NO boats other than this one, NO grand palazzo facades,
  NO open lagoon, NO bright holiday colour.

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT any lettering, numerals, house numbers, shop signs, boat names, posters or musical
  notes anywhere in the image (this book is published in five languages) / NOT drawn outlines
  around shapes / NOT digital airbrush / NOT smooth gradients / NOT drop shadows / NOT glossy
  3D CG render / NOT cel-shaded anime / NOT a paper-texture filter laid over flat digital
  colour (the CUT EDGE must make the shapes) / NOT photographic / NOT photo collage, NOT
  newsprint, NOT fabric, NOT marbled or patterned craft paper / NOT a glassy mirror water
  reflection / NOT rendered caustics or sparkle / NOT metal shine on the boat prow / NOT
  wet-plastic sheen on stone / NOT a fourth saturated colour beyond the sock, the can and the
  lemons / NOT a yellow, gold or orange hat / NOT terracotta pots / NOT people, faces or rooms
  visible inside the windows / NOT a wide open canal / NOT a fully rendered wall / NOT every
  brick, tile, louvre or ripple drawn / NOT a uniform finish across the page / NOT a hazy,
  blurry or faded background (that is blur, not un-detailed) / NOT wool felt, NOT stitched
  fabric, NOT sculpted clay, NOT anything three-dimensional (other lines own those) / NOT dot
  eyes and loose crayon scribble on warm cream paper with one red thing per page (that is
  another line).
```

**🔴 이 앵커의 네 불변 규칙 (매 컷 반복 확인)**

**규칙 A — 박자표.** 컷마다 `BEAT:` 줄을 **먼저** 읽는다. 그 쪽이 세 박 중 어디에 있는지, 어느 도형이 화면에 있어야 하는지가 거기 있다.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 |
|---|---|---|---|---|---|---|---|---|---|
| 박자 전(노 젓는 리듬만) | 들숨(1박 직전) | 🔴 1·2·3박 전부 | 1·2·3박 전부 | 🔴 1박 + **2박 ×3 + 3박 ×3** | 쉼(창문 안 보임) | 🔴 1·2·3박 전부 — **차례가 자기에게** | 🔴 **박자가 끊김**(입은 최대인데 아치 0) | 간주(박자 없음) | 🔴 1박만, 아주 작게(생쥐) |

**규칙 B — 창문 계수.** 컷마다 `WINDOWS:` 줄을 읽는다. 열린 창은 **기울어진 사다리꼴 + 새까만 구멍**이라 개수가 즉시 세어져야 한다.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 |
|---|---|---|---|---|---|---|---|---|---|
| 전부 닫힘 | 🔴 **전부 닫힘**(하나도 안 열렸다는 것이 이 쪽의 일) | 1 | 1(반대편 벽) | 🔴 **3(동시)** | 뱃전 너머로 몇 짝 잘려 보임 | 🔴 **1 — 수달 머리 높이** | 어깨 너머 1(초점 밖) | 프레임 밖 | 젖혀진 채 몇 · 다시 닫힌 것 몇 |

**규칙 C — 배 안 계수(누적).** 컷마다 `LOOT:` 줄을 읽는다. 🔴 **본문은 총계를 절대 말하지 않는다. 세는 일은 그림 몫이다.**

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 |
|---|---|---|---|---|---|---|---|---|---|
| 0(텅 빔) | 0 | 0 — 양말은 아직 **물 위** | **1**(양말) · 물뿌리개는 물 위 | **2**(양말·물뿌리개) · 레몬 셋은 물 위 | 🔴 **5**(1·1·3) | 5 · 모자는 물 위 | 5(프레임 밖) | 5 · 모자는 생쥐 앞발에 | 🔴 **5 — 하나도 줄지 않았다** |

**규칙 D — 모자(명도 최고점의 이동).** 컷마다 `HAT:` 줄을 읽는다. 🔴 **모자는 채도가 아니라 밝기로 잡히고, 그 밝은 점이 어디 있느냐가 이 책의 반전 전부다.**

| p1~p6 | p7 | p8 | p9 | p10 |
|---|---|---|---|---|
| 수달 머리 위 = 화면 최고 명도 | 🔴 **물 위로 내려갔다**(머리 위는 비었다) | 🔴 **화면에 거의 없다** — 아래 가장자리에 챙 한쪽만 | 젖은 짚빛(한 톤 어둡게)이 머리 위로 돌아온다 | 젖은 짚빛, 두 앞발이 꽉 눌러 잡았다 |

---

## E-120 §3. 캐릭터 시트 (🔴 이것부터 굽는다 — 순서대로)

```
CHARACTER SHEET - OtterFerryman   (bake this FIRST, before any scene)

🔴 THE SHEET IS BUILT IN THE SAME MEDIUM AS THE BOOK. Opaque flat colour cut out with scissors
  and laid down as overlapping pieces on a plain cool grey-blue ground. Cut edges slightly
  uneven, colour completely flat with a faint dry paper grain, no outline around anything, no
  shading and no shadow. Do NOT render this animal smoothly just because there is no scenery
  behind it. There is NO red, NO blue and NO yellow anywhere on this sheet.

FACE: no drawn face - the face is assembled.
  EYES = two cut pale ovals (#F2EFE6) each holding one solid dark disc (#2B2320).
    🔴 The disc sits at the FRONT of the oval, aimed forward down the canal. Alternate closed
    state = one curved dark line, no oval.
  MOUTH = one solid dark oval (#2B2320) low on the head. 🔴 ITS SIZE IS THE ENTIRE ACTING
    SYSTEM. Show it at five sizes on this sheet:
      shut       = a thin closed line
      clearing   = a small oval, about a quarter of the head width
      singing    = a medium oval, about half the head width
      belting    = a large oval, about two thirds of the head width
      frozen     = the largest oval, held open with NO sound arcs beside it (the song stopped
                   but the mouth has not caught up)
  NOSE = one small dark rounded triangle. WHISKERS = three thin printed rules each side.
  No eyebrows, no blush, no smile line, no catchlight. The mouth does everything.
HEAD & BODY: a cool grey-brown flat mass (#7C7468) with a paler muzzle piece (#9A9284) and a
  darker piece for the back (#5E574E). Round head, sloping shoulders, a low round belly, and
  one thick tapering tail cut as a separate piece that trails behind.
CLOTHES: a horizontally striped jersey - alternating bands of dull chalk white (#E6E2D7) and
  faded blue-grey (#7E8C95), the bands cut as separate strips so they step slightly out of
  line where they wrap the body. 🔴 The stripes are desaturated. Nothing worn is bright.
  Trousers = one plain dark piece (#4A4640), rolled at the ankle. Bare paws.
🔴 THE STRAW HAT: a pale straw piece (#F0E6CC) with three or four concentric arcs printed on
  it for the weave, a shallow crown and a wide flat brim, one worn dent in the brim edge.
  It is the LIGHTEST thing on this sheet and must stay the lightest thing in the whole book.
  🔴 It is NOT yellow, NOT gold, NOT orange, NOT warm. If it reads as a colour rather than as
  brightness, it will fight the three lemons and both jokes break.
  Include a WET version beside it: the same shape one step darker (#D8CBA8), the brim edge
  sagging slightly, with three round pale drops falling from the brim.
THE OAR: one long straight dark bar (#4A4038), taller than the otter, no carved detail.
BUILD & SILHOUETTE: an adult otter standing upright on two legs, about four and a half heads
  tall, always holding the oar with both front paws. Silhouette = wide flat hat brim + sloping
  striped body + long trailing tail + a straight bar crossing the body diagonally. Readable at
  thumbnail size and instantly distinct from the mouse.
REFERENCE SHEET: full-body side view rowing, leaning forward with the oar / three-quarter view
  standing tall with the chest pushed out and one paw thrown up toward the windows / full-body
  with both front paws clamped down on the hat brim, shoulders raised / head-only close-ups
  showing all five mouth sizes in a row, and one head with NO hat and both paws patting the
  bare top of the head. Plain cool grey-blue ground, no scenery, no red, no blue, no yellow.
SCENE token: OtterFerryman.
```

```
CHARACTER SHEET - MousePassenger   (bake SECOND, attach as @image2)

🔴 SAME MEDIUM AS ABOVE - cut flat paper pieces, uneven scissor edges, flat colour with faint
  grain, no outline, no shading. NO red, NO blue, NO yellow anywhere on this sheet.

FACE: EYES = two cut pale ovals with one solid dark disc each. 🔴 Unlike the otter, this
  animal's discs MOVE - up at the windows, down at the water, sideways at the otter. That
  difference is the joke: one of them is watching and one of them is not.
  MOUTH = a small dark oval, never larger than a third of the head. On the last page it is a
  tiny oval with two very small sound arcs - the smallest singing in the book.
  NOSE = one dark dot. WHISKERS = two thin printed rules each side.
BODY: a pale cool grey flat mass (#ADA79C) with a slightly darker back piece (#8C8880).
  EARS = two large plain circles cut a step darker, set high and wide - 🔴 they are the size
  landmark, so keep them big. TAIL = one long thin printed rule that curls.
CLOTHES: none, except a small plain slate waistcoat (#6E7A6A) with two dark dots for buttons.
BUILD & SILHOUETTE: small - about one third of the otter's height, standing on two legs and
  using both front paws as hands. Silhouette = round body + two big ear circles + one thin
  curling tail. Never mistakable for the otter at any size.
POSES THIS BOOK NEEDS (put them all on the sheet):
  sitting neatly on a small wooden stool with both paws on the knees /
  hanging over the boat's side with both front paws stretched down toward the water, tail
  straight out behind for balance /
  hauling something heavy with both paws, eyes squeezed shut, tail wrapped round the gunwale /
  standing in the middle of the boat with both paws thrown wide and the feet crossed, turning
  because too many things are landing at once /
  buried in a pile with only the head showing, one paw pushing something away /
  up on tiptoe with both paws stretched as high as they go, pressing something down.
🔴 NO PINK. The mouse is a COOL grey - a warm or pink mouse will start competing with the red
  sock and the counting breaks.
REFERENCE SHEET: all of the poses above at correct relative scale, plus one small silhouette of
  OtterFerryman beside them for size comparison. Plain cool grey-blue ground.
SCENE token: MousePassenger.
```

```
CHARACTER SHEET - CanalLoot   (bake THIRD, attach as @image3)

🔴 SAME MEDIUM - cut flat paper, uneven scissor edges, flat fills with faint grain, no outline,
  no shading, no shadow, no shine. These five objects carry the counting in this book, so each
  one has to be recognisable FROM SILHOUETTE ALONE at thumbnail size, and still countable when
  they overlap in a pile.

RED SOCK (falls first, then sits in the boat from that point on): one work sock, warm red
  #C8392B, flat, slumped so it folds once at the ankle. Two thin darker rules printed at the
  cuff. 🔴 It is a SINGLE sock - never a pair. Show it wet and slack, not stiff.
BLUE WATERING CAN (falls second): a small round-bellied can, deep blue #2F6FA8, with a long
  straight spout, a rose at the spout end shown as a plain disc with five printed dots, and one
  arched handle. Flat blue, matte. 🔴 No metal shine, no highlight, no rivets. Show a second
  version with a fan of pale water rules pouring from the spout.
YELLOW LEMONS (fall third, three of them): three ovals, warm yellow #E8B325, each with one tiny
  dark nub at the end. 🔴 Cut them at THREE SLIGHTLY DIFFERENT SIZES and angles so that three
  lemons never merge into one yellow blob when they overlap. This is the only place in the book
  where a count higher than one has to survive a pile.
THE STRAW HAT (falls fourth - the turn): pale straw #F0E6CC dry / #D8CBA8 wet, wide flat brim,
  shallow crown, three or four concentric weave arcs, one worn dent in the brim.
  🔴 PUT IT ON THIS SHEET NEXT TO THE OTHER THREE AND KEEP IT ALMOST COLOURLESS. The point of
  this sheet is that the reader can see, in one glance, that three of these things are found by
  COLOUR and the fourth is found by BRIGHTNESS. The hat must be the palest thing here and must
  never look yellow.
THE WHITE PLATE AND THE STONE POT (what the loot fell from): one plain pale disc, one plain
  grey stone pot with a dull olive plant. 🔴 No terracotta.
REFERENCE SHEET: the five objects in a row at correct relative scale, with a small silhouette of
  MousePassenger beside them for size (the watering can must read as bigger than the mouse);
  plus ONE PILE STUDY - all five heaped together in the bottom of a boat, overlapping, where a
  reader can still count one sock, one can and three lemons. Plain cool grey-blue ground.
SCENE tokens: RedSock, BlueCan, YellowLemons, StrawHat. Never write "the things" alone.
```

```
CHARACTER SHEET - WindowWall   (bake FOURTH, attach as @image4 - this is a STAGE sheet, not a
                                character, and the book does not work without it)

🔴 SAME MEDIUM - cut flat paper pieces, no outline, no shading, no perspective rendering.
  This sheet exists to fix ONE thing: the difference between a closed window and an open one.

CLOSED WINDOW (the default state, repeated dozens of times): one upright rectangle of dull
  olive-green #6E7A6A lying FLUSH with the wall, completely flat, with two thin darker
  horizontal rules printed across it for louvres and one small dark tick at the side for the
  latch. 🔴 Every closed window is THE SAME RECTANGLE at the same size. Do not vary them for
  interest - the repetition is what lets a child see when one changes.
OPEN WINDOW (the event): the same rectangle is now a NEAR-BLACK EMPTY HOLE #2B3338, and ONE
  shutter leaf has swung out of the wall as a TILTED TRAPEZOID in the same olive green, its
  latch hanging loose as a small dark tick, its outer edge catching the pale wall colour.
  🔴 It is the only slanted shape on the wall. 🔴 THE HOLE STAYS EMPTY - no face, no figure,
  no room, no furniture, no light inside. At most ONE small flat pale hand shape at the edge
  of the opening, and even that is optional.
WALL: two large plain pieces - a lighter upper band #C9C2B4 where the morning sun reaches, and
  a darker lower band #8E9AA0, with a separate darker strip #55636A cut with a straight
  horizontal top edge at the waterline (that edge is the tide line, not a painted stain).
  🔴 No brickwork, no individual stones, no stucco damage detail.
SILL FURNITURE: grey stone pots with dull olive plants, flat pale plates, and a laundry line
  drawn as one thin rule with three or four flat pale rectangles pegged to it.
  🔴 Nothing on a sill is bright, and nothing on a sill is red, blue or yellow.
REFERENCE SHEET: (a) a block of nine closed windows in a grid, all identical; (b) the same
  block with ONE window open, so the tilt and the black hole are obvious at thumbnail size;
  (c) the same block with THREE windows open at once; (d) a single open window seen from below
  at a steep angle, the trapezoid sweeping across the frame at head height; (e) a strip of wall
  at the waterline showing the tide-line edge, worn steps and one mooring post.
  Plain cool ground, no boat, no animals.
SCENE tokens: ClosedWindow, OpenWindow, WindowWall.
```

---

## E-120 §4. 10컷

각 컷은 `STYLE ANCHOR + @image1(수달) + @image2(생쥐) + @image4(창문 벽) + 아래 블록` 으로 합성한다. 물건이 나오는 p3~p10 은 `@image3(CanalLoot)` 를 추가로 붙인다. 🔴 **p1 과 p5 를 먼저 굽고 승인한 뒤 나머지를 그 두 장을 ref 로 굽는다.**

### p1 — 좁은 물길, 텅 빈 배 (무대 ref)
```
BEAT: before the song. No mouth oval, no tilted shutter, no rings - the only rhythm in the
  picture is the oar and the long line of the boat. This page has to feel QUIET so that the
  first BANG lands.
CAMERA: wide, child's eye level right down at the surface of the water, so the boat runs
  across the frame low and the two walls tower and lean in from both sides.
SUBJECT: right of frame at the prow, OtterFerryman stands on two legs with both front paws on
  the long oar, body leaning forward, tail stretched straight back. Mouth = the CLOSED thin
  line, but the eyes are pleased - the discs forward, aimed down the canal. Left of frame at
  the stern, MousePassenger sits on a small wooden stool with both paws on its knees, head
  turned, ears up, looking at the walls.
SETTING: a very narrow canal. Stone and stucco walls rise straight out of the water on both
  sides and squeeze the frame; the sky is a thin bright slot far up. A low stone arch bridge
  sits ahead with brighter water beyond it. The water is one flat teal-green piece with three
  or four long horizontal ripple rules and the boat's flipped darker shape beneath it.
WINDOWS: 🔴 ALL CLOSED. Rows of identical olive rectangles flush with both walls, every latch
  in place. Laundry lines cross overhead. Nothing is tilted anywhere in this picture.
LOOT: 🔴 NONE. The bottom of the boat is empty, bare dark planking - and it must read as
  deliberately empty, because everything is going to pile up there.
HAT: on the otter's head, and it is the LIGHTEST shape in the frame. Place it where nothing
  else pale sits near it.
FINISH: both animals and the boat finished. The nearest window rows and the waterline strip
  half-finished. Everything else - the upper walls, the far bridge, the far water - is large
  plain cut fields with the window rectangle repeating and nothing else described.
TONE: early morning. Sun only on the very top band of the walls; the whole lower canal is in
  cool shade. Bright slot of sky above and bright water beyond the arch, so the boat reads as
  drifting from shade toward light.
```

### p2 — 창문은 하나도 안 열려 있다 (들숨)
```
BEAT: the in-breath, one beat before the song. 🔴 Nothing has happened yet, and the picture's
  job is to make the reader expect a BANG.
CAMERA: medium, slightly low angle looking UP at the otter from the water, with the wall of
  closed windows rising steeply behind and above it.
SUBJECT: centre, OtterFerryman has tucked the oar under one arm, chest thrown out, one front
  paw at its throat and the other flung up and open toward the windows above, presenting them.
  Mouth = the SMALL "clearing" oval. Eyes squeezed to curved lines with pride.
  Lower right, MousePassenger sits on the stool with its head tipped all the way back, discs
  rolled up at the top of the eyes, one ear folded back.
SETTING: the wall fills the top two thirds of the frame, stacked rows of windows receding
  upward. Laundry lines and a few pale pegged rectangles cross above. Sills carry grey stone
  pots and flat plates. The flipped darker shapes of the closed windows lie on the water below.
WINDOWS: 🔴 EVERY WINDOW IS CLOSED AND THIS IS THE POINT OF THE PAGE. A grid of identical
  olive rectangles, every latch tick in place, nothing tilted, no black holes. The reader
  should be able to count a dozen shut windows and find no exception anywhere.
LOOT: none. Boat still empty.
HAT: on the head, tipped back a little by the proud posture. Still the brightest shape.
FINISH: the otter finished. The nearest column of windows and the sill objects half-finished.
  The upper wall is the repeated rectangle on two plain fields - no brickwork, no shutters
  drawn in detail, no sky detail.
TONE: low even morning shade with the sun still only at the very top. Because the low angle
  makes the otter big and the wall bigger, the emptiness above it should feel loaded.
```

### p3 — 첫 벌컥 · 빨간 양말 (세 박이 처음으로 한 화면에)
```
BEAT: 🔴 ALL THREE BEATS, VISIBLE AT ONCE, and this page teaches the reader how to read the
  rest of the book. Eye path must run: mouth oval (upper right) -> tilted shutter (upper left)
  -> concentric rings on the water (lower centre). Lay the three out along one clear diagonal.
CAMERA: medium wide, eye level. The freshly opened window sits upper left, the boat lower right.
SUBJECT: right, OtterFerryman rows with the mouth at the MEDIUM "singing" oval and two thin
  sound arcs spreading up from it, head tipped happily to one side, tail swung to one side on
  the beat. 🔴 ITS EYE DISCS STAY FORWARD - it does not look up at the window. Centre,
  MousePassenger is off the stool, belly on the gunwale, both front paws stretched down toward
  the water, tail straight out behind for balance, discs locked on one point in the water.
SETTING: the canal continues; the far walls are plain fields. On the water, one RedSock has
  just landed - three concentric rings spreading out from it and a scatter of round pale drops
  thrown up around it.
WINDOWS: 🔴 EXACTLY ONE OPEN, upper left. Near-black hole plus one tilted trapezoid shutter
  swung out with its latch hanging loose. The laundry line beneath it is still swinging. Every
  other window on both walls is the same closed rectangle. Nothing else is tilted.
LOOT: 🔴 ZERO IN THE BOAT. RedSock is still in the water, and it is the first saturated colour
  the book has shown - it must be the strongest colour note on the page.
HAT: on the head, brightest value, and it should sit in the picture clearly enough that the
  reader registers it again (it comes back on the seventh page).
FINISH: the two animals, the open window and the rings finished. The boat and the swinging
  laundry line half-finished. The rest of both walls is the repeated rectangle on plain fields.
TONE: the open window and the red sock are the two loudest things; press every other window
  darker and flatter so the one tilted shutter jumps out.
```

### p4 — 저쪽 창문 · 파란 물뿌리개 (누적 1 → 2)
```
BEAT: all three beats again, in the same order but MIRRORED across the canal - this time the
  shutter is on the opposite wall. 🔴 The repetition is the joke, so keep the three shapes
  identical to the previous page and change only where they sit.
CAMERA: medium, low angle from close to the water, looking up at the mouse hanging over the
  side, with the opposite wall's open window above and behind it.
SUBJECT: lower centre, MousePassenger has both hind feet hooked on the gunwale and its body
  stretched down over the water, both front paws dragging BlueCan up by its handle, teeth set,
  eyes squeezed shut, tail wrapped round the gunwale. Upper right and behind, OtterFerryman
  keeps rowing with the mouth at the MEDIUM singing oval and two sound arcs, eye discs forward
  down the canal.
SETTING: the water fills the lower half. BlueCan is half sunk with a fan of pale water rules
  pouring from its spout, one ring set still spreading. Above, the far wall.
WINDOWS: 🔴 EXACTLY ONE OPEN, on the OPPOSITE wall from the previous page - black hole, one
  tilted trapezoid, loose latch. On the sill beside it, the plain gap where the can stood, with
  one small ring of soil left behind. All other windows closed.
LOOT: 🔴 ONE IN THE BOAT - RedSock lies in the bottom of the boat, clearly visible, and it must
  stay the same red as the page before. BlueCan is still in the water.
HAT: on the head. Even in a low-angle page with the sky behind, keep the hat the lightest
  shape - if the sky slot goes brighter than the hat, darken the sky, not the hat.
FINISH: the mouse, the can and the water around it finished. The boat's edge and the sock
  half-finished. The wall above is plain fields with the repeated window rectangle.
TONE: the low viewpoint should make the watering can look almost as big as the mouse. Blue and
  red sit close together low in the frame, so the bottom of the picture is where the eye goes.
```

### p5 — 창문 셋이 한꺼번에 · 레몬 셋 (🔴 밀도 배급 · 세 박 최대 · 판 ref)
```
BEAT: 🔴 THE BIGGEST BAR IN THE SONG. One mouth oval at its LARGEST, THREE tilted shutters, and
  THREE separate sets of concentric rings. This is the page the reader shouts along with, so
  all seven shapes must be countable at a glance: 1 mouth, 3 tilts, 3 ring sets.
  🔴 This page doubles as the anchor's DENSITY reference plate.
CAMERA: wide, high angle from the height of the open windows, looking steeply down into the
  canal so the three open shutters on the upper wall and the whole boat below are in one frame.
SUBJECT: lower centre, MousePassenger stands in the middle of the boat with both front paws
  thrown wide, feet crossed mid-turn, ears splayed, mouth a small open oval - it cannot decide
  which way to go. Lower right, OtterFerryman sings at its loudest: mouth at the LARGEST oval,
  three sound arcs, eyes shut to curved lines, head thrown back, the oar-holding paw bouncing
  on the beat. 🔴 Still not looking up.
SETTING: the canal seen from above, narrow between its two walls. On the water lie THREE
  YellowLemons, cut at three slightly different sizes and angles, each with its own set of
  concentric rings, the three ring sets overlapping into each other. Round pale drops scatter
  around all three.
WINDOWS: 🔴 EXACTLY THREE OPEN, along the upper wall - three near-black holes and three tilted
  trapezoids in a row, latches swinging. On one of the sills, a pale plate is tipped and empty.
  Every other window on both walls stays the same closed rectangle so the three read instantly.
LOOT: 🔴 TWO IN THE BOAT - RedSock and BlueCan lie in the bottom of the boat, both clearly
  separate and clearly the same colours as before. The three lemons are still in the water.
HAT: on the head, seen from above as a full pale disc - at this angle it is the brightest shape
  in the picture and it should read as a small bright circle among all the counting.
FINISH: 🔴 DENSITY IS SPENT HERE. Both animals, all three lemons, all three ring sets and all
  three open windows are finished. The boat and the tipped plate are half-finished. 🔴 The two
  walls and the far water stay the emptiest surfaces in the book - plain fields with the
  repeated window rectangle. Density on this page means MORE COUNTABLE OBJECTS, never a more
  described wall.
TONE: the highest, most open light of the book so far - the sun has reached further down the
  walls. Three yellows on dark green water are the brightest colour event in the ten pages.
```

### p6 — 배 안이 꽉 찼다 (쉼 · 소품 반쪽 슬롯)
```
BEAT: 🔴 THE REST BETWEEN VERSES. No tilted shutter, no rings - and the band structure is
  broken on purpose (we are inside the boat). The only beat shape present is the otter's mouth,
  and it is at the SMALL oval because it is talking, not singing.
CAMERA: medium close-up, eye level, pulled right in on the inside of the boat so the gunwales
  crop both sides of the frame.
SUBJECT: centre, MousePassenger is wedged in the pile with only its head and one paw showing,
  pushing BlueCan away with that paw and clutching one YellowLemon with the other, ears
  flattened, mouth a small pleading oval, discs turned up toward the otter. Right and behind,
  OtterFerryman leans on the oar and turns back to look, one front paw raised with a single
  claw up - "one more song". Eyes bright, mouth the SMALL oval, whiskers up.
  🔴 The two postures must read as exact opposites in one frame: one body says stop, one says
  again.
SETTING: the bottom of the boat, dark planking with a shallow pool of water gathered in it and
  a few round pale drops. Over the gunwale, cropped, a slice of wall with part of one open
  window.
WINDOWS: only a cropped slice above the gunwale - part of one tilted shutter, enough to say the
  wall is still there. Do not compose a countable row on this page.
LOOT: 🔴 FIVE, AND THIS IS THE PAGE WHERE THE READER COUNTS THEM. RedSock (1), BlueCan (1) and
  YellowLemons (3) lie tangled in the bottom of the boat. 🔴 They overlap, but every one stays
  separately countable - cut the three lemons at different sizes and angles so they never merge
  into one yellow mass. Judgement question for this page: can a child point at each of the five?
HAT: on the head, pushed back a little by the turn. Still the lightest shape - keep the pale
  drops in the boat smaller and duller than the hat.
FINISH: 🔴 HALF RATION, SPENT ONLY ON THE FIVE OBJECTS. Both animals and the five objects
  finished. The boat planking and the pooled water half-finished. The cropped wall above is one
  plain field with one window shape.
TONE: close, crowded, warm-ish in value only (still no warm hue) - the picture should feel
  tight and full after the wide-open page before it.
```

### p7 — 창문이 모자를 툭 쳤다 (🔴 차례가 자기에게)
```
BEAT: 🔴 ALL THREE BEATS, the fourth time and the last - and the shapes are the same as the
  first three times, which is exactly why the switch works. Mouth at its LARGEST with three
  sound arcs, ONE tilted shutter, ONE set of rings on the water. The reader shouts SPLASH
  before noticing what fell.
CAMERA: medium wide, low angle from close to the water looking up along the wall, so the thrown
  shutter and the top of the otter's head lie on one line.
SUBJECT: centre, OtterFerryman has its neck stretched forward and up, chest swelled, eyes shut
  to curved lines, mouth at the LARGEST oval with three sound arcs rising. 🔴 THE TOP OF ITS
  HEAD IS BARE - the hat has just been knocked off and the animal has no idea. Lower left,
  MousePassenger has climbed up onto the pile, both front paws clapped over its own mouth, eyes
  wide - the discs are down at the water.
SETTING: the boat runs tight along the right-hand wall. On the water beside the boat, StrawHat
  has just landed brim up, one clean set of concentric rings spreading round it and pale drops
  thrown out.
WINDOWS: 🔴 EXACTLY ONE OPEN, right of frame - and it is open at HEAD HEIGHT, its tilted
  trapezoid sweeping out across the frame at exactly the level the otter's head just passed
  through, latch still swinging. 🔴 The shutter and the bare head must sit on one readable line
  so the cause is visible without a single word.
LOOT: five in the boat, unchanged, visible along the bottom of the frame. The hat is in the
  water and is NOT loot yet.
HAT: 🔴 THE BRIGHTEST SHAPE HAS MOVED. It is no longer on the head; it lies on the dark water
  as a pale disc at the centre of the rings, and it is the lightest thing in the picture. The
  empty top of the head is now the darkest part of the otter. 🔴 Do not put any other pale
  object near the hat on this page.
FINISH: the otter, the thrown shutter, the hat and its rings finished. The mouse and the boat
  half-finished. Both walls stay plain fields with the repeated rectangle.
TONE: everyone in the picture knows except the one who is singing. Build that by putting the
  brightest shape (hat) and the widest-open shape (mouth) at opposite ends of the frame, with
  the tilted shutter on the line between them.
```

### p8 — 머리 위가 허전하다 (박자가 끊긴 자리)
```
BEAT: 🔴 THE BEAT BREAKS. The mouth oval is still at its LARGEST - held open, caught - but
  there are NO SOUND ARCS beside it at all. That absence is the silence. No tilted shutter in
  focus, no rings. The band structure is broken on purpose (this is the second and last time).
CAMERA: close-up, slightly high angle, on the otter's head and the paws on top of it. The
  narrowest framing in the book.
SUBJECT: centre, OtterFerryman is frozen with the mouth still hanging open at full size, both
  front paws laid flat on the bare top of its head, patting. The eye discs are rolled UP - the
  first time in the book its eyes leave the canal ahead - and the whiskers droop. A few strands
  of head fur stick up as three thin printed rules.
SETTING: over the shoulder, a plain slice of wall with one tilted shutter shape kept simple and
  undescribed; the oar lies slanted under one arm, forgotten.
WINDOWS: one, over the shoulder, reduced to a plain tilted shape - do not make it countable
  here, this page is about a face.
LOOT: five, out of frame. Do not try to include them.
HAT: 🔴 ALMOST GONE FROM THE PICTURE - only one edge of the pale brim enters at the very bottom
  of the frame, floating. The brightest thing in the book has been pushed to the border, and
  that is the whole composition of this page.
FINISH: the head and the two paws finished. The oar and the shoulder half-finished. Everything
  behind is one or two plain cut fields with nothing described.
TONE: the head is the lightest-valued area and everything around it is pressed down and simple,
  so the page feels as quiet as the missing sound. 🔴 No new colour anywhere.
```

### p9 — 젖은 모자를 푹 씌워 준다
```
BEAT: the interlude - no beat shapes at all. No sound arcs, no tilted shutter, no rings. The
  song is over and the picture is doing one physical action instead.
CAMERA: medium close-up, eye level, the two animals overlapping in the middle of the boat.
SUBJECT: left, MousePassenger stands on top of the pile, up on tiptoe with both front paws
  stretched as high as they go, pressing the soaked StrawHat down onto the otter's head, tail
  straight out behind for balance, mouth curled into a small pleased oval. Right,
  OtterFerryman has bent its knees to lower its head, eyes squeezed shut to curved lines,
  shoulders hunched, mouth back to the CLOSED thin line.
SETTING: inside the boat. Water runs off the brim as three or four thin pale rules and gathers
  into round pale drops at the whiskers and the nose tip; the shoulders are cut a step darker
  where they are soaked. A shallow pool sloshes in the bottom of the boat.
WINDOWS: out of frame.
LOOT: five, at their feet - RedSock, BlueCan and the three YellowLemons, still separately
  countable under the mouse's stool of a pile.
HAT: 🔴 THE WET VERSION - one step darker than dry, sagging slightly at the brim. It is back on
  the head and it is still the lightest shape on the page, but visibly duller than it was on
  the first page. That single tonal step is how the reader knows it has been in the canal.
FINISH: the two animals and the hat finished. The pile under them and the falling drops
  half-finished. The boat and everything past the gunwale are plain fields.
TONE: the two heads meeting is the lightest area of the picture; press the rest down gently.
  Keep the drops crisp and countable rather than atmospheric.
```

### p10 — 다시 한 소절, 아주 작게 (착지)
```
BEAT: 🔴 BEAT 1 ONLY, AND IT IS TINY. One small mouth oval on the MOUSE with two very small
  sound arcs. There is no tilted shutter yet and no rings yet - 🔴 and the whole joke is that
  the reader knows they are coming. Leave the top band with room for them.
CAMERA: medium wide, slightly high angle from behind and above, following the boat as it slides
  toward the low arch bridge ahead.
SUBJECT: front of the boat, OtterFerryman has the oar tucked under one arm and 🔴 BOTH FRONT
  PAWS CLAMPED DOWN ON THE HAT BRIM, pulling it hard onto its head, shoulders up around its
  ears, whiskers stiff, mouth a closed line, and 🔴 THE EYE DISCS SLID ALL THE WAY TO ONE SIDE,
  UP AT THE WINDOWS - the first and only time in the book it looks up. Behind it,
  MousePassenger sits among the five objects with both front paws cupped at its mouth, singing
  a tiny oval with two small arcs, eyes crescent with mischief.
SETTING: the canal opening out slightly toward a low stone arch, bright water beyond it. The
  water carries long horizontal ripple rules and the boat's flipped darker shape.
WINDOWS: 🔴 A MIXED WALL - a few shutters still hang out as tilted trapezoids with black holes
  behind them, and a few have gone back to being closed rectangles. That mix says the street is
  still loaded. Do not open a new one on this page.
LOOT: 🔴 FIVE, AND NOT ONE HAS BEEN REMOVED. RedSock, BlueCan and the three YellowLemons sit in
  the boat exactly as before, all five countable. 🔴 Nothing is tidied, nothing is returned,
  nobody has learned anything.
HAT: the wet version, one step darker, clamped down under two paws. Still the lightest shape in
  the frame, and now it is being held.
FINISH: both animals, the five objects and the hat finished. The near water and the boat
  half-finished. The walls, the arch and the far water are plain cut fields with the repeated
  window rectangle.
TONE: brighter ahead through the arch, cooler and quieter behind. 🔴 Warmer here means a paler,
  more open grey - NOT a warm hue, NOT golden light, NOT sunset. The last page is the single
  most likely place for a fourth colour to break the palette.
```

---

## 첫 렌더 검수 체크리스트 (6항목)

> 사용자가 GPT 로 뽑은 뒤 이걸로 판정한다. 🔴 **하나라도 걸리면 문구를 늘리지 말고 ref 를 바꿔라**(§5.1 — 문구로 세 번 실패하면 레버가 틀린 것이다).

| # | 볼 것 | 실패 시 처방 |
|---|---|---|
| 1 | 🔴 **p5 에서 세 박이 각각 다른 도형으로 보이나** — 입 타원 1 · 기울어진 사다리꼴 3 · 동심원 세 벌. 눈이 위 → 가운데 → 아래로 걸어갈 수 있나. 이게 이 책의 핵심 판정이다 | p5 를 다시 굽는다. 세 박이 안 갈리면 나머지 8컷을 굽지 마라 — 도형 문법이 확정되기 전에 뽑은 컷은 전부 버리게 된다 |
| 2 | 🔴 **열린 창을 셀 수 있나.** 닫힌 창이 전부 같은 사각형인가, 열린 창만 기울어져 있고 안이 새까만가. p2 에서 「하나도 안 열렸다」가 한눈에 읽히나 | 벽을 더 비운다(벽돌·창살·빨래를 그리면 사다리꼴이 묻힌다). 그래도 안 되면 **WindowWall 시트의 (b)(c) 판을 ref 로 다시 붙인다** |
| 3 | 🔴 **배 안에서 다섯을 셀 수 있나**(p6·p10). 레몬 셋이 노란 덩어리 하나로 뭉쳤으면 실패 | CanalLoot 시트의 **PILE STUDY** 를 ref 로 붙이고, 레몬을 「세 개의 서로 다른 크기·각도」로 다시 못 박는다. 개수를 문장으로 반복해도 안 된다 |
| 4 | 🔴 **모자가 노랑이 됐나.** 레몬과 같은 계열로 보이면 실패 — 그 순간 채도(세는 것)와 명도(따라가는 것) 두 체계가 섞인다 | 모자를 **한 단계 더 탈색**해 굽고, 렌더에서 레몬 옆에 모자를 나란히 놓고 본다. 2회 실패면 **모자만 있는 승인 컷을 ref 로 먼저 확보**하고 p7 을 마지막에 굽는다 |
| 5 | **네 번째 채도색이 샜나.** 빨간 화분·파란 하늘·노란 등불·컬러 빨래가 하나라도 있으면 실패 | PALETTE 의 "no fourth saturated colour" 뒤에 **실제로 샌 사물을 이름으로** 못 박고 재시도. 특히 테라코타 화분과 p10 노을이 1순위 |
| 6 | 🔴 **평면이 유지됐나.** 그림자·그라데이션·윤곽선·물 거울 반사·뱃머리 금속 광택이 보이면 MATERIAL TRANSLATION 실패 | 문구 튜닝 금지. **가위 자국과 평칠이 살아 있는 승인 컷 1장을 확보해 ref 로 고정**하고 나머지를 그 뒤에 뽑는다 |

부수 1: **창문 안에 사람이 그려졌나** — note 가 「창문 안쪽 사람을 그리면 쪽마다 인물이 늘어난다」고 금지했다. 얼굴이 하나라도 보이면 그 컷은 버린다.
부수 2: **수달이 위를 봤나**(p3~p7) — 눈동자가 위로 갔으면 이야기가 통째로 뒤집힌다. 눈 위치는 시트 문제이므로 장면이 아니라 **OtterFerryman 시트를 다시 굽는다**(§2.4).
