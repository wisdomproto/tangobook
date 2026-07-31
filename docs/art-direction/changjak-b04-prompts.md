# 창작동화 1000 — B-04 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`(§2.4 · §2.7 · §2.8 · §2.9 · §2.10 · §7.2 · §7.3 · §7.5), 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/b04.md`.** 아래 10컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다.
> 🔴 **작가 실명은 한 글자도 안 들어간다.** 근거 후보 id 는 판정 표에만 남기고 프롬프트는 전부 문구다.
> 🔴 **이미지 생성은 이 문서가 하지 않는다.** 사용자가 직접 뽑는다.

## 0. 실행 순서 (어기면 인물만 매끈한 CG 로 나온다 — §2.4)

1. **STYLE ANCHOR 로 시트 3장을 먼저 굽는다**(AlleyCat → ShadowSelf → VillageKit). 장면 금지.
2. 🔴 **시트가 승인되면 p1 과 p7 을 먼저 굽는다.** p1 = 그림자가 화면에서 가장 크고 또렷한 쪽(=평칠 어둠의 기준판) / p7 = 🔴 **그림자가 0인 쪽**. 이 두 장이 「어둠이 있다/없다」의 양 끝이고, 그 양 끝이 안 서면 사이 여덟 장을 다시 굽는다.
3. 그 다음 **p9**(발끝 이음을 화면 가운데에서 크게 확정)를 굽는다. 이 이음의 생김새가 열 쪽 전부에 반복되므로 여기서 모양을 확정한다.
4. 나머지 일곱을 굽는다.
5. 승인 렌더 3장을 앵커 ref 슬롯에 넣는다 — 🔴 **인물 컷 1(p9 또는 p8) · 벽이 통째로 안 칠한 맨 종이로 남은 컷 1(p5) · 그림자가 없는 컷 1(p7)**. 3장이 전부 그림자 있는 컷이면 「p7 은 어두운 도형이 하나도 없는 쪽」이라는 문구가 영영 안 먹는다(점눈이에서 실제로 겪은 일, §2.7 보정).
6. 앵커 이름은 **렌더를 보고 짓는다**(§7.5-3). 지금은 슬러그만 쓴다: `changjak-b04`.

---

# B-04 「그림자가 먼저 일어났다」

주제군 B 상상·변신 / 엔진 **오해와 반전** / 무대 스페인 흰 마을(회벽 좁은 골목·돌계단·빨래줄) / 주인공 고양이 한 마리 + 그 그림자 / **10스프레드**

## B-04 §1. 앵커 배정

**권**: `그림자가 먼저 일어났다` (b04 · 10쪽 · 4~7세 · 주제군 **B 상상·변신** · 엔진 **오해와 반전** · 무대 스페인 흰 마을 · 주인공 고양이)

**한 줄**: 🔴 **회벽은 칠하지 않은 차가운 흰 종이이고, 이 책에서 칠해진 것은 그림자·문·화분 셋뿐이다.** 음영이 0이라 그림자는 명암이 아니라 **오려 붙인 것처럼 가장자리가 딱 선 하나의 짙은 도형**이 되고, 그래서 있다/없다·길다/짧다만 남는다. 앵커 슬러그 `changjak-b04` — **신규 민팅**.

### 이 권이 그림에 요구하는 것 (판정의 전제 — 후보는 이 다섯을 통과하는지로만 봤다)

1. 🔴 **그림자가 화면에서 유일한 어두운 것이어야 한다.** 대본이 무대를 그렇게 골랐다("새하얀 회벽이라 그림자가 유일한 어두운 것이 되고"). 벽·바닥·하늘에 회색 음영을 한 번이라도 얹으면 그림자가 「어두운 것 중 하나」로 내려앉고, 이 책의 주인공이 화면에서 사라진다.
2. 🔴 **그림자는 하나의 끊기지 않은 도형이어야 한다.** 심음이 「발끝이 붙어 있다」인데, 그 이음이 성립하려면 그림자가 **고양이 발밑에서 시작해 꺾여 벽으로 올라가는 한 조각**으로 그려져야 한다. 붓 톤·번짐·에어브러시로 그리면 이음매가 뭉개지고, 뭉개지는 순간 독자가 고양이보다 먼저 아는 유일한 정보가 없어진다.
3. 🔴 **p7 은 그림자가 0인 쪽이다.** 주인공이 화면에서 통째로 사라진다. 그리고 그 쪽엔 **빨강도 없다**(대본 소품 목록에 화분이 없다) — 열 쪽 중 **어두운 것과 따뜻한 것이 동시에 없는 유일한 쪽**이다. 그 부재가 「못 그린 쪽」이 아니라 「없는 것이 사건인 쪽」으로 보여야 한다.
4. 🔴 **그림자의 크기·길이가 쪽마다 물리적으로 달라야 한다.** 이른 아침(길다) → 천에 비쳐 집채만(거대) → 정수리 해(가장 짧다) → 저녁(가장 길다). 해 높이가 곧 그림자 길이라, **광원 규칙이 열 쪽에서 한 번도 안 흔들려야** 아이가 「저 혼자 움직인다」를 규칙 하나로 받아들인다.
5. **고양이가 열 쪽에서 연기해야 한다** — 놀람(p2)·헐떡임(p3)·못마땅함(p4)·분개(p5)·뾰로통(p6)·두리번(p7)·환희(p8)·발견(p9)·장난(p10). 🔴 인물이 사실상 하나뿐이라 화면이 단순하고, 그 단순함이 이 앵커의 이점이지만 **얼굴이 안 되면 열 쪽이 그냥 도형 놀이가 된다.**

### 후보 3

