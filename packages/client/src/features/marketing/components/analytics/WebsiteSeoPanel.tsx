import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useSeoAudit } from '../../api/use-analytics';

interface Props {
  /** Optional pre-filled URL (e.g. from project.funnel_config.websiteUrl) */
  defaultUrl?: string;
}

export function WebsiteSeoPanel({ defaultUrl = '' }: Props) {
  const [url, setUrl] = useState(defaultUrl);
  const mutation = useSeoAudit();
  const { data: result, isPending, error } = mutation;

  function handleAnalyze() {
    if (!url.trim()) return;
    mutation.mutate(url.trim());
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleAnalyze}
          disabled={isPending}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {isPending ? '분석 중...' : '사이트 분석'}
        </button>
      </div>

      {isPending && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block mb-2" />
          <p>웹사이트 분석 중...</p>
        </div>
      )}

      {error && !isPending && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
          오류: {error instanceof Error ? error.message : '알 수 없는 오류'}
        </div>
      )}

      {result && !isPending && (
        <>
          {/* Score cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Google SEO', score: result.scores?.google ?? 0 },
              { label: 'Naver SEO', score: result.scores?.naver ?? 0 },
              { label: 'GEO', score: result.scores?.geo ?? 0 },
              { label: '기술 SEO', score: result.scores?.tech ?? 0 },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-card border border-border rounded-lg p-4 text-center"
              >
                <div
                  className={cn(
                    'text-2xl font-bold',
                    s.score >= 75
                      ? 'text-green-500'
                      : s.score >= 50
                        ? 'text-yellow-500'
                        : 'text-red-500'
                  )}
                >
                  {s.score}
                </div>
                <div className="text-xs text-muted-foreground mt-1 break-keep">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Issues */}
          {result.issues && result.issues.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 break-keep">
                이슈 목록 ({result.issues.length}개)
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {result.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full mt-1.5 shrink-0',
                        issue.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                      )}
                    />
                    <span className="flex-1 break-keep">{issue.message}</span>
                    {issue.engine && (
                      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded shrink-0">
                        {issue.engine}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!result && !isPending && !error && (
        <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-lg">
          <p className="text-4xl mb-4">🌐</p>
          <p className="text-sm font-medium break-keep">웹사이트 URL을 입력하세요</p>
          <p className="text-xs mt-1 opacity-70 break-keep">
            SEO 점수, 기술 분석, 개선 제안을 확인합니다
          </p>
        </div>
      )}
    </div>
  );
}
