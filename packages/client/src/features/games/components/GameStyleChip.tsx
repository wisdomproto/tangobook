import { useMemo } from 'react';
import type { Storybook } from '@tangobook/shared';
import { getAvailableStyles } from '@/lib/storybook-accessors';

/**
 * 명작 게임의 그림체 상태 — 정답 시 장면 리빌에 넘길 selectedStyle 을 제공.
 * (그림체 선택 UI 는 제거됨 — 게임 안에서는 그림체를 바꾸지 않고 책 대표 그림체로 고정.
 *  selectedStyle 은 책 defaultStyle 기준으로 장면 리빌 페이지 일러스트를 고르는 데만 사용.)
 */
export function useGameStyle(storybook: Storybook | undefined) {
  const styles = useMemo(() => (storybook ? getAvailableStyles(storybook) : []), [storybook]);
  const selectedStyle = useMemo(() => {
    if (!storybook) return undefined;
    const d = storybook.defaultStyle;
    const i = d ? styles.indexOf(d) : -1;
    return styles[i >= 0 ? i : 0] ?? storybook.defaultStyle ?? storybook.artStyle;
  }, [storybook, styles]);
  return { selectedStyle };
}
