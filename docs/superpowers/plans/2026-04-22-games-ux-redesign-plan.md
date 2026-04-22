# 게임 15종 UX 리디자인 — 구현 플랜

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 탱고북 게임 15종(플레이어 13개 + 공통 컴포넌트 + 13 config)을 뷰어 스펙에서 확정된 디자인 시스템(coral·호리·semantic) 으로 전면 리뉴얼. 풀업그레이드 피드백(FeedbackOverlay·RewardScreen급 결과 화면·기본 효과음)과 TOP 5 게임 레이아웃 개별 재설계 포함.

**Architecture:** 3 Phase. A — 공용 컴포넌트·사운드·훅·13 callsite accentColor 제거. B — TOP 5 게임 레이아웃 재설계(플립·2x2·그라데이션·glow). C — 남은 8 플레이어 + 13 config 토큰 치환 + PraiseOverlay 삭제. 매 Phase 끝 배포 가능. useGameAudio는 유지하고 내부만 리와이어(13 플레이어 호출부 안 깨짐).

**Tech Stack:** 기존 뷰어 리디자인에서 설치된 것 전부 상속 — framer-motion, lottie-react, canvas-confetti, clsx + tailwind-merge. 신규 의존성 **없음**. vitest 유지.

**Spec:** `docs/superpowers/specs/2026-04-22-games-ux-redesign-design.md`

---

## File Structure

### 신규 파일 (Phase A)

```
packages/client/
  public/sounds/game/
    correct.mp3           # CC0 ding/chime, <50KB, <800ms
    incorrect.mp3         # CC0 soft "음?", <50KB, <800ms
    clear.mp3             # CC0 짧은 fanfare, <50KB, <800ms
  src/features/games/
    components/
      FeedbackOverlay.tsx         # 신규: cheering/sad 호리 + confetti + shake
      FeedbackOverlay.test.tsx    # vitest 테스트 (visible/prefers-reduced/emoji fallback)
    hooks/
      useGameSound.ts             # 신규: playCorrect/Incorrect/Clear + 음소거
      useGameSound.test.ts        # vitest 테스트 (localStorage, override, mute)
```

### 수정 파일 (Phase A)

```
packages/client/src/features/games/
  components/
    GameResultScreen.tsx          # 대폭 업그레이드 (celebrating + confetti + 별점 + 카운트업)
    GameProgressBar.tsx           # dot 방식 + score prop
    PraiseOverlay.tsx             # @deprecated JSDoc 마크
    config/ConfigControls.tsx     # 토큰 교체 (violet → coral)
  hooks/
    useGameAudio.ts               # 내부 rewire (WebAudio 톤 제거 → useGameSound 위임)
  components/players/
    BlendingListeningPlayer.tsx   # accentColor prop 제거
    ConnectTheDotsPlayer.tsx
    EnglishBlockPlayer.tsx
    KoreanBlockPlayer.tsx
    LetterSoundPlayer.tsx
    OddOneOutPlayer.tsx
    PictureSequencePlayer.tsx
    StorybookQuizPlayer.tsx
    VocabularyMatchingPlayer.tsx
    WordImageMatchingPlayer.tsx
    WordListeningPlayer.tsx
    WordQuizPlayer.tsx
    WordWritingPlayer.tsx
packages/shared/src/types/storybook.ts  # systemSounds.clearUrl? 필드 추가
```

### 수정 파일 (Phase B)

```
packages/client/src/features/games/components/players/
  VocabularyMatchingPlayer.tsx    # 3D 플립 + match pop + shake
  WordQuizPlayer.tsx              # 2x2 큰 이미지 카드 + TTS 버튼
  EnglishBlockPlayer.tsx          # 그라데이션 배경 + drag-lift + drop-zone pulse
  KoreanBlockPlayer.tsx           # 동일 패턴
  WordListeningPlayer.tsx         # glow·pulse + 다시 듣기 버튼
```

### 수정·삭제 파일 (Phase C)

```
packages/client/src/features/games/components/players/
  (남은 8 플레이어 토큰 치환 + PraiseOverlay→FeedbackOverlay 이관)
  BlendingListeningPlayer.tsx
  ConnectTheDotsPlayer.tsx
  LetterSoundPlayer.tsx
  OddOneOutPlayer.tsx
  PictureSequencePlayer.tsx
  StorybookQuizPlayer.tsx
  WordImageMatchingPlayer.tsx
  WordWritingPlayer.tsx

packages/client/src/features/games/components/config/
  (13 config 패널 토큰 치환)
  BlendingListeningConfigPanel.tsx
  ConnectTheDotsConfigPanel.tsx
  EnglishBlockConfigPanel.tsx
  KoreanBlockConfigPanel.tsx
  LetterSoundConfigPanel.tsx
  OddOneOutConfigPanel.tsx
  PictureSequenceConfigPanel.tsx
  StorybookQuizConfigPanel.tsx
  VocabularyMatchingConfigPanel.tsx
  WordImageMatchingConfigPanel.tsx
  WordListeningConfigPanel.tsx
  WordQuizConfigPanel.tsx
  WordWritingConfigPanel.tsx

packages/client/src/features/games/components/
  PraiseOverlay.tsx               # 삭제
```

---

## Chunk 1: Phase A — Foundation

**목표:** 공용 컴포넌트 리빌드 + 사운드 인프라 + 13 플레이어 callsite 동기화. 끝나면 typecheck/test 통과 + 게임 플레이 가능 + GameResultScreen/GameProgressBar 시각 확 바뀜.

**기간:** 3~4일

### Task A1: CC0 효과음 3종 수집

**Files:**
- Create: `packages/client/public/sounds/game/correct.mp3`
- Create: `packages/client/public/sounds/game/incorrect.mp3`
- Create: `packages/client/public/sounds/game/clear.mp3`

- [x] **Step 1: 효과음 출처 선별** _(placeholder fallback 사용 — 사용자가 후속 교체 예정)_

후보 사이트:
- freesound.org (계정 필요, CC0 필터링 `?f=license:%22Creative+Commons+0%22`)
- OpenGameArt.org (CC0 카테고리)
- pixabay.com/sound-effects (기본 상용·CC0 혼재, 라이선스 체크)

검색 키워드:
- correct: "correct", "ding", "success chime", "positive chime"
- incorrect: "wrong soft", "error soft", "neutral try again"
- clear: "fanfare short", "victory short", "level complete 1s"

조건:
- 각 파일 <50KB (≈ 96kbps mono mp3 800ms 내외)
- 짧고 온화. 공격적·놀라는 톤 금지

- [x] **Step 2: 다운로드 + 필요 시 편집** _(fallback: 200ms silent mp3 생성으로 대체)_

도구: Audacity 또는 ffmpeg로 자르고 정규화.

```bash
# 예: 입력.wav → 800ms, -14 LUFS 정규화, 96kbps mono mp3
ffmpeg -i input.wav -t 0.8 -af "loudnorm=I=-14:LRA=7:TP=-1" -ac 1 -b:a 96k correct.mp3
```

- [x] **Step 3: 3개 파일 저장** _(각 3,178 bytes silent mp3)_

```
packages/client/public/sounds/game/correct.mp3
packages/client/public/sounds/game/incorrect.mp3
packages/client/public/sounds/game/clear.mp3
```

파일 크기 확인:
```bash
ls -la packages/client/public/sounds/game/
```
각 <50KB인지.

> **Fallback (시간 절약)**: 실 사운드 procurement가 지연되면 **200ms silent mp3 placeholder** 먼저 커밋하여 코드 기준선 세움. 이후 별도 커밋으로 실제 효과음 교체. 생성:
> ```bash
> # ffmpeg로 200ms 무음 mp3 생성
> ffmpeg -f lavfi -i anullsrc=channel_layout=mono:sample_rate=44100 -t 0.2 -b:a 96k correct.mp3
> cp correct.mp3 incorrect.mp3; cp correct.mp3 clear.mp3
> ```
> 이렇게 하면 CI는 통과하고 UI는 소리 없이 돌아감. 나중에 덮어쓰기 가능.

