# twins — 캐스트 규격

> 시리즈 06 「쌍둥이네 바닷가」. 앵커 = [twins-anchor.md](twins-anchor.md) · 설계 = [_design.md](../changjak-books/twins/_design.md) · 경로표 = [twins-routes.md](twins-routes.md)
> 🔴 **`##` 제목은 영문 별칭 그대로** — `build-series-html.mjs` 가 이 문자열로 찾아 시트 프롬프트에 넣는다.
> 🔴 **`##` 아래에 쓴 것은 전부 프롬프트로 나간다.** 해설은 이 머리말에만 쓴다.

## 🔴 이 시리즈만의 조건 — 둘은 같아야 하고 넷은 갈려야 한다

다른 시리즈의 신고(「가족들이 너무 비슷하게 생김」)와 **문제가 반대 방향으로 하나 더 있다.**
리리·롤로는 **쌍둥이라 얼굴이 같게 그려지도록 설계돼 있다** — 앵커의 축이
`erlbruch-bigq`(ALMA 2017)의 **「얼굴이 아니라 소품 두 개로 캐릭터가 성립한다」**를 가져온 것이라,
얼굴을 갈라 해결하는 길이 **원천적으로 막혀 있다.** 그래서 이 파일이 하는 일은 둘이다.

```
쌍둥이 둘  같게 두는 것을 못 박는다 (키·몸집·머리 크기·얼굴·색·배 얼룩·손발) —
           갈리는 것은 소품 하나와 귀 방향 하나뿐이고, 그 둘이 사라지는 쪽이 없어야 한다
어른 둘    실루엣을 통째로 갈아 준다 — 여기가 실제로 안 갈려 있던 자리다
```

### 정작 안 갈려 있던 것은 어른 둘이었다

고치기 전 앵커의 어른 규격은 **두 문장이 같은 형식**이었다.

| | 있던 것 | 문제 |
|---|---|---|
| 아빠 | 「쌍둥이 두 배 키 + 제일 넓은 인물 + 검정 장화」 | **크기와 옷뿐**이다 |
| 엄마 | 「쌍둥이보다 머리 하나 큰 + 파란 앞치마」 | 같은 형식, 값만 다르다 |

그리고 그 바로 앞줄에 **`so every animal is built the same way`** 가 있었다 — 다른 시리즈에서
「어른이 그냥 큰 아이가 됐다」를 만든 문장과 같은 종류다. 색 규칙(등·머리 OVERLAP / 배 INK2)을
말한 문장인데 **몸까지 같게 만들라는 말로 읽힌다.** 앵커에서 그 줄을 색 이야기로 못 박고,
아래 규격이 **몸 셋(드럼 · 기둥 · 땅콩)**을 나눈다.

| | 통째로 까맣게 칠했을 때 | 소품 둘 | 눈 |
|---|---|---|---|
| **리리** | 작은 땅콩 + **위로 뻗은 뾰족한 둘** + 그 사이 혹 | 노란 모자(맨 위) · 선 귀 | 큰 **선** 타원 |
| **롤로** | 같은 땅콩 + **머리 양옆으로 늘어진 귓자락**(머리 폭 1.5배) + 발치의 뭉툭한 둘 | 노란 장화(맨 아래) · 늘어진 귀 | 같은 눈 |
| **아빠** | **드럼** — 어깨가 제 키의 절반, 팔이 윤곽 밖으로 안 나온다, 밑이 굵은 원통 둘로 잘림 | 파란 털모자 · 검정 장화 | 좁은 **누운** 타원 |
| **엄마** | **기둥** — 좁고 곧고, 가슴~무릎 아래가 **다리 틈 없는 한 판** | 파란 앞치마 · 등 뒤 나비 매듭 | 좁은 누운 타원 |
| **고양이** | 유일한 **사족** · 등이 한 줄 · 꼬리가 윤곽의 3분의 1 | 없음(옷 0) | — |

🔴 **어른과 아이는 크기 말고 셋으로 갈린다** — ①**머리 폭 ÷ 어깨 폭**(아이 1.0 · 아빠 0.45 · 엄마 0.8)
②**목**(아이 없음 · 엄마 보임) ③**눈 모양**(아이 = 선 큰 타원 + 맨 종이 흰자 / 어른 = 누운 좁은 타원).
③은 앵커의 캐릭터 축(얼굴은 소품이 대신한다)을 안 깨면서 쓸 수 있는 유일한 얼굴 값이다 —
**쌍둥이 둘 사이에서는 쓰지 않는다.**

