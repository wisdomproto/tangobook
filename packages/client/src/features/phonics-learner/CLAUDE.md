# 파닉스 학습자 모듈 (학습자 진입)

`/library/phonics` 진입점. 한글/영어 선택 → unit 그리드 → 활동 그리드 → 활동/게임 실행.

저작도구의 `features/phonics/` (=AlphabetCardTab 등 편집기) 와 **별개** 모듈. 이쪽은 학습자 학습 흐름.

## 🔴 RULE — 소리와 소리 사이엔 쉼 (2026-07-27)

콜백 체인만 걸면 앞 소리가 **끝나는 즉시** 다음이 시작된다 — 실측 간격 **1~3ms**. 아이 귀엔 세
소리가 한 덩어리로 들려서, 안내가 끝나기도 전에 문제가 지나간 것처럼 느껴진다. 이음매마다
**400~450ms** 쉰다: 안내→문제 · 단어→띵동 · 띵동→다음 문제 · 누른 소리→이어읽기.

🔴 아래 TTS chain 규칙과 **충돌하지 않는다** — 금지된 건 소리 **길이를 가정하는** setTimeout 이고,
이 쉼은 `onEnded` 로 끝난 걸 확인한 **뒤에** 넣는다. 타이머는 ref 에 담아 언마운트 때 정리할 것
(나가는 도중 예약된 소리가 빈 화면에서 울린다). 값: `REST_MS`(단어 연습 420) ·
`MERGE_REST_MS`(받침 합체 550) · 낱말쓰기 `REST_MS`(450).

## 🔴 RULE — TTS chain 절대 setTimeout 가정 X

모든 액티비티에서 TTS 끝난 후 칭찬/다음 카드/onComplete 이어질 때는 **반드시** `playAudio(url, onEnded)` 콜백 chain. `setTimeout(..., 1800)` 같은 단어 길이 가정은 다음절 한글 ("ㄱ ㄱ 거북이") 가 timeout 초과 시 다음 단계가 먼저 트리거되는 버그 원인. 이미 4 액티비티 전부 한 번에 fix 함 (2026-05-20). 새 액티비티 작성 시 [features/games/CLAUDE.md](../games/CLAUDE.md) 의 "TTS chain RULE" 섹션 참고.

## 🔴 RULE — 활동 진입 시 발음 프리워밍 (2026-07-25)

새 활동을 만들면 **그 활동이 쓸 텍스트를 `usePhonicsTtsWarm(unitId, texts, prefix)` 로 진입 시 데운다**(`hooks/usePhonicsTtsWarm.ts`). 안 하면 첫 탭이 **concat 왕복 804ms + mp3 620ms ≈ 1.4초 무음**(실측)이고 아이는 그 사이 카드를 다시 누른다.

- 뿌리는 `resolveTtsUrl`(`features/tts`) 이 **탭할 때마다 서버에 URL 을 다시 물었던 것** — 결과가 결정적인데도. 이제 **세션 캐시**(in-flight 공유, 실패는 캐시 안 함)라 데워둔 소리는 왕복 0. 게임·뷰어 등 모든 호출부가 함께 이득.
- 게임처럼 진행률 게이트를 세우지 **않는다** — 파닉스는 첫 소리까지 아이가 할 일(카드 보기)이 있어 게이트가 진입만 느려 보이게 한다.
- 배선 완료: 모음 듣기/쓰기 · 자음 누르기/쓰기 · 자음+모음. 실측 = 탭 시 네트워크 요청 0건.
- 🔴 **워밍은 순차로**(2026-07-27). 받침 익히기는 14짝 × 3텍스트 = 중복 제거해도 29건이다.
  병렬로 쏘면 아이가 가장 먼저 누르는 첫 글자가 스물몇 건 뒤에 줄을 선다. 호출부가 넘기는
  `[첫글자, 둘째글자, 이어읽기]` 순서가 곧 우선순위이므로 그 순서대로 하나씩 데운다.

## 활동 UI 규칙 (2026-07-25)

- **모음 카드 배치는 `flex` + `justify-center`** — `grid-cols-6` 이던 시절 모음이 4개인 단원(ㅜㅠㅡㅣ)에서 왼쪽 4칸만 차 쏠렸다. 개수와 무관하게 가운데여야 하고, 마지막 줄이 1장이어도 중앙에 온다. 카드 폭 `w-[28%] lg:w-36`.
- **퀴즈에서 맞춘 카드 = 민트 + ✓**(`solved` Set). 흰색 그대로면 몇 개 남았는지 안 보인다. 끝나면 전부 민트라 "다 맞췄다"가 그림으로 읽힌다.
- **같은 제목 카드 두 장을 나란히 두지 않는다** — 자음 단원의 `ㄱ + 모음 배우기` 두 개는 모음 묶음이 다른데 제목이 같았다. 모음 듣기 1/2 규칙대로 **번호를 붙인다**(`makeConsonantPlan`, 자음 15개 단원 일괄).
- **글자가 박힌 아이콘은 언어 자산이다** — `word-writing.webp` 는 연필이 알파벳 **A** 를 쓰는 그림이라 한글 단원엔 `word-writing-ko.webp`(연필이 `나무` 를 쓰는 그림, 512px webp 18KB)를 쓴다. 한글 경로 2곳 = 파닉스 단원 카드(`KoreanPhonicsUnitPage`) + 동화책 단어 익히기 따라쓰기 카드(`vocabulary-unit/lib/game-data-adapter.ts`, `isKo` 분기). vi/zh/th 는 아직 알파벳판 공용.

