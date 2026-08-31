import type { Storybook, KoreanPageOrderData, PageOrderItem } from '@tangobook/shared';
import { pageIllustrationUrl, pageNumberOf } from './page-illustration';

/** 4장 미만이면 순서 개념이 안 선다(둘은 반반, 셋은 한 번 맞으면 나머지가 정해진다). */
const ITEM_COUNT = 4;

/**
 * 동화책 → 「쪽 순서 맞추기」 데이터.
 *
 * 🔴 **이웃한 쪽을 고르지 않는다** — 연속 4쪽은 그림이 서로 닮아 무엇이 먼저인지 그림만으로는
 *    가릴 수 없다. 처음·중간·끝이 고루 섞이도록 **균등 간격**으로 뽑아야 이야기 전체를 되짚는다.
 */
export function buildPageOrderData(
  book: Storybook | undefined,
  style?: string
): KoreanPageOrderData | null {
  if (!book) return null;
  const usable: PageOrderItem[] = [];
  (book.pages ?? []).forEach((page, i) => {
    const pageNumber = pageNumberOf(page, i);
    const illustrationUrl = pageIllustrationUrl(book, page, pageNumber, style);
    if (!illustrationUrl) return;
    const ttsUrl = page.translations?.ko?.ttsUrl || page.ttsUrl;
    usable.push({ pageNumber, illustrationUrl, ...(ttsUrl ? { ttsUrl } : {}) });
  });
  if (usable.length < ITEM_COUNT) return null;

  const last = usable.length - 1;
  const items = Array.from(
    { length: ITEM_COUNT },
    (_, i) => usable[Math.round((i * last) / (ITEM_COUNT - 1))]
  );
  // 균등 간격이 같은 쪽을 두 번 집는 경우는 없지만(쪽 수 ≥ 4), 방어적으로 확인한다.
  if (new Set(items.map((it) => it.pageNumber)).size !== ITEM_COUNT) return null;
  return { type: 'korean-page-order', items };
}
