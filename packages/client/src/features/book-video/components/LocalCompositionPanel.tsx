import { useEffect, useRef, useState } from 'react';
import type { BookVideoFile, BookVideoFormat, BookVideoLanguage } from '@tangobook/shared';
import { composeVideoLocally } from '../utils/local-compositor';

export function LocalCompositionPanel({
  original,
  track,
  format,
  language,
  bookId,
  disabled,
  onBusy,
  onUse,
}: {
  original?: BookVideoFile;
  track: BookVideoLanguage;
  format: BookVideoFormat;
  language: string;
  bookId: string;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  onUse: (file: File) => Promise<void>;
}) {
  const [burn, setBurn] = useState(true);
  const [mix, setMix] = useState(false);
  const [fontSize, setFontSize] = useState(format === 'long' ? 88 : 80);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    []
  );
  useEffect(() => {
    setResult(null);
  }, [original?.key, track.narration?.key, track.subtitleSrt, burn, mix, fontSize]);
  useEffect(() => {
    if (!result) {
      setUrl('');
      return;
    }
    const preview = URL.createObjectURL(result);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [result]);
  async function render() {
    if (!original) return;
    const abort = new AbortController();
    controller.current = abort;
    setRunning(true);
    onBusy(true);
    setError('');
    setResult(null);
    try {
      const file = await composeVideoLocally(
        {
          original,
          narration: track.narration,
          subtitleSrt: track.subtitleSrt,
          burnSubtitles: burn,
          mixOriginalAudio: mix,
          fontSize,
          format,
          name: `${bookId}-${format}-${language}.mp4`,
        },
        abort.signal,
        setMessage
      );
      setResult(file);
      setMessage('합성을 완료했습니다. 미리보기 후 완성 영상으로 적용해 주세요.');
    } catch (e) {
      setError((e as Error).message);
      setMessage('');
    } finally {
      controller.current = null;
      setRunning(false);
      onBusy(false);
    }
  }
  return (
    <div className="space-y-4 rounded-xl border bg-white p-5 dark:bg-slate-800">
      <div>
        <h3 className="font-bold">내 컴퓨터에서 영상 합성</h3>
        <p className="mt-2 text-sm text-slate-500">
          공통 원본에 현재 언어의 나레이션 음원과 자막을 합칩니다. 합성 작업은 이 컴퓨터에서
          진행하며, 결과를 확인한 후 업로드합니다.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={burn}
            disabled={disabled}
            onChange={(e) => setBurn(e.target.checked)}
          />
          영상에 자막 입히기
        </label>
        <label className="flex items-center gap-2">
          자막 크기{' '}
          <input
            aria-label="합성 자막 크기"
            type="number"
            min={20}
            max={160}
            value={fontSize}
            disabled={disabled}
            className="w-20 rounded-lg border p-2 dark:bg-slate-800"
            onChange={(e) => setFontSize(Math.max(20, Math.min(160, Number(e.target.value) || 20)))}
          />
          px
        </label>
        {track.narration && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={mix}
              disabled={disabled}
              onChange={(e) => setMix(e.target.checked)}
            />
            원본 소리와 나레이션 함께 사용
          </label>
        )}
      </div>
      <p className="text-xs text-slate-500">
        {track.narration
          ? mix
            ? '원본의 배경음·효과음에 나레이션을 더합니다.'
            : '원본 소리를 현재 언어의 나레이션으로 교체합니다.'
          : '나레이션 음원이 없으면 원본 소리를 유지합니다.'}{' '}
        자막 크기는 롱폼 1080p·숏폼 가로 1080px 기준으로 적용합니다. 합성 원본은 512MB 이하로 선택해
        주세요.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={
            disabled || !original || (!track.narration && !(burn && track.subtitleSrt.trim()))
          }
          onClick={render}
        >
          원본 + 나레이션·자막 합성
        </button>
        {running && (
          <button
            className="rounded-lg border px-4 py-2 text-sm"
            onClick={() => controller.current?.abort()}
          >
            합성 취소
          </button>
        )}
      </div>
      {!original && (
        <p className="text-sm text-slate-500">공통 원본 영상을 먼저 업로드해 주세요.</p>
      )}
      {message && (
        <p role="status" className="text-sm text-violet-600">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {result && url && (
        <div className="space-y-3">
          <video
            src={url}
            controls
            playsInline
            className="mx-auto max-h-[480px] max-w-full rounded-lg bg-black"
          />
          <div className="flex flex-wrap gap-3">
            <a href={url} download={result.name} className="rounded-lg border px-4 py-2 text-sm">
              합성 영상 다운로드
            </a>
            <button
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={disabled}
              onClick={() => onUse(result)}
            >
              이 언어의 완성 영상으로 적용
            </button>
          </div>
          <p className="text-xs text-slate-500">
            적용하면 파일이 업로드됩니다. 이어서 ‘영상 자료 저장’을 눌러 보관하고 마케팅에 등록할 수
            있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
