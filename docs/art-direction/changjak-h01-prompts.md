# 창작동화 1000 — H-01 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`(§2.1 · §2.3 · §2.4 · §2.7 · §2.8 · §2.9 · §2.10 · §2.12 · §7.1~7.5), 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/h01.md`.** 아래 12컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다. 새로 발명한 장면 없음.
> 🔴 **이미지 생성은 이 문서가 하지 않는다.** 사용자가 직접 굽는다.
> 🔴 **작가 실명은 한 글자도 안 들어간다** — 근거 후보 id 는 §1 판정 표에만 남기고 프롬프트는 전부 문구다.

## 0. 실행 순서 (어기면 인물만 매끈한 CG 로 나온다 — §2.4)

1. **STYLE ANCHOR 로 시트 3장을 먼저 굽는다. 장면 금지.** 순서 = 🔴 `BakeryFrame`(테두리 + 기준물) → `GeckoWait` → `BakerHands`.
   🔴 **`BakeryFrame` 이 이 라인에서 가장 중요한 시트다.** 이 권의 정체는 그림체가 아니라 **매 쪽 같은 테두리**이고, 테두리가 쪽마다 다르게 그려지면 「아무 일도 안 일어난다」는 이 책의 내용이 통째로 사라진다. §2.14(물성이 정체인 앵커는 재료 시트가 캐릭터 시트보다 먼저)를 그대로 적용한다.
2. 시트가 승인되면 `@image1`(BakeryFrame) · `@image2`(GeckoWait) · `@image3`(BakerHands)를 붙여 컷을 뽑는다.
3. 🔴 **굽는 순서 = p1 → p4 → p7 → 나머지 여덟 → p11 은 p4 승인본을 ref 로, p12 는 맨 마지막.**
   - **p1** = 무대와 테두리의 기준판. 반죽 높이 0 이 여기서 정해진다.
   - **p4** = 🔴 **매크로 규약의 기준판**(발 · 반죽 표면 · 눌린 자국). p11 이 이것과 **같은 그림처럼 보여야** 하므로 여기가 흔들리면 이 책의 「자랐다」가 없어진다.
   - **p7** = 무텍스트 쪽. 한 화면 네 칸 + 네 겹의 테두리. 🔴 이 한 장이 실패하면 §2.12 밀도 배급이 무의미해진다.
   - **p11** = p4 승인본을 ref 로 붙여 **같은 각도·같은 거리**로. 좌우 반전 금지.
   - **p12** = 유일하게 테두리가 바뀌는 쪽(오븐 아가리). 마지막에 굽는다.
4. 승인 렌더 3장을 앵커 ref 슬롯에 넣는다 — 🔴 **테두리가 온전히 보이는 전체 장면 1(p1) · 매크로 1(p4) · 방이 평칠 색면으로만 남은 컷 1(p2 또는 p8)**. 3장이 전부 소품이 다 그려진 컷이면 「방은 평칠 색면뿐」이라는 문구가 영영 안 먹는다(점눈이에서 실제로 겪은 일, §2.7 보정).
5. 앵커 이름은 **렌더를 보고 짓는다**(§7.5-3). 지금은 슬러그만: `changjak-h01`.

---

# H-01 「빵이 부푸는 동안」

주제군 **H 호기심·만들기·직업** / 엔진 **관찰과 성장** / 무대 프랑스 빵집 / 주인공 도마뱀붙이 + 빵집 주인(말 없음) / **12스프레드** · 🔴 **본문 250자 = 이 라인 최단** · 후렴 「창밖은 아직 어두웠다」 3회 · **p7 무텍스트**

## H-01 §1. 앵커 배정

**한 줄**: 🔴 **매 쪽이 똑같은 테두리 안에서 열린다.** 테두리는 빵집 도구가 반복되는 띠이고 그 안은 불투명 평칠이다. **반죽은 테두리가 재고**(글자·숫자 없이), **아주 작은 일 하나만 테두리를 넘는다** — 화면에서 유일한 규칙 위반이 그 쪽의 사건이다. 앵커 슬러그 `changjak-h01` — **신규 민팅** (🔴 **C5 셋째**, 공정이 a97·h03 과 다르다).

### 이 권이 그림에 요구하는 것 (판정의 전제 — 후보는 이 여섯을 통과하는지로만 봤다)

1. 🔴 **본문 250자. 이 라인에서 가장 짧다.** 글이 못 하는 일을 그림이 전부 한다. 그런데 그림이 해야 하는 일은 **사건을 보여주는 것이 아니라 사건이 없다는 것을 보여주는 것**이다.
2. 🔴 **「아무 일도 안 일어남」을 형식이 져야 한다.** 매 쪽이 새 그림처럼 보이면 이 책은 그냥 삽화집이 된다. **같은 것이 열두 번 반복돼야** 정적이 성립하고, 그러면 아주 작은 변화가 사건이 된다.
3. 🔴 **반죽이 쪽마다 조금씩 커진다 — 유일한 진행이다.** 그런데 그림 안에 글자·숫자를 못 쓴다(5개 언어 공용). 높이를 재는 **자**가 화면 안에 있어야 한다.
4. 🔴 **p4 와 p11 은 같은 앵글·같은 행동**이고, 자국이 사라지는 속도만 다르다. 대본 note 가 「그림이 다르면 책이 성립하지 않는다」고 못 박았다. **표면 질감이 정보**라는 뜻이고, 형태를 뭉개는 매체는 원천 탈락이다.
5. 🔴 **p7 은 본문이 비어 있다**(무텍스트) — §2.12 우선권이 자동 발동한다. 동시에 대본이 「밀도가 아니라 빛줄기 선 하나로 버티는 쪽」이라고 밀도를 스스로 제한해 뒀다. **밀도를 소품이 아닌 곳에 배급해야 한다.**
6. 🔴 **주인공은 눈꺼풀이 없어 표정이 안 변한다.** 감정은 전부 목·꼬리·발가락·몸이 붙은 면적이다(§7.3.1-3 통로). 그리고 사람은 얼굴이 열두 쪽 내내 프레임 밖이다 — **얼굴 연기가 아예 없는 책**이다.

### 후보 3

| | 후보 ① **C5 · 손그림 장식 테두리 + 그 안 불투명 평칠** (`lejonc-fechamos` · `davis-guitar` · `grey-dishspoon`) | 후보 ② C7 회화적 톤 (새벽 부엌 유화) | 후보 ③ C8 수채 번짐 (발효·습기) |
|---|---|---|---|
| 매체 | 탁한 버프 종이에 불투명 평칠 + 갈검 한 색 테두리 선 | 붓 톤, 따뜻한 명암, 아궁이 광원 | wet-in-wet + 마른 뒤 잉크 선 |
| 이 권에 맞는 이유 | 🔴 요구 2·3 을 **한 장치가 동시에** 해결한다 — 같은 테두리가 열두 번 반복되니 정적이 형식이 되고, 그 테두리 안쪽 변이 **반죽을 재는 자**가 된다. 그리고 C5 의 정서에 **공방**이 명시돼 있고(§7.1) H 주제군 1순위 근거가 「유럽 공방·시장은 장식 프레임·무대 구도가 내용-형식 필연성을 만든다」다 | 새벽 빵집의 온기·습기를 그리기에 가장 쉽고 예쁘다 | 발효는 습기와 온기의 일이니 물성이 주제와 같다 |
| 리스크 | 테두리가 장식으로만 남고 안이 심심해질 수 있다 → **테두리를 자로 쓰고, 넘는 것을 사건으로 쓰고**, p7·p10 에 밀도를 배급해 세 겹의 일을 시킨다 | — | — |
| 판정 | ✅ **추천** | 탈락 — ① C7 이 이미 둘(e09·b09) ② 🔴 결정적: **붓 톤은 「아무 일도 안 일어남」을 못 쓴다.** 회화는 매 쪽이 새 화면이라 반복이 안 생기고, 정적이 「조용한 분위기」로만 남는다 ③ 반사광이 반죽 높이를 뭉갠다(요구 3) | 탈락 — ① 🔴 **a91 이 같은 공정**(흡수지 워시 + 마른 잉크선)이고 이 라인 최대 근접이 된다 ② **요구 4 와 정면 충돌** — 이 책은 눌린 자국의 깊이·밀가루 실금·물방울 경계가 정보인데 wet-in-wet 이 전부 뭉갠다(§7.3.1-1) ③ C8 은 8권 상한이라 아껴야 한다 |

