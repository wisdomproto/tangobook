import { useMemo } from 'react';
import { useStorybooks } from '@/features/storybook';
import { SkeletonBookCard } from '@/design-system';
import { cn } from '@/lib/cn';

interface BookMultiSelectGridProps {
  /** 선택된 책 id — 순서대로. */
  selectedIds: string[];
  /** 카드 탭 시 토글. */
  onToggle: (id: string) => void;
}

/**
 * 공개 동화책을 그리드로 렌더하고 탭으로 선택 토글.
 * 선택 순서를 번호 배지로 표시 (재생 순서 = 선택 순서).
 * Controlled — 선택 상태는 부모(ContinuousBuilder)가 소유.
 */
export function BookMultiSelectGrid({ selectedIds, onToggle }: BookMultiSelectGridProps) {
  const { data: list, isLoading, isError } = useStorybooks();

  // 공개 동화책 + **나레이션(모든 페이지 TTS) 있는 책만**.
  // 연속재생=자동 이어읽기(잠자리)이므로 음성 없는 책은 무음+자막없음이 되어 제외한다.
  // (전체 공개책 중 상당수가 아직 TTS 미생성 — koCompletion.pagesTts 로 판별.)
  const books = useMemo(
    () =>
      (list ?? []).filter(
        (b) => b.isPublic && (!b.type || b.type === 'storybook') && b.koCompletion?.pagesTts
      ),
    [list]
  );

  const orderOf = useMemo(() => {
    const m = new Map<string, number>();
    selectedIds.forEach((id, i) => m.set(id, i + 1));
    return m;
  }, [selectedIds]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBookCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-ink-500 font-bold py-8 text-center">책 목록을 불러오지 못했어요</p>;
  }

  if (books.length === 0) {
    return <p className="text-ink-500 font-bold py-8 text-center">아직 공개된 책이 없어요</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {books.map((b) => {
        const order = orderOf.get(b.id);
        const selected = order !== undefined;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onToggle(b.id)}
            aria-pressed={selected}
            className={cn(
              'group flex flex-col items-stretch text-left transition-transform active:scale-95 rounded-2xl',
              selected && 'ring-4 ring-coral-400'
            )}
          >
            <div
              className={cn(
                'aspect-video rounded-2xl overflow-hidden relative shadow-soft',
                !b.coverImage &&
                  'bg-gradient-to-br from-peach-200 to-peach-300 flex items-center justify-center text-4xl'
              )}
            >
              {b.coverImage ? (
                <img
                  src={b.coverImage}
                  alt={b.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                '📖'
              )}
              {selected && (
                <span className="absolute top-1.5 left-1.5 w-8 h-8 rounded-full bg-coral-500 text-white font-black text-lg flex items-center justify-center shadow-pop">
                  {order}
                </span>
              )}
            </div>
            <h3 className="mt-1.5 font-black text-sm md:text-base text-ink-900 truncate font-display leading-tight px-1">
              {b.title}
            </h3>
          </button>
        );
      })}
    </div>
  );
}
