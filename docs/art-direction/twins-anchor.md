# 쌍둥이네 바닷가 — 앵커 + 캐스트 시트

> 창작동화 **시리즈 06** (25권 · 250쪽). 설계 SSOT = `docs/changjak-books/twins/_design.md` ·
> 대본 = `docs/changjak-books/twins/*.md` · SCENE = `_scenes.json`
> 🔴 **이미지 생성은 여기서 하지 않는다.** 프롬프트까지가 이 문서의 일이다.
> 🔴 **한 시리즈 = 한 그림체.** 이 시리즈는 **리소(risograph) 전권** — `pongi-anchor.md` §4 보류분
> `pongi-risosky` 를 가져와 캐스트·무대를 갈아 끼운 것이다. 슬러그 = `twins-risoshore`.

---

## §0. 설계 — 왜 리소인가

**형식이 내용이다.** 이 시리즈의 축은 「정반대 둘이 각자 반씩 틀리고, 반쪽이 만나 한 가지가 된다」
(착지 25권 중 14권이 「반씩 합쳐짐」)인데, **리소는 그 공정 자체**다 — 두 판을 따로 찍고,
둘은 절대 정확히 안 맞고, **어긋난 채로 겹쳐 한 그림이 된다.**

그래서 이 앵커에서 **판 어긋남(misregistration)은 결함이 아니라 그림**이다. 매 쪽 두세 군데에서
색이 윤곽을 삐져나가고, 그 삐져나감은 숨기는 게 아니라 **보이게 둔다.**

리소가 이 무대와 맞는 이유가 하나 더 있다 — **잉크가 고르게 안 앉는다.** 드럼이 돈 방향으로
줄무늬가 지고 얼룩이 남는다. 파도·그물코·비늘·좌판·자갈이 전부 반복 마크인 어촌에서,
그 얼룩이 「손으로 그린 잡동사니」 없이도 화면을 살아 있게 만든다. 안개(12)·소나기(19)는
**옅게 찍은 한 판**으로 끝난다.

### 🔴 이 시리즈의 최대 난점 — 같은 토끼 둘을 실루엣으로 가르기

설계서가 준 표식은 **노란 모자(리리) / 노란 장화(롤로)** 둘이다. 그것만으로는 부족하다 —
모자를 벗는 쪽(15권에서 문어가 써 본다), 장화가 남 손에 가는 쪽(08권 소라게)이 있고,
무엇보다 **썸네일에서 색점은 보여도 누구인지는 안 보인다.**

그래서 앵커에 표식을 셋 더 얹는다. 셋 다 **이야기를 안 건드리는 그림 결정**이다.

```
① 노랑의 높이   리리는 실루엣 맨 위, 롤로는 맨 아래. 두 노랑이 같은 띠에 오는 일이 없다
② 귀           리리는 두 귀가 곧게 서고 붙어 있다 · 롤로는 두 귀가 목 뒤로 눕는다
③ 무게 중심     리리는 뒷발에 실려 멈춰 서 있고, 롤로는 앞발 너머로 몸이 기울어 있다
```

②가 결정적이다 — 모자도 장화도 없는 뒷모습·물속·이불 속에서도 **귀 하나로 갈린다.**
그리고 둘의 축(재고 멈추는 쪽 / 뛰어드는 쪽)을 그대로 옮긴 모양이라 그림이 성격을 말한다.
🔴 **키·몸집·색은 절대 다르게 하지 않는다.** 쌍둥이가 아니게 된다.

---

## §1. 앵커 — `twins-risoshore`