## 폴더 구조

```
features/phonics-learner/
  components/
    PhonicsLandingPage.tsx           # /library/phonics — 한글·영어 카드 둘 다 진입 가능
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

- `consonant-tap` → `${consonant} 배우기` (이전 `${consonant} 누르기`). **세 번 다 누르면 글자가 빠지고 타겟 단어 그림이 카드를 꽉 채운다**(무작위 배정, 2026-07-26) — 세 번째 탭에서 그 낱말을 읽는다(`ㄱ ㄱ 고기` 리듬 그대로). 🔴 **글자·그림·낱말을 한 카드에 같이 두지 않는다** — 셋을 욱여넣으니 지저분하고(사용자: "디자인 진짜 구리다") 375px 카드는 104px 뿐이라 `flex-1` 인 그림이 0px 로 눌렸다. 상태로 갈라 **누르는 동안 글자 / 다 누르면 그림**.
- `consonant-blend-listen` → `${consonant}+모음` **한 장으로 통합**(2026-07-26, 1·2 로 나뉘어 있던 걸 합침. 모음 두 묶음이 ㅗ·ㅛ 를 공유해 중복이 있었어서 **기본 모음 10개로 정리**). 익히기 카드가 5→4장이 되어 화면도 편해졌다.
  - 🔴 **한 번에 한 짝만, 두 글자가 가까워지다 합쳐진다** — 예전엔 `[ㄱ][ㅏ][가]` 3칸 행을 6~7줄 깔았는데 그러면 배우는 게 "칸을 순서대로 누른다"였다. ① 멀리 떨어진 ㄱ·ㅏ 중 **반짝이는 쪽을 탭**(각 소리) → ② 가까워진 상태로 같은 2탭 → ③ **탭 없이** 붙으며 `ㄱ ㅏ 가` 이어 읽기 + 띵동. 합체는 누르는 게 아니라 **일어나는 일**이다.
  - **위쪽에 만들 음절 목록**(가·갸·거…) — 완료한 건 민트+✓, 지금 것은 코랄. **아무거나 눌러 그것부터** 할 수 있고, 하나 끝나면 `idx+1` 이 아니라 **아직 안 만든 다음 음절**로 간다(건너뛰며 골랐을 수 있다). 진행 점은 같은 정보라 없앴다.
  - 받침 모드(`coda-blend-listen`)도 같은 컴포넌트라 함께 바뀐다 — `[가]+[ㅇ]→[강]`, 온셋 7개씩 두 장 유지.
  - 🔴 **간격은 Tailwind 클래스가 아니라 인라인 `min()`** — `gap-[18vw] sm:gap-56` 처럼 두 겹으로 쓰면 브레이크포인트마다 어느 쪽이 이겼는지 확인해야 한다.
  - ⚠️ 뷰포트를 리사이즈하면 `transition` 이 이전 값에서 얼어붙어 측정이 틀리게 나온다 — **모바일 확인은 그 크기로 새로고침한 뒤** 잴 것.
- `consonant-write` → `${consonant} 써보기`. **음절 만들기와 같은 흐름을 손으로**(2026-07-26) — 멀리 떨어진 `ㄱ`·`ㅏ` 를 차례로 쓰고, 가까워진 상태로 한 번 더 쓰면 자동으로 붙으며 `ㄱ ㅏ 가` 를 읽는다.
  - 🔴 **음절 3개만**(무작위) — 음절 만들기는 탭이라 10개가 1분이지만 쓰기는 10개면 40번을 쓰게 된다.
  - 🔴 **지금 쓸 칸만 캔버스**, 옆은 글자 판이다. 두 캔버스를 동시에 띄우면 375px 에서 한 칸이 140px 밑으로 내려가 쓸 수가 없다.
  - 🔴 대기 칸에 **`shrink-0` 필수** — 없으면 캔버스가 자리를 먹으며 눌려 정사각이 깨진다(375px 에서 65×98로 찌그러졌다).
  - 짝 만들기는 `lib/blend-pairs.ts` 를 음절 만들기와 **공유**한다(받침 중성 ㅏ 고정 같은 규칙이 갈라지지 않게).
- `word-listen-choose` → **`단어 연습`**(2026-07-26 개명). 들어오면 먼저 **탐색**(그림+낱말 4장, 누르면 소리) → 「🎯 퀴즈」 버튼으로 듣고 맞추기. 🔴 예전엔 들어오자마자 문제였다 — 처음 보는 낱말을 소리만 듣고 고르라는 셈이라 먼저 만져보는 화면이 있어야 퀴즈가 "확인"이 된다. 복습의 듣기 2종은 되짚는 자리라 `exploreFirst` 없이 바로 퀴즈다.
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

한글 발음은 `resolveTtsUrl`(`features/tts`) 의 한글 정책. storybookId = unit ID (kr-hN-uMM) 로 캐시 분리.

🔴 **낱 음절은 라이브러리 mp3 직행, 이어읽기만 concat** (2026-07-27). `가`·`강`·`으`·`ㄱ` 은 R2
`mod_korean` 에 **이미 개별 mp3 가 있다**(3232 음절 + 자모 40). 예전엔 이것마저 서버에
`POST /api/phonics-library/concat` 을 보내 "한 글자를 합쳐" 달라고 해서 첫 탭이 늦었다 —
**동화책 게임은 `usePhonicsMap` 으로 진작 푼 문제인데 학습 활동만 그 경로에서 빠져 있었다**
(라이브러리 캐시가 비어 있던 게 증거: 게임을 한 번도 안 돌리면 채워지지도 않았다).
이제 `resolveTtsUrl` 이 **공백 없는 텍스트면 `getKoreanSyllableUrl`**(usePhonicsMap 의 모듈 레벨
조회, localStorage 캐시·목록 fetch 를 훅과 공유)로 R2 URL 을 바로 준다. 실측: concat 요청 0건,
탭→소리 27ms. 진입 워밍 29건 중 28건이 서버 왕복에서 사라져 **서버 부하도 같이** 줄었다.

자음+단어 시퀀스는 공백을 0.3s 무음으로 — 예: `"ㄱ ㄱ 고기"` → ㄱ → 0.3s → ㄱ → 0.3s → 고기.
이 **공백 있는 텍스트만** concat 이 필요하다.

🔴 **받침은 화면 글자와 읽는 소리가 다르다** — `BlendPair.secondSound`(`lib/blend-pairs.ts`).
`ㅇ` 을 그대로 읽히면 음원이 없어 **무음**이라, ㅡ 를 붙인 형태(ㅇ→으·ㄱ→그·ㄴ→느)로 읽는다.
프리워밍 목록도 반드시 `secondSound` 로 — 화면 글자를 데우면 정작 재생하는 소리는 안 데워진다.

## 진척

`localStorage["phonics-progress"]` = `{ korean: { [unitId]: { completedActivities: string[] } } }`.

- 액티비티 잠금 **없음** — 사용자가 자유롭게 진입.
- 단원 잠금 **없음** — `plan.activities.length > 0` 인 단원은 모두 클릭 가능 (활동 plan 없는 단원만 "활동 준비 중" 음영).
- 완료 표시는 ✓ 뱃지로만.
- VowelListenActivity 의 퀴즈 완료는 `onMarkComplete` 콜백 — 진척만 마킹하고 **자동 back X**, "🔁 다시 해보기" + "← 돌아가기" 버튼 노출. 다른 활동은 기존 `onComplete` (마킹 + 자동 back).

## 디자인 (2026-05-20 패스)

- **카드** ([KoreanPhonicsUnitPage:ActivityCard](components/KoreanPhonicsUnitPage.tsx)): `aspect-square rounded-[28px] border-[5px]` + 그리드 `2 / sm:3 / md:2 / lg:4 / xl:5`. 🔴 **익히기·게임하기가 한 화면에 같이 보여야 한다** — 자음 단원은 익히기가 5장이라 4열이면 두 줄이 되고 게임하기가 화면 밖으로 밀린다.
  - 🔴 **열 수는 뷰포트가 아니라 남는 폭으로 정한다** — md 부터 사이드바가 256px 를 먹어 834px 화면의 콘텐츠 폭은 486px 뿐이다. 그래서 sm(3열)보다 **md 가 더 적은 2열**이다. 실측 콘텐츠 폭 768→420 · 834→486 · 1024→676 · 1280→934 · 1512→1109.
  - 🔴 **카드 안 그림에 고정 크기를 주지 않는다** — 정사각 카드는 높이가 빠듯해서 `h-28` 짜리 그림이 컨테이너를 넘어 **제목 위에 겹친다**. 그런데 흐름 안에서 `max-h-full` 을 주면 부모가 `flex-1`(basis 0)이라 퍼센트가 **0 으로 풀린다**(834px 에서 그림이 사라졌다). → `absolute inset-0 m-auto max-h-full`.
  - 🔴 **이모지 폴백은 글꼴 크기라 못 묶는다** — 가장 좁은 카드(148px)에 들어가는 `text-5xl sm:text-6xl` 로 고정. 72px 이던 시절 174px 카드에서 제목을 3px 침범했다. (복습의 🎧🔊 두 활동만 아직 아이콘 webp 가 없어 이 경로를 탄다.)
  - 🔴 **겹침은 `scrollHeight` 로 안 잡힌다** — 검수는 그림 사각형과 제목 사각형의 **교차**로 해야 한다(`art.bottom > title.top`). 넘침만 재다가 사용자가 스크린샷으로 잡아냈다.
- **섹션 panel**: 익히기/게임하기 각각 `rounded-[32px]` panel wrap. 익히기 = peach 톤 (`from-peach-100/80 via-peach-50/70 to-cream-50/60 border-peach-200/70`), 게임 = mint 톤. 헤더 chip 은 panel `-top-5 left-5` floating peg (coral / mint 그라데이션 + 흰 3px 테두리). panel `pt-10 sm:pt-12` 로 카드와 헤더 분리.
- **사이드바 (StudyPage aside)**: 레벨별 접기/펴기 (`expandedLevels: Set<levelKey>`). 기본 = 현재 unit 의 레벨만 펼침, 다른 unit 클릭 시 그 레벨 자동 펼침 (useEffect). 헤더 = text-lg/xl + text-ink-900 + `playable/total` 카운트. 활성 unit = coral 그라데이션 + ring-2 흰색 + scale-[1.02] + shadow-pop.
- **배경**: `/images/phonics/study-bg.webp` (1672×941, 44KB) — 풀밭·꽃·구름 톤. StudyPage 전체 backdrop.
- **mint 디자인 토큰 추가** (`design-system/tokens/colors.ts`): mint 50/100/200/300/400/500/600 + peach 50 추가. Tailwind JIT 가 새 토큰 발견하려면 client 서버 재시작.

## 영어 파닉스 = 공개 (2026-07-26 재개방)

랜딩(`PhonicsLandingPage`)의 영어 카드가 다시 `<Link to="/library/phonics/english">` 다. 같은 날 「준비 중」 음영으로 닫았다가 테스트를 위해 되돌렸다 — **닫는 것도 여는 것도 그 카드 한 곳**이고, 라우트(`library/phonics/english/*`)와 Book 1~5 활동 코드는 닫혀 있는 동안에도 전부 살아 있었다.

## 🏅 영어 복습 (2026-07-26) — 한글과 규칙이 다르다

`en-b1-r1~r4`, `en-b2-r1~r4` (8개). 가드 = `lib/english-phonics-units.test.ts`.

- 🔴 **묶음이 2단원**(한글은 4). 영어는 한 단원이 글자·패턴을 3~4개씩 안고 있어 4단원을 묶으면 카드가 12~14장 깔린다. 2단원이면 5~8장으로 한글과 비슷한 밀도.
- 🔴 **Book 1·2 에만** 만든다(`reviewableLevels`). Book 3~5 는 학습 활동 자체가 없어 복습만 생기면 빈 껍데기가 된다.
- 🔴 **활동 2종뿐 — 짝 찾기 없음.** 영어는 flashcard 이미지가 0장이라 짝 찾기를 넣어봐야 "단어 그림이 필요해요" 로 끝난다. 그림이 생기면 그때 추가.
- **쓰기는 그림 대신 소리가 문제** — `ReviewWriteActivity` 가 `imageUrl` 없으면 🔊 버튼을 띄우고 카드가 바뀔 때 자동 재생한다. 자산 때문에 택한 형태지만 파닉스로는 오히려 정공법.
- 카드 = Book 1 `{letter:'A', syllable:'a'}`(대/소문자 쌍) · Book 2 `{letter:'an'}`(VC 패턴). `matchPosition` 은 한글 전용 필드라 `'cho'` 로 채우고 안 쓴다.
- 🔴 **진행 점 key 는 `unitId` 만으로 부족하다** — 영어는 한 단원이 카드를 3~4장 내서 중복 key 경고가 났다(한글은 단원당 1장이라 안 드러났다). `${unitId}-${letter}`.

## 영어 파닉스 — Book 1 Single Letter Sounds (2026-05-22)

영어 Book 1 (Aa·Bb·Cc … Zz) 8 unit 모두 plan 자동 등록 — `BOOK1_LETTERS` (`english-phonics-units.ts`) + `makeBook1UnitPlan(letters)` 가 글자별 1 활동 + 마지막 ABC 쓰기 + 게임 4종 생성.

활동 종류 2개 신규:

- **`alphabet-letter-learn`** ([AlphabetLetterLearnActivity](activities/AlphabetLetterLearnActivity.tsx)) — 한 글자 학습카드 풀화면. 큰 일러스트(저작도구 illustrationUrl) + 저작도구 hotspots. 핫스팟 클릭 → 그 단어 ttsUrl 재생 (multi-hotspot 지원, `getWordHotspots` 헬퍼).
  - 🔴 **순서 스포트라이트**(2026-07-27). 예전엔 안내 문구가 **아예 없어** 아이가 그림만 보다 나갔다. 이제 「🔊 반짝이는 곳을 눌러봐! n/N」 안내 + **지금 누를 핫스팟 한 곳만 밝히고 나머지는 덮는다**(구현은 거대 `box-shadow` spread 한 장 — 구멍 뚫린 오버레이를 따로 만들지 않는다). 순서 단계엔 그 칸만 받고(다른 데를 눌러도 아무 일 없음 — 틀렸다고 혼내지 않는다), 다 누르면 덮개가 걷히고 아무거나 다시 눌러 들을 수 있다.
  - 🔴 **탭음 → 단어 → 띵동** 순서. 탭 순간 `playUi('tap')`, 단어를 **다 읽은 뒤** 띵동(한 채널이라 동시에 내면 앞소리가 잘린다).
  - 🔴 **써보기 버튼은 다 눌러본 뒤에 나온다** — 소리를 듣기도 전에 쓰기 버튼이 있으면 아이가 그리로 먼저 간다. (핫스팟 없는 글자는 처음부터 보인다.)
  - 진척 마킹 없음 — 자유 탐색 (영어 모르는 4-5세 입문자). 자동 재생 X, ← 돌아가기만으로 종료.
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

| 레벨              | 단원    | 학습 활동                            | 생성                                       |
| ----------------- | ------- | ------------------------------------ | ------------------------------------------ |
| 한글1 모음        | u01     | vowel-listen ×2 + vowel-write ×2     | `UNIT_01_PLAN`                             |
| 한글1 자음        | u02~u15 | consonant-tap + blend + write        | `CONSONANT_UNIT_MAP` + `makeConsonantPlan` |
| 한글2 받침        | 7       | **coda-blend + write** (배우기 없음) | `makeCodaPlan`                             |
| 한글3 쌍자음      | 5       | 자음 단원과 동일                     | `makeConsonantPlan(phonemes[0])`           |
| 한글4 복잡한 모음 | 5       | vowel-listen + vowel-write (각 1장)  | `makeComplexVowelPlan(phonemes)`           |

게임 4종은 `withGames()` 가 모든 plan 뒤에 붙이고 `order` 를 매긴다. 가드 테스트 = `lib/korean-phonics-units.test.ts`.

### 🔴 받침 단원 구성 (2026-07-27 정리)

**익히기 = 붙이기 1장 + 쓰기 1장**. 「배우기」(`consonant-tap`)는 **넣지 않는다** — 받침 `ㅇ` 을
눌러 낼 소리가 없어 예시 음절 '앙' 을 읽어주는데, 아이 눈엔 `ㅇ` 을 눌렀더니 '앙' 이 나오는 셈이라
글자와 소리가 어긋나 보인다. 받침의 소리는 **붙는 순간**에만 생기므로 붙이기가 그 역할을 맡는다.
(쓰기는 남고, 거기서만 `soundText`=예시 음절 `앙` 을 쓴다.)

- **초성 14개 한 장**으로 통합(7+7 두 장 → 하나). 활동이 한 번에 한 짝만 보여주고 위 목록에서
  골라 만드는 구조라 카드를 나눌 이유가 없다. 자음 `ㄱ+모음 1/2` 통합과 같은 이유.
- **받침 쓰기 = 받침만 쓴다.** 앞 음절(`가`)은 **주어진 판**으로 위에 두고 아래 받침 칸만 캔버스다.
  이 단원이 가르치는 건 받침이라 `가` 까지 쓰게 하면 초점이 흐려진다. 그래서 자음처럼
  [멀리·가까이] 두 번 쓰지 않고 **한 번**이다. 대신 14개를 다 돌아도 금방이라 무작위로 줄이지 않는다.
  🔴 두 칸의 **폭을 같게** 묶어야 한다(`CODA_TILE`) — 캔버스 자체 `max-w-sm`(384px)을 그냥 두면
  주어진 판(176px)의 두 배가 되어 위아래가 한 글자로 안 보인다.
- 정답음은 합쳐진 음절만이 아니라 **이어읽기**(`나 · 으 · 낭`) — 받침이 어떻게 붙어 그 소리가
  됐는지가 들려야 한다.

### 🔴 `coda-blend-listen` 은 별도 컴포넌트가 아니다

`ConsonantBlendListenActivity` 가 두 모드를 겸한다 — 자음 모드 `[ㄱ]+[ㅏ]→[가]`, 받침 모드 `[가]+[ㅇ]→[강]`(초성 14개 × ㅏ, 한 장). **복사본을 만들지 말 것**: 이 컴포넌트의 TTS 체인(발음 끝 → 띵동 → 칭찬)이 반복 버그 지점이라 사본이 생기면 고칠 곳이 두 군데가 된다. 캐시 분리는 `identifierPrefix`(`coda-blend`).

- 🔴 **받침은 위·아래로 모인다** — 한글에서 받침은 옆이 아니라 아래에 붙는다(아+ㅇ=앙). 가로로
  모으면 글자가 합쳐지는 방향을 거꾸로 가르치는 셈이다. 간격도 **높이 기준**(`CODA_GAPS`, vh) —
  가로 값(18vw)을 그대로 쓰면 화면 밖으로 나간다.
- 🔴 **마지막 라운드에서도 누른 글자를 읽는다.** 예전엔 곧장 이어읽기로 넘어가 1라운드에선 나던
  `으` 가 2라운드에선 아예 안 났다(누르고 아무 반응 없음). 순서 = [누른 소리] → 쉼(`MERGE_REST_MS`)
  → [이어읽기]. 쉼은 **소리가 끝난 뒤** 넣는 것이라 길이를 가정하는 게 아니다(낱말쓰기 `REST_MS` 패턴).

### 🔊 듣고 고르기 (2026-07-26)

`word-listen-choose` — 단어 소리를 **먼저** 들려주고 그림 3장 중 고른다. `withGames()` 가 모든 학습 단원 plan 뒤(게임 앞)에 자동으로 붙인다.

- 🔴 **소리 변별을 확인하는 유일한 활동이다.** 나머지 학습 활동은 전부 _누르면 소리가 나는_ 탐색형이라 아이가 소리를 구별하는지 알 수 없었다(이퓨처 교재는 유닛 6쪽 중 절반이 이 형식).
- 🔴 **보기에 단어 글자를 반드시 쓴다.** 처음엔 "못 읽는 아이도 풀 수 있게" 그림만 뒀는데 **파닉스의 학습 목표가 소리↔글자 연결**이라 글자를 빼면 "소리 듣고 사물 찾기"가 되어 버린다(사용자 지적으로 바로잡음). 문제 쪽엔 **오늘의 글자**를 함께 띄우되 **정답 단어는 쓰지 않는다** — 쓰면 듣지 않고 글자만 맞춰버린다. 문제가 바뀌면 자동으로 한 번 들려준다.
- 🔴 **영어 Book 1(알파벳)만 예외 — 보기가 알파벳 글자뿐이다**(그림도 단어 철자도 없음). 그 권의 학습 목표가 글자 자체고, `apple` 철자를 읽는 건 아직 못 하는 일이다. 컴포넌트는 `items[].imageUrl` 유무로 갈린다 — 있으면 그림+단어, 없으면 글자만 크게.
- 🔴 **탐색 → 퀴즈, 같은 판을 쓴다**(2026-07-27). 들어오면 먼저 **2×2 카드 4장**을 눌러 소리를
  들어보고, 「🎯 퀴즈 / 듣고 맞춰보기」 버튼으로 넘어간다. 퀴즈는 **같은 격자·같은 크기·같은 자리**
  이고 문제와 클릭 동작만 바뀐다 — 예전엔 퀴즈가 보기를 따로 3장 뽑아 격자가 통째로 바뀌어,
  버튼 하나 눌렀는데 딴 화면으로 간 것처럼 보였다. 자리는 퀴즈 시작 때 한 번만 섞어 문제마다 안 튄다.
- 🔴 **카드 수 기본 4** — 2×2 격자라 4가 맞고 단원 타겟 단어도 보통 4개다. 3으로 두면 마지막
  단어 하나가 통째로 안 나온다(받침 단원 `시장` 이 그랬다). 오답은 **같은 단원의 다른 타겟 단어**
  (다른 단원 단어를 섞으면 난도가 아니라 운이 된다).
- 한글/영어 공용 — `language` prop 으로 TTS·칭찬 언어가 갈린다. 영어 Book 1 은 `letters` 를 그대로 보기로 쓰므로 **그림 자산이 없어도 지금 동작한다**.
- 데이터 = `phonicsToWordChoices(sb)`(그림 있는 타겟 단어). 3개 미만이면 "단어 그림이 필요해요". 모음 단원은 단어가 없어 활동이 붙지 않는다. (2026-07-26 카드 연동으로 **전 단원 그림이 찼다** — 아래 「단어 삽화」 참조.)

### 🏅 복습 단원 (2026-07-26)

이퓨처 EFL Phonics 분석([docs/phonics-english/efl-phonics-analysis.md](../../../../../docs/phonics-english/efl-phonics-analysis.md))에서 가장 큰 갭이 **복습 층 부재**였다. 한글에 먼저 넣었고 배관은 영어와 공용이다.

- **묶음 규칙** — 레벨 안에서 4단원씩, 꼬리가 2 이하면 앞 묶음에 병합. 결과 7개(`kr-h1-r1~r3`, `kr-h2-r1~r2`, `kr-h3-r1`, `kr-h4-r1`). `getAllKoreanUnits()` 가 **그 묶음 마지막 단원 뒤에 끼워** 반환하므로 사이드바에 단원처럼 나온다.
- 🔴 **모음 단원(kr-h1-u01)은 묶음에서 제외** — 복습은 묶음의 글자를 카드로 한 번에 펼치는데 10장이 들어오면 4~7세 화면에서 카드가 손톱만해진다. 판정은 id 가 아니라 `phonemes.length <= 4`.
- 🔴 **사이드바 번호 대신 🏅** — 복습은 앞 단원과 같은 `unitIndexInLevel` 이라 번호를 쓰면 "5, 5" 로 보인다.
- 🔴 **복습은 게임만 넣는다. 익히기 금지.** 처음엔 「다시 듣기」를 첫 활동으로 뒀는데 그게 학습 단원 듣기와 **같은 컴포넌트·같은 그림**이라 복습 전체가 유닛 축약판으로 보였다(사용자: "너무 심심하다"). 지금은 **형식이 전부 다르다** — 길 따라가기(`review-maze`) / 기억해서 맞추기(`review-flip`) / 듣고 고르기(`review-syllable-listen`·`review-word-listen`) / 알아보고 잇기(`review-match`) / 손으로 쓰기(`review-write`).
- **🌀 길 따라가기** — 격자 위 길을 밟으며 만나는 사물의 글자를 줍는다. 🔴 **진짜 미로가 아니다**: 막다른 길 없음, 다음 칸만 반짝임, 틀린 칸은 무반응(벌 없음). 4~7세의 과제는 "길 찾기"가 아니라 "다음 칸 밟기".
- **🎴 뒤집기 짝 맞추기** — 덮인 8장에서 **[낱말]↔[그림]** 짝 찾기(4쌍). 🔴 글자 면은 **음소(ㄱ)가 아니라 낱말(고기)**(2026-07-26) — 음소만 덜렁 있으면 무엇의 짝인지 떠올릴 실마리가 없다. 모은 글자 칩이 음소를 맡으므로 파닉스는 유지된다. 그림↔그림이면 순수 기억력 게임이 되므로 파닉스가 아니다. 오답 시 900ms 잠금 후 다시 덮임. ⚠️ **브라우저 자동화로 검증하기 어렵다**(잠금 구간과 스크립트가 레이스) → 컴포넌트 테스트 `ReviewFlipMatchActivity.test.tsx` 로 매칭 경로를 잡아둔다.
- **🎧🔊 듣기 2종** (2026-07-26) — `review-syllable-listen`(음절 소리 → 글자 4개 중), `review-word-listen`(단어 소리 → **낱말 글자** 4개 중). 둘 다 **`WordListenChooseActivity` 재사용**, 신설한 건 `choices` prop 하나뿐(기본 3 → 복습 4: 보기가 그림이 아니라 글자라 눈이 덜 바쁘다).
  - 🔴 **듣기 둘을 나란히 두지 않는다** — 화면이 같아서(🔊 + 보기 4개) 연달아 나오면 한 활동을 두 번 하는 걸로 느낀다. 순서에 눈으로 보는 활동을 사이에 끼운다.
  - 🔴 음절 듣기는 `reviewCards` 만으로 돌아 **storybook 을 안 기다린다**. 받침 카드는 글자 `ㅇ` 이 아니라 음절 `앙` 을 보기로 쓴다(글자만 두면 넷 다 같아 보인다).
  - 🔴 단어 듣기 보기에 **그림을 넣지 않는다** — 넣으면 학습 단원의 「듣고 고르기」(소리→그림)와 같은 활동이 된다. 복습은 소리→**글자** 방향이다.
  - 🔴 보기 글자 크기는 **라벨 길이로 분기** — 375px 에서 카드가 92px 인데 3글자를 72px 로 두면 폭이 124px 라 접혀서 `overflow-hidden` 에 잘린다(코코아·꼬끼오·스웨터). 3글자 이상은 `text-2xl sm:text-4xl`.
- 🔴 **복습 그림 칸은 크게 + 낱말을 아래에** (2026-07-26) — 삽화가 애매한 게 많아 그림만으로는 무엇인지 못 알아본다(곰인형=`나`, 오리=`ㄹ`). 미로·뒤집기·그림 짝 찾기 세 곳에 낱말을 칸 **아래**에 붙였다.
  - 🔴 **칸 크기는 `min(vw, vh)`** — 전체화면 활동이라 큰 화면에선 높이가 남고 작은 화면에선 높이가 먼저 모자란다. vw 만 보던 뒤집기가 1370px 화면에서 카드 112px 이었다(→194px).
  - 🔴 **낱말 줄은 항상 자리를 차지한다** — 뒤집을 때만 생기면 격자가 통째로 흔들린다. 빈 문자열로 높이만 유지.
  - 🔴 그림 짝 찾기는 **공용 `LineMatchingPlayer`** 라 데이터로 켠다 — `LineMatchingItem.imageLabel` 이 있을 때만 렌더. 동화책 어휘 게임은 안 넘기므로 무변경.
  - ⚠️ **글자 쓰기(`review-write`)에는 붙이지 않았다** — 거기선 그림 보고 첫 글자를 쓰는 게 과제라 낱말이 정답을 그대로 준다.
  - ℹ️ ㄹ 처럼 **첫소리 단어가 없는 글자**(두음법칙)는 둘째 음절 매칭을 그대로 쓴다 — 사용자 확인(2026-07-26). 곰인형=`나` 도 "자기를 가리키는 모습"이라 의도된 삽화다.
- **활동 목록** (`makeReviewPlan`) — 전부 `section: 'play'`. 길찾기 → 뒤집기 → 🎧음절 듣기 → 짝 찾기 → 🔊단어 듣기 → 쓰기.
  - `review-listen` — **기존 `VowelListenActivity` 재사용**(순서 듣기 → 듣고 맞추기 퀴즈). `VowelItem.sound?` 를 추가해 받침 카드는 글자 `ㅇ`, 소리 `앙` 으로 읽힌다. (지금 plan 에는 안 들어간다 — 위 "익히기 금지" 참조. 컴포넌트 배선은 보존.)
  - `review-match` — **기존 `LineMatchingPlayer` 재사용**. `gameData.items[].word` 에 **글자**를 넣어 글자↔그림 매칭이 된다.
  - `review-write` — `ReviewWriteActivity`(신규). 그림만 보여주고 첫 글자를 쓰게 하며, 3회 실패 시 힌트 글자를 띄운다.
- **자료 출처** = `useReviewCardSources` — 되짚는 단원들의 storybook 을 `useQueries` 로 병렬 로드(캐시 키가 학습 단원과 같아 이미 다녀왔으면 왕복 0)하고 단원당 대표 단어 1개를 뽑는다.
- 🔴 **대표 단어는 점수로 고른다**(`pickWord`): 첫 음절이 그 자리에 글자를 가지면 +3, 뒤 음절이면 +1, **첫 글자가 같은 화면 다른 카드와 겹치면 −4**. 이게 없으면 ㄹ 카드에 `오리` 가 붙는데(한국어엔 ㄹ로 시작하는 유아 단어가 없다) 같은 묶음에 ㅇ 카드가 있으면 **정답이 두 개로 보인다**. 받침 단원은 종성 자리로 채점한다(`matchPosition`).

### 단어 삽화 = 기획서 카드 연동 (2026-07-26)

32 단원 **128 타겟 단어 전부 flashcard 이미지 보유**. 한글 나무 기획서(`hangeul-tree-plan.html`) 「🍎 타겟 단어 카드」에 붙여넣은 124장을 `link-hangeul-tree-word-cards.mjs` 가 연동했다(h1-u01 4장은 기존 삽화 유지). → 그림 짝 찾기 32 단원 전부 동작.

- 🔴 **원본을 그대로 물리지 않는다** — 붙여넣기 원본은 장당 1~4MB(총 212MB)라 게임 한 판(4장)이 7MB 다. 스크립트가 기존 파닉스 삽화와 같은 **w800 webp(평균 60KB)** 로 구워 `phonics-word-cards/` 에 올리고 그 URL 을 물린다. 키에 원본 해시가 들어가 **재붙여넣기 → 새 URL**(immutable 캐시 안전), 안 바뀌면 업로드 skip.
- 매칭 기준은 flashcard 가 아니라 **`targetWords`** — 게임 어댑터가 그걸 돌기 때문. targetWords 에 있는데 카드가 없던 단어는 스크립트가 최소 카드를 만든다(h4-u02 시계·얘기가 그랬다).
- 한글↔로마자 매핑 SSOT = 기획서 HTML 의 `UNITS` 배열(스크립트가 파싱). 새 유닛은 기획서에만 추가하면 된다.
- **`낱말 그리기`(connect-dots) = keypoints 자동 추출**(2026-07-26, `extract-word-card-keypoints.mjs`) — 127/128 단어, **32 단원 전부 가능**. 손으로 점 찍지 않는다.
  - 이 게임은 2026-05-25 부터 "점 순서대로 잇기"가 아니라 **폴리곤 안 색칠**이라, 필요한 건 정확한 점 순서가 아니라 윤곽을 따라가는 폐곡선 하나다.
  - 🔴 **분할은 손으로 짜지 말고 `rembg`(BiRefNet)에 맡긴다.** 픽셀 임계 → 밝기 비대칭 → 결(local std) → 모서리 보정 → 테두리 물 채우기까지 **네 번 갈아엎었고 매번 다른 카드가 깨졌다**. 크림 배경 위의 흰 사물·작가가 그린 옅은 그림자·카드마다 다른 비네팅이 전부 "배경에서 조금 떨어진 값"이라 규칙으로 안 갈린다. 배경 제거는 이미 풀린 문제고 전용 모델이 한 번에 낸다 — 128장 실패 0.
    - 준비 = `pip install "rembg[cpu,cli]"` (모델 973MB 최초 1회). 배치 = `scripts/_rembg_masks.py`(세션 1회 재사용, 장당 ~7초).
    - ⚠️ rembg 가 시스템 pillow 를 12.x 로 올린다 — `moviepy`·`surya-ocr` 과 충돌하면 venv 로 격리할 것.
  - 🔴 **알파는 낮게(24) 자르고 1px 부풀린다** — 높게 자르면 폴리곤이 물체 안쪽 2~4px 에 들어가 앉는다.
  - 🔴 **폴리곤 = 윤곽의 Douglas–Peucker 단순화**. 볼록 껍질도 호 길이 리샘플도 안 된다 — 껍질은 공과 배트 사이 빈 삼각형을 삼키고 하나짜리 사물도 사방으로 붕 뜬다(사용자 지적 2회), 리샘플은 점을 돌기 끝에 앉혀 스파이크를 만든다. DP 는 편차가 eps 로 묶여 둘 다 없다.
  - 🔴 **큰 덩어리는 여러 개 남긴다**(최대 대비 25% 이상) — 하나만 남기면 주인공이 둘인 카드(얘기의 곰+토끼, 눈의 두 눈)에서 한쪽이 폴리곤 밖으로 나간다. 가까운 덩어리는 닫힘으로 잇는다(공+배트, 의자+서랍장).
  - 🔴 **눈으로 확인하고 넘길 것**: `--preview` 가 폴리곤을 얹은 480px PNG 를 뽑는다. **160px 콘택트 시트로 훑지 말 것** — 그 크기에선 김이 딸려 들어간 고기 카드를 놓친다(실제로 놓쳐서 사용자가 잡아냈다). 합격선은 "안 잘리면 됨"이 아니라 **"윤곽에 붙었나"**.
