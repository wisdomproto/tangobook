import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storybookApi } from '@/features/storybook';
import { findArtStylePreset } from '@/features/editor/lib/style-assets';
import { settingsApi } from '@/features/settings/api/settings.api';
import { syncBookPublicAfterCellToggle } from '../lib/public-sync';
import type { SavedArtStyle, Storybook, StorybookSummary } from '@tangobook/shared';

interface Props {
  categoryOrder: string[];
  booksByCategory: Record<string, StorybookSummary[]>;
  emojiOf: (cat: string) => string;
  initialOpenCat?: string;
  onClose: () => void;
  onSavedFlash?: () => void;
}

const LANG_FLAG: Record<string, string> = { ko: '🇰🇷', en: '🇺🇸' };
const DEFAULT_LANGS = ['ko', 'en'];

function getCellCover(sb: Storybook, style: string, lang: string): string | undefined {
  const assets = sb.styleAssets?.[style];
  const url = assets?.primaryCoverByLang?.[lang];
  if (url) return url;
  if (style === sb.artStyle && lang === 'ko') {
    return assets?.coverImage ?? sb.coverImage;
  }
  return assets?.coverImage;
}

function isCellPublic(sb: Storybook, style: string, lang: string): boolean {
  return sb.publicByStyleLang?.[style]?.[lang] !== false;
}

function getStyleLabel(value: string, lib?: SavedArtStyle[]): string {
  return findArtStylePreset(value, lib)?.label ?? value.slice(0, 14);
}

function getBookStyles(sb: Storybook): string[] {
  const styles =
    sb.availableStyles && sb.availableStyles.length > 0 ? sb.availableStyles : [sb.artStyle];
  return Array.from(new Set(styles));
}

function getBookLangs(sb: Storybook): string[] {
  const langs = sb.languages && sb.languages.length > 0 ? sb.languages : DEFAULT_LANGS;
  return Array.from(new Set(langs));
}

function getCategoryStyleUnion(books: Storybook[]): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  books.forEach((sb) =>
    getBookStyles(sb).forEach((s) => {
      if (!seen.has(s)) {
        seen.add(s);
        order.push(s);
      }
    })
  );
  return order;
}

function getCategoryLangUnion(books: Storybook[]): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  books.forEach((sb) =>
    getBookLangs(sb).forEach((l) => {
      if (!seen.has(l)) {
        seen.add(l);
        order.push(l);
      }
    })
  );
  return order.length > 0 ? order : DEFAULT_LANGS;
}

interface CellBtnProps {
  sb: Storybook;
  style: string;
  lang: string;
  saving: boolean;
  onToggle: () => void;
}

