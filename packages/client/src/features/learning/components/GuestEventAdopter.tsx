import { useAdoptGuestEvents } from '../hooks/useAdoptGuestEvents';

/** 훅 하나를 앱 최상단에 걸기 위한 껍데기 — 그리는 것은 없다. */
export function GuestEventAdopter() {
  useAdoptGuestEvents();
  return null;
}
