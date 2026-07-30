# 창작동화 1000 — A-91 「뒤를 돌아봤는데」 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`, 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/a91.md`.** 아래 10컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다.
> 🔴 **작가 실명은 한 글자도 안 들어간다.** 근거 후보 id 는 판정 표에만 남기고 프롬프트에서는 전부 문구로 옮겼다.
> 🔴 **이미지 생성은 이 문서의 일이 아니다.** 사용자가 직접 굽는다.

**실행 순서** (어기면 인물만 매끈한 CG 로 나온다 — §2.4)

1. **STYLE ANCHOR 로 캐릭터 시트 2장 + 사물 시트 1장을 먼저 굽는다.** 장면 금지.
2. 시트가 승인되면 `@image1`(오소리) · `@image2`(사슴) · `@image3`(흰 꽃)로 붙여 10컷을 뽑는다.
3. 🔴 **p3 을 10컷 중 가장 먼저 굽는다.** 이 권의 심장이자 p10 의 ref 다 — p3 승인본을 p10 프롬프트에 첨부해야 거울 착지가 성립한다(문구로 카메라를 재현시키려 하지 말 것).
4. 승인 렌더 3장을 앵커 보관함 ref 슬롯에 넣는다 — 🔴 **인물 컷 1 · 배경이 형태 없는 워시로 남은 컷 1(p5 또는 p7) · 전체 장면 1.** 3장이 전부 배경 완성형이면 "배경은 안 그린다"는 문구가 영영 안 먹는다(점눈이에서 실제로 겪은 일, §2.7 보정).
5. 앵커 이름은 **렌더를 보고 짓는다**(§7.5-3). 지금은 슬러그만 쓴다: `changjak-a91`.

---

## A-91 §1. 앵커 배정

### 이 권이 그림에 요구하는 것 (판정의 전제)

주제군 A 마음·감정 / 엔진 **오해와 반전**(후렴 0) / 무대 스코틀랜드 이탄 습지 / **10쪽** / 캐스트 새끼 오소리(이족) + 새끼 사슴(사족).

네 가지다.

1. 🔴 **감정이 전부다.** 신남 → 어리둥절 → 무서움 → 슬픔 → 반가움이 10쪽 안에서 다 일어난다. §2.8 대로 **형태 언어(C4)로는 못 쓴다** — 눈·눈썹·입이 그려지는 얼굴이 필요하고, 그 얼굴이 손톱만 한 크기에서도 읽혀야 한다.
2. 🔴 **화면의 주인공이 「없음」이다.** p3·p4·p5·p6 은 빈 들판이 화면의 절반에서 90%를 차지한다. 그 빈 곳이 **못 채운 곳으로 보이면 이 권은 실패한다.** 빈 들판이 만져지는 물질이어야 한다 — 넓고, 젖어 있고, 끝이 없는.
3. 🔴 **무대가 「삼키는 곳」이다.** 이탄 습지는 발자국을 삼키고 소리를 삼킨다(p5: 크게 불렀는데 바람만 지나간다). 대본은 이 성질을 **사건으로 쓰지 않기로 결정했지만**(note — 발자국 추론은 어른의 논리), **그림의 물성으로는 이게 이 권의 유일한 필연성이다.**
4. **흰 꽃이 값(value)으로 갈라져야 보인다.** 대본 메타(`bodyColors`)가 스스로 위험을 적어 뒀다 — 밝은 이끼 위의 흰 꽃은 명도로 안 갈리면 사라진다. **그림체가 이걸 문구가 아니라 공정으로 해결해야 한다.**

### 후보 3

| | 후보 ① **C8 흡수지 워시 + 마른 잉크선 (2단계)** (`rutten-ombre` + `rayner-arlo`) | 후보 ② C6 단색조 + 악센트 1 (`shih-taichi` · `bouvier-spring`) | 후보 ③ C1 연필·색연필 나이브 (`erlbruch-duck` · `massa-gino`) |
|---|---|---|---|
| 주제군 순위 | 참고 항목(A 배정) | 🥇 A 1순위 | 🥈 A 2순위 |
| 매체 | 부드러운 흡수지에 젖은 워시 → **마른 뒤** 니브 마른 선 | 붓·과슈 / 석판 크레용 단색조 | 색연필·연필, 종이 위 직접 |
| 이 권에 맞는 이유 | 🔴 **종이가 물감을 빨아들이는 것 = 습지가 소리와 친구를 삼키는 것.** 매체가 무대의 성질 그 자체다. 그리고 **인물은 종이가 마른 뒤에 얹으므로 안 빨려 들어간다** — 세계는 흡수되고 캐릭터는 흡수되지 않는다는 대비가 이 권의 정서 구조와 동형. 흰 꽃 = **워시가 비켜 간 자리(reserve)** 라 명도 분리가 **공정에서 자동으로** 생긴다(요구 4 해결) | 팔레트 규율은 가장 강하다. 빈 들판을 저정보 필드로 쓰는 것도 정확히 이 클러스터의 정의 | 4~6세 감정 서사의 유럽 정본이 여기 있다. 두 마리 동물만 나오는 소품 없는 이야기에 잘 맞는다 |
| 리스크 | 🔴 **C8 은 형태를 못 잡는다** — 인물이 뭉개지면 감정이 통째로 날아간다. → `rutten-ombre` 가 증명한 **2단계 공정을 프롬프트에 못 박아** 해소한다(§7.3.1 note 1 의 처방 그대로). 🔴 C8 은 상 세계에서 8점뿐인 희소 클러스터라 **8권 상한** 중 한 권을 여기 쓴다 — 물이 주제인 권에 안 쓰면 어디에 쓰나 | 🔴 **이 라인 앵커 4개 중 3개가 이미 C6 이다**(A-01 크레용 안개 · A-04 흑연+앰버 · tidepool 해양 워시). 네 번째 C6 은 "권마다 다르다"는 이 라인의 유일한 정체를 갉는다. 그리고 결정적으로 **크레용·과슈는 마른 매체라 젖은 이탄을 못 그린다** — 습지가 그냥 초록 들판이 된다 | 🔴 **A-04 와 이웃에서 겹친다.** A-04 = 연한 종이 + 연필 획 + 작은 동물 + 텅 빈 들판. 이 권도 똑같이 작은 동물 + 텅 빈 들판이라 **소재까지 겹쳐** 두 장을 나란히 놓으면 같은 책으로 보인다. §7.2 점눈이 3규칙(크림 종이·점눈·빨강 1점) 이전에 **라인 내 중복이 먼저 걸린다** |
| 판정 | ✅ **추천** | 탈락 — 클러스터 편중 + 마른 매체가 무대를 못 그린다 | 탈락 — 라인 내 이웃 충돌(A-04) |

