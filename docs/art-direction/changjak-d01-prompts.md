# 창작동화 1000 — D-01 「산 너머엔 뭐가 있어?」 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`, 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/d01.md`.** 아래 12컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다.
> 🔴 **작가 실명은 한 글자도 안 들어간다.** 근거 후보 id 는 판정 표에만 남기고 프롬프트에서는 전부 문구로 옮겼다.
> 🔴 **이미지 생성은 art-director 가 하지 않는다.** 아래는 사용자가 직접 굽기 위한 프롬프트 세트다.
> ⚠️ **이 권은 A-01 과 같은 무대(알프스 산마을)다.** §1 의 분리표를 먼저 읽어라 — 두 앵커는 **한 획도 겹치지 않게** 설계했고, 그 분리가 깨지면 두 권 다 죽는다.

## 0. 실행 순서 (어기면 인물만 매끈한 CG 로 나온다 — §2.4)

1. **STYLE ANCHOR 로 캐릭터 시트를 먼저 굽는다.** 장면 금지. 순서 = `KidGoat` → `HerdGoats` → `LakeGoats`.
2. 🔴 **시트 승인 뒤에 「능선 판」 두 장을 먼저 확정한다** — **p4**(능선 겹이 처음 보이는 쪽, 정오·최대 명도)와 **p8**(겹이 최다이고 그늘 경계가 화면을 가르는 쪽, 이 책의 정점). 능선 띠의 물성과 겹의 창백해짐이 이 책의 사건 전부이므로, 두 판이 흔들리면 나머지 열 장을 다시 굽는다.
3. 그 다음 **p2** → 나머지 → 🔴 **p11 은 맨 마지막에, p2 승인본을 `@image` ref 로** 굽는다(같은 문·같은 각도·반대 방향, **좌우 반전 금지**).
4. 승인 렌더 3장을 앵커 보관함 ref 슬롯에 넣는다 — 🔴 **인물 컷 1 · 배경이 나이프 띠 몇 개로만 끝난 컷 1(p7)** · **전체 장면 1(p8)**. 3장이 전부 완성형이면 "비탈은 띠 몇 개로 끝낸다"는 문구가 영영 안 먹는다(§2.7 보정).
5. 앵커 이름은 **렌더를 보고 짓는다**(§7.5-3). 지금은 슬러그만 쓴다: `changjak-d01`.

---

## D-01 §1. 앵커 배정

### 🔴 먼저 — 같은 알프스를 어떻게 갈랐나 (이게 이번 배정의 핵심 판정이다)

A-01 과 D-01 은 **같은 무대**다. 무대가 같으면 소품·색·빛이 저절로 겹치고, 라이브러리 카드에서 나란히 놓이면 이 라인의 유일한 정체("권마다 다 다르다")가 무너진다. 그래서 **매체와 공정을 정반대로** 잡았다 — 같은 산을 **두 사람이 전혀 다르게 그린 것**이 되도록.

| 축 | **A-01 「부끄러우면 털이 빨개져」** | **D-01 「산 너머엔 뭐가 있어?」** (이 권) |
|---|---|---|
| 클러스터 | C8 (수채 번짐, 2/8) | **C7** (회화적 톤, 2/15) |
| 매체 | **얇다.** 흑연 선 + 회색 워시 한 겹 + 젖은 빨강 한 방울 | **두껍다.** 회청 밑칠 판 위 **불투명 과슈를 팔레트 나이프와 짧은 강모붓으로 얹는다** |
| 🔴 물감의 방향 | **종이 안으로** — 스며들고 번진다 | **종이 위로** — 쌓이고 융기한다(획이 서 있다) |
| 🔴 지배면 | **맨 종이**(여우의 원래 털색이 곧 안 칠한 흰 종이) | **맨 종이가 한 군데도 없다** — 화면 100%가 칠해져 있다 |
| 엣지 | 엣지가 없다(번져 사라지고 물테 하나만 남는다) | 엣지가 **칼로 자른 듯 딱딱하다**(나이프 띠의 끝) |
| 값 구조 | **하이키** — 거의 전부 밝고 어두운 값이 거의 없다(워시 3겹이 최대) | **두 덩어리** — 빛과 그늘로 화면이 먼저 갈리고 그 **경계선이 그림의 구조**다 |
| 색 | 세계에 색이 **없다**(회색 한 색 + 흑연) + 빨강 하나 | 세계가 **색이다**(풀·바위·눈·호수·저녁) + 채도색 하나 |
| 악센트 | **주인공의 몸에서 번지는 빨강** — 감정의 기록 | **집의 불빛(따뜻한 금색)** — 목적지의 기록. 🔴 **빨강은 한 점도 없다** |
| 알프스의 무엇을 그리나 | 🔴 **좁음** — 바위벽, 어깨 폭, 길 하나. 수직으로 조이고 시야가 막힌다 | 🔴 **넓음** — 겹겹 능선, 아래로 작아지는 마을. 수평으로 층지고 시야가 열린다 |
| 카메라 | 아이레벨 고정, 프레임이 좁다 | 극단 앙각 ↔ 극단 부감 ↔ 실루엣 ↔ 파노라마, 쪽마다 다르다 |
| 인물 크기 | 얼굴이 화면을 채우는 쪽이 둘(p9·p8) | **손톱만 하다** — 얼굴이 화면을 채우는 쪽이 하나도 없다 |
| 🔴 의인화 등급 | **전원 이족** — 뒷발로 걷고 앞발이 손이다(우유통·우산·바구니·옷) | **전원 사족** — 네 발로 걷고 옷도 소지품도 없다. 목에 **방울 하나**뿐 |
| 마을의 성격 | 동물들이 **사람처럼 사는 마을**(가게·빨랫줄·문패) | **짐승이 산을 넘는 이야기** — 마당·돌담·헛간·여물통까지가 세계의 끝 |

즉 **A-01 은 마른 흰 종이에 좁은 길 하나를 그린 얇은 책**이고, **D-01 은 물감을 두껍게 밀어 놓아 산을 층으로 쌓은 두꺼운 책**이다. 썸네일에서 하나는 거의 흰 책이고 하나는 거의 초록·회청 책이다. 🔴 **첫 렌더는 반드시 두 권을 나란히 놓고 본다.**

### 이 권이 그림에 요구하는 것 (판정의 전제)

1. 🔴 **「같은 것이 반복되는데 조금씩 다름」이 이 권의 축이다.** 넘으면 또 산이다. 그림이 그 반복을 **셀 수 있게** 만들어야 하고, 동시에 **지루해지지 않게** 매 쪽 화면을 다르게 갈라야 한다.
2. 🔴 **높이가 정보다.** 올라갈수록 아래가 작아지고 뒤 능선이 늘어난다. 대본이 무대를 물리 조건으로 못박아 뒀다 — 오르는 데 오전 내내(p3) · 꼭대기에서만 다음 산이 보이고(p4) · 해가 봉우리에 가려 일찍 지고(p8) · 어둠은 골짜기 바닥부터 차오른다(p10).
3. 🔴 **「그 산 위에서만 보이는 것」 = p8 의 것이다.** 본문을 확인했다: **해가 건너편 봉우리로 내려가 새 마을은 벌써 그늘에 들어갔는데, 능선 두 개 너머 제 골짜기에만 아직 빛이 남아 창에 불이 하나씩 켜지는 것.** 그것을 **마지막에 처음 보이게** 하려면 앞 쪽들에서 감춰야 한다.
4. **p7 은 무텍스트다** → §2.12 에 따라 밀도 배급 우선권. 단 대본이 그 쪽의 명제를 「밀도가 아니라 따라갈 선 하나」로 못박아 뒀다 — 해소는 아래 「밀도 배급」 항.
5. **후렴은 p2·p11 두 번뿐**이고 거울이다(같은 문·같은 각도·반대 방향). 이건 엔진 규정이라 고르는 자리가 아니다.

