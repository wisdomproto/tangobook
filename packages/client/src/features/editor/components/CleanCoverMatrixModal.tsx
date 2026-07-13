import { useMemo, useState } from 'react';
import { useStorybooks } from '@/features/storybook';
import { useStyleGenreLabel } from '@/lib/art-style-genre';
import { ImageLightbox } from '@/components/ImageLightbox';
import type { StorybookSummary } from '@tangobook/shared';

/**
 * editor2 그림체별 클린 표지(텍스트 없는 버전) 현황 매트릭스.
 * 세계 명작 + 자연관찰 책을 카테고리별로 묶고, 각 책의 노출 그림체(availableStyles)마다
 * 클린 표지(`cleanCoversByStyle[style]`)를 썸네일로 표시. 없으면 "빈칸".
 * 어느 책·그림체가 아직 클린 표지가 없는지(재생성 대상) 한눈에 파악하는 용도.
 */
const NATURE_RE = /동물|공룡|식물|곤충|우주|자연|바다|하늘|육지|극지/;
const isTargetCat = (cat?: string): boolean => !!cat && (/명작/.test(cat) || NATURE_RE.test(cat));

const stylesOf = (b: StorybookSummary): string[] =>
  b.availableStyles && b.availableStyles.length > 0
    ? b.availableStyles
    : b.artStyle
      ? [b.artStyle]
      : [];

export function CleanCoverMatrixModal({ onClose }: { onClose: () => void }) {
  const { data: books, isLoading } = useStorybooks();
  const genreLabel = useStyleGenreLabel();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [onlyMissing, setOnlyMissing] = useState(false);

  const { order, groups, total, missing } = useMemo(() => {
    // 레거시 책은 type 미지정(=storybook) → phonics 만 제외. (type==='storybook' 엄격 비교는 전부 걸러냄)
    const target = (books ?? []).filter(
      (b) => b.type !== 'phonics' && b.isPublic !== false && isTargetCat(b.category)
    );
    let total = 0;
    let missing = 0;
    for (const b of target) {
      for (const s of stylesOf(b)) {
        total++;
        if (!b.cleanCoversByStyle?.[s]) missing++;
      }
    }
    const groups: Record<string, StorybookSummary[]> = {};
    for (const b of target) {
      const c = b.category!;
      (groups[c] ??= []).push(b);
    }
    const order = Object.keys(groups).sort((a, b) => {
      const ca = /명작/.test(a) ? 0 : 1;
      const cb = /명작/.test(b) ? 0 : 1;
      return ca - cb || a.localeCompare(b, 'ko');
    });
    return { order, groups, total, missing };
  }, [books]);

  const bookHasMissing = (b: StorybookSummary): boolean =>
    stylesOf(b).some((s) => !b.cleanCoversByStyle?.[s]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
              🖼️ 그림체별 클린 표지 (텍스트 없는 버전)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              세계 명작 + 자연관찰 · 그림체별 클린 표지 ·{' '}
              <span className={missing > 0 ? 'font-bold text-rose-600 dark:text-rose-400' : ''}>
                빈칸(미생성) {missing}
              </span>{' '}
              / 전체 {total}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={onlyMissing}
                onChange={(e) => setOnlyMissing(e.target.checked)}
              />
              빈칸 있는 책만
            </label>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              닫기
            </button>
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && <div className="py-10 text-center text-slate-400">불러오는 중…</div>}
          {!isLoading &&
            order.map((cat) => {
              const rows = onlyMissing ? groups[cat].filter(bookHasMissing) : groups[cat];
              if (rows.length === 0) return null;
              return (
                <section key={cat} className="mb-6">
                  <h3 className="sticky top-0 z-10 mb-2 bg-white/95 py-1 text-sm font-black text-slate-800 backdrop-blur dark:bg-slate-900/95 dark:text-slate-100">
                    {cat}{' '}
                    <span className="text-xs font-normal text-slate-400">({rows.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {rows.map((b) => (
                      <div
                        key={b.id}
                        className="flex flex-col gap-2 rounded-lg border border-slate-100 p-2 sm:flex-row sm:items-center dark:border-slate-800"
                      >
                        <div className="w-full shrink-0 truncate text-sm font-bold text-slate-700 sm:w-40 dark:text-slate-200">
                          {b.title}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {stylesOf(b).map((style, i) => {
                            const url = b.cleanCoversByStyle?.[style];
                            return (
                              <div key={style} className="w-32">
                                {url ? (
                                  <button
                                    type="button"
                                    onClick={() => setLightbox(url)}
                                    className="block aspect-video w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100 transition hover:ring-2 hover:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800"
                                    title={`${style} — 클릭해서 크게 보기`}
                                  >
                                    <img
                                      src={url}
                                      alt={style}
                                      loading="lazy"
                                      className="h-full w-full object-cover"
                                    />
                                  </button>
                                ) : (
                                  <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed border-rose-300 bg-rose-50/50 text-[11px] font-bold text-rose-400 dark:border-rose-800 dark:bg-rose-950/20">
                                    빈칸
                                  </div>
                                )}
                                <div
                                  className="mt-0.5 truncate text-center text-[10px] text-slate-500 dark:text-slate-400"
                                  title={style}
                                >
                                  {genreLabel(style, i)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
        </div>
      </div>
      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
