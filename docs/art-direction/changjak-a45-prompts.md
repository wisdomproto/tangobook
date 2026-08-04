# 창작동화 1000 — A-45 앵커 + 삽화 프롬프트

> art-director 산출물 (2026-08-01 · 🔴 **2026-08-04 앵커 교체**). 배정 근거 = `changjak-assign-16b.md` §1 · §2 · §3.9 · 규격 = `_ANCHOR-SPEC.md`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/a45.md`.** 아래 13컷은 그 SCENE 콘티를 그림 지시로 옮긴 번역본이고, **대본은 한 글자도 안 고쳤다.**
> 🔴 **이미지 생성은 여기서 하지 않는다.** 사용자가 GPT 로 굽는다. 작가 실명은 한 글자도 안 들어간다.
> 🔴 **실행 순서**: ① `DockPlate`(🔴 **비친 것 사다리 다섯 단** = 이 책의 기계) → ② `OtterPup` → ③ `GoslingWhite` → ④ 셋을 붙여 **p1** 을 굽는다 = **온전한 상(WHOLE)의 기준판** → ⑤ p1 승인본을 붙여 **p10**(널판이 물의 3/4 을 덮는 쪽 = 예전 렌더가 무너진 자리) → ⑥ 그 둘을 ref 로 나머지 11컷.

---

## A-45 §1. 앵커 배정

**권**: `a45` 「물에 비친 나를 지워 줘」 (13쪽 · 4~6세 · 주제군 **A 마음·감정** · 엔진 **소원의 대가** · 무대 할슈타트 소금호수의 나무 선착장 한 자리 · 주인공 새끼 수달 + 새끼 흰 거위)

**클러스터**: **C4** · 앵커 슬러그 `changjak-flatplate` — **재사용**(원본 d04 · h02, 신규 민팅 아님).

### 🔴 앵커를 갈아 끼운 이유 (2026-08-04 · 사용자 실측)

첫 렌더에서 **p8~p11 이 오류 난 그림처럼 나왔다.** 사용자 판정 = 「**AI 는 거울·물에 비친 모습 등 상하 방향에 취약하다**」.

폐기한 앵커 `changjak-foldpress` 는 **위 절반을 그린 뒤 수평선에서 접어 눌러 아래 절반을 만드는** 공정이었다. 즉 **모델이 제일 못하는 상하 반전을 열세 쪽 내내, 그것도 정합의 네 단계까지 지켜 가며 요구**했다. 그림이 안 나온 게 아니라 **공정 자체가 모델의 취약점을 정면으로 겨눈 것**이므로 문구를 더 붙여 고칠 자리가 아니다. 그리고 p8~p11 이 유독 무너진 것은 그 위에 두 번째 요구가 겹쳤기 때문이다 — 널판이 가린 자리를 **손으로 칠한 평면 한 장 `#21372E`** 로 채우게 했더니, 화면의 3/4 이 **아무 정보 없는 짙은 사각형**이 되어 「덜 그려진 그림」과 구별이 안 됐다.

**대체안 탐색** (`_ANCHORS.md` 재사용 우선).

| 후보 | 판정 |
|---|---|
| **d04 · h02 `changjak-flatplate`** | ✅ **채택.** 공정 문단에 🔴 **「A SUBMERGED THING IS A DARK SHAPE LYING INSIDE THE FLAT WATER PLANE - hard-edged, no ripple, no distortion」** 이 이미 들어 있다. 물속의 것을 **평면 안에 놓인 한 장의 도형**으로 다루는 문법이라, 비친 것을 **따로 오려 놓은 창백한 도형**으로 바꾸면 상하 반전이 **한 번도 필요 없어진다**. 게다가 널판이 가린 자리는 손으로 칠하는 게 아니라 **널판 평면이 덮는 것**이라 p8~p11 이 그냥 「물 위에 판자가 있는 그림」이 된다 |
| **e04 `changjak-twosided`**(양면 색지 · 뒤집으면 색이 바뀐다) | ✕ — 「뒤집기」가 정체라 상하 반전 문제를 **되불러온다**. 그리고 이 권의 계기판은 색이 아니라 **온전함**이다 |
| **d10 `changjak-hullcut`**(같은 도형을 네 번 오리고 안쪽 무늬만 다르게) | ✕ — 같은 도형 반복은 맞지만 값이 **무늬**다. 여기 값은 도형이 몇 조각으로 깨졌나이고, 무늬 종이가 들어오면 물 평면에 정보가 생겨 그 셈이 죽는다 |
| **b10 `changjak-floatwhite`**(검은 물 위에 흰 안료가 얹혀 뜬다) | ✕ — 무대가 인접해 위험하고, 흰 것이 **표면에 얹힌다**. 여기 흰 것은 **평면 안에 들어 있어야** 한다 |
| 신규 민팅 | ✕ — 위가 통과하므로 안 만든다(앵커 100~150 정책) |

