import type { ReactNode } from 'react';

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';

const MAX_W: Record<MaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: '',
};

interface GamePlayerLayoutProps {
  children: ReactNode;
  onBack?: () => void;
  maxWidth?: MaxWidth;
}

/** 전체 게임 플레이어 공통 래퍼 — 센터링 + 반응형 max-width + 돌아가기 버튼 */
export function GamePlayerLayout({ children, onBack, maxWidth = '2xl' }: GamePlayerLayoutProps) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-2 sm:px-4 py-4 sm:py-6">
      <div className={`w-full ${MAX_W[maxWidth]}`}>{children}</div>
      {onBack && (
        <button
          onClick={onBack}
          className="mt-4 sm:mt-6 shrink-0 text-sm text-emerald-700/60 hover:text-emerald-800 transition-colors"
        >
          ← 돌아가기
        </button>
      )}
    </div>
  );
}
