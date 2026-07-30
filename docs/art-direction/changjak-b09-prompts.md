# 창작동화 1000 — B-09 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`(§2.1 · §2.3 · §2.4 · §2.7 · §2.9 · §2.10 · §2.11 · §2.13 · §7.1~7.5), 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/b09.md`.** 아래 11컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다. 새로 발명한 것 없음.
> 🔴 **이미지 생성은 여기서 하지 않는다.** 사용자가 GPT 로 굽는다. 🔴 **작가 실명은 한 글자도 안 들어간다** — 근거 후보 id 는 §1 판정 표에만 남기고 프롬프트는 전부 문구다.

## 0. 실행 순서 (어기면 인물만 매끈한 CG 로 나온다 — §2.4)

1. **STYLE ANCHOR 로 시트 3장을 먼저 굽는다. 장면 금지.** 순서 = `SquirrelKit`(다람쥐) → `CuckooGuest`(손님) → 🔴 `ClockKit`(시계와 그 기계).
   🔴 **`ClockKit` 을 인물 시트와 같은 등급으로 취급한다.** 이 권은 **기계의 상태가 쪽마다 달라지는 책**이라(문 반쯤/활짝 · 추 아래/위 · 흔들이 바닥/고리/흔들림), 시계가 쪽마다 다른 물건으로 그려지면 열한 쪽이 통째로 무의미해진다. b01 의 `MoveBox` 와 같은 이유다.
2. 시트가 승인되면 `@image1`(SquirrelKit) · `@image2`(CuckooGuest) · `@image3`(ClockKit)을 붙여 컷을 뽑는다.
3. 🔴 **굽는 순서 = p1 → p9 → p6 → 나머지 일곱 → p11 은 맨 마지막에 p1 승인본을 ref 로.**
   - **p1** = 무대 전체 + 「멈춘 상태」의 기준. 여기서 정한 공방이 열한 쪽 내내 안 바뀐다.
   - **p9** = 놋빛 기계의 기준(톱니·고리·팽팽한 사슬). 브라스가 이 권에서 유일하게 딱딱한 것이라, 여기서 딱딱해지지 않으면 나머지 열 장에서도 안 딱딱해진다.
   - **p6** = 발자국 규약의 기준(여러 갈래가 한 점에 모인다). 이 권의 심음이 한 화면에 다 있는 쪽.
   - **p11** = p1 의 정반대 상태다. 🔴 **거울이 아니라 상태 반전**이므로 좌우 반전 금지, p1 승인본을 ref 로 붙여 같은 공방에서 추와 흔들이만 뒤집는다.
4. 승인 렌더 3장을 앵커 ref 슬롯에 넣는다 — 🔴 **인물 컷 1 · 배경이 러프로 남은 컷 1(p4 또는 p9) · 전체 장면 1(p1)**.
5. 앵커 이름은 **렌더를 보고 짓는다**(§7.5-3). 지금은 슬러그만: `changjak-werkstatt`.

---

# B-09 「시계 속에서 온 손님」

주제군 **B 상상·변신** / 엔진 **오해와 반전** / 무대 독일 검은 숲 시계공방 / 주인공 새끼 다람쥐 + 뻐꾸기 손님 / **11스프레드** · 후렴 없음(「뻐꾹」 p2·p5·p11 세 번, 뜻이 매번 다름)

## B-09 §1. 앵커 배정

**한 줄**: **꿀빛 나무판에 직접 그린 기름 글레이즈 회화** — 세계는 얇게 덮여 나뭇결이 비치고, 산 것만 불투명하게 얹히고, **놋빛 기계만 딱딱하다**. 발자국은 그린 게 아니라 **바닥 톱밥을 긁어내 나무판이 드러난 자리**다. 앵커 슬러그 `changjak-werkstatt` — **신규 민팅** (🔴 **C7 둘째**, 공정이 e09 와 정반대).

### 이 권이 그림에 요구하는 것 (판정의 전제)

1. 🔴 **오해가 손님의 몸에 있다.** 손님은 매 쪽 시계 밑 한 점을 향하고(목을 빼고 저쪽만 봄 · 등을 보이고 총총 걸어감 · 사슬을 잡고 오르려 함), **톱밥 바닥의 세 갈래 발자국이 언제나 그 한 점으로 이어진다.** 다람쥐는 달아나는 등만 보고 독자는 바닥의 방향을 본다. → **방향이 화면에서 가장 먼저 읽혀야 하고, 발자국은 같은 모양으로 반복돼 세어져야 한다**(§2.11).
2. 🔴 **딜레마가 손에만 있다.** 「고치면 손님이 떠난다」를 마음으로 그리는 쪽이 한 장도 없다 — 집으려다 멈춘 손(p4) → 비어 버린 주머니(p8) → 제 손으로 고리에 끼워 톡 미는 손(p9) → 받쳐 올리는 손(p10) → 입가에 모은 손(p11). **손이 두 번 프레임을 통째로 차지한다**(p4 하이앵글 · p9 익스트림 클로즈업).
3. 🔴 **기계가 실제대로여야 한다.** 사슬에 매달린 솔방울 추가 내려가며 톱니를 돌리고, 나뭇잎 흔들이가 고리에 걸려 좌우로 흔들려 톱니를 한 칸씩 넘긴다. 고장은 ①추가 다 내려옴 ②흔들이가 고리에서 빠짐 둘이고, 고침도 그 둘이다. **작은 고리 하나·맞물린 톱니·팽팽해진 사슬이 네 살에게도 보여야 한다.**
4. 🔴 **소리가 화면에 없다.** p1 은 **멈춘 정적**(흔들리는 것이 하나도 없고 흔들이는 바닥에 누워 있다), p11 은 **다시 째깍**(흔들이가 크게 기울고 추는 위에 있다). 그 차이를 그림이 져야 한다.
5. **빛이 열한 쪽에 걸쳐 세 단계로 넘어간다.** 늦은 오후 노랑 → 저녁 남색 → 밤 등불 주황. 색을 새로 늘리지 않고 이걸 해내야 한다.
6. **손님은 「뻐꾹」밖에 못 하고 말을 안 한다.** 표정으로 설명할 수 없다 — 그래서 몸의 방향이 유일한 정보원이다.

### 후보 3

| | 후보 ① 🔴 **C7 · 꿀빛 나무판에 기름 글레이즈 + 불투명 브라스**(`lundberg-ingen` + `buro-street`) | 후보 ② C4 평면 형태 · 등축 도해(`marais-tomber` + `virardi-instant`) | 후보 ③ C3 프린트-크래프트 2잉크(`valousek-panacek` 계열) |
|---|---|---|---|
| 매체 | 나무판 지지체 · 얇은 투명 글레이즈(세계) · 불투명 두꺼운 물감(산 것) · 긁어내기(자국) · 세필 불투명 놋빛(기계) | 불투명 평칠 색면, 음영 0, 깊이는 선으로만 | 리노·실크스크린 2~3판 |
| 이 권에 맞는 이유 | 🔴 **손님이 나무판으로 만들어진다** — 그를 얇은 글레이즈 한 겹으로만 칠하면 나뭇결이 몸을 관통해 흐르고, 그게 「나뭇결이 남은 날개라 못 난다」의 근거가 된다. 규칙 하나(멈춘 시계에서 손님이 나온다)를 **문구가 아니라 물성이** 말한다. 🔴 그리고 **발자국은 톱밥 스컴블을 긁어 나무판이 드러난 자리** = 실제 톱밥 발자국의 물리 그대로라, 이 권의 심음이 매체 안에 들어온다. 빛 3단계는 **글레이즈 한 겹을 갈아 얹는 것**이라 색을 늘리지 않는다 | 평면·등축이라 톱니·사슬·추의 상태를 도해처럼 비교할 수 있고 발자국도 같은 도형으로 반복된다 | 잉크 2판이라 팔레트 유출이 공정 차원에서 불가능하고, 반복되는 발자국이 판에서 저절로 같아진다 |
| 리스크 | C7 은 이 라인에서 가장 두꺼운 군이라 **평범해지기 쉽다**(§7.5 교차관찰 1) → §2.13 대로 **지지면(나무판)·공정(글레이즈→불투명→긁기)·도구(빳빳한 붓·세필·긁는 칼)까지 못 박아 해소했다.** 두 번째 리스크 = 나뭇결이 **필터**로 깔린다 → NOT 절 + 「결은 물감이 얇거나 긁힌 자리에만, 언제나 판자 방향으로」 | 🔴 **b01 이 같은 주제군 B 에서 이미 C4 다**(마분지 위 불투명 평칠). 라인 내 중복이 개별 최적보다 우선(§7.6 전례). 그리고 §2.8 — **표정이 없다**. 이 권은 다람쥐가 부끄러움·숨바꼭질·「거기가 제일 좋아?」로 **틀린 해석을 즐겁게 하는 얼굴**이 필수다 | 🔴 **라인이 C3 을 이미 셋 썼다**(a11·c60·e03) — 금지 구간. 게다가 **글레이즈로 넘어가는 빛 3단계를 판 인쇄로는 못 한다**(잉크 판을 세 벌 더 쓰면 팔레트가 무너진다) |
| 판정 | ✅ **추천** | 탈락 — 라인 내 중복 + 표정 없음 | 탈락 — 라인 내 중복 + 빛 3단계 불가 |

