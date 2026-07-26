# 파닉스 학습자 모듈 (학습자 진입)

`/library/phonics` 진입점. 한글/영어 선택 → unit 그리드 → 활동 그리드 → 활동/게임 실행.

저작도구의 `features/phonics/` (=AlphabetCardTab 등 편집기) 와 **별개** 모듈. 이쪽은 학습자 학습 흐름.

## 🔴 RULE — TTS chain 절대 setTimeout 가정 X

모든 액티비티에서 TTS 끝난 후 칭찬/다음 카드/onComplete 이어질 때는 **반드시** `playAudio(url, onEnded)` 콜백 chain. `setTimeout(..., 1800)` 같은 단어 길이 가정은 다음절 한글 ("ㄱ ㄱ 거북이") 가 timeout 초과 시 다음 단계가 먼저 트리거되는 버그 원인. 이미 4 액티비티 전부 한 번에 fix 함 (2026-05-20). 새 액티비티 작성 시 [features/games/CLAUDE.md](../games/CLAUDE.md) 의 "TTS chain RULE" 섹션 참고.

## 🔴 RULE — 활동 진입 시 발음 프리워밍 (2026-07-25)

새 활동을 만들면 **그 활동이 쓸 텍스트를 `usePhonicsTtsWarm(unitId, texts, prefix)` 로 진입 시 데운다**(`hooks/usePhonicsTtsWarm.ts`). 안 하면 첫 탭이 **concat 왕복 804ms + mp3 620ms ≈ 1.4초 무음**(실측)이고 아이는 그 사이 카드를 다시 누른다.

- 뿌리는 `resolveTtsUrl`(`features/tts`) 이 **탭할 때마다 서버에 URL 을 다시 물었던 것** — 결과가 결정적인데도. 이제 **세션 캐시**(in-flight 공유, 실패는 캐시 안 함)라 데워둔 소리는 왕복 0. 게임·뷰어 등 모든 호출부가 함께 이득.
- 게임처럼 진행률 게이트를 세우지 **않는다** — 파닉스는 첫 소리까지 아이가 할 일(카드 보기)이 있어 게이트가 진입만 느려 보이게 한다.
- 배선 완료: 모음 듣기/쓰기 · 자음 누르기/쓰기 · 자음+모음. 실측 = 탭 시 네트워크 요청 0건.

## 활동 UI 규칙 (2026-07-25)

- **모음 카드 배치는 `flex` + `justify-center`** — `grid-cols-6` 이던 시절 모음이 4개인 단원(ㅜㅠㅡㅣ)에서 왼쪽 4칸만 차 쏠렸다. 개수와 무관하게 가운데여야 하고, 마지막 줄이 1장이어도 중앙에 온다. 카드 폭 `w-[28%] lg:w-36`.
- **퀴즈에서 맞춘 카드 = 민트 + ✓**(`solved` Set). 흰색 그대로면 몇 개 남았는지 안 보인다. 끝나면 전부 민트라 "다 맞췄다"가 그림으로 읽힌다.
- **같은 제목 카드 두 장을 나란히 두지 않는다** — 자음 단원의 `ㄱ + 모음 배우기` 두 개는 모음 묶음이 다른데 제목이 같았다. 모음 듣기 1/2 규칙대로 **번호를 붙인다**(`makeConsonantPlan`, 자음 15개 단원 일괄).
- **글자가 박힌 아이콘은 언어 자산이다** — `word-writing.webp` 는 연필이 알파벳 **A** 를 쓰는 그림이라 한글 단원엔 `word-writing-ko.webp`(연필이 `나무` 를 쓰는 그림, 512px webp 18KB)를 쓴다. 한글 경로 2곳 = 파닉스 단원 카드(`KoreanPhonicsUnitPage`) + 동화책 단어 익히기 따라쓰기 카드(`vocabulary-unit/lib/game-data-adapter.ts`, `isKo` 분기). vi/zh/th 는 아직 알파벳판 공용.

## 폴더 구조

