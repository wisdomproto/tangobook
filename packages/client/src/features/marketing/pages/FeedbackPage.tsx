import { useFeedback } from '../api/use-feedback';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * /marketing/feedback — 사용자 건의 열람 (읽기 전용, 최신순).
 * 여러 사용자가 앱에서 남긴 건의를 서버 service-role 프록시로 전체 조회.
 */
export function FeedbackPage() {
  const { data: items = [], isLoading, isError } = useFeedback();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">💬 건의함</h1>
          <p className="mt-1 text-sm text-muted-foreground break-keep">
            사용자가 앱에서 남긴 건의 {items.length > 0 && `· 총 ${items.length}건`}
          </p>
        </header>

        {isLoading && (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            불러오는 중…
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive break-keep">
            건의를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            <span className="text-3xl" aria-hidden>
              📭
            </span>
            <p className="text-sm">아직 접수된 건의가 없습니다.</p>
          </div>
        )}

        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="whitespace-pre-wrap break-keep text-sm text-foreground">
                {item.message}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{formatDate(item.createdAt)}</span>
                {item.contact && (
                  <>
                    <span aria-hidden>·</span>
                    <a
                      href={`mailto:${item.contact}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {item.contact}
                    </a>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
