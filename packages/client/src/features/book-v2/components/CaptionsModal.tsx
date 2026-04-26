import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGenerateLongformCaptions, useStartLongformUploadCaptions } from '../hooks/useLongform';
import { bookV2Api } from '../api/book-v2.api';
import { cn } from '@/lib/cn';

interface CaptionsModalProps {
  bid: string;
  projectId: string;
  /** 영상이 YouTube에 업로드되었는지 */
  hasYouTubeVideo: boolean;
  /** 이미 생성된 자막 언어 목록 */
  generatedLanguages: string[];
  /** 마지막 업로드된 언어 */
  uploadedLanguages: string[];
  /** 프로젝트 base lang */
  baseLang: string;
  open: boolean;
  onClose: () => void;
}

interface Progress {
  progress: number;
  step: string;
  error?: string;
}

const COMMON_LANGS = [
  { code: 'ko', label: '🇰🇷 한국어' },
  { code: 'en', label: '🇺🇸 English' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'zh', label: '🇨🇳 中文' },
  { code: 'es', label: '🇪🇸 Español' },
];

export function CaptionsModal({
  bid,
  projectId,
  hasYouTubeVideo,
  generatedLanguages,
  uploadedLanguages,
  baseLang,
  open,
  onClose,
}: CaptionsModalProps) {
  const generate = useGenerateLongformCaptions(bid);
  const upload = useStartLongformUploadCaptions(bid);
  const qc = useQueryClient();

  const [selected, setSelected] = useState<Set<string>>(new Set([baseLang]));
  const [progress, setProgress] = useState<Progress | null>(null);
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

  const toggleLang = (code: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const startPolling = () => {
    cancelledRef.current = false;
    const tick = async () => {
      if (cancelledRef.current) return;
      try {
        const p = await bookV2Api.getLongformCaptionProgress(bid, projectId);
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

  const handleGenerate = () => {
    const langs = [...selected];
    generate.mutate({ projectId, languages: langs });
  };

  const handleUpload = () => {
    const langs = [...selected].filter((l) => generatedLanguages.includes(l));
    if (langs.length === 0) return;
    upload.mutate(
      { projectId, languages: langs },
      {
        onSuccess: () => {
          setProgress({ progress: 0, step: '시작' });
          startPolling();
        },
      }
    );
  };

  const handleClose = () => {
    if (inProgress) return;
    cancelledRef.current = true;
    if (pollRef.current !== null) window.clearTimeout(pollRef.current);
    setProgress(null);
    generate.reset();
    upload.reset();
    onClose();
  };

  const selectedArr = [...selected];
  const allReadyForUpload = selectedArr.every((l) => generatedLanguages.includes(l));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-md shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-ink-900 font-display">📝 YouTube 자막</h2>
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

        <p className="text-xs text-ink-500 font-bold">
          씬의 자막 → SRT 생성. base({baseLang}) 외 언어는 Gemini로 번역. YouTube 업로드 시 영상에
          다국어 자막 적용.
        </p>

        {/* 언어 선택 */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-black text-ink-500 uppercase tracking-wider">
            언어 선택
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {COMMON_LANGS.map(({ code, label }) => {
              const checked = selected.has(code);
              const isGenerated = generatedLanguages.includes(code);
              const isUploaded = uploadedLanguages.includes(code);
              return (
                <label
                  key={code}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs cursor-pointer',
                    checked
                      ? 'bg-coral-50 border-coral-300'
                      : 'bg-white border-ink-200 hover:bg-cream-50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLang(code)}
                    className="w-3 h-3"
                  />
                  <span className="font-bold text-ink-900">{label}</span>
                  {isUploaded && <span className="text-[9px] text-success ml-auto">📺</span>}
                  {isGenerated && !isUploaded && (
                    <span className="text-[9px] text-coral-600 ml-auto">✓</span>
                  )}
                </label>
              );
            })}
          </div>
          <p className="text-[10px] text-ink-500">✓ SRT 생성됨 · 📺 YouTube 업로드됨</p>
        </div>

        {/* 진행률 */}
        {progress && (
          <div className="space-y-2 pt-2 border-t border-ink-100">
            <div className="text-xs font-bold text-ink-700">
              {isFailed
                ? '❌ 실패'
                : isDone
                  ? '✓ 완료'
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
              <div className="text-xs text-danger font-bold whitespace-pre-line">
                {progress.error}
              </div>
            )}
          </div>
        )}

        {(generate.isError || upload.isError) && (
          <div className="bg-warn/10 border border-warn/30 rounded-md p-2 text-xs text-ink-700 font-bold whitespace-pre-line">
            {((generate.error || upload.error) as Error).message}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-2 pt-2 border-t border-ink-100">
          <button
            onClick={handleClose}
            disabled={!!inProgress}
            className={cn(
              'px-3 py-1.5 rounded-md font-bold text-xs',
              inProgress
                ? 'bg-ink-100 text-ink-300 cursor-not-allowed'
                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            )}
          >
            닫기
          </button>
          <button
            onClick={handleGenerate}
            disabled={selected.size === 0 || generate.isPending}
            className={cn(
              'px-3 py-1.5 rounded-md font-black text-xs',
              selected.size > 0 && !generate.isPending
                ? 'bg-coral-500 text-white shadow-pop hover:brightness-110'
                : 'bg-ink-100 text-ink-300 cursor-not-allowed'
            )}
            title="선택한 언어들의 SRT 생성 (base는 자동, 나머지는 Gemini 번역)"
          >
            {generate.isPending ? '생성 중...' : '🤖 SRT 생성'}
          </button>
          <button
            onClick={handleUpload}
            disabled={
              !hasYouTubeVideo ||
              selected.size === 0 ||
              !allReadyForUpload ||
              upload.isPending ||
              !!inProgress
            }
            className={cn(
              'px-3 py-1.5 rounded-md font-black text-xs',
              hasYouTubeVideo &&
                selected.size > 0 &&
                allReadyForUpload &&
                !upload.isPending &&
                !inProgress
                ? 'bg-success text-white shadow-pop hover:brightness-110'
                : 'bg-ink-100 text-ink-300 cursor-not-allowed'
            )}
            title={
              !hasYouTubeVideo
                ? '먼저 YouTube에 영상 업로드 또는 수동 연결'
                : !allReadyForUpload
                  ? '선택한 언어 중 SRT 미생성. 먼저 생성하세요.'
                  : 'YouTube에 자막 업로드'
            }
          >
            {upload.isPending ? '시작 중...' : '📺 업로드'}
          </button>
        </div>
      </div>
    </div>
  );
}