function CellBtn({ sb, style, lang, saving, onToggle }: CellBtnProps) {
  const bookPublic = sb.isPublic !== false;
  const cover = getCellCover(sb, style, lang);
  const pub = isCellPublic(sb, style, lang);
  const hasCover = !!cover;
  return (
    <button
      type="button"
      disabled={saving || !bookPublic}
      onClick={onToggle}
      className={`flex items-center gap-1 mx-auto p-0.5 rounded transition ${
        bookPublic ? 'hover:bg-peach-50' : 'opacity-50 cursor-not-allowed'
      } ${saving ? 'cursor-wait' : 'cursor-pointer'}`}
      title={
        !bookPublic
          ? '책 단위 비공개 상태'
          : pub
            ? '노출 중 — 클릭해서 숨김'
            : '숨김 — 클릭해서 노출'
      }
    >
      <div
        className={`w-7 rounded border overflow-hidden shrink-0 ${
          pub && bookPublic ? 'border-coral-300' : 'border-ink-200 grayscale'
        }`}
      >
        <div className="aspect-[3/4] bg-peach-100">
          {hasCover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-ink-100 text-ink-400 text-[10px]">
              📭
            </div>
          )}
        </div>
      </div>
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center font-black text-sm shrink-0 ${
          pub && bookPublic
            ? 'bg-coral-500 border-coral-600 text-white'
            : 'bg-white border-ink-300 text-ink-300'
        }`}
      >
        {saving ? '…' : pub ? '✓' : ''}
      </div>
    </button>
  );
}

export function BookMatrixModal({
  categoryOrder,
  booksByCategory,
  emojiOf,
  initialOpenCat,
  onClose,
  onSavedFlash,
}: Props) {
  const qc = useQueryClient();
  const { data: styleLibrary } = useQuery({
    queryKey: ['art-style-library'],
    queryFn: settingsApi.getArtStyleLibrary,
    staleTime: 60_000,
  });
  const [details, setDetails] = useState<Record<string, Storybook>>({});
  const [loadingCats, setLoadingCats] = useState<Set<string>>(new Set());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(() => {
    const init = new Set<string>();
    if (initialOpenCat && booksByCategory[initialOpenCat]?.length) init.add(initialOpenCat);
    return init;
  });
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalBooks = useMemo(
    () => categoryOrder.reduce((sum, c) => sum + (booksByCategory[c]?.length ?? 0), 0),
    [categoryOrder, booksByCategory]
  );

  const loadCategoryDetails = async (cat: string) => {
    const books = booksByCategory[cat] ?? [];
    const missing = books.filter((b) => !details[b.id]);
    if (missing.length === 0) return;
    setLoadingCats((prev) => new Set(prev).add(cat));
    try {
      const results = await Promise.allSettled(
        missing.map(async (b) => {
          const cached = qc.getQueryData<Storybook>(['storybook', b.id]);
          if (cached) return cached;
          const sb = await storybookApi.getById(b.id);
          qc.setQueryData(['storybook', b.id], sb);
          return sb;
        })
      );
      const next: Record<string, Storybook> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') next[missing[i].id] = r.value;
      });
      setDetails((d) => ({ ...d, ...next }));
    } finally {
      setLoadingCats((prev) => {
        const n = new Set(prev);
        n.delete(cat);
        return n;
      });
    }
  };

  useEffect(() => {
    expandedCats.forEach((cat) => void loadCategoryDetails(cat));
    // mount only — initial cat fetch
  }, []);

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const n = new Set(prev);
      if (n.has(cat)) n.delete(cat);
      else {
        n.add(cat);
        void loadCategoryDetails(cat);
      }
      return n;
    });
  };

  const expandAll = () => {
    const all = categoryOrder.filter((c) => (booksByCategory[c]?.length ?? 0) > 0);
    setExpandedCats(new Set(all));
    all.forEach((c) => void loadCategoryDetails(c));
  };

  const collapseAll = () => setExpandedCats(new Set());

  const toggleCell = async (sb: Storybook, style: string, lang: string) => {
    const cellKey = `${sb.id}|${style}|${lang}`;
    if (savingCell) return;
    setSavingCell(cellKey);
    setErrorMsg(null);
    try {
      const current = isCellPublic(sb, style, lang);
      const next = !current;
      const matrix = { ...(sb.publicByStyleLang ?? {}) };
      const inner = { ...(matrix[style] ?? {}) };
      inner[lang] = next;
      matrix[style] = inner;
      const updated = syncBookPublicAfterCellToggle({ ...sb, publicByStyleLang: matrix });
      const saved = await storybookApi.save(updated);
      qc.setQueryData(['storybook', saved.id], saved);
      setDetails((d) => ({ ...d, [saved.id]: saved }));
      onSavedFlash?.();
    } catch (err) {
      setErrorMsg((err as Error).message || '저장 실패');
    } finally {
      setSavingCell(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-[1600px] max-h-[95vh] shadow-pop flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-white border-b border-ink-100 px-6 py-3 flex items-center justify-between gap-4 rounded-t-3xl">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-xl font-black text-ink-900 flex items-center gap-2 shrink-0">
              <span>📊</span>
              <span>그림체 × 언어 표</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-peach-100 text-ink-900 font-black text-xs shrink-0">
              {categoryOrder.length}카테고리 · {totalBooks}권
            </span>
            {errorMsg && <span className="text-sm text-danger font-bold truncate">{errorMsg}</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-1 rounded-full bg-coral-100 text-coral-600 font-black text-xs hover:bg-coral-200"
            >
              모두 펼침
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-1 rounded-full bg-ink-100 text-ink-700 font-black text-xs hover:bg-ink-200"
            >
              모두 접기
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-700 font-black"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="overflow-auto flex-1 px-4 py-3">
          <div className="space-y-2">
            {categoryOrder.map((cat) => {
              const books = booksByCategory[cat] ?? [];
              const isExpanded = expandedCats.has(cat);
              const isLoading = loadingCats.has(cat);
              const loadedBooks = books
                .map((b) => details[b.id])
                .filter((s): s is Storybook => !!s);
              const styles = isExpanded ? getCategoryStyleUnion(loadedBooks) : [];
              const langs = isExpanded ? getCategoryLangUnion(loadedBooks) : [];
              return (
                <section key={cat} className="border border-ink-100 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCat(cat)}
                    disabled={books.length === 0}
                    className={`w-full flex items-center justify-between px-3 py-2 transition ${
                      books.length === 0
                        ? 'bg-ink-50 text-ink-400 cursor-not-allowed'
                        : 'bg-peach-50 hover:bg-peach-100 text-ink-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black">
                      <span className="text-sm">{isExpanded ? '▼' : '▶'}</span>
                      <span>{emojiOf(cat)}</span>
                      <span>{cat}</span>
                      <span className="text-xs text-ink-500 ml-1">({books.length}권)</span>
                    </div>
                    {isLoading && <span className="text-xs text-ink-500">불러오는 중...</span>}
                  </button>

                  {isExpanded && (
                    <div className="px-2 py-3 bg-white">
                      {books.length === 0 ? (
                        <div className="text-center py-6 text-ink-400 text-sm">
                          이 카테고리에 책이 없어요.
                        </div>
                      ) : loadedBooks.length === 0 ? (
                        <div className="text-center py-6 text-ink-500 text-sm">
                          {books.length}권 정보를 불러오는 중...
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="border-b-2 border-ink-200">
                                <th
                                  rowSpan={2}
                                  className="text-left px-2 py-1 font-black text-ink-700 sticky left-0 bg-white z-10 min-w-[180px]"
                                >
                                  책 ({loadedBooks.length}권)
                                </th>
                                {styles.map((s) => (
                                  <th
                                    key={s}
                                    colSpan={langs.length}
                                    className="text-center px-2 py-1 font-black text-ink-700 border-l border-ink-100"
                                  >
                                    🎨 {getStyleLabel(s, styleLibrary)}
                                  </th>
                                ))}
                              </tr>
                              <tr className="border-b border-ink-200">
                                {styles.flatMap((s) =>
                                  langs.map((l, li) => (
                                    <th
                                      key={`${s}-${l}`}
                                      className={`text-center px-1 py-1 font-black text-ink-500 text-[11px] ${
                                        li === 0 ? 'border-l border-ink-100' : ''
                                      }`}
                                    >
                                      {LANG_FLAG[l] ?? l}
                                    </th>
                                  ))
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {loadedBooks.map((sb) => {
                                const bookStyles = new Set(getBookStyles(sb));
                                const bookLangs = new Set(getBookLangs(sb));
                                const bookPublic = sb.isPublic !== false;
                                return (
                                  <tr
                                    key={sb.id}
                                    className="border-b border-ink-50 hover:bg-cream-50/50"
                                  >
                                    <td className="px-2 py-1.5 sticky left-0 bg-white z-10 group-hover:bg-cream-50/50">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-9 rounded overflow-hidden bg-peach-100 shrink-0">
                                          {sb.coverImage ? (
                                            <img
                                              src={sb.coverImage}
                                              alt=""
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px]">
                                              📭
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-black text-ink-900 text-xs truncate max-w-[160px]">
                                            {sb.title}
                                          </div>
                                          {!bookPublic && (
                                            <div className="text-[10px] text-danger font-black">
                                              비공개
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    {styles.flatMap((style) =>
                                      langs.map((lang, li) => {
                                        const owned = bookStyles.has(style) && bookLangs.has(lang);
                                        const cellKey = `${sb.id}|${style}|${lang}`;
                                        const saving = savingCell === cellKey;
                                        return (
                                          <td
                                            key={`${style}-${lang}`}
                                            className={`text-center py-1 align-middle ${
                                              li === 0 ? 'border-l border-ink-100' : ''
                                            }`}
                                          >
                                            {owned ? (
                                              <CellBtn
                                                sb={sb}
                                                style={style}
                                                lang={lang}
                                                saving={saving}
                                                onToggle={() => toggleCell(sb, style, lang)}
                                              />
                                            ) : (
                                              <span className="text-ink-300 text-xs">—</span>
                                            )}
                                          </td>
                                        );
                                      })
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
