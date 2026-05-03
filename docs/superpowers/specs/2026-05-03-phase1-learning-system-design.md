# Phase 1 — 학습 시스템 재설계 (3축 + 6차원 유기 연결)

**Date:** 2026-05-03
**Status:** Decided (구현 미실행)
**선행조건:** `2026-05-03-phase0-asset-cleanup-design.md` 와 함께 읽을 것
**Source:**
- 사용자 v1 설계 문서: `C:\Users\101024\Downloads\탱고북_학습시스템_설계_v1.docx`
- 2026-05-03 설계 세션 정제 (10+ 라운드, Phase 0 구현 후 추가 정제)

**v2 변경 (2026-05-03 후반 결정):**
v1 docx에서 제안된 동화 트랙 게임 (사물 모으기 / 숨은그림찾기 / 틀린그림찾기) 모두 Phase 2/3로 deferred. 좌표 마킹 / 변형 일러스트 자동화 위험 회피, 출시 타이밍 우선. 동화 트랙은 **"핵심 단어 보기" 1개 화면** (KeyObject 자산만 활용, 데이터 추가 작업 0).

---

## 0. 한 줄 정의

탱고북 v1 → v2 전환. **베이비버스/Pinkfong 식 게이미피케이션 풍성화 폐기, 명작 IP 깊이 + 컨텐츠↔어휘↔도감 데이터 일관성 한 가설로 1차 검증**. 동화 트랙은 노출(exposure)에만, 학습은 어휘 트랙으로 분리.

## 1. 시스템 구조

```
[홈 화면]
├── 도감 (메타 레이어)
│   ├── 카테고리 view (6 카테고리: 동물/음식/마법/사람/자연/집)
│   └── 동화 view (책별 단어 그룹, 카테고리 그룹화)
├── 동화 트랙 (몰입형)
│   ├── 책 읽기 (학습 단어 강조 X, 글로우 펄스만)
│   └── 책 직후: 핵심 단어 보기 화면 (8개 그리드, 탭=발음+예문, 도감 자동 적립)
├── 어휘 트랙 (진지한 학습) — 학습 톤 UI
│   ├── 단원 source 3가지:
│   │   ├── Cambridge 토픽 (16, 영어 학습 표준)
│   │   ├── Custom (사용자 정의)
│   │   └── 동화 단원 (책별, derived from BookIndex, read-only)
│   └── 학습 사이클:
│       ├── 단어 맞추기 (line-matching / story-image)
│       ├── 한글 블록 (block 한·영)
│       ├── 따라쓰기 (word-writing 한·영)
│       └── 단어 그림 그리기 (connect-the-dots)
└── 파닉스 트랙 — 다음 세션 설계
```

**Phase 1 OFF (코드 보존):** 호리방 꾸미기 / 호리 아케이드 6종 / Weekly Missions / Playground 7게임 / Speaking 한·영. → `phase0-asset-cleanup-design.md` 참조.

**Phase 2/3 deferred (todo, 베타 후 결정):**
- 숨은그림찾기 (좌표 마킹 자동화 검증 후)
- 틀린그림찾기 + 변신 컷씬 (변형 일러스트 자동화 검증 후)
- 3장 시퀀스 맞추기 (Game 1 후보)
- 클라이맥스 다음 그림 고르기 (Game 2 후보)

## 2. 3축 분리 원칙 (사용자 v1 §1.2 그대로)

| 트랙 | 모드 | 시각 강조 | 학습 강도 | UI 톤 |
|---|---|---|---|---|
| 동화 | 이야기 몰입 | X | 암묵적 (자연 노출) | **동화 톤** (배경 풀스크린, HUD 최소) |
| 어휘 | 진지한 학습 | O | 명시적 (반복·평가) | **학습 톤** (FeedbackOverlay/ProgressBar/ResultScreen) |
| 파닉스 | 체계 학습 | — | 단계별 졸업 | (다음 세션) |
| 도감 (메타) | 통합 누적 | — | 3축 결과 시각화 | 카테고리/동화 그리드 |

**근거 (v1 §1.2 동일):**
- 4-5세 사용자가 모드를 명확히 인식 → 모드별 기대치 충돌 X
- 부모 결제 정당화: 4 가치 분리 어필
- 한 화면에서 두 욕구(몰입 vs 학습) 동시 만족하려다 둘 다 어정쩡해지는 함정 방지

## 3. 동화 트랙 — 핵심 단어 보기 화면 (1개)

