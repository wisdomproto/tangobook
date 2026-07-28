import type { MasteryState } from '../lib/mastery';

/**
 * 🔴 배지와 **같은 3단계**여야 한다 — 배지는 「아직/배우는 중/잘해요」 인데 여기만 4단계
 * (안 봄·봄·연습·익힘)면, 같은 화면에서 같은 것을 두 가지 말로 부르는 셈이다.
 * 부모에게 "안 봄" 과 "봄" 의 차이는 아무 의미가 없어 하나로 묶는다(색도 배지와 맞춘다).
 */
const SEGMENTS: Array<{ keys: MasteryState[]; cls: string; label: string }> = [
  { keys: ['unknown', 'seen'], cls: 'bg-ink-200', label: '아직' },
  { keys: ['practiced'], cls: 'bg-coral-400', label: '배우는 중' },
  { keys: ['mastered'], cls: 'bg-success', label: '잘해요' },
];

const sumOf = (counts: Record<MasteryState, number>, keys: MasteryState[]) =>
  keys.reduce((n, k) => n + counts[k], 0);

interface Props {
  counts: Record<MasteryState, number>;
  showLegend?: boolean;
}

export function MasteryDistributionBar({ counts, showLegend = true }: Props) {
  const total = SEGMENTS.reduce((sum, s) => sum + sumOf(counts, s.keys), 0) || 1;
  return (
    <div className="w-full">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-100">
        {SEGMENTS.map((s) => {
          const pct = (sumOf(counts, s.keys) / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={s.label}
              className={s.cls}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${sumOf(counts, s.keys)}`}
            />
          );
        })}
      </div>
      {showLegend && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-ink-500">
          {SEGMENTS.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1">
              <span className={`inline-block h-2 w-2 rounded-sm ${s.cls}`} />
              {s.label} {sumOf(counts, s.keys)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