추가 탈락: **C1 나이브** — 🔴 **e01 이 같은 프랑스 빵집에서 C1 이다.** 같은 무대를 같은 클러스터로 그리면 두 권이 같은 책이 된다(라인 내 중복이 개별 최적보다 우선, §7.6 전례). **C4 평면** — §2.8 표정 없음은 이 권엔 비용이 아니지만(주인공이 원래 무표정) **라인이 C4 를 이미 셋 썼고**(b01·e120·b04) 도형 언어로는 반죽 표면의 질감을 못 그린다. **C3 · C6** — 셋·넷으로 금지(§7.5-0). **C9** — f05 가 오리기, g01 이 겹치기로 두 계열을 다 썼다.

### 🔴 추천 = 후보 ① — 테두리가 자이고, 테두리를 넘는 것이 사건이다

근거 세 줄:

- **형식이 곧 내용이다.** 열두 쪽이 같은 테두리 안에서 열리므로 **책 자체가 「기다림」의 모양**을 갖는다. 아무 일도 안 일어나는 이야기에 회화적 변주를 주면 그 순간 이야기가 사라진다 — 이 권은 반복이 미덕인 유일한 경우다.
- **자가 화면 안에 있다.** 반죽 높이를 **테두리 안쪽 아래 변에서 반죽 정수리까지**로 잰다. 글자·숫자 금지를 프레임이 해결한다(g88 이 「빛이 센다」로 푼 것의 사촌, §7.10).
- **사건이 규칙 위반이다.** 정적인 구조에서 유일하게 프레임을 넘는 것이 그 쪽의 작은 일이고, 그것은 언제나 **화면에서 가장 작고 가장 밝은 것**이다.

🔴 **새로 확립한 §2.9 변형 = 「가장 밝은 색이 그 쪽의 사건이고, 그것은 언제나 화면에서 가장 작다.」**
지금까지 여섯 변형(더하기 a04 · 덜어낸 자리 a91 · 들어낸 자리 e09 · 덮인 층 c60 · 주인공의 재료 c01 · 유일하게 칠한 밝음 e01)에 일곱째가 붙는다. 이 변형의 힘은 **악센트가 사물에 붙지 않는다**는 것이다 — 순백은 물방울·먼지·불티·튄 물처럼 **매번 다른 것**이고, 공통점은 「그 쪽에서 유일하게 움직인 것」뿐이다. **사건이 없는 권·관찰 엔진 권 전체에 재사용할 것.**

🔴 **두 번째로 확립한 것 = 「반복이 곧 자다」.** a97 이 「반복이 곧 여백이다」를 세웠다면(같은 것을 반복하면 정보량이 0 이 된다), 이 권은 **반복이 계측 기준을 만든다**를 세운다 — 매 쪽 완전히 같은 테두리가 있으면 그 안의 아주 작은 차이가 **정량적으로** 읽힌다. 「무언가가 조금씩 자라는 권」 전체에 재사용할 것.

### 🔴 C5 셋째를 여는 근거 — a97·h03 과 공정이 다르다 (§2.13 · §7.5 조건)

🔴 **h03 「구두 한 켤레가 생기기까지」가 같은 세션에서 C5 를 먼저 썼고, 하필 같은 H 주제군 · 같은 유럽 공방 실내다.** 이건 이 배정에서 가장 무거운 근접 위험이므로 정면으로 다룬다. 그리고 §7.5 가 요구하는 관행대로 **왜 감수했나와 다음엔 닫는다**를 §7.21 에 적어 뒀다.

| 축 | **a97** (C5 첫째) | **h03** (C5 둘째) | **h01** |
|---|---|---|---|
| 🔴 **공정** | 같은 도장을 **화면 안에서 반복해 찍는다**(스텐실·스탬프) | **넓은 색면을 겹쳐 찍고** 그 위에 가는 니브 선을 하나하나 | 🔴 **인쇄가 한 점도 없다.** 붓으로 불투명 평칠 + **손으로 그린 장식 테두리** |
| 🔴 **정체** | 반복 필드 | 갈색 한 잉크의 **겹수 3단** | 🔴 **매 쪽 같은 테두리**(h03 에는 테두리가 없다) |
| 반복의 단위 | 한 화면 안(라벤더 수천 그루) | 방의 구조를 매 쪽 같은 판으로 | 🔴 **쪽과 쪽 사이**(같은 테두리 열두 번) |
| 종이 | 차가운 회백 #E9E6E4 | 꿀빛 크림 인쇄판 #EDE6D6 | 탁한 따뜻 버프 #C9BBA4 |
| 악센트 | 흰 거품 ↔ 노란 꽃가루가 **교대** | 붉은 실의 **길이**가 자란다 | 🔴 **순백 알갱이가 매 쪽 자리를 바꾼다**(사물이 매번 다르다) + 창 파랑 1회 |
| 시간 | 하루 | **반년**, 창이 다섯 번 갈린다 | 🔴 **한 새벽**, 창은 마지막에 한 번 |
| 엔진이 시키는 일 | 반복 위에서 두 색을 찾기 | 물건이 **쌓인다**(누적·반복) | 🔴 **아무것도 안 쌓인다**(관찰과 성장 — 자라는 것은 반죽 하나) |
| 밀도 | 밭이 화면 80% | 도구벽·소품 촘촘 | **테두리** 촘촘, 안은 평칠 |
| 팔레트 온도 | 회백 + 보라 | 꿀빛·갈색 3겹(마르고 따뜻) | 🔴 **버프 + 젖은 회녹**(습기가 축이다) |

🔴 **갈라 둔 것 중 결정적인 둘 = ①인쇄 ↔ 손칠 ②테두리 유무.** 썸네일에서 h03 은 **겹쳐 찍은 갈색 방**이고 h01 은 **테두리를 두른 버프 창**이다. §2.13 대로 클러스터 라벨이 아니라 **공정이 정체를 정한다**(전례 = C3 셋 · C4 넷 · C6 넷 · C7 셋).

### 라인 충돌 확인 (필수)

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 2D 평칠 + 선. 실물 입체 재료 없음 — 🔴 단 이 권은 **천이 소재**라 검수 항목으로 올린다(검수 5번). 젖은 천은 **평칠 한 겹**이고 짜임·바늘땀·보풀이 없다 |
| 전래동화 **점눈이** | ✕ (4축 전부 분리) | ① **종이색** — 점눈이는 밝은 크림(=햇빛), 여기는 **탁한 따뜻 버프**(밀가루 자루색, 크림보다 한 단 어둡고 회색기) ② **얼굴** — 점눈+실선 입이 아니라 **눈꺼풀 없는 큰 원반 눈 + 세로 동공 한 줄 + 비늘 알갱이**, 눈썹이 아예 없다 ③ **악센트** — 🔴 **빨강이 한 점도 없다.** 순백과 창 파랑이다 ④ **매체** — 느슨한 색연필 낙서가 아니라 **불투명 평칠 + 갈검 테두리 선** |
| **a97**(C5 첫째) | ✕ | 위 표 |
| **h03**(🔴 C5 둘째 · 같은 H 군 · 같은 유럽 공방 — 최대 근접) | ✕ (9축 분리) | 위 표. 결정적으로 **인쇄 ↔ 손칠**과 **테두리 유무**. 🔴 첫 렌더를 반드시 나란히 놓고 본다(검수 6번) |
| **e01**(🔴 같은 프랑스 빵집 — 최대 위험) | ✕ | 아래 별도 표 |
| **b09**(같은 공방 무대 · 독일 시계공방) | ✕ | b09 = 꿀빛 나무판에 **기름 글레이즈**로 얇게 덮고 산 것만 불투명하게 얹는 회화(C7). 여기 = **종이에 불투명 평칠**이고 나뭇결이 비치지 않으며 **테두리가 정체**다 |
| **f05**(무늬 종이 오리기) | ✕ | f05 는 **무늬 종이를 오려 붙인다**(엣지가 정체). 여기는 무늬 종이도 오리기도 없고 **그린 테두리 + 붓으로 칠한 면**이다 |
| 세계명작 수채 그림풍 | ✕ | 불투명 평칠. 붓 톤·번짐 없음 |

### 🔴 e01 「빵집에서 재채기하면 안 되는 이유」 과의 분리 (같은 무대 · 같은 소재 — 이 라인에서 가장 위험한 쌍)

두 권 다 프랑스 빵집이고 반죽·밀가루가 나온다. **7축을 정반대로 갈랐다.**

