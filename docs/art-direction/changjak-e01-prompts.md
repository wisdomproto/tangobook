# 창작동화 1000 — E-01 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`(§2.1 · §2.3 · §2.4 · §2.7 · §2.8 · §2.9 · §2.10 · §2.11 · §7.1~7.5), 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/e01.md`.** 아래 12컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다. 새로 발명한 장면 없음.
> 🔴 **이미지 생성은 이 문서가 하지 않는다.** 사용자가 직접 굽는다.
> 🔴 **작가 실명은 한 글자도 안 들어간다** — 근거 후보 id 는 §1 판정 표에만 남기고 프롬프트는 전부 문구다.

## 0. 실행 순서 (어기면 인물만 매끈한 CG 로 나온다 — §2.4)

1. **STYLE ANCHOR 로 시트 4장을 먼저 굽는다. 장면 금지.** 순서 = 🔴 `BakeryKit`(무대 기준물) → `MouseSneeze` → `BakeryCat` → `BakerSparrowDog`.
   🔴 **`BakeryKit` 을 인물 시트와 같은 등급으로 취급한다.** 이 권은 **밀가루 높이를 기준물 다섯으로 재는 책**이라(의자 → 반죽대 → 선반 → 창턱 → 들보), 기준물이 쪽마다 다른 물건으로 그려지면 열두 쪽이 통째로 무의미해진다.
2. 시트가 승인되면 `@image1`(BakeryKit) · `@image2`(MouseSneeze) · `@image3`(BakeryCat) · `@image4`(BakerSparrowDog)를 붙여 컷을 뽑는다.
3. 🔴 **굽는 순서 = p1 → p6 → p8 → 나머지 여덟 → p12 는 맨 마지막에.**
   - **p1** = 무대 전체 + **밀가루 0** 의 기준판. 기준물 다섯이 한 번에 다 보이는 유일한 쪽이고, 여기서 정한 작업실이 열두 쪽 내내 안 바뀐다.
   - **p6** = **맨 종이 최대(약 80%)** 의 기준판. 🔴 이 한 장이 「밀가루 = 안 그린 종이」를 세우거나 무너뜨린다. 여기서 뿌연 회색 베일이 나오면 나머지 열한 장도 그렇게 나온다.
   - **p8** = 오븐 주황의 최대. 이 책에서 유일하게 **칠한 밝음**의 기준.
   - **p12** = 두 번째 순검정 덩어리(개의 코). p10 승인본을 옆에 붙여 **순검정 값이 같게** 굽는다.
4. 승인 렌더 3장을 앵커 ref 슬롯에 넣는다 — 🔴 **인물 컷 1(p4) · 화면이 통째로 맨 종이로 남은 컷 1(p6) · 전체 장면 1(p1)**. 3장이 전부 그려진 컷이면 「밀가루는 안 그린 종이」라는 문구가 영영 안 먹는다(점눈이에서 실제로 겪은 일, §2.7 보정).
5. 앵커 이름은 **렌더를 보고 짓는다**(§7.5-3). 지금은 슬러그만: `changjak-e01`.

---

# E-01 「빵집에서 재채기하면 안 되는 이유」

주제군 **E 웃음·말놀이** / 엔진 **누적·반복** / 무대 프랑스 빵집 / 주인공 새끼 생쥐 + 고양이·참새·아저씨·개 / **12스프레드** · 후렴 「에—취!」 8회(줄표가 한 개씩 길어진다)

## E-01 §1. 앵커 배정

**한 줄**: 🔴 **흰 종이가 밀가루다.** 밀가루가 차오르는 것 = 그 높이 아래로 **아무것도 안 그려져 있는 것**이고, 그래서 이 책은 쪽이 넘어갈수록 **그림이 줄어든다.** 다 가라앉으면 흰 것이 공기에서 **표면으로** 옮겨가 물건들이 **윤곽만 남고 안이 빈 채** 돌아오고, 생쥐가 서 있던 자리만 **꽉 채운 검정**이다. 앵커 슬러그 `changjak-e01` — **신규 민팅** (🔴 **C1 둘째**, 공정이 c01 과 정반대).

### 이 권이 그림에 요구하는 것 (판정의 전제 — 후보는 이 다섯을 통과하는지로만 봤다)

1. 🔴 **높이를 잰다.** 대본 note 가 「카운트는 밀가루 높이(의자 → 탁자 → 선반 → 창문 → 천장)」이고 「매 쪽 화면에 같은 기준물이 남아 있어 아이가 눈으로 잰다」고 못 박았다. 즉 **기준물 다섯이 열두 쪽 내내 같은 물건이어야 하고**, 잠긴 것의 개수가 늘어야 한다 — 셀 수 있어야 한다(§2.11).
2. 🔴 **흰 것이 화면을 먹는다.** 그런데 이 흰 것을 **덧칠로 하면** 매 쪽 흰 물감이 늘어나는 책이 되고(c01 이 이미 그 책이다), **지워서 하면** 감산 목탄이 된다(e09 가 이미 그 책이다). 남은 하나가 **종이를 남기는 것**이고, 그것만이 「빵집이 사라져 간다」를 **그리지 않음**으로 만든다.
3. 🔴 **되돌아와야 한다.** 착지는 「도로 가라앉음」이다. 공중의 흰 것이 **표면의 흰 것**으로 바뀌는 장면(p10)이 이 책의 사건이고, 그 변화를 매체가 구별할 수 있어야 한다.
4. 🔴 **얼굴이 연기한다.** p4 는 화면 전체가 생쥐 얼굴이다(볼이 터질 듯 부품 · 실눈 · 수염 여섯 가닥 전부 뻗침). 표정을 못 그리는 매체는 이 권에서 원천 탈락이다(§2.8) — **이 책에서 가장 웃긴 그림이 p4 다.**
5. 🔴 **저지 여섯 번이 매번 다른 이유로 실패한다.** 앞발·날개·행주·창·손이 매 쪽 다른 방향에서 들어오므로, 화면이 **누가 어디서 뻗어 왔는지** 한눈에 읽혀야 한다 → 굵은 실루엣과 큰 여백이 필요하다.

### 후보 3

| | 후보 ① **C1 · 차가운 흰 종이 + 굵은 검정 콩테 + 문지른 가루 톤** (`erlbruch-duck` · `gravett-wolves`) | 후보 ② C2 선 하나 캐릭터 (`metcalfe-crisps`) | 후보 ③ C7 회화적 톤 (뿌연 공기) |
|---|---|---|---|
| 매체 | 흰 카트리지지에 굵은 콩테 획 + 손가락으로 문지른 가루 톤. 물감 0 | 잉크 낙서 선 + 평면 색면 1~2 | 과슈·목탄 대기감, 붓 톤 |
| 이 권에 맞는 이유 | 🔴 **밀가루 = 안 그린 종이**라 요구 2 가 공정으로 해결된다. 굵은 스틱은 획이 크고 거칠어 슬랩스틱과 맞고, 얼굴을 부풀릴 만큼 뭉툭하다. 그리고 **획을 안 그리는 방식이라 「덜 그리기」(§2.7)가 취향이 아니라 플롯**이 된다 | E 주제군 1순위. 캐릭터가 화면을 지배하고 굵은 선이 웃음을 만든다 | 뿌옇게 차오르는 공기를 그리기에 가장 쉽다. 새벽 등불·아침 빛줄기가 잘 붙는다 |
| 리스크 | 흰 종이 + 검정 하나라 12쪽이 단조로울 수 있다 → **p1·p10 밀도 배급 + p7~p11 오븐 주황**으로 리듬을 만든다 | — | — |
| 판정 | ✅ **추천** | 탈락 — ① 이 라인이 이미 둘(g10·f01) ② 🔴 결정적: **윤곽선 언어는 「흰 것이 늘어나는 것」을 못 쓴다.** C2 는 맨 종이를 무대 밖으로 취급하므로 처음부터 화면이 다 하얗고, 선을 지우면 밀가루가 차오른 게 아니라 **그림이 미완성**으로 보인다. 면적 변화가 안 읽힌다 | 탈락 — ① 🔴 **뿌연 공기는 §2.7 보정의 정면 위반**이다("흐리게" ≠ "안 그림"). 첫 렌더부터 회색 베일 필터로 착지한다 ② **대기감이 기준물 다섯을 뭉갠다** → 높이를 못 잰다(§2.11, a11 에서 같은 이유로 C7 탈락) ③ C7 이 이미 둘(e09·b09) |

