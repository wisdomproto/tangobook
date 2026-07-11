import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Storybook } from '@tangobook/shared';
import { getAvailableStyles } from '@/lib/storybook-accessors';

/**
 * 명작 게임의 그림체 상태 — 정답 시 장면 리빌에 넘길 selectedStyle 을 제공.
 *
 * 🔴 우선순위: **진입 시 사용자가 고른 그림체(URL `?style`)** → 책 defaultStyle → styles[0] → artStyle.
 *   책 상세에서 "단어 익히기"를 특정 그림체로 진입하면 `/vocabulary/book-id?style=...` 로 오는데,
 *   게임 이미지는 그 선택 그림체로 뜨지만 예전엔 SceneReveal 만 defaultStyle 을 써서 **정답 장면 그림체가
 *   진입 그림체와 안 맞던 버그**가 있었다. `?style` 을 우선 반영해 이미지·장면 그림체를 일치시킨다.
 */
export function useGameStyle(storybook: Storybook | undefined) {
  const styles = useMemo(() => (storybook ? getAvailableStyles(storybook) : []), [storybook]);
  const [searchParams] = useSearchParams();
  const requested = searchParams.get('style');
  const selectedStyle = useMemo(() => {
    if (!storybook) return undefined;
    // 사용자가 진입 시 고른 그림체(URL ?style)가 이 책의 그림체 중 하나면 그걸 우선.
    if (requested && styles.includes(requested)) return requested;
    const d = storybook.defaultStyle;
    const i = d ? styles.indexOf(d) : -1;
    return styles[i >= 0 ? i : 0] ?? storybook.defaultStyle ?? storybook.artStyle;
  }, [storybook, styles, requested]);
  return { selectedStyle };
}