**후보에도 못 올린 것들**: `shih-taichi`·`arsenault-marguerite` 계열 **C6** 은 라인이 넷을 써서 금지 구간이고(§7.5), 무엇보다 **마른 매체라 등불에 젖은 놋빛을 못 그린다**. `rutten-ombre` 계열 **C8** 은 §7.3.1-1 의 8권 상한이 「물·잠·번짐」 권으로 묶여 있고 번짐이 **톱니와 고리를 뭉갠다**. `child-tomato` 계열 **C9** 는 이 세션의 f02 와 f05 가 이미 물려 있고, 오려 붙이기는 **긁어낸 자국**을 못 만든다. `pinfold-blackdog`(C7)은 전면 균일 마감이라 톱밥 바닥의 발자국이 배경 묘사에 묻힌다 — g10·g88 에서 두 번 같은 이유로 탈락한 후보다.

### 🔴 추천 = 후보 ① — 나무판 글레이즈 회화 (C7 둘째)

근거 세 줄.

- **손님이 세계의 재료로 만들어져 있다.** 이 권의 판타지 규칙은 하나이고 「어디서 왔나·왜 살아났나」를 설명하지 않는다. 🔴 그러면 **그가 무엇으로 만들어졌는가만 화면에 남는다** — 얇은 글레이즈 한 겹으로 칠해 나뭇결이 몸을 관통하면, 그는 공방의 나무에서 나온 물건이고 날개는 결이라 안 휘어진다. 반대로 다람쥐는 불투명 물감이라 결이 한 오라기도 없다. 🔴 **산 것 = 불투명 / 만들어진 것 = 결이 비침.** 규칙 하나가 팔레트도 안 늘리고 설명도 안 하고 화면에 선다.
- **발자국이 그린 게 아니라 긁어낸 자리다.** 꿀빛 톱밥은 판 위에 끌어 얹은 **불투명 스컴블**이고, 발자국·끌린 자국은 그 스컴블을 **긁어 나무판이 드러난 자리**다. 실제 톱밥 바닥에서 발자국이 생기는 방식 그대로이고, 덤으로 세 갈래 발가락 모양이 **같은 도구로 같은 모양으로** 나므로 갈래를 셀 수 있다(§2.11). 🔴 그리고 손님의 몸과 그의 발자국이 **같은 색**이다 — 그가 남긴 자국이 그의 재료다.
- **빛이 층이라 세 단계가 공짜다.** 늦은 오후 = 따뜻한 노랑 글레이즈 한 겹 / 저녁 = 찬 남회색 글레이즈 한 겹 / 밤 = 등불의 주황 글레이즈 + 창은 칠 안 한 검정. 🔴 **글레이즈는 새 색이 아니라 화면 전체에 얹는 필름**이라, 색 수를 늘리지 않고 온도만 바꾼다. §2.1-1(2~4색)을 지키면서 하루가 지나간다.

**악센트 = 색이 아니라 「빨간 실 한 줄의 모양」이다**(§2.9 의 여섯째 변형). 갈색 나무와 놋빛뿐인 화면에서 앞치마 주머니를 두른 **빨간 실땀**이 유일한 빨강인데, 이 권에서 변하는 것은 그 빨강의 **양이 아니라 곡선**이다 — p1 납작한 직선 → p4 벌어져 크게 열린 원 → p5~p7 흔들이 모양으로 팽팽하게 당겨진 곡선 → p8 다시 납작하게 비어 있음 → p11 등불에 한 점. 🔴 **감춘 자리가 곧 유일한 빨강**이라, 아이는 글을 못 읽어도 주머니만 따라가면 하루를 다 읽는다.

그리고 값의 사다리 한 수: 🔴 **톱밥(가장 밝음) · 손님(가운데) · 호두나무(가장 어두움) 세 단**을 열한 쪽 내내 고정한다. 손님은 어느 배경에 놓여도 위아래 둘과 갈라지므로, 화면의 1/10 크기여도 찾을 수 있고 **그의 몸이 향한 방향이 늘 읽힌다.** 브라스만 이 사다리 밖에 있다(가장 밝고 유일하게 딱딱하다) — 기계가 이 책에서 유일하게 또렷한 것이라, p9 에서 고침이 곧 발견처럼 보인다.

### 🔴 손님의 얼굴은 열한 쪽 내내 안 바뀐다 (이 앵커의 캐릭터 결정 한 수)

손님은 **깎아 만든 나무 새**다. 그래서 얼굴 모양을 바꿀 수가 없다 — 눈은 깎인 아몬드 홈에 눌린 어두운 눈동자 하나이고, 부리는 열리거나 다물리기만 한다. 🔴 **표정이 원천적으로 없다는 것이 이 권의 오해 엔진 그 자체다**: 읽을 얼굴이 없으니 다람쥐는 **몸의 방향**을 읽어야 하는데 그걸 계속 틀리게 읽는다. p8 의 반전도 표정 변화가 아니라 **머리를 처음으로 정면으로 돌리는 것**이다.
- 부수: 이 규칙이 **점눈이 충돌을 막는다**. 점눈이의 점눈은 표정을 만드는 희극 장치인데, 여기 손님의 눈은 **깎인 홈이라 절대 안 움직이는** 것이고 다람쥐 쪽은 **그린 눈 + 별개의 눈썹 선**이다.

### 라인 충돌 확인 (필수)

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 2D 회화. 실물 입체 재료 없음. 🔴 단 지지체가 나무판이라 **「나무 인형·조각 오브제 사진」으로 새면 그 순간 호리 라인**이라 NOT 절에 `not a photograph of a carved object / no stitching / no felted wool` 을 박았다 |
| 전래동화 **점눈이** | ✕ (4축 전부 분리) | ① **종이색** — 밝은 크림 종이(=햇빛)가 아니라 **꿀빛 나무판**(=공방의 재료), 광원은 종이가 아니라 창과 등불이다 ② **얼굴** — 점눈 아님. 다람쥐 = 그린 눈 + **별개의 눈썹 선** / 손님 = **깎인 홈 눈, 열한 쪽 내내 불변** ③ **악센트** — 화면당 빨강 1점 규칙 아님. 빨강은 **같은 물건 하나(주머니 실땀)**이고 변하는 것은 **그 선의 모양**이다 ④ **매체** — 느슨한 색연필 낙서가 아니라 **투명 글레이즈 + 불투명 스컴블 + 긁어내기** |
| **e09**(같은 라인, C7 첫째) | ✕ | 🔴 **공정이 정반대다**(§2.13 부수) — e09 = 어두운 종이에 목탄을 덮고 **지우개로 빛을 들어낸다(감법)** / 여기 = 밝은 나무판에 **물감을 얹는다(가법)**. 악센트도 **빛 자체(달빛 크림) ↔ 사물색(빨간 실)**, 시간도 잠드는 밤 ↔ 되살아나는 저녁 |
| **c01**(같은 라인, 갈색 바탕) | ✕ | ⚠️ 이 라인에서 가장 가까운 상대다(둘 다 따뜻한 갈색 지지면) → 세 축으로 갈랐다. **물감의 상태** — c01 = 마른붓 과슈 + 눌러 그린 흑연(전부 마름) / 여기 = **기름 글레이즈(젖고 투명함)** · **악센트** — c01 = 불투명 흰색(가장 밝음) / 여기 = 빨간 실 한 줄 · **지지면의 온도와 채도** — c01 크라프트 #AD8B60(탁한 탠) / 여기 #A9743C(**채도 있는 꿀빛 목재**), 그리고 c01 은 눈 덮인 야외, 여기는 등불 켠 실내 |
| **a04**(같은 라인, 바닥 자국이 플롯) | ✕ | A-04 = 눌러 찍은 **흑연의 압력** · 차가운 회백지 · 앰버 1점 / 여기 = **긁어낸 자리**(물감을 덜어낸 구멍) · 따뜻한 나무판 · 빨간 실. 🔴 자국의 성질을 일부러 갈랐다 — 하나는 더한 자국, 하나는 뺀 자국 |
| **b01**(같은 주제군 B) | ✕ | b01 = 회색 마분지 위 불투명 평칠 · 음영 0 · **개수(상자)를 센다** · 표정 없음 / 여기 = 나무판 위 글레이즈 · 등불 명암 · **방향을 읽는다** · 얼굴이 연기한다. 썸네일에서 하나는 회색 도해, 하나는 갈색 등불 방이다 |
| **f02**(같은 세션·같은 엔진, 둘 다 빨강 1점) | ✕ | 🔴 **세계의 온도가 정반대다** — 여기 = 따뜻한 갈색 실내·등불·기름 물감·빨강이 **실 한 줄(선)** / f02 = 차가운 흰 회벽·아침·평칠 코발트·빨강이 **뜨개 목도리(덩어리)**. 그리고 여기는 명암이 있고 f02 는 음영이 0 이다 |

### 밀도 배급 (§2.10 · §2.12)

무텍스트 쪽이 없어 §2.12 우선권은 미발동 → 슬롯 두 장을 **심음이 한 화면에 다 있는 쪽**과 **하루가 바닥에 남는 쪽**에 준다.

