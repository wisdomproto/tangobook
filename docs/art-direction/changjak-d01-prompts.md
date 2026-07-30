# 창작동화 1000 — D-01 「산 너머엔 뭐가 있어?」 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`(§2.7 · §2.9 · §2.10 · §2.11 · §2.12 · §2.13 · §2.14 · §7.2 · §7.3 · §7.5), 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/d01.md`.** 아래 12컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다.
> 🔴 **작가 실명은 한 글자도 안 들어간다.** 근거 후보 id 는 판정 표에만 남기고 프롬프트에서는 전부 문구로 옮겼다.
> 🔴 **이미지 생성은 art-director 가 하지 않는다.** 아래는 사용자가 직접 굽기 위한 프롬프트 세트다.
> ⚠️ **이 권은 A-01 과 같은 무대(알프스 산마을)다.** §1 의 분리표를 먼저 읽어라 — 두 앵커는 **한 획도 겹치지 않게** 설계했고, 그 분리가 깨지면 두 권 다 죽는다.

## 0. 실행 순서 (어기면 인물만 매끈한 CG 로 나온다 — §2.4)

1. 🔴 **판 견본 한 장(`PlateKit`)을 가장 먼저 굽는다** — 캐릭터 시트보다 먼저다(§2.14: 물성이 정체인 앵커에서는 재료 시트가 먼저). 이 책의 세계는 전부 찍은 판이고, 판의 결이 안 서면 나머지 전부가 디지털 평면 색으로 나온다.
2. **그 다음 캐릭터 시트 셋**: `KidGoat` → `HerdGoats` → `LakeGoats`. 장면 금지.
3. 🔴 **12컷 중 「능선 판」 두 장을 먼저 확정한다** — **p4**(겹이 처음 보이는 쪽, 뒤에 셋)와 **p8**(겹이 최다인 쪽, 다섯 + 두 골짜기가 한 화면). 겹이 셀 수 있게 서는지, 뒤 판이 얇게 찍혀 창백해지는지가 이 책의 사건 전부다. 두 판이 흔들리면 나머지 열 장을 다시 굽는다.
4. 그 다음 **p2** → 나머지 → 🔴 **p11 은 맨 마지막에, p2 승인본을 `@image` ref 로** 굽는다(같은 문·같은 각도·반대 방향, **좌우 반전 금지**).
5. 승인 렌더 3장을 앵커 보관함 ref 슬롯에 넣는다 — 🔴 **인물 컷 1 · 배경이 판 두세 장으로만 끝난 컷 1(p7)** · **전체 장면 1(p8)**. 3장이 전부 완성형이면 "비탈은 판 두세 장으로 끝낸다"는 문구가 영영 안 먹는다(§2.7 보정).
6. 앵커 이름은 **렌더를 보고 짓는다**(§7.5-3). 지금은 슬러그만 쓴다: `changjak-d01`.

---

## D-01 §1. 앵커 배정

**한 줄**: 🔴 **산은 찍어서 쌓고, 불빛만 손으로 놓는다.** 능선 하나 = 마스크로 찍은 판 한 장이라 겹이 물리적으로 세어지고, 뒤로 갈수록 잉크를 얇게 찍어 창백해지니 **높이가 곧 판의 겹수**다. 그리고 🔴 **찍힌 세계 안에서 손으로 만들어진 것은 딱 둘 — 염소와 집의 불빛**이다. 앵커 슬러그 `changjak-d01` — **신규 민팅** (🔴 **C9 둘째**, 공정이 f05 와 반대다).

### 🔴 먼저 — 같은 알프스를 어떻게 갈랐나 (이게 이번 배정의 핵심 판정이다)

A-01 과 D-01 은 **같은 무대**다. 무대가 같으면 소품·색·빛이 저절로 겹치고, 라이브러리 카드에서 나란히 놓이면 이 라인의 유일한 정체("권마다 다 다르다")가 무너진다. 그래서 **매체와 공정을 정반대로** 잡았다 — 한 권은 **손으로 그린 책**, 한 권은 **찍어서 쌓은 책**이다.

| 축 | **A-01 「부끄러우면 털이 빨개져」** | **D-01 「산 너머엔 뭐가 있어?」** (이 권) |
|---|---|---|
| 클러스터 | C8 (수채 번짐, 2/8) | **C9 (믹스드 콜라주 · 질감판 겹치기 ②, 2)** |
| 🔴 만드는 행위 | **그린다** — 연필과 붓, 처음부터 끝까지 손 | **찍는다** — 마스크를 잘라 롤러·스폰지로 잉크를 얹은 판을 한 장씩 쌓는다 |
| 🔴 손으로 만든 것 | 화면의 전부 | **딱 둘 — 염소와 집의 불빛.** 나머지 전부가 인쇄된 판이다 |
| 물감의 방향 | **종이 안으로** 스민다(번지고 물러난다) | **종이 위로** 쌓인다(판이 겹치고, 겹친 자리가 어둡다) |
| 지배면 | **맨 종이**(여우의 원래 털색이 곧 안 칠한 흰 종이) | **맨 종이가 0** — 하늘까지 판으로 찍혀 있고, 종이는 **얇게 찍힌 판에서 올라오기만** 한다 |
| 엣지 | 없다 — 번져 사라지고 **물테** 하나만 남는다 | **마스크의 칼선** — 윤곽선이 아니라 **색면의 끝**이 형태다 |
| 표면 | 매끈하다(결은 종이의 결뿐) | **모든 형태가 결을 가진다**(롤러의 평행 결 · 스폰지의 알갱이) |
| 어둠 | **워시를 겹친 횟수**(최대 3겹) | 🔴 **겹수는 거리(대기 원근)이고, 어둠은 아래에서 올라와 덮는 판 한 장**이다 |
| 색 | 세계에 색이 **없다**(회색 한 색 + 흑연) + 빨강 하나 | 세계가 **색면들**이다(볕 초록 · 그늘 초록 · 회청 · 흙 · 호수) + **손으로 놓은 금색 하나** |
| 악센트 | **주인공의 몸에서 번지는 빨강** — 감정의 기록 | **집의 불빛** — 목적지의 기록. 🔴 **빨강은 한 점도 없다** |
| 알프스의 무엇을 그리나 | 🔴 **좁음** — 바위벽, 어깨 폭, 길 하나. 수직으로 조이고 시야가 막힌다 | 🔴 **넓음** — 겹겹 능선, 아래로 작아지는 마을. 수평으로 층지고 시야가 열린다 |
| 카메라 | 아이레벨 고정, 프레임이 좁다 | 극단 앙각 ↔ 극단 부감 ↔ 실루엣 ↔ 파노라마, 쪽마다 다르다 |
| 인물 크기 | 얼굴이 화면을 채우는 쪽이 둘(p8·p9) | **손톱만 하다** — 얼굴이 화면을 채우는 쪽이 하나도 없다 |
| 🔴 의인화 등급 | **전원 이족** — 뒷발로 걷고 앞발이 손이다(우유통·우산·바구니·옷) | **전원 사족** — 네 발로 걷고 옷도 소지품도 없다. 목에 **방울 하나**뿐 |
| 마을의 성격 | 동물들이 **사람처럼 사는 마을**(가게·빨랫줄·문패) | **짐승이 산을 넘는 이야기** — 마당·돌담·헛간·여물통까지가 세계의 끝 |

썸네일에서 하나는 **거의 흰 책**, 하나는 **결이 있는 색면들이 층으로 쌓인 책**이다. 🔴 **첫 렌더는 반드시 두 권을 나란히 놓고 본다.**

### 이 권이 그림에 요구하는 것 (판정의 전제)

1. 🔴 **「같은 것이 반복되는데 조금씩 다름」이 이 권의 축이다.** 넘으면 또 산이다. 그림이 그 반복을 **셀 수 있게** 만들어야 하고, 동시에 **지루해지지 않게** 매 쪽 화면을 다르게 갈라야 한다.
2. 🔴 **높이가 정보다.** 올라갈수록 아래가 작아지고 뒤 능선이 늘어난다. 대본이 무대를 물리 조건으로 못박아 뒀다 — 오르는 데 오전 내내(p3) · 꼭대기에서만 다음 산이 보이고(p4) · 해가 봉우리에 가려 일찍 지고(p8) · **어둠은 골짜기 바닥부터 차오른다**(p10).
3. 🔴 **「그 산 위에서만 보이는 것」 = p8 의 것이다.** 본문을 확인했다: **해가 건너편 봉우리로 내려가 새 마을은 벌써 그늘에 들어갔는데, 능선 두 개 너머 제 골짜기에만 아직 빛이 남아 창에 불이 하나씩 켜지는 것.** 그것을 **마지막에 처음 보이게** 하려면 앞 쪽들에서 감춰야 한다.
4. **p7 은 무텍스트다** → §2.12 에 따라 밀도 배급 우선권. 단 대본이 그 쪽의 명제를 「밀도가 아니라 따라갈 선 하나」로 못박아 뒀다 — 해소는 아래 「밀도 배급」 항.
5. **후렴은 p2·p11 두 번뿐**이고 거울이다(같은 문·같은 각도·반대 방향). 이건 엔진 규정이라 고르는 자리가 아니다.

### 후보 3

