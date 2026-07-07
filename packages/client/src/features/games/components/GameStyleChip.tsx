import { useMemo, useState } from 'react';
import type { Storybook } from '@tangobook/shared';
import { getAvailableStyles } from '@/lib/storybook-accessors';
import { useStyleGenreLabel } from '@/lib/art-style-genre';

/**
 * 명작 게임의 그림체 선택 상태. 정답 시 장면 리빌에 넘길 selectedStyle 을 제공하고,
 * 그림체가 2개 이상인 명작에서만 canPick=true (선택 칩 노출).
 */
export function useGameStyle(storybook: Storybook | undefined) {
  const isClassic =
    !!storybook && (/명작/.test(storybook.category ?? '') || /명작/.test(storybook.folder ?? ''));
  const styles = useMemo(() => (storybook ? getAvailableStyles(storybook) : []), [storybook]);
  const defaultIndex = useMemo(() => {
    if (!storybook) return 0;
    const d = storybook.defaultStyle;
    const i = d ? styles.indexOf(d) : -1;
    return i >= 0 ? i : 0;
  }, [storybook, styles]);
  const [override, setOverride] = useState<number | null>(null);
  const index = override ?? defaultIndex;
  const canPick = isClassic && styles.length > 1;
  const selectedStyle = styles[index] ?? storybook?.defaultStyle ?? storybook?.artStyle;
  return { styles, index, setIndex: setOverride, selectedStyle, canPick };
}

/** 게임 헤더 우측 그림체 선택 칩 — 탭하면 다음 그림체로 순환. 장르명(수채동화풍 등) 표시. */
export function GameStyleChip({
  styles,
  index,
  onCycle,
}: {
  styles: string[];
  index: number;
  onCycle: (nextIndex: number) => void;
}) {
  const label = useStyleGenreLabel();
  if (styles.length <= 1) return null;
  return (
    <button
      type="button"
      onClick={() => onCycle((index + 1) % styles.length)}
      className="rounded-full bg-white/90 text-ink-900 font-black text-[clamp(0.75rem,1.8vh,1rem)] px-[clamp(0.6rem,1.6vw,1.1rem)] py-[clamp(0.35rem,1.1vh,0.7rem)] shadow-soft hover:shadow-pop transition flex items-center gap-1.5 max-w-[42vw]"
      aria-label="그림체 바꾸기"
      title="그림체 바꾸기"
    >
      <span className="shrink-0">🎨</span>
      <span className="truncate">{label(styles[index], index)}</span>
    </button>
  );
}
