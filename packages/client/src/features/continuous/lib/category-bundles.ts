/**
 * 라이브러리 목록에서 **카테고리 통째로** 묶음을 파생한다.
 *
 * 🔴 묶음을 저장하지 않는 이유: 책 id 를 상수로 박아두면 책이 비공개·삭제될 때 조용히 썩는다.
 * 매번 현재 목록에서 계산하면 그 문제가 아예 없다.
 *
 * 🔴 예전엔 카테고리당 **앞 3권**만 담았다(2026-07-27 전체로). 3권이면 10분 남짓이라
 * "틀어놓고 재우는" 쓰임에 못 미쳤고, 나머지를 들으려면 결국 세트를 손으로 만들어야 했다.
 * 카드에 총 재생시간을 함께 띄우므로 몇 시간짜리인지도 눌러보기 전에 보인다.
 *
 * 게스트·로그인 구분 없이 동일한 결과를 낸다(잠금은 기존 뷰어 게이팅에 맡긴다).
 */
export interface CategoryBundle {
  category: string; // R2 원본 한국어 카테고리명 — 표시할 때 categoryLabel() 로 변환
  bookIds: string[]; // 재생 순서
}

interface BookLike {
  id: string;
  title?: string;
  category?: string;
  isPublic?: boolean;
  type?: string; // 'storybook' | 'phonics' — 미지정은 동화책
}

/** "01. 골고루" → 1 · 번호 없으면 null */
function leadingNumber(title: string): number | null {
  const m = /^\s*(\d+)\./.exec(title);
  return m ? Number(m[1]) : null;
}

/**
 * 번호가 있으면 번호순, 없으면 제목순.
 * 🔴 문자열 정렬만 쓰면 "10."이 "2."보다 앞서므로 번호를 숫자로 분리해서 비교한다.
 */
function compareBooks(a: BookLike, b: BookLike): number {
  const na = leadingNumber(a.title ?? '');
  const nb = leadingNumber(b.title ?? '');
  if (na !== null && nb !== null) return na - nb;
  if (na !== null) return -1;
  if (nb !== null) return 1;
  return (a.title ?? '').localeCompare(b.title ?? '', 'ko');
}

export function buildCategoryBundles(books: BookLike[]): CategoryBundle[] {
  const byCategory = new Map<string, BookLike[]>();
  for (const book of books) {
    if (book.isPublic === false) continue;
    // 🔴 라이브러리 동화책 페이지의 matchesType 과 같은 규칙 — 파닉스는 별도 축이라 묶음에 넣지 않는다.
    if (book.type && book.type !== 'storybook') continue;
    const category = book.category;
    if (!category) continue;
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category)!.push(book);
  }

  const out: CategoryBundle[] = [];
  for (const [category, list] of byCategory) {
    const bookIds = [...list].sort(compareBooks).map((b) => b.id);
    if (bookIds.length < 2) continue; // 한 권짜리는 묶음이 아니다
    out.push({ category, bookIds });
  }
  return out;
}
