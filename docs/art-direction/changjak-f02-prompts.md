# 창작동화 1000 — F-02 앵커 배정 + 삽화 프롬프트

> art-director 산출물 (2026-07-30). 근거·원칙은 `verified-references.md`(§2.1 · §2.4 · §2.7 · §2.8 · §2.9 · §2.10 · §2.11 · §7.1~7.5), 라인 규격은 `packages/client/public/changjak-plan.html`.
> 🔴 **대본 SSOT 는 `docs/changjak-books/f02.md`.** 아래 12컷은 그 SCENE 콘티를 **그림 지시로 옮긴 번역본**이다. 대본이 고쳐지면 여기도 고친다. 새로 발명한 것 없음.
> 🔴 **이미지 생성은 여기서 하지 않는다.** 사용자가 GPT 로 굽는다. 🔴 **작가 실명은 한 글자도 안 들어간다** — 근거 후보 id 는 §1 판정 표에만 남기고 프롬프트는 전부 문구다.

## 0. 실행 순서 (어기면 인물만 매끈한 CG 로 나온다 — §2.4)

1. **STYLE ANCHOR 로 시트 4장을 먼저 굽는다. 장면 금지.** 순서 = `BigBrother`(형) → 🔴 `BabyPup`(아기 — **눈동자 위치 시트**) → `GrownUps`(얼굴 없는 어른 부품) → `RoomKit`(방과 격자).
   🔴 **`BabyPup` 이 이 권에서 가장 비싼 시트다.** 이 책의 사건은 전부 **아기 눈동자가 어디에 붙어 있나**이므로, 눈동자 위치가 시트에서 안 정해지면 열두 쪽이 통째로 무의미해진다.
   🔴 **`GrownUps` 를 반드시 시트로 굽는다.** 얼굴 없는 어른을 문구로만 요구하면 모델이 얼굴을 그린다 — 등·무릎·소매·손을 **부품**으로 먼저 확정해 둔다.
2. 시트가 승인되면 `@image1`(BigBrother) · `@image2`(BabyPup) · `@image3`(GrownUps) · `@image4`(RoomKit)을 붙여 컷을 뽑는다.
3. 🔴 **굽는 순서 = p5 → p3 → p10 → 나머지 여덟 → p12 는 맨 마지막.**
   - **p5** = 이 책의 논지가 한 화면에 다 있는 쪽(몸이 통째로 사라졌는데 빨간 끝 한 뼘과 아기 눈이 방을 가로질러 한 직선). 🔴 **이 한 장이 안 서면 나머지를 구울 필요가 없다.**
   - **p3** = 검정 어른 덩어리 규약(등의 벽에 틈이 하나뿐).
   - **p10** = 격자 빛 칸이 걸음을 세는 규약(왼쪽 세 칸·오른쪽 세 칸).
   - **p12** = 눈높이 착지. 열한 쪽의 곡선이 도착하는 곳이라 마지막에 굽는다.
4. 승인 렌더 3장을 앵커 ref 슬롯에 넣는다 — 🔴 **인물 컷 1 · 배경이 러프로 남은 컷 1(p6 또는 p9) · 전체 장면 1(p7)**.
5. 앵커 이름은 **렌더를 보고 짓는다**(§7.5-3). 지금은 슬러그만: `changjak-delft`.

---

# F-02 「아기는 딴 데만 봤다」

주제군 **F 집·가족의 작은 사건** / 엔진 **오해와 반전** / 무대 네덜란드 집(타일 벽난로·격자창·흑백 체크 바닥·좁은 계단) / 주인공 새끼 개 형 + 아기 + 얼굴 없는 어른들 / **12스프레드** · 후렴 없음 · 착지 **눈높이**

## F-02 §1. 앵커 배정

**한 줄**: **흰 유약면 위 코발트 평칠** — 손으로 그리는 타일의 문법 그대로 윤곽 한 획 + 두 밀도의 평칠, 🔴 **음영이 원천적으로 0**, 그늘은 색이 아니라 **코발트 필름 한 겹**, 그리고 **살아 있는 것은 화면에서 유일한 오트색 두 덩어리**다. 유일한 채도색 = **덧입힌 주홍 목도리 하나**. 앵커 슬러그 `changjak-delft` — **신규 민팅** (🔴 **C4 셋째**, 공정이 b01·e120 과 다르다).

### 이 권이 그림에 요구하는 것 (판정의 전제)

1. 🔴 **이 권의 모든 장치가 그림에만 있다.** 아기 눈동자가 매 쪽 빨간 목도리를 향하고, 어른들의 등·소매·무릎은 전부 요람 안쪽을 향해 방향이 어긋난다. 본문은 이걸 한 번도 설명하지 않는다. → **눈동자의 위치가 화면에서 가장 정확한 정보여야 한다.**
2. 🔴 **p5 가 결정적이다.** 형의 몸이 담요 아래로 통째로 사라지는데 **목도리 끝 한 뼘만 삐져나오고 아기가 그 끝을 본다.** 글을 못 읽는 아이가 그 쪽에서 먼저 안다 — 그러려면 그 빨강이 방 하나를 건너서도 **화면에서 유일한 채도색**이어야 한다.
3. 🔴 **형이 못 아는 이유가 세 겹이고 셋 다 그림이 진다.** ①**어른 등의 벽**(p3, 틈이 형 얼굴만 한 하나) ②**제가 등을 돌림**(p5·p6) ③**아기가 보는 방향을 대신 돌아봄**(p6 나막신뿐 · p8 놋주전자뿐) — 「저기 있는 것」 목록에서 저를 뺀다. **텅 빔이 그림으로 증명돼야 한다.**
4. 🔴 **착지가 눈높이다.** p1~p11 내내 형은 아기보다 낮은 데(현관 바닥 타일 → 무릎 사이 → 계단 밑 → 담요 속)에 있고 어른들의 손과 등은 늘 **위에서** 내려온다. p12 에서 요람 나무 턱에 턱을 걸쳐 **처음으로 같은 높이**가 된다. → **열두 쪽이 하나의 곡선이고, 카메라 높이가 그 곡선이다.**
5. 🔴 **어른은 얼굴이 없고 한마디도 안 한다.** 손·무릎·등·소매로만 나온다. 입이 있으면 이 책은 어른이 가르치는 책이 된다.
6. 🔴 **흑백 체크 바닥과 격자창 빛 칸이 자(尺)다.** p4 의 밀린 거리, p10 의 세 걸음, p9 의 발을 감싼 한 칸 — 전부 **칸으로 재는 수치**다. 칸이 뭉개지면 실험(p10·p11)이 우연으로 남는다.

### 후보 3

