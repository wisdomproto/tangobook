# 창작동화 1000 — G-01 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`(§2.1 · §2.3 · §2.4 · §2.7 · §2.8 · §2.9 · §2.11 · §2.14 · §7.1~7.5), 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/g01.md`.** 아래 12컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다. 새로 발명한 장면 없음.
> 🔴 **이미지 생성은 이 문서가 하지 않는다.** 사용자가 직접 굽는다.
> 🔴 **작가 실명은 한 글자도 안 들어간다** — 근거 후보 id 는 §1 판정 표에만 남기고 프롬프트는 전부 문구다.

## 0. 실행 순서 (어기면 인물만 매끈한 CG 로 나온다 — §2.4 · §2.14)

1. 🔴 **`LayerKit`(재료 시트)을 가장 먼저 굽는다.** 캐릭터보다 먼저다 — §2.14 대로 **물성이 정체인 앵커에서는 재료 시트가 캐릭터 시트보다 먼저**다. 이 권의 정체는 「어둠 = 겹의 개수」이고, 겹의 값 계단과 엣지 생김새가 확정되지 않으면 열두 쪽의 어둠이 전부 다른 어둠이 된다.
2. 그다음 시트 3장. 순서 = `HedgeKit` → 🔴 `UnderThing`(**무엇을 그리면 안 되는지를 정의하는 시트**) → `RoomKit`(무대 기준물).
3. 시트가 승인되면 `@image1`(LayerKit) · `@image2`(HedgeKit) · `@image3`(UnderThing) · `@image4`(RoomKit)를 붙여 컷을 뽑는다.
4. 🔴 **굽는 순서 = p2 → p1 → p9 → 나머지 여덟 → p12 는 맨 마지막에 p1 승인본을 ref 로.**
   - **p2** = 🔴 **1겹의 기준판**(낮). 이 책에서 가장 밝고 가장 심심한 쪽이고, **여기가 안 심심하면 밤이 안 무섭다.**
   - **p1** = 2겹 / 5겹의 기준판. 화면 한가운데를 가르는 하드 엣지가 여기서 정해진다.
   - **p9** = 🔴 **6겹의 기준판**(최암) + 호박 눈 두 점. 그라데이션이 여기서 새면 나머지 열한 장도 그렇게 나온다.
   - **p12** = p1 과 같은 판 구성이다. 🔴 **거울이 아니라 같은 판을 다시 쓰는 것**이므로 좌우 반전 금지, p1 승인본을 ref 로 붙여 마루 위 자국 둘과 구슬만 더한다.
5. 승인 렌더 3장을 앵커 ref 슬롯에 넣는다 — 🔴 **인물 컷 1(p2) · 어둠이 겹의 계단으로만 이루어진 컷 1(p9) · 전체 장면 1(p1)**. 3장이 전부 밤 컷이면 「낮은 1겹이라 심심하다」가 영영 안 먹는다(점눈이에서 실제로 겪은 일, §2.7 보정).
6. 앵커 이름은 **렌더를 보고 짓는다**(§7.5-3). 지금은 슬러그만: `changjak-g01`.

---

# G-01 「침대 밑에 사는 것」

주제군 **G 용기·두려움** / 엔진 **오해와 반전** / 무대 영국 아이방 / 주인공 새끼 고슴도치 + 침대 밑의 것(끝까지 다 보이지 않음) / **12스프레드** · 후렴 「사각, 사각」 **p1·p12 두 번만**

## G-01 §1. 앵커 배정

**한 줄**: 🔴 **어둠은 안 칠한 자리가 아니라 겹쳐 붙인 자리다.** 같은 회청 질감판을 한 겹 더 얹을 때마다 값이 한 단 내려가고 아래가 덜 보인다. 침대 밑은 이 책에서 겹이 가장 많은 곳이라 **끝까지 판독되지 않고**, 빛은 판이 비켜 간 **0겹**이다. 앵커 슬러그 `changjak-g01` — **신규 민팅** (🔴 **C9 셋째**, f05·d01 과 공정이 다르다).

### 이 권이 그림에 요구하는 것 (판정의 전제 — 후보는 이 여섯을 통과하는지로만 봤다)

1. 🔴 **침대 밑은 안 보인다 — 그게 장치다.** 그리고 대본 note 가 「p12 에서 침대 밑은 한 번도 다 보이지 않는다」고 못 박았다. 즉 **끝까지** 안 보여야 하므로, 매체가 「안 보임」을 **적극적으로 만들 수 있어야** 한다. 안 그리면 그냥 빈 곳이고, 그리면 이 책이 끝난다.
2. 🔴 **같은 공간을 정확히 반대로 두 번 그린다.** 낮(p2)엔 구석까지 다 보이고 밤(p1·p5·p8)엔 침대 다리 앞에서 끊긴다. 대본이 「p2 와 p5·p8 은 같은 공간을 정확히 반대로」라고 적었다 — **어둠과 밝음이 같은 자로 재어져야 한다.**
3. 🔴 **문틈 빛 한 줄이 침대 다리 앞에서 딱 멈춘다**(p5). 부드럽게 잦아드는 게 아니라 **끊긴다.** 그리고 그 끊긴 한 점이 화면의 전부다.
4. 🔴 **두 영역이 서로 침범하지 않는다**(p11 톤: 「어느 쪽도 상대를 침범하지 않는다」). 밝은 쪽과 어두운 쪽이 화면을 반씩 나누고 경계가 곧게 서 있어야 한다.
5. 🔴 **가시가 감정계다.** 표정도 필요하지만(눈을 크게 뜨고·질끈 감고·시들함) 대본은 두려움을 **곤두선 가시가 이불을 밀어 올리는 모양**으로 쓴다. 가시가 셀 수 있는 획이어야 한다.
6. 🔴 **침대 밑의 것은 한마디도 하지 않는다.** 그림도 그것을 설명해선 안 된다. 그러면서도 **「구슬을 가지고 놀던 것」**임이 독자에게 전달돼야 한다 — 대사도 형태도 없이.

### 후보 3

| | 후보 ① **C9 ② · 찍은 무지 질감판을 겹쳐 붙인다** (`teckentrup-samesky` · `carlin-kingsky`) | 후보 ② C3 프린트-크래프트(밤) (`rogaar-lucy`) | 후보 ③ C6 검정 바탕 (`watanabe-kintsugi`) |
|---|---|---|---|
| 매체 | 스폰지·롤러로 찍은 회청 무지 질감지를 오려 겹쳐 붙임 + 인물만 마른 연필선 | 리소·스크린 잉크판, 밤 장면 | 검정 판에 불투명 담색 얹기 |
| 이 권에 맞는 이유 | 🔴 요구 1·2·3·4 를 **한 공정이 동시에** 해결한다 — 어둠은 **쌓은 것**이라 적극적으로 만들어지고(1), 낮은 **1겹**이라 같은 자로 재어지고(2), 빛은 **판이 비켜 간 0겹**이라 종이 끝에서 물리적으로 끊기고(3), 두 영역이 **각각 다른 종이**라 침범이 원천 불가하다(4) | G 주제군 1순위. 밤·소리·반복 리듬이 이 클러스터의 정서다 | G 주제군 2순위. §7.3 이 **검정 바탕을 G 에만 허용**해 뒀다 |
| 리스크 | AI 가 콜라주를 질감 오버레이·사진으로 뭉갠다(§7.3 명시) → 🔴 **재료 시트(LayerKit)를 가장 먼저 굽는 것**이 그 처방이다(§2.14) | — | — |
| 판정 | ✅ **추천** | 탈락 — ① C3 이 이미 셋(a11·c60·e03) ② 🔴 결정적: **새김·인쇄는 선이라 「겹의 개수」를 못 만든다.** 어둠이 해칭이 되면 낮과 밤이 같은 「선 밀도」의 문제가 되어 요구 2 의 정반대 대비가 사라진다 ③ c60 이 이미 「덮는 판」을 썼다(§2.9 변형 ④) | 탈락 — 🔴 **g88 이 정확히 그것이다**(검정 판 + 담색 빛 얹기). 같은 주제군 G 에서 **어둠 처리가 겹치면 두 권이 같은 책**이다. 더해서 이 권의 낮 쪽(p2)이 「밝고 평평하고 심심하게」인데 검정 판 앵커는 그 쪽을 못 그린다 |

추가 탈락: **C7 스케일 공포**(G 3순위 `pinfold-blackdog`) — `finish` 가 **전면 균일 마감**이라 어둠 속 돌·먼지·형태를 다 그려 버린다(§7.10 에서 같은 이유로 탈락). 그리고 C7 이 이미 둘(e09·b09)이며, **e09 가 같은 밤·잠자리 책**이다. **C2** — 🔴 **g10 이 같은 주제군 G 에서 C2** 다. **C8** — a91 이 같은 공정(워시+마른 잉크선)이고 8권 상한이다. **C4** — §2.8 표정 없음(요구 5) + 이미 셋.

