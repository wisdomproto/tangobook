import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import type { BookIndexEntry } from '@tangobook/shared';
import { useReadingStatus } from '../hooks/useReadingStatus';
import { BookProgressBadge } from './BookProgressBadge';

interface BookCardProps {
  book: BookIndexEntry;
}

/** 책 카드 — 일러스트 풀 (정사각형 가까운 비율) + 아래 제목. 카드 배경/패딩 X (reference 디자인).
 *  표지는 책의 대표 그림체(defaultStyle)만 노출 — 그림체 선택은 BookDetailPage 에서. */
export function BookCard({ book }: BookCardProps) {
  const navigate = useNavigate();
  const { data: statusMap } = useReadingStatus();
  const status = statusMap?.get(book.id);
  const coverUrl = book.coverImageUrl;

  return (
    <button
      onClick={() => navigate(`/library/${book.id}`)}
      className="group flex flex-col items-stretch text-left transition-transform hover:-translate-y-1 active:scale-95"
    >
      <div
        className={cn(
          'aspect-video rounded-2xl overflow-hidden relative shadow-soft group-hover:shadow-pop transition-shadow',
          !coverUrl &&
            'bg-gradient-to-br from-peach-200 to-peach-300 flex items-center justify-center text-5xl'
        )}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
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
      </div>
      <h3 className="mt-2 font-black text-lg md:text-xl text-ink-900 truncate font-display leading-tight px-1">
        {book.title}
      </h3>
    </button>
  );
}
