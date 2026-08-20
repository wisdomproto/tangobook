# 탱고북 삼국지 — 스타일 앵커 (수묵 산수 위의 4등신)

> 🔴 **출처는 우리 자산이다** — `C:/projects/threekingdoms`(영걸전형 SRPG)에서 이미 렌더까지 나온 하우스 스타일을
> 그림책으로 옮긴 것이다. 그 프로젝트의 `docs/art/asset-board.html` 의 `STYLE`·`COMMON`·`NEGATIVE` 상수와
> 「세미SD 4등신」 옵션이 뿌리다.
> 🔴 **앵커는 캐릭터 시트를 다시 말하지 않는다** — 개체 규격 SSOT 는 `samgukji-cast.md`.
> 규격 = `_ANCHOR-SPEC.md`(hex 필수 · 글자 금지 · NOT 4항 이하 · 형용사 대신 개수 상한 · 캡션 여백 금지).

## 왜 이것인가 — 후보 셋을 폐기한 이유

앞서 겹침 회피를 이유로 후보 셋(그림자극·연환화 평칠·형지 염색)을 만들었는데, **셋 다 렌더가 하나도 없는
설계도**였다. 반면 이 스타일은 하우스 스타일 등록 조건을 **이미 다 채우고 있다**:

| 등록 조건 | 이 스타일 |
|---|---|
| ① 시장 검증 문법에 뿌리 | 삼국지 SRPG 하우스 스타일로 27스테이지 분량이 굴러갔다 |
| ② 캐릭터 디자인 언어까지 한 몸 | 세미SD 4등신 + 붉은 얼굴 관우 + 시그니처 무기 체계가 딸려 온다 |
| ③ **자기참조 ref 확보** | 🔴 **초상 107장 · SD 시트 · 씬 배경이 이미 렌더돼 있다** — 유일하게 「대기」가 아닌 안 |
| ④ 즉발 매력 | 사람이 보고 고른 스타일이다 |

🔴 **교훈** — 새로 민팅하기 전에 우리 자산부터 찾았어야 했다. 겹침 회피 규칙이 「없는 것을 만들라」로 읽혀서
이미 있는 것을 지나쳤다.

## 실측 — 스타일이 실제로 무엇인가

렌더에서 뽑은 값이다(추측이 아니라 픽셀).

- **두 층으로 되어 있다.** 배경 = **젖은 수묵 산수**(황토 하늘·먹 소나무·안개·넓은 여백) / 인물 = **굵은 먹
  윤곽 + 평면 채색의 세미SD**. 두 층의 마감이 다르므로 「눈은 가장 마감된 것으로 간다」가 저절로 성립한다.
- **관우의 얼굴은 실제로 붉다** — SD 시트 실측 `#6C4836` 계열. 얼굴색 축(`samgukji-cast.md`)이 이 스타일에서 성립한다.
- **팔레트는 탁한 흙빛이다** — 올리브 녹 `#485A48`·`#5A6C5A` / 황토·겨자 `#D8B46C`·`#6C6C48` / 가죽 갈
  `#5A4836`·`#483624` / 살빛 `#D8B4A2` / 먹 `#363636`~`#141414`.

## STYLE ANCHOR

