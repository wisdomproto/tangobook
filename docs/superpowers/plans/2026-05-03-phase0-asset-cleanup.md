# Phase 0 Asset Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 학습 시스템 v2 전환 전 좀비 게임 10종 코드 삭제 + 게이미피케이션 보험 시스템(호리방·호리 아케이드 6·Playground 7) 라우트 가드 + AppShell 메뉴 정리.

**Architecture:** 두 작업을 분리. (A) 좀비 게임 = 코드 완전 삭제 (shared types → server generators → client registers/players/configs → registry/index.ts side-effect imports). (B) OFF 시스템 = 라우트는 남기되 NotFound로 가드 + AppShell 메뉴 진입점만 제거 (페이지/feature 코드는 손대지 않음). 베타 D7 측정 후 영구 폐기 또는 부활 결정.

**Tech Stack:** TypeScript, React, pnpm workspaces, Express, Vite. 폐기 변경은 컴파일러가 거의 모든 누락을 잡아냄 (TypeScript `tsc --noEmit` 의존). 추가 단위 테스트 X.

**Spec 참조:**
- [docs/superpowers/specs/2026-05-03-phase0-asset-cleanup-design.md](../specs/2026-05-03-phase0-asset-cleanup-design.md) — 영역별 결정 + ON/OFF 표
- [docs/superpowers/specs/2026-05-03-phase1-learning-system-design.md](../specs/2026-05-03-phase1-learning-system-design.md) — Phase 1 새 시스템 (참고용)

**총 작업 추산:** 1.5~2일 (사람 작업), Subagent 병렬 실행 시 단축 가능.

---

## File Structure (변경 대상 전체)

### A. 좀비 게임 10종 폐기 (코드 삭제)

| 게임 ID | register 파일 | Player 컴포넌트 | Config 컴포넌트 |
|---|---|---|---|
| word-writing (legacy) | 삭제 | **공유 — 유지** (legacy fallback만 제거) | **공유 — 유지** |
| vocabulary-matching | 삭제 | 삭제 | 삭제 |
| word-quiz | 삭제 | 삭제 | 삭제 |
| picture-sequence | 삭제 | 삭제 | 삭제 |
| odd-one-out | 삭제 | 삭제 | 삭제 |
| storybook-quiz | 삭제 | 삭제 | 삭제 |
| word-image-matching | 삭제 | 삭제 | 삭제 |
| blending-listening | 삭제 | 삭제 | 삭제 |
| letter-sound | 삭제 | 삭제 | 삭제 |
| word-listening | 삭제 | 삭제 | 삭제 |

**Modify (좀비 영향):**
- `packages/shared/src/types/storybook.ts` — GameTypeId / GameConfig / GameData unions 정리, 9 zombie interfaces 삭제, WordWritingConfig/Data 의 'word-writing' 리터럴 제거
- `packages/server/src/services/game.service.ts` — generators map 10 entries 제거, 9 generate 함수 + 관련 import 삭제
- `packages/client/src/features/games/registry/index.ts` — 10 side-effect import 줄 제거
- `packages/client/src/features/games/components/players/WordWritingPlayer.tsx:43` — `: 'word-writing'` legacy fallback 제거
- `packages/client/src/features/viewer/components/GameListViewer.tsx:15-29` — GRADIENTS map에서 9 zombie key 제거
- `packages/client/src/features/viewer/components/PhonicsViewer.tsx:436-445` — 같은 패턴 제거

### B. OFF 시스템 — 라우트 가드 + 메뉴 제거

**Modify:**
- `packages/client/src/router/index.tsx` — 14 라우트 (호리방 1 + 호리 아케이드 6 + Playground hub 1 + Playground 7) → `<Navigate to="/library" replace />` 로 가드. import 줄도 함께 제거. Feature 코드(`features/hori-room/`, `pages/Hori*Page.tsx`, `features/playground/components/word-*/`) **삭제 X**
- `packages/client/src/components/AppShell.tsx:39-45` — `MORE_FUN` 배열에서 `/hori-room`, `/games`, `/playground` 항목 제거. `/collection` 만 남김

### C. 변경하지 않는 것 (의도적)

