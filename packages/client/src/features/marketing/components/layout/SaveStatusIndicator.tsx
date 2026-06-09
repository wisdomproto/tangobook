import { Check, Loader2, TriangleAlert } from 'lucide-react';
import { useSaveStatusStore } from '../../store/save-status-store';
import { cn } from '../../lib/utils';

interface SaveStatusIndicatorProps {
  className?: string;
}

export function SaveStatusIndicator({ className }: SaveStatusIndicatorProps) {
  const pending = useSaveStatusStore((s) => s.pending);
  const flushing = useSaveStatusStore((s) => s.flushing);
  const lastError = useSaveStatusStore((s) => s.lastError);
  const lastSavedAt = useSaveStatusStore((s) => s.lastSavedAt);

  const active = pending > 0 || flushing;

  if (lastError && !active) {
    return (
      <div
        className={cn('flex items-center gap-1.5 text-xs text-destructive', className)}
        title={lastError}
      >
        <TriangleAlert size={12} />
        <span>오류</span>
      </div>
    );
  }

  if (active) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
        <Loader2 size={12} className="animate-spin" />
        <span>저장 중…</span>
      </div>
    );
  }

  if (lastSavedAt) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
        <Check size={12} className="text-green-500" />
        <span>저장됨</span>
      </div>
    );
  }

  return null;
}
