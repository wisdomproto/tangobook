// 콘텐츠 자산/배포 현황 매트릭스 — 콘텐츠(행) × [블로그/카드뉴스/릴스] × 언어. dflo ContentStatusPanel 이식.
//  - 자산: 텍스트·이미지 준비 상태(셀 1점). 배포: 발행 큐를 채널별 점으로.
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Content } from '../../types/database';
import {
  fetchContentStatus,
  fetchPublishStatus,
  STATUS_LANGS,
  LANG_FLAG,
  CHANNELS_BY_KIND,
  CHAN_COLOR,
  CHAN_LABEL,
  PUB_RANK_EXPORT,
  type ContentStatus,
  type Readiness,
  type PublishReadiness,
} from '../../lib/content-status';

const TYPES = [
  { key: 'blog', label: '블로그', sub: '본문+이미지' },
  { key: 'cardnews', label: '카드뉴스', sub: '텍스트+이미지' },
  { key: 'reels', label: '릴스', sub: '영상+커버' },
] as const;
type Kind = (typeof TYPES)[number]['key'];

const ASSET_DOT: Record<Readiness, string> = {
  complete: 'bg-emerald-500',
  partial: 'bg-amber-400',
  none: 'bg-muted',
};
const PUB_LABEL: Record<PublishReadiness, string> = {
  published: '발행됨',
  scheduled: '예약됨',
  queued: '큐 등록(미발행)',
  failed: '실패',
  none: '미등록',
};

function chanDotStyle(channel: string, st: PublishReadiness): CSSProperties {
  if (st === 'none') return { backgroundColor: '#9ca3af55' };
  if (st === 'failed') return { backgroundColor: '#ef4444' };
  const color = CHAN_COLOR[channel] ?? '#9ca3af';
  if (st === 'published') return { backgroundColor: color };
  if (st === 'scheduled') return { backgroundColor: color, opacity: 0.55 };
  return { backgroundColor: 'transparent', border: `2px solid ${color}` }; // queued
}

interface Props {
  contents: Content[];
  projectId: string;
  onClose: () => void;
}

