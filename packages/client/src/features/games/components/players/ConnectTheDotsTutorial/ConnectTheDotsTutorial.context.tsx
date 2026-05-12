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
  /** 현재 pulse 중인 점의 order (1-indexed) */
  pulseOrder: number | null;
}

export interface TutorialExpected {
  order: number;
}

const EMPTY_HIGHLIGHT: TutorialHighlight = {
  pulseOrder: null,
};

interface TutorialContextValue {
  highlight: TutorialHighlight;
  setHighlight: (next: TutorialHighlight) => void;
  isPlaying: boolean;
  setIsPlaying: (next: boolean) => void;
  expected: TutorialExpected | null;
  setExpected: (next: TutorialExpected | null) => void;
  notifyTap: (order: number) => void;
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

  const notifyTap = useCallback((order: number) => {
    const exp = expectedRef.current;
    if (!exp) return;
    if (exp.order === order) onCorrectRef.current?.();
  }, []);

  const value = useMemo<TutorialContextValue>(
    () => ({
      highlight,
      setHighlight,
      isPlaying,
      setIsPlaying,
      expected,
      setExpected,
      notifyTap,
      onCorrectRef,
    }),
    [highlight, isPlaying, expected, setExpected, notifyTap]
  );
  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorialHighlight(): TutorialHighlight {
  return useContext(TutorialContext)?.highlight ?? EMPTY_HIGHLIGHT;
}

export function useTutorialIsPlaying(): boolean {
  return useContext(TutorialContext)?.isPlaying ?? false;
}

export function useTutorialExpected(): TutorialExpected | null {
  return useContext(TutorialContext)?.expected ?? null;
}

export function useTutorialNotify(): (order: number) => void {
  return useContext(TutorialContext)?.notifyTap ?? (() => {});
}

export function useTutorialControls(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorialControls must be inside TutorialProvider');
  return ctx;
}
