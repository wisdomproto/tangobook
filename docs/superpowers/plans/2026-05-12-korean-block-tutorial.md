# 한글 블록 게임 튜토리얼 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 쉬움 레벨 한글 블록 게임에 "🪄 도와줘" 버튼 + 호리 시연 튜토리얼 추가 — 자모 pop / 화살표 슬라이드 / 셀 glow 시퀀스로 정답 자모-셀 매핑을 보여줌. 음성 5종 + 말풍선.

**Architecture:** TutorialContext 로 KoreanBlockPlayer 내부 BlockTile/그리드셀에 highlight 상태 전파. KoreanBlockTutorial 컴포넌트가 state machine + 호리 + 말풍선 + Arrow SVG overlay 소유. 풀 디커플 — 게임 로직과 튜토리얼 로직 분리.

**Tech Stack:** React 18 + TypeScript + framer-motion (기존 의존성) + Tailwind (vh-clamp 패턴) + Vitest (단위 테스트) + 기존 `<Mascot>` / `useGameAudio` 재활용

**Spec**: [docs/superpowers/specs/2026-05-12-korean-block-tutorial-design.md](../specs/2026-05-12-korean-block-tutorial-design.md)

---

## 파일 구조

신규 파일 (모두 `packages/client/src/features/games/components/players/KoreanBlockTutorial/`):
- `KoreanBlockTutorial.tsx` — 메인 컴포넌트 (state machine + 호리 + 말풍선 + Arrow SVG)
- `KoreanBlockTutorial.constants.ts` — 멘트 텍스트 + 음성 mp3 경로 + 타이밍 상수
- `KoreanBlockTutorial.context.tsx` — TutorialContext (popJamo / glowCell / arrowState 공유)
- `KoreanBlockTutorial.layout.ts` — `planTutorialLayout(word)` pure function
- `KoreanBlockTutorial.layout.test.ts` — vitest 단위 테스트

수정 파일:
- `packages/client/src/features/games/components/players/KoreanBlockPlayer.tsx`:
  - `difficulty` prop 사용 (현재 미사용)
  - 도와줘 버튼 추가 (Section 1, 쉬움 일 때만)
  - `isPlaying` state — 튜토리얼 중 모든 인터랙션 차단
  - `BlockTile` 와 grid cell 이 `TutorialContext` 소비 (highlight)
  - `<KoreanBlockTutorial>` 렌더 (overlay)
- `packages/client/src/pages/RandomBlockGamePage.tsx`:
  - 현재 hardcoded `difficulty="medium"` → 실제 레벨 매핑 (L1→easy, L2→medium, L3→hard)

음성 파일 (사용자 제공, 코드는 경로만 가정):
- `packages/client/public/sounds/games/tutorial/hori-{intro,pop,place,syllable-done,end}.mp3`

---

## Task 1: 레이아웃 플래너 (TDD)

**Files:**
- Create: `packages/client/src/features/games/components/players/KoreanBlockTutorial/KoreanBlockTutorial.layout.ts`
- Test: `packages/client/src/features/games/components/players/KoreanBlockTutorial/KoreanBlockTutorial.layout.test.ts`

쉬움 단어 (CV, 받침 X, 최대 2음절) 의 정답 자모-셀 매핑 생성. 좌→우 진행, 수직 모음 시 row 2 사용.

- [ ] **Step 1: Write the failing test**

`packages/client/src/features/games/components/players/KoreanBlockTutorial/KoreanBlockTutorial.layout.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { planTutorialLayout } from './KoreanBlockTutorial.layout';

describe('planTutorialLayout', () => {
  it('가 — 수평 모음 1음절', () => {
    expect(planTutorialLayout('가')).toEqual([
      { cho: 'ㄱ', jung: 'ㅏ', choCell: [1, 0], jungCell: [1, 1], isVertical: false },
    ]);
  });

  it('구 — 수직 모음 1음절', () => {
    expect(planTutorialLayout('구')).toEqual([
      { cho: 'ㄱ', jung: 'ㅜ', choCell: [1, 0], jungCell: [2, 0], isVertical: true },
    ]);
  });

  it('나무 — 수평 + 수직', () => {
    expect(planTutorialLayout('나무')).toEqual([
      { cho: 'ㄴ', jung: 'ㅏ', choCell: [1, 0], jungCell: [1, 1], isVertical: false },
      { cho: 'ㅁ', jung: 'ㅜ', choCell: [1, 2], jungCell: [2, 2], isVertical: true },
    ]);
  });

  it('구두 — 수직 2음절', () => {
    expect(planTutorialLayout('구두')).toEqual([
      { cho: 'ㄱ', jung: 'ㅜ', choCell: [1, 0], jungCell: [2, 0], isVertical: true },
      { cho: 'ㄷ', jung: 'ㅜ', choCell: [1, 1], jungCell: [2, 1], isVertical: true },
    ]);
  });

  it('토끼 — 수직 + 수평', () => {
    expect(planTutorialLayout('토끼')).toEqual([
      { cho: 'ㅌ', jung: 'ㅗ', choCell: [1, 0], jungCell: [2, 0], isVertical: true },
      { cho: 'ㄲ', jung: 'ㅣ', choCell: [1, 1], jungCell: [1, 2], isVertical: false },
    ]);
  });

  it('빈 문자열 — 빈 배열', () => {
    expect(planTutorialLayout('')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter client exec vitest run KoreanBlockTutorial.layout.test.ts`
Expected: FAIL with "Cannot find module './KoreanBlockTutorial.layout'"

- [ ] **Step 3: Write minimal implementation**

