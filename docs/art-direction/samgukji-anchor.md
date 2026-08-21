# 탱고북 삼국지 — 스타일 앵커 (수묵 산수 위의 2.5등신 치비)

> 🔴 **출처는 우리 자산이다** — `C:/projects/threekingdoms`(영걸전형 SRPG)에서 이미 렌더까지 나온 하우스 스타일을
> 그림책으로 옮긴 것이다. 그 프로젝트의 `docs/art/asset-board.html` 의 `STYLE`·`COMMON`·`NEGATIVE` 상수와
> 뿌리는 `threekingdoms` 게임 프로젝트의 「세미SD 4등신」이었다. 🔴 **등신은 4 → 5.5 → 2.5 로 두 번 뒤집혔다.**
> 4등신 시안이 「유비가 애 같다」로 돌아와 5.5로 올렸는데, 그건 오진이었다 — 밋밋함의 원인은 등신이 아니라
> **채색**(평평한 색면·그림자 한 단)이었고, 사용자 레퍼런스는 2.5등신인데도 멋있었다. 🔴 **등신을 돌리기 전에
> 마감을 먼저 의심하라.**
> 🔴 **굽는 도구 = GPT 이미지 생성. nano-banana(Gemini)로 굽지 마라**(2026-08-21 실측).
> 같은 프롬프트를 둘에 넣어 유비 시트를 나란히 받았다. nano-banana = **4.5~5등신**에 사실적으로
> 늘어난 얼굴, 평평한 색면 — 앵커가 「실패」라고 적어 둔 그림이 그대로 나왔다. GPT = 큰 머리·작은
> 이목구비·비단 자수와 갑옷 미늘까지, 앵커가 요구한 그림. 🔴 **프롬프트를 의심하기 전에 어느 모델로
> 구웠는지 먼저 확인하라** — 나는 등신·형용사·문구 배치를 원인으로 짚었는데 셋 다 헛다리였다.
>
> 🔴 **앵커는 캐릭터 시트를 다시 말하지 않는다** — 개체 규격 SSOT 는 `samgukji-cast.md`.
> 규격 = `_ANCHOR-SPEC.md`(hex 필수 · 글자 금지 · NOT 4항 이하 · 형용사 대신 개수 상한 · 캡션 여백 금지).

## 왜 이것인가 — 후보 셋을 폐기한 이유

앞서 겹침 회피를 이유로 후보 셋(그림자극·연환화 평칠·형지 염색)을 만들었는데, **셋 다 렌더가 하나도 없는
설계도**였다. 반면 이 스타일은 하우스 스타일 등록 조건을 **이미 다 채우고 있다**:

| 등록 조건 | 이 스타일 |
|---|---|
| ① 시장 검증 문법에 뿌리 | 삼국지 SRPG 하우스 스타일로 27스테이지 분량이 굴러갔다 |
| ② 캐릭터 디자인 언어까지 한 몸 | 붉은 얼굴 관우 + 시그니처 무기 체계가 딸려 온다(등신만 2.5로 낮췄다) |
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

STYLE: A picture book for 7-9 year olds retelling the Three Kingdoms.
🔴 DETAILED PAINTERLY CHIBI (SD, ~2.5 heads) figures, East Asian ink-wash + soft cel shading, crisp
readable silhouette, muted earth tones with gold and jade accents, clean even lighting.
THE WORLD IS INK-WASH LANDSCAPE AND THE PEOPLE ARE LAID ON IT. Calligraphic linework, rice-paper
texture in the washes, wide empty space.

RENDERING (finish hierarchy)
- 🔴 TWO LAYERS, FINISHED DIFFERENTLY. BACKGROUND = wet ink wash on warm paper: hills, pines, mist,
  sky; 0 outlines, drying into bare paper. FIGURES = fine ink line that THINS AND SWELLS with the
  form, watercolour laid in graded washes, 2-3 steps of shadow, and a hard highlight on metal only.
- 🔴 THE FIGURE IS PAINTED, NOT FILLED IN. Cloth folds; armour scales and lacing are drawn one by
  one; embroidery and gold run along collar, cuff and hem. 🔴 A flat shape of colour is the failure.
- FINISHED THINGS PER PAGE = 2 - the person the page is about, and the one thing they handle.
- NAMED FIGURES IN FRONT = at most 3. 🔴 CROWDS ARE NOT PEOPLE: ONE silhouette repeated 12-40
  times, paler as it recedes, dissolving into mist.
- BACKGROUND OBJECT COUNT = at most 6 named things per page. Everything else is wash and bare paper.
- 🔴 MIST IS THE ERASER: distance is paler, not smaller; the far third of a wide shot dissolves into
  the paper. No hard horizon behind a figure.
- DENSITY: only battle, market and court may fill the frame. Every other keeps AT LEAST HALF the
  frame as wash or bare paper.

