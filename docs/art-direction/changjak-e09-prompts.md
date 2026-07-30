# 창작동화 1000 — E-09 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`(§2.1 · §2.3 · §2.4 · §2.7 · §2.9 · §2.10 · §7.1 · §7.2 · §7.3 · §7.5), 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/e09.md`.** 아래 10컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다.
> 🔴 **이미지 생성은 여기서 하지 않는다.** 사용자가 GPT 로 굽는다. 🔴 **작가 실명은 한 글자도 안 들어간다** — 근거는 §1 판정에만 남기고 프롬프트는 전부 문구다.
> 🔴 **실행 순서**: ① 시트 3장(BabyOwl → MotherOwl → NestThree)을 **먼저** 굽는다(장면 금지) → ② 승인 시트를 붙여 **p1(가장 밝은 판)** 과 **p8(가장 어두운 판)** 두 장을 굽는다 = 이 권의 **밝기 양 끝** → ③ 그 5장을 ref 로 나머지 8컷. 🔴 **양 끝 두 장이 확정되기 전에 중간 컷을 굽지 마라** — 이 책의 사건은 「빛이 줄어드는 것」 하나이고, 양 끝이 흔들리면 사이의 여덟 장이 전부 헛것이 된다.

---

## E-09 §1. 앵커 배정

**권**: `e09` 「엄마, 나 아직 안 졸려요」 (10쪽 · 4~6세 · 주제군 **E 웃음·말놀이** · 엔진 **누적·반복** · 무대 북유럽 숲 큰 소나무의 나무 구멍 둥지 · 주인공 아기 부엉이 + 엄마 부엉이)

**한 줄**: **어두운 종이 위 목탄·소프트 파스텔**, 그리고 🔴 **빛을 얹지 않고 지우개로 들어낸다** — 쪽이 넘어갈수록 지우는 양이 줄어드는 것이 곧 잦아드는 곡선이다. 유일한 따뜻한 색은 구멍으로 들어온 **달빛 크림색**이고 그것은 사물의 색이 아니라 **빛 자체**다. 앵커 슬러그 `changjak-nightlift` — **신규 민팅**.

**이 권이 그림에 요구하는 것(판정의 전제)** 넷이다.

① 🔴 **화면이 열 쪽에 걸쳐 잦아들어야 한다.** 대본이 4축(빛·대비·움직임·컷 넓이)을 표로 못 박아 뒀고, 이 책에는 그 곡선 말고 사건이 없다. **그러려면 「빛의 양」이 그림의 재료 단위여야 한다** — 밝게 그릴 수 있는 것과 어둡게 그릴 수 있는 것이 따로 있는 매체로는 이 곡선을 못 만든다. 감산(빛을 덜어내는) 공정이면 「이 쪽은 세 군데만 지운다」로 곡선이 물리량이 된다.

② 🔴 **잠자리 책이다.** 소비 맥락이 그림체를 정한다(§2.3) — 아이가 이걸 보는 시각은 불 끄기 직전이다. 화면이 **처음부터 어두워야** 하고, 밝은 종이에 어둠을 얹은 그림은 마지막 쪽까지 「환한 종이」로 남는다. 🔴 종이색이 이 권의 첫 결정이고, 정답은 **중간 어둠**이다.

③ 🔴 **발밑 셋을 p10 에서만 센다.** 나뭇잎 → 깃털 → 이끼 공. p3~p9 는 **있는데 안 세어져야** 하고 p10 은 **세어져야** 한다. 어둠이 재료라면 이 조절이 공짜다 — 어둠에 잠기면 있는데 안 세어지고, 윗면만 지워 내면 세어진다. 밝은 화면에서는 「있으면 세어진다」라 이 요구가 원천적으로 안 풀린다.

④ **둘 다 열 쪽을 연기한다.** 들뜸 → 외침 → 발가락 → 껴안기 → 눈 비비기 → 갸웃 → 반쯤 감김 → 흐려짐 → 말이 끊김. 얼굴이 필요하다 → **표정 없는 형태 언어(C4)는 원천 금지**(§2.8). 🔴 특히 착지가 **반쯤 감긴 눈 + 벌어진 부리 틈** 하나에 걸려 있어, 눈꺼풀 높이를 조절할 수 있는 캐릭터 언어가 필수다.

**후보 3.**

① 🔴 **C7 회화적 톤 · 어두운 종이 위 목탄·파스텔 + 지우개 감산 공정(신규 앵커)** — 요구 ①②③을 **한 공정이 동시에** 해결한다. C7 의 정의가 「실루엣 + **빛의 위치가 감정**」인데(§7.1) 이 책은 빛의 위치와 양이 곧 서사다. 게다가 감산이라 「이 쪽은 덜 지운다」가 그대로 잦아드는 곡선이 된다 — **형식이 내용을 되풀이한다**(§2.3 필연성). 리스크 = 목탄을 주면 모델이 **디지털 소프트 그로우·볼류메트릭 광선**으로 도망친다 → MEDIUM 절에서 「빛은 지운 자리이고 그 안에 종이결이 남아 있다」·「흰 물감으로 하이라이트를 얹지 않는다」를 못 박고 검수 1·4번에 올린다.

② **C6 단색조 + 악센트 1** — 팔레트 구조만 보면 맞다(어둠 + 달빛 한 점). **탈락 둘.** 🔴 이 라인이 이미 **셋을 썼다**(a01 마른 크레용 안개 · a04 흑연+앰버 · c37 해양 워시) — 라인 내 중복이 개별 최적보다 우선한다(§7.6 전례). 그리고 근거상으로도 안 맞는다: C6 은 「**손톱만 한 인물**, 몸짓으로 연기」인데 이 권은 p4 부터 화면이 품·얼굴 크기로 좁혀져 **인물이 화면을 채운다**. 손톱만 한 인물로는 눈꺼풀 높이를 못 쓴다.

③ **C2 선 하나 캐릭터**(E 주제군 1순위) — **탈락.** 🔴 **이 라인이 이미 썼다**(g10 = 떨리는 잉크 선 + 평면 슬레이트 그늘). 그리고 결정적으로 **선 언어는 어둠을 못 그린다** — 흰 종이에 선으로 그린 밤은 「밤이라고 적은 낮」이다. 이 권의 후반 다섯 쪽은 화면 대부분이 어둠이고, 그 어둠 안에서 뺨 한 조각·부리 틈만 밝아야 한다. 선으로는 그 물량이 안 나온다.

**🔴 추천 = 후보 ①.** 주제군 E 의 기준선 1순위는 C2 지만 **소비 맥락(잠자리)과 잦아드는 곡선이 기준선을 이긴다**(§2.11 — 배정은 `주제군 × 엔진 → 앵커`이고 여기에 **라인 내 이웃**이 세 번째 축으로 붙는다). E 는 「웃음·말놀이」지만 이 권의 웃음은 **개그가 아니라 부모의 웃음**이다 — 안 자려고 이유를 대는 아이를 아는 어른이 웃는다. 그 웃음에 굵은 선과 채도는 필요 없다.