### 후보 3

| | 후보 ① **C7 두껍게 얹은 불투명 과슈 · 능선 하나 = 나이프 한 띠** (`lundberg-ingen` + `buro-street` + `smith-townsea`) | 후보 ② C4 실루엣 + 스케일 (`marais-tomber`) | 후보 ③ C1 지도형 (`grill-shackleton`) |
|---|---|---|---|
| 매체 | 회청 밑칠 판 위 불투명 과슈, **팔레트 나이프와 짧은 강모붓**, 획을 세워 둔 채 다시 안 건드림 | 평면 채색 실루엣, 음영 0 | 연필·색연필 + 지도·장비 도해 |
| 이 권에 맞는 이유 | 🔴 **능선 하나 = 물감 한 띠라 겹이 물리적으로 세어진다** — 「또 산」의 반복이 매체 차원에서 개수가 된다(§2.11·§2.14 의 나이프 버전) · 🔴 **대기 원근을 물감의 창백함으로만** 만들어 뒤 띠가 저절로 납작해진다 = 높이가 정보가 된다 · **명암 대비가 스프레드 리듬을 만든다**(D 주제군 기준선, §7.3) · 두껍게 얹는 공정이라 **e09 의 감산 목탄과 안 겹친다**(§7.5 의 C7 개방 조건 그대로) | 능선 겹을 세는 데는 최적 | 여정 장비·지도 쪽에 강하다 |
| 리스크 | C7 은 15항목으로 가장 두꺼운 클러스터 = **가장 평범해지기 쉽다**(§7.5 교차관찰 1) → §2.13 대로 **지지면·공정·도구까지** 특정해 막았다. 그리고 붓이 형태를 뭉개는 근거 후보의 성질은 **나이프 엣지로 딱딱하게** 잡았다 | 🔴 **표정이 없다**(§2.8). p1 의 「목을 완전히 젖혀 올려다봄」·p8 의 「목만 뒤로 돌려 봄」·p12 의 「눈은 뜬 채」가 다 사라진다. 라인이 C4 를 이미 둘 썼다(b01·e120) | 🔴 **글자·숫자가 필요한 형식**(지도·라벨)이고 우리는 5개 언어라 글자 금지 · **c01 이 방금 C1 을 열었다** · 점눈이 충돌 최대 클러스터 |
| 판정 | ✅ **추천** | 탈락 — 목·눈의 연기가 필요하다 | 탈락 — 형식이 글자를 요구한다 |

### 🔴 추천 = 후보 ① — C7 「두껍게 얹은 불투명 과슈 · 능선 하나 = 나이프 한 띠」

근거 세 줄:

- **매체가 능선을 센다.** 반복을 보여주는 책에서 겹의 개수가 뭉개지면 이야기가 없다. 두껍게 밀어 놓은 물감 띠는 서로 **겹치지만 섞이지 않아서** 뒤에 몇 겹이 있는지가 물리적으로 읽힌다. 얇은 워시로는 겹이 서로 스며 못 센다(그래서 A-01 의 매체로는 이 책을 못 그린다 — 두 권의 분리가 취향이 아니라 과업의 차이라는 근거).
- **높이를 물감의 창백함으로만 만든다.** 뒤 띠는 밑칠 회청을 더 많이 섞어 더 창백하고 더 납작하다. 대기 원근이 안개·블러·글로우 없이 **물감 비율**로 생기므로, 이 권 최대 실패 모드(범용 CG 원경)가 팔레트 차원에서 막힌다.
- **악센트가 목적지다.** 따뜻한 집빛은 **여정 내내 한 점도 없고**, 두 번째 정점에서 **가장 멀리 처음** 보이고(p8), 돌아와서 **몸에 닿고**(p11), 마지막에 **하나씩 꺼진다**(p12). 대본 note 가 「부르는 것이 있어서 돌아온다」고 적어 둔 것을 **색이 진다**.

**🔴 §2.9 의 새 변형 = 「악센트가 목적지다」.** 지금까지 확립된 다섯(①더하기 a04 ②안 칠한 자리 a91 ③들어낸 자리 e09 ④덮인 층 c60 ⑤주인공의 재료 c01)에 여섯째를 더한다 — **악센트가 여정 내내 0 이고, 정점에서 가장 멀리 처음 보이고, 도착해서 주인공의 몸에 닿는다.** **여정과 귀환 엔진 권 전체에 재사용할 것.**

### 🔴 여정과 귀환 엔진은 미검증이다 — 그림 쪽에서 조심할 것 4가지

이 엔진은 이 라인에서 처음이다. 대본 note 도 저항(돌아올 이유)을 장면으로 세워 뒀다. 그림 쪽 위험은 이렇게 본다.

1. 🔴 **이 엔진의 유일한 고장은 「반복이 지루해지는 것」이다.** 열두 쪽 중 여섯 쪽이 「비탈 위에 염소 하나」다. → 처방 셋: **①컷마다 `RIDGE:` 줄**(몇 번째 능선 · 뒤에 몇 겹 · 앞 능선이 화면 어디까지 내려왔나) **②능선 겹수를 계단이 아니라 도약으로**(0→1→0→**3**→2→2→1→**5**→2→3→0→1) **③카메라 레퍼토리를 쪽마다 강제**(극단 앙각 · 측면 · 극단 부감 · 실루엣 · 클로즈업 · 미디엄와이드 · 파노라마 · 부감 · 로우앵글 · 백샷 · 측면 · 와이드 — 같은 앵글이 연속으로 두 번 나오는 자리가 없다).
2. 🔴 **여정 책은 「경치」로 흘러 사건이 사라진다.** → 매 쪽에 **그 쪽에서만 새로 보이는 것 하나**를 못박았다(`RIDGE:` 와 `LIGHT:` 두 줄이 그 역할). 인물은 손톱만 하므로 **자세 하나로만** 말한다 — 대본이 이미 그렇게 써 뒀다(목을 젖힘 / 발 하나가 문턱 밖 / 몸은 앞인데 목만 뒤 / 네 발이 다 공중에).
3. 🔴 **마지막에 보일 것을 앞에서 미리 보여주면 여정이 무의미해진다.** → 규칙: **p1~p7 에는 따뜻한 색이 한 점도 없고, 첫 능선을 넘은 뒤 제 골짜기는 프레임에 아예 없다**(p4·p7 에서 카메라는 절대 뒤를 안 본다). p8 에서 두 골짜기가 처음으로 한 화면에 들어온다.
4. **착지가 「목록」이라 마지막 쪽만 시선 이동 구도**다(좌→우로 훑으며 하나씩 꺼진다). 다른 쪽에서 훑는 구도를 쓰면 p12 가 안 특별해진다.