- **p6** — 톱밥 바닥의 발자국 여러 갈래 + 흘린 호두 껍질·대팻밥 조각. 🔴 밀도는 **바닥의 자국과 흘린 것들에만**.
- **p11** — 공방 전체 와이드. 🔴 밀도는 **작업대 위 도구와 바닥에 남은 자국들에만**.
- 🔴 **금지**: 들보·판자벽·지붕·시계집의 조각 무늬를 한 결까지 다 그리는 것. **바닥을 다 그리면 발자국이 사라지고, 발자국이 사라지면 이 책의 복선이 통째로 없어진다.** 이 권의 고유 실패 모드다.

---

## B-09 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-werkstatt  (baby squirrel / wooden cuckoo guest / Black Forest clock workshop)

Style: a hand-painted picture-book page for 4-6 year olds. Warm, wooden, lamplit and quiet.
  A workshop, not a fairyland. Legible before it is pretty. Never cute-glossy.

MEDIUM: oil and opaque gouache painted DIRECTLY ONTO A PLANK OF HONEY-COLOURED WORKSHOP WOOD,
  not onto paper. The bare panel is one of the colours of this book.
  There are only four operations and they always happen in this order:
   1. THIN TRANSPARENT GLAZE, brushed over the panel for air, upper walls, distance and light.
      The wood's straight grain reads through the glaze everywhere. Brush passes run WITH the grain.
   2. OPAQUE PAINT, loaded on a stiff brush and DRAGGED, for everything solid: dark walnut for the
      beams, the clock case and the bench; a pale honey scumble for the sawdust floor. The dragged
      paint skips and leaves the panel showing at the edges - edges are made by the paint running
      out, never by a clean vector line.
   3. 🔴 SCRAPED BACK: every footprint, every dragged trail, every cleared patch of floor is made by
      SCRAPING the pale sawdust scumble away so that the bare panel shows through in that shape.
      A footprint is the floor showing through - exactly what a footprint in sawdust really is.
      Scraped edges are slightly ragged and carry a tiny ridge of pushed paint on one side.
   4. BRASS, laid LAST, opaque, with a small pointed brush and a hard clean edge.
      🔴 THE BRASS IS THE ONLY HARD-EDGED THING IN THE WHOLE BOOK.
  No blending into softness, no airbrush, no digital gradient, no glow.
  🔴 NO WOOD-TEXTURE FILTER OVER THE PICTURE. The grain exists only where the paint is thin or has
  been scraped, and it always runs along the planks; plank seams are visible and stay in the same
  places from page to page.

🔴 THE GUEST IS MADE OF THE PANEL - read this twice.
  The cuckoo guest is painted with ONE thin glaze only, so the wood grain runs through his whole
  body, and the grain runs LENGTHWISE ALONG EACH WING. He is a carved thing that moved; that is why
  the wings cannot beat, and it is the only fantasy rule this book has.
  The squirrel is the opposite: loaded OPAQUE paint, not one thread of grain anywhere on her.
  🔴 ALIVE = OPAQUE. MADE = GRAIN SHOWING THROUGH. Never mix the two up.

PALETTE: a brown monochrome plus exactly one red. That is the whole book.
  panel  #A9743C - bare honey workshop wood. Air, upper walls, distance, THE GUEST'S BODY, and
    every scraped footprint. Never a fifth colour, always the wood itself.
  walnut #4A2E1C - opaque dark. Beams, clock case, bench, doorway of the clock, deep corners.
  sawdust #E4C489 - opaque pale scumble. The floor, curled plane shavings, dust in the air.
  brass  #C9A227 with a highlight of #EFD98A - gears, chain, weight fittings, the leaf pendulum,
    the small hook, bench tools. Opaque, hard-edged, laid last.
  red    #C2352A - the stitched thread edging the apron pocket. NOTHING ELSE IN THE WORLD IS RED.
  🔴 THREE-STEP VALUE LADDER, fixed for all eleven pages: sawdust is the lightest, the guest is the
  middle, walnut is the darkest. The guest must be separable from both, on every page, at any size -
  that is how the reader always sees which way his body is pointing.

GLAZE SCHEDULE - the light is a film laid over the whole page, never a new colour.
  GLAZE A, late afternoon, pages 1-4: a warm yellow glaze; low sun comes through the one window at
    the left and lies as a long band across the sawdust floor; dust hangs in it.
  GLAZE B, evening, pages 5-6: a cold blue-grey glaze over everything; the window has gone dim; on
    page 6 the bench lamp is lit and makes ONE small warm pool.
  GLAZE C, night, pages 7-11: a warm orange glaze from the single bench lamp, falling from low down;
    the window is UNPAINTED BARE PANEL DARKENED TO NEARLY BLACK with the lamp's reflection on it.
  🔴 The glaze never changes the palette above and never becomes a coloured light beam, a lens
  flare, a bloom or a halo.

🔴 THE AIM - the plant of this book. Read this twice.
  On every page the guest's whole body, his eye and his footprints point at ONE SPOT: the base of
  the clock on the wall. He is never simply standing about. The squirrel never sees this; the reader
  always does. Each cut says exactly where the aim goes.
  THE FOOTPRINT: a small three-toed mark, ALWAYS THE SAME SHAPE AND ALWAYS THE SAME SIZE, scraped
  through the sawdust so the panel shows. The three toes always point the way he was walking, so a
  line of them is a direction that can be read from across the room - and the lines can be counted.
  🔴 THE MARKS ARE NEVER SWEPT AWAY. Every line of prints that has been made is still on the floor
  on every later page unless it is outside the frame. Older lines are shallower and half-refilled
  with sawdust; the newest line is deep and its scraped ridges are sharp.

COMPOSITION: low-information field first, subject second. The workshop is a small dark box and most
  of every page is either the pale floor or the glazed air above it.
  🔴 WHEN TWO THINGS ARE COMPARED FOR SIZE, PUT THEM AT THE SAME DEPTH, on the same patch of floor,
  and do not foreshorten one of them.
  Vary the camera every page - this book has one room and eleven pages, so distance and angle must
  do the work. Never two consecutive pages from the same height.
  🔴 Keep the bottom 18% of the image quiet and free of key subject matter (a caption band is laid
  over it later). Where the floor fills the frame, keep the bottom strip plain sawdust.

FINISH HIERARCHY - read this twice. This is about how FINISHED each area is, NOT about opacity.
  1. THE SQUIRREL, THE GUEST, THE BRASS PARTS AND THE MARKS IN THE SAWDUST = finished.
  2. WHAT IS BEING HANDLED on that page (the walnut, the shaving slide, the lamp, the pocket) =
     half-finished: one contour and one dragged pass.
  3. EVERYTHING ELSE = A LOOSE UNFINISHED BRUSH SKETCH. A few open contour strokes and direction
     drags over the bare panel, no fill, corners left unclosed, deliberately not carried to
     completion - like the rough underpainting on a panel before the picture is built up.
  🔴 The background is NOT faded, NOT hazy, NOT blurred and NOT desaturated. It is simply NOT
  CARRIED TO COMPLETION. A dark rough brush stroke is correct; a pale finished line is wrong.
  🔴 NEVER PAINT EVERY PLANK OF THE WALL, EVERY BEAM, EVERY ROOF TILE, EVERY CARVED LEAF ON THE
  CLOCK CASE, OR EVERY GRAIN OF THE FLOOR. If the floor is carried to completion the scraped prints
  vanish, and the prints are this book's only clue. That is the failure mode of this book.

CHARACTER DESIGN: the two characters are built by opposite means and must never converge.
  THE SQUIRREL is alive: opaque loaded paint, no grain. Eyes are DRAWN - a dark rounded shape with a
    SEPARATE drawn eyebrow stroke above, so she can be startled, pleased, worried, or blank. Big
    front teeth show when her mouth opens. Her tail is a wide opaque brush mass that states her mood
    at thumbnail size (straight up = delighted / bristled = startled / hanging loose = at ease).
  🔴 THE GUEST'S FACE NEVER CHANGES ON ANY PAGE. He is carved: one thin glaze, grain running through
    him, an almond eye SOCKET cut into the wood with one dark pupil pressed in it, a bevel ridge for
    a lid, and a beak that only opens or closes. No eyebrows, no cheeks, no blush, no expression -
    HE CANNOT MAKE ONE. What changes from page to page is only which way his head, his eye, his feet
    and his short wings are turned. This is the engine of the book: there is no face to read, so the
    squirrel reads his body and reads it wrong.
  FACE SEPARATION (required): each face must read apart from its body in VALUE, not by adding a
    colour - a lighter cheek and chest on the squirrel, the pale carved throat on the guest. Test:
    shrink the page to thumbnail size and the pose must still be legible.

ANTHROPOMORPHISM GRADE (fixed for all eleven pages): the squirrel is BIPEDAL, forepaws work as
  hands, and she wears ONE thing - a work apron with a pocket. Nothing else worn, no shoes.
  The guest is a BIRD and wears nothing; he walks, grips a chain with both feet, and carries things
  in his beak. He never gestures with a wing as if it were a hand, and he never speaks.