```
STYLE ANCHOR - twins-risoshore   (rabbit twins in a Portuguese fishing village / riso, two drums that
                                  never line up)

Style: risograph, exactly TWO ink drums on salt-cream paper, 4-6 year old picture book. Ink lies
  UNEVENLY - every pull is slightly mottled and streaked in the direction the drum turned, and no
  area is perfectly solid. Where the two inks overlap a third, darker colour appears - that is the
  only dark. 🔴 THE TWO DRUMS NEVER REGISTER: on every page the colour runs past the shape at TWO OR
  THREE edges by about a hair, and that misfit is left showing - it is the picture, not a fault.
  Unprinted paper is not white space, it is the sky, the sand and the whitewash. SHADING IS ZERO -
  no modelling, no gradient, no cast shadow, no highlight.

RENDERING (finish hierarchy): an area is ONE pull of one ink, never lighter or darker inside itself;
  the only variation is the mottle and the streak. 🔴 THE SEA AND SKY OF ONE VOLUME ARE ONE PULL
  RUNNING THE SAME DIRECTION ON EVERY PAGE OF THAT VOLUME - sideways for a calm day, down for rain,
  flat for fog - and the weather lives in that direction and nowhere else. FINISHED THINGS PER PAGE =
  2, the twin the page is about and the one thing that twin touches; everything else is a shape with
  no interior detail. Repeats are capped and the cap is the whole design: boats in the harbour at
  most 6 · net mesh at most 11 crossings · fish on a slab at most 9 · gulls at most 7 · market stalls
  at most 5 · awnings at most 5 · windows down a street at most 8 · cobbles one arc mark at most 12
  presses · shells at most 9 · rain at most 11 straight strokes all leaning one way · stars at most
  14 bare paper points. Nothing in a repeat is a mirrored copy of its neighbour.
  DENSITY RATION = none.
  🔴 BOTH TWINS ARE FINISHED ON THE PAGES WHERE BOTH ARE WRONG (p3 through p7 in most volumes) -
  they are one unit, and the "one thing touched" is then a single prop shared between them.

PALETTE: PAPER SALT CREAM #F1F0E6, sky, sand, whitewashed walls, foam, light, everything not printed
  · INK1 ATLANTIC #2E6B96, the sea, the sky, wet stone, aprons, painted shutters - the cool one ·
  INK2 HULL RUST #A85E38, boat hulls, nets, ropes, crates, roof tiles, baskets, the harbour wall -
  the warm one · OVERLAP HARBOUR NIGHT #2D3B42, rabbit backs and heads, the underside of a hull,
  rock shade, evening sea, anything submerged - overprint only, never a third drum · ACCENT BUOY
  YELLOW #E9A825, 🔴 pulled last, touching nothing but Riri's hat and Lolo's boots.
  🔴 A FISHING VILLAGE IS FULL OF YELLOW AND NONE OF IT IS ALLOWED HERE - oilskins, buoys, lamps,
  nets, floats, the lighthouse body, paper flowers and kites all take INK1 or INK2. No sky blue that
  is not ATLANTIC, no purple, no pink, no white ink anywhere ever.

STAGE CLAUSES (the stage changes what the two inks do, never which two they are):
  SHORE - the sand is BARE PAPER from edge to edge and it is the light of the page; the sea is ONE
    pull of ATLANTIC across the top, 0 ripples, 0 glints, 0 foam lines. 🔴 WET SAND left by a
    retreating wave is a single flat ATLANTIC pull with a hard edge against the bare sand. Rocks are
    INK2. Footprints and dug holes are at most 9 OVERLAP marks.
  HARBOUR - hulls, crates and the wall are INK2; the water between the boats is ONE pull of ATLANTIC
    with the boats sitting whole on top of it. 🔴 NOTHING IS EVER MIRRORED IN THE WATER - there are
    no reflections in this book. A thing under the water is OVERLAP lying inside the pull, hard edge,
    never distorted. Far boats at most 4 silhouettes, 0 windows.
  MARKET - awnings and stalls are single flat pulls of INK1 or INK2 with the misfit showing at their
    corners; the ground is bare PAPER; the crowd is at most 7 flat silhouettes with 0 faces and 0
    hands. Depth in the crowd is made by figures standing CLOSER TOGETHER, never darker.
  ROCKPOOL - the pool is ONE pull of ATLANTIC with a hard edge; what lives in it is OVERLAP inside
    that pull. The rock around it is INK2 with the streak running ALONG the rock, not across it.
  🔴 LIGHTHOUSE (volume 09) - the tower body is INK2 and the sky is ATLANTIC. THE LIGHT ITSELF IS
    BARE PAPER, one clean shape with no glow, no rays and no halo, and it is the brightest thing on
    the page.
  🔴 FOG (volume 12) - ATLANTIC at its lightest single pass with 0 shapes behind it. Things enter the
    page by appearing at FULL strength, never by fading, and there is no pale version of any colour.
  🔴 RAIN AND SQUALL (volume 19) - the whole sky-and-sea pull runs DOWN on every page of that volume;
    rain is at most 11 straight ATLANTIC strokes leaning the same way; wet stone carries ONE bare
    paper strip and nothing mirrors in it.
  🔴 NIGHT (volume 17) - the sky and sea are OVERLAP as one flat pull. The moon, the stars and the
    lit windows are BARE PAPER, each cut on its own, at most 14. A lamp on the boat is bare paper and
    it carries the whole page.

CHARACTER DESIGN LANGUAGE: the rabbits are built from the same flat pulls as the world - two or
  three shapes with limbs laid over. GRADE: bipedal, standing upright, wearing cloth. Backs and heads
  are OVERLAP, chests and bellies are INK2, so every animal is built the same way. Eyes are two solid
  dark dots set wide apart; a small dark nose; the mouth is ONE curve; above each eye ONE short
  eyebrow stroke. 🔴 FEELING IS CARRIED BY THE MOUTH CURVE AND THE TWO EYEBROW STROKES - the eyes
  only ever open or close and their size NEVER changes. The face is never crossed by an object.
  Whole-body posture carries the rest.
  🔴 THE TWINS ARE ONE BODY DRAWN TWICE - same height, same build, same colour, same face. They are
  told apart by FOUR things and nothing else:
    ① RIRI wears a YELLOW HAT, so her yellow sits at the TOP of her silhouette · LOLO wears YELLOW
      BOOTS, so his yellow sits at the BOTTOM. The two yellows are never in the same band of the page.
    ② 🔴 EARS - Riri's two ears stand straight up and close together · Lolo's two ears lie back flat
      along his neck. This is the ONLY mark that survives a back view, a bath, a blanket and a lost
      hat, so it is drawn on every single appearance including silhouettes.
    ③ WEIGHT - Riri's weight is on her BACK foot, head still, both hands holding each other or
      holding the thing up to look at it · Lolo's weight is past his FRONT foot, body tilted forward,
      hands already out.
    ④ RIRI'S FAILURE IS DRAWN AS A LEFTOVER, NOT AS TIREDNESS - a neat heap of sorted sand, a single
      line of footprints, white dust on her hands, her own face in the pool. Never slumped shoulders.
  DAD a rabbit twice a twin's height and the widest figure, a fisherman, black rubber boots, no
  yellow · MOM a rabbit a head over the twins, an ATLANTIC apron at the fish stall, no yellow.
  Adults never carry yellow. THE ANIMALS - gulls, the harbour cat, crabs, a hermit crab, an octopus -
  are plain shapes with no clothes, no eyebrows and no expression.

CANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - stalls, boat sterns
  and crates stay blank or carry a single painted fish shape.

NOT: no airbrush, gradient, glow or 3D render / no soft or feathered edge / no streak inside a figure
  / no perfectly solid area anywhere / no ripple, glint or sparkle on water / no reflection or
  mirrored image in water / no halo or ray around the lighthouse light / no white ink / no yellow on
  anything but the hat and the boots / no lettering.
```