### 🔴 라인 충돌 확인 (필수)

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 2D 회화 매체. 🔴 **단 이 앵커의 최대 근접 위험이 여기다** — 두껍게 얹은 불투명 물감이 「양모 덩어리」로 보일 수 있다. 막는 방법 = **나이프 엣지를 딱딱하게 유지**하고, 획의 끝이 **보풀이 아니라 잘린 면**이어야 한다. NOT 절에 `no wool fibre / no fuzzy edges / no stitching / no felted mass` 를 박았다 |
| 전래동화 **점눈이** | ✕ (4축 전부) | ① **종이** — 밝은 크림 ✕ / **회청 밑칠 판**(맨 종이 0) ② **얼굴** — 점눈 ✕ / 아몬드 눈 + 별개 눈썹선(목을 젖히고 뒤로 돌리고 뜬 채 있는 세 상태가 필수) ③ **악센트** — 「매 화면 빨강 1점」 ✕ / **빨강이 아예 0**, 따뜻한 것은 **집빛이고 그건 점이 아니라 광원**이며 일곱 쪽에 없다 ④ **매체** — 색연필 낙서 ✕ / 나이프로 얹은 불투명 과슈 |
| **A-01**(같은 무대) | ✕ | 위 분리표 12축 |
| **e09**(C7 첫 사용) | ✕ — 🔴 **공정이 정반대다** | e09 = **어두운 종이에서 지우개로 빛을 들어낸다(감산)**. d01 = **회청 판에 물감을 얹는다(가법)**. 도구도 반대(섀미·지우개 ↔ 팔레트 나이프). §7.5 가 C7 을 열 때 "e09 가 감산을 썼으니 **얹는 쪽**으로"라고 적어 둔 조건 그대로다 |
| **g88**(밝은 면적이 서사) | ✕ | g88 = **어둠이 안 칠한 검정 판**이고 빛만 물감이다. d01 은 **빛도 그늘도 둘 다 두껍게 칠한다** — 안 칠한 자리가 아예 없다. 그리고 g88 은 실내 계단(고도계), d01 은 야외 하루(시계) |
| **c60**(겹수가 변한다) | ✕ | c60 = **인쇄판을 겹친다**. d01 = **나이프 띠를 겹친다** — 판이 아니라 획이고, 겹칠 때마다 물리적으로 두꺼워진다 |
| 자연관찰 라인(실사) | ✕ | 🔴 알프스 자연을 그리므로 이건 검수 항목이다 — **도감이 되면 안 된다.** 풀·나무·바위를 종(種)으로 그리지 않고 **띠와 덩어리**로만 그린다(재질 번역 규칙 참조) |
| 세계명작 수채 그림풍 | ✕ | 불투명·두꺼움. 투명 수채 아님 |

### 🔴 밀도 배급 (§2.10·§2.12) — 그리고 §2.12 와 대본이 부딛히는 곳 1건

무텍스트 쪽이 **p7 하나** 있으므로 §2.12 우선권이 발동한다 → 슬롯 둘은 **p7 · p12**.

🔴 그런데 대본이 p7 의 명제를 못박아 뒀다: **"밀도가 아니라 따라갈 선 하나로 버티는 쪽"** — §2.12 는 밀도를 주라 하고 대본은 금지한다. **판정: 대본이 이긴다. 단 §2.12 의 판정 문장을 그대로 적용해 해소한다** — §2.12 는 "밀도는 소품에만 주고, 판정 문장은 「소품 N개가 각각 알아볼 수 있게 있나」"라고 했다. 대본은 이미 그 **N=5**(눈 녹은 도랑 · 바람에 휜 외딴 나무 · 무릎 높이 돌무더기 · 바위 그늘의 잔설 · 꼭대기 나무 십자)를 **선 위에 순서대로** 배치해 뒀다. → **밀도는 그 다섯 소품에만 주고 비탈은 통째로 나이프 띠 두세 개로 끝낸다.** 두 규칙이 정확히 같은 것을 시킨다.

두 번째 슬롯 **p12** 는 착지가 「꺼지는 순서」라 네 개가 각각 알아볼 수 있어야 한다(등불 → 여물통 반사 → 창 → 방울). 🔴 **밀도는 그 네 개와 마당 소품에만, 산과 돌담에는 절대** — 산에 바위를 그리면 두 쪽이 같이 죽고 자연관찰 라인과도 겹친다.

---

## D-01 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-d01   (young goat / alpine valley / over the mountain there is another)

Style: a thickly painted picture-book page for 4-6 year olds. Wide, high, quiet, physical.
  The subject of the book is HOW MANY RIDGES THERE ARE AND HOW HIGH WE ARE, so the paint itself
  has to stack and count. Legible before it is pretty.

MEDIUM - the tool is half the style, name it every time:
  A sheet of heavy board is first rolled ALL OVER with one flat coat of cold grey-blue #8A96A0.
  🔴 Nothing in this book is ever unpainted - there is no bare paper anywhere, in any corner.
  Everything on top of that ground is OPAQUE GOUACHE laid on THICKLY with a PALETTE KNIFE and a
  short stiff-bristle brush:
    - the KNIFE makes the ridges, the roofs, the roads, the snow and the water: each one is ONE
      pushed band of paint, put down in a single pass, with a HARD CUT EDGE where the knife
      lifted off and visible ridges of standing paint inside the band.
    - the STIFF BRUSH makes grass, fur, moss and foliage: short chopped strokes, the bristle
      marks left standing.
  🔴 ONCE A STROKE IS DOWN IT IS NEVER TOUCHED AGAIN. Nothing is blended, softened, glazed,
  smoothed or tidied afterwards. Where two bands meet they OVERLAP BUT DO NOT MIX.
  🔴 AERIAL PERSPECTIVE IS MADE ONLY BY MIXING MORE OF THE GREY-BLUE GROUND COLOUR INTO THE
  PAINT - the further a ridge is, the paler and flatter its band, until it is nearly the ground
  colour itself. There is no haze, no fog, no blur, no glow and no soft gradient anywhere.

PALETTE - a muted green and grey-blue world, plus exactly one saturated colour:
  ground / farthest air #8A96A0 | shadow green #3E5443 | mid green #5F7A55 | sunlit green #93A96B
  | rock grey-blue #6E7A82 | lit rock #A9B0AE | snow (opaque, never white-hot) #DCDCD2 |
  earth path #8C7355 | timber #6B563C | lake #4E7280 | blue hour #2E3946 | night dark #1C232C
  EXACTLY ONE saturated colour exists in this book: HOUSE LIGHT, a warm gold #E8A93C, deepening
  to #C98A2E in the pool it throws.
  🔴 HOUSE LIGHT IS THE DESTINATION AND ITS SCHEDULE IS THE STORY. It exists ONLY in lit windows,
  one lantern, and the light those throw. It appears on p8, p9, p10, p11 and p12 and NOWHERE
  ELSE. On p1 through p7 there is not one speck of warm colour anywhere in the picture -
  🔴 SUNLIGHT IS NOT WARM IN THIS BOOK. Morning and afternoon sun are pale cold light, made by
  mixing the ground colour with snow colour, never by adding gold or orange.
  🔴 THE BELL IS NOT AN ACCENT. It is dull unsaturated brass #7E7566 - one knife dab plus a dark
  contour. Never gold, never gleaming, never a highlight. It is read by SHAPE and POSITION.
  🔴 There is NO RED AND NO PINK anywhere in this book - not a flower, not a roof, not a cheek,
  not a sunset. Sunset is done with the cold ridge colours going darker, not with warm sky.