### 🔴 추천 = 후보 ① — 어둠은 쌓아서 만든다

근거 세 줄:

- **어둠의 정체가 g88 과 정반대다.** g88 은 **안 칠해서** 어둡고(어둠이 지배면이고 빛을 얹는다), g01 은 **쌓아서** 어둡다. 그리고 쌓는 쪽이 이 책에 맞다 — 침대 밑에 무엇이 있는지 **아이의 머리가 계속 얹기** 때문에 안 보이는 것이고, 그건 비어 있음이 아니라 겹쳐 있음이다.
- **하나의 자가 낮과 밤을 다 잰다.** 1겹 = 낮 · 6겹 = 침대 밑 최심부 · 0겹 = 빛. 🔴 그래서 **빛과 어둠이 같은 단위로 세어지고**, p5 의 「빛이 침대 다리 앞에서 딱 멈춘다」가 문구가 아니라 **오려낸 종이의 끝**이 된다.
- **침범 금지가 공정이다.** p11 의 「어느 쪽도 상대를 침범하지 않는다」는 붓으로는 지키기 어려운 지시인데, **두 영역이 각각 다른 종이 조각**이면 물리적으로 침범할 수가 없다.

🔴 **새로 확립한 §2.9 변형 = 「악센트는 같은 색을 가진 두 사물이고, 둘이 같은 것임을 알아보는 것이 곧 반전이다.」**
호박색 #C98A2E 은 이 책에서 딱 두 가지에 붙는다 — **나무 구슬**과 **어둠 속의 눈 두 개**. 넷째 쪽에 걸쳐서만 나온다.
- **p2**(낮) 구슬 하나 → **p7** 어둠 밖으로 굴러 나온 구슬 → **p9** 🔴 **눈 두 개** → **p12** 어둠 앞에 되돌려진 구슬.
🔴 이 변형의 힘은 **정체를 안 그리고도 정체를 알린다**는 것이다. 독자는 p2 에서 이미 그 색을 봤으므로, p9 에서 눈 두 점을 보는 순간 「구슬을 가지고 놀던 것」에 도달한다 — 대본이 「한마디도 하지 않는다」로 정한 규칙을 그림이 **색으로만** 지킨다. **정체를 밝히지 않는 권 전체에 재사용할 것.**

### 🔴 C9 셋째를 여는 근거 — f05·d01 과 공정이 다르다 (§2.13 · §7.5 조건: 「②질감판 겹치기 계열로」)

🔴 **d01 「산 너머엔 뭐가 있어?」가 같은 세션에서 C9 를 먼저 썼고 그것도 「판을 찍어 겹치는」 ② 계열이다.** 셋 다 ② 계열이 되므로 정면으로 갈라 둔다.

| 축 | **f05** (C9 첫째) | **d01** (C9 둘째) | **g01** |
|---|---|---|---|
| 공정 | **오려 붙인다**(가위 엣지가 정체) | **마스크로 찍어 겹친다**(칼선이 정체) | 🔴 **찍은 종이를 오려 겹쳐 붙인다** — 찍기와 오리기가 둘 다 있고, 정체는 **겹의 개수**다 |
| 종이 | 손 인쇄 **무늬** 종이 여러 장 | 무지 판 여러 색 | 🔴 **무늬가 없는 단색 회청 판 한 종류만**. 무늬가 한 점도 없다 |
| 🔴 **겹이 하는 일** | 도형이 겹쳐 **개수**가 생긴다 | 능선이 겹치고 🔴 **뒤로 갈수록 얇게 찍혀 창백해진다**(겹수 = 높이, 방향은 **밝아짐**) | 🔴 **같은 자리에 겹쳐 어두워진다**(겹수 = 어둠의 깊이, 방향이 **정반대**) |
| 세는 것 | 오린 **같은 도형의 개수** | **능선의 장수** | 🔴 **겹의 수**(1겹=낮 · 6겹=최심부) |
| 판이 안 덮는 곳 | 없음(무늬가 화면을 채운다) | 🔴 **맨 종이 0**(판이 전부 덮는다) | 🔴 **맨 종이 = 빛**(0겹). 낮에는 화면 전체가 거의 종이다 |
| 색 | 여러 무늬 + 치즈 노랑 하나 | 여러 색(초록·호수·흙) + 금 | 🔴 **한 잉크 단색조** + 호박 하나 |
| 무대·시간 | 따뜻한 이탈리아 부엌, 저녁 | 야외 알프스 골짜기, 낮 → 밤 | 🔴 **실내 영국 아이방**, 밤 ↔ 낮 교차 |
| 인물 크기 | 화면 중앙 | 손톱만 | 화면 중앙 |
| 선 | 크레용 굵은 윤곽 | 인물에만 크레용 선 | 🔴 **가는 마른 연필 윤곽**, 가시만 짧은 획 다발 |

🔴 **d01 과의 결정적 갈림 = 겹의 방향이다.** d01 은 겹칠수록 **창백해지고**(대기 원근), g01 은 겹칠수록 **어두워진다**(어둠의 깊이). 같은 공정으로 정반대 일을 하므로 썸네일에서 하나는 **창백한 산 책**, 하나는 **어두운 밤 책**이다. §2.13 대로 클러스터 라벨이 아니라 **공정이 정체를 정한다**(전례 = C3 셋 · C4 넷 · C6 넷 · C7 셋).

### 점눈이 분리 확인 (4축 전부 통과)

| 축 | 전래동화 **점눈이** | **g01** |
|---|---|---|
| **종이색** | 밝은 크림 = 햇빛 | ✅ **차가운 오프화이트 아마지 #E7E4DC**, 그리고 겹치면 슬레이트로 내려간다 |
| **얼굴** | 점눈 2 + 실선 입 | ✅ 고슴도치 = **그린 눈 + 별개 위눈꺼풀선 + 별개 눈썹**. 침대 밑 것 = **호박 원반 + 세로 슬릿 하나**(표정이 없고, 그래서 점눈이 아니다 — 광점이다) |
| **악센트** | 화면당 빨강 1점 | ✅ **빨강 0.** 호박이고, **매 화면이 아니라 네 쪽만** |
| **매체** | 느슨한 색연필 낙서 | ✅ **찍은 질감판 겹쳐 붙이기 + 인물만 가는 마른 연필선** |

### 라인 충돌 확인 (필수)

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ⚠️ 🔴 **검수 항목으로 올린다** | 콜라주는 물성이 정체라 **종이가 두꺼워지고 보풀·바늘땀·천 짜임이 보이면 그 순간 호리 라인**이다(f05·f01 과 같은 이유, 그리고 이 권은 **이불이 소재**라 더 위험하다). NOT 절에 `one sheet thick per layer` · `no stitching` · `no fabric weave` 를 박고 검수 5번으로 올렸다 |
| 전래동화 **점눈이** | ✕ (4축 전부 분리) | 위 표 |
| **f05**(C9 첫째) | ✕ | 위 표 |
| **d01**(🔴 C9 둘째 · 같은 ② 계열) | ✕ | 위 표. 결정적으로 **겹의 방향이 반대**(창백해짐 ↔ 어두워짐) + **다색 ↔ 단색** + **맨 종이 0 ↔ 맨 종이가 빛**. 🔴 첫 렌더를 나란히 놓고 본다(검수 6번) |
| **g88**(같은 G 군 · 어둠 책 — 🔴 가장 가까운 상대) | ✕ | 아래 별도 표 |
| **g10**(같은 G 군 · 작은 동물) | ✕ | g10 = 흙빛 맨 종이 + **딥펜 떨림 선** + 평칠 슬레이트 그림자 + **눈부신 아침**. g01 = 오프화이트 질감판 + **선이 거의 없고 판이 형태를 만든다** + **한밤중**. 시간·획·지배면이 전부 반대 |
| **e09**(밤·잠자리 책) | ✕ | e09 = 어두운 종이에 목탄을 덮고 **지우개로 빛을 들어낸다**(감법 회화, 윤곽선 0). g01 = **밝은 종이에 어두운 판을 얹는다**(가법 콜라주, 엣지가 전부). 그리고 g01 엔 **낮 쪽이 있다** — e09 는 전편이 밤이다 |
| **c60**(덮는 판) | ✕ | c60 = 스텐실 인쇄판이 **비켜 가서** 흰 양이 생기고 안개판이 덮는다(C3, 잉크). g01 = **오려 겹친 종이**이고 어둠이 쌓인다. 물성이 인쇄 ↔ 종이 |
| 세계명작 수채 그림풍 | ✕ | 붓 톤·번짐 없음. 찍은 판과 오린 엣지 |

