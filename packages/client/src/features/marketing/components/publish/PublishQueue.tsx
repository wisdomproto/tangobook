/**
 * PublishQueue — 발행 큐. dflo(v4 PublishQueuePage/Board/Card)의 "언어별 + 채널별" 구성 이식.
 *
 *   • 상단: 언어 pills(전체 + 레코드 언어) — 전체 보드를 언어로 필터
 *   • 리스트 뷰 = 채널 컬럼 보드: 채널마다 컬럼(헤더=배지+개수+컬럼별 상태 필터), 컬럼 안 카드
 *   • 카드: 언어 배지 + 콘텐츠 종류(블로그/카드뉴스/릴스/기본글) + 상태색 + 예약 + 즉시 발행 + 삭제 + 미리보기
 *   • 즉시 발행: 메타(IG/FB/Threads)는 실제 발행(runPublish). self_hosted/naver/youtube 는 안내.
 *   • 캘린더 뷰 + 채널별 미리보기 다이얼로그는 기존 유지.
 */

import { useState } from 'react';
import { CalendarDays, Clock, Eye, List, Loader2, Rocket, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import {
  usePublishRecords,
  useUpdateScheduledAt,
  useCancelPublish,
} from '../../api/use-publish-records';
import { runPublish } from '../../api/use-meta-connection';
import { supabase } from '../../api/supabase';
import { makeTime, pickBestTimes } from '../../lib/publish-times';
import { PublishCalendar } from './PublishCalendar';
import { BlogPreviewDialog } from '../content/BlogPreviewDialog';
import type { PublishRecord, BlogCard, InstagramCard, ThreadsCard } from '../../types/database';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: '임시',
  scheduled: '예약',
  publishing: '발행중',
  published: '발행됨',
  failed: '실패',
};

// 발행 전/후가 한눈에 — 카드 배경 + 좌측 액센트바를 상태별로 (dflo STATUS_CARD).
const STATUS_CARD: Record<string, string> = {
  draft: 'border-border border-l-4 border-l-muted-foreground/40 bg-card',
  scheduled: 'border-yellow-500/30 border-l-4 border-l-yellow-500 bg-yellow-500/5',
  publishing: 'border-blue-500/30 border-l-4 border-l-blue-500 bg-blue-500/5',
  published: 'border-green-500/40 border-l-4 border-l-green-500 bg-green-500/5',
  failed: 'border-red-500/40 border-l-4 border-l-red-500 bg-red-500/5',
};

const STATUS_PILL: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-yellow-500/10 text-yellow-500',
  publishing: 'bg-blue-500/10 text-blue-500',
  published: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
};

const STATUS_FILTERS = ['draft', 'scheduled', 'publishing', 'published', 'failed'];

// 채널 컬럼 순서 + 라벨/배지.
const CHANNEL_COLS: Array<{ id: string; label: string; badge: string }> = [
  { id: 'self_hosted', label: '자체 사이트', badge: 'bg-violet-500/15 text-violet-500' },
  { id: 'naver_blog', label: '네이버', badge: 'bg-[#03c75a]/15 text-[#03c75a]' },
  { id: 'instagram', label: 'Instagram', badge: 'bg-pink-500/15 text-pink-500' },
  { id: 'facebook', label: 'Facebook', badge: 'bg-blue-500/15 text-blue-500' },
  { id: 'threads', label: 'Threads', badge: 'bg-foreground/10 text-foreground' },
  { id: 'youtube', label: 'YouTube', badge: 'bg-red-500/15 text-red-500' },
];

const KIND_META: Record<string, { label: string; cls: string }> = {
  blog: { label: '📝 블로그', cls: 'bg-sky-500/10 text-sky-500' },
  cardnews: { label: '🖼 카드뉴스', cls: 'bg-violet-500/10 text-violet-500' },
  reels: { label: '🎬 릴스', cls: 'bg-rose-500/10 text-rose-500' },
  post: { label: '📄 기본글', cls: 'bg-muted text-muted-foreground' },
};

const LANG_FLAGS: Record<string, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  th: '🇹🇭',
  vi: '🇻🇳',
  ja: '🇯🇵',
  zh: '🇨🇳',
};

// dflo LOCALES 패턴(ChannelRegistryTab) — 발행 페이지는 "국가(시장)별"로 본다.
// 국가 섹션(국기+국가명+건수) → 그 안에 채널 컬럼.
const LOCALES: Array<{ code: string; label: string; flag: string }> = [
  { code: 'ko', label: '한국', flag: '🇰🇷' },
  { code: 'en', label: '미국', flag: '🇺🇸' },
  { code: 'zh', label: '중국', flag: '🇨🇳' },
  { code: 'th', label: '태국', flag: '🇹🇭' },
  { code: 'vi', label: '베트남', flag: '🇻🇳' },
  { code: 'ja', label: '일본', flag: '🇯🇵' },
];