🔴 VALUE LAW - check this on every single page:
  A. TIME IS THE PICTURE. Every page divides FIRST into a lit mass and a shaded mass, and the
     line where they meet is what tells the hour. Decide that line before drawing anything else.
     The whole arc is: valley in shade / low pale sun / high flat light / flattest light at noon
     / afternoon / late afternoon / lower slopes already shaded / the shade line crossing the
     frame diagonally / above still lit and below already dark / darkness rising from the bottom
     / dark outside and light inside one gate / four lights going out one by one.
  B. THE GOAT IS THE OPPOSITE VALUE OF WHATEVER IT STANDS ON. On sunlit grass it is a small dark
     mass; on dark slope or against the sky it is a small pale mass. 🔴 Never achieve this with a
     rim light, a glow or a highlight - it is achieved by which paint the body is mixed from.
     Its size stays tiny in almost every page; it is found by value, not by scale.
  C. ONE RIDGE = ONE KNIFE BAND. Ridges overlap but never mix, and each further band is paler and
     flatter than the one in front of it. 🔴 The reader must be able to COUNT how many ridges are
     behind the one the goat is standing on. That count is the plot.
  D. The bottom of a slope always carries MORE detail than the top of it - grass gets shorter and
     turns to knife-laid scree as it rises. That is how altitude reads without any lettering.

COMPOSITION: the frame is divided into horizontal bands, except where a single road, path or
  shade line cuts it diagonally.
  The goat is tiny (1/12 to 1/20 of page height) on p1, p3, p4, p7, p8, p10; medium on p2, p6,
  p11, p12; large only on p5 and p9. 🔴 There is no page where its head fills the frame.
  🔴 Keep the bottom 18% of the image quiet and free of key subject matter (a caption band is
  laid over it later).
  🔴 WHEN TWO THINGS ARE BEING COMPARED, PUT THEM AT THE SAME HEIGHT IN THE FRAME. On the page
  where the next mountain is "the same height", the two summits must sit on the SAME horizontal
  line in the picture - if perspective drops the far one, it reads as lower and the story breaks.

