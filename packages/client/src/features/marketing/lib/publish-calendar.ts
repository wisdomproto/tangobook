/**
 * publish-calendar.ts — pure month-grid math for the publish calendar UI.
 *
 * R-5 (timezone): calendar buckets by the operator's LOCAL date, consistent with the
 * `datetime-local` reschedule input in the browser. `distributeSchedule` emits UTC-anchored
 * ISO strings; bulk slots are UTC-anchored while manual reschedule + calendar display are
 * local-anchored — they differ by the operator's UTC offset (CF behaviour).
 */

export interface CalendarCell<T> {
  /** 1-based day number, or null for leading/trailing blank padding cells. */
  day: number | null;
  records: T[];
}

export interface MonthGrid<T> {
  cells: CalendarCell<T>[];
  weeks: number;
}

type RecordLike = {
  scheduled_at: string | null;
  published_at: string | null;
};

/**
 * Build a weeks×7 calendar grid for the given year + month (0-indexed, JS Date convention).
 *
 * @param year  Full year e.g. 2026
 * @param month 0-indexed month (0=Jan … 11=Dec) — matches new Date(year, month, 1)
 * @param records Array of publish records to bucket into cells
 * @returns MonthGrid with `cells` (leading blanks + days + trailing pad) and `weeks` count
 */
export function buildMonthGrid<T extends RecordLike>(
  year: number,
  month: number,
  records: T[]
): MonthGrid<T> {
  const first = new Date(year, month, 1);
  const leadingBlanks = first.getDay(); // 0=Sun … 6=Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Total slots must be a multiple of 7
  const totalSlots = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;

  const cells: CalendarCell<T>[] = [];

  // Leading blank cells
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({ day: null, records: [] });
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayRecords = records.filter((r) => {
      const effectiveDate = r.scheduled_at ?? r.published_at;
      if (!effectiveDate) return false;
      // Parse and compare by local Y/M/D (R-5: match operator's datetime-local view)
      const d = new Date(effectiveDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
    cells.push({ day, records: dayRecords });
  }

  // Trailing blank cells to pad to multiple of 7
  const trailingBlanks = totalSlots - leadingBlanks - daysInMonth;
  for (let i = 0; i < trailingBlanks; i++) {
    cells.push({ day: null, records: [] });
  }

  return { cells, weeks: totalSlots / 7 };
}
