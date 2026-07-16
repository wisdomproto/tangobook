import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { useStorybookSummaries } from '../../api/use-storybook-summaries';
import type { GA4BookRow, GA4TopPage } from '../../types/analytics';

interface BookPerformanceProps {
  books: GA4BookRow[];
  others: GA4TopPage[];
  /** 링크 조립용 사이트 베이스 URL (예: "https://tangobook.co.kr"). */
  websiteUrl?: string;
}

/** 초 → "m:ss" (예: 192 → "3:12"). */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** GA4 pageTitle 의 " | 탱고북" 류 접미사 제거(폴백 제목용). */
function cleanTitle(t: string): string {
  return t.replace(/\s*[|·\-–—]\s*탱고북.*$/, '').trim();
}

/**
 * 동화책별 인기 — 서버가 pagePath 를 책 id 로 묶어 준 결과(useGa4TopBooks)를
 * 표지 썸네일 + 실제 책 제목과 함께 렌더. 하단에 비-책 페이지(기타) 목록.
 * 기존 TopPagesTable + ContentPerformance(원경로 나열) 를 대체.
 */
export function BookPerformance({ books, others, websiteUrl }: BookPerformanceProps) {
  const { data: lookup } = useStorybookSummaries();

  const bookHref = (id: string) => (websiteUrl ? `${websiteUrl}/library/${id}` : `/library/${id}`);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold break-keep">📖 동화책별 인기</CardTitle>
      </CardHeader>
      <CardContent>
        {books.length === 0 ? (
          <p className="text-sm text-muted-foreground break-keep">
            아직 동화책 조회 데이터가 없어요
          </p>
        ) : (
          <div className="space-y-2">
            {books.map((b, i) => {
              const entry = lookup?.get(b.bookId);
              const title = entry?.title || cleanTitle(b.title) || `동화책 ${b.bookId}`;
              const cover = entry?.coverImage;
              return (
                <a
                  key={b.bookId}
                  href={bookHref(b.bookId)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted/50 transition-colors"
                >
                  <span className="w-5 text-right text-sm font-bold tabular-nums text-muted-foreground flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="h-12 w-9 flex-shrink-0 overflow-hidden rounded bg-muted">
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium break-keep">{title}</div>
                    <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                      <span className="break-keep">
                        조회{' '}
                        <span className="font-semibold text-foreground">
                          {b.views.toLocaleString()}
                        </span>
                      </span>
                      <span className="break-keep">체류 {formatDuration(b.avgDuration)}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {others.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <div className="mb-2 text-xs font-semibold text-muted-foreground break-keep">
              기타 페이지
            </div>
            <div className="space-y-1">
              {others.map((o, i) => (
                <div key={`${o.path}-${i}`} className="flex items-center gap-3 text-xs">
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {cleanTitle(o.title) || o.path}
                    <span className="ml-1 text-muted-foreground/60">{o.path}</span>
                  </span>
                  <span className="tabular-nums font-medium flex-shrink-0">
                    {o.views.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