| 축 | **e01** (터지고 흩어진다) | **h01** (아무 일도 안 일어난다) |
|---|---|---|
| 클러스터·공정 | **C1** — 흰 종이에 굵은 검정 스틱, **획을 안 그린다** | **C5** — 버프 종이에 **손그림 테두리 + 불투명 평칠**, 같은 프레임이 반복된다 |
| 판 | 차가운 흰 #F2F2EF (밝다) | 탁한 따뜻 버프 #C9BBA4 (한 단 어둡고 회색기) |
| 프레임 | **테두리 없음.** 화면이 사방으로 흘러 나간다 | **매 쪽 같은 테두리.** 넘는 것은 그 쪽의 작은 일 하나뿐 |
| 여백 | **최대** — 한 쪽은 화면 80%가 맨 종이 | **최소** — 테두리가 화면을 두르고 안은 평칠로 꽉 차 있다 |
| 물성 | **마른 가루**(콩테 알갱이·문지른 손자국) | **젖은 얼룩**(하드에지 습기) + 불투명 평칠 |
| 불 | 🔴 **오븐 불이 유일 악센트**이고 화면 최강점 | 🔴 **불을 색으로 그리지 않는다.** 주황·노랑·빨강이 팔레트에 아예 없다 |
| 카메라·시간 | 넓게 흔들리는 대각선, 8회 폭발 | 프레임 고정 + 매크로, 정지. 사건이 없다 |

🔴 **불을 안 그리는 결정이 이 분리의 핵심이다.** 그리고 그 결정이 주제와도 맞물린다 — 도마뱀붙이는 스스로 온기를 못 만드는 몸이라 **온기를 보는 게 아니라 느낀다.** 그래서 이 책에서 따뜻함은 **판이 그쪽에서 짙어지는 것**과 **몸이 향하는 방향**으로만 읽힌다.

### 🔴 대본 SCENE 결함 5건 — 그림에서 교정한다

대본은 광원·초점·농도로 여러 쪽을 적어 뒀다. 이 앵커는 평칠이라 그 수단이 없다. 다섯 곳을 **평칠 안의 수단**으로 옮겼다. **대본 문구 수정은 불필요** — 삽화 지시만 분기한다.

| # | 대본 | 문제 | 그림 처방 |
|---|---|---|---|
| 1 | p1 톤 「광원은 오븐 아궁이 하나뿐」 | 🔴 발광 오븐은 이 권 최대 실패 모드(e01 과 겹친다) | **불을 그리지 않는다.** 오븐 쪽 방을 **판의 한 단 짙은 색 #B49877** 으로 칠하고, 아궁이 안은 **갈검 평칠**. 불티 순백 두 점이 그 쪽의 작은 일 |
| 2 | p2 톤 「윤곽선만 밝게 뜨고 얼굴은 반쯤 그늘」 | 림라이트는 CG 조명 효과(g88 교훈) | **평칠 두 값의 맞댐**으로. 도마뱀 몸의 위쪽 절반과 아래쪽 절반이 서로 다른 값이고 경계가 하드에지다 |
| 3 | p5 톤 「화면이 한 단 평평해 보인다」 | 이 앵커는 원래 평면이라 대비가 안 생긴다 | 🔴 **자국 안의 초승달 하나로** 쓴다 — p4 에는 자국 안에 갈검 초승달이 있고 **p5 에는 그것이 없다.** 사라진 도형 하나가 「없어졌다」다 |
| 4 | p7 「빛줄기 선 하나로 버티는 쪽」 | 이 앵커엔 빛줄기가 없다(평칠) | 🔴 **빛줄기를 「먼지 한 알갱이의 이동」으로 옮긴다.** 순백 알갱이 하나가 네 칸에서 위치만 달라지고 마지막 칸에서 테두리를 넘는다. 대본 명제(보지 않는 사이에도 시간이 간다)는 유지되고 수단만 바뀐다 |
| 5 | p12 「액자 안 작업실 부분만 초점을 살려」 + 「빈 나무 한 뼘이 화면에서 가장 밝은 빈자리」 | 초점(블러) 금지 + 순백은 알갱이 전용 | 초점이 아니라 **마감 위계**: 테두리 안쪽만 마감, 오븐 벽돌 테두리는 갈검 평칠. 그리고 빈 한 뼘은 순백이 아니라 **판의 한 단 밝은 색 #DBCBB0** 으로 — 화면에서 가장 밝은 **면**이지 가장 밝은 **점**이 아니다 |

### 밀도 배급 (§2.10 · §2.12)

**p7 이 무텍스트라 §2.12 우선권이 자동 발동한다.** 그런데 대본이 그 쪽의 밀도를 스스로 제한해 뒀으므로(소품은 그릇·젖은 천·물 사발 셋뿐), 🔴 **밀도를 소품이 아니라 「구조」에 배급한다** — **네 칸 각자가 완전한 테두리를 갖는다**(즉 이 쪽에는 테두리가 네 겹 있다) + 칸 사이 갈검 띠. 이 라인에서 밀도가 구조로 간 첫 사례다.

두 번째 슬롯은 **p10**(천이 걷히는 쪽) — 부푼 반죽 표면의 밀가루 실금, 그릇 안쪽 벽의 **처음 높이 자국선**, 걷히는 천의 주름. 두 높이가 한 화면에 있는 유일한 쪽이라 정보가 있어야 성립한다.

🔴 **밀도는 소품과 테두리에만.** 벽돌 켜·나뭇결·서까래·바구니 짜임을 그리면 두 쪽이 다 죽는다.

### 의인화 등급 (a91 에서 확립한 규칙 재사용 — 고정)

- 🔴 **도마뱀붙이 = 완전 사족.** 네 발이 언제나 무언가에 붙어 있다. **서지 않고, 물건을 들지 않고, 손짓하지 않는다.** 앞발이 하는 유일한 일은 **누르는 것**이다.
- **주인 = 사람 어른.** 🔴 **얼굴이 열두 쪽 내내 프레임 밖 또는 그늘**이다(대본이 이미 정했다). 팔뚝과 손만 존재하고, 말을 하지 않는다.
- 🔴 **포즈가 안 되면 도마뱀에게 손을 주지 말고 카메라를 바꾼다.**
- 이 결정이 e01 과도 갈린다 — e01 의 생쥐는 **이족**이고 앞발이 손이다.

---

## H-01 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-h01  (gecko / French bakery / waiting for dough to rise)

Style: a hand-painted picture-book page for 4-6 year olds. Warm, still, patient. Almost
  wordless - the drawing carries the whole book. It should look like the SAME WINDOW opened
  twelve times.

MEDIUM: opaque flat gouache on dull warm buff paper, plus a drawn decorative border in one
  dark brown-black line. Shapes are filled FLAT - one single value each, edge to edge - with
  the brush edge left visible where a fill ends and a faint chalky streak where the gouache
  was thin. There is NO modelling, NO shading, NO gradient, NO highlight and NO reflected
  light anywhere.
  🔴 WET THINGS ARE PAINTED AS A FLAT PATCH OF A DIFFERENT COLOUR WITH A HARD EDGE. A damp
  cloth is not a shaded cloth; it is a differently coloured shape whose boundary is crisp,
  exactly as a real damp patch is. Nothing in this book is ever soft-edged.
  Line is used for only three things: the border, the contours of the gecko and the hands,
  and one or two strokes of wood grain.

PALETTE: four working colours and two spot colours. Nothing else exists in this book.
  GROUND BUFF #C9BBA4 - the paper and most of the room.
    ONE DARKER STEP #B49877 - used ONLY for the part of the room nearer the oven.
    🔴 WARMTH IN THIS BOOK IS A DARKER GROUND, NEVER A GLOW.
    ONE LIGHTER STEP #DBCBB0 - used only for a deliberately empty area of bare table.
  SOOT BROWN-BLACK #33291F - the border line, contours, the inside of the fire door, darkness.
  WET GREY-GREEN #7E8A80 - the damp cloth, the water bowl, steam, anything holding water.
  DOUGH CREAM #E4D8C0 - the dough and loose flour. One step lighter than the ground, and it is
    NOT white.
  SPOT 1, PURE WHITE #FBF7EE - 🔴 THE BRIGHTEST COLOUR IN THIS BOOK IS RESERVED FOR THE ONE
    SMALL EVENT ON EACH PAGE, AND IT IS ALWAYS THE SMALLEST THING IN THE FRAME: a droplet, a
    dust mote, a spark, a splash, a grain. Nothing large is ever pure white - not the dough,
    not the cloth, not the flour, not the window.
  SPOT 2, WINDOW BLUE #4E6E8C - appears ON THE LAST PAGE ONLY. Eleven pages of soot-black
    window, then blue. There is no blue anywhere before it.
  🔴 THERE IS NO FIRE COLOUR IN THIS PALETTE. The oven fire is never drawn as orange, yellow,
  red or any warm hue. Heat is shown by the darker ground step, by two white sparks, and by
  which way a cold-blooded body turns itself. A glowing oven mouth is the failure mode of
  this book.

