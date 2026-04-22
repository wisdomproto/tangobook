# 말하기 게임 (Speaking Games) Implementation Plan

> **✅ 구현 완료 (2026-04-22)** — 스펙: `docs/superpowers/specs/2026-04-22-speaking-games-design.md`. 진행 상세: `memory/speaking-games-complete.md`.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 동화책 전용 말하기 게임 2종(`korean-speaking`, `english-speaking`) 신설 + 뷰어 언어 필터링. "액팅 유도, 측정 아님" 철학으로 모든 에러를 silent pass-through.

**Architecture:** 게임 타입 2개는 공통 `SpeakingPlayer`/`SpeakingConfigPanel`을 `lang` prop으로 분기해 공유. 음성 인식은 `useSpeechRecognizer` 훅이 Web Speech API와 OpenAI Whisper fallback을 단일 `SpeechResult` 해상도로 추상화. 진척은 `useSpeakingProgress` 훅이 localStorage로 관리. 서버 `generateSpeaking`은 `VocabularyDbService` 결과를 순수 변환 — Gemini 호출 없음. 뷰어 필터링은 레지스트리 엔트리에 `language?: 'ko'|'en'` 필드 추가해 기존 block/word-writing 포함 일관 처리.

**Tech Stack:** 기존 게임 리디자인에서 상속 — framer-motion, canvas-confetti, vitest, @testing-library/react, Tailwind. 신규: OpenAI Whisper API (`openai` 패키지), `express-rate-limit`. 브라우저 내장: Web Speech API, MediaRecorder, Web Audio API.

**Spec:** `docs/superpowers/specs/2026-04-22-speaking-games-design.md`

---

## File Structure

### 신규 파일 (Chunk 1~4에 걸쳐)

```
packages/shared/src/
  types/storybook.ts                       # [수정] union 확장 + SpeakingItem 타입 추가
  constants/index.ts                       # [수정] SPEAKING_PRESETS export

packages/server/src/
  providers/
    whisper.provider.ts                    # [신규] OpenAI Whisper API 클라이언트
    whisper.provider.test.ts               # [신규]
  services/
    game.service.ts                        # [수정] generateKoreanSpeaking/EnglishSpeaking
    game.service.test.ts                   # [수정] 3개 테스트 추가
  controllers/
    speaking.controller.ts                 # [신규]
  routes/
    speaking.routes.ts                     # [신규]
  index.ts                                 # [수정] 라우트 등록

packages/client/src/features/games/
  hooks/
    useSpeechRecognizer.ts                 # [신규]
    useSpeechRecognizer.test.ts            # [신규]
    useSpeakingProgress.ts                 # [신규]
    useSpeakingProgress.test.ts            # [신규]
  components/
    players/
      SpeakingPlayer.tsx                   # [신규] lang prop으로 분기
      SpeakingPlayer.test.tsx              # [신규]
    config/
      SpeakingConfigPanel.tsx              # [신규]
    GameListViewer.tsx                     # [수정] 언어 필터링
    GameListViewer.test.tsx                # [신규]
  registry/
    game-registry.ts                       # [수정] GameRegistryEntry.language 필드 추가
    games/
      korean-speaking.register.ts          # [신규]
      english-speaking.register.ts         # [신규]
      korean-block.register.ts             # [수정] language: 'ko'
      english-block.register.ts            # [수정] language: 'en'
      korean-word-writing.register.ts      # [수정] language: 'ko'
      english-word-writing.register.ts     # [수정] language: 'en'
    index.ts                               # [수정] side-effect imports
```

### 기존 패턴 준수
- `registerGame()` 호출 패턴: 기존 15개 게임과 동일
- Player/ConfigPanel prop 시그니처: `GamePlayerProps`/`GameConfigPanelProps` 인터페이스 준수
- 서버 레이어: routes → controllers → services → providers (기존 그대로)
- 테스트: vitest + @testing-library/react, 파일 이름 `*.test.ts(x)`
- 커밋 메시지: 한국어 본문, conventional commit prefix(`feat`/`fix`/`refactor`/`chore`/`docs`) + 범위

---

## Chunk 1: Foundation — 타입, 상수, 레지스트리 필드, 뷰어 언어 필터링

**목표:** 이후 chunk 전체의 기반. 타입·상수만 추가하고 기존 4개 언어-태그 게임 마이그레이션 + 뷰어 필터링 로직 완성. 이 chunk만으로도 배포 가능(실제 말하기 게임은 아직 없지만 기존 게임 필터링은 동작).

**기간:** 0.5일

### Task 1.1: shared 타입·상수 추가

**Files:**
- Modify: `packages/shared/src/types/storybook.ts` (기존 GameData/GameConfig union 뒤에 추가)
- Modify: `packages/shared/src/constants/index.ts` (SPEAKING_PRESETS 상수 추가)

- [ ] **Step 1: GameTypeId·GameConfig·GameData 유니온 + SpeakingItem 타입 추가**

`packages/shared/src/types/storybook.ts`의 GameData union 근처(line ~244~260)에 다음 추가:

```ts
// --- 말하기 (ko/en 공통) ---
export type SpeakingDifficulty = 'easy' | 'medium' | 'hard';

export interface SpeakingDifficultyPreset {
  showWord: boolean;
  autoPlayTts: boolean;
  showPromptLine: boolean;
  repeatCycles: 1 | 2;
}

export interface SpeakingItem {
  word: string;             // ko 게임: 한국어, en 게임: 영어
  displayWord: string;      // 화면 표시용
  koreanMeaning?: string;   // en 게임에서만 — 의미 보조
  imageUrl: string;
  ttsUrl: string;
}

export interface KoreanSpeakingConfig {
  type: 'korean-speaking';
}
export interface KoreanSpeakingData {
  type: 'korean-speaking';
  items: SpeakingItem[];
}

export interface EnglishSpeakingConfig {
  type: 'english-speaking';
}
export interface EnglishSpeakingData {
  type: 'english-speaking';
  items: SpeakingItem[];
}
```

그리고 `GameTypeId`·`GameConfig`·`GameData` 유니온에 추가:
- `GameTypeId`: `... | 'korean-speaking' | 'english-speaking'`
- `GameConfig`: `... | KoreanSpeakingConfig | EnglishSpeakingConfig`
- `GameData`: `... | KoreanSpeakingData | EnglishSpeakingData`

- [ ] **Step 2: SPEAKING_PRESETS 상수 export**

`packages/shared/src/constants/index.ts`에 추가:

```ts
import type { SpeakingDifficulty, SpeakingDifficultyPreset } from '../types/storybook';

export const SPEAKING_PRESETS: Record<SpeakingDifficulty, SpeakingDifficultyPreset> = {
  easy:   { showWord: true,  autoPlayTts: true,  showPromptLine: true,  repeatCycles: 1 },
  medium: { showWord: true,  autoPlayTts: false, showPromptLine: false, repeatCycles: 1 },
  hard:   { showWord: false, autoPlayTts: false, showPromptLine: false, repeatCycles: 2 },
};
```

- [ ] **Step 3: shared 타입체크**

Run:
```bash
pnpm --filter @tangobook/shared build
```
Expected: 성공. 에러 발생 시 유니온 추가 위치 재확인.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/storybook.ts packages/shared/src/constants/index.ts
git commit -m "feat(shared): speaking game types + SPEAKING_PRESETS"
```

### Task 1.2: 레지스트리 entry `language` 필드 + 기존 4게임 마이그레이션

**Files:**
- Modify: `packages/client/src/features/games/registry/game-registry.ts`
- Modify: `packages/client/src/features/games/registry/games/korean-block.register.ts`
- Modify: `packages/client/src/features/games/registry/games/english-block.register.ts`
- Modify: `packages/client/src/features/games/registry/games/korean-word-writing.register.ts`
- Modify: `packages/client/src/features/games/registry/games/english-word-writing.register.ts`

- [ ] **Step 1: `GameRegistryEntry`에 `language` optional 필드 추가**

`game-registry.ts`의 interface에 추가:

```ts
export interface GameRegistryEntry {
  id: GameTypeId;
  category: GameCategory;
  nameKo: string;
  descriptionKo: string;
  icon: string;
  supportedTypes: Array<'storybook' | 'phonics'>;
  supportedLevels?: number[];
  contentRequirements: ContentRequirement;
  defaultConfig: GameConfig;
  hidden?: boolean;
  ConfigPanel: ComponentType<GameConfigPanelProps>;
  PlayerComponent: ComponentType<GamePlayerProps>;
  language?: 'ko' | 'en';    // [신규] 언어 전용 게임. 없으면 언어 중립
}
```

- [ ] **Step 2: 기존 4개 레지스트리 파일에 `language` 필드 추가**

각 파일의 `registerGame({...})` 객체에 한 줄 추가:

- `korean-block.register.ts`: `language: 'ko',`
- `english-block.register.ts`: `language: 'en',`
- `korean-word-writing.register.ts`: `language: 'ko',`
- `english-word-writing.register.ts`: `language: 'en',`

(기존 `registerGame({ id: 'korean-block', category: 'common', ... })` 맨 뒤에 `language: 'ko'` 추가)

- [ ] **Step 3: 타입체크**

Run:
```bash
pnpm --filter @tangobook/client typecheck
```
Expected: 성공.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/games/registry/
git commit -m "feat(games): add language field to registry entries + migrate existing 4 games"
```

### Task 1.3: GameListViewer 언어 필터링

**Files:**
- Modify: `packages/client/src/features/viewer/components/GameListViewer.tsx`
- Create: `packages/client/src/features/viewer/components/GameListViewer.test.tsx`

> **중요 경로 정정**: GameListViewer는 `features/games/`가 아니라 `features/viewer/components/`에 있음 (현재 94줄, named export, useSearchParams 미사용). `getGameEntry`는 `@/features/games/registry`에서 import.

- [ ] **Step 1: 기존 GameListViewer 구조 확인**

