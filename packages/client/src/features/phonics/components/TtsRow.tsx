import { TtsControl } from '@/components/TtsControl';

const TAG_COLORS: Record<string, string> = {
  amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
  violet: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
};

interface TtsRowProps {
  label: string;
  tag: string;
  color: string;
  url?: string;
  generating: boolean;
  disabled: boolean;
  downloadFilename: string;
  onGenerate: () => void;
  onUpload?: (file: File) => void;
  editableText?: string;
  onTextChange?: (text: string) => void;
}

export function TtsRow({
  label,
  tag,
  color,
  url,
  generating,
  disabled,
  downloadFilename,
  onGenerate,
  onUpload,
  editableText,
  onTextChange,
}: TtsRowProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/30">
      <span
        className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${TAG_COLORS[color] ?? TAG_COLORS.violet}`}
      >
        {tag}
      </span>
      {!(editableText !== undefined && onTextChange) && (
        <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 min-w-[3rem] truncate">
          {label}
        </span>
      )}
      {editableText !== undefined && onTextChange && (
        <input
          type="text"
          value={editableText}
          onChange={(e) => onTextChange(e.target.value)}
          className="flex-1 min-w-0 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-300 dark:focus:ring-violet-600"
          placeholder="TTS 텍스트"
        />
      )}
      <div className="ml-auto shrink-0">
        <TtsControl
          url={url}
          generating={generating}
          disabled={disabled}
          label={url ? '생성됨' : 'TTS 생성'}
          downloadFilename={url ? downloadFilename : undefined}
          onGenerate={onGenerate}
          onUpload={onUpload}
        />
      </div>
    </div>
  );
}
