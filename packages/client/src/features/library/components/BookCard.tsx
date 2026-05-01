import { useNavigate } from 'react-router-dom';
import { Card } from '@/design-system';
import { cn } from '@/lib/cn';
import type { BookIndexEntry } from '@tangobook/shared';
import { useReadingStatus } from '../hooks/useReadingStatus';
import { BookProgressBadge } from './BookProgressBadge';

interface BookCardProps {
  book: BookIndexEntry;
}

export function BookCard({ book }: BookCardProps) {
  const navigate = useNavigate();
  const { data: statusMap } = useReadingStatus();
  const status = statusMap?.get(book.id);

  return (
    <Card
      interactive
      padding="sm"
      onClick={() => navigate(`/library/${book.id}`)}
      className="relative"
    >
      <div
        className={cn(
          'aspect-video rounded-md overflow-hidden mb-3 relative',
          !book.coverImageUrl &&
            'bg-gradient-to-br from-peach-200 to-peach-300 flex items-center justify-center text-4xl'
        )}
      >
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
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
      <h3 className="font-black text-sm text-ink-900 truncate font-display">{book.title}</h3>
    </Card>
  );
}