THE BORDER IS THE ANCHOR - read this twice.
  Every page opens inside the SAME drawn decorative border, about 7% of the short side wide.
  The border is a repeating band of bakery tools, drawn in soot line on bare ground: a wheat
  ear, a round sieve, a rolling pin, the woven lattice of a proving basket - then repeat, in
  that order, all the way round. It is IDENTICAL on every page: same motifs, same order, same
  width, same line weight. DO NOT redesign it per page and do not vary it for mood.
  🔴 THE BORDER IS THE RULER. The height of the dough is read as the distance from the INNER
  BOTTOM EDGE of the border up to the top of the dough. This is how the book counts without
  ever using a numeral or a letter.
  🔴 EXACTLY ONE THING CROSSES THE BORDER ON EACH PAGE: that page's one small white event.
  One or two white specks lap over the border line and sit outside it. NOTHING ELSE EVER
  LEAVES THE FRAME. The only rule-breaking mark on the page IS the event of that page.
  ONE EXCEPTION IN THE WHOLE BOOK: on the last page the border itself becomes the sooted
  brick of an oven mouth, because the viewpoint has moved inside the oven.

FINISH HIERARCHY - about how FINISHED each area is, NOT about opacity or focus.
  1. THE BORDER = worked. Every motif drawn, all the way round, on every page.
  2. THE DOUGH SURFACE, THE GECKO'S FEET AND THROAT, AND THAT PAGE'S WHITE EVENT = finished.
  3. EVERYTHING ELSE IN THE ROOM = FLAT SHAPES ONLY. One colour each and no interior detail:
     no brick courses, no wicker weave, no tile joins, no more than two strokes of wood grain,
     no individual logs beyond their outlines.
  🔴 The room is NOT faded, hazy, blurred or out of focus - it is simply filled flat and left
  alone. A soft atmospheric interior is wrong; a flat coloured shape is right.

CHARACTER DESIGN: the gecko HAS NO EYELIDS, so its face never changes. Its eye is one large
  flat disc with a single vertical slit pupil, and that is the entire face - no eyebrows, no
  mouth line beyond the jaw contour, no blush, no catchlight.
  🔴 ALL FEELING IS CARRIED BY: the neck (how far it turns and stretches), the tail (its curve
  and whether the tip flicks), the SPREAD OF THE TOES, and how much of the belly is pressed
  flat against a surface. Toes are drawn as five splayed pads with fine cross-ridges visible.
  The body is one smooth mass with a granular skin speckle.
  🔴 HUMAN FACES ARE NEVER SHOWN. The baker exists as forearms and hands only, always cropped
  by the frame or turned away into flat soot shadow.

ANTHROPOMORPHISM GRADE (fixed): the gecko is FULLY QUADRUPEDAL. All four feet always touch
  something. It never stands upright, never holds an object, never gestures, never points.
  Pressing with one front foot is the only thing its front feet ever do.

SETTING: a French village bakery back room before dawn - a brick barrel oven with a low iron
  fire door, split logs stacked beside it, a long wooden work table, a glazed earthenware bowl
  with a damp cloth over it, a water bowl and a small brush, a balance scale, a long wooden
  peel, a rolling pin hung on the wall, a plain undyed sacking flour sack with no printing, an
  empty milk bottle on the sill, a small window onto a stone lane, dried wheat on the wall.
  European, no Asian architectural motifs.

CANVAS: 16:9 double-page spread, 4-6 year old picture book. 🔴 Keep the bottom 18% inside the
  border quiet and free of key subject matter (a caption band is laid over it later).

NOT: NOT digital airbrush / NOT gradients / NOT glow, bloom, halo or lens flare / NOT a
  glowing orange oven / NOT any orange, yellow or red anywhere in the image / NOT modelling,
  shading or reflected light inside a flat shape / NOT rim light / NOT glossy 3D CG render /
  NOT cel-shaded anime / NOT photographic / NOT depth-of-field blur / NOT a texture filter
  laid over flat colour / NOT every brick, wood grain, log or wicker strand drawn to
  completion / NOT a uniform finish across the page / NOT more than one thing crossing the
  border / NOT a border that changes design between pages / NOT pure white on anything large /
  NOT any lettering, numerals, price tags, chalkboards, shop signs, bottle labels or sack
  printing anywhere in the image / NOT wool felt, NOT stitching, NOT thread, NOT fabric weave,
  NOT fuzzy or fibrous edges, NOT needle-felted wool, NOT sculpted clay (another line owns
  those).
```

### 🔴 이 앵커의 세 불변 규칙 (매 컷 반복 확인)

**규칙 A — `DOUGH:` 는 테두리로 재는 물리량이다.** 기준선은 **그릇 테두리**이고, 자는 **테두리 안쪽 아래 변**이다.

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 완전 평평 | 🔴 **p1 과 같다** | 아주 살짝 늘어짐 | 그릇 테두리와 나란함 | 같음(자국만 사라짐) | 곡선이 처음 읽힘 | 🔴 네 칸에 1→1.5→2→2.5 마디 | 두 마디 반(등 뒤) | 그릇 테두리보다 확실히 높다 | 그릇 위로 넘쳤다 | 넘친 채(p4 와 같은 각도) | 🔴 **새 그릇, 다시 평평** |

🔴 **p1 과 p2 가 같아야 한다.** 여기서 자라면 「지켜보는 동안에는 아무 일도 안 일어난다」가 첫 쪽에서 무너진다.

**규칙 B — `TINY:` 는 그 쪽의 유일한 사건이고, 그것만 테두리를 넘는다.** 순백 #FBF7EE, 화면에서 가장 작은 것, 한 쪽에 **하나만**.

| p1 | p2 | p3 | p4 | p5 | p6 |
|---|---|---|---|---|---|
| 아궁이 불티 두 점 | 밀가루 위 발자국의 발가락 하나 | 장작에서 오른 재 알갱이 하나 | 걷힌 천에 맺힌 물방울 하나 | 발가락에 묻은 밀가루 알갱이 셋 중 하나 | 흩뿌린 물방울 중 튄 것 하나 |

| p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|
| 🔴 **먼지 한 알갱이가 네 칸을 가로지른다** | 창밖 우유통에서 튄 한 방울 | 들린 천 끝에서 떨어지는 물방울 하나 | 걷히는 천에서 떨어지는 물방울 둘 | 실금이 벌어지며 튄 가루 알갱이 하나 | 🔴 **화덕 바닥에서 떠오른 밀가루 알갱이 하나** — 그리고 그 방향이 새 그릇 쪽이다 |

**규칙 C — `HEAT:` 는 색이 아니다.** 오븐 쪽 방은 판의 **한 단 짙은 색 #B49877**, 아궁이 안은 **갈검 평칠**, 불티만 순백. 🔴 주황·노랑·발광이 있으면 그 컷은 실패다.

---

## H-01 §3. 캐릭터 시트 (🔴 이것부터 굽는다 — BakeryFrame 이 첫 번째다)

```
CHARACTER SHEET - BakeryFrame   (bake this FIRST, before any character and any scene)

🔴 THIS IS THE MOST IMPORTANT SHEET IN THIS BOOK. It is not a scene. It is the border plus the
  fixed props, drawn in the same medium as the book: opaque flat gouache on dull warm buff
  paper #C9BBA4, with all line work in one soot brown-black #33291F. No orange, no yellow, no
  red, no blue anywhere on this sheet.

PLATE 1 - THE BORDER, drawn once, complete, as a full 16:9 rectangle:
  A decorative band about 7% of the short side wide, running all the way round the image.
  Inside the band, drawn in soot line on bare buff ground, a repeating sequence of four bakery
  motifs, in this fixed order, repeating round the whole frame:
    (1) an ear of wheat, lying along the band
    (2) a round sieve seen face on, its rim doubled
    (3) a rolling pin with two handles
    (4) the woven diagonal lattice of a proving basket, shown as a short square patch
  The motifs are line only. They are NOT filled with colour. The band has a single thin soot
  rule on its inner edge and a single thin soot rule on its outer edge.
  🔴 Draw a small tick on the inner bottom rule at the exact centre - this is where the dough
  height will be measured from. Do not draw the tick in the book itself; it exists on this
  sheet so the height rule is unambiguous.
  🔴 THIS BORDER MUST BE REPRODUCIBLE IDENTICALLY TWELVE TIMES. Keep it simple enough that it
  can be.