| | 후보 ① **C4 평면 형태 · 안 칠한 흰 종이 + 하드에지 평칠 3색**(신규 앵커) | 후보 ② C6 단색조 + 악센트 1 | 후보 ③ C7 회화적 톤 · 빛/어둠 대비 |
|---|---|---|---|
| 매체 | 차가운 흰 종이를 그대로 벽으로 쓰고, 그 위에 **불투명 평칠 세 색**(짙은 남보라 그림자 · 파랑 문 · 빨강 화분 1점)만 얹는다. 음영 0, 그라데이션 0, 하드에지 | 냉회 단색조 필드 + 악센트 1 | 잉크 + 수채 명암, 빛과 어둠의 대비로 골목을 그림 |
| 이 권에 맞는 이유 | 요구 1·2·3 을 **한 공정이 동시에** 푼다. ⓐ 음영이 원천적으로 없으니 **칠한 어둠이 곧 그림자**다(요구 1) ⓑ 평칠이라 그림자가 **한 조각**으로 그려질 수밖에 없다 — 발밑에서 꺾여 올라가는 이음이 물리적으로 안 끊긴다(요구 2) ⓒ 🔴 **없음을 그리는 데 최적** — 평칠 세계에서 도형 하나를 빼면 그 자리는 「흐릿한 것」이 아니라 **아무것도 없는 흰 종이**다(요구 3). §7.3 이 **B 주제군 1순위를 C4** 로 못 박아 뒀고, 이 권은 「평범한 것 하나가 규칙을 어긴다」는 B 의 정의에 그림자라는 도형이 정확히 대응한다 | 그림자 하나만 어둡다는 구조는 같다 | 스페인 골목의 강한 빛과 그늘은 이 매체의 전문 분야다 |
| 리스크 | 🔴 **§2.8 — C4 는 표정이 없다.** 요구 5 가 정면으로 걸린다 → 처방을 앵커에 박았다(아래 「얼굴 규칙」). 그리고 최대 실패 모드가 명확하다 — 모델이 흰 벽에 **회색 음영과 부드러운 반사광**을 넣어 요구 1 을 통째로 무너뜨린다 → MEDIUM·NOT 양쪽에 못 박고 검수 1번에 올린다. 🔴 세 번째 = **같은 세션에 f02 가 C4 를 썼고 그것도 「흰 바탕 + 청색 계열 평칠 + 음영 0」**이다 → 아래 라인 충돌 표에서 6축으로 갈랐고, 결정적 두 축은 **윤곽선 유무**와 **칠한 면적**이다(f02 는 방 전체가 칠해진 청색 그림, b04 는 화면 8~9할이 안 칠한 종이) | — | — |
| 판정 | ✅ **추천** | 🔴 **탈락 — 라인이 C6 를 이미 넷 썼다**(a01·a04·c37·g88, §7.5). 개별 최적보다 라인 내 중복 회피가 우선이라는 것은 이 라인의 확립된 제약이다(§7.6 전례). 더해서 매체 사실 하나 — C6 의 「저정보 필드」는 **뭔가로 채운 필드**(안개·워시·흑연)인데 이 권의 필드는 **안 칠한 종이**여야 한다. 필드를 칠하면 그림자가 유일한 어두운 것이 아니게 된다 | 🔴 **탈락 — 이 권의 최대 실패 모드를 매체가 초대한다.** 명암 대비로 골목을 그리면 벽에 **반사광·중간톤·그늘의 그늘**이 생기고, 그 순간 그림자는 어두운 것 중 하나가 된다(요구 1 원천 붕괴). 그리고 요구 2 — 붓 톤은 발끝의 한 점 이음을 반드시 뭉갠다. 여기에 C7 은 이 라인에서 가장 두꺼운 군이라 평범해지기 쉽다(§7.5 교차관찰 1) |

**후보에도 못 올린 것들**: `marais-tomber`(평면 색면 + **검정 실루엣 컷아웃** — 구조가 이 권과 쌍둥이라 가장 아쉽다. 🔴 탈락 이유 = 원작은 **인물 자체가 검정 실루엣**이고 우리는 **인물과 그림자가 따로 있어야** 한다. 인물까지 실루엣이면 두 개가 같은 물감이 되어 p9 의 「발끝이 붙어 있다」가 「같은 도형이다」로 읽히고 발견이 사라진다) · `haugomat-atravers`(**윤곽선 0** 스크린프린트 평면 색면 + 빨강 1점 — 팔레트 구조는 우리 것 그대로인데 🔴 인물이 **얼굴 없는 작은 실루엣**이라 요구 5 가 불가능) · `moriconi-lua`(도형 하나가 매 쪽 변신 = 그림자의 문법 그 자체. 🔴 3색·도형 하나 규율은 상속하지만 원작은 캐릭터가 없다) · `gottwald-spinne`(고채도 컨페티 — 이 권은 화면의 9할이 흰 종이여야 한다) · `c60`(스텐실 담색 판이 **덮어서 지운다** = 이 권의 하드에지와 정반대).

### 🔴 추천 = 후보 ① — 안 칠한 흰 종이 + 하드에지 평칠, 어둠이 유일하게 칠해진 것

근거 세 줄:

- **공정이 이 권의 유일한 사건을 만든다.** 뿌리가 되는 검증 문법은 **「윤곽선 없는 스크린프린트식 평면 색면, 바탕색 하나 + 흰색 + 빨강 악센트 1점, 보는 틀 밖은 통째로 한 색으로 잘려 나간다」**(BolognaRagazzi Fiction 특별언급)와 **「한 쪽에 큰 도형 하나, 불투명 평칠, 3색, 그 도형 하나가 쪽마다 다른 것이 된다」**(BolognaRagazzi Toddler 위너)다. 🔴 두 번째 문법이 이 권의 그림자와 **같은 물건**이다 — 한 도형이 쪽마다 기지개를 켜고, 계단을 오르고, 집채만 해지고, 없어지고, 발밑으로 돌아온다. §2.3(내용-형식 필연성)이 최고점이다.
- **§2.7(덜 그리기)이 취향이 아니라 무대의 사실이다.** 회벽 마을은 실제로 **아무 무늬도 없는 흰 면**이다. 그래서 「벽을 안 그린다」가 절제가 아니라 정확한 묘사가 되고, 화면의 8~9할이 안 칠한 종이로 남는 것이 저절로 §2.1-2(여백이 무기)를 만족한다. 🔴 **이 책에서 「덜 그리기」를 어기는 순간(벽에 회반죽 결·돌 눈매·기와를 그리는 순간) 그림자가 안 보인다** — 취향이 아니라 플롯 요구다(c37 이 갯벌에서 같은 판정을 했다).
- 🔴 **악센트가 「칠해진 것 전부」로 정의된다 — §2.9 의 여섯째 변형.** 이 라인은 지금까지 악센트를 **더하고**(a04 앰버) **안 칠하고**(a91 흰 종이) **들어내고**(e09 지우개) **비켜 가게**(g88 검정) **주인공의 재료로**(c01 흰 과슈) 썼다. b04 는 여섯째다 — **악센트가 아니라 「칠」 자체가 희소 자원**이고, 열 쪽에서 칠해진 것은 그림자·문·화분뿐이다. 그래서 p7(그림자 0 + 빨강 0)은 **거의 아무것도 칠하지 않은 쪽**이 되고, 「없어졌다」가 물감의 양으로 증명된다.

### 🔴 얼굴 규칙 — C4 에서 열 쪽을 연기시키는 방법 (§2.8 리스크 처방)

§2.8 은 형태 언어가 「화가 나면」·「서운함」 같은 **내면 상태**를 못 쓴다고 못 박았고, 그래서 C4 를 A·G 에 금지했다. b04 의 감정은 전부 **몸으로 나오는 것**(놀라 뛰어오름·헐떡임·털 부풀림·홱 돌아섬·두리번·폴짝)이라 이 금지에 안 걸린다. 다만 세 군데만 얼굴이 필요하고, 처방은 이렇다.

- 🔴 **고양이는 평칠 도형인데, 그 도형 위에 아주 적은 선을 얹는다** — 아몬드 눈 하나 + **별개의 눈썹 선** + 입선 하나 + 수염 세 가닥. **점 눈이 아니다**(§7.2 규칙 2 — 점눈이 충돌 회피이자 표정 확보).
- 🔴 **그 선의 물감은 그림자와 같은 남보라다.** 고양이 몸에 있는 유일한 어두운 것이 제 그림자와 같은 물감이라 — 형식이 이야기를 한 번 더 말한다. 새 색을 안 늘리고 얻는 소득이다.
- **연기의 8할은 실루엣이 진다**: 부푼 꼬리(p5)·축 늘어진 꼬리(p6)·곧게 선 꼬리(p8)·낮춘 몸(p7). 🔴 **썸네일에서 자세만으로 기분이 읽히는지**가 시트 판정 기준이다.
- 🔴 **그림자는 얼굴이 없다.** 눈도 입도 수염도 없는 통짜 도형이고, 그래서 한마디도 안 한다는 대본의 규칙이 그림에서도 지켜진다. 그림자의 연기는 **자세와 위치**뿐이다.

