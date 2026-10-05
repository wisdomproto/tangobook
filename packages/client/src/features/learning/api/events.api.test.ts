import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: mock, isSupabaseConfigured: true }));
import { eventsApi } from './events.api';
const event = (index: number) => ({
  id: `id-${index}`,
  created_at: '2026-10-05T00:00:00Z',
  profile_id: 'p',
  event_type: 'word_exposed',
  word: '오리',
});
function builder(pages: unknown[]) {
  const request = {
    select: vi.fn(),
    eq: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    or: vi.fn(),
    range: vi.fn(),
    upsert: vi.fn(),
  };
  for (const key of ['select', 'eq', 'lte', 'order', 'or'] as const)
    request[key].mockReturnValue(request);
  for (const page of pages) request.range.mockResolvedValueOnce(page);
  mock.from.mockReturnValue(request);
  return request;
}
beforeEach(() => vi.clearAllMocks());
describe('learning event API', () => {
  it('paginates beyond the default response size and preserves count', async () => {
    const request = builder([
      { data: Array.from({ length: 500 }, (_, i) => event(i)), count: 503, error: null },
      { data: [event(500), event(501), event(502)], count: null, error: null },
    ]);
    const result = await eventsApi.fetchByProfile('p');
    expect(result.events).toHaveLength(503);
    expect(result).toMatchObject({ total: 503, capped: false });
    expect(request.or).toHaveBeenCalledWith(expect.stringContaining('id.lt.id-499'));
  });
  it('marks bounded history as partial rather than a lifetime total', async () => {
    builder([{ data: [event(0), event(1)], count: 2000, error: null }]);
    expect(await eventsApi.fetchByProfile('p', 2)).toMatchObject({ total: 2000, capped: true });
  });
  it('propagates a page error instead of returning zero records', async () => {
    builder([{ data: null, count: null, error: new Error('offline') }]);
    await expect(eventsApi.fetchByProfile('p')).rejects.toThrow('offline');
  });
  it('ignores duplicate IDs so a retry does not insert again or grant rewards again', async () => {
    const request = builder([]);
    request.upsert.mockResolvedValue({ error: null });
    const records = [{ id: 'stable', profile_id: 'p', event_type: 'word_exposed' as const }];
    expect(await eventsApi.insert(records)).toBe(true);
    expect(request.upsert).toHaveBeenCalledWith(records, {
      onConflict: 'id',
      ignoreDuplicates: true,
    });
  });
});