| | 후보 ① 🔴 **C4 평면 형태 · 흰 유약면 위 코발트 평칠**(`haugomat-atravers` + `karski-tutu` + `panicha-interior`) | 후보 ② C9 믹스드 콜라주(`child-tomato` — F 주제군 1순위) | 후보 ③ C7 생활 시선 · 창빛 실내 회화(`kim-subway` · `smith-smallcity`) |
|---|---|---|---|
| 매체 | 흰 유약 바탕에 코발트 윤곽 한 획 + 두 밀도의 평칠, 음영 0, 검정 한 겹, 덧입힌 주홍 하나 | 무늬 종이·질감판을 오려 붙이고 인물만 그림 | 잉크 선 + 수채, 창빛과 그늘의 명암 |
| 이 권에 맞는 이유 | 🔴 **음영이 0 이라 눈동자가 화면에서 가장 정확한 것이 된다.** 그리고 **네덜란드 집은 실제로 손으로 그린 타일과 체크 바닥과 격자 유리로 된 방**이라, 타일을 그리는 방식으로 방 전체를 그리는 것이 양식이 아니라 무대의 사실이다(§2.3). 🔴 **평칠은 「같은 칸」을 같은 칸으로 만든다** — 체크 바닥과 빛 칸이 눈금이 되고 세 걸음이 세어진다(§2.11). 🔴 **어른이 얼굴 없는 검정 덩어리**여야 하는 것과 C4 의 「얼굴 없는 도형」이 정확히 같은 요구다(§2.8 의 한계가 여기선 정책이다). 그리고 **유일한 채도색을 물성이 보증한다** — 이 매체에서 붉은색은 유약 위에 한 번 더 얹는 별도 공정이므로 「빨강은 세상에 하나뿐」이 재료의 사실이 된다 | F 1순위이고 실내·가족의 정본 | 창빛 실내의 정본, 아침 격자창이 잘 맞는다 |
| 리스크 | §2.8 — **표정을 못 쓴다.** 🔴 그런데 이 권은 **자세가 감정이다**: 발돋움 → 무릎 사이에 코만 → 밀려남 → **몸이 통째로 사라짐** → 돌아봄 → 어깨 처짐 → 멈춤 → 제 가슴 짚기 → 왕복 → 쭈그림 → 턱 걸침. 서운함을 얼굴이 아니라 **가려짐과 간격**으로 쓰는 통로가 이미 확립돼 있다(§7.3.1-3). 그리고 형에게는 **눈꺼풀 선과 별개의 눈썹**을 주고 아기에게는 **눈동자 하나만** 주어 표정 부재를 정면 돌파한다 | 🔴 **f05 가 같은 주제군 F 에서 이미 오려 붙였다.** 라인 내 중복이 개별 최적보다 우선(§7.6·f01 전례). 더해서 **콜라주는 종이가 겹쳐 두꺼워지는데** 이 권은 **눈동자 하나의 위치**가 사건이라 물성이 시선을 압도한다. 천·바늘땀 인상이 나면 그 순간 호리 니들펠트다 | 🔴 **명암이 눈금을 뭉갠다** — 붓 톤이 체크 칸과 빛 칸에 서로 다른 반사를 주면 「세 걸음」이 「어수선한 바닥」이 된다(§2.11 이 창문 개수에서 확인한 것과 같은 병). 그리고 C7 은 라인에서 가장 두꺼운 군이고 **b09 가 이 세션에서 C7 을 쓴다** |
| 판정 | ✅ **추천** | 탈락 — 라인 내 중복 + 물성이 시선을 이긴다 | 탈락 — 명암이 눈금을 뭉갠다 + 같은 세션 중복 |

**후보에도 못 올린 것들**: **C6**(넷) · **C3**(셋)은 금지 구간(§7.5). **C2**(g10·f01)는 F 에서 f01 이 이미 붓 먹선이고, 무엇보다 **선 언어는 「같은 칸 열두 개」를 열두 번 흔들어 눈금을 못 만든다**. **C8** 은 8권 상한이 물·잠·번짐 권으로 묶여 있고 번짐이 눈동자를 뭉갠다. **C1** 은 c01 이 열었고 이 권과 소재가 안 맞는다(실내·기하). `virardi-instant`(C4 프랑스 가족)는 정합하지만 **도형만이라 눈동자를 못 쓴다** — 그래서 참고에서 빼고 `karski-tutu` 의 **흰 눈 원반** 문법을 가져왔다.

### 🔴 추천 = 후보 ① — 흰 유약면 위 코발트 평칠 (C4 셋째)

근거 세 줄.

- **음영이 0 이면 눈동자가 이 화면에서 가장 정확한 것이 된다.** 이 책은 열두 쪽 내내 「눈동자가 어느 쪽에 붙어 있나」를 읽히는 책이고, 그건 **화면에 그것보다 정밀한 것이 없을 때만** 읽힌다. 회화 매체는 뺨의 반사·눈의 하이라이트·그림자로 정밀도를 나눠 쓰지만, 평칠에는 그럴 자리가 없다. 🔴 **흰 원반 + 검은 눈동자 하나**는 이 매체에서 만들 수 있는 가장 정확한 도형이고, 그 위치가 곧 이 책 전부다.
- **손으로 그린 타일이 무대의 사실이다.** 이 방은 벽난로 타일 수십 장, 파란 접시 두 장, 흑백 체크 바닥, 작은 유리 칸 격자창으로 되어 있다 — 🔴 **반복되는 같은 단위의 집합**이다. 그것을 그리는 방식(흰 유약 위 코발트 한 획 + 평칠, 음영 없음)으로 방 전체를 그리면, 형식이 취향이 아니라 **그 집의 재료**가 된다(§2.3 필연성). 그리고 그 반복 단위가 그대로 자(尺)가 되어 p4 의 밀린 거리와 p10 의 세 걸음이 세어진다.
- **어른에게 얼굴이 없어야 하는 것과 이 클러스터의 한계가 같은 요구다.** §2.8 은 C4 를 「표정 없음」이라 못 박았는데, 이 권은 **어른의 얼굴을 그리면 안 되는 책**이다(입을 열면 가르치는 책이 된다). 어른은 검정 덩어리·무릎 호·소매 띠로만 존재하고, 그게 C4 가 가장 잘하는 일이다. 🔴 한계가 비용이 아니라 정책과 일치한 드문 경우다.

**악센트 = 「유일한 채도색 하나가 열두 쪽 동안 모양을 바꾼다」**(§2.9 의 일곱째 변형). 형의 빨간 뜨개 목도리가 세상에 하나뿐인 채도색인데, 변하는 것은 **양이 아니라 그 붉은 선의 모양과 크기**다 — p1 늘어진 곡선 → p4 **공중에 그려진 가장 큰 붉은 곡선** → p5 **담요 밖 한 뼘(가장 작음)** → p9 제 가슴 가운데(가장 진한 자리) → p12 **요람 안으로 넘어가 아기 손에 쥐어진다.** 🔴 원인의 색이 마지막에 회수되므로 착지가 색 규칙 안에서 끝난다.

그리고 팔레트로 세운 규칙 한 수: 🔴 **살아 있는 것은 오트색 두 덩어리뿐이다.** 형과 아기의 몸에만 오트 퍼티 #CBB79C 를 쓰고, 어른은 검정, 방은 흰 유약과 코발트다. 효과 셋 — ① 형이 화면의 1/10 크기여도 **즉시 찾을 수 있다**(p5·p7 이 그것에 걸려 있다) ② **형과 아기가 같은 색**이라 「이 둘은 같은 종류고 나머지는 가구와 어른이다」를 팔레트가 말한다 ③ p12 에서 두 얼굴이 나란히 놓일 때 **같은 높이·같은 크기·같은 색**이 한꺼번에 완성된다.

### 🔴 대본과 그림이 부딛히는 곳 2건 (해결해서 뽑았다)