- [x] **Step 4: 출처·라이선스 기록** _(README.md 작성 — placeholder 명시 + 교체 가이드 포함)_

`packages/client/public/sounds/game/README.md` 작성:
```markdown
# Game Sound Effects

All CC0 (Creative Commons Zero).

- correct.mp3 — Source: <URL>, Author: <name>
- incorrect.mp3 — Source: <URL>, Author: <name>
- clear.mp3 — Source: <URL>, Author: <name>
```

- [x] **Step 5: Commit**

```bash
git add packages/client/public/sounds/game/
git commit -m "feat(games): add CC0 default feedback sounds (correct/incorrect/clear)"
```

### Task A2: `systemSounds.clearUrl` 타입 추가

**Files:**
- Modify: `packages/shared/src/types/storybook.ts`

- [x] **Step 1: 현재 `systemSounds` 정의 확인**

```bash
grep -n "systemSounds" packages/shared/src/types/storybook.ts
```

현재 `systemSounds?: { correctUrl?: string; incorrectUrl?: string; }` 형태 확인.

- [x] **Step 2: `clearUrl?` 추가**

```ts
systemSounds?: {
  correctUrl?: string;
  incorrectUrl?: string;
  clearUrl?: string;   // 신규: 게임 클리어 fanfare
};
```

- [x] **Step 3: shared 빌드 + typecheck**

```bash
pnpm --filter @tangobook/shared build
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/server typecheck
```

Expected: 모두 통과.

- [x] **Step 4: Commit**

```bash
git add packages/shared/src/types/storybook.ts
git commit -m "feat(shared): add systemSounds.clearUrl for game clear fanfare"
```

### Task A3: `useGameSound` 훅 — TDD

**Files:**
- Create: `packages/client/src/features/games/hooks/useGameSound.ts`
- Create: `packages/client/src/features/games/hooks/useGameSound.test.ts`

- [x] **Step 1: Failing test 작성**

```ts
// useGameSound.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameSound } from './useGameSound';

// HTMLAudioElement 기본 mock. 인스턴스 전부 캡처해서 play 호출 여부 검증 가능.
const audioInstances: AudioMock[] = [];
class AudioMock {
  currentTime = 0;
  src = '';
  preload = '';
  paused = true;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  constructor(src?: string) {
    if (src) this.src = src;
    audioInstances.push(this);
  }
}
vi.stubGlobal('Audio', AudioMock);

describe('useGameSound', () => {
  beforeEach(() => {
    localStorage.clear();
    audioInstances.length = 0;
    vi.clearAllMocks();
  });

  it('returns playCorrect/playIncorrect/playClear', () => {
    const { result } = renderHook(() => useGameSound());
    expect(typeof result.current.playCorrect).toBe('function');
    expect(typeof result.current.playIncorrect).toBe('function');
    expect(typeof result.current.playClear).toBe('function');
    expect(typeof result.current.toggleMuted).toBe('function');
    expect(result.current.isMuted).toBe(false);
  });

  it('uses default /sounds/game/*.mp3 when no systemSounds', () => {
    const { result } = renderHook(() => useGameSound());
    // spy on Audio constructor via src property
    // (실제 재생 여부보다는 플레이 함수 존재 + 에러 없음 확인)
    expect(() => result.current.playCorrect()).not.toThrow();
  });

  it('uses override URL when systemSounds.correctUrl provided', () => {
    const { result } = renderHook(() =>
      useGameSound({ systemSounds: { correctUrl: 'https://cdn/custom.mp3' } }),
    );
    expect(() => result.current.playCorrect()).not.toThrow();
  });

  it('toggleMuted persists to localStorage', () => {
    const { result } = renderHook(() => useGameSound());
    act(() => result.current.toggleMuted());
    expect(result.current.isMuted).toBe(true);
    expect(localStorage.getItem('tangobook-game-muted')).toBe('true');
  });

  it('restores muted state from localStorage on mount', () => {
    localStorage.setItem('tangobook-game-muted', 'true');
    const { result } = renderHook(() => useGameSound());
    expect(result.current.isMuted).toBe(true);
  });

  it('muted state skips play()', () => {
    localStorage.setItem('tangobook-game-muted', 'true');
    const { result } = renderHook(() => useGameSound());
    const correctInstance = audioInstances.find((a) => a.src.includes('correct.mp3'));
    expect(correctInstance).toBeDefined();
    act(() => result.current.playCorrect());
    expect(correctInstance!.play).not.toHaveBeenCalled();
  });

  it('unmuted state calls play()', () => {
    const { result } = renderHook(() => useGameSound());
    const correctInstance = audioInstances.find((a) => a.src.includes('correct.mp3'));
    expect(correctInstance).toBeDefined();
    act(() => result.current.playCorrect());
    expect(correctInstance!.play).toHaveBeenCalledTimes(1);
  });
});
```

> **Note**: Audio 모킹은 브라우저 환경 흉내 어려움. 테스트는 주로 **외부 시그니처 + localStorage + override 로직** 검증. play 실제 호출 여부는 단위 테스트 범위 밖.

- [x] **Step 2: Verify fail**

```bash
pnpm --filter @tangobook/client test src/features/games/hooks/useGameSound.test.ts
```

Expected: FAIL (모듈 없음).

- [x] **Step 3: useGameSound.ts 구현**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

interface SystemSoundsOverride {
  correctUrl?: string;
  incorrectUrl?: string;
  clearUrl?: string;
}

const DEFAULT_CORRECT = '/sounds/game/correct.mp3';
const DEFAULT_INCORRECT = '/sounds/game/incorrect.mp3';
const DEFAULT_CLEAR = '/sounds/game/clear.mp3';
const STORAGE_KEY = 'tangobook-game-muted';

function loadMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useGameSound(opts?: { systemSounds?: SystemSoundsOverride }) {
  const correctUrl = opts?.systemSounds?.correctUrl ?? DEFAULT_CORRECT;
  const incorrectUrl = opts?.systemSounds?.incorrectUrl ?? DEFAULT_INCORRECT;
  const clearUrl = opts?.systemSounds?.clearUrl ?? DEFAULT_CLEAR;

  const correctRef = useRef<HTMLAudioElement | null>(null);
  const incorrectRef = useRef<HTMLAudioElement | null>(null);
  const clearRef = useRef<HTMLAudioElement | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(() => loadMuted());

  // URL 변경 시 프리로드 (mount + URL 변경 시점)
  useEffect(() => {
    const a = new Audio(correctUrl);
    a.preload = 'auto';
    correctRef.current = a;
    return () => {
      a.pause();
      a.src = '';
    };
  }, [correctUrl]);

  useEffect(() => {
    const a = new Audio(incorrectUrl);
    a.preload = 'auto';
    incorrectRef.current = a;
    return () => {
      a.pause();
      a.src = '';
    };
  }, [incorrectUrl]);

  useEffect(() => {
    const a = new Audio(clearUrl);
    a.preload = 'auto';
    clearRef.current = a;
    return () => {
      a.pause();
      a.src = '';
    };
  }, [clearUrl]);

  const playRef = useCallback(
    (ref: React.RefObject<HTMLAudioElement | null>) => {
      if (isMuted) return;
      const a = ref.current;
      if (!a) return;
      try {
        a.currentTime = 0;
        void a.play().catch(() => {});
      } catch {
        /* ignore */
      }
    },
    [isMuted],
  );

  const playCorrect = useCallback(() => playRef(correctRef), [playRef]);
  const playIncorrect = useCallback(() => playRef(incorrectRef), [playRef]);
  const playClear = useCallback(() => playRef(clearRef), [playRef]);

  const toggleMuted = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { playCorrect, playIncorrect, playClear, isMuted, toggleMuted };
}
```

- [x] **Step 4: Verify pass** _(7 tests PASS)_

```bash
pnpm --filter @tangobook/client test src/features/games/hooks/useGameSound.test.ts
```

Expected: 6 tests PASS.

- [x] **Step 5: Commit**

```bash
git add packages/client/src/features/games/hooks/useGameSound.ts packages/client/src/features/games/hooks/useGameSound.test.ts
git commit -m "feat(games): add useGameSound hook with mute persistence + systemSounds override"
```

### Task A4: `useGameAudio` 내부 rewire

**Files:**
- Modify: `packages/client/src/features/games/hooks/useGameAudio.ts`

- [x] **Step 1: 기존 구조 확인**

```bash
grep -n "playFeedbackSound\|AudioContext\|OscillatorNode" packages/client/src/features/games/hooks/useGameAudio.ts
```

WebAudio 톤 합성(`AudioContext`, oscillator) 구간 발견.

- [x] **Step 2: useGameAudio 수정 — WebAudio 제거 + useGameSound 위임**

```ts
// useGameAudio.ts 상단 import 추가
import { useGameSound } from './useGameSound';