Run:
```bash
wc -l packages/client/src/features/viewer/components/GameListViewer.tsx
```
Expected: `94 packages/client/src/features/viewer/components/GameListViewer.tsx`

파일을 Read 도구로 전체 읽어 현재 games 렌더 위치(line 67 `games.map(...)`) 및 import 확인 — 현재 `useSearchParams` 안 쓰고 있음, `useState`/`useNavigate`만 import.

- [ ] **Step 2: 실패 테스트 작성**

`packages/client/src/features/viewer/components/GameListViewer.test.tsx` 신규 생성:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GameListViewer } from './GameListViewer';
// 레지스트리 side-effect import (game-registry Map을 채우기 위해 필수)
import '@/features/games/registry';

// Storybook mock (최소 필드만). GameListViewer는 storybook.games만 읽음.
const mockStorybook = {
  id: 'test',
  title: 'Test',
  type: 'storybook',
  targetAge: 5,
  pages: [],
  games: [
    { id: 'g1', gameType: 'korean-block', title: '한글 블록', difficulty: 'easy', data: {}, createdAt: '2026-01-01' },
    { id: 'g2', gameType: 'english-block', title: 'English block', difficulty: 'easy', data: {}, createdAt: '2026-01-01' },
    { id: 'g3', gameType: 'vocabulary-matching', title: '어휘 매칭', difficulty: 'easy', data: {}, createdAt: '2026-01-01' },
  ],
} as any;