`packages/client/src/features/games/components/players/KoreanBlockTutorial/KoreanBlockTutorial.layout.ts`:

```ts
import { decomposeWord } from '@tangobook/shared';

const VERT_JUNG = new Set(['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ']);

export interface TutorialSyllable {
  cho: string;
  jung: string;
  choCell: [number, number];
  jungCell: [number, number];
  isVertical: boolean;
}

/**
 * 쉬움 레벨 단어 (CV, 받침 X) 의 정답 자모-셀 매핑 생성.
 * 좌→우 진행, 수직 모음 (ㅗㅛㅜㅠㅡ) 시 row 2 사용.
 * row 1 베이스 — 1행은 비워두고 시각 가운데.
 */
export function planTutorialLayout(word: string): TutorialSyllable[] {
  const syllables = decomposeWord(word);
  const plan: TutorialSyllable[] = [];
  let col = 0;
  for (const syl of syllables) {
    if (!syl.cho || !syl.jung) continue;
    const isVertical = VERT_JUNG.has(syl.jung);
    if (isVertical) {
      plan.push({
        cho: syl.cho,
        jung: syl.jung,
        choCell: [1, col],
        jungCell: [2, col],
        isVertical: true,
      });
      col += 1;
    } else {
      plan.push({
        cho: syl.cho,
        jung: syl.jung,
        choCell: [1, col],
        jungCell: [1, col + 1],
        isVertical: false,
      });
      col += 2;
    }
  }
  return plan;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter client exec vitest run KoreanBlockTutorial.layout.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/games/components/players/KoreanBlockTutorial/
git commit -m "feat(games): 한글블록 튜토리얼 레이아웃 플래너 + 테스트"
```

---

## Task 2: 상수 파일 (멘트 / 음성 경로 / 타이밍)

**Files:**
- Create: `packages/client/src/features/games/components/players/KoreanBlockTutorial/KoreanBlockTutorial.constants.ts`

- [ ] **Step 1: 상수 파일 작성**

```ts
/**
 * 한글 블록 튜토리얼 — 멘트 텍스트 + 음성 mp3 경로 + 타이밍.
 * 음성 mp3 미존재 시 말풍선만 graceful display (4-5세 못 읽어도 시각 단서).
 */
export const TUTORIAL_AUDIO_BASE = '/sounds/games/tutorial';

export const TUTORIAL_LINES = {
  intro: {
    text: '안녕! 같이 만들어 볼까?',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-intro.mp3`,
  },
  pop: {
    text: '이거!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-pop.mp3`,
  },
  place: {
    text: '여기에!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-place.mp3`,
  },
  syllableDone: {
    text: '잘했어! 완성!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-syllable-done.mp3`,
  },
  end: {
    text: '이제 네 차례야!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-end.mp3`,
  },
} as const;