SETTING - THE WORKSHOP MAP. 🔴 The same room on all eleven pages; nothing moves except the two
  characters, the pendulum, the weights, the door of the clock and the marks in the sawdust:
    left wall  - one small window with a wooden frame; the low sun and later the night come in here;
    under it   - one workbench: an opened pocket watch, a few tiny brass wheels, tweezers, an oil
                 bottle, a lamp; a hook rail above with tongs and a bradawl;
    right wall - high up, the cuckoo clock; from it two chains hang down with a pinecone-shaped
                 brass weight on each; below it, floor;
    ceiling    - low, with two thick beams;
    floor      - loose sawdust and curled plane shavings everywhere.
  Beyond the window: dark spruce forest, then the sky. A Black Forest workshop - carved wood,
  hand tools, no machinery, no electricity. European, no Asian motifs.

CLOCK MECHANICS - draw the machine truthfully; a four-year-old must be able to see how it works.
  The cuckoo clock is a carved wooden house. Its face is decorated ONLY with carved leaves and
  berries and has TWO HANDS AND NO NUMBERS AND NO MARKS OF ANY KIND. Above the face is a small
  door; a thin wire runs from that door back into the works, so the door is opened by the machine
  and not by a hand.
  Two chains hang out of the bottom of the case; each carries a pinecone-shaped brass weight. As a
  weight sinks it turns the brass gear train inside. A brass LEAF-SHAPED PENDULUM hangs from a SMALL
  HOOK inside the open bottom of the case and swings side to side, letting the gears step over one
  tooth at a time - that stepping is the tick.
  So there are exactly two faults and exactly two repairs:
    fault  - the weights have sunk all the way down, AND the leaf pendulum has come off its hook and
             is lying in the sawdust; the hook is empty; the door is stuck HALF OPEN; nothing moves.
    repair - pull the chain so the weight rises again, then hook the pendulum's neck onto the small
             hook and give the leaf one push.
  🔴 EVERY CUT STATES THE STATE OF THE MACHINE. Never draw a state that page has not reached.
  There is no spring and no key anywhere near this clock; the only spring in the book is inside the
  opened pocket watch on the bench.

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT digital airbrush / NOT smooth gradients / NOT glossy 3D CG render / NOT cel-shaded anime /
  NOT a wood-texture filter or overlay laid across the picture / NOT photographic /
  NOT a photograph of a carved wooden object / NOT a fully rendered background / NOT every plank,
  beam, roof tile or carved leaf drawn to completion / NOT a uniform finish across the page /
  NOT a hazy, blurry or faded background (that is blur, not un-painted) / NOT lens flare, bloom,
  god-rays or glowing light / NOT motion blur or speed lines / NOT a fifth colour /
  NOT any red on anything except the stitched thread of the apron pocket /
  NOT numerals, clock numbers, hour marks, lettering, signage or maker's plate anywhere in the image
  / NOT visible grain on the squirrel / NOT wool felt, NOT stitching, NOT sculpted clay
  (another line owns those).
```

### 🔴 이 앵커의 네 불변 규칙 (매 컷 네 줄로 반복 확인)

**규칙 A — `AIM:` 손님의 몸·눈·발자국은 언제나 시계 밑 한 점을 향한다.** 컷마다 어디를 향하는지, 발자국 줄이 몇 갈래인지 적혀 있다. 🔴 **독자가 다람쥐보다 먼저 알아야 하므로, 방향이 안 읽히면 그 컷은 실패다.**

| 쪽 | 발자국 | 상태 |
|---|---|---|
| p1 | 없음 | 🔴 이 권에서 바닥이 깨끗한 유일한 쪽 |
| p2 | 없음 | 아직 사슬에 매달려 있다 |
| p3 | ① 첫 줄 몇 개 | 다람쥐 등 뒤라 다람쥐만 못 본다 |
| p4 | ① + 흔들이가 누워 있던 자리 | 위에서 곧게 내려다본 각도라 방향이 가장 또렷하다 |
| p5 | ① + ② 새 줄 | 두 줄이 나란히 같은 데로 간다 |
| p6 | ①②③④ 여러 갈래 | 🔴 갈래가 다 달라도 끝이 전부 한 점에 모인다 — 이 권의 심음 회수 |
| p7 | 위 전부 + 미끄러져 지워진 자리 | |
| p8 | 위 전부 + 🔴 주머니→시계 밑 **끌린 자국 한 줄**과 그 위 나란한 발자국 | 누가 옮겼는지가 바닥에 적혀 있다 |
| p9 | (익스트림 클로즈업 — 프레임 밖) | |
| p10 | (아래 멀리) | |
| p11 | 🔴 전부 그대로 남아 시계 밑으로 모여 있다 | 하루가 바닥에 남았다 |

**규칙 B — `HANDS:` 이 권의 갈등은 손이 한다.** 컷마다 누구의 손이 무엇을 하는지 한 줄.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 |
|---|---|---|---|---|---|---|---|---|---|---|
| 빈 손(가슴 앞에 모음) | 굳은 손(입에 감) | **주는 손**(호두) | 🔴 **멈춘 손 + 감추는 손** | 놀 것 만드는 손 | 짐작하는 손(허리) | **붙잡는 손** | 빈 손(허공에 멈춤) | 🔴 **고쳐 주는 손**(끼우고 톡 민다) | **올려 보내는 손** | 🔴 **대꾸하는 손**(입가에 모음) |

🔴 p11 에서 손을 뻗지 않는다. 붙잡던 손이 입가에 있는 것이 이 책의 착지다.

**규칙 C — `CLOCK:` 기계의 상태.** 문 / 사슬·추 / 흔들이 세 값을 컷마다 적는다. 🔴 **p1 과 p11 은 세 값이 전부 반대다.**

**규칙 D — `GLAZE:` 빛의 단계.** A(p1~4 늦은 오후 노랑) · B(p5~6 저녁 남회색, p6 등불 켜짐) · C(p7~11 밤 등불 주황 + 창은 거의 검정). 되돌아가지 않는다.

---

## B-09 §3. 캐릭터 시트 (🔴 이것부터 굽는다 — 장면 금지)

```
CHARACTER SHEET - SquirrelKit   (bake FIRST, attach as @image1)

🔴 THIS SHEET IS PAINTED IN THE SAME MEDIUM AS THE BOOK: oil and opaque gouache on a plank of
  honey-coloured workshop wood #A9743C. Loaded opaque paint, dragged; edges made by the paint
  running out. Do NOT render this animal smoothly just because there is no background behind it.
  🔴 SHE IS ALIVE, SO SHE IS OPAQUE - there is no wood grain anywhere on her body.

FACE: a young red squirrel's blunt muzzle, big front teeth that show when the mouth opens, a small
  dark nose. Eyes are DRAWN - a dark rounded shape with a SEPARATE drawn eyebrow stroke above it,
  set wide, so the face can be: startled (eyes wide, brows high, teeth showing), pleased with itself
  (eyes crescent, one brow tilted), worried (brows pulled in and up), and blank/frozen (eyes wide,
  mouth a straight closed line pulled down). Ear tufts stand up. Cheeks and chest are a lighter
  opaque tone - that value step is the only thing separating her face from her body, and it must
  survive at thumbnail size. No dot eyes, no blush, no highlight catchlight, no glossy shine.
CLOTHES: ONE work apron only, in dull unbleached linen, cut short, tied once behind the back.
  🔴 THE POCKET IS THE MOST IMPORTANT OBJECT IN THIS BOOK. It is a single square patch pocket on the
  front, and its whole edge is sewn with a line of RED STITCHED THREAD #C2352A - short slanting
  stitches, hand-sewn, slightly uneven. Nothing else on her, or anywhere in the book, is red.
  Draw the pocket in FOUR STATES on this sheet, all four, side by side:
    (a) FLAT AND EMPTY - the red stitch line is a straight slack rectangle;
    (b) HELD OPEN by one paw - the red stitch line is a wide open oval;
    (c) BULGING with a leaf-shaped thing inside - the red stitch line is pulled taut into the shape
        of the leaf pendulum, and one stitch is stretched longer than the others;
    (d) EMPTY AGAIN, the apron lying off the body on the floor - flat, slack, and you can see
        straight into it.
  No shoes, no trousers, no hat, no belt.
🔴 FOREPAWS - THE ACTING INSTRUMENT: her forepaws work as hands and the book's whole conflict is in
  them, so draw a HAND STUDY STRIP on this sheet - six small paintings of her paws alone:
    1. both paws cupped together in front of the chest, empty;
    2. both paws pressed flat against the mouth;
    3. both paws holding out one walnut;
    4. 🔴 one paw HALTED in mid-air having just picked up a thin leaf-shaped brass thing by its neck
       - the fingers half slack, as if the grip had stopped deciding - while THE OTHER PAW HOLDS THE
       POCKET OPEN. The two paws are doing different jobs in the same picture;
    5. 🔴 one paw fitting that same leaf's neck onto a tiny brass hook, knuckles pale with care,
       while one fingertip of the other paw gives the leaf a small push;
    6. both paws cupped round the mouth like a little trumpet, head tipped back.
BUILD & SILHOUETTE: a young squirrel, upright on two legs, about three and a half heads tall.
  Round belly, short limbs, a BIG BUSHY TAIL as wide as her body that trails behind and curls at the
  tip. Distinguishing point: the tail mass plus the square apron pocket with its red edge - both
  readable in silhouette.
