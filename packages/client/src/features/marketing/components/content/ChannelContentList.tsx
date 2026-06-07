import { useState, useEffect, type ReactNode } from 'react';
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../ui/button';
import { KoreanInput } from '../../ui/korean-input';
import { cn } from '../../lib/utils';
import { ErrorBoundary } from '../ErrorBoundary';

interface ChannelContentListProps<T> {
  items: T[];
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  onTitleChange: (id: string, title: string) => void;
  onAdd: () => Promise<string>;
  onDelete: (id: string) => void;
  accentColor?: string;
  addLabel?: string;
  renderContent: (item: T) => ReactNode;
}

export function ChannelContentList<T>({
  items,
  getId,
  getTitle,
  onTitleChange,
  onAdd,
  onDelete,
  accentColor = 'border-primary',
  addLabel = '새 콘텐츠 추가',
  renderContent,
}: ChannelContentListProps<T>) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  // Auto-expand the first item when the list first becomes non-empty
  const firstId = items.length > 0 ? getId(items[0]) : null;
  useEffect(() => {
    if (firstId) {
      setExpandedIds((prev) => (prev.size === 0 ? new Set([firstId]) : prev));
    }
  }, [firstId]);

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      const newId = await onAdd();
      setExpandedIds((prev) => new Set([...prev, newId]));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const id = getId(item);
        const title = getTitle(item);
        const isExpanded = expandedIds.has(id);

        return (
          <div
            key={id}
            className={cn(
              'rounded-lg border border-border overflow-hidden',
              isExpanded && accentColor
            )}
          >
            {/* Accordion header */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors',
                isExpanded && 'border-b border-border bg-muted/20'
              )}
              onClick={() => toggle(id)}
            >
              <button
                type="button"
                className="shrink-0 text-muted-foreground"
                aria-label={isExpanded ? '접기' : '펼치기'}
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {/* Editable title — stop propagation so click doesn't toggle */}
              <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                <KoreanInput
                  value={title}
                  onCommit={(val) => onTitleChange(id, val)}
                  className="h-6 text-xs font-medium border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-b focus-visible:border-ring rounded-none"
                  placeholder="제목 없음"
                />
              </div>

              {/* Delete button */}
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                title="삭제"
              >
                <Trash2 size={13} />
              </Button>
            </div>

            {/* Expanded content wrapped in ErrorBoundary */}
            {isExpanded && (
              <ErrorBoundary resetKeys={[id]}>
                <div className="p-3">{renderContent(item)}</div>
              </ErrorBoundary>
            )}
          </div>
        );
      })}

      {/* Add button */}
      <Button
        size="sm"
        variant="outline"
        onClick={handleAdd}
        disabled={isAdding}
        className="w-full gap-1.5 text-xs border-dashed"
      >
        {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        {addLabel}
      </Button>
    </div>
  );
}