추가 탈락: **C4 평면 형태**(E 2순위) — §2.8 대로 표정이 없다. 요구 4 가 통째로 불가하고, 라인이 C4 를 이미 셋 썼다(b01·e120·b04). **C3 · C6** — 넷·셋으로 금지(§7.5-0).

### 🔴 추천 = 후보 ① — 흰 종이가 밀가루다

근거 세 줄:

- **매체가 재료다.** 밀가루는 **가루**이고 콩테도 **가루**다. 이 책은 가루로 그린 그림이 가루에 지워지는 책이고, 그 아이러니는 문구가 아니라 재료에서 나온다(§2.3 필연성).
- **흰 것의 정체가 셋으로 갈린다** → 셀 수 있다. `그려진 것`(아직 안 덮임) / `윤곽만`(덮임) / `꽉 채운 검정`(닿지 않음). 3단계 규약이라 아이가 매 쪽에서 무엇이 무엇인지 판정할 수 있고, **착지(p10 의 원)가 공정에서 저절로 나온다.**
- **밝음이 두 종류다.** 이 책에서 밝은 것은 전부 **안 그린 종이**(등불·아침 창·밀가루)이고, **딱 하나만 칠한 밝음**이다 — 오븐 불. 그리고 그 칠한 밝음이 마지막 재채기의 원인이 된다(p8 뜨거운 바람). 색을 먼저 고르고 이야기를 끼운 게 아니라 **이야기가 색을 하나만 요구했다**(§2.9).

🔴 **새로 확립한 §2.9 변형 = 「악센트는 유일하게 칠한 밝음이고, 나머지 밝음은 전부 안 그린 것이다.」**
지금까지 확립된 다섯 변형(더하기 a04 · 덜어낸 자리 a91 · 들어낸 자리 e09 · 덮인 층 c60 · 주인공의 재료 c01)에 여섯째가 붙는다. 이 변형의 힘은 **악센트가 색으로만 특별한 게 아니라 「물성으로」 특별하다**는 것이다 — 화면의 밝은 곳 아홉 군데가 전부 「안 그림」인데 한 군데만 「칠함」이라, 그 한 군데는 색을 빼도 여전히 유일하다. **「빛과 여백이 같은 재료인 권」 전체에 재사용할 것.**

### 🔴 C1 을 두 번째로 여는 근거 + 분리 규칙 통과 (§7.2 · §7.5 — 하나라도 어기면 전래동화 복사본이다)

| 축 | 전래동화 **점눈이** | **c01** (C1 첫째) | **e01** |
|---|---|---|---|
| **종이색** | 밝은 크림 = 햇빛 | 따뜻한 갈색 크라프트 #AD8B60 | ✅ **차가운 청기 흰 카트리지지 #F2F2EF** |
| **얼굴** | 점눈 2 + 실선 입 | 아몬드 눈 + 별개 눈썹선 | ✅ **큰 둥근 눈 + 별개 위눈꺼풀선 + 별개 눈썹 + 볼이 부푼다** |
| **악센트** | 화면당 빨강 1점 | 불투명 흰색(양이 늘어난다) | ✅ **오븐 불 주황, 후반 다섯 쪽만, 광원이지 사물색 아님** |
| **매체** | 느슨한 색연필 낙서 | 마른붓 과슈 + 눌러 그린 흑연 | ✅ **굵은 검정 콩테 획 + 손가락으로 문지른 가루 톤, 물감 0** |
| 🔴 **흰 것의 정체** | — | **얹은 물감**이고 양이 **늘어난다** | ✅ **안 그린 종이**이고 양이 **늘어난다** — 같은 곡선을 **정반대 물성**으로 그린다 |

🔴 마지막 줄이 이 배정의 핵심이다. c01 과 e01 은 「흰 것의 양이 서사」라는 점에서 가장 가까운 두 권인데, **c01 은 붓으로 흰 것을 얹고 e01 은 스틱을 들어서 안 그린다.** 첫 렌더는 반드시 두 권을 나란히 놓고 본다(검수 6번).

### 라인 충돌 확인 (필수)

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 2D 드로잉. 실물 입체 재료(양모·바느질·점토) 없음 — NOT 절에 명시 |
| 전래동화 **점눈이** | ✕ (4축 전부 분리) | 위 표 |
| **c01**(C1 첫째, 가장 가까움) | ✕ | 위 표 마지막 줄. 종이 온도·매체·흰 것의 물성이 전부 반대 |
| **a04**(회백지 흑연 + 앰버) | ✕ | a04 = **눌러 찍은 흑연 선**이 플롯(발자국)이고 앰버는 **투명 색판**. e01 = **굵은 뭉툭한 스틱 획**이고 서사는 **획이 없어지는 것**, 주황은 **불투명 광원**. 그리고 a04 = C6 |
| **e09**(같은 E 군 · 마른 회색 매체) | ✕ | 🔴 가법↔감법으로 정반대다. e09 = 어두운 종이를 목탄으로 덮고 **지우개로 빛을 들어낸다** / e01 = **밝은 종이에 얹고, 지우개를 쓰지 않으며 그냥 안 그린다.** 밝기도 정반대(밤 방 ↔ 아침 흰 방) |
| **e03 · e120**(같은 E 군 · 같은 누적 엔진) | ✕ | e03 = 밝은 오트 인쇄지의 **3잉크 포스터 세계** / e120 = 회청 위 **오려 붙인 무지 색면** / e01 = **손으로 그린 흑백 드로잉**(판도 오리기도 없다). 썸네일에서 셋 다 다르다 |
| **h01**(🔴 같은 프랑스 빵집 — 최대 위험) | ✕ | 아래 별도 표 |
| 세계명작 수채 그림풍 | ✕ | 흑백 드로잉. 전면 채색 수채 아님 |

### 🔴 h01 「빵이 부푸는 동안」 과의 분리 (같은 무대 · 같은 소재 — 이 라인에서 가장 위험한 쌍)

두 권 다 프랑스 빵집이고 반죽·밀가루가 나온다. **7축을 정반대로 갈랐다.**

| 축 | **e01** (터지고 흩어진다) | **h01** (아무 일도 안 일어난다) |
|---|---|---|
| 클러스터·공정 | **C1** — 흰 종이에 굵은 검정 스틱, **획을 안 그린다** | **C5** — 버프 종이에 **손그림 장식 테두리 + 평칠**, 같은 프레임이 반복된다 |
| 판 | 차가운 흰 #F2F2EF (밝다) | 탁한 따뜻 버프 #C9BBA4 (한 단 어둡고 회색기) |
| 프레임 | **테두리 없음.** 화면이 사방으로 흘러 나간다 | **매 쪽 같은 테두리.** 넘는 것은 그 쪽의 작은 일 하나뿐 |
| 여백 | **최대** — p6 은 화면 80%가 맨 종이 | **최소** — 테두리가 화면을 두르고 안은 평칠로 꽉 차 있다 |
| 물성 | **마른 가루**(콩테 알갱이·문지른 손자국) | **젖은 얼룩**(하드에지 습기) + 불투명 평칠 |
| 불 | 🔴 **오븐 불이 유일 악센트**이고 화면 최강점 | 🔴 **불을 색으로 그리지 않는다.** 주황·노랑이 팔레트에 없다 |
| 카메라·시간 | 넓게 흔들리는 대각선, 8회 폭발 | 프레임 고정 + 매크로, 정지. 사건이 없다 |