### 🔴 광원 스케줄 — 해 높이가 곧 그림자 길이다 (열 쪽에서 한 번도 안 흔들린다)

| 쪽 | 시간 | 해 | 그림자 |
|---|---|---|---|
| p1 | 이른 아침 | 아주 낮게, 화면 왼쪽 밖에서 옆으로 | 벽에 크고 또렷하게 **길다** |
| p2 | 아침 | 낮게, 골목을 가로질러 | 바닥에 **길게** 앞서 나간다 |
| p3 | 아침 | 낮게, 계단 위쪽에서 | 계단을 타고 **위로 길게** |
| p4 | 오전 | 높아지는 중, **빨래 뒤에서** | 천에 비쳐 **집채만** (투영이라 가장 크다) |
| p5 | 오전 | 더 높게 | 벽 높은 곳, **중간 길이** |
| p6 | 오전 | 골목에 안 든다 | 그늘 경계선에서 **잘린다**(입구까지만) |
| p7 | 오전 | 🔴 **없다** (그늘 골목) | 🔴 **0** |
| p8 | 한낮 | 정수리 | 발밑에 **가장 짧고 가장 진하다** |
| p9 | 한낮 | 정수리 | 발밑, **짧다** |
| p10 | 저녁 | 지붕 아래로 낮게 | 골목 끝까지 **가장 길다** |

🔴 **길다 → 거대 → 0 → 가장 짧다 → 가장 길다.** 이 곡선이 이 책의 리듬 전부다. 그림자 길이를 「예뻐 보이는 대로」 정하면 열 쪽이 그냥 술래잡기 반복이 된다.

### 밀도 배급 (§2.10 · §2.12)

무텍스트 쪽이 없으므로 §2.12 우선권은 미발동 → 슬롯 2개를 **p2**(흰 마을이 처음 통째로 열리는 쪽 = 무대 학습)와 **p8**(광장 = 어둠에서 빛으로 나온 목적지)에 준다.
🔴 **밀도는 소품에만 들어간다** — p2 = 열린 파란 문·빨래줄·바닥의 둥근 돌 몇 개·화분 / p8 = 돌우물·둘레의 파란 문들·물자국·화분. 🔴 **회벽에 결·돌 눈매·기와를 그리면 두 쪽이 다 죽고, 그림자가 유일한 어두운 것이라는 규율이 함께 죽는다.**

### 🔴 라인 충돌 확인 (§7.2 분리 규칙)

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 2D 평면 인쇄·평칠. 실물 입체 재료(양모·바느질·점토) 없음 — NOT 절에 명시 |
| 전래동화 **점눈이** | ✕ (4축 전부) | ① **종이색** — 밝은 크림(=햇빛)이 아니라 **차가운 회백 흰 종이 #F2F1EC**(=석회 회벽. 온도가 반대다) ② **얼굴** — 점눈+실선 입이 아니라 **아몬드 눈 + 별개 눈썹 선 + 수염 세 가닥** ③ **악센트** — 🔴 화면당 빨강 1점이 **스타일 규칙이 아니다.** 점눈이의 빨강은 매 화면 어디든 즉석 발명이 허용되는 규칙이고, 여기 빨강은 **고정 소품 하나(제라늄 화분)이며 위치가 「골목의 깊이」를 가리키는 구성 장치**다. 그리고 🔴 **p7 에는 빨강이 없다** ④ **매체** — 느슨한 색연필 낙서가 아니라 **불투명 평칠 + 하드에지, 음영 0** |
| 🔴 **b01**(같은 주제군 B · 같은 라인 C4) | ✕ (4축) | ① **판 색** — 갈색 마분지 ↔ **차가운 흰 종이** ② **빛** — b01 은 🔴 **빛 0 · 음영 0 · 등각투영**(면적이 서사) / b04 는 🔴 **빛과 그림자가 주제 전부**이고 소실점 있는 골목 원근이다 ③ **안 칠한 것의 정체** — b01 = 맨 마분지가 **상자**(사물) / b04 = 맨 종이가 **회벽과 햇빛**(공간과 조명) ④ **서사 변수** — 칠한 면적이 줄어드는 것 ↔ **어두운 도형 하나의 길이와 유무** |
| 🔴 **f02 「아기는 딴 데만 봤다」**(같은 라인 C4 셋째 · 🔴 **같은 세션에서 나왔고 둘 다 「흰 바탕 + 청색 계열 평칠 + 음영 0」 — 이 배치의 최대 근접 위험**) | ✕ (6축) | ① 🔴 **흰 바탕의 정체** — f02 는 **칠한 흰 유약면**(도자 표면)이고, b04 는 🔴 **안 칠한 맨 종이**(석회 회벽)다. b04 에서는 **칠 자체가 희소 자원**이라 화면의 8~9할에 물감이 없다 ② 🔴 **윤곽선** — f02 는 **코발트 윤곽 한 획이 있다**(타일 그리는 문법) / b04 는 🔴 **윤곽선이 아예 없다** — 형태는 색면의 경계뿐이다 ③ 🔴 **그늘의 물성** — f02 의 그늘은 **반투명 코발트 필름 한 겹**이라 아래 체크 바닥이 비쳐 보인다 / b04 의 그림자는 🔴 **완전 불투명 통짜 도형**이고 아무것도 비치지 않는다 ④ 🔴 **평칠의 밀도 수** — f02 는 **두 밀도**(진한 코발트 / 옅은 코발트) / b04 는 **한 밀도**(하드에지 불투명 하나) ⑤ **눈금** — f02 는 흑백 체크 바닥과 격자 빛 칸이 자(尺)다 / b04 는 🔴 **자가 없다.** 재는 것은 **그림자 길이 하나** ⑥ **무대·시선** — 실내 기하·아기 눈동자의 방향 ↔ **실외 원근 골목·어두운 도형 하나의 유무와 길이**. 🔴 썸네일 판정 = **청색으로 그려 넣은 방 ↔ 거의 비어 있는 흰 골목** |
| 🔴 **e120**(같은 라인 C4) | ✕ (4축) | ① **무대 채도** — 저채도 회청 그라운드 ↔ **눈부신 흰 종이** ② **공정** — 🔴 **가위 자국이 보이는 오려 붙임** ↔ **붓으로 한 번에 칠한 평칠, 가위 없음** ③ **캐릭터** — 도형이 어휘(입 타원·사다리꼴·동심원)이고 표정 0 ↔ **눈·눈썹·수염 선이 있는 얼굴** ④ **채도색의 개수** — 셋(빨강·파랑·노랑)이 각각 후렴의 박 ↔ **빨강 하나뿐** |
| **g88**(C6 검정 판) | ✕ | 🔴 **정확히 뒤집힌 관계다** — g88 은 **검정 판에 빛을 얹고**(어둠은 안 칠한 것), b04 는 **흰 종이에 어둠을 얹는다**(빛은 안 칠한 것). 그리고 g88 은 빛이 형태를 만드는 회화(모델링 있음), b04 는 음영 0 평칠이다 |
| **a91 · c01 · e09**(악센트가 「덜어낸/얹은 재료」 계열) | ✕ | 셋 다 **밝은 것**이 악센트다(안 칠한 흰 종이 / 불투명 흰 과슈 / 지우개로 들어낸 빛). b04 는 🔴 **악센트가 어두운 것**이고, 무엇보다 **번짐·워시·마른 매체가 아니라 하드에지 평칠**이다 |
| **c37/tidepool** | ✕ | 둘 다 「빨강 1점」이 있으나 — c37 은 **열 쪽 중 한 쪽에만** 빨강이 있고 젖은 워시이며 냉회청 그라운드다. b04 는 아홉 쪽에 빨강이 있고 평칠이며 흰 종이다 |
| **g10 · f01**(C2 잉크 선 + 평칠 색면) | ✕ | 겹칠 위험 = 「평칠 색면 하나가 그늘」. 🔴 갈라 둔 것 — g10·f01 은 **선이 형태를 만들고 색면은 보조**다(딥펜 떨림 선 / 붓 먹선 한 획). b04 는 🔴 **선이 얼굴에만 있고 형태는 전부 색면이 만든다.** 그리고 g10 의 그늘은 도형이지만 **주인공은 잉크 덩어리**(가장 어두운 것)이고, b04 의 주인공은 **중간 값**이라 그림자보다 밝다 |
| 세계명작 수채 그림풍 | ✕ | 음영 0 평칠 + 화면 8할이 안 칠한 종이. 전면 채색 수채 아님 |

