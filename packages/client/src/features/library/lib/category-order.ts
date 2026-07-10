// 카테고리 표시 순서 — LibraryPage(메인)와 연속재생 빌더가 공유.
// config(categoryOrder) 우선, 없으면 default, 둘 다에 없는 카테고리는 권수 desc.

export const DEFAULT_PRIORITY_CATEGORIES = [
  '세계 명작',
  '자연 관찰',
  '생활 동화',
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