- ❌ Weekly Missions 관련 — 클라 UI/라우트 없음 (`features/rewards/CLAUDE.md` 만 참조). DB 테이블 `weekly_missions` 그대로
- ❌ Speaking 한·영 — 이미 `hidden: true` 처리. 라우트/메뉴 진입점 없음. 손대지 않음
- ❌ `features/hori-room/`, `features/playground/`, `pages/Hori*Page.tsx`, `features/arcade-games/` — feature 폴더 전부 보존 (라우트만 가드)

---

## Chunk 1: 좀비 게임 코드 폐기 (Tasks 1-4)

### Task 1: 좀비 game.service.ts 정리 (server)

**Files:**
- Modify: `packages/server/src/services/game.service.ts`

세부 변경: 10 generators map entry 제거 + 9 generate 함수 + import 정리.

- [ ] **Step 1: 좀비 generate 함수 9개 + 관련 imports/interfaces 삭제**

`packages/server/src/services/game.service.ts` 에서 다음 함수 본체 전체 삭제:

| 함수 | 위치 (대략) | 비고 |
|---|---|---|
| `generateVocabularyMatching` | 105 | |
| `generatePictureSequence` | 131 | |
| `generateWordQuiz` | 159 | |
| `generateOddOneOut` | 208 | |
| `generateWordImageMatching` | 399 | |
| `generateBlendingListening` | 489 | |
| `generateLetterSound` | 551 | |
| `generateWordListening` | 613 | |
| `generateStorybookQuiz` | 708 | |

`generateWordWriting` (line 277) **유지** — korean-word-writing / english-word-writing이 공유.

타입 import도 정리 (파일 상단 from '@tangobook/shared'):
- 제거: `VocabularyMatchingConfig`, `VocabularyMatchingData`, `WordQuizConfig`, `WordQuizData`, `PictureSequenceConfig`, `PictureSequenceData`, `OddOneOutConfig`, `OddOneOutData`, `WordImageMatchingConfig`, `WordImageMatchingData`, `BlendingListeningConfig`, `BlendingListeningData`, `LetterSoundConfig`, `LetterSoundData`, `WordListeningConfig`, `WordListeningData`, `StorybookQuizConfig`, `StorybookQuizData`
- 유지: `WordWritingConfig`, `WordWritingData` (korean/english 공유)

- [ ] **Step 2: generators map 정리**

`packages/server/src/services/game.service.ts` 에서 generators 객체:

```ts
const generators: Partial<Record<GameTypeId, GameGenerator>> = {
  // 제거할 키 10개:
  // 'vocabulary-matching', 'picture-sequence', 'word-quiz', 'odd-one-out',
  // 'word-writing' (legacy alias), 'word-image-matching', 'blending-listening',
  // 'letter-sound', 'word-listening', 'storybook-quiz'
  'korean-word-writing': generateWordWriting,
  'english-word-writing': generateWordWriting,
  'connect-the-dots': generateConnectTheDots,
  'korean-block': generateKoreanBlock,
  'english-block': generateEnglishBlock,
  'korean-speaking': (storybook: Storybook) => generateKoreanSpeaking(storybook.id),
  'english-speaking': (storybook: Storybook) => generateEnglishSpeaking(storybook.id),
  'korean-line-matching': (sb, cfg) => generateLineMatching(sb, cfg as KoreanLineMatchingConfig, 'ko'),
  'english-line-matching': (sb, cfg) => generateLineMatching(sb, cfg as EnglishLineMatchingConfig, 'en'),
  'korean-story-image': (sb, cfg) => generateStoryImage(sb, cfg as KoreanStoryImageConfig, 'ko'),
  'english-story-image': (sb, cfg) => generateStoryImage(sb, cfg as EnglishStoryImageConfig, 'en'),
};
```

- [ ] **Step 3: 컴파일 검증**

```bash
pnpm --filter @tangobook/server typecheck
```

Expected: PASS (shared 타입은 아직 안 건드렸으므로 이 시점엔 컴파일 통과). FAIL 시 — 누락된 import/사용처 수정.

- [ ] **Step 4: 서버 단위 테스트 실행**

```bash
pnpm --filter @tangobook/server test
```

Expected: 모두 PASS. 좀비 게임을 참조하는 테스트는 없음 (확인됨).

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/game.service.ts
git commit -m "chore(server): 좀비 게임 9 generators + 10 map entries 폐기