🔴 **엄마의 앞치마는 무늬가 아니라 윤곽이다.** 다른 시리즈에서 넷 중 엄마만 갈렸던 이유가
「옷이 윤곽을 통째로 바꿨다」였고, 거기서는 그게 **규격에 없어서** 다시 뽑으면 사라질 것이었다.
여기서는 규격이다 — **다리 사이 틈이 없는 유일한 인물**.

### 🔴 승인 렌더에서 가져온 것 · 안 가져온 것 (2026-08-17 실물 확인)

다섯 장 다 이미 굽혀 있다(R2 `comic-assets/twins-plan/{riri,lolo,dad,mom,cat}`). 실물을 보고 판단했다.

- ✅ **눈이 맨 종이 타원 + 어두운 동공**이었다 — 앵커는 「눈은 OVERLAP」이라고 썼는데 **머리도 OVERLAP**
  이라 그대로 그리면 눈이 없어진다. 모델이 알아서 푼 것이라 **다시 뽑으면 사라진다** → 앵커에 못 박았다.
- ✅ **롤로 귀가 머리 양옆으로 늘어져 있었다**(앵커 문구는 「목 뒤로 눕는다」). 정면에서 살아남는 건
  렌더 쪽이다 → 앵커를 렌더에 맞췄다.
- ✅ **아빠가 파란 뜨개 모자를 쓰고 있었다** — 규격에 없던 것이다. 그런데 아빠에게 소품이
  검정 장화 하나뿐이라 **머리 실루엣이 리리와 같아지는** 문제가 있었고, 모자가 그걸 푼다 → 규격으로 올렸다.
- ✅ **엄마 앞치마가 무릎 아래까지 내려와 다리 틈을 지우고 등 뒤에서 나비로 묶였다** → 규격으로 올렸다.
- ⚠️ **쌍둥이 둘을 나란히 놓은 실루엣 검사는 아직 한 번도 안 돌았다.** 앵커 §2 의 넷 한 장 시트에는
  그 검사 줄이 있는데, **실제로 구워진 다섯 장은 인물 한 명짜리 시트**(`sheetPrompt`)라 검사가 들어갈
  자리가 없다. 리리 시트와 롤로 시트를 나란히 놓고 사람이 봐야 한다.

🔴 **SCENE 250쪽은 한 글자도 안 고쳤다.** SCENE 은 이미 넷을 `Riri rabbit`(195쪽) ·
`Lolo rabbit`(191) · `Dad rabbit`(21) · `Mom rabbit`(16) · `Harbor cat`(11) 토큰으로 부르고,
쪽마다 **노란 모자 / 노란 장화 / 검정 장화 / 파란 앞치마**를 붙여 준다. 아래 규격은 그 넷을
지우지 않고 **몸을 덧댄 것**이다.

---

## Riri rabbit

```
SHE AND LOLO ARE ONE BODY DRAWN TWICE - identical height, identical build, identical head size,
identical face, identical colour, identical INK2 belly patch, identical hands and feet. Nothing
below is a difference in her body; it is a difference in what her body does and what it carries.
EARS: her two ears STAND STRAIGHT UP, close together, parallel, and half again as tall as her head
  is high. This is the mark that survives a back view, a bath, a blanket, a pure silhouette and a
  lost hat, so it is drawn on every single appearance without exception.
YELLOW: one small round HAT sits at the base of those ears, so her yellow is the HIGHEST thing in
  her silhouette. It is the only yellow she carries and she carries no other cloth.
WEIGHT: her weight is on her BACK foot, her feet are together and her head never leans out past her
  toes. BOTH HANDS ARE ALWAYS BUSY WITH EACH OTHER - held together at the chest, or holding one
  single thing up in front of her face to look at it. Her hands do not reach out into empty air.
FRAME: whenever both twins are on the page she stands on the LEFT of the frame.
FAILURE: when she has failed, the page draws the LEFTOVER and not the rabbit - a neatly sorted heap,
  one line of footprints, dust on her hands, the pool she is looking into. Her shoulders never slump
  and her ears never droop; a drooping ear on her would read as Lolo.
```

## Lolo rabbit

