/**
 * 단원·레벨 진행률.
 *
 * 🔴 양 끝은 **정직해야 한다** — 반올림에 맡기면 199/200 이 100% 로, 1/200 이 0% 로 보인다.
 *    아무것도 안 했으면 0, 다 했으면 100, 그 사이는 절대 0 도 100 도 아니다.
 */
export function progressPercent(done: number, total: number): number {
  if (total <= 0 || done <= 0) return 0;
  if (done >= total) return 100;
  return Math.min(99, Math.max(1, Math.round((done / total) * 100)));
}

/** 레벨 진행률 = 단원들의 활동을 통째로 합산 (단원 수가 아니라 **활동 수** 기준). */
export function sumProgress(units: ReadonlyArray<{ done: number; total: number }>): {
  done: number;
  total: number;
  percent: number;
} {
  const done = units.reduce((s, u) => s + u.done, 0);
  const total = units.reduce((s, u) => s + u.total, 0);
  return { done, total, percent: progressPercent(done, total) };
}
