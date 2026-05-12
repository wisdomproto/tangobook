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

interface TutorialContextValue {
  /** 캔버스 pulse 강조 (wait phase) */
  pulseCanvas: boolean;
  setPulseCanvas: (next: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (next: boolean) => void;
  /** wait phase 진입 시 true. 사용자가 첫 stroke 시작하면 notifyDraw() */
  waitingForDraw: boolean;
  setWaitingForDraw: (next: boolean) => void;
  notifyDraw: () => void;
  onCorrectRef: MutableRefObject<(() => void) | null>;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [pulseCanvas, setPulseCanvas] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waitingForDraw, setWaitingForDrawState] = useState(false);
  const waitingRef = useRef(false);
  const onCorrectRef = useRef<(() => void) | null>(null);

  const setWaitingForDraw = useCallback((next: boolean) => {
    waitingRef.current = next;
    setWaitingForDrawState(next);
  }, []);

  const notifyDraw = useCallback(() => {
    if (!waitingRef.current) return;
    onCorrectRef.current?.();
  }, []);

  const value = useMemo<TutorialContextValue>(
    () => ({
      pulseCanvas,
      setPulseCanvas,
      isPlaying,
      setIsPlaying,
      waitingForDraw,
      setWaitingForDraw,
      notifyDraw,
      onCorrectRef,
    }),
    [pulseCanvas, isPlaying, waitingForDraw, setWaitingForDraw, notifyDraw]
  );
  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorialPulse(): boolean {
  return useContext(TutorialContext)?.pulseCanvas ?? false;
}

export function useTutorialIsPlaying(): boolean {
  return useContext(TutorialContext)?.isPlaying ?? false;
}

export function useTutorialNotify(): () => void {
  return useContext(TutorialContext)?.notifyDraw ?? (() => {});
}

export function useTutorialControls(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorialControls must be inside TutorialProvider');
  return ctx;
}