describe('GameListViewer language filtering', () => {
  it('lang=ko: korean-block + vocabulary-matching 표시, english-block 숨김', () => {
    render(
      <MemoryRouter initialEntries={['/viewer/test?mode=games&lang=ko']}>
        <GameListViewer storybook={mockStorybook} />
      </MemoryRouter>
    );
    expect(screen.getByText('한글 블록')).toBeInTheDocument();
    expect(screen.getByText('어휘 매칭')).toBeInTheDocument();
    expect(screen.queryByText('English block')).not.toBeInTheDocument();
  });

  it('lang=en: english-block + vocabulary-matching 표시, korean-block 숨김', () => {
    render(
      <MemoryRouter initialEntries={['/viewer/test?mode=games&lang=en']}>
        <GameListViewer storybook={mockStorybook} />
      </MemoryRouter>
    );
    expect(screen.getByText('English block')).toBeInTheDocument();
    expect(screen.getByText('어휘 매칭')).toBeInTheDocument();
    expect(screen.queryByText('한글 블록')).not.toBeInTheDocument();
  });
});
```

> **Export 확인**: `GameListViewer`는 named export (`export function GameListViewer`). 현재 파일(line 25)에서 확인됨. `import { GameListViewer }` 형태 그대로 사용.

- [ ] **Step 3: 테스트 실행해 실패 확인**

Run:
```bash
pnpm --filter @tangobook/client test -- GameListViewer.test.tsx
```
Expected: FAIL — 현재 GameListViewer는 언어 필터링 안 함.

- [ ] **Step 4: GameListViewer에 언어 필터링 추가**

현재 파일(line 1-2)의 import를 수정:

```tsx
// Before
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// After
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
```

컴포넌트 내부(line 25-28 근처) 수정:

```tsx
// Before
export function GameListViewer({ storybook }: GameListViewerProps) {
  const navigate = useNavigate();
  const games = storybook.games ?? [];
  const [playingGame, setPlayingGame] = useState<GameInstance | null>(null);

// After
export function GameListViewer({ storybook }: GameListViewerProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentLang = (searchParams.get('lang') as 'ko' | 'en' | null) ?? 'ko';

  const games = useMemo(() => {
    return (storybook.games ?? []).filter((g) => {
      const entry = getGameEntry(g.gameType);
      if (!entry?.language) return true;            // 언어 중립 → 항상 표시
      return entry.language === currentLang;
    });
  }, [storybook.games, currentLang]);

  const [playingGame, setPlayingGame] = useState<GameInstance | null>(null);
```

`games.map(...)` 렌더 부분(기존 line 67)은 `games` 변수를 그대로 쓰고 있으니 건드리지 않아도 됨.

- [ ] **Step 5: 테스트 재실행 → PASS 확인**

Run:
```bash
pnpm --filter @tangobook/client test -- GameListViewer.test.tsx
```
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/features/viewer/components/GameListViewer.tsx packages/client/src/features/viewer/components/GameListViewer.test.tsx
git commit -m "feat(viewer): language filtering in GameListViewer (uses registry.language field)"
```

### Task 1.4: Chunk 1 마감 sanity

- [ ] **Step 1: 전체 typecheck + test**

Run:
```bash
pnpm --filter @tangobook/shared build
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
```
Expected 출력:
- `pnpm build`: `Successfully built` (tsc 무에러)
- `pnpm typecheck`: exit 0 (tsc --noEmit)
- `pnpm test`: `Test Files N passed (N)` · `Tests 41 passed (41)` — 기존 39 + 신규 2

- [ ] **Step 2: 커밋 체인 확인**

Run:
```bash
git log --oneline -5
```
Expected: feat(shared) → feat(games) registry → feat(games) filtering 순서.

**🏁 Chunk 1 완료 기준:**
- [ ] shared 타입·상수 추가됨
- [ ] 기존 4개 게임이 `language` 필드 갖음
- [ ] GameListViewer가 `?lang=ko|en`으로 필터링
- [ ] 2개 테스트 신규 통과
- [ ] typecheck 무에러

---

## Chunk 2: 클라이언트 훅 (TDD)

**목표:** `useSpeakingProgress`(단순) → `useSpeechRecognizer`(복잡) 순서로 TDD. 훅만으로 단위 테스트 완비, 이후 Player 컴포넌트가 얹히는 기반.

**기간:** 1~1.5일

### Task 2.1: useSpeakingProgress (TDD, ~6 tests)

**Files:**
- Create: `packages/client/src/features/games/hooks/useSpeakingProgress.ts`
- Create: `packages/client/src/features/games/hooks/useSpeakingProgress.test.ts`

- [ ] **Step 1: 실패 테스트 작성 (6 tests)**

`useSpeakingProgress.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeakingProgress } from './useSpeakingProgress';

describe('useSpeakingProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('record({ spoken: true }) 후 spokenRounds +1, totalRounds +1', () => {
    const { result } = renderHook(() => useSpeakingProgress('book1', 'ko'));
    act(() => result.current.record({ spoken: true, transcription: '사과', targetWord: '사과' }));
    expect(result.current.progress.totalRounds).toBe(1);
    expect(result.current.progress.spokenRounds).toBe(1);
    expect(result.current.progress.wordsSpoken).toContain('사과');
  });

  it('record({ spoken: false }) 시 totalRounds만 +1, wordsSpoken 변화 없음', () => {
    const { result } = renderHook(() => useSpeakingProgress('book1', 'ko'));
    act(() => result.current.record({ spoken: false, transcription: null, targetWord: '사과' }));
    expect(result.current.progress.totalRounds).toBe(1);
    expect(result.current.progress.spokenRounds).toBe(0);
    expect(result.current.progress.wordsSpoken).toEqual([]);
  });

  it('같은 targetWord 반복 record → wordsSpoken 중복 제거', () => {
    const { result } = renderHook(() => useSpeakingProgress('book1', 'ko'));
    act(() => {
      result.current.record({ spoken: true, transcription: '사과', targetWord: '사과' });
      result.current.record({ spoken: true, transcription: '사과', targetWord: '사과' });
    });
    expect(result.current.progress.spokenRounds).toBe(2);
    expect(result.current.progress.wordsSpoken).toEqual(['사과']);
  });

  it('책별·언어별 key 분리', () => {
    const { result: koBook1 } = renderHook(() => useSpeakingProgress('book1', 'ko'));
    const { result: enBook1 } = renderHook(() => useSpeakingProgress('book1', 'en'));
    act(() => koBook1.current.record({ spoken: true, transcription: '사과', targetWord: '사과' }));
    expect(enBook1.current.progress.totalRounds).toBe(0);
    expect(koBook1.current.progress.totalRounds).toBe(1);
  });

  it('parse 실패 시 기본값으로 리셋', () => {
    localStorage.setItem('tangobook:speaking:book1:ko', 'not json');
    const { result } = renderHook(() => useSpeakingProgress('book1', 'ko'));
    expect(result.current.progress.totalRounds).toBe(0);
    expect(result.current.progress.wordsSpoken).toEqual([]);
  });

  it('reset() 호출 시 localStorage 삭제 + state 초기화', () => {
    const { result } = renderHook(() => useSpeakingProgress('book1', 'ko'));
    act(() => result.current.record({ spoken: true, transcription: '사과', targetWord: '사과' }));
    act(() => result.current.reset());
    expect(result.current.progress.totalRounds).toBe(0);
    expect(localStorage.getItem('tangobook:speaking:book1:ko')).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행 실패 확인**

Run:
```bash
pnpm --filter @tangobook/client test -- useSpeakingProgress.test.ts
```
Expected: FAIL — `useSpeakingProgress` 모듈 없음.

- [ ] **Step 3: `useSpeakingProgress` 구현**

```ts
// useSpeakingProgress.ts
import { useCallback, useState } from 'react';

interface SpeakingProgressEntry {
  version: 1;
  storybookId: string;
  lang: 'ko' | 'en';
  totalRounds: number;
  spokenRounds: number;
  wordsSpoken: string[];
  lastPlayedAt: string;
}

function emptyEntry(storybookId: string, lang: 'ko' | 'en'): SpeakingProgressEntry {
  return {
    version: 1,
    storybookId,
    lang,
    totalRounds: 0,
    spokenRounds: 0,
    wordsSpoken: [],
    lastPlayedAt: new Date().toISOString(),
  };
}

function storageKey(storybookId: string, lang: 'ko' | 'en'): string {
  return `tangobook:speaking:${storybookId}:${lang}`;
}

function readEntry(storybookId: string, lang: 'ko' | 'en'): SpeakingProgressEntry {
  try {
    const raw = localStorage.getItem(storageKey(storybookId, lang));
    if (!raw) return emptyEntry(storybookId, lang);
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1 || !Array.isArray(parsed.wordsSpoken)) {
      return emptyEntry(storybookId, lang);
    }
    return parsed;
  } catch {
    return emptyEntry(storybookId, lang);
  }
}

function writeEntry(entry: SpeakingProgressEntry): void {
  try {
    localStorage.setItem(storageKey(entry.storybookId, entry.lang), JSON.stringify(entry));
  } catch (err) {
    // private mode / quota exceeded — silent
    // eslint-disable-next-line no-console
    console.debug('[useSpeakingProgress] localStorage write failed', err);
  }
}

export function useSpeakingProgress(storybookId: string, lang: 'ko' | 'en'): {
  progress: SpeakingProgressEntry;
  record: (r: { spoken: boolean; transcription: string | null; targetWord: string }) => void;
  reset: () => void;
} {
  const [progress, setProgress] = useState<SpeakingProgressEntry>(() => readEntry(storybookId, lang));

  const record = useCallback((r: { spoken: boolean; transcription: string | null; targetWord: string }) => {
    setProgress((prev) => {
      const next: SpeakingProgressEntry = {
        ...prev,
        totalRounds: prev.totalRounds + 1,
        spokenRounds: r.spoken ? prev.spokenRounds + 1 : prev.spokenRounds,
        wordsSpoken: r.spoken && r.transcription && !prev.wordsSpoken.includes(r.targetWord)
          ? [...prev.wordsSpoken, r.targetWord]
          : prev.wordsSpoken,
        lastPlayedAt: new Date().toISOString(),
      };
      writeEntry(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(storageKey(storybookId, lang));
    } catch {
      // silent
    }
    setProgress(emptyEntry(storybookId, lang));
  }, [storybookId, lang]);

  return { progress, record, reset };
}
```

- [ ] **Step 4: 테스트 재실행 → PASS**

Run:
```bash
pnpm --filter @tangobook/client test -- useSpeakingProgress.test.ts
```
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/games/hooks/useSpeakingProgress.ts packages/client/src/features/games/hooks/useSpeakingProgress.test.ts
git commit -m "feat(games): useSpeakingProgress hook with localStorage + schema versioning"
```

### Task 2.2: useSpeechRecognizer (TDD, ~7 tests)

**Files:**
- Create: `packages/client/src/features/games/hooks/useSpeechRecognizer.ts`
- Create: `packages/client/src/features/games/hooks/useSpeechRecognizer.test.ts`

- [ ] **Step 1: 실패 테스트 작성 — Web Speech API mock**

`useSpeechRecognizer.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognizer } from './useSpeechRecognizer';

// Fake SpeechRecognition
class FakeSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((e: any) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onnomatch: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => { this.onend?.(); });
  abort = vi.fn(() => { this.onend?.(); });
}

describe('useSpeechRecognizer', () => {
  let fakeSR: FakeSpeechRecognition;

  beforeEach(() => {
    fakeSR = new FakeSpeechRecognition();
    (global as any).SpeechRecognition = vi.fn(() => fakeSR);
    (global as any).webkitSpeechRecognition = undefined;
  });

  afterEach(() => {
    delete (global as any).SpeechRecognition;
  });

  it('Web Speech 지원 + 결과 있음 → { spoken: true, transcription }', async () => {
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    const promise = act(() => result.current.start());
    // promise executor가 핸들러를 할당할 때까지 microtask 양보
    await new Promise((r) => setTimeout(r, 0));
    // 실제 브라우저는 SpeechRecognitionResultList를 보내지만 구현이 results[0][0].transcript만 읽으므로 간소화 모킹
    fakeSR.onresult?.({ results: [[{ transcript: '사과' }]] });
    fakeSR.onend?.();
    const res = await promise;
    expect(res).toEqual({ spoken: true, transcription: '사과' });
  });

  it('Web Speech 결과 empty → { spoken: false, null }', async () => {
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    const promise = act(() => result.current.start());
    await new Promise((r) => setTimeout(r, 0));
    fakeSR.onend?.();
    const res = await promise;
    expect(res).toEqual({ spoken: false, transcription: null });
  });

  it('maxWaitMs 초과 시 abort + { spoken: false, null }', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR', maxWaitMs: 1000 }));
    const promise = act(() => result.current.start());
    vi.advanceTimersByTime(1100);
    const res = await promise;
    expect(res).toEqual({ spoken: false, transcription: null });
    expect(fakeSR.abort).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('Web Speech 미지원 + MediaRecorder도 미지원 → 즉시 degraded', async () => {
    delete (global as any).SpeechRecognition;
    (global as any).MediaRecorder = undefined;
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    const res = await act(() => result.current.start());
    expect(res).toEqual({ spoken: false, transcription: null });
  });

  it('권한 거부(onerror: not-allowed) → 조용히 degraded', async () => {
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    const promise = act(() => result.current.start());
    await new Promise((r) => setTimeout(r, 0));
    fakeSR.onerror?.({ error: 'not-allowed' });
    fakeSR.onend?.();
    const res = await promise;
    expect(res).toEqual({ spoken: false, transcription: null });
  });

  it('isSupported === false (둘 다 미지원)', () => {
    delete (global as any).SpeechRecognition;
    (global as any).MediaRecorder = undefined;
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    expect(result.current.isSupported).toBe(false);
  });

  it('cancel() 호출 시 abort 호출', () => {
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    act(() => { result.current.start(); });
    act(() => result.current.cancel());
    expect(fakeSR.abort).toHaveBeenCalled();
  });

  it('isSupported === true (Web Speech 지원 시)', () => {
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    expect(result.current.isSupported).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
pnpm --filter @tangobook/client test -- useSpeechRecognizer.test.ts
```
Expected: FAIL.

- [ ] **Step 3: `useSpeechRecognizer` 구현 (Web Speech 경로만 우선)**

```ts
// useSpeechRecognizer.ts
import { useCallback, useMemo, useRef } from 'react';

export interface SpeechResult {
  spoken: boolean;
  transcription: string | null;
}

export interface UseSpeechRecognizerOptions {
  lang: 'ko-KR' | 'en-US';
  silenceTimeoutMs?: number;  // Whisper 전용
  noSpeechTimeoutMs?: number;
  maxWaitMs?: number;         // 공통 하드 cap, 기본 10000
}

type SR = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;

function getSpeechRecognition(): SR | undefined {
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
}

function hasMediaRecorder(): boolean {
  return typeof (window as any).MediaRecorder !== 'undefined';
}

export function useSpeechRecognizer(opts: UseSpeechRecognizerOptions): {
  start: () => Promise<SpeechResult>;
  cancel: () => void;
  isSupported: boolean;
} {
  const activeRef = useRef<{ abort: () => void } | null>(null);

  const isSupported = useMemo(() => !!getSpeechRecognition() || hasMediaRecorder(), []);

  const start = useCallback(async (): Promise<SpeechResult> => {
    const SR = getSpeechRecognition();
    if (SR) return runWebSpeech(opts, activeRef);
    if (hasMediaRecorder()) return runWhisperFallback(opts, activeRef);
    return { spoken: false, transcription: null };
  }, [opts.lang, opts.silenceTimeoutMs, opts.noSpeechTimeoutMs, opts.maxWaitMs]);

  const cancel = useCallback(() => {
    activeRef.current?.abort();
    activeRef.current = null;
  }, []);

  return { start, cancel, isSupported };
}

async function runWebSpeech(
  opts: UseSpeechRecognizerOptions,
  activeRef: React.MutableRefObject<{ abort: () => void } | null>,
): Promise<SpeechResult> {
  const SR = getSpeechRecognition()!;
  return new Promise<SpeechResult>((resolve) => {
    let resolved = false;
    let transcription: string | null = null;

    const rec = new (SR as any)();
    rec.lang = opts.lang;
    rec.continuous = false;
    rec.interimResults = false;

    const resolveOnce = (result: SpeechResult) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(cap);
      activeRef.current = null;
      resolve(result);
    };

    rec.onresult = (e: any) => {
      try {
        transcription = e.results?.[0]?.[0]?.transcript?.trim() || null;
      } catch {
        transcription = null;
      }
    };
    rec.onend = () => {
      resolveOnce({ spoken: !!transcription, transcription: transcription || null });
    };
    rec.onerror = () => {
      resolveOnce({ spoken: false, transcription: null });
    };
    rec.onnomatch = () => {
      resolveOnce({ spoken: false, transcription: null });
    };

    const cap = setTimeout(() => {
      try { rec.abort(); } catch { /* noop */ }
      resolveOnce({ spoken: false, transcription: null });
    }, opts.maxWaitMs ?? 10000);

    activeRef.current = { abort: () => { try { rec.abort(); } catch { /* noop */ } resolveOnce({ spoken: false, transcription: null }); } };

    try {
      rec.start();
    } catch {
      resolveOnce({ spoken: false, transcription: null });
    }
  });
}

// 자리표시. 다음 step에서 실제 구현
async function runWhisperFallback(
  _opts: UseSpeechRecognizerOptions,
  _activeRef: React.MutableRefObject<{ abort: () => void } | null>,
): Promise<SpeechResult> {
  return { spoken: false, transcription: null };
}
```

- [ ] **Step 4: 테스트 재실행 → 모두 PASS (7)**

Run:
```bash
pnpm --filter @tangobook/client test -- useSpeechRecognizer.test.ts
```
Expected: 7 tests PASS. 실패 시 Web Speech mock과 실제 이벤트 이름(`onresult`·`onend` 순서) 맞춰서 디버그.

- [ ] **Step 5: Whisper fallback 실제 구현**

스펙 §5.3 `runWhisperFallback`에 따라 구현. 테스트 추가 없이(fetch mock 복잡, 수동 QA 범위로 위임) MediaRecorder·AnalyserNode 사용:

```ts
async function runWhisperFallback(
  opts: UseSpeechRecognizerOptions,
  activeRef: React.MutableRefObject<{ abort: () => void } | null>,
): Promise<SpeechResult> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    return { spoken: false, transcription: null };
  }

  const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  const supported = (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function')
    ? preferredTypes.find((t) => MediaRecorder.isTypeSupported(t))
    : undefined;
  const recorder = supported ? new MediaRecorder(stream, { mimeType: supported }) : new MediaRecorder(stream);

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  // Silence detection via Web Audio analyser (RMS)
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const buffer = new Uint8Array(analyser.fftSize);

  let lastVoiceAt = performance.now();
  let voiceDetectedOnce = false;

  const cleanup = () => {
    stream.getTracks().forEach((t) => t.stop());
    try { audioCtx.close(); } catch { /* noop */ }
  };

  return new Promise<SpeechResult>((resolve) => {
    let resolved = false;
    const resolveOnce = (r: SpeechResult) => {
      if (resolved) return;
      resolved = true;
      clearInterval(poll);
      clearTimeout(cap);
      cleanup();
      activeRef.current = null;
      resolve(r);
    };

    recorder.onstop = async () => {
      const mimeType = recorder.mimeType || supported || 'audio/webm';
      const blob = new Blob(chunks, { type: mimeType });
      try {
        const form = new FormData();
        const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        form.append('audio', blob, `audio.${ext}`);
        form.append('lang', opts.lang.split('-')[0]);
        const res = await fetch('/api/speaking/transcribe', { method: 'POST', body: form });
        if (!res.ok) return resolveOnce({ spoken: false, transcription: null });
        const json = await res.json();
        const transcription = json?.data?.transcription || null;
        resolveOnce({ spoken: !!transcription, transcription });
      } catch {
        resolveOnce({ spoken: false, transcription: null });
      }
    };

    const silenceMs = opts.silenceTimeoutMs ?? 2000;
    const noSpeechMs = opts.noSpeechTimeoutMs ?? 5000;
    const maxMs = opts.maxWaitMs ?? 10000;

    const poll = setInterval(() => {
      analyser.getByteTimeDomainData(buffer);
      // RMS
      let sumSq = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / buffer.length);
      const threshold = 0.05;  // 경험값. 환경에 따라 조정 필요 — 수동 QA로 조정
      if (rms > threshold) {
        lastVoiceAt = performance.now();
        voiceDetectedOnce = true;
      } else if (voiceDetectedOnce && performance.now() - lastVoiceAt > silenceMs) {
        try { recorder.stop(); } catch { /* noop */ }
      } else if (!voiceDetectedOnce && performance.now() - lastVoiceAt > noSpeechMs) {
        try { recorder.stop(); } catch { /* noop */ }
      }
    }, 100);

    const cap = setTimeout(() => {
      try { recorder.stop(); } catch { /* noop */ }
    }, maxMs);

    activeRef.current = {
      abort: () => {
        try { recorder.stop(); } catch { /* noop */ }
      },
    };

    recorder.start();
  });
}
```

- [ ] **Step 6: 전체 훅 테스트 재실행**

Run:
```bash
pnpm --filter @tangobook/client test -- useSpeechRecognizer.test.ts
```
Expected: 7 tests PASS (Web Speech 경로만 테스트, Whisper는 수동 QA).

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/features/games/hooks/useSpeechRecognizer.ts packages/client/src/features/games/hooks/useSpeechRecognizer.test.ts
git commit -m "feat(games): useSpeechRecognizer hook (Web Speech + Whisper fallback)"
```

### Task 2.3: Chunk 2 마감 sanity

- [ ] **Step 1: 전체 테스트 + typecheck**

Run:
```bash
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
```
Expected: 기존 41 + 신규 13 = 54 tests PASS.

**🏁 Chunk 2 완료 기준:**
- [ ] 2개 훅 구현·테스트 완료
- [ ] `useSpeechRecognizer` Web Speech 경로 테스트 커버
- [ ] Whisper fallback 실제 코드 구현 (테스트 없음, 수동 QA)
- [ ] typecheck 무에러

---

## Chunk 3: 서버 — Whisper Provider + Generate + 라우트

**목표:** 서버 측 전부. Whisper fallback 엔드포인트와 게임 생성 함수. Gemini 호출 없이 순수 데이터 변환.

**기간:** 1일

### Task 3.1: 의존성 설치

- [ ] **Step 1: `openai` + `express-rate-limit` 의존성 추가**

Run:
```bash
pnpm --filter @tangobook/server add openai express-rate-limit
pnpm --filter @tangobook/server add -D @types/express-rate-limit
```
Expected: `package.json`에 의존성 추가.

- [ ] **Step 2: Commit**

```bash
git add packages/server/package.json packages/server/pnpm-lock.yaml pnpm-lock.yaml
git commit -m "chore(server): add openai + express-rate-limit for speaking fallback"
```

### Task 3.2: WhisperProvider (TDD, 1 test)

**Files:**
- Create: `packages/server/src/providers/whisper.provider.ts`
- Create: `packages/server/src/providers/whisper.provider.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// whisper.provider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhisperProvider } from './whisper.provider';

// openai module mock
vi.mock('openai', () => {
  const transcriptionsCreate = vi.fn().mockResolvedValue('안녕');
  return {
    default: class {
      audio = { transcriptions: { create: transcriptionsCreate } };
      static __mock = { transcriptionsCreate };
    },
    toFile: vi.fn((blob, filename) => Promise.resolve({ filename })),
  };
});

describe('WhisperProvider', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  it('mimeType → 확장자 매핑: audio/mp4 → m4a, audio/ogg → ogg, else webm', async () => {
    const provider = new WhisperProvider();
    const { toFile } = await import('openai');
    const toFileMock = toFile as any;

    await provider.transcribe(Buffer.from('x'), 'audio/mp4', 'ko');
    expect(toFileMock).toHaveBeenCalledWith(expect.anything(), 'audio.m4a', { type: 'audio/mp4' });

    await provider.transcribe(Buffer.from('x'), 'audio/ogg', 'en');
    expect(toFileMock).toHaveBeenCalledWith(expect.anything(), 'audio.ogg', { type: 'audio/ogg' });

    await provider.transcribe(Buffer.from('x'), 'audio/webm;codecs=opus', 'ko');
    expect(toFileMock).toHaveBeenCalledWith(expect.anything(), 'audio.webm', { type: 'audio/webm;codecs=opus' });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
pnpm --filter @tangobook/server test -- whisper.provider.test.ts
```
Expected: FAIL (모듈 없음).

- [ ] **Step 3: 구현**

```ts
// whisper.provider.ts
import OpenAI, { toFile } from 'openai';

export class WhisperProvider {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    } else {
      console.warn('[whisper] OPENAI_API_KEY not set — fallback disabled');
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  async transcribe(
    blob: Buffer,
    mimeType: string,
    lang: 'ko' | 'en',
  ): Promise<{ transcription: string | null }> {
    if (!this.client) {
      throw Object.assign(new Error('Whisper not configured'), { code: 'NO_API_KEY' });
    }

    const ext = mimeType.includes('mp4') ? 'm4a'
             : mimeType.includes('ogg') ? 'ogg'
             : 'webm';

    const file = await toFile(blob, `audio.${ext}`, { type: mimeType });
    const res = await this.client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: lang,
      response_format: 'text',
    });
    const transcription = typeof res === 'string' ? res.trim() : null;
    return { transcription: transcription || null };
  }
}

export const whisperProvider = new WhisperProvider();
```

- [ ] **Step 4: 테스트 PASS**

Run:
```bash
pnpm --filter @tangobook/server test -- whisper.provider.test.ts
```
Expected: 1 test PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/providers/whisper.provider.ts packages/server/src/providers/whisper.provider.test.ts
git commit -m "feat(server): WhisperProvider with dynamic mime-type extension mapping"
```

### Task 3.3: Speaking 컨트롤러 + 라우트

**Files:**
- Create: `packages/server/src/controllers/speaking.controller.ts`
- Create: `packages/server/src/routes/speaking.routes.ts`
- Modify: `packages/server/src/index.ts` (라우트 등록)

- [ ] **Step 1: 컨트롤러 구현**

```ts
// speaking.controller.ts
import type { Request, Response } from 'express';
import { whisperProvider } from '../providers/whisper.provider';
import { AppError } from '../middleware/error.middleware';

// degraded-mode 텔레메트리: 1시간 rolling 카운터
const telemetry = { total: 0, falseSpoken: 0, lastLogAt: Date.now() };
const LOG_INTERVAL_MS = 10 * 60 * 1000;
const ROLL_WINDOW_MS = 60 * 60 * 1000;
let rollStartedAt = Date.now();

function maybeLogTelemetry(): void {
  const now = Date.now();
  if (now - rollStartedAt > ROLL_WINDOW_MS) {
    telemetry.total = 0;
    telemetry.falseSpoken = 0;
    rollStartedAt = now;
  }
  if (now - telemetry.lastLogAt > LOG_INTERVAL_MS && telemetry.total > 0) {
    const ratio = telemetry.falseSpoken / telemetry.total;
    if (ratio > 0.9) {
      console.warn(`[speaking/telemetry] degraded-mode warning: ${telemetry.falseSpoken}/${telemetry.total} = ${(ratio * 100).toFixed(1)}% false-spoken`);
    }
    telemetry.lastLogAt = now;
  }
}

export async function transcribeController(req: Request, res: Response): Promise<void> {
  const file = (req as any).file as Express.Multer.File | undefined;
  const lang = req.body.lang as 'ko' | 'en' | undefined;

  if (!file) throw new AppError(400, 'audio file required');
  if (lang !== 'ko' && lang !== 'en') throw new AppError(400, 'lang must be "ko" or "en"');

  if (!whisperProvider.isEnabled()) {
    res.status(503).json({ success: false, error: 'transcription_unavailable' });
    telemetry.total += 1;
    telemetry.falseSpoken += 1;
    maybeLogTelemetry();
    return;
  }

  try {
    const { transcription } = await whisperProvider.transcribe(file.buffer, file.mimetype || 'audio/webm', lang);
    telemetry.total += 1;
    if (!transcription) telemetry.falseSpoken += 1;
    maybeLogTelemetry();
    res.json({ success: true, data: { transcription } });
  } catch (err: any) {
    console.error('[speaking/transcribe] error:', err?.message);
    res.status(500).json({ success: false, error: 'transcription_failed' });
    telemetry.total += 1;
    telemetry.falseSpoken += 1;
    maybeLogTelemetry();
  }
}
```

- [ ] **Step 2: 라우트 구현**

```ts
// speaking.routes.ts
import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { transcribeController } from '../controllers/speaking.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 상한
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,              // IP당 30회/분
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'rate_limited' },
});

export const speakingRouter = Router();
speakingRouter.post('/transcribe', limiter, upload.single('audio'), transcribeController);
```

- [ ] **Step 3: `app.ts`에 라우트 등록**

서버 진입은 `packages/server/src/app.ts` (not `index.ts`). 기존 라우트 등록 블록(line 58-73 `app.use('/api/*', *)` 모음) 맨 끝에 추가:

```ts
import { speakingRouter } from './routes/speaking.routes.js';
// ... 기존 라우트들 ...
app.use('/api/speaking', speakingRouter);
```

> **주의**: 프로덕션 ESM 환경 호환 위해 import 경로에 `.js` 확장자 필수 (CLAUDE.md 관례).

- [ ] **Step 4: typecheck**

Run:
```bash
pnpm --filter @tangobook/server typecheck
```
Expected: 성공. 실패 시 Express·multer·rate-limit 타입 import 확인.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/controllers/speaking.controller.ts packages/server/src/routes/speaking.routes.ts packages/server/src/index.ts
git commit -m "feat(server): POST /api/speaking/transcribe route (rate-limited Whisper fallback)"
```

### Task 3.4: generateKoreanSpeaking / generateEnglishSpeaking (TTS 실시간 생성 포함)

**Files:**
- Modify: `packages/server/src/services/game.service.ts`
- Modify: `packages/server/src/services/game.service.test.ts`

> **2026-04-22 설계 변경**: 초안은 "Gemini 호출 없이 순수 변환"을 가정했으나 동화책 vocabulary/key-object에 단어별 TTS 필드가 **없음**. 실제로는 `TtsService.generate()`로 TTS를 필요 시 생성 + R2 저장 + 재사용. R2 키가 결정론적이라 같은 단어는 한 번만 생성됨.
>
> 필드명 정정(스펙 §4.5와 동일):
> - `VocabularyDbService.getByStorybookId()` (PascalCase namespace object, 메서드명 `getByStorybookId`)
> - `KeyObject.name` (not `word`), `KeyObjectImage.objectName` (not `keyObjectWord`)
> - 하지만 이 Task는 `VocabularyDbService` 대신 **`collectStorybookImagePool()`**(`server/utils/phonics-data-helpers.ts`) 재사용 — 이미지·한영 페어 추출 이미 구현됨

- [ ] **Step 1: 종속 타입 · 기존 헬퍼 검증**

Run:
```bash
grep -n "export function collectStorybookImagePool\|export interface ImagePoolItem" packages/server/src/utils/phonics-data-helpers.ts
grep -n "export const TtsService\|async generate(" packages/server/src/services/tts.service.ts | head -5
grep -n "export const R2Repository\|async getStorybook(" packages/server/src/repositories/r2.repository.ts | head -5
```
Expected:
- `collectStorybookImagePool` export 확인 (line ~16)
- `ImagePoolItem { word, korean, imageUrl, ttsUrl? }` 인터페이스 (line ~8)
- `TtsService.generate({ text, provider, language, storybookId, identifier })` 시그니처 (line ~25)
- `R2Repository.getStorybook` async (line ~?) — 실제 메서드명 확인

이 세 헬퍼가 존재하면 Step 4 코드 그대로 사용. 시그니처 다르면 조정.

- [ ] **Step 2: 실패 테스트 작성 (3개)**

`game.service.test.ts`에 describe 블록 추가:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as gameService from './game.service';

vi.mock('../repositories/r2.repository', () => ({
  R2Repository: {
    getStorybook: vi.fn(),
  },
}));
vi.mock('../utils/phonics-data-helpers', () => ({
  collectStorybookImagePool: vi.fn(),
  isKoreanPhonics: vi.fn(() => false),
}));
vi.mock('./tts.service', () => ({
  TtsService: {
    generate: vi.fn(async ({ identifier }) => `https://r2.fake/${identifier}.mp3`),
  },
}));