| | 후보 ① **C9 질감판 겹치기 · 찍어 쌓은 산 + 손으로 놓은 불빛** (`teckentrup-samesky` + `carlin-kingsky` + `robinson-milo`) | 후보 ② C7 두껍게 얹은 불투명 과슈 · 나이프 띠 (`lundberg-ingen` + `buro-street`) | 후보 ③ C3 프린트-크래프트 · 리소 판 겹치기 |
|---|---|---|---|
| 매체 | 냉회백 인쇄지에 **마스크(스텐실)를 잘라 롤러·스폰지로 잉크를 얹은 판**을 한 장씩 찍어 쌓는다. 인물만 손칠 + 왁스 크레용 선 | 회청 밑칠 판 위 불투명 과슈를 **팔레트 나이프**로 얹어 능선 하나 = 띠 하나 | 리소·스크린 잉크 2~4판을 겹쳐 능선을 만든다 |
| 이 권에 맞는 이유 | 🔴 **능선 하나 = 판 한 장이라 겹이 공정 차원에서 세어진다**(§2.11·§2.14 — 회화 매체가 개수를 뭉개는 이유가 찍기에는 원천적으로 없다) · 🔴 **높이가 잉크의 두께다** — 뒤 판을 더 얇게 찍으면 종이의 회백이 올라와 창백해지므로 **대기 원근이 안개·블러 없이 공정에서 나온다** · 🔴 **어둠이 「아래에서 올라와 덮는 판 한 장」**이라 대본의 물리 조건(어둠은 골짜기 바닥부터 차오른다)이 그대로 공정이 된다 · 🔴 **찍힌 세계 안에 손으로 놓인 것이 딱 둘(염소·불빛)** = 이 책이 향하는 것 전부가 물성으로 갈린다 | 능선 겹을 세는 데는 좋고 명암 대비도 강하다 | 겹치는 판이 개수를 강제한다(§2.11 정본) |
| 리스크 | AI 가 콜라주를 **질감 오버레이·사진으로 뭉갠다**(§7.3 이 적어 둔 C9 유일 리스크) → 처방 = §2.14 대로 **`PlateKit`(판 견본 한 장)을 가장 먼저 굽고 전 컷에 붙인다.** 사진은 한 장도 안 쓴다 | 🔴 **같은 세션에 d03 이 C7 을 썼다** — 프랑스 시골 **상공 여정**, **두꺼운 임파스토가 서사**, 고도가 정보. 즉 **주제군 D · 두꺼운 물감 · 높이**가 셋 다 겹친다. 게다가 §7.5 가 「다음 배정 서너 권은 C7(3) 을 완전히 닫는다」로 갱신됐다 | 🔴 **C3 이 이미 셋**(a11·c60·e03)이고 §7.5 가 닫으라고 했다. 무엇보다 **c60 이 이미 「담색 판을 겹쳐 덮는」 권**이라 공정이 겹친다 |
| 판정 | ✅ **추천** | 🔴 **탈락 — 라인 내 중복.** 개별로는 좋았고 실제로 이 앵커를 먼저 설계했으나, 형제 권 prompts 를 열어 대조한 결과(§7.5-848 이 요구하는 절차) d03 과 3축이 겹쳤다 | 탈락 — C3 포화 + c60 과 공정 중복 |

### 🔴 추천 = 후보 ① — C9 「찍어 쌓은 산 · 손으로 놓은 불빛」

근거 세 줄:

- **공정이 능선을 센다.** 반복을 보여주는 책에서 겹의 개수가 뭉개지면 이야기가 없다. 마스크로 찍은 판은 **물리적으로 같은 종류의 도형**이라 아이가 주판알처럼 센다(§2.11·§2.14). 그리고 뒤 판은 잉크를 얇게 얹어 창백해지므로 **셈과 거리감이 같은 한 동작에서 나온다** — 안개·블러·글로우가 들어올 자리가 없다.
- **어둠이 판 한 장이다.** 대본이 「어둠은 골짜기 아래에서부터 차올라 왔다」를 물리 조건으로 못박았다. 이 앵커는 그것을 **어두운 판 한 장을 화면 아래에서 위로 덮는 것**으로 그린다 — 그 아래 것들이 판 밑에서 형태만 남는다. 문구로 부탁하는 게 아니라 **덮은 것이 덮인 것이다.**
- **악센트가 유일하게 찍지 않은 것이다.** 집의 불빛은 판이 아니라 **손으로 얹은 불투명 금색**이다. 그래서 ①여정 내내 화면에 없고 ②p8 에서 가장 멀리 처음 나타나고 ③p11 에서 처음으로 염소 몸에 닿고 ④p12 에서 하나씩 꺼진다. 대본 note 의 「부르는 것이 있어서 돌아온다」를 **물성이 진다** — 인쇄된 세계 안에서 손이 놓은 것 둘이 서로를 향한다.

**🔴 §2.9 의 새 변형 = 「악센트가 목적지다」** (지금까지 확립된 일곱 — ①더하기 a04 ②안 칠한 자리 a91 ③들어낸 자리 e09 ④덮인 층 c60 ⑤주인공의 재료 c01 ⑥칠 자체가 희소 자원 b04 ⑦물감의 높이 d03 — 에 여덟째를 더한다): **악센트가 여정 내내 0 이고, 정점에서 가장 멀리 처음 보이고, 도착해서 주인공의 몸에 닿는다. 그리고 그것은 세계와 다른 방법으로 만들어져 있다.** **여정과 귀환 엔진 권 전체에 재사용할 것.**

### 🔴 여정과 귀환 엔진은 미검증이다 — 그림 쪽에서 조심할 것 4가지

이 엔진은 이 라인에서 이 권이 처음 착지하는 자리다(d03 은 누적·반복). 그림 쪽 위험은 이렇게 본다.

1. 🔴 **이 엔진의 유일한 고장은 「반복이 지루해지는 것」이다.** 열두 쪽 중 여섯 쪽이 「비탈 위에 염소 하나」다. → 처방 셋: **①컷마다 `RIDGE:` 줄**(몇 번째 능선 · 뒤에 몇 겹 · 앞 능선이 화면 어디까지 내려왔나) **②능선 겹수를 계단이 아니라 도약으로**(0→0→0→**3**→2→2→1→**5**→2→3→0→1) **③카메라 레퍼토리를 쪽마다 강제**(극단 앙각 · 측면 · 극단 부감 · 실루엣 · 클로즈업 · 미디엄와이드 · 파노라마 · 부감 · 로우앵글 · 백샷 · 측면 · 와이드 — 같은 앵글이 연속으로 두 번 나오는 자리가 없다).
2. 🔴 **여정 책은 「경치」로 흘러 사건이 사라진다.** → 매 쪽에 **그 쪽에서만 새로 보이는 것 하나**를 못박았다(`RIDGE:` 와 `LIGHT:` 두 줄이 그 역할). 인물은 손톱만 하므로 **자세 하나로만** 말한다 — 대본이 이미 그렇게 써 뒀다(목을 젖힘 / 발 하나가 문턱 밖 / 몸은 앞인데 목만 뒤 / 네 발이 다 공중에).
3. 🔴 **마지막에 보일 것을 앞에서 미리 보여주면 여정이 무의미해진다.** → 규칙: **p1~p7 에는 금색이 한 점도 없고, 첫 능선을 넘은 뒤 제 골짜기는 프레임에 아예 없다**(p4·p7 에서 카메라는 절대 뒤를 안 본다). p8 에서 두 골짜기가 처음으로 한 화면에 들어온다.
4. **착지가 「목록」이라 마지막 쪽만 시선 이동 구도**다(좌→우로 훑으며 하나씩 꺼진다). 다른 쪽에서 훑는 구도를 쓰면 p12 가 안 특별해진다.

### 🔴 라인 충돌 확인 (필수)

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 🔴 **이 앵커의 최대 근접 위험이 여기다** — 스폰지 알갱이 결이 「보풀」로, 겹친 판이 「천 조각」으로 보일 수 있다. 막는 방법 = **판은 언제나 한 겹 두께의 평면 인쇄**이고 결은 **찍힌 잉크의 알갱이**이지 섬유가 아니다. NOT 절에 `no fibre / no fuzzy edge / no stitching / no fabric weave / no felted mass / paper is one sheet thick` 를 박았고 검수 부수 1번으로 올렸다 |
| 전래동화 **점눈이** | ✕ (4축 전부) | ① **종이** — 밝은 크림 ✕ / **차가운 회백, 그리고 그 종이가 거의 안 보인다**(판이 덮는다) ② **얼굴** — 점눈 ✕ / 아몬드 눈 + **수평 염소 동공 + 별개 눈썹선**(목을 젖히고 뒤로 돌리고 뜬 채 있는 세 상태가 필수) ③ **악센트** — 「매 화면 빨강 1점」 ✕ / **빨강이 아예 0**, 따뜻한 것은 **집빛이고 그건 점이 아니라 목적지**이며 일곱 쪽에 없다 ④ **매체** — 느슨한 색연필 낙서 ✕ / **찍은 판 + 인물에만 왁스 크레용 윤곽**(배경에는 선이 한 획도 없다) |
| **A-01**(같은 무대) | ✕ | 위 분리표 14축 |
| **f05**(C9 첫 사용) | ✕ — 🔴 **공정이 반대다** | f05 = **오려서 붙인다**(가위 엣지가 정체 · 겹치면 종이가 두꺼워진다 · 무늬가 손인쇄 종이). d01 = **찍어서 겹친다**(마스크의 칼선 · 언제나 한 겹 평면 · 결이 롤러와 스폰지). §7.5 가 「C9 둘째는 **질감판 겹치기 ②** 계열로」라고 지정해 둔 조건 그대로다. 소재도 부엌 실내 ↔ 산 야외 |
| **c60**(담색 판을 겹쳐 덮는다) | ✕ | c60 = **겹수가 변하는 것**이 서사(안개가 흰 양을 덮는다). d01 = **겹수는 변하지 않고 거리를 뜻하며**, 변하는 것은 **어두운 판 한 장이 아래에서 올라오는 것**과 **손으로 놓인 금색**이다. 그리고 d01 은 🔴 **찍은 세계 + 손으로 만든 주인공**의 이원 구조라 c60(전면 인쇄)과 화면의 구성이 다르다 |
| **e120**(오려 붙인 무지 색면) | ✕ | **무지 ↔ 결.** e120 은 색면에 아무 결이 없고, 이 권은 모든 형태가 결을 갖는다 |
| **d03**(같은 주제군 D · 여정) | ✕ | **두께 ↔ 한 겹.** d03 = 두꺼운 임파스토가 무게를 말하는 **하늘 책**(위에서 아래를 본다). d01 = 한 겹 평면 인쇄가 거리를 말하는 **산 책**(아래에서 위를 올려다보고 층을 센다). 🔴 첫 렌더는 두 권도 나란히 볼 것 |
| 자연관찰 라인(실사) | ✕ | 🔴 알프스 자연을 그리므로 검수 항목이다 — **도감이 되면 안 된다.** 풀·나무·바위를 종(種)으로 그리지 않고 **판과 결**로만 그린다(재질 번역 규칙 참조) |
| 세계명작 수채 그림풍 | ✕ | 인쇄판 콜라주. 투명 수채 아님 |

