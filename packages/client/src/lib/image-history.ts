import { MAX_IMAGE_HISTORY } from '@tangobook/shared';

/**
 * 이미지 히스토리에 현재 이미지를 push하고 최대 개수를 유지.
 * onUpdate 콜백 안에서 사용:
 *   draft.coverImageHistory = pushImageHistory(draft.coverImageHistory, draft.coverImage);
 */
export function pushImageHistory(
  history: string[] | undefined,
  currentUrl: string | undefined,
  maxHistory = MAX_IMAGE_HISTORY
): string[] {
  if (!currentUrl) return history ?? [];
  return [currentUrl, ...(history ?? [])].slice(0, maxHistory);
}
