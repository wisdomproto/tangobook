import { cn } from '@/lib/cn';
import { resolveCover, type CoverInput } from './bookCover.util';

const FONT_CLASS: Record<string, string> = {
  ko: 'font-cover-ko',
  zh: 'font-cover-zh',
  ja: 'font-cover-ja',
  th: 'font-cover-th',
};
const coverFontClass = (lang: string) => FONT_CLASS[lang] ?? 'font-cover-latin';

export interface BookCoverProps {
  book: CoverInput;
  lang: string;
  style?: string;
  /** true = standalone surface (render glass title pill); false = caption surface. */
  overlayTitle?: boolean;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
}

/** 표지 단일 진입점 — 클린 표지 + (옵션) 글래스 제목 오버레이. 클린 없으면 레거시 표지(오버레이 X). */
export function BookCover({
  book,
  lang,
  style,
  overlayTitle = false,
  className,
  imgClassName,
  loading = 'lazy',
}: BookCoverProps) {
  const { img, hasClean, title } = resolveCover(book, { style, lang });
  const showOverlay = overlayTitle && hasClean;
  return (
    <div
      className={cn('relative w-full h-full overflow-hidden', className)}
      style={{ containerType: 'inline-size' }}
    >
      {img ? (
        <img
          src={img}
          alt={title}
          className={cn('w-full h-full object-cover', imgClassName)}
          loading={loading}
          decoding="async"
          key={img}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-peach-200 to-peach-300 text-5xl">
          📖
        </div>
      )}
      {showOverlay && (
        <div className="absolute top-[6%] left-1/2 -translate-x-1/2 w-max max-w-[88%] z-[3]">
          <div
            className="rounded-[22px] px-6 py-2 border border-white/30 backdrop-blur-md"
            style={{
              background: 'rgba(22,16,11,0.46)',
              boxShadow: '0 6px 18px rgba(0,0,0,.26), inset 0 1px 0 rgba(255,255,255,.28)',
            }}
          >
            <span
              className={cn(
                'block text-center text-white leading-[1.12] break-keep',
                coverFontClass(lang)
              )}
              style={{
                textShadow: '0 2px 6px rgba(0,0,0,.35)',
                fontSize: 'clamp(13px, 4.2cqw, 34px)',
              }}
            >
              {title}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