**한 줄**: 하드에지 평면 색면 · 음영 0. 🔴 **비친 것은 초록 물 평면 안에 놓인 창백한 도형 한 장이고, 그 도형이 온전한가 · 늘어났나 · 조각났나 · 없나 · 널판에 덮였나가 이 책의 전부다.**

**🔴 원본 d04 와 갈린 축 = 평면이 자라나, 평면 안의 도형이 변하나.** d04 는 **물 평면의 면적**이 한 쪽에 한 칸씩 자라 마른 땅을 삼킨다(계기판 = 면적). a45 는 **물 평면의 면적이 열세 쪽 내내 안 변하고**, 그 안에 놓인 창백한 도형만 변한다(계기판 = 온전함). 그리고 d04 의 NOT 절은 「never a reflection」인데, **여기서는 그 비친 것이 주인공**이라 그 한 줄만 뒤집어 쓴다 — 단 **뒤집어 만든 상이 아니라 따로 오린 도형**이므로 d04 가 막으려던 것(반짝임·왜곡·거울 렌더)은 그대로 막힌다.

**이 권이 그림에 요구하는 것** 셋.

1. 🔴 **비친 것에 얼굴을 그리지 않는다.** 창백한 도형 한 장, 내부 정보 0. 눈·코·수염을 넣는 순간 모델이 「아래쪽에 뒤집힌 얼굴」을 그리려 들고 거기서 무너진다. 🔴 **비친 것은 뒤집힌 복사본이 아니라 오려 놓은 도형**이다.
2. 🔴 **계기판 = 그 도형이 물 안에 얼마나 있나.** 다섯 단뿐이고 중간이 없다 — 온전 / 늘어남 / 띠로 잘림 / 조각남 / 없음. 여섯째 읽기가 **덮임**(널판 평면이 위에 놓임)이다.
3. 🔴 **덮인 자리는 칠하지 않는다.** 널판이 덮은 곳은 물이 **그림에서 없는 것**이고, 널판은 언제나 **나무빛 평면 + 톱으로 자른 끝면**이라 판자로 읽힌다. 🔴 **짙은 사각형 한 장으로 채우지 마라 — 첫 렌더가 무너진 자리가 정확히 여기다.**

**형제 권과 갈린 축**(첫 렌더에서 세어진다).

| 대상 | 갈림 |
|---|---|
| **d04 · h02**(같은 슬러그) | 위. 자라는 면적 ↔ **면적 안의 도형** / 원반 여덟과 검정 한 점 ↔ **초록 평면과 창백한 도형 하나** |
| **b10 `changjak-floatwhite`**(무대 인접) | **흰 것이 얹혀 있나 들어 있나** — b10 은 검은 물 **위에 뜬** 흰 안료, a45 는 초록 평면 **안에 놓인** 창백한 도형 |
| **d07 · d23 `changjak-canalfork`** | 값이 **겹수**(볕 한 겹·그늘 두 겹) ↔ 여기 값은 **도형의 온전함**. 그리고 저쪽은 투명 수채, 여기는 불투명 평칠 |
| **e120 `changjak-canalsong`**(같은 C4 · 오려 붙인 색면) | e120 은 **떨어진 물건 셋**을 센다 ↔ 여기는 **한 도형이 몇 조각인가**를 센다 |
| 호리 **니들펠트** | 평면 색면 한 겹. NOT 절에 `no wool` · `no stitching` · `no fibre edge` |
| 전래동화 **점눈이** | ① 매체 = 하드에지 평칠(느슨한 색연필 낙서 아님) ② 눈 = 작은 어두운 아몬드 하나, 눈썹 0(점눈 아님) ③ 화면당 빨강 1점 규칙 없음 — 여기 빨강은 **건너편 지붕 넷**이고 인물에 절대 안 붙는다 |

**🔴 대본 SCENE 처방 5건** — 대본은 고치지 않고 컷에서 분기한다.

| # | 대본 | 문제 | 그림 처방 |
|---|---|---|---|
| 1 | p2 「귀가 넷이 됐어요」 | 그려서 넷을 만들면 화가의 장난이 된다 | 🔴 **늘어난 도형의 귀 끝이 넷**이다 — 같은 도형을 두 배로 길게 오려 귀 끝이 두 번 나오게. 세어지는 것은 **뾰족한 끝의 개수**다 |
| 2 | p3 「앞발 지나간 자리마다 물결이 부채꼴로」 | 이 매체엔 그리는 물결이 없다 | 🔴 **도형이 가로로 다섯 띠까지 잘리고 한 띠씩 옆으로 밀린다.** 앞발에서 먼 띠일수록 더 밀린다. 화면 구석 하나는 아직 안 잘린 채로 |
| 3 | p4 「산산이 흩어졌어요」 | 문지르거나 튀기면 매체가 무너진다 | 🔴 **서로 안 닿는 조각 최대 9개**, 그 사이는 맨 초록 평면. 어느 조각도 머리 하나를 담을 만큼 크지 않다 |
| 4 | p10 「컴컴해서 아무것도 안 보여요」 | 어둡게 깔면 화면이 통째로 오류처럼 보인다(첫 렌더 실패 지점) | 🔴 **널판 평면이 물의 3/4 을 덮는다.** 나무빛 `#8C7C68` + 톱으로 자른 끝면이 별개 평면으로 붙어 **판자로 읽힌다.** 그 아래는 아무것도 안 그린다 |
| 5 | p13 「두 얼굴이 같이 쭈욱 늘어났어요」 | 하나만 늘어나면 이 쪽이 죽는다 | 🔴 **두 도형을 같은 양만큼 길게 오린다** — 같은 방향, 같은 길이 |