**관통 줄** (매 쪽)

```
OFF:    the two drums never line up - every page misfits at two or three edges and that misfit stays
YELLOW: the only yellow in the village is Riri's hat and Lolo's boots
TWINS:  same body, same height - Riri's ears stand up and her weight is back; Lolo's ears lie flat
        and his weight is forward
```

🔴 **`TWINS:` 는 쪽별 프롬프트에서 둘이 함께 나오는 쪽마다 반복한다.** 25권 250쪽 중 둘이 같이
있는 쪽이 대부분인데, 모델은 「쌍둥이」를 받으면 **한쪽을 크게, 한쪽을 작게** 그리려 든다.
크기 차이가 한 번 새면 그 뒤로 형제로 읽힌다.

---

## §2. 캐스트 시트

한 장에 넷을 다 그린다. 🔴 **이 시리즈는 시트가 검사도 겸한다** — 마지막 실루엣 줄에서
둘이 안 갈리면 시트가 실패한 것이고, 250쪽을 굽기 전에 그걸 알아야 한다.

```
CHARACTER SHEET - twins shore   (four characters, one sheet)

[여기에 §1 의 Style / PALETTE / CHARACTER DESIGN LANGUAGE 세 문단을 그대로 붙인다]

SHEET LAYOUT: one salt-cream sheet, four rabbits standing in a row on a single ground line at their
  true relative heights - Dad twice a twin, Mom a head over the twins, and 🔴 RIRI AND LOLO EXACTLY
  THE SAME HEIGHT AND BUILD. Each character is drawn THREE times: front standing, three-quarter
  walking, and back.
🔴 ONE EXTRA ROW AT THE FOOT OF THE SHEET: Riri and Lolo again, side by side, printed as FLAT
  OVERLAP SILHOUETTES with 0 interior marks and NO YELLOW AT ALL - no hat, no boots. If the two
  silhouettes cannot be told apart by the ears and the stance alone, the sheet is wrong.
  Nothing else on the sheet - no props, no scenery, no ground beyond the one line.
🔴 No lettering, numerals, labels or name tags anywhere on the sheet.
```

🔴 시트가 나오면 기획서 §2 카드에 붙여넣는다(R2 `comic-assets/twins-plan`, 키 = 캐릭터 key).
회차 페이지의 「🎬 이 화 등장」 스트립이 그 이미지를 읽어 온다.

🔴 **`twins-core.js` 의 STYLE 도 이 앵커와 같이 고친다.**
