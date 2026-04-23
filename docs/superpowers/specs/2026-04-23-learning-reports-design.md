# 학습 리포팅 페이지 — 스펙

> **✅ 구현 완료 (2026-04-23)** — 플랜: `docs/superpowers/plans/2026-04-23-learning-reports-plan.md`. 진행 상세: `memory/learning-reports-complete.md`. 24 tests PASS. 나머지 게임의 `useGameLogger` 연동은 follow-up.

**Date**: 2026-04-23
**스코프**: 부모가 자녀의 학습 현황을 보는 리포팅 페이지. 동화책·파닉스·한글/영어 분리. 단순 진도체크가 아니라 **어휘 마스터리 예측**. 동화책↔파닉스 어휘 매칭은 이후 별도 스펙.
**선행조건**: `auth-login` 스펙 완료(자녀 프로필, `learning_events` 테이블 shell 존재).

## 0. 컨텍스트 & 문제

현재 `learning_events` 테이블은 배포됐지만 **이벤트를 쏘는 코드가 말하기 게임 `word_spoken` 1종뿐**. 다른 게임·동화책·파닉스는 DB에 흔적을 안 남김. 그래서:

1. **이벤트 수집 지점 마련** (viewer, 게임, 파닉스 학습)
2. **마스터리 계산 모델** (4단계)
3. **리포팅 UI** (동화책 섹션 + 파닉스 섹션, 각각 한/영 탭)

세 가지를 한 서브시스템으로 진행.

## 1. 설계 결정 (사용자 확정 2026-04-23)

| 결정 | 선택 |
|---|---|
| 스코프 묶기 | 이벤트 수집 + 마스터리 모델 + 리포팅 UI 한 스펙 |
| 마스터리 모델 | 가중치 경험식(BKT/IRT 미사용). 4단계 상태. |
| 이벤트 타입 | `page_read`, `word_exposed`, `word_correct`, `word_wrong`, `syllable_correct/wrong`(한글), `phoneme_correct/wrong`(영어) |
| 페이지 구조 | `/parent/reports/:profileId?` — **상위: 동화책 섹션 · 파닉스 섹션**, 각 섹션 안에 **언어 탭(한/영)** |
| 집계 위치 | MVP는 클라이언트 JS 메모리 집계. 추후 Supabase view/RPC 이전 |
| 한글 파닉스 시각화 | **자음(y축) × 모음(x축) 히트맵** — `KOREAN_PHONICS_CURRICULUM` 기반 |
| 영어 파닉스 시각화 | **스킬 트리 카드** (Book1~5) → 책 클릭 시 단원/단어 히트맵 드릴다운 |

## 2. 이벤트 스키마

`learning_events` 테이블에 그대로 insert (새 컬럼 없음). 모든 필드는 기존 shell의 `metadata jsonb`로 확장.

| `event_type` | 필수 필드 | `metadata` 예시 |
|---|---|---|
| `page_read` | `storybook_id` | `{ page: 3, lang: 'ko', durationMs: 8200 }` |
| `word_exposed` | `word` | `{ lang, source: 'storybook'\|'phonics', storybookId?, pageNumber?, korean? }` |
| `word_correct` | `word`, `game_type` | `{ lang, storybookId?, responseMs, attempts }` |
| `word_wrong` | `word`, `game_type` | 동일 |
| `syllable_correct` / `_wrong` | `word`(음절, 예: '가') | `{ lang: 'ko', consonant: 'ㄱ', vowel: 'ㅏ', level: 'hangul1', unitId: 'kr-h1-u2' }` |
| `phoneme_correct` / `_wrong` | (word=음소 or 단어) | `{ lang: 'en', phoneme: 'sh', pattern?: 'sh_', book: 'book4' }` |

**원칙:**
- 중복 이벤트 허용. 집계 시에만 dedup.
- 기존 `word_spoken` 유지 — `metadata.lang` 읽어서 집계에 합류.
- 게스트 모드(`isSupabaseConfigured=false`)는 이벤트 emit 함수가 no-op.

## 3. 마스터리 모델

### 단어별 마스터리 공식

```ts
// inputs (집계 결과 per word)
const exposed  = count(word_exposed | word_correct | word_wrong);
const correct  = count(word_correct | word_spoken);
const wrong    = count(word_wrong);
const attempts = correct + wrong;
const lastAt   = max(created_at);

const accuracy       = attempts > 0 ? correct / attempts : 0;
const recencyDays    = (now - lastAt) / 86400_000;
const recencyWeight  = Math.exp(-recencyDays / 30); // 30일 반감기
const attemptWeight  = Math.min(1, attempts / 5);

const mastery: number =
  exposed === 0                ? 0 :
  attempts === 0               ? 0.15 * Math.min(1, exposed / 3) :   // seen only
  0.15 + 0.85 * accuracy * recencyWeight * attemptWeight;            // practiced/mastered
```