### 🔴 g88 「한 칸 더 올라가면」 과의 분리 (같은 주제군 G · 둘 다 어둠 책 — 이 라인에서 가장 위험한 쌍)

| 축 | **g88** (종탑) | **g01** (침대 밑) |
|---|---|---|
| 🔴 **어둠의 정체** | **안 칠한 검정 판** — 어둠이 지배면이고 비어 있다 | **겹쳐 붙인 종이** — 어둠이 쌓여 있고 엣지가 보인다 |
| 빛의 정체 | 검정 위에 **얹은 불투명 담색** | **판이 비켜 간 0겹** = 맨 종이 |
| 지배면 | 거의 검정(#16181C) | **밝은 오프화이트**(밤 쪽만 겹으로 내려간다) |
| 착지 | 밝은 면적이 최대로 자란다(빛이 이긴다) | 🔴 **어둠이 그대로다**(달라진 것은 마루 위 자국 둘뿐) |
| 악센트 | 놋빛·깃털 분홍 스팟 2, 빨강 0 | **호박 하나**, 네 쪽만, 빨강 0 |
| 썸네일 | **검정 책** | **흰 책** |

🔴 두 권의 첫 렌더는 **반드시 붙여 놓고** 본다. 하나는 검정 책, 하나는 흰 책이어야 한다.

### 🔴 대본 SCENE 결함 6건 — 그림에서 교정한다

대본은 어둠을 **농도·초점·스포트라이트**로 적어 뒀다. 이 앵커는 겹의 계단이라 그 수단이 없다. 여섯 곳을 **판의 언어**로 옮겼다. **대본 문구 수정은 불필요** — 삽화 지시만 분기한다.

| # | 대본 | 문제 | 그림 처방 |
|---|---|---|---|
| 1 | p9 톤 「**어둠의 농도만으로** 깊이를 만든다」 | 🔴 그라데이션은 이 앵커 1번 실패 모드 | **겹의 계단.** 5겹 → 6겹으로 한 단 내려가는 하드 엣지가 화면 안에 보이고, 그 안쪽이 최심부다 |
| 2 | p6 톤 「발이 닿는 **한 점에만 빛이 모이고**」 | 스포트라이트는 CG 조명 효과 | **그 한 점만 1겹**, 사방은 2~4겹. 빛이 모인 게 아니라 판이 거기만 얇다 |
| 3 | p2 톤 「볕이 침대 밑 가장 깊은 구석까지 닿아」 | 광선·빛기둥 유혹 | 🔴 **볕 = 0겹 띠**(판이 비켜 간 맨 종이)가 마루를 가로지른다. p5 의 문틈 빛과 **같은 물성**이라 아이가 둘을 잇는다 |
| 4 | p1·p12 「잔무늬 벽지」 | 🔴 무늬를 그리면 **f05 의 무늬 종이와 겹친다** | **벽지는 질감판의 그레인만.** 무늬·꽃·줄무늬·체크가 한 점도 없다(NOT 절에 명시) |
| 5 | p12 「마루 위에 앞발로 두드린 **자국 두 개**」 | 자국을 무엇으로 그리나 | 🔴 **1겹 판이 얇게 벗겨진 두 점.** 두드림이 판을 벗긴 것이라, 자국이 「그린 것」이 아니라 「걷어낸 것」이다 |
| 6 | p1·p12 후렴 「사각, 사각」 · p7 「후다닥」 · p11 「똑, 똑」 | 소리를 그리려는 유혹(효과선·글자) | 🔴 **소리를 그리지 않는다.** 효과선·의성어 글자·속도선 금지. p11 의 되돌아온 두드림은 **이음매에서 튀어 오른 먼지 한 점**뿐이다(대본이 이미 정한 유일한 증거) |

### 밀도 배급 (§2.10 · §2.12)

무텍스트 쪽이 없어 §2.12 우선권은 미발동 → 슬롯을 **두 쪽**에 준다.
- 🔴 **p2**(낮의 침대 밑) — **먼지 세 덩이·구슬·실밥·못 자국이 각각 알아볼 수 있게 있어야** 「아무것도 없었다」가 성립한다. 텅 빈 쪽으로 그리면 아이가 확인을 못 하고, 그러면 밤의 오해가 버틸 근거가 없어진다.
- **p12**(달라진 것을 찾는 쪽) — 자국 둘·구슬·물컵·술 장식.

🔴 **밀도는 소품에만**(§2.7). **벽지 무늬·마루 널·놋쇠 침대의 선반 세공·술 장식의 실 한 올을 다 그리면 두 쪽이 다 죽는다.** 마루는 **긴 오린 엣지 한두 줄**로 끝낸다.

### 의인화 등급 (a91 에서 확립한 규칙 재사용 — 이 권만의 특례가 하나 있다)

- **고슴도치 = 이족.** 뒷발로 서고 앞발이 손이다(이불을 쥐고, 마루를 두드린다).
- 🔴 **침대 밑의 것 = 등급을 정하지 않는다.** 앞발 하나가 천을 쥐는 것이 이 책에서 그것이 하는 유일한 동작이고, **두 발로 서는지 네 발인지도 끝까지 결정하지 않는다.** 정체를 안 보여주는 것이 이 책의 규칙이므로 **등급도 미정으로 남긴다** — 이건 이 라인에서 처음 나온 처리다.
- 🔴 **포즈가 안 되면 고슴도치의 포즈를 바꾼다.** 침대 밑 것에 몸을 주지 않는다.

---

## G-01 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-g01  (hedgehog / English child's bedroom / the thing under the bed)

Style: a hand-made cut-paper picture-book page for 4-6 year olds. Quiet, cold, night.
  🔴 THE DARK IS NOT EMPTY - IT IS BUILT.

MEDIUM: hand-printed texture paper, cut and layered. ONE single grey-blue ink is printed onto
  cool off-white flax paper with a sponge and a hard roller, so every sheet carries a granular,
  uneven grain with visible roller streaks and sponge mottle.
  🔴 THERE IS NO PATTERN ON THE PAPER - no motifs, no florals, no stripes, no checks, no
  wallpaper design anywhere. Only grain.
  Sheets of this printed paper are then CUT and LAID OVER ONE ANOTHER, and each added layer
  drops the value one step.
  🔴 DARKNESS IS A NUMBER OF LAYERS, NOT A GRADIENT. Every layer edge stays visible as a hard
  cut or torn edge, so the reader can SEE that the dark has layers even though they cannot see
  what is inside it. ONE layer = daylight. SIX layers = under the bed at its deepest.
  🔴 LIGHT IS ZERO LAYERS - a strip of the bare off-white paper where no sheet was laid. The
  corridor light and the daytime sunbeam are THE SAME MATERIAL: paper left uncovered. That is
  why light in this book stops at a hard straight end - it is the edge of a piece of paper.
  Living things and props are drawn ON TOP of the layers with a fine dry pencil contour and
  short pencil strokes. 🔴 EACH LAYER IS ONE SHEET THICK - nothing is embossed, quilted, woven,
  fibrous or fluffy.

PALETTE: one printed grey-blue on off-white, stacked, plus one warm spot colour.
  Hex anchors, and these ARE the value ladder - use them literally:
    0 layers (light) #E7E4DC / 1 layer #C6C7C2 / 2 layers #9BA1A2 / 3 layers #7A8285 /
    4 layers #5C666B / 5 layers #414A50 / 6 layers #2C3439 / pencil contour #3A3833.
  EXACTLY ONE other colour exists in this book: amber #C98A2E.
  🔴 AMBER BELONGS TO TWO THINGS AND THEY ARE THE SAME COLOUR ON PURPOSE - the wooden marble,
  and the pair of eyes in the dark. It appears on FOUR PAGES ONLY. On every other page there is
  no amber anywhere at all.
  🔴 NOTHING ELSE IS EVER AMBER: not the brass bedstead, not the corridor light, not the
  floorboards, not the lamp, not the fire grate. Brass is drawn as pencil line on grey-blue
  layers - there is no metal colour in this book.

WHAT MAY BE SEEN UNDER THE BED - the rule of the book, read it twice.
  The thing under the bed is NEVER drawn whole. Across twelve pages only these four things are
  ever visible: TWO AMBER EYES / ONE FRONT PAW / ONE SINGLE LINE of a back pressed against the
  skirting board / A FIST OF BLANKET held in that paw.
  🔴 NO claws, NO teeth, NO snout, NO ears, NO whole silhouette, NO body shape, NO size.
  Its species is never decided and neither is whether it walks on two legs or four.
  🔴 ON THE LAST PAGE IT IS STILL NOT VISIBLE. That is the ending, not an omission.

COMPOSITION: the frame is usually split by ONE hard layer edge - top against bottom on the
  night pages, left against right at the end. 🔴 TWO ZONES NEVER BLEED INTO EACH OTHER; because
  they are separate sheets of paper, they physically cannot. Do not soften, feather or blend any
  boundary anywhere in this book.
  🔴 Keep the bottom 18% of the image quiet and free of key subject matter (a caption band is
  laid over it later).

FINISH HIERARCHY - about how FINISHED each area is, NOT about opacity or focus.
  1. THE HEDGEHOG = finished. Pencil contour, quill strokes, drawn eye, lid and brow.
  2. WHAT IT TOUCHES on that page = half-finished: contour and one interior line.
  3. EVERYTHING ELSE = FLAT LAYERS ONLY, WITH NO DRAWING ON THEM. No wallpaper motifs, no
     floorboard rendering beyond one or two long cut edges, no brick, no turned-rail detail, no
     individual fringe threads.
  🔴 The dark is NOT blurred, hazed, softly graded or atmospheric - it is stacked flat sheets
  with visible edges. A soft dark cloud is the failure mode of this book.

CHARACTER DESIGN: the hedgehog's eyes are DRAWN - a round eye with a SEPARATE upper-lid stroke
  and a SEPARATE short eyebrow stroke above it, so it can squeeze shut, stare wide and look
  bored. No dot eye, no blush, no catchlight.
  🔴 THE QUILLS ARE THE EMOTION: short pencil strokes in a bundle over the back, and their
  ANGLE is the whole performance - laid flat back (day, bored) / half raised / standing straight
  out in every direction (fear) / settled a little (after the rule) / still slightly raised (the
  end). 🔴 Quills are never a smooth textured mass; they are COUNTABLE separate strokes.
  The thing under the bed has NO character design, by design - see the rule above. Its eyes are
  amber DISCS with one vertical slit each, laid on top of the layers. They are not dot eyes and
  they carry no expression whatsoever.

ANTHROPOMORPHISM GRADES: the hedgehog is BIPEDAL - it stands on hind feet, its front paws are
  hands, it grips the blanket and knocks on the floor with one paw. 🔴 The thing under the bed is
  DELIBERATELY UNGRADED - one paw grips cloth and that is the only thing it is ever seen doing.

SETTING: a late-Victorian English child's bedroom - a brass bedstead with turned rails and
  castors, a valance with a fringe hanging all the way to the floor, long bare floorboards with
  ONE board more widely jointed than the rest and two nail heads showing in it, plain skirting
  with a moulding, a small wool rug with a fringe, a rocking horse, an open wooden toy box, a
  cast-iron fireplace grate, a rush-seated chair with a water glass on it, a door standing ajar,
  a plain wooden marble. European, no Asian motifs.

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT digital airbrush / NOT gradients / NOT softly graded darkness / NOT atmospheric haze /
  NOT glow or bloom / NOT depth-of-field blur / NOT a spotlight or light beam / NOT glossy 3D CG
  render / NOT cel-shaded anime / NOT photographic / NOT photographed material or scanned photo
  collage / NOT a texture filter laid over flat digital colour / NOT patterned paper of any kind
  (no wallpaper motifs, florals, stripes or checks anywhere) / NOT a fully rendered background /
  NOT every floorboard, brass rail or fringe thread drawn to completion / NOT a uniform finish
  across the page / NOT any second accent colour / NOT amber on the bedstead, the lamp, the
  corridor light or the floor / NOT the thing under the bed shown whole, and NOT claws, teeth,
  snout, ears or silhouette / NOT sound-effect letters, motion lines or speed lines / NOT any
  lettering or numerals anywhere in the image / NOT paper thicker than one sheet per layer,
  NOT stitching, NOT thread, NOT fabric weave, NOT fuzzy or fibrous edges, NOT needle-felted
  wool, NOT sculpted clay (another line owns those).
```

### 🔴 이 앵커의 세 불변 규칙 (매 컷 반복 확인)

**규칙 A — `LAYERS:` 는 값이 아니라 개수다.** 컷마다 그 쪽 각 영역이 몇 겹인지 못 박는다. 위 팔레트의 hex 계단을 문자 그대로 쓴다.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 위 2 / 🔴 아래 **5** | 🔴 **전 화면 1**(+볕 0) | 2 | 2, 발치 쪽 3 | 마루 2 / 🔴 빛 **0** / 침대 밑 5 | 마루 2 / 닿는 점 1 / 널 아래 4 | 위 2 / 아래 5 / 밀린 술 자리 4 | 좌 2 / 🔴 우 **5**(목을 가른다) | 🔴 **6**(최암) | 6, 앞발 자리 4 | 🔴 좌 2 / 우 5, **맞댄 엣지** | 위 2 / 아래 5 (= p1) |

**규칙 B — `UNDER:` 는 그 쪽에 침대 밑이 무엇으로 보이는지다.** 🔴 「눈 두 점 / 앞발 하나 / 등 윤곽 한 줄 / 천을 쥔 손」 넷 말고는 아무것도 그리지 않는다.

| p1 | p2 | p3 | p4 | p5 | p6 |
|---|---|---|---|---|---|
| 아무 형태도 없음. 술 장식 한 자락만 안쪽으로 밀려 있다 | 🔴 **구석까지 다 보인다** — 먼지 셋·구슬 하나·실밥. 그것뿐이다 | 프레임 밖(침대 위만) | 화면 아래 끝에 술 장식 윗부분만 | 빛이 한 뼘도 안 들어간 5겹 | 널 아래로 이어진 어둠 한 줄 |

| p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|
| 술 장식이 밀렸다 되돌아가는 중 + 굴러 나온 구슬 | 이불이 끌려 들어가 **끝이 안 보인다** | 🔴 **눈 두 개 + 등 윤곽 한 줄** | 🔴 **앞발 하나 + 쥔 천** | 아무 형태도 없음 | 🔴 **p1 과 똑같이 아무 형태도 없음** |

**규칙 C — `AMBER:` 스케줄.** `none` 이면 화면에 호박이 **한 점도 없다.**

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 없음 | 🔴 **구슬 하나(첫 등장)** | 없음 | 없음 | 없음 | 없음 | 굴러 나온 구슬 | 마루 위 구슬 | 🔴 **눈 두 개** | 없음 | 마루 위 구슬 | 🔴 **되돌려진 구슬** |

---

## G-01 §3. 캐릭터 시트 (🔴 LayerKit(재료 시트)을 가장 먼저 굽는다 — §2.14 · 전 4장)

```
MATERIAL SHEET - LayerKit   (bake this FIRST, before any character and any scene — §2.14)

🔴 THIS IS NOT A SCENE AND NOT A CHARACTER. It is the material of the book, and it must be
  approved before anything else is drawn. Everything in this book is made of it.

PLATE 1 - THE PRINTED PAPER, one large swatch:
  Cool off-white flax paper #E7E4DC, printed with ONE grey-blue ink applied by sponge and hard
  roller. The grain is granular and uneven: roller streaks running one way, sponge mottle in
  patches, thin places where the paper shows through, and a few skipped spots.
  🔴 NO PATTERN, NO MOTIF, NO STRIPE, NO CHECK, NO FLORAL. Grain only.

PLATE 2 - THE VALUE LADDER, seven rectangles in a row, left to right, each overlapping the
  previous one slightly so the reader sees the layers stacking:
    0 layers - bare paper #E7E4DC
    1 layer  #C6C7C2
    2 layers #9BA1A2
    3 layers #7A8285
    4 layers #5C666B
    5 layers #414A50
    6 layers #2C3439
  🔴 EACH STEP MUST BE A HARD EDGE AGAINST THE NEXT - no fade, no blend, no gradient anywhere on
  this plate. Each rectangle still shows its own grain, so the grain accumulates as the layers do.

PLATE 3 - EDGE DETAILS, three enlarged strips:
  (a) A SCISSOR EDGE - straight, crisp, slightly faceted where the blade opened and closed.
  (b) A TORN EDGE - a soft fibrous white line of exposed paper core along the tear.
  (c) A THREE-LAYER OVERLAP seen close - three hard edges visible one behind the other, each
      offset, so the eye can count them. 🔴 This is the single most important detail in the book:
      the dark has to be COUNTABLE.

PLATE 4 - LIGHT AS ZERO LAYERS:
  One rectangle of 2-layer paper with a straight strip CUT OUT of it, so bare #E7E4DC shows
  through, and 🔴 THE STRIP ENDS ABRUPTLY IN THE MIDDLE OF THE FIELD - a hard flat end, not a
  fade. Label nothing; just show it. This is how every beam of light in this book is made, and
  it is why light in this book stops instead of dimming.

PLATE 5 - AMBER, two small shapes only:
  A plain wooden marble, a sphere in amber #C98A2E with one darker grain line across it and NO
  highlight dot. Beside it, TWO amber discs each with a single vertical slit pupil, laid on a
  6-layer field. 🔴 The two shapes are the SAME colour, deliberately - hold them side by side so
  it is obvious. Nothing else on any plate is amber.
```

```
CHARACTER SHEET - HedgeKit   (bake this SECOND)

🔴 SAME MATERIAL AS THE BOOK. The hedgehog is DRAWN ON TOP of the layered paper with a fine dry
  pencil contour #3A3833 and short pencil strokes; the body's own colour is one or two layers of
  the same grey-blue paper. Do NOT render it smoothly, do NOT give it fur shading, and do NOT
  give it a colour of its own. No amber anywhere on this sheet.

FACE: eyes DRAWN - a round eye with a SEPARATE upper-lid stroke and a SEPARATE short eyebrow
  stroke above it, set fairly wide. A small pointed snout with one dark nose wedge, and a mouth
  that is one short line. Cheeks are bare layer. No blush, no highlight dot, no catchlight.
BODY: a rounded pear mass in 1-2 layer value, with a paler bare-paper belly and small hands and
  feet in pencil line. Four short legs but 🔴 IT STANDS ON THE HIND TWO and its front paws are
  hands that grip.
🔴 QUILLS - THE MOST IMPORTANT PART OF THIS SHEET. They are a bundle of SHORT SEPARATE PENCIL
  STROKES over the back, never a textured mass and never a fill. Draw the FIVE STATES, large,
  in a row, and label nothing:
  1. FLAT BACK - every stroke lying along the body, almost parallel to it. (Day, bored.)
  2. HALF RAISED - strokes at about 45 degrees, uneven.
  3. STRAIGHT OUT - every stroke radiating in every direction so 🔴 THE ANIMAL LOOKS BIGGER THAN
     IT IS. (Fear. This is the state on most night pages.)
  4. SETTLED A LITTLE - strokes dropped to a low angle but not flat, a few still standing.
  5. STILL SLIGHTLY RAISED - almost flat, with three or four strokes stubbornly up.
     (This is the last page, and it is the whole G-group landing: the fear did not go away.)
🔴 QUILLS THROUGH CLOTH: draw one extra detail - the quills under a blanket, pushing the cloth
  up into several separate sharp points. The blanket is ONE FLAT LAYER of paper with pencil fold
  lines, and the points are where the quills lift it. 🔴 NO fabric weave, NO stitching, NO
  fibrous edge - it is paper.
BUILD & SILHOUETTE: small, round, low; readable at thumbnail size against a bed, a chair and a
  marble. The quill angle alone must tell the reader the mood at thumbnail size.
REFERENCE SHEET: full-body standing on hind feet, quills flat / three-quarter view lying flat on
  the floor with head turned sideways to look under something, quills flat / curled tight with
  quills straight out / one arm stretched out to tap a floor, body low, quills half settled /
  three expression close-ups: bored and half-lidded (day) / eyes fully round with lid stroke high
  and brow up (fear) / eyes open and level, brow relaxed (after the rule).
  Plain bare paper background, no scenery, no amber.
SCENE token: HedgeKit.
```

```
CHARACTER SHEET - UnderThing   (bake this THIRD)
🔴 THIS SHEET EXISTS TO DEFINE WHAT MUST NOT BE DRAWN. Read the whole thing before drawing.

🔴 DO NOT DRAW A WHOLE CREATURE ON THIS SHEET. There is no full body, no silhouette, no turn-
  around, no size chart and no species. If a complete animal appears anywhere on this sheet, the
  sheet is wrong and the book is over - because whatever is on the sheet will show up in the
  scenes.

FOUR PARTS, AND ONLY THESE FOUR, each drawn alone on a 6-layer grey-blue field #2C3439:
  1. TWO AMBER EYES - two flat discs in amber #C98A2E, each with ONE vertical slit pupil in
     dark. They are laid ON TOP of the layers, so they are the only bright thing in the field.
     🔴 NO eyelid, NO brow, NO expression, NO shine, NO reflection, NO catchlight. Draw them at
     two distances: nearer (larger, further apart) and further back (smaller, closer together) -
     because on one page they retreat.
  2. ONE FRONT PAW - a paw gripping a fist of cloth. Toes are present and 🔴 THERE ARE NO CLAWS.
     The pad is soft, the grip is tight, and the very tips tremble slightly (draw that as a
     doubled contour on the tip of one toe only). 🔴 ABOVE THE WRIST THE FORM IS SWALLOWED BY
     THE LAYERS - do not draw an arm, a shoulder or a joint. The paw simply stops.
  3. ONE LINE OF A BACK - a single pencil contour, curved, pressed against a skirting board
     moulding. That is all: one line. 🔴 No fill, no second line, no fur, no shape behind it.
  4. THE FIST OF BLANKET - the cloth caught in that paw, deeply creased into a few flat paper
     folds with pencil crease lines.
🔴 SCALE IS UNDEFINED. Do not draw anything that lets a reader measure how big this is: no full
  paw print beside a hand, no comparison, no shadow that implies bulk.
🔴 THE EYES AND THE MARBLE ARE THE SAME AMBER, ON PURPOSE. Place a small drawing of the wooden
  marble in a corner of this sheet as a colour reference only, and do not connect them with a
  line or a label - the reader is meant to make that connection alone.
SCENE token: UnderThing.
```

```
CHARACTER SHEET - RoomKit   (bake this FOURTH)

🔴 SAME MATERIAL AS THE BOOK. Layered grey-blue printed paper with pencil contours on top.
  Every object flat, no modelling. No amber except the marble.

FIXED OBJECTS, each drawn alone, and each must be recognisable again from its cut shape alone:
  - THE BRASS BEDSTEAD: turned head and foot rails, four legs on castors. 🔴 NO METAL COLOUR AND
    NO SHINE - it is 2-layer paper with pencil line describing the turnings.
  - THE VALANCE: a cloth skirt hanging from the mattress all the way to the floor with a plain
    fringe. Drawn TWICE - hanging straight (curtaining the dark) and pushed inward at one corner
    (something moved behind it). 🔴 One flat paper layer with pencil fold lines. No weave, no
    threads, no stitching.
  - THE FLOORBOARDS: long boards shown as two or three long cut edges only, and 🔴 ONE BOARD MORE
    WIDELY JOINTED THAN THE REST with two nail heads showing in it. Draw that board large enough
    to be identified again - it is the board that creaks, and it appears on three pages.
  - THE SKIRTING BOARD with a simple moulding profile and two old nail marks.
  - THE DOOR AJAR: seen from inside the room, a narrow gap, and 🔴 the light through it drawn as
    a STRIP OF BARE PAPER cut out of a 2-layer floor, ending in a hard flat end.
  - THE WOODEN MARBLE: a plain amber #C98A2E sphere with one darker grain line, no highlight.
  - THE ROCKING HORSE, THE OPEN TOY BOX, THE CAST-IRON GRATE, THE RUSH CHAIR WITH A WATER GLASS,
    THE SMALL WOOL RUG WITH A FRINGE: each one flat, contour and one interior line at most.
  - THREE DUST BALLS and one loose thread: small, and each individually recognisable - they are
    the entire content of "there was nothing there".
🔴 WALLS AND WALLPAPER: one flat layer with its own grain and NOTHING drawn on it. Do not invent
  a wallpaper pattern. (A patterned wall would collide with another book in this line.)
SCENE tokens: BrassBed, Valance, CreakBoard, Skirting, DoorGap, Marble, RockingHorse, ToyBox,
  Grate, ChairGlass, Rug, DustBalls.
```

---

## G-01 §4. 12컷

각 컷은 `STYLE ANCHOR + 규칙 A·B·C + @image1(LayerKit) + @image2(HedgeKit) + @image3(UnderThing) + @image4(RoomKit) + 아래 블록` 으로 합성한다.

### p1 — 사각, 사각 (숨을 멈췄다)
```
CAMERA: wide, low angle 30cm above the floorboards. 🔴 ONE HARD HORIZONTAL LAYER EDGE crosses
  the middle of the frame; the lower half is the dark under the bed.
WHO: HedgeKit (above) + UnderThing (below, invisible).
SUBJECT: UPPER HALF, ON THE BED - HedgeKit lying flat on its back with the blanket pulled up to
  its chin, face to the ceiling, 🔴 BUT THE EYES ROLLED DOWN toward the floor. The chest is NOT
  raised - draw the blanket flat over it so the held breath reads. A few quills push through the
  blanket edge as separate sharp points (HedgeKit state 3).
  LOWER HALF, UNDER THE BED - 🔴 no form of any kind. Only the Valance fringe, with ONE strand
  of it pushed inward, into the dark.
SETTING: BrassBed legs and castors, the Valance hanging to the floor and curtaining the dark
  like a drape, long floorboards with CreakBoard among them, the wall (one flat layer, no
  pattern), ChairGlass beside the bed, a strip of night light under the curtain, the Grate.
LAYERS: 🔴 upper half (room and bed) = 2 layers #9BA1A2. Lower half (under the bed) = 5 layers
  #414A50. ONE HARD CUT EDGE between them, running straight across the frame - no feather, no
  fade, no blend. A thin strip of 0-layer bare paper under the curtain is the outside night light.
UNDER: nothing at all. Just the one pushed-in fringe strand.
AMBER: none.
FINISH: HedgeKit finished (contour, quills, eye with lid and brow). The blanket it holds
  half-finished. Bed, valance, floor, wall, chair, grate = FLAT LAYERS with almost no drawing -
  two long cut edges for the floor, contour only for the bed.
TONE: the top half is just legible; the bottom half has had its forms removed entirely. 🔴 The
  reader's eye is pulled to the hard edge in the middle and then down past it. No sound is drawn
  anywhere - no letters, no motion lines.
```

### p2 — 낮에는 아무것도 없었다 🔴 1겹의 기준판 · 밀도 배급 1/2
```
CAMERA: close-up, over the shoulder - cheek pressed to the floorboards, looking sideways along
  the space under the bed.
WHO: HedgeKit alone.
SUBJECT: LEFT - HedgeKit lying flat on its belly with its head turned sideways to peer under the
  bed, both front paws flat on the floor, hind legs relaxed and stretched out. 🔴 QUILLS FULLY
  FLAT BACK (HedgeKit state 1). Eyes half-lidded, brow relaxed - bored. This is the only page in
  the book where the animal is bored, and it must read as boredom.
SETTING: 🔴 DENSITY PAGE 1 OF 2, AND IT MATTERS MORE THAN IT LOOKS. Under the bed, in daylight:
  THREE dust balls, each individually recognisable; ONE wooden Marble rolled into the far corner;
  one loose thread caught in a floor joint; two old nail marks in the Skirting moulding. 🔴 THE
  READER MUST BE ABLE TO CHECK - if this page is drawn as an empty space, then "there was
  nothing there" is never established and the fear on the night pages has nothing to argue with.
  🔴 The Valance is hitched UP and out of the way, so nothing is hiding anything.
  Elsewhere in the room: RockingHorse, the open ToyBox, the Grate - each one flat, one contour.
LAYERS: 🔴 THE WHOLE FRAME IS ONE LAYER #C6C7C2, INCLUDING UNDER THE BED. There is no 5-layer
  field anywhere on this page. Plus a broad strip of 0-LAYER BARE PAPER #E7E4DC crossing the
  floor diagonally - that is the daylight, cut out of the single layer, 🔴 and it reaches all the
  way into the deepest corner under the bed. Nothing has anywhere to hide.
UNDER: 🔴 everything is visible, right into the corner: three dust balls, the marble, the
  thread, the nail marks. That is the whole content.
AMBER: 🔴 FIRST APPEARANCE - the wooden Marble, one small amber sphere in the far corner. It is
  the only colour on this page and this page's only point of interest. 🔴 Note it, reader.
FINISH: HedgeKit finished. The floor right under its cheek half-finished. Props: contour and one
  interior line each, so they can be identified but are not rendered. 🔴 Do NOT draw floorboard
  grain, wall pattern or the bed's turnings.
TONE: 🔴 BRIGHT, FLAT AND DELIBERATELY BORING - the exact opposite of p5 and p8. No hard split
  in the frame, no deep value anywhere, almost no contrast. 🔴 If this page is atmospheric or
  pretty, the book has failed on its second page.
```

### p3 — 그런데 밤이 되면 또 소리가 났다
```
CAMERA: medium close-up, high angle. Only the top of the bed is in frame - 🔴 under the bed is
  cropped away entirely.
WHO: HedgeKit alone.
SUBJECT: CENTRE - HedgeKit curled on its side, in the act of yanking both hind feet in under the
  blanket, back pressed hard to the wall, chin folded down to its chest. Eyes wide and round with
  the lid stroke high, looking off the bottom of the frame. 🔴 QUILLS STRAIGHT OUT (state 3), and
  they push the blanket up into SEVERAL SEPARATE SHARP POINTS - count them, they are drawn, not
  textured.
SETTING: the crumpled blanket in flat paper folds with pencil crease lines, the blanket's hem
  slipping over the bed edge and out of the bottom crop, the BrassBed head rail's turned
  uprights, the flat wall, ChairGlass at the frame edge.
LAYERS: 2 layers #9BA1A2 for the room and bed; toward the foot of the bed a 3-layer #7A8285 patch
  where the frame is about to leave the light. No 0-layer light on this page.
UNDER: out of frame. 🔴 That is the point - the fear is now working without any evidence at all.
AMBER: none.
FINISH: HedgeKit finished, and the raised blanket points are the most worked thing on the page.
  The blanket half-finished. Bed rail and wall = flat layers.
TONE: 🔴 the fear is carried by THE SHAPE OF THE CLOTH, not by the face. Draw the sharp points
  clearly enough that they read at thumbnail size. No sound is drawn.
```

### p4 — 나를 기다리는 걸까?
```
CAMERA: frontal medium, eye level. The bed head is behind, and the animal is alone at the centre
  of the frame.
WHO: HedgeKit alone.
SUBJECT: CENTRE - HedgeKit with the blanket pulled up under its nose so only the eyes are out.
  Both hind feet dragged all the way up to the pillow so the body is a short bunched lump inside
  the cloth. The eyes do not blink and are fixed on the foot of the bed. One front paw grips the
  blanket edge from the inside - draw the knuckle bumps through the cloth. Quills state 3, points
  showing through in several places.
SETTING: the BrassBed head's turned uprights with the layer edges crossing them, the flat wall,
  one small empty picture frame on the wall (🔴 EMPTY - no image, no lettering), the ridge of the
  blanket dissolving toward the foot of the bed, and at the very bottom of the frame only the top
  of the Valance.
LAYERS: 2 layers for the head of the bed and the wall; a 3-layer #5C666B... no - a 3-layer
  #7A8285 field toward the foot of the bed and the bottom strip. 🔴 The layers step DOWN toward
  the bottom of the frame in two hard steps, so the direction the animal is staring is the
  direction the paper gets darker.
UNDER: only the upper edge of the Valance is in frame - no form.
AMBER: none.
FINISH: HedgeKit's eyes and the gripping knuckles finished; the blanket half-finished. Bed rail,
  wall, picture frame = flat layers with contour only.
TONE: only the upper half of the face is legible; the rest is held down in the layers. 🔴 Nothing
  is happening on this page and that is what it is for - it is a page of waiting.
```

### p5 — 빛은 침대 다리 앞에서 딱 멈췄다 🔴 0겹의 기준판
```
CAMERA: low-angle wide, taken from the floor. 🔴 A SINGLE STRIP OF LIGHT runs diagonally from
  the door across the floorboards and is the axis of the whole composition.
WHO: HedgeKit + UnderThing (invisible).
SUBJECT: UPPER RIGHT - HedgeKit leaning its upper body out over the edge of the mattress to look
  down at the place where the light stops, one front paw hooked over the mattress edge, neck
  stretched long, nose pointing down, eyes locked on the end of the strip. Quills half raised
  (state 2).
SETTING: the DoorGap standing ajar at the left, the floorboards, the threshold, the small Rug
  with its fringe, the BrassBed's near leg and castor.
LAYERS: 🔴 THE WHOLE POINT OF THIS PAGE IS THREE VALUES AND TWO HARD EDGES.
  - The floor and the room = 2 layers #9BA1A2.
  - THE LIGHT = 🔴 0 LAYERS, bare paper #E7E4DC, a strip CUT OUT of the floor, running from the
    door gap along the boards. 🔴 IT ENDS IN A STRAIGHT HARD END EXACTLY IN FRONT OF THE BED'S
    NEAR LEG - because it is the edge of a piece of paper, not a fading light. Do NOT taper it,
    soften it or feather it.
  - UNDER THE BED, beyond that end = 5 layers #414A50, and the light does not enter it by a
    finger's width.
UNDER: 5 layers, and 🔴 not one form inside it. The end of the light strip is the closest the
  reader ever gets.
AMBER: none. 🔴 The corridor light is bare paper, NOT amber - if it goes warm, the marble and the
  eyes lose their meaning.
FINISH: HedgeKit finished. The mattress edge under its paw half-finished. Door, threshold, rug,
  bed leg = flat layers, contour only. 🔴 Do not draw floorboard grain.
TONE: one bright strip against an even dark, with no halo, bloom or glow around it. 🔴 Every eye
  in the composition converges on the one point where the paper ends.
```

### p6 — 세 번째 마루가 삐걱, 하고 울었다
```
CAMERA: extreme close-up, pinned to the floor. Most of the frame is floorboards.
WHO: HedgeKit (one foot and part of the body).
SUBJECT: CENTRE - one hind foot of HedgeKit in the instant it touches the boards, toes spread
  wide and tense, only half the sole yet pressed down. Above the top crop line, the belly and a
  trailing edge of blanket, and a few quill points showing (state 3).
SETTING: 🔴 THE CREAK BOARD - one board with a visibly WIDER JOINT than the others and TWO NAIL
  HEADS showing, so the reader can see that this is the board that cries. Beneath the joint, a
  single dark line running away into the dark. The rush chair's leg at the frame corner, and the
  water glass small and undrawn beyond it.
LAYERS: 🔴 CORRECTION TO THE SCRIPT - the script asks for light to gather on the single point
  where the foot lands. There is no spotlight in this book. Instead: 2 layers #9BA1A2 for the
  boards, and 🔴 ONLY THE PATCH DIRECTLY UNDER THE FOOT IS 1 LAYER #C6C7C2 - the paper is
  thinner there, that is all. 3-4 layers toward the frame edges, and the joint beneath the creak
  board is 4 layers #5C666B.
UNDER: one thin dark line under the widened joint. Nothing else.
AMBER: none.
FINISH: the foot and the creak board's joint and nail heads finished - they are the plot. The
  chair leg is a contour. Everything else is a flat layer with nothing drawn on it.
TONE: dark at the edges, one step lighter at the single point of contact, with hard steps
  between. 🔴 A held instant just before a sound - and the sound is NOT drawn: no letters, no
  radiating lines, no vibration marks.
```

### p7 — 후다닥
```
CAMERA: medium wide, tilted axis. 🔴 The upward movement and the inward movement run in opposite
  directions across the frame.
WHO: HedgeKit + UnderThing (invisible).
SUBJECT: UPPER PART - HedgeKit flinging itself back up onto the bed, hind feet still in the air,
  the blanket lifting beneath it, eyes squeezed shut. 🔴 QUILLS FULLY OUT IN EVERY DIRECTION so
  the animal looks bigger than it is (state 3 at its maximum).
  LOWER PART, UNDER THE BED - 🔴 the thing itself is not visible. The Valance has been shoved
  OUTWARD and is springing back, and dust is lifting in front of it as a few small pencil specks.
SETTING: 🔴 the wooden Marble has rolled out of the dark and is still rolling across the boards
  (something inside pushed it out). The Rug's fringe is disturbed, the CreakBoard's wide joint is
  in frame, the blanket's shadow-free flat folds.
LAYERS: upper (room and bed) = 2 layers; under the bed = 5 layers; 🔴 and where the Valance was
  shoved outward, a 4-LAYER #5C666B WEDGE STICKS OUT past the bed line - the dark itself has
  come out a little way. Hard edges on all three.
UNDER: the Valance mid-rebound and the escaping Marble. No form.
AMBER: the wooden Marble, still rolling. 🔴 Its second appearance, and the reader should recognise
  it from p2.
FINISH: HedgeKit finished; the lifting blanket half-finished. Valance, rug, boards = flat layers.
AMBER note: nothing else on the page is amber.
TONE: the tilted horizon and the lifted dust break the balance. Contrast one step stronger than
  the pages either side. 🔴 No sound and no speed lines - the motion is in the poses and the
  tilt, nowhere else.
```

### p8 — 이불이 저 안에 있었다
```
CAMERA: side-on medium, eye level. 🔴 The right two thirds of the frame is the dark under the
  bed; the body hangs at the left.
WHO: HedgeKit + UnderThing (invisible).
SUBJECT: LEFT - HedgeKit hanging from the mattress edge by its hind feet, upper body inverted,
  head pushed in under the bed. 🔴 THE FACE IS ALREADY PAST THE BOUNDARY AND ONLY THE NECK IS
  STILL VISIBLE - the layer edge cuts it exactly at the throat. One front paw braces on the
  floor. Quills still out (state 3).
SETTING: half the blanket has slid off the mattress, crossed the floor and been drawn into the
  dark - 🔴 and where it ends cannot be seen. The BrassBed leg, the folded-back Valance, the
  Marble lying on the boards.
LAYERS: 🔴 left third = 2 layers #9BA1A2 (the body). Right two thirds = 5 layers #414A50 (under
  the bed). 🔴 THE CUT EDGE BETWEEN THEM PASSES EXACTLY THROUGH THE ANIMAL'S NECK - half of it
  is physically on another piece of paper. That is the whole composition.
