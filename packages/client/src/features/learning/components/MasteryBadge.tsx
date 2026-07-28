import { masteryState, parentMastery, type MasteryState, type ParentMastery } from '../lib/mastery';

const COLORS: Record<MasteryState, string> = {
  unknown: 'bg-ink-200 text-ink-500',
  seen: 'bg-coral-200 text-ink-700',
  practiced: 'bg-coral-400 text-white',
  mastered: 'bg-success text-white',
};

/** 부모 화면 3단계 — 말(아직/배우는 중/잘해요)과 색이 같은 것을 가리킨다. */
const PARENT_COLORS: Record<ParentMastery, string> = {
  notyet: 'bg-ink-200 text-ink-500',
  learning: 'bg-coral-400 text-white',
  good: 'bg-success text-white',
};

interface Props {
  label: string;
  /** 부모 화면 여부 — 4단계 색 대신 3단계 색을 쓴다(라벨도 3단계라 짝이 맞아야 한다). */
  parent?: boolean;
  mastery: number;
  className?: string;
  title?: string;
}

export function MasteryBadge({ label, mastery, parent = false, className = '', title }: Props) {
  const s = masteryState(mastery);
  const color = parent ? PARENT_COLORS[parentMastery(mastery)] : COLORS[s];
  return (
    <span
      title={title ?? `${label} — ${Math.round(mastery * 100)}%`}
      className={`inline-flex min-w-[2.5rem] justify-center rounded-full px-2 py-0.5 text-xs font-bold ${color} ${className}`}
    >
      {label}
    </span>
  );
}