### 왜 새 앵커인가 (그리고 C4 넷째를 허용한 이유)

이 라인의 기존 C4 셋은 **전부 「빛이 없는 평면」**이다 — b01 은 명시적으로 빛 0·음영 0·등각투영이고, e120 은 저채도 회청 무대에 오려 붙인 무지 색면이고, f02 는 흰 유약면에 반투명 필름으로 그늘을 얹는다(광원이 아니라 **필름의 겹수**가 어둠을 만든다). b04 는 **평면인데 빛이 주제 전부**이고, 🔴 **어둠이 광원의 결과로 생긴 하나의 불투명 도형**이며 그 길이가 해 높이에 물리적으로 묶여 있다. 값 구조도 반대다: 셋은 판이 색을 갖고 도형이 그 위에 놓이는데, b04 는 **판이 안 칠한 흰 종이이고 도형이 어둠**이다.

근거 셋:
1. §7.3 이 **B 주제군 1순위를 C4** 로 못 박았고 그 근거가 「B 의 정의(평범한 것 하나가 규칙을 어긴다)에 형태 변신이 동형이다」였다. 🔴 이 권은 그 문장의 문자 그대로다 — **규칙을 어기는 평범한 것이 그림자**이고, 그림자는 원래 도형이다.
2. 🔴 **클러스터 라벨보다 공정이 정체를 정한다**(§2.13 부수). 이 라인은 같은 판정을 두 번 했다 — C3 셋을 「새기나/찍나」로, C6 넷을 「밝은 종이 가법 / 검정 판 가법」으로 갈랐다. 같은 논리를 C4 에 적용한다: **빛 없는 평면 ↔ 빛이 전부인 평면**.
3. 매체 사실 — **음영을 쓰는 어떤 매체도 이 권을 못 그린다.** 요구 1(그림자가 유일한 어두운 것)이 「중간톤 금지」와 같은 말이고, 중간톤을 금지하면 남는 것은 평칠뿐이다.

🔴 **비용을 기록해 둔다: 이걸로 C4 가 4/21 이 되어 C6 와 공동 1위가 된다.** ⚠️ 같은 배치에서 f02 와 같은 클러스터가 됐다 — 원칙적으로 피해야 하는 일이고(§7.6), 여기서는 **요구 1~3 을 만족하는 매체가 C4 밖에 없어서**(음영 0 + 하드에지 불투명 통짜 도형 + 없음을 그리기) 6축 분리로 감수했다. 🔴 **대신 다음 배정 서너 권은 C4 를 완전히 닫는다.** 열게 되면 「빛 없는 등각평면(b01) / 오려 붙인 무지 색면(e120) / 흰 유약면 위 반투명 필름(f02) / 안 칠한 종이 + 불투명 어둠(b04)」 넷과 또 다른 공정이어야 한다.

### 🔴 대본과 그림이 어긋나는 곳 3건 — 전부 「그라데이션 금지」에서 나왔다 (대본 수정 불필요, 삽화 지시만 분기)

이 앵커는 음영·번짐·페이드가 원천 금지인데, 대본 톤 지시 세 곳이 **부드러운 변화**를 요구한다. 셋 다 **하드에지로 옮겼고 의도는 그대로 산다.**

| 쪽 | 대본 톤 | 그림 쪽 결정 | 왜 이게 더 나은가 |
|---|---|---|---|
| p3 | 「위쪽이 밝고 아래가 살짝 어두워」 | 🔴 **아래쪽 계단 몇 칸만 하나의 평칠 그늘판 안에 들어가고, 그 경계는 계단 한 칸의 모서리에서 딱 끊긴다.** 위쪽 계단은 안 칠한 종이 | 「위가 밝다」가 분위기가 아니라 **몇 칸이 그늘에 있나**로 세어진다 |
| p6 | 그림자가 「옅어지다가 그늘 경계에서 끊긴다」 | 🔴 **옅어지지 않는다. 그늘판의 직선 경계에서 도형이 그냥 잘린다** — 잘린 단면이 칼로 자른 것처럼 곧다 | 페이드는 「사라지는 중」이고 하드에지 절단은 「여기까지가 해가 드는 곳」이다. **p7 의 완전 부재를 예고하는 데 후자가 정확하다** |
| p10 | 「저녁 해에 노랗게 물든 흰 회벽」 | 🔴 **노란 빛을 더하지 않는다.** 회벽은 마지막 쪽까지 안 칠한 종이이고, 저녁은 **그림자가 가장 길어지는 것 + 바닥의 그늘판 면적이 가장 커지는 것**으로만 그린다 | 노을을 칠하면 빨강 하나 규율이 깨지고(c37 p10 에서 팔레트가 무너질 최대 후보로 지목된 자리와 같다), 무엇보다 **마지막 쪽에 새 색이 들어오면 열 쪽의 규칙이 마지막에 배신당한다** |

한 가지 더 그림 쪽에서 **확정**했다: p4 의 「천이 흔들릴 때마다 몸이 늘었다 줄었다 한다」는 **한 프레임에 두 순간이라 못 그린다**(§ 해법 카드 ⑤ 한 자세). → **가장 크게 부푼 한 순간**만 그리고, 변화는 **천의 물결이 그림자 도형의 윤곽을 물결 모양으로 꺾어 놓은 것**으로 남긴다.

---

## B-04 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-b04   (village cat and its shadow / Spanish whitewashed alleys)

MEDIUM: opaque flat colour in single passes, in the logic of a hand-pulled screen print - one
  colour, one pass, one flat area, a clean stated edge, then the next colour.
  ZERO SHADING: no gradient, soft edge, blend, bounce light, half-tone, or darkening at the foot
  of a wall. Every shape is one flat value edge to edge.
  THE WHITE WALL IS NOT PAINTED WHITE - it is the paper, left alone. Where two white planes meet,
  ONE thin line says so, never tone.
  THE SHADOW IS A CUT SHAPE: deep violet-indigo, fully opaque, matte, hard clean border, as if
  cut from paper and dropped on the page. It never fades, blurs, haloes, thins at the tip or goes
  translucent; where it stops it is cut straight off. Nothing painted is see-through.
  NO OUTLINES: a form exists because a flat colour area stops there. The only drawn marks in the
  book are five on the cat's face and a few thin lines where one white plane turns into another.
  Brush grain inside a fill and a pass missing its edge by a hair are welcome; softness is not.

