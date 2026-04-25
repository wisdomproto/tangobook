import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookV2Api } from '../api/book-v2.api';
import type { BookManifest, ReadingLevel } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface AudiobookRenderModalProps {
  manifest: BookManifest;
  open: boolean;
  onClose: () => void;
}

interface ProgressState {
  progress: number;
  step: string;
  error?: string;
}

export function AudiobookRenderModal({ manifest, open, onClose }: AudiobookRenderModalProps) {
  const v = manifest.usedVariants;
  const [level, setLevel] = useState<ReadingLevel | ''>(v.levels[0] ?? '');
  const [language, setLanguage] = useState<string>(v.languages[0] ?? 'ko');
  const [style, setStyle] = useState<string>(v.styles[0] ?? '');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const pollRef = useRef<number | null>(null);
  const qc = useQueryClient();

  const start = useMutation({
    mutationFn: () =>
      bookV2Api.startAudiobookRender(manifest.id, {
        level: level as ReadingLevel,
        language,
        style,
      }),
    onSuccess: (data) => {
      setTaskId(data.taskId);
      setProgress({ progress: 0, step: '시작' });
    },
  });

  // Polling
  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const p = await bookV2Api.getAudiobookRenderProgress(manifest.id, taskId);
        if (cancelled) return;
        if (p) {
          setProgress(p);
          if (p.progress >= 100) {
            qc.invalidateQueries({ queryKey: ['book-v2', 'audiobook', manifest.id, 'renders'] });
            return; // 폴링 종료
          }
          if (p.progress < 0) {
            return; // 실패 — 폴링 종료
          }
        }
        pollRef.current = window.setTimeout(tick, 1500);
      } catch {
        pollRef.current = window.setTimeout(tick, 3000);
      }
    };
    tick();
    return () => {
      cancelled = true;
      if (pollRef.current !== null) {
        window.clearTimeout(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [taskId, manifest.id, qc]);

  if (!open) return null;

  const canStart = level && language && style && !start.isPending && !taskId;
  const isDone = progress?.progress === 100;
  const isFailed = (progress?.progress ?? 0) < 0;
  const inProgress = !!taskId && !isDone && !isFailed;

  const handleClose = () => {
    if (inProgress) return; // 진행 중 닫기 방지
    setTaskId(null);
    setProgress(null);
    start.reset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-md shadow-xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-ink-900 font-display">🎬 오디오북 렌더</h2>
          <button
            onClick={handleClose}
            disabled={inProgress}
            className={cn(
              'text-xl',
              inProgress ? 'text-ink-300 cursor-not-allowed' : 'text-ink-500 hover:text-ink-900'
            )}
          >
            ×
          </button>
        </div>

        {!taskId && (
          <>
            <p className="text-xs text-ink-500 font-bold">
              렌더할 (레벨 / 언어 / 그림체) 조합 선택. 페이지 이미지가 있어야 렌더링됩니다.
            </p>

            <Field label="레벨">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as ReadingLevel)}
                className="input"
              >
                <option value="">선택</option>
                {v.levels.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="언어">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input"
              >
                {v.languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="그림체">
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="input">
                <option value="">선택</option>
                {v.styles.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            {start.isError && (
              <div className="bg-warn/10 border border-warn/30 rounded-md p-3 text-xs text-ink-700 font-bold whitespace-pre-line">
                {(start.error as Error).message}
              </div>
            )}
          </>
        )}

        {progress && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-ink-700">
              {level} / {language} / {style}
            </div>
            <ProgressBar value={progress.progress} />
            <div className="text-xs text-ink-500 font-bold">
              {progress.progress < 0
                ? '❌ 실패'
                : progress.progress >= 100
                  ? '✓ 완료'
                  : `${progress.step} (${progress.progress}%)`}
            </div>
            {progress.error && (
              <div className="bg-danger/10 border border-danger/30 rounded-md p-3 text-xs text-danger font-bold whitespace-pre-line">
                {progress.error}
              </div>
            )}
            {isDone && (
              <div className="bg-success/10 border border-success/30 rounded-md p-3 text-xs text-success font-bold">
                ✓ 렌더 완료. "렌더 결과" 섹션에서 확인하세요.
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {!taskId ? (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-md bg-ink-100 text-ink-700 font-bold text-sm hover:bg-ink-200"
              >
                닫기
              </button>
              <button
                onClick={() => start.mutate()}
                disabled={!canStart}
                className={cn(
                  'px-5 py-2 rounded-md font-black text-sm transition-all',
                  canStart
                    ? 'bg-coral-500 text-white shadow-pop hover:brightness-110'
                    : 'bg-ink-100 text-ink-300 cursor-not-allowed'
                )}
              >
                {start.isPending ? '시작 중...' : '🎬 렌더 시작'}
              </button>
            </>
          ) : (
            <button
              onClick={handleClose}
              disabled={inProgress}
              className={cn(
                'px-5 py-2 rounded-md font-black text-sm transition-all',
                inProgress
                  ? 'bg-ink-100 text-ink-300 cursor-not-allowed'
                  : 'bg-coral-500 text-white shadow-pop hover:brightness-110'
              )}
            >
              {inProgress ? '진행 중...' : '닫기'}
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
            font-size: 0.875rem;
            color: var(--ink-900, #0f172a);
            font-family: inherit;
          }
          .input:focus { outline: 2px solid var(--coral-400, #ff7e5f); outline-offset: -1px; }
        `}</style>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const failed = value < 0;
  return (
    <div className="w-full bg-ink-100 rounded-full h-2 overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-all',
          failed ? 'bg-danger' : value >= 100 ? 'bg-success' : 'bg-coral-500'
        )}
        style={{ width: failed ? '100%' : `${pct}%` }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: import('react').ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-black text-ink-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
