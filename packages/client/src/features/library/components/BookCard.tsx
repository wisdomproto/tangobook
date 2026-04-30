import { useNavigate } from 'react-router-dom';
import { Card } from '@/design-system';
import { cn } from '@/lib/cn';
import type { BookIndexEntry } from '@tangobook/shared';

interface BookCardProps {
  book: BookIndexEntry;
}

export function BookCard({ book }: BookCardProps) {
  const navigate = useNavigate();
  const levels = book.usedVariants.levels;
  const styles = book.usedVariants.styles;
  return (
    <Card
      interactive
      padding="sm"
      onClick={() => navigate(`/library/${book.id}`)}
      className="relative"
    >
      <div
        className={cn(
          'aspect-video rounded-md overflow-hidden mb-3',
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
      </div>
      <h3 className="font-black text-sm text-ink-900 truncate font-display">{book.title}</h3>
      <p className="text-[11px] text-ink-500 font-bold mt-1">
        {levels.length > 0 ? levels.slice().sort().join(' · ') : '준비 중'}
        {styles.length > 0 ? ` · ${styles.length}개 그림체` : ''}
      </p>
    </Card>
  );
}