1. **「따뜻하게 밝고 / 한 단 서늘하다」**(p4 톤) — 이 앵커에는 **따뜻한 색이 방에 없다.** 그래서 이렇게 옮겼다: 🔴 **밝음 = 흰 유약 그대로 / 그늘 = 코발트 필름 한 겹**(가장자리가 딱 서는 평면 도형이고, 그라데이션이 아니다). 방의 온도차는 **밝기로만** 쓰고, 🔴 **이 책에서 따뜻한 것은 오직 오트색 두 마리와 그 빨강이다.** 겨울 아침 네덜란드 방이라는 무대와도 정합하고, 「어른들 쪽은 파랗고 살아 있는 둘만 따뜻하다」가 그림의 논지가 된다.
2. **「요람 쪽은 부드럽게 풀어 놓는다 / 배경은 부드럽게 날린다」**(p6·p9 톤) — 평칠에는 **초점 흐림이 없다.** §2.7 의 완성도 위계로 옮겼다: 🔴 **그 쪽에서 중요하지 않은 영역은 「흐리게」가 아니라 「윤곽만 있고 채워지지 않은 미완성」**으로 남긴다. 흐림은 실패이고 미완성이 정답이다.

### 라인 충돌 확인 (필수)

| 대상 | 겹치나 | 왜 |
|---|---|---|
| 호리 **니들펠트** | ✕ | 2D 평칠. 실물 입체 재료 없음. 🔴 목도리가 **뜨개**라 위험 지점이므로 「털실 한 올 외에 실·바늘땀·보풀 금지, 뜨개는 평칠 안에 그린 사선 몇 줄」로 못 박고 검수 부수 항목으로 올렸다 |
| 전래동화 **점눈이** | ✕ (4축 전부 분리) | ① **바탕** — 밝은 크림 종이(=햇빛)가 아니라 **차가운 흰 유약면**, 광원은 바탕이 아니라 격자창이다 ② **얼굴** — 점눈 아님. 🔴 **흰 눈 원반 + 그 안에 놓인 눈동자 + 윗눈꺼풀 선**이고, 형에게는 **별개의 눈썹 선**이 따로 있다(점눈으로는 「눈동자가 어디에 붙었나」를 쓸 수 없다 — 이 권이 성립 불가) ③ **악센트** — 「화면당 빨강 1점」 장식 규칙 아님. 빨강은 **처음부터 끝까지 같은 물건 하나**이고 변하는 것은 **그 선의 모양**이며, 마지막에 **쥐어진다**(장식이 아니라 플롯) ④ **매체** — 느슨한 색연필 낙서가 아니라 **윤곽 한 획 + 두 밀도 평칠, 음영 0** |
| **b01**(같은 라인, C4 첫째) | ✕ | b01 = **회색 마분지 지지체 위 불투명 평칠**, 악센트가 「안 칠한 맨 마분지」, 세는 대상이 상자, 다락 기하 / 여기 = **흰 유약면 위 코발트 평칠**, 악센트가 덧입힌 주홍, 세는 대상이 **바닥 칸**, 실내 격자. 🔴 「공정이 다른가」 판정 통과(§2.13 부수) |
| **e120**(같은 라인, C4 둘째) | ✕ | e120 = **오려 붙인 무지 색면**(가위 엣지가 보인다) + 채도색 셋 / 여기 = **붓으로 그린 윤곽 + 평칠 한 겹**(오린 자리가 없다) + 채도색 하나. 그리고 e120 은 차가운 회청 물길, 여기는 흰 회벽 실내 |
| **f01**(같은 주제군 F) | ✕ | f01 = **붓 먹선 한 획**이 부피까지 만든다(누비 골) · 색 둘이 온도(따뜻함/추위) · **겨울 한밤 침대** / 여기 = **선은 윤곽만이고 색면이 형태를 만든다** · 색이 방향(흰·코발트·검정) · **겨울 아침 방**. 🔴 f01 은 「덮여서 안 보이는 것」의 책이고 여기는 「다 보이는데 저만 못 보는 것」의 책이라 문제가 반대다 |
| **f05**(같은 주제군 F) | ✕ | f05 = 손 인쇄 무늬 종이를 오려 붙임 · 무늬가 많고 채도는 다 눌림 · 따뜻한 부엌 · 유일 채도색 치즈 노랑 / 여기 = 오리기 없음 · 무늬는 **타일 그림 둘뿐**(배·풍차) · 차가운 방 · 유일 채도색 주홍 |
| **b09**(같은 세션·같은 엔진, 둘 다 빨강 1점) | ✕ | 🔴 **세계의 온도가 정반대다** — b09 = 따뜻한 꿀빛 나무판·등불·기름 글레이즈·명암 있음·빨강이 **실 한 줄(선)** / 여기 = 차가운 흰 유약·아침 격자창·평칠·**음영 0**·빨강이 **뜨개 목도리(덩어리)**. 썸네일에서 하나는 갈색 방, 하나는 흰 방이다 |

### 밀도 배급 (§2.10 · §2.12)

무텍스트 쪽이 없어 §2.12 우선권은 미발동 → 슬롯 두 장을 **무대가 서는 쪽**과 **방 전체가 한 번만 다 보이는 쪽**에 준다.

- **p1** — 현관: 큰 나무 문, 벽 타일 두 줄, 나막신 한 켤레, 체크 바닥, 격자 빛 칸, 저 안쪽의 빈 요람. 🔴 여기서 무대를 다 가르쳐 두면 나머지 열한 쪽이 자유롭다.
- **p7** — 하이앵글로 방 전체: 체크 바닥·빛 칸·요람·벽난로 타일·접시·나막신·계단.
- 🔴 밀도 = **물건이 알아볼 수 있게 있다**는 뜻이고 **물건이 더 자세해진다는 뜻이 절대 아니다**(§2.7). **금지**: 체크 칸마다 얼룩·무늬를 넣는 것, 회벽에 텍스처를 넣는 것, 타일 마흔 장에 각기 다른 그림을 그리는 것. 🔴 **타일 그림은 배와 풍차 두 종류가 번갈아 반복되고, 그 반복이 곧 무늬다** — 다 다르게 그리면 벽이 소음이 되고 바닥의 눈금이 죽는다.

---

## F-02 §2. STYLE ANCHOR

