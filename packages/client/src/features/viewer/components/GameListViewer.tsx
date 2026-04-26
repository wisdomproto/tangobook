import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Storybook, GameInstance, BookGameInstance, ReadingLevel } from '@tangobook/shared';
import { GamePreviewModal } from '@/features/games/components/GamePreviewModal';
import { getGameEntry } from '@/features/games/registry';
import { useGamesList, useRuntimeGame } from '@/features/book-v2';

interface GameListViewerProps {
  storybook: Storybook;
  /** v2 fetch용 (없으면 v1 storybook.games만 사용) */
  bid?: string;
  v2Style?: string;
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
  'korean-line-matching': 'from-pink-400 to-rose-500',
  'english-line-matching': 'from-pink-400 to-rose-500',
};

export function GameListViewer({ storybook, bid, v2Style }: GameListViewerProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentLang = (searchParams.get('lang') as 'ko' | 'en' | null) ?? 'ko';

  // v2 게임 시도. 있으면 v2, 없으면 v1 fallback
  const { data: v2Games } = useGamesList(bid ?? '', { language: currentLang });
  const useV2 = !!bid && (v2Games?.length ?? 0) > 0;

  const v1Games = useMemo(() => {
    return (storybook.games ?? []).filter((g) => {
      const entry = getGameEntry(g.gameType);
      if (!entry?.language) return true;
      return entry.language === currentLang;
    });
  }, [storybook.games, currentLang]);

  const games: (GameInstance | BookGameInstance)[] = useV2 ? (v2Games ?? []) : v1Games;
  const isV2 = useV2;

  const [playingGameId, setPlayingGameId] = useState<string | null>(null);
  const [v1PlayingGame, setV1PlayingGame] = useState<GameInstance | null>(null);

  // v2 게임 클릭 시 — runtime/game fetch (이미지 머지)
  const { data: runtimeGame } = useRuntimeGame(
    bid ?? '',
    isV2 ? playingGameId : null,
    v2Style ?? null
  );

  // v2 머지된 데이터를 v1 GameInstance shape로 조립 (line-matching 우선)
  const v2PlayingGame: GameInstance | null = useMemo(() => {
    if (!runtimeGame) return null;
    const inst = runtimeGame.instance;
    const data = inst.data as { type: string; items?: { word: string; imageUrl: string }[] };
    if (Array.isArray(data.items) && inst.imageRefs?.length) {
      // imageRefs[i] ↔ items[i] (generate에서 같은 순서로 생성)
      const items = data.items.map((item, i) => ({
        ...item,
        imageUrl: runtimeGame.resolvedImages[i]?.url ?? item.imageUrl,
      }));
      return {
        ...inst,
        data: { ...data, items } as GameInstance['data'],
      } as unknown as GameInstance;
    }
    return inst as unknown as GameInstance;
  }, [runtimeGame]);

  const handleClick = (game: GameInstance | BookGameInstance) => {
    if (isV2) {
      setPlayingGameId(game.id);
    } else {
      setV1PlayingGame(game as GameInstance);
    }
  };

  const closePreview = () => {
    setPlayingGameId(null);
    setV1PlayingGame(null);
  };

  const playingGame = isV2 ? v2PlayingGame : v1PlayingGame;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-slate-900 dark:to-slate-900">
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
            {storybook.title} — 학습게임{isV2 && <span className="text-coral-500"> · v2</span>}
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
              const v2Level = (game as BookGameInstance).level as ReadingLevel | undefined;
              const title = (game as { title?: string }).title || entry?.nameKo || game.gameType;
              return (
                <button
                  key={game.id}
                  onClick={() => handleClick(game)}
                  className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 text-left text-white transition-transform hover:scale-[1.03] active:scale-[0.98] bg-gradient-to-br ${gradient}`}
                  style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                >
                  <span className="text-4xl sm:text-5xl mb-3 block">{entry?.icon ?? '🎮'}</span>
                  <span className="text-base sm:text-lg font-bold block">{title}</span>
                  <span className="text-xs sm:text-sm opacity-80 block mt-1">
                    {entry?.descriptionKo ?? game.gameType}
                  </span>
                  {v2Level && (
                    <span className="absolute top-2 right-2 text-[10px] font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded">
                      {v2Level}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {playingGame && <GamePreviewModal game={playingGame} onClose={closePreview} />}
    </div>
  );
}