### 🔴 추천 = 후보 ① — 흡수지 워시 + 마른 잉크선 (2단계 공정)

세 줄로 요약하면:

- **매체가 무대다.** 이탄 습지는 빨아들이는 땅이고, 흡수지는 빨아들이는 종이다. 워시가 번져 가장자리를 잃고 그래뉼레이션이 종이 결에 가라앉는 것이 **이끼 쿠션 그 자체**라, 이끼를 한 올도 안 그리고 이끼 들판을 만들 수 있다. §2.7 의 「덜 그리기」가 여기서는 절제가 아니라 **매체의 기본 동작**이다.
- 🔴 **서사 변수 = 색이 아니라 「안 칠한 흰 종이」다.** 이 책에서 **맨 종이가 남아 있는 곳은 딱 두 군데** — 오소리 얼굴의 흰 줄무늬와 흰 꽃. 그리고 그 둘이 화면에 있고 없고가 정확히 감정선을 탄다: **p3(등을 보임)과 p7(얼굴을 파묻음)에는 흰 종이가 한 점도 없다.** 이 권의 두 바닥이 곧 흰 종이가 0인 두 쪽이고, p4 에서 얼굴이 돌아오는 순간 흰색이 스위치처럼 켜진다. §2.9 를 A-04(앰버 한 점을 **더하는** 방식)와 **정반대 방향**으로 실행한 것이다 — 여기서는 유일한 악센트가 **덜어낸 자리**다.
- **얼굴이 산다.** 2단계 공정 덕에 얼굴은 워시가 아니라 마른 니브 선으로 그려진다. 눈·눈썹·눈물이 전부 선이라 §2.8 의 요구(감정 서사에는 얼굴이 필요하다)를 정면으로 충족한다. 오소리는 실제로 **얼굴에 검은 줄무늬가 지나가는 동물**이라, 눈이 줄무늬 안에 박히는 얼굴 문법을 종(種)이 공짜로 준다.

### 🔴 이 배정이 대본에서 잡아낸 것 3가지

1. **발자국을 플롯으로 쓰지 않는다.** 대본 note 가 폐기한 첫 판이 「이탄이 발자국을 삼킨다 + 발자국으로 친구를 추론한다」였다. 그림에서 눌린 이끼 자국은 **질감과 방향일 뿐 증거가 아니다.** 독자에게 자국을 읽히는 컷을 만들면 폐기된 판이 그림으로 부활한다 — 전 컷에 이 금지를 걸었다.
2. **p3 에 사슴을 넣지 않는다.** 대본 SCENE 은 「옆에도 뒤에도 아무도 없다」이고, 배경·소품 항의 "사슴이 있었을 자리"는 **빈 자리**를 뜻한다. 멀리라도 사슴을 그려 넣으면 아이러니가 아니라 술래잡기가 된다.
3. 🔴 **p10 「입에 문 흰 꽃」은 앞발로 바꿨다.** 그 쪽에서 오소리는 말을 한다("이제 안 놓칠 거야!"). 입에 꽃을 물고는 못 한다. 그리고 이 권은 오소리를 **이족(앞발=손)**으로 못 박았으므로 손에 드는 것이 등급에도 맞다. — 🔴 대본을 고칠 필요는 없고, 삽화 지시만 앞발로 간다(p10 컷에 명시).

### 라인 충돌 확인 (필수)

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 2D 회화 매체. 실물 입체 재료 없음 |
| 전래동화 **점눈이** | ✕ (4축 전부 분리) | ① **종이색** — 밝은 크림(=햇빛)이 아니라 **차갑고 부드러운 흡수지 #F4F2EC**(=젖은 아침) ② **매체** — 느슨한 색연필 낙서가 아니라 **번지는 워시 + 마른 니브 선** ③ **얼굴** — 점눈 아님. **줄무늬가 관통하는 눈 + 윗눈꺼풀 선 + 별개 눈썹 획** ④ **악센트** — 화면당 빨강 1점 규칙 없음. 이 책에 **빨강은 한 점도 없고**, 악센트는 색이 아니라 **안 칠한 종이** |
| **A-04**(같은 라인 이웃, 같은 주제군) | ✕ | 🔴 소재가 가장 가까워 제일 위험한 상대다. **매체** 눌러 그린 마른 흑연 ↔ 젖은 워시(마름/젖음이 정반대) · **팔레트** 냉회 무채 ↔ 이끼 초록 + 이탄 갈색 · **악센트** 앰버 안료 한 점을 **더함** ↔ 흰 종이를 **남김**(방향 반대) · **얼굴** 아몬드 눈 + 눈썹 선 ↔ 줄무늬 관통 눈 · **주인공 등급** 새(사족 없음) ↔ **이족 + 사족 혼합**. 겹치는 축 0 |
| **A-11**(같은 라인 이웃) | ✕ | 칼로 판 평판 잉크 · 오트지 · 테라코타 지배 · 오려낸 흰 점 눈. 물성이 정반대(찍는 것 ↔ 스미는 것) |
| **tidepool**(C 주제군, 같은 젖은 매체) | △ → ✕ | 🔴 유일하게 매체 계열이 가깝다(둘 다 워시). 갈라지는 지점: tidepool 은 **젖음↔마름 대비가 곧 조수(서사 장치)**이고 팔레트가 **해양 청록 + 빨강 불가사리 1점**이다. 여기는 **전편이 젖어 있고**(마른 판이 없다) 팔레트는 **이끼 초록 + 이탄 갈색, 청색과 빨강이 아예 없으며**, 악센트가 색이 아니라 흰 종이다. 🔴 그래도 **두 권의 첫 렌더는 반드시 나란히 놓고 한 번 더 본다** |
| 세계명작 수채 그림풍 | ✕ | 수채이긴 하나 이쪽은 **형태를 워시로 만들고 선을 나중에 얹는 2단계**이고, 배경에 그려진 형태가 아예 없다 |

