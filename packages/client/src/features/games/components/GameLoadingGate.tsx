import { useEffect, useState } from 'react';

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
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
  return (
    <div className="fixed inset-0 z-[60] bg-cream-50 flex flex-col items-center justify-center gap-6 p-8">
      <p className="text-2xl font-black text-ink-900 font-display break-keep text-center">
        그림과 소리를 준비하고 있어요
      </p>
      <div className="w-full max-w-sm h-5 rounded-full bg-peach-200 overflow-hidden">
        <div
          className="h-full bg-coral-500 transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-lg font-black text-ink-500 tabular-nums">{pct}%</p>
      <button
        onClick={onSkip}
        className="mt-2 px-8 py-3 rounded-full bg-amber-500 text-white font-black shadow-pop text-lg"
      >
        바로 시작
      </button>
    </div>
  );
}