REFERENCE SHEET: full-body front idle / three-quarter turn walking / back view showing the tail and
  the apron ties / one crouched low on the floor / three expression close-ups (startled, pleased
  with herself, frozen with the mouth pulled down) / the four pocket states / the six-paw hand strip.
  Plain bare-panel background, no scenery, no lettering anywhere.
SCENE token: SquirrelKit.
```

```
CHARACTER SHEET - CuckooGuest   (bake SECOND, attach as @image2)

🔴 SAME MEDIUM, OPPOSITE HANDLING. He is painted with ONE THIN TRANSPARENT GLAZE over the honey
  panel, so the wood's straight grain runs through his entire body. 🔴 ON EACH WING THE GRAIN RUNS
  LENGTHWISE FROM SHOULDER TO TIP. He is a carved thing that moved. His value sits between the pale
  sawdust and the dark walnut, always.

FACE - 🔴 THIS FACE IS IDENTICAL ON ALL ELEVEN PAGES AND CANNOT CHANGE:
  an almond EYE SOCKET cut into the wood with one dark pupil pressed into it, a bevelled ridge above
  it for a lid, and a short beak that has exactly two positions - CLOSED, or OPEN (for the one sound
  he makes). No eyebrows, no cheeks, no blush, no smile, no frown, no tears, no sparkle.
  🔴 HE HAS NO EXPRESSION AT ALL AND HE MUST NEVER BE GIVEN ONE. Everything he communicates is done
  by turning his head, his eye, his feet and his wings. That is why he is misunderstood.
BODY: a small cuckoo the size of the squirrel's head and shoulders. Carved, so the surfaces are
  faceted with shallow tool marks and the corners are slightly rounded off by handling. A pale
  carved throat gives the only value separation at the jaw. Short tail.
🔴 WINGS: short, stiff, carved in one piece with the body, grain running lengthwise. THEY DO NOT
  BEND, DO NOT SPREAD FEATHERS AND CANNOT BEAT AIR. He may hold them out sideways for balance, prop
  one against a threshold, or press them flat to his sides - nothing else. Never draw him flying,
  hovering, gliding, or with spread wing feathers.
🔴 FEET - THE PLANT: three forward toes on each foot, blunt and carved. Draw the FOOTPRINT beside him
  on this sheet, actual size: a small three-toed mark SCRAPED through pale sawdust so the honey panel
  shows through, with a tiny ridge of pushed sawdust on one side and the three toes clearly pointing
  one way. Draw a LINE OF FIVE of these prints, all the same size and shape, walking off to one side
  - the reader must be able to count them and read the direction. Also draw one DRAGGED TRAIL: a
  single scraped groove as if something small and flat had been hauled across the floor, with those
  same prints beside it.
  Also draw his GRIP: both feet wrapped round a hanging brass chain, and both feet standing flat on
  top of a flat leaf-shaped brass object.
BUILD & SILHOUETTE: a plump little carved bird, upright, no neck when at rest but able to STRETCH
  ITS NECK LONG and low - draw both, because the stretched-neck aiming pose is used on several pages.
  Distinguishing point: stiff grain-showing wings and the long stretched neck - unmistakable beside
  any live bird.
REFERENCE SHEET: side view standing / 🔴 the long-stretched-neck aim pose seen from three-quarter
  behind, so that the whole body, the eye and both feet obviously point the same way / walking away
  from camera showing only the back and the print line / gripping the chain / standing on the leaf
  pendulum with the head turned straight to camera (used once in the book, and it is the reversal) /
  head close-up with beak closed and with beak open - and these two close-ups must otherwise be
  IDENTICAL, to prove the face does not act.
  Plain bare-panel background, no scenery, no lettering anywhere.
SCENE token: CuckooGuest.
```

```
OBJECT SHEET - ClockKit   (bake THIRD, attach as @image3 — 🔴 treat this as a character sheet)

🔴 THIS SHEET DECIDES ELEVEN PAGES. The machine changes state from page to page, so if the clock is
  drawn as a different object each time, the book stops working. Same medium as the book: walnut
  parts in opaque dark paint, brass parts opaque and hard-edged with a small pointed brush, laid last.

THE CASE: a carved Black Forest wall clock, a small wooden house of dark walnut #4A2E1C, deeper than
  it is wide, with a shallow gabled top. Its front is carved with LEAVES AND BERRIES only.
  🔴 THE FACE HAS TWO HANDS AND NO NUMBERS, NO HOUR MARKS, NO DOTS AND NO LETTERING OF ANY KIND -
  the rest of the face is carved leaf and berry pattern. Above the face is a SMALL DOOR, about the
  height of the guest. Behind the door, darkness.
THE DOOR IN THREE STATES, drawn side by side: (1) STUCK HALF OPEN, hanging at an angle, not moving;
  (2) BEING PULLED SHUT, a thin brass WIRE running from the back of the door into the works, taut;
  (3) WIDE OPEN with the wire drawn in. 🔴 The wire must be visible in states 2 and 3 so the reader
  sees that the machine opens the door, not a hand.
THE DRIVE: two chains hang out of the bottom of the case, each with a PINECONE-SHAPED BRASS WEIGHT.
  Draw both states, side by side and at the same scale so the difference is unmistakable:
    (a) SUNK - the chains slack and looping, the weights hanging low, one touching the floor;
    (b) WOUND UP - the chains straight and taut, the weights high up close under the case.
THE PENDULUM: a flat BRASS LEAF with visible veins on a long thin neck. Draw it at three moments:
    (a) LYING IN THE SAWDUST on its side, with the shallow imprint it has left beside it;
    (b) its NECK HOOKED onto the SMALL HOOK - draw this one BIG, a close-up of the hook and the
        neck, because one whole page is this and nothing else. The hook is a tiny open brass loop
        inside the bottom of the case;
    (c) SWINGING, tilted well over to one side. 🔴 Movement is shown by ONE doubled edge on the far
        side of the leaf - a second contour where it has just been - and by nothing else.
        No motion blur, no arc lines, no speed streaks, no sparkles.
THE WORKS: a group of meshed BRASS GEARS behind the pendulum, teeth visibly interlocking, with one
  tooth caught in the act of stepping over. Draw this group large enough to be copied exactly - one
  page is an extreme close-up of it.
BENCH PROPS on the same sheet: an opened pocket watch with a coiled spring inside (🔴 the only spring
  in the book, and it is never near the wall clock), three loose brass gear wheels of different
  sizes, tweezers, a bradawl, an oil bottle, and a small oil lamp with a low flame.
FLOOR PROPS: loose sawdust, curled plane shavings, cracked walnut shells, one whole walnut.
🔴 SCALE ANCHOR: draw the guest standing beside the case, and the squirrel standing beside the case,
  so the height of the small door above the floor is fixed - the guest must clearly NOT be able to
  reach it, and the squirrel must be able to reach it by climbing the case.
Plain bare-panel background, no scenery, no lettering anywhere.
SCENE tokens: CuckooClock, LeafPendulum, ChainWeight, SmallHook, BenchLamp.
```

---

## B-09 §4. 11컷

각 컷은 `STYLE ANCHOR + @image1(SquirrelKit) + @image2(CuckooGuest) + @image3(ClockKit) + 아래 블록` 으로 합성한다.

### p1 — 째깍 소리가 멈춘 저녁, 반쯤 열린 문
```
CAMERA: wide, LOW ANGLE from just above the sawdust, looking up the right-hand wall. SquirrelKit is
  small at the bottom centre (about 1/6 of frame height); the cuckoo clock is large high on the
  right; the window and bench are at the left.
SUBJECT: SquirrelKit stands on both hind legs, head tipped right back to look up at the clock, both
  forepaws cupped together in front of her chest, bushy tail standing straight up behind her, ears
  pricked, mouth slightly open. She is checking with her ears that a sound has stopped.
  CuckooGuest is NOT in this picture.
SETTING: the workshop map, whole. Bench under the window at the left with the opened pocket watch,
  tweezers and oil bottle; hook rail above it; two ceiling beams; spruce forest and a low sun beyond
  the window.
AIM: no guest yet - but the floor already points. 🔴 A long band of low sunlight lies across the
  sawdust and its far end stops exactly at the base of the clock, so the eye is led to that one spot
  before anything has happened.
TRACKS: 🔴 NONE. The sawdust is clean on this page and on no other page in this book. Only the long
  light band and a scatter of curled shavings.
HANDS: empty - both forepaws cupped together at her chest, holding nothing.
CLOCK: door STUCK HALF OPEN at an angle. Chains slack and looping, both pinecone weights hanging as
  low as they go, one touching the floor. 🔴 The LEAF PENDULUM IS LYING IN THE SAWDUST directly under
  the case, on its side, and the small hook above it is EMPTY. Gears still.
GLAZE: A - late afternoon. Warm yellow glaze; dust hangs motionless in the light band.
FINISH: squirrel, clock case, chains, weights and the fallen pendulum finished. The bench top and
  the light band half-finished. Beams, wall planks, window frame, forest = rough unfinished brush
  sketch over bare panel.