PLATE 2 - THE FIXED PROPS, each drawn alone on bare ground, flat filled, no shading:
  - THE BOWL: a glazed earthenware bowl, wide and low, its rim a simple ellipse, drawn TWICE -
    once empty, once with a damp cloth laid over it. 🔴 The cloth is WET GREY-GREEN #7E8A80
    flat fill; where it has soaked and clung to the bowl's curve, the colour is the same but
    the SHAPE follows the curve with a hard crisp edge. No shading, no folds rendered in tone -
    folds are separate flat shapes.
  - THE DOUGH: a low dome in dough cream #E4D8C0 with a thin dusting of the same colour on
    top, drawn at three heights (level with the rim / one finger above / spilling over), and
    beside them one large detail of the surface showing the fine cracked lines that open in the
    flour dust as it rises. 🔴 The dough is NOT white.
  - THE WATER BOWL AND BRUSH: wet grey-green flat, brush handle soot line.
  - THE BALANCE SCALE, THE LONG WOODEN PEEL, THE ROLLING PIN: flat buff with two strokes of
    grain each, contours in soot.
  - THE FIRE DOOR: a low iron door in a brick arch, drawn OPEN and CLOSED. 🔴 Inside it is
    FLAT SOOT BLACK, not fire. Two pure white #FBF7EE specks above it are the sparks - and
    they are the only pure white on this whole sheet.
  - THE WINDOW: a small four-pane window with a deep sill and an empty milk bottle with NO
    label on it. 🔴 Drawn twice: pane fill SOOT BLACK (pages 1-11) and pane fill WINDOW BLUE
    #4E6E8C (page 12 only).
  - THE TABLE TOP: a flat buff plane with two strokes of grain and a thin scatter of dough
    cream flour, plus one small patch of the LIGHTER STEP #DBCBB0 to establish that value.
SCENE tokens: Border, DoughBowl, WetCloth, WaterBowl, FireDoor, LaneWindow, WorkTable.
```

```
CHARACTER SHEET - GeckoWait   (bake this SECOND, before any scene)

🔴 THE SHEET IS DRAWN IN THE SAME MEDIUM AS THE BOOK. Opaque flat gouache on dull warm buff
  paper #C9BBA4, contours in soot brown-black #33291F, no shading anywhere. Do NOT render this
  animal smoothly or glossily just because there is no background behind it. No orange, no
  yellow, no red.

FACE: 🔴 THIS ANIMAL HAS NO EYELIDS AND ITS FACE NEVER CHANGES. The eye is one large flat disc
  in a pale buff-grey with ONE vertical slit pupil in soot, and a fine soot ring round the disc.
  There are no eyebrows and no separate mouth line - the mouth is simply where the jaw contour
  runs, and it can part very slightly and nothing more. No blush, no catchlight, no highlight.
  The snout is blunt and rounded; two small nostril dots on top of it.
BODY: one smooth mass, flat filled in a soft warm grey-buff one step from the ground, with a
  granular speckle of tiny soot dots over the back and flanks (skin, not fur, not fibre).
  The belly is a flatter paler shape with a hard edge where it meets the flank - 🔴 that edge
  is how the reader sees how much of the body is pressed to the surface.
FEET: 🔴 THE FEET ARE THE PERFORMANCE. Five toes on each foot, splayed wide like a fan, each
  toe a rounded pad with three or four fine cross-ridge lines drawn on its underside. Draw one
  large detail of a single front foot from directly beneath, ridges and all, and beside it the
  same foot pressed onto a soft surface leaving a shallow dish.
  🔴 The toes GRIP: on wood, on the glazed curve of a bowl, upside down under a table edge.
  They never curl into a fist and they never hold an object.
TAIL: one long smooth taper, wider at the base, with a faint segmented banding drawn as thin
  soot rings. Draw it in three states: laid in a loose S on a surface / drooping down a table
  leg / with only the tip flicked up.
BUILD & SILHOUETTE: small, low, wide-footed, flat-bellied. Readable at thumbnail size against
  a human hand and a bowl. It is always seen with all four feet on something.
REFERENCE SHEET - 🔴 FIVE POSTURES, AND THESE FIVE ARE THE WHOLE EMOTIONAL RANGE OF THE BOOK:
  1. LYING FLAT AND WATCHING - belly fully pressed down, front legs straight so the chest is
     lifted a little, tail in a loose S, eye on one point.
  2. TURNING THE SIDE TO HEAT - body rotated so one flank is broad to the left, one front foot
     lifted and planted, snout raised, and the thin skin under the throat visibly moving.
  3. NECK ONLY - the body and all four feet stay pointed one way while the neck twists a full
     90 degrees the other way, one front foot frozen in the air, mouth parted a crack.
  4. PUSHED UP TALL - front legs straight and locked so the chest is as high as it will go, the
     nape stretched long, hind feet still flat, tail tip just lifted. (Surprise, from behind.)
  5. 🔴 BESIDE, NOT TOUCHING - lying flat next to something, snout aimed at it, and BOTH FRONT
     FEET SPREAD FLAT ON THE BARE WOOD A HALF-PALM AWAY FROM IT. Nothing is being pressed.
     This is the last page of the book and the only thing that has changed in the animal.
  Plain bare buff background, no scenery, no border on this sheet.
SCENE token: GeckoWait.
```

```
CHARACTER SHEET - BakerHands   (bake this THIRD)

🔴 SAME MEDIUM AS THE BOOK. Opaque flat gouache on dull warm buff paper, contours in soot.
  No shading. No orange, no yellow, no red.

🔴 THIS IS A SHEET OF FOREARMS AND HANDS ONLY, ON PURPOSE. The baker's face is never shown in
  this book - on every page his head is either outside the frame or turned down into flat soot
  shadow. Do not draw a face on this sheet at all.

BUILD: a full-grown adult's arms - thick wrists, broad palms, short square nails, visible
  tendons drawn as one or two soot lines only. Sleeves rolled to just above the elbow, the roll
  drawn as two flat shapes. Forearm skin one flat warm buff, one step from the ground.
  A plain apron edge with NO printing on it enters some poses at the wrist or the frame edge.
POSES - draw each one cropped exactly as it will appear:
  1. TWO HANDS spreading a damp cloth flat over a bowl rim, fingers open, wrists level.
  2. ONE HAND pushing a split log into a low door, the other gripping the door edge; the arm
     enters from the side of the frame.
  3. ONE HAND holding a small wet brush and shaking it, wrist snapped, water leaving the
     bristles as two or three pure white #FBF7EE specks - 🔴 the only pure white on this sheet.
  4. TWO HANDS lifting a damp cloth away by its corners, arms rising out of the top of the
     frame, the cloth trailing.
  5. ONE HAND gripping the handle of a long wooden peel, the arm entering from below and dark
     against the light - 🔴 drawn as a FLAT SOOT SILHOUETTE with no interior detail, because on
     the last page the arm is inside the oven's shadow.
  For every pose, draw where the frame crop line falls. 🔴 The crop is part of the design.
SCENE token: BakerHands.
```

---

## H-01 §4. 12컷

각 컷은 `STYLE ANCHOR + 규칙 A·B·C + @image1(BakeryFrame) + @image2(GeckoWait) + @image3(BakerHands) + 아래 블록` 으로 합성한다.
🔴 **모든 컷에 테두리가 있다.** 컷 블록이 테두리를 다시 설명하지 않아도 앵커의 THE BORDER 절이 매번 적용된다.

### p1 — 오븐 옆만 따뜻했다
```
CAMERA: wide, low angle at work-table height. Thirds: the oven on the right, the window on the
  left, DoughBowl dead centre.
WHO: BakerHands + GeckoWait.
SUBJECT: RIGHT MIDGROUND - BakerHands pose 1, two hands spreading the damp cloth flat over the
  bowl rim. The arms enter from the right; 🔴 above the wrists the figure becomes a flat soot
  silhouette and the head is outside the frame. LOWER LEFT CORNER, small - GeckoWait clinging
  to the side of a table leg, belly pressed to the wood, all five toes of each foot fanned flat
  on it, snout lifted toward the bowl, tail drooping down the leg's curve (posture 3 of the
  sheet, tail state 2).
SETTING: the brick oven with its low FireDoor ajar, split logs stacked, the flour sack, the
  wooden dough trough, the balance scale, the long peel, the rolling pin on the wall, the empty
  milk bottle on the sill, LaneWindow with its panes flat soot black, a thin scatter of dough
  cream flour on the table.
DOUGH: the cloth lies completely flat. Measured from the inner bottom rule of the border, the
  cloth's centre is BELOW the bowl rim. This is zero.
TINY: 🔴 two pure white #FBF7EE specks above the fire door - sparks. One of them laps over the
  border line at the upper right and sits outside it. Nothing else crosses the border.
HEAT: the whole right third of the room, including the wall and the table's right end, is
  painted in the DARKER GROUND STEP #B49877. The inside of the fire door is FLAT SOOT BLACK.
  🔴 There is no orange, no yellow, no glow, no light rays and no cast shadow from fire.