PALETTE (muted earth, sampled from the house renders)
paper #F0E2C0 · ink #2B2B2B · olive-green #485A48 · pale jade #5A6C5A · ochre #D8B46C ·
mustard #6C6C48 · leather brown #5A4836 · deep brown #483624 · skin #D8B4A2.
ACCENTS, USED SPARINGLY: vermilion #B8352A · gold #C9A227 · jade #6E8F7A.
🔴 KERCHIEF YELLOW #E8B233 IS THE REBEL HOST'S AND NOBODY ELSE'S. Book 1's hero fights that host:
yellow on him reads as one of them. It happened once in test; do not put it back.

CHARACTER DESIGN LANGUAGE
- 🔴 EVERY PERSON IS CHIBI AT ~2.5 HEADS. Big head, short legs, small blunt hands, heavy boots.
  It never changes with rank or age.
- 🔴 SMALL EYES ON A BIG HEAD - this is what separates a grown warrior from a cute mascot. The eye
  is at most a fifth of the face width, the brow above it THICK AND ANGLED, the beard full size.
  🔴 Big round eyes turn every one of these men into a child. The head is the childlike part, not
  the face on it.
- 🔴 THE FACE COLOUR IS THE CASTING AND NEVER CHANGES - not with light, weather or age. 🔴 WHICH
  tone, and every other value for that person, comes from their CHARACTER SHEET.
- Features are drawn, not signed: lid line, iris, one catchlight; the brow a shaped stroke; the nose
  a ridge. 0 blush marks, 0 anime sweat drops, 0 star sparkles.
- 🔴 FEELING IS CARRIED BY THE WHOLE BODY: it leans, plants its feet wide, throws its arms out.
- 🔴 TEST: fill the figure solid and rub out the inside. What is left must be that person from the
  sheet, or the figure is wrong.

CANVAS
16:9 double-page spread. 🔴 NO lettering, numerals, signage or captions anywhere in the image, in any
script. No caption band - the picture runs to all four edges. Light is warm and low, from one side.
🔴 THE SKY IS NEVER BLUE: it is the warm paper, washed ochre where the sun is.


NOT (rendering only)
airbrushing, glossy 3D, cel-shaded anime or manga screentone · photobash or photographic texture ·
🔴 Koei-style / Dynasty-Warriors-style character illustration, and Japanese sengoku armour ·
outlines on the landscape washes.
```

## 첫 시험 — 이 셋을 먼저 굽는다

🔴 **쪽 컷을 뽑기 전에 캐릭터 시트 세 장을 먼저 굽고 승인받는다.** 순서를 뒤집으면 시트가 최종 그림을 못 지배한다.

1. **관우** — 붉은 얼굴이 이 등신에서도 성립하는가(이 매체의 핵심 주장, 게임 SD 에서는 성립했다)
2. **장비** — 삐죽삐죽한 수염 윤곽이 큰 머리에서 뭉개지지 않는가
3. **유비** — 큰 귀가 큰 머리에 묻히지 않는가(🔴 가장 위험한 조합)

그리고 **배경 한 장**(1권 p15 복사꽃 동산)을 따로 구워 두 층이 한 화면에서 겹치는지 본다.

### 렌더를 받으면 이것만 본다

| 볼 것 | 실패 신호 |
|---|---|
| **두 층이 갈리는가** | 배경에 윤곽선이 생겼거나 인물이 워시로 풀렸으면 실패 — 한 층으로 뭉갠 것 |
| **2.5등신인가** | 머리 높이 × 2.5 = 전신 높이(머리가 키의 40%). 4 이상이면 게임 초상 트랙으로 샌 것 |
| **얼굴이 칠해졌는가** | 평평한 색면이면 실패 — 옷 주름·갑옷 미늘·자수가 하나하나 그려져야 한다 |
| **얼굴색이 배역을 말하는가** | 관우가 살빛이면 실패 |
| **실루엣만 남겼을 때 누구인지 아는가** | 모르면 시트가 틀린 것이다 |
| **하늘이 파란가** | 파랗면 실패 — 이 책의 하늘은 따뜻한 종이다 |
| **먼 곳이 안개로 풀리는가** | 딱딱한 지평선이 인물 뒤에 그어져 있으면 실패 |

⚠️ **법적 라인은 그 프로젝트에서 그대로 물려받는다** — 코에이 그래픽·일러스트 스타일 모방 금지, 「영걸전」
명칭 금지, 독자 브랜딩 필수. NOT 절에 넣어 두었다.

⚠️ **수상작 레퍼런스는 아직 안 붙었다.** `_SERIES-ANCHORS.md` 에 시리즈 16 행을 추가할 때
`award-styles-20y.json` 의 `character` 필드로 하나 고른다 — 그 표가 생긴 이유가 「레퍼런스 없이 만든 앵커
15개의 얼굴이 하나로 수렴한 사고」다.