```
STYLE ANCHOR - changjak-delft   (puppy big brother / new baby / Dutch house / a gaze)

Style: a hand-painted picture-book page for 4-6 year olds - cool, clean, geometric. A winter
  morning in ONE Dutch room drawn twelve times: RoomKit fixes the map and only the camera moves.

RENDERING: painted the way a hand-painted tin-glazed tile is, on a smooth white glazed
  surface. ONE cobalt contour stroke laid once / FLAT FILL inside it in one pass to a hard edge /
  the RED added last as a separate colour. EXACTLY TWO COBALT DENSITIES, mid and double-laid dark -
  never a third, never a gradient, NO SHADING. Bright = bare white ground; dark = ONE flat
  mid-cobalt film with a hard edge over whatever is under it, the chequer reading through it.
  FINISHED THINGS PER PAGE = 2 (the brother + the one thing he touches or looks at); all else keeps
  its contour with NO FILL - unpainted, not faded or blurred. DENSITY RATION = pages 1 and 7, where
  the room's objects go to recognisable and no further. Counts: wall tiles alternate between EXACTLY
  2 motifs, ship and windmill · plaster = 0 marks · each floor square = 0 marks inside · outdoors =
  0 after p2.
  🔴 THE FLOOR IS THE RULER - chequered tiles all one size, straight receding rows, one-point
  perspective, the lattice printing same-sized white squares on them. Steps are counted in squares:
  never tilt, warp or resize them, and compare two things only at one depth.

PALETTE: white #F1EDE3 = ground, walls, pale squares, swaddling, lit squares · cobalt #2E5C9A and
  dark #1D3A63 = every contour, every cool object, every shade film · black #16181B = dark squares,
  clogs, stair treads, ADULTS' CLOTHING · oat #CBB79C = THE ONLY COLOUR OF LIVING THINGS, the two
  puppies and nothing else · red #C8412B = the knitted scarf and one dropped strand of its wool,
  THE ONLY RED ON ANY PAGE. No fifth colour, no fire glow, no sunset.

CHARACTER DESIGN LANGUAGE: a puppy's eye = a round disc of bare white ground with ONE cobalt-black
  pupil and one upper-lid line, and 🔴 THE PUPIL'S POSITION IS THE ACTING. The brother adds a
  separate brow stroke and a mouth line; the baby has no brows and no expression - one pupil
  position and one head angle. No dot-eyes, no catchlight. 🔴 THE ADULTS HAVE NO FACES on any page,
  at any size, in any reflection - black clothing masses with almost nothing inside, flat cobalt
  hands and knees. Grade: the brother upright on hind legs, forepaws as hands, wearing one thing,
  the scarf. 🔴 THREE DIRECTIONS ON EVERY CUT - her pupils on the red scarf wherever it is, the
  adults always into the cradle (last page included), the brother at a third thing. 🔴 EYE LEVEL -
  for eleven pages he is LOWER than the baby and every adult part comes DOWN from above; only on
  p12 are the two faces one height and one size.

CANVAS: 16:9 double-page spread. No lettering or numerals anywhere.

NOT (rendering only): no digital slickness of any kind - airbrush, gradient, glow, 3D CG,
  cel-shading, photographic, or a texture filter over flat colour / no shading, modelling, highlight
  or soft-edged shadow / not blurred or soft-focus / no felt, stitching or yarn fibre.
```

### 🔴 이 앵커의 네 불변 규칙 (매 컷 네 줄로 반복 확인)

**규칙 A — `GAZE:` 아기 눈동자는 언제나 빨강을 향하고, 어른들은 언제나 요람 안쪽을 향한다.**

| 쪽 | 아기 눈동자 | 형의 시선 | 어른 |
|---|---|---|---|
| p1 | (아기 없음) | 문 손잡이 | 없음 |
| p2 | 소매가 아니라 **화면 아래 왼쪽 목도리** | 위로 뻗은 제 앞발 너머 포대기 | 전부 포대기 안쪽 |
| p3 | 보이는 한쪽 눈이 **아래 왼쪽 틈** | 무릎 사이 틈 안쪽 | 등이 요람을 둥글게 감쌈 |
| p4 | **공중의 붉은 곡선을 따라간다**(머리도 조금 돌아감) | 흔드는 제 목도리 | 숙인 등·내려간 소매 = 요람 안 |
| p5 | 🔴 **방을 가로질러 담요 밖 빨간 끝** | **벽**(등을 돌렸다) | 요람 위로 숙인 등 |
| p6 | 딸랑이를 안 보고 **눈만 옆으로 굴려 형 쪽** | 🔴 **제 등 뒤 텅 빈 벽** | 딸랑이를 흔드는 손 = 요람 안 |
| p7 | 🔴 **머리가 형이 가는 쪽으로 돌아간다** | 바닥(고개 푹 숙임) | 등이 그대로 요람 안 |
| p8 | 🔴 **형의 얼굴을 정면으로** — 이 책에서 처음 눈과 눈이 한 선에 | 🔴 **제가 지나온 뒤쪽(텅 빔)** | 소매가 아기 얼굴 위를 스치는데도 아기는 눈을 안 옮긴다 |
| p9 | (프레임 밖 — 요람 턱과 포대기 끝만) | 🔴 **제 가슴** | 화면 가장자리 |
| p10 | 🔴 **오른쪽 형에게 붙어 있다** | 요람 | 등과 소매가 요람 안으로만 |
| p11 | 🔴 **아래로 내려가 형을 내려다본다** | 위(아기) | 소매가 위에서 내려오지만 아기는 안 봄 |
| p12 | 🔴 **형과 마주친다** | 아기 | 🔴 **물러났지만 여전히 요람 쪽** |

**규칙 B — `LEVEL:` 열두 쪽이 하나의 곡선이다.**

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 바닥 | 훨씬 아래(최대 차이) | 아래 | 아래 | 🔴 **최저** | 아래 | 아래 | 아래(시선만 이어짐) | 아래 | 아래 | 더 아래(쭈그림) | 🔴 **같은 높이** |

🔴 p11 에서 **일부러 한 번 더 내려간다** — 그 쭈그림이 p12 의 눈높이를 미리 한 번 예고한다(대본 note). 그리고 p8 은 **시선은 이어지지만 높이는 여전히 아래**다 — 이 둘을 섞지 말 것.

**규칙 C — `SCARF:` 유일한 채도색의 모양이 곧 플롯이다.**

| p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 | p12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 목에 두 바퀴, 끝이 바닥까지 늘어진 곡선 | 뛰는 몸짓에 끝이 위로 튄 갈고리 | 밟혀 한쪽으로 팽팽한 직선 | 🔴 **공중에 그려진 가장 큰 붉은 곡선** + 떨어진 털실 한 올 | 🔴 **담요 밖 한 뼘 — 가장 작은 빨강** | 여전히 바닥에 나와 있는 한 뼘 | 등 뒤로 끌리는 긴 선 | 멈춤에 앞으로 흘러 몸 앞에 겹침 | 🔴 **가슴 가운데, 제 앞발이 짚은 자리** | 좌우로 두 번, 뛴 방향으로 날림 | 바닥에 동그랗게 감김 | 🔴 **요람 안으로 넘어가 아기 손에 쥐어진 붉은 선 하나** |

**규칙 D — `GRID:` 칸이 자다.** 컷마다 격자 빛 칸과 체크 칸이 무엇을 재고 있는지 한 줄. 🔴 **p10 의 왼쪽 세 칸 · 오른쪽 세 칸이 이 규칙의 정점**이고, p4(밀린 두 칸)·p9(발을 감싼 한 칸)·p12(요람 턱에 걸친 한 칸)가 같은 자로 재는 쪽들이다.

---

## F-02 §3. 캐릭터 시트 (🔴 이것부터 굽는다 — 장면 금지)

