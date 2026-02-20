import { useNavigate } from 'react-router-dom';
import type { StorybookSummary } from '@tangobook/shared';

interface StorybookCardProps {
  storybook: StorybookSummary;
  onDelete: (id: string) => void;
}

const ageBadgeColors: Record<string, string> = {
  '4-5': 'bg-green-100 text-green-700',
  '5-7': 'bg-blue-100 text-blue-700',
  '7-8': 'bg-purple-100 text-purple-700',
};

export function StorybookCard({ storybook, onDelete }: StorybookCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/editor/${storybook.id}`)}
    >
      {/* Cover Image */}
      <div className="aspect-[4/3] bg-gradient-to-br from-amber-100 to-orange-100 relative overflow-hidden">
        {storybook.coverImage ? (
          <img
            src={storybook.coverImage}
            alt={storybook.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-amber-300">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
        )}
        {/* Delete button */}
        <button
          className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-slate-800/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/30"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(storybook.id);
          }}
        >
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate mb-2">{storybook.title}</h3>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${ageBadgeColors[storybook.targetAge] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
          >
            {storybook.targetAge}세
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(storybook.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>
    </div>
  );
}
