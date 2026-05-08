import { useState } from 'react';
import type { Storybook } from '@tangobook/shared';

interface Props {
  storybook: Storybook;
  /** (그림체, activeLang) cell 이미 있는 그림체 */
  takenStyles: string[];
  defaultStyle?: string;
  activeLang: string;
  onClose: () => void;
  onConfirm: (artStyle: string) => void;
}

export function AddLongformProjectModal({
  storybook,
  takenStyles,
  defaultStyle,
  activeLang,
  onClose,
  onConfirm,
}: Props) {
  const availableStyles =
    storybook.availableStyles ?? (storybook.artStyle ? [storybook.artStyle] : []);

  const initial =
    defaultStyle && !takenStyles.includes(defaultStyle)
      ? defaultStyle
      : (availableStyles.find((s) => !takenStyles.includes(s)) ?? availableStyles[0] ?? '');

  const [style, setStyle] = useState(initial);

  const isStyleTaken = takenStyles.includes(style);
  const canSubmit = !!style && !isStyleTaken;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">+ 새 동영상</h3>
          <span className="text-xs text-slate-500">
            언어: <strong>{activeLang}</strong> (상단 언어 chip)
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            그림체
          </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800 dark:text-slate-100"
          >
            {availableStyles.length === 0 && <option value="">(/editor2 에서 그림체 추가)</option>}
            {availableStyles.map((s) => {
              const taken = takenStyles.includes(s);
              return (
                <option key={s} value={s} disabled={taken}>
                  {s}
                  {taken ? ` (${activeLang} 영상 이미 있음)` : ''}
                </option>
              );
            })}
          </select>
          {isStyleTaken && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              이 그림체의 {activeLang} 영상은 이미 있어요. 그림체 그룹 펼치면 보입니다.
            </p>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          같은 그림체의 다른 언어 영상이 있으면 비디오 클립이 자동 복제됩니다.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(style)}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-500 text-white rounded font-bold"
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  );
}
