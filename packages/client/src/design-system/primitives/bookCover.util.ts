import type { StorybookSummary, BookIndexEntry } from '@tangobook/shared';
export type CoverInput = Partial<StorybookSummary> &
  Partial<BookIndexEntry> & {
    title: string;
    titleTranslations?: Record<string, string>;
  };
export interface ResolvedCover {
  img?: string;
  hasClean: boolean;
  title: string;
}
export function resolveCover(
  book: CoverInput,
  opts: { style?: string; lang?: string }
): ResolvedCover {
  const cleanByStyle = book.cleanCoversByStyle ?? {};
  const clean =
    (opts.style ? cleanByStyle[opts.style] : undefined) ??
    book.cleanCoverImage ??
    book.cleanCoverImageUrl;
  const legacyByStyle = book.coversByStyle ?? {};
  const legacy =
    (opts.style ? legacyByStyle[opts.style] : undefined) ?? book.coverImage ?? book.coverImageUrl;
  const title = (opts.lang && book.titleTranslations?.[opts.lang]) || book.title;
  return { img: clean ?? legacy, hasClean: !!clean, title };
}
