# 영어 파닉스 — e-future EFL Phonics 분석 & 우리 콘텐츠 대조

원본: `phonics/english/EFL Phonics E-book/EFL Phonics 1~5` (권당 128~152쪽 스캔, 총 720장)
분석일: 2026-07-26 · 대상: 우리 영어 파닉스(`features/phonics-learner`, `ENGLISH_PHONICS_CURRICULUM`)

---

## 1. e-future 구조 — 권/유닛/복습

### 권 구성 (5권 공통)

```
Unit 1~4 → Review 1 → Unit 5~8 → Review 2 → Challenge → Test → Sight Words → Flashcards
   6쪽씩       6쪽        6쪽씩       6쪽        6쪽       6쪽       1쪽        부록
```

| 권 | 주제 | 유닛당 단어 |
| --- | --- | --- |
| 1 | Single Letter Sounds (Aa~Zz, 유닛당 3~4글자) | 9 (글자당 3) |
| 2 | Short Vowels a·i·e·o·u | 8 |
| 3 | Long Vowels (Magic e) | 8 |
| 4 | Blends & Digraphs (bl cl fl, br cr fr, ch sh, th…) | 12 |
| 5 | Vowel Digraphs (ee ea, oa ow, ai ay, oi oy, ar or, oo…) | 12 |

### 🔴 유닛 = 6쪽 고정 템플릿 (전 권·전 유닛 동일)

| 쪽 | 섹션 | 문항 | 성격 |
| --- | --- | --- | --- |
| 1 | **Learn** | Listen and repeat (글자+대표단어) / Trace and say (획순 화살표, 대·소문자) | 익히기 |
| 2 | **Practice** | Look and match (그림↔글자) / Say and write (실루엣+트레이스) | 연습 |
| 3 | **Learn More** | Listen and repeat — 글자당 단어 3개 | 어휘 확장 |
| 4 | **Practice More** | Listen and check (음성→그림 3지선다) / Say and circle (그림→대소문자) | 연습 |
| 5 | **Listen & Do** | Listen and circle (글자 3지선다) / Listen and check (그림 4지선다) | **테스트** |
| 6 | **Read & Do** | 4컷 리버스 스토리 + Chant along + Sight words | 통합·읽기 |

설계 의도로 읽히는 것:

- **순서가 절대 안 바뀐다.** 아이가 다음에 뭘 할지 알아서 인지부하가 낮다. 유닛마다 바뀌는 건 타겟 글자/단어뿐.
- **듣기 먼저, 쓰기 나중.** 1쪽에서 소리를 듣고 6쪽에서 문장을 읽는다.
- **난이도 계단이 쪽마다 한 칸씩**: 그림 3지선다 → 그림 4지선다 → 글자만 보고 고르기 → 문장 읽기.
- **6쪽 스토리가 "왜 배우나"에 답한다.** 단어를 그림으로 치환한 리버스 문장(`Look at the 📖. The 📖 is in the 🐊.`)이라 아직 못 읽는 아이도 읽는 경험을 한다. 하단에 그 화의 sight words 5개.

### 🔴 Review = 4유닛마다, 6쪽 — 유닛과 **다른 형식**

| 쪽 | 활동 | 비고 |
| --- | --- | --- |
| 1 | Listen and chant | 배운 글자 전체를 리듬으로 낭송(a a 🍎 a a a …) |
| 2 | Listen and check (2지선다) + Listen and circle | 유닛보다 선택지를 **줄여서** 속도감 |
| 3 | **Play & Do** — 미로 찾기 + "What letters did you find?" | 길 따라가며 만난 사물의 첫 글자 수집 |
| 4 | **Match and say** — 대문자 풍선 ↔ 그림 구름 ↔ 소문자 깃발 | 3단 연결(대문자·그림·소문자) |
| 5 | Read & Do — Read and circle / Say and circle | 글자→그림, 그림→대소문자 양방향 |
| 6 | **Write & Do** — 그림 12개 보고 첫 글자 쓰기 | 상단 알파벳 스트립에서 쓴 글자를 지워가며 |