FINISH: the border worked. The bowl, the cloth and the gecko's feet finished. Everything else
  is a flat shape with one colour: logs are outlines, bricks are one plane, the sack is one
  shape. No brick courses, no wood grain beyond two strokes.
TONE: no directional light and no gradient anywhere. The room is read by which flat colour each
  area is. Stillness before the day begins.
```

### p2 — 그릇 앞에 앉았다 (창밖은 아직 어두웠다 1/3)
```
CAMERA: medium close-up, eye level at table-top height. GeckoWait on the left and DoughBowl on
  the right, sitting side by side, almost symmetrical.
WHO: GeckoWait alone.
SUBJECT: LEFT - GeckoWait in sheet posture 1: belly pressed fully flat to the table, front legs
  locked straight so the chest lifts a little, tail laid in a loose S, every toe flat on the
  wood. The eye disc is aimed at the exact centre of the cloth and does not move.
  🔴 CORRECTION TO THE SCRIPT - the script asks for a bright rim on the contour and a
  half-shadowed face. There is no rim light in this book. Instead: the upper half of the body
  is the paler flat value and the lower half is the ground-adjacent value, meeting at ONE HARD
  EDGE along the flank.
  RIGHT - DoughBowl with the cloth over it, the cloth surface completely flat.
SETTING: the table top with two strokes of grain, a scatter of dough cream flour with a few
  small four-toed footprints in it, the WaterBowl and brush beside the bowl, dried wheat on the
  back wall as three flat shapes, LaneWindow deep in frame with soot-black panes.
DOUGH: 🔴 EXACTLY THE SAME AS p1 - completely flat, below the rim. Hold p1's approved render
  beside this one and match the height. If it has grown here, the book's whole premise fails on
  the second page.
TINY: one of the footprints in the flour is drawn in pure white #FBF7EE, and 🔴 ONE TOE of it
  laps over the inner bottom border line and sits outside the frame. Nothing else crosses.
HEAT: the right edge of the frame carries the darker ground step; the rest is ground buff.
  No fire is visible on this page.
FINISH: the border worked. The gecko's feet, throat and the white footprint finished. The bowl
  and cloth half-finished (contour and one fill). The wheat, the window, the walls are single
  flat shapes with nothing drawn in them.
TONE: flat, even, no gradient. 🔴 The impression must be that nothing is happening and nothing
  is going to.
```

### p3 — 그릇 옆이 더 따뜻해졌다
```
CAMERA: low-angle medium. The open fire door on the right, DoughBowl on the left - a diagonal
  runs between them along the direction the heat travels.
WHO: BakerHands + GeckoWait.
SUBJECT: RIGHT - BakerHands pose 2, one hand pushing a split log in through the low door, the
  other gripping the door edge. 🔴 The arms and shoulder are a FLAT SOOT SILHOUETTE and the
  head is out of frame. LOWER LEFT - GeckoWait in sheet posture 2: body rotated so one whole
  flank is turned broadside to the oven, one front foot lifted and planted, snout raised toward
  the heat, and the thin skin under the throat drawn as three fine soot lines to show it moving.
SETTING: inside the open door a collapsing heap of embers and the new log - 🔴 ALL OF IT FLAT
  SOOT BLACK, with the ember heap read only as separate flat shapes, never as glowing colour.
  Soot on the brick arch as one darker flat patch. Bark on the floor as two small flat shapes.
DOUGH: the cloth has taken a little steam and sags very slightly at the centre, still below the
  rim. One step above p2, and only just.
TINY: one pure white #FBF7EE ash grain rising above the door; it laps over the top border line.
HEAT: 🔴 THE DARKER GROUND STEP #B49877 NOW COVERS THE WHOLE RIGHT HALF OF THE FRAME, further
  than on p1 - that is the entire visual statement that the room got warmer. No orange, no
  yellow, no glow, no rays. The gecko's turned flank is the second statement.
FINISH: the border worked. The gecko's flank, feet and throat lines finished. The door and log
  half-finished. Bricks, wall and floor are flat planes.
TONE: no gradient. Two flat values meeting on a diagonal. In one glance the reader must see why
  the bowl sits where it sits, and why this body cannot leave that spot.
```

### p4 — 콕 눌러 보았다 🔴 매크로 규약의 기준판
```
CAMERA: extreme macro, almost lying on the dough surface. The lower two thirds of the frame
  inside the border is dough.
WHO: GeckoWait (one foot and part of the head only).
SUBJECT: UPPER CENTRE - one front foot of GeckoWait, large in frame. Five toes fanned wide, the
  fine cross-ridges on the pads clearly drawn, the middle toe tip pressed down into the dough.
  Above the crop line, only the tip of the snout and one eye disc looking down. 🔴 The press is
  tentative - the leg is not straight, only half its weight is in it.
SETTING: the smooth dough surface with its thin dusting of dough cream flour, the shallow dish
  where the toe went in, a ridge of flour pushed up around it, and at the top edge of frame the
  folded-back damp WetCloth with one droplet on it and the curve of the bowl rim.
DOUGH: level with the bowl rim. 🔴 THE DISH IS THE SUBJECT: draw it as a distinct flat shape a
  step darker than the surface, with ONE soot crescent inside its far wall. That crescent is
  the depth, and it is a drawn shape, not shading. Remember it - p5 is this same picture with
  the crescent gone.
TINY: 🔴 one pure white #FBF7EE droplet on the folded cloth at the top of the frame, about to
  fall; it laps over the top border line.
HEAT: not visible on this page - the frame is inside the bowl. Ground values only.
FINISH: the border worked. The dough surface and the foot are the only finished things on the
  page - the ridges on the pads, the flour ridge, the crescent. The cloth and bowl rim are flat
  shapes.
TONE: flat, no gradient, no cast light. 🔴 This page is entirely about surface, and the depth of
  one dish is the whole information. 🔴 This is the reference plate for p11 - once approved, it
  is attached as the ref for that page and NOT MIRRORED.
```

### p5 — 자국이 금세 없어졌다
```
CAMERA: 🔴 IDENTICAL to p4 - same angle, same distance, same crop. A few seconds later.
WHO: GeckoWait (one foot and part of the head only).
SUBJECT: UPPER RIGHT - the same front foot, now lifted clear of the dough, the toes curled
  slightly inward, dough cream flour on the very tips. Above the crop line the same snout and
  eye disc - the face is unchanged, exactly as it must be, but 🔴 THE HEAD HAS COME A HALF-PALM
  FURTHER FORWARD than on p4. That is the only expression available and it is enough.
  Nothing is touching the dough.
SETTING: the same dough surface, the same cloth fold and bowl rim at the top edge.
DOUGH: the same height as p4. 🔴 BUT THE DISH IS GONE: the surface is flat again and all that
  remains is the RIDGE of pushed flour, drawn exactly as on p4, marking where something was.
  🔴 THE SOOT CRESCENT FROM p4 IS ABSENT. One removed shape is the whole event of this page -
  do not replace it with a paler crescent, a soft tone or a faint mark. It is simply not there.
TINY: one of the flour grains on the toe tips is pure white #FBF7EE, floating free just off the
  foot; it laps over the right border line.
HEAT: not visible. Ground values only.
FINISH: the border worked. The foot and the flour ridge finished. Everything else flat.
TONE: flat, and 🔴 ONE STEP FLATTER THAN p4 because a dark shape has left the page. The
  impression is "not yet" - an event that was cancelled.
```

### p6 — 천에 물을 뿌렸다 (창밖은 아직 어두웠다 2/3)
```
CAMERA: high overhead, from about the baker's shoulder height. DoughBowl centred, a hand
  entering from the top - a vertical composition.
WHO: BakerHands + GeckoWait.
SUBJECT: TOP OF FRAME - BakerHands pose 3, one hand holding the small wet brush and shaking it
  over the cloth, wrist snapped, forearm cropped by the border. LOWER LEFT - GeckoWait struck on
  the back by a drop: the body drops flat and low, half a step back, the tongue out long and
  wiping across one eye disc, the tail tip flicked once. 🔴 But the body still faces the bowl -
  it has not turned away.
SETTING: fresh droplets just landed on the cloth, drawn as a scatter of small flat wet
  grey-green shapes; a broad patch where the cloth has soaked and clung tight to the bowl's
  curve, its boundary HARD; the WaterBowl and brush beside it; water spots in the flour on the
  table; LaneWindow deep in frame, panes soot black, with steam on the glass drawn as one flat
  grey-green shape.
DOUGH: under the now-clinging cloth the dome's curve can be read for the first time; the centre
  is still at about the rim. One step above p3.
