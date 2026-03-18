import { useState } from 'react';
import type { LongformSubtitleStyle } from '@tangobook/shared';

interface SubtitleStyleModalProps {
  style: LongformSubtitleStyle;
  onSave: (style: LongformSubtitleStyle) => void;
  onClose: () => void;
}

const FONT_SIZES: { value: LongformSubtitleStyle['fontSize']; label: string }[] = [
  { value: 'sm', label: '작게' },
  { value: 'md', label: '보통' },
  { value: 'lg', label: '크게' },
];

const POSITIONS: { value: LongformSubtitleStyle['position']; label: string }[] = [
  { value: 'top', label: '상단' },
  { value: 'center', label: '중앙' },
  { value: 'bottom', label: '하단' },
];

export function SubtitleStyleModal({ style, onSave, onClose }: SubtitleStyleModalProps) {
  const [draft, setDraft] = useState<LongformSubtitleStyle>({ ...style });

  const update = <K extends keyof LongformSubtitleStyle>(
    key: K,
    value: LongformSubtitleStyle[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  // Parse bgColor into hex + opacity
  const bgHex = draft.bgColor.slice(0, 7);
  const bgOpacity = draft.bgColor.length > 7 ? parseInt(draft.bgColor.slice(7), 16) / 255 : 1;

  const handleBgColorChange = (hex: string) => {
    const opacityHex = Math.round(bgOpacity * 255)
      .toString(16)
      .padStart(2, '0');
    update('bgColor', hex + opacityHex);
  };

  const handleBgOpacityChange = (opacity: number) => {
    const opacityHex = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0');
    update('bgColor', bgHex + opacityHex);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">자막 스타일</h3>

        {/* Font size */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            글자 크기
          </label>
          <div className="flex gap-2">
            {FONT_SIZES.map((fs) => (
              <button
                key={fs.value}
                onClick={() => update('fontSize', fs.value)}
                className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${
                  draft.fontSize === fs.value
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {fs.label}
              </button>
            ))}
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            위치
          </label>
          <div className="flex gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos.value}
                onClick={() => update('position', pos.value)}
                className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${
                  draft.position === pos.value
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text color */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 w-20">
            텍스트 색
          </label>
          <input
            type="color"
            value={draft.textColor}
            onChange={(e) => update('textColor', e.target.value)}
            className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
          />
          <span className="text-xs text-slate-500 font-mono">{draft.textColor}</span>
        </div>

        {/* Outline color */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 w-20">
            테두리 색
          </label>
          <input
            type="color"
            value={draft.outlineColor}
            onChange={(e) => update('outlineColor', e.target.value)}
            className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
          />
          <span className="text-xs text-slate-500 font-mono">{draft.outlineColor}</span>
        </div>

        {/* Background color + opacity */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 w-20">
              배경색
            </label>
            <input
              type="color"
              value={bgHex}
              onChange={(e) => handleBgColorChange(e.target.value)}
              className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
            />
            <span className="text-xs text-slate-500 font-mono">{draft.bgColor}</span>
          </div>
          <div className="flex items-center gap-3 pl-[calc(5rem+0.75rem)]">
            <label className="text-xs text-slate-500 dark:text-slate-400">투명도</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={bgOpacity}
              onChange={(e) => handleBgOpacityChange(parseFloat(e.target.value))}
              className="flex-1 h-1 accent-violet-600"
            />
            <span className="text-xs text-slate-500 w-10 text-right">
              {Math.round(bgOpacity * 100)}%
            </span>
          </div>
        </div>

        {/* Preview */}
        <div className="flex justify-center py-3 bg-slate-900 rounded-lg">
          <span
            className={`inline-block px-3 py-1.5 rounded font-medium ${
              draft.fontSize === 'sm'
                ? 'text-sm'
                : draft.fontSize === 'lg'
                  ? 'text-xl'
                  : 'text-base'
            }`}
            style={{
              color: draft.textColor,
              backgroundColor: draft.bgColor,
              WebkitTextStroke: `1px ${draft.outlineColor}`,
              paintOrder: 'stroke fill',
            }}
          >
            자막 미리보기
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
