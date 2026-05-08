import { useState, useEffect } from 'react';
import type { Storybook } from '@tangobook/shared';

interface Props {
  storybook: Storybook;
  /** 같은 그림체 master 중복 방지: 이미 master 있는 그림체 id 들. */
  takenStyles: string[];
  /** Default 그림체 (외부 chip 활성 또는 storybook.artStyle). */
  defaultStyle?: string;
  defaultLang?: string;
  onClose: () => void;
  onConfirm: (artStyle: string, lang: string, name: string) => void;
}

export function AddLongformProjectModal({
  storybook,
  takenStyles,
  defaultStyle,
  defaultLang = 'ko',
  onClose,
  onConfirm,
}: Props) {
  const availableStyles =
    storybook.availableStyles ?? (storybook.artStyle ? [storybook.artStyle] : []);

  const initialStyle =
    defaultStyle && !takenStyles.includes(defaultStyle)
      ? defaultStyle
      : (availableStyles.find((s) => !takenStyles.includes(s)) ?? availableStyles[0] ?? '');

  const [style, setStyle] = useState(initialStyle);
  const [lang, setLang] = useState(defaultLang);
  const [name, setName] = useState('');

  useEffect(() => {
    setName(style ? `새 동영상 (${style})` : '새 동영상');
  }, [style]);

  const langs = storybook.languages?.length ? storybook.languages : ['ko'];
  const isStyleTaken = takenStyles.includes(style);
  const canSubmit = !!style && !isStyleTaken && name.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">+ 새 동영상</h3>

        {/* 그림체 select */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            그림체
          </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800 dark:text-slate-100"
          >
            {availableStyles.length === 0 && (
              <option value="">(그림체 없음 — /editor2 에서 추가하세요)</option>
            )}
            {availableStyles.map((s) => {
              const taken = takenStyles.includes(s);
              return (
                <option key={s} value={s} disabled={taken}>
                  {s}
                  {taken ? ' (이미 영상 있음)' : ''}
                </option>
              );
            })}
          </select>
          {isStyleTaken && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              이 그림체 영상은 이미 있어요. 그룹에서 "버전 추가" 로 다른 언어를 추가하세요.
            </p>
          )}
        </div>

        {/* 언어 select */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            언어
          </label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800 dark:text-slate-100"
          >
            {langs.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* 이름 */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            이름
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(style, lang, name)}
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
