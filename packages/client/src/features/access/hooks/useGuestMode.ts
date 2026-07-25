import { useCallback, useEffect, useState } from 'react';
import {
  GUEST_EVENT,
  getEntryChoice,
  getGuestStartedAt,
  guestWindow,
  type EntryChoice,
  type GuestWindow,
} from '../lib/guest-mode';

export interface GuestModeState extends GuestWindow {
  choice: EntryChoice;
  /** 진입 게이트를 띄워야 하는가 — 미선택이거나 게스트 30일이 만료된 경우. */
  needsGate: boolean;
  refresh: () => void;
}

/**
 * 게스트 모드 상태 구독 — localStorage 앵커 기반이라 storage 이벤트(다른 탭) +
 * GUEST_EVENT(같은 탭)로 갱신한다.
 */
export function useGuestMode(): GuestModeState {
  const read = useCallback(() => {
    const choice = getEntryChoice();
    const win = guestWindow(getGuestStartedAt());
    return { choice, ...win };
  }, []);

  const [state, setState] = useState(read);
  const refresh = useCallback(() => setState(read()), [read]);

  useEffect(() => {
    window.addEventListener(GUEST_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(GUEST_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  // 게이트 조건: 아직 아무것도 안 골랐거나(첫 방문), 게스트로 골랐는데 30일이 끝난 경우.
  const needsGate = state.choice === null || (state.choice === 'guest' && state.expired);

  return { ...state, needsGate, refresh };
}