const META_CHANNELS = ['instagram', 'facebook', 'threads'];

function kindOf(record: PublishRecord): keyof typeof KIND_META {
  const k = record.metadata?.content_kind as string | undefined;
  if (k && k in KIND_META) return k as keyof typeof KIND_META;
  if (record.channel === 'self_hosted' || record.channel === 'naver_blog') return 'blog';
  return 'post';
}

const QUICK_PICKS = [
  { label: '오늘 저녁 7시', at: () => makeTime(0, 19) },
  { label: '내일 오전 8시', at: () => makeTime(1, 8) },
  { label: '내일 저녁 7시', at: () => makeTime(1, 19) },
  { label: '모레 오전 9시', at: () => makeTime(2, 9) },
];

// ─── Preview state ────────────────────────────────────────────────────────────

type PreviewState =
  | { channel: 'naver_blog' | 'self_hosted'; record: PublishRecord; cards: BlogCard[] }
  | { channel: 'instagram' | 'facebook'; record: PublishRecord; cards: InstagramCard[] }
  | { channel: 'threads'; record: PublishRecord; cards: ThreadsCard[] }
  | null;

interface Props {
  projectId: string;
}

export function PublishQueue({ projectId }: Props) {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [langFilter, setLangFilter] = useState('all');
  const [statusByCol, setStatusByCol] = useState<Record<string, string>>({});
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data: records = [], isLoading, refetch } = usePublishRecords(projectId);
  const updateScheduledAt = useUpdateScheduledAt();
  const cancelPublish = useCancelPublish();

  // 언어 필터만 상단에서 — 채널은 컬럼, 상태는 컬럼별 필터.
  const langRecords = records.filter((r) => langFilter === 'all' || r.language === langFilter);

  // 국가 pill = 레코드에 있는 국가(언어무관 순서 고정). 국가 섹션 = 언어필터 적용 후 존재하는 국가.
  const presentLangs = new Set(records.map((r) => r.language));
  const countryPills = LOCALES.filter((l) => presentLangs.has(l.code));
  const activeLocales = LOCALES.filter((l) => langRecords.some((r) => r.language === l.code));

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSchedule = (id: string, localStr: string | null) => {
    if (!localStr) return;
    updateScheduledAt.mutate({ id, projectId, scheduledAt: new Date(localStr).toISOString() });
  };
  const handleDelete = (recordId: string) => cancelPublish.mutate({ recordId, projectId });

  /** 즉시 발행 — 메타 채널은 실제 발행(runPublish), 그 외는 안내. */
  const handlePublishNow = async (record: PublishRecord) => {
    if (!META_CHANNELS.includes(record.channel)) {
      if (record.channel === 'self_hosted') alert('자체 사이트는 예약 시각에 자동 발행됩니다.');
      else if (record.channel === 'youtube') alert('YouTube 자동 발행은 아직 지원하지 않습니다.');
      else alert('이 채널은 자동 발행을 지원하지 않습니다(수동 발행).');
      return;
    }
    if (
      record.status === 'published' &&
      !window.confirm('이미 발행된 항목입니다. 다시 발행하면 중복 게시됩니다. 계속할까요?')
    )
      return;
    setPublishingId(record.id);
    try {
      await runPublish(record.id);
      await refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : '발행 실패');
    } finally {
      setPublishingId(null);
    }
  };

  // ── Preview fetch (기존 유지) ──────────────────────────────────────────────

  const openPreview = async (record: PublishRecord) => {
    setPreviewLoading(true);
    try {
      const ch = record.channel;
      if (ch === 'self_hosted' || ch === 'naver_blog') {
        const { data: blogContents } = await supabase
          .from('mkt_blog_contents')
          .select('id, seo_title')
          .eq('content_id', record.content_id);
        let cards: BlogCard[] = [];
        if (blogContents && blogContents.length > 0) {
          const { data: rawCards } = await supabase
            .from('mkt_blog_cards')
            .select('*')
            .eq('blog_content_id', blogContents[0].id)
            .order('sort_order');
          cards = (rawCards ?? []) as BlogCard[];
        }
        setPreview({ channel: ch, record, cards });
      } else if (ch === 'instagram' || ch === 'facebook') {
        const igContentId = record.metadata?.igContentId as string | undefined;
        let cards: InstagramCard[] = [];
        if (igContentId) {
          const { data: rawCards } = await supabase
            .from('mkt_instagram_cards')
            .select('*')
            .eq('instagram_content_id', igContentId)
            .order('sort_order');
          cards = (rawCards ?? []) as InstagramCard[];
        }
        setPreview({ channel: ch, record, cards });
      } else if (ch === 'threads') {
        const tcId = record.metadata?.threadsContentId as string | undefined;
        let cards: ThreadsCard[] = [];
        if (tcId) {
          const { data: rawCards } = await supabase
            .from('mkt_threads_cards')
            .select('*')
            .eq('threads_content_id', tcId)
            .order('sort_order');
          cards = (rawCards ?? []) as ThreadsCard[];
        }
        setPreview({ channel: ch, record, cards });
      }
    } finally {
      setPreviewLoading(false);
    }
  };
  const closePreview = () => setPreview(null);

  function toDatetimeLocal(isoStr: string | null): string {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  // ── Single card ────────────────────────────────────────────────────────────

  function renderCard(record: PublishRecord) {
    const kind = KIND_META[kindOf(record)];
    const pushing = publishingId === record.id;
    const bestTime = pickBestTimes(record.language ?? 'ko')[record.channel];
    return (
      <div key={record.id} className={cn('rounded-xl border p-3', STATUS_CARD[record.status])}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
            {LANG_FLAGS[record.language] ?? '🌐'} {record.language?.toUpperCase()}
          </span>
          <span className={cn('rounded px-1.5 py-0.5 text-xs font-semibold', kind.cls)}>
            {kind.label}
          </span>
          <span
            className={cn(
              'ml-auto rounded-full px-2 py-0.5 text-xs',
              STATUS_PILL[record.status] ?? 'bg-muted text-muted-foreground'
            )}
          >
            {STATUS_LABELS[record.status] ?? record.status}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-sm font-medium truncate break-keep">
            {(record.metadata?.title as string | undefined) ?? 'Untitled'}
          </span>
          <button
            onClick={() => void openPreview(record)}
            disabled={previewLoading}
            className="shrink-0 text-muted-foreground hover:text-primary"
            title="미리보기"
          >
            <Eye size={13} />
          </button>
        </div>

        {/* 예약 영역 — 발행 전(published 아님)만 */}
        {record.status !== 'published' && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <div className="relative">
              <Clock
                size={12}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="datetime-local"
                value={toDatetimeLocal(record.scheduled_at)}
                onChange={(e) => handleSchedule(record.id, e.target.value || null)}
                className="h-7 pl-6 pr-1 text-[10px] bg-muted border border-border rounded"
              />
            </div>
            {QUICK_PICKS.map((qp) => (
              <button
                key={qp.label}
                onClick={() =>
                  updateScheduledAt.mutate({ id: record.id, projectId, scheduledAt: qp.at() })
                }
                className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent"
              >
                {qp.label}
              </button>
            ))}
            {bestTime && <span className="text-[10px] text-muted-foreground">💡 {bestTime}</span>}
          </div>
        )}

        {/* published 행: 보기 링크 + 발행일 */}
        {record.status === 'published' && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            {record.published_url && (
              <a
                href={record.published_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:opacity-80"
              >
                보기 ↗
              </a>
            )}
            {record.published_at && (
              <span className="text-muted-foreground">{record.published_at.slice(0, 10)}</span>
            )}
          </div>
        )}

        {/* 액션 행 */}
        <div className="mt-2 flex items-center gap-2">
          {record.status !== 'published' && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
              disabled={pushing}
              onClick={() => void handlePublishNow(record)}
            >
              {pushing ? (
                <>
                  <Loader2 size={10} className="animate-spin" /> 발행 중
                </>
              ) : (
                <>
                  <Rocket size={10} /> 즉시 발행
                </>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => handleDelete(record.id)}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
    );
  }

  // 채널 컬럼 1개 (국가 섹션 안에서 sourceRecords 로 스코프).
  function renderColumn(col: (typeof CHANNEL_COLS)[number], sourceRecords: PublishRecord[]) {
    const colStatus = statusByCol[col.id] ?? 'all';
    const colItems = sourceRecords
      .filter((r) => r.channel === col.id && (colStatus === 'all' || r.status === colStatus))
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return (
      <div
        key={col.id}
        className="flex min-w-[240px] flex-1 flex-col rounded-xl border border-border bg-muted/30"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
          <span className={cn('rounded px-2 py-0.5 text-xs font-semibold', col.badge)}>
            {col.label}
          </span>
          <span className="text-xs text-muted-foreground">{colItems.length}</span>
          <select
            value={colStatus}
            onChange={(e) => setStatusByCol((p) => ({ ...p, [col.id]: e.target.value }))}
            className="ml-auto rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
          >
            <option value="all">전체</option>
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2 max-h-[55vh]">
          {colItems.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground/50">없음</p>
          ) : (
            colItems.map(renderCard)
          )}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* 국가 pills + 뷰 토글 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">국가</span>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setLangFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs',
              langFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            🌐 전체
          </button>
          {countryPills.map((l) => (
            <button
              key={l.code}
              onClick={() => setLangFilter(l.code)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs',
                langFilter === l.code
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex bg-muted rounded-md overflow-hidden">
          <button
            onClick={() => setView('list')}
            className={cn(
              'px-3 py-1.5 text-xs flex items-center gap-1',
              view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            )}
          >
            <List size={12} /> 리스트
          </button>
          <button
            onClick={() => setView('calendar')}
            className={cn(
              'px-3 py-1.5 text-xs flex items-center gap-1',
              view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            )}
          >
            <CalendarDays size={12} /> 캘린더
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" /> 로딩중...
        </div>
      ) : view === 'calendar' ? (
        <PublishCalendar records={langRecords} onSelectRecord={(r) => void openPreview(r)} />
      ) : activeLocales.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">발행 기록이 없습니다</div>
      ) : (
        /* 국가별 섹션 → 채널 컬럼 (dflo ChannelRegistryTab 패턴) */
        <div className="space-y-5">
          {activeLocales.map((locale) => {
            const localeRecords = langRecords.filter((r) => r.language === locale.code);
            const cols = CHANNEL_COLS.filter((c) => localeRecords.some((r) => r.channel === c.id));
            return (
              <section key={locale.code}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-base leading-none">{locale.flag}</span>
                  <span className="text-sm font-bold break-keep">{locale.label}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {localeRecords.length}건
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {cols.map((col) => renderColumn(col, localeRecords))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ── Preview Dialogs (기존 유지) ─────────────────────────────────────── */}
      {preview && (preview.channel === 'naver_blog' || preview.channel === 'self_hosted') && (
        <BlogPreviewDialog
          open={!!preview}
          onOpenChange={(open) => {
            if (!open) closePreview();
          }}
          cards={preview.cards as BlogCard[]}
          title={(preview.record.metadata?.title as string | undefined) ?? ''}
        />
      )}

      {preview && (preview.channel === 'instagram' || preview.channel === 'facebook') && (
        <Dialog
          open={!!preview}
          onOpenChange={(open) => {
            if (!open) closePreview();
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>카드뉴스 미리보기</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {(preview.cards as InstagramCard[]).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  카드 데이터가 없습니다
                </p>
              ) : (
                (preview.cards as InstagramCard[]).map((card, i) => {
                  const ts = card.text_style as Record<string, unknown> | null;
                  const blocks =
                    ts && Array.isArray(ts.textBlocks)
                      ? (ts.textBlocks as Array<{ id: string; text: string; hidden?: boolean }>)
                      : [];
                  const visibleTexts = blocks.filter((b) => b.text?.trim() && !b.hidden);
                  return (
                    <div
                      key={card.id}
                      className="rounded-lg border overflow-hidden"
                      style={{ backgroundColor: (ts?.bgColor as string) || '#fff' }}
                    >
                      {card.background_image_url && (
                        <img src={card.background_image_url} alt="" className="w-full" />
                      )}
                      {visibleTexts.length > 0 && (
                        <div className="p-3 space-y-1">
                          {visibleTexts.map((b) => (
                            <p
                              key={b.id}
                              className="text-sm"
                              style={{
                                color:
                                  (ts?.bgColor as string)?.startsWith('#f') ||
                                  (ts?.bgColor as string) === '#ffffff'
                                    ? '#222'
                                    : '#eee',
                              }}
                            >
                              {b.text}
                            </p>
                          ))}
                        </div>
                      )}
                      <div className="px-3 pb-2 text-[10px] text-muted-foreground">
                        카드 {i + 1}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {preview && preview.channel === 'threads' && (
        <Dialog
          open={!!preview}
          onOpenChange={(open) => {
            if (!open) closePreview();
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>스레드 미리보기</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {(preview.cards as ThreadsCard[]).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  스레드 데이터가 없습니다
                </p>
              ) : (
                (preview.cards as ThreadsCard[]).map((card, i) => (
                  <div key={card.id} className="border-l-2 border-foreground/20 pl-3 py-1">
                    <p className="text-sm whitespace-pre-line">{card.text_content ?? ''}</p>
                    <div className="text-[10px] text-muted-foreground mt-1">스레드 {i + 1}</div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