**🔴 이 라인에서 C7 이 처음이다 — 그리고 그게 이 배정의 부수 소득이다.** 앵커 열한 개를 배정했는데 C7 이 하나도 없다(C6×3 · C3×3 · C4×2 · C2 · C5 · C8). C7 은 후보 수집에서 **15항목으로 가장 두꺼운 클러스터**인데 아무 권도 안 쓴 이유는 §7.5 교차관찰 1 — 「범용성이 높다 = 가장 평범해지기 쉽다」이고, 처방은 **매체를 반드시 특정하라**였다. 이 권은 그 처방을 만족하는 첫 권이다: 「회화풍」이 아니라 **어두운 종이 · 압축 목탄 · 지우개와 섀미 · 감산**까지 특정된다. 🔴 **C7 을 열 때는 반드시 공정까지 특정한다** — 이 규칙을 §2 에 올린다.

**왜 새 앵커인가.** 이 라인에 C7 이 없고(첫 C7), 매체·공정·종이색이 기존 열한 개 전부와 다르다. 특히 가장 가까운 두 권과 이렇게 갈린다.
- **a04(C6 흑연 + 앰버 1점)** — 흑연도 마른 회색 매체지만 🔴 **방향이 반대다**: a04 = **밝은 회백지에 어둠을 얹는 가산**, 여기 = **어두운 종이에서 빛을 들어내는 감산**. 그리고 a04 의 앰버는 **사물의 색**(오리의 발·창)이고 여기 크림색은 **빛 자체**로 사물에 못 쓴다. 흑연은 연필 선이 남고 목탄은 덩어리가 남는다.
- **c37(C6 해양 워시)** — 둘 다 「값(value)이 서사」다. 🔴 갈라 둔 지점: c37 은 **값이 내려갔다 다시 올라온다**(조수) + 젖음↔마름 대비 + 냉청록 + 빨강 1점. 여기는 **값이 내려가기만 하고 절대 안 돌아온다** + 마른 매체 하나 + 무채 어둠 + **빨강이 아예 없다**. 나란히 놓으면 하나는 넓은 바깥의 낮, 하나는 좁은 안쪽의 밤이다.

**🔴 라인 충돌 확인 (§7.2 분리 규칙).**

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 2D 목탄 드로잉. 실물 입체 재료(양모·바느질·점토) 없음 — NOT 절에 명시 |
| 전래동화 **점눈이** (4축 전부) | ✕ | ① **종이색** — 점눈이는 밝은 크림(=햇빛), 여기는 **중간 어둠 슬레이트-토프 #6A655C**(=불 끈 방) ② **매체** — 느슨한 색연필 낙서가 아니라 **압축 목탄 덩어리 + 지우개 감산**(윤곽선이 아예 없다) ③ **얼굴** — 점눈 2 + 실선 입이 아니라 **큰 원반 눈 + 높이가 바뀌는 윗눈꺼풀 + 벌어지는 부리**(눈꺼풀 높이가 이 권의 착지다) ④ **빨강이 한 점도 없다** — 화면당 빨강 1점 규칙과 정반대 |
| 세계명작 수채 그림풍 | ✕ | 무채 어둠 + 감산 공정. 전면 채색 수채 아님 |
| **a01**(C6 안개 크레용) | ✕ | 냉회록 안개 필드 + 주홍 악센트, 밝은 화면. 여기 = 무채 어둠 + 크림 빛, 어두운 화면 |
| **a04**(C6 흑연+앰버) | ✕ | 위 참조 — 가산↔감산 · 사물색↔빛 · 연필선↔목탄덩어리 |
| **c37**(C6 워시) | ✕ | 위 참조 — 값이 돌아옴↔안 돌아옴 · 젖음↔마름 대비↔마른 매체 하나 · 빨강 1점↔빨강 0 |
| **a91**(C8 워시 + 마른 잉크선) | ✕ | 🔴 둘 다 「악센트가 색이 아니다」인데 방향이 다르다 — a91 = **처음부터 안 칠한 흰 종이(reserve)**, 여기 = **칠한 뒤 덜어낸 자리(lift)**. reserve 는 언제나 종이색이고 lift 는 **지운 테두리에 반쯤 지워진 알갱이 후광**이 남는다. 팔레트도 이끼초록·이탄갈색 ↔ 무채+크림 |
| **g10**(C2 잉크선 + 슬레이트) | ✕ | 밝은 흙빛 종이 + 딥펜 윤곽선 + 평칠 색면. 여기는 **윤곽선 0** + 어두운 종이 + 덩어리 |
| **e03**(C3 리소, 같은 E·같은 엔진) | ✕ | 🔴 **가장 조심한 이웃.** e03 = 밝은 오트 인쇄지 · 평평한 3잉크 · 핀 어긋남 · **밝은 인쇄 포스터 세계**. 여기 = 어두운 종이 · 목탄 덩어리 · 그라데이션이 아니라 지운 후광 · **어두운 밤 방 세계**. 썸네일에서 밝기가 정반대라 같은 책으로 안 보인다 |
| **e120**(C4 오려 붙인 색면, 같은 E·같은 엔진) | ✕ | 평면 무지 색면 + 채도 셋. 여기는 색면이 아예 없고 채도가 0 |

**근거 문법(직접 열람 확인, 2026-07-30 — 이번 세션에 다시 받아서 봄).**
- `cheveau-troupeau`(BRAW 2026 Toddler 특별언급) — 🔴 **주 근거.** ⓐ **어두운 판 위에 마른 매체**로 그렸고, 아래 절반이 **거의 검정 + 가로 나무결**이다 = 우리 나무 구멍 벽 그대로. ⓑ 양 얼굴이 **윤곽선 없이 덩어리 대 덩어리**로 성립한다(눈 = 검정 초크 두 덩이, 코 = 검정 쐐기 하나) — 목탄 덩어리로 부엉이 얼굴을 세우는 방법이 여기 있다. ⓒ 팔레트가 **흰·갈·검 셋뿐**인데 썸네일에서 얼굴이 즉시 읽힌다 = 요구 ②(어두운 화면)와 매력이 양립한다는 실증. ⓓ 🔴 그리고 **BRAW Toddler 는 전량 4세 이하 대중서**라, 여기서 통한 것은 우리 4~6세에서 반드시 통한다(§7.3.1 교차관찰 3).
- `ai-journey`(WIA 2020 HC) — 목탄·연필의 **모든 덩어리에 종이결이 남는** 처리, 거대한 어두운 덩어리 + 손톱만 한 인물, 냉단색조 + 따뜻한 악센트 하나. **매체 처리만 가져온다.** 🔴 **캐릭터 언어는 금지**(라이브러리가 점눈이의 직계 조상으로 표시해 뒀다 — 흰 얼굴 + 점눈 2). 팔레트도 반대쪽으로 간다(그쪽 냉청회 ↔ 우리 크림 빛).
- `brooks-fox`(독일 청소년문학상 2004 그림책) — 오일 파스텔·목탄을 **거친 판에 긁고 문질러** 지지면의 상처가 모든 것 아래에서 읽히는 처리. **긁고 문지르는 것이 정당하다**는 근거로만 쓴다. 🔴 팔레트(황토·적갈·버밀리언)는 통째로 버린다.
- `pinfold-blackdog`·`gwilym-tigers` 는 안 쓴다 — 전자는 전면 균일 마감(§2.10 위너 아님 계열이자 우리 밀도 배급과 반대), 후자는 네온 색이 이 권 팔레트 규율을 부순다.

