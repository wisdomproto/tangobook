import type { LongformProject } from '@tangobook/shared';

interface LongformProjectHeaderProps {
  project: LongformProject;
  onUpdate: (updates: Partial<Omit<LongformProject, 'id'>>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  duplicateLabel?: string;
}

const ASPECT_RATIO_LABELS: Record<LongformProject['aspectRatio'], string> = {
  '16:9': '16:9',
  '9:16': '9:16',
  '1:1': '1:1',
};

export function LongformProjectHeader({
  project,
  onUpdate,
  onDelete,
  onDuplicate,
  duplicateLabel = '복사',
}: LongformProjectHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 min-w-0">
        <input
          type="text"
          value={project.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors min-w-0 truncate"
          aria-label="프로젝트 이름"
        />
        <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
          {ASPECT_RATIO_LABELS[project.aspectRatio] ?? project.aspectRatio}
        </span>
        <span className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">
          {project.scenes.length}개 씬
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Duplicate button */}
        <button
          onClick={onDuplicate}
          className="flex-shrink-0 p-1.5 text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors rounded"
          title={duplicateLabel}
          aria-label={duplicateLabel}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="flex-shrink-0 p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded"
          title="프로젝트 삭제"
          aria-label="프로젝트 삭제"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
