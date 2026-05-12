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
