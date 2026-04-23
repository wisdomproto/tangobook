import type { MasteryState } from '../lib/mastery';

const SEGMENTS: Array<{ key: MasteryState; cls: string; label: string }> = [
  { key: 'unknown', cls: 'bg-ink-200', label: '안 봄' },
  { key: 'seen', cls: 'bg-coral-200', label: '봄' },
  { key: 'practiced', cls: 'bg-coral-400', label: '연습' },
  { key: 'mastered', cls: 'bg-success', label: '익힘' },
];

interface Props {
  counts: Record<MasteryState, number>;
  showLegend?: boolean;
}

export function MasteryDistributionBar({ counts, showLegend = true }: Props) {
  const total = SEGMENTS.reduce((sum, s) => sum + counts[s.key], 0) || 1;
  return (
    <div className="w-full">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-100">
        {SEGMENTS.map((s) => {
          const pct = (counts[s.key] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={s.key}
              className={s.cls}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${counts[s.key]}`}
            />
          );
        })}
      </div>
      {showLegend && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-ink-500">
          {SEGMENTS.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1">
              <span className={`inline-block h-2 w-2 rounded-sm ${s.cls}`} />
              {s.label} {counts[s.key]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
