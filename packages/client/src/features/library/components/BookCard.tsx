import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import type { BookIndexEntry } from '@tangobook/shared';
import { ART_STYLES } from '@tangobook/shared';
import { useReadingStatus } from '../hooks/useReadingStatus';
import { BookProgressBadge } from './BookProgressBadge';

interface BookCardProps {
  book: BookIndexEntry;
}

/** 책 카드 — 일러스트 풀 (정사각형 가까운 비율) + 아래 제목. 카드 배경/패딩 X (reference 디자인). */
export function BookCard({ book }: BookCardProps) {
  const navigate = useNavigate();
  const { data: statusMap } = useReadingStatus();
  const status = statusMap?.get(book.id);

  // 그림체별 표지 목록 — 호버 시 main image swap
  const styleEntries = useMemo<Array<{ style: string; label: string; url: string }>>(() => {
    const map = book.coversByStyle ?? {};
    return Object.entries(map)
      .filter(([, url]) => !!url)
      .map(([style, url]) => ({
        style,
        label:
          ART_STYLES.find(
            (a) =>
              a.prompt.toLowerCase() === style.toLowerCase() ||
              a.id.toLowerCase() === style.toLowerCase()
          )?.label ?? style,
        url,
      }));
  }, [book.coversByStyle]);

  const [hoveredUrl, setHoveredUrl] = useState<string | null>(null);
  const displayedUrl = hoveredUrl ?? book.coverImageUrl;
  const showBanner = styleEntries.length >= 2;

  return (
    <button
      onClick={() => navigate(`/library/${book.id}`)}
      className="group flex flex-col items-stretch text-left transition-transform hover:-translate-y-1 active:scale-95"
    >
      <div
        className={cn(
          'aspect-video rounded-2xl overflow-hidden relative shadow-soft group-hover:shadow-pop transition-shadow',
          !displayedUrl &&
            'bg-gradient-to-br from-peach-200 to-peach-300 flex items-center justify-center text-5xl'
        )}
      >
        {displayedUrl ? (
          <img
            src={displayedUrl}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            width={640}
            height={360}
          />
        ) : (
          '📖'
        )}
        {status && status !== 'unread' && (
          <BookProgressBadge status={status} className="absolute top-2 right-2" />
        )}

        {/* 그림체 배너 — 책에 그림체 2개 이상 있을 때만 표시. 호버하면 그 그림체 표지로 main swap. */}
        {showBanner && (
          <div
            className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-1 justify-end"
            onMouseLeave={() => setHoveredUrl(null)}
          >
            {styleEntries.map((s) => {
              const isActive = displayedUrl === s.url;
              return (
                <button
                  key={s.style}
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => setHoveredUrl(s.url)}
                  className={cn(
                    'w-7 h-7 rounded overflow-hidden border-2 shadow-sm transition-all bg-white/80 backdrop-blur-sm',
                    isActive
                      ? 'border-amber-400 ring-1 ring-amber-200'
                      : 'border-white/80 hover:border-amber-300'
                  )}
                  title={s.label}
                  aria-label={`그림체: ${s.label}`}
                >
                  <img
                    src={s.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
      <h3 className="mt-2 font-black text-base text-ink-900 truncate font-display leading-tight px-1">
        {book.title}
      </h3>
    </button>
  );
}
