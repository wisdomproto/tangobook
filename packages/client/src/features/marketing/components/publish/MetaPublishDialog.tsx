// 카드뉴스 콘텐츠를 Meta(IG/FB/Threads)로 발행/예약하는 다이얼로그.
// 글로벌 연동(useMetaConnection)에서 페이지·타겟을 고르고, 지금 발행 또는 예약을 선택한다.
import { useMemo, useState } from 'react';
import { X, Loader2, Camera, Users, AtSign } from 'lucide-react';
import { Button } from '../../ui/button';
import { useMetaConnection } from '../../api/use-meta-connection';
import {
  useEnqueueMetaPublish,
  type MetaPlatform,
  type MetaPublishTarget,
} from '../../api/use-meta-publish';

interface Props {
  projectId: string;
  contentId: string;
  defaultLanguage?: string;
  onClose: () => void;
}

const PLATFORM_META: Record<MetaPlatform, { label: string; icon: typeof Camera }> = {
  instagram: { label: 'Instagram', icon: Camera },
  facebook: { label: 'Facebook', icon: Users },
  threads: { label: 'Threads', icon: AtSign },
};

export function MetaPublishDialog({
  projectId,
  contentId,
  defaultLanguage = 'ko',
  onClose,
}: Props) {
  const { data: conn, isLoading } = useMetaConnection();
  const enqueue = useEnqueueMetaPublish();

  const pages = conn?.pages ?? [];
  const [pageId, setPageId] = useState<string>('');
  const [platforms, setPlatforms] = useState<Set<MetaPlatform>>(new Set());
  const [language, setLanguage] = useState(defaultLanguage);
  const [mode, setMode] = useState<'now' | 'schedule'>('now');
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const page = useMemo(() => pages.find((p) => p.id === pageId) ?? pages[0], [pages, pageId]);

  // 선택 페이지가 지원하는 플랫폼(IG는 연결된 경우만).
  const available: MetaPlatform[] = useMemo(() => {
    if (!page) return [];
    const list: MetaPlatform[] = ['facebook', 'threads'];
    if (page.instagram) list.unshift('instagram');
    return list;
  }, [page]);

  const togglePlatform = (p: MetaPlatform) =>
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  const targetIdFor = (p: MetaPlatform): string | null => {
    if (!page) return null;
    if (p === 'instagram') return page.instagram?.id ?? null;
    if (p === 'facebook') return page.id;
    return page.threadsId ?? page.id;
  };

  const submit = async () => {
    setErr(null);
    setMsg(null);
    if (!page) {
      setErr('발행할 페이지를 선택하세요.');
      return;
    }
    if (platforms.size === 0) {
      setErr('플랫폼을 1개 이상 선택하세요.');
      return;
    }
    let scheduledAt: string | null = null;
    if (mode === 'schedule') {
      if (!scheduledLocal) {
        setErr('예약 시각을 입력하세요.');
        return;
      }
      const t = new Date(scheduledLocal);
      if (Number.isNaN(t.getTime())) {
        setErr('예약 시각이 올바르지 않습니다.');
        return;
      }
      scheduledAt = t.toISOString();
    }
    const targets: MetaPublishTarget[] = [...platforms]
      .map((p) => {
        const targetId = targetIdFor(p);
        return targetId ? { platform: p, targetId, pageName: page.name } : null;
      })
      .filter((t): t is MetaPublishTarget => t !== null);

    try {
      const r = await enqueue.mutateAsync({ projectId, contentId, language, targets, scheduledAt });
      if (mode === 'schedule') {
        setMsg(`${r.scheduled}개 예약 완료 — 예약 시각에 자동 발행됩니다.`);
      } else if (r.errors.length) {
        setErr(`${r.publishedNow}개 발행 성공, ${r.errors.length}개 실패: ${r.errors[0]}`);
      } else {
        setMsg(`${r.publishedNow}개 발행 완료.`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : '발행 실패');
    }
  };

  const busy = enqueue.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-2xl bg-card p-5 shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold break-keep">소셜 발행 — 카드뉴스</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={16} /> 연동 확인 중…
          </div>
        ) : !conn?.connected || pages.length === 0 ? (
          <div className="rounded-lg bg-muted/50 border border-border p-3 text-sm text-muted-foreground break-keep">
            Meta 계정이 연결되어 있지 않습니다. <strong>설정 → 채널 연동</strong>에서 먼저
            페이스북을 연결하세요.
          </div>
        ) : (
          <>
            {/* 페이지 선택 */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                발행 페이지
              </span>
              <select
                value={page?.id ?? ''}
                onChange={(e) => {
                  setPageId(e.target.value);
                  setPlatforms(new Set());
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.instagram ? ` · @${p.instagram.username}` : ''}
                  </option>
                ))}
              </select>
            </label>

            {/* 플랫폼 선택 */}
            <div>
              <span className="mb-1 block text-xs font-medium text-muted-foreground">플랫폼</span>
              <div className="flex flex-wrap gap-2">
                {available.map((p) => {
                  const Icon = PLATFORM_META[p].icon;
                  const on = platforms.has(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium min-h-[36px] ${
                        on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon size={14} /> {PLATFORM_META[p].label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground break-keep">
                Instagram은 카드 이미지가 1장 이상 있어야 발행됩니다.
              </p>
            </div>

            {/* 언어 */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">언어</span>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            {/* 발행 방식 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('now')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium min-h-[40px] ${
                  mode === 'now'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                지금 발행
              </button>
              <button
                type="button"
                onClick={() => setMode('schedule')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium min-h-[40px] ${
                  mode === 'schedule'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                예약 발행
              </button>
            </div>
            {mode === 'schedule' && (
              <input
                type="datetime-local"
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            )}

            <Button onClick={submit} disabled={busy} className="w-full">
              {busy ? (
                <>
                  <Loader2 className="animate-spin mr-1" size={16} /> 처리 중…
                </>
              ) : mode === 'now' ? (
                '지금 발행'
              ) : (
                '예약 등록'
              )}
            </Button>

            {msg && <p className="text-xs text-emerald-600 break-keep">{msg}</p>}
            {err && <p className="text-xs text-red-500 break-keep">{err}</p>}
          </>
        )}
      </div>
    </div>
  );
}
