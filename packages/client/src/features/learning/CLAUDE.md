# Learning Reports 모듈

동화책 + 파닉스 + 어휘 + 활동 학습 리포팅 (부모용). `/parent/reports`.

## 페이지 구조 (4탭)

`/parent/reports` 진입 시 메인 탭 = `Chip` (variant=coral) 4개:

| 탭           | 컴포넌트                                                            | 내용                                                         |
| ------------ | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| 📊 활동 현황 | `RewardsOverviewCard` + `HoriInventoryCard` + `PlaygroundStatsCard` | 보상/호리/놀이터 (dev-only)                                  |
| 📖 동화책    | `StorybookReportSection` (한/영 서브탭)                             | **히어로 + 읽은 책 스트립 + 만난 단어 + 그림체** (아래 상세) |
| 🔤 파닉스    | `PhonicsReportSection` (한/영 서브탭)                               | 한글 히트맵 + 영어 스킬트리 + 타겟 단어 마스터리 (dev-only)  |
| 🌱 어휘      | `VocabularyTabContent` (한/영 서브탭)                               | 어휘 마스터리 (dev-only)                                     |

## 동화책 탭 (2026-07-02 히어로 리디자인 — "숫자 대시보드 → 아이 이야기")

- **`WeeklyHeroCard`** — 최상단. peach→coral 그라디언트 + 호리(주간활동>0=celebrating/0=waving) + "이번 주 책 N권을 만났어요!" + `📖 이번 주 약 N분 · 🔥 연속 N일`(streak≥2만) + **최근 7일 읽기 리듬 도트**(`weekActivity`). 기존 숫자카드 3개(`StorybookSummaryCards`) 흡수·삭제. 분(分)도 이번 주 이벤트 기준.
- **`RecentBooksStrip`** — **완독 게이트 없음**: `recentBooks()`(page_read 책별 group, 최근순)로 읽다 만 책도 표지 노출. 완독(`completedBooks` 맵)=`끝까지 읽음 🎉` coral 리본+"N번이나 읽었어요" / 미완=`읽는 중` amber 칩. 날짜 `formatKstDate`("6월 30일"). 기존 `CompletedBooksList` 대체·삭제.
- **만난 단어** — 최근순(`metWords` lastAt desc) 40개 + "모두 N개" + 초과분 "외 N개" pill.
- **그림체** — `<details>` 커스텀 marker(▶ 회전), `ArtStyleDistributionCard` `bare` prop(카드 chrome 없이 리스트만).
- **빈 상태** — `ReportEmptyState` `mascot`/`ctaLabel`/`ctaTo` prop(호리 waving + "동화책 보러 가기"→/library).
- **로딩** — ParentReportsPage 가 스켈레톤 렌더(0 플래시 방지). 페이지 헤더는 제목 한 줄만(수치 없음 — 히어로가 단일 소스, 헤더/본문 파닉스 필터 불일치 버그 제거).
- 진입은 **ParentGate(어른 확인 곱셈, auth 모듈)** 통과 후 — `/parent/*` 전체 래핑.

## 마스터리 공식

`0.15 + 0.85 × 정답률 × exp(-days/30) × min(1, 시도/5)` → 4단계 (`unknown/seen/practiced/mastered`)

## 이벤트 타입 (`learning_events` 테이블, snake_case)

- `page_read` — Viewer 진입 시 emit, **`metadata.style`** 도 함께 (v2Style ?? urlStyle ?? storybook.artStyle)
- `word_exposed`
- `word_correct` / `word_wrong` / `word_spoken`
- `syllable_correct` / `syllable_wrong` (한글: `metadata.consonant` + `vowel`)
- `phoneme_correct` / `phoneme_wrong` (영어: `metadata.phoneme`)
- `LearningEventMetadata` 강타입 (shared)

## 그림체 분포 (`ArtStyleDistributionCard`)

- `groupByArtStyle(events, storybooksById, lang?)` — `metadata.style` 우선, 없으면 `storybooks.artStyle` 폴백, 둘 다 없으면 `'unknown'` 버킷
- variant ID (`book__L1/L2/L3`) → base ID strip 폴백 (`stripVariantSuffix`)
- 가로 막대 (이모지 + 라벨 + 권수 + %), `getArtStyleLabel/Emoji` 헬퍼 (id/prompt 양방향 매칭)
- BookThumb 표지 하단에 그림체 칩 (가장 최근 읽은 그림체)

## 타겟 단어 마스터리 (한/영)

**항상 노출** (아코디언 X — 모든 레벨/책 한눈에).

- 한글: `KOREAN_PHONICS_CURRICULUM[level].units[].sampleWords` 평탄화 (4 레벨 × N 단어). 자음×모음 자세히 보기 버튼은 별도 토글
- 영어: `ENGLISH_PHONICS_CURRICULUM[book].units[].sampleWords` 평탄화 (5 권 × N 단어). lowercase 정규화로 케이싱 미스매치 해소
- `groupByWord(events, 'en')` 가 **영어 단어 lowercase 정규화** (Apple ≡ apple)

## 시각화 컴포넌트

- 한글 파닉스 자음×모음 히트맵 (`KoreanPhonicsHeatmap`) + 타겟 단어 그리드 (`KoreanLevelTargetWords`)
- 영어 Book1~5 스킬트리 카드 (`EnglishPhonicsSkillTree`) + 타겟 단어 그리드
- 동화책 지표 + 최근 읽은 책 + 그림체 분포 (`StorybookReportSection`)
- 어휘 마스터리 카드 (`VocabularyMasteryCard`) — 어휘 탭 전용

## 집계 위치

클라이언트 JS 메모리 (`groupByWord/Syllable/Phoneme/ArtStyle` + `computeMastery`). 추후 Supabase view/RPC 이전 가능.

## ID 매칭 (storybook_id ↔ storybooks 리스트)

`StorybookReportSection.findBook(id)`:

1. 직접 매칭
2. variant suffix 제거 (`__L[1-4]`) 후 base 매칭
3. 그래도 없으면 phonics 포함 전체 storybooks 매칭
4. 다 실패하면 fallback `(알 수 없는 책)` placeholder (UI 비지 않게)

## 이벤트 수집 연동

- Viewer (`page_read` + `word_exposed` + `metadata.style`)
- ConnectTheDots
- KoreanBlock (syllable 분해)
- EnglishBlock
- LineMatching (ko/en)
- WordWriting (ko/en, accuracy ≥ 50)
- SpeakingPlayer (`word_spoken`)
- StoryImage: `StoryImageRound.word` 필드 없어 skip (follow-up)
- PhonicsViewer 학습카드 `word_exposed`: follow-up

## `useGameLogger.GameWordResult.word`

옵션. 생략 시 word 이벤트 skip → 한글 게임에서 단어 + 분해된 음절(syllable-only) 이벤트 혼합 전달 패턴.

## 테스트

`mastery.test.ts` · `aggregate.test.ts` · `korean-phonics-grid.test.ts` 24 tests PASS.

상세: [memory/learning-reports-complete.md](../../../../../memory/learning-reports-complete.md)
스펙: [docs/superpowers/specs/2026-04-23-learning-reports-design.md](../../../../../docs/superpowers/specs/2026-04-23-learning-reports-design.md)