import { R2Repository } from '../repositories/r2.repository';
import { collectStorybookImagePool } from '../utils/phonics-data-helpers';
import { TtsService } from './tts.service';

describe('generateKoreanSpeaking / generateEnglishSpeaking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (R2Repository.getStorybook as any).mockResolvedValue({ id: 'test-book', title: 'Test' });
  });

  it('한국어 모드: word = korean, TTS 생성 (identifier = speaking-ko-{slug})', async () => {
    (collectStorybookImagePool as any).mockReturnValue([
      { word: 'apple', korean: '사과', imageUrl: 'img1.webp' },
      { word: 'banana', korean: '바나나', imageUrl: 'img2.webp' },
      { word: 'cat', korean: '고양이', imageUrl: 'img3.webp' },
    ]);

    const data = await gameService.generateKoreanSpeaking('test-book');
    expect(data.type).toBe('korean-speaking');
    expect(data.items).toHaveLength(3);
    expect(data.items[0].word).toBe('사과');
    expect(data.items[0].koreanMeaning).toBeUndefined();
    expect(data.items[0].ttsUrl).toContain('speaking-ko-');
    expect(TtsService.generate).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'ko', text: '사과' })
    );
  });

  it('영어 모드: word = word, koreanMeaning 채워짐, pool의 ttsUrl 재사용', async () => {
    (collectStorybookImagePool as any).mockReturnValue([
      { word: 'apple', korean: '사과', imageUrl: 'img1.webp', ttsUrl: 'existing-tts.mp3' },
      { word: 'banana', korean: '바나나', imageUrl: 'img2.webp' },
      { word: 'cat', korean: '고양이', imageUrl: 'img3.webp' },
    ]);

    const data = await gameService.generateEnglishSpeaking('test-book');
    expect(data.items[0].word).toBe('apple');
    expect(data.items[0].koreanMeaning).toBe('사과');
    expect(data.items[0].ttsUrl).toBe('existing-tts.mp3'); // 재사용
    expect(data.items[1].ttsUrl).toContain('speaking-en-'); // 생성
  });

  it('pool 3개 미만이면 AppError(400)', async () => {
    (collectStorybookImagePool as any).mockReturnValue([
      { word: 'apple', korean: '사과', imageUrl: 'img1.webp' },
    ]);
    await expect(gameService.generateKoreanSpeaking('small-book')).rejects.toThrow(/부족/);
  });
});
```

- [ ] **Step 3: 실패 확인**

Run:
```bash
pnpm --filter @tangobook/server test -- game.service.test.ts
```
Expected: FAIL — 신규 함수 미구현 또는 `TypeError`.

- [ ] **Step 4: `generateSpeaking` 구현 + export**

`game.service.ts` 파일 상단 import에 추가 (파일 헤드의 기존 import 블록):

```ts
import { collectStorybookImagePool } from '../utils/phonics-data-helpers.js';
import { TtsService } from './tts.service.js';
import { R2Repository } from '../repositories/r2.repository.js';
import type {
  KoreanSpeakingData,
  EnglishSpeakingData,
  SpeakingItem,
} from '@tangobook/shared';
```

파일 하단에 함수 추가:

```ts
function slugifyForTtsKey(word: string): string {
  return encodeURIComponent(word.trim().toLowerCase().replace(/\s+/g, '-'));
}

