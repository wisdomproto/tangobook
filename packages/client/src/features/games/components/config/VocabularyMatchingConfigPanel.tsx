import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { VocabularyMatchingConfig } from '@tangobook/shared';

export function VocabularyMatchingConfigPanel({ config, onChange }: GameConfigPanelProps) {
  const c = config as VocabularyMatchingConfig;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          매칭 쌍 수
        </label>
        <div className="flex gap-2">
          {[4, 6, 8].map((n) => (
            <button
              key={n}
              onClick={() => onChange({ ...c, itemCount: n })}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                c.itemCount === n
                  ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {n}쌍
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={c.includeKeyObjects}
            onChange={(e) => onChange({ ...c, includeKeyObjects: e.target.checked })}
            className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          핵심사물 이미지 포함
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={c.includeCharacters}
            onChange={(e) => onChange({ ...c, includeCharacters: e.target.checked })}
            className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          캐릭터 이미지 포함
        </label>
      </div>
    </div>
  );
}
