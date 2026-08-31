import type { Storybook } from '@tangobook/shared';

/**
 * 그 쪽의 삽화 URL — 고른 그림체가 있으면 그 그림체 것, 없으면 base.
 * 독후활동 빌더 셋(이야기 듣고 그림 찾기·쪽 순서·이 물건 어느 장면)이 같은 규칙을 쓴다.
 */
export function pageIllustrationUrl(
  book: Storybook,
  page: Storybook['pages'][number],
  pageNumber: number,
  style?: string
): string | undefined {
  const styled =
    style && book.styleAssets?.[style]?.pageIllustrations?.[pageNumber]?.illustrationUrl;
  return styled || page.illustrationUrl || undefined;
}

/** `pageNumber` 는 데이터에 있으면 그것, 없으면 배열 순서. 세 빌더가 같은 규칙을 써야 서로 어긋나지 않는다. */
export function pageNumberOf(page: Storybook['pages'][number], index: number): number {
  return page.pageNumber ?? index + 1;
}