**밀도 배급 (§2.10 · §2.12).** 10쪽 중 **두 장**. 🔴 이 권엔 무텍스트 쪽이 없으므로 §2.12 의 우선권은 발동하지 않고, 슬롯을 **양 끝**에 준다.
- **p1** — 방 전체가 한 번만 다 보이는 쪽. 여기서 무대(구멍 입구·달·이끼 벽·둥지 바닥)를 독자에게 가르쳐야 나머지 아홉 쪽이 좁아져도 위치를 안다.
- **p10** — 🔴 밀도를 **발밑 셋에만** 준다. 방을 다시 그리면(넓이 곡선이 되돌아가면) 착지가 죽는다. 판정 문장은 셀 수 있다: **「나뭇잎 하나 · 깃털 하나 · 이끼 공 하나가 각각 알아볼 수 있게 있나」**.
- 나머지 여덟 쪽은 어둠 두세 번 칠하고 손 뗀다.

**🔴 대본 SCENE 의 함정 하나를 그림에서 막는다 — p9 의 깃털은 「둘째 깃털」이다.** p9 에서 엄마가 아기 등에 덮어 주는 것은 p3 에 바닥에 깔아 준 그 깃털이 아니라 **또 한 장**이다. 🔴 이게 바닥에 떨어지면 p10 의 셈이 「깃털 둘」이 되어 착지가 통째로 무너진다. 대본은 이미 처리해 뒤 뒀다(p10 = 「등에 얹힌 깃털은 엄마 날개 밑에 가려 안 보인다」). 그림 지시에도 못 박았다: **둘째 깃털은 끝까지 아기 등 위에 있고 p10 에서 엄마 날개에 가려 안 보인다. 바닥에 놓지 말 것.** 덤으로 **엄마 가슴의 얇아진 자리는 열 쪽 내내 한 군데뿐**이다(둘째 깃털을 뽑는 장면은 없으므로 두 번째 맨살 자리를 만들지 않는다).

**다음.** 시트 3장 → 승인 → 🔴 **p1(가장 밝은 판)·p8(가장 어두운 판)** 두 장 확정 → ref 3슬롯(인물 / 🔴 어둠이 형태 없이 남은 컷(p7) / 전체 장면(p1)). 승인 렌더가 나오면 §0.5 등록부에 번호 등재(이름은 렌더가 준다).

---

## E-09 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-nightlift  (owlet & mother owl / Nordic pine tree-hollow nest /
  a bedtime book)

Style: a hand-made picture-book page for 4-6 year olds, drawn to be read with the lamp about to
  go off. Dark, warm, grainy, quiet, un-slick. The book has one event - the light and the noise
  drain out of the room until a sentence stops in the middle - so the DRAWING ITSELF has to drain.

MEDIUM: compressed charcoal, soft black pastel and a little cool grey chalk worked on MID-DARK
  toned paper with a coarse tooth.
  🔴 THE PICTURE IS MADE BY TAKING LIGHT OUT, NOT BY PUTTING LIGHT ON. The page begins as dark
    paper covered in charcoal. Every lit thing is LIFTED back out with a kneaded eraser and a
    chamois, so light has a softly rubbed edge, a faint halo of half-erased grain around it, and
    the paper's tooth showing through inside it. Darks are pressed in with the flat of the
    charcoal stick, deepest and greasiest in the crevices.
  🔴 THE AMOUNT OF LIFTING GOES DOWN, PAGE BY PAGE, AND NEVER GOES BACK UP. That decrease IS the
    story. The first page has the largest lifted area in the book; the last pages are almost
    entirely charcoal with two or three small lifted places.
  Charcoal dust, a fingertip smudge and the speckle of fixative are legitimate and wanted - this
    is a book about breathing in a dark room.
  Shapes are made by a lifted edge or a pressed mass, NEVER by a drawn contour. There is no pen
    line and no ink line anywhere in this book. Highlights are NEVER white paint or white gouache
    added on top - they are erased out of the dark.
  No airbrush, no digital soft glow, no lens bloom, no smooth gradient, no drop shadow, no
    paper-texture filter laid over flat digital colour.

PALETTE: three tones and one warm light. Nothing else exists.
  Hex anchors: toned paper (mid slate-taupe) #6A655C / charcoal black #1B1917 /
    cool grey chalk #9C9A90 / 🔴 moonlight cream #E9DCBE (its weaker step #C7B893).
  🔴 THE ONE WARM IS THE LIGHT ITSELF, NOT AN OBJECT. The pale wheat-cream belongs only to what
    the moonlight from the hole actually reaches. It is never used to colour a bird, a leaf, a
    wall, moss or sky, and it is never sprayed around edges as a warm rim-light for prettiness.
  🔴 THERE IS NO RED, NO ORANGE, NO PINK, NO BLUE, NO GREEN AND NO PURPLE anywhere in this book.
    The moon is warm cream, never blue-white. The night outside the hole is the same charcoal as
    the inside, only flatter.
  🔴 THE NARRATIVE COLOUR IS THE AREA OF LIGHT. If the first page and the last page carry the
    same amount of light, the book has failed.

MATERIAL TRANSLATION (🔴 keep it drawn in charcoal - never photographic, never plastic):
  - HOLLOW WOOD WALL = the long grain of split pine, four or five dragged charcoal strokes that
    follow the curve of the hollow, broken up by the paper tooth. NOT rendered bark, NOT every
    fibre drawn, NOT a wood-texture photograph.
  - MOSS ON THE WALL = a soft crumbly mass made by scrubbing charcoal with a fingertip, its edge
    left ragged. Where a handful has been torn away, the bare wood underneath is LIFTED lighter.
    NOT individual leaves, NOT green.
  - THE DEW LEAF = a cupped leaf drawn as a dark plane; the water in its cup is two or three tiny
    LIFTED specks of bare cream. NOT a glass droplet, NOT a specular highlight, NOT a rendered
    reflection.
  - A BREAST FEATHER = one soft downy plane; its edge dissolves into charcoal dust on the dark
    side and is lifted crisp on the lit side. NOT drawn barb by barb.
  - THE MOSS BALL = a loosely squeezed round clump with three or four loose strands escaping.
    Same size and same silhouette on every page it appears.
  - MOONLIGHT THROUGH THE HOLE = a shaft with a softly rubbed edge, dustier through the middle,
    LIFTED out of the dark so it carries grain inside it. NOT a glowing volumetric beam, NOT
    god-rays, NOT bloom, NOT a lens flare.
  - FEATHERS ON THE BIRDS = large soft masses; only the rim the moonlight touches is lifted. NOT
    every feather drawn, NOT a fur render.
  - PINE NEEDLES IN THE NEST = a few dry scratched lines in one corner only. NOT a described
    carpet of needles.

COMPOSITION: 🔴 ONE FIXED STAGE FOR ALL TEN PAGES.
  The round mouth of the hollow is at the UPPER RIGHT with one slice of moon inside it; the mossy
  wall is at the LEFT; the nest floor runs along the BOTTOM. This arrangement never changes at
  any distance or angle - it is how the reader knows we never left the room.
  The mother stays lower right, the owlet stays centre-left.
  🔴 THE FRAME GETS NARROWER AS THE BOOK GOES ON and never opens back out: whole room -> two
  thirds of the room -> the floor -> the chest -> the space between them -> half a wing -> under
  the wing -> one face -> a back -> one face with three things in front of it.
  Diagonals early, almost nothing tilted at the end.
  Keep the bottom 18% of the image quiet and free of key subject matter (a caption band is laid
  over it later). 🔴 ON THE LAST PAGE the three objects sit in the lower third but clearly ABOVE
  that band - not inside it.

