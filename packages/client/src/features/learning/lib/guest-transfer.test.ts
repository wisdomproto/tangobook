import { beforeEach, expect, it, vi } from 'vitest';
import { appendGuestEvents, readGuestEvents } from './guest-events';
import { transferGuestEvents } from './guest-transfer';
const insert = vi.hoisted(() => vi.fn());
vi.mock('../api/events.api', () => ({ eventsApi: { insert } }));
beforeEach(() => {
  localStorage.clear();
  insert.mockReset();
});
it('acknowledges successful chunks and retries the failed chunk with the same IDs', async () => {
  await appendGuestEvents(
    Array.from({ length: 150 }, (_, index) => ({
      id: `guest-${index}`,
      profile_id: '',
      event_type: 'word_exposed' as const,
      word: '오리',
    }))
  );
  insert.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  expect(await transferGuestEvents('p')).toBe(false);
  expect(readGuestEvents()).toHaveLength(50);
  expect(readGuestEvents()[0]).toMatchObject({ id: 'guest-100', profile_id: 'p' });
  insert.mockResolvedValue(true);
  expect(await transferGuestEvents('p')).toBe(true);
  expect(insert.mock.calls[2][0][0].id).toBe('guest-100');
  expect(readGuestEvents()).toEqual([]);
});
it('preserves data when upload throws, including its destination', async () => {
  await appendGuestEvents([{ id: 'guest', profile_id: '', event_type: 'word_exposed' }]);
  insert.mockRejectedValue(new Error('offline'));
  expect(await transferGuestEvents('p')).toBe(false);
  expect(readGuestEvents()[0].profile_id).toBe('p');
  expect(await transferGuestEvents('sibling')).toBe(true);
  expect(readGuestEvents()).toHaveLength(1);
});
