/**
 * ReelsPanel — 릴스(숏폼) 채널 패널. dflo(ContentFlow) ReelsPanel 포트.
 *
 * 3 서브탭:
 *   📋 스토리보드 — 정적 HTML 뷰어(전 언어 공용). `/marketing-storyboards/{storybookId}.html`,
 *      manifest `/marketing-storyboards/index.json`(id 배열)로 존재 여부 판단. 없으면 플레이스홀더.
 *   🎬 영상 제작 — 언어별 커버(9:16)+영상(mp4) R2 업로드. 캡션·해시태그는 카드뉴스(인스타 carousel)
 *      행 단일 소스(읽기 전용). 릴스·카드뉴스 공용.
 *   ✂️ 에디터 — 현재 언어 영상 프리뷰 + 타임라인 에디터(Remotion) 추후 안내.
 *
 * 데이터(마이그레이션 0): 릴스 언어별 {videoUrl, coverUrl} 맵은 카드뉴스와 **같은**
 *   `mkt_instagram_contents` 행의 `video_settings.reels[lang]` 에 저장. 두 번째 인스타 행을 만들지
 *   않아 `instagramContents[0]`(카드뉴스/번역 소스) 규약을 깨지 않는다.
 */

import { useEffect, useRef, useState } from 'react';
import { Loader2, Copy, Check, Film, ExternalLink, Trash2 } from 'lucide-react';
import { useContent } from '../../api/use-contents';
import { ReelsPublishDialog } from '../publish/ReelsPublishDialog';
import {
  useCreateInstagramContent,
  useUpdateInstagramContent,
} from '../../api/use-instagram-contents';
import { uploadToR2 } from '../../api/use-r2-upload';
import { useUIStore } from '../../store/ui-store';
import { cn } from '../../lib/utils';
import type { Content, Project, InstagramContent, InstagramCard } from '../../types/database';

// ── storyboard manifest (1회 로드 캐시) ─────────────────────────────────────
let _sbManifest: Promise<Set<string>> | null = null;
function loadStoryboardManifest(): Promise<Set<string>> {
  if (!_sbManifest) {
    _sbManifest = fetch('/marketing-storyboards/index.json')
      .then((r) => (r.ok ? (r.json() as Promise<string[]>) : []))
      .then((arr) => new Set(arr))
      .catch(() => new Set<string>());
  }
  return _sbManifest;
}

/** content.memo (`storybook:<id>`) → storybookId. 없으면 null. */
function parseStorybookId(memo: string | null | undefined): string | null {
  if (!memo) return null;
  const m = memo.match(/^storybook:(.+)$/);
  return m ? m[1].trim() : null;
}

const LANG_LABELS: Record<string, string> = {
  ko: '🇰🇷 한국어',
  en: '🇺🇸 EN',
  vi: '🇻🇳 VI',
  th: '🇹🇭 TH',
  ja: '🇯🇵 日本語',
  fa: '🇮🇷 FA',
};

interface ReelsLangData {
  videoUrl: string | null;
  coverUrl: string | null;
}
type ReelsMap = Record<string, ReelsLangData>;
const EMPTY: ReelsLangData = { videoUrl: null, coverUrl: null };

type Sub = 'storyboard' | 'video' | 'editor';
const SUBS: { key: Sub; label: string }[] = [
  { key: 'storyboard', label: '📋 스토리보드' },
  { key: 'video', label: '🎬 영상 제작' },
  { key: 'editor', label: '✂️ 에디터' },
];

interface ReelsPanelProps {
  content: Content;
  project: Project;
}