UNDER: the blanket runs in and stops being visible. No form, no eyes yet.
AMBER: the Marble on the boards, small, at the frame's lower edge.
FINISH: HedgeKit finished up to the neck; 🔴 past the edge nothing of it is drawn either - the
  head is inside the dark and is not rendered. The blanket half-finished where it crosses the
  floor. Bed and valance = flat layers.
TONE: body in the light, face in the dark, and the boundary is a hard straight cut. 🔴 The
  impression is that half of it is already over there.
```

### p9 — 어둠 안쪽에 눈이 두 개 🔴 최암의 기준판
```
CAMERA: frontal close-up from a low point aimed into the space under the bed. 🔴 Almost the
  entire frame is dark; only the lower left corner is light.
WHO: HedgeKit (half a face) + UnderThing (eyes and one line of back).
SUBJECT: LOWER LEFT - half of HedgeKit's face has come in past the boundary: one eye fully round
  with the lid stroke high, nose forward, mouth closed. Quills out of frame.
  DEEP AT THE RIGHT - 🔴 TWO AMBER EYES AND NOTHING ELSE. They are the further-apart, smaller
  pair from the UnderThing sheet - 🔴 THEY HAVE MOVED BACK toward the wall, and the reader must
  read that retreat. Where the back presses against the Skirting moulding, 🔴 ONE SINGLE PENCIL
  CONTOUR LINE and no more. No fill behind it. No claws, no teeth, no snout, no outline of a body.