🔴 두 권의 첫 렌더는 **반드시 붙여 놓고** 본다. 하나는 **테두리 없는 텅 빈 흰 책**, 하나는 **테두리 있는 꽉 찬 버프 책**이어야 한다.

### 🔴 대본 SCENE 결함 4건 — 그림에서 교정한다 (전부 같은 병이다: 「흐림」)

대본은 밀가루를 **초점·대기감**으로 적어 뒀다. 이 앵커에서 그건 통째로 실패 모드다(§2.7 보정: "흐리게" ≠ "안 그림"). 네 곳 전부 **획이 멈추는 것**으로 옮겼다. **대본 문구 수정은 불필요** — 삽화 지시만 분기한다.

| # | 대본 | 문제 | 그림 처방 |
|---|---|---|---|
| 1 | p4 「배경은 흐림」 | 블러는 이 책의 1번 실패 모드 | **배경에 획이 없다.** 선반 아래턱 한 줄 + 바구니 열둘의 윗변만 콩테 점으로. 나머지는 맨 종이 |
| 2 | p6 「위아래 구분이 사라질 만큼 공기가 뿌옇고」 | 뿌연 회색 베일 유혹 | **맨 종이 약 80%.** 행주 덩어리 하나만 획이 있다 |
| 3 | p7 「멀리 있는 것일수록 형체가 녹아 사라진다」 | 원근 흐림 | **거리와 무관하다.** 밀가루 높이 위에 있는 것만 획이 있고, 그것도 열린 윤곽 몇 개뿐 |
| 4 | p12 「뒤쪽 넷은 부드럽게 풀어 놓는다」 | 피사계심도 | **초점이 아니라 채움의 차이.** 뒤쪽 넷은 **윤곽만**(p10 규약), 전경 개 코는 **꽉 채운 검정** |

그림 쪽에서 결정한 것 1건 — p1 의 **등불**. 대본은 「등불 하나만 켜져 빛이 아래에서 위로 올라온다」인데, 이 책은 오븐 점화(p7)까지 색이 0 이어야 한다 → **등불은 작은 콩테 원 + 그 둘레의 맨 종이**로 그린다. 불꽃을 칠하지 않는다. 이 결정이 「밝음은 안 그린 자리」 규칙을 첫 쪽에서 세운다.

### 밀도 배급 (§2.10 · §2.12)

무텍스트 쪽이 없어 §2.12 우선권은 미발동 → 슬롯을 **양 끝**에 준다.
- **p1** = 무대 학습. 기준물 다섯이 한 번에 다 보이는 유일한 쪽.
- **p10** = 표면으로 옮겨간 흰 것. 윤곽만 남은 물건들이 실제로 세어져야 한다.

🔴 **밀도는 소품에만** 들어간다(§2.7) — p1 = 체 셋·긁개·바구니 열둘·의자·자루 / p10 = 하얗게 덮인 체·긁개·주걱·꺼진 바구니 열둘. **벽돌 한 장·나뭇결·천장 서까래를 그리면 두 쪽이 다 죽는다.**

### 의인화 등급 (a91 에서 확립한 규칙 재사용 — 고정)

- **생쥐 = 이족.** 뒷발로 서고 앞발이 손이다(코를 잡고, 고양이 발목을 붙잡고, 행주를 벗는다).
- **고양이 = 사족.** 절대 서지 않는다. **앞발 하나로** 밀고 누르고, 나머지 셋은 바닥에 있다.
- **참새 = 날개와 부리만.** 손짓 없음.
- **개 = 완전 사족.** p12 에 주둥이만.
- **아저씨 = 사람 어른.** 머리는 키의 1/6, 말을 하지 않는다.
- 🔴 **포즈가 안 되면 생쥐의 포즈를 바꾼다.** 다른 넷의 등급을 올리지 않는다.

---

## E-01 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-e01  (mouse / French bakery / sneezing flour)

Style: a hand-drawn picture-book page for 4-6 year olds. Broad, loud, physical comedy, drawn
  fast with a fat black stick on white paper. Funny before it is pretty.

MEDIUM: a thick black conte / compressed charcoal stick worked on cool white cartridge paper
  with a fine tooth. ONLY TWO KINDS OF MARK EXIST IN THIS BOOK:
  (a) BLUNT STROKES - the flat side and the corner of the stick dragged fast. The stroke is
      wide, its ends are ragged where the stick lifted, and the paper tooth breaks it.
  (b) SMUDGE TONE - the same black dust pushed around with a finger and a rag, so the grey is
      granular, uneven, and the direction of the finger is visible. Never an even flat grey.
  Edges are made by the stick running out, never by a clean vector line.
  There is NO paint, NO wash and NO WHITE PIGMENT OF ANY KIND anywhere in this book.
  🔴 THE PAPER IS THE FLOUR. Bare untouched paper is not "empty background" - it is airborne
  flour standing in the room. The flour is therefore drawn by NOT DRAWING, and the top of the
  flour is a HARD boundary: below it there are marks, above it there is nothing at all.

PALETTE: black conte on cool white paper, and one warm colour that arrives late.
  Hex anchors: paper #F2F2EF / smudge mid grey #7A756E / stroke black #221E1B.
  EXACTLY ONE other colour exists in this book: oven fire orange #E07A2C, deepening to #B8481B.
  🔴 IT APPEARS ONLY FROM THE PAGE WHERE THE OVEN IS LIT, AND ONLY AS THE FIRE ITSELF. On all
  earlier pages there is no orange anywhere at all.
  🔴 EVERY OTHER BRIGHT THING IN THIS BOOK IS BARE PAPER, NOT PAINT - the oil lamp, the morning
  window, the light lying on the flour: all of them are simply places where nothing was drawn.
  The oven fire is the one exception, the only bright thing that was actually coloured in, and
  that is exactly why it is the thing that ends the story.

THREE STATES OF MATTER - this is the whole grammar of the book. Obey it on every page.
  1. DRAWN = blunt strokes plus smudge tone. Meaning: the flour has not reached this yet.
  2. OUTLINE ONLY = a contour of blunt strokes with the inside left as bare paper.
     Meaning: the flour has settled ON this thing and covered it.
  3. SOLID BLACK MASS = filled in completely, the darkest thing on the page.
     🔴 THIS OCCURS ON ONLY TWO PAGES IN THE WHOLE BOOK - the bare circle of table top with the
     mouse standing in it, and the dog's muzzle at the door. Meaning: the flour never touched it.
  Nothing is ever half-shaded to suggest roundness. A thing is drawn, outlined, or solid.

FIVE FIXED MEASURING OBJECTS - the flour height is read against these and nothing else.
  In rising order: the low wooden chair (seat), the dough table (top), the shelf (with its
  twelve wicker proving baskets), the window sill, the ceiling beam. They stand in the SAME
  places in the room all book long and are drawn as the SAME objects every time. Whatever sits
  below the flour boundary is simply not drawn.

COMPOSITION: diagonals and tilts carry the slapstick. Do not centre the subject symmetrically
  except on the two pages that are deliberately circular. Big silhouettes, big empty paper -
  the reader must see in one glance which direction a paw, wing, cloth or hand came in from.
  🔴 Keep the bottom 18% of the image quiet and free of key subject matter (a caption band is
  laid over it later).