TONE: 🔴 THE SILENCE MUST BE IN THE PICTURE. Nothing in this image is moving, nothing is tilted as if
  swinging, no dust is stirred; the one thing that should hang is lying down. The whole room is warm
  and still and slightly too quiet, and the only colour that is not wood or brass is one red stitch
  line on her pocket, flat and slack.
NO LETTERING, NO NUMBERS ON THE CLOCK FACE, anywhere in this image.
```

### p2 — 사슬을 타고 조르르
```
CAMERA: medium, EYE LEVEL with the descending guest. Right half of the frame: the chains hanging from
  the clock base with CuckooGuest sliding down one of them. Left: SquirrelKit, frozen.
SUBJECT: CuckooGuest grips ONE chain with both feet wrapped round it and slides down; his stiff wings
  are held out sideways for balance, his beak is OPEN on the one sound he makes, the grain of his body
  runs lengthwise. 🔴 He is the only moving thing in the picture.
  SquirrelKit has both forepaws pressed flat against her mouth and has gone rigid: eyes as wide as
  they get, brows high, tail bristled to its widest, one hind foot half a step back.
SETTING: the clock base at the right, bench and window at the left, sawdust floor.
AIM: 🔴 he is still ON the clock, so the aim is the shortest it will ever be - his eye and beak point
  DOWN at the spot of floor directly beneath the case, the place he is heading for.
TRACKS: none yet - his feet have not touched the floor.
HANDS: frozen - both forepaws pressed to her mouth, holding nothing.
CLOCK: door still STUCK HALF OPEN at the same angle. Chains slack, weights fully sunk; the chain he
  is on swings just enough that ONE doubled edge shows where it has been. 🔴 The leaf pendulum is
  STILL LYING IN THE SAWDUST in the same place as p1; the hook is empty.
GLAZE: A - late afternoon. The low sun catches the brass chain so it is the brightest hard-edged
  thing in the frame.
FINISH: guest, squirrel, chain, weights finished. The clock's carved base and the fallen pendulum
  half-finished. Wall, beams, bench, window = rough unfinished brush sketch.
TONE: a still room with one small thing coming down through it. The surprise arrives silently -
  no burst lines, no sparkles, no glow. Her red pocket stitch is still flat.
NO LETTERING, NO NUMBERS anywhere in this image.
```

### p3 — 제일 좋은 호두를 내밀었는데
```
CAMERA: medium close-up, EYE LEVEL, the two of them low on the sawdust floor beside the bench legs.
  SquirrelKit on the left, CuckooGuest on the right. 🔴 THEIR FACES DO NOT MEET.
SUBJECT: SquirrelKit crouches on her heels and holds one walnut out in BOTH forepaws, pushed right up
  close to the guest; her eyes are crescents and her mouth is open in a pleased grin - she is certain
  this is a good present.
  CuckooGuest stands in front of the walnut without looking at it: 🔴 his neck is STRETCHED LONG and
  low past her, his eye, his beak, and both sets of toes all turned toward the upper right of frame,
  his short tail twitching. Beak closed. Face exactly as on the sheet.
SETTING: bench legs and the base of the oil bottle above; shelled walnuts and shell fragments on the
  floor; the very bottom of the clock case just clipped by the right edge of the frame.
AIM: 🔴 body, neck, eye and both feet all point past her to the upper right - to the clock base at the
  frame edge. Nothing about him is turned toward the walnut.
TRACKS: 🔴 mark ① is created here - a line of three-toed prints scraped through the sawdust behind
  his feet, running off to the right toward the clock. The prints are BEHIND HER BACK, so she cannot
  see them and the reader can. Same size, same shape, all toes pointing the same way.
HANDS: giving - both forepaws holding the walnut out, offering.
CLOCK: only its wooden base is in frame. Chains slack behind it, weights sunk. 🔴 The pendulum is
  still lying in the sawdust (off frame to the right, under the case) - do not show it hooked.
GLAZE: A - late afternoon. The light pools yellow between the two of them, and the pool is exactly
  where their eyes fail to meet.
FINISH: both animals and the print line finished. The walnut, the shells and the bench leg
  half-finished. Oil bottle, bench top, floor beyond, wall = rough unfinished brush sketch.
TONE: warm, generous, and completely one-sided. 🔴 The giving face and the looking-away body are in
  the same frame and the floor is the only thing that knows the answer. One red stitch line on her
  pocket, still flat.
NO LETTERING, NO NUMBERS anywhere in this image.
```

### p4 — 손이 멈추고, 주머니로
```
CAMERA: 🔴 CLOSE-UP, straight-down HIGH ANGLE onto the sawdust floor directly under the clock. No
  faces in this frame at all. The scraped prints and the two forepaws fill the picture.
SUBJECT: 🔴 ONLY SQUIRRELKIT'S TWO FOREPAWS are in frame, large. One paw has just lifted the leaf
  pendulum by its long neck and has STOPPED in mid-air - the fingers half slack, the grip no longer
  deciding. The other paw holds the mouth of the apron pocket wide open at the bottom of the frame.
  Two paws, two different jobs, one picture.
  At the very top edge: only CuckooGuest's two feet and the tip of his tail, standing still. 🔴 His
  toes point away, off frame to the side, toward the clock.
SETTING: sawdust floor, one sunken pinecone weight and the end of its slack chain at the top of the
  frame, curled shavings.
AIM: 🔴 his toes at the top edge point out of frame toward the clock, and the print line runs across
  the picture in the same direction. He is aiming even when only his feet are visible.
TRACKS: mark ① crosses the whole frame from bottom to top; 🔴 beside the pendulum lies the SHALLOW
  IMPRINT where it has been lying - a leaf-shaped hollow in the sawdust with the panel showing
  through it. The hollow and the print line point the same way.
HANDS: 🔴 THE HALTED HAND AND THE HIDING HAND. This is the page the whole book turns on and there is
  nothing else in it. Knuckles are pale where the halted grip has tightened and then stopped.
CLOCK: only the sunken weight and slack chain are in frame; the door is out of frame. The pendulum
  is in her paw, in the air, NOT on its hook. The hook is not in frame.
GLAZE: A - late afternoon. Yellow light falls straight down; the pocket's inside is the one dark hole
  in a bright picture.
FINISH: the two paws, the brass pendulum, the print line and the leaf-shaped hollow finished. The
  pocket cloth half-finished. Everything else = bare sawdust and rough unfinished brush marks; the
  background has effectively been removed by the angle.
TONE: 🔴 THE PICTURE IS ONE STOPPED MOMENT, and that stillness does the whole job of hesitation
  without a face and without a word. Honey sawdust, a brass leaf, and the ONLY RED IN THE BOOK
  pulled into a wide open oval right at the bottom of the frame.
NO LETTERING, NO NUMBERS anywhere in this image.
```

### p5 — 톱니를 굴려 줬는데, 총총총 걸어가 버렸다
```
CAMERA: wide, EYE LEVEL. Left half crowded with everything she has laid out; right half almost empty
  except for a small departing back.
SUBJECT: SquirrelKit lies flat on the floor at the left, rolling a brass gear wheel away with one
  paw and standing a curled shaving up into a slide with the other; her tail is straight up with
  delight, her mouth wide open, her eyes following the gear. 🔴 She is not looking at the guest.
  At the right, CuckooGuest walks away with 🔴 HIS BACK TO US - beak pushed forward, feet stepping
  quickly, the whole body leaning toward the base of the clock. He does not look back once. His
  face is not visible.
SETTING: three brass gear wheels of different sizes rolling on the floor, a low slide built from
  curled shavings, scattered walnut shells - 🔴 not one of them eaten. The clock base and its
  hanging chains at the right edge. Beyond the window the forest has gone dark and there is one
  band of red-tinged sky.
AIM: 🔴 his whole leaning body, both feet and (though we cannot see it) his head all point at the
  clock base at the right edge. The lean is the aim on this page.
TRACKS: mark ① from p3 is still there, shallower now; 🔴 mark ② is created - a second line of prints
  running parallel to the first, to the same place. Two lines, same destination.
HANDS: making things to play with - one paw rolling the gear, one paw standing the shaving up.
  🔴 THE POCKET IS BULGING in the shape of the leaf and the red stitch line is pulled taut.
CLOCK: door still STUCK HALF OPEN (upper right, small). Chains slack, weights fully sunk. 🔴 The hook
  is empty and the pendulum is not in the room's floor any more - it is in her pocket.
GLAZE: B - evening. A cold blue-grey glaze over the whole page; the lamp is NOT lit yet; the gears
  and shavings throw long low shadows.
FINISH: squirrel, guest and both print lines finished. The rolling gear, the shaving slide and the
  shells half-finished. Bench, wall, beams, window = rough unfinished brush sketch.
TONE: 🔴 THE DISTANCE BETWEEN EFFORT AND MISS IS THE WIDTH OF THE PAGE. Left side busy and warm-
  hearted; right side empty except one small back walking off. Cold evening light, and the only red
  is the taut stitch line on a bulging pocket.
NO LETTERING, NO NUMBERS anywhere in this image.
```

### p6 — 발자국은 언제나 한 곳을 가리켰다 🔴 밀도 배급 1/2
```
CAMERA: medium wide, HIGH ANGLE, tilted down over the whole sawdust floor so the floor is most of
  the picture. SquirrelKit stands at the upper left; the clock base is at the lower right.