PALETTE: bare paper / lime wall #F2F1EC · shadow violet-indigo #3B3160 · shade plate #8A85A0
  (the same violet one step lighter, ONLY for ground or wall the sun cannot reach) · door blue
  #3E7EA8 · geranium red #C8402F · cat grey-taupe #A9A29A, with ears, tail tip, paw tips and face
  marks in the shadow violet.
  THE SHADOW IS THE DARKEST THING ON EVERY PAGE THAT HAS ONE; cat and door are middle values, the
  ground is bare paper. The one warm saturated colour is the red, and it is one object: a pot of
  geraniums (once a scarf). No orange, pink, yellow, warm sunlight or sunset anywhere.

COUNTS (upper limits - count them): paint covers 10-20% of the page, bare paper the rest ·
  cobbles = at most 7 short thin violet arcs, never a paved surface · stair = 1 thin line per
  riser, 0 texture on any tread · door = 1 flat blue area + 2-3 plank lines · geranium = 1 red
  mass + 1 green mass + 1 pot, 0 petals · washing = bare paper shapes with 1 fold and 1 hem line
  each and 3 peg marks · wall = 0 marks (0 plaster cracks, 0 stone joints, 0 tiles).
  FINISHED THINGS PER PAGE = 3: the cat, the shadow as one clean shape, and the ONE prop the cat
  touches. DENSITY RATION = pages 2 and 8 only, spent on PROPS, never on walls.

COMPOSITION: bare paper first, subject second. Real alley perspective built from flat shapes and
  thin lines, never from tone; the shadow's long axis is usually the main diagonal; cat about
  1/6 of page height except on the two close pages; bottom 18% quiet for a caption.

CHARACTER: the cat is a flat grey-taupe shape carrying exactly five drawn marks in the shadow
  violet - ONE almond eye with a reserve of bare paper round it, ONE separate brow stroke, one
  mouth line, three whiskers. Not dot-eyes, no blush, no highlight, no shading in the body. Most
  acting is silhouette: bottle-brush tail, limp tail, tail up, flattened body.
  THE SHADOW HAS NO FACE AT ALL and never speaks - its acting is posture and position only.

SETTING: a white hill village in southern Spain - unornamented lime-washed walls, deep-blue
  wooden doors and grilles, narrow stepped alleys, a small square with a low stone well, washing
  lines wall to wall, geraniums on the walls. European. 16:9 double-page spread, 4-7 year old
  picture book. No lettering or numerals anywhere.

NOT: no digital slickness of any kind - airbrush, gradient, glow, 3D CG, cel-shading,
  photographic, or a texture filter over flat colour (the flat passes must MAKE the shapes) / no
  shading or modelling on any surface, no soft-edged, faded or translucent shadow, no outline
  round any shape / no plaster, stucco or stone texture on the walls / not felt or sculpted clay.
```

**🔴 광원 스케줄 — 해 높이가 곧 그림자 길이다** (열 쪽에서 한 번도 안 흔들린다). 컷마다 `SUN:` `SHADOW:` `FEET:` `RED:` 를 먼저 읽는다.

| | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| **해** | 이른 아침, 아주 낮게 | 아침, 낮게 | 아침, 계단 위 | 오전, 빨래 뒤 | 오전, 더 높이 | 골목에 안 듦 | 🔴 **없음** | 한낮 정수리 | 정수리 | 저녁, 지붕 아래 |
| **그림자** | 벽에 크게 길게 | 바닥에 길게 앞서 | 계단 위로 길게 | 🔴 천에 집채만 | 벽 높이, 중간 | 그늘 경계에서 잘림 | 🔴 **0** | 발밑, 가장 짧고 진하게 | 발밑, 짧게 | 🔴 골목 끝까지 가장 길게 |
| **빨강** | 창턱 화분 | 문 옆 화분 | 계단참 화분 | 빨래줄 스카프 | 창턱 화분 | 골목 입구 화분 | 🔴 **없음** | 우물가 화분 | 프레임 가장자리 | 골목 끝 화분 |

🔴 **발끝 이음(심음)** — 그림자는 언제나 고양이 발밑 한 점에서 시작해 꺾여 나간다. 이음이 없는 쪽은 그림자가 없는 **p7 뿐**이고, p9 에서 고양이가 그 이음을 발견한다.

---

## B-04 §3. 캐릭터 시트 (🔴 이것부터 굽는다)

```
CHARACTER SHEET - AlleyCat   (bake FIRST, before any scene)

Made the same way as the book: opaque flat colour in single passes on bare cool-white paper
#F2F1EC, hard stated edges, ZERO shading anywhere on the body, which is ONE flat fill. Do not
render smoothly or add modelling just because there is no background.

FACE: the head is part of the same flat fill. On it sit exactly five marks in the shadow violet
  #3B3160 - ONE tipped almond eye with a small reserve of BARE PAPER round it so it does not sink
  into the fill, ONE SEPARATE BROW STROKE above it (this stroke is the whole emotional range),
  one mouth line, three whiskers. Ears are flat violet triangles, nose one small wedge. Not
  dot-eyes, no blush, no highlight, no inner-ear pink.
BODY: cool grey-taupe #A9A29A, one flat pass, matte, with ear insides, tail tip and four paw tips
  in violet so the silhouette has four small dark punctuation marks. Nothing else - no stripes,
  no patches, no fur texture, no belly tone. THE CAT IS A MIDDLE VALUE, clearly lighter than the
  shadow and darker than the paper; that gap is why the shadow is findable.
BUILD: a young adult village cat on four legs, lean, long-legged, long mobile tail, head about
  1/4 of standing height.
TAIL IS THE ACTING ORGAN - bake five states as separate silhouettes: relaxed low curve / stiff
  and straight up / bottle-brush (twice as thick) / limp and dragging / hooked forward.
SHEET: full body from the side at child's eye level (the book's main angle) / three-quarter
  walking / a jump with both front paws up a wall / back view sitting, head down, tail limp /
  top-down looking at its own front paw; plus four close-ups carried by the brow and whiskers -
  startled, indignant (brow driven down and in, mouth open), frightened-searching (brow raised in
  the middle, whiskers as five off-parallel strokes instead of three), delighted (eye a crescent,
  brow high). Plain bare paper, no scenery, no red, no cast shadow.
  Test: at thumbnail size the four moods are still distinguishable.
SCENE token: AlleyCat.
```

```
CHARACTER SHEET - ShadowSelf   (bake SECOND, attach as @image2)

Same medium. The second main character: ONE FLAT OPAQUE VIOLET-INDIGO SHAPE #3B3160 on bare
paper, fully covered, matte, hard clean border, as if cut from paper and dropped down.

THERE IS NOTHING INSIDE IT - no eye, mouth, whisker, ear line, darker core, lighter belly,
  texture, gradient or transparency, and whatever is under it does not show through. It never
  speaks and has no face: the drama is POSTURE and POSITION. The border never softens, feathers
  or fades, including at the far tip of a very long shadow; where it ends it is CUT STRAIGHT OFF.
SHAPE LOGIC: the same animal as AlleyCat read as a silhouette, and allowed to be in a completely
  different pose from the cat, because that is the premise. It distorts as a real cast shadow
  does: stretched long by a low sun, kinked at a sharp 90° corner where floor meets wall and
  again at each riser, blown up enormous on a hanging sheet. The kink is a sharp corner, never
  a curve.
