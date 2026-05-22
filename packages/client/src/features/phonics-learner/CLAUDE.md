# 파닉스 학습자 모듈 (학습자 진입)

`/library/phonics` 진입점. 한글/영어 선택 → unit 그리드 → 활동 그리드 → 활동/게임 실행.

저작도구의 `features/phonics/` (=AlphabetCardTab 등 편집기) 와 **별개** 모듈. 이쪽은 학습자 학습 흐름.

## 🔴 RULE — TTS chain 절대 setTimeout 가정 X

모든 액티비티에서 TTS 끝난 후 칭찬/다음 카드/onComplete 이어질 때는 **반드시** `playAudio(url, onEnded)` 콜백 chain. `setTimeout(..., 1800)` 같은 단어 길이 가정은 다음절 한글 ("ㄱ ㄱ 거북이") 가 timeout 초과 시 다음 단계가 먼저 트리거되는 버그 원인. 이미 4 액티비티 전부 한 번에 fix 함 (2026-05-20). 새 액티비티 작성 시 [features/games/CLAUDE.md](../games/CLAUDE.md) 의 "TTS chain RULE" 섹션 참고.

## 폴더 구조

```
features/phonics-learner/
  components/
    PhonicsLandingPage.tsx           # /library/phonics — 한글/영어 카드 (둘 다 active)
    KoreanPhonicsStudyPage.tsx       # /library/phonics/korean — 한글 study layout
    KoreanPhonicsUnitPage.tsx        # 한글 unit body (embedded prop)
    KoreanPhonicsActivityPage.tsx    # 한글 활동 호스트
    EnglishPhonicsStudyPage.tsx      # /library/phonics/english — 영어 study layout (Book 1~5)
    EnglishPhonicsUnitPage.tsx       # 영어 unit body (embedded prop)
    EnglishPhonicsActivityPage.tsx   # 영어 활동 호스트 (cvc-pattern-learn + 4 게임)
  activities/
    VowelListenActivity.tsx          # 한글 모음 듣기
    VowelWriteActivity.tsx           # 한글 모음 쓰기
    ConsonantTapActivity.tsx         # 한글 자음 누르기
    ConsonantBlendListenActivity.tsx # 한글 자음+모음 음절
    ConsonantWriteActivity.tsx       # 한글 자음 쓰기
    CvcPatternLearnActivity.tsx      # 영어 CVC 통합 — Phase A 배우기 → B 단어 → C 쓰기 (한 활동)
    CvcPatternWriteActivity.tsx      # 사용 안 함 (Phase C 가 CvcPatternLearn 에 통합됨, 2026-05-21)
  lib/
    korean-phonics-units.ts       # 한글 unit 메타 + ActivityDef (subtitle 없음) + makeConsonantPlan(c)
    english-phonics-units.ts      # 영어 unit 메타 + makeBook2UnitPlan(patterns) + BOOK2_PATTERNS
    progress-store.ts             # localStorage `phonics-progress` + `phonics-recent-unit`
    pick-word-cards.ts            # 사용 안 함
    phonics-game-adapter.ts       # phonicsStorybook → 게임 data (Korean + English 분기)
```

## 라우트

- `/library/phonics` — 랜딩 (AppShell 안)
- `/library/phonics/korean(/:unitId)?` + `/.../:activityKey` — 한글 (AppShell 밖)
- `/library/phonics/english(/:unitId)?` + `/.../:activityKey` — 영어 (AppShell 밖)

## 자음 단원 자동 생성 (2026-05-20)

`makeConsonantPlan(consonant)` — 한글1 u02 (ㄱ) ~ u15 (ㅎ) 13개 자음 단원 모두 동일한 4 learn + 4 game 패턴. 자음만 다르게. 컴포넌트 100% 재사용 — 새 자음 추가 시 `CONSONANT_UNIT_MAP` 에 항목만 추가.

## 활동명 단순화 (2026-05-20)

카드 안 subtitle 모두 제거 (4-5세 텍스트 최소). 활동 타이틀:

- `consonant-tap` → `${consonant} 배우기` (이전 `${consonant} 누르기`)
- `consonant-blend-listen` → `${consonant} + 모음 배우기` (1, 2 둘 다 동일, 번호 배지로 구분)
- `consonant-write` → `${consonant} 쓰기`
- 게임: `한글 블록 게임` (이전 `한글 블록`) / `낱말 쓰기` / `낱말 그리기` (이전 `점 잇기`) / `그림 짝 찾기`
- KoreanPhonicsUnitPage 의 페이지 타이틀 (`{unit} · {level}`) 도 hide — 사이드바가 현 위치 표시