### 4단계 상태 (UI 표시)

| 상태 | mastery 범위 | 색 (semantic 토큰) |
|---|---|---|
| `unknown` | 0 | `ink-200` (회색) |
| `seen` | 0 < m < 0.2 | `coral-200` (연분홍) |
| `practiced` | 0.2 ≤ m < 0.6 | `coral-400` (중) |
| `mastered` | m ≥ 0.6 | `success` (진녹) |

### 음절/음소 마스터리 (한글·영어 파닉스)

단어와 동일 공식, 집계 키만 교체:
- 한글: `metadata.consonant + metadata.vowel` (ex: 'ㄱㅏ' → '가')
- 영어: `metadata.phoneme` (ex: 'sh', 'a', 'oa')

## 4. 페이지 구조

```
/parent/reports/:profileId?           # :profileId 없으면 활성 프로필

  ┌─ 자녀 스위처 (현재 프로필 표시, 드롭다운으로 전환)
  │
  ├─ [섹션 1] 📖 동화책
  │     ├─ 언어 탭 (한글 | 영어)
  │     ├─ 읽은 책 수 · 총 페이지 수 · 활동 일수
  │     ├─ 최근 읽은 책 스크롤 리스트
  │     └─ 어휘 마스터리 카드 (상위 10 · 하위 10 · 전체 분포 바)
  │
  └─ [섹션 2] 🔤 파닉스
        ├─ 언어 탭 (한글 | 영어)
        ├─ (한글) 레벨 카드 hangul1~4
        │    └─ 레벨 클릭 시 자음×모음 히트맵 (모달 or 확장 패널)
        └─ (영어) 책 카드 book1~5 (스킬트리)
             └─ 책 클릭 시 단원/단어 히트맵 드릴다운
```

- 섹션 안 언어 탭의 기본값: 자녀 프로필 또는 마지막 활동 언어 (없으면 한글).
- 빈 상태: "아직 학습 기록이 없어요" + 캐릭터 이모지.

## 5. 시각화 상세

### 5.1 동화책 섹션

- **지표 카드(3개)**: 읽은 책 수, 총 페이지 수, 최근 7일 활동 일수.
- **최근 읽은 책 리스트**: 가로 스크롤, 썸네일 + 제목 + 마지막 읽은 날짜 + 읽은 횟수.
- **어휘 마스터리 뷰**:
  - 상위 10 mastered (색 진함 순)
  - 하위 10 weak (seen/practiced 중 attempts≥2 정답률 낮은 순)
  - 분포 바: unknown/seen/practiced/mastered 4색 stacked bar

### 5.2 한글 파닉스 히트맵

- hangul1~4 레벨 카드 (완독률 %, 평균 마스터리 %)
- 레벨 클릭 시 펼쳐지는 **자음 × 모음 매트릭스**:
  ```
          ㅏ  ㅑ  ㅓ  ㅕ  ㅗ  ㅛ  ㅜ  ㅠ  ㅡ  ㅣ
    ㄱ   ■■  ■□  □□  □□  ■■  □□  ■□  □□  □□  ■■
    ㄴ   ■■  □□  ■□  □□  □□  □□  □□  □□  □□  ■■
    ...
  ```
  - 셀 색: mastery 4단계 토큰
  - 셀 클릭: 해당 음절이 나온 unit/단어/최근 이벤트 (미니 팝오버)
- 모음만 다루는 `unit 1: 모음 배우기`는 상단에 **단독 모음 행**으로 분리 표시.

### 5.3 영어 파닉스 스킬트리

- book1~5 카드 가로 배열 (진행률 + 평균 마스터리)
- 각 카드 안에 해당 book의 대표 음소 배지 그리드 (book type별 다름):
  - book1 letter-sounds: 알파벳 26자
  - book2 short-vowels: a, e, i, o, u
  - book3 long-vowels: a_e, e_e, i_e, o_e, u_e
  - book4 blends-digraphs: sh, ch, th, ph, bl, cl, fl, …
  - book5 vowel-teams-r-controlled: ar, er, ir, or, ur, ee, ea, oa, …
- 배지 색: mastery 4단계 토큰
- 책 클릭 → 단원/단어 히트맵 (세로 리스트). 각 행: 단어 + 카테고리 아이콘 + 마스터리.

