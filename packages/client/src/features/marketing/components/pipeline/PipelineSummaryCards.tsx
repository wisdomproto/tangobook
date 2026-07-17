import { useMemo } from 'react';
import type { PipelineRow, PipelineTodo } from '../../api/use-pipeline';

interface PipelineSummaryCardsProps {
  rows: PipelineRow[];
  todos: PipelineTodo[];
  fetchFailed: string[];
}

interface SummaryCard {
  label: string;
  value: number;
  sub?: string;
  accent?: 'default' | 'warn';
}

/** 상단 요약 카드 4개 + 감사 소스 로드 실패 경고 배너 */
export function PipelineSummaryCards({ rows, todos, fetchFailed }: PipelineSummaryCardsProps) {
  const cards = useMemo<SummaryCard[]>(() => {
    const approved = rows.filter((r) => r.approved);
    const noReel = approved.filter((r) => !r.marketing.reels.ko).length;
    const noLongform = approved.filter((r) => (r.marketing.longform.ko ?? []).length === 0).length;
    const scheduleBooks = new Set(
      todos.filter((t) => t.kind === 'schedule-longform').flatMap((t) => t.bookIds)
    );
    return [
      { label: '승인된 책', value: approved.length, sub: `전체 ${rows.length}권` },
      {
        label: '릴스(ko) 없는 승인책',
        value: noReel,
        accent: noReel > 0 ? 'warn' : 'default',
      },
      {
        label: '롱폼(ko) 없는 승인책',
        value: noLongform,
        accent: noLongform > 0 ? 'warn' : 'default',
      },
      { label: '예약 대기', value: scheduleBooks.size, sub: '롱폼 완성·유튜브 예약 없음' },
    ];
  }, [rows, todos]);

  return (
    <div className="space-y-3">
      {fetchFailed.length > 0 && (
        <div className="rounded-lg border border-amber-400/50 bg-amber-500/10 p-3 text-sm text-amber-600 break-keep">
          ⚠️ 이번 감사에서 {fetchFailed.length}개 소스를 불러오지 못했습니다 — 일부 책·자산이
          누락되어 보일 수 있어요. (새로고침으로 재감사)
          <span className="mt-1 block text-xs opacity-80">{fetchFailed.join(', ')}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground break-keep">{card.label}</div>
            <div
              className={`mt-1 text-2xl font-bold ${
                card.accent === 'warn' ? 'text-amber-600' : 'text-foreground'
              }`}
            >
              {card.value}
            </div>
            {card.sub && <div className="mt-0.5 text-xs text-muted-foreground">{card.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
