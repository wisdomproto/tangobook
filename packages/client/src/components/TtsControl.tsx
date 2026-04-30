import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/design-system';

// 전역 오디오 싱글톤: 여러 TtsControl 인스턴스 간 동시 재생 방지
let globalAudio: HTMLAudioElement | null = null;
let globalStopCallback: (() => void) | null = null;

interface TtsControlProps {
  /** 생성된 TTS URL (null이면 미생성) */
  url?: string;
  /** 표시 라벨 (예: "a", "bat", "TTS") */
  label?: string;
  /** 다운로드 파일명 (없으면 다운로드 버튼 숨김) */
  downloadFilename?: string;
  /** 생성 중 여부 */
  generating?: boolean;
  /** 업로드 중 여부 */
  uploading?: boolean;
  /** 비활성화 */
  disabled?: boolean;
  /** 생성 클릭 */
  onGenerate?: () => void;
  /** 오디오 파일 업로드 (드래그앤드롭/파일선택) */
  onUpload?: (file: File) => void;
  /** compact: 음가 pill / full: 단어/문장용 */
  layout?: 'compact' | 'full';
}

export function TtsControl({
  url,
  label,
  downloadFilename,
  generating = false,
  uploading = false,
  disabled = false,
  onGenerate,
  onUpload,
  layout = 'full',
}: TtsControlProps) {
  const [playing, setPlaying] = useState(false);
  const [dragging, setDragging] = useState(false);
  const myAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(
    () => () => {
      if (myAudioRef.current) {
        myAudioRef.current.pause();
        if (globalAudio === myAudioRef.current) {
          globalAudio = null;
          globalStopCallback = null;
        }
        myAudioRef.current = null;
      }
    },
    []
  );

  const togglePlay = useCallback(() => {
    if (!url) return;
    if (myAudioRef.current) {
      myAudioRef.current.pause();
      if (globalAudio === myAudioRef.current) {
        globalAudio = null;
        globalStopCallback = null;
      }
      myAudioRef.current = null;
      setPlaying(false);
      return;
    }
    if (globalAudio) {
      globalAudio.pause();
      globalStopCallback?.();
    }
    const audio = new Audio(url);
    const cleanup = () => {
      setPlaying(false);
      myAudioRef.current = null;
      globalAudio = null;
      globalStopCallback = null;
    };
    audio.onended = cleanup;
    audio.onerror = cleanup;
    audio.play();
    myAudioRef.current = audio;
    globalAudio = audio;
    globalStopCallback = () => {
      setPlaying(false);
      myAudioRef.current = null;
    };
    setPlaying(true);
  }, [url]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (!onUpload) return;
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('audio/')) onUpload(file);
    },
    [onUpload]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (onUpload) setDragging(true);
    },
    [onUpload]
  );
  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleFileSelect = useCallback(() => {
    if (!onUpload || !fileInputRef.current) return;
    fileInputRef.current.click();
  }, [onUpload]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onUpload) onUpload(file);
      if (e.target) e.target.value = '';
    },
    [onUpload]
  );

  const busy = generating || uploading;

  const dropProps = onUpload
    ? {
        onDrop: handleDrop,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
      }
    : {};

  const dropClass = dragging ? 'ring-2 ring-violet-400 ring-offset-1 rounded-lg' : '';

  const fileInput = onUpload ? (
    <input
      ref={fileInputRef}
      type="file"
      accept="audio/*"
      className="hidden"
      onChange={handleFileChange}
    />
  ) : null;

  if (layout === 'compact') {
    return (
      <span className={dropClass} {...dropProps}>
        {fileInput}
        <CompactTts
          url={url}
          label={label}
          generating={busy}
          disabled={disabled}
          playing={playing}
          onPlay={togglePlay}
          onGenerate={onGenerate}
          downloadFilename={downloadFilename}
          onUploadClick={onUpload ? handleFileSelect : undefined}
        />
      </span>
    );
  }

  return (
    <div className={dropClass} {...dropProps}>
      {fileInput}
      <FullTts
        url={url}
        label={label}
        generating={busy}
        disabled={disabled}
        playing={playing}
        onPlay={togglePlay}
        onGenerate={onGenerate}
        downloadFilename={downloadFilename}
        onUploadClick={onUpload ? handleFileSelect : undefined}
      />
    </div>
  );
}

// --- compact: 음가 pill ---
function CompactTts({
  url,
  label,
  generating,
  disabled,
  playing,
  onPlay,
  onGenerate,
  downloadFilename,
  onUploadClick,
}: {
  url?: string;
  label?: string;
  generating: boolean;
  disabled: boolean;
  playing: boolean;
  onPlay: () => void;
  onGenerate?: () => void;
  downloadFilename?: string;
  onUploadClick?: () => void;
}) {
  if (generating) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 text-xs font-medium">
        <Spinner className="w-3 h-3" />
        {label && <span>{label}</span>}
      </span>
    );
  }

  if (url) {
    return (
      <span className="inline-flex items-center gap-0.5">
        <button
          onClick={onPlay}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            playing
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
          }`}
          title="재생"
        >
          {playing ? <PauseIcon className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
          {label && <span>{label}</span>}
        </button>
        {downloadFilename && (
          <a
            href={url}
            download={downloadFilename}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="다운로드"
          >
            <DownloadIcon className="w-2.5 h-2.5" />
          </a>
        )}
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
            title="오디오 파일 업로드"
          >
            <UploadIcon className="w-2.5 h-2.5" />
          </button>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      <button
        onClick={onGenerate}
        disabled={disabled}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-violet-500 hover:border-violet-400 transition-colors disabled:opacity-50"
        title="TTS 생성"
      >
        <SpeakerIcon className="w-3 h-3" />
        {label && <span>{label}</span>}
      </button>
      {onUploadClick && (
        <button
          onClick={onUploadClick}
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
          title="오디오 파일 업로드"
        >
          <UploadIcon className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

// --- full: 단어/문장 TTS ---
function FullTts({
  url,
  label,
  generating,
  disabled,
  playing,
  onPlay,
  onGenerate,
  downloadFilename,
  onUploadClick,
}: {
  url?: string;
  label?: string;
  generating: boolean;
  disabled: boolean;
  playing: boolean;
  onPlay: () => void;
  onGenerate?: () => void;
  downloadFilename?: string;
  onUploadClick?: () => void;
}) {
  if (url) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onPlay}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            playing
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
          }`}
          title="재생"
        >
          {playing ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
        </button>
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          {label ?? 'TTS 생성됨'}
        </span>
        {downloadFilename && (
          <a
            href={url}
            download={downloadFilename}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition"
            title="다운로드"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
          </a>
        )}
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition"
            title="오디오 파일 업로드"
          >
            <UploadIcon className="w-3.5 h-3.5" />
          </button>
        )}
        {onGenerate && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onGenerate}
            loading={generating}
            disabled={disabled}
          >
            재생성
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={generating ? 'secondary' : 'ghost'}
        onClick={onGenerate}
        loading={generating}
        disabled={disabled}
      >
        {label ?? 'TTS 생성'}
      </Button>
      {onUploadClick && (
        <button
          onClick={onUploadClick}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-violet-500 hover:border-violet-400 transition-colors"
          title="오디오 파일 업로드"
        >
          <UploadIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// --- icons ---
function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