### 3.1 사용자 결정 (round 7-8)

> "출시 시기 늦어지는 게 제일 안 좋아. 동화 끝나고 핵심 단어 보기 기능 넣자. 한 화면에 8개 단어 삽화 보이고, 클릭하면 효과음+애니메이션, 단어 읽어주고 예문 읽어주는 거. 학습은 어휘 탭에서 나중에."

이로써 v1 docx의 "사물 모으기 / 숨은그림찾기 / 틀린그림찾기" 모두 deferred. 자산/자동화 비용 0인 단순 reveal 화면으로 대체.

### 3.2 메커니즘

```
책 마지막 페이지
  ↓ [페이지에서 8개 사물이 분리되어 그리드로 떠오르는 transition]
[핵심 단어 보기]
  ┌─────┬─────┬─────┬─────┐
  │ 호박 │드레스│ 쥐 │무도회│
  │ 🎃 │ 👗 │ 🐭 │ 🏰 │
  ├─────┼─────┼─────┼─────┤
  │마차 │ 시계│ 유리│ 공주 │
  │ 🚗 │ 🕰 │ 👠 │ 👸 │
  └─────┴─────┴─────┴─────┘
  
  탭하면:
  - 단어 카드 살짝 들썩 (애니메이션)
  - 효과음 (CC0 합성)
  - 한국어 발음 → 영어 발음 → 예문 1문장
  - 도감 자동 적립 (learning_events 'vocab_exposure')
  
  하단: "📚 어휘 탭에서 더 익혀볼래?" (선택, 강제 X)
```

### 3.3 동화 톤 UI 원칙

기존 학습 톤 컴포넌트(`features/games/components/`) 사용 X:
- ❌ FeedbackOverlay (호리 + confetti + shake)
- ❌ GameProgressBar (점수 뱃지)
- ❌ GameResultScreen (별점 + count-up)

**사용:**
- 책 일러스트 그대로 카드 (책 분위기 연속)
- 정/오답 개념 자체가 없음 — 탭은 "보여주기"만
- 결과 화면 X — 사용자가 "어휘 탭" 선택하거나 "홈" 으로 자유 종료

### 3.4 자산/자동화 비용

| 항목 | 비용 |
|---|---|
| 새 일러스트 | **0** (KeyObject 일러스트 그대로) |
| TTS 음성 | **0** (KeyObject ttsUrl 그대로 활용) |
| 예문 | KeyObject.example 필드 활용 (memory `vocabulary-unification` — 358권 마이그 시 추가됨) |
| 좌표 마킹 | **0** (그리드 UI라 좌표 X) |
| forced alignment | **0** (책 본문 글로우 펄스는 다음 단계, MVP에선 단순 reveal만) |
| **권당 추가 작업** | **0** |

→ 모든 동화책 (211+권) 자동 적용. 카테고리 무관 (명작/자연관찰/생활동화/한국전래/파닉스).

### 3.5 4-5세 적합도 (인지 부담)

- 인지 단계: 1단계 (탭만)
- working memory: 8개 카드 = 작업 메모리 한계 안
- 시각 강조: 책 일러스트 그대로 = 책 안에 있는 느낌 유지
- 강제: 0 (보고 싶은 단어만 탭)
- 종료 시점: 사용자 자율 (어휘 탭 진입 / 홈 복귀 / 다른 책 선택)

## 4. 어휘 트랙 — 단원 source 3가지

### 4.1 단원 구성

| Source | 수 | 편집 | 비고 |
|---|---|---|---|
| Cambridge 토픽 | 16 (Pre-A1 Starters) | 어휘 탭에서 편집 가능 | 기존 (memory `vocabulary-unit-system`) |
| Custom | N (사용자 정의) | 어휘 탭에서 편집 가능 | 기존 |
| **동화 단원 (신규)** | 211+ (BookIndex에서 자동 derive) | **read-only** | 책 편집기에서만 수정 |

### 4.2 동화 단원 = derived view (별도 저장 X)

```
storybooks/{id}/storybook.json   ← single source of truth
       ↓ (read-only mirror)
어휘 탭 "동화 단원" view
도감 "동화별" view
```

**자동 동기화:**
- 책 추가 → BookIndex 재빌드 → 다음 read에서 자동 반영
- KeyObject 수정 → 자동 반영
- 책 삭제 → 단원 자동 사라짐
- 그림체 추가/삭제 → 이미지 자동 추가/제거