SETTING: the Skirting moulding and its two old nail marks, one dust ball, the blanket running in
  and disappearing, and at the extreme left edge a sliver of floor light.
LAYERS: 🔴 6 LAYERS #2C3439 - THE DEEPEST IN THE BOOK. 🔴 CORRECTION TO THE SCRIPT: the script
  asks for depth built out of "density of darkness". There is no density here - there are STEPS.
  Draw a 5-layer field first, then a 6-layer field inside it, with a HARD VISIBLE CUT EDGE
  between them, and the eyes are inside the 6-layer field. The reader cannot see what is in
  there but CAN see that there are two layers of dark and that the eyes went from the near one
  to the far one. Lower left corner = 2 layers, and a sliver of 0-layer light at the very edge.
UNDER: 🔴 eyes and one line of back. THAT IS ALL THAT MAY BE DRAWN.
AMBER: 🔴 THE EYES. Same amber #C98A2E as the marble, deliberately identical. This is the page
  where the reader connects them, and 🔴 NO LINE, ARROW OR EXTRA CUE MAY HELP THEM - the colour
  does it alone. No shine, no reflection, no catchlight on the eyes.
FINISH: HedgeKit's half face finished. The two eye discs and the one back line finished (they are
  tiny; that is why they must be exact). The skirting moulding half-finished. The dark = flat
  layers with nothing in them.
