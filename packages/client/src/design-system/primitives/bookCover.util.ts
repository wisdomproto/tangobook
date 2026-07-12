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
  // 접근 B: 표지는 언어별로 굽거나(vi/th/zh) 원본(ko/en)을 그대로 등록됨 → 화면엔 항상 이 "실제 표지"를 보여준다.
  // 클린 표지(cleanCover*)는 굽기용 베이스라 직접 노출 X — 실제 표지가 전혀 없을 때만 최후 폴백.
  const legacyByStyle = book.coversByStyle ?? {};
  const legacy =
    (opts.style ? legacyByStyle[opts.style] : undefined) ?? book.coverImage ?? book.coverImageUrl;
  const cleanByStyle = book.cleanCoversByStyle ?? {};
  const clean =
    (opts.style ? cleanByStyle[opts.style] : undefined) ??
    book.cleanCoverImage ??
    book.cleanCoverImageUrl;
  const title = (opts.lang && book.titleTranslations?.[opts.lang]) || book.title;
  // hasClean = 실제 표지가 없어 클린으로 폴백한 경우에만 true(그때만 오버레이로 제목 보충).
  return { img: legacy ?? clean, hasClean: !legacy && !!clean, title };
}