SUBJECT: SquirrelKit stands with both forepaws on her hips, head tipped to one side, looking down at
  the guest with easy crescent eyes and a loose hanging tail - the comfortable face of somebody whose
  guess has just been confirmed.
  CuckooGuest sits directly under the base of the clock with both feet together and his stiff wings
  pressed to his sides, 🔴 his neck tipped right back so his beak and his eye point straight up at
  the small half-open door above him. Beak closed.
SETTING: 🔴 the floor is the subject of this page. Walnut shells and shaving fragments dropped along
  the way lie between the print lines. The clock base with its two slack chains and sunken weights
  at the lower right; above it, at the very edge of the frame, the half-open door.
AIM: 🔴 straight up. His eye, beak and the line of his whole body point at the door - and every line
  of prints on the floor points at the spot he is sitting on. The aim and the plant meet on this page.
TRACKS: 🔴 THE PAYOFF. FOUR separate lines of three-toed prints cross the floor from four different
  directions, and every one of them ENDS AT THE SAME POINT under the clock. The lines are countable;
  the toes always point toward that point. Older lines shallow and half-refilled, the newest deep
  with sharp scraped ridges. 🔴 The brightest, cleanest place in the whole picture is that one point
  where they meet.
HANDS: guessing - both forepaws on her hips, doing nothing at all. The pocket still bulges, the red
  stitch line still taut.
CLOCK: door STUCK HALF OPEN (top right edge). Chains slack, weights sunk to the floor. Hook empty.
GLAZE: B - evening, and 🔴 THE BENCH LAMP IS NOW LIT: one small warm pool falls from the upper left,
  so every scraped print has a tiny shadow on one side and the direction of the toes is unmistakable.
FINISH: 🔴 DENSITY BUDGET 1/2 - spend it on the print lines and the dropped shells and shavings ONLY.
  Both animals finished; the prints, shells and shavings finished enough to be counted. 🔴 The wall
  planks, beams, bench and window stay a rough unfinished brush sketch. If the floor is carried to
  completion the prints disappear and this page becomes nothing.
TONE: 🔴 SHE IS READING HIS BACK AND THE READER IS READING THE FLOOR. Warm lamp, cold window, and
  the answer written in the sawdust in four lines.
NO LETTERING, NO NUMBERS anywhere in this image.
```

### p7 — 사슬을 잡고 폴짝, 자꾸 미끄러졌다
```
CAMERA: medium, LOW ANGLE from the floor looking up past the hanging chain. CuckooGuest is up in the
  centre of the frame; SquirrelKit's two forepaws come up from the bottom. 🔴 A large empty height
  is left above him.
SUBJECT: CuckooGuest has both feet wrapped round one chain and is hauling himself up; his stiff wings
  beat hard but 🔴 THE GRAIN RUNS STRAIGHT DOWN THEM AND THEY CATCH NO AIR - they do not spread, they
  do not bend. One foot has slipped so the chain is swinging out sideways; his beak is open and his
  neck is stretched up at the door. Face exactly as on the sheet.
  From the bottom of the frame, SquirrelKit's two forepaws reach up and are closing round his body to
  bring him down. Her face, tipped up at the lower edge, has the brows pulled in and up - 🔴 she is
  protecting, not stopping him; no cross or angry face anywhere.
SETTING: the clock case above, its two slack chains and both sunken weights; the small HALF-OPEN
  DOOR high up at a height he plainly cannot reach; the window behind is now black with the lamp
  reflected in the glass.
AIM: 🔴 up, at the door, and this page states the aim most plainly of all - he is trying to climb to
  it. The empty height between his beak and the door is the whole point of the composition.
TRACKS: marks ① ② and the new lines are on the floor below; 🔴 under the chain there is a SCUFFED
  PATCH where prints have been smeared away by slipping feet - a swept, ragged scrape.
HANDS: holding on - both forepaws reaching up and closing round him.
CLOCK: door STUCK HALF OPEN, high and out of reach. Chains slack and now swinging slightly (ONE
  doubled edge on the chain, nothing else). Weights sunk. Hook empty; pendulum still in her pocket,
  which bulges at the bottom edge of the frame with its taut red stitch line.
GLAZE: C - night. Warm orange lamp glaze coming from low down at the left, so the lower part of the
  picture is lit and the height above him goes dark. No glow, no beams.
FINISH: guest, the chain, her two paws and her tipped-up face finished. The clock's lower carving and
  the scuffed patch half-finished. Beams, upper wall, window frame = rough unfinished brush sketch,
  and the dark upper part is mostly bare panel under glaze.
TONE: 🔴 WHERE HE WANTS TO GO IS AT THE TOP OF THE PAGE AND HER HANDS ARE AT THE BOTTOM. Two forces
  pulling opposite ways in one frame, and the gap between them is drawn as empty height.
NO LETTERING, NO NUMBERS anywhere in this image.
```

### p8 — 손님이 흔들이를 물고 나와 제자리에 놓았다 🔴 반전
```
CAMERA: medium close-up, EYE LEVEL, low on the floor. Left: the apron lying on the sawdust with its
  pocket gaping. Right: CuckooGuest standing on the leaf pendulum. Behind, in the shadow, the
  squirrel.
SUBJECT: CuckooGuest stands with both feet flat on top of the leaf pendulum, which is lying on the
  floor at the base of the clock. 🔴 FOR THE FIRST TIME IN THE BOOK HIS HEAD IS TURNED STRAIGHT TO
  CAMERA AND HIS EYE LOOKS DIRECTLY AT HER: neck upright, beak closed, wings flat to his sides.
  His face is EXACTLY the same as on every other page - only the direction has changed. Not pleading,
  not cross: waiting.
  Behind and to the left, in the dark, SquirrelKit stands frozen: both forepaws stopped half raised
  in the air holding nothing, eyes as wide as they go, tail bristled, mouth a closed line pulled down.
SETTING: 🔴 THE APRON IS OFF AND LYING ON THE FLOOR at the left, its pocket gaping open and FLAT AND
  EMPTY - the red stitch line is slack again and you can see straight into it. Above: the slack
  chains, the sunken weights, the half-open door. The bench lamp is off frame at the left.
AIM: 🔴 achieved. He has brought the thing back to the one spot he has pointed at for seven pages,
  and he is standing on it. The aim now points at HER instead - his eye is the only aim in the frame.
TRACKS: 🔴 the evidence is written on the floor - ONE DRAGGED GROOVE runs from the mouth of the fallen
  pocket to the base of the clock, with a line of three-toed prints beside it, going the same way.
  All earlier print lines are still there. Nobody has to be told who moved it.
HANDS: empty - hers are stopped in the air, holding nothing, and the pocket they filled is on the
  floor with nothing in it.
CLOCK: door STUCK HALF OPEN above. Chains slack, weights still sunk. 🔴 THE LEAF PENDULUM IS BACK IN
  ITS PLACE ON THE FLOOR directly under the EMPTY HOOK - not hooked yet. Gears still.
GLAZE: C - night, one lamp. 🔴 Only one hand's width of floor at the base of the clock is lit, and
  the pendulum and the bird standing on it are inside that light. Everything else falls back into
  brown darkness, and the one who did the hiding is standing in the dark.
FINISH: guest, pendulum, the dragged groove, the prints and the gaping pocket finished. The apron
  cloth and the clock base half-finished. Squirrel in the dark = contour and one dark pass, her eyes
  and the pale patch on her chest kept as the two light points that let her read. Wall, beams = rough
  unfinished brush sketch.
TONE: 🔴 THE DAY TURNS OVER AND IT IS DONE WITH BRIGHTNESS, NOT WITH A FACE. What is in the light is
  the thing that was hidden, and the only red in the frame is an empty pocket lying on the floor.
NO LETTERING, NO NUMBERS anywhere in this image.
```

### p9 — 사슬을 당기고, 고리에 끼워 톡
```
CAMERA: 🔴 EXTREME CLOSE-UP, EYE LEVEL, right inside the open bottom of the clock case. The brass
  works fill the frame. NO FACES AT ALL.
SUBJECT: 🔴 ONLY SQUIRRELKIT'S TWO FOREPAWS. One holds the leaf pendulum by its long neck and is
  fitting that neck onto the SMALL BRASS HOOK - knuckles pale with care. The other paw's fingertip
  is just giving the flat of the leaf A SMALL PUSH, and that fingertip is very slightly shaky.
  At the very bottom edge, only the top of CuckooGuest's head and his beak, tipped up to watch
  inside the case.
SETTING: 🔴 THE INSIDE OF THE MACHINE, drawn truthfully and drawn hard: several BRASS GEARS visibly
  meshed, teeth interlocking, and ONE TOOTH CAUGHT IN THE ACT OF STEPPING OVER. The small open brass
  hook is right up close and unmistakable. At the side of the frame 🔴 THE CHAIN IS NOW STRAIGHT AND
  TAUT AND THE PINECONE WEIGHT HAS RISEN, high, where before it lay on the floor. Behind, out of
  focus in finish terms only, the walnut of the case.
AIM: his beak at the bottom edge points up INTO the case - for the first time his aim and her hands
  are pointing at the same thing.