---

## A-91 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-a91  (badger and fawn / Scottish peat bog / the friend who stopped)

Style: a hand-painted picture-book page for 4-6 year olds. Wide, soft, wet, and mostly empty.
  This is a book about a place that absorbs things - footsteps, a shout, tears, and for a few
  pages a friend - so the paint has to absorb too.

MEDIUM: a TWO-STAGE process, and the two stages must stay visibly separate.
  STAGE 1 - wet washes on soft, unsized, absorbent paper with a visible tooth. The colour is
  dropped into water and allowed to run: edges bloom outward and feather away to nothing,
  granulating pigment settles into the grain and dries as speckled cloudy patches, and where a
  drying wash met a wetter one it leaves a hard tide-line. NOTHING in stage 1 has a drawn
  outline. Whole areas are one pour, laid once and left alone.
  STAGE 2 - ONLY AFTER THE PAPER IS DRY, the two animals are drawn on top with a thin dry nib
  line. This line is the only crisp thing in the entire book. It does NOT trace the edge of a
  bleed; it sits over the wash and misses it by a hair here and there.
  🔴 THAT SEPARATION IS THE WHOLE IDEA: THE WORLD IS ABSORBED, THE CHARACTERS ARE NOT.
  No airbrush, no smooth digital gradient, no glow, no bloom effect.

PALETTE: three pigments and the paper. That is the whole book.
  paper (cold soft white, tooth visible) #F4F2EC
  granulating moss green #7C8F6A, pooling to #4F6147
  peat brown #8A6A4C, pooling to #4A3728
  where the green and the brown run into each other they make a cold grey #6E747A - this grey
  is a MIXTURE, not a fourth pigment, and the empty middle of this book is made of it.
  dry nib ink #2A241F.
  🔴 There is NO blue, NO red, NO pink and NO yellow anywhere in this book. The sky is the
  thinnest possible pour of the same green-grey. Nothing is ever a bright saturated colour.