// export function useGameAudio() { 내부 변경
export function useGameAudio() {
  const { playCorrect, playIncorrect } = useGameSound();

  const lastAudioRef = useRef<HTMLAudioElement | null>(null);
  const [librarySoundUrls, setLibrarySoundUrls] = useState<string[]>([]);

  useEffect(() => {
    settingsApi
      .getSystemSounds()
      .then((data) => {
        const urls = [
          ...data.korean.correct.map((s) => s.url),
          ...data.english.correct.map((s) => s.url),
        ];
        if (urls.length > 0) setLibrarySoundUrls(urls);
      })
      .catch(() => {});
  }, []);

  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    if (lastAudioRef.current) {
      lastAudioRef.current.pause();
      lastAudioRef.current = null;
    }
    const audio = new Audio(url);
    lastAudioRef.current = audio;
    audio.play().catch(() => {});
  }, []);

  // 기존 WebAudio 톤 합성 제거 → useGameSound 위임
  const playFeedbackSound = useCallback(
    (correct: boolean) => {
      if (correct) playCorrect();
      else playIncorrect();
    },
    [playCorrect, playIncorrect],
  );

  const [praiseVisible, setPraiseVisible] = useState(false);

  const playCorrectSequence = useCallback(
    (opts?: CorrectSequenceOpts) => {
      playFeedbackSound(true);
      setPraiseVisible(true);
      let delay = 500;
      if (opts?.ttsUrl) {
        setTimeout(() => playAudio(opts.ttsUrl), delay);
        delay += 1200;
      }
      const correctUrl =
        opts?.systemSounds?.correctUrl ||
        (librarySoundUrls.length > 0
          ? librarySoundUrls[Math.floor(Math.random() * librarySoundUrls.length)]
          : undefined);
      if (correctUrl) {
        setTimeout(() => playAudio(correctUrl), delay);
        delay += 1500;
      } else {
        delay = Math.max(delay, 1200);
      }
      setTimeout(() => setPraiseVisible(false), delay - 300);
      if (opts?.onDone) setTimeout(opts.onDone, delay);
    },
    [playFeedbackSound, playAudio, librarySoundUrls],
  );

  return { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible };
}
```

> **외부 시그니처 변경 없음**. 13 callsite 안 깨짐.

- [x] **Step 3: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [x] **Step 4: 기존 테스트 + 새 테스트 돌려 안전 확인** _(34/34 PASS)_

```bash
pnpm --filter @tangobook/client test
```

- [x] **Step 5: Commit**

```bash
git add packages/client/src/features/games/hooks/useGameAudio.ts
git commit -m "refactor(games): rewire useGameAudio internals to useGameSound (no signature change)"
```

### Task A5: `FeedbackOverlay` 신규 — TDD

**Files:**
- Create: `packages/client/src/features/games/components/FeedbackOverlay.tsx`
- Create: `packages/client/src/features/games/components/FeedbackOverlay.test.tsx`

- [x] **Step 1: Failing test 작성**

```tsx
// FeedbackOverlay.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FeedbackOverlay } from './FeedbackOverlay';

describe('FeedbackOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders nothing when visible=false', () => {
    const { container } = render(<FeedbackOverlay kind="correct" visible={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders correct kind when visible', () => {
    render(<FeedbackOverlay kind="correct" visible={true} />);
    // 정답 문구 중 하나가 보여야
    const text = screen.getByTestId('feedback-text').textContent ?? '';
    expect(['잘했어!', '정답!', '최고야!', '멋져!']).toContain(text);
  });

  it('renders incorrect kind message', () => {
    render(<FeedbackOverlay kind="incorrect" visible={true} />);
    const text = screen.getByTestId('feedback-text').textContent ?? '';
    expect(['다시 해볼까?', '괜찮아', '한 번 더!']).toContain(text);
  });

  it('calls onDismiss after durationMs', () => {
    const onDismiss = vi.fn();
    render(<FeedbackOverlay kind="correct" visible={true} durationMs={500} onDismiss={onDismiss} />);
    act(() => { vi.advanceTimersByTime(499); });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(2); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('works without onDismiss (optional)', () => {
    // 예외 안 남
    expect(() =>
      render(<FeedbackOverlay kind="correct" visible={true} durationMs={500} />),
    ).not.toThrow();
    act(() => { vi.advanceTimersByTime(600); });
  });
});
```

- [x] **Step 2: Verify fail**

```bash
pnpm --filter @tangobook/client test src/features/games/components/FeedbackOverlay.test.tsx
```

Expected: FAIL (모듈 없음).

- [x] **Step 3: FeedbackOverlay 구현**

```tsx
import { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Mascot } from '@/components/Mascot';
import { cn } from '@/lib/cn';

interface FeedbackOverlayProps {
  kind: 'correct' | 'incorrect';
  visible: boolean;
  onDismiss?: () => void;
  durationMs?: number;
  positionHint?: 'center' | 'top';
}

const CORRECT_TEXTS = ['잘했어!', '정답!', '최고야!', '멋져!'];
const INCORRECT_TEXTS = ['다시 해볼까?', '괜찮아', '한 번 더!'];

export function FeedbackOverlay({
  kind,
  visible,
  onDismiss,
  durationMs,
  positionHint = 'center',
}: FeedbackOverlayProps) {
  const effectiveDuration = durationMs ?? (kind === 'correct' ? 1200 : 800);

  // 마운트 시 랜덤 문구 고정 (리렌더마다 바뀌지 않게)
  const text = useMemo(() => {
    const pool = kind === 'correct' ? CORRECT_TEXTS : INCORRECT_TEXTS;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [kind, visible]);

  // 정답 시 confetti (prefers-reduced-motion 존중)
  useEffect(() => {
    if (!visible) return;
    if (kind !== 'correct') return;
    const reduce = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#FF5E3A', '#FFC857', '#5CC99F', '#A78BFA'],
    });
  }, [visible, kind]);

  // 자동 dismiss
  useEffect(() => {
    if (!visible) return;
    if (!onDismiss) return;
    const t = setTimeout(onDismiss, effectiveDuration);
    return () => clearTimeout(t);
  }, [visible, onDismiss, effectiveDuration]);

  if (!visible) return null;

  const mascotState = kind === 'correct' ? 'cheering' : 'sad';
  const bgTint =
    kind === 'correct' ? 'bg-success/10' : 'bg-coral-100/40';
  const shakeClass = kind === 'incorrect' ? 'animate-shake' : '';

  return (
    <div
      className={cn(
        'fixed inset-0 z-40 flex flex-col items-center gap-3 pointer-events-none',
        positionHint === 'top' ? 'justify-start pt-24' : 'justify-center',
        bgTint,
        shakeClass,
      )}
    >
      <Mascot state={mascotState} size="lg" />
      <div
        data-testid="feedback-text"
        className="bg-white rounded-lg px-6 py-3 shadow-pop font-black text-2xl text-ink-900"
      >
        {text}
      </div>
    </div>
  );
}
```

- [x] **Step 4: Verify pass** _(5 tests PASS — jsdom matchMedia 누락 대응 typeof guard 추가)_

```bash
pnpm --filter @tangobook/client test src/features/games/components/FeedbackOverlay.test.tsx
```

Expected: 5 tests PASS.

- [x] **Step 5: Commit**

```bash
git add packages/client/src/features/games/components/FeedbackOverlay.tsx packages/client/src/features/games/components/FeedbackOverlay.test.tsx
git commit -m "feat(games): add FeedbackOverlay (correct/incorrect with hori + confetti + shake)"
```

### Task A6: `GameResultScreen` 대폭 업그레이드

**Files:**
- Modify: `packages/client/src/features/games/components/GameResultScreen.tsx`

- [x] **Step 1: 기존 구현 확인**

```bash
cat packages/client/src/features/games/components/GameResultScreen.tsx
```

현재 accentColor prop · 이모지 · 점수 · 버튼 2개 구조 파악.

- [x] **Step 2: 리빌드** _(기존 score/total prop 이름 유지 — 13 콜사이트 호환)_

```tsx
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot } from '@/components/Mascot';
import { Button } from '@/components/Button';
import { cn } from '@/lib/cn';