FINISH HIERARCHY - read this twice. This is about how FINISHED each area is, NOT about opacity,
  blur or focus.
  1. THE BIRD BEING LOOKED AT = finished. Pressed masses, lifted rim, drawn eye and beak.
  2. WHAT IT TOUCHES OR IS GIVEN on that page (the one leaf, the one feather, the moss ball, the
     patch of wall the mother reaches into) = half-finished: a mass plus one lifted edge.
  3. EVERYTHING ELSE = THE DARK ITSELF, laid in two or three broad charcoal passes and left
     alone. Open shapes, no description inside them.
  🔴 The dark is NOT blurred, NOT hazy, NOT faded and NOT out of focus. It is simply NOT DRAWN.
  A confident flat charcoal mass is correct; a soft finished haze is wrong.
  🔴 NEVER draw every wood fibre, every needle in the nest, every strand of moss or every
  feather. If the hollow is fully described, the small lifted light stops being the brightest
  thing on the page and the whole book stops working.

CHARACTER DESIGN (both owls): they stand on TWO FEET and use their WINGS AS ARMS - wings hug,
  rub eyes, hold, spread, cover. 🔴 They have NO hands, NO fingers, NO arms and NO nose. Only
  beak, wings, feet, toes, breast feathers and eyes exist.
  The acting system is the EYELID and the BEAK GAP: a heavy upper lid that can sit at any height
  from fully round to a slit, and a beak that can gape wide, part a crack, or work up and down.
  Eyes are large round discs with a LIFTED crescent of light on one side - that crescent is
  erased out of the dark, never a painted white catchlight dot.
  Their down breaks the silhouette into a soft fuzzy edge made of lifted grain, never a clean
  outline.

SETTING: inside the hollow of a big old pine in a northern European forest at night. Split pine
  walls with long grain, a cushion of moss on the left wall, a floor of dry needles, a round
  opening at the upper right with one slice of moon and a single pine-branch silhouette in it.
  NO furniture, NO lamp, NO window frame, NO stars scattered across a sky, NO other animals.

DRAIN MAP (the state of the four axes on each spread - the whole book is this curve):
  p1  light: one large lit oval on the floor   · contrast: MAX      · motion: springing up
  p2  light: same oval, mostly covered by wings· contrast: MAX      · motion: wings thrown wide
  p3  light: one small patch under the feet    · contrast: softening· motion: toes working
  p4  light: a thin skim from above            · contrast: grain mushing · motion: hugging
  p5  light: the oval's edge dissolves         · contrast: collapsing· motion: tipping over
  p6  light: the frame splits in half          · contrast: one hard edge only · motion: head tilt
  p7  light: one sliver on a cheek             · contrast: dark wins · motion: sliding in
  p8  light: only two planes stay crisp        · contrast: replaced by depth · motion: beak only
  p9  light: grain floating in layers          · contrast: evenly sunk · motion: feather + roll
  p10 light: a beak gap and three top surfaces · contrast: no steps left · motion: none

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT digital airbrush / NOT smooth gradients / NOT glossy 3D CG render / NOT cel-shaded
  anime / NOT a paper-texture filter laid over flat digital colour (the charcoal must MAKE the
  shapes) / NOT photographic / NOT a glowing volumetric moonbeam or god-rays / NOT lens bloom or
  flare / NOT white paint highlights added on top / NOT any drawn ink or pen contour line / NOT a
  fully rendered background / NOT every wood fibre, needle, moss strand or feather drawn / NOT a
  uniform finish across the page / NOT a hazy, blurry or faded background (that is blur, not
  un-drawn) / NOT any red, orange, pink, blue, green or purple anywhere / NOT a blue-white moon /
  NOT hands, fingers, arms or noses on the owls / NOT wool felt, NOT stitched fabric, NOT
  sculpted clay (other lines own those) / NOT dot-eyes on bright cream paper with a red thing on
  every page (that is another line) / NOT any lettering, numerals or signage anywhere in the
  image.
```

**🔴 이 앵커의 세 불변 규칙 (매 컷 반복 확인)**

**규칙 A — 잦아드는 곡선.** 컷마다 `SETTLE:` 줄을 **가장 먼저** 읽는다. 그 줄이 그 쪽의 빛 면적·대비·움직임·컷 넓이를 한꺼번에 정한다. 🔴 **네 축은 같이 내려간다** — 하나만 내려가면 곡선이 안 보이고, 하나라도 올라가면 곡선이 깨진다. p9·p10 에서 얼굴이 커지는 것은 **넓이가 되돌아온 것이 아니다**(방은 안 돌아온다).

**규칙 B — 발밑 셋 스케줄.** 컷마다 `FLOOR THREE:` 줄을 반드시 읽는다. 🔴 **개수를 세는 쪽은 p10 하나뿐이다.** p3~p9 는 있는데 안 세어져야 한다 — 겹치게 놓고, 발·그림자·날개로 반쯤 가리고, **한 줄로 나란히 놓지 않는다**.

| | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| 바닥 | 없음 | 잎 1 | 잎+깃털 2 | 2(초점 밖 잘림) | 2(흩어짐) | 2(날개 그림자 밑) | 2(어둠 속 결만) | 프레임 밖 | 2 + 굴러 내리는 공 | 🔴 **셋이 나란히·세어짐** |
| 이끼 공 | — | — | — | 품에 안김 | 가슴에 걸침 | 한 날개에 | 계속 안김 | 아래 결만 | 🔴 **굴러 내리는 중** | 바닥의 셋째 |
| 둘째 깃털 | — | — | — | — | — | — | — | — | 등에 얹히는 중 | 🔴 **날개에 가려 안 보임** |

**규칙 C — 지워지지 않는 두 흔적.** ① 왼쪽 벽의 **이끼 뜯긴 자리**(p4 에 생겨 p10 까지 남는다 — 밝은 나무살이 드러난 자리). ② 엄마 가슴의 **깃털 얇아진 한 자리**(p3 에 생겨 p10 까지 남는다 — 살결이 비친다). 🔴 **둘 다 한 군데씩만 있고 늘지 않는다.** 특히 가슴의 맨살 자리를 두 군데로 만들지 말 것(p9 의 둘째 깃털을 뽑는 장면은 이 책에 없다).

---

## E-09 §3. 캐릭터 시트 (🔴 이것부터 굽는다)

```
CHARACTER SHEET - BabyOwl   (bake FIRST, before any scene)

🔴 THE SHEET IS DRAWN IN THE SAME MEDIUM AS THE BOOK. Compressed charcoal and soft black pastel
  on MID-DARK toned paper #6A655C, with the light LIFTED out using a kneaded eraser. The paper
  around the bird is the dark toned paper itself, not white. Charcoal grain must be visible in
  every mass, the down must break the silhouette into soft lifted grain, and there must be NO
  drawn contour line anywhere. Do NOT render this owl smoothly just because there is no scenery
  behind it. There is no red, orange, pink, blue or green on this sheet.

