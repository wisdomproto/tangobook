/**
 * 마케팅 블로그(Supabase mkt_blog_contents/cards) → 네이버 에디터 주입 지시서.
 * 부수효과 없음(순수). Supabase I/O 는 blog-source.ts 가 담당하고, 이 파일은 그 결과(BlogSource)를
 * "무엇을 넣을지"(InjectionPlan)로 변환만 한다.
 */

/** blog-source.ts 가 Supabase 에서 조립해 넘기는 한 블로그 글. */
export interface BlogSourceCard {
  id: string; // mkt_blog_cards.id (섹션 안정 키 — 이미지 임시파일·로깅)
  html: string; // content.text (이미 HTML: <h2><p><strong>)
  imageUrl?: string; // content.url (R2 이미지, 있을 때만)
  caption?: string; // content.caption
}

export interface BlogSource {
  blogContentId: string; // mkt_blog_contents.id → 이력 post_id
  bookId: string; // mkt_blog_contents.content_id → 이력 book_id
  title: string;
  tags: string[];
  cards: BlogSourceCard[]; // sort_order 순
}

export type InjectionBlock =
  | { kind: 'html'; html: string; sectionId: string }
  | { kind: 'image'; imageUrl: string; caption?: string; sectionId: string };

export interface InjectionPlan {
  title: string;
  tags: string[];
  blocks: InjectionBlock[];
}

/** BlogSource → 에디터 주입 지시서. 각 카드 = HTML 블록 + (선택)이미지 블록. */
export function buildInjectionPlan(source: BlogSource): InjectionPlan {
  const blocks: InjectionBlock[] = [];
  for (const c of source.cards) {
    if (c.html?.trim()) blocks.push({ kind: 'html', html: c.html, sectionId: c.id });
    if (c.imageUrl)
      blocks.push({ kind: 'image', imageUrl: c.imageUrl, caption: c.caption, sectionId: c.id });
  }
  return { title: source.title, tags: source.tags ?? [], blocks };
}