```
HE AND RIRI ARE ONE BODY DRAWN TWICE - identical height, identical build, identical head size,
identical face, identical colour, identical INK2 belly patch, identical hands and feet. He is never
the bigger one, never the rougher-drawn one, and never a year older.
EARS: his two ears HANG DOWN THE SIDES OF HIS HEAD, one each side, reaching past his chin, so his
  head reads HALF AGAIN AS WIDE as hers and carries no spike on top at all. 🔴 They are never folded
  back behind his neck, because the front view is where the twins have to be told apart and a
  neck-folded ear is invisible there. Drawn on every single appearance including back views, water,
  blankets and pure silhouettes.
YELLOW: BOOTS to mid-shin, so his yellow is the LOWEST thing in his silhouette - two blunt lumps at
  the ground with no ankle and no toe shape. It is the only yellow he carries and he carries no
  other cloth. On the pages where one boot is off, the ears carry him alone.
WEIGHT: his weight is already past his FRONT foot, the body tilted forward off the standing leg, and
  BOTH HANDS ARE OUT IN THE AIR - reaching, grabbing, pointing - never held against himself.
FRAME: whenever both twins are on the page he stands on the RIGHT of the frame.
```

## Dad rabbit

```
HE IS NOT A BIG TWIN. THE WHOLE BODY IS ONE BARREL: shoulders, chest and hips are a SINGLE WIDTH
that equals half his own height, and there is no waist anywhere. Twice a twin's height and the
widest figure in the book.
HEAD: small against that barrel - UNDER HALF THE WIDTH OF HIS OWN SHOULDERS - and sunk into them
  with no neck showing. A twin's head is as wide as its own shoulders; his is not.
ARMS: SHORT STUBS that hang inside the outline of the barrel and never break its edge. A twin's arms
  swing clear of the body with open page between arm and belly; his never do.
BOOTS: black rubber boots to mid-shin, wide and blunt, so the bottom of his silhouette is TWO THICK
  CYLINDERS with no ankle and no foot. No yellow on him anywhere, ever.
CAP: a ribbed ATLANTIC knitted cap pulled down to the eyes with the ears coming up through it. Cap
  and boots are his two marks and BOTH READ FROM BEHIND. He carries no third piece of cloth.
EARS: up and close together but SHORT against his body - the shortest ear-to-height in the book.
EYES: the NARROW LYING OVAL under a lid, calm, with almost no bare paper showing round the pupil;
  the mouth is one short flat curve.
Read as a flat silhouette he is a DRUM standing on two cylinders - the one outline in this book with
no waist and no gap between arm and body.
```

## Mom rabbit

```
SHE IS NOT A BIG TWIN EITHER AND SHE IS THE OPPOSITE SHAPE TO DAD: ONE NARROW UPRIGHT POST, the same
width at the shoulder as at the hip, a head over the twins, with long thin limbs and A NECK THAT
SHOWS - she is the only rabbit in the book with a neck. Her head is a narrow oval, not the twins'
full circle.
APRON: one flat ATLANTIC apron hangs from the chest to BELOW THE KNEE as a SINGLE UNBROKEN PIECE, so
  from the chest down SHE IS THE ONLY FIGURE IN THE BOOK WITH NO GAP BETWEEN THE LEGS. Two thin legs
  come out below its hem. 🔴 The apron is her outline, not a pattern laid on her - it must change the
  shape a black cut-out of her would have.
BACK: the apron ties in a BOW at the small of her back, and that bow is what tells her from behind
  the way the cap tells Dad. No yellow on her anywhere, ever, no jewellery, no pattern, no second
  piece of cloth.
EARS: up and close together and the LONGEST in the book against the head, but narrow.
EYES: the NARROW LYING OVAL under a lid, calm, with almost no bare paper showing round the pupil;
  the mouth is one short flat curve.
Read as a flat silhouette she is a TALL NARROW POST that widens once, at the apron, and closes at the
bottom into one straight hem with two thin legs under it.
```

## Harbor cat

```
NOT A RABBIT AND NOT DRESSED. He is the ONLY FOUR-FOOTED FIGURE IN THE BOOK - he sits, stands and
walks on all four, his back is ONE unbroken line from ear to tail root, and a long tail runs off the
end of that line and curls once. THE TAIL IS A THIRD OF HIS OUTLINE and no rabbit has anything like
it, so he is told from every other character by shape alone at any size.
EARS: two small triangles sitting ON TOP of the head, no taller than the head is high - the opposite
  of every rabbit ear on the page.
CLOTH: none. No hat, no boots, no apron, no collar, no cloth of any kind, and no yellow.
FACE: two round eyes, a small nose, ONE short straight mouth line. NO EYEBROW STROKES AND NO
  EXPRESSION - his feeling is in the back and the tail (arched, flat, low, curled) and never in the
  face. He is the one character whose mouth does not curve.
COLOUR: back and head OVERLAP, chest and belly INK2, exactly as the rabbits - the same two drums,
  built as an animal.
```
