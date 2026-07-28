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
 * 부모 화면 라벨 — **막대 범례와 같은 말**(`MasteryDistributionBar` 의 `SEGMENTS`).
 *
 * 🔴 한 화면에서 같은 것을 두 가지 말로 부르지 않는다. 막대는 「안 봄·봄·연습·익힘」 인데
 *    배지만 「아직·배우는 중」 이라 무엇과 무엇이 같은 단계인지 알 수 없었다(사용자 지적).
 *    말을 바꾸고 싶으면 **두 곳을 같이** 바꿀 것 — 색(4단계)도 이 네 상태를 그대로 따른다.
 * 🔴 % 는 쓰지 않는다(감쇠 때문에 아무것도 안 해도 매일 내려간다).
 */
const PARENT_LABEL: Record<MasteryState, string> = {
  unknown: '안 봄',
  seen: '봄',
  practiced: '연습 중',
  mastered: '익힘',
};

export function masteryLabel(m: number): string {
  return PARENT_LABEL[masteryState(m)];
}

export function masteryState(m: number): MasteryState {
  if (m <= 0) return 'unknown';
  if (m < 0.2) return 'seen';
  if (m < 0.6) return 'practiced';
  return 'mastered';
}
