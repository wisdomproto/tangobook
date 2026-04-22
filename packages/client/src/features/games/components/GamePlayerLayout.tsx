import type { ReactNode } from 'react';

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';

// 각 플레이어가 선언한 maxWidth를 한 단계씩 위로 확장 — 큰 화면(데스크톱·iPad Pro)에서
// 게임 영역이 좁아 보이는 문제 해결. 태블릿(≤1024px)에선 기존과 거의 동일 체감.
const MAX_W: Record<MaxWidth, string> = {
  sm: 'max-w-xl', // 576px (was 384)
  md: 'max-w-2xl', // 672px (was 448)
  lg: 'max-w-3xl', // 768px (was 512)
  xl: 'max-w-4xl', // 896px (was 576)
  '2xl': 'max-w-5xl', // 1024px (was 672)
  '3xl': 'max-w-6xl', // 1152px (was 768)
  '4xl': 'max-w-7xl', // 1280px (was 896)
  '5xl': 'max-w-[1440px]', // (was 1024)
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
          className="mt-4 sm:mt-6 shrink-0 text-sm text-ink-500 hover:text-ink-700 dark:text-peach-200/60 dark:hover:text-peach-200 transition-colors"
        >
          ← 돌아가기
        </button>
      )}
    </div>
  );
}
