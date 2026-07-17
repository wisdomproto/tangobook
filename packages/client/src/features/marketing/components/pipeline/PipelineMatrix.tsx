import { useMemo, useState } from 'react';
import { seriesLabel, type PipelineRow } from '../../api/use-pipeline';

interface PipelineMatrixProps {
  rows: PipelineRow[];
}

function Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="font-medium text-green-600">✓</span>
  ) : (
    <span className="text-muted-foreground/50">–</span>
  );
}

function LongformCell({ styles }: { styles: string[] }) {
  if (styles.length === 0) return <Mark ok={false} />;
  return (
    <span
      title={styles.join(', ')}
      className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600"
    >
      ✓ {styles.length}
    </span>
  );
}

function ScheduleCell({
  state,
}: {
  state: PipelineRow['marketing']['published']['youtubeLongform'];
}) {
  if (state === 'published') return <span className="font-medium text-green-600">✓</span>;
  if (state === 'scheduled') return <span title="예약됨">🕐</span>;
  return <span className="text-muted-foreground/50">–</span>;
}

const HEADERS = [
  '책',
  '릴스 ko',
  '릴스 en',
  '롱폼 ko',
  '롱폼 en',
  '블로그',
  '카드뉴스',
  '쇼츠',
  '인스타',
  '예약',
];

/** 책 × 마케팅 자산 매트릭스 — 기본 승인책만, 「전체 보기」 토글 */
export function PipelineMatrix({ rows }: PipelineMatrixProps) {
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(() => {
    const list = showAll ? rows : rows.filter((r) => r.approved);
    // 시리즈 → 제목 순 정렬 (같은 시리즈끼리 붙어 보이게)
    return [...list].sort(
      (a, b) => a.series.localeCompare(b.series) || a.title.localeCompare(b.title, 'ko')
    );
  }, [rows, showAll]);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-foreground">
          📚 자산 매트릭스
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {visible.length}권{showAll ? ' (전체)' : ' (승인만)'}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          {showAll ? '승인책만 보기' : '전체 보기'}
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground break-keep">
          {showAll ? '표시할 책이 없습니다.' : '승인된 책이 없습니다 — 「전체 보기」로 확인하세요.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {HEADERS.map((h, i) => (
                  <th key={h} className={`px-3 py-2 font-medium ${i === 0 ? '' : 'text-center'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.bookId} className="border-b border-border/50 last:border-b-0">
                  <td className="max-w-[280px] px-3 py-2">
                    <div className="truncate font-medium text-foreground" title={row.title}>
                      {row.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {seriesLabel(row.series)}
                      {!row.approved && showAll && <span className="ml-1.5">· 미승인</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Mark ok={!!row.marketing.reels.ko} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Mark ok={!!row.marketing.reels.en} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <LongformCell styles={row.marketing.longform.ko ?? []} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <LongformCell styles={row.marketing.longform.en ?? []} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Mark ok={row.marketing.blog} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Mark ok={row.marketing.cardnews} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Mark ok={row.marketing.published.youtubeShorts} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Mark ok={row.marketing.published.instagram} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <ScheduleCell state={row.marketing.published.youtubeLongform} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
