import { useState } from 'react';
import { useCreateLongform } from '../hooks/useLongform';
import type { BookManifest, ReadingLevel } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface CreateLongformModalProps {
  manifest: BookManifest;
  open: boolean;
  onClose: () => void;
}

export function CreateLongformModal({ manifest, open, onClose }: CreateLongformModalProps) {
  const v = manifest.usedVariants;
  const [level, setLevel] = useState<ReadingLevel | ''>(v.levels[0] ?? '');
  const [language, setLanguage] = useState<string>(v.languages[0] ?? 'ko');
  const [style, setStyle] = useState<string>(v.styles[0] ?? '');
  const create = useCreateLongform(manifest.id);

  if (!open) return null;

  const canCreate = level && language && style && !create.isPending;

  const handleCreate = () => {
    if (!canCreate) return;
    create.mutate(
      { level: level as ReadingLevel, language, style },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    if (create.isPending) return;
    create.reset();
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
          <h2 className="text-lg font-black text-ink-900 font-display">🎬 새 동영상 프로젝트</h2>
          <button
            onClick={handleClose}
            disabled={create.isPending}
            className={cn(
              'text-xl',
              create.isPending
                ? 'text-ink-300 cursor-not-allowed'
                : 'text-ink-500 hover:text-ink-900'
            )}
          >
            ×
          </button>
        </div>
        <p className="text-xs text-ink-500 font-bold">
          만들 동영상의 (레벨 / 언어 / 그림체) 조합 선택. 각 조합당 여러 프로젝트 생성 가능.
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

        {create.isError && (
          <div className="bg-warn/10 border border-warn/30 rounded-md p-3 text-xs text-ink-700 font-bold whitespace-pre-line">
            {(create.error as Error).message}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleClose}
            disabled={create.isPending}
            className={cn(
              'px-4 py-2 rounded-md font-bold text-sm',
              create.isPending
                ? 'bg-ink-100 text-ink-300 cursor-not-allowed'
                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            )}
          >
            닫기
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className={cn(
              'px-5 py-2 rounded-md font-black text-sm transition-all',
              canCreate
                ? 'bg-coral-500 text-white shadow-pop hover:brightness-110'
                : 'bg-ink-100 text-ink-300 cursor-not-allowed'
            )}
          >
            {create.isPending ? '생성 중...' : '+ 만들기'}
          </button>
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