```
CHARACTER SHEET - BigBrother   (bake FIRST, attach as @image1)

🔴 THIS SHEET IS PAINTED IN THE SAME MEDIUM AS THE BOOK: one cobalt contour stroke plus a flat oat
  fill on a smooth white glazed ground. NO SHADING, no modelling, no highlight, no gradient. Do NOT
  render this animal smoothly or roundly just because there is no background behind it.

FACE: a young puppy's blunt round muzzle with one flat cobalt muzzle line and a small dark nose.
  🔴 EYES: a ROUND DISC OF BARE WHITE GROUND with ONE SOLID COBALT-BLACK PUPIL inside it and a cobalt
  UPPER LID LINE across the top of the disc. A SEPARATE eyebrow stroke sits above each eye. Draw the
  eyes in five states on this sheet: eager (pupils high, brows up), anxious (brows pulled in and up),
  startled (pupils centred, discs at their widest), downcast (lid line low, pupils low), delighted
  (discs narrowed to crescents by the lid line). No dot eyes, no sparkle, no lashes, no blush.
  EARS: two flat drop shapes that swing - pricked forward, one flicked back, both flat to the head.
BODY: ONE flat oat #CBB79C shape with a cobalt contour. No fur texture, no tufts, no shading.
CLOTHES: 🔴 ONE thing only - a KNITTED SCARF in red #C8412B. The knitting is suggested by a few drawn
  diagonal strokes INSIDE the flat red fill, and by nothing else - NO thread, NO fibre, NO fuzz, NO
  visible stitches, NO woolly edge. Draw the scarf in SIX STATES on this sheet, all six:
    (a) wound TWICE round the neck with one end hanging to the floor;
    (b) one end flicked up into a hook by a jump;
    (c) pulled taut into a straight line because it is trodden on;
    (d) 🔴 held by one end and SWUNG OVER THE HEAD, so the scarf is one big red curve in the air, with
        ONE loose strand of red wool falling away from it;
    (e) 🔴 ONE HAND'S WIDTH of the end only, lying on a floor tile, everything else hidden;
    (f) the end coiled into a small ring on the floor beside a crouching body.
  No other clothing, no shoes, no collar, no tag.
🔴 THE ACTING IS POSTURE, NOT FACE - draw the POSTURE STRIP on this sheet, seven flat figures:
    1. sitting neatly on the floor tiles, both forepaws set side by side, tail striking the floor;
    2. up on the tips of the hind feet, both forepaws stretched high;
    3. 🔴 only the nose and ONE eye pushed into a narrow vertical gap, one forepaw pulling a hem
       aside, one hind foot slipping;
    4. 🔴 A ROUND LUMP UNDER A GREY BLANKET - the whole body gone, only two hind feet and one hand's
       width of red scarf end showing, the lump turned toward a wall;
    5. walking away with the shoulders down, head low, tail hanging;
    6. 🔴 stopped mid-step with one foot lifted, the body twisted round to look behind;
    7. 🔴 crouched right down low on the hind legs, both forepaws together in front, looking up;
    8. 🔴 the chin laid on a horizontal wooden rail, both forepaws hooked over the rail's edge.
BUILD & SILHOUETTE: a small young puppy standing about three and a half heads tall on its hind legs.
  Round belly, short limbs, a short flag tail. Distinguishing point: the flat oat mass plus the red
  scarf - both readable in silhouette at thumbnail size, and 🔴 oat is the only living colour in the
  book, so he can be found on any page.
REFERENCE SHEET: full-body front idle / three-quarter turn walking / back view / the six scarf states
  / the eight-pose posture strip / three head close-ups (eager, anxious, delighted).
  Plain white glazed background, no scenery, no lettering anywhere.
SCENE token: BigBrother.
```

```
CHARACTER SHEET - BabyPup   (bake SECOND, attach as @image2 — 🔴 THE MOST IMPORTANT SHEET)

🔴 THIS SHEET DECIDES TWELVE PAGES. Everything that happens in this book happens in this baby's
  pupils, so the pupil positions must be fixed here and copied exactly in the scenes.
  Same medium: cobalt contour, flat oat fill, white glazed ground, NO shading.

FACE: a round infant puppy face, oat #CBB79C, with one flat cobalt muzzle line, a small dark nose, and
  a small drawn mouth line. Two soft ear shapes lying flat.
  🔴 EYES: two ROUND DISCS OF BARE WHITE GROUND, larger and rounder than the brother's, each with ONE
  SOLID COBALT-BLACK PUPIL inside it and a cobalt UPPER LID LINE. 🔴 NO EYEBROWS. NO EXPRESSION.
  🔴 PUPIL POSITION CHART - draw all nine on this sheet, in a 3x3 grid, with the head kept in exactly
  the same frontal position in all nine so that only the pupils differ:
    pupils far left / pupils centre / pupils far right;
    pupils low left / pupils low centre (looking down) / pupils low right;
    pupils high left / pupils high centre / pupils high right.
  🔴 THEN draw THREE HEAD-TURN VARIANTS beside the chart, because both mechanisms are used in the
  book: head still frontal with pupils slid hard to one side / head turned a quarter with pupils
  following further in the same direction / head turned and tipped down with pupils low.
  Also draw ONE version of the face SEEN THROUGH A NARROW VERTICAL GAP, where only one eye disc and
  one pupil are visible - and that pupil is aimed down and to the side, out of the gap.
BODY: 🔴 the baby is a WHITE SWADDLING BUNDLE #F1EDE3 with a cobalt contour and two or three drawn
  fold lines, and the only oat in it is the round face. The bundle shape never changes.
🔴 ONE HAND, USED ONCE: draw the small oat hand coming out over the edge of a wooden rail and GRIPPING
  the end of a red knitted scarf, fingers closed round it. This is the only thing the baby's body ever
  does. Do not draw the baby pointing, waving, reaching for anything else, sitting up, or crawling.
BUILD & SILHOUETTE: a bundle with a round face at one end. Distinguishing point: 🔴 the same oat as
  the brother, so the two of them are visibly the same kind of creature and everything else in the
  room is not.
REFERENCE SHEET: the nine-pupil chart / the three head-turn variants / the face seen through a gap /
  the bundle from three angles (from above, from the side at rail height, from the foot of the cradle)
  / the one gripping hand.
  Plain white glazed background, no scenery, no lettering anywhere.
SCENE token: BabyPup.
```

```
PARTS SHEET - GrownUps   (bake THIRD, attach as @image3 — 🔴 there are no faces on this sheet)

🔴 BAKE THIS SHEET OR THE MODEL WILL DRAW ADULT FACES. The adults in this book have no faces on any
  page, at any size, in any reflection. They are parts. They never speak.
  Same medium: solid BLACK #16181B clothing masses in one opaque pass, MID COBALT #2E5C9A hands and
  knees with a contour and no detail inside, white glazed ground, NO shading.

DRAW THESE PARTS, each as a separate flat shape, all cropped so that no head is ever included:
  1. 🔴 A WALL OF THREE BACKS seen from behind and slightly below, shoulders and long skirts, standing
     close in a curve, 🔴 WITH EXACTLY ONE GAP BETWEEN TWO KNEES - and that gap is about the size of a
     puppy's face. Everything above the shoulders is cut off by the top of the frame.
  2. Two bent KNEES and a long hem seen from a puppy's height, with a dark vertical column of skirt
     between them.
  3. A heavy SLEEVE coming down from the top of the frame, cradling a white swaddled bundle at chest
     height. The sleeve is black; the hand supporting the bundle is a flat cobalt shape.
  4. 🔴 A large flat cobalt HAND, palm down, pushing something sideways at shoulder height - no
     fingernails, no knuckle lines, no wrinkles, just the shape and a contour.
  5. A sleeve reaching down into a cradle, tucking a cover, seen from above.
  6. A hand holding a small wooden RATTLE and shaking it - draw the rattle too, plain turned wood.
  7. Two sleeves and a hem WITHDRAWING, stepping back half a pace but 🔴 still angled toward the
     cradle - used on the last page only.
  8. A pair of small black wooden CLOGS standing empty, side by side.
🔴 RULE: every one of these parts POINTS INTO THE CRADLE. That is their only direction in the whole
  book, and the last page is no exception.
Plain white glazed background, no faces, no eyes, no mouths, no hair, no lettering anywhere.
SCENE token: GrownUps.
```

