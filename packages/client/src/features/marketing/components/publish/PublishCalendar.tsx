/**
 * PublishCalendar — month-grid calendar for publish records.
 *
 * Consumes buildMonthGrid (Chunk 6.3 — no inline date math).
 * Day-of-week header 일~토. Colored record chips by status.
 * Prev/next month nav with Dec→Jan / Jan→Dec rollover.
 */

import { useState } from 'react';
import { cn } from '../../lib/utils';
import { buildMonthGrid } from '../../lib/publish-calendar';
import type { PublishRecord } from '../../types/database';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** Status-based chip color (background class). */
const STATUS_CHIP: Record<string, string> = {
  scheduled: 'bg-amber-500',
  published: 'bg-green-500',
  failed: 'bg-red-500',
  publishing: 'bg-blue-500',
  draft: 'bg-muted-foreground',
};

interface PublishCalendarProps {
  records: PublishRecord[];
  onSelectRecord?: (r: PublishRecord) => void;
}

export function PublishCalendar({ records, onSelectRecord }: PublishCalendarProps) {
  const now = new Date();
  // viewMonth is 0-indexed (JS Date convention), matching buildMonthGrid's expectation
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const { cells } = buildMonthGrid(viewYear, viewMonth, records);

  const today = now;
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  // Display month as 1-indexed for humans
  const displayMonth = viewMonth + 1;

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="text-muted-foreground hover:text-foreground px-2 py-1 text-sm"
          aria-label="이전 달"
        >
          ←
        </button>
        <span className="text-sm font-semibold">
          {viewYear}년 {displayMonth}월
        </span>
        <button
          onClick={nextMonth}
          className="text-muted-foreground hover:text-foreground px-2 py-1 text-sm"
          aria-label="다음 달"
        >
          →
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-px mb-px">
        {DAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              'text-center text-xs py-1.5',
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground'
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px max-h-[55vh] overflow-y-auto">
        {cells.map((cell, i) => (
          <div
            key={i}
            className={cn(
              'bg-card border border-border rounded min-h-[80px] p-1.5',
              cell.day && isCurrentMonth && cell.day === today.getDate()
                ? 'ring-1 ring-primary'
                : ''
            )}
          >
            {cell.day !== null && (
              <>
                <div
                  className={cn(
                    'text-[10px] mb-0.5',
                    i % 7 === 0
                      ? 'text-red-400'
                      : i % 7 === 6
                        ? 'text-blue-400'
                        : 'text-muted-foreground'
                  )}
                >
                  {cell.day}
                </div>
                {cell.records.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onSelectRecord?.(r)}
                    className={cn(
                      'rounded px-1 py-0.5 mb-0.5 text-[9px] text-white truncate',
                      onSelectRecord ? 'cursor-pointer' : '',
                      STATUS_CHIP[r.status] ?? 'bg-muted-foreground'
                    )}
                    title={(r.metadata?.title as string | undefined) ?? undefined}
                  >
                    {(r.metadata?.title as string | undefined)?.substring(0, 15) ?? 'Untitled'}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
