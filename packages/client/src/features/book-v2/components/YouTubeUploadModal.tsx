import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStartLongformYouTubeUpload, useLinkLongformYouTubeVideo } from '../hooks/useLongform';
import { bookV2Api } from '../api/book-v2.api';
import type { YouTubeUploadMeta } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface YouTubeUploadModalProps {
  bid: string;
  projectId: string;
  defaultTitle: string;
  hasVideo: boolean;
  open: boolean;
  onClose: () => void;
}

interface Progress {
  progress: number;
  step: string;
  error?: string;
}

type Mode = 'upload' | 'link';

export function YouTubeUploadModal({
  bid,
  projectId,
  defaultTitle,
  hasVideo,
  open,
  onClose,
}: YouTubeUploadModalProps) {
  const upload = useStartLongformYouTubeUpload(bid);
  const link = useLinkLongformYouTubeVideo(bid);
  const qc = useQueryClient();

  const [mode, setMode] = useState<Mode>(hasVideo ? 'upload' : 'link');
  const [title, setTitle] = useState<string>(defaultTitle);
  const [description, setDescription] = useState<string>('');
  const [tagsRaw, setTagsRaw] = useState<string>('');
  const [privacy, setPrivacy] = useState<YouTubeUploadMeta['privacy']>('private');
  const [categoryId, setCategoryId] = useState<string>('27'); // Education
  const [language, setLanguage] = useState<string>('ko');

  const [linkUrl, setLinkUrl] = useState<string>('');

  const [progress, setProgress] = useState<Progress | null>(null);
  const [linkResult, setLinkResult] = useState<{
    videoId: string;
    channelTitle?: string;
    ownerConnected: boolean;
  } | null>(null);
  const pollRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollRef.current !== null) window.clearTimeout(pollRef.current);
    };
  }, []);

  if (!open) return null;

  const inProgress = progress && progress.progress >= 0 && progress.progress < 100;
  const isDone = progress?.progress === 100;
  const isFailed = (progress?.progress ?? 0) < 0;

  const startPolling = () => {
    cancelledRef.current = false;
    const tick = async () => {
      if (cancelledRef.current) return;
      try {
        const p = await bookV2Api.getLongformYouTubeProgress(bid, projectId);
        if (p) {
          setProgress(p);
          if (p.progress >= 100) {
            qc.invalidateQueries({ queryKey: ['book-v2', 'longform', bid] });
            return;
          }
          if (p.progress < 0) return;
        }
        pollRef.current = window.setTimeout(tick, 2000);
      } catch {
        pollRef.current = window.setTimeout(tick, 4000);
      }
    };
    tick();
  };

  const handleUpload = () => {
    const meta: YouTubeUploadMeta = {
      title: title.trim(),
      description: description.trim(),
      privacy,
      categoryId,
      tags: tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      language: language || undefined,
    };
    upload.mutate(
      { projectId, meta },
      {
        onSuccess: () => {
          setProgress({ progress: 0, step: '시작' });
          startPolling();
        },
      }
    );
  };

  const handleLink = () => {
    link.mutate(
      { projectId, videoIdOrUrl: linkUrl },
      {
        onSuccess: (data) => {
          setLinkResult({
            videoId: data.videoId,
            channelTitle: data.channelTitle,
            ownerConnected: data.ownerConnected,
          });
        },
      }
    );
  };

  const handleClose = () => {
    if (inProgress) return;
    cancelledRef.current = true;
    if (pollRef.current !== null) window.clearTimeout(pollRef.current);
    setProgress(null);
    setLinkResult(null);
    upload.reset();
    link.reset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-md shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-ink-900 font-display">📺 YouTube</h2>
          <button
            onClick={handleClose}
            disabled={!!inProgress}
            className={cn(
              'text-xl',
              inProgress ? 'text-ink-300 cursor-not-allowed' : 'text-ink-500 hover:text-ink-900'
            )}
          >
            ×
          </button>
        </div>

        {/* 모드 토글 */}
        {!progress && !linkResult && (
          <div className="flex gap-1 bg-ink-100 rounded-md p-1">
            <button
              onClick={() => setMode('upload')}
              disabled={!hasVideo}
              className={cn(
                'flex-1 px-3 py-1.5 rounded text-xs font-bold',
                mode === 'upload'
                  ? 'bg-white shadow text-ink-900'
                  : hasVideo
                    ? 'text-ink-500 hover:text-ink-700'
                    : 'text-ink-300 cursor-not-allowed'
              )}
              title={hasVideo ? 'R2 영상을 YouTube에 업로드' : '먼저 🎞️ 최종 렌더 실행'}
            >
              📤 업로드
            </button>
            <button
              onClick={() => setMode('link')}
              className={cn(
                'flex-1 px-3 py-1.5 rounded text-xs font-bold',
                mode === 'link' ? 'bg-white shadow text-ink-900' : 'text-ink-500 hover:text-ink-700'
              )}
              title="외부에서 올린 YouTube 영상을 프로젝트에 연결"
            >
              🔗 수동 연결
            </button>
          </div>
        )}

        {/* 진행률 */}
        {progress && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-ink-700">
              {isFailed
                ? '❌ 업로드 실패'
                : isDone
                  ? '✓ 업로드 완료'
                  : `📺 ${progress.step} (${progress.progress}%)`}
            </div>
            <div className="w-full bg-ink-100 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isFailed ? 'bg-danger' : isDone ? 'bg-success' : 'bg-coral-500'
                )}
                style={{
                  width: isFailed ? '100%' : `${Math.max(0, Math.min(100, progress.progress))}%`,
                }}
              />
            </div>
            {progress.error && (
              <div className="bg-danger/10 border border-danger/30 rounded-md p-2 text-xs text-danger font-bold whitespace-pre-line">
                {progress.error}
              </div>
            )}
            {isDone && (
              <div className="bg-success/10 border border-success/30 rounded-md p-3 text-xs text-success font-bold">
                ✓ YouTube에 업로드되었습니다.
              </div>
            )}
          </div>
        )}

        {/* 수동 연결 결과 */}
        {linkResult && (
          <div className="bg-success/10 border border-success/30 rounded-md p-3 text-xs space-y-1">
            <div className="text-success font-bold">✓ 연결됨</div>
            <div>
              videoId: <span className="font-mono">{linkResult.videoId}</span>
            </div>
            {linkResult.channelTitle && <div>채널: {linkResult.channelTitle}</div>}
            <div className="text-ink-500">
              {linkResult.ownerConnected
                ? '내 채널 영상 → 자막 업로드 가능'
                : '외부 채널 영상 → 자막 업로드 불가'}
            </div>
          </div>
        )}

        {/* 업로드 폼 */}
        {!progress && !linkResult && mode === 'upload' && (
          <div className="space-y-3">
            <Field label="제목 *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
            </Field>
            <Field label="설명">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="input"
              />
            </Field>
            <Field label="태그 (쉼표 구분)">
              <input
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="동화책, 어린이, 교육"
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="공개">
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as YouTubeUploadMeta['privacy'])}
                  className="input"
                >
                  <option value="private">비공개</option>
                  <option value="unlisted">일부 공개</option>
                  <option value="public">공개</option>
                </select>
              </Field>
              <Field label="카테고리">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input"
                >
                  <option value="27">교육 (27)</option>
                  <option value="24">엔터 (24)</option>
                  <option value="22">사람·블로그 (22)</option>
                </select>
              </Field>
              <Field label="언어">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="input"
                >
                  <option value="ko">ko</option>
                  <option value="en">en</option>
                </select>
              </Field>
            </div>
            {upload.isError && (
              <div className="bg-warn/10 border border-warn/30 rounded-md p-2 text-xs text-ink-700 font-bold whitespace-pre-line">
                {(upload.error as Error).message}
              </div>
            )}
          </div>
        )}

        {/* 수동 연결 폼 */}
        {!progress && !linkResult && mode === 'link' && (
          <div className="space-y-3">
            <Field label="YouTube URL 또는 영상 ID *">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://youtu.be/abc123 또는 abc1234567"
                className="input"
              />
            </Field>
            <p className="text-[11px] text-ink-500 font-bold">
              외부에서 직접 업로드한 YouTube 영상을 프로젝트에 연결합니다.
            </p>
            {link.isError && (
              <div className="bg-warn/10 border border-warn/30 rounded-md p-2 text-xs text-ink-700 font-bold whitespace-pre-line">
                {(link.error as Error).message}
              </div>
            )}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-2 pt-2 border-t border-ink-100">
          <button
            onClick={handleClose}
            disabled={!!inProgress}
            className={cn(
              'px-4 py-1.5 rounded-md font-bold text-xs',
              inProgress
                ? 'bg-ink-100 text-ink-300 cursor-not-allowed'
                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            )}
          >
            {isDone || linkResult ? '닫기' : '취소'}
          </button>
          {!progress && !linkResult && mode === 'upload' && (
            <button
              onClick={handleUpload}
              disabled={!title.trim() || upload.isPending || !hasVideo}
              className={cn(
                'px-5 py-1.5 rounded-md font-black text-xs',
                title.trim() && hasVideo && !upload.isPending
                  ? 'bg-coral-500 text-white shadow-pop hover:brightness-110'
                  : 'bg-ink-100 text-ink-300 cursor-not-allowed'
              )}
            >
              {upload.isPending ? '시작 중...' : '📤 업로드 시작'}
            </button>
          )}
          {!progress && !linkResult && mode === 'link' && (
            <button
              onClick={handleLink}
              disabled={!linkUrl.trim() || link.isPending}
              className={cn(
                'px-5 py-1.5 rounded-md font-black text-xs',
                linkUrl.trim() && !link.isPending
                  ? 'bg-coral-500 text-white shadow-pop hover:brightness-110'
                  : 'bg-ink-100 text-ink-300 cursor-not-allowed'
              )}
            >
              {link.isPending ? '연결 중...' : '🔗 연결'}
            </button>
          )}
        </div>

        <style>{`
          .input {
            width: 100%;
            padding: 0.5rem 0.75rem;
            background: white;
            border: 1px solid var(--ink-200, #e2e8f0);
            border-radius: 0.375rem;
            font-size: 0.75rem;
            color: var(--ink-900, #0f172a);
            font-family: inherit;
          }
          .input:focus { outline: 2px solid var(--coral-400, #ff7e5f); outline-offset: -1px; }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: import('react').ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black text-ink-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
