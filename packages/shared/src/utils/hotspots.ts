import type { WordFamilyWord, WordHotspot } from '../types/storybook.js';

/**
 * 단어의 hotspot 목록을 반환. 신규 `hotspots` 우선, 없으면 legacy `hotspot` 을 single-element array 로 wrap.
 *
 * 모든 reader (저작도구 미리보기 / phonics 학습자 뷰어 / 저작도구 탭 미리보기 svg overlay) 에서
 * 이 헬퍼로 추출해서 단어당 hotspot 개수에 무관하게 동작.
 */
export function getWordHotspots(
  w: Pick<WordFamilyWord, 'hotspot' | 'hotspots'> | undefined | null
): WordHotspot[] {
  if (!w) return [];
  if (w.hotspots && w.hotspots.length > 0) return w.hotspots;
  return w.hotspot ? [w.hotspot] : [];
}
