/**
 * 프레임마다 흔들리는 인식 결과를 다수결로 가라앉힌다.
 *
 * 🔴 창 크기 7 · 분석 간격 250ms 는 지금 배포본(`tango-board-3d.html` 의 `WORD_HIST`·
 *    `TUNE.recoEveryMs`)과 **같은 값**이다. 사용자가 「이정도가 좋다」고 한 체감이라
 *    줄이지 않는다 — 더 짧으면 블록을 옮기는 동안 중간 낱말을 지껄인다.
 */
export const VOTE_WINDOW = 7;

export function voteWord(
  history: string[],
  next: string,
  stable = '',
  window = VOTE_WINDOW
): string {
  const hist = [...history, next].slice(-window);
  const count = new Map<string, number>();
  let best = next;
  let bestN = 0;
  for (const w of hist) {
    const n = (count.get(w) ?? 0) + 1;
    count.set(w, n);
    // 동점이면 먼저 많아진 쪽이 이긴다 — 배포본과 같은 규칙.
    if (n > bestN) {
      bestN = n;
      best = w;
    }
  }
  // 🔴 기록이 덜 찬 시작 순간이나 손이 판을 가리는 동안에는 최빈값만으로 바꾸지 않는다.
  // 7회 중 과반수인 4회가 같은 값일 때만 새 결과로 확정한다. 빈 문자열도 같은 규칙으로
  // 확정하므로 블록을 모두 치운 판은 약 1초 뒤 정상적으로 빈 상태가 된다.
  const quorum = Math.floor(window / 2) + 1;
  return bestN >= quorum ? best : stable;
}