핵심은 **복습이 유닛의 축약판이 아니라는 것**. 미로·3단 매칭·챈트·12문항 쓰기는 유닛에 없던 형식이다. 같은 걸 또 시키면 지루하니까 형식을 바꿔서 **전이(transfer)** 를 확인한다.

### Challenge / Test (권 끝)

- **Challenge** (6쪽) — 전 범위 통합. 예: 밤하늘 별에 A~Z를 흩어놓고 `Listen and draw` 로 순서대로 이어 그림을 완성 → "What is it?"
- **Test** (6쪽) — Part 1/2/3. **`Ex.` 예시 문항을 먼저 보여주고** 시작하는 실제 시험 포맷. 듣고 고르기 → 읽고 고르기 → 쓰기 순.

---

## 2. 우리 현재 영어 파닉스

### 데이터 (있는 것)

- `ENGLISH_PHONICS_CURRICULUM`(shared) = **5 books / 39 units** — e-future와 거의 1:1 (book3만 7유닛).
- R2 storybook 39개 — `phonicsConfig.targetWords`, `flashcards`(word/localWord/phonemes/phonicPattern/sentence/imageDescription), `blending`, `wordFamilies`, `chant`, `worksheets`, `phonicsQuiz` 필드까지 이미 존재.

### 학습자 활동 (`ENGLISH_UNIT_ACTIVITY_PLAN`)

| 범위 | 활동 | 상태 |
| --- | --- | --- |
| Book 1 (8유닛) | `alphabet-letter-learn` ×3~4 + `alphabet-letter-write` + 게임 4 | ✅ |
| Book 2 (8유닛) | `cvc-pattern-learn` ×2~4 (한 활동에 Phase A 배우기→B 단어→C 쓰기 통합) + 게임 4 | ✅ |
| Book 3~5 (23유닛) | — | ❌ 활동 0 = "활동 준비 중" |

### 자산 실측 (프로덕션 API)

| | flashcards | 이미지 | TTS |
| --- | --- | --- | --- |
| en-b1-u01 | 9 | **0** | 9 |
| en-b2-u01 | 8 | 8 | **0** |
| en-b3-u01 | 8 | **0** | **0** |
| en-b4-u01 | 12 | **0** | **0** |
| en-b5-u01 | 12 | **0** | **0** |

그림이 필요한 게임(그림 짝 찾기·낱말 그리기)은 이미지 없는 유닛에서 어댑터가 `null` 을 반환해 안 뜬다. 한글 2~4레벨과 같은 구조의 구멍.

---

## 3. 갭 — e-future 대비 빠진 것

| # | 빠진 것 | 왜 중요한가 |
| --- | --- | --- |
| **A** | **복습 층이 통째로 없다** | e-future는 4유닛마다 Review 6쪽. 우리는 유닛→유닛→끝이라 **배운 걸 섞어서 다시 만나는 지점이 0**. 파닉스는 누적 과목이라 이게 제일 크다. |
| **B** | **평가가 없다** | Test 포맷(Ex. 예시 + Part 1~3) 부재. 정답률이 남는 활동이 없어 **부모 리포트에 "어디까지 됐다"를 못 쓴다**. |
| C | 유닛 안 활동 다양성이 좁다 | e-future는 유닛 6쪽 안에 문항 유형이 6종(match/write/check/circle/read/chant). 우리는 학습 1~2종 + 게임 4종. |
| D | **듣고 고르기(리스닝 변별)가 없다** | e-future 유닛의 절반이 "듣고 → 고른다". 우리 활동은 **누르면 소리가 나는** 쪽이라 입력→판단이 아니라 탐색이다. 소리 변별을 확인하는 수단이 없다. |
| E | 스토리·챈트 없음 | 유닛이 게임으로 끝나고, 배운 글자로 문장을 읽어보는 마무리가 없다. |
| F | 자산 구멍 | b1 이미지 0 / b2 TTS 0 / b3~5 전무. |

---

## 4. 옮길 때의 제안

### 🔴 종이 6쪽을 앱 6활동으로 1:1 옮기지 말 것

종이책이 Practice와 Practice More를 나눈 건 **채점을 못 하기 때문**이다(교사·부모가 봐줘야 함). 앱은 즉시 채점·무한 재시도가 되므로 두 연습을 하나로 합치고, 그 자리에 **없는 것(리스닝 변별)** 을 넣는 게 이득이다.