🔴 WHITE RULE - this is the thing the reader tracks, and it replaces an accent colour.
  BARE UNTOUCHED PAPER exists in only TWO things in this entire book:
    (1) the white flash across the badger's face, and (2) the white bog flower.
  On any page they appear on they are the brightest thing by a wide margin. Their edge is made
  by the wash STOPPING AROUND THEM (a reserve) - never by a drawn outline.
  🔴 Everything else that might look white - clouds, the fawn's dapples, the shine on a pool,
  the sky - is a PALE WASH one value step down (#E4DCCB / #DDE0D8). NEVER bare paper.
  🔴 On a page whose instruction says WHITE: NONE, there is no bare paper anywhere in the frame.

COMPOSITION: the empty ground is the largest shape on nearly every page, and it is ONE
  continuous wash running to all four edges. It is not a backdrop behind the subject - it is
  what the subject is up against. The badger is small in frame (about 1/6 of page height, and
  1/9 on the searching page) except p2, p4, p5, p7 and p9.
  Horizon low and level. Lead the eye with the line of pressed moss the animals leave behind,
  never with a centred symmetrical subject - except p9, which is deliberately symmetrical.
  🔴 DIRECTION IS MEANING: pages 1-3 travel LEFT TO RIGHT. On page 8 the fawn comes in from the
  RIGHT, against that flow. Do not flip either.
  Keep the bottom 18% of the image quiet and free of key subject matter (a caption band is laid
  over it later).

FINISH HIERARCHY - read this twice. This is about how FINISHED an area is, NOT about opacity.
  1. THE TWO ANIMALS = finished. Wash body, plus the dry nib line, plus the drawn face.
  2. WHAT THEY TOUCH OR LOOK AT on that page (the one flower, the boulder they climb, the moss
     pressed under a foot, the pool they crossed) = half-finished: a wash plus one or two lines.
  3. EVERYTHING ELSE = AN UNFINISHED WASH FIELD. Pours of colour with NO DRAWN SHAPE IN THEM
     AT ALL. Not one moss strand, not one grass blade, not one distant tree is drawn. Bare
     paper shows through where the wash skipped over the tooth.
  🔴 The field is NOT faded, NOT hazy, NOT blurred and NOT desaturated. It is fully wet, fully
  coloured, and on some pages very dark - there is simply NOTHING DRAWN IN IT. A dark shapeless
  wash is correct; a pale but fully drawn meadow is wrong.
  EXCEPTION - exactly ONE page carries density: the page where the badger stands on the boulder
  and searches. On that page the PROPS of the field come up to half-finished. Even there, the
  moss itself is never drawn.

MATERIAL TRANSLATION - how this world is made in this medium. Never render these as photographs.
  MOSS: granulating green settling into the paper grain and drying as speckled cushions. The
    moss field is pigment behaviour, not drawing. Never draw individual strands.
  THE SPRINGY GROUND: a foot leaves no drawn outline. It leaves a DARKER DAMP RING where water
    welled up into the dent - a small pool of extra pigment with one hard dried tide-line.
  DEER COAT: one soft body wash, then a dry brush dragged along the back so the paper tooth
    breaks it into the direction of the fur. 🔴 Dapples are RESERVED PALE WASH, never bare paper.
  BADGER COAT: coarse. Lay the wash and scrape or drag it while still damp so the grey and the
    brown streak past each other. The two black head stripes are the darkest ink on the animal.
  WHITE FLOWER: bare untouched paper. Its shape is cut by the green wash stopping around it,
    plus three or four fine dry ink veins and a stalk of one green stroke.
  WATER / PEAT POOL: a thin dark wash over paper with one hard dried edge. NEVER a glossy
    specular highlight, NEVER a detailed mirror reflection.
  SKY: one flat pale pour. Clouds are reserves of pale wash, not shapes with edges drawn round.

CHARACTER DESIGN: eyes are DRAWN with the nib - a dark bead with a full upper lid line over it
  and a SEPARATE short brow stroke above that, so the face can be excited, puzzled, frightened,
  crying and relieved. NOT dot eyes. No blush circles, no highlight dot, no glossy catchlight.
  🔴 On the badger the two black facial stripes run THROUGH the eyes, so each eye sits inside
  its stripe - that is this book's face, and it is why the white flash between the stripes reads
  from across a room. Bodies are one wash mass plus a limb line drawn over it.
  Silhouettes must be readable at thumbnail size.

  FACE SEPARATION (required): the face must read apart from the body in VALUE, not by adding a
  colour - a lighter muzzle or brow patch, bare paper, or a tonal step at the jaw. Eyes, brow
  and mouth must never sink into one flat body mass. Test: at thumbnail size the expression is
  still legible. This does NOT add a colour to the palette above.

SETTING: a Scottish peat bog in summer - a wide open blanket of sphagnum moss in low cushions,
  standing pools of dark peat water, tussocks of sedge and cotton grass, one large lichen-
  crusted boulder, a few wind-bent rowan saplings far off, low rounded hills on the horizon.
  Northern European. 🔴 Nothing built by people appears anywhere in this book - no fence, no
  path, no wall, no building.

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT digital airbrush / NOT smooth gradients / NOT glossy 3D CG render / NOT cel-shaded
  anime / NOT a watercolour-texture filter laid over flat digital colour (the pigment must MAKE
  the field, not sit on top of it) / NOT photographic / NOT a fully rendered background /
  NOT a single moss strand, grass blade, leaf or distant tree drawn to completion /
  NOT a uniform finish across the page / NOT a hazy, blurry or faded background (that is blur,
  not un-drawn) / NOT bare white paper anywhere except the badger's face flash and the flower /
  NOT any blue, red, pink or yellow / NOT any lettering, numerals or signage anywhere in the
  image / NOT wool felt, NOT stitched fabric, NOT sculpted clay (another line owns those).
```

### 🔴 이 앵커의 세 불변 규칙 (매 컷 반복 확인)

**규칙 A — 흰 종이 스케줄.** 컷마다 `WHITE:` 줄을 반드시 읽는다. `NONE` 이면 화면에 맨 종이가 **한 점도 없다.**

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 |
|---|---|---|---|---|---|---|---|---|---|
| 얼굴 줄무늬 | 🔴 **꽃**(최대) | 🔴 **없음** | 얼굴(되돌아옴) | 얼굴 | 얼굴(티끌만) | 🔴 **없음** | 🔴 **얼굴+꽃 동시** | 꽃만 | 얼굴+꽃 |

> 없음이 두 번(p3·p7)이고 그 둘이 이 권의 두 바닥이다. p4 와 p8 은 **흰색이 돌아오는 쪽**이라 그 자체가 사건이다.

**규칙 B — 의인화 등급 (컷에 그대로 붙일 영문 지시).** 🔴 이 권에서 실제로 터졌던 결함이 「사슴이 앞발을 맞잡는」 지시였다.

```
ANTHROPOMORPHISM GRADE - INVARIANT, NEVER CHANGES ON ANY PAGE
  BADGER = BIPEDAL. It walks upright on its hind legs. Its two forepaws are hands: they point,
    gesture, cup around the mouth, grip its own toes, hug, and carry the flower.
  FAWN = QUADRUPED. It is on four legs at all times. It NEVER stands up on its hind legs, NEVER
    grasps, NEVER holds anything with a leg. It carries the flower in its MOUTH and sets it
    down with its mouth. It kneels only by folding its forelegs.
  CONTACT RULE: when they touch, THE BIPED WRAPS THE QUADRUPED - the badger's two forepaws go
    around the fawn's neck while the fawn keeps all four feet on the ground and lowers its head.
  🔴 They never hold hands. If a pose would need the fawn to stand on two legs to work, the pose
    is wrong - change the BADGER's pose instead, never the fawn's.
```

**규칙 C — 눌린 이끼는 증거가 아니다.**

> `The line of pressed moss behind an animal is TEXTURE AND DIRECTION ONLY. It is never evidence, it never tells the reader where anybody went, and the reader is never asked to read it. Do not compose a page so that following the tracks answers a question.`
> 🔴 대본이 「발자국 추론」판을 폐기했다(note). 그림이 그걸 되살리면 안 된다.

---

## A-91 §3. 캐릭터 시트 (🔴 이것부터 굽는다)

```
CHARACTER SHEET - BadgerStripe   (bake this FIRST, before any scene)

🔴 THE SHEET IS PAINTED IN THE SAME MEDIUM AS THE BOOK. Wet wash first on soft absorbent cold-
  white paper #F4F2EC, allowed to bloom and granulate; then, ONLY ONCE DRY, a thin dry nib line
  #2A241F over it. Bleed edges must be visible on the body and the line must miss the wash edge
  here and there. Do NOT render this animal smoothly just because there is no background.

FACE: a young badger's mask. A white flash of BARE UNTOUCHED PAPER runs from the nose up over
  the crown, between TWO BLACK STRIPES. 🔴 Each stripe runs back THROUGH the eye to the ear, so
  the eye sits inside its stripe - this is the single most important design decision in the
  book, because it is what makes the white flash read at thumbnail size.
  Eye = a dark bead #2A241F with a full upper lid line drawn over it and a SEPARATE short brow
  stroke above that. Small muzzle, nose one dark wedge, mouth one line that can open very wide.
  No dot eyes, no blush, no highlight dot.
COAT: coarse grey #8A8C86 wash with peat brown #8A6A4C warming the flanks, dragged and scraped
  while damp so grey and brown streak past each other. Belly darker. Throat cream as PALE WASH
  #E4DCCB - 🔴 not bare paper, because bare paper belongs to the face flash and the flower only.
BUILD & SILHOUETTE: 🔴 BIPEDAL. About three heads tall standing upright on short hind legs.
  Low round belly, sloped shoulders, short thick neck, small round ears set low and wide.
  FOREPAWS ARE HANDS - broad, with five separated blunt claws. They must read as hands at
  thumbnail size, because they point, cup around the mouth, grip toes and hug all book long.
  Stubby short tail.
SIGNATURE DETAIL: 🔴 the RIGHT EAR IS FOLDED OVER AT THE TIP - one ear up, one ear tipped. Keep
  it in every single drawing including the back views: on two pages the face is hidden and the
  bent ear plus the stubby tail is the only way the reader knows who this is.
SIZE RELATION (required, used on nearly every page): standing upright, the badger's head comes
  to the fawn's SHOULDER.
REFERENCE SHEET: full body standing upright, front / three-quarter walking with one forepaw
  thrown up pointing at the sky / 🔴 BACK VIEW showing the folded ear and the stubby tail (this
  exact view is used on two pages) / a detail of one forepaw open and the same forepaw cupped
  beside the open mouth / four expression close-ups:
    chattering with delight (brows up, mouth wide, eyes squeezed to crescents),
    puzzled (one brow up one down, small open mouth, head tipped),
    frightened (brows pushed up in the MIDDLE, eyes wide and round, mouth a flat open oval),
    crying (eyes squeezed shut, brows up in the middle, two ink tear tracks and one tear
    about to leave the cheek).
  Plain paper background, no scenery.
FACE SEPARATION (required): on this sheet the face must read apart from the body in VALUE, not
  by adding a colour. Eyes, brow and mouth must never sink into one flat body mass. Test: shrink
  this sheet to thumbnail size - the expression must still be legible.
SCENE token: BadgerStripe.
```

```
CHARACTER SHEET - FawnDapple   (bake SECOND, attach as @image2)

🔴 SAME MEDIUM AS ABOVE - wet wash first, dry nib line only after the paper is dry.

FACE: a large dark eye with a full upper lid line and a SEPARATE short brow stroke above it, so
  it can be absorbed, apologetic and happy. Long muzzle as a soft wash with a dry line for the
  nose. Big ears that turn and read as mood - forward when interested, laid back when running.
  No eyelashes, no blush, no highlight dot.
BUILD & SILHOUETTE: 🔴 QUADRUPED, ALWAYS. A young roe deer fawn, leggy, roughly four heads long,
  standing at the shoulder about as tall as the badger is when the badger stands upright.
  Thin legs with a visible knee, small dark hooves, short tail. Neck long enough to lower the
  head right to the ground.
COAT: warm peat-brown #8A6A4C body wash with a dry brush dragged along the back for the fur
  direction; cream underside as pale wash. 🔴 DAPPLES ALONG THE BACK ARE RESERVED PALE WASH
  #E4DCCB WITH SOFT EDGES - NEVER bare paper, because bare paper is reserved for the badger's
  face flash and the flower.
SIGNATURE DETAIL: one dapple on the left shoulder is larger than all the others and shaped like
  a rough five-petal star - it rhymes with the white flower without ever being as bright as it.
POSE VOCABULARY (must be on the sheet, because the book needs exactly these):
  standing on four legs / FORELEGS FOLDED to kneel with the nose down at the ground /
  running with all four legs extended and ears blown back / head lowered with a flower stalk
  held crosswise in the MOUTH.
  🔴 There is no pose anywhere in this book in which the fawn stands on two legs or holds
  anything with a leg.
REFERENCE SHEET: side view standing / three-quarter kneeling with forelegs folded, nose to the
  ground / running with all four legs stretched / a head detail with a white flower stalk held
  crosswise in the mouth / three expression close-ups:
    absorbed (eye down, ears hard forward, mouth shut),
    calling (head up, mouth open, ears forward),
    sorry and glad at once (eye a downward crescent, ears half back, head lowered).
  Plain paper background, no scenery.
FACE SEPARATION (required): same rule as the badger sheet - the face reads apart in VALUE, and
  the expression survives at thumbnail size.
SCENE token: FawnDapple.
```

```
OBJECT SHEET - WhiteBogFlower   (bake THIRD, attach as @image3)

🔴 SAME MEDIUM. And 🔴 THIS OBJECT IS PAINTED BY NOT PAINTING IT: the flower is BARE UNTOUCHED
  PAPER, and its shape is cut by the green moss wash stopping around it. It has no drawn outline.
  It must be the brightest thing on any page it appears on.

FORM: one single bog flower on a slender stalk. Five rounded petals opened flat like a small
  star, with three or four fine dry ink veins running out from a small centre. One green stroke
  for the stalk, with one small leaf clasping it about halfway up. Three or four dewdrops, each
  a tiny reserve with one hard dried edge.
🔴 CONTINUITY: it is the SAME single flower every time it appears - always five petals, and
  from the moment it is carried, the stalk stays slightly bent.
SHOW IT THREE TIMES ON THE SHEET:
  growing out of the moss with dewdrops on it (as on the page where the fawn stops) /
  held crosswise in a fawn's mouth, stalk bending / lying on the moss where it was set down.
🔴 SCALE: about as long as the badger's forepaw is wide. Small enough to be missed by a badger
  walking past, big enough to be seen from across a page.
SCENE token: WhiteBogFlower.
```

---

## A-91 §4. 10컷

각 컷은 `STYLE ANCHOR + ANTHROPOMORPHISM GRADE + 규칙 C + @image1(오소리) + @image2(사슴) + @image3(꽃, 나오는 쪽만) + 아래 블록` 으로 합성한다.
🔴 **p3 을 가장 먼저 굽고, 승인본을 p10 에 ref 로 첨부한다.**

### p1 — 나란히, 오른쪽으로
```
CAMERA: medium wide, eye level about 40cm above the moss. The two walk LEFT TO RIGHT across the
  middle band of the frame; the moss field fills the lower two thirds.
SUBJECT: centre - BadgerStripe upright on its hind legs, both forepaws swung wide mid-stride,
  mouth open talking, brows up, eyes squeezed to crescents. Beside it FawnDapple ON ALL FOUR
  LEGS, head tipped down toward the badger, ears hard forward, listening. Standing upright the
  badger's head comes to the fawn's shoulder. Both are mid-bounce, one foot of each just off
  the ground and the moss springing back under them.
SETTING: sphagnum cushions, two shallow peat pools, sedge tussocks, one low rounded hill far
  right, sky one flat pale pour.
WHITE: the badger's face flash only. There is no flower yet. 🔴 The fawn's dapples are pale
  wash, not paper.
WASH: warm - green with peat brown running underneath it, one continuous pour to all four
  edges. Open and sunlit.
FINISH: the two animals finished. The moss directly under their feet half-finished - two damp
  rings where feet pressed and the water welled up. The hill, the pools, the sedge and the sky
  are unfinished wash with nothing drawn in them.
TONE: broad open midday. Everything flows right, toward the next page.
```

### p2 — 사슴이 멈춘 자리 🔴 소품 회수 1/4
```
CAMERA: close-up, eye level, low to the ground. The flower and the fawn's muzzle at centre-left.
  The right edge of the frame is a hard crop line.
SUBJECT: left - FawnDapple HAS FOLDED ITS FORELEGS and lowered its head so its nose almost
  touches the flower. The eye is entirely on the flower, ears pushed forward. 🔴 GRADE: all four
  legs stay on the ground, folded; it does not sit up and it does not hold the flower.
  🔴 Right crop edge: ONLY the badger's stubby tail and one hind foot, already halfway out of
  frame. That is all the reader gets of the badger, and it is how they learn it is leaving.
SETTING: WhiteBogFlower growing out of the moss with dewdrops on it, moss cushions large at this
  distance, one sedge blade.
WHITE: 🔴 THE FLOWER, at its largest size in the whole book, and the only bare paper in the
  frame - the badger's face is not here.
WASH: warm and close. Let the wash get heavier toward the right crop edge so the leaving badger
  sits in the darker part.
FINISH: the fawn's head and the flower finished. The moss under its folded knees half-finished.
  Everything past the fawn is unfinished wash.
TONE: brightest at the flower and the muzzle; the right edge heavy and unresolved.
```

### p3 — 🔴 이 권의 심장. 없는 친구에게 말을 건다
```
CAMERA: 🔴 MEMORISE THIS CAMERA - PAGE 10 REPEATS IT EXACTLY. Medium, from behind and slightly
  below, following the badger's back. Low horizon; the emptied field runs from the badger's
  shoulders all the way to the top crop line.
SUBJECT: centre, in the LOWER THIRD - BadgerStripe seen FROM BEHIND, upright, walking away from
  us. One forepaw thrown UP pointing at the cloud, head tilted back, mouth open (we see the jaw
  moving past the cheek), ears up with the folded right ear identifying it.
  🔴 THERE IS NOBODY ELSE IN THIS FRAME. It does not glance sideways and it never looks back.
🔴 THE IRONY IS THE COMPOSITION, NOT AN EXPRESSION: the badger is small and low, and the upper
  two thirds of the picture is the empty field it is talking into. The reader has just seen
  where the fawn stopped. DO NOT PUT THE FAWN IN THIS FRAME - not in the distance, not as a
  shape, not as a shadow. The page only works if there is genuinely nothing there.
SETTING: high in the sky, a cloud roughly the shape of a rabbit - 🔴 PALE WASH RESERVE, NOT bare
  paper. Just behind the badger, a small peat pool with the ring of a splash still in it. The
  line of pressed moss it has walked runs back to the crop edge (🔴 texture and direction only -
  never evidence).
WHITE: 🔴 NONE. There is no bare paper anywhere in this frame. The face flash is turned away and
  there is no flower. This is one of only two pages in the book with no white at all.
WASH: the warmth starts to drain - more of the cold grey mixture where green and brown meet, and
  the pour reaches every edge with nothing left open.
FINISH: the badger finished. The pool and the pressed moss under its feet half-finished. The
  whole field and the sky are unfinished wash with no drawn shape in them at all.
TONE: the badger is the only worked thing on the page; the emptiness is the largest and the
  quietest. Nothing here is dramatic - it just isn't there.
```

### p4 — 돌아본 얼굴
```
CAMERA: medium close-up, eye level. The badger has turned back toward us at the front of the
  frame, its shoulder cutting the lower left corner; the emptied field opens over its shoulder
  and runs to the horizon.
SUBJECT: BadgerStripe has swung its whole body round. The forepaw it was pointing with is still
  half raised and has stopped there, mid-gesture. Mouth open and stuck open.
  🔴 THE FACE: brows pushed up in the MIDDLE, eyes wide and round inside their black stripes,
  ears hard forward. This is the frightened close-up from the sheet.
WHITE: 🔴 THE FACE FLASH SWINGS INTO VIEW. This is the first bare paper since page 2 and it is
  the only bare paper in the frame - it should arrive like a light being switched on.
SETTING: over the shoulder, the moss runs unbroken to the horizon; two peat pools; nothing else.
  🔴 The fawn is not in the frame and there is no hint of it anywhere.
WASH: the coldest field so far - the grey mixture dominates. Keep the wash immediately around
  the head a shade warmer so the face separates from it.
FINISH: the head and the raised forepaw finished. The moss under its feet half-finished. The
  field to the horizon is one unfinished wash - do not draw a single tussock in it.
TONE: 🔴 the nothing must occupy at least half the picture. This is mostly a painting of a place
  where somebody is not.
```

### p5 — 불러도 되돌아오는 게 없다
```
CAMERA: medium, LOW ANGLE from near the ground looking up, so the badger stands against the sky
  and the horizon sits at the very bottom of the frame.
SUBJECT: BadgerStripe up on the toes of its hind feet, neck thrown back, mouth open as wide as
  it goes, 🔴 BOTH FOREPAWS CUPPED AROUND THE MOUTH (GRADE - this is the page that proves the
  forepaws are hands). Eyes squeezed shut, brows up in the middle.
SETTING: sky filling most of the frame as a single pale pour. Sedge and grass laid flat one way
  by the wind. 🔴 Not one bird anywhere in the sky.
WHITE: the face flash, tipped up at the sky. The only bare paper in the frame.
WASH: 🔴 the sky is the emptiest pour in the book - one pass, nothing in it at all. The bog
  below is heavy and cold.
FINISH: the badger finished. The moss under its lifted heels half-finished. Sky and field carry
  no drawn shape whatsoever.
TONE: 🔴 THE PLACE ABSORBS THE SOUND, AND THE PAINT SAYS SO. Lay the pigment heaviest right at
  the four edges of the frame and let it close in around the badger, so the shout has nowhere
  to travel. Do not draw sound lines, do not draw an echo.
```

### p6 — 바위 위에서 찾는다 🔴 이 권의 유일한 밀도 쪽
```
CAMERA: wide, eye level. BadgerStripe small on a boulder at the far LEFT; the moss field runs
  right, all the way to the far edge.
SUBJECT: left - the badger up on its hind toes on top of the boulder, one forepaw flat over its
  brow, neck stretched long, stubby tail straight out behind. It is about 1/9 of the page height.
  🔴 The face is a speck and the white flash is a fleck of bare paper the size of a grain of rice.
SETTING: 🔴 THIS IS THE ONE DENSITY PAGE OF THE BOOK, AND THE DENSITY LIVES IN THE PROPS, NEVER
  IN THE GROUND: a lichen-crusted boulder, six standing peat pools of different sizes, eight
  sedge tussocks, a bleached fallen branch, a bank of cotton grass, one wind-bent rowan sapling,
  the low hills. Each object clearly separated from the next so that a child can go looking
  through them one at a time.
  🔴 AND THE FAWN IS NOT BEHIND ANY OF THEM. This page must reward searching with nothing.
WHITE: the tiny face flash only.
WASH: cold and level all the way to the horizon; the pools are the darkest pigment on the page.
FINISH: the badger finished; the boulder under it half-finished; 🔴 the listed props come UP to
  half-finished for this page only (a wash plus one or two ink lines each); the moss between
  them stays an unfinished wash field. Do not draw the moss even here.
TONE: the size relation is the whole sentence - the smaller the badger, the further the ground
  goes on.
```

### p7 — 털썩
```
CAMERA: medium close-up, eye level and very slightly above. The badger centre, curled up small;
  the boulder is a dark mass behind it.
SUBJECT: BadgerStripe sitting on the moss, hind legs folded, head pushed down onto its knees,
  🔴 BOTH FOREPAWS GRIPPING ITS OWN HIND TOES (GRADE - hands). Ears flat back. The face is
  hidden: we see the crown of the head and one shut eye at the edge of a black stripe, with two
  tear tracks drawn in dry ink and one tear just leaving the cheek.
WHITE: 🔴 NONE. The second and last white-less page. The face flash is buried and the flower is
  not here. Pages 3 and 7 are the two lowest points of this book and they are exactly the two
  pages with no bare paper - do not break this.
🔴 THE MEDIUM DOES THE CRYING: two tears have already landed and the moss has DRUNK them. Paint
  each as a small dark bloom of extra pigment with one hard dried tide-line - the same mark the
  pressed feet make. The ground absorbs this too.
SETTING: the boulder behind, moss crushed flat under the badger, nobody anywhere in the frame.
WASH: 🔴 the darkest and coldest wash in the book, closing in from every edge so that the lit
  patch of moss around the badger is small.
FINISH: the badger and the two tear blooms finished. The moss it is gripping half-finished.
  Everything else is dark unfinished wash.
TONE: aloneness painted as scale - one small worked thing inside a large unworked dark.
```

### p8 — 뒤에서 온다 🔴 소품 회수 2/4 · 흰색 둘이 동시에 돌아온다
```
CAMERA: wide, eye level. The badger low and near at the LEFT; FawnDapple entering at the RIGHT
  and further back. 🔴 THE MOVEMENT RUNS RIGHT TO LEFT, against the direction this book has
  travelled since page 1.
SUBJECT: lower left - BadgerStripe has snapped its head up off its knees and turned to look
  back; tear tracks still on the cheek, mouth wide open, brows up, both forepaws flat on the
  moss pushing its body up. Right and behind - FawnDapple RUNNING ON ALL FOUR LEGS fully
  extended, ears blown back, 🔴 WhiteBogFlower held crosswise IN ITS MOUTH (GRADE: mouth, never
  a leg), hind feet kicking the bog so water and torn moss fly up behind it.
WHITE: 🔴 BOTH WHITES RETURN IN THE SAME FRAME, and this is the only page where they are moving
  toward each other - the face flash at the left, the flower at the right. Nothing else in this
  picture is bare paper.
SETTING: flying droplets and torn moss, a line of pressed moss behind the running fawn (texture
  only), the boulder.
WASH: the warm peat brown floods back in with the fawn - 🔴 keep the right half of the field a
  step warmer and lighter than the left, so the warmth arrives WITH her.
FINISH: both animals and the flower finished. The kicked-up water and the pressed line
  half-finished. The boulder, the field and the horizon are unfinished wash.
TONE: the fastest page in the book. Everything that is not the fawn holds absolutely still.
```

### p9 — 꽉 🔴 소품 회수 3/4 · 신체 접촉 규칙
```
CAMERA: medium close-up, eye level, the two centred and touching. 🔴 The only symmetrical
  composition in the book - everything else is off-centre, so this page reads as arrival.
SUBJECT: 🔴 CONTACT RULE - THE BIPED WRAPS THE QUADRUPED. BadgerStripe stands upright and puts
  BOTH FOREPAWS around the fawn's neck, face pressed into the neck fur, eyes squeezed shut,
  tear tracks still on the cheek. FawnDapple KEEPS ALL FOUR FEET ON THE GROUND, lowers its head
  over the badger's back and touches its nose to the badger's shoulder; its flank is heaving
  from running. 🔴 The fawn does not rise, does not sit, does not hold anything, and its
  forelegs never leave the ground.
SETTING: WhiteBogFlower lying on the moss beside the badger's foot where the fawn set it down,
  stalk slightly bent from being carried. The moss crushed under both of them in one shared
  print. The boulder's shade.
WHITE: the flower only - the badger's face is buried in the fur. One bare-paper shape on the
  page, and it is the reason the whole thing happened, sitting quietly on the ground.
WASH: 🔴 the warmth is back and the contrast drops. This is the softest, most even wash in the
  book - nothing dark at the edges, no heavy pigment anywhere.
FINISH: both animals and the flower finished; the crushed moss half-finished; everything else
  unfinished wash.
TONE: one held breath. Keep the values close together and let nothing in the frame be dramatic.
```

### p10 — 옆을 본다 🔴 거울 착지 · 소품 회수 4/4
```
CAMERA: 🔴 EXACTLY THE SAME CAMERA AS PAGE 3. From behind and slightly below, same distance,
  same low horizon, the walkers in the same place in the lower third. ATTACH THE APPROVED PAGE 3
  AS A REFERENCE AND MATCH IT - these two pages must look like the same photograph taken twice.
  Only what is inside the frame has changed.
SUBJECT: centre - BadgerStripe and FawnDapple seen from behind, walking away from us toward the
  hill, close enough to touch. 🔴 GRADE: the fawn walks ON FOUR LEGS; the badger walks upright
  beside it and lays ONE forepaw on the fawn's foreleg and shoulder. They do not hold hands.
  🔴 THE ONE CHANGE FROM PAGE 3: the badger has turned its head SIDEWAYS to look up at the fawn,
  so from behind we catch its cheek, one eye, and the edge of the white flash. On page 3 it
  looked only at the sky. The corner of the fawn's mouth is lifted.
🔴 THE FLOWER: the badger carries WhiteBogFlower IN ONE FOREPAW, not in its mouth - it is
  speaking on this page, and it has hands. (The script's SCENE line says "입에 문"; the body text
  has the badger talking. Hands win, and the grade agrees.)
SETTING: the low hill and open sky ahead. High up, the same rabbit cloud from page 3, now pulled
  apart into two or three pieces (pale wash reserve, NOT bare paper). Behind them, TWO lines of
  pressed moss instead of one.
WHITE: the edge of the face flash seen from behind, and the flower in the paw. Both whites, at
  rest, for the first time in the book.
WASH: the lowest sun of the book and the warmest pour, laid so the light lies long across the
  animals' backs. The way they came, behind them, is a shade darker.
FINISH: the two animals finished; the pressed moss and the flower half-finished; the hill, the
  sky and the cloud unfinished wash.
TONE: 🔴 the entire point of this page is that it is page 3 with one face turned. Do not add an
  event, do not add a prop, do not move the camera, do not raise the drama.
```

---

## A-91 §5. 첫 렌더 검수 6항목

> 사용자가 뽑은 뒤 이걸로 통과/실패를 판정한다. 🔴 **하나라도 걸리면 문구를 늘리지 말고 ref 를 바꿔라**(§5.1 교훈 — 문구로 세 번 실패하면 레버가 틀린 것이다).

| # | 볼 것 | 실패 시 처방 |
|---|---|---|
| 1 | 🔴 **흰 종이가 스케줄 밖으로 샜나.** p3·p7 에 맨 종이가 한 점이라도 있으면 실패. 특히 **구름·사슴 반점·물웅덩이 반짝임**이 상습범이다 — 그것들은 전부 「한 단 내린 옅은 워시」여야 한다 | WHITE RULE 뒤에 그 쪽에서 실제로 샌 사물을 이름으로 못 박고 재시도. 2회 실패면 **흰색이 얼굴 하나뿐인 승인 컷(p4 또는 p5)을 먼저 확보해 ref 로** 고정 |
| 2 | 🔴 **2단계 공정이 진짜인가.** 확대해서 본다 — 잉크 선이 번짐 가장자리를 **그대로 따라가면** 한 번에 그린 것이고 실패다. 선이 워시를 살짝 빗나가고, 배경엔 선이 아예 없어야 통과 | 문구 튜닝 금지. **선이 워시를 빗나간 게 보이는 승인 컷 1장**을 확보해 ref 로 박고 나머지를 그 뒤에 뽑는다 |
| 3 | 🔴 **배경이 「연하게 다 그린 초원」이 아니라 「형태 없는 워시」인가.** 이끼 한 올·풀 한 대·먼 나무 한 그루라도 그려져 있으면 실패다. **어둡고 형태 없는 워시 = 통과 / 연하고 다 그린 들판 = 실패** — 채도가 아니라 완성도로 본다 | FINISH HIERARCHY 3항 강화 + 🔴 **배경이 형태 없는 워시로 남은 승인 컷(p5·p7)을 ref 슬롯 3칸 중 한 칸에 반드시 넣는다.** 점눈이는 ref 3장이 전부 배경 완성형이라 이 문구가 영영 안 먹었다 |
| 4 | 🔴 **등급 위반.** p9·p10 두 장으로 판정한다 — 사슴이 두 발로 섰거나, 다리로 무언가를 쥐었거나, 오소리와 손을 맞잡았으면 실패 | 장면 문구가 아니라 **FawnDapple 시트를 다시 굽는다.** 시트의 POSE VOCABULARY 에 두 발 포즈가 하나라도 그려져 있으면 장면은 반드시 따라 한다 |
| 5 | 🔴 **p3 ↔ p10 이 같은 카메라인가.** 두 장을 나란히 놓고 지평선 높이·인물 크기·화면 안 위치를 본다. 다르면 이 권의 착지가 사라진다 | p3 승인본을 **p10 의 ref 로 첨부**해 다시 굽는다(문구로 카메라를 재현시키려 하지 말 것 — A-11 p8/p12 에서 확립한 처방) |
| 6 | **얼굴이 매끈한 CG 로 회귀했나**(§2.4 최대 실패 모드). 눈에 반짝이는 하이라이트 점이 있거나 볼터치가 있으면 실패. 그리고 **줄무늬가 눈을 관통하지 않고 눈 위아래를 비켜 갔으면** 이 권의 얼굴 문법이 무너진 것 | 장면을 고치지 말고 **BadgerStripe 시트를 다시 굽는다.** 시트 프롬프트의 "THE SHEET IS PAINTED IN THE SAME MEDIUM" 블록이 지켜졌는지 먼저 본다 |

## 이웃과 나란히 보기 (라인 정체 점검)

🔴 라이브러리 카드가 **가로로 이웃**하므로, 첫 렌더를 **A-04 · A-11 · tidepool 과 나란히 놓고** 마지막으로 한 번 더 본다.

- **A-04 대조**: 마름 ↔ 젖음 · 무채 흑연 ↔ 이끼 초록/이탄 갈색 · 앰버를 **더함** ↔ 흰 종이를 **남김**. 둘 다 「작은 동물 + 텅 빈 들판」이라 **소재가 가장 가까운 상대**다. 이 세 축 중 하나라도 흐려지면 앵커를 다시 고른다.
- **tidepool 대조**: 둘 다 워시라 매체 계열이 유일하게 가깝다. **청록·빨강 불가사리 ↔ 초록·갈색, 빨강 없음** / **젖음↔마름 대비가 서사 ↔ 전편이 젖어 있음**. 이 둘이 안 갈리면 tidepool 쪽이 아니라 **이 권을 다시 고른다**(tidepool 이 먼저다).
