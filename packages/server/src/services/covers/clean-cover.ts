// 클린 표지(텍스트/장식 제거) 생성 스크립트의 순수 헬퍼.
// generate-clean-covers.ts 에서 사용 — 테스트 가능하도록 부수효과 없는 로직만 분리.

export interface StyleCover {
  style: string;
  url: string;
}

/**
 * 책의 (그림체, 표지 URL). 한 책 = 한 그림체(2026-09-14) — 0 또는 1개다.
 */
export function pickStyleCovers(sb: any): StyleCover[] {
  const url = sb.coverImage ?? sb.coverImages?.find((c: any) => c.imageUrl)?.imageUrl;
  return sb.artStyle && url ? [{ style: sb.artStyle, url }] : [];
}

/** R2 key: 콘텐츠 변경 시 URL 이 바뀌도록 timestamp 포함 (immutable 캐시 안전). */
export function buildCleanKey(id: string, style: string, ts: number): string {
  return `covers/clean/${id}-${style}-${ts}.webp`;
}

export interface GateVerdict {
  pass: boolean;
  reason?: string;
}

/**
 * 피델리티 게이트 판정: 주제/구도 동일 AND 텍스트 잔존 없음 일 때만 통과.
 * fail-closed — 필드 누락/비-boolean 값이면 통과 아님 (텍스트 있는 표지가 새어나가지 않도록).
 */
export function parseGateVerdict(v: {
  sameSubject?: unknown;
  textRemains?: unknown;
  reason?: string;
}): GateVerdict {
  const pass = v.sameSubject === true && v.textRemains === false;
  return { pass, reason: typeof v.reason === 'string' ? v.reason : undefined };
}
