import type { StorybookSummary, BookIndexEntry } from '@tangobook/shared';
import { bookDisplayTitle } from '@tangobook/shared';
export type CoverInput = Partial<StorybookSummary> &
  Partial<BookIndexEntry> & {
    title: string;
    titleTranslations?: Record<string, string>;
    primaryCoverByLang?: Record<string, string>;
  };
export interface ResolvedCover {
  img?: string;
  hasClean: boolean;
  title: string;
}
export function resolveCover(
  book: CoverInput,
  opts: { style?: string; lang?: string; preferClean?: boolean }
): ResolvedCover {
  // Title-overlay callers use one clean illustration in every language.
  // Other callers retain existing language-specific, baked-title covers.
  // 한 책 = 한 그림체(2026-09-14) — `opts.style` 은 호출부 호환용이고 표지는 책 것 하나다.
  const lang = opts.lang?.toLowerCase().split('-')[0] ?? 'ko';
  const legacy =
    book.primaryCoverByLang?.[lang] ??
    book.coversByLang?.[lang] ??
    book.coverImage ??
    book.coverImageUrl;
  const clean = book.cleanCoverImage ?? book.cleanCoverImageUrl;
  const title = bookDisplayTitle(book, lang);
  if (opts.preferClean && clean) return { img: clean, hasClean: true, title };
  // hasClean = 실제 표지가 없어 클린으로 폴백한 경우에만 true(그때만 오버레이로 제목 보충).
  return { img: legacy ?? clean, hasClean: !legacy && !!clean, title };
}