FINISH HIERARCHY - about how FINISHED each area is, NOT about opacity.
  1. THE GOAT = finished. Body in stiff-brush strokes, face and bell drawn into the wet paint
     with a fine dark line.
  2. WHAT THE GOAT TOUCHES OR IS LOOKING AT on that page (the one gate, the one flower clump it
     bites, the one cairn, the one lit valley) = half-finished: shaped band plus a second pass.
  3. EVERYTHING ELSE = TWO OR THREE KNIFE BANDS AND NOTHING MORE. A ridge is one band. A roof is
     one band. A field is one band with three brush marks in it. The forest is one dark band with
     a chopped top edge.
  🔴 This is not a faded, hazy or blurred background - it is a FULLY PAINTED but UNDESCRIBED one.
  Never draw every rock, every tree, every plank, every roof shingle, every blade of grass,
  every flower, every ripple.
  EXCEPTION - exactly two pages carry density, and the density lives in NAMED PROPS ONLY: the
  wordless climbing page (five objects strung along one path) and the last page in the yard
  (the four things that go out, plus the yard's own objects). 🔴 Even there the mountains, walls
  and slopes stay two or three bands.

CHARACTER DESIGN: eyes are DRAWN into the paint, not dotted - a dark almond with a horizontal
  goat pupil and a SEPARATE brow stroke above, so the face can crane up, look back over its own
  shoulder, and lie awake with its eyes open. Faces are small in frame, so the drawn line has to
  do all of it in four or five marks.
  Bodies read as one solid mass plus four thin legs and two ears. Silhouette must be readable at
  thumbnail size.
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
  🔴 MATERIAL TRANSLATION (so nothing turns photographic or plastic):
    grass slope = one green band, then eight to twelve short stiff-brush chops in it. Never
      individual blades, never a lawn texture.
    moss = two or three darker brush dabs on a rock band, nothing more.
    rock = ONE knife wedge in rock grey-blue with one darker line for the shadowed face. Never
      cracks, never pebbles, never geology.
    snow = one thick opaque knife band of #DCDCD2 with a hard cut edge. 🔴 Never pure white,
      never sparkling, never a specular glint.
    goat fur = short chopped stiff-brush strokes in one direction, denser along the spine.
    timber roof and plank = ONE flat band plus two dark lines. Never plank by plank, never
      shingle by shingle.
    lake water = three or four horizontal knife pulls, the lowest one darkest. Never ripples,
      never reflections drawn in detail, never mirror gloss.
    lantern light = a soft-shaped PATCH OF PAINT lying on the ground, with a cut edge. 🔴 Never
      a glow, never a bloom, never rays, never lens flare.
  European, no Asian architectural motifs.

CANVAS: 16:9 double-page spread, 4-6 year old picture book.

NOT: NOT digital airbrush / NOT smooth gradients / NOT glossy 3D CG render / NOT cel-shaded
  anime / NOT an impasto texture filter laid over flat digital colour / NOT photographic /
  NOT a naturalistic field-guide rendering of plants, rocks or animals (another line owns that) /
  NOT every rock, tree, plank, shingle, blade or ripple drawn / NOT a uniform finish across the
  page / NOT a hazy, foggy, blurred or bloomed distance (distance is pale flat paint, not haze) /
  NOT any glow, halo, lens flare, god-ray or sparkle on the lights / NOT warm sunlight, NOT a
  warm sunset sky / NOT red, NOT pink, NOT a gleaming gold bell / NOT a second accent colour /
  NOT an upright, clothed or object-carrying animal / NOT any lettering, numerals, signage or
  house numbers anywhere in the image / NOT wool felt, NOT fuzzy or fibrous edges, NOT stitching,
  NOT a felted mass, NOT sculpted clay (another line owns those).
```

### 🔴 이 앵커의 두 불변 규칙 (매 컷 반복 확인)

**규칙 A — 능선 사다리.** 컷마다 `RIDGE:` 줄을 반드시 읽는다. 세 가지를 적는다 — **① 지금 몇 번째 능선에 있나 ② 그 뒤로 몇 겹이 보이나 ③ 앞 능선이 화면 어디까지 내려왔나.**

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0겹 (벽 하나) | 0겹 | 0겹 | 🔴 **3겹**(처음 겹이 보인다) | 2겹 | 2겹 | 1겹 | 🔴 **5겹**(최다) | 2겹 | 3겹→어둠에 잠긴다 | 0겹 | 1겹(어두운 윤곽) |

🔴 **겹수가 계단이 아니라 도약이다.** 0 이 세 번 이어지는 것이 p4 의 「또 산」을 사건으로 만들고, p8 의 5겹이 정점이 되고, p11 의 0 이 「다 지났다」가 된다. p12 의 1겹은 p1 과 같은 한 겹인데 **이번엔 아이가 그 뒤에 무엇이 있는지 안다.**

**규칙 B — 집빛 스케줄.** 컷마다 `LIGHT:` 줄을 반드시 읽는다. `no warm` 이면 화면에 따뜻한 색이 **한 점도 없다.**

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 없음 | 없음 | 없음 | 없음 | 없음 | 없음 | 없음 | 🔴 **첫 등장 — 가장 멀리, 창 세 점** | 창 서넛 + 굴뚝 | 아래로 몇 점 | 🔴 **등불 하나, 처음으로 몸에 닿는다** | 넷이 차례로 꺼진다 |

---

## D-01 §3. 캐릭터 시트 (🔴 이것부터 굽는다 — 셋 다, 장면 전에)

```
CHARACTER SHEET - KidGoat   (bake this FIRST of all, before any scene)

🔴 THE SHEET IS PAINTED IN THE SAME MEDIUM AS THE BOOK. A board rolled with flat cold grey-blue
  #8A96A0, and the goat laid on top in OPAQUE GOUACHE with a palette knife and a short stiff
  brush, strokes left standing, nothing blended or tidied. Do NOT render this character smoothly
  just because there is no scenery behind it. 🔴 No bare paper, no white background - the sheet's
  background is the rolled grey-blue ground.

FACE: a young goat's short muzzle. Eye = a dark almond #1C232C with a HORIZONTAL slot pupil and a
  SEPARATE brow stroke above it, drawn into the wet paint with a fine dark line. Nostril = one
  short dark comma. Mouth = one line that can open a crack. Two small horn buds, not yet horns -
  two knife dabs. Ears large, thin, set sideways, one able to swivel independently of the other.
  🔴 No dot eye, no eyelashes, no blush, no highlight dot, no glossy catchlight.
COAT: a solid mass of mid warm grey-brown, built from short chopped stiff-brush strokes running
  along the body, denser along the spine, with a paler chest and a paler stripe down each cheek.
  🔴 THE COAT MUST BE MIXABLE BOTH DARKER AND PALER than its base value, because on some pages
  the goat is a dark mass on sunlit grass and on others it is a pale mass against dark slope.
  Give it a mid value so it can go either way.
BUILD & SILHOUETTE: FULLY QUADRUPEDAL, about waist-high to an adult goat. A compact barrel body,
  four thin legs with knobbly knees, a short tail carried UP, a neck that can crane straight up
  and can also turn fully back over its own shoulder. Hooves are two dark dabs each.
SIGNATURE DETAIL: 🔴 ONE BELL on a worn leather strap around the neck - a dull unsaturated brass
  #7E7566 dome with a dark contour, about the size of a walnut, hanging low under the jaw.
  🔴 IT IS NEVER GOLD, NEVER SHINY, NEVER HIGHLIGHTED. It is in every single drawing including
  the back views, and its POSITION tells whether it is sounding: hanging straight and still =
  silent / kicked out sideways at the end of the strap = ringing / resting on the ground and
  tipped over = the last page. This bell is how the reader tells this goat from every other goat.
REFERENCE SHEET: full body side view standing / three-quarter walking uphill with the body tilted
  to the slope angle and the four legs splayed unevenly / back view showing the raised tail and
  the strap / a leaping stride with all four feet off the ground, hind legs stretched back /
  a detail of the bell hanging still and the same bell kicked out sideways /
  four expression close-ups, all with the eye and brow drawn dark enough to read at small size:
  CRANING UP (neck fully back, ears straight forward, mouth closed) /
  LOOKING BACK OVER THE SHOULDER (body forward, neck turned right round, eyes wide) /
  WAITING FOR A SOUND (one ear forward and one back, mouth just open) /
  LYING DOWN AWAKE (chin on forelegs, eyes open, ears relaxed).
  Rolled grey-blue ground behind, no scenery, no warm colour anywhere.
SCENE token: KidGoat.
```

```
CHARACTER SHEET - HerdGoats   (the home herd, bake SECOND)

🔴 SAME MEDIUM AND SAME GROUND as KidGoat. Adults, fully quadrupedal, no clothing, no objects.
  🔴 Their job in this book is TO NOT LOOK UP. Design them so they read as backs and lowered
  heads: heavy square bodies, thick necks, long full horns swept back, coats built from longer
  chopped strokes than the kid's. Three of them, distinguishable only by horn shape and by one
  darker and one paler coat. Each has a bell, all three plainer and smaller than the kid's, and
  their bells hang STILL in every drawing except the last page.
  ONE of the three (token: HerdElder) is the one that lifts its head twice in the book - once at
  the gate in the morning and once in the yard at night. Give it the heaviest horns and a paler
  muzzle so the reader can tell it is the same one both times.
REFERENCE SHEET: the three of them in a row, grazing with heads down, seen from behind and from
  the side, at true relative height against a plain horizon line with KidGoat at the end of the
  row for scale (the kid is about two thirds their height) / HerdElder with its head lifted and
  a mouthful of grass still in its mouth / the three of them folded down resting, from the front.
  Rolled grey-blue ground behind, no scenery, no warm colour.
```

```
CHARACTER SHEET - LakeGoats   (the strangers over the mountain, bake THIRD)

🔴 SAME MEDIUM AND SAME GROUND. Six goats from the valley with the flat stone roofs, fully
  quadrupedal. 🔴 They must read as A DIFFERENT PLACE, not as a different species and NOT as a
  threat - this book has nothing frightening in it. Separate them from the home herd by three
  things and no more:
  1. BELLS - every one of them has a bell of a DIFFERENT SHAPE (a tall narrow one, a flat wide
     one, a square-mouthed one, two small ones on one strap, a very large low one, a tiny one).
     All still dull brass, none shiny. This is the main marker, and it is the one the reader
     hears in the story.
  2. COAT PATTERN - patched two-tone coats, a white blaze, a dark saddle: they are marked, where
     the home herd is plain.
  3. STRAPS - woven patterned straps instead of plain leather (pattern drawn as three dark
     dashes, nothing more).
  ONE of the six is a kid about the same size as KidGoat and it BOUNCES - never draw both its
  front feet on the ground.
REFERENCE SHEET: all six in one file walking left to right, seen from the side at true relative
  height / the six bells alone in a row, larger, so their shapes are fixed / the bouncing kid
  mid-hop / two of them glancing sideways with plain mild curiosity - 🔴 no staring, no glaring,
  no crowding, no bared teeth.
  Rolled grey-blue ground behind, no scenery, no warm colour.
```

---

## D-01 §4. 12컷

각 컷은 `STYLE ANCHOR + @image1(KidGoat) + 아래 블록` 으로 합성한다. `HerdGoats` 는 p1·p2·p11·p12 에, `LakeGoats` 는 p6 에만 붙인다.

### p1 — 산은 마당 바로 앞에서 하늘까지 서 있었다
```
CAMERA: extreme low angle looking almost straight up. 🔴 Only the BOTTOM ONE EIGHTH of the frame
  is the yard; everything above it is mountain, standing like a wall. Verticals emphasised so the
  eye is dragged upward off the top of the page.
SUBJECT: KidGoat at bottom centre, tiny, neck craned fully back to look at the summit, one
  foreleg up on a low stone, hind feet on the ground, mouth closed, both ears straight forward.
  Its bell hangs straight down under the jaw and is STILL. To its left and right, HerdGoats -
  three adults with their heads down in the grass, all three seen as backs, not one looking up.
SETTING: a dry-stone-walled yard with a barred timber gate, a log barn with hay stacked under the
  eaves, a wooden balcony with a blanket over the rail, a water trough with water running
  through it. Above and behind: steep grass slopes stacked in terraces rising to a snow-topped
  summit.
FINISH: KidGoat finished. The low stone under its foreleg and the nearest metre of wall
  half-finished. 🔴 The whole mountain is THREE KNIFE BANDS AND NOTHING MORE - shadow green,
  mid green, then the snow band with a hard cut edge. No rocks, no trees, no paths drawn in it.
  Barn, balcony, trough and gate are one band plus two dark lines each.
TONE: the valley is still in shade (shadow green and grey-blue), and ONLY the upper ridge lines
  catch pale cold light. The lit part is at the very top of the frame and the dark part is where
  the goat is.
RIDGE: 🔴 ZERO ridges visible behind this one. One single mountain fills the frame like a wall,
  and its top edge is cut off by the frame - there is no "beyond" anywhere in the picture. That
  is what makes the question possible.
LIGHT: no warm. Not one speck of gold anywhere - no lit window in the house, no lantern. The
  cold pale light on the high ridge is snow colour mixed with ground colour, never gold.
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
FINISH: KidGoat finished. The gate, its bar and the threshold half-finished - this is the object
  the page is about, and it must be recognisably the same gate in p11. Wall, post, barn and slope
  are two bands each.
TONE: the sun has just cleared the opposite ridge, so the light is LOW, PALE AND COLD and comes
  from beyond the gate. 🔴 The threshold divides the picture: inside the yard is still dark,
  outside is light. Long shadows lie backwards into the yard.
RIDGE: zero ridges behind - the slope simply rises out of the top of the frame. The path is
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
  🔴 It is about 1/16 of the page height. It is found by value, not by size: a small dark mass on
  sunlit grass.
SETTING: at the very bottom edge of the frame, the village shrunk to a thumbnail - roofs, a
  church tower, and the grid the dry-stone walls make of the fields. Along the path: goat
  droppings, flattened grass, one washed-out gully. As the path rises the grass gets shorter and
  turns to knife-laid scree.
FINISH: KidGoat finished. The bend it stands on half-finished. 🔴 The village at the bottom is
  TWO BANDS AND A FEW DARK DASHES - do not draw the houses. The slope is one green band with
  chopped brush marks that get shorter toward the top of the frame.
TONE: the shadows under the goat's feet are SHORT, so the reader can feel the morning has become
  midday. The bottom of the frame is busier and the top is bare, so the distance already climbed
  reads at a glance.
RIDGE: 🔴 STILL ZERO ridges behind. This is the third page in a row with no "beyond" visible -
  the slope the goat is on fills the whole frame and hides everything past it. 🔴 THE CAMERA IS
  LOOKING BACK DOWN, NOT FORWARD: the reader can see where the goat came from but still cannot
  see over the top.
LIGHT: no warm. 🔴 The village below has NO lit windows - it is the middle of the day and the
  houses are cold pale bands. Saving the first warm light for later is the whole point.
```

### p4 — 산 너머엔 또 산이 있었다
```
CAMERA: silhouette wide, low angle from just below the ridge line. 🔴 The ridge line cuts the
  frame HORIZONTALLY and the goat stands on it, slightly left of centre, small.
SUBJECT: KidGoat standing on a ridge rock with all four feet together, neck pushed forward,
  looking across. Ears forward, flank fur pressed to one side by the wind. 🔴 The bell has
  STOPPED DEAD and hangs straight - the silence is part of the page.
SETTING: 🔴 THE POINT OF THE PAGE IS THE COUNT. Across from the goat, another mountain of the
  SAME HEIGHT, then another behind it, then another - ridge behind ridge. A stacked cairn stands
  on the ridge next to the goat. Short grass all combed one way by wind. One patch of old snow
  left in a rock crack.
FINISH: KidGoat finished. The cairn beside it half-finished. 🔴 EVERY RIDGE IS EXACTLY ONE KNIFE
  BAND. Nothing is drawn inside any of them. The bands overlap but do not mix, and each further
  one is paler and flatter than the one in front.
TONE: flat high noon light, the least dramatic light in the book - there is nothing to see here
  but geometry. Expectation and deflation sitting in the same picture, held by stillness.
RIDGE: 🔴 THREE RIDGES BEHIND THIS ONE, AND THIS IS THE PAGE WHERE DEPTH APPEARS FOR THE FIRST
  TIME IN THE BOOK. The front ridge (the one the goat is on) runs across the LOWER THIRD of the
  frame. 🔴 THE NEAREST FAR SUMMIT MUST SIT AT THE SAME HEIGHT IN THE FRAME AS THE GOAT'S OWN
  RIDGE - the text says the next mountain is the same height, so if perspective drops it, the
  page contradicts the words. The two ridges behind that one may sit progressively lower.
LIGHT: no warm. 🔴 And the camera is facing AWAY from home - the goat's own valley is not in this
  frame at all, and it will not be in a frame again until p8.
```

### p5 — 처음 보는 꽃을 뜯어 먹었다. 아삭했다
```
CAMERA: close-up, eye level, right down at the flowers. 🔴 The only page besides p9 where the
  goat is large in frame. Front half sharp, back half left as broad bands.
SUBJECT: KidGoat's head large and side-on in the centre foreground, lips pursed, biting through
  one flower stem, one petal falling away from its mouth. Eyes half closed, pollen on the muzzle,
  bell hanging low under the jaw and swinging just slightly.
SETTING: at its feet, a clump of bell-shaped flowers it has never seen before, growing in a mass.
  Behind, unfocused: a lake ringed by mountains, wind marks tracking across the water, a gravel
  path going down to the shore, a big boulder set in the slope.
FINISH: KidGoat's head finished. 🔴 The flowers it is actually biting are the ONLY half-finished
  props on the page - eight or ten of them, so the reader can see they are a shape nobody has
  seen before. All other flowers are single knife dabs. The lake is THREE HORIZONTAL KNIFE PULLS,
  the lowest darkest. The mountains behind are two pale bands.
TONE: high afternoon light breaking across the top of the flower clump. 🔴 The out-of-focus
  distance is done with FEWER AND BROADER BANDS, never with blur - flat pale paint, hard edges,
  simply undescribed.
RIDGE: two ridges behind, both very pale, seen across the lake. The front ridge the goat has
  just come down runs out of the frame at the top right. 🔴 Do not show the ridge it came over -
  the reader should not be able to look back from here.
LIGHT: no warm. 🔴 THIS IS THE MOST TEMPTING PAGE TO WARM UP (flowers, afternoon, a nice moment)
  AND IT MUST STAY COLD. The pleasure of this page is in the bite and in the new shape, not in
  golden light. Not one gold stroke.
```

### p6 — 낯선 염소들이 방울을 딸랑거리며 지나갔다. 좋은 곳이었다
```
CAMERA: medium wide, eye level. 🔴 The strangers cross the frame from left to centre; KidGoat
  stands stopped at the right edge of the road.
SUBJECT: KidGoat at the right roadside, body still pointing the way it was going but the NECK
  TURNED sideways to watch, its two ears moving independently. Crossing the frame: LakeGoats -
  six adults in file, each with a differently shaped bell, two of them glancing sideways at it
  with plain mild curiosity, and at the back one kid mid-hop with both forefeet off the ground.
SETTING: houses with WIDE FLAT STONE-SLAB ROOFS, a wooden rake and a cart leaning against a
  wall, a wooden water tub at the village entrance with water standing in it, the lake surface
  beyond the tub, and one very large bell hanging on a wall.
FINISH: KidGoat finished. 🔴 The six bells are half-finished and they are the ONLY things on this
  page given that much attention besides the goats - their shapes are the information. The flat
  roofs are one knife band each with one dark line for the slab edges; the rake, cart and tub are
  one band plus two lines each. The lake is three knife pulls.
TONE: broad light lies across the middle of the road with short roof shadows falling on it.
  🔴 Strange but comfortable - there is nothing frightening in this picture and nobody is
  crowding the kid. Do not shade the strangers darker than the home herd; they are not a threat.
RIDGE: two ridges behind the village, both pale, coming right down to the roofline so the valley
  reads as enclosed. The mountain the goat came over is NOT in this frame.
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
FINISH: 🔴 DENSITY PAGE 1 OF 2 - AND THE DENSITY IS ONLY IN THOSE FIVE OBJECTS. There is no text
  on this page, so if the five objects are not each recognisable the page is blank. Take all five
  to half-finished (shaped band plus a second pass, and the tree gets its bent trunk and the
  direction of its branches). 🔴 THE SLOPE ITSELF STAYS TWO OR THREE KNIFE BANDS - if the slope
  gets described, the line dies and so does the page. Density lives in the props, never in the
  mountain.
TONE: the lower part of the slope is ALREADY IN SHADE and only the upper part still holds light,
  so how far is left to go reads as brightness. A silent page.
RIDGE: 🔴 ONE ridge only, and it is the one being climbed - nothing is visible behind it. The
  front slope runs from the bottom-left corner up to the top-right corner of the frame. 🔴 The
  camera is looking UP THE SLOPE, so home is not in this frame either. The last page before the
  reveal shows nothing of what is coming.
LIGHT: no warm. 🔴 The last page with no warm colour in it. What follows is the only reason this
  restraint was worth keeping for seven pages.
```

### p8 — 두 번째 꼭대기에서 뒤를 돌아보았다
```
CAMERA: wide, high angle. 🔴 THE SHADE LINE CUTS THE FRAME DIAGONALLY. Left and below: the new
  valley, already in shade. Right and far: past two ridges, the goat's own valley with light
  still on it.
SUBJECT: KidGoat centre foreground on the summit rock, 🔴 body still facing forward but the NECK
  TURNED FULLY BACK over its own shoulder, looking at its own valley. Four feet gathered on the
  rock, tail dropped, eyes wide, mouth closed, bell hanging still.
SETTING: lower left - the lake and the flat-roofed village gone whole into shade, reduced to
  shape only. Far right - past two ridge lines, the home valley: thumbnail roofs and a church
  tower still catching light, 🔴 AND WINDOWS BEGINNING TO LIGHT UP ONE AT A TIME. Between the two,
  ridge upon ridge, with mist lying in the valley floors as PALE FLAT BANDS.
FINISH: KidGoat finished. The summit rock under it half-finished. 🔴 The lit home valley is the
  half-finished thing on the far side of the picture - it is what the goat is looking at, so its
  roofs and tower must be readable even though they are thumbnail-sized. Everything between is
  ONE KNIFE BAND PER RIDGE. 🔴 The mist in the valley floors is a FLAT PALE BAND, not haze,
  not blur, not glow.
TONE: 🔴 the contrast between shade and remaining light is the entire page. The BRIGHTEST POINT
  IN THE PICTURE IS THE FARTHEST AWAY, so the eye is pulled across everything to get to it.
RIDGE: 🔴 FIVE RIDGES - THE MOST IN THE BOOK. This is the first and only page where BOTH VALLEYS
  ARE IN ONE FRAME. The front ridge (the summit) runs across the lower quarter of the frame.
  Count them: the summit, then two between, then the home ridge, then the far wall beyond home.
LIGHT: 🔴 FIRST APPEARANCE OF WARM COLOUR IN THE BOOK, AND IT IS AT THE FURTHEST POSSIBLE POINT.
  About THREE tiny warm gold #E8A93C window marks in the home village, each one a single dab the
  size of a grain, plus a slightly warmer cast on the tower's lit face. 🔴 Not one speck of gold
  anywhere else - not in the sky, not on the sun side of the rocks, not in the new village.
  🔴 NO GLOW, NO BLOOM, NO RAYS. Three flat dabs of paint, and they are the smallest and most
  distant things in the picture, and they win it.
```

### p9 — 딸랑. 한참 뒤, 저 아래에서 방울 하나가 대답했다
```
CAMERA: medium, low angle. 🔴 The goat's neck and bell are large in the near frame at upper
  centre; below them the valley falls away to an enormous depth. The second of only two pages
  where the goat is large.
SUBJECT: KidGoat with its neck thrown sideways in a big swing, 🔴 the bell kicked right out at
  the end of the strap - it has just sounded. ONE EAR FORWARD AND ONE BACK, mouth slightly open:
  it is listening. Head tipped down toward the valley.
SETTING: far below, the valley floor - 🔴 on the home slope, a line of small dots moving downward
  (the herd, their bells swinging), three or four lit windows in the village, one thread of
  chimney smoke rising, and the cracked rock under the goat's own feet.
FINISH: KidGoat's head, neck and bell finished. The cracked rock underfoot half-finished. 🔴 The
  herd far below is a ROW OF SMALL DARK DABS - do not draw goats down there. The village is two
  bands and the smoke is one pale knife pull.
TONE: 🔴 the silence while a sound crosses a valley. Above is still lit, below is already dark,
  and the two worlds are in one frame with a hard division between them. The sun has just gone
  behind the ridge.
RIDGE: two ridges visible, both now dark masses - the count has stopped mattering and depth has
  taken over from breadth. The front ridge is under the goat's feet at the bottom of the frame.
LIGHT: warm gold in THREE OR FOUR window dabs and, this time, in the thin smoke thread catching
  the last of it. 🔴 Still tiny, still far below, still flat paint. The gold is now something the
  goat is heading toward rather than something it is looking at.
```

### p10 — 어둠은 골짜기 아래에서부터 차올라 왔다
```
CAMERA: tracking back-shot from behind and slightly above. 🔴 The upper third of the frame is a
  ridge still holding light; the lower two thirds are slope going dark.
SUBJECT: KidGoat from behind, 🔴 caught with ALL FOUR FEET OFF THE GROUND in a leaping stride,
  hind legs stretched right back and forelegs folded. The bell has flown up above the strap line.
  Ears laid back. It is going fast.
SETTING: scree scattering backwards from under its feet, the zig-zag path continuing down and
  then swallowed by dark, 🔴 a hard horizontal DARKNESS LINE cutting across the lower slope, dry
  grass along the path, a few points of light far below.
FINISH: KidGoat finished. The scree under and behind its feet half-finished - that is the speed.
  Path, slope and ridge are two bands each. 🔴 The dark below is FLAT PAINTED DARK #1C232C with a
  hard edge, not a gradient, not a shadow wash, and nothing is drawn inside it.
TONE: 🔴 the direction darkness is filling from must be legible - it comes UP from the bottom of
  the frame, not down from the sky. Above still lit, below already drowned.
RIDGE: three ridges, and 🔴 THEY ARE BEING SWALLOWED FROM THE BOTTOM UP - the two lower ones are
  already inside the dark band and read only as edges, and only the top one still holds paint
  colour. 🔴 One more ridge still to cross is somewhere in that dark, and the picture should let
  the reader feel that without showing it.
LIGHT: a FEW warm gold points far below, more than before because more windows are lit now, but
  each still a single flat dab. 🔴 No glow around them, no light spilling up the slope.
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
  ears forward. Earth and dry grass stuck to its legs. In the yard to the right, HerdGoats folded
  down by the barn, and HerdElder with its head lifted (the second and last time).
SETTING: the same timber gate with its bar swung back, the same mossy wall, the same post with
  the stone on it. 🔴 ONE LANTERN hangs by the barn door with a round pool of light lying under
  it. The water trough with water standing in it. Beyond the gate, the dark mountain path.
FINISH: KidGoat finished. The gate, its bar and the threshold half-finished, recognisably the
  same objects as p2. The lantern and the pool of light it throws half-finished. Wall, barn,
  trough and the resting herd are two bands each.
TONE: 🔴 EXACTLY THE INVERSE OF p2. The threshold divides the picture again, but this time INSIDE
  IS LIGHT AND OUTSIDE IS DARK. Set the two pages side by side and the brightness should have
  flipped while nothing else moved.
RIDGE: 🔴 ZERO ridges - it is dark outside the gate and the mountains are not in this frame at
  all. Everything that was counted has been passed.
LIGHT: 🔴 THE LARGEST AREA OF WARM GOLD IN THE BOOK, AND THE FIRST TIME IT TOUCHES THE GOAT.
  One lantern #E8A93C, a pool of #C98A2E lying on the yard earth beneath it, and gold catching
  the goat's near flank, the top of its muzzle and the top of the bell. 🔴 STILL A PATCH OF PAINT
  WITH A CUT EDGE - no glow, no halo, no rays, no bloom, no lens flare. The lantern is a shape,
  not a light source effect.
```

### p12 — 방울이 저 혼자 한 번 딸랑, 울렸다  🔴 밀도 배급 2/2
```
CAMERA: wide, slightly high angle. 🔴 THE YARD FILLS THE FRAME HORIZONTALLY AND THE EYE IS MEANT
  TO TRAVEL LEFT TO RIGHT ACROSS IT. The mountain stands across the top of the frame. This is
  the only sweeping-read composition in the book - do not use it anywhere else.
SUBJECT: KidGoat at lower right, 🔴 lying down with all four legs folded under it, chin resting on
  its forelegs, EYES OPEN and looking at the mountain, ears relaxed. Its bell has come to rest on
  the ground and tipped over on its side. Its breath is a small pale mark at its muzzle.
SETTING: 🔴 SCANNING LEFT TO RIGHT, FOUR THINGS GO OUT IN THIS ORDER, and each must be separately
  recognisable: ① the barn lantern dying down, its pool of light shrunk small → ② the single
  point of light that had been sitting on the surface of the water trough, gone right after it →
  ③ the last house window closing → ④ and at the end of the line, the goat's bell tipping over
  and stopping. Otherwise only the dry-stone wall, the closed timber gate, the outline of the
  mountain filling the top of the frame, and a few stars over the ridge. HerdGoats folded down
  near the barn.
FINISH: 🔴 DENSITY PAGE 2 OF 2. KidGoat finished. The four dying things half-finished, plus the
  yard's own objects (trough, gate bar, hay under the eaves) so the yard reads as a place that is
  finishing its day. 🔴 THE MOUNTAIN IS ONE FLAT DARK BAND WITH A CUT TOP EDGE AND NOTHING DRAWN
  IN IT AT ALL - if the mountain gets described, this page dies. Density means MORE THINGS ARE
  IN THE YARD, never that things are drawn in more detail.
TONE: the number of bright points reduces until what is left can be counted. 🔴 At the end, the
  OUTLINE OF THE MOUNTAIN is the most clearly read thing in the picture, and the eye arrives at
  the goat by following the order the lights go out. No scolding, no praise, a quiet ending.
RIDGE: 🔴 ONE ridge - the same single wall of mountain as p1, but now it is a dark band and the
  stars are above it. 🔴 It is deliberately the same count as the first page: nothing about the
  mountain has changed, only that the reader now knows what is behind it. Its top edge is again
  cut off by the frame, and it fills the upper half of the picture.
LIGHT: 🔴 FOUR warm points at the start of the read and ZERO at the end of it. Draw the page at
  the moment when the lantern is nearly out - one small dying #C98A2E pool at the far left, the
  trough point already gone, the window closing, the bell dark. 🔴 The stars are COLD pale dabs,
  not gold. The last warm colour in the book is the smallest.
```

---

## D-01 §5. 첫 렌더 검수 6항목 (하나라도 걸리면 문구가 아니라 ref 를 고친다 — §2.3)

1. 🔴 **능선을 셀 수 있나.** p4 에서 뒤에 셋, p8 에서 다섯이 각각 **분리된 띠**로 읽혀야 한다. 뒤 능선이 안개·블러·그라데이션으로 뭉개져 있으면 이 권의 플롯이 사라진 것이다 — MEDIUM 절의 「대기 원근은 밑칠 색을 섞어서만」을 강화하고, 그래도 안 되면 **p4 승인본을 ref 로 고정**한 뒤 나머지를 다시 굽는다.
2. 🔴 **p1~p7 에 따뜻한 색이 한 점이라도 있나.** 아침 해·오후 볕·꽃·저녁 하늘 어디에도 금색·주황이 없어야 한다. 하나라도 있으면 **p8 의 창 세 점이 아무것도 아니게 된다** — 이 책의 유일한 사건이 무효가 된다.
3. 🔴 **p8 에서 가장 밝은 것이 가장 먼 것인가.** 제 골짜기의 창 세 점이 화면에서 가장 밝고 가장 작아야 한다. 근경(그늘 든 새 골짜기)이 더 밝게 나왔으면 값 규칙 A 실패.
4. **p2 와 p11 이 같은 문으로 보이나.** 나란히 놓고 본다 — 문·빗장·말뚝이 같은 물건으로 알아보이고, **좌우가 안 뒤집혔고**, 발 위치가 정확히 반대이고, **밝기가 안팎으로 뒤집혔나.**
5. **광원이 물감인가 효과인가.** p11 의 등불과 p12 의 사그라드는 빛이 **엣지가 잘린 물감 덩어리**여야 한다. 글로우·후광·광선·블룸이 보이면 이 앵커 최대 실패 모드다(g88 이 같은 곳에서 걸렸다). 등불은 광원이 아니라 **모양**이다.
6. **염소가 사족인가.** 열두 쪽 전부에서 네 발로 있고, 앞발로 무엇도 잡지 않고, 옷이 없고, 목의 방울이 유일한 소지품인가. 그리고 **방울이 금색으로 반짝이지 않는가**(반짝이면 악센트가 둘이 되어 §2.9 가 무너진다).

**부수 확인 3건**
- **니들펠트 분리**: 두꺼운 물감 덩어리가 **보풀·양모**로 보이면 그 순간 호리 라인이다. 나이프 획의 끝은 **잘린 면**이어야 한다.
- **자연관찰 라인 분리**: 풀·바위·나무가 **종(種)으로 그려져 있으면** 도감이다. 띠와 덩어리로만.
- **글자 0**: 5개 언어로 나가므로 마을·헛간·이정표에 글자가 한 자도 없어야 한다. p7 의 꼭대기 표지는 **나무 십자 하나**이고 아무것도 안 적혀 있다.
