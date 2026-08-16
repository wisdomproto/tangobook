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
  THINGS PER PAGE = 2, Bung and the one thing Bung touches.

PALETTE: PAPER SHELL CREAM #F3ECDC, sky, light, everything unprinted · BLOCK1 RIVER #C08B3E, water,
  mud, wood, baskets · BLOCK2 LEAF #4A7247, cloth, palm, produce, hulls · OVERLAP SILT #3A4A2A,
  animal backs, leaf shade, night, anything submerged - never mixed, only overprinted · KEY INK #241F1A, outlines only, it never fills an area · ACCENT TEAL #1E8A8A, 🔴 TWO
  places and no third: Bung's nose-rope and the cord of the small bell on the little one's ankle -
  the two children are one set, so no adult and no other thing in the book ever carries it. No sky
  blue, no purple, no pink.

STAGE CLAUSES (the stage changes what the blocks do, not which blocks):
  MARKET - water is one RIVER area, every hull sits on top of it, sky bare PAPER, 0 clouds.
  BOAT INSIDE - planks RIVER, cloth LEAF, lamplight bare PAPER and the brightest thing on the page; a
    thing being looked for keeps its key outline while everything it hides among prints with 0 outline.
  CHANNEL AND LOW WATER - leaf shade is ONE flat OVERLAP area across the top and the water narrows to
    a RIVER band; where it has dropped it leaves a SILT band with a crisp edge.
  NIGHT - OVERLAP covers the sky as one flat area, the water stays RIVER, lights are unprinted PAPER,
    at most 5.

CHARACTER DESIGN LANGUAGE: animals are flat blocks with the key outline laid over. GRADE: bipedal,
  standing upright, forelimbs are HANDS with no hooves, the children in a short top and trousers and
  the two adults in a loose top and a round hat; a buffalo child's horns are two tiny buds. Backs
  and heads OVERLAP, chests and bellies RIVER.
  🔴 A BODY IS AN ASSEMBLY OF NAMED GEOMETRIC PIECES, AND THE ASSEMBLY IS WHAT TELLS THE SPECIES.
  Each animal is cut as half-circles, triangles, rectangles and discs butted together - a buffalo is
  a big rectangle trunk, a half-circle head and two bud triangles; a duck is a disc and a triangle
  bill. No piece is a rounded organic outline and none is softened where it meets the next; the
  colour blocks carry the pieces and the key block draws only where two pieces butt.
  🔴 A PIECE MAY BE RE-CUT, BUT NO PIECE IS EVER ADDED TO A FACE. Puffed cheeks, a swallowed breath
  or a full mouth are drawn by cutting the head piece as a WIDER half-circle for that page - the
  outline stays one clean arc and never grows an organic bulge. The count of pieces in a head is the
  same on all 250 pages.
  THE EYE IS ONE OF THE PIECES: a solid KEY-INK DISC sitting on the head piece, and in three-quarter
  or profile view ONLY ONE eye is cut, on the near side - the far eye is simply not there. Above it
  ONE short brow bar, cut as its own rectangle. The mouth is ONE curve. Feeling is in the mouth curve
  and the tilt of the brow bar; the disc never changes size. Bung is the smallest standing figure.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere.

NOT: no airbrush, gradient, glow or 3D render / no soft or feathered edge / no reflection, ripple or
  mirrored image on water / no outline printed in anything but the key black.
```

🔴 **컷에 붙일 때는 그 쪽 무대의 `STAGE CLAUSES` 한 조항만 붙인다** — 앵커 전문은 3,487자지만 조항 넷 중 셋을 빼면 실효 3,094자(관통 줄 포함 3,381)라 「그림 한 장 4,500」 예산 안이다. 한 시리즈 = 한 앵커 구조에서 앵커가 3,200 을 넘는 것은 무대를 다 덮기 때문이고, 그 초과분은 **한 쪽에 동시에 쓰이지 않는다**.

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

---

## §3. 🔴 설계·SCENE 과 충돌해 고친 자리 (2026-08-13 · 되돌리지 말 것)

| 무엇 | 옛 앵커 | 지금 | 근거 |
|---|---|---|---|
| **악센트 자리** | `ACCENT TEAL … nothing but Bung's nose-rope` | **청록은 두 곳** — 붕이 코끈 **+ 또리 발목 방울의 끈**. 어른도 다른 무엇도 안 지닌다 | 설계 §1 「형제 = 한 무리」. SCENE 은 **발목 방울을 140쪽**에 그려 두었고 13 p1 이 「한쪽 발목에 **청록 끈**으로 맨 작은 방울」로 색까지 못박았다. 🔴 **그 방울이 13권에서 또리를 찾는 유일한 단서**다(13 p1 「화면에 발과 방울뿐이라 방울이 유일하게 마감된 물건이 된다」 · 13 p9 「발목 방울이 그물 밖으로 나와 있다」) — 앵커대로면 단서가 **색을 잃어** 화면에서 안 읽힌다 |
| **옷** | `wearing loose light cloth, bare feet` | **아이는 짧은 윗옷과 바지 · 어른 둘은 헐렁한 윗옷과 동그란 모자** | 설계 §1. SCENE 도 어른을 **「헐렁한 윗옷」 25쪽 · 「동그란 모자」 27쪽**으로 가리킨다 — 어른과 아이를 가르는 유일한 표식이라 앵커에 없으면 넷이 같은 옷이 된다 |
| **손** | 없음 | `forelimbs are HANDS with no hooves` | 설계 §1 「앞발·발굽이라 쓰지 않는다」. SCENE 은 **손 216쪽 · 앞발 1쪽**. §8 등록부의 룰루(앞발/손 혼용)와 같은 자리 |
| **뿔** | 없음 | `a buffalo child's horns are two tiny buds` | 설계 §1 「뿔은 아기라 아주 작다」. SCENE 은 뿔을 **한 번도 안 부르므로**(0쪽) 안 적으면 모델이 어른 물소 뿔을 그린다 |

🔴 **`bare feet` 는 되살리지 않았다** — SCENE 이 맨발을 2쪽에서만 부르고, **11권이 통째로 신 한 짝이
물에 빠지는 이야기**(11 p3·p7·p8·p9)라 「늘 맨발」이 사실이 아니다. 신은 SCENE 이 부르는 쪽에서만 신는다.

**예산** — 3,208 → 3,487(실효 **3,094**, 다섯 앵커 중 여전히 가장 짧다). 걷어낸 것 = `DENSITY RATION = none.`
