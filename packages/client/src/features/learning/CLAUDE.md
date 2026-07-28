# Learning Reports 모듈

동화책 + 파닉스 + 어휘 + 활동 학습 리포팅 (부모용). `/parent/reports`.

## 페이지 구조 (4탭)

`/parent/reports` 진입 시 메인 탭 = `Chip` (variant=coral) 4개:

| 탭           | 컴포넌트                                                            | 내용                                                                         |
| ------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 📊 활동 현황 | `RewardsOverviewCard` + `HoriInventoryCard` + `PlaygroundStatsCard` | 보상/호리/놀이터 (dev-only)                                                  |
| 📖 동화책    | `StorybookReportSection` (한/영 서브탭)                             | **히어로 + 읽은 책 스트립 + 만난 단어 + 그림체** (아래 상세)                 |
| 🔤 파닉스    | `PhonicsReportSection` (한/영 서브탭)                               | 한글 히트맵 + 영어 스킬트리 + 타겟 단어 마스터리 (**부모 공개**, 2026-07-26) |
| 🌱 어휘      | `VocabularyTabContent` (한/영 서브탭)                               | 어휘 마스터리 (dev-only)                                                     |

## 동화책 탭 (2026-07-02 히어로 리디자인 — "숫자 대시보드 → 아이 이야기")

- **`WeeklyHeroCard`** — 최상단. peach→coral 그라디언트 + 호리(주간활동>0=celebrating/0=waving) + "이번 주 책 N권을 만났어요!" + `📖 이번 주 약 N분 · 🔥 연속 N일`(streak≥2만) + **최근 7일 읽기 리듬 도트**(`weekActivity`). 기존 숫자카드 3개(`StorybookSummaryCards`) 흡수·삭제. 분(分)도 이번 주 이벤트 기준.
- **`RecentBooksStrip`** — **완독 게이트 없음**: `recentBooks()`(page_read 책별 group, 최근순)로 읽다 만 책도 표지 노출. 완독(`completedBooks` 맵)=`끝까지 읽음 🎉` coral 리본+"N번이나 읽었어요" / 미완=`읽는 중` amber 칩. 날짜 `formatKstDate`("6월 30일"). 기존 `CompletedBooksList` 대체·삭제.
- **학습한 단어** (`MetWordsCard`, 2026-07-10) — 단어별 **카드 그리드**(표지 썸네일 + 단어 + 만난 책 이름"외 N권" + `📖 읽음`(word_exposed)/`🎮 게임`(word_correct/wrong/spoken) 배지). 기본 24개 + "전체 N개 보기" 토글(전부). 🔴 **언어 분류 = 단어 문자(`wordScriptLang`) 기준** — `metadata.lang` 누락 시 한/영 탭에 섞이던 버그 해결. 데이터=`wordDetails(events, lang)`.
- **그림체** — `<details>` marker + `ArtStyleGenreCard`(`bare`). 🔴 **메인 3종 장르만**(수채동화풍·페이퍼 3D 아트·콜라주, 이름 노출) — `groupByGenre` + `useStyleGenreLabel`(style→장르), 3종 아닌 스타일 제외. (구 `ArtStyleDistributionCard`="그림체 N" 익명 버전은 미사용 보존.)
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

## 그림체 분포 (`ArtStyleGenreCard`, 2026-07-10 — 장르 3종)

- `groupByGenre(events, storybooksById, resolveGenre, lang?)` — `metadata.style`(없으면 book `artStyle` 폴백) → `resolveGenre` 로 **장르명 or null**(3종 아님=제외) 변환 후 집계. variant ID → base strip.
- `resolveGenre` = 컴포넌트가 `useStyleGenreLabel()`(수동 `style-genre-map` + 프롬프트 `classifyGenre`)로 만들어 넘김. 3종 라벨(`STYLE_GENRES`: 수채동화풍·페이퍼 3D 아트·콜라주)에 매칭될 때만 통과.
- 🔴 **메인 3종 장르명 노출** — 라이브러리 드롭박스와 동일한 학습자 장르 라벨(마케팅 안전, 실명 아님). 구 `ArtStyleDistributionCard`(그림체 N 익명 + `getArtStyleLabel/Emoji`)는 미사용 보존(정책 변경 시 복구).
- 가로 막대 (이모지 + 장르명 + 권수 + %)

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