TONE: two amber points are the only bright things in the frame, and the direction of their
  retreat must read. 🔴 If any part of the dark fades softly instead of stepping, this page and
  the whole anchor have failed.
```

### p10 — 이불 자락을 꼭 쥐고 있었다
```
CAMERA: extreme close-up on one hand's breadth of the dark. The rest of the frame is dark.
WHO: UnderThing (one paw) + HedgeKit (a nose tip at the frame edge).
SUBJECT: CENTRE - 🔴 ONE FRONT PAW OF UNDERTHING, gripping a fist of blanket, and nothing else
  of it. Toes tight, 🔴 NO CLAWS, the tip of one toe drawn with a doubled contour so it reads as
  trembling. The cloth is crushed into a few deep flat paper folds inside the grip. 🔴 ABOVE THE
  WRIST THE FORM IS SWALLOWED BY THE LAYERS AND SIMPLY STOPS - do not draw an arm, a shoulder,
  a joint or a body behind it.
  AT THE FRAME EDGE - the very tip of HedgeKit's nose has come in a little way, and it is not
  moving.
SETTING: the crease structure of the gripped blanket, one pressed dust mark beside the paw, and
  🔴 ONE FOUR-TOED FLOOR MARK IN THE DUST POINTING TOWARD THE WALL (it went backwards, away).
  One loose thread floating in the dark.
