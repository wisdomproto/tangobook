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
  /** 현재 pop 중인 letter */
  popLetter: string | null;
  /** 현재 glow 중인 slot index */
  glowSlot: number | null;
  arrowFromLetter: string | null;
  arrowToSlot: number | null;
}

export interface TutorialExpected {
  letter: string;
  slot: number;
}

const EMPTY_HIGHLIGHT: TutorialHighlight = {
  popLetter: null,
  glowSlot: null,
  arrowFromLetter: null,
  arrowToSlot: null,
};

interface TutorialContextValue {
  highlight: TutorialHighlight;
  setHighlight: (next: TutorialHighlight) => void;
  isPlaying: boolean;
  setIsPlaying: (next: boolean) => void;
  expected: TutorialExpected | null;
  setExpected: (next: TutorialExpected | null) => void;
  notifyPlacement: (letter: string, slot: number) => void;
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

  const notifyPlacement = useCallback((letter: string, slot: number) => {
    const exp = expectedRef.current;
    if (!exp) return;
    if (exp.letter === letter && exp.slot === slot) {
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

export function useTutorialNotify(): (letter: string, slot: number) => void {
  const ctx = useContext(TutorialContext);
  return ctx?.notifyPlacement ?? (() => {});
}

export function useTutorialControls(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorialControls must be inside TutorialProvider');
  return ctx;
}