TINY: 🔴 one droplet that hit the gecko's back and bounced - a single pure white #FBF7EE speck
  in the air above it, lapping over the left border line. 🔴 All the other droplets are wet
  grey-green, NOT white. Only the one that bounced is white.
HEAT: the top right corner of the frame carries the darker ground step. No fire visible.
FINISH: the border worked. The clinging cloth, the gecko's feet and the one white speck
  finished. The hand and brush half-finished. Table, window, walls flat.
TONE: flat with no highlights on the droplets - each droplet is a shape, not a shine. Wetness
  and warmth read at the same time. A soundless, soft beat.
```

### p7 — (글 없는 쪽) 🔴 무텍스트 · 밀도 배급 1/2
```
CAMERA: panorama wide, high angle, 🔴 THE FRAME IS DIVIDED INTO FOUR PANELS reading left to
  right, and all four hold the bowl at the SAME size and SAME angle.
WHO: GeckoWait in all four panels. The baker is in none of them.
SUBJECT: in each panel, GeckoWait lies belly-down beside the bowl seen FROM BEHIND, and 🔴 THE
  POSTURE IS IDENTICAL IN ALL FOUR PANELS - same angle, same foot positions, same tail curve,
  not one hair's difference. Do not vary it for interest. The sameness is the content.
SETTING: 🔴 DENSITY PAGE 1 OF 2, AND THE DENSITY GOES INTO STRUCTURE, NOT PROPS. Each of the
  four panels carries its OWN COMPLETE DECORATIVE BORDER - the same wheat / sieve / rolling pin
  / lattice band, drawn all the way round each panel, four times, at a narrower width. Between
  the panels runs a flat soot band, so time reads as continuous rather than cut.
  🔴 Inside each panel there are only three props: the bowl, the damp cloth, the water bowl.
  Nothing else. No walls, no oven, no window, no table detail. The script forbids it and so does
  this anchor.
DOUGH: 🔴 THE ONLY THING THAT CHANGES BETWEEN PANELS. Panel 1: level with the rim. Panel 2:
  half a finger-joint above. Panel 3: one joint. Panel 4: one and a half joints. Measure each
  from that panel's own inner bottom border rule.
TINY: 🔴 ONE PURE WHITE #FBF7EE DUST MOTE CROSSES ALL FOUR PANELS. It is high in panel 1, mid in
  panel 2, low in panel 3, and in panel 4 it laps over that panel's outer border line and sits
  outside it. It is the same single grain, and it is the only moving thing in the book's
  quietest page. 🔴 This replaces the script's "one beam of light" - there is no light beam in
  this medium, and the proposition ("time passes even when you are not watching") is carried by
  the mote instead.
HEAT: each panel's right edge carries a narrow strip of the darker ground step, identically.
FINISH: the four borders worked - that is where this page's density lives. The bowl, cloth and
  the gecko's feet finished. Nothing else drawn at all.
TONE: the ground of each panel is a hair lighter than the last, so dawn is coming, and that is
  the only other change. 🔴 The impression must be: nothing moved, and yet something is different.
```

### p8 — 우유 수레가 지나갔다
```
CAMERA: medium, eye level. LaneWindow on the left, DoughBowl on the right - the frame splits
  left and right, and only the gaze crosses over.
WHO: GeckoWait alone.
SUBJECT: CENTRE - GeckoWait in sheet posture 3: the body and all four feet stay pointed at the
  bowl while the NECK TWISTS A FULL 90 DEGREES to the left window. One front foot is frozen in
  the air, the tail tip turning slowly through one beat, the mouth parted a crack. RIGHT - the
  cloth-covered bowl left behind at its back.
SETTING: beyond the window glass, the wheel and milk churns of a cart passing, drawn as three or
  four FLAT SOOT SHAPES with no interior detail; the village lamps beyond the misted glass as
  flat grey-green patches, NOT as glows; the empty milk bottle on the sill; flour on the window
  frame.
DOUGH: two and a half joints above the rim, and it is BEHIND THE GECKO'S BACK - clearly higher
  than p7's last panel, and the reader can see it while the gecko cannot.
TINY: 🔴 one pure white #FBF7EE drop of milk splashed on the outside of the glass; it laps over
  the left border line.
HEAT: the far right edge of the frame carries the darker ground step. No fire visible.
FINISH: the border worked. The gecko's twisted neck, throat and feet finished; the cloth on the
  bowl half-finished. The cart, the lane, the lamps and the wall are single flat shapes.
TONE: 🔴 no light sources are painted. The window side is the cool ground buff and the bowl side
  is the darker warm step, and the boundary is hard. The composition drags the eye out of the
  frame to the left, so the bowl is forgotten for one beat.
```

### p9 — 다시 보니 천이 올라와 있었다 (창밖은 아직 어두웠다 3/3)
```
CAMERA: over the shoulder. GeckoWait's back and the nape of its neck are large in the lower
  foreground; beyond them DoughBowl sits at the centre of the frame.
WHO: GeckoWait (from behind) alone.
SUBJECT: LOWER FOREGROUND - GeckoWait seen from behind in sheet posture 4: front legs locked
  straight so the chest is pushed as high as it will go, the nape stretched long, hind feet
  still flat on the wood, tail tip just lifted. 🔴 The face is not visible and does not need to
  be - the posture is the whole reaction.
SETTING: the damp cloth over the bowl now DOMED UP from the centre, higher than the bowl rim,
  its folds running in a different direction than before and its hem lifted half off the bowl on
  one side; flour on the table with the four-toed prints; LaneWindow still soot black.
DOUGH: 🔴 CLEARLY ABOVE THE BOWL RIM - three joints from the inner bottom border rule. This is
  the first page where the height is unmistakable at a glance.
TINY: one pure white #FBF7EE droplet falling from the lifted hem of the cloth; it laps over the
  right border line.
HEAT: the right edge of the frame carries the darker ground step.
FINISH: the border worked. The domed cloth finished (its new fold directions are the
  information) and the gecko's feet and nape finished. Table, window, wall flat.
TONE: 🔴 CORRECTION TO THE SCRIPT - the script asks for the foreground to be pushed into shadow
  and the bowl to be bright. There is no such tonal device here. Instead the foreground body is
  painted in the DARKER GROUND STEP as one flat mass with no interior detail, and the bowl and
  its cloth are the paler values - two flat areas, one hard edge, and the eye lands on the dome.
```

### p10 — 반죽이 그릇 위로 넘쳐 있었다 🔴 밀도 배급 2/2
```
CAMERA: high overhead looking straight down into the bowl - a circular composition. The lifting
  cloth exits diagonally at the frame edge.
WHO: BakerHands + GeckoWait.
SUBJECT: TOP OF FRAME - BakerHands pose 4, two hands holding the damp cloth by its corners and
  lifting it up out of frame, the cloth trailing. Forearms only; the head is outside the border.
  LEFT EDGE - GeckoWait with both front feet up on the bowl's rim, body raised to look in, 🔴
  its toes gripping the smooth glazed curve (this is what that species does and it must read),
  hind feet still on the table, neck at full stretch, mouth open a crack.
SETTING: 🔴 DENSITY PAGE 2 OF 2 - and the density is in the DOUGH SURFACE and the BOWL WALL,
  nowhere else: the risen dome above the rim, the thin flour dust on it CRACKED into fine lines
  where it stretched (draw them, they are the record of the rising), and 🔴 THE MARK ON THE
  INSIDE WALL OF THE BOWL SHOWING THE STARTING HEIGHT - one thin soot line, low down, with dried
  dough cream below it. Two heights in one frame. Also the balance scale and the rolling pin,
  each as one flat shape.
DOUGH: spilling over the rim. Measured from the inner bottom border rule, the highest it gets.
TINY: 🔴 two pure white #FBF7EE droplets falling from the lifted cloth; one of them laps over the
  top border line. (Two specks, one event.)
HEAT: the frame's right edge carries the darker ground step.
FINISH: the border worked. The dough surface, its cracked flour lines, the starting-height line
  and the gecko's gripping toes finished. The hands and cloth half-finished. Everything else flat.
TONE: flat, no gradient, and 🔴 the difference between the starting line and the present height
  is carried by CONTRAST OF FLAT SHAPES, not by shadow in the bowl. The bowl's interior wall is
  one flat soot-leaning value; the dome is dough cream. Hard edge between them.
```

### p11 — 자국이 천천히 돌아왔다 🔴 p4 와 같은 그림이어야 한다
```
CAMERA: 🔴 IDENTICAL to p4 - same angle, same distance, same crop. 🔴 ATTACH p4's APPROVED
  RENDER AS A REF AND DO NOT MIRROR IT. Laid side by side, these two pages should look like the
  same picture.