이미 BookIndex prewarm + stale-while-revalidate 캐시(memory `perf-optimizations`) 인프라 활용. **동기화 코드 0줄.**

### 4.3 카테고리 그룹화 (탐색 가능성)

```
[어휘 탭]
📚 Cambridge 토픽 (16)              ← 영어 학습 표준
   - Animals, Food, Family, ...

📖 동화 단원 (211+)                 ← 카테고리 그룹화
   ├── 세계 명작 (~50)
   │   - 신데렐라
   │   - 백설공주
   │   - ...
   ├── 자연관찰 (XX)
   ├── 생활동화 (XX)
   ├── 한국 전래 (XX)
   └── 파닉스 (71 — 다음 세션 분리 검토)

🎨 Custom (N)                       ← 사용자 정의
```

### 4.4 멀티 그림체 이미지 (1 단어 = N 이미지)

VocabularyWordImage 1:N 인프라(memory `vocabulary-unit-system`) 활용:

```
신데렐라 (book)
├── styleAssets['paper-craft'].keyObjects[호박] → 이미지1
├── styleAssets['pixar-3d'].keyObjects[호박]   → 이미지2
└── styleAssets['watercolor'].keyObjects[호박]  → 이미지3
            ↓ derive
어휘 단원 "신데렐라"
└── word "호박" → images: [paper-craft, pixar-3d, watercolor]
            (SR 학습 시 회전 노출 → 다양한 시각 맥락 = 일반화 능력 ↑)
```

**Edge case:**
- 단일 스타일 책 → 단어당 1 이미지 (Cambridge 단원과 동일)
- 스타일별 KeyObject 부분 누락 → 가용 이미지만 derive
- 스타일 추가/삭제 → derive 시 자동 반영 (sync 코드 X)

### 4.5 학습 사이클 (v1 §3.3 그대로)

```
단어 1: 맞추기 → 블록 → 따라쓰기
단어 2: 맞추기 → 블록 → 따라쓰기
...
5단어 마스터 = 한 세션 (5분 내, 4-5세 평균 집중력 한계)
```

### 4.6 진입점

- **동화 → 어휘**: 책 끝 핵심 단어 보기 화면 → "이 책 단어 학습하기" 버튼 → 어휘 탭의 해당 동화 단원 진입
- **메인 메뉴**: "오늘의 단어 5개" 직접 진입 (Cambridge/custom/동화 단원 풀에서 추천)
- **어휘 → 동화**: 동화 단원 → "이 책 다시 읽기" → 책 회귀
- **어휘 → 어휘**: 단어 카드 → "이 단어 나온 다른 책" 목록

### 4.7 오늘의 단어 5개 추천 로직

(기존 Word Mastery 4단계 시스템 그대로 활용)
- 최근 동화에서 만난 단어 (높은 가중치) — 핵심 단어 보기로 노출된 단어
- 미숙한 단어 (정답률 낮은 것)
- 새 단어 (도감 미수집)

## 5. 도감 메타 레이어

### 5.1 위치와 역할

- **메인 화면 최상위** + 핵심 단어 보기 화면 종료 후 자동 펼침 (선택)
- 모든 학습 결과 sink — 동화 노출 + 어휘 학습 + 파닉스 졸업 한 곳에 누적
- 부모/아이 모두 매일 확인하는 핵심 화면

### 5.2 두 view (신규)

**View 1: 카테고리 보기** (v1 §5.2 — 6 카테고리)
```
🦁 동물       12/30 ⭐24
🍎 음식        8/25 ⭐16
✨ 마법 사물   15/40 ⭐30
👤 사람·캐릭터  5/20 ⭐10
🌿 자연        3/15 ⭐6
🏠 집·장소     2/10 ⭐4
```

**View 2: 동화 보기** (신규, 책별 그룹화)
```
[📖 세계 명작 — 12/50권 노출]
  - 신데렐라    8/8 ⭐8 (완독)
  - 백설공주    5/8 ⭐5
  - ...

[🌿 자연관찰]
  - 공룡 도감   ...
```

기존 Collection 8 카테고리 → **6개로 리매핑** + 동화 view 신규 추가 (`phase0-asset-cleanup-design.md` C 영역).

### 5.3 별 currency (사용자 round 6 결정)

- **별 = 학습 누적 증거** (도감 진척 currency)
- 가게 / 가격표 / "100별 = 옷 1개" UI 절대 X (transactional framing 회피)
- 모았다는 사실 자체가 보상 (Khan Kids 톤)
- 부모 대시보드 별 그래프와 데이터 일치 → 부모/아이 동일 currency 공유
- v1 §10 "포인트로 게임 잠금 해제 폐기" 함정 회피

