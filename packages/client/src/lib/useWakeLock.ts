import { useEffect } from 'react';

/**
 * 화면이 자동으로 꺼지지 않게 잡아 둔다(Screen Wake Lock).
 *
 * 🔴 왜 필요한가: 동화 뷰어는 **나레이션(오디오) + 페이지 이미지 자동 넘김**이라 `<video>` 가 없다.
 *    유튜브·넷플릭스는 비디오 재생 중 브라우저가 화면을 안 끄지만, 오디오+이미지는 "가만히 있다"고
 *    보고 화면을 끈다(사용자: "우리 동화 볼 때 자꾸 자동 화면 잠금"). 그래서 명시적으로 lock 을 건다.
 *
 * 🔴 **탭을 숨겼다 돌아오면 lock 이 자동 해제된다** — `visibilitychange` 로 다시 잡는다.
 * 🔴 지원 안 하는 브라우저(구형 iOS Safari 등)는 조용히 넘어간다 — 없어도 앱은 정상 동작한다.
 *
 * @param active 잡을지 여부. 뷰어 마운트 동안 화면을 켜 두려면 그냥 `true`.
 */
export function useWakeLock(active = true): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch {
        // 저전력 모드·권한 거부 등 — 화면이 꺼질 수 있을 뿐 앱은 그대로 돈다.
      }
    };

    void acquire();

    const onVisible = () => {
      if (!cancelled && document.visibilityState === 'visible') void acquire();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}