WHO: GeckoWait (one foot and part of the head only).
SUBJECT: UPPER CENTRE - the same front foot in the same place, five toes fanned to the same
  width, the middle toe tip pressed into the dough exactly as on p4. Above the crop line, the
  snout tip and one eye disc - 🔴 but this time the head has come further DOWN, stopped just
  above the dish, and the vertical slit pupil is aimed straight into it.
SETTING: the risen dough surface, its flour dust cracked into fine lines, the bowl rim and the
  end of the already-lifted cloth at the frame edge.
DOUGH: risen and spilling, as on p10. 🔴 AND HERE IS THE WHOLE BOOK: the dish is DEEPER than on
  p4, its edge has slumped softly instead of standing sharp, and IT IS ONLY HALF FILLED IN -
  draw the dish as a flat shape whose area is visibly smaller than the ridge around it, meaning
  it is still coming back. The flour cracks open a little wider around its edge.
  🔴 The soot crescent inside the far wall is PRESENT and it is LARGER than p4's. On p4 it was
  small and vanished by p5; here it is bigger and it is staying. That is "it grew", and there is
  not one word of it in the text.
TINY: one pure white #FBF7EE flour grain flicked up where a crack opened; it laps over the left
  border line.
HEAT: not visible - the frame is inside the bowl.
FINISH: the border worked. The dough surface, the dish, the crescent and the foot finished.
  Bowl rim and cloth end flat.
TONE: flat, no gradient. 🔴 The impression is not a frozen frame but a VERY SLOW one - time is
  moving inside the picture, and the only evidence is that a shape is half the size it will be.
```

### p12 — 창밖이 파랬다 🔴 테두리가 바뀌는 유일한 쪽
```
CAMERA: wide, low angle at hearth-floor height. 🔴 THE VIEWPOINT IS INSIDE THE OVEN, LOOKING
  OUT. 🔴 THE DECORATIVE BORDER IS REPLACED - on this page and only this page the frame is
  bordered by the SOOTED BRICK OF THE OVEN MOUTH, drawn as flat soot black brick shapes all the
  way round, and the workroom is seen small inside that opening. Frame within a frame.
WHO: BakerHands + GeckoWait (very small).
SUBJECT: LOWER FOREGROUND - the wide blade of the long wooden peel sliding in over the lip onto
  the hearth floor, one risen loaf of dough sitting on it. The hand on the handle is BakerHands
  pose 5, a FLAT SOOT SILHOUETTE with no interior detail, shoulder and arm only, head outside
  the opening.
  DEEP INSIDE THE OPENING, VERY SMALL - the work table, and on it 🔴 A NEW BOWL WITH A NEW DAMP
  CLOTH OVER IT, and GeckoWait lying flat beside it in sheet posture 5: 🔴 BOTH FRONT FEET
  SPREAD FLAT ON THE BARE WOOD A HALF-PALM AWAY FROM THE BOWL. IT IS NOT TOUCHING IT. Only the
  snout is aimed at the cloth, and nothing is moving.
  🔴 THAT HALF-PALM OF EMPTY WOOD IS THE LAST INFORMATION IN THE BOOK. Paint it in the LIGHTER
  GROUND STEP #DBCBB0 so it is the brightest AREA in the frame - 🔴 but not pure white, because
  pure white belongs only to the one grain. If the gap does not read, this page has failed.
SETTING: inside the opening - the first bowl washed and turned upside down, the new bowl and its
  new cloth, the water bowl and the balance scale, and 🔴 THE FOUR-TOED FOOTPRINTS IN THE FLOUR
  RUNNING FROM THE OLD BOWL'S PLACE TO THE NEW ONE. On the hearth floor in the foreground, a
  scatter of dough cream flour. Beyond the workroom, LaneWindow.
DOUGH: 🔴 THE NEW CLOTH IS COMPLETELY FLAT - back to zero, exactly as on p1. And the risen loaf
  is on the peel in the foreground, at its maximum. Both states are in one frame.
TINY: 🔴 one pure white #FBF7EE flour grain lifting off the hearth floor and crossing the sooted
  brick border - and its direction is toward the new bowl.
HEAT: 🔴 THE VALUE RELATIONSHIP IS INVERTED HERE, AND THAT IS THE POINT. For eleven pages this
  book was "a bright bowl in a dark room". Now the four sides of the frame are the oven's soot
  brick - the darkest thing in the book - and the workroom inside the opening is open, cool and
  pale. Still no orange, still no fire colour, still no glow.
SPOT 2: 🔴 WINDOW BLUE #4E6E8C, THE ONLY TIME IN THE BOOK. The panes of LaneWindow, seen small
  and deep inside the opening, are painted blue where the mist has cleared. Eleven soot-black
  windows, then this one. Nothing else on the page is blue.
FINISH: the sooted brick border worked (it is this page's border). The new bowl, the new cloth,
  the gecko's spread feet and the half-palm gap finished. The peel and loaf half-finished. The
  rest of the workroom flat.
TONE: flat throughout with no gradient. 🔴 The proposition of this page is NOT "the night has
  ended" - the text already said that. It is "IT IS BESIDE THE BOWL WITHOUT PRESSING IT", and
  that half-palm of pale wood is the only evidence that what grew was not only the dough.
```

---

## 첫 렌더 검수 체크리스트 (6항목)

1. 🔴 **테두리가 쪽마다 같은가**(p12 제외) — 모티프 순서·폭·선 두께가 바뀌면 「같은 창을 열두 번 연다」가 무너지고, 이 앵커의 정체가 통째로 사라진다. 어긋나면 문구를 늘리지 말고 **BakeryFrame 시트를 다시 굽는다**(§5.1 교훈). 그리고 p7 은 **테두리가 네 겹**인지 확인한다.
2. 🔴 **테두리를 넘는 것이 하나뿐인가** — 둘 이상이면 「아주 작은 일 하나」가 사라지고, 하나도 없으면 그 쪽엔 사건이 없다. 그리고 **넘는 것이 순백인가** — 물방울을 회녹으로 그리면 사건이 배경에 묻힌다(p6 이 이 함정의 최전선이다: 나머지 물방울은 회녹, 튄 것 하나만 순백).
3. 🔴 **반죽 높이가 p1 과 p2 에서 같은가** — 여기서 자라면 「지켜보는 동안에는 안 자란다」가 두 번째 쪽에서 무너진다. 그리고 **p4 와 p11 을 나란히 놓고** 본다: 같은 각도·같은 거리·같은 발 위치인데 **자국의 깊이와 차오름만** 다른가. 다르면 p4 승인본을 ref 로 붙여 p11 을 다시 굽는다.
4. 🔴 **불이 색으로 나왔나** — 아궁이·오븐 아가리·불티가 주황·노랑·빨강이거나 글로우·후광·광선을 가졌으면 실패다. 팔레트에 그 색이 아예 없다. 정답은 **판이 짙어지는 것(#B49877) + 아궁이 안 갈검 평칠 + 순백 불티 두 점**. 이게 무너지면 **e01(같은 빵집)과 악센트가 겹친다.**
5. 🔴 **순백이 알갱이 밖에 있나** — 반죽·젖은 천·밀가루·창유리가 순백으로 칠해졌으면 그 쪽의 작은 일이 안 보인다. 반죽은 크림 #E4D8C0, 천은 회녹 #7E8A80 이다. 🔴 **호리 니들펠트 분리도 여기서 본다** — 천에 짜임·바늘땀·보풀·섬유가 보이면 그 순간 호리 라인이다. 젖은 천은 **평칠 한 겹**이고, 주름은 **음영이 아니라 별개의 평면 도형**이다.
6. 🔴 **근접 4권과 나란히 놓고 본다** — ① **e01**(같은 프랑스 빵집): 하나는 테두리 있는 꽉 찬 버프 책, 하나는 테두리 없는 텅 빈 흰 책인가. 닮아 보이면 h01 의 테두리 폭을 올린다. ② 🔴 **h03**(C5 둘째 · 같은 H 군 · 같은 유럽 공방 — **가장 위험한 상대**): 「겹쳐 찍은 갈색 방 ↔ 테두리 두른 버프 창」인가. 판정 문장 셋 = **인쇄 결이 있나 / 테두리가 있나 / 화면이 마른가 젖었나.** 닮아 보이면 h01 에서 인쇄 느낌(균일한 그레인)을 걷고 붓 엣지를 더 드러낸다. ③ **a97**(C5 첫째): 반복이 「화면 안 ↔ 쪽 사이」로 갈렸나. ④ **b09**(같은 공방 무대): 「나뭇결이 비치는 글레이즈 ↔ 종이 위 불투명 평칠」로 갈렸나.
</content>