interface GameResultScreenProps {
  correctCount: number;
  totalCount: number;
  onRestart: () => void;
  onBack: () => void;
}

function stars(ratio: number): number {
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

export function GameResultScreen({
  correctCount,
  totalCount,
  onRestart,
  onBack,
}: GameResultScreenProps) {
  const reduce = useReducedMotion();
  const safeTotal = totalCount || 1;
  const ratio = correctCount / safeTotal;
  const starCount = stars(ratio);

  // 카운트업 애니 (0 → correctCount, 800ms)
  const [displayCount, setDisplayCount] = useState(0);
  useEffect(() => {
    if (reduce) {
      setDisplayCount(correctCount);
      return;
    }
    const start = performance.now();
    const dur = 800;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / dur);
      setDisplayCount(Math.round(correctCount * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [correctCount, reduce]);

  // 마운트 시 confetti
  useEffect(() => {
    if (reduce) return;
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#FF5E3A', '#FFC857', '#5CC99F', '#A78BFA'],
    });
  }, [reduce]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-gradient-to-b from-cream-50 via-coral-100 to-peach-200">
      <motion.div
        initial={reduce ? { opacity: 0 } : { scale: 0.5, y: 40 }}
        animate={reduce ? { opacity: 1 } : { scale: 1, y: 0 }}
        transition={
          reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 180, damping: 14 }
        }
      >
        <Mascot state="celebrating" size="xl" />
      </motion.div>

      <div className="mt-6 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.span
            key={i}
            initial={reduce ? { opacity: 0 } : { scale: 0 }}
            animate={{
              opacity: 1,
              scale: i < starCount ? 1 : 0.4,
            }}
            transition={{ delay: reduce ? 0 : 0.3 + i * 0.2, type: 'spring' }}
            className={cn(
              'text-5xl',
              i < starCount ? 'opacity-100' : 'opacity-30 grayscale',
            )}
            aria-label={i < starCount ? '별 획득' : '빈 별'}
          >
            ⭐
          </motion.span>
        ))}
      </div>

      <h1 className="mt-5 text-4xl font-black text-ink-900 font-display">게임 끝!</h1>
      <p className="mt-3 text-2xl font-bold text-ink-700">
        <span className="text-coral-500">{displayCount}</span>
        <span className="text-ink-500"> / {totalCount}</span>
      </p>

      <div className="mt-8 flex gap-3">
        <Button variant="primary" size="lg" onClick={onRestart}>
          🔄 다시 하기
        </Button>
        <Button variant="secondary" size="lg" onClick={onBack}>
          🏠 홈으로
        </Button>
      </div>
    </div>
  );
}
```

- [x] **Step 3: typecheck** _(13 플레이어 accentColor 때문에 일시적으로 6 에러 — Task A10에서 해소)_

```bash
pnpm --filter @tangobook/client typecheck
```

13 플레이어에서 `accentColor` prop 전달하는 곳 때문에 에러 날 수도 (다음 Task에서 제거).

- [x] **Step 4: Commit**

```bash
git add packages/client/src/features/games/components/GameResultScreen.tsx
git commit -m "feat(games): rebuild GameResultScreen (celebrating + confetti + stars + countup)"
```

### Task A7: `GameProgressBar` dot 방식 리빌드

**Files:**
- Modify: `packages/client/src/features/games/components/GameProgressBar.tsx`

- [x] **Step 1: 리빌드**

```tsx
import { cn } from '@/lib/cn';

interface GameProgressBarProps {
  current: number;   // 0-based
  total: number;
  score: number;     // 맞힌 개수
}

export function GameProgressBar({ current, total, score }: GameProgressBarProps) {
  if (total <= 0) return null;
  const compact = total > 11;

  return (
    <div className="flex items-center gap-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft">
      {compact ? (
        <span className="font-black text-ink-900 text-sm">
          {current + 1} / {total}
        </span>
      ) : (
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-md transition-all',
                i === current ? 'w-6 bg-coral-500' : i < current ? 'w-3 bg-ink-300' : 'w-3 bg-ink-100',
              )}
            />
          ))}
        </div>
      )}
      <span className="font-black text-ink-900 text-sm flex items-center gap-1">
        <span>⭐</span>
        <span>{score}</span>
      </span>
    </div>
  );
}
```

- [x] **Step 2: typecheck** _(A6/A7 결합 시 13 플레이어 accentColor 에러 잔존 — Task A10에서 일괄 해소)_

```bash
pnpm --filter @tangobook/client typecheck
```

- [x] **Step 3: Commit**

```bash
git add packages/client/src/features/games/components/GameProgressBar.tsx
git commit -m "refactor(games): GameProgressBar → dot style + score (coral)"
```

### Task A8: `ConfigControls` 토큰 교체

**Files:**
- Modify: `packages/client/src/features/games/components/config/ConfigControls.tsx`

- [x] **Step 1: 기존 확인**

```bash
cat packages/client/src/features/games/components/config/ConfigControls.tsx
```

- [x] **Step 2: 토큰 교체** _(violet → coral/peach/ink, 다크모드 prefix 제거)_

구체 변경:
- `bg-violet-*` → `bg-peach-100` / `bg-peach-200` (hover) / `bg-coral-500` (active)
- `text-violet-*` → `text-ink-900` or `text-coral-500`
- `border-violet-*` → `border-coral-*` or `border-ink-100`
- 라벨: `text-ink-900 font-bold text-sm`

(파일 전체 rewrite 수준 아니면 섹션별 교체)

- [x] **Step 3: typecheck + 시각 sanity** _(시각 QA는 사용자 담당)_

```bash
pnpm --filter @tangobook/client typecheck
pnpm dev   # 수동 QA: 저작도구 게임 생성 모달에서 NumberSelector/Checkbox 확인
```

- [x] **Step 4: Commit**

```bash
git add packages/client/src/features/games/components/config/ConfigControls.tsx
git commit -m "refactor(games): ConfigControls token swap to coral/ink"
```

### Task A9: `PraiseOverlay` deprecate 주석

**Files:**
- Modify: `packages/client/src/features/games/components/PraiseOverlay.tsx`

- [x] **Step 1: JSDoc 추가**

파일 상단에:
```tsx
/**
 * @deprecated Phase C에서 삭제 예정. 새 코드는 FeedbackOverlay 사용.
 * 기존 호출부는 그대로 동작 (Phase C에서 일괄 이관).
 */