LAYERS: 6 layers #2C3439 across almost the whole frame; 🔴 a small 4-LAYER #5C666B patch around
  the gripping paw only, cut with a hard edge - that is the faint light on it, and it is a
  thinner stack of paper, not a glow.
UNDER: 🔴 the paw and the gripped cloth. Nothing else may be drawn.
AMBER: none. 🔴 The eyes are not in frame on this page - that matters, because it keeps the amber
  count at four.
FINISH: the paw and the cloth folds finished. The dust mark half-finished. Everything else = flat
  layers.
TONE: the whole page is dark with one small step up around the paw. 🔴 There is no sound and no
  movement on this page, only force - a grip that is holding on and a body that is holding
  its breath.
```

### p11 — 똑, 똑
```
CAMERA: side-on medium close-up at floor height. 🔴 THE FRAME IS DIVIDED VERTICALLY INTO HALVES,
  light on the left and dark on the right.
WHO: HedgeKit + UnderThing (invisible).
SUBJECT: LEFT - HedgeKit has withdrawn its head from under the bed and laid one front paw on the
  boards, tapping twice. The body is low, and 🔴 ONLY THAT ONE OUTSTRETCHED ARM CROSSES INTO THE
  DARK SIDE. Its eyes look into the dark but it does not go in. 🔴 QUILLS SETTLED A LITTLE FOR
  THE FIRST TIME (HedgeKit state 4) - this is the visual event of the page.
  RIGHT - 🔴 no form of any kind.
