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
    korean-phonics-units.ts       # unit 목록 + ActivityDef + makeConsonantPlan(c) 으로 ㄴ~ㅎ 자동 생성
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

`makeConsonantPlan(consonant)` — 한글1 u02 (ㄱ) ~ u15 (ㅎ) 13개 자음 단원 모두 동일한 4 learn + 4 game 패턴. 자음만 다르게. subtitle 은 `syllablesFor(c, vowels)` 로 `composeHangul` 자동 ("나 냐 너 녀 노 뇨" 등). 컴포넌트 100% 재사용 — 새 자음 추가 시 `CONSONANT_UNIT_MAP` 에 항목만 추가.

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