```

- [x] **Step 2: Commit**

```bash
git add packages/client/src/features/games/components/PraiseOverlay.tsx
git commit -m "chore(games): mark PraiseOverlay as @deprecated (phase C cleanup target)"
```

### Task A10: 13 플레이어 `accentColor` prop 제거 + `score` prop 추가

**Files:**
- Modify: 13 players
  - `BlendingListeningPlayer.tsx`, `ConnectTheDotsPlayer.tsx`, `EnglishBlockPlayer.tsx`, `KoreanBlockPlayer.tsx`, `LetterSoundPlayer.tsx`, `OddOneOutPlayer.tsx`, `PictureSequencePlayer.tsx`, `StorybookQuizPlayer.tsx`, `VocabularyMatchingPlayer.tsx`, `WordImageMatchingPlayer.tsx`, `WordListeningPlayer.tsx`, `WordQuizPlayer.tsx`, `WordWritingPlayer.tsx`

- [x] **Step 1: grep으로 현 사용 패턴 확인**

```bash
grep -rn "accentColor" packages/client/src/features/games/components/players/
```

현재 어떤 값(violet/sky/emerald) 전달하는지 확인.

- [x] **Step 2: 각 플레이어에서 accentColor 제거 + score 전달**

실제 편집 결과 (매핑표는 아래 원래 기록 참고):

- `BlendingListeningPlayer`, `EnglishBlockPlayer`, `KoreanBlockPlayer`, `LetterSoundPlayer`, `OddOneOutPlayer`, `StorybookQuizPlayer`, `WordImageMatchingPlayer`, `WordListeningPlayer`, `WordQuizPlayer` — 기존 `score` state 그대로 `score={score}` 전달, accentColor prop 제거.
- `ConnectTheDotsPlayer` — 기존 `completedItems` state를 score로 사용 (`score={completedItems}`). 새 state 추가 없이 재사용.
- `WordWritingPlayer` — 기존 `scores: number[]` 기반 `score={scores.filter(s => s >= 70).length}` (통과 기준 70점).
- `VocabularyMatchingPlayer`, `PictureSequencePlayer` — GameProgressBar/GameResultScreen을 사용하지 않으므로 변경 불필요 (Phase B/C에서 재디자인 예정).

13 파일 순회. `accentColor` prop 전부 제거, `score` prop 추가.

**Per-player score 매핑** (실제 파일 상태 기준):

| Player | 기존 score 상태 | score prop 전달 방법 |
|---|---|---|
| `WordQuizPlayer` | `const [score, setScore] = useState(0)` | `score={score}` |
| `BlendingListeningPlayer` | 내부 state | 같은 이름 state 재사용 |
| `EnglishBlockPlayer` | 내부 state | 같은 이름 state 재사용 |
| `KoreanBlockPlayer` | 내부 state | 같은 이름 state 재사용 |
| `LetterSoundPlayer` | 내부 state | 같은 이름 state 재사용 |
| `OddOneOutPlayer` | 내부 state | 같은 이름 state 재사용 |
| `PictureSequencePlayer` | 내부 state | 같은 이름 state 재사용 |
| `StorybookQuizPlayer` | 내부 state | 같은 이름 state 재사용 |
| `WordImageMatchingPlayer` | 내부 state | 같은 이름 state 재사용 |
| `WordListeningPlayer` | 내부 state | 같은 이름 state 재사용 |
| `VocabularyMatchingPlayer` | **state 없음** — matches 개수 파생 | `score={matchedPairs.length}` 유사 패턴. 매치된 쌍 수 기준 |
| `ConnectTheDotsPlayer` | **state 없음** | `const [score, setScore] = useState(0)` 신규 추가 + 성공 시 증가 |
| `WordWritingPlayer` | `const [scores, setScores] = useState<number[]>([])` | `score={scores.filter(s => s >= PASS_THRESHOLD).length}` (통과 점수 기준 개수). 또는 전체 글자 쓴 개수 |

> **주의**: 각 플레이어별로 score 의미(맞춘 횟수·정답률·쓴 글자 수 등)가 다를 수 있음. GameProgressBar에선 단순히 숫자만 보여주면 되므로 **"긍정적인 숫자"** 로 해석될 수 있는 값이면 OK. 정확한 의미 일치보다 UX 일관성 우선.

**공통 치환 패턴**:
```tsx
// Before
<GameProgressBar current={idx} total={questions.length} accentColor="violet" />
<GameResultScreen correctCount={score} totalCount={questions.length} accentColor="violet" onRestart={...} onBack={...} />

// After
<GameProgressBar current={idx} total={questions.length} score={score} />
<GameResultScreen correctCount={score} totalCount={questions.length} onRestart={...} onBack={...} />
```

플레이어가 state 없는 경우:
```tsx
// ConnectTheDotsPlayer에 추가
const [score, setScore] = useState(0);
// ... 정답 확정 지점에서 setScore(s => s + 1) 호출
```

- [x] **Step 3: 파일마다 typecheck** _(client typecheck PASS, 사전 16 accentColor 에러 → 0)_

각 플레이어 수정 후 순차 typecheck 혹은 마지막에 한 번:
```bash
pnpm --filter @tangobook/client typecheck
```

- [x] **Step 4: grep 확인** _(0 hits 확인)_

```bash
grep -rn "accentColor" packages/client/src/features/games/components/players/
# → 0 hits
```

- [x] **Step 5: Commit**

```bash
git add packages/client/src/features/games/components/players/
git commit -m "refactor(games): remove accentColor from 13 player callsites + add score prop"
```

### Task A11: Phase A 마무리 sanity

- [ ] **Step 1: 전체 typecheck + test**

```bash
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
```

Expected: typecheck PASS, 전체 테스트 PASS (기존 + 신규 useGameSound + FeedbackOverlay).

- [ ] **Step 2: dev 서버로 수동 QA**

```bash
pnpm dev
```

체크:
- 저작도구에서 게임 생성해서 하나 플레이
- 정답 시: praiseVisible → PraiseOverlay 표시됨 (아직 FeedbackOverlay 아님. Phase C에서 이관)
- 효과음: correct.mp3/incorrect.mp3 재생됨 (내부 rewire 덕분)
- 마지막 문제 후: **새 GameResultScreen** (celebrating 호리 + confetti + 별점 + 카운트업) 등장
- 상단 GameProgressBar: dot + ⭐ 점수

- [ ] **Step 3: 완료 메모**

Phase A는 "공용 컴포넌트만 바뀌고 게임 내부 색은 아직 구식"이 의도. Phase B/C에서 내부 리뉴얼.

---

**🏁 Chunk 1 (Phase A) 완료 기준:**
- [ ] `pnpm test` 통과 (기존 + useGameSound 7개 + FeedbackOverlay 5개 테스트)
- [ ] `pnpm typecheck` 통과 (3패키지)
- [ ] `public/sounds/game/` 에 3개 mp3 파일 존재 (placeholder silent OK, 각 <50KB)
- [ ] 13 플레이어에서 `accentColor` 전부 제거 (`grep -r "accentColor" packages/client/src/features/games/` = 0)
- [ ] `systemSounds.clearUrl` 필드 shared 타입에 추가
- [ ] 게임 플레이 가능 + 공용 컴포넌트 시각 업그레이드 체감 (새 GameResultScreen · dot ProgressBar)

---

## Chunk 2: Phase B — TOP 5 게임 레이아웃 재설계

**목표:** 가장 눈에 띄는 5게임 레이아웃 재설계. 플립·pop·shake·drag-lift·glow 연출로 플레이 만족감 극대화.

**기간:** 3~4일

### Task B1: VocabularyMatching — 3D 카드 플립

**Files:**
- Modify: `packages/client/src/features/games/components/players/VocabularyMatchingPlayer.tsx`

- [ ] **Step 1: 현재 구조 파악**

```bash
wc -l packages/client/src/features/games/components/players/VocabularyMatchingPlayer.tsx
head -50 packages/client/src/features/games/components/players/VocabularyMatchingPlayer.tsx
```

현재 매칭 카드 그리드·state 구조 확인. `cards` state, `flipped` state, `matched` state 등.

- [ ] **Step 2: 3D 플립 카드 컴포넌트 내부 작성**

플레이어 파일 내부에 `<FlipCard>` 로컬 컴포넌트 추가:

```tsx
import { motion } from 'framer-motion';

