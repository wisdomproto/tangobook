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
    preloadUiSounds();

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
    return () => document.removeEventListener('pointerdown', onPointerDown, { capture: true });
  }, []);

  return null;
}