FACE: a wide soft round face on an oversized round head. Two LARGE ROUND EYES, each a dark disc
  #1B1917 with a LIFTED crescent of pale cream #E9DCBE along one side - the crescent is erased
  out of the dark, never a painted white dot.
  🔴 THE UPPER EYELID IS THE ENTIRE ACTING SYSTEM, and the beak gap is the second half of it:
    wide awake   = lids fully up, eyes perfectly round, the ridge of down above each eye lifted
    shouting     = lids squeezed to a hard curve, beak gaping wide and aimed upward
    working      = lids at half, eyes glancing up from under them
    tired-rubbing= lids shut, both wingtips pressed over the eyes
    half-gone    = lids at three quarters, the pupil almost hidden, focus far away
    🔴 last page = lids at nine tenths (the eye almost closed) BUT THE BEAK IS CLEARLY PARTED,
                   still mid-word. This one drawing is the landing of the whole book: asleep
                   eyes, awake mouth. Draw it on this sheet and settle it here.
  A short hooked beak that can gape, part a crack, or work up and down. A ridge of soft down over
  each eye that can lift or press down. No eyebrows made of hairs, no blush, no glossy catchlight.
BODY: an oversized round head on a small pear body, all soft down, the silhouette fuzzy with
  lifted grain. Two short legs, plantigrade, three visible toes on each foot that can curl and
  grip. A stubby tail.
WINGS AS ARMS: the wings are used the way arms are - thrown wide, folded across the chest to hug,
  raised to rub the eyes, laid down loose. Wingtips can cross in front of the body.
  🔴 NO hands, NO fingers, NO arms, NO nose.
SIZE: about one third of the mother's height. Head is nearly half the body height (this is a
  small chick and it should read as one).
BUILD & SILHOUETTE: silhouette = big round head + small pear body + two short legs, instantly
  distinct from the mother (who is tall, long-necked and heavy-browed) at thumbnail size.