SHEET: seven states, each on bare paper with a small AlleyCat silhouette beside it at correct
  scale - 1 stretching (legs forward, back arched, tail up) / 2 striding ahead, not looking back
  / 3 climbing stairs, kinked at each riser / 4 huge on cloth at about eight times scale, one paw
  raised, outline kinked into slow waves / 5 walking high on a wall, calm and out of reach /
  6 cut off dead at a straight shade border, the cut end perfectly flat / 7 short and compact
  under the body, about a third of body length.
  Plus ONE joint detail drawn large: THE FOOT JOIN - a cat's back paw on the ground and the
  shadow's back paw meeting it at exactly ONE POINT, tip to tip, no gap and no overlap. It
  repeats on nine of the ten pages, so its geometry is decided here.
SCENE token: ShadowSelf. Never write "shadow" alone.
```

```
CHARACTER SHEET - VillageKit   (bake THIRD, attach as @image3)

Same medium - flat single passes on bare paper, hard edges, zero shading. Besides the shadow
these are the only things in the book that get paint, so they are settled here.

GERANIUM POT: 1 flat red mass #C8402F + 1 flat mid-green leaf mass + 1 small terracotta pot on an
  iron ring, drawn SMALL at about 1/10 of page height, and the only warm saturated thing in the
  book. 0 petals drawn, no shading, no glow.
BLUE DOOR: 1 flat area #3E7EA8 + 2-3 thin darker plank lines + a small keyhole plate + a low
  stone step. Two states: closed, and open with the doorway behind it as one flat violet area.
WINDOW: a small flat blue frame with a grille of 5 thin lines and 2 crossbars; behind it one flat
  violet area.
WASHING LINE: a thin line wall to wall with one sheet and two shirts, all BARE PAPER shapes with
  1 fold line and 1 hem line each, 3 peg marks, plus ONE red scarf #C8402F (the p4 accent).
STONE WELL: a low flat cylinder of bare paper, 2 thin lines for the coping, 1 flat violet area
  for the dark mouth, an iron arch as 2 thin lines.
STAIRS: bare paper treads separated by 1 thin violet line each. No shading on any tread, ever.
COBBLES: at most 7 short thin violet arcs on bare paper. Never a full pavement.
SHADE PLATE: a flat area of the LIGHTER violet #8A85A0 for ground or wall the sun does not reach,
  its border a straight or cleanly angled line decided by the architecture. Bake one sample beside
  a full-dark shadow so the two values are never confused.
SHEET: all of the above on plain bare paper at correct relative scale with a small AlleyCat
  silhouette for size. No scenery, no perspective, no extra colour.
SCENE tokens: GeraniumPot, BlueDoor, WashingLine, StoneWell, ShadePlate.
```

---

## B-04 §4. 10컷

각 컷은 `STYLE ANCHOR + @image1(AlleyCat) + @image2(ShadowSelf) + @image3(VillageKit) + 아래 블록`.
🔴 **p7 은 @image2 를 붙이지 않는다**(그림자가 없는 쪽이라 붙이면 모델이 어디든 그려 넣는다).
🔴 굽는 순서 = 시트 3장 → **p1(어둠의 기준판) · p7(그림자 0)** → **p9(이음 기준판)** → 나머지 일곱.

### p1 — 고양이는 자는데 벽에서 그림자가 기지개를 켠다 🔴 어둠의 기준판

```
SUN: very low early morning from off-frame LEFT through a window; the lit wedge on the floor is
  bare paper stated by two thin lines.
SHADOW: LARGE AND LONG, and the subject. On the wall above the sleeping cat, ShadowSelf stands in
  a full STRETCH - legs forward, back arched, tail straight up - one flat violet shape, empty.
CAMERA: medium, eye level. Lower third = floor with the cat at lower left; upper two thirds = one
  enormous empty white wall. The whitest, emptiest page: the floor sleeps, the wall is awake.
SUBJECT: AlleyCat on its side by the window, four paws gathered, eye closed as one violet
  crescent, mouth slightly open, tail in a low curve.
FEET: THE PLANT. The shadow begins at the sleeping cat's paw tips, runs across the floor, turns a
  SHARP 90° corner at the wall and climbs. One unbroken shape - no gap, never two shadows.
FINISH: 3 (cat, shadow, the blue window frame). Wall and floor bare paper, 0 marks. This page
  fixes the violet of all ten.
RED: GeraniumPot on the window ledge, small, upper left.
```

### p2 — 그림자가 먼저 문 밖으로 나갔다 🔴 밀도 배급 1/2

```
SUN: low morning crossing the lane from the right; the whole floor glares as bare paper.
SHADOW: LONG, and AHEAD of the cat - ShadowSelf already out in the lane, STRIDING, leaning
  forward mid-step, stretched long toward the left of frame.
CAMERA: medium wide, eye level down the lane; doorway left, lane running away right with a slight
  vanishing point.
SUBJECT: AlleyCat braces both front paws on the threshold and pushes half its body out, eye wide,
  brow high, whiskers forward, ears pricked, hind legs still inside. Startled.
FEET: the shadow's hind paw tips touch the cat's front paw tips on the threshold, then run into
  the lane in one unbroken piece. The cat looks at the far end, not at the join.
FINISH: RATION 1 of 2, spent on props - 5 legible: cat, shadow, the open BlueDoor with its flat
  violet doorway, the WashingLine deeper in (planting p4), the GeraniumPot. At most 7 cobble
  arcs. Walls stay bare paper, 0 marks.
RED: GeraniumPot beside the door.
```

### p3 — 계단을 성큼성큼 오르는데 돌아보지도 않는다

```
SUN: low, above and behind the stairs - the top of the flight in full light, only the lowest
  steps in shade.
SHADOW: LONG AND CLIMBING - ShadowSelf strides up the white wall beside the upper steps, head
  forward, never turned back, kinked where floor meets wall and again at each riser it crosses.
CAMERA: medium, strong LOW ANGLE from the bottom of the flight. Vertical, squeezed, breathless.
SUBJECT: AlleyCat stretched long trying to take two steps at once, mouth open panting, one front
  paw reaching up, a hind paw slipping off a stair edge, brow driven up.
FEET: the join is at its lower hind paw on a step; the shape runs up over the stone onto the wall
  in one piece. It calls at the head of the shape and never looks at its own feet.
SHADE PLATE: the lowest steps sit inside ONE flat plate #8A85A0 ending at the clean edge of a
  single riser - "brighter at the top" is how many steps are inside the plate, not a gradient.
FINISH: 3 (cat, shadow, the steps under it). 1 thin line per riser, 0 texture on any tread.
RED: GeraniumPot on the upper landing, high, to pull the eye up the stairs.
```

### p4 — 흰 천 위에서 집채만 해졌다

```
SUN: mid-morning, higher, and BEHIND the hanging sheet, so the cloth is the brightest bare paper
  and the shadow is thrown onto it from behind.
SHADOW: THE LARGEST IN THE BOOK - scaled up about eight times on the sheet, one front paw raised,
  same flat violet and hard border but the border KINKED INTO SLOW WAVES by the ripples. One
  moment only, at its biggest: do not show it growing and shrinking.
CAMERA: wide, slightly low. Lower quarter = the tiny cat; upper three quarters = the laundry
  filling the frame wall to wall.