FINISH HIERARCHY - about how FINISHED each area is, NOT about opacity or focus.
  1. The animal that is about to sneeze = finished (strokes plus smudge, worked).
  2. What touches it on that page = half-finished (contour and one smudge pass).
  3. Everything else still above the flour = A LOOSE UNFINISHED SKETCH: a few open contour
     strokes, almost no tone, bare paper through it, corners of shapes left unclosed.
  4. Everything below the flour boundary = NOTHING. Not one mark.
  🔴 THE FLOUR IS NOT MIST, HAZE, FOG, STEAM, BLUR, DEPTH-OF-FIELD OR PALE GREY. Wherever the
  page instruction says an area is "gone", it means EXACTLY THIS: the marks stop. A soft grey
  veil laid over a finished drawing is the failure mode of this book.

CHARACTER DESIGN: eyes are DRAWN, not dotted - a large round eye with a SEPARATE upper-lid
  stroke over it and a SEPARATE short eyebrow stroke above that, so a face can squeeze shut,
  bulge and pop wide open. Cheeks visibly swell. Whiskers are single fast strokes that splay
  outward all at once. Bodies read as one blunt mass plus a tail. The silhouette must be
  legible at thumbnail size. Faces are built from the same fat stick as everything else - never
  rendered smoothly, never given a highlight dot or a glossy catchlight.

ANTHROPOMORPHISM GRADES (fixed): the mouse is BIPEDAL - it stands on hind feet and its front
  paws are hands. The cat is QUADRUPEDAL and never stands up; it reaches, presses and pins with
  ONE front paw while the other three stay on the ground. The sparrow uses only wings and beak,
  never hands. The dog is fully quadrupedal. The baker is a human adult whose head is about 1/6
  of his height and he never speaks.

SETTING: a French village bakery back room - a brick barrel oven with an iron door, a long
  scarred wooden dough table, a plain undyed sacking flour sack with two woven stripes and NO
  printing on it, three round sieves hung on the wall, an iron scraper, a long wooden peel,
  twelve wicker proving baskets in a row on a shelf, a low wooden chair, a small window onto a
  stone lane with shutters opposite, herb bundles on the ceiling beam, a door with a small bell.
  European, no Asian architectural motifs.

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT digital airbrush / NOT smooth gradients / NOT soft grey veils, mist, fog, haze or
  steam / NOT depth-of-field blur / NOT glossy 3D CG render / NOT cel-shaded anime / NOT a
  texture filter laid over flat digital colour / NOT photographic / NOT white or grey PAINT of
  any kind / NOT a fully rendered background / NOT every brick, roof tile, wood grain or wicker
  strand drawn to completion / NOT a uniform finish across the page / NOT any second accent
  colour / NOT orange before the oven is lit / NOT sound-effect letters, motion lines or speech
  marks / NOT any lettering, numerals, price tags, chalkboards, shop signs, sack printing or
  labels anywhere in the image / NOT wool felt, NOT stitched fabric, NOT sculpted clay
  (another line owns those).
```

### 🔴 이 앵커의 세 불변 규칙 (매 컷 반복 확인)

**규칙 A — `FLOUR:` 는 물리량이다.** 컷마다 이 줄이 ① 어느 기준물까지 잠겼나 ② 화면에서 맨 종이가 대략 몇 %인가를 못 박는다. 두 값은 서로를 검증한다 — 「선반까지 잠겼는데 맨 종이가 20%」면 그 컷은 틀렸다.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 · 5% | 의자 · 15% | 반죽대 · 30% | 선반 · 55% | 창턱 · 65% | 🔴 천장 · **80%** | 전부 · 88% | 전부(오븐이 되찾음) · 75% | 내려오는 중 · 55% | 🔴 **표면으로** · 70% | 표면 · 70% | 표면 · 65% |

**규칙 B — `INK:` 는 세 상태를 배당한다.** `그려진 것 / 윤곽만 / 꽉 채운 검정` 중 그 쪽에 무엇이 있는지. 🔴 **꽉 채운 검정은 p10 과 p12 에만 있다.** 다른 쪽에 순검정 덩어리가 하나라도 있으면 착지 두 개가 같이 죽는다.

**규칙 C — `EMBER:` 스케줄.** `none` 이면 화면에 주황이 **한 점도 없다.**

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 없음 | 없음 | 없음 | 없음 | 없음 | 없음 | 🔴 **문틈 한 줄(첫 등장)** | 🔴 **아가리 전체(최대)** | 사그라듦 | 반쯤 열린 문틈 | 식어 가는 잔불 | 거의 없음 |

---

## E-01 §3. 캐릭터 시트 (🔴 이것부터 굽는다 — BakeryKit 이 첫 번째다)

```
CHARACTER SHEET - BakeryKit   (bake this FIRST, before any character and any scene)

🔴 THIS IS NOT A SCENE. It is a plate of the five measuring objects and the props, drawn in the
  same medium as the book: thick black conte stick and finger-smudged tone on cool white
  cartridge paper #F2F2EF. No orange anywhere. No background.

THE FIVE MEASURING OBJECTS - draw each one alone, in this order, left to right, and put a small
  blunt tick mark on the height that the flour will reach:
  1. LOW WOODEN CHAIR - a plain country chair with a low back, four square legs, a rush seat.
     The tick is at the seat.
  2. DOUGH TABLE - a long heavy table, thick top, scarred surface, two square legs visible,
     one iron scraper resting on it. The tick is at the top edge.
  3. SHELF WITH TWELVE PROVING BASKETS - one long plank on two iron brackets, and on it TWELVE
     round wicker baskets in a single row, all the same size and shape. Draw all twelve; they
     will be counted later. The tick is at the underside of the plank.
  4. WINDOW - a small square window, four panes, plain wooden frame and a deep stone sill,
     one simple shutter hinge. The tick is at the sill.
  5. CEILING BEAM - one heavy squared beam with two bundles of dried herbs hanging from it.
     The tick is at the beam.
PROPS PLATE (smaller, below): three round sieves of different diameters, an iron dough scraper,
  a long wooden peel, a damp folded cloth, a plain undyed sacking flour sack with TWO woven
  stripes and no printing, its mouth torn open with flour spilling, a brick barrel oven with an
  iron door (drawn UNLIT, no orange), a small oil lamp drawn as a blunt black circle with the
  paper left bare all around it, a door with a small bell on a curled bracket.
🔴 THE LAMP AND THE FIRE: on this sheet the lamp's light is BARE PAPER, and the oven is dark.
  This sheet establishes that brightness is un-drawn paper.
🔴 EVERY OBJECT MUST BE RECOGNISABLE AGAIN LATER FROM ITS SILHOUETTE ALONE, because on most
  pages only its top edge will be visible above the flour.
SCENE tokens: use these names for the objects - Chair, DoughTable, ShelfTwelve, WindowSill,
  CeilingBeam.
```

```
CHARACTER SHEET - MouseSneeze   (bake this SECOND, before any scene)

🔴 THE SHEET IS DRAWN IN THE SAME MEDIUM AS THE BOOK. Thick black conte stick and finger-
  smudged tone on cool white cartridge paper #F2F2EF. The stick grain must be visible on the
  body, contours must be left open in places, and the face must be worked hardest. Do NOT
  render this character smoothly just because there is no background behind it. No orange.

FACE: 🔴 THIS FACE IS THE FUNNIEST THING IN THE BOOK AND IT MUST BE ABLE TO INFLATE. A large
  round eye, dark, with a SEPARATE upper-lid stroke over it and a SEPARATE short eyebrow stroke
  above that. The muzzle is two blunt strokes and a small triangular nose pressed dark. The
  mouth is one line that can stretch. Cheeks are bare paper so they can visibly SWELL - draw a
  second contour outside the first when they do. Six whiskers, single fast strokes, that splay
  straight outward all at once when the sneeze builds. No blush, no highlight dot, no catchlight.
BODY: one blunt rounded mass, roughly two and a half heads tall, smudged mid grey with the paper
  showing through the belly. Ears are two open circles, large for the head, and they flatten
  BACKWARD when the mouse holds a sneeze in. Bare pink is not available - ears are line and paper.