export function ReelsPanel({ content, project }: ReelsPanelProps) {
  const { selectedContentId, selectedLanguage } = useUIStore();
  const lang = selectedLanguage || 'ko';

  const { data: graph, isLoading } = useContent(selectedContentId);
  const createInstagramContent = useCreateInstagramContent();
  const updateInstagramContent = useUpdateInstagramContent();

  const igContents = (graph?.instagramContents ?? []) as Array<
    InstagramContent & { cards: InstagramCard[] }
  >;
  const igContent = igContents[0] ?? null;
  const igContentId = igContent?.id ?? null;

  const [sub, setSub] = useState<Sub>('storyboard');
  const [reels, setReels] = useState<ReelsMap>({});
  const [showPublish, setShowPublish] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [dragOver, setDragOver] = useState<'cover' | 'video' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sbSet, setSbSet] = useState<Set<string> | null>(null);

  // 로컬 reels 상태를 그래프와 동기화(행 전환 시 1회). 업로드는 이벤트성이라 디바운스 불필요.
  const prevIgRef = useRef<string | null>(null);
  const seededRef = useRef(false);
  if (prevIgRef.current !== igContentId) {
    prevIgRef.current = igContentId;
    seededRef.current = false;
  }
  useEffect(() => {
    if (seededRef.current) return;
    const fromGraph = ((igContent?.video_settings as Record<string, unknown> | null)?.reels ??
      {}) as ReelsMap;
    setReels(fromGraph);
    seededRef.current = true;
  }, [igContent]);

  useEffect(() => {
    let alive = true;
    void loadStoryboardManifest().then((s) => {
      if (alive) setSbSet(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const storybookId = parseStorybookId(content.memo);
  const storyboardSrc =
    storybookId && sbSet && sbSet.has(storybookId)
      ? `/marketing-storyboards/${storybookId}.html`
      : null;

  const cur = reels[lang] ?? EMPTY;
  const label = LANG_LABELS[lang] ?? lang;
  const caption = igContent?.caption ?? '';
  const hashtags = (igContent?.hashtags ?? [])
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
    .join(' ');
  const hasCaption = !!(caption.trim() || hashtags.trim());

  // 인스타(카드뉴스) 행 보장 — 없으면 생성하고 id 반환.
  async function ensureIg(): Promise<{ id: string; videoSettings: Record<string, unknown> }> {
    if (igContentId) {
      return {
        id: igContentId,
        videoSettings: (igContent?.video_settings as Record<string, unknown>) ?? {},
      };
    }
    const id = await createInstagramContent.mutateAsync({ contentId: content.id });
    return { id, videoSettings: {} };
  }

  async function patch(p: Partial<ReelsLangData>) {
    const next: ReelsMap = { ...reels, [lang]: { ...cur, ...p } };
    setReels(next); // 낙관적 갱신
    const { id, videoSettings } = await ensureIg();
    updateInstagramContent.mutate({
      id,
      contentId: content.id,
      updates: { video_settings: { ...videoSettings, reels: next } },
    });
  }

  async function onVideo(file?: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { publicUrl } = await uploadToR2(file, {
        projectId: project.id,
        category: 'reels',
        contentId: content.id,
      });
      await patch({ videoUrl: publicUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : '영상 업로드 실패');
    } finally {
      setUploading(false);
    }
  }

  async function onCover(file?: File | null) {
    if (!file) return;
    setCoverUploading(true);
    setError(null);
    try {
      const { publicUrl } = await uploadToR2(file, {
        projectId: project.id,
        category: 'reels',
        contentId: content.id,
      });
      await patch({ coverUrl: publicUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : '커버 업로드 실패');
    } finally {
      setCoverUploading(false);
    }
  }

  function copy() {
    void navigator.clipboard
      .writeText(`${caption}\n\n${hashtags}`.trim())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      })
      .catch(() => {});
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 서브탭 */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border p-3">
        {SUBS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSub(s.key)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              s.key === sub
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground ring-1 ring-border hover:bg-muted'
            )}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowPublish(true)}
          disabled={!cur.videoUrl}
          className={cn(
            'ml-auto rounded-full px-3 py-1 text-xs font-semibold transition-colors',
            cur.videoUrl
              ? 'bg-primary text-primary-foreground hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
          title={cur.videoUrl ? '' : '먼저 이 언어의 영상을 업로드하세요'}
        >
          📤 소셜 발행
        </button>
      </div>

      {showPublish && (
        <ReelsPublishDialog
          projectId={project.id}
          contentId={content.id}
          language={lang}
          onClose={() => setShowPublish(false)}
        />
      )}

      {/* ── 스토리보드 ── */}
      {sub === 'storyboard' ? (
        <div className="flex-1 overflow-hidden p-4">
          {storyboardSrc ? (
            <iframe
              src={storyboardSrc}
              title="릴스 스토리보드"
              className="h-full w-full rounded-lg border border-border bg-white"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-center text-muted-foreground">
              <div className="text-3xl">📋</div>
              <p className="mt-2 text-sm font-semibold">스토리보드 준비 중</p>
              <p className="mt-1 max-w-xs text-xs">
                이 콘텐츠의 릴스 스토리보드는 아직 없어요. 생성되면 여기에 표시됩니다. (전 언어
                공용)
              </p>
            </div>
          )}
        </div>
      ) : sub === 'editor' ? (
        /* ── 에디터(프리뷰 + 추후 안내) ── */
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">✂️ 릴 에디터</p>
            <p className="mt-1">
              타임라인 기반 Remotion 라이트 에디터는 다음 단계에서 추가됩니다. 지금은 현재 언어(
              {label})의 업로드 영상을 미리볼 수 있어요.
            </p>
          </div>
          {cur.videoUrl ? (
            <video
              src={cur.videoUrl}
              controls
              className="mx-auto max-h-[520px] rounded-lg bg-black"
              style={{ aspectRatio: '9 / 16' }}
            >
              <track kind="captions" />
            </video>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-center text-muted-foreground">
              <Film size={28} />
              <p className="mt-2 text-sm">아직 업로드된 영상이 없어요</p>
              <p className="mt-1 text-xs">🎬 영상 제작 탭에서 {label} 영상을 올려 주세요.</p>
            </div>
          )}
        </div>
      ) : (
        /* ── 영상 제작 ── */
        <div className="flex-1 overflow-y-auto p-4">
          {error && <div className="mb-2 text-[11px] text-destructive">{error}</div>}

          <div className="mb-4 grid grid-cols-2 gap-3">
            {/* 커버 */}
            <div
              className={cn(
                'rounded-lg border p-3 transition',
                dragOver === 'cover'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                  : 'border-border'
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver('cover');
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const f = e.dataTransfer.files?.[0];
                if (f && f.type.startsWith('image/')) void onCover(f);
              }}
            >
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                🖼️ 섬네일 · 커버 ({label})
              </div>
              {cur.coverUrl ? (
                <div className="space-y-2">
                  <img
                    src={cur.coverUrl}
                    alt="릴스 커버"
                    className="mx-auto max-h-[440px] rounded-lg bg-black object-contain"
                    style={{ aspectRatio: '9 / 16' }}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer rounded bg-foreground/80 px-3 py-1 text-xs font-semibold text-background">
                      {coverUploading ? '업로드 중…' : '커버 교체'}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={coverUploading}
                        onChange={(e) => {
                          void onCover(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void patch({ coverUrl: null })}
                      className="inline-flex items-center gap-1 rounded border border-border px-3 py-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={11} /> 삭제
                    </button>
                    <a
                      href={cur.coverUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary underline"
                    >
                      열기 <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              ) : (
                <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-center text-sm text-muted-foreground hover:border-primary hover:text-primary">
                  {coverUploading ? '업로드 중…' : '🖼️ 커버 올리기 · 드래그앤드롭 (9:16)'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={coverUploading}
                    onChange={(e) => {
                      void onCover(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">
                인스타 릴스 커버 · 중앙 3:4 안전영역(프로필 그리드 크롭) 고려
              </p>
            </div>

            {/* 영상 */}
            <div
              className={cn(
                'rounded-lg border p-3 transition',
                dragOver === 'video'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                  : 'border-border'
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver('video');
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const f = e.dataTransfer.files?.[0];
                if (f && f.type.startsWith('video/')) void onVideo(f);
              }}
            >
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                🎬 영상 ({label})
              </div>
              {cur.videoUrl ? (
                <div className="space-y-2">
                  <video
                    src={cur.videoUrl}
                    controls
                    className="mx-auto max-h-[440px] rounded-lg bg-black"
                    style={{ aspectRatio: '9 / 16' }}
                  >
                    <track kind="captions" />
                  </video>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer rounded bg-foreground/80 px-3 py-1 text-xs font-semibold text-background">
                      {uploading ? '업로드 중…' : '영상 교체'}
                      <input
                        type="file"
                        accept="video/*"
                        hidden
                        disabled={uploading}
                        onChange={(e) => {
                          void onVideo(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void patch({ videoUrl: null })}
                      className="inline-flex items-center gap-1 rounded border border-border px-3 py-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={11} /> 삭제
                    </button>
                    <a
                      href={cur.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary underline"
                    >
                      새 탭에서 열기 <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              ) : (
                <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-center text-sm text-muted-foreground hover:border-primary hover:text-primary">
                  {uploading ? '업로드 중…' : '📹 영상 올리기 · 드래그앤드롭 (mp4)'}
                  <input
                    type="file"
                    accept="video/*"
                    hidden
                    disabled={uploading}
                    onChange={(e) => {
                      void onVideo(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* 캡션 · 해시태그 — 카드뉴스 단일 소스(읽기 전용) */}
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                📝 캡션 · 해시태그 ({label}) · 카드뉴스 공용
              </span>
              {hasCaption && (
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-1 rounded bg-foreground/80 px-2 py-0.5 text-[11px] text-background"
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? '복사됨' : '복사'}
                </button>
              )}
            </div>
            {hasCaption ? (
              <>
                <p className="mb-2 whitespace-pre-wrap rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground">
                  {caption || '—'}
                </p>
                <p className="whitespace-pre-wrap rounded border border-border bg-background px-2 py-1.5 text-xs text-muted-foreground">
                  {hashtags || '—'}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  ✏️ 편집은 <b>카드뉴스 탭</b>에서 (릴스·카드뉴스 공용)
                </p>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                카드뉴스 탭에서 캡션·해시태그를 먼저 생성하면 여기에 표시됩니다.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