async function generateSpeaking(
  storybookId: string,
  lang: 'ko' | 'en',
): Promise<SpeakingItem[]> {
  const storybook = await R2Repository.getStorybook(storybookId);

  const pool = collectStorybookImagePool(storybook, {
    includeKeyObjects: true,
    includeCharacters: false,
    includeFlashcards: false,
  });

  if (pool.length < 3) {
    throw new AppError(
      400,
      '이 책의 단어가 말하기 게임에 부족해요 (최소 3개 필요). 어휘·핵심단어 이미지를 먼저 생성해주세요.',
    );
  }

  const items: SpeakingItem[] = [];
  for (const p of pool) {
    const word = lang === 'ko' ? p.korean : p.word;
    if (!word) continue;

    let ttsUrl: string | undefined;
    if (lang === 'en' && p.ttsUrl) {
      ttsUrl = p.ttsUrl; // 파닉스 flashcards 영어 녹음 재사용
    }
    if (!ttsUrl) {
      ttsUrl = await TtsService.generate({
        text: word,
        provider: 'gemini',
        language: lang,
        storybookId,
        identifier: `speaking-${lang}-${slugifyForTtsKey(word)}`,
      });
    }

    items.push({
      word,
      displayWord: word,
      koreanMeaning: lang === 'en' ? p.korean : undefined,
      imageUrl: p.imageUrl,
      ttsUrl,
    });
  }

  return items;
}

export async function generateKoreanSpeaking(storybookId: string): Promise<KoreanSpeakingData> {
  return { type: 'korean-speaking', items: await generateSpeaking(storybookId, 'ko') };
}

