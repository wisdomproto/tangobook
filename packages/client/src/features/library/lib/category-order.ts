// 카테고리 표시 순서 — LibraryPage(메인)와 연속재생 빌더가 공유.
// config(categoryOrder) 우선, 없으면 default, 둘 다에 없는 카테고리는 권수 desc.

// 생활동화 먼저, 그다음 세계 명작 (2026-07-16 사용자 요청). 실제 카테고리명은 '생활동화'(붙임).
// ⚠️ 실효 순서는 R2 LibraryConfig.categoryOrder 가 우선 — 이 default 는 config 부재 시 폴백.
export const DEFAULT_PRIORITY_CATEGORIES = [
  '생활동화',
  // 카테고리 키는 '호리 유치원'이 아니라 '호리 유치원동화'(책 데이터 기준). 2026-07-25.
  '호리 유치원동화',
  '세계 명작',
  '자연 관찰',
  '전래 동화',
  '기타',
];

export function makeCategoryComparator(configOrder: string[] | undefined) {
  const order = configOrder?.length ? configOrder : DEFAULT_PRIORITY_CATEGORIES;
  return (a: string, b: string, fallbackA = 0, fallbackB = 0): number => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return fallbackB - fallbackA;
  };
}
