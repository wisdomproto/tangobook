# 파닉스 학습자 모듈 (학습자 진입)

`/library/phonics` 진입점. 한글/영어 선택 → unit 그리드 → 활동 그리드 → 활동/게임 실행.

저작도구의 `features/phonics/` (=AlphabetCardTab 등 편집기) 와 **별개** 모듈. 이쪽은 학습자 학습 흐름.

## 폴더 구조

```
features/phonics-learner/
  components/
    PhonicsLandingPage.tsx        # /library/phonics — 한글/영어 카드
    KoreanPhonicsHubPage.tsx      # /library/phonics/korean — unit 그리드 (레벨별)
    KoreanPhonicsUnitPage.tsx     # /library/phonics/korean/:unitId — 8 활동 그리드 (익히기/게임하기 2 섹션)
    KoreanPhonicsActivityPage.tsx # /library/phonics/korean/:unitId/:activityKey — 활동 호스트 (kind 별 분기)
  activities/
    VowelListenActivity.tsx       # 모음 듣기 (unit 1 활동 1/2)
    VowelWriteActivity.tsx        # 모음 쓰기 (unit 1 활동 3/4)
    ConsonantTapActivity.tsx      # 자음 누르기 (unit 2 활동 1) — 3 카드 × 3 탭 → "ㄱ ㄱ {단어}"
    ConsonantBlendListenActivity.tsx # 자음+모음 음절 (unit 2 활동 2/3) — 6행 × 3셀
    ConsonantWriteActivity.tsx    # 자음 쓰기 (unit 2 활동 4)
  lib/
    korean-phonics-units.ts       # unit 목록 + ActivityDef + KOREAN_UNIT_ACTIVITY_PLAN (unit 별 활동 구성)
    progress-store.ts             # localStorage `phonics-progress` — usePhonicsProgress hook
    pick-word-cards.ts            # flashcards/targetWords → 랜덤 N장 (consonant-tap/write 용)
    phonics-game-adapter.ts       # phonicsStorybook → KoreanBlock/WordWriting/LineMatching/ConnectDots data
```

## 라우트

- `/library/phonics` — AppShell 안 (랜딩)
- `/library/phonics/korean` — AppShell 안 (unit grid)
- `/library/phonics/korean/:unitId` — AppShell 안 (활동 grid)
- `/library/phonics/korean/:unitId/:activityKey` — **AppShell 밖** (활동 풀화면)

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