## 활동 종류 (`ActivityKind`)

| kind                                                                                                          | 컴포넌트                     | 데이터                                                                             |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| `vowel-listen` / `vowel-write`                                                                                | VowelListen/Write Activity   | `vowels: [{vowel,syllable}]`                                                       |
| `consonant-tap` / `consonant-write`                                                                           | ConsonantTap/Write Activity  | `consonant: 'ㄱ'`                                                                  |
| `consonant-blend-listen`                                                                                      | ConsonantBlendListenActivity | `consonant, blendVowels`                                                           |
| `cvc-pattern-learn`                                                                                           | CvcPatternLearnActivity      | `cvcPattern: { vowel, consonant, vc }` — 한 활동 안 Phase A→B→C (배우기·단어·쓰기) |
| `cvc-pattern-write`                                                                                           | (deprecated, Phase C 통합)   | —                                                                                  |
| `game-korean-block` / `game-english-block` / `game-word-writing` / `game-connect-dots` / `game-line-matching` | 기존 게임 플레이어           | `phonics-game-adapter` 가 빌드                                                     |

## TTS

모든 한글 발음은 phonics-library concat (`resolveTtsUrl` 의 한글 정책). storybookId = unit ID (kr-hN-uMM) 로 캐시 분리.

자음+단어 시퀀스는 공백을 0.3s 무음으로 — 예: `"ㄱ ㄱ 고기"` → ㄱ → 0.3s → ㄱ → 0.3s → 고기.

## 진척

`localStorage["phonics-progress"]` = `{ korean: { [unitId]: { completedActivities: string[] } } }`.

- 액티비티 잠금 **없음** — 사용자가 자유롭게 진입.
- 단원 잠금 **없음** — `plan.activities.length > 0` 인 단원은 모두 클릭 가능 (활동 plan 없는 단원만 "활동 준비 중" 음영).
- 완료 표시는 ✓ 뱃지로만.
- VowelListenActivity 의 퀴즈 완료는 `onMarkComplete` 콜백 — 진척만 마킹하고 **자동 back X**, "🔁 다시 해보기" + "← 돌아가기" 버튼 노출. 다른 활동은 기존 `onComplete` (마킹 + 자동 back).

## 디자인 (2026-05-20 패스)

- **카드** ([KoreanPhonicsUnitPage:ActivityCard](components/KoreanPhonicsUnitPage.tsx)): `aspect-[5/6] rounded-[28px] border-[5px]` + 코랄 틴트 그림자 + 위쪽 흰 하이라이트 + hover `-translate-y-1 rotate-[0.5deg]` + 번호 배지 `-rotate-[6deg]` 그라데이션 + ring-4 흰 외곽. 게임 4종은 `/icons/game/*.webp` 표시, 학습은 emoji text-7xl/8xl 폴백 (필요 일러스트: tap-listen / write / blend-link).
- **섹션 panel**: 익히기/게임하기 각각 `rounded-[32px]` panel wrap. 익히기 = peach 톤 (`from-peach-100/80 via-peach-50/70 to-cream-50/60 border-peach-200/70`), 게임 = mint 톤. 헤더 chip 은 panel `-top-5 left-5` floating peg (coral / mint 그라데이션 + 흰 3px 테두리). panel `pt-10 sm:pt-12` 로 카드와 헤더 분리.
- **사이드바 (StudyPage aside)**: 레벨별 접기/펴기 (`expandedLevels: Set<levelKey>`). 기본 = 현재 unit 의 레벨만 펼침, 다른 unit 클릭 시 그 레벨 자동 펼침 (useEffect). 헤더 = text-lg/xl + text-ink-900 + `playable/total` 카운트. 활성 unit = coral 그라데이션 + ring-2 흰색 + scale-[1.02] + shadow-pop.
- **배경**: `/images/phonics/study-bg.webp` (1672×941, 44KB) — 풀밭·꽃·구름 톤. StudyPage 전체 backdrop.
- **mint 디자인 토큰 추가** (`design-system/tokens/colors.ts`): mint 50/100/200/300/400/500/600 + peach 50 추가. Tailwind JIT 가 새 토큰 발견하려면 client 서버 재시작.

