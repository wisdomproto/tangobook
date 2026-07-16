import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ViewerLoadingProps {
  /** 바 아래 짧은 안내 문구 (미지정 시 기본 로딩 문구) */
  label?: string;
}

/**
 * 책 진입 로딩 화면 — 점점 차오르는 프로그레스 바 (호리 마스코트 대체).
 * 버퍼링 이벤트가 거칠고 짧아 실제 %% 대신 ease-out 으로 부드럽게 차오르는 연출을 쓴다.
 * 실제 준비 완료(부모의 ttsReady) 시 화면이 책으로 교체되며 바는 사라진다.
 */
export function ViewerLoading({ label }: ViewerLoadingProps) {
  const { t } = useTranslation('viewer');
  const displayLabel = label ?? t('loading.openingBook');
  const [progress, setProgress] = useState(4);
  useEffect(() => {
    // 마운트 직후 목표치로 올려 CSS width transition 이 ease-out 으로 차오르게 한다(앞은 빠르게, 끝은 천천히).
    const t = setTimeout(() => setProgress(95), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-cream-50 px-6 sm:px-10">
      <div className="w-full max-w-[280px]">
        <div className="h-5 w-full overflow-hidden rounded-full bg-peach-100 shadow-inner">
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-coral-400 to-coral-500"
            style={{ width: `${progress}%`, transition: 'width 2200ms ease-out' }}
          >
            {/* 윗면 광택 하이라이트 */}
            <span className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
      <p className="font-display text-base font-black text-ink-500 break-keep">{displayLabel}</p>
    </div>
  );
}