권장 유닛 구성 (5활동 + 게임):

1. 배우기 — 글자/패턴 + 대표단어 *(기존 `alphabet-letter-learn` / `cvc-pattern-learn`)*
2. 단어 더 배우기 — 글자당 단어 3개 *(Learn More 대응, 신규)*
3. **듣고 고르기** — 음성 → 그림/글자 3~4지선다 *(신규, 갭 D)*
4. 쓰기 — 기존 `LetterFillCanvas`
5. 읽기 — 리버스 문장 4컷 + 챈트 *(갭 E, `flashcards[].sentence` 이미 있음)*
6~9. 게임 4종 (기존)

### Review 유닛 = 유닛 그리드의 특별 카드

4유닛마다 `en-b2-r1` 형태의 복습 유닛을 **커리큘럼에 넣고** 사이드바에 유닛처럼 노출. 형식은 유닛과 다르게:

- 챈트 (배운 글자 전체 리듬)
- **미로** — 길 따라 만난 사물의 첫 글자 수집
- **3단 매칭** — 대문자 ↔ 그림 ↔ 소문자 *(기존 `LineMatchingPlayer` 확장 가능)*
- 그림 보고 첫 글자 쓰기 12문항 *(기존 `LetterFillCanvas` 반복)*

미로와 3단 매칭은 기존 게임 컴포넌트로 상당 부분 커버된다.

### Test는 부모 리포트와 연결

Test를 만들 거면 **정답률을 남기는 유일한 활동**으로 설계해야 값어치가 있다. `Ex.` 예시 문항 관습은 그대로 가져올 것(4~7세는 첫 문항에서 규칙을 배운다).

### 자산 우선순위

1. **b2 TTS** — 이미 이미지가 있어 TTS만 채우면 book2가 완성된다
2. **b1 이미지** — TTS는 있음. 한글 단어 카드와 같은 파이프라인
3. b3 이미지+TTS — 다음 학습 단계
4. b4·b5 — 그 다음

### 착수 순서 제안

**(1) Review 층 → (2) 리스닝 변별 활동 → (3) book3~5 plan → (4) Test**

Review 를 먼저 두는 이유: book3~5 plan 을 먼저 늘리면 **복습 없이 유닛만 23개 더 쌓이는** 구조가 굳는다.

---

## 5. 진행 상황 (2026-07-26)

| 단계 | 상태 | 결과 |
| --- | --- | --- |
| ① Review 층 | ✅ | 한글 복습 7단원(`kr-h1-r1`…). 활동 3종 중 둘은 기존 컴포넌트 재사용. 배관은 영어와 공용. |
| ② 리스닝 변별 | ✅ | `word-listen-choose` — 한글 학습 단원 31개 + 영어 Book 1(알파벳만). |
| ③ book3~5 plan | ⬜ | 23유닛. **선행 필요** — b3~5 는 그림·TTS 자산이 전무해 plan 만 붙이면 대부분 "단어 그림이 필요해요". |
| ④ Test | ⬜ | 정답률이 남는 활동으로 설계해야 부모 리포트와 이어진다. |

### 🔴 옮기면서 확정한 두 규칙

1. **보기에 글자를 반드시 쓴다.** 처음엔 "4~7세라 못 읽으니 그림만"으로 만들었는데, **파닉스의 목표가 소리↔글자 연결**이라 글자를 빼면 학습 대상이 화면에서 사라진다. 연령이 낮다고 줄여야 하는 건 지시문·장식·선택지 수지 **학습 내용이 아니다**.
2. **단, 영어 Book 1 은 알파벳만.** 그 권은 글자 자체가 목표고 단어는 예시라, `apple` 철자를 보기에 쓰면 아직 못 하는 걸 읽으라는 게 된다. (이 예외 덕에 Book 1 은 그림 자산 없이도 지금 동작한다.)

### 영어 콘텐츠 방향 (사용자 지정)

- 삽화는 전부 **호리 동화 그림체(니들펠트)**.
- 유닛마다 **호리 앙상블 동화**를 만든다 — 한글의 [한글 나무](../../packages/client/public/hangeul-tree-plan.html) 라인과 같은 구조.