**밀도 배급**: 🔴 **없다.** 열세 쪽 전부 `FINISHED THINGS PER PAGE = 2`. 사건이 손톱만 한 흰 도형 하나이므로 산·지붕·밧줄을 그리기 시작하면 그 도형이 「그중 하나」로 밀린다.

**의인화 등급**: 둘 다 **네발 수달 · 물새 거위 그대로, 열세 쪽 고정.** 옷·신발·소품 없음. 수달은 **쓸 때만 앞발 하나를 든다.** 컷마다 반복해 적는다.

**🔴 매 컷 확인하는 세 줄** — `REFLECT:`(창백한 도형이 다섯 단 중 어디인가) · `WHITE:`(순백 = 거위의 상이 물 안 어디 있나, 없으면 없다고) · `PLANK:`(여분 널판이 어디 있고 물의 몇 분의 몇을 덮나).

| | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 | p13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **REFLECT** | 🔴 **온전** | 늘어남(귀 끝 4) | 띠 다섯으로 잘림 | 🔴 **조각 9** | 조각 9 | 되돌아옴, 온전 | 코에서 두 쪽 | 덮인 절반 밖은 온전 | 덮인 절반 밖은 온전 | 🔴 **3/4 덮임** | 좁은 띠만 되돌아옴 | 온전 + 🔴 **거위 상 첫 등장** | 🔴 **둘 다 같은 양 늘어남** |
| **WHITE** | 상만(몸은 뱃머리 뒤) | 상 그대로 | 띠 밖에 온전 | 흰 조각 몇 개 | 🔴 **0** | 같은 자리에 되돌아옴 | 그 자리 안 잘림 | 꽁지 끝만 널판 밖 | 🔴 **0** | 🔴 **0** | 아직 0 | 🔴 **몸 + 상 처음 같이** | 위에 둘 · 아래에 둘 |
| **PLANK** | 뒤에 마른 채 기대섬 | 그대로 | 그대로 | 그대로 | 그대로 | 그대로 | 그대로 | 🔴 **물의 1/2 덮음** | 1/2 덮음 | 🔴 **3/4 덮음** | 1/3 로 줄어듦 | 왼쪽으로 빠져나감 | 저 옆에 떠서 1/8 |

---

## A-45 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-flatplate   (an otter pup and a white gosling / one plank dock on a salt lake)

Style: hard-edged flat colour planes, 4-6 year old picture book. Every thing is ONE flat plane of
  ONE colour with a crisp cut edge, laid down like coloured paper. 🔴 SHADING IS ZERO - no
  modelling, no gradient, no cast shadow, no highlight. Depth is made only by overlap and size.

RENDERING (finish hierarchy): 🔴 THIS VOLUME: THE REFLECTION IS ONE PALE CUT SHAPE LYING INSIDE THE
  FLAT WATER PLANE - REFLECT PALE, 0 interior marks (0 eyes, 0 nose, 0 whiskers, 0 outline), read
  as a reflection only because it lies in the green plane. 🔴 IT IS NEVER MADE BY FLIPPING
  ANYTHING. 🔴 THE GAUGE IS HOW MUCH OF THAT SHAPE IS THERE, five states and no in-between, cut as
  on the DockPlate ladder: WHOLE · STRETCHED (twice as long, pointed ends counting
  twice) · STRIPPED (at most 5 bands, each pushed one step further sideways) · BROKEN (at most 9
  pieces that do not touch, bare green between them) · GONE (0 pale shapes). A sixth reading is
  COVERED: the plank is a DOCK plane laid over the water and what it covers is not in the picture.
  🔴 A COVERED AREA IS NEVER A DARK SLAB - the plank carries its sawn end face as a second plane so
  it reads as a board. 🔴 TO PUSH SOMETHING BACK, MERGE IT INTO THE PLANE BESIDE IT. FINISHED
  THINGS PER PAGE = 2, the otter and the one thing it touches. Mountains = at most 5 silhouettes,
  0 windows. Roofs = at most 4 triangles. Rope = at most 6 turns. Boards = at most 4 seam lines.
  DENSITY RATION = none; all thirteen pages stay at 2.

