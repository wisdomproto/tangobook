/**
 * 색칠 도안 목록 — 화면이 쓰기 좋은 모양으로 고른다.
 *
 * 🔴 **정답본을 요구하지 않는다.** 칸 나누기는 도안 픽셀만 보는 flood fill 이라
 *    두 번째 그림은 **색 출처**일 뿐이다. 파일럿 18장은 정답본이 이미 검증돼 있어 그걸 쓰고,
 *    새로 붙이는 도안은 **원본 삽화**에서 읽는다(도안이 원본을 보고 그린 그림이라 자리가 겹친다).
 */

export interface ColoringSheet {
  unitId: string;
  word: string;
  /** 흰 면 + 검은 선. 칸은 여기서 나눈다. */
  lineartUrl: string;
  /** 파일럿에만 있다. */
  answerUrl?: string | null;
  /** 낱말 카드 원본 삽화. 정답본이 없으면 여기서 색을 읽는다. */
  originalUrl?: string | null;
  ttsUrl?: string | null;
}

/**
 * 주소에 쓸 조각.
 *
 * 🔴 한글을 그대로 둔다 — 로마자로 바꾸면 「오리」로 검색해 온 사람과 주소가 안 맞고,
 *    한글 URL 은 브라우저 주소창에서 그대로 읽힌다(퍼센트 인코딩은 전송 때만).
 */
export const toSlug = (word: string): string => word.trim().replace(/\s+/g, '-');

/** 칸별 색을 읽어 올 그림 — 있으면 정답본, 없으면 원본 삽화. */
export const colorSourceOf = (sheet: ColoringSheet): string =>
  sheet.answerUrl ?? sheet.originalUrl ?? '';

export function groupByUnit(
  sheets: ColoringSheet[]
): { unitId: string; sheets: ColoringSheet[] }[] {
  const by = new Map<string, ColoringSheet[]>();
  for (const s of sheets) {
    const list = by.get(s.unitId);
    if (list) list.push(s);
    else by.set(s.unitId, [s]);
  }
  return [...by.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([unitId, list]) => ({ unitId, sheets: list }));
}

export const findBySlug = (sheets: ColoringSheet[], slug: string): ColoringSheet | undefined =>
  sheets.find((s) => toSlug(s.word) === slug);
