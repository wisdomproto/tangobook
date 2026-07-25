/**
 * 게스트 모드 — 미로그인 방문자가 진입 게이트에서 "게스트로 시작"을 고르면 30일간
 * 전체 콘텐츠를 연다. 학습 데이터는 로컬 전용(계정 없음). 30일 지나면 전체 잠금 →
 * 가입 유도(EntryGate 가 벽으로 재등장).
 *
 * 🔴 순수 소프트 게이트다 — 앵커(guest_started_at)가 localStorage 라 캐시를 지우면
 * 창이 리셋된다(의도적으로 눈감음). 서버 검증 없음. 회원가입(1년 무료 + 동기화)이
 * 진짜 전환 목표.
 */
export const GUEST_FREE_DAYS = 30;

const KEY_CHOICE = 'tb_entry_choice'; // 'guest' | 'auth' | (없음=미선택)
const KEY_STARTED = 'tb_guest_started_at'; // ISO — 게스트 30일 창 앵커
const DAY_MS = 86_400_000;
/** 게스트 모드 상태 변경 시 발생 — 같은 탭 내 구독자(useGuestMode) 갱신용. */
export const GUEST_EVENT = 'tb-guest-mode-changed';

export type EntryChoice = 'guest' | 'auth' | null;

export interface GuestWindow {
  active: boolean;
  expired: boolean;
  daysLeft: number;
}

/** 순수 계산 — 앵커(ms)와 현재시각으로 창 상태. 앵커 없으면 비활성. */
export function guestWindow(startedAtMs: number | null, now: number = Date.now()): GuestWindow {
  if (startedAtMs == null) return { active: false, expired: false, daysLeft: 0 };
  const end = startedAtMs + GUEST_FREE_DAYS * DAY_MS;
  const active = now < end;
  return {
    active,
    expired: !active,
    daysLeft: active ? Math.ceil((end - now) / DAY_MS) : 0,
  };
}

function safeLs(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null; // 프라이빗 모드 등
  }
}

export function getEntryChoice(): EntryChoice {
  const v = safeLs()?.getItem(KEY_CHOICE);
  return v === 'guest' || v === 'auth' ? v : null;
}

export function getGuestStartedAt(): number | null {
  const v = safeLs()?.getItem(KEY_STARTED);
  const t = v ? Date.parse(v) : NaN;
  return Number.isNaN(t) ? null : t;
}

/** 게스트로 시작 — 선택 저장 + 창 앵커 최초 1회 설정(재선택해도 앵커 유지). */
export function startGuestMode(now: number = Date.now()): void {
  const ls = safeLs();
  if (!ls) return;
  ls.setItem(KEY_CHOICE, 'guest');
  if (!ls.getItem(KEY_STARTED)) ls.setItem(KEY_STARTED, new Date(now).toISOString());
  window.dispatchEvent(new Event(GUEST_EVENT));
}

/** 로그인/회원가입 경로 선택 — 게이트가 리다이렉트 전에 다시 뜨지 않도록 표시만. */
export function markAuthChoice(): void {
  const ls = safeLs();
  if (!ls) return;
  ls.setItem(KEY_CHOICE, 'auth');
  window.dispatchEvent(new Event(GUEST_EVENT));
}
