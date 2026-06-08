import { describe, it, expect } from 'vitest';
import { computeBulkInsertRows } from '../use-publish-records';

const r = (contentId: string, language: string) => ({
  contentId,
  projectId: 'p1',
  language,
  scheduledAt: '2026-06-10T00:00:00Z',
});

describe('computeBulkInsertRows (skip-on-conflict + stamp)', () => {
  it('inserts only rows whose (content,language) is not already live, stamping user_id/channel/status', () => {
    const out = computeBulkInsertRows(
      [r('c1', 'ko'), r('c1', 'en'), r('c2', 'ko')],
      new Set(['c1::ko']), // c1/ko already live
      'u1'
    );
    expect(out.toInsert.map((x) => `${x.content_id}::${x.language}`)).toEqual(['c1::en', 'c2::ko']);
    expect(
      out.toInsert.every(
        (x) => x.user_id === 'u1' && x.channel === 'self_hosted' && x.status === 'scheduled'
      )
    ).toBe(true);
    expect(out.skipped).toBe(1);
  });

  it('short-circuits when every row is a duplicate', () => {
    const out = computeBulkInsertRows([r('c1', 'ko')], new Set(['c1::ko']), 'u1');
    expect(out.toInsert).toHaveLength(0);
    expect(out.skipped).toBe(1);
  });
});