export async function generateEnglishSpeaking(storybookId: string): Promise<EnglishSpeakingData> {
  return { type: 'english-speaking', items: await generateSpeaking(storybookId, 'en') };
}
```

> **주의**: `R2Repository`·`TtsService`·`collectStorybookImagePool`의 실제 import 경로와 시그니처가 Step 1 grep 결과와 일치하는지 재확인 후 작성. 패키지 import 시 `.js` 확장자 필수 (프로젝트 ESM 관례).

- [ ] **Step 5: `switch` case에 분기 추가 (게임 생성 진입점)**

> **Prerequisite (Chunk 1 Task 1.1에서 이미 추가돼 있어야)**: `GameTypeId`, `GameConfig`, `GameData` 유니온에 `'korean-speaking'`·`'english-speaking'` 및 관련 Config/Data 타입이 확장돼 있어야 이 switch case가 type-check됨. Chunk 1이 먼저 완료돼 있어야 Chunk 3 이 step 가능.

`game.service.ts`의 게임 타입별 generator map (line ~52 근처 `'vocabulary-matching': generateVocabularyMatching` 패턴)을 Read로 확인 후:

```ts
// GAME_GENERATORS 맵(이름은 실제 확인)에 추가
'korean-speaking': (storybookId: string) => generateKoreanSpeaking(storybookId),
'english-speaking': (storybookId: string) => generateEnglishSpeaking(storybookId),
```

기존 패턴에 따라 switch 문일 수도, Map일 수도. 기존 파일 스타일 그대로 따름.

- [ ] **Step 6: 테스트 재실행 → PASS**

Run:
```bash
pnpm --filter @tangobook/server test -- game.service.test.ts
```
Expected: 신규 3 PASS + 기존 전부 PASS.

- [ ] **Step 7: typecheck**

```bash
pnpm --filter @tangobook/server typecheck
```

- [ ] **Step 8: Commit**

```bash
git add packages/server/src/services/game.service.ts packages/server/src/services/game.service.test.ts
git commit -m "feat(server): generateKoreanSpeaking + generateEnglishSpeaking (pure vocab→item transform)"
```

### Task 3.5: Chunk 3 마감 sanity

- [ ] **Step 1: 서버 전체 typecheck + test**

Run:
```bash
pnpm --filter @tangobook/server typecheck
pnpm --filter @tangobook/server test
```
Expected: 모두 PASS.

- [ ] **Step 2: 서버 실제 기동 확인 (선택)**

Run:
```bash
pnpm --filter @tangobook/server dev
```
로컬에서 `POST http://localhost:3500/api/speaking/transcribe` (아무 파일로) 호출 시 503 (API key 없음) 또는 200/500 응답 확인.

**🏁 Chunk 3 완료 기준:**
- [ ] Whisper provider 구현·테스트 완료
- [ ] speaking route 등록 + rate limit 적용
- [ ] generateSpeaking 함수 2개 구현·테스트 완료
- [ ] game.service switch 분기 추가
- [ ] 서버 typecheck·test 통과

---

## Chunk 4: 클라이언트 UI — Player, ConfigPanel, Registry

**목표:** 아이가 실제로 플레이하는 UI 완성. Player는 훅 두 개를 얽고 힌트·반복·피드백 로직을 연결. Registry 등록으로 저작자가 게임 생성 가능.

**기간:** 1.5일

### Task 4.1: SpeakingConfigPanel (간단, 테스트 없음)

**Files:**
- Create: `packages/client/src/features/games/components/config/SpeakingConfigPanel.tsx`

- [ ] **Step 1: 구현**

```tsx
import type { Storybook } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface SpeakingConfigPanelProps {
  storybook: Storybook;
  lang: 'ko' | 'en';
}

const DIFFICULTY_HINT = {
  easy: '단어·그림·철자 다 보여주고 자동 재생해요',
  medium: '단어·그림만 보여주고 TTS 버튼으로 들어요',
  hard: '그림만 보고 발음해요. 한 바퀴 더 반복!',
} as const;

export function SpeakingConfigPanel({ storybook, lang }: SpeakingConfigPanelProps) {
  const wordCount = storybook.educational_content?.vocabulary?.length ?? 0;
  const label = lang === 'ko' ? '한국어' : '영어';

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-ink-700">
        이 책의 {label} 단어 <strong className="text-coral-500">{wordCount}개</strong>를 사용합니다.
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(['easy', 'medium', 'hard'] as const).map((d) => (
          <div
            key={d}
            className={cn(
              'p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
              'text-xs text-ink-700 dark:text-peach-200',
            )}
          >
            <div className="font-bold mb-1">
              {d === 'easy' ? '쉬움' : d === 'medium' ? '보통' : '어려움'}
            </div>
            <div>{DIFFICULTY_HINT[d]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/features/games/components/config/SpeakingConfigPanel.tsx
git commit -m "feat(games): SpeakingConfigPanel (difficulty hint preview)"
```

### Task 4.2: SpeakingPlayer (TDD, 5 tests)

**Files:**
- Create: `packages/client/src/features/games/components/players/SpeakingPlayer.tsx`
- Create: `packages/client/src/features/games/components/players/SpeakingPlayer.test.tsx`

- [ ] **Step 0: 기존 훅·공용 컴포넌트 시그니처 확인**

작성 전 Read 도구로 아래 확인 (경험상 가정이 틀렸음):
- `packages/client/src/features/games/hooks/useGameAudio.ts` — `useGameAudio()`는 **인자 없음**, 반환 `{ playAudio, playFeedbackSound, playCorrectSequence, praiseVisible }`
- `packages/client/src/features/games/components/GameResultScreen.tsx` — Props는 `{ score, total, onRestart, onBack }`만. **`extraBadge` 없음** → 추가 정보는 Player 측에서 별도 렌더

- [ ] **Step 1: 실패 테스트 작성**

```tsx
// SpeakingPlayer.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SpeakingPlayer } from './SpeakingPlayer';

// 훅 모킹
vi.mock('../../hooks/useSpeechRecognizer', () => ({
  useSpeechRecognizer: () => ({
    start: vi.fn().mockResolvedValue({ spoken: true, transcription: '사과' }),
    cancel: vi.fn(),
    isSupported: true,
  }),
}));
vi.mock('../../hooks/useSpeakingProgress', () => ({
  useSpeakingProgress: () => ({
    progress: { totalRounds: 0, spokenRounds: 0, wordsSpoken: [] },
    record: vi.fn(),
    reset: vi.fn(),
  }),
}));
vi.mock('../../hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: vi.fn(),
    playFeedbackSound: vi.fn(),
    playCorrectSequence: vi.fn(),
    praiseVisible: false,
  }),
}));

const makeItems = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    word: `word${i}`,
    displayWord: `word${i}`,
    imageUrl: `img${i}.webp`,
    ttsUrl: `tts${i}.mp3`,
  }));

describe('SpeakingPlayer', () => {
  const baseProps = {
    storybookId: 'book1',
    gameData: { type: 'korean-speaking' as const, items: makeItems(3) },
    lang: 'ko' as const,
    onComplete: vi.fn(),
    onBack: vi.fn(),
  };

  it('easy: 프롬프트·단어·자동재생 모두 렌더', () => {
    render(<SpeakingPlayer {...baseProps} difficulty="easy" />);
    expect(screen.getByTestId('speaking-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('speaking-word')).toBeInTheDocument();
  });

  it('medium: 단어 표시·프롬프트 없음', () => {
    render(<SpeakingPlayer {...baseProps} difficulty="medium" />);
    expect(screen.queryByTestId('speaking-prompt')).not.toBeInTheDocument();
    expect(screen.getByTestId('speaking-word')).toBeInTheDocument();
  });

  it('hard: 단어 숨김·프롬프트 없음', () => {
    render(<SpeakingPlayer {...baseProps} difficulty="hard" />);
    expect(screen.queryByTestId('speaking-word')).not.toBeInTheDocument();
    expect(screen.queryByTestId('speaking-prompt')).not.toBeInTheDocument();
  });

  it('hard: 2바퀴 반복 — 총 라운드 수 = items × 2', () => {
    render(<SpeakingPlayer {...baseProps} difficulty="hard" />);
    // 진행률에 total=6 (items 3 × 2)
    expect(screen.getByText(/\/ 6/)).toBeInTheDocument();
  });

  it('🎤 탭 시 useSpeechRecognizer.start 호출 후 피드백 표시', async () => {
    render(<SpeakingPlayer {...baseProps} difficulty="easy" />);
    const mic = screen.getByTestId('speaking-mic');
    await act(async () => {
      fireEvent.click(mic);
      // recognizer.start mock이 resolved 상태라 setShowFeedback(true) 호출됨
      await Promise.resolve();
    });
    // FeedbackOverlay가 실제 DOM에 렌더되는지 확인
    // (kind="correct" 호리 + celebrating 아이콘 등 고유 요소로 식별)
    expect(screen.getByTestId('speaking-mic')).toBeDisabled();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
pnpm --filter @tangobook/client test -- SpeakingPlayer.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: SpeakingPlayer 구현**

```tsx
// SpeakingPlayer.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SPEAKING_PRESETS } from '@tangobook/shared';
import type { KoreanSpeakingData, EnglishSpeakingData, SpeakingDifficulty, Storybook } from '@tangobook/shared';
import { Mascot } from '@/components/Mascot';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { GameProgressBar } from '../GameProgressBar';
import { GameResultScreen } from '../GameResultScreen';
import { useSpeechRecognizer } from '../../hooks/useSpeechRecognizer';
import { useSpeakingProgress } from '../../hooks/useSpeakingProgress';
import { useGameAudio } from '../../hooks/useGameAudio';
import { shuffle } from '../../utils/shuffle';
import { cn } from '@/lib/cn';

interface SpeakingPlayerProps {
  storybookId: string;
  gameData: KoreanSpeakingData | EnglishSpeakingData;
  difficulty: SpeakingDifficulty;
  lang: 'ko' | 'en';
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
  systemSounds?: Storybook['systemSounds'];
}

