import { useQuery } from '@tanstack/react-query';
import type { Storybook } from '@tangobook/shared';
import { cn } from '@/lib/cn';
import { settingsApi } from '@/features/settings/api/settings.api';
import { applyArtStyle, findArtStylePreset } from '@/features/editor/lib/style-assets';

interface ArtStyleSelectProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
  className?: string;
}

/**
 * 책의 그림체 고르기 — 🔴 **그림체 라이브러리 안에서만** 고른다(2026-09-14). 자유 입력·프리셋 프롬프트는 없앴다.
 * 새 그림체가 필요하면 「그림체 편집」에서 라이브러리에 먼저 추가한다.
 */
export function ArtStyleSelect({ storybook, onUpdate, onSave, className }: ArtStyleSelectProps) {
  const { data: library } = useQuery({
    queryKey: ['art-style-library'],
    queryFn: settingsApi.getArtStyleLibrary,
    staleTime: 60_000,
  });
  const current = findArtStylePreset(storybook.artStyle, library);
  const inLibrary = !!library?.some((s) => s.id === current?.id);

  return (
    <select
      value={inLibrary ? current!.id : ''}
      onChange={(e) => {
        const picked = library?.find((s) => s.id === e.target.value);
        if (!picked || picked.id === storybook.artStyle) return;
        if (
          !window.confirm(
            `이 책의 그림체를 「${picked.name}」 로 바꿀까요?\n\n지금 삽화는 그대로 남고, 새 그림체 삽화는 다시 만들어야 합니다.`
          )
        )
          return;
        onUpdate((d) => applyArtStyle(d, picked.id));
        onSave();
      }}
      className={cn(
        'rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
        className
      )}
      title="이 책의 그림체"
    >
      {!inLibrary && (
        <option value="" disabled>
          목록 밖 그림체: {storybook.artStyle.slice(0, 40)}
        </option>
      )}
      {(library ?? []).map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