- generateVocabularyMatching/PictureSequence/WordQuiz/OddOneOut/StorybookQuiz
- generateWordImageMatching/BlendingListening/LetterSound/WordListening
- 'word-writing' legacy alias map entry
- 관련 타입 import 정리

Phase 0 자산 정리. 자세한 결정 근거: docs/superpowers/specs/2026-05-03-phase0-asset-cleanup-design.md"
```

---

### Task 2: 좀비 client register/player/config 삭제

**Files:**
- Delete:
  - `packages/client/src/features/games/registry/games/vocabulary-matching.register.ts`
  - `packages/client/src/features/games/registry/games/word-writing.register.ts` (legacy register only)
  - `packages/client/src/features/games/registry/games/word-quiz.register.ts`
  - `packages/client/src/features/games/registry/games/picture-sequence.register.ts`
  - `packages/client/src/features/games/registry/games/odd-one-out.register.ts`
  - `packages/client/src/features/games/registry/games/storybook-quiz.register.ts`
  - `packages/client/src/features/games/registry/games/word-image-matching.register.ts`
  - `packages/client/src/features/games/registry/games/blending-listening.register.ts`
  - `packages/client/src/features/games/registry/games/letter-sound.register.ts`
  - `packages/client/src/features/games/registry/games/word-listening.register.ts`
  - `packages/client/src/features/games/components/players/VocabularyMatchingPlayer.tsx`
  - `packages/client/src/features/games/components/players/WordQuizPlayer.tsx`
  - `packages/client/src/features/games/components/players/PictureSequencePlayer.tsx`
  - `packages/client/src/features/games/components/players/OddOneOutPlayer.tsx`
  - `packages/client/src/features/games/components/players/StorybookQuizPlayer.tsx`
  - `packages/client/src/features/games/components/players/WordImageMatchingPlayer.tsx`
  - `packages/client/src/features/games/components/players/BlendingListeningPlayer.tsx`
  - `packages/client/src/features/games/components/players/LetterSoundPlayer.tsx`
  - `packages/client/src/features/games/components/players/WordListeningPlayer.tsx`
  - `packages/client/src/features/games/components/config/VocabularyMatchingConfigPanel.tsx`
  - `packages/client/src/features/games/components/config/WordQuizConfigPanel.tsx`
  - `packages/client/src/features/games/components/config/PictureSequenceConfigPanel.tsx`
  - `packages/client/src/features/games/components/config/OddOneOutConfigPanel.tsx`
  - `packages/client/src/features/games/components/config/StorybookQuizConfigPanel.tsx`
  - `packages/client/src/features/games/components/config/WordImageMatchingConfigPanel.tsx`
  - `packages/client/src/features/games/components/config/BlendingListeningConfigPanel.tsx`
  - `packages/client/src/features/games/components/config/LetterSoundConfigPanel.tsx`
  - `packages/client/src/features/games/components/config/WordListeningConfigPanel.tsx`
- Modify:
  - `packages/client/src/features/games/registry/index.ts` (10 side-effect import 제거)
  - `packages/client/src/features/games/components/players/WordWritingPlayer.tsx:43` (legacy fallback 제거)

**보존 (공유):**
- `packages/client/src/features/games/components/players/WordWritingPlayer.tsx` (korean/english 공유)
- `packages/client/src/features/games/components/config/WordWritingConfigPanel.tsx` (korean/english 공유)

- [ ] **Step 1: 19개 컴포넌트 파일 삭제 (10 register + 9 Player + 9 Config — 28개)**

```bash
cd packages/client/src/features/games/registry/games/
rm vocabulary-matching.register.ts word-writing.register.ts word-quiz.register.ts \
   picture-sequence.register.ts odd-one-out.register.ts storybook-quiz.register.ts \
   word-image-matching.register.ts blending-listening.register.ts \
   letter-sound.register.ts word-listening.register.ts

cd ../../components/players/
rm VocabularyMatchingPlayer.tsx WordQuizPlayer.tsx PictureSequencePlayer.tsx \
   OddOneOutPlayer.tsx StorybookQuizPlayer.tsx WordImageMatchingPlayer.tsx \
   BlendingListeningPlayer.tsx LetterSoundPlayer.tsx WordListeningPlayer.tsx

