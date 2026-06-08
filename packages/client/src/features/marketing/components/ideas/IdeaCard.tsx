import type { ReactNode } from 'react';
import { Newspaper, MessageSquare, BookOpen, Video } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../lib/utils';

// Channel icon map (lucide v1.17 — Youtube not available, use Video)
const CHANNEL_ICONS: Record<string, ReactNode> = {
  blog: <BookOpen className="w-5 h-5" />,
  cardnews: <Newspaper className="w-5 h-5" />,
  youtube: <Video className="w-5 h-5" />,
  threads: <MessageSquare className="w-5 h-5" />,
};

interface IdeaCardProps {
  channel: string;
  title: string;
  structure: string;
  outline: string[];
  onGenerate: () => void;
  onSave: () => void;
}

const CHANNEL_LABELS: Record<string, string> = {
  blog: '블로그',
  cardnews: '카드뉴스',
  youtube: '유튜브',
  threads: '스레드',
};

const CHANNEL_COLORS: Record<string, string> = {
  blog: 'bg-blue-50 border-blue-200',
  cardnews: 'bg-pink-50 border-pink-200',
  youtube: 'bg-red-50 border-red-200',
  threads: 'bg-gray-50 border-gray-200',
};

export function IdeaCard({
  channel,
  title,
  structure,
  outline,
  onGenerate,
  onSave,
}: IdeaCardProps) {
  const icon = CHANNEL_ICONS[channel] ?? <BookOpen className="w-5 h-5" />;
  const label = CHANNEL_LABELS[channel] ?? channel;
  const colorClass = CHANNEL_COLORS[channel] ?? 'bg-gray-50 border-gray-200';

  return (
    <div className={cn('rounded-lg border p-4 space-y-3', colorClass)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 text-muted-foreground">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {label}
          </div>
          <h3 className="font-semibold text-sm leading-snug">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{structure}</p>
        </div>
      </div>

      {outline.length > 0 && (
        <ol className="text-xs space-y-1 pl-4">
          {outline.map((item, i) => (
            <li key={i} className="text-muted-foreground list-decimal">
              {item}
            </li>
          ))}
        </ol>
      )}

      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onGenerate}>
          ✨ 생성
        </Button>
        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onSave}>
          💾 보관
        </Button>
      </div>
    </div>
  );
}
