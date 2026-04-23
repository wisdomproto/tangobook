export interface MasteryStats {
  exposed: number;
  correct: number;
  wrong: number;
  lastAt: string | null;
}

export type MasteryState = 'unknown' | 'seen' | 'practiced' | 'mastered';

export function computeMastery(s: MasteryStats, now = Date.now()): number {
  if (s.exposed === 0) return 0;
  const attempts = s.correct + s.wrong;
  if (attempts === 0) return 0.15 * Math.min(1, s.exposed / 3);
  const accuracy = s.correct / attempts;
  const days = s.lastAt ? (now - new Date(s.lastAt).getTime()) / 86_400_000 : 999;
  const recency = Math.exp(-days / 30);
  const weight = Math.min(1, attempts / 5);
  return 0.15 + 0.85 * accuracy * recency * weight;
}

export function masteryState(m: number): MasteryState {
  if (m <= 0) return 'unknown';
  if (m < 0.2) return 'seen';
  if (m < 0.6) return 'practiced';
  return 'mastered';
}