cd ../config/
rm VocabularyMatchingConfigPanel.tsx WordQuizConfigPanel.tsx PictureSequenceConfigPanel.tsx \
   OddOneOutConfigPanel.tsx StorybookQuizConfigPanel.tsx WordImageMatchingConfigPanel.tsx \
   BlendingListeningConfigPanel.tsx LetterSoundConfigPanel.tsx WordListeningConfigPanel.tsx
```

- [ ] **Step 2: registry/index.ts 정리**

`packages/client/src/features/games/registry/index.ts` — 다음 10 줄 제거:

```ts
import './games/vocabulary-matching.register';
import './games/word-writing.register';
import './games/word-quiz.register';
import './games/picture-sequence.register';
import './games/odd-one-out.register';
import './games/word-image-matching.register';
import './games/blending-listening.register';
import './games/letter-sound.register';
import './games/word-listening.register';
import './games/storybook-quiz.register';
```

상단 주석 `(12종)` → `(11종)` 으로 업데이트.

- [ ] **Step 3: WordWritingPlayer.tsx legacy fallback 제거**

`packages/client/src/features/games/components/players/WordWritingPlayer.tsx:38-44` — 아래로 교체:

```tsx
// AS-IS:
const gameType: GameTypeId =
  data.type === 'korean-word-writing'
    ? 'korean-word-writing'
    : data.type === 'english-word-writing'
      ? 'english-word-writing'
      : 'word-writing';

// TO-BE: (legacy 'word-writing' 제거)
const gameType: GameTypeId =
  data.type === 'korean-word-writing' ? 'korean-word-writing' : 'english-word-writing';
```

(`data.type` 은 `'korean-word-writing' | 'english-word-writing'` 만 가능 — Step 4에서 shared 타입 정리 시 narrow 됨.)

- [ ] **Step 4: 컴파일 검증 (이 시점에 shared 타입 미정리 → ERROR 예상)**

```bash
pnpm --filter @tangobook/client typecheck
```

Expected: shared 타입에 `'word-writing'`, `'vocabulary-matching'` 등 GameTypeId 멤버가 남아있어 일부 ts(2367) 에러 발생 가능. **이 시점 통과 X 정상**. Task 3에서 shared 정리 후 통과 예정.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/games/
git commit -m "chore(client): 좀비 게임 28 파일 + registry import 폐기

- 10 register: vocabulary-matching/word-writing(legacy)/word-quiz/picture-sequence/odd-one-out/storybook-quiz/word-image-matching/blending-listening/letter-sound/word-listening
- 9 Player + 9 Config 컴포넌트 (WordWritingPlayer/Config 는 korean/english 공유로 유지)
- registry/index.ts 10 side-effect import 제거
- WordWritingPlayer.tsx legacy 'word-writing' fallback 제거

shared 타입 정리는 다음 커밋. 자세한 근거: docs/superpowers/specs/2026-05-03-phase0-asset-cleanup-design.md"
```

---

### Task 3: shared 타입 정리

**Files:**
- Modify: `packages/shared/src/types/storybook.ts`

- [ ] **Step 1: GameTypeId union에서 10 멤버 제거**

`packages/shared/src/types/storybook.ts:189-210` — 아래로 교체:

```ts
export type GameTypeId =
  | 'connect-the-dots'
  | 'korean-block'
  | 'english-block'
  | 'korean-word-writing'
  | 'english-word-writing'
  | 'korean-speaking'
  | 'english-speaking'
  | 'korean-line-matching'
  | 'english-line-matching'
  | 'korean-story-image'
  | 'english-story-image';
```

(제거: vocabulary-matching, word-writing, word-quiz, picture-sequence, odd-one-out, word-image-matching, blending-listening, letter-sound, word-listening, storybook-quiz — 10개)

- [ ] **Step 2: GameConfig union에서 10 멤버 제거**

`packages/shared/src/types/storybook.ts:234-253` — 아래로 교체:

```ts
export type GameConfig =
  | WordWritingConfig
  | ConnectTheDotsConfig
  | KoreanBlockConfig
  | EnglishBlockConfig
  | KoreanSpeakingConfig
  | EnglishSpeakingConfig
  | KoreanLineMatchingConfig
  | EnglishLineMatchingConfig
  | KoreanStoryImageConfig
  | EnglishStoryImageConfig;
```