## 영어 파닉스 — Book 1 Single Letter Sounds (2026-05-22)

영어 Book 1 (Aa·Bb·Cc … Zz) 8 unit 모두 plan 자동 등록 — `BOOK1_LETTERS` (`english-phonics-units.ts`) + `makeBook1UnitPlan(letters)` 가 글자별 1 활동 + 마지막 ABC 쓰기 + 게임 4종 생성.

활동 종류 2개 신규:

- **`alphabet-letter-learn`** ([AlphabetLetterLearnActivity](activities/AlphabetLetterLearnActivity.tsx)) — 한 글자 학습카드 풀화면. 큰 일러스트(저작도구 illustrationUrl) + 저작도구 hotspots 위 작은 🔊 (coral pulse) overlay. 핫스팟 클릭 → 그 단어 ttsUrl 재생 (multi-hotspot 지원, `getWordHotspots` 헬퍼). **진척 마킹 없음 — 그냥 누르며 듣는 자유 탐색** (영어 모르는 4-5세 입문자). 자동 재생 X, 완료 버튼 X, ← 돌아가기만으로 종료.
- **`alphabet-letter-write`** ([AlphabetLetterWriteActivity](activities/AlphabetLetterWriteActivity.tsx)) — unit 글자 좌→우 카드 진행 (예: A → B → C). 카드당 [대문자 캔버스][소문자 캔버스] 2개. `LetterWritingCanvas` 가 자기 letter 채점, `onResult('upper'|'lower')` 콜백. 통과 시 그 글자 wordFamilies 단어 중 **랜덤 1개 TTS** 재생 (예: `a a apple` / `a a alligator` / `a a ant`). 두 캔버스 모두 통과 → useEffect 가 advanceToNext (race-free). 마지막 글자 → 칭찬 시퀀스 → onMarkComplete.

UnitPage 카드 UI (`EnglishPhonicsUnitPage.ActivityCard`) 알파벳 분기:

- `alphabet-letter-learn` → middle 영역에 **큰 글자만** 표시 (`Aa`/`Bb`/`Cc` 대문자 coral + 소문자 sky, text-7xl/8xl/9xl). title h3 hide — 글자 자체가 title.
- `alphabet-letter-write` → middle 정가운데 작은 글자 (`ABC`/`DEF`/... coral·sky 번갈아, text-4xl/5xl/6xl tracking-tight) + 우상단 ✏️ floating. 4글자 unit (`STUV`, `WXYZ`) 도 카드 폭에 fit.

Book 1 데이터 정리 (2026-05-21):

- `wordFamilies` 글자별 표준 단어 3개 (`apple/alligator/ant` 등) — `migrate-phonics-book1-letters.mjs`
- `targetWords` + `flashcards` 를 wordFamilies 와 sync — `sync-phonics-book1-targetwords.mjs`
- `flashcards[].phonemes/sentence/imageDescription` backfill — `backfill-phonics-book1-flashcard-phonemes.mjs`
- 단어 TTS 일괄 생성 (615 단어) — `generate-phonics-word-tts.mjs`
- 학습카드 일러스트 26개 PNG → WebP 변환 + 원본 R2 삭제 (72.5 MB 절감) — `convert-phonics-book1-illustrations-to-webp.mjs`

## 영어 파닉스 — Book 2 CVC (2026-05-21)

영어 phonics 학습 모드는 `/library/phonics/english(/:unitId)?` 진입. KoreanPhonicsStudyPage 평행 (`Book 1~5` 사이드바). Book 2 (Short Vowels) 8 unit 모두 plan 등록 (`BOOK2_PATTERNS` + `makeBook2UnitPlan`).

각 unit 은 VC 패턴 2~4개 보유 (예: u01 `_an _at`, u04 `_ib _id _ig _in`). 패턴마다 활동 1개 (`cvc-pattern-learn`) — 한 활동 안에서 Phase A→B→C 통합:

- **Phase A** — `a + n → an` 3행 (9 셀). 셀 클릭 시 phonics TTS, 행 완료 → 띵동, 9 셀 → 칭찬 + "다시/다음"
- **Phase B** — flashcards 의 `phonicPattern === '_${vc}'` 매치 4 단어. 각 행 `[c][an][cat]+이미지`, 행 완료 → 띵동 + 예문 발음
- **Phase C** — 단어별 [consonant 셀][a 캔버스][n 캔버스]. LetterWritingCanvas glyph-by-glyph 채점. 글자 통과 → 띵동 + 음가, 단어 모두 → 단어 발음 → 다음 단어. 4 단어 모두 → 칭찬 + onMarkComplete