### 5.4 단어 카드 디테일 (multi-style 강화)

- **이미지 슬라이드**: 같은 단어 + 다른 책 + 다른 그림체 = N 이미지 누적
- 한글 + 영어 단어
- 음성 (한·영 발음)
- "이 단어 나온 책" 목록 → 탭 시 그 책 다시 읽기 (회귀 동선)
- 각 이미지 탭 → 해당 책으로 회귀 (이미지 = 책 회귀 입구)

## 6. 컨텐츠 ↔ 어휘 ↔ 도감 6차원 유기 연결 (Phase 1 핵심 가설)

명작 IP 깊이 + 데이터 일관성 — 단순 "동화 + 학습"이 아니라 데이터 차원에서 한 몸. **베이비버스가 못 만드는 이유 = 200게임이 다 따로 노는 구조라서.**

### 6.1 시각 연속성 (동화 트랙 → 핵심 단어 보기)

- 책 마지막 페이지에서 8개 사물이 분리되어 그리드로 떠오르는 transition
- 책 일러스트 그대로 카드 사용 (책 분위기 유지)
- 학습 톤 컴포넌트 X (FeedbackOverlay/ProgressBar/ResultScreen)
- 결과 화면 X — 사용자 자율 종료

### 6.2 데이터 단일 진실원

```yaml
storybooks/{id}/storybook.json:
  styleAssets:
    paper-craft:
      keyObjects: [{id: pumpkin, word, ko, illustrationUrl, ttsUrl, example, dexCategory}]
    pixar-3d:
      keyObjects: [...]
       ↓ (single source, read-only mirrors)
  ├── 핵심 단어 보기 화면 (책 직후, 8 KeyObject 그리드)
  ├── 어휘 탭 동화 단원 (derived from BookIndex)
  ├── 도감 단어 카드 (multi-style 이미지 슬라이드)
  └── 부모 대시보드 (어떤 책 어떤 단어 노출됐는지)
```

**한 단어가 모든 모드에 같은 데이터로 흘러감.** 분리 데이터 모델 X.

### 6.3 회유 동선 강화 (storybookId 양방향 링크)

- 책 끝 → 핵심 단어 보기 → "이 책 단어 학습하기" → 어휘 탭 동화 단원
- 어휘 탭 동화 단원 → "이 책 다시 읽기" → 책 회귀
- 도감 카테고리 view → 단어 카드 → "이 단어 나온 책 목록" → 책 회귀
- 도감 동화 view → 책 카드 → "이 책 다시 읽기" → 책 회귀
- 도감 단어 카드 이미지 슬라이드 → 각 이미지 탭 → 해당 책으로 회귀

### 6.4 컨텐츠 파이프라인 자동화

새 책 등록 → 자동 생성 (KeyObject 기반):
- 핵심 단어 보기 화면 (그리드 자동 구성)
- 어휘 탭 동화 단원 (derive 자동)
- 도감 카테고리 매핑 (KeyObject.dexCategory 활용)
- 도감 동화 보기 단원 (자동)
- TTS (한·영, Gemini, 기존)

→ **추가 작업 0**. KeyObject 358권 마이그 활용. 211+권 즉시 적용.

### 6.5 진척 누적 가시화

- 책 1권 (핵심 단어 보기 탭) = 도감 +N (탭한 단어 수, 중복 X)
- 어휘 트랙 5단어 마스터 = 도감 +5 (중복 단어 카운트 X)
- "오늘 +N" 단순 표시. 누적은 도감 그리드로

### 6.6 멀티 스타일 학습 효과 (베이비버스 차별점)

- 같은 단어 다양한 시각 맥락 = 일반화 능력 ↑
- SR 학습 시 이미지 회전 — 매번 다른 그림체로 노출
- **베이비버스 못 따라옴** — 단일 IP/스타일 한계
- 신데렐라 paper-craft + pixar-3d + watercolor 3가지로 "호박" 학습 → 추상화 가속

## 7. 데이터 모델

### 7.1 Storybook (변경 없음)