## 6. 이벤트 emit 지점 (기존 코드 수정)

| 지점 | 이벤트 |
|---|---|
| `ViewerContainer` — 페이지 넘김 | `page_read` + 해당 페이지 단어 → `word_exposed` 배치 |
| `PhonicsViewer` — 학습카드 완료 | 해당 flashcard → `word_exposed` |
| 게임 컴포넌트 종료 훅 (`useGameLogger`) | 게임별 정답/오답을 `word_correct/wrong`·`syllable_*`·`phoneme_*`로 변환 |
| 한글 블록·쓰기 게임 | 음절 단위로 `syllable_correct/wrong` 추가 (metadata에 consonant/vowel 분해) |
| 영어 블록·리스닝 게임 | 음소 추론 가능한 경우 `phoneme_*` 추가. 기본은 `word_correct/wrong` |

- 게임 결과 이벤트는 해당 게임의 `onComplete`·`onResult`에 훅 주입. 게임 플레이어가 game-registry를 통해 emit 함수 주입받는 패턴.

## 7. 파일 구조 (신규 영역)

```
packages/shared/src/types/
  learning-events.ts                        # EventType 유니온, per-type metadata 타입

packages/client/src/features/learning/
  api/events.api.ts                         # insertEvents(batch), fetchEventsByProfile
  hooks/
    useLogEvent.ts                          # emit 단일/배치
    useLearningEvents.ts                    # useQuery — 활성 프로필의 events
  lib/
    mastery.ts                              # computeMastery(stats) → MasteryState
    mastery.test.ts
    aggregate.ts                            # groupByWord, groupBySyllable, groupByPhoneme
    aggregate.test.ts
    korean-phonics-curriculum.ts            # KOREAN_PHONICS_CURRICULUM reshape → 집계용
    english-phonics-curriculum.ts           # PhonicsBookType별 대표 음소 리스트
  components/
    LanguageTabs.tsx
    StorybookReportSection.tsx
    PhonicsReportSection.tsx
    KoreanPhonicsHeatmap.tsx
    EnglishPhonicsSkillTree.tsx
    VocabularyMasteryCard.tsx
    MasteryDistributionBar.tsx
    MasteryBadge.tsx
  index.ts

packages/client/src/features/auth/pages/
  ParentReportsPage.tsx                     # placeholder → 실제 구현으로 교체
```

## 8. 테스트 전략

- **마스터리 공식** (`mastery.test.ts`): 표 기반 케이스 8개 (unknown/seen/practiced/mastered 경계값).
- **집계** (`aggregate.test.ts`): 이벤트 배열 → per-word/syllable/phoneme map 변환. 중복 dedup 확인.
- **커리큘럼 reshape**: 한글 curriculum → 자음×모음 셀 그리드. 영어 curriculum → 책별 음소 리스트.
- **리포팅 컴포넌트**: 스냅샷·핵심 인터랙션(탭 전환, 히트맵 셀 클릭) testing-library.
- **이벤트 emit 훅**: 게스트 모드에서 no-op. 인증 모드에서 supabase insert 호출.
- **E2E 수동**: 실제 책 1권 읽기 + 게임 2종 플레이 → 리포팅 페이지에 이벤트 반영 확인.

## 9. Non-goals (이번 스펙에서 제외)

- 동화책 어휘 ↔ 파닉스 단어 매칭 (별도 스펙)
- 부모 간 비교, 또래 평균 (별도)
- 뱃지/포인트 시스템 (별도)
- 주간/월간 리포트 이메일
- PDF 내보내기
- 실시간 푸시 (지금은 페이지 방문 시 fetch)

## 10. Open Questions

1. `page_read` emit 트리거: "페이지에 3초 이상 머무름"? 아니면 "다음으로 넘김"만? → **초안: 다음으로 넘길 때** (최종 페이지는 TTS 종료 or onNext).
2. 한글 파닉스에서 `hangul1` unit 1(모음 단독) 셀 구조 — 위 5.2처럼 단독 행 표시로 해결.
3. 영어 `phoneme_*` 이벤트를 게임에서 실제로 emit 가능한 범위 — 현 게임 로직상 단어 단위 정오답만 아는 케이스 많음. 초안: **단어 metadata.phoneme(단어의 대표 음소)** 를 기록해 간접 집계.
4. 드릴다운(히트맵 셀 클릭) — 모달 vs 확장 패널: **확장 패널**(한 화면에서 연속 탐색) 우선.

## 11. Next Step

→ 플랜: `docs/superpowers/plans/2026-04-23-learning-reports-plan.md`