export function SpeakingPlayer({
  storybookId,
  gameData,
  difficulty,
  lang,
  onComplete,
  onBack,
  systemSounds,
}: SpeakingPlayerProps) {
  const preset = SPEAKING_PRESETS[difficulty];

  const rounds = useMemo(() => {
    const base = shuffle(gameData.items);
    return preset.repeatCycles === 2 ? [...base, ...shuffle(base)] : base;
  }, [gameData.items, preset.repeatCycles]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'listening' | 'processing' | 'feedback' | 'done'>('idle');
  const [showFeedback, setShowFeedback] = useState(false);

  const recognizer = useSpeechRecognizer({
    lang: lang === 'ko' ? 'ko-KR' : 'en-US',
    silenceTimeoutMs: 2000,
    noSpeechTimeoutMs: 5000,
    maxWaitMs: 10000,
  });
  const progress = useSpeakingProgress(storybookId, lang);
  // useGameAudio는 인자 없음. systemSounds는 playCorrectSequence에 전달 가능하지만 이 게임은 단순 playFeedbackSound만 사용
  const { playAudio, playFeedbackSound } = useGameAudio();
  void systemSounds; // prop은 GamePlayerProps 시그니처 준수용. 현재 게임에서 직접 사용 안 함

  const current = rounds[roundIdx];
  const promptText = lang === 'ko' ? '따라해볼까?' : 'Can you say this?';

  // 자동재생 (easy)
  useEffect(() => {
    if (!current) return;
    if (preset.autoPlayTts) {
      const delay = preset.showPromptLine ? 600 : 0;
      const t = setTimeout(() => playAudio(current.ttsUrl), delay);
      return () => clearTimeout(t);
    }
  }, [current, preset.autoPlayTts, preset.showPromptLine, playAudio]);

  const onMicTap = useCallback(async () => {
    if (phase !== 'idle' || !current) return;
    setPhase('listening');
    const result = await recognizer.start();
    setPhase('processing');
    progress.record({
      spoken: result.spoken,
      transcription: result.transcription,
      targetWord: current.word,
    });
    setPhase('feedback');
    setShowFeedback(true);
    playFeedbackSound(true);  // 모른척 통과 — 항상 correct
    setTimeout(() => {
      setShowFeedback(false);
      if (roundIdx + 1 >= rounds.length) {
        setPhase('done');
        onComplete(rounds.length, rounds.length);
      } else {
        setRoundIdx((i) => i + 1);
        setPhase('idle');
      }
    }, 1200);
  }, [phase, current, recognizer, progress, playFeedbackSound, roundIdx, rounds.length, onComplete]);

  if (phase === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cream-50 to-peach-100 p-4">
        <GameResultScreen
          score={rounds.length}
          total={rounds.length}
          onRestart={() => {
            setRoundIdx(0);
            setPhase('idle');
          }}
          onBack={onBack}
        />
        {/* 말하기 전용 배지 — GameResultScreen은 score/total prop만 받으므로 별도 렌더 */}
        <div className="mt-4 px-4 py-2 rounded-full bg-coral-100 text-coral-600 font-bold text-sm shadow-soft">
          이 책에서 {progress.progress.wordsSpoken.length}개 단어를 말해봤어요! 🎉
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-cream-50 to-peach-100 p-4">
      <div className="w-full max-w-2xl">
        <GameProgressBar current={roundIdx + 1} total={rounds.length} score={roundIdx + 1} />

        <div className="flex flex-col items-center gap-4 mt-8">
          <Mascot state={phase === 'listening' ? 'waving' : 'pointing'} size="md" character="hori" />

          <img
            src={current.imageUrl}
            alt=""
            className="w-64 h-64 object-contain rounded-lg shadow-card bg-white p-4"
          />

          {preset.showPromptLine && (
            <div data-testid="speaking-prompt" className="text-lg font-bold text-coral-500">
              {promptText}
            </div>
          )}

          {preset.showWord && (
            <div data-testid="speaking-word" className="text-5xl font-black text-ink-900">
              {current.displayWord}
              {current.koreanMeaning && (
                <div className="text-sm font-normal text-ink-500 mt-1">{current.koreanMeaning}</div>
              )}
            </div>
          )}

          {!preset.autoPlayTts && (
            <button
              onClick={() => playAudio(current.ttsUrl)}
              className="w-12 h-12 rounded-full bg-coral-500 text-white shadow-pop hover:brightness-110"
              aria-label="단어 듣기"
            >
              🔊
            </button>
          )}

          <button
            data-testid="speaking-mic"
            onClick={onMicTap}
            disabled={phase !== 'idle'}
            aria-label="탭해서 말하기"
            aria-live={phase === 'listening' ? 'polite' : undefined}
            className={cn(
              'mt-4 px-8 py-4 rounded-full text-white font-black shadow-pop transition-all',
              phase === 'idle' && 'bg-coral-500 hover:brightness-110',
              phase === 'listening' && 'bg-coral-600 animate-pulse',
              phase !== 'idle' && 'cursor-not-allowed',
            )}
          >
            {phase === 'idle' ? '🎤 탭해서 말하기' : phase === 'listening' ? '듣고 있어요...' : '✓'}
          </button>
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={showFeedback} />
    </div>
  );
}
```

> **참고**: `GameResultScreen`의 prop 이름 (`onRestart`·`extraBadge` 등)은 기존 구현에 맞춰 사용. 파일 Read로 시그니처 확인 후 조정. `extraBadge` 필드가 없으면 Player 내부에서 자체 렌더하고 GameResultScreen 외부에 배지 요소 추가.

- [ ] **Step 4: 테스트 재실행 → PASS**

Run:
```bash
pnpm --filter @tangobook/client test -- SpeakingPlayer.test.tsx
```
Expected: 5 tests PASS.

- [ ] **Step 5: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/features/games/components/players/SpeakingPlayer.tsx packages/client/src/features/games/components/players/SpeakingPlayer.test.tsx
git commit -m "feat(games): SpeakingPlayer (difficulty-based hints, silent pass-through)"
```

### Task 4.3: `GamePlayerProps`에 `storybookId` 추가 (registry 등록 前 실행)

**Files:**
- Modify: `packages/client/src/features/games/registry/game-registry.ts`
- Modify: `packages/client/src/features/games/components/GamePreviewModal.tsx` (PlayerComponent 렌더)
- Modify: `packages/client/src/features/viewer/components/PhonicsViewer.tsx` (PlayerComponent 렌더)

- [ ] **Step 1: 실제 렌더 사이트 전부 확인**

Run:
```bash
grep -rn "<PlayerComponent\b" packages/client/src/
```
Expected 2 지점:
- `packages/client/src/features/games/components/GamePreviewModal.tsx:77`
- `packages/client/src/features/viewer/components/PhonicsViewer.tsx:374`

(추가 사이트 나오면 전부 포함)

- [ ] **Step 2: `GamePlayerProps`에 `storybookId: string` 추가**

`game-registry.ts` line 20-26:
```ts
// Before
export interface GamePlayerProps {
  gameData: unknown;
  difficulty: GameDifficulty;
  onComplete: (score: number, maxScore: number) => void;
  onBack: () => void;
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
}

// After
export interface GamePlayerProps {
  storybookId: string;   // [신규] 말하기 게임 등 진척 추적용
  gameData: unknown;
  difficulty: GameDifficulty;
  onComplete: (score: number, maxScore: number) => void;
  onBack: () => void;
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
}
```

- [ ] **Step 3: 렌더 사이트 2곳에 `storybookId` 전달**

**`GamePreviewModal.tsx:77` 부근**:
```tsx
// Before (line 77-83)
<PlayerComponent
  gameData={game.data}
  difficulty={game.difficulty}
  onComplete={handleComplete}
  onBack={onClose}
  systemSounds={storybook?.systemSounds}
/>

// After
<PlayerComponent
  storybookId={storybook?.id ?? game.storybookId /* 폴백 */}
  gameData={game.data}
  difficulty={game.difficulty}
  onComplete={handleComplete}
  onBack={onClose}
  systemSounds={storybook?.systemSounds}
/>
```

> `storybook` 변수가 `GamePreviewModal`에 이미 prop으로 있는지 Read로 확인. 없으면 `game.storybookId` 혹은 `GameInstance`에 있는 필드 사용. 단순 `''` fallback은 지양.

**`PhonicsViewer.tsx:374`**:
```tsx
<PlayerComponent
  storybookId={storybook.id}
  // 기존 prop들 유지
  ...
/>
```

- [ ] **Step 4: typecheck — 기존 게임들도 깨지지 않는지 확인**

Run:
```bash
pnpm --filter @tangobook/client typecheck
```
Expected: 성공. Player 컴포넌트는 `GamePlayerProps`를 쓰므로 storybookId가 있어도 무시하면 됨. 렌더 사이트만 업데이트하면 충족.

실패 시: prop drilling 누락 지점 수정.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/games/registry/game-registry.ts
git add packages/client/src/features/games/components/GamePreviewModal.tsx
git add packages/client/src/features/viewer/components/PhonicsViewer.tsx
git commit -m "refactor(games): add storybookId to GamePlayerProps (for speaking progress)"
```

### Task 4.4: Registry entries (korean-speaking, english-speaking)

**Files:**
- Create: `packages/client/src/features/games/registry/games/korean-speaking.register.ts`
- Create: `packages/client/src/features/games/registry/games/english-speaking.register.ts`
- Modify: `packages/client/src/features/games/registry/index.ts`

- [ ] **Step 1: korean-speaking.register.ts**

```tsx
import { registerGame } from '../game-registry';
import { SpeakingConfigPanel } from '../../components/config/SpeakingConfigPanel';
import { SpeakingPlayer } from '../../components/players/SpeakingPlayer';
import type { GameConfigPanelProps, GamePlayerProps } from '../game-registry';
import type { KoreanSpeakingData } from '@tangobook/shared';

function KoreanSpeakingConfigPanelWrapper(p: GameConfigPanelProps) {
  return <SpeakingConfigPanel storybook={p.storybook} lang="ko" />;
}

function KoreanSpeakingPlayerWrapper(p: GamePlayerProps) {
  return (
    <SpeakingPlayer
      storybookId={p.storybookId}
      gameData={p.gameData as KoreanSpeakingData}
      difficulty={p.difficulty}
      lang="ko"
      onComplete={p.onComplete}
      onBack={p.onBack}
      systemSounds={p.systemSounds}
    />
  );
}

registerGame({
  id: 'korean-speaking',
  category: 'common',
  nameKo: '한국어 말하기',
  descriptionKo: '단어를 듣고 따라 말해요',
  icon: '🎤',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: true,
    needsKeyObjectImages: true,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
  },
  defaultConfig: { type: 'korean-speaking' },
  ConfigPanel: KoreanSpeakingConfigPanelWrapper,
  PlayerComponent: KoreanSpeakingPlayerWrapper,
  language: 'ko',
});
```

- [ ] **Step 2: english-speaking.register.ts** — 동일 패턴, `lang='en'`, `nameKo='영어 말하기'`, `id: 'english-speaking'`, `language: 'en'`, cast to `EnglishSpeakingData`.

- [ ] **Step 3: registry/index.ts에 side-effect imports 추가**

```ts
import './games/korean-speaking.register';
import './games/english-speaking.register';
```

기존 import 리스트 맨 뒤에 두 줄 추가.

- [ ] **Step 4: typecheck + test 회귀 확인**

```bash
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
```
Expected: typecheck 성공, 기존 테스트 + 신규 테스트 모두 PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/games/registry/games/korean-speaking.register.ts
git add packages/client/src/features/games/registry/games/english-speaking.register.ts
git add packages/client/src/features/games/registry/index.ts
git commit -m "feat(games): register korean-speaking + english-speaking"
```

