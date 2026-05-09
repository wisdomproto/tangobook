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
  /** 배경 일러스트 URL (선택). 없으면 cream→peach 그라디언트. */
  bgImageUrl?: string;
}

/** 전체 게임 플레이어 공통 래퍼 — 센터링 + 반응형 max-width + 좌상단 돌아가기 버튼 (단원 목록 back 과 통일).
 *  vocab launch (`VocabularyStudyContent`) 의 `motion.div` wrapper 가 viewport 0 부터 안 시작하는 케이스가 있어
 *  플레이어 root 를 `fixed inset-0 z-[60]` 으로 viewport 직접 덮음 → 뒷페이지 노출 차단. */
export function GamePlayerLayout({
  children,
  onBack,
  maxWidth = '2xl',
  bgImageUrl,
}: GamePlayerLayoutProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 sm:py-6 bg-gradient-to-b from-cream-50 to-peach-100 overflow-hidden"
      style={
        bgImageUrl
          ? {
              backgroundImage: `url(${bgImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : undefined
      }
    >
      {onBack && (
        <button
          onClick={onBack}
          className="self-start mb-3 inline-flex items-center gap-2 px-5 py-3 text-lg rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition shrink-0"
        >
          ← 돌아가기
        </button>
      )}
      <div className={`w-full mx-auto flex-1 min-h-0 flex flex-col ${MAX_W[maxWidth]}`}>
        {children}
      </div>
    </div>
  );
}