```
SET SHEET - RoomKit   (bake FOURTH, attach as @image4)

🔴 THE ROOM IS A RULER, so it must be fixed before any scene. Same medium: cobalt contour, two cobalt
  densities, black, white ground, NO shading.

THE FLOOR: black-and-white chequered tiles, all the same size, 🔴 laid in straight receding rows in a
  plain one-point perspective. Draw a plate of the floor alone, big, so the square size is fixed.
THE WINDOW: one lattice window of small square glass panes in a wooden frame. 🔴 Draw the SQUARES OF
  BARE WHITE GROUND it prints on the chequered floor: a block of same-sized squares lying across the
  tiles, with a hard edge, the chequer still reading through the lit squares. Draw a row of SIX of
  them so three-and-three can be counted later.
THE CRADLE: one wooden cradle on curved rockers with a carved horizontal RAIL along its side, and a
  white cover. 🔴 Draw it from three heights, because the whole book is about height: from above /
  from standing-puppy height / 🔴 from rail height, with the rail edge horizontal across the frame at
  the level a chin could rest on.
THE TILED FIREPLACE: a plain hearth faced with square painted tiles. 🔴 THE TILES ALTERNATE BETWEEN
  EXACTLY TWO MOTIFS, a small ship and a small windmill, painted in cobalt on white with a single
  contour stroke and a flat fill - and that alternation is the pattern. Do not invent a different
  picture for each tile. A brass KETTLE on the hearth, drawn in cobalt, with one thin line of steam.
  TWO round plates hanging on the wall above, each with one cobalt motif.
THE STAIRCASE: a steep narrow wooden stair turning sharply upward, treads in black. 🔴 Draw the low
  TRIANGULAR NOOK beneath it, with a broom and a pail, and draw it with a FLAT MID-COBALT FILM laid
  over the whole nook so its darkness is one hard-edged shape and the chequer still reads through it.
THE FRONT DOOR: a big wooden door with a brass handle, two courses of painted tiles beside it, and a
  pair of small black clogs at its foot. Also draw it OPEN with the outside as flat bare white ground
  and nothing drawn in it.
PROPS: a grey woollen BLANKET as one flat mid-cobalt shape with three fold lines (no weave, no fringe,
  no fibre); the wooden rattle.
🔴 SHADE PLATE: on the same sheet, demonstrate the shade rule once - the same corner of chequered floor
  drawn twice side by side, once as bare white ground and once with ONE flat mid-cobalt film laid over
  it with a hard edge, the chequer reading through both. This is the only way this book makes dark.
Plain white glazed background, no lettering anywhere, no numerals on anything.
SCENE tokens: ChequerFloor, LatticeLight, Cradle, TileHearth, StairNook, FrontDoor, GreyBlanket.
```

---

## F-02 §4. 12컷

각 컷은 `STYLE ANCHOR + @image1(BigBrother) + @image2(BabyPup) + @image3(GrownUps) + @image4(RoomKit) + 아래 블록` 으로 합성한다.

### p1 — 아침부터 빨간 목도리를 두르고 문만 봤어요 🔴 밀도 배급 1/2
```
CAMERA: medium, slightly HIGH. BigBrother small at bottom centre (1/6 of frame), the big wooden
  front door filling the upper frame.
SUBJECT: posture 1 - sitting neatly on the tiles, forepaws side by side, ears up, brows up, tail
  striking the floor. Beside the door: two courses of ship-and-windmill tiles, the brass handle,
  the small black clogs. Far off at the back, THE EMPTY CRADLE. BabyPup is not in this picture.
GAZE: brother at the door handle, pupils high. No baby, no adults.
LEVEL: 🔴 the baseline - flat on the floor tiles, camera a little above him.
SCARF: wound twice round the neck, one end hanging to the tiles in a slack curve.
GRID: 🔴 one square's size is fixed here and never changes again.
FINISH: DENSITY RATION 1 of 2 - those objects recognisable and no further; walls bare white.
```

### p2 — 소매가, 무릎이, 등이 쑥쑥 들어왔어요
```
CAMERA: medium wide, LOW from the floor, up between adult knees and sleeves.
SUBJECT: GrownUps fill the frame, EVERY HEAD CUT OFF BY THE TOP EDGE; one sleeve holds the white
  swaddled bundle at chest height with BabyPup's face half visible. Lower left, posture 2 - up on
  the tips of his hind feet, forepaws stretched high, mouth open. The door wide open with the
  outside a flat area of bare white; wet paw-and-shoe marks where they came in; kicked-off clogs.
GAZE: 🔴 her pupils are NOT on the sleeve holding her - slid DOWN AND LEFT to the red scarf at the
  bottom edge. All adult parts inward at the bundle. He looks up past his own paws at the bundle.
LEVEL: 🔴 the widest gap in the book - baby at adult chest height, brother on the floor.
SCARF: end flicked UP into a hook by the jump; 🔴 through the one gap between the adults the white
  bundle above and the red scarf below line up in a single vertical.
GRID: squares wash to plain white near the doorway but keep their size right up to it.
FINISH: 2 (the brother + the bundle with her face); wet marks half. Outside is white and cold.
```

### p3 — 등이 벽처럼 딱 붙어서 틈이 없어요
```
CAMERA: medium, EYE LEVEL AT HIS HEIGHT. Upper two thirds = a solid mass of adult backs, one
  bright gap at the lower left.
SUBJECT: 🔴 A WALL OF THREE BACKS in solid black round the cradle, ALL HEADS CUT OFF, with exactly
  ONE GAP between two knees the size of a puppy's face; one sleeve goes down into the cradle. In
  the gap, posture 3 - nose and ONE eye pushed in, one forepaw pulling a hem aside, one hind foot
  slipping, brows in and up. BabyPup is hidden behind the backs: ONE EYE DISC VISIBLE AND NO MORE.
GAZE: 🔴 that one pupil aimed DOWN AND OUT at the gap. Backs, hems and sleeve into the cradle. He
  looks through the gap at the cradle, not at the eye, and cannot see it.
LEVEL: below - his face near the floor between knees, the baby up at rail height.
SCARF: pulled taut into a straight line because a foot is standing on it.
GRID: a few squares under the hems; 🔴 the gap is the only white shape in the upper half.
FINISH: 2 (his face in the gap + her one eye); backs flat black with almost nothing inside.
```

