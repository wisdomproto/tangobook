import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../ui/button';
import { Skeleton } from '../../ui/skeleton';
import type { KeywordGroup } from '../../api/use-golden-keywords';

interface GoldenTierCardsProps {
  groups: KeywordGroup[];
  strategy: string;
  loading: boolean;
  onClearStrategy: () => void;
}

/** Minimal bold + line-break markdown-lite (CF :696 region) — no full markdown lib. */
function renderStrategy(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

export function GoldenTierCards({
  groups,
  strategy,
  loading,
  onClearStrategy,
}: GoldenTierCardsProps) {
  const [strategyOpen, setStrategyOpen] = useState(true);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  // Count per tier
  const gold = groups.find((g) => g.category.includes('황금'))?.keywords.length ?? 0;
  const silver = groups.find((g) => g.category.includes('유망'))?.keywords.length ?? 0;
  const bronze = groups.find((g) => g.category.includes('일반'))?.keywords.length ?? 0;
  const total = gold + silver + bronze;

  if (total === 0 && !strategy) return null;

  return (
    <div className="space-y-4">
      {/* 4-stat summary grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            emoji: '🏆',
            label: '황금 키워드',
            count: gold,
            color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          },
          {
            emoji: '🥇',
            label: '유망 키워드',
            count: silver,
            color: 'text-orange-600 bg-orange-50 border-orange-200',
          },
          {
            emoji: '🥈',
            label: '일반 키워드',
            count: bronze,
            color: 'text-gray-600 bg-gray-50 border-gray-200',
          },
          {
            emoji: '📊',
            label: '전체',
            count: total,
            color: 'text-blue-600 bg-blue-50 border-blue-200',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg border p-3 flex flex-col items-center gap-1 ${stat.color}`}
          >
            <span className="text-2xl">{stat.emoji}</span>
            <span className="text-2xl font-bold tabular-nums">{stat.count}</span>
            <span className="text-xs font-medium">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Collapsible AI strategy panel */}
      {strategy && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
            <span className="font-semibold text-sm flex items-center gap-2">
              🏆 AI 황금 키워드 전략
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={onClearStrategy}
              >
                닫기
              </Button>
              <button
                onClick={() => setStrategyOpen((p) => !p)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={strategyOpen ? '접기' : '펼치기'}
              >
                {strategyOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          {strategyOpen && (
            <div
              className="px-4 py-4 text-sm leading-relaxed text-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderStrategy(strategy) }}
            />
          )}
        </div>
      )}
    </div>
  );
}
