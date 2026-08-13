# 붕이네 물 위 장터 — 앵커

> 창작동화 **시리즈 11** (25권 · 아시아 첫째). 명단 = `docs/changjak-books/_series-slate-asia.md`
> 대발이형 · 아기 물소 붕이 + 아주 어린 동생 · 무대 = 넓은 흙탕 강의 물 위 장터
> 🔴 **이미지 생성은 여기서 하지 않는다.** 프롬프트까지가 이 문서의 일이다.
> 🔴 **한 시리즈 = 한 앵커.** 25권의 무대 차이는 §1 의 `STAGE CLAUSES` 조항 한 줄로 처리한다.

---

## §1. 앵커 — `bung-woodblock`

```
STYLE ANCHOR - bung-woodblock   (Bung's floating market / colour blocks first, the key block last)

Style: folk woodblock printing on cream shell-sized paper, TWO colour blocks, one small accent block
  and one black key block, 4-6 year old picture book. Each colour block is one flat opaque area from a
  carved plank and the plank's grain stays visible inside it. The key block carries EVERY
  outline and prints LAST, on top of the colour. Unprinted paper is not white space, it is the sky
  and the light. SHADING IS ZERO - no modelling, gradient, cast shadow or highlight.

RENDERING (finish hierarchy): 🔴 THE KEY BLOCK LANDS ONE HAIR OFF THE COLOUR ON EVERY PAGE - colour
  creeps past the outline on one side of a shape and falls short on the other, on at least 4 shapes
  per page, every slip running the SAME direction. Water is ONE unbroken RIVER area, never lighter or darker inside itself, 0 ripples, 0 glints; a floating thing prints whole on top with its outline showing, and 🔴 A SUNKEN THING
  IS OVERLAP WITH RIVER PRINTED OVER IT AND NO OUTLINE AT ALL. Repeats are capped: boats behind at
  most 6, each ONE silhouette with 0 interior marks · fruit at most 9 of one carved shape; no repeat is a mirrored copy of its neighbour. FINISHED
  THINGS PER PAGE = 2, Bung and the one thing Bung touches. DENSITY RATION = none.

PALETTE: PAPER SHELL CREAM #F3ECDC, sky, light, everything unprinted · BLOCK1 RIVER #C08B3E, water,
  mud, wood, baskets · BLOCK2 LEAF #4A7247, cloth, palm, produce, hulls · OVERLAP SILT #3A4A2A,
  animal backs, leaf shade, night, anything submerged - never mixed, only overprinted · KEY INK #241F1A, outlines only, it never fills an area · ACCENT TEAL #1E8A8A, nothing
  but Bung's nose-rope. No sky blue, no purple, no pink.

STAGE CLAUSES (the stage changes what the blocks do, not which blocks):
  MARKET - water is one RIVER area, every hull sits on top of it, sky bare PAPER, 0 clouds.
  BOAT INSIDE - planks RIVER, cloth LEAF, lamplight bare PAPER and the brightest thing on the page; a
    thing being looked for keeps its key outline while everything it hides among prints with 0 outline.
  CHANNEL AND LOW WATER - leaf shade is ONE flat OVERLAP area across the top and the water narrows to
    a RIVER band; where it has dropped it leaves a SILT band with a crisp edge.
  NIGHT - OVERLAP covers the sky as one flat area, the water stays RIVER, lights are unprinted PAPER,
    at most 5.

CHARACTER DESIGN LANGUAGE: animals are flat blocks with the key outline laid over. GRADE: bipedal,
  standing upright, wearing loose light cloth, bare feet. Backs and heads OVERLAP,
  chests and bellies RIVER. Eyes are two solid dots set wide apart; a small dark nose; the mouth is
  ONE curve; above each eye ONE short brow line. 🔴 FEELING IS CARRIED BY THE MOUTH CURVE AND THE TWO
  BROW LINES - the eyes only open or close, their size NEVER changes, nothing crosses a face. Bung is the smallest standing figure.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow or 3D render / no soft or feathered edge / no reflection, ripple or
  mirrored image on water / no outline printed in anything but the key black.
```

🔴 **컷에 붙일 때는 그 쪽 무대의 `STAGE CLAUSES` 한 조항만 붙인다** — 앵커 전문은 3208자지만 조항 넷 중 셋을 빼면 실효 ~2710자라 「그림 한 장 4,500」 예산 안이다. 한 시리즈 = 한 앵커 구조에서 앵커가 3,200 을 넘는 것은 무대를 다 덮기 때문이고, 그 초과분은 **한 쪽에 동시에 쓰이지 않는다**.

**관통 줄** (매 쪽)

```
OFF:   the key block slips one hair off the colour, the same direction all page, never on a face
SUNK:  a thing under the water has no outline - that absence is the only way sinking is drawn
HOLD:  the little one is touching Bung or inside Bung's reach, on every page, with no exception
```

---

## §2. 왜 이 공정인가

- **물이 길이라 떨어뜨리면 가라앉는다**(슬레이트 §무대). 가라앉음을 그림자·왜곡으로 그리면 AI 가 무너지는
  구간(상하 반전·물에 비친 상, `_ANCHOR-SPEC` §첫 렌더 ①)에 들어간다. 🔴 **윤곽판이 안 닿는 것**으로
  옮겨 놓으면 같은 뜻이 **판 하나를 빼는 것**으로 나온다 — 모델이 못 하는 기하가 한 번도 안 필요하다.
- **어긋남이 곧 손자국이다.** 실크스크린(01)은 색면만 있고 윤곽이 없어 어긋남이 안 보인다. 여기는 윤곽판이
  마지막이라 **모든 쪽에서 어긋남이 보인다** — 두 시리즈를 한 눈에 가르는 축이 이것 하나다.
- 🔴 **얼굴에서만 판이 맞는다.** 대발이형은 속상함·부끄러움이 사건의 절반이라 얼굴이 흔들리면 이야기가
  죽는다. 「어긋남」을 매체 정체로 두되 얼굴만 예외로 못박아 그림체가 이야기를 제약하지 않게 했다.
- 옷은 「더운 데서 입는 헐렁한 옷 · 맨발」까지만 적었다. 특정 전통복 이름·명절·의례는 넣지 않는다.