SUBJECT: AlleyCat throws its head back to look up, four paws gathered, tail stiff and straight up,
  mouth open, brow driven down while the eye is wide. About 1/8 of page height, so the size gap
  reads instantly.
FEET: the shadow starts at the cat's paw tips on the cobbles, runs a short way, turns a sharp
  corner up the wall and only THEN continues onto the cloth. One unbroken path from paw to giant.
FINISH: 3 (cat, giant shadow, the sheet). Washing = 1 fold and 1 hem line per piece, 3 pegs;
  walls and floor bare paper, at most 7 cobble arcs.
RED: the red scarf on the line - this page's single warm spot. No geranium here.
```

### p5 — 뛰어도 발이 안 닿는다 · 벽이 통째로 비어 있다

```
SUN: higher still, late morning from the upper left; the whole dead-end wall is in full light.
SHADOW: MIDDLE LENGTH, HIGH ON THE WALL - walking calmly sideways along the upper wall, well out
  of reach, unhurried.
CAMERA: medium, eye level, facing a tall blank wall that closes the alley and fills almost the
  frame. The widest empty gap in the book.
SUBJECT: AlleyCat has jumped with everything it has, front paws flat on the wall with claws out
  as three tiny violet ticks, landing far below the shadow. Ears back, TAIL FULLY BOTTLE-BRUSHED
  at twice its thickness, mouth open shouting, brow driven down and in. Furious.
FEET: THE HARDEST JOIN. The cat is airborne, so the shadow starts at the cobbles directly beneath
  it - not at its paws - runs up the base of the wall and continues to the walking shape above.
  Still unbroken and still attached to the ground it left. Never a free-floating shape.
FINISH: 3 (cat, shadow, the high window with its pot). THE BARE-WALL PLATE: two thirds of the
  frame is bare paper with 0 marks - count the lines on this wall and the answer is zero. Four
  claw ticks and two dirt arcs are the only extras.
RED: GeraniumPot on the high ledge.
```

### p6 — 제가 먼저 홱 돌아서 어두운 골목으로 들어간다

```
SUN: high morning, but it does not enter this alley - the lane mouth behind the cat is in full
  light, the depth ahead of it is not.
SHADOW: CUT OFF. It lies behind the cat in the lit lane mouth and where the shade begins it STOPS
  DEAD at a straight border, the cut end perfectly flat as if sliced. No fade, no thinning, no
  trail. Only the part still in sunlight exists.
CAMERA: medium wide, eye level from behind the cat into a very narrow alley where two bare walls
  almost touch and a thin strip of sky shows far above.
SUBJECT: AlleyCat walks away from us, back to camera, head down, TAIL LIMP AND DRAGGING,
  shoulders stiff. We cannot see its face and do not need to - it turned away first.
FEET: the join exists behind it briefly - the shape leaves the paw tips, crosses the last sunlit
  floor and is cut off at the shade border. It did not run away; the light ran out.
SHADE PLATE: the far two thirds of the lane, floor and both walls, is ONE flat plate #8A85A0 with
  a cleanly angled border and nothing inside it: 0 cobbles, 0 doors, 0 texture.
FINISH: 3 (cat, the cut shadow, the lane mouth). Bright behind, flat and cool ahead, stated by
  ONE hard border and never by a gradient.
RED: GeraniumPot at the lane mouth - the last red before it disappears.
```

### p7 — 그림자가 없다 🔴 어두운 것도 따뜻한 것도 없는 유일한 쪽 (@image2 를 붙이지 않는다)

```
SUN: NONE. No light direction anywhere, no lit wedge, no bright edge, nothing casting anything.
SHADOW: NONE. NO CAST SHADOW ANYWHERE ON THIS PAGE - not under the cat, not on a wall, not on the
  floor, not in the corner where walls meet. THE FLOOR BENEATH THE PAWS IS COMPLETELY CLEAN. Do
  not substitute a faint shadow, a soft one, a small one, or contact darkening under the paws.
FEET: NO JOIN - the only page without one, and the empty paper under the paws is where the eye
  is supposed to go.
CAMERA: medium close-up, eye level, the cat alone in the middle of the alley.
SUBJECT: AlleyCat dropped low, turning its head, one front paw lifted and stopped in the air, eye
  at its widest, brow raised in the middle, ears splayed, WHISKERS AS FIVE OFF-PARALLEL STROKES
  INSTEAD OF THREE. Head angled DOWN, at the place where the shadow should be.
FINISH: 2 (the cat, and three or four dry leaves as small flat violet shapes). The WHOLE PAGE is
  one flat ShadePlate #8A85A0 - floor and both walls, one pass, nothing inside it - plus one thin
  strip of bright bare paper far above. Not faded, not hazy: one colour laid once.
RED: NONE. The only page with no red, and the same page with no shadow - do not add a pot to
  "balance" the composition.
```

### p8 — 광장으로 뛰어나오자 발밑에서 나왔다 🔴 밀도 배급 2/2

```
SUN: HIGH NOON, directly overhead. Everything casts a short compact shadow straight down.
SHADOW: THE SHORTEST AND MOST CONCENTRATED - directly under AlleyCat, about a third of body
  length, in the same mid-jump pose; small on a glaring page, so it reads as a compact
  unmistakable dark blot at the cat's feet.
CAMERA: wide, HIGH ANGLE down into a small square, the stone floor filling most of the frame so
  cat and shadow are seen together from above. The hottest, most open page.
SUBJECT: AlleyCat has burst out of the alley and jumped, all four paws off the ground, tail
  straight up, mouth wide open, eye a crescent, brow high, head tipped DOWN at its own feet.
FEET: the join is directly under the body and impossible to miss - hind paw tips touching shadow
  hind paw tips at one point, both doing the same jump. After a page with no shadow, this is the
  payoff.
FINISH: RATION 2 of 2, spent on props: cat, shadow, the StoneWell with its iron arch, the ring of
  BlueDoors, the GeraniumPot, a water splash as two thin arcs, and at one frame edge the dark
  alley mouth as a flat ShadePlate. At most 7 cobble arcs; do not draw the stones of the square.
RED: GeraniumPot by the well.
```

### p9 — 발끝이 딱 붙어 있다 🔴 발견 · 이음의 기준판

```
SUN: high noon still, directly overhead - no direction, only the short shadow underneath.
SHADOW: SHORT, seen from almost straight above as a compact violet shape under the cat doing
  exactly what the cat does - one front paw raised, tail swinging one way.
CAMERA: CLOSE-UP, HIGH ANGLE, almost straight down at the cat's paws and the shadow's paws. Much
  closer than any other page. The brightest page with the smallest dark shape.
SUBJECT: upper frame, AlleyCat with one front paw lifted a little, head bent right down to look
  under itself, eye wide, brow raised, whiskers forward. Lower frame, ShadowSelf with the same
  paw lifted and the same tail swing.
FEET: THE PICTURE THE BOOK EXISTS FOR. Dead centre, drawn big: one hind paw of the cat and one
  hind paw of the shadow meeting at EXACTLY ONE POINT, tip to tip, no gap, no overlap, no third
  shape between them. THE JOIN REFERENCE PLATE - this geometry is copied into the other eight.
FINISH: 3 (the paws and the join, the shadow, one small pebble). The stone floor is bare paper
  with 2-3 thin violet lines in total; do not draw the square, the stones or the far side.