PAWS & TAIL: 🔴 front paws are HANDS - four fingers that grip. They are drawn darker than the
  body because the whole book has the mouse gripping its own nose with them. The tail is one
  long fast stroke that goes straight and stiff at the peak of a sneeze and curls when calm.
SIGNATURE DETAIL: 🔴 the mouse is the ONLY character in this book with no flour on it at any
  point - not one grain, on any page. Its coat stays the same smudged grey from p1 to p12.
  That is the whole ending, carried in the character design.
BUILD & SILHOUETTE: stands upright on hind feet; short legs, low round belly, big ears, stiff
  tail. Readable at thumbnail size against cat, sparrow, man and dog.
REFERENCE SHEET: full-body front idle standing on hind feet / three-quarter turn with both front
  paws clamped over its own nose / back view showing the stiff tail /
  five expression close-ups, all drawn large: (1) nose itching - one eye squinting, nose wrinkled,
  eyebrow up on one side / (2) holding it in - cheeks bulging with a second contour, eyes
  squeezed to slits, ears flat back, whiskers splayed / (3) the instant of the sneeze - mouth
  wide, eyes shut, whiskers straight out, head thrown back / (4) blank surprise - eye fully
  round, lid stroke high, mouth a small closed line (this is p10) / (5) clamping the nose again,
  eyes open and level (this is p11).
  Plain bare paper background, no scenery, no orange.
SCENE token: MouseSneeze.
```

```
CHARACTER SHEET - BakeryCat   (bake this THIRD)

🔴 SAME MEDIUM AS THE BOOK. Thick conte stick and smudge on cool white paper. No orange.

FACE: eyes DRAWN - a round eye with a separate upper-lid stroke and a separate eyebrow stroke,
  set wide, so the cat can look alarmed, resigned and appalled. Muzzle is two strokes; nose one
  small dark wedge; whiskers four fast strokes each side. No dot eye, no catchlight.
COAT: a heavy smudged dark mass, distinctly DARKER than the mouse so the two never confuse in
  silhouette. One bare-paper bib at the throat and bare-paper toes on one front foot - this is
  the foot it reaches with, and 🔴 ITS PAW PADS AND THE GAPS BETWEEN ITS TOES ARE WHERE FLOUR
  SHOWS as un-drawn paper (the failure of attempt one).
BUILD & SILHOUETTE: quadrupedal, long and low, heavy shoulders, thick tail carried low. 🔴 IT
  NEVER STANDS ON TWO LEGS anywhere in this book. Its one recognisable action is a single front
  paw stretched far out while the body leans away.
REFERENCE SHEET: full-body side view standing on four feet / three-quarter view with ONE front
  paw stretched right out and the body pulled back, head forward / a large detail of that paw
  from underneath, showing the pads and the un-drawn paper caked between the toes /
  three expression close-ups: urgent (eyes wide and round, lids high, ears forward),
  eyes-screwed-shut-and-turned-away (this is the cloth page), flat resignation (eyes half
  lidded, ears sideways, mouth one long line - this is p10).
  Plain bare paper background, no scenery.
SCENE token: BakeryCat.
```

```
CHARACTER SHEET - BakerSparrowDog   (bake this FOURTH - three supporting characters on one plate)

🔴 SAME MEDIUM AS THE BOOK. Thick conte stick and smudge on cool white paper. No orange.
🔴 ALL THREE MUST BE DISTINGUISHABLE FROM EACH OTHER AND FROM THE MOUSE AND CAT IN SILHOUETTE
  ALONE, because on several pages a paw, a wing and a hand come in from three sides at once.

SPARROW: a small round bird, one blunt smudged mass, two open wings drawn as four or five fast
  strokes each - not feather by feather. Eyes DRAWN: small round eye with a separate lid stroke
  and a separate brow stroke, so it can look determined and then defeated. Beak is one wedge,
  clamped shut. 🔴 It uses only wings and beak; it never has hands. Tail is a short fan of
  three strokes that spreads downward on the downbeat.
  Poses: hovering with both wings driving down / perched on the beam with wings folded /
  wings spread flat above something as a shield (this is p8).

THE BAKER: a human adult man. 🔴 HEAD IS ABOUT 1/6 OF HIS TOTAL HEIGHT - he is a full-grown
  man, tall and heavy, not a child and not a caricature toddler. Broad shoulders, thick
  forearms, sleeves rolled above the elbow, a plain apron tied twice with NO printing on it,
  cloth trousers, wooden-soled shoes. Face: eyes DRAWN with separate lid and brow strokes, a
  blunt nose, a heavy jaw, short cropped hair, no moustache. 🔴 HIS MOUTH IS CLOSED IN EVERY
  SINGLE DRAWING - he never speaks in this book, so his whole performance is eyes, eyebrows,
  shoulders and hands.
  Poses: both arms flung wide and frozen / both hands shoving a window frame apart, body leaning
  back, apron and hair blown inward / one forearm crossing his own face, backing away /
  standing with arms hanging down, eyebrows up, mouth shut (this is p10).
  🔴 On p10 he is covered in flour from apron to eyebrows - draw that as OUTLINE ONLY with the
  paper bare inside, exactly as the rule requires. Do not paint him white.

BIG DOG: a large heavy dog. 🔴 ONLY THE FRONT OF ITS FACE IS EVER SEEN in this book, so draw
  that face large: a broad muzzle, a wet nose drawn as the darkest solid mass on the plate, one
  deep wrinkle across the bridge, nostrils flared, loose jowls, one ear pricked. Eyes DRAWN with
  separate lid and brow strokes, half in frame. Also draw one front paw with its pad, and one
  print that paw leaves.
  🔴 THE MUZZLE IS DRAWN AS A SOLID FILLED BLACK MASS - it is one of only two solid black
  things in the whole book. Establish that value here.
SCENE tokens: SparrowHelp, BakerMan, BigDog.
```

---

## E-01 §4. 12컷

각 컷은 `STYLE ANCHOR + 규칙 A·B·C + @image1(BakeryKit) + @image2(MouseSneeze) + 필요한 조연 시트 + 아래 블록` 으로 합성한다.

### p1 — 문 열기 전, 코가 간질간질했다 🔴 밀도 배급 1/2
```
CAMERA: medium close-up, low angle taken at the height of the flour sack. The ridge of the torn
  sack cuts the frame horizontally and the mouse stands on top of it, centre.
WHO: MouseSneeze alone. No other character.
SUBJECT: MouseSneeze stands on two hind feet at the torn mouth of the sack, both front paws
  clenched together in front of its chest. Its nose is lifted, the bridge wrinkled, one eyebrow
  stroke up. Eyes half closed, mouth opening. The tail runs straight back, stiff.
SETTING: the bakery back room before opening. Flour spilled from the torn sack, the DoughTable
  with the iron scraper on it, the three sieves on the wall, the brick oven UNLIT with its iron
  door ajar, the Chair, the ShelfTwelve with all twelve baskets empty, the WindowSill with the
  lane dark beyond, the CeilingBeam with two herb bundles.
🔴 DENSITY PAGE 1 OF 2: this is the only page where all five measuring objects are visible at
  once, so the reader learns the room. Spend the density on PROPS ONLY - the three sieves, the
  scraper, the twelve baskets, the chair, the sack. Do NOT draw brick courses, wood grain or
  ceiling joists.
FLOUR: 0. Only one very thin single layer of grains in the air, drawn as about a dozen separate
  conte specks near the lamp. Nothing is submerged. Bare paper about 5% of the frame.
INK: everything is DRAWN (strokes plus smudge). There is no outline-only object and 🔴 NO SOLID
  BLACK MASS anywhere on this page.
EMBER: none. The oven is not lit.
FINISH: MouseSneeze finished. The torn sack it stands on half-finished. The far wall, the door
  and the lane are rough open strokes.
