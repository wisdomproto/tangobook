import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { cn } from '@/lib/cn';
import type { StorybookSummary } from '@tangobook/shared';

interface BookCardProps {
  book: StorybookSummary;
}

export function BookCard({ book }: BookCardProps) {
  const navigate = useNavigate();
  return (
    <Card
      interactive
      padding="sm"
      onClick={() => navigate(`/library/${book.id}`)}
      className="relative"
    >
      {book.hasVideo && (
        <span className="absolute top-3 right-3 bg-coral-500 text-white px-2 py-1 rounded-md text-[10px] font-black shadow-pop flex items-center gap-1 z-10">
          📺 영상
        </span>
      )}
      <div
        className={cn(
          'aspect-video rounded-md overflow-hidden mb-3',
          !book.coverImage &&
            'bg-gradient-to-br from-peach-200 to-peach-300 flex items-center justify-center text-4xl'
        )}
      >
        {book.coverImage ? (
          <img
            src={book.coverImage}
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
        만 {book.targetAge}세{book.pageCount ? ` · ${book.pageCount}페이지` : ''}
      </p>
    </Card>
  );
}