- [ ] **Step 3: GameData union에서 10 멤버 제거**

`packages/shared/src/types/storybook.ts:256-275` — 아래로 교체:

```ts
export type GameData =
  | WordWritingData
  | ConnectTheDotsData
  | KoreanBlockData
  | EnglishBlockData
  | KoreanSpeakingData
  | EnglishSpeakingData
  | KoreanLineMatchingData
  | EnglishLineMatchingData
  | KoreanStoryImageData
  | EnglishStoryImageData;
```

- [ ] **Step 4: 9 zombie interface 본체 삭제**

다음 interface 정의를 storybook.ts 에서 모두 삭제:

| Interface | 위치 (대략) |
|---|---|
| `VocabularyMatchingConfig` / `VocabularyMatchingItem` / `VocabularyMatchingData` | 278~ |
| `WordQuizConfig` / `WordQuizQuestion` / `WordQuizData` | 344~ |
| `PictureSequenceConfig` / `PictureSequenceImage` / `PictureSequenceData` | 362~ |
| `OddOneOutConfig` / `OddOneOutItem` / `OddOneOutRound` / `OddOneOutData` | 377~ |
| `WordImageMatchingConfig` / `WordImageMatchingGroup` / `WordImageMatchingData` | 399~ |
| `BlendingListeningConfig` / `BlendingListeningRound` / `BlendingListeningData` | 417~ |
| `LetterSoundConfig` / `LetterSoundRound` / `LetterSoundData` | 434~ |
| `WordListeningConfig` / `WordListeningRound` / `WordListeningData` | 448~ |
| `StorybookQuizConfig` / `StorybookQuizQuestion` / `StorybookQuizData` | 513~ |

**유지**: `WordWritingConfig` / `WordWritingItem` / `WordWritingData` (korean/english 공유).

- [ ] **Step 5: WordWritingConfig/Data 의 'word-writing' 리터럴 제거**

`packages/shared/src/types/storybook.ts` 두 곳 (296, 312):

```ts
// AS-IS:
type: 'word-writing' | 'korean-word-writing' | 'english-word-writing';

// TO-BE:
type: 'korean-word-writing' | 'english-word-writing';
```

- [ ] **Step 6: 컴파일 검증 (전 패키지)**

```bash
pnpm typecheck
```

Expected: PASS. FAIL 시 — viewer/GameListViewer.tsx, viewer/PhonicsViewer.tsx 의 GRADIENTS 맵에 좀비 키가 남아있을 가능성 → Task 4에서 정리.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/types/storybook.ts
git commit -m "chore(shared): 좀비 게임 10종 타입 정의 폐기

- GameTypeId union: 10 멤버 제거
- GameConfig/GameData union: 10 멤버 제거
- 27 interface (Config/Item/Data) 본체 삭제
- WordWritingConfig/Data 의 'word-writing' 리터럴 제거 (korean/english 만 유지)

Phase 0 자산 정리 마무리. 컴파일러가 잡아낸 viewer 정리는 다음 커밋."
```

---

### Task 4: viewer GRADIENTS 맵 정리

**Files:**
- Modify: `packages/client/src/features/viewer/components/GameListViewer.tsx:15-29`
- Modify: `packages/client/src/features/viewer/components/PhonicsViewer.tsx:436-445`

- [ ] **Step 1: GameListViewer GRADIENTS 정리**

`packages/client/src/features/viewer/components/GameListViewer.tsx:15-29` — 아래로 교체:

```ts
const GRADIENTS: Record<string, string> = {
  'connect-the-dots': 'from-lime-400 to-green-500',
  'korean-block': 'from-yellow-400 to-amber-500',
  'english-block': 'from-yellow-400 to-amber-500',
  'korean-word-writing': 'from-amber-400 to-orange-500',
  'english-word-writing': 'from-amber-400 to-orange-500',
  'korean-line-matching': 'from-pink-400 to-rose-500',
  'english-line-matching': 'from-pink-400 to-rose-500',
  'korean-story-image': 'from-rose-400 to-pink-500',
  'english-story-image': 'from-rose-400 to-pink-500',
  'korean-speaking': 'from-cyan-400 to-blue-500',
  'english-speaking': 'from-cyan-400 to-blue-500',
};
```

(원본에 있던 zombie 9 키 제거 + 누락된 노출 게임 키 추가)

- [ ] **Step 2: PhonicsViewer GRADIENTS 동일 정리**

`packages/client/src/features/viewer/components/PhonicsViewer.tsx:436-445` 같은 패턴으로 zombie 키 제거. PhonicsViewer 는 파닉스 컨텍스트라 키 목록은 위 GameListViewer 와 동일 또는 부분집합으로 유지.

- [ ] **Step 3: 전 패키지 컴파일 검증**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: 빌드 검증**

```bash
pnpm build
```

Expected: PASS. 클라이언트 빌드 성공 + 서버 빌드 성공.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/viewer/
git commit -m "chore(viewer): GameListViewer/PhonicsViewer GRADIENTS 좀비 키 정리

좀비 게임 9 키 제거 + 노출 게임 키 누락분 보강. typecheck + build 통과.

Phase 0 좀비 게임 폐기 작업 완료."
```