## 부모 리포트 리디자인 (2026-07-27) — 학부모 리뷰 반영

부모가 밤에 던지는 질문 순서(**오늘 했나 → 뭘 했나 → 늘고 있나 → 뭘 해주면 되나**)에 맞춰 재배치.

- 🔴 **히어로는 「오늘」로 시작**한다 — 이 화면을 여는 시각이 대개 아이를 재운 뒤라, 이번 주 얘기만
  하면 7일 도트를 눈으로 세게 된다. 오늘 안 했으면 나무라지 않고 사실만(`오늘은 아직이에요 · …`).
- 🔴 **칭찬은 지난주와 견줘서만** — `꾸준히 잘하고 있어요` 를 늘 켜두면 칭찬을 안 믿게 된다.
  `subUp/subSame/subDown`.
- 🔴 **「다시 한번 보면 좋을 단어」(`ReviewWordsCard`)가 이 화면의 유일한 행동**이다. 틀린 횟수는
  원래 세고 있었는데(`WordDetail.wrong`) 화면에 안 썼다. 최대 5개 — 부모가 오늘 밤 할 수 있는 만큼.
  「만난 단어 N개」는 접이식으로 강등(자랑이지 행동이 아니다), 0개면 접이식 껍데기도 안 만든다.
- 🔴 **표지·단어 카드는 전부 그 책으로 가는 링크** — 예전엔 `div` 라 눌러도 아무 일이 없어서
  부모가 라이브러리로 나가 책을 다시 찾아야 했다.
- 🔴 **부모 화면에 마스터리 % 금지** — `computeMastery` 가 `exp(-days/30)` 을 곱해 **아무것도 안 해도
  매일 내려간다**. 92%→71% 를 부모는 "까먹고 있다" 로 읽는데 사실이 아니고 할 일도 없다.
  `아직 / 배우는 중 / 잘해요` 세 단어로(색 4단계는 유지). 숫자는 dev 탭에만.
- 🔴 **읽기 리듬 도트·연속일은 `page_read` 만** 센다 — 예전엔 모든 이벤트라, 게임만 한 날도 ✓ 가
  켜지고 「🔥 연속 4일」 이 유지됐다. 라벨이 "읽음" 이면 세는 것도 읽기여야 한다.
- 🔴 **자녀 전환은 리포트 자체 탭**(`viewProfileId` 로컬 state) — 헤더 프로필 칩으로 바꾸면
  `activeProfile` 이 바뀌어 **다음날 첫째 기록이 둘째에게 붙는다**.
- 🔴 **파닉스 탭 첫 화면 = 문장 두 줄 + 버튼**(`PhonicsSummaryCard`). 히트맵·스킬트리는 접이식으로.
  `a_e` 가 뭔지 모르는 부모에게 8×10 격자는 개발자용 시각화다.

### 🔴 파닉스 이벤트 (2026-07-27 배선)

`features/phonics-learner` 가 **학습 이벤트를 하나도 안 보내고 있었다** — 진척이 localStorage
(`phonics-progress`)에만 쌓여서, 아이가 저녁 내내 파닉스를 해도 부모 파닉스 탭은 **늘 0%** 였다.
화면이 비는 것보다 나쁜, 없는 사실을 보고하는 상태였다.

- 두 활동 페이지(`Korean/EnglishPhonicsActivityPage`)의 `markActivityCompleted` 자리에서
  `page_read`(storybookId=unitId, `metadata.source='phonics'`)를 남긴다 — `phonics-progress.ts` 가
  그 형태로 단원 진행을 센다.
- 🔴 **음절·음소 정오답(`syllable_correct` 등)은 지어내지 않는다.** 활동이 실제로 그걸 판정할 때
  그 자리에서 남길 일이다. 히트맵이 비어 보이는 건 그 배선이 아직 없기 때문이다.