export function ContentStatusPanel({ contents, projectId, onClose }: Props) {
  const [rows, setRows] = useState<ContentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'asset' | 'publish'>('asset');
  const [pub, setPub] = useState<Map<string, PublishReadiness> | null>(null);
  const [pubLoading, setPubLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchContentStatus(contents)
      .then((r) => {
        if (alive) {
          setRows(r);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [contents]);

  const showPublish = () => {
    setMode('publish');
    if (!pub && !pubLoading) {
      setPubLoading(true);
      fetchPublishStatus(projectId)
        .then((m) => setPub(m))
        .finally(() => setPubLoading(false));
    }
  };

  const pubAt = (contentId: string, kind: Kind, lang: string, ch: string): PublishReadiness =>
    pub?.get(`${contentId}|${kind}|${lang}|${ch}`) ?? 'none';

  const summary = useMemo(() => {
    const s: Record<string, { done: number; mid: number; none: number }> = {};
    for (const t of TYPES) s[t.key] = { done: 0, mid: 0, none: 0 };
    for (const r of rows)
      for (const t of TYPES)
        for (const lang of STATUS_LANGS) {
          if (mode === 'asset') {
            const st = r[t.key][lang].status;
            if (st === 'complete') s[t.key].done++;
            else if (st === 'partial') s[t.key].mid++;
            else s[t.key].none++;
          } else {
            let best: PublishReadiness = 'none';
            for (const ch of CHANNELS_BY_KIND[t.key]) {
              const st = pubAt(r.contentId, t.key, lang, ch);
              if (PUB_RANK_EXPORT[st] > PUB_RANK_EXPORT[best]) best = st;
            }
            if (best === 'published') s[t.key].done++;
            else if (best === 'none') s[t.key].none++;
            else s[t.key].mid++;
          }
        }
    return s;
  }, [rows, pub, mode]);

  const total = rows.length * STATUS_LANGS.length;
  const swatch = (style: CSSProperties) => (
    <span className="inline-block h-3 w-3 rounded-[3px]" style={style} />
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl bg-card shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="shrink-0 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">📊 콘텐츠 현황</h2>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setMode('asset')}
                  className={cn(
                    'px-3 py-1 text-xs font-semibold rounded-md',
                    mode === 'asset'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  📦 자산
                </button>
                <button
                  type="button"
                  onClick={showPublish}
                  className={cn(
                    'px-3 py-1 text-xs font-semibold rounded-md',
                    mode === 'publish'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  🚀 배포
                </button>
              </div>
              <button
                type="button"
                aria-label="닫기"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground break-keep">
            {mode === 'asset'
              ? '콘텐츠 × 언어 × 채널(블로그·카드뉴스·릴스) — 텍스트·이미지 준비 상태'
              : '발행 큐 기준 — 셀 안 점 = 채널별 발행 여부'}
          </p>

          {/* 요약 카드 */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {TYPES.map((t) => {
              const s = summary[t.key];
              const pct = total ? Math.round((s.done / total) * 100) : 0;
              return (
                <div key={t.key} className="rounded-lg border border-border p-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold">{t.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {mode === 'asset' ? t.sub : '발행'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px]">
                    <span className="font-bold text-emerald-500">{s.done}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-bold text-amber-500">{s.mid}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-bold text-muted-foreground">{s.none}</span>
                    <span className="ml-auto font-bold text-primary">{pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          {mode === 'asset' ? (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className={cn('inline-block h-3 w-3 rounded-sm', ASSET_DOT.complete)} /> 완료
              </span>
              <span className="flex items-center gap-1">
                <span className={cn('inline-block h-3 w-3 rounded-sm', ASSET_DOT.partial)} /> 일부
              </span>
              <span className="flex items-center gap-1">
                <span className={cn('inline-block h-3 w-3 rounded-sm', ASSET_DOT.none)} /> 없음
              </span>
              <span>· 칸에 마우스 올리면 상세</span>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span>상태:</span>
              <span className="flex items-center gap-1">
                {swatch(chanDotStyle('instagram', 'published'))} 발행
              </span>
              <span className="flex items-center gap-1">
                {swatch(chanDotStyle('instagram', 'scheduled'))} 예약
              </span>
              <span className="flex items-center gap-1">
                {swatch(chanDotStyle('instagram', 'queued'))} 큐(미발행)
              </span>
              <span className="flex items-center gap-1">
                {swatch(chanDotStyle('x', 'failed'))} 실패
              </span>
              <span className="flex items-center gap-1">
                {swatch(chanDotStyle('x', 'none'))} 미등록
              </span>
            </div>
          )}
        </div>

        {/* 매트릭스 */}
        <div className="flex-1 overflow-auto p-2">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              집계 중…
            </div>
          ) : mode === 'publish' && pubLoading && !pub ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              발행 큐 불러오는 중…
            </div>
          ) : rows.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              콘텐츠가 없습니다.
            </div>
          ) : (
            <table className="border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-card shadow-sm">
                <tr>
                  <th
                    rowSpan={2}
                    className="px-2 py-1 text-left font-semibold text-muted-foreground"
                  >
                    #
                  </th>
                  <th
                    rowSpan={2}
                    className="px-2 py-1 text-left font-semibold text-muted-foreground"
                  >
                    콘텐츠
                  </th>
                  {TYPES.map((t) => (
                    <th
                      key={t.key}
                      colSpan={STATUS_LANGS.length}
                      className="border-l border-border px-2 py-1 text-center font-semibold"
                    >
                      {t.label}
                    </th>
                  ))}
                </tr>
                <tr>
                  {TYPES.map((t) =>
                    STATUS_LANGS.map((lang, i) => (
                      <th
                        key={t.key + lang}
                        className={cn(
                          'px-1 pb-1 text-center text-[11px] font-normal text-muted-foreground',
                          i === 0 && 'border-l border-border'
                        )}
                      >
                        {LANG_FLAG[lang]}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.contentId} className="border-t border-border hover:bg-muted/40">
                    <td className="px-2 py-1 text-right tabular-nums text-muted-foreground">
                      {r.sortOrder}
                    </td>
                    <td className="max-w-[200px] truncate px-2 py-1" title={r.title}>
                      {r.title}
                    </td>
                    {TYPES.map((t) =>
                      STATUS_LANGS.map((lang, i) => (
                        <td
                          key={t.key + lang}
                          className={cn(
                            'px-1 py-1 text-center align-middle',
                            i === 0 && 'border-l border-border'
                          )}
                        >
                          {mode === 'asset' ? (
                            <span
                              title={`${t.label} · ${LANG_FLAG[lang]} ${lang}: ${r[t.key][lang].detail}`}
                              className={cn(
                                'inline-block h-3.5 w-3.5 rounded-sm',
                                ASSET_DOT[r[t.key][lang].status]
                              )}
                            />
                          ) : (
                            <div className="flex items-center justify-center gap-[3px]">
                              {CHANNELS_BY_KIND[t.key].map((ch) => {
                                const st = pubAt(r.contentId, t.key, lang, ch);
                                return (
                                  <span
                                    key={ch}
                                    title={`${CHAN_LABEL[ch]} · ${LANG_FLAG[lang]} ${lang}: ${PUB_LABEL[st]}`}
                                    className="inline-block h-2.5 w-2.5 rounded-[3px]"
                                    style={chanDotStyle(ch, st)}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