interface FlipCardProps {
  flipped: boolean;    // true면 앞면(text/image) 보임
  matched: boolean;    // 매칭 성공하면 fade out
  frontContent: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function FlipCard({ flipped, matched, frontContent, onClick, disabled }: FlipCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || matched}
      className="relative w-full aspect-square"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        animate={{
          rotateY: flipped || matched ? 180 : 0,
          opacity: matched ? 0 : 1,
          scale: matched ? 1.1 : 1,
        }}
        transition={{
          rotateY: { type: 'spring', stiffness: 260, damping: 20 },
          opacity: { duration: 0.6, delay: matched ? 0.6 : 0 },
          scale: { duration: 0.4 },
        }}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 뒷면 */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-md shadow-card bg-gradient-to-br from-coral-400 to-coral-500"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-5xl opacity-20">🐯</span>
        </div>
        {/* 앞면 */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-md shadow-card bg-white text-ink-900 font-black"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {frontContent}
        </div>
      </motion.div>
    </button>
  );
}
```

- [ ] **Step 3: 플레이어 본체 기존 카드 렌더 → FlipCard 교체**

기존 카드 loop 부분을 `<FlipCard>` 사용하도록:
```tsx
{cards.map((card) => (
  <FlipCard
    key={card.id}
    flipped={flippedIds.includes(card.id)}
    matched={matchedIds.includes(card.id)}
    frontContent={card.kind === 'word' ? card.text : <img src={card.imageUrl} alt="" />}
    onClick={() => onCardClick(card.id)}
  />
))}
```

- [ ] **Step 4: 매칭 성공·실패 시 FeedbackOverlay 호출**

정답 확정 지점 (기존 코드에서 `matched` 업데이트 위치) 직후에:
```tsx
if (매칭 성공) {
  playCorrectSequence({ onDone: () => {} });  // 기존 훅 사용
  // FeedbackOverlay는 praiseVisible state로 렌더 (아래)
}
if (매칭 실패) {
  // 기존 로직 유지 (카드 다시 뒤집힘)
  // 추가: playFeedbackSound(false)
}
```

하단 렌더에 추가 (기존에 PraiseOverlay 있으면 그대로 유지. Phase C에서 FeedbackOverlay로 이관).

- [ ] **Step 5: typecheck + dev 시각 QA**

```bash
pnpm --filter @tangobook/client typecheck
pnpm dev
```

수동 확인:
- 카드 클릭 시 **부드러운 3D flip** (400ms spring)
- 매칭 성공 시 두 카드 **scale pop + fade out**
- 매칭 실패 시 카드 다시 뒤집힘 (애니 연속)

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/features/games/components/players/VocabularyMatchingPlayer.tsx
git commit -m "feat(games): VocabularyMatching 3D flip + match pop animation"
```

### Task B2: WordQuiz — 2x2 큰 이미지 카드

**Files:**
- Modify: `packages/client/src/features/games/components/players/WordQuizPlayer.tsx`

- [ ] **Step 1: 현재 레이아웃 확인**

```bash
head -130 packages/client/src/features/games/components/players/WordQuizPlayer.tsx
```

선택지 영역과 질문 영역 찾기.

- [ ] **Step 2: 레이아웃 재설계**

질문 영역:
```tsx
<div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-4 shadow-soft mb-6 text-center">
  <div className="text-2xl font-black text-ink-900">{question.text}</div>
  {question.ttsUrl && (
    <button
      onClick={() => playAudio(question.ttsUrl)}
      className="mt-2 w-12 h-12 rounded-full bg-coral-500 text-white flex items-center justify-center mx-auto shadow-pop"
    >
      🔊
    </button>
  )}
</div>
```

선택지 그리드:
```tsx
<div className="grid grid-cols-2 gap-5 max-w-3xl mx-auto">
  {choices.map((choice, i) => {
    const isSelected = selectedIdx === i;
    const isCorrect = isSelected && choice.correct;
    const isWrong = isSelected && !choice.correct;
    return (
      <button
        key={i}
        onClick={() => onSelect(i)}
        disabled={selectedIdx !== null}
        className={cn(
          'aspect-square rounded-lg bg-white shadow-card flex flex-col items-center justify-center p-3 transition-all',
          'hover:scale-105 hover:shadow-pop',
          isCorrect && 'bg-success/10 ring-4 ring-success scale-105',
          isWrong && 'bg-coral-100 ring-4 ring-danger animate-shake',
        )}
      >
        {choice.imageUrl ? (
          <img src={choice.imageUrl} alt="" className="w-full h-full object-contain p-2" />
        ) : (
          <span className="text-3xl font-black text-ink-900">{choice.text}</span>
        )}
      </button>
    );
  })}
</div>
```

(choices 개수가 4개가 아닐 수도 있음 — 기존 로직 존중)

- [ ] **Step 3: 문제 전환 애니 추가 (framer-motion)**

```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  <motion.div
    key={currentIdx}
    initial={{ x: 50, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -50, opacity: 0 }}
    transition={{ duration: 0.25, type: 'spring' }}
  >
    {/* 질문·선택지 그리드 */}
  </motion.div>
</AnimatePresence>
```

- [ ] **Step 4: typecheck + 시각 QA**

```bash
pnpm --filter @tangobook/client typecheck
pnpm dev
```

수동: WordQuiz 실행 → 큰 이미지 카드 2x2 · 정답 시 emerald tint · 오답 시 shake · 문제 전환 slide.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/games/components/players/WordQuizPlayer.tsx
git commit -m "feat(games): WordQuiz 2x2 large image cards + slide transition"
```

### Task B3: EnglishBlock — 그라데이션 배경 + drag-lift

**Files:**
- Modify: `packages/client/src/features/games/components/players/EnglishBlockPlayer.tsx`

- [ ] **Step 1: 현재 배경·블록 스타일 확인**

```bash
grep -n "bg-\|className" packages/client/src/features/games/components/players/EnglishBlockPlayer.tsx | head -30
```

- [ ] **Step 2: 외곽 컨테이너 배경 교체**

```tsx
// 최상위 div
<div className="min-h-screen bg-gradient-to-br from-cream-50 to-peach-100 p-6">
```

- [ ] **Step 3: 블록 스타일 교체 (CSS `:active`로 드래그 lift, 추가 state 불필요)**

현재 `useBlockDrag` 훅은 refs만 노출하고 `isDragging` state를 제공하지 않음. 따라서 **Tailwind `active:` variant**로 마우스·터치 drag lift 효과 연출:

```tsx
<div
  className={cn(
    'bg-white rounded-md shadow-soft px-4 py-2 text-ink-900 font-black text-xl cursor-grab',
    'transition-transform hover:scale-105 hover:shadow-pop',
    'active:scale-[1.08] active:shadow-pop active:rotate-2 active:cursor-grabbing',
  )}
  {...dragHandlers}
>
  {block.text}
</div>
```

> **Note**: `active:` variant는 mouse down / touch press 동안 적용돼서 드래그 시 자연스럽게 lift. state 없이 순수 CSS로 해결. KoreanBlock(B4)도 동일 패턴.

- [ ] **Step 4: Drop zone 스타일**

```tsx
<div
  className={cn(
    'rounded-lg border-2 border-dashed p-4 min-h-[60px] transition-colors',
    isDragOver
      ? 'border-coral-500 bg-coral-100/30 animate-pulse'
      : 'border-coral-300 bg-white/40',
  )}
>
```

- [ ] **Step 5: 정답 배치 연출**

블록이 올바른 위치에 들어가면 `scale + glow` 짧은 애니 (기존 `isCorrect` state 활용):
```tsx
{placedBlock && (
  <motion.div
    initial={{ scale: 1 }}
    animate={{ scale: [1, 1.1, 1] }}
    transition={{ duration: 0.4 }}
    className="bg-success text-white rounded-md px-4 py-2 font-black shadow-pop"
  >
    {placedBlock.text}
  </motion.div>
)}
```

- [ ] **Step 6: 완성된 문장 타이핑 효과**

상단 결과 패널 (완성된 문장):
```tsx
<div className="bg-white/90 rounded-lg p-4 min-h-[60px] text-2xl font-black text-ink-900 text-center">
  {completedSentence.slice(0, typedChars)}
</div>
```

(`typedChars`는 effect로 `completedSentence.length` 까지 60ms 간격 증가. 간단한 setInterval)

- [ ] **Step 7: typecheck + 시각 QA**

```bash
pnpm --filter @tangobook/client typecheck
pnpm dev
```

- [ ] **Step 8: Commit**

```bash
git add packages/client/src/features/games/components/players/EnglishBlockPlayer.tsx
git commit -m "feat(games): EnglishBlock gradient bg + drag lift + drop pulse + typing reveal"
```

### Task B4: KoreanBlock — 동일 패턴

**Files:**
- Modify: `packages/client/src/features/games/components/players/KoreanBlockPlayer.tsx`

EnglishBlock과 구조 유사. Task B3의 스타일 변경을 그대로 적용.

- [ ] **Step 1: B3와 같은 패턴 적용**

한글 음절(blend) 로직은 그대로 유지. 블록 시각 스타일·drop zone·완성 문장 부분만 동기화.

- [ ] **Step 2: typecheck + 시각 QA**

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/features/games/components/players/KoreanBlockPlayer.tsx
git commit -m "feat(games): KoreanBlock match EnglishBlock visual treatment"
```

