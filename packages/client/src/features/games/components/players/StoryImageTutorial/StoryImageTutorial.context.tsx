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
  /** pulse 중인 옵션 URL */
  pulseUrl: string | null;
}

export interface TutorialExpected {
  url: string;
}

const EMPTY_HIGHLIGHT: TutorialHighlight = { pulseUrl: null };

interface TutorialContextValue {
  highlight: TutorialHighlight;
  setHighlight: (next: TutorialHighlight) => void;
  isPlaying: boolean;
  setIsPlaying: (next: boolean) => void;
  expected: TutorialExpected | null;
  setExpected: (next: TutorialExpected | null) => void;
  notifyPick: (url: string) => void;
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

  const notifyPick = useCallback((url: string) => {
    const exp = expectedRef.current;
    if (!exp) return;
    if (exp.url === url) onCorrectRef.current?.();
  }, []);

  const value = useMemo<TutorialContextValue>(
    () => ({
      highlight,
      setHighlight,
      isPlaying,
      setIsPlaying,
      expected,
      setExpected,
      notifyPick,
      onCorrectRef,
    }),
    [highlight, isPlaying, expected, setExpected, notifyPick]
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

export function useTutorialNotify(): (url: string) => void {
  return useContext(TutorialContext)?.notifyPick ?? (() => {});
}

export function useTutorialControls(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorialControls must be inside TutorialProvider');
  return ctx;
}