게임 4종 (`game-english-block` / `game-word-writing` / `game-connect-dots` / `game-line-matching`) 은 `phonicsToEnglishXxxData` 어댑터 — 8 단어 풀에서 랜덤 4개. EnglishBlockPlayer / WordWritingPlayer / ConnectTheDotsPlayer / LineMatchingPlayer (`lang='en'`) 마운트.

활동 카드 일러: `cvc-pattern-learn` → `cvc-learn.webp` / `cvc-pattern-write` → `cvc-write.webp` (Korean 의 듣기/쓰기 활동에도 공용).

### LetterWritingCanvas 채점 알고리즘 (2026-05-21 fix)

기존 `proximity * 0.6 + coverage * 0.4` 가 점 1개만 찍어도 proximity=1.0 이라 60% 통과 버그. 새 algorithm:

- `rawScore = coverage * (0.4 + 0.6 * proximity)` — coverage 가 main driver, proximity 는 multiplier
- 점 1개 → coverage 0.01 → 1.5%, 적당히 그림 (coverage 40%) → 35% 정도. CvcPatternLearn Phase C threshold 20 으로 lenient.

## LetterTracingCanvas — stroke 단위 채점 (2026-05-22)

`LetterWriteModal` (AlphabetLetterLearnActivity 안 "Aa 써보기" 모달) 이 사용. `LetterWritingCanvas` (glyph coverage proximity 채점) 와 **별개** — stroke 단위 점 통과로 채점.

- props: `letter`, `strokes: TracingStroke[]`, `enforceOrder?: boolean` (default true), `onComplete`
- pointer-down→up 한 번 = 한 stroke. 그 안에서 stroke 의 **모든 점을 path 가 통과**하면 매칭 (시작/끝 위치 강제 X).
- enforceOrder=true: 현재 차례 stroke 점만 노출 + 다음 그릴 점 (currentGuidePi) pulse. drawing 진행에 따라 가이드 자동 이동.
- enforceOrder=false: 어떤 stroke 부터 그려도 OK. 모든 점 동시 amber.
- 그리는 도중 path 가 점 지나가면 즉시 emerald. 무효 stroke 은 회색 페이드 500ms 후 사라짐.
- 데이터: 글로벌 `useLetterStrokeLibrary` hook 우선, fallback `storybook.phonicsLesson.blending[i].letterTracingUpper/Lower` (legacy). 자세한 시스템은 루트 CLAUDE.md "알파벳 stroke 따라쓰기 시스템" 섹션 참고.

## 한글 블록 쉬움 모드 (2026-05-20)

`KoreanBlockPlayer` 의 `difficulty === 'easy'` 분기. drag-and-drop 비활성, **`EasyOrderStrip`** 으로 교체:

- `planTutorialLayout(word)` flatten → cho/jung 순서 strip (위 자모만, 다른 자모는 안 보임)
- 다음 누를 jamo 만 활성 (코랄 펄스 + ring-4) + 클릭 시 해당 셀 자동 배치 + ✓ 표시
- 잘못 누를 일 없음 (4-5세 한글 모르는 입문자 타겟). 도와줘 버튼도 숨김 (strip 자체가 가이드).
- 보통/어려움은 기존 `BlockPanel` (자음 + 모음 전체, drag) 그대로.

## unit 데이터 (저작도구 연결)

- `phonicsConfig.targetWords` — 단원 핵심 단어 4개 (게임 어댑터 1순위)
- `flashcards[]` — 저작도구 "핵심단어" 탭이 저장하는 곳. `imageUrl`, `ttsUrl`, (선택) `keypoints` 포함
- `key_objects[]` — 일반 storybook 호환용 fallback
- `findImageData(sb, word)` 가 위 순서로 검색

## unit 별 활동 plan

`KOREAN_UNIT_ACTIVITY_PLAN[unitId]` 에 unit 별로 정의. 현재 작성된 unit:

- `kr-h1-u01` (모음) — vowel-listen ×2 + vowel-write ×2 + 게임 ×4
- `kr-h1-u02` (ㄱ) — consonant-tap + blend-listen ×2 + consonant-write + 게임 ×4

다른 unit 은 plan 추가 시 자동 활성화.