### Task B5: WordListening — glow·pulse 피드백

**Files:**
- Modify: `packages/client/src/features/games/components/players/WordListeningPlayer.tsx`

- [ ] **Step 1: 현재 선택지 카드 확인**

```bash
head -165 packages/client/src/features/games/components/players/WordListeningPlayer.tsx
```

- [ ] **Step 2: 카드 피드백 강화**

```tsx
<button
  onClick={() => onSelect(i)}
  className={cn(
    'rounded-lg bg-white shadow-soft overflow-hidden transition-all relative',
    'hover:scale-105 hover:shadow-pop hover:border-coral-300',
    isSelected && 'border-2 border-coral-500 scale-105',
    isCorrect && 'ring-4 ring-success animate-pulse',
    isWrong && 'ring-2 ring-danger animate-shake',
  )}
>
  <img src={word.imageUrl} alt="" className="w-full aspect-square object-cover" />
  {isCorrect && (
    <span className="absolute top-2 right-2 bg-success text-white rounded-full w-8 h-8 flex items-center justify-center font-black text-xl shadow-pop">
      ✓
    </span>
  )}
</button>
```

- [ ] **Step 3: 오답 시 "다시 들어볼까?" 버튼 자동 노출**

```tsx
{wrongAttempts > 0 && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-4 bg-coral-100 rounded-lg p-3 flex items-center justify-center gap-2"
  >
    <span className="text-ink-900 font-bold">다시 들어볼까?</span>
    <button
      onClick={playCurrentAudio}
      className="w-10 h-10 rounded-full bg-coral-500 text-white flex items-center justify-center shadow-pop"
    >
      🔊
    </button>
  </motion.div>
)}

// 3초 후 자동 숨김 (setTimeout)
```

- [ ] **Step 4: typecheck + 시각 QA**

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/games/components/players/WordListeningPlayer.tsx
git commit -m "feat(games): WordListening glow/pulse feedback + auto replay button on wrong"
```

### Task B6: Phase B 마무리 sanity

- [ ] **Step 1: 전체 typecheck + test**

```bash
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
```

- [ ] **Step 2: TOP 5 각 게임 수동 플레이 체크**

dev 서버 띄우고 5개 게임 각각 실행:
- VocabularyMatching: 3D 플립 매끄러움 · match pop · fail flip back
- WordQuiz: 2x2 큰 카드 · 정답 emerald · 오답 shake · slide 전환
- EnglishBlock: 그라데이션 배경 · drag lift · drop pulse · 완성 타이핑
- KoreanBlock: 동일 패턴 적용된 모양
- WordListening: ring glow · ✓ 배지 · 오답 시 다시 듣기 버튼

- [ ] **Step 3: 완료 커밋은 각 Task에서 됐으므로 추가 커밋 없음**

---

**🏁 Chunk 2 (Phase B) 완료 기준:**
- [ ] `pnpm test` · `pnpm typecheck` 통과
- [ ] TOP 5 게임 수동 QA 시각 개선 확인
- [ ] 남은 8게임은 아직 violet/sky/emerald 잔존 (Phase C에서 처리)

---

## Chunk 3: Phase C — 남은 8 플레이어 + 13 config + PraiseOverlay 삭제

**목표:** 남은 파일 토큰 일괄 치환 + PraiseOverlay → FeedbackOverlay 이관 + PraiseOverlay 완전 삭제. 끝나면 violet/sky/emerald 모두 제거, 호리·coral 통일.

**기간:** 2~3일

### Task C1: 토큰 치환 사전 조사

**Files:** (읽기만)

- [ ] **Step 1: 기존 색 클래스 사용 현황 grep**

```bash
grep -rn "bg-violet\|bg-sky\|bg-emerald\|text-violet\|text-sky\|text-emerald\|border-violet\|border-sky\|border-emerald\|ring-violet\|ring-sky\|ring-emerald\|bg-red-[4-6]" \
  packages/client/src/features/games/components/
```

결과를 전체 수 count로 기록 (예: 98 hits). Phase C 완료 시 0이어야.

- [ ] **Step 2: 변환 규칙 리마인드 (스펙 §4.1)**

| Before | After | 비고 |
|---|---|---|
| `bg-violet-{400-600}` | `bg-coral-{400-600}` | primary |
| `bg-violet-{50-200}` | `bg-peach-{100-200}` | hover/subtle |
| `bg-sky-*`, `bg-emerald-*` | `bg-coral-*` (통일) | 의미색 success tint는 `bg-success/10` 또는 `ring-success` |
| `text-violet-*`, `text-sky-*`, `text-emerald-*` | `text-ink-900` 본문, `text-coral-500` 강조 | |
| `border-*` (violet/sky/emerald) | `border-coral-*` or `border-ink-100` | |
| `bg-red-[4-6]` (오답) | `bg-danger` | |
| `ring-*` 삼색 | `ring-coral-400` or `ring-success` (정답 시) | |

### Task C2: 남은 8 플레이어 토큰 치환

**Files:**
- Modify: `BlendingListeningPlayer.tsx`, `ConnectTheDotsPlayer.tsx`, `LetterSoundPlayer.tsx`, `OddOneOutPlayer.tsx`, `PictureSequencePlayer.tsx`, `StorybookQuizPlayer.tsx`, `WordImageMatchingPlayer.tsx`, `WordWritingPlayer.tsx`

- [ ] **Step 0: 사전 조사 — emerald 사용처 컨텍스트 확인**

emerald는 대부분 "정답 피드백" 의미색이라 coral 대신 **semantic `success`**로 매핑. 예외 케이스 확인:

```bash
grep -rn -B 1 -A 1 "emerald" packages/client/src/features/games/components/players/
```

출력 보고 "정답·성공 의미"인 곳이 대부분인지 확인. 한두 곳 장식(decorative) 용도 있으면 메모해두고 Step 2 수동 검토에서 복원.

- [ ] **Step 1: 파일별 순회 — 색 클래스 치환**

각 파일 C1 규칙대로 치환. sed 일괄 처리 + 수동 교정. **emerald 계열은 기본적으로 `success` 매핑** (의미 보존):

```bash
# 백업을 위해 먼저 git diff 전 상태 저장됨. sed -i 직접 실행.
for f in packages/client/src/features/games/components/players/{BlendingListening,ConnectTheDots,LetterSound,OddOneOut,PictureSequence,StorybookQuiz,WordImageMatching,WordWriting}Player.tsx; do
  sed -i \
    -e 's/bg-violet-\([0-9]\+\)/bg-coral-\1/g' \
    -e 's/bg-sky-\([0-9]\+\)/bg-coral-\1/g' \
    -e 's/bg-emerald-\([0-9]\+\)/bg-success/g' \
    -e 's/text-violet-\([0-9]\+\)/text-ink-900/g' \
    -e 's/text-sky-\([0-9]\+\)/text-ink-900/g' \
    -e 's/text-emerald-\([0-9]\+\)/text-success/g' \
    -e 's/border-violet-\([0-9]\+\)/border-coral-\1/g' \
    -e 's/border-sky-\([0-9]\+\)/border-coral-\1/g' \
    -e 's/border-emerald-\([0-9]\+\)/border-success/g' \
    -e 's/ring-violet-\([0-9]\+\)/ring-coral-\1/g' \
    -e 's/ring-sky-\([0-9]\+\)/ring-coral-\1/g' \
    -e 's/ring-emerald-\([0-9]\+\)/ring-success/g' \
    -e 's/bg-red-\([4-6]\)00/bg-danger/g' \
    "$f"
