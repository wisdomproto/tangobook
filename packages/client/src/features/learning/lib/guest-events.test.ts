import { describe, it, expect, beforeEach } from 'vitest';
import type { LearningEventInsert } from '@tangobook/shared';
import {
  appendGuestEvent,
  readGuestEvents,
  countGuestEvents,
  drainGuestEvents,
} from './guest-events';

const ev = (n: number): LearningEventInsert =>
  ({
    profile_id: '',
    event_type: 'page_read',
    storybook_id: `b${n}`,
    created_at: new Date(2026, 0, 1, 0, n).toISOString(),
  }) as LearningEventInsert;

beforeEach(() => localStorage.clear());

describe('게스트 학습 기록 (로컬)', () => {
  it('쌓이고 읽힌다', () => {
    appendGuestEvent(ev(1));
    appendGuestEvent(ev(2));
    expect(countGuestEvents()).toBe(2);
    expect(readGuestEvents()[1].storybook_id).toBe('b2');
  });

  // 🔴 상한을 넘으면 **오래된 것부터** 버린다 — 최근 기록이 리포트에서 더 쓸모 있다.
  it('상한을 넘으면 오래된 것부터 버린다', () => {
    for (let i = 0; i < 2100; i++) appendGuestEvent(ev(i));
    const kept = readGuestEvents();
    expect(kept.length).toBe(2000);
    expect(kept[0].storybook_id).toBe('b100');
  });

  it('꺼내면 프로필이 붙고 로컬은 비워진다', () => {
    appendGuestEvent(ev(1));
    const drained = drainGuestEvents('p1');
    expect(drained[0].profile_id).toBe('p1');
    expect(countGuestEvents()).toBe(0);
  });

  it('쌓인 게 없으면 빈 배열', () => {
    expect(drainGuestEvents('p1')).toEqual([]);
  });
});
