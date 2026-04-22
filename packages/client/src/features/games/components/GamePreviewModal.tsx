import { useCallback, useState } from 'react';
import { getGameEntry } from '../registry';
import type { GameInstance, Storybook } from '@tangobook/shared';
import { NatureBg, NATURE_BG_GRADIENT } from '@/features/viewer/components/Viewer3DKit';

interface GamePreviewModalProps {
  game: GameInstance;
  storybook?: Storybook;
  onClose: () => void;
}

export function GamePreviewModal({ game, storybook, onClose }: GamePreviewModalProps) {
  const entry = getGameEntry(game.gameType);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const handleComplete = useCallback((score: number, maxScore: number) => {
    setResult({ score, maxScore });
  }, []);

  if (!entry) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-600 dark:text-slate-300">지원하지 않는 게임 타입입니다.</p>
          <button onClick={onClose} className="mt-4 text-coral-500 hover:underline">
            닫기
          </button>
        </div>
      </div>
    );
  }

  const PlayerComponent = entry.PlayerComponent;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2">
      <div
        className="rounded-2xl w-full h-full max-h-[98vh] overflow-auto p-8 relative"
        style={{ background: NATURE_BG_GRADIENT }}
      >
        <NatureBg />
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/40 text-ink-700 z-20"
        >
          ✕
        </button>

        {/* 결과 표시 */}
        <div className="relative z-10 min-h-full">
          {result ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">{result.score === result.maxScore ? '🎉' : '👏'}</div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-slate-100 mb-2">
                {result.score === result.maxScore ? '완벽해요!' : '잘했어요!'}
              </h2>
              <p className="text-lg text-ink-700 dark:text-slate-300 mb-6">
                {result.score} / {result.maxScore} 점
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setResult(null)}
                  className="px-6 py-2.5 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors"
                >
                  다시 하기
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-white/70 text-ink-700 rounded-xl hover:bg-white/90 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          ) : (
            <PlayerComponent
              gameData={game.data}
              difficulty={game.difficulty}
              onComplete={handleComplete}
              onBack={onClose}
              systemSounds={storybook?.systemSounds}
            />
          )}
        </div>
      </div>
    </div>
  );
}