PALETTE: SKY CREAM #F6F4EE, everything above the shoreline that is not drawn · LAKE #2C4A3C, one
  plane, never lighter or darker inside itself · REFLECT PALE #7E9A88, 🔴 used for nothing but the
  shapes lying inside the lake plane · DOCK #8C7C68, boards, posts, boat and floating plank alike ·
  ROOF CLAY #9E5A4A, at most 4 and never on an animal · SALT GREY #C9C4B4 · OTTER #6B5A48, throat
  #A08A70. 🔴 THE ONLY PURE #F6F4EE INSIDE THE LAKE PLANE IS THE GOSLING'S OWN REFLECTION - not the
  salt, not a splash, not a highlight. No sky blue, no purple, no pink.

CHARACTER DESIGN LANGUAGE: both animals are built from the same flat planes as the world - two or
  three cut shapes with limbs laid over. An eye is ONE small dark almond, no eyebrow, no
  expression; 🔴 the acting is the WHOLE-BODY SILHOUETTE - neck length, the line of the back, how
  far a forepaw has left the boards. Silhouettes separate at thumbnail size: a heavy low body with
  a thick tail against a light round body with a long neck. FIXED GRADE: four-legged otter,
  waterbird gosling; no clothes, no shoes, nothing held. The otter raises ONE forepaw only while it
  is using it.

CANVAS: 16:9 double-page spread. Same dock corner on all thirteen pages. 🔴 No lettering, numerals
  or signs anywhere.

NOT: no digital slickness - airbrush, gradient, glow, 3D CG, cel-shading, photographic or a texture
  filter over the flat planes / 🔴 never a mirrored, flipped or upside-down reflection, never a
  ripple, glint or sparkle on water / never a soft edge, never a shadow / one sheet thick - no
  wool, no felt fuzz, no stitching.
```

---

## A-45 §3. 캐릭터 시트 (🔴 DockPlate 를 가장 먼저)

### 시트 1 — DockPlate

```
STAGE SHEET - DockPlate   (bake FIRST - this book is this one plate and its ladder)

The place with no animals on it, in flat hard-edged planes, 0 shading.

ABOVE THE SHORELINE: the end of an old plank dock a hand's span above the water, boards running
  away from the camera in DOCK #8C7C68 with at most 4 seam lines. Two posts standing in the water
  with rope coiled at most 6 turns. A small wooden boat moored at frame RIGHT, only its prow in
  frame - 🔴 it must be wide enough to hide a gosling completely. A spare plank leaning at back
  LEFT, dry. A wooden bucket in SALT GREY #C9C4B4. Far across the water, at most 5 mountain plane
  silhouettes in LAKE #2C4A3C and at most 4 ROOF CLAY #9E5A4A roof triangles. Sky = one SKY CREAM
  plane. 🔴 No lettering, numerals or signs.
BELOW THE SHORELINE: ONE flat LAKE #2C4A3C plane, edge to edge, 🔴 the same area on every page. It
  is never lighter or darker inside itself and carries 0 ripples.
🔴 THE LADDER - the same otter-head shape shown SIX times inside that green plane, all at one size,
  as flat REFLECT PALE #7E9A88 shapes with 0 interior marks:
  (1) WHOLE - one clean shape, two pointed ears.
  (2) STRETCHED - the same shape cut twice as long, 🔴 so it has FOUR pointed ear ends instead of
      two. Nothing else about it changes.
  (3) STRIPPED - cut across into 5 horizontal bands, each band pushed one step further sideways
      than the band above it, bare green showing at every step.
  (4) BROKEN - 9 separate pieces that do not touch, bare green between them, 🔴 no piece big enough
      to hold a whole head.
  (5) GONE - the green plane with nothing in it at all.
  (6) COVERED - a DOCK-coloured plank plane laid across the green, 🔴 with its SAWN END FACE as a
      second DOCK plane meeting it at a crisp edge. That edge is what says board and not hole.
      Nothing is drawn under it, and it is never a dark slab.
🔴 Beside the ladder, the same six with the pale shape of a small round bird added in PURE #F6F4EE
  so the two pale values are settled side by side.
SCENE token: DockPlate.
```

### 시트 2 — OtterPup

```
CHARACTER SHEET - OtterPup   (bake SECOND)

Flat hard-edged planes on a plain SKY CREAM sheet, 0 shading, 0 outline - the same make as the book.

BODY: a river otter pup built from three cut shapes - a heavy low body in OTTER #6B5A48, a paler
  throat plane #A08A70 laid over it, and a thick tapered tail as long as the body. Webbed forepaws
  as small plane shapes, 0 fingers, 0 claws drawn. 🔴 FUR IS NOT DRAWN AT ALL - the coat is one
  flat colour and a wet otter is the same colour with a narrower silhouette.
FACE: a broad flat muzzle, small rounded ears set low and wide, a dark nose wedge, and ONE small
  dark almond eye a side. 🔴 No eyebrow, no human mouth, no cheeks, no whisker strokes.
