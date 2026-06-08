/**
 * PublishQueue — list + calendar view of mkt_publish_records.
 *
 * Faithful port of ContentFlow publish-queue.tsx (469 lines).
 * Key adaptations vs. CF original:
 *   • Props `{ projectId }` instead of reading useProjectStore.selectedProjectId
 *   • Data via usePublishRecords (TanStack Query, Chunk 6) — no local useState fetch
 *   • Reschedule via useUpdateScheduledAt.mutate (Chunk 6) — not direct supabase.update
 *   • Delete via useCancelPublish.mutate (Chunk 6)
 *   • Calendar view delegates to <PublishCalendar> (no inline date math)
 *   • Quick-pick times via makeTime + pickBestTimes (publish-times.ts, Chunk 6)
 *   • Preview fetches use `mkt_blog_contents`/`mkt_blog_cards`/`mkt_instagram_contents`/
 *     `mkt_instagram_cards`/`mkt_threads_contents`/`mkt_threads_cards` table names
 *   • handlePublishNow is a faithful no-op alert (CF :138) — non-negotiable
 *   • title read from record.metadata?.title (JSONB, spec §8 delta)
 *   • No 'use client', no @/components/ui/*, plain <img>
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
import { supabase } from '../../api/supabase';
import { makeTime, pickBestTimes } from '../../lib/publish-times';
import { PublishCalendar } from './PublishCalendar';
import { BlogPreviewDialog } from '../content/BlogPreviewDialog';
import type { PublishRecord, BlogCard, InstagramCard, ThreadsCard } from '../../types/database';

// ─── Constants (verbatim from CF) ────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-yellow-500/10 text-yellow-500',
  publishing: 'bg-blue-500/10 text-blue-500',
  published: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
};

const STATUS_LABELS: Record<string, string> = {
  draft: '임시',
  scheduled: '예약',
  publishing: '발행중',
  published: '발행됨',
  failed: '실패',
};

const CHANNEL_FILTERS = [
  { id: 'all', label: '전체', icon: '📋' },
  { id: 'self_hosted', label: 'Self', icon: '🌐' },
  { id: 'naver_blog', label: 'N', icon: '📗' },
  { id: 'instagram', label: 'IG', icon: '📸' },
  { id: 'facebook', label: 'FB', icon: '👤' },
  { id: 'threads', label: 'TH', icon: '💬' },
  { id: 'youtube', label: 'YT', icon: '🎬' },
];

const LANG_FLAGS: Record<string, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  th: '🇹🇭',
  vi: '🇻🇳',
  ja: '🇯🇵',
  zh: '🇨🇳',
};

const STATUS_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'scheduled', label: '예약' },
  { value: 'published', label: '발행됨' },
  { value: 'failed', label: '실패' },
];

// ─── Channel icon helper ──────────────────────────────────────────────────────

function channelBg(channel: string): string {
  switch (channel) {
    case 'self_hosted':
      return 'bg-violet-600';
    case 'naver_blog':
      return 'bg-[#03c75a]';
    case 'instagram':
      return 'bg-gradient-to-br from-[#f09433] to-[#dc2743]';
    case 'facebook':
      return 'bg-[#1877f2]';
    case 'youtube':
      return 'bg-[#ff0000]';
    case 'threads':
      return 'bg-foreground';
    default:
      return 'bg-muted-foreground';
  }
}

function channelLabel(channel: string): string {
  switch (channel) {
    case 'self_hosted':
      return 'S';
    case 'naver_blog':
      return 'N';
    case 'instagram':
      return 'IG';
    case 'facebook':
      return 'FB';
    case 'youtube':
      return 'YT';
    case 'threads':
      return 'T';
    default:
      return channel.slice(0, 2).toUpperCase();
  }
}

// ─── Preview state ────────────────────────────────────────────────────────────

type PreviewState =
  | { channel: 'naver_blog' | 'self_hosted'; record: PublishRecord; cards: BlogCard[] }
  | { channel: 'instagram' | 'facebook'; record: PublishRecord; cards: InstagramCard[] }
  | { channel: 'threads'; record: PublishRecord; cards: ThreadsCard[] }
  | null;

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
}

export function PublishQueue({ projectId }: Props) {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('all');

  // Publish-now animation (visual only — button is a no-op)
  const [publishingId] = useState<string | null>(null);

  // Preview dialog state
  const [preview, setPreview] = useState<PreviewState>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data: records = [], isLoading } = usePublishRecords(projectId);
  const updateScheduledAt = useUpdateScheduledAt();
  const cancelPublish = useCancelPublish();

  // ── Filter ────────────────────────────────────────────────────────────────

  const filteredRecords = records.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (channelFilter !== 'all' && r.channel !== channelFilter) return false;
    if (langFilter !== 'all' && r.language !== langFilter) return false;
    return true;
  });

  // Languages appearing in this project's records (for the language filter dropdown)
  const recordLanguages = [...new Set(records.map((r) => r.language))].filter(Boolean);

  // ── Handlers ─────────────────────────────────────────────────────────────

  /** Faithful no-op — CF :138. Non-negotiable. */
  const handlePublishNow = async (_record: PublishRecord) => {
    alert('직접 발행은 현재 지원하지 않습니다. 내부 블로그 API를 통해 자동 발행됩니다.');
  };

  const handleSchedule = (id: string, localStr: string | null) => {
    if (!localStr) return;
    updateScheduledAt.mutate({
      id,
      projectId,
      scheduledAt: new Date(localStr).toISOString(),
    });
  };

  const handleDelete = (recordId: string) => {
    cancelPublish.mutate({ recordId, projectId });
  };

  // ── On-demand preview fetch ───────────────────────────────────────────────

  const openPreview = async (record: PublishRecord) => {
    setPreviewLoading(true);
    try {
      const ch = record.channel;

      if (ch === 'self_hosted' || ch === 'naver_blog') {
        // Fetch the blog content row for this content_id, then its cards
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
        // metadata.igContentId holds the mkt_instagram_contents.id
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
        // metadata.threadsContentId holds the mkt_threads_contents.id
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

  // ── Scheduled row helpers ─────────────────────────────────────────────────

  function toDatetimeLocal(isoStr: string | null): string {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header: View toggle + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View toggle */}
        <div className="flex bg-muted rounded-md overflow-hidden">
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

        {/* Channel filter */}
        <div className="flex gap-1 flex-wrap">
          {CHANNEL_FILTERS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setChannelFilter(ch.id)}
              className={cn(
                'px-2 py-1 rounded text-[10px]',
                channelFilter === ch.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {ch.icon} {ch.label}
            </button>
          ))}
        </div>

        {/* Language filter */}
        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="bg-muted text-xs rounded-md px-2 py-1.5 border border-border"
        >
          <option value="all">🌐 전체</option>
          {recordLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {LANG_FLAGS[lang] ?? '🌐'} {lang.toUpperCase()}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <div className="flex gap-1 ml-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-2 py-1 rounded text-[10px]',
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" /> 로딩중...
        </div>
      ) : view === 'list' ? (
        /* List View */
        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              발행 기록이 없습니다
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className="bg-card border border-border rounded-lg p-3 flex items-center gap-3"
              >
                {/* Channel icon */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0',
                    channelBg(record.channel)
                  )}
                >
                  {channelLabel(record.channel)}
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm truncate">
                      {(record.metadata?.title as string | undefined) ?? 'Untitled'}
                    </span>
                    <button
                      onClick={() => void openPreview(record)}
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      title="미리보기"
                      disabled={previewLoading}
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {LANG_FLAGS[record.language] ?? '🌐'} {record.language?.toUpperCase()}
                    {record.published_at && (
                      <span className="ml-2">
                        ·{' '}
                        {new Date(record.published_at).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        발행
                      </span>
                    )}
                    {record.scheduled_at && record.status === 'scheduled' && (
                      <span className="ml-2 text-yellow-500">
                        ·{' '}
                        {new Date(record.scheduled_at).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        예약
                      </span>
                    )}
                    {record.published_url && (
                      <a
                        href={record.published_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-primary hover:underline"
                      >
                        보기 →
                      </a>
                    )}
                  </div>
                </div>

                {/* Status pill */}
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs shrink-0',
                    STATUS_COLORS[record.status] ?? 'bg-muted text-muted-foreground'
                  )}
                >
                  {STATUS_LABELS[record.status] ?? record.status}
                </span>

                {/* Schedule controls — only for scheduled rows */}
                {record.status === 'scheduled' &&
                  (() => {
                    const lang = record.language ?? 'ko';
                    const times = pickBestTimes(lang);
                    const bestTimeText = times[record.channel];

                    const quickPicks = [
                      { label: '오늘 저녁 7시', time: makeTime(0, 19) },
                      { label: '내일 오전 8시', time: makeTime(1, 8) },
                      { label: '내일 저녁 7시', time: makeTime(1, 19) },
                      { label: '모레 오전 9시', time: makeTime(2, 9) },
                    ];

                    return (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* datetime-local picker */}
                        <div className="relative">
                          <Clock
                            size={12}
                            className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                          />
                          <input
                            type="datetime-local"
                            value={toDatetimeLocal(record.scheduled_at)}
                            onChange={(e) => handleSchedule(record.id, e.target.value || null)}
                            className="h-7 pl-6 pr-1 text-[10px] bg-muted border border-border rounded w-36"
                          />
                        </div>

                        {/* Quick-pick dropdown */}
                        <div className="relative group/quick">
                          <button className="h-7 px-1.5 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors text-[10px] gap-0.5">
                            <Clock size={10} /> ▼
                          </button>
                          <div className="absolute top-full right-0 mt-1 w-52 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg hidden group-hover/quick:block z-50">
                            <div className="p-2 space-y-0.5">
                              <div className="text-[9px] text-muted-foreground font-semibold mb-1">
                                ⚡ 빠른 예약
                              </div>
                              {quickPicks.map((qp) => (
                                <button
                                  key={qp.label}
                                  onClick={() =>
                                    updateScheduledAt.mutate({
                                      id: record.id,
                                      projectId,
                                      scheduledAt: qp.time,
                                    })
                                  }
                                  className="w-full text-left px-2 py-1 rounded text-[10px] hover:bg-accent transition-colors"
                                >
                                  {qp.label}
                                </button>
                              ))}
                            </div>
                            {bestTimeText && (
                              <div className="border-t border-border px-2 py-1.5 text-[9px]">
                                <span className="text-muted-foreground">📊 추천:</span>{' '}
                                <span className="text-primary">{bestTimeText}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 즉시 발행 — faithful no-op */}
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                          disabled={publishingId === record.id}
                          onClick={() => void handlePublishNow(record)}
                        >
                          {publishingId === record.id ? (
                            <>
                              <Loader2 size={10} className="animate-spin" /> 발행 중
                            </>
                          ) : (
                            <>
                              <Rocket size={10} /> 즉시 발행
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })()}

                {/* Delete button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(record.id)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Calendar View */
        <PublishCalendar records={filteredRecords} onSelectRecord={(r) => void openPreview(r)} />
      )}

      {/* ── Preview Dialogs ─────────────────────────────────────────────────── */}

      {/* naver_blog / self_hosted → BlogPreviewDialog */}
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

      {/* instagram / facebook → card background images */}
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

      {/* threads → post bodies */}
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
