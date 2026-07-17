import { usePipeline, useRefreshPipeline } from '../api/use-pipeline';
import { PipelineSummaryCards } from '../components/pipeline/PipelineSummaryCards';
import { TodoPanel } from '../components/pipeline/TodoPanel';
import { PipelineMatrix } from '../components/pipeline/PipelineMatrix';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-muted" />
      <div className="h-72 rounded-xl bg-muted" />
    </div>
  );
}

/**
 * /marketing/pipeline — 대표용 발행 관제탑 (콘텐츠 파이프라인).
 * 승인책의 마케팅 자산(릴스·롱폼 ko/en)·발행 현황 + 할 일(커맨드 복사).
 */
export function PipelinePage() {
  const { data, isLoading, isError, error, refetch } = usePipeline();
  const refreshMutation = useRefreshPipeline();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">🗼 콘텐츠 파이프라인</h1>
            <p className="mt-1 text-sm text-muted-foreground break-keep">
              승인된 책의 마케팅 자산·발행 현황과 할 일
              {data && ` · 감사 시각 ${formatDate(data.generatedAt)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending || isLoading}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {refreshMutation.isPending ? '재감사 중…' : '🔄 새로고침'}
          </button>
        </header>

        {refreshMutation.isError && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive break-keep">
            재감사에 실패했습니다:{' '}
            {refreshMutation.error instanceof Error
              ? refreshMutation.error.message
              : '알 수 없는 오류'}
          </div>
        )}

        {isLoading && <LoadingSkeleton />}

        {isError && !isLoading && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive break-keep">
            <p>{error instanceof Error ? error.message : '파이프라인을 불러오지 못했습니다.'}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-md border border-destructive/40 bg-card px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              다시 시도
            </button>
          </div>
        )}

        {data && !isLoading && !isError && (
          <div className="space-y-8 pb-10">
            <PipelineSummaryCards
              rows={data.rows}
              todos={data.todos}
              fetchFailed={data.fetchFailed}
            />
            <TodoPanel todos={data.todos} />
            <PipelineMatrix rows={data.rows} />
          </div>
        )}
      </div>
    </div>
  );
}
