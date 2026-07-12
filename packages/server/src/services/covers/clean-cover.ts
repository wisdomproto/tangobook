// 클린 표지(텍스트/장식 제거) 생성 스크립트의 순수 헬퍼.
// generate-clean-covers.ts 에서 사용 — 테스트 가능하도록 부수효과 없는 로직만 분리.

export interface StyleCover {
  style: string;
  url: string;
}

/**
 * 책의 (그림체, 표지 URL) 목록. 활성 그림체(top-level coverImage) 우선, 그다음 styleAssets.
 * 이미 나온 그림체는 중복 추가하지 않는다.
 */
export function pickStyleCovers(sb: any): StyleCover[] {
  const pick = (a: any): string | undefined =>
    a?.coverImage ?? a?.coverImages?.find((c: any) => c.imageUrl)?.imageUrl;
  const out: StyleCover[] = [];
  const active = pick({ coverImage: sb.coverImage, coverImages: sb.coverImages });
  if (sb.artStyle && active) out.push({ style: sb.artStyle, url: active });
  for (const [style, assets] of Object.entries(sb.styleAssets ?? {})) {
    if (out.some((s) => s.style === style)) continue;
    const url = pick(assets);
    if (url) out.push({ style, url });
  }
  return out;
}

/** R2 key: 콘텐츠 변경 시 URL 이 바뀌도록 timestamp 포함 (immutable 캐시 안전). */
export function buildCleanKey(id: string, style: string, ts: number): string {
  return `covers/clean/${id}-${style}-${ts}.webp`;
}

export interface GateVerdict {
  pass: boolean;
  reason?: string;
}

/** 피델리티 게이트 판정: 주제/구도 동일 AND 텍스트 잔존 없음 일 때만 통과. */
export function parseGateVerdict(v: {
  sameSubject: boolean;
  textRemains: boolean;
  reason?: string;
}): GateVerdict {
  return { pass: v.sameSubject && !v.textRemains, reason: v.reason };
}