REFERENCE SHEET: full body standing, seen from slightly above (the book's main angle) /
  three-quarter view springing up on tiptoe with both wings half-raised for balance /
  front view with both wings thrown wide open and the beak gaping upward /
  front view hugging a round clump against the chest with both wingtips overlapped /
  back view from above, head buried into a larger chest so no face shows (only the back of the
  head, the back and two feet with toes pressing the floor);
  plus FIVE face close-ups: wide awake / shouting / rubbing both eyes with wingtips /
  half-lidded with the focus far away / 🔴 lids nine tenths closed with the beak clearly parted
  mid-word.
  Plain mid-dark toned paper background, no scenery.
FACE SEPARATION (required): the eyes must read APART from the head mass in VALUE - a lifted rim
  of light where the face meets the head, so the face is never one flat dark blob. Test: shrink
  this sheet to thumbnail size and the mood must still be legible. This adds no colour.
SCENE token: BabyOwl.
```

```
CHARACTER SHEET - MotherOwl   (bake SECOND, attach as @image2)

🔴 SAME MEDIUM AS ABOVE - charcoal and soft black pastel on mid-dark toned paper, light lifted
  with a kneaded eraser, grain visible, no drawn contour line, no white paint highlights.

FACE: a tall narrow face with a heavy brow ridge of down that shadows both eyes. Two round eyes,
  the same construction as the owlet's (dark disc + one lifted crescent) but 🔴 HELD LOW almost
  the whole book - lids at half or shut. A longer hooked beak used to preen, to carry and to sing
  with (parted only a crack, low).
  Expressions: half-lidded calm (default) / eyes fully shut while singing with the beak parted /
  🔴 both eyes wide open and the HEAD TURNED RIGHT AROUND away from her body (owls do this) while
  she scans the nest - this is the only page she looks worried, and her body does not turn.
BODY: tall and soft, about three times the owlet's height. A LONG NECK that can stretch far down
  and forward, or fold away into the shoulders. Broad breast of deep soft down. Two strong feet.
🔴 CHEST STATES - draw BOTH on this sheet, side by side, labelled:
  CHEST-FULL   = the breast down is thick and even.
  CHEST-THINNED= ONE patch of breast down has been pulled out. The skin under it shows as a small
                 LIFTED pale patch, ringed by disturbed down that points the wrong way.
  🔴 There is only ever ONE such patch, it appears from the page where she gives a feather onward,
  and it never heals and never multiplies. Do not draw a second bald spot anywhere.
WINGS AS ARMS: one wing can be spread wide sideways to make a dark opening underneath it big
  enough for the whole owlet - 🔴 THAT OPENING IS A DRAWING IN ITS OWN RIGHT: the inside of the
  spread wing is the deepest, most featureless charcoal in the book, and its edge runs as one
  clean diagonal from upper right to lower left.
  🔴 NO hands, NO fingers, NO arms, NO nose.
BUILD & SILHOUETTE: silhouette = tall body + long neck + heavy brow + one long spread wing.
  Instantly distinct from the owlet by height and by neck, even in solid black.
REFERENCE SHEET: full body sitting-standing, seen from slightly above /
  three-quarter with one wing spread wide sideways showing the dark opening beneath it /
  front view with the long neck stretched down and a large soft feather held in the beak tip /
  a close-up of the breast in BOTH states side by side (CHEST-FULL / CHEST-THINNED) /
  plus THREE face close-ups: half-lidded calm while preening / eyes shut and beak parted low,
  singing / both eyes wide with the head turned right around away from the body, scanning.
  Plain mid-dark toned paper background, no scenery.
FACE SEPARATION (required): same rule as the owlet - the eyes read apart from the head in VALUE
  via a lifted rim, never one flat mass.
SCENE token: MotherOwl. Never write "owl" on its own.
```

```
CHARACTER SHEET - NestThree   (bake THIRD, attach as @image3 — 🔴 this sheet is the last page)

🔴 SAME MEDIUM AS ABOVE - charcoal on mid-dark toned paper, light lifted, no contour line.
  These three objects are what a four-year-old counts on the final page, so they are treated with
  the same care as the characters.

DewLeaf: a cupped leaf, as wide as the owlet's chest, drawn as one dark plane with a lifted rim
  along the cup. Two or three tiny LIFTED specks of bare cream sit in the cup as water. On the
  pages after it is drunk, the cup is empty but it is the SAME leaf - same size, same place, same
  silhouette. NOT a glass droplet, NOT a shiny highlight.
BreastFeather: one big soft downy feather, as wide as the owlet's two feet together so the chick
  can stand on it. One side dissolves into charcoal dust, the lit side is lifted crisp. NOT drawn
  barb by barb.
MossBall: a loosely squeezed round clump about the size of the owlet's chest, with three or four
  loose strands escaping. Crumbly scrubbed charcoal, ragged edge.
🔴 THE THREE MUST BE THREE DIFFERENT SHAPES, recognisable from silhouette alone at thumbnail size
  - a flat cupped oval / a long soft plume / a round clump. If two of them read as the same lump,
  the last page cannot be counted.
REFERENCE SHEET: the three objects separately at correct relative scale beside a small silhouette
  of BabyOwl for size; PLUS 🔴 one panel of the three lying SIDE BY SIDE from left to right, not
  overlapping and not touching, with light lifted ONLY along their top surfaces and the floor
  around them left as flat dark charcoal. That panel is the foreground of the final page - settle
  it here.
  Plain mid-dark toned paper background.
SCENE tokens: DewLeaf, BreastFeather, MossBall.
```

---

## E-09 §4. 10컷

각 컷은 `STYLE ANCHOR + @image1(BabyOwl) + @image2(MotherOwl) + @image3(NestThree) + 아래 블록` 으로 합성한다. p1 이 승인되면 그 렌더도 함께 붙여 무대 배치를 고정한다.

### p1 — 방이 한 번만 다 보인다 (🔴 밝은 판 ref · 밀도 슬롯 1)
```
SETTLE: 🔴 STAGE 1 OF 10 - THE BRIGHTEST AND WIDEST PAGE IN THE BOOK. The largest lifted area,
  the hardest contrast, the biggest movement, the whole room in frame. Everything after this only
  goes down. This page doubles as the anchor's LIGHT reference plate.
CAMERA: wide, a little above a child's eye level, looking into the hollow so the whole room reads
  at once and the round opening at the upper right is inside the frame.
SUBJECT: lower right, MotherOwl sits low with her body turned left and her long neck reaching
  across, and 🔴 the very tip of her beak is still touching one loose feather behind the owlet's
  head - she is still in the middle of preening. Her lids are at half, aimed at his head.
  Under that beak, at centre-left, BabyOwl has just sprung up onto his toes - his feet are barely
  off the floor, both wings half-raised for balance, his beak gaping upward, his eyes fully round
  and his look sliding PAST her face to the moon in the opening at the upper right.
  🔴 Two feet, wings used as arms, no hands, no fingers, no arms, no nose.
SETTING: the fixed stage established here for all ten pages - split pine wall with long grain,
  a thick cushion of moss on the LEFT wall (no piece torn out of it yet), a floor of dry needles
  along the BOTTOM, the round opening at the UPPER RIGHT holding one slice of moon and one
  pine-branch silhouette. The branch is caught mid-sway.
  MotherOwl's breast is CHEST-FULL on this page.
FLOOR THREE: 🔴 nothing on the floor yet. The floor in front of the owlet is empty.
FINISH: both birds finished. The patch of wall her beak works over, and the needles under his
  feet, half-finished. 🔴 Density slot: this is one of only two pages where the room may carry
  more objects - but they are OBJECTS (moss cushion, opening, branch, needle floor), never more
  detail inside each one. Everything past them is two charcoal passes.
TONE: the moonlight comes in at a slant and lifts ONE large bright oval on the floor at the left,
  and the owlet springs up inside that oval. This is the widest gap between light and dark in the
  book. The mother's side is dark enough that the eye goes to him first. The feeling is a day the
  child does not believe is over.
```

### p2 — 둥지가 울릴 만큼 크게
```
SETTLE: STAGE 2 OF 10 - the light stays as large as page one but the owlet's spread body now
  covers most of it, contrast still at maximum, the movement at its biggest, the frame down to
  two thirds of the room. 🔴 This is the loudest page; nothing after it is louder.
CAMERA: medium wide, child's eye level. The owlet fills the left two thirds of the frame; the
  mother sits low at the right.
SUBJECT: BabyOwl braces on both feet and throws both wings out sideways so they nearly cross the
  whole frame. His beak gapes wide and aims up, his lids are squeezed to a hard curve, the down on
  his head sticks out, his body leans back and his toes grip the floor. 🔴 One single bead of dew
  still hangs from the tip of his lower beak.
  Lower right, MotherOwl has already pulled her beak back and closed it, one wing still half down
  beside the leaf on the floor. Her lids are at half and she has drawn her neck back a little
  because the noise is loud - that retreat is how loud the page is.
SETTING: fixed stage. Moss cushion on the left wall still whole. Opening and moon at the upper
  right, same place and same size as page one. MotherOwl is CHEST-FULL.
FLOOR THREE: 🔴 one object. DewLeaf lies on the floor at centre-left, 🔴 INSIDE the lifted light
  and OUTSIDE the owlet's own shadow, with two or three lifted specks of water still in its cup so
  it reads as something just set down. Nothing else on the floor.
FINISH: the owlet finished; the mother finished; DewLeaf half-finished. The wall behind the spread
  wings is flat charcoal - the wings throw two broad dark shapes onto it and nothing inside those
  shapes is described.
TONE: the noise hits the walls. The lifted area is as big as page one but the owlet's body now
  sits over most of it, so only the leaf's patch of light is left glinting. Keep the two shadows
  the spread wings cast wide and soft-edged.
```

### p3 — 발밑 한 자리만 밝다
```
SETTLE: STAGE 3 OF 10 - the lifted light shrinks to ONE SMALL PATCH under his feet, contrast
  starts softening (edges rubbed rather than pressed), the movement drops from the whole body to
  the toes, the frame drops from the room to the floor.
CAMERA: medium, LOW angle from floor height looking up, so the owlet's feet and the floor in front
  of them are the largest things in frame and his face sits high in the picture. The ceiling
  darkness of the hollow opens up wide above him.
SUBJECT: BabyOwl stands on a big soft feather and works his toes one by one, gripping and letting
  go - 🔴 the toes are the biggest movement on the page and the nearest thing to camera. His beak
  is open shouting but his neck is less thrown back than on the previous page and both wings are
  held in against his body. His lids are at half, glancing up from under them.
  Lower right, MotherOwl leans her chest toward him and holds still. 🔴 ONE PATCH of her breast
  down is now pulled out and the skin under it shows as a small lifted pale patch (CHEST-THINNED
  from this page to the end). Her beak is shut, her lids low, aimed at his feet.
FLOOR THREE: 🔴 two objects, and they must NOT be countable. DewLeaf sits at the left in exactly
  the place it was on page two (a couple of lifted water specks left in the cup); BreastFeather
  lies to its right and 🔴 the owlet is standing ON it, so his feet and working toes cover about
  half of it. They overlap in depth and are not lined up in a row.
FINISH: the owlet finished. BreastFeather under his feet and DewLeaf half-finished. The rock-like
  ceiling darkness above him is one broad charcoal mass with nothing in it - no wood fibre, no
  needles. Moss cushion on the left wall still whole.
TONE: the second shout, and the page is pressed lower. The low angle makes the darkness above him
  enormous, and light reaches only the one patch under his feet. Shadow edges are rubbed softer
  than page two so the weight moves off sound and onto touch.
```

### p4 — 품 크기로 좁아진다
```
SETTLE: STAGE 4 OF 10 - light comes in as a thin skim from above and touches only the top of what
  he holds, contrast begins to mush into grain, the movement is a squeeze rather than a throw, the
  frame is down to the size of his chest.
CAMERA: medium close-up, slightly above eye level. His upper body and what he is holding fill the
  centre; the mother is present only as a long neck and a beak tip entering from the right edge.
SUBJECT: BabyOwl stands and folds both wings across his chest, squeezing MossBall so hard that the
  wingtips overlap and crushed moss pushes out between them. He rests the underside of his beak on
  top of the ball and parts it only a little to speak. His lids are at half and his look drops
  downward. 🔴 The voice has come down one step and the body shows it - nothing is thrown, only
  held.
  From the right edge, MotherOwl's long neck and one wingtip reach in as she draws back from the
  left wall. 🔴 Strands of moss are tangled on that wingtip and a few crumbs are left on her beak
  tip - that is how the ball got made (with a wing, never a hand).
SETTING: fixed stage, but the frame is now so tight that only wall grain and the opening remain.
  🔴 ON THE LEFT WALL, ONE HANDFUL OF MOSS HAS BEEN TORN OUT and the bare wood under it is LIFTED
  lighter. That torn place stays for the rest of the book.
FLOOR THREE: 🔴 two on the floor plus one held. DewLeaf and BreastFeather are cropped by the
  bottom edge of the frame and fall outside the finished area, so they read as shapes and cannot
  be counted. MossBall is in his wings, not on the floor.
FINISH: the owlet and the ball finished. Her reaching neck, wingtip and the torn moss patch
  half-finished. The wall is two charcoal passes; the opening is a dark shape with the moon in it.
TONE: the page where the voice drops a step. The frame closes to chest size and the wall grain
  mushes out. The thin skim of light from above raises only the fuzz on the surface of the moss
  ball. Warmth pressing the sound down.
```

### p5 — 둘 사이가 가장 넓게 비어 있다
```
SETTLE: STAGE 5 OF 10 - the lifted oval loses its edge and bleeds into the dark, contrast
  collapses, the movement is a loss of balance rather than an action, and the frame holds the two
  of them with a wide empty gap between.
CAMERA: medium wide, eye level. Owlet at the left, mother at the right, 🔴 and the space between
  them is the emptiest area in the book.
SUBJECT: BabyOwl's feet have slid apart and his balance is gone - his upper body tips forward, the
  weight of his head pulls it over to one side, and both wings are raised to his face with the
  wingtips rubbing his shut eyes. Between them his beak is open, still shouting. MossBall is no
  longer hugged; it is barely wedged against his chest, about to be nothing but pressed.
  Lower right, MotherOwl has one wing lifted halfway to hand something over and it has STOPPED in
  mid-air with nothing under it; her other wing braces on the wall. Her beak is shut. 🔴 Her head
  is turned right around AWAY from the owlet, both eyes wide, scanning the mossy wall and the far
  corner of the floor - the owlet is not in her view at all, and her body has not turned.
  She is CHEST-THINNED.
FLOOR THREE: 🔴 two on the floor, scuffed out of place. DewLeaf and BreastFeather have been pushed
  slightly apart by his sliding feet and each is half swallowed by his own shadow. 🔴 Do not let
  them line up and do not let them be counted. MossBall is at his chest.
FINISH: both birds finished. The two floor objects half-finished at most. The wide gap between the
  two of them is bare dark - nothing at all is drawn in it. The torn moss patch stays visible on
  the left wall.
TONE: the page where contrast falls apart. The bright oval on the floor loses its boundary and
  bleeds outward, and the whole picture leans the way his body leans. Almost no light reaches her
  side. The empty middle is where the noise used to be.
```

### p6 — 화면이 절반으로 갈린다
```
SETTLE: STAGE 6 OF 10 - the page is split in half by ONE hard edge and that edge is the only
  contrast left, the movement is a head tilt and nothing else, the frame is down to half a wing.
CAMERA: medium, tilted slightly UP from the owlet's height, as if the spread wing were coming down
  over us. The spread wing covers the RIGHT HALF of the frame; the owlet stays small at the left.
SUBJECT: lower right, MotherOwl turns her body a little toward him and spreads the near wing out
  sideways in one slow movement. 🔴 The wing reaches the middle of the frame and beneath it opens
  a dark space big enough for the whole owlet. Her beak is shut and her lids are half down, aimed
  low in front of her, NOT at him.
  At the left, BabyOwl stands on both feet with MossBall held in one wing and tips his HEAD
  sideways to look into the dark under the wing - 🔴 only the head tilts; both feet stay planted.
  His beak is shut and his eyes are wide on one point inside that dark.
SETTING: fixed stage. Opening and moon at the upper right, now partly behind the raised wing. The
  torn moss patch still shows on the left wall.
FLOOR THREE: two on the floor, under the shadow the spread wing throws over them - DewLeaf and
  BreastFeather are shapes inside that shadow, half-finished at most. 🔴 Not countable. MossBall
  is in his wing.
FINISH: both birds finished. The floor objects under the wing shadow half-finished. 🔴 The inside
  of the spread wing is the emptiest, deepest charcoal so far - no feather structure inside it at
  all.
TONE: one clean diagonal edge runs from the upper right down to the lower left, and that edge is
  the only crisp thing on the page. It leads straight into the owlet's eye so the reader's look is
  pulled into the dark with his. Where the words stopped, only breathing is left.
```

### p7 — 날개 밑으로 들어가는 중
```
SETTLE: STAGE 7 OF 10 - the dark takes most of the page and the only lifted place is a sliver on
  his cheek, contrast is gone (the dark simply wins), the movement is a slide that is already
  slowing, the frame is down to the space under the wing.
CAMERA: medium close-up, slightly high angle. Her breast and the space under the wing fill the
  picture; he is only half inside it.
SUBJECT: centre, BabyOwl is half into the dark under her wing - his back, both feet and the tip of
  his tail are still outside it, his toes pushing the floor, and his face is right on the boundary
  of the dark. His lids are at three quarters and his beak is shut. One wing still holds MossBall.
  Upper right, MotherOwl folds down and around him. Her beak is parted only a crack, low, singing;
  both her eyes are fully shut. The spread wing runs past his back and comes down near the floor at
  the left. She is CHEST-THINNED.
FLOOR THREE: two on the floor, 🔴 down in the darkness at the bottom of the frame where only their
  grain shows - present, unmistakably not gone, and impossible to count. MossBall is still held.
FINISH: 🔴 the owlet's face and her singing beak finished, and NOTHING ELSE IS. Her breast and the
  wing are broad charcoal masses with no feather described in them. The floor is one dark pass.
  This is the least-drawn page in the book and it is the anchor's reference plate for un-drawn dark.
TONE: dark covers most of the surface and the only light left is one sliver on his cheek and the
  edge of a three-quarter-closed eye. Masses are heavy and slow so the sliding movement looks like
  it is gliding to a stop. Close enough to hear a heartbeat.
```

### p8 — 얼굴 하나와 저 뒤의 달 (🔴 어두운 판 ref)
```
SETTLE: STAGE 8 OF 10 - 🔴 THE NARROWEST AND DARKEST PAGE IN THE BOOK, the low point of the curve.
  Only two planes stay crisp, contrast is replaced by depth, the only movement is the beak working,
  and the frame is one face. This page doubles as the anchor's DARK reference plate.
CAMERA: close-up on the owlet's face, LOW angle following his look upward so the round opening at
  the upper right is inside the frame.
SUBJECT: BabyOwl has his cheek half buried in her breast down and lifts only his face. His lids are
  at three quarters, heavy, his focus far away. 🔴 His beak works slowly - the upper and lower beak
  part and meet, part and meet - and that is the only movement anywhere on the page.
  MotherOwl is only breast down and the underside of her throat at the top and right of the frame;
  her face is outside it. Her down is pressed and parted where his cheek pushes into it, and 🔴 one
  place beside his cheek is still thin with the skin showing (CHEST-THINNED, unchanged since it was
  made).
SETTING: the opening at the upper right with one slice of moon in it - 🔴 in this page ONLY, the
  distant moon is as crisp as his eye. Same place and same size as page one. Everything between
  them loses its shape.
FLOOR THREE: 🔴 out of frame entirely. MossBall shows only as grain along the bottom edge.
FINISH: 🔴 exactly two things are finished on this page: his eye and the far moon. The down, the
  wall and everything between them are broad soft masses that read as layers of depth and nothing
  more. This is not blur - it is un-drawn.
TONE: very shallow depth. Two planes crisp, everything between them dissolved into layers, so the
  look pushes back from the eye into the far dark. As the voice fades the edges of the picture back
  away with it.
```

### p9 — 굴러 내리는 공
```
SETTLE: STAGE 9 OF 10 - light shows as grain floating in layers rather than as a lit shape,
  contrast is evenly sunk (no steps anywhere), and the movements are two small ones. 🔴 The face is
  gone from this page, so it reads as narrower than the last even though we are further back - the
  room does NOT come back.
CAMERA: medium close-up, HIGH angle looking down. Her breast and long neck and his back fill the
  frame; the floor is a narrow strip at the bottom front.
SUBJECT: lower right, MotherOwl stretches her neck long and lowers her beak over his back, 🔴 just
  setting down a SECOND large soft feather in the middle of his back - the feather is still just
  caught on her beak tip. Her lids are at half and her beak is parted low, breathing out.
  BabyOwl is buried into her breast so only his back and the back of his head show - no face.
  🔴 HE IS NOT ASLEEP YET, and two small things prove it: his toes still press the floor enough to
  flatten a needle under a claw, and the down where his beak is buried is pushed slightly to one
  side, as if a word were on the way.
  🔴 MossBall has just come loose from his slackening wingtip and is CAUGHT MID-ROLL between his
  foot and the floor, clearly tilted and clearly moving. Do not park it flat - a stopped ball reads
  as "one more thing was added" instead of "he let go".
FLOOR THREE: 🔴 two on the floor plus one rolling. DewLeaf and BreastFeather are cut in half by the
  bottom edge of the frame; MossBall tilts in the gap between them and his foot. Her wing and its
  shadow cover about half of all this. 🔴 Do not let the three line up and do not let them be
  counted yet.
FINISH: her beak with the feather on it, and the rolling ball, finished. His back half-finished.
  The floor strip and everything else is one dark pass. The torn moss patch shows on the left wall.
TONE: thick air. Breath and fine dust float in layers so the light reads as grain rather than as a
  shape, and only two things move through it: the feather on her beak and the ball going down. Slow
  enough that his back can be seen to rise and settle.
```

### p10 — 말이 끊긴다 · 발밑에 셋 (🔴 착지 · 밀도 슬롯 2)
```
SETTLE: 🔴 STAGE 10 OF 10 - ALMOST NOTHING. No steps left between light and dark, no tilted or
  reaching line anywhere in the frame, one mass and three small things. The only light in the book
  left is a beak gap and three top surfaces. 🔴 The room does not come back: the face gets bigger,
  the ROOM does not.
CAMERA: medium, eye level. His face sits at the centre of the frame at about a third of the picture
  height; the three objects lie in the near foreground as a band across the lower third, 🔴 clearly
  above the bottom 18% caption band.
SUBJECT: BabyOwl has his beak buried in her breast down and 🔴 IS STILL SPEAKING. The buried upper
  and lower beak are clearly PARTED and the down at that place is pushed aside - that gap and that
  pushed down are the most crisp things on the page. His lids are nine tenths closed, the eye almost
  gone under them. One wing lies over her breast, the other hangs down to the floor and its tip
  touches MossBall.
  🔴 DO NOT DRAW HIM ASLEEP. If the beak is shut, the landing of the book disappears.
  Behind and above, MotherOwl is still, eyes shut, her beak laid on top of his head, both wings
  closed over him so their two outlines run together into ONE mass. The place where his cheek rests
  is still thin with the skin showing. 🔴 The second feather on his back is hidden under her wing
  and cannot be seen - do not put it on the floor.
SETTING: fixed stage - opening and moon at the upper right in the same place and the same size as
  page one, the torn moss patch on the left wall, the needle floor along the bottom. Deep night.
FLOOR THREE: 🔴 THE ONLY PAGE WHERE THEY ARE COUNTED. DewLeaf, BreastFeather and MossBall lie in
  the near foreground in a row from LEFT to RIGHT, not overlapping and not touching, each one whole
  and each clearly a different shape. They need not be large - only countable. 🔴 Density slot: the
  density of this page goes into these three objects and NOWHERE else.
FINISH: his face finished; the three objects finished. Her mass and the whole room are flat dark
  charcoal with nothing described in them. 🔴 Do not re-describe the room on this page.
TONE: 🔴 the steps between light and dark are gone - the dark is one even layer. Light is lifted in
  exactly two places: the parted beak gap with the pushed-aside down beside it, and a thin skim
  along the TOP SURFACES ONLY of the three objects, so the eye slides once from the face down to
  the floor and stops there. Nothing tilts, nothing reaches. Only breathing where the sentence
  stopped.
```

---

## 첫 렌더 검수 체크리스트 (6항목)

> 사용자가 GPT 로 뽑은 뒤 이걸로 판정한다. 🔴 **하나라도 걸리면 문구를 늘리지 말고 ref 를 바꿔라**(§2.3 — 문구로 세 번 실패하면 레버가 틀린 것이다).

| # | 볼 것 | 실패 시 처방 |
|---|---|---|
| 1 | 🔴 **p1 과 p8 을 나란히 놓았을 때 「빛이 줄었다」가 밝기만으로 읽히나.** 이게 이 책의 핵심 판정이다 | 어두운 판을 더 어둡게, 지운 자리를 더 적게 다시 굽는다. **양 끝 두 장이 확정되기 전엔 중간 여덟 컷을 굽지 마라** |
| 2 | 🔴 **빛이 「지운 자리」인가, 「얹은 물감」인가.** 지운 빛에는 반쯤 지워진 알갱이 후광과 종이결이 남는다. 흰 점·매끈한 그로우·볼류메트릭 광선이면 실패 | 문구 튜닝 금지. **종이결이 지운 자리 안에 보이는 승인 컷 1장을 ref 로 고정**하고 나머지를 그 뒤에 뽑는다 |
| 3 | 🔴 **p10 에서 셋이 세어지나, 그리고 p3~p9 에서는 안 세어지나.** 셋이 p5 쯤에서 이미 나란히 놓여 세어지면 착지가 반복이 된다 | p10 은 NestThree 시트의 「나란히 놓은 패널」을 ref 로 붙인다. 중간 쪽은 겹침·잘림·그림자로 다시 덮는다 |
| 4 | 🔴 **p10 의 부리가 벌어져 있나.** 다물려 있으면 「자는 그림」이라 이 권의 착지가 통째로 사라진다 | 장면을 고치지 말고 **BabyOwl 시트의 마지막 표정(눈 9/10 감김 + 부리 벌어짐)을 다시 굽는다**. 시트에서 안 되면 장면에서는 절대 안 된다 |
| 5 | **팔레트가 샜나.** 파란 달빛·초록 이끼·주황 온기·붉은 부리가 한 점이라도 있으면 실패(특히 달과 이끼) | PALETTE 의 "no red/blue/green anywhere" 뒤에 실제로 샌 사물을 이름으로 못 박고 재시도 |
| 6 | **무대가 움직였나.** 열 장을 늘어놓고 입구·달이 항상 오른쪽 위, 이끼 벽이 왼쪽, 바닥이 아래인지 본다. 하나라도 뒤집히면 「방을 나갔다」로 읽힌다 | p1 승인본을 **모든 컷의 ref 로 첨부**한다(문구로 무대를 재현시키려 하지 말 것) |

부수 1: **부엉이가 매끈한 CG 로 회귀했나**(§2.4 최대 실패 모드) — 눈에 흰 하이라이트 점이 있거나 깃털이 털 렌더로 나오면 장면을 고치지 말고 **시트를 다시 굽는다**.
부수 2: 🔴 **p9 의 이끼 공이 멈춰 있나** — 멈춰 있으면 「하나 더 놓았다」로 읽혀 잠든 증거가 사라진다. 기울기와 발·바닥 사이 틈으로 다시 굽는다.
