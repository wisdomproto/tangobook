import { useCallback, useSyncExternalStore } from 'react';
import {
  isUiMuted,
  playUi,
  setUiMuted,
  subscribeUiMuted,
  toggleUiMuted,
  type UiSoundName,
} from './uiSound';

/**
 * UI 효과음 훅 — 음소거 상태를 반응형으로 구독.
 * 단순 재생만 필요하면 `playUi(name)` 를 직접 import 해도 됨.
 */
export function useUiSound() {
  const muted = useSyncExternalStore(subscribeUiMuted, isUiMuted, isUiMuted);
  const play = useCallback((name: UiSoundName) => playUi(name), []);
  return {
    playUi: play,
    muted,
    setMuted: setUiMuted,
    toggleMuted: toggleUiMuted,
  };
}
