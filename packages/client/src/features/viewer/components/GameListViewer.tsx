import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Storybook, GameInstance } from '@tangobook/shared';
import { GamePreviewModal } from '@/features/games/components/GamePreviewModal';
import { getGameEntry } from '@/features/games/registry';

interface GameListViewerProps {
  storybook: Storybook;
}

const GRADIENTS: Record<string, string> = {
  'letter-sound': 'from-emerald-400 to-teal-500',
  'word-listening': 'from-sky-400 to-blue-500',
  'vocabulary-matching': 'from-violet-400 to-purple-500',
  'word-writing': 'from-amber-400 to-orange-500',
  'word-quiz': 'from-rose-400 to-pink-500',
  'connect-the-dots': 'from-lime-400 to-green-500',
  'picture-sequence': 'from-cyan-400 to-teal-500',
  'odd-one-out': 'from-fuchsia-400 to-purple-500',
  'word-image-matching': 'from-amber-400 to-orange-500',
  'blending-listening': 'from-indigo-400 to-violet-500',
  'korean-block': 'from-yellow-400 to-amber-500',
};

export function GameListViewer({ storybook }: GameListViewerProps) {
  const navigate = useNavigate();
  const games = storybook.games ?? [];
  const [playingGame, setPlayingGame] = useState<GameInstance | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-slate-900 dark:to-slate-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/library')}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
            {storybook.title} — 학습게임
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {games.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="text-5xl mb-4">🎮</div>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
              학습게임이 없습니다
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              저작도구에서 게임을 생성해주세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {games.map((game) => {
              const entry = getGameEntry(game.gameType);
              const gradient = GRADIENTS[game.gameType] ?? 'from-emerald-400 to-teal-500';
              return (
                <button
                  key={game.id}
                  onClick={() => setPlayingGame(game)}
                  className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 text-left text-white transition-transform hover:scale-[1.03] active:scale-[0.98] bg-gradient-to-br ${gradient}`}
                  style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                >
                  <span className="text-4xl sm:text-5xl mb-3 block">{entry?.icon ?? '🎮'}</span>
                  <span className="text-base sm:text-lg font-bold block">
                    {game.title || entry?.nameKo || game.gameType}
                  </span>
                  <span className="text-xs sm:text-sm opacity-80 block mt-1">
                    {entry?.descriptionKo ?? game.gameType}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {playingGame && <GamePreviewModal game={playingGame} onClose={() => setPlayingGame(null)} />}
    </div>
  );
}
