import { describe, it, expect } from 'vitest';
import { buildMonthGrid } from '../publish-calendar';
import type { PublishRecord } from '../../types/database';

function makeRecord(
  id: string,
  scheduledAt: string | null,
  publishedAt: string | null = null
): Pick<PublishRecord, 'id' | 'scheduled_at' | 'published_at' | 'status'> {
  return {
    id,
    scheduled_at: scheduledAt,
    published_at: publishedAt,
    status: scheduledAt ? 'scheduled' : 'published',
  };
}

describe('buildMonthGrid', () => {
  it('returns cells as a multiple of 7', () => {
    // June 2026: 1st is a Monday (day 1). 30 days. leading blanks=1, 31 cells → pad to 35
    const { cells, weeks } = buildMonthGrid(2026, 5, []); // month=5 → June
    expect(cells.length % 7).toBe(0);
    expect(cells.length).toBe(weeks * 7);
    expect(weeks).toBeGreaterThanOrEqual(4);
  });

  it('leading blank count equals the weekday of the 1st', () => {
    // June 2026: new Date(2026,5,1).getDay() = 1 (Monday)
    const { cells } = buildMonthGrid(2026, 5, []);
    const leadingBlanks = cells.filter((c) => c.day === null).length;
    const firstOfMonth = new Date(2026, 5, 1).getDay();
    // Only leading blanks (before first real day)
    let leading = 0;
    for (const c of cells) {
      if (c.day !== null) break;
      leading++;
    }
    expect(leading).toBe(firstOfMonth);
    expect(leadingBlanks).toBeGreaterThanOrEqual(firstOfMonth); // leading + possibly trailing
  });

  it('buckets a record into the correct day cell', () => {
    // A record scheduled on 2026-06-10 (local)
    const rec = makeRecord('r1', '2026-06-10T09:00:00');
    const { cells } = buildMonthGrid(2026, 5, [rec]);
    const cell = cells.find((c) => c.day === 10);
    expect(cell).toBeDefined();
    expect(cell!.records).toHaveLength(1);
    expect(cell!.records[0].id).toBe('r1');
  });

  it('excludes records from adjacent months', () => {
    // A record on 2026-07-01 (next month) should not appear in June grid
    const nextMonth = makeRecord('r2', '2026-07-01T09:00:00');
    const { cells } = buildMonthGrid(2026, 5, [nextMonth]);
    const allRecords = cells.flatMap((c) => c.records);
    expect(allRecords).toHaveLength(0);
  });

  it('handles February correctly (28 days, non-leap)', () => {
    // Feb 2026: new Date(2026,1,1).getDay() = 0 (Sunday). 28 days. 28 cells → 28, multiple of 7
    const { cells, weeks } = buildMonthGrid(2026, 1, []);
    expect(cells.length % 7).toBe(0);
    // Feb 1 2026 is Sunday → 0 leading blanks, 28 days → 28 cells (4 weeks)
    expect(weeks).toBe(4);
  });

  it('handles December → January wrap correctly (Dec has 31 days)', () => {
    // Dec 2026: new Date(2026,11,1).getDay() = 2 (Tuesday). 31 days → leading=2, total cells >= 35
    const { cells } = buildMonthGrid(2026, 11, []);
    expect(cells.length % 7).toBe(0);
    const dayCell = cells.find((c) => c.day === 31);
    expect(dayCell).toBeDefined();
  });

  it('uses published_at when scheduled_at is null', () => {
    const rec = makeRecord('r3', null, '2026-06-15T10:00:00');
    const { cells } = buildMonthGrid(2026, 5, [rec]);
    const cell = cells.find((c) => c.day === 15);
    expect(cell?.records).toHaveLength(1);
    expect(cell!.records[0].id).toBe('r3');
  });

  it('multiple records on same day bucket together', () => {
    const r1 = makeRecord('r1', '2026-06-20T08:00:00');
    const r2 = makeRecord('r2', '2026-06-20T19:00:00');
    const { cells } = buildMonthGrid(2026, 5, [r1, r2]);
    const cell = cells.find((c) => c.day === 20);
    expect(cell?.records).toHaveLength(2);
  });
});