```
features/phonics-learner/
  components/
    PhonicsLandingPage.tsx           # /library/phonics — 한글 카드만 active, 영어는 준비 중 음영 (2026-07-26)
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
  hooks/
    usePhonicsTtsWarm.ts          # 활동 진입 시 발음 프리워밍 (위 RULE)
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

## 🔴 영어 파닉스 = 준비 중 (2026-07-26)

랜딩(`PhonicsLandingPage`)의 영어 카드를 `<Link>` → **음영 `<div>`**(「준비 중」·「곧 만나요 🔒」)로 바꿔 진입을 닫았다. **라우트(`library/phonics/english/*`)와 Book 1~5 활동 코드는 전부 그대로** — URL 직접 입력으로는 들어가지므로 개발은 계속 가능하다. 다시 열 때는 그 카드를 `<Link to="/library/phonics/english">` 로 되돌리면 끝. 아래 영어 문서는 그때를 위해 보존한다.

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

## 글자쓰기 채점 = Paint mode (`LetterFillCanvas`, 2026-05-22)

**모든 쓰기 활동이 `LetterFillCanvas` (paint mode) 통일** — 한글/영어 동일 시스템. 자세한 시스템은 루트 CLAUDE.md "글자 쓰기 채점 시스템" 섹션.

영어 stroke library (`LetterTracingCanvas`) 시스템은 deprecated/keep — 학습자 활동에 통합 안 됨. 미래 자모 단위 학습 활동용으로 인프라 보관.

적용처 (영어 + 한글 모두 LetterFillCanvas):

- `LetterWriteModal` (AlphabetLetterLearnActivity 안 "Aa 써보기" 모달)
- `AlphabetLetterWriteActivity` (Book 1 ABC 써보기)
- `CvcPatternLearnActivity` Phase C (Book 2 CVC 단어 안 글자별 쓰기)
- `VowelWriteActivity` / `ConsonantWriteActivity` (한글 모음/자음)

threshold 0.95 통일 — `LINE_WIDTH=60` 두꺼운 펜이라 도달 쉬움. 폰트 fidelity 100%.

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

## unit 별 활동 plan — 한글 32 단원 전부 (2026-07-26)

`KOREAN_UNIT_ACTIVITY_PLAN[unitId]`. 한글1 은 명시 매핑, **한글2~4 는 `derivedPlans()` 가 커리큘럼에서 파생**한다 — 유닛 목록을 두 번 적지 않으므로 커리큘럼에 단원이 늘면 활동이 저절로 생긴다.

| 레벨              | 단원    | 학습 활동                                   | 생성                                       |
| ----------------- | ------- | ------------------------------------------- | ------------------------------------------ |
| 한글1 모음        | u01     | vowel-listen ×2 + vowel-write ×2            | `UNIT_01_PLAN`                             |
| 한글1 자음        | u02~u15 | consonant-tap + blend ×2 + write            | `CONSONANT_UNIT_MAP` + `makeConsonantPlan` |
| 한글2 받침        | 7       | consonant-tap(받침) + coda-blend ×2 + write | `makeCodaPlan`                             |
| 한글3 쌍자음      | 5       | 자음 단원과 동일                            | `makeConsonantPlan(phonemes[0])`           |
| 한글4 복잡한 모음 | 5       | vowel-listen + vowel-write (각 1장)         | `makeComplexVowelPlan(phonemes)`           |

게임 4종은 `withGames()` 가 모든 plan 뒤에 붙이고 `order` 를 매긴다. 가드 테스트 = `lib/korean-phonics-units.test.ts`.

### 🔴 받침은 글자와 소리가 다르다

`consonant-tap` / `consonant-write` 에 **`soundText?`** 를 준다. 받침 단원은 글자가 `ㅇ` 이어도 읽는 소리는 예시 음절 **`앙`**(`composeHangul('ㅇ','ㅏ',coda)`) 이다 — 받침은 홀로 소리 낼 수 없고, `ㅇ` 을 그대로 읽히면 초성 이응 소리가 난다. 미지정이면 글자를 그대로 읽어 기존 한글1 단원은 무변경.

### 🔴 `coda-blend-listen` 은 별도 컴포넌트가 아니다

`ConsonantBlendListenActivity` 가 두 모드를 겸한다 — 자음 모드 `[ㄱ]+[ㅏ]→[가]`, 받침 모드 `[가]+[ㅇ]→[강]`(초성 14개 × ㅏ, 7+7 두 장). **복사본을 만들지 말 것**: 이 컴포넌트의 TTS 체인(발음 끝 → 띵동 → 칭찬)이 반복 버그 지점이라 사본이 생기면 고칠 곳이 두 군데가 된다. 캐시 분리는 `identifierPrefix`(`coda-blend`).

### 🔊 듣고 고르기 (2026-07-26)

`word-listen-choose` — 단어 소리를 **먼저** 들려주고 그림 3장 중 고른다. `withGames()` 가 모든 학습 단원 plan 뒤(게임 앞)에 자동으로 붙인다.

- 🔴 **소리 변별을 확인하는 유일한 활동이다.** 나머지 학습 활동은 전부 _누르면 소리가 나는_ 탐색형이라 아이가 소리를 구별하는지 알 수 없었다(이퓨처 교재는 유닛 6쪽 중 절반이 이 형식).
- 🔴 **보기에 글자를 쓰지 않는다** — 아직 못 읽는 아이도 풀 수 있어야 한다. 문제도 큰 🔊 버튼 하나라 규칙이 그림으로 읽힌다. 문제가 바뀌면 자동으로 한 번 들려준다.
- 보기 3장 = 4~7세가 한눈에 훑는 한계. 오답은 **같은 단원의 다른 타겟 단어**(다른 단원 단어를 섞으면 난도가 아니라 운이 된다).
- 데이터 = `phonicsToWordChoices(sb)`(그림 있는 타겟 단어). 3개 미만이면 "단어 그림이 필요해요". 모음 단원은 단어가 없어 활동이 붙지 않는다.

### 🏅 복습 단원 (2026-07-26)

이퓨처 EFL Phonics 분석([docs/phonics-english/efl-phonics-analysis.md](../../../../../docs/phonics-english/efl-phonics-analysis.md))에서 가장 큰 갭이 **복습 층 부재**였다. 한글에 먼저 넣었고 배관은 영어와 공용이다.

- **묶음 규칙** — 레벨 안에서 4단원씩, 꼬리가 2 이하면 앞 묶음에 병합. 결과 7개(`kr-h1-r1~r3`, `kr-h2-r1~r2`, `kr-h3-r1`, `kr-h4-r1`). `getAllKoreanUnits()` 가 **그 묶음 마지막 단원 뒤에 끼워** 반환하므로 사이드바에 단원처럼 나온다.
- 🔴 **모음 단원(kr-h1-u01)은 묶음에서 제외** — 복습은 묶음의 글자를 카드로 한 번에 펼치는데 10장이 들어오면 4~7세 화면에서 카드가 손톱만해진다. 판정은 id 가 아니라 `phonemes.length <= 4`.
- 🔴 **사이드바 번호 대신 🏅** — 복습은 앞 단원과 같은 `unitIndexInLevel` 이라 번호를 쓰면 "5, 5" 로 보인다.
- **활동 3종** (`makeReviewPlan`) — 게임을 따로 붙이지 않는다(복습 자체가 놀이 형식).
  1. `review-listen` — **기존 `VowelListenActivity` 재사용**(순서 듣기 → 듣고 맞추기 퀴즈). `VowelItem.sound?` 를 추가해 받침 카드는 글자 `ㅇ`, 소리 `앙` 으로 읽힌다.
  2. `review-match` — **기존 `LineMatchingPlayer` 재사용**. `gameData.items[].word` 에 **글자**를 넣어 글자↔그림 매칭이 된다.
  3. `review-write` — `ReviewWriteActivity`(신규). 그림만 보여주고 첫 글자를 쓰게 하며, 3회 실패 시 힌트 글자를 띄운다.
- **자료 출처** = `useReviewCardSources` — 되짚는 단원들의 storybook 을 `useQueries` 로 병렬 로드(캐시 키가 학습 단원과 같아 이미 다녀왔으면 왕복 0)하고 단원당 대표 단어 1개를 뽑는다.
- 🔴 **대표 단어는 점수로 고른다**(`pickWord`): 첫 음절이 그 자리에 글자를 가지면 +3, 뒤 음절이면 +1, **첫 글자가 같은 화면 다른 카드와 겹치면 −4**. 이게 없으면 ㄹ 카드에 `오리` 가 붙는데(한국어엔 ㄹ로 시작하는 유아 단어가 없다) 같은 묶음에 ㅇ 카드가 있으면 **정답이 두 개로 보인다**. 받침 단원은 종성 자리로 채점한다(`matchPosition`).

### 한글2~4 게임 자산 현황

`phonicsConfig.targetWords` 는 32 단원 모두 있으나, **flashcard 이미지·keypoints 는 한글1 에만** 있다. 그래서 한글2~4 에서 그림 짝 찾기·낱말 그리기는 어댑터가 `null` 을 반환해 "단어 그림이 필요해요" 안내가 뜬다(정상). 한글 블록·낱말 쓰기는 텍스트만으로 동작. → 기획서 「🍎 타겟 단어 카드」 125장을 flashcard 에 붙이면 자동 복구.
