import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MobileLandscapeGate } from './MobileLandscapeGate';
import { gameSafeAreaStyle } from '../lib/game-safe-area';
import { PhonicsBackdrop } from '@/features/phonics-learner/components/PhonicsBackdrop';
import { useVocabSource } from '@/features/learning/context/VocabSourceContext';
import '@/features/phonics-learner/components/phonics-activities.css';

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
  /** 기존 호출부 호환용. v2 공통 학습 바탕을 쓰며 장식 배경은 적용하지 않는다. */
  bgImageUrl?: string;
}

/** 전체 게임 플레이어 공통 래퍼 — 센터링 + 반응형 max-width + 좌상단 돌아가기 버튼 (단원 목록 back 과 통일).
 *  vocab launch (`VocabularyStudyContent`) 의 `motion.div` wrapper 가 viewport 0 부터 안 시작하는 케이스가 있어
 *  플레이어 root 를 `fixed inset-0 z-[60]` 으로 viewport 직접 덮음 → 뒷페이지 노출 차단. */
export function GamePlayerLayout({ children, onBack, maxWidth = '2xl' }: GamePlayerLayoutProps) {
  const { t } = useTranslation('games');
  const source = useVocabSource();
  const phonics = source?.source === 'phonics';
  // 좌우 시스템 UI(안드 내비바·노치·인앱 컨트롤) 회피 + 동적 뷰포트 높이 캡 → gameSafeAreaStyle.
  // 세로 여백은 className py-clamp 로 유지(헬퍼는 세로 미관여).
  return (
    <MobileLandscapeGate>
      <div
        data-phonics-game={phonics || undefined}
        data-phonics-language={
          phonics ? (source?.unitId.startsWith('en-') ? 'en' : 'ko') : undefined
        }
        className="learning-stage fixed inset-0 z-[60] flex flex-col py-[clamp(0.375rem,1.5vh,1.5rem)] bg-cream-50 overflow-hidden"
        style={gameSafeAreaStyle()}
      >
        {phonics && <PhonicsBackdrop />}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="self-start min-h-11 mb-2 inline-flex items-center gap-2 px-4 text-base rounded-full bg-white shadow-soft text-ink-700 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral-700 shrink-0 break-keep"
          >
            ← {t('header.back')}
          </button>
        )}
        <div className={`w-full mx-auto flex-1 min-h-0 flex flex-col ${MAX_W[maxWidth]}`}>
          {children}
        </div>
      </div>
    </MobileLandscapeGate>
  );
}