TONE: the only light is the small oil lamp beside the oven. 🔴 DRAW THE LAMP AS A BLUNT BLACK
  CIRCLE WITH THE PAPER LEFT COMPLETELY BARE AROUND IT - the light is un-drawn paper, not paint,
  and this page is where that rule is established. The window is smudged darkest. Quiet; nothing
  has happened yet.
```

### p2 — 밀가루가 의자 높이까지 (앞발에도 가루가 묻어 있었다)
```
CAMERA: medium, eye level at table height. 🔴 The flour boundary runs straight across the frame
  and sits EXACTLY level with the seat of the Chair.
WHO: MouseSneeze + BakeryCat.
SUBJECT: LEFT - BakeryCat on all four feet, one front paw stretched right out to press the
  mouse's nose flat, body pulled back, neck forward, eyes wide and round, lids high, ears
  forward. CENTRE - MouseSneeze with its nose squashed under that paw, eyes screwed shut, both
  front paws gripping the cat's wrist. Where paw and nose meet, a small puff of separate conte
  specks lifts.
SETTING: DoughTable top with flour marks, the Chair with its legs already gone below the
  boundary, ShelfTwelve above with all twelve baskets in a row, the three sieves.
FLOUR: risen to the CHAIR SEAT. The chair's four legs are not drawn at all; the seat and the low
  back are drawn. Bare paper about 15%. 🔴 The cat's paw pads and the gaps between its toes are
  bare paper - that is the caked flour, and it is the reason attempt one fails.
INK: MouseSneeze and BakeryCat are DRAWN. Nothing is outline-only yet. No solid black mass.
EMBER: none.
FINISH: both animals finished. The cat's outstretched paw half-finished with one smudge pass.
  Table, shelf, baskets and sieves are rough open strokes only.
TONE: light still comes from the lamp low on the right; the smudge tone is heaviest along the
  bottom of the frame and thins upward so the height reads.
```

### p3 — 탁자 높이까지 (날갯짓이 오히려 띄운다)
```
CAMERA: wide, eye level. 🔴 The flour boundary is level with the DOUGH TABLE TOP, and the
  sparrow's wings are churning a spiral up out of it.
WHO: MouseSneeze + BakeryCat + SparrowHelp.
SUBJECT: UPPER RIGHT - SparrowHelp hovering, both wings driving hard downward, beak clamped,
  brow stroke low and determined, tail fan spread down. LOWER CENTRE - MouseSneeze standing on
  the table top, both front paws clamping its own nose from either side, cheeks bulging with a
  second contour outside the first, eyes bulging, up on tiptoe. LEFT - BakeryCat has retreated a
  step, one paw raised off the ground, frozen, ears sideways.
SETTING: the open WindowSill on the left with a few sparrow footprints on it, the DoughTable,
  ShelfTwelve above with twelve baskets, the Chair now showing only its back rail above the
  boundary.
FLOUR: risen to the DOUGH TABLE TOP. 🔴 Two measuring objects are now submerged (Chair - only
  the top rail is drawn; table - only the top edge and what stands on it). Where the sparrow
  beats, the boundary is dragged upward into two doughnut-shaped curls of separate conte specks.
  Bare paper about 30%.
INK: all three animals DRAWN. Nothing outline-only. No solid black mass.
EMBER: none.
FINISH: the three animals finished. The window frame the sparrow came through half-finished.
  Shelf, baskets, sieves and the far wall are rough open strokes; below the boundary, nothing.
TONE: first morning light comes in the window as BARE UN-DRAWN PAPER cutting diagonally across
  the room. Not a painted beam. The action is packed into the top half of the frame.
```

### p4 — 선반 높이까지 (참을수록 더 근질거렸다)
```
CAMERA: extreme close-up, straight-on eye level. MouseSneeze's face fills nearly the whole frame.
WHO: MouseSneeze alone in frame.
SUBJECT: 🔴 THIS IS THE FUNNIEST DRAWING IN THE BOOK - work it hardest. Both front paws clamp
  the nose from either side but the bridge has swelled up BETWEEN them, pushed out past the
  fingers. Eyes squeezed to slits with two crease strokes at each corner. Cheeks bulging, drawn
  with a second contour outside the first. Ears flattened straight back. All six whiskers splayed
  rigidly outward. A few separate conte specks stuck around the nostril rim.
SETTING: almost nothing. 🔴 CORRECTION TO THE SCRIPT - the script says "background is blurred";
  in this book that means THE MARKS STOP. Draw the underside edge of ShelfTwelve as one long
  stroke and the top arcs of the twelve baskets as twelve short strokes sitting just above the
  flour boundary. Nothing else. No blur, no grey veil.
FLOUR: risen to the SHELF UNDERSIDE. 🔴 Three measuring objects submerged (chair gone entirely,
  table top gone, shelf plank submerged so only the baskets standing on it are drawn). Bare
  paper about 55%, and the reason is the flour, not the crop.
INK: MouseSneeze DRAWN and worked. The twelve basket arcs are rough strokes. No outline-only,
  no solid black mass.
EMBER: none.
FINISH: the face is the only finished thing on the page. The paws touching it are half-finished.
  Everything else is either one rough stroke or nothing.
TONE: no directional light effect. The value of the face is built by finger smudge, darkest
  around the squeezed eyes and the pressed nose, so the force gathers at the centre of the face.
  A held, frozen instant.
```

### p5 — 창문 높이까지 (열어 준 창으로 바람이 들어왔다)
```
CAMERA: wide, low angle. The open window is on the right, and a wall of flour is shoved leftward
  across the frame - the composition runs right to left with the wind.
WHO: MouseSneeze + BakeryCat + BakerMan.
SUBJECT: RIGHT - BakerMan frozen with both hands shoving the two window casements apart, body
  leaning back, apron hem and hair blown inward, MOUTH SHUT, eyes wide, eyebrows high. CENTRE -
  MouseSneeze skidding two steps backward on the table top, its tail hooked around the table
  edge to hold on, nose tipped up. LEFT - BakeryCat crouched low, ears flat, eyes narrowed.
SETTING: the open WindowSill with the stone lane and the opposite shutters beyond, the three
  sieves on the wall all swung to one side, an apron on its hook lifted horizontal, the
  DoughTable.
FLOUR: risen to the WINDOW SILL. 🔴 Four measuring objects submerged (chair invisible, table top
  gone, shelf gone with the baskets now only just showing their top arcs, sill level). Along the
  window the boundary curls upward like a lifted curtain, drawn as a torn ragged edge of specks.
  Bare paper about 65%.
INK: all three DRAWN. No outline-only, no solid black mass.
EMBER: none.
FINISH: MouseSneeze and BakerMan's two hands on the casements finished. The window frame
  half-finished. The lane, the shutters, the sieves and the apron are rough open strokes.
TONE: 🔴 the light coming in the open window is BARE UN-DRAWN PAPER, a hard-edged wedge running
  from right to left. Inside the room the smudge tone is heavier than anything visible outside,
  so indoors reads thicker than outdoors.
```

### p6 — 천장까지 (행주 위에도 소복소복) 🔴 이 책의 기준판
```
CAMERA: medium, slightly high angle. One small covered lump in the centre of the frame and
  almost nothing else.
WHO: MouseSneeze (hidden) + BakeryCat + BakerMan.
SUBJECT: CENTRE - a damp cloth thrown over the mouse, so MouseSneeze is not visible at all: only
  a bulging dome of cloth with its folds drawn, swelling upward, and beneath the hem the tail tip
  and two hind feet sticking out, toes spread hard. LEFT - BakeryCat pinning one corner of the
  cloth with a front paw, face turned away, eyes screwed shut. UPPER RIGHT, very small -
  BakerMan standing with both arms wide, stopped, mouth shut.
SETTING: 🔴 CORRECTION TO THE SCRIPT - the script says the air is so thick that up and down
  disappear. In this book that means THERE ARE ALMOST NO MARKS ON THE PAGE. Draw the CeilingBeam
  as one long stroke with two herb bundles hinted, and the top arcs of a few baskets. Nothing
  else exists.
