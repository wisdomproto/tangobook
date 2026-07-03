import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { canReadBook, type BookIndexEntry } from '@tangobook/shared';
import { useAccess, LockBadge } from '@/features/access';
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
  // 프리미엄(잠금) 표시 — PAYWALL_ENABLED=false(개발단계)면 access 항상 entitled → 미표시.
  const access = useAccess();
  const locked = !canReadBook(book, access);
  // "무료" 뱃지 — 잠금이 실제 작동할 때(!isEntitled)만, 무료책(isAccessibleForFree!==false:
  // 신데렐라·인어공주·백설공주)에. 게스트가 잠긴 책들 사이에서 읽을 수 있는 책을 한눈에 찾게 함.
  const showFreeBadge = book.isAccessibleForFree !== false && !access.isEntitled;

  return (
    <button
      onClick={() => navigate(`/library/${book.id}`)}
      data-sound="book-open"
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
        {showFreeBadge && (
          <span className="absolute top-2 left-2 rounded-full bg-coral-500 text-white text-xs font-black px-2.5 py-1 shadow-soft">
            무료
          </span>
        )}
        {locked && <LockBadge className="absolute top-2 left-2" />}
      </div>
      <h3 className="mt-2 font-black text-base md:text-xl text-ink-900 truncate font-display leading-tight px-1">
        {book.title}
      </h3>
    </button>
  );
}
