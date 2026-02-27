import { useCallback, useState } from 'react';
import { getGameEntry } from '../registry';
import type { GameInstance } from '@tangobook/shared';

interface GamePreviewModalProps {
  game: GameInstance;
  onClose: () => void;
}

export function GamePreviewModal({ game, onClose }: GamePreviewModalProps) {
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
          <button onClick={onClose} className="mt-4 text-violet-600 hover:underline">
            닫기
          </button>
        </div>
      </div>
    );
  }

  const PlayerComponent = entry.PlayerComponent;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto p-6 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 z-10"
        >
          ✕
        </button>

        {/* 결과 표시 */}
        {result ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">{result.score === result.maxScore ? '🎉' : '👏'}</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {result.score === result.maxScore ? '완벽해요!' : '잘했어요!'}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
              {result.score} / {result.maxScore} 점
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setResult(null)}
                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
              >
                다시 하기
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
          />
        )}
      </div>
    </div>
  );
}
