import { useEffect } from 'react';
import { playUi, preloadUiSounds, type UiSoundName } from '@/lib/uiSound';

const INTERACTIVE = 'button, a[href], [role="button"], [data-sound]';
const VALID = new Set<UiSoundName>([
  'tap',
  'select',
  'back',
  'toggle',
  'open',
  'close',
  'book-open',
  'page-turn',
  'star',
  'reward',
  'success',
  'play',
]);

/**
 * 앱 전역에 마운트 — 모든 버튼/링크 클릭에 탭 효과음을 위임 방식으로 붙인다.
 * (버튼 하나하나 편집하지 않아도 커버)
 *
 * 개별 요소에서 소리를 바꾸거나 끄려면:
 *  - `data-sound="none"`   → 무음 (특수음을 따로 재생하는 요소 등)
 *  - `data-sound="select"` → 다른 UI 효과음으로 교체
 * 특수음(별/보상/책펼침/페이지넘김/재생)은 각 호출부에서 `playUi` 로 직접 재생.
 */
export function GlobalUiSound() {
  useEffect(() => {
    /**
     * 🔴 **효과음 프리로드는 첫 화면이 그려진 뒤에**(2026-08-11). 마운트 즉시 부르면 13종 ×
     *    풀 4개 = **오디오 요청 52건이 첫 화면 리소스와 같이 출발한다** — 광고로 들어온 4G 인앱
     *    브라우저에선 그 52건이 히어로 그림 앞에 줄을 선다(실측: /hangul 첫 화면 요청 89건 중 52건).
     *    소리는 **탭이 있어야** 나므로 급할 이유가 없다. idle 에 밀고, 그마저 안 오면 3초 뒤.
     * 🔴 첫 탭이 idle 보다 빨라도 무음이 아니다 — `playUi` 가 풀이 없으면 그때 만든다(`ensurePool`).
     */
    const idle = (
      window as unknown as {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    const warm = () => preloadUiSounds();
    const handle = idle ? idle(warm, { timeout: 3000 }) : window.setTimeout(warm, 3000);

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target || typeof target.closest !== 'function') return;
      const el = target.closest(INTERACTIVE) as HTMLElement | null;
      if (!el) return;
      // 비활성 버튼은 무음
      if (el instanceof HTMLButtonElement && el.disabled) return;
      if (el.getAttribute('aria-disabled') === 'true') return;

      const override = el.dataset.sound as UiSoundName | 'none' | undefined;
      if (override === 'none') return;
      const name: UiSoundName = override && VALID.has(override) ? override : 'tap';
      playUi(name);
    };

    document.addEventListener('pointerdown', onPointerDown, { capture: true });
    return () => {
      const cancel = (window as unknown as { cancelIdleCallback?: (h: number) => void })
        .cancelIdleCallback;
      if (idle && cancel) cancel(handle);
      else window.clearTimeout(handle);
      document.removeEventListener('pointerdown', onPointerDown, { capture: true });
    };
  }, []);

  return null;
}