FLOUR: risen to the CEILING BEAM - the top of the room. 🔴 All five measuring objects are at or
  below the boundary. Bare paper about 80%, THE MAXIMUM IN THE BOOK. This page is the reference
  plate for the whole anchor: if a soft grey veil appears here instead of bare paper, the book
  has failed.
INK: the cloth dome and the two hind feet are DRAWN, and they are essentially the only drawn
  things. On the cloth's upper folds the strokes THIN OUT and stop, because flour has settled
  there - the top of the cloth is bare paper inside its own contour. No solid black mass.
EMBER: none.
FINISH: the cloth dome and the feet finished. The cat's pinning paw half-finished. Everything
  else is one stroke or nothing.
TONE: no directional light at all; the page has no gradient. Value exists only in the cloth.
  Every eye goes to the one bulging lump because it is the only thing drawn.
```

### p7 — 온통 하얀 빵집 🔴 오븐에 불이 들어온다
```
CAMERA: wide full shot, eye level. The whole workroom, and the figures read as outlines only.
WHO: MouseSneeze + BakeryCat + BakerMan + SparrowHelp.
SUBJECT: CENTRE - MouseSneeze standing alone in the middle of the table top, the thrown-off
  cloth at its feet, front paws at its sides, eyes shut, nose lifted, chest swelling. LEFT -
  BakeryCat crammed under the table, one paw over its own nose. RIGHT - BakerMan backing away
  with a forearm across his face. TOP - SparrowHelp settled on the beam with wings folded.
SETTING: the ShelfTwelve with all twelve baskets, each one now holding a domed risen dough. The
  brick oven's iron door with a thin line of fire showing at the joint. The three sieves, the
  scraper. Floor ankle-deep, therefore not drawn.
FLOUR: everything. 🔴 Bare paper about 88%. 🔴 CORRECTION TO THE SCRIPT - "distant things
  dissolve" does NOT mean atmospheric fade. Distance is irrelevant here: what is drawn is only
  what stands above the flour, and it is drawn with open contour strokes, not softly.
INK: 🔴 THIS IS THE FIRST OUTLINE-ONLY PAGE. MouseSneeze is still DRAWN (it has no flour on it,
  ever). Everything else that is visible - the cat, the man, the sparrow, the twelve baskets,
  the sieves - is OUTLINE ONLY, contour strokes with bare paper inside. No solid black mass.
EMBER: 🔴 FIRST APPEARANCE. One thin line of orange #E07A2C at the joint of the closed iron oven
  door, and nothing else. It is small, and it is the ONLY thing on the page that was coloured in
  rather than left as paper. 🔴 Do not give it a glow, halo or bloom - it is a painted line.
FINISH: MouseSneeze finished. The cloth at its feet half-finished. All others outline only, the
  room barely stroked.
TONE: no gradient. The page is almost entirely bare paper with an outline drawing floating in it
  and one small orange line. Held breath.
```

### p8 — 막으려 뻗은 손이 오븐 문을 건드렸다 🔴 주황 최대
```
CAMERA: dynamic wide, tilted axis. The heat drives diagonally from the oven mouth at the right
  to the mouse at the left.
WHO: MouseSneeze + BakeryCat + SparrowHelp + BakerMan.
SUBJECT: LEFT CENTRE - MouseSneeze held from three sides, body bowed backward like a drawn bow,
  mouth wide open, nose to the ceiling, tail whipped straight and stiff. Around it: BakeryCat's
  paw from the left, SparrowHelp's spread wings from above, BakerMan's two hands from the right.
  RIGHT - BakerMan's bent elbow just grazing the oven door handle, and 🔴 HIS EYES ARE ON THE
  MOUSE, NOT ON THE OVEN - he does not know what his elbow is doing. Mouth shut.
SETTING: the oven's mouth thrown wide open, the long wooden peel leaning on the wall, the
  DoughTable.
FLOUR: everything, except 🔴 THE OVEN HAS TAKEN SOME BACK - the blast of heat has physically
  cleared the flour in front of the mouth, so the bricks, the door and the floor near the oven
  ARE DRAWN again, in a widening wedge along the diagonal. Bare paper drops to about 75%. Along
  the edge of that wedge the boundary is pushed up into a wave.
INK: MouseSneeze DRAWN and worked hardest. The oven mouth and the bricks around it DRAWN (the
  heat cleared them). Cat, sparrow, man are OUTLINE ONLY. No solid black mass.
EMBER: 🔴 MAXIMUM. The whole open mouth of the oven is orange #E07A2C going to #B8481B in the
  depth, and the brick immediately inside the arch is orange. It is the strongest thing on the
  page and the only saturated colour in the book. 🔴 No glow, no bloom, no lens flare, no light
  rays - it is a filled painted shape with a hard edge, and the room around it is NOT tinted.
FINISH: MouseSneeze and the oven mouth finished. The three reaching limbs half-finished. The
  peel and the far wall rough strokes.
TONE: every stroke on the page - the wave in the flour, the reaching limbs, the tilt of the
  frame - converges on the mouse's nose. The orange sits opposite it, at the other end of the
  diagonal.
```

### p9 — 반죽 열두 개가 하나씩 주저앉았다
```
CAMERA: medium close-up, low angle from beneath the shelf, looking up along the row of proving
  baskets. The order of collapse reads left to right.
WHO: no characters. Only the dough.
SUBJECT: TWELVE wicker baskets in one row. 🔴 COUNT THEM AND MAKE THEM COUNTABLE - all twelve
  the same size and shape, evenly spaced, so the reader can tally. The ones on the left have
  already sunk, their tops dished inward. The ones in the middle are sinking now, their surfaces
  creased with fine wrinkles. 🔴 ONLY THE FURTHEST RIGHT ONE IS STILL DOMED.
SETTING: the underside of the shelf plank and its two iron brackets, a heap of fallen flour on
  the floor beneath.
FLOUR: coming down. Separate conte specks fall in vertical trails across the whole frame like
  rain. Bare paper about 55% and shrinking as the room comes back.
INK: 🔴 the twelve baskets are OUTLINE ONLY with bare paper inside (they are covered in flour) -
  and the collapse is read from the CONTOUR of each top, not from shading. On the sunken ones the
  cracked flour surface is drawn as a few short strokes radiating from the dish. The shelf plank
  is DRAWN again (the flour has fallen off it). No solid black mass.
EMBER: dying. A narrow band of orange remains inside the oven mouth at the far edge of frame,
  smaller than on p8.
FINISH: the twelve basket rims finished enough to count. The shelf plank half-finished. Nothing
  else on the page.
TONE: the falling trails run vertically through the frame; the left of the frame carries more
  smudge and the right is barer, so the eye travels to the last dome still standing. A slow
  rhythm after the noise.
```

### p10 — 자기 자리만 동그랗게 까맣다 🔴 밀도 배급 2/2 · 순검정 1/2
```
CAMERA: high overhead looking straight down at the dough table top. A circular composition with
  MouseSneeze at the exact centre of the circle.
WHO: MouseSneeze + BakeryCat + SparrowHelp + BakerMan.
SUBJECT: DEAD CENTRE - MouseSneeze on two feet, head turning to look around, eye fully round
  with the lid stroke high, mouth a small closed line, front paws hanging. 🔴 THERE IS NOT ONE
  GRAIN OF FLOUR ON IT - it is drawn exactly as on p1. At the frame edges: BakeryCat sitting,
  covered to the tail tip; SparrowHelp hunched on the beam; BakerMan standing with arms down,
  eyebrows up, mouth shut.
SETTING: the table top with the three sieves, the scraper, the peel and the twelve collapsed
  baskets scattered around, all of them settled under flour.
