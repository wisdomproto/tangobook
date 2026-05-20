# 파닉스 학습자 모듈 (학습자 진입)

`/library/phonics` 진입점. 한글/영어 선택 → unit 그리드 → 활동 그리드 → 활동/게임 실행.

저작도구의 `features/phonics/` (=AlphabetCardTab 등 편집기) 와 **별개** 모듈. 이쪽은 학습자 학습 흐름.

## 🔴 RULE — TTS chain 절대 setTimeout 가정 X

모든 액티비티에서 TTS 끝난 후 칭찬/다음 카드/onComplete 이어질 때는 **반드시** `playAudio(url, onEnded)` 콜백 chain. `setTimeout(..., 1800)` 같은 단어 길이 가정은 다음절 한글 ("ㄱ ㄱ 거북이") 가 timeout 초과 시 다음 단계가 먼저 트리거되는 버그 원인. 이미 4 액티비티 전부 한 번에 fix 함 (2026-05-20). 새 액티비티 작성 시 [features/games/CLAUDE.md](../games/CLAUDE.md) 의 "TTS chain RULE" 섹션 참고.

## 폴더 구조

```
features/phonics-learner/
  components/
    PhonicsLandingPage.tsx        # /library/phonics — 한글/영어 카드 (호리 마스코트 일러스트)
    KoreanPhonicsStudyPage.tsx    # /library/phonics/korean(/:unitId)? — study layout (좌 커리큘럼 + 우 unit body)
    KoreanPhonicsUnitPage.tsx     # study layout 안에서 embedded 로 사용 (props: embedded?: boolean)
    KoreanPhonicsActivityPage.tsx # /library/phonics/korean/:unitId/:activityKey — 활동 호스트 (kind 별 분기)
  activities/
    VowelListenActivity.tsx       # 모음 듣기 (unit 1 활동 1/2)
    VowelWriteActivity.tsx        # 모음 쓰기 (unit 1 활동 3/4) — playAudio onEnded chain
    ConsonantTapActivity.tsx      # 자음 누르기 — 3 카드 × 3 탭. 단어 카드 X (단순화). 각 카드 띵동 + 마지막 칭찬
    ConsonantBlendListenActivity.tsx # 자음+모음 음절 — 6행 × 3셀. 다음 셀 하이라이트 + 행 완료 띵동
    ConsonantWriteActivity.tsx    # 자음 쓰기 — ㄱ 만 3번 따라쓰기 (단어 의존성 제거). per-write 띵동 + 마지막 칭찬
  lib/
    korean-phonics-units.ts       # unit 목록 + ActivityDef (subtitle 없음, 2026-05-20) + makeConsonantPlan(c) 으로 ㄴ~ㅎ 자동 생성
    progress-store.ts             # localStorage `phonics-progress` + `phonics-recent-unit` (study layout default)
    pick-word-cards.ts            # 사용 안 함 (ConsonantTap/Write 가 단어 제거로 의존성 없어짐)
    phonics-game-adapter.ts       # phonicsStorybook → KoreanBlock/WordWriting/LineMatching/ConnectDots data
```

## 라우트 (2026-05-20)

- `/library/phonics` — AppShell 안 (랜딩, PhonicsLandingPage)
- `/library/phonics/korean` — **AppShell 밖** (study layout, recent unit 으로 redirect)
- `/library/phonics/korean/:unitId` — **AppShell 밖** (study layout, 좌 커리큘럼 + 우 unit body)
- `/library/phonics/korean/:unitId/:activityKey` — **AppShell 밖** (활동 풀화면)

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

| kind                                                                                   | 컴포넌트                                                  | 데이터                               |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------ |
| `vowel-listen`                                                                         | VowelListenActivity                                       | `vowels: [{vowel,syllable}]`         |
| `vowel-write`                                                                          | VowelWriteActivity                                        | `vowels: [{vowel,syllable}]`         |
| `consonant-tap`                                                                        | ConsonantTapActivity                                      | `consonant: 'ㄱ'`                    |
| `consonant-blend-listen`                                                               | ConsonantBlendListenActivity                              | `consonant, blendVowels: ['ㅏ',...]` |
| `consonant-write`                                                                      | ConsonantWriteActivity                                    | `consonant`                          |
| `game-korean-block` / `game-word-writing` / `game-connect-dots` / `game-line-matching` | 기존 게임 플레이어 (`features/games/components/players/`) | `phonics-game-adapter` 가 빌드       |

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
