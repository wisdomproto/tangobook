import type { ReactNode } from 'react';
import { MobileLandscapeGate } from './MobileLandscapeGate';
import { isInAppBrowser } from '@/lib/in-app-browser';

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
  // 🔴 인앱 브라우저(인스타·페북 등)는 가로 모드에서 페이지 위에 자체 컨트롤 바(뒤로/닫기)를
  // 좌우 가장자리에 겹쳐 그린다 → 화면 끝에 붙은 카드가 그 밑으로 잘려 보임. 인앱일 때만
  // 좌우 안전 여백을 넉넉히 줘서 컨트롤 바를 피한다. (일반 브라우저·PWA 는 기존 px 유지.)
  const inApp = isInAppBrowser();
  const bgStyle = bgImageUrl
    ? {
        backgroundImage: `url(${bgImageUrl})`,
        backgroundSize: 'cover' as const,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : undefined;
  const safePad = inApp
    ? {
        paddingLeft: 'max(3rem, env(safe-area-inset-left))',
        paddingRight: 'max(3rem, env(safe-area-inset-right))',
      }
    : undefined;
  return (
    <MobileLandscapeGate>
      <div
        className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-[clamp(0.375rem,1.5vh,1.5rem)] bg-gradient-to-b from-cream-50 to-peach-100 overflow-hidden"
        style={bgStyle || safePad ? { ...bgStyle, ...safePad } : undefined}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="self-start mb-[clamp(0.25rem,1vh,0.75rem)] inline-flex items-center gap-2 px-[clamp(0.75rem,2vw,1.25rem)] py-[clamp(0.375rem,1.25vh,0.75rem)] text-[clamp(0.875rem,2vh,1.125rem)] rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition shrink-0 break-keep"
          >
            ← 돌아가기
          </button>
        )}
        <div className={`w-full mx-auto flex-1 min-h-0 flex flex-col ${MAX_W[maxWidth]}`}>
          {children}
        </div>
      </div>
    </MobileLandscapeGate>
  );
}