done
```

> **Windows/Git Bash 주의**: `sed -i`가 BSD/GNU 차이로 동작 달라질 수 있음. 실행 전 한 파일로 테스트:
> ```bash
> cp BlendingListeningPlayer.tsx /tmp/test.tsx
> sed -i 's/bg-violet-500/bg-coral-500/g' /tmp/test.tsx
> diff BlendingListeningPlayer.tsx /tmp/test.tsx
> ```
> 동작 확인 후 본 script 실행. 문제 있으면 `git checkout .`으로 복구.

- [ ] **Step 2: 수동 검토 — 파일별로 의미색 복원**

sed 일괄 치환 후 각 파일 diff 확인. 정답 피드백으로 emerald·green 계열이었던 곳은 `bg-success/10 ring-success` 같은 semantic 패턴으로. 자동 치환이 과도하게 coral로 바꾼 곳 (예: 정답 badge의 원래 emerald 배경) 복원:

```bash
git diff packages/client/src/features/games/components/players/
```

수동 조정 예:
```tsx
// 자동 치환 후 (부적절)
<span className="bg-coral-500">✓</span>
// 의미색 복원
<span className="bg-success text-white">✓</span>
```

- [ ] **Step 3: 인라인 button/card → 공용 컴포넌트**

```bash
grep -n "<button className=\"bg-\|<div className=\"bg-white rounded" packages/client/src/features/games/components/players/
```

간단한 버튼 패턴은 `<Button>` 컴포넌트로 교체:
```tsx
// Before
<button className="bg-coral-500 text-white px-4 py-2 rounded-md">다음</button>
// After
<Button variant="primary" size="md">다음</Button>
```

카드 패턴도:
```tsx
// Before
<div className="bg-white rounded-lg p-4 shadow-soft">...</div>
// After
<Card padding="md">...</Card>
```

(복잡한 케이스는 그대로 두고 단순한 것만 교체. YAGNI)

- [ ] **Step 4: 파일별 typecheck**

각 파일 수정 후 순차:
```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 5: Commit (파일별 또는 일괄)**

```bash
git add packages/client/src/features/games/components/players/
git commit -m "refactor(games): 8 remaining players → coral tokens + shared Button/Card"
```

### Task C3: 13 config 패널 토큰 치환

**Files:** (13개)
- `BlendingListeningConfigPanel.tsx` ~ `WordWritingConfigPanel.tsx`

- [ ] **Step 0: configs에 sky/emerald 사용 여부 사전 grep**

```bash
grep -rn "bg-sky\|bg-emerald\|text-sky\|text-emerald\|border-sky\|border-emerald\|ring-sky\|ring-emerald" \
  packages/client/src/features/games/components/config/
```

결과가 있으면 Step 1 sed에 C2와 같은 emerald/sky 패턴도 추가. 없으면 violet만.

- [ ] **Step 1: sed 일괄 치환 (violet 기본 + 필요 시 sky/emerald 확장)**

```bash
for f in packages/client/src/features/games/components/config/*ConfigPanel.tsx; do
  sed -i \
    -e 's/bg-violet-\([0-9]\+\)/bg-coral-\1/g' \
    -e 's/text-violet-\([0-9]\+\)/text-ink-900/g' \
    -e 's/border-violet-\([0-9]\+\)/border-coral-\1/g' \
    -e 's/ring-violet-\([0-9]\+\)/ring-coral-\1/g' \
    "$f"
done
# Step 0에서 sky/emerald 발견 시 C2 block 추가 실행
```

- [ ] **Step 2: 수동 검토**

```bash
git diff packages/client/src/features/games/components/config/
```

- [ ] **Step 3: typecheck + Commit**

```bash
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/games/components/config/
git commit -m "refactor(games): 13 config panels → coral tokens"
```

### Task C4: PraiseOverlay → FeedbackOverlay 이관

**Files:** 호출하는 10개 플레이어 (BlendingListening, English/KoreanBlock, LetterSound, WordImageMatching, WordListening 외)

- [ ] **Step 1: PraiseOverlay import 위치 grep**

```bash
grep -rln "import.*PraiseOverlay" packages/client/src/features/games/
```

결과: 10~14개 파일.

- [ ] **Step 2: 각 파일 순회 — import 교체**

```tsx
// Before
import { PraiseOverlay } from '../PraiseOverlay';

// After
import { FeedbackOverlay } from '../FeedbackOverlay';
```

- [ ] **Step 3: 컴포넌트 호출 교체**

```tsx
// Before
<PraiseOverlay visible={praiseVisible} />

// After (hook-owned praiseVisible — onDismiss 불필요)
<FeedbackOverlay kind="correct" visible={praiseVisible} />
```

오답 시 feedback도 필요한 게임 (예: WordListening)은 별도 state + `<FeedbackOverlay kind="incorrect" ...>` 추가.

- [ ] **Step 4: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/games/components/players/
git commit -m "refactor(games): migrate PraiseOverlay → FeedbackOverlay across players"
```

### Task C5: PraiseOverlay 삭제

**Files:**
- Delete: `packages/client/src/features/games/components/PraiseOverlay.tsx`

- [ ] **Step 1: 남은 호출자 확인**

```bash
grep -rn "PraiseOverlay" packages/client/src/
```

Expected: 0 hits.

- [ ] **Step 2: 파일 삭제**

```bash
git rm packages/client/src/features/games/components/PraiseOverlay.tsx
```

- [ ] **Step 3: typecheck + 기존 테스트**

```bash
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
```

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(games): remove PraiseOverlay (migrated to FeedbackOverlay)"
```

### Task C6: Phase C 최종 검증

- [ ] **Step 1: 색 class grep 0 확인**

```bash
grep -rn "bg-violet\|bg-sky\|bg-emerald\|text-violet\|text-sky\|text-emerald\|border-violet\|border-sky\|border-emerald\|ring-violet\|ring-sky\|ring-emerald" \
  packages/client/src/features/games/
```

Expected: **0 hits** (semantic success/danger/warn/fun은 남아있어야 OK. 위 grep은 삼색만 검색).

- [ ] **Step 2: accentColor prop 0 확인**

```bash
grep -rn "accentColor" packages/client/src/features/games/
```

Expected: 0 hits.

- [ ] **Step 3: PraiseOverlay import 0 확인**

```bash
grep -rn "import.*PraiseOverlay\|from.*PraiseOverlay" packages/client/src/
```

Expected: 0 hits.

- [ ] **Step 4: 전체 typecheck + test**

```bash
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
```

- [ ] **Step 5: 수동 QA — 전 게임 시각 일관성**

`pnpm dev` → 15개 게임 ID 전체(13 플레이어)를 실제로 하나씩 실행:
- 모든 게임이 동일한 coral·ink 톤
- 정답 시 FeedbackOverlay cheering 호리 · confetti · 사운드
- 오답 시 sad 호리 (필요한 게임) · shake
- 게임 클리어 시 새 GameResultScreen (celebrating + 별점)

---

**🏁 Chunk 3 (Phase C) 완료 기준:**
- [ ] `grep` 모든 색 클래스 검사 0
- [ ] `grep` accentColor 0
- [ ] `grep` PraiseOverlay import 0
- [ ] PraiseOverlay.tsx 파일 삭제됨
- [ ] typecheck + test 모두 PASS
- [ ] 15개 게임 실제 플레이 시각 일관성 확인

---

## 🎉 플랜 종료

모든 Phase 완료 시:
- 게임 15종이 뷰어와 **같은 디자인 시스템**으로 통일
- 호리 마스코트가 정답·오답·클리어 순간마다 등장
- 기본 효과음 3종 상시 재생 (storybook 커스텀 업로드는 오버라이드)
- TOP 5 게임 레이아웃이 "확실히 재미있어짐" (플립·pop·drag-lift·glow)
- 남은 8게임도 색·공용 컴포넌트로 "한 제품" 느낌

**다음 후속 과제** (범위 밖):
- 게임별 세부 UX 개선 (개별 판단 필요한 것들)
- 리더보드·시간 제한·멀티플레이어 같은 새 메커닉
- 게임 신규 추가 (예: 문장 카드 매칭, 그림일기 등)