### 🔴 밀도 배급 (§2.10·§2.12) — 그리고 §2.12 와 대본이 부딛히는 곳 1건

무텍스트 쪽이 **p7 하나** 있으므로 §2.12 우선권이 발동한다 → 슬롯 둘은 **p7 · p12**.

🔴 그런데 대본이 p7 의 명제를 못박아 뒀다: **"밀도가 아니라 따라갈 선 하나로 버티는 쪽"** — §2.12 는 밀도를 주라 하고 대본은 금지한다. **판정: 대본이 이긴다. 단 §2.12 의 판정 문장을 그대로 적용해 해소한다** — §2.12 는 "밀도는 소품에만 주고, 판정 문장은 「소품 N개가 각각 알아볼 수 있게 있나」"라고 했다. 대본은 이미 그 **N=5**(눈 녹은 도랑 · 바람에 휜 외딴 나무 · 무릎 높이 돌무더기 · 바위 그늘의 잔설 · 꼭대기 나무 십자)를 **선 위에 순서대로** 배치해 뒀다. → **소품 다섯 장에만 판을 따로 찍고 크레용 윤곽을 주고, 비탈은 통째로 판 두세 장으로 끝낸다.** 두 규칙이 정확히 같은 것을 시킨다.

두 번째 슬롯 **p12** 는 착지가 「꺼지는 순서」라 네 개가 각각 알아볼 수 있어야 한다(등불 → 여물통 반사 → 창 → 방울). 🔴 **밀도는 그 네 개와 마당 소품에만, 산과 돌담에는 절대** — 산에 바위를 그리면 두 쪽이 같이 죽고 자연관찰 라인과도 겹친다.

---

## D-01 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-d01   (young goat / alpine valley / over the mountain there is another)

Style: a hand-printed collage picture-book page for 4-6 year olds. Wide, high, quiet, layered.
  The subject of the book is HOW MANY RIDGES THERE ARE AND HOW HIGH WE ARE, so the world is
  BUILT UP OUT OF PRINTED PLATES that can be counted. Legible before it is pretty.

MEDIUM - the process is the style, name it every time. Two languages on one page:
  THE WORLD IS PRINTED. Every shape in the landscape - sky, ridge, slope, rock, snow, road,
  water, roof, wall - is made by CUTTING A MASK AND PRINTING ONE FLAT PLATE OF INK THROUGH IT
  with a hard rubber roller or a sponge. That means:
    - every shape has a HARD CUT EDGE (the edge of the mask). 🔴 THERE ARE NO OUTLINES ANYWHERE
      IN THE LANDSCAPE - a shape ends because the colour ends.
    - every shape CARRIES A VISIBLE GRAIN inside it: long parallel roller streaks, or the speckle
      of a sponge, with small gaps where the ink skipped. 🔴 A flat shape with no grain in it is
      wrong.
    - plates OVERLAP. Where a plate crosses another, the ink is semi-transparent and the plate
      underneath shows through, slightly darker.
    - 🔴 EVERY PLATE IS ONE SHEET THICK. Nothing is ever pasted up so it stands proud of the page.
  THE LIVING THING IS NOT PRINTED. The goat is PAINTED BY HAND in flat opaque colour and drawn
  with a short WAX CRAYON line - a broken, slightly waxy contour that skips on the paper grain.
  Small props (a cairn, a tree, a gate, a trough) get their own small printed plate PLUS a crayon
  contour. 🔴 So there are exactly two hand-made things in this book: THE GOAT AND THE HOUSE
  LIGHT. Everything else was printed.
  Nothing is blended, softened, glazed, airbrushed or tidied. No digital gradients anywhere.

🔴 PLATE LAW - check this on every single page. The plates only ever do two jobs:
  A. OVERLAPPING MEANS DISTANCE. One ridge = one plate. Ridges are printed in THE SAME grey-blue
     ink, and each plate further back is printed THINNER, so more of the cold paper comes up
     through it and it goes paler and flatter. 🔴 The reader must be able to COUNT how many
     ridges are behind the one the goat is standing on. That count is the plot.
  B. ONE DARK PLATE, RISING FROM THE BOTTOM, IS NIGHT. Late in the book a dark plate is laid over
     the picture FROM THE BOTTOM EDGE UPWARD; whatever it covers keeps its shape but loses its
     colour. 🔴 Darkness is never a gradient, never a shadow wash, never a soft fade - it is a
     plate with a cut edge, and the height of that edge is the hour.
  C. 🔴 DAYTIME SUN AND SHADE ARE NOT MADE BY OVERLAPPING. They are TWO DIFFERENT PLATES printed
     side by side - a sunlit-green plate and a shadow-green plate, meeting along a cut edge.
     Never build a daytime shadow by printing the same plate twice.
  D. AT MOST FOUR INK COLOURS ARE USED ON ANY ONE PAGE (ridge grey-blue, one green, one earth or
     water, plus the night plate when it applies). Ridge layers do not count as extra colours -
     they are the same ink printed thinner.
  E. THE GOAT IS THE OPPOSITE VALUE OF THE PLATE IT STANDS ON. On a sunlit-green plate it is
     painted dark; on a shadow plate or against the sky it is painted pale. 🔴 Never achieve this
     with a rim light, a glow or a highlight - it is achieved by which paint the body is mixed
     from. Its size stays tiny; it is found by value, not by scale.

PALETTE - muted printed inks, plus one hand-laid colour:
  cold paper (comes up through thin plates) #EDEBE4 | sky plate #8A96A0 |
  ridge ink #6E7A82 (printed thinner and thinner going back: #7E8A90, #97A0A4, #B4B9B6) |
  sunlit green plate #93A96B | shadow green plate #3E5443 | rock plate #6E7A82 |
  snow plate (the thinnest plate in the book, the paper clearly coming through) #DCDCD2 |
  earth road plate #8C7355 | timber plate #6B563C | lake plate #4E7280 | night plate #1C232C
  HAND-PAINTED, NOT PRINTED: the goat #7A6A58 (mixed paler #A2917C or darker #4A4038 as PLATE LAW
  E requires) | the bell, dull and unsaturated #7E7566
  🔴 EXACTLY ONE saturated colour exists in this book, and IT IS THE ONLY THING THAT IS NOT
  PRINTED AND NOT AN ANIMAL: HOUSE LIGHT, an opaque warm gold #E8A93C, deepening to #C98A2E in
  the pool it throws. It is laid on by hand, in one opaque shape with a standing edge.
  🔴 HOUSE LIGHT IS THE DESTINATION AND ITS SCHEDULE IS THE STORY. It exists ONLY in lit windows,
  one lantern, and the light those throw, and it appears on p8, p9, p10, p11 and p12 and NOWHERE
  ELSE. On p1 through p7 there is not one speck of warm colour anywhere in the picture -
  🔴 SUNLIGHT IS NOT WARM IN THIS BOOK. Morning and afternoon sun are cold pale plates, made by
  printing thinner, never by adding gold or orange.
  🔴 THE BELL IS NOT AN ACCENT. Dull unsaturated brass, one hand-painted shape plus a crayon
  contour. Never gold, never gleaming, never highlighted. It is read by SHAPE and POSITION.
  🔴 There is NO RED AND NO PINK anywhere in this book - not a flower, not a roof, not a cheek,
  not a sunset. Sunset is done with the ridge plates going darker, not with a warm sky.

COMPOSITION: the frame is divided into horizontal bands of plates, except where a single road,
  path or plate edge cuts it diagonally.
  The goat is tiny (1/12 to 1/20 of page height) on p1, p3, p4, p7, p8, p10; medium on p2, p6,
  p11, p12; large only on p5 and p9. 🔴 There is no page where its head fills the frame.
  🔴 Keep the bottom 18% of the image quiet and free of key subject matter (a caption band is
  laid over it later).
  🔴 WHEN TWO THINGS ARE BEING COMPARED, PUT THEM AT THE SAME HEIGHT IN THE FRAME. On the page
  where the next mountain is "the same height", the two summits must sit on the SAME horizontal
  line in the picture - if perspective drops the far one, it reads as lower and the story breaks.