GRADE (fixed, all thirteen pages): four legs on the boards. No clothes, no shoes, nothing held. ONE
  forepaw is raised only while it is being used - to tap, to smooth, to point, to push.
REFERENCE SHEET: (a) full body standing four-square in three-quarter view; (b) lying flat on its
  belly with the chin pushed out past a board edge and both forepaws stacked under the chin - the
  posture of p1 and p13; (c) neck stretched long and low, head turning, one forepaw off the boards;
  (d) both forepaws driven forward against something heavy, hind feet braced.
🔴 THE SILHOUETTE PLATE: the same body as ONE flat REFLECT PALE #7E9A88 shape with 0 interior
  marks, at the four postures above. 🔴 That pale shape is what goes in the water - it is cut, not
  flipped, and it is never given a face.
SCENE token: OtterPup.
```

### 시트 3 — GoslingWhite

```
CHARACTER SHEET - GoslingWhite   (bake THIRD)

Same make: flat hard-edged planes on a plain SKY CREAM sheet.

BODY: 🔴 ONE PURE #F6F4EE PLANE AND NOTHING ELSE IN THIS BOOK IS - a light round body, a long soft
  neck, small wings folded flat as one shape. Feathers are NOT drawn: 0 barbs, at most 2 wing
  seams. A short wedge bill in dull orange-grey #C9A377 and ONE small dark almond eye. Legs and
  webbed feet in the same dull orange-grey, and on open water they are under the surface and never
  drawn.
SILHOUETTE RULE: at thumbnail size this must read as a small bright oval with a stalk of a neck -
  it is the thing the reader hunts for on ten of the thirteen pages.
GRADE (fixed): a waterbird on two webbed feet, no clothes, no shoes, nothing held. It swims, dips
  its bill and turns its neck; it never gestures.
REFERENCE SHEET: (a) floating on open water, neck straight; (b) floating with the neck bent low and
  the head turned up over the shoulder - this is p12; (c) lying on the boards beside the otter with
  the bill lowered toward the water - this is p13; (d) tail tip only, the rest cropped away behind a
  plank edge with a short wake - the whole of what is visible on p8.
🔴 THE SILHOUETTE PLATE: for (a) (b) and (c), the same body cut again as ONE flat PURE #F6F4EE
  shape with 0 interior marks. 🔴 That is the gosling's reflection - a separate cut shape laid
  inside the green plane, never a flipped copy of the drawing above it.