---

## Chunk 2: OFF 시스템 라우트 가드 + 메뉴 정리 (Tasks 5-6)

### Task 5: 라우트 14개 가드 (NotFound 또는 Navigate 리다이렉트)

**Files:**
- Modify: `packages/client/src/router/index.tsx`

라우트는 살아있되 직접 URL 접근해도 차단. **결정: `<Navigate to="/library" replace />`** (404 보다 자연스러움. 베타 시 메뉴 없는 페이지 우연히 진입한 사용자도 라이브러리로 안내).

- [ ] **Step 1: import 14개 라우트 제거**

`packages/client/src/router/index.tsx` 에서 다음 import 제거:

```ts
// 제거:
import HoriRunPage from '../pages/HoriRunPage';
import HoriCatchPage from '../pages/HoriCatchPage';
import HoriWhackPage from '../pages/HoriWhackPage';
import HoriMemoryPage from '../pages/HoriMemoryPage';
import HoriSimonPage from '../pages/HoriSimonPage';
import HoriJumpPage from '../pages/HoriJumpPage';
import GamesHubPage from '../pages/GamesHubPage';
import { HoriRoomPage } from '../features/hori-room';
import {
  PlaygroundHubPage,
  WordMemoryPlayer,
  WordPopPlayer,
  WordFishingPlayer,
  WordShoppingPlayer,
  WordRunPlayer,
  WordSortCartPlayer,
  WordGardenPlayer,
} from '../features/playground';
```

(파일 자체는 보존 — 라우트만 끊는다)

- [ ] **Step 2: 라우트 정의를 Navigate 리다이렉트로 교체**

다음 라우트 entry를 모두 `element: <Navigate to="/library" replace />` 로 교체:

AppShell children 안:
- `{ path: 'hori-room', ... }` → `{ path: 'hori-room', element: <Navigate to="/library" replace /> }`
- `{ path: 'playground', ... }` → 동일
- `{ path: 'games', ... }` → 동일

AppShell 외 (단독 라우트):
- `games/hori-run`, `games/hori-catch`, `games/hori-whack`, `games/hori-memory`, `games/hori-simon`, `games/hori-jump` (6개) → 모두 Navigate
- `playground/word-memory`, `playground/word-pop`, `playground/word-fishing`, `playground/word-shopping`, `playground/word-run`, `playground/word-sort-cart`, `playground/word-garden` (7개) → 모두 Navigate

총 16 라우트 (3 hub + 6 hori-arcade + 7 playground games).

- [ ] **Step 3: 컴파일 검증**

```bash
pnpm --filter @tangobook/client typecheck
```

Expected: PASS.

- [ ] **Step 4: dev 서버 띄워서 가드 확인**

```bash
pnpm --filter @tangobook/client dev
```

수동 검증: 브라우저에서 다음 URL 접근 → `/library` 로 자동 리다이렉트되는지:
- `/hori-room`
- `/playground`
- `/games`
- `/games/hori-run`
- `/playground/word-memory`

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/router/index.tsx
git commit -m "chore(router): OFF 시스템 16 라우트 가드 (Navigate to /library)

- /hori-room (호리방 꾸미기)
- /games + /games/hori-{run,catch,whack,memory,simon,jump} (호리 아케이드 6)
- /playground + /playground/word-{memory,pop,fishing,shopping,run,sort-cart,garden} (Playground 7)