RED: GeraniumPot cropped at the frame edge, small, kept OUT of the centre.
```

### p10 — 골목 끝까지 가장 멀리 · 발끝 한 줄로 이어져 있다 🔴 착지 = 이음

```
SUN: LOW EVENING, below the roofline, raking down the alley from off-frame right. THE LIGHT IS
  NOT WARM - no yellow, orange, golden hour or sunset. Evening is stated by LENGTH and by how
  much ground is inside the shade plate; nothing changes colour.
SHADOW: THE LONGEST IN THE BOOK - it runs from the cat at near right across the whole frame to
  the far wall, ONE unbroken flat violet shape, kinked once where floor meets far wall, its far
  front paw lifted in exactly the same small gesture as the cat's. No thinning at the tip.
CAMERA: wide, eye level down the length of the alley; cat at near right, alley running away left.
  Quiet, level, ordinary - the day is over and nobody learned anything.
SUBJECT: AlleyCat with one front paw tapped up in the air, head turned aside to look at the far
  end of its own shadow, eye a crescent, brow high, the other paw already a step forward.
FEET: THE LANDING. From the join at the near paw the reader follows ONE CONTINUOUS VIOLET LINE to
  the far wall - not one break, not one lighter passage along its whole length.
FINISH: 3 (cat, the long shadow, the nearest BlueDoor). Every door casts its own long shadow the
  same way - same sun, no exceptions. Walls and floor bare paper; the far wall is one flat plane
  so the shadow's tip and the red pot are the only things on it. Lower third = one shade plate.
RED: GeraniumPot at the far end, where the shadow's run ends. Nowhere else - sky, walls and cat
  stay free of warm colour. The most likely place in the book for the palette to break.
```

---

## 첫 렌더 검수 체크리스트 (6항목)

> 사용자가 GPT 로 뽑은 뒤 이걸로 판정한다. 🔴 **하나라도 걸리면 문구를 늘리지 말고 ref 를 바꿔라**(§5.1 — 문구로 세 번 실패하면 레버가 틀린 것이다).

| # | 볼 것 | 실패 시 처방 |
|---|---|---|
| 1 | 🔴 **회벽에 회색 음영·반사광·회반죽 결이 들어왔나.** 이 앵커 최대 실패 모드다. 벽이 「칠한 흰색 + 부드러운 그늘」이면 그림자가 유일한 어두운 것이 아니게 되고 이 책의 사건이 화면에서 사라진다 | 문구 튜닝 금지. **벽이 통째로 안 칠한 맨 종이로 남은 승인 컷(p5)을 먼저 확보해 ref 로 고정**하고 나머지를 그 뒤에 뽑는다 |
| 2 | 🔴 **p7 에 그림자가 정말 하나도 없나.** 발밑 접지 어둠·희미한 그림자·옆 벽의 그림자가 한 조각이라도 있으면 이 권의 반전이 통째로 없어진다. **같은 쪽에 빨강도 없어야 한다** | p7 에 @image2(ShadowSelf)를 붙이지 않았는지 확인. 그래도 그려 넣으면 **p7 을 「그림자 없는 승인 컷」으로 단독 확보한 뒤 그것을 ref 로** 나머지를 뽑는다 |
| 3 | 🔴 **발끝 이음이 아홉 쪽에서 한 조각으로 이어져 있나.** 그림자가 고양이에게서 떨어져 자유롭게 떠 있거나, 이음이 겹치거나 벌어져 있으면 독자가 고양이보다 먼저 아는 정보가 없어진다 (특히 p5 = 고양이가 공중에 뜬 쪽) | **p9(이음 기준판) 승인본을 나머지 여덟 컷의 ref 로 첨부**한다. 문구로 접점 기하를 재현시키려 하지 말 것 |
| 4 | **그림자 길이가 해 높이와 맞나.** p8·p9(정수리, 가장 짧다)과 p10(저녁, 가장 길다)을 나란히 놓아 본다. 한 쪽에서 방향이 틀리면(문 그림자와 고양이 그림자가 서로 다른 쪽으로 눕는 등) 「저 혼자 움직인다」가 규칙에서 사고로 내려앉는다 | 광원 스케줄 표대로 그 쪽만 다시 굽고, 프레임 안의 **모든** 사물이 같은 방향으로 눕는지 센다 |
| 5 | **빨강이 제 자리에만 있나.** p7 에 있으면 실패. p10 에 노을·황금빛이 들어왔으면 실패. 고양이 코·집게발·귀 안쪽이 분홍이면 실패 | PALETTE 의 "no second warm accent" 뒤에 실제로 샌 사물을 이름으로 못 박고 재시도. 2회 실패면 **빨강 없는 승인 컷을 ref 로 먼저 확보**하고 빨강 있는 컷을 나중에 굽는다 |
| 6 | 🔴 **그림자 안에 무엇이 들어 있나.** 눈·입·수염·더 진한 심·투명한 끝·번진 테두리가 있으면 실패다. 그림자는 통짜 한 색이고 말을 하지 않는다 | ShadowSelf 시트를 다시 굽는다. **시트에서 통짜가 안 되면 장면에서는 절대 안 된다**(§2.4) |

부수 1: **고양이가 매끈한 CG 로 회귀했나**(§2.4 최대 실패 모드) — 눈에 하이라이트 점이 있거나 털에 음영·그라데이션이 있으면 장면을 고치지 말고 **AlleyCat 시트를 다시 굽는다.**
부수 2: **점눈이 라인과 나란히 놓아 본다** — 종이가 따뜻한 크림으로 돌아왔거나, 눈이 점 두 개가 됐거나, 배경이 색연필 해칭이면 4축 분리가 무너진 것이다(§7.2).
부수 3: **자세만으로 기분이 읽히나** — 썸네일로 줄여 p5(부푼 꼬리)·p6(늘어진 꼬리)·p8(선 꼬리)을 구별할 수 있어야 한다. 못 하면 C4 의 표정 한계(§2.8)가 실제로 터진 것이므로 **꼬리 다섯 상태를 시트에서 다시 확정**한다.

## 라인 정체 점검 (이웃한 권과 나란히)

🔴 **첫 렌더가 나오면 f02 · b01 · e120 과 네 권을 반드시 붙여 본다** — 같은 라인 C4 넷이고, 🔴 **f02 가 이 중 가장 위험하다**(같은 세션 · 흰 바탕 · 청색 계열 · 음영 0). 판정 문장 넷: ① **판이 갈색 마분지인가 / 저채도 회청인가 / 칠한 흰 유약면인가 / 안 칠한 흰 종이인가** ② 🔴 **윤곽선이 있나**(b04 만 없다) ③ 🔴 **그늘이 반투명 필름인가 불투명 도형인가**(f02 ↔ b04) ④ **화면의 몇 할이 칠해져 있나**(f02 는 방 전체, b04 는 1~2할). 둘이 헷갈리면 b04 에서 칠한 면적을 더 줄이고 윤곽선이 한 획도 없는지 다시 본다.
그리고 **g88 과 한 번 붙여 본다** — 정확히 뒤집힌 한 쌍이라(검정 판에 빛을 얹기 ↔ 흰 종이에 어둠을 얹기) 두 권이 나란히 있으면 이 라인의 정체가 가장 잘 보인다. 🔴 단 b04 에 모델링이 들어오면 그 즉시 g88 의 아래쪽 사촌이 되므로, **음영 0** 이 이 대조의 조건이다.
