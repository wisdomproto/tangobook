import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../lib/utils';
import type { SeoDetail } from '../../lib/seo-scorer';

interface SeoScoreDisplayProps {
  score: number;
  details: SeoDetail[];
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-500';
}

function barColor(ratio: number): string {
  if (ratio >= 0.8) return 'bg-green-500';
  if (ratio >= 0.6) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function SeoScoreDisplay({ score, details }: SeoScoreDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const maxTotal = details.reduce((sum, d) => sum + d.maxScore, 0);

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      {/* Header row: big score + toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className={cn('text-2xl font-bold tabular-nums', scoreColor(score))}>{score}</span>
          <span className="text-xs text-muted-foreground">/ {maxTotal}점</span>
          <span className="text-xs font-medium text-muted-foreground ml-1">SEO 점수</span>
        </div>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setExpanded((p) => !p)}
          className="gap-1 text-xs"
        >
          {expanded ? (
            <>
              접기 <ChevronUp size={12} />
            </>
          ) : (
            <>
              상세보기 <ChevronDown size={12} />
            </>
          )}
        </Button>
      </div>

      {/* Score bar */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor(score / maxTotal))}
          style={{ width: `${maxTotal > 0 ? (score / maxTotal) * 100 : 0}%` }}
        />
      </div>

      {/* Per-category breakdown */}
      {expanded && (
        <div className="space-y-1.5 pt-1">
          {details.map((d) => {
            const ratio = d.maxScore > 0 ? d.score / d.maxScore : 0;
            return (
              <div key={d.category} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/80">{d.label}</span>
                  <span className={cn('tabular-nums font-medium', scoreColor(ratio * 100))}>
                    {d.score}/{d.maxScore}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', barColor(ratio))}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
                {d.message && (
                  <p className="text-[10px] text-muted-foreground leading-tight">{d.message}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
