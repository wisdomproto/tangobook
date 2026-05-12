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
  /** 시연 중 이미지 카드 idx (좌측) */
  highlightImageIdx: number | null;
  /** 시연 중 단어 카드 idx (우측) */
  highlightWordIdx: number | null;
  /** Arrow: 이미지 → 단어. 시연 중이면 itemIdx 동일 */
  arrowItemIdx: number | null;
}

export interface TutorialExpected {
  itemIdx: number;
}

const EMPTY_HIGHLIGHT: TutorialHighlight = {
  highlightImageIdx: null,
  highlightWordIdx: null,
  arrowItemIdx: null,
};

interface TutorialContextValue {
  highlight: TutorialHighlight;
  setHighlight: (next: TutorialHighlight) => void;
  isPlaying: boolean;
  setIsPlaying: (next: boolean) => void;
  expected: TutorialExpected | null;
  setExpected: (next: TutorialExpected | null) => void;
  /** 플레이어가 매칭 성공 시 호출. expected 와 일치하면 onCorrect 실행. */
  notifyMatch: (itemIdx: number) => void;
  onCorrectRef: MutableRefObject<(() => void) | null>;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [highlight, setHighlight] = useState<TutorialHighlight>(EMPTY_HIGHLIGHT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expected, setExpectedState] = useState<TutorialExpected | null>(null);
  const expectedRef = useRef<TutorialExpected | null>(null);
  const onCorrectRef = useRef<(() => void) | null>(null);

  const setExpected = useCallback((next: TutorialExpected | null) => {
    expectedRef.current = next;
    setExpectedState(next);
  }, []);

  const notifyMatch = useCallback((itemIdx: number) => {
    const exp = expectedRef.current;
    if (!exp) return;
    if (exp.itemIdx === itemIdx) {
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
      notifyMatch,
      onCorrectRef,
    }),
    [highlight, isPlaying, expected, setExpected, notifyMatch]
  );
  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

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

export function useTutorialNotify(): (itemIdx: number) => void {
  const ctx = useContext(TutorialContext);
  return ctx?.notifyMatch ?? (() => {});
}

export function useTutorialControls(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorialControls must be inside TutorialProvider');
  return ctx;
}
