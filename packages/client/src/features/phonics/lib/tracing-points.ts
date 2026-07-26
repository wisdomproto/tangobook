import type { DotKeypoint, PhonicsFlashcard, TracingPoint } from '@tangobook/shared';

/**
 * 점선 = 두 필드에 나뉘어 있다.
 *   `tracingPoints` — 저작도구 전용(TracingGamePreviewModal 미리보기). 순서 없음.
 *   `keypoints`     — 학습자 「낱말 그리기」가 읽는 필드(order 有). 자동 추출본이 여기 들어간다.
 * 편집기는 **학습자가 쓰는 쪽(keypoints)을 먼저 보여주고, 저장할 땐 둘 다 쓴다** —
 * 안 그러면 저작도구에서 점선을 고쳐도 게임은 그대로다.
 */
export function flashcardDots(
  card: Pick<PhonicsFlashcard, 'keypoints' | 'tracingPoints'>
): TracingPoint[] {
  if (card.keypoints?.length) {
    return [...card.keypoints].sort((a, b) => a.order - b.order).map(({ x, y }) => ({ x, y }));
  }
  return card.tracingPoints ?? [];
}

/** 편집기가 돌려준 점열 → 게임용 keypoints(그린 순서가 곧 order). */
export function toKeypoints(points: readonly TracingPoint[]): DotKeypoint[] {
  return points.map(({ x, y }, i) => ({ x, y, order: i + 1 }));
}
