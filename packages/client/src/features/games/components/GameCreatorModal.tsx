import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/Button';
import { getGamesForContext, groupGamesByCategory } from '../registry';
import type { GameRegistryEntry } from '../registry';
import type { Storybook, GameConfig, GameDifficulty, GameTypeId } from '@tangobook/shared';

interface GameCreatorModalProps {
  storybook: Storybook;
  onGenerate: (
    gameType: GameTypeId,
    title: string,
    difficulty: GameDifficulty,
    config: GameConfig
  ) => void;
  onClose: () => void;
  isGenerating: boolean;
}

type Step = 'select-type' | 'configure';

export function GameCreatorModal({
  storybook,
  onGenerate,
  onClose,
  isGenerating,
}: GameCreatorModalProps) {
  const [step, setStep] = useState<Step>('select-type');
  const [selectedEntry, setSelectedEntry] = useState<GameRegistryEntry | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');

  const storybookType = storybook.type ?? 'storybook';
  const availableGames = useMemo(
    () =>
      getGamesForContext(
        storybookType,
        storybook.phonicsConfig?.language,
        storybook.phonicsConfig?.level
      ),
    [storybookType, storybook.phonicsConfig?.language, storybook.phonicsConfig?.level]
  );
  const groupedGames = useMemo(() => groupGamesByCategory(availableGames), [availableGames]);

  const handleSelectType = useCallback((entry: GameRegistryEntry) => {
    setSelectedEntry(entry);
    setConfig({ ...entry.defaultConfig });
    setTitle(`${entry.nameKo}`);
    setStep('configure');
  }, []);

  const handleGenerate = useCallback(() => {
    if (!selectedEntry || !config) return;
    onGenerate(selectedEntry.id, title, difficulty, config);
  }, [selectedEntry, config, title, difficulty, onGenerate]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {step === 'select-type' ? '게임 타입 선택' : '게임 설정'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {step === 'select-type' ? (
            <div className="space-y-5">
              {groupedGames.map((group) => (
                <div key={group.category}>
                  {groupedGames.length > 1 && (
                    <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
                      {group.label}
                    </h3>
                  )}
                  <div className="space-y-2">
                    {group.games.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => handleSelectType(entry)}
                        className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{entry.icon}</span>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {entry.nameKo}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {entry.descriptionKo}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {availableGames.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">
                  사용 가능한 게임 타입이 없습니다.
                </p>
              )}
            </div>
          ) : selectedEntry && config ? (
            <div className="space-y-5">
              {/* 뒤로가기 */}
              <button
                onClick={() => setStep('select-type')}
                className="text-sm text-violet-600 hover:underline"
              >
                ← 게임 타입 다시 선택
              </button>

              {/* 게임 제목 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  게임 제목
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* 난이도 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  난이도
                </label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                        difficulty === d
                          ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {{ easy: '쉬움', medium: '보통', hard: '어려움' }[d]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 게임별 설정 패널 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  게임 설정
                </label>
                <selectedEntry.ConfigPanel
                  storybook={storybook}
                  config={config}
                  onChange={setConfig}
                />
              </div>

              {/* 생성 버튼 */}
              <Button
                className="w-full"
                onClick={handleGenerate}
                loading={isGenerating}
                disabled={!title.trim()}
              >
                게임 생성
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