```yaml
storybook:
  id: cinderella_001
  title: 신데렐라
  category: 명작동화  # 명작동화 | 자연관찰 | 생활동화 | 한국전래 | 파닉스
  pages: [...]
  
  styleAssets:
    paper-craft:
      keyObjects:
        - id: pumpkin
          word: pumpkin
          korean: 호박
          illustrationUrl: ...
          ttsUrl: ...
          example: "신데렐라가 호박을 가져왔어요."
          dexCategory: 마법 사물    # 6 카테고리 매핑
    pixar-3d:
      keyObjects: [...]
  
  defaultStyle: paper-craft
  availableStyles: [paper-craft, pixar-3d]
```

(KeyObject 358권 마이그 완료 — memory `vocabulary-unification`)

### 7.2 VocabularyUnit 확장

```ts
// shared/types/vocabulary-unit.ts

export type VocabularyUnitSource = 
  | 'cambridge-starters'  // 16 토픽 (기존)
  | 'custom'              // 사용자 정의 (기존)
  | 'storybook';          // 신규 — derived from BookIndex

interface VocabularyUnit {
  id: string;             // 'book-{storybookId}' for storybook source
  source: VocabularyUnitSource;
  storybookId?: string;   // source='storybook'
  category?: string;      // source='storybook' — 명작/자연관찰/...
  isReadOnly?: boolean;   // source='storybook' = true
  title: string;
  words: VocabularyUnitWord[];
}

interface VocabularyWordImage {
  id: string;
  imageUrl: string;
  styleTag?: string;      // 신규 — 'paper-craft' | 'pixar-3d' | etc
  isPrimary?: boolean;
}
```

### 7.3 Derive API (의사 코드)

```ts
async function listVocabularyUnits(): Promise<VocabularyUnit[]> {
  return [
    ...await loadCambridgeUnits(),    // R2 저장 (기존)
    ...await loadCustomUnits(),        // R2 저장 (기존)
    ...deriveStorybookUnits(),         // 신규 — BookIndex에서 즉시 derive
  ];
}

function deriveStorybookUnits(bookIndex: BookSummary[]): VocabularyUnit[] {
  return bookIndex
    .filter(b => b.isPublic && b.keyObjects?.length > 0)
    .map(b => ({
      id: `book-${b.id}`,
      source: 'storybook',
      storybookId: b.id,
      category: b.category,
      title: b.title,
      isReadOnly: true,
      words: b.keyObjects.map(ko => ({
        word: ko.word,
        korean: ko.korean,
        ttsUrl: ko.ttsUrl,
        example: ko.example,
        images: b.availableStyles
          .map(style => ({
            id: `${ko.id}-${style}`,
            imageUrl: b.styleAssets[style]?.keyObjects
              .find(k => k.id === ko.id)?.illustrationUrl,
            styleTag: style,
            isPrimary: style === b.defaultStyle,
          }))
          .filter(img => img.imageUrl),
      })),
    }));
}
```

## 8. 데이터 작업량 (대폭 단축)

| 작업 | v1 docx 추산 | 본 spec | 비고 |
|---|---|---|---|
| 단어 메타데이터 정리 | 30분 | **0** | KeyObject 358권 마이그 완료 |
| 음성 녹음 (한/영) | 1시간 | **0** | Gemini TTS 자동 (기존) |
| 좌표 마킹 (숨은그림찾기) | 30분 | **0 (deferred)** | Phase 2/3 deferred |
| 변형 일러스트 (틀린그림찾기) | 4~8시간 | **0 (deferred)** | Phase 2/3 deferred |
| 핵심 단어 보기 (Phase 1) | — | **0** | KeyObject 그대로 활용 |
| 검수 (예문 / dexCategory 누락) | 30분 | 5분 | 스팟 체크만 |
| **권당 총합** | **약 1.5~9시간** | **약 5분** | (95%+ 단축) |

→ 211+권 즉시 적용 가능. MVP 30권 콘텐츠 작업 = **약 2.5시간** (반나절).

## 9. Phase 1 진입 ON/OFF

`phase0-asset-cleanup-design.md` §7 표 참조.

| ON | OFF (코드 보존) |
|---|---|
| 동화 트랙 (핵심 단어 보기 1개) | 호리방 꾸미기 |
| 어휘 트랙 (블록/쓰기/매칭/그리기 + 단원 3 source) | 호리 아케이드 6종 |
| 도감 (카테고리 view + 동화 view + 별 currency) | Weekly Missions |
| 별 백엔드 + 부모 대시보드 | Playground 7게임 |
| Auth + Editor + Viewer | Speaking 한·영 (Azure 보류) |

## 10. 폐기/보류된 옵션 (v1 §10 + Phase 1 추가)

