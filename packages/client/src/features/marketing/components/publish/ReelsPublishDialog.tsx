// 릴스(영상)를 IG 릴스 / FB 영상 / Threads 영상 / YouTube 쇼츠로 발행하는 다이얼로그.
// 메타(글로벌 연동)의 페이지 + YouTube(오디오북 공용 채널)를 함께 고를 수 있다.
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { X, Loader2, Camera, Users, AtSign, Video } from 'lucide-react';
import { Button } from '../../ui/button';
import { useMetaConnection } from '../../api/use-meta-connection';
import { useYoutubeStatus } from '../../api/use-youtube-status';
import { useEnqueueReelsPublish, type ReelsTarget } from '../../api/use-enqueue-reels-publish';

interface Props {
  projectId: string;
  contentId: string;
  language: string;
  onClose: () => void;
}

type MetaP = 'instagram' | 'facebook' | 'threads';
const META_ROWS: Array<{ id: MetaP; label: string; icon: typeof Camera }> = [
  { id: 'instagram', label: 'Instagram 릴스', icon: Camera },
  { id: 'facebook', label: 'Facebook 영상', icon: Users },
  { id: 'threads', label: 'Threads 영상', icon: AtSign },
];

export function ReelsPublishDialog({ projectId, contentId, language, onClose }: Props) {
  const { data: conn, isLoading: connLoading } = useMetaConnection();
  const { data: yt, isLoading: ytLoading } = useYoutubeStatus();
  const enqueue = useEnqueueReelsPublish();

  const pages = conn?.pages ?? [];
  const channels = yt?.channels ?? [];

  const [pageId, setPageId] = useState('');
  const [metaSel, setMetaSel] = useState<Set<MetaP>>(new Set());
  const [ytSel, setYtSel] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'now' | 'schedule'>('now');
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [ytPrivacy, setYtPrivacy] = useState<'public' | 'unlisted'>('unlisted');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const page = useMemo(() => pages.find((p) => p.id === pageId) ?? pages[0], [pages, pageId]);
  const metaAvailable: MetaP[] = useMemo(() => {
    if (!page) return [];
    const list: MetaP[] = ['facebook', 'threads'];
    if (page.instagram) list.unshift('instagram');
    return list;
  }, [page]);

  const toggle = <T,>(set: Dispatch<SetStateAction<Set<T>>>, v: T) =>
    set((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  const metaTargetId = (p: MetaP): string | null => {
    if (!page) return null;
    if (p === 'instagram') return page.instagram?.id ?? null;
    if (p === 'facebook') return page.id;
    return page.threadsId ?? page.id;
  };

  const submit = async () => {
    setErr(null);
    setMsg(null);
    const targets: ReelsTarget[] = [];
    if (page) {
      for (const p of metaSel) {
        const targetId = metaTargetId(p);
        if (targetId) targets.push({ channel: p, targetId, name: page.name });
      }
    }
    for (const chId of ytSel) {
      const ch = channels.find((c) => c.id === chId);
      if (ch) targets.push({ channel: 'youtube', targetId: ch.id, name: ch.name });
    }
    if (targets.length === 0) {
      setErr('발행 대상을 1개 이상 선택하세요.');
      return;
    }

    let scheduledAt: string | null = null;
    if (mode === 'schedule') {
      if (!scheduledLocal) return setErr('예약 시각을 입력하세요.');
      const t = new Date(scheduledLocal);
      if (Number.isNaN(t.getTime())) return setErr('예약 시각이 올바르지 않습니다.');
      scheduledAt = t.toISOString();
    }

    try {
      const r = await enqueue.mutateAsync({
        projectId,
        contentId,
        language,
        targets,
        scheduledAt,
        privacy: ytPrivacy,
      });
      if (mode === 'schedule') setMsg(`${r.scheduled}개 예약 완료 — 예약 시각에 자동 발행됩니다.`);
      else if (r.errors.length)
        setErr(`${r.publishedNow}개 발행 성공, ${r.errors.length}개 실패: ${r.errors[0]}`);
      else setMsg(`${r.publishedNow}개 발행 완료.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '발행 실패');
    }
  };

  const busy = enqueue.isPending;
  const loading = connLoading || ytLoading;
  const nothingConnected = !conn?.connected && !yt?.connected;

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
          <h2 className="text-base font-bold break-keep">소셜 발행 — 릴스 / 쇼츠</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={16} /> 연동 확인 중…
          </div>
        ) : nothingConnected ? (
          <div className="rounded-lg bg-muted/50 border border-border p-3 text-sm text-muted-foreground break-keep">
            연결된 채널이 없습니다. <strong>설정 → 채널 연동</strong>에서 페이스북을 연결하거나
            유튜브 채널을 연결하세요.
          </div>
        ) : (
          <>
            {/* 메타 페이지 */}
            {conn?.connected && pages.length > 0 && (
              <div className="space-y-2">
                <select
                  value={page?.id ?? ''}
                  onChange={(e) => {
                    setPageId(e.target.value);
                    setMetaSel(new Set());
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
                <div className="flex flex-wrap gap-2">
                  {metaAvailable.map((p) => {
                    const row = META_ROWS.find((r) => r.id === p)!;
                    const Icon = row.icon;
                    const on = metaSel.has(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => toggle(setMetaSel, p)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium min-h-[36px] ${
                          on
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon size={14} /> {row.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 유튜브 채널 */}
            {yt?.connected && channels.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">YouTube 쇼츠</span>
                <div className="flex flex-wrap gap-2">
                  {channels.map((ch) => {
                    const on = ytSel.has(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggle(setYtSel, ch.id)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium min-h-[36px] ${
                          on
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Video size={14} /> {ch.name}
                      </button>
                    );
                  })}
                </div>
                {ytSel.size > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-muted-foreground">공개 범위</span>
                    {(['unlisted', 'public'] as const).map((pv) => (
                      <button
                        key={pv}
                        type="button"
                        onClick={() => setYtPrivacy(pv)}
                        className={`rounded-full px-2.5 py-1 text-[11px] ${
                          ytPrivacy === pv
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {pv === 'unlisted' ? '일부공개' : '공개'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground break-keep">
              선택한 언어({language.toUpperCase()})의 릴스 영상이 있어야 발행됩니다.
            </p>

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
                  <Loader2 className="animate-spin mr-1" size={16} /> 처리 중… (영상 업로드는 수십
                  초)
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
