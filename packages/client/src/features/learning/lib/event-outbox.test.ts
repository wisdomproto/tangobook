import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enqueueEvents, flushPendingEvents, readPendingEvents } from './event-outbox';
import type { LearningEventInsert } from '@tangobook/shared';
const event = (id: string, profile = 'p1'): LearningEventInsert => ({
  id,
  profile_id: profile,
  event_type: 'word_exposed',
  word: '오리',
});
beforeEach(() => localStorage.clear());
describe('durable learning outbox', () => {
  it('retains failed uploads and retries the same IDs without deleting another child’s records', async () => {
    enqueueEvents([event('a'), event('b', 'p2')]);
    const insert = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    await flushPendingEvents('p1', insert);
    expect(readPendingEvents().map((e) => e.id)).toEqual(['a', 'b']);
    await flushPendingEvents('p1', insert);
    expect(insert.mock.calls[0][0][0].id).toBe(insert.mock.calls[1][0][0].id);
    expect(readPendingEvents().map((e) => e.id)).toEqual(['b']);
  });
  it('acknowledges only the sent snapshot, preserving records appended during upload', async () => {
    enqueueEvents([event('a-during')]);
    await flushPendingEvents('p1', async () => {
      enqueueEvents([event('new')]);
      return true;
    });
    expect(readPendingEvents().map((e) => e.id)).toEqual(['new']);
  });
  it('serializes simultaneous flushes and deduplicates caller-provided IDs', async () => {
    enqueueEvents([event('a-parallel'), event('a-parallel')]);
    const insert = vi.fn().mockResolvedValue(true);
    await Promise.all([flushPendingEvents('p1', insert), flushPendingEvents('p1', insert)]);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(readPendingEvents()).toEqual([]);
  });
  it('retains records when the network throws', async () => {
    enqueueEvents([event('a-throw')]);
    await flushPendingEvents('p1', async () => {
      throw new Error('offline');
    });
    expect(readPendingEvents()).toHaveLength(1);
  });
});

it('continues recording when persistent storage is unavailable, and marks it as temporary', async () => {
  const { learningStorageIsTemporary } = await import('./event-outbox');
  const original = Storage.prototype.setItem;
  const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('quota', 'QuotaExceededError');
  });
  await enqueueEvents([event('temporary')]);
  expect(learningStorageIsTemporary()).toBe(true);
  expect(readPendingEvents().some((record) => record.id === 'temporary')).toBe(true);
  blocked.mockRestore();
  expect(Storage.prototype.setItem).toBe(original);
  await flushPendingEvents('p1', async () => true);
  expect(learningStorageIsTemporary()).toBe(false);
});
