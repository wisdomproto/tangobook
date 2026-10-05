import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLogEventsBatch } from './useLogEvent';
import { readGuestEvents } from '../lib/guest-events';
const auth = vi.hoisted(() => ({ activeProfile: null }));
vi.mock('@/features/auth/context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../api/events.api', () => ({ eventsApi: { insert: vi.fn().mockResolvedValue(false) } }));
beforeEach(() => localStorage.clear());
describe('guest batch logging', () => {
  it('retains every word encounter and game result with a stable ID', async () => {
    const { result } = renderHook(() => useLogEventsBatch());
    await act(async () => {
      await result.current([
        { event_type: 'word_exposed', word: '오리', metadata: { lang: 'ko' } },
        { event_type: 'word_correct', word: '오리', game_type: 'korean-block' },
      ]);
    });
    const records = readGuestEvents();
    expect(records).toHaveLength(2);
    expect(new Set(records.map((event) => event.id)).size).toBe(2);
    expect(records.every((event) => event.profile_id === '')).toBe(true);
  });
});
