import { Button } from '@/components/Button';
import { getGameEntry } from '../registry';
import type { GameInstance, ConnectTheDotsData } from '@tangobook/shared';

interface GameCardProps {
  game: GameInstance;
  onPreview: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}

export function GameCard({ game, onPreview, onEdit, onDelete }: GameCardProps) {
  const entry = getGameEntry(game.gameType);
  const difficultyLabel = { easy: '쉬움', medium: '보통', hard: '어려움' }[game.difficulty];
  const difficultyColor = {
    easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }[game.difficulty];

  // 점잇기: 점이 배치되지 않은 아이템이 있는지 확인
  const needsDotEdit =
    game.gameType === 'connect-the-dots' &&
    (game.data as ConnectTheDotsData).items.some((it) => it.keypoints.length === 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{entry?.icon ?? '🎮'}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {game.title}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor}`}>
                {difficultyLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {entry?.nameKo ?? game.gameType} · {new Date(game.createdAt).toLocaleDateString()}
            </p>
            {needsDotEdit && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                ⚠ 점을 편집해야 플레이할 수 있습니다
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {game.gameType === 'connect-the-dots' && onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              점 편집
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onPreview}>
            미리보기
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600"
          >
            삭제
          </Button>
        </div>
      </div>
    </div>
  );
}
