interface ImagePreviewProps {
  src?: string;
  alt?: string;
  onDelete?: () => void;
  onClick?: () => void;
  loading?: boolean;
  /** CSS aspect-ratio value, e.g. '16/9', '1/1' */
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain';
  /** 'sm' for card-sized previews, 'lg' for main area (Cover) */
  size?: 'sm' | 'lg';
  emptyText?: string;
  className?: string;
}

export function ImagePreview({
  src,
  alt = '',
  onDelete,
  onClick,
  loading = false,
  aspectRatio = '1/1',
  objectFit = 'cover',
  size = 'sm',
  emptyText = '드래그 또는 업로드',
  className = '',
}: ImagePreviewProps) {
  const isLg = size === 'lg';

  return (
    <div
      className={`relative w-full overflow-hidden flex items-center justify-center group/img ${
        isLg
          ? 'rounded-xl bg-gradient-to-br from-violet-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700'
          : 'rounded bg-slate-100 dark:bg-slate-800'
      } ${src ? 'cursor-pointer' : ''} ${className}`}
      style={{ aspectRatio }}
      onClick={() => src && onClick?.()}
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : src ? (
        <>
          <img
            src={src}
            alt={alt}
            className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'}`}
          />
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={`absolute ${
                isLg ? 'top-2 right-2 w-6 h-6' : 'top-1 right-1 w-5 h-5'
              } rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition hover:bg-red-500`}
              title="이미지 삭제"
            >
              <svg
                className={isLg ? 'w-3.5 h-3.5' : 'w-3 h-3'}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </>
      ) : (
        <div
          className={`flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600 ${
            isLg ? 'gap-2' : 'text-xs gap-1'
          }`}
        >
          <svg
            className={isLg ? 'w-16 h-16' : 'w-6 h-6'}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <span className={isLg ? 'text-sm' : ''}>{emptyText}</span>
        </div>
      )}
    </div>
  );
}