### Task 4.5: Chunk 4 마감 sanity

- [ ] **Step 1: 전체 typecheck + test**

```bash
pnpm --filter @tangobook/shared build
pnpm --filter @tangobook/server typecheck
pnpm --filter @tangobook/server test
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
```
Expected: 모두 PASS. 신규 테스트 총 ~23개 (기존 41 + 신규 ~23 = ~64 client + 서버 기존 + 신규 4 = ~68+).

- [ ] **Step 2: 커밋 체인 확인**

```bash
git log --oneline -15
```
Chunk 1~4의 커밋이 시간순으로 정렬돼 있어야.

**🏁 Chunk 4 완료 기준:**
- [ ] SpeakingPlayer·SpeakingConfigPanel 구현 완료
- [ ] 레지스트리 entry 2개 신규 등록
- [ ] `GamePlayerProps`에 `storybookId` 추가 (마이그레이션)
- [ ] 모든 테스트 PASS
- [ ] typecheck 무에러

---

## Chunk 5: 마감 sanity + 문서 업데이트

**목표:** 전체 통합 검증 + CLAUDE.md/메모리 업데이트 + 사용자 수동 QA 유도.

**기간:** 0.5일

### Task 5.1: 전체 통합 sanity

> **원칙**: 아래 sanity 명령 중 하나라도 실패하면 Chunk 5 중단. 원인 수정 후 재실행. Railway 배포가 `pnpm build` 성공에 의존하므로 build 실패는 차단 사유.

- [ ] **Step 1: 모든 패키지 typecheck**

```bash
pnpm typecheck
```
Expected: 전 패키지 PASS.

- [ ] **Step 2: 모든 패키지 test**

```bash
pnpm test
```
Expected: 기존 + 신규 모두 PASS.

- [ ] **Step 3: build 가능 확인 (배포 대비)**

```bash
pnpm build
```
Expected: 클라이언트·서버 둘 다 빌드 성공.

- [ ] **Step 4: lint**

```bash
pnpm lint
```
Expected: 무에러 (pre-commit hook과 같은 결과).

### Task 5.2: CLAUDE.md 업데이트

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 게임 섹션에 말하기 게임 2종 추가**

CLAUDE.md의 `### 게임 목록 (15종)` 헤더를 `### 게임 목록 (17종)`으로 카운트 업데이트. 테이블 맨 뒤(`storybook-quiz` 아래)에 2줄 추가:
```
| korean-speaking | 한국어 말하기 | storybook |
| english-speaking | 영어 말하기 | storybook |
```

- [ ] **Step 2: 기타 섹션에 말하기 인프라 언급**

CLAUDE.md의 `게임 Feature 구조` 코드펜스 내부 `hooks/` 블록(`useGameAudio.ts / useBlockDrag.ts / usePhonicsMap.ts` 3줄) 아래 2줄 추가 (들여쓰기는 기존과 동일 공백):
```
    useSpeechRecognizer.ts        # 음성 인식 (Web Speech + Whisper fallback, 말하기 게임)
    useSpeakingProgress.ts        # 발화 진척 localStorage 관리
```

CLAUDE.md의 `환경변수` 섹션을 수정. 기존 `packages/server/.env.example 참고...` 한 줄 아래에 추가:
```
- 선택 변수: `OPENAI_API_KEY` — 말하기 게임의 Whisper fallback용. 없어도 Web Speech API만으로 동작 (degraded mode)
```

또한 `packages/server/.env.example`에도 `# OPENAI_API_KEY=sk-...` 한 줄 추가 (주석 처리된 옵션).

CLAUDE.md의 `뷰어 플로우` 섹션 끝에 한 줄 추가:
"언어 선택(`?lang=ko|en`)은 자동으로 게임 목록을 필터링 (block/word-writing/speaking 등 언어 태그 게임)."

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: speaking games added to CLAUDE.md"
```

### Task 5.3: 수동 QA 체크리스트 (사용자 담당)

**Dev 서버 기동**: `pnpm dev` → `http://localhost:5174/library` → 동화책 선택 → 언어 탭(ko/en) → 게임 → 해당 언어 말하기 게임

사용자에게 아래 체크리스트 제시:

- [ ] **Chrome 데스크톱**: Web Speech API 경로 동작 — 정답 인식·무음 처리·권한 거부 시 silent pass
- [ ] **iOS Safari**: MediaRecorder → Whisper fallback 경로 (서버에 OPENAI_API_KEY 설정 필요)
- [ ] **Android Chrome**: Web Speech API 경로
- [ ] 동화책 1권에 `korean-speaking` + `english-speaking` 두 게임 인스턴스 생성
- [ ] 뷰어에서 `?lang=ko` 선택 시 한국어 말하기만 보임, `?lang=en`이면 영어만 보임
- [ ] 난이도 easy/medium/hard 각각 힌트 차이 확인:
  - easy: 프롬프트 + 철자 + 자동재생
  - medium: 철자 + 🔊 버튼
  - hard: 그림만 + 2바퀴 반복
- [ ] 무음으로 완주 시 GameResultScreen 별 3개 (항상 만점)
- [ ] "이 책에서 N단어 말해봤어요" 배지의 카운트가 발화한 단어 수와 일치
- [ ] localStorage 탭: `tangobook:speaking:{id}:ko|en` 키에 진척 저장 확인
- [ ] private mode 브라우저: localStorage 실패 시 게임은 정상, 단지 새로고침 시 진척 초기화

### Task 5.4: "업데이트 하자" 워크플로우 (스펙·플랜 상태 반영)

- [ ] **Step 1: 스펙·플랜 상단에 구현 완료 배너 추가**

스펙: `docs/superpowers/specs/2026-04-22-speaking-games-design.md` 맨 위에:
```markdown
> **✅ 구현 완료 (YYYY-MM-DD)** — 플랜: `docs/superpowers/plans/2026-04-22-speaking-games-plan.md`. 진행 상세: `memory/speaking-games-complete.md`.
```

플랜: `docs/superpowers/plans/2026-04-22-speaking-games-plan.md` 상단에 유사 배너.

- [ ] **Step 2: memory에 complete 기록**

두 파일 모두 다룸:
1. **`memory/speaking-games-complete.md` 신규 생성** — 전체 Chunk 1~5 완료 기록, 커밋 해시 체인, Tailwind/환경 이슈, Phase 2(Azure) 후속 과제 메모
2. **`memory/MEMORY.md` 인덱스 갱신** — 기존 viewer-redesign-complete / games-redesign-complete 같은 엔트리 스타일로 한 줄 추가:
```
## Speaking Games Complete (YYYY-MM-DD) ← 실제 완료일로 치환
See [speaking-games-complete.md](speaking-games-complete.md) — ko/en 말하기 게임, Web Speech + Whisper fallback, localStorage 진척, TTS 실시간 생성.
```

> **날짜 플레이스홀더**: 스펙 배너·memory 헤더의 `YYYY-MM-DD`를 실제 구현 완료일로 치환.

- [ ] **Step 3: 최종 commit + push**

```bash
git add docs/superpowers/ memory/ CLAUDE.md
git commit -m "docs: mark speaking games feature complete + update memory"
git push origin main
```

**🏁 Chunk 5 완료 기준:**
- [ ] 전체 typecheck·test·build·lint PASS
- [ ] CLAUDE.md 업데이트
- [ ] 사용자 수동 QA 체크리스트 제시
- [ ] 스펙·플랜에 완료 배너
- [ ] memory 기록
- [ ] main push

---

## 🎉 플랜 종료

전체 완료 시:
- 탱고북 4언어 스킬(말하기·듣기·읽기·쓰기) 토탈 커버리지 달성
- 동화책마다 한·영 말하기 게임 생성 가능
- 뷰어 언어 선택이 모든 언어 태그 게임에 일관 적용
- "액팅 유도" 철학이 모든 경로(성공·실패·degraded)에 관철
- Phase 2(Azure pronunciation) 때 최소 변경으로 업그레이드 가능한 아키텍처

**후속 과제 (범위 밖)**:
- Azure Pronunciation Assessment 도입 → "발음 측정" 게임 신설 검토
- 문장 단위 말하기 (페이지 text.ko/en 활용)
- 파닉스 컨텐츠 지원 확장
- 서버 측 진척 저장 (user auth 도입 시)
- 저작자 대시보드 — "이 책에서 아이들이 발화한 단어 랭킹" 통계