### p4 — 커다란 손이 형을 옆으로 살짝 밀었어요
```
CAMERA: medium, EYE LEVEL. Brother lower right being pushed aside, cradle and one adult hand
  upper left.
SUBJECT: he holds one end of the scarf and swings it high over his head, mouth wide open, hind
  feet dragged sideways. ONE LARGE FLAT COBALT HAND pushes his shoulder from the upper left, THE
  FACE ABOVE IT OUT OF FRAME; another sleeve tucks the cover. Her head has turned a little toward
  the swung scarf. One dropped strand of red wool falls away from it; one clog knocked over.
GAZE: 🔴 BOTH HER PUPILS FOLLOW THE RED CURVE EXACTLY and only it. Pushing hand and tucking sleeve
  both into the cradle - a different direction. He watches his own scarf.
LEVEL: below - on the floor being pushed, the baby up in the cradle.
SCARF: 🔴 THE BIGGEST RED SHAPE IN THE BOOK, one curve through the air, plus that one strand.
GRID: 🔴 THE PUSH IS MEASURED IN SQUARES - hind feet dragged exactly TWO squares sideways, the
  drag marks on those two. Count them.
FINISH: 2 (the brother with the red curve + the pushing hand). The cradle side is plain white; the
  side he was pushed into carries ONE hard-edged cobalt film.
```

### p5 — 담요 밖으로 빨간 목도리 끝만 삐져나왔어요 🔴 이 책의 논지가 한 화면에
```
BAKE THIS PAGE EARLY - the whole argument of the book is in one frame.
CAMERA: medium wide, EYE LEVEL, low. Left the triangular nook under the stairs, right and far off
  the cradle, the two on one horizontal line.
SUBJECT: 🔴 IN THE NOOK, ONLY A ROUND LUMP UNDER A GREY BLANKET - the body completely gone, two
  hind feet below it, the lump turned to the wall, and 🔴 ONE HAND'S WIDTH OF THE RED SCARF END
  LYING OUT ON A WHITE FLOOR TILE. Far right, adult backs bent over the cradle with BabyPup's small
  face between them. Broom and pail in the nook, stair treads above.
GAZE: 🔴 THE PAGE IS ONE STRAIGHT LINE - her two pupils slid hard across the room to that red end.
  The backs point the other way. He faces a wall.
LEVEL: 🔴 THE LOWEST POINT IN THE BOOK - a lump on the floor, camera down with him.
SCARF: 🔴 THE SMALLEST RED IN THE BOOK, and nothing may compete with it.
GRID: the lit squares run between them and 🔴 STOP AT THE NOOK'S EDGE where one hard-edged cobalt
  film begins - that line of squares is the road her look travels.
FINISH: 2 (the blanket lump with the red end + her face and eyes); broom, pail, stair edge half.
```

### p6 — 형이 제 뒤를 돌아봤어요. 나막신 한 켤레뿐이었어요
```
CAMERA: medium close-up, OVER THE SHOULDER. Front right his back with the face turned round; over
  his shoulder at upper left, smaller, the cradle.
SUBJECT: blanket pushed half off his head, body twisted round, brows in, one ear flicked back, one
  forepaw still on the blanket. 🔴 WHAT HE HAS TURNED TO LOOK AT IS ONE PAIR OF SMALL BLACK CLOGS,
  A BROOM AND PLAIN WHITE PLASTER. THERE IS NOTHING THERE. Over his shoulder an adult hand shakes
  a small wooden rattle right in front of the baby's nose.
GAZE: 🔴 THE TWO LOOKS MISS EACH OTHER AND THAT MISS IS THE CUT - his ends at an empty wall, and
  🔴 SHE IS NOT LOOKING AT THE RATTLE: head frontal, only the pupils slid hard toward him.
LEVEL: below - still down in the nook, the baby up in the cradle.
SCARF: the same one hand's width of end still out on the floor tile.
GRID: 🔴 NO LIGHT SQUARES ON THE WALL HE TURNS TO - nothing to see is drawn as no marks.
FINISH: 2 (his face + the empty wall and clogs). 🔴 The cradle side is NOT blurred and NOT faded -
  open contours with no fill.
```

### p7 — 아기 머리가 스르륵 돌았어요 🔴 밀도 배급 2/2
```
CAMERA: wide, HIGH ANGLE down over the whole room. Lower right the nook he leaves, upper left the
  door he walks toward, centre the cradle.
SUBJECT: posture 5 - walking away lower right to upper left, shoulders down, head low, tail
  hanging, the scarf trailing and faint prints left on the lit squares he crossed. Centre, adult
  backs still bent over the cradle, faces out of frame, and 🔴 BABYPUP'S HEAD HAS CLEARLY TURNED
  after him, cheek and jaw tipped that way.
GAZE: 🔴 HIS PATH AND HER TWO PUPILS POINT THE SAME WAY IN ONE FRAME, and every adult back cuts
  across that direction.
LEVEL: below - standing but head down, seen from high above, so he is small.
SCARF: a long red line trailing behind him, marking the path he walked.
GRID: 🔴 the walked path crosses the lit squares as faint prints, so the distance is countable.
FINISH: DENSITY RATION 2 of 2 - cradle, hearth tiles, kettle, plates, clogs, broom, pail, the lit
  square blocks and the prints recognisable and no further. 🔴 Plaster bare white, no mark in each
  floor square, hearth tiles ship-and-windmill alternating and nothing else.
```

### p8 — 뒤를 돌아봤는데 벽하고 놋주전자밖에 없어요
```
CAMERA: medium, EYE LEVEL. Left he is stopped mid-step and twisted round; right and behind, the
  cradle; a wide empty stretch of floor between them.
SUBJECT: posture 6 - one forefoot still lifted, eye discs at their widest, pupils centred, ears out
  sideways, the scarf swung forward across his chest. 🔴 WHAT HE HAS TURNED TO LOOK AT IS PLAIN
  WHITE PLASTER, THE BRASS KETTLE AND ONE ROUND PLATE. THERE IS NOTHING THERE. In the cradle her
  head is turned right round to him and an adult sleeve passes over her face tucking the cover.
GAZE: 🔴 BOTH HER PUPILS MEET HIS FACE STRAIGHT ON - the first time two pairs of eyes are on one
  line - and 🔴 the passing sleeve does not move them at all. The look crosses the empty floor while
  the direction he turned to is empty: both facts at once.
LEVEL: 🔴 STILL BELOW. The look connects, the heights do not; levelling belongs to p12 alone.
SCARF: swung forward by the sudden stop, lying across his own chest.
GRID: he stands on one lit square; between him and the cradle a countable run of plain squares.
FINISH: 2 (his face + her face and eyes); kettle and plate half. The middle is wide empty white.
```

### p9 — 제 가슴을 톡 짚어 봤어요. "…나?"
```
CAMERA: close-up, slightly LOW. His chest and face fill the centre.
SUBJECT: head bent right down at his own forepaw and his own chest. 🔴 ONE FOREPAW IS OPEN AND LAID
  ON THE RED SCARF IN THE MIDDLE OF HIS OWN CHEST. Eye discs round and wide, mouth a little open,
  the other forepaw stopped awkwardly in the air, one ear back, tail straight and still. At the
  frame edge, the cradle's rail and the end of the white swaddling.
GAZE: 🔴 his own chest - the only page where his look lands on the right thing. 🔴 THE BABY IS OUT
  OF FRAME; draw no baby face here. Adult parts are cloth edges at the border, still angled in.
LEVEL: below - head bent down, his eyes the second lowest in the book.
SCARF: 🔴 the darkest, most concentrated red in the book, his own open paw laid on it.
GRID: 🔴 ONE LATTICE LIGHT SQUARE HOLDS HIS FEET EXACTLY. One square, one realisation.
FINISH: 2 (his chest with paw and scarf + that one square). Nothing else is filled at all - rail
  and swaddling edge are open contours, NOT blurred, NOT faded.
```