FINISH HIERARCHY - about how FINISHED each area is, NOT about opacity.
  1. THE GOAT = finished. Hand-painted mass, short crayon strokes along the body, face and bell
     drawn with a fine dark crayon line.
  2. WHAT THE GOAT TOUCHES OR IS LOOKING AT on that page (the one gate, the clump of flowers it
     bites, the one cairn, the lit valley) = half-finished: its own small printed plate plus a
     crayon contour.
  3. EVERYTHING ELSE = TWO OR THREE PRINTED PLATES AND NOTHING MORE. A ridge is one plate. A roof
     is one plate. A field is one plate with eight short crayon marks on it. A forest is one dark
     plate with a chopped top edge.
  🔴 This is not a faded, hazy or blurred background - it is a FULLY PRINTED but UNDESCRIBED one.
  Never draw every rock, every tree, every plank, every roof slab, every blade of grass, every
  flower, every ripple. 🔴 And never put a crayon outline around a landscape plate.
  EXCEPTION - exactly two pages carry density, and the density lives in NAMED PROPS ONLY: the
  wordless climbing page (five objects strung along one path, each with its own plate and crayon
  contour) and the last page in the yard (the four things that go out, plus the yard's objects).
  🔴 Even there the mountains, walls and slopes stay two or three plates.

CHARACTER DESIGN: eyes are DRAWN with the crayon, not dotted - a dark almond with a HORIZONTAL
  goat pupil and a SEPARATE brow stroke above, so the face can crane up, look back over its own
  shoulder, and lie awake with its eyes open. Faces are small in frame, so the crayon line has to
  do all of it in four or five marks.
  Bodies read as one solid hand-painted mass plus four thin legs and two ears. Silhouette must be
  readable at thumbnail size.
  ANTHROPOMORPHISM GRADE (fixed for this book): EVERY GOAT IS FULLY QUADRUPEDAL. It stands, walks
  and runs on four legs, it eats with its mouth, it carries nothing. No goat ever stands on its
  hind legs, holds an object, wears clothing or gestures with a foreleg. 🔴 The only worn object
  in the entire book is the bell on a strap. If a pose does not work, change the camera - never
  put the animal upright.

SETTING: an alpine valley and the mountains above it - a dry-stone-walled yard with a barred
  timber gate, a log barn with hay under the eaves, a wooden balcony with a blanket over the
  rail, a wooden water trough, zig-zag earth paths up steep grass slopes, cairns, scree, a
  wind-bent lone tree, patches of old snow in rock shadow, a church tower far below, and beyond
  the first ridge a second valley with a lake and houses with WIDE FLAT STONE-SLAB ROOFS.
  🔴 MATERIAL TRANSLATION - everything is translated into "a plate plus a mark", so nothing turns
  photographic, plastic or field-guide:
    grass slope = one sponge-grain green plate, then eight to twelve SHORT CRAYON MARKS on it.
      Never individual blades, never lawn texture.
    moss = three darker sponge dabs on a rock plate, nothing more.
    rock = ONE roller-grain plate plus one crayon line for the shadowed face. Never cracks,
      never pebbles, never geology.
    snow = THE THINNEST PLATE IN THE BOOK, the cold paper clearly coming up through it, with a
      hard cut edge. 🔴 Never pure white, never sparkling, never a specular glint.
    goat fur = hand-painted flat mass plus short crayon strokes in one direction, denser along
      the spine.
    timber roof and plank = ONE plate plus two crayon lines. Never plank by plank, never slab by
      slab.
    lake water = a plate rolled in three horizontal passes, the lowest pass densest. Never
      ripples, never detailed reflections, never mirror gloss.
    lantern light = a HAND-LAID OPAQUE GOLD SHAPE with a standing edge, lying on the ground.
      🔴 Never a glow, never a bloom, never rays, never lens flare.
  European, no Asian architectural motifs.

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT digital airbrush / NOT smooth gradients / NOT glossy 3D CG render / NOT cel-shaded
  anime / NOT a texture filter or paper overlay laid on top of flat digital colour (the grain must
  belong to each shape separately) / NOT photographic, NOT photographic collage, NOT scanned
  photo fragments / NOT a naturalistic field-guide rendering of plants, rocks or animals (another
  line owns that) / NOT every rock, tree, plank, slab, blade or ripple drawn / NOT a uniform
  finish across the page / NOT outlines around landscape shapes / NOT a hazy, foggy, blurred or
  bloomed distance (distance is a thinner plate, not haze) / NOT any glow, halo, lens flare,
  god-ray or sparkle on the lights / NOT warm sunlight, NOT a warm sunset sky / NOT red, NOT
  pink, NOT a gleaming gold bell / NOT a second saturated colour / NOT an upright, clothed or
  object-carrying animal / NOT any lettering, numerals, signage or house numbers anywhere in the
  image / 🔴 NOT wool fibre, NOT fuzzy or fibrous edges, NOT stitching, NOT thread, NOT fabric
  weave, NOT a felted mass, NOT paper that is more than one sheet thick, NOT sculpted clay
  (another line owns those).
```

### 🔴 판 견본 — `PlateKit` (가장 먼저 굽는다, 캐릭터 시트보다 먼저 · §2.14)

```
MATERIAL SHEET - PlateKit   (bake this FIRST OF ALL, before the character sheets and before any
  scene. Attach it as a reference image to every single cut in this book.)

This is NOT a scene. It is a printer's proof sheet: a flat sheet of cold grey-white paper #EDEBE4
  with printed swatches laid out on it in a grid, plus enlarged detail strips along the bottom.

THE SWATCHES - print each of these as a rectangle about the size of a playing card, by pulling a
  hard rubber roller or pressing a sponge through a cut mask. In every swatch the GRAIN MUST BE
  VISIBLE and there must be small skips where the ink did not take:
  1. sky plate #8A96A0, rolled in long horizontal streaks.
  2. ridge ink #6E7A82 printed FOUR TIMES AS FOUR SEPARATE SWATCHES IN A ROW, each one thinner
     than the last (#6E7A82 → #7E8A90 → #97A0A4 → #B4B9B6), so the same ink going pale is
     visible as a series. 🔴 THIS ROW IS THE MOST IMPORTANT THING ON THE SHEET - it is how the
     book makes distance.
  3. sunlit green #93A96B, sponge speckle.
  4. shadow green #3E5443, sponge speckle.
  5. rock #6E7A82, roller streaks in one direction.
  6. snow #DCDCD2 printed AS THINLY AS POSSIBLE, so the paper comes up through it everywhere.
  7. earth road #8C7355, sponge.
  8. timber #6B563C, roller.
  9. lake #4E7280, three horizontal roller passes, the lowest densest.
  10. night plate #1C232C, rolled densely and evenly.

THE DETAIL STRIPS along the bottom, each enlarged so the physical behaviour is unmistakable:
  A. THE CUT EDGE: a plate ending against bare paper, showing that the edge is HARD and slightly
     ragged where the mask lifted - not a brush edge, not a soft edge, not a drawn line.
  B. OVERLAP: two plates crossing, so that the one underneath shows through the one on top and
     the crossing area is darker. Label nothing, just show it.
  C. THE NIGHT PLATE COVERING: the night plate laid over the corner of the sunlit-green and the
     rock plates, with a hard horizontal edge, so that under it the shapes are still readable
     but their colour is gone.
  D. THE TWO GREENS MEETING: the sunlit-green plate and the shadow-green plate butted together
     along one cut edge, with NO blending and NO third colour between them.
  E. HAND VS PRINTED: side by side, the same small shape done twice - once as a printed plate
     (grain, cut edge, no outline) and once HAND-PAINTED IN FLAT OPAQUE COLOUR WITH A WAX CRAYON
     CONTOUR (no grain, waxy broken line). 🔴 The difference between these two must be obvious at
     a glance, because in this book it is the difference between the world and the goat.
  F. THE ONE HAND-LAID COLOUR: a small opaque warm gold #E8A93C shape with a standing edge, laid
     on top of the night plate. 🔴 No glow around it, no bloom, no rays.

🔴 There is NO red and NO pink anywhere on this sheet. There is NO lettering, NO numerals and NO
  labels on this sheet - it is swatches only.
```

### 🔴 이 앵커의 두 불변 규칙 (매 컷 반복 확인)

**규칙 A — 능선 사다리.** 컷마다 `RIDGE:` 줄을 반드시 읽는다. 세 가지를 적는다 — **① 지금 몇 번째 능선에 있나 ② 그 뒤로 판이 몇 겹 보이나 ③ 앞 능선 판이 화면 어디까지 내려왔나.**

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0겹 (판 하나가 벽) | 0겹 | 0겹 | 🔴 **3겹**(처음 겹이 보인다) | 2겹 | 2겹 | 1겹 | 🔴 **5겹**(최다) | 2겹 | 3겹→밤 판에 잠긴다 | 0겹 | 1겹(밤 판 위 윤곽) |

🔴 **겹수가 계단이 아니라 도약이다.** 0 이 세 번 이어지는 것이 p4 의 「또 산」을 사건으로 만들고, p8 의 5겹이 정점이 되고, p11 의 0 이 「다 지났다」가 된다. p12 의 1겹은 p1 과 같은 한 겹인데 **이번엔 아이가 그 뒤에 무엇이 있는지 안다.**

**규칙 B — 집빛 스케줄.** 컷마다 `LIGHT:` 줄을 반드시 읽는다. `no warm` 이면 화면에 따뜻한 색이 **한 점도 없다.**

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 없음 | 없음 | 없음 | 없음 | 없음 | 없음 | 없음 | 🔴 **첫 등장 — 가장 멀리, 창 세 점** | 창 서넛 + 굴뚝 | 아래로 몇 점 | 🔴 **등불 하나, 처음으로 몸에 닿는다** | 넷이 차례로 꺼진다 |

---

## D-01 §3. 캐릭터 시트 (🔴 PlateKit 다음, 장면 전에 — 셋 다)

```
CHARACTER SHEET - KidGoat   (bake this after PlateKit, before any scene)

🔴 THE GOAT IS THE HAND-MADE THING IN THIS BOOK, SO THE SHEET MUST LOOK HAND-MADE, NOT PRINTED.
  Flat opaque paint plus a short WAX CRAYON contour that breaks on the paper grain. No printed
  plate texture on the body, no roller streaks, no sponge speckle inside the animal. The sheet's
  background is a plain thin sky plate #8A96A0 so the hand-painted body reads against a printed
  world exactly as it will in the book. 🔴 No warm colour anywhere on this sheet.

FACE: a young goat's short muzzle. Eye = a dark almond #1C232C with a HORIZONTAL slot pupil and a
  SEPARATE brow stroke above it, all drawn with the crayon. Nostril = one short dark comma.
  Mouth = one line that can open a crack. Two small horn buds, not yet horns. Ears large, thin,
  set sideways, one able to swivel independently of the other.
  🔴 No dot eye, no eyelashes, no blush, no highlight dot, no glossy catchlight.
COAT: one flat opaque mass of mid warm grey-brown #7A6A58 with short crayon strokes running along
  the body, denser along the spine, and a paler chest and a paler stripe down each cheek.
  🔴 THE COAT MUST BE MIXABLE BOTH DARKER (#4A4038) AND PALER (#A2917C), because PLATE LAW E
  makes the goat the opposite value of whatever plate it stands on. Show all three mixes.
BUILD & SILHOUETTE: FULLY QUADRUPEDAL, about waist-high to an adult goat. A compact barrel body,
  four thin legs with knobbly knees, a short tail carried UP, a neck that can crane straight up
  and can also turn fully back over its own shoulder. Hooves are two dark crayon dabs each.
SIGNATURE DETAIL: 🔴 ONE BELL on a worn leather strap around the neck - a dull unsaturated brass
  #7E7566 dome with a crayon contour, about the size of a walnut, hanging low under the jaw.
  🔴 IT IS NEVER GOLD, NEVER SHINY, NEVER HIGHLIGHTED. It is in every single drawing including
  the back views, and its POSITION tells whether it is sounding: hanging straight and still =
  silent / kicked out sideways at the end of the strap = ringing / resting on the ground and
  tipped over = the last page. This bell is how the reader tells this goat from every other goat.
REFERENCE SHEET: full body side view standing / three-quarter walking uphill with the body tilted
  to the slope angle and the four legs splayed unevenly / back view showing the raised tail and
  the strap / a leaping stride with all four feet off the ground, hind legs stretched back /
  a detail of the bell hanging still and the same bell kicked out sideways /
  the three coat mixes (mid, dark, pale) as three small standing figures in a row /
  four expression close-ups, all drawn with the crayon and legible at small size:
  CRANING UP (neck fully back, ears straight forward, mouth closed) /
  LOOKING BACK OVER THE SHOULDER (body forward, neck turned right round, eyes wide) /
  WAITING FOR A SOUND (one ear forward and one back, mouth just open) /
  LYING DOWN AWAKE (chin on forelegs, eyes open, ears relaxed).
SCENE token: KidGoat.
```

```
CHARACTER SHEET - HerdGoats   (the home herd, bake SECOND)

🔴 SAME HAND-PAINTED TREATMENT as KidGoat - flat opaque paint plus crayon contour, no printed
  grain inside the bodies. Adults, fully quadrupedal, no clothing, no objects.
  🔴 Their job in this book is TO NOT LOOK UP. Design them so they read as backs and lowered
  heads: heavy square bodies, thick necks, long full horns swept back, coats built from longer
  crayon strokes than the kid's. Three of them, distinguishable only by horn shape and by one
  darker and one paler coat. Each has a bell, all three plainer and smaller than the kid's, and
  their bells hang STILL in every drawing except the last page.
  ONE of the three (token: HerdElder) is the one that lifts its head twice in the book - once at
  the gate in the morning and once in the yard at night. Give it the heaviest horns and a paler
  muzzle so the reader can tell it is the same one both times.
REFERENCE SHEET: the three of them in a row, grazing with heads down, seen from behind and from
  the side, at true relative height against a plain horizon line with KidGoat at the end of the
  row for scale (the kid is about two thirds their height) / HerdElder with its head lifted and
  a mouthful of grass still in its mouth / the three of them folded down resting, from the front.
  Thin sky plate behind, no scenery, no warm colour.
```

```
CHARACTER SHEET - LakeGoats   (the strangers over the mountain, bake THIRD)

🔴 SAME HAND-PAINTED TREATMENT. Six goats from the valley with the flat stone roofs, fully
  quadrupedal. 🔴 They must read as A DIFFERENT PLACE, not as a different species and NOT as a
  threat - this book has nothing frightening in it. Separate them from the home herd by three
  things and no more:
  1. BELLS - every one of them has a bell of a DIFFERENT SHAPE (a tall narrow one, a flat wide
     one, a square-mouthed one, two small ones on one strap, a very large low one, a tiny one).
     All still dull brass, none shiny. This is the main marker, and it is the one the reader
     hears in the story.
  2. COAT PATTERN - patched two-tone coats, a white blaze, a dark saddle: they are marked, where
     the home herd is plain. 🔴 The patches are HAND-PAINTED shapes, not printed plates.
  3. STRAPS - patterned straps instead of plain leather (pattern drawn as three crayon dashes,
     nothing more).
  ONE of the six is a kid about the same size as KidGoat and it BOUNCES - never draw both its
  front feet on the ground.
REFERENCE SHEET: all six in one file walking left to right, seen from the side at true relative
  height / the six bells alone in a row, larger, so their shapes are fixed / the bouncing kid
  mid-hop / two of them glancing sideways with plain mild curiosity - 🔴 no staring, no glaring,
  no crowding, no bared teeth.
  Thin sky plate behind, no scenery, no warm colour.
```

---

## D-01 §4. 12컷

각 컷은 `STYLE ANCHOR + @image1(PlateKit) + @image2(KidGoat) + 아래 블록` 으로 합성한다. `HerdGoats` 는 p1·p2·p11·p12 에, `LakeGoats` 는 p6 에만 붙인다.

### p1 — 산은 마당 바로 앞에서 하늘까지 서 있었다
```
CAMERA: extreme low angle looking almost straight up. 🔴 Only the BOTTOM ONE EIGHTH of the frame
  is the yard; everything above it is mountain, standing like a wall. Verticals emphasised so the
  eye is dragged upward off the top of the page.
SUBJECT: KidGoat at bottom centre, tiny, neck craned fully back to look at the summit, one
  foreleg up on a low stone, hind feet on the ground, mouth closed, both ears straight forward.
  Its bell hangs straight down under the jaw and is STILL. To its left and right, HerdGoats -
  three adults with their heads down in the grass, all three seen as backs, not one looking up.
  🔴 All four goats are hand-painted with crayon contours; nothing else on the page is.
SETTING: a dry-stone-walled yard with a barred timber gate, a log barn with hay stacked under the
  eaves, a wooden balcony with a blanket over the rail, a water trough. Above and behind: steep
  grass slopes stacked in terraces rising to a snow-topped summit.
PLATES (this page uses FOUR): ① shadow-green plate = the whole valley floor and the lower
  mountain ② sunlit-green plate = only the highest terraces ③ rock plate = the summit mass
  ④ snow plate, printed thinnest, along the very top. The barn, balcony, trough and gate are
  small timber plates with two crayon lines each.
FINISH: KidGoat finished. The low stone under its foreleg and the nearest metre of wall
  half-finished. 🔴 The whole mountain is FOUR PLATES AND NOTHING MORE - no rocks, no trees, no
  paths printed or drawn inside them. Sponge grain in the greens, roller streaks in the rock.
TONE: the valley is on the shadow-green plate and only the upper terraces are on the sunlit
  plate, so the light is high up and the goat is low down in the dark. 🔴 The two greens meet
  along ONE HARD CUT EDGE across the slope - do not blend them, do not put a third green between.
RIDGE: 🔴 ZERO ridges visible behind this one. One single mountain plate fills the frame like a
  wall, and its top edge is cut off by the frame - there is no "beyond" anywhere in the picture.
  That is what makes the question possible.
LIGHT: no warm. Not one speck of gold anywhere - no lit window in the house, no lantern. The
  pale light on the high terraces is a thinner green plate, never gold.
```

### p2 — 딸랑, 딸랑. 염소는 돌담 문을 지났다 (후렴 1/2)
```
CAMERA: side view, medium, eye level at the goat's shoulder height. 🔴 The timber gate stands in
  the RIGHT THIRD of the frame and the path opens away to the LEFT. FIX THIS CAMERA EXACTLY -
  height, distance and lens are reused unchanged in p11, and the picture must NOT be mirrored.
SUBJECT: KidGoat mid-stride through the open gate: the forefoot is down on the earth OUTSIDE the
  threshold and the hind foot is still INSIDE the yard. The bell is kicked out sideways at the
  end of its strap - it is sounding. Eyes and ears forward, up the path. In the yard behind, to
  the right, HerdElder has lifted its head for the first time and is watching, grass still in
  its mouth.
SETTING: the barred timber gate with the bar swung back, a mossy dry-stone wall, dew on the
  grass, a narrow earth path zig-zagging away up the slope, a wooden post at the path mouth with
  a stone balanced on top, the barn roof beyond.
PLATES (FOUR): ① shadow-green plate = the yard side of the threshold ② sunlit-green plate = the
  slope outside the gate ③ earth-road plate = the path, printed as one continuous zig-zag band
  ④ timber plates for gate, post and barn roof, each with two crayon lines. Moss = three darker
  sponge dabs on the wall plate.
FINISH: KidGoat finished. The gate, its bar and the threshold half-finished - this is the object
  the page is about, and it must be recognisably the same gate in p11. Wall, post, barn and slope
  are one plate each. Dew = five or six tiny crayon ticks, nothing more.
TONE: the sun has just cleared the opposite ridge, so the light is LOW, PALE AND COLD.
  🔴 The threshold divides the picture along a plate edge: inside the yard is the shadow plate,
  outside is the sunlit plate. Long shadows lie backwards into the yard as ONE cut shape of the
  shadow plate, not as a soft gradient.
RIDGE: zero ridges behind - the slope simply rises out of the top of the frame. The path plate is
  visible for three zig-zags and then leaves the frame.
LIGHT: no warm. 🔴 The low morning sun is COLD PALE LIGHT - do not warm it, do not gild the dew,
  do not put a lit window in the house behind.
```

### p3 — 한참 올라가서 뒤를 보면 집이 손톱만 했다
```
CAMERA: extreme high angle looking down. 🔴 The zig-zag path folds across the frame NINE TIMES,
  and KidGoat is a tiny thing on one of the folds near the middle.
SUBJECT: KidGoat rounding one of the bends, body tilted to the slope angle, four legs splayed
  unevenly, head down watching its own feet. The bell is tipped sideways in walking rhythm.
  🔴 About 1/16 of the page height, hand-painted in the DARK coat mix so it reads as a small dark
  mark on the sunlit-green plate (PLATE LAW E).
SETTING: at the very bottom edge of the frame, the village shrunk to a thumbnail - roofs, a
  church tower, and the grid the dry-stone walls make of the fields. Along the path: goat
  droppings, flattened grass, one washed-out gully. As the path rises the grass gives way to
  scree.
PLATES (FOUR): ① sunlit-green plate = most of the slope ② earth-road plate = the whole zig-zag
  path, printed as ONE continuous ribbon through a single cut mask, which is what makes the nine
  folds read as one path ③ rock plate = the scree at the top of the frame ④ a small timber plate
  = the village at the bottom.
FINISH: KidGoat finished. The bend it stands on half-finished. 🔴 The village is ONE SMALL PLATE
  PLUS A FEW CRAYON DASHES - do not draw the houses. The slope is one plate with short crayon
  marks that get shorter and sparser toward the top of the frame.
TONE: the shadows under the goat's feet are SHORT - one small cut shape each - so the reader can
  feel the morning has become midday. The bottom of the frame carries the crayon marks and the
  top is bare plate, so the distance already climbed reads at a glance.
RIDGE: 🔴 STILL ZERO ridges behind. Third page in a row with no "beyond" visible - the slope the
  goat is on fills the whole frame and hides everything past it. 🔴 THE CAMERA IS LOOKING BACK
  DOWN, NOT FORWARD: the reader can see where the goat came from but still cannot see over.
LIGHT: no warm. 🔴 The village below has NO lit windows - it is the middle of the day and the
  houses are a cold timber plate. Saving the first warm light for later is the whole point.
```

### p4 — 산 너머엔 또 산이 있었다
```
CAMERA: silhouette wide, low angle from just below the ridge line. 🔴 The ridge line cuts the
  frame HORIZONTALLY and the goat stands on it, slightly left of centre, small.
SUBJECT: KidGoat standing on a ridge rock with all four feet together, neck pushed forward,
  looking across. Ears forward, flank fur pressed to one side by the wind, painted in the DARK
  coat mix against the pale sky plate. 🔴 The bell has STOPPED DEAD and hangs straight - the
  silence is part of the page.
SETTING: 🔴 THE POINT OF THE PAGE IS THE COUNT. Across from the goat, another mountain of the
  SAME HEIGHT, then another behind it, then another. A stacked cairn stands on the ridge next to
  the goat. Short grass all combed one way by wind. One patch of old snow in a rock crack.
PLATES: ① sky plate ② 🔴 THE RIDGE INK PRINTED FOUR TIMES AS FOUR SEPARATE PLATES - the ridge the
  goat is on (densest), then three behind it, each printed THINNER than the last so more cold
  paper comes through and it goes paler and flatter. The plates overlap along hard cut edges and
  do not blend ③ one small snow plate in the rock crack, thinnest of all ④ the cairn as its own
  small rock plate with a crayon contour.
FINISH: KidGoat finished. The cairn beside it half-finished. 🔴 NOTHING IS PRINTED OR DRAWN INSIDE
  ANY RIDGE PLATE - no trees, no rocks, no snowfields, no texture beyond the roller grain. The
  wind-combed grass is eight short crayon marks on the near ridge only.
TONE: flat high noon light, the least dramatic light in the book - there is nothing to see here
  but geometry. Expectation and deflation sitting in the same picture, held by stillness.
RIDGE: 🔴 THREE RIDGES BEHIND THIS ONE, AND THIS IS THE PAGE WHERE DEPTH APPEARS FOR THE FIRST
  TIME IN THE BOOK. The front ridge (the one the goat is on) runs across the LOWER THIRD of the
  frame. 🔴 THE NEAREST FAR SUMMIT MUST SIT AT THE SAME HEIGHT IN THE FRAME AS THE GOAT'S OWN
  RIDGE - the text says the next mountain is the same height, so if perspective drops it, the
  page contradicts the words. The two behind that one may sit progressively lower.
LIGHT: no warm. 🔴 And the camera is facing AWAY from home - the goat's own valley is not in this
  frame at all, and it will not be in a frame again until p8.
```

### p5 — 처음 보는 꽃을 뜯어 먹었다. 아삭했다
```
CAMERA: close-up, eye level, right down at the flowers. 🔴 One of only two pages where the goat is
  large in frame. Front plane described, back plane left as broad plates.
SUBJECT: KidGoat's head large and side-on in the centre foreground, lips pursed, biting through
  one flower stem, one petal falling away from its mouth. Eyes half closed, pollen on the muzzle
  as three crayon ticks, bell hanging low under the jaw and swinging just slightly.
SETTING: at its feet, a clump of bell-shaped flowers it has never seen before, growing in a mass.
  Behind: a lake ringed by mountains, wind marks on the water, a gravel path going down to the
  shore, a big boulder set in the slope.
PLATES (FOUR): ① sunlit-green plate = the slope ② lake plate = three horizontal roller passes,
  the lowest densest ③ ridge ink printed twice, both thin, for the two mountains across the water
  ④ a small pale plate for the flower mass. The flowers the goat is actually biting are drawn
  ON TOP with crayon contours.
FINISH: KidGoat's head finished. 🔴 EIGHT TO TEN FLOWERS get a crayon contour so the reader can
  see the shape is one nobody has seen before - they are the only half-finished props on the
  page. All other flowers are single crayon dots on the flower plate. The boulder is one rock
  plate. 🔴 The distance is NOT blurred - it is simply fewer, broader plates with hard edges.
TONE: flat afternoon light. The near plate is the densest thing on the page and everything behind
  it is printed thinner, so attention stays on the mouth.
RIDGE: two ridges behind, both thin plates, seen across the lake. The slope the goat came down
  leaves the frame at the top right. 🔴 Do not show the ridge it came over - the reader should not
  be able to look back from here.
LIGHT: no warm. 🔴 THIS IS THE MOST TEMPTING PAGE TO WARM UP (flowers, afternoon, a nice moment)
  AND IT MUST STAY COLD. The pleasure of this page is the bite and the new shape, not golden
  light. Not one gold mark.
```

### p6 — 낯선 염소들이 방울을 딸랑거리며 지나갔다. 좋은 곳이었다
```
CAMERA: medium wide, eye level. 🔴 The strangers cross the frame from left to centre; KidGoat
  stands stopped at the right edge of the road.
SUBJECT: KidGoat at the right roadside, body still pointing the way it was going but the NECK
  TURNED sideways to watch, its two ears moving independently. Crossing the frame: LakeGoats -
  six adults in file, each with a differently shaped bell, two of them glancing sideways at it
  with plain mild curiosity, and at the back one kid mid-hop with both forefeet off the ground.
  🔴 All seven goats are hand-painted; the village is printed.
SETTING: houses with WIDE FLAT STONE-SLAB ROOFS, a wooden rake and a cart leaning on a wall, a
  wooden water tub with water standing in it, the lake surface beyond the tub, and one very large
  bell hanging on a wall.
PLATES (FOUR): ① earth-road plate = the road across the frame ② rock plate = the flat slab roofs,
  one plate with one crayon line per slab edge ③ timber plate = walls, rake, cart, tub ④ lake
  plate beyond. Ridge ink printed twice, thin, behind the roofline.
FINISH: KidGoat finished. 🔴 The six bells are half-finished and they are the ONLY things on this
  page given that much attention besides the goats - their shapes are the information. Roofs,
  rake, cart and tub are one plate plus two crayon lines each. The lake is three roller passes.
TONE: the road is on a broad lit plate with short roof shadows falling on it as cut shapes.
  🔴 Strange but comfortable - there is nothing frightening in this picture and nobody is
  crowding the kid. Do not paint the strangers darker than the home herd; they are not a threat.
RIDGE: two ridges behind the village, both thin plates coming right down to the roofline so the
  valley reads as enclosed. The mountain the goat came over is NOT in this frame.
LIGHT: no warm. 🔴 It is three in the afternoon and NO WINDOW IN THIS VILLAGE IS LIT - that
  matters, because the first lit windows in the book must belong to home, not to here.
```

### p7 — 글 없는 쪽: 아직 오르는 중이다  🔴 밀도 배급 1/2
```
CAMERA: panoramic wide, low angle. 🔴 ONE narrow path runs from the bottom-left corner of the
  frame to the summit at the top right, cutting the whole picture as a single line. KidGoat is
  the smallest thing on the page, a point on that line about halfway along it.
SUBJECT: KidGoat climbing, tiny - about 1/20 of the page height. 🔴 Its body is barely more than
  a mark, BUT ITS HEAD IS CLEARLY LIFTED TOWARD THE SUMMIT AHEAD, so that "there is still further
  to go" reads even at this size. There is no other character anywhere in the frame.
SETTING: 🔴 THE PAGE IS THE PATH AND FIVE OBJECTS ON IT, IN THIS ORDER, and the eye passes them
  one at a time going up the line: a runnel of snowmelt water crossing the path → a lone tree
  bent right over by the wind → a knee-high stacked cairn → a patch of old snow in the shadow of
  a rock → a wooden cross marker planted at the summit. 🔴 NOTHING ELSE IS PUT ANYWHERE ON THIS
  PAGE. No other trees, no other rocks, no birds, no clouds, no flowers.
PLATES (THREE for the ground): ① shadow-green plate = the lower slope, already dark ② sunlit-green
  plate = the upper slope, still lit, the two meeting along one hard cut edge ③ earth-road plate =
  the path, one continuous ribbon corner to corner. 🔴 Each of the FIVE OBJECTS then gets ITS OWN
  SMALL PLATE (water = a thin lake-ink line, tree = timber, cairn = rock, snow = the thinnest
  plate, cross = timber) PLUS a crayon contour.
FINISH: 🔴 DENSITY PAGE 1 OF 2 - AND THE DENSITY IS ONLY IN THOSE FIVE OBJECTS. There is no text
  on this page, so if the five objects are not each recognisable the page is blank. Each gets its
  plate and its crayon contour, and the tree gets the direction of its branches. 🔴 THE SLOPE
  ITSELF STAYS THREE PLATES - if the slope gets described, the line dies and so does the page.
  Density lives in the props, never in the mountain.
TONE: the lower part of the slope is ALREADY on the shadow plate and only the upper part is on the
  lit plate, so how far is left to go reads as a plate edge. A silent page.
RIDGE: 🔴 ONE ridge only, and it is the one being climbed - nothing visible behind it. The front
  slope runs from the bottom-left corner to the top-right corner. 🔴 The camera is looking UP THE
  SLOPE, so home is not in this frame either. The last page before the reveal shows nothing of
  what is coming.
LIGHT: no warm. 🔴 The last page with no warm colour in it. What follows is the only reason this
  restraint was worth keeping for seven pages.
```

### p8 — 두 번째 꼭대기에서 뒤를 돌아보았다
```
CAMERA: wide, high angle. 🔴 A PLATE EDGE CUTS THE FRAME DIAGONALLY. Left and below: the new
  valley, already covered by the shadow plate. Right and far: past two ridges, the goat's own
  valley, still on a lit plate.
SUBJECT: KidGoat centre foreground on the summit rock, 🔴 body still facing forward but the NECK
  TURNED FULLY BACK over its own shoulder, looking at its own valley. Four feet gathered on the
  rock, tail dropped, eyes wide, mouth closed, bell hanging still. Painted in the PALE coat mix
  against the dark rock plate.
SETTING: lower left - the lake and the flat-roofed village gone whole under the shadow plate,
  their shapes still readable but their colour gone. Far right - past two ridge lines, the home
  valley: thumbnail roofs and a church tower still lit, 🔴 AND WINDOWS BEGINNING TO LIGHT UP ONE
  AT A TIME. Between the two, ridge upon ridge, with the valley floors printed as the palest
  plates of all.
PLATES: ① 🔴 THE RIDGE INK PRINTED FIVE TIMES - THE MOST IN THE BOOK - each plate thinner than
  the one in front, so that the count reads and the far ones nearly become paper ② the shadow
  plate laid over the whole left-and-below of the frame, with a hard diagonal cut edge ③ a small
  lit timber plate for the home village ④ rock plate for the summit under the goat's feet.
  🔴 The mist in the valley floors is THE THINNEST PLATE, flat, with a cut edge - not haze, not
  blur, not glow.
FINISH: KidGoat finished. The summit rock half-finished. 🔴 The lit home valley is the
  half-finished thing on the far side of the picture - it is what the goat is looking at, so its
  roofs and tower must be readable even at thumbnail size, each with a crayon contour. Everything
  between is ONE PLATE PER RIDGE with nothing inside it.
TONE: 🔴 the contrast between the shadow plate and the remaining lit plate is the entire page. The
  BRIGHTEST POINT IN THE PICTURE IS THE FARTHEST AWAY, so the eye is pulled across everything to
  get to it.
RIDGE: 🔴 FIVE RIDGES - THE MOST IN THE BOOK. First and only page where BOTH VALLEYS ARE IN ONE
  FRAME. The front ridge (the summit) runs across the lower quarter of the frame. Count them: the
  summit, then two between, then the home ridge, then the far wall beyond home.
LIGHT: 🔴 FIRST APPEARANCE OF WARM COLOUR IN THE BOOK, AND IT IS AT THE FURTHEST POSSIBLE POINT,
  AND IT IS THE ONLY THING ON THE PAGE THAT WAS NOT PRINTED. About THREE tiny hand-laid opaque
  gold #E8A93C window marks in the home village, each one a single mark the size of a grain, plus
  a slightly warmer edge on the tower's lit face. 🔴 Not one speck of gold anywhere else - not in
  the sky, not on the sunlit rock, not in the new village. 🔴 NO GLOW, NO BLOOM, NO RAYS. Three
  hand-laid marks, the smallest and most distant things in the picture, and they win it.
```

### p9 — 딸랑. 한참 뒤, 저 아래에서 방울 하나가 대답했다
```
CAMERA: medium, low angle. 🔴 The goat's neck and bell are large in the near frame at upper
  centre; below them the valley falls away to an enormous depth. Second of only two pages where
  the goat is large.
SUBJECT: KidGoat with its neck thrown sideways in a big swing, 🔴 the bell kicked right out at the
  end of the strap - it has just sounded. ONE EAR FORWARD AND ONE BACK, mouth slightly open: it is
  listening. Head tipped down toward the valley. Painted in the PALE mix against the dark below.
SETTING: far below, the valley floor - 🔴 on the home slope, a line of small dark marks moving
  downward (the herd, their bells swinging), three or four lit windows in the village, one thread
  of chimney smoke rising, and the cracked rock under the goat's own feet.
PLATES (FOUR): ① sky plate, still light, across the top ② the shadow plate covering the whole
  lower two thirds with a hard edge ③ ridge ink printed twice, both now under the shadow plate so
  they read as edges only ④ rock plate for the ledge under the feet, with two crayon lines for
  the crack.
FINISH: KidGoat's head, neck and bell finished. The cracked ledge half-finished. 🔴 The herd far
  below is A ROW OF SMALL HAND-PAINTED MARKS - do not draw goats down there, but do keep them
  hand-painted, because they are alive. The village is one small plate and the smoke is one thin
  roller streak.
TONE: 🔴 the silence while a sound crosses a valley. Above is still lit, below is already dark,
  and the two are separated by ONE CUT PLATE EDGE across the frame.
RIDGE: two ridges visible, both now inside the shadow plate - the count has stopped mattering and
  depth has taken over from breadth. The front ridge is under the goat's feet at the bottom.
LIGHT: hand-laid gold in THREE OR FOUR window marks and, this time, along the thin smoke thread.
  🔴 Still tiny, still far below, still hand-laid opaque marks with no glow. The gold is now
  something the goat is heading toward rather than something it is looking at.
```

### p10 — 어둠은 골짜기 아래에서부터 차올라 왔다
```
CAMERA: tracking back-shot from behind and slightly above. 🔴 The upper third of the frame is a
  ridge still on a lit plate; the lower two thirds are being covered.
SUBJECT: KidGoat from behind, 🔴 caught with ALL FOUR FEET OFF THE GROUND in a leaping stride,
  hind legs stretched right back and forelegs folded. The bell has flown up above the strap line.
  Ears laid back. It is going fast.
SETTING: scree scattering backwards from under its feet as six crayon marks, the zig-zag path
  continuing down and then swallowed, dry grass along the path, a few points of light far below.
PLATES: ① sunlit-green and rock plates on the upper third ② earth-road plate = the path ③ 🔴 THE
  NIGHT PLATE #1C232C LAID FROM THE BOTTOM EDGE UPWARD WITH A HARD HORIZONTAL CUT EDGE. Under it
  the path, the slopes and the two lower ridges keep their shapes but lose their colour. 🔴 This
  is the page that declares the process: DARKNESS IS A PLATE, NOT A GRADIENT. Nothing inside it
  is drawn, and its edge does not fade.
FINISH: KidGoat finished. The scree behind its feet half-finished - that is the speed. Path,
  slopes and ridges are one plate each.
TONE: 🔴 the direction darkness is filling from must be legible - the night plate comes UP from
  the bottom edge, not down from the sky. Above still lit, below already covered.
RIDGE: three ridges, and 🔴 THEY ARE BEING SWALLOWED FROM THE BOTTOM UP - the two lower ones are
  already under the night plate and read only as edges, and only the top one still holds its own
  colour. 🔴 One more ridge still to cross is somewhere under that plate, and the picture should
  let the reader feel that without showing it.
LIGHT: a FEW hand-laid gold marks far below, more than before because more windows are lit now,
  each still a single opaque mark. 🔴 No glow around them, no light spilling up the slope. They
  sit ON TOP of the night plate, which is exactly what makes them read as the only warm thing.
```

### p11 — 딸랑, 딸랑. 염소는 돌담 문을 지났다 (후렴 2/2)
```
CAMERA: 🔴 IDENTICAL TO p2 - same height, same distance, same lens, same gate in the RIGHT THIRD
  of the frame, path away to the LEFT. Attach the approved p2 render as a reference image.
  🔴 DO NOT MIRROR THE IMAGE: the gate stays right and the path stays left, or the mirror pair
  collapses.
SUBJECT: KidGoat mid-stride through the same gate the other way round - 🔴 EXACTLY THE REVERSE OF
  p2: the forefoot is down on the yard earth INSIDE and the hind foot is still OUTSIDE the
  threshold. Bell kicked out sideways, sounding. Head turned toward the light inside the yard,
  ears forward. Earth and dry grass stuck to its legs as four crayon ticks. In the yard to the
  right, HerdGoats folded down by the barn, and HerdElder with its head lifted (the second and
  last time).
SETTING: the same timber gate with its bar swung back, the same mossy wall, the same post with
  the stone on it. 🔴 ONE LANTERN hangs by the barn door with a pool of light lying under it. The
  water trough with water standing in it. Beyond the gate, the dark mountain path.
PLATES (THREE): ① 🔴 THE NIGHT PLATE COVERS ALMOST THE WHOLE PAGE, including everything outside
  the gate ② timber plates for gate, post, barn, trough, all printed and then partly covered by
  the night plate ③ the wall plate. 🔴 On top of all of that, HAND-LAID: the lantern, its pool of
  light, and the goat.
FINISH: KidGoat finished. The gate, its bar and the threshold half-finished, recognisably the same
  objects as p2. The lantern and its pool half-finished. Wall, barn, trough and the resting herd
  are one plate each.
TONE: 🔴 EXACTLY THE INVERSE OF p2. The threshold divides the picture again, but this time INSIDE
  IS LIGHT AND OUTSIDE IS DARK. Set the two pages side by side and the brightness should have
  flipped while nothing else moved.
RIDGE: 🔴 ZERO ridges - it is dark outside the gate and the mountains are not in this frame at
  all. Everything that was counted has been passed.
LIGHT: 🔴 THE LARGEST AREA OF WARM GOLD IN THE BOOK, AND THE FIRST TIME IT TOUCHES THE GOAT.
  One hand-laid lantern #E8A93C, a pool of #C98A2E lying on the yard earth beneath it, and gold
  catching the goat's near flank, the top of its muzzle and the top of the bell. 🔴 STILL AN
  OPAQUE HAND-LAID SHAPE WITH A STANDING EDGE - no glow, no halo, no rays, no bloom, no lens
  flare. The lantern is a shape, not a light source effect. 🔴 And note what this page is: the two
  hand-made things in the whole book - the goat and the light - finally touch.
```

### p12 — 방울이 저 혼자 한 번 딸랑, 울렸다  🔴 밀도 배급 2/2
```
CAMERA: wide, slightly high angle. 🔴 THE YARD FILLS THE FRAME HORIZONTALLY AND THE EYE IS MEANT
  TO TRAVEL LEFT TO RIGHT ACROSS IT. The mountain stands across the top of the frame. This is the
  only sweeping-read composition in the book - do not use it anywhere else.
SUBJECT: KidGoat at lower right, 🔴 lying down with all four legs folded under it, chin resting on
  its forelegs, EYES OPEN and looking at the mountain, ears relaxed. Its bell has come to rest on
  the ground and tipped over on its side. Its breath is one small pale crayon mark at the muzzle.
SETTING: 🔴 SCANNING LEFT TO RIGHT, FOUR THINGS GO OUT IN THIS ORDER, and each must be separately
  recognisable: ① the barn lantern dying down, its pool of light shrunk small → ② the single point
  of light that had been sitting on the surface of the water trough, gone right after it → ③ the
  last house window closing → ④ and at the end of the line, the goat's bell tipped over and
  stopped. Otherwise only the dry-stone wall, the closed timber gate, the outline of the mountain
  across the top of the frame, and a few stars over the ridge. HerdGoats folded down near the barn.
PLATES (THREE): ① 🔴 THE NIGHT PLATE OVER THE WHOLE PAGE ② one ridge plate for the mountain's
  silhouette, printed over the night plate just dense enough that its cut top edge reads against
  the sky ③ timber and wall plates, mostly covered. 🔴 Hand-laid on top: the goats, the dying
  lantern light, and the stars (COLD pale marks, never gold).
FINISH: 🔴 DENSITY PAGE 2 OF 2. KidGoat finished. The four dying things half-finished, plus the
  yard's own objects (trough, gate bar, hay under the eaves) so the yard reads as a place
  finishing its day. 🔴 THE MOUNTAIN IS ONE PLATE WITH A CUT TOP EDGE AND NOTHING INSIDE IT AT
  ALL - if the mountain gets described, this page dies. Density means MORE THINGS ARE IN THE YARD,
  never that things are drawn in more detail.
TONE: the number of hand-laid gold marks reduces until what is left can be counted. 🔴 At the end,
  the CUT EDGE OF THE MOUNTAIN PLATE is the most clearly read thing in the picture, and the eye
  arrives at the goat by following the order the lights go out. No scolding, no praise, a quiet
  ending.
RIDGE: 🔴 ONE ridge - the same single wall of mountain as p1, but now it is one plate over the
  night plate with stars above it. 🔴 Deliberately the same count as the first page: nothing about
  the mountain has changed, only that the reader now knows what is behind it. Its top edge is
  again cut off by the frame, and it fills the upper half of the picture.
LIGHT: 🔴 FOUR warm marks at the start of the read and ZERO at the end of it. Draw the page at the
  moment when the lantern is nearly out - one small dying #C98A2E pool at the far left, the
  trough point already gone, the window closing, the bell dark. 🔴 The stars are COLD pale
  hand-laid marks, not gold. The last warm colour in the book is the smallest.
```

---

## D-01 §5. 첫 렌더 검수 6항목 (하나라도 걸리면 문구가 아니라 ref 를 고친다 — §2.3)

1. 🔴 **능선을 셀 수 있나.** p4 에서 뒤에 셋, p8 에서 다섯이 각각 **분리된 판**으로 읽혀야 하고, 뒤 판이 **더 얇게 찍혀 창백**해야 한다. 안개·블러·그라데이션으로 뭉개져 있으면 이 권의 플롯이 사라진 것이다 — `PlateKit` 의 **능선 4단 스와치 줄**을 다시 굽고, 그 승인본을 전 컷에 붙인다.
2. 🔴 **모든 형태에 결이 있나, 그리고 그 결이 형태마다 따로인가.** 롤러 결·스폰지 알갱이가 **각 판 안에** 있어야 한다. 화면 전체에 한 장의 질감 필터가 덮여 있으면(같은 결이 모든 형태를 관통하면) C9 최대 실패 모드다 — §7.3 이 적어 둔 「AI 가 콜라주를 질감 오버레이로 뭉갠다」가 정확히 이것이다.
3. 🔴 **손으로 만든 것이 딱 둘인가.** 염소(+다른 염소들)와 집빛만 손칠·손선이고, 나머지 전부가 찍힌 판인가. 염소 몸에 롤러 결이 들어가 있으면 이 책의 이원 구조가 무너진다 — **KidGoat 시트를 다시 굽는다**(§2.4).
4. 🔴 **p1~p7 에 따뜻한 색이 한 점이라도 있나.** 아침 해·오후 볕·꽃·저녁 하늘 어디에도 금색·주황이 없어야 한다. 하나라도 있으면 **p8 의 창 세 점이 아무것도 아니게 된다** — 이 책의 유일한 사건이 무효가 된다.
5. **p10 의 어둠이 판인가 그라데이션인가.** 아래에서 올라온 **하드 컷 엣지**여야 하고, 그 아래 것들이 **형태는 남고 색만 없어야** 한다. 부드럽게 페이드되어 있으면 대본의 물리 조건(어둠은 아래에서 차오른다)이 그림에서 사라진 것이다.
6. **p2 와 p11 이 같은 문으로 보이나.** 나란히 놓고 본다 — 문·빗장·말뚝이 같은 물건으로 알아보이고, **좌우가 안 뒤집혔고**, 발 위치가 정확히 반대이고, **밝기가 안팎으로 뒤집혔나.**

**부수 확인 3건**
- 🔴 **니들펠트 분리**(이 앵커에서는 검수 항목이다): 스폰지 결이 **보풀**로, 겹친 판이 **천 조각**으로 보이면 그 순간 호리 라인이다. 판은 언제나 **한 겹 두께의 인쇄면**이고 결은 **잉크의 알갱이**다.
- **자연관찰 라인 분리**: 풀·바위·나무가 **종(種)으로 그려져 있으면** 도감이다. 판과 크레용 획 몇 개로만.
- **글자 0**: 5개 언어로 나가므로 마을·헛간·이정표에 글자가 한 자도 없어야 한다. p7 의 꼭대기 표지는 **나무 십자 하나**이고 아무것도 안 적혀 있다. `PlateKit` 에도 라벨을 넣지 않는다.
