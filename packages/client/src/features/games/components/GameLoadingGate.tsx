import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 게임 자산 프리로드 진행률바. 250ms 안에 준비되면(대부분 캐시 hit) 아무것도 안 그림.
 * 유아 대상 톤, 마스코트 없음. onSkip = 즉시 시작(상한 대기 회피).
 */
export function GameLoadingGate({
  loaded,
  total,
  onSkip,
}: {
  loaded: number;
  total: number;
  onSkip: () => void;
}) {
  const { t } = useTranslation('games');
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
  return (
    <div className="fixed inset-0 z-[60] bg-cream-50 flex flex-col items-center justify-center gap-6 p-6 sm:p-8">
      <p className="text-2xl font-black text-ink-900 font-display break-keep text-center">
        {t('loadingGate.preparing')}
      </p>
      <div
        className="w-full max-w-sm h-3 rounded-full bg-ink-100 overflow-hidden"
        role="progressbar"
        aria-label={t('loadingGate.preparing')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className="h-full bg-coral-700 motion-safe:transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-lg font-semibold text-ink-600 tabular-nums">{pct}%</p>
      <button
        type="button"
        onClick={onSkip}
        className="mt-2 min-h-12 px-6 py-3 rounded-full border border-ink-200 bg-white text-ink-900 font-bold text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral-700"
      >
        {t('loadingGate.skip')}
      </button>
    </div>
  );
}