/** 각 phase 의 ms duration. spec design 와 일치. */
export const TUTORIAL_TIMING = {
  intro: 1200,
  pop: 500,
  arrow: 600,
  place: 500,
  syllableDone: 600,
  end: 1300,
  fadeOut: 300,
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/features/games/components/players/KoreanBlockTutorial/KoreanBlockTutorial.constants.ts
git commit -m "feat(games): 한글블록 튜토리얼 멘트/타이밍 상수"
```

---

## Task 3: TutorialContext (highlight 공유)

**Files:**
- Create: `packages/client/src/features/games/components/players/KoreanBlockTutorial/KoreanBlockTutorial.context.tsx`

KoreanBlockTutorial 가 publish → BlockTile / 그리드셀 / Arrow 가 consume. KoreanBlockPlayer 가 Provider 감쌈.

- [ ] **Step 1: Context 파일 작성**

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface TutorialHighlight {
  /** 현재 pop 중인 자모 문자 (panel BlockTile 이 자기 char 과 일치 시 애니메이션 적용) */
  popJamo: string | null;
  /** 현재 glow 중인 grid cell `[row, col]` */
  glowCell: [number, number] | null;
  /** Arrow 시작 (자모 panel 타일) 의 data-jamo-tile attribute 값 */
  arrowFromJamo: string | null;
  /** Arrow 도착 (grid cell) 의 [row, col] */
  arrowToCell: [number, number] | null;
}

const EMPTY_HIGHLIGHT: TutorialHighlight = {
  popJamo: null,
  glowCell: null,
  arrowFromJamo: null,
  arrowToCell: null,
};

interface TutorialContextValue {
  highlight: TutorialHighlight;
  setHighlight: (next: TutorialHighlight) => void;
  isPlaying: boolean;
  setIsPlaying: (next: boolean) => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [highlight, setHighlight] = useState<TutorialHighlight>(EMPTY_HIGHLIGHT);
  const [isPlaying, setIsPlaying] = useState(false);
  const value = useMemo(
    () => ({ highlight, setHighlight, isPlaying, setIsPlaying }),
    [highlight, isPlaying]
  );
  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

/** Tutorial 외부에서 호출 시 EMPTY 반환 (Provider 없이도 동작) */
export function useTutorialHighlight(): TutorialHighlight {
  const ctx = useContext(TutorialContext);
  return ctx?.highlight ?? EMPTY_HIGHLIGHT;
}

/** isPlaying 만 필요한 컴포넌트용 */
export function useTutorialIsPlaying(): boolean {
  const ctx = useContext(TutorialContext);
  return ctx?.isPlaying ?? false;
}

/** Tutorial 자체에서 state 수정 */
export function useTutorialControls(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorialControls must be inside TutorialProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/features/games/components/players/KoreanBlockTutorial/KoreanBlockTutorial.context.tsx
git commit -m "feat(games): 한글블록 튜토리얼 Context (highlight + isPlaying)"
```

---

## Task 4: KoreanBlockTutorial 메인 — state machine + 호리 + 말풍선

**Files:**
- Create: `packages/client/src/features/games/components/players/KoreanBlockTutorial/KoreanBlockTutorial.tsx`

본체. 호리 + 말풍선 + state machine. Arrow SVG 는 Task 5 에 추가.

- [ ] **Step 1: 메인 컴포넌트 작성 (state machine + 호리 + 말풍선만, Arrow 없이)**

```tsx
import { useEffect, useRef, useState, type RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mascot } from '@/design-system';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useTutorialControls } from './KoreanBlockTutorial.context';
import { planTutorialLayout, type TutorialSyllable } from './KoreanBlockTutorial.layout';
import { TUTORIAL_LINES, TUTORIAL_TIMING } from './KoreanBlockTutorial.constants';

interface KoreanBlockTutorialProps {
  /** 시연할 단어 (currentItem.word) */
  word: string;
  /** 활성화 여부 — false 면 idle 만, true 면 시퀀스 진행 */
  active: boolean;
  /** 시퀀스 끝 콜백 — KoreanBlockPlayer 에서 isPlaying = false 처리는 context 가 알아서 */
  onEnd: () => void;
  /** 그리드/패널 영역 ref — Arrow 좌표 계산 시 사용 (Task 5) */
  gridRef: RefObject<HTMLDivElement>;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'intro' }
  | { kind: 'pop'; charIdx: number }
  | { kind: 'arrow'; charIdx: number }
  | { kind: 'place'; charIdx: number }
  | { kind: 'syllable-done' }
  | { kind: 'end' }
  | { kind: 'fade-out' };

interface CharStep {
  jamo: string;
  cell: [number, number];
}

function flattenLayout(plan: TutorialSyllable[]): CharStep[] {
  const steps: CharStep[] = [];
  for (const syl of plan) {
    steps.push({ jamo: syl.cho, cell: syl.choCell });
    steps.push({ jamo: syl.jung, cell: syl.jungCell });
  }
  return steps;
}

export function KoreanBlockTutorial({ word, active, onEnd, gridRef: _gridRef }: KoreanBlockTutorialProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const { setHighlight, setIsPlaying } = useTutorialControls();
  const { playAudio } = useGameAudio();
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const steps = flattenLayout(planTutorialLayout(word));

  // active=true 진입 시 intro 부터 시작
  useEffect(() => {
    if (active && phase.kind === 'idle') {
      setIsPlaying(true);
      setPhase({ kind: 'intro' });
    }
    if (!active && phase.kind !== 'idle') {
      // 외부에서 강제 종료 — cleanup
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      setHighlight({ popJamo: null, glowCell: null, arrowFromJamo: null, arrowToCell: null });
      setIsPlaying(false);
      setPhase({ kind: 'idle' });
    }
  }, [active, phase.kind, setHighlight, setIsPlaying]);

  // phase 전환 — 각 phase 마다 audio 재생 + highlight 갱신 + 다음 phase 예약
  useEffect(() => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    if (phase.kind === 'idle') return;

    const advance = (next: Phase, delayMs: number) => {
      phaseTimerRef.current = setTimeout(() => setPhase(next), delayMs);
    };

    if (phase.kind === 'intro') {
      playAudio(TUTORIAL_LINES.intro.audio);
      setHighlight({ popJamo: null, glowCell: null, arrowFromJamo: null, arrowToCell: null });
      advance({ kind: 'pop', charIdx: 0 }, TUTORIAL_TIMING.intro);
      return;
    }
    if (phase.kind === 'pop') {
      const step = steps[phase.charIdx];
      if (!step) {
        setPhase({ kind: 'end' });
        return;
      }
      playAudio(TUTORIAL_LINES.pop.audio);
      setHighlight({
        popJamo: step.jamo,
        glowCell: null,
        arrowFromJamo: null,
        arrowToCell: null,
      });
      advance({ kind: 'arrow', charIdx: phase.charIdx }, TUTORIAL_TIMING.pop);
      return;
    }
    if (phase.kind === 'arrow') {
      const step = steps[phase.charIdx];
      setHighlight({
        popJamo: step.jamo,
        glowCell: null,
        arrowFromJamo: step.jamo,
        arrowToCell: step.cell,
      });
      advance({ kind: 'place', charIdx: phase.charIdx }, TUTORIAL_TIMING.arrow);
      return;
    }
    if (phase.kind === 'place') {
      const step = steps[phase.charIdx];
      playAudio(TUTORIAL_LINES.place.audio);
      setHighlight({
        popJamo: null,
        glowCell: step.cell,
        arrowFromJamo: null,
        arrowToCell: null,
      });
      const isLast = phase.charIdx === steps.length - 1;
      const next: Phase = isLast ? { kind: 'syllable-done' } : { kind: 'pop', charIdx: phase.charIdx + 1 };
      advance(next, TUTORIAL_TIMING.place);
      return;
    }
    if (phase.kind === 'syllable-done') {
      playAudio(TUTORIAL_LINES.syllableDone.audio);
      setHighlight({ popJamo: null, glowCell: null, arrowFromJamo: null, arrowToCell: null });
      advance({ kind: 'end' }, TUTORIAL_TIMING.syllableDone);
      return;
    }
    if (phase.kind === 'end') {
      playAudio(TUTORIAL_LINES.end.audio);
      advance({ kind: 'fade-out' }, TUTORIAL_TIMING.end);
      return;
    }
    if (phase.kind === 'fade-out') {
      advance({ kind: 'idle' }, TUTORIAL_TIMING.fadeOut);
      // fade-out 끝 시 onEnd + isPlaying false
      const fadeTimer = setTimeout(() => {
        setIsPlaying(false);
        onEnd();
      }, TUTORIAL_TIMING.fadeOut);
      return () => clearTimeout(fadeTimer);
    }
  }, [phase, steps, playAudio, setHighlight, setIsPlaying, onEnd]);

  // unmount cleanup
  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  // 말풍선 텍스트
  const bubbleText = (() => {
    if (phase.kind === 'intro') return TUTORIAL_LINES.intro.text;
    if (phase.kind === 'pop') return TUTORIAL_LINES.pop.text;
    if (phase.kind === 'place') return TUTORIAL_LINES.place.text;
    if (phase.kind === 'syllable-done') return TUTORIAL_LINES.syllableDone.text;
    if (phase.kind === 'end') return TUTORIAL_LINES.end.text;
    return null;
  })();

  const visible = phase.kind !== 'idle';
  const mascotState = phase.kind === 'intro' ? 'waving' : 'pointing';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="hori-tutorial"
          className="fixed bottom-4 right-4 z-[90] flex items-end gap-2 pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: phase.kind === 'fade-out' ? 0 : 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {/* 말풍선 (호리 왼쪽) */}
          <AnimatePresence mode="wait">
            {bubbleText && (
              <motion.div
                key={`bubble-${phase.kind}-${'charIdx' in phase ? phase.charIdx : ''}`}
                className="relative bg-white/95 rounded-3xl shadow-pop px-5 py-3 max-w-[220px]"
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xl font-display font-black text-ink-900 whitespace-nowrap">
                  {bubbleText}
                </p>
                {/* 꼬리 — 우측을 가리킴 */}
                <div className="absolute right-[-8px] bottom-6 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-white/95" />
              </motion.div>
            )}
          </AnimatePresence>
          {/* 호리 */}
          <Mascot character="hori" state={mascotState} size="md" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/features/games/components/players/KoreanBlockTutorial/KoreanBlockTutorial.tsx
git commit -m "feat(games): 한글블록 튜토리얼 컴포넌트 — state machine + 호리 + 말풍선"
```

---

## Task 5: Arrow SVG overlay 추가

Tutorial 컴포넌트에 화살표 렌더 추가. `data-jamo-tile` 와 `data-grid-cell` 좌표 측정 후 SVG path.

**Files:**
- Modify: `packages/client/src/features/games/components/players/KoreanBlockTutorial/KoreanBlockTutorial.tsx`

- [ ] **Step 1: TutorialArrow 컴포넌트 추가 (같은 파일 하단)**

`KoreanBlockTutorial.tsx` 파일 끝에 (export function KoreanBlockTutorial 아래) 추가:

```tsx
function TutorialArrow({ fromJamo, toCell }: { fromJamo: string | null; toCell: [number, number] | null }) {
  const [coords, setCoords] = useState<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null>(null);

  useEffect(() => {
    if (!fromJamo || !toCell) {
      setCoords(null);
      return;
    }
    const tile = document.querySelector(`[data-jamo-tile="${fromJamo}"]`);
    const cell = document.querySelector(`[data-grid-cell="${toCell[0]}-${toCell[1]}"]`);
    if (!tile || !cell) {
      setCoords(null);
      return;
    }
    const tileRect = tile.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    setCoords({
      fromX: tileRect.left + tileRect.width / 2,
      fromY: tileRect.top + tileRect.height / 2,
      toX: cellRect.left + cellRect.width / 2,
      toY: cellRect.top + cellRect.height / 2,
    });
  }, [fromJamo, toCell]);

  if (!coords) return null;

  // Quadratic Bézier control point — 두 점 중간보다 위쪽 (살짝 곡선)
  const midX = (coords.fromX + coords.toX) / 2;
  const midY = Math.min(coords.fromY, coords.toY) - 40;
  const pathD = `M ${coords.fromX} ${coords.fromY} Q ${midX} ${midY} ${coords.toX} ${coords.toY}`;

  return (
    <svg
      className="fixed inset-0 z-[85] pointer-events-none"
      width="100%"
      height="100%"
      viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
      preserveAspectRatio="none"
    >
      <defs>
        <marker
          id="tutorial-arrowhead"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF7A3C" />
        </marker>
      </defs>
      <motion.path
        d={pathD}
        stroke="#FF7A3C"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
        markerEnd="url(#tutorial-arrowhead)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </svg>
  );
}
```

- [ ] **Step 2: 메인 컴포넌트에서 TutorialArrow 렌더**

`KoreanBlockTutorial` 함수 내 highlight 가져와서 렌더:

기존:
```tsx
  const visible = phase.kind !== 'idle';
  const mascotState = phase.kind === 'intro' ? 'waving' : 'pointing';

  return (
    <AnimatePresence>
```

수정 — `useTutorialControls` 로 highlight 도 가져오고 Arrow 도 렌더:
```tsx
  const visible = phase.kind !== 'idle';
  const mascotState = phase.kind === 'intro' ? 'waving' : 'pointing';
  const { highlight } = useTutorialControls();

  return (
    <>
      <TutorialArrow fromJamo={highlight.arrowFromJamo} toCell={highlight.arrowToCell} />
      <AnimatePresence>
```

그리고 `</AnimatePresence>` 뒤에 `</>` 닫기:
```tsx
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/features/games/components/players/KoreanBlockTutorial/KoreanBlockTutorial.tsx
git commit -m "feat(games): 한글블록 튜토리얼 Arrow SVG overlay (자모→셀 곡선)"
```

---

## Task 6: KoreanBlockPlayer 통합 — Provider + 도와줘 버튼 + disable

**Files:**
- Modify: `packages/client/src/features/games/components/players/KoreanBlockPlayer.tsx`

KoreanBlockPlayer 가:
1. `difficulty` prop 사용 — 쉬움 (easy) 일 때만 버튼 노출
2. `TutorialProvider` 로 자식 감싸기
3. 도와줘 버튼 추가 (Section 1)
4. BlockTile / 그리드셀이 context highlight 소비 → pop / glow 클래스 적용
5. `isPlaying` 일 때 패널 드래그 / 그리드 클릭 / 확인·초기화 비활성
6. `<KoreanBlockTutorial>` 렌더

- [ ] **Step 1: import 추가**

상단 import 블록 (line 1-14) 에 추가:

```tsx
import {
  TutorialProvider,
  useTutorialHighlight,
  useTutorialIsPlaying,
} from './KoreanBlockTutorial/KoreanBlockTutorial.context';
import { KoreanBlockTutorial } from './KoreanBlockTutorial/KoreanBlockTutorial';
```

- [ ] **Step 2: KoreanBlockPlayer 함수에서 difficulty 받기**

기존 (line 183):
```tsx
export function KoreanBlockPlayer({
  storybookId,
  gameData,
  onComplete: _onComplete,
  onBack,
}: GamePlayerProps) {
```

수정:
```tsx
export function KoreanBlockPlayer({
  storybookId,
  gameData,
  difficulty,
  onComplete: _onComplete,
  onBack,
}: GamePlayerProps) {
```

- [ ] **Step 3: KoreanBlockPlayer 본문을 inner 컴포넌트로 분리 + Provider wrap**

기존 export function 본체를 inner 컴포넌트로 옮기고, export function 은 Provider 만 감쌈:

KoreanBlockPlayer 함수 끝 (현재 line 597 부근, return 마무리 후) 의 `}` 닫는 줄 바로 위에 `}` 안 닫고 — 사실 더 간단히는 함수 이름 변경:

기존 `export function KoreanBlockPlayer` 를 `function KoreanBlockPlayerInner` 로 rename. 그리고 파일 끝에 새로운 export:

파일 끝에 추가 (BlockTile 정의 뒤):

```tsx
export function KoreanBlockPlayer(props: GamePlayerProps) {
  return (
    <TutorialProvider>
      <KoreanBlockPlayerInner {...props} />
    </TutorialProvider>
  );
}
```

기존 `export function KoreanBlockPlayer` 를 `function KoreanBlockPlayerInner` 로 변경 (export 빼고 Inner 붙임).

- [ ] **Step 4: 도와줘 버튼 추가 (Section 1)**

기존 (line 449-479 부근, Section 1):
```tsx
        <section className="rounded-3xl bg-white/85 backdrop-blur-sm shadow-pop border-2 border-white px-[clamp(1.5rem,4vw,4rem)] py-[clamp(0.375rem,1.25vh,1rem)] flex items-center justify-center gap-[clamp(0.75rem,2vw,2.5rem)] shrink-0 w-full max-w-3xl">
          <h1
            className="font-display font-black leading-none whitespace-nowrap"
            ...
          >
            {roundCorrect ? currentItem.word.slice(0, typedChars) : currentItem.word}
            ...
          </h1>
          {currentItem.imageUrl && (
            <div className="relative shrink-0">
              <img ... />
              <span className="absolute -top-1 -right-1 text-xl sm:text-2xl">✨</span>
            </div>
          )}
        </section>
```

`{currentItem.imageUrl && ...}` 뒤에 (section 닫기 전) 도와줘 버튼 추가. 쉬움일 때만:

```tsx
          {difficulty === 'easy' && (
            <button
              onClick={handleHintStart}
              disabled={hintActive || isPlaying}
              className="px-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.375rem,1.5vh,1rem)] rounded-full bg-gradient-to-b from-warn to-peach-500 text-white font-black text-[clamp(0.875rem,2vh,1.25rem)] shadow-pop hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0"
            >
              🪄 도와줘
            </button>
          )}
```

`isPlaying` 와 `hintActive` 와 `handleHintStart` 는 다음 Step 에서 정의.

- [ ] **Step 5: hintActive state + handleHintStart + useTutorialIsPlaying hook**

KoreanBlockPlayerInner 함수 상단 (다른 useState 들 근처, 약 line 192-200):

```tsx
  const [hintActive, setHintActive] = useState(false);
  const isPlaying = useTutorialIsPlaying();
  const handleHintStart = useCallback(() => {
    if (hintActive || isPlaying) return;
    setHintActive(true);
  }, [hintActive, isPlaying]);
  const handleHintEnd = useCallback(() => {
    setHintActive(false);
  }, []);
```

- [ ] **Step 6: 라운드 전환 시 hintActive 자동 reset**

기존 `handleCheck` 내 라운드 전환 (line 344-356 부근):

```tsx
        setTimeout(
          () => {
            if (currentIndex + 1 < items.length) {
              const nextIdx = currentIndex + 1;
              setCurrentIndex(nextIdx);
              setGrid(initGrid());
              setHasTriedThisRound(false);
              setRoundCorrect(false);
              setIsWrong(false);
            } else {
              setFinished(true);
            }
          },
```

수정 — `setHintActive(false);` 추가:

```tsx
        setTimeout(
          () => {
            if (currentIndex + 1 < items.length) {
              const nextIdx = currentIndex + 1;
              setCurrentIndex(nextIdx);
              setGrid(initGrid());
              setHasTriedThisRound(false);
              setRoundCorrect(false);
              setIsWrong(false);
              setHintActive(false);
            } else {
              setFinished(true);
            }
          },
```

`handleRestart` (line 394-403) 에도 추가:

```tsx
  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setFinished(false);
    wordResultsRef.current = [];
    setHasTriedThisRound(false);
    setRoundCorrect(false);
    setIsWrong(false);
    setGrid(initGrid());
    setHintActive(false);
  }, [initGrid]);
```

- [ ] **Step 7: BlockTile 가 highlight 소비 — pop 애니메이션**

기존 BlockTile (line 629-660 부근):

```tsx
function BlockTile({
  block,
  drag,
  onPlace,
}: {
  block: JamoBlock;
  drag: ReturnType<typeof useBlockDrag<JamoBlock>>;
  onPlace: (key: string, block: JamoBlock) => void;
}) {
  const vowel = isVowel(block.char);
  return (
    <div
      draggable
      onDragStart={(e) => drag.handleDragStart(block, e)}
      onTouchStart={(e) => drag.handleTouchStart(block, e)}
      onTouchMove={drag.handleTouchMove}
      onTouchEnd={(e) => drag.handleTouchEnd(e, onPlace)}
      className={cn(
        'w-[clamp(1.75rem,4.5vh,3rem)] h-[clamp(1.75rem,4.5vh,3rem)] rounded-xl flex items-center justify-center font-black text-[clamp(0.75rem,2.5vh,1.5rem)] select-none cursor-grab',
        'shadow-md transition-transform hover:scale-110 active:scale-95 active:cursor-grabbing',
        vowel
          ? 'bg-gradient-to-b from-coral-400 to-coral-600 text-white'
          : 'bg-gradient-to-b from-warn to-peach-500 text-white'
      )}
      style={{
        textShadow: '0 2px 0 rgba(0,0,0,0.12)',
      }}
    >
      {block.char}
    </div>
  );
}
```

수정 — `useTutorialHighlight` + `useTutorialIsPlaying` 사용:

```tsx
function BlockTile({
  block,
  drag,
  onPlace,
}: {
  block: JamoBlock;
  drag: ReturnType<typeof useBlockDrag<JamoBlock>>;
  onPlace: (key: string, block: JamoBlock) => void;
}) {
  const vowel = isVowel(block.char);
  const { popJamo } = useTutorialHighlight();
  const isPlaying = useTutorialIsPlaying();
  const popping = popJamo === block.char;
  return (
    <motion.div
      data-jamo-tile={block.char}
      draggable={!isPlaying}
      onDragStart={(e) => !isPlaying && drag.handleDragStart(block, e)}
      onTouchStart={(e) => !isPlaying && drag.handleTouchStart(block, e)}
      onTouchMove={drag.handleTouchMove}
      onTouchEnd={(e) => !isPlaying && drag.handleTouchEnd(e, onPlace)}
      animate={
        popping
          ? { scale: [1, 1.3, 1.1, 1.15, 1.1], rotate: [0, -8, 6, -4, 0] }
          : { scale: 1, rotate: 0 }
      }
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'w-[clamp(1.75rem,4.5vh,3rem)] h-[clamp(1.75rem,4.5vh,3rem)] rounded-xl flex items-center justify-center font-black text-[clamp(0.75rem,2.5vh,1.5rem)] select-none',
        isPlaying ? 'cursor-not-allowed' : 'cursor-grab',
        !isPlaying && 'active:scale-95 active:cursor-grabbing hover:scale-110',
        'shadow-md transition-shadow',
        popping && 'ring-4 ring-coral-300 shadow-pop',
        vowel
          ? 'bg-gradient-to-b from-coral-400 to-coral-600 text-white'
          : 'bg-gradient-to-b from-warn to-peach-500 text-white'
      )}
      style={{
        textShadow: '0 2px 0 rgba(0,0,0,0.12)',
      }}
    >
      {block.char}
    </motion.div>
  );
}
```

상단 import 에 framer-motion 의 motion 추가 — 이미 line 2 에 `import { motion } from 'framer-motion';` 있음. ✓

- [ ] **Step 8: 그리드 셀이 highlight 소비 — glow + disable**

기존 (line 513-545 부근, 그리드 셀 렌더):

```tsx
                  return (
                    <div
                      key={cellKey}
                      ref={drag.cellRef(cellKey)}
                      onDragOver={drag.handleDragOver}
                      onDrop={(e) => drag.handleDrop(cellKey, e, onPlace)}
                      onClick={() => handleCellClick(row, col)}
                      className={cn(
                        'w-[clamp(2rem,5.5vh,4rem)] h-[clamp(2rem,5.5vh,4rem)]',
                        'rounded-2xl flex items-center justify-center select-none transition-all',
                        char ? 'cursor-pointer' : 'cursor-default',
                        char
                          ? 'bg-white shadow-soft border-2 border-cream-50'
                          : 'bg-peach-100/60 border-[3px] border-dashed border-peach-200 hover:border-coral-400 hover:bg-peach-100/80'
                      )}
                    >
```

수정 — context 사용 + `data-grid-cell` 추가 + glow:

```tsx
                  return (
                    <div
                      key={cellKey}
                      data-grid-cell={cellKey}
                      ref={drag.cellRef(cellKey)}
                      onDragOver={isPlaying ? undefined : drag.handleDragOver}
                      onDrop={isPlaying ? undefined : (e) => drag.handleDrop(cellKey, e, onPlace)}
                      onClick={() => !isPlaying && handleCellClick(row, col)}
                      className={cn(
                        'w-[clamp(2rem,5.5vh,4rem)] h-[clamp(2rem,5.5vh,4rem)]',
                        'rounded-2xl flex items-center justify-center select-none transition-all',
                        isPlaying ? 'cursor-not-allowed' : char ? 'cursor-pointer' : 'cursor-default',
                        char
                          ? 'bg-white shadow-soft border-2 border-cream-50'
                          : 'bg-peach-100/60 border-[3px] border-dashed border-peach-200',
                        !isPlaying && !char && 'hover:border-coral-400 hover:bg-peach-100/80',
                        glowCell && glowCell[0] === row && glowCell[1] === col &&
                          'ring-4 ring-coral-400 scale-110 bg-coral-50/80'
                      )}
                    >
```

함수 시작 부근에 `const { glowCell } = useTutorialHighlight();` 추가 (KoreanBlockPlayerInner 의 다른 hooks 옆).

이미 Task 6 Step 5 에서 추가했으므로 추가 import 만 확인. `useTutorialHighlight` 도 import.

- [ ] **Step 9: 확인/초기화 버튼 disabled 에 isPlaying 추가**

기존 (line 549-575 부근):

```tsx
            <button
              onClick={handleCheck}
              disabled={roundCorrect}
              ...
```

```tsx
            <button
              onClick={handleCheck}
              disabled={roundCorrect || isPlaying}
              ...
```

같은 식으로 초기화 버튼도:

```tsx
            <button
              onClick={handleResetGrid}
              disabled={roundCorrect || isPlaying}
              ...
```

- [ ] **Step 10: KoreanBlockTutorial 렌더 추가**

`KoreanBlockPlayerInner` return 본문 — `</MobileLandscapeGate>` 직전, 가장 마지막 `</div>` 다음에:

기존 (line 595-598):
```tsx
        </div>
      </div>
    </div>
    </MobileLandscapeGate>
  );
```

수정:
```tsx
        </div>
      </div>
    </div>
    <KoreanBlockTutorial
      word={currentItem.word}
      active={hintActive}
      onEnd={handleHintEnd}
      gridRef={{ current: null }}
    />
    </MobileLandscapeGate>
  );
```

(gridRef 는 현재 미사용 — 향후 확장 위해 prop 만 유지. Task 5 의 Arrow 는 data-attribute 로 직접 querySelector 함.)

- [ ] **Step 11: typecheck + commit**

Run: `pnpm --filter client typecheck`
Expected: 에러 없음

```bash
git add packages/client/src/features/games/components/players/KoreanBlockPlayer.tsx
git commit -m "feat(games): 한글블록 플레이어에 튜토리얼 통합 — 도와줘 버튼 + Provider + 차단"
```

---

## Task 7: RandomBlockGamePage difficulty 매핑 fix

**Files:**
- Modify: `packages/client/src/pages/RandomBlockGamePage.tsx`

현재 hardcoded `difficulty="medium"` → 실제 level → easy/medium/hard 매핑.

- [ ] **Step 1: 매핑 추가 + 적용**

기존 (line 223-242 부근):
```tsx
  if (lang === 'ko') {
    return (
      <KoreanBlockPlayer
        storybookId="__random_pool__"
        gameData={gameData}
        difficulty="medium"
        onComplete={handleComplete}
        onBack={handleBack}
      />
    );
  }
  return (
    <EnglishBlockPlayer
      storybookId="__random_pool__"
      gameData={gameData}
      difficulty="medium"
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}
```

수정 — level → difficulty 매핑:
```tsx
  const levelToDifficulty: Record<Level, 'easy' | 'medium' | 'hard'> = {
    L1: 'easy',
    L2: 'medium',
    L3: 'hard',
  };
  const difficulty = levelToDifficulty[level];

  if (lang === 'ko') {
    return (
      <KoreanBlockPlayer
        storybookId="__random_pool__"
        gameData={gameData}
        difficulty={difficulty}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    );
  }
  return (
    <EnglishBlockPlayer
      storybookId="__random_pool__"
      gameData={gameData}
      difficulty={difficulty}
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}
```

(level 이 non-null 인 자리 — 이미 위에 `if (!level)` early return 있어서 여기선 always 정의됨.)

- [ ] **Step 2: typecheck + commit**

Run: `pnpm --filter client typecheck`
Expected: 에러 없음

```bash
git add packages/client/src/pages/RandomBlockGamePage.tsx
git commit -m "fix(games): RandomBlockGamePage difficulty 하드코딩 → L1/L2/L3 매핑"
```

---

## Task 8: CLAUDE.md 업데이트

**Files:**
- Modify: `packages/client/src/features/games/CLAUDE.md`

- [ ] **Step 1: 한글 블록 섹션에 튜토리얼 노트 추가**

기존 `## KoreanBlockPlayer — 공간 음절 인식 + 수직 모음 시각 배치 (2026-05-10)` 섹션 끝에 추가:

```markdown

## 한글 블록 튜토리얼 — 쉬움 레벨 (2026-05-12)

쉬움 (difficulty=easy) 진입 시 단어 카드에 "🪄 도와줘" 버튼. 클릭 시 호리가 우하단 등장 + 정답 자모를 패널에서 그리드로 옮기는 시퀀스 시연.

- **state machine**: idle → intro → (pop → arrow → place) × N글자 → syllable-done → end → fade-out → idle
- **인터랙션 차단**: 재생 중 (`isPlaying`) 패널 드래그 / 그리드 클릭 / 확인·초기화·도와줘 버튼 모두 비활성
- **시연만**: 그리드는 빈 상태 유지 (튜토리얼 끝나면 사용자가 직접 드래그)
- **음성**: `public/sounds/games/tutorial/hori-{intro,pop,place,syllable-done,end}.mp3` (없으면 말풍선만 graceful)
- **canonical layout**: row 1 베이스, 수직 모음 (ㅗㅛㅜㅠㅡ) 시 row 2. `planTutorialLayout(word)` pure 함수 — 단위 테스트 있음
- **Context 기반**: `TutorialProvider` 가 BlockTile/그리드셀에 highlight (popJamo / glowCell) 공유 → 컴포넌트 자체적으로 pop / glow 클래스 적용. 디커플 깔끔.
- **위치**: `packages/client/src/features/games/components/players/KoreanBlockTutorial/`
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/features/games/CLAUDE.md
git commit -m "docs(games): 한글블록 튜토리얼 (쉬움 레벨) 가이드 추가"
```

---

## Task 9: 수동 검증 (preview)

**Files:** (없음 — 검증만)

- [ ] **Step 1: preview 시작**

```bash
pnpm dev
```

또는 preview tool.

- [ ] **Step 2: 1366×768 에서 쉬움 진입 → 도와줘 버튼 보임**

- 브라우저 1366×768 (또는 preview_resize)
- `/games/korean-block` 진입 → 🌱 쉬움 클릭
- Section 1 단어 카드에 "🪄 도와줘" 버튼 보임 확인
- 보통/어려움 진입 → 버튼 안 보임 확인

- [ ] **Step 3: 도와줘 클릭 → 호리 등장 + 시연**

- 버튼 클릭
- 호리가 우하단 등장 ("안녕! 같이 만들어 볼까?" 말풍선)
- 자모 패널의 정답 자모 타일이 튀어오르는지
- 화살표가 자모 → 그리드 셀로 그려지는지
- 그리드 셀이 코랄 ring 으로 빛나는지
- 글자 수만큼 반복
- 마지막 음절 후 "잘했어! 완성!" 멘트
- 종료 시 "이제 네 차례야!" + 호리 페이드아웃

- [ ] **Step 4: 재생 중 인터랙션 차단 확인**

- 시연 중 자모 패널 타일 드래그 시도 → 안 됨
- 시연 중 그리드 셀 클릭 → 안 됨
- 시연 중 확인/초기화/도와줘 버튼 → 비활성 (회색)

- [ ] **Step 5: 종료 후 상태 확인**

- 시연 끝나면 그리드는 빈 상태 유지
- 도와줘 버튼 다시 활성
- 모든 인터랙션 정상

- [ ] **Step 6: 라운드 전환 시 reset**

- 정답 맞춰서 다음 라운드 진입 → 도와줘 버튼 재활성
- hintActive false 자동 reset 확인

- [ ] **Step 7: 다양한 단어 패턴**

쉬움 단어 풀에서 다음 패턴 확인:
- 1음절 수평 (가, 나, 다 등): cells (1,0)(1,1)
- 1음절 수직 (구, 누, 두 등): cells (1,0)(2,0)
- 2음절 수평/수직 (나무): cells (1,0)(1,1)(1,2)(2,2)
- 2음절 수직/수직 (구두): cells (1,0)(2,0)(1,1)(2,1)

각 케이스에서 화살표가 올바른 셀로 향하는지

- [ ] **Step 8: 음성 미존재 graceful**

음성 mp3 가 없는 상태에서도:
- 콘솔에 404 에러는 OK
- 말풍선은 정상 표시
- 시퀀스 진행 정상

- [ ] **Step 9: typecheck 통과 확인**

```bash
pnpm --filter client typecheck
```

Expected: 에러 없음

- [ ] **Step 10: 1920×1080 / 모바일 가로 (667×375) 도 확인**

- 1920×1080: 호리 우하단, 시연 정상
- 667×375: 호리 우하단 (작게), 말풍선/화살표 좌표 정확
- 모바일 세로 (375×667): MobileLandscapeGate 가 먼저 떠서 튜토리얼 안 보임 (정상)

---

## Self-Review

- ✅ Spec 모든 섹션 → task 매핑:
  - 노출/트리거 (spec 1) → Task 6 Step 4 (조건부 버튼)
  - 시퀀스/타이밍 (spec 2) → Task 4 (state machine) + Task 2 (timing 상수)
  - 셀 위치 규칙 (spec 3) → Task 1 (planTutorialLayout)
  - 호리 + 오디오 + 말풍선 (spec 4) → Task 4 (호리 + 말풍선) + Task 2 (멘트/오디오)
  - 화살표 (spec 5) → Task 5 (TutorialArrow)
  - 인터랙션 차단 (spec 6) → Task 6 Step 5,7,8,9
  - State Machine (spec 7) → Task 4
  - 컴포넌트/파일 구조 (spec 8) → Task 6 (KoreanBlockPlayer 통합) + Task 7 (RandomBlockGamePage)
  - 그리드/패널 좌표 측정 (spec 9) → Task 5 (data-attribute querySelector)
  - 접근성/디그레이드 (spec 10) → Task 2 (텍스트 항상 표시) + Task 6 (버튼 disabled)
  - 테스트 시나리오 (spec 11) → Task 9 (수동 검증)
- ✅ Placeholder 없음
- ✅ 함수/타입 일관성: `planTutorialLayout` / `TutorialSyllable` / `TutorialHighlight` / `Phase` 전체 일관
- ✅ 파일 경로 절대값 명시
