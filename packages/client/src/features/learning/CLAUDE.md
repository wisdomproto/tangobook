# Learning Reports 모듈

동화책 + 파닉스 학습 리포팅 (부모용). `/parent/reports`.

## 마스터리 공식

`0.15 + 0.85 × 정답률 × exp(-days/30) × min(1, 시도/5)` → 4단계 (`unknown/seen/practiced/mastered`)

## 이벤트 타입 (`learning_events` 테이블, snake_case)

- `page_read`
- `word_exposed`
- `word_correct` / `word_wrong`
- `syllable_correct` / `syllable_wrong` (한글: metadata.consonant + vowel)
- `phoneme_correct` / `phoneme_wrong` (영어: metadata.phoneme)
- `LearningEventMetadata` 강타입

## 시각화

- 한글 파닉스 자음×모음 히트맵 (`KoreanPhonicsHeatmap`)
- 영어 Book1~5 스킬트리 카드 (`EnglishPhonicsSkillTree`)
- 동화책 지표 + 어휘 마스터리 카드 (`StorybookReportSection` + `VocabularyMasteryCard`)

## 페이지

`/parent/reports` — 동화책 섹션 / 파닉스 섹션 각각 한/영 탭

## 집계 위치

클라이언트 JS 메모리 (`groupByWord/Syllable/Phoneme` + `computeMastery`). 추후 Supabase view/RPC 이전 가능.

## 이벤트 수집 연동

- Viewer (`page_read` + `word_exposed`)
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
