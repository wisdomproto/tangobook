import { masteryState, type MasteryState } from '../lib/mastery';

const COLORS: Record<MasteryState, string> = {
  unknown: 'bg-ink-200 text-ink-500',
  seen: 'bg-coral-200 text-ink-700',
  practiced: 'bg-coral-400 text-white',
  mastered: 'bg-success text-white',
};

interface Props {
  label: string;
  mastery: number;
  className?: string;
  title?: string;
}

export function MasteryBadge({ label, mastery, className = '', title }: Props) {
  const s = masteryState(mastery);
  return (
    <span
      title={title ?? `${label} — ${Math.round(mastery * 100)}%`}
      className={`inline-flex min-w-[2.5rem] justify-center rounded-full px-2 py-0.5 text-xs font-bold ${COLORS[s]} ${className}`}
    >
      {label}
    </span>
  );
}