```
STYLE ANCHOR - samgukji-inkwash-sd

STYLE: A picture book for 7-9 year olds retelling the Three Kingdoms. THE WORLD IS PAINTED AS EAST
ASIAN INK-WASH LANDSCAPE; THE PEOPLE ARE DRAWN AS SEMI-DEFORMED FIGURES LAID ON IT. Calligraphic
linework, muted earth tones, rice-paper texture in the washes, wide empty space. NOT photorealistic,
NOT anime-cel, NOT a 3D render.

RENDERING (finish hierarchy)
- 🔴 TWO LAYERS, FINISHED DIFFERENTLY. BACKGROUND = wet ink wash on warm paper: hills, pines, mist and
  sky in soft washes, 0 outlines, drying into bare paper. FIGURES = clean ink outline of even weight,
  flat colour fill, ONE step of soft shading. A figure is always the most finished thing on its page.
- FINISHED THINGS PER PAGE = 2 - the person the page is about, and the one thing they handle.
- NAMED FIGURES IN THE FOREGROUND = at most 3. 🔴 CROWDS AND ARMIES ARE NOT DRAWN AS PEOPLE: ONE
  silhouette repeated 12-40 times, smaller and paler as it recedes, dissolving into the mist.
- BACKGROUND OBJECT COUNT = at most 6 named things per page. Everything else is wash and bare paper.
- 🔴 MIST IS THE ERASER: distance is drawn paler, not smaller; the far third of a wide shot dissolves
  into the paper. No hard horizon line behind a figure.
- DENSITY RATION: only battle, market and court pages may fill the frame. Every other page keeps AT
  LEAST HALF the frame as wash or bare paper. The scene brief names which page is which.

PALETTE (muted earth, sampled from the house renders)
paper #F0E2C0 · ink #2B2B2B · olive-green #485A48 · pale jade #5A6C5A · ochre #D8B46C ·
mustard #6C6C48 · leather brown #5A4836 · deep brown #483624 · skin #D8B4A2.
ACCENTS, USED SPARINGLY: vermilion #B8352A · gold #C9A227.
🔴 KERCHIEF YELLOW #E8B233 BELONGS TO THE REBEL HOST ALONE. The only other yellow of that value in
the book is Liubei's waist sash.

CHARACTER DESIGN LANGUAGE
- 🔴 EVERY PERSON IN THIS BOOK IS 4 HEADS TALL - semi-deformed: large head, compact heroic body,
  never babyish. The proportion never changes with rank or age.
- 🔴 THE FACE COLOUR IS THE CASTING AND IT NEVER CHANGES - not with light, weather or age. A face
  carries one steady tone. 🔴 WHICH tone, and every other value for that person, comes from their
  CHARACTER SHEET, not from here.
- Eyes = two strokes and a filled pupil; brows = one stroke, and they carry the expression. Mouths
  are small. 0 blush marks, 0 sparkle highlights, 0 sweat drops.
- 🔴 FEELING IS CARRIED BY THE WHOLE BODY: the figure leans, plants its feet wide, throws its arms out.
- 🔴 TEST: fill any figure solid and rub out the inside. What is left must be that person from the
  character sheet. If the silhouette does not say who it is, the figure is drawn wrong.

CANVAS
16:9 double-page spread. 🔴 NO lettering, numerals, signage or captions anywhere in the image, in any
script. No caption band - the picture runs to all four edges. Light is warm and low, from one side.
🔴 THE SKY IS NEVER BLUE: it is the warm paper, washed ochre where the sun is.

STAGE CLAUSES (carry only the clause that page needs)
- VILLAGE/MARKET: thatched roofs and a fence in wash, one pine, an earth road; ground = one wash band.
- PALACE/COURT: repeated pillars and roof brackets receding into mist.
- FIELD/BATTLE: hills and mist above; below, the repeated silhouette host and a few banners.
- ROAD/JOURNEY: one road, one or two pines, the rest wash and bare paper.

NOT (rendering only)
airbrushing, glossy 3D, cel-shaded anime or manga screentone · photobash or photographic texture ·
🔴 Koei-style / Dynasty-Warriors-style character illustration, and Japanese sengoku armour ·
outlines on the landscape washes.
```

## 첫 시험 — 이 셋을 먼저 굽는다

🔴 **쪽 컷을 뽑기 전에 캐릭터 시트 세 장을 먼저 굽고 승인받는다.** 순서를 뒤집으면 시트가 최종 그림을 못 지배한다.

1. **관우** — 붉은 얼굴이 4등신에서도 성립하는가(이 매체의 핵심 주장, 게임 SD 에서는 성립했다)
2. **장비** — 삐죽삐죽한 수염 윤곽이 4등신 큰 머리에서 뭉개지지 않는가
3. **유비** — 큰 귀가 4등신 큰 머리에 묻히지 않는가(🔴 가장 위험한 조합)

그리고 **배경 한 장**(1권 p15 복사꽃 동산)을 따로 구워 두 층이 한 화면에서 겹치는지 본다.

### 렌더를 받으면 이것만 본다

| 볼 것 | 실패 신호 |
|---|---|
| **두 층이 갈리는가** | 배경에 윤곽선이 생겼거나 인물이 워시로 풀렸으면 실패 — 한 층으로 뭉갠 것 |
| **4등신인가** | 5등신 이상이면 게임 초상 트랙으로 샌 것 · 2.5등신이면 아기가 된다 |
| **얼굴색이 배역을 말하는가** | 관우가 살빛이면 실패 |
| **실루엣만 남겼을 때 누구인지 아는가** | 모르면 시트가 틀린 것이다 |
| **하늘이 파란가** | 파랗면 실패 — 이 책의 하늘은 따뜻한 종이다 |
| **먼 곳이 안개로 풀리는가** | 딱딱한 지평선이 인물 뒤에 그어져 있으면 실패 |

⚠️ **법적 라인은 그 프로젝트에서 그대로 물려받는다** — 코에이 그래픽·일러스트 스타일 모방 금지, 「영걸전」
명칭 금지, 독자 브랜딩 필수. NOT 절에 넣어 두었다.

⚠️ **수상작 레퍼런스는 아직 안 붙었다.** `_SERIES-ANCHORS.md` 에 시리즈 16 행을 추가할 때
`award-styles-20y.json` 의 `character` 필드로 하나 고른다 — 그 표가 생긴 이유가 「레퍼런스 없이 만든 앵커
15개의 얼굴이 하나로 수렴한 사고」다.
