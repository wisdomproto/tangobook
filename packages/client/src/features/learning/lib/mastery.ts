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

/**
 * 부모 화면용 **3단계**. 🔴 `MasteryState` 는 4단계(안 봄/봄/연습/익힘)인데 부모에게
 * "안 봄" 과 "봄" 의 차이는 아무 의미가 없다 — 예전엔 둘 다 「아직」 이라고 쓰면서 **색만 달라서**,
 * 회색 「아직」 과 코랄 「아직」 이 나란히 놓여 무슨 차이인지 알 수 없었다(사용자 지적).
 * 말과 색이 **같은 것**을 가리키게 3단계로 묶는다.
 */
export type ParentMastery = 'notyet' | 'learning' | 'good';

export function parentMastery(m: number): ParentMastery {
  const s = masteryState(m);
  if (s === 'mastered') return 'good';
  if (s === 'practiced') return 'learning';
  return 'notyet';
}

export function masteryState(m: number): MasteryState {
  if (m <= 0) return 'unknown';
  if (m < 0.2) return 'seen';
  if (m < 0.6) return 'practiced';
  return 'mastered';
}