v1 §10 폐기 옵션 표 그대로 유지 + 추가:

| 옵션 | 결정 | 이유 |
|---|---|---|
| 사물 모으기 별도 게임 | 🔴 폐기 | 숨은그림찾기와 모호 (round 3) |
| 동화 트랙에서 어휘-그림 매칭 / 블록 / 따라쓰기 | 🔴 폐기 | 책 직후 학습 모드 전환 갑작스러움 (round 3) |
| 별 transactional UI ("100별 = 옷 1개") | 🔴 폐기 | Over-justification 함정 (round 6) |
| 호리방 꾸미기 / 호리 아케이드 / Missions | ❌ Phase 1 OFF | 게이미피케이션 보험 — 베타 데이터로 결정 (round 6) |
| 숨은그림찾기 (좌표 매칭) | ⏳ Phase 2/3 deferred | 좌표 자동 마킹 파이프라인 검증 후 (round 7) |
| 틀린그림찾기 + 변신 컷씬 | ⏳ Phase 2/3 deferred | 변형 일러스트 + Wan I2V 자동화 검증 후 (round 7) |
| 3장 시퀀스 맞추기 | ⏳ Phase 2/3 deferred | 핵심 단어 보기 베타 D7 측정 후 추가 검토 (round 8) |
| 클라이맥스 다음 그림 고르기 | ⏳ Phase 2/3 deferred | 위 동일 (round 8) |
| 어휘 단원 동화 source = 별도 저장 | 🔴 폐기 | derive view = 동기화 코드 0 (round 9) |
| 어휘 탭에서 동화 단원 편집 | 🔴 폐기 | drift 위험 — 책 편집기에서만 (round 9) |

## 11. 미결정 사항 (다음 세션)

| 항목 | 결정 필요 |
|---|---|
| 파닉스 트랙 상세 | 전체 트랙 설계 (별도 세션) |
| 한·영 phonics 분리 또는 통합 | 다음 세션 |
| english-block 어휘 vs 파닉스 트랙 | 다음 세션 |
| 파닉스 71권을 어휘 동화 단원에 포함할지 | 다음 세션 (별도 트랙으로 분리 가능성) |
| Speaking 한·영 부활 여부 | Azure 도입 시점 |
| 베타 부모 모집 채널 | v1 §11 그대로 |
| MVP 첫 30권 명작 선정 | Phase 0 기준 사용자 결정 |

## 12. 베타 측정 지표 (v1 §12.2 + 추가)

오픈 전 성공 기준:
- **D7 리텐션 ≥ 25%** (Khan Kids 수준) — 호리방/아케이드/Missions Phase 1 OFF 검증 기준
- 주당 평균 책 완독 수 ≥ 3권
- 핵심 단어 보기 → 어휘 탭 진입률 (중요 — 회유 동선 작동 여부)
- 동화 단원 vs Cambridge 토픽 학습 비율 (동화 자산이 진짜 학습 attractor인가?)
- 도감 진척률과 리텐션 상관관계
- 부모 결제 전환율 ≥ 5%

**D7 < 25%면 Phase 3에서 호리 아케이드 / 호리방 surprise unlock + 시퀀스/클라이맥스 게임 검토.**
**D7 ≥ 25%면 OFF 시스템 영구 폐기 + 핵심 단어 보기 가설 검증.**

## 13. 다음 액션

1. ✅ Phase 0 spec 박힘 + Phase 1 spec 박힘 (본 문서)
2. ✅ Phase 0 구현 완료 (7 commits, 7e9e245..eac2e07)
3. **Memory 업데이트** (deferred todos 박기) — 다음 단계
4. **PoC 신데렐라 1권** — 핵심 단어 보기 화면 구현 + 어휘 탭 동화 단원 derive + 도감 동화 view
5. **컨텐츠 검수** — KeyObject 358권 중 누락 example/dexCategory 스팟 체크 (Phase 1 MVP 30권만)

---

**문서 끝.**

작성: 길중님 ↔ Claude (Anthropic) 설계 세션 (2026-05-03)
v1 (오전): Phase 0 자산 정리 + 6차원 유기 연결 (숨은그림/틀린그림 게임 기준)
v2 (오후): 핵심 단어 보기 1개로 단순화 + 어휘 단원 storybook source derive + 멀티 스타일 이미지

다음 업데이트: PoC 신데렐라 검증 후 / 베타 D7 측정 후 / 파닉스 트랙 설계 세션 후