Feature 코드는 보존. 베타 D7 측정 후 ON or 영구 폐기.
근거: docs/superpowers/specs/2026-05-03-phase0-asset-cleanup-design.md §7"
```

---

### Task 6: AppShell 메뉴 진입점 제거

**Files:**
- Modify: `packages/client/src/components/AppShell.tsx:39-45`

- [ ] **Step 1: MORE_FUN 배열 정리**

`packages/client/src/components/AppShell.tsx:39-45` — 아래로 교체:

```tsx
const MORE_FUN = [
  { to: '/collection', iconSrc: 'section/collection.png', label: '카드' },
];
```

(제거: 호리 방 / 호리 게임 / 단어 놀이 — 3 항목. 카드만 남김 = 도감)

- [ ] **Step 2: dev 서버에서 사이드바 확인**

```bash
pnpm --filter @tangobook/client dev
```

수동 검증: AppShell 사이드바에 "호리 방", "호리 게임", "단어 놀이" 메뉴 항목 사라졌는지. "카드" (도감) 만 남아있어야 함.

- [ ] **Step 3: 빌드 검증**

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/components/AppShell.tsx
git commit -m "chore(AppShell): OFF 시스템 메뉴 진입점 제거

MORE_FUN 배열에서 호리 방/호리 게임/단어 놀이 제거. 카드(도감)만 유지.
라우트는 router 가드로 처리됨. Phase 1 진입 모습 완성.

근거: docs/superpowers/specs/2026-05-03-phase0-asset-cleanup-design.md §7"
```

---

## Chunk 3: 통합 검증 (Task 7)

### Task 7: 전 패키지 typecheck + build + 수동 smoke test

**Files:** (변경 없음)

- [ ] **Step 1: 전 패키지 typecheck**

```bash
pnpm typecheck
```

Expected: PASS (모든 패키지 — shared / server / client / remotion).

- [ ] **Step 2: 전 패키지 build**

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 3: 전 패키지 lint**

```bash
pnpm lint
```

Expected: PASS (또는 사전 존재 경고 수준).

- [ ] **Step 4: 수동 smoke test — 핵심 플로우**

dev 서버 띄우고 핵심 플로우 동작 확인:

```bash
pnpm dev
```

체크리스트:
- [ ] AppShell 사이드바: 카드(도감)만 남았는가
- [ ] `/library` 로딩 정상
- [ ] `/library/:id` (BookDetail) 로딩 정상
- [ ] `/viewer/:id` 동화 재생 정상 (TTS, 자막, 페이지 넘김)
- [ ] `/collection` 도감 정상
- [ ] `/vocabulary` 어휘 허브 정상
- [ ] `/parent/reports` Learning Reports 정상
- [ ] `/hori-room` 접근 → `/library` 리다이렉트
- [ ] `/playground` 접근 → `/library` 리다이렉트
- [ ] `/games/hori-run` 접근 → `/library` 리다이렉트

- [ ] **Step 5: 게임 생성 플로우 확인 (editor)**

`/editor` 진입 → 책 선택 → "게임 추가" 모달 열기. 다음 11종만 노출되어야 함:
- 한글 블록 (korean-block) / 영어 블록 (english-block)
- 한글 낱말쓰기 (korean-word-writing) / 영어 낱말쓰기 (english-word-writing)
- 단어 그림 그리기 (connect-the-dots)
- 한글/영어 그림-단어 선긋기 (korean/english-line-matching)
- 한글/영어 이야기 듣고 그림 찾기 (korean/english-story-image)
- (Speaking 한·영은 hidden 처리되어 미노출 정상)

- [ ] **Step 6: 마무리 commit (있으면)**

위 검증 단계에서 수정 사항 발생 시 추가 commit. 없으면 skip.

- [ ] **Step 7: 메모리 업데이트**

```bash
# memory/MEMORY.md 의 Phase 0 항목을 "Decided" → "Implemented (commit hash)" 로 업데이트
```

`memory/phase0-asset-cleanup.md` 와 `MEMORY.md` 인덱스 항목에 구현 commit 해시 추가:

```markdown
## Phase 0 Asset Cleanup Decisions (2026-05-03) ⭐ ACTIVE
See [phase0-asset-cleanup.md](phase0-asset-cleanup.md) — Phase 1 진입 전 기존 자산 처리. Implemented 2026-05-03 (commits XXX-YYY). 호리방/아케이드 6종/Weekly Missions/Playground 7게임 = OFF (코드 보존). 좀비 게임 10종 폐기 완료. ...
```

```bash
git add C:/Users/101024/.claude/projects/C--projects-tangobook/memory/
git commit -m "docs(memory): Phase 0 자산 정리 구현 완료 표시"
```

---

## Risk & Rollback

**Risk 1: shared 타입 변경이 R2 저장된 책 데이터와 충돌?**
- `Storybook.games[]` 안에 `gameType: 'vocabulary-matching'` 등 좀비 ID로 저장된 인스턴스가 R2에 있을 가능성
- 메모리 [games-overhaul-2026-04-23] 에 따르면 좀비 게임은 "인스턴스 일괄 삭제됨"
- 추가 검증: `pnpm --filter @tangobook/server tsx scripts/check-zombie-game-instances.mjs` (없으면 작성 또는 스킵). 만약 좀비 인스턴스가 남아있으면 — runtime 시 GameListViewer 가 `getGameEntry(zombie-id)` 호출 → undefined 반환. 이미 `entry?.language` 등 옵셔널 처리되어 있어 화면에는 그냥 안 보임. **데이터 무결성 위반 X, 단순 노출 안 됨**
- 결론: R2 데이터 마이그 불필요. Read 시 silently 무시.

**Risk 2: WordWritingPlayer.tsx legacy fallback 제거가 기존 R2 데이터 깨뜨림?**
- 만약 R2 에 `data.type: 'word-writing'` 인 인스턴스가 남아있다면 — Player가 'english-word-writing' 으로 잘못 처리할 수 있음
- 위 Risk 1 과 같은 가정 (좀비 인스턴스 일괄 삭제됨)으로 무시 가능
- 안전망: Step 3에서 `data.type === 'korean-word-writing' ? 'korean-word-writing' : 'english-word-writing'` — `data.type` 이 union narrow 되어 컴파일러가 보장

**Risk 3: 라우트 가드 후 외부 북마크/딥링크 깨짐**
- `/playground`, `/hori-room` 등을 북마크한 사용자가 있을 수 있음
- 결과: `/library` 로 자연 리다이렉트 → UX 자연스러움 (404 보다 나음)
- 결론: 의도된 동작. 별도 처리 X.

**Rollback:**
모든 commit 단위로 롤백 가능. `git revert <commit>` 로 단일 커밋 되돌리기. 위험한 단일 변경은 없음.

---

## Out of Scope (이 plan에서 다루지 않음)

- 새 동화 트랙 게임 (숨은그림찾기 / 틀린그림찾기) 신규 제작 — Phase 1 본 작업
- 도감 1,200단어 확장 — Phase 1 본 작업
- KeyObject → 좌표 마킹 자동화 파이프라인 — Phase 1 본 작업
- 별 카운터 아이 화면 표시 (현재 일부 화면 노출) — Phase 1 진입 시 수정
- 부모 대시보드 별 그래프 — Phase 1 진입 시 수정
- Cambridge 16 토픽 ↔ 도감 6 카테고리 리매핑 — Phase 1 본 작업
- forced alignment 파이프라인 (글로우 펄스) — Phase 1 본 작업

---

## Execution

**Plan complete and saved to `docs/superpowers/plans/2026-05-03-phase0-asset-cleanup.md`.**

이 plan은 7 Tasks × 5~7 Steps = 약 40~50 실행 단계. 의존성:
- Task 1 (서버) → Task 2 (클라 컴포넌트 삭제) → Task 3 (shared 타입) → Task 4 (viewer cleanup): **순차 의존**
- Task 5 (라우트 가드) ↔ Task 6 (메뉴 정리): **독립** (병렬 가능)
- Task 7 (검증): 모든 task 후

**Subagent-driven 권장**:
- Task 1 → Task 2 → Task 3 → Task 4: 한 subagent 가 순차 실행
- Task 5 + Task 6: 병렬 subagent
- Task 7: 메인 세션에서 직접 검증

각 commit은 atomic 하므로 중간에 멈춰도 안전.

**다음 단계:** `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans` 호출하여 실행.
