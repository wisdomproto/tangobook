import { usePipeline } from '../api/use-pipeline';

/**
 * /marketing/pipeline — 대표용 발행 관제탑 (콘텐츠 파이프라인).
 * 승인책의 마케팅 자산(릴스·롱폼 ko/en)·발행 현황 + 할 일(커맨드 복사).
 */
export function PipelinePage() {
  const { isLoading } = usePipeline();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">🗼 콘텐츠 파이프라인</h1>
        </header>
        {isLoading && (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            불러오는 중…
          </div>
        )}
      </div>
    </div>
  );
}