### p10 — 왼쪽으로 세 걸음, 오른쪽으로 세 걸음
```
CAMERA: wide, EYE LEVEL. 🔴 THE SAME CHARACTER TWICE IN ONE FRAME - once far left, once far right,
  read left then right, the cradle between them.
SUBJECT: LEFT, having stepped across three lit squares, forepaws drawn up to his chest, shoulders
  lifted. RIGHT, the same brother on three lit squares at that end, head pushed forward, eye discs
  bright, scarf flying in the direction he ran. 🔴 BOTH FIGURES EXACTLY THE SAME SIZE AND EYE LEVEL
  on the same row of squares; no motion blur, ghosting, transparency, arrows or trailing copies.
  Centre, a small crease of a smile in her cheek; adult backs still bent in, seeing none of it.
GAZE: 🔴 her pupils are on the RIGHT-HAND brother; the left-hand one is the same look a moment
  earlier. The adults into the cradle throughout.
LEVEL: below in both positions, identical - the only variable here is LEFT and RIGHT.
SCARF: two reds in one frame and only two - one hanging left, one flying right.
GRID: 🔴 THE POINT OF THE PAGE - EXACTLY THREE lit squares trodden on the left and EXACTLY THREE on
  the right, his prints on them, countable by a child. Keep the rest of the floor clear.
FINISH: 2 (the two figures + her face); the six trodden squares half.
```

### p11 — 쭈그려 앉아 봤어요. 아기 눈이 아래로 내려왔어요
```
CAMERA: medium, EYE LEVEL but LOW. Right he is crouched right down, left the cradle. 🔴 THE AXIS OF
  THIS CUT IS VERTICAL, not left-right.
SUBJECT: posture 7 - crouched as low as he goes, forepaws together in front, looking up, mouth
  opening into a smile, ears up, tail sweeping the floor, the scarf end coiled in a small ring on
  the tiles. In the cradle one small oat hand has come out of the cover toward the rail, chin
  tucked. 🔴 TWO ADULT SLEEVES STILL COME DOWN FROM ABOVE INTO THE CRADLE.
GAZE: 🔴 HER PUPILS HAVE DROPPED TO THE BOTTOM OF THE WHITE DISCS, looking down at him past the
  sleeves that come from above - and she is not looking at them. That is the page.
LEVEL: 🔴 LOWER AGAIN ON PURPOSE - one more step down, a rehearsal for the next page.
SCARF: the end coiled into a small ring on the tile beside him.
GRID: one lit square under his feet; the squares above him are covered by a flat cobalt film where
  the adult clothing crowds the top of the frame.
FINISH: 2 (the brother + her eyes and the small hand); rail half.
```

### p12 — 나무 턱에 턱을 걸쳤어요. 아기가 목도리 끝을 꽉 잡았어요 🔴 착지
```
BAKE THIS CUT LAST.
CAMERA: close-up, EYE LEVEL AT THE CRADLE RAIL. Left his face with his chin on the rail, right
  BabyPup's face. 🔴 THE TWO FACES SIDE BY SIDE, SAME HEIGHT, SAME SIZE.
SUBJECT: posture 8 - lower jaw laid on the carved rail, both forepaws hooked over its edge, eye
  discs narrowed to crescents, ears easy, nose reaching a little toward her. She has turned her
  head to face him, mouth open in a laugh, and 🔴 ONE SMALL OAT HAND HAS COME OUT OVER THE RAIL
  GRIPPING THE END OF THE RED SCARF. 🔴 At the top edge, adult sleeves and hems HAVE STEPPED BACK
  but are still angled toward the cradle - no face, ever.
GAZE: the two pairs of pupils meet dead centre, for the first and only time.
LEVEL: 🔴 THE SAME - one height, one size, one frame, and the same oat colour, while every adult
  part is black and at the edge.
SCARF: 🔴 the end has gone OVER the rail into the cradle and is held in her fist - one red line
  between the two faces, the only thing touching them both.
GRID: one lit square lies across the rail between them, hard-edged.
FINISH: 2 (the two faces + the gripping hand on the red end); rail half. Swaddling folds, hearth
  tiles, plate and the clogs far off keep contours with no fill.
```

---

## F-02 §5. 첫 렌더 검수 6항목 (하나라도 걸리면 문구가 아니라 ref 를 바꾼다 — §5.1 교훈)

1. 🔴 **아기 눈동자가 어디를 보는지 즉시 읽히나.** 판정 = 썸네일 크기로 줄여도 눈동자가 흰 원반 안 어느 쪽에 붙어 있는지 보이나. 안 보이면 원반을 크게, 눈동자를 더 진하게, 그리고 **얼굴 말고 다른 데의 정밀도를 낮춘다.** 🔴 이 항목이 실패하면 그 컷은 다른 게 다 좋아도 실패다.
2. 🔴 **빨강이 목도리 밖으로 샜나.** 뺨·타일·불·꽃·표지에 붉은 기가 있으면 즉시 실패 — p5 가 성립하지 않는다(방 하나를 건너서 보이는 유일한 채도색이어야 한다).
3. 🔴 **어른 얼굴이 한 개도 없나.** 아주 작게, 뒤쪽에, 접시나 창유리 반사에라도 눈·입이 들어왔으면 실패. 그리고 **어른의 등·소매·무릎이 전부 요람 안쪽을 향하나** — 하나라도 형을 보고 있으면 이 책의 오해가 무너진다.
4. 🔴 **음영이 들어왔나.** 뺨의 둥근 명암, 부드러운 그림자, 하이라이트 점, 그라데이션이 하나라도 있으면 실패. 🔴 어두운 곳은 **가장자리가 딱 서는 코발트 필름 한 겹**이고 그 아래 체크 무늬가 비쳐 보여야 한다.
5. 🔴 **바닥 칸이 자로 쓸 수 있나.** p10 에서 왼쪽 세 칸·오른쪽 세 칸을 셀 수 있나, 칸 크기가 열두 쪽 내내 같은가, p4 의 밀린 두 칸이 두 칸으로 보이나. 칸이 뒤틀리거나 크기가 달라지면 실험이 우연으로 돌아간다(§2.11).
6. **배경이 「흐린 것」이 아니라 「덜 그린 것」인가**(§2.7 보정). 🔴 대본이 「부드럽게 풀어 놓는다」고 적은 p6·p9 에서 흐림·소프트포커스가 나왔으면 실패 — 정답은 **윤곽만 있고 안이 안 채워진 것**이다. 그리고 타일 마흔 장이 각기 다른 그림이면 벽이 소음이 되어 바닥의 자가 죽는다(배·풍차 두 종류 반복).

**부수 확인 2가지**: ① **글자·숫자가 한 개도 없나**(타일 글씨·명패 포함, 5개 언어 공용). ② 🔴 **뜨개 목도리가 「천·실·보풀」로 새지 않았나** — 실땀·섬유·털이 보이면 그 순간 호리 니들펠트 라인이다(§4). 뜨개는 **평칠 안에 그린 사선 몇 줄**이고 그게 전부다.