SCENE token: GoslingWhite.
```

---

## A-45 §4. 쪽별 컷

각 컷 = `STYLE ANCHOR + @image1(DockPlate) + @image2(OtterPup) + @image3(GoslingWhite) + 아래 블록`.
🔴 **p1 → p10 순으로 먼저** 굽는다. 나머지 열한 컷은 그 둘 사이에서 사다리를 읽는 것뿐이다.

### p1

```
--- p1 — 안녕, 나 ---
REFLECT: 🔴 WHOLE - one clean REFLECT PALE otter-head shape lying inside the green plane below the boards, two pointed ears, 0 interior marks. This page is the standard. It is a cut shape, not a flipped picture.
WHITE: the gosling's reflection lies beside it as one small PURE #F6F4EE shape. Its body is HIDDEN behind the boat prow plane - a reflection with no owner.
PLANK: leaning dry against the back-left post.
CAMERA: medium, high angle. Boards and otter above the shoreline; one flat green plane below it.
SUBJECT: posture (b) of the sheet - the otter lies flat on its belly along the plank edge, chin out past the boards, both forepaws stacked under the chin, tail trailing. Neck short, head low.
SETTING: two posts with coiled rope, the boat prow at frame right, the salt bucket, at most 5 mountain silhouettes and at most 4 roof triangles - all above the shoreline only.
FINISH = 2: the otter and the pale shape in the water.
GRADE: four-legged otter, waterbird gosling, no clothes or shoes, nothing held. 🔴 No lettering, numerals or signs.
TONE: no wind, early morning. The green plane is flat and even, so the two pale shapes in it are the only things the eye can land on.
```

### p2

```
--- p2 — 또 이상해졌어! ---
REFLECT: 🔴 STRETCHED - the same pale shape cut TWICE AS LONG down the frame, so 🔴 ITS EAR POINTS COUNT FOUR instead of two. Nothing else about the shape changes and it is still one piece with 0 interior marks.
WHITE: the gosling's pale shape sits below it, still WHOLE and not stretched - the two lie side by side so the difference is read by comparison.
PLANK: leaning at back left.
CAMERA: close-up, high angle - the otter's head above the shoreline and the long shape below it, both at frame centre.
SUBJECT: the otter pushes its neck further out and drops its head close to the water. ONE forepaw is raised and struck flat on the boards. Mouth open on a shout.
SETTING: same dock corner. The green plane carries nothing else at all.
FINISH = 2: the otter and its own stretched shape.
GRADE: four-legged otter, no clothes or shoes; the raised paw is the only one off the boards. 🔴 No lettering, numerals or signs.
TONE: one shape short and one shape long in the same frame - that pairing is the whole page. 🔴 Do not tilt, ripple or blur the long one.
```

### p3

```
--- p3 — 다림질하듯이 ---
REFLECT: 🔴 STRIPPED - the pale shape is cut across into 5 horizontal bands, and each band is pushed one step further sideways than the band above it, bare green showing at every step. 🔴 The bands nearest the paw are pushed furthest. One far corner of the water still holds an uncut piece.
WHITE: the gosling's pale shape lies clear of the bands at the right edge, still whole - the last thing to go.
PLANK: leaning at back left.
CAMERA: medium close-up, high angle. Otter's shoulder and head at upper left; the banded shape spread across the lower right.
SUBJECT: the otter lies flat and lays ONE forepaw on the water, palm flat to the surface, shoulder tipped forward, neck long. The other forepaw grips the board edge.
SETTING: same dock corner. Rope touching the water at a post. 0 ripples anywhere.
FINISH = 2: the otter and the five banded pieces.
GRADE: four-legged otter, no clothes or shoes, nothing held. 🔴 No lettering, numerals or signs.
TONE: 🔴 the paw that came to fix it is what cut the shape apart, and the stepped bands say so alone.
```

### p4

```
--- p4 — 지워 버릴 거야 ---
REFLECT: 🔴 BROKEN - the pale shape is now at most 9 separate pieces that do not touch, with bare green plane between them. 🔴 No piece is big enough to hold a whole head, a whole mountain or a whole roof.
WHITE: only a few scraps of PURE #F6F4EE, at most 4, caught between the pieces - all that is left of the gosling's reflection.
PLANK: leaning at back left.
CAMERA: medium, slightly low, from near the water's height; otter and thrown water at centre.
SUBJECT: the otter throws its chest out over the board end and drives BOTH forepaws into the water, sweeping them apart in opposite directions, shoulders almost touching the surface, hind feet planted, tail straight up for balance.
SETTING: same dock corner. Dark wet plane shapes thrown across the boards, hard-edged; post and rope; the prow lifting a little.
FINISH = 2: the otter and the nine pieces.
GRADE: four-legged otter, no clothes or shoes, nothing held. 🔴 No lettering, numerals or signs.
TONE: 🔴 the erasing worked. The second picture is in pieces, and more than one face went with it.
```

### p5

```
--- p5 — 거위야, 어디 있어? ---
REFLECT: still BROKEN - a few of the nine pieces left, far apart, and most of the green plane is now empty.
WHITE: 🔴 NONE. Where the gosling's pale shape stood on p1 there is bare green. Not one white mark on this page.
PLANK: leaning at back left.
CAMERA: medium wide, eye level. Otter at frame left, the moored boat prow at frame right, nothing visible behind it.
SUBJECT: the otter braces its forepaws on the boards and lifts its chest, neck stretched as far forward as it goes, head swinging, ears up, mouth open on a call.
SETTING: same dock corner. 🔴 The boat is moored side-on and everything behind it is out of frame - the thing that hides a body must be IN the picture. Posts, coiled rope.
FINISH = 2: the otter and the empty green plane.
GRADE: four-legged otter, no clothes or shoes, nothing held. 🔴 No lettering, numerals or signs.
TONE: a wide green plane and one boat divide the frame. 🔴 The water shows nothing, so he knows the friend is there but not where.
```

### p6

```
--- p6 — 거기 있었네! ---
REFLECT: 🔴 WHOLE AGAIN - one clean pale shape, exactly as on p1, 0 pieces and 0 bands left anywhere in the green plane.
WHITE: 🔴 the gosling's pale shape is BACK IN EXACTLY THE PLACE IT HELD ON p1 - same size, same spot. Its body is still hidden behind the prow.
PLANK: leaning at back left.
CAMERA: close-up, high angle. Only the otter's forepaw and the underside of its face enter at the top edge; the rest is the green plane.
SUBJECT: the otter lies flat and reaches ONE forepaw down toward the white shape, one toe out, the pad almost but not quite touching the surface. The other forepaw braces.
SETTING: same dock corner. A small pale shape of the reaching paw lies in the water below it.
FINISH = 2: the otter's paw and the white shape it points at.
GRADE: four-legged otter, waterbird gosling, no clothes or shoes, nothing held. 🔴 No lettering, numerals or signs.
TONE: the green closes back into one even plane and one white thing is again the brightest in the frame. 🔴 What found the friend was the water, not the eye.
```

### p7

```
--- p7 — 코가 두 개로 ---
REFLECT: 🔴 CUT IN TWO AT THE NOSE - the pale shape is cut once, straight across where the nose is, and the two halves are pushed apart sideways by half a head, so 🔴 THE NOSE END COUNTS TWICE. The rest of the shape is untouched, which is what makes the offset obvious.
WHITE: the gosling's pale shape lies clear of that cut and is NOT offset - whole, one piece.
PLANK: leaning at back left.
CAMERA: close-up, high angle. The lowered nose above the shoreline, the split pale shape directly beneath it.
SUBJECT: the otter lies belly-flat with its nose brought to less than a hand above the water, both forepaws gripping the board edge so the shoulders rise. Mouth open on a shout.
SETTING: same dock corner. Mountains still one flat band above the shoreline, 0 marks in the water beyond the two pieces.
FINISH = 2: the otter and its own split pale shape.
GRADE: four-legged otter, no clothes or shoes, nothing held. 🔴 No lettering, numerals or signs.
TONE: the head is held large so the split sits at frame centre. 🔴 What came back was not relief but the same trouble again.
```

### p8

```
--- p8 — 이제 안 비쳐! ---
PLANK: 🔴 lying FLAT ON THE WATER and covering HALF of it, laid on top of the green plane. It is DOCK #8C7C68 with at most 4 seam lines, and 🔴 ITS SAWN END FACE IS A SECOND DOCK PLANE meeting it at a crisp edge, so it reads as a board and never as a hole or a dark slab.
REFLECT: 🔴 COVERED by that half. In the uncovered half the pale otter shape is WHOLE. The covered half holds nothing at all - do not draw water under the plank.
WHITE: 🔴 only the gosling's TAIL TIP, still outside the plank's edge, with a short wake. Its body is already under the plank and is not drawn. Sheet reference (d).
CAMERA: medium wide, slightly high. The plank runs left to right across the water; the otter pushes from behind it at frame left.
SUBJECT: the otter braces its hind feet on the boards and drives BOTH forepaws against the end of the spare plank, back arched, hind legs stretched behind.
SETTING: same dock corner. Posts, rope, the salt bucket.
FINISH = 2: the otter and the plank it is pushing.
GRADE: four-legged otter, waterbird gosling, no clothes or shoes, nothing held. 🔴 No lettering, numerals or signs.
TONE: a wooden board lands on the green and half the frame stops being a picture. 🔴 The wider the board, the less of the second picture is left.
```

### p9

```
--- p9 — 흰 것이 안 보여요 ---
PLANK: floating, still covering HALF the water, with its sawn end face showing as a second plane.
REFLECT: COVERED over that half; in the open half the pale otter shape is WHOLE.
WHITE: 🔴 NONE ANYWHERE. Do not draw one piece of the gosling, and do not draw anything under the plank.
CAMERA: medium wide, eye level. The otter trotting at frame left, the plank spread wide to the right.
SUBJECT: the otter walks on all fours to the very end of the dock, one forepaw caught mid-step in the air, body tipped forward, neck stretched and head turned toward the water, scanning. Ears swivelled, mouth open on a call.
SETTING: same dock corner. Posts and rope, the salt bucket in SALT GREY - grey, not white.
FINISH = 2: the otter and the water it is scanning.
GRADE: four-legged otter, no clothes, no shoes, nothing held. 🔴 No lettering, numerals or signs.
TONE: green and grey-brown only. 🔴 The bright point the eye went straight to on p1 and p6 is simply not in this page's palette, and that is read as colour, not as story.
```

### p10

```
--- p10 — 컴컴해서 ---
PLANK: 🔴 floating and covering THREE QUARTERS of the water. 🔴 THIS PAGE IS A BOARD, NOT A DARK AREA - DOCK #8C7C68 with at most 4 seam lines, its thick SAWN END FACE toward the camera as a second DOCK plane, the two meeting at one crisp edge across the lower frame. Do not shade, tint or spotlight it.
REFLECT: 🔴 COVERED almost everywhere. Only a narrow green strip outside the plank is left, holding one small piece of the pale shape - the last of it.
WHITE: 🔴 NONE. Not one mark.
CAMERA: close-up, eye level just above the surface. The plank's cut edge fills the lower frame; the otter's face is pressed to the board above.
SUBJECT: the otter lies belly-flat on the plank, chin hooked over the edge, head tipped sideways to look underneath, one cheek squashed against the wood, one forepaw gripping. Eyes narrowed, mouth closed, tail slack.
SETTING: same dock corner. Nothing is drawn beneath the plank at all.
FINISH = 2: the otter's face and the plank edge it is hooked over.
GRADE: four-legged otter, no clothes or shoes, nothing held. 🔴 No lettering, numerals or signs.
TONE: 🔴 the page where the wish came fully true is the quietest in the book - no dialogue, one looking eye, and one plain board where a picture used to be.
```

### p11

```
--- p11 — 지우면 안 돼! ---
PLANK: sliding outward, now covering about a THIRD of the water, its sawn end face still showing as a second plane.
REFLECT: 🔴 A HAND-WIDE STRIP HAS COME BACK. In the reopened green band the pale shapes resume - the top of one upside-down mountain shape and one band of the far shore. The rest is still covered.
WHITE: 🔴 still NONE - the reopened strip is too narrow to hold anything white yet.
CAMERA: medium, slightly low. The otter in full body at frame right, the plank starting to move at frame left.
SUBJECT: the otter plants its hind feet on the dock boards and drives BOTH forepaws against the floating plank, pushing it away, shoulders pouring forward, back in one straight line, hind legs skidding.
SETTING: same dock corner. Posts, rope, prow. The water in front of the moving plank is the same flat green - 0 ripples, 0 foam.
FINISH = 2: the otter and the plank it is pushing away.
GRADE: four-legged otter, no clothes or shoes, nothing held. 🔴 No lettering, numerals or signs.
TONE: one band of green opens in a frame full of board and the eye goes to it. 🔴 The body is being used in exactly the opposite direction to the one it wanted.
```

### p12

```
--- p12 — 거기 있었구나! ---
PLANK: sliding off past the left edge with a long wake, covering only the far corner.
REFLECT: the opened water is WHOLE again - one clean pale otter shape, 0 bands and 0 pieces.
WHITE: 🔴 BOTH - the gosling on open water as a PURE #F6F4EE body, and its own pale shape lying in the green directly below it. 🔴 The lower one is a separate cut shape with 0 interior marks, not a flipped copy. Body and reflection in one frame at last, the two brightest things in it. Sheet (b).
CAMERA: medium wide, high angle. The plank leaving at frame left, opened water and the gosling to the right.
SUBJECT: upper right - the otter leans out over the opened water, neck stretched, both forepaws still thrown out from the push, eyes locked on the white, ears up. Lower centre - the gosling turns its head up over its shoulder, neck bent soft, feet under water and not drawn.
SETTING: same dock corner. Posts, rope, bucket.
FINISH = 2: the gosling and the otter.
GRADE: four-legged otter, waterbird gosling, no clothes or shoes, nothing held. 🔴 No lettering, numerals or signs.
TONE: the board leaves, the green widens, two whites stacked at centre. 🔴 Exactly as much comes back as was uncovered.
```

### p13

```
--- p13 — 우리 둘 다 늘어났다! ---
REFLECT: 🔴 BOTH SHAPES STRETCHED BY THE SAME AMOUNT - the otter's pale shape and the gosling's white shape are each cut twice as long, in the same direction, by the same length. 🔴 If only one is stretched this page dies. Nothing else in the green plane is cut or banded.
WHITE: 🔴 the gosling on the boards and its stretched white shape below - two above, two below.
PLANK: adrift at the far side, covering at most an eighth of the water.
CAMERA: medium, high angle - 🔴 the same place and angle as p1, but two above and two below.
SUBJECT: the otter and the gosling lie side by side, shoulders touching, chins pushed out past the edge, both looking down. The otter's forepaws stacked under its chin; the gosling's neck bent low, bill turned to the water. Tail and tail feathers side by side.
SETTING: same dock corner. Posts, coiled rope, the salt bucket in grey.
FINISH = 2: the two animals.
GRADE: four-legged otter, waterbird gosling, no clothes or shoes, nothing held. 🔴 No lettering, numerals or signs.
TONE: the sun a little higher, the green plane one step lighter than p1. 🔴 p1 was one animal looking at one shape; here two lie side by side and two long shapes lie beneath, and nobody tries to fix the stretching.
```

---

## 첫 렌더 검수 체크리스트 (6항목)

1. 🔴 **비친 것에 얼굴이 그려졌나.** 눈·코·수염이 한 점이라도 있으면 실패 — 물 안의 것은 내부 정보 0 인 창백한 도형 한 장이다. 시트(`OtterPup` 실루엣 판)를 다시 굽는다.
2. 🔴 **아래쪽이 위쪽을 뒤집어 만든 것처럼 보이나.** 산·지붕·널판이 위아래로 정확히 맞물려 있으면 옛 앵커로 되돌아간 것이다. 물 안에 있어도 되는 것은 **창백한 도형과 거위의 흰 도형뿐**이다.
3. 🔴 **p10 이 판자로 보이나 어두운 사각형으로 보이나.** 톱으로 자른 끝면이 별개 평면으로 안 붙었으면 다시 굽는다 — **첫 렌더가 무너진 자리가 정확히 여기다.**
4. 🔴 **다섯 단이 다섯 단으로 보이나** — p1(온전)·p2(귀 끝 4)·p3(띠 5)·p4(조각 9)·p5(없음)를 나란히 놓고 **세어지는지** 확인한다. 중간 상태가 보이면 실패다.
5. **물 평면에 물결·반짝임·그림자가 들어왔나.** 하나라도 있으면 `changjak-flatplate` 가 아니다(음영 0).
6. **원본 d04·h02 첫 렌더와 나란히 놓는다** — 판정 한 줄 = 「**평면의 면적이 자라나**(d04) ↔ **평면 안의 도형이 변하나**(a45)」.