SETTING: beside the tapped spot, 🔴 A SINGLE SPECK OF DUST FLICKED UP OUT OF THE FLOOR JOINT -
  the only evidence that the knock came back. The boards as two long cut edges, the Marble lying
  on the floor, the Valance half hitched, and far off the strip of light from the DoorGap.
LAYERS: 🔴 left half = 2 layers #9BA1A2. Right half = 5 layers #414A50. 🔴 THE TWO SHEETS MEET
  ALONG ONE STRAIGHT VERTICAL CUT AND NEITHER ENTERS THE OTHER - not by a hair. This is the
  script's tone note ("neither side invades the other") made physically true by the material.
  A thin 0-layer strip far off at the door.
UNDER: nothing. The dark answered and stayed where it was.
AMBER: the Marble on the boards.
FINISH: HedgeKit finished, and the settled quills are the most important marks on the page. The
  tapped board and the flicked speck half-finished. Everything else = flat layers.
TONE: two values, half and half, meeting on a hard line. The eye goes to the one lifted speck.
  🔴 No knocking marks, no sound letters, no radiating lines anywhere.
```

### p12 — 아직 한 번도 다 본 적이 없다 🔴 밀도 배급 2/2 · p1 의 판을 다시 쓴다
```
CAMERA: 🔴 IDENTICAL to p1 - wide, low angle 30cm above the floorboards, the same hard
  horizontal layer edge across the middle. 🔴 ATTACH p1's APPROVED RENDER AS A REF AND DO NOT
  MIRROR IT. This is not a mirror composition; it is the same set of paper shapes used again.
WHO: HedgeKit (above) + UnderThing (below, invisible).
SUBJECT: UPPER HALF - HedgeKit asleep on its side under the blanket, eyes closed, face at ease,
  hind feet tucked in. 🔴 BUT A FEW QUILLS ARE STILL OUT THROUGH THE BLANKET (HedgeKit state 5) -
  three or four separate strokes standing up. 🔴 THAT IS THE G-GROUP LANDING AND IT IS NOT
  OPTIONAL: the fear did not go away, only the handling of it changed.
  LOWER HALF - 🔴 EXACTLY AS ON p1: no form of any kind. The Valance has come back down and
  curtains the dark again.
SETTING: 🔴 DENSITY PAGE 2 OF 2, and the density is entirely in FOUR SMALL THINGS, because the
  reader's job on this page is to find what changed:
  (1) 🔴 TWO KNOCK MARKS in the dust on the boards - drawn as TWO SMALL PATCHES WHERE THE 1-LAYER
      PAPER HAS BEEN THINLY PEELED AWAY, not as drawn dots. The knock lifted the layer.
  (2) 🔴 THE WOODEN MARBLE, PUT BACK, sitting on the boards just in front of the dark - returned,
      not escaped.
  (3) the strip of light from the DoorGap, 🔴 still ending at the same hard point in front of the
      bed leg, exactly as on p5.
  (4) ChairGlass on the rush chair, as on p1.
  Nothing else is added and nothing is taken away. 🔴 Do NOT draw wall pattern, floorboard grain
  or fringe threads.
LAYERS: 🔴 THE SAME AS p1 - upper 2 layers #9BA1A2, lower 5 layers #414A50, one hard straight cut
  between them at the same height. Plus the 0-layer door strip. 🔴 The dark is NOT one layer
  shallower than it was. Nothing was solved.
UNDER: 🔴 nothing at all, for the twelfth time. The book never shows it, and the last page is
  where that promise is kept.
AMBER: 🔴 the returned Marble - the fourth and final appearance. Its meaning is now completely
  different from p2 and 🔴 not one word in the text says so.
FINISH: HedgeKit finished (the sleeping face and the few standing quills). The two peeled knock
  marks and the marble finished - they are the only new information in the frame. Everything else
  = flat layers, as on p1.
TONE: the same two values and the same boundary as p1. 🔴 What must read is that ONLY THE MARKS
  ON THE FLOOR HAVE CHANGED. Quiet, and nothing resolved. No sound is drawn.
```

---

## 첫 렌더 검수 체크리스트 (6항목)

1. 🔴 **어둠이 그라데이션으로 나왔나** — 부드럽게 어두워지거나 안개처럼 뭉쳐 있으면 이 앵커가 통째로 무너진다. 정답은 **엣지가 보이는 겹의 계단**이고, 특히 p9 는 **5겹 안에 6겹**이 하드 엣지로 들어가 있어야 한다. 문구를 늘리지 말고 **LayerKit 의 값 계단 플레이트와 p9 승인본을 ref 로 못 박아라**(§2.3 · §5.1 교훈).
2. 🔴 **침대 밑의 것이 그려졌나** — 발톱·이빨·주둥이·귀·전신 실루엣·크기 짐작 단서 중 하나라도 있으면 이 책이 끝난다. 열두 쪽에서 보이는 것은 **눈 두 점(p9) / 앞발 하나와 쥔 천(p10) / 등 윤곽 한 줄(p9)** 뿐이고 **p12 에는 아무것도 없다.** 새어 나오면 장면이 아니라 **UnderThing 시트를 다시 굽는다**(시트에 전신이 있으면 장면에도 나온다, §2.4).
3. 🔴 **호박이 네 쪽 밖에 있나** — 놋쇠 침대·복도 불빛·마루·난로가 호박·황동색으로 나오면 **구슬과 눈의 연결이 사라지고**(이 권의 반전 장치 전부) p2 의 구슬도 그냥 소품이 된다. 놋쇠는 **회청 판 위 가는 연필선**이다. 그리고 **p10 에 호박이 없는지** 확인한다(눈이 프레임 밖이라야 호박 횟수가 넷으로 유지된다).
4. 🔴 **빛이 0겹인가** — 문틈 빛과 낮의 볕이 노랗거나 후광·글로우·빛기둥을 가졌으면, p5 의 「딱 멈춘다」가 안 읽히고 **빛과 어둠이 같은 자로 재어지는 구조**가 깨진다. 정답은 **판을 오려낸 맨 종이**이고 그 끝은 **하드한 직선**이다.
5. 🔴 **호리 니들펠트 분리** — 콜라주는 물성이 정체라 위험하고, 이 권은 **이불이 소재**라 더 위험하다. 종이가 두꺼워 보이거나 보풀·바늘땀·천 짜임·섬유 엣지가 있으면 **그 순간 호리 라인**이다. 이불은 **한 겹의 종이 + 연필 주름선**이고, 가시가 밀어 올린 뾰족한 점들도 **그린 것**이다. `one sheet thick per layer` · `no stitching` · `no fabric weave` 를 확인한다.
6. 🔴 **근접 4권과 나란히 놓고 본다** — ① **g88**(같은 G 군 어둠 책): 하나는 **검정 책**, 하나는 **흰 책**인가. 어둠이 「비어 있음 ↔ 쌓여 있음」으로 갈렸나. 닮아 보이면 g01 의 낮 쪽(p2) 비중과 겹 엣지 가시성을 더 올린다. ② 🔴 **d01**(C9 둘째 · 같은 ② 계열): **겹의 방향**이 「창백해짐 ↔ 어두워짐」으로 갈렸나. g01 의 뒤쪽 겹이 얇게 찍혀 창백해져 있으면 그건 d01 의 문법이므로 다시 굽는다 — 이 책의 겹은 **언제나 한 방향으로 어두워진다.** ③ **f05**(C9 첫째): 무늬가 있나 없나 — g01 에 무늬 종이가 한 장이라도 들어오면 두 권이 같은 재료가 된다. ④ **g10**(같은 G 군): 「딥펜 떨림 선의 아침 ↔ 선이 거의 없는 밤」으로 갈렸나.
</content>
