import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { bookV2Api } from '../api/book-v2.api';
import type { BookManifest, ReadingLevel } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface AudiobookRenderModalProps {
  manifest: BookManifest;
  open: boolean;
  onClose: () => void;
}

export function AudiobookRenderModal({ manifest, open, onClose }: AudiobookRenderModalProps) {
  const v = manifest.usedVariants;
  const [level, setLevel] = useState<ReadingLevel | ''>(v.levels[0] ?? '');
  const [language, setLanguage] = useState<string>(v.languages[0] ?? 'ko');
  const [style, setStyle] = useState<string>(v.styles[0] ?? '');

  const start = useMutation({
    mutationFn: () =>
      bookV2Api.startAudiobookRender(manifest.id, {
        level: level as ReadingLevel,
        language,
        style,
      }),
  });

  if (!open) return null;

  const canStart = level && language && style && !start.isPending;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-md shadow-xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-ink-900 font-display">🎬 오디오북 렌더</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 text-xl">
            ×
          </button>
        </div>
        <p className="text-xs text-ink-500 font-bold">렌더할 (레벨 / 언어 / 그림체) 조합 선택</p>

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
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input">
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

        {start.isSuccess && (
          <div className="bg-success/10 border border-success/30 rounded-md p-3 text-xs text-success font-bold">
            ✓ 렌더 시작 (taskId: {start.data.taskId})
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
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
        </div>

        <p className="text-[10px] text-ink-300 leading-relaxed">
          ⚠️ 현재는 입력 검증만 (Phase 3b-7b-i). 실제 Remotion 렌더는 다음 sprint(3b-7b-ii)에서
          구현됩니다.
        </p>

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