HANDS: 🔴 THE MENDING HANDS. One fits, one pushes. This is the hand that hid the pendulum on p4 and
  it is the same two paws in the same medium - the reader must be able to recognise them.
CLOCK: chains TAUT, weights RISEN. Pendulum's neck ON THE HOOK. Gears meshed with one tooth stepping.
  The door is above and out of frame.
GLAZE: C - night, one lamp, low and warm, sliding along the brass. 🔴 The leaf has just begun to move:
  show it with ONE doubled edge on the far side of the leaf and TWO small lamp glints on it, and with
  nothing else. No motion blur, no arcs, no sparkles, no radiating lines.
FINISH: the two paws, the pendulum, the hook, the meshed gears and the taut chain finished and HARD-
  EDGED - this is the sharpest picture in the book. The apron and empty pocket at the frame edge
  half-finished. The case's carving = rough unfinished brush marks.
TONE: 🔴 THE TICK HAS TO BE AUDIBLE IN A STILL PICTURE, and it is made only by the tooth caught mid-
  step, the doubled edge of the leaf and the risen weight. No face, no room, no words - a hand that
  hid something all day pushing it back to work.
NO LETTERING, NO NUMBERS anywhere in this image.
```

### p10 — 두 손으로 받쳐 올렸다
```
CAMERA: medium close-up, LOW ANGLE from below the clock's small door, looking steeply up. Her two
  raised paws and the guest crossing the threshold fill the centre.
SUBJECT: SquirrelKit clings to the side of the wooden case with her hind feet braced against it and
  her body pressed to the wood, both forepaws stretched right up to hold the guest's feet from
  underneath; her arms are straight, her tail swings down as a counterweight, her face is turned up
  and set with effort - 🔴 neither smiling nor crying.
  CuckooGuest has ONE FOOT ALREADY OVER THE THRESHOLD and the other still standing in her palm; his
  body leans in, his neck is going in, and one stiff wing is propped against the door frame - propped,
  not flapping. Face exactly as on the sheet.
SETTING: the small door of the clock, its inside deep and dark. 🔴 THE DOOR IS BEING PULLED SHUT and
  the THIN BRASS WIRE from the back of the door runs taut into the works - the machine is closing it,
  not a hand. The carved leaf-and-berry face below, TWO HANDS, NO NUMBERS.
AIM: 🔴 reached. His body points into the doorway and he is entering it. This is the last page his aim
  is needed.
TRACKS: far below, small: the print lines and the dragged groove still on the sawdust, and the apron
  with its flat red stitch line lying there.
HANDS: 🔴 THE LIFTING HANDS - the hands that held him down on p7 are now holding him up, and the
  reader must be able to read the change from the posture alone. Same two paws, opposite job.
CLOCK: door OPEN AND BEING DRAWN SHUT, wire taut and visible. Chains taut, weights high. 🔴 Below, the
  leaf pendulum is SWINGING - one doubled edge on the far side of the leaf.
GLAZE: C - night, one lamp from low down: her palms and the threshold are the only warm-lit things,
  and the inside of the doorway stays deep dark bare panel under glaze.
FINISH: her paws, her face, the guest, the door, the wire and the pendulum finished. The carved face
  of the clock half-finished - leaves suggested, not every leaf. Beams, wall, the floor far below =
  rough unfinished brush sketch.
TONE: 🔴 THE HEIGHT THAT WAS TOO BIG ON P7 IS EXACTLY ONE PAIR OF HANDS WIDE ON P10. Nothing says
  this but the posture and the angle.
NO LETTERING, NO NUMBERS anywhere in this image.
```

### p11 — 「뻐꾹!」 다람쥐가 두 손을 입에 모았다 🔴 밀도 배급 2/2 · p1 의 정반대 상태
```
CAMERA: wide, EYE LEVEL - the whole workshop in one frame. 🔴 THE SAME ROOM AS P1 AND NOT MIRRORED:
  window and bench at the left, clock high on the right. Bake this cut LAST and attach the approved
  p1 as a reference so the room is identical and only the machine has changed.
  Upper right: the wide-open door with the guest leaning out. Lower left: SquirrelKit with both paws
  at her mouth. The two of them sit on a diagonal.
SUBJECT: SquirrelKit stands on both hind legs on the bench top, head tipped back, 🔴 BOTH FOREPAWS
  CUPPED ROUND HER MOUTH LIKE A LITTLE TRUMPET, calling up at the clock; eyes crescent, front teeth
  showing, tail straight up. 🔴 She is NOT reaching for him - the hands that grabbed are at her mouth.
  CuckooGuest leans half out of the wide-open door with his beak OPEN, both feet still inside the
  threshold, wings just slightly out. 🔴 His eye is turned DOWN at her - the second and last time he
  looks at her, and again it is a turn of the head and not an expression.
SETTING: the workshop map, whole, as on p1. 🔴 THE APRON HANGS OVER THE CORNER OF THE BENCH, its
  pocket flat and empty, and the red stitch line catches one point of lamplight. The window is black
  and the lamp and the clock are both reflected in the glass.
AIM: over. Both of them are now aimed at each other, and nothing else in the picture points anywhere.
TRACKS: 🔴 ALL the print lines and the dragged groove are STILL ON THE FLOOR, still converging under
  the clock - the whole day has stayed in the sawdust. Nothing has been swept.
HANDS: 🔴 ANSWERING - both paws cupped at her mouth. The hand arc of the book ends here: hiding hand,
  mending hand, lifting hand, and now a hand that is only helping her make a sound.
CLOCK: 🔴 EXACTLY THE OPPOSITE OF P1 IN ALL THREE VALUES. Door WIDE OPEN with the wire drawn taut
  inside. Chains STRAIGHT AND TAUT, both pinecone weights hanging HIGH under the case. The leaf
  pendulum HOOKED and TILTED WELL OVER TO ONE SIDE, mid-swing, with ONE doubled edge behind it.
GLAZE: C - night, one low lamp. The room sinks into warm brown and the open door and the bird in it
  are the brightest things.
FINISH: 🔴 DENSITY BUDGET 2/2 - spend it on the bench tools and the marks left in the sawdust ONLY.
  Both animals, the door, the chains, the weights and the swinging pendulum finished; the bench tools
  and the floor marks finished enough to be read. 🔴 The wall planks, beams, ceiling and window frame
  stay a rough unfinished brush sketch. Painting the walls would bury the floor and the floor is the
  record of the day.
TONE: 🔴 THE ROOM IS RUNNING AGAIN AND THE PICTURE MUST SAY SO WITHOUT A SOUND: the weights are up,
  the leaf is over on one side, dust is stirring in the lamp pool - everything that was lying down on
  p1 is now hanging and moving. Across the diagonal, a small mouth below and an open beak above, with
  warm empty air between them.
NO LETTERING, NO NUMBERS ON THE CLOCK FACE, anywhere in this image.
```

---

## B-09 §5. 첫 렌더 검수 6항목 (하나라도 걸리면 문구가 아니라 ref 를 바꾼다 — §5.1 교훈)

1. 🔴 **손님의 몸에 나뭇결이 흐르고 다람쥐에는 한 오라기도 없나.** 둘 다 결이 있으면 「산 것 / 만들어진 것」 규칙이 무너지고, 그러면 이 권의 유일한 판타지 규칙이 화면에서 사라진다. 둘 다 없으면 손님이 왜 못 나는지 근거가 없어진다.
2. 🔴 **발자국이 「그린 자국」이 아니라 「긁어낸 자리」인가.** 판정 = 발자국 안쪽 색이 **바닥보다 어둡고 나무판 색과 같은가**(맞음) / 바닥 위에 얹힌 갈색 얼룩인가(틀림). 그리고 **세 갈래 발가락이 다 같은 방향을 가리키고, 줄을 셀 수 있나**(§2.11).
3. 🔴 **놋빛이 이 책에서 유일하게 딱딱한가.** p9 에서 톱니가 맞물려 있고 고리와 흔들이 목이 또렷한가. 브라스가 부드럽게 번지면 기계가 안 읽히고, p9 의 고침이 발견이 아니라 그냥 손 그림이 된다.
4. **글레이즈가 색을 늘렸나.** 세 단계가 **온도만** 바뀌어야 한다. 창에서 빛기둥·후광·번짐이 나왔으면 즉시 실패(NOT 절 강화 후 재시도).
5. 🔴 **손님의 얼굴이 쪽마다 달라졌나.** p3 의 무표정과 p8 의 무표정이 같은 얼굴인가. 표정이 붙는 순간 다람쥐의 오해가 「왜 못 알아듣지?」가 되고 반전이 죽는다.
6. **배경이 「흐린 것」이 아니라 「덜 그린 것」인가**(§2.7 보정). 판 벽·들보·시계집 조각이 다 그려져 있으면 바닥의 자국이 묻힌다 — 그러면 **배경이 러프하게 남은 승인 컷을 ref 세트에 넣는다**(전래동화·A-01 이 같은 데서 막혔다).

**부수 확인 2가지**: ① 시계 얼굴에 **숫자·눈금·글자가 한 개도 없나**(5개 언어 공용). ② **나무판이 「조각 오브제 사진」으로 새지 않았나** — 보풀·바늘땀·점토 질감이 보이면 그 순간 호리 니들펠트 라인이다(§4).
