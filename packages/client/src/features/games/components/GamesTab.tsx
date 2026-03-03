import { useState, useCallback } from 'react';
import { Button } from '@/components/Button';
import { useGenerateGame } from '../hooks/useGameMutations';
import { GameCard } from './GameCard';
import { GameCreatorModal } from './GameCreatorModal';
import { GamePreviewModal } from './GamePreviewModal';
import { DotEditorModal } from './DotEditorModal';
import type {
  Storybook,
  GameInstance,
  GameDifficulty,
  GameTypeId,
  GameConfig,
  ConnectTheDotsData,
} from '@tangobook/shared';

interface GamesTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function GamesTab({ storybook, onUpdate, onSave }: GamesTabProps) {
  const games = storybook.games ?? [];
  const [showCreator, setShowCreator] = useState(false);
  const [previewGame, setPreviewGame] = useState<GameInstance | null>(null);
  const [editDotGame, setEditDotGame] = useState<GameInstance | null>(null);

  const generateMutation = useGenerateGame();

  const handleGenerate = useCallback(
    (gameType: GameTypeId, title: string, difficulty: GameDifficulty, config: GameConfig) => {
      generateMutation.mutate(
        { storybookId: storybook.id, gameType, config },
        {
          onSuccess: (data) => {
            const newGame: GameInstance = {
              id: crypto.randomUUID(),
              gameType,
              title,
              difficulty,
              createdAt: new Date().toISOString(),
              config,
              data,
            };
            onUpdate((draft) => {
              if (!draft.games) draft.games = [];
              draft.games.push(newGame);
            });
            onSave();
            setShowCreator(false);
          },
        }
      );
    },
    [storybook.id, generateMutation, onUpdate, onSave]
  );

  const handleDelete = useCallback(
    (gameId: string) => {
      if (!confirm('이 게임을 삭제하시겠습니까?')) return;
      onUpdate((draft) => {
        draft.games = (draft.games ?? []).filter((g) => g.id !== gameId);
      });
      onSave();
    },
    [onUpdate, onSave]
  );

  // 점잇기 편집 저장
  const handleDotSave = useCallback(
    (updatedData: ConnectTheDotsData) => {
      if (!editDotGame) return;
      onUpdate((draft) => {
        const target = (draft.games ?? []).find((g) => g.id === editDotGame.id);
        if (target) target.data = updatedData;
      });
      onSave();
      setEditDotGame(null);
    },
    [editDotGame, onUpdate, onSave]
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          학습게임 ({games.length}개)
        </h2>
        <Button size="sm" onClick={() => setShowCreator(true)}>
          + 게임 추가
        </Button>
      </div>

      {/* 게임 목록 */}
      {games.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎮</div>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
            아직 만든 학습게임이 없어요.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setShowCreator(true)}>
            첫 게임 만들기
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onPreview={() => setPreviewGame(game)}
              onEdit={game.gameType === 'connect-the-dots' ? () => setEditDotGame(game) : undefined}
              onDelete={() => handleDelete(game.id)}
            />
          ))}
        </div>
      )}

      {/* 에러 */}
      {generateMutation.isError && (
        <p className="text-sm text-red-500">{generateMutation.error.message}</p>
      )}

      {/* 생성 모달 */}
      {showCreator && (
        <GameCreatorModal
          storybook={storybook}
          onGenerate={handleGenerate}
          onClose={() => setShowCreator(false)}
          isGenerating={generateMutation.isPending}
        />
      )}

      {/* 미리보기 모달 */}
      {previewGame && (
        <GamePreviewModal
          game={previewGame}
          storybook={storybook}
          onClose={() => setPreviewGame(null)}
        />
      )}

      {/* 점잇기 편집 모달 */}
      {editDotGame && (
        <DotEditorModal
          game={editDotGame}
          onSave={handleDotSave}
          onClose={() => setEditDotGame(null)}
        />
      )}
    </div>
  );
}
