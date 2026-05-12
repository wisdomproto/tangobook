import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';

export interface TutorialHighlight {
  /** 현재 pop 중인 자모 문자 */
  popJamo: string | null;
  /** 현재 glow 중인 grid cell `[row, col]` */
  glowCell: [number, number] | null;
  /** Arrow 시작 (자모 panel 타일) 의 char */
  arrowFromJamo: string | null;
  /** Arrow 도착 (grid cell) 의 [row, col] */
  arrowToCell: [number, number] | null;
}

export interface TutorialExpected {
  jamo: string;
  cell: [number, number];
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
  /** 사용자가 다음에 해야 할 placement (wait phase 일 때만 set) */
  expected: TutorialExpected | null;
  setExpected: (next: TutorialExpected | null) => void;
  /** 플레이어가 사용자의 placement 시 호출. expected 과 일치하면 onCorrect 실행. */
  notifyPlacement: (jamo: string, cell: [number, number]) => void;
  /** 튜토리얼이 wait 진입 시 onCorrect 콜백 등록. unmount 시 cleanup. */
  onCorrectRef: MutableRefObject<(() => void) | null>;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [highlight, setHighlight] = useState<TutorialHighlight>(EMPTY_HIGHLIGHT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expected, setExpectedState] = useState<TutorialExpected | null>(null);
  // expected 의 ref 미러 — notifyPlacement 의 closure stale 방지
  const expectedRef = useRef<TutorialExpected | null>(null);
  const onCorrectRef = useRef<(() => void) | null>(null);

  const setExpected = useCallback((next: TutorialExpected | null) => {
    expectedRef.current = next;
    setExpectedState(next);
  }, []);

  const notifyPlacement = useCallback((jamo: string, cell: [number, number]) => {
    const exp = expectedRef.current;
    if (!exp) return;
    if (exp.jamo === jamo && exp.cell[0] === cell[0] && exp.cell[1] === cell[1]) {
      onCorrectRef.current?.();
    }
  }, []);

  const value = useMemo<TutorialContextValue>(
    () => ({
      highlight,
      setHighlight,
      isPlaying,
      setIsPlaying,
      expected,
      setExpected,
      notifyPlacement,
      onCorrectRef,
    }),
    [highlight, isPlaying, expected, setExpected, notifyPlacement]
  );
  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

/** Provider 없이도 EMPTY 반환 — 일반 게임 모드 */
export function useTutorialHighlight(): TutorialHighlight {
  const ctx = useContext(TutorialContext);
  return ctx?.highlight ?? EMPTY_HIGHLIGHT;
}

export function useTutorialIsPlaying(): boolean {
  const ctx = useContext(TutorialContext);
  return ctx?.isPlaying ?? false;
}

export function useTutorialExpected(): TutorialExpected | null {
  const ctx = useContext(TutorialContext);
  return ctx?.expected ?? null;
}

export function useTutorialNotify(): (jamo: string, cell: [number, number]) => void {
  const ctx = useContext(TutorialContext);
  // Provider 밖이면 noop
  return ctx?.notifyPlacement ?? (() => {});
}

/** Tutorial 자체 — Provider 필수 */
export function useTutorialControls(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorialControls must be inside TutorialProvider');
  return ctx;
}
