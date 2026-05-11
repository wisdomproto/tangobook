import { useEffect, useState, type ReactNode } from 'react';

/**
 * 모바일 가로 강제 gate — 세로(portrait) + 모바일(`pointer: coarse`) 일 때 회전 prompt 표시.
 *
 * - 가로면 children 그대로 (gate 없음)
 * - 세로 + 모바일이면 children 위에 fixed z-[1000] 풀스크린 오버레이
 * - "확인" 버튼: best-effort fullscreen + `screen.orientation.lock('landscape')` 시도.
 *   대부분 모바일 브라우저가 lock 을 거부하므로 사용자가 직접 회전해야 함.
 *   사용자가 가로로 회전하면 matchMedia change 로 gate 자동 닫힘.
 * - 데스크탑 (coarse pointer X) 은 세로로 리사이즈돼도 gate 안 띄움.
 */
export function MobileLandscapeGate({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mqPortrait = window.matchMedia('(orientation: portrait)');
    const mqCoarse = window.matchMedia('(hover: none) and (pointer: coarse)');
    const update = () => setShow(mqPortrait.matches && mqCoarse.matches);
    update();
    mqPortrait.addEventListener('change', update);
    mqCoarse.addEventListener('change', update);
    return () => {
      mqPortrait.removeEventListener('change', update);
      mqCoarse.removeEventListener('change', update);
    };
  }, []);

  const handleConfirm = async () => {
    try {
      const el = document.documentElement as HTMLElement & {
        requestFullscreen?: () => Promise<void>;
      };
      if (el.requestFullscreen) await el.requestFullscreen();
      // @ts-expect-error screen.orientation.lock 타입 누락 (실험적 API)
      await screen.orientation?.lock?.('landscape');
    } catch {
      /* 대부분 모바일은 거부 — 사용자가 직접 회전해야 함 */
    }
  };

  if (!show) return <>{children}</>;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink-900/95 backdrop-blur-sm p-6">
        <div className="rounded-3xl bg-white shadow-pop px-8 py-10 max-w-sm w-full flex flex-col items-center gap-5 text-center">
          <div className="text-7xl" aria-hidden>
            📱
          </div>
          <div className="text-5xl text-coral-500 animate-pulse" aria-hidden>
            ↻
          </div>
          <h2 className="text-2xl font-black font-display text-ink-900">가로로 돌려주세요!</h2>
          <p className="text-base text-ink-500">게임은 가로 모드에서 더 잘 보여요.</p>
          <button
            onClick={handleConfirm}
            className="mt-2 px-8 py-3 rounded-full bg-gradient-to-b from-coral-400 to-coral-600 text-white font-black text-lg shadow-pop hover:scale-105 active:scale-95 transition"
          >
            확인
          </button>
        </div>
      </div>
    </>
  );
}
