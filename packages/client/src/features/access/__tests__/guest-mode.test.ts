import { describe, it, expect, beforeEach } from 'vitest';
import {
  guestWindow,
  startGuestMode,
  getEntryChoice,
  getGuestStartedAt,
  markAuthChoice,
  GUEST_FREE_DAYS,
} from '../lib/guest-mode';

const DAY = 86_400_000;
const NOW = Date.parse('2026-07-25T00:00:00Z');

describe('guestWindow (순수 계산)', () => {
  it('앵커 없음 → 비활성(선택 전)', () => {
    expect(guestWindow(null, NOW)).toEqual({ active: false, expired: false, daysLeft: 0 });
  });

  it('방금 시작 → 활성, 30일 남음', () => {
    const w = guestWindow(NOW, NOW);
    expect(w.active).toBe(true);
    expect(w.expired).toBe(false);
    expect(w.daysLeft).toBe(GUEST_FREE_DAYS);
  });

  it('10일 경과 → 활성, 20일 남음', () => {
    const w = guestWindow(NOW - 10 * DAY, NOW);
    expect(w.active).toBe(true);
    expect(w.daysLeft).toBe(20);
  });

  it('30일 경과 → 만료(전체 잠금 → 가입 유도)', () => {
    const w = guestWindow(NOW - 30 * DAY, NOW);
    expect(w.active).toBe(false);
    expect(w.expired).toBe(true);
    expect(w.daysLeft).toBe(0);
  });

  it('경계: 29일 23시간 → 아직 활성', () => {
    const w = guestWindow(NOW - (30 * DAY - 3_600_000), NOW);
    expect(w.active).toBe(true);
    expect(w.daysLeft).toBe(1);
  });
});

describe('localStorage 앵커', () => {
  beforeEach(() => localStorage.clear());

  it('선택 전 → choice/앵커 없음', () => {
    expect(getEntryChoice()).toBeNull();
    expect(getGuestStartedAt()).toBeNull();
  });

  it('startGuestMode → choice=guest + 앵커 기록', () => {
    startGuestMode(NOW);
    expect(getEntryChoice()).toBe('guest');
    expect(getGuestStartedAt()).toBe(NOW);
  });

  it('두 번 호출해도 앵커는 최초 시각 유지(창 연장 방지)', () => {
    startGuestMode(NOW - 5 * DAY);
    startGuestMode(NOW); // 재선택
    expect(getGuestStartedAt()).toBe(NOW - 5 * DAY);
  });

  it('markAuthChoice → choice=auth, 게스트 앵커는 만들지 않음', () => {
    markAuthChoice();
    expect(getEntryChoice()).toBe('auth');
    expect(getGuestStartedAt()).toBeNull();
  });
});