🔴 DENSITY PAGE 2 OF 2: spend it on PROPS ONLY, and make them countable - three sieves, one
  scraper, one peel, twelve baskets. Do NOT draw wood grain, brick or joists.
FLOUR: 🔴 THE STATE CHANGES ON THIS PAGE. There is no flour in the air any more; it has all
  landed ON things. Bare paper is still about 70% of the frame, but now that white is INSIDE
  CONTOURS instead of open field.
INK: 🔴 THE WHOLE GRAMMAR IS ON DISPLAY HERE, READ THIS TWICE.
  - OUTLINE ONLY (bare paper inside): the cat, the sparrow, the man, the three sieves, the
    scraper, the peel, the twelve baskets, the whole table surface. Everything the flour landed
    on has come back as a contour with nothing inside it.
  - 🔴 SOLID BLACK MASS (the first of only two in the book): the circle of table top around the
    mouse, where the flour was blown clear. Fill it completely with the darkest black in the
    book, so the exposed wood reads as a solid dark disc, and draw a raised rim of pushed-aside
    flour around its circumference as a ragged contour. MouseSneeze standing inside it is also
    fully DRAWN.
  Nothing on this page is half-shaded.
EMBER: a small orange line at the half-open oven door at the frame edge, cooling.
FINISH: MouseSneeze and the black disc finished. The props outline only. Nothing beyond them.
TONE: the page is bright and almost even, with one dark disc at the exact centre. The eye drops
  straight into it. A blank, stunned quiet.
```

### p11 — 아무도 크게 숨 쉬지 않았다
```
CAMERA: wide, straight-on eye level. Four figures standing still in a row across the frame,
  close to symmetrical.
WHO: MouseSneeze + BakeryCat + SparrowHelp + BakerMan.
SUBJECT: CENTRE - MouseSneeze on the table, both front paws clamped firmly over its own nose,
  eyes open and level, body locked. LEFT - BakeryCat sitting, one paw pressed to its own nose,
  only the very tip of its tail curled. TOP - SparrowHelp with its beak tucked under a wing.
  RIGHT - BakerMan with one hand over his own nose and mouth, the other arm flat at his side.
  🔴 ALL FOUR ARE LOOKING AT THE SAME POINT IN THE AIR, NOT AT EACH OTHER.
SETTING: the whole workroom under flour, the twelve collapsed baskets, the oven door half open
  and cooling, the window still wide open.
FLOUR: settled. Five separate conte specks still hang in the air, very high in the frame,
  drifting - they are the only thing telling the reader that time is passing. Bare paper about 70%.
INK: MouseSneeze DRAWN. 🔴 Everything else OUTLINE ONLY. No solid black mass on this page - the
  bare circle from p10 is out of frame or seen edge-on as a thin dark line, not a filled disc.
EMBER: a faint orange line inside the half-open oven, the last of it.
FINISH: MouseSneeze finished; its clamped paws half-finished. The other three outline only. The
  room barely stroked.
TONE: movement has stopped completely and the page reads like a photograph. No gradient, no
  directional light. Everyone is watching one point, so nobody moves. A page waiting to go off.
```

### p12 — 개의 코가 씰룩였다 🔴 순검정 2/2
```
CAMERA: close-up, low angle. The right of the frame is filled by the door gap and the dog's
  muzzle; far away at the left, four small figures stand frozen.
WHO: BigDog (foreground) + MouseSneeze, BakeryCat, SparrowHelp, BakerMan (far background).
SUBJECT: RIGHT FOREGROUND - the front of BigDog's face, large. Its muzzle is pushed in through
  the half-open door, the wet nose tipped up, one deep wrinkle across the bridge, nostrils
  flared, a few separate conte specks being drawn in toward them. One eye is half in frame with
  its lid and brow strokes; one ear is pricked. 🔴 DO NOT DRAW A SNEEZE - the mouth is closed,
  nothing has happened yet. The book ends one beat early.
  FAR LEFT, small - MouseSneeze, BakeryCat, SparrowHelp and BakerMan in exactly their p11 poses,
  all four staring at the dog's nose.
SETTING: the small bell on the door still swinging, two dog paw prints on the floor inside the
  door, the flour-covered workroom and the collapsed doughs behind.
FLOUR: settled on everything, and a thin skim of specks lifting off the floor where the outside
  air came in. Bare paper about 65%.
INK: 🔴 SOLID BLACK MASS (the second and last in the book): BigDog's muzzle and nose are filled
  in completely with the darkest black, at exactly the same value as the disc on p10 - hold p10's
  approved render alongside while drawing this. That is what says the flour has not touched it
  yet. 🔴 CORRECTION TO THE SCRIPT - the four figures at the left are not "softly out of focus";
  they are OUTLINE ONLY. The difference between foreground and background here is FILL, not
  focus. The door frame and the bell are half-finished; the room behind is bare.
EMBER: none, or a single almost-black orange fleck at the cold oven. The fire is out.
FINISH: the dog's muzzle finished and filled. The door edge and bell half-finished. The four
  figures outline only. Nothing else drawn.
TONE: the weight of the page sits hard on the right and the left is nearly empty paper, so the
  reader leans into the next moment. No sound has been made. One beat, and stop.
```

---

## 첫 렌더 검수 체크리스트 (6항목)

1. 🔴 **밀가루가 「흐림」으로 나왔나** — 뿌연 회색 베일·안개·스팀·피사계심도 블러·저채도 필터 중 하나라도 있으면 실패다. 이 앵커의 전부가 무너진다. 정답은 **획이 하나도 없는 맨 종이 + 하드한 수평 경계**. 문구를 늘리지 말고 **p6 승인본을 ref 로 못 박아라**(§2.3 · §5.1 교훈).
2. 🔴 **기준물 다섯이 매 쪽 같은 물건인가** — 의자·반죽대·선반(바구니 열둘)·창턱·들보. 쪽마다 다른 가구가 나오면 아이가 높이를 못 재고, 누적 엔진이 통째로 사라진다. 어긋나면 **BakeryKit 시트를 다시 굽는다**(장면 프롬프트를 고치지 마라).
3. 🔴 **꽉 채운 순검정이 두 곳보다 많나** — p10 의 원(+생쥐)과 p12 의 개 코. 오븐 안 어둠·창밖 밤·눈동자·고양이 몸이 순검정으로 채워져 있으면 착지 두 개가 같이 죽는다. 어둠은 전부 **문지른 회색**이다.
4. 🔴 **주황이 p6 이전에 있나** — 등불·아침 창빛·햇살이 주황이면 p7 의 점화가 사건이 아니게 되고, 「밝음은 안 그린 자리」 규칙도 첫 쪽에서 깨진다. 등불의 밝음은 **콩테 원 둘레의 맨 종이**다. 그리고 p8 의 불이 **글로우·후광·광선**을 가졌으면 다시 굽는다(칠한 도형이어야 한다).
5. 🔴 **얼굴이 매끈한 CG 로 회귀했나**(§2.4 최대 실패 모드) — 특히 p4. 볼이 부풀지 않거나 수염이 정렬돼 있으면 **MouseSneeze 시트를 다시 굽는다.** 이 책에서 가장 웃긴 그림이 안 웃기면 E 주제군을 배정한 이유가 없어진다.
6. 🔴 **근접 3권과 나란히 놓고 본다** — ① **h01**(같은 프랑스 빵집): 하나는 테두리 없는 텅 빈 흰 책, 하나는 테두리 있는 꽉 찬 버프 책인가. 닮아 보이면 e01 의 맨 종이 비율을 더 올린다. ② **c01**(갈색 종이 + 불투명 흰): 흰 것이 「얹은 물감 ↔ 안 그린 종이」로 갈렸나. ③ **a04**(회백지 흑연 + 앰버): 획이 「가는 눌러 그은 선 ↔ 굵은 뭉툭한 스틱」으로 갈렸나.
</content>
</invoke>
